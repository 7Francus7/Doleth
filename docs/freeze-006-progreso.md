# Freeze 006 - Progreso

Estado: congelado
Fecha: 9 de julio de 2026
Pantalla: Progreso
Autoridad revisada:
- `docs/design-spec-006-progreso.md`
- `src/app/progreso/page.tsx`
- `src/features/progress`
- `src/features/evidence`

## 1. Estado final de la pantalla

`Progreso` queda implementada como un corte vertical read-only con fixtures y evidencia local.

Con este corte quedan implementadas las cinco superficies principales del producto: `Ahora`, `Proximo`, `Cambios`, `Progreso` y `Mi realidad`, mas la capa transversal `Actuar`.

La ruta `/progreso` renderiza hoy el estado `stable`.

Los cuatro estados definidos para el corte existen, pero no viven todos en la ruta:
- `stable` en `src/app/progreso/page.tsx`
- `attention` en Storybook
- `incomplete` en Storybook
- `empty` en Storybook

La pantalla responde trayectoria entre periodos comparables y se mantiene separada de orientacion presente, causalidad reciente, anticipacion futura y composicion estructural.

## 2. Pregunta madre

La implementacion sigue respondiendo la pregunta madre de la spec:

> Hacia donde se mueve mi vida financiera?

## 3. Criterio operativo

La implementacion fue construida y validada con este criterio practico:

> Este periodo termino mejor o peor que el anterior, y cuanto me acerca a lo que declare querer?

Ese criterio se ve en la composicion real:
- el Hero responde direccion y magnitud del movimiento del periodo;
- la comparacion contrasta cierre anterior contra lectura actual de la misma base;
- el avance de objetivos mide reservado contra meta declarada;
- la evidencia local reconcilia el movimiento con sus dimensiones.

## 4. Alcance congelado

Queda congelado este alcance:
- ruta `src/app/progreso/page.tsx`;
- feature `src/features/progress`;
- `ProgressViewModel`;
- fixtures `stable`, `attention`, `incomplete`, `empty`;
- evidencia local para el movimiento del periodo;
- stories de los cuatro estados;
- QA mobile de la ruta y de las stories;
- modulo compartido `src/features/evidence` como parte estructural de este corte.

No queda congelado como parte de este corte:
- datos reales;
- persistencia;
- fetch de backend;
- revision mensual asistida;
- detalle por dimension u objetivo;
- creacion o edicion de objetivos;
- navegacion productiva entre estados;
- proyecciones o escenarios futuros.

## 5. Refactor estructural incluido: evidencia compartida

Este corte incluyo un refactor identificado como riesgo diferido en `freeze-005`:

`now`, `next`, `changes` y `reality` mantenian cuatro copias identicas del mismo patron de evidencia local (modelo, validacion, bottom sheet y experiencia de Hero). `Progreso` iba a ser la quinta.

Se extrajo `src/features/evidence`:
- `EvidenceBreakdown` y `EvidenceBreakdownLine` como modelo unico, con `summary` opcional;
- `validateEvidenceBreakdown` como unica validacion de reconciliacion;
- `EvidenceBreakdownSheet` como unico bottom sheet de evidencia;
- `EvidenceBreakdownExperience` como unica experiencia Hero-evidencia, con `evidence` anulable para heroes sin sheet y `valueActionLabel` por superficie.

Las cuatro features quedaron migradas y `act` quedo intacta porque su evidencia (`RecommendationEvidence`) tiene otra forma real.

Resultado: 47 archivos tocados, 101 lineas agregadas, 602 eliminadas, sin cambio de output renderizado.

Verificacion de no regresion:
- `lint`, `build` y `build-storybook` verdes despues de la migracion;
- stories `stable` de `now`, `next`, `changes` y `reality` sin overflow en `320`;
- story del sheet de `now` renderiza identico con el sheet compartido;
- sheets de `/ahora` y `/cambios` abren y reconcilian sus totales en la ruta real.

## 6. Estructura visual real

Orden de lectura real implementado:

```text
Rail de contexto
-> Banner de atencion, si existe
-> Hero con CTA a evidencia local
-> Comparacion de cierres
-> Frase interpretativa en StabilityStatement
-> ActionStrip, si existe
-> Avance de objetivos, si existen metas declaradas
-> Dato faltante o en conflicto, si existe
-> Evidencia de esta trayectoria
```

Notas reales:
- el Hero abre un Bottom Sheet de evidencia local, salvo en `empty`;
- la comparacion vive en un `Surface` con `SectionTitle`, dos `FinancialRow` (cierre anterior y lectura actual) y un resumen textual;
- la frase interpretativa vive en `StabilityStatement`;
- en `attention` e `incomplete` hay `ActionStrip` entre la frase interpretativa y los objetivos;
- el avance de objetivos usa `CoverageMeter` por meta declarada;
- `empty` elimina el bloque de objetivos por completo.

## 7. Estados implementados

### Stable

- avance del periodo `+68.300` reconciliado con tres dimensiones: liquidez, deuda e inversion;
- comparacion `579.200 -> 647.500` sobre la misma base patrimonial;
- un objetivo declarado con avance visible: fondo de emergencia al `62%`;
- sin banner;
- sin `ActionStrip`;
- evidencia final en estado completo.

### Attention

- banner de atencion antes del Hero;
- Hero en tono de estado con retroceso visible (`73.300`);
- comparacion `720.800 -> 647.500` dominada por una deuda sin cierre confirmado;
- `ActionStrip` con salida a `/actuar`, evidencia y scroll a objetivos;
- bloque de dato en conflicto en estado `conflict`;
- evidencia final parcial con linea faltante de deuda.

### Incomplete

- sin banner;
- Hero parcial con avance conocido (`26.200`);
- comparacion `621.300 -> 647.500` sin cierre por valuacion pendiente;
- `ActionStrip` con salida a `/actuar`, evidencia y scroll a objetivos;
- bloque de dato faltante en estado parcial;
- evidencia final parcial con linea faltante de inversiones.

### Empty

- Hero en escenario `new`, sin valor fabricado ni cobertura;
- comparacion entre inicio del periodo y lectura actual, ambas lecturas reales e iguales;
- sin objetivos listados;
- sin banner ni `ActionStrip`;
- evidencia final completa que declara ausencia de segundo cierre comparable.

## 8. Coherencia entre superficies

Los fixtures de `Progreso` reutilizan la verdad de `Mi realidad`:
- la lectura actual de la base es `647.500` en los cuatro estados con comparacion;
- el objetivo medido es la misma reserva de `75.000` que `Mi realidad` registra, contra una meta declarada de `120.000`.

Eso hace visible la regla de producto: cada territorio muestra una lectura distinta del mismo mundo.

## 9. Componentes reutilizados

La pantalla se arma reutilizando componentes ya existentes:
- `SystemRail`
- `AttentionBanner`
- `Hero`
- `StabilityStatement`
- `ActionStrip`
- `FinancialRow`
- `CoverageMeter`
- `InformationBlock`
- `BottomSheet`
- `EvidenceRow`
- `SectionTitle`
- `Surface`
- `Divider`

No se agregaron primitives ni composites nuevos al design system compartido.

## 10. Evidencia local implementada

La evidencia usa el modulo compartido `src/features/evidence`.

El CTA visible del Hero es:
- `Ver evidencia de la trayectoria`

`EvidenceBreakdownSheet` muestra:
- resumen corto del movimiento del periodo;
- lineas por dimension: liquidez, deuda, inversion;
- total visible;
- `SystemRail` con metadata de periodo, moneda, ambito y completitud.

`validateEvidenceBreakdown` impone las tres reglas ya congeladas:
- el total de evidencia debe coincidir con el valor visible del Hero;
- evidencia parcial debe tener al menos una linea faltante;
- evidencia completa no puede tener lineas faltantes y debe reconciliar su suma.

En `empty` la experiencia renderiza el Hero sin sheet, porque no hay movimiento que reconciliar.

## 11. Relaciones congeladas

