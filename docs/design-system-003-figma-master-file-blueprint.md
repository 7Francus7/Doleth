# DESIGN SYSTEM 003 - Figma Master File Blueprint

Estado: oficial  
Fecha: 2 de julio de 2026  
Autoridad: arquitectura del archivo maestro de Figma de Doleth  
Depende de: `DESIGN.md`, `design-system-002-component-library-v1.md`

## 1. Arquitectura del archivo

Orden oficial de páginas:

```text
00 Cover
01 Read Me
02 Foundations
03 Variables
04 Primitives
05 Composites
06 Feedback
07 Navigation
08 Patterns
09 Screens
10 Prototypes
11 Playground
12 QA
13 Archive
14 Resources
```

### 00 Cover
**Propósito**  
Portada institucional. Nombre del sistema, versión, owners, fecha de publicación, enlaces a documentación y estado de librería.

**Por qué va primero**  
Abre archivo y orienta en 5 segundos.

### 01 Read Me
**Propósito**  
Reglas operativas para usar archivo. Qué se edita, qué no se edita, cómo publicar, cómo proponer cambios.

**Por qué va segundo**  
Evita que equipo entre a editar componentes sin contexto.

### 02 Foundations
**Propósito**  
Mostrar principios atómicos visibles del sistema: color, tipografía, spacing, radius, borders, elevation, motion, icons.

**Por qué antes de Variables**  
Diseñadores piensan primero en lenguaje visible, no en backend de tokens.

### 03 Variables
**Propósito**  
Mapa técnico de variables, collections, modes, alias y naming. Es capa de infraestructura.

**Por qué después de Foundations**  
Explica cómo se implementa lo que Foundations muestra.

### 04 Primitives
**Propósito**  
Componentes atómicos reutilizables.

### 05 Composites
**Propósito**  
Componentes semánticos de producto hechos con primitives.

### 06 Feedback
**Propósito**  
Estados transversales: loading, partial, empty, success, error.

### 07 Navigation
**Propósito**  
Piezas estructurales de navegación y contenedores de flujo.

### 08 Patterns
**Propósito**  
Combinaciones aprobadas de componentes para resolver problemas repetidos sin crear pantallas completas.

### 09 Screens
**Propósito**  
Pantallas maestras aprobadas por territorio y estado.

### 10 Prototypes
**Propósito**  
Flujos navegables oficiales. Solo demos validadas, no exploración.

### 11 Playground
**Propósito**  
Espacio temporal de exploración. Nada aquí es oficial hasta migrarse.

### 12 QA
**Propósito**  
Casos de validación visual, responsive, edge cases, contraste, truncation, localization.

### 13 Archive
**Propósito**  
Deprecated, replaced, old specs, migration references.

### 14 Resources
**Propósito**  
Assets auxiliares: icon exports, copy rules, device frames, links útiles.

---

## 2. Dentro de cada página

## 00 Cover

Estructura:
- nombre del sistema
- versión actual
- owners
- fecha de última publicación
- changelog breve
- links a docs
- badges:
  - `Stable`
  - `In review`
  - `Deprecated paths present`

## 01 Read Me

Secciones:
- `What this file is`
- `Editing rules`
- `Publishing rules`
- `Naming rules`
- `Governance`
- `Where to propose new components`

Debe incluir:
- lista de páginas bloqueadas para edición general
- owners por dominio
- convención de branch/page duplication

## 02 Foundations

Secciones internas:

### Color
- palette source
- semantic map
- role-based tokens
- do / don't

### Typography
- families
- type scale
- numeric rules
- text role examples

### Spacing
- token ladder
- examples of semantic grouping

### Radius
- visual ladder with use cases

### Borders
- subtle/default/strong/state

### Elevation
- tonal vs shadow hierarchy

### Motion
- timing table
- curve table
- usage examples

### Icons
- grid
- stroke rules
- approved metaphor set

Regla de layout de página:
- una sección por fila mayor
- cada sección con spec rail izquierda y examples derecha
- no mezclar implementation notes con showcase visual

## 03 Variables

Secciones:
- Collections overview
- Modes overview
- Alias map
- Naming rules
- Token lifecycle
- Deprecated variables

Cada sección debe mostrar:
- variable name
- type
- collection
- mode coverage
- aliases
- consumers

## 04 Primitives

Secciones:
- one component family per section
- master set
- variants matrix
- property panel examples
- do / don't
- instance examples

