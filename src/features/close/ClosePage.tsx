import Link from "next/link";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { EmptyState } from "../../design-system/feedback";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { TextLink } from "../../design-system/primitives/TextLink";
import type { CloseViewModel } from "./model";
import styles from "./ClosePage.module.css";

export interface ClosePageProps {
  model: CloseViewModel;
}

/**
 * Revisión mensual. Una etapa por pantalla, progreso textual ("Paso 2 de 7") en
 * vez de un stepper apretado, y navegación con enlaces reales para que el paso
 * viva en la URL: se puede volver con el botón del navegador y compartir.
 *
 * No es un client component a propósito: no tiene estado ni efectos, así que no
 * hace falta enviar JavaScript para renderizarla.
 */
export function ClosePage({ model }: ClosePageProps) {
  if (model.empty) {
    return (
      <main className="app-canvas">
        <h1 className={styles.screenTitle}>Revisión del mes</h1>
        <div className={`app-canvas__content ${styles.content}`}>
          <EmptyState
            description={model.empty.description}
            primaryAction={
              <Link className={styles.primaryLink} href={model.empty.actionHref}>
                {model.empty.actionLabel}
              </Link>
            }
            title={model.empty.title}
          />
          <TextLink href="/mi-realidad" kind="standalone" showChevron>
            Volver a Mi realidad
          </TextLink>
        </div>
      </main>
    );
  }

  return (
    <main className="app-canvas">
      <h1 className={styles.screenTitle}>Revisión del mes</h1>
      <div className={`app-canvas__content ${styles.content}`}>
        <SystemRail {...model.rail} />

        <header className={styles.header}>
          <p aria-live="polite" className={styles.progress}>
            {model.progressLabel}
          </p>
          <h2 className={styles.title}>{model.title}</h2>
          <p className={styles.support}>{model.supportingLine}</p>
          <p className={styles.intro}>{model.intro}</p>
        </header>

        {model.periods ? (
          <section aria-label="Período a revisar">
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              <SectionTitle title="Elegí el período" />
              <ul className={styles.periods}>
                {model.periods.map((period) => (
                  <li key={period.month}>
                    <Link
                      aria-current={period.selected ? "true" : undefined}
                      className={styles.period}
                      data-selected={period.selected ? "true" : "false"}
                      href={period.href}
                    >
                      <span className={styles.periodLabel}>
                        {period.label}
                        <span className={styles.periodState}>
                          {period.selected ? " · elegido" : ""}
                        </span>
                      </span>
                      <span className={styles.periodDetail}>{period.detail}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className={styles.note} data-kind="neutral">
                En este corte se revisan meses civiles: el mes en curso o el anterior.
              </p>
            </Surface>
          </section>
        ) : null}

        {model.blocks.map((block) => (
          <section aria-label={block.title} key={block.id}>
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              {block.actionHref && block.actionLabel ? (
                <SectionTitle
                  action="link"
                  actionHref={block.actionHref}
                  actionLabel={block.actionLabel}
                  support="line"
                  supportingLine={block.supportingLine}
                  title={block.title}
                />
              ) : (
                <SectionTitle
                  action="none"
                  support="line"
                  supportingLine={block.supportingLine}
                  title={block.title}
                />
              )}
              {block.notice ? (
                <p className={styles.notice} role="status">
                  {block.notice}
                </p>
              ) : null}
              {block.rows.length > 0 ? (
                <div className={styles.rows}>
                  {block.rows.map((row, index) => (
                    <div className={styles.unit} key={`${row.label}-${row.value}`}>
                      {index > 0 ? <Divider /> : null}
                      <FinancialRow {...row} />
                    </div>
                  ))}
                </div>
              ) : null}
              <p className={styles.note} data-kind={block.noteKind ?? "neutral"}>
                {block.note}
              </p>
            </Surface>
          </section>
        ))}

        {model.warnings.length > 0 ? (
          <section aria-label="Advertencias del período">
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              <SectionTitle
                action="none"
                support="line"
                supportingLine="Ninguna te impide completar la revisión"
                title="Qué conviene mirar"
              />
              <ul className={styles.warnings}>
                {model.warnings.map((warning) => (
                  <li className={styles.warning} data-severity={warning.severity} key={warning.id}>
                    <p className={styles.warningHead}>
                      <span aria-hidden="true" className={styles.warningMark} />
                      <span className={styles.warningLabel}>
                        {warning.label}
                        <span className={styles.warningSeverity}>
                          {warning.severity === "review" ? " · para revisar" : " · informativa"}
                        </span>
                      </span>
                    </p>
                    <p className={styles.warningDetail}>{warning.detail}</p>
                    {warning.actionHref && warning.actionLabel ? (
                      <TextLink href={warning.actionHref} kind="standalone" showChevron>
                        {warning.actionLabel}
                      </TextLink>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Surface>
          </section>
        ) : null}

        {model.notice ? (
          <p className={styles.notice} role="status">
            {model.notice}
          </p>
        ) : null}

        {model.summary ? (
          <section aria-label={model.summary.title}>
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              <SectionTitle title={model.summary.title} />
              <p className={styles.note} data-kind="neutral">
                {model.summary.statement}
              </p>
              <div className={styles.rows}>
                {model.summary.rows.map((row, index) => (
                  <div className={styles.unit} key={`${row.label}-${row.value}`}>
                    {index > 0 ? <Divider /> : null}
                    <FinancialRow {...row} />
                  </div>
                ))}
              </div>
              <ul className={styles.summaryActions}>
                {model.summary.actions.map((action) => (
                  <li key={action.id}>
                    <Link className={styles.summaryAction} href={action.href}>
                      {action.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Surface>
          </section>
        ) : null}

        <nav aria-label="Pasos de la revisión" className={styles.nav}>
          {model.nav.nextHref && model.nav.nextLabel ? (
            <Link className={styles.primaryLink} href={model.nav.nextHref}>
              {model.nav.nextLabel}
            </Link>
          ) : null}
          {model.nav.backHref && model.nav.backLabel ? (
            <Link className={styles.backLink} href={model.nav.backHref}>
              {model.nav.backLabel}
            </Link>
          ) : null}
        </nav>

        <InformationBlock
          {...model.information}
          {...(styles.information ? { className: styles.information } : {})}
        />
      </div>
    </main>
  );
}
