# Rollback del corte multiusuario

Última actualización: 27 de julio de 2026

**Principio rector: conservar los datos vale más que restablecer la
disponibilidad.** Ante la duda, dejar el servicio caído y no escribir nada.

Antes de cualquier rollback, capturar el estado:

```bash
pnpm db:preflight -- --owner-email=<owner> --out=evidencia/incidente-$(date +%s).json
pnpm db:audit-migrations
```

---

## Escenario 1 · Migración aplicada, backfill NO ejecutado

**Síntoma.** `202607270001_multiuser_identity` está aplicada. Los datos del owner
no se ven en la aplicación.

**Diagnóstico.** Esto es lo esperado en esa ventana, no una falla. Las filas
quedaron con `userId IS NULL` y toda consulta filtra por un propietario concreto,
así que son invisibles —para el owner y para cualquiera—. No se perdió nada:

```sql
SELECT COUNT(*) FROM "Transaction" WHERE "userId" IS NULL;
```

**Acción normal.** Seguir adelante: crear el owner y ejecutar el backfill. Es más
rápido que revertir.

**Si igual hay que volver atrás** (por ejemplo, se detectó un problema en el
código desplegado):

1. Redesplegar la versión anterior de la aplicación. La migración es aditiva: el
   código viejo ignora las columnas y tablas nuevas y sigue funcionando.
2. **No** revertir la migración. Dejar las columnas nuevas no molesta a nadie.

Si aun así hace falta revertir el esquema:

```sql
BEGIN;
ALTER TABLE "Account"         DROP COLUMN "userId";
ALTER TABLE "Category"        DROP COLUMN "userId";
ALTER TABLE "Transaction"     DROP COLUMN "userId";
ALTER TABLE "LedgerEntry"     DROP COLUMN "userId";
ALTER TABLE "Investment"      DROP COLUMN "userId";
ALTER TABLE "UpcomingPayment" DROP COLUMN "userId";
-- Restituir los únicos globales que la migración reemplazó por compuestos.
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");
DROP TABLE "OwnerBackfillRun", "RateLimitCounter", "AuthEvent", "AuthToken", "Session", "User" CASCADE;
COMMIT;
```

Después: `prisma migrate resolve --rolled-back 202607270001_multiuser_identity`.

> Los dos `CREATE UNIQUE INDEX` fallan si en el interín entró un segundo usuario
> con el mismo slug o la misma clave de idempotencia. Si eso pasa, **no forzar**:
> ya hay datos multiusuario y el rollback de esquema deja de ser seguro.

## Escenario 2 · Backfill ejecutado correctamente

**No revertir.** La propiedad asignada es correcta y es lo que hace que la
aplicación muestre los datos.

Revertir acá sólo devuelve las filas a `userId IS NULL`, es decir, a la situación
del escenario 1: datos invisibles. No arregla nada y agrega una escritura masiva
más sobre datos productivos.

Verificar que efectivamente salió bien:

```bash
pnpm db:preflight -- --owner-email=<owner>
# Esperado: "Filas sin propietario: 0" y las mismas sumas de control del preflight previo
```

Y contra la evidencia guardada: comparar `evidencia/01-*.json` con la corrida
posterior. El backfill deja además el detalle completo en `OwnerBackfillRun`.

## Escenario 3 · Backfill incorrecto

**Cómo se detecta.** El propio comando aborta y revierte su transacción si:

- quedan filas huérfanas,
- cambió la cantidad de filas de otros usuarios,
- los conteos de propiedad no cierran,
- **cualquier** suma de control contable difiere.

En esos casos no hace falta rollback: la transacción no se confirmó y la base
quedó como estaba. El mensaje lo dice explícitamente.

**Si aun así hay que deshacerlo** (por ejemplo, se asignó al usuario equivocado y
el comando no podía saberlo):

```bash
pnpm db:rollback-owner -- --email=<owner-equivocado> --confirm
```

