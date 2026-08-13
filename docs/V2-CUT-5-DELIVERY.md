# Doleth V2 — Corte 5

## Resultado

Plan responde “¿Qué viene ahora?” con una línea temporal de pagos reales. El resumen permite horizontes de 7, 30 y 90 días, mantiene separados los totales ARS y USD y distingue por texto vencidos, hoy, pendientes y realizados.

La confirmación conserva la transacción atómica, la propiedad, el `EXPENSE`, el enlace a `Transaction` y la idempotencia `upcoming-payment:<id>`. El importe puede corregirse y el feedback usa la moneda real de la cuenta. La historia muestra el importe efectivamente confirmado cuando difiere del previsto.

No se modificaron schema, migraciones, ledger, auth, ownership ni semántica de movimientos.

## Alcance diferido

- `UPCOMING_INCOME_DEFERRED`
- `GOALS_DEFERRED`
- `RECURRENCE_RULE_DEFERRED`
- `POSTPONE_CANCEL_DEFERRED`

La propuesta de dominio está en `docs/v2-cut-5-domain-debt.md`. Las fechas de tarjeta no generan obligaciones porque no existe un resumen autoritativo con importe.

## QA

- lint: aprobado
- typecheck: aprobado
- build Next.js: aprobado
- build Storybook: aprobado
- tests sin DB: 1.001 aprobados; 222 pruebas dependientes de infraestructura omitidas
- viewports: 320, 375, 390 y 1440 sin desborde horizontal
- estados: vacío, uno, muchos, vencido, hoy, realizado, cuenta archivada, multimoneda e importe extremo
- confirmación: foco, teclado simulado, CTA alcanzable, error y éxito
- consola: sin errores en las historias auditadas

El QA visual detectó y corrigió una falsa modificación de importe: enfocar `148.300,00` podía normalizarlo a `148.300`; ahora se comparan centavos y no strings de presentación.

## Evidencia

Las capturas están en `docs/screenshots/v2-cut-5/`.

## Concern conocido

`REGRESIÓN FINANCIERA COMPLETA: NO EJECUTADA — pendiente PostgreSQL local`

## Veredicto

`V2_CUT_5_READY_WITH_CONCERNS`

No se avanzó al Corte 6.
