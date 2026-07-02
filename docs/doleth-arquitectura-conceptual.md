# Doleth

## Arquitectura Conceptual del Producto

Documento para definir el modelo mental fundacional sobre el que debe vivir Doleth durante la próxima década.

Su propósito no es describir pantallas, features ni tecnología.
Su propósito es fijar la lógica conceptual que hace coherente todo lo demás.

---

## 0. Punto de partida

La mayoría de los productos financieros están construidos sobre una premisa equivocada:
que finanzas personales consisten en registrar ingresos y gastos.

Ese modelo nace de contabilidad doméstica, no de realidad financiera moderna.

La realidad moderna es otra:

- dinero distribuido en muchas cuentas y billeteras
- múltiples monedas
- tarjetas y cuotas
- inversiones y activos volátiles
- préstamos formales e informales
- mezcla entre vida personal, negocio y ahorro
- ingresos inciertos o variables
- dinero comprometido antes de salir
- movimientos que no cambian riqueza, pero sí liquidez, riesgo o plazo

Por eso Doleth no debe modelar “gastos”.
Debe modelar **posición financiera personal en el tiempo**.

Esa es abstracción correcta.

---

## 1. ¿Cuál es modelo mental correcto de finanzas personales?

### 1.1 Modelo tradicional incorrecto

Modelo tradicional dice:

- tengo ingresos
- tengo gastos
- los clasifico
- comparo contra presupuesto
- miro saldo

Ese modelo sirve para disciplina básica.
No sirve para comprender vidas financieras complejas.

Falla por cuatro motivos:

1. Trata todo dinero como equivalente
No distingue entre dinero disponible hoy, dinero invertido, dinero prestado, dinero en tránsito o dinero ya comprometido.

2. Trata todo egreso como destrucción de valor
Pero pagar tarjeta, comprar dólares, prestar dinero o mover fondos no significan mismo fenómeno económico.

3. Ignora tiempo
No diferencia entre obligación de mañana, de fin de mes o de dentro de seis meses.

4. Ignora incertidumbre
No todo “activo” tiene misma certeza. No todo “ingreso esperado” vale lo mismo.

### 1.2 Modelo correcto: posición, tiempo y certeza

Modelo mental más robusto:

**Finanzas personales son gestión de posición económica personal a través del tiempo, bajo restricciones de liquidez e incertidumbre.**

Doleth debe pensar dinero en tres ejes simultáneos:

### A. Posición

Qué valor controlás y qué valor debés.

Incluye:

- recursos líquidos
- activos
- deudas
- dinero a cobrar
- dinero ya comprometido

### B. Tiempo

Cuándo ese valor está disponible o exigible.

Porque mismo monto cambia de significado según plazo:

- disponible hoy
- disponible en 7 días
- retenido hasta cierre
- invertido a largo plazo
- cuota ya comprometida para próximos meses

### C. Certeza

Qué tan confiable es ese valor.

No vale igual:

- dinero en caja
- dinero en cuenta
- dinero que te debe un amigo
- bono volátil
- pago prometido por cliente

La verdad financiera no es suma de saldos.
Es lectura conjunta de posición, tiempo y certeza.

### 1.3 Abstracción correcta: capacidad de decisión

Usuario no quiere saber solo cuánto tiene.
Quiere saber cuánta capacidad real de decisión tiene.

Esa capacidad depende de:

- liquidez inmediata
- compromisos futuros
- estabilidad del flujo
- exposición al riesgo
- separación entre dinero propio, dinero prestado y dinero comprometido

Por eso mejor definición de finanzas personales para Doleth es esta:

**Administrar capacidad de decisión financiera.**

### 1.4 Qué importa más que categorías

Categorías de gasto pueden ser útiles.
Pero no son núcleo conceptual.

Núcleo real está en estas preguntas:

- ¿este movimiento cambió patrimonio, liquidez, riesgo o solo ubicación?
- ¿este dinero está libre, reservado, comprometido o expuesto?
- ¿esto mejora mi posición o solo posterga problema?
- ¿este activo me da seguridad o me quita flexibilidad?

### 1.5 Distinción central: saldo no es liquidez

