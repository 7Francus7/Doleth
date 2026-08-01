# Checklist de Doleth

## Resultado del intento productivo — 2026-07-31

- [x] Snapshot manual y branch de recuperación creados y verificados.
- [x] Validación local: 808/808; aislamiento: 52/52; migraciones: 6/6.
- [x] PR `#8` integrado; árbol resultante equivalente al SHA aprobado.
- [x] Dos migraciones productivas aplicadas mediante `prisma migrate deploy`.
- [x] Postflight: 5 claves y 8 FKs compuestas, cero cruces, saldos `MATCH`.
- [x] Deployment `8f2746a…` construido y servido como `READY`.
- [ ] Administrador activo disponible: bloqueado por usuario histórico
  `USER / PENDING_VERIFICATION`.
- [ ] Smoke A/B productivo: no iniciado.
- [ ] Invitaciones reales: no creadas.
- [x] Rollback de Vercel al deployment anterior `a3c4a54…`.
- [x] Verificación final: cero 5xx, cero datos de smoke, integridad intacta.

Estado: `ROLLED_BACK`. No reintentar hasta implementar y aprobar un flujo
auditado de adopción del administrador histórico.

Fecha: 2026-07-30

Alcance aprobado: beta privada; Production todavía no autorizada.

## Git y código

- [x] Rama `codex/production-readiness-audit`.
- [x] PR draft `#8`.
- [x] Auto-merge desactivado.
- [x] Commit funcional Preview:
  `f3a7559931a108cb26c041d9d53f1bfbeae3d6c7`.
- [x] Sin secretos ni archivos `.env` versionados.
- [x] Scan de secretos limpio.
- [ ] Merge a `main`: prohibido hasta aprobación.

## QA obligatorio

- [x] `pnpm install --frozen-lockfile`.
- [x] `pnpm exec prisma validate`.
- [x] `pnpm exec prisma generate`.
- [x] `pnpm lint`.
- [x] `pnpm typecheck`.
- [x] `DOLETH_REQUIRE_DB=1 pnpm test`: 808/808.
- [x] `DOLETH_REQUIRE_DB=1 pnpm test:isolation`: 52/52.
- [x] `pnpm db:audit-migrations`: 6/6.
- [x] `pnpm build`.
- [x] `git diff --check`.
- [x] Tests DB sin omisiones.
- [ ] GitHub Actions: bloqueo externo de billing; jobs con 0 pasos.

## Acceso privado

- [x] Registro público oculto.
- [x] Registro público rechazado en servidor.
- [x] Invitación aleatoria y hash-only.
- [x] Email vinculado.
- [x] Vencimiento.
- [x] Consumo atómico de un solo uso.
- [x] Token manipulado rechazado.
- [x] Token reutilizado rechazado.
- [x] Token expirado rechazado en suite estricta.
- [x] Fragmento retirado de la URL.
- [x] Logs y documentación sin tokens.
- [x] Sin endpoint administrativo público.
- [x] Sin contraseña global.

## Recuperación administrativa

- [x] Solo administrador activo.
- [x] Token hash-only de 30 minutos.
- [x] Tokens anteriores invalidados.
- [x] Sesiones revocadas al emitir.
- [x] Sesiones revocadas al completar.
- [x] Contraseña anterior rechazada.
- [x] Contraseña nueva aceptada.
- [x] Segundo uso rechazado.
- [x] Auditoría sin token.

## Preview y base

- [x] Proyecto Neon temporal independiente.
- [x] Base de aplicación separada de tests.
- [x] Preview usa exclusivamente `neondb` temporal.
- [x] Tests usan exclusivamente `doleth_preview_tests`.
- [x] Seis migraciones aplicadas en ambas.
- [x] Checksums 6/6.
- [x] `DATABASE_URL Preview != Production`.
- [x] `DOLETH_SESSION_SECRET Preview != Production`.
- [x] `DOLETH_APP_URL` de Preview separado.
- [x] `DOLETH_ACCESS_MODE=private-beta` branch-only.
- [x] Deployment Preview `READY`.
- [x] Runtime 0 5xx y 0 errores/fatal.
- [x] Neon temporal conservado.

## Smoke A

- [x] Invitación.
- [x] Alta y login.
- [x] Onboarding.
- [x] Cuenta inicial.
- [x] Categorías aisladas provisionadas.
- [ ] Creación de categoría personalizada: no existe UI.
- [x] Ingreso.
- [x] Gasto.
- [x] Segunda cuenta.
- [x] Transferencia.
- [x] Corrección auditable.
- [x] Anulación.
- [x] Próximo pago.
- [x] Inversión.
- [x] Ahora, Próximo, Cambios, Progreso y Mi realidad.
- [x] Historial.
- [x] Logout, reingreso y persistencia.

## Smoke B y ownership

- [x] Invitación distinta.
- [x] Alta y onboarding.
- [x] No ve datos de A.
- [x] Lectura de IDs A rechazada.
- [x] Edición de ID A rechazada.
- [x] Corrección/anulación cross-owner rechazadas por tests estrictos.
- [x] B crea datos propios.
- [x] A no ve datos de B.

## UX y observabilidad

- [x] 320 px.
- [x] 390 px.
- [x] 1440 px.
- [x] Sin overflow horizontal en tres rutas críticas.
- [x] Consola sin errores.
- [x] Capturas visualmente revisadas contra `DESIGN.md`.
- [x] 500 registros runtime sin 5xx/error/fatal.
- [x] Logs sin secretos, tokens ni correos de smoke.

## Correo público

- [ ] Dominio propio.
- [ ] Resend verificado.
- [ ] SPF.
- [ ] DKIM.
- [ ] Remitente permitido.
- [ ] Entrega real.
- [ ] Verificación por email.
- [ ] Recuperación por email.
- [ ] Cambio de email.
- [ ] Smoke de correo A/B.

Estas casillas no bloquean la beta privada; bloquean el lanzamiento público.

## Production: gate posterior

- [ ] Aprobación explícita del owner.
- [ ] Punto de recuperación reciente en Neon.
- [ ] Preflight read-only repetido.
- [ ] Aplicar migraciones pendientes de forma controlada.
- [ ] Post-checks de ownership, ledger y checksums.
- [ ] Merge manual del PR.
- [ ] Deployment exacto del SHA aprobado.
- [ ] Registro público sigue deshabilitado.

Estado actual: no merge, no migraciones Production, no deployment Production.

## Gate de adopción histórica

- [x] CLI dedicado; no usa `DATABASE_URL`.
- [x] Host/proyecto/branch y entorno fallan cerrado.
- [x] Production exige flag adicional.
- [x] ID y email exactos se introducen en TTY.
- [x] Frase fuerte; no acepta confirmación silenciosa.
- [x] Dry-run `READ ONLY` y checksum estable.
- [x] Solo `role`, `status` y `privateBetaActivatedAt`.
- [x] `emailVerifiedAt`, identidad, password y `updatedAt` preservados.
- [x] Auditoría atómica e idempotencia.
- [x] Rehearsal PostgreSQL 18, 6/6.
- [x] Suite estricta 843/843 sin skips; aislamiento explícito 52/52.
- [x] Lint, TypeScript y build productivo local.
- [ ] Preview nueva del SHA final.
- [ ] Adopción sintética, login admin y smoke A/B repetidos.
- [ ] Revisión humana del PR draft.
- [ ] Autorización separada para dry-run Production.

Las últimas cuatro casillas mantienen bloqueado cualquier deploy productivo.
