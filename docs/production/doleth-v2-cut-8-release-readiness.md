# Doleth V2 · Corte 8 · Release readiness

Fecha: 2026-08-13  
Rama: `codex/v2-cut-8-release-readiness`  
Veredicto: `DOLETH_V2_NOT_READY_FOR_PRODUCTION`

El producto y la regresión financiera quedaron aptos para seguir hacia un candidato remoto. El release público continúa bloqueado porque no existe una Preview aislada de este SHA y no se pudo completar una entrega real de email ni verificar el estado actual de backup/PITR del proveedor.

## A. PostgreSQL

Infraestructura usada:

- PostgreSQL 17.11 local, servicio exclusivo del corte;
- host `127.0.0.1`, puerto `55432`;
- base `doleth_cut8_test`;
- host y nombre distintos de Neon Production;
- credencial efímera fuera del repositorio;
- `DATABASE_URL` productiva ausente durante Vitest;
- `TEST_DATABASE_URL` y `DOLETH_REQUIRE_DB=1` obligatorios.

Resultado:

| Control | Resultado |
|---|---:|
| Migraciones desde cero | 11/11 |
| Checksum/historial de migraciones | consistente |
| Archivos de test | 83 passed, 0 failed |
| Tests | 1.228 passed, 0 failed, 0 skipped |
| Duración Vitest | 113,19 s |
| Aislamiento bloqueante repetido | 5 archivos, 52/52, 0 skipped, 5,97 s |

El número histórico de 222 pruebas quedó superado por la suite actual de 1.228. Se ejecutaron integración DB, ownership, aislamiento, ledger, correcciones, anulaciones, transferencias, pagos previstos, importación, inversiones y auth. No se aumentaron timeouts ni se usó Production.

GitHub Actions conserva una configuración correcta con PostgreSQL efímero, pero el runner no inicia ningún paso: la cuenta está bloqueada por facturación. La ejecución local es por eso la evidencia efectiva de este corte.

## B. Email

La regresión automatizada real sobre PostgreSQL valida:

- registro pendiente y envío solicitado;
- verificación válida, vencida, inválida y de un solo uso;
- reenvío e invalidación del enlace anterior;
- recuperación, expiración, reuso y revocación de sesiones;
- cambio de email y aislamiento entre usuarios;
- rate limits y respuestas anti-enumeración;
- fallo seguro del proveedor.

La entrega externa no quedó aprobada. Vercel lista por nombre `RESEND_API_KEY`, `DOLETH_EMAIL_FROM` y `DOLETH_APP_URL` en Production y Preview, sin exponer valores. Sin embargo, las variables son sensibles, no hay una Preview de esta rama con DB/origen demostrablemente aislados y no hay un buzón controlado accesible para comprobar recepción y consumir links reales. Por lo tanto siguen sin verificación efectiva:

- dominio/remitente, SPF y DKIM actuales;
- salida y llegada real;
- host del enlace del candidato;
- recorrido real de registro, reenvío, recuperación y cambio de email.

## C. Candidato

Se construyó y ejecutó un candidato local en modo producción con la base descartable:

- Next.js 16.3.0;
- Prisma 7.9.1;
- `/api/salud`: 200, DB up, 11 migraciones al día;
- Inicio, Movimientos, Cuentas, Plan y Patrimonio navegables;
- login y logout/login cubiertos por suite y smoke local;
- build optimizado exitoso.

No se desplegó una Preview remota a ciegas. La rama aún no tiene overrides Preview propios y no se pudo demostrar que la `DATABASE_URL` compartida de Preview sea distinta de Production. El Production actual está `READY` y sano en `doleth.vercel.app`, pero corresponde a `main`/SHA `359b2f9`, no a este candidato V2, que está 17 commits por delante.

## D. Mobile

Problema reproducido: `+ NUEVO / …` flotaba sobre contenido, importes, selectores y acciones.

Corrección:

- dock opaco y estructural encima de la bottom nav;
- reserva de 9,5 rem más safe-area al final del canvas;
- `+ NUEVO` y `…` conservan targets de 48 px;
- cinco destinos intactos;
- desktop conserva el rail existente.

QA visual aprobado en 320, 375 y 390 px, menú secundario, safe-area, formulario, viewport reducido simulando teclado y scroll final. `Cancelar` y `Guardar gasto` quedan alcanzables; ninguna acción queda detrás de otra.

