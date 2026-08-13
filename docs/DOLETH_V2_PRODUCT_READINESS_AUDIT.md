# DOLETH V2 — PRODUCT READINESS AUDIT

Fecha: 13 de agosto de 2026

Rama auditada: `codex/v2-cut-7-readiness-audit`

Autoridad visual: `DESIGN.md` — Warm Financial Brutalism

## 1. Veredicto ejecutivo

`DOLETH_V2_DAILY_USE_READY_WITH_CONCERNS`

Doleth V2 ya resuelve el circuito diario esencial de una persona: alta, onboarding, cuentas, ingresos, gastos, transferencias, búsqueda, corrección, anulación, pagos previstos, inversiones, patrimonio y reingreso. La prueba se hizo con una persona nueva y datos persistidos, no sólo con rutas o fixtures. Los saldos permanecieron consistentes después de transferir, corregir, anular, pagar y volver a iniciar sesión.

El producto es apto para uso personal diario controlado. No está listo para una publicación pública general. Hay tres motivos principales:

1. las 222 pruebas PostgreSQL siguen sin ejecutarse en este corte;
2. el envío real de email y el estado productivo no están cerrados;
3. el comportamiento mobile de las acciones globales tapa contenido en 320/375 px y el perfil de 1.000+ movimientos no fue validado de punta a punta.

La conclusión separa deliberadamente **uso diario del producto** de **publicación pública**. La primera condición se cumple con concerns; la segunda no.

## 2. Mapa actual

| Destino | Responsabilidad | Veredicto |
|---|---|---|
| Inicio | posición disponible, ingresos, gastos, diferencia, invertido, próximos pagos, actividad y cuentas | Mantener. Es el centro correcto. |
| Movimientos | historial, búsqueda, filtros, detalle y trazabilidad | Mantener. |
| Cuentas | ubicación del dinero, deuda, ahorro y saldos | Mantener. |
| Plan | compromisos y confirmación de pagos | Mantener. “Plan” es más claro que “Próximo”. |
| Patrimonio | cuentas e inversiones sin doble conteo | Mantener. |
| `+ NUEVO` | gasto, ingreso, transferencia e inversión | Mantener, pero evitar que tape contenido mobile. |
| Más | análisis V1, importación, moneda, integraciones, privacidad y exportación | Mantener como secundario; necesita retiro gradual de V1. |

No hay evidencia suficiente para cambiar los cinco destinos. Mobile y desktop cuentan la misma historia. Los retornos de movimientos preservan búsqueda, mes y detalle mediante `volver`.

## 3. Recorrido real de usuario

Se creó una persona QA nueva y se ejecutó el circuito completo sobre la aplicación local conectada a PostgreSQL.

| # | Paso | Resultado | Fricción / observación |
|---:|---|---|---|
| 1 | Registro | PASS | Formulario claro, pero la superficie de acceso todavía usa el lenguaje visual redondeado previo a V2. |
| 2 | Verificación | PASS | Token real emitido por el transport de desarrollo. No prueba entrega real de correo. |
| 3 | Login | PASS | Mensaje y recuperación claros; estado de carga visible. |
| 4 | Onboarding | PASS con fricción | La zona sugerida era Córdoba; se cambió a Buenos Aires. El paso de pagos muestra nueve campos opcionales y es demasiado denso. |
| 5 | Primera cuenta | PASS | `Banco QA`, ARS y saldo inicial de $1.000.000. |
| 6 | Ingreso | PASS | $500.000, categoría Sueldo; feedback y “Registrar otro”. |
| 7 | Gasto | PASS | Tres gastos consecutivos; default de cuenta y categoría rápida. |
| 8 | Transferencia | PASS | Banco QA → Billetera QA; total patrimonial inalterado. |
| 9 | Inicio | PASS | Respondió cuánto hay, ingresos, gastos, diferencia, próximos, actividad y cuentas. |
| 10 | Búsqueda | PASS | “Comida” devolvió tres coincidencias y chip removible. |
| 11 | Filtro | PASS | Tipo, mes, cuenta y categoría preservan contexto en URL. |
| 12 | Corrección | PASS | Original anulado y reemplazo enlazado. Se corrigió además el submit sin cambios. |
| 13 | Anulación | PASS | Confirmación, motivo obligatorio, historial visible y saldo revertido. |
| 14 | Cuenta | PASS | Dos cuentas y saldos derivados correctamente. |
| 15 | Pago previsto | PASS | Creado en onboarding; importe, cuenta y vencimiento comprensibles. |
| 16 | Confirmar pago | PASS | Creó un gasto real por $250.000 y actualizó el saldo. |
| 17 | Inversión | PASS | Alta manual $200.000 → $215.000; fuente de valuación explícita. |
| 18 | Patrimonio | PASS | $1.185.000 en cuentas; inversión separada para evitar doble conteo. |
| 19 | Cerrar sesión | PASS | Revocación y retorno a login. |
| 20 | Volver a entrar | PASS | Se ejercitó recuperación, revocación de sesiones y nuevo login; datos intactos. |

