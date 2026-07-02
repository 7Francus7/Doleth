# 20 — Máquina de estados

## Propósito

Validar operatividad del valor y transiciones permitidas entre estados.

## Alcance

- libre
- asignado
- expuesto
- pendiente
- extinguido

## Tipos de escenarios

- transición simple
- reversión
- partición de valor
- conflicto entre estados

## Casos límite

- valor parcialmente libre y parcialmente asignado
- pendiente que cambia de condición
- expuesto que se extingue

## Criterios de aceptación

- transición es legal o falla explícitamente
- no se mezclan estados incompatibles
- resultado conserva impacto correcto en liquidez
