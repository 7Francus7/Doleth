# Variables de entorno de Doleth

No registrar valores en Git, documentación, tickets o logs.

| Variable | Fase | Estado | Uso y condición |
|---|---|---|---|
| `DATABASE_URL` | Runtime, migraciones | Requerida | PostgreSQL. Runtime puede usar pooling; migraciones deben usar una conexión compatible. No apuntar herramientas de test a producción. |
| `TEST_DATABASE_URL` | Test | Requerida para suite DB | Base desechable y aislada. Su ausencia omite tests DB; con `DOLETH_REQUIRE_DB=1` debe fallar. |
| `DIRECT_URL` | — | `NOT_IMPLEMENTED` | No es leída por el código actual. Configurarla en Vercel no cambia Prisma mientras no se integre explícitamente. |
| `DOLETH_SESSION_SECRET` | Runtime | Requerida | Secreto HMAC único, largo y aleatorio. Rotarlo invalida cookies activas. |
| `DOLETH_APP_URL` | Runtime | Requerida en producción | URL HTTPS canónica para callbacks y emails. |
| `RESEND_API_KEY` | Runtime | Requerida con Resend | Credencial del proveedor. Debe existir solo donde se envían emails. |
| `DOLETH_EMAIL_FROM` | Runtime | Requerida | Remitente permitido por el dominio verificado. |
| `DOLETH_EMAIL_TRANSPORT` | Runtime | Requerida en producción | Debe ser `resend`; transportes de consola solo en desarrollo/test. |
| `DOLETH_ACCESS_MODE` | Runtime | Opcional | `public` (por omisión) abre el registro a cualquiera; `private-beta` lo cierra a invitaciones. Es la **única** palanca que controla el acceso: no hay allowlist ni flag paralelo. Cualquier otro valor aborta el arranque. |
| `DOLETH_ACCESS_PASSWORD` | Runtime antiguo | Obsoleta/peligrosa | Pertenece a `main` de acceso compartido. Remover del release multiusuario una vez confirmado que no hay consumidores. |
| `DOLETH_OWNER_EMAIL` | Operación de backfill | Temporal | Identifica el owner histórico. Confirmar explícitamente; no mantener como variable ordinaria de runtime. |
| `DOLETH_BACKFILL_TIMEOUT_MS` | Operación | Opcional | Timeout del backfill. Ajustar solo en rehearsal. |
| `DOLETH_BACKFILL_MAX_WAIT_MS` | Operación | Opcional | Tiempo máximo de espera por lock/conexión. |
| `DOLETH_REQUIRE_DB` | CI/test | Requerida en gates | En `1`, impide que la suite DB se omita silenciosamente. |
| `NODE_ENV` | Build/runtime | Gestionada por plataforma | Controla cookies `Secure` y comportamiento de producción. |
| `VERCEL_URL` | Runtime Vercel | Gestionada por Vercel | Fallback de URL de deployment; no reemplaza la canónica. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Runtime Vercel | Gestionada por Vercel | Fallback productivo. |

## Matriz por environment

### Development local

- `DATABASE_URL` de desarrollo.
- `DOLETH_SESSION_SECRET` local.
- `DOLETH_APP_URL=http://localhost:3000`.
- Transport de email de desarrollo.
- Nunca descargar variables productivas a un archivo versionado.

### Test/CI

- PostgreSQL efímero en `TEST_DATABASE_URL`.
- `DOLETH_REQUIRE_DB=1`.
- secretos sintéticos exclusivos de CI.
- transporte de email controlado; sin enviar a usuarios reales.

### Preview

- base y credenciales separadas de producción;
- URL de preview aceptada por callbacks;
- protección de preview activa;
- Resend en modo seguro o destinatarios controlados.

### Production

- `DATABASE_URL`, `DOLETH_SESSION_SECRET`, `DOLETH_APP_URL`, `RESEND_API_KEY`, `DOLETH_EMAIL_FROM`, `DOLETH_EMAIL_TRANSPORT`.
- no `TEST_DATABASE_URL`;
- no `DOLETH_ACCESS_PASSWORD`;
- owner/backfill solo durante una operación aprobada.

## Verificación externa pendiente

Estado `INCONCLUSIVE`: no se listaron valores ni presencia por environment desde Vercel. El CLI no está instalado. Instalarlo con:

```bash
npm i -g vercel
```

Después, vincular el proyecto correcto y usar `vercel env pull` solo en un archivo local ignorado. Verificar nombres y scopes sin imprimir valores.

## TLS

Los logs recientes mostraron un warning de `pg` sobre semántica de `sslmode=require`. Confirmar con Neon la cadena recomendada (`verify-full` o compatibilidad explícita según su documentación vigente) antes del release. No cambiarla a ciegas.
