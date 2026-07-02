# SCREEN DESIGN 001 — Dashboard

Estado: oficial  
Fecha: 2 de julio de 2026  
Pantalla: Inicio / Dashboard  
Depende de: Brand Foundation, `PRD-002`, `DOLETH PRODUCT BLUEPRINT`, `PRODUCT RESEARCH 001` y `UX-BLUEPRINT-001`  

## 0. Alcance

Este documento define contenido, jerarquía, estados y acciones del Dashboard de Doleth.

No define apariencia final, colores, componentes ni comportamiento técnico.

Dashboard debe poder comprenderse en diez segundos. No reemplaza Actividad, Posición, Agenda ni Reportes. Resume esos espacios y conduce al siguiente paso correcto.

---

## 1. Objetivo

### Propósito único

**Mostrar situación financiera actual, su cambio reciente y próxima atención necesaria en una sola lectura confiable.**

### 1.1 Preguntas obligatorias

Dashboard está completo solo si responde:

1. ¿Cómo estoy hoy?
2. ¿Cuánto dinero tengo realmente disponible?
3. ¿Qué requiere mi atención?
4. ¿Estoy mejor o peor que la semana pasada?
5. ¿Qué debería revisar ahora?

### 1.2 Lo que Dashboard no intenta hacer

- mostrar toda información disponible;
- reemplazar detalle de módulos;
- convertirse en reporte histórico;
- funcionar como presupuesto obligatorio;
- recomendar decisiones personales;
- premiar o castigar comportamiento;
- enseñar finanzas;
- presentar gráficos por decoración.

---

## 2. Información prioritaria

Orden cambia solo ante alerta material. Sin alerta, prioridad normal es siguiente.

| Prioridad | Información | Pregunta | Justificación |
|---|---|---|---|
| 1 | Dinero realmente disponible | ¿Cuánto puedo usar hoy? | Es cifra operativa más inmediata. Saldo total sin reservas ni obligaciones puede inducir error. |
| 2 | Atención crítica | ¿Hay algo que no puede esperar? | Vencimiento sin cobertura, deuda vencida o inconsistencia material debe interrumpir lectura normal. Si no existe, no ocupa espacio. |
| 3 | Próximos compromisos y cobertura | ¿Qué debo cubrir pronto? | Disponibilidad solo tiene sentido frente a pagos y cobros cercanos. |
| 4 | Cambio desde semana anterior | ¿Estoy mejor, peor o en situación mixta? | Usuario necesita dirección, no solo fotografía. Comparación semanal es suficientemente reciente sin reaccionar a ruido diario. |
| 5 | Información para revisar | ¿Qué dato reduce confianza en esta lectura? | Un número desactualizado o incompleto debe declararse antes de análisis secundario. |
| 6 | Flujo del mes | ¿Cómo viene el mes? | Explica ritmo actual mediante ingresos, gastos y diferencia. |
| 7 | Posición total | ¿Qué tengo, qué debo y cuánto queda? | Aporta contexto patrimonial sin confundirse con dinero utilizable. |
| 8 | Objetivos y reservas | ¿Qué parte de mi dinero ya tiene propósito? | Explica por qué saldo y disponibilidad pueden diferir. |
| 9 | Cambios que explican semana | ¿Qué produjo variación? | Evita que usuario tenga que reconstruir actividad. Solo muestra causas materiales. |
| 10 | Composición por dominio | ¿Dónde se concentra mi posición? | Útil para profundizar, pero no necesaria en lectura inicial. |
| 11 | Rendimiento de inversiones | ¿Cómo cambió cartera? | Relevante para quien invierte, pero nunca debe desplazar liquidez u obligaciones. |
| 12 | Distribución de gastos | ¿En qué gasté? | Pertenece principalmente a Flujo y Reportes. Dashboard solo la muestra si explica cambio material. |
| 13 | Actividad reciente | ¿Qué movimientos se registraron? | Pertenece a Actividad. Mostrar lista completa duplicaría otra pantalla. |
| 14 | Datos promocionales, educación o contenido | ¿Qué quiere mostrar producto? | No responde situación financiera. No debe ocupar Dashboard. |

### 2.1 Regla de excepción

Cuando existe alerta crítica, orden superior cambia:

1. alerta crítica;
2. dinero disponible;
3. compromiso relacionado;
4. acción para resolver;
5. resto de Dashboard.

