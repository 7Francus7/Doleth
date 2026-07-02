# PRD-002 — Doleth como Aplicación de Vida Financiera

Estado: oficial
Fecha: 2 de julio de 2026

Este documento corrige foco del producto.

La especificación conceptual de Doleth se conserva como fundamento.
Pero deja de gobernar diseño de producto toda lectura que empuje a Doleth hacia:

- asistente
- chatbot
- copiloto conversacional
- sistema que decide por usuario

Doleth pasa a diseñarse como:

**aplicación para administrar, entender y ordenar toda la vida financiera de una persona desde un solo lugar.**

Promesa central:

**cuando cierro Doleth, sé exactamente dónde estoy parado.**

---

## 1. Visión correcta del producto después de este cambio

Doleth debe convertirse en sistema personal de administración financiera integral.

No es interfaz para hablar con finanzas.
Es lugar donde vive la realidad financiera completa del usuario.

Su visión correcta no es:

- conversar mejor
- inferir más
- parecer inteligente

Su visión correcta es:

- centralizar información financiera dispersa
- organizarla con criterio consistente
- mostrar situación real con claridad extrema
- permitir administrar toda la vida financiera sin depender de múltiples herramientas

Definición de producto:

**Doleth es la aplicación donde una persona ve, ordena, sigue y administra dinero, obligaciones, activos, patrimonio y objetivos en una sola verdad coherente.**

---

## 2. Verdadero problema que resuelve

Problema real:

la persona no tiene un lugar único, confiable y comprensible para administrar toda su vida financiera.

Su realidad está rota entre:

- bancos
- efectivo
- billeteras
- tarjetas
- cuotas
- deudas
- inversiones
- patrimonio
- metas
- recuerdos mentales

Entonces sufre tres fracturas:

1. **fragmentación**
   información distribuida en demasiados lugares

2. **desorden operativo**
   cuesta registrar, seguir y actualizar todo sin perder contexto

3. **falta de lectura global**
   incluso con datos disponibles, no logra entender posición completa

Problema final:

**no puede administrar toda su vida financiera con una sola mirada confiable.**

---

## 3. Grandes módulos funcionales

Doleth debe organizarse en ocho módulos grandes.

### 3.1 Dinero y cuentas

Todo lo líquido y semilíquido que usuario controla directamente.

### 3.2 Ingresos y egresos

Todo lo que entra y sale como flujo operativo de la vida financiera.

### 3.3 Tarjetas y cuotas

Todo el consumo financiado, límites, cierres, vencimientos y pagos.

### 3.4 Deudas y préstamos

Toda obligación financiera formal o informal.

### 3.5 Inversiones y reservas de valor

Todos los activos financieros, cobertura monetaria y posiciones de inversión.

### 3.6 Patrimonio

Todos los activos no líquidos relevantes para lectura patrimonial total.

### 3.7 Objetivos y reservas

Todo dinero separado con propósito explícito y toda meta de ahorro.

### 3.8 Reportes y panorama

La capa de síntesis que convierte todo lo anterior en lectura comprensible.

---

## 4. Responsabilidades de cada módulo

### 4.1 Dinero y cuentas

Responsabilidades:

- mostrar dónde está el dinero
- separar saldos por soporte y moneda
- consolidar liquidez total
- distinguir disponibilidad real de dinero inmovilizado o reservado

### 4.2 Ingresos y egresos

Responsabilidades:

- registrar entradas y salidas
- ordenar flujo por tipo y recurrencia
- mostrar ritmo mensual
- conectar flujo con situación real, no solo con archivo histórico

### 4.3 Tarjetas y cuotas

Responsabilidades:

- seguir consumos
- mostrar cierre y vencimiento
- proyectar carga futura por cuotas
- permitir entender cuánto gasto actual ya pertenece a meses siguientes

### 4.4 Deudas y préstamos

Responsabilidades:

