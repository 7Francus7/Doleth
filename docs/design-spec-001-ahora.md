# DESIGN SPEC 001 — Ahora

Estado: oficial  
Fecha: 2 de julio de 2026  
Pantalla: Ahora  
Pregunta madre: **¿Cómo estoy financieramente en este momento?**  
Autoridad: especificación funcional oficial de pantalla Ahora  

## 0. Relación con documentos anteriores

Este documento aplica navegación congelada de `UX-004`.

Para alcance de pantalla inicial, reemplaza `SCREEN DESIGN 001 — Dashboard` como autoridad funcional. Documento anterior permanece como antecedente.

Ahora muestra presente.

- detalle futuro pertenece a `Próximo`;
- explicación histórica pertenece a `Cambios`;
- trayectoria y objetivos pertenecen a `Progreso`;
- administración profunda pertenece a `Mi realidad`;
- operaciones se ejecutan mediante `Actuar`;
- toda conclusión importante abre `Evidencia`.

---

## 1. Objetivo único

**Mostrar posición financiera utilizable, urgencia actual y confiabilidad de esa lectura en menos de diez segundos.**

Ahora no intenta contar historia completa ni anticipar todo futuro. Responde qué es verdad y relevante en momento actual.

---

## 2. Información que debe aparecer

## 2.1 Orden de prioridad

| Prioridad | Información | Pregunta que responde | Justificación |
|---|---|---|---|
| 1 | Atención crítica actual | ¿Existe algo que debo resolver ahora? | Riesgo inmediato debe interrumpir lectura normal. Si no existe, no ocupa espacio. |
| 2 | Dinero realmente disponible | ¿Cuánto puedo usar hoy? | Es respuesta operativa principal. Saldo total sin reservas ni obligaciones puede engañar. |
| 3 | Cobertura inmediata | ¿Lo próximo está cubierto? | Disponible solo tiene sentido frente a obligaciones cercanas ya conocidas. |
| 4 | Estado actual resumido | ¿Cómo estoy, en una frase? | Une disponibilidad, presión y cobertura sin usar score. |
| 5 | Posición financiera actual | ¿Qué tengo y qué debo ahora? | Da contexto patrimonial sin confundir riqueza con liquidez. |
| 6 | Dinero reservado | ¿Por qué saldo y disponible son distintos? | Explica parte principal de diferencia sin obligar a abrir objetivos. |
| 7 | Confiabilidad de información | ¿Puedo confiar en estas cifras? | Fecha, cobertura y pendientes determinan valor real de respuesta. |
| 8 | Tarea de revisión más importante | ¿Qué debería verificar ahora? | Mantiene posición actualizada sin mostrar cola completa. |
| 9 | Acceso a evidencia | ¿De dónde sale esta respuesta? | Toda conclusión debe poder comprobarse. No compite visualmente con respuesta. |

## 2.2 Atención crítica actual

Tiene prioridad máxima solo cuando existe.

Casos válidos:

- obligación vencida;
- pago dentro de 72 horas sin cobertura suficiente;
- dinero disponible negativo;
- cuenta principal con diferencia material;
- deuda o tarjeta con estado incierto que cambia lectura actual;
- información central demasiado desactualizada para sostener respuesta.

No son atención crítica:

- categoría sin asignar;
- cotización diaria menor;
- gasto superior a promedio sin consecuencia inmediata;
- objetivo atrasado;
- cuenta secundaria sin movimiento;
- sugerencia general.

## 2.3 Dinero realmente disponible

Debe distinguir:

- dinero líquido total;
- dinero reservado;
- obligaciones inmediatas no cubiertas por reserva específica;
- dinero disponible.

Relación funcional:

```text
Dinero líquido confirmado
- dinero reservado
- obligaciones inmediatas no cubiertas
= dinero disponible ahora
```

Cobros esperados no aumentan disponible hasta realizarse.

Activos no líquidos e inversiones no forman dinero disponible salvo parte explícitamente líquida y utilizable.

## 2.4 Cobertura inmediata

Ahora no muestra agenda completa.

Solo resume:

- monto por cubrir en próximos siete días;
- monto ya cubierto;
- faltante, si existe;
- obligación más cercana;
- acceso a `Próximo`.

