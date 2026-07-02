# RFC-002 — Knowledge Governance

Estado: propuesto
Fecha: 2 de julio de 2026
Owner inicial: Doleth

---

## 0. Mandato

Desde este momento, Doleth deja de ser conjunto de documentos dispersos.
Pasa a operar como **especificación viva**.

Este RFC define reglas de evolución intelectual de Doleth.

Su función no es describir producto, código o UX.
Su función es proteger coherencia de conocimiento durante diez o veinte años.

Si RFC-001 gobierna cómo se valida conocimiento,
RFC-002 gobierna cómo ese conocimiento cambia.

---

## 1. Filosofía

### 1.1 Por qué una especificación necesita gobernanza

Una especificación sin gobernanza deriva.

Al principio parece ordenada.
Con el tiempo aparecen:

- documentos que se contradicen
- definiciones que mutan sin trazabilidad
- fixes locales que rompen principios globales
- equipos distintos usando verdades distintas
- producto implementando interpretaciones incompatibles

Doleth no puede tolerar eso.

Porque Doleth no vende feature.
Vende criterio.

Y criterio solo existe si conocimiento interno conserva:

- autoridad
- trazabilidad
- compatibilidad
- validación

### 1.2 Qué problemas evita

Knowledge Governance evita:

- cambios silenciosos de tesis
- inflación documental sin jerarquía
- conflicto entre narrativa, ontología y validación
- local optimizations que fracturan sistema
- documentación histórica imposible de auditar
- canons que dejan de significar lo mismo entre versiones

### 1.3 Qué riesgos aparecen sin gobernanza

Sin gobernanza aparecen cinco riesgos estructurales:

1. **drift conceptual**
   mismas palabras empiezan a significar cosas distintas

2. **dualidad de verdad**
   distintos equipos operan con documentos distintos como si fueran fuente primaria

3. **ruptura de compatibilidad**
   cambios razonables localmente destruyen coherencia del conjunto

4. **deuda epistemológica**
   se acumulan excepciones no resueltas y nadie sabe si son errores, límites o decisiones

5. **amnesia institucional**
   se pierde por qué una decisión fue tomada y se reabre la misma discusión cada año

---

## 2. Tipos de documentos

Doleth debe clasificar todo conocimiento en familias documentales.

### 2.1 Fundacionales

Documentos:

- `doleth-brand-foundation.md`
- `doleth-constitucion-producto.md`
- `doleth-arquitectura-conceptual.md`

Autoridad:
definen identidad, misión, tesis de producto y marco conceptual superior.

Pueden modificar:

- narrativa estratégica
- lenguaje permitido
- orientación de documentos normativos

No pueden modificar directamente:

- corpus
- canons
- schemas
- RFC ya ratificados

Regla:
solo pueden cambiar mediante RFC explícito que declare impacto sobre compatibilidad.

### 2.2 Normativos

Documentos:

- `doleth-ontologia-financiera.md`
- `doleth-estados-del-valor.md`
- `doleth-motor-cognitivo.md`

Autoridad:
definen lenguaje formal, máquina conceptual y reglas permanentes de interpretación.

Pueden modificar:

- criterios de validación
- estructuras aceptables del corpus
- expectations de canons futuros

No pueden modificar directamente:

- brand foundation
- constitución
- RFC de governance

Regla:
todo cambio normativo debe pasar por RFC y validación contra corpus/canon.

### 2.3 RFC

Documentos:

- `rfc-001-corpus-universal-de-la-vida-financiera.md`
- `rfc-002-knowledge-governance.md`
- futuros `rfc-xxx`

Autoridad:
definen cambios deliberados al sistema de conocimiento.

Pueden modificar:

- procesos
- estructuras
- políticas de versionado
- criterios de aceptación
- relación entre documentos

No pueden modificar directamente:

- verdad validada del corpus
- resultados históricos

Regla:
un RFC no reescribe pasado; lo supersede con trazabilidad.

### 2.4 Corpus

Artefactos:

- `corpus/manifest.yaml`
- `corpus/taxonomy/*`
- `corpus/suites/**/*`
- `corpus/schemas/*`
- `corpus/templates/*`

Autoridad:
define sistema de validación conceptual y cobertura de escenarios.

Puede modificar:

- cobertura
- tags
- schemas
- criterios operativos de authoring

No puede modificar directamente:

- ontología
- estados
- motor cognitivo
- brand foundation

Regla:
corpus valida conocimiento; no legisla conocimiento superior.

### 2.5 Canon

Artefactos:

- `doleth-canon-1.0.md`
- `corpus/canons/**/*`

Autoridad:
define subset fundacional que toda versión futura debe comprender.

Puede modificar:

- gates permanentes de regresión conceptual

No puede modificar directamente:

- ontología
- arquitectura
- governance

Regla:
canon congela escenarios; no cambia teoría por sí solo.

### 2.6 Governance

Documentos:

- `rfc-002-knowledge-governance.md`
- futuros RFC de governance

Autoridad:
define cómo cambia todo lo demás.

Puede modificar:

- ciclo de vida del conocimiento
- políticas de conflicto
- jerarquía documental
- freezes
- versionado de especificación

No puede modificar directamente:

- identidad de marca
- tesis de producto
- ontología

Regla:
governance gobierna proceso y autoridad, no contenido sustantivo del dominio.

### 2.7 Implementación

Artefactos futuros:

- specs técnicas
- decisiones de arquitectura de software
- pruebas
- código

Autoridad:
subordinada.

Puede modificar:

- nada aguas arriba

Regla:
implementación debe obedecer especificación, no reinterpretarla.

---

## 3. Jerarquía del conocimiento

### 3.1 Pirámide de autoridad

De mayor a menor prioridad:

1. `RFC-002 Knowledge Governance`
2. `Brand Foundation`
3. `Constitución del Producto`
4. `Arquitectura Conceptual`
5. `Ontología Financiera`
6. `Estados del Valor`
7. `Motor Cognitivo`
8. `RFCs temáticos vigentes`
9. `Canon vigente`
10. `Corpus`
11. `Implementación`

### 3.2 Regla de conflicto

Si dos documentos entran en conflicto:

- primero manda nivel superior
- si están en mismo nivel, manda documento más específico dentro del mismo dominio
- si siguen en conflicto, se congela decisión y se abre RFC de resolución

### 3.3 Resolución por tipo

- conflicto de identidad o lenguaje: prevalece `Brand Foundation`
- conflicto de misión o dirección de producto: prevalece `Constitución`
- conflicto de modelo conceptual general: prevalece `Arquitectura Conceptual`
- conflicto de primitives y verbos: prevalece `Ontología`
- conflicto de operatividad del valor: prevalecen `Estados del Valor`
- conflicto de inferencia, hipótesis o verdad provisional: prevalece `Motor Cognitivo`
- conflicto de proceso o autoridad: prevalece `RFC-002`

### 3.4 Regla de no edición silenciosa

Ningún documento de nivel inferior puede editar lenguaje de nivel superior como si fuera refactor editorial.

Si cambia significado, no es edición.
Es cambio de autoridad.

---

## 4. Compatibilidad conceptual

### 4.1 Qué significa romper compatibilidad conceptual

Romper compatibilidad conceptual significa que una versión nueva de la especificación ya no puede interpretar, validar o explicar correctamente escenarios, principios o decisiones que antes eran parte legítima del modelo.

Se rompe compatibilidad si ocurre cualquiera de estas condiciones:

1. cambia significado de un primitive central
2. cambia semántica de un verbo económico
3. cambia legalidad de una transición de estado fundacional
4. cambia criterio de verdad sin política de migración
5. un caso del canon deja de ser interpretable sin redefinir su fenómeno
6. dos documentos vigentes pasan a exigir lecturas incompatibles de misma realidad

### 4.2 Cambios compatibles

Son compatibles:

- aclaraciones editoriales sin cambio semántico
- ejemplos nuevos que no alteran teoría
- nuevos tags del corpus sin colisión semántica
- nuevos escenarios que extienden cobertura
- refinamientos de wording que preservan mismo significado formal
- heurísticas nuevas del motor cognitivo que no alteran invariantes

### 4.3 Cambios compatibles con migración

Son compatibles solo con migración explícita:

- renombrar concepto preservando semántica
- partir una categoría en dos sub categorías
- endurecer criterio de aceptación del corpus
- cambiar confidence policy del motor sin alterar verdad final

### 4.4 Cambios incompatibles

Son incompatibles:

- pasar `inversión` a átomo ontológico si hoy no lo es
- tratar transferencia interna como ingreso neto en algún contexto
- cambiar definición de liquidez de forma que rompa canon vigente
- convertir incertidumbre en detalle opcional
- permitir mezcla de esferas sin evento explícito

### 4.5 Qué cambios requieren nueva versión

- cambio compatible: `minor`
- cambio compatible con migración: `minor` con migration note obligatoria
- cambio incompatible: `major`

### 4.6 Qué cambios obligan a crear nuevo Canon

Nuevo canon es obligatorio si ocurre cualquiera:

1. cambia columna vertebral de escenarios fundacionales
2. grupo entero del canon actual deja de representar frontera real del modelo
3. se incorpora nueva clase de realidad imposible de expresar en canon vigente
4. más del 20% de casos `regression_locked` requieren reinterpretación semántica
5. cambia criterio fundacional de verdad, estado o decisión

---

## 5. Ciclo de vida del cambio

Todo cambio intelectual debe seguir este ciclo:

1. **Señal**
   aparece tensión, contradicción, evidencia nueva o hueco

2. **Formulación**
   se escribe problema con lenguaje explícito:
   qué falla, dónde, por qué importa

3. **Clasificación**
   se determina tipo:
   editorial, normativo, validatorio, fundacional o governance

4. **Discusión**
   se comparan alternativas y costo conceptual

5. **RFC**
   si cambio supera umbral local, se documenta en RFC

6. **Revisión de compatibilidad**
   se evalúa:
   qué rompe, qué preserva, qué migra

7. **Validación**
   se corre contra corpus y canon relevantes

8. **Ratificación**
   cambio queda aceptado, rechazado o aceptado con límites

9. **Propagación**
   se actualizan documentos afectados en orden de autoridad

10. **Registro histórico**
    se deja changelog, rationale y versión resultante

11. **Gate a implementación**
    recién entonces el conocimiento puede bajar a specs técnicas, producto o código

### 5.1 Umbral para exigir RFC

RFC es obligatorio si cambio:

- altera un principio
- altera una definición normativa
- afecta casos del canon
- cambia política de governance
- introduce nuevo tipo de evidencia, verdad o estado
- invalida decisión histórica relevante

### 5.2 Cambios que no exigen RFC

No exigen RFC:

- typo
- estilo
- ejemplo nuevo sin peso normativo
- aclaración que no cambia semántica

Pero igual requieren changelog si tocan documento normativo o fundacional.

---

## 6. Versionado

### 6.1 Política general

Todo artefacto de conocimiento debe usar semver:

- `major`: ruptura conceptual
- `minor`: extensión compatible
- `patch`: ajuste no semántico o fix local sin cambio de teoría

### 6.2 Ontología

- `major`: cambia primitive, verbo o gramática básica
- `minor`: se agrega restricción, aclaración o capa derivada compatible
- `patch`: wording, ejemplos, precisión editorial

### 6.3 Motor Cognitivo

- `major`: cambia teoría de verdad, hipótesis, trazabilidad o policy de incertidumbre
- `minor`: mejora heurística, preguntas, priorización o memoria sin romper invariantes
- `patch`: aclaraciones, ejemplos, limpieza documental

### 6.4 Corpus

- `major`: cambian schema, taxonomy fundacional o reglas validatorias incompatibles
- `minor`: nuevas suites, tags, escenarios o gates compatibles
- `patch`: fixes editoriales, metadata, organización menor

### 6.5 Canons

