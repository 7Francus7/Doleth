# Auditoría de preparación de Doleth

Fecha: 2026-07-30

Rama: `codex/production-readiness-audit`

PR: `#8`, draft, sin auto-merge

## Veredicto del alcance actual

`PRIVATE_BETA_READY_WITH_CONCERNS`

La Preview privada funciona con invitaciones de un solo uso, recuperación
administrativa, dos usuarios aislados y las funciones financieras del release.
Esto no equivale a aprobación de Production ni de lanzamiento público.

## Estado por área

| Área | Estado | Evidencia |
|---|---|---|
| Acceso privado | `VERIFIED` | Invitaciones hash-only, email-bound, expiración, consumo atómico |
| Registro público | `DISABLED` | Bloqueo server-side y UI honesta |
| Recuperación | `VERIFIED` | 30 min, un uso, sesiones revocadas, contraseña anterior rechazada |
| Aislamiento | `VERIFIED` | UI A/B, acceso por ID y 52/52 tests estrictos |
| Integridad financiera | `VERIFIED` | Ingreso, gasto, transferencia, corrección, anulación, pago e inversión |
| Preview | `READY` | SHA funcional `f3a7559931a108cb26c041d9d53f1bfbeae3d6c7` |
| Neon temporal | `VERIFIED` | Dos bases separadas; seis migraciones y checksums 6/6 |
| QA | `VERIFIED` | 808/808 tests con DB; build, lint y tipos verdes |
| Runtime | `VERIFIED` | 500 registros; 0 5xx; 0 error/fatal; 0 secretos |
| Responsive | `VERIFIED` | 320, 390 y 1440 px sin overflow |
| Correo | `DEFERRED` | No hay entrega real; Resend no está resuelto |
| GitHub Actions | `BLOCKED_EXTERNAL` | Jobs con 0 pasos por cuenta bloqueada por billing |
| Production | `UNTOUCHED` | 0 escrituras, 0 migraciones, 0 deploys |

## QA exacto

- `pnpm install --frozen-lockfile`: sin cambios;
- `pnpm exec prisma validate`: válido;
- `pnpm exec prisma generate`: válido;
- `pnpm lint`: verde;
- `pnpm typecheck`: verde;
- `pnpm test` con `DOLETH_REQUIRE_DB=1`: 53 archivos, 808 tests;
- `pnpm test:isolation` con `DOLETH_REQUIRE_DB=1`: 5 archivos, 52 tests;
- `pnpm db:audit-migrations`: 6/6 consistente;
- `pnpm build`: verde;
- `git diff --check`: verde;
- scan de 27 archivos de código: 0 literales con forma de credencial;
- build/runtime Vercel: 0 patrones de credenciales.

El warning de `pg` sobre el cambio futuro de semántica de `sslmode=require`
permanece como deuda; la conexión actual se comporta como `verify-full`.

## Seguridad del acceso

- no hay contraseña global;
- no hay endpoint administrativo web;
- las escrituras del operador exigen cuatro barreras explícitas;
- el hostname de la base debe coincidir exactamente con el esperado;
- los tokens no se guardan en claro;
- los fragmentos se eliminan antes del submit;
- eventos de auditoría guardan IDs/contexto, nunca tokens;
- la activación beta no falsifica `emailVerifiedAt`.

## Hallazgos del smoke

Tres defectos se detectaron y corrigieron antes del veredicto:

1. contexto `server-only` del CLI;
2. retorno `void` del advisory lock de bootstrap;
3. redirect posterior a una corrección auditable.

Los tres fueron repetidos con resultado verde.

## Concerns aceptados para beta privada

- correo transaccional inexistente por decisión explícita;
- CRUD de categorías personalizadas ausente; onboarding crea categorías
  aisladas por usuario;
- CI remoto bloqueado por billing, compensado por QA local completo;
- rate limiter de ventana fija;
- CSP con `unsafe-inline`;
- warning TLS futuro de `pg`;
- sin reconciliación financiera operativa continua.

## Bloqueantes para lanzamiento público

1. dominio propio;
2. Resend verificado;
3. SPF y DKIM;
4. entrega real a dos buzones controlados;
5. verificación y recuperación por email;
6. smoke de correo;
7. revisión de categoría custom si se declara parte del producto público.

## Production

- SHA actual: `a3c4a54fb20c20749222f9eaf02b23db4444a62f`;
- la migración de ownership compuesto sigue pendiente;
- la migración de acceso privado también queda pendiente después de este PR;
- no se creó todavía el punto de recuperación requerido;
- no se hizo merge ni deployment.

El release productivo privado requiere aprobación posterior, un punto de
recuperación Neon reciente y `DOLETH_ACCESS_MODE=private-beta`.
