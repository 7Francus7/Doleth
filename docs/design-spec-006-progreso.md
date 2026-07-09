# Design Spec 006 - Progreso

Estado: propuesto
Fecha: 9 de julio de 2026
Pantalla: Progreso
Pregunta madre: **Hacia donde se mueve mi vida financiera?**
Autoridad: especificacion funcional y de diseno de la pantalla Progreso

## 0. Rol actual

Progreso es la superficie de trayectoria de Doleth.

No es reporte mensual generico.
No es grafico decorativo de evolucion.
No es segunda explicacion de causalidad reciente.
No es sintesis del presente.
No es administracion de objetivos en este corte.

Existe para resolver una sola necesidad:

> leer hacia donde se movio la situacion financiera entre periodos comparables y cuanto de ese movimiento acerca o aleja de los propositos declarados.

## 1. Proposito de la pantalla

**Mostrar la direccion del periodo con claridad suficiente para evaluar trayectoria, detectar retroceso material y medir avance contra objetivos declarados sin ruido.**

La pantalla no intenta explicar cada hecho ni administrar objetos.

Responde trayectoria.

- orientacion presente vive en `Ahora`;
- causalidad reciente vive en `Cambios`;
- anticipacion futura vive en `Proximo`;
- composicion estructural vive en `Mi realidad`;
- resolucion puntual vive en `Actuar`.

## 2. Pregunta madre

La pantalla responde:

**Hacia donde se mueve mi vida financiera?**

Subpreguntas permitidas:

- el periodo termino mejor o peor que el anterior;
- cuanto se movio la base entre cierres comparables;
- que dimensiones explican ese movimiento: liquidez, deuda, inversion;
- cuanto avanzaron los objetivos declarados;
- si el periodo puede leerse como cerrado o sigue abierto;
- que evidencia sostiene esa trayectoria;
- si falta un dato material para cerrar la lectura del periodo.

## 3. Que entra y que no entra

## 3.1 Entra

Entra solo lo que describe direccion entre periodos comparables:

- variacion de la base entre cierre anterior y lectura actual;
- contribucion por dimension: liquidez, deuda, inversion;
- avance de objetivos con meta declarada;
- condicion de cierre del periodo: cerrado, abierto o sin comparable;
- retrocesos materiales que comprometen la direccion;
- faltas de dato que impiden cerrar la lectura del periodo.

## 3.2 No entra

No entra:

- hechos individuales y su causalidad detallada;
- compromisos y agenda futura;
- disponible operativo del presente;
- composicion estructural completa;
- creacion o edicion de objetivos;
- registro de movimientos;
- revision mensual asistida;
- comparaciones entre periodos incompatibles;
- proyecciones o escenarios futuros;
- graficos de evolucion decorativos sin respuesta.

## 4. Unidades semanticas necesarias

La pantalla debe poder describirse solo con la gramatica oficial.

Usa estas unidades:

- `Contexto compartido`: periodo observado, base de comparacion, moneda, ambito y completitud.
- `Atencion` opcional: una sola interrupcion material si un retroceso o inconsistencia domina la trayectoria.
- `Sintesis` primaria: direccion y magnitud del movimiento del periodo.
- `Comparacion`: cierre del periodo anterior contra lectura actual, con misma definicion en ambos lados.
- `Progreso`: avance contra objetivos con meta real declarada.
- `Evidencia`: dimensiones que componen el movimiento y su condicion.
- `Resolucion` opcional solo como salida contextual si existe retroceso dominante o dato faltante; no como centro de la pantalla.

No requiere tipos nuevos.

Regla dura de la gramatica: la unidad `Progreso` necesita meta real.
Sin objetivo declarado, la pantalla usa `Comparacion` y `Estado`, y no fabrica avance.

## 5. Separaciones semanticas obligatorias

Progreso debe separar siempre estas tres cosas:

### 5.1 Trayectoria vs causalidad

