# Doleth

## Taxonomía de Estados del Valor

Documento para definir cómo Doleth representa estado actual de cualquier valor económico y qué transiciones válidas puede sufrir.

Objetivo:
permitir que Doleth entienda no solo cuánto valor existe, sino:

- en qué condición operativa está
- qué tan disponible está
- qué tan cierto es
- a qué esfera pertenece
- qué riesgo y qué restricciones lo afectan

Premisa:
si ontología define **qué existe** y **qué cambia**,
taxonomía de estados define **cómo está ese valor ahora** y **qué puede pasarle después**.

---

## 1. Qué significa “estado del valor”

### 1.1 Definición

Estado del valor es:

**situación operativa actual de una relación económica respecto de su capacidad de uso, exigibilidad o realización.**

Definición más práctica:
estado dice qué puede hacerse con ese valor ahora, qué no puede hacerse y qué tendría que pasar para que cambie.

Estado no describe todo.
Estado no reemplaza:

- vehículo
- unidad
- esfera
- condición
- valuación

Estado describe solo situación funcional presente de valor.

### 1.2 Qué sí es estado

Es estado aquello que altera directamente capacidad de decisión sobre valor.

Ejemplos:

- disponible
- reservado
- exigible
- realizado por tercero
- inmovilizado

### 1.3 Qué no es estado

No es estado lo que solo describe otro eje del sistema.

#### Ubicación del valor

No es estado.
Es vehículo.

Ejemplo:
USD 1.000 en banco, wallet o caja pueden compartir estado `disponible`, aunque cambie ubicación.

#### Forma del valor

No es estado.
Es forma o unidad del valor.

Ejemplo:
ARS, USD, BTC, acción, inmueble.

#### Titularidad del valor

No es estado.
Es tipo de relación económica.

Ejemplo:
control, derecho, obligación.

#### Certeza del valor

No es estado principal.
Es condición.

Ejemplo:
firme, probable, contingente, deteriorado.

#### Propósito del valor

No es estado.
Es capa semántica o intencional.

Ejemplo:
operación, consumo, ahorro, protección, inversión.

#### Exposición al riesgo

No es estado.
Es propiedad emergente de unidad, vehículo, horizonte, contraparte y mercado.

#### Liquidez

No es estado puro.
Es vista derivada de:

- estado
- unidad
- vehículo
- fricción de salida
- tiempo

#### Compromiso

No es estado atómico.
Es consecuencia de:

- obligación futura
- o reserva asignada
- o decisión previa de uso

### 1.4 Diferencia entre ejes

Para evitar caos conceptual, Doleth debe separar estos ejes:

#### Eje 1. Relación

Qué vínculo tiene agente con valor.

- control
- derecho
- obligación

#### Eje 2. Estado

Qué tan utilizable o exigible es esa relación ahora.

#### Eje 3. Condición

Qué tan firme o incierta es.

#### Eje 4. Esfera

A qué mundo económico pertenece.

#### Eje 5. Valuación

Cuánto vale hoy según criterio dado.

#### Eje 6. Riesgo

Qué fragilidad introduce.

### 1.5 Criterio fuerte

Si un concepto puede cambiar sin alterar qué podés hacer hoy con ese valor, no pertenece a estado.

Ejemplo:

- cambiar nombre de cuenta no cambia estado
- pasar de banco A a banco B puede cambiar fricción, pero no necesariamente estado
- subir precio de BTC cambia valuación, no estado operativo básico

---

## 2. Estados fundamentales del valor

Necesitamos menor cantidad posible de estados que siga representando vida financiera real.

### 2.1 Lista intuitiva mala

Lista intuitiva suele mezclar:

- disponible
- invertido
- prestado
- por cobrar
- adeudado
- reservado
- comprometido
- contingente
- deteriorado

Problema:
mezcla relación, estado, condición y propósito.

### 2.2 Pregunta correcta

Para diseñar estados mínimos hay que preguntar:

**¿qué puede hacer agente focal con este valor ahora?**

