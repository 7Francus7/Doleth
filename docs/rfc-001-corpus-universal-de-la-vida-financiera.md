# RFC-001 — Corpus Universal de la Vida Financiera

Estado: propuesto
Fecha: 2 de julio de 2026
Owner inicial: Doleth

---

## 1. Propósito

Este RFC define diseño fundacional del **Corpus Universal de la Vida Financiera**.

Corpus no nace como biblioteca de ejemplos.
Nace como infraestructura conceptual.

Su función es convertirse en activo permanente para:

- validar ontología financiera
- validar máquina de estados del valor
- validar motor cognitivo
- validar sistema de inferencia
- validar motor de decisiones
- detectar drift conceptual antes de que llegue al producto

---

## 2. Tesis central

Doleth no puede evolucionar solo con intuición de producto ni con tests técnicos aislados.

Necesita un cuerpo acumulativo de escenarios canónicos que capture cómo se comporta vida financiera real bajo:

- complejidad
- ambigüedad
- multi fuente
- multi esfera
- multi tiempo
- multi moneda
- incertidumbre

Ese cuerpo debe sobrevivir a:

- cambios de UI
- cambios de arquitectura
- cambios de modelos de IA
- cambios de parsing
- cambios de inferencia
- cambios de equipo

Por eso corpus debe tratarse como **fuente de verdad validatoria**, no como anexo documental.

---

## 3. Filosofía del corpus

### 3.1 Qué es

Corpus es colección versionada de escenarios financieros canónicos, cada uno con:

- descripción humana
- evidencia de entrada
- representación normalizada
- expectativas por capa
- criterios de aceptación
- invariantes que no pueden romperse

### 3.2 Qué no es

Corpus no es:

- base de prompts sueltos
- set de demos
- set de fixtures arbitrarios
- benchmark de NLP aislado
- colección de tickets históricos sin estructura

### 3.3 Principio rector

Cada escenario del corpus debe responder una pregunta dura:

**si Doleth cambia hoy, ¿seguimos entendiendo esta realidad financiera de forma correcta, consistente y útil?**

### 3.4 Unidad mínima

Unidad mínima no es “transacción”.
Unidad mínima es **escenario validable**.

Un escenario puede ser:

- un hecho atómico
- una secuencia corta
- una situación compuesta
- una ambigüedad deliberada
- un caso que el modelo todavía no soporta

### 3.5 Capas de validación

Todo escenario debe poder validar una o más capas:

1. ontología
2. estados del valor
3. cognición e inferencia
4. decisiones

No todos los casos cubren todo.
Pero todo caso debe declarar qué capas pretende validar.

---

## 4. Principios de diseño

### 4.1 Primero invariantes, después volumen

Mil casos malos solo esconden errores.
Pocos casos duros y bien especificados construyen verdad.

### 4.2 Una realidad, múltiples vistas

Mismo hecho debe poder verse desde:

- lenguaje natural
- notificación
- extracto
- comprobante
- entrada incompleta

Si cada fuente produce modelo distinto sin razón válida, corpus debe detectarlo.

### 4.3 Escenarios por fenómeno, no por feature

Organización no debe copiar menú de producto.
Debe seguir fenómenos económicos y cognitivos.

### 4.4 Verdad provisional también se testea

No solo se valida conclusión final.
También se valida:

- cuándo sistema puede asumir
- cuándo debe preguntar
- cómo expresa incertidumbre

### 4.5 Fallar bien también cuenta

Escenario exitoso no siempre es “resolver”.
A veces éxito es:

- pedir aclaración correcta
- preservar ambigüedad
- declarar límite del modelo
- rechazar interpretación inválida

### 4.6 Reutilización máxima

Misma estructura debe servir para:

- revisión humana
- lint de calidad
- tests automatizados
- regresión conceptual
- comparación de versiones

---

## 5. Modelo de versionado

Corpus tendrá tres niveles de versionado:

### 5.1 `schema_version`

Versión del formato de escenario.
Sube cuando cambia estructura de archivos o contrato de datos.

### 5.2 `corpus_version`

Versión global del corpus.
Usa semver:

