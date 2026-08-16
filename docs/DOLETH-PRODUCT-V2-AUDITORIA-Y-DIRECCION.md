# DOLETH PRODUCT V2 — AUDITORÍA Y DIRECCIÓN

Estado: propuesta ejecutable previa a implementación  
Fecha: 12 de agosto de 2026  
Fuente de verdad: código, esquema Prisma, migraciones y pruebas del repositorio actual

## 1. Veredicto ejecutivo

`READY_FOR_V2`

Doleth tiene una base técnica y financiera suficientemente madura para una V2 sin reescritura. Identidad, sesiones, ownership, ledger, anulaciones, correcciones, multi-moneda, importación reversible y exportación deben preservarse. La deuda principal no está en la integridad del núcleo: está en la arquitectura visible, el exceso de superficies analíticas y varios huecos operativos cotidianos.

La V2 debe ser una reorganización de producto con migraciones aditivas, no una sustitución de infraestructura.

Decisión central:

> Doleth deja de organizarse por interpretaciones abstractas y pasa a organizarse por objetos y tareas financieras.

Mapa propuesto: **Inicio · Movimientos · Cuentas · Plan · Patrimonio**, con acción global **+ Nuevo**.

## 2. Evidencia auditada

### Repositorio

- Next.js 16 App Router, React 19, TypeScript estricto.
- PostgreSQL + Prisma 7; 10 migraciones ordenadas entre núcleo, inversiones, identidad, ownership, multi-moneda, tarjetas, importación, holdings y auditoría admin.
- 77 archivos de prueba y 62 stories.
- `pnpm lint`: aprobado.
- `pnpm typecheck`: aprobado.
- `pnpm test`: no ejecutable en este entorno. Las 77 suites abortan antes de importar porque falta una `TEST_DATABASE_URL` PostgreSQL válida; resultado: 0 tests ejecutados. Esto es un bloqueo del entorno de prueba, no 77 fallas funcionales demostradas.
- Working tree limpio al comenzar la auditoría.

### Fuentes principales

- Modelo vigente: `prisma/schema.prisma`.
- Operaciones financieras: `src/app/actions/finance.ts`.
- Lecturas financieras: `src/lib/finance/data.ts` y `src/features/*/data`.
- Navegación: `src/components/finance/navModel.ts`.
- Identidad y autorización: `src/lib/auth`, `src/proxy.ts`.
- Importación: `src/lib/import`, `src/app/importar`.
- Diseño vigente: `DESIGN.md` y `src/design-system`.

### Autoridad documental

El código de agosto supera varios documentos congelados en julio. `SPEC-AUDIT-001` ya declara obsoleto al Master Specification Index y reduce autoridad de la arquitectura conceptual visible. Los freeze históricos sirven como registro de decisiones, no como obligación de conservar la navegación actual.

## 3. Arquitectura actual

```text
Navegador / PWA
  └─ Next.js App Router
      ├─ páginas públicas de identidad y legales
      ├─ páginas privadas protegidas por sesión
      ├─ Server Actions
      └─ rutas de exportación y salud
          └─ capa de dominio financiera
              ├─ ledger y proyecciones
              ├─ valuación y cotizaciones
              ├─ análisis por período
              ├─ importación normalizada
              └─ Prisma → PostgreSQL
```

Separaciones sanas:

- páginas consultan usuario desde sesión, nunca desde formulario o URL;
- consultas y relaciones financieras incluyen `userId`;
- componentes reciben view models formateados;
- fixtures quedan fuera de rutas productivas;
- importes usan `BigInt` en centavos;
- lectura multi-moneda no reescribe hechos;
- acciones financieras usan idempotencia y transacciones de base.

## 4. Flujo actual del usuario

### Acceso

1. `/` consulta sesión.
2. Sin sesión → `/iniciar-sesion`.
3. Registro público por defecto; beta privada sigue disponible por configuración.
4. Registro → verificación de correo → login.
5. Login válido → onboarding incompleto o `/ahora`.
6. Recuperación de contraseña, cambio de correo, cambio de contraseña, revocación de sesiones y baja tienen flujos reales y auditados.

### Onboarding actual

Cinco pantallas:

1. bienvenida;
2. moneda principal, zona horaria y locale;
3. moneda de lectura y variante de dólar;
4. primera cuenta y saldo inicial;
5. gastos fijos opcionales.

Es reanudable y no crea datos ficticios. Sin embargo, pide dos decisiones de valuación antes de mostrar valor y retrasa la entrada por un quinto paso opcional.

