# Preflight de Neon Production

Fecha local: 2026-07-30 00:10 ART

Fecha UTC: 2026-07-30 03:10 UTC

Commit auditado: `af60b682235c2387950226df3da818bee6253277`

Rama: `codex/production-readiness-audit`

## Veredicto

`BLOCKED_NO_NEON_ACCESS`

No se obtuvo una connection string productiva autorizada ni una sesión autenticada en Neon. El proceso se detuvo antes de abrir una conexión PostgreSQL. Producción no fue modificada.

## Fase 0

- Repositorio, rama y HEAD coincidieron con el corte solicitado.
- Worktree inicial limpio.
- `main` y `origin/main` permanecieron en `a3c4a54fb20c20749222f9eaf02b23db4444a62f`.
- No se ejecutó push, PR, merge, migración ni deploy.
- No había `DATABASE_URL`, `DIRECT_URL`, `NEON_API_KEY` ni `VERCEL_TOKEN` en el proceso local.
- No se mostró ningún valor sensible.

## Identidad disponible desde Vercel

| Propiedad | Evidencia redactada |
|---|---|
| Proveedor de deployment | Vercel |
| Proyecto | `d****h`, coincidencia única |
| Framework | Next.js |
| Runtime Node.js | `24.x` |
| Deployment Production | `READY` |
| Deployment creado | `2026-07-27T20:10:39Z` |
| Commit desplegado | `a3c4a54fb20c20749222f9eaf02b23db4444a62f` |
| Rama desplegada | `main` |
| Host | `dol….app` |
| Errores runtime, últimos 7 días | `0` entradas devueltas |
| Warnings runtime, últimos 7 días | `0` entradas devueltas |
| Producción modificada | `NO` |

Variables productivas confirmadas únicamente por nombre:

- `DATABASE_URL`;
- `DOLETH_ACCESS_PASSWORD`;
- `DOLETH_APP_URL`;
- `DOLETH_EMAIL_FROM`;
- `DOLETH_EMAIL_TRANSPORT`;
- `DOLETH_SESSION_SECRET`;
- `RESEND_API_KEY`.

`DIRECT_URL` no existe. `DATABASE_URL` está marcada `sensitive`: la API lista su existencia, pero no entrega valor, y `vercel env run -e production` no la inyectó al proceso de auditoría.

## Acceso Neon

| Vía | Resultado |
|---|---|
| Neon CLI/API local | No configurada |
| `DATABASE_URL` local | Ausente |
| Vercel CLI | Autenticada; metadata accesible |
| Vercel Production env | Nombre visible; valor `sensitive` no recuperable |
| Consola Neon | Login requerido; no había sesión autenticada |
| Conexión PostgreSQL | No iniciada |

Dos invocaciones controladas del preflight abortaron en configuración por ausencia de `DATABASE_URL`. Ninguna alcanzó `pool.connect()`.

## Inspección de tooling

El script histórico `prisma/ops/preflight.ts` no se ejecutó en producción:

- no fija `default_transaction_read_only`;
- no abre una transacción `READ ONLY`;
- imprime IDs, nombres de cuentas e importes exactos;
- puede escribir un archivo local de evidencia con información financiera.

Se creó `prisma/ops/neon-production-preflight.ts`, separado y sin Prisma mutations. Antes de habilitar su ejecución se revisaron sus 900 líneas y todas las consultas.

Protecciones del nuevo script:

1. una conexión y `max=1`;
2. `SET default_transaction_read_only = on`;
3. `BEGIN`;
4. `SET TRANSACTION READ ONLY`;
5. `statement_timeout = 5s`;
6. `lock_timeout = 2s`;
7. `idle_in_transaction_session_timeout = 30s`;
8. prueba de rechazo de escritura con SQLSTATE esperado `25006`;
9. solo agregados y catálogo;
10. `ROLLBACK` obligatorio;
11. salida redactada sin IDs, nombres, emails, descripciones ni importes individuales.

El único `CREATE TABLE` del script es una sonda con nombre aleatorio ejecutada después de confirmar `transaction_read_only=on`. Si PostgreSQL no la rechaza, el script hace `ROLLBACK` y aborta antes del análisis.

## Garantía read-only de este corte

| Control | Resultado |
|---|---|
| Conexiones PostgreSQL abiertas | `0` |
| Transacciones iniciadas | `0` |
| Consultas productivas ejecutadas | `0` |
| Migraciones ejecutadas | `0` |
| Escrituras persistentes | `0` |
| Variables Vercel modificadas | `0` |
| Deployments creados | `0` |

