import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const model = read("src/features/reality/data/getRealityModel.ts");
const page = read("src/features/reality/RealityPage.tsx");
const reality = read("src/lib/finance/reality.ts");
const data = read("src/lib/finance/data.ts");

describe("/mi-realidad: describe, no juzga", () => {
  it("no afirma que la realidad financiera esté completa", () => {
    expect(model).not.toContain("Tu realidad financiera está completa");
    expect(model).toContain("Doleth tiene suficiente información para explicar tu situación registrada");
  });

  it("no felicita ni emite juicios genéricos", () => {
    for (const banned of [
      "Felicitaciones",
      "Vas excelente",
      "Deberías ahorrar",
      "salud financiera",
      "Muy bien",
    ]) {
      expect(model.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  it("no asume que la persona no tiene ingresos", () => {
    expect(model).toContain("No encontramos ingresos registrados en el período.");
  });
});

describe("/mi-realidad: composición reconciliada", () => {
  it("el patrimonio es la suma de los saldos, y lo dice", () => {
    expect(reality).toContain("patrimonyCents = activeCents + archivedCents");
    expect(model).toContain(
      "Fórmula: patrimonio = Σ saldos de cuentas activas + Σ saldos de cuentas archivadas.",
    );
  });

  it("las archivadas se muestran separadas y conservan su historia", () => {
    expect(model).toContain("Fuera del uso cotidiano");
    expect(model).toContain(
      "Estas cuentas conservan su historia, pero están fuera del uso cotidiano.",
    );
  });

  it("las inversiones no se suman al patrimonio y se explica por qué", () => {
    expect(model).toContain("No suma al patrimonio en cuentas");
    expect(model).toContain("no tienen una cuenta que las respalde");
  });

  it("los compromisos no se restan del patrimonio", () => {
    expect(model).toContain(
      "Ninguno de estos importes se resta del patrimonio: son compromisos cargados, no movimientos ocurridos.",
    );
  });

  it("el horizonte de compromisos es el mismo que el de la proyección", () => {
    expect(reality).toContain("PROJECTION_HORIZON_DAYS");
  });

  it("las transferencias y los anulados se declaran sin entrar al resultado", () => {
    expect(model).toContain("no cambian el patrimonio, así que quedan fuera del resultado");
    expect(model).toContain("sin efecto sobre las cifras");
  });
});

describe("/mi-realidad: calidad de la información", () => {
  it("usa señales explícitas con denominador, no un puntaje", () => {
    expect(model).toContain("Señales explícitas, no un puntaje");
    expect(model).toContain("de ${result.totalSignals}");
  });

  it("cada señal dice qué se verificó y por qué importa", () => {
    expect(model).toContain("matters:");
    expect(model).toContain("reading:");
  });

  it("hay entre cuatro y siete señales, no un tablero", () => {
    const ids = reality.match(/\{ id: "[a-z-]+", met:/g) ?? [];
    expect(ids.length).toBeGreaterThanOrEqual(4);
    expect(ids.length).toBeLessThanOrEqual(7);
  });

  it("una lectura caída no cuenta como información faltante", () => {
    expect(reality).toContain("unverifiableSignals");
    expect(model).toContain("quedan fuera del recuento en vez de contarse como faltantes");
  });

  it("el estado de la señal no depende solo del color", () => {
    expect(page).toContain('signal.state === "met" ? " · cumplida" : " · falta"');
  });
});

describe("/mi-realidad: estados", () => {
  it("sin cuentas declara la pantalla vacía", () => {
    expect(model).toContain("Tu realidad financiera todavía está vacía.");
    expect(model).toContain("Creá una cuenta para empezar a representar dónde está tu dinero.");
  });

  it("con solo saldo inicial pide movimientos, no cuentas", () => {
    expect(model).toContain(
      "Ya representaste dónde está tu dinero. Falta información para explicar cómo cambia.",
    );
  });

  it("sin pagos próximos lo dice sin alarmar", () => {
    expect(model).toContain("No hay compromisos próximos cargados.");
    expect(model).toContain("Tu proyección solo refleja el dinero actual.");
  });

  it("con datos parciales declara el alcance de la lectura", () => {
    expect(model).toContain("Esta lectura usa únicamente la información cargada en Doleth.");
  });
});

describe("/mi-realidad: resiliencia", () => {
  it("las inversiones y los compromisos son secundarios y degradan declarándose", () => {
    expect(data).toContain("() => getInvestments()");
    expect(data).toContain('reportSecondaryRead("/mi-realidad", "investments")');
    expect(model).toContain("No pudimos cargar las inversiones.");
    expect(model).toContain("Tu patrimonio en cuentas sigue disponible");
    expect(model).toContain("No pudimos cargar los próximos pagos.");
  });

  it("las cuentas y el ledger son datos centrales: no se atrapan", () => {
    // getAccountsWithBalances se llama directo dentro de getRealityData.
    expect(data).toContain("getRealityData");
    expect(data).not.toContain("resilientRead(() => getAccountsWithBalances())");
  });

  it("un fallo no se convierte en cero silencioso", () => {
    expect(reality).toContain("investmentsAvailable");
    expect(reality).toContain("commitmentsAvailable");
  });
});

describe("/mi-realidad: navegación y estructura", () => {
  it("no recarga la app", () => {
    expect(page).not.toContain("window.location.assign");
    expect(page).not.toContain("window.location.href");
    expect(page).toContain('from "next/navigation"');
    expect(page).toContain("router.push");
  });

  it("cada sección es una región con nombre", () => {
    expect(page).toContain("<section aria-label={section.title}");
    expect(page).toContain("<section aria-label={model.quality.title}");
  });

  it("las señales son una lista real", () => {
    expect(page).toContain("<ul");
    expect(page).toContain("<li");
  });

  it("los avisos de degradación se anuncian", () => {
    expect(page).toContain('role="status"');
  });

  it("una sola acción principal, con enlace real al cierre", () => {
    expect(page.match(/primaryActionLink/g)?.length).toBeGreaterThan(0);
    expect(model).toContain('href: "/mi-realidad/cierre"');
    expect(page).toContain('from "next/link"');
  });
});
