# Checklist de producción de Doleth

Marcar cada casilla con evidencia. Una casilla sin verificar mantiene el release en `BLOCKED`.

## Código y Git

- [ ] SHA de release inmutable registrado.
- [ ] Rama basada en `integration/identity-over-corte-7`.
- [ ] `main` y `origin/main` refrescados antes del PR.
- [ ] Working tree limpio.
- [ ] Sin secretos, `.env` ni JSON productivos en el commit.
- [ ] PR revisado; merge automático desactivado.

## Validaciones automáticas

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm exec prisma validate`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `git diff --check`
- [ ] `DOLETH_REQUIRE_DB=1 pnpm test`
- [ ] `DOLETH_REQUIRE_DB=1 pnpm test:isolation`
- [ ] `pnpm db:audit-migrations`
- [ ] Migraciones desde base PostgreSQL vacía.
- [ ] Rehearsal expand/backfill/contract con dataset legacy.
- [ ] Prueba de rollback del lote/release.

## Base de datos y ownership

- [ ] Proyecto, rama y base productiva identificados.
- [ ] Backup/PITR comprobado con timestamp y retención.
- [ ] Conexión runtime pooled confirmada.
- [ ] Conexión de migraciones compatible confirmada.
- [ ] Migraciones pendientes enumeradas.
- [ ] Conteos por tabla capturados.
- [ ] Filas financieras con `userId IS NULL`: cero antes del contrato.
- [ ] Owner del histórico confirmado por el usuario.
- [ ] Checksums pre/post preservados.
- [ ] Cero referencias cruzadas entre owners.
- [ ] Todas las tablas financieras tienen `userId NOT NULL`.
- [ ] Índices por `userId` presentes.
- [ ] FKs compuestas de ownership aplicadas.
- [ ] No se usó `db push` ni `migrate reset`.

## Variables e infraestructura

- [ ] `DATABASE_URL`
- [ ] `DOLETH_SESSION_SECRET` único y de alta entropía.
- [ ] `DOLETH_APP_URL` canónica HTTPS.
- [ ] `RESEND_API_KEY`
- [ ] `DOLETH_EMAIL_FROM`
- [ ] `DOLETH_EMAIL_TRANSPORT=resend`
- [ ] `DOLETH_ACCESS_PASSWORD` removida del candidato multiusuario.
- [ ] Variables de Preview separadas de Production.
- [ ] `TEST_DATABASE_URL` nunca apunta a producción.
- [ ] Dominio Vercel correcto.
- [ ] Preview protegida.
- [ ] Deployment muestra el SHA aprobado.
- [ ] Warning TLS de `pg` resuelto con Neon.

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
