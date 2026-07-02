# Corpus Universal de la Vida Financiera

Corpus existe para validar si Doleth sigue entendiendo realidad financiera de forma correcta, consistente y útil.

No es set de ejemplos.
Es activo intelectual y sistema de regresión conceptual.

## Estructura

- `manifest.yaml`: versión y contrato global
- `CHANGELOG.md`: cambios del corpus
- `governance/`: reglas de contribución, versionado, deduplicación y ruptura
- `taxonomy/`: dominios, tags, invariantes y failure modes
- `schemas/`: schemas de escenarios
- `templates/`: plantillas de authoring y revisión
- `canons/`: subconjuntos fundacionales congelados
- `suites/`: escenarios organizados por dominio conceptual

## Capas validadas

- ontología
- estados del valor
- cognición e inferencia
- decisiones

## Unidad mínima

Cada caso vive en carpeta propia:

`corpus/suites/<dominio>/<familia>/<case-id>/`

Archivo canónico:

`scenario.yaml`

Archivos opcionales:

- `notes.md`
- `evidence/*`

## Reglas duras

- no agregar casos sin clasificar
- no editar silenciosamente casos `regression_locked`
- no duplicar casos equivalentes
- no esconder ambigüedad para “hacer pasar” escenario
- no tratar corpus como fixture de UI

## Flujo recomendado

1. revisar `governance/CONTRIBUTING.md`
2. copiar `templates/scenario.template.yaml`
3. validar taxonomy
4. correr revisión de duplicados
5. promover caso a `reviewed` o `canonical`

## Canon

Canon no reemplaza suites.
Canon selecciona escenarios que se vuelven regresión conceptual permanente.

Primer canon:

- [Canon 1.0](C:/Users/dello/OneDrive/Desktop/Doleth/docs/doleth-canon-1.0.md)