- `major`: cambia semántica, invariantes o criterios globales
- `minor`: se agregan dominios, tags o capacidades sin romper contrato
- `patch`: ajustes editoriales, fixes menores, metadata

### 5.3 `case_version`

Versión individual del escenario.
Sube cuando cambia expectativa, cobertura o evidencia canónica.

### 5.4 Política

Un cambio de producto nunca puede editar silenciosamente escenarios canónicos.

Siempre debe dejar:

- diff de expectativa
- motivo del cambio
- impacto sobre capas afectadas
- decisión explícita: mejora, corrección o ruptura

---

## 6. Ciclo de vida de escenarios

Estados permitidos:

- `draft`
- `reviewed`
- `canonical`
- `regression_locked`
- `deprecated`
- `replaced`

### Reglas

- `draft`: explora fenómeno nuevo
- `reviewed`: pasó revisión conceptual
- `canonical`: define verdad esperada actual
- `regression_locked`: no puede cambiar sin RFC o decisión explícita
- `deprecated`: queda por trazabilidad, pero no gobierna
- `replaced`: otro caso lo absorbió o refinó

---

## 7. Cómo se agregan nuevos escenarios

Todo escenario nuevo entra por una de estas puertas:

1. fenómeno real descubierto en entrevistas, soporte o uso interno
2. bug conceptual detectado en producto
3. hueco de cobertura en ontología, estados, inferencia o decisiones
4. nuevo instrumento, régimen o contexto geográfico
5. cambio de tesis del producto

### Pipeline de incorporación

1. propuesta corta con hueco detectado
2. clasificación inicial
3. chequeo de duplicados
4. redacción del escenario en formato estándar
5. revisión conceptual
6. asignación de invariantes y capas
7. promoción a `canonical` o `draft`

### Criterio de entrada

Un escenario entra si obliga a validar al menos una de estas cosas:

- nuevo fenómeno
- nueva combinación relevante de fenómenos
- nuevo límite del modelo
- nueva ambigüedad de evidencia
- nueva consecuencia de decisión

Si solo reescribe lo ya cubierto, no entra.

---

## 8. Cómo se clasifican

Clasificación obligatoria por ejes, no solo por carpeta.

Todo escenario debe declarar:

- dominio principal
- dominios secundarios
- capa objetivo
- verbo económico
- transición de estado
- patrón temporal
- patrón de firmeza
- patrón de esferas
- topología de agentes
- familia instrumental
- forma de evidencia
- nivel de ambigüedad
- presión de decisión
- complejidad estructural
- región o régimen relevante

Esto permite:

- buscar por fenómeno
- filtrar por capa
- medir cobertura
- detectar redundancia
- correr suites parciales

---

## 9. Cómo identificar casos repetidos

Duplicado no significa “texto parecido”.
Duplicado significa **misma estructura conceptual y misma expectativa validatoria**.

Cada escenario tendrá dos llaves:

### 9.1 `equivalence_key`

Firma normalizada construida con:

- verbo o secuencia de verbos
- transición de estado esperada
- patrón temporal
- patrón de firmeza
- patrón de esferas
- topología de agentes
- familia instrumental
- forma de evidencia
- pregunta de decisión dominante

Si dos escenarios comparten misma `equivalence_key`, son candidatos a duplicado.

### 9.2 `narrative_fingerprint`

Hash o firma estable de narrativa y evidencia.
Sirve para detectar near-duplicates editoriales.

### Reglas

- misma `equivalence_key` + misma expectativa: consolidar
- misma `equivalence_key` + expectativa distinta: conflicto conceptual
- narrativa distinta + expectativa idéntica: posible variante útil
- narrativa idéntica + tags distintos: error de clasificación

---

## 10. Cómo detectar que un escenario rompe el modelo conceptual

Un escenario rompe modelo cuando ocurre cualquiera de estas condiciones:

1. no puede expresarse con entidades y verbos actuales sin forzar semántica falsa
2. exige estado incompatible con máquina de estados
3. obliga a mezclar liquidez, patrimonio, flujo o riesgo como si fueran mismo eje
4. requiere esconder incertidumbre para “hacerlo entrar”
5. produce interpretación distinta según fuente sin justificación ontológica
6. lleva a recomendación que contradice verdad financiera calculada
7. entra en conflicto con un escenario equivalente ya canónico

