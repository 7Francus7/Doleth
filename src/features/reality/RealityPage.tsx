"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AttentionBanner } from "../../design-system/composites/AttentionBanner";
import { FinancialRow } from "../../design-system/composites/FinancialRow";
import { InformationBlock } from "../../design-system/composites/InformationBlock";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { SystemRail } from "../../design-system/composites/SystemRail";
import { Divider } from "../../design-system/primitives/Divider";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { Surface } from "../../design-system/primitives/Surface";
import { TextLink } from "../../design-system/primitives/TextLink";
import { EvidenceBreakdownExperience } from "../evidence";
import type { RealityViewModel } from "./model";
import styles from "./RealityPage.module.css";

export interface RealityPageProps {
  model: RealityViewModel;
}

/** Rutas de cada acción. Navegación interna: la app no se recarga. */
const ACTION_ROUTES: Record<string, string> = {
  register: "/movimientos/nuevo",
  resolve: "/proximo",
  update: "/cuentas",
  "add-first-account": "/cuentas/nueva",
  changes: "/cambios",
  history: "/movimientos",
};

export function RealityPage({ model }: RealityPageProps) {
  const router = useRouter();
  const missingProps = styles.missing ? { className: styles.missing } : {};
  const informationProps = styles.information ? { className: styles.information } : {};

  const handleAction = (actionId: string) => {
    router.push(ACTION_ROUTES[actionId] ?? "/movimientos");
  };

  return (
    <main className="app-canvas">
      <h1 className={styles.screenTitle}>Mi realidad</h1>
      <div className={`app-canvas__content ${styles.content}`}>
        <SystemRail {...model.rail} />
        {model.banner ? <AttentionBanner {...model.banner} onAction={handleAction} /> : null}
        <EvidenceBreakdownExperience
          evidence={model.evidence}
          hero={model.hero}
          valueActionLabel="Ver cómo se calculó tu patrimonio"
        />

        {model.synthesis ? <p className={styles.synthesis}>{model.synthesis}</p> : null}

        <StabilityStatement {...model.stability} />

        {model.primaryAction ? (
          <Surface
            border="subtle"
            className={styles.primaryAction}
            padding="md"
            radius="lg"
            tone="base"
          >
            <p className={styles.primaryActionLine}>{model.primaryAction.supportingLine}</p>
            <Link className={styles.primaryActionLink} href={model.primaryAction.href}>
              {model.primaryAction.label}
            </Link>
          </Surface>
        ) : null}

        {model.sections.map((section) => (
          <section aria-label={section.title} id={`reality-${section.id}`} key={section.id}>
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              {section.actionHref && section.actionLabel ? (
                <SectionTitle
                  action="link"
                  actionHref={section.actionHref}
                  actionLabel={section.actionLabel}
                  support="line"
                  supportingLine={section.supportingLine}
                  title={section.title}
                />
              ) : (
                <SectionTitle
                  action="none"
                  support="line"
                  supportingLine={section.supportingLine}
                  title={section.title}
                />
              )}
              {section.notice ? (
                <p className={styles.notice} role="status">
                  {section.notice}
                </p>
              ) : null}
              {section.rows.length > 0 ? (
                <div className={styles.rows}>
                  {section.rows.map((row, index) => (
                    <div className={styles.unit} key={`${row.label}-${row.value}`}>
                      {index > 0 ? <Divider /> : null}
                      <FinancialRow {...row} />
                    </div>
                  ))}
                </div>
              ) : null}
              <p className={styles.sectionNote} data-kind={section.noteKind ?? "neutral"}>
                {section.note}
              </p>
            </Surface>
          </section>
        ))}

        {model.quality ? (
          <section aria-label={model.quality.title} id="reality-quality">
            <Surface border="subtle" className={styles.section} padding="md" radius="lg" tone="base">
              <SectionTitle
                action="none"
                support="line"
                supportingLine={model.quality.supportingLine}
                title={model.quality.title}
              />
              <p className={styles.qualityState}>
                <span className={styles.qualityLabel}>{model.quality.stateLabel}</span>
                <span className={styles.qualityRatio}>{model.quality.ratioLabel}</span>
              </p>
              <p className={styles.sectionNote} data-kind="neutral">
                {model.quality.summary}
              </p>
              {model.quality.notice ? (
                <p className={styles.notice} role="status">
                  {model.quality.notice}
                </p>
              ) : null}
              <ul className={styles.signals}>
                {model.quality.signals.map((signal) => (
                  <li className={styles.signal} data-state={signal.state} key={signal.id}>
                    <p className={styles.signalHead}>
                      <span aria-hidden="true" className={styles.signalMark} />
                      <span className={styles.signalLabel}>
                        {signal.label}
                        <span className={styles.signalStateText}>
                          {signal.state === "met" ? " · cumplida" : " · falta"}
                        </span>
                      </span>
                    </p>
                    <p className={styles.signalReading}>{signal.reading}</p>
                    <p className={styles.signalMatters}>{signal.matters}</p>
                    {signal.actionHref && signal.actionLabel ? (
                      <TextLink href={signal.actionHref} kind="standalone" showChevron>
                        {signal.actionLabel}
                      </TextLink>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Surface>
          </section>
        ) : null}

        {model.missing ? <InformationBlock {...model.missing} {...missingProps} /> : null}

        <div id="reality-evidence">
          <InformationBlock {...model.information} {...informationProps} />
        </div>
      </div>
    </main>
  );
}
