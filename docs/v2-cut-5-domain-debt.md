# Corte 5 — alcance real y deuda de dominio

## Lo que existe

`UpcomingPayment` representa exclusivamente una salida futura. Persiste concepto, importe estimado, vencimiento, cuenta prevista, frecuencia como texto libre y estado `PENDING | PAID`. Confirmar crea un `EXPENSE` y enlaza su `Transaction` dentro de una única transacción de base de datos. La clave `upcoming-payment:<id>` conserva la idempotencia.

El Plan usa ese modelo sin reinterpretarlo: muestra próximos pagos, vencidos y confirmados; agrupa importes por moneda nativa; y nunca suma ARS con USD. Las fechas de cierre y vencimiento de una tarjeta no prueban por sí solas que exista una obligación ni un importe de resumen, por lo que no generan filas.

## Diferido

- `UPCOMING_INCOME_DEFERRED`: no existe una entidad persistida de ingresos previstos. Plan lo declara sin mostrar un cero ficticio.
- `GOALS_DEFERRED`: no existe un modelo de metas.
- `RECURRENCE_RULE_DEFERRED`: `frequency` es texto. “Repetir el mes siguiente” es una duplicación manual explícita, no una regla recurrente.
- `POSTPONE_CANCEL_DEFERRED`: no hay estados ni acciones para posponer o cancelar.

## Propuesta futura de recurrencia

Una evolución segura requiere una `RecurrenceRule` propiedad del usuario, con concepto, importe, cuenta, cadencia estructurada, fecha base, próxima ocurrencia y estado activo/pausado/cancelado. Cada instancia debe seguir siendo un `UpcomingPayment` independiente, ligado a regla y período mediante una unicidad que impida duplicados. La historia confirmada debe permanecer inmutable. Esto exige schema, migración, autorización y regresión financiera completa; queda fuera del Corte 5.

Ingresos previstos y metas también requieren modelos propios y no deben simularse con signos, categorías o pagos negativos.