También se verificaron: repetir movimiento, cuenta adicional, archivo/reactivación de inversión, exportaciones visibles, privacidad local y sesión/configuración.

## 4. Registro diario

### Gasto e ingreso

- recorrido normal: `+ NUEVO` → tipo → importe → categoría → cuenta → guardar;
- 5 taps aproximados si la cuenta sugerida es correcta; 6 si hay que cambiarla;
- 3 decisiones obligatorias: importe, categoría y cuenta;
- fecha de hoy, cuenta reciente y tipo se conservan como defaults;
- importe recibe autofocus, `inputmode="decimal"`, `enterkeyhint="next"` y 56 px en mobile;
- selector de categoría y cuenta usa sheet táctil, no un select largo;
- “Registrar otro” reinicia el importe y mantiene el tipo/contexto.

### Transferencia

- 5 taps aproximados: tipo, importe, origen, destino y confirmar;
- no permite misma cuenta;
- destino reciente y origen reciente se recuerdan;
- sólo pide importe recibido adicional al cruzar monedas;
- tiene resumen antes de confirmar y el patrimonio total no cambia.

Las mutaciones tardaron entre 4 y 6 segundos en el entorno dev/Neon. El botón se deshabilita y muestra loading, por lo que no se observó doble submit, pero la espera es perceptible.

## 5. Inicio

Inicio ya responde las seis preguntas requeridas y todos los importes importantes tienen drill-down. No duplica de forma dañina a Cuentas o Patrimonio: resume y deriva.

Fricciones:

- el H1 “Esta lectura usa solamente lo que cargaste” prioriza una aclaración del sistema sobre la respuesta financiera; debería ser una línea secundaria en un futuro ajuste de copy;
- la explicación de evidencia es honesta, pero se repite en varias superficies;
- `Invertido` desaparece al archivar la única inversión, correctamente;
- las acciones globales fijas tapan el comienzo de bloques al hacer scroll en 320/375.

## 6. Movimientos

Funciona búsqueda, filtros, períodos, categorías, cuentas, detalle, corrección, anulación, repetir y retorno contextual. La paginación de servidor es de 40 filas, una base adecuada para historiales extensos.

Concern: no se generaron años reales ni 1.000+ filas en este corte. Existe evidencia previa de runtime con 500 registros, pero no sustituye el perfil D solicitado.

## 7. Cuentas

Los saldos observados coincidieron con saldo inicial + ledger vigente:

- total tras ingreso, gastos y segunda cuenta: $1.355.000;
- una transferencia de $50.000 movió saldo entre cuentas sin cambiar el total;
- una corrección reemplazó el original;
- su anulación dejó de afectar el saldo;
- el pago confirmado descontó $250.000;
- total final antes de la transferencia adicional: $1.185.000.

Creación, detalle y clasificación de billetera funcionaron. Los estados USD, deuda, nombres extremos y archivado tienen cobertura previa en stories/tests, pero no todos se volvieron a persistir en este smoke.

`ADJUSTMENT_DEFERRED` sigue siendo deuda real: sin ajuste/reconciliación segura, una diferencia entre banco y Doleth sólo puede corregirse creando un movimiento artificial o cambiando el saldo inicial.

## 8. Plan

Se entiende qué vence, cuándo, cuánto, de qué cuenta sale y si está pendiente o pagado. Confirmar un pago crea el movimiento correcto; repetir el siguiente mes es una acción explícita y no se presenta como motor automático.

La UI mostraba el enum `MONTHLY`; se corrigió a “Mensual”. Aún faltan posponer/cancelar compromisos, ingresos futuros y recurrencia estructurada. Ninguno justifica fingir automatización hoy.

Clasificación:

- imprescindible para uso diario: cancelar/descartar un compromiso pendiente sin convertirlo en gasto;
- útil: posponer y recurrencia estructurada;
- V2 futura: ingresos futuros;
- innecesario ahora: goals complejos y calendarios financieros avanzados.

## 9. Patrimonio e inversiones

`TOTAL COMBINADO_DEFERRED` es una decisión correcta con el dominio actual. La pantalla explica que inversiones y cuentas se mantienen separadas porque no se registra qué cuenta financió una inversión. Eso evita un número convincente pero falso.