Una de las mayores confusiones del usuario común es creer que saldo visible equivale a dinero utilizable.

Doleth debe separar siempre:

- saldo nominal
- liquidez real
- liquidez libre
- liquidez comprometida

Sin esa separación, cualquier producto financiero miente aunque números sean correctos.

### 1.6 Distinción central: patrimonio no es bienestar financiero

Patrimonio alto con liquidez baja puede generar angustia.
Patrimonio modesto con obligaciones controladas puede generar estabilidad.

Eso implica que patrimonio es vital, pero no suficiente.
Doleth debe modelar equilibrio entre:

- tamaño de riqueza
- calidad de liquidez
- presión de obligaciones
- resiliencia del flujo

### 1.7 Definición final

Modelo mental fundacional de Doleth:

**Vida financiera personal es red dinámica de recursos, obligaciones, compromisos y decisiones distribuidas en tiempo, con distintos niveles de liquidez, riesgo y certeza.**

Doleth existe para convertir esa red en una verdad legible y accionable.

---

## 2. ¿Cuáles son grandes objetos del sistema?

No todos los conceptos deben vivir al mismo nivel.
Si núcleo conceptual tiene demasiados objetos primarios, producto se fragmenta.
Si tiene muy pocos, no logra explicar realidad.

Mejor enfoque:
separar entre objetos primarios y objetos derivados.

### 2.1 Objetos primarios

Estos son conceptos irreductibles.
Sin ellos, Doleth no puede pensar.

#### 1. Esfera financiera

Unidad de contexto económico.

Ejemplos:

- personal
- negocio
- compartida
- inversión

No es una cuenta.
Es un mundo financiero con lógica propia.

Esfera es crítica porque mucha confusión nace de mezclar mundos.
Una misma persona puede tener posición sana en esfera personal y tensión severa en esfera operativa.

#### 2. Contenedor de valor

Lugar donde valor “vive” o se manifiesta.

Ejemplos:

- cuenta bancaria
- efectivo
- billetera virtual
- tarjeta
- exchange
- broker
- caja física

No define significado económico.
Define ubicación o vehículo.

#### 3. Evento económico

Cambio elemental que altera estado financiero.

Esto reemplaza visión pobre de “movimiento”.

Un evento puede:

- ingresar valor
- sacar valor
- mover valor
- transformar valor
- crear obligación
- cancelar obligación
- crear derecho de cobro
- deteriorar o mejorar liquidez
- cambiar riesgo o plazo

Evento económico es mejor objeto que “transacción” porque interpreta significado.

#### 4. Recurso

Algo de valor que controlás.

Incluye:

- dinero
- ahorro en moneda dura
- inversión líquida
- cripto
- dinero prestado a cobrar

No todo recurso es líquido.
No todo recurso tiene misma certeza.

#### 5. Obligación

Valor que debés entregar.

Incluye:

- deuda
- tarjeta pendiente
- préstamo
- factura por pagar
- impuestos
- saldo financiado

Obligación no significa solo “deuda grande”.
También incluye presión futura ya adquirida.

#### 6. Compromiso

Uso futuro de liquidez que ya está, total o parcialmente, decidido.

Ejemplos:

- cuotas futuras
- suscripciones
- alquiler próximo
- vencimiento de tarjeta
- pago acordado a proveedor

Compromiso no siempre es obligación formal.
Pero sí consume margen de maniobra.

Esta distinción es decisiva.
Muchos usuarios no están endeudados en términos clásicos, pero sí están financieramente asfixiados por compromisos.

#### 7. Derecho de cobro

Valor que otros deben entregarte.

Ejemplos:

- préstamo a amigo
- factura emitida
- adelanto pendiente
- devolución a recibir

No debe mezclarse con dinero ya disponible.
Tiene fecha probable y nivel de certeza.

#### 8. Contraparte

Quién está del otro lado.

Ejemplos:

- banco
- cliente
- amigo
- empresa
- plataforma
- exchange

Contraparte permite construir contexto:

- relación recurrente
- riesgo de cobro
- gasto fijo implícito
- dependencia de ingreso

#### 9. Reserva

Porción de recursos separada mental o funcionalmente para proteger estabilidad.

Ejemplos:

