# Auditoría de integridad financiera

Estado global: `READY_WITH_CONCERNS`.

## Representación monetaria

`VERIFIED`: importes, saldos y agregados persistidos usan enteros `BigInt` en centavos. La entrada monetaria se valida con texto y se convierte a `BigInt`; no se usa `float` para contabilidad.

## Invariantes

| Invariante | Estado | Evidencia |
|---|---|---|
| Ingreso/gasto con signo coherente | `VERIFIED` | Dominio normaliza dirección y ledger firmado. |
| Transferencia no crea dinero | `VERIFIED` en código | Débito y crédito de igual magnitud y signo opuesto. |
| Transferencia atómica | `VERIFIED` en código | Transacción Prisma incluye movimiento y ambos asientos. |
| Operación fallida sin escrituras parciales | `READY_WITH_CONCERNS` | Uso transaccional; falta prueba DB de fallo inducido en el entorno final. |
| Corrección conserva original | `VERIFIED` | Original se anula y se crea reemplazo enlazado, en transacción. |
| Anulación conserva evidencia | `VERIFIED` | No borra movimiento/asientos; marca `voidedAt`. |
| Anulados no afectan saldos | `VERIFIED` en consultas/tests sin DB | Agregados filtran transacciones anuladas. |
| Referencias del mismo owner | `READY_WITH_CONCERNS` | Validación de aplicación más nueva migración de FKs compuestas; falta rehearsal. |
| Próximos pagos y categorías por owner | `READY_WITH_CONCERNS` | Filtros implementados y constraints agregadas. |
| Idempotencia de comandos | `READY_WITH_CONCERNS` | Claves/ventanas de deduplicación reducen dobles envíos; no existe una clave idempotente universal para toda mutación. |
| Reconciliación | `READY_WITH_CONCERNS` | Scripts/tests de auditoría; no hay job continuo ni alerta. |

## Saldo inicial y reconstrucción

El saldo se reconstruye como:

```text
Account.initialBalanceCents + suma de LedgerEntry.amountCents vivos
```

Por diseño, el saldo inicial no es un asiento. Por tanto:

- `VERIFIED`: el saldo de aplicación puede reconstruirse con cuenta + ledger.
- `READY_WITH_CONCERNS`: no puede reconstruirse desde el ledger puro si se pierde `initialBalanceCents`.

No se cambió este modelo porque no se demostró un defecto que justifique una migración contable en este corte.

## Fecha civil argentina

`VERIFIED` en código:

- fechas financieras de día civil usan `DateOnly`/`@db.Date`;
- validación y presentación evitan desplazamiento de día;
- formatos relevantes usan zona `America/Argentina/Buenos_Aires`.

Debe verificarse en navegador alrededor de medianoche y cambio de mes durante el smoke.

## Consistencia y políticas de borrado

- Los modelos financieros no se eliminan como parte de una corrección/anulación.
- Las nuevas relaciones sensibles usan `RESTRICT`, evitando que borrar cuenta/categoría/transacción destruya evidencia o deje referencias silenciosas.
- Relación usuario-finanzas mantiene cascada para el flujo explícito de borrado total de cuenta, documentado por separado.
- `Transaction.correctedFrom` queda restringida y única por owner.

## Evidencia histórica

El backfill local preservado reporta:

- conteos pre/post iguales;
- checksums funcionales iguales;
- 1 cuenta, 13 categorías, 1 transacción y 1 asiento asignados al owner;
- cero filas nulas después;
- una transacción anulada explicaría que el ledger total sea distinto del ledger vivo, sin afectar saldo.

No se infiere de esto el estado actual de la base.

## Riesgos residuales

- Falta ejecutar las pruebas de atomicidad y aislamiento contra PostgreSQL real.
- No existe reconciliación programada entre transacciones y ledger.
- El saldo inicial fuera del ledger aumenta la importancia de backups completos.
- La deduplicación heurística no sustituye claves idempotentes entregadas por cliente.
- No se verificaron restauración ni PITR.
- No se ejecutó un cierre de saldos antes/después de migraciones sobre una copia productiva.

## Validación requerida

1. Suite DB completa.
2. Migraciones desde cero y desde estado legacy.
3. Fallos inducidos dentro de transacciones.
4. Reconciliación de conteos, sumas y checksums.
5. Smoke con ingreso, gasto, transferencia, corrección y anulación.
6. Restauración ensayada en una rama/base separada.
