# UX-BLUEPRINT-001 — Mapa de Pantallas y Flujos de Doleth

Estado: oficial  
Fecha: 2 de julio de 2026  
Autoridad: mapa funcional de pantallas y flujos  
Depende de: `PRD-002`, `SPEC-AUDIT-001` y `DOLETH PRODUCT BLUEPRINT`  

## 0. Alcance

Este documento traduce módulos del Product Blueprint a estructura navegable.

Define:

- pantallas necesarias;
- propósito de cada pantalla;
- navegación principal;
- flujos de entrada, registro, administración y revisión;
- alcance exacto de primera versión construible.

No define apariencia, colores, componentes ni tecnología.

### 0.1 Regla estructural

Pantallas se organizan alrededor de cinco necesidades:

1. saber situación actual;
2. registrar qué pasó;
3. administrar lo que persona posee y debe;
4. prepararse para próximos compromisos;
5. entender evolución.

Cada hecho se registra una vez. Módulos muestran efectos correspondientes sin pedir carga duplicada.

---

## 1. Pantallas principales

Prioridades:

- **MVP:** necesaria para primera versión utilizable definida al final de este documento;
- **V2:** amplía administración integral después de validar núcleo;
- **Futuro:** depende de historia, integraciones o complejidad posterior.

## 1.1 Acceso y puesta en marcha

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Acceso | Identificar persona y recuperar espacio financiero | ¿Cómo entro a mi información? | identidad, estado de acceso | ingresar, crear acceso, recuperar acceso | configuración financiera | MVP |
| Bienvenida | Explicar resultado inmediato y comenzar sin exposición teórica | ¿Qué debo hacer primero para que Doleth sea útil? | promesa, alcance inicial, tiempo estimado | comenzar, continuar configuración pendiente | configuración, panorama | MVP |
| Configuración financiera inicial | Establecer criterios mínimos compartidos | ¿En qué moneda y desde qué fecha voy a administrar mi realidad? | moneda principal, monedas utilizadas, fecha inicial, ámbito personal | confirmar criterios, volver | configuración financiera | MVP |
| Carga inicial | Reunir elementos necesarios para primera posición | ¿Qué falta cargar para saber dónde estoy parado? | progreso de cuentas, tarjetas, deudas, inversiones y objetivos | agregar elemento, omitir por ahora, revisar cargado, finalizar | cuentas, tarjetas, deudas, inversiones, objetivos | MVP |
| Resumen inicial | Confirmar posición antes de entrar a uso cotidiano | ¿La primera fotografía de mi situación es correcta? | dinero, deudas, inversiones, reservas, faltantes declarados | corregir, confirmar panorama inicial | panorama, control | MVP |
| Elegir origen de datos | Incorporar historia desde fuente externa | ¿Cómo traigo información existente? | orígenes disponibles, período, alcance | seleccionar origen, cargar archivo, cancelar | entrada y portabilidad | V2 |
| Revisar importación | Validar información antes de incorporarla | ¿Qué se incorporará y qué requiere revisión? | registros válidos, duplicados, conflictos, descartados | confirmar, corregir, excluir, cancelar lote | entrada, actividad, control | V2 |

## 1.2 Núcleo diario

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Inicio / Panorama | Resumir posición financiera actual | ¿Dónde estoy parado financieramente? | dinero disponible, próximos compromisos, flujo mensual, activos, deudas, patrimonio neto, estado de actualización | registrar, revisar detalle, resolver pendiente, cambiar alcance | panorama, todos los dominios | MVP |
| Actividad | Mostrar cronología única de hechos | ¿Qué pasó con mi dinero y mi posición? | operaciones ordenadas, fecha, monto, cuenta, tipo, estado | registrar, buscar, filtrar, abrir, corregir | actividad, todos los dominios | MVP |
| Registrar operación | Capturar un hecho financiero una sola vez | ¿Qué pasó? | tipo de operación, monto, moneda, fecha, origen, destino y contexto necesario | guardar, agregar detalle opcional, cancelar | actividad, cuentas y dominio afectado | MVP |
| Detalle de operación | Explicar efectos completos de un hecho | ¿Qué cambió por esta operación? | datos originales, cuentas afectadas, clasificación, vínculos, impacto y procedencia | editar, dividir, vincular, duplicar, anular | actividad, control, dominios afectados | MVP |
| Búsqueda financiera | Encontrar cualquier elemento sin recorrer módulos | ¿Dónde está ese movimiento, cuenta, deuda o activo? | resultados agrupados por significado | buscar, filtrar, abrir resultado | todos los módulos | V2 |

## 1.3 Posición consolidada

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Posición | Reunir todo lo que persona tiene, debe y reservó | ¿Cómo está compuesta mi situación? | dinero, tarjetas, deudas, inversiones, patrimonio y objetivos | abrir dominio, agregar elemento, cambiar moneda o ámbito | cuentas, tarjetas, deudas, inversiones, patrimonio, objetivos | MVP |
| Composición detallada | Analizar distribución consolidada | ¿Dónde está concentrado mi valor y mi deuda? | composición por tipo, moneda, institución y ámbito | cambiar criterio, abrir origen, comparar | panorama, reportes | V2 |

