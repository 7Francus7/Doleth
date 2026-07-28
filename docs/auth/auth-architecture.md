# Arquitectura de identidad de Doleth

Estado: implementado · Última actualización: 27 de julio de 2026

Este documento describe cómo funciona la identidad en **este** repositorio: qué
archivo hace qué, y por qué se eligió cada cosa. No es teoría general.

---

## 1. Punto de partida

Antes de este corte Doleth era single-user:

- Una única contraseña compartida en `DOLETH_ACCESS_PASSWORD`.
- Una cookie firmada con HMAC (`src/lib/auth-token.ts`) que sólo decía "alguien
  conoce la contraseña". No identificaba a nadie.
- Ninguna tabla financiera tenía propietario. Toda consulta leía todo.
- El proxy (`src/proxy.ts`) protegía la navegación; no había ninguna
  verificación de autorización dentro de las Server Actions.

Ese modelo funcionaba para una persona y era indefendible para dos.

## 2. Decisión: identidad propia, sin librería

No se agregó NextAuth/Auth.js. Razones concretas:

- **Sesiones revocables**: el requisito es poder cerrar sesiones desde el
  servidor (cambio de contraseña, "cerrar otras sesiones", suspensión). La
  estrategia JWT de NextAuth no revoca; su estrategia de base implica igual
  escribir a mano credenciales, verificación y recuperación, que es el 80 % del
  trabajo.
- **Superficie de dependencias**: el proyecto no tiene librerías de validación ni
  de autenticación. Sumar una con su propio esquema de tablas y su adaptador de
  Prisma agrega más de lo que ahorra para un flujo de credenciales simple.
- **Dependencias agregadas: ninguna.** Todo usa Node (`node:crypto`), Web Crypto
  y Prisma, que ya estaban.

## 3. Piezas

| Archivo | Responsabilidad |
| --- | --- |
| `src/lib/auth/crypto.ts` | HMAC-SHA256, SHA-256, comparación en tiempo constante, tokens aleatorios, seudonimización. Sólo Web Crypto: funciona también en el edge. |
| `src/lib/auth/password.ts` | Hasheo y verificación de contraseñas con scrypt. Incluye el señuelo de tiempo para logins de cuentas inexistentes. |
| `src/lib/auth/session-cookie.ts` | Sella y abre la sobre firmada de la cookie. Edge-safe. |
| `src/lib/auth/session.ts` | Sesiones contra la tabla `Session`: crear, resolver, revocar, listar. |
| `src/lib/auth/guards.ts` | `requireUser`, `requireOnboardedUser`, `requireUserForAction`, `requireOnboardedUserForAction`. Única fuente de verdad sobre quién pide algo. |
| `src/lib/auth/tokens.ts` | Tokens de un solo uso (verificación, recuperación, cambio de correo). |
| `src/lib/auth/rate-limit.ts` | Contadores de ventana fija persistidos en Postgres. |
| `src/lib/auth/audit.ts` | Bitácora de eventos sensibles, sin secretos. |
| `src/lib/auth/email.ts` | Transporte (Resend / consola) y plantillas. |
| `src/lib/auth/redirect.ts` | Validación de destinos de retorno. |
| `src/lib/auth/validation.ts` | Esquemas de validación compartidos cliente/servidor. |
| `src/lib/auth/plan.ts` | Resolución de capacidades por plan. |
| `src/lib/auth/form-state.ts` | Tipos y estados iniciales de formulario. Vive fuera de los archivos `"use server"`, que sólo pueden exportar funciones. |
| `src/proxy.ts` | Clasificación de rutas y cabeceras de seguridad. **No es autorización.** |

## 4. Contraseñas: por qué scrypt y no Argon2id

`src/lib/auth/password.ts` usa **scrypt** con N=2¹⁶, r=8, p=2 (≈64 MiB por hash),
los parámetros mínimos que OWASP acepta como equivalentes cuando Argon2id no
está disponible.

Argon2id requiere un módulo nativo (`@node-rs/argon2` o `argon2`). Doleth se
despliega en runtimes serverless donde los binarios nativos son una fuente
recurrente de fallas de build y de sorpresas al cambiar de plataforma. scrypt
viene en Node, es memory-hard y no agrega dependencias.

La decisión es **reversible sin costo**: el hash guarda su propio algoritmo y
parámetros —`scrypt$65536$8$2$<sal>$<hash>`—, y `verifyPassword` devuelve
`needsRehash`. `loginAction` rehashea en silencio cuando ese flag viene en true.
Migrar a Argon2id es agregar un verificador para el prefijo `argon2id$` y cambiar
el hasheador por omisión: nadie pierde su contraseña ni hay migración de datos.

## 5. Sesiones

**Cookie** `doleth_session`: `v1.<token>.<vencimiento>.<firma HMAC>`.

- El token son 32 bytes aleatorios. La cookie **no transporta identidad**: ni el
  id de usuario ni el de la sesión.
- La base guarda `sha256(token)` en `Session.tokenHash`. Un volcado de esa tabla
  no permite construir una cookie válida.
- `HttpOnly`, `SameSite=Lax`, `Secure` en producción, `path=/`, 30 días.

**Por qué `Lax` y no `Strict`**: con `Strict` la cookie no viaja cuando el
usuario llega desde el enlace de un correo, y toda la verificación y la
recuperación pasan por correos. `Lax` no envía la cookie en peticiones POST
entre sitios, que es lo que importa para CSRF.

