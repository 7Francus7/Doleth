import "server-only";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { EvidenceBreakdown } from "../../evidence/model";
import { formatCents } from "../../../lib/finance/domain";
import { computeReality, type RealityResult } from "../../../lib/finance/analysis";
import { getRealityData } from "../../../lib/finance/data";
import type { RealityViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");

const completenessLabel: Record<RealityResult["completeness"], string> = {
  empty: "Base incompleta",
  initial: "Información inicial",
  partial: "Realidad parcialmente representada",
  sufficient: "Información suficiente para análisis",
};

function missingSignalsCopy(result: RealityResult): string {
  const missing: string[] = [];
  if (!result.signals.hasMovements) missing.push("registrar un movimiento");
  if (!result.signals.hasIncome) missing.push("confirmar un ingreso");
  if (!result.signals.hasUpcoming) missing.push("anotar un pago próximo");
  if (!result.signals.hasInvestment) missing.push("sumar una inversión");
  if (missing.length === 0) return "Tu realidad está representada con la información disponible.";
  return `Para completar la lectura falta ${missing.join(", ")}.`;
}

export async function getRealityModel(): Promise<RealityViewModel> {
  const data = await getRealityData();
  const reality = computeReality({
    accounts: data.accounts,
    investments: data.investments,
    committedCents: data.committedCents,
    upcomingCount: data.upcomingCount,
    hasMovements: data.hasMovements,
    hasIncome: data.hasIncome,
  });

  const hasAccounts = reality.signals.hasAccount;
  const isSufficient = reality.completeness === "sufficient";
  const label = completenessLabel[reality.completeness];
  const metadata = ["Corte de hoy", "ARS", "Personal", label] as const;
  const railState = isSufficient ? "complete" : "partial";

  const evidence: EvidenceBreakdown | null = hasAccounts
    ? {
        status: "complete",
        title: "Saldos que componen tu patrimonio",
        subtitle: "Saldo inicial más movimientos no anulados",
        lines: data.accounts.map((account) => ({
          id: account.id,
          label: account.name,
          amount: Number(account.balanceCents),
          displayValue: money(account.balanceCents),
          valuePrefix: "$",
          ...(account.balanceCents < 0n ? { sign: "-" as const } : { sign: "+" as const }),
          status: "confirmed" as const,
        })),
        total: {
          label: "Patrimonio",
          amount: Number(reality.patrimonyCents),
          displayValue: money(reality.patrimonyCents),
          valuePrefix: prefix(reality.patrimonyCents),
        },
        metadata,
      }
    : null;

  const domainRows: FinancialRowProps[] = [];
  if (hasAccounts) {
    domainRows.push({
      kind: "with-status",
      label: "Cuentas activas",
      supportingLabel: `${reality.activeCount} ${reality.activeCount === 1 ? "cuenta" : "cuentas"} · dinero disponible`,
      status: "Saldos confirmados",
      value: money(reality.activeCents),
      valuePrefix: prefix(reality.activeCents),
    });
  }
  if (reality.archivedCount > 0) {
    domainRows.push({
      kind: "with-status",
      label: "Cuentas archivadas",
      supportingLabel: `${reality.archivedCount} ${reality.archivedCount === 1 ? "cuenta" : "cuentas"} · conservan su historia`,
      status: "Incluidas en el patrimonio",
      value: money(reality.archivedCents),
      valuePrefix: prefix(reality.archivedCents),
    });
  }
  if (reality.investmentCount > 0) {
    domainRows.push({
      kind: "with-status",
      label: "Inversiones",
      supportingLabel: `${reality.investmentCount} ${reality.investmentCount === 1 ? "posición" : "posiciones"} · dominio separado`,
      status: "No suma al patrimonio en cuentas",
      value: money(reality.investedCents),
      valuePrefix: "$",
    });
  }
  if (reality.upcomingCount > 0) {
    domainRows.push({
      kind: "with-status",
      label: "Pagos próximos",
      supportingLabel: `${reality.upcomingCount} ${reality.upcomingCount === 1 ? "compromiso" : "compromisos"} · pendientes`,
      status: "No se descuenta del patrimonio",
      value: money(reality.committedCents),
      valuePrefix: "$",
    });
  }

  const hero: RealityViewModel["hero"] = hasAccounts
    ? {
        scenario: reality.patrimonyCents < 0n ? "attention" : "stable",
        stateText:
          reality.patrimonyCents < 0n
            ? "Tu base registrada está en negativo."
            : "Tu situación está compuesta por objetos ya registrados.",
        value: money(reality.patrimonyCents),
        valuePrefix: prefix(reality.patrimonyCents),
        valueLabel: "Patrimonio en cuentas",
        inlineNote: "Las inversiones y los compromisos se muestran como dominios separados.",
        coverage: {
          title: "Calidad de la información",
          value: Math.round((reality.metSignals / 5) * 100),
          leftSummary: label,
          rightSummary: `${reality.metSignals} de 5 señales`,
          state: isSufficient ? "stable" : "partial",
        },
      }
    : {
        scenario: "new",
        stateText: "Empecemos por tu base real.",
        valueLabel: "Creá tu primera cuenta y cargá su saldo inicial.",
      };

  return {
    rail: { items: metadata, state: railState, wrap: "truncate" },
    banner: null,
    hero,
    evidence,
    composition: {
      title: "Composición de tu situación",
      supportingLine: "Lo registrado en cuentas y lo que queda comprometido",
      rows: [
        {
          label: "Patrimonio en cuentas",
          supportingLabel: `${reality.activeCount + reality.archivedCount} ${reality.activeCount + reality.archivedCount === 1 ? "cuenta" : "cuentas"} · activas y archivadas`,
          value: money(reality.patrimonyCents),
          valuePrefix: prefix(reality.patrimonyCents),
        },
        {
          kind: "with-status",
          label: "Comprometido próximo",
          supportingLabel: `${reality.upcomingCount} ${reality.upcomingCount === 1 ? "pago pendiente" : "pagos pendientes"}`,
          status: "Se muestra aparte, no se resta",
          value: money(reality.committedCents),
          valuePrefix: "$",
        },
      ],
      summary: hasAccounts
        ? "El patrimonio se reconcilia con los saldos de tus cuentas; los compromisos y las inversiones se muestran como dominios separados."
        : "Sin cuentas todavía no hay una base patrimonial que componer.",
      summaryKind: hasAccounts ? "stable" : "neutral",
      ...(hasAccounts ? { actionLabel: "Ver evidencia", actionHref: "#reality-evidence" } : {}),
    },
    stability: {
      children: hasAccounts
        ? "Cada dominio proviene de objetos registrados: cuentas, inversiones y compromisos localizables."
        : "Creá tu primera cuenta para empezar a representar tu realidad.",
      container: "none",
      kind: hasAccounts ? "stable" : "neutral",
    },
    actions: null,
    domains: domainRows.length
      ? { title: "Dominios de tu situación", rows: domainRows }
      : null,
    missing: isSufficient
      ? null
      : {
          title: hasAccounts ? "Tu realidad está parcialmente representada" : "Falta tu base financiera",
          primaryLine: hasAccounts
            ? missingSignalsCopy(reality)
            : "Sin cuentas registradas no hay patrimonio ni composición para mostrar.",
          causalLine: hasAccounts
            ? "Cuanta más información real cargues, más completa es la lectura de tu situación."
            : "Creá al menos una cuenta con su saldo inicial para habilitar esta pantalla.",
          linkLabel: hasAccounts ? "Registrar movimiento" : "Crear cuenta",
          linkHref: hasAccounts ? "/movimientos/nuevo" : "/cuentas/nueva",
          state: "partial",
        },
    information: {
      title: "Fuente de esta composición",
      primaryLine: "No usa saldos editables ni cifras simuladas.",
      causalLine:
        "El patrimonio se deriva del saldo inicial y del ledger, excluyendo movimientos anulados. Inversiones y compromisos se contabilizan por separado.",
      linkLabel: "Ver cuentas",
      linkHref: "/cuentas",
      state: isSufficient ? "complete" : "partial",
    },
  };
}
