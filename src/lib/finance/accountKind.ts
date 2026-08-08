/**
 * Qué es cada tipo de cuenta.
 *
 * El catálogo estaba copiado en cinco lugares —el alta, el onboarding, /cuentas,
 * /ahora y /mi-realidad— y cada copia decidía por su cuenta cómo llamar a cada
 * tipo. Agregar la tarjeta de crédito habría creado una sexta oportunidad de que
 * el mismo tipo se llame distinto según la pantalla, así que primero se unifica.
 *
 * Acá vive además la única regla que cambia el significado de un saldo: si el
 * tipo es un pasivo. No es una etiqueta más; decide si ese dinero entra en "con
 * cuánto cuento".
 */

export const ACCOUNT_TYPES = ["CASH", "BANK", "WALLET", "SAVINGS", "CREDIT_CARD", "OTHER"] as const;

export type AccountKind = (typeof ACCOUNT_TYPES)[number];

export function isAccountKind(value: string): value is AccountKind {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

export const ACCOUNT_TYPE_LABELS: Record<AccountKind, string> = {
  CASH: "Efectivo",
  BANK: "Banco",
  WALLET: "Billetera virtual",
  SAVINGS: "Ahorro",
  CREDIT_CARD: "Tarjeta de crédito",
  OTHER: "Otra",
};

/** Etiqueta de un tipo, tolerante a un valor que el producto ya no reconozca. */
export const accountTypeLabel = (type: string): string =>
  isAccountKind(type) ? ACCOUNT_TYPE_LABELS[type] : "Cuenta";

/**
 * Tipos cuyo saldo es una deuda y no dinero disponible.
 *
 * Es una lista y no un booleano en la base a propósito: la respuesta se deriva
 * del tipo, así que no puede quedar desincronizada de él. Una columna aparte
 * podría decir "esto es una tarjeta que no es pasivo", que no significa nada.
 */
const LIABILITY_TYPES = new Set<AccountKind>(["CREDIT_CARD"]);

export const isLiabilityAccount = (type: string): boolean =>
  isAccountKind(type) && LIABILITY_TYPES.has(type);

/**
 * Qué significa el saldo de este tipo de cuenta, en una línea.
 *
 * Una tarjeta necesita explicación y una caja de efectivo no: un saldo negativo
 * en una tarjeta es lo normal, y en cualquier otra cuenta es un problema. Sin
 * esta distinción, la misma señal visual diría dos cosas opuestas.
 */
export const ACCOUNT_TYPE_HINTS: Partial<Record<AccountKind, string>> = {
  CREDIT_CARD:
    "El saldo de una tarjeta es lo que debés, no lo que tenés. No entra en el dinero disponible y se cancela cuando pagás el resumen.",
};
