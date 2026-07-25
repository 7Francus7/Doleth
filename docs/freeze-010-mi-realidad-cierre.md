# Freeze 010 — Mi realidad y cierre financiero

Corte 6. Rama `claude/corte-6-mi-realidad-cierre`, local, sin push y sin deploy.

`/mi-realidad` pasa de una lista de dominios a una explicación ordenada de la
composición financiera registrada, y nace `/mi-realidad/cierre`: una revisión
mensual guiada, informativa y auditable que no cierra nada.

---

## 1. Veredicto

**READY**

- Mi realidad explica de qué está compuesto el dinero, dónde está, qué queda
  fuera del uso cotidiano, qué está comprometido, qué pasó en el mes y qué falta.
- Cuentas activas y archivadas se distinguen; las archivadas conservan su
  historia y siguen dentro del patrimonio, declarado.
- Las inversiones no se duplican: dominio separado, con la razón escrita.
- Los compromisos se muestran aparte y nunca se restan del patrimonio.
- La calidad de la información usa señales explícitas con denominador visible.
  No se afirma completitud absoluta en ningún estado.
- El cierre usa meses civiles válidos, reconcilia, y no altera el ledger.
- Transferencias, anulados y originales corregidos no cuentan en ningún cálculo.
- No quedan recargas internas completas en ninguna superficie.
- El barrel de Próximo ya no expone fixtures a producción, y ahora hay un
  guardrail que sigue el grafo real de imports.
- 320 / 390 / 768 / 1024 / 1440 sin desborde; accesibilidad verificada.
- QA con PostgreSQL descartable reconcilia contra la aritmética esperada.
- Tests y builds pasan; cada commit quedó verde; el árbol quedó limpio.

---

## 2. Integración previa

| Dato | Valor |
|---|---|
| HEAD inicial | `8e1b7e5` |
| Rama | `claude/corte-6-mi-realidad-cierre` |
| Working tree inicial | limpio |
| Tests al empezar | 446 |
| Tests al terminar | 601 |

---

## 3. Diagnóstico

### Modelo anterior de Mi realidad

| Dimensión | Estado antes del corte |
|---|---|
| Patrimonio | `Σ saldos de todas las cuentas`. Correcto y reconciliado. |
| Activas / archivadas | Sumadas en una sola fila; separadas solo en "dominios". |
| Inversiones | Dominio separado, sin doble conteo. Correcto. |
| Compromisos | **Σ de todos los PENDING, sin horizonte.** Inconsistente con `/ahora` y `/progreso`, que usan 30 días. |
| Completitud | `Math.round(metSignals / 5 * 100)` mostrado como porcentaje. |
| Señal "tiene inversión" | Contaba no invertir como información faltante. |
| Actividad del período | Ausente: la pantalla no decía ingresos, gastos ni resultado. |
| Última actividad por cuenta | Ausente. |
| Evidencia | Solo saldos. Sin fórmula, sin excluidos, sin horizonte. |
| Inversiones caídas | `resilientList` degradaba a `[]`: un fallo se leía como "no tenés". |
| Compromisos caídos | Sin resiliencia: rompían la pantalla entera. |

### Riesgos de doble conteo encontrados

Ninguno en el patrimonio: las inversiones viven en su propia tabla y no tienen
cuenta espejo. El riesgo real era el opuesto —**restar dos veces**— si los
compromisos se hubieran descontado del patrimonio además de mostrarse en la
proyección de `/ahora`. No ocurría y ahora está declarado en pantalla.

### Deuda encontrada y cerrada en este corte

1. `features/next/index.ts` reexportaba fixtures; `/proximo` importaba ese barrel.
2. `features/act/evidence/index.ts` reexportaba su fixture; `ActPage` lo importa.
3. `window.location.assign` en `NowPage`, `NextPage` y `MovementForm`.
4. `FinancialRow` navegable y `TextLink` resolvían rutas internas con `<a>`.
5. El guardrail de fixtures buscaba la palabra "fixture" dentro de `src/app`, así
   que no veía el caso transitivo que sí existía.

---

## 4. Definiciones financieras

Todas viven en `src/lib/finance/reality.ts` y `src/lib/finance/close.ts`, puras y
sin acceso a datos.

