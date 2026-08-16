# Corte 6 — entrega

Estado: `V2_CUT_6_READY_WITH_CONCERNS`

Concern conocido: `REGRESIÓN FINANCIERA COMPLETA: NO EJECUTADA — pendiente PostgreSQL local`

## Resultado

- Patrimonio en cuentas reemplaza la antigua lectura de “Mi realidad” en `/mi-realidad`.
- Fórmula visible y trazable: disponible + ahorro + otros + cuentas fuera de uso + deuda con signo.
- Inversiones quedan como cartera separada para impedir doble conteo.
- Lista, detalle, alta y archivar/reactivar usan el modelo actual sin ampliar persistencia.
- Cotización de mercado/manual/declarada queda identificada en cada tenencia.
- Inversiones archivadas quedan fuera del total activo.
- No hay total nominal entre monedas. Si falta conversión, se muestran subtotales nativos.
- No hay gráfico ni historia inventada.

## Deuda técnica declarada

- `NET_WORTH_TOTAL_DEFERRED`
- `INVESTMENT_FUNDING_LINK_DEFERRED`
- `NET_WORTH_HISTORY_DEFERRED`
- `INVESTMENT_EDIT_DEFERRED`
- `INVESTMENT_LEDGER_DEFERRED`

La explicación y evolución segura están en [v2-cut-6-domain-audit.md](./v2-cut-6-domain-audit.md).

## QA

- `pnpm typecheck`: pasa.
- `pnpm lint`: pasa.
- `pnpm build`: pasa.
- `pnpm build-storybook`: pasa; conserva warnings conocidos de módulos Node externalizados.
- Modelo nuevo: 5/5 pruebas pasan.
- Suite no-DB: 66 archivos, 1005 pruebas, todas pasan.
- Regresión DB: no ejecutada; no se apuntó la suite destructiva a la base original.
- Browser: sin errores de consola ni overflow horizontal en 320, 375, 390 y 1440.
- Foco: visible; inputs táctiles; importe >16 px; CTA alcanzable con viewport reducido.

Estados inspeccionados: sin inversiones, una/muchas, ganancia, pérdida, valor manual, cotización faltante, ARS/USD, aporte cero, importe extremo, archivada, detalle, alta con foco y error sin escritura.

## Evidencia visual

- [Patrimonio 320](./screenshots/v2-cut-6/patrimonio-320.png)
- [Patrimonio 375](./screenshots/v2-cut-6/patrimonio-375.png)
- [Cotización faltante 390](./screenshots/v2-cut-6/sin-cotizacion-390.png)
- [Multi-moneda desktop](./screenshots/v2-cut-6/multimoneda-1440.png)
- [Sin inversiones](./screenshots/v2-cut-6/sin-inversiones-390.png)
- [Importe extremo](./screenshots/v2-cut-6/importe-extremo-390.png)
- [Archivada](./screenshots/v2-cut-6/archivada-390.png)
- [Detalle aporte cero](./screenshots/v2-cut-6/detalle-aporte-cero-390.png)
- [Detalle desktop](./screenshots/v2-cut-6/detalle-1440.png)
- [Alta con foco/teclado](./screenshots/v2-cut-6/alta-foco-teclado-390.png)
- [Error de alta sin escritura](./screenshots/v2-cut-6/alta-error-390.png)

## Dominio intacto

Sin cambios en schema, migraciones, ledger, semántica de `Transaction`, auth, ownership, anulaciones, correcciones, multi-moneda, importación ni subledger de inversiones.

No avanzar automáticamente al Corte 7.
