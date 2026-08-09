import type { Metadata } from "next";
import { OperationalShell } from "../../components/finance/OperationalShell";
import { IntegrationCard } from "../../components/finance/IntegrationCard";
import { connectCryptoPricesAction, connectDollarAction } from "./actions";
import { requireOnboardedUser } from "../../lib/auth/guards";
import { getDb } from "../../lib/db";
import { FX_VARIANT_LABELS, formatRate } from "../../lib/finance/currency";
import { SUPPORTED_CRYPTO } from "../../lib/finance/rates/cryptoProvider";
import { QUOTED_BASE, QUOTED_QUOTE, resolveRateBook } from "../../lib/finance/rates/store";
import { MANUAL_PRICE_PROVIDER } from "../../lib/finance/rates/prices";
import styles from "../../components/finance/integrations.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Integraciones · Doleth",
  robots: { index: false },
};

/**
 * Fecha y hora de una lectura.
 *
 * `hourCycle: "h23"` evita el "p. m." con punto final del formato de 12 horas,
 * que al ir seguido del punto de la oración producía "05:02 p. m..". Además, en
 * un dato operativo el reloj de 24 horas se lee de un vistazo y no obliga a
 * procesar el sufijo.
 */
const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export default async function IntegrationsPage() {
  const user = await requireOnboardedUser("/integraciones");
  const db = getDb();

  const [book, lastRate, cryptoHoldings, lastPrice] = await Promise.all([
    resolveRateBook(user.id),
    db.marketRate.findFirst({
      where: { baseCurrency: QUOTED_BASE, quoteCurrency: QUOTED_QUOTE },
      orderBy: { asOf: "desc" },
    }),
    db.investment.findMany({
      where: { userId: user.id, status: "ACTIVE", symbol: { not: null }, quantityMicros: { not: null } },
      select: { symbol: true },
    }),
    db.assetPrice.findFirst({
      where: { provider: { not: MANUAL_PRICE_PROVIDER } },
      orderBy: { asOf: "desc" },
    }),
  ]);

  const symbols = [...new Set(cryptoHoldings.map((item) => item.symbol!.trim().toUpperCase()))];
  const covered = symbols.filter((symbol) => (SUPPORTED_CRYPTO as readonly string[]).includes(symbol));

  return (
    <OperationalShell
      eyebrow="Conexiones"
      intro="Fuentes públicas que Doleth consulta para completar lo que el ledger no sabe: cuánto vale un dólar, cuánto vale un bitcoin. Apretás y trae; nada corre solo por atrás."
      title="Integraciones"
    >
      <div className={styles.list}>
        <IntegrationCard
          action={connectDollarAction}
          buttonLabel="Traer la cotización de hoy"
          connected={lastRate !== null}
          description="Sin cotización, todo lo que tengas en dólares queda declarado aparte en vez de sumarse a tu patrimonio. Con ella, podés leer todo en pesos o en dólares."
          note="Fuente: dolarapi.com. Si preferís tu propia cotización —porque compraste a un precio concreto— cargala en Moneda y Doleth va a usar esa."
          pendingLabel="Consultando…"
          status={
            lastRate
              ? `Última cotización guardada: $${formatRate(lastRate.rateMicros)} por dólar, del ${dateTimeFormatter.format(lastRate.asOf)}. Estás leyendo al ${FX_VARIANT_LABELS[book.variant].toLowerCase()}.`
              : "Todavía no trajimos ninguna cotización. Mientras tanto, lo que esté en otra moneda no se suma al total."
          }
          title="Cotización del dólar"
        />

        <IntegrationCard
          action={connectCryptoPricesAction}
          buttonLabel="Actualizar precios"
          connected={lastPrice !== null}
          description="Busca el precio de las cripto que tengas cargadas con cantidad y símbolo, para que su valor se calcule solo en vez de depender de un número que escribiste hace tres meses."
          note={`Fuente: criptoya.com, tomando la mediana entre exchanges. Cubre ${SUPPORTED_CRYPTO.join(", ")}. Acciones y CEDEARs todavía no: para esos, cargá el precio a mano.`}
          pendingLabel="Consultando…"
          status={
            symbols.length === 0
              ? "Todavía no tenés tenencias con cantidad y símbolo. Cargá una en Inversiones y este botón va a poder buscarle el precio."
              : covered.length === 0
                ? `Tenés ${symbols.length} ${symbols.length === 1 ? "tenencia" : "tenencias"} con símbolo (${symbols.join(", ")}), pero ninguna es de las cripto que sabemos cotizar todavía.`
                : `Vamos a buscar el precio de ${covered.join(", ")}.${lastPrice ? ` Última actualización: ${dateTimeFormatter.format(lastPrice.asOf)}.` : ""}`
          }
          title="Precios de inversiones"
        />
      </div>
    </OperationalShell>
  );
}
