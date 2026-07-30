import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  PrivateBetaAccessError,
  bootstrapPrivateBetaAdmin,
  createPrivateBetaInvitation,
  issueAdministrativeRecovery,
} from "../../src/lib/auth/private-beta";
import { emailError, nameError, normalizeEmail } from "../../src/lib/auth/validation";

/**
 * Operaciones de acceso para la beta privada.
 *
 * Es un comando local, nunca una ruta web. Las escrituras exigen cuatro barreras:
 * modo private-beta, habilitación operativa temporal, hostname esperado exacto y
 * --confirm. Los enlaces sólo salen con --raw para poder canalizarlos directo al
 * portapapeles; nunca se imprimen en la salida descriptiva.
 */

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function operation(): string | undefined {
  return process.argv.slice(2).find((value) => !value.startsWith("--"));
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.length <= 2 ? local : `${local.slice(0, 2)}…`}@${domain}`;
}

function publicOrigin(): string {
  const raw = process.env.DOLETH_APP_URL?.trim();
  if (!raw) throw new Error("DOLETH_APP_URL es obligatoria para generar el enlace.");
  const parsed = new URL(raw);
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) {
    throw new Error("DOLETH_APP_URL debe usar HTTPS fuera de desarrollo local.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || !["", "/"].includes(parsed.pathname)) {
    throw new Error("DOLETH_APP_URL debe contener sólo el origen público.");
  }
  return parsed.origin;
}

function assertWriteGuard(connectionString: string): void {
  if (!process.argv.includes("--confirm")) {
    throw new Error("Simulación únicamente. Agregá --confirm para escribir.");
  }
  if (process.env.DOLETH_ADMIN_OPERATIONS_ENABLED !== "1") {
    throw new Error("DOLETH_ADMIN_OPERATIONS_ENABLED=1 es obligatoria para escribir.");
  }
  if (process.env.DOLETH_ACCESS_MODE !== "private-beta") {
    throw new Error("DOLETH_ACCESS_MODE=private-beta es obligatorio.");
  }

  const expectedHost = process.env.DOLETH_EXPECTED_DATABASE_HOST?.trim().toLowerCase();
  const actualHost = new URL(connectionString).hostname.toLowerCase();
  if (!expectedHost || actualHost !== expectedHost) {
    throw new Error("El hostname de DATABASE_URL no coincide con DOLETH_EXPECTED_DATABASE_HOST.");
  }
}

function privateLink(path: string, token: string): string {
  return `${publicOrigin()}${path}#token=${encodeURIComponent(token)}`;
}

function emitLink(link: string, description: string): void {
  if (!process.argv.includes("--raw")) {
    console.info(`✔ ${description}.`);
    console.info("  Enlace omitido. Volvé a ejecutar con --raw y canalizá stdout directo al portapapeles.");
    return;
  }
  process.stdout.write(`${link}\n`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");
  assertWriteGuard(connectionString);

  const command = operation();
  const email = normalizeEmail(argument("email") ?? "");
  const actorEmail = normalizeEmail(argument("actor-email") ?? "");
  const name = argument("name")?.trim() ?? "";

  if (!command || !["bootstrap-admin", "invite", "recover"].includes(command)) {
    throw new Error("Usá bootstrap-admin, invite o recover.");
  }
  if (emailError(email)) throw new Error("Falta --email con una dirección válida.");
  if (command === "bootstrap-admin" && nameError(name)) {
    throw new Error("Falta --name con un nombre válido.");
  }
  if (command !== "bootstrap-admin" && emailError(actorEmail)) {
    throw new Error("Falta --actor-email con el administrador activo.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    if (command === "bootstrap-admin") {
      const issued = await bootstrapPrivateBetaAdmin(prisma, { email, name });
      console.error(`Administrador inicial creado para ${maskEmail(email)}. Token: 30 minutos, un solo uso.`);
      emitLink(privateLink("/acceso-temporal", issued.token), "Administrador inicial preparado");
      return;
    }

    if (command === "invite") {
      const issued = await createPrivateBetaInvitation(prisma, {
        actorEmail,
        invitedEmail: email,
      });
      console.error(`Invitación creada para ${maskEmail(email)}. Vence ${issued.expiresAt.toISOString()}.`);
      emitLink(privateLink("/invitacion", issued.token), "Invitación privada preparada");
      return;
    }

    const issued = await issueAdministrativeRecovery(prisma, {
      actorEmail,
      targetEmail: email,
    });
    console.error(
      `Recuperación creada para ${maskEmail(email)}. Sesiones revocadas: ${issued.revokedSessions}. Token: 30 minutos, un solo uso.`,
    );
    emitLink(privateLink("/acceso-temporal", issued.token), "Recuperación administrativa preparada");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const reason =
    error instanceof PrivateBetaAccessError ? error.code : error instanceof Error ? error.message : "error_desconocido";
  console.error(`✖ ${reason}`);
  process.exitCode = 1;
});
