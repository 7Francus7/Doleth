# Corte Vertical 007 — Operación

## Primera puesta en marcha

1. Crear una base PostgreSQL en Neon.
2. Copiar `.env.example` a `.env.local` y completar:
   - `DATABASE_URL`: conexión PostgreSQL con TLS.
   - `DOLETH_ACCESS_PASSWORD`: frase personal de 12 o más caracteres.
   - `DOLETH_SESSION_SECRET`: secreto aleatorio de 32 o más caracteres.
3. Ejecutar:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

La migración crea el ledger y sus restricciones. El seed solo crea las categorías iniciales; no agrega cuentas ni movimientos simulados.

## Datos reales para empezar

Entrar a `/cuentas/nueva` y cargar, por cada cuenta:

- nombre;
- tipo;
- saldo real al momento de iniciar;
- moneda `ARS`.

Después registrar ingresos, gastos y transferencias desde `/movimientos/nuevo`. No volver a editar el saldo inicial para reconciliar diferencias: corregir o anular el movimiento correspondiente.

## Despliegue

Configurar las tres variables en el entorno de producción, ejecutar `pnpm db:migrate` y `pnpm db:seed` contra esa base, y recién entonces desplegar. Para trabajar con Vercel desde terminal, instalar CLI con `npm i -g vercel`; eso habilita `vercel env pull`, `vercel deploy` y `vercel logs`.
