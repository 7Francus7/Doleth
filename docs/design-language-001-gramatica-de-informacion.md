# DESIGN LANGUAGE 001 — Gramática de Información

Estado: oficial  
Fecha: 2 de julio de 2026  
Autoridad: lenguaje funcional para construir pantallas de Doleth  
Depende de: Brand Foundation, `UX-004` y `DESIGN SPEC 001 — Ahora`  

## 0. Alcance

Este documento define unidades semánticas con las que Doleth construye toda pantalla.

No define:

- colores;
- tipografía;
- iconografía;
- bordes;
- tamaños;
- grillas;
- componentes;
- patrones técnicos.

Define qué significa cada bloque, qué puede contener, cómo se relaciona y cómo cambia.

Regla de autoridad:

**Toda pantalla futura debe poder describirse usando únicamente esta gramática.**

---

## 1. Unidad básica de información

## 1.1 Opciones descartadas

### Tarjeta

Es forma visual posible, no unidad de significado. Misma información podría vivir sin tarjeta.

### Panel

Describe contenedor amplio. Puede reunir contenido incompatible y no establece propósito.

### Sección

Ordena pantalla, pero no garantiza autonomía ni respuesta.

### Resumen

Es un tipo de contenido. No sirve para representar evidencia, secuencia o resolución.

### Insight

Implica interpretación excepcional. Muchas respuestas importantes son hechos, no insights.

### Indicador

Es dato aislado. Sin contexto temporal, alcance y explicación puede resultar ambiguo.

### Bloque

Es término útil para composición, pero demasiado genérico como definición fundamental.

## 1.2 Unidad elegida

Unidad básica de Doleth es **Unidad de sentido**.

Definición:

**Unidad de sentido es fragmento autónomo que resuelve una incertidumbre financiera concreta y conserva contexto necesario para interpretarla correctamente.**

Puede representarse visualmente como tarjeta, fila, sección, banda o cualquier forma futura. Representación no cambia función.

## 1.3 Contrato mínimo

Toda Unidad de sentido define seis elementos.

### 1. Incertidumbre

Qué necesita entender usuario.

Ejemplo:

> ¿Cuánto dinero puedo usar ahora?

### 2. Respuesta

Hecho, relación o estado que resuelve incertidumbre.

Ejemplo:

> $420.000 disponibles.

### 3. Contexto

Tiempo, moneda, ámbito y alcance necesarios.

Ejemplo:

> Hoy, en ARS, ámbito personal, con cuentas confirmadas.

### 4. Condición informativa

Qué calidad tiene respuesta.

Estados posibles:

- confirmada;
- parcial;
- estimada;
- desactualizada;
- conflictiva;
- no disponible.

### 5. Evidencia

Cómo usuario comprueba origen.

Ejemplo:

> Ver cuentas, reservas y obligaciones consideradas.

### 6. Acción opcional

Qué puede hacer si respuesta requiere intervención.

Ejemplo:

> Actualizar saldo.

## 1.4 Elementos obligatorios y opcionales

| Elemento | Obligatorio | Regla |
|---|---|---|
| Incertidumbre | sí | puede ser explícita o implícita, pero debe estar definida |
| Respuesta | sí | salvo estado no disponible, donde respuesta explica ausencia |
| Contexto | sí | puede heredarse de pantalla si no cambia entre unidades |
| Condición informativa | sí | estado confirmado puede permanecer discreto, nunca inexistente |
| Evidencia | sí para conclusión material | acceso puede ser progresivo |
| Acción | no | aparece solo cuando existe acción relevante |

## 1.5 Prueba de autonomía

Unidad es válida si puede responder:

1. ¿Qué duda resuelve?
2. ¿Qué afirma?
3. ¿Para qué momento y ámbito?
4. ¿Qué tan confiable es?
5. ¿Cómo se comprueba?
6. ¿Qué puede hacer usuario?

