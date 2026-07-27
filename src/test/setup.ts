import { config as loadEnv } from "dotenv";

// Las pruebas de integración usan la misma configuración local que `prisma`.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Valor determinista para que la seudonimización de la auditoría sea reproducible.
process.env.DOLETH_SESSION_SECRET ??= "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres";
process.env.DOLETH_APP_URL ??= "http://localhost:3000";
process.env.DOLETH_EMAIL_TRANSPORT ??= "console";
