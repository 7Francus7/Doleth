# Migración del owner original

Estado: ensayado de punta a punta en local · **No ejecutado en producción**
Última actualización: 27 de julio de 2026

---

## 1. Qué hay que preservar

La base de producción de Doleth contiene la información financiera real del
owner original, cargada durante la etapa de un solo usuario: cuentas con sus
saldos iniciales, movimientos, asientos del ledger, inversiones y próximos pagos.

**Nada de eso se puede perder, ni cambiar de importe, fecha o relación.**

## 2. Estrategia: expand → backfill → contract

Deliberadamente en tres pasos, no en uno.

### Paso 1 — expand (automático)

Migración `202607270001_multiuser_identity`:

- Crea las tablas de identidad (`User`, `Session`, `AuthToken`, `AuthEvent`,
  `RateLimitCounter`, `OwnerBackfillRun`).
- Agrega `userId` **nullable** a las seis tablas financieras, más sus índices.
- Reemplaza dos índices únicos globales por compuestos con el propietario
  (`Category.slug` → `(userId, slug)`; `Transaction.idempotencyKey` →
  `(userId, idempotencyKey)`). La unicidad anterior queda contenida en la nueva:
  no se pierde ninguna fila.

**No modifica ni una fila existente.** Es aplicable con `prisma migrate deploy`
sin riesgo y sin ventana de mantenimiento.

Efecto inmediato: los datos del owner quedan invisibles en la aplicación, porque
toda consulta filtra por un `userId` concreto y esas filas tienen `NULL`. Es una
degradación **controlada y fail-closed**, no una pérdida. Dura hasta el paso 2.

### Paso 2 — backfill (manual, controlado)

```bash
# 1. Crear la cuenta del owner desde la aplicación: /crear-cuenta + verificar el correo.
# 2. Ensayo sin escribir:
pnpm db:backfill-owner -- --email=vos@ejemplo.com --dry-run
# 3. Ejecución real:
pnpm db:backfill-owner -- --email=vos@ejemplo.com
```

`prisma/backfill-owner.ts`:

- **No inventa un usuario.** Exige `--email` de una cuenta ya creada desde la
  aplicación. Si no existe, aborta. Nunca se usa un id inventado en producción.
- Reclama **sólo** filas con `userId IS NULL`. Correrlo dos veces no cambia nada
  la segunda vez.
- **Aborta ante ambigüedad**: si hay huérfanos y algún otro usuario tiene datos
  propios, la pertenencia no es determinable y no escribe nada. Igual si detecta
  propiedad parcial (un movimiento huérfano con asientos ya asignados).
- Escribe **únicamente** la columna `userId` de las tablas financieras, más el
  estado de onboarding del owner. **No crea ni borra ninguna fila**: ni
  categorías, ni movimientos compensatorios. No toca importes, monedas, fechas,
  tipos, estados ni relaciones contables. No reconstruye el ledger.
- Todo en **una sola transacción**, con las verificaciones adentro: si algo no
  cierra, Postgres revierte y no queda nada escrito.
- Verifica, antes de confirmar: cero huérfanos restantes; la cantidad de filas de
  **otros** usuarios sin cambios; los conteos de propiedad exactos; y **cero
  diferencias contables** contra la captura previa —saldo por cuenta, saldo
  inicial, ledger vivo y total, asientos, moneda y estado; total, anulados e
  importes por tipo; débitos y créditos; correcciones; transferencias;
  inversiones; próximos pagos—.
- Deja evidencia en `OwnerBackfillRun` y, con `--out`, en un JSON.

Como el backfill no crea filas, las sumas de control tienen que dar
**exactamente** iguales, sin excepciones. Completar el catálogo de categorías del
owner es un paso aparte: `pnpm db:seed`, que es aditivo e idempotente.

### Paso 3 — contract (manual, posterior)

La migración `202607280001_require_financial_ownership` convierte las seis
columnas a `NOT NULL` y agrega el índice `Transaction(destinationAccountId,
occurredOn)`. Empieza con un bloque `DO $$` que falla ruidosamente si quedó
alguna fila huérfana.

**Sobre el orden.** `prisma migrate deploy` aplica todas las migraciones
pendientes de una, así que si se corre con las dos pendientes y todavía hay
huérfanos, la segunda falla. Eso es deliberado y seguro: verificado en el ensayo,
el bloque de guarda corta antes de tocar el esquema, las columnas siguen nullable
y no se pierde ningún dato. La recuperación es
`prisma migrate resolve --rolled-back 202607280001_require_financial_ownership`,
ejecutar el backfill y reintentar. El runbook lo documenta como camino esperado.

