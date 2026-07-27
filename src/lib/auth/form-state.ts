import type { FieldErrors } from "./validation";

/**
 * Estados de formulario compartidos entre las Server Actions y los componentes
 * de cliente.
 *
 * Viven fuera de los archivos `"use server"` porque esos módulos sólo pueden
 * exportar funciones asíncronas: un objeto exportado allí rompe el build.
 */

export interface AuthFormState {
  status: "idle" | "error" | "success";
  message: string;
  errors: FieldErrors;
}

export const emptyAuthState: AuthFormState = { status: "idle", message: "", errors: {} };

/** Mismo contrato que `AuthFormState`; se nombra aparte para las pantallas de cuenta. */
export type AccountState = AuthFormState;

export const emptyAccountState: AccountState = { status: "idle", message: "", errors: {} };

export interface OnboardingState {
  status: "idle" | "error";
  message: string;
  errors: Record<string, string>;
}

export const emptyOnboardingState: OnboardingState = { status: "idle", message: "", errors: {} };