Horizonte de siete días evita mezclar presente con planificación mensual. Si obligación vence hoy, pertenece también a atención actual.

## 2.5 Estado actual resumido

Una frase factual interpreta situación sin decidir por usuario.

Formas permitidas:

- “Tenés disponibilidad y próximos siete días están cubiertos.”
- “Tenés disponibilidad, pero falta cubrir un vencimiento cercano.”
- “Tu patrimonio es positivo, pero liquidez actual es baja.”
- “No hay urgencias, aunque parte de información necesita actualización.”
- “No podemos confirmar disponibilidad hasta revisar saldo principal.”

Formas prohibidas:

- “Estás bien.”
- “Tu salud financiera es excelente.”
- “Podés gastar sin preocuparte.”
- “Deberías invertir.”
- “Vas por buen camino.”

Motivo: valoración general oculta dimensiones distintas y puede sustituir decisión personal.

## 2.6 Posición financiera actual

Resumen máximo:

- activos;
- deudas;
- patrimonio neto;
- porción líquida;
- porción invertida o no líquida.

No muestra lista de cuentas, instrumentos o préstamos. Profundidad vive en `Mi realidad`.

## 2.7 Confiabilidad

Debe declarar:

- fecha y hora de actualización;
- moneda de lectura;
- ámbito incluido;
- cobertura completa o parcial;
- dato material pendiente;
- valuación desactualizada relevante.

Cada limitación afecta bloque correspondiente. Inversión desactualizada no invalida saldo bancario confirmado.

---

## 3. Información que no debe aparecer

## 3.1 Historia y comparación

No mostrar:

- comparación semanal;
- movimientos recientes;
- explicación de cambios;
- evolución mensual;
- historial de saldos;
- cierre del período.

Justificación: pertenece a `Cambios`. Ahora puede enlazar evidencia, pero no convertirse en historial.

## 3.2 Trayectoria y objetivos

No mostrar:

- progreso de objetivos;
- evolución de ahorro;
- tendencia patrimonial;
- reducción histórica de deuda;
- rendimiento acumulado;
- proyecciones.

Justificación: pertenece a `Progreso`. Ahora solo muestra dinero reservado cuando afecta disponibilidad.

## 3.3 Agenda detallada

No mostrar:

- calendario completo;
- todas las cuotas;
- todos los vencimientos;
- todos los cobros esperados;
- obligaciones del mes completo.

Justificación: pertenece a `Próximo`. Ahora conserva resumen inmediato de cobertura.

## 3.4 Administración por módulos

No mostrar:

- listado de cuentas;
- listado de tarjetas;
- listado de deudas;
- cartera por instrumento;
- inventario patrimonial;
- listado de objetivos.

Justificación: pertenece a `Mi realidad`. Ahora muestra síntesis transversal.

## 3.5 Elementos que nunca pertenecen

1. Score financiero.
2. Gráfico circular de categorías.
3. Presupuesto por categoría.
4. Feed de movimientos.
5. Noticias financieras.
6. Cotizaciones sin posición asociada.
7. Contenido educativo.
8. Promociones.
9. Recomendaciones de productos.
10. Comparación social.
11. Mensajes de culpa.
12. Celebraciones infantiles.
13. Alertas sin acción.
14. Configuración avanzada.
15. Estados internos del sistema.
16. Cifras estimadas presentadas como confirmadas.
17. Patrimonio presentado como dinero disponible.
18. Ganancias no realizadas presentadas como ingreso.

---

## 4. Acciones sin abandonar Ahora

Acciones se ejecutan mediante `Actuar`. Al finalizar, usuario vuelve a Ahora y ve resultado actualizado.

## 4.1 Registrar un hecho

Permite registrar:

- ingreso;
- gasto;
- transferencia;
- compra con tarjeta;
- cobro;
- otro hecho relevante.

Ahora no se reemplaza por módulo. Acción toma contexto y devuelve resultado.

## 4.2 Resolver atención actual

Según caso:

- registrar pago;
- confirmar cobro;
- cubrir obligación desde cuenta;
- actualizar saldo;
- corregir diferencia;
- completar dato faltante.

Solo aparece si existe atención concreta.

## 4.3 Mover dinero

Permite transferencia entre cuentas propias. Resultado actualiza disponible y ubicación sin crear ingreso o gasto.

