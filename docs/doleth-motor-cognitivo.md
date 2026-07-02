# Doleth

## Motor Cognitivo

Documento para definir cerebro conceptual de Doleth.

Objetivo:
transformar información financiera imperfecta, fragmentada y heterogénea en verdad financiera confiable y accionable.

Doleth no debe depender de fuente única.
Debe poder comprender misma realidad financiera desde:

- lenguaje natural
- voz
- comprobantes
- extractos bancarios
- APIs bancarias
- wallets crypto
- correos
- PDFs
- notificaciones
- futuros conectores

Todas esas entradas deben converger en mismo modelo cognitivo.

---

## 0. Tesis central

Motor Cognitivo de Doleth no procesa “mensajes”.
Procesa **evidencia sobre realidad financiera**.

Su trabajo no es registrar lo dicho.
Su trabajo es responder:

- qué pasó
- qué tan cierto es
- qué cambió en posición financiera
- qué queda incierto
- qué decisión se vuelve posible o riesgosa ahora

Por eso Doleth debe pensar en capas:

- evidencia
- interpretación
- hipótesis
- validación
- verdad provisional o consolidada
- actualización del modelo financiero

---

## 1. Qué significa comprender un hecho financiero

### 1.1 Leer

Leer es captar señal.

Ejemplos:

- texto “pagué tarjeta”
- PDF con monto y fecha
- notificación bancaria
- línea de extracto

Leer no entiende.
Solo detecta contenido bruto.

### 1.2 Interpretar

Interpretar es asignar significado preliminar a señal.

Ejemplos:

- “pagué tarjeta” parece pago de obligación
- “me entró plata” parece entrada de valor
- débito en banco podría ser consumo, transferencia o pago de deuda

Interpretación todavía puede estar equivocada.

### 1.3 Comprender

Comprender es ubicar hecho dentro de realidad financiera de persona.

Comprender implica saber:

- si hecho existió
- qué tipo de evento económico representa
- qué relación altera
- en qué esfera vive
- qué estado del valor cambia
- qué impacto tiene sobre liquidez, obligaciones, riesgo o patrimonio

Sin eso no hay comprensión.
Hay solo clasificación superficial.

### 1.4 Inferir

Inferir es completar partes faltantes con base en contexto y evidencia disponible.

Ejemplos:

- si usuario escribe “pagué alquiler”, inferir contraparte y esfera probable
- si línea bancaria coincide con suscripción recurrente, inferir recurrencia
- si entrada coincide con préstamo previo, inferir cobro parcial

Inferencia nunca equivale a hecho observado.

### 1.5 Concluir

Concluir es decidir que mejor explicación disponible ya es suficientemente robusta para afectar verdad operativa.

Ejemplo:

- “esta salida no fue gasto; fue pago parcial de tarjeta”
- “este ingreso no es salario; es transferencia interna”

Conclusión requiere umbral de confianza y trazabilidad.

### 1.6 Registrar

Registrar es persistir representación de hecho, hipótesis, corrección o verdad consolidada.

Registrar no es comprender.
Es consecuencia de comprensión o, a veces, de incertidumbre explícitamente preservada.

### 1.7 Definición final

Doleth comprende un hecho financiero cuando puede:

1. anclarlo en evidencia
2. explicarlo como evento ontológico válido
3. medir impacto sobre modelo financiero
4. expresar qué sabe y qué no sabe
5. actualizar capacidad de decisión sin mentir

---

## 2. Pipeline cognitivo

Pipeline no debe seguir forma técnica de parser.
Debe seguir forma de pensamiento.

### 2.1 Diseño general

Propuesta:

**Señal → Evidencia → Candidato → Contexto → Hipótesis → Resolución → Evento ontológico → Mutación de verdad → Diagnóstico → Memoria**

### 2.2 Etapa 1. Señal

Algo llega al sistema.

Ejemplos:

- frase
- audio transcripto
- línea de extracto
- factura PDF
- email
- alerta bancaria

Señal todavía no vale como hecho.

### 2.3 Etapa 2. Evidencia

Señal se convierte en pieza de evidencia con metadatos:

- fuente
- momento
- precisión
- completitud
- confiabilidad intrínseca
- granularidad

Acá Doleth deja de ver “texto”.
Empieza a ver “prueba”.