Cada familia usa layout:
- izquierda: anatomy + rules
- centro: main component set
- derecha: variants, edge cases, do/don't

## 05 Composites

Misma estructura que Primitives, pero además:
- semantic usage
- allowed children
- forbidden substitutions

## 06 Feedback

Secciones por state family:
- loading
- partial
- empty
- success
- error

Cada una muestra:
- inline version
- block version
- screen version si existe

## 07 Navigation

Secciones:
- Top Navigation
- Bottom Navigation
- Modal Header
- Sheet Header

Además:
- safe area behavior
- title truncation rules
- action count limits

## 08 Patterns

Solo patrones aprobados. No pantallas completas.

Secciones iniciales:
- Hero + Stability + Actions
- Financial Summary Stack
- Evidence Breakdown Sheet
- Attention + Resolution
- Empty + First Action
- Partial + Update Path

Cada patrón debe mostrar:
- problema que resuelve
- componentes usados
- allowed substitutions
- responsive notes

## 09 Screens

Estructura:
- territorio por frame group
- estados por fila
- device sizes por columna si hace falta

Para cada pantalla:
- master approved
- annotations mínimas
- links a patterns/componentes fuente

No se edita directamente sin pasar por governance.

## 10 Prototypes

Estructura:
- flujo principal
- edge flow
- onboarding flow
- evidence flow

Cada flow:
- cover node
- entry points
- success paths
- fallback paths

## 11 Playground

Subsecciones:
- in progress
- review pending
- spike
- rejected candidates

Reglas:
- todo bloque con owner, fecha, expiry
- nada vive acá más de 30 días sin decisión

## 12 QA

Secciones:
- text overflow
- currency length
- localization
- partial states
- attention states
- missing values
- small device checks
- tablet checks
- dark mode reserved only if product adopts it later

## 13 Archive

Secciones:
- deprecated components
- replaced variants
- old patterns
- migration references

Todo archivado debe tener:
- replacement
- deprecation date
- sunset date

## 14 Resources

Secciones:
- device frames
- icon source files
- copy templates
- workshop boards
- links to docs

---

## 3. Variables

## 3.1 Collections

Collections oficiales:
- `Color`
- `Typography`
- `Spacing`
- `Radius`
- `Border`
- `Elevation`
- `Motion`
- `Layout`

## 3.2 Modes

### Color
- `Core`
- `Light`
- `State`

Uso:
- `Core` guarda primitives neutrales y semantic families base
- `Light` resuelve alias operativos de producto actual
- `State` agrupa attention/critical/info/stable mappings

### Typography
- `Base`

### Spacing
- `Base`

### Radius
- `Base`

### Border
- `Base`
- `State`

### Elevation
- `Base`

### Motion
- `Base`

### Layout
- `Phone`
- `Tablet`

## 3.3 Aliases

Regla:
- components nunca consumen raw palette si existe alias funcional.

Ejemplo:
- `color.palette.ink.700` puede existir como source
- componente consume `color.text.primary`

Jerarquía:
1. source variable
2. semantic alias
3. component application

## 3.4 Cuándo crear variable nueva

Crear nueva variable solo si:
1. valor se reutilizará en 3 o más lugares;
2. representa rol semántico nuevo real;
3. necesita mode switching;
4. evita hardcode repetido;
5. su ausencia generaría drift.

## 3.5 Cuándo reutilizar

Reutilizar si:
1. diferencia es solo visual menor;
2. mismo rol semántico;
3. mismo comportamiento cross-platform;
4. cambio local puede resolverse por layout, no por token.

## 3.6 Cómo evitar deuda técnica

1. no crear alias por componente salvo excepciones muy justificadas;
2. no duplicar `text.secondary` y `caption.secondary` si cumplen mismo rol;
3. no mezclar source y alias dentro del mismo component set;
4. toda variable deprecada debe mapear a replacement;
5. cada nueva variable debe listar consumers esperados.

---

## 4. Component Sets

## 4.1 Naming

Formato oficial:

`[Layer] / [Component] / [Property]=[Value] / [Property]=[Value]`

Ejemplos:
- `Primitive / Button / Kind=Primary / Size=LG / State=Default`
- `Composite / Information Block / State=Partial`

## 4.2 Variants

Reglas:
1. variant expresa diferencia estructural o de comportamiento;
2. text change no crea variant;
3. icon swap no crea variant si property lo resuelve;
4. state sí crea variant;
5. density sí crea variant cuando afecta layout.

