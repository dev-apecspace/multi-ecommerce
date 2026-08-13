CREATE TABLE "SocialOrganizationFeedback" (
  id SERIAL PRIMARY KEY,
  "organizationName" TEXT NOT NULL,
  "establishmentDecisionNumber" TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_organization_feedback_created_at
  ON "SocialOrganizationFeedback" ("createdAt" DESC);
