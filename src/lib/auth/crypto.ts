/**
 * Primitivas criptográficas compartidas.
 *
 * Sólo usa Web Crypto, así que este módulo funciona tanto en el runtime de Node
 * como en el proxy (edge). Nada de criptografía casera: HMAC-SHA256 y SHA-256
 * provistos por la plataforma.
 */

const encoder = new TextEncoder();

export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  return Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString("base64url");
}

/** Compara dos strings en tiempo constante respecto de su contenido. */
export function timingSafeEqualText(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

export async function hmacBase64Url(secret: string, payload: string): Promise<string> {
  return toBase64Url(await crypto.subtle.sign("HMAC", await importHmacKey(secret), encoder.encode(payload)));
}

/** SHA-256 en hexadecimal. Se usa para guardar tokens sin poder revertirlos. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Seudónimo estable y no reversible por fuerza bruta: el secreto de sesión actúa
 * como pepper, así que un volcado de la tabla de auditoría no permite recuperar
 * emails ni direcciones IP.
 */
export async function pseudonymize(value: string, secret: string): Promise<string> {
  return (await hmacBase64Url(secret, `doleth:pseudonym:${value}`)).slice(0, 32);
}

/** Token opaco de 256 bits, apto para sesiones y enlaces de un solo uso. */
export function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return toBase64Url(buffer);
}
