import Link from "next/link";
import { AllocationChart } from "../../design-system/composites/AllocationChart";
import { NumericValue } from "../../design-system/primitives/NumericValue";
import { SectionTitle } from "../../design-system/primitives/SectionTitle";
import { StabilityStatement } from "../../design-system/composites/StabilityStatement";
import { Surface } from "../../design-system/primitives/Surface";
import { OperationalShell } from "../../components/finance/OperationalShell";
import financeStyles from "../../components/finance/finance.module.css";
import type { InvestmentsViewModel } from "./model";
import styles from "./InvestmentsPage.module.css";

export interface InvestmentsPageProps {
  model: InvestmentsViewModel;
}

export function InvestmentsPage({ model }: InvestmentsPageProps) {
  return (
    <OperationalShell
      eyebrow="Patrimonio en riesgo"
      title="Inversiones"
      intro={model.stateText}
      actions={
        <Link className={financeStyles.primaryLink} href="/inversiones/nueva">
          Registrar inversión
        </Link>
      }
    >
      {model.hasInvestments ? (
        <>
          <Surface border="subtle" className={styles.hero} padding="lg" radius="xl" tone="raised" elevation="soft">
            <div className={styles.heroTop}>
              <div>
                <p className={styles.heroLabel}>{model.total.label}</p>
                <NumericValue prefix={model.total.valuePrefix} size="xl" value={model.total.value} />
              </div>
              {model.performance ? (
                <div className={styles.gain} data-state={model.performance.state}>
                  <span className={styles.gainPercent}>{model.performance.gainPercentLabel}</span>
                  <span className={styles.gainAmount}>
                    {model.performance.gainPrefix}{model.performance.gain}
                  </span>
                </div>
              ) : null}
            </div>
            {model.performance ? (
              <p className={styles.investedLine}>
                Aportado: <strong>${model.performance.invested}</strong>
              </p>
            ) : null}
          </Surface>

          <Surface border="subtle" className={styles.card} padding="md" radius="lg" tone="base">
            <SectionTitle title="Distribución por clase de activo" />
            <AllocationChart
              segments={model.segments}
              total={model.total.value}
              totalPrefix={model.total.valuePrefix}
              totalLabel={model.total.label}
            />
          </Surface>

          <Surface border="subtle" className={styles.card} padding="md" radius="lg" tone="base">
            <SectionTitle action="link" actionHref="/inversiones/nueva" actionLabel="Agregar" title="Mis inversiones" />
            <ul className={styles.holdings}>
              {model.holdings.map((holding) => (
                <li className={styles.holding} key={holding.id}>
                  <div className={styles.holdingCopy}>
                    <span className={styles.holdingName}>{holding.name}</span>
                    <span className={styles.holdingMeta}>
                      {holding.kindLabel} · aportado ${holding.invested}
                    </span>
                  </div>
                  <div className={styles.holdingValues}>
                    <NumericValue prefix={holding.valuePrefix} size="sm" value={holding.value} />
                    <span className={styles.holdingDelta} data-state={holding.deltaState}>
                      {holding.deltaLabel}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Surface>

          <StabilityStatement container="none" kind="neutral">
            {model.stability}
          </StabilityStatement>
        </>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyLead}>{model.stability}</p>
          <Link className={financeStyles.primaryLink} href="/inversiones/nueva">
            Registrar primera inversión
          </Link>
        </div>
      )}
    </OperationalShell>
  );
}
