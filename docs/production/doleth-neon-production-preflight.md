# Preflight read-only de Neon Production

Fecha local: 2026-07-30 00:33 ART

Fecha UTC: 2026-07-30 03:33 UTC

Commit auditado: `055e3443956079de72e7200a83174a378bfda05f`

Rama: `codex/production-readiness-audit`

## 1. Veredicto

Neon: `NEON_PREFLIGHT_VERIFIED_WITH_CONCERNS`.

Release completo: `BLOCKED`.

La rama productiva correcta fue identificada y el estado actual de datos, migraciones, ownership, ledger, catálogo y recuperación se inspeccionó sin leer connection strings. La quinta migración local sigue pendiente. No se ejecutaron migraciones, DDL persistente, backfills, seeds, restores, branches, snapshots ni deployments.

## 2. Identidad del entorno

| Propiedad | Evidencia no sensible |
|---|---|
| Proyecto | Doleth |
| Rama Neon | `production`, default y protegida |
| Base | `neondb` |
| Región | AWS US East 1, N. Virginia |
| PostgreSQL | `18.4` |
| Compute | autoscaling `0.25` a `8` CU |
| Deployment Vercel Production | `READY` |
| Rama/SHA desplegados | `main` / `a3c4a54fb20c20749222f9eaf02b23db4444a62f` |
| Runtime | Node.js `24.x` |

No se registraron IDs de proyecto, branch o endpoint, ni host, usuario, password o connection string.

## 3. Garantía read-only

Cada lectura SQL se ejecutó con:

```sql
BEGIN;
SET TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '2s';
-- SELECT agregado o de catálogo
ROLLBACK;
```

La sesión informó `transaction_read_only=on`, `statement_timeout=5s` y `lock_timeout=2s`.

Como prueba negativa, dentro de la misma transacción se intentó crear una tabla sonda. PostgreSQL rechazó el DDL con SQLSTATE `25006`, `cannot execute CREATE TABLE in a read-only transaction`. Después se ejecutó `ROLLBACK` explícito y se confirmó el cierre de la transacción.

| Control | Resultado |
|---|---|
| Migraciones ejecutadas | `0` |
| Escrituras persistentes en PostgreSQL | `0` |
| Restores/branches/snapshots creados | `0` |
| Variables modificadas | `0` |
| Deployments creados | `0` |
| Credenciales mostradas o guardadas | `0` |

El historial automático del SQL Editor conservó el texto no sensible de las consultas. Esto es metadata de consola, no una escritura en la base productiva.

## 4. Migraciones

Se comparó `_prisma_migrations` con los SHA-256 de los cinco `migration.sql` locales.

| Migración | Producción | Checksum | Estado |
|---|---:|---:|---|
| `202607210001_vertical_007` | aplicada | coincide | `APPLIED_MATCHING` |
| `202607220001_investments` | aplicada | coincide | `APPLIED_MATCHING` |
| `202607270001_multiuser_identity` | aplicada | coincide | `APPLIED_MATCHING` |
| `202607280001_require_financial_ownership` | aplicada | coincide | `APPLIED_MATCHING_WITH_PRIOR_ROLLBACK` |
| `202607290001_enforce_cross_owner_relations` | ausente | n/a | `PENDING` |

Hay cinco registros productivos para cuatro nombres de migración. La migración de contrato de ownership tiene un intento anterior marcado rolled back y un intento posterior exitoso con el mismo checksum. No hay migraciones incompletas. No se ejecutó `migrate deploy` ni `migrate resolve`.

## 5. Ownership

| Modelo | Filas | Owners | `userId` nulo | Owner huérfano | IDs duplicados | Cross-owner |
|---|---:|---:|---:|---:|---:|---:|
| `Account` | 1 | 1 | 0 | 0 | 0 | 0 |
| `AuthEvent` | 0 | 0 | 0 | 0 | 0 | 0 |
| `AuthToken` | 0 | 0 | 0 | 0 | 0 | 0 |
| `Category` | 13 | 1 | 0 | 0 | 0 | 0 |
| `Investment` | 0 | 0 | 0 | 0 | 0 | 0 |
| `LedgerEntry` | 1 | 1 | 0 | 0 | 0 | 0 |
| `Session` | 0 | 0 | 0 | 0 | 0 | 0 |
| `Transaction` | 1 | 1 | 0 | 0 | 0 | 0 |
| `UpcomingPayment` | 0 | 0 | 0 | 0 | 0 | 0 |
| `User` | 1 | 1 | 0 | 0 | 0 | 0 |

Distribución anonimizada: `OWNER_1` posee 1 cuenta, 13 categorías, 1 transacción y 1 asiento.

Las 16 verificaciones detalladas de relaciones account/transaction/category/correction/upcoming devolvieron cero huérfanos y cero referencias cross-owner.

