import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Skeleton } from "./Skeleton";
import { StatusMessage } from "./StatusMessage";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { SuccessState } from "./SuccessState";
import { ShellSkeleton, SurfaceSkeleton } from "./screens";
import { Button } from "../primitives/Button";

const render = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("Skeleton", () => {
  it("está oculto a lectores de pantalla y no aporta texto", () => {
    const html = render(<Skeleton variant="value" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(/role=/);
    // sin dígitos ni contenido semántico falso
    expect(html.replace(/<[^>]+>/g, "").trim()).toBe("");
  });

  it("multi-línea genera una fila por línea bajo un contenedor oculto", () => {
    const html = render(<Skeleton variant="line" lines={4} />);
    expect(html).toContain('aria-hidden="true"'); // contenedor oculto
    // 1 contenedor + 4 líneas = 5 spans
    expect((html.match(/<span/g) ?? []).length).toBe(5);
  });
});

describe("StatusMessage", () => {
  it("éxito usa role=status", () => {
    const html = render(<StatusMessage tone="success">Movimiento registrado.</StatusMessage>);
    expect(html).toContain('role="status"');
    expect(html).toContain("Movimiento registrado.");
    expect(html).toContain("<svg"); // icono no dependiente del color
  });

  it("error usa role=alert", () => {
    const html = render(<StatusMessage tone="error">No pudimos guardar.</StatusMessage>);
    expect(html).toContain('role="alert"');
  });
});

describe("EmptyState", () => {
  it("con CTA renderiza la acción", () => {
    const html = render(
      <EmptyState title="Sin cuentas" description="Creá la primera." primaryAction={<a href="#x">Crear</a>} />,
    );
    expect(html).toContain("Sin cuentas");
    expect(html).toContain("Creá la primera.");
    expect(html).toContain(">Crear</a>");
  });

  it("sin CTA no renderiza contenedor de acciones", () => {
    const html = render(<EmptyState title="Vacío" />);
    expect(html).toContain("Vacío");
    expect(html).not.toContain("href");
  });
});

describe("ErrorState", () => {
  it("assertive expone role=alert y muestra seguridad, sin tecnicismos", () => {
    const html = render(
      <ErrorState
        assertive
        title="Doleth no pudo cargar esta pantalla."
        description="No pudimos mostrar esta pantalla."
        safetyLine="Tus datos guardados siguen seguros."
        variant="screen"
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Tus datos guardados siguen seguros.");
    expect(html).not.toMatch(/Prisma|stack|Error:|Neon|P20\d\d/);
  });

  it("sin assertive no fuerza role=alert", () => {
    const html = render(<ErrorState title="x" description="y" />);
    expect(html).not.toContain('role="alert"');
  });
});

describe("SuccessState", () => {
  it("muestra importe y cuenta reales", () => {
    const html = render(
      <SuccessState title="Gasto registrado." amount="18.500" account="Mercado Pago" />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("18.500");
    expect(html).toContain("Mercado Pago");
  });
});

describe("Button loading", () => {
  it("mantiene disabled, aria-busy y muestra el label específico y el contenido fantasma", () => {
    const html = render(
      <Button loading loadingLabel="Registrando…">Registrar movimiento</Button>,
    );
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Registrando…");
    // el contenido real queda como fantasma (reserva de ancho) y oculto a AT
    expect(html).toContain("Registrar movimiento");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("route skeletons", () => {
  it("SurfaceSkeleton marca aria-busy y no muestra importes ni NaN", () => {
    const html = render(<SurfaceSkeleton meter sections={2} rows={3} />);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toMatch(/\$\s?\d/);
    expect(html).not.toContain("NaN");
  });

  it("ShellSkeleton preserva estructura sin texto de datos", () => {
    const html = render(<ShellSkeleton body="list" filters rows={5} />);
    expect(html).toContain('aria-busy="true"');
    expect(html.replace(/<[^>]+>/g, "").trim()).toBe("");
  });
});