- fondo de emergencia
- dinero de impuestos
- caja de operación
- dinero para tarjeta

Reserva no es lo mismo que objetivo.
Reserva defiende estructura.
Objetivo persigue aspiración.

#### 10. Objetivo

Estado futuro deseado.

Ejemplos:

- aumentar colchón
- bajar deuda
- sostener gasto mensual
- juntar capital para algo

Objetivo importa para recomendación y priorización.
Pero no debe definir verdad base del sistema.

### 2.2 Objetos que no deberían ser primarios

#### Dinero

“Dinero” parece objeto primario, pero no alcanza.
Dinero es sustancia que circula entre estados.
Sin contexto, no explica nada.

#### Movimiento

Es término demasiado superficial.
No todo movimiento cambia realidad financiera del mismo modo.

#### Inversión

Debe ser subtipo de recurso o de asignación de capital.
No necesita existir como átomo independiente.

#### Deuda

Es subtipo de obligación.
No conviene elevarla a concepto separado si obligación ya existe.

#### Suscripción

Es subtipo de compromiso recurrente.

#### Fuente de ingreso

No es átomo.
Es patrón derivado de eventos y contrapartes.

#### Patrimonio

No es objeto base.
Es resultado derivado de recursos menos obligaciones.

#### Activo y pasivo

Son útiles, pero demasiado contables como centro.
Mejor traducirlos a recursos y obligaciones.

### 2.3 Objetos derivados

Estos no deben cargarse como verdad primaria.
Deben emerger del motor.

#### Posición financiera

Estado consolidado de recursos, obligaciones, compromisos y derechos.

#### Patrimonio neto

Recursos menos obligaciones.

#### Liquidez real

Recursos disponibles según plazo, fricción y reservas.

#### Liquidez libre

Liquidez real menos compromisos próximos.

#### Presión financiera

Intensidad con que compromisos futuros compiten contra flujo esperado.

#### Exposición

Cuánta sensibilidad tiene sistema a moneda, contraparte, volatilidad o deuda.

#### Trayectoria

Dirección del sistema:

- mejora
- se estanca
- se deteriora

### 2.4 Mapa conceptual mínimo

Si Doleth quiere pensar bien, debe partir de este esqueleto:

- esferas
- contenedores
- eventos
- recursos
- obligaciones
- compromisos
- derechos de cobro
- contrapartes
- reservas
- objetivos

Todo lo demás sale de acá.

---

## 3. ¿Qué preguntas quiere responder persona todos los días?

No más de 20.
Ordenadas por prioridad real, no por tradición financiera.

### Núcleo diario

1. ¿Cuánto dinero realmente tengo disponible hoy?
2. ¿Cuánto puedo gastar hoy sin desordenar próximos días?
3. ¿Qué parte de mi dinero ya está comprometida?
4. ¿Qué vence en próximos 7 días?
5. ¿Qué vence en próximos 30 días?
6. ¿Dónde está distribuido mi dinero ahora?
7. ¿Qué parte de mi dinero está invertida, inmovilizada o expuesta?
8. ¿Cuánto debo realmente hoy?
9. ¿Cuánto me deben y qué tan probable es cobrarlo?
10. ¿Mi flujo actual alcanza para sostener mi ritmo de vida y operación?

### Diagnóstico y control

11. ¿Estoy usando deuda o tarjeta para sostener consumo corriente?
12. ¿Qué movimientos recientes cambiaron mi posición de verdad y cuáles fueron solo reacomodos?
13. ¿Mi liquidez está mejor o peor que hace un mes?
14. ¿Mi patrimonio neto subió o bajó?
15. ¿Estoy mejor o peor que hace tres meses?

### Mejora y criterio

16. ¿Qué me está generando más presión financiera?
17. ¿Qué oportunidad clara tengo hoy para mejorar mi posición?
18. ¿Qué error estoy repitiendo?
19. ¿Qué riesgo estoy subestimando?
20. ¿Qué decisión me conviene tomar ahora?

### Observación importante

Preguntas 1 a 10 construyen verdad operativa.
Preguntas 11 a 15 construyen comprensión.
Preguntas 16 a 20 construyen inteligencia.

