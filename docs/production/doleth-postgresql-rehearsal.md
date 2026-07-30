# Rehearsal PostgreSQL de Doleth

Fecha local: 2026-07-29 23:23 ART

Fecha UTC: 2026-07-30 02:23 UTC

HEAD inicial: `ebf3206c232839ad9f2dbc5f525d5e4d7f8b193c`

Rama: `codex/production-readiness-audit`

## Veredicto

`POSTGRESQL_REHEARSAL_VERIFIED`

Migraciones desde cero, secuencia legacy, backfill, constraints cross-owner y atomicidad financiera pasaron contra PostgreSQL real. Cero tests DB omitidos. Producción no fue consultada ni modificada.

## Entorno y separación

| Propiedad | Evidencia |
|---|---|
| Proveedor | PostgreSQL 16.14, binario Windows x86-64 publicado por EDB y enlazado desde postgresql.org |
| Ejecución | Clúster local efímero bajo `%TEMP%` |
| Red | Solo `127.0.0.1` |
| Puerto | `55439`, libre antes de iniciar |
| Usuario | Usuario sintético de rehearsal, autenticación trust limitada a loopback |
| SSL | No aplica: conexión local loopback |
| Base principal | `doleth_rehearsal_test` |
| Base final de tests | `doleth_rehearsal_clean_test` |
| Base legacy válida | `doleth_legacy_valid_rehearsal_test` |
| Base legacy inválida | `doleth_legacy_cross_rehearsal_test` |
| Estado inicial | Cero tablas de usuario antes de migrar |
| Producción | Sin variables, host, credenciales ni conexión productiva |

`TEST_DATABASE_URL` se definió solo por proceso. Nunca coincidió con `DATABASE_URL` productiva; ninguna estaba disponible localmente.

## Guard de seguridad

`resolveTestDatabaseUrl` ahora rechaza:

- ausencia de `TEST_DATABASE_URL` con `DOLETH_REQUIRE_DB=1`;
- coincidencia de host, puerto y base con `DATABASE_URL`;
- bases sin marca `test`, `ci`, `pruebas`, `rehearsal` o temporal;
- nombres conocidos como `postgres`, `neondb` o `doleth`;
- nombres, hosts o parámetros `branch/environment/env/endpoint` marcados `prod`, `production`, `live` o `main`;
- protocolos distintos de PostgreSQL.

Límite explícito: un proveedor puede usar nombres opacos sin indicar “production”. Por eso el guard complementa, no reemplaza, revisar proyecto/rama y comparar contra la URL productiva.

Resultado: 24/24 tests puros del guard pasaron.

## Migración desde cero

Base vacía verificada con cero tablas. Comandos:

```text
pnpm exec prisma validate
pnpm exec prisma generate
pnpm db:migrate
pnpm db:audit-migrations
```

Migraciones aplicadas, en orden:

1. `202607210001_vertical_007`
2. `202607220001_investments`
3. `202607270001_multiuser_identity`
4. `202607280001_require_financial_ownership`
5. `202607290001_enforce_cross_owner_relations`

Segundo `prisma migrate deploy`: cero migraciones pendientes.

Verificado en catálogo PostgreSQL:

- seis columnas financieras `userId` con `NOT NULL`;
- cinco unique indexes compuestos de ownership;
- 17 índices que incluyen `userId`;
- FKs compuestas para cuentas, categorías, ledger, corrección y próximos pagos;
- `ON UPDATE CASCADE`;
- `ON DELETE RESTRICT` para evidencia financiera;
- cascada solo en sesiones/tokens de identidad y `SET NULL` en eventos de auth.

## Aislamiento A/B

| Intento | Capa | Error esperado | Resultado |
|---|---|---|---|
| Transacción A con cuenta B | FK compuesta | Prisma `P2003` | Rechazado |
| Transacción A con categoría B | FK compuesta | Prisma `P2003` | Rechazado |
| Ledger A con cuenta B | FK compuesta | Prisma `P2003` | Rechazado |
| Próximo pago A con cuenta B | FK compuesta | Prisma `P2003` | Rechazado |
| Update de transacción A hacia cuenta B | FK compuesta | Prisma `P2003` | Rechazado y relación original intacta |
| Lectura de movimiento B como A | Servicio con `userId` | `null` | Rechazado |
| Mutaciones por ID ajeno | Servicio/action con sesión | Error seguro/no cambio | Rechazado |

