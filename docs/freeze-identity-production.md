# Freeze · identidad multiusuario de Doleth

Fecha: 27 de julio de 2026
Rama: `claude/clave-personal-ingreso-ralo7c`

## Veredicto: **BLOCKED — se requiere acción humana**

El sistema está completo, probado y con todo el instrumental de despliegue
construido y ensayado de punta a punta. **No fue ejecutado en producción**
porque este entorno no tiene acceso a producción.

No se puede declarar `READY`: los criterios exigen backup confirmado, migración
aplicada, backfill ejecutado y smoke productivo, y ninguna de esas cuatro cosas
ocurrió sobre la base real.

### Por qué está bloqueado

Verificado, no supuesto:

| Recurso | Estado |
| --- | --- |
| `DATABASE_URL` de producción | ausente del entorno |
| `DOLETH_SESSION_SECRET`, `RESEND_API_KEY`, `DOLETH_EMAIL_FROM`, `DOLETH_APP_URL` | ausentes |
| CLI de despliegue (`vercel`, `flyctl`, `railway`, `supabase`, `neonctl`, `aws`, `doctl`) | ninguno instalado |
| Vínculo con un proyecto desplegado (`.vercel`, `vercel.json`, `fly.toml`, …) | inexistente |
| Mecanismo de backup del proveedor | inalcanzable |
| Dominio de correo | no configurado |

Sin base productiva no hay backup posible, y sin backup no se toca producción.
Esa es la regla de ejecución del propio corte.

---

## 1. Estado Git

| | |
| --- | --- |
| Rama | `claude/clave-personal-ingreso-ralo7c` |
| Commit inicial | `4221d381fabf35882d236a9e4353ecbf3851102c` |
| Commit final | ver §14 |
| Working tree | limpio |
| Sincronía con remoto | igual |

## 2. Base objetivo

**Producción:** inalcanzable desde este entorno.

**Ensayo:** PostgreSQL 16 local, `postgresql://<usuario>:<oculto>@loc…host:5433/doleth_*`.
Cuatro bases: `doleth` (pruebas), `doleth_clean` (migraciones desde cero),
`doleth_rehearsal` (estado productivo previo), `doleth_accident` (secuencia
completa, incluido el camino de recuperación).

## 3. Backup

**No realizado.** No hay base productiva ni proveedor accesible.

El procedimiento, con verificación obligatoria (`pg_restore --list`), está en
`docs/auth/production-checklist.md` § Fase B, con la variante de cada proveedor.

## 4. Migraciones

| Migración | Estado en el repo | Ensayada |
| --- | --- | --- |
| `202607210001_vertical_007` | previa | sí |
| `202607220001_investments` | previa | sí |
| `202607270001_multiuser_identity` | aplicada en ensayo | sí |
| `202607280001_require_financial_ownership` | **nueva en este corte** | sí |

La migración de endurecimiento:

- convierte a `NOT NULL` las seis columnas `userId` de las tablas financieras;
- agrega `Transaction(destinationAccountId, occurredOn)`, el índice simétrico al
  de la cuenta de origen que faltaba;
- empieza con un bloque `DO $$` que **aborta antes de tocar el esquema** si queda
  alguna fila sin propietario.

Probada en los dos escenarios exigidos:

1. **Base limpia**: las cuatro migraciones desde cero → las seis columnas quedan
   `NOT NULL` y el índice existe.
2. **Esquema productivo previo** con datos legacy sintéticos —con la forma de
   los reales, pero inventados— → migración de identidad, backfill,
   endurecimiento. Duración del endurecimiento: 2,25 s.

## 5. Owner

**Producción:** no identificado (no hay base).

**Ensayo:** creado por el flujo de invitación, sin contraseña conocida.

```
✔ Owner creado por invitación.
  estado:  PENDING_VERIFICATION
```

`pnpm db:ensure-owner` no deduce el owner por orden de creación, normaliza el
correo igual que el registro, aborta si hay más de una coincidencia y crea la
cuenta con una contraseña aleatoria de 32 bytes que descarta en el acto. El
acceso se establece desde `/olvide-mi-contrasena`, que envía el correo real.
Nunca marca un correo como verificado por su cuenta.

## 6. Conteos previos (ensayo)

Estado productivo simulado, antes de la migración:

| Tabla | Filas | Con dueño | Sin dueño |
| --- | --- | --- | --- |
| Account | 4 | 0 | 4 |
| Category | 3 | 0 | 3 |
| Transaction | 6 | 0 | 6 |
| LedgerEntry | 7 | 0 | 7 |
| Investment | 2 | 0 | 2 |
| UpcomingPayment | 2 | 0 | 2 |
| **Total** | **24** | **0** | **24** |

Integridad: 0 asientos con referencia rota, 0 transferencias sin destino,
0 duplicados de correo normalizado.

