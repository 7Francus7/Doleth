# Freeze 004 - Cambios

Estado: congelado
Fecha: 8 de julio de 2026
Pantalla: Cambios
Autoridad revisada:
- `docs/design-spec-004-cambios.md`
- `src/app/cambios/page.tsx`
- `src/features/changes`

## 1. Estado final de la pantalla

`Cambios` queda implementada como un corte vertical read-only con fixtures y evidencia local.

La ruta `/cambios` renderiza hoy el estado `stable`.

Los cuatro estados definidos para el corte existen, pero no viven todos en la ruta:
- `stable` en `src/app/cambios/page.tsx`
- `attention` en Storybook
- `incomplete` en Storybook
- `empty` en Storybook

La pantalla responde causalidad reciente y se mantiene separada de accion futura, administracion estructural y detalle operativo completo.

## 2. Pregunta madre

La implementacion sigue respondiendo la pregunta madre de la spec:

> Que cambio mi situacion financiera y por que?

## 3. Criterio operativo

La implementacion fue construida y validada con este criterio practico:

> Por que hoy estoy distinto que antes?

Ese criterio se ve en la composicion real:
- el Hero responde direccion e impacto visible;
- la comparacion muestra antes vs lectura actual;
- los hechos explicados justifican esa diferencia;
- la evidencia local intenta reconciliar la sintesis visible.

## 4. Alcance congelado

Queda congelado este alcance:
- ruta `src/app/cambios/page.tsx`;
- feature `src/features/changes`;
- `ChangesViewModel`;
- fixtures `stable`, `attention`, `incomplete`, `empty`;
- evidencia local para la sintesis de cambio;
- stories de los cuatro estados;
- QA mobile de la ruta y de las stories.

No queda congelado como parte de este corte:
- datos reales;
- persistencia;
- fetch de backend;
- detalle forense por operacion;
- navegacion productiva entre estados;
- resolucion operativa dentro de la pantalla.

## 5. Estructura visual real

Orden de lectura real implementado:

```text
Rail de contexto
-> Banner de atencion, si existe
-> Hero con CTA a evidencia local
-> Comparacion breve
-> Frase interpretativa en StabilityStatement
-> ActionStrip, si existe
-> Hechos que explican este cambio, si existe
-> Dato faltante que impide cerrar la explicacion, si existe
-> Evidencia de esta explicacion
```

Notas reales:
- el Hero abre un Bottom Sheet de evidencia local;
- la comparacion vive en un `Surface` con `SectionTitle`, dos `FinancialRow` y un resumen textual;
- la frase interpretativa no es un bloque libre: vive en `StabilityStatement`;
- en `attention` e `incomplete` hay `ActionStrip` entre la frase interpretativa y los hechos;
- `empty` elimina el bloque de hechos explicados.

## 6. Estados implementados

### Stable

- lectura actual explicada por hechos ya registrados;
- comparacion entre base previa visible y lectura actual;
- tres hechos causales visibles;
- sin banner;
- sin `ActionStrip`;
- evidencia final en estado completo.

### Attention

- banner de atencion antes del Hero;
- Hero en tono de estado con cobertura abierta;
- comparacion dominada por un ajuste fuerte;
- `ActionStrip` con salida a `/actuar`, evidencia y scroll a hechos;
- bloque de faltante material en estado `conflict`;
- evidencia final parcial.

### Incomplete

- sin banner;
- Hero parcial;
- direccion del cambio visible pero sin cierre completo;
- `ActionStrip` con salida a `/actuar`, evidencia y scroll a hechos;
- bloque de dato faltante en estado parcial;
- evidencia final parcial.

### Empty

- Hero sin cambio material visible;
- comparacion sin variacion;
- sin hechos explicados;
- sin banner;
- sin `ActionStrip`;
- evidencia final completa.

## 7. Componentes reutilizados

La pantalla se arma reutilizando componentes ya existentes:
- `SystemRail`
- `AttentionBanner`
- `Hero`
- `StabilityStatement`
- `ActionStrip`
- `FinancialRow`
- `InformationBlock`
- `BottomSheet`
- `EvidenceRow`
- `SectionTitle`
- `Surface`
- `Divider`

No se agregaron primitives ni composites nuevos al design system compartido.

## 8. Evidencia local implementada

La evidencia local implementada tiene dos capas:

### Hero + experiencia local

`ChangeEvidenceExperience` conecta el `Hero` con un Bottom Sheet.

El CTA visible del Hero es:
- `Ver evidencia del cambio actual`

### Bottom Sheet de evidencia

`ChangeEvidenceSheet` muestra:
- resumen causal corto;
- lista de lineas de evidencia;
- total visible;
- `SystemRail` con metadata de ventana, moneda, ambito y completitud.

### Validacion local

`validateChangeEvidence` impone tres reglas reales:
- el total de evidencia debe coincidir con el valor visible del Hero;
- evidencia parcial debe tener al menos una linea faltante;
- evidencia completa no puede tener lineas faltantes y debe reconciliar su suma.