### Tipos de ruptura

- `ontology_gap`
- `state_gap`
- `time_gap`
- `firmness_gap`
- `sphere_gap`
- `inference_gap`
- `decision_gap`
- `consistency_gap`
- `coverage_gap`

### Salidas válidas

Cuando un caso rompe modelo, corpus no debe ocultarlo.

Solo hay cuatro salidas legítimas:

1. cambiar modelo
2. cambiar criterio de aceptación
3. declarar límite explícito
4. partir escenario en sub escenarios más correctos

---

## 11. Cómo convertir corpus en herramienta de validación permanente

Corpus debe correr como sistema de gates.

### 11.1 Gates mínimos

1. validación de schema
2. validación de taxonomy
3. detección de duplicados
4. chequeo de invariantes
5. chequeo de compatibilidad ontológica
6. chequeo de transiciones de estado
7. chequeo de verdad provisional vs consolidada
8. chequeo de consistencia de decisiones

### 11.2 Modos de uso

- `authoring`: crear o editar escenarios
- `review`: revisar calidad conceptual
- `regression`: comparar outputs entre versiones
- `release-gate`: bloquear merge si rompe casos lockeados
- `coverage-audit`: medir huecos del corpus

### 11.3 Política de merge

Todo cambio que toque:

- ontología
- estados
- inferencia
- decisiones

debe declarar:

- suites afectadas
- escenarios lockeados afectados
- si cambio es corrección o ruptura
- por qué nuevo comportamiento es mejor

---

## 12. Organización del corpus

Corpus se organiza por dominios conceptuales, no por features.

### 12.1 Dominios propuestos

1. `00-axiomas-y-limites`
2. `10-verbos-economicos`
3. `20-maquina-de-estados`
4. `30-tiempo-y-firmeza`
5. `40-esferas-y-contrapartes`
6. `50-evidencia-e-inferencia`
7. `60-presion-de-decision`
8. `70-instrumentos-y-regimenes`
9. `80-vidas-compuestas`
10. `90-casos-que-rompen`

### Por qué esta organización

Ordena corpus según aquello que Doleth debe comprender:

- qué existe
- qué cambia
- en qué estado queda
- cuándo vale
- qué tan firme es
- en qué esfera vive
- con qué evidencia se interpreta
- qué decisión permite o impide

No replica categorías UI.
Replica estructura cognitiva del producto.

### 12.2 Canon por encima de suites

Suites organizan cobertura.
Canon organiza columna vertebral.

Por eso corpus debe tener dos cortes simultáneos:

- `suites/`: universo expansible por dominio conceptual
- `canons/`: subconjuntos congelados que toda versión futura debe comprender

Primer canon recomendado:

**Canon 1.0**

Canon 1.0 no debe contener “casos importantes”.
Debe contener **casos fundacionales**.

Definición:
escenarios que fijan cómo piensa Doleth sobre realidad financiera durante próximos años.

Composición congelada recomendada:

- Grupo A: 10 casos atómicos
- Grupo B: 10 casos cotidianos
- Grupo C: 10 casos compuestos
- Grupo D: 10 casos ambiguos
- Grupo E: 10 casos que rompen el modelo

Razón:

- atómicos fijan primitives
- cotidianos fijan lectura del mundo real frecuente
- compuestos fijan secuencias y trayectorias
- ambiguos fijan disciplina cognitiva
- destructivos fijan frontera viva del modelo

Canon debe nombrar casos con slugs legibles, no con números mudos.

Ejemplos correctos:

- `salary-basic`
- `cash-expense`
- `unknown-inflow`
- `shared-wallet`
- `business-paid-personal`

Razón:
cuando equipo diga “rompimos `unknown-inflow`”, todos deben saber qué fenómeno conceptual se dañó.

---

## 13. Formato estándar de escenario

Formato fuente oficial:
`scenario.yaml` dentro de carpeta propia por caso.

