# Modelo de amenazas de la identidad de Doleth

Estado: implementado · Última actualización: 27 de julio de 2026

Alcance: registro, sesión, credenciales y aislamiento de datos financieros.

---

## 1. Qué protegemos

1. **La información financiera de cada persona.** Es el activo. Su exposición a
   otro usuario es la falla más grave posible del producto.
2. **Las credenciales.** Una contraseña filtrada de Doleth probablemente esté
   reutilizada en otro lado.
3. **La integridad contable.** Nadie puede alterar los movimientos de otro.

## 2. Quién ataca

| Actor | Capacidad |
| --- | --- |
| Usuario autenticado curioso o malicioso | Sesión válida propia. Puede editar cualquier campo de un formulario, cualquier id de una URL y llamar Server Actions directamente |
| Anónimo en internet | Puede llegar a cualquier ruta y enviar cualquier formulario |
| Alguien con el correo de la víctima | Puede abrir los enlaces de verificación y recuperación |
| Alguien con acceso de lectura a la base | Volcado de tablas |
| Sitio de terceros | Puede inducir peticiones desde el navegador de la víctima |

Fuera de alcance: acceso físico al dispositivo desbloqueado de la víctima,
compromiso del proveedor de hosting o del proveedor de correo, malware en el
equipo del usuario.

## 3. Amenazas y controles

### A1 — Leer datos de otro usuario (IDOR)

*Cambiar el id en `/movimientos/<id>`, en un `<select>` o en un campo oculto.*

- Toda lectura filtra por el `userId` de la sesión (`src/lib/finance/data.ts`).
- El acceso por id usa `findFirst({ where: { id, userId } })` → `null` → **404**.
  No 403, que confirmaría la existencia del recurso.
- Las opciones de los formularios (cuentas, categorías) se traen filtradas.

Probado: `isolation.test.ts` (11 casos) y QA de navegador (404 en detalle y en
edición).

### A2 — Escribir sobre datos de otro usuario

*Enviar el id de una cuenta ajena en `sourceAccountId`, `destinationAccountId`,
`categoryId`, `originalId` o `paymentId`.*

- El propietario sale de `requireOnboardedUserForAction()`. `src/app/actions/finance.ts`
  no lee ningún campo `userId` del formulario.
- Cada recurso relacionado se busca filtrando por ese propietario.
- Las mutaciones usan `updateMany({ where: { id, userId, … } })` y verifican
  `count`: no hay ventana entre comprobar y escribir.
- En transferencias se validan **las dos** cuentas contra el mismo propietario.

Probado: `finance.authorization.test.ts` (17 casos, cada uno verificando el
estado de la base después del intento).

### A3 — Llamar Server Actions sin sesión

Next.js expone las Server Actions como endpoints. Toda acción financiera y de
cuenta abre con una guardia; sin sesión, las acciones con estado devuelven error
y las que no lo tienen lanzan `UnauthorizedError`. Ninguna escribe nada.

Probado: `finance.authorization.test.ts`, bloque "sin sesión".

### A4 — Robo o forja de la cookie de sesión

- La cookie no transporta identidad: un token aleatorio de 256 bits, su
  vencimiento y una firma HMAC-SHA256.
- La base guarda `sha256(token)`. Un volcado no permite construir una cookie.
- `HttpOnly` (fuera del alcance de cualquier JS), `Secure` en producción,
  `SameSite=Lax`.
- Firma alterada, token cambiado o vencimiento estirado → rechazo.

Probado: `session-cookie.test.ts` (7 casos), `actions.test.ts` (el hash guardado
no es el token), QA de navegador (cookie con firma falsa no da acceso).

### A5 — Sesión que sobrevive a lo que debería cerrarla

`getSession()` verifica en cada request: existencia, revocación, vencimiento,
estado del usuario y `passwordChangedAt <= session.createdAt`. Todo contra la
base, no contra la cookie.

Probado: `cuenta/actions.test.ts` — sesión revocada, vencida, cuenta suspendida y
sesiones anteriores a un cambio de contraseña dejan de resolver, aunque la cookie
siga en el navegador.

### A6 — Fuerza bruta de contraseñas

- scrypt N=2¹⁶, r=8, p=2: cada intento cuesta ~64 MiB y decenas de milisegundos.
- Rate limiting persistido: 8 intentos por dirección y 30 por IP cada 15 minutos.
- Un login exitoso limpia el contador de esa dirección.

Se eligió rate limiting en lugar de bloqueo de cuenta: bloquear por intentos
fallidos convierte el ataque de fuerza bruta en un ataque de denegación contra
cualquiera cuya dirección se conozca.

### A7 — Enumeración de cuentas

Registro, login y recuperación responden igual exista o no la dirección. En el
login con correo inexistente se consume un hash señuelo del mismo costo, para que
el **tiempo de respuesta** tampoco delate. Ver `auth-architecture.md` §8 para la
tabla completa y la única excepción deliberada.

Probado: `actions.test.ts` — el mensaje de "correo inexistente" es idéntico al de
"contraseña incorrecta"; el de recuperación es idéntico en ambos casos.

### A8 — Robo o reutilización de tokens de correo