Si no puede responder primeras cinco, no es Unidad de sentido completa.

---

## 2. Tipos de unidades

Gramática oficial contiene diez tipos.

## 2.1 Síntesis

Responde pregunta principal de pantalla combinando varias fuentes en una conclusión breve.

Ejemplos:

- disponibilidad actual;
- situación de próximos compromisos;
- explicación principal del mes;
- dirección patrimonial.

Regla: máximo una Síntesis primaria por pantalla.

## 2.2 Estado

Describe condición actual de una cantidad, objeto o relación.

Ejemplos:

- saldo de cuenta;
- deuda pendiente;
- valor actual de inversión;
- dinero reservado;
- estado de actualización.

Regla: no explica evolución salvo referencia mínima necesaria.

## 2.3 Atención

Expone situación material que requiere conocimiento o intervención.

Ejemplos:

- vencimiento sin cobertura;
- saldo inconsistente;
- deuda vencida;
- valuación materialmente desactualizada.

Regla: muestra consecuencia y acción. Aviso sin acción o consecuencia no es Atención.

## 2.4 Composición

Explica cómo un total se distribuye entre partes.

Ejemplos:

- activos líquidos, invertidos y no líquidos;
- deuda por tipo;
- dinero por moneda;
- patrimonio por ámbito.

Regla: partes deben corresponder al mismo total, fecha, moneda y alcance.

## 2.5 Comparación

Contrasta dos estados equivalentes y muestra diferencia.

Ejemplos:

- disponible hoy versus semana anterior;
- deuda al inicio versus cierre;
- gasto actual versus período comparable.

Regla: ambos lados conservan misma definición. Si criterio cambia, comparación debe declararlo o no existir.

## 2.6 Secuencia

Ordena hechos o compromisos por tiempo, dependencia o ejecución.

Ejemplos:

- próximos vencimientos;
- actividad financiera;
- cuotas de compra;
- pagos de préstamo;
- historial de valuaciones.

Regla: orden debe tener significado visible. Secuencia no es lista arbitraria.

## 2.7 Progreso

Relaciona estado actual con propósito declarado.

Ejemplos:

- ahorro respecto de objetivo;
- deuda cancelada respecto del total;

- fondo de emergencia respecto de monto elegido;
- preparación respecto de fecha objetivo.

Regla: necesita meta real. Sin objetivo declarado, usar Estado o Comparación.

## 2.8 Colección

Reúne objetos homogéneos para localizar, elegir o administrar.

Ejemplos:

- cuentas;
- tarjetas;
- deudas;
- inversiones;
- objetivos;
- operaciones pendientes.

Regla: todos los elementos responden mismo criterio de inclusión y orden.

## 2.9 Evidencia

Explica origen, cálculo, condición y trazabilidad de otra unidad.

Ejemplos:

- cuentas incluidas en disponible;
- operaciones que forman gasto;
- tipo de cambio usado;
- fecha y fuente de valuación;
- motivo de diferencia.

Regla: verifica conclusión existente. No introduce conclusión nueva sin elevarla a unidad propia.

## 2.10 Resolución

Concentra tarea necesaria para cambiar estado conocido.

Ejemplos:

- pagar obligación;
- corregir diferencia;
- confirmar movimiento;
- actualizar saldo;
- completar dato material.

Regla: una Resolución tiene un objetivo, un estado final y una acción principal.

## 2.11 Conceptos que no son tipos

### Detalle

Es nivel de profundidad. Puede construirse con Estado, Composición, Secuencia y Evidencia.

### Resumen

Es grado de condensación. Síntesis es tipo semántico correspondiente cuando responde pregunta principal.

### Lista

Es representación. Colección o Secuencia definen significado real.

### Evolución

Puede ser Comparación, Secuencia o Progreso según pregunta.

### Acción

Es capacidad transversal. Solo se convierte en Resolución cuando necesita contexto y resultado propio.

