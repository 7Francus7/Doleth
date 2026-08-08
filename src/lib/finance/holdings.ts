/**
 * Tenencias valuadas por cantidad y precio.
 *
 * Hasta acá una inversión guardaba un "valor actual" tipeado a mano. Eso obliga
 * a la persona a actualizar un número cada vez que quiere saber cuánto tiene, y
 * en la práctica significa que el número está siempre viejo: nadie entra a la app
 * a corregir el precio de una acción antes de mirarla.
 *
 * Una tenencia real tiene dos partes que cambian a distinto ritmo: **cuánto
 * tengo** —que sólo cambia cuando comprás o vendés— y **cuánto vale cada unidad**
 * —que cambia solo—. Separarlas es lo que permite que el valor se actualice sin
 * que nadie toque nada.
 *
 * No todo se puede modelar así, y el módulo no pretende lo contrario. Un
 * departamento no tiene cotización, y forzarlo a tener "cantidad" y "precio
 * unitario" sería inventar precisión. Por eso conviven las dos formas: una
 * tenencia con cantidad se valúa con su precio, y una sin cantidad conserva el
 * valor declarado. Lo que no se hace nunca es mezclar: cada tenencia declara cómo
 * se valúa, y la pantalla lo dice.
 *
 * Es puro: sin base, sin red.
 */

import { divideRounded, RATE_SCALE, type Currency } from "./currency";

/**
 * Escala de las cantidades: millonésimas de unidad.
 *
 * Seis decimales cubren 0,00000001 BTC redondeado y cualquier fracción de un
 * CEDEAR. Es la misma escala que las cotizaciones, así que multiplicar cantidad
 * por precio y volver a centavos es una sola división por una constante conocida.
 */
export const QUANTITY_SCALE = RATE_SCALE;

/** Cómo se sabe cuánto vale una tenencia. */
export type ValuationMode =
  /** Cantidad por precio de mercado. El valor se actualiza solo. */
  | "market"
  /** Cantidad por un precio que cargó la persona. */
  | "manual-price"
  /** Un valor declarado, sin cantidad ni precio. Un inmueble, por ejemplo. */
  | "declared";

export interface Holding {
  id: string;
  name: string;
  kind: string;
  currency: Currency;
  /** Cuánto se puso, en centavos. Es historia y no cambia con el precio. */
  investedCents: bigint;
  /** Unidades en millonésimas. `null` cuando la tenencia no se cuenta por unidades. */
  quantityMicros: bigint | null;
  /** Símbolo con el que se busca el precio. */
  symbol: string | null;
  /** Valor declarado a mano. Se usa cuando no hay cantidad o no hay precio. */
  declaredValueCents: bigint;
}

/** Precio de una unidad, ya resuelto. */
export interface UnitPrice {
  symbol: string;
  currency: Currency;
  /** Precio por unidad, en millonésimas de la moneda. */
  priceMicros: bigint;
  asOf: Date;
  /** Quién lo publicó, o `null` si lo cargó la persona. */
  provider: string | null;
}

export interface ValuedHolding extends Holding {
  /** Valor actual en centavos, cualquiera sea el modo. */
  valueCents: bigint;
  mode: ValuationMode;
  /** Precio usado, si la valuación pasó por uno. */
  price: UnitPrice | null;
  /** Ganancia o pérdida contra lo invertido. */
  resultCents: bigint;
  /** Rendimiento en centésimas de punto: 1250 es 12,50 %. `null` si no se invirtió nada. */
  returnBasisPoints: number | null;
}

/**
 * Valor de una cantidad a un precio dado.
 *
 * `cantidad_micros × precio_micros` da un número escalado por 10¹², y el valor en
 * centavos necesita dividir por 10¹²/100. Se hace en una sola división redondeada
 * para no encadenar dos redondeos, igual que en la conversión de monedas.
 */
export function valueOfQuantity(quantityMicros: bigint, priceMicros: bigint): bigint {
  return divideRounded(quantityMicros * priceMicros, (QUANTITY_SCALE * RATE_SCALE) / 100n);
}

/**
 * Valúa una tenencia con el precio que le corresponda, si lo hay.
 *
 * El orden no es arbitrario: manda la cantidad cuando existe y hay precio,
 * porque es la única lectura que se mantiene sola. Si falta el precio se cae al
 * valor declarado en vez de mostrar cero, y el modo lo dice para que la pantalla
 * pueda avisar que ese número es el último que se cargó a mano y no el de hoy.
 */
export function valueHolding(holding: Holding, price: UnitPrice | null): ValuedHolding {
  const usesMarket = holding.quantityMicros !== null && holding.quantityMicros > 0n && price !== null;

  const valueCents = usesMarket
    ? valueOfQuantity(holding.quantityMicros!, price.priceMicros)
    : holding.declaredValueCents;

  const mode: ValuationMode = usesMarket
    ? price.provider === null
      ? "manual-price"
      : "market"
    : "declared";

  const resultCents = valueCents - holding.investedCents;

  return {
    ...holding,
    valueCents,
    mode,
    price: usesMarket ? price : null,
    resultCents,
    returnBasisPoints:
      holding.investedCents === 0n ? null : Number((resultCents * 10_000n) / holding.investedCents),
  };
}

