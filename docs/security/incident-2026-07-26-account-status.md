# Incidente 2026-07-26 — cambio de estado de una cuenta

## Resumen

Durante una ventana operativa declarada read-only se observó un
`POST /cuentas` que escribió el estado `ACTIVE` sobre una cuenta. La sesión que
autorizó la acción no pudo atribuirse a una persona o dispositivo.

El propietario respondió:

```text
NO_PUEDO_RECORDARLO
```

Clasificación final:

```text
INCONCLUSIVE_CONTAINED
```

No existe evidencia suficiente para atribuir la acción. La sesión anterior fue
invalidada, no hubo recurrencia y no se modificaron importes ni el ledger.

## Línea temporal

Todas las horas están expresadas en UTC. Argentina corresponde a UTC−03:00.

| Hora | Evento |
|---|---|
| 2026-07-26 22:03:58 | Una sesión ya aceptada accedió a `/cuentas`. |
| 2026-07-26 22:04:27 | Vercel registró `POST /cuentas 200`. |
| 2026-07-26 22:04:30.820 | La fila `Account` registró su nuevo `updatedAt`. |
| 2026-07-26 22:15:56 | Se creó el deployment productivo de verificación previo a la contención. |
| 2026-07-26 23:02:58 | Se congeló nuevamente la evidencia antes de contener. |
| 2026-07-26 23:07:21 | Se rotó `DOLETH_SESSION_SECRET` en Production. |
| 2026-07-26 23:07:24 | Se rotó `DOLETH_SESSION_SECRET` en Preview. |
| 2026-07-26 23:08:15 | Se creó el redeploy de contención desde `c46fb71`. |
| 2026-07-26 23:09:16 | El redeploy quedó `READY` y recibió el dominio productivo. |
| 2026-07-26 23:12:35–40 | QA confirmó invalidación de sesiones y acceso con credenciales nuevas. |
| 2026-07-26 23:18:45 | Cerró la ventana focal sin nuevas escrituras ni errores. |

## Fila afectada

```text
Cuenta: acct-6d33a9d4
Tipo: WALLET
Campo escrito: status
Valor anterior: no recuperado
Valor posterior: ACTIVE
updatedAt posterior: 2026-07-26 22:04:30.820
```

La Server Action productiva sólo podía escribir `status` con `ACTIVE` o
`ARCHIVED`; Prisma actualizaba `updatedAt` automáticamente. Si el request vino
del formulario normal, es compatible con una reactivación. El estado anterior
no pudo recuperarse y esa transición no se considera probada.

No se documentan el nombre real ni el saldo de la cuenta.

## Impacto

- Una fila `Account` recibió una escritura no atribuida.
- No se crearon, corrigieron ni anularon movimientos.
- No se crearon entradas de ledger.
- No cambiaron pagos próximos, inversiones ni categorías.
- No se modificaron saldos iniciales ni importes.
- El impacto persistido quedó limitado al estado operativo de la cuenta.

## Sesiones

Doleth usa una cookie `doleth_session` firmada con HMAC-SHA256 a partir de
`DOLETH_SESSION_SECRET`. La cookie es `HttpOnly`, `Secure` en Production,
`SameSite=Strict`, tiene alcance `/` y una duración máxima de 30 días.

La rotación previa de `DOLETH_ACCESS_PASSWORD` no invalidó cookies ya emitidas
porque el session secret seguía vigente. La evidencia es compatible con una
sesión anterior todavía válida, pero no identifica quién la controlaba.

La aplicación no persiste sesiones individuales ni identidad de usuario. Por
eso no existe un registro interno que permita asociar la acción a una persona,
dispositivo o fecha de login.

## Contención

- Se preservaron deployment, SHA, logs y estado redactado de la fila.
- Se rotó `DOLETH_SESSION_SECRET` como variable Sensitive en Production y
  Preview.
- Se mantuvieron `DOLETH_ACCESS_PASSWORD` y `DATABASE_URL`.
- Se desplegó exactamente
  `c46fb71e7b73f369806207d851472bc9164e5485`.
