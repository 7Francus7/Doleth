# Verificación de Resend para Doleth

Fecha del corte: 2026-07-30

Rama: `codex/production-readiness-audit`

Commit funcional auditado: `6b9b3b5ead26135cbbb53c2dbb7168f6307afb5d`. El SHA final de Preview se toma de la metadata del deployment asociado al HEAD del PR.

## Estado

`INCONCLUSIVE`

La revisión del código está completa. La verificación del dashboard, la creación o validación de una credencial exclusiva para Preview y las entregas reales siguen pendientes de acceso autenticado a Resend. No se leyó, mostró ni guardó ningún valor secreto.

## Auditoría del código

| Control | Estado | Evidencia |
|---|---|---|
| Cliente | `VERIFIED` | Envío directo a la API HTTPS de Resend. |
| Variables requeridas | `VERIFIED` | `RESEND_API_KEY`, `DOLETH_EMAIL_FROM`, `DOLETH_EMAIL_TRANSPORT` y origen canónico. |
| Transporte productivo | `VERIFIED` | `console` está bloqueado en modo desplegado; el transporte esperado es `resend`. |
| Enlaces absolutos | `VERIFIED` | Preview rechaza un `DOLETH_APP_URL` productivo y usa solamente la URL exacta del deployment si falta un origen explícito. |
| HTML | `VERIFIED` | Los valores interpolados se escapan; todos los correos incluyen cuerpo HTML y texto. |
| Tokens | `VERIFIED` | Aleatorios, almacenados con hash, expiran y son de un solo uso. |
| Enumeración de usuarios | `VERIFIED` | Las solicitudes públicas no revelan si una cuenta existe. |
| Error del proveedor | `VERIFIED_WITH_CONCERNS` | La aplicación devuelve un fallo seguro y no registra el cuerpo del proveedor. |
| Reintentos | `CONCERN` | No hay política de reintentos. |
| Timeout | `CONCERN` | No hay timeout explícito para la llamada a Resend. |
| Idempotencia | `CONCERN` | No se envía una clave de idempotencia al proveedor. |

## Variables

Los valores nunca deben copiarse a este documento.

| Variable | Preview | Production | Resultado actual |
|---|---|---|---|
| `RESEND_API_KEY` | Existe como entrada compartida; falta reemplazo o demostración de uso compartible | Existe | `INCONCLUSIVE` |
| `DOLETH_EMAIL_FROM` | Existe como entrada compartida; falta validar dominio/remitente | Existe | `INCONCLUSIVE` |
| `DOLETH_EMAIL_TRANSPORT` | Existe como entrada compartida | Existe | `PRESENT` |
| `DOLETH_APP_URL` | Override `sensitive` exclusivo de la rama Preview | Entrada productiva separada/compartida histórica | `PRESENT` |

## Dominio y autenticación

| Control | Estado |
|---|---|
| Dominio configurado | `INCONCLUSIVE` |
| Dominio verificado | `INCONCLUSIVE` |
| SPF | `INCONCLUSIVE` |
| DKIM | `INCONCLUSIVE` |
| DMARC | `INCONCLUSIVE` |
| Remitente permitido | `INCONCLUSIVE` |
| Región | `INCONCLUSIVE` |
| Errores DNS | `INCONCLUSIVE` |
| Límites de envío | `INCONCLUSIVE` |
| Restricciones visibles | `INCONCLUSIVE` |
| Permisos de la API key de Preview | `INCONCLUSIVE` |

No se modificarán registros DNS automáticamente.

## Entrega real

Registrar solamente tipo, hora UTC, proveedor, estado, latencia aproximada y dominio destino redactado.

| Flujo | Hora UTC | Estado | Latencia | Destino |
|---|---|---|---|---|
| Registro y verificación A | Pendiente | `INCONCLUSIVE` | — | Redactado |
| Registro y verificación B | Pendiente | `INCONCLUSIVE` | — | Redactado |
| Recuperación A | Pendiente | `INCONCLUSIVE` | — | Redactado |
| Cambio de email | Pendiente | `INCONCLUSIVE` | — | Redactado |

## Regla de aprobación

Resend queda aprobado solo si el dashboard demuestra dominio y remitente válidos, Preview usa una credencial aceptada para ese entorno, y verificación/recuperación entregan enlaces HTTPS cuyo host es el alias de Preview. Nunca registrar direcciones completas, tokens ni enlaces completos.