La prueba PostgreSQL de rechazo de escritura queda `INCONCLUSIVE` porque no fue posible conectarse.

## Migraciones

No se consultó `_prisma_migrations`.

| Migración | Filesystem | Producción | Checksum | Estado |
|---|---:|---:|---:|---|
| `202607210001_vertical_007` | Sí | Desconocido | No comparado | `INCONCLUSIVE` |
| `202607220001_investments` | Sí | Desconocido | No comparado | `INCONCLUSIVE` |
| `202607270001_multiuser_identity` | Sí | Desconocido | No comparado | `INCONCLUSIVE` |
| `202607280001_require_financial_ownership` | Sí | Desconocido | No comparado | `INCONCLUSIVE` |
| `202607290001_enforce_cross_owner_relations` | Sí | Desconocido | No comparado | `INCONCLUSIVE` |

## Ownership, integridad y esquema

Sin conexión no se midieron:

- conteos por tabla;
- owners, nulos u huérfanos;
- distribución `OWNER_n`;
- referencias cross-owner;
- movimientos y ledger;
- transferencias, correcciones o anulaciones;
- saldos reconstruibles;
- `NOT NULL`, índices o foreign keys reales;
- tipos monetarios productivos.

Todos permanecen `INCONCLUSIVE`. No se reutilizó evidencia histórica como si describiera el estado actual.

## TLS, pooling y latencia

`INCONCLUSIVE`.

La metadata Vercel no permite demostrar host Neon, región, endpoint, pooling, TLS efectivo, versión PostgreSQL, conexiones ni latencia sin una conexión o acceso al proyecto Neon.

## Backup y recuperación

| Control | Clasificación |
|---|---|
| Backup automático actual | `INCONCLUSIVE` |
| Retención | `INCONCLUSIVE` |
| PITR | `INCONCLUSIVE` |
| Último punto recuperable | `INCONCLUSIVE` |
| Branch/snapshot restaurable | `INCONCLUSIVE` |
| Límites del plan | `INCONCLUSIVE` |

Usar Neon no constituye evidencia automática de backup. No se inició restauración ni creación de branch.

## Handoff seguro para habilitar acceso

Opción recomendada:

1. Abrir la pestaña de login de Neon conservada en el navegador interno de Codex.
2. Iniciar sesión manualmente. No entregar email, contraseña, OTP ni connection string por chat.
3. Seleccionar el proyecto Doleth y su rama productiva correcta.
4. Confirmar visualmente que la cuenta puede ver branches, restore/PITR y SQL Editor.
5. Volver a esta tarea y responder únicamente `Neon listo`.

Alternativa operada por el owner:

1. Obtener la connection string desde Neon mediante password manager o consola.
2. Definirla solo en el proceso de una terminal segura, nunca en `.env` ni en el chat.
3. Ejecutar desde este commit:

```powershell
$env:DATABASE_URL = '<valor obtenido fuera del chat>'
pnpm db:preflight:neon-readonly
Remove-Item Env:DATABASE_URL
```

4. Conservar solamente la línea JSON redactada.
5. Verificar backup/PITR en la consola Neon; la consulta SQL no sustituye esa evidencia.

## Plan exacto de backup previo al release

No ejecutar todavía. Cuando exista acceso:

1. Registrar deployment y SHA productivo actual.
2. Confirmar proyecto y rama Neon.
3. Confirmar último punto PITR y retención con timestamp UTC.
4. Crear, con aprobación separada, un branch de recuperación previo a migraciones.
5. Abrir el branch de recuperación en modo read-only y validar conteos/checksums agregados.
6. Guardar la connection string anterior en el password manager, fuera del repositorio.
7. Preparar `pnpm exec prisma migrate deploy`; no ejecutarlo durante el preflight.
8. Repetir migraciones, ownership, cross-owner, ledger y constraints después del cambio.
9. Hacer rollback ante checksum divergente, owner ambiguo, inconsistencia cross-owner o contable.
10. Restaurar primero a una rama nueva y volver a promover el deployment anterior; nunca sobrescribir producción durante diagnóstico.

## Consultas ejecutadas

Contra Neon/PostgreSQL: ninguna.

Contra Vercel: exclusivamente operaciones GET/list y `env run` sin variable sensible disponible. Contra consola Neon: navegación hasta login, sin autenticación.

La consulta puntual de logs Production de los últimos siete días devolvió cero entradas con nivel `error` y cero con nivel `warning`. Esto no sustituye un smoke ni demuestra tráfico.
