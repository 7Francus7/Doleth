# DESIGN SYSTEM 002 - Component Library v1

Estado: oficial  
Fecha: 2 de julio de 2026  
Autoridad: biblioteca oficial de Figma para Doleth  
Depende de: `DESIGN.md`, `DESIGN LANGUAGE 001`, `DESIGN SPEC 001 - Ahora`

## 0. Regla madre

Toda pantalla futura debe poder construirse combinando:

- foundations;
- primitive components;
- composite components;
- feedback;
- navigation.

Si una pantalla exige un componente nuevo, primero debe demostrarse que no puede resolverse combinando biblioteca existente sin romper claridad, semántica o consistencia.

---

## 1. Foundations

### 1.1 Color Tokens

**Propósito**  
Definir color como sistema de significado, no como estilos sueltos.

**Variables**
- `color.canvas.default`
- `color.surface.base`
- `color.surface.raised`
- `color.surface.subtle`
- `color.surface.inverse`
- `color.text.strong`
- `color.text.primary`
- `color.text.secondary`
- `color.text.tertiary`
- `color.text.inverse`
- `color.text.accent`
- `color.action.primary.bg`
- `color.action.primary.text`
- `color.action.secondary.bg`
- `color.action.secondary.text`
- `color.state.attention.bg`
- `color.state.attention.border`
- `color.state.attention.text`
- `color.state.critical.bg`
- `color.state.critical.border`
- `color.state.critical.text`
- `color.state.info.bg`
- `color.state.info.border`
- `color.state.info.text`
- `color.data.positive`
- `color.data.neutral`
- `color.data.at-risk`
- `color.border.subtle`
- `color.border.default`
- `color.border.strong`

**Reglas de uso**
- usar alias por función, nunca hex directo;
- un viewport usa una sola familia de acento dominante;
- color semántico no reemplaza texto.

**Reglas de abuso**
- no crear `green-500`, `gray-200` en componentes;
- no usar color para compensar mala jerarquía.

### 1.2 Typography Tokens

**Propósito**  
Separar síntesis humana, UI y precisión numérica.

**Variables**
- `type.display.xl`
- `type.display.l`
- `type.display.m`
- `type.heading.l`
- `type.heading.m`
- `type.heading.s`
- `type.body.l`
- `type.body.m`
- `type.body.s`
- `type.label.l`
- `type.label.m`
- `type.label.s`
- `type.data.l`
- `type.data.m`
- `type.data.s`

**Font mapping**
- synthesis: `Instrument Serif`
- UI: `Satoshi`
- evidence/data fallback: `IBM Plex Mono`

**Reglas de uso**
- números materiales con tabular numerals;
- serif solo para framing interpretativo.

**Reglas de abuso**
- no usar mono para párrafos;
- no crear tamaños intermedios por capricho.

### 1.3 Spacing Tokens

**Variables**
- `space.2`
- `space.4`
- `space.8`
- `space.12`
- `space.16`
- `space.20`
- `space.24`
- `space.32`
- `space.40`
- `space.48`
- `space.56`
- `space.72`

**Reglas**
- micro-grid 4;
- ritmo compositivo 8;
- separación semántica antes que separación uniforme.

### 1.4 Radius

**Variables**
- `radius.xs = 8`
- `radius.sm = 12`
- `radius.md = 16`
- `radius.lg = 22`
- `radius.xl = 28`
- `radius.full = 999`

**Reglas**
- primitivas pequeñas usan `sm` o `md`;
- surfaces principales usan `lg` o `xl`.

### 1.5 Borders

**Variables**
- `border.subtle = 1 / color.border.subtle`
- `border.default = 1 / color.border.default`
- `border.strong = 1 / color.border.strong`
- `border.attention = 1 / color.state.attention.border`
- `border.critical = 1 / color.state.critical.border`

**Reglas**
- border comunica contención o estado;
- nunca contornear todo por rutina.

