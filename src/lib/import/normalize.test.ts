import { describe, expect, it } from "vitest";
import { inferDateOrder, normalizeDescription, parseImportAmount, parseImportDate, titleCase } from "./normalize";

describe("parseImportAmount", () => {
  it("lee el formato argentino", () => {
    expect(parseImportAmount("1.234,56")).toBe(123_456n);
    expect(parseImportAmount("-1.234,56")).toBe(-123_456n);
    expect(parseImportAmount("$ 1.234,56")).toBe(123_456n);
  });

  /**
   * La ambigüedad que ningún archivo declara: manda el último separador. En
   * `1.234,56` la coma cierra y separa decimales; en `1,234.56` lo hace el punto.
   */
  it("lee el formato inglés sin confundirlo con el argentino", () => {
    expect(parseImportAmount("1,234.56")).toBe(123_456n);
    expect(parseImportAmount("1.234,56")).toBe(123_456n);
  });

  it("lee millones con separadores repetidos", () => {
    expect(parseImportAmount("1.234.567,89")).toBe(123_456_789n);
    expect(parseImportAmount("1,234,567.89")).toBe(123_456_789n);
  });

  it("un solo separador con tres dígitos es agrupamiento de miles", () => {
    expect(parseImportAmount("1.234")).toBe(123_400n);
    expect(parseImportAmount("850.000")).toBe(85_000_000n);
  });

  it("un solo separador con uno o dos dígitos es decimal", () => {
    expect(parseImportAmount("1234,5")).toBe(123_450n);
    expect(parseImportAmount("1234.56")).toBe(123_456n);
  });

  /** Los sistemas contables viejos escriben los débitos entre paréntesis. */
  it("entiende los paréntesis como negativo", () => {
    expect(parseImportAmount("(1.234,56)")).toBe(-123_456n);
  });

  it("entiende el signo al final", () => {
    expect(parseImportAmount("1.234,56-")).toBe(-123_456n);
  });

  it("ignora el código de moneda que algunos exports anteponen", () => {
    expect(parseImportAmount("ARS 1.234,56")).toBe(123_456n);
    expect(parseImportAmount("U$S 100,00")).toBe(10_000n);
  });

  it("sin importe devuelve null en vez de cero", () => {
    expect(parseImportAmount("")).toBeNull();
    expect(parseImportAmount("   ")).toBeNull();
  });

  /** Más de dos decimales no es dinero: es otra columna mal mapeada. */
  it("rechaza lo que no puede ser un importe", () => {
    expect(parseImportAmount("N/D")).toBeNull();
    expect(parseImportAmount("1.234,5678")).toBeNull();
    expect(parseImportAmount("12a34")).toBeNull();
  });

  it("el cero es un importe válido y no un dato faltante", () => {
    expect(parseImportAmount("0,00")).toBe(0n);
  });
});

describe("inferDateOrder", () => {
  /**
   * Adivinar mal el orden corre todos los movimientos de mes sin que nada falle
   * visiblemente. La evidencia está en los datos: un componente mayor que 12 no
   * puede ser un mes.
   */
  it("reconoce día/mes cuando algún día pasa de 12", () => {
    expect(inferDateOrder(["01/08/2026", "25/08/2026"])).toBe("DMY");
  });

  it("reconoce mes/día cuando el segundo componente pasa de 12", () => {
    expect(inferDateOrder(["08/25/2026", "08/01/2026"])).toBe("MDY");
  });

  it("sin evidencia asume el orden argentino", () => {
    expect(inferDateOrder(["01/08/2026", "02/08/2026"])).toBe("DMY");
    expect(inferDateOrder([])).toBe("DMY");
  });
});

describe("parseImportDate", () => {
  it("lee los formatos habituales", () => {
    expect(parseImportDate("01/08/2026")).toBe("2026-08-01");
    expect(parseImportDate("01-08-2026")).toBe("2026-08-01");
    expect(parseImportDate("01.08.2026")).toBe("2026-08-01");
    expect(parseImportDate("2026-08-01")).toBe("2026-08-01");
  });

  it("respeta el orden que se le indica", () => {
    expect(parseImportDate("08/01/2026", "MDY")).toBe("2026-08-01");
    expect(parseImportDate("08/01/2026", "DMY")).toBe("2026-01-08");
  });

  it("lee dos dígitos de año como este siglo", () => {
    expect(parseImportDate("01/08/26")).toBe("2026-08-01");
  });

  /**
   * `new Date` correría un 31 de febrero al 3 de marzo y dejaría un movimiento
   * fechado en un día en el que no pasó nada.
   */
  it("rechaza una fecha que no existe en vez de correrla", () => {
    expect(parseImportDate("31/02/2026")).toBeNull();
    expect(parseImportDate("32/01/2026")).toBeNull();
    expect(parseImportDate("01/13/2026", "DMY")).toBeNull();
  });

  it("rechaza lo que no es una fecha", () => {
    expect(parseImportDate("")).toBeNull();
    expect(parseImportDate("el martes")).toBeNull();
  });
});