## 1.4 Dinero y cuentas

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Cuentas | Administrar lugares donde vive dinero | ¿Dónde está mi dinero? | cuentas, efectivo, billeteras, moneda, saldo y disponibilidad | agregar cuenta, transferir, ordenar, archivar, abrir detalle | dinero, panorama | MVP |
| Detalle de cuenta | Entender y mantener una cuenta | ¿Cuál es saldo real y qué lo explica? | saldo, disponible, reservado, actividad, última conciliación | registrar, transferir, conciliar, editar, archivar | dinero, actividad, objetivos, control | MVP |
| Agregar o editar cuenta | Crear o mantener lugar de dinero | ¿Qué cuenta es y cuánto tiene? | tipo, nombre, institución, moneda, saldo inicial, titularidad | guardar, cancelar | configuración, dinero | MVP |
| Transferir entre cuentas | Mover dinero sin crear ingreso o gasto | ¿Desde dónde y hacia dónde se movió valor? | origen, destino, monto, moneda, conversión, fecha | confirmar, cancelar | actividad, dinero, monedas | MVP |
| Revisar saldo | Resolver diferencia entre saldo informado y calculado | ¿Por qué esta cuenta no coincide? | saldo esperado, saldo real, diferencia, operaciones desde último corte | marcar faltante, corregir, ajustar, confirmar | dinero, actividad, control | MVP |

## 1.5 Ingresos y gastos

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Flujo del período | Mostrar entradas, salidas y ahorro | ¿Cómo viene este período? | ingresos, gastos, ahorro, comparación, principales fuentes y destinos | registrar, cambiar período, abrir detalle, filtrar | flujo, actividad, reportes | MVP |
| Detalle de flujo | Explicar composición de ingresos o gastos | ¿De dónde viene o hacia dónde va este monto? | operaciones, categorías, contrapartes, recurrencias | filtrar, reclasificar, abrir operación | flujo, actividad | V2 |
| Recurrentes y suscripciones | Administrar hechos esperados repetidos | ¿Qué vuelve a entrar o salir y cuándo? | recurrencias, importe esperado, próxima fecha, estado | agregar, editar, pausar, finalizar, registrar ocurrencia | flujo, agenda | V2 |

## 1.6 Tarjetas y cuotas

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Tarjetas | Consolidar consumo financiado | ¿Cuánto debo en tarjetas y qué vence pronto? | tarjetas, consumo actual, cierre, vencimiento, cuotas futuras, límite disponible | agregar tarjeta, registrar compra, abrir detalle | tarjetas, agenda, panorama | MVP |
| Detalle de tarjeta | Administrar una tarjeta completa | ¿Qué consumos forman deuda y cómo sigue? | consumos, resumen actual, cuotas, límites, cierres, vencimientos, pagos | registrar compra, registrar pago, revisar resumen, editar | tarjetas, actividad, cuentas, agenda | MVP |
| Agregar o editar tarjeta | Registrar condiciones permanentes | ¿Qué tarjeta uso y bajo qué calendario? | emisor, identificación, moneda, límite, cierre, vencimiento, titularidad | guardar, cancelar | tarjetas, configuración, agenda | MVP |
| Registrar compra en cuotas | Capturar compra y compromiso futuro | ¿Qué compré, con qué tarjeta y en cuántas cuotas? | monto total, moneda, fecha, tarjeta, cuotas, primera cuota, comercio, categoría | guardar, revisar calendario, cancelar | actividad, tarjetas, flujo, agenda | MVP |
| Resumen de tarjeta | Conciliar período facturado | ¿Qué integra resumen y cuánto debo pagar? | consumos incluidos, cargos, pagos, total, mínimo, vencimiento | confirmar resumen, corregir, registrar pago | tarjetas, control, agenda | V2 |
| Registrar pago de tarjeta | Extinguir obligación sin duplicar gasto | ¿Cuánto pagué y desde qué cuenta? | tarjeta, resumen, monto, cuenta de origen, fecha | guardar pago, vincular diferencia, cancelar | tarjetas, cuentas, actividad | MVP |

## 1.7 Deudas, préstamos y cobros

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Deudas y cobros | Consolidar obligaciones y derechos pendientes | ¿Qué debo y qué me deben? | saldos, contrapartes, próxima fecha, estado, moneda | agregar deuda o préstamo, registrar pago o cobro, abrir detalle | deudas, agenda, panorama | MVP |
| Detalle de deuda o préstamo | Administrar relación financiera completa | ¿Cuánto queda, qué pagué y qué sigue? | principal, saldo, calendario, interés, pagos, contraparte, estado | registrar pago, editar condiciones, refinanciar, cerrar | deudas, actividad, cuentas, agenda | MVP |
| Agregar deuda o préstamo | Registrar obligación o derecho existente | ¿Quién debe a quién, cuánto y bajo qué condiciones? | dirección, contraparte, principal, moneda, desembolso, tasa, cuotas, fechas | guardar, revisar calendario, cancelar | deudas, cuentas, agenda | MVP |
| Registrar pago o cobro | Reducir saldo pendiente | ¿Qué parte se pagó o cobró? | relación, monto, capital, interés, cuenta, fecha | guardar, marcar total, cancelar | deudas, cuentas, actividad | MVP |
| Reestructurar deuda | Cambiar condiciones conservando historia | ¿Cómo cambió obligación pendiente? | saldo previo, nuevas condiciones, costo, calendario | confirmar reestructuración, cancelar | deudas, agenda, control | Futuro |