### 1.6 Elevation

**Variables**
- `elevation.none`
- `elevation.soft`
- `elevation.sheet`

**Reglas**
- primero tono, después borde, último sombra;
- shadow solo en raised surfaces y overlays.

### 1.7 Motion Tokens

**Variables**
- `motion.duration.micro = 120`
- `motion.duration.numeric = 180`
- `motion.duration.surface = 220`
- `motion.duration.sheet = 280`
- `motion.duration.reflow = 320`
- `motion.curve.snap`
- `motion.curve.settle`
- `motion.curve.exit`

**Reglas**
- animar consecuencia, no chrome;
- updates complejos siguen orden: valor -> soporte -> metadata.

### 1.8 Icon Grid

**Propósito**  
Mantener coherencia geométrica.

**Specs**
- grid base `20x20`
- grid secondary `24x24`
- stroke `1.75`
- corner behavior: soft geometric

**Reglas**
- outline-first;
- ícono acompaña significado, no lo reemplaza.

---

## 2. Primitive Components

## 2.1 Button

**Propósito**  
Ejecutar acción principal o secundaria.

**Anatomía**
- container
- label
- optional leading icon
- optional trailing icon

**Variantes**
- `kind: primary | secondary | ghost`
- `size: md | lg`
- `icon: none | leading | trailing`
- `width: hug | fill`

**Estados**
- default
- pressed
- disabled
- loading

**Auto Layout**
- horizontal
- center/center
- gap `8`
- padding `14/16` md, `16/20` lg

**Constraints**
- fill width or hug;
- altura fija por variante.

**Variables**
- label text
- icon visibility
- loading boolean

**Tokens**
- color.action.*
- radius.md
- type.label.*

**Propiedades**
- `Kind`
- `Size`
- `Icon`
- `Width`
- `State`
- `Label`

**Reglas de uso**
- un solo primary por bloque;
- secondary para acciones hermanas.

**Reglas de abuso**
- no usar ghost como CTA principal;
- no apilar tres primaries.

## 2.2 Icon Button

**Propósito**  
Acción compacta con semántica obvia.

**Anatomía**
- square container
- icon

**Variantes**
- `kind: neutral | accent | critical`
- `size: sm | md`

**Estados**
- default
- pressed
- disabled

**Auto Layout**
- center/center
- fixed frame

**Constraints**
- fixed size

**Variables**
- icon swap
- accessibility label

**Reglas de abuso**
- no usar cuando texto sea más claro;
- no usar para acciones irreversibles sin label cercano.

## 2.3 Text Link

**Propósito**  
Navegación o evidencia secundaria.

**Anatomía**
- text
- optional trailing chevron

**Variantes**
- `kind: inline | standalone`
- `icon: none | chevron`

**Estados**
- default
- pressed
- disabled

**Auto Layout**
- horizontal
- gap `4`

**Reglas de abuso**
- no usar como primary action;
- no ocultar tareas urgentes dentro de links.

## 2.4 Surface

**Propósito**  
Contener unidades relacionadas.

**Anatomía**
- container
- optional border
- optional shadow

**Variantes**
- `tone: base | raised | subtle | inverse`
- `radius: md | lg | xl`
- `border: none | subtle | default | state`
- `elevation: none | soft | sheet`

**Estados**
- default
- attention
- critical

**Auto Layout**
- vertical
- padding variable

**Reglas de abuso**
- no usar surface para cada bloque pequeño;
- no anidar tres surfaces del mismo tono.

## 2.5 Divider

**Propósito**  
Separar contenido relacionado sin crear nuevo bloque.

**Anatomía**
- single line

**Variantes**
- `inset: none | md | lg`
- `tone: subtle | default`

**Estados**
- default

**Constraints**
- fill container width

**Reglas de abuso**
- no usar para decorar final de sección;
- no duplicar con espacio y border a la vez.

## 2.6 Pill

**Propósito**  
Compactar metadata o selección corta.