| Concepto | Fórmula | Incluye | Excluye |
|---|---|---|---|
| Patrimonio | `Σ saldos activas + Σ saldos archivadas` | saldo inicial + asientos no anulados | inversiones, compromisos |
| Dinero operativo | `Σ saldos de cuentas ACTIVAS` | — | archivadas |
| Fuera del uso cotidiano | `Σ saldos de cuentas ARCHIVADAS` | — | — |
| Inversiones | `Σ currentValueCents` de inversiones ACTIVE | — | **nunca suma al patrimonio** |
| Comprometido | `Σ estimatedCents` de pagos PENDING | vencidos + horizonte + resto | pagos PAID |
| Horizonte | 30 días civiles, el mismo de `/ahora` y `/progreso` | — | — |
| Resultado del período | `ingresos − gastos` | movimientos vigentes | transferencias, anulados, originales corregidos |

**Por qué las inversiones no suman.** No existe una cuenta que las respalde en el
esquema. Sumarlas inventaría dinero; restarlas lo escondería. Se muestran en su
propio bloque con la razón escrita en pantalla.

**Por qué los compromisos no restan.** Todavía no ocurrieron. Restarlos del
patrimonio sería contarlos dos veces: una acá y otra cuando el pago se confirme y
se convierta en movimiento.

---

## 5. Mi realidad

La pantalla responde en orden:

1. **Síntesis** — patrimonio registrado + de qué está compuesto, en una frase que
   nombra la fórmula real (no una frase fija).
2. **Dónde está tu dinero** — cuentas activas con participación sobre el dinero
   operativo, última actividad, y el total operativo como cierre.
3. **Fuera del uso cotidiano** — archivadas e inversiones, con la explicación de
   por qué una suma al patrimonio y la otra no.
4. **Qué tenés comprometido** — vencidos, horizonte de 30 días, más adelante, y
   total. Con el horizonte declarado.
5. **Actividad del mes** — ingresos, gastos, resultado, y las transferencias y
   anulados nombrados fuera del cálculo.
6. **Calidad de la información** — señales explícitas.
7. **Evidencia** — cómo se calculó, qué entró y qué quedó afuera.

Una sola acción principal: **Revisar \<mes\>**, hacia el cierre.

### Participación por cuenta

`saldo de la cuenta / dinero operativo`, truncado a entero. Es `null` —y no se
muestra— cuando el denominador no es positivo o el saldo es negativo: un
porcentaje sin denominador honesto no significa nada. Las cuentas archivadas
nunca compiten por esa participación.

---

## 6. Calidad de la información

Seis señales explícitas, cada una verificable contra un objeto real. No hay
puntaje: la razón "5 de 6" se puede auditar señal por señal.

| Señal | Se cumple cuando | Por qué importa |
|---|---|---|
| Al menos una cuenta activa | hay ≥ 1 cuenta ACTIVE | sin ella no hay patrimonio que componer |
| Cada cuenta tiene origen | toda cuenta tiene saldo inicial ≠ 0 o movimientos | una cuenta en cero y sin movimientos aporta cero sin decir por qué |
| Movimientos en el período | hay ≥ 1 movimiento vigente en el mes | sin movimientos se sabe cuánto hay, no cómo cambió |
| Ingresos registrados | hay ≥ 1 ingreso vigente en el mes | sin ingresos el resultado solo muestra gastos aunque hayas cobrado |
| Compromisos cargados | hay ≥ 1 pago pendiente | sin compromisos la proyección solo refleja el dinero actual |
| Sin pagos vencidos por revisar | no hay pendientes con fecha pasada | un vencido sin confirmar puede ser un pago ya hecho y no registrado |

### Denominador variable, a propósito

Dos casos sacan señales del denominador en vez de contarlas como incumplidas:

- **Lectura caída de compromisos**: no se puede verificar, y un corte de conexión
  no es información faltante. Salen las dos señales de pagos y se declara.
- **Sin ningún pago cargado**: "sin pagos vencidos" se cumpliría por ausencia de
  datos e inflaría el recuento. Solo entra cuando hay compromisos que revisar.

### Estados

| Estado | Regla | Copy |
|---|---|---|
| Vacía | sin cuenta activa | "Tu realidad financiera todavía está vacía." |
| Inicial | menos de la mitad de las señales | "Ya representaste dónde está tu dinero. Falta información para explicar cómo cambia." |
| Parcial | mitad o más | "Esta lectura usa únicamente la información cargada en Doleth." |
| Suficiente | todas menos una | "Doleth tiene suficiente información para explicar tu situación registrada." |
| Completa para análisis | todas | "…y compararla entre períodos." |

Nunca se dice "tu realidad financiera está completa": Doleth solo conoce lo
registrado, y eso se declara.

