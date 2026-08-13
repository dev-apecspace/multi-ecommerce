CREATE TABLE IF NOT EXISTS "PolicyAcceptance" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "policyCode" TEXT NOT NULL CHECK ("policyCode" IN ('intermediary-payment-agreement', 'website-operating-conditions', 'terms-of-service', 'privacy-policy')),
  "policyTitle" TEXT NOT NULL,
  "documentName" TEXT,
  "documentUrl" TEXT,
  "documentVersion" TEXT,
  "acceptedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_acceptance_user_accepted_at ON "PolicyAcceptance" ("userId", "acceptedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_policy_acceptance_policy_accepted_at ON "PolicyAcceptance" ("policyCode", "acceptedAt" DESC);

-- Mỗi người dùng chỉ cần chấp nhận một lần cho mỗi phiên bản chính sách.
DELETE FROM "PolicyAcceptance" duplicate
USING "PolicyAcceptance" kept
WHERE duplicate."userId" = kept."userId"
  AND duplicate."policyCode" = kept."policyCode"
  AND COALESCE(duplicate."documentVersion", 'no-document-version') = COALESCE(kept."documentVersion", 'no-document-version')
  AND (duplicate."acceptedAt", duplicate.id) > (kept."acceptedAt", kept.id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_acceptance_unique_version
  ON "PolicyAcceptance" ("userId", "policyCode", COALESCE("documentVersion", 'no-document-version'));
