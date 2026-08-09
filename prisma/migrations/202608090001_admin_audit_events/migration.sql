-- Tipos de evento para las acciones del panel de administración.
--
-- Una suspensión decidida por un tercero y un cambio que la persona se hizo a sí
-- misma no son el mismo hecho. Reusar `PROFILE_UPDATED` para las dos cosas
-- dejaría la bitácora sin poder responder la única pregunta que se le hace
-- cuando algo salió mal: quién hizo esto, y si fue el dueño de la cuenta.
--
-- `ADD VALUE` es aditivo: no reescribe filas y no invalida ningún valor
-- existente. `IF NOT EXISTS` la vuelve idempotente, que es lo que permite correr
-- `migrate deploy` dos veces sin romper.
ALTER TYPE "AuthEventType" ADD VALUE IF NOT EXISTS 'USER_SUSPENDED';
ALTER TYPE "AuthEventType" ADD VALUE IF NOT EXISTS 'USER_REACTIVATED';
ALTER TYPE "AuthEventType" ADD VALUE IF NOT EXISTS 'USER_ROLE_CHANGED';