**Anatomía**
- rounded container
- label
- optional dot

**Variantes**
- `kind: neutral | accent | state`
- `size: sm | md`
- `selection: static | selected`

**Estados**
- default
- selected
- disabled

**Reglas de abuso**
- no convertir navegación primaria en colección de pills;
- no usar pills pesadas en System Rail.

## 2.7 Inline Status

**Propósito**  
Declarar estado local en una línea.

**Anatomía**
- optional dot/icon
- short text

**Variantes**
- `kind: neutral | stable | attention | critical | partial`

**Estados**
- default

**Reglas de abuso**
- no reemplaza banner cuando hay consecuencia material;
- no usar para mensajes largos.

## 2.8 Progress Track

**Propósito**  
Mostrar cobertura o avance simple.

**Anatomía**
- track
- fill
- optional marker

**Variantes**
- `kind: coverage | progress`
- `size: sm | md`
- `state: stable | attention | critical`

**Estados**
- empty
- partial
- full

**Variables**
- fill percentage
- marker visibility

**Reglas de abuso**
- no usar para score abstracto;
- no poner texto dentro del fill.

## 2.9 Numeric Value

**Propósito**  
Mostrar cifra material con precisión y semántica controlada.

**Anatomía**
- optional currency
- integer/fraction text
- optional delta
- optional suffix

**Variantes**
- `size: sm | md | lg | xl`
- `tone: neutral | accent | attention | critical`
- `format: currency | percent | plain`
- `delta: none | up | down | mixed`

**Estados**
- confirmed
- partial
- estimated
- unavailable

**Variables**
- value string
- prefix/suffix
- delta visibility

**Reglas de abuso**
- no usar color positivo automático para cualquier número;
- no mezclar real y esperado dentro del mismo value.

## 2.10 Label

**Propósito**  
Nombrar dato, grupo o control.

**Variantes**
- `size: s | m | l`
- `tone: primary | secondary | tertiary`
- `case: sentence | uppercase`

**Reglas de abuso**
- no usar uppercase para cuerpo importante;
- no duplicar label si título ya nombra.

## 2.11 Section Title

**Propósito**  
Abrir bloque semántico mayor.

**Anatomía**
- title
- optional supporting line
- optional trailing action

**Variantes**
- `support: none | line`
- `action: none | link`

**Reglas de abuso**
- no usar en Hero;
- no repetir título de pantalla dentro de bloque.

---

## 3. Composite Components

## 3.1 System Rail

**Propósito**  
Dar alcance de lectura sin competir con respuesta.

**Anatomía**
- inline metadata items
- separators

**Variantes**
- `items: 3 | 4`
- `wrap: single-line | truncate`

**Estados**
- complete
- partial

**Auto Layout**
- horizontal
- gap `8`
- hug height

**Constraints**
- fill width
- text truncation enabled

**Variables**
- item strings

**Tokens**
- type.label.s
- color.text.tertiary

**Reglas de abuso**
- no meter pills pesadas;
- no usarlo para acciones.

## 3.2 Hero

**Propósito**  
Resolver respuesta principal de pantalla.

**Anatomía**
- surface
- state line
- numeric value
- value label
- divider
- embedded Coverage Meter

**Variantes**
- `scenario: new | stable | attention | incomplete`
- `tone: raised | state-raised`

**Estados**
- new
- confirmed
- attention
- partial

**Auto Layout**
- vertical
- left aligned
- spacing custom, not uniform

**Constraints**
- fill width
- fixed min height

**Variables**
- state text
- value
- label
- coverage values

**Tokens**
- surface.raised
- radius.xl
- border.default
- elevation.soft

**Reglas de abuso**
- una sola instancia primaria por pantalla;
- no anidar otras surfaces internas.

## 3.3 Coverage Meter

**Propósito**  
Mostrar relación entre obligaciones cercanas y cobertura.

**Anatomía**
- title
- progress track
- left summary
- right summary

