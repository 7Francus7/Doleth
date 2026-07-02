# PATTERN 002 — Bottom Sheet de Evidencia

Estado: propuesto para aprobación
Fecha: 2 de julio de 2026
Tipo: patrón de composición. No es pantalla, no es componente.
Depende de: `DESIGN.md`, `DESIGN LANGUAGE 001` (unidad tipo Evidencia, §2.9), `DESIGN SYSTEM 002 - Component Library v1`, `PATTERN 001 — Ahora` (aprobado), `DESIGN SPEC 001 - Ahora` (§4.5 Ver evidencia), `SCREEN DESIGN 001` (§3.3 fórmula visible).
Regla vigente: librería congelada. Ningún componente nuevo salvo regla de tres cumplida.

---

## 0. Qué es este patrón

Es la forma canónica en que Doleth responde:

> **"¿De dónde sale esta cifra?"**

Toda cifra material del producto debe poder abrir esta superficie. El patrón implementa la unidad de sentido tipo **Evidencia** de la gramática (fuentes, cálculo, supuestos, fecha, alcance, registros, certeza) dentro del composite **Bottom Sheet** existente.

Lo que este patrón NO es:

- no es un modal de detalle (Detalle es profundidad, no tipo);
- no es una pantalla de navegación;
- no es un lugar para conclusiones nuevas, recomendaciones ni acciones comerciales (prohibición de gramática §3: la Evidencia verifica, no introduce);
- no es un formulario.

Firma visual que valida (DESIGN.md, diferenciador 4): *"accounting-grade evidence — bottom sheets and drill-downs read like living calculations, not expandable lists"*. El cuerpo del sheet se lee como un cálculo vivo con total verificable, no como un acordeón.

---

## 1. Estructura

Tres zonas fijas más una condicional. El orden nunca cambia.

```text
┌─────────────────────────────────────────┐
│  Sheet Header                           │  ① identidad de la cifra explicada
│  (handle · título · subtítulo · close)  │
├─────────────────────────────────────────┤
│  Ledger de Evidencia                    │  ② el cálculo vivo
│    Evidence Row (neutral/positive/…)    │
│    Evidence Row                         │
│    Evidence Row (expandible, opcional)  │
│    ── Divider ──                        │
│    Evidence Row kind=total              │  ← DEBE coincidir con la cifra origen
├─────────────────────────────────────────┤
│  Condición + alcance                    │  ③ certeza y marco de lectura
│    Partial State (solo si ≠ confirmada) │
│    System Rail (fecha · moneda · ámbito │
│                 · cobertura)            │
├─────────────────────────────────────────┤
│  Footer sticky (condicional)            │  ④ solo reparación de calidad de dato
│    Button kind=secondary                │
└─────────────────────────────────────────┘
```

Regla estructural madre: **el total del ledger y la cifra que originó el sheet son el mismo número, en la misma moneda, con el mismo alcance.** Si no coinciden, el sheet no se muestra y la cifra origen declara estado conflictivo. La evidencia que no cierra es peor que ninguna evidencia.

---

## 2. Anatomía