- 256 bits de aleatoriedad criptográfica; en la base sólo su SHA-256.
- Un solo uso, reclamado con `updateMany` condicional: dos requests simultáneos
  no pueden consumir el mismo enlace.
- Vencen: 24 h verificación, 60 min recuperación y cambio de correo.
- Emitir uno nuevo invalida el anterior del mismo propósito.
- Nunca se registran en logs.
- La verificación **no** se consume al abrir el enlace, para que los escáneres de
  correo no gasten el token de la persona.

Probado: `actions.test.ts` — token válido, inválido, vencido, ya usado, y el
enlace viejo invalidado tras pedir uno nuevo.

### A9 — Open redirect

`?destino=` pasa por `safeInternalPath()`, que exige una ruta interna absoluta y
rechaza `//host`, `/\host`, esquemas absolutos, `javascript:`, caracteres de
control y las propias pantallas de autenticación. Se valida dos veces: al
renderizar el login y dentro de la acción.

Probado: `redirect.test.ts` (10 formas hostiles) y QA de navegador.

### A10 — CSRF

- Toda mutación pasa por Server Actions, que Next.js protege con verificación de
  origen; no hay endpoints `POST` propios.
- `SameSite=Lax` impide que la cookie viaje en POST entre sitios.
- Cambiar contraseña, cambiar correo y pedir la baja exigen **reautenticación con
  la contraseña actual**: aunque una petición forjada llegara, no tiene la
  credencial.

### A11 — Toma de cuenta vía cambio de correo

- Reautenticación obligatoria.
- El correo **no cambia** hasta confirmar el enlace enviado a la dirección nueva.
- Se avisa a la dirección anterior, para que un cambio no pedido se note.
- Confirmar exige, además del token, estar dentro de la cuenta: el enlace solo no
  alcanza.

Probado: `cuenta/actions.test.ts` — sin contraseña no procede; hasta confirmar el
correo sigue siendo el viejo; el token de otra persona no sirve; el enlace no se
puede reusar.

### A12 — Escalada por mass assignment

No se construye ningún `data:` a partir de un objeto del cliente. Cada campo se
lee por nombre, se valida y se asigna. `status`, `role`, `planKey`,
`subscriptionStatus`, `emailVerifiedAt` y `passwordChangedAt` no son escribibles
desde ninguna acción de usuario.

### A13 — Filtración por errores y logs

- Las acciones devuelven mensajes fijos. `safeMessage()` traduce cualquier
  excepción inesperada a un texto genérico y registra sólo el `name` del error.
- La auditoría guarda correo e IP **seudonimizados** con HMAC.
- Nunca se registran contraseñas ni tokens.

Probado: `actions.test.ts` — el volcado de eventos no contiene la contraseña, ni
el correo en claro, ni la IP.

### A14 — Correo que no se envió

Si el proveedor falla, la acción falla. Nunca se dice "revisá tu casilla" cuando
el envío no ocurrió. El transporte `console` se niega a funcionar con
`NODE_ENV=production`.

Probado: `actions.test.ts` (proveedor caído) y verificado en el QA: contra el
build de producción con transporte `console`, el registro devolvió "No pudimos
enviar el correo en este momento", que es el comportamiento correcto.

### A15 — Clickjacking y sniffing

El proxy agrega en **toda** respuesta: `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` restrictiva y `Strict-Transport-Security`.

Probado: `proxy.test.ts` y QA de navegador.

### A16 — Denegación de servicio contra uno mismo

Encontrado en el QA: el proxy sacaba de las pantallas de autenticación a
cualquiera con cookie firmada. Con la sesión revocada y la cookie todavía válida,
el guard de la página mandaba al login y el proxy devolvía al panel: bucle
infinito, usuario sin acceso. Corregido — esa decisión vive en las páginas, que
consultan la base. Regresión fijada en `proxy.test.ts`.

## 4. Riesgos aceptados

| Riesgo | Por qué se acepta | Qué lo cerraría |
| --- | --- | --- |
| `userId` nullable en las tablas financieras (resuelto) | Sin impacto de filtración: las consultas filtran por un valor concreto y `NULL` nunca matchea. Era integridad, no confidencialidad | Cerrado: migración `202607280001_require_financial_ownership`, que se aplica tras el backfill |
| Sin segundo factor | Producto personal en etapa inicial; el 2FA sin canal de recuperación robusto genera más pérdidas de cuenta que las que evita | TOTP con códigos de respaldo |
| Sin verificación contra contraseñas filtradas | Requiere un servicio externo (HIBP k-anonymity); hoy la política es longitud + lista corta de comunes | Consulta al rango de HIBP en registro y cambio |
| Sesión de 30 días sin reautenticación periódica | Es una app financiera personal, de uso frecuente desde el propio teléfono; toda operación sensible ya pide la contraseña | Reautenticación por antigüedad de sesión |
| Baja de cuenta sin período de gracia ni copia previa | El borrado es inmediato e irreversible por diseño: un período de gracia guarda datos de alguien que pidió no ser guardado. Se compensa con doble confirmación (contraseña + `ELIMINAR`) y con el enlace a Movimientos para descargar antes | Exportación obligatoria ofrecida dentro del propio flujo de baja |
| Rate limiting por ventana fija | Permite hasta 2× el límite en el borde entre ventanas. Suficiente para el volumen actual | Ventana deslizante |
