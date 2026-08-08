import { describe, expect, it } from "vitest";
import { decodeBytes, detectDelimiter, parseCsv, parseDelimited, trimToTable } from "./csv";

const utf8 = (text: string) => new TextEncoder().encode(text);

/** Codifica en Windows-1252, que es lo que exportan muchos homebankings. */
const latin1 = (text: string) => Uint8Array.from([...text].map((char) => char.charCodeAt(0)));

describe("decodeBytes", () => {
  it("lee UTF-8", () => {
    expect(decodeBytes(utf8("Café con leche")).text).toBe("Café con leche");
    expect(decodeBytes(utf8("hola")).encoding).toBe("utf-8");
  });

  /**
   * Se prueba UTF-8 primero y se cae a Windows-1252, no al revés: Windows-1252
   * acepta cualquier byte, así que nunca fallaría y leería un archivo UTF-8 con
   * las tildes rotas sin avisar.
   */
  it("cae a Windows-1252 cuando el archivo no es UTF-8 válido", () => {
    const result = decodeBytes(latin1("Almacén Rodríguez"));
    expect(result.encoding).toBe("windows-1252");
    expect(result.text).toBe("Almacén Rodríguez");
  });

  /**
   * Un BOM que sobrevive se cuela como carácter invisible en el nombre de la
   * primera columna, y después ninguna detección la encuentra.
   */
  it("saca el BOM antes de decodificar", () => {
    const bytes = Uint8Array.from([0xef, 0xbb, 0xbf, ...utf8("Fecha;Importe")]);
    expect(decodeBytes(bytes).text).toBe("Fecha;Importe");
  });
});

describe("detectDelimiter", () => {
  it("reconoce el punto y coma de los exports en español", () => {
    const text = "Fecha;Descripcion;Importe\n01/08/2026;Coto;-1.234,56\n02/08/2026;Shell;-8.000,00";
    expect(detectDelimiter(text)).toBe(";");
  });

  it("reconoce la coma", () => {
    const text = "Date,Description,Amount\n2026-08-01,Coto,-1234.56\n2026-08-02,Shell,-8000.00";
    expect(detectDelimiter(text)).toBe(",");
  });

  it("reconoce el tabulador", () => {
    const text = "Fecha\tDetalle\tImporte\n01/08/2026\tCoto\t-1234,56";
    expect(detectDelimiter(text)).toBe("\t");
  });

  /**
   * El caso que arruina el conteo ingenuo: la descripción tiene comas propias.
   * Gana el separador que produce el mismo ancho en casi todas las filas, no el
   * que más aparece.
   */
  it("no se deja engañar por comas dentro de las descripciones", () => {
    const text = [
      "Fecha;Descripcion;Importe",
      "01/08/2026;Compra en Coto, sucursal Centro;-1.234,56",
      "02/08/2026;Pago a Juan, Pedro y Ana;-8.000,00",
      "03/08/2026;Shell;-5.000,00",
    ].join("\n");
    expect(detectDelimiter(text)).toBe(";");
  });

  it("no elige un separador que no separa nada", () => {
    expect(detectDelimiter("una sola columna\notra fila")).toBe(",");
  });
});

describe("parseDelimited", () => {
  it("respeta las comillas y el separador que contienen", () => {
    const rows = parseDelimited('Fecha,Detalle,Importe\n01/08/2026,"Coto, Centro",-1234.56', ",");
    expect(rows[1]).toEqual(["01/08/2026", "Coto, Centro", "-1234.56"]);
  });

  it("entiende una comilla escapada dentro del campo", () => {
    const rows = parseDelimited('a,"dice ""hola"" fuerte",b', ",");
    expect(rows[0]).toEqual(["a", 'dice "hola" fuerte', "b"]);
  });

  /** Una descripción larga puede venir partida en dos líneas dentro de comillas. */
  it("no corta una fila en un salto de línea entrecomillado", () => {
    const rows = parseDelimited('a,"linea uno\nlinea dos",c', ",");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.[1]).toBe("linea uno\nlinea dos");
  });

  it("trata \\r\\n como un solo corte", () => {
    expect(parseDelimited("a,b\r\nc,d", ",")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("descarta las líneas vacías", () => {
    expect(parseDelimited("a,b\n\n\nc,d\n", ",")).toHaveLength(2);
  });
});

describe("trimToTable", () => {
  /**
   * Los exports bancarios abren con el nombre del banco, la cuenta y el período,
   * cada uno en su propia fila de una celda. La tabla empieza después.
   */
  it("saltea el encabezado institucional", () => {
    const rows = [
      ["Banco de la Nación Argentina"],
      ["Cuenta 0123456789"],
      ["Período: 01/08/2026 al 31/08/2026"],
      ["Fecha", "Descripcion", "Importe"],
      ["01/08/2026", "Coto", "-1.234,56"],
      ["02/08/2026", "Shell", "-8.000,00"],
    ];
    const result = trimToTable(rows);
    expect(result.skippedLeading).toBe(3);
    expect(result.rows[0]).toEqual(["Fecha", "Descripcion", "Importe"]);
    expect(result.rows).toHaveLength(3);
  });

  it("corta el pie de totales y leyendas", () => {
    const rows = [
      ["Fecha", "Descripcion", "Importe"],
      ["01/08/2026", "Coto", "-1.234,56"],
      ["TOTAL"],
      ["Este resumen no constituye comprobante fiscal."],
    ];
    expect(trimToTable(rows).rows).toHaveLength(2);
  });

  it("un archivo que ya es una tabla limpia queda igual", () => {
    const rows = [
      ["Fecha", "Descripcion", "Importe"],
      ["01/08/2026", "Coto", "-1.234,56"],
    ];
    expect(trimToTable(rows).rows).toEqual(rows);
    expect(trimToTable(rows).skippedLeading).toBe(0);
  });

  it("no rompe ante un archivo sin tabla reconocible", () => {
    expect(trimToTable([["solo"], ["texto"]]).rows).toHaveLength(2);
  });
});

describe("parseCsv", () => {
  it("lee de punta a punta un export típico en Windows-1252", () => {
    const contents = [
      "Banco Ejemplo",
      "Fecha;Descripción;Débito;Crédito",
      "01/08/2026;Almacén Rodríguez;1.234,56;",
      "02/08/2026;Sueldo;;850.000,00",
    ].join("\r\n");

    const grid = parseCsv(latin1(contents));
    expect(grid.encoding).toBe("windows-1252");
    expect(grid.delimiter).toBe(";");
    expect(grid.rows).toHaveLength(4);
    expect(grid.rows[2]).toEqual(["01/08/2026", "Almacén Rodríguez", "1.234,56", ""]);
  });

  it("un archivo vacío no rompe", () => {
    expect(parseCsv(utf8("")).rows).toEqual([]);
  });
});
