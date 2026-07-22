const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function hmac(secret: string, payload: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(payload));
}

export async function createAccessToken(secret: string, now = Date.now()): Promise<string> {
  const expiresAt = Math.floor(now / 1000) + 60 * 60 * 24 * 30;
  const payload = `doleth:${expiresAt}`;
  return `${expiresAt}.${toBase64Url(await hmac(secret, payload))}`;
}

export async function verifyAccessToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expiresText, signature] = token.split(".");
  const expiresAt = Number(expiresText);
  if (!expiresText || !signature || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const expected = toBase64Url(await hmac(secret, `doleth:${expiresAt}`));
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return mismatch === 0;
}

export async function secureTextEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let mismatch = 0;
  for (let index = 0; index < leftBytes.length; index += 1) mismatch |= leftBytes[index]! ^ rightBytes[index]!;
  return mismatch === 0;
}