Si Doleth no responde bien primeras diez, no tiene derecho a responder últimas cinco.

---

## 4. ¿Qué información debería aparecer automáticamente?

Gran producto financiero no espera que usuario descubra solo lo importante.
Debe empujar verdad relevante.

### 4.1 Lo que Doleth debería descubrir por sí sola

#### Patrones recurrentes

- ingresos periódicos o semi periódicos
- suscripciones
- pagos fijos
- gastos operativos repetidos
- fechas de presión recurrente

#### Transferencias internas

Debe detectar qué actividad es solo movimiento entre contenedores.
Eso evita falsas lecturas de gasto o ingreso.

#### Conversión de activos

Debe distinguir:

- gasto
- ahorro
- inversión
- compra de moneda dura
- compra de cripto
- pago de deuda

Porque mismo egreso desde cuenta puede significar cosas opuestas.

#### Separación de esferas

Debe inferir cuándo gasto pertenece a negocio, cuándo a vida personal y cuándo es mezcla peligrosa.

#### Reservas implícitas

Si usuario sistemáticamente guarda dinero para impuestos, tarjeta o alquiler, Doleth debe inferir esa función aunque no exista regla formal.

### 4.2 Relaciones que debería encontrar

#### Flujo vs compromisos

Cuando flujo esperado ya no alcanza para presión futura.

#### Tarjeta vs caja real

Cuando consumo con tarjeta crea ilusión de holgura.

#### Inversiones vs falta de liquidez

Cuando usuario tiene patrimonio, pero está corto de dinero utilizable.

#### Préstamos otorgados vs estrés actual

Cuando dinero prestado a terceros está deteriorando capacidad presente.

#### Ingresos variables vs gasto fijo alto

Cuando estructura de gasto quedó demasiado rígida para ingreso inestable.

#### Moneda de ahorro vs moneda de gasto

Cuando usuario protege valor en activo correcto pero queda vulnerable en corto plazo.

### 4.3 Anomalías que debería detectar

- caída abrupta de liquidez
- incremento anormal en presión de vencimientos
- doble cobro o gasto duplicado
- suscripción olvidada
- salto de gasto recurrente
- aumento silencioso de carga en cuotas
- uso creciente de tarjeta para cubrir caja
- concentración excesiva en una sola contraparte o activo
- entrada esperada que no ocurrió
- transferencia atípica entre esferas

### 4.4 Oportunidades que debería sugerir

- cancelar o revisar compromiso recurrente de bajo valor
- anticipar pago que reduce presión futura relevante
- mover dinero ocioso a reserva útil
- reducir mezcla entre personal y negocio
- cobrar deuda informal pendiente
- bajar exposición innecesaria
- reconstruir colchón antes de aumentar inversión

### 4.5 Qué no debería empujar automáticamente

- consejos vagos de educación financiera
- notificaciones por todo
- score sin explicación
- comparaciones sociales irrelevantes

Toda información automática debe cumplir al menos una función:

- proteger liquidez
- revelar presión
- mostrar deterioro
- mostrar mejora
- abrir oportunidad de decisión

---

## 5. Diseño del motor mental de Doleth

Hay que imaginar que toda la aplicación está gobernada por un solo cerebro conceptual.
Ese cerebro no “mira movimientos”.
Piensa en estados, relaciones y consecuencias.

### 5.1 Principio rector

Cada evento financiero debe responder cuatro preguntas:

1. ¿Qué cambió?
2. ¿Dónde cambió?
3. ¿Cuándo impacta?
4. ¿Qué implica para capacidad de decisión?

Si no responde eso, todavía no fue entendido.

### 5.2 Cómo piensa Doleth

Motor mental de Doleth opera en siete capas.

#### Capa 1. Observación

Recibe señales:

- texto del usuario
- movimiento importado
- dato manual
- patrón histórico

Todavía no sabe qué significan.
Solo sabe que ocurrió algo.

#### Capa 2. Interpretación económica

Convierte señal en tipo de evento.

Ejemplos:

- “Compré USDT”
No es gasto. Es conversión de recurso líquido a recurso invertido o resguardado, con cambio de liquidez y riesgo.