| Zona | Componente de librería | Rol |
|---|---|---|
| Agarre + identidad | `Navigation / Sheet Header` (close=icon, subtitle=one-line) | título = nombre de la cifra ("Disponible hoy"); subtítulo = contexto heredado ("Personal · ARS") |
| Encabezado de grupo (opcional, ledgers largos) | `Primitive / Section Title` (support=none, action=none) | separar grupos semánticos ("Cuentas incluidas", "Obligaciones descontadas") |
| Línea de cálculo | `Composite / Evidence Row` (kind=neutral\|positive\|negative) | cada fuente o término del cálculo, con tabular numerals |
| Sub-evidencia | `Composite / Evidence Row` (expandable=yes) | desglose de segundo nivel (las operaciones dentro de una cuenta) |
| Cierre de cálculo | `Primitive / Divider` (tone=default, inset=none) + `Evidence Row` (kind=total) | el total verificable |
| Condición informativa | `Feedback / Partial State` (scope=local) o `Primitive / Inline Status` (kind=partial\|attention) | declara parcial / estimada / desactualizada; ausente cuando confirmada |
| Alcance de lectura | `Composite / System Rail` (items=3\|4) | fecha de actualización · moneda · ámbito · cobertura |
| Reparación (condicional) | `Primitive / Button` (kind=secondary, width=fill) en footer del Bottom Sheet | única acción permitida: restaurar calidad del dato ("Actualizar saldo") |
| Carga | `Feedback / Skeleton` (block=row ×3) | mantiene la masa del ledger |
| Falla | `Feedback / Error State` (scope=block) | fuente de evidencia no disponible |
| Contenedor | `Composite / Bottom Sheet` (height=auto\|half, footer=none\|actions) | superficie madre |

Notas de anatomía:

- el título del Sheet Header **no repite** la cifra: nombra el concepto. La cifra vive una sola vez, como total del ledger (evitar duplicar labels antes de agregar aire — regla de spacing);
- ningún ícono es necesario para leer el patrón (regla especial de iconografía: los íconos no explican finanzas);
- el chevron de expansión de Evidence Row es el único control gráfico dentro del ledger.

---

## 3. Composición (receta exacta)

```text
Bottom Sheet
  Variant: height=auto (default) | half (ledger ≥ 7 filas)
  Variant: footer=none (default) | actions (solo condición desactualizada/parcial reparable)
├── Sheet Header
│     close=icon · subtitle=one-line
├── Body (slot)
│   ├── [Section Title]                    ← solo con ≥2 grupos semánticos
│   ├── Evidence Row × 2..8
│   │     kind según signo del término
│   │     expandable=yes solo si existe sub-desglose real
│   ├── Divider (tone=default)
│   ├── Evidence Row kind=total
│   ├── [Partial State scope=local]        ← solo condición ≠ confirmada
│   └── System Rail (items=3|4)
└── [Footer sticky]
      Button kind=secondary width=fill
```

Reglas de composición:

1. **máximo 8 filas de primer nivel**; más términos exigen agrupar con Section Title, jamás scroll infinito de filas sueltas;
2. un solo `kind=total` por sheet — dos totales son dos conclusiones, y dos conclusiones son dos sheets;
3. filas heterogéneas prohibidas (regla de abuso de Evidence Row): no mezclar cuentas con supuestos de tipo de cambio en la misma lista — el tipo de cambio usado es una fila propia bajo Section Title "Supuestos";
4. Partial State nunca dentro del ledger: la condición habla del conjunto, va después del total;
5. sin Stability Statement dentro del sheet: la evidencia no interpreta (interpretar es trabajo de la Síntesis que quedó atrás, en la pantalla).

---

## 4. Comportamiento

### Apertura
- disparadores válidos: tap sobre `Numeric Value` material, `Text Link` "Ver cálculo", link de `Information Block`, acción "abrir evidencia" de `Attention Banner`;
- el contexto de pantalla permanece visible detrás, atenuado (ver §11 — scrim);
- abrir evidencia es **una** acción intencional: cumple el principio de componente 5 ("nunca esconder evidencia a más de una acción intencional").

### Dentro del sheet
- body scrollea; Sheet Header y footer quedan fijos;
- expansión de fila: revela sub-evidencia in situ, sin navegar (la gramática permite acceso progresivo);
- profundidad máxima: **un nivel de expansión**. Si la sub-evidencia exige más, ese desglose pertenece a su propia pantalla de dominio, y la fila ofrece Text Link de salida;
- recálculo en vivo (un registro ocurre mientras el sheet está abierto): orden de asentamiento del motion system — total primero, filas después, metadata al final.

