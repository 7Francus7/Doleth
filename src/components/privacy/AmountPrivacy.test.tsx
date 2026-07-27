import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SensitiveAmount, SensitiveText } from "./AmountPrivacy";
import { NumericValue } from "../../design-system/primitives/NumericValue";

describe("privacidad visual de importes", () => {
  it("reserva importe y máscara en el mismo contenedor estable", () => {
    const html = renderToStaticMarkup(<SensitiveAmount>$1.234.567,89</SensitiveAmount>);
    expect(html).toContain("data-sensitive-amount");
    expect(html).toContain("$1.234.567,89");
    expect(html).toContain("••••••");
  });

  it("NumericValue protege monedas, pero no porcentajes", () => {
    const money = renderToStaticMarkup(<NumericValue prefix="$" value="42.500" />);
    const percent = renderToStaticMarkup(<NumericValue suffix="%" value="12,5" />);
    expect(money).toContain("data-sensitive-amount");
    expect(percent).not.toContain("data-sensitive-amount");
  });

  it("protege cada importe incrustado en una explicaciÃ³n", () => {
    const html = renderToStaticMarkup(
      <SensitiveText>Quedan $73.000 y faltan -$18.500,50.</SensitiveText>,
    );
    expect(html.match(/data-sensitive-amount/g)).toHaveLength(2);
    expect(html).toContain("Quedan ");
    expect(html).toContain(" y faltan ");
  });

  it("la preferencia es local al dispositivo y se aplica antes del primer render", () => {
    const source = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(source).toContain("localStorage.getItem('doleth.hideAmounts')");
    expect(source).toContain("dataset.amountsHidden");
    expect(source).not.toContain("cookies()");
  });

  it("los campos de importe no dependen de la máscara", () => {
    const source = readFileSync(
      join(process.cwd(), "src/design-system/primitives/AmountInput/AmountInput.tsx"),
      "utf8",
    );
    expect(source).not.toContain("SensitiveAmount");
    expect(source).toContain("value={value}");
  });

  it("cerrar sesión no envía la preferencia al servidor ni la borra", () => {
    const source = readFileSync(join(process.cwd(), "src/app/actions/session.ts"), "utf8");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("doleth.hideAmounts");
    expect(source).toContain('store.delete("doleth_session")');
  });
});
