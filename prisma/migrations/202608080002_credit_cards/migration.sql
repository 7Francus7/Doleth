-- Tarjetas de crédito.
--
-- Una tarjeta no es un lugar donde hay plata: es una deuda. Entra al ledger como
-- una cuenta más y con el mismo signo —gastar deja el saldo en negativo— pero
-- significa lo contrario, así que el tipo de cuenta alcanza para declararlo y no
-- hace falta una columna de "pasivo" que después habría que mantener coherente.
--
-- Ninguna fila existente cambia: el tipo es nuevo y nadie lo usa todavía.

ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'CREDIT_CARD';

-- Los datos que una tarjeta tiene y una cuenta común no. Van en su propia tabla
-- para no agregarle seis columnas nulas a todas las cuentas del producto.
CREATE TABLE "CreditCard" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "brand" TEXT,
  -- Lo único del número de tarjeta que Doleth guarda. Alcanza para reconocerla
  -- en un resumen o en un aviso de consumo, y no sirve para pagar con ella.
  "last4" TEXT,
  "closingDay" INTEGER NOT NULL,
  "dueDay" INTEGER NOT NULL,
  "creditLimitCents" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id"),
  -- Un día de cierre fuera del calendario haría imposible calcular el período
  -- del resumen. Los meses cortos se resuelven al derivar la fecha, no acá.
  CONSTRAINT "CreditCard_closing_day_range" CHECK ("closingDay" BETWEEN 1 AND 31),
  CONSTRAINT "CreditCard_due_day_range" CHECK ("dueDay" BETWEEN 1 AND 31),
  CONSTRAINT "CreditCard_last4_shape" CHECK ("last4" IS NULL OR "last4" ~ '^[0-9]{4}$'),
  CONSTRAINT "CreditCard_positive_limit" CHECK ("creditLimitCents" IS NULL OR "creditLimitCents" > 0)
);

CREATE UNIQUE INDEX "CreditCard_accountId_key" ON "CreditCard"("accountId");
CREATE UNIQUE INDEX "CreditCard_accountId_userId_key" ON "CreditCard"("accountId", "userId");
CREATE INDEX "CreditCard_userId_idx" ON "CreditCard"("userId");

ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- La clave compuesta arrastra el propietario: una tarjeta no puede apuntar a la
-- cuenta de otra persona ni por error de programación.
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_accountId_userId_fkey"
  FOREIGN KEY ("accountId", "userId") REFERENCES "Account"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
