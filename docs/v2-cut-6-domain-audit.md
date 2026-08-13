# Corte 6 — auditoría de patrimonio e inversiones

## Modelo vigente

`Investment` es una tenencia/snapshot: nombre, clase, símbolo, moneda, aporte acumulado, cantidad, valor actual, nota y estado. No tiene cuenta de fondeo, operaciones, lotes ni vínculo con `Transaction`.

## Patrimonio en cuentas

Fórmula publicada:

`Patrimonio en cuentas = disponible activo + ahorro activo + otros activos + cuentas archivadas no pasivas + deuda`

Cada cuenta aparece exactamente una vez. La deuda conserva su signo real: el saldo de tarjeta negativo reduce patrimonio. El saldo de cuenta proviene de `saldo inicial + asientos vigentes del ledger`; anulaciones y correcciones conservan las reglas actuales.

Las cuentas archivadas siguen representando valor económico y por eso integran el patrimonio. Las inversiones archivadas no integran la cartera activa.

## Inversiones

El valor de cada tenencia usa, en orden, precio de mercado disponible, precio manual disponible o valor declarado. El resultado individual es `valor actual − aporte`. Con aporte cero se muestra el resultado absoluto sin porcentaje.

La cartera activa se totaliza solo cuando todas sus monedas tienen conversión válida. Si falta una cotización o conversión, se muestran subtotales nativos por moneda; nunca se suma ARS y USD nominalmente. El rendimiento agregado requiere conversión completa tanto del valor actual como del aporte.

## Límite de doble conteo

Una persona puede comprar una inversión con dinero de una cuenta sin que el modelo reduzca esa cuenta ni registre el origen. Sumar ambas superficies podría contar el mismo capital dos veces. Por eso:

- `NET_WORTH_TOTAL_DEFERRED`: no existe total combinado cuentas + inversiones.
- `INVESTMENT_FUNDING_LINK_DEFERRED`: falta el vínculo verificable con la cuenta de fondeo.
- `NET_WORTH_HISTORY_DEFERRED`: no existe una serie histórica combinada autoritativa.
- `INVESTMENT_EDIT_DEFERRED`: el dominio vigente permite alta y archivar/reactivar, pero no posee acción de actualización segura.
- `INVESTMENT_LEDGER_DEFERRED`: no se inventa un subledger de inversiones.

## Evolución segura propuesta

Un futuro subledger debería modelar compra, venta, aporte, retiro, comisión y valuación; incluir activo, cantidad, moneda, cuenta de fondeo, fecha, idempotencia y vínculo explícito con la transacción financiera. Solo entonces podría reconstruirse costo, flujo, historia y patrimonio combinado sin duplicación.

No se muestra gráfico en este corte: una curva basada en snapshots actuales sería historia falsa.

## Dominio no tocado

Sin cambios en schema, migraciones, ledger, semántica de `Transaction`, auth, ownership, anulaciones, correcciones, multi-moneda, importación ni modelo de inversiones.
