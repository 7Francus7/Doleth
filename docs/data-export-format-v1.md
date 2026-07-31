# Formato de exportación de datos v1

## Alcance

Las cinco descargas requieren una sesión válida y responden con
`private, no-store`. No contienen cookies, claves, connection strings,
idempotency keys ni asientos internos.

| Archivo | Contenido |
|---|---|
| `doleth-movimientos.csv` | movimientos, transferencias, anulaciones y correcciones |
| `doleth-cuentas.csv` | cuentas y saldos derivados |
| `doleth-proximos-pagos.csv` | pagos previstos y su estado |
| `doleth-inversiones.csv` | cartera registrada |
| `doleth-datos.json` | copia estructurada de los cuatro dominios |

## CSV

- UTF-8 con BOM.
- Separador `;`, compatible con Excel en español.
- Todas las celdas van entre comillas.
- Los valores que podrían ejecutar fórmulas (`=`, `+`, `-`, `@`, tab o retorno)
  se prefijan con apóstrofo.
- Días civiles: `YYYY-MM-DD`.
- Instantes: ISO 8601 UTC.
- Importes: enteros decimales en centavos, sin conversión a `Number`.

Columnas:

- Movimientos: `id`, `tipo`, `importe_cents`, `fecha`, `descripcion`,
  `cuenta_origen`, `cuenta_destino`, `categoria`, `estado`,
  `motivo_anulacion`, `corrige_a_id`, `creado_en`, `actualizado_en`.
- Cuentas: `id`, `nombre`, `tipo`, `moneda`, `saldo_inicial_cents`,
  `saldo_actual_cents`, `estado`, `creado_en`, `actualizado_en`.
- Próximos pagos: `id`, `concepto`, `estimado_cents`, `vence_el`,
  `frecuencia`, `cuenta_prevista`, `estado`, `movimiento_id`, `creado_en`,
  `actualizado_en`.
- Inversiones: `id`, `nombre`, `tipo`, `simbolo`, `moneda`,
  `invertido_cents`, `valor_actual_cents`, `nota`, `estado`, `creado_en`,
  `actualizado_en`.

## JSON

El objeto raíz contiene:

```json
{
  "meta": {
    "schemaVersion": 1,
    "exportedAt": "ISO-8601",
    "timezone": "America/Argentina/Buenos_Aires",
    "monetaryUnit": "cents",
    "restoreSupported": false
  },
  "accounts": [],
  "movements": [],
  "upcomingPayments": [],
  "investments": []
}
```

Los importes son strings de enteros para conservar precisión. Los IDs mantienen
trazabilidad entre correcciones y pagos confirmados.

## Limitación deliberada

No hay endpoint de importación, botón “Restaurar” ni garantía de restauración.
Un importador futuro deberá validar versión, relaciones, moneda, invariantes,
duplicados y consistencia transaccional antes de escribir.
