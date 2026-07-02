# PRD-001 — Doleth MVP

Estado: propuesto
Fecha: 2 de julio de 2026
Baseline conceptual: congelada

Este PRD deriva exclusivamente de especificación oficial ya congelada:

- Brand Foundation
- Constitución del Producto
- Arquitectura Conceptual
- Ontología Financiera
- Estados del Valor
- Motor Cognitivo
- RFC-001 Corpus Universal
- RFC-002 Knowledge Governance
- Master Specification Index

No introduce teoría nueva.
Solo traduce teoría existente a producto.

---

## 1. Problema mínimo que el MVP debe resolver

El MVP debe resolver un problema, no veinte:

**decirme cuánto dinero libre tengo de verdad hoy y esta semana, sin confundir saldo con liquidez.**

Ese problema concentra núcleo de Doleth:

- posición, no lista de movimientos
- tiempo, no foto plana
- certeza, no falsa precisión
- capacidad de decisión, no contabilidad

Pregunta central del MVP:

**¿cuánto puedo usar hoy sin desordenar mis próximos días?**

Si MVP no responde eso bien, no merece expandirse.

---

## 2. Transformación del usuario

### Antes

Usuario mira:

- saldos dispersos
- tarjeta por un lado
- efectivo por otro
- compromisos en la cabeza
- dólares o ahorros como si fueran caja disponible

Resultado:
decide con imagen incompleta.

### Después

Usuario abre Doleth y ve:

- liquidez libre real
- presión próxima
- compromisos ya consumidos
- una explicación corta de qué cambió
- próximo paso razonable

Resultado:
deja de adivinar.
Empieza a decidir.

Transformación esperada:

**de saldo ansioso a posición legible.**

---

## 3. Recorrido completo del usuario durante la primera semana

### Día 1

Usuario crea verdad inicial mínima:

- dinero disponible en contenedores principales
- tarjetas u obligaciones próximas
- reservas ya decididas
- moneda de cada bloque relevante

No carga historial completo.
Carga punto de partida suficiente para decidir.

### Primer movimiento

Usuario registra primer hecho en lenguaje humano.

Ejemplos válidos para MVP:

- cobré 450.000
- pagué tarjeta
- compré 100 USDT
- transferí 80.000 de banco a billetera
- separé 150.000 para alquiler

Doleth lo interpreta como cambio de posición, no como fila.

### Primera decisión

Usuario pregunta o infiere:

**¿puedo gastar hoy o me estoy comiendo plata ya comprometida?**

Doleth responde con liquidez libre y presión próxima.

### Primer insight

Primer insight ideal:

**tenés más saldo visible que dinero libre real porque ya hay compromisos consumiendo esta semana.**

O:

**moviste plata entre cuentas, pero tu posición no mejoró.**

### Primera recomendación

Primera recomendación ideal no es educativa.
Es concreta.

Ejemplos:

- no uses este excedente como gasto libre; ya está tomado por alquiler y tarjeta
- hoy podés gastar hasta cierto margen sin tensionar próximos 7 días
- tu problema no es falta de saldo; es vencimiento concentrado

### Primer hábito

Hábito esperado:

abrir Doleth una vez por día para recalibrar realidad, no para “llevar control”.

Hábito sano del MVP:

**registrar lo material, corregir lo ambiguo, decidir con base en liquidez libre.**

---

## 4. Capacidades mínimas

No features.
Capacidades.

### 4.1 Construir verdad inicial mínima

Doleth debe poder partir de una foto actual suficientemente útil sin exigir reconstrucción histórica exhaustiva.

### 4.2 Ingerir hechos materiales en lenguaje humano

Usuario debe poder declarar movimientos relevantes con frases cortas.

### 4.3 Distinguir cambio de posición de reacomodo

Debe reconocer al menos estas diferencias:

- gasto vs transferencia interna
- compra de activo/reserva vs consumo
- pago de deuda vs salida sin contraparte
- entrada real vs movimiento entre mundos propios

### 4.4 Calcular liquidez real y liquidez libre

Debe mostrar:

- cuánto existe
- cuánto está libre hoy
- cuánto ya está comprometido
- qué vence en horizonte corto

