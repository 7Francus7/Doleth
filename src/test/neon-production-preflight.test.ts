import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { classifyMigration, mask } from "../../prisma/ops/neon-production-preflight";

const source = readFileSync(join(process.cwd(), "prisma", "ops", "neon-production-preflight.ts"), "utf8");

const base = {
  migration_name: "202607210001_vertical_007",
  checksum: "abc",
  started_at: new Date("2026-07-29T00:00:00Z"),
  finished_at: new Date("2026-07-29T00:00:01Z"),
  rolled_back_at: null,
  applied_steps_count: 1,
  logs_present: false,
};

describe("neon production preflight helpers", () => {
  it("redacts connection identity values", () => {
    expect(mask("ep-example-pooler.us-east-1.aws.neon.tech")).toBe("ep…ch");
    expect(mask("db")).toBe("d…");
    expect(mask("")).toBe("<none>");
  });

  it("classifies matching and divergent migrations", () => {
    const local = { name: base.migration_name, checksum: "abc" };
    expect(classifyMigration(local, [base])).toBe("APPLIED_MATCHING");
    expect(classifyMigration(local, [{ ...base, checksum: "changed" }])).toBe("APPLIED_CHECKSUM_MISMATCH");
  });

  it("classifies pending, failed, and rolled-back migrations", () => {
    const local = { name: base.migration_name, checksum: "abc" };
    expect(classifyMigration(local, [])).toBe("PENDING");
    expect(classifyMigration(local, [{ ...base, finished_at: null }])).toBe("FAILED");
    expect(
      classifyMigration(local, [
        { ...base, finished_at: null, rolled_back_at: new Date("2026-07-29T00:00:02Z") },
      ]),
    ).toBe("ROLLED_BACK");
  });

  it("keeps mandatory read-only guards and rollback", () => {
    expect(source).toContain('client.query("SET default_transaction_read_only = on")');
    expect(source).toContain('client.query("BEGIN")');
    expect(source).toContain('client.query("SET TRANSACTION READ ONLY")');
    expect(source).toContain(`client.query("SET LOCAL statement_timeout = '5s'")`);
    expect(source).toContain(`client.query("SET LOCAL lock_timeout = '2s'")`);
    expect(source).toContain('client.query("ROLLBACK")');
    expect(source).toContain(`code !== "25006"`);
  });

  it("contains no database mutation commands outside the rejected probe", () => {
    expect(source.match(/\b(?:INSERT|UPDATE|DELETE|UPSERT|ALTER|DROP|TRUNCATE|GRANT|REVOKE|VACUUM)\b/g)).toEqual(
      null,
    );
    expect(source.match(/\bCREATE TABLE\b/g)).toHaveLength(1);
    expect(source).not.toContain("PrismaClient");
    expect(source).not.toContain("writeFile");
  });
});