### 2.4 Etapa 3. Candidato financiero

Motor detecta si evidencia sugiere cambio financiero relevante.

Preguntas:

- ¿hay valor económico?
- ¿hay agente?
- ¿hay tiempo?
- ¿hay mutación?

Si no, no sigue como hecho financiero nuclear.

### 2.5 Etapa 4. Contextualización

Evidencia se cruza con memoria y modelo actual:

- relaciones abiertas
- patrones recurrentes
- esferas
- contrapartes conocidas
- obligaciones pendientes
- reservas
- historial de usuario

Acá sistema deja de pensar en aislado.
Empieza a pensar en red.

### 2.6 Etapa 5. Hipótesis

Motor genera explicaciones posibles.

Ejemplo para “salieron 120.000 del banco”:

- consumo grande
- pago de tarjeta
- transferencia a wallet propia
- compra de USD
- préstamo a tercero

Cada hipótesis debe ser:

- ontológicamente válida
- compatible con evidencia
- compatible con contexto
- graduada por confianza

### 2.7 Etapa 6. Resolución

Motor decide entre:

- consolidar hipótesis
- dejar verdad provisional
- pedir aclaración
- esperar más evidencia

Esta etapa es corazón práctico del sistema.

### 2.8 Etapa 7. Evento ontológico

Cuando explicación supera umbral suficiente, se formaliza como:

- relación afectada
- verbo fundamental
- estado anterior y posterior
- esfera
- condición
- tiempo efectivo

Acá nace representación canónica.

### 2.9 Etapa 8. Mutación de verdad financiera

Evento ontológico actualiza:

- posición
- liquidez libre
- compromisos
- derechos
- obligaciones
- exposición
- trayectoria

### 2.10 Etapa 9. Diagnóstico

Nueva verdad genera interpretación de segundo nivel:

- tensión de caja
- mejora patrimonial
- riesgo creciente
- desorden entre esferas
- oportunidad de decisión

### 2.11 Etapa 10. Memoria

Motor guarda no solo resultado.
Guarda también:

- evidencia base
- hipótesis consideradas
- motivo de resolución
- relaciones descubiertas
- correcciones posteriores

### 2.12 Principio de separación

Pipeline debe separar siempre:

- entrada
- evidencia
- interpretación
- hipótesis
- verdad

Si mezcla esas capas, sistema se vuelve opaco y frágil.

---

## 3. Taxonomía de intención financiera

No interesa clasificar frases.
Interesa clasificar qué intenta hacer persona en relación con su realidad financiera.

### 3.1 Pregunta correcta

Toda intención humana relevante para Doleth responde a una de estas funciones:

- informar realidad
- cambiar realidad
- organizar realidad
- proyectar realidad
- corregir realidad
- consultar realidad

### 3.2 Clasificación mínima recomendada

#### 1. Declarar

Usuario informa algo que pasó o existe.

Ejemplos:

- cobré
- gasté
- tengo deuda
- compré BTC

#### 2. Ejecutar

Usuario quiere producir cambio financiero ahora o dejarlo listo.

Ejemplos:

- quiero pagar
- quiero mover dinero
- quiero separar plata
- quiero invertir

#### 3. Asignar

Usuario quiere dar función o destino a valor.

Ejemplos:

- guardar para alquiler
- separar para impuestos
- destinar a ahorro

#### 4. Proyectar

Usuario quiere representar futuro esperado, planificado o probable.

Ejemplos:

- el mes que viene cobro
- voy a pagar cuota
- quiero ahorrar 200.000

#### 5. Rectificar

Usuario corrige, anula o reinterpreta algo.

Ejemplos:

- eso no era gasto
- me equivoqué de monto
- era transferencia interna

#### 6. Consultar

Usuario pide comprensión o decisión.

Ejemplos:

- cuánto puedo gastar
- cuánto debo
- estoy mejor que mes pasado

### 3.3 Qué desaparece con esta taxonomía

- “ahorrar” deja de ser verbo ontológico base
- “cobrar” puede ser declarar o ejecutar según contexto
- “registrar algo pasado” cae dentro de declarar
- “corregir error” cae dentro de rectificar

### 3.4 Ventaja

