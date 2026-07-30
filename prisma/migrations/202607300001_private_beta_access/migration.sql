-- Private beta activation is distinct from verified email. Invitation-based
-- accounts stay honest: ACTIVE for the beta, emailVerifiedAt remains NULL.
ALTER TABLE "User" ADD COLUMN "privateBetaActivatedAt" TIMESTAMP(3);

ALTER TYPE "AuthTokenPurpose" ADD VALUE 'ADMIN_PASSWORD_RESET';

ALTER TYPE "AuthEventType" ADD VALUE 'PRIVATE_BETA_ADMIN_BOOTSTRAPPED';
ALTER TYPE "AuthEventType" ADD VALUE 'PRIVATE_BETA_INVITATION_CREATED';
ALTER TYPE "AuthEventType" ADD VALUE 'PRIVATE_BETA_INVITATION_CONSUMED';
ALTER TYPE "AuthEventType" ADD VALUE 'PRIVATE_BETA_INVITATION_REJECTED';
ALTER TYPE "AuthEventType" ADD VALUE 'ADMIN_PASSWORD_RESET_ISSUED';

CREATE TABLE "PrivateBetaInvite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "consumedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateBetaInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrivateBetaInvite_tokenHash_key" ON "PrivateBetaInvite"("tokenHash");
CREATE UNIQUE INDEX "PrivateBetaInvite_consumedById_key" ON "PrivateBetaInvite"("consumedById");
CREATE INDEX "PrivateBetaInvite_email_expiresAt_idx" ON "PrivateBetaInvite"("email", "expiresAt");
CREATE INDEX "PrivateBetaInvite_createdById_createdAt_idx" ON "PrivateBetaInvite"("createdById", "createdAt");
CREATE INDEX "PrivateBetaInvite_expiresAt_idx" ON "PrivateBetaInvite"("expiresAt");

ALTER TABLE "PrivateBetaInvite"
ADD CONSTRAINT "PrivateBetaInvite_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PrivateBetaInvite"
ADD CONSTRAINT "PrivateBetaInvite_consumedById_fkey"
FOREIGN KEY ("consumedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
