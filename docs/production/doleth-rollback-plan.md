# Plan de rollback de Doleth

Estado: `READY_WITH_CONCERNS`. Debe ensayarse antes del release.

## Evidencia de rehearsal

El 2026-07-29 se ensayó PostgreSQL 16.14 local y descartable:

- expand → backfill → contract → FKs compuestas;
- checksums y saldo preservados;
- dry-run sin escrituras;
- transferencia fallida sin movimiento ni asiento parcial;
- corrección fallida con original intacto;
- escenario cross-owner abortado por preflight.

Esto verifica rollback transaccional. Restauración Neon/PITR sigue pendiente y debe comprobarse antes del release.

## Regla de seguridad

El rollback de aplicación y el rollback de datos son decisiones separadas. No revertir migraciones destructivamente ni restaurar una base sin medir primero las escrituras posteriores.

## Disparadores

- login, verificación o recuperación no funcionan;
- fuga o referencia cruzada entre usuarios;
- saldos o ledger inconsistentes;
- tasa anormal de errores de base;
- migración detenida o checksums alterados;
- correo envía links al dominio equivocado;
- el deployment no corresponde al SHA aprobado.

Una sospecha de fuga multiusuario exige detener el release inmediatamente.

## Antes del release

1. Registrar deployment productivo anterior y su SHA.
2. Confirmar backup/PITR y hora exacta del punto recuperable.
3. Capturar conteos, filas sin owner y checksums.
4. Confirmar que la aplicación anterior tolera las columnas nuevas de la fase expand.
5. Preparar un deployment rollback de la versión anterior.
6. Identificar quién puede promover deployment y quién puede restaurar Neon.

## Fallo antes de escribir datos

1. Cancelar migración o deployment.
2. Mantener la versión anterior.
3. Preservar logs.
4. Corregir en una rama y repetir rehearsal.

## Fallo durante expansión

La expansión agrega tablas/columnas y debe ser compatible hacia atrás.

1. No ejecutar backfill ni contrato.
2. Volver a promover el deployment anterior si la app nueva ya estaba activa.
3. Dejar columnas aditivas en sitio; no quitarlas durante el incidente.
4. Diagnosticar y repetir después de validar.

## Fallo durante backfill

1. Detener nuevas escrituras si no estaban congeladas.
2. No reasignar a otro usuario.
3. Comparar `OwnerBackfillRun`, conteos y checksums.
4. Si la transacción falló, confirmar que no dejó cambios parciales.
5. Si terminó con owner incorrecto, no improvisar un update inverso: restaurar una copia en una rama aislada, medir el delta y aprobar un plan específico.

El script solo reclama filas con owner nulo y ahora el modo `--dry-run` no escribe.

## Fallo en contrato o FKs compuestas

1. No marcar manualmente la migración como aplicada.
2. Leer el error y ejecutar auditorías read-only de nulos/referencias cruzadas.
3. Si Prisma registró una migración fallida, usar `prisma migrate resolve --rolled-back <migración>` solo después de verificar que la transacción revirtió por completo.
4. Corregir los datos mediante un procedimiento revisado.
5. Repetir `prisma migrate deploy`.

## Fallo después del deployment

Si no hay escrituras incompatibles:

1. Promover el deployment productivo anterior desde Vercel.
2. Confirmar login y lecturas.
3. Conservar las migraciones aditivas; no ejecutar SQL inverso.
4. Abrir incidente y preservar logs.

Si ya hubo escrituras:

1. Poner la aplicación en modo de mantenimiento o bloquear mutaciones.
2. Capturar timestamp y última escritura válida.
3. Evaluar forward-fix primero.
4. Usar PITR solo con aprobación, después de cuantificar datos que se perderían.
5. Restaurar a una rama/base nueva antes de reemplazar producción, cuando Neon lo permita.

## Verificación posterior

- deployment y SHA correctos;
- autenticación disponible;
- conteos y checksums coherentes;
- cero owners nulos;
- cero referencias cross-owner;
- balance agregado igual al esperado;
- movimientos anulados excluidos;
- logs sin errores nuevos;
- incidente documentado.
