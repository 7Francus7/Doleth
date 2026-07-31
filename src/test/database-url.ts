/**
 * Resolución de la base de datos que pueden usar las pruebas.
 *
 * Motivo: hasta este corte, `setup.ts` caía a `DATABASE_URL` cuando no había
 * `TEST_DATABASE_URL`. En una máquina de desarrollo con `.env.local` apuntando a
 * una base administrada, `pnpm test` se conectaba a esa base —potencialmente la
 * productiva— sin una sola advertencia, y las pruebas de integración crean y
 * borran usuarios, cuentas y movimientos.
 *
 * Reglas, en orden:
 *
 *  1. `TEST_DATABASE_URL` es la única fuente. El valor de `DATABASE_URL` nunca se
 *     usa como base de pruebas.
 *  2. Si no hay `TEST_DATABASE_URL` pero sí `DATABASE_URL`, es un error duro: hay
 *     una base real al alcance y el silencio sería justamente el defecto.
 *  3. Si no hay ninguna de las dos, no hay base: Prisma no se inicializa y las
 *     suites que la necesitan se omiten. `DOLETH_REQUIRE_DB=1` convierte esa
 *     omisión en un fallo (ver `fixtures.ts`).
 *  4. La base tiene que declararse de prueba por nombre incluso en loopback.
 *     Loopback reduce alcance de red, pero no demuestra que la base sea
 *     descartable.
 *  5. Nunca puede apuntar al mismo destino que `DATABASE_URL`.
 *  6. Nombres, hosts o parámetros marcados como producción se rechazan antes de
 *     abrir una conexión.
 *
 * Ningún mensaje de error incluye usuario, contraseña ni la URL completa.
 */

/**
 * Entorno relevante. Se recibe por parámetro para poder probarlo sin tocar
 * `process.env`; el índice lo hace compatible con `NodeJS.ProcessEnv`.
 */
export interface TestDatabaseEnv {
  readonly TEST_DATABASE_URL?: string | undefined;
  readonly DATABASE_URL?: string | undefined;
  readonly CI?: string | undefined;
  readonly DOLETH_REQUIRE_DB?: string | undefined;
  readonly [key: string]: string | undefined;
}

/** Configuración inaceptable. Detiene la corrida antes de inicializar Prisma. */
export class TestDatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestDatabaseConfigError";
  }
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0", "host.docker.internal"]);

/** `doleth_ci`, `doleth-test`, `rehearsal`… El nombre tiene que declarar su propósito. */
const TEST_DATABASE_NAME =
  /(^|[_-])(test|tests|testing|ci|prueba|pruebas|rehearsal|temp|temporary|temporal)([_-]|$)/i;

/** Bases administrativas o nombres usados habitualmente por una aplicación real. */
const KNOWN_PRODUCTION_DATABASE = /^(postgres|neondb|doleth|production|produccion|prod|live|main)$/i;

/** Señales explícitas. No intenta adivinar nombres opacos de proveedores. */
const PRODUCTION_MARKER = /(^|[._-])(prod|production|produccion|live|main)([._-]|$)/i;

interface ParsedTarget {
  host: string;
  port: string;
  database: string;
  environmentLabels: string[];
}

