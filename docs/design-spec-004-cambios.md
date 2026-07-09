# Design Spec 004 - Cambios

Estado: propuesto
Fecha: 8 de julio de 2026
Pantalla: Cambios
Pregunta madre: **Que cambio mi situacion financiera y por que?**
Autoridad: especificacion funcional y de diseno de la pantalla Cambios

## 0. Rol actual

Cambios es la superficie de causalidad reciente de Doleth.

No es historial infinito.
No es feed.
No es reporte mensual.
No es agenda futura.
No es detalle completo de operaciones.

Existe para resolver una sola necesidad:

> entender que hechos ya ocurridos modificaron la lectura financiera actual y por que ese efecto importa ahora.

## 1. Proposito de la pantalla

**Explicar la variacion reciente de la situacion financiera con claridad suficiente para sostener confianza, detectar impacto material y entender la lectura actual sin ruido.**

La pantalla no intenta administrar objetos ni cerrar el mes entero.

Responde causalidad reciente.

- detalle del presente vive en `Ahora`;
- resolucion puntual vive en `Actuar`;
- anticipacion futura vive en `Proximo`;
- administracion estructural vive en `Mi realidad`;
- trayectoria y cierre de periodo viven en `Progreso`.

## 2. Pregunta madre

La pantalla responde:

**Que cambio mi situacion financiera y por que?**

Subpreguntas permitidas:

- que paso;
- cuando paso;
- que objeto afecto;
- cuanto impacto tuvo;
- por que cambia lo que veo hoy;
- que evidencia sostiene esa explicacion;
- si falta un dato material para cerrar la explicacion.

## 3. Que entra y que no entra

## 3.1 Entra

Entran solo hechos realizados con efecto financiero ya producido y con capacidad de explicar una variacion actual:

- ingresos ya registrados;
- gastos ya registrados;
- transferencias ya registradas;
- pagos ya realizados;
- cobros ya realizados;
- ajustes o correcciones ya aplicados;
- variaciones materiales explicables por uno o varios hechos recientes;
- faltas de dato que impiden cerrar una explicacion material.

## 3.2 No entra

No entra:

- compromisos esperados;
- agenda futura;
- vencimientos por venir;
- lista completa de operaciones sin jerarquia;
- reporte del mes completo;
- analisis patrimonial integral;
- recomendaciones o resoluciones operativas;
- administracion de cuentas, tarjetas, deudas o inversiones;
- detalle forense completo de cada operacion;
- comparaciones decorativas sin impacto en la lectura actual.

## 4. Unidades semanticas necesarias

La pantalla debe poder describirse solo con la gramatica oficial.

Usa estas unidades:

- `Contexto compartido`: ventana temporal observada, moneda, ambito y completitud.
- `Atencion` opcional: una sola interrupcion material si hay conflicto o cambio no explicado.
- `Sintesis` primaria: conclusion breve de la variacion reciente.
- `Comparacion`: contraste entre lectura anterior y lectura actual o entre base y resultado.
- `Secuencia`: hechos causales ordenados por tiempo y peso explicativo.
- `Evidencia`: origen, condicion y relacion causal de los cambios materiales.
- `Resolucion` opcional solo como salida contextual si existe inconsistencia; no como centro de la pantalla.

No requiere tipos nuevos.

## 5. Separaciones semanticas obligatorias

Cambios debe separar siempre estas tres cosas:

### 5.1 Realizado vs esperado

Cambios solo muestra hechos ya ocurridos.

No mezcla:

- pago ya realizado con vencimiento futuro;
- cobro registrado con cobro esperado;
- ajuste ya aplicado con riesgo posible.

Todo lo esperado vive en `Proximo`.

### 5.2 Cambio explicado vs dato faltante

Un cambio explicado tiene:

- hecho identificado;
- impacto visible;
- objeto afectado;
- relacion entendible con la lectura actual.

Un dato faltante no es cambio.
Es condicion de incertidumbre.

Si falta un dato material, la pantalla debe declararlo como falta de cierre, no como hecho causal confirmado.

### 5.3 Hecho causal vs accion sugerida

El hecho causal explica lo que ya paso.

La accion sugerida, si existe, solo aparece como salida contextual ante conflicto o dato faltante.

Cambios no convierte explicacion en flujo de resolucion principal.
La explicacion va primero.

## 6. Estados de pantalla

La implementacion inicial debe cubrir cuatro estados:

- `stable`
- `attention`
- `incomplete`
- `empty`

## 6.1 Stable

Debe transmitir:

- la variacion reciente se entiende;
- los hechos principales ya estan explicados;
- no hay conflicto dominante;
- la lectura actual tiene causalidad suficiente.

## 6.2 Attention

Debe transmitir:

- hubo un cambio material que altero fuerte la lectura;
- o existe una inconsistencia puntual que interrumpe la confianza;
- la prioridad es entender ese punto antes que el resto;
- el problema tiene consecuencia visible.