- registrar deudas bancarias y personales
- mostrar saldo pendiente
- mostrar calendario de pagos
- distinguir deuda formal, informal y préstamos entre personas

### 4.5 Inversiones y reservas de valor

Responsabilidades:

- registrar posiciones
- consolidar valor invertido por tipo
- mostrar composición de activos
- separar inversión, cobertura y liquidez

### 4.6 Patrimonio

Responsabilidades:

- registrar activos físicos y patrimoniales
- consolidar riqueza no líquida
- mostrar relación entre patrimonio y liquidez
- evitar que patrimonio infle falsa sensación de disponibilidad

### 4.7 Objetivos y reservas

Responsabilidades:

- registrar metas de ahorro
- separar dinero asignado de dinero libre
- mostrar avance
- conectar objetivos con capacidad real de sostenerlos

### 4.8 Reportes y panorama

Responsabilidades:

- mostrar posición completa
- mostrar evolución del patrimonio
- mostrar evolución del ahorro
- mostrar flujo mensual
- mostrar composición de activos y deudas
- convertir módulos en una sola lectura

---

## 5. Cómo se relacionan entre sí

Los módulos no deben ser silos.
Deben formar una sola realidad.

### Relación central

`Dinero y cuentas` es base operativa.

Desde ahí se conectan:

- ingresos y egresos, porque alteran caja y flujo
- tarjetas y deudas, porque consumen caja presente o futura
- inversiones, porque convierten liquidez en exposición o reserva
- patrimonio, porque da contexto de riqueza pero no reemplaza liquidez
- objetivos, porque apartan parte de la disponibilidad
- reportes, porque consolidan todo

### Reglas de relación

- una entrada puede impactar dinero, flujo y objetivo
- un pago de tarjeta impacta dinero, deuda y panorama
- una compra de inversión impacta dinero, inversiones y reportes
- una reserva para objetivo impacta dinero libre y objetivos
- un activo patrimonial impacta patrimonio y composición total, no liquidez diaria

### Lectura correcta

Usuario no debe sentir “módulos separados”.
Debe sentir que cada módulo ilumina una parte distinta de la misma vida financiera.

---

## 6. Qué información pertenece a cada módulo

### 6.1 Dinero y cuentas

- efectivo
- cuentas bancarias
- billeteras virtuales
- cajas de ahorro
- moneda de cada saldo
- saldo actual
- saldo disponible

### 6.2 Ingresos y egresos

- sueldos
- cobros de clientes
- ventas
- ingresos extraordinarios
- gastos fijos
- gastos variables
- suscripciones
- recurrencias

### 6.3 Tarjetas y cuotas

- tarjetas
- consumos
- cuotas activas
- cierres
- vencimientos
- límites
- pagos realizados

### 6.4 Deudas y préstamos

- préstamos bancarios
- préstamos personales
- deuda informal
- monto original
- saldo pendiente
- condiciones de pago
- fechas

### 6.5 Inversiones y reservas de valor

- dólares
- criptomonedas
- acciones
- CEDEARs
- ETFs
- bonos
- fondos
- plazo fijo
- valor actual
- composición

### 6.6 Patrimonio

- propiedades
- vehículos
- equipos
- otros activos relevantes
- valuación
- observaciones patrimoniales

### 6.7 Objetivos y reservas

- nombre del objetivo
- monto objetivo
- monto acumulado
- dinero separado
- fecha deseada
- prioridad

### 6.8 Reportes y panorama

- patrimonio neto
- liquidez total
- ahorro acumulado
- flujo mensual
- composición de activos
- composición de deudas
- evolución temporal

---

## 7. Qué debería poder hacer un usuario dentro de cada módulo

### 7.1 Dinero y cuentas

Usuario debería poder:

- registrar cuentas y saldos
- actualizar montos
- ver consolidado por moneda
- entender cuánto tiene realmente disponible

### 7.2 Ingresos y egresos

Usuario debería poder:

- registrar ingresos y gastos
- distinguir recurrentes y extraordinarios
- revisar flujo del período
- entender en qué se le va y de dónde le entra

### 7.3 Tarjetas y cuotas

Usuario debería poder:

- cargar consumos
- ver cuánto debe del período
- seguir cuotas activas
- anticipar presión futura
- registrar pagos

### 7.4 Deudas y préstamos

Usuario debería poder:

- cargar deudas
- ver saldo pendiente
- registrar pagos parciales o totales
- diferenciar deuda formal e informal
- entender peso total de sus obligaciones

### 7.5 Inversiones y reservas de valor

Usuario debería poder:

- registrar activos
- ver composición de inversiones
- distinguir liquidez de exposición
- seguir valor de su cobertura y su cartera

### 7.6 Patrimonio

Usuario debería poder:

- registrar activos patrimoniales
- actualizarlos
- ver patrimonio ampliado
- entender diferencia entre riqueza total y caja disponible

### 7.7 Objetivos y reservas

Usuario debería poder:

- crear metas
- separar dinero
- seguir avance
- ver cuánto de su dinero ya no está libre porque tiene propósito

### 7.8 Reportes y panorama

Usuario debería poder:

- ver posición global
- entender evolución en el tiempo
- comparar meses
- ver composición de activos y deudas
- cerrar sesión con una lectura completa

---

## 8. Recorrido natural de una persona durante meses o años

### Etapa 1 — Centralización

Usuario empieza trayendo su realidad dispersa a un solo lugar:

- cuentas
- caja
- tarjetas
- deudas
- inversiones

Primer valor:
deja de depender de memoria y apps fragmentadas.

### Etapa 2 — Orden operativo

Empieza a registrar ingresos, gastos, cuotas, pagos y movimientos relevantes.

Segundo valor:
Doleth deja de ser foto estática y se vuelve sistema vivo.

### Etapa 3 — Claridad recurrente

Usuario ya no entra solo para cargar cosas.
Entra para entender:

- cómo está hoy
- cómo viene el mes
- qué lo está apretando

Tercer valor:
desaparece parte del caos mental.

### Etapa 4 — Administración integral

Usuario ya usa Doleth para:

- seguir caja
- controlar deuda
- mirar patrimonio
- organizar objetivos
- revisar evolución

Cuarto valor:
toda su vida financiera empieza a leerse como sistema único.

### Etapa 5 — Madurez

Después de meses o años, Doleth se vuelve archivo vivo de su realidad financiera.

Valor maduro:

usuario no solo sabe cómo está hoy.
Puede ver cómo construyó o degradó su situación a lo largo del tiempo.

---

## 9. Funcionalidades imprescindibles para un MVP

MVP debe ser más amplio que PRD-001, pero seguir siendo disciplinado.

### Imprescindibles

1. consolidación de dinero y cuentas
2. registro de ingresos y gastos
3. soporte básico de múltiples monedas
4. seguimiento de tarjetas, cierres, vencimientos y pagos
5. seguimiento básico de deudas
6. registro simple de inversiones principales
7. separación de dinero libre vs dinero reservado
8. objetivos básicos de ahorro
9. panorama general con:
   - liquidez
   - obligaciones próximas
   - ahorro
   - composición básica de activos y deudas
10. reportes esenciales:
   - flujo mensual
   - patrimonio
   - evolución del ahorro

### Razón

Si MVP no cubre al menos dinero, flujo, tarjetas, deudas y panorama consolidado, no puede reclamar ser lugar único de administración financiera.

---

## 10. Funcionalidades que deben esperar a versiones futuras

### 10.1 Automatizaciones avanzadas

Deben esperar.

Razón:
primero producto debe demostrar estructura correcta.

### 10.2 Colaboración multiusuario

Debe esperar.

Razón:
primero consolidar vida financiera individual.

### 10.3 Simuladores avanzados