De esa pregunta salen cuatro familias funcionales.

### 2.3 Propuesta mínima elegante

Estados fundamentales recomendados:

#### 1. Libre

Valor bajo control del agente y utilizable sin restricción operativa relevante.

Ejemplos:

- efectivo en mano
- saldo bancario disponible
- stablecoin líquida lista para usar

#### 2. Asignado

Valor bajo control del agente, pero ya restringido por decisión previa, regla interna o estructura financiera.

Incluye dos submodos interpretativos:

- reservado
- comprometido

No conviene separarlos en núcleo si no cambia mecánica básica:
en ambos casos valor no está libre.

Diferencia:

- reservado = restricción voluntaria o protectora
- comprometido = restricción por obligación o uso futuro ya consumido

Pero ambos viven en misma familia operativa.

#### 3. Expuesto

Valor perteneciente al agente, pero no disponible de forma inmediata porque está transformado, inmovilizado o sujeto a salida con fricción, plazo o riesgo.

Incluye:

- invertido
- inmovilizado
- prestado
- activo real
- participación societaria

No conviene separar `invertido`, `prestado`, `bloqueado` como estados base porque comparten característica funcional:
agente conserva relación positiva, pero acceso inmediato está restringido y depende de evento adicional.

#### 4. Pendiente

Valor aún no realizado plenamente en caja o en salida, pero con relación económica ya existente.

Tiene dos direcciones:

- pendiente a favor
- pendiente en contra

En lenguaje humano:

- por cobrar
- por pagar

No conviene crear estados distintos en núcleo.
Dirección la da tipo de relación:

- derecho pendiente
- obligación pendiente

#### 5. Extinguido

Relación ya no existe como valor económicamente utilizable o exigible.

Es estado terminal lógico de esa relación particular.

Ejemplos:

- dinero consumido
- deuda cancelada
- derecho cobrado por completo
- activo vendido totalmente

### 2.4 Qué salió del núcleo

#### Invertido

Sale.
Es subtipo de `expuesto`.

#### Prestado

Sale.
Es derecho pendiente o exposición ilíquida según caso.

#### Bloqueado

Sale.
Puede ser `asignado` o `expuesto` según causa.

#### Deteriorado

Sale.
Es condición, no estado.

#### Proyectado

Sale.
Es relación futura modelada, no estado presente de valor realizado.

#### Contingente

Sale.
Es condición.

### 2.5 Test de minimalidad

Con solo cinco estados:

- `libre`
- `asignado`
- `expuesto`
- `pendiente`
- `extinguido`

ya se puede representar casi todo si se combinan con:

- relación
- esfera
- condición
- tiempo

Esto parece mínimo robusto.

---

## 3. Transiciones válidas

Transición válida ocurre cuando evento económico cambia estado funcional de relación sin romper integridad conceptual.

### 3.1 Libre → Asignado

#### Evento que la produce

- creación de reserva
- asignación a objetivo
- reconocimiento de compromiso futuro cubierto

#### Información mínima

- monto o proporción
- agente
- esfera
- motivo de asignación
- horizonte temporal opcional

#### Qué cambia

- margen libre de decisión baja

#### Qué se conserva

- control del valor
- unidad
- vehículo, salvo traslado adicional

#### Riesgo que introduce o elimina

- reduce riesgo de usar dinero que no deberías tocar
- puede reducir flexibilidad de corto plazo

#### Error conceptual a evitar

No tratar reserva como gasto ni como salida real.

### 3.2 Asignado → Libre

#### Evento que la produce

- liberación de reserva
- cancelación de necesidad futura
- reclasificación de compromiso cubierto

#### Información mínima

- monto liberado
- razón

#### Qué cambia

- aumenta liquidez libre

#### Qué se conserva

- control del valor

#### Riesgo que introduce o elimina

- mejora flexibilidad
- puede aumentar riesgo de desorden si liberación fue prematura

#### Error conceptual a evitar

No contar liberación como ingreso.

### 3.3 Libre → Expuesto

#### Evento que la produce

