# Plan de release de Doleth

Estado del candidato: `PRIVATE_BETA_READY_WITH_CONCERNS`

Production: `NOT_AUTHORIZED`

## Principios

- separar Preview, tests y Production;
- no usar `db push`, `migrate reset`, seeds ni backfills improvisados;
- no migrar ni desplegar Production sin aprobación explícita;
- crear un punto de recuperación reciente antes de la primera escritura;
- mantener `DOLETH_ACCESS_MODE=private-beta`;
- no habilitar registro público hasta resolver correo real.

## Gate 1 — Candidato

- [x] Rama y PR draft.
- [x] QA local completo.
- [x] Secret scan.
- [x] Preview del SHA funcional.
- [x] Smoke A/B.
- [x] Runtime y responsive.
- [ ] Revisión humana del PR.

GitHub Actions no puede ejecutar por bloqueo de billing. La evidencia local no
elimina ese problema externo, pero cubre lint, tipos, build y DB real.

## Gate 2 — Infraestructura privada

- [x] Neon temporal para Preview.
- [x] Base de aplicación y tests separadas.
- [x] Variables branch-only.
- [x] Secreto de sesión exclusivo.
- [x] Registro público cerrado.
- [x] Infraestructura temporal retenida.

## Gate 3 — Aprobación del owner

Antes de Production, presentar:

- este informe;
- PR draft;
- SHA final;
- migraciones pendientes;
- plan de rollback;
- limitaciones de correo y categorías custom.

Salida: aprobación o rechazo explícito. El estado actual no implica aprobación.

## Gate 4 — Punto de recuperación y preflight

Con aprobación:

1. registrar SHA y deployment productivo actuales;
2. crear una rama o punto de recuperación Neon reciente;
3. validar el recurso de recuperación con consultas read-only;
4. repetir `pnpm db:preflight:neon-readonly`;
5. capturar conteos, owners nulos, referencias cross-owner, checksums y ledger;
6. cancelar ante cualquier ambigüedad.

## Gate 5 — Migraciones Production

Production tiene pendiente la migración de ownership compuesto del candidato
original y, después de este PR, la migración de acceso privado.

1. cargar la conexión solo en el proceso aprobado;
2. ejecutar `pnpm exec prisma migrate deploy`;
3. ejecutar `pnpm db:audit-migrations`;
4. repetir checks read-only de ownership y ledger;
5. no resolver migraciones fallidas manualmente sin comprobar rollback
   transaccional.

## Gate 6 — Release productivo privado

1. confirmar `DOLETH_ACCESS_MODE=private-beta` en Production;
2. confirmar que registro, recuperación por email y cambio de email siguen
   deshabilitados;
3. revisar y fusionar manualmente el PR;
4. desplegar exactamente el SHA aprobado;
5. ejecutar smoke reducido con datos controlados;
6. observar logs y respuestas 5xx;
7. conservar el punto de recuperación durante la ventana acordada.

No usar `vercel promote` ni desplegar desde otro SHA sin repetir la aprobación.

## Lanzamiento público posterior

Es otro release y requiere:

1. dominio propio;
2. Resend verificado;
3. SPF/DKIM;
4. entrega real;
5. verificación y recuperación por email;
6. cambio de email;
7. smoke con dos buzones;
8. cambio deliberado a `DOLETH_ACCESS_MODE=public`;
9. nueva auditoría y aprobación.
