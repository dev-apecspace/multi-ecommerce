-- Keep stable machine codes/URLs while renaming the policy shown to users.
UPDATE "LegalDocument"
SET title = 'Điều kiện hoạt động'
WHERE code = 'operating-regulations';

UPDATE "PolicyAcceptance"
SET "policyTitle" = 'Điều kiện hoạt động'
WHERE "policyCode" = 'website-operating-conditions';