- transformación en inversión
- préstamo otorgado
- compra de activo real
- inmovilización operativa

#### Información mínima

- monto o cantidad
- unidad origen y destino
- vehículo destino
- contraparte si aplica

#### Qué cambia

- cae disponibilidad inmediata
- cambia horizonte, riesgo o forma

#### Qué se conserva

- relación positiva del agente, total o parcial

#### Riesgo que introduce o elimina

- introduce iliquidez, volatilidad o riesgo de contraparte
- puede reducir riesgo inflacionario o devaluatorio

#### Error conceptual a evitar

No confundir transformación de valor con gasto consumido.

### 3.4 Expuesto → Libre

#### Evento que la produce

- venta de activo
- rescate de inversión
- devolución de préstamo
- desbloqueo de fondos

#### Información mínima

- cantidad realizada
- valuación o tasa si hubo conversión
- vehículo de llegada

#### Qué cambia

- aumenta disponibilidad
- cambia riesgo

#### Qué se conserva

- continuidad económica del valor recuperado, si no hubo pérdida total

#### Riesgo que introduce o elimina

- elimina iliquidez
- puede introducir riesgo de reinversión o pérdida de cobertura

#### Error conceptual a evitar

No tratar retorno de principal como ingreso puro.

### 3.5 Libre → Extinguido

#### Evento que la produce

- consumo no recuperable
- pago sin contrapartida patrimonial persistente
- pérdida definitiva

#### Información mínima

- monto
- contraparte opcional
- momento

#### Qué cambia

- baja control económico
- puede caer patrimonio

#### Qué se conserva

- nada de esa relación específica

#### Riesgo que introduce o elimina

- reduce colchón
- puede eliminar riesgo si extingue obligación asociada en evento compuesto

#### Error conceptual a evitar

No meter acá pagos de deuda, compras de activos o transferencias internas.

### 3.6 Pendiente a favor → Libre

#### Evento que la produce

- cobro efectivo
- acreditación
- devolución recibida

#### Información mínima

- monto cobrado
- vehículo de recepción
- contraparte

#### Qué cambia

- derecho se realiza en control líquido

#### Qué se conserva

- valor económico, salvo diferencias de cobro

#### Riesgo que introduce o elimina

- elimina incertidumbre de cobro

#### Error conceptual a evitar

No contar dos veces derecho y cobro simultáneo.

### 3.7 Libre → Pendiente a favor

#### Evento que la produce

- préstamo otorgado
- venta a cobrar
- anticipo a recuperar

#### Información mínima

- monto
- contraparte
- plazo o expectativa de cobro

#### Qué cambia

- baja caja
- nace derecho

#### Qué se conserva

- posición patrimonial potencial, si cobro es firme

#### Riesgo que introduce o elimina

- introduce riesgo de contraparte e iliquidez

#### Error conceptual a evitar

No tratar préstamo como gasto perdido.

### 3.8 Pendiente en contra → Extinguido

#### Evento que la produce

- cancelación de obligación
- pago total
- condonación

#### Información mínima

- monto extinguido
- contraparte

#### Qué cambia

- obligación desaparece
- cae presión futura

#### Qué se conserva

- historial del vínculo

#### Riesgo que introduce o elimina

- elimina riesgo de exigibilidad

#### Error conceptual a evitar

No asumir que pago y extinción son siempre mismo evento simple. A veces hay quita, refinanciación o parcialidad.

### 3.9 Libre → Pendiente en contra

#### Evento que la produce

- compra con tarjeta
- factura recibida
- préstamo tomado pero aún no pagado
- obligación fiscal reconocida

#### Información mínima

- monto
- contraparte
- vencimiento o regla de vencimiento

#### Qué cambia

- no baja caja inmediata necesariamente
- sí baja capacidad futura libre

#### Qué se conserva

- liquidez presente nominal, si no hubo salida inmediata

#### Riesgo que introduce o elimina

- introduce presión futura

#### Error conceptual a evitar

No tratar ausencia de salida inmediata como ausencia de costo.