## 6. Integridad financiera

| Control | Resultado |
|---|---|
| Movimientos / activos / anulados | `1 / 1 / 0` |
| Asientos / débitos / créditos / ceros | `1 / 1 / 0 / 0` |
| Movimiento sin ledger | `0` |
| Asiento sin movimiento | `0` |
| Transferencia incompleta o desbalanceada | `0 / 0` |
| Movimiento no-transfer con cantidad de asientos inválida | `0` |
| Corrección inválida | `0` |
| Movimiento futuro | `0` |
| Importe de movimiento inválido | `0` |
| Próximo pago inválido | `0` |
| Inversión inválida | `0` |
| Saldos reconstruibles | `MATCH` |
| Anulados excluidos de agregación | `MATCH` |

No se mostraron importes, descripciones, IDs ni nombres.

## 7. Esquema real

- Las seis tablas financieras tienen `userId NOT NULL`.
- Las seis columnas monetarias esperadas son PostgreSQL `int8`.
- Existen 12 índices que incluyen `userId`.
- Faltan exactamente las 5 claves/índices compuestos creados por `202607290001_enforce_cross_owner_relations`.
- Existen 17 foreign keys.
- Faltan exactamente las 8 foreign keys compuestas de relaciones financieras creadas por esa misma migración.

La ausencia coincide con el único migration file pendiente y no con drift desconocido. Los datos actuales satisfacen las precondiciones de cross-owner, pero esto no autoriza aplicar la migración.

## 8. Neon operativo

| Control | Resultado |
|---|---|
| Estado de la plataforma | `All OK` en consola |
| Rama protegida | sí |
| PostgreSQL | `18.4` |
| Límite `max_connections` informado | `901` |
| Conexiones observadas a la base durante la consulta | `1` |
| Tiempo de lote de catálogo observado en SQL Editor | `214–343 ms` |
| Pooling de `DATABASE_URL` runtime | `INCONCLUSIVE` |
| TLS de `DATABASE_URL` runtime | `INCONCLUSIVE` |

La conexión interna del SQL Editor no representa la conexión de la aplicación y `pg_stat_ssl` no reportó TLS para esa sesión. No se abrió el modal de credenciales ni se leyó `DATABASE_URL`; por eso no se usa esa observación para afirmar que el runtime tenga o no TLS o pooling. Los tiempos incluyen UI/red y no son un benchmark de Vercel.

## 9. Backup y recuperación

| Control | Clasificación |
|---|---|
| Restore point-in-time | `PITR_VERIFIED` |
| Retención | `1 día` |
| Punto más antiguo visible | 2026-07-29 00:33 ART / 03:33 UTC |
| Rama de recuperación histórica listada | sí |
| Snapshots | ninguno |
| Schedule de snapshots | no configurado |
| Restore probado | no, por restricción read-only |

La consola permite restaurar la rama a cualquier punto de la ventana informada. No se pulsó `Preview data` ni `Restore`. La ventana de un día es corta y no sustituye un snapshot pre-release aprobado; antes de una migración debe crearse una rama o snapshot recuperable mediante un cambio separado y autorizado.

## 10. Vercel

- Proyecto único coincidente.
- Production `READY`, rama `main`, SHA `a3c4a54fb20c20749222f9eaf02b23db4444a62f`.
- Consulta de logs de los últimos siete días: 0 resultados `error`, 0 resultados `warning`.
- `DATABASE_URL` existe por nombre y es `sensitive`; `DIRECT_URL` no existe.
- Los valores sensibles no fueron leídos.
- No se creó preview, deployment, PR ni cambio de variable.

## 11. Cambios

Este corte solo actualiza tooling y documentación locales de auditoría. El tooling guardado en `055e344` no necesitó una connection string para esta inspección en consola.

Contra Neon, Vercel y producción: ninguna modificación.

## 12. Riesgos pendientes

1. La migración `202607290001_enforce_cross_owner_relations` aún no está aplicada.
2. No está confirmado que la URL runtime sea pooled ni cuál es su política TLS efectiva.
3. No hay snapshots ni schedule; PITR retiene solo un día.
4. Resend, SPF, DKIM, remitente y entrega real siguen sin verificar.
5. Falta preview del SHA aprobado y smoke A/B completo.
6. Producción continúa en el SHA anterior con el modelo de acceso compartido.

## 13. Git

- Worktree limpio antes de esta actualización documental.
- `main` y `origin/main`: `a3c4a54fb20c20749222f9eaf02b23db4444a62f`.
- Commit de tooling de preflight: `055e3443956079de72e7200a83174a378bfda05f`.
- Sin push, PR, merge ni deploy.

## 14. Próximo paso exacto

**verificar Resend y publicar la rama para generar una preview del SHA aprobado, sin merge a producción.**
