CREATE TABLE IF NOT EXISTS "ComplaintCase" (
  id BIGSERIAL PRIMARY KEY,
  "submitterUserId" INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  "caseCode" TEXT NOT NULL UNIQUE,
  "submitterName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  "evidenceUrls" TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','accepted','processing','resolved','rejected','cancelled')),
  "resolution" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "submitterUserId" INTEGER REFERENCES "User"(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "ComplaintCase_submitterUserId_createdAt_idx" ON "ComplaintCase"("submitterUserId", "createdAt" DESC);
CREATE TABLE IF NOT EXISTS "ComplaintCaseEvent" (
  id BIGSERIAL PRIMARY KEY,
  "caseId" BIGINT NOT NULL REFERENCES "ComplaintCase"(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "evidenceNames" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "customerReplyDeadline" TIMESTAMPTZ;
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "customerRating" INTEGER CHECK ("customerRating" BETWEEN 1 AND 5);
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "customerFeedback" TEXT;
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "ratedAt" TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS "ComplaintCategory" (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  "groupName" TEXT NOT NULL DEFAULT 'general',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "categoryId" BIGINT REFERENCES "ComplaintCategory"(id) ON DELETE SET NULL;
ALTER TABLE "ComplaintCase" ADD COLUMN IF NOT EXISTS "categoryName" TEXT;
CREATE TABLE IF NOT EXISTS "ComplaintMessage" (
  id BIGSERIAL PRIMARY KEY,
  "caseId" BIGINT NOT NULL REFERENCES "ComplaintCase"(id) ON DELETE CASCADE,
  "senderUserId" INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  "senderRole" TEXT NOT NULL CHECK ("senderRole" IN ('customer','admin')),
  "senderName" TEXT NOT NULL,
  message TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE "ComplaintMessage" ADD COLUMN IF NOT EXISTS "evidenceUrls" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "ComplaintMessage" ADD COLUMN IF NOT EXISTS "evidenceNames" TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS "ComplaintMessage_caseId_createdAt_idx" ON "ComplaintMessage"("caseId", "createdAt");
ALTER TABLE "ComplaintCase" DROP CONSTRAINT IF EXISTS "ComplaintCase_status_check";
UPDATE "ComplaintCase"
SET status = CASE status
  WHEN 'reviewing' THEN 'accepted'
  WHEN 'waiting_user' THEN 'processing'
  WHEN 'waiting_staff' THEN 'processing'
  WHEN 'closed' THEN 'cancelled'
  ELSE status
END
WHERE status IN ('reviewing','waiting_user','waiting_staff','closed');
UPDATE "ComplaintCaseEvent"
SET status = CASE status
  WHEN 'reviewing' THEN 'accepted'
  WHEN 'waiting_user' THEN 'processing'
  WHEN 'waiting_staff' THEN 'processing'
  WHEN 'closed' THEN 'cancelled'
  ELSE status
END
WHERE status IN ('reviewing','waiting_user','waiting_staff','closed');
ALTER TABLE "ComplaintCase" ADD CONSTRAINT "ComplaintCase_status_check" CHECK (status IN ('received','accepted','processing','resolved','rejected','cancelled'));
INSERT INTO "ComplaintCategory" (slug, name, "groupName", "sortOrder") VALUES
  ('orders-delivery', 'Đơn hàng và giao nhận', 'general', 10),
  ('products-quality', 'Sản phẩm và chất lượng', 'general', 20),
  ('seller-shop', 'Cửa hàng và nhà bán hàng', 'general', 30),
  ('payment-refund', 'Thanh toán và hoàn tiền', 'general', 40),
  ('invoice', 'Hóa đơn', 'general', 50),
  ('account-security', 'Tài khoản và bảo mật', 'general', 60),
  ('voucher-promotion', 'Khuyến mãi và voucher', 'general', 70),
  ('app-technical', 'Ứng dụng và lỗi kỹ thuật', 'service', 80),
  ('return-warranty', 'Đổi trả và bảo hành', 'service', 90),
  ('fraud-safety', 'An toàn và giao dịch đáng ngờ', 'service', 100),
  ('partner-program', 'Trở thành đối tác/nhà bán hàng', 'service', 110),
  ('platform-feedback', 'Chính sách và góp ý về nền tảng', 'service', 120),
  ('other', 'Vấn đề khác', 'general', 999)
ON CONFLICT (slug) DO NOTHING;
ALTER TABLE "ComplaintCaseEvent" ADD COLUMN IF NOT EXISTS "createdBy" INTEGER REFERENCES "User"(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "ComplaintCaseEvent_caseId_createdAt_idx" ON "ComplaintCaseEvent"("caseId", "createdAt");
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "bankAccountHolder" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "identityVerificationStatus" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "identityVerificationProvider" TEXT;

CREATE OR REPLACE FUNCTION public.close_expired_complaint_cases()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_case RECORD;
  closed_count INTEGER := 0;
BEGIN
  FOR expired_case IN
    UPDATE "ComplaintCase"
    SET status = 'cancelled', "updatedAt" = NOW(), "customerReplyDeadline" = NULL
    WHERE status IN ('accepted','processing')
      AND "customerReplyDeadline" IS NOT NULL
      AND "customerReplyDeadline" <= NOW()
    RETURNING id
  LOOP
    INSERT INTO "ComplaintCaseEvent" ("caseId", status, message)
    VALUES (expired_case.id, 'cancelled', 'Hồ sơ tự động đóng do khách hàng không phản hồi trong 24 giờ.')
    ON CONFLICT DO NOTHING;
    closed_count := closed_count + 1;
  END LOOP;
  RETURN closed_count;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'close-expired-complaint-cases';
    PERFORM cron.schedule('close-expired-complaint-cases', '*/5 * * * *', 'SELECT public.close_expired_complaint_cases();');
  END IF;
END $$;