### 4.5 Preservar incertidumbre material

Si hecho cambia liquidez de forma material y es ambiguo, Doleth debe preguntar o marcar provisionalidad.

### 4.6 Explicar en lenguaje simple qué cambió

No mostrar ontología.
Sí mostrar resultado.

Ejemplo de capacidad:

“esto no fue gasto puro; bajó tu caja pero canceló una obligación futura”.

### 4.7 Entregar una decisión diaria útil

Producto debe poder devolver al menos una conclusión accionable por día.

### 4.8 Aprender correcciones del usuario sin inventar

Si usuario corrige interpretación, sistema debe afinar lectura futura sin convertir patrón en dogma automático.

---

## 5. Capacidades explícitamente fuera del MVP

### 5.1 Automatización bancaria completa

Fuera.

Razón:
no prueba tesis central.
Solo reduce fricción futura.

### 5.2 Multiusuario o colaboración

Fuera.

Razón:
agrega complejidad social antes de consolidar verdad individual.

### 5.3 Asesoría profunda o simuladores avanzados

Fuera.

Razón:
Doleth todavía debe merecer consejo antes de escalar recomendación.

### 5.4 Inversión avanzada y portfolio analytics

Fuera.

Razón:
riesgo alto de desviar producto hacia tracking de activos en vez de liquidez y decisión cotidiana.

### 5.5 Reporting contable o fiscal

Fuera.

Razón:
no es identidad central del producto.

### 5.6 Marketplace, productos financieros o monetización embebida

Fuera.

Razón:
sesga criterio contra usuario demasiado temprano.

### 5.7 Cobertura universal de todos los instrumentos

Fuera.

Razón:
MVP no debe modelar todo.
Debe modelar lo suficiente para responder bien pregunta central.

### 5.8 Historial perfecto y reconciliación total

Fuera.

Razón:
primer valor debe nacer de presente utilizable, no de exhaustividad.

---

## 6. Cómo se traduce la ontología a experiencia

Usuario no debe ver:

- agentes
- relaciones económicas
- estados base
- verbos ontológicos
- condición de firmeza

Usuario sí debe sentir resultado de todo eso.

### Traducción de capas

Ontología vive como:

- interpretación correcta de lo que pasó

Estados del valor viven como:

- dinero libre
- dinero reservado
- dinero comprometido
- dinero expuesto o menos disponible

Tiempo vive como:

- hoy
- próximos 7 días
- próximos 30 días

Certeza vive como:

- seguro
- probable
- falta confirmar

Motor cognitivo vive como:

- entiende frases humanas
- pregunta poco
- explica por qué duda
- corrige sin drama

### Regla de experiencia

Interfaz del MVP debe sentirse así:

**una sola verdad visible, varias tensiones invisibles ya resueltas por detrás.**

---

## 7. Pantalla inicial

Pantalla inicial debe responder una sola pregunta:

**¿cuál es mi margen real para decidir hoy?**

No debe abrir con:

- lista larga de movimientos
- categorías
- gráficos históricos
- patrimonio total sin contexto

Debe abrir con cuatro piezas:

1. liquidez libre hoy
2. presión próxima
3. qué cambió desde última vez
4. próximo cuidado o próxima oportunidad

Decisión que ayuda a tomar:

**gastar, esperar, mover, reservar o corregir una interpretación.**

---

## 8. Flujo diario ideal

Uso ideal de un año no es “llevar registro”.
Es sostener lucidez.

Cada mañana, usuario debería abrir Doleth y sentir:

- claridad, no culpa
- orientación, no ruido
- confianza, no sobrecarga

Flujo diario ideal:

1. abrir app
2. ver si posición de hoy cambió materialmente
3. detectar si hay tensión próxima
4. corregir ambigüedad si existe
5. salir con una decisión más limpia

Sensación correcta:

**mi dinero dejó de estar en niebla por unos segundos y sé qué hacer con hoy.**

Si app exige sesión larga cada día, MVP falló.

---

## 9. Criterio para declarar exitoso el MVP

No negocio.
Transformación.

MVP es exitoso si usuario experimenta estas diez señales:

1. deja de usar saldo visible como proxy de dinero utilizable
2. consulta Doleth antes de decisiones materiales de corto plazo
3. entiende por qué algo fue gasto, transferencia, reserva o pago de obligación
4. identifica compromisos próximos sin reconstrucción mental externa
5. detecta al menos un caso de falsa liquidez por semana
6. corrige menos y confía más con paso de los días
7. siente menor ansiedad al abrir su panorama financiero
8. puede explicar en una frase su posición actual
9. usa Doleth para decidir, no solo para registrar
10. si Doleth falta un día, extraña claridad, no dashboard

Señal maestra:

**usuario toma mejores decisiones cotidianas porque Doleth cambió su lectura del presente.**

---

## 10. Backlog completo

### P0 — Núcleo obligatorio

#### 1. Definir alcance exacto del MVP sobre esfera personal

Justificación:
sin frontera clara, producto intenta resolver todo y no demuestra nada.

#### 2. Captura de posición inicial mínima

Justificación:
Doleth necesita verdad base antes de interpretar eventos.

#### 3. Registro de hechos materiales en lenguaje humano

Justificación:
es entrada natural mínima coherente con motor cognitivo.

#### 4. Interpretación de eventos core

Cobertura mínima:

- ingreso simple
- gasto simple
- transferencia interna
- pago de tarjeta o deuda
- reserva o asignación
- compra de moneda dura o reserva de valor

Justificación:
sin estas distinciones, Doleth vuelve a ser tracker de movimientos.

#### 5. Modelo visible de liquidez libre y compromisos próximos

Justificación:
es problema mínimo del MVP.

#### 6. Manejo explícito de incertidumbre material

Justificación:
mejor dudar bien que mentir con certeza falsa.

#### 7. Pantalla inicial centrada en margen real de decisión

Justificación:
cada pantalla debe responder una pregunta.
esta es la primera.

#### 8. Primera explicación accionable

Justificación:
verdad sin traducción a criterio todavía no entrega valor.

#### 9. Loop de corrección del usuario

Justificación:
confianza real nace cuando sistema puede corregirse.

### P1 — Valor fuerte inmediato

#### 1. Soporte de múltiples contenedores personales relevantes

Justificación:
realidad fragmentada ya empieza acá.

#### 2. Compromisos recurrentes y vencimientos cercanos

Justificación:
sin presión temporal, liquidez libre queda coja.

#### 3. Moneda local + moneda dura mínima

Justificación:
para este contexto, separar valor por unidad no es lujo.
Es verdad básica.

#### 4. Explicación corta de por qué cambió posición

Justificación:
ayuda a consolidar confianza y aprendizaje diario.

#### 5. Insight de falsa liquidez

Justificación:
es primer diferencial emocional fuerte del producto.

### P2 — Profundidad operativa

#### 1. Soporte inicial para cuotas

Justificación:
introduce tiempo real sobre consumo ya hecho.

#### 2. Derechos a cobrar simples

Justificación:
permite distinguir caja real de ingresos esperados.

#### 3. Mezcla básica personal-operativa

Justificación:
usuario wedge vive este dolor, pero no debe entrar antes del núcleo personal.

#### 4. Historial corto explicado por cambios de posición

Justificación:
ayuda a entender trayectoria sin caer en dashboard de transacciones.

### P3 — Expansión posterior

#### 1. Multi esfera completa

Justificación:
alto valor, pero demasiado costosa antes de consolidar núcleo.

#### 2. Inversiones y exposición avanzada

Justificación:
debe venir después de dominar liquidez y compromisos.

#### 3. Importaciones automáticas y conectores

Justificación:
amplifican valor existente; no crean verdad por sí mismos.

#### 4. Recomendaciones más profundas y escenarios

Justificación:
solo después de tener motor confiable en uso real.

#### 5. Colaboración con pareja, socio o contador

Justificación:
requiere verdad individual consolidada primero.

---

## Cierre

MVP correcto de Doleth no es mini app de gastos.

Es sistema pequeño, diario y confiable para responder una pregunta brutalmente útil:

**qué dinero tengo libre de verdad para decidir hoy.**

Si resuelve eso con claridad y constancia, Doleth ya empieza a existir como sistema de verdad financiera personal.