- “Pagué tarjeta”
No es solo egreso. Es salida de caja que cancela obligación y reduce presión futura.

- “Presté plata a Juan”
No es gasto puro. Es caída de liquidez con creación de derecho de cobro incierto.

- “Cobré 350.000 por proyecto”
No es solo ingreso. Puede mejorar caja, reducir tensión y confirmar patrón de fuente variable.

Esta capa define sentido económico.

#### Capa 3. Vinculación contextual

Evento se conecta con:

- esfera
- contenedor
- contraparte
- moneda o activo
- recurrencia probable
- relación con obligaciones o reservas
- nivel de certeza

Acá nace contexto.

#### Capa 4. Mutación de estado

Evento actualiza estados internos del sistema.

No actualiza solo saldos.
Actualiza:

- recursos
- obligaciones
- compromisos
- derechos de cobro
- reservas
- exposición
- presión de calendario

Este punto es clave:
Doleth debe pensar cada evento como mutación de estado financiero.

#### Capa 5. Recomputación de verdad

Después de cada mutación, motor recalcula:

- posición actual
- patrimonio neto
- liquidez real
- liquidez libre
- presión en próximos 7, 30 y 90 días
- volatilidad del flujo
- fragilidad del sistema
- trayectoria reciente

#### Capa 6. Comparación y diagnóstico

Nueva verdad se compara contra:

- historia propia
- patrones recurrentes
- reservas esperadas
- objetivos declarados
- umbrales de riesgo

Así nacen insights.

No por reglas arbitrarias, sino por diferencia relevante entre estado actual y contexto esperado.

#### Capa 7. Respuesta

Motor transforma diagnóstico en salida útil:

- respuesta directa
- alerta
- explicación
- recomendación
- prioridad

### 5.3 Qué conecta este cerebro

Motor mental de Doleth no une filas.
Une significados.

Debe conectar:

- dinero actual con obligación futura
- compra pasada con presión próxima
- préstamo dado con estrés presente
- activo invertido con falta de flexibilidad
- ingreso variable con estructura fija peligrosa
- movimientos frecuentes con patrón invisible

### 5.4 Distinción esencial: cambiar ubicación, cambiar estado, cambiar posición

Muchos productos no distinguen estas tres cosas.
Doleth sí debe hacerlo.

#### Cambiar ubicación

Mover dinero entre cuenta bancaria y billetera.
No cambia patrimonio ni necesariamente liquidez.

#### Cambiar estado

Convertir efectivo en dólar, USDT o inversión líquida.
Puede no cambiar patrimonio inmediato, pero sí liquidez, riesgo y horizonte.

#### Cambiar posición

Tomar deuda, cobrar ingreso, perder dinero, cancelar obligación.
Acá sí cambia estructura económica de fondo.

Esta distinción debe vivir en núcleo conceptual.
Sin ella, producto confunde actividad con progreso.

### 5.5 Estados del dinero

Para pensar bien, Doleth debe tratar valor según estado funcional.

Estados principales:

- disponible
- reservado
- comprometido
- en tránsito
- invertido
- prestado
- por cobrar
- adeudado

No todo valor necesita etiqueta visible al usuario todo tiempo.
Pero motor sí debe operar con esta lógica.

### 5.6 Qué hace que insight sea bueno

Insight útil cumple cuatro condiciones:

1. Correcto
2. Contextual
3. Accionable
4. Explicable

Si falta una, no alcanza.

### 5.7 Frase que resume motor mental

**Doleth interpreta eventos como cambios de posición financiera a través del tiempo y los traduce en capacidad de decisión.**

Ese debe ser corazón de todo producto.

---

## 6. Pilares permanentes del producto

No son features.
Son dimensiones irreductibles que deben permanecer aunque cambie interfaz, IA o mercados.

### 6.1 Posición

Define dónde está parado usuario económicamente.

Incluye:

- recursos
- obligaciones
- derechos de cobro
- patrimonio neto

Sin posición no hay verdad base.

### 6.2 Liquidez

Define cuánto margen de maniobra real existe.

Liquidez es más importante que saldo y, en muchos momentos, más importante que patrimonio.
Es condición de supervivencia y de calma.

### 6.3 Flujo

