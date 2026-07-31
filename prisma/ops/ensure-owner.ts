import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/auth/password";

/**
 * Identificación o alta del usuario owner.
 *
 * El owner NO se deduce por "primer usuario" ni por orden de creación: se indica
 * explícitamente por correo.
 *
 * Cuando hay que crearlo, se usa un flujo de invitación:
 *   - Se crea en `PENDING_VERIFICATION` con una contraseña aleatoria de 32 bytes
 *     que se descarta en el acto. Nadie la conoce, no se imprime, no se guarda y
 *     no se puede iniciar sesión con ella.
 *   - La persona establece su credencial desde `/olvide-mi-contrasena`, que envía
 *     el correo real por el mismo camino que usa cualquier usuario. Al completar
 *     el restablecimiento, la cuenta pasa a ACTIVE y el correo queda verificado,
 *     porque abrir ese enlace demuestra control de la dirección.
 *
 * Nunca marca un correo como verificado por su cuenta: eso requiere una decisión
 * humana explícita con `--mark-verified`, que queda registrada en la salida.
 *
 * Uso:
 *   pnpm db:ensure-owner -- --email=vos@ejemplo.com                  # sólo inspecciona
 *   pnpm db:ensure-owner -- --email=vos@ejemplo.com --name="Nombre" --create
 */

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

/** Misma normalización que `src/lib/auth/validation.ts`. */
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().normalize("NFKC");
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.length <= 2 ? local : `${local.slice(0, 2)}…`;
  return `${visible}@${domain}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const email = normalizeEmail(argument("email") ?? process.env.DOLETH_OWNER_EMAIL ?? "");
  const name = argument("name")?.trim();
  const create = process.argv.includes("--create");
  const markVerified = process.argv.includes("--mark-verified");

  if (!email) throw new Error("Falta --email (o DOLETH_OWNER_EMAIL).");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // Se busca sobre el correo normalizado, no sobre el valor crudo: dos filas
    // que sólo difieran en mayúsculas o espacios tienen que salir a la luz acá.
    const matches = await prisma.$queryRaw<
      { id: string; email: string; status: string; verified: Date | null; created: Date }[]
    >`
      SELECT id, email, status::text AS status, "emailVerifiedAt" AS verified, "createdAt" AS created
      FROM "User" WHERE lower(btrim(email)) = ${email}
      ORDER BY "createdAt"
    `;

    if (matches.length > 1) {
      console.error(`✖ Hay ${matches.length} usuarios cuyo correo normaliza a ${maskEmail(email)}:`);
      for (const match of matches) console.error(`   id=${match.id} estado=${match.status} alta=${match.created.toISOString()}`);
      throw new Error("Ambigüedad de identidad. Resolvela a mano antes de continuar.");
    }

    if (matches.length === 1) {
      const owner = matches[0]!;
      console.info("✔ Owner ya existente.");
      console.info(`  id:              ${owner.id}`);
      console.info(`  correo:          ${maskEmail(owner.email)}`);
      console.info(`  estado:          ${owner.status}`);
      console.info(`  correo verificado: ${owner.verified ? "sí" : "no"}`);

      if (markVerified && !owner.verified) {
        // Decisión humana explícita: sólo con la bandera y sólo si no lo estaba.
        await prisma.user.update({
          where: { id: owner.id },
          data: { status: "ACTIVE", emailVerifiedAt: new Date() },
        });
        console.warn("\n⚠ DECISIÓN MANUAL REGISTRADA: se marcó el correo como verificado con --mark-verified.");
        console.warn("  Documentá quién tomó esta decisión y por qué en el freeze del corte.");
      } else if (!owner.verified) {
        console.info("\n  Para activar la cuenta sin intervención manual:");
        console.info("  entrá a /olvide-mi-contrasena con ese correo y completá el restablecimiento.");
      }

      console.info(`\nOWNER_ID=${owner.id}`);
      return;
    }

    // ---- No existe -------------------------------------------------------
    if (!create) {
      console.info(`✖ No existe ningún usuario con el correo ${maskEmail(email)}.`);
      console.info("\n  Opción recomendada: creá la cuenta desde /crear-cuenta en la aplicación.");
      console.info("  Opción alternativa (invitación): volvé a correr esto con --create --name=\"Tu nombre\".");
      process.exitCode = 1;
      return;
    }

    if (!name || name.length < 2) throw new Error("Para crear el owner hace falta --name con al menos 2 caracteres.");

    // Contraseña aleatoria descartada en el acto: nadie la conoce, ni siquiera
    // este proceso después de esta línea. El acceso se establece por el flujo de
    // recuperación, que envía el correo real.
    const throwaway = randomBytes(32).toString("base64url");
    const owner = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(throwaway),
        status: "PENDING_VERIFICATION",
      },
    });

    console.info("✔ Owner creado por invitación.");
    console.info(`  id:      ${owner.id}`);
    console.info(`  correo:  ${maskEmail(owner.email)}`);
    console.info(`  estado:  ${owner.status}`);
    console.info("\n  No se generó ninguna contraseña conocida. Para establecer el acceso:");
    console.info("   1. Entrá a /olvide-mi-contrasena con ese correo.");
    console.info("   2. Abrí el enlace que llega por correo y elegí una contraseña.");
    console.info("   3. Al completarlo, la cuenta queda ACTIVE y el correo verificado.");
    console.info(`\nOWNER_ID=${owner.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
