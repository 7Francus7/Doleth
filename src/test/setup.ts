import { config as loadEnv } from "dotenv";
import { resolveTestDatabaseUrl } from "./database-url";

// Las pruebas de integración leen la misma configuración local que `prisma`.
// `dotenv` no pisa lo que ya está en el entorno, así que CI manda sobre el archivo.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

/**
 * La base de pruebas se resuelve **sólo** desde `TEST_DATABASE_URL`.
 *
 * `DATABASE_URL` puede venir de `.env.local` y apuntar a una base administrada —en
 * este proyecto, a la de producción—. Las pruebas de integración crean y borran
 * usuarios, cuentas y movimientos, así que su valor se descarta acá y no llega
 * nunca a Prisma. Ver `database-url.ts` para las reglas y `database-url.test.ts`
 * para las regresiones.
 */
const testDatabaseUrl = resolveTestDatabaseUrl(process.env);

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
} else {
  delete process.env.DATABASE_URL;
}

// Valor determinista para que la seudonimización de la auditoría sea reproducible.
process.env.DOLETH_SESSION_SECRET ??= "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres";
process.env.DOLETH_APP_URL ??= "http://localhost:3000";
process.env.DOLETH_EMAIL_TRANSPORT ??= "console";
process.env.DOLETH_ACCESS_MODE ??= "public";
