# Doleth

## Ontología Financiera Personal

Documento para definir lenguaje interno de Doleth.

Objetivo:
describir vida financiera de persona con menor cantidad posible de conceptos, sin perder capacidad para representar complejidad real durante próximos veinte años.

Premisa central:
Doleth no modela movimientos.
Doleth modela **mutaciones de posición económica**.

---

## 0. Tesis ontológica

Toda vida financiera personal puede describirse como:

- un conjunto de **agentes**
- con **derechos** y **obligaciones**
- sobre **valor**
- expresado en alguna **unidad**
- localizado en algún **vehículo**
- distribuido en **tiempo**
- alterado por **eventos**

Todo lo demás debe derivar de eso o salir de núcleo.

Consecuencia fuerte:

- `activo` no es átomo
- `pasivo` no es átomo
- `liquidez` no es átomo
- `patrimonio` no es átomo
- `compromiso` no es átomo
- `riesgo` no es átomo

Todos son resultados derivados de estructura más profunda.

---

## 1. Entidades conceptuales irreducibles

### 1.1 Criterio de irreducibilidad

Una entidad es irreducible si:

- no puede expresarse completamente como combinación de otras del modelo
- aparece en casi cualquier vida financiera imaginable
- sigue siendo válida en bancos, cripto, acciones, inmuebles, negocios y deuda

### 1.2 Núcleo mínimo propuesto

#### 1. Agente

Unidad económica capaz de controlar valor, deber valor o recibir valor.

Ejemplos:

- persona
- pareja
- negocio
- banco
- cliente
- amigo
- exchange
- Estado

Sin agente no hay relación económica.

#### 2. Valor

Aquello que tiene significado económico para un agente.

No es solo dinero.
También puede ser:

- efectivo
- acción
- bono
- inmueble
- participación en negocio
- stablecoin
- crédito a cobrar

Valor es más primitivo que `activo`.
Activo es valor controlado positivamente por agente focal.

#### 3. Unidad

Forma en que valor se denomina o cuantifica.

Ejemplos:

- ARS
- USD
- BTC
- acción de empresa X
- metro cuadrado de inmueble Y
- participación porcentual en negocio Z

Unidad importa porque valor no existe en abstracto.
Siempre aparece en alguna forma cuantificable.

#### 4. Tiempo

Dimensión que ordena disponibilidad, exigibilidad y duración.

Sin tiempo no existe diferencia entre:

- saldo y liquidez
- deuda y vencimiento
- ingreso prometido e ingreso cobrado
- activo líquido y activo inmovilizado

Tiempo no es atributo secundario.
Es parte constitutiva de verdad financiera.

#### 5. Vehículo

Soporte o forma institucional donde valor existe, circula o se registra.

Ejemplos:

- cuenta bancaria
- caja de ahorro
- wallet
- broker
- inmueble registral
- tarjeta
- contrato de préstamo
- sociedad

Vehículo no define propiedad ni valor por sí solo.
Define dónde y bajo qué forma operativa se manifiesta.

#### 6. Relación económica

Vínculo elemental entre agente y valor.

Puede ser:

- control
- derecho
- obligación

Esta entidad reemplaza dualidad rígida `activo/pasivo`.

Ejemplo:

- si agente controla USD 1.000 en banco, existe relación positiva
- si agente debe USD 1.000 a banco, existe relación negativa
- si agente tiene derecho a cobrar USD 1.000 a cliente, existe relación positiva condicionada

Relación económica es átomo real.
Activo y pasivo son nombres agregados para signo de relación.

#### 7. Evento económico

Mutación localizada en tiempo que crea, transfiere, transforma, extingue o revaloriza relaciones económicas.

Sin evento no hay cambio.

### 1.3 Entidades que sobran del núcleo

#### Activo

No debe ser irreducible.
Es relación económica positiva sobre valor.

#### Pasivo

No debe ser irreducible.
Es relación económica negativa sobre valor.

#### Patrimonio