**Resolución** (`getSession`, memoizada por request con `cache()`):

1. Firma y vencimiento de la cookie.
2. Existe la fila en `Session`.
3. No está revocada.
4. No venció.
5. El usuario está `ACTIVE`.
6. `user.passwordChangedAt <= session.createdAt`.

Cualquier falla devuelve `null`. Fail-closed en los seis pasos.

El paso 6 es el que hace que cambiar la contraseña invalide todo lo emitido
antes, incluso si una revocación quedó a medias. `changePasswordAction` reemite
la sesión propia (`createdAt = passwordChangedAt`) para que quien acaba de probar
su contraseña no se quede afuera.

## 6. Los dos niveles de protección

**Nivel 1 — navegación (`src/proxy.ts`, edge).** Verifica firma y vencimiento de
la cookie. No tiene base de datos. Sirve para redirigir a tiempo y para poner
las cabeceras de seguridad. Una cookie con firma válida pero sesión revocada
**pasa** este nivel.

**Nivel 2 — autorización (`guards.ts` + cada consulta).** `getSession()` va a la
base. Toda página privada llama a `requireOnboardedUser()`; toda Server Action
financiera llama a `requireOnboardedUserForAction()`; toda consulta filtra por el
`userId` que sale de ahí.

El proxy **no** saca a un usuario con cookie de las pantallas de autenticación.
Eso lo decide cada página, que sí puede consultar la base. Hacerlo en el edge con
la cookie como única señal produce un bucle infinito cuando la sesión fue
revocada pero la cookie sigue firmada: el guard de la página manda al login y el
proxy devuelve al panel. El bucle apareció en el QA de navegador; la regresión
está fijada en `src/proxy.test.ts`.

## 7. Tokens de un solo uso

`AuthToken` guarda `sha256(token)`, el propósito, el vencimiento y `consumedAt`.

- Emitir un token nuevo marca como consumidos los anteriores del mismo propósito.
- `consumeToken` reclama con `updateMany({ where: { consumedAt: null, expiresAt: { gt: now } } })`:
  dos requests simultáneos no pueden usar el mismo enlace.
- La verificación de correo **no** se consume al abrir el enlace: hace falta
  enviar el formulario. Los antivirus y filtros de correo visitan las URLs de los
  mensajes; si el GET consumiera el token, el enlace le llegaría gastado a la
  persona.

Vencimientos: verificación 24 h, recuperación 60 min, cambio de correo 60 min.

## 8. No revelar qué cuentas existen

| Situación | Qué ve la persona |
| --- | --- |
| Registro con correo nuevo | Redirección a "revisá tu correo" |
| Registro con correo ya registrado | **La misma** redirección. Si la cuenta estaba sin verificar, se reenvía el enlace; si estaba activa, no se envía nada |
| Login, contraseña incorrecta | "Correo o contraseña incorrectos." |
| Login, correo inexistente | **El mismo** mensaje, y se consume un hash señuelo del mismo costo para que el tiempo de respuesta tampoco delate |
| Recuperación, cuenta existente | "Si esa dirección tiene una cuenta, te enviamos un enlace…" |
| Recuperación, cuenta inexistente | **El mismo** texto, sin enviar nada |

La única excepción deliberada es la cuenta sin verificar en el login: ahí sí se
dice que falta confirmar el correo, porque sin esa salida la persona queda
trabada sin entender por qué. Es información que ya tiene quien conoce la
contraseña.

## 9. Rate limiting

Ventana fija en Postgres (`RateLimitCounter`), una sentencia
`INSERT … ON CONFLICT DO UPDATE` sin leer-y-después-escribir. En memoria no
serviría: cada instancia serverless arrancaría el contador en cero.

| Acción | Límite | Ventana | Sujeto |
| --- | --- | --- | --- |
| Login | 8 | 15 min | correo |
| Login | 30 | 15 min | IP seudonimizada |
| Registro | 5 | 60 min | IP seudonimizada |
| Recuperación | 5 | 60 min | IP + correo |
| Reenvío de verificación | 4 | 60 min | IP + correo |
| Cambio de correo | 5 | 60 min | usuario |

Un login exitoso borra el contador de esa dirección.

## 10. Planes

`src/lib/auth/plan.ts` traduce `planKey` + `subscriptionStatus` a capacidades.
Nadie fuera de ese archivo pregunta por el plan: las pantallas preguntan por
capacidades. Hoy **todo usuario aprobado recibe el conjunto completo** y no hay
ninguna función bloqueada ni pasarela de pago integrada. El modelo existe para
que agregar planes después sea cambiar una tabla, no rastrear condicionales.

## 11. Auditoría

`AuthEvent` registra altas, verificaciones, logins (exitosos y fallidos),
cierres de sesión, cambios de contraseña y de correo, revocaciones, onboarding y
pedidos de baja.

Nunca guarda contraseñas, tokens (ni parciales) ni datos financieros. El correo
y la IP se guardan **seudonimizados** con HMAC usando `DOLETH_SESSION_SECRET`
como pepper: sirven para correlacionar, no para identificar desde un volcado.
Auditar nunca rompe el flujo: si la escritura falla, se registra en el log del
servidor y la operación sigue.
