# PRODUCT RESEARCH 001

## Benchmark Estratégico de Doleth

Estado: investigación de producto  
Fecha: 2 de julio de 2026  
Ámbito: experiencia, alcance funcional, navegación e identidad  
Depende de: `PRD-002`, `DOLETH PRODUCT BLUEPRINT` y `UX-BLUEPRINT-001`  

## 0. Propósito y método

Este documento estudia decisiones de producto detrás de aplicaciones financieras relevantes. No busca copiar funciones ni estilos.

Busca responder:

- qué problema eligió resolver cada producto;
- qué sacrificó para resolverlo bien;
- dónde aparece fricción cuando amplía alcance;
- qué decisiones conviene trasladar, evitar o superar en Doleth.

### 0.1 Criterios observados

Cada producto se evalúa sobre:

1. filosofía;
2. público objetivo;
3. fortalezas;
4. debilidades;
5. experiencia de uso;
6. velocidad de carga de información;
7. navegación;
8. dashboard;
9. organización de cuentas;
10. inversiones;
11. deudas;
12. presupuestos;
13. reportes;
14. onboarding;
15. identidad visual.

### 0.2 Fuentes y límites

Investigación usa sitios oficiales, centros de ayuda, fichas de tiendas y documentación pública consultada en julio de 2026. Debilidades son evaluación de producto basada en flujos publicados, límites documentados y, cuando se indica, patrones reportados por usuarios.

No se evaluó estabilidad real mediante uso prolongado con cuentas financieras conectadas. Velocidad refiere principalmente a cantidad de pasos y esfuerzo cognitivo, no a rendimiento técnico medido.

---

## 1. Conclusiones ejecutivas

### 1.1 No existe ganador absoluto

Cada producto fuerte domina una pregunta distinta:

- **Monefy:** ¿cómo registro un gasto ahora mismo?
- **YNAB:** ¿qué trabajo debe hacer dinero que ya tengo?
- **Monarch Money:** ¿cómo reúno finanzas de hogar completo?
- **Copilot Money:** ¿cómo entiendo actividad automática con experiencia premium?
- **Wallet:** ¿cómo accedo a muchas herramientas financieras en un solo producto?
- **Spendee:** ¿cómo comparto y visualizo gastos cotidianos?
- **Lunch Money:** ¿cómo organizo datos financieros con flexibilidad máxima?
- **Empower:** ¿cómo veo patrimonio e inversiones consolidadas?
- **Money Manager:** ¿cómo mantengo registro manual exhaustivo?
- **Origin:** ¿cómo reúno tracking, inversiones y servicios financieros?
- **Quicken Simplifi:** ¿cuánto queda disponible después de compromisos conocidos?

### 1.2 Decisión más importante no es cantidad de funciones

Productos memorables tienen centro reconocible:

- captura;
- método;
- consolidación;
- visualización;
- control patrimonial;
- planificación de flujo.

Productos pierden claridad cuando cada nueva capacidad obtiene mismo peso en dashboard y navegación.

### 1.3 Oportunidad de Doleth

Mercado se divide entre:

- trackers rápidos pero poco completos;
- presupuestadores profundos pero exigentes;
- agregadores completos pero dependientes de sincronización;
- gestores patrimoniales que descuidan operación cotidiana;
- suites amplias que mezclan tracking con venta de servicios.

Doleth puede ocupar espacio menos resuelto:

**administración financiera personal integral, mobile-first, comprensible aun con carga manual, donde dinero, tarjetas, cuotas, deudas, inversiones, patrimonio y objetivos formen una sola posición verificable.**

---

## 2. Análisis por producto

## 2.1 Monefy