Estructura mínima:

- metadata
- narrativa humana
- entradas de evidencia
- normalización conceptual
- expectativas por capa
- criterios de aceptación
- invariantes
- señales de ruptura

### Carpeta por escenario

Ruta esperada:

`corpus/suites/<dominio>/<familia>/<case-id>/`

Contenido esperado:

- `scenario.yaml`
- `notes.md` opcional
- `evidence/` opcional

### Por qué carpeta y no archivo suelto

Porque escenario puede crecer con:

- múltiples fuentes
- comprobantes
- timeline
- notas de revisión
- fixtures futuras

Sin deformar formato raíz.

---

## 14. Estrategia de crecimiento a largo plazo

### 14.1 Crecer por huecos, no por ansiedad de volumen

Cada trimestre corpus debe responder:

- qué fenómenos nuevos aparecieron
- qué capas están sub validadas
- qué regiones o instrumentos faltan
- qué clases de ambigüedad faltan

### 14.2 Mantener núcleo chico y periferia expansible

No todo caso merece ser `regression_locked`.
Solo los que definen columna vertebral del modelo.

### 14.3 Separar caso canónico de variante local

Caso canónico define fenómeno.
Variante local define régimen, moneda, institución o forma de evidencia.

### 14.4 Medir cobertura por ejes

Cobertura no debe medirse solo por cantidad de escenarios.
Debe medirse por:

- verbos cubiertos
- transiciones cubiertas
- patrones temporales cubiertos
- patrones de firmeza cubiertos
- conflictos de evidencia cubiertos
- decisiones de alta presión cubiertas
- contextos multi esfera cubiertos

### 14.5 Congelar lenguaje

Tags, invariantes y failure modes deben cambiar poco.
Si cambian mucho, corpus pierde comparabilidad histórica.

### 14.6 Crecer con cánones sucesivos

Corpus completo puede crecer durante años.
Canon no debe inflarse sin criterio.

Regla:

- `Canon 1.0`: 50 escenarios fundacionales
- `Canon 1.x`: mismos 50 con refinamientos estrictamente justificados
- `Canon 2.0`: cambia columna vertebral porque cambió comprensión del producto

Canon no reemplaza corpus.
Canon selecciona lo que se vuelve gate permanente.

---

## 15. Decisiones concretas de este RFC

Quedan aprobadas para implementación inicial:

1. corpus como directorio raíz independiente: `corpus/`
2. taxonomy y governance como artefactos de primer nivel
3. suites por dominio conceptual
4. `canons/` como capa de selección fundacional por encima de suites
5. `scenario.yaml` como formato fuente oficial
6. versionado triple: schema, corpus, case
7. estados de ciclo de vida para cada escenario
8. `equivalence_key` como base de deduplicación
9. `regression_locked` como estado para casos que gobiernan releases
10. naming legible por slug, nunca `case001`

---

## 16. Entregables iniciales de esta fase

Esta fase no crea miles de casos.
Crea sistema para que esos casos puedan existir sin pudrirse.

Entregables:

- RFC-001
- scaffold `corpus/`
- taxonomy base
- governance base
- schema inicial
- template de escenario
- dominios iniciales documentados

---

## 17. Próxima fase recomendada

Después de este RFC, siguiente paso correcto es:

**diseñar y congelar Canon 1.0 de Doleth**.

Canon 1.0 recomendado:

- 10 casos atómicos
- 10 casos cotidianos
- 10 casos compuestos
- 10 casos ambiguos
- 10 casos que rompen el modelo

No como volumen arbitrario.
Como **suite de regresión conceptual fundacional**.

Regla:

- cada caso del canon debe tener nombre legible
- cada caso del canon debe mapear a una o más suites
- todo cambio en ontología, estados, inferencia o decisiones debe correr contra canon completo

Eso marca inicio de ingeniería conceptual del producto.

---

## 18. Cierre

Si Doleth quiere construir verdad financiera confiable durante años, necesita memoria conceptual operativa.

Ese activo no es solo código.
No es solo documentación.

Es corpus.

Corpus debe ser tratado como infraestructura de pensamiento.
