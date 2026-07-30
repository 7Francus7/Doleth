import { describe, expect, it } from "vitest";
import { TestDatabaseConfigError, resolveTestDatabaseUrl } from "./database-url";

/**
 * Regresión del guard que impide que las pruebas se conecten a una base real.
 *
 * El defecto original: `setup.ts` caía a `DATABASE_URL` cuando faltaba
 * `TEST_DATABASE_URL`. Con un `.env.local` apuntando a una base administrada,
 * `pnpm test` escribía y borraba filas ahí. Estas pruebas fijan el contrato.
 *
 * Son puras: no tocan `process.env` ni necesitan PostgreSQL.
 */

const LOCAL = "postgresql://doleth:doleth@localhost:5432/doleth_test";
const CI_URL = "postgresql://doleth:doleth@localhost:5432/doleth_ci";
const PRODUCCION = "postgresql://owner:secreto@ep-base-de-ejemplo.us-east-1.aws.neon.tech/neondb?sslmode=require";

describe("resolveTestDatabaseUrl", () => {
  describe("a) falta TEST_DATABASE_URL", () => {
    it("sin ninguna base configurada no hay base y Prisma no se inicializa", () => {
      expect(resolveTestDatabaseUrl({})).toBeNull();
    });

    it("en CI la ausencia es un fallo duro, nunca una omisión silenciosa", () => {
      expect(() => resolveTestDatabaseUrl({ CI: "true", DOLETH_REQUIRE_DB: "1" })).toThrow(
        TestDatabaseConfigError,
      );
    });

    it("DOLETH_REQUIRE_DB=1 también exige la URL fuera de CI", () => {
      expect(() => resolveTestDatabaseUrl({ DOLETH_REQUIRE_DB: "1" })).toThrow(TestDatabaseConfigError);
    });
  });

  describe("b) sólo existe DATABASE_URL", () => {
    it("rechaza usarla como base de pruebas", () => {
      expect(() => resolveTestDatabaseUrl({ DATABASE_URL: PRODUCCION })).toThrow(TestDatabaseConfigError);
    });

    it("explica que hace falta TEST_DATABASE_URL", () => {
      expect(() => resolveTestDatabaseUrl({ DATABASE_URL: PRODUCCION })).toThrow(/TEST_DATABASE_URL/);
    });

    it("no filtra usuario, contraseña ni host completo en el error", () => {
      let mensaje = "";
      try {
        resolveTestDatabaseUrl({ DATABASE_URL: PRODUCCION });
      } catch (error) {
        mensaje = (error as Error).message;
      }
      expect(mensaje).not.toContain("secreto");
      expect(mensaje).not.toContain("owner");
      expect(mensaje).not.toContain("ep-base-de-ejemplo.us-east-1.aws.neon.tech");
      expect(mensaje).not.toContain(PRODUCCION);
    });
  });

  describe("c) TEST_DATABASE_URL válida en local", () => {
    it("acepta una base local aunque haya DATABASE_URL en el entorno", () => {
      expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: LOCAL, DATABASE_URL: PRODUCCION })).toBe(LOCAL);
    });

    it("acepta loopback por IP", () => {
      const url = "postgresql://doleth:doleth@127.0.0.1:5433/lo_que_sea_test";
      expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toBe(url);
    });

    it("rechaza una base local sin marca de prueba", () => {
      const url = "postgresql://doleth:doleth@127.0.0.1:5433/lo_que_sea";
      expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toThrow(TestDatabaseConfigError);
    });

    it("acepta una base remota sólo si su nombre se declara de prueba", () => {
      const url = "postgresql://u:p@ep-otra-de-ejemplo.aws.neon.tech/doleth_test?sslmode=require";
      expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toBe(url);
    });

    it("rechaza una base remota que no se declara de prueba", () => {
      const url = "postgresql://u:p@ep-otra-de-ejemplo.aws.neon.tech/neondb?sslmode=require";
      expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toThrow(TestDatabaseConfigError);
    });

    it.each(["postgres", "neondb", "doleth", "doleth_prod"])(
      "rechaza el nombre productivo %s incluso en loopback",
      (database) => {
        const url = `postgresql://doleth:doleth@127.0.0.1:5433/${database}`;
        expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toThrow(/producción/);
      },
    );

    it("rechaza un host marcado como producción aunque la base diga test", () => {
      const url = "postgresql://u:p@prod.db.example.test/doleth_test";
      expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toThrow(/producción/);
    });

    it("rechaza un parámetro de rama marcado como producción", () => {
      const url = "postgresql://u:p@ep-temporal.example.test/doleth_test?branch=production";
      expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: url })).toThrow(/producción/);
    });

    it("rechaza una URL que no es de PostgreSQL", () => {
      expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: "mysql://localhost/doleth_test" })).toThrow(
        TestDatabaseConfigError,
      );
    });
  });

  describe("d) TEST_DATABASE_URL válida en CI", () => {
    it("acepta la base efímera del runner con CI=true y DOLETH_REQUIRE_DB=1", () => {
      expect(
        resolveTestDatabaseUrl({ TEST_DATABASE_URL: CI_URL, CI: "true", DOLETH_REQUIRE_DB: "1" }),
      ).toBe(CI_URL);
    });

    it("exige DOLETH_REQUIRE_DB=1 cuando corre en CI", () => {
      expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: CI_URL, CI: "true" })).toThrow(
        /DOLETH_REQUIRE_DB/,
      );
    });
  });

  describe("e) coincidencia con producción", () => {
    it("rechaza la misma URL exacta que DATABASE_URL", () => {
      expect(() =>
        resolveTestDatabaseUrl({ TEST_DATABASE_URL: PRODUCCION, DATABASE_URL: PRODUCCION }),
      ).toThrow(TestDatabaseConfigError);
    });

    it("rechaza el mismo destino aunque cambien las credenciales o los parámetros", () => {
      const mismaBaseOtroUsuario =
        "postgresql://otro:otraclave@ep-base-de-ejemplo.us-east-1.aws.neon.tech/neondb?sslmode=verify-full";
      expect(() =>
        resolveTestDatabaseUrl({ TEST_DATABASE_URL: mismaBaseOtroUsuario, DATABASE_URL: PRODUCCION }),
      ).toThrow(/mismo destino/);
    });

    it("rechaza el mismo destino incluso en CI", () => {
      expect(() =>
        resolveTestDatabaseUrl({
          TEST_DATABASE_URL: PRODUCCION,
          DATABASE_URL: PRODUCCION,
          CI: "true",
          DOLETH_REQUIRE_DB: "1",
        }),
      ).toThrow(TestDatabaseConfigError);
    });

    it("no filtra credenciales al informar la coincidencia", () => {
      let mensaje = "";
      try {
        resolveTestDatabaseUrl({ TEST_DATABASE_URL: PRODUCCION, DATABASE_URL: PRODUCCION });
      } catch (error) {
        mensaje = (error as Error).message;
      }
      expect(mensaje).not.toContain("secreto");
      expect(mensaje).not.toContain("owner");
      expect(mensaje).not.toContain(PRODUCCION);
    });
  });
});