Para una persona común queda una pregunta legítima: “¿cuánto tengo en total?”. Resolverla exige vínculo de fondeo/subledger y reglas de conversión, no copy ni una suma visual. Es prioridad de dominio P1, no un fix de presentación.

Archivar una inversión se ejecuta con un solo click. Es reversible, pero merece confirmación o undo antes de publicación amplia.

## 10. Bugs y fricciones

### Corregidos en este corte

1. “Transferencia registrado” → “Transferencia registrada”.
2. `MONTHLY` → “Mensual” en lista y detalle de Plan.
3. “Guardar corrección” ya no se habilita si no cambió ningún dato.

### Abiertos

| Prioridad | Hallazgo | Impacto |
|---|---|---|
| P0 publicación | 222 pruebas PostgreSQL sin ejecutar | No hay evidencia actual del aislamiento, idempotencia y ledger sobre el candidato V2 completo. |
| P0 publicación | Email transaccional real no verificado | Registro, verificación, recuperación y cambio de email no son operables públicamente. |
| P0 publicación | Production sirve un deployment anterior luego de rollback documentado | El candidato V2 auditado no es el producto publicado. |
| P1 | Acciones `+ NUEVO / …` tapan contenido en 320/375 | Reduce lectura y operación con una mano; visible en Inicio y formularios. |
| P1 | Navegaciones/mutaciones de 2–6 s en dev contra Neon | La carga se comunica, pero el ritmo diario se resiente. Medir en build productivo antes de optimizar. |
| P1 | Perfil D no verificado con 1.000+ movimientos y años | Riesgo de búsqueda, filtros, consultas y scroll no cerrado. |
| P2 | Archivo de inversión inmediato | Acción accidental recuperable, sin confirmación/undo. |
| P2 | Onboarding de pagos muestra 9 campos opcionales | Exceso de densidad para una persona nueva. |
| P2 | Acceso/registro y análisis V1 usan radios/sombras previas | Ruptura visual frente a Warm Financial Brutalism. |
| P2 | H1 de Inicio es copy de sistema | Demora la lectura principal. |
| P3 | La página de detalle de inversión tiene dos H1 en el árbol | Jerarquía de encabezados mejorable. |
| P3 | Dev muestra hydration mismatch por `data-amounts-hidden` y overlay | Ruido de QA; validar que no exista en producción. |

## 11. Consistencia visual y responsive

El núcleo V2 cumple la dirección: tinta/hueso, bloques coral/lima/amarillo, bordes duros, importes dominantes, poco radio y CTA claro. Desktop 1440 usa una composición editorial real y no un mobile estirado.

Desvíos:

- auth/onboarding inicial conserva cards redondeadas y sombras;
- análisis V1 conserva una gran card blanca redondeada;
- algunas superficies secundarias usan copy y espaciado más cercanos a V1;
- las acciones globales fixed invaden contenido mobile;
- Storybook compila, pero arrastra módulos server/Prisma al grafo del browser y genera warnings/chunks grandes.

No hubo overflow horizontal del contenido en 320, 375, 390 o 1440. El viewport reporta 15 px menos de ancho útil por scrollbar en el navegador de QA; el layout se mantuvo dentro de ese ancho.

## 12. Accesibilidad

Validado:

- labels y landmarks básicos;
- foco automático en importe;
- foco visible;
- importe con teclado decimal y fuente mayor a 16 px, sin zoom iOS accidental;
- targets principales de 48–62 px;
- dialogs/sheets con nombre, cierre y retorno de foco;
- loading y botones disabled;
- reduced motion respetado por el entorno;
- estados de éxito con `role="status"`;
- color acompañado siempre por texto.

Pendiente:

- corrida automatizada completa de axe sobre todas las rutas autenticadas;
- teclado móvil real, VoiceOver/TalkBack y safe-area en hardware;
- reparar los dos H1 de inversión;
- verificar contraste de todos los textos secundarios sobre coral/amarillo con medición automatizada.

## 13. Estados A–D

| Perfil | Evidencia | Estado |
|---|---|---|
| A · nuevo | registro, verificación, onboarding, vacíos | PASS |
| B · 1 cuenta / 5 movimientos | smoke real y cálculos de Inicio | PASS |
| C · varias cuentas, pagos e inversión | smoke real con dos cuentas, pago e inversión | PASS con alcance de un solo mes |
| D · 1.000+, años, ARS/USD | paginación 40, stories de importes/multimoneda y runtime previo 500 | NO VERIFICADO COMPLETO |

## 14. Performance percibida

