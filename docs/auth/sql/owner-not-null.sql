-- Doleth · endurecimiento de la propiedad de datos (fase contract)
--
-- Aplicar SÓLO después de:
--   1. Ejecutar `pnpm db:backfill-owner -- --email=<owner>` en producción.
--   2. Verificar que la corrida reportó 0 filas huérfanas.
--   3. Confirmar en la aplicación que el owner ve todos sus datos.
--
-- Este script no es una migración de Prisma a propósito: convertir las columnas
-- a NOT NULL antes del backfill haría fallar el deploy. Cuando se aplique,
-- actualizar prisma/schema.prisma (userId String, user User) y generar la
-- migración correspondiente con `prisma migrate diff` para que el historial
-- quede alineado.
--
-- Verificación previa (debe devolver 0 en todas las filas):
--
--   SELECT 'Account' AS tabla, COUNT(*) FROM "Account" WHERE "userId" IS NULL
--   UNION ALL SELECT 'Category', COUNT(*) FROM "Category" WHERE "userId" IS NULL
--   UNION ALL SELECT 'Transaction', COUNT(*) FROM "Transaction" WHERE "userId" IS NULL
--   UNION ALL SELECT 'LedgerEntry', COUNT(*) FROM "LedgerEntry" WHERE "userId" IS NULL
--   UNION ALL SELECT 'Investment', COUNT(*) FROM "Investment" WHERE "userId" IS NULL
--   UNION ALL SELECT 'UpcomingPayment', COUNT(*) FROM "UpcomingPayment" WHERE "userId" IS NULL;

BEGIN;

-- Falla ruidosamente si quedó alguna fila sin propietario, antes de tocar nada.
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
      'Quedan % filas sin propietario. Ejecutá el backfill antes de endurecer.', huerfanas;
  END IF;
END $$;

ALTER TABLE "Account"         ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Category"        ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Transaction"     ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "LedgerEntry"     ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Investment"      ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "UpcomingPayment" ALTER COLUMN "userId" SET NOT NULL;

COMMIT;

-- Rollback: ALTER TABLE "<tabla>" ALTER COLUMN "userId" DROP NOT NULL;
-- Quitar la restricción no borra ni modifica ninguna fila.