Dirección V2:

- mantener registro y verificación;
- reducir onboarding obligatorio a moneda principal + primera cuenta + saldo;
- derivar locale y zona horaria del dispositivo con edición posterior;
- mover moneda de lectura y variante de dólar a configuración progresiva;
- ofrecer gastos fijos después del primer valor, no antes de entrar.

### Uso cotidiano actual

- `/ahora`: síntesis de dinero, cuentas, próximos pagos, inversiones y evidencia.
- `/movimientos`: listado mensual con filtros por tipo y cuenta; detalle, corrección, anulación y repetición.
- `/proximo`: pagos previstos, cobertura y confirmación como gasto.
- `Más`: diez destinos secundarios, privacidad, exportaciones y logout.

Costo actual: para comprender la economía personal completa hay que atravesar superficies con nombres conceptuales y lecturas solapadas.

## 5. Inventario de operaciones reales

### Identidad y seguridad — conservar

- registro público o por invitación;
- verificación y reenvío de correo;
- login/logout;
- recuperación y cambio de contraseña;
- cambio de correo con confirmación;
- sesiones por dispositivo y revocación;
- solicitud/cancelación de baja;
- roles, suspensión, reactivación y auditoría admin;
- rate limits, cookies seguras y cabeceras defensivas;
- aislamiento multiusuario por ownership.

### Cuentas — conservar y completar

Existe:

- crear efectivo, banco, billetera, ahorro, tarjeta u otra cuenta;
- moneda ARS/USD;
- saldo inicial;
- cierre, vencimiento y últimos cuatro dígitos de tarjeta;
- saldo derivado desde ledger;
- archivar y reactivar.

Falta:

- detalle de cuenta;
- editar nombre y metadatos;
- ver movimientos de una cuenta desde su fila;
- ajuste de saldo trazable;
- conciliación explícita;
- institución y saldo disponible separado del contable.

### Movimientos — núcleo fuerte, captura incompleta

Existe:

- gasto, ingreso y transferencia;
- transferencia entre monedas con importe destino;
- categoría obligatoria para ingreso/gasto;
- fecha y descripción;
- borrador local, cuenta reciente e idempotencia;
- detalle auditable;
- anulación con motivo;
- corrección por reemplazo enlazado;
- duplicar/repetir movimiento;
- filtros por mes, tipo y cuenta;
- filtro indirecto por categoría desde reportes.

Falta:

- búsqueda de texto/importe;
- filtro visible por categoría, rango de fechas e importe;
- comercio/persona como campo de transacción;
- nota separada de descripción;
- etiquetas;
- comprobante;
- división de movimiento;
- acción de ajuste;
- edición simple de contexto que no requiera corregir todo el hecho.

### Gastos e ingresos

Existe:

- totales por período;
- comparación temporal;
- gasto por categoría, descripción/comercio inferido y cuenta;
- trazabilidad desde categoría a movimientos;
- detección heurística de recurrencias;
- ingresos incluidos en lecturas de período.

Falta:

- superficie clara de ingresos por fuente;
- contraparte/fuente persistida;
- búsqueda transversal;
- reglas de categorización;
- recurrencia persistida y administrable.

### Pagos futuros

Existe:

- crear pago previsto;
- fecha, cuenta, importe y frecuencia como texto;
- cobertura contra saldos;
- confirmar pago con importe/fecha reales;
- enlace al movimiento creado;
- crear manualmente otro para el mes siguiente.

Falta:

- editar;
- posponer;
- cancelar;
- estados cancelado/pospuesto;
- regla de recurrencia real;
- generación automática controlada;
- próximos ingresos;
- cuotas y resumen de tarjeta como entidades temporales.

### Inversiones

Existe:

- alta de tenencia manual;
- clase, símbolo, cantidad, aportado, valor actual, moneda y nota;
- precio externo opcional con fallback manual;
- total, ganancia/pérdida y distribución;
- archivado en acción de servidor.

Falta:

- UI de detalle, edición y archivado;
- compras, ventas, aportes y retiros como historial;
- vínculo con cuenta de fondeo;
- costo promedio y valuación histórica;
- evitar doble carga operativa entre transferencia e inversión.

Modelo actual `Investment` es una foto de tenencia, no un subledger de inversiones.

### Importación, portabilidad e integraciones — conservar