Progreso lee direccion entre periodos.

No reconstruye:

- que hecho puntual causo cada variacion;
- la cadena causal de la semana;
- la explicacion fina del presente.

Esa causalidad vive en `Cambios`.

### 5.2 Periodo cerrado vs periodo abierto

Un periodo cerrado tiene:

- base inicial y final con misma definicion;
- dimensiones reconciliadas;
- condicion informativa confirmada.

Un periodo abierto tiene un dato pendiente que impide el cierre.

La pantalla debe declarar esa diferencia sin dramatizarla y sin depender solo del color.

### 5.3 Objetivo declarado vs deseo

El avance solo se mide contra metas reales declaradas con monto.

La pantalla no convierte intenciones difusas en porcentajes.

Si no hay objetivos declarados, el bloque de avance desaparece.

## 6. Estados de pantalla

La implementacion inicial debe cubrir cuatro estados:

- `stable`
- `attention`
- `incomplete`
- `empty`

## 6.1 Stable

Debe transmitir:

- el periodo se movio en una direccion legible;
- las dimensiones del movimiento estan reconciliadas;
- los objetivos declarados avanzan de forma visible;
- la trayectoria puede leerse con confianza.

## 6.2 Attention

Debe transmitir:

- hubo un retroceso material que compromete la direccion del periodo;
- o una inconsistencia puntual domina la lectura de trayectoria;
- la prioridad es entender ese punto antes que el resto;
- el problema tiene consecuencia visible sobre la direccion.

## 6.3 Incomplete

Debe transmitir:

- la direccion del periodo se reconoce, pero el cierre no llega;
- falta un dato material, por ejemplo una valuacion al cierre;
- la pantalla no inventa cierre;
- lo conocido orienta la trayectoria, pero no la cierra.

## 6.4 Empty

Debe transmitir:

- todavia no existe un periodo anterior comparable;
- el primer periodo sigue en curso;
- la ausencia de trayectoria es un punto de partida valido;
- la pantalla no fabrica evolucion para parecer util.

## 7. Estructura visual exacta en orden de lectura

La pantalla se compone en este orden:

```text
Rail de contexto
-> Atencion, si existe
-> Sintesis de direccion del periodo
-> Comparacion de cierres
-> Frase interpretativa corta
-> Avance de objetivos declarados, si existen
-> Dato faltante que impide cerrar el periodo, si existe
-> Evidencia de esta trayectoria
```

Ese orden es parte de la spec.

## 7.1 Rail de contexto

Muestra contexto minimo para interpretar la trayectoria:

- periodo observado y base de comparacion;
- moneda;
- ambito;
- completitud de informacion.

Debe ser breve y no competir con la sintesis.

## 7.2 Sintesis de direccion del periodo

Es la respuesta principal de la pantalla.

Debe condensar:

- hacia donde se movio la base en el periodo;
- la magnitud del movimiento;
- si el periodo esta cerrado o abierto;
- acceso a evidencia local.

No debe replicar el disponible de `Ahora` ni el cambio neto reciente de `Cambios`.

## 7.3 Comparacion de cierres

Debe ayudar a leer direccion con dos lecturas equivalentes.

Contrasta:

- cierre del periodo anterior;
- lectura actual de la misma base.

Ambos lados conservan la misma definicion.
Si el criterio cambia, la comparacion lo declara o no existe.

## 7.4 Frase interpretativa corta

Traduce la trayectoria a lenguaje humano.

Debe decir:

- que significa esa direccion;
- que la sostiene o que la compromete;
- sin dramatizar ni prescribir.

## 7.5 Avance de objetivos declarados

Bloque de unidad `Progreso`.

Solo aparece si existen objetivos con meta real declarada.

Cada objetivo debe dejar claro:

- que proposito tiene;
- cuanto se reservo respecto de la meta;
- que porcentaje de avance lleva;
- que condicion informativa tiene.

Sin meta declarada, el bloque desaparece por completo.