- navegación simple: 0,8–3 s observados;
- detalles con agregaciones: hasta 4,8 s;
- mutaciones financieras: 4–6 s;
- sheets y cambios locales: inmediatos;
- búsqueda: 3,3 s en dev con pocos datos;
- feedback/loading: correcto;
- no se observaron 5xx ni pérdida de estado.

Son cifras del servidor dev y una base remota; no deben tratarse como benchmark productivo. Antes de optimizar hay que medir `next start`/deployment con trazas de consulta.

## 15. Deuda de dominio priorizada

| Deuda | Problema que resuelve | Valor | Riesgo | Schema | DB tests | Prioridad |
|---|---|---:|---:|---:|---:|---:|
| `ADJUSTMENT_DEFERRED` | reconciliar Doleth con un saldo real | Alto | Alto | Probable | Sí | P1 |
| Investment funding link/subledger | evita doble conteo y explica fondeo | Alto | Alto | Sí | Sí | P1 |
| Net worth combinado | responde cuánto tengo en total | Alto, depende del anterior | Alto | Probable | Sí | P1 |
| Recurrencia estructurada | crea instancias futuras sin duplicar | Medio | Alto | Sí | Sí | P2 |
| Posponer/cancelar pago | mantiene Plan honesto ante cambios | Medio/alto | Medio | Probable | Sí | P2 |
| Upcoming income | proyecta entradas futuras | Medio | Medio/alto | Sí | Sí | P2 |
| Historia/evolución patrimonial | muestra tendencia explicable | Medio | Alto | Sí | Sí | P2 |
| Goals | seguimiento de objetivos | Bajo hoy | Medio | Sí | Sí | P3 |

## 16. Faltantes operativos

### Alto valor

- ajuste/reconciliación segura de saldo (P1);
- cancelar/posponer pago previsto (P1/P2);
- confirmación o undo al archivar inversión (P2);
- CRUD de categorías propias si el beta lo necesita (P2).

### Ya resuelto

- descripción/nota del movimiento;
- corrección de categoría y cuenta;
- repetir desde detalle;
- búsqueda y filtros;
- recientes/defaults de cuenta;
- importación, exportación y settings accesibles desde Más;
- privacidad de importes por dispositivo.

### Bajo valor ahora

- tags libres;
- favoritos explícitos;
- búsqueda global de toda la aplicación;
- comercio/persona como entidad separada.

## 17. NO CONSTRUIR

- feed social o comparación con otras personas;
- gamificación, streaks, badges o confetti;
- chatbot financiero como navegación principal;
- scoring financiero opaco;
- recomendaciones automáticas sin evidencia verificable;
- presupuestos con decenas de reglas y jerarquías;
- veinte gráficos decorativos;
- sincronización bancaria “simulada”;
- total patrimonial combinado sin vínculo de fondeo y FX confiable;
- motor de recurrencia que sólo duplique filas sin trazabilidad;
- goals antes de resolver reconciliación y Plan.

## 18. Legado y plan de retiro

`Más` etiqueta correctamente `En qué se fue`, `Cambios`, `Progreso` y `Actuar` como “Análisis V1”. Siguen consumiendo datos reales y no están muertos, pero visualmente rompen la composición V2.

Plan:

1. instrumentar/medir uso por ruta;
2. confirmar qué análisis aporta una respuesta no cubierta por Inicio/Movimientos;
3. redirigir duplicados a filtros V2 equivalentes;
4. migrar sólo el análisis diferencial que tenga uso;
5. eliminar componentes V1 después de una release con redirects y tests;
6. no borrar rutas ni código en este corte.

## 19. Seguridad

Fortalezas observadas:

- verificación y reset usan tokens de un uso y expiración;
- recuperación responde igual exista o no la cuenta;
- cambiar contraseña revoca otras sesiones;
- configuración muestra y permite cerrar sesiones;
- movimientos y retornos pasan por ownership/sanitización existentes;
- exportación declara formato y excluye secretos;
- baja de cuenta no promete borrado automático inexistente;
- guardia de tests se negó a usar `DATABASE_URL` como base destructiva.

Concerns:

- la evidencia DB de aislamiento de este candidato no es actual;
- email real sigue diferido;
- production, Preview y local no representan hoy el mismo SHA/flujo de acceso;
- CSP/dev genera ruido de `eval`; confirmar headers del build productivo;
- CI remoto tuvo antecedentes de bloqueo por billing.

## 20. Evaluación del concern PostgreSQL

Estado exacto:

`REGRESIÓN FINANCIERA COMPLETA: NO EJECUTADA — pendiente PostgreSQL local`

