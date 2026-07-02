# UX-002 — Mundo Visible de Doleth

Estado: oficial
Fecha: 2 de julio de 2026
Baseline: `UX-001` congelado

Este documento define universo visible del producto.

No modifica ontología.
No modifica estados.
No modifica motor cognitivo.

Define qué realidad puede percibir usuario y qué debe permanecer invisible.

Desde este momento, este documento es autoridad máxima sobre todo aquello que usuario puede ver, interpretar y sentir dentro de Doleth.

---

## 1. Qué objetos existen para usuario

No todo objeto interno merece existencia visible.
Usuario no habita motor.
Usuario habita significado.

### 1.1 Dinero libre

Sí existe.

No como saldo bruto.
Existe como porción de realidad que usuario siente disponible para decidir hoy.

Es objeto visible central del producto.

### 1.2 Compromisos próximos

Sí existen.

Usuario no piensa “obligación modelada”.
Piensa:

- esto ya me consume
- esto se viene
- esto me aprieta esta semana

Compromiso visible organiza urgencia.

### 1.3 Reservas

Sí existen.

Usuario necesita sentir que parte de su dinero ya tiene destino, aunque todavía no haya salido.

No hace falta mostrar semántica compleja.
Sí hace falta mostrar que no todo lo que está quieto está libre.

### 1.4 Cuentas y lugares donde vive dinero

Sí existen, pero como soportes secundarios.

Cuenta existe para responder:

- dónde está
- desde dónde salió
- qué parte de la realidad explica

No debe convertirse en centro del mundo visible.

### 1.5 Tarjetas y deudas

Sí existen.

Porque para usuario son presión real, no abstracción.

No deben sentirse como módulo contable.
Deben sentirse como fuerza que toma liquidez presente o futura.

### 1.6 Cobros esperados

Sí existen.

Pero visibles con lenguaje de certeza:

- confirmado
- probable
- falta confirmar

Nunca como si fueran caja ya disponible.

### 1.7 Cambios

Sí existen.

Usuario necesita ver qué cambió desde última vez:

- entró algo
- salió algo
- se reservó algo
- se liberó algo
- apareció presión

“Cambio” importa más que “movimiento”.

### 1.8 Presión

Sí existe.

Presión es objeto visible aunque no sea entidad ontológica.
Porque usuario sí la percibe:

- esta semana aprieta
- este mes está más cargado
- hoy no estoy tan libre como parecía

### 1.9 Margen de decisión

Sí existe.

Es objeto más importante después de dinero libre.
No es cosa que usuario posea.
Es espacio de acción que Doleth hace legible.

### 1.10 Ritmo

Sí existe.

Usuario necesita percibir si su situación:

- se ordena
- se tensa
- se sostiene
- se degrada

No como analítica pesada.
Sí como lectura corta de trayectoria reciente.

### 1.11 Errores de lectura

Sí existen como clase visible.

Usuario debe poder ver cuando:

- creyó que tenía más libertad de la real
- confundió reacomodo con mejora
- dejó pasar presión próxima

No para culpar.
Sí para afinar criterio.

### 1.12 Decisiones

Sí existen.

Doleth no muestra solo realidad.
Muestra realidad en relación con acción posible:

- gastar
- esperar
- separar
- corregir
- cubrir

### 1.13 Historial corto explicativo

Sí existe.

No como archivo de movimientos.
Sí como memoria breve de hechos que explican realidad actual.

### 1.14 Patrimonio

Existe, pero no como objeto primario del MVP cotidiano.

Puede aparecer como contexto secundario.
No debe competir con liquidez libre ni margen real de decisión.

### 1.15 Objetivos

No existen como objeto fundacional del mundo visible inicial.

Pueden aparecer después.
Pero Doleth debe dar verdad incluso si usuario nunca definió objetivos.

### 1.16 Categorías

No existen como objeto visible rector.

Pueden existir localmente si ayudan a explicación.
Nunca como estructura principal de comprensión.

### 1.17 Movimiento

Existe solo como evidencia visible subordinada.

Usuario puede ver que algo pasó.
Pero producto no debe organizar experiencia alrededor de “movimientos”.

### 1.18 Riesgo

Existe, pero visible como fragilidad o exposición comprensible.

No como score abstracto.
Sí como:

- esta plata no está tan disponible
- este ingreso no es firme
- este activo te protege valor pero te quita flexibilidad

---

## 2. Qué objetos no deberían existir

### 2.1 Agente

No debe existir.

Justificación:
es primitive del sistema, no concepto humano útil para lectura cotidiana.

### 2.2 Relación económica

No debe existir.

Justificación:
usuario no necesita ver estructura formal para entender realidad.

### 2.3 Evento ontológico

No debe existir.

Justificación:
producto debe mostrar consecuencia entendible, no gramática interna.

### 2.4 Estado libre / asignado / expuesto / pendiente / extinguido

No deben existir con esos nombres.

Justificación:
son máquina conceptual interna.
Usuario debe percibir disponibilidad y presión, no taxonomía.

