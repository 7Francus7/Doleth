-- Categorías propias y categoría del pago previsto.
--
-- Hasta acá el catálogo era el que Doleth repartía en el onboarding y nada más:
-- trece nombres iguales para todo el mundo. Quien gasta en algo que no está en
-- esa lista sólo podía elegir "Otros gastos", y una categoría que junta todo lo
-- que no entró en ningún lado no explica nada cuando se lee el reporte.
--
-- Dos cambios, los dos aditivos y sin reescribir una sola fila existente.

-- 1. Archivar una categoría.
--
--    Borrarla no es una opción: los movimientos la referencian con ON DELETE
--    RESTRICT, y borrar una categoría usada cambiaría cómo se lee el pasado.
--    `archivedAt` la saca de los selectores sin tocar la historia. NULL es la
--    categoría en uso, que es lo que ya son todas las que existen hoy.
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- El selector de categorías pide siempre las vigentes de una persona.
CREATE INDEX IF NOT EXISTS "Category_userId_archivedAt_idx" ON "Category"("userId", "archivedAt");

-- 2. Categoría prevista de un pago previsto.
--
--    Confirmar un pago previsto creaba un gasto en la categoría de respaldo,
--    siempre. Con el onboarding cargando los gastos fijos ahí, el resultado era
--    que la luz, el alquiler y el gimnasio terminaban juntos en "Otros gastos" y
--    /en-que-se-fue no podía responder su única pregunta.
--
--    Es NULL-able a propósito: los pagos ya cargados no tienen categoría y se
--    siguen confirmando con el respaldo, igual que antes de esta migración.
ALTER TABLE "UpcomingPayment" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- La clave compuesta con el propietario es la misma regla que sostiene el resto
-- del modelo: una fila no puede apuntar a la categoría de otra persona ni por
-- error de código ni por un id adivinado.
ALTER TABLE "UpcomingPayment"
  DROP CONSTRAINT IF EXISTS "UpcomingPayment_categoryId_userId_fkey";
ALTER TABLE "UpcomingPayment"
  ADD CONSTRAINT "UpcomingPayment_categoryId_userId_fkey"
  FOREIGN KEY ("categoryId", "userId")
  REFERENCES "Category"("id", "userId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "UpcomingPayment_categoryId_userId_idx"
  ON "UpcomingPayment"("categoryId", "userId");
