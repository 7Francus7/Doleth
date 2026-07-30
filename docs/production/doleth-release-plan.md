# Plan de release de Doleth

Estado: `BLOCKED` hasta cerrar los gates 1 a 5.
Base: `codex/production-readiness-audit` (`055e3443956079de72e7200a83174a378bfda05f` durante el preflight Neon).

## Principios

- No escribir en producción antes de un preflight read-only y backup/PITR confirmado.
- No usar `prisma db push` ni `prisma migrate reset`.
- No desplegar producción desde un working tree o SHA no auditado.
- Separar base de test, preview y producción.
- Aplicar migraciones con `prisma migrate deploy`; nunca desde el build de cada función.
- Mantener la producción actual disponible durante el rehearsal.

## Gate 1 — Cerrar el candidato

Responsable: Ingeniería.

1. Revisar los cambios de auditoría.
2. Ejecutar `pnpm install --frozen-lockfile`.
3. Ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`.
4. Confirmar `git diff --check`.
5. Confirmar que no hay secretos ni archivos de evidencia en el commit.

Salida: commit inmutable aprobado.

## Gate 2 — Rehearsal de base

Responsable: Ingeniería/DBA.

1. Crear una rama/base PostgreSQL temporal, sin datos productivos salvo copia autorizada y sanitizada.
2. Configurar `DATABASE_URL` y `TEST_DATABASE_URL` solamente en el proceso.
3. Ejecutar desde base vacía:

```bash
pnpm exec prisma migrate deploy
pnpm db:audit-migrations
DOLETH_REQUIRE_DB=1 pnpm test
DOLETH_REQUIRE_DB=1 pnpm test:isolation
```

4. Probar también el recorrido legacy:
   - aplicar migraciones hasta la expansión multiusuario;
   - ejecutar preflight;
   - hacer `backfill:owner --dry-run` y comprobar cero escrituras;
   - ejecutar backfill con un owner controlado;
   - aplicar contrato de ownership y FKs compuestas;
   - repetir auditoría y checksums.
5. Descartar la base temporal.

Salida: transcript sin secretos, todas las pruebas verdes.

Estado: `VERIFIED` el 2026-07-29 con PostgreSQL 16.14 descartable, 787/787 tests y 52/52 tests estrictos.

## Gate 3 — Preparación externa

Responsables: owner de infraestructura y owner del producto.

- Neon: proyecto/rama correctos, pooling para runtime, conexión apropiada para migraciones, backup/PITR y límites confirmados.
- Resend: dominio verificado, SPF, DKIM, remitente permitido y entrega real.
- Vercel: variables separadas por Production/Preview, dominio, SHA y protección de preview.
- Vercel CLI no está instalada en este entorno. La inspección previa usó acceso read-only de plataforma; no intentar convertir `DATABASE_URL` `sensitive` en una variable legible.

Salida: checklist de infraestructura firmado, sin valores sensibles.

Estado Neon: `NEON_PREFLIGHT_VERIFIED_WITH_CONCERNS`. Datos, ownership, ledger, checksums y PITR fueron verificados read-only. La migración de FKs compuestas está pendiente, no hay snapshots programados y pooling/TLS runtime siguen inconclusos porque no se leyó `DATABASE_URL`.

## Gate 4 — Preflight productivo

Responsable: Release Manager/DBA.

1. Congelar escrituras de la versión anterior si el backfill lo requiere.
2. Confirmar punto de restauración reciente.
3. Consultar migraciones pendientes.
4. Ejecutar `pnpm db:preflight:neon-readonly`, revisado para abortar si la transacción no es read-only.
5. Registrar conteos por tabla, filas sin owner, owner histórico y checksums.
6. Si existe cualquier ambigüedad de ownership, cancelar.

Salida: decisión Go/No-Go explícita.

## Gate 5 — Preview final

Responsable: QA/Product.

1. Publicar la rama aprobada y abrir PR a `main`.
2. Desplegar preview protegida conectada a base de prueba, no producción.
3. Ejecutar el smoke de 28 pasos del checklist.
4. Confirmar email, A/B, mobile 320/390, desktop, consola y logs.
5. Revisar el PR; no fusionar automáticamente.

Salida: evidencia funcional y aprobación.

## Release productivo — requiere autorización posterior

1. Anunciar ventana y responsables.
2. Aplicar expansión si todavía no está aplicada.
3. Ejecutar backfill únicamente con evidencia y owner confirmado.
4. Resolver cualquier migración de contrato fallida de forma documentada y volver a ejecutar `prisma migrate deploy`.
5. Aplicar FKs compuestas.
6. Ejecutar post-checks read-only.
7. Fusionar el PR aprobado.
8. Desplegar exactamente el SHA aprobado.
9. Ejecutar smoke reducido sin operaciones destructivas.
10. Observar logs, autenticación y errores de base.

## Estrategia Git

El candidato contiene a `main`; no requiere merge inverso. El camino seguro es un PR desde la rama auditada hacia `main`, mostrando los 33 commits y las correcciones de auditoría. Si `main` avanza antes del release, integrar esos cambios en la rama candidata y repetir todos los gates.
