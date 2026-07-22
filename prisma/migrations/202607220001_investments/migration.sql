CREATE TYPE "InvestmentKind" AS ENUM ('STOCKS', 'CRYPTO', 'FUND', 'BOND', 'REAL_ESTATE', 'CASH_EQUIVALENT', 'OTHER');
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "Investment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "InvestmentKind" NOT NULL,
  "symbol" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'ARS',
  "investedCents" BIGINT NOT NULL,
  "currentValueCents" BIGINT NOT NULL,
  "note" TEXT,
  "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Investment_status_idx" ON "Investment"("status");
CREATE INDEX "Investment_kind_idx" ON "Investment"("kind");