Alerta no crítica permanece en “Revisar ahora” y no desplaza cifra principal.

---

## 3. Bloques del Dashboard

Dashboard tiene nueve bloques de lectura y un bloque de acción. Tres son condicionales: Atención crítica, Objetivos y reservas, y Revisar ahora.

## 3.1 Contexto de lectura

### Objetivo

Definir alcance de todas las cifras antes de interpretarlas.

### Información mostrada

- fecha y hora de última actualización relevante;
- moneda de lectura;
- ámbito incluido;
- indicador breve de cobertura: completa, parcial o pendiente de revisión.

### Acciones disponibles

- cambiar moneda de lectura;
- cambiar ámbito;
- abrir estado de información.

### Cuándo aparece

Siempre.

### Cuándo desaparece

Nunca. Puede reducirse a una línea, pero fecha, moneda y alcance deben seguir accesibles.

### Regla

No compite visualmente con cifras. Contextualiza.

## 3.2 Atención crítica

### Objetivo

Interrumpir lectura normal cuando existe riesgo inmediato o verdad materialmente dudosa.

### Información mostrada

Una sola alerta prioritaria con:

- hecho;
- fecha o urgencia;
- monto afectado;
- consecuencia concreta;
- acción disponible.

Ejemplos válidos:

- vencimiento dentro de 72 horas sin cobertura suficiente;
- tarjeta o deuda vencida;
- dinero disponible negativo;
- diferencia de saldo que cambia lectura materialmente;
- información central tan desactualizada que cifra principal deja de ser confiable.

### Acciones disponibles

- registrar pago;
- cubrir desde otra cuenta;
- actualizar saldo;
- revisar diferencia;
- abrir compromiso.

### Cuándo aparece

Solo ante situación material, urgente y accionable.

### Cuándo desaparece

Cuando se resuelve, deja de ser urgente o usuario confirma que ya no corresponde.

### Regla

Nunca apilar varias alertas críticas. Mostrar más urgente y resumir restantes como cantidad secundaria.

## 3.3 Hoy disponible

### Objetivo

Responder cuánto dinero puede utilizarse sin confundir saldo, reservas y compromisos.

### Información mostrada

- dinero disponible principal en moneda de lectura;
- dinero total líquido;
- dinero reservado;
- obligaciones próximas todavía no pagadas y no cubiertas por una reserva específica;
- aclaración de monedas incluidas;
- estado de actualización.

Fórmula visible en lenguaje humano:

```text
Dinero líquido
- dinero reservado
- obligaciones próximas no cubiertas por una reserva específica
= disponible hoy
```

Fórmula no necesita mostrarse completa siempre, pero debe abrirse desde cifra.

### Acciones disponibles

- ver cálculo;
- abrir cuentas;
- transferir dinero;
- registrar movimiento;
- actualizar saldo.

### Cuándo aparece

Desde primera cuenta con saldo confirmado.

### Cuándo desaparece

Nunca después de existir información monetaria. Si no hay dinero, muestra cero confirmado. Si faltan datos, muestra estado incompleto, no cifra inventada.

### Regla

Es cifra dominante en estado normal.

## 3.4 Próximos siete días

### Objetivo

Mostrar presión financiera inmediata y si está cubierta.

### Información mostrada

- total por pagar en próximos siete días;
- total por cobrar confirmado en mismo período;
- cobertura disponible;
- próximo vencimiento;
- hasta tres compromisos relevantes;
- existencia de obligaciones vencidas.

Puede extenderse a próximos treinta días bajo demanda. Dashboard conserva siete días como horizonte principal.

### Acciones disponibles

- abrir Agenda;
- registrar pago o cobro;
- marcar compromiso resuelto;
- revisar detalle;
- agregar compromiso faltante.

### Cuándo aparece

Cuando existe al menos un compromiso conocido, una deuda vencida o historial suficiente para mostrar “sin compromisos próximos” con confianza.

### Cuándo desaparece

Como bloque completo, cuando no existen compromisos y Agenda todavía no fue configurada. En ese caso Dashboard declara brevemente que próximos pagos aún no fueron cargados.

### Regla

Cobro esperado no se resta de obligación actual hasta realizarse. Se muestra separado.

## 3.5 Desde semana pasada