**Variantes**
- `state: stable | attention | critical | estimated`

**Estados**
- none
- partial
- covered
- uncovered

**Auto Layout**
- vertical
- gap `8`

**Reglas de abuso**
- no usar como componente genérico de KPI;
- no mezclar con metas de ahorro.

## 3.4 Stability Statement

**Propósito**  
Sintetizar lectura del estado actual en lenguaje natural.

**Anatomía**
- single sentence
- optional local tone

**Variantes**
- `kind: neutral | stable | attention | caution`
- `container: none | subtle`

**Estados**
- default

**Reglas de abuso**
- no convertirlo en consejo financiero;
- no exceder dos líneas.

## 3.5 Action Strip

**Propósito**  
Agrupar acción principal y secundarias contextuales.

**Anatomía**
- primary Button
- secondary action row

**Variantes**
- `secondary-count: 2 | 3 | 4`
- `primary: register | resolve | add-first-account | update`

**Estados**
- default
- reduced

**Auto Layout**
- vertical
- gap `8`

**Constraints**
- primary fill width
- secondary items fill row equally

**Variables**
- labels
- icon swaps

**Reglas de abuso**
- no poner dos acciones del mismo peso;
- no usar más de cuatro secundarias.

## 3.6 Financial Row

**Propósito**  
Comparar etiqueta y valor financiero en listas compactas.

**Anatomía**
- left label stack
- right value stack
- optional inline status
- optional chevron

**Variantes**
- `kind: simple | with-status | navigable`
- `density: compact | regular`

**Estados**
- default
- partial
- attention

**Auto Layout**
- horizontal
- space-between

**Constraints**
- left fill
- right hug

**Reglas de abuso**
- no usar para texto largo explicativo;
- no combinar más de una cifra principal por fila.

## 3.7 Information Block

**Propósito**  
Declarar calidad de información y acceso a evidencia.

**Anatomía**
- title
- primary line
- causal line
- link

**Variantes**
- `state: complete | partial | stale | conflict`

**Estados**
- default
- partial
- attention
- critical

**Auto Layout**
- vertical
- gap `8`

**Reglas de abuso**
- no reemplaza error state global;
- no esconder causa detrás del link.

## 3.8 Attention Banner

**Propósito**  
Exponer problema material con acción directa.

**Anatomía**
- left state bar
- title
- detail
- CTA
- optional trailing count

**Variantes**
- `severity: attention | critical`
- `action: button | link`

**Estados**
- default
- resolving

**Auto Layout**
- vertical
- gap `8`

**Reglas de abuso**
- una sola atención visible prioritaria por viewport;
- no usar para tips, educación o nudges.

## 3.9 Reserve Block

**Propósito**  
Mostrar dinero con propósito separado.

**Anatomía**
- title
- reserved amount
- purpose line
- optional CTA

**Variantes**
- `cta: none | contribute | release`
- `priority: normal | highlighted`

**Estados**
- active
- near-target
- paused

**Reglas de abuso**
- no usar si reserva no cambia lectura del disponible;
- no duplicar información de objetivos profundos.

## 3.10 Bottom Sheet

**Propósito**  
Explicar, evidenciar o resolver sin abandonar contexto.

**Anatomía**
- Sheet Header
- body slot
- optional sticky footer

**Variantes**
- `height: auto | half | full`
- `footer: none | actions`

**Estados**
- closed
- open
- loading

**Auto Layout**
- vertical
- body fill

**Constraints**
- pin bottom
- width fill parent

**Variables**
- title
- subtitle
- footer visibility

**Reglas de abuso**
- no usar para navegación profunda completa;
- no convertirlo en modal de formulario largo salvo caso excepcional.

## 3.11 Evidence Row

**Propósito**  
Desglosar cálculo o fuente dentro de evidencia.

**Anatomía**
- label
- value
- optional sign
- optional expand control