## 4.4 Actualizar información

Permite:

- actualizar saldo;
- actualizar valuación;
- confirmar obligación;
- revisar fecha de dato.

## 4.5 Ver evidencia

Permite abrir cálculo de:

- disponible;
- cobertura;
- activos;
- deudas;
- patrimonio;
- confiabilidad.

Evidencia no abandona pregunta. Explica respuesta y permite llegar a objeto si usuario necesita administrar.

## 4.6 Límite: cuándo cambia de territorio

Ahora puede conducir a:

- `Próximo` para agenda completa;
- `Cambios` para explicación histórica;
- `Progreso` para trayectoria;
- `Mi realidad` para objeto concreto.

Estas salidas no cuentan como acciones internas de Ahora. Se usan solo cuando usuario decide profundizar fuera de pregunta actual.

---

## 5. Eventos que cambian Ahora

## 5.1 Hechos realizados

- ingreso recibido;
- gasto realizado;
- transferencia completada;
- compra con tarjeta;
- pago de tarjeta o deuda;
- cobro de préstamo;
- compra o venta de inversión;
- aporte o retiro de reserva;
- adquisición o venta de activo.

Efecto: recalculan bloques afectados inmediatamente.

## 5.2 Paso del tiempo

- obligación entra en horizonte de siete días;
- vencimiento entra en ventana de 72 horas;
- obligación vence;
- cobro esperado llega a fecha sin realizarse;
- dato supera antigüedad aceptable;
- comienza nuevo día.

Efecto: puede cambiar cobertura, atención y confiabilidad sin nuevo movimiento.

## 5.3 Actualizaciones de valor

- saldo confirmado;
- precio o valuación actualizada;
- tipo de cambio actualizado;
- activo revaluado;
- deuda recalculada por interés o ajuste conocido.

Efecto: cambia posición actual. Solo cambia disponible si valor es líquido y utilizable.

## 5.4 Cambios de compromiso

- nueva deuda;
- nueva cuota;
- cierre de tarjeta;
- pago reprogramado;
- obligación cancelada;
- cobro confirmado;
- reserva creada o liberada.

Efecto: cambia presión inmediata y cálculo de disponibilidad.

## 5.5 Cambios de confianza

- cuenta conciliada;
- diferencia detectada;
- operación corregida;
- duplicado resuelto;
- dato marcado como estimado;
- fuente actualizada;
- elemento archivado.

Efecto: cambia cobertura o tarea de revisión, aunque monto permanezca igual.

## 5.6 Cambios de lectura

- moneda de lectura;
- ámbito financiero;
- fecha de corte actual;
- titularidad incluida.

Efecto: recomputa síntesis sin modificar realidad original.

## 5.7 Eventos que no deben alterar jerarquía

- cambio de categoría sin efecto monetario;
- edición de nota;
- orden de cuentas;
- cambio cosmético;
- cotización irrelevante;
- movimiento pequeño sin impacto material.

Pueden actualizar evidencia, pero no crear alerta ni desplazar contenido principal.

---

## 6. Experiencia emocional

## 6.1 Antes de abrir

Usuario puede sentir:

- incertidumbre;
- presión;
- curiosidad;
- necesidad de comprobar;
- temor a haber olvidado algo.

## 6.2 Primeros dos segundos

Debe reconocer si existe urgencia.

Si no existe, mirada cae directamente sobre dinero disponible.

Sensación buscada: orientación inmediata.

## 6.3 Entre dos y cinco segundos

Entiende si obligaciones inmediatas están cubiertas y si respuesta es confiable.

Sensación buscada: control.

## 6.4 Entre cinco y diez segundos

Comprende activos, deudas y patrimonio resumidos. Decide si necesita actuar o puede cerrar.

Sensación buscada: suficiencia, no entretenimiento.

## 6.5 Cuando existen problemas

Ahora no debe tranquilizar falsamente.

Debe transmitir:

- seriedad;
- precisión;
- próxima acción clara;
- ausencia de juicio.

Sensación buscada:

> Hay un problema concreto. Entiendo cuál es y qué puedo hacer ahora.

## 6.6 Cuando todo está en orden

No celebra de forma exagerada ni inventa tareas.

Sensación buscada:

> Entiendo mi situación. No hay nada urgente. Puedo seguir con mi día.

---

## 7. Estructura completa de arriba hacia abajo

## 7.1 Contexto mínimo

Fecha, moneda, ámbito y cobertura de información.

No domina lectura. Evita interpretar cifra fuera de contexto.

## 7.2 Atención crítica

Aparece solo cuando existe situación inmediata.

Muestra un problema, impacto y acción. Si no existe, desaparece sin dejar espacio vacío.

## 7.3 Respuesta principal

Muestra dinero disponible y frase de estado actual.

Es centro de Ahora.

## 7.4 Cobertura inmediata

Resume próximos siete días: cubierto, faltante y obligación más cercana.

Detalle continúa en `Próximo`.

## 7.5 Acciones contextuales

Permite registrar, resolver, mover, actualizar o abrir evidencia.

No compite con respuesta. Sigue inmediatamente porque respuesta sin acción queda incompleta.

## 7.6 Posición actual

Resume activos, deudas, patrimonio neto y proporción líquida/no líquida.

Detalle continúa en `Mi realidad`.

## 7.7 Reserva actual

Explica cuánto dinero tiene propósito y cómo afecta disponible.

Aparece solo si existe dinero reservado.

## 7.8 Confianza y revisión

Declara actualización, cobertura parcial y tarea más importante.

Detalle abre `Evidencia` o acción de corrección.

## 7.9 Cierre

No agrega contenido. Usuario puede terminar lectura sin feed, recomendaciones ni gráficos adicionales.

---

## 8. Especificación por bloque

| Bloque | Propósito | Contenido | Prioridad | Interacción | Aparece | Desaparece |
|---|---|---|---|---|---|---|
| Contexto mínimo | dar alcance a cifras | fecha, moneda, ámbito, cobertura | baja pero obligatoria | cambiar lectura, ver confianza | siempre | nunca |
| Atención crítica | exponer riesgo inmediato | hecho, monto, fecha, consecuencia | máxima condicional | resolver, abrir evidencia | ante urgencia material | al resolver o dejar de ser urgente |
| Respuesta principal | responder cómo estoy ahora | disponible y frase factual | máxima estable | ver cálculo, registrar, actualizar | desde primer saldo confiable | nunca; cambia a estado incompleto si falta información |
| Cobertura inmediata | conectar disponible con obligaciones cercanas | total próximo, cubierto, faltante, vencimiento más cercano | alta | pagar, cubrir, abrir Próximo | con compromiso conocido o agenda confirmada vacía | durante onboarding sin compromisos cargados |
| Acciones contextuales | permitir actuar sin buscar módulo | registrar, resolver, mover, actualizar, evidencia | alta operativa | ejecutar y volver a Ahora | tras configuración mínima | durante primer paso de alta |
| Posición actual | dar contexto patrimonial | activos, deudas, patrimonio, líquido/no líquido | media | abrir evidencia o Mi realidad | con deuda, inversión o activo adicional | cuando solo existe dinero líquido y repetiría misma cifra |
| Reserva actual | explicar diferencia entre saldo y disponible | reservado total y propósito prioritario | media condicional | reservar, liberar, abrir detalle | con reserva activa | sin reservas |
| Confianza y revisión | declarar calidad de respuesta | fecha, datos parciales, pendiente principal | alta si hay problema; baja si todo está vigente | actualizar, corregir, ver evidencia | siempre como estado mínimo | bloque expandido desaparece sin pendientes |

## 8.1 Orden normal

```text
Contexto
-> Respuesta principal
-> Cobertura inmediata
-> Acciones
-> Posición actual
-> Reserva actual, si existe
-> Confianza y revisión
```

## 8.2 Orden con problema crítico

```text
Contexto
-> Atención crítica
-> Respuesta principal
-> Acción de resolución
-> Cobertura inmediata
-> Posición actual
-> Confianza y revisión
```

Solo atención crítica cambia orden.

---

## 9. Estados

## 9.1 Usuario nuevo

### Debe mostrar

- pregunta que Ahora responderá;
- moneda y ámbito elegidos;
- cobertura todavía incompleta;
- una acción principal: agregar primera cuenta;
- caminos iniciales: efectivo, banco o billetera.

