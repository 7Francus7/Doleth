# Freeze 002 - Actuar

**Estado:** frozen after Dia 9 verification
**Superficie:** Actuar
**Alcance:** primera superficie cerrada
**Fuentes de verdad:**

- `docs/design-spec-002-actuar.md`
- `docs/design-spec-002-actuar-visual.md`
- `src/features/act/*`
- `DESIGN.md`

## 1. Resumen

Actuar queda congelada como la primera superficie cerrada de Doleth.

La superficie responde una sola pregunta:

> Que conviene hacer ahora

Y hoy la responde como herramienta personal y experta, no como SaaS publico
ni como flujo bancario completo.

## 2. Commits incluidos

La version congelada de Actuar incluye estos commits del tramo Dia 3 a Dia 8:

- `765663d` - `feat: assemble actuar recommendation screen`
- `c3eab33` - `feat: add actuar recommendation evidence`
- `aae42f0` - `feat: add actuar recommendation decision outcomes`
- `4b562d5` - `feat: add actuar contextual confirmation state`
- `42f6068` - `feat: add actuar local confirmation receipt state`
- `1967aff` - `refactor(act): simplify actuar decision flow`
- `2713ef0` - `docs(act): align actuar specs with day 7 implementation`

Queda fuera de esta lista `66bcf1f` porque funciona como inicializacion previa
de la superficie, anterior al tramo congelado que se esta cerrando.

## 3. Que quedo congelado

Queda congelado:

- una sola recomendacion prioritaria;
- una razon breve fuera del bloque principal;
- evidencia accesible por sheet sin perder contexto;
- comparacion de impacto solo en estado inicial;
- decision principal `Revisar y confirmar`;
- salida lateral `Dejar para despues`;
- salida lateral `No insistir con esto`;
- confirmacion contextual breve;
- recibo local breve;
- accion de `Deshacer`;
- accion de `Cerrar`;
- estados `idle`, `confirming`, `confirmed`, `deferred`, `dismissed`;
- comportamiento movil en `320` y `390`;
- tono personal, directo y no SaaS.

## 4. Que NO esta incluido

No queda incluido en este freeze:

- ejecucion real de dinero;
- persistencia;
- backend;
- verificacion de resultado externo;
- actualizacion automatica de `Ahora`;
- mas de una recomendacion simultanea;
- estados de error operativo real;
- estados de contexto vencido o recalculo automatico;
- onboarding, wizard o flujos para desconocidos;
- nuevas variantes visuales fuera de los cinco estados actuales.

## 5. Estados de la experiencia

### Idle

Muestra recomendacion, razon, impacto y decision.

### Confirming

Mantiene recomendacion y razon, retira impacto y presenta confirmacion con:

- importe;
- origen;
- destino;
- efecto esperado.

### Confirmed

Deja un recibo local breve.
No declara exito externo.

### Deferred

Acorta la pantalla y deja la decision en pausa con posibilidad de retomar.

### Dismissed

Acorta la pantalla y deja de insistir con esa sugerencia en el contexto actual.

### Evidencia

Existe como soporte transversal del estado inicial y se abre en bottom sheet.
No constituye un estado principal de la pantalla.

## 6. Componentes reutilizados

Actuar se apoya en componentes ya existentes del sistema:

- `SystemRail`
- `Surface`
- `NumericValue`
- `Label`
- `Divider`
- `TextLink`
- `Button`
- `SectionTitle`
- `FinancialRow`
- `BottomSheet`
- `EvidenceRow`

Tambien reutiliza:

- tokens de motion de `design-system/tokens`;
- primitives y composites de `design-system`;
- layout y tono definidos por `DESIGN.md`.

## 7. Validaciones

En Dia 9 se verifico:

- lectura de specs funcional y visual;
- lectura de `src/features/act/*` relevante a experiencia y copy;
- coincidencia entre docs e implementacion;
- `npm run lint` - OK;
- `npm run build` - OK;
- `npm run build-storybook` - OK;
- QA Storybook `320` y `390` - OK;
- estados `idle`, `confirming`, `confirmed`, `deferred`, `dismissed` - OK.

Hallazgos:

- no aparecio bug real que justificara tocar UI;
- los docs siguen alineados con la implementacion actual;
- la pantalla ya puede considerarse superficie cerrada.

## 8. Riesgos pendientes

Riesgos que siguen abiertos, pero fuera del freeze:

- el flujo sigue siendo local y no representa ejecucion real;
- si entra persistencia, `confirmed` puede necesitar separarse de un resultado real;
- si aparecen recomendaciones multiples, la arquitectura actual no las cubre;
- si `Ahora` empieza a enviar mas contexto operativo, puede aparecer tension en el rail;
- evidencia y confirmacion siguen calibradas al caso actual de una sola prioridad.

## 9. Criterio para reabrir Actuar

Actuar solo debe reabrirse si aparece al menos una de estas condiciones:

1. existe una necesidad real de ejecucion o persistencia;
2. una prueba de uso muestra que el flujo actual sigue siendo largo o ambiguo;
3. `320` deja de respirar bien con contenido real;
4. aparece un segundo tipo de recomendacion que no entra en la estructura actual;
5. `Ahora` necesita devolver o consumir estados que rompen esta continuidad;
6. se detecta una divergencia real entre docs, storybook e implementacion.

Fuera de esos casos, Actuar se considera cerrada y no debe acumular cambios
incrementales por gusto.
