# Auditoría de aislamiento multiusuario

Estado global: `VERIFIED` en PostgreSQL temporal.

## Superficie revisada

- cuentas;
- categorías;
- transacciones;
- asientos;
- inversiones;
- próximos pagos;
- dashboard, historial, filtros y exportación;
- actions financieras;
- sesiones y onboarding;
- scripts de ownership y borrado.

No existe un modelo de objetivos financieros en el esquema actual. La configuración de identidad vive en `User`; las preferencias financieras visibles se obtienen desde la sesión.

## Matriz de ownership

| Modelo | Owner requerido | Índice | Protección en aplicación | Protección DB |
|---|---|---|---|---|
| `Account` | `userId NOT NULL` | Sí | Todas las lecturas/mutaciones por owner | Unique compuesto `(id,userId)` agregado |
| `Category` | `userId NOT NULL` | Sí | Queries y mutaciones por owner | Unique compuesto agregado |
| `Transaction` | `userId NOT NULL` | Sí | IDs se consultan con owner | FKs compuestas a cuentas/categoría/corrección |
| `LedgerEntry` | `userId NOT NULL` | Sí | Solo vía transacción autorizada | FKs compuestas a transacción/cuenta |
| `Investment` | `userId NOT NULL` | Sí | Queries y mutaciones por owner | FK directa a usuario |
| `UpcomingPayment` | `userId NOT NULL` | Sí | Queries y mutaciones por owner | FKs compuestas a cuenta/transacción |

## Resultado de revisión

`VERIFIED` en código:

- El usuario se deriva de la sesión validada; las actions no confían en un `userId` enviado por el cliente.
- Lecturas por ID financiero usan owner, generalmente `findFirst({ id, userId })`.
- Dashboard, historial, agregados y exportación filtran por `userId`.
- Transferencias verifican que ambas cuentas pertenezcan al usuario.
- Corrección, anulación, archivo y próximos pagos verifican owner.
- Las sesiones se validan contra la base y el estado de usuario.
- No se encontraron fixtures conectados a runtime productivo.

## Defectos encontrados y corregidos

### Deduplicación de cuenta reciente

Una consulta de deduplicación buscaba nombre/tipo/saldo recientes sin `userId`. Un usuario podía bloquear la creación equivalente de otro y deducir actividad.

Corrección: agregar `userId: user.id` y un test A/B.

### Deduplicación de inversión reciente

La misma omisión existía en inversiones.

Corrección: agregar `userId: user.id` y un test A/B.

### Referencias cross-owner permitidas por el esquema

Las FKs simples comprobaban existencia, pero no que `Transaction.userId`, `Account.userId`, `Category.userId`, `LedgerEntry.userId` y `UpcomingPayment.userId` coincidieran.

Corrección:

- claves únicas compuestas `(id,userId)`;
- FKs compuestas para cuentas de origen/destino, categoría, corrección, ledger y próximos pagos;
- política `RESTRICT` para preservar evidencia financiera;
- test DB que intenta referencias cruzadas.

## Pruebas A/B

La suite existente cubre:

- invisibilidad en lecturas;
- rechazo de edición/anulación/corrección/transferencia cross-owner;
- archivo, próximos pagos y exportación;
- acceso directo por ID.

Se agregaron pruebas para:

- dos usuarios creando cuentas idénticas dentro de la ventana de deduplicación;
- dos usuarios creando inversiones idénticas;
- rechazo DB de transacción, ledger y próximo pago con referencias de otro owner.

Resultado PostgreSQL 16.14 local:

- 787/787 tests pasaron, cero omitidos;
- suite estricta: 52/52;
- cuenta, categoría, ledger, próximo pago y update cross-owner: `P2003`;
- lectura por ID ajeno: `null`;
- relación válida permaneció intacta tras cada rechazo.

## Riesgos residuales

- Las nuevas FKs deben validarse contra datos legacy para detectar referencias cruzadas existentes.
- No hay Row Level Security de PostgreSQL. La garantía usa filtros de aplicación más constraints compuestas; es suficiente si ambas capas se mantienen, pero RLS podría ser defensa futura.
- Las respuestas de “no encontrado” deben conservarse para no revelar existencia.
- Todo nuevo modelo financiero debe repetir owner no nulo, índice, filtro y test A/B.

## Pendiente externo

El aislamiento técnico quedó verificado en PostgreSQL temporal. Antes de producción todavía faltan smoke A/B sobre preview y preflight productivo read-only.
