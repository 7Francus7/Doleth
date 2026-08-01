# Adopción del administrador histórico de la beta privada

Fecha del corte: 2026-08-01. Rama: `codex/private-beta-admin-adoption`.

## Motivo

El primer release privado llegó a `READY`, pero el smoke productivo se detuvo
antes de escribir: la única cuenta histórica seguía como
`USER / PENDING_VERIFICATION` y no existía un administrador activo capaz de
emitir invitaciones. El alias se devolvió al deployment anterior. Neon quedó con
seis migraciones, datos íntegros y un punto de recuperación conservado.

No se usa `bootstrap-admin`: esa operación exige una base vacía, crea otro
usuario y emite un token. Tampoco existe bootstrap automático, ruta web, Server
Action ni API para la adopción.

## Comando

```text
pnpm admin:adopt-existing-user -- --dry-run
pnpm admin:adopt-existing-user -- --execute
```

El comando real exige TTY. ID y email se introducen por prompt local; se
rechazan argumentos silenciosos. Production requiere además
`DOLETH_ALLOW_PRODUCTION_ADMIN_ADOPTION=YES` antes de conectar.

Variables obligatorias (cargadas solo en el proceso):

- `DOLETH_ADMIN_ADOPTION_DATABASE_URL` (nunca cae a `DATABASE_URL`);
- `DOLETH_ADMIN_ADOPTION_ENVIRONMENT` (`rehearsal`, `preview`, `production` o
  `test` con doble opt-in);
- host y nombre de base esperados;
- project ID y branch ID objetivos;
- project ID, branch ID y host productivos para demostrar igualdad o
  separación según el entorno;
- actor técnico, motivo y commit de 40 caracteres;
- `DOLETH_ACCESS_MODE=private-beta`.

No registrar valores de estas variables. Los errores solo emiten códigos
cerrados.

## Selección y guards

La operación requiere simultáneamente:

- coincidencia exacta de ID y email;
- exactamente un candidato y un usuario total;
- seis migraciones aplicadas y cero fallidas;
- estado inicial `PENDING_VERIFICATION`, rol `USER` y beta sin activar;
- `emailVerifiedAt IS NULL`;
- cero administradores activos, sesiones, tokens e invitaciones;
- 1 cuenta, 13 categorías, 1 transacción, 1 ledger, 0 inversiones y 0 pagos
  próximos, todos del objetivo y también como conteos globales;
- cero owners nulos, huérfanos o cross-owner.

Preview/rehearsal abortan si host, proyecto o branch coinciden con Production.
Production aborta si cualquiera no coincide con la identidad productiva, si
falta el flag extra o si la URL dedicada coincide con `TEST_DATABASE_URL`.

## Confirmación y escritura

Después de un preflight real, `--execute` exige la frase exacta:

```text
ADOPT <ID_REDACTADO> <CÓDIGO_8_HEX> AS PRIVATE BETA ADMIN
```

No acepta `y`, `yes`, Enter ni flags de confirmación. Dentro de una transacción
serializable se toma advisory lock, se relee y bloquea la fila, se repiten todos
los guards y se ejecuta un `UPDATE` parametrizado que modifica exclusivamente:

- `role`: `USER` → `ADMIN`;
- `status`: `PENDING_VERIFICATION` → `ACTIVE`;
- `privateBetaActivatedAt`: `NULL` → timestamp único.

El SQL explícito evita el cambio implícito de `updatedAt` de Prisma. Se comparan
después email, nombre, password hash, `emailVerifiedAt`, `passwordChangedAt` y
`updatedAt`. No se crean sesiones, tokens o invitaciones y no se toca ninguna
tabla financiera.

## Auditoría e idempotencia

La misma transacción crea un `AuthEvent`. Para no introducir una séptima
migración, el enum físico compatible es
`PRIVATE_BETA_ADMIN_BOOTSTRAPPED`, mientras `context` JSON identifica de forma
inequívoca `event=PRIVATE_BETA_ADMIN_ADOPTED` y guarda solo actor, target
redactado, timestamp, entorno, versión, commit, before/after, motivo y resultado.
No contiene email, URL, credenciales, token ni datos financieros.

Si falla el evento, todo el `UPDATE` revierte. Una segunda corrida devuelve
`ALREADY_ADOPTED`, conserva el timestamp y no duplica eventos.

