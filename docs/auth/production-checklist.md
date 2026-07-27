# Checklist de producción · corte multiusuario

Última actualización: 27 de julio de 2026

Este corte cambia el esquema de la base y la forma de entrar a Doleth. **No se
despliega de forma improvisada.** Los pasos van en orden.

---

## 1. Antes de desplegar

- [ ] **Backup de la base de producción.** Volcado completo, descargado y
      verificado (`pg_restore --list` sobre el archivo). Sin esto no se sigue.
- [ ] Anotar los conteos actuales, para comparar después:
      ```sql
      SELECT 'Account' t, COUNT(*) FROM "Account"
      UNION ALL SELECT 'Category', COUNT(*) FROM "Category"
      UNION ALL SELECT 'Transaction', COUNT(*) FROM "Transaction"
      UNION ALL SELECT 'LedgerEntry', COUNT(*) FROM "LedgerEntry"
      UNION ALL SELECT 'Investment', COUNT(*) FROM "Investment"
      UNION ALL SELECT 'UpcomingPayment', COUNT(*) FROM "UpcomingPayment";
      ```
- [ ] Anotar los saldos actuales por cuenta:
      ```sql
      SELECT a.name, a."initialBalanceCents" + COALESCE(SUM(le."amountCents"), 0) AS saldo
      FROM "Account" a
      LEFT JOIN "LedgerEntry" le ON le."accountId" = a.id
      LEFT JOIN "Transaction" t ON t.id = le."transactionId" AND t."voidedAt" IS NULL
      GROUP BY a.id, a.name, a."initialBalanceCents" ORDER BY a.name;
      ```
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` en verde.
      Las pruebas de aislamiento necesitan `TEST_DATABASE_URL` (o `DATABASE_URL`)
      contra un Postgres real; **sin base quedan omitidas**, y son bloqueantes.

## 2. Variables de entorno

Configurar en el hosting antes del deploy. Sólo nombres — los valores nunca van
al repositorio.

| Variable | Obligatoria | Nota |
| --- | --- | --- |
| `DATABASE_URL` | sí | Con `sslmode=require` |
| `DOLETH_SESSION_SECRET` | sí | Mínimo 32 caracteres. `openssl rand -base64 48`. **Nuevo y exclusivo de producción** |
| `DOLETH_APP_URL` | sí | Sin barra final. En Vercel puede deducirse de `VERCEL_PROJECT_PRODUCTION_URL` |
| `RESEND_API_KEY` | sí | Sin esto no se puede verificar ningún correo |
| `DOLETH_EMAIL_FROM` | sí | Remitente verificado en el proveedor |
| `DOLETH_EMAIL_TRANSPORT` | no | Dejar sin definir o en `resend`. **Nunca `console` en producción** (la app se niega) |
| `TEST_DATABASE_URL` | no | Sólo CI |

- [ ] `DOLETH_ACCESS_PASSWORD` **eliminada**: ya no la usa nadie.
- [ ] `DOLETH_SESSION_SECRET` es distinto del de desarrollo. Rotarlo cierra todas
      las sesiones y rompe la correlación de la auditoría anterior.
- [ ] Dominio del remitente verificado (SPF/DKIM) en el proveedor de correo.
- [ ] `DOLETH_APP_URL` coincide con el dominio real: es lo que arma los enlaces
      de los correos.

## 3. Despliegue

- [ ] Desplegar la aplicación.
- [ ] Aplicar la migración: `pnpm db:migrate` (`prisma migrate deploy`).
      Sólo hay una pendiente: `202607270001_multiuser_identity`. Es aditiva y no
      modifica ninguna fila. **No usar `prisma db push`.**
- [ ] Confirmar que las tablas nuevas existen:
      ```sql
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User','Session','AuthToken','AuthEvent','RateLimitCounter','OwnerBackfillRun');
      ```

> **Desde acá y hasta terminar el paso 4, los datos financieros del owner no se
> ven en la aplicación.** No están perdidos: quedaron sin propietario y toda
> consulta filtra por uno. Hacer los pasos 3 y 4 seguidos.

## 4. Backfill del owner

- [ ] Crear la cuenta del owner desde la aplicación: `/crear-cuenta`.
- [ ] Confirmar el correo (verifica de paso que el envío real funciona).
- [ ] Ensayo: `pnpm db:backfill-owner -- --email=<owner> --dry-run`
      → revisar los conteos de filas huérfanas.
- [ ] Ejecución: `pnpm db:backfill-owner -- --email=<owner>`
      → debe terminar con "0 filas huérfanas" y "✔ Backfill completo".
- [ ] Entrar a la aplicación y comprobar que están todas las cuentas, los saldos
      y el historial, **iguales a los anotados en el paso 1**.

Si algo salió mal: `pnpm db:rollback-owner -- --email=<owner> --confirm`. No
borra nada; devuelve las filas a su estado sin propietario.

## 5. Verificación posterior al deploy

- [ ] `/` sin sesión → `/iniciar-sesion`.
- [ ] `/ahora` sin sesión → `/iniciar-sesion?destino=%2Fahora`.
- [ ] Login del owner → sus datos completos.
- [ ] Los conteos y saldos coinciden con los del paso 1.
- [ ] Crear un **segundo** usuario de prueba y confirmar que arranca vacío y que
      no puede abrir por URL ningún movimiento del owner (404).
- [ ] Cabeceras: `curl -sI https://<dominio>/iniciar-sesion | grep -iE "x-frame|x-content|referrer|strict-transport"`.
- [ ] Cookie: en DevTools, `doleth_session` con `HttpOnly`, `Secure` y
      `SameSite=Lax`.
- [ ] Recuperación de contraseña de punta a punta con un correo real.
- [ ] Borrar el usuario de prueba.

## 6. Endurecimiento (posterior, no el mismo día)

Con el backfill verificado y la aplicación estable:

- [ ] Aplicar `docs/auth/sql/owner-not-null.sql` (falla solo si quedan huérfanas).
- [ ] Actualizar `prisma/schema.prisma` a `userId String` / `user User` y generar
      la migración correspondiente para que el historial quede alineado.

## 7. Plan de rollback

| Situación | Acción |
| --- | --- |
| La aplicación falla, la base está bien | Volver al despliegue anterior. La migración es aditiva: el código viejo ignora las columnas nuevas |
| El backfill asignó mal los datos | `pnpm db:rollback-owner -- --email=<owner> --confirm` y reintentar |
| Corrupción de datos | Restaurar el backup del paso 1 |

La migración `202607270001_multiuser_identity` no borra columnas ni tablas. Los
dos `DROP INDEX` reemplazan índices únicos globales por compuestos que contienen
la misma unicidad: no se pierde ninguna fila.

## 8. Pasos humanos que quedan pendientes

Cosas que **no** puede hacer el código y hay que decidir o ejecutar:

1. Tomar el backup de producción.
2. Contratar y verificar el dominio en el proveedor de correo.
3. Generar y cargar `DOLETH_SESSION_SECRET` de producción.
4. Ejecutar el backfill y verificar los conteos contra los del paso 1.
5. Revisar los textos legales de `/terminos` y `/privacidad` antes de recibir
   usuarios que no sean el owner. Están escritos de forma honesta pero **no
   fueron revisados por nadie con formación legal**.
6. Definir el proceso manual de baja de cuentas: hoy el pedido queda registrado
   en `User.deletionRequestedAt` y no hay borrado automático. La aplicación no
   dice que borra nada.
7. Configurar CI con un servicio de Postgres para que las pruebas de aislamiento
   no queden omitidas.
