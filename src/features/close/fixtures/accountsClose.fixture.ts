import type { CloseViewModel } from "../model";
import { CLOSE_INFORMATION, CLOSE_RAIL, closeHref } from "./shared";

/** Paso intermedio: cuentas activas y archivadas, con saldo inicial y final. */
export const accountsCloseFixture = {
  rail: CLOSE_RAIL,
  progressLabel: "Paso 2 de 7",
  stepNumber: 2,
  stepCount: 7,
  title: "Cómo quedaron tus cuentas",
  supportingLine: "Saldo al empezar, saldo al terminar y variación",
  intro: "Con cuánto empezó y con cuánto terminó cada cuenta en julio.",
  periods: null,
  blocks: [
    {
      id: "active-accounts",
      title: "Cuentas activas",
      supportingLine: "Saldo al cerrar el período, con el saldo inicial a la vista",
      rows: [
        {
          kind: "with-status",
          label: "Banco",
          supportingLabel: "Empezó en $312.000 · última actividad el 23 de julio",
          status: "Variación de $100.000",
          value: "412.000",
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Efectivo",
          supportingLabel: "Empezó en $106.500 · última actividad el 22 de julio",
          status: "Variación de -$20.000",
          value: "86.500",
          valuePrefix: "$",
        },
        {
          label: "Patrimonio al cerrar el período",
          supportingLabel: "Σ saldos de 3 cuentas, activas y archivadas",
          value: "538.500",
          valuePrefix: "$",
        },
      ],
      note: "El saldo inicial de cada cuenta se reconstruye desde el ledger: saldo de hoy menos lo registrado después del período. No se pide ajustar nada sin evidencia.",
      noteKind: "stable",
      actionLabel: "Ver cuentas",
      actionHref: "/cuentas",
    },
    {
      id: "archived-accounts",
      title: "Cuentas archivadas",
      supportingLine: "Conservan su historia, fuera del uso cotidiano",
      rows: [
        {
          kind: "with-status",
          label: "Cuenta vieja",
          supportingLabel: "Empezó en $40.000 · última actividad el 12 de mayo",
          status: "Sin movimientos en el período",
          value: "40.000",
          valuePrefix: "$",
        },
      ],
      note: "Sus saldos siguen dentro del patrimonio del período. Se muestran aparte para no leerlos como dinero operativo.",
      noteKind: "neutral",
    },
  ],
  warnings: [],
  notice: null,
  summary: null,
  nav: {
    backHref: closeHref("periodo"),
    backLabel: "Volver a qué período vas a revisar",
    nextHref: closeHref("movimientos"),
    nextLabel: "Continuar",
  },
  information: CLOSE_INFORMATION,
  empty: null,
} satisfies CloseViewModel;
