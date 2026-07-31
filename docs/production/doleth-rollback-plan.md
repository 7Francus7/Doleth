# Plan de rollback de Doleth

Estado: `READY_WITH_CONCERNS`. Production no fue modificada en este corte.

## Regla principal

El rollback de aplicación y el de datos son decisiones separadas. No ejecutar
SQL inverso ni restaurar Neon sin medir primero las escrituras posteriores.

## Recurso temporal

El proyecto `doleth-preview-e15754b-20260730` es independiente de Production.
Contiene:

- `neondb`, con seis migraciones y datos controlados de smoke;
- `doleth_preview_tests`, con seis migraciones y fixtures descartables.

Debe conservarse hasta aprobación o rechazo del release. No es un backup de
Production y no debe promoverse.

## Antes de un release productivo privado

1. registrar deployment y SHA productivos actuales;
2. crear un punto de recuperación o branch Neon reciente;
3. validar el punto con consultas read-only;
4. capturar conteos, owners nulos, cruces, checksums y ledger;
5. confirmar quién puede promover Vercel y quién puede restaurar Neon;
6. preparar el deployment anterior;
7. confirmar `DOLETH_ACCESS_MODE=private-beta`;
8. confirmar que el registro público permanece cerrado.

## Disparadores

- login o invitaciones no funcionan;
- una invitación se reutiliza;
- recuperación no revoca sesiones;
- fuga A/B o acceso por ID ajeno;
- saldos o ledger inconsistentes;
- migración fallida o checksum alterado;
- tasa anormal de 5xx;
- deployment distinto del SHA aprobado;
- registro público habilitado por error.

Una sospecha de fuga multiusuario exige detener el release inmediatamente.

## Fallo antes de migrar

1. cancelar;
2. mantener deployment y base actuales;
3. preservar logs sin secretos;
4. corregir en la rama y repetir QA/Preview.

## Fallo de migración

1. no desplegar la app nueva;
2. comprobar estado de `_prisma_migrations`;
3. verificar si PostgreSQL revirtió la transacción;
4. no usar `migrate resolve` hasta demostrar rollback completo;
5. corregir datos solo mediante un procedimiento revisado;
6. repetir rehearsal en un recurso aislado.

## Fallo después del deployment sin escrituras incompatibles

1. volver al deployment productivo anterior;
2. confirmar login y lecturas;
3. mantener migraciones aditivas;
4. no quitar columnas durante el incidente;
5. abrir incidente y preservar evidencia.

## Fallo después de escrituras

1. bloquear mutaciones;
2. capturar timestamp y última escritura válida;
3. evaluar forward-fix primero;
4. cuantificar el delta antes de PITR;
5. restaurar primero en una rama/base nueva;
6. reemplazar Production solo con aprobación explícita.

## Fallo específico de acceso privado

- revocar invitaciones pendientes afectadas;
- revocar sesiones de usuarios comprometidos;
- emitir recuperación administrativa solo después de verificar identidad;
- no elegir contraseñas por los usuarios;
- mantener tokens fuera de logs y tickets;
- comprobar que `emailVerifiedAt` no fue falsificado.

## Verificación posterior

- SHA/deployment correcto;
- autenticación disponible;
- registro público cerrado;
- migraciones y checksums coherentes;
- cero owners nulos y cero cruces;
- ledger y saldos esperados;
- anulados excluidos;
- logs sin nuevos errores;
- incidente documentado.

## Deuda para release público

El rollback público debe incorporar fallos de Resend, dominio, SPF/DKIM,
verificación, recuperación y cambio de email. Esa cobertura no existe todavía y
no debe presentarse como resuelta.