## 1.8 Inversiones

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Inversiones | Consolidar cartera | ¿Qué inversiones tengo y cuánto valen? | posiciones, valor actual, costo, resultado, moneda, composición | agregar inversión, registrar operación, actualizar valores, abrir detalle | inversiones, panorama, valuación | MVP |
| Detalle de inversión | Administrar posición e historia | ¿Cómo se formó esta posición y qué resultado tiene? | cantidad, costo, valor, operaciones, rendimiento, liquidez | comprar, vender, registrar rendimiento, actualizar valor, editar | inversiones, actividad, cuentas, reportes | MVP |
| Agregar inversión | Registrar posición existente o compra nueva | ¿Qué activo incorporé y cómo lo obtuve? | instrumento, cantidad, precio o valor, moneda, fecha, custodio, cuenta de origen | guardar, distinguir posición inicial de compra, cancelar | inversiones, cuentas, actividad | MVP |
| Registrar operación de inversión | Modificar posición existente | ¿Compré, vendí, cobré o transferí este activo? | tipo, cantidad, precio, costos, fecha, cuentas involucradas | guardar, cancelar | inversiones, actividad, cuentas | V2 |
| Actualizar valuación | Mantener valor actual sin inventar flujo | ¿Cuánto vale ahora y de dónde sale ese valor? | precio o valuación, moneda, fecha, fuente | guardar, reemplazar estimación, cancelar | inversiones, valuación, panorama | MVP |

## 1.9 Patrimonio

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Patrimonio | Consolidar activos no financieros | ¿Qué bienes forman mi patrimonio? | activos, valor estimado, titularidad, deuda asociada | agregar activo, actualizar valor, abrir detalle | patrimonio, deudas, panorama | V2 |
| Detalle de activo | Administrar historia y valor de bien | ¿Qué vale este activo y qué obligaciones tiene? | adquisición, valuaciones, mejoras, titularidad, garantías, deuda | actualizar, registrar mejora, asociar deuda, vender, archivar | patrimonio, deudas, actividad | V2 |
| Agregar activo | Incorporar bien patrimonial | ¿Qué activo poseo, en qué proporción y cuánto vale? | tipo, descripción, costo, valor, fecha, moneda, titularidad | guardar, cancelar | patrimonio, configuración, valuación | V2 |

## 1.10 Objetivos y reservas

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Objetivos | Consolidar propósitos y dinero reservado | ¿Para qué estoy separando dinero y cuánto avancé? | objetivos, monto asignado, meta, progreso, fecha | crear objetivo, aportar, retirar, abrir detalle | objetivos, dinero, panorama | MVP |
| Detalle de objetivo | Administrar meta y reservas | ¿Cuánto separé, dónde está y qué falta? | meta, asignaciones, cuentas de respaldo, aportes, retiros, progreso | aportar, retirar, reasignar, editar, completar | objetivos, cuentas, actividad | MVP |
| Crear o editar objetivo | Definir propósito sin crear dinero ficticio | ¿Para qué, cuánto y cuándo quiero reservar? | nombre, monto, moneda, fecha opcional, prioridad, cuenta | guardar, asignar monto inicial, cancelar | objetivos, dinero | MVP |

## 1.11 Agenda financiera

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Agenda | Ordenar próximos hechos financieros | ¿Qué entra, sale o vence después? | cobros, pagos, cuotas, cierres, vencimientos y renovaciones por fecha | abrir elemento, registrar cumplimiento, agregar compromiso, cambiar horizonte | agenda, flujo, tarjetas, deudas, inversiones, objetivos | MVP |
| Detalle de compromiso | Explicar hecho futuro y origen | ¿Qué ocurrirá, cuándo y qué lo genera? | monto, fecha, estado, recurrencia, módulo origen, cobertura | pagar o cobrar, editar origen permitido, posponer, cancelar | agenda, dominio origen, actividad | V2 |

## 1.12 Reportes y evolución

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Reportes | Dar acceso a lecturas históricas | ¿Qué aspecto de evolución quiero entender? | reportes disponibles, período actual, último cierre | abrir reporte, cambiar período | reportes, todos los dominios | MVP |
| Reporte mensual | Cerrar lectura de un mes | ¿Qué cambió este mes y por qué? | saldo inicial y final, ingresos, gastos, ahorro, deudas, inversiones, patrimonio, cambios principales | cambiar mes, abrir origen, revisar pendientes, cerrar revisión | reportes, panorama, control | MVP |
| Evolución patrimonial | Mostrar trayectoria de patrimonio neto | ¿Mi posición total mejora o empeora? | patrimonio neto por período, aportes, deuda, revaluaciones | cambiar período, moneda, ámbito, abrir explicación | reportes, patrimonio, inversiones, deudas | V2 |
| Flujo histórico | Comparar entradas, salidas y ahorro | ¿Cómo cambió mi capacidad de generar y conservar dinero? | series de ingresos, gastos y ahorro | comparar, filtrar, abrir operaciones | reportes, flujo | V2 |
| Composición histórica | Mostrar cambios de distribución | ¿Cómo cambió composición de activos y deudas? | proporciones por tipo, moneda y ámbito | comparar cortes, abrir dominio | reportes, panorama | V2 |

