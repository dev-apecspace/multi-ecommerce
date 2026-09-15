# Local payment-proof OCR

The Next.js payment-proof route calls `payment_proof_ocr.py` locally. It does not use a paid API or API key.

## Setup (CPU)

Use Python 3.9–3.11, then run:

```powershell
py -3.11 -m venv .venv-ocr
.\.venv-ocr\Scripts\Activate.ps1
python -m pip install -r src\api\requirements.txt
```

Set `PYTHON_BIN` in `.env` to the virtual environment interpreter, for example:

```dotenv
PYTHON_BIN=D:\CODE WEB\multi-ecommerce\.venv-ocr\Scripts\python.exe
```

Restart the Next.js server after changing `.env`.

The first OCR request downloads local PaddleOCR models. OCR screening is advisory only; sellers must still verify actual account transactions before approving an order.