**Variantes**
- `kind: neutral | positive | negative | total`
- `expandable: yes | no`

**Estados**
- collapsed
- expanded

**Auto Layout**
- horizontal
- space-between

**Reglas de abuso**
- no usar fuera de evidencia o breakdown;
- no mezclar conceptos heterogéneos en una sola lista.

---

## 4. Feedback

## 4.1 Skeleton

**Propósito**  
Mantener estructura durante carga.

**Variantes**
- `block: hero | row | info | banner`

**Estados**
- loading

**Reglas de abuso**
- no mostrar skeleton en cargas instantáneas;
- no animar shimmer agresivo.

## 4.2 Empty State

**Propósito**  
Explicar ausencia válida y primer paso.

**Anatomía**
- title
- support line
- one primary action
- optional secondary

**Variantes**
- `kind: onboarding | no-data | no-results`

**Reglas de abuso**
- no usar ilustración decorativa;
- no culpar al usuario por falta de datos.

## 4.3 Partial State

**Propósito**  
Declarar lectura útil pero incompleta.

**Anatomía**
- inline status or block
- cause
- next action

**Variantes**
- `scope: local | block`

**Reglas de abuso**
- no tratarlo como error;
- no esconder qué falta.

## 4.4 Error State

**Propósito**  
Declarar falla real de sistema o fuente.

**Anatomía**
- title
- cause
- retry action

**Variantes**
- `scope: inline | block | screen`

**Reglas de abuso**
- no usar error para ambigüedad del dominio;
- no dramatizar visualmente.

## 4.5 Loading State

**Propósito**  
Mostrar proceso breve con masa estable.

**Variantes**
- `kind: inline | overlay | button`

**Reglas de abuso**
- no bloquear toda pantalla si cambio es local;
- no combinar spinner y skeleton juntos.

## 4.6 Success Banner

**Propósito**  
Confirmar cambio importante sin interrumpir lectura.

**Anatomía**
- short message
- optional undo

**Variantes**
- `scope: inline | transient`

**Reglas de abuso**
- no usar para acciones triviales;
- no competir con Hero.

---

## 5. Navigation

## 5.1 Top Navigation

**Propósito**  
Ubicar pantalla y acciones de primer nivel.

**Anatomía**
- title
- optional back
- optional trailing actions

**Variantes**
- `mode: root | child`
- `actions: none | one | two`

**Reglas de abuso**
- no meter metadata de System Rail aquí;
- no usar título largo de dos líneas.

## 5.2 Bottom Navigation

**Propósito**  
Navegar entre territorios principales.

**Anatomía**
- 3 to 5 items
- icon
- label
- active indicator

**Variantes**
- `items: 3 | 4 | 5`

**Estados**
- active
- inactive

**Reglas de abuso**
- no usar pills como tabs internas además de esto;
- no superar cinco destinos.

## 5.3 Modal Header

**Propósito**  
Encabezar modal full-screen.

**Anatomía**
- title
- subtitle optional
- close action
- optional trailing action

**Variantes**
- `subtitle: none | one-line`

**Reglas de abuso**
- no usarlo en bottom sheet;
- no duplicar CTA del body.

## 5.4 Sheet Header

**Propósito**  
Encabezar bottom sheet con agarre y contexto.

**Anatomía**
- drag handle
- title
- subtitle optional
- close optional

**Variantes**
- `close: none | icon`
- `subtitle: none | one-line`

**Reglas de abuso**
- no usar back navigation dentro de sheet;
- no meter más de dos líneas.

---

## 6. Árbol oficial del archivo de Figma