No debe ser irreducible.
Es saldo neto entre relaciones positivas y negativas.

#### Liquidez

No debe ser irreducible.
Es propiedad emergente de relaciones según tiempo, convertibilidad y fricción.

#### Riesgo

No debe ser irreducible.
Es propiedad emergente de incertidumbre sobre valor, tiempo, contraparte y convertibilidad.

#### Compromiso

No debe ser irreducible.
Es obligación futura o decisión de uso ya reservada.

### 1.4 Entidades derivadas inevitables

Estas no entran a núcleo, pero producto las necesita siempre.

#### Posición financiera

Conjunto total de relaciones económicas de agente en tiempo dado.

#### Patrimonio neto

Valor positivo menos valor negativo.

#### Liquidez real

Porción de posición utilizable en horizonte dado con fricción aceptable.

#### Compromisos futuros

Parte de posición futura ya asignada o exigible.

#### Riesgo

Fragilidad potencial de posición ante tiempo, mercado, contraparte o estructura.

#### Trayectoria

Cómo cambia posición a través de tiempo.

### 1.5 Ontología final mínima

Núcleo irreducible de Doleth:

- agente
- valor
- unidad
- tiempo
- vehículo
- relación económica
- evento económico

Todo lo demás debe poder construirse desde ahí.

---

## 2. Qué es exactamente un evento económico

### 2.1 Definición precisa

Un evento económico es:

**mutación identificable en tiempo que altera una o más relaciones económicas entre agentes, valor y vehículos.**

Definición más operativa:

evento económico ocurre cuando verdad financiera de al menos un agente cambia de manera material o reconocible.

### 2.2 Cuándo comienza

Empieza cuando cambio adquiere realidad económica suficiente para modificar posición.

Eso obliga a distinguir tres tiempos:

- `tiempo de ocurrencia`
- `tiempo de reconocimiento`
- `tiempo de liquidación`

Ejemplo:

- comprás con tarjeta hoy
- banco liquida después
- vos reconocés obligación hoy

En Doleth, evento comienza cuando **posición cambia**, no cuando efectivo se mueve necesariamente.

### 2.3 Cuándo termina

Termina cuando su mutación primaria ya quedó incorporada en estado del sistema.

Consecuencias futuras no son continuación infinita de mismo evento.
Son estado derivado o eventos posteriores.

Ejemplo:

- tomar préstamo termina cuando se crean recurso recibido y obligación asociada
- cuotas futuras no son prolongación del evento original
- son compromisos o eventos de cancelación posteriores

### 2.4 Propiedades mínimas

Todo evento económico debe tener como mínimo:

- agente focal
- tiempo efectivo
- una o más relaciones económicas antes y después
- dirección de mutación
- unidad de valor afectada

Propiedades muy frecuentes, aunque no siempre mínimas:

- contraparte
- vehículo origen
- vehículo destino
- condición de certeza
- horizonte temporal
- precio o tasa de conversión
- motivo económico

### 2.5 Qué puede modificar

Un evento económico puede modificar:

- control sobre valor
- obligación sobre valor
- derecho de cobro
- vehículo donde valor reside
- unidad en que valor está expresado
- plazo de disponibilidad
- plazo de exigibilidad
- convertibilidad
- exposición a riesgo
- composición de posición

### 2.6 Qué nunca modifica directamente

No modifica directamente:

- objetivos del usuario
- preferencias del usuario
- interpretación moral de gasto
- valor histórico ya ocurrido

Puede cambiar estimación presente de valor.
No reescribe pasado.

### 2.7 Regla fuerte

Si algo no altera relaciones económicas, no debe entrar como evento económico nuclear.

Ejemplo:

- cambiar nombre de cuenta no es evento económico
- mover categoría visual no es evento económico
- editar nota descriptiva no es evento económico

---

## 3. Tipos fundamentales de eventos

Objetivo:
reducir toda vida financiera a menor cantidad posible de verbos primarios.

### 3.1 Criterio de diseño

Clasificación buena debe ser:

- mínima
- exhaustiva
- estable en veinte años
- aplicable a dinero, deuda, activos reales y financieros

### 3.2 Clasificación candidata amplia

Posibles verbos intuitivos:

- ingreso
- gasto
- transferencia
- conversión
- inversión
- deuda
- cobro
- pago
- ajuste

Problema:
mezcla nivel económico con nivel coloquial.

`inversión` no es átomo.
`pago` no es átomo.
`cobro` no es átomo.
`gasto` tampoco siempre.

### 3.3 Clasificación mínima elegante

Toda vida financiera puede reducirse a cinco tipos fundamentales:

#### 1. Creación

Aparece nueva relación económica que antes no existía.

#### 2. Transferencia

Relación económica cambia de agente y/o vehículo sin cambiar unidad esencial.

#### 3. Transformación

Valor cambia de forma, unidad, plazo, riesgo o función manteniéndose dentro de misma esfera económica principal.

#### 4. Extinción

Relación económica deja de existir.

#### 5. Revaluación

Cambia estimación económica de relación existente sin que otra parte entregue o reciba valor en ese instante.

### 3.4 Por qué cinco y no menos

Intento de bajar a cuatro suele romper algo:

- si unificás creación y transferencia, perdés diferencia entre valor que entra desde otro agente y valor que nace como nueva obligación o rendimiento
- si unificás transformación y transferencia, confundís mover valor con cambiar naturaleza económica
- si eliminás revaluación, no podés representar suba de acción, caída de BTC o apreciación de inmueble sin falsificar evento

Cinco parece mínimo robusto.

### 3.5 Qué desaparece con esta clasificación

- ingreso = creación o transferencia entrante
- gasto de consumo = transferencia saliente más extinción de capacidad de gasto libre
- inversión = transformación
- compra de dólares = transformación
- pago de deuda = transferencia saliente + extinción de obligación
- préstamo = creación simultánea de recurso y obligación
- cuota = transferencia + extinción parcial de obligación

---

## 4. Qué representa cada tipo fundamental

### 4.1 Creación

#### Qué representa

Nacimiento de relación económica nueva.

#### Qué cambia

- aumenta o inaugura derecho, control u obligación

#### Qué conserva

- identidad previa de relaciones no afectadas

#### Qué genera

- nuevo recurso
- nueva obligación
- nuevo derecho

#### Qué extingue

- nada por definición primaria

#### Cómo afecta posición financiera

Puede mejorarla, empeorarla o volverla más compleja según signo de creación.

Ejemplos:

- ingreso devengado o cobrado
- cashback acreditado
- interés ganado
- obligación por compra con tarjeta
- préstamo recibido

### 4.2 Transferencia

#### Qué representa

Desplazamiento de valor entre agentes o entre vehículos, manteniendo identidad económica básica.

#### Qué cambia

- ubicación
- tenencia
- contraparte expuesta

#### Qué conserva

- unidad o naturaleza básica del valor

#### Qué genera

- nueva distribución de control o nueva localización

#### Qué extingue

- control previo del origen sobre monto transferido

#### Cómo afecta posición financiera

Puede no cambiar patrimonio.
Sí puede cambiar liquidez, fricción, riesgo o esfera.

Ejemplos:

- mover dinero entre cuentas propias
- pagar alquiler
- cobrar factura
- enviar dinero a otra persona

### 4.3 Transformación

#### Qué representa

Cambio en forma económica del valor sin salir necesariamente del dominio patrimonial del agente.

#### Qué cambia

- unidad
- función
- plazo
- liquidez
- riesgo
- rendimiento esperado

#### Qué conserva

- continuidad económica del valor transformado

#### Qué genera

- nuevo recurso con propiedades distintas
- nueva exposición

#### Qué extingue

- forma previa de recurso transformado

#### Cómo afecta posición financiera

Puede no cambiar patrimonio instantáneo.
Sí cambia calidad de posición.

Ejemplos:

- comprar USD con ARS
- comprar BTC con USD
- comprar acciones con cash
- convertir plazo fijo vencido en caja

