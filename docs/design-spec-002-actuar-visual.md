# Design Spec 002 - Actuar Visual

**Estado:** aligned to Dia 7
**Tipo:** autoridad de experiencia visual
**Pantalla:** Actuar
**Autoridad funcional:** `design-spec-002-actuar.md`
**Autoridad visual:** `DESIGN.md`

## 1. Objetivo visual

Actuar debe sentirse como una herramienta personal experta:

- calma;
- claridad;
- control;
- uso frecuente;
- reversibilidad.

La pantalla no comunica actividad. Comunica criterio.

En la primera lectura debe quedar claro que:

1. hay una sola recomendacion relevante;
2. puede explicarse;
3. nada ocurre sin consentimiento;
4. el flujo termina rapido.

## 2. Jerarquia real

La jerarquia visual vigente es:

```text
contexto
  -> recomendacion
  -> razon
  -> impacto
  -> decision
```

Cuando el usuario sale del estado inicial, la pantalla se reduce:

```text
contexto
  -> recomendacion
  -> razon
  -> estado de decision
```

Impacto solo pertenece al estado inicial.
No debe permanecer despues de confirmar, postergar o descartar.

## 3. Zonas

### Contexto

El rail superior solo orienta:

- desde donde llega;
- vigencia de la informacion;
- nivel de confianza.

No compite con la recomendacion.

### Recomendacion

Es el bloque dominante.
Debe contener:

- etiqueta de estado;
- conclusion;
- importe;
- consecuencia;
- acceso a evidencia.

La recomendacion permanece visible en todos los estados del flujo.

### Razon

La razon va fuera de la superficie principal y explica por que esa accion
merece prioridad ahora.

Debe ser una sola lectura breve.
No enumera reglas internas.

### Impacto

Impacto existe para comparar actuar vs esperar.
Solo aparece cuando la pantalla todavia esta abierta a decidir.

Si la decision ya fue tomada, la comparacion se retira.

### Decision

La zona de decision concentra:

- una continuacion principal;
- dos salidas laterales validas.

No debe parecer wizard ni checklist.

## 4. Estados visibles

### Idle

Debe mostrar la secuencia completa:

- recomendacion;
- razon;
- impacto;
- decision principal;
- dejar para despues;
- no insistir con esto.

En `390` y `320`, la pantalla debe seguir sintiendose tranquila.

### Confirming

La recomendacion y la razon permanecen.
Impacto desaparece.

La confirmacion contextual muestra solo datos materiales.
En la implementacion actual son cuatro grupos:

- importe;
- origen;
- destino;
- efecto esperado.

### Confirmed

Confirmed es un recibo local breve.
No es un resultado operativo.

Debe:

- reducir texto;
- evitar repetir la explicacion completa;
- sostener la sensacion de control;
- ofrecer deshacer o cerrar.

### Deferred

Deferred acorta la pantalla.
La idea es pausa, no deuda emocional.

Debe dejar una salida simple para retomar.

### Dismissed

Dismissed tambien acorta la pantalla.
La idea es no insistir, no bloquear.

Debe dejar abierta la posibilidad de volver a verla si cambia el contexto.

## 5. Tono de copy

El copy de Actuar debe sonar:

- personal;
- directo;
- experto;
- no teatral.

Debe evitar:

- lenguaje de SaaS publico;
- onboarding;
- promesas de automatizacion futura;
- sobre-explicacion preventiva;
- confirmaciones infladas para parecer transaccionales.

## 6. Reglas de reduccion

Actuar mejora cuando elimina.

Por lo tanto:

- si impacto ya no ayuda, se retira;
- si un detalle no cambia la decision, no entra en confirmacion;
- si el usuario ya decidio, la pantalla se acorta;
- si el recibo puede decir menos sin perder control, debe decir menos;
- si `320` se siente pesado, primero se reduce texto y permanencia.

## 7. Mobile

### 320

En `320`, la experiencia debe priorizar:

- una sola columna clara;
- CTA principal limpio;
- salidas secundarias apiladas sin aire innecesario;
- ausencia de bloques residuales despues de decidir.

### 390

En `390`, la misma jerarquia debe respirar mejor sin agregar contenido nuevo.

Mas alto no significa mas explicacion.

## 8. Criterios de validacion

La experiencia visual queda alineada cuando:

1. la recomendacion se entiende sin abrir evidencia;
2. el usuario puede decidir rapido;
3. confirmed no repite demasiado;
4. deferred y dismissed acortan la pantalla;
5. la recomendacion sigue siendo el ancla en todos los estados;
6. `320` y `390` se sienten livianos;
7. la pantalla no suena ni se ve como producto para desconocidos.

## 9. Fuente de verdad

La experiencia de Actuar se define por este documento, `DESIGN.md`
y la implementacion actual de `src/features/act`.

Si una futura exploracion visual contradice el comportamiento real,
este documento debe ajustarse antes de crear otra capa de detalle.