### 3.10 Pendiente → Deteriorado en condición

#### Evento que la produce

- impago
- mora
- aumento de duda de cobro

#### Información mínima

- relación afectada
- nueva probabilidad o señal de deterioro

#### Qué cambia

- condición, no estado base

#### Qué se conserva

- estructura de derecho u obligación pendiente

#### Riesgo que introduce o elimina

- aumenta incertidumbre

#### Error conceptual a evitar

No inventar nuevo estado cuando cambió certeza, no situación operativa.

### 3.11 Expuesto → Revaluado

No es transición de estado.
Es cambio de valuación.

#### Evento que la produce

- revaluación de mercado

#### Error conceptual a evitar

No usar revaluación como si fuera transición operativa.

### 3.12 Probable → Firme

No es transición de estado.
Es transición de condición.

#### Evento que la produce

- confirmación
- acreditación
- documentación

#### Error conceptual a evitar

No mezclar estado con grado de certeza.

---

## 4. Máquina de estados del dinero

No es máquina de software.
Es mapa mental.

### 4.1 Estados permitidos

Para relaciones positivas:

- libre
- asignado
- expuesto
- pendiente a favor
- extinguido

Para relaciones negativas:

- pendiente en contra
- extinguido

Obligación ya nacida y exigible vive como pendiente en contra.
No hace falta crear estado `adeudado` separado.

### 4.2 Estados terminales

#### Extinguido

Terminal para relación puntual.
No significa fin del valor en universo.
Solo fin de esa relación específica.

Ejemplo:

- ARS libres se extinguen al pagar almuerzo
- obligación se extingue al cancelarla
- derecho se extingue al cobrarse o darse de baja

### 4.3 Estados reversibles

- libre ↔ asignado
- libre ↔ expuesto
- libre ↔ pendiente a favor

Con matices:
reversión puede devolver mismo valor económico o uno distinto en unidad, tiempo o valuación.

### 4.4 Estados temporales

#### Pendiente

Por diseño debería tender a resolverse hacia:

- libre
- extinguido
- o deterioro de condición

#### Asignado

Temporal por naturaleza.
Se sostiene mientras exista decisión o necesidad.

### 4.5 Estados proyectados

No deben confundirse con estado actual.

Ejemplos:

- cuota futura
- suscripción del mes próximo
- ingreso esperado

No son `libres`, `asignados` ni `pendientes` todavía salvo que ya exista relación reconocida.

Regla:
proyección vive en capa temporal de compromisos o expectativas, no en estado base de valor realizado, salvo reconocimiento explícito.

### 4.6 Estados inciertos

Incertidumbre no crea estado nuevo.
Se expresa con condición.

Ejemplos válidos:

- pendiente a favor + probable
- libre + contingente
- expuesto + deteriorado

### 4.7 Estados que no deberían mezclarse

#### Libre y extinguido

Imposible para misma relación y mismo monto al mismo tiempo.

#### Libre y pendiente a favor

Imposible si es mismo monto de mismo derecho.
Si cobraste, derecho se reduce o extingue.

#### Asignado y libre

Mismo monto no puede ser completamente ambos.
Sí puede fraccionarse.

#### Expuesto y libre

Tampoco para misma fracción exacta al mismo tiempo.

#### Pendiente a favor y pendiente en contra

Solo si son relaciones distintas.
Nunca como misma relación.

### 4.8 Regla de fragmentación

Si un mismo bloque de valor parece necesitar estados incompatibles, debe fragmentarse en subrelaciones.

Ejemplo:

- parte libre
- parte asignada
- parte expuesta

No forzar híbridos confusos.

---

## 5. Relación entre estado, esfera y condición

### 5.1 Fórmula conceptual

Cualquier relación económica relevante en Doleth debe poder leerse como:

**[relación] + [estado] + [esfera] + [condición]**

Ejemplo:

- control + libre + personal + firme
- derecho + pendiente + negocio + probable
- control + expuesto + inversión + firme
- derecho + pendiente + personal + deteriorado
- obligación + pendiente + personal + contingente

