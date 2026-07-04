# Freeze 001 - Ahora

**Estado:** frozen after Dia 11 verification  
**Superficie:** Ahora  
**Alcance:** superficie principal de contexto  
**Fuentes de verdad:**

- `docs/design-spec-001-ahora.md`
- `docs/design-language-001-gramatica-de-informacion.md`
- `docs/app-map-001-mapa-integral-del-producto.md`
- `src/app/ahora/page.tsx`
- `src/features/now/*`
- `DESIGN.md`

## 1. Resumen

Ahora queda congelada como la superficie principal de contexto de Doleth.

Su trabajo no es mostrar todos los modulos ni toda la historia financiera.
Su trabajo es responder el presente con calma, claridad y control.

Hoy la superficie responde cinco cosas:

- que esta pasando hoy;
- que requiere atencion;
- que esta tranquilo;
- que puede esperar;
- cuando conviene pasar a Actuar.

## 2. Commits incluidos

La version congelada de Ahora incluye estos commits del tramo actual de la superficie:

- `59edaeb` - `feat: assemble stable now screen`
- `7d678a3` - `feat: add evidence sheet for available balance`
- `213a107` - `feat: implement attention state for now`
- `579a3de` - `feat: implement incomplete state for now`
- `3e73a97` - `feat: implement motion system for sprint 1`
- `d1b864c` - `feat(now): establish primary context surface`
- `f9243ef` - `fix(now): decouple route actions from app router`

Queda fuera de esta lista `b258446` porque funciona como base inicial del frontend y
no como corte propio de la superficie Ahora.

## 3. Que quedo congelado

Queda congelado:

- `Ahora` como entrada principal de contexto;
- estado por defecto `/ahora` en `stable`;
- rail de contexto con vigencia, moneda, ambito y calidad de informacion;
- hero con disponible y cobertura inmediata;
- evidencia del disponible via sheet local;
- frase interpretativa breve debajo del hero;
- `ActionStrip` reducido con una CTA primaria y dos secundarias;
- bloque `Puede esperar hoy`;
- bloque `Posicion actual`;
- bloque `Confianza de esta lectura`;
- orden visual `hero -> estabilidad -> acciones -> puede esperar -> posicion -> confianza`;
- conexion natural hacia `Actuar` desde la CTA primaria;
- comportamiento movil en `320` y `390`.

## 4. Que NO esta incluido

No queda incluido en este freeze:

- onboarding o estado `add-first-account`;
- persistencia;
- backend;
- actualizacion real de datos;
- resolucion operativa dentro de Ahora;
- multiples prioridades simultaneas;
- navegacion profunda a `Proximo` o `Mi realidad` desde CTA dedicadas;
- ejecucion real de `Actualizar lectura`;
- listas de cuentas, tarjetas, deudas u objetivos;
- dashboards, graficos o metricas decorativas.

## 5. Estados congelados

### Stable

Muestra una lectura tranquila y usable.
No hay urgencia visible.
La CTA primaria sigue existiendo, pero no presiona.

### Attention

Eleva una sola prioridad material.
Usa banner, hero en tono de atencion y una CTA directa a `Actuar`.

### Incomplete

Mantiene orientacion sin fingir certeza.
La confianza pasa a parcial y la CTA principal se orienta a revisar antes de actuar.

## 6. Rol de Ahora como contexto principal

Ahora no compite con otros territorios.

Queda congelada como:

- puerta de entrada habitual;
- lectura sintetica del presente;
- puente hacia decision y evidencia;
- superficie que ordena la complejidad antes de cualquier accion.

No queda congelada como centro de administracion profunda ni como agenda completa.

## 7. Conexion hacia Actuar

La conexion hacia `Actuar` es parte central del freeze.

Reglas actuales:

- la CTA primaria del `ActionStrip` navega a `/actuar`;
- la CTA del banner en `attention` navega a `/actuar`;
- `Ahora` no resuelve pagos, movimientos ni actualizaciones por si sola;
- `Actuar` recibe el rol de resolucion principal de la siguiente accion.

## 8. Componentes reutilizados

Ahora se apoya en componentes existentes del sistema:

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

Tambien reutiliza:

- tokens y motion ya existentes;
- layout base de `app-canvas`;
- tono y jerarquia definidos por `DESIGN.md`.

## 9. Validaciones

En Dia 11 se verifico:

- lectura de implementacion actual de `Ahora`;
- lectura de `docs/design-spec-001-ahora.md`;
- lectura de `docs/design-language-001-gramatica-de-informacion.md`;
- lectura de `docs/app-map-001-mapa-integral-del-producto.md`;
- alineacion entre docs e implementacion actual;
- `npm run lint` - OK;
- `npm run build` - OK;
- `npm run build-storybook` - OK;
- QA Storybook `320` y `390` en `stable`, `attention`, `incomplete` - OK;
- QA ruta `/ahora` - OK;
- QA de paso a `/actuar` desde CTA primaria - OK.

Durante la verificacion aparecio un bug real de Storybook por dependencia directa del
app router en `NowPage`. El freeze incluye el fix tecnico minimo para que la superficie
siga renderizando igual en app y en stories.

## 10. Riesgos pendientes

Riesgos que siguen abiertos, pero fuera del freeze:

- `Actualizar lectura` todavia navega a `Actuar` y no a una resolucion propia;
- la evidencia local del `ActionStrip` depende de scroll interno y no de cambio de estado;
- no existe todavia estado de primera cuenta o arranque real de usuario nuevo;
- si `Actuar` cambia su contrato de entrada, la CTA primaria de `Ahora` puede requerir ajuste;
- si `Ahora` suma mas de una prioridad material, la estructura actual no la soporta sin ruido.

## 11. Criterio para reabrir Ahora

Ahora solo debe reabrirse si aparece al menos una de estas condiciones:

1. hace falta incorporar un estado real de primera cuenta o onboarding minimo;
2. la CTA principal deja de representar la siguiente accion natural;
3. `320` o `390` dejan de respirar bien con contenido real;
4. aparecen dos prioridades simultaneas y la superficie no logra ordenarlas;
5. la spec vuelve a separarse de la implementacion;
6. `Actuar` deja de ser la salida correcta para resolver contexto desde `Ahora`.

Fuera de esos casos, `Ahora` se considera cerrada como superficie principal de contexto
y no debe acumular cambios incrementales por gusto.
