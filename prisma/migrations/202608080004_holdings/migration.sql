-- Tenencias valuadas por cantidad y precio.
--
-- Hasta acá una inversión guardaba un "valor actual" tipeado a mano, lo que
-- obliga a la persona a corregir un número cada vez que quiere saber cuánto
-- tiene. En la práctica eso significa que el número está siempre viejo: nadie
-- entra a la app a actualizar el precio de una acción antes de mirarla.
--
-- Una tenencia tiene dos partes que cambian a distinto ritmo: cuánto tengo —que
-- sólo cambia si comprás o vendés— y cuánto vale cada unidad —que cambia solo—.
-- Separarlas es lo que permite que el valor se actualice sin que nadie toque
-- nada.
--
-- `quantityMicros` es opcional a propósito. Un departamento no tiene cantidad ni
-- precio unitario, y obligarlo a tenerlos sería inventar precisión. Las
-- inversiones existentes quedan sin cantidad y siguen valuándose por su valor
-- declarado, exactamente como hasta ahora.

ALTER TABLE "Investment" ADD COLUMN "quantityMicros" BIGINT;

-- Una cantidad de cero o negativa no es una tenencia: si vendiste todo, la
-- inversión se archiva, no se deja en cero.
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_positive_quantity"
  CHECK ("quantityMicros" IS NULL OR "quantityMicros" > 0);

-- Precio público de un instrumento. Sin propietario, igual que las cotizaciones
-- de moneda: el precio de una acción no dice nada de la cartera de nadie.
CREATE TABLE "AssetPrice" (
  "id" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "priceMicros" BIGINT NOT NULL,
  "provider" TEXT NOT NULL,
  "asOf" TIMESTAMP(3) NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetPrice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssetPrice_positive" CHECK ("priceMicros" > 0),
  -- El símbolo se guarda normalizado en mayúsculas porque es la clave de
  -- búsqueda: dos filas "aapl" y "AAPL" serían dos precios del mismo papel.
  CONSTRAINT "AssetPrice_symbol_upper" CHECK ("symbol" = upper("symbol"))
);

CREATE UNIQUE INDEX "AssetPrice_symbol_currency_asOf_key" ON "AssetPrice"("symbol", "currency", "asOf");
CREATE INDEX "AssetPrice_symbol_currency_asOf_idx" ON "AssetPrice"("symbol", "currency", "asOf");