Devuelve las filas a `userId = NULL` y reabre el onboarding de ese usuario. **No
borra nada.** Después, ejecutar el backfill con el correo correcto.

**Si los datos quedaron inconsistentes de una forma que el rollback no arregla:**
restaurar desde el backup del paso 1 del checklist. Es el único camino que
garantiza volver al estado exacto anterior.

## Escenario 4 · Endurecimiento NOT NULL fallido

La migración `202607280001_require_financial_ownership` empieza con un bloque de
guarda que cuenta las filas huérfanas y aborta **antes** de tocar el esquema.
Verificado: falla con `P3018` sin modificar ninguna columna y sin perder datos.

Recuperación:

```bash
# 1. Marcar la migración fallida como revertida.
pnpm exec prisma migrate resolve --rolled-back 202607280001_require_financial_ownership

# 2. Resolver la causa: ejecutar el backfill.
pnpm db:backfill-owner -- --email=<owner>

# 3. Reintentar.
pnpm db:migrate
```

Prisma deja las dos filas en `_prisma_migrations` (la revertida y la exitosa).
`pnpm db:audit-migrations` lo reconoce como historial válido.

**Si el endurecimiento ya se aplicó y hay que aflojarlo:**

```sql
ALTER TABLE "Account"         ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Category"        ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Transaction"     ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "LedgerEntry"     ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Investment"      ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "UpcomingPayment" ALTER COLUMN "userId" DROP NOT NULL;
```

Quitar la restricción **no borra ni modifica ninguna fila**. Nunca hacer
`DROP COLUMN` para "revertir" el endurecimiento: eso sí destruiría la propiedad.

## Escenario 5 · Proveedor de correo caído

**Impacto.** Nadie puede registrarse, verificar su correo ni recuperar la
contraseña. Los usuarios existentes con sesión abierta **no se ven afectados**:
la sesión no depende del correo.

La aplicación ya falla de forma honesta: si el proveedor no responde, la acción
devuelve error y **no** dice que envió nada.

**Contención sin tocar a los usuarios existentes.** Para dejar de aceptar
registros nuevos mientras dura la falla, hay dos opciones sin desplegar código:

1. **Preferida** — quitar `RESEND_API_KEY` del entorno y dejar
   `DOLETH_EMAIL_TRANSPORT=resend`. Con eso el envío falla de inmediato y con un
   mensaje claro, sin que ningún usuario nuevo quede a medio crear.
2. Reducir el límite de registros a 0 no está soportado por configuración: haría
   falta un cambio de código. No improvisar SQL sobre `RateLimitCounter`.

**Qué NO hacer:** poner `DOLETH_EMAIL_TRANSPORT=console` en producción para
"destrabar". La aplicación lo rechaza a propósito —lanza `EmailDeliveryError`—
porque eso equivaldría a decirle a la persona que le llegó un correo que nunca
salió.

**Recuperación.** Cuando el proveedor vuelva, las cuentas que quedaron en
`PENDING_VERIFICATION` se resuelven solas: la persona pide un enlace nuevo desde
`/crear-cuenta/revisa-tu-correo` o desde `/olvide-mi-contrasena`. No hace falta
tocar la base.

## Tabla de decisión rápida

| Situación | Acción | ¿Se pierde algo? |
| --- | --- | --- |
| Migración aplicada, datos invisibles | Seguir con el backfill | No |
| Hay que volver a la versión anterior | Redesplegar código viejo, dejar el esquema | No |
| Backfill abortó solo | Nada: ya revirtió | No |
| Backfill al usuario equivocado | `db:rollback-owner --confirm` y repetir | No |
| Inconsistencia que el rollback no arregla | Restaurar backup | Lo posterior al backup |
| NOT NULL falló | `migrate resolve --rolled-back` + backfill + reintentar | No |
| NOT NULL aplicado, hay que aflojar | `DROP NOT NULL` (nunca `DROP COLUMN`) | No |
| Correo caído | Quitar `RESEND_API_KEY` | No |
