# Migración del owner original

Estado: validado en local · Pendiente de ejecución en producción
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
- Escribe **únicamente** la columna `userId`. No toca importes, fechas, asientos
  ni relaciones contables. No reconstruye el ledger.
- Todo en **una sola transacción**: o queda todo asignado, o nada.
- Completa el catálogo base de categorías del owner con las que le falten
  (`skipDuplicates`: no toca las suyas).
- Marca el onboarding como terminado: un owner con datos no debe pasar por la
  configuración inicial.
- Verifica la conservación:
  `owner_después == owner_antes + reclamadas + categorías_repuestas`. Si no
  cierra, aborta con el detalle por tabla.
- Deja evidencia en `OwnerBackfillRun` con todos los conteos.

### Paso 3 — contract (manual, posterior)

`docs/auth/sql/owner-not-null.sql` convierte las seis columnas a `NOT NULL`.
Empieza con un `DO $$` que falla ruidosamente si quedó alguna fila huérfana.

**Por qué no es una migración de Prisma**: `prisma migrate deploy` aplica todas
las migraciones pendientes de una. Una migración que exige `NOT NULL` fallaría el
deploy hasta que alguien corra el backfill a mano, lo que deja el despliegue
trabado. Separarlo es lo que permite que el paso 1 sea automático y seguro.

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

## 4. Validación ejecutada (local, PostgreSQL 16)

Se sembró un conjunto legacy con `userId IS NULL` en las seis tablas y se corrió
el ciclo completo.

**Antes**

| Tabla | Filas huérfanas |
| --- | --- |
| Account | 2 |
| Category | 2 |
| Transaction | 3 |
| LedgerEntry | 4 |
| Investment | 1 |
| UpcomingPayment | 1 |
| **Total** | **13** |

Saldos de referencia: `Cuenta legacy = 1.265.000` centavos ·
`Ahorro legacy = 350.000` centavos.

**Después**

| Tabla | Huérfanas | Del owner |
| --- | --- | --- |
| Account | 0 | 2 |
| Category | 0 | 13 (2 legacy + 11 repuestas) |
| Transaction | 0 | 3 |
| LedgerEntry | 0 | 4 |
| Investment | 0 | 1 |
| UpcomingPayment | 0 | 1 |

**Conservación contable**: saldos idénticos (`1.265.000` y `350.000`). Importes,
tipos y fechas sin cambios:

```
legacy-tx-1 | EXPENSE  |  35000 | 2026-06-11
legacy-tx-2 | INCOME   | 900000 | 2026-06-01
legacy-tx-3 | TRANSFER | 100000 | 2026-06-15
```

**Otras comprobaciones**

- Dry-run: reporta los conteos y no escribe.
- Idempotencia: segunda corrida → "No hay filas huérfanas. Nada que hacer."
- Rollback sin `--confirm`: se niega.
- Rollback con `--confirm`: 13 filas liberadas; `Transaction=3`, `LedgerEntry=4`
  y saldo `1.265.000` intactos.
- Backfill posterior al rollback: restaura el estado.

**Hallazgo durante la validación**: la primera versión del post-chequeo no
contemplaba las categorías repuestas del catálogo y abortaba con "los conteos no
cierran" aunque el backfill había sido correcto. Se corrigió el chequeo (el
backfill no tenía el error) y se agregó el detalle por tabla al mensaje de fallo.

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Datos invisibles entre el paso 1 y el paso 2 | Ventana corta y controlada. Ejecutar los dos pasos en la misma sesión de trabajo |
| Backfill sobre el usuario equivocado | Exige `--email` de una cuenta existente; el dry-run muestra el id antes de escribir; hay rollback |
| Filas nuevas mezcladas con las legacy | El backfill sólo toca `userId IS NULL`; un usuario nuevo nunca tiene filas huérfanas porque toda escritura graba el propietario |
| Un usuario nuevo hereda datos del owner | Imposible: las consultas filtran por `userId` y las filas huérfanas no matchean ningún valor. Verificado en `isolation.test.ts` y en el QA de navegador |
| Backup previo | **Paso humano obligatorio.** Ver `production-checklist.md` |
