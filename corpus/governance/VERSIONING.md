# Versionado

## Niveles

### `schema_version`

Cambia cuando cambia contrato del archivo `scenario.yaml`.

### `corpus_version`

Semver global del corpus.

- `major`: cambian invariantes, dominios fundacionales o política de aceptación
- `minor`: se agregan dominios, tags, suites o capacidades sin romper contrato
- `patch`: fixes editoriales, metadata o aclaraciones

### `case_version`

Versión individual del escenario.

Sube cuando cambian:

- evidencia canónica
- expectativa por capa
- criterios de aceptación
- failure modes

## Reglas duras

- no editar `regression_locked` sin changelog
- no cambiar `equivalence_key` sin revisar duplicados
- no promover a `canonical` sin revisión
- no borrar casos; usar `deprecated` o `replaced`
