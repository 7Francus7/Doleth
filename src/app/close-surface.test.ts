import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const model = read("src/features/close/data/getCloseModel.ts");
const page = read("src/features/close/ClosePage.tsx");
const close = read("src/lib/finance/close.ts");
const route = read("src/app/mi-realidad/cierre/page.tsx");
const data = read("src/lib/finance/data.ts");

describe("cierre: revisión, no bloqueo", () => {
  it("no promete guardar lo que no persiste", () => {
    expect(model).toContain("Resumen calculado con la información actual");
    expect(model).not.toContain("Guardar revisión");
    expect(model).not.toContain("Cerrar definitivamente");
    expect(model).not.toContain("quedó guardada");
  });

  it("declara qué hace y qué no hace", () => {
    expect(model).toContain("No modifica movimientos, no crea asientos y no bloquea el período.");
    expect(model).toContain("Esta revisión no cierra el período ni bloquea movimientos");
  });

  it("no escribe: la revisión solo lee del ledger", () => {
    expect(model).not.toMatch(/db\.[a-zA-Z]+\.(create|update|delete|upsert)/);
    expect(close).not.toContain("getDb");
    expect(data).toContain("export async function getCloseData");
    expect(data.slice(data.indexOf("export async function getCloseData"))).not.toMatch(
      /\.(create|update|delete|upsert)\(/,
    );
  });

  it("no hay migraciones nuevas para el cierre", () => {
    expect(read("prisma/schema.prisma")).not.toMatch(/model\s+(Close|PeriodReview|MonthlyClose)/);
  });
});

describe("cierre: períodos válidos", () => {
  it("solo mes en curso y mes anterior", () => {
    expect(close).toContain("export function selectablePeriods");
    expect(close).toContain("previousMonth(current)");
  });

  it("un mes civil llega hasta su último día real", () => {
    expect(close).toContain("lastDayOfMonth");
  });

  it("un período no revisable cae al mes en curso en vez de romper", () => {
    expect(close).toContain("?? options[0]!");
  });
});

describe("cierre: pasos y navegación", () => {
  it("son siete pasos con progreso textual", () => {
    expect(close).toContain("CLOSE_STEPS");
    expect(model).toContain("`Paso ${number} de ${CLOSE_STEP_COUNT}`");
    expect(page).toContain("{model.progressLabel}");
  });

  it("el paso y el período viven en la URL", () => {
    expect(model).toContain("?periodo=${month}&paso=${step}");
    expect(route).toContain("searchParams");
    expect(route).toContain("query.periodo");
    expect(route).toContain("query.paso");
  });

  it("navega con enlaces reales, sin recargar la app", () => {
    expect(page).toContain('from "next/link"');
    expect(page).not.toContain("window.location.assign");
    expect(page).not.toContain("window.location.href");
  });

  it("siempre hay una salida hacia atrás", () => {
    expect(model).toContain('backHref: back ? hrefFor(data.period.month, back) : "/mi-realidad"');
  });
});

describe("cierre: reconciliación", () => {
  it("la igualdad se declara en la pantalla", () => {
    expect(model).toContain("Patrimonio inicial + ingresos − gastos = patrimonio final");
    expect(model).toContain("La igualdad se cumple");
  });

  it("el patrimonio inicial se deriva del ledger, no se pide", () => {
    expect(close).toContain("const closingCents = input.patrimonyNowCents - afterCents");
    expect(close).toContain("const openingCents = closingCents - netCents");
  });

  it("explica por qué el patrimonio de hoy no es el del cierre", () => {
    expect(model).toContain("Lo registrado después del período");
    expect(model).toContain("El cierre no congela nada");
  });

  it("las transferencias no participan del resultado", () => {
    expect(model).toContain("Las transferencias no participan porque no cambian el patrimonio.");
    expect(model).toContain("Efecto patrimonial cero");
  });

  it("anulados y originales corregidos se nombran sin contarse", () => {
    expect(model).toContain("No afectan ninguna cifra");
    expect(model).toContain("Pesa solo el reemplazo");
  });

  it("los compromisos no se restan del resultado", () => {
    expect(model).toContain("Los pagos pendientes no se restan del resultado");
  });
});

describe("cierre: advertencias honestas", () => {
  it("se puede completar con advertencias", () => {
    expect(model).toContain(
      "Podés completar la revisión igualmente. Estas advertencias siguen visibles después.",
    );
    expect(model).toContain("Continuar con las advertencias");
  });

  it("ninguna advertencia se presenta como error", () => {
    expect(model).toContain("Ninguna de estas advertencias es un error");
    expect(model).toContain("No es un error");
    expect(page).toContain("Ninguna te impide completar la revisión");
  });

  it("no se pide inventar datos para poder seguir", () => {
    expect(model).toContain("No se pide ajustar nada sin evidencia.");
  });

  it("la severidad no depende solo del color", () => {
    expect(page).toContain('warning.severity === "review" ? " · para revisar" : " · informativa"');
  });

  it("un pago futuro no bloquea la revisión", () => {
    expect(model).toContain("No bloquea esta revisión");
  });
});

describe("cierre: resiliencia y estructura", () => {
  it("una lectura de pagos caída se declara en vez de mostrarse como cero", () => {
    expect(model).toContain("Esta parte queda fuera de la revisión, no en cero.");
    expect(data).toContain("paymentsAvailable: payments !== null");
  });

  it("sin cuentas se muestra un estado vacío con una sola salida", () => {
    expect(model).toContain("Todavía no hay nada que revisar");
    expect(page).toContain("<EmptyState");
  });

  it("cada bloque es una región con nombre y las listas son listas", () => {
    expect(page).toContain("<section aria-label={block.title}");
    expect(page).toContain('<nav aria-label="Pasos de la revisión"');
    expect(page).toContain("<ul");
    expect(page).toContain("<li");
  });

  it("los avisos se anuncian y el progreso también", () => {
    expect(page).toContain('role="status"');
    expect(page).toContain('aria-live="polite"');
  });

  it("la ruta tiene su loading boundary", () => {
    expect(read("src/app/mi-realidad/cierre/loading.tsx")).toMatch(/Skeleton/);
  });
});
