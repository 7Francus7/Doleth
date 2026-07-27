# Runbook de producción · corte multiusuario

Última actualización: 27 de julio de 2026
Estado: **no ejecutado en producción**. Ensayado de punta a punta en local.

Este corte cambia el esquema de la base y la forma de entrar a Doleth. Los pasos
van en orden y ninguno se saltea. Cada uno indica su **criterio de éxito** y
**cómo abortar**.

Regla transversal: *no se hace ninguna modificación irreversible sin evidencia
previa.*

---

## Fase A · Preflight (read-only)

```bash
export DATABASE_URL="<producción>"
mkdir -p evidencia
pnpm db:preflight -- --owner-email=<owner> --out=evidencia/01-pre-migracion.json
```

No escribe una sola fila. Verifica rama, migraciones aplicadas y pendientes,
estructura de identidad, conteos por tabla, duplicados de correo normalizado,
integridad relacional, propiedad parcial y sumas de control contables.

**Éxito:** termina con `✔ PREFLIGHT OK` y deja el JSON de evidencia.

**Aborta si** aparece cualquier bloqueo. Los más importantes:

- filas huérfanas **y** más de un usuario con datos propios → la pertenencia no
  es determinable, y el corte no puede continuar;
- correos que normalizan al mismo valor;
- movimientos, asientos, categorías o pagos cuyo propietario no coincide con el
  de su cuenta;
- propiedad parcial (un movimiento huérfano con asientos ya asignados);
- migraciones a medio aplicar.

También conviene registrar a mano el estado de Git:

```bash
git rev-parse HEAD && git status --porcelain
```

## Fase B · Backup verificable

**Esto no lo puede hacer el código.** Según el proveedor:

| Proveedor | Cómo |
| --- | --- |
| Neon | Branch/restore point desde la consola, o `pg_dump` |
| Supabase | Database → Backups → crear backup manual |
| Railway / Render | Snapshot del servicio de Postgres |
| Cualquiera | `pg_dump -Fc "$DATABASE_URL" > doleth-$(date +%Y%m%d-%H%M).dump` |

**Verificación obligatoria** — un archivo que no se puede leer no es un backup:

```bash
pg_restore --list doleth-<fecha>.dump | head -30
```

Registrar: fecha y hora, base objetivo, identificador del backup (redactado),
retención y el procedimiento de restauración.

**Si el entorno no permite crear o verificar el backup: DETENER.** No se aplica
la migración. Ese es el estado `BLOCKED_HUMAN_ACTION_REQUIRED`.

## Fase C · Secretos

Verificar **presencia**, nunca imprimir valores:

```bash
for V in DATABASE_URL DOLETH_SESSION_SECRET DOLETH_APP_URL \
         RESEND_API_KEY DOLETH_EMAIL_FROM DOLETH_EMAIL_TRANSPORT; do
  [ -n "${!V}" ] && echo "$V = presente (len=${#V})" || echo "$V = AUSENTE"
done
```

| Variable | Requisito |
| --- | --- |
| `DATABASE_URL` | con `sslmode=require` |
| `DOLETH_SESSION_SECRET` | ≥ 32 caracteres, aleatorio (`openssl rand -base64 48`), **exclusivo de producción**: distinto de desarrollo, preview y test |
| `DOLETH_APP_URL` | dominio canónico, HTTPS, sin barra final |
| `RESEND_API_KEY` | clave de producción |
| `DOLETH_EMAIL_FROM` | remitente verificado en el proveedor |
| `DOLETH_EMAIL_TRANSPORT` | sin definir o `resend`. **Nunca `console`** |

Además:

- `DOLETH_ACCESS_PASSWORD` debe estar **eliminada**: ya no la usa nadie.
- Preview y producción no comparten `DOLETH_APP_URL`. Si lo hicieran, un enlace
  de verificación generado en preview llevaría al dominio productivo y
  viceversa. En Vercel: definir `DOLETH_APP_URL` por entorno.
- Rotar `DOLETH_SESSION_SECRET` cierra todas las sesiones y rompe la correlación
  de la auditoría anterior. Es aceptable ahora, no después.

Si falta una variable: detener **sólo** lo que dependa de ella. Sin
`RESEND_API_KEY` no se puede hacer la Fase D ni crear usuarios; la migración y el
backfill sí pueden seguir.

