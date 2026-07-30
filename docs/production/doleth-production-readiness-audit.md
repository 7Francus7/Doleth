# Auditoría de preparación productiva de Doleth

Fecha: 2026-07-29
Rama auditada: `codex/production-readiness-audit`
Base candidata: `integration/identity-over-corte-7` en `fc3f8196490b2fd496823fd7e1b10bf559a2dfc1`

## Veredicto

`BLOCKED`

El candidato es la base correcta y supera `lint`, `typecheck`, tests sin base y `build`. La autenticación multiusuario y el modelo financiero están sustancialmente implementados. Aun así, no debe recibir dinero real hasta completar una prueba de migraciones sobre PostgreSQL, ejecutar la suite con base, verificar el estado actual de producción y completar un smoke real con dos usuarios y correo.

## Evidencia Git

- `main` y `origin/main`: `a3c4a54fb20c20749222f9eaf02b23db4444a62f`.
- Candidato: `fc3f8196490b2fd496823fd7e1b10bf559a2dfc1`.
- Divergencia: candidato 33 commits por delante y 0 por detrás de `main`.
- El working tree original se preservó. Contenía tres JSON sin seguimiento en `evidencia/`.
- No había stashes.
- La auditoría se realizó en un worktree separado.
- No se publicó rama, no se abrió PR, no se hizo merge y no se desplegó producción.

## Estado por área

| Área | Estado | Evidencia |
|---|---|---|
| Candidato Git | `VERIFIED` | Contenido y commits comparados; incluye corte 7 e identidad multiusuario. |
| Autenticación en código | `READY_WITH_CONCERNS` | Registro, verificación, sesiones, recuperación, cambio de contraseña, tokens de un solo uso y rate limiting implementados; falta smoke real con proveedor de correo. |
| Aislamiento en aplicación | `READY_WITH_CONCERNS` | Lecturas y mutaciones filtran por sesión y `userId`; se corrigieron dos deduplicaciones recientes sin owner. |
| Aislamiento en base | `READY_WITH_CONCERNS` | Se agregó una migración de claves compuestas para impedir referencias entre owners; falta aplicarla en PostgreSQL desechable y ejecutar pruebas DB. |
| Integridad financiera | `READY_WITH_CONCERNS` | Dinero en centavos `BigInt`, escrituras atómicas, anulaciones y correcciones trazables; falta suite DB y reconciliación de rehearsal. |
| Migraciones productivas | `BLOCKED` | El flujo expand/backfill/contract requiere orquestación; la nueva migración no fue probada contra PostgreSQL real. |
| Producción actual | `BLOCKED` | Vercel producción sigue en `main` antiguo con clave compartida. |
| Neon | `INCONCLUSIVE` | No hubo acceso autorizado a proyecto, ramas, pooling, backups o PITR. |
| Resend | `INCONCLUSIVE` | No se verificaron dominio, SPF, DKIM, remitente ni entrega real. |
| QA automatizado sin DB | `VERIFIED` | `lint`, `typecheck`, 680 tests y `build` pasaron después de los cambios. |
| QA con DB y navegador | `BLOCKED` | 97 tests quedaron omitidos sin `TEST_DATABASE_URL`; no se completó smoke A/B ni viewport. |
| Descubrimiento Sandía | `INCONCLUSIVE` | Sitio público inspeccionado; no publica una opción verificable de exportación. |
| Importador Sandía | `NOT_IMPLEMENTED` | Deliberadamente fuera de este corte; se creó especificación. |

## Bloqueantes

### 1. Validación PostgreSQL pendiente

- Problema: la suite DB, el rehearsal completo de migraciones y las nuevas FKs compuestas no fueron ejecutados.
- Impacto: una incompatibilidad de migración o una referencia histórica inválida podría detener el release.
- Resolución: crear una base temporal separada, ejecutar todas las migraciones desde cero, auditar migraciones y correr tests con `DOLETH_REQUIRE_DB=1`.
- Validación: todos los comandos del checklist deben pasar y la base temporal debe poder descartarse.

### 2. Estado productivo actual no verificado

