import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_ADOPTION_MIGRATIONS,
  AdminAdoptionError,
  type AdminAdoptionSnapshot,
  adminAdoptionConfirmationPhrase,
  validateAdminAdoptionSnapshot,
} from "../../../prisma/ops/lib/private-beta-admin-adoption";

const now = new Date("2026-08-01T12:00:00.000Z");

function snapshot(overrides: Partial<AdminAdoptionSnapshot> = {}): AdminAdoptionSnapshot {
  return {
    users: 1,
    idMatches: 1,
    emailMatches: 1,
    exactCandidates: 1,
    activeAdmins: 0,
    candidate: {
      id: "historical-user-12345678",
      email: "historical@example.invalid",
      name: "Historical user",
      password_hash: "hash-preserved",
      status: "PENDING_VERIFICATION",
      role: "USER",
      email_verified_at: null,
      private_beta_activated_at: null,
      password_changed_at: now,
      updated_at: now,
    },
    targetFinancial: {
      accounts: 1,
      categories: 13,
      transactions: 1,
      ledgerEntries: 1,
      investments: 0,
      upcomingPayments: 0,
    },
    globalFinancial: {
      accounts: 1,
      categories: 13,
      transactions: 1,
      ledgerEntries: 1,
      investments: 0,
      upcomingPayments: 0,
    },
    nullOwners: 0,
    orphanOwners: 0,
    crossOwner: 0,
    sessions: 0,
    authTokens: 0,
    privateBetaInvites: 0,
    appliedMigrations: [...ADMIN_ADOPTION_MIGRATIONS],
    failedMigrations: 0,
    ...overrides,
  };
}

function code(overrides: Partial<AdminAdoptionSnapshot>): string {
  try {
    validateAdminAdoptionSnapshot(snapshot(overrides));
    return "NO_ERROR";
  } catch (error) {
    return error instanceof AdminAdoptionError ? error.code : "UNKNOWN";
  }
}

describe("private beta admin adoption validation", () => {
  it.each([
    ["base vacía", { users: 0, idMatches: 0, emailMatches: 0, exactCandidates: 0, candidate: null }, "EMPTY_DATABASE"],
    ["usuario inexistente", { idMatches: 0, emailMatches: 0, exactCandidates: 0, candidate: null }, "USER_NOT_FOUND_BY_ID"],
    ["email incorrecto", { emailMatches: 0, exactCandidates: 0, candidate: null }, "USER_NOT_FOUND_BY_EMAIL"],
    ["ID incorrecto", { idMatches: 0, exactCandidates: 0, candidate: null }, "USER_NOT_FOUND_BY_ID"],
    ["ID y email de usuarios distintos", { exactCandidates: 0, candidate: null }, "ID_EMAIL_MISMATCH"],
    ["dos candidatos", { exactCandidates: 2 }, "AMBIGUOUS_CANDIDATE"],
    ["usuario extra", { users: 2 }, "UNEXPECTED_USER_COUNT"],
    ["administrador activo", { activeAdmins: 1 }, "ACTIVE_ADMIN_EXISTS"],
    ["usuario bloqueado", { candidate: { ...snapshot().candidate!, status: "SUSPENDED" } }, "INCOMPATIBLE_USER_STATE"],
    ["sin ownership histórico", { targetFinancial: { ...snapshot().targetFinancial, accounts: 0 } }, "HISTORICAL_DATA_MISMATCH"],
    ["cross-owner", { crossOwner: 1 }, "CROSS_OWNER"],
    ["owner nulo", { nullOwners: 1 }, "NULL_OWNER"],
    ["owner huérfano", { orphanOwners: 1 }, "ORPHAN_OWNER"],
    ["email verificado", { candidate: { ...snapshot().candidate!, email_verified_at: now } }, "EMAIL_ALREADY_VERIFIED"],
    ["sesión existente", { sessions: 1 }, "AUTH_ARTIFACTS_PRESENT"],
    ["token existente", { authTokens: 1 }, "AUTH_ARTIFACTS_PRESENT"],
    ["invitación existente", { privateBetaInvites: 1 }, "AUTH_ARTIFACTS_PRESENT"],
    ["migración faltante", { appliedMigrations: ADMIN_ADOPTION_MIGRATIONS.slice(0, 5) }, "MIGRATION_STATE_MISMATCH"],
    ["migración fallida", { failedMigrations: 1 }, "MIGRATION_STATE_MISMATCH"],
  ] as const)("aborta %s", (_name, overrides, expected) => {
    expect(code(overrides as Partial<AdminAdoptionSnapshot>)).toBe(expected);
  });

  it("acepta únicamente el escenario histórico exacto", () => {
    expect(validateAdminAdoptionSnapshot(snapshot())).toBe("READY_TO_ADOPT");
  });

  it("la segunda ejecución es idempotente", () => {
    expect(
      validateAdminAdoptionSnapshot(
        snapshot({
          activeAdmins: 1,
          candidate: {
            ...snapshot().candidate!,
            role: "ADMIN",
            status: "ACTIVE",
            private_beta_activated_at: now,
          },
        }),
      ),
    ).toBe("ALREADY_ADOPTED");
  });

  it("la frase fuerte no acepta respuestas genéricas", () => {
    const phrase = adminAdoptionConfirmationPhrase("preview", "historical-user-12345678", "historical@example.invalid");
    expect(phrase).toMatch(/^ADOPT hist…5678 [0-9A-F]{8} AS PRIVATE BETA ADMIN$/);
    expect(["", "y", "yes", "YES", "Enter"]).not.toContain(phrase);
  });

  it("el dry-run usa una transacción READ ONLY y sale antes del UPDATE", () => {
    const source = readFileSync(join(process.cwd(), "prisma/ops/lib/private-beta-admin-adoption.ts"), "utf8");
    expect(source).toContain('"BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY"');
    expect(source.indexOf('if (input.dryRun)')).toBeLessThan(source.indexOf('`UPDATE "User"'));
    expect(source).toContain('await client.query("ROLLBACK")');
  });

  it("el CLI real bloquea entrada silenciosa y terminal no interactiva", () => {
    const source = readFileSync(join(process.cwd(), "prisma/ops/private-beta-admin-adoption.ts"), "utf8");
    expect(source).toContain("SILENT_INPUT_FORBIDDEN");
    expect(source).toContain("INTERACTIVE_TERMINAL_REQUIRED");
    expect(source).not.toMatch(/api\/|server action|\/admin\/bootstrap/i);
  });
});