### Cierre
- drag down sobre el handle, tap en scrim, o icon close;
- cerrar jamás pierde estado de la pantalla madre;
- no existe "atrás" dentro del sheet (regla de abuso de Sheet Header): un sheet, un tema.

### Prohibiciones de comportamiento
- no encadenar sheets (un sheet no abre otro sheet);
- no convertirlo en navegación profunda (regla de abuso de Bottom Sheet);
- no auto-abrirse jamás: la evidencia se pide, no se impone.

---

## 5. Auto Layout

| Nivel | Dirección | Gap | Padding |
|---|---|---|---|
| Bottom Sheet container | vertical | 0 | 0 |
| Sheet Header | vertical | `space.4` | `space.16` / `space.20` horizontal, `space.12` top |
| Body | vertical | `space.16` entre zonas semánticas | `space.20` horizontal, `space.8` top, `space.24` bottom |
| Ledger (grupo de filas) | vertical | `space.4` entre filas; filas comprimen interno a `space.12` (regla de densidad de data-rows) | 0 |
| Evidence Row | horizontal, space-between | `space.8` | `space.12` vertical interno |
| Zona condición + rail | vertical | `space.8` | 0 |
| Footer | vertical | 0 | `space.16` / `space.20`, respeta safe area inferior |

- Divider del total: margen superior `space.8`, inferior `space.4` — el total se pega a su cálculo, no flota;
- entre total y Partial State: `space.16` (cambio de zona semántica);
- entre Partial State y System Rail: `space.8` (misma zona).

## 6. Constraints

- sheet: **pin bottom, fill width** del parent (heredado del composite);
- height=auto: crece con contenido hasta 60% del viewport;
- height=half: 60% fijo; el contenido scrollea;
- techo absoluto: 88% del viewport — el canvas de la pantalla madre siempre asoma (el usuario nunca pierde de vista de dónde vino);
- Evidence Row: label izquierda fill con truncation, value derecha hug (los números jamás se truncan — si un label compite, cede el label);
- footer sticky: fixed bottom del sheet, `border.subtle` superior;
- System Rail: fill width, truncation habilitada, una línea.

## 7. Variables

### Tokens consumidos (todos existentes)

- superficie: `color.surface.raised`, `radius.xl` (solo esquinas superiores), `elevation.sheet`;
- ledger: `type.data.m` para values, `type.body.m` para labels, `type.data.l` para el total, tabular numerals obligatorios;
- total: `color.text.strong`; filas: `color.text.primary` / values `color.text.strong`; signos negativos en `color.text.primary` — **jamás rojo automático** (regla de color: semántica es estado, no signo aritmético);
- condición: `color.state.attention.*` solo cuando desactualizada/conflictiva; parcial usa Inline Status kind=partial en neutrales;
- rail: `type.label.s`, `color.text.tertiary`;
- motion: `motion.duration.sheet`, `motion.duration.surface`, `motion.duration.numeric`, `motion.curve.settle`, `motion.curve.exit`.

### Component properties del patrón (instancia en Figma, page 06 Patterns)

- `Title` (string)
- `Subtitle` (string)
- `Rows` (2–8 primer nivel)
- `Show Section Titles` (boolean)
- `Condition` (confirmada | parcial | estimada | desactualizada | conflictiva)
- `Show Footer` (boolean, forzado por Condition reparable)
- `Footer Label` (string)
- `Height` (auto | half)

## 8. Motion

| Momento | Spec |
|---|---|
| Apertura | sheet sube `motion.duration.sheet` (280ms) `curve.settle`; scrim funde en `motion.duration.surface` (220ms) |
| Contenido en apertura | entra **con** el sheet, sin stagger por fila (prohibición: "every card on first load") |
| Expansión de fila | `motion.duration.surface` (220ms) `curve.settle`; el resto del ledger se desplaza, no salta |
| Recálculo en vivo | total (180ms numeric) → filas afectadas → metadata del rail; secuencia, nunca simultáneo |
| Cierre | `motion.duration.sheet` `curve.exit`; scrim funde en salida |
| Loading→contenido | skeleton de filas se disuelve sin shimmer agresivo |