Pocas intenciones humanas, muchos eventos posibles.
Eso simplifica cerebro sin empobrecerlo.

---

## 4. Manejo de incertidumbre

Doleth no puede exigir precisión total para empezar a ayudar.
Pero tampoco puede fingir certeza.

### 4.1 Teoría de incertidumbre

Toda información puede ser incierta en uno o más ejes:

#### Existencia

¿pasó o no pasó?

#### Tipo

¿qué clase de hecho fue?

#### Monto

¿cuánto valor involucró?

#### Tiempo

¿cuándo ocurrió?

#### Contraparte

¿con quién?

#### Esfera

¿personal, negocio, inversión o compartido?

#### Finalidad

¿consumo, inversión, transferencia, deuda?

#### Completitud

¿falta parte del hecho?

### 4.2 Reglas de comportamiento

#### Regla 1

Incertidumbre debe preservarse, no esconderse.

#### Regla 2

Motor puede actuar con verdad parcial si impacto es útil y riesgo de error es controlado.

#### Regla 3

Lo desconocido no debe bloquear todo.
Debe degradar precisión, no paralizar cerebro.

### 4.3 Tipos de verdad bajo incertidumbre

#### Verdad observada

Hecho sustentado por evidencia directa suficiente.

#### Verdad inferida

Hecho no observado completo, pero mejor explicación disponible con alta confianza.

#### Verdad provisional

Hecho operativo aceptado temporalmente, sujeto a revisión.

#### Posibilidad abierta

Hipótesis no consolidada todavía.

### 4.4 Ejemplos

#### “Me entró plata”

Sabemos:

- hubo entrada

No sabemos:

- monto
- origen
- esfera
- tipo exacto

Acción:

- crear evidencia de entrada parcial
- no concluir ingreso operativo todavía

#### “Gasté bastante”

Sabemos:

- usuario percibe egreso relevante

No sabemos:

- monto
- fecha
- tipo

Acción:

- registrar percepción, no evento ontológico definitivo

#### “Me pasaron unos pesos”

Puede ser:

- regalo
- devolución
- transferencia interna
- préstamo recibido

Acción:

- abrir hipótesis múltiples

#### “No me acuerdo cuánto”

Acción:

- permitir rango, aproximación o estado incompleto
- no exigir falso número exacto

### 4.5 Teoría práctica

Doleth debe operar con principio:

**mejor verdad parcial explícita que certeza inventada.**

---

## 5. Sistema de hipótesis

### 5.1 Qué es una hipótesis en Doleth

Hipótesis es explicación candidata de cómo una evidencia podría mapearse a realidad financiera.

No es opinión libre.
Debe ser:

- ontológicamente posible
- contextualmente plausible
- verificable o refutable

### 5.2 Cómo genera hipótesis

Hipótesis nacen de cruce entre:

- evidencia actual
- eventos similares pasados
- relaciones abiertas
- patrones recurrentes
- comportamiento típico del usuario
- restricciones ontológicas

### 5.3 Cómo asigna confianza

Confianza no debe ser número mágico.
Debe surgir de factores legibles:

- calidad de fuente
- completitud de datos
- coincidencia con patrones previos
- consistencia con estado actual
- confirmación por múltiples evidencias
- ausencia de contradicciones

### 5.4 Tipos de confianza

#### Confianza estructural

Qué tan confiable es fuente en sí.

Ejemplo:

- API bancaria suele ser alta
- memoria verbal ambigua suele ser media o baja

#### Confianza contextual

Qué tan bien encaja hipótesis con historia del usuario.

#### Confianza resolutiva

Qué tan seguro es consolidar sin preguntar.

### 5.5 Cuándo debe preguntar

Debe preguntar cuando:

- error posible cambia liquidez libre de forma material
- hay dos hipótesis fuertes con consecuencias distintas
- mezcla de esferas sería peligrosa
- ingreso vs préstamo vs transferencia interna cambia verdad crítica
- corrección tocaría hechos ya usados en diagnósticos importantes

### 5.6 Cuándo puede asumir

Puede asumir cuando:

- diferencia entre hipótesis es semántica, no estructural
- impacto financiero es pequeño
- patrón histórico es extremadamente estable
- evidencia adicional probablemente llegará sola
- mejor ayuda requiere avanzar con verdad provisional

