-- Doleth · integridad relacional multiusuario
--
-- userId NOT NULL evita huérfanos, pero una FK simple por id todavía permitía
-- combinaciones incoherentes como Transaction(user=A, sourceAccount=user=B).
-- La aplicación ya rechaza esos casos. Estas claves compuestas convierten esa
-- regla en una garantía de PostgreSQL, también para futuros importadores,
-- scripts operativos y errores de aplicación.
--
-- La migración no modifica filas. Si existe una referencia cruzada, agregar la
-- FK falla y no permite publicar sobre datos ambiguos.

CREATE UNIQUE INDEX "Account_id_userId_key" ON "Account"("id", "userId");
CREATE UNIQUE INDEX "Category_id_userId_key" ON "Category"("id", "userId");
CREATE UNIQUE INDEX "Transaction_id_userId_key" ON "Transaction"("id", "userId");
CREATE UNIQUE INDEX "Transaction_correctedFromId_userId_key" ON "Transaction"("correctedFromId", "userId");
CREATE UNIQUE INDEX "UpcomingPayment_transactionId_userId_key" ON "UpcomingPayment"("transactionId", "userId");

ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_sourceAccountId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_destinationAccountId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_correctedFromId_fkey";
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_transactionId_fkey";
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_accountId_fkey";
ALTER TABLE "UpcomingPayment" DROP CONSTRAINT "UpcomingPayment_plannedAccountId_fkey";
ALTER TABLE "UpcomingPayment" DROP CONSTRAINT "UpcomingPayment_transactionId_fkey";

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_sourceAccountId_userId_fkey"
  FOREIGN KEY ("sourceAccountId", "userId")
  REFERENCES "Account"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_destinationAccountId_userId_fkey"
  FOREIGN KEY ("destinationAccountId", "userId")
  REFERENCES "Account"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_categoryId_userId_fkey"
  FOREIGN KEY ("categoryId", "userId")
  REFERENCES "Category"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_correctedFromId_userId_fkey"
  FOREIGN KEY ("correctedFromId", "userId")
  REFERENCES "Transaction"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_transactionId_userId_fkey"
  FOREIGN KEY ("transactionId", "userId")
  REFERENCES "Transaction"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_accountId_userId_fkey"
  FOREIGN KEY ("accountId", "userId")
  REFERENCES "Account"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UpcomingPayment"
  ADD CONSTRAINT "UpcomingPayment_plannedAccountId_userId_fkey"
  FOREIGN KEY ("plannedAccountId", "userId")
  REFERENCES "Account"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UpcomingPayment"
  ADD CONSTRAINT "UpcomingPayment_transactionId_userId_fkey"
  FOREIGN KEY ("transactionId", "userId")
  REFERENCES "Transaction"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