## 1.13 Control y conciliación

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Estado de información | Mostrar confiabilidad y actualización | ¿Qué está confirmado y qué debo revisar? | cuentas desactualizadas, diferencias, duplicados, pendientes | abrir problema, conciliar, descartar alerta justificada | control, todos los dominios | V2 |
| Conciliación | Comparar realidad externa con Doleth | ¿Qué explica diferencia de este corte? | saldo informado, calculado, diferencia, operaciones candidatas | vincular, agregar faltante, eliminar duplicado, ajustar, confirmar corte | control, actividad, dominio afectado | V2 |
| Cierre de período | Confirmar calidad antes de conservar corte histórico | ¿Este período está suficientemente completo? | dominios conciliados, pendientes, diferencias, fecha de corte | resolver, cerrar con pendientes explícitos, cancelar | control, reportes | V2 |

## 1.14 Planificación

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Planes y escenarios | Reunir evaluaciones futuras creadas por usuario | ¿Qué decisiones futuras estoy evaluando? | escenarios, horizonte, estado, diferencia contra base | crear, duplicar, archivar, abrir | planificación, panorama | Futuro |
| Editor de escenario | Declarar cambios hipotéticos | ¿Qué pasaría si hago esto? | línea base, supuestos, decisión, fechas y montos | agregar supuesto, modificar, recalcular, guardar | planificación, agenda, dominios afectados | Futuro |
| Comparación de escenario | Mostrar efecto sin mezclarlo con realidad | ¿Cómo cambia mi posición si confirmo decisión? | base versus escenario en liquidez, deuda, objetivos y patrimonio | volver, confirmar decisión, descartar | planificación, panorama, agenda | Futuro |

## 1.15 Configuración y datos

| Pantalla | Objetivo | Pregunta que responde | Información principal | Acciones disponibles | Módulos conectados | Prioridad |
|---|---|---|---|---|---|---|
| Configuración | Administrar criterios y acceso a mantenimiento | ¿Qué reglas personales usa Doleth? | moneda principal, ámbitos, clasificación, valuación y datos | abrir configuración específica | configuración financiera | MVP |
| Monedas y valuación | Mantener monedas y criterios comunes | ¿Cómo se consolidan valores distintos? | monedas activas, tasas, fuentes, fechas y criterios | agregar moneda, actualizar tasa, cambiar criterio | configuración, valuación | V2 |
| Categorías y contrapartes | Mantener organización reutilizable | ¿Cómo nombro y agrupo mi actividad? | categorías, etiquetas, personas y organizaciones | crear, unir, editar, archivar | configuración, actividad, flujo | V2 |
| Ámbitos y titularidad | Administrar realidad personal y compartida | ¿Qué pertenece a quién y qué incluye cada consolidado? | ámbitos, participantes, porcentajes, elementos compartidos | crear ámbito, asignar titularidad, cambiar alcance | configuración, todos los dominios | Futuro |
| Datos y portabilidad | Controlar historia propia | ¿Cómo importo, respaldo o retiro mi información? | fuentes, importaciones, respaldos, exportaciones | importar, exportar, respaldar, restaurar, eliminar | entrada y portabilidad | V2 |

---

## 2. Navegación

## 2.1 Navegación principal

Doleth usa cinco destinos persistentes:

1. **Inicio** — situación actual.
2. **Actividad** — hechos registrados.
3. **Posición** — dinero, tarjetas, deudas, inversiones, patrimonio y objetivos.
4. **Agenda** — próximos hechos.
5. **Reportes** — evolución pasada.

Acción transversal:

**Registrar** permite iniciar operación desde cualquier destino sin entrar primero en módulo.

Configuración se accede desde identidad de usuario. No ocupa navegación diaria.

### 2.1.1 Razón

- cinco destinos caben en navegación mobile estable;
- cada nombre corresponde a pregunta humana;
- dominios complejos viven dentro de Posición, no compiten por lugar principal;
- presente, actividad, futuro e historia quedan separados;
- agregar información siempre está disponible.

## 2.2 Estructura de navegación

```text
Inicio
├── detalle de bloque
├── pendiente de revisión
└── Registrar

Actividad
├── búsqueda y filtros
├── detalle de operación
└── Registrar

Posición
├── Cuentas
├── Tarjetas
├── Deudas y cobros
├── Inversiones
├── Patrimonio
└── Objetivos

Agenda
├── próximos hechos
├── compromiso
└── cumplimiento

Reportes
├── Reporte mensual
├── Evolución patrimonial
├── Flujo histórico
└── Composición histórica

Configuración
├── criterios financieros
├── clasificación
├── ámbitos
└── datos
```

## 2.3 Reglas de navegación

1. Inicio siempre queda a una acción desde cualquier destino principal.
2. Registrar nunca exige elegir módulo antes de describir hecho.
3. Toda cifra consolidada abre detalle que la explica.
4. Detalle conserva camino de regreso y contexto de origen.
5. Edición no cambia destino actual hasta confirmar.
6. Operación guardada lleva a resultado, no a formulario vacío.
7. Posición muestra dominios en mismo orden: dinero, tarjetas, deudas, inversiones, patrimonio, objetivos.
8. Agenda abre elemento en módulo que lo originó cuando necesita edición estructural.
9. Reportes abren operaciones o saldos que explican cifra.
10. Configuración no mezcla acciones financieras cotidianas.
11. Mobile no usa más de un nivel de navegación persistente.
12. Ninguna función crítica queda detrás de “Más”.

