# Checklist de release de Doleth

## Identidad del candidato

- [ ] Rama, commit y deployment Preview apuntan al mismo SHA.
- [ ] Corte funcional y visual permanecen congelados.
- [ ] No hay cambios de schema/migraciones fuera del alcance aprobado.

## Entornos

- [ ] Local usa PostgreSQL descartable mediante `TEST_DATABASE_URL`.
- [ ] Preview tiene DB, secret de sesión y `DOLETH_APP_URL` exclusivos.
- [ ] Host/base de Preview difieren de Production; registrar solo aliases seguros.
- [ ] Production no contiene `TEST_DATABASE_URL`.
- [ ] Ningún secreto aparece en logs, commits, capturas o documentación.

## Gate reproducible

Ejecutar:

```sh
pnpm release:check
```

Debe terminar en `RELEASE CHECK: PASS`. El comando falla antes de empezar si falta una base de prueba válida; nunca usa `DATABASE_URL` como fallback. Cubre migraciones, historial 11/11, lint, typecheck, tests con PostgreSQL, aislamiento, build y Storybook.

## Preview y correo

- [ ] Registro → inbox real → verificación → Doleth.
- [ ] Reenvío invalida el enlace anterior.
- [ ] Recuperación → inbox real → nueva contraseña → sesiones revocadas.
- [ ] Cambio de email probado cuando corresponda.
- [ ] Remitente, dominio, SPF y DKIM figuran verificados en Resend.
- [ ] Todos los links HTTPS usan el host exacto de Preview.

## Smoke financiero

- [ ] Login, onboarding y logout.
- [ ] Gasto, ingreso y transferencia; saldos y ledger consistentes.
- [ ] Corrección/anulación y distinta moneda cuando aplique.
- [ ] Cuentas, plan, inversiones, importación y patrimonio.
- [ ] Reset, cambio de contraseña, sesiones y baja probados solo si es seguro.

## Operación

- [ ] `/api/salud` responde 200 con DB y migraciones al día.
- [ ] Logs de Vercel sin secretos ni 5xx del smoke.
- [ ] Neon PITR/backup actual verificado y evidencia UTC registrada.
- [ ] GitHub Actions ejecuta steps y queda verde en el SHA candidato.
- [ ] Plan de rollback y [RECOVERY.md](./RECOVERY.md) revisados.

## Autorización

- [ ] Matriz final sin bloqueantes.
- [ ] Autorización explícita de deploy Production recibida.
- [ ] Deploy Production, migraciones o restore no se ejecutan antes de esa autorización.
