# Acceso operativo de la beta privada

## Precondición productiva descubierta — 2026-07-31

El operador requiere al menos un usuario `ACTIVE / ADMIN`. `bootstrap-admin`
sólo es válido con la tabla `User` vacía. Si Production ya contiene un usuario
histórico que no es administrador, el release debe detenerse: no se permite
promoverlo con SQL manual, marcar el correo como verificado ni crear un segundo
administrador por fuera del operador.

Antes de un nuevo intento debe existir un comando auditado de adopción de
usuario histórico. Como el resto del operador, debe ser local, exigir host
exacto, `DOLETH_ACCESS_MODE=private-beta`, habilitación temporal y `--confirm`.
Debe registrar la activación de beta sin completar `emailVerifiedAt`.

Este documento describe el procedimiento; nunca debe contener correos reales,
contraseñas, tokens, connection strings ni enlaces privados.

## Diseño

### Invitaciones

- token aleatorio de 256 bits;
- persistencia exclusiva de `SHA-256(token)`;
- email normalizado y obligatorio;
- creador `ADMIN` activo;
- expiración por defecto: 7 días;
- consumo atómico y de un solo uso;
- invitaciones anteriores activas para el mismo email se revocan;
- la cuenta queda `ACTIVE` con `privateBetaActivatedAt`;
- `emailVerifiedAt` permanece vacío: el acceso beta no se presenta como
  verificación real de email.

El token viaja en el fragmento `#token=...`. El fragmento no llega a Vercel,
Next.js, logs HTTP ni `Referer`; el cliente lo captura y lo elimina de la barra
antes de enviarlo en el cuerpo de la Server Action.

### Registro público

`DOLETH_ACCESS_MODE` falla cerrado a `private-beta`. El registro, reenvío de
verificación, recuperación por email y cambio de email están bloqueados en
servidor, además de ocultarse en la UI.

### Recuperación administrativa

- solo un `ADMIN` activo puede emitirla;
- objetivo identificado por email y con estado `ACTIVE`;
- expiración: 30 minutos;
- token aleatorio almacenado únicamente como hash;
- tokens anteriores pendientes del usuario se consumen;
- todas las sesiones se revocan al emitir y nuevamente al completar;
- el administrador no ve ni elige la contraseña;
- el evento se audita sin guardar el token.

## Operador local

No existe ruta web administrativa. El único punto operativo es:

```bash
pnpm beta:access <bootstrap-admin|invite|recover> [argumentos] --confirm
```

Una escritura exige simultáneamente:

- `DOLETH_ADMIN_OPERATIONS_ENABLED=1`;
- `DOLETH_ACCESS_MODE=private-beta`;
- `DOLETH_EXPECTED_DATABASE_HOST` igual al hostname exacto de `DATABASE_URL`;
- `--confirm`.

El comando omite el enlace por defecto. `--raw` se usa únicamente para
canalizar stdout directamente al portapapeles por un canal privado. No redirigir
esa salida a logs, historial compartido, documentación o archivos.

## Bootstrap

`bootstrap-admin` solo funciona cuando la tabla de usuarios está vacía. Usa un
advisory lock transaccional para impedir dos administradores iniciales
concurrentes y entrega un enlace temporal de elección de contraseña. No crea una
contraseña global ni reutilizable.

## Procedimiento de invitación

1. Validar visualmente proyecto Neon temporal, endpoint y base.
2. Cargar las variables solo en el proceso.
3. Ejecutar `invite` con el administrador y el email invitado.
4. Canalizar el enlace directo al portapapeles.
5. Compartirlo por un canal privado.
6. Confirmar consumo, activación y rechazo del segundo uso.
7. No conservar el enlace después de la prueba.

## Procedimiento de recuperación

1. Confirmar identidad del usuario por un canal acordado.
2. Ejecutar `recover`.
3. Verificar que las sesiones anteriores dejan de funcionar.
4. Compartir el enlace por un canal privado.
5. Confirmar contraseña anterior rechazada, nueva aceptada y segundo uso
   rechazado.

Este procedimiento es temporal y debe reemplazarse por recuperación real por
email antes de abrir el registro público.

## Adopción de usuario histórico

Cuando la base no está vacía, `bootstrap-admin` está expresamente prohibido. La
operación separada es:

```text
pnpm admin:adopt-existing-user -- --dry-run
pnpm admin:adopt-existing-user -- --execute
```

Usa exclusivamente `DOLETH_ADMIN_ADOPTION_DATABASE_URL`, exige identidad exacta
de host/proyecto/branch, ID+email por prompt local y frase fuerte. Production
requiere `DOLETH_ALLOW_PRODUCTION_ADMIN_ADOPTION=YES`. Solo cambia `role`,
`status` y `privateBetaActivatedAt`; `emailVerifiedAt` permanece `NULL`. Detalle
y procedimiento: `doleth-private-beta-admin-adoption.md`.
