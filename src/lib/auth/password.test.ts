import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  it("produce un hash con algoritmo y parámetros embebidos", async () => {
    const hash = await hashPassword("caballo correcto grapa");
    const [algorithm, cost, blockSize, parallelization] = hash.split("$");
    expect(algorithm).toBe("scrypt");
    expect(Number(cost)).toBe(2 ** 16);
    expect(Number(blockSize)).toBe(8);
    expect(Number(parallelization)).toBe(2);
    expect(hash.split("$")).toHaveLength(6);
  });

  it("nunca guarda la contraseña en claro", async () => {
    const hash = await hashPassword("caballo correcto grapa");
    expect(hash).not.toContain("caballo");
  });

  it("usa una sal distinta en cada hash", async () => {
    const [first, second] = await Promise.all([hashPassword("misma clave larga"), hashPassword("misma clave larga")]);
    expect(first).not.toBe(second);
  });
});

describe("verifyPassword", () => {
  it("acepta la contraseña correcta", async () => {
    const hash = await hashPassword("caballo correcto grapa");
    expect(await verifyPassword("caballo correcto grapa", hash)).toEqual({ valid: true, needsRehash: false });
  });

  it("rechaza la incorrecta", async () => {
    const hash = await hashPassword("caballo correcto grapa");
    expect((await verifyPassword("caballo incorrecto grapa", hash)).valid).toBe(false);
  });

  it("rechaza hashes malformados sin explotar", async () => {
    for (const roto of ["", "scrypt$", "no-es-un-hash", "argon2$1$2$3$4$5", "scrypt$a$b$c$d$e"]) {
      expect((await verifyPassword("cualquier cosa", roto)).valid).toBe(false);
    }
  });

  it("marca para rehashear cuando los parámetros quedaron viejos", async () => {
    // Hash generado con un costo menor al actual: válido, pero desactualizado.
    const current = await hashPassword("caballo correcto grapa");
    const [, , blockSize, parallelization, salt] = current.split("$");
    const { scrypt } = await import("node:crypto");
    const legacy = await new Promise<string>((resolve, reject) => {
      scrypt(
        "caballo correcto grapa",
        Buffer.from(salt ?? "", "base64url"),
        32,
        { N: 2 ** 14, r: Number(blockSize), p: Number(parallelization), maxmem: 192 * 1024 * 1024 },
        (error, derived) => {
          if (error) reject(error);
          else resolve(["scrypt", 2 ** 14, blockSize, parallelization, salt, derived.toString("base64url")].join("$"));
        },
      );
    });

    expect(await verifyPassword("caballo correcto grapa", legacy)).toEqual({ valid: true, needsRehash: true });
  });
});
