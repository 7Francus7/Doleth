import { describe, expect, it } from "vitest";
import {
  AdminAdoptionConfigError,
  type AdminAdoptionEnv,
  resolveAdminAdoptionConfig,
} from "../../../prisma/ops/lib/private-beta-admin-adoption-config";

const PREVIEW_URL = "postgresql://ep-preview.example.test/doleth_preview?sslmode=require";
const PRODUCTION_URL = "postgresql://ep-production.example.test/neondb?sslmode=require";

function previewEnv(overrides: Partial<AdminAdoptionEnv> = {}): AdminAdoptionEnv {
  return {
    DOLETH_ACCESS_MODE: "private-beta",
    DOLETH_ADMIN_ADOPTION_DATABASE_URL: PREVIEW_URL,
    DOLETH_ADMIN_ADOPTION_ENVIRONMENT: "preview",
    DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE_HOST: "ep-preview.example.test",
    DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE: "doleth_preview",
    DOLETH_ADMIN_ADOPTION_PROJECT_ID: "preview-project",
    DOLETH_ADMIN_ADOPTION_BRANCH_ID: "preview-branch",
    DOLETH_ADMIN_ADOPTION_PRODUCTION_PROJECT_ID: "production-project",
    DOLETH_ADMIN_ADOPTION_PRODUCTION_BRANCH_ID: "production-branch",
    DOLETH_ADMIN_ADOPTION_PRODUCTION_DATABASE_HOST: "ep-production.example.test",
    DOLETH_ADMIN_ADOPTION_ACTOR: "release-cli",
    DOLETH_ADMIN_ADOPTION_REASON: "private beta rollback recovery",
    DOLETH_ADMIN_ADOPTION_COMMIT: "a".repeat(40),
    ...overrides,
  };
}

function errorCode(env: AdminAdoptionEnv): string {
  try {
    resolveAdminAdoptionConfig(env);
    return "NO_ERROR";
  } catch (error) {
    return error instanceof AdminAdoptionConfigError ? error.code : "UNKNOWN";
  }
}

describe("admin adoption environment guards", () => {
  it("usa exclusivamente la variable dedicada", () => {
    const env = { ...previewEnv(), DATABASE_URL: PREVIEW_URL };
    Reflect.deleteProperty(env, "DOLETH_ADMIN_ADOPTION_DATABASE_URL");
    expect(errorCode(env)).toBe("DEDICATED_DATABASE_URL_REQUIRED");
  });

  it("acepta Preview solo con separación triple de host, proyecto y branch", () => {
    expect(resolveAdminAdoptionConfig(previewEnv()).environment).toBe("preview");
  });

  it.each([
    ["host productivo", { DOLETH_ADMIN_ADOPTION_DATABASE_URL: PRODUCTION_URL, DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE_HOST: "ep-production.example.test", DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE: "neondb" }],
    ["proyecto productivo", { DOLETH_ADMIN_ADOPTION_PROJECT_ID: "production-project" }],
    ["branch productiva", { DOLETH_ADMIN_ADOPTION_BRANCH_ID: "production-branch" }],
  ])("bloquea Preview sobre %s", (_name, overrides) => {
    expect(errorCode(previewEnv(overrides))).toBe("PRODUCTION_SEPARATION_FAILED");
  });

  it("bloquea entorno desconocido", () => {
    expect(errorCode(previewEnv({ DOLETH_ADMIN_ADOPTION_ENVIRONMENT: "staging" }))).toBe("UNKNOWN_ENVIRONMENT");
  });

  it("bloquea Production sin flag explícito antes de conectar", () => {
    const env = previewEnv({
      DOLETH_ADMIN_ADOPTION_DATABASE_URL: PRODUCTION_URL,
      DOLETH_ADMIN_ADOPTION_ENVIRONMENT: "production",
      DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE_HOST: "ep-production.example.test",
      DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE: "neondb",
      DOLETH_ADMIN_ADOPTION_PROJECT_ID: "production-project",
      DOLETH_ADMIN_ADOPTION_BRANCH_ID: "production-branch",
    });
    expect(errorCode(env)).toBe("PRODUCTION_FLAG_REQUIRED");
  });

  it("bloquea Production si la URL dedicada coincide con TEST_DATABASE_URL", () => {
    const env = previewEnv({
      DOLETH_ADMIN_ADOPTION_DATABASE_URL: PRODUCTION_URL,
      DOLETH_ADMIN_ADOPTION_ENVIRONMENT: "production",
      DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE_HOST: "ep-production.example.test",
      DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE: "neondb",
      DOLETH_ADMIN_ADOPTION_PROJECT_ID: "production-project",
      DOLETH_ADMIN_ADOPTION_BRANCH_ID: "production-branch",
      DOLETH_ALLOW_PRODUCTION_ADMIN_ADOPTION: "YES",
      TEST_DATABASE_URL: PRODUCTION_URL,
    });
    expect(errorCode(env)).toBe("TEST_DATABASE_COLLISION");
  });

  it("bloquea Test salvo doble opt-in bajo NODE_ENV=test", () => {
    expect(errorCode(previewEnv({ DOLETH_ADMIN_ADOPTION_ENVIRONMENT: "test" }))).toBe("TEST_ENVIRONMENT_FORBIDDEN");
    expect(
      resolveAdminAdoptionConfig(
        previewEnv({
          DOLETH_ADMIN_ADOPTION_ENVIRONMENT: "test",
          NODE_ENV: "test",
          DOLETH_ALLOW_TEST_ADMIN_ADOPTION: "YES",
        }),
      ).environment,
    ).toBe("test");
  });

  it("los errores nunca incluyen URL ni credenciales", () => {
    let message = "";
    try {
      resolveAdminAdoptionConfig(previewEnv({ DOLETH_ADMIN_ADOPTION_EXPECTED_DATABASE: "wrong" }));
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toContain("preview-secret");
    expect(message).not.toContain(PREVIEW_URL);
    expect(message).not.toContain("operator");
  });
});