---

## 7. Evidencia

"Ver cómo se calculó tu patrimonio" abre el desglose con:

- Una línea por cuenta, marcada como activa o archivada.
- Total = patrimonio, validado contra el valor visible del Hero.
- Resumen con la fórmula, más lo excluido y su razón: inversiones, compromisos,
  transferencias del mes, anulados del mes y la regla de correcciones.

No muestra SQL, Prisma, UUID ni ledger técnico.

---

## 8. Cierre financiero

**Nombre:** "Revisión del mes". No "Cerrar mes": no bloquea nada.
**Ruta:** `/mi-realidad/cierre`, porque el flujo nace de la calidad de información.

Siete pasos, uno por pantalla, con progreso textual "Paso 2 de 7":

| # | Paso | Qué muestra |
|---|---|---|
| 1 | Período | Mes en curso o anterior, con sus fechas y si sigue abierto |
| 2 | Cuentas | Saldo inicial, saldo final, variación y última actividad; archivadas aparte |
| 3 | Movimientos | Ingresos, gastos, resultado + qué no entra y por qué |
| 4 | Compromisos | Pagados, vencidos, pendientes y fuera del período |
| 5 | Información faltante | Advertencias con severidad, ninguna bloqueante |
| 6 | Resultado | La reconciliación completa, con la igualdad escrita |
| 7 | Resumen | Resultado neto, patrimonio final, pendientes y próxima acción |

### Persistencia: opción A, sin persistencia

**Decisión: cierre informativo, sin migración.**

| | Opción A (elegida) | Opción B (persistencia mínima) |
|---|---|---|
| Riesgo | ninguno: solo lee | migración + estado que puede contradecirse |
| Historial de cierres | no existe | existiría |
| Coherencia | siempre refleja el ledger actual | un cierre guardado se contradice si llega un movimiento con fecha anterior |

El esquema no impide registrar un movimiento con fecha pasada, y este corte no
quiso impedirlo. Un cierre guardado que después se vuelve falso mentiría; uno
calculado en el momento siempre es verdadero. La pantalla lo dice: *"Resumen
calculado con la información actual de Doleth. Esta revisión no se guarda ni
bloquea el período."*

Consecuencia declarada: **no hay historial de revisiones.** Cuando exista una
razón real para tenerlo, ese es el corte que necesita migración.

### El paso y el período viven en la URL

`/mi-realidad/cierre?periodo=2026-07&paso=resultado`. El botón atrás del
navegador funciona, la revisión se puede compartir, y no hay estado escondido en
el cliente. La pantalla no es un client component: sin estado ni efectos, no
hace falta enviar JavaScript para renderizarla.

---

## 9. Advertencias

Ninguna bloquea la revisión y ninguna se presenta como error.

| Advertencia | Severidad | Aparece cuando |
|---|---|---|
| El mes todavía está en curso | informativa | hoy cae dentro del período |
| Sin movimientos en el período | para revisar | no hay movimientos vigentes |
| Sin ingresos registrados | para revisar | hay movimientos pero ningún ingreso |
| Pagos vencidos sin confirmar | para revisar | hay pendientes con fecha pasada |
| Cuentas sin actividad en el mes | informativa | una cuenta activa no tuvo movimientos |
| Cuentas archivadas en el período | informativa | existe al menos una archivada |
| No pudimos leer los próximos pagos | informativa | la lectura falló |

El paso 5 dice: *"Podés completar la revisión igualmente. Estas advertencias
siguen visibles después."* El botón cambia a "Continuar con las advertencias".

No se pide inventar ningún dato para poder seguir.

---

## 10. Resumen del período

Título: "Revisión de julio completada". Muestra resultado neto, patrimonio final,
pagos pendientes del período e información faltante, con tres salidas: volver a
Mi realidad, revisar pendientes e ir a Ahora.

Como no hay persistencia, **no se afirma que quedó guardada**.

### Preparar el período siguiente

Fuera de alcance en este corte. Duplicar pagos previstos exige selección
explícita, confirmación e idempotencia sobre escritura real, y eso amplía el
corte a un flujo de escritura completo. Queda declarado como deuda.

---

## 11. Navegación

Ninguna superficie recarga la aplicación.

