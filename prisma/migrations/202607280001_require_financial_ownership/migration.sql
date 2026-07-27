-- Doleth · endurecimiento de la propiedad de datos (fase contract)
--
-- Aplicar SÓLO después de que `pnpm db:backfill-owner` haya terminado sin
-- diferencias contables y de haber verificado en la aplicación que el owner ve
-- todos sus datos. Ver docs/auth/owner-migration-plan.md.
--
-- El bloque de guarda falla ruidosamente ANTES de tocar nada si quedó alguna
-- fila sin propietario, en lugar de dejar un error críptico de constraint.
--
-- Efecto colateral deseado: con userId NOT NULL, el único compuesto
-- (userId, idempotencyKey) de Transaction y (userId, slug) de Category pasan a
-- ser realmente exclusivos. Con NULLs, Postgres los trata como distintos.
--
-- Rollback: ALTER TABLE "<tabla>" ALTER COLUMN "userId" DROP NOT NULL;
-- Quitar la restricción no borra ni modifica ninguna fila.

DO $$
DECLARE
  huerfanas bigint;
BEGIN
  SELECT
    (SELECT COUNT(*) FROM "Account"         WHERE "userId" IS NULL)
  + (SELECT COUNT(*) FROM "Category"        WHERE "userId" IS NULL)
  + (SELECT COUNT(*) FROM "Transaction"     WHERE "userId" IS NULL)
  + (SELECT COUNT(*) FROM "LedgerEntry"     WHERE "userId" IS NULL)
  + (SELECT COUNT(*) FROM "Investment"      WHERE "userId" IS NULL)
  + (SELECT COUNT(*) FROM "UpcomingPayment" WHERE "userId" IS NULL)
  INTO huerfanas;

  IF huerfanas > 0 THEN
    RAISE EXCEPTION
      'Quedan % filas financieras sin propietario. Ejecutá `pnpm db:backfill-owner` antes de endurecer.', huerfanas;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Investment" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UpcomingPayment" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_destinationAccountId_occurredOn_idx" ON "Transaction"("destinationAccountId", "occurredOn");