### 2.5 Firme / probable / contingente / deteriorado como vocabulario técnico

No deben existir así.

Justificación:
usuario sí debe ver certeza, pero en lenguaje humano:

- confirmado
- incierto
- falta confirmar

### 2.6 Esfera financiera

No debe existir como término visible.

Justificación:
usuario puede entender mundo personal, negocio o compartido sin leer palabra “esfera”.

### 2.7 Transformación / transferencia / extinción / revaluación

No deben existir como verbos visibles del sistema.

Justificación:
son correctos para motor, innecesarios para interfaz.

### 2.8 Hipótesis competidoras

No deben existir como objeto visible.

Justificación:
siempre que pueda, Doleth debe mostrar duda en forma simple, no framework cognitivo.

### 2.9 Verdad provisional

No debe existir como etiqueta técnica.

Justificación:
usuario debe percibir nivel de seguridad de lectura, no terminología epistemológica.

### 2.10 Equivalence keys, failure modes, canon, corpus

Jamás deben existir en producto.

Justificación:
son infraestructura de especificación, totalmente ajena al mundo de uso.

---

## 3. Mapa del mundo visible

Usuario organiza su realidad financiera en cinco capas de significado:

### 3.1 Lo que tengo disponible ahora

Centro del mundo visible.

No es riqueza total.
Es libertad real inmediata.

### 3.2 Lo que ya está tomado

Dinero no libre aunque siga quieto.

Acá viven:

- reservas
- compromisos
- pagos cercanos
- presión ya formada

### 3.3 Lo que puede cambiar mi semana

No todo hecho merece misma atención.
Usuario necesita mapa de aquello que puede reordenar próximos días.

### 3.4 Lo que explica por qué estoy así

No para auditoría.
Sí para comprensión:

- qué pasó
- qué cambió
- por qué ahora tengo este margen

### 3.5 Lo que conviene hacer ahora

Mundo visible termina en decisión, no en dato.

Usuario siente su realidad así:

**disponibilidad -> presión -> explicación -> decisión**

Ése es mapa mental correcto.

---

## 4. Qué preguntas puede responder Doleth

Ordenadas por frecuencia cotidiana:

1. ¿Cuánto tengo realmente libre hoy?
2. ¿Qué parte de mi dinero ya no debería tocar?
3. ¿Qué cambió desde la última vez que abrí Doleth?
4. ¿Puedo gastar esto sin desordenarme?
5. ¿Qué me aprieta en próximos días?
6. ¿Esta entrada me dio aire real o solo compensó presión?
7. ¿Este pago me ordenó o solo vació caja?
8. ¿Esto fue gasto real o solo reacomodo?
9. ¿Qué decisión mala estoy por tomar si me guío por saldo?
10. ¿Mi semana está más liviana o más tensa que hace unos días?
11. ¿Qué parte de lo que veo sigue siendo incierta?
12. ¿Qué debería corregir para que mi lectura sea más confiable?
13. ¿Qué hecho reciente explica mejor mi situación actual?
14. ¿Estoy financiando presente con presión futura?
15. ¿Dónde está mi dinero, pero sobre todo qué parte importa de verdad?

---

## 5. Qué acciones existen

No botones.
Acciones humanas reales.

### 5.1 Aclarar

Usuario entra para aclarar situación.

### 5.2 Registrar

Usuario incorpora hecho material.

### 5.3 Confirmar

Usuario valida o desambigua algo que Doleth todavía no debe asumir.

### 5.4 Separar

Usuario aparta dinero o distingue lo libre de lo ya tomado.

### 5.5 Cubrir

Usuario decide usar liquidez para resolver presión.

### 5.6 Esperar

Usuario decide no actuar porque realidad todavía no habilita movimiento sano.

### 5.7 Corregir

Usuario endereza interpretación o contexto.

### 5.8 Releer

Usuario vuelve a mirar realidad después de un hecho, cobro o pago.

### 5.9 Comparar

Usuario contrasta presente con hace días o con otra lectura intuitiva.

### 5.10 Preparar

Usuario anticipa presión cercana y reordena margen.

### 5.11 Liberar

Usuario recupera dinero antes comprometido o resuelve tensión.

### 5.12 Decidir

Acción final.
Todo lo demás existe para llegar mejor acá.

---

## 6. Qué información vive siempre visible, cuál bajo demanda y cuál nunca

### 6.1 Siempre visible

Siempre debe estar visible:

- dinero libre actual
- nivel de presión próxima
- cambio material desde última consulta
- próxima advertencia o próxima oportunidad

Razón:
sin eso, Doleth pierde identidad de lectura cotidiana.

### 6.2 Visible bajo demanda

Bajo demanda debe aparecer:

- detalle de compromisos
- explicación de por qué cierto monto no está libre
- historial corto de hechos explicativos
- contexto por cuenta o soporte
- grado de incertidumbre de una lectura específica
- comparación con días o semanas previas