## 7.6 Dato faltante que impide cerrar el periodo

Bloque de `Atencion` o `Estado` segun materialidad.

Solo aparece si la ausencia de un dato impide cerrar la lectura del periodo.

No lista tareas tecnicas.
Expone:

- que falta;
- por que importa para cerrar el periodo;
- que parte de la trayectoria queda abierta;
- acceso a evidencia.

## 7.7 Evidencia de esta trayectoria

Cierra la pantalla con una `Evidencia` resumida.

Debe dejar claro:

- que dimensiones componen el movimiento del periodo;
- que parte esta confirmada;
- que parte depende de actualizacion o dato faltante;
- donde abrir evidencia mas profunda.

## 8. Copy base por estado

El copy puede ajustarse en implementacion, pero debe conservar este tono y significado.

## 8.1 Stable

- titulo de sintesis: `Tu situacion se movio hacia arriba en este periodo`
- frase breve: `La direccion del periodo se sostiene con dimensiones ya reconciliadas.`
- comparacion orientativa: `El cierre anterior y la lectura actual ya pueden compararse con confianza.`
- evidencia: `La trayectoria esta sostenida por movimientos de liquidez, deuda e inversion ya conocidos.`

## 8.2 Attention

- titulo de sintesis: `El periodo retrocedio y una causa domina ese movimiento`
- frase breve: `El retroceso importa por su impacto en la direccion, no por volumen de actividad.`
- comparacion orientativa: `Un componente del periodo compromete la trayectoria.`
- evidencia: `La mayor parte del movimiento puede comprobarse, aunque una parte exige confirmacion.`

## 8.3 Incomplete

- titulo de sintesis: `La direccion del periodo se ve, pero el cierre no llega`
- frase breve: `Falta un dato material para cerrar la lectura de este periodo.`
- comparacion orientativa: `Hay direccion visible, pero sin cierre suficiente.`
- evidencia: `Lo conocido orienta la trayectoria; lo faltante todavia la deja abierta.`

## 8.4 Empty

- titulo de sintesis: `Todavia no hay un periodo anterior para comparar`
- frase breve: `Tu trayectoria empieza a existir cuando el primer periodo cierre.`
- comparacion orientativa: `El punto de partida tambien es una lectura valida.`
- evidencia: `No hay trayectoria que comprobar hasta tener dos lecturas comparables.`

## 9. Relacion con Ahora y Cambios

`Progreso` no compite con `Ahora` ni con `Cambios`.

Relacion correcta:

- `Ahora` responde presente operativo;
- `Cambios` explica por que el presente quedo asi;
- `Progreso` lee hacia donde se movio la base entre periodos;
- `Ahora` prioriza orientacion inmediata;
- `Cambios` prioriza causalidad verificable;
- `Progreso` prioriza direccion y proposito.

`Progreso` no debe repetir:

- hero de disponible de `Ahora`;
- cambio neto reciente de `Cambios` con su ventana corta;
- hechos causales individuales;
- atencion operativa del dia.

## 10. Relacion con Actuar

`Actuar` sigue siendo la capa transversal de resolucion.

Reglas:

- `Progreso` no registra movimientos ni edita objetivos;
- no ejecuta aportes ni retiros;
- si existe retroceso dominante o dato faltante material, la salida puede llevar a `/actuar`;
- esa salida es secundaria respecto de la lectura de trayectoria;
- `Progreso` no se convierte en formulario ni wizard.

En estado `attention` o `incomplete`, la salida a `Actuar` puede existir solo si ayuda a corregir o completar la lectura del periodo.

## 11. Relacion con Proximo y Mi realidad

`Progreso` queda separado por tiempo y naturaleza del contenido:

- `Proximo` anticipa compromisos esperados; `Progreso` lee movimiento ya producido entre periodos;
- `Mi realidad` muestra composicion persistente; `Progreso` muestra como esa base se movio;
- la base que `Progreso` compara es la misma base patrimonial que `Mi realidad` sostiene;
- los objetivos que `Progreso` mide viven estructuralmente en `Mi realidad`.

