# Doleth

Doleth es una aplicación financiera personal, privada y mobile-first. Su
ledger conserva movimientos, transferencias, anulaciones y correcciones
auditables; las pantallas analíticas derivan sus lecturas de esa misma verdad.

## Requisitos

- Node.js 22 o posterior.
- pnpm 11.
- PostgreSQL compatible con las migraciones de `prisma/migrations`.

## Configuración local

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Variables obligatorias:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | conexión PostgreSQL del entorno |
| `DOLETH_ACCESS_PASSWORD` | clave privada, mínimo 12 caracteres |
| `DOLETH_SESSION_SECRET` | firma de sesión, mínimo 32 caracteres aleatorios |

No se deben versionar valores reales. En producción, la cookie es `HttpOnly`,
`SameSite=Lax` y `Secure` bajo HTTPS.

## PostgreSQL descartable

Para QA local puede usarse una instancia efímera, nunca la base real:

```bash
docker run --rm --name doleth-qa \
  -e POSTGRES_PASSWORD=postgres \
  -p 55432:5432 postgres:17
```

En otra terminal:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres \
  pnpm db:migrate
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres \
  pnpm db:seed
```

El QA de C7 usó PGlite por wire protocol en ese mismo puerto mediante un
harness temporal ignorado por Git. No se agregó ninguna dependencia de QA al
proyecto.

## Comandos de calidad

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm build-storybook
pnpm storybook
```

Para probar el build de producción:

```bash
pnpm build
pnpm start
```

## PWA y offline

La PWA es instalable y ofrece offline de nivel 1:

- cachea la shell de desconexión, iconos y assets estáticos;
- las navegaciones siempre consultan la red;
- nunca cachea HTML financiero privado, acciones ni exportaciones;
- sin red muestra una página explícita y no presenta datos viejos como actuales;
- una actualización nueva pide confirmación y no recarga dentro de formularios.

Validación manual:

1. ejecutar el build bajo `localhost` o HTTPS;
2. revisar `manifest.webmanifest`, iconos 192/512 y service worker;
3. cargar `/ahora`, detener el servidor y navegar a otra ruta;
4. confirmar que aparece “Estás sin conexión” sin datos financieros;
5. restaurar el servidor y usar “Reintentar”.

## Privacidad y datos

En **Más → Ocultar importes**, la preferencia se guarda solo en el dispositivo.
No modifica cálculos, servidor ni inputs en edición. En **Más → Tus datos** se
pueden descargar CSV de movimientos, cuentas, próximos pagos e inversiones, y
una copia JSON.

La copia JSON es para consulta y conservación externa. No existe importación ni
restauración en esta versión, por lo que Doleth no la llama “backup completo”.
El formato se documenta en
[docs/data-export-format-v1.md](docs/data-export-format-v1.md).

## Modelo financiero

- Los importes se almacenan como centavos enteros (`BigInt`).
- Un ingreso suma y un gasto resta patrimonio.
- Una transferencia entre cuentas propias tiene efecto patrimonial cero.
- Un anulado queda visible pero no participa de saldos.
- Una corrección anula el original y crea un reemplazo enlazado.
- Los próximos pagos no alteran el ledger hasta confirmarse.
- Las inversiones se muestran aparte para evitar doble conteo con cuentas.
- El `CHECK Transaction_accounts_by_type` exige categoría en ingresos y gastos.

## Operación y release

La política técnica de privacidad, observabilidad, release, rollback,
limitaciones y checklist de producción vive en
[docs/operations-v1.md](docs/operations-v1.md).

El estado congelado de C7 vive en
[docs/freeze-011-pulido-final-v1.md](docs/freeze-011-pulido-final-v1.md).
