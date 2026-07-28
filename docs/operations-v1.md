# Operación y release de Doleth v1

## Privacidad técnica

Doleth procesa los datos financieros para renderizar la aplicación y no incluye
analytics ni telemetría de terceros. La preferencia para ocultar importes vive
en `localStorage`; no se sincroniza ni se envía al servidor.

Los logs estructurados contienen únicamente:

- nivel;
- ruta;
- tipo de operación;
- código controlado;
- referencia aleatoria corta;
- timestamp.

No registran importes, descripciones, nombres de cuentas, cookies, contraseñas,
connection strings ni el texto crudo de una excepción.

Las exportaciones son acciones explícitas del usuario. Cerrar sesión elimina la
cookie de sesión, pero no borra los datos financieros ni las preferencias
locales. La eliminación total de datos no existe en v1: requiere una operación
transaccional y confirmación extrema que quedó fuera de alcance.

## Glosario de producto

| Término | Definición |
|---|---|
| Patrimonio | suma de saldos de todas las cuentas, incluidas archivadas |
| Dinero en cuentas | base monetaria registrada en cuentas |
| Comprometido | próximos pagos dentro del horizonte declarado |
| Proyectado | estimación después de compromisos; no es un asiento |
| Pago previsto | obligación cargada que todavía no afecta el ledger |
| Pago confirmado | pago convertido explícitamente en gasto |
| Anulado | movimiento visible con efecto contable cero |
| Corrección | reemplazo auditable de un movimiento anulado |
| Inversión | valor registrado aparte de cuentas para evitar doble conteo |
| Cuenta archivada | cuenta fuera del uso cotidiano que conserva su historia |
| Revisión del mes | lectura informativa; no guarda ni bloquea el período |

## Entornos

### Local

Usar `.env.local`, PostgreSQL local o descartable y los comandos del README.

### Preview

Debe usar variables y base separadas de producción. Nunca reutilizar una base
productiva para pruebas de formularios.

### Producción

Variables obligatorias:

- `DATABASE_URL`;
- `DOLETH_SESSION_SECRET`;
- `RESEND_API_KEY`;
- `DOLETH_EMAIL_FROM`;
- `DOLETH_APP_URL`.

La URL debe usar HTTPS. La rama productiva esperada es `main`. Las migraciones
existentes se aplican con `pnpm db:migrate`; C7 no agrega migraciones.

## Checklist de producción

- [ ] Proyecto y dominio correctos.
- [ ] Rama productiva `main`.
- [ ] Node y pnpm compatibles con `package.json`.
- [ ] `DATABASE_URL` apunta a la base productiva esperada.
- [ ] Existe backup verificable de la base antes del release.
- [ ] Migraciones existentes aplicadas una sola vez.
- [ ] `DOLETH_SESSION_SECRET` es aleatorio y tiene al menos 32 caracteres.
- [ ] El proveedor de correo está configurado y envía de verdad
      (`RESEND_API_KEY`, `DOLETH_EMAIL_FROM` con dominio verificado, SPF y DKIM).
- [ ] `DOLETH_APP_URL` apunta al dominio productivo real.
- [ ] HTTPS activo.
- [ ] Cookie `HttpOnly`, `Secure` y `SameSite=Lax`.
- [ ] CSP, `DENY`, `nosniff`, `no-referrer` y Permissions Policy presentes.
- [ ] HSTS presente en HTTPS.
- [ ] Rutas privadas y login con `private, no-store`.
- [ ] Exportaciones autenticadas y no cacheadas.
- [ ] `noindex, nofollow, noarchive` presente.
- [ ] Manifest, iconos 192/512 y service worker responden 200.
- [ ] Offline muestra shell honesta, sin HTML financiero cacheado.
- [ ] Flujo de actualización no recarga formularios.
- [ ] Privacidad visual persiste y no oculta inputs.
- [ ] `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build` verdes.
- [ ] `pnpm build-storybook` verde sin Prisma/pg en el bundle.
- [ ] QA responsive, teclado, touch targets y reduced motion aprobado.
- [ ] QA read-only sobre el deployment candidato aprobado.
- [ ] Runtime logs y errores revisados.
- [ ] Plan de rollback confirmado.
- [ ] No hay cambios locales sin commit.

## Procedimiento de release

1. Confirmar backup y variables sin imprimir valores.
2. Confirmar que el commit candidato es el que se va a desplegar.
3. Ejecutar toda la validación local.
4. Integrar mediante fast-forward a `main`.
5. Desplegar desde `main`.
6. Aplicar únicamente las migraciones versionadas.
7. Ejecutar QA read-only: acceso, navegación, manifest, headers, metadata,
   noindex, consola, responsive y rendimiento básico.
8. Probar exportaciones solo con una cuenta controlada y sin publicar archivos.
9. Observar errores de runtime y códigos 5xx.
10. Registrar commit, deployment y hora del release.

C7 no ejecutó los pasos 4 a 10 porque el pedido prohibía deploy, push y escritura
productiva.

## Rollback

1. Detener el release si falla build, acceso o lectura financiera.
2. Promover el último deployment sano o redeplegar su commit.
3. No revertir migraciones destructivamente. C7 no tiene migración propia.
4. Si el problema es una variable, restaurar el valor anterior desde el gestor
   seguro y redeplegar.
5. Verificar acceso, `/ahora`, headers, manifest y logs.
6. Documentar causa, impacto y ventana temporal.

La base se restaura solo desde un backup confirmado y con una decisión explícita
del responsable; nunca como paso automático.

## Monitoreo

Mínimo operativo:

- errores agrupados de runtime;
- códigos 5xx por ruta;
- fallos de conexión a base;
- fallos de exportación por referencia;
- latencia básica de `/ingresar` y una ruta privada;
- disponibilidad de manifest, service worker e iconos.

No registrar payloads financieros ni agregar analytics invasivo.

## Limitaciones y deuda

- La exportación JSON no se puede restaurar.
- No existe borrado total desde UI.
- No hay escrituras offline ni sincronización entre dispositivos.
- La revisión mensual no persiste.
- Las inversiones no guardan fecha de valuación.
- El horizonte de compromisos es fijo.
- El layout conserva varias superficies tipo card y breakpoints locales; su
  unificación requiere un corte de diseño, no un parche final.
- La protección de Vercel puede quedar por delante del login de Doleth. Debe
  decidirse conscientemente qué capa será la entrada productiva.
- Instalar Vercel CLI (`npm i -g vercel`) es opcional, pero facilita inspección
  de variables, deployments y logs. No es una dependencia de la aplicación.
