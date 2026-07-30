# Smoke de Preview de Doleth

Fecha del corte: 2026-07-30

Rama: `codex/production-readiness-audit`

Commit funcional auditado: `6b9b3b5ead26135cbbb53c2dbb7168f6307afb5d`

PR: `#8`, draft, sin auto-merge

## Deployment

| Control | Resultado |
|---|---|
| Proyecto | `doleth` |
| Environment | `Preview` |
| Estado | `READY` |
| Fuente | Redeploy del deployment Git del mismo SHA |
| Framework | Next.js |
| Node.js | `24.x` |
| Región | `iad1` |
| SHA | Debe coincidir exactamente con el HEAD del PR; registrar desde metadata de Vercel en el informe final. |
| Rama | `codex/production-readiness-audit` |
| Alias | Alias estable de la rama; no registrar aquí URLs con tokens |
| Protección | Activa |
| Build errors | `0` |
| Runtime error/warning/fatal inicial | `0` |
| HTTP raíz | Redirección esperada a inicio de sesión; destino final `200` |

## Separación de datos

- Neon Preview es un proyecto independiente: `doleth-preview-e15754b-20260730`.
- La base de aplicación contiene 12 tablas, 5 migraciones aplicadas y cero datos reales al iniciar el smoke.
- La base de tests es distinta de la base de aplicación.
- `DATABASE_URL`, `DOLETH_SESSION_SECRET` y `DOLETH_APP_URL` tienen overrides `sensitive` exclusivos de la rama Preview.
- El secreto de sesión fue generado nuevamente para Preview.
- La quinta migración está aplicada en Preview y sigue pendiente en Production.
- Neon Production no recibió migraciones ni escrituras.
- Vercel Production no recibió deployment, promoción ni cambios de variables durante este corte.

## Infraestructura temporal

- Propósito: ejecutar Preview y smoke A/B sin acceso a datos reales.
- Owner operativo: Release Manager/owner del proyecto Doleth.
- Retención: conservar hasta aprobación o rechazo explícito del release.
- Eliminación: después de la decisión, confirmar que no se necesita evidencia, quitar los overrides Preview relacionados y eliminar únicamente el proyecto Neon temporal desde su consola.
- Prohibido: eliminar o modificar el proyecto Neon Production.

## Smoke Usuario A

| Paso | Estado | Evidencia segura |
|---|---|---|
| Registro | `PENDING` | — |
| Verificación de email | `PENDING` | — |
| Login | `PENDING` | — |
| Onboarding | `PENDING` | — |
| Crear cuenta y categoría | `PENDING` | — |
| Ingreso y gasto | `PENDING` | — |
| Segunda cuenta y transferencia | `PENDING` | — |
| Corrección y anulación | `PENDING` | — |
| Próximo pago e inversión | `PENDING` | — |
| Ahora, Próximo, Cambios, Progreso y Mi realidad | `PENDING` | — |
| Historial | `PENDING` | — |
| Logout, reingreso y persistencia | `PENDING` | — |

## Smoke Usuario B y aislamiento

| Paso | Estado | Evidencia segura |
|---|---|---|
| Registro, verificación, login y onboarding | `PENDING` | — |
| No ve datos de A | `PENDING` | — |
| Lectura por URL/ID de A rechazada | `PENDING` | — |
| Edición, anulación y corrección de A rechazadas | `PENDING` | — |
| Datos propios de B | `PENDING` | — |
| A no ve datos de B | `PENDING` | — |

## Recuperación y tokens

| Control | Estado |
|---|---|
| Recuperación de A | `PENDING` |
| Segundo uso rechazado | `PENDING` |
| Contraseña anterior rechazada | `PENDING` |
| Contraseña nueva aceptada | `PENDING` |
| Sesiones anteriores revocadas según diseño | `PENDING` |
| Token expirado rechazado | `PENDING` |
| Sesión ajena no consume token | `PENDING` |

## UX y runtime

| Control | Estado |
|---|---|
| Mobile 320 px | `PENDING` |
| Mobile 390 px | `PENDING` |
| Desktop | `PENDING` |
| Overflow horizontal | `PENDING` |
| Navegación y estados vacíos | `PENDING` |
| Errores de formulario | `PENDING` |
| Consola | `PENDING` |
| Logs posteriores al smoke | `PENDING` |
| Fixtures visibles | `PENDING` |
| Links a Production | `PENDING` |
| Escrituras en Neon Production | `0` hasta este punto |

## Migración en Preview

- Cinco migraciones aplicadas una vez.
- Segunda ejecución: sin migraciones pendientes.
- Cinco claves compuestas y ocho foreign keys compuestas presentes.
- Checksums 5/5 consistentes.
- Cero filas reales antes del smoke.
- Suma del ledger inicial: cero.
- Production continúa pendiente e intacta.

## Estado actual

`IN_PROGRESS`

Faltan acceso autenticado a Vercel para el navegador protegido, Resend, entrega real y smoke A/B. No aprobar producción con esta bitácora incompleta.