### Objetivo

Responder si situación mejoró, empeoró o cambió de forma mixta.

### Información mostrada

Tres comparaciones máximas:

- dinero disponible;
- deuda total;
- patrimonio neto.

Muestra diferencia absoluta y dirección. Añade una causa principal cuando puede rastrearse con claridad.

Resultado verbal permitido:

- **Mejor:** disponibilidad mejora, deuda no empeora materialmente y patrimonio se mantiene o crece.
- **Más ajustado:** disponibilidad cae o compromisos aumentan materialmente, aunque patrimonio no cambie.
- **Peor:** disponibilidad y patrimonio caen o deuda crece sin activo equivalente.
- **Mixto:** indicadores centrales se mueven en direcciones distintas.
- **Sin cambio material:** variaciones no alteran lectura práctica.

Ejemplo:

> Situación mixta: patrimonio subió, pero tenés menos dinero disponible que hace siete días.

### Acciones disponibles

- ver cambios;
- abrir operaciones principales;
- comparar fecha exacta;
- abrir detalle de posición.

### Cuándo aparece

Después de siete días de historia comparable. Durante segunda semana puede indicar que comparación todavía se está formando.

### Cuándo desaparece

Cuando no existe corte comparable confiable. No reemplazar con comparación inventada contra cero.

### Regla

No usa score, semáforo general ni porcentaje opaco.

## 3.6 Mes en curso

### Objetivo

Explicar ritmo financiero actual sin convertir Dashboard en presupuesto.

### Información mostrada

- ingresos realizados;
- gastos realizados;
- diferencia del mes;
- comparación con mismo tramo del mes anterior, si existe;
- próximo ingreso recurrente solo como dato separado y no realizado.

### Acciones disponibles

- registrar ingreso;
- registrar gasto;
- abrir Flujo;
- revisar operaciones del mes;
- cambiar período.

### Cuándo aparece

Después de primera operación de ingreso o gasto, o cuando existe saldo inicial y usuario decide registrar flujo desde fecha determinada.

### Cuándo desaparece

Antes de existir flujo. No muestra ceros que puedan interpretarse como mes completo.

### Regla

Transferencias, compras de inversión y pagos de capital no inflan ingreso o gasto.

## 3.7 Posición total

### Objetivo

Mostrar riqueza y obligaciones completas sin confundirlas con disponibilidad.

### Información mostrada

- activos totales;
- deudas totales;
- patrimonio neto;
- porción líquida;
- inversiones;
- patrimonio no líquido;
- fecha de valuación más antigua relevante.

### Acciones disponibles

- abrir Posición;
- abrir activos;
- abrir deudas;
- abrir inversiones;
- actualizar valuaciones.

### Cuándo aparece

Cuando existe al menos un activo o deuda además de cuentas líquidas, o cuando usuario solicita lectura patrimonial.

### Cuándo desaparece

Durante inicio con solo una cuenta y sin deuda. En ese estado repetiría saldo sin aportar contexto.

### Regla

Inversiones o propiedades pueden dominar monto, pero no jerarquía del Dashboard.

## 3.8 Objetivos y reservas

### Objetivo

Mostrar propósito asignado y progreso sin duplicar dinero.

### Información mostrada

- total reservado;
- objetivo prioritario;
- progreso;
- próximo aporte opcional;
- diferencia entre reservado y disponible.

### Acciones disponibles

- aportar;
- retirar;
- crear objetivo;
- abrir objetivos;
- cambiar prioridad.

### Cuándo aparece

Cuando existe objetivo o reserva activa.

### Cuándo desaparece

Cuando no existe ninguna reserva. Puede aparecer invitación breve después de que Dashboard ya entrega valor, nunca durante primer uso obligatorio.

### Regla

Dinero reservado sigue formando parte de saldo y patrimonio; solo deja de ser disponible.

## 3.9 Revisar ahora

### Objetivo

Concentrar tareas pequeñas necesarias para mantener confiabilidad.

### Información mostrada

Máximo tres pendientes, ordenados por impacto:

- cuenta desactualizada;
- diferencia de saldo;
- operación incompleta;
- tarjeta sin pago vinculado;
- inversión sin valor reciente;
- deuda con calendario incompleto;
- movimiento pendiente de confirmar.

Cada pendiente muestra motivo y efecto sobre lectura.

