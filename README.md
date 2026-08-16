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
| `DOLETH_SESSION_SECRET` | firma de sesión, mínimo 32 caracteres aleatorios |
| `RESEND_API_KEY` | proveedor de correo; obligatoria en producción |
| `DOLETH_EMAIL_FROM` | remitente verificado en el proveedor |
| `DOLETH_APP_URL` | URL pública, para armar los enlaces de los correos |

Las cotizaciones de dólar se bajan de `dolarapi.com`. El entorno donde corra la
aplicación tiene que permitir salida HTTPS a ese host; si no, Doleth sigue
funcionando con la última cotización guardada o con la que cargue la persona, y
lo declara en pantalla.

Cada persona entra con su propia cuenta: correo y contraseña, con verificación y
recuperación por correo real. La clave única compartida de la etapa de un solo
usuario ya no existe. Ver `.env.example` para la lista completa.

El registro es **público**: cualquiera entra a `/crear-cuenta`, se registra,
confirma su correo, hace la configuración inicial y empieza. La única palanca que
lo cierra es `DOLETH_ACCESS_MODE=private-beta`, y cierra las dos puntas a la vez
—la pantalla y la Server Action—, nunca sólo la de adelante. El ciclo completo
está documentado en [docs/auth/auth-architecture.md](docs/auth/auth-architecture.md);
la baja de cuenta, en
[docs/auth/account-deletion-runbook.md](docs/auth/account-deletion-runbook.md).

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

- Los importes se almacenan como centavos enteros (`BigInt`). Nunca hay punto
  flotante en el dominio.
- Un ingreso suma y un gasto resta patrimonio.
- Una transferencia entre cuentas propias tiene efecto patrimonial cero.
- Un anulado queda visible pero no participa de saldos.
- Una corrección anula el original y crea un reemplazo enlazado.
- Los próximos pagos no alteran el ledger hasta confirmarse.
- Las inversiones se muestran aparte para evitar doble conteo con cuentas.
- El `CHECK Transaction_accounts_by_type` exige categoría en ingresos y gastos.

### Monedas

Cada cuenta y cada movimiento conservan la moneda en la que ocurrieron. La
persona elige en qué moneda **lee** su patrimonio y con qué tipo de cambio
(oficial, blue, MEP, CCL, cripto, tarjeta o el suyo propio). Esa elección es una
lente: no modifica ni un importe guardado.

La conversión ocurre una sola vez, al entrar a la capa de lectura. **Un total
incompleto nunca se presenta como total**: lo que no tiene cotización se declara
aparte en vez de contarse como cero. Ver `src/lib/finance/valuation.ts` y
`display.ts`.

Una transferencia entre monedas distintas guarda los dos importes: sale una
cantidad de pesos y entra una cantidad de dólares. Doleth pide el importe
acreditado en vez de calcularlo, porque el precio que le hicieron a esa persona
es un hecho de esa operación y no el promedio del mercado.

### Tarjetas de crédito

Una tarjeta es una cuenta de tipo `CREDIT_CARD`: su saldo es una deuda, no dinero
disponible. Gastar con ella **no** reduce "dinero en tus cuentas"; la plata sale
el día que se paga el resumen, que es una transferencia de la cuenta bancaria a
la tarjeta. `accountsMoneyCents` la excluye, `patrimonyCents` la incluye con su
signo natural y `debtCents` la nombra en positivo.

### Importación de resúmenes

`/importar` lee un CSV, propone los movimientos y **no escribe nada** hasta que se
confirma. El lote entero se guarda en una transacción y se puede deshacer:
deshacer anula, nunca borra. Todas las filas quedan registradas, incluidas las que
no se pudieron usar. Ver `src/lib/import/`.

### Inversiones

Una tenencia con cantidad y símbolo se valúa multiplicando por el último precio
conocido, así que el valor se actualiza sin que nadie toque nada. Una sin cantidad
—un inmueble— conserva el valor declarado. Cada fila dice de dónde sale su
número: precio de mercado, precio propio, o valor escrito a mano.

### Reportes

`/en-que-se-fue` desglosa el gasto del mes por categoría, comercio y medio de
pago. Las transferencias entre cuentas propias no son gasto y quedan afuera:
contarlas inflaría el total con dinero que sigue estando. Las participaciones
suman el total exacto.

## Desplegar

Vercel construye desde `main` y ejecuta `vercel-build`, que corre
`prisma migrate deploy` **antes** del build. Ese orden evita el modo de falla más
caro del stack: desplegar código que espera una columna que todavía no existe.

Después de desplegar, `GET /api/salud` responde si la base está al día. Es
público y no expone datos.

El paso a paso completo, con variables y rollback, está en
[docs/production/doleth-deploy.md](docs/production/doleth-deploy.md).

## Integraciones

En **Más → Integraciones** hay un botón por fuente externa: la cotización del
dólar (dolarapi.com) y los precios de cripto (criptoya.com). Nada corre solo por
atrás; se aprieta y trae. Si una fuente no contesta, la aplicación sigue con lo
último que tenía y lo dice.

## Operación y release

La política técnica de privacidad, observabilidad, release, rollback,
limitaciones y checklist de producción vive en
[docs/operations-v1.md](docs/operations-v1.md).

El estado congelado de C7 vive en
[docs/freeze-011-pulido-final-v1.md](docs/freeze-011-pulido-final-v1.md).