## 6.3 Incomplete

Debe transmitir:

- parte de la variacion se entiende;
- falta un dato material para cerrar la explicacion completa;
- la pantalla no inventa causalidad;
- la evidencia conocida orienta, pero no cierra.

## 6.4 Empty

Debe transmitir:

- no hubo cambios materiales en la ventana observada;
- la ausencia de variacion tambien es una respuesta valida;
- la pantalla no fabrica actividad para parecer util.

## 7. Estructura visual exacta en orden de lectura

La pantalla se compone en este orden:

```text
Rail de contexto
-> Atencion, si existe
-> Sintesis de variacion reciente
-> Comparacion breve
-> Frase interpretativa corta
-> Hechos que explican este cambio
-> Dato faltante que impide cerrar la lectura, si existe
-> Evidencia de esta explicacion
```

Ese orden es parte de la spec.

## 7.1 Rail de contexto

Muestra contexto minimo para interpretar la explicacion:

- ventana temporal observada;
- moneda;
- ambito;
- completitud de informacion.

Debe ser breve y no competir con la sintesis.

## 7.2 Sintesis de variacion reciente

Es la respuesta principal de la pantalla.

Debe condensar:

- que cambio materialmente;
- cual fue el impacto dominante;
- si la explicacion esta cerrada o parcial;
- acceso a evidencia local.

No debe convertirse en mini reporte mensual.

## 7.3 Comparacion breve

Debe ayudar a leer direccion e impacto.

Puede contrastar:

- antes vs ahora;
- base previa vs resultado actual;
- saldo o posicion previa vs saldo o posicion posterior.

Solo entra si la equivalencia es clara y mejora comprension.

## 7.4 Frase interpretativa corta

Traduce la variacion a lenguaje humano.

Debe decir:

- que significa ese cambio para la lectura actual;
- por que importa hoy;
- sin dramatizar ni prescribir.

## 7.5 Hechos que explican este cambio

Bloque de `Secuencia` corto para hechos causales ya realizados.

Muestra hasta tres hechos relevantes ordenados por:

- proximidad temporal;
- peso explicativo;
- relacion causal con la lectura actual.

Cada item debe dejar claro:

- que paso;
- cuando paso;
- sobre que objeto;
- cuanto impacto tuvo.

Si no hay hechos materiales, el bloque desaparece.

## 7.6 Dato faltante que impide cerrar la lectura

Bloque de `Atencion` o `Estado` segun materialidad.

Solo aparece si la ausencia de un dato impide cerrar la explicacion de una variacion material.

No lista tareas tecnicas.
Expone:

- que falta;
- por que importa para entender el cambio;
- que parte de la lectura actual queda abierta;
- acceso a evidencia.

## 7.7 Evidencia de esta explicacion

Cierra la pantalla con una `Evidencia` resumida.

Debe dejar claro:

- que hechos sostienen la explicacion;
- que parte esta confirmada;
- que parte depende de correccion o dato faltante;
- donde abrir evidencia mas profunda.

## 8. Copy base por estado

El copy puede ajustarse en implementacion, pero debe conservar este tono y significado.

## 8.1 Stable

- titulo de sintesis: `La lectura actual se explica con hechos ya registrados`
- frase breve: `Lo que cambio tiene causa visible y no requiere interpretar de mas.`
- comparacion orientativa: `La variacion reciente ya puede leerse con confianza.`
- evidencia: `La explicacion esta sostenida por hechos y montos ya conocidos.`

## 8.2 Attention

- titulo de sintesis: `Hubo un cambio que altero fuerte la lectura actual`
- frase breve: `La variacion principal importa por su impacto, no por volumen de actividad.`
- comparacion orientativa: `Un hecho o una inconsistencia domina esta explicacion.`
- evidencia: `La causa principal puede comprobarse, aunque exige mas atencion.`

## 8.3 Incomplete

- titulo de sintesis: `Parte del cambio se entiende, pero la explicacion no cierra del todo`
- frase breve: `Falta un dato material para confiar por completo en esta lectura.`
- comparacion orientativa: `Hay direccion visible, pero no cierre suficiente.`
- evidencia: `Lo conocido orienta la causalidad; lo faltante todavia la deja abierta.`

## 8.4 Empty

- titulo de sintesis: `No hubo cambios materiales en esta ventana`
- frase breve: `La situacion actual no muestra una variacion reciente que requiera explicacion.`
- comparacion orientativa: `La estabilidad tambien es una respuesta valida.`
- evidencia: `La ausencia de cambios relevantes esta sostenida por la lectura disponible.`

## 9. Relacion con Ahora

`Ahora` y `Cambios` no compiten.

Relacion correcta:

- `Ahora` responde presente;
- `Cambios` explica por que ese presente quedo asi;
- `Ahora` sintetiza estado;
- `Cambios` reconstruye causalidad;
- `Ahora` prioriza orientacion;
- `Cambios` prioriza comprension verificable.

`Cambios` no debe repetir:

- hero principal de disponible de `Ahora`;
- sintesis total del presente;
- composicion estructural completa;
- agenda de accion natural.

## 10. Relacion con Actuar

`Actuar` sigue siendo la capa transversal de resolucion.

Reglas:

- `Cambios` no resuelve operaciones;
- no confirma pagos ni registra movimientos;
- si aparece una inconsistencia material, la salida puede llevar a `/actuar`;
- esa salida es secundaria respecto de la explicacion;
- `Cambios` no se convierte en formulario ni wizard.

En estado `attention` o `incomplete`, la salida a `Actuar` puede existir solo si ayuda a corregir o completar una explicacion material.

## 11. Relacion con Proximo

`Cambios` y `Proximo` deben mantenerse separados por tiempo y naturaleza del hecho.

Relacion correcta:

- `Cambios` muestra realizado;
- `Proximo` muestra esperado;
- `Cambios` explica impacto ya producido;
- `Proximo` anticipa impacto posible;
- `Cambios` no trae compromisos futuros;
- `Proximo` no explica causalidad pasada salvo referencia minima contextual.

`Cambios` nunca debe mezclar:

- pago realizado con vencimiento pendiente;
- cobro ya ingresado con cobro esperado;
- ajuste actual con riesgo futuro.

## 12. Evidencia minima por cambio material

Todo cambio material de `Cambios` debe poder abrir evidencia con estos minimos:

- tipo de hecho realizado;
- fecha o ventana temporal exacta;
- objeto afectado;
- monto o impacto visible;
- lectura previa o base relevante, si existe;
- efecto producido en la lectura actual;
- condicion informativa: confirmado, parcial, estimado, desactualizado o conflictivo;
- motivo por el que ese hecho explica la variacion;
- relacion con la sintesis principal.

Si existe dato faltante material, la evidencia debe sumar:

- que dato falta;
- ultima referencia conocida, si existe;
- por que su ausencia impide cerrar la explicacion;
- que parte de la lectura actual queda abierta por ese faltante.

Sin esa evidencia minima, el cambio no debe aparecer como contenido principal.

## 13. Criterios de QA mobile 320/390

La pantalla debe validarse en `320` y `390` con estos criterios:

1. La primera vista debe mostrar contexto y sintesis sin exigir lectura densa.
2. Si existe `attention`, debe entrar antes de la sintesis sin convertir la pantalla en alerta permanente.
3. La comparacion debe leerse como apoyo de la explicacion y no como grafico disfrazado.
4. La secuencia de hechos debe escanearse con scroll corto y orden claro.
5. Ningun item causal puede requerir dos columnas para entender hecho, objeto, fecha e impacto.
6. La separacion entre cambio explicado y dato faltante debe seguir siendo obvia sin depender solo del color.
7. La pantalla no debe parecer feed infinito al apilar hechos.
8. La evidencia final no debe competir con la sintesis principal.
9. `empty` debe sentirse intencional y no como ausencia de carga.
10. El paso hacia evidencia debe mantenerse claro aun en estado parcial o conflictivo.

## 14. Riesgos de fuga conceptual

Riesgos principales:

1. convertir `Cambios` en feed o historial cronologico sin respuesta;
2. mezclar realizado con esperado;
3. duplicar `Ahora` con otra sintesis del presente;
4. convertir dato faltante en hecho causal confirmado;
5. abrir detalle completo de operacion dentro de la pantalla;
6. usar `Actuar` como eje principal en vez de salida secundaria;
7. escalar a reporte mensual antes de `Progreso`;
8. listar demasiados hechos y perder jerarquia;
9. introducir evidencia que crea nuevas conclusiones en vez de verificar las existentes;
10. dramatizar variacion con color o copy cuando el cambio no es material.

## 15. Veredicto de implementacion

`Cambios` queda aprobada para implementacion como siguiente corte vertical si se respetan estas condiciones:

1. primer corte read-only con fixtures;
2. cuatro estados iniciales: `stable`, `attention`, `incomplete`, `empty`;
3. explicacion causal basada en hechos realizados, nunca en esperados;
4. evidencia local para sintesis y cambios materiales;
5. sin componentes nuevos salvo imposibilidad real comprobada;
6. sin tocar `Ahora`, `Actuar` ni `Proximo`;
7. validacion obligatoria con `lint`, `build`, `build-storybook` y QA mobile `320/390`.

Lectura final de la pantalla:

```text
Que cambio
-> que hecho ya ocurrio
-> que objeto afecto
-> cuanto movio la lectura actual
-> por que esa causalidad puede comprobarse
```

Si un contenido no mejora esa respuesta, no pertenece a `Cambios`.
