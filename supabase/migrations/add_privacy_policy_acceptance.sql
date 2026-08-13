ALTER TABLE "PolicyAcceptance"
  DROP CONSTRAINT IF EXISTS "PolicyAcceptance_policyCode_check";

ALTER TABLE "PolicyAcceptance"
  ADD CONSTRAINT "PolicyAcceptance_policyCode_check"
  CHECK ("policyCode" IN ('intermediary-payment-agreement', 'website-operating-conditions', 'terms-of-service', 'privacy-policy'));
