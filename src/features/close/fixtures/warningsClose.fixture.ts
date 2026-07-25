import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/**
 * Paso de información faltante con advertencias reales. Ninguna bloquea la
 * revisión y ninguna pide inventar un dato para poder seguir.
 */
export const warningsCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 5 de 7",
  stepNumber: 5,
  stepCount: 7,
  title: "Qué información falta",
  supportingLine: "Señales faltantes, sin llamarlas errores",
  intro: "Ninguna de estas advertencias es un error, y ninguna te impide completar la revisión.",
  periods: null,
  blocks: [],
  warnings: [
    {
      id: "period-open",
      label: "El mes todavía está en curso",
      detail:
        "Podés revisarlo igual, pero las cifras van a cambiar con cada movimiento que registres hasta fin de mes.",
      severity: "info",
    },
    {
      id: "no-income",
      label: "Sin ingresos registrados",
      detail:
        "No encontramos ingresos en el período. Si cobraste y no lo registraste, el resultado del mes va a mostrar solo gastos.",
      severity: "review",
      actionLabel: "Registrar ingreso",
      actionHref: "/movimientos/nuevo",
    },
    {
      id: "uncategorized",
      label: "Movimientos sin categoría",
      detail:
        "2 movimientos no tienen categoría. Cuentan en el resultado igual; lo que no se puede es explicar por qué se gastó.",
      severity: "review",
      actionLabel: "Ver movimientos",
      actionHref: "/movimientos",
    },
    {
      id: "overdue",
      label: "Pagos vencidos sin confirmar",
      detail:
        "1 pago del período venció y sigue pendiente. Puede ser que ya lo hayas pagado y falte registrarlo.",
      severity: "review",
      actionLabel: "Revisar próximos pagos",
      actionHref: "/proximo",
    },
    {
      id: "archived-accounts",
      label: "Cuentas archivadas en el período",
      detail:
        "1 cuenta archivada conserva su historia y su saldo. Se muestran aparte del dinero operativo.",
      severity: "info",
    },
  ],
  notice: "Podés completar la revisión igualmente. Estas advertencias siguen visibles después.",
  summary: null,
  nav: {
    backHref: closeHref("compromisos"),
    backLabel: "Volver a qué pagos tenía el período",
    nextHref: closeHref("resultado"),
    nextLabel: "Continuar con las advertencias",
  },
  information: CLOSE_INFORMATION,
  empty: null,
} satisfies CloseViewModel;