| Superficie | Antes | Ahora |
|---|---|---|
| `/ahora` | `window.location.assign` | `router.push` + `ACTION_ROUTES` |
| `/proximo` | `window.location.assign` | `router.push` + `ACTION_ROUTES` |
| `MovementForm` | `window.location.assign` ×2 | `router.push(returnTo)` |
| `TextLink` | siempre `<a>` | `next/link` para rutas internas |
| `FinancialRow` navegable | siempre `<a>` | `next/link` para rutas internas |
| `/mi-realidad/cierre` | — | enlaces reales, sin JavaScript |

`isInternalRoute` concentra la decisión: una ruta interna (`/…`) navega con el
router; un ancla (`#…`) o un destino externo sigue siendo un `<a>`. Un enlace
deshabilitado no navega.

Guardrail transversal: ningún archivo productivo de `src/app`, `src/components`,
`src/features` o `src/design-system` puede volver a usar `window.location` ni un
`<a href="/…">`.

---

## 12. Barrel y fixtures

`features/next/index.ts` reexportaba sus fixtures y `/proximo` importaba ese
barrel: datos ficticios alcanzables desde una ruta productiva por transitividad.
El mismo patrón estaba en `act`, `changes`, `progress` y `reality`, y en
`features/act/evidence/index.ts`, que `ActPage` importa directo.

- Los barrels productivos exponen solo la pantalla, sus props y su modelo.
- Cada feature tiene `testing.ts` para Storybook y tests.
- El guardrail sigue el grafo real de imports desde cada archivo de `src/app` y,
  cuando falla, imprime la cadena completa.

Verificado reintroduciendo el export a propósito: el test falla y nombra el
camino exacto `src/app/proximo/page.tsx → src/features/next/index.ts →
src/features/next/fixtures/index.ts`.

---

## 13. Restauración de scroll en Cuentas

**No se aplica, y no se implementó artificialmente.**

`/cuentas` no navega a ningún detalle: sus únicos destinos son el formulario de
alta (`/cuentas/nueva`) y un `form` de archivar/reactivar que reenvía a la misma
lista. Sin una vuelta desde un detalle no hay posición que recuperar, y montar el
mecanismo igual sería mecánica sin motivo.

Queda un test que enumera los subdirectorios de `src/app/cuentas` y falla el día
que aparezca un detalle, para que la restauración se agregue con él.

---

## 14. Resiliencia

| Falla | Comportamiento |
|---|---|
| Cuentas o ledger | Rompe y muestra el error boundary: sin base no hay composición que contar |
| Inversiones | "No pudimos cargar las inversiones. Tu patrimonio en cuentas sigue disponible y no depende de ellas." |
| Próximos pagos (Mi realidad) | "Esta lectura queda sin la parte comprometida, no en cero." Sus dos señales salen del denominador |
| Próximos pagos (cierre) | "Esta parte queda fuera de la revisión, no en cero." El resultado del período sigue siendo válido |

`resilientRead` distingue "falló" de "está vacío": un error devuelve `null`, una
lista vacía sigue siendo una lista vacía. Ningún fallo se convierte en cero sin
declararlo.

---

## 15. QA con PostgreSQL descartable

Base efímera en memoria (PGlite por wire protocol en `127.0.0.1:55432`), nunca
contra la base real. Harness en `.qa-tmp/`, ignorado por git. Las dependencias
temporales se instalaron a mano y se retiraron antes del freeze.

```bash
pnpm add -D @electric-sql/pglite @electric-sql/pglite-socket   # temporal
pnpm remove @electric-sql/pglite @electric-sql/pglite-socket   # antes de commitear
```

Escenario: 2 cuentas activas + 1 archivada, 2 inversiones, 6 categorías, dos
períodos comparables (junio y julio), transferencia, movimiento anulado,
corrección enlazada a su original, 1 pago pagado, 3 pendientes y 1 vencido.

Estados verificados en runtime: completo, sin pagos próximos, sin ingresos, solo
saldo inicial y sin cuentas.

### Hallazgo de esquema: el movimiento sin categoría no existe

El `CHECK Transaction_accounts_by_type` exige categoría en todo movimiento que no
sea transferencia. El seed intentó dos caminos y los dos fallaron contra la base:

1. Insertar con `categoryId = NULL` → violación del CHECK.
2. Insertar con categoría y borrarla, confiando en `ON DELETE SET NULL` → el
   `UPDATE` interno de la FK **también** choca contra el mismo CHECK.

Un movimiento sin categoría es inalcanzable hoy. La señal y la advertencia que lo
prometían se retiraron en vez de dejar copy muerta que describe un estado que el
dominio no produce. Si un corte futuro relaja el CHECK, la señal se agrega ahí.