Define cómo entra y sale valor en tiempo.

Flujo no es solo suma mensual.
Importan:

- estabilidad
- volatilidad
- ritmo
- sincronización con obligaciones

### 6.4 Compromisos

Define cuánta parte del futuro ya fue ocupada.

Este pilar debe ser central porque muchas personas no están quebradas por falta de ingreso, sino por exceso de futuro ya consumido.

### 6.5 Asignación de capital

Define dónde está colocado valor y con qué función.

Incluye:

- caja operativa
- reservas
- ahorro de protección
- inversión
- dinero ocioso

Sin este pilar, producto no distingue entre riqueza útil y riqueza mal ubicada.

### 6.6 Riesgo

Define fragilidad del sistema personal.

No solo riesgo de mercado.
También:

- dependencia de una fuente
- descalce entre monedas
- concentración
- iliquidez
- exceso de deuda
- incertidumbre de cobro

### 6.7 Trayectoria

Define si sistema mejora o empeora.

No alcanza con foto actual.
Hay que saber dirección.

Incluye:

- tendencia de liquidez
- tendencia de patrimonio
- evolución de presión financiera
- calidad de decisiones repetidas

### 6.8 Qué no es pilar

#### Objetivos

Son importantes, pero no deben ser pilar fundacional.
Razón:
verdad financiera debe existir incluso cuando usuario no definió objetivos.

#### Categorías

Pueden ayudar a explicar comportamiento.
No deben gobernar arquitectura.

#### Inversiones

Son subdominio dentro de asignación y riesgo.
Si se vuelven pilar autónomo demasiado pronto, producto puede sobredimensionar wealth management y perder foco en claridad integral.

### 6.9 Resumen

Pilares permanentes de Doleth:

- posición
- liquidez
- flujo
- compromisos
- asignación de capital
- riesgo
- trayectoria

Todo componente futuro debe reforzar al menos uno.

---

## 7. ¿Qué cosas nunca deberían formar parte del núcleo conceptual?

### 7.1 Categorías de gasto como verdad primaria

Sirven para descripción.
No sirven como fundamento del sistema.

### 7.2 Presupuestos rígidos mensuales como centro del producto

Pueden ser útiles en casos puntuales.
Pero si núcleo gira alrededor de presupuesto, Doleth se convierte en app de control y no en capa de verdad.

### 7.3 Carga manual intensiva como requisito de valor

Si usuario tiene que operar producto como contador, diseño conceptual falló.

### 7.4 Score único opaco

Una sola nota de “salud financiera” puede ser tentadora.
Pero si no es profundamente explicable, empobrece realidad compleja.

### 7.5 Gamificación superficial

Rachas, badges y premios de ahorro pueden aumentar engagement artificial, pero debilitan posicionamiento premium y trivializan problema real.

### 7.6 Educación financiera genérica como sustituto de inteligencia

Blog, tips y frases motivacionales no deben reemplazar diagnóstico personalizado.

### 7.7 Inversión como hero feature prematura

Muchos productos de finanzas terminan orbitando retornos de inversión porque es sexy.
Eso puede desviar producto de misión principal: claridad total del sistema personal.

### 7.8 Chat sin modelo

Interfaz conversacional sin cerebro conceptual sólido produce respuestas atractivas pero poco confiables.
Primero verdad.
Después conversación.

### 7.9 Contabilidad o impuestos como identidad central

Pueden aparecer como capas futuras.
No deben definir núcleo conceptual.

### 7.10 Marketplace de productos financieros como sesgo del motor

Si motor empieza a optimizar para vender tarjetas, créditos o inversiones afiliadas, deja de servir al usuario.

### 7.11 Comparación social

Compararte con promedios ajenos puede ser útil para marketing, pero no para verdad personal.
Núcleo debe ser individual y contextual.

---

## 8. Revisión crítica de constitución anterior

Documento anterior fijó dirección correcta.
Pero hay oportunidades para fortalecerlo.

### 8.1 Ajuste recomendado de misión

Misión previa:
transformar desorden financiero en claridad accionable.

Mejora propuesta:
**transformar complejidad financiera en capacidad de decisión confiable.**