## 4.3 Properties

Tipos permitidos:
- Variant
- Boolean
- Instance Swap
- Text

## 4.4 Booleans

Usar boolean cuando:
- muestra/oculta icono
- muestra/oculta CTA secundaria
- muestra/oculta supporting text
- muestra/oculta divider

No usar boolean cuando:
- cambia semántica principal
- cambia padding estructural mayor
- genera ramas imposibles de QA

## 4.5 Instance Swap

Usar para:
- iconos
- nested primitives aprobadas
- action types equivalentes

No usar para:
- intercambiar bloques semánticos distintos
- resolver composición de pantalla

## 4.6 Text Properties

Todo componente con copy variable debe exponer:
- title
- body
- label
- value
- helper

Reglas:
- text property names siempre en inglés estable;
- content final puede ser español de producto.

## 4.7 Reglas permanentes

1. un component set no supera 6 dimensions de variant;
2. si supera, dividir familia;
3. component set debe incluir:
   - happy path
   - edge state
   - disabled/loading si aplica
4. nested instances usan published components, no local duplicates;
5. cualquier override crítico debe quedar preservable en instance.

---

## 5. Auto Layout

## 5.1 Reglas globales

1. todo componente debe usar Auto Layout;
2. frames sueltos sin Auto Layout solo para artwork, never for UI;
3. padding y spacing usan variables siempre que posible;
4. no usar positioning absoluto salvo:
   - overlays controlados
   - badges excepcionales
   - drag handles

## 5.2 Padding

Reglas:
- usar tokens `space.*`
- no usar padding custom no tokenizado salvo optical corrections documentadas
- optical corrections se aplican dentro del componente, no en instancias

## 5.3 Spacing

Reglas:
- stack vertical: spacing semántico, no uniforme ciego
- horizontal rows: preferir `space-between` si hay label/value
- gaps pequeños: `4` o `8`
- gaps medios: `12` o `16`
- gaps mayores: `20`, `24`, `32`

## 5.4 Hug / Fill / Fixed

Reglas:
- text containers: hug width, hug height si posible
- buttons primarios: fill width dentro de strips
- secondary controls: fill or fixed according to row system
- numeric values: hug
- top-level blocks: fill width

## 5.5 Min / Max

Reglas:
- componentes con texto variable deben definir min useful width en docs;
- no fijar max width dentro de component salvo cuando protege legibilidad;
- screen-level patterns definen max readable widths, no primitives.

## 5.6 Responsive

Reglas:
- components deben reflow, no duplicarse;
- usar nested auto layout para colapsar stacks;
- evitar fixed heights salvo componentes muy controlados;
- fixed width solo en icon buttons, nav items, markers y ciertos controls.

---

## 6. Responsive Strategy

Objetivo: un componente, múltiples contextos.

## 6.1 Base

Todo componente se diseña primero en ancho flexible de phone standard.

## 6.2 iPhone SE

Reglas:
- permite wrapping vertical
- supporting text puede truncar a 2 líneas
- secondary actions pueden reflow
- numeric values mantienen tamaño, pero label puede comprimirse

## 6.3 iPhone Pro Max

Reglas:
- componentes expanden ancho, no densidad;
- no introducir gaps gigantes solo porque entra más aire.

## 6.4 Android

Reglas:
- misma arquitectura;
- tolerar strings algo más largas;
- touch targets nunca bajan de mínimo operativo definido en components.

## 6.5 Tablet

Reglas:
- componente conserva anatomía;
- pattern cambia distribución;
- no crear “tablet-only component” salvo navegación estructural.

## 6.6 Regla central

Responsive se resuelve por:
1. fill containers
2. wrapping controlled
3. optional booleans
4. pattern composition

No por duplicar componentes por device.

---

## 7. Tokens -> Variables -> Componentes -> Pantallas

Flujo oficial:

```text
Source token
-> Semantic variable
-> Applied variable alias
-> Primitive component
-> Composite component
-> Pattern
-> Screen
```

### Ejemplo color

`Ink 700`
-> `color.text.primary`
-> Button secondary label
-> Action Strip secondary item
-> Pattern `Hero + Actions`
-> Screen `Ahora / Stable`

### Ejemplo spacing

`space.24`
-> vertical section rhythm
-> Surface padding
-> Information Block
-> Screen stack

### Regla de limpieza

Pantallas nunca aplican hex, type styles sueltos o spacing arbitrario.

