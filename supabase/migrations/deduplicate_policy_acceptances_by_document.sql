-- Apply this migration after create_policy_acceptance_table.sql on existing databases.
-- Keep the first acceptance per user, policy, and uploaded document version.
DELETE FROM "PolicyAcceptance" duplicate
USING "PolicyAcceptance" kept
WHERE duplicate."userId" = kept."userId"
  AND duplicate."policyCode" = kept."policyCode"
  AND COALESCE(duplicate."documentUrl", 'no-document-url') = COALESCE(kept."documentUrl", 'no-document-url')
  AND (duplicate."acceptedAt", duplicate.id) > (kept."acceptedAt", kept.id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_acceptance_unique_document
  ON "PolicyAcceptance" ("userId", "policyCode", COALESCE("documentUrl", 'no-document-url'));