### 5.2 Qué hace cada capa

#### Estado

Dice qué tan operable es valor.

#### Esfera

Dice a qué mundo económico pertenece.

#### Condición

Dice qué tan confiable es esa relación.

### 5.3 Reglas claras

#### Regla 1

Estado no determina esfera.
Mismo estado puede existir en cualquier esfera.

#### Regla 2

Condición no determina estado.
Algo puede estar libre pero contingente.
Algo puede estar pendiente pero firme.

#### Regla 3

Cambiar esfera no es cambiar estado.
Es transferencia entre contextos.

#### Regla 4

Cambiar condición no implica flujo ni mutación operativa, salvo que evento adicional la materialice.

#### Regla 5

Toda lectura consolidada debe poder abrirse por esfera.

### 5.4 Ejemplos válidos

- libre + personal + firme
- asignado + negocio + firme
- pendiente a favor + negocio + probable
- expuesto + inversión + firme
- pendiente a favor + personal + deteriorado
- asignado + personal + contingente

### 5.5 Ejemplos inválidos o engañosos

- invertido + firme como si `invertido` fuera estado nuclear
- comprometido + contingente si no está claro si es obligación o reserva
- disponible + por cobrar para misma fracción

---

## 6. Casos reales complejos

### 6.1 Pagar tarjeta

No es gasto simple.

Representación:

- control + libre + personal + firme
- obligación + pendiente en contra + personal + firme

Evento compuesto:

- transferencia saliente desde valor libre
- extinción total o parcial de obligación pendiente

### 6.2 Comprar USDT

Representación:

- control + libre + personal o inversión + firme en ARS/USD

Evento:

- transformación de valor libre en valor expuesto o libre según convertibilidad práctica de USDT en ese contexto

Decisión conceptual:
si USDT se usa como caja dolarizada líquida, puede quedar `libre`.
si se trata como activo de resguardo fuera de uso corriente, puede quedar `expuesto`.

### 6.3 Vender BTC con ganancia

Antes:

- control + expuesto + inversión + firme

Eventos:

- transformación de BTC en moneda líquida
- posible transferencia a vehículo destino

Ganancia:

- no nace por venta sola
- parte ya existía como revaluación previa

Error a evitar:
no contar toda entrada como ingreso operativo.

### 6.4 Prestar plata a un amigo

Antes:

- control + libre + personal + firme

Después:

- derecho + pendiente a favor + personal + probable o contingente

Evento:

- libre → pendiente a favor

### 6.5 Cobrar parte de deuda informal

Antes:

- derecho + pendiente a favor + personal + probable o deteriorado

Después:

- parte cobrada pasa a control + libre + personal + firme
- derecho remanente sigue pendiente

### 6.6 Reservar plata para alquiler

Antes:

- control + libre + personal + firme

Después:

- control + asignado + personal + firme

No es gasto.
No es obligación pagada.

### 6.7 Comprar mercadería para negocio

Si mercadería es inventario:

- control + libre + negocio + firme

Evento:

- transformación de caja libre en recurso expuesto o asignado operativo según horizonte

Si no querés entrar en inventario detallado en etapa inicial:
tratala como transformación a recurso operativo no líquido.

### 6.8 Recibir transferencia que no sé de qué es

Después de acreditación:

- control + libre + esfera desconocida o temporal + condición probable respecto de clasificación semántica

Importante:
certeza económica de existencia puede ser firme.
incertidumbre semántica de origen no debe volver incierto saldo si dinero ya está.

### 6.9 Tener una cuota futura

Si obligación ya nació:

- obligación + pendiente en contra + personal + firme

Además:

- calendario de exigibilidad futura

No hace falta estado especial `cuota`.

### 6.10 Tener una suscripción mensual

Si próximo cobro es altamente esperable pero aún no devengado:

- proyección recurrente, no obligación realizada todavía

Si ya facturó:

- obligación + pendiente en contra

### 6.11 Comprar una notebook para trabajar

