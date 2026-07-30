# Plan de beta privada de Doleth

Fecha del corte: 2026-07-30

Estado: `PRIVATE_BETA_READY_WITH_CONCERNS`

## Objetivo

Habilitar Doleth para el owner y un grupo pequeño de personas invitadas, sin
registro público ni dependencia de correo transaccional. Este corte no autoriza
merge a `main`, migraciones productivas ni deployment de Production.

## Disponible

- invitaciones personales, vinculadas a email, con vencimiento y un solo uso;
- login y sesiones individuales;
- onboarding y funciones financieras;
- aislamiento multiusuario en lectura, mutación, historial, saldos y acceso por ID;
- recuperación administrativa temporal con revocación de sesiones;
- Preview protegida con Neon temporal y secreto de sesión exclusivo.

## Deshabilitado o diferido

- registro público;
- verificación y recuperación por email;
- cambio de email mediante correo;
- autoservicio público y apertura comercial;
- entrega transaccional real.

Antes del lanzamiento público siguen siendo obligatorios un dominio propio,
Resend verificado, SPF, DKIM, remitente permitido y smoke real de entrega.

## Separación de entornos

| Entorno | Aplicación | Base | Escrituras autorizadas |
|---|---|---|---|
| Preview | Rama `codex/production-readiness-audit` | Proyecto Neon temporal | Solo datos controlados de smoke |
| Tests | Ejecución local estricta | Base `doleth_preview_tests` del proyecto temporal | Fixtures de tests |
| Production | `main` en `a3c4a54fb20c20749222f9eaf02b23db4444a62f` | Neon Production | Ninguna en este corte |

La infraestructura temporal debe conservarse hasta que el owner apruebe o
rechace el release. No es un backup de Production.

## Gates de la beta

- [x] Registro público cerrado en servidor y UI.
- [x] Dos invitaciones diferentes consumidas por dos usuarios.
- [x] Token almacenado como hash, con expiración y reclamo atómico.
- [x] Reutilización, manipulación y email incorrecto rechazados.
- [x] Recuperación administrativa de un solo uso.
- [x] Sesiones revocadas al emitir y completar la recuperación.
- [x] Smoke financiero A/B e IDOR.
- [x] Mobile 320/390 y desktop sin overflow horizontal.
- [x] Suite estricta DB sin omisiones.
- [x] Preview y Production separadas.
- [x] PR draft, sin auto-merge.
- [ ] GitHub Actions ejecutables: la cuenta está bloqueada por billing y los jobs
  terminan antes de ejecutar pasos.
- [ ] Custom category CRUD: onboarding crea categorías aisladas por usuario, pero
  la UI actual no permite crear una categoría personalizada.

## Decisión y siguiente gate

La beta privada es utilizable con las limitaciones declaradas. El siguiente paso
no es un release automático: se debe pedir aprobación explícita para el release
productivo privado, crear primero un punto de recuperación en Neon, aplicar las
migraciones pendientes de forma controlada y mantener
`DOLETH_ACCESS_MODE=private-beta`.