### Alerta

Es intensidad. Atención define estructura semántica.

---

## 3. Contrato de contenido por tipo

| Tipo | Puede contener | Nunca debe contener |
|---|---|---|
| Síntesis | respuesta principal, hasta tres hechos de apoyo, contexto, condición, acción principal, acceso a evidencia | segunda pregunta principal, lista extensa, historial completo, múltiples acciones equivalentes, detalle técnico |
| Estado | nombre, valor, unidad, fecha, alcance, condición, cambio mínimo opcional | narrativa larga, recomendación, comparación con definición distinta, partes heterogéneas |
| Atención | problema, impacto, urgencia, monto, fecha, objeto afectado, resolución | contenido promocional, consejo genérico, varias urgencias no relacionadas, dato decorativo |
| Composición | total, partes, proporciones, criterio, fecha, moneda, acceso a origen | elementos fuera del total, doble conteo, períodos mezclados, proyección junto con realizado |
| Comparación | base, referencia, diferencia, dirección, contexto común, causa opcional | métricas no equivalentes, escalas distintas no declaradas, juicio moral, score derivado opaco |
| Secuencia | elementos ordenados, fecha, estado, relación temporal, siguiente hecho | agregados sin período, objetos sin criterio de orden, hechos realizados mezclados silenciosamente con esperados |
| Progreso | objetivo, actual, faltante, fecha, ritmo opcional, aportes | meta inventada, recomendación automática, comparación social, porcentaje sin monto real |
| Colección | objetos homogéneos, resumen, orden, filtro, estado por elemento | respuestas globales no relacionadas, tipos incompatibles, más de un criterio principal de lectura |
| Evidencia | fuentes, cálculo, supuestos, fecha, alcance, registros, certeza | nueva recomendación, interpretación no sustentada, acción comercial, dato sin relación con conclusión |
| Resolución | tarea, motivo, objeto, información necesaria, acción principal, resultado esperado | análisis general, acciones no relacionadas, navegación promocional, múltiples objetivos simultáneos |

## 3.1 Regla para números

Todo número material declara o hereda:

- unidad;
- moneda;
- tiempo;
- ámbito;
- estado realizado, esperado o estimado.

Número que no puede conservar esos cinco atributos no debe mostrarse como respuesta.

## 3.2 Regla para lenguaje

Texto dentro de unidad puede:

- afirmar;
- explicar;
- contextualizar;
- advertir;
- orientar hacia acción.

No puede:

- juzgar;
- exagerar;
- tranquilizar sin evidencia;
- ocultar incertidumbre;
- convertir correlación en causa;
- decidir por usuario.

## 3.3 Regla para acciones

Acción aparece cuando usuario ya entiende:

- qué ocurre;
- por qué importa;
- qué cambiará al actuar.

Acción sin comprensión previa no pertenece a unidad.

---

## 4. Relaciones entre unidades

## 4.1 Relación principal

Pantalla forma cadena de comprensión:

```text
Síntesis
-> apoyo
-> detalle
-> evidencia
-> resolución, si corresponde
```

No toda pantalla usa todos los niveles.

## 4.2 Relaciones permitidas

### Síntesis -> Estado

Estado aporta hecho que sostiene respuesta principal.

### Síntesis -> Composición

Composición explica de qué está hecha respuesta.

### Síntesis -> Comparación

Comparación agrega dirección sin reemplazar estado actual.

### Atención -> Resolución

Atención identifica problema; Resolución permite cambiarlo.

### Cualquier unidad -> Evidencia

Evidencia verifica origen y condición.

### Progreso -> Secuencia

Secuencia puede mostrar aportes o hitos que explican avance.

### Colección -> Estado

Cada elemento puede resumir estado propio, sin convertirse en bloque completo independiente.

### Composición -> Estado

Cada parte puede tener valor y condición dentro de mismo total.

## 4.3 Relaciones prohibidas

