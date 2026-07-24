# Freeze 008 — Ahora y Próximo con datos reales

Corte vertical 4 sobre datos reales. Congela `/ahora` y `/proximo` leyendo el ledger
en lugar de fixtures, con la confirmación de pagos y la continuidad de listas que
esas dos pantallas necesitan para ser usables.

## Alcance congelado

- `/ahora`: dinero en cuentas, comprometido a 30 días, proyección, cobertura,
  evidencia, movimientos recientes, cuentas, inversiones y bloque de procedencia.
- `/proximo`: línea temporal por tramos, cobertura, saldo posterior por pago,
  pagos confirmados como historia y estado vacío.
- Confirmación de un pago previsto: importe ajustable, idempotencia real, retorno
  con contexto y repetición explícita a un mes.
- Restauración de scroll en `/proximo` y `/movimientos` mediante `RestorableList`.
- Stories y fixtures de los estados de ambas pantallas.
- Tests de superficie, de cálculo puro y de invariantes transversales.

Fuera de alcance: `/actuar`, `/cambios`, `/mi-realidad`, `/progreso`, `/cuentas`,
`/inversiones` y la revisión mensual asistida.

## Definiciones financieras

Respaldadas por el esquema actual; ninguna inventa un estado que el dominio no tenga.

| Concepto | Definición |
|---|---|
| Patrimonio | Σ saldos de **todas** las cuentas, activas y archivadas. |
| Dinero en cuentas | Σ saldos de las cuentas **activas**. Base operativa. No es "líquido": el dominio no modela liquidez y nunca se presenta como tal. |
| Saldo de una cuenta | Saldo inicial + asientos de movimientos **no anulados**. |
| Comprometido | Σ importes de próximos pagos `PENDING` vencidos o dentro del horizonte. Los `PAID` ya son movimientos. |
| Proyectado | Base − comprometido. Puede ser negativo; entonces se dice "faltarían". |
| Cobertura | Parte del compromiso cubierta por la base, acotada a 0–100. El excedente se cuenta aparte. |
| Inversiones | Tabla propia. **Nunca** se suman al patrimonio ni a la base. |

Limitación declarada: `UpcomingPayment.estimatedCents` es obligatorio y no existe
discriminador fijo/estimado ni estado "omitido". No se simularon esos estados.

## Fórmulas

```
patrimonio        = Σ saldo(cuenta)                       ∀ cuenta
dineroEnCuentas   = Σ saldo(cuenta)                       ∀ cuenta activa
saldo(cuenta)     = saldoInicial + Σ asientos no anulados
horizonteFin      = hoy + 30 días civiles
comprometido      = Σ importe(pago)                       ∀ pago PENDING con vencimiento ≤ horizonteFin
proyectado        = dineroEnCuentas − comprometido
cobertura%        = min(100, max(0, cubierto × 100 / comprometido))     ; 100 si no hay compromisos
faltante          = max(0, comprometido − dineroEnCuentas)
excedente         = max(0, dineroEnCuentas − comprometido)
saldoPosterior(n) = dineroEnCuentas − Σ importe(pago₁..pagoₙ)           ; orden cronológico estable
```

Orden estable de pagos: vencimiento, luego importe mayor, luego fecha de creación,
luego id. Dos listas iguales nunca se ordenan distinto.

## Datos incluidos y excluidos

| Incluido | Excluido |
|---|---|
| Cuentas activas en la base | Cuentas archivadas (van al patrimonio, declaradas aparte) |
| Movimientos no anulados | Movimientos anulados y el original de una corrección |
| Pagos `PENDING` vencidos y dentro del horizonte | Pagos `PENDING` más allá del horizonte (declarados con importe y cantidad) |
| — | Pagos `PAID`: ya son movimientos; sumarlos sería descontar dos veces |
| — | Inversiones: dominio separado, sin cuenta espejo |
| — | Transferencias en los totales del mes: no son ingreso ni gasto |

## Estados de `/ahora`

Un solo estado por pantalla, por prioridad:

1. `no-accounts` — sin cuentas no hay lectura financiera; la acción es crear una.
2. `attention` — hay pagos vencidos; es concreto y gana sobre todo lo demás.
3. `uncovered` — los pagos cargados superan el dinero de las cuentas.
4. `incomplete` — falta información; se declara antes de afirmar tranquilidad.
5. `stable` — situación registrada y al día.

