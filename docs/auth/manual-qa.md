# QA manual del corte multiusuario

Ejecutado: 27 de julio de 2026 · Chromium 1194 vía Playwright
Servidor: `next dev` en `localhost:3100` · PostgreSQL 16 local

Script: `scratchpad/qa/qa.mjs` (fuera del repositorio; el guion queda
documentado acá para poder repetirlo a mano).

**Resultado: 32 de 32 verificaciones OK.**

---

## Cómo repetirlo

```bash
# Base
createdb doleth && pnpm db:migrate

# Entorno (.env.local)
DATABASE_URL="postgresql://…"
DOLETH_SESSION_SECRET="$(openssl rand -base64 48)"
DOLETH_APP_URL="http://localhost:3000"
DOLETH_EMAIL_TRANSPORT="console"   # los enlaces salen por la consola del servidor

pnpm dev
```

Los correos de verificación y recuperación se imprimen en la salida del
servidor, entre líneas `─── correo de Doleth (desarrollo) ───`. De ahí se copia
el enlace.

## Recorrido y resultados

### Alta y primeros datos

| # | Paso | Resultado |
| --- | --- | --- |
| 1 | Crear una cuenta nueva en `/crear-cuenta` | ✅ redirige a "revisá tu correo"; el usuario queda `PENDING_VERIFICATION` |
| 2 | Abrir el enlace y confirmar el correo | ✅ activa la cuenta, abre sesión y lleva a `/onboarding` |
| 3 | Completar el onboarding (bienvenida → preferencias → primera cuenta) | ✅ termina en `/ahora` |
| 4 | Crear la primera cuenta financiera con saldo 150.000 | ✅ el panel muestra `150.000` |
| 5 | Registrar un ingreso de 80.000 | ✅ |
| 6 | Registrar un gasto de 12.500 | ✅ el patrimonio pasa a `217.500` (150.000 + 80.000 − 12.500) |

### Sesión

| # | Paso | Resultado |
| --- | --- | --- |
| 7 | Cerrar sesión desde `/configuracion/cuenta` | ✅ lleva a `/iniciar-sesion` |
| 8 | Intentar volver a `/ahora` | ✅ redirige a `/iniciar-sesion?destino=%2Fahora` |
| 9 | Volver a iniciar sesión | ✅ los datos siguen: `217.500` |

### Recuperación de contraseña

| # | Paso | Resultado |
| --- | --- | --- |
| 10 | Pedir recuperación en `/olvide-mi-contrasena` | ✅ "Si esa dirección tiene una cuenta…" |
| 11 | Abrir el enlace y elegir contraseña nueva | ✅ termina en `/restablecer-contrasena/listo` |
| 12 | Volver a la pestaña que tenía sesión abierta | ✅ la sesión quedó cerrada |
| 13 | Entrar con la contraseña nueva | ✅ los datos siguen: `217.500` |

### Aislamiento entre usuarios

| # | Paso | Resultado |
| --- | --- | --- |
| 14 | Crear un segundo usuario (B) con saldo 9.000 | ✅ |
| 15 | Panel de B | ✅ muestra `9.000`; no aparece `217.500` |
| 16 | ¿B ve la cuenta de A? | ✅ no aparece "Cuenta principal" |
| 17 | ¿B ve movimientos de A? | ✅ el historial de B no los tiene |
| 18 | B abre `/movimientos/<id de A>` | ✅ **404** |
| 19 | B abre `/movimientos/<id de A>/editar` | ✅ **404** |

### Mobile

| # | Paso | Resultado |
| --- | --- | --- |
| 20 | `/iniciar-sesion` a 320 px | ✅ sin scroll horizontal |
| 21 | `/crear-cuenta` a 320 px | ✅ sin scroll horizontal |
| 22 | `/olvide-mi-contrasena` a 320 px | ✅ sin scroll horizontal |
| 23 | `/ahora` a 320 px | ✅ sin scroll horizontal |
| 24 | `/configuracion/cuenta` a 320 px | ✅ sin scroll horizontal |
| 25 | `/movimientos/nuevo` a 320 px | ✅ sin scroll horizontal |
| — | 390 px (capturas de registro, revisá tu correo, onboarding, panel y cuenta) | ✅ |