Suite estricta: 52/52 tests de aislamiento e integridad.

## Rehearsal legacy válido

Estado inicial: solo las tres migraciones hasta fase expand.

Fixture:

- un owner histórico;
- una cuenta con saldo inicial `100000`;
- una categoría;
- un gasto de `12345`;
- un asiento de `-12345`;
- una inversión `50000 → 55000`;
- un próximo pago de `25000`;
- seis filas financieras con owner nulo.

Secuencia:

1. preflight read-only;
2. dos dry-runs;
3. backfill real;
4. migración contract;
5. constraints compuestas;
6. auditoría posterior.

Resultado:

- seis filas reclamadas;
- cero huérfanas;
- una fila `OwnerBackfillRun`;
- dry-run dejó cero filas de auditoría y cero cambios de timestamps;
- movimientos: `1 → 1`;
- asientos: `1 → 1`;
- saldo reconstruido: `87655 → 87655`;
- checksums funcionales antes/después: iguales;
- timestamps financieros: iguales;
- cinco migraciones aplicadas exactamente una vez.

## Legacy cross-owner

Base separada en estado expand con dos usuarios y cruces intencionales.

Preflight detectó y abortó antes del contract:

- 1 transacción ↔ cuenta origen;
- 1 asiento ↔ cuenta;
- 1 próximo pago ↔ cuenta.

No se ejecutó backfill ni contract sobre ese escenario inválido.

## Integridad financiera

PostgreSQL ejecutó:

- ingreso y gasto con centavos exactos;
- transferencia con patrimonio total constante;
- corrección trazable;
- anulación con original conservado;
- próximo pago convertido una sola vez;
- reconstrucción de saldos desde saldo inicial más ledger vivo;
- exclusión de anulados;
- aislamiento del vecino.

Fallos inducidos:

- transferencia: segundo asiento viola FK; movimiento y primer asiento quedaron en cero;
- corrección: asiento viola FK; original siguió vigente, reemplazo y asiento quedaron en cero.

No se cambió el modelo de saldo inicial.

## QA

| Comando | Resultado |
|---|---|
| `pnpm exec prisma validate` | Pasó |
| `pnpm exec prisma generate` | Pasó |
| `pnpm lint` | Pasó |
| `pnpm typecheck` | Pasó |
| `pnpm test` con PostgreSQL | 49 archivos, 787 tests pasados, 0 omitidos |
| `DOLETH_REQUIRE_DB=1 pnpm test` | 49 archivos, 787 tests pasados, 0 omitidos |
| `DOLETH_REQUIRE_DB=1 pnpm test:isolation` | 5 archivos, 52 tests pasados |
| `pnpm db:audit-migrations` | 5/5 consistentes |
| `pnpm build` | Pasó |
| `git diff --check` | Pasó |

Fallos encontrados y corregidos durante rehearsal:

1. nested writes Prisma repetían `userId` en ledger después de la relación compuesta;
2. un test CSV exigía una marca inexistente en el dataset de cuentas;
3. faltaban fallos inducidos de transferencia/corrección;
4. guard de URL aceptaba nombres locales ambiguos.

## Limpieza

Al cerrar el rehearsal:

- se detuvo el servidor local;
- el directorio temporal del clúster se movió a la Papelera de reciclaje y ya no existe en `%TEMP%`;
- no quedaron credenciales ni URLs en archivos versionados;
- `.env.local` sigue ignorado y no fue creado;
- evidencia resumida quedó en este documento, sin datos sensibles.

La limpieza es recuperable desde la Papelera hasta que el sistema la vacíe; no quedó ningún servidor PostgreSQL activo.

## Riesgos pendientes

- El rehearsal usa PostgreSQL local, no latencia/pooling/TLS de Neon.
- No demuestra estado actual, backup ni PITR de Neon Production.
- El flujo productivo expand/backfill/contract requiere ventana y comandos separados.
- El guard no puede reconocer una producción remota con nombres totalmente opacos si no se proporciona `DATABASE_URL` para comparar.
