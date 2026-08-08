-- Importación de resúmenes.
--
-- El lote existe para que un import sea reversible en bloque. Sin él, quien
-- importa el archivo equivocado tiene que encontrar y anular doscientos
-- movimientos a mano, y el miedo a eso hace que nadie use el importador.
--
-- La reversión nunca borra: anula. El ledger de Doleth conserva lo anulado
-- visible y fuera de los saldos, y un import revertido no puede ser la excepción
-- que abre la puerta al borrado físico.

CREATE TYPE "ImportStatus" AS ENUM ('PREVIEWED', 'COMMITTED', 'REVERTED');

CREATE TABLE "ImportBatch" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "fileSha256" TEXT NOT NULL,
  "status" "ImportStatus" NOT NULL DEFAULT 'PREVIEWED',
  "settingsJson" TEXT NOT NULL,
  "rowCount" INTEGER NOT NULL,
  "committedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "committedAt" TIMESTAMP(3),
  "revertedAt" TIMESTAMP(3),
  CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ImportBatch_counts_non_negative" CHECK (
    "rowCount" >= 0 AND "committedCount" >= 0 AND "skippedCount" >= 0
  ),
  -- Un lote no puede haber confirmado más filas de las que tenía el archivo.
  CONSTRAINT "ImportBatch_committed_within_rows" CHECK ("committedCount" <= "rowCount"),
  -- El estado y las marcas de tiempo cuentan la misma historia o no cuentan
  -- ninguna: un lote confirmado sin fecha de confirmación no se puede auditar.
  CONSTRAINT "ImportBatch_status_timestamps" CHECK (
    ("status" = 'PREVIEWED' AND "committedAt" IS NULL AND "revertedAt" IS NULL)
    OR ("status" = 'COMMITTED' AND "committedAt" IS NOT NULL AND "revertedAt" IS NULL)
    OR ("status" = 'REVERTED' AND "committedAt" IS NOT NULL AND "revertedAt" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "ImportBatch_id_userId_key" ON "ImportBatch"("id", "userId");
CREATE INDEX "ImportBatch_userId_createdAt_idx" ON "ImportBatch"("userId", "createdAt");
CREATE INDEX "ImportBatch_userId_fileSha256_idx" ON "ImportBatch"("userId", "fileSha256");

ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_accountId_userId_fkey"
  FOREIGN KEY ("accountId", "userId") REFERENCES "Account"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Se guardan todas las filas, incluidas las que no se pudieron usar: una fila
-- descartada en silencio es un movimiento que la persona cree tener y no tiene.
CREATE TABLE "ImportRow" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "sourceRowNumber" INTEGER NOT NULL,
  "rawJson" TEXT NOT NULL,
  "day" DATE,
  "amountCents" BIGINT,
  "merchant" TEXT,
  "issuesJson" TEXT NOT NULL,
  "transactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ImportRow_source_row_positive" CHECK ("sourceRowNumber" >= 1)
);

-- Un movimiento no puede provenir de dos filas: si pudiera, revertir un lote
-- anularía algo que también pertenece a otro.
CREATE UNIQUE INDEX "ImportRow_transactionId_key" ON "ImportRow"("transactionId");
CREATE UNIQUE INDEX "ImportRow_transactionId_userId_key" ON "ImportRow"("transactionId", "userId");
CREATE INDEX "ImportRow_batchId_sourceRowNumber_idx" ON "ImportRow"("batchId", "sourceRowNumber");
CREATE INDEX "ImportRow_userId_batchId_idx" ON "ImportRow"("userId", "batchId");

ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- La fila se borra con su lote: sin lote no significa nada.
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_transactionId_userId_fkey"
  FOREIGN KEY ("transactionId", "userId") REFERENCES "Transaction"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
