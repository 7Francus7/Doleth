# Desplegar Doleth

Guía operativa de un solo camino. No describe alternativas: describe el que está
armado y verificado.

## Cómo funciona el despliegue

Vercel construye desde `main` y Neon aloja la base.

Vercel ejecuta `vercel-build` si existe, y en este repositorio existe:

```
"vercel-build": "prisma migrate deploy && prisma generate && next build"
```

Las migraciones corren **antes** del build, en el mismo paso. Ese orden es
deliberado y resuelve el modo de falla más caro de este stack: desplegar código
que espera una columna que todavía no existe. Cuando eso pasa, la aplicación
levanta perfecto y se rompe recién cuando una persona abre una pantalla.
Poniendo la migración adelante, si falla, falla el deploy —que es exactamente lo
que uno quiere— y la versión anterior sigue sirviendo.

`build` queda sin migraciones a propósito: CI lo ejecuta con una `DATABASE_URL`
sintética y sin base, y no tiene por qué necesitar una.

`prisma migrate deploy` toma un lock de aplicación, así que dos builds
simultáneos no se pisan.

## Antes del primer despliegue

Variables en Vercel, environment Production:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | cadena de Neon de la rama `production` |
| `DOLETH_SESSION_SECRET` | 32+ caracteres aleatorios, exclusivo de producción |
| `DOLETH_APP_URL` | la URL pública, sin barra final |
| `DOLETH_EMAIL_FROM` | remitente verificado en Resend |
| `RESEND_API_KEY` | clave de Resend |
| `DOLETH_ACCESS_MODE` | `private-beta` mientras el registro público esté cerrado |

Red de salida: para que las integraciones funcionen, el entorno tiene que poder
alcanzar `dolarapi.com` y `criptoya.com` por HTTPS. Si no puede, la aplicación
**no se rompe**: sigue con la última cotización guardada y lo declara en
pantalla. Sólo se pierde la actualización automática.

## Desplegar

1. Mergear a `main`. Vercel construye y migra solo.
2. Verificar: `curl https://TU-DOMINIO/api/salud`

```json
{ "ok": true, "version": "0.1.0", "database": "up", "migrations": "al día", "pending": [] }
```

`/api/salud` es público y no expone datos: sólo si el proceso responde, si la
base contesta y qué migraciones faltan. Un `503` con `pending` lleno significa
que el código quedó adelante del esquema — el caso que el orden de `vercel-build`
está para evitar, y que igual conviene poder detectar desde afuera.

## Después del primer despliegue

1. Crear la cuenta con `pnpm beta:access` (ver
   `doleth-private-beta-access.md`).
2. Entrar y, en **Más → Integraciones**, apretar los dos botones. Ahí sale la
   cotización del dólar; sin ella, lo que esté en otra moneda queda declarado
   aparte en vez de sumarse al patrimonio.
3. Crear las cuentas en **Cuentas**, o importar un resumen en **Importar**.

## Rollback

Vercel: promover el deployment anterior.

La base es el punto delicado, porque las migraciones no se deshacen solas. Las
cuatro migraciones de este corte son **aditivas**: agregan tablas y columnas
opcionales, y no borran ni transforman nada existente. Eso significa que la
versión anterior del código sigue funcionando contra el esquema nuevo, así que un
rollback de aplicación no necesita rollback de base.

Si en algún momento hiciera falta revertir el esquema, primero un punto de
recuperación en Neon; nunca `migrate reset` contra producción.

## Migraciones de este corte

| Migración | Qué agrega | Destructiva |
|---|---|---|
| `202608080001_multicurrency_foundation` | cotizaciones, moneda de lectura, moneda por movimiento | no |
| `202608080002_credit_cards` | tipo de cuenta tarjeta y sus datos | no |
| `202608080003_import_batches` | lotes y filas de importación | no |
| `202608080004_holdings` | cantidad en tenencias y precios de instrumentos | no |

Todas verificadas aplicando desde una base vacía y corriendo dos veces seguidas
sin cambios pendientes.
