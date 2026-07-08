# Design Spec 003 - Proximo

Estado: propuesto
Fecha: 7 de julio de 2026
Pantalla: Proximo
Pregunta madre: **Que viene en los proximos 7 dias que puede afectar mi tranquilidad financiera?**
Autoridad: especificacion funcional y de diseno de la pantalla Proximo

## 0. Rol actual

Proximo es la superficie de anticipacion inmediata de Doleth.

No es agenda.
No es dashboard.
No es lista infinita.
No es calendario completo.
No es administracion de tarjetas, deudas o dominios.

Hoy existe para resolver una sola necesidad:

> entender que hechos, obligaciones, cobros o riesgos proximos pueden cambiar la tranquilidad de los proximos siete dias.

## 1. Proposito de la pantalla

**Mostrar presion financiera inmediata y cobertura proxima con claridad suficiente para preparar la semana sin ruido ni teatro.**

La pantalla no intenta administrar el mes entero ni explicar toda la estructura financiera.

Proximo responde horizonte corto.

- detalle del presente vive en `Ahora`;
- resolucion puntual vive en `Actuar`;
- administracion por objeto vive en `Mi realidad`;
- historia causal vive en `Cambios`;
- trayectoria vive en `Progreso`.

## 2. Pregunta madre

La pantalla responde:

**Que viene en los proximos 7 dias que puede afectar mi tranquilidad financiera?**

Subpreguntas permitidas:

- que vence;
- que se espera cobrar;
- que ya esta confirmado;
- que todavia no esta suficientemente claro;
- si hace falta preparar algo antes de actuar.

## 3. Que entra y que no entra

## 3.1 Entra

Entran solo hechos proximos con impacto material dentro de siete dias y con evidencia disponible:

- obligaciones proximas a vencer;
- cobros esperados con fuente conocida;
- vencimientos relevantes;
- cuotas o compromisos ya existentes;
- riesgos proximos causados por falta de dato material;
- lectura de cobertura del horizonte de siete dias.

## 3.2 No entra

No entra:

- agenda completa;
- calendario mensual;
- lista larga de movimientos;
- administracion de tarjetas o deudas;
- detalle de cuentas;
- prediccion o recomendacion por IA;
- compromisos sin evidencia minima;
- simulaciones;
- comparaciones historicas;
- multiples CTA equivalentes;
- modulos decorativos o densidad de metricas.

## 4. Unidades semanticas necesarias

La pantalla debe poder describirse solo con la gramatica oficial.

Usa estas unidades:

- `Contexto compartido`: horizonte de siete dias, moneda, ambito y cobertura.
- `Atencion` opcional: una sola prioridad material si algo no esta cubierto o vence demasiado pronto.
- `Sintesis` primaria: conclusion de cobertura de los proximos siete dias.
- `Secuencia`: hechos proximos ordenados por fecha y relevancia.
- `Evidencia`: origen, condicion y calculo de la sintesis y de cada item material.
- `Resolucion` opcional: paso contextual hacia `Actuar`.

No requiere tipos nuevos.

## 5. Separaciones semanticas obligatorias

Proximo debe separar siempre tres clases de contenido:

### 5.1 Hecho confirmado

Hecho ya conocido con fecha y monto suficientemente definidos dentro de los proximos siete dias.

Ejemplos:

- cobro confirmado;
- pago ya registrado como pendiente;
- vencimiento con importe conocido.

### 5.2 Obligacion esperada

Compromiso futuro conocido que todavia no ocurrio pero ya forma parte de la lectura.

Ejemplos:

- tarjeta que vence esta semana;
- cuota que entra en el horizonte;
- deuda con fecha esperada.

### 5.3 Riesgo por falta de dato

No es ausencia abstracta de informacion.
Es falta de un dato material que puede cambiar la tranquilidad de los proximos siete dias.

Ejemplos:

- saldo de origen desactualizado para cubrir un vencimiento;
- importe de cierre aun no confirmado;
- cobro esperado sin fecha suficientemente firme.

Regla:

`Proximo` nunca mezcla hecho realizado con esperado, y nunca presenta falta de dato como si fuera obligacion confirmada.

## 6. Estados de pantalla

La implementacion inicial debe cubrir cuatro estados:

- `stable`
- `attention`
- `incomplete`
- `empty`

## 6.1 Stable

Debe transmitir:

- el horizonte de siete dias esta cubierto;
- no aparece una urgencia dominante;
- los proximos hechos son entendibles;
- existe una salida tranquila hacia `Actuar` solo si sirve preparar algo.

## 6.2 Attention

Debe transmitir:

- hay una sola prioridad material que puede romper la tranquilidad;
- esa prioridad aparece antes que el resto;
- el problema tiene consecuencia visible;
- la salida correcta es preparar o resolver esa prioridad primero.

## 6.3 Incomplete

Debe transmitir:

- hay orientacion util, pero no certeza suficiente;
- falta un dato material para confiar en toda la cobertura;
- la pantalla no inventa tranquilidad;
- la salida correcta es revisar antes de decidir.

## 6.4 Empty

Debe transmitir:

- no hay hechos relevantes ni riesgos materiales en los proximos siete dias;
- la ausencia es una respuesta valida;
- la pantalla no fabrica presion donde no existe.

## 7. Estructura visual exacta en orden de lectura

La pantalla se compone en este orden:

```text
Rail de contexto
-> Atencion, si existe
-> Sintesis de cobertura de 7 dias
-> Frase interpretativa breve
-> ActionStrip reducido, si existe una resolucion natural
-> Confirmado en este horizonte
-> Esperado en este horizonte
-> Riesgo por revisar ahora, si existe
-> Confianza de esta lectura
```

Ese orden es parte de la spec.

## 7.1 Rail de contexto

Muestra contexto minimo para interpretar la lectura:

- horizonte de siete dias;
- moneda;
- ambito;
- completitud de informacion.

Debe ser breve y no competir con la sintesis.

## 7.2 Sintesis de cobertura de 7 dias

Es la respuesta principal de la pantalla.

Debe condensar:

- conclusion del horizonte;
- total por cubrir;
- total esperado confirmado, si existe;
- nivel de cobertura o tension;
- acceso a evidencia local.

No debe convertirse en mini dashboard de mes ni en agenda resumida.

## 7.3 Frase interpretativa breve

Traduce la sintesis a lenguaje humano.

Debe decir que significa la cobertura sin dramatizar ni decidir por la persona.

## 7.4 ActionStrip reducido

Aparece solo si existe una siguiente accion natural.

Regla actual:

- una accion primaria contextual;
- hasta dos acciones secundarias;
- sin catalogo de operaciones.

La accion primaria puede llevar a `Actuar`.
Si no existe resolucion natural, el bloque puede desaparecer.

## 7.5 Confirmado en este horizonte

Bloque de `Secuencia` corto para hechos confirmados.

Muestra hasta tres items relevantes ordenados por fecha y peso material.

Puede incluir:

- cobro confirmado;
- pago confirmado;
- vencimiento confirmado.

Si no hay hechos confirmados, el bloque desaparece.

## 7.6 Esperado en este horizonte

Bloque de `Secuencia` para obligaciones o hechos esperados.

Muestra hasta tres items relevantes ordenados por proximidad temporal.

Debe dejar claro que:

- aun no ocurrieron;
- ya importan para la tranquilidad;
- pertenecen al horizonte actual.

Si no hay items esperados, el bloque desaparece.

## 7.7 Riesgo por revisar ahora

Bloque de `Atencion` o `Estado` segun materialidad.

Solo aparece si la falta de dato puede cambiar la lectura de cobertura.

No lista tareas tecnicas.
Expone:

- que falta;
- por que importa esta semana;
- que consecuencia puede tener;
- acceso a evidencia.

## 7.8 Confianza de esta lectura

Cierra la pantalla con una `Evidencia` resumida.

Debe dejar claro:

- si la lectura es completa o parcial;
- que parte esta confirmada;
- que parte depende de expectativa o dato faltante;
- donde abrir evidencia mas profunda.

## 8. Copy base por estado

El copy puede ajustarse en implementacion, pero debe conservar este tono y significado.

## 8.1 Stable

- titulo de sintesis: `Los proximos 7 dias estan cubiertos`
- frase breve: `No aparece nada que exija resolver hoy.`
- accion primaria sugerida: `Preparar lo siguiente`
- confianza: `La lectura esta sostenida por compromisos y saldos conocidos.`

## 8.2 Attention

- titulo de sintesis: `Hay algo esta semana que conviene resolver primero`
- frase breve: `Un compromiso cercano puede romper la cobertura actual.`
- accion primaria sugerida: `Resolver primero esto`
- confianza: `La presion principal esta identificada y puede comprobarse.`

## 8.3 Incomplete

- titulo de sintesis: `La semana se entiende, pero no esta confirmada del todo`
- frase breve: `Falta un dato material para confiar en esta cobertura.`
- accion primaria sugerida: `Revisar antes de decidir`
- confianza: `Lo conocido alcanza para orientar, no para cerrar lectura.`

## 8.4 Empty

