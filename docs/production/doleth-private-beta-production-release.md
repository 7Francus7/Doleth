# Release productivo privado de Doleth

Fecha del intento: 2026-07-31

## 1. Veredicto

`ROLLED_BACK`

El candidato fue integrado, migrado y desplegado correctamente, pero el smoke
productivo se detuvo antes de crear datos. Production contiene un único usuario
histórico en estado `PENDING_VERIFICATION` y rol `USER`; no existe un
administrador activo. El operador seguro exige un `ADMIN` activo para invitar o
recuperar cuentas, mientras que `bootstrap-admin` falla cerrado cuando la tabla
de usuarios no está vacía.

No se omitió esa guarda ni se promovió el usuario mediante SQL manual. Como las
invitaciones eran inutilizables, se aplicó el criterio de rollback aprobado.

## 2. Punto de recuperación

- Proyecto: Neon Production `snowy-heart-67286389`.
- Rama origen: `production`.
- Snapshot manual: 2026-07-31 00:01:55 UTC / 2026-07-30 21:01:55 ART.
- Retención del snapshot: sin vencimiento.
- Branch complementaria: `recovery-private-beta-20260731-000155-utc`,
  identificador redactado `br-bro…qwn`, sin borrado automático.
- Punto más antiguo recuperable observado: 2026-07-29 20:56 ART.
- Validación: read-only, cuatro migraciones previas, conteos e integridad
  contable coincidentes, con rollback explícito de la transacción.
- Restauración: seleccionar el snapshot manual en Backup & Restore, validar
  primero sobre una rama nueva y redirigir Production sólo tras aprobación.

El snapshot y la branch deben conservarse hasta una nueva decisión de release.

## 3. Git y PR

- SHA aprobado: `29b836ee956c9c97fd39df3897e31756652fce9c`.
- PR: `#8`, integrado sin force ni auto-merge.
- SHA resultante de `main`: `8f2746a456446d1705dce161aff2a97b74971e37`.
- El árbol del merge es exactamente equivalente al SHA aprobado.
- `origin/main` coincide con el SHA resultante.
- GitHub Actions no ejecutó sus pasos por el bloqueo externo de billing; las
  validaciones locales completas sustituyeron evidencia, no el estado externo.

## 4. Migraciones

Se aplicaron exclusivamente mediante `prisma migrate deploy`:

1. `202607290001_enforce_cross_owner_relations`;
2. `202607300001_private_beta_access`.

Postflight:

- 6/6 migraciones aplicadas y checksums coincidentes;
- 0 migraciones fallidas;
- 5/5 claves compuestas;
- 8/8 FKs compuestas;
- tabla `PrivateBetaInvite`, diez columnas, seis índices y dos FKs presentes;
- enums de invitación y recuperación presentes;
- conteos históricos sin cambios;
- 0 owners nulos, 0 huérfanos y 0 cruces;
- saldos `MATCH`.

Las migraciones son aditivas y permanecieron aplicadas tras el rollback de la
aplicación. Neon no fue restaurada ni sobrescrita.

## 5. Deployment

- Proyecto: Vercel `doleth`.
- Deployment intentado: Production, rama `main`, SHA `8f2746a…`, `READY`.
- Build: Next.js 16.2.9, funciones Node.js, región `iad1`, sin error.
- La migración terminó antes de que Vercel desplegara outputs.
- Alias: `https://doleth.vercel.app`.
- Rollback: alias restaurado al deployment anterior `dpl_57…9GYV`, SHA
  `a3c4a54fb20c20749222f9eaf02b23db4444a62f`, estado `READY`.
- Logs: cero respuestas 5xx observadas en el deployment nuevo y en el anterior
  durante la ventana de cierre.

## 6. Acceso privado

- `DOLETH_ACCESS_MODE` quedó configurado como `private-beta` en Production.
- `DOLETH_APP_URL` quedó configurado con el origen productivo.
- `DATABASE_URL` y `DOLETH_SESSION_SECRET` de Production se mantuvieron
  separados de Preview.
- Registro público y recuperación por email no se habilitaron.
- Resend y DNS no se modificaron.
- Bloqueo: falta una transición administrativa auditada para adoptar el usuario
  histórico como `ADMIN / ACTIVE` con `privateBetaActivatedAt`, sin afirmar una
  verificación de correo inexistente.

## 7. Smoke Usuario A

| Paso | Resultado |
|---|---|
| Inventario administrativo sin PII | `PASS` |
| Administrador activo disponible | `FAIL` |
| Generar invitación | `NOT_RUN` |
| Consumir invitación y login | `NOT_RUN` |
| Onboarding y finanzas | `NOT_RUN` |
| Recuperación administrativa | `NOT_RUN` |

No se creó ni modificó ningún usuario de smoke.

## 8. Smoke Usuario B

| Paso | Resultado |
|---|---|
| Crear segundo usuario por invitación | `NOT_RUN` |
| Lecturas/escrituras separadas | `NOT_RUN` |
| IDOR y mutaciones cruzadas | `NOT_RUN` |

La ejecución se detuvo antes del primer write productivo.

## 9. Aislamiento

- Suite completa: 53/53 archivos y 808/808 tests.
- Suite explícita de aislamiento: 5/5 archivos y 52/52 tests.
- Preview A/B previa: aprobada.
- Production A/B: no ejecutada por ausencia de administrador.
- Constraints productivos cross-owner: presentes y sin inconsistencias.

## 10. Integridad productiva

Estado final read-only:

- 1 usuario, 1 cuenta, 13 categorías, 1 transacción y 1 asiento;
- 0 invitaciones, 0 tokens y 0 sesiones;
- 0 owners nulos, 0 huérfanos, 0 cruces;
- ledger consistente y saldos `MATCH`;
- ningún dato histórico borrado o modificado por el smoke.

No se documentan importes, correos ni datos personales.

## 11. Producción

- URL: `https://doleth.vercel.app`.
- Aplicación servida: deployment anterior, SHA `a3c4a54…`, `READY`.
- Base: seis migraciones aplicadas y postflight verde.
- `main`: conserva el merge `8f2746a…`.
- Modificaciones persistentes: dos migraciones aditivas y dos variables de
  configuración productiva; cero datos de smoke.

## 12. Limitaciones vigentes

- sin registro público;
- sin verificación por email;
- sin recuperación por email;
- sin cambio de email por correo;
- categorías personalizadas sin CRUD;
- GitHub Actions bloqueado por billing;
- warning futuro de `pg` sobre semántica TLS;
- el preflight versionado requiere un cast compatible con PostgreSQL 18;
- falta el flujo seguro de adopción del administrador histórico.

## 13. Invitaciones

- Cantidad creada: 0.
- Expiración esperada cuando se habiliten: 7 días.
- Entrega segura realizada: no aplicable.
- Enlaces expuestos: `NO`.

## 14. Rollback

- Necesario: sí.
- Ejecutado: sí, únicamente sobre el alias/deployment de Vercel.
- Restauración de Neon: no necesaria.
- Punto de recuperación: disponible y conservado.
- Estado final: aplicación anterior `READY`, base migrada e íntegra.

## 15. Próximo paso exacto

Implementar y validar en Preview una operación administrativa auditada que
adopte explícitamente un usuario histórico existente como administrador de la
beta privada. Debe exigir email local privado, host de base exacto, confirmación
explícita y registrar el evento; no debe marcar el correo como verificado.
Después se requiere un nuevo SHA aprobado, rehearsal, deployment y smoke A/B
productivo completo antes de volver a mover el alias.
