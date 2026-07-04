# DESIGN SPEC 001 - Ahora

Estado: oficial  
Fecha: 4 de julio de 2026  
Pantalla: Ahora  
Pregunta madre: **Como estoy financieramente en este momento?**  
Autoridad: especificacion funcional oficial de la pantalla Ahora  

## 0. Rol actual

Ahora es la superficie principal de contexto de Doleth.

No es un dashboard.
No es una coleccion de modulos.
No es una pantalla de onboarding masivo.

Hoy existe para resolver una sola necesidad:

> entender que esta pasando hoy, que requiere atencion, que esta tranquilo, que puede esperar y cuando conviene pasar a Actuar.

## 1. Objetivo unico

**Mostrar una lectura util, calma y accionable del presente en menos de diez segundos.**

La pantalla no intenta contar toda la historia financiera ni reemplazar territorios mas profundos.

Ahora responde presente.

- detalle operativo profundo vive en `Actuar`;
- desglose de calculo vive en `Evidencia`;
- agenda completa vive en `Proximo`;
- administracion por objeto vive en `Mi realidad`;
- historia vive en `Cambios`;
- trayectoria vive en `Progreso`.

## 2. Alcance congelado hoy

La implementacion congelada cubre tres estados:

- `stable`
- `attention`
- `incomplete`

No cubre todavia:

- estado de primera cuenta o `add-first-account`;
- estado vacio de onboarding;
- navegacion hacia `Proximo` o `Mi realidad` desde acciones especificas;
- multiples prioridades simultaneas;
- actualizacion real de datos;
- persistencia;
- backend.

## 3. Informacion que debe aparecer

## 3.1 Orden real de la superficie

La pantalla congelada se compone en este orden:

```text
Rail de contexto
-> Atencion, si existe
-> Hero con disponible y cobertura inmediata
-> Frase de estabilidad o cautela
-> ActionStrip reducido
-> Puede esperar hoy
-> Posicion actual
-> Confianza de esta lectura
```

Ese orden es parte de la implementacion actual y no debe cambiar sin reabrir la superficie.

## 3.2 Rail de contexto

Muestra contexto minimo para interpretar la lectura:

- vigencia;
- moneda;
- ambito;
- completitud de informacion.

Debe ser breve y no competir con la lectura principal.

## 3.3 Hero

Es la respuesta principal de la pantalla.

Debe condensar:

- estado actual;
- disponible usable hoy;
- cobertura de los proximos siete dias.

El hero tambien abre la evidencia del disponible mediante un sheet local.

## 3.4 Frase de estabilidad

Funciona como interpretacion corta y factual.

No decide por el usuario.
No celebra.
No dramatiza.

Su trabajo es traducir la lectura del hero en una conclusion breve y humana.

## 3.5 ActionStrip

Ahora usa un `ActionStrip` reducido.

Su rol no es listar operaciones.
Su rol es empujar naturalmente a la siguiente accion correcta.

Regla actual:

- una accion primaria contextual;
- dos acciones secundarias;
- sin catalogo de operaciones visibles en la superficie.

La accion primaria lleva a `Actuar`.

Las secundarias actuales son:

- `Ver evidencia`
- `Actualizar lectura`

`Ver evidencia` resuelve dentro de la propia pantalla.
`Actualizar lectura` hoy tambien deriva a `Actuar` porque la resolucion todavia no vive dentro de Ahora.

## 3.6 Puede esperar hoy

La reserva visible no se presenta como administracion de objetivos ni como modulo de ahorro.

Su funcion actual es explicitar que parte del dinero ya tiene destino y no requiere intervencion hoy.

Debe responder:

- cuanto puede esperar;
- por que puede esperar;
- por que no hace falta tocarlo antes de actuar sobre lo urgente.

## 3.7 Posicion actual

Resume estado patrimonial minimo sin convertir la pantalla en inventario.

Hoy muestra:

- liquido confirmado o saldo principal;
- invertido;
- no disponible.

No lista cuentas ni instrumentos.

## 3.8 Confianza de esta lectura

Expone calidad de la lectura.

Debe dejar claro:

- si la informacion esta completa o parcial;
- que parte sostiene la conclusion;
- acceso a evidencia.

No funciona como modulo tecnico.
Funciona como cierre de confianza.

## 4. Estados congelados

## 4.1 Stable

Debe transmitir:

- no hay nada urgente;
- el disponible es util hoy;
- la cobertura inmediata esta completa;
- existe una accion natural para pasar a Actuar sin ruido.

El estado por defecto de `/ahora` es `stable`.

## 4.2 Attention

Debe interrumpir con una sola prioridad material.

Hoy la prioridad se expresa asi:

- banner superior;
- hero en tono de atencion;
- frase de estabilidad orientada a resolver primero;
- CTA primaria hacia `Actuar`.

No debe multiplicar alertas ni convertir la pantalla en lista de problemas.

## 4.3 Incomplete

Debe permitir orientacion sin fingir certeza.

Hoy lo hace mediante:

- hero con lectura no confirmada;
- cobertura parcial;
- frase de cautela;
- CTA primaria para revisar antes de actuar;
- bloque de confianza en estado parcial.

## 5. Comportamiento congelado

## 5.1 Conexion con Actuar

La conexion principal entre `Ahora` y `Actuar` ya forma parte del contrato de la pantalla.

Reglas actuales:

- CTA primaria del `ActionStrip` navega a `/actuar`;
- CTA del banner de atencion navega a `/actuar`;
- acciones de resolucion no se ejecutan dentro de Ahora.

## 5.2 Evidencia local

La superficie tiene dos accesos a evidencia:

- click sobre el valor del hero para abrir el sheet del disponible;
- acceso `Ver evidencia` en el bloque de confianza.

Ademas, el secundario `Ver evidencia` del `ActionStrip` desplaza al bloque de confianza local.

## 5.3 Quietud visual

La pantalla debe seguir tranquila aun en `attention` e `incomplete`.

Eso implica:

- una sola accion dominante;
- sin mosaico de cards;
- sin metricas extras;
- sin graficos decorativos;
- sin texto de marketing;
- sin duplicar reserva y posicion en formatos distintos.

## 6. Lo que no pertenece a Ahora

No pertenece a esta superficie congelada:

- feed de movimientos;
- dashboard de modulos;
- comparaciones semanales;
- objetivos completos;
- listas de cuentas;
- historia explicativa;
- recomendaciones multiples;
- wizard de onboarding;
- copy de SaaS publico;
- densidad de metricas para aparentar profundidad.

## 7. Componentes actuales

La pantalla congelada se apoya en estos componentes existentes:

- `SystemRail`
- `AttentionBanner`
- `Hero`
- `BottomSheet`
- `EvidenceRow`
- `StabilityStatement`
- `ActionStrip`
- `ReserveBlock`
- `Surface`
- `SectionTitle`
- `FinancialRow`
- `Divider`
- `InformationBlock`

No requiere componentes nuevos para cumplir su rol actual.

## 8. Declaracion oficial

Ahora queda definida asi en su implementacion actual:

```text
Contexto
-> Atencion opcional
-> Disponible y cobertura
-> Interpretacion breve
-> Paso natural a Actuar
-> Que puede esperar
-> Posicion actual
-> Confianza y evidencia
```

La pantalla responde:

**Como estoy hoy, que requiere atencion y que puede esperar sin perder control.**

Si un contenido no mejora esa respuesta, no pertenece a Ahora.