### Acciones disponibles

- resolver;
- confirmar;
- actualizar;
- descartar con motivo;
- ver todos.

### Cuándo aparece

Cuando existe al menos una tarea concreta.

### Cuándo desaparece

Cuando no quedan pendientes materiales. No debe mostrar bloque vacío permanente.

### Regla

No convierte mantenimiento en culpa. Mensaje describe estado, no juzga usuario.

## 3.10 Acciones rápidas

### Objetivo

Permitir operaciones frecuentes sin abandonar Dashboard.

### Información mostrada

Cinco acciones definidas en sección 8.

### Acciones disponibles

Las cinco acciones son contenido del bloque.

### Cuándo aparece

Siempre después de configuración financiera mínima.

### Cuándo desaparece

Durante primer paso de onboarding, antes de existir espacio financiero.

### Regla

Acciones son estables. No cambian de orden según promociones ni comportamiento comercial.

---

## 4. Jerarquía visual

Esta sección define atención, no apariencia.

## 4.1 Estado normal

### Primero

**Dinero disponible hoy.**

Usuario debe captar cifra y significado sin leer resto.

### Segundo

**Próximos siete días.**

Debe entender si disponibilidad alcanza para compromisos cercanos.

### Tercero

**Cambio desde semana pasada.**

Debe reconocer dirección y principal explicación.

### Cuarto

**Revisar ahora**, solo si existe pendiente.

### Quinto

**Mes en curso y posición total.**

Sirven para profundizar después de responder preguntas inmediatas.

## 4.2 Estado con alerta crítica

### Primero

Alerta crítica.

### Segundo

Dinero disponible y cobertura relacionada.

### Tercero

Acción para resolver.

Comparación semanal, mes y patrimonio bajan de prioridad temporalmente.

## 4.3 Primera zona de lectura mobile

Sin desplazamiento, usuario debe encontrar:

- contexto mínimo;
- alerta crítica, si existe;
- dinero disponible;
- cobertura de próximos siete días;
- acceso a Registrar.

Comparación semanal puede comenzar en zona siguiente, pero debe quedar próxima.

## 4.4 Elementos que nunca compiten por atención

- rendimiento diario de inversiones;
- categorías de gasto;
- objetivo secundario;
- patrimonio no líquido;
- actividad reciente;
- contenido educativo;
- configuración;
- promoción;
- indicador decorativo;
- gráfico sin acción asociada.

## 4.5 Estabilidad de jerarquía

Bloques no cambian de orden según contenido. Solo Atención crítica puede alterar prioridad.

Estabilidad permite que usuario aprenda dónde mirar y reduzca tiempo de lectura con uso repetido.

---

## 5. Estados del Dashboard

## 5.1 Usuario recién empieza

### Qué muestra

- bienvenida breve;
- moneda y ámbito elegidos;
- explicación de qué podrá responder Dashboard;
- progreso de carga inicial;
- acción principal: agregar primera cuenta;
- opción de comenzar con efectivo, banco o billetera.

### Qué no muestra

- dinero disponible en cero;
- patrimonio neto en cero;
- gráficos vacíos;
- alertas por información que todavía no se pidió;
- comparación semanal;
- reporte mensual.

### Resultado buscado

Usuario sabe qué cargar y por qué. Primer valor aparece después de primera cuenta, no después de completar vida financiera.

## 5.2 Usuario con pocos datos

### Qué muestra

- disponible calculado con información conocida;
- etiqueta de cobertura parcial;
- módulos todavía no incorporados;
- mes en curso si existe actividad;
- una acción sugerida para completar siguiente parte relevante.

### Comportamiento

Dashboard no presume ausencia de deuda, inversión o tarjeta. Declara “todavía no cargado” cuando corresponde.

## 5.3 Usuario con muchos datos

### Qué muestra

- agregados, no listas;
- máximo una cifra principal por bloque;
- hasta tres compromisos;
- hasta tres pendientes;
- una causa principal del cambio semanal;
- acceso a detalle por dominio.

### Comportamiento

Cantidad de datos aumenta profundidad disponible, no cantidad de bloques ni densidad inicial.

## 5.4 Cuentas vacías

### Qué muestra