Fuentes principales: [sitio oficial](https://monefy.com/) y [ficha de Google Play](https://play.google.com/store/apps/details?id=com.monefy.app.lite).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Reducir registro de gasto a gesto inmediato. Conciencia financiera nace de constancia, no de configuración extensa. |
| Público objetivo | Persona que quiere controlar ingresos y gastos manualmente sin aprender método complejo. |
| Experiencia | Directa, táctil y centrada en importe. Categorías visuales permiten registrar antes de analizar. |
| Velocidad de carga | Excelente para gasto o ingreso simple: importe, categoría y confirmación. Menos eficiente cuando operación exige cuentas, transferencias, recurrencia o contexto. |
| Navegación | Poca profundidad. Acción de agregar domina experiencia. Historial y estadísticas quedan cerca. |
| Dashboard | Distribución de gastos mediante gráfico circular y balance del período. Comprensible, pero centrado en consumo. |
| Cuentas | Soporta múltiples cuentas y monedas. Sirven principalmente como contenedores de movimientos. |
| Inversiones | No constituye dominio profundo. Puede representar saldos o cuentas, no cartera completa. |
| Deudas | Sin administración estructurada comparable con préstamo, calendario y saldo pendiente. |
| Presupuestos | Presupuesto mensual sencillo, ligado a categorías y comparación ingreso-gasto. |
| Reportes | Claros para distribución e historial; limitados para patrimonio, deuda o explicación multicausal. |
| Onboarding | Bajo esfuerzo. Producto puede usarse casi inmediatamente. |
| Identidad visual | Alegre, verde, iconográfica y reconocible. Prioriza accesibilidad sobre sofisticación patrimonial. |

### Fortalezas

- Tiempo hasta primer valor extremadamente corto.
- Registro manual tratado como interacción principal, no como fracaso de automatización.
- Modelo visual entendible sin educación previa.
- Acción frecuente siempre evidente.
- Funciona para efectivo y realidad parcialmente desconectada.

### Debilidades

- Mundo financiero se reduce demasiado a ingreso, gasto, cuenta y categoría.
- Gráfico circular puede convertirse en resumen repetitivo sin orientar sobre obligaciones o patrimonio.
- Operaciones compuestas pierden naturalidad.
- Inversiones, deuda, cuotas y objetivos no forman dominios sólidos.
- Rapidez inicial no escala bien hacia vida financiera completa.

### Lección para Doleth

Copiar disciplina de captura, no reducción conceptual. Primer gasto debe ser tan rápido como en Monefy, pero Doleth debe conservar profundidad cuando hecho no es gasto simple.

---

## 2.2 YNAB

Fuentes principales: [funciones](https://www.ynab.com/features), [guía inicial](https://www.ynab.com/video-courses/using-your-ynab-budget/), [navegación mobile](https://support.ynab.com/en_us/spaces-in-the-mobile-app-S1iIZQoqgg) y [reportes Reflect](https://support.ynab.com/en_us/reflect-in-ynab-B1GJsrWkj).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Dar trabajo a dinero disponible. Producto enseña método explícito y convierte planificación activa en hábito. |
| Público objetivo | Persona dispuesta a aprender y mantener sistema de presupuesto para tomar control intencional del gasto. |
| Experiencia | Coherente porque método decide lenguaje, acciones y estados. Requiere adaptación mental inicial. |
| Velocidad de carga | Alta después de aprender flujo; media o baja durante configuración inicial de cuentas, categorías y objetivos. |
| Navegación | Mobile 2026 usa Home, Plan, Spending, Accounts y Reflect. Cada destino corresponde a momento del método. |
| Dashboard | Home prioriza acciones pendientes, categorías importantes, objetivo actual y resumen mensual. No intenta mostrar finanzas completas. |
| Cuentas | Diferencia cuentas incluidas en plan y cuentas de seguimiento. Permite vincular, ordenar, priorizar, conciliar y cerrar. |
| Inversiones | Se administran principalmente como cuentas de seguimiento; análisis de cartera no es centro. |
| Deudas | Loan Planner aporta saldo, pagos y efecto de aportes extra. Tarjetas están integradas al método presupuestario. |
| Presupuestos | Referencia de mercado en presupuesto base cero, objetivos, rollovers y reasignación. |
| Reportes | Net worth, gasto, ingreso versus gasto y Age of Money. Parte del detalle sigue siendo más fuerte en web. |
| Onboarding | Educativo y guiado. Guía oficial reconoce 20–30 minutos para configuración completa, aunque ofrece inicio reducido. |
| Identidad visual | Optimista, humana, colorida y editorial. Lenguaje reduce culpa y convierte disciplina en progreso. |

### Fortalezas

- Filosofía producto-experiencia excepcionalmente coherente.
- Cada dólar asignado tiene significado visible.
- Estados accionables: sin financiar, excedido, asignado, disponible.
- Excelente tratamiento de objetivos y gastos no mensuales.
- Educación y producto se refuerzan mutuamente.
- Conciliación y corrección forman parte de uso normal.

### Debilidades

- Método es fuerte, pero obliga a usuario a pensar como YNAB.
- Setup y mantenimiento de categorías pueden sentirse como trabajo.
- Patrimonio, inversiones y activos reales son secundarios.
- Posición integral queda fragmentada entre plan, cuentas y Reflect.
- Usuario que solo busca claridad puede encontrar demasiada prescripción.

### Lección para Doleth

Adoptar consistencia entre dinero disponible, reservas y obligaciones. Evitar convertir método de presupuesto en requisito para obtener claridad.

---

## 2.3 Monarch Money

Fuentes principales: [guía inicial](https://help.monarchmoney.com/hc/en-us/articles/360048393272-Getting-Started-Guide), [funciones recurrentes e inversiones](https://www.monarchmoney.com/features/recurring), [presupuestos](https://help.monarchmoney.com/hc/en-us/articles/360048883631-Budgets) y [reportes](https://help.monarch.com/hc/en-us/articles/21846787088916-Using-Reports).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Agregar vida financiera de hogar y ofrecer presupuesto, objetivos, patrimonio e informes dentro de experiencia premium. |
| Público objetivo | Individuos y parejas con varias cuentas que quieren reemplazar agregadores generalistas. |
| Experiencia | Amplia y configurable. Potente cuando conexiones están completas; setup inicial requiere dedicación. |
| Velocidad de carga | Muy alta con sincronización confiable; media cuando exige corregir categorías, duplicados y conexiones. Carga manual queda disponible. |
| Navegación | Secciones claras para dashboard, cuentas, transacciones, presupuesto, recurrentes, objetivos, inversiones y reportes. Amplitud genera más destinos. |
| Dashboard | Tarjetas configurables para net worth, gasto, presupuesto, objetivos y otras lecturas. Flexible, pero jerarquía puede depender de usuario. |
| Cuentas | Fortalece agregación, tipos de cuenta, ocultamiento selectivo, cierre, datos manuales y consolidación. |
| Inversiones | Holdings, performance y cuentas manuales. Permite tracking por posición o balance. |
| Deudas | Incluye tarjetas y préstamos en net worth; profundidad operativa menor que herramientas dedicadas de deuda. |
| Presupuestos | Dos modelos: categoría y flex. Puede usarse sin presupuesto y mantener cash flow. |
| Reportes | Muy fuertes: cash flow, gasto, ingreso, filtros, drill-down, reportes guardados y Sankey. Algunas funciones avanzadas son web-only. |
| Onboarding | Conectar cuentas primero; luego categorías, objetivo y presupuesto. Checklist ayuda, pero “visión completa” exige carga amplia. |
| Identidad visual | Premium, serena y pulida. Usa tarjetas, espacios amplios y visualizaciones limpias para reducir sensación de complejidad. |

### Fortalezas

- Mejor referente de consolidación generalista.
- Buen equilibrio entre tracking, presupuesto, objetivos e inversiones.
- Presupuesto opcional protege usuarios que solo quieren observar.
- Colaboración de hogar integrada.
- Reportes potentes y rastreables hasta transacciones.
- Permite inicio limpio e historia manual.

### Debilidades

- Depende mucho de calidad de conexiones para promesa de totalidad.
- Personalización de dashboard puede trasladar diseño de jerarquía al usuario.
- Gran número de secciones aumenta costo de orientación.
- Hogar compartido tiene visibilidad amplia; controles finos son limitados.
- Objetivos y cash flow pueden requerir convenciones que no siempre reflejan ubicación real del dinero.

### Lección para Doleth

Monarch prueba que producto integral es viable. Doleth debe igualar amplitud conceptual con jerarquía más firme, mejor soporte manual y relación más explícita entre saldo, reserva, deuda y disponibilidad.

---

## 2.4 Copilot Money

Fuentes principales: [guía inicial](https://help.copilot.money/en/articles/11157550-quick-start-guide), [dashboard](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview), [cuentas](https://help.copilot.money/en/articles/6213732-accounts-tab-overview), [transacciones](https://help.copilot.money/en/articles/9554412-transactions-tab-overview) e [inversiones](https://help.copilot.money/en/articles/5377645-investments-tab-overview).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Hacer que seguimiento financiero automático se sienta rápido, atractivo y personal. |
| Público objetivo | Usuario estadounidense, especialmente ecosistema Apple, que valora diseño premium y automatización. |
| Experiencia | Muy pulida, reactiva y visual. Revisión de transacciones crea hábito de control ligero. |
| Velocidad de carga | Alta con cuentas conectadas y reglas aprendidas. Manual disponible, pero producto optimiza importación. |
| Navegación | Tabs configurables alrededor de Dashboard; incluye Transactions, Categories, Accounts, Cash Flow, Recurrings, Investments y Goals según plataforma. |
| Dashboard | Gasto mensual, “Free to Spend”, transacciones a revisar, presupuestos, recurrentes próximos y neto mensual. Foco dominante: gasto. |
| Cuentas | Agrupa tarjetas, depósitos, inversiones, préstamos y otros. Net worth abre sección. Estado de conexión aparece cerca. |
| Inversiones | Fuerte para agregador: balances, retornos, holdings, benchmarks y estimación en vivo. |
| Deudas | Préstamos y tarjetas aparecen como cuentas y net worth; administración detallada de condiciones y pagos no es centro. |
| Presupuestos | Por categorías, rebalanceo y rollovers. Puede desactivarse y reemplazarse por comparación con mes anterior. |
| Reportes | Cash flow, revisiones mensuales/anuales, net worth e inversiones. Cobertura varía por plataforma. |
| Onboarding | Conectar cuentas, elegir suscripción, revisar presupuesto sugerido, confirmar transacciones y recurrentes. Rápido si conexiones funcionan. |
| Identidad visual | Referente visual del segmento: alto contraste, animación cuidada, color funcional, tipografía fuerte y acabado nativo. |

### Fortalezas

- Calidad visual aumenta deseo de volver.
- Cola “To Review” convierte automatización en control verificable.
- Excelente presentación de cuentas y patrimonio neto.
- Presupuesto opcional amplía público.
- Navegación puede adaptarse sin mover Dashboard.
- Inversiones reciben tratamiento superior a mayoría de trackers.

### Debilidades

- Dashboard gira más alrededor de gasto permitido que posición financiera completa.
- Lógica de recurrencias, exclusiones y presupuesto crea excepciones difíciles de anticipar.
- Deudas y cuotas no forman dominio operativo profundo.
- Paridad entre iPhone, Mac, iPad y web todavía varía.
- Disponibilidad geográfica limita modelo como referente universal.
- Estética fuerte puede ocultar ambigüedad de cálculo si explicación queda lejos.

### Lección para Doleth

Adoptar estándar de pulido, revisión de novedades y claridad visual. Mejorar modelo: Inicio debe explicar posición completa, no solo ritmo de gasto.

---

## 2.5 Wallet by BudgetBakers

Fuentes principales: [definición del producto](https://support.budgetbakers.com/hc/es/articles/12212428113810--Qu%C3%A9-es-la-aplicaci%C3%B3n-Wallet), [funciones](https://budgetbakers.com/en/features/) y [catálogo de ayuda](https://support.budgetbakers.com/hc/en-us/sections/6961343873426-Features).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Combinar tracking, presupuesto, planificación, cuentas e informes en plataforma amplia. |
| Público objetivo | Usuario internacional que necesita multimoneda, sincronización, planificación y muchas opciones. |
| Experiencia | Rica, configurable y funcional. Densidad crece por acumulación de herramientas. |
| Velocidad de carga | Alta mediante sincronización, reglas y carga recurrente; manual ofrece más campos y decisiones que trackers simples. |
| Navegación | Organiza por cuentas, registros, presupuestos, planificación y estadísticas. Profundidad funcional eleva cantidad de rutas. |
| Dashboard | Visión de balance, gasto y planificación mediante tarjetas y gráficos. Riesgo de convertirse en panel genérico. |
| Cuentas | Muy completo: múltiples cuentas, bancos, efectivo, tarjetas, sobregiros, monedas, reglas y ajustes. |
| Inversiones | Incluye acciones/ETF y cripto, aunque experiencia no alcanza profundidad de gestor patrimonial dedicado. |
| Deudas | Soporta tarjetas, hipotecas y seguimiento mediante tipos de cuenta y registros. Modelo puede sentirse derivado de cuentas. |
| Presupuestos | Presupuestos recurrentes, por categoría, con rollover y alertas. |
| Reportes | Amplios, filtrables y exportables. Incluye períodos personalizados y orientación fiscal. |
| Onboarding | Puede comenzar manual o conectado. Cantidad de capacidades obliga a elegir configuración antes de dominar producto. |
| Identidad visual | Fintech internacional, colorida y orientada a datos. Más funcional que distintiva. |

### Fortalezas

- Cobertura funcional cercana a ambición de Doleth.
- Buen soporte multimoneda e internacional.
- Cuentas y operaciones manuales tienen profundidad.
- Planificación, recurrencias, importación y exportación forman producto real.
- Adecuado para efectivo y bancos combinados.

### Debilidades

- Amplitud reduce foco y aumenta densidad.
- Algunas capacidades parecen agregadas como herramientas, no integradas en misma lectura.
- Inversiones, ahorro y deuda pueden depender de convenciones de cuenta.
- Experiencias entre plataformas pueden diferir.
- Dashboard corre riesgo de mostrar mucho sin priorizar decisión.

### Lección para Doleth

Wallet demuestra valor de cobertura amplia, pero también costo de crecer por lista de funciones. Doleth debe crecer por relaciones entre dominios y mantener una sola jerarquía.

---

## 2.6 Spendee

Fuentes principales: [sitio oficial](https://spendee.help/), [catálogo de funciones](https://help.spendee.com/category/129-spendee-features) y [billeteras compartidas](https://help.spendee.com/article/224-shared-wallets).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Hacer seguimiento de gasto atractivo, social y accesible mediante wallets. |
| Público objetivo | Personas, parejas y hogares jóvenes que quieren gastos, presupuestos y cuentas compartidas. |
| Experiencia | Amigable, visual y ligera. Wallet es unidad mental principal. |
| Velocidad de carga | Alta con banco conectado, clasificación automática o escaneo; buena carga manual para transacción simple. |
| Navegación | Wallets, transacciones, presupuestos y analítica. Modelo es fácil mientras realidad cabe en wallets. |
| Dashboard | Visión agregada de wallets y gráficos de gasto. Priorización visual sobre profundidad patrimonial. |
| Cuentas | Bancos, efectivo, PayPal, billeteras digitales y cripto. Wallets compartidas son diferencial. |
| Inversiones | Cripto puede conectarse, pero cartera financiera integral no es centro. |
| Deudas | Sin dominio profundo para préstamos, amortización y derechos de cobro. |
| Presupuestos | Por categorías y wallet. Compartir wallet no implica compartir configuración de presupuesto. |
| Reportes | Analítica de gasto clara y visual; menor profundidad para patrimonio o deuda. |
| Onboarding | Orientado a crear/conectar primera wallet y comenzar a registrar. |
| Identidad visual | Brillante, juvenil, ilustrativa y social. Reduce intimidación financiera. |

### Fortalezas

- Wallet como concepto visible resulta fácil de entender.
- Experiencia compartida está presente desde producto, no añadida tarde.
- Buena mezcla de cuentas manuales y conectadas.
- Identidad amigable reduce ansiedad.
- Multimoneda y wallets digitales amplían realidad cotidiana.

### Debilidades

- Wallet puede convertirse en simplificación excesiva para inversiones, deudas y patrimonio.
- Profundidad se concentra en gasto y presupuesto.
- Restricciones de compartir cuentas bancarias o presupuestos fragmentan colaboración.
- Categorías y gráficos dominan lectura.
- Integridad global depende de que usuario organice wallets correctamente.

### Lección para Doleth

Adoptar accesibilidad emocional y claridad de lugares de dinero. Superar modelo de wallet con posición financiera que conecte obligaciones, propiedad y propósito.

---

## 2.7 Lunch Money

Fuente principal: [catálogo oficial de funciones](https://lunchmoney.app/features).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Dar herramientas flexibles a persona que quiere controlar datos y reglas sin rigidez bancaria. |
| Público objetivo | Power user, freelancer, hogar multimoneda o persona técnica que valora personalización. |
| Experiencia | Densa pero consistente. Web-first favorece revisión profunda y trabajo por lotes. |
| Velocidad de carga | Alta por importación, reglas y edición masiva; manual simple, aunque configuración avanzada demanda tiempo. |
| Navegación | Transacciones, presupuesto, recurrencias, calendario, analytics, net worth y crypto. Más cercana a herramienta de trabajo que app de consulta rápida. |
| Dashboard | Resumen configurable de gasto, presupuesto, recurrencias y patrimonio; densidad informativa mayor. |
| Cuentas | Cuentas manuales y sincronizadas, multimoneda y patrimonio neto. |
| Inversiones | Crypto tracker fuerte dentro de nicho; inversiones tradicionales se reflejan principalmente mediante cuentas y net worth. |
| Deudas | Pueden representarse en patrimonio, pero no hay centro operativo comparable a módulo dedicado. |
| Presupuestos | Flexible por categorías, con reglas, recurrencias y análisis. |
| Reportes | Analytics, tendencias, calendario, consultas y agrupaciones potentes. |
| Onboarding | Mejor para quien sabe cómo quiere organizarse; menos inmediato para principiante. |
| Identidad visual | Independiente, cálida y peculiar. Menos corporativa; prioriza utilidad y personalidad sobre lujo visual. |

### Fortalezas

- Flexibilidad real sin imponer método único.
- Excelente soporte multimoneda.
- Reglas, tags, splits y grupos resuelven complejidad cotidiana.
- Calendario y recurrencias enriquecen lectura temporal.
- Producto transmite control y propiedad de datos.
- Nicho claro genera lealtad.

### Debilidades

- Web-first reduce adecuación al hábito mobile inmediato.
- Potencia exige aprendizaje y mantenimiento.
- Deuda, tarjetas en cuotas y patrimonio físico no tienen tratamiento central.
- Muchas opciones pueden ocultar recorrido recomendado.
- Dashboard puede parecer herramienta analítica antes que respuesta cotidiana.

### Lección para Doleth

Adoptar flexibilidad en operaciones, moneda y clasificación. Mantener defaults fuertes y experiencia mobile que no exponga potencia completa en cada paso.

---

## 2.8 Empower Personal Dashboard

Fuentes principales: [dashboard oficial](https://support-personalwealth.empower.com/hc/en-us/articles/201169740-Dashboard-Overview) y [descripción de experiencia](https://www.empower.com/plan-sponsors/what-we-offer/personal-experience).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Consolidar patrimonio e inversiones y conducir hacia planificación de riqueza y retiro. |
| Público objetivo | Persona con inversiones, retiro y patrimonio que busca panorama agregado, especialmente en Estados Unidos. |
| Experiencia | Fuerte en consulta y análisis; operación cotidiana de gasto es secundaria. |
| Velocidad de carga | Alta mediante conexión de cuentas. Carga manual sirve para activos no conectados. |
| Navegación | Dashboard, banking, investing, planning y wealth management. Jerarquía sigue riqueza antes que gasto. |
| Dashboard | Net worth protagonista; agrega presupuesto, cash flow, inversiones y retiro mediante widgets. |
| Cuentas | Agrupa efectivo, tarjetas, préstamos, inversiones y activos para net worth. |
| Inversiones | Una de sus fortalezas: asignación, rendimiento, costos y retiro. |
| Deudas | Se incluyen como pasivos y cuentas; administración cotidiana de plan de pago tiene menor profundidad. |
| Presupuestos | Seguimiento mensual básico comparado con producto de budgeting especializado. |
| Reportes | Sólidos para patrimonio, cartera, cash flow y retiro. |
| Onboarding | Conectar cuentas y completar perfil patrimonial. Valor aumenta con cobertura de inversiones. |
| Identidad visual | Institucional, sobria y orientada a confianza. Menos emocional y menos personal. |

### Fortalezas

- Patrimonio neto como lectura central clara.
- Inversiones integradas con posición total.
- Activos y pasivos conviven en mismo panorama.
- Herramientas de retiro conectan presente con horizonte largo.
- Producto ofrece valor sin exigir presupuesto detallado.

### Debilidades

- Finanzas cotidianas quedan subordinadas a wealth management.
- Dashboard por widgets puede fragmentar historia principal.
- Incentivo comercial hacia servicios financieros puede afectar neutralidad percibida.
- Efectivo, cuotas, deudas informales y multimoneda tienen menor centralidad.
- Experiencia visual prioriza credibilidad institucional sobre cercanía diaria.

### Lección para Doleth

Adoptar patrimonio neto y relación activos-pasivos. Evitar convertir inversiones en protagonista universal o usar administración como puerta hacia venta de productos.

---

## 2.9 Money Manager by Realbyte

Fuentes principales: [sitio oficial](https://realbyteapps.com/), [transferencias](https://help.realbyteapps.com/hc/en-us/articles/360042702534-How-to-record-a-transfer) y [presupuestos](https://help.realbyteapps.com/hc/en-us/articles/360042842974-How-to-set-up-modify-delete-a-budget).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Dar control detallado mediante registro manual, calendario y lógica de doble entrada simplificada. |
| Público objetivo | Persona disciplinada que prioriza exactitud, historial local y control sobre automatización. |
| Experiencia | Funcional, densa y cercana a libro financiero personal. Muy eficiente para usuario habituado. |
| Velocidad de carga | Media: alta por repetición y accesos rápidos, baja frente a apps que importan o piden menos contexto. |
| Navegación | Calendario/transacciones como centro, con cuentas, estadísticas y presupuesto accesibles alrededor. |
| Dashboard | Totales semanales/mensuales, presupuesto, calendario y gráficos. Más informativo que narrativo. |
| Cuentas | Muy sólido para efectivo, bancos, tarjetas, ahorros, seguros, préstamos y bienes. Transferencias conservan doble impacto. |
| Inversiones | Pueden modelarse como activos y transferencias; análisis de holdings es limitado. |
| Deudas | Puede administrar préstamos mediante cuentas y doble entrada, pero lenguaje exige comprensión del modelo. |
| Presupuestos | Por categoría, mensual, con barras de progreso y ritmo recomendado. |
| Reportes | Estadísticas, filtros, gráficos y tendencia de activos. Potentes para registro manual. |
| Onboarding | Rápido para primer registro; configuración completa de cuentas y categorías queda en manos de usuario. |
| Identidad visual | Utilitaria, compacta y basada en calendario/tablas. Confianza viene de densidad y control, no de minimalismo. |

### Fortalezas

- Respeta transferencias y relaciones entre cuentas.
- Excelente soporte para efectivo y carga manual.
- Calendario vuelve tiempo visible.
- Densidad permite operar rápido a usuario experto.
- Alcance de activos y préstamos supera trackers simples.
- Popularidad demuestra mercado para control manual serio.

### Debilidades

- Modelo contable se filtra a experiencia.
- Primer panorama puede requerir interpretación.
- Inversiones y patrimonio se representan como cuentas más que dominios ricos.
- Formularios y navegación pueden intimidar.
- Identidad visual no comunica producto financiero contemporáneo premium.

### Lección para Doleth

Adoptar rigor de transferencias, calendario y registro manual. Ocultar doble entrada y producir lectura humana más clara.

---

## 2.10 Origin

Fuentes principales: [sitio oficial](https://useorigin.com/), [descripción integral](https://landing.useorigin.com/), [spending](https://useorigin.com/products/spending) y [ficha App Store](https://apps.apple.com/us/app/origin-budget-track-money/id1637693312).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Reunir tracking, inversión, planificación, asesoría, impuestos y estate planning en plataforma de wealth. |
| Público objetivo | Profesional o pareja con patrimonio creciente que acepta producto financiero amplio y guiado. |
| Experiencia | Premium, ambiciosa y orientada a servicios. Tracking funciona como entrada a ecosistema mayor. |
| Velocidad de carga | Alta mediante conexiones y categorización automática. Presupuesto puede generarse desde historial. |
| Navegación | Dashboard conecta spending, investing, forecasting, pareja, impuestos y servicios. Alcance crea competencia entre destinos. |
| Dashboard | Net worth, presupuestos, cuentas, actividad e insights. Rediseño reciente busca calma, pero variedad de propuestas sigue alta. |
| Cuentas | Agregación amplia y colaboración de pareja. |
| Inversiones | Muy fuerte: tracking, análisis y producto de inversión propio. |
| Deudas | Pueden formar parte de panorama y planificación, pero no son identidad principal. |
| Presupuestos | Construcción automática, seguimiento mensual y análisis histórico. |
| Reportes | Net worth, spending, investment analysis, forecasting y resúmenes periódicos. |
| Onboarding | Conectar cuentas produce valor rápido; oferta comercial y amplitud aparecen temprano. |
| Identidad visual | Premium, editorial y orientada a riqueza. Combina superficies calmadas con visualizaciones y mensajes aspiracionales. |

### Fortalezas

- Ambición integral auténtica.
- Spending e inversiones comparten ecosistema.
- Experiencia de pareja es parte de propuesta.
- Net worth funciona como hilo conductor.
- Diseño visual sostiene percepción premium.
- Servicios de largo plazo amplían relación con usuario.

### Debilidades

- Identidad de tracking compite con asesoría, inversión, impuestos y estate planning.
- Recomendaciones y productos propios pueden crear conflicto entre claridad y conversión comercial.
- Automatización puede reducir comprensión de cómo se construyó presupuesto.
- Deudas cotidianas, efectivo y operación manual no dominan experiencia.
- Usuario puede sentir que entró a plataforma de servicios antes que sistema personal neutral.

### Lección para Doleth

Adoptar ambición de totalidad y calidad premium. Rechazar mezcla entre sistema de verdad financiera y canal de venta o asesoría.

---

## 2.11 Quicken Simplifi

Fuentes principales: [guía inicial](https://support.simplifi.quicken.com/en/articles/4284318-getting-started-in-quicken-simplifi), [dashboard](https://support.simplifi.quicken.com/en/articles/3357180-getting-to-know-your-dashboard) y [watchlists](https://support.simplifi.quicken.com/en/articles/3472367-using-watchlists-on-the-web-app).

| Dimensión | Evaluación |
|---|---|
| Filosofía | Restar compromisos y planificación del ingreso esperado para mostrar gasto disponible y flujo proyectado. |
| Público objetivo | Usuario que quiere anticipar mes sin administrar presupuesto base cero. |
| Experiencia | Proactiva y rica. Spending Plan, Bills & Income, Watchlists y Projected Cash Flow cubren preguntas distintas, pero pueden superponerse. |
| Velocidad de carga | Alta con cuentas conectadas y recurrencias detectadas. Setup confirma cuentas, facturas e ingresos antes del dashboard. |
| Navegación | Dashboard, transacciones, net worth, spending plan, goals, bills, investments, watchlists, planning y reports. Muy amplia. |
| Dashboard | Once tarjetas predeterminadas. Completo, pero excesivo para una respuesta principal. |
| Cuentas | Conectadas o manuales, agrupadas dentro de posición y net worth. |
| Inversiones | Holdings, balance, performance, operaciones y cripto. |
| Deudas | Tarjetas y facturas conectadas con Bills & Income; préstamos visibles en net worth. |
| Presupuestos | Spending Plan top-down, rollover y Watchlists selectivas. Más flexible que presupuesto por cada categoría. |
| Reportes | Gasto, ingreso, patrimonio e inversiones con filtros y detalle. |
| Onboarding | Corto y lógico: cuenta, facturas, ingresos, dashboard. Obliga a agregar cuenta para completar inicio. |
| Identidad visual | Fintech clara y convencional. Tarjetas y módulos priorizan funcionalidad; menos distintiva que Copilot o YNAB. |

### Fortalezas

- Excelente separación entre facturas, gasto planificado y disponible.
- Flujo proyectado responde pregunta cotidiana potente.
- Watchlists permiten observar solo áreas importantes.
- Onboarding usa datos conectados para preparar producto.
- Buen equilibrio entre flujo, patrimonio, objetivos e inversiones.

### Debilidades

- Once tarjetas de dashboard diluyen jerarquía.
- Spending Plan, Watchlists y Bills & Income pueden exigir entender tres modelos.
- Navegación amplia refleja acumulación histórica de funciones.
- Proyección puede parecer certeza si supuestos no quedan visibles.
- Profundidad produce esfuerzo de configuración y mantenimiento.

### Lección para Doleth

Adoptar agenda de compromisos y gasto disponible como lecturas. Unificarlas dentro de mismo modelo visible para evitar tres sistemas paralelos.

---

## 3. Matriz comparativa

Escala cualitativa:

- **Muy alta:** capacidad define producto;
- **Alta:** sólida y madura;
- **Media:** útil, pero secundaria o incompleta;
- **Baja:** representación superficial;
- **Nula:** fuera de propuesta central.

| Producto | Captura rápida | Claridad mobile | Cuentas | Inversiones | Deudas | Presupuesto | Reportes | Multimoneda | Patrimonio integral | Setup inicial |
|---|---|---|---|---|---|---|---|---|---|---|
| Monefy | Muy alta | Muy alta | Media | Baja | Baja | Media | Media | Alta | Baja | Muy bajo |
| YNAB | Alta | Alta | Alta | Baja | Alta | Muy alta | Alta | Media | Media | Alto |
| Monarch | Alta | Alta | Muy alta | Alta | Media | Alta | Muy alta | Media | Muy alta | Medio/alto |
| Copilot | Alta | Muy alta | Muy alta | Alta | Media | Alta | Alta | Baja | Alta | Medio |
| Wallet | Alta | Media | Muy alta | Media | Media | Alta | Alta | Muy alta | Alta | Medio/alto |
| Spendee | Alta | Alta | Alta | Baja | Baja | Alta | Media | Alta | Baja | Bajo |
| Lunch Money | Alta | Media | Alta | Media | Baja | Alta | Muy alta | Muy alta | Alta | Medio/alto |
| Empower | Media | Media | Alta | Muy alta | Media | Baja | Alta | Baja | Muy alta | Medio |
| Money Manager | Alta | Media | Muy alta | Baja | Media | Alta | Alta | Alta | Alta | Medio |
| Origin | Alta | Alta | Alta | Muy alta | Media | Alta | Alta | Baja | Muy alta | Medio |
| Simplifi | Alta | Alta | Alta | Alta | Media | Alta | Alta | Baja | Alta | Medio |

## 3.1 Matriz de estrategia

| Producto | Centro del producto | Decisión exitosa | Costo de esa decisión |
|---|---|---|---|
| Monefy | captura | minimizar pasos | baja profundidad |
| YNAB | método | coherencia total alrededor de asignación | curva de aprendizaje |
| Monarch | consolidación de hogar | amplitud con acabado premium | setup y navegación amplios |
| Copilot | automatización visual | revisión ligera y diseño deseable | excepciones difíciles de explicar |
| Wallet | suite internacional | cobertura y multimoneda | densidad y foco débil |
| Spendee | wallets compartidas | accesibilidad y colaboración | poca profundidad patrimonial |
| Lunch Money | flexibilidad | reglas y control de datos | complejidad para principiante |
| Empower | patrimonio | net worth e inversiones como centro | cotidiano secundario |
| Money Manager | registro riguroso | manual completo y calendario | experiencia contable |
| Origin | ecosistema de riqueza | integración de servicios | conflicto comercial y dispersión |
| Simplifi | flujo futuro | compromisos y disponible | modelos superpuestos |

## 3.2 Mejores referentes por problema

| Problema | Mejor referente | Qué estudiar |
|---|---|---|
| Registrar rápido | Monefy | monto primero, contexto progresivo |
| Asignar dinero | YNAB | estados claros y propósito visible |
| Consolidar cuentas | Monarch | cobertura, cuentas manuales y conectadas |
| Crear deseo de uso | Copilot | jerarquía, acabado y revisión diaria |
| Operar multimoneda | Lunch Money / Wallet | moneda original y consolidación |
| Compartir finanzas | Monarch / Spendee | hogar, wallets y colaboración |
| Entender inversiones | Empower / Copilot | cartera dentro de net worth |
| Registrar manualmente | Money Manager | transferencias, calendario y exactitud |
| Anticipar mes | Simplifi | facturas, ingresos y flujo proyectado |
| Construir suite premium | Origin | consistencia visual entre dominios amplios |

---

## 4. Decisiones que Doleth debería adoptar

### 4.1 Acción de registro siempre disponible

Referencia: Monefy, YNAB y Copilot.

Doleth debe permitir registrar hecho desde cualquier contexto. Primer paso debe pedir significado humano y monto. Detalle aparece según operación.

### 4.2 Panorama con jerarquía fija

Referencia positiva: Empower y Copilot. Contraejemplo: dashboards extensos configurables.

Inicio debe responder en orden:

1. dinero disponible;
2. compromisos próximos;
3. flujo del mes;
4. activos, deudas y patrimonio neto;
5. cambios y pendientes.

Usuario puede profundizar, pero no debe diseñar dashboard para obtener respuesta.

### 4.3 Presupuesto opcional

Referencia: Monarch y Copilot.

Doleth debe generar valor completo sin presupuesto. Planificación puede activarse cuando usuario quiera asignar límites o intención.

### 4.4 Revisión como hábito, no corrección silenciosa

Referencia: Copilot “To Review” y conciliación de YNAB.

Datos nuevos o dudosos deben entrar en cola pequeña y comprensible. Usuario conserva control sin revisar todo.

### 4.5 Cuentas manuales como ciudadanas de primera clase

Referencia: Monefy, Money Manager, Monarch y Lunch Money.

Efectivo, billeteras, deuda informal, dólares y activos sin conexión deben producir misma calidad de lectura.

### 4.6 Agenda financiera explícita

Referencia: Simplifi, Monarch Recurring y Lunch Money Calendar.

Cuotas, tarjetas, préstamos, suscripciones, cobros y vencimientos deben compartir agenda única.

### 4.7 Patrimonio conectado con cotidiano

Referencia: Empower y Monarch.

Net worth no debe vivir separado. Cambio de cuenta, deuda, inversión o activo debe reflejarse en posición total sin ocultar liquidez.

### 4.8 Moneda original preservada

Referencia: Lunch Money y Wallet.

Cada hecho conserva moneda original. Conversión sirve para lectura consolidada, nunca reemplaza realidad registrada.

### 4.9 Reportes con drill-down

Referencia: Monarch.

Toda cifra agregada debe abrir transacciones, cuentas o valuaciones que la forman.

### 4.10 Personalidad visual propia y calmada

Referencia: calidad de Copilot, humanidad de YNAB y sobriedad de Monarch.

Doleth necesita identidad reconocible, pero color nunca debe reemplazar explicación ni convertir estado financiero en premio o castigo.

---

## 5. Decisiones que Doleth debería evitar

### 5.1 Dashboard de widgets sin jerarquía

Once tarjetas no equivalen a comprensión. Personalización no debe delegar arquitectura del producto a usuario.

### 5.2 Categorías como estructura primaria

Categorías ayudan a analizar gasto. No deben gobernar cuentas, deuda, inversión, reserva o patrimonio.

### 5.3 Presupuesto obligatorio

Obliga adopción de método antes de entregar claridad. Doleth debe funcionar para observar, administrar y luego planificar.

### 5.4 Sincronización como única puerta de entrada

Conexiones fallan, no cubren efectivo y varían por país. Producto debe seguir completo con carga manual.

### 5.5 Excepciones invisibles

Excluir recurrentes de gráfico, tratar objetivos como transferencias o usar categorías especiales para corregir reportes crea sistema imposible de predecir.

### 5.6 Inversiones como saldo decorativo

Una cuenta con valor total no alcanza. Posición, costo, valuación y resultado deben tener significado propio.

### 5.7 Deuda tratada solo como cuenta negativa

Deuda tiene contraparte, condición, calendario, interés, pagos y estado. Reducirla a saldo destruye administración.

### 5.8 Herramientas comerciales dentro de verdad financiera

Recomendaciones de productos, ventas o incentivos contaminan neutralidad.

### 5.9 Formularios exhaustivos antes de primer valor

Completitud inicial debe crecer por capas. Primer panorama puede declarar faltantes.

### 5.10 Diferencias estructurales entre plataformas

Mismos conceptos y cifras deben conservar significado. Dispositivo puede cambiar densidad, no modelo mental.

---

## 6. Decisiones que Doleth puede mejorar claramente

## 6.1 “Free to spend” verificable

Competidores ofrecen “left to spend”, pero cálculo suele depender de presupuesto, recurrencias excluidas o ingreso esperado.

Doleth puede mostrar:

- saldo total;
- dinero reservado;
- obligaciones próximas;
- dinero disponible;
- fecha y alcance del cálculo.

Mejora: cifra explicable sin método obligatorio.

## 6.2 Una agenda, no tres modelos futuros

Competidores separan bills, recurrings, cuotas, goals y planned spending.

Doleth puede reunir todo compromiso futuro en Agenda, manteniendo origen visible.

Mejora: menos navegación y menos doble conteo.

## 6.3 Objetivos ligados a dinero real

Muchas apps muestran progreso sin aclarar dónde vive dinero.

Doleth puede vincular reserva con cuentas reales y distinguir meta, asignado y disponible.

Mejora: objetivo no crea saldo ficticio.

## 6.4 Tarjetas y cuotas como dominio completo

Apps internacionales suelen tratar tarjeta como cuenta de crédito; cuotas quedan pobres.

Doleth puede unir compra, plan de cuotas, cierre, vencimiento, resumen y pago.

Mejora: realidad latinoamericana queda modelada sin trucos de categoría.

## 6.5 Deudas formales e informales

Mercado cubre mortgages y loans conectados, pero no préstamo entre personas, condonación o cobro parcial.

Doleth puede administrar ambos lados: debo y me deben.

Mejora: posición incluye relaciones que hoy viven en memoria.

## 6.6 Multimoneda patrimonial, no cosmética

Varias apps convierten saldos, pero reportes y presupuestos pierden contexto.

Doleth puede conservar moneda original, tipo de cambio, fecha y exposición.

Mejora: usuario entiende posición y riesgo monetario.

## 6.7 Revisión mensual como cierre coherente

Competidores muestran reportes, pero rara vez conducen desde diferencias hasta corte confirmado.

Doleth puede unir revisión de cuentas, tarjetas, deudas, inversiones y flujo antes de cerrar mes.

Mejora: historia confiable, no gráfico sobre datos incompletos.

## 6.8 Complejidad progresiva por dominio

Monefy es rápido pero limitado; Wallet es completo pero denso.

Doleth puede usar flujo corto por defecto y revelar condiciones, tasas, titularidad o evidencia solo cuando operación lo necesita.

Mejora: profundidad sin castigar caso frecuente.

---

## 7. Oportunidades de diferenciación

### 7.1 Sistema de verdad financiera personal

Competidores se posicionan como budget app, tracker, aggregator o wealth platform.

Doleth puede ser lugar donde usuario administra totalidad, no solo la observa.

### 7.2 Mobile-first sin ser mobile-limited

Monefy y Spendee son simples en mobile; Lunch Money y reportes avanzados de competidores brillan en web.

Doleth puede diseñar operación y comprensión completas para pantalla pequeña, usando profundidad progresiva.

### 7.3 Latinoamérica como realidad principal

Oportunidad poco atendida:

- efectivo relevante;
- bancos y billeteras simultáneos;
- dólares y moneda local;
- cripto como reserva y transferencia;
- compras en cuotas;
- inflación y revaluación;
- ingresos variables;
- deuda informal;
- patrimonio parcialmente valuado.

No requiere versión “local” de app estadounidense. Requiere producto nacido desde esa complejidad.

### 7.4 Claridad sin presupuesto

Doleth puede responder posición, próximos compromisos y trayectoria antes de pedir límites por categoría.

### 7.5 Manual y conectado con misma dignidad

Competidores tratan manual como fallback. Doleth puede tratarlo como camino completo y después sumar automatización sin cambiar modelo.

### 7.6 Administración real de deuda y cuotas

Espacio competitivo débil. Puede convertirse en diferencial tangible desde primera versión.

### 7.7 Relación explícita entre liquidez y patrimonio

Empower muestra patrimonio; apps de gasto muestran caja. Doleth puede mostrar ambos sin confundirlos.

### 7.8 Confianza visible

Cada panorama puede indicar fecha de actualización, cobertura y pendientes. Competidores suelen mostrar cifras limpias aunque origen esté desactualizado.

### 7.9 Neutralidad comercial

Doleth no necesita vender tarjeta, préstamo, inversión o asesoría para justificar existencia. Esa independencia puede convertirse en confianza de marca.

### 7.10 Cierre mensual como producto

No solo reporte. Ritual corto para confirmar saldos, entender cambios y comenzar mes siguiente con posición limpia.

---

## 8. Diez principios de diseño de producto para Doleth

### 1. Panorama antes que detalle

Usuario debe entender posición antes de navegar hacia causas.

### 2. Registro corto, significado completo

Caso frecuente exige pocos pasos. Complejidad aparece solo cuando hecho la contiene.

### 3. Una operación, un registro

Pago, transferencia, compra o inversión puede afectar varios módulos, pero usuario no repite carga.

### 4. Presente, futuro e historia no se mezclan

Saldo actual, compromiso y proyección deben distinguirse siempre.

### 5. Disponibilidad no es saldo

Dinero reservado y obligaciones próximas cambian capacidad real de uso.

### 6. Toda cifra importante se puede explicar

Agregado abre fuentes. Estimación muestra fecha y criterio. Diferencia muestra causa o pendiente.

### 7. Producto funciona antes de estar completo

Usuario obtiene panorama parcial honesto mientras incorpora resto de vida financiera.

### 8. Manual no significa inferior

Efectivo, deuda informal, activo físico o cuenta no conectada reciben misma estructura y visibilidad.

### 9. Profundidad vive detrás de simplicidad

Interfaz inicial muestra decisión necesaria. Detalle, evidencia y configuración permanecen accesibles sin dominar experiencia.

### 10. Doleth informa; usuario decide

Producto organiza realidad, muestra consecuencias y conserva control humano. No empuja productos, no juzga y no sustituye decisión personal.

---

## 9. Síntesis estratégica

Doleth no debe intentar ganar cada categoría por separado.

Debe combinar:

- velocidad de Monefy;
- coherencia de YNAB;
- amplitud de Monarch;
- pulido de Copilot;
- multimoneda de Wallet y Lunch Money;
- cercanía de Spendee;
- lectura patrimonial de Empower;
- rigor manual de Money Manager;
- ambición premium de Origin;
- anticipación temporal de Simplifi.

Pero debe rechazar costos asociados:

- simplificación excesiva;
- método obligatorio;
- dependencia de conexiones;
- dashboard saturado;
- reglas invisibles;
- experiencia contable;
- conflicto comercial;
- navegación acumulativa.

Dirección resultante:

**Doleth debe ser aplicación financiera integral que se siente simple porque prioriza bien, no porque representa menos realidad.**

Este benchmark pasa a orientar diseño de wireframes y sistema visual. No modifica especificación conceptual ni Product Blueprint.