describe("normalizeDescription", () => {
  /**
   * El caso que define el módulo: sin separar el procesador, todos los pagos con
   * Mercado Pago se agrupan como un único comercio gigante y el reporte no dice
   * nada.
   */
  it("separa el procesador del comercio", () => {
    const result = normalizeDescription("MERPAGO*COTO DIGITAL");
    expect(result.processor).toBe("Mercado Pago");
    expect(result.merchant).toBe("Coto Digital");
  });

  it("reconoce las variantes de Mercado Pago", () => {
    for (const text of ["MERCADOPAGO*SPOTIFY", "MERC PAGO*SPOTIFY", "MERPAGO*SPOTIFY", "MP*SPOTIFY"]) {
      const result = normalizeDescription(text);
      expect(result.processor, text).toBe("Mercado Pago");
      expect(result.merchant, text).toBe("Spotify");
    }
  });

  it("reconoce otros procesadores del mercado local", () => {
    expect(normalizeDescription("PEDIDOSYA*BURGER").processor).toBe("PedidosYa");
    expect(normalizeDescription("RAPPI*FARMACIA").processor).toBe("Rappi");
    expect(normalizeDescription("DLO*NETFLIX").processor).toBe("dLocal");
    expect(normalizeDescription("UBER * TRIP").processor).toBe("Uber");
  });

  it("saca el ruido que anteponen los bancos", () => {
    expect(normalizeDescription("COMPRA EN COTO CICSA").merchant).toBe("Coto Cicsa");
    expect(normalizeDescription("DEBITO AUTOMATICO EDESUR").merchant).toBe("Edesur");
    expect(normalizeDescription("COMPRA CON TARJETA DE DEBITO SHELL").merchant).toBe("Shell");
  });

  it("saca el número de sucursal del final", () => {
    expect(normalizeDescription("SHELL 1234").merchant).toBe("Shell");
    expect(normalizeDescription("COTO CICSA 0567").merchant).toBe("Coto Cicsa");
  });

  it("detecta la cuota y la saca del nombre", () => {
    const result = normalizeDescription("MERPAGO*FRAVEGA C.03/12");
    expect(result.installment).toEqual({ number: 3, total: 12 });
    expect(result.merchant).toBe("Fravega");
  });

  it("reconoce las formas en que se escribe una cuota", () => {
    expect(normalizeDescription("GARBARINO CUOTA 2/6").installment).toEqual({ number: 2, total: 6 });
    expect(normalizeDescription("GARBARINO CUOTA 2 DE 6").installment).toEqual({ number: 2, total: 6 });
    expect(normalizeDescription("GARBARINO 2/6 CUOTAS").installment).toEqual({ number: 2, total: 6 });
  });

  /**
   * `03/12` a secas es indistinguible de una fecha. Aceptarlo sin una palabra
   * que lo declare cuota rompería los dos hechos a la vez.
   */
  it("no confunde una fecha suelta con una cuota", () => {
    expect(normalizeDescription("PAGO 03/12").installment).toBeNull();
  });

  it("descarta una cuota imposible", () => {
    expect(normalizeDescription("ALGO CUOTA 8/3").installment).toBeNull();
  });

  /**
   * Fusionar dos comercios distintos por limpiar de más es el error que arruina
   * un reporte sin que nadie lo note. Ante la duda, se deja lo que vino.
   */
  it("nunca deja el comercio vacío", () => {
    expect(normalizeDescription("MERPAGO*").merchant).toBe("MERPAGO*");
    expect(normalizeDescription("CUOTA 1/3").merchant).toBe("CUOTA 1/3");
  });

  it("conserva siempre el texto original como evidencia", () => {
    const raw = "MERPAGO*COTODIG 0345 C.03/12";
    expect(normalizeDescription(raw).raw).toBe(raw);
  });

  it("un texto que ya está limpio no se toca de más", () => {
    expect(normalizeDescription("Alquiler").merchant).toBe("Alquiler");
  });
});

describe("titleCase", () => {
  it("deja de gritar", () => {
    expect(titleCase("ALMACEN RODRIGUEZ")).toBe("Almacen Rodriguez");
  });

  /** "YPF" no es "Ypf". */
  it("respeta las siglas cortas", () => {
    expect(titleCase("YPF FULL")).toBe("YPF Full");
    expect(titleCase("AFIP")).toBe("AFIP");
  });

  it("deja las preposiciones en minúscula", () => {
    expect(titleCase("BANCO DE LA NACION")).toBe("Banco de la Nacion");
  });
});