El motion de este patrón **prueba causalidad**: el sheet nace físicamente desde abajo de la cifra que lo llamó; el número no "aparece explicado", se ve de dónde sale.

## 9. Estados

| Estado | Composición |
|---|---|
| `closed` | inexistente en pantalla; ninguna precarga visual |
| `loading` | Sheet Header real + Skeleton block=row ×3 + rail oculto |
| `open · confirmada` | ledger + total + System Rail; sin Partial State, sin footer |
| `open · parcial` | ledger con filas conocidas + fila "todavía no cargado" en kind=neutral con value "—" + Partial State (causa + qué falta) |
| `open · estimada` | ledger completo + Inline Status "cifra estimada" + fila de supuesto visible (ej. tipo de cambio usado) |
| `open · desactualizada` | ledger + Partial State con antigüedad del dato + footer `actions` con Button "Actualizar saldo" |
| `open · conflictiva` | no se muestra el ledger que no cierra: Error State scope=block declarando la diferencia + acceso a Resolución |
| `error de fuente` | Error State scope=block (causa + retry); jamás ledger a medias sin declararlo |

Regla de estados: **el sheet nunca está vacío.** Si una cifra no tiene evidencia componible, esa cifra no es material o no debió mostrarse como confirmada — el problema es de la pantalla, no del sheet.

## 10. Casos de uso (integración con Pattern 001 — Ahora)

Todas las cifras materiales de Pattern 001 se conectan a este patrón. Ninguna requiere variante nueva:

| Cifra origen (Pattern 001) | Ledger | Total |
|---|---|---|
| **Disponible hoy** (Hero) | dinero líquido (+) · reservas (−) · obligaciones próximas no cubiertas (−) — la fórmula visible del screen design §3.3, fila por fila | disponible hoy |
| **Cobertura próximos 7 días** (Coverage Meter) | compromisos del período (−, expandibles) · cobertura disponible (+) | faltante o cubierto |
| **Desde semana pasada** (Comparación) | valor anterior (neutral) · movimientos materiales del período (±, expandibles) | diferencia |
| **Posición total** (Financial Rows) | activos por grupo (+) · deudas (−) · Section Title "Supuestos": valuaciones con fecha, tipo de cambio | patrimonio neto |
| **Reservado** (Reserve Block) | reservas activas por propósito (+) | total reservado |
| **Información para revisar** (Information Block) | el link del block abre directamente el sheet de la cifra afectada en estado desactualizada, con footer de reparación | según cifra |

Contrato de integración: **el disparador vive en el componente origen, no en el patrón.** Pattern 001 no cambia — sus Numeric Values y Text Links ya existían; este patrón define qué abren.

---

## 11. Regla de tres — auditoría de componentes nuevos

### Resultado: cero componentes nuevos. Un déficit de token detectado, resuelto sin tocar librería.

**Déficit detectado: el scrim.** El Bottom Sheet composite define pin bottom y elevation.sheet, pero la librería no tiene token ni componente para la capa que atenúa la pantalla madre.

1. **Demostración del problema:** sin scrim, la pantalla madre compite en contraste con el sheet y el tap-para-cerrar no tiene superficie; el patrón pierde su física de capas ("this layer belongs to same physical system").
2. **Intento de reutilización:** resuelto con tokens existentes — `color.surface.inverse` a 40% de opacidad, animado con `motion.duration.surface`. Funciona sin agregar nada.
3. **Justificación de componente nuevo:** **no corresponde todavía.** Es la aparición nº 1 de la necesidad (Pattern 001 no usó overlays). Queda registrado como candidato `color.overlay.scrim`: cuando el tercer patrón con overlay lo necesite (candidatos previsibles: sheet de Registrar, sheet de Resolución), se promueve a token oficial por regla de tres. Hasta entonces, la definición vive en este documento.