Cada estado ofrece **una** acción principal: crear cuenta, revisar próximos pagos o
registrar un movimiento.

## Timeline de `/proximo`

Tramos en orden de lectura, sin mostrar los vacíos: `overdue`, `today`, `tomorrow`,
`this-week` (≤ 7 días), `rest-of-month`, `next-month`, `later`. El orden de
evaluación es la definición: un pago a tres días es "esta semana" aunque caiga en
el mes siguiente.

Cada pago muestra fecha, cuenta, estado (`Vencido`, `Vence hoy`, `Pendiente`,
`Pagado` — texto, no solo color) e importe, más el saldo que quedaría después de
pagarlo y todo lo anterior. Los confirmados van en su propia sección, declarados
como fuera de cobertura y proyección.

## Cobertura

Nunca divide por cero y nunca supera 100. Sin compromisos la cobertura es 100 y no
hay motivo para alarmar. El excedente se explica con texto para que la barra no
mienta. Cada medidor lleva su equivalente accesible en texto.

## Proyección

`base − comprometido`, con horizonte de 30 días civiles declarado en la propia
pantalla ("hasta el domingo 23 de agosto"). Lo que queda fuera del horizonte se
declara con cantidad e importe en vez de desaparecer. El resultado se presenta como
aproximado porque los importes de próximos pagos son previstos.

## Confirmación de pago

- El importe es ajustable al confirmar: `estimatedCents` guarda lo previsto, el
  movimiento guarda lo que realmente salió.
- No se aceptan fechas futuras.
- La cuenta prevista debe seguir activa.
- El pago previsto nunca se convierte solo: siempre hace falta confirmación humana.
- Repetir un pago un mes adelante es una acción explícita; el día se acota al último
  día real del mes destino.

## Idempotencia

La clave `upcoming-payment:<id>` es única en el ledger. Un reintento, un doble
submit o dos envíos en paralelo no pueden crear un segundo gasto: la carrera perdida
devuelve `P2002` y la acción responde con el movimiento que ya existe, no con un
mensaje genérico. El movimiento y el cambio de estado del pago ocurren en la misma
transacción.

## Reconciliaciones verificadas

Escenario del QA (3 cuentas activas, 1 archivada, 5 movimientos con anulado y
transferencia, 6 pagos pendientes, 1 confirmado, 1 inversión):

| Magnitud | Esperado | Observado |
|---|---|---|
| Dinero en cuentas | 1.153.700 | 1.153.700 |
| Patrimonio (con archivada) | 1.193.700 | 1.193.700 |
| Comprometido 30 días (5 pagos) | 535.900 | 535.900 |
| Proyectado | 617.800 | 617.800 |
| Fuera del horizonte | 1 pago / 73.000 | 1 pago / 73.000 |
| Pendientes totales `/proximo` | 608.900 | 608.900 |
| Saldo final tras todos los pendientes | 544.800 | 544.800 |
| Gastos del mes (sin el anulado) | 135.000 | 135.000 |
| Inversiones (fuera del patrimonio) | 241.500 | 241.500 |

Transferencia de 50.000 entre cuentas propias: patrimonio sin cambio. Movimiento
anulado de 19.900: fuera del saldo y del mes, visible en el historial como
"Anulado". Caso descubierto: con comprometido 2.220.900 el proyectado da −1.067.200
y se lee como faltante.

## QA con PostgreSQL descartable

El QA de escritura y lectura corrió contra una base PostgreSQL efímera en memoria
(PGlite por wire protocol en `127.0.0.1:55432`), nunca contra la base real. El
harness vive en `.qa-tmp/` y está **ignorado por git**: servidor, seed, variantes de
estado y extractor de texto de las rutas ya autenticadas.

Para reproducirlo hay que instalar sus dependencias temporales a mano:

```bash
pnpm add -D @electric-sql/pglite @electric-sql/pglite-socket
```

El servidor aplica las migraciones de Prisma en orden y siembra la categoría
`other-expense`. El multiplexor debe aceptar varias conexiones (`maxConnections`),
porque el pool de Prisma abre más de una y PGlite es de conexión única.

## Bugs encontrados y corregidos

