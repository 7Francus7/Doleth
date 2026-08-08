-- Fundación multimoneda.
--
-- Hasta acá el producto asumía pesos en todos lados y lo hacía cumplir desde el
-- código de las acciones. Esta migración mueve ese supuesto al lugar donde no se
-- puede eludir —la base— y al mismo tiempo lo levanta: una cuenta puede estar en
-- otra moneda, y una transferencia puede cruzar dos.
--
-- Nada de lo ya guardado cambia de significado: todo lo existente es en pesos y
-- queda declarado como tal.

-- 1. Tipo de cambio.
CREATE TYPE "FxVariant" AS ENUM ('OFICIAL', 'BLUE', 'MEP', 'CCL', 'CRIPTO', 'TARJETA', 'MANUAL');

-- 2. Preferencia de lectura de cada persona.
ALTER TABLE "User" ADD COLUMN "displayCurrency" TEXT NOT NULL DEFAULT 'ARS';
ALTER TABLE "User" ADD COLUMN "fxVariant" "FxVariant" NOT NULL DEFAULT 'BLUE';

-- 3. Cotización pública. Sin propietario a propósito: el precio del dólar no es
--    un dato personal y compartir la fila no expone nada de nadie.
CREATE TABLE "MarketRate" (
  "id" TEXT NOT NULL,
  "baseCurrency" TEXT NOT NULL,
  "quoteCurrency" TEXT NOT NULL,
  "variant" "FxVariant" NOT NULL,
  "rateMicros" BIGINT NOT NULL,
  "provider" TEXT NOT NULL,
  "asOf" TIMESTAMP(3) NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketRate_pkey" PRIMARY KEY ("id"),
  -- Una cotización de cero o negativa no es un dato pobre: es un dato imposible
  -- que haría dividir por cero al convertir.
  CONSTRAINT "MarketRate_positive" CHECK ("rateMicros" > 0),
  CONSTRAINT "MarketRate_distinct_currencies" CHECK ("baseCurrency" <> "quoteCurrency")
);

CREATE UNIQUE INDEX "MarketRate_baseCurrency_quoteCurrency_variant_asOf_key"
  ON "MarketRate"("baseCurrency", "quoteCurrency", "variant", "asOf");
CREATE INDEX "MarketRate_baseCurrency_quoteCurrency_variant_asOf_idx"
  ON "MarketRate"("baseCurrency", "quoteCurrency", "variant", "asOf");

-- 4. Cotización propia del usuario. Ésta sí es suya, y va con propietario.
CREATE TABLE "ManualRate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "baseCurrency" TEXT NOT NULL,
  "quoteCurrency" TEXT NOT NULL,
  "rateMicros" BIGINT NOT NULL,
  "note" TEXT,
  "asOf" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ManualRate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ManualRate_positive" CHECK ("rateMicros" > 0),
  CONSTRAINT "ManualRate_distinct_currencies" CHECK ("baseCurrency" <> "quoteCurrency")
);

CREATE UNIQUE INDEX "ManualRate_userId_baseCurrency_quoteCurrency_asOf_key"
  ON "ManualRate"("userId", "baseCurrency", "quoteCurrency", "asOf");
CREATE INDEX "ManualRate_userId_baseCurrency_quoteCurrency_asOf_idx"
  ON "ManualRate"("userId", "baseCurrency", "quoteCurrency", "asOf");

ALTER TABLE "ManualRate" ADD CONSTRAINT "ManualRate_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Moneda explícita en cada movimiento.
--
--    El DEFAULT deja las filas existentes declaradas en pesos, que es lo que
--    siempre fueron: hasta esta migración el código rechazaba cualquier otra
--    cosa, así que no hay ambigüedad que resolver.
ALTER TABLE "Transaction" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'ARS';
ALTER TABLE "Transaction" ADD COLUMN "destinationAmountCents" BIGINT;

-- 6. Coherencia de la transferencia entre monedas.
--
--    `destinationAmountCents` sólo tiene sentido en una transferencia: en un
--    gasto o un ingreso no hay segunda punta que acreditar. Y cuando está, tiene
--    que ser un importe real. Que lo verifique la base y no sólo la acción evita
--    que un import masivo, una corrección a mano o un backfill futuro dejen un
--    asiento que no cierra.
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destination_amount_by_type" CHECK (
  ("destinationAmountCents" IS NULL)
  OR ("type" = 'TRANSFER' AND "destinationAmountCents" > 0)
);
