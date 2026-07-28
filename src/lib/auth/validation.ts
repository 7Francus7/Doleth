/**
 * Esquemas de validación compartidos entre cliente y servidor.
 *
 * El repositorio no usa librerías de validación, así que mantenemos el mismo
 * estilo: funciones puras, sin dependencias, devolviendo errores por campo. Se
 * importan tanto desde componentes de cliente (para feedback inmediato) como
 * desde las Server Actions, que son las que realmente deciden.
 */

export type FieldErrors = Record<string, string>;

export interface ValidationResult<T> {
  ok: boolean;
  values: T;
  errors: FieldErrors;
}

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 200;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 80;

/** Normaliza para comparar y guardar: sin espacios, en minúsculas, forma NFKC. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().normalize("NFKC");
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function emailError(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (!email) return "Ingresá tu correo.";
  if (email.length > 254) return "El correo es demasiado largo.";
  if (!EMAIL_PATTERN.test(email)) return "Ingresá un correo válido.";
  return null;
}

export function nameError(raw: string): string | null {
  const name = raw.trim();
  if (!name) return "Ingresá tu nombre.";
  if (name.length < NAME_MIN_LENGTH) return `Usá al menos ${NAME_MIN_LENGTH} caracteres.`;
  if (name.length > NAME_MAX_LENGTH) return `Usá hasta ${NAME_MAX_LENGTH} caracteres.`;
  return null;
}

export type PasswordStrength = "weak" | "fair" | "strong";

export interface PasswordAssessment {
  strength: PasswordStrength;
  label: string;
  /** 0 a 3, para dibujar el indicador sin recalcular en el componente. */
  score: number;
}

const COMMON_PASSWORDS = new Set([
  "contrasena",
  "contraseña",
  "password",
  "password1",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "iloveyou",
  "argentina",
  "doleth",
  "doleth123",
  "administrador",
]);

/**
 * Política deliberadamente simple: longitud primero, variedad después. Sin exigir
 * símbolos obligatorios, que es lo que empuja a la gente a `Password1!`.
 */
export function passwordError(raw: string): string | null {
  if (!raw) return "Ingresá una contraseña.";
  if (raw.length < PASSWORD_MIN_LENGTH) return `Usá al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (raw.length > PASSWORD_MAX_LENGTH) return "La contraseña es demasiado larga.";
  const normalized = raw.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) return "Esa contraseña es demasiado común. Elegí otra.";
  if (/^(.)\1+$/.test(raw)) return "Repetir un mismo carácter no protege la cuenta.";
  return null;
}

export function assessPassword(raw: string): PasswordAssessment {
  if (!raw) return { strength: "weak", label: "Sin contraseña", score: 0 };
  let points = 0;
  if (raw.length >= PASSWORD_MIN_LENGTH) points += 1;
  if (raw.length >= 14) points += 1;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(raw)).length;
  if (variety >= 2) points += 1;
  if (variety >= 3) points += 1;
  if (passwordError(raw)) points = Math.min(points, 1);

  if (points <= 1) return { strength: "weak", label: "Débil", score: 1 };
  if (points <= 2) return { strength: "fair", label: "Aceptable", score: 2 };
  return { strength: "strong", label: "Sólida", score: 3 };
}

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  acceptedTerms: boolean;
}

export function validateRegistration(input: RegistrationInput): ValidationResult<RegistrationInput> {
  const errors: FieldErrors = {};
  const name = nameError(input.name);
  if (name) errors.name = name;
  const email = emailError(input.email);
  if (email) errors.email = email;
  const password = passwordError(input.password);
  if (password) errors.password = password;
  else if (input.password !== input.passwordConfirmation) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }
  if (!input.acceptedTerms) errors.acceptedTerms = "Necesitamos tu aceptación para crear la cuenta.";

  return {
    ok: Object.keys(errors).length === 0,
    values: { ...input, name: input.name.trim(), email: normalizeEmail(input.email) },
    errors,
  };
}

export interface NewPasswordInput {
  password: string;
  passwordConfirmation: string;
}

export function validateNewPassword(input: NewPasswordInput): ValidationResult<NewPasswordInput> {
  const errors: FieldErrors = {};
  const password = passwordError(input.password);
  if (password) errors.password = password;
  else if (input.password !== input.passwordConfirmation) {
    errors.passwordConfirmation = "Las contraseñas no coinciden.";
  }
  return { ok: Object.keys(errors).length === 0, values: input, errors };
}

const SUPPORTED_CURRENCIES = ["ARS"] as const;
const SUPPORTED_TIME_ZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Argentina/Salta",
  "America/Argentina/Tucuman",
  "America/Montevideo",
  "America/Santiago",
  "Europe/Madrid",
] as const;
const SUPPORTED_LOCALES = ["es-AR", "es-ES"] as const;

export const currencyOptions = SUPPORTED_CURRENCIES;
export const timeZoneOptions = SUPPORTED_TIME_ZONES;
export const localeOptions = SUPPORTED_LOCALES;

export function isSupportedCurrency(value: string): value is (typeof SUPPORTED_CURRENCIES)[number] {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function isSupportedTimeZone(value: string): value is (typeof SUPPORTED_TIME_ZONES)[number] {
  return (SUPPORTED_TIME_ZONES as readonly string[]).includes(value);
}

export function isSupportedLocale(value: string): value is (typeof SUPPORTED_LOCALES)[number] {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