1. **Proyectado negativo presentado como saldo positivo.** Con compromisos por
   encima de la base, `/ahora` decía "quedarían aproximadamente $1.067.200" siendo
   −1.067.200. Ahora dice "Los pagos cargados superan tu dinero: faltarían $…" y la
   fila pasa de `Quedarían` a `Faltarían`, alineado con `/proximo`.
2. **Concordancia en lo excluido del horizonte.** "Quedan 1 pago … no están
   incluidos acá" → "Queda 1 pago … no está incluido acá".
3. **Conteo de cuentas inconsistente.** El bloque de procedencia decía "4 cuentas
   registradas" mientras la pantalla listaba 3: contaba la archivada. Ahora dice
   "3 cuentas activas y 1 archivada fuera de esta lectura".

## Breakpoints validados

320 px y 390 px sobre 9 stories (5 de `/ahora`, 4 de `/proximo`), midiendo dentro de
un iframe del ancho exacto: `scrollWidth == clientWidth` en las nueve, sin desborde
horizontal de página. El único desborde es el carrusel de cuentas, intencional y
contenido en su propio scroller.

## Tests y comandos

```bash
pnpm lint
pnpm typecheck
pnpm test              # 350 pruebas, 21 archivos
pnpm build
pnpm build-storybook
git diff --check
```

Las seis validaciones corrieron **después de cada commit**, con el árbol reducido al
contenido de ese commit, y los cuatro quedaron verdes de forma independiente:

| Commit | Pruebas |
|---|---|
| `feat(now)` | 298 |
| `feat(upcoming)` timeline | 309 |
| `feat(upcoming)` confirmación | 338 |
| `test(finance)` transversales | 350 |

Archivos de prueba propios del corte: `src/lib/finance/projection.test.ts`,
`src/lib/finance/upcomingConfirmation.test.ts`, `src/app/now-surface.test.ts`,
`src/app/upcoming-surface.test.ts`, `src/app/financial-invariants.test.ts`, más las
actualizaciones de `access-navigation.test.ts` y `layering-and-scroll.test.ts`.

## Declaraciones explícitas

- **Cuentas no recibió restauración de scroll.** `RestorableList` se aplicó a
  `/proximo` y `/movimientos`; `/cuentas` sigue sin memoria de posición.
- **`src/features/next/index.ts` mantiene una dependencia transitiva hacia los
  fixtures** (`export * from "./fixtures"`), y `/proximo` importa `NextPage` desde
  ese barrel. El build la elimina por tree-shaking, pero la dependencia existe en el
  grafo de módulos. Queda como deuda; `/ahora` ya importa directo del módulo.
- **`formatCents` ahora delega globalmente en `formatCentsAR`.** Es una corrección
  transversal intencional: la versión anterior pasaba por `Number` y perdía
  precisión con importes grandes ("12.500,5" donde el resto de la app mostraba
  "12.500,50"). Validada en todo el producto con la suite completa y el build.
- **`.qa-tmp/` está ignorado y las dependencias temporales de PGlite fueron
  retiradas** de `package.json` y `pnpm-lock.yaml`.
- **Sin cambios en Prisma ni migraciones**, sin cambios en las dependencias finales,
  sin secretos tocados, sin cambios en producción, **sin push y sin deploy**.

## Deuda restante

- `/cuentas` sin restauración de scroll.
- Barrel de `features/next` exportando fixtures.
- El horizonte de 30 días es fijo y no configurable desde la pantalla.
- El dominio no modela recurrencia: repetir un pago sigue siendo manual y a un mes.
- No hay discriminador fijo/estimado ni estado "omitido" para un próximo pago.
- Los pagos confirmados se listan de a 5; no hay paginación de la historia.
- Falta la revisión mensual asistida (ASI-02) y las colecciones secundarias de
  `/mi-realidad`.

## Commits del corte

```
2185ae0  feat(now): clarify current committed and projected money
3c7823b  feat(upcoming): add payment timeline and coverage
366590d  feat(upcoming): refine payment confirmation and continuity
ec84528  test(finance): cover cross-surface financial invariants
```

Más este documento como quinto commit. Rama `claude/corte-4-ahora-proximo`, local.

## Veredicto

**FROZEN** — todos los criterios del Corte 4 quedaron verificados: reconciliación
contra datos reales, estados de las dos pantallas, idempotencia de la confirmación,
breakpoints 320/390, seis validaciones verdes por commit y ausencia de residuos de
QA en el producto. Sin push, sin merge, sin deploy.