Pantallas solo componen:
- published components
- published patterns
- approved layout variables

---

## 8. Quality Gates

Antes de publicar un componente debe cumplir:

1. usa Auto Layout
2. usa variables, no hardcodes innecesarios
3. no consume raw palette si existe alias
4. naming cumple convención oficial
5. variant names son humanos y consistentes
6. property names son estables
7. text properties expuestas donde corresponde
8. booleans cubren visibilidad real
9. no hay layers huérfanas
10. no hay `Frame 123` ni `Rectangle 99`
11. paddings usan tokens
12. spacing usa tokens
13. radius usa tokens
14. border usa tokens
15. elevation usa tokens
16. typography usa tokens
17. color states completos
18. disabled state si aplica
19. loading state si aplica
20. partial/error state si aplica
21. responsive behavior probado en ancho corto
22. responsive behavior probado en ancho amplio
23. text overflow revisado
24. long numbers revisados
25. localization stress revisado
26. nested instances publicadas, no locales
27. no overrides frágiles para funcionar
28. no usa absolute positioning salvo excepción aprobada
29. constraints correctos
30. no rompe al cambiar icon swap
31. no rompe al ocultar supporting text
32. contrastes correctos
33. semantic role claro
34. tiene usage notes
35. tiene abuse notes
36. tiene owner asignado
37. tiene fecha de publicación
38. tiene changelog inicial
39. fue probado dentro de pattern real
40. fue revisado por systems owner

---

## 9. Versionado

## 9.1 Agregar componentes

Solo si:
1. caso real de pantalla falla con librería actual;
2. no puede resolverse con variante;
3. no puede resolverse con pattern;
4. governance aprueba.

Version bump:
- additive compatible: minor
- breaking structural: major
- typo/docs only: patch

## 9.2 Deprecar

Proceso:
1. marcar componente `Deprecated`
2. indicar replacement
3. mover copia a `13 Archive`
4. mantener published hasta migración
5. definir sunset date

## 9.3 Renombrar

No renombrar sin migration window.

Proceso:
1. crear nuevo nombre
2. deprecar viejo
3. mapear replacement
4. migrar instancias
5. retirar en siguiente major

## 9.4 Dividir

Si component set crece demasiado:
1. identificar semánticas distintas
2. separar sin romper instances viejas
3. mantener wrapper o legacy set temporal

## 9.5 Migrar

Toda migración exige:
- reason
- impact list
- replacement path
- owners
- deadline

Pantallas existentes no se rompen en la misma release que nace reemplazo.

---

## 10. Design Governance

## 10.1 Regla oficial

Ninguna pantalla puede inventar componentes.

Debe probar primero:
1. primitive existente;
2. composite existente;
3. variant nueva;
4. pattern nuevo con componentes existentes.

## 10.2 Si necesita componente nuevo

Pasos:

1. documentar caso real de pantalla
2. demostrar por qué primitives/composites no alcanzan
3. proponer semántica del componente
4. listar variantes mínimas
5. listar riesgos de abuso
6. prototipar en `11 Playground`
7. revisión por systems owner
8. revisión por product designer owner del territorio
9. QA en pattern real
10. publicación controlada

## 10.3 Criterios de aprobación

Se aprueba solo si:
- resuelve problema repetible;
- evita deuda mayor;
- no duplica otra familia;
- puede sostenerse 3+ años;
- tiene nombre claro;
- encaja con grammar del producto.

## 10.4 Entrada a librería

Ruta:

```text
Playground
-> Review
-> QA
-> Publish
-> Pattern adoption
-> Screen adoption
```

## 10.5 Owners

Roles mínimos:
- Systems Owner
- Product Design Owner
- QA Reviewer

Nadie publica solo.

---

## 11. Blueprint definitivo

Archivo maestro de Figma de Doleth se sostiene sobre cinco capas:

```text
Foundations
-> Variables
-> Components
-> Patterns
-> Screens
```

Con tres capas de control:

```text
Read Me
-> QA
-> Archive
```

Y dos capas de trabajo:

```text
Playground
-> Prototypes
```

Regla final:

**si el archivo permite velocidad pero no preserva verdad estructural, está mal diseñado.**

El archivo debe hacer obvio:
- qué es oficial;
- qué está en revisión;
- qué está deprecado;
- qué puede reutilizarse;
- quién puede cambiarlo.

Ese orden, no belleza del archivo, es lo que permitirá sostener cientos de pantallas durante años sin perder consistencia.
