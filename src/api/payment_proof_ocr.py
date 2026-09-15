"""Local, free OCR worker for payment-proof screening.

Reads one JSON request from stdin and writes one JSON response to stdout.
Install dependencies from src/api/requirements.txt in a Python 3.9-3.11 venv.
"""
import base64
import json
import re
import sys
import tempfile
import unicodedata
from datetime import datetime
from pathlib import Path


def normalized(value: str) -> str:
    ascii_value = unicodedata.normalize("NFD", value or "").encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^A-Z0-9]", "", ascii_value.upper())


def extract_amount(text: str, expected: int):
    candidates = []
    for value in re.findall(r"(?:VND|VNĐ|đ|₫)?\s*([0-9][0-9.,\s]{2,})", text, flags=re.I):
        digits = re.sub(r"\D", "", value)
        if digits:
            candidates.append(int(digits))
    return expected if expected in candidates else (candidates[0] if candidates else None)


def extract_datetime(text: str):
    patterns = [
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{4})\D{0,12}(\d{1,2}:\d{2}(?::\d{2})?)",
        r"(\d{1,2}:\d{2}(?::\d{2})?)\D{0,12}(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
    ]
    for index, pattern in enumerate(patterns):
        match = re.search(pattern, text)
        if not match:
            continue
        date_value, time_value = match.groups() if index == 0 else (match.group(2), match.group(1))
        for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M:%S", "%d-%m-%Y %H:%M"):
            try:
                return datetime.strptime(f"{date_value} {time_value}", fmt).isoformat()
            except ValueError:
                pass
    return None


def main():
    request = json.loads(sys.stdin.read())
    image_bytes = base64.b64decode(request["imageBase64"])
    suffix = ".png" if request.get("mimeType") == "image/png" else ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as image_file:
        image_file.write(image_bytes)
        image_path = image_file.name

    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        result = ocr.ocr(image_path, cls=True)
        lines = []
        for page in result or []:
            for line in page or []:
                if len(line) > 1 and line[1]:
                    lines.append(str(line[1][0]))
        text = "\n".join(lines)
        expected_amount = int(round(float(request["amount"])))
        amount = extract_amount(text, expected_amount)
        order_number = request["orderNumber"]
        content_matches = normalized(order_number) in normalized(text)
        transaction_at = extract_datetime(text)
        # Banking apps use very different wording and fonts. Once OCR can read
        # text, let the amount/reference/time rules decide validity instead of
        # rejecting the screenshot by a brittle keyword heuristic.
        is_transaction_proof = bool(normalized(text))
        response = {
            "available": True,
            "isTransactionProof": is_transaction_proof,
            "amount": amount,
            "transferContent": order_number if content_matches else None,
            "transactionAt": transaction_at,
            "ocrText": text[:5000],
        }
        print(json.dumps(response, ensure_ascii=False))
    finally:
        Path(image_path).unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"available": False, "error": str(error)}))
        sys.exit(1)
