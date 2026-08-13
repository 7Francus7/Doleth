# Doleth V2 — Baseline real

Fecha: 13 de agosto de 2026  
Estado: bloqueado antes de Corte 1

## Inspección local definitiva

El 13 de agosto de 2026 se inspeccionó la máquina Windows sin instalar ni modificar software global:

- Docker Engine: no disponible;
- Docker Compose: no disponible;
- Docker Desktop: no instalado;
- PostgreSQL local: no instalado ni registrado como servicio;
- `psql`, `pg_isready`, `postgres`, `initdb` y `createdb`: no disponibles;
- WSL 2: disponible, versión 2.4.13, backend predeterminado 2;
- PGlite: aparece como dependencia transitiva e historial de ensayos, pero no es el PostgreSQL local requerido para este baseline y no se adoptó como harness nuevo.

`TEST_DATABASE_URL` fue neutralizada en `.env.local`: queda vacía y ya no apunta a `neondb`. `DATABASE_URL` no fue modificada.

## Aislamiento de base

- `DATABASE_URL` original no se migró, limpió ni usó para pruebas.
- Se creó una base separada `doleth_test` dentro del mismo proyecto Neon.
- Se aplicaron las 11 migraciones de `prisma/migrations` a `doleth_test` mediante el endpoint directo de Neon.
- El esquema productivo `neondb` permaneció intacto.
- Las pruebas se ejecutaron con `DOLETH_REQUIRE_DB=1` y `TEST_DATABASE_URL` apuntando exclusivamente a `doleth_test`.

## Resultados

| Chequeo | Resultado | Evidencia |
|---|---|---|
| Migraciones | Pasa | 11/11 aplicadas a `doleth_test` |
| Tests completos | Falla | 77 suites intentadas; 7 suites fallidas; 2 tests con aserción/timeout y 13 fallos de hooks/fixtures derivados; duración 965,3 s |
| Lint | Pasa | 20,6 s |
| Typecheck | Pasa | Prisma generate + `tsc --noEmit`; 15,7 s |
| Build Next | Pasa | Next.js 16.2.9; 32,7 s |
| Build Storybook | Pasa con warnings | Storybook 10.4.6; 13,5 s |

## Clasificación de fallos

### Infraestructura de pruebas: bloqueante

Neon mostró latencia extrema y cortes `ETIMEDOUT` durante operaciones Prisma simples. Una ejecución aislada de `ledger-integrity.test.ts` tardó 64,4 s para 10 tests: 9 pasaron y 1 falló por `ETIMEDOUT` al ejecutar `transaction.findMany`.

La corrida completa tardó 965,3 s y registró timeouts al crear usuarios/cuentas en:

- `src/app/actions/finance.authorization.test.ts`;
- `src/lib/finance/creditCards.test.ts`;
- `src/lib/finance/isolation.test.ts`;
- `src/lib/finance/ledger-integrity.test.ts`;
- `src/lib/finance/multicurrency.test.ts`;
- `src/lib/finance/rates/store.test.ts`.

Los `Cannot read properties of undefined (reading 'id')` en `afterAll` son fallos secundarios: el fixture no llegó a crearse por el timeout anterior.

### Auth: requiere reproducción estable

`src/app/auth/actions.test.ts` reportó:

- timeout de 30 s en rate limiting de registro;
- verificación esperaba `ACTIVE` y leyó `PENDING_VERIFICATION`;
- timeout de 120 s durante cleanup.

No se clasifica aún como bug de aplicación. La misma corrida registró timeouts y fallos de auditoría Prisma; hay que reproducir estos dos casos contra PostgreSQL estable antes de modificar auth.

### Storybook: deuda previa no bloqueante

Build exitoso, con warnings por:

- módulos Node/Prisma externalizados para navegador;
- chunks mayores a 500 kB;
- imports dinámicos que también son estáticos.

No se corrigieron porque son previos y ajenos al Corte 1.

## Decisión

No se inicia Corte 1. La aprobación exige baseline verde antes de implementar shell e Inicio V2. Alterar timeouts para forzar verde ocultaría una base remota inadecuada para esta suite serial.

Siguiente paso seguro:

1. instalar Docker Desktop oficial para Windows con backend WSL 2;
2. verificar `docker version` y `docker compose version`;
3. recién entonces agregar y validar un Compose exclusivo de tests;
4. levantar PostgreSQL 17 en un puerto local libre, con usuario y base `doleth_test` exclusivos;
5. configurar `TEST_DATABASE_URL` local en `.env.local`, nunca en archivos versionados;
6. demostrar `host = localhost` y `database = doleth_test` antes de migrar;
7. aplicar 11 migraciones y ejecutar los cuatro smoke tests;
8. repetir 77 suites con `DOLETH_REQUIRE_DB=1`;
9. reproducir aisladamente los dos casos auth solo si persisten sin `ETIMEDOUT`;
10. comenzar Corte 1 únicamente después de una aprobación posterior al baseline verde.

## Veredicto

`V2_CUT_1_BLOCKED`
