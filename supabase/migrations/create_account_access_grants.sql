CREATE TABLE IF NOT EXISTS "AccountAccess" (
  id BIGSERIAL PRIMARY KEY,
  "userId" INT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('admin', 'seller')),
  "vendorId" INT REFERENCES "Vendor"(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  "createdBy" INT REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AccountAccess_scope_vendor_check" CHECK (
    (scope = 'admin' AND "vendorId" IS NULL) OR
    (scope = 'seller' AND "vendorId" IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS "idx_account_access_vendor_scope"
  ON "AccountAccess" ("vendorId", scope);