### Síntesis dentro de Síntesis

Crearía dos respuestas principales.

### Atención dentro de Colección

Urgencia quedaría escondida entre elementos. Colección puede marcar elemento, pero Atención vive separada.

### Atención dentro de Composición

Problema no debe competir con partes de total.

### Evidencia antes de respuesta

Obliga a interpretar datos antes de conocer conclusión.

### Resolución antes de contexto

Pide actuar sin comprender consecuencia.

### Progreso sin objetivo

Convierte estado en evaluación arbitraria.

### Comparación entre períodos incompatibles

Produce dirección falsa.

### Secuencia realizada y esperada sin separación

Confunde realidad con futuro.

## 4.4 Reglas de anidación

Profundidad conceptual máxima: dos niveles visibles simultáneos.

Permitido:

- Composición contiene partes simples;
- Comparación contiene dos Estados equivalentes;
- Progreso contiene Estado actual y objetivo;
- Secuencia contiene entradas temporales;
- Colección contiene resúmenes de objetos;
- unidad expande Evidencia subordinada.

No permitido:

- unidad contiene otra Síntesis;
- Colección contiene unidades completas heterogéneas;
- Atención queda anidada;
- Resolución contiene otra Resolución;
- Evidencia contiene nueva jerarquía de respuestas;
- tercer nivel visible obliga seguir expandiendo dentro de mismo contexto.

Al llegar a tercer nivel, usuario pasa a territorio, objeto o evidencia dedicada.

## 4.5 Separaciones obligatorias

Siempre separados:

- realizado y esperado;
- disponible y patrimonio;
- alerta y explicación histórica;
- total y objetivo;
- estado actual y comparación;
- conclusión y evidencia;
- información y promoción;
- acción y recomendación comercial;
- cuentas propias y dinero ajeno;
- ámbito personal y compartido cuando titularidad cambia significado.

---

## 5. Jerarquía conceptual

Jerarquía no depende de tamaño, color ni posición gráfica. Depende de función.

## 5.1 Nivel 0 — Contexto de pantalla

Define pregunta, tiempo, moneda, ámbito y cobertura general.

No es Unidad de sentido independiente. Es marco compartido.

## 5.2 Nivel 1 — Respuesta primaria

Una Síntesis o Estado principal responde pregunta madre.

Máximo: una unidad.

## 5.3 Nivel crítico — Interrupción

Una Atención material puede preceder Nivel 1.

No reemplaza respuesta primaria. Interrumpe orden por urgencia.

Máximo: una Atención crítica visible; restantes se resumen.

## 5.4 Nivel 2 — Soporte de decisión

Hasta tres unidades explican consecuencia, composición, comparación, secuencia o progreso relevante.

Cada una debe cambiar comprensión o acción posible.

## 5.5 Nivel 3 — Administración contextual

Colección o Resolución permite localizar y actuar.

No debe competir con respuesta.

## 5.6 Nivel 4 — Confianza

Evidencia, fuente, cálculo y condición aparecen bajo demanda o cuando incertidumbre es material.

Aunque jerarquía sea baja, acceso siempre existe para conclusión importante.

## 5.7 Orden de prioridad

```text
Atención crítica, si existe
-> Respuesta primaria
-> Consecuencia inmediata
-> Soporte de decisión
-> Administración
-> Evidencia ampliada
```

## 5.8 Presupuesto de atención

Pantalla estándar admite:

- una pregunta madre;
- una respuesta primaria;
- una interrupción crítica opcional;
- hasta tres unidades de soporte;
- una resolución principal;
- evidencia progresiva.

Si necesita más, pantalla debe dividir incertidumbres o mover profundidad a otro territorio.

---

## 6. Comportamiento

## 6.1 Expandirse

Unidad puede expandirse para revelar:

- partes;
- período adicional;
- elementos de colección;
- explicación;
- evidencia;
- acción secundaria.