```text
00 Cover/
01 Foundations/
  Color Tokens/
  Typography Tokens/
  Spacing Tokens/
  Radius + Borders + Elevation/
  Motion Tokens/
  Icon Grid/
02 Primitives/
  Button/
  Icon Button/
  Text Link/
  Surface/
  Divider/
  Pill/
  Inline Status/
  Progress Track/
  Numeric Value/
  Label/
  Section Title/
03 Composites/
  System Rail/
  Hero/
  Coverage Meter/
  Stability Statement/
  Action Strip/
  Financial Row/
  Information Block/
  Attention Banner/
  Reserve Block/
  Bottom Sheet/
  Evidence Row/
04 Feedback/
  Skeleton/
  Empty State/
  Partial State/
  Error State/
  Loading State/
  Success Banner/
05 Navigation/
  Top Navigation/
  Bottom Navigation/
  Modal Header/
  Sheet Header/
06 Patterns/
  Now/
  Upcoming/
  Changes/
  Progress/
  Reality/
07 Screens/
  iOS/
  Android/
  Tablet/
08 Specs/
  Usage Notes/
  Release Notes/
09 Archive/
  Deprecated/
  Replaced/
```

---

## 7. Convención oficial de nombres

### 7.1 Pages
- `01 Foundations`
- `02 Primitives`
- `03 Composites`
- `04 Feedback`
- `05 Navigation`

### 7.2 Components

Formato:

`Domain / Component / VariantGroup1=Value / VariantGroup2=Value`

Ejemplos:
- `Primitive / Button / Kind=Primary / Size=LG / State=Default`
- `Composite / Financial Row / Kind=Navigable / Density=Regular / State=Default`
- `Feedback / Partial State / Scope=Block`

### 7.3 Variables

Formato:

`category.role.state`

Ejemplos:
- `color.text.secondary`
- `type.heading.m`
- `space.24`
- `radius.lg`
- `motion.duration.sheet`

### 7.4 Component properties

Formato:
- `Label`
- `Value`
- `Icon`
- `State`
- `Kind`
- `Size`
- `Tone`
- `Show CTA`
- `Show Delta`

### 7.5 Layers inside components

Formato:
- `Container`
- `Content`
- `Label`
- `Value`
- `Meta`
- `Action`
- `Divider`
- `Icon`

No usar:
- `Group 123`
- `Rectangle 44`
- `Frame copy final 2`

---

## 8. Reglas para mantener librería durante años

1. no crear componente nuevo si una variante resuelve caso;
2. no crear variante nueva si propiedad booleana resuelve caso;
3. no crear propiedad si cambia semántica del componente;
4. primitives no conocen territorios del producto;
5. composites sí conocen semántica financiera;
6. un cambio en foundation obliga revisión de impactos en pages 02 a 05;
7. todo componente debe tener:
   - playground
   - spec mínima
   - states completos
8. deprecations viven en `09 Archive`, nunca se borran sin reemplazo;
9. cualquier componente sin uso en dos releases entra en auditoría;
10. un componente no puede existir si:
   - duplica otro;
   - solo aparece en una pantalla;
   - resuelve capricho visual;
11. toda variante debe poder nombrarse en una frase humana;
12. toda decisión de librería debe proteger claridad futura antes que velocidad presente.

---

## 9. Auditoría del sistema

### ¿Qué componente sobra?

Ninguno sobra hoy.  
Más frágiles:

- `Pill`, porque puede tentar abuso de filtros y pseudo-tabs;
- `Success Banner`, porque podría terminar reemplazado por inline confirmations si equipo pierde disciplina.

No eliminarlos todavía. Sí vigilarlos.

### ¿Qué componente todavía falta?

Falta uno solo si futura construcción lo exige:

- `Input Field`

No lo agrego ahora porque pedido actual congela librería alrededor de lectura y composición de `Ahora`, no flujos de captura completos. Cuando construyamos `Actuar`, habrá que decidir si `Input Field` es primitive oficial o familia separada de forms.

### Regla final

No agregar componentes por comodidad.  
Biblioteca v1 existe para construir producto con rigor, no para inflar inventario.

Si una pantalla no puede hacerse con esto, primero probar:

1. reusar primitive;
2. componer composite;
3. extender variante;
4. recién entonces proponer componente nuevo.
