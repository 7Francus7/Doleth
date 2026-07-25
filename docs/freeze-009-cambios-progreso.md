# Freeze 009 — Cambios y Progreso

Corte vertical 5. Congela `/cambios` y `/progreso` como superficies que explican la
evolución financiera real: qué cambió y por qué, y qué aspecto mejora o empeora
contra un período comparable. Sin gráficos decorativos, sin juicios y sin métricas
que el dominio no pueda sostener.

## Alcance congelado

- `/cambios`: conclusión del período, comparación contra la ventana anterior
  equivalente, causas agrupadas y reconciliadas, transferencias declaradas aparte,
  evidencia ampliable y estados honestos.
- `/progreso`: comparación entre tramos equivalentes, dos a cuatro indicadores
  factuales con fórmula y denominador, hitos verificables sin celebración y
  degradación declarada.
- Navegación interna en las tres superficies analíticas (`/cambios`, `/progreso`,
  `/mi-realidad`): sin recarga completa de la app.
- Filtro por categoría en `/movimientos`, que es lo que consume el detalle de cada
  causa.
- Stories, fixtures y tests de los estados de ambas pantallas.

Fuera de alcance, sin excepción: gamificación, rachas, puntos, comparación social,
IA, recomendaciones de inversión, presupuestos, motor de metas, notificaciones,
cierre mensual, exportaciones, conexión bancaria, migraciones y rediseño de otras
superficies.

## Definiciones

| Concepto | Definición |
|---|---|
| Ventana de `/cambios` | Los últimos 7 días civiles, hoy incluido. |
| Ventana anterior | Los 7 días inmediatamente previos, sin solapamiento. |
| Tramo de `/progreso` | Del día 1 del mes hasta hoy. |
| Tramo anterior | Los **mismos días** del mes anterior, acotados a su último día real. |
| Movimiento patrimonial | No anulado y no transferencia. |
| Cambio neto | Σ (ingresos − gastos) patrimoniales de la ventana. |
| Patrimonio inicial | Patrimonio actual − cambio neto. Reconcilia por construcción. |
| Causa | Categoría agrupada; sin categoría, se agrupa por tipo. |
| Bruto movido | Σ \|efecto\| de todas las causas. Denominador de la participación. |
| Materialidad | Una causa es material desde el 20 % del bruto movido. |
| Tolerancia de estabilidad | 1 % del patrimonio inicial, con piso de $5.000. |
| Cobertura | Dinero en cuentas activas sobre compromisos del horizonte de 30 días. La misma que `/ahora`. |
| Consistencia | Días con registro sobre días transcurridos del tramo. |

## Fórmulas

```
ventana            = [hoy − 6, hoy]
ventanaAnterior    = [inicio − 7, inicio − 1]
tramoActual        = [día 1 del mes, hoy]
tramoAnterior      = [día 1 del mes anterior, min(hoy.día, últimoDíaMesAnterior)]

neto               = Σ ingresos − Σ gastos           ; no anulados, sin transferencias
patrimonioInicial  = patrimonioActual − neto
porcentaje         = neto × 100 / patrimonioInicial  ; solo si patrimonioInicial > 0
umbralEstable      = max($5.000, patrimonioInicial / 100)
causa(categoría)   = Σ efectos con signo de sus movimientos
participación      = |causa| × 100 / Σ|causas|
Σ causas visibles + Otros = neto                     ; invariante
diferenciaTramos   = netoActual − netoAnterior
consistencia       = díasConRegistro × 100 / díasTranscurridos
cobertura          = min(100, cubierto × 100 / comprometido)
```

## Datos incluidos y excluidos

| Incluido | Excluido |
|---|---|
| Movimientos no anulados de la ventana | Anulados y el original de una corrección |
| Ingresos y gastos | Transferencias entre cuentas propias (se declaran aparte) |
| Todas las cuentas para el patrimonio | — |
| Cuentas activas para la cobertura | Cuentas archivadas en la base de cobertura |
| Compromisos pendientes del horizonte | Pagos ya confirmados: son movimientos |

## Comparaciones

Se evaluaron las tres alternativas del corte:

| Comparación | Decisión |
|---|---|
| Últimos 7 días contra los 7 anteriores | **Primaria en `/cambios`.** Ventanas de igual longitud, sin solapamiento y con evidencia suficiente. |
| Mes en curso contra el mismo tramo del mes anterior | **Primaria en `/progreso`.** Responde "voy mejor o peor que el mes pasado" sin comparar un mes parcial contra uno completo. |
| Situación actual contra el inicio de mes | Descartada como pantalla propia: ya está contenida en el tramo de `/progreso` y agregar un selector no aportaba una lectura nueva. |

No hay selector de períodos: una comparación primaria por pantalla alcanza. Cuando
el mes anterior es más corto que el día de hoy, el tramo se acota a su último día
real y la pantalla lo declara en vez de comparar desiguales.

## Cambios: síntesis y estados

La pantalla abre con la conclusión: *"Del 19 de julio al 25 de julio tenés $28.300
más"*, y debajo el período, el valor inicial, el valor final, la diferencia y el
porcentaje cuando el denominador es válido.

| Estado | Cuándo | Etiqueta |
|---|---|---|
| `no-base` | Sin cuentas registradas | Sin base |
| `no-previous` | El historial empieza después del período anterior | Primer período |
| `partial` | El historial arranca dentro del período anterior | Parcial |
| `stable` | \|neto\| < umbral de materialidad | Estable |
| `up` / `down` | Por encima del umbral | Sube / Baja |

El estado viaja como texto además de color. El umbral se justifica solo: relativo
para que un patrimonio grande no se alarme por un café, con piso absoluto para que
uno chico no llame material a cualquier cosa.

## Causas

Se agrupan por categoría, se ordenan por impacto absoluto y se muestran hasta
cuatro; el resto se junta en "Otros", que no tiene detalle navegable porque no es
un filtro real. La suma de las causas visibles más "Otros" da exactamente el neto:
ocultar detalle nunca pierde plata.

Cada causa declara su participación **sobre el bruto movido** —nunca un porcentaje
sin denominador— y cuántos movimientos la componen. Solo se destaca la que supera
el 20 %.

El detalle enlaza al historial filtrado por categoría **solo cuando la ventana cae
entera dentro de un mes**: el historial filtra por mes, así que en una ventana que
cruza dos meses el enlace mostraría menos de lo que la causa suma. En ese caso no
se ofrece enlace.

Las transferencias se mencionan en su propia línea —"También moviste $50.000 entre
tus cuentas"— y nunca aparecen como causa.

## Evidencia

"Ver cómo se calculó" abre la evidencia con el período, el patrimonio inicial, lo
que entró, lo que salió, cuántas transferencias quedaron fuera y por qué, y la
aclaración de que anulados y originales corregidos no participan. Las líneas son
las causas y el total es el cambio neto: el validador de evidencia exige que
reconcilien.

## Progreso: indicadores

Entre dos y cuatro, cada uno con nombre, lectura, fórmula, referencia y estado:

| Indicador | Fórmula | Denominador | Dirección |
|---|---|---|---|
| Resultado del período | Ingresos − gastos no anulados, sin transferencias | — | **Ninguna**: gastar más no es retroceso si el gasto estaba previsto |
| Consistencia de registro | Días con registro / días transcurridos | Días del tramo | Más es mejor |
| Cobertura de próximos pagos | Cuentas activas / compromisos a 30 días | Comprometido | Más es mejor |
| Pagos vencidos | Pendientes con fecha pasada | — | Menos es mejor |

Los dos últimos aparecen solo cuando existen compromisos o vencidos.

## Interpretación

Factual y sin juicio: *"El resultado de este tramo es $171.300 mayor que el del
mismo tramo del mes anterior"*, *"Registraste actividad en 8 de 25 días"*, *"Tenés
cubierto el 100% de los $124.400 comprometidos"*. No hay "vas excelente", "salud
financiera" ni "deberías". Sin tramo anterior con movimientos no se afirma mejora
ni retroceso.

## Hitos

Cinco, todos verificables contra el estado actual: primer período comparable,
patrimonio positivo, cobertura completa, sin pagos vencidos y registro sostenido.