Expansión no puede cambiar respuesta original.

Si nueva información contradice respuesta, condición pasa a conflictiva y unidad se actualiza completa.

## 6.2 Colapsarse

Unidad colapsada conserva:

- respuesta;
- contexto crítico;
- condición;
- urgencia;
- acceso a expansión.

No puede ocultar:

- monto crítico;
- fecha crítica;
- estado parcial o desactualizado;
- acción principal pendiente.

## 6.3 Cambiar de prioridad

Unidad cambia prioridad por:

- urgencia temporal;
- impacto material;
- pérdida de cobertura;
- conflicto de datos;
- acción pendiente;
- relación directa con pregunta madre.

No cambia prioridad por:

- novedad sin consecuencia;
- interés comercial;
- animación;
- frecuencia de interacción;
- dato llamativo;
- preferencia estética.

Tipo y significado permanecen iguales al cambiar prioridad.

## 6.4 Desaparecer

Unidad desaparece cuando:

- incertidumbre ya no existe;
- contenido no aplica;
- no hay objetos relevantes;
- acción fue resuelta;
- respuesta está incluida sin pérdida en unidad superior.

No desaparece cuando:

- ausencia es respuesta relevante;
- estado es cero confirmado;
- falta información material;
- atención sigue vigente;
- desaparición produciría interpretación falsa.

Ejemplo:

Atención desaparece al resolver deuda vencida. Estado “sin obligaciones próximas” puede permanecer si confirma tranquilidad.

## 6.5 Fusionarse

Fusión permitida solo cuando unidades:

- resuelven misma incertidumbre;
- comparten tiempo, moneda y ámbito;
- conservan claridad;
- no ocultan condición distinta;
- reducen repetición.

Fusiones válidas:

- Síntesis + Estado principal;
- Atención + Resolución directa;
- Estado + Comparación breve;
- Estado + Progreso hacia objetivo;
- Composición + acceso a Evidencia.

Fusiones prohibidas:

- dos Síntesis;
- dos Atenciones no relacionadas;
- realizado + esperado;
- Estado + Colección extensa;
- Comparación + Progreso con metas diferentes;
- Evidencia + nueva conclusión;
- Resoluciones con objetivos distintos.

## 6.6 Dividirse

Unidad debe dividirse cuando:

- contiene dos incertidumbres;
- mezcla dos horizontes temporales;
- ofrece dos acciones principales distintas;
- combina estados con condiciones incompatibles;
- requiere título compuesto con “y” para explicar propósito;
- evidencia ocupa más peso que respuesta;
- parte puede cambiar sin afectar resto.

## 6.7 Reordenarse

Orden base de pantalla permanece estable para reducir reaprendizaje.

Solo pueden adelantar posición:

- Atención crítica;
- Resolución asociada a Atención crítica;
- condición conflictiva que invalida respuesta primaria.

Después de resolver evento, orden vuelve a base.

## 6.8 Estados transversales

Toda unidad soporta siete estados.

| Estado | Significado | Comportamiento |
|---|---|---|
| Vacío confirmado | no existe contenido aplicable | muestra ausencia solo si responde algo; si no, desaparece |
| Inicial | todavía no se cargó información | explica primer paso; no muestra cero falso |
| Parcial | respuesta usa cobertura incompleta | muestra lo conocido y qué falta |
| Confirmado | información vigente y suficiente | muestra respuesta sin advertencia dominante |
| Estimado | parte depende de valor aproximado | identifica estimación y fecha |
| Desactualizado | dato perdió vigencia esperada | conserva último valor con advertencia local y acción |
| Conflictivo | fuentes o cálculos no coinciden | evita conclusión definitiva y prioriza resolución |

## 6.9 Cambio de estado

Estado modifica condición y prioridad, no tipo.

Ejemplo:

- Estado de saldo confirmado;
- mismo Estado pasa a desactualizado;
- luego conflictivo por diferencia;
- vuelve a confirmado tras conciliación.