### 4.4 Extinción

#### Qué representa

Desaparición de relación económica existente.

#### Qué cambia

- reduce recurso, derecho u obligación

#### Qué conserva

- resto de posición no afectada

#### Qué genera

- cierre de exposición
- liberación potencial de presión futura

#### Qué extingue

- relación objetivo

#### Cómo afecta posición financiera

Puede empeorarla si se extingue recurso.
Puede mejorarla si se extingue obligación.

Ejemplos:

- cancelación de deuda
- consumo que no deja activo persistente
- baja de suscripción futura
- incobrable dado de baja

### 4.5 Revaluación

#### Qué representa

Cambio en estimación económica de relación existente sin intercambio operativo inmediato.

#### Qué cambia

- valor de mercado
- valor recuperable
- percepción de riesgo
- liquidez estimada

#### Qué conserva

- titularidad básica
- relación jurídica principal

#### Qué genera

- ganancia o pérdida no realizada
- nueva lectura de patrimonio y riesgo

#### Qué extingue

- estimación previa

#### Cómo afecta posición financiera

No cambia caja inmediata.
Sí cambia patrimonio, riesgo y margen futuro de decisión.

Ejemplos:

- sube BTC
- cae acción
- propiedad aumenta valor estimado
- crédito a cobrar se vuelve menos probable

---

## 5. Gramática financiera de Doleth

Necesitamos lenguaje que permita describir cualquier acción imaginable usando solo ontología creada.

### 5.1 Estructura general

Cualquier hecho financiero puede expresarse como:

**[Evento] afecta [relación económica] de [agente] sobre [valor/unidad] en [vehículo] con [tiempo/condición].**

Versión más potente:

**Evento = mutación de una o más relaciones económicas.**

### 5.2 Plantillas básicas

#### Creación

`Crear relación [tipo] para [agente] sobre [valor/unidad] en [vehículo] con [plazo/certeza]`

#### Transferencia

`Transferir [valor/unidad] desde [agente/vehículo origen] hacia [agente/vehículo destino]`

#### Transformación

`Transformar [valor/unidad origen] en [valor/unidad destino] dentro de [agente/esfera]`

#### Extinción

`Extinguir relación [tipo] de [agente] sobre [valor/unidad]`

#### Revaluación

`Revaluar relación [tipo] de [agente] sobre [valor/unidad] según nueva estimación`

### 5.3 Cómo se describen acciones reales

#### Comprar BTC

No es `gasto`.
Es:

- transferencia saliente de USD o ARS desde vehículo líquido
- transformación de valor monetario en recurso BTC

Descripción breve:
`Transformar ARS/USD líquidos en BTC, cambiando unidad, liquidez y riesgo`

#### Vender BTC

Es:

- transformación de BTC en USD/ARS
- posible transferencia a vehículo líquido específico

Descripción:
`Transformar BTC en moneda líquida y relocalizar nuevo valor en vehículo destino`

#### Comprar dólares

Es:

`Transformar ARS en USD manteniendo control del valor pero alterando unidad, cobertura y liquidez`

#### Cobrar sueldo

Puede ser:

- creación de derecho si se devenga antes de cobrarse
- transferencia cuando se acredita

Caso simple:
`Transferencia entrante desde empleador hacia vehículo del agente`

Caso más completo:
`Creación de derecho salarial` seguida por `transferencia de liquidación`

#### Pagar alquiler

Es:

- transferencia saliente hacia propietario
- extinción de obligación o compromiso mensual asociado

Descripción:
`Transferir dinero líquido al locador y extinguir compromiso de vivienda del período`

#### Recibir dividendos

Es:

- creación de nuevo valor derivado de activo poseído
- transferencia entrante si se acredita en cuenta

Descripción:
`Crear rendimiento asociado a participación y transferirlo a vehículo líquido`

#### Pagar una cuota

Es:

- transferencia saliente de dinero
- extinción parcial de obligación