function parse(raw: string): ParsedTarget | null {
  try {
    const url = new URL(raw);
    if (!/^postgres(ql)?:$/.test(url.protocol)) return null;
    return {
      host: url.hostname.toLowerCase(),
      port: url.port || "5432",
      database: decodeURIComponent(url.pathname.replace(/^\//, "")),
      environmentLabels: ["branch", "environment", "env", "endpoint"]
        .map((key) => url.searchParams.get(key)?.toLowerCase())
        .filter((value): value is string => Boolean(value)),
    };
  } catch {
    return null;
  }
}

/**
 * Descripción apta para un mensaje de error: sin usuario, sin contraseña y con el
 * host recortado. Alcanza para reconocer la base sin filtrarla a un log.
 */
function describe(target: ParsedTarget): string {
  const { host } = target;
  const visible = host.length <= 8 ? host : `${host.slice(0, 4)}…${host.slice(-6)}`;
  return `${visible}:${target.port}/${target.database}`;
}

function sameTarget(left: ParsedTarget, right: ParsedTarget): boolean {
  return left.host === right.host && left.port === right.port && left.database === right.database;
}

/**
 * Devuelve la URL de la base de pruebas, o `null` si no hay ninguna configurada.
 *
 * @throws {TestDatabaseConfigError} si la configuración es insegura o ambigua.
 */
export function resolveTestDatabaseUrl(env: TestDatabaseEnv): string | null {
  const testUrl = env.TEST_DATABASE_URL?.trim();
  const productionUrl = env.DATABASE_URL?.trim();
  const inCi = env.CI === "true" || env.CI === "1";
  const databaseRequired = env.DOLETH_REQUIRE_DB === "1";

  if (!testUrl) {
    if (productionUrl) {
      throw new TestDatabaseConfigError(
        "Las pruebas necesitan TEST_DATABASE_URL y no está definida. " +
          "Hay una DATABASE_URL en el entorno, pero las pruebas nunca la usan: " +
          "crean y borran usuarios, cuentas y movimientos, y esa base puede ser la productiva. " +
          "Definí TEST_DATABASE_URL con una base de prueba descartable.",
      );
    }
    if (inCi || databaseRequired) {
      throw new TestDatabaseConfigError(
        "Ejecución obligatoria sin TEST_DATABASE_URL. Las suites de aislamiento multiusuario son bloqueantes " +
          "y no pueden omitirse en el pipeline.",
      );
    }
    return null;
  }

  if (inCi && env.DOLETH_REQUIRE_DB !== "1") {
    throw new TestDatabaseConfigError(
      "CI=true exige DOLETH_REQUIRE_DB=1. Sin esa marca, la ausencia de base se omitiría " +
        "en silencio y el pipeline podría dar verde sin haber probado el aislamiento.",
    );
  }

  const target = parse(testUrl);
  if (!target) {
    throw new TestDatabaseConfigError(
      "TEST_DATABASE_URL no es una URL de PostgreSQL válida (se esperaba postgresql://…).",
    );
  }

  if (!target.database) {
    throw new TestDatabaseConfigError("TEST_DATABASE_URL no indica ninguna base de datos.");
  }

  if (productionUrl) {
    const production = parse(productionUrl);
    if (production && sameTarget(target, production)) {
      throw new TestDatabaseConfigError(
        `TEST_DATABASE_URL apunta al mismo destino que DATABASE_URL (${describe(target)}). ` +
          "Las pruebas escriben y borran: nunca pueden compartir base con la aplicación.",
      );
    }
  }

  if (
    KNOWN_PRODUCTION_DATABASE.test(target.database) ||
    PRODUCTION_MARKER.test(target.database) ||
    PRODUCTION_MARKER.test(target.host) ||
    target.environmentLabels.some((label) => PRODUCTION_MARKER.test(label))
  ) {
    throw new TestDatabaseConfigError(
      `TEST_DATABASE_URL contiene una señal explícita de producción (${describe(target)}). ` +
        "Creá una base descartable cuyo nombre declare 'test', 'ci', 'pruebas' o 'rehearsal'.",
    );
  }

  const isLoopback = LOOPBACK_HOSTS.has(target.host);
  if (!TEST_DATABASE_NAME.test(target.database)) {
    throw new TestDatabaseConfigError(
      `TEST_DATABASE_URL apunta a una base ${isLoopback ? "local" : "remota"} que no se declara de prueba ` +
        `(${describe(target)}). Usá un nombre que incluya 'test', 'ci', 'pruebas' o 'rehearsal'.`,
    );
  }

  return testUrl;
}