- `major`: cambia conjunto fundacional o semántica de casos lockeados
- `minor`: se agregan mappings, metadata o notas sin alterar columna vertebral
- `patch`: correcciones editoriales

### 6.6 RFC

- RFC ratificado no cambia de versión como documento vivo común.
  Cambia de estado y puede recibir:

  - `patch`: aclaración editorial explícita
  - `superseded-by`: RFC posterior lo reemplaza

Regla:
un RFC no se reescribe para fingir que siempre dijo lo nuevo.

### 6.7 Especificación completa

La especificación total de Doleth también debe tener versión agregada:

- `major`: cambia contrato intelectual global de Doleth
- `minor`: se expande conocimiento sin ruptura de columna vertebral
- `patch`: limpieza o precisión no semántica

Versión agregada debe derivarse del máximo cambio ratificado entre documentos fundacionales, normativos, corpus y canon.

---

## 7. Gestión de conflictos

### 7.1 Dos RFC se contradicen

Proceso:

1. marcar conflicto explícito
2. congelar adopción parcial
3. identificar autoridad y fecha
4. abrir RFC de resolución o supersession
5. declarar cuál queda vigente

Nunca deben quedar dos RFC activos legislando mismo punto con conclusiones incompatibles.

### 7.2 Un caso rompe el Canon

Proceso:

1. determinar si rompe implementación o teoría
2. clasificar failure mode
3. decidir si caso estaba mal, teoría estaba incompleta o producto está incorrecto
4. abrir RFC si impacto toca definición normativa o fundacional

Regla:
canon no se edita para “hacer pasar” cambio.

### 7.3 Aparece evidencia nueva

Proceso:

1. registrar evidencia
2. evaluar si contradice teoría o solo ejemplo previo
3. medir impacto sobre corpus y canon
4. decidir:
   ignorar, extender, migrar o romper

### 7.4 Una hipótesis queda invalidada

Si hipótesis estaba en nivel cognitivo o validatorio:

- se documenta invalidez
- se corrigen expectativas
- se versiona artefacto afectado
- se conserva rastro histórico

### 7.5 Una decisión histórica fue incorrecta

Proceso correcto:

1. no borrar rastro
2. declarar decisión incorrecta
3. explicar por qué
4. documentar impacto
5. superseder con nueva decisión

Gobernanza fuerte no finge infalibilidad.
La vuelve auditable.

---

## 8. Criterios de aceptación

Un cambio intelectual solo puede aceptarse si cumple todos estos criterios:

1. **necesidad explícita**
   resuelve tensión real, no preferencia estética

2. **trazabilidad**
   deja registro de motivo, autor, fecha y artefactos afectados

3. **coherencia vertical**
   no contradice documentos de autoridad superior

4. **coherencia horizontal**
   no rompe artefactos de mismo nivel sin resolver conflicto

5. **impacto explicado**
   declara qué cambia en teoría, validación y canon

6. **compatibilidad evaluada**
   clasifica cambio como compatible, migrable o incompatible

7. **validación suficiente**
   se prueba contra corpus y canon relevantes

8. **lenguaje preciso**
   evita ambigüedad semántica nueva

9. **rationale durable**
   alguien en tres años puede entender por qué se aceptó

10. **propagación completa**
    no deja conocimiento partido entre documentos

---

## 9. Principios permanentes

Estos principios nunca deben romperse:

1. Doleth es especificación antes que documentación.
2. Ningún documento cambia autoridad silenciosamente.
3. Ninguna mejora local puede romper coherencia global.
4. Conocimiento sin trazabilidad no cuenta como conocimiento válido.
5. La jerarquía documental existe para resolver conflicto, no para decorar estructura.
6. La evidencia nueva merece revisión; no merece obediencia automática.
7. Una contradicción explícita vale más que una falsa armonía.
8. Todo cambio debe declarar qué preserva además de qué modifica.
9. Corpus valida teoría; no reemplaza teoría.
10. Canon congela escenarios; no legisla ontología.
11. Un RFC supersede decisiones; no borra historia.
12. Lo provisional debe seguir marcado como provisional aunque sea útil.
13. Un nombre estable protege pensamiento estable.
14. Si un concepto cambia de significado, cambió la especificación.
15. Ningún documento inferior reinterpreta a uno superior por conveniencia.
16. Toda excepción persistente debe volverse regla, límite o deuda explícita.
17. Toda ruptura conceptual debe ser visible antes de implementación.
18. Gobernanza protege capacidad futura de pensar, no solo orden presente.