Descripción:
`Transferir liquidez al acreedor y extinguir parte de obligación financiada`

#### Tomar un préstamo

No es solo ingreso.
Es dos creaciones simultáneas:

- creación de recurso líquido recibido
- creación de obligación futura equivalente más costo

Descripción:
`Crear liquidez presente y crear obligación futura asociada`

#### Cobrar un préstamo dado

Si habías prestado antes, ahora ocurre:

- transferencia entrante desde contraparte
- extinción total o parcial de derecho de cobro

Descripción:
`Transferir dinero desde deudor y extinguir derecho pendiente`

#### Mover dinero entre cuentas propias

Es:

`Transferencia interna entre vehículos del mismo agente`

No cambia patrimonio.
Puede cambiar liquidez práctica o fricción.

#### Recibir cashback

Es:

`Creación de valor derivado de programa comercial` o `transferencia entrante promocional`

Según origen conceptual elegido, pero ambas viven en misma ontología.

#### Comprar acciones

Es:

`Transformar dinero líquido en participación financiera de otra unidad, cambiando liquidez, riesgo y horizonte`

#### Recibir intereses

Es:

`Creación de rendimiento sobre recurso existente` seguida por eventual `transferencia a vehículo líquido`

### 5.4 Casos más difíciles

#### Comprar con tarjeta en cuotas

No es un solo gasto simple.

Ontología correcta:

- creación de obligación financiada
- creación de compromisos futuros seriados
- posible extinción de capacidad de gasto libre presente

Si producto modela consumo persistente:

- transferencia de valor al comercio
- creación de obligación con emisor

#### Pagar tarjeta

Es:

- transferencia saliente desde vehículo líquido
- extinción total o parcial de obligación con emisor

#### Comprar propiedad

Es:

- transformación de recursos líquidos en activo real
- posible creación de obligación hipotecaria si hay financiamiento
- reubicación fuerte de liquidez hacia iliquidez

#### Recibir acciones de negocio propio

Es:

- creación o revaluación de relación económica sobre vehículo societario

#### Devaluación de moneda local

Para agente con ARS:

- revaluación negativa relativa de relaciones denominadas en ARS frente a otras unidades o frente a poder adquisitivo base

### 5.5 Regla de expresividad

Si una acción no puede describirse con combinación de:

- creación
- transferencia
- transformación
- extinción
- revaluación

modelo está incompleto.

Hasta acá, no aparece contraejemplo fuerte.

---

## 6. Redundancias detectadas y unificación

### 6.1 Activo y recurso

`activo` y `recurso` casi siempre nombran mismo fenómeno.

Decisión:
en núcleo usar `relación económica positiva`.
En lenguaje de producto podrá usarse `recurso` por claridad humana.

### 6.2 Pasivo, deuda y obligación

`pasivo` y `obligación` son muy cercanos.
`deuda` es subtipo de obligación.

Decisión:
usar `obligación` como concepto general.

### 6.3 Compromiso y obligación futura

Muchos compromisos son obligaciones futuras.
Otros son reservas voluntarias o decisiones ya asumidas.

Decisión:
`compromiso` no entra a núcleo.
Se deriva como:

- obligación futura exigible
- o reserva intencional ya asignada

### 6.4 Inversión y transformación

`inversión` no es átomo ontológico.
Es interpretación estratégica de transformación.

Decisión:
sale de núcleo.

### 6.5 Ingreso y transferencia entrante

Muchos ingresos son transferencias entrantes.
Otros nacen como creación de derecho.

Decisión:
`ingreso` queda como etiqueta de interfaz, no como átomo.

### 6.6 Gasto y transferencia/extinción

`gasto` mezcla consumo, pago de obligación, compra de activo, compra de moneda y transferencia a tercero.

Decisión:
sale de núcleo por ambigüedad.

### 6.7 Patrimonio y posición

`patrimonio` es subtotal.
`posición` es vista más amplia.

Decisión:
usar `posición` como concepto superior.

---

## 7. ¿Sigue funcionando en diez años?