## 2.4 Registrar sin menú infinito

Primer paso ofrece acciones frecuentes y una opción amplia:

- ingreso;
- gasto;
- transferencia;
- compra con tarjeta;
- pago;
- inversión;
- otro movimiento.

Opciones cambian por contexto. Desde detalle de deuda, acción principal ya significa pagar deuda. Desde inversión, significa operar posición.

Usuario elige significado humano. Doleth resuelve módulos afectados detrás del flujo.

---

## 3. Flujo exacto del MVP

## 3.1 Primer ingreso

1. Usuario entra por Acceso.
2. Bienvenida declara resultado: reunir situación financiera en un lugar.
3. Usuario define moneda principal y otras monedas que usa.
4. Doleth pregunta desde qué fecha comenzará registro.
5. Usuario llega a Carga inicial.
6. Carga inicial prioriza primera cuenta, no formulario total de vida financiera.

Salida: usuario entiende próximo paso y puede obtener valor sin completar todo.

## 3.2 Carga inicial de cuentas

1. Usuario elige tipo: efectivo, banco o billetera.
2. Define nombre, moneda y saldo actual.
3. Opcionalmente define institución y titularidad.
4. Guarda cuenta.
5. Doleth muestra dinero total y pregunta si existe otra cuenta.
6. Usuario agrega cuentas necesarias o continúa.
7. Resumen inicial declara qué parte de posición todavía falta cargar.

Salida: panorama inicial muestra dinero por ubicación y moneda.

## 3.3 Registro de primer movimiento

1. Usuario activa Registrar.
2. Elige ingreso, gasto o transferencia.
3. Indica monto, moneda, fecha y cuenta.
4. Agrega contraparte o categoría solo si aporta valor.
5. Confirma.
6. Doleth muestra resultado: cuenta afectada, nuevo saldo y efecto en mes.
7. Actividad incorpora operación.

Salida: usuario comprende que un hecho se carga una vez y actualiza todo.

## 3.4 Visualización del panorama

1. Usuario abre Inicio.
2. Ve dinero disponible y fecha de actualización.
3. Ve próximos compromisos conocidos.
4. Ve ingresos, gastos y ahorro del mes.
5. Ve activos, deudas y patrimonio neto cargado.
6. Ve faltantes o datos desactualizados sin bloquear uso.
7. Abre cualquier cifra para entender origen.

Salida: usuario puede responder dónde está parado y qué parte de lectura es incompleta.

## 3.5 Carga de tarjeta y cuotas

1. Desde Posición, usuario abre Tarjetas.
2. Agrega emisor, identificación, moneda, límite, cierre y vencimiento.
3. Registra compra.
4. Indica monto total, fecha y cantidad de cuotas.
5. Doleth muestra calendario completo antes de confirmar.
6. Usuario confirma.
7. Tarjeta muestra deuda actual; Agenda muestra próximas cuotas; Flujo reconoce consumo una vez.

Salida: compra, deuda y calendario quedan conectados sin duplicación.

## 3.6 Carga de deuda

1. Usuario abre Deudas y cobros.
2. Elige “yo debo” o “me deben”.
3. Define contraparte, monto, moneda, saldo actual y condiciones.
4. Si recibió o entregó dinero ahora, vincula cuenta correspondiente.
5. Define pago único o calendario.
6. Revisa resumen y confirma.
7. Panorama actualiza deuda; Agenda incorpora vencimientos.

Salida: saldo pendiente y próximos pagos quedan visibles.

## 3.7 Carga de inversión

1. Usuario abre Inversiones.
2. Elige agregar posición existente o registrar compra actual.
3. Define instrumento, cantidad, moneda, costo o valor inicial y custodio.
4. Si es compra actual, elige cuenta de origen.
5. Confirma.
6. Doleth muestra posición, valor, costo y efecto sobre dinero.
7. Panorama actualiza composición sin tratar compra como gasto.

Salida: cartera forma parte de posición global.

## 3.8 Revisión mensual

1. Usuario abre Reporte mensual.
2. Elige mes.
3. Revisa ingresos, gastos, ahorro y variación de posición.
4. Revisa tarjetas, deudas e inversiones al cierre.
5. Doleth señala saldos no confirmados o registros incompletos.
6. Usuario corrige desde origen o acepta pendiente explícito.
7. Reporte conserva corte del mes.

Salida: usuario entiende qué cambió, por qué y qué información sigue incompleta.

---

## 4. Pantalla principal

Nombre oficial: **Inicio / Panorama**.

Pregunta única:

**¿Dónde estoy parado financieramente?**

## 4.1 Orden de información

### Contexto de lectura

Muestra antes de cifras:

- fecha y hora de actualización;
- moneda de lectura;
- ámbito incluido;
- existencia de información pendiente.

Razón: cifra sin fecha, moneda y alcance puede parecer exacta cuando no lo es.

### Bloque 1 — Dinero disponible

Muestra:

- dinero total;
- dinero disponible;
- dinero reservado;
- distribución mínima por moneda.