**Falsos candidatos descartados:**
- "Evidence Ledger" como composite propio → es composición de Evidence Row + Divider + Section Title; una variante no agrega semántica que la receta §3 no fije;
- "Sheet Metadata Footer" → es System Rail reutilizado tal cual (su propósito — dar alcance de lectura sin competir — aplica idéntico dentro del sheet);
- "Assumption Row" (tipo de cambio, valuación) → es Evidence Row kind=neutral bajo Section Title "Supuestos".

---

## 12. Respuestas de validación

### 1. ¿El Bottom Sheet pudo construirse completamente con la librería actual?

**Sí.** Las tres zonas del patrón, sus siete estados y sus seis casos de uso de Pattern 001 se componen con 12 componentes existentes (Bottom Sheet, Sheet Header, Evidence Row, Divider, Section Title, System Rail, Inline Status, Partial State, Error State, Skeleton, Button, Text Link) y foundations existentes. La única carencia real fue el scrim — un token, no un componente — y se resolvió con `color.surface.inverse` + opacidad, sin modificar la librería.

### 2. ¿Qué porcentaje de reutilización obtuvo?

**~96%.** Cálculo: 24 piezas de composición requeridas (12 componentes + 12 grupos de tokens); 23 salieron de librería tal cual; 1 (scrim) se derivó de tokens existentes con una regla local de patrón. Cero componentes nuevos, cero variantes nuevas, cero propiedades nuevas. Mejor que el 93% de Pattern 001 — esperable: Pattern 001 pagó el costo de estrenar la librería; este patrón cosecha.

### 3. ¿Qué parte del sistema quedó validada gracias a este patrón?

- **Evidence Row**: primera vez ejercitado en serio — sus cuatro kinds y la expansión cubrieron cálculo, fuentes, supuestos y diferencia sin extensión;
- **Bottom Sheet + Sheet Header**: el par de overlay funciona como contenedor genérico con slot;
- **los motion tokens de sheet** (280/220/curvas): el patrón los consumió sin pedir duraciones nuevas;
- **la unidad Evidencia de la gramática**: por primera vez tiene forma física completa — la firma "accounting-grade evidence" del DESIGN.md dejó de ser manifiesto y es receta;
- **la filosofía central**: "ninguna cifra importante existe sin poder explicar de dónde sale" ahora tiene mecanismo estándar, con invariante verificable (total del ledger == cifra origen).

### 4. ¿Detectaste un nuevo patrón reutilizable o sigue siendo un ensamblado?

**Detecté uno, en aparición nº 2: el "Ledger verificable"** (Evidence Rows → Divider → Evidence Row total, con la invariante de coincidencia). Apareció embrionario en Pattern 001 (la fórmula del disponible en el Hero) y acá tomó forma completa dentro del sheet. Es previsible su tercera aparición fuera de overlays: desglose inline en pantallas de dominio (Posición, Flujo) y evidencia dentro de Atención crítica. **Cuando ocurra la tercera, corresponde promoverlo — como patrón documentado en 06 Patterns, no como componente** (sigue siendo composición pura de librería). El scrim, en cambio, va por carril de token y está en aparición nº 1.

El Bottom Sheet de Evidencia en sí ya no es un ensamblado: tiene invariante propia, estados propios y contrato de integración — es patrón con todas las letras.

---

## 13. Gobierno

- este documento vive junto a Pattern 001; su instancia Figma va en `06 Patterns/` (candidata a subpágina `Evidence/`);
- la librería (pages 01–05) **no fue modificada**;
- pendientes registrados: `color.overlay.scrim` (1/3 apariciones) · "Ledger verificable" como patrón autónomo (2/3 apariciones);
- ninguna pantalla nueva se diseña con este documento: valida el patrón, no autoriza avanzar.
