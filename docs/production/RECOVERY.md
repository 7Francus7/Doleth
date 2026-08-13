# Recuperación de Doleth

Última revisión: 2026-08-13.

## Antes de un release

1. Confirmar en Neon la rama y base de Production, sin copiar credenciales.
2. Registrar retención PITR, punto recuperable más antiguo y estado de snapshots.
3. Crear un punto de recuperación solo con autorización separada si la política vigente no cubre el release.
4. Guardar hora UTC, responsable y evidencia del panel; nunca guardar connection strings.

## Incidente

1. Detener deploys y escrituras no esenciales; no ejecutar migraciones adicionales.
2. Identificar la última hora UTC conocida como sana y conservar logs de Vercel.
3. Usar Preview/branch de recuperación para inspeccionar el punto elegido antes de afectar Production.
4. Validar migraciones, ownership y ledger con los preflights read-only.
5. Restaurar o promover solo con aprobación explícita del responsable de Production.
6. Ejecutar health, login y smoke financiero; documentar pérdida potencial y ventana restaurada.

## Estado actual

La evidencia autenticada más reciente es del 2026-07-30: PITR de 1 día, sin snapshots ni schedule. No hay sesión Neon disponible en este corte para demostrar que siga vigente. Estado: `INCONCLUSIVE`; no se realizó restore ni se modificó billing.