## Fase D · Proveedor de correo

En el panel del proveedor: dominio verificado, **SPF** y **DKIM** publicados y
válidos, **DMARC** al menos documentado (`p=none` es un punto de partida
aceptable si está registrado como decisión).

Después, **correos reales controlados** a una casilla propia:

1. Registrar `doleth-smoke+<fecha>@<tu-dominio>` → llega el correo de
   verificación → el enlace apunta a `DOLETH_APP_URL` → funciona.
2. Pedir recuperación para esa misma cuenta → llega → el enlace funciona.

**No alcanza con que el proveedor devuelva 200.** El criterio es: el correo llegó
a la bandeja y el enlace abrió la pantalla correcta.

Verificar también que los tokens no aparecen en los logs de la aplicación ni del
proveedor, y que un reenvío repetido termina cortado por el rate limit.

## Fase E · Migración de identidad

> **Orden obligatorio.** Hay dos migraciones pendientes y **no** se aplican
> juntas. La segunda exige que el backfill ya haya corrido.

```bash
pnpm db:audit-migrations    # checksums y estado del historial
pnpm db:migrate             # aplica 202607270001_multiuser_identity
```

Si `pnpm db:migrate` intenta aplicar también
`202607280001_require_financial_ownership`, va a **fallar a propósito**:

```
ERROR: Quedan N filas financieras sin propietario.
       Ejecutá `pnpm db:backfill-owner` antes de endurecer.
```

Eso es correcto y seguro: el bloque de guarda corta **antes** de tocar el
esquema. Verificado en el ensayo: las columnas siguieron nullable y no se perdió
ningún dato. Para continuar:

```bash
pnpm exec prisma migrate resolve --rolled-back 202607280001_require_financial_ownership
```

y seguir con la Fase F. La migración de endurecimiento se reintenta en la Fase H.

**Éxito:** `202607270001_multiuser_identity` figura aplicada; las tablas de
identidad existen; ninguna fila financiera fue modificada.

> **Ventana conocida.** Entre esta fase y el final de la Fase G los datos del
> owner **no se ven** en la aplicación: quedaron sin propietario y toda consulta
> filtra por uno. No están perdidos. Hacer las fases E, F y G seguidas.

## Fase F · Identidad del owner

El owner **no se deduce** por orden de creación. Dos caminos:

**Camino recomendado** — crear la cuenta desde la aplicación (`/crear-cuenta`) y
verificar el correo. Confirma de paso que el envío real funciona.

**Camino de invitación** — cuando la cuenta tiene que existir antes:

```bash
pnpm db:ensure-owner -- --email=<owner>                          # sólo inspecciona
pnpm db:ensure-owner -- --email=<owner> --name="Nombre" --create # alta
```

Crea el usuario en `PENDING_VERIFICATION` con una contraseña aleatoria de 32
bytes que se descarta en el acto: **nadie la conoce, no se imprime y no se
guarda**. El acceso se establece desde `/olvide-mi-contrasena`, que envía el
correo real; al completar el restablecimiento la cuenta queda `ACTIVE` con el
correo verificado.

El comando aborta si hay más de un usuario con el mismo correo normalizado.

`--mark-verified` existe para marcar un correo como verificado sin pasar por el
flujo. Es una **decisión humana explícita**: el comando lo advierte y pide
documentarla en el freeze. No usarlo salvo necesidad real.

Anotar el `OWNER_ID` que imprime.

## Fase G · Backfill

```bash
pnpm db:backfill-owner -- --email=<owner> --dry-run
pnpm db:backfill-owner -- --email=<owner> --out=evidencia/02-backfill.json
```

El dry-run informa cuántas filas se modificarían y verifica que no haya
ambigüedad ni propiedad parcial, sin escribir.

La corrida real hace todo en **una transacción** y, antes de confirmar, verifica
dentro de esa misma transacción:

- cero filas huérfanas restantes;
- la cantidad de filas de **otros** usuarios no cambió en ninguna tabla;
- los conteos de propiedad cierran exactamente;
- **cero diferencias contables** contra la captura previa: saldo por cuenta,
  saldo inicial, ledger vivo y total, cantidad de asientos, moneda y estado por
  cuenta; total, anulados e importes por tipo de movimiento; débitos y créditos;
  correcciones; transferencias; inversiones; próximos pagos.