---

## 16. Reconciliación

Saldos iniciales sembrados: Banco 400.000, Efectivo 60.000, Cuenta vieja
(archivada) 40.000. **Σ = 500.000.**

### Mi realidad — corte del 25 de julio

| Dominio | Importe | ¿En el patrimonio? | Motivo |
|---|---:|---|---|
| Banco (activa) | 1.116.000 | sí | saldo inicial + asientos no anulados |
| Efectivo (activa) | 79.300 | sí | ídem |
| Cuenta vieja (archivada) | 40.000 | sí | conserva su historia, fuera del uso cotidiano |
| **Patrimonio registrado** | **1.235.300** | — | `Σ saldos` |
| Dinero operativo | 1.195.300 | subconjunto | solo cuentas activas |
| Inversiones | 305.000 | **no** | sin cuenta que las respalde: sumarlas sería inventar dinero |
| Comprometido | 197.400 | **no** | todavía no ocurrió |
| Transferencias de julio | 50.000 | efecto 0 | mueve plata entre cuentas propias |
| Anulados de julio | 2 movimientos | efecto 0 | no participan de ningún cálculo |
| Original corregido | 24.300 | efecto 0 | pesa solo el reemplazo de 18.000 |

✅ `1.116.000 + 79.300 + 40.000 = 1.235.300`
✅ `1.195.300 + 40.000 = 1.235.300`

Compromisos: `41.800 (vencido) + 82.600 (30 días) + 73.000 (más adelante) = 197.400` ✅
Horizonte declarado: hasta el 24 de agosto, el mismo que proyecta `/ahora`.

### Cierre — julio

| Concepto | Importe |
|---|---:|
| Patrimonio inicial | 754.000 |
| Ingresos | 900.000 |
| Gastos | 418.700 |
| **Resultado** | **481.300** |
| Patrimonio final | 1.235.300 |

✅ `754.000 + 900.000 − 418.700 = 1.235.300`

### Cierre — junio

| Concepto | Importe |
|---|---:|
| Patrimonio inicial | 500.000 |
| Ingresos | 700.000 |
| Gastos | 446.000 |
| **Resultado** | **254.000** |
| Patrimonio final | 754.000 |

✅ `500.000 + 700.000 − 446.000 = 754.000`
✅ El patrimonio inicial de junio coincide con la suma de los saldos iniciales
sembrados: 500.000.
✅ Encadenado: `754.000 + 481.300 = 1.235.300` — el cierre de junio más lo
registrado después da el patrimonio de hoy, y la pantalla lo dice en el bloque
"Lo registrado después del período".

### Invariantes verificadas

| Invariante | Resultado |
|---|---|
| Transferencias: efecto patrimonial | `0` ✅ |
| Anulados: efecto | `0` ✅ |
| Correcciones: se cuenta solo el reemplazo | ✅ |
| Inversiones: doble conteo | ninguno ✅ |
| Compromisos: restados del patrimonio final | no ✅ |
| Cuentas: `Σ apertura` y `Σ cierre` = patrimonio del período | ✅ |

---

## 17. Runtime y responsive

Rutas verificadas con datos reales contra la base descartable: `/mi-realidad` y
los siete pasos de `/mi-realidad/cierre`, en los dos períodos revisables.

Breakpoints medidos dentro de un iframe del ancho exacto
(`documentElement.scrollWidth == clientWidth`):

| Ancho | Stories verificadas | Desborde |
|---|---|---|
| 320 | 13 (5 de Mi realidad + 8 del cierre) | ninguno |
| 390 | 13 | ninguno |
| 768 | 13 | ninguno |
| 1024 | 13 | ninguno |
| 1440 | 13 | ninguno |

65 combinaciones, ninguna con desborde horizontal. Sin errores ni warnings de
consola.

---

## 18. Accesibilidad

| Verificación | Resultado |
|---|---|
| Jerarquía de encabezados | `h1` de pantalla + `h2` por sección, sin saltos |
| Landmarks | `main`, `nav aria-label`, `section aria-label` por bloque |
| Listas semánticas | señales, advertencias, períodos y acciones son `ul`/`li` |
| Estado sin depender del color | "· cumplida" / "· falta"; "· para revisar" / "· informativa" |
| Progreso del flujo anunciado | "Paso 2 de 7" con `aria-live="polite"` |
| Avisos de degradación | `role="status"` |
| Gráfico con alternativa textual | `progress` con `aria-label` que dice la razón completa |
| Marcas decorativas | `aria-hidden="true"` |
| Enlaces reales | navegación por `Link`/`a`, nunca `div` con `onClick` |
| Foco visible | `outline` en enlaces, botones y opciones de período |
| Reduced motion | regla global heredada; el cierre no anima |
| Touch targets | corregidos a ≥ 24 × 24 (mínimo WCAG 2.2) |