### Navegación y estados

| # | Paso | Resultado |
| --- | --- | --- |
| 26 | Interrumpir el onboarding y recargar | ✅ retoma en "Paso 2 de 3" |
| 27 | Sin onboarding terminado, ir a `/movimientos` | ✅ redirige a `/onboarding` |
| 28 | Refresh en una ruta privada | ✅ mantiene la sesión |
| 29 | Botón atrás entre pantallas privadas | ✅ no rompe la navegación |
| 30 | Dos pestañas abiertas; cerrar sesión en una | ✅ la otra queda fuera |

### Seguridad

| # | Paso | Resultado |
| --- | --- | --- |
| 31 | Cookie con firma inválida | ✅ redirige al login |
| 32 | `/iniciar-sesion?destino=https://malicioso.example/robar` | ✅ tras entrar queda en `localhost:3100/ahora` |
| 33 | Cabeceras de seguridad | ✅ `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` presente |
| 34 | Cookie de sesión | ✅ `HttpOnly: true`, `SameSite: Lax` |

## Hallazgos

### 1. Bucle de redirección con sesión revocada (corregido)

**Síntoma.** Tras restablecer la contraseña, volver a una ruta privada en el
navegador que tenía la sesión vieja daba `ERR_TOO_MANY_REDIRECTS`.

**Causa.** El proxy sacaba de las pantallas de autenticación a cualquiera con una
cookie firmada. Con la sesión revocada pero la cookie todavía válida: el guard de
`/ahora` mandaba a `/iniciar-sesion`, y el proxy devolvía a `/ahora`.

**Corrección.** Se quitó ese rebote del proxy. La decisión de sacar a un usuario
ya autenticado de las pantallas públicas vive en cada página, que consulta la
base. Regresión fijada en `src/proxy.test.ts`.

### 2. El transporte `console` se niega en producción (comportamiento correcto)

El primer intento de QA corrió contra `next start` con `NODE_ENV=production` y
`DOLETH_EMAIL_TRANSPORT=console`. El registro devolvió "No pudimos enviar el
correo en este momento" y **no** dijo que había enviado nada.

Es exactamente lo pedido: nunca simular un envío. El QA funcional se repitió
contra `next dev`, donde el transporte de consola es legítimo.

## Verificado por código, no por navegador

- **`Secure` en la cookie**: depende de `NODE_ENV === "production"`. En
  `http://localhost` el navegador descartaría una cookie `Secure`, así que no es
  observable en este QA. Confirmado en `src/lib/auth/session.ts` y en el
  checklist de producción.
- **Rate limiting**: verificado en `src/app/auth/actions.test.ts` (login,
  registro, recuperación, reenvío). El QA de navegador limpia los contadores
  entre fases para que varias corridas desde la misma IP no se bloqueen.
- **`prefers-reduced-motion`**: el único elemento con transición es el medidor de
  contraseña, y tiene su bloque `@media (prefers-reduced-motion: reduce)`.

## Accesibilidad

Revisado sobre el marcado generado:

- Todos los campos usan `<label htmlFor>` con `id` real (`useId`).
- Los errores se anuncian: `role="alert"` en el resumen, `aria-invalid` y
  `aria-describedby` en cada campo.
- Los errores de campo no dependen sólo del color: llevan un signo `!` en un
  círculo (`::before`).
- `autoComplete` correcto: `name`, `email`, `current-password`, `new-password`.
- Navegación completa por teclado; foco visible con `:focus-visible` en campos,
  botones y el enlace de cuenta.
- Los mensajes de resultado reciben `tabIndex={-1}` para poder llevarles el foco.
- Un solo `<h1>` por pantalla; las secciones de configuración usan `<h2>`.
- El botón mostrar/ocultar contraseña expone `aria-pressed`.
- Los botones se deshabilitan **sólo** mientras la acción está en vuelo, con
  `aria-busy` y una etiqueta que explica el estado ("Creando tu cuenta…").