No se convierte en Atención automáticamente. Se crea Atención separada solo si conflicto tiene impacto material o urgencia.

---

## 7. Gramática completa

## 7.1 Estructura universal

Toda pantalla de Doleth se construye con esta secuencia conceptual:

```text
Contexto compartido
+ Atención crítica opcional
+ Respuesta primaria
+ Soporte necesario
+ Evidencia progresiva
+ Resolución contextual opcional
```

## 7.2 Contexto compartido

Define una vez:

- pregunta madre;
- tiempo;
- moneda;
- ámbito;
- cobertura.

Unidades heredan contexto mientras no lo contradigan.

Si una unidad usa otro período o moneda, debe declararlo localmente.

## 7.3 Respuesta primaria

Puede ser:

- Síntesis, cuando pregunta cruza varias fuentes;
- Estado, cuando pregunta se refiere a objeto único;
- Progreso, cuando pregunta principal trata objetivo declarado;
- Secuencia, cuando pregunta principal es temporal.

No puede ser:

- Colección sin resumen;
- Evidencia;
- Resolución sin explicación;
- Composición sin total claro.

## 7.4 Soporte necesario

Se elige por pregunta, no por disponibilidad de datos.

| Necesidad | Unidad correcta |
|---|---|
| explicar partes | Composición |
| mostrar diferencia | Comparación |
| ordenar tiempo | Secuencia |
| mostrar meta | Progreso |
| localizar objetos | Colección |
| verificar origen | Evidencia |
| resolver problema | Resolución |

## 7.5 Fórmula de pantalla por territorio

### Ahora

```text
Contexto
+ Atención opcional
+ Síntesis de estado actual
+ Estado de disponibilidad
+ Composición de posición
+ Evidencia
+ Resolución opcional
```

### Próximo

```text
Contexto
+ Síntesis de cobertura
+ Secuencia de compromisos
+ Atención opcional
+ Evidencia
+ Resolución
```

### Cambios

```text
Contexto
+ Síntesis de variación
+ Comparación
+ Secuencia de hechos
+ Evidencia
+ Resolución de inconsistencias opcional
```

### Progreso

```text
Contexto
+ Síntesis de dirección
+ Progreso
+ Comparación
+ Composición
+ Evidencia
```

### Mi realidad

```text
Contexto
+ Síntesis de posición
+ Composición
+ Colecciones homogéneas
+ Estados por objeto
+ Evidencia
```

### Actuar

```text
Contexto heredado
+ Resolución
+ Estado resultante
+ Evidencia de cambio
```

## 7.6 Ejemplo genérico

Pregunta de pantalla:

> ¿Qué necesita atención esta semana?

Construcción:

1. Contexto: próximos siete días, ARS, ámbito personal.
2. Síntesis: dos obligaciones; una sin cobertura.
3. Atención: tarjeta vence mañana y falta cubrir $80.000.
4. Secuencia: tarjeta, alquiler y cobro esperado ordenados por fecha.
5. Evidencia: saldo de cuentas y compromisos considerados.
6. Resolución: registrar pago o cubrir desde cuenta.

No requiere:

- gráfico;
- módulo visible;
- lista de todas las cuentas;
- explicación histórica completa;
- objetivo de ahorro;
- indicador decorativo.

## 7.7 Validación de una pantalla

Antes de diseñar pantalla, responder:

1. ¿Cuál es pregunta madre?
2. ¿Cuál es respuesta primaria?
3. ¿Existe urgencia capaz de interrumpir?
4. ¿Qué máximo tres unidades sostienen respuesta?
5. ¿Qué acción cambia estado?
6. ¿Qué evidencia permite verificar?
7. ¿Qué contenido pertenece a otro territorio?
8. ¿Qué unidad desaparece cuando no aplica?
9. ¿Qué estados parciales o conflictivos existen?
10. ¿Puede describirse solo con tipos oficiales?