`Progreso` nunca debe mezclar:

- cierre realizado con vencimiento por venir;
- avance medido con proyeccion deseada;
- periodo comparable con ventana arbitraria.

## 12. Evidencia minima de la trayectoria

La evidencia de `Progreso` debe poder abrirse con estos minimos:

- dimensiones incluidas en el movimiento del periodo;
- contribucion de cada dimension con signo visible;
- base de comparacion y su fecha de cierre;
- condicion informativa por dimension: confirmado, parcial, estimado, desactualizado o conflictivo;
- total visible y su reconciliacion con las partes;
- motivo por el que el periodo puede o no puede cerrarse.

Si existe dato faltante material, la evidencia debe sumar:

- que dato falta;
- ultima referencia conocida, si existe;
- por que su ausencia impide cerrar el periodo;
- que parte de la trayectoria queda abierta por ese faltante.

Sin esa evidencia minima, el movimiento del periodo no debe aparecer como contenido principal.

## 13. Criterios de QA mobile 320/390

La pantalla debe validarse en `320` y `390` con estos criterios:

1. La primera vista debe mostrar contexto y sintesis sin exigir lectura densa.
2. Si existe `attention`, debe entrar antes de la sintesis sin convertir la pantalla en alerta permanente.
3. La comparacion debe leerse como dos cierres equivalentes y no como grafico disfrazado.
4. El avance de objetivos debe escanearse con scroll corto y sin convertirse en dashboard.
5. Ningun objetivo puede requerir dos columnas para entender proposito, reservado, meta y avance.
6. La separacion entre periodo cerrado y periodo abierto debe seguir siendo obvia sin depender solo del color.
7. La pantalla no debe parecer reporte mensual al apilar bloques.
8. La evidencia final no debe competir con la sintesis principal.
9. `empty` debe sentirse punto de partida intencional y no ausencia de carga.
10. El paso hacia evidencia debe mantenerse claro aun en estado parcial o conflictivo.

## 14. Riesgos de fuga conceptual

Riesgos principales:

1. convertir `Progreso` en reporte mensual generico;
2. duplicar el cambio neto reciente de `Cambios` bajo otro nombre;
3. fabricar avance de objetivos sin meta declarada;
4. comparar periodos con definiciones distintas sin declararlo;
5. reconstruir causalidad fina de hechos dentro de la pantalla;
6. usar `Actuar` como eje principal en vez de salida secundaria;
7. estimar el cierre de un periodo abierto en silencio;
8. introducir proyecciones futuras disfrazadas de trayectoria;
9. introducir evidencia que crea conclusiones nuevas en vez de verificar las existentes;
10. dramatizar un retroceso cuando no es material.

## 15. Veredicto de implementacion

`Progreso` queda aprobada para implementacion como siguiente corte vertical si se respetan estas condiciones:

1. primer corte read-only con fixtures;
2. cuatro estados iniciales: `stable`, `attention`, `incomplete`, `empty`;
3. trayectoria basada en periodos comparables, nunca en proyecciones;
4. avance solo contra objetivos con meta declarada;
5. evidencia local para el movimiento del periodo;
6. sin componentes nuevos salvo imposibilidad real comprobada;
7. sin tocar el comportamiento visible de `Ahora`, `Actuar`, `Proximo`, `Cambios` ni `Mi realidad`;
8. validacion obligatoria con `lint`, `build`, `build-storybook` y QA mobile `320/390`.

Lectura final de la pantalla:

```text
Hacia donde me muevo
-> cuanto se movio la base este periodo
-> que dimensiones componen ese movimiento
-> cuanto me acerca a lo que declare querer
-> por que esa trayectoria puede comprobarse
```

Si un contenido no mejora esa respuesta, no pertenece a `Progreso`.