---

## 10. Freeze conceptual

### 10.1 Qué significa

Un **Conceptual Freeze** declara que cierto conjunto de conocimiento queda congelado como contrato intelectual vigente.

No significa que Doleth deja de aprender.
Significa que deja de improvisar sobre ese nivel.

### 10.2 Cuándo puede declararse

Puede declararse cuando se cumplen todas:

1. existe documento de autoridad explícita
2. no hay contradicciones abiertas críticas
3. corpus y canon relevantes ya reflejan ese conocimiento
4. existe política de cambio posterior

### 10.3 Qué puede congelarse

Puede congelarse:

- identidad de marca
- misión
- arquitectura conceptual
- ontología
- máquina de estados
- teoría cognitiva
- canon vigente
- taxonomy fundacional

### 10.4 Qué no implica congelar

Freeze no impide:

- agregar evidencia
- expandir corpus
- sumar casos no fundacionales
- mejorar implementación
- aclarar wording sin cambio semántico

### 10.5 Qué sigue evolucionando bajo freeze

Bajo freeze pueden seguir evolucionando:

- corpus fuera del canon
- heurísticas compatibles
- ejemplos
- documentación operativa
- specs de implementación

### 10.6 Cuándo puede levantarse

Se levanta solo por:

- RFC explícito
- evidencia estructural suficiente
- análisis de compatibilidad
- plan de migración y versionado

Freeze sin procedimiento de salida es dogma.
Gobernanza seria no funciona como dogma.

---

## 11. Roadmap de la especificación

Orden recomendado, de mayor impacto estructural a menor:

### 11.1 Formalizar versión agregada de la especificación

Falta definir manifest maestro de versión total de Doleth.
Eso debe existir pronto.

### 11.2 Materializar Canon 1.0 en escenarios reales

Canon hoy está definido como lista.
Debe convertirse en casos vivos `regression_locked`.

### 11.3 Cerrar taxonomy de compatibilidad

Necesitamos vocabulary oficial para:

- tipos de ruptura
- tipos de migración
- estados de freeze
- estados de RFC

### 11.4 Crear índice maestro de autoridad documental

Debe existir mapa único de:

- documento
- tipo
- autoridad
- versión
- estado
- supersessions

### 11.5 Diseñar proceso de ratificación

Hoy existe idea de RFC.
Falta fijar ritual exacto de:

- draft
- review
- ratified
- superseded
- withdrawn

### 11.6 Definir política de changelog intelectual

Cada cambio de conocimiento debe quedar en historial consultable por humanos.

### 11.7 Especificar migrations conceptuales

Cuando teoría cambia, debe existir formato estándar de migration note.

### 11.8 Diseñar auditoría periódica de coherencia

Cada ciclo mayor, Doleth debe revisar:

- contradicciones
- drift
- vacíos de canon
- vacíos de corpus
- deuda epistemológica abierta

### 11.9 Recién después bajar a especificaciones de implementación

Antes de eso, Doleth todavía estaría implementando sobre base inestable.

---

## 12. Resultado normativo

Desde adopción de este RFC:

- Doleth pasa a operar como especificación viva
- ningún cambio intelectual relevante puede ser silencioso
- toda contradicción debe resolverse por jerarquía o RFC
- corpus y canon quedan subordinados a teoría, pero obligan a validarla
- implementación queda subordinada a especificación

Este documento se convierte en autoridad máxima sobre evolución del conocimiento de Doleth.

No define qué es Doleth.
Define cómo Doleth puede seguir siendo Doleth cuando cambie.
