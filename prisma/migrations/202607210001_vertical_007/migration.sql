CREATE TYPE "AccountType" AS ENUM ('CASH', 'BANK', 'WALLET', 'SAVINGS', 'OTHER');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER');
CREATE TYPE "UpcomingPaymentStatus" AS ENUM ('PENDING', 'PAID');

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AccountType" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'ARS',
  "initialBalanceCents" BIGINT NOT NULL,
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "CategoryKind" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
  "id" TEXT NOT NULL,
  "type" "TransactionType" NOT NULL,
  "amountCents" BIGINT NOT NULL,
  "occurredOn" DATE NOT NULL,
  "description" TEXT,
  "sourceAccountId" TEXT NOT NULL,
  "destinationAccountId" TEXT,
  "categoryId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "correctedFromId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Transaction_positive_amount" CHECK ("amountCents" > 0),
  CONSTRAINT "Transaction_accounts_by_type" CHECK (
    ("type" = 'TRANSFER' AND "destinationAccountId" IS NOT NULL AND "sourceAccountId" <> "destinationAccountId" AND "categoryId" IS NULL)
    OR ("type" <> 'TRANSFER' AND "destinationAccountId" IS NULL AND "categoryId" IS NOT NULL)
  )
);

CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "amountCents" BIGINT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LedgerEntry_non_zero" CHECK ("amountCents" <> 0)
);

CREATE TABLE "UpcomingPayment" (
  "id" TEXT NOT NULL,
  "concept" TEXT NOT NULL,
  "estimatedCents" BIGINT NOT NULL,
  "dueOn" DATE NOT NULL,
  "frequency" TEXT,
  "plannedAccountId" TEXT NOT NULL,
  "status" "UpcomingPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "transactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UpcomingPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UpcomingPayment_positive_amount" CHECK ("estimatedCents" > 0),
  CONSTRAINT "UpcomingPayment_paid_has_transaction" CHECK (
    ("status" = 'PENDING' AND "transactionId" IS NULL) OR
    ("status" = 'PAID' AND "transactionId" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_kind_idx" ON "Category"("kind");
CREATE INDEX "Account_status_idx" ON "Account"("status");
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");
CREATE UNIQUE INDEX "Transaction_correctedFromId_key" ON "Transaction"("correctedFromId");
CREATE INDEX "Transaction_occurredOn_idx" ON "Transaction"("occurredOn");
CREATE INDEX "Transaction_type_occurredOn_idx" ON "Transaction"("type", "occurredOn");
CREATE INDEX "Transaction_sourceAccountId_occurredOn_idx" ON "Transaction"("sourceAccountId", "occurredOn");
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");
CREATE UNIQUE INDEX "UpcomingPayment_transactionId_key" ON "UpcomingPayment"("transactionId");
CREATE INDEX "UpcomingPayment_status_dueOn_idx" ON "UpcomingPayment"("status", "dueOn");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_correctedFromId_fkey" FOREIGN KEY ("correctedFromId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UpcomingPayment" ADD CONSTRAINT "UpcomingPayment_plannedAccountId_fkey" FOREIGN KEY ("plannedAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UpcomingPayment" ADD CONSTRAINT "UpcomingPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