- disponible confirmado en cero;
- compromisos próximos, si existen;
- deuda y patrimonio separados;
- aclaración de que cuenta vacía no significa vida financiera vacía;
- acción para registrar ingreso, transferencia o actualizar saldo.

### Qué evita

- mensaje catastrófico;
- confundir falta de liquidez con patrimonio nulo;
- ocultar obligaciones porque no hay saldo.

## 5.5 Muchas inversiones

### Qué muestra

- inversiones dentro de Posición total;
- valor consolidado y variación semanal secundaria;
- estado de valuaciones;
- porción líquida separada.

### Qué evita

- convertir Dashboard en portfolio tracker;
- subir inversiones por encima de disponibilidad;
- mostrar lista de instrumentos;
- tratar ganancia no realizada como ingreso.

## 5.6 Muchas deudas

### Qué muestra

- deuda total;
- pagos próximos;
- vencidos, si existen;
- cobertura;
- variación desde semana anterior;
- máximo tres obligaciones prioritarias.

### Qué evita

- pared de alertas rojas;
- repetir cada deuda;
- ocultar activos o dinero;
- reducir situación a mensaje negativo.

## 5.7 Todo en orden

### Qué muestra

- dinero disponible;
- próximos siete días cubiertos;
- comparación semanal;
- mes en curso;
- posición total;
- mensaje breve: “No hay nada urgente para revisar”.

### Qué desaparece

- Atención crítica;
- Revisar ahora;
- mensajes de felicitación exagerados;
- tareas inventadas para mantener interacción.

### Resultado buscado

Usuario puede cerrar Doleth en diez segundos con tranquilidad.

## 5.8 Existe alerta importante

### Qué muestra

- una alerta prioritaria al comienzo;
- impacto concreto;
- fecha;
- monto;
- acción directa;
- cantidad de alertas adicionales, si existen.

### Comportamiento

Resolver alerta actualiza Dashboard y devuelve jerarquía normal. Si usuario no puede resolverla, puede abrir detalle sin bloquear resto de información.

### Qué evita

- lenguaje alarmista;
- múltiples avisos compitiendo;
- color como única explicación;
- ocultar disponible y contexto;
- sugerir producto financiero como solución.

---

## 6. Qué no debe aparecer

1. Score financiero único.
2. Gráfico circular de categorías como protagonista.
3. Más de un gráfico visible por defecto.
4. Lista completa de transacciones.
5. Todas las cuentas con todos sus saldos.
6. Todos los instrumentos de inversión.
7. Todas las cuotas futuras.
8. Todas las categorías de gasto.
9. Presupuesto por categoría si usuario no lo activó.
10. Comparación social.
11. Frases de culpa o celebración infantil.
12. Recomendaciones de tarjetas, préstamos o inversiones.
13. Noticias financieras.
14. Cotizaciones que no afectan posiciones del usuario.
15. Contenido educativo genérico.
16. Promociones o referidos.
17. Configuración avanzada.
18. Datos ontológicos o estados internos.
19. Proyección presentada como saldo actual.
20. Patrimonio presentado como dinero utilizable.
21. Ganancia no realizada presentada como ingreso.
22. Pago de tarjeta presentado como segundo gasto.
23. Transferencia propia presentada como ingreso o egreso.
24. Alertas sin acción posible.
25. Bloques vacíos que existen solo para completar pantalla.

### 6.1 Política de gráficos

Dashboard no necesita gráficos para responder preguntas principales.

Puede usar una única visualización compacta cuando historia suficiente permita comprender tendencia mejor que texto. Nunca reemplaza cifra, dirección ni explicación.

Reportes contiene análisis gráfico profundo.

---

## 7. Frecuencia de actualización

