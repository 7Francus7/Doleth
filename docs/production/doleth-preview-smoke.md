# Smoke de Preview de Doleth

Fecha: 2026-07-30

Rama: `codex/production-readiness-audit`

Commit funcional: `f3a7559931a108cb26c041d9d53f1bfbeae3d6c7`

PR: `#8`, draft, sin auto-merge

Resultado: `PRIVATE_BETA_READY_WITH_CONCERNS`

## Deployment

| Control | Resultado |
|---|---|
| Proyecto | `doleth` |
| Environment | `Preview` |
| Target | `preview` |
| Estado | `READY` |
| Deployment funcional | `doleth-4jlp5055m-francos-projects-a897d8f4.vercel.app` |
| Rama/SHA | Coinciden con la rama y commit funcional indicados arriba |
| Build | 170 líneas revisadas; 0 errores; 0 patrones de credenciales |
| Runtime posterior | 500 registros; 0 estados 5xx; 0 `error`/`fatal`; 0 patrones de credenciales |
| Production deploy | `NO` |

## Infraestructura aislada

- proyecto Neon temporal: `doleth-preview-e15754b-20260730`;
- base de aplicación: `neondb`;
- base estricta de tests: `doleth_preview_tests`;
- seis migraciones aplicadas y checksums 6/6 consistentes en ambas bases;
- las primeras cinco son las migraciones del candidato original y la sexta agrega
  el acceso de beta privada;
- `DATABASE_URL`, `DOLETH_SESSION_SECRET`, `DOLETH_APP_URL` y
  `DOLETH_ACCESS_MODE` tienen overrides Preview de esta rama;
- `DATABASE_URL Preview != DATABASE_URL Production`;
- `DOLETH_SESSION_SECRET Preview != DOLETH_SESSION_SECRET Production`;
- Production: 0 escrituras, 0 migraciones y 0 deployments.

## Usuario A

| Paso | Estado | Evidencia segura |
|---|---|---|
| Invitación vinculada y fragmento retirado | `PASS` | El hash desapareció antes del submit |
| Email incorrecto | `PASS` | Rechazado sin consumir la invitación |
| Cuenta y login | `PASS` | Cuenta activa; email no marcado como verificado |
| Onboarding | `PASS` | Cuenta inicial y saldo persistidos |
| Categorías | `PASS_WITH_CONCERN` | Categorías aisladas creadas por onboarding; no existe CRUD custom |
| Ingreso y gasto | `PASS` | Ambos visibles en el ledger |
| Segunda cuenta y transferencia | `PASS` | Total patrimonial no cambió por la transferencia |
| Corrección auditable | `PASS` | Original anulado y reemplazo vigente |
| Redirect tras corrección | `PASS` | Defecto detectado, corregido y repetido en Preview |
| Anulación | `PASS` | Movimiento conservado en historial y excluido de saldos |
| Próximo pago | `PASS` | Compromiso visible sin descontar hasta confirmación |
| Inversión | `PASS` | Aporte y valor actual visibles |
| Ahora/Próximo/Cambios/Progreso/Mi realidad | `PASS` | Rutas y encabezados verificados |
| Historial | `PASS` | Vigentes, corregidos y anulados visibles |
| Logout/reingreso/persistencia | `PASS` | Cuentas y datos persistieron |

## Usuario B y aislamiento

| Paso | Estado | Evidencia segura |
|---|---|---|
| Invitación distinta | `PASS` | Token diferente y un solo uso |
| Onboarding | `PASS` | Cuenta propia creada |
| Listados | `PASS` | No mostró cuentas, movimientos, pagos ni inversiones de A |
| Recursos A por ID | `PASS` | Movimientos y próximo pago respondieron `not found` |
| Edición A por ID | `PASS` | Ruta `/editar` respondió `not found` |
| Mutaciones cross-owner | `PASS` | Suite estricta de autorización/aislamiento verde |
| Datos propios | `PASS` | B registró su propio gasto |
| A no ve B | `PASS` | Listado y acceso directo rechazados |

## Invitaciones y recuperación

| Control | Estado |
|---|---|
| Registro directo sin invitación | `PASS` |
| Invitación reutilizada | `PASS` |
| Invitación manipulada | `PASS` |
| Email diferente | `PASS` |
| Invitación expirada | `PASS` en suite DB estricta |
| Token almacenado como hash | `PASS` |
| Token ausente de URL/logs/documentación | `PASS` |
| Recuperación administrativa | `PASS` |
| Sesiones revocadas al emitir | `PASS` |
| Contraseña anterior rechazada | `PASS` |
| Contraseña nueva aceptada | `PASS` |
| Segundo uso de recuperación | `PASS` |

## UX

Se ejecutó el mismo build de producción contra Neon temporal en Chromium aislado
porque Deployment Protection impide el acceso de un navegador sin sesión Vercel.
No se copiaron cookies de Vercel.

| Viewport | Rutas | Overflow | Consola |
|---|---:|---:|---:|
| 320 × 800 | 3 | 0 | 0 errores |
| 390 × 844 | 3 | 0 | 0 errores |
| 1440 × 900 | 3 | 0 | 0 errores |

Rutas: `/ahora`, `/movimientos/nuevo` y `/configuracion/cuenta`. Las capturas
quedaron fuera del repositorio y no contienen secretos.

## Hallazgos corregidos durante el smoke

1. El CLI no podía importar el módulo protegido por `server-only` fuera de
   Next.js. Se ejecuta ahora con condición explícita de servidor.
2. Prisma no deserializaba el retorno `void` del advisory lock del bootstrap. Se
   convirtió el retorno a texto sin retirar el lock.
3. Después de corregir un movimiento, el refresh podía mostrar 404 porque el
   original ya estaba anulado. La ruta redirige ahora al reemplazo auditable.

## Limitaciones

- no existe correo transaccional real;
- Resend, dominio, SPF y DKIM siguen pendientes;
- no existe creación de categorías personalizadas en UI;
- GitHub Actions no ejecuta pasos por bloqueo de billing de la cuenta;
- el warning futuro de semántica TLS de `pg` sigue pendiente.
