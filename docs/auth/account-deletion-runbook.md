# Baja de cuentas

Última actualización: 10 de agosto de 2026

Hay **dos** caminos, y hacen cosas distintas:

1. **La persona se da de baja sola**, desde `/configuracion/cuenta`. Borra todo,
   en el momento, sin intervención de nadie.
2. **Un operador da de baja a alguien**, con `pnpm db:deletions`. Bloquea o
   anonimiza, conservando la contabilidad.

El primero es el camino normal desde que el registro es público: quien se dio de
alta solo tiene que poder irse solo. El segundo existe para los casos que no son
la persona ejercitando su derecho —una cuenta comprometida, un pedido por otra
vía, una obligación legal— y no reemplaza al primero.

---

## 1. Baja hecha por la propia persona

### Qué se le pide

En `/configuracion/cuenta` → **Eliminar mi cuenta**, dos cosas a la vez:

- su **contraseña actual**, que prueba que es el dueño y no alguien sentado
  frente a una sesión abierta;
- escribir **`ELIMINAR`** en mayúsculas, que prueba que entendió qué apretó.

La pantalla enumera antes qué se borra y dice explícitamente que no hay vuelta
atrás. Cualquiera de las dos verificaciones que falle no borra absolutamente
nada.

### Qué se borra, exactamente

Todo en una única transacción: si algo falla, no se borra nada.

| Tabla | Qué pasa |
|---|---|
| `ImportRow`, `ImportBatch` | se borran |
| `UpcomingPayment` | se borran |
| `LedgerEntry` | se borran |
| `Transaction` | se borran (se corta antes la cadena `correctedFromId`) |
| `Investment` | se borran |
| `CreditCard` | se borran |
| `Account` | se borran |
| `Category` | se borran |
| `ManualRate` | se borran |
| `Session` | se borran (todas, en todos los dispositivos) |
| `AuthToken` | se borran (verificación, recuperación, cambio de correo) |
| `PrivateBetaInvite` creadas por esa persona | se borran |
| `PrivateBetaInvite` consumidas por esa persona | sobreviven, con `consumedById` en NULL |
| `User` | se borra |
| `AuthEvent` | **sobreviven**, con `userId` en NULL |

La bitácora es lo único que queda, y queda sin persona: la FK es `SET NULL`. Se
conserva el hecho —una cuenta se dio de baja tal día, desde tal user agent— sin
el sujeto. Es lo que permite responder después "esta cuenta, ¿se fue sola o la
dimos de baja nosotros?" sin guardar a nadie que pidió no ser guardado.

El correo queda libre: la misma dirección puede volver a registrarse desde cero.

### Por qué el orden está escrito a mano y no es una cascada

Todas las tablas financieras declaran `onDelete: Restrict` contra `User` a
propósito. Una cascada convertiría cualquier `DELETE FROM "User"` accidental —un
script de mantenimiento, un `deleteMany` con el `where` equivocado— en la
pérdida silenciosa del ledger de alguien. Con `RESTRICT` ese error falla en vez
de ejecutarse, y el único camino que borra finanzas es
`src/lib/auth/account-deletion.ts`, que dice explícitamente qué borra y en qué
orden.

El precio es que agregar una tabla nueva con `userId` **obliga** a agregarla a
`eraseUserAccount`. Si no se hace, la baja falla ruidosamente con un error de
clave foránea en vez de borrar a medias. Ese es el modo de falla que elegimos.

### Efectos sobre la sesión

El borrado ocurre primero y la cookie se limpia después. Al revés, un fallo del
borrado dejaría a la persona afuera de una cuenta que sigue existiendo. Como las
filas de `Session` ya no existen, cualquier cookie que hubiera quedado en otro
dispositivo deja de resolver en el siguiente pedido.

Termina en `/cuenta-eliminada`, que es pública: quien llega ahí acaba de perder
su sesión, y una pantalla privada lo mandaría al login sin enterarse nunca de
que la baja salió bien.

### Pruebas que lo cubren

- `src/app/configuracion/cuenta/actions.test.ts` — frase mal escrita,
  contraseña mal, borrado completo con datos financieros reales, sesión muerta,
  evento sin persona, y el correo reutilizable después.
- `src/app/journey.e2e.test.ts` — que dar de baja una cuenta no toca a la otra
  persona que está en la misma base.

---

## 2. Baja ejecutada por un operador

Todo con `pnpm db:deletions`. Cada acción exige `--confirm`; sin esa bandera el
comando simula y no escribe.

Este camino **no borra la contabilidad**: bloquea el acceso y, si se confirma,
anonimiza la identidad conservando las filas financieras. Es deliberadamente
distinto del autoservicio, porque un operador que da de baja a un tercero no
está ejerciendo el derecho de esa persona a desaparecer: está resolviendo un
incidente, y ahí la contabilidad suele hacer falta.

### Revisar los pedidos

```bash
pnpm db:deletions -- --list
```

Lista las cuentas con `User.deletionRequestedAt`. Desde que existe el
autoservicio esta lista normalmente está vacía: la aplicación ya no escribe esa
columna. Se conserva para pedidos entrados por otra vía y para las filas
históricas.

### Bloquear el acceso

```bash
pnpm db:deletions -- --user-id=<id> --block --confirm
```

- Revoca todas las sesiones vivas.
- Consume todos los tokens pendientes.
- Pone la cuenta en `SUSPENDED`: deja de poder iniciar sesión.
- Registra `SESSIONS_REVOKED` con el contexto `baja:bloqueo_acceso:<n>`.
- **Los datos financieros quedan intactos.**

Esto **no** es un borrado. No decirle a nadie que sus datos fueron eliminados.

### Anonimizar

```bash
pnpm db:deletions -- --user-id=<id> --anonymize --confirm
```

Exige que la cuenta ya esté en `SUSPENDED`. Destruye la identidad —nombre,
correo, hash de contraseña, fechas de acceso— y conserva la contabilidad, ahora
sin persona asociada. Es irreversible.

### Restaurar

```bash
pnpm db:deletions -- --user-id=<id> --restore --confirm
```

Sólo revierte un `--block`. Después de `--anonymize` no hay nada que restaurar.