Razón:
agrega comprensión sin contaminar primera lectura.

### 6.3 Nunca debería mostrarse

Nunca debería mostrarse:

- taxonomía interna del sistema
- árboles conceptuales
- estados técnicos
- primitivas ontológicas
- scores opacos
- listas largas de datos no accionables
- conflicto interno entre hipótesis

Razón:
todo eso convierte claridad en carga.

---

## 7. Mapa de atención

Cuando usuario abre Doleth:

### 7.1 Mira primero

- margen real de decisión

Ésa es respuesta primaria.

### 7.2 Mira segundo

- qué fuerza está limitando o ampliando ese margen

Ejemplo:

- compromiso
- cobro
- pago
- tensión cercana

### 7.3 Mira tercero

- qué cambió desde última vez

Porque ahí conecta realidad con memoria reciente.

### 7.4 Ignora naturalmente

Usuario ignora todo lo que:

- no cambia una decisión
- no explica situación
- no altera libertad real

### 7.5 Jamás debería distraerlo

No deberían distraerlo:

- volumen de movimientos
- gráficos vacíos
- saldos parciales sin contexto
- cuentas secundarias sin impacto material
- etiquetas organizativas sin consecuencia

Atención ideal:

**margen -> tensión -> cambio -> detalle**

No al revés.

---

## 8. Filosofía de revelación

### 8.1 Qué aparece inmediatamente

Aparece inmediatamente:

- realidad principal del día
- dirección del cambio
- advertencia o alivio dominante

### 8.2 Qué aparece progresivamente

Aparece progresivamente:

- explicación de compromisos
- razones detrás de un cálculo
- detalle por soporte
- hechos que construyen lectura actual
- comparación con períodos cercanos

### 8.3 Qué nunca requiere interacción

Nunca debería requerir interacción descubrir:

- si hoy estoy libre o apretado
- si mi lectura es confiable o no tanto
- si algo cambió materialmente

Eso debe estar al frente.

### 8.4 Qué solo aparece cuando cambia la realidad

Solo aparece cuando la realidad lo justifica:

- aclaraciones
- alertas
- advertencias de falsa liquidez
- tensión nueva
- liberación nueva
- incertidumbre material que obliga a confirmar

### 8.5 Regla general

Doleth no revela por profundidad técnica.
Revela por necesidad cognitiva.

---

## 9. Carga cognitiva máxima permitida

### 9.1 Decisiones pedidas por sesión

Doleth no debería pedir más de una decisión material y una aclaración menor en una sesión cotidiana normal.

Sesión ideal:

- una lectura
- cero o una corrección
- una decisión mejor

### 9.2 Números simultáneos

No debería exponer más de tres números protagonistas al mismo tiempo.

Ideal:

1. dinero libre
2. presión próxima
3. cambio neto o margen remanente

Más de eso empieza a competir por atención.

### 9.3 Conceptos simultáneos

No debería exigir más de tres conceptos activos en mente a la vez:

- libre
- comprometido
- próximo

Todo concepto adicional debe revelarse solo si agrega claridad real.

### 9.4 Cuándo aparece fatiga

Fatiga aparece cuando usuario debe:

- reconciliar cifras solo
- recordar compromisos desde memoria externa
- interpretar jerga interna
- responder muchas preguntas de setup
- distinguir entre demasiados estados visibles

### 9.5 Cómo evitarla

Se evita así:

- una verdad principal
- una causa principal
- una acción principal
- detalles progresivos
- preguntas raras y valiosas

### 9.6 Umbral duro

Si sesión cotidiana obliga a pensar más como contador que como persona decidiendo, carga cognitiva ya se rompió.

---

## 10. Principios del Mundo Visible

1. Usuario ve realidad decidible, no arquitectura interna.
2. Todo objeto visible debe tener significado humano inmediato.
3. Dinero libre visible vale más que saldo visible.
4. Lo comprometido debe sentirse antes de convertirse en problema.
5. Toda explicación visible debe cerrar una duda real.
6. Nada compite con la verdad principal del día.
7. El cambio importa más que el archivo.
8. Una mala decisión evitada vale más que diez datos mostrados.
9. El soporte donde vive el dinero es secundario frente a lo que ese dinero permite.
10. La certeza debe mostrarse sin vocabulario técnico.
11. La presión debe sentirse sin dramatización.
12. Un detalle solo merece aparecer si mejora comprensión o decisión.
13. La navegación visible sigue preguntas, no estructuras internas.
14. Doleth nunca expone al usuario al costo mental de su propia sofisticación.
15. Todo lo invisible debe existir para simplificar, no para impresionar.
16. Si un objeto visible no puede explicarse en lenguaje cotidiano, no pertenece al mundo visible.
17. Toda cifra visible debe responder “¿y esto qué cambia?”.
18. El usuario debe sentir unidad de verdad, nunca coexistencia de versiones.
19. La experiencia debe hacer obvia la diferencia entre tener y poder usar.
20. El mundo visible de Doleth termina en criterio, no en representación.