Probemos ontología contra dominio expandido:

- cuentas bancarias
- wallets crypto
- acciones
- bonos
- propiedades
- vehículos
- negocios
- tarjetas
- créditos
- ingresos internacionales

### 7.1 Bancos y wallets

Funciona bien.
Son vehículos que alojan relaciones de control.

### 7.2 Acciones y bonos

Funciona bien.
Son formas de valor en unidades específicas con alta sensibilidad a revaluación.

### 7.3 Propiedades y vehículos físicos

Funciona si aceptamos que valor no es solo dinero líquido.
Ambos son recursos reales con baja liquidez y alta dependencia de revaluación.

### 7.4 Negocios

Funciona, pero exige matiz.

Participación en negocio puede modelarse como relación económica positiva sobre vehículo societario.
Sin embargo, negocio también puede ser agente separado.

Mejora necesaria:
distinción explícita entre:

- agente
- esfera

Agente es entidad económica.
Esfera es vista de consolidación relevante para usuario.

Ejemplo:

- negocio es agente
- esfera operativa agrupa relaciones del negocio
- esfera personal agrupa relaciones del individuo

### 7.5 Tarjetas y créditos

Funciona muy bien.
Tarjeta es vehículo que crea obligaciones de corto plazo y compromisos seriados.
Crédito es creación simultánea de recurso y obligación.

### 7.6 Ingresos internacionales

Funciona.
Solo exige robustez de unidad, tipo de cambio y tiempos de liquidación.

### 7.7 Qué problema aparece

Ontología mínima alcanza, pero necesita dos extensiones disciplinadas:

#### Extensión A. Esfera

No es irreducible universal, pero sí casi obligatoria para producto.

Sirve para separar:

- personal
- negocio
- compartido
- inversión

#### Extensión B. Condición

Relación económica necesita expresar grado de firmeza:

- realizada
- pendiente
- contingente
- disputada
- incierta

Sin esto, préstamos informales, facturas pendientes, impuestos estimados y juicios quedan mal representados.

### 7.8 Ontología revisada para horizonte de veinte años

Núcleo estrictamente irreducible sigue siendo:

- agente
- valor
- unidad
- tiempo
- vehículo
- relación económica
- evento económico

Capa estructural permanente recomendada para producto:

- esfera
- condición

No son más primitivas que núcleo.
Pero sí imprescindibles para sistema real.

---

## 8. Crítica del modelo

Modelo fuerte no alcanza con sonar elegante.
Hay que intentar romperlo.

### 8.1 Posible objeción: valor es demasiado abstracto

Crítica:
si `valor` puede ser casi cualquier cosa, modelo pierde precisión.

Respuesta:
por eso existe `unidad`, `vehículo` y `relación económica`.
Valor solo no basta.
Pero sigue siendo irreducible.

Mejora:
Doleth debe restringir valor a aquello con impacto económico material y trazable.

### 8.2 Posible objeción: transferencia y transformación a veces se mezclan

Ejemplo:
comprar BTC puede verse como transferencia a exchange y transformación a BTC.

Respuesta:
correcto.
Muchos hechos reales son compuestos.

Mejora:
aceptar que acción humana visible puede descomponerse en varios eventos ontológicos.
No forzar uno a uno entre acción y evento.

### 8.3 Posible objeción: creación y transferencia entrante parecen mismo fenómeno

Ejemplo:
cobrar sueldo parece valor nuevo para usuario, pero viene de otro agente.

Respuesta:
desde sistema global no es creación.
Desde agente focal puede percibirse como aparición.

Mejora:
distinguir:

- creación absoluta
- creación relativa para agente focal

Pero para producto personal quizá no haga falta exponer diferencia siempre.

### 8.4 Posible objeción: revaluación puede inflar ruido

Si todo cambio de mercado genera evento, sistema puede volverse inestable.

Mejora:
revaluación debe tener umbrales y frecuencias según tipo de valor.
Caja no requiere mark-to-market obsesivo.
BTC sí.
Inmueble no diariamente.

