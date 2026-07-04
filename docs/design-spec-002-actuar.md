# Design Spec 002 - Actuar

**Estado:** aligned to Dia 7
**Tipo:** autoridad funcional
**Pantalla:** Actuar
**Pregunta central:** Que conviene hacer ahora

## 1. Alcance actual

Actuar hoy no es un flujo bancario ni una capa de ejecucion real.

Es una herramienta personal para Franco y un grupo chico de uso frecuente.
Su trabajo es ordenar una unica decision, explicarla con evidencia suficiente
y dejar una marca local breve cuando el usuario decide seguirla.

Hoy Actuar:

- recibe contexto desde Ahora;
- muestra una sola recomendacion prioritaria;
- permite abrir evidencia sin perder contexto;
- deja decidir entre confirmar, postergar o no insistir;
- muestra una confirmacion contextual breve;
- deja un recibo local breve;
- permite deshacer o cerrar.

Hoy Actuar no:

- mueve dinero;
- ejecuta operaciones reales;
- verifica resultados externos;
- actualiza persistencia;
- modela onboarding, aprobaciones o recorridos multiusuario.

## 2. Posicion del producto

Doleth hoy no se documenta como SaaS publico.

La referencia correcta es:

> herramienta personal y experta para decidir rapido, con calma,
> claridad y control.

Toda decision documental debe favorecer:

1. uso frecuente;
2. baja friccion;
3. control explicito;
4. reversibilidad local;
5. ausencia de teatro operativo.

## 3. Flujo real

El flujo vigente de Actuar queda asi:

```text
Ahora
  -> recomendacion
  -> evidencia
  -> decision
  -> confirmar para hoy
  -> recibo local breve
  -> deshacer o cerrar
```

Tambien existen dos salidas laterales:

```text
decision
  -> dejar para despues
decision
  -> no insistir con esto
```

## 4. Etapas

### Recomendacion

La pantalla abre con una unica accion sugerida.
Debe responder en pocos segundos:

- que conviene hacer;
- que importe esta implicado;
- que consecuencia inmediata tiene;
- cuanta confianza hay;
- donde abrir evidencia.

### Evidencia

La evidencia existe para comprobar la recomendacion, no para competir con ella.
Se abre bajo intencion explicita y vuelve al mismo punto del flujo.

### Decision

La decision principal no ejecuta nada.
Solo abre la revision final de esa recomendacion.

Las salidas secundarias son validas y tranquilas:

- dejar para despues;
- no insistir con esto.

### Confirmar para hoy

La confirmacion contextual revisa solo lo necesario.

En la implementacion actual:

- importe;
- origen;
- destino;
- efecto esperado.

No debe crecer hacia checklist defensivo ni simular una operacion bancaria.

### Recibo local breve

Despues de confirmar, Actuar no declara exito externo.
Solo deja una marca local breve de que esa decision queda anotada para hoy.

Ese recibo:

- mantiene la recomendacion visible arriba;
- evita repetir la explicacion completa;
- ofrece deshacer o cerrar;
- no promete movimiento real.

### Dejar para despues

Postergar debe sentirse legitimo.
No se castiga ni dramatiza.

La pantalla se acorta y deja una pausa clara con opcion de retomar.

### No insistir con esto

Descartar no significa borrar la realidad.
Solo significa dejar de insistir con esta sugerencia en el contexto actual.

La pantalla se acorta y deja una salida reversible a nivel local.

## 5. Principios funcionales

1. Una prioridad por vez.
2. Evidencia cerca, pero subordinada.
3. Nada se mueve sin decision explicita.
4. La recomendacion permanece visible durante toda la decision.
5. La confirmacion revisa solo datos materiales.
6. El recibo local no se hace pasar por resultado real.
7. Postergar es una salida valida.
8. No insistir es una salida valida.
9. La interfaz debe resolver con menos pasos, no con mas.
10. Si una explicacion no cambia la decision, sobra.

## 6. Que no debe hacer

Actuar no debe:

- sonar a onboarding;
- sonar a wizard;
- explicar un backend futuro como si existiera hoy;
- duplicar la lectura completa de Ahora;
- convertir una recomendacion en catalogo;
- usar copy de producto para desconocidos;
- castigar la inaccion;
- inflar confirmacion o recibo para parecer mas serio.

## 7. Fuente de verdad

La autoridad funcional de Actuar queda en este documento y en la implementacion
real de `src/features/act`.

Si el codigo y este doc divergen, se corrige el doc mientras no exista una
decision explicita de cambiar el comportamiento.