## 9. Relacion con Ahora

`Cambios` no replica `Ahora`.

Relacion real congelada:
- `Ahora` sigue sintetizando estado actual;
- `Cambios` explica variacion reciente;
- `Cambios` no muestra la sintesis principal de disponible de `Ahora`;
- `Cambios` usa una logica de comparacion y causalidad, no de posicion presente.

## 10. Relacion con Actuar

`Cambios` no resuelve dentro de la propia pantalla.

Relacion real implementada:
- solo `attention` e `incomplete` exponen CTA primaria a `/actuar`;
- esa salida aparece despues de la explicacion principal, no antes;
- `stable` y `empty` no envian a `/actuar`;
- no hay formularios, wizard ni registro operativo dentro de `Cambios`.

## 11. Relacion con Proximo

`Cambios` queda separado de `Proximo` por tiempo del hecho:
- `Cambios` muestra realizado;
- `Proximo` muestra esperado.

En este corte no se mezclan:
- vencimientos futuros;
- agenda por venir;
- riesgo proyectado;
- lectura futura de cobertura.

## 12. Exclusiones explicitas

Queda fuera del freeze:
- historial infinito;
- feed cronologico;
- reporte mensual;
- detalle completo de operaciones;
- agenda futura;
- acciones resolutivas dentro de la misma pantalla;
- datos reales;
- integracion con backend;
- sheets separados por cada hecho;
- routing entre estados reales dentro de la app.

## 13. Diferencias reales contra la spec

Estas son las diferencias reales detectadas entre spec e implementacion:

1. La spec describe cuatro estados de pantalla como implementacion inicial; en la app solo vive `stable`.
   Los otros tres estados existen en Storybook, no como rutas o toggles productivos.

2. La evidencia local no esta modelada por cambio material individual.
   Hay un solo sheet causal por estado, abierto desde el Hero.

3. La salida contextual en `attention` e `incomplete` incluye una accion secundaria `Ver hechos`.
   Esa accion no estaba explicitada en la spec, pero no rompe frontera conceptual porque solo hace scroll interno.

4. `empty` no usa un tratamiento visual dedicado de Hero vacio.
   Reutiliza `Hero` con `scenario: "stable"` y cobertura `empty`.

5. La spec permite hasta tres hechos relevantes.
   `stable` usa tres, `attention` usa dos, `incomplete` usa dos y `empty` elimina el bloque por completo.

6. La spec habla de evidencia minima por cambio material.
   En este corte esa evidencia minima existe a nivel de sheet de sintesis, no como apertura independiente desde cada fila.

## 14. QA realizado

Validaciones tecnicas confirmadas:
- `npm run lint`
- `npm run build`
- `npm run build-storybook`

QA ejecutado:
- `/cambios` en `320` y `390`
- stories `stable`, `attention`, `incomplete`, `empty` en `320` y `390`

Resultado funcional y visual confirmado:
- sin overflow horizontal en ruta ni stories;
- orden de lectura legible en mobile;
- `ActionStrip` estable en `attention` e `incomplete`;
- `empty` sin clipping del titulo;
- `attention` e `incomplete` preservan separacion visible entre cambio explicado y dato faltante.

Tambien se confirmo que no hay cambios en:
- `src/features/now`
- `src/features/act`
- `src/features/next`
- `src/app/ahora`
- `src/app/actuar`
- `src/app/proximo`

## 15. Ruido no bloqueante detectado

Se detecto ruido no bloqueante durante QA:
- `/cambios` local reporta un `404` de recurso no critico;
- Storybook servido por `python -m http.server` reporta CORS de Fontshare;
- Storybook muestra el heading auxiliar `No Preview` en `iframe.html`;
- `build-storybook` mantiene warnings de chunks grandes y plugin timings propios del entorno de documentacion.

Nada de eso bloqueo el corte ni genero overflow o ruptura de `Cambios`.

## 16. Riesgos diferidos

Riesgos que quedan diferidos:

1. La ruta productiva solo muestra `stable`; todavia no existe entrada real para recorrer los otros estados en app.
2. La evidencia causal esta concentrada en el Hero; si en el futuro hace falta evidencia por hecho, ese nivel aun no existe.
3. El CTA a `/actuar` navega con `window.location.assign`, sin capa de navegacion mas rica ni contexto transferido.
4. La validacion de evidencia es local a fixtures; no prueba todavia integracion con datos vivos.
5. El ruido de Storybook por Fontshare puede ensuciar futuras automatizaciones si no se controla el entorno de serving.

## 17. Veredicto final

`Cambios` queda congelada como corte vertical read-only de causalidad reciente con fixtures, Storybook y evidencia local suficiente para validar la superficie.

No queda congelada como implementacion total de la spec 004.

Queda congelada como:
- pantalla real en estado `stable`;
- laboratorio validado de cuatro estados via Storybook;
- separacion correcta respecto de `Ahora`, `Actuar` y `Proximo`;
- base suficiente para seguir evolucionando sin confundir este corte con una version final de producto.