No es gasto puro si querés preservar verdad patrimonial.

Evento:

- transformación de caja libre en activo operativo expuesto

Esfera:

- negocio o personal-productiva según contexto

### 6.12 Recibir intereses

Evento:

- creación de valor derivado
- transferencia a libre si se acredita

Estado final típico:

- control + libre + inversión o personal + firme

### 6.13 Tener dinero en efectivo no registrado

Si aparece:

- creación relativa de control + libre + esfera correspondiente + condición según grado de verificación

No debe tratarse como ingreso operativo automáticamente.

### 6.14 Tener activo cuyo valor cambia

Activo sigue:

- control + expuesto + esfera correspondiente + condición firme

Lo que cambia:

- valuación por evento de revaluación

### 6.15 Tener deuda en dólares

Representación:

- obligación + pendiente en contra + personal o negocio + firme
- unidad USD

Riesgo:

- descalce cambiario

### 6.16 Perder valor por devaluación

Si tenés ARS:

- estado puede seguir libre

Lo que cambia:

- valuación relativa o poder adquisitivo

No inventar estado `devaluado`.

### 6.17 Separar ahorro para un objetivo

Evento:

- libre → asignado

Propósito:

- objetivo, no estado

### 6.18 Usar plata del negocio para gasto personal

No es solo gasto.
Es cruce de esfera.

Evento compuesto:

- transferencia desde negocio hacia personal
- luego extinción o transformación en esfera personal según uso

Error a evitar:
no hacer desaparecer cruce entre esferas.

---

## 7. Reglas de integridad conceptual

### 7.1 No confundir liquidez con patrimonio

Valor expuesto puede aumentar patrimonio y empeorar liquidez.

### 7.2 No confundir inversión con gasto

Transformar caja en activo no extingue valor patrimonial automáticamente.

### 7.3 No confundir transferencia interna con ingreso

Mover entre vehículos o esferas propias requiere trazabilidad, no doble conteo.

### 7.4 No contar dos veces mismo valor

Si derecho pendiente se cobra, debe reducirse o extinguirse.

### 7.5 No tratar valor asignado como libre

Dinero reservado o comprometido no debe inflar capacidad de decisión.

### 7.6 No mezclar esferas sin registrar transferencia

Todo cruce personal-negocio-inversión-compartido debe existir como evento explícito.

### 7.7 No convertir incertidumbre en certeza sin evento

Probable no pasa a firme por deseo del usuario.

### 7.8 No considerar revaluación como flujo operativo

Suba de BTC no equivale a ingreso cobrado.

### 7.9 No usar salida de caja como prueba suficiente de gasto

Puede ser pago de deuda, compra de activo, préstamo o simple transferencia.

### 7.10 No usar entrada de caja como prueba suficiente de ingreso

Puede ser préstamo, devolución, venta de activo o transferencia interna.

### 7.11 No tratar proyección como posición realizada

Suscripción futura esperada no es misma cosa que obligación ya devengada.

### 7.12 No mezclar estado con condición

Deteriorado, probable o contingente no reemplazan libre, pendiente o expuesto.

### 7.13 No mezclar estado con propósito

Ahorro, inversión, consumo u operación son capas semánticas distintas.

### 7.14 No forzar valor indivisible a estado único si necesita partición

Si una cuenta tiene parte libre y parte asignada, se fragmenta conceptualmente.

---

## 8. Crítica del modelo

### 8.1 Riesgo de redundancia entre asignado y pendiente en contra

Problema:
si dinero está reservado para pagar deuda, parece tanto `asignado` como respuesta a obligación `pendiente`.

Resolución:
son relaciones distintas:

- obligación pendiente en contra
- caja asignada para cubrirla

No fusionarlas.

### 8.2 Riesgo de que expuesto sea demasiado amplio

Problema:
mete BTC, inmueble, mercadería, préstamo dado y acciones en misma familia.

Respuesta:
correcto a nivel de estado base.
Diferencias finas deben vivir en:

- unidad
- vehículo
- condición
- riesgo
- propósito

Si se separa demasiado pronto, modelo se infla.

### 8.3 Riesgo de simplificación excesiva en libre

No toda caja libre tiene misma facilidad de uso.

Mejora:
liquidez operativa debe derivarse también de fricción de vehículo.
`libre` no significa “idénticamente usable”.
Significa “sin restricción estructural mayor”.

### 8.4 Riesgo de sobreingeniería con proyecciones

Si se modela toda expectativa como relación real, producto alucina.

Resolución:
proyección vive fuera de estado base salvo reconocimiento explícito.

### 8.5 Caso difícil: cheque diferido o plazo fijo pre cancelable

No es completamente libre, ni totalmente expuesto, ni solo pendiente.

Resolución:
usar estado base según operatividad dominante:

- si control existe pero salida tiene fricción/plazo: `expuesto`
- si aún depende de cobro de tercero: `pendiente a favor`

### 8.6 Caso difícil: dinero no registrado encontrado meses después

¿Es ingreso, ajuste o creación?

Resolución:
ontológicamente es creación relativa de control.
semánticamente puede etiquetarse como ajuste.

### 8.7 Caso difícil: pago parcial con tarjeta y parte en cash

Resolución:
acción humana única puede descomponerse en múltiples transiciones.
No forzar un solo evento donde hay varios.

### 8.8 Riesgo de tratar todo como relación fragmentada

Demasiada fragmentación puede volver sistema incomprensible.

Resolución:
núcleo puede fragmentar.
producto visible debe agregar cuando no haya conflicto conceptual.

### 8.9 Límite principal

Taxonomía describe estado funcional de valor.
No describe por sí sola bienestar subjetivo, preferencia personal ni prioridad estratégica.

Eso está bien.
Esas capas vienen después.

---

## 9. Resultado final recomendado

### 9.1 Estados finales recomendados

Estados base:

- libre
- asignado
- expuesto
- pendiente
- extinguido

Dirección de `pendiente` la define relación:

- derecho pendiente a favor
- obligación pendiente en contra

### 9.2 Transiciones principales

- libre → asignado
- asignado → libre
- libre → expuesto
- expuesto → libre
- libre → pendiente a favor
- pendiente a favor → libre
- libre → pendiente en contra
- pendiente en contra → extinguido
- libre → extinguido
- expuesto → extinguido
- pendiente a favor → extinguido

Cambios de condición:

- probable ↔ firme
- firme → deteriorado
- contingente → probable

Cambios de valuación:

- revaluación positiva
- revaluación negativa

### 9.3 Reglas de integridad

- no confundir liquidez con patrimonio
- no confundir inversión con gasto
- no confundir transferencia interna con ingreso
- no contar dos veces mismo valor
- no tratar valor asignado como libre
- no mezclar esferas sin transferencia explícita
- no convertir incertidumbre en certeza sin evento
- no considerar revaluación como flujo operativo
- no usar entrada o salida de caja como interpretación automática
- no tratar proyección como posición realizada

### 9.4 Decisiones conceptuales tomadas

- `estado` describe operatividad, no ubicación ni propósito
- `condición` absorbe certeza e incertidumbre
- `esfera` absorbe contexto económico
- `liquidez` y `compromiso` son vistas derivadas, no estados base
- `invertido`, `prestado`, `bloqueado`, `deteriorado` salen del núcleo
- `pendiente` unifica por cobrar y por pagar

### 9.5 Consecuencias para futuro producto

Esta taxonomía deja base sólida para:

- interpretar lenguaje natural sin confundir gasto con transformación
- evitar doble conteo patrimonial
- separar posición de flujo
- construir alertas reales de liquidez y compromiso
- modelar casos complejos de cripto, tarjetas, deuda, negocio y activos reales
- crear sistema de inferencia que primero identifique relación, estado, esfera y condición antes de clasificar semántica superficial

Conclusión:
si Doleth respeta esta máquina conceptual, podrá entender valor como sistema vivo y no como fila contable.
