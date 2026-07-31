# Freeze 011 — Pulido final y preparación para uso cotidiano

## 1. Veredicto

**V1_READY_WITH_CONCERNS**

El candidato local cumple privacidad, exportación, PWA honesta, seguridad,
accesibilidad aceptable, rendimiento, PostgreSQL descartable, responsive, tests
y documentación. No recibe `V1_READY` porque el deployment productivo está en
un commit anterior y Vercel Authentication bloqueó el QA de render del
candidato. La restricción del corte impidió desplegar para resolverlo.

## 2. Alcance

Entró:

- privacidad visual local;
- exportaciones CSV/JSON autenticadas;
- PWA instalable;
- offline de shell, sin cache financiero;
- aviso de actualización controlado;
- headers, metadata y noindex;
- touch targets, contraste, jerarquía y responsive;
- eliminación de código muerto y peso de servidor en Storybook;
- observabilidad segura;
- QA integral y documentación operativa.

No entró: importación, restauración, borrado total, escrituras offline,
notificaciones, multiusuario, conexión bancaria, IA, cambios grandes de ledger
o nuevas migraciones.

## 3. Arquitectura final

Next.js App Router renderiza las rutas privadas; `proxy.ts` aplica sesión,
cache-control y headers en el límite. Prisma accede a PostgreSQL. El ledger es la
fuente de verdad y las superficies analíticas consumen funciones puras. Los
client components quedan reservados a interacción, formularios, privacidad,
navegación, PWA y motion útil.

## 4. Modelo financiero

- Centavos enteros y `BigInt`.
- Transferencias propias: patrimonio cero.
- Anulados: visibles, efecto cero.
- Correcciones: original anulado + reemplazo enlazado.
- Pagos previstos: no afectan saldo hasta confirmación.
- Inversiones: separadas del dinero en cuentas.
- `formatCents` delega en `formatCentsAR`, API oficial segura y sin duplicación.
- El CHECK de base exige categoría en todo ingreso/gasto; la rama productiva
  “sin categoría” fue retirada y queda una defensa que falla ante corrupción.

## 5. Rutas

Verificadas:

- `/ingresar`, `/ahora`;
- `/movimientos`, alta, detalle y corrección;
- `/proximo`, alta y detalle;
- `/cambios`, `/progreso`;
- `/mi-realidad`, `/mi-realidad/cierre`;
- `/actuar`, `/cuentas`, `/inversiones`;
- 404 y error states.

Todas las rutas QA muestran un `main`, un `h1` estable y un título sin importes.

## 6. Privacidad

“Ocultar importes”:

- enmascara importes estructurales y narrativos;
- conserva las dimensiones del layout;
- no altera cálculos ni el servidor;
- no enmascara inputs en edición;
- persiste localmente después de refresh, logout y login;
- no se guarda en cookies.

El panel “Más” explica qué guarda Doleth, cómo exportar y cómo cerrar sesión. No
afirma que exista borrado total.

## 7. Exportación

Cuatro CSV y un JSON:

- sesión obligatoria;
- `private, no-store`;
- UTF-8 BOM y `;`;
- defensa contra fórmulas;
- fechas ISO;
- importes en centavos;
- anulaciones, correcciones y transferencias trazables;
- sin secretos ni idempotency keys.

El JSON declara `schemaVersion: 1`, `monetaryUnit: cents` y
`restoreSupported: false`. No hay UI de restauración.

## 8. PWA y offline

Manifest: `standalone`, `start_url /ahora`, scope `/`, `es-AR`,
`portrait-primary`, colores de marca e iconos 192/512, incluido maskable.

El service worker:

- versiona `doleth-shell-v1`;
- limpia versiones viejas;
- cachea solo offline shell, marca y `/_next/static`;
- usa red para navegación;
- nunca cachea rutas privadas, acciones o exportaciones;
- muestra offline honesto;
- espera confirmación para activar una versión nueva;
- oculta el aviso en rutas de formulario.

Prueba real: con el servidor detenido, `/progreso` devolvió la shell “Estás sin
conexión” sin un solo dato financiero. Al volver la red, “Reintentar” recuperó
`/ahora`.

## 9. Seguridad

Verificado localmente:

- CSP con `frame-ancestors 'none'`;
- `X-Frame-Options: DENY`;
- `nosniff`;
- `Referrer-Policy: no-referrer`;
- Permissions Policy restrictiva;
- HSTS solo bajo HTTPS;
- `X-Robots-Tag: noindex, nofollow, noarchive`;
- login y privadas `private, no-store`;
- exportaciones privadas y sin cache;
- `poweredByHeader` desactivado.

La cookie mantiene `HttpOnly`, `SameSite=Lax`, TTL controlado y `Secure` en
HTTPS.

## 10. Resiliencia y observabilidad

Los dominios centrales fallan hacia el error boundary; las lecturas secundarias
degradan a `null`, nunca a cero silencioso. Cada degradación o error inesperado
emite JSON con ruta, operación, código, referencia y timestamp.

El logger omite deliberadamente la excepción cruda para no exponer importes,
descripciones, nombres, cookies, passwords ni conexiones. La exportación
devuelve una referencia segura en errores inesperados.

## 11. Rendimiento

- `TrendChart` se eliminó después de confirmar que no tenía consumidor de
  producto.
- Storybook reemplaza las server actions de finanzas por un mock sin escrituras.
- Prisma, `pg` y el compiler WASM de 4,9 MB desaparecieron del bundle.
- El mayor chunk restante es el runtime de Storybook (~1,28 MB); axe queda en
  ~579 KB y no forma parte de la app productiva.
