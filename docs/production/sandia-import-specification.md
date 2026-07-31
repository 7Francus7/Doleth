# Especificación del importador Sandía → Doleth

Estado: `NOT_IMPLEMENTED`. Diseño para un corte posterior a producción.

## Objetivo

Importar datos pertenecientes al usuario autenticado desde CSV o XLSX obtenido legítimamente, sin sobrescribir movimientos existentes y conservando trazabilidad y reversión por lote.

## Flujo

1. Seleccionar archivo.
2. Leer y validar localmente/servidor sin escribir finanzas.
3. Mostrar preview y encoding/formato detectado.
4. Detectar columnas.
5. Permitir mapeo manual.
6. Normalizar fechas como fecha civil.
7. Normalizar importes a centavos `BigInt`.
8. Asignar una cuenta propia.
9. Mapear/crear categorías propias con confirmación.
10. Clasificar ingreso/gasto.
11. Proponer transferencias en pares, nunca asumirlas silenciosamente.
12. Marcar duplicados exactos/probables.
13. Comparar cantidad y totales origen/destino.
14. Pedir confirmación explícita.
15. Escribir lote completo en una transacción.
16. Registrar lote, filas, decisiones y advertencias.
17. Entregar reporte final.
18. Permitir reversión completa mediante anulaciones trazables, no borrado.

## Modelo propuesto

### `ImportBatch`

- `id`
- `userId`
- `source` (`sandia`, `generic_csv`, `generic_xlsx`)
- `originalFileName`
- `fileSha256`
- `importedAt`
- `status` (`previewed`, `committed`, `reverted`, `failed`)
- `rowCount`
- `acceptedCount`
- `skippedCount`
- `warningCount`
- `mappingJson`
- `sourceTotalsJson`
- `committedTotalsJson`
- `revertedAt`

### `ImportRow`

- `id`
- `batchId`
- `userId`
- `sourceRowNumber`
- `rawText` o `rawJson`
- `originalDate`
- `originalAmount`
- `externalReference`
- `normalizedDescription`
- `normalizedDate`
- `normalizedAmountCents`
- `direction`
- `targetAccountId`
- `targetCategoryId`
- `decision`
- `warningsJson`
- `transactionId`
- `duplicateOfTransactionId`

Todas las relaciones financieras deben incluir owner compuesto o comprobarlo en la misma transacción.

## Mapeo mínimo

| Destino | Requerido | Ejemplos de origen |
|---|---|---|
| Fecha | Sí | fecha, date, día |
| Importe | Sí | importe firmado o débito/crédito |
| Descripción | Sí | detalle, concepto, comercio |
| Cuenta | Sí, seleccionable | cuenta, billetera, banco |
| Categoría | No | categoría, rubro |
| Referencia externa | No | id, referencia, comprobante |
| Moneda | Sí o default confirmado | ARS |

No aceptar formatos ambiguos de fecha o separador decimal sin confirmación.

## Duplicados

Clave fuerte cuando existe:

```text
userId + source + externalReference
```

Huella secundaria:

```text
userId + accountId + date + amountCents
+ normalizedDescription
```

La huella debe incluir una versión de normalización. Los duplicados probables se omiten por defecto y requieren decisión explícita; nunca se eliminan transacciones existentes.

## Transferencias

Proponer una transferencia solo si hay dos filas compatibles:

- mismo usuario;
- cuentas propias distintas;
- misma fecha o tolerancia explícita;
- importes absolutos iguales y signos opuestos;
- texto/referencia compatible.

La UI debe mostrar el par. Si el usuario confirma, crear una sola `Transaction` de transferencia y dos asientos atómicos. Si no confirma, mantener filas separadas o advertir; nunca convertir automáticamente dos cargos en gastos.

## Validaciones

- archivo CSV/XLSX real, tamaño y fila máximos;
- rechazo de fórmulas peligrosas al exportar reportes;
- parser sin ejecución de macros;
- cabeceras y encoding;
- centavos exactos, sin `Number` para persistencia;
- cuenta/categoría pertenecen a la sesión;
- cero filas sin owner;
- suma por signo y por cuenta;
- preview sin escrituras;
- commit/reversión atómicos;
- idempotencia por hash de archivo y lote.

## Atomicidad y fallo

El commit debe usar una sola transacción DB para lote, filas aceptadas, transacciones y ledger. Cualquier error revierte todo. Archivos grandes deben dividirse solo si el producto define sublotes explícitos; no ocultar commits parciales.

La reversión:

- valida que el lote pertenece al usuario;
- anula las transacciones creadas por el lote;
- preserva filas y evidencia;
- marca el lote revertido;
- es idempotente;
- no toca movimientos anteriores.

## Seguridad y privacidad

- el usuario solo importa en su sesión;
- no registrar contenido financiero en logs;
- limitar MIME, tamaño y filas;
- no almacenar el archivo original salvo consentimiento y retención definida;
- si se almacena, cifrarlo y registrar fecha de eliminación;
- no enviar datos a terceros;
- sanitizar nombres de archivo;
- proteger CSV formula injection en cualquier reexportación.

## Criterios de aceptación

1. Preview produce cero escrituras.
2. Mismo archivo no se duplica por accidente.
3. Totales en centavos coinciden.
4. Owner A no puede mapear a entidades de B.
5. Transferencia confirmada conserva suma cero.
6. Fallo en una fila deja cero escrituras del lote.
7. Reversión elimina efecto contable sin borrar evidencia.
8. Archivo, fila, texto, fecha, importe, mapping y warnings quedan trazables.