### 5.7 Cómo pedir aclaraciones sin molestar

Reglas:

- preguntar solo por variable decisiva
- ofrecer mejor hipótesis actual
- mostrar por qué importa
- permitir responder corto
- postergar lo accesorio

Buen ejemplo:
“Entrada de 120.000 detectada. Parece cobro de cliente, pero también podría ser transferencia interna. Confirmar cambia tu liquidez real del negocio.”

### 5.8 Cómo aprende

Aprende de:

- confirmaciones del usuario
- correcciones
- recurrencias
- fuentes que suelen ser más fiables
- patrones entre evidencia y resolución final

Pero aprendizaje nunca debe:

- borrar trazabilidad
- convertir hábito en verdad universal
- alucinar dato faltante

---

## 6. Verdad financiera

### 6.1 Qué significa verdad en Doleth

Verdad financiera no es “lo último que alguien dijo”.

Es:

**mejor representación actual, trazable y revisable de realidad financiera de persona.**

### 6.2 Condiciones para considerar algo verdadero

Un hecho puede considerarse verdadero cuando:

1. tiene evidencia suficiente
2. tiene explicación ontológica coherente
3. no contradice verdad más fuerte
4. su incertidumbre residual está explícita
5. puede afectar modelo sin distorsionar más de lo que aclara

### 6.3 Verdad provisional

Sí, debe existir.

Sin verdad provisional Doleth sería inútil hasta tener certeza total.
Con verdad provisional bien marcada puede ayudar antes.

Ejemplo:

- “probable cobro parcial de cliente”
- “posible compra de cripto”

### 6.4 Cómo cambia verdad con nueva evidencia

Nueva evidencia puede:

- confirmar
- refinar
- dividir
- corregir
- revertir

Importante:
verdad nueva no borra historia.
La reemplaza como explicación vigente, pero deja rastro de evolución cognitiva.

### 6.5 Jerarquía de verdad

#### Nivel 1. Evidencia cruda

Señal observada.

#### Nivel 2. Hecho plausible

Hipótesis sólida, pero no consolidada.

#### Nivel 3. Hecho operativo

Verdad suficiente para actualizar modelo.

#### Nivel 4. Hecho consolidado

Alta confianza, baja probabilidad de revisión.

### 6.6 Regla fuerte

Doleth no busca certeza absoluta.
Busca **verdad útil sin traicionar realidad**.

---

## 7. Memoria

### 7.1 Qué es memoria en Doleth

Memoria no es archivo de entradas.
Es sistema que conserva:

- hechos
- evidencia
- relaciones
- patrones
- excepciones
- correcciones
- contexto decisional

### 7.2 Qué recuerda

#### Hechos

Eventos consolidados y provisionales.

#### Relaciones abiertas

- deudas
- cobros pendientes
- reservas
- compromisos
- inversiones

#### Patrones

- pagos recurrentes
- contrapartes frecuentes
- meses tensos
- mezcla entre esferas
- hábitos de asignación

#### Fiabilidad histórica

- qué fuentes suelen ser limpias
- qué tipo de declaraciones del usuario suelen requerir ajuste

### 7.3 Qué resume

No debe cargar todo en misma resolución.

Debe resumir:

- microeventos antiguos de bajo impacto
- patrones recurrentes ya estables
- contexto semántico no crítico

Debe conservar en detalle:

- correcciones
- deudas
- activos
- cambios de esfera
- eventos que explican posición actual

### 7.4 Qué olvida

No debe olvidar verdad histórica relevante.
Sí puede olvidar o compactar:

- ruido duplicado
- hipótesis descartadas sin valor residual
- evidencia redundante ya absorbida

### 7.5 Qué relaciones construye

Memoria debe construir grafo vivo:

- contraparte ↔ tipo de relación
- vehículo ↔ esfera
- evento ↔ obligación asociada
- ingreso ↔ patrón temporal
- activo ↔ revaluaciones
- error recurrente ↔ tipo de confusión

### 7.6 Memoria buena

Recuerda menos datos.
Recuerda mejor estructura.

---

## 8. Aprendizaje

### 8.1 Qué significa aprender

Aprender es mejorar calidad de interpretación futura sin contaminar verdad actual.

### 8.2 Qué puede aprender