No hay persistencia para recordar cuáles ya se vieron, así que **no se celebran**:
se muestran como información estable, con su marca de alcanzado o no y un texto
que dice qué falta. No se creó una migración para poder animar un check.

## Metas

Se inspeccionó el dominio: **no existe modelo de metas** (`schema.prisma` no tiene
tabla ni campo). No se construyó un sistema completo ni una meta calculada que
pudiera confundirse con un dato persistido. Queda documentado como deuda para un
corte propio.

## Navegación

`/cambios`, `/progreso` y `/mi-realidad` dejaron de usar
`window.location.assign("/actuar")`. Las acciones navegan con el router de Next y
cada una declara su destino según el estado; el detalle de cada causa es un `<Link>`
real que conserva el contexto de retorno. No hay recarga completa ni pérdida de
layout.

`/ahora` y `/proximo` siguen usando `window.location.assign`: son superficies del
corte anterior y quedan como deuda.

## Resiliencia

| Falla | Comportamiento |
|---|---|
| Ledger o cuentas | Rompe y muestra el error boundary: sin base no hay lectura que dar. |
| Desglose por causas | La pantalla dice "Pudimos calcular el cambio total, pero no cargar su desglose por causas" y omite el bloque. |
| Próximos pagos en `/progreso` | Declara que la cobertura queda fuera de esta lectura y no la muestra. |

## QA con PostgreSQL descartable

Base efímera en memoria (PGlite por wire protocol en `127.0.0.1:55432`), nunca
contra la base real. Harness en `.qa-tmp/`, ignorado por git. Las dependencias
temporales se instalan a mano y se retiran antes de commitear:

```bash
pnpm add -D @electric-sql/pglite @electric-sql/pglite-socket
```

Escenario sembrado: 2 cuentas activas + 1 archivada, 6 categorías, dos períodos
comparables, transferencia, movimiento anulado, corrección enlazada a su original,
4 pagos pendientes y 1 vencido.

## Reconciliación

### Cambios — ventana del 19 al 25 de julio

| Período | Inicial | Ingresos | Gastos | Neto | Final | Reconcilia |
|---|---:|---:|---:|---:|---:|---|
| 19–25 jul | 1.203.000 | 120.000 | 91.700 | +28.300 | 1.231.300 | ✅ `1.203.000 + 120.000 − 91.700 = 1.231.300` |
| 12–18 jul | — | 0 | 42.000 | −42.000 | — | ✅ |

### Causas del período

| Causa | Importe | Movimientos |
|---|---:|---:|
| Sueldo | +120.000 | 1 |
| Supermercado | −64.000 | 3 |
| Transporte | −18.700 | 1 |
| Salud | −9.000 | 1 |
| **Σ causas** | **+28.300** | **6** |

✅ `Σ causas = neto`. La transferencia de $50.000 y el gasto anulado de $99.000
quedan fuera; de la corrección solo pesa el reemplazo de $18.000.

### Progreso — 1 al 25 de julio contra 1 al 25 de junio

| Indicador | Actual | Referencia | Diferencia | Fórmula |
|---|---:|---:|---:|---|
| Resultado del tramo | 451.300 | 280.000 | +171.300 | Ingresos − gastos no anulados, sin transferencias |
| Consistencia | 8 de 25 (32%) | 3 de 25 | +5 días | Días con registro / días transcurridos |
| Cobertura | 100% | — | — | 1.191.300 de cuentas activas / 124.400 comprometidos |
| Pagos vencidos | 1 | — | — | Pendientes con fecha anterior a hoy |

## Runtime y responsive

Rutas verificadas con datos reales en los estados: completo, primer período
comparable, estable bajo el umbral y sin cuentas. Los cuatro dan los números de las
tablas de arriba.

Breakpoints sin desborde horizontal (`scrollWidth == clientWidth`), medidos dentro
de un iframe del ancho exacto:

| Ancho | Stories verificadas |
|---|---|
| 320 | 6 de Cambios + 5 de Progreso |
| 390 | 6 de Cambios + 5 de Progreso |
| 768 / 1024 / 1440 | Causas numerosas y Retroceso |

