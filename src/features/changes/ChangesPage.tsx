"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SensitiveAmount, SensitiveText } from "../../components/privacy/AmountPrivacy";
import { ActionStrip } from "../../design-system/composites/ActionStrip";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { EvidenceBreakdownExperience } from "../evidence";
import type { ChangeCauseRow, ChangesViewModel } from "./model";
import styles from "./ChangesPage.module.css";

export interface ChangesPageProps {
  model: ChangesViewModel;
}

/** Rutas de cada acción. Navegación interna: la app no se recarga. */
const ACTION_ROUTES: Record<string, string> = {
  resolve: "/movimientos",
  register: "/movimientos/nuevo",
  "add-first-account": "/cuentas/nueva",
  upcoming: "/proximo",
  history: "/movimientos",
};

function CauseLine({ row }: { row: ChangeCauseRow }) {
  const content = (
    <>
      <span className={styles.causeCopy}>
        <span className={styles.causeLabel}>{row.label}</span>
        <span className={styles.causeMeta}>{row.supportingLabel}</span>
      </span>
      <span className={styles.causeAmount} data-direction={row.direction}>
        <SensitiveAmount>{row.valuePrefix}{row.value}</SensitiveAmount>
      </span>
    </>
  );

  if (!row.href) {
    return (
      <div className={styles.cause} data-material={row.material ? "true" : "false"}>
        {content}
      </div>
    );
  }

  return (
    <Link
      className={styles.cause}
      data-material={row.material ? "true" : "false"}
      href={row.href}
    >
      {content}
    </Link>
  );
}

export function ChangesPage({ model }: ChangesPageProps) {
  const router = useRouter();
  const actionProps = styles.actions ? { className: styles.actions } : {};
  const missingProps = styles.missing ? { className: styles.missing } : {};
  const informationProps = styles.information ? { className: styles.information } : {};

  const handleAction = (actionId: string) => {
    router.push(ACTION_ROUTES[actionId] ?? "/movimientos");
  };

  return (
    <main className="app-canvas">
      <h1 className={styles.screenTitle}>Cambios</h1>
      <div className={`app-canvas__content ${styles.content}`}>
        <SystemRail {...model.rail} />
        {model.banner ? <AttentionBanner {...model.banner} onAction={handleAction} /> : null}
        <EvidenceBreakdownExperience
          evidence={model.evidence}
          hero={model.hero}
          valueActionLabel="Ver cómo se calculó este cambio"
        />

        {model.notice ? (
          <p className={styles.notice} role="status">
            {model.notice}
          </p>
        ) : null}

        <section aria-label={model.comparison.title}>
          <Surface border="subtle" className={styles.comparison} padding="md" radius="lg" tone="base">
            <SectionTitle
              action="none"
              support="line"
              supportingLine={model.comparison.supportingLine}
              title={model.comparison.title}
            />
            <div className={styles.rows}>
              {model.comparison.rows.map((row, index) => (
                <div className={styles.unit} key={`${row.label}-${row.value}`}>
                  {index > 0 ? <Divider /> : null}
                  <FinancialRow {...row} />
                </div>
              ))}
            </div>
            <p className={styles.comparisonSummary} data-kind={model.comparison.summaryKind}>
              <SensitiveText>{model.comparison.summary}</SensitiveText>
            </p>
          </Surface>
        </section>

        <StabilityStatement {...model.stability} />
        {model.actions ? <ActionStrip {...model.actions} {...actionProps} onAction={handleAction} /> : null}

        {model.causes ? (
          <section aria-label={model.causes.title} id="changes-facts">
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              <SectionTitle
                action="none"
                support="line"
                supportingLine={model.causes.supportingLine}
                title={model.causes.title}
              />
              <ul className={styles.causes}>
                {model.causes.rows.map((row) => (
                  <li key={row.id}>
                    <CauseLine row={row} />
                  </li>
                ))}
              </ul>
              <p className={styles.causesNote}><SensitiveText>{model.causes.note}</SensitiveText></p>
            </Surface>
          </section>
        ) : null}

        {model.transfers ? <p className={styles.transfers}><SensitiveText>{model.transfers.line}</SensitiveText></p> : null}

        {model.missing ? <InformationBlock {...model.missing} {...missingProps} /> : null}

        <div id="changes-evidence">
          <InformationBlock {...model.information} {...informationProps} />
        </div>
      </div>
    </main>
  );
}