Razón:
claridad es medio.
capacidad de decisión es fin.

### 8.2 Agregar principio explícito de tiempo

Constitución previa habla de compromisos y liquidez, pero tiempo todavía no aparece como eje fundacional suficientemente explícito.

Cambio recomendado:
incorporar principio:

**Toda verdad financiera depende de cuándo el dinero está disponible y cuándo será exigido.**

Razón:
sin tiempo, patrimonio y saldo engañan.

### 8.3 Agregar principio explícito de certeza

No todo valor vale igual.

Cambio recomendado:
incorporar principio:

**Doleth distingue entre valor disponible, valor probable y valor incierto.**

Razón:
un derecho de cobro informal no puede computar igual que dinero en cuenta.

### 8.4 Refinar visión de “asesor financiero personal”

Idea es poderosa, pero puede inducir a construir capa de recomendaciones antes de consolidar motor de verdad.

Cambio recomendado:
reordenar narrativa:

1. primero capa de verdad financiera
2. luego copiloto
3. finalmente asesor conversacional

Razón:
producto solo merece aconsejar cuando ya interpreta correctamente.

### 8.5 Corregir posible ambigüedad en “cuánto tengo”

Constitución usa mucho pregunta “cuánto tengo”.
Conviene dividirla.

Cambio recomendado:

- cuánto tengo de patrimonio
- cuánto tengo de liquidez
- cuánto tengo libre para decidir

Razón:
una sola cifra no alcanza.

### 8.6 Revisar analogía con Notion

Comparación con Notion sirve para transmitir ambición.
Pero puede sugerir producto demasiado flexible o configurable.

Mejora propuesta:
menos “workspace configurable”.
Más “motor de interpretación financiera radicalmente opinado”.

Razón:
Doleth no debe pedirle al usuario que diseñe su sistema.
Debe traer criterio.

### 8.7 Fortalecer principio de mezcla de esferas

Constitución reconoce mezcla personal-negocio, pero debería elevarla.

Cambio recomendado:
agregar principio:

**Toda métrica relevante debe poder leerse por esfera y en consolidado.**

Razón:
muchas decisiones malas nacen de ver solo agregado.

### 8.8 Agregar principio de mutación de estado

Hoy constitución habla de movimientos.
Conviene afinar.

Cambio recomendado:
agregar principio:

**No todo movimiento cambia riqueza; muchos cambian estado, plazo o riesgo.**

Razón:
este es uno de los diferenciales conceptuales más fuertes de Doleth.

### 8.9 Ajustar emoción buscada

Constitución habla de calma, lo cual es correcto.
Pero conviene evitar falsa suavidad.

Mejora propuesta:
**calma sin anestesia.**

Razón:
producto debe tranquilizar por claridad, no esconder tensión.

### 8.10 Oportunidad estratégica mayor

Constitución ya sugiere empezar por usuarios complejos.
Yo lo endurecería más.

Recomendación:
primer wedge debe ser:

**personas con economía personal compleja, ingresos variables y mezcla entre vida personal, operación e inversión.**

Razón:

- dolor intenso
- alta disposición a pagar
- menos competencia buena
- mejor entrenamiento para motor conceptual

Si Doleth resuelve caso difícil primero, luego puede simplificar hacia mercado masivo.
Camino inverso es más difícil.

---

## 9. Síntesis final

Arquitectura conceptual de Doleth no debe construirse alrededor de gastos.
Debe construirse alrededor de **posición financiera personal en tiempo real**.

Concepto madre:

**Doleth convierte eventos económicos dispersos en verdad financiera útil para decidir.**

Para hacerlo necesita:

- modelar posición, tiempo y certeza
- distinguir recursos, obligaciones, compromisos y derechos de cobro
- separar esferas financieras
- interpretar eventos como mutaciones de estado
- calcular liquidez libre, no solo saldos
- detectar presión, riesgo y trayectoria

Si esta arquitectura se mantiene, Doleth podrá evolucionar a:

- sistema de claridad financiera
- copiloto diario
- asesor conversacional confiable

Sin perder coherencia.

Si la abandona y vuelve a categorías, presupuestos o dashboards de transacciones, se convertirá en otra app más.