- CSV con detección y normalización;
- preview sin escribir;
- detección de duplicados;
- lote transaccional;
- reversión por anulaciones, no borrado;
- filas originales preservadas;
- exportación CSV/JSON aislada por usuario;
- dólar y precios cripto con fallback persistido/manual;
- PWA offline nivel 1 sin cachear información financiera privada.

## 6. Modelo de datos: seguridad de V2

### Base segura

- `Transaction` + `LedgerEntry` soportan integridad cotidiana.
- Relaciones compuestas `(id, userId)` impiden cruces de propietario.
- `voidedAt`, `correctedFromId` e idempotencia permiten cambios auditables.
- `UpcomingPayment.transactionId` conserva paso de previsto a real.
- tasas públicas y manuales separan mercado de preferencia personal.

### Cambios aditivos seguros

1. Contexto de movimiento:
   - `merchantOrPerson`;
   - `note`;
   - `metadata` estructurada solo si aparece un caso real;
   - etiquetas mediante tabla many-to-many;
   - comprobantes mediante entidad de archivo, nunca blob directo en `Transaction`.
2. Ajustes:
   - agregar `ADJUSTMENT` a `TransactionType` o una causa explícita equivalente;
   - siempre generar asiento y motivo; nunca editar `initialBalanceCents` después del alta.
3. Recurrencias:
   - `RecurrenceRule` separada de instancias `UpcomingPayment`;
   - estados `CANCELED` y `POSTPONED` o eventos equivalentes;
   - deduplicación por regla + período.
4. Objetivos:
   - `Goal` con monto, moneda, fecha opcional y vínculo opcional a cuenta;
   - progreso derivado, no saldo duplicado.
5. Inversiones:
   - conservar `Investment` durante transición;
   - agregar eventos/operaciones de inversión antes de prometer rendimiento histórico;
   - migrar valores actuales sin reinterpretar hechos.

### Cambios inseguros

- reescribir ledger para adaptar UI;
- borrar anulados o corregidos;
- convertir inversión actual en cuenta sin estrategia contra doble conteo;
- reutilizar `description` para nota, comercio, etiqueta y comprobante;
- inferir recurrencia y crear pagos automáticamente sin consentimiento;
- modificar saldos iniciales para “conciliar”.

## 7. Diagnóstico de navegación

Navegación actual:

```text
Ahora | Movimientos | + Registrar | Próximo | Más
Más
  Entender: En qué se fue, Cambios, Progreso, Mi realidad, Actuar
  Organizar: Cuentas, Inversiones, Importar, Moneda, Integraciones
```

Problemas:

- `Ahora`, `Cambios`, `Progreso` y `Mi realidad` recombinan el mismo ledger con distintos encuadres;
- `Actuar` simula una decisión persistida solo en estado local del componente, no una operación de dominio;
- “En qué se fue” es una dimensión central de movimientos, pero queda secundaria;
- cuentas e inversiones quedan escondidas aunque responden “dónde está mi plata”;
- configuración operativa se mezcla con comprensión financiera;
- el usuario debe aprender vocabulario de Doleth antes de encontrar objetos conocidos.

Dictamen: **reemplazar la arquitectura visible**. Conservar lógica analítica como módulos internos reutilizables.

## 8. Mapa definitivo V2

### Navegación primaria

1. **Inicio**
   - dinero disponible;
   - gasto e ingreso del mes;
   - invertido;
   - cambio contra período anterior;
   - próximos pagos críticos;
   - últimos movimientos.
2. **Movimientos**
   - historial único;
   - búsqueda;
   - filtros;
   - detalle, corrección, anulación, duplicación y contexto;
   - cortes por gastos e ingresos.
3. **Cuentas**
   - dinero, tarjetas y ahorro;
   - saldos;
   - detalle y actividad;
   - ajustes y conciliación.
4. **Plan**
   - pagos próximos;
   - recurrencias;
   - próximos ingresos;
   - objetivos.
5. **Patrimonio**
   - total;
   - disponible, ahorro, deuda e invertido;
   - inversiones;
   - evolución simple.

### Acción global

`+ NUEVO` abre selector corto:

- gasto;
- ingreso;
- transferencia;
- inversión;
- ajuste, solo desde contexto seguro o sección secundaria.

### Navegación secundaria

- Importar;
- moneda y cotizaciones;
- integraciones;
- exportar datos;
- privacidad de importes;
- cuenta, seguridad y sesiones;
- administración, solo para rol admin.

### Compatibilidad de rutas