Deben esperar.

Razón:
valor inicial nace de claridad y administración, no de escenarios complejos.

### 10.4 Planeamiento patrimonial sofisticado

Debe esperar.

Razón:
primero resolver administración cotidiana completa.

### 10.5 Integraciones con terceros como núcleo

Deben esperar.

Razón:
no deben reemplazar diseño correcto del sistema.

### 10.6 Inteligencia predictiva avanzada

Debe esperar.

Razón:
producto no debe depender de adivinación para generar valor.

### 10.7 Recomendaciones profundas

Deben esperar.

Razón:
usuario quiere información correcta y control.
No delegación.

---

## 11. Cómo mantener simplicidad mientras el producto crece

### 11.1 Un solo panorama maestro

Aunque haya muchos módulos, debe existir una sola lectura global.

### 11.2 Jerarquía dura

Primero:

- liquidez
- obligaciones
- panorama

Después:

- detalle
- historia
- composición

### 11.3 Módulos profundos, experiencia simple

Cada módulo puede tener riqueza interna.
Pero usuario no debe sentir diez productos pegados.

### 11.4 No mostrar todo junto

Complejidad debe revelarse por contexto.
No por default.

### 11.5 Una sola verdad por concepto

No puede haber:

- una cifra de patrimonio acá y otra allá sin explicación
- un saldo utilizable distinto según módulo

### 11.6 Separar administración de análisis

Registrar y mantener orden no es lo mismo que analizar.
Producto debe distinguir esos momentos.

### 11.7 Crecer por capas

Primero:

- dinero
- flujo
- obligaciones

Luego:

- inversiones
- patrimonio
- objetivos
- reportes más sofisticados

---

## 12. Crítica del enfoque anterior

### 12.1 Qué sigue siendo útil

Siguen siendo extremadamente útiles:

- Brand Foundation, porque fija promesa de claridad real
- Constitución, porque define que Doleth no es app de gastos
- Arquitectura Conceptual, porque separa posición, tiempo y certeza
- Ontología, porque evita modelar todo como transacción simple
- Estados del Valor, porque protege diferencia entre libre, comprometido y expuesto

También siguen siendo útiles:

- parte de RFC-001, porque corpus sirve para validar modelo
- parte de UX-001 y UX-002, porque claridad, carga cognitiva y mundo visible siguen siendo correctos

### 12.2 Qué debe dejar de influir en el diseño del producto

Debe dejar de influir como centro:

- cualquier lectura de Doleth como asistente
- cualquier lectura de Doleth como conversación principal
- cualquier lectura de Doleth como producto donde IA “piensa por usuario”
- cualquier énfasis excesivo en preguntas, hipótesis o diálogo como identidad del producto

### 12.3 Crítica principal

Enfoque anterior acertó en profundidad conceptual, pero se desvió al acercarse demasiado a:

- sistema conversacional
- copiloto
- asesor

Eso era peligroso por tres razones:

1. desplazaba centro desde administración hacia interacción
2. podía hacer que claridad dependiera de conversación y no de estructura visible
3. elevaba complejidad de producto antes de consolidar base administrativa

### 12.4 Corrección correcta

La corrección no es tirar teoría.
Es usar teoría como motor invisible de un producto mucho más concreto:

**una aplicación completa para administrar la vida financiera de una persona.**

### 12.5 Nueva disciplina

Hacia adelante, toda decisión de producto debe pasar este filtro:

**¿esto ayuda a que una persona administre toda su vida financiera desde Doleth y entienda exactamente dónde está parada?**

Si no ayuda, no pertenece al producto.

---

## Cierre

Doleth debe dejar de diseñarse como sistema que conversa sobre realidad financiera.

Debe diseñarse como sistema donde esa realidad vive, se ordena y se vuelve legible.

Éxito final:

**una persona puede entender y administrar toda su vida financiera desde Doleth sin necesitar otras aplicaciones.**
