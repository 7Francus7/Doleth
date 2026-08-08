import type { Metadata } from "next";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import {
  DisplayPreferencesSection,
  ManualRateSection,
  RefreshRatesSection,
} from "../../../components/finance/CurrencySettings";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { getDb } from "../../../lib/db";
import { FX_VARIANT_LABELS, formatRate } from "../../../lib/finance/currency";
import { QUOTED_BASE, QUOTED_QUOTE, resolveRateBook } from "../../../lib/finance/rates/store";
import styles from "../../../components/auth/settings.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moneda · Doleth",
  robots: { index: false },
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function Section({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionIntro}>{intro}</p>
      </header>
      {children}
    </section>
  );
}

export default async function CurrencySettingsPage() {
  const user = await requireOnboardedUser("/configuracion/moneda");
  const db = getDb();

  const [book, manual, lastMarket] = await Promise.all([
    resolveRateBook(user.id),
    db.manualRate.findFirst({
      where: { userId: user.id, baseCurrency: QUOTED_BASE, quoteCurrency: QUOTED_QUOTE },
      orderBy: { asOf: "desc" },
    }),
    db.marketRate.findFirst({
      where: { baseCurrency: QUOTED_BASE, quoteCurrency: QUOTED_QUOTE },
      orderBy: { asOf: "desc" },
    }),
  ]);

  const activeRate = book.active
    ? `$${formatRate(book.active.rateMicros)} por dólar (${FX_VARIANT_LABELS[book.variant].toLowerCase()})`
    : null;

  return (
    <OperationalShell
      eyebrow="Moneda"
      intro="Cómo leés tu plata. Nada de esto cambia lo que registraste: cada movimiento conserva la moneda en la que ocurrió."
      title="Pesos y dólares"
    >
      <div className={styles.sections}>
        <Section
          intro="Elegir dólares no convierte tus datos: cambia la unidad en la que Doleth te muestra el total. Podés volver cuando quieras."
          title="En qué moneda leer"
        >
          <DisplayPreferencesSection
            activeRate={activeRate}
            defaults={{ displayCurrency: book.displayCurrency, fxVariant: book.variant }}
          />
        </Section>

        <Section
          intro="Las cotizaciones públicas son compartidas y no dicen nada de tu situación: bajarlas no expone ningún dato tuyo."
          title="Cotizaciones del mercado"
        >
          <RefreshRatesSection
            lastUpdated={lastMarket ? dateTimeFormatter.format(lastMarket.asOf) : null}
          />
        </Section>

        <Section
          intro="Si compraste a un precio concreto, o usás una referencia propia, cargala acá. Queda guardada por fecha, así que después se puede saber a qué precio leíste tu patrimonio en cada momento."
          title="Tu cotización"
        >
          <ManualRateSection
            current={manual ? { rate: formatRate(manual.rateMicros), note: manual.note } : null}
          />
        </Section>

        {book.stale ? (
          <p className={styles.sectionIntro} role="status">
            La cotización que estás usando ya tiene unos días. Los totales convertidos siguen siendo los últimos
            que Doleth pudo calcular, no los de hoy.
          </p>
        ) : null}
      </div>
    </OperationalShell>
  );
}