## Bugs encontrados y corregidos

1. **Storybook no montaba ninguna pantalla que navegue.** `useRouter` rompía cada
   story con "invariant expected app router to be mounted" y `build-storybook`
   pasaba igual, porque solo compila. El preview provee el contexto del app router
   y un test lo protege.
2. **Rangos de fecha con lenguaje relativo**: "del 19 de julio al Hoy, 25 de julio".
   Los períodos usan ahora un formateador sin "Hoy"/"Ayer", que se siguen usando en
   fechas sueltas.
3. **El primer período comparable mostraba "Sin base"**, que es otro estado. Cada
   estado tiene su etiqueta y la comparación se declara parcial mientras no cubra un
   período anterior completo.
4. **Concordancia**: "1 pago vencido sigue pendientes de confirmar".
5. **Cobertura redondeada a favor**: 73,99 % se muestra como 73, nunca 74.

## Tests y comandos

```bash
pnpm lint
pnpm test              # 446 pruebas, 27 archivos
pnpm exec tsc --noEmit
pnpm build
pnpm build-storybook
git diff --check
```

Las seis validaciones corrieron después de cada commit, con el árbol reducido al
contenido de ese commit:

| Commit | Pruebas |
|---|---|
| `feat(changes)` | 377 |
| `feat(progress)` | 413 |
| `feat(analysis)` navegación | 429 |
| `test(analysis)` transversales | 445 |
| `fix(analysis)` hallazgos de QA | 446 |

Archivos de prueba del corte: `changePeriods.test.ts`, `progressPeriods.test.ts`,
`changes-surface.test.ts`, `progress-surface.test.ts`, `analytic-navigation.test.ts`,
`cross-surface-consistency.test.ts`.

## Declaraciones explícitas

- **Sin cambios en Prisma ni migraciones.** El ledger quedó intacto: el corte solo
  lee.
- **Sin dependencias nuevas.** Las de QA se instalaron y se retiraron; `.qa-tmp/`
  sigue ignorado.
- **Sin secretos tocados, sin escritura en producción, sin push y sin deploy.**
- **`computeChanges` y `computeProgress` se eliminaron** de `analysis.ts`: los
  reemplaza `comparison.ts`, que compara períodos de verdad.
- **`/cuentas`, `/ahora` y `/proximo` siguen sin navegación interna**; el barrel de
  `features/next` sigue exportando fixtures. Deuda anterior, no tocada acá.

## Deuda restante

- Metas: no hay modelo en el esquema; requiere su propio corte con migración.
- `window.location.assign` en `/ahora`, `/proximo` y `MovementForm`.
- `FinancialRow` navegable usa `<a>` en vez de `next/link`: recarga la app en las
  listas de `/ahora` y `/proximo`.
- El barrel `features/next/index.ts` exporta fixtures.
- El horizonte de cobertura sigue fijo en 30 días.
- No hay historial de pagos vencidos: no se puede afirmar "dos vencidos menos que
  el mes pasado".
- `/movimientos` filtra por mes, así que una ventana que cruza meses no ofrece
  detalle por causa.
- Sin persistencia de hitos vistos, no hay celebración de hito.

## Commits del corte

```
a64294d  feat(changes): explain period changes with reconciled causes
3d5ead1  feat(progress): add factual progress indicators
dfb9301  feat(analysis): improve evidence and internal navigation
c3b51cd  test(analysis): cover changes and progress states
965a4ad  fix(analysis): close runtime QA findings
```

Más este documento. Rama `claude/corte-5-cambios-progreso`, local.

## Veredicto

**READY** — `/cambios` explica la diferencia con causas reconciliadas, las
comparaciones usan períodos válidos y los datos parciales se declaran; `/progreso`
usa métricas factuales con denominador visible y sin juicios; las transferencias no
aparecen como progreso ni pérdida; anulados y originales corregidos no cuentan; la
navegación analítica no recarga la app; 320 y 390 pasan; el QA con PostgreSQL
descartable reconcilia; tests y builds pasan; cada commit quedó verde por separado y
el árbol quedó limpio. Sin push, sin merge automático, sin deploy.
