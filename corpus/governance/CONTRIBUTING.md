# Contribuir al Corpus

## Objetivo

Agregar escenarios que aumenten capacidad validatoria del corpus sin degradar coherencia histórica.

## Cuándo crear caso nuevo

Crear caso nuevo solo si aparece:

- fenómeno no cubierto
- combinación relevante no cubierta
- bug conceptual reproducible
- nueva ambigüedad de evidencia
- nueva tensión de decisión
- nuevo límite del modelo

## Cuándo no crear caso nuevo

No crear caso nuevo si:

- solo cambia redacción
- mismo fenómeno ya está cubierto por mismo `equivalence_key`
- problema se resuelve como variante local de caso existente
- caso no valida ninguna capa relevante

## Checklist de authoring

1. elegir dominio principal
2. declarar capas objetivo
3. construir `equivalence_key`
4. revisar duplicados
5. completar `scenario.yaml`
6. asignar invariantes
7. definir criterios de aceptación
8. declarar failure modes esperados
9. enviar a revisión

## Revisión mínima

Todo caso `canonical` o `regression_locked` requiere revisar:

- consistencia ontológica
- consistencia de estados
- consistencia de tiempo y firmeza
- consistencia de inferencia
- consistencia de decisión
- riesgo de duplicación

## Política editorial

- preferir lenguaje exacto
- evitar storytelling innecesario
- separar hecho, inferencia y decisión
- dejar explícita toda ambigüedad material
