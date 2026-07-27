import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("perímetro privado", () => {
  const proxy = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");
  const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  const nextConfig = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");

  it("evita caché y embebido de pantallas financieras", () => {
    expect(proxy).toContain("private, no-store");
    expect(proxy).toContain("frame-ancestors 'none'");
    expect(proxy).toContain('"X-Frame-Options", "DENY"');
    expect(proxy).toContain('"X-Content-Type-Options", "nosniff"');
  });

  it("limita capacidades y orígenes del navegador", () => {
    expect(proxy).toContain("default-src 'self'");
    expect(proxy).toContain("camera=(), geolocation=(), microphone=(), payment=()");
    expect(proxy).toContain('"Referrer-Policy", "no-referrer"');
  });

  it("declara toda la app fuera de índices y oculta la firma del framework", () => {
    expect(layout).toContain("index: false");
    expect(layout).toContain("noarchive: true");
    expect(proxy).toContain("noindex, nofollow, noarchive");
    expect(nextConfig).toContain("poweredByHeader: false");
  });
});