- `/ahora` → Inicio durante transición, luego redirect estable;
- `/proximo` → Plan;
- `/en-que-se-fue` → Movimientos con vista Gastos;
- `/mi-realidad` → Patrimonio;
- `/cambios` y `/progreso` → módulos dentro de Inicio/Patrimonio;
- `/actuar` → retirar hasta existir una decisión real persistida;
- `/mi-realidad/cierre` → convertir en revisión de período dentro de Movimientos/Patrimonio, no destino principal.

## 9. Flujos definitivos

### Registrar gasto en 10 segundos

1. `+ Nuevo`.
2. `Gasto`.
3. Importe con foco automático.
4. Categoría.
5. Cuenta reciente preseleccionada.
6. Guardar.

Fecha = hoy. Detalles colapsados: comercio, nota, etiquetas, comprobante y recurrencia.

### Registrar ingreso

Mismo patrón. Categoría/fuente y cuenta. Contexto opcional después.

### Transferir

Importe → origen → destino → importe acreditado solo si cambia moneda → confirmar. Resumen previo conserva la protección actual.

### Buscar y corregir

Movimientos → búsqueda libre o filtros → fila → detalle → cambiar contexto, corregir hecho, anular o duplicar. Cambiar nota/etiqueta no debe crear una corrección financiera; cambiar importe/cuenta/fecha sí.

### Ajustar saldo

Cuenta → Ajustar → saldo observado → diferencia calculada → motivo → confirmar. Se crea movimiento de ajuste auditable; saldo inicial queda intacto.

### Pago recurrente

Plan → Nuevo pago → datos → “Repetir” estructurado → guardar regla e instancia. Al pagar: importe/fecha real → movimiento → próxima instancia según regla. Pausar/cancelar afecta futuro, no historia.

### Inversión

Patrimonio → Inversiones → Registrar operación → compra/aporte/venta/retiro/valuación manual. V2 inicial puede mantener alta de posición, pero no debe presentarla como historial hasta agregar operaciones.

## 10. Lenguaje visual V2

Dirección: **brutalismo financiero funcional**.

No copiar una referencia ausente del repositorio. Traducir principios: contundencia tipográfica, estructura editorial, bordes y números grandes sin sacrificar lectura.

### Decisión respecto de `DESIGN.md`

`DESIGN.md` sigue siendo autoridad hasta que se apruebe e implemente un reemplazo. V2 conserva sus activos útiles —jerarquía, neutralidad, tabulares, evidencia, accesibilidad, motion causal— y cambia lo incompatible:

| Actual | V2 |
|---|---|
| quiet precision | exactitud contundente |
| serif interpretativa | grotesca/condensada para titulares |
| superficies suaves | planos editoriales y líneas |
| radios 8–28 px | 0–4 px; full solo para tags reales |
| bordes tenues | bordes estructurales 1–2 px |
| cards compuestas | zonas, tablas y bloques conectados |
| copy explicativa | labels y veredictos cortos |

### Sistema propuesto

- Fondo: hueso claro vigente, no blanco clínico.
- Texto: tinta casi negra vigente.
- Acento: mineral oscuro solo para acción/selección.
- Semánticos: conservar atención y crítico desaturados; texto siempre acompaña color.
- Titulares: sans grotesca condensada, caja alta solo en rótulos y titulares breves.
- UI: Manrope puede conservarse durante transición.
- Datos: IBM Plex Mono o sans con tabulares; alineación por columna.
- Serif: retirar de superficies operativas; evaluar solo marca/editorial fuera del flujo diario.
- Grid: 4 columnas mobile, 12 desktop; divisores continuos y asimetría controlada.
- Touch: mínimo 44×44 px pese a apariencia compacta.
- Motion: 120–280 ms, causal, sin entradas decorativas.
- Gráficos: uno cuando responde una pregunta; siempre con cifras y drill-down.

Regla: visualmente intenso, cognitivamente simple.

## 11. Conservar, fusionar, retirar, crear

### Conservar

- autenticación, autorización y administración;
- ledger, idempotencia, anulaciones y correcciones;
- ownership compuesto;
- valuación y multi-moneda;
- importación/exportación;
- PWA y privacidad de importes;
- view models y cálculos puros;
- evidence sheets, confirmaciones y estados accesibles;
- Storybook y tokens como infraestructura.

### Fusionar

- Ahora + partes de Cambios → Inicio;
- En qué se fue + historial → Movimientos;
- Mi realidad + inversiones + partes de Progreso → Patrimonio;
- Próximo + recurrencias + objetivos → Plan;
- revisión mensual → vista de período, no mini-app de siete pasos.