## 7. Dry run

```
✔ Sin ambigüedad: todas las filas huérfanas corresponden al owner.
✔ Sin propiedad parcial.
--dry-run: se modificarían 24 filas. No se escribió nada.
```

## 8. Resultado del backfill (ensayo)

24 filas reclamadas · 0 huérfanas restantes · 0 filas de otros usuarios tocadas ·
**0 diferencias contables**.

## 9. Comparación de saldos por cuenta

Centavos, antes → después:

| Cuenta | Saldo inicial | Ledger vivo | Saldo antes | Saldo después |
| --- | --- | --- | --- | --- |
| Banco Nación | 1.850.000 | 1.150.000 | **3.000.000** | **3.000.000** |
| Mercado Pago | 432.100 | 212.550 | **644.650** | **644.650** |
| Efectivo | 95.000 | −13.500 | **81.500** | **81.500** |
| Caja vieja | 0 | 0 | **0** | **0** |

Idénticos también después del endurecimiento a `NOT NULL`.

## 10. Comparación del ledger y de operaciones

| Métrica | Antes | Después |
| --- | --- | --- |
| Asientos | 7 | 7 |
| Débitos | −464.950 | −464.950 |
| Créditos | 1.750.000 | 1.750.000 |
| Débitos vivos | −400.950 | −400.950 |
| Créditos vivos | 1.750.000 | 1.750.000 |
| Movimientos | 6 | 6 |
| Anulados | 2 | 2 |
| Correcciones | 1 | 1 |
| Transferencias | 1 | 1 |
| EXPENSE (total / vivos / importe vivo) | 4 / 2 / 100.950 | 4 / 2 / 100.950 |
| INCOME | 1 / 1 / 1.450.000 | 1 / 1 / 1.450.000 |
| TRANSFER | 1 / 1 / 300.000 | 1 / 1 / 300.000 |
| Inversiones (aportado / valor) | 1.100.000 / 1.285.000 | 1.100.000 / 1.285.000 |
| Próximos pagos (estimado) | 825.000 | 825.000 |

Todo en enteros de centavos; los importes viajan como texto desde Postgres para
no pasar por punto flotante.

## 11. Huérfanos restantes

Ensayo: **0**. Producción: **desconocido** hasta correr el preflight.

## 12. Variables verificadas (sólo nombres)

Presentes en el entorno de ensayo: `DATABASE_URL`, `DOLETH_SESSION_SECRET`,
`DOLETH_APP_URL`, `DOLETH_EMAIL_TRANSPORT` (= `console`, sólo desarrollo).

Ausentes y necesarias para producción: `RESEND_API_KEY`, `DOLETH_EMAIL_FROM`, y
los valores productivos de las cuatro anteriores.

Ningún valor fue impreso, registrado ni escrito en el repositorio.

## 13. Proveedor de correo

**No configurado.** Requiere dominio propio, verificación SPF/DKIM y una clave de
Resend. Los correos reales de verificación y recuperación no pudieron ejecutarse.

Sí quedó verificado el comportamiento crítico: contra un build de producción con
transporte `console`, el registro **falla** con "No pudimos enviar el correo en
este momento" en lugar de simular un envío.

## 14. CI

`.github/workflows/ci.yml`, tres jobs:

- **static** — lint y typecheck.
- **test** — PostgreSQL 16 real como service container, base efímera por
  ejecución, migraciones desde cero, auditoría de migraciones, suite completa y
  una segunda corrida de las suites bloqueantes. Limpia el esquema al terminar.
- **build** — build de producción con valores sintéticos.

`DOLETH_REQUIRE_DB=1` hace que la ausencia de base sea un **fallo duro**, no un
skip. Verificado:

```
Error: DOLETH_REQUIRE_DB=1 pero no hay DATABASE_URL ni TEST_DATABASE_URL.
       Las pruebas de aislamiento multiusuario son bloqueantes y no pueden omitirse en CI.
 Test Files  1 failed (1)
```

Sin esa variable (desarrollo local sin base) las suites se omiten sin romper.

El workflow **no fue ejecutado**: requiere habilitar Actions en GitHub.

## 15. Tests

**136 pruebas, 12 archivos, todas en verde.** Typecheck, lint y build correctos.

Nueva respecto del corte anterior: la guardia `database-required`, que no se
omite nunca.

## 16. Smoke productivo

**No ejecutado.** Requiere producción desplegada y correo real.

Está el procedimiento completo (20 puntos) en el runbook, y la limpieza auditada
`pnpm db:smoke-cleanup`, que sólo borra correos con el prefijo reservado
`doleth-smoke+` y se niega ante cualquier otro.

## 17. Términos y privacidad

Revisados contra el comportamiento real del sistema. Cambios:

- La baja se describe como **solicitud**, con las tres etapas reales (registro
  del pedido → bloqueo de acceso → anonimización) y la aclaración de que los
  registros contables se conservan sin persona asociada.
- Se explicita que la exportación de datos **no existe todavía**.
- Se agregó "Nunca vamos a decirte que tu información fue eliminada si sólo quedó
  registrada la solicitud".
- Sección visible **"Lo que todavía falta definir"** en ambas páginas, listando
  responsable, contacto formal, jurisdicción, base legal, plazos de conservación
  y destrucción, e identificación nominal de los proveedores.
- Ambas páginas dicen explícitamente que no constituyen asesoramiento legal ni
  afirman cumplimiento normativo.

**Pendiente: revisión legal profesional.** No se hizo y no se simula.

## 18. Procedimiento de baja

`docs/auth/account-deletion-runbook.md` + `pnpm db:deletions`.

Tres etapas, cada una con `--confirm` obligatorio: listar (con huella financiera)
→ bloquear (revoca sesiones y tokens, `SUSPENDED`, reversible con `--restore`) →
anonimizar (irreversible, conserva la contabilidad sin persona asociada).

Se niega a bloquear sin pedido registrado y a anonimizar sin bloqueo previo.

Verificado empíricamente que un borrado accidental no puede arrastrar finanzas:

```
ERROR: update or delete on table "User" violates foreign key constraint
       "Account_userId_fkey" on table "Account"
```

## 19. Rollback

`docs/auth/rollback-playbook.md`, cinco escenarios con criterio de decisión, SQL
exacto y tabla de "¿se pierde algo?". Principio: conservar datos por encima de
disponibilidad.

El escenario 4 (endurecimiento fallido) fue **ejecutado de verdad** en el ensayo,
incluida la recuperación con `prisma migrate resolve --rolled-back`.

## 20. Índices y claves foráneas

Políticas `ON DELETE`, revisadas y deliberadas:

| Relación | Política | Razón |
| --- | --- | --- |
| Account, Category, Transaction, LedgerEntry, Investment, UpcomingPayment → User | `RESTRICT` | Ninguna cascada puede borrar finanzas |
| Session, AuthToken → User | `CASCADE` | Artefactos de sesión; mueren con la cuenta |
| AuthEvent → User | `SET NULL` | La bitácora sobrevive a la persona |

Índice agregado: `Transaction(destinationAccountId, occurredOn)`. El historial
filtra por cuenta con `OR [origen, destino]` y sólo el origen tenía índice.

## 21. Riesgos pendientes

| Riesgo | Estado |
| --- | --- |
| Nada ejecutado en producción | **Bloqueante.** Requiere credenciales y backup |
| Revisión legal profesional | Deuda declarada, visible en la app |
| Sin exportación de datos antes de la baja | Deuda declarada, visible en `/privacidad` |
| Sin plazo de destrucción de contabilidad anonimizada | Requiere decisión humana |
| Sin 2FA | Fuera del alcance de este corte |
| Rate limiting por ventana fija | Permite hasta 2× en el borde; suficiente hoy |
| CI nunca ejecutado | Requiere habilitar Actions |

## 22. Estado de despliegue

**No desplegado.** El repositorio está listo; la ejecución productiva no empezó.

## 23. Hallazgos del corte

1. **El backfill hacía de más.** El control contable detectó que reponía
   categorías (`Category: 3 → 13`) dentro de la misma transacción que asigna
   propiedad. Se quitó: ahora el backfill sólo escribe `userId`, y por eso las
   sumas de control tienen que dar **exactamente** iguales, sin excepciones. El
   catálogo se completa aparte con `pnpm db:seed`, que ya era idempotente.

2. **Falso positivo en la auditoría de migraciones.** Marcaba como problema una
   migración revertida aunque después se hubiera aplicado con éxito, que es
   exactamente lo que deja el camino de recuperación. Corregido: sólo es un
   problema si nunca llegó a aplicarse.

3. **`migrate deploy` con ambas migraciones pendientes falla de forma segura.**
   Verificado: `P3018`, columnas intactas, cero datos perdidos, y recuperación
   limpia con `migrate resolve --rolled-back`. Documentado en el runbook como
   camino esperado, no como accidente.

## 24. Qué falta para llegar a READY

En orden:

1. Proveer `DATABASE_URL` de producción.
2. Tomar y **verificar** un backup.
3. Configurar el proveedor de correo (dominio, SPF, DKIM, `RESEND_API_KEY`,
   `DOLETH_EMAIL_FROM`).
4. Generar `DOLETH_SESSION_SECRET` de producción.
5. Ejecutar las fases A a K del runbook y guardar la evidencia.
6. Habilitar el workflow de CI.
7. Revisión legal profesional y completado de los campos pendientes.

Los pasos 1 a 5 son mecánicos: el instrumental existe, está probado y cada
comando dice qué verifica y cómo abortar.