- El deployment de contención fue
  `dpl_A5LpvdmtSEkkBsRQMg3GeM5vPDek`.
- Una firma anterior, aceptada antes de rotar, pasó a redirigir a `/ingresar`.
- La contraseña anterior continuó inválida.
- La contraseña actual emitió una sesión nueva y operativa.
- La cuenta afectada no fue modificada durante la investigación o contención.

## Política de acceso

### Preview y URLs directas

Permanecen detrás de Vercel Authentication.

### Dominio productivo

`doleth.vercel.app` está protegido por el login propio de Doleth. Vercel
Authentication adicional sobre el dominio productivo no está disponible en el
plan Hobby y no se hará un upgrade sólo para agregar esa capa.

Esto es una decisión de política y plataforma, no un defecto del código de
Doleth.

### Controles compensatorios

- Contraseña de acceso fuerte.
- Session secret aleatorio y rotado.
- Cookie `HttpOnly`, `Secure` y `SameSite=Strict`.
- TTL de sesión de 30 días.
- Respuestas privadas con `private, no-store`.
- Rama Neon productiva protegida.
- Logs productivos monitorizados.
- Redeploy obligatorio después de rotar variables de runtime.

## Neon

La rama `production` quedó protegida, primaria y default. La investigación usó
consultas `READ ONLY`.

Se intentó reconstruir el estado anterior con PITR dentro de la ventana de 24
horas. Las ramas históricas temporales no pudieron autenticarse y fueron
eliminadas. No se restauró, promovió ni modificó Production.

## Monitoreo

La ventana posterior al redeploy cubrió desde `23:09:16` hasta `23:18:45` UTC.

| Acción | Resultado |
|---|---:|
| `POST /cuentas` | 0 |
| Otros requests financieros mutantes | 0 |
| Errores o warnings de runtime | 0 |
| Respuestas 5xx | 0 |
| Cambios en Accounts | 0 |
| Cambios en Transactions | 0 |
| Cambios en Ledger entries | 0 |
| Cambios en Upcoming payments | 0 |
| Cambios en Investments | 0 |
| Cambios en Categories | 0 |

Se observó una navegación no atribuida a `/` que fue detenida en `/ingresar`.
No generó sesión ni escritura.

## Respuesta del propietario y clasificación final

Respuesta literal:

```text
NO_PUEDO_RECORDARLO
```

Clasificación:

```text
INCONCLUSIVE_CONTAINED
```

No existe evidencia suficiente para atribuir la reactivación. El acceso
anterior fue invalidado, no hubo recurrencia y no existió impacto contable.

## Estado de la cuenta

La cuenta permanece `ACTIVE`. Esto registra el estado observado; no constituye
una decisión forense de mantenerlo.

Decisión:

```text
REQUIERE_REVISION_FUNCIONAL
```

Cualquier cambio futuro a `ARCHIVED` requiere una instrucción explícita y debe
decidirse por la función actual de la cuenta, no intentando reconstruir una
intención que la evidencia no permite probar.

## Riesgo residual

- El actor y el dispositivo del request original siguen sin identificarse.
- Las sesiones son compartidas y stateless; no existe inventario por
  dispositivo.
- El dominio productivo tiene el login propio como capa de acceso.
- La acción de archivar o reactivar no conserva una auditoría de negocio.

Estos riesgos no implican una recurrencia activa. Las credenciales anteriores
ya no autorizan acceso.

## Acciones preventivas post-V1

Documentadas para un corte posterior; no implementadas en este cierre:

- Registrar auditoría de cada cambio de estado de cuenta.
- Pedir confirmación antes de archivar o reactivar.
- Emitir un identificador no sensible por sesión.
- Registrar timestamp y código estable de la acción.
- Agregar idempotencia a los cambios de estado.
- Mejorar la visibilidad de sesiones activas.
- Ofrecer una operación manual para invalidar todas las sesiones.

## Cierre

La contención del acceso queda cerrada. El incidente permanece sin atribución,
pero contenido. Doleth V1 no se declara listo por este documento: todavía debe
completarse el QA manual en Chrome y el proceso de release autorizado.