### Retirar de navegación

- Actuar;
- Cambios;
- Progreso;
- Mi realidad;
- Integraciones como destino financiero principal.

Retirar de navegación no implica borrar cálculos ni rutas inmediatamente. Primero redirigir, medir y luego eliminar UI huérfana.

### Crear

- shell V2 desktop/mobile;
- Inicio V2;
- selector global + Nuevo;
- detalle de cuenta y ajuste;
- búsqueda de movimientos;
- contexto de movimiento;
- recurrencia estructurada;
- objetivos simples;
- operaciones de inversión;
- historial patrimonial mínimo.

## 12. Cortes de implementación

### Corte 0 — Guardia de integridad

- reparar entorno de pruebas con PostgreSQL descartable;
- ejecutar 77 suites, build y Storybook;
- capturar baseline de rutas y cálculos;
- acordar migración de `DESIGN.md` antes de tocar UI.

Salida: núcleo verde y baseline reproducible.

### Corte 1 — Arquitectura visible

- nuevo nav model;
- redirects de compatibilidad;
- Inicio compuesto desde lecturas actuales;
- secondary menu reducido;
- sin migración de datos.

Salida: producto entendible por objetos sin perder capacidad.

### Corte 2 — Registro rápido

- selector + Nuevo;
- progressive disclosure;
- recent account y borradores preservados;
- feedback y confirmación actual reutilizados;
- pruebas 320/375/390/desktop.

Salida: gasto cotidiano registrable en ~10 s.

### Corte 3 — Movimientos completos

- búsqueda y filtros;
- contexto aditivo;
- diferencia entre editar contexto y corregir hecho;
- drill-down desde gastos/ingresos;
- migración aditiva.

Salida: historial localizable y corregible.

### Corte 4 — Cuentas operables

- detalle;
- edición segura;
- movimientos por cuenta;
- ajuste trazable;
- conciliación básica.

Salida: “dónde está mi plata” resuelto desde Cuentas.

### Corte 5 — Plan real

- editar/posponer/cancelar pagos;
- recurrencias estructuradas;
- próximos ingresos;
- objetivos simples;
- migración aditiva y job idempotente.

Salida: futuro administrable, no solo listado.

### Corte 6 — Patrimonio e inversiones

- superficie consolidada;
- evolución simple;
- detalle y operaciones de inversión;
- migración progresiva de snapshots.

Salida: “cuánto tengo” con historia y procedencia.

### Corte 7 — Lenguaje visual y retiro de legado

- actualizar `DESIGN.md` y tokens;
- migrar componentes por patrón real;
- retirar superficies redirigidas cuando no tengan consumidores;
- QA visual, accesibilidad, contenido largo, importes extremos y offline.

Salida: brutalismo funcional consistente, sin duplicación visible.

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| romper cálculos al fusionar pantallas | reutilizar data/view models; cambiar composición primero |
| doble conteo de inversiones | mantener separación actual hasta diseñar subledger |
| corrección usada para cambios cosméticos | separar contexto mutable de hechos financieros |
| recurrencias duplicadas | clave única por regla/período e idempotencia |
| brutalismo reduce accesibilidad | targets 44 px, contraste AA, labels explícitos, 320 px obligatorio |
| documentos viejos vuelven a gobernar | declarar este informe y código actual como baseline V2 |
| suite da falsa confianza | no comenzar migraciones hasta ejecutar pruebas con DB válida |

## 14. Condiciones de salida

V2 puede comenzar porque:

- núcleo financiero soporta evolución aditiva;
- operaciones críticas tienen semántica auditable;
- aislamiento multiusuario está modelado en DB y código;
- navegación puede reemplazarse sin cambiar ledger;
- huecos funcionales están delimitados;
- no hace falta una reescritura.

Condición previa al primer merge de implementación:

1. PostgreSQL de prueba válido;
2. suite completa verde o fallas reales clasificadas;
3. baseline de build;
4. actualización explícita de autoridad visual al iniciar Corte 7 o antes del primer cambio visual.

## 15. Veredicto

`READY_FOR_V2`

Evidencia concreta: base técnica compila y tipa; esquema protege ownership y trazabilidad; operaciones reales cubren identidad, cuentas, ledger, pagos, importación e inversiones; V2 puede construirse mediante composición nueva y migraciones aditivas. Único bloqueo inmediato observado es el entorno local de tests, que debe resolverse antes de modificar dominio o esquema, pero no impide definir ni iniciar el corte de arquitectura sin datos.