## E. Perfil 1.000+

Perfil descartable: 1.051 movimientos, 1.156 asientos, dos cuentas, categorías, inversión y próximo pago. Seed: 1.358 ms.

Medición del candidato local, segunda navegación en producción:

| Pantalla | Respuesta | DOMContentLoaded | Transferencia | Comando completo |
|---|---:|---:|---:|---:|
| Inicio | 46 ms | 53 ms | 48.450 B | 202 ms |
| Movimientos | 66 ms | 76 ms | 109.608 B | 219 ms |
| Cuentas | 73 ms | 88 ms | 33.128 B | 268 ms |
| Plan | 41 ms | 60 ms | 32.594 B | 221 ms |
| Patrimonio | 90 ms | 103 ms | 32.239 B | 254 ms |

Movimientos limita la lectura por período y conserva filtros/búsqueda en URL. Se verificaron listado, búsqueda/filtro, cambio de período, detalle, retorno contextual, scroll, mobile 390 y desktop 1440. No se observó un cuello que justificara índices o cambios de schema. La cantidad de queries no se instrumentó: añadir logging al runtime para obtenerla no aportaba una decisión distinta con estos tiempos.

## F. Seguridad

| Control release-critical | Resultado |
|---|---|
| Credenciales reales versionadas | no encontradas |
| `.env*` | ignorados; solo `.env.example` trackeado |
| Base test vs Production | separada y verificada |
| Ownership/IDOR/ledger | 52/52 aislamiento; suite total verde |
| Cookies y sesiones | firmas, vencimiento, revocación y headers cubiertos |
| Rate limits | registro, reenvío, login y reset cubiertos |
| Reset/verificación email | tokens hash, expiración y un solo uso cubiertos |
| Baja/admin | controles y separación cubiertos |
| Headers Production | HSTS, CSP, DENY, nosniff, no-referrer presentes |
| Dependencias productivas | `pnpm audit --prod`: 0 vulnerabilidades conocidas |

Se actualizaron Next 16.2.9 → 16.3.0, ESLint config 16.2.9 → 16.3.0 y Prisma 7.9.0 → 7.9.1 para eliminar vulnerabilidades altas del framework y transitivas. La suite completa, build y Storybook se repitieron después.

## G. Producción y operación

Matriz final:

| Verificación | Estado |
|---|---|
| Lint | PASS |
| Typecheck | PASS |
| Unit/integration/DB | PASS · 1.228/1.228 |
| Aislamiento explícito | PASS · 52/52 |
| Build | PASS |
| Storybook build | PASS con warnings de bundling ya conocidos |
| Audit dependencias prod | PASS · 0 conocidas |
| Health Production actual | PASS · 200, DB up, migraciones al día |
| Preview del SHA final | BLOCKED · no existe entorno DB aislado comprobable |
| Email real | BLOCKED · proveedor/buzón/links no verificados |
| Backup/PITR actual | INCONCLUSIVE |

Observabilidad existente:

- errores server-side estructurados con referencia y sin payload sensible;
- health público con DB y migraciones;
- Vercel runtime logs consultables;
- en las últimas 24 h solo apareció un warning TLS de `pg` clasificado por Vercel como error, sin 5xx observados en la muestra;
- no hay alerta externa ni prueba de que un fallo de email dispare una notificación.

Backup/recuperación: el último control documentado verificó PITR de un día, sin snapshots ni schedule, y existe un runbook. Esa evidencia es de 2026-07-30 y no demuestra el estado actual; no se ejecutó restore ni se inventó una política no configurada.

Para destrabar el release faltan exactamente:

1. crear/asignar una DB Preview separada y demostrar host/base distintos de Production;
2. desplegar este SHA como Preview con `DOLETH_APP_URL` propio;
3. ejecutar entrega real de registro, reenvío, reset y cambio de email en buzón controlado;
4. verificar en Neon el PITR/snapshot actual y registrar un punto de recuperación reciente;
5. resolver la facturación de GitHub Actions para recuperar CI remoto.

## H. Veredicto

`DOLETH_V2_NOT_READY_FOR_PRODUCTION`

Los bloqueantes PostgreSQL, seguridad de dependencias, solapamiento mobile y perfil pesado quedaron cerrados. Email real, Preview aislada del SHA final y backup/PITR actual siguen siendo gates de publicación, no concerns menores.