**Corrección aplicada:** los enlaces standalone medían 18 px de alto, por debajo
del mínimo de WCAG 2.2. Suben a 24 px sin alterar el ritmo vertical de las
pantallas ya congeladas. Llevarlos a 44 px exigiría rediseñar el ritmo de seis
superficies: queda declarado como deuda, no ejecutado en este corte.

---

## 19. Tests y validaciones

```bash
pnpm lint
pnpm test              # 601 pruebas, 31 archivos
pnpm exec tsc --noEmit
pnpm build
pnpm build-storybook
git diff --check
```

Las seis validaciones corrieron después de cada commit:

| Commit | Pruebas |
|---|---|
| `feat(reality)` | 502 |
| `feat(close)` | 560 |
| `feat(nav)` | 570 |
| `fix(features)` barrels | 586 |
| `test(reality)` transversales | 601 |
| `fix(reality)` hallazgos de QA | 601 |

Archivos de prueba del corte: `reality.test.ts`, `close.test.ts`,
`reality-surface.test.ts`, `close-surface.test.ts`, más la ampliación de
`analytic-navigation.test.ts`, `cross-surface-consistency.test.ts`,
`analysis.test.ts` y `no-fixtures-in-routes.test.ts`.

### Declaraciones explícitas

- **Sin cambios en Prisma ni migraciones.** El corte solo lee; el ledger quedó
  intacto.
- **Sin persistencia del cierre.** Ninguna tabla nueva, ningún asiento, ningún
  bloqueo de período.
- **Sin dependencias nuevas.** Las de QA se instalaron y se retiraron;
  `.qa-tmp/` sigue ignorado.
- **Sin secretos tocados, sin puertos hardcodeados en `src/`, sin escritura en
  producción, sin push y sin deploy.**
- **`computeReality` se movió** de `analysis.ts` a `reality.ts`, junto con el
  nuevo `close.ts`. `analysis.ts` conserva las reglas compartidas del ledger.
- **C5 sin regresión:** `/cambios` y `/progreso` siguen verdes y ahora comparten
  pruebas transversales con Mi realidad y el cierre.

---

## 20. Git

```
7ba00aa  feat(reality): clarify financial composition and information quality
d45b39c  feat(close): add guided monthly review
24d2703  feat(nav): remove remaining full-page internal navigation
86589e9  fix(features): isolate story fixtures from production barrels
cf7fc50  test(reality): cover reality and monthly review states
afae854  fix(reality): close runtime QA findings
```

Más este documento. Rama `claude/corte-6-mi-realidad-cierre`, local.

---

## 21. Deuda restante

- **Sin historial de revisiones**: el cierre no persiste, así que no se puede
  decir "cerraste junio hace tres semanas".
- **Preparar el período siguiente** (duplicar pagos previstos al mes que viene)
  quedó fuera: exige selección explícita, confirmación e idempotencia sobre
  escritura real.
- **El movimiento sin categoría es inalcanzable** por el CHECK del esquema. Si
  alguna vez se quiere permitir "sin categoría", hay que relajarlo y agregar la
  señal ahí.
- **Touch targets a 44 px**: hoy quedan en 24, el mínimo de WCAG 2.2. Subirlos
  exige rediseñar el ritmo vertical de seis superficies.
- **El horizonte de compromisos sigue fijo en 30 días**, sin forma de cambiarlo.
- **Solo dos períodos revisables** (mes en curso y anterior). No hay cierre anual
  ni rangos arbitrarios, a propósito.
- **La participación por cuenta trunca a entero**, así que la suma de las partes
  puede dar 99 %. Nunca se afirma que sumen 100.
- **`/cuentas` sigue sin detalle**: sin él no hay restauración de scroll ni una
  vista por cuenta con su historia.
- **`/cambios` mantiene el grupo "sin categoría"** en sus causas, que por el
  mismo CHECK tampoco puede aparecer. Deuda anterior, no tocada acá.
- **Inversiones sin valuación fechada**: `currentValueCents` no dice de cuándo
  es, así que no se puede declarar si está al día.