En `.env.local`, `TEST_DATABASE_URL` existe pero está vacío. La suite primero falló de forma segura porque detectó `DATABASE_URL` sin una base de prueba. Para la suite no‑DB se neutralizaron ambas variables únicamente en el proceso de test; así aprobaron 1.006 pruebas y se omitieron 222.

### Riesgo real

Las 222 pruebas cubren caminos que un browser smoke no puede sustituir: aislamiento multiusuario/IDOR, constraints de ownership, atomicidad, idempotencia, integridad del ledger, correcciones, anulaciones, pagos y exportación aislada. Los cortes V2 fueron mayormente presentación/modelos de lectura y no cambiaron schema ni ledger, lo que reduce probabilidad de regresión. No elimina el riesgo: el candidato integra todos esos caminos y se está evaluando para publicación.

### Criterio

- desarrollo de polish visual: puede continuar sin DB si no toca dominio;
- nueva feature financiera o mutación: no debe empezar sin DB tests;
- beta controlada con datos no críticos: aceptable con concern explícito;
- publicación pública o migración/deploy del candidato: **bloqueada** hasta 222/222 en una base descartable que pase las guardas, seguida de smoke A/B.

No se debe apuntar la suite a la base original sólo porque hoy tenga pocos usuarios. La propia suite crea y borra entidades y prohíbe compartir destino con `DATABASE_URL`.

## 21. Readiness de producción

### Bloqueantes

- [ ] base PostgreSQL de test descartable y 222/222 pruebas DB;
- [ ] smoke de aislamiento A/B sobre candidato final;
- [ ] proveedor de email, dominio, SPF/DKIM y entrega a dos buzones;
- [ ] verificación, recuperación y cambio de email reales;
- [ ] backup reciente y restore rehearsal vigente;
- [ ] deploy del SHA V2 candidato y smoke posterior;
- [ ] variables Production/Preview auditadas, sin compartir DB/secrets;
- [ ] errores y observabilidad productivos revisados;
- [ ] corregir solapamiento mobile de acciones globales;
- [ ] validar 1.000+ movimientos y años de historia.

### Importantes no bloqueantes

- [ ] confirmación/undo de archivo de inversión;
- [ ] simplificar onboarding de pagos;
- [ ] retirar enum/copy técnico restante;
- [ ] axe + lector de pantalla + dispositivo iOS/Android;
- [ ] medir performance con build productivo;
- [ ] reducir warnings/chunks de Storybook.

### Futuro

- reconciliación segura;
- subledger/vínculo de fondeo de inversiones;
- total combinado confiable;
- recurrencia, posponer e ingresos futuros;
- retiro del legado V1.

## 22. P0–P3 consolidado

### P0 — antes de publicación

- regresión PostgreSQL completa;
- email real;
- alinear/deployar el SHA candidato con backup, variables, observabilidad y smoke.

### P1 — siguiente hardening

- solapamiento de acciones mobile;
- perfil D/performance productiva;
- ajuste/reconciliación;
- inversión ↔ cuenta y total combinado, sólo con diseño de dominio aprobado.

### P2 — mejora importante

- cancelar/posponer pagos y recurrencia estructurada;
- confirmación de archivo de inversión;
- simplificar onboarding;
- categorías propias;
- accesibilidad asistiva completa;
- migración selectiva de V1.

### P3 — futuro opcional

- goals;
- búsqueda global;
- tags/favoritos;
- evolución patrimonial avanzada.

## 23. QA ejecutado

- recorrido real de 20 pasos: PASS con concerns;
- 320, 375, 390 y 1440: inspeccionados;
- foco/input mode/targets/safe-area: inspección manual y DOM;
- `pnpm lint`: PASS;
- `pnpm typecheck`: PASS;
- `pnpm build`: PASS;
- `pnpm build-storybook`: PASS con warnings conocidos;
- suite dirigida: 33/33 PASS;
- suite no‑DB: 67 archivos / 1.006 tests PASS;
- DB: 16 archivos / 222 tests SKIP;
- 5xx observados: 0;
- doble submit observado: 0.

Evidencia local: `.gstack/qa-reports/screenshots/cut7/`.

## 24. Próximos cortes propuestos

Sólo hacen falta dos cortes, y ninguno debe iniciarse automáticamente:

1. **Corte 8 — Release hardening**: PostgreSQL descartable, 222 tests, perfil D, mobile overlay, email, backup, variables, observabilidad y smoke de candidato.
2. **Corte 9 — Reconciliación y patrimonio confiable**, únicamente con aprobación de schema: adjustment, vínculo de fondeo/subledger y total combinado.

No corresponde construir goals, IA, gamificación ni otro módulo de dashboard antes de cerrar el Corte 8.
