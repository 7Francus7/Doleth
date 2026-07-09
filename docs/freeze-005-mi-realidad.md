# Freeze 005 - Mi realidad

Estado: congelado
Fecha: 9 de julio de 2026
Pantalla: Mi realidad
Autoridad revisada:
- `docs/design-spec-005-mi-realidad.md`
- `src/app/mi-realidad/page.tsx`
- `src/features/reality`

## 1. Estado final de la pantalla

`Mi realidad` queda implementada como un corte vertical read-only con fixtures y evidencia local.

La ruta `/mi-realidad` renderiza hoy el estado `stable`.

Los cuatro estados definidos para el corte existen, pero no viven todos en la ruta:
- `stable` en `src/app/mi-realidad/page.tsx`
- `attention` en Storybook
- `incomplete` en Storybook
- `empty` en Storybook

La pantalla responde composicion estructural y se mantiene separada de orientacion presente, causalidad reciente, anticipacion futura y resolucion operativa.

## 2. Pregunta madre

La implementacion sigue respondiendo la pregunta madre de la spec:

> De que esta compuesta mi situacion?

## 3. Criterio operativo

La implementacion fue construida y validada con este criterio practico:

> De que esta hecha mi situacion y cuanto de eso puedo confiar hoy?

Ese criterio se ve en la composicion real:
- el Hero responde base patrimonial y su nivel de confirmacion;
- la composicion muestra lo que aporta contra lo que compromete valor;
- la coleccion de dominios localiza objetos, cantidades y condicion;
- la evidencia local intenta reconciliar la base visible con sus dominios.

## 4. Alcance congelado

Queda congelado este alcance:
- ruta `src/app/mi-realidad/page.tsx`;
- feature `src/features/reality`;
- `RealityViewModel`;
- fixtures `stable`, `attention`, `incomplete`, `empty`;
- evidencia local para la base patrimonial;
- stories de los cuatro estados;
- QA mobile de la ruta y de las stories.

No queda congelado como parte de este corte:
- datos reales;
- persistencia;
- fetch de backend;
- colecciones secundarias por dominio (Cuentas, Tarjetas, Deudas y cobros, Inversiones, Objetivos);
- detalle individual de objetos;
- alta, edicion o registro de objetos;
- navegacion productiva entre estados.

## 5. Estructura visual real

Orden de lectura real implementado:

```text
Rail de contexto
-> Banner de atencion, si existe
-> Hero con CTA a evidencia local
-> Composicion por dominio
-> Frase interpretativa en StabilityStatement
-> ActionStrip, si existe
-> Dominios de la estructura, si existe
-> Dato faltante o en conflicto, si existe
-> Evidencia de esta composicion
```

Notas reales:
- el Hero abre un Bottom Sheet de evidencia local, salvo en `empty`;
- la composicion vive en un `Surface` con `SectionTitle`, dos `FinancialRow` (lo que aporta y lo que compromete valor) y un resumen textual;
- la frase interpretativa no es un bloque libre: vive en `StabilityStatement`;
- en `attention` e `incomplete` hay `ActionStrip` entre la frase interpretativa y los dominios;
- `empty` elimina el bloque de dominios por completo.

## 6. Estados implementados

### Stable

- base patrimonial `647.500` reconciliada con cinco dominios;
- composicion entre lo aportado (`792.000`) y lo comprometido (`144.500`);
- cinco dominios visibles con cantidad, valor y condicion confirmada;
- sin banner;
- sin `ActionStrip`;
- evidencia final en estado completo.

### Attention

- banner de atencion antes del Hero;
- Hero en tono de estado con base confirmada parcial (`235.500`);
- la cuenta en conflicto queda fuera de la base hasta confirmarse;
- `ActionStrip` con salida a `/actuar`, evidencia y scroll a dominios;
- bloque de dato en conflicto en estado `conflict`;
- evidencia final parcial con linea faltante de cuentas.

### Incomplete

- sin banner;
- Hero parcial con base conocida (`342.500`);
- inversiones fuera de la base por valuacion vencida, con ultima referencia visible (`290.000`, hace 3 meses);
- `ActionStrip` con salida a `/actuar`, evidencia y scroll a dominios;
- bloque de dato faltante en estado parcial;
- evidencia final parcial con linea faltante de inversiones.

### Empty

- Hero en escenario `new`, sin valor fabricado ni cobertura;
- composicion en cero declarada como punto de partida;
- sin dominios listados;
- sin banner ni `ActionStrip`;
- evidencia final completa que declara ausencia de estructura.

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

`RealityEvidenceExperience` conecta el `Hero` con un Bottom Sheet.

El CTA visible del Hero es:
- `Ver evidencia de la base patrimonial`

En `empty` la experiencia renderiza el Hero sin sheet, porque no hay base que reconciliar.

### Bottom Sheet de evidencia

`RealityEvidenceSheet` muestra:
- resumen causal corto de la composicion;
- lista de lineas por dominio;
- total visible;
- `SystemRail` con metadata de corte, moneda, ambito y completitud.

### Validacion local

`validateRealityEvidence` impone tres reglas reales:
- el total de evidencia debe coincidir con el valor visible del Hero;
- evidencia parcial debe tener al menos una linea faltante;
- evidencia completa no puede tener lineas faltantes y debe reconciliar su suma.

## 9. Relacion con Ahora

`Mi realidad` no replica `Ahora`.