Responde: **¿Cuánto puedo usar hoy?**

Razón: primera necesidad operativa.

### Bloque 2 — Próximos compromisos

Muestra:

- total próximo a vencer;
- vencimiento más cercano;
- tarjetas, cuotas y deudas relevantes;
- cobertura disponible.

Responde: **¿Qué debo cubrir pronto?**

Razón: saldo aislado no explica presión financiera.

### Bloque 3 — Mes actual

Muestra:

- ingresos;
- gastos;
- ahorro o diferencia;
- comparación simple con mes anterior cuando exista historia.

Responde: **¿Cómo viene el mes?**

Razón: conecta posición actual con comportamiento reciente.

### Bloque 4 — Posición total

Muestra:

- activos totales;
- deudas totales;
- patrimonio neto;
- parte líquida y parte no líquida.

Responde: **¿Qué tengo, qué debo y cuánto queda?**

Razón: evita confundir caja con riqueza total.

### Bloque 5 — Composición

Muestra resumen de:

- cuentas;
- inversiones;
- patrimonio;
- deudas;
- objetivos.

Responde: **¿Dónde está distribuida mi situación?**

Razón: permite entrar a dominio sin convertir Inicio en menú.

### Bloque 6 — Cambios importantes

Muestra pocos cambios desde última revisión:

- variación de saldo;
- nueva obligación;
- pago relevante;
- cambio de valuación;
- avance o uso de reserva.

Responde: **¿Qué explica que hoy esté diferente?**

Razón: posición sin explicación obliga a reconstruir historia manualmente.

### Bloque 7 — Información para revisar

Muestra solo pendientes materiales:

- cuenta desactualizada;
- diferencia de saldo;
- tarjeta próxima sin pago registrado;
- inversión sin valuación reciente;
- operación incompleta.

Responde: **¿Qué falta para confiar en esta lectura?**

Razón: transparencia sobre calidad sin contaminar bloques principales.

## 4.2 Reglas del Panorama

1. No muestra más de una cifra principal por bloque.
2. No mezcla realizado con proyectado.
3. No presenta patrimonio como dinero disponible.
4. No cuenta transferencias como ingresos o gastos.
5. No cuenta compra de inversión como consumo.
6. No duplica compra con tarjeta y pago de tarjeta.
7. Todo bloque abre explicación.
8. Ausencia de datos se declara; no se completa con estimación silenciosa.
9. Bloque sin contenido material puede desaparecer.
10. Pendientes no impiden ver información confirmada.

---

## 5. Flujos críticos

## 5.1 Agregar cuenta

Inicio: Posición > Cuentas > Agregar.

1. Elegir tipo de cuenta.
2. Nombrar cuenta.
3. Elegir moneda.
4. Indicar saldo actual o saldo inicial con fecha.
5. Agregar institución y titularidad cuando corresponda.
6. Confirmar.
7. Ver cuenta creada y efecto en Panorama.

Datos obligatorios: tipo, nombre, moneda, saldo y fecha.  
Resultado: cuenta disponible para futuras operaciones.  
Corrección: editar datos descriptivos o revisar saldo; nunca borrar historia asociada sin advertencia.

## 5.2 Agregar ingreso

Inicio: Registrar > Ingreso.

1. Indicar monto y moneda.
2. Elegir cuenta receptora.
3. Indicar fecha.
4. Agregar fuente o contraparte opcional.
5. Marcar recurrencia solo si aplica.
6. Confirmar.
7. Ver nuevo saldo y efecto en flujo mensual.

Datos obligatorios: monto, moneda, cuenta y fecha.  
Resultado: actividad, saldo y flujo actualizados.  
Excepción: transferencia propia debe cambiar a flujo de transferencia antes de guardar.

## 5.3 Agregar gasto

Inicio: Registrar > Gasto.

1. Indicar monto y moneda.
2. Elegir medio: cuenta, efectivo o tarjeta.
3. Indicar fecha.
4. Agregar comercio, contraparte o categoría opcional.
5. Si fue tarjeta, continuar como compra de tarjeta.
6. Confirmar.
7. Ver efecto en saldo o deuda y en flujo mensual.

Datos obligatorios: monto, moneda, medio y fecha.  
Resultado: consumo registrado una vez.  
Excepción: compra de inversión debe cambiar a operación de inversión.

## 5.4 Agregar tarjeta

Inicio: Posición > Tarjetas > Agregar.

1. Elegir emisor.
2. Definir nombre o identificación.
3. Elegir moneda.
4. Indicar límite opcional.
5. Indicar cierre y vencimiento.
6. Definir titularidad.
7. Confirmar.
8. Ver tarjeta lista para recibir consumos.

Datos obligatorios: nombre, moneda, cierre y vencimiento.  
Resultado: tarjeta conectada con Agenda.

## 5.5 Agregar compra en cuotas

Inicio: Registrar > Compra con tarjeta, o Detalle de tarjeta > Registrar compra.

1. Elegir tarjeta.
2. Indicar monto total, moneda y fecha.
3. Indicar cantidad de cuotas.
4. Indicar primera cuota o fecha inicial si difiere del calendario de tarjeta.
5. Agregar comercio y categoría opcionales.
6. Revisar valor y fechas de cuotas.
7. Confirmar.
8. Ver consumo en tarjeta, compromisos en Agenda y gasto único en flujo.

