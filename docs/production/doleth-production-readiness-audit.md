# Auditoría de preparación productiva de Doleth

Fecha: 2026-07-30
Rama auditada: `codex/production-readiness-audit`
Base candidata: rehearsal PostgreSQL verificado en `af60b682235c2387950226df3da818bee6253277`

## Veredicto

`BLOCKED`

El candidato es la base correcta y supera migraciones reales, `lint`, `typecheck`, 787 tests con PostgreSQL y `build`. El preflight actual de Neon confirmó datos, ownership, ledger, checksums y PITR en modo read-only. Aun así, no debe recibir dinero real hasta aplicar de forma controlada la migración pendiente, preparar recuperación pre-release, verificar correo y completar el smoke desplegado con dos usuarios.

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
| Aislamiento en base | `VERIFIED` | FKs compuestas aplicadas en PostgreSQL 16.14; intentos A/B fallaron con `P2003`. |
| Integridad financiera | `VERIFIED` en PostgreSQL | Centavos `BigInt`, transferencias, anulaciones, correcciones y fallos inducidos pasaron. |
| Migraciones | `READY_WITH_CONCERNS` | Desde cero y legacy pasaron; producción aún requiere preflight, backup y orquestación expand/backfill/contract. |
| Producción actual | `BLOCKED` | Vercel producción sigue en `main` antiguo con clave compartida. |
| Neon | `VERIFIED_WITH_CONCERNS` | Rama `production` protegida; datos, ownership, ledger, checksums y PITR verificados read-only. Quinta migración pendiente, ventana PITR de 1 día y sin snapshots. |
| Vercel | `VERIFIED_WITH_CONCERNS` | Proyecto único, Production `READY`, `main` en `a3c4a54`; Node.js 24.x; consulta de 7 días devolvió 0 errores y 0 warnings. Valores sensibles no fueron leídos. |
| Resend | `INCONCLUSIVE` | No se verificaron dominio, SPF, DKIM, remitente ni entrega real. |
| QA automatizado con DB | `VERIFIED` | `lint`, `typecheck`, 787/787 tests, 52/52 tests estrictos y `build` pasaron. |
| QA de navegador | `BLOCKED` | No se completó smoke desplegado A/B, correo ni viewport. |
| Descubrimiento Sandía | `INCONCLUSIVE` | Sitio público inspeccionado; no publica una opción verificable de exportación. |
| Importador Sandía | `NOT_IMPLEMENTED` | Deliberadamente fuera de este corte; se creó especificación. |

## Bloqueantes

### 1. Contrato de ownership productivo pendiente

- Problema: el preflight read-only confirmó que `202607290001_enforce_cross_owner_relations` está pendiente; faltan las 5 claves compuestas y 8 FKs compuestas esperadas.
- Impacto: los datos actuales están limpios, pero la base todavía no impone todas las relaciones de ownership del candidato.
- Resolución: preparar la migración para la ventana de release, después de un snapshot o branch de recuperación autorizado. No ejecutarla durante este preflight.
- Validación: repetir checksums, cross-owner, catálogo y ledger después del cambio.

### 2. Producción despliega el código anterior

- Problema: `doleth.vercel.app` apunta a `main` en `a3c4a54`, que usa acceso compartido y no el candidato multiusuario.
- Impacto: el producto público no ofrece el aislamiento auditado.
- Resolución: después de cerrar los demás bloqueantes, publicar el candidato, abrir PR y usar preview protegida para el smoke.
- Validación: deployment preview identifica el SHA aprobado y producción permanece intacta hasta autorización.

### 3. Correo transaccional no verificado

- Problema: no hay evidencia de Resend, dominio, SPF/DKIM, remitente o callbacks reales.
- Impacto: registro, verificación y recuperación pueden quedar inutilizables.
- Resolución: verificar configuración externa sin revelar valores y enviar pruebas a dos direcciones controladas.
- Validación: entrega, enlace absoluto correcto, expiración y reutilización rechazada.

### 4. Smoke de extremo a extremo pendiente

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

Esta evidencia histórica coincide con el preflight actual: los mismos conteos, cero owners nulos, cero huérfanos y cero cruces de propietario.

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

1. snapshot/branch de recuperación previo y aplicación controlada de la migración pendiente;
2. configuración Resend verificada;
3. preview del SHA aprobado y smoke A/B completo;
4. PR revisado sin merge automático.

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
