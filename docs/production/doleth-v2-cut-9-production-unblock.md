# Doleth V2 · Corte 9 · Production unblock

Fecha: 2026-08-13  
Rama: `codex/v2-cut-8-release-readiness`  
Commit candidato: `02ec3f2`  
Veredicto: `DOLETH_V2_NOT_READY_FOR_PRODUCTION`

No se hizo merge, deploy Production, restore, cambio de billing ni modificación de schema. Corte 8.1 permaneció congelado.

## 1. Entornos

| Variable/control | Local | Preview de Corte 9 | Production |
|---|---|---|---|
| `DATABASE_URL` | presente; no usada por tests | override sensible exclusivo de rama; endpoint Neon separado | entrada sensible separada, sin cambios |
| `TEST_DATABASE_URL` | vacía por defecto; inyectada solo para el gate local | ausente | ausente |
| `DOLETH_SESSION_SECRET` | presente | override sensible nuevo y exclusivo de rama | entrada sensible separada, sin cambios |
| `DOLETH_APP_URL` | local | alias estable exclusivo de Corte 9 | entrada productiva sin cambios |
| Resend (`API_KEY`, `FROM`, transport) | no verificable localmente | entradas sensibles compartidas/genéricas; envío real falla | sin cambios |
| Modo de acceso | desarrollo | público por default | configuración productiva existente |

No se mostraron valores en documentación. Un bypass de automatización de Vercel fue impreso por la herramienta de navegador durante QA; se rotó inmediatamente, se revocó el valor expuesto y se confirmó un único bypass activo nuevo.

## 2. Gate reproducible

Se agregó `pnpm release:check`. El comando:

- rechaza ausencia de `TEST_DATABASE_URL` antes de ejecutar tareas;
- nunca usa `DATABASE_URL` como fallback;
- reutiliza la guardia que rechaza destinos iguales o con señales de Production;
- ejecuta migraciones, auditoría, lint, typecheck, tests PostgreSQL, aislamiento, build y Storybook.

Ejecución contra PostgreSQL 17 descartable en loopback:

| Control | Resultado |
|---|---:|
| Migraciones | PASS · 11/11 |
| Historial/checksums | PASS |
| Lint | PASS |
| Typecheck | PASS |
| Tests | PASS · 83 archivos, 1.228 tests |
| Aislamiento explícito | PASS · 5 archivos, 52 tests |
| Build | PASS |
| Storybook | PASS con warnings de bundling conocidos |

La instancia descartable fue detenida después del gate.

## 3. Preview aislada

Alias: `https://doleth-cut9-francos-projects-a897d8f4.vercel.app`  
Deployment final: `dpl_53FuUsACvRoR1rifToiTwFwwRzFM`

La DB autorizada estaba vacía antes del despliegue: 0 tablas públicas. El build remoto aplicó 11/11 migraciones; un redeploy confirmó 0 pendientes. Al cierre hay 0 usuarios y 11 migraciones aplicadas.

`/api/salud` respondió 200 con DB `up`, migraciones `al día` y ninguna pendiente. Deployment Protection siguió activa; el QA usó el bypass oficial de automatización.

Smoke comprobado:

- carga de login y registro;
- login real con usuario QA aislado;
- onboarding pasos 1, 2 y 3;
- defaults de ARS, zona horaria, locale, moneda de lectura y variante FX;
- registro llega al backend y maneja error de proveedor sin filtrar detalles;
- cleanup final de todos los usuarios QA.

Smoke no aprobado: el onboarding completo, las operaciones financieras, logout, reset, sesiones y baja no llegaron a ejecutarse de extremo a extremo. El registro quedó bloqueado por email y el proceso persistente del navegador se perdió al continuar el onboarding. No se usa cobertura local como sustituto de esa evidencia remota.

## 4. Resend

Se usó el destinatario oficial de simulación `delivered+…@resend.dev`. Resultado visible:

`No pudimos enviar el correo en este momento. Probá de nuevo en unos minutos.`

El flujo creó una cuenta pendiente y el email no salió; la cuenta QA fue eliminada al cerrar. No se obtuvo inbox ni link, por lo que no están probados registro, reenvío, reset o cambio de email. Tampoco hay acceso autenticado a Resend para demostrar dominio, remitente, SPF y DKIM actuales.

Estado: `BLOCKED`.

## 5. Neon backup/PITR

No hay `NEON_API_KEY`, sesión de `neonctl` ni consola autenticada disponible. La última evidencia es del 2026-07-30: PITR de 1 día, sin snapshots ni schedule. No demuestra el estado del 2026-08-13.

Se agregó [RECOVERY.md](./RECOVERY.md). No se ejecutó restore, no se creó snapshot y no se modificó billing.

Estado: `INCONCLUSIVE` y bloqueante.

## 6. GitHub Actions

El workflow conserva jobs estáticos, PostgreSQL efímero, `DOLETH_REQUIRE_DB=1`, migraciones, auditoría, suite y build. Se disparó manualmente sobre el candidato:

- run `31755507389`;
- `Lint y typecheck`: failure antes de steps;
- `Pruebas (PostgreSQL real)`: failure antes de steps;
- `Build`: skipped;
- 0 logs de job disponibles.

Esto confirma un bloqueo de cuenta/runner de Actions, no una falla de código observada. El gate local verde es evidencia reproducible, pero no reemplaza CI remoto.

Estado: `BLOCKED`.

## 7. Matriz final

| Gate | Estado | Decisión |
|---|---|---|
| Preview aislada | PASS | cerrado |
| Resend E2E real | FAIL | bloquea Production |
| Neon backup/PITR actual | INCONCLUSIVE | bloquea Production |
| GitHub Actions | FAIL antes de steps | bloquea Production |
| `pnpm release:check` | PASS | cerrado |
| Observabilidad básica | PASS con concern TLS/CSP | no cierra los otros gates |
| Smoke remoto completo | INCOMPLETE | bloquea Production |
| Production | NO TOCADA | requiere autorización posterior |

## 8. Próximos pasos exactos

1. En Resend, validar dominio/remitente/SPF/DKIM y corregir el rechazo de envío; repetir inbox y links reales.
2. En Neon, registrar evidencia actual de PITR/snapshot y retención siguiendo `RECOVERY.md`.
3. Resolver billing/runner de GitHub Actions y repetir el run sobre el SHA candidato hasta obtener steps verdes.
4. Repetir el smoke completo sobre el alias Preview antes de solicitar autorización de Production.

`DOLETH_V2_NOT_READY_FOR_PRODUCTION`