Si respuesta diez es no, primero debe demostrarse que taxonomía no puede expresar necesidad. No se crea nuevo tipo por conveniencia visual.

---

## 8. Principios permanentes

1. **Cada unidad elimina una incertidumbre identificable.** Si no cambia comprensión, no merece espacio.
2. **Pantalla tiene una sola respuesta dominante.** Resto existe para sostenerla, verificarla o permitir actuar.
3. **Significado se define antes que contenedor.** Tarjeta, fila o sección son decisiones posteriores.
4. **Número viaja con contexto.** Tiempo, moneda, ámbito y condición no pueden desprenderse de cifra material.
5. **Realizado y esperado conservan identidades separadas.** Pueden relacionarse, nunca fusionarse silenciosamente.
6. **Urgencia interrumpe; no reorganiza producto permanentemente.** Al resolverse, jerarquía base regresa.
7. **Ausencia no equivale a cero.** Falta de datos, vacío confirmado y valor cero son estados distintos.
8. **Composición conserva total.** Partes no se superponen ni cuentan valor dos veces.
9. **Comparación exige equivalencia.** Definición, período, moneda y alcance deben ser compatibles.
10. **Progreso necesita propósito declarado.** Sin meta de usuario no existe avance legítimo.
11. **Colección reúne semejantes.** Si elementos exigen criterios distintos, deben separarse.
12. **Evidencia permanece a un paso.** Conclusión material nunca obliga búsqueda por otro territorio para comprobarse.
13. **Acción sigue comprensión.** Usuario entiende hecho y consecuencia antes de intervenir.
14. **Expansión agrega profundidad, no cambia tesis.** Si respuesta cambia, unidad entera actualiza condición.
15. **Colapso preserva lo irreversible de interpretar.** Urgencia, condición y cifra principal nunca se esconden.
16. **Fusión requiere misma pregunta.** Cercanía visual no justifica mezclar significados.
17. **Complejidad crece hacia profundidad.** Más datos no crean más bloques en nivel principal.
18. **Estado local no contamina pantalla completa.** Dato desactualizado afecta unidad correspondiente salvo impacto global demostrado.
19. **Resolución tiene un final verificable.** Acción termina cuando estado objetivo puede comprobarse.
20. **Nuevo tipo es excepción institucional.** Solo se acepta si necesidad no puede expresarse combinando gramática existente sin perder significado.

---

## 9. Aplicación obligatoria

Toda futura especificación de pantalla debe incluir:

- pregunta madre;
- Unidad de sentido primaria;
- tipos de unidades utilizadas;
- orden jerárquico;
- estados transversales aplicables;
- reglas de aparición y desaparición;
- relaciones y anidación;
- acciones y resoluciones;
- acceso a Evidencia;
- contenido excluido.

Toda unidad debe nombrarse por tipo semántico, no por forma visual.

Correcto:

- Síntesis de disponibilidad;
- Atención por deuda vencida;
- Comparación semanal;
- Secuencia de cuotas;
- Evidencia de valuación.

Incorrecto:

- card grande;
- widget superior;
- panel rojo;
- caja secundaria;
- componente de métricas.

---

## 10. Declaración oficial

Gramática de información de Doleth queda definida por:

### Unidad fundamental

**Unidad de sentido.**

### Diez tipos

1. Síntesis.
2. Estado.
3. Atención.
4. Composición.
5. Comparación.
6. Secuencia.
7. Progreso.
8. Colección.
9. Evidencia.
10. Resolución.

### Estructura universal

```text
Contexto
-> Respuesta
-> Soporte
-> Evidencia
-> Acción
```

### Regla final

**Doleth no organiza información por contenedores visuales. La organiza por incertidumbres resueltas, relaciones comprensibles y acciones verificables.**

Toda pantalla futura debe construirse únicamente con esta gramática.
