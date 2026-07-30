# Checklist de producción de Doleth

Marcar cada casilla con evidencia. Una casilla sin verificar mantiene el release en `BLOCKED`.

## Código y Git

- [x] SHA de Preview registrado desde metadata de Vercel y comparado con el HEAD del PR.
- [ ] Rama basada en `integration/identity-over-corte-7`.
- [x] `main` y `origin/main` refrescados antes del PR.
- [x] Working tree limpio antes del push.
- [x] Sin secretos, `.env` ni JSON productivos en el commit.
- [ ] PR revisado; merge automático desactivado.

## Validaciones automáticas

- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm exec prisma validate`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test` — 787/787 con PostgreSQL
- [x] `pnpm build`
- [x] `git diff --check`
- [x] `DOLETH_REQUIRE_DB=1 pnpm test` — cero omitidos
- [x] `DOLETH_REQUIRE_DB=1 pnpm test:isolation` — 52/52
- [x] `pnpm db:audit-migrations`
- [x] Migraciones desde base PostgreSQL vacía.
- [x] Rehearsal expand/backfill/contract con dataset legacy.
- [x] Rollback transaccional por fallos inducidos.
- [x] Tooling productivo revisado; script histórico inseguro no ejecutado.
- [x] Preflight Neon protegido por transacción read-only y test unitario.

## Base de datos y ownership

- [x] Proyecto, rama y base productiva identificados.
- [x] Backup/PITR comprobado con timestamp y retención: ventana de 1 día; snapshots no configurados.
- [x] Conexión runtime pooled de Preview configurada contra Neon temporal.
- [x] Conexión directa de migraciones de Preview validada sin agregar `DIRECT_URL` a Vercel.
- [x] Migraciones pendientes enumeradas: solo `202607290001_enforce_cross_owner_relations`.
- [x] Conteos por tabla capturados.
- [x] Filas financieras con `userId IS NULL`: cero antes del contrato.
- [ ] Owner del histórico confirmado por el usuario.
- [x] Checksums 5/5 preservados en la base temporal de Preview.
- [x] Cero referencias cruzadas en escenario válido; escenario inválido abortado.
- [x] Todas las tablas financieras tienen `userId NOT NULL` en esquema final.
- [x] Índices por `userId` presentes en el esquema final/rehearsal.
- [x] FKs compuestas de ownership aplicadas y probadas en rehearsal.
- [ ] Las 5 claves compuestas y 8 FKs compuestas están aplicadas en producción.
- [x] En este corte no se usó `db push`, `migrate reset`, migrate deploy, seed ni backfill.

## Variables e infraestructura

- [x] `DATABASE_URL` de Preview apunta al proyecto Neon temporal.
- [x] `DOLETH_SESSION_SECRET` de Preview generado nuevamente y con scope separado.
- [x] `DOLETH_APP_URL` de la rama Preview es HTTPS y coincide con su alias estable.
- [ ] `RESEND_API_KEY`
- [ ] `DOLETH_EMAIL_FROM`
- [ ] `DOLETH_EMAIL_TRANSPORT=resend`
- [ ] `DOLETH_ACCESS_PASSWORD` removida del candidato multiusuario.
- [x] Variables críticas de Preview separadas de Production con overrides de rama.
- [x] `TEST_DATABASE_URL` usó otra base del proyecto temporal y nunca Production.
- [ ] Dominio Vercel correcto.
- [x] Preview protegida.
- [x] Deployment `READY` muestra el SHA aprobado.
- [ ] Warning TLS de `pg` resuelto con Neon.

Evidencia 2026-07-30:

- [x] Proyecto Vercel coincidente y deployment Production `READY`.
- [x] SHA productivo actual: `a3c4a54fb20c20749222f9eaf02b23db4444a62f`.
- [x] `DATABASE_URL` existe por nombre en Production.
- [ ] Valor de `DATABASE_URL` accesible al preflight: bloqueado por tipo `sensitive`.
- [x] Sesión Neon autenticada sin revelar credenciales.
- [x] Backup/PITR visible y fechado: punto más antiguo 2026-07-29 03:33 UTC.
- [ ] Snapshot pre-release o rama de recuperación reciente creada con aprobación separada.

## Email

- [ ] Dominio remitente verificado.
- [ ] SPF válido.
- [ ] DKIM válido.
- [ ] From permitido.
- [ ] Registro entrega email real.
- [ ] Recuperación entrega email real.
- [ ] Cambio de email entrega avisos esperados.
- [ ] Links usan la URL absoluta correcta.
- [ ] Token usado no se reutiliza.
- [ ] Token expirado falla.
- [ ] Fallo de proveedor no deja estado inconsistente ni revela cuentas.

## Smoke funcional A/B

- [ ] 1. Registrar Usuario A.
- [ ] 2. Verificar correo A.
- [ ] 3. Iniciar sesión A.
- [ ] 4. Completar onboarding A.
- [ ] 5. Crear cuenta A.
- [ ] 6. Crear categorías A.
- [ ] 7. Registrar ingreso A.
- [ ] 8. Registrar gasto A.
- [ ] 9. Crear segunda cuenta A.
- [ ] 10. Transferir entre cuentas A.
- [ ] 11. Corregir movimiento A.
- [ ] 12. Anular movimiento A.
- [ ] 13. Crear próximo pago A.
- [ ] 14. Revisar dashboard A.
- [ ] 15. Revisar historial A.
- [ ] 16. Cerrar sesión A.
- [ ] 17. Reingresar A.
- [ ] 18. Confirmar persistencia A.
- [ ] 19. Registrar Usuario B.
- [ ] 20. Confirmar aislamiento A/B, incluidos IDs directos.
- [ ] 21. Recuperar contraseña.
- [ ] 22. Confirmar invalidación del token usado.
- [ ] 23. Confirmar rechazo de enlace expirado.
- [ ] 24. Verificar viewport 320 px.
- [ ] 25. Verificar viewport 390 px.
- [ ] 26. Verificar desktop.
- [ ] 27. Consola del navegador sin errores.
- [ ] 28. Logs de servidor sin errores y sin fixtures.

## Go/No-Go

- [ ] Release Manager: Go.
- [ ] Ingeniería: Go.
- [ ] Product owner: Go.
- [ ] Plan de rollback accesible.
- [ ] Persona con acceso a Neon disponible durante la ventana.
- [ ] Autorización explícita para desplegar producción.
