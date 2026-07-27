# Aislamiento de datos entre usuarios

Estado: implementado · Última actualización: 27 de julio de 2026

---

## 1. La regla

> Toda lectura y toda escritura sobre datos financieros están limitadas por el
> identificador del usuario autenticado, obtenido exclusivamente de la sesión
> validada en el servidor.

No hay excepciones. Ocultar información en la interfaz no cuenta.

## 2. Modelo de propiedad

Se eligió **propiedad directa por `userId`**, sin entidad `Workspace`
intermedia. Para finanzas personales sin colaboración, un workspace sería una
tabla más y un join más en cada consulta, sin nada a cambio hoy. Si mañana hace
falta compartir, se agrega `Workspace` y `userId` pasa a resolverse contra la
membresía: el filtro por propietario ya está en todas las consultas, que es la
parte difícil.

Tienen `userId`:

| Modelo | Nota |
| --- | --- |
| `Account` | |
| `Category` | Cada usuario tiene su **propia copia** del catálogo base |
| `Transaction` | |
| `LedgerEntry` | Denormalizado a propósito (ver §4) |
| `Investment` | |
| `UpcomingPayment` | |

`Session`, `AuthToken` y `AuthEvent` cuelgan de `User` por relación directa.

### Por qué las categorías son por usuario

La alternativa era un catálogo global compartido (`userId = NULL`). Se descartó
porque obliga a que cada consulta de categorías tenga una regla distinta al resto
del modelo (`userId = X OR userId IS NULL`), y esa asimetría es exactamente donde
se cuelan los errores de aislamiento. Trece filas por usuario es un costo
despreciable frente a tener **una sola regla** en todo el modelo financiero.

El catálogo se crea en `provisionUserCategories()` al terminar el onboarding, en
la misma transacción que la primera cuenta.

### Índices únicos compuestos

- `Category`: `@@unique([userId, slug])` en lugar de `slug` único global.
- `Transaction`: `@@unique([userId, idempotencyKey])` en lugar de global.

Sin esto, dos usuarios no podrían tener la categoría "Comida", y la clave de
idempotencia de una persona podría colisionar —o ser adivinada— por otra.

## 3. Dónde se aplica

### Lecturas — `src/lib/finance/data.ts`

Todas las funciones reciben `userId` como **primer argumento obligatorio** y lo
ponen en el `where`. No es una convención: sin ese parámetro no compila.

```ts
export async function getAccountsWithBalances(userId: string) {
  const [accounts, totals] = await Promise.all([
    db.account.findMany({ where: { userId }, … }),
    db.ledgerEntry.groupBy({ by: ["accountId"], where: { userId, … } }),
  ]);
}
```

Para el acceso por id existen `getOwnedMovement(userId, id)` y
`getOwnedUpcomingPayment(userId, id)`, que usan `findFirst({ where: { id, userId } })`.
Un id ajeno devuelve `null`, y la página responde **404**. No 403: un 403
confirmaría que ese recurso existe.

### Escrituras — `src/app/actions/finance.ts`

Cada acción abre con `requireOnboardedUserForAction()`. Tres invariantes:

1. **El propietario sale de la sesión.** El archivo no lee ningún campo `userId`
   del `formData`. Es verificable con `grep`.
2. **Todo recurso referido por id se busca filtrando por ese propietario**:
   cuenta origen, cuenta destino, categoría, movimiento original, próximo pago.
3. **Toda escritura graba `userId`**, incluidos los asientos del ledger.

### Casos con más de un recurso

- **Transferencias**: `account.findMany({ where: { id: { in: [origen, destino] }, userId, status: "ACTIVE" } })`
  y después se compara la cantidad de filas contra `new Set(ids).size`. Si
  cualquiera de las dos cuentas no es del usuario, el conteo no coincide y la
  operación se rechaza.
- **Correcciones**: el movimiento original se busca con
  `findFirst({ where: { id, userId } })` dentro de la misma transacción de base
  que hace la anulación y crea el reemplazo.
- **Anulaciones**: `updateMany({ where: { id, userId, voidedAt: null } })`. Si
  `count === 0`, se lanza. No hay ventana entre "verifico" y "escribo".
- **Convertir un próximo pago**: el pago y la categoría de respaldo se buscan
  filtrando por el usuario, dentro de la transacción.

### Navegación

`src/proxy.ts` clasifica rutas. **No es autorización** — ver
`auth-architecture.md` §6.

## 4. Por qué `LedgerEntry` tiene `userId`

Es redundante: se podría llegar al propietario por `transaction.userId` o
`account.userId`. Está igual porque `getAccountsWithBalances` usa
`ledgerEntry.groupBy`, y un `groupBy` con filtro por relación anidada es más
lento y —lo importante— más fácil de escribir mal. Con la columna, el filtro es
`where: { userId }`: imposible de olvidar sin que se note.

La consistencia la garantiza el código: los asientos se crean siempre en el
`create` anidado de su transacción, con el mismo `userId`. Hay una prueba que lo
verifica.

## 5. Cómo está probado

Todo corre contra un PostgreSQL real, con dos usuarios.

**`src/lib/finance/isolation.test.ts`** — lectura (11 pruebas):
cuentas, saldos, historial, filtro por cuenta ajena, acceso por id a movimientos
y pagos, inversiones, próximos pagos, opciones de formulario, panel, y un usuario
recién creado que no hereda nada.

**`src/app/actions/finance.authorization.test.ts`** — escritura (17 pruebas):

- Sin sesión: las acciones con estado devuelven error y no escriben; las acciones
  sin estado lanzan `UnauthorizedError`.
- No puede: archivar cuenta ajena, crear movimiento sobre cuenta ajena, usar
  categoría ajena, transferir hacia o desde una cuenta ajena, anular movimiento
  ajeno, corregir movimiento ajeno, archivar inversión ajena, planificar un pago
  sobre cuenta ajena, convertir un pago ajeno.
- Sí puede transferir entre dos cuentas propias.
- Todo lo que escribe queda con el propietario de la sesión, incluidos los
  asientos del ledger.
- La clave de idempotencia es por usuario: la misma clave en dos cuentas crea dos
  movimientos; repetida dentro de un usuario, no duplica.

Cada caso verifica además el **estado de la base después del intento**, no sólo
el valor devuelto.

**`src/lib/finance/ledger-integrity.test.ts`** — no regresión contable
(8 pruebas): signos, transferencias que no cambian el patrimonio, anulaciones,
correcciones, conversión idempotente de próximos pagos, fechas civiles sin
corrimiento, exclusión de anulados, y conciliación del ledger
(`saldo == inicial + Σ asientos vivos`) después de cada operación. La última
prueba confirma que el usuario vecino no se movió ni un centavo.

**QA de navegador** — ver `manual-qa.md`: usuario B intenta abrir por URL un
movimiento de A → 404, y su pantalla de corrección → 404.

## 6. Deuda conocida: `userId` es nullable

Las columnas `userId` de las tablas financieras admiten `NULL` mientras dura la
migración legacy. Ver `owner-migration-plan.md`.

Consecuencia de seguridad: **ninguna**. Toda consulta filtra por un `userId`
concreto, así que una fila huérfana es invisible para todos los usuarios
(`WHERE "userId" = 'x'` nunca matchea `NULL`). El riesgo es de integridad, no de
filtración: hoy nada a nivel base impide insertar una fila sin propietario.

El endurecimiento a `NOT NULL` está escrito en `docs/auth/sql/owner-not-null.sql`
y se aplica después de verificar el backfill.