### No debe mostrar

- disponible en cero;
- patrimonio en cero;
- alertas por módulos no configurados;
- bloques vacíos;
- comparación;
- objetivos sugeridos.

### Después de primera cuenta

- aparece disponible conocido;
- estado indica “posición parcial”;
- informa qué dimensión relevante todavía falta declarar;
- permite registrar primer hecho.

## 9.2 Usuario activo

### Debe mostrar

- disponible;
- cobertura de siete días;
- estado factual;
- posición actual;
- confianza;
- acción relevante si existe.

### Comportamiento

Cantidad de datos no agrega bloques. Agregados reemplazan listas.

## 9.3 Usuario con problemas financieros

### Debe mostrar

- una atención crítica prioritaria;
- disponible real, incluso negativo;
- faltante de cobertura;
- obligación más urgente;
- acción posible;
- activos y deudas resumidos;
- limitaciones de información.

### Debe evitar

- múltiples alertas simultáneas;
- lenguaje alarmista;
- color como única señal;
- score bajo;
- culpa;
- solución comercial;
- ocultar patrimonio o cobros relevantes.

### Resultado buscado

Usuario entiende problema concreto y próximo paso sin sentir que pantalla lo juzga.

## 9.4 Usuario con patrimonio alto

### Debe mostrar

- disponible primero;
- patrimonio después;
- proporción líquida, invertida y no líquida;
- deuda y obligaciones actuales;
- vigencia de valuaciones;
- atención operativa antes que rendimiento.

### Debe evitar

- convertir Ahora en cartera;
- lista de instrumentos;
- rendimiento diario protagonista;
- confundir patrimonio elevado con liquidez suficiente;
- ocultar vencimiento pequeño por comparación con patrimonio total.

## 9.5 Usuario sin movimientos recientes

### Debe mostrar

- posición actual;
- disponible;
- cobertura inmediata;
- vigencia de datos;
- mensaje factual de ausencia de urgencia, si corresponde.

### Debe evitar

- estado vacío;
- “no hay nada para ver”;
- presión para registrar actividad;
- contenido de relleno;
- asumir que situación no cambió solo porque no hubo movimientos.

### Razón

Paso del tiempo, vencimientos, intereses, reservas y valuaciones pueden cambiar relevancia sin movimientos recientes.

---

## 10. Regla de reducción al 50%

Si mañana hubiera que eliminar mitad de Ahora, cuatro elementos nunca podrían desaparecer.

## 10.1 Dinero disponible

Porque responde capacidad operativa actual. Sin esta cifra, Ahora pierde pregunta central.

## 10.2 Atención crítica

Porque estado financiero no puede declararse sin mostrar problema inmediato conocido.

Si no existe alerta, bloque desaparece. Capacidad de aparecer nunca se elimina.

## 10.3 Cobertura inmediata

Porque disponible aislado puede ser engañoso. Usuario necesita saber si próximos compromisos están cubiertos.

Puede integrarse dentro de respuesta principal, pero significado no puede desaparecer.

## 10.4 Confiabilidad y evidencia

Porque cifra sin fecha, alcance y origen puede parecer precisa cuando no lo es.

Puede reducirse a una línea y un acceso, pero debe permanecer.

## 10.5 Núcleo irreducible

```text
¿Hay algo urgente?
¿Cuánto tengo disponible?
¿Lo próximo está cubierto?
¿Puedo confiar en esta respuesta?
```

Todo lo demás puede moverse:

- posición total a `Mi realidad`;
- reservas a detalle de disponible;
- acciones secundarias a `Actuar`;
- información ampliada a `Evidencia`.

Justificación final:

**Ahora existe para orientar, no para demostrar alcance del producto. Si conserva urgencia, disponibilidad, cobertura y confianza, conserva identidad.**

---

## 11. Declaración oficial

Estructura funcional de Ahora queda establecida así:

```text
Contexto
-> Atención crítica, si existe
-> Disponible ahora
-> Cobertura inmediata
-> Actuar
-> Posición actual
-> Reserva actual, si existe
-> Confianza y evidencia
```

Pantalla debe responder en menos de diez segundos:

**¿Cómo estoy financieramente en este momento?**

Si contenido no mejora esa respuesta, no pertenece a Ahora.