- titulo de sintesis: `No aparece nada relevante en los proximos 7 dias`
- frase breve: `No hay compromisos ni riesgos materiales en este horizonte.`
- accion primaria sugerida: ninguna obligatoria
- confianza: `La ausencia de items tambien es una respuesta valida.`

## 9. Relacion con Ahora

`Ahora` y `Proximo` no compiten.

Relacion correcta:

- `Ahora` responde presente;
- `Proximo` profundiza presion futura inmediata;
- `Ahora` puede resumir cobertura de siete dias;
- `Proximo` la abre y la ordena;
- `Ahora` conserva disponible y tranquilidad actual;
- `Proximo` muestra que hechos pueden cambiar eso pronto.

`Proximo` no debe repetir:

- hero de disponible de `Ahora`;
- posicion actual;
- reserva como bloque principal;
- lectura patrimonial completa.

## 10. Relacion con Actuar

`Actuar` sigue siendo la capa transversal de resolucion.

Reglas:

- `Proximo` no ejecuta pagos ni registros;
- si existe una siguiente accion natural, la CTA primaria puede llevar a `/actuar`;
- `Actuar` debe recibir el contexto de una sola prioridad, no una lista;
- `Proximo` nunca se convierte en formulario ni wizard;
- si el estado es `empty`, la salida a `Actuar` puede no existir.

En `attention`, la salida hacia `Actuar` es parte del contrato.
En `stable` o `incomplete`, existe solo si realmente reduce incertidumbre o prepara la semana.

## 11. Evidencia minima necesaria por item

Todo item material de `Proximo` debe poder abrir evidencia con estos minimos:

- tipo de hecho: confirmado, esperado o riesgo por falta de dato;
- monto o impacto esperado, si corresponde;
- fecha o ventana temporal;
- objeto o fuente que lo origina;
- condicion informativa: confirmado, parcial, estimado, desactualizado o conflictivo;
- motivo por el que entra en el horizonte de siete dias;
- relacion con la cobertura general.

Para riesgo por falta de dato, la evidencia debe sumar:

- que dato falta;
- ultima referencia conocida, si existe;
- por que su ausencia puede cambiar la tranquilidad de esta semana.

Sin esa evidencia minima, el item no debe aparecer como contenido principal.

## 12. Criterios de QA mobile 320/390

La pantalla debe validarse en `320` y `390` con estos criterios:

1. La primera vista debe mostrar contexto y sintesis sin exigir lectura densa.
2. Si existe `attention`, debe entrar antes que la sintesis sin empujar todo fuera de control.
3. La sintesis debe leerse como una sola respuesta dominante, no como mosaico.
4. Los bloques `Confirmado` y `Esperado` deben poder escanearse con scroll corto.
5. Ningun item puede requerir dos columnas para entender monto, fecha y estado.
6. Labels, montos y fechas deben conservar jerarquia clara sin truncar significado critico.
7. La separacion entre confirmado, esperado y riesgo debe seguir siendo obvia sin depender solo del color.
8. El `ActionStrip`, si existe, no debe competir con la sintesis ni duplicar evidencia.
9. La pantalla no debe parecer agenda al apilar demasiados rows.
10. `empty` debe sentirse intencional y no como pantalla vacia sin terminar.

## 13. Riesgos de fuga conceptual

Riesgos principales:

1. convertir `Proximo` en agenda o calendario;
2. duplicar `Ahora` con otra sintesis del presente;
3. mezclar realizado con esperado;
4. tratar falta de dato como si fuera deuda real;
5. listar demasiados items y perder jerarquia;
6. abrir administracion de tarjetas o deudas dentro de la pantalla;
7. usar `Actuar` como catalogo en lugar de resolucion puntual;
8. llenar la pantalla con metricas de cobertura que no cambian decision;
9. esconder evidencia de items materiales;
10. exagerar urgencia con color o copy cuando el problema es solo parcial.

## 14. Veredicto de implementacion

`Proximo` queda aprobada para implementacion como siguiente corte vertical si se respetan estas condiciones:

1. primer corte read-only con fixtures;
2. cuatro estados iniciales: `stable`, `attention`, `incomplete`, `empty`;
3. evidencia local para sintesis e items materiales;
4. sin componentes nuevos salvo imposibilidad real comprobada;
5. sin tocar `Ahora` ni `Actuar`;
6. validacion obligatoria con `lint`, `build`, `build-storybook` y QA mobile `320/390`.

Lectura final de la pantalla:

```text
Que viene en siete dias
-> que ya esta confirmado
-> que todavia debo preparar
-> que dato puede romper esta tranquilidad
-> que conviene hacer si hace falta actuar
```

Si un contenido no mejora esa respuesta, no pertenece a `Proximo`.
