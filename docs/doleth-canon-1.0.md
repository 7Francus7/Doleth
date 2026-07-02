# Doleth Canon 1.0

Estado: propuesto
Fecha: 2 de julio de 2026

Canon 1.0 define primeros 50 escenarios que toda versión futura de Doleth deberá comprender correctamente.

No es colección de “casos importantes”.
Es conjunto de **casos fundacionales**.

Si RFC-001 define arquitectura del corpus, Canon 1.0 define primera columna vertebral de regresión conceptual.

---

## 1. Tesis

Estos 50 casos fijan cómo piensa Doleth sobre:

- eventos atómicos
- finanzas cotidianas
- secuencias compuestas
- ambigüedad real
- realidades que rompen o tensionan modelo

Si Doleth falla acá, todavía no merece escalar complejidad.

---

## 2. Estructura del canon

### Grupo A — Casos atómicos

Objetivo:
fijar primitives irreducibles.

Regla:
cada caso debe poder comprenderse sin depender de otro evento previo.

### Grupo B — Casos cotidianos

Objetivo:
fijar lectura correcta del mundo financiero frecuente.

Regla:
casos que aparecen miles de veces deben quedar congelados temprano.

### Grupo C — Casos compuestos

Objetivo:
fijar cómo Doleth encadena hechos, estados y consecuencias.

Regla:
cada caso combina más de un evento o más de una capa conceptual.

### Grupo D — Casos ambiguos

Objetivo:
fijar disciplina del motor cognitivo.

Regla:
éxito no siempre es resolver; muchas veces es preservar duda o pedir bien.

### Grupo E — Casos que rompen el modelo

Objetivo:
fijar frontera viva del sistema.

Regla:
estos casos no existen para “pasar”.
Existen para detectar límites, conflictos y deuda conceptual.

---

## 3. Convención de nombres

No usar:

- `case001`
- `test-12`
- `scenario-final-v2`

Usar slugs semánticos, cortos y memorables.

Reglas:

- minúsculas
- kebab-case
- 2 a 5 términos
- nombre describe fenómeno, no tarea interna
- nombre debe ser reconocible en conversación de equipo

Ejemplos:

- `salary-basic`
- `cash-expense`
- `unknown-inflow`
- `shared-credit-card`
- `business-paid-personal`

---

## 4. Composición del Canon 1.0

### Grupo A — Atómicos

1. `salary-basic`
2. `cash-expense`
3. `usd-buy`
4. `usd-sell`
5. `interest-credit`
6. `stock-buy`
7. `cash-inflow`
8. `internal-transfer`
9. `loan-origination`
10. `debt-payment`

### Grupo B — Cotidianos

1. `subscription-netflix`
2. `fuel-purchase`
3. `grocery-purchase`
4. `credit-card-purchase`
5. `client-payment`
6. `mercadopago-settlement`
7. `rent-payment`
8. `usdt-buy`
9. `btc-sell`
10. `laptop-purchase`

### Grupo C — Compuestos

1. `usd-income-to-pesos-card-payment`
2. `btc-appreciation-sale-rent`
3. `laptop-installments`
4. `car-loan-purchase`
5. `vacation-fund-allocation`
6. `freelance-income-tax-reserve`
7. `salary-split-across-accounts`
8. `business-revenue-owner-draw`
9. `invoice-partial-collection`
10. `dollar-sale-to-pay-card`

### Grupo D — Ambiguos

1. `unknown-inflow`
2. `vague-expense`
3. `partial-refund`
4. `unknown-purchase`
5. `missing-amount`
6. `fuzzy-date-two-weeks`
7. `unlabeled-transfer`
8. `mixed-message-multiple-events`
9. `unknown-cash-withdrawal`
10. `probable-income-without-proof`

### Grupo E — Que rompen el modelo

1. `shared-account`
2. `dual-currency-debt`
3. `shared-wallet`
4. `informal-loan`
5. `inheritance-arrival`
6. `fraud-loss`
7. `unregistered-cash-found`
8. `partial-debt-forgiveness`
9. `business-paid-personal`
10. `committed-asset-revaluation`

---

## 5. Reglas del canon

### 5.1 Todo caso del canon debe ser `regression_locked`

No se toca sin explicación explícita.

### 5.2 Todo caso del canon debe mapear a suites

Cada caso debe declarar:

- suite principal
- suites secundarias
- capas objetivo

### 5.3 Todo caso del canon debe tener criterio de verdad

Cada caso debe dejar fijo:

- lectura ontológica esperada
- estado esperado
- comportamiento inferencial esperado
- consecuencia de decisión esperada o límite reconocido

### 5.4 Todo caso del canon debe poder ser citado por nombre

Si equipo no puede hablar del caso sin abrir archivo, nombre falló.

### 5.5 Grupo E no necesita “pasar limpio”

Puede producir:

- límite explícito
- conflicto conocido
- RFC futuro
- failure mode aceptado

Su valor está en no ocultar deuda conceptual.

---

## 6. Criterio de éxito

Canon 1.0 está bien diseñado si:

- cubre primitives irreducibles
- cubre vida cotidiana frecuente
- cubre secuencias con estado, tiempo y esfera
- cubre ambigüedad real de lenguaje y evidencia
- cubre fronteras que fuerzan evolución del modelo

---

## 7. Rol dentro del corpus

`corpus/` seguirá creciendo.
`Canon 1.0` no debe crecer por ansiedad.

Canon es gate.
Corpus es universo.

Toda versión futura de Doleth debe poder responder:

**¿seguimos comprendiendo correctamente Canon 1.0?**

Si respuesta es no, cambio no está listo.
