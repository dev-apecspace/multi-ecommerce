import { spawn } from 'child_process'
import path from 'path'

export type PaymentProofVerificationStatus = 'verified' | 'review' | 'rejected' | 'unavailable' | 'error'

export interface PaymentProofVerification {
  status: PaymentProofVerificationStatus
  reason: string
  isTransactionProof?: boolean
  amount?: number | null
  transferContent?: string | null
  transactionAt?: string | null
  checks?: { amount: boolean; content: boolean; time: boolean }
  raw?: unknown
}

const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '')

// Keep payment proof uploads available while OCR is temporarily disabled for testing.
export const isPaymentProofOcrEnabled = () => process.env.PAYMENT_PROOF_OCR_ENABLED !== 'false'

const runLocalOcr = (payload: Record<string, unknown>) => new Promise<any>((resolve, reject) => {
  const python = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'py' : 'python3')
  const args = process.env.PYTHON_BIN ? [] : process.platform === 'win32' ? ['-3.11'] : []
  args.push(path.join(process.cwd(), 'src', 'api', 'payment_proof_ocr.py'))
  const child = spawn(python, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
  child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
  child.on('error', reject)
  child.on('close', () => {
    try { resolve(JSON.parse(stdout.trim())) } catch { reject(new Error(stderr || 'OCR worker returned invalid JSON')) }
  })
  child.stdin.end(JSON.stringify(payload))
})

export async function verifyPaymentProof(input: {
  buffer: Buffer
  mimeType: string
  amount: number
  orderNumber: string
  orderCreatedAt: string
  submittedAt: Date
}): Promise<PaymentProofVerification> {
  if (!isPaymentProofOcrEnabled()) {
    return {
      status: 'review',
      reason: 'Ảnh đã được gửi để shop đối soát thủ công.',
    }
  }

  try {
    const extracted = await runLocalOcr({ imageBase64: input.buffer.toString('base64'), mimeType: input.mimeType, amount: input.amount, orderNumber: input.orderNumber })
    if (!extracted.available) return { status: 'unavailable', reason: 'Hệ thống kiểm tra ảnh đang tạm thời không sẵn sàng. Vui lòng thử lại sau hoặc gửi ảnh rõ nét để shop đối soát.', raw: extracted }
    const amount = typeof extracted.amount === 'number' ? extracted.amount : null
    const content = typeof extracted.transferContent === 'string' ? extracted.transferContent : null
    const transactionAt = typeof extracted.transactionAt === 'string' ? extracted.transactionAt : null
    const amountMatches = amount !== null && Math.round(amount) === Math.round(input.amount)
    const contentMatches = Boolean(content && normalize(content).includes(normalize(input.orderNumber)))
    const createdAt = new Date(input.orderCreatedAt).getTime()
    const submittedAt = input.submittedAt.getTime()
    const transactionTime = transactionAt ? new Date(transactionAt).getTime() : NaN
    const timeMatches = Number.isFinite(transactionTime) && transactionTime >= createdAt && transactionTime <= submittedAt + 5 * 60_000 && transactionTime <= createdAt + 48 * 60 * 60_000
    const isTransactionProof = extracted.isTransactionProof === true
    const checks = { amount: amountMatches, content: contentMatches, time: timeMatches }
    // A readable mismatch is evidence that this proof belongs to another payment.
    // Only an unreadable/missing field may proceed to manual review.
    const hasReadableMismatch = isTransactionProof && (
      !amountMatches ||
      !contentMatches ||
      (transactionAt !== null && !timeMatches)
    )
    const status: PaymentProofVerificationStatus = isTransactionProof && amountMatches && contentMatches && timeMatches
      ? 'verified'
      : hasReadableMismatch
        ? 'rejected'
        : 'review'
    const mismatchReason = [
      !amountMatches ? 'Số tiền trên ảnh không khớp với số tiền của đơn hàng.' : null,
      !contentMatches ? 'Nội dung chuyển khoản không khớp với mã đơn hàng.' : null,
      transactionAt !== null && !timeMatches ? 'Thời gian giao dịch không hợp lệ cho đơn hàng này.' : null,
    ].filter(Boolean).join(' ')
    const reason = status === 'verified'
      ? 'Ảnh khớp số tiền, mã đơn và thời gian giao dịch.'
      : status === 'rejected'
        ? hasReadableMismatch
          ? mismatchReason
          : 'Ảnh không phải là ảnh giao dịch hợp lệ của ngân hàng.'
        : 'Ảnh chưa đọc rõ đủ thông tin; shop sẽ đối soát thủ công sau khi bạn gửi.'
    return { status, reason, isTransactionProof, amount, transferContent: content, transactionAt, checks, raw: extracted }
  } catch (error) {
    console.error('Payment proof verification error:', error)
    return { status: 'error', reason: 'Không thể kiểm tra ảnh lúc này. Vui lòng thử lại sau hoặc gửi ảnh rõ nét để shop đối soát.' }
  }
}
