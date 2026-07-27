# Procedimiento operativo de baja de cuentas

Última actualización: 27 de julio de 2026

La baja en Doleth es **manual y en dos etapas**. Es una decisión consciente: no
queremos un borrado automático sobre datos financieros. Lo que sí es obligatorio
es que el proceso sea verificable y que nunca le diga a nadie algo que no pasó.

---

## Lo que ve la persona

En `/configuracion/cuenta` puede **solicitar** la baja. Para eso necesita escribir
`ELIMINAR` y su contraseña actual. La aplicación:

- registra `User.deletionRequestedAt`,
- deja un evento `ACCOUNT_DELETION_REQUESTED` en la bitácora,
- **no borra ni bloquea nada**,
- muestra que el pedido está registrado y ofrece cancelarlo.

La pantalla dice literalmente que el pedido se procesa a mano. Nunca aparece
"tus datos fueron eliminados".

## Lo que hace quien opera

Todo con `pnpm db:deletions`. Cada acción exige `--confirm`; sin esa bandera el
comando simula y no escribe.

### 1. Revisar los pedidos

```bash
pnpm db:deletions -- --list
```

Muestra, por cada pedido: id, correo enmascarado, estado, fecha del pedido, fecha
de alta y la huella financiera (cuántas filas hay en cada tabla). La huella es lo
que permite decidir con información en vez de a ciegas.

### 2. Bloquear el acceso

```bash
pnpm db:deletions -- --user-id=<id> --block --confirm
```

- Revoca todas las sesiones vivas.
- Consume todos los tokens pendientes.
- Pone la cuenta en `SUSPENDED`: deja de poder iniciar sesión.
- Registra `SESSIONS_REVOKED` con el contexto `baja:bloqueo_acceso:<n>`.
- **Los datos financieros quedan intactos.**

Se niega a ejecutarse si el usuario no tiene un pedido de baja registrado: no se
bloquea a nadie sin pedido.

Esta etapa es **reversible**:

```bash
pnpm db:deletions -- --user-id=<id> --restore --confirm
```

### 3. Anonimizar (irreversible)

Sólo después de bloquear, y sólo si la política aprobada lo indica:

```bash
pnpm db:deletions -- --user-id=<id> --anonymize --confirm
```

- Borra sesiones y tokens.
- Reemplaza nombre y correo por valores anónimos
  (`anonimizado+<id>@doleth.invalid`).
- Pone un hash de contraseña imposible de satisfacer.
- Deja la cuenta en `DELETED`.
- Borra el `emailHash` de la bitácora: los eventos sobreviven, la persona no.
- **Conserva la contabilidad**, ahora sin persona asociada.

Se niega si la cuenta no está `SUSPENDED`, para no anonimizar con una sesión viva.

### Por qué se conserva la contabilidad

Las claves foráneas de las seis tablas financieras hacia `User` son `RESTRICT`.
Verificado en el ensayo: `DELETE FROM "User"` sobre una cuenta con datos falla
con

```
ERROR: update or delete on table "User" violates foreign key constraint
       "Account_userId_fkey" on table "Account"
```

Es decir: **no existe forma de borrar un usuario y arrastrar sus finanzas por
cascada, ni por accidente ni a mano.** Para destruir también la contabilidad hace
falta un paso separado, explícito y documentado, que este comando no hace.

## Registro

Cada etapa deja un evento en `AuthEvent` con su contexto. La secuencia completa
de una baja queda reconstruible:

```sql
SELECT type, context, "createdAt" FROM "AuthEvent"
WHERE "userId" = '<id>' ORDER BY "createdAt";
```

## Lo que todavía no existe

Se documenta como deuda, no se disimula:

- **Exportación de datos antes de la baja.** La política de privacidad lo dice
  con esas palabras: "Todavía no está disponible… Es una deuda reconocida, no
  una función que exista y no encuentres."
- **Período de gracia automático.** Hoy el tiempo entre el pedido y su ejecución
  lo define quien opera. No hay temporizador.
- **Plazo de destrucción de la contabilidad anonimizada.** Requiere decisión
  humana; está listado como pendiente en `/privacidad`.
- **Aviso por correo al procesar la baja.** Hoy la persona no recibe
  confirmación automática.

## Matriz de estados

| Estado | Puede entrar | Datos financieros | Identidad | Reversible |
| --- | --- | --- | --- | --- |
| `ACTIVE` + pedido registrado | sí | intactos | intacta | sí, desde la app |
| `SUSPENDED` (bloqueado) | no | intactos | intacta | sí, con `--restore` |
| `DELETED` (anonimizado) | no | conservados sin persona | destruida | **no** |
