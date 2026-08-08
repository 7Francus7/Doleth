"use client";

import Link from "next/link";
import { SensitiveAmount, SensitiveText } from "../../components/privacy/AmountPrivacy";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { NumericValue } from "../../design-system/primitives/NumericValue";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { EmptyState } from "../../design-system/feedback";
import type { SpendingRow, SpendingViewModel } from "./model";
import styles from "./SpendingPage.module.css";

export interface SpendingPageProps {
  model: SpendingViewModel;
}

/**
 * En qué se fue la plata.
 *
 * La pantalla más densa del producto, y la que más cuidado necesita por eso
 * mismo. El orden es deliberado: primero **cuánto** salió en total, después
 * **adónde** fue, y recién al final **qué de eso se repite**. Empezar por las
 * tablas obligaría a reconstruir el total sumando con la vista, que es
 * exactamente el trabajo que el reporte viene a ahorrar.
 *
 * Las barras de participación no llevan color propio: son una lectura de
 * proporción, no un estado. Pintar de rojo el rubro más grande diría que gastar
 * en el rubro más grande está mal, y eso no lo sabe Doleth.
 */
function Breakdown({ rows, emptyLabel }: { rows: readonly SpendingRow[]; emptyLabel: string }) {
  if (rows.length === 0) return <p className={styles.empty}>{emptyLabel}</p>;

  return (
    <ul className={styles.rows}>
      {rows.map((row) => (
        <li key={row.key}>
          <Link className={styles.row} href={row.href}>
            <span className={styles.rowHead}>
              <span className={styles.rowLabel}>
                <SensitiveText>{row.label}</SensitiveText>
              </span>
              <span className={styles.rowAmount}>
                <SensitiveAmount>
                  {row.amountPrefix}
                  {row.amount}
                </SensitiveAmount>
              </span>
            </span>

            {/*
              La barra es decoración informativa: el número ya está arriba y el
              porcentaje al lado. Se oculta a los lectores de pantalla para no
              anunciar tres veces el mismo hecho.
            */}
            <span aria-hidden="true" className={styles.bar}>
              <span className={styles.barFill} style={{ width: `${Math.max(row.sharePercent, 1)}%` }} />
            </span>

            <span className={styles.rowMeta}>
              <span>
                {row.share} · {row.detail}
              </span>
              {row.delta ? (
                <span className={styles.delta} data-direction={row.deltaDirection}>
                  <SensitiveText>{row.delta}</SensitiveText>
                </span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SpendingPage({ model }: SpendingPageProps) {
  return (
    <div className={styles.page}>
      <SystemRail items={model.rail.items} state={model.rail.state ?? "complete"} wrap={model.rail.wrap ?? "truncate"} />

      {model.months.length > 1 ? (
        <nav aria-label="Elegir mes" className={styles.months}>
          {model.months.map((month) => (
            <Link
              aria-current={month.current ? "page" : undefined}
              className={styles.month}
              data-current={month.current || undefined}
              href={month.href}
              key={month.month}
            >
              {month.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {model.empty ? (
        <EmptyState
          description={model.stability.children as string}
          primaryAction={
            <Link className={styles.primaryLink} href="/movimientos/nuevo">
              Registrar un movimiento
            </Link>
          }
          secondaryAction={
            <Link className={styles.secondaryLink} href="/importar">
              Importar un resumen
            </Link>
          }
          title={model.headline.stateText}
        />
      ) : (
        <>
          <Surface elevation="soft" padding="lg" radius="xl" tone="raised">
            <p className={styles.stateLine}>
              <SensitiveText>{model.headline.stateText}</SensitiveText>
            </p>
            <div className={styles.heroValue}>
              <NumericValue
                prefix={model.headline.amountPrefix}
                size="xl"
                state="confirmed"
                tone="neutral"
                value={model.headline.amount}
              />
            </div>
            <p className={styles.heroLabel}>{model.headline.label}</p>
            {model.headline.comparison ? (
              <p className={styles.heroNote}>
                <SensitiveText>{model.headline.comparison}</SensitiveText>
              </p>
            ) : null}
            <p className={styles.heroNote}>
              <SensitiveText>{model.headline.dailyAverage}</SensitiveText>
            </p>
          </Surface>

          {model.breakdowns.map((breakdown) => (
            <section className={styles.section} key={breakdown.id}>
              <SectionTitle support="line" supportingLine={breakdown.subtitle} title={breakdown.title} />
              <Breakdown emptyLabel={breakdown.emptyLabel} rows={breakdown.rows} />
            </section>
          ))}

          <section className={styles.section}>
            <SectionTitle title={model.recurring.title} />
            <p className={styles.sectionIntro}>
              <SensitiveText>{model.recurring.headline}</SensitiveText>
            </p>
            {model.recurring.rows.length === 0 ? (
              <p className={styles.empty}>{model.recurring.emptyLabel}</p>
            ) : (
              <ul className={styles.rows}>
                {model.recurring.rows.map((row) => (
                  <li className={styles.recurringRow} key={row.key}>
                    <span className={styles.rowHead}>
                      <span className={styles.rowLabel}>
                        <SensitiveText>{row.label}</SensitiveText>
                      </span>
                      <span className={styles.rowAmount}>
                        <SensitiveAmount>
                          {row.amountPrefix}
                          {row.amount}
                        </SensitiveAmount>
                      </span>
                    </span>
                    <span className={styles.rowMeta}>{row.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <StabilityStatement container={model.stability.container ?? "none"} kind={model.stability.kind ?? "neutral"}>
            {model.stability.children}
          </StabilityStatement>

          <InformationBlock {...model.information} />
        </>
      )}
    </div>
  );
}