Datos obligatorios: tarjeta, monto total, moneda, fecha y cantidad de cuotas.  
Resultado: una compra, un plan de cuotas y varios vencimientos conectados.  
Regla: cuotas no generan gastos nuevos cada mes.

## 5.6 Agregar deuda

Inicio: Posición > Deudas y cobros > Agregar.

1. Elegir “yo debo” o “me deben”.
2. Identificar contraparte.
3. Indicar principal, moneda y saldo pendiente.
4. Indicar fecha de origen.
5. Definir pago único o cuotas.
6. Agregar tasa, interés o notas cuando existan.
7. Vincular desembolso con cuenta si ocurrió dentro de período registrado.
8. Revisar calendario.
9. Confirmar.

Datos obligatorios: dirección, contraparte, moneda, saldo y fecha.  
Resultado: saldo pendiente en Posición y fechas en Agenda.

## 5.7 Registrar pago de deuda

Inicio: Detalle de deuda > Registrar pago.

1. Ver saldo pendiente antes de pago.
2. Indicar monto y fecha.
3. Elegir cuenta de origen.
4. Separar capital e interés cuando corresponda.
5. Confirmar si pago completa obligación.
6. Guardar.
7. Ver nuevo saldo, operación en Actividad y agenda actualizada.

Datos obligatorios: deuda, monto, fecha y cuenta.  
Resultado: disminuyen dinero y obligación; solo interés afecta costo financiero.  
Excepción: pago mayor al saldo exige corrección o tratamiento explícito de excedente.

## 5.8 Agregar inversión

Inicio: Posición > Inversiones > Agregar.

1. Elegir posición existente o compra nueva.
2. Identificar instrumento.
3. Indicar cantidad y moneda.
4. Indicar costo o valor inicial.
5. Elegir custodio o cuenta de inversión.
6. Si es compra nueva, elegir cuenta de origen y costos.
7. Confirmar.
8. Ver posición y efecto consolidado.

Datos obligatorios: instrumento, cantidad, moneda, fecha y costo o valor.  
Resultado: posición visible; compra nueva reduce dinero sin crear gasto de consumo.

## 5.9 Actualizar valor de inversión

Inicio: Detalle de inversión > Actualizar valor.

1. Ver última valuación y fecha.
2. Indicar precio unitario o valor total.
3. Indicar moneda y fecha.
4. Indicar fuente opcional.
5. Confirmar.
6. Ver nuevo valor y variación no realizada.

Datos obligatorios: valor, moneda y fecha.  
Resultado: cambia valuación, no saldo ni flujo.  
Excepción: compra, venta o rendimiento debe registrarse como operación, no valuación.

## 5.10 Agregar objetivo de ahorro

Inicio: Posición > Objetivos > Crear.

1. Nombrar propósito.
2. Indicar monto y moneda.
3. Agregar fecha y prioridad opcionales.
4. Elegir cuenta de respaldo.
5. Indicar monto inicial a reservar.
6. Confirmar.
7. Ver objetivo, dinero asignado y dinero todavía libre.

Datos obligatorios: nombre, monto y moneda.  
Resultado: valor existente queda asignado sin duplicarse.  
Excepción: aporte mayor que saldo disponible exige reducir aporte o elegir otra cuenta.

## 5.11 Ver reporte mensual

Inicio: Reportes > Reporte mensual.

1. Elegir mes.
2. Ver posición inicial y final.
3. Ver ingresos, gastos y ahorro.
4. Ver cambios en tarjetas y deudas.
5. Ver cambios en inversiones y objetivos.
6. Revisar variaciones principales.
7. Abrir operación o dominio que explica cifra.
8. Resolver pendientes materiales.
9. Confirmar revisión mensual.

Resultado: corte mensual comprensible y rastreable.  
Regla: reporte distingue flujo, transferencia, deuda y revaluación.

---

## 6. Qué no mostrar

## 6.1 Oculto siempre

- nombres de entidades ontológicas internas;
- estados técnicos de valor;
- reglas internas de clasificación;
- identificadores y claves del sistema;
- estructura de vínculos entre registros;
- cálculos intermedios sin significado para usuario;
- hipótesis internas y lógica de derivación;
- información de infraestructura;
- datos duplicados solo por pertenecer a varios módulos.

## 6.2 Oculto por defecto, disponible bajo demanda

- detalle completo de conversión monetaria;
- fuente y fecha de cada valuación;
- desglose de capital, interés, cargos e impuestos;
- historial de correcciones;
- comprobantes;
- criterios de conciliación;
- operaciones que forman agregado;
- distribución completa por categorías;
- meses antiguos;
- cuentas archivadas;
- campos opcionales avanzados;
- titularidad y ámbitos cuando usuario solo administra esfera personal.

## 6.3 No mostrar en Inicio

- cronología completa;
- todas las cuentas individualmente;
- todas las categorías de gasto;
- cada cuota futura;
- cada instrumento de inversión;
- gráficos sin pregunta concreta;
- comparación social;
- puntuación financiera única;
- mensajes de culpa;
- recomendaciones de productos;
- proyecciones mezcladas con saldos actuales;
- alertas sin impacto material;
- información sin actualizar presentada como actual.

