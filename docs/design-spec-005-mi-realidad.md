# Design Spec 005 - Mi realidad

Estado: propuesto
Fecha: 9 de julio de 2026
Pantalla: Mi realidad
Pregunta madre: **De que esta compuesta mi situacion?**
Autoridad: especificacion funcional y de diseno de la pantalla Mi realidad

## 0. Rol actual

Mi realidad es la superficie estructural de Doleth.

No es dashboard.
No es sintesis del presente.
No es menu de modulos.
No es puerta obligatoria para obtener respuestas.
No es editor de objetos en este corte.

Existe para resolver una sola necesidad:

> ver de que objetos esta compuesta la situacion financiera, en que condicion esta cada dominio y donde vive cada cosa.

## 1. Proposito de la pantalla

**Mostrar la composicion estructural de la situacion financiera con claridad suficiente para localizar objetos, confiar en la base patrimonial y detectar que parte de la estructura necesita administracion.**

La pantalla no intenta responder como estoy hoy ni que cambio.

Responde composicion.

- orientacion presente vive en `Ahora`;
- causalidad reciente vive en `Cambios`;
- anticipacion futura vive en `Proximo`;
- resolucion puntual vive en `Actuar`;
- trayectoria y cierre de periodo viven en `Progreso`.

## 2. Pregunta madre

La pantalla responde:

**De que esta compuesta mi situacion?**

Subpreguntas permitidas:

- donde vive mi dinero;
- que consumo financiado tengo;
- que debo y que me deben;
- que capital invertido tengo;
- que dinero tiene proposito reservado;
- que condicion informativa tiene cada dominio;
- si falta un dato estructural material.

## 3. Que entra y que no entra

## 3.1 Entra

Entran solo objetos financieros persistentes y su condicion estructural:

- dinero y cuentas;
- tarjetas y su consumo financiado;
- deudas y cobros;
- inversiones;
- objetivos y reservas;
- base patrimonial que esos dominios componen;
- condicion informativa de cada dominio: confirmado, parcial, desactualizado o conflictivo;
- faltas de dato estructural que dejan la composicion abierta.

## 3.2 No entra

No entra:

- disponible operativo del presente;
- sintesis de orientacion que compita con `Ahora`;
- hechos recientes y su causalidad;
- compromisos y agenda futura;
- recomendaciones o resoluciones operativas;
- registro, edicion o alta de objetos;
- detalle individual de cuenta, tarjeta, deuda, inversion u objetivo;
- trayectoria de largo plazo;
- comparaciones de periodo.

## 4. Unidades semanticas necesarias

La pantalla debe poder describirse solo con la gramatica oficial.

Usa estas unidades:

- `Contexto compartido`: fecha de corte, moneda, ambito y completitud.
- `Atencion` opcional: una sola interrupcion material si un objeto estructural esta en conflicto.
- `Sintesis` primaria: base patrimonial que la estructura compone.
- `Composicion`: distribucion de esa base entre dominios.
- `Coleccion`: dominios estructurales como objetos homogeneos localizables.
- `Estado`: condicion informativa por dominio.
- `Evidencia`: origen, condicion y reconciliacion de la base patrimonial.
- `Resolucion` opcional solo como salida contextual si existe conflicto o dato faltante; no como centro de la pantalla.

No requiere tipos nuevos.

## 5. Separaciones semanticas obligatorias

Mi realidad debe separar siempre estas tres cosas:

### 5.1 Estructura vs orientacion

Mi realidad muestra de que esta compuesta la situacion.

No responde:

- cuanto puedo usar hoy;
- como estoy respecto de ayer;
- que conviene hacer ahora.

Toda orientacion presente vive en `Ahora`.

### 5.2 Dominio confiable vs dominio abierto

Un dominio confiable tiene:

- objetos identificados;
- valores con fecha valida;
- condicion informativa confirmada.

Un dominio abierto tiene un dato desactualizado, parcial o en conflicto.

La pantalla debe declarar esa diferencia sin dramatizarla y sin depender solo del color.

### 5.3 Composicion vs administracion

La composicion explica de que esta hecha la situacion.

La administracion cambia esa estructura.

En este corte la pantalla es read-only: la administracion, si aparece, es solo salida contextual hacia `Actuar` ante conflicto o dato faltante.

## 6. Estados de pantalla

La implementacion inicial debe cubrir cuatro estados:

- `stable`
- `attention`
- `incomplete`
- `empty`

## 6.1 Stable

Debe transmitir:

- la estructura esta completa y localizable;
- cada dominio tiene condicion confirmada;
- la base patrimonial se reconcilia con sus partes;
- no hay conflicto estructural dominante.

## 6.2 Attention

Debe transmitir:

- un objeto estructural esta en conflicto material;
- ese conflicto compromete la confianza en la base;
- la prioridad es entender ese punto antes que recorrer el resto;
- el conflicto tiene consecuencia visible sobre la composicion.

## 6.3 Incomplete

Debe transmitir:

- la estructura se reconoce pero no cierra completa;
- falta un dato estructural material, por ejemplo una valuacion vigente o un saldo confirmado;
- la pantalla no inventa valores;
- lo conocido orienta la composicion, pero no la cierra.

## 6.4 Empty

Debe transmitir:

- todavia no hay objetos estructurales registrados;
- la ausencia de estructura es un punto de partida valido;
- la pantalla no fabrica composicion para parecer util;
- la puesta en marcha vive fuera de este corte.

## 7. Estructura visual exacta en orden de lectura

La pantalla se compone en este orden:

```text
Rail de contexto
-> Atencion, si existe
-> Sintesis de base patrimonial
-> Composicion por dominio
-> Frase interpretativa corta
-> Dominios de la estructura
-> Dato faltante que deja la composicion abierta, si existe
-> Evidencia de esta composicion
```

Ese orden es parte de la spec.

## 7.1 Rail de contexto

Muestra contexto minimo para interpretar la estructura:

- fecha de corte de la lectura;
- moneda;
- ambito;
- completitud de informacion.

Debe ser breve y no competir con la sintesis.

## 7.2 Sintesis de base patrimonial

Es la respuesta principal de la pantalla.

Debe condensar:

- que base patrimonial compone la estructura;
- si esa base esta cerrada o abierta;
- acceso a evidencia local.

No debe replicar el disponible de `Ahora` ni presentarse como capacidad de uso presente.

## 7.3 Composicion por dominio

Debe mostrar como la base se distribuye entre dominios.

Reglas:

- las partes corresponden al mismo total, fecha, moneda y alcance;
- una parte sin valor confirmado se declara como abierta, no se estima en silencio;
- la composicion no es grafico decorativo: es lectura de distribucion.

## 7.4 Frase interpretativa corta

Traduce la composicion a lenguaje humano.

Debe decir:

- que significa esa estructura;
- que parte sostiene la confianza o la deja abierta;
- sin dramatizar ni prescribir.

## 7.5 Dominios de la estructura

Bloque de `Coleccion` para los dominios estructurales.

Muestra hasta cinco dominios:

- dinero y cuentas;
- tarjetas;
- deudas y cobros;
- inversiones;
- objetivos y reservas.

Cada item debe dejar claro:

- que dominio es;
- cuantos objetos contiene;
- que valor aporta o compromete;
- que condicion informativa tiene.

Un dominio sin objetos no aparece como fila vacia decorativa: o desaparece o se declara como no registrado si eso ayuda a entender la estructura.

## 7.6 Dato faltante que deja la composicion abierta

Bloque de `Atencion` o `Estado` segun materialidad.

Solo aparece si la ausencia de un dato estructural impide cerrar la composicion.

No lista tareas tecnicas.
Expone:

- que falta;
- que dominio queda abierto;
- por que importa para confiar en la base;
- acceso a evidencia.

## 7.7 Evidencia de esta composicion

Cierra la pantalla con una `Evidencia` resumida.

Debe dejar claro:

- que dominios sostienen la base patrimonial;
- que parte esta confirmada;
- que parte depende de actualizacion o dato faltante;
- donde abrir evidencia mas profunda.

## 8. Copy base por estado

El copy puede ajustarse en implementacion, pero debe conservar este tono y significado.

## 8.1 Stable

- titulo de sintesis: `Tu situacion esta compuesta por objetos ya registrados`
- frase breve: `Cada dominio tiene valor, fecha y condicion conocidos.`
- composicion orientativa: `La base patrimonial se reconcilia con sus partes.`
- evidencia: `La composicion esta sostenida por objetos y valores ya conocidos.`

## 8.2 Attention

- titulo de sintesis: `Un objeto de tu estructura esta en conflicto`
- frase breve: `El conflicto importa por lo que compromete de la base, no por su tamano.`
- composicion orientativa: `Un dominio domina la duda sobre esta estructura.`
- evidencia: `La composicion puede comprobarse, aunque una parte exige revision.`

## 8.3 Incomplete

- titulo de sintesis: `Tu estructura se reconoce, pero no cierra completa`
- frase breve: `Falta un dato estructural para confiar por completo en esta base.`
- composicion orientativa: `Hay distribucion visible, pero sin cierre suficiente.`
- evidencia: `Lo registrado sostiene la composicion; lo faltante la deja abierta.`

## 8.4 Empty

- titulo de sintesis: `Todavia no hay objetos registrados en tu estructura`
- frase breve: `Tu situacion todavia no tiene composicion visible en Doleth.`
- composicion orientativa: `El punto de partida tambien es una estructura valida.`
- evidencia: `No hay composicion que comprobar hasta registrar el primer objeto.`

## 9. Relacion con Ahora

`Ahora` y `Mi realidad` no compiten.

Relacion correcta:

- `Ahora` responde presente operativo;
- `Mi realidad` responde composicion estructural;
- `Ahora` sintetiza disponible;
- `Mi realidad` sostiene la base sobre la que ese disponible existe;
- `Ahora` prioriza orientacion;
- `Mi realidad` prioriza localizacion y administracion.