export interface Portfolio {
  holdings: ValuedHolding[];
  totalValueCents: bigint;
  totalInvestedCents: bigint;
  totalResultCents: bigint;
  returnBasisPoints: number | null;
  /** Cuántas tenencias se valúan solas contra un precio publicado. */
  marketCount: number;
  /**
   * Cuántas se valúan por cantidad × precio, pero con un precio que cargó la
   * persona. Se cuentan aparte de `marketCount` porque no se actualizan solas —
   * hay que tocar el precio— y aparte de `declaredCount` porque cambiar ese
   * precio sí actualiza el valor de toda la tenencia de una.
   */
  manualPriceCount: number;
  /** Tenencias cuyo valor es el último que alguien escribió a mano. */
  declaredCount: number;
  /**
   * Símbolos con cantidad cargada para los que no se encontró precio. La
   * pantalla los declara: son los que están mostrando un número viejo.
   */
  missingPrices: string[];
  /** La cotización más vieja de las que se usaron, o `null` si no se usó ninguna. */
  oldestPriceAsOf: Date | null;
}

/** Valúa la cartera entera y saca los totales. */
export function valuePortfolio(
  holdings: readonly Holding[],
  priceBySymbol: ReadonlyMap<string, UnitPrice>,
): Portfolio {
  const valued = holdings.map((holding) => {
    const key = holding.symbol?.trim().toUpperCase();
    // El precio tiene que estar en la moneda de la tenencia. Un precio en dólares
    // aplicado a una tenencia en pesos daría un valor multiplicado por mil sin
    // que nada falle visiblemente, así que la moneda se verifica acá.
    const candidate = key ? priceBySymbol.get(key) : undefined;
    const price = candidate && candidate.currency === holding.currency ? candidate : null;
    return valueHolding(holding, price);
  });

  const totalValueCents = valued.reduce((total, holding) => total + holding.valueCents, 0n);
  const totalInvestedCents = valued.reduce((total, holding) => total + holding.investedCents, 0n);
  const totalResultCents = totalValueCents - totalInvestedCents;

  const used = valued.map((holding) => holding.price?.asOf).filter((asOf): asOf is Date => asOf !== undefined);

  return {
    holdings: valued,
    totalValueCents,
    totalInvestedCents,
    totalResultCents,
    returnBasisPoints:
      totalInvestedCents === 0n ? null : Number((totalResultCents * 10_000n) / totalInvestedCents),
    marketCount: valued.filter((holding) => holding.mode === "market").length,
    manualPriceCount: valued.filter((holding) => holding.mode === "manual-price").length,
    declaredCount: valued.filter((holding) => holding.mode === "declared").length,
    missingPrices: valued
      .filter((holding) => holding.mode === "declared" && holding.quantityMicros !== null && holding.symbol)
      .map((holding) => holding.symbol!.trim().toUpperCase()),
    oldestPriceAsOf: used.length === 0 ? null : used.reduce((oldest, asOf) => (asOf < oldest ? asOf : oldest)),
  };
}

/**
 * Cuánto pesa cada tenencia en la cartera, en centésimas de punto.
 *
 * Se calcula sobre el total valuado y no sobre lo invertido: la pregunta que
 * responde es "¿qué parte de lo que tengo hoy está en esto?", que es la que
 * importa para decidir si estás demasiado concentrado en un solo lugar.
 */
export function weightBasisPoints(valueCents: bigint, totalCents: bigint): number {
  if (totalCents === 0n) return 0;
  return Number((valueCents * 10_000n) / totalCents);
}

/**
 * Lee una cantidad escrita por una persona.
 *
 * Admite hasta seis decimales, que es la escala que guarda. Acepta coma o punto
 * como separador decimal sin ambigüedad, porque una cantidad no lleva separador
 * de miles: nadie escribe "1.000,5 acciones" en un campo de cantidad, y tratar el
 * punto como miles rompería "0.5 BTC", que sí se escribe todo el tiempo.
 */
export function parseQuantityInput(input: string): bigint | null {
  const raw = input.trim().replace(/\s/g, "").replace(",", ".");
  if (raw === "") return null;
  if (!/^\d*\.?\d*$/.test(raw) || raw === ".") return null;

  const [whole = "0", fraction = ""] = raw.split(".");
  if (fraction.length > 6) return null;

  const micros = BigInt(whole || "0") * QUANTITY_SCALE + BigInt(fraction.padEnd(6, "0") || "0");
  return micros > 0n ? micros : null;
}

/** Lectura de una cantidad: sin decimales inútiles, con separador argentino. */
export function formatQuantity(quantityMicros: bigint): string {
  const whole = quantityMicros / QUANTITY_SCALE;
  const fraction = (quantityMicros % QUANTITY_SCALE).toString().padStart(6, "0").replace(/0+$/, "");
  const groupedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return fraction === "" ? groupedWhole : `${groupedWhole},${fraction}`;
}