### 8.5 Posible objeción: consumo desaparece demasiado

Si pagar cena se reduce a transferencia saliente y extinción de liquidez libre, se pierde semántica de comportamiento.

Respuesta:
cierto.
Ontología mínima no debe cargar toda semántica de producto.

Mejora:
mantener capa semántica secundaria para interpretación de propósito:

- consumo
- operación
- inversión
- protección
- financiamiento

Esa capa no es ontología nuclear.
Es taxonomía interpretativa encima de ella.

### 8.6 Posible objeción: activos reales indivisibles

Propiedad, auto o participación privada no tienen precio continuo.

Respuesta:
modelo los tolera, pero estimación será menos precisa.

Mejora:
distinguir siempre:

- valor observado
- valor estimado
- valor realizable

### 8.7 Posible objeción: compartición y copropiedad

Finanzas personales reales incluyen:

- cuentas compartidas
- bienes gananciales
- socios
- tarjetas adicionales

Mejora:
relación económica debe soportar control parcial y derechos fraccionados.

### 8.8 Posible objeción: obligaciones informales y difusas

Ejemplo:
“le debo a mi hermano cuando pueda”.

Mejora:
condición y tiempo deben aceptar grados de definición, no solo fechas exactas.

### 8.9 Posible objeción: modelo aún es demasiado financiero y poco humano

Verdad.
Ontología no captura por sí sola:

- ansiedad
- preferencia de liquidez
- tolerancia al riesgo
- metas vitales

Pero eso está bien.
No debe hacerlo.

Esas capas pertenecen a:

- perfil decisional
- objetivos
- recomendaciones

No al núcleo de representación.

### 8.10 Límite principal

Modelo representa muy bien estado y mutación económica.
Representa peor utilidad subjetiva.

Eso es aceptable porque misión de Doleth no es filosofar sobre bienestar.
Es generar verdad financiera accionable.

---

## 9. Mejoras propuestas

### 9.1 Separar ontología de semántica

Ontología nuclear:

- qué existe
- qué cambia

Semántica interpretativa:

- para qué ocurrió
- cómo debe leerse

Esto evita contaminar núcleo con categorías frágiles.

### 9.2 Introducir doble capa temporal

Toda relación y evento debe soportar:

- tiempo efectivo
- tiempo de caja

Razón:
tarjetas, inversiones, cobros y deudas rompen modelos de tiempo simple.

### 9.3 Introducir condición de firmeza

Toda relación relevante debe poder marcarse como:

- firme
- probable
- contingente
- deteriorada

Razón:
sin esto, posición parece más segura de lo que es.

### 9.4 Introducir granularidad variable

No todo debe modelarse con mismo nivel de detalle.

Ejemplo:

- caja diaria sí
- inmueble mensual o trimestral
- negocio privado con estimación periódica

### 9.5 Mantener cinco verbos

Después de crítica, clasificación sigue sólida.

Verbos permanentes:

- crear
- transferir
- transformar
- extinguir
- revaluar

Si futuro exige sexto verbo, deberá demostrar que no es composición de estos cinco.

---

## 10. Síntesis final

Ontología más sólida encontrada hasta ahora para Doleth es esta:

### Núcleo irreducible

- agente
- valor
- unidad
- tiempo
- vehículo
- relación económica
- evento económico

### Capa estructural permanente

- esfera
- condición

### Eventos fundamentales

- creación
- transferencia
- transformación
- extinción
- revaluación

### Derivados mayores

- posición
- patrimonio
- liquidez
- compromisos
- riesgo
- trayectoria

Conclusión fuerte:

Doleth no debe construirse como catálogo de transacciones ni como planilla de categorías.
Debe construirse como sistema que representa relaciones económicas y sus mutaciones.

Si este modelo se mantiene, podrá absorber:

- bancos
- cripto
- inversiones
- activos reales
- deuda
- negocios
- múltiples monedas
- ingresos inciertos

Sin perder coherencia.