| Bloque | Cada movimiento | Diariamente | Semanalmente | Mensualmente | Evento importante |
|---|---|---|---|---|---|
| Contexto de lectura | actualiza hora y cobertura | revisa antigüedad | — | — | cambia ámbito o moneda |
| Atención crítica | puede aparecer o resolverse | revisa vencimientos y antigüedad | — | — | aparece inmediatamente |
| Hoy disponible | recalcula | revisa compromisos que entran en horizonte | — | — | cambia saldo, reserva o cobertura |
| Próximos siete días | actualiza pagos y cobros | desplaza horizonte | resume presión | reinicia períodos asociados | nuevo vencimiento, pago o mora |
| Desde semana pasada | recalcula diferencia | actualiza lectura | fija nuevo punto comparable | conserva cortes | cambio material agrega explicación |
| Mes en curso | recalcula | actualiza día comparable | resume ritmo | cierra período y comienza nuevo | ingreso o gasto material |
| Posición total | recalcula hechos | actualiza valuaciones disponibles | compara | conserva corte | alta, venta, deuda o revaluación material |
| Objetivos y reservas | recalcula aportes y retiros | revisa fecha objetivo | actualiza ritmo | resume avance | objetivo creado, completado o cancelado |
| Revisar ahora | agrega o resuelve pendiente | evalúa desactualización | agrupa persistentes | participa en cierre | inconsistencia detectada |
| Acciones rápidas | — | — | — | — | no cambia salvo contexto de onboarding |

### 7.1 Regla temporal

Frecuencia de cálculo no obliga cambio visual. Dashboard solo cambia énfasis cuando diferencia es material o requiere acción.

### 7.2 Datos con distinta antigüedad

Si cuentas están actualizadas hoy e inversiones hace cinco días:

- disponible puede mostrarse como actual;
- patrimonio declara valuación parcial o fecha más antigua;
- no se degrada toda pantalla al nivel del dato menos actualizado;
- bloque afectado indica limitación local.

---

## 8. Acciones principales

Cinco acciones disponibles sin navegar a otro destino:

## 8.1 Registrar movimiento

Abre flujo universal para ingreso, gasto, transferencia, compra con tarjeta u otro hecho.

Razón: acción más frecuente.

## 8.2 Transferir dinero

Permite mover valor entre cuentas propias sin registrarlo como ingreso o gasto.

Razón: operación frecuente y conceptualmente sensible.

## 8.3 Registrar pago

Permite elegir tarjeta, deuda o compromiso pendiente y registrar origen del dinero.

Razón: conecta atención con resolución.

## 8.4 Actualizar valor

Permite actualizar saldo de cuenta o valuación de inversión/activo mediante flujo contextual.

Razón: mantiene confiabilidad de panorama manual.

## 8.5 Revisar pendientes

Abre primera tarea material o cola completa cuando existen varias.

Razón: usuario puede restaurar confianza sin buscar problema.

### 8.6 Regla de disponibilidad

Si no existe pendiente, quinta acción cambia a **Revisión mensual** cuando hay mes cerrable. Si tampoco corresponde, permanece “Revisar” y muestra que información está al día.

---

## 9. Criterios de éxito

## 9.1 Prueba de diez segundos

Después de mirar Dashboard durante diez segundos, usuario puede responder correctamente:

- dinero disponible;
- próxima obligación relevante;
- dirección semanal;
- existencia de alerta;
- siguiente revisión necesaria.

## 9.2 Comprensión correcta

Usuario distingue:

- saldo total de disponible;
- disponible de patrimonio;
- gasto de transferencia;
- deuda de pago;
- realizado de esperado;
- cifra confirmada de estimada.

## 9.3 Confianza

Usuario puede identificar:

- fecha de información;
- ámbito incluido;
- moneda de lectura;
- datos pendientes;
- origen de cifra importante.

## 9.4 Acción

- alerta importante ofrece resolución directa;
- cifra abre explicación;
- usuario puede registrar hecho sin abandonar contexto;
- pendiente puede resolverse sin recorrer módulos;
- acción guardada refleja cambio inmediatamente en bloque correspondiente.

## 9.5 Carga cognitiva

- una cifra domina estado normal;
- una alerta domina estado urgente;
- máximo tres pendientes visibles;
- máximo tres compromisos visibles;
- máximo tres comparaciones semanales;
- bloques secundarios no compiten con respuesta principal;
- cantidad de datos no aumenta cantidad de bloques.

## 9.6 Honestidad

- información incompleta se declara;
- cero confirmado no se confunde con dato faltante;
- proyección no se presenta como realidad;
- comparación no aparece sin base suficiente;
- patrimonio no promete liquidez;
- cobro esperado no cubre obligación hasta realizarse.

## 9.7 Utilidad en calma

Cuando todo está en orden, Dashboard sigue siendo útil y puede cerrarse rápido. No inventa alertas, contenido o tareas para aumentar permanencia.

## 9.8 Consistencia longitudinal

