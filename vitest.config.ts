import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    // Las pruebas de aislamiento comparten una base real: en paralelo se pisarían.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      // `server-only` sólo existe dentro del bundler de Next.
      "server-only": fileURLToPath(new URL("./src/test/server-only.stub.ts", import.meta.url)),
    },
  },
});