- El build Next mantiene render de servidor y no agregó cache de datos
  financieros.

## 12. Accesibilidad

- Touch targets accionables medidos en 390 px: mínimo 44 px; los radios visuales
  de 13 px están contenidos por labels de 44 px.
- Sheet: cerrar 44×44; items 67 px; exports 48 px.
- Dialog de descarte: botones 70 px.
- Escape cierra sheet/dialog y devuelve foco a su disparador.
- ErrorState de pantalla usa `h1`; secciones usan `h2`.
- Un solo `h1` estable por ruta.
- Contraste terciario: 4,68:1 sobre canvas y 5,02:1 sobre superficie clara.
- Focus visible, labels, status, progress y reduced motion presentes.

## 13. Pulido visual

Se corrigieron:

- identidad visible en Cambios, Progreso, Mi realidad y Revisión del mes;
- token de borde roto en Cambios;
- uso de verde para deltas que no expresan estabilidad;
- targets de TextLink, SheetHeader, Actuar y flujos operativos;
- overflow del hero de inversiones a 320 px.

La revisión externa de diseño influyó en estas correcciones. No se ejecutó un
rediseño: la arquitectura visual estaba congelada.

## 14. QA PostgreSQL descartable

PGlite en memoria por wire protocol en `127.0.0.1:55432`, con harness temporal
ignorado por Git. Escenario:

- 2 cuentas activas y 1 archivada;
- 16 movimientos;
- transferencia, anulado y corrección;
- dos períodos;
- 5 pagos, incluido vencido y confirmado;
- 2 inversiones.

Las cinco exportaciones respondieron 200 con sesión; sin sesión redirigen al
login. El JSON devolvió 3 cuentas, 16 movimientos, 5 pagos y 2 inversiones, sin
patrones de secreto.

## 15. QA responsive y navegador

Se ejecutaron 112 combinaciones ruta–viewport sobre el build productivo:

| Configuración | Resultado |
|---|---|
| 320×568 | pasa después del fix focal de inversiones |
| 390×844 | pasa |
| 768×1024 | pasa |
| 1024×768 | pasa |
| 1440×900 | pasa |
| 844×390 landscape | pasa |
| 720×450, reflow equivalente a escritorio al 200% | pasa |

No quedó overflow horizontal. Se guardaron capturas ignoradas por Git en
`.gstack/qa-reports/corte-7/`.

## 16. QA producción read-only

Proyecto Vercel: `prj_Ep01OtDxpClMYRFd6HXj0QMHhl4i`.

- Deployment productivo `dpl_G42CRaJu5u3S1m2y71BciCzLTxYT`: `READY`.
- Commit desplegado: `c46fb71`, anterior a C6/C7.
- Vercel Authentication responde 302 hacia el login de Vercel para `/`,
  `/ingresar`, `/ahora`, manifest y robots.
- La capa de Vercel sí responde `no-store`, `DENY` y `noindex`.
- Vercel no reportó errores de runtime en los últimos 7 días.

No se iniciaron credenciales externas ni se eludió SSO. Por eso no se verificó
render, manifest, consola ni navegación del candidato C7 en producción.

## 17. Tests y validaciones

Estado antes del freeze:

```text
pnpm lint             verde
pnpm test             624/624, 37 archivos
pnpm typecheck        verde
pnpm build            verde
pnpm build-storybook  verde
git diff --check      verde
```

También pasaron guardrails de fixtures, navegación interna, secretos, puertos,
dependencias QA, cache, manifest, exportaciones, noindex, touch targets y bundle.

## 18. Documentación

- `README.md`: setup, PostgreSQL descartable, QA, PWA, privacidad y modelo.
- `docs/data-export-format-v1.md`: CSV/JSON y limitación de restauración.
- `docs/operations-v1.md`: privacidad técnica, glosario, producción, release,
  rollback, monitoreo y checklist.
- Este freeze: evidencia y veredicto.

## 19. Git

- Rama: `claude/corte-7-pulido-final`.
- HEAD inicial: `a3c4a54`.
- Main local: `a3c4a54`.
- Origin/main observado: `c46fb71`.
- Commits C7 previos a este documento:
  - `1e7d4b3` privacidad;
  - `1c65d03` exportaciones;
  - `ebc6eac` PWA;
  - `cc6f444` seguridad;
  - `94c491f` UI/accesibilidad;
  - `f69dc9f` rendimiento;
  - `f575ac8` dominio;
  - `b2f3f22` observabilidad;
  - `d7cd3c6` responsive;
  - `70e7bcd` documentación operativa.
- Sin push, deploy, migraciones ni escrituras productivas.
- No se integró a `main`: la regla permitía fast-forward solo con `V1_READY`.

## 20. Deuda, riesgo y recomendación

### Bloqueante para `V1_READY`

- Desplegar el commit candidato en un entorno accesible y completar QA
  producción read-only del mismo commit.

### Importante

- Definir si Vercel Authentication debe preceder al login propio; hoy bloquea
  incluso manifest e installability para visitantes no autenticados.
- Confirmar backup de base y rollback antes del release.

### Post-V1

- Importador/restauración con validación transaccional.
- Borrado total con confirmación extrema.
- Fecha de valuación de inversiones.
- Reducir sistemas locales de breakpoint y densidad de cards en un corte de
  diseño dedicado.

### Futuro

- Offline de lectura con freshness explícito.
- Historial persistente de revisiones.
- Sincronización y dominios financieros mayores.

**Recomendación:** no fusionar ni desplegar automáticamente. Publicar un preview
del commit final, habilitar acceso QA, ejecutar la checklist read-only y, si
pasa, promover el mismo commit a `main` y producción.
