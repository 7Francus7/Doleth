import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appUrl, ConfigurationError } from "./config";

// Regression: ISSUE-001 — los callbacks de Preview caían al host de Production.
// Found by /qa on 2026-07-30
// Report: docs/production/doleth-preview-smoke.md

const KEYS = [
  "NODE_ENV",
  "DOLETH_APP_URL",
  "VERCEL_ENV",
  "VERCEL_TARGET_ENV",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

beforeEach(() => {
  for (const key of KEYS) delete process.env[key];
  Reflect.set(process.env, "NODE_ENV", "production");
});

afterEach(() => {
  for (const key of KEYS) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else Reflect.set(process.env, key, value);
  }
});

describe("appUrl en deployments", () => {
  it("usa el host exacto del deployment en Preview, no el de Production", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "doleth-preview.example.test";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "doleth.example.test";

    expect(appUrl()).toBe("https://doleth-preview.example.test");
  });

  it("rechaza una DOLETH_APP_URL de Preview que coincide con Production", () => {
    process.env.VERCEL_TARGET_ENV = "preview";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "doleth.example.test";
    process.env.DOLETH_APP_URL = "https://doleth.example.test";

    expect(() => appUrl()).toThrowError(ConfigurationError);
    expect(() => appUrl()).toThrow(/Preview no puede apuntar al host productivo/);
  });

  it("falla cerrado si Preview no expone su URL propia", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "doleth.example.test";

    expect(() => appUrl()).toThrow(/VERCEL_URL es obligatoria en Preview/);
  });

  it("rechaza HTTP y componentes extra en un deployment", () => {
    process.env.DOLETH_APP_URL = "http://doleth-preview.example.test";
    expect(() => appUrl()).toThrow(/HTTPS/);

    process.env.DOLETH_APP_URL = "https://doleth-preview.example.test/callback?x=1";
    expect(() => appUrl()).toThrow(/sólo el origen público/);
  });

  it("mantiene el host productivo cuando el target es Production", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "doleth.example.test";

    expect(appUrl()).toBe("https://doleth.example.test");
  });
});
