# Freeze 003 - Proximo

Estado: congelado con riesgos diferidos
Fecha: 8 de julio de 2026
Pantalla: Proximo
Base auditada:
- `src/app/proximo/page.tsx`
- `src/features/next/**`
- `docs/design-spec-003-proximo.md`

## 1. Estado final de la pantalla

`/proximo` existe como pantalla read-only montada sobre fixtures locales.

La ruta real renderiza solo `stableNextFixture`:

```tsx
export default function ProximoPage() {
  return <NextPage model={stableNextFixture} />;
}
```

El corte implementado no consume datos reales ni cambia de estado en runtime. La pantalla visible en la app queda fijada en estado `stable`. Los otros estados viven en fixtures y stories.

## 2. Pregunta madre

La implementacion sigue respondiendo la misma pregunta madre de la spec:

**Que viene en los proximos 7 dias que puede afectar mi tranquilidad financiera?**

La respuesta real se da desde una lectura de cobertura a 7 dias, separando confirmado, esperado y, cuando aplica, riesgo por revisar.

## 3. Alcance congelado

Queda congelado este alcance real:

- ruta `/proximo` basada en `stableNextFixture`;
- feature `src/features/next` con cuatro estados de fixture;
- evidencia local de cobertura en bottom sheet;
- CTA hacia `/actuar` sin payload contextual;
- lectura solo de interfaz, sin carga dinamica ni persistencia.

No queda congelada una implementacion dinamica ni integrada a datos reales porque hoy no existe.

## 4. Estructura visual real

El orden visual implementado en `NextPage.tsx` es este:

1. `SystemRail`
2. `AttentionBanner` opcional
3. `Hero` dentro de `HorizonEvidenceExperience`
4. `StabilityStatement`
5. `ActionStrip` opcional
6. bloque `Confirmado en este horizonte` opcional
7. bloque `Esperado en este horizonte` opcional
8. bloque `Riesgo por revisar ahora` opcional
9. bloque final `Confianza de esta lectura`

Diferencias reales contra la spec:

- la ruta no muestra un estado `attention` o `incomplete` real; solo `stable`;
- la sintesis principal y la evidencia local quedan unificadas dentro de `Hero` + bottom sheet;
- la frase interpretativa no vive como bloque independiente: hoy la cumple `StabilityStatement`;
- la evidencia final no cierra con un rail resumido dedicado: cierra con `InformationBlock`;
- no hay evidencia por item; la evidencia local existe a nivel de cobertura general.

## 5. Estados implementados

Estados presentes en `src/features/next/fixtures`:

- `stable`
- `attention`
- `incomplete`
- `empty`

Estado real por superficie:

- `/proximo`: solo `stable`
- Storybook: `stable`, `attention`, `incomplete`, `empty`

Cobertura real por estado:

- `stable`: rail completo, hero estable, statement estable, action strip, confirmado, esperado, confianza final.
- `attention`: banner superior, hero en tension, action strip, confirmado, esperado, confianza final.
- `incomplete`: hero parcial, action strip, confirmado, esperado, bloque de riesgo, confianza final.
- `empty`: hero vacio, sin acciones, sin confirmado, sin esperado, sin riesgo, solo confianza final.

## 6. Componentes reutilizados

La pantalla reutiliza componentes existentes del design system y del producto:

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

No se detecta un componente visual nuevo fuera de `NextPage` y la experiencia de evidencia `HorizonEvidenceExperience` / `HorizonEvidenceSheet`.

## 7. Evidencia local implementada

La evidencia local hoy existe de forma concreta en estos puntos:

- cada fixture de estado define `hero` y `evidence`;
- `validateHorizonEvidence` obliga a que el total visible del hero coincida con la evidencia local;
- `HorizonEvidenceSheet` muestra lineas, total y metadata de la cobertura;
- el hero abre esa evidencia mediante `onValueClick`;
- el bloque final `Confianza de esta lectura` agrega una segunda capa de lectura resumida.

Esto si esta implementado:

- reconciliacion entre hero y evidencia;
- metadatos de horizonte, moneda, ambito y completitud;
- estado parcial cuando falta un dato material.

Esto no esta implementado:

- drilldown por item;
- evidencia contextual enviada a `/actuar`;
- evidencia basada en datos reales.

## 8. Relacion con Ahora

No se toco `Ahora`.

Confirmacion local:

- `git status` no muestra cambios en `src/app/ahora`
- no hay archivos nuevos ni editados fuera de `src/app/proximo` y `src/features/next` dentro de este corte

Relacion real entre pantallas:

- `Ahora` sigue separada de `Proximo`;
- `Proximo` no reusa el hero de disponible de `Ahora`;
- `Proximo` no importa logica ni fixtures de `Ahora`;
- la relacion hoy es conceptual, no tecnica.

## 9. Relacion con Actuar

No se toco `Actuar`.

Confirmacion local:

- `git status` no muestra cambios en `src/app/actuar`

Relacion real implementada:

- cualquier accion distinta de `evidence` termina en `window.location.assign("/actuar")`;
- no existe payload, querystring ni handoff de prioridad;
- `Proximo` deriva a `Actuar`, pero todavia no le transfiere contexto material.

Esto queda por debajo de la spec original, que esperaba una salida mas contextual.

## 10. Exclusiones explicitas

Quedan explicitamente fuera del freeze porque no estan implementadas:

- datos reales;
- calendario;
- agenda mensual;
- administracion de tarjetas o deudas;
- formularios;
- ejecucion de pagos o registros;
- filtros;
- cambio de estado en runtime dentro de `/proximo`;
- evidencia por fila;
- handoff contextual hacia `/actuar`.

## 11. QA realizado

Validaciones corridas localmente el 8 de julio de 2026:

- `npm run lint`: OK
- `npm run build`: OK
- `npm run build-storybook`: OK

QA visual realizado:

- `/proximo` en `320` y `390`: la ruta `stable` carga, no rompe layout general y mantiene rail, hero, statement, bloques de secuencia y confianza final.
- story `stable` en `320` y `390`: carga y refleja la misma estructura de la ruta real.
- story `attention` en `320` y `390`: carga banner superior, hero en tension y secuencia esperada.
- story `incomplete` en `320` y `390`: carga hero parcial, riesgo por revisar y confianza parcial.
- story `empty` en `320` y `390`: carga version vacia sin bloques de secuencia ni acciones.

Correcciones verificadas en QA:

- en `320` y `390`, el `ActionStrip` reducido ya no recorta `Actualizar lectura`; los secundarios apilan en mobile;
- en `320` y `390`, el titulo del hero en `empty` ya no se recorta y resuelve el wrap en varias lineas.

## 12. Riesgos diferidos

Riesgos diferidos al freeze:

- `/proximo` solo expone `stable` en la app, no los cuatro estados;
- la navegacion a `/actuar` es generica y sin contexto;
- la pantalla sigue siendo fixture-first, no data-first;
- la evidencia local esta centrada en cobertura general, no en cada item.

## 13. Veredicto final

`Proximo` queda congelada como corte vertical de fixtures y lectura local de cobertura, no como implementacion completa de la spec.

El freeze refleja la implementacion real:

- pantalla real en `/proximo`: `stable`
- estados restantes: solo en Storybook
- separacion con `Ahora` y `Actuar`: preservada
- riesgos mobile de clipping corregidos y revalidados en `320/390`

Veredicto: congelar documentando el estado actual y sus desvios reales, sin presentar este corte como cierre total de la spec 003.