- preferencias de esfera
- contrapartes habituales
- tipos recurrentes de evento
- vocabulario personal
- umbrales de pregunta útiles
- patrones de error y corrección

### 8.3 Qué no debe aprender como si fuera verdad

- montos no confirmados
- intenciones no ejecutadas
- etiquetas dudosas
- correlaciones débiles

### 8.4 Cómo mejora sin romper consistencia

Separando:

- conocimiento del dominio
- memoria del usuario
- inferencias contextuales
- verdad consolidada

Aprendizaje cambia priors e hipótesis futuras.
No reescribe pasado sin nueva evidencia.

### 8.5 Aprendizaje por corrección

Corrección explícita del usuario vale mucho.

Pero no debe generalizarse sin disciplina.

Ejemplo:
si usuario corrige una vez “mercadería” como inversión operativa, sistema no debe asumir que toda compra parecida significa mismo.

### 8.6 Aprendizaje por repetición

Si patrón aparece muchas veces con misma resolución, motor puede:

- elevar confianza previa
- reducir necesidad de pregunta
- sugerir automatización semántica

### 8.7 Límite del aprendizaje

Doleth debe volverse más preciso, no más imaginativo.

---

## 9. Principios del Motor Cognitivo

### 1. Evidencia antes que narrativa

Motor no debe enamorarse de explicación atractiva si evidencia es débil.

### 2. Una fuente nunca equivale a verdad total

Toda fuente es parcial.
Incluso API bancaria muestra solo una cara de realidad.

### 3. Interpretar no es registrar

Nada debe consolidarse solo porque fue leído.

### 4. Toda conclusión debe ser trazable

Usuario y sistema deben poder volver a evidencia que la sostuvo.

### 5. Incertidumbre debe preservarse

Lo dudoso no debe maquillarse como hecho firme.

### 6. Verdad puede ser provisional

Ayudar temprano es válido si provisionalidad queda explícita.

### 7. Corrección no borra historia cognitiva

Motor debe recordar que antes creyó otra cosa y por qué cambió.

### 8. Evento ontológico antes que etiqueta superficial

Primero entender qué cambió.
Después nombrarlo.

### 9. Costo de preguntar debe ser menor que costo de asumir mal

Principio para decidir cuándo interrumpir usuario.

### 10. No todo dato faltante merece pregunta

Motor debe priorizar vacíos materialmente relevantes.

### 11. Múltiples hipótesis deben competir

Nunca fijar primera explicación plausible sin contraste.

### 12. Aprendizaje nunca puede inventar evidencia

Patrón aprendido sube confianza.
No crea hechos.

### 13. Misma realidad, mismo modelo

Texto, PDF o banco deben converger en misma representación final.

### 14. Una entrada puede contener varios hechos

No forzar correspondencia uno a uno entre mensaje y evento.

### 15. Un hecho puede requerir varias evidencias

Especialmente en deuda, cuotas, inversiones y cruces de esfera.

### 16. Lo importante es impacto en capacidad de decisión

Motor no existe para archivar.
Existe para clarificar qué puede hacer usuario ahora.

### 17. Flujo, posición y riesgo no deben contaminarse

Conclusión buena distingue qué cambió de verdad.

### 18. Toda automatización debe poder explicarse

Si sistema no puede explicar por qué concluyó algo, automatizó demasiado.

---

## 10. Síntesis final

Motor Cognitivo de Doleth debe operar como sistema de construcción de verdad financiera, no como capturador de datos.

Su secuencia esencial:

- recibe señales
- las convierte en evidencia
- genera hipótesis
- resuelve con grados de confianza
- formaliza eventos ontológicos
- actualiza estado financiero
- recalcula capacidad de decisión
- guarda memoria trazable
- aprende sin inventar

Taxonomía mínima de intención humana:

- declarar
- ejecutar
- asignar
- proyectar
- rectificar
- consultar

Verdad en Doleth debe ser:

- trazable
- revisable
- graduada
- útil

Si este motor se respeta, Doleth podrá comprender misma realidad desde voz, texto, PDF, banco o cripto sin fracturarse en flujos separados.

Eso convierte a Doleth en algo mucho más poderoso que app financiera:
la convierte en sistema cognitivo de verdad económica personal.