Relacion real congelada:
- `Ahora` sigue sintetizando presente operativo y disponible;
- `Mi realidad` muestra base patrimonial y composicion estructural;
- el Hero de `Mi realidad` no expresa capacidad de uso presente;
- la logica de la pantalla es de localizacion y confianza estructural, no de orientacion.

## 10. Relacion con Actuar

`Mi realidad` no resuelve dentro de la propia pantalla.

Relacion real implementada:
- solo `attention` e `incomplete` exponen CTA primaria a `/actuar`;
- esa salida aparece despues de la explicacion principal, no antes;
- `stable` y `empty` no envian a `/actuar`;
- no hay formularios, wizard, alta ni edicion dentro de `Mi realidad`.

## 11. Relacion con Cambios y Proximo

`Mi realidad` queda separada por naturaleza del contenido:
- muestra objetos persistentes, no hechos recientes ni compromisos;
- no trae vencimientos, agenda ni riesgo proyectado;
- no explica causalidad de la variacion: eso vive en `Cambios`.

## 12. Exclusiones explicitas

Queda fuera del freeze:
- colecciones secundarias y detalle por objeto;
- editores y formularios de administracion;
- puesta en marcha para el estado `empty`;
- datos reales;
- integracion con backend;
- sheets separados por cada dominio;
- routing entre estados reales dentro de la app.

## 13. Diferencias reales contra la spec

Estas son las diferencias reales detectadas entre spec e implementacion:

1. La spec describe cuatro estados de pantalla como implementacion inicial; en la app solo vive `stable`.
   Los otros tres estados existen en Storybook, no como rutas o toggles productivos.

2. La evidencia local no esta modelada por dominio individual.
   Hay un solo sheet de base patrimonial por estado, abierto desde el Hero.

3. En `empty` el Hero usa el escenario `new` del design system y no abre evidencia.
   El bloque final de evidencia conserva su link por contrato de `InformationBlock`, aunque declara que no hay composicion que comprobar.

4. La salida contextual en `attention` e `incomplete` incluye una accion secundaria `Ver dominios`.
   No estaba explicitada en la spec, pero no rompe frontera conceptual porque solo hace scroll interno.

5. En `attention`, la fila de cuentas muestra el saldo registrado en conflicto (`412.000`) con estado visual de atencion,
   mientras la evidencia lo trata como linea faltante. La spec no fijaba esa representacion; se eligio para no ocultar la ultima referencia conocida.

6. La composicion usa siempre dos filas agregadas (aporta y compromete) en lugar de una fila por dominio.
   La distribucion por dominio completa vive en la coleccion y en la evidencia local.

## 14. QA realizado

Validaciones tecnicas confirmadas:
- `npm run lint`
- `npm run build`
- `npm run build-storybook`

QA ejecutado:
- `/mi-realidad` en `320` y `390`
- stories `stable`, `attention`, `incomplete`, `empty` en `320` y `390`

Resultado funcional y visual confirmado:
- sin overflow horizontal en ruta ni stories (`scrollWidth == clientWidth` en todos los casos);
- orden de lectura legible en mobile;
- Bottom Sheet de evidencia abre desde el Hero y reconcilia `647.500` en `stable`;
- `ActionStrip` estable en `attention` e `incomplete`;
- `empty` se lee como punto de partida intencional, sin valores fabricados;
- separacion visible entre dominio confiable y dominio abierto sin depender solo del color;
- sin errores de consola.

Tambien se confirmo que no hay cambios en:
- `src/features/now`
- `src/features/act`
- `src/features/next`
- `src/features/changes`
- `src/app/ahora`
- `src/app/actuar`
- `src/app/proximo`
- `src/app/cambios`

## 15. Ruido no bloqueante detectado

Se detecto ruido no bloqueante durante QA:
- el overlay de desarrollo de Next aparece en las capturas locales de la ruta;
- Storybook servido por `python -m http.server` mantiene los avisos conocidos del entorno de documentacion;
- `build-storybook` mantiene warnings de chunks grandes propios del entorno.

Nada de eso bloqueo el corte ni genero overflow o ruptura de `Mi realidad`.

## 16. Riesgos diferidos

Riesgos que quedan diferidos:

1. La ruta productiva solo muestra `stable`; todavia no existe entrada real para recorrer los otros estados en app.
2. La coleccion de dominios no navega a colecciones secundarias; ese nivel estructural aun no existe.
3. El CTA a `/actuar` navega con `window.location.assign`, sin capa de navegacion mas rica ni contexto transferido.
4. La validacion de evidencia es local a fixtures; no prueba todavia integracion con datos vivos.
5. `RealityEvidence` duplica la forma de `ChangeEvidence` y `HorizonEvidence`; si aparece una cuarta superficie con evidencia local, conviene evaluar extraer un modelo compartido.
6. El estado `empty` no conecta con puesta en marcha; el primer objeto todavia no puede registrarse desde la pantalla.

## 17. Veredicto final

`Mi realidad` queda congelada como corte vertical read-only de composicion estructural con fixtures, Storybook y evidencia local suficiente para validar la superficie.

No queda congelada como implementacion total de la spec 005.

Queda congelada como:
- pantalla real en estado `stable`;
- laboratorio validado de cuatro estados via Storybook;
- separacion correcta respecto de `Ahora`, `Actuar`, `Proximo` y `Cambios`;
- base suficiente para colgar despues colecciones secundarias y administracion sin confundir este corte con una version final de producto.