Si algo no cierra, **revierte y no escribe nada**.

El backfill sólo asigna propiedad: no crea ni borra filas, no repone categorías,
no genera movimientos compensatorios, no recalcula el ledger.

Después:

```bash
pnpm db:seed   # completa el catálogo de categorías del owner (aditivo, idempotente)
pnpm db:preflight -- --owner-email=<owner> --out=evidencia/03-post-backfill.json
```

**Éxito:** `Filas sin propietario: 0` y `✔ Sin diferencias contables`.

**Cómo abortar:** `pnpm db:rollback-owner -- --email=<owner> --confirm`. Devuelve
las filas a `NULL` sin borrar nada. Ver `rollback-playbook.md`.

## Fase H · Verificación en la aplicación

Antes de endurecer, mirar con los ojos:

- [ ] El owner inicia sesión.
- [ ] `/cuentas` muestra todas sus cuentas con los saldos correctos.
- [ ] Los saldos coinciden con `evidencia/01-pre-migracion.json`.
- [ ] `/movimientos` muestra el historial completo, incluidos los anulados.
- [ ] `/proximo` y `/inversiones` muestran lo que corresponde.

## Fase I · Endurecimiento

```bash
pnpm db:migrate   # aplica 202607280001_require_financial_ownership
pnpm db:audit-migrations
```

Convierte las seis columnas `userId` a `NOT NULL` y agrega el índice
`Transaction(destinationAccountId, occurredOn)`.

Efecto colateral deseado: con `NOT NULL`, los únicos compuestos
`(userId, idempotencyKey)` y `(userId, slug)` pasan a ser realmente exclusivos.
Con `NULL`s, Postgres los trataba como distintos.

**Éxito:** las seis columnas son `NOT NULL` y las sumas de control siguen
idénticas.

**Cómo abortar:** ver escenario 4 del `rollback-playbook.md`. Nunca `DROP COLUMN`.

## Fase J · Smoke productivo

Con dos cuentas de prueba cuyo correo **empieza con `doleth-smoke+`** — ese
prefijo es lo único que autoriza la limpieza posterior.

1. Registro · 2. Recepción del correo · 3. Verificación · 4. Sesión ·
5. Onboarding · 6. Primera cuenta financiera · 7. Ingreso de prueba ·
8. Gasto de prueba · 9. Cierre de sesión · 10. Nuevo inicio ·
11. Recuperación de contraseña · 12. La sesión anterior quedó revocada ·
13. `/ahora` · 14. `/proximo` · 15. `/configuracion/cuenta` ·
16. Segundo usuario sin ver los datos del primero · 17. URL ajena → 404 ·
18. Refresh en ruta privada · 19. Cookie revocada sin bucle de redirección ·
20. Vista a 320 px y 390 px.

**No tocar los datos del owner para el smoke.**

Limpieza auditada:

```bash
pnpm db:smoke-cleanup -- --list
pnpm db:smoke-cleanup -- --all --confirm
```

El comando se **niega** a borrar cualquier correo que no lleve el prefijo
reservado; para bajas de usuarios reales existe `pnpm db:deletions`.

## Fase K · Verificación posterior

- [ ] `/` sin sesión → `/iniciar-sesion`.
- [ ] `/ahora` sin sesión → `/iniciar-sesion?destino=%2Fahora`.
- [ ] Cabeceras: `curl -sI https://<dominio>/iniciar-sesion | grep -iE "x-frame|x-content|referrer|strict-transport"`.
- [ ] Cookie `doleth_session` con `HttpOnly`, `Secure` y `SameSite=Lax`.
- [ ] Conteos y saldos idénticos a `evidencia/01-pre-migracion.json`.
- [ ] `pnpm db:audit-migrations` sin problemas.

## Pasos humanos que el código no puede hacer

1. Tomar y **verificar** el backup.
2. Contratar el proveedor de correo y verificar el dominio (SPF/DKIM/DMARC).
3. Generar y cargar `DOLETH_SESSION_SECRET` de producción.
4. Ejecutar las fases E a K y guardar la evidencia.
5. Revisión legal profesional de `/terminos` y `/privacidad`, y completar los
   campos listados como pendientes en esas mismas páginas.
6. Definir el plazo de destrucción de la contabilidad anonimizada.
7. Habilitar el workflow de CI en GitHub (`.github/workflows/ci.yml`).