Misma persona debe encontrar misma jerarquía durante primer mes y después de un año. Producto gana profundidad, no desorden.

---

## 10. Blueprint textual

## 10.1 Dashboard completo de arriba hacia abajo

### 1. Contexto

Usuario encuentra fecha de actualización, moneda de lectura, ámbito y cobertura de datos.

No es titular. Es marco para confiar en lo que sigue.

### 2. Atención crítica, si existe

Una sola situación urgente aparece con monto, fecha, consecuencia y acción.

Si no existe, espacio no aparece.

### 3. Hoy disponible

Usuario encuentra cifra principal: dinero realmente disponible.

Debajo entiende relación con dinero líquido, reservas y obligaciones inmediatas. Puede abrir cálculo, registrar o transferir.

### 4. Próximos siete días

Usuario ve qué debe pagar, qué espera cobrar y si existe cobertura.

Solo aparecen compromisos relevantes. Resto vive en Agenda.

### 5. Acciones rápidas

Usuario puede registrar movimiento, transferir, pagar, actualizar valor o revisar pendientes.

### 6. Desde semana pasada

Usuario ve si disponibilidad, deuda y patrimonio mejoraron, empeoraron o se movieron de forma mixta.

Una frase explica causa principal cuando evidencia alcanza.

### 7. Revisar ahora, si existe

Usuario encuentra hasta tres tareas necesarias para confiar en panorama.

Si todo está actualizado, bloque desaparece y mensaje breve confirma ausencia de urgencias.

### 8. Mes en curso

Usuario ve ingresos, gastos y diferencia realizados. Comparación aparece solo con período equivalente confiable.

### 9. Posición total

Usuario ve activos, deudas y patrimonio neto, con separación entre líquido, invertido y no líquido.

### 10. Objetivos y reservas, si existen

Usuario ve dinero asignado y objetivo prioritario. Puede aportar, retirar o profundizar.

### 11. Final de lectura

No hay feed, noticias, promociones ni gráfico adicional. Usuario llegó desde urgencia hacia contexto completo y puede cerrar aplicación.

## 10.2 Primera apertura

Usuario abre Doleth por primera vez.

Encuentra promesa breve: construir primera fotografía financiera. Dashboard todavía no muestra números falsos ni tarjetas vacías.

Ve moneda y ámbito elegidos. Debajo encuentra progreso de carga inicial y una sola acción: agregar primera cuenta.

Después de agregarla, Dashboard cambia inmediatamente:

- aparece dinero líquido conocido;
- aparece disponible con etiqueta “posición parcial”;
- explica qué falta cargar para completar lectura;
- ofrece registrar primer movimiento;
- no presume que deudas, inversiones o tarjetas son cero.

Cada nuevo dominio completa misma pantalla. No agrega nuevo dashboard.

## 10.3 Después de un año

Usuario abre Doleth con historia consolidada.

Primero ve fecha, moneda y alcance.

Si existe urgencia, aparece una sola alerta. Si no, mirada cae directo sobre dinero disponible.

Después ve compromisos de próximos siete días y cobertura. Puede pagar desde mismo lugar.

Comparación semanal indica dirección sin score. Si patrimonio creció pero liquidez cayó, Dashboard dice “situación mixta” y explica causa.

Pendientes aparecen solo si afectan confianza. Mes en curso muestra ritmo real. Posición total reúne cuentas, inversiones, activos y deudas sin presentar riqueza ilíquida como dinero utilizable.

Objetivo prioritario aparece si existe. Inversiones numerosas quedan resumidas. Deudas numerosas quedan priorizadas por urgencia. Actividad detallada permanece fuera.

Cuando todo está en orden, usuario lee:

- cuánto puede usar;
- qué debe cubrir;
- cómo cambió;
- cómo viene mes;
- cuánto tiene y debe;
- que no hay nada urgente.

Puede cerrar Doleth en diez segundos con respuesta buscada:

**Ahora sé exactamente dónde estoy parado.**

---

## 11. Decisión oficial

Dashboard de Doleth no es colección de métricas.

Es secuencia estable:

```text
Urgencia, si existe
-> disponibilidad
-> próximos compromisos
-> cambio semanal
-> revisión necesaria
-> flujo mensual
-> posición total
-> objetivos
```

Esta especificación gobierna futuros wireframes, prototipos y decisiones visuales del Dashboard.