`Mi realidad` no debe repetir:

- hero de disponible de `Ahora`;
- lectura de capacidad de uso presente;
- atencion operativa del dia;
- agenda de accion natural.

## 10. Relacion con Actuar

`Actuar` sigue siendo la capa transversal de resolucion.

Reglas:

- `Mi realidad` no registra ni edita objetos en este corte;
- no confirma saldos ni actualiza valuaciones;
- si existe conflicto o dato faltante material, la salida puede llevar a `/actuar`;
- esa salida es secundaria respecto de la composicion;
- `Mi realidad` no se convierte en formulario ni wizard.

En estado `attention` o `incomplete`, la salida a `Actuar` puede existir solo si ayuda a corregir o completar un dato estructural material.

## 11. Relacion con Cambios y Proximo

`Mi realidad` queda separada por naturaleza del contenido:

- `Cambios` explica hechos ya ocurridos; `Mi realidad` muestra objetos persistentes;
- `Proximo` anticipa compromisos; `Mi realidad` no trae agenda;
- un mismo objeto puede aparecer en varias superficies, pero su hogar canonico de administracion es `Mi realidad`;
- `Mi realidad` no explica por que la estructura quedo asi: esa causalidad vive en `Cambios`.

`Mi realidad` nunca debe mezclar:

- saldo estructural con vencimiento pendiente;
- valuacion registrada con proyeccion futura;
- objeto persistente con hecho puntual.

## 12. Evidencia minima de la composicion

La evidencia de `Mi realidad` debe poder abrirse con estos minimos:

- dominios incluidos en la base patrimonial;
- valor que aporta o compromete cada dominio;
- fecha o corte de cada valor;
- condicion informativa por dominio: confirmado, parcial, estimado, desactualizado o conflictivo;
- total visible y su reconciliacion con las partes;
- motivo por el que la base puede o no puede cerrarse.

Si existe dato faltante material, la evidencia debe sumar:

- que dato falta;
- ultima referencia conocida, si existe;
- por que su ausencia deja la composicion abierta;
- que dominio queda abierto por ese faltante.

Sin esa evidencia minima, la base patrimonial no debe aparecer como contenido principal.

## 13. Criterios de QA mobile 320/390

La pantalla debe validarse en `320` y `390` con estos criterios:

1. La primera vista debe mostrar contexto y sintesis sin exigir lectura densa.
2. Si existe `attention`, debe entrar antes de la sintesis sin convertir la pantalla en alerta permanente.
3. La composicion debe leerse como distribucion y no como grafico disfrazado.
4. La coleccion de dominios debe escanearse con scroll corto y orden claro.
5. Ningun dominio puede requerir dos columnas para entender nombre, cantidad, valor y condicion.
6. La separacion entre dominio confiable y dominio abierto debe seguir siendo obvia sin depender solo del color.
7. La pantalla no debe parecer menu de modulos al apilar dominios.
8. La evidencia final no debe competir con la sintesis principal.
9. `empty` debe sentirse punto de partida intencional y no ausencia de carga.
10. El paso hacia evidencia debe mantenerse claro aun en estado parcial o conflictivo.

## 14. Riesgos de fuga conceptual

Riesgos principales:

1. convertir `Mi realidad` en dashboard o segunda sintesis del presente;
2. convertir la pantalla en menu de modulos sin respuesta;
3. duplicar el disponible de `Ahora` bajo el nombre de patrimonio;
4. mezclar estructura persistente con hechos o compromisos;
5. abrir detalle completo de objeto dentro de la pantalla;
6. usar `Actuar` como eje principal en vez de salida secundaria;
7. estimar valores abiertos en silencio para cerrar la composicion;
8. listar dominios vacios decorativos para parecer completa;
9. introducir evidencia que crea conclusiones nuevas en vez de verificar las existentes;
10. dramatizar un conflicto estructural cuando no es material.

## 15. Veredicto de implementacion

`Mi realidad` queda aprobada para implementacion como siguiente corte vertical si se respetan estas condiciones:

1. primer corte read-only con fixtures;
2. cuatro estados iniciales: `stable`, `attention`, `incomplete`, `empty`;
3. composicion basada en objetos persistentes, nunca en hechos ni compromisos;
4. evidencia local para la base patrimonial;
5. sin componentes nuevos salvo imposibilidad real comprobada;
6. sin tocar `Ahora`, `Actuar`, `Proximo` ni `Cambios`;
7. validacion obligatoria con `lint`, `build`, `build-storybook` y QA mobile `320/390`.

Lectura final de la pantalla:

```text
De que esta compuesta mi situacion
-> que dominios existen
-> que objetos contiene cada uno
-> que valor y condicion tiene cada parte
-> por que esa base puede comprobarse
```

Si un contenido no mejora esa respuesta, no pertenece a `Mi realidad`.