## 6.4 No pedir durante carga frecuente

- campos que no alteran saldo, agenda, clasificación útil o trazabilidad;
- misma información ya conocida por contexto;
- categoría obligatoria para registrar hecho;
- notas obligatorias;
- comprobante obligatorio;
- contraparte obligatoria salvo deuda o cobro;
- tasa obligatoria si usuario solo conoce saldo;
- valuación exacta de activo cuando solo existe estimación.

## 6.5 Regla de revelación

Primero mostrar respuesta. Después permitir explicación. Finalmente ofrecer evidencia y detalle técnico cuando usuario lo solicita.

---

## 7. MVP final

## 7.1 Promesa verificable

Primera versión debe permitir:

**cargar cuentas, flujo, tarjetas, deudas, inversiones y objetivos; registrar operaciones cotidianas; ver próximos compromisos; y cerrar mes entendiendo posición completa cargada.**

## 7.2 Pantallas incluidas

### Acceso y comienzo

1. Acceso.
2. Bienvenida.
3. Configuración financiera inicial.
4. Carga inicial.
5. Resumen inicial.

### Navegación diaria

6. Inicio / Panorama.
7. Actividad.
8. Registrar operación.
9. Detalle de operación.
10. Posición.
11. Agenda.
12. Reportes.
13. Configuración.

### Dinero y flujo

14. Cuentas.
15. Detalle de cuenta.
16. Agregar o editar cuenta.
17. Transferir entre cuentas.
18. Revisar saldo.
19. Flujo del período.

### Tarjetas

20. Tarjetas.
21. Detalle de tarjeta.
22. Agregar o editar tarjeta.
23. Registrar compra en cuotas.
24. Registrar pago de tarjeta.

### Deudas

25. Deudas y cobros.
26. Detalle de deuda o préstamo.
27. Agregar deuda o préstamo.
28. Registrar pago o cobro.

### Inversiones

29. Inversiones.
30. Detalle de inversión.
31. Agregar inversión.
32. Actualizar valuación.

### Objetivos

33. Objetivos.
34. Detalle de objetivo.
35. Crear o editar objetivo.

### Revisión

36. Reporte mensual.

Total: **36 pantallas funcionales**. Varias comparten estructura futura, pero cada una representa responsabilidad y estado de navegación distintos.

## 7.3 Flujos incluidos

1. primer ingreso y configuración mínima;
2. carga inicial de cuentas y saldos;
3. registro de ingreso;
4. registro de gasto;
5. transferencia entre cuentas;
6. corrección de operación;
7. revisión de saldo;
8. alta de tarjeta;
9. compra con tarjeta en una cuota;
10. compra con tarjeta en varias cuotas;
11. pago de tarjeta;
12. alta de deuda propia;
13. alta de préstamo otorgado;
14. pago de deuda;
15. cobro de préstamo;
16. alta de posición de inversión;
17. compra simple de inversión;
18. actualización manual de valuación;
19. creación de objetivo;
20. aporte y retiro de reserva;
21. consulta de Agenda;
22. consulta de Panorama;
23. revisión mensual.

## 7.4 Fuera del MVP

- importaciones externas;
- conciliación avanzada por lotes;
- resumen formal de tarjeta;
- recurrencias configurables;
- patrimonio físico;
- reportes históricos especializados;
- búsqueda global;
- planificación y escenarios;
- ámbitos compartidos;
- valuaciones automáticas;
- reestructuración de deudas;
- respaldo y restauración administrables.

Estas capacidades esperan porque no son necesarias para probar núcleo: registro único, posición consolidada, obligaciones futuras y revisión mensual.

## 7.5 Orden de wireframes

1. Inicio / Panorama.
2. Registrar operación.
3. Actividad y detalle de operación.
4. Posición.
5. Cuentas, detalle y alta.
6. Flujo del período.
7. Tarjetas, detalle, compra y pago.
8. Deudas, detalle, alta y pago.
9. Inversiones, detalle, alta y valuación.
10. Objetivos, detalle y alta.
11. Agenda.
12. Reporte mensual.
13. Acceso y puesta en marcha.
14. Configuración.

### Razón del orden

Inicio fija jerarquía informativa. Registrar fija gramática operativa. Actividad demuestra resultado. Posición organiza dominios. Después se diseñan dominios en orden de dependencia. Onboarding se diseña al final porque debe introducir producto real, no una idea abstracta del producto.

## 7.6 Estados obligatorios para cada wireframe MVP

Cada pantalla debe definir:

- estado vacío;
- estado con información;
- estado desactualizado;
- estado con inconsistencia;
- operación exitosa;
- error corregible;
- regreso sin guardar;
- acceso al origen de cifra.

---

## 8. Cierre

Mapa oficial:

```text
Registrar hechos
    -> mantener cuentas y dominios
        -> ordenar próximos compromisos
            -> consolidar Panorama
                -> revisar evolución mensual
```

Doleth comienza con cinco destinos: Inicio, Actividad, Posición, Agenda y Reportes.

Primera versión construible contiene 36 pantallas funcionales y 23 flujos. Cubre dinero, ingresos, gastos, tarjetas, cuotas, deudas, préstamos, inversiones, objetivos, agenda y revisión mensual.

Este documento deja definido terreno funcional para wireframes de baja fidelidad.