- Problema: no se consultaron directamente Neon, migraciones actuales, filas sin owner, backup ni PITR.
- Impacto: no se puede calcular con certeza el impacto de aplicar migraciones.
- Resolución: ejecutar solamente el preflight read-only y confirmar backup/PITR antes de cualquier escritura.
- Validación: evidencia fechada de conteos, ownership, migraciones y punto de restauración.

### 3. Producción despliega el código anterior

- Problema: `doleth.vercel.app` apunta a `main` en `a3c4a54`, que usa acceso compartido y no el candidato multiusuario.
- Impacto: el producto público no ofrece el aislamiento auditado.
- Resolución: después de cerrar los demás bloqueantes, publicar el candidato, abrir PR y usar preview protegida para el smoke.
- Validación: deployment preview identifica el SHA aprobado y producción permanece intacta hasta autorización.

### 4. Correo transaccional no verificado

- Problema: no hay evidencia de Resend, dominio, SPF/DKIM, remitente o callbacks reales.
- Impacto: registro, verificación y recuperación pueden quedar inutilizables.
- Resolución: verificar configuración externa sin revelar valores y enviar pruebas a dos direcciones controladas.
- Validación: entrega, enlace absoluto correcto, expiración y reutilización rechazada.

### 5. Smoke de extremo a extremo pendiente

- Problema: no se completó el recorrido real con Usuario A y B, mobile, desktop, consola y logs.
- Impacto: las pruebas unitarias no demuestran que todo el sistema desplegado funciona.
- Resolución: seguir el checklist sobre la preview aprobada y una base de prueba separada.
- Validación: evidencia de los 28 pasos sin fuga A/B ni errores de servidor.

## Evidencia histórica preservada

Los JSON locales sin seguimiento muestran un backfill ejecutado el 2026-07-28:

- 1 cuenta, 13 categorías, 1 transacción y 1 asiento pasaron de `userId` nulo al owner indicado.
- No quedaron filas sin owner ni filas asignadas a otros usuarios en esas seis tablas.
- Los checksums funcionales antes/después coinciden; solo cambió la captura temporal.
- El preflight posterior mantuvo los mismos conteos.

Esta evidencia es `VERIFIED` para aquel evento, pero el estado actual de Neon sigue `INCONCLUSIVE`.

## Riesgos no bloqueantes

- El rate limiter usa ventana fija y puede permitir ráfagas en el borde de ventana.
- La CSP permite `unsafe-inline`, compatible con la aplicación actual pero mejorable.
- El saldo inicial vive en la cuenta y no como asiento; el saldo se reconstruye como saldo inicial más ledger vivo, no desde ledger puro.
- No hay job operativo de reconciliación continua.
- El `sslmode=require` reportó un warning de `pg`; debe acordarse el modo TLS con Neon.
- `prisma.config.ts` tiene una URL local de fallback: es conveniente exigir `DATABASE_URL` explícita en operaciones.

## Defecto de build corregido

Una compilación limpia no pudo resolver `server-only`. Aunque Next.js maneja su semántica, el paquete se importa directamente en el repositorio. Se agregó `server-only@0.0.1` como dependencia explícita y el build volvió a pasar.

También se escapó el nuevo email antes de insertarlo en HTML y se impidió que una sesión ajena consuma un token de cambio de correo antes de validar su owner.

## Alcance mínimo de lanzamiento

Bloqueantes reales:

1. rehearsal PostgreSQL y suite DB;
2. preflight productivo read-only más backup/PITR;
3. configuración Resend verificada;
4. preview del SHA aprobado y smoke A/B completo;
5. PR revisado sin merge automático.

Importantes no bloqueantes:

- endurecer CSP;
- mejorar rate limiting;
- reconciliación operativa;
- resolver warning TLS;
- revisión legal de privacidad, términos y retención.

Mejoras futuras que no deben retrasar el lanzamiento:

- importador Sandía;
- conexión bancaria;
- IA;
- aplicación nativa;
- presupuestos o reportes avanzados;
- pagos, suscripciones, equipos o multimoneda avanzada.
