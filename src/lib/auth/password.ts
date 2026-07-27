import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}

/**
 * Doleth hashea contraseñas con scrypt (RFC 7914) usando los parámetros mínimos
 * recomendados por OWASP: N=2^16, r=8, p=2 (~64 MiB por hash).
 *
 * Elegimos scrypt sobre Argon2id de forma consciente: Argon2id requiere un módulo
 * nativo (`@node-rs/argon2` o `argon2`) y este proyecto se despliega en runtimes
 * serverless donde los binarios nativos son una fuente recurrente de fallas de
 * build. scrypt viene en Node, es memory-hard y está aceptado por OWASP como
 * alternativa equivalente cuando Argon2id no está disponible.
 *
 * El hash guarda su propio algoritmo y parámetros (`scrypt$N$r$p$salt$hash`), así
 * que migrar a Argon2id más adelante es agregar un verificador y rehashear en el
 * próximo login exitoso: no hace falta tocar la base ni invalidar contraseñas.
 *
 * Este módulo NO lleva el guard `server-only` a propósito: es cálculo puro sobre
 * strings, sin secretos de entorno ni acceso a cookies, y el instrumental de
 * migración (`prisma/ops/`) necesita hashear con exactamente el mismo algoritmo
 * que la aplicación. Los módulos que sí tocan secretos —`config`, `email`,
 * `session`, `audit`— conservan el guard.
 */
const ALGORITHM = "scrypt";
const COST = 2 ** 16;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 2;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
// scrypt necesita aproximadamente 128 * N * r bytes; damos margen para no fallar.
const MAX_MEMORY = 192 * 1024 * 1024;

function derive(password: string, salt: Buffer, cost: number, blockSize: number, parallelization: number) {
  return scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: MAX_MEMORY,
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await derive(password, salt, COST, BLOCK_SIZE, PARALLELIZATION);
  return [
    ALGORITHM,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export interface PasswordVerification {
  valid: boolean;
  /** true cuando el hash usa parámetros viejos y conviene regenerarlo al iniciar sesión. */
  needsRehash: boolean;
}

export async function verifyPassword(password: string, stored: string): Promise<PasswordVerification> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return { valid: false, needsRehash: false };

  const cost = Number(parts[1]);
  const blockSize = Number(parts[2]);
  const parallelization = Number(parts[3]);
  const salt = Buffer.from(parts[4] ?? "", "base64url");
  const expected = Buffer.from(parts[5] ?? "", "base64url");

  if (
    !Number.isSafeInteger(cost) ||
    !Number.isSafeInteger(blockSize) ||
    !Number.isSafeInteger(parallelization) ||
    cost < 2 ** 14 ||
    cost > 2 ** 20 ||
    salt.length === 0 ||
    expected.length !== KEY_LENGTH
  ) {
    return { valid: false, needsRehash: false };
  }

  const derived = await derive(password, salt, cost, blockSize, parallelization);
  const valid = timingSafeEqual(derived, expected);
  const outdated = cost !== COST || blockSize !== BLOCK_SIZE || parallelization !== PARALLELIZATION;
  return { valid, needsRehash: valid && outdated };
}

/**
 * Hash descartable con el mismo costo que uno real. Se usa cuando el email no
 * existe, para que el tiempo de respuesta del login no delate qué cuentas existen.
 */
const DECOY_HASH_PROMISE = hashPassword("doleth-decoy-password-never-used");

export async function consumeTimingDecoy(password: string): Promise<void> {
  await verifyPassword(password, await DECOY_HASH_PROMISE);
}
