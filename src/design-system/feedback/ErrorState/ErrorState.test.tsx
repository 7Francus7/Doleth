import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("usa h1 cuando reemplaza una pantalla completa", () => {
    const html = renderToStaticMarkup(
      <ErrorState description="Detalle seguro." title="No se pudo cargar." variant="screen" />,
    );
    expect(html).toContain("<h1");
    expect(html).not.toContain("<h2");
  });

  it("mantiene h2 dentro de una sección", () => {
    const html = renderToStaticMarkup(
      <ErrorState description="Detalle seguro." title="No se pudo cargar." />,
    );
    expect(html).toContain("<h2");
  });
});