- `Ahora`: `Progreso` no muestra disponible ni orientacion inmediata.
- `Cambios`: `Progreso` no reconstruye causalidad de hechos; lee direccion entre cierres.
- `Proximo`: `Progreso` no trae compromisos ni agenda futura.
- `Mi realidad`: `Progreso` compara la misma base que `Mi realidad` compone, sin administrarla.
- `Actuar`: solo `attention` e `incomplete` exponen CTA primaria a `/actuar`, despues de la explicacion principal; `stable` y `empty` no envian a `/actuar`; no hay formularios ni edicion.

## 12. Diferencias reales contra la spec

1. La spec describe cuatro estados de pantalla como implementacion inicial; en la app solo vive `stable`.
   Los otros tres estados existen en Storybook, no como rutas o toggles productivos.

2. La salida contextual en `attention` e `incomplete` incluye una accion secundaria `Ver objetivos`.
   No estaba explicitada en la spec, pero no rompe frontera conceptual porque solo hace scroll interno.

3. En `empty` el bloque final de evidencia conserva su link por contrato de `InformationBlock`, aunque declara que no hay trayectoria que comprobar.

4. El avance de objetivos usa un solo objetivo declarado en los fixtures.
   La spec permite varios; la estructura ya soporta una lista de metas.

5. En `attention` e `incomplete` el medidor del objetivo permanece en estado estable.
   La reserva en si no esta comprometida por el problema del periodo; la spec no fijaba ese detalle.

## 13. QA realizado

Validaciones tecnicas confirmadas:
- `npm run lint`
- `npm run build` (ruta `/progreso` estatica generada)
- `npm run build-storybook`

QA ejecutado:
- `/progreso` en `320` y `390`;
- stories `stable`, `attention`, `incomplete`, `empty` de Progress en `320` y `390`;
- regresion post-refactor: stories `stable` de `now`, `next`, `changes`, `reality` y story del sheet de `now` en `320`;
- sheets de `/ahora`, `/cambios` y `/progreso` abiertos en la ruta real.

Resultado funcional y visual confirmado:
- sin overflow horizontal en ruta ni stories (`scrollWidth == clientWidth` en todos los casos);
- Bottom Sheet de evidencia reconcilia `68.300` en `stable`;
- `ActionStrip` estable en `attention` e `incomplete`;
- `empty` se lee como punto de partida intencional, sin valores fabricados;
- separacion visible entre periodo cerrado y periodo abierto sin depender solo del color;
- sin errores de consola propios de la app.

## 14. Ruido no bloqueante detectado

- el overlay de desarrollo de Next aparece en las capturas locales de la ruta;
- Storybook servido por `python -m http.server` mantiene el CORS conocido de Fontshare;
- `build-storybook` mantiene warnings de chunks grandes propios del entorno.

Nada de eso bloqueo el corte ni genero overflow o ruptura de `Progreso`.

## 15. Riesgos diferidos

1. La ruta productiva solo muestra `stable`; todavia no existe entrada real para recorrer los otros estados en app.
2. El calculo de periodo es ficcion de fixtures; la definicion real de cierre de periodo (mensual, movil, manual) queda para la capa de datos.
3. El CTA a `/actuar` navega con `window.location.assign`, sin capa de navegacion mas rica ni contexto transferido; el patron ya se repite en cuatro superficies.
4. La validacion de evidencia es local a fixtures; no prueba todavia integracion con datos vivos.
5. La revision mensual asistida (ASI-02) sigue sin superficie; `Progreso` es su destino natural cuando exista.
6. El bloque de objetivos no navega a detalle de objetivo; ese nivel aun no existe.

## 16. Veredicto final

`Progreso` queda congelada como corte vertical read-only de trayectoria con fixtures, Storybook y evidencia local suficiente para validar la superficie.

No queda congelada como implementacion total de la spec 006.

Queda congelada como:
- pantalla real en estado `stable`;
- laboratorio validado de cuatro estados via Storybook;
- quinta y ultima superficie principal del producto en pie;
- primera superficie construida sobre el modulo compartido de evidencia, con las cuatro anteriores migradas sin regresion;
- base suficiente para colgar despues revision mensual, detalle por dimension y datos reales sin confundir este corte con una version final de producto.