> El comentario de cabecera de `202607270001_multiuser_identity` menciona una ruta
> `docs/auth/sql/owner-not-null.sql` que ya no existe: el endurecimiento pasó a
> ser esta migración. El archivo **no se edita** a propósito —nunca se modifica
> una migración que puede estar aplicada en algún entorno—; `pnpm db:audit-migrations`
> detecta justamente ese tipo de deriva por checksum.

## 3. Rollback

```bash
pnpm db:rollback-owner -- --email=vos@ejemplo.com --confirm
```

`prisma/rollback-owner-backfill.ts` devuelve a `NULL` el `userId` de las filas
del owner y reabre su onboarding. **No borra nada.** Exige `--confirm` y avisa si
detecta filas creadas después de la última corrida registrada, porque esas
también se desvincularían.

El paso 1 también es reversible sin pérdida: `DROP COLUMN "userId"` y borrar las
tablas de identidad devuelve el esquema anterior. Sólo tiene sentido si se
abandona el corte multiusuario entero.

## 4. Ensayo general ejecutado (local, PostgreSQL 16)

Se construyó una base con **sólo las migraciones previas al corte** y datos
financieros legacy reales (cuatro cuentas, seis movimientos incluidos un anulado
y una corrección encadenada, siete asientos, dos inversiones, dos próximos
pagos), y se corrió la secuencia completa.

**Antes** — 24 filas sin propietario:

| Tabla | Filas | Con dueño | Sin dueño |
| --- | --- | --- | --- |
| Account | 4 | 0 | 4 |
| Category | 3 | 0 | 3 |
| Transaction | 6 | 0 | 6 |
| LedgerEntry | 7 | 0 | 7 |
| Investment | 2 | 0 | 2 |
| UpcomingPayment | 2 | 0 | 2 |

**Después** — 24 reclamadas, 0 huérfanas, 0 filas de otros usuarios tocadas.

**Conservación contable** — saldos idénticos en centavos:

| Cuenta | Antes | Después |
| --- | --- | --- |
| Banco Nación | 3.000.000 | 3.000.000 |
| Mercado Pago | 644.650 | 644.650 |
| Efectivo | 81.500 | 81.500 |
| Caja vieja | 0 | 0 |

Y el resto de las métricas, sin una sola diferencia: 7 asientos, débitos
−464.950, créditos 1.750.000, 6 movimientos, 2 anulados, 1 corrección,
1 transferencia, inversiones 1.100.000 / 1.285.000, próximos pagos 825.000.

Resultado del comando: `✔ Sin diferencias contables.`

**También se ejecutaron**

- Preflight antes de la migración (sin columnas de propiedad) y después.
- Dry-run: informa 24 filas y no escribe.
- `migrate deploy` con las dos migraciones pendientes: la de endurecimiento
  **falla a propósito** con `P3018`, sin tocar el esquema ni perder datos.
- Recuperación con `prisma migrate resolve --rolled-back` y reintento exitoso.
- Endurecimiento a `NOT NULL` sobre el esquema productivo previo: 2,25 s.
- Migraciones desde cero sobre base limpia.
- Auditoría de migraciones, incluida la detección de un archivo editado después
  de aplicarse.

**Hallazgo del ensayo.** El control contable detectó que el backfill hacía algo
de más: reponía el catálogo de categorías dentro de la misma transacción
(`Category: 3 → 13`). Era una escritura intencional, pero rompía la garantía de
que el backfill sólo asigna propiedad. Se quitó: ahora la comparación contable no
tiene ninguna excepción y el catálogo se completa con `pnpm db:seed`.

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Datos invisibles entre el paso 1 y el paso 2 | Ventana corta y controlada. Ejecutar los dos pasos en la misma sesión de trabajo |
| Backfill sobre el usuario equivocado | Exige `--email` de una cuenta existente; el dry-run muestra el id antes de escribir; hay rollback |
| Filas nuevas mezcladas con las legacy | El backfill sólo toca `userId IS NULL`; un usuario nuevo nunca tiene filas huérfanas porque toda escritura graba el propietario |
| Un usuario nuevo hereda datos del owner | Imposible: las consultas filtran por `userId` y las filas huérfanas no matchean ningún valor. Verificado en `isolation.test.ts` y en el QA de navegador |
| Backup previo | **Paso humano obligatorio.** Ver `production-checklist.md` |