## Dry-run

`--dry-run` abre `SERIALIZABLE READ ONLY`, fija timeouts, ejecuta las mismas
lecturas/validaciones y termina con `ROLLBACK`. Dos corridas consecutivas deben
conservar el checksum completo. La salida muestra solo ID, email y base
redactados y enumera los tres campos que cambiarían.

## Rehearsal PostgreSQL 18

Recurso: base `doleth_admin_adoption_rehearsal` dentro del proyecto Neon
temporal de Preview; no comparte proyecto, branch ni host con Production.
Resultado del primer rehearsal:

| Control | Resultado |
|---|---|
| Migraciones | 6/6, 0 fallidas |
| Fixture | 1 usuario pending/USER, 1/13/1/1, 0 admin/invite/token/session |
| Dry-runs | 2; checksum completo idéntico |
| Fallo antes de auditoría | rollback total |
| Fallo después del update | rollback total |
| Adopción | `ADOPTED` |
| Reintentos | 2 × `ALREADY_ADOPTED`; timestamp/checksum estables |
| Auditoría | 1 evento lógico `PRIVATE_BETA_ADMIN_ADOPTED` |
| Email | `emailVerifiedAt=NULL` |
| Finanzas | conteos idénticos; balances `MATCH` |

El recurso temporal se conserva hasta aprobación o rechazo.

## Validación local del corte

- `pnpm admin:adoption:test`: 2/2 archivos, 34/34 tests;
- suite estricta con `DOLETH_REQUIRE_DB=1`: 55/55 archivos, 843/843
  tests, cero skips;
- `pnpm test:isolation` explícito: 5/5 archivos, 52/52 tests, cero skips;
- lint, TypeScript y build productivo de Next.js: `PASS`;
- auditoría read-only de migraciones sobre rehearsal: exit 0; 6/6 ya
  demostradas por el rehearsal.

El build local requirió restaurar dos marcadores vacíos omitidos por la
extracción de pnpm en Windows dentro de `node_modules`; no produjo cambios
versionados y el build completo terminó verde.

## Matriz abortiva

| Caso | Código/resultado | Writes |
|---|---|---:|
| Base vacía | `EMPTY_DATABASE` | 0 |
| Usuario/ID/email inexistente | `USER_NOT_FOUND_*` | 0 |
| ID y email distintos | `ID_EMAIL_MISMATCH` | 0 |
| Candidato ambiguo/usuario extra | `AMBIGUOUS_CANDIDATE` / `UNEXPECTED_USER_COUNT` | 0 |
| Otro admin activo | `ACTIVE_ADMIN_EXISTS` | 0 |
| Ya adoptado | `ALREADY_ADOPTED` | 0 |
| Suspendido/parcial | `INCOMPATIBLE_USER_STATE` | 0 |
| Ownership o conteos inesperados | `HISTORICAL_DATA_MISMATCH` | 0 |
| Owner nulo/huérfano/cross-owner | códigos específicos | 0 |
| Entorno desconocido | `UNKNOWN_ENVIRONMENT` | 0 |
| Production sin flag | `PRODUCTION_FLAG_REQUIRED` | 0 |
| Confirmación incorrecta | `CONFIRMATION_MISMATCH` | 0 |
| Auditoría o mitad de transacción | rollback verificado | 0 persistentes |
| Dry-run | transacción read-only + checksum | 0 |
| Terminal no interactiva | `INTERACTIVE_TERMINAL_REQUIRED` | 0 |
| Colisión Test/Production | `TEST_DATABASE_COLLISION` | 0 |

## Procedimiento productivo futuro

1. Obtener autorización explícita separada.
2. Confirmar alias/deployment, snapshot y branch de recuperación.
3. Ejecutar primero `--dry-run` con identidad productiva exacta.
4. Revisar resumen redactado y abortar ante cualquier desviación.
5. Obtener autorización para `--execute` y escribir la frase fuerte en TTY.
6. Ejecutar postflight read-only y confirmar un evento, timestamp, email no
   verificado, cero artefactos auth y finanzas idénticas.
7. Solo después considerar el redeploy del SHA aprobado.

Rollback: un fallo antes del commit revierte solo. Después del commit, no editar
manualmente Production; detener el release, conservar evidencia y aprobar un
forward-fix transaccional específico antes de cualquier cambio de rol/estado.
