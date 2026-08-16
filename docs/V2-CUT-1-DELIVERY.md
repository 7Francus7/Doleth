# Doleth V2 — Cut 1 delivery

Date: 2026-08-13  
Branch: `codex/v2-cut-1-shell-home`

## Verdict

`V2_CUT_1_WITH_CONCERNS`

Cut 1 is implemented and verified at the visual/application layer. The concern
is operational and unchanged: the complete financial regression suite was not
executed because there is no disposable local PostgreSQL test database.

`REGRESIÓN FINANCIERA COMPLETA: NO EJECUTADA — pendiente PostgreSQL local`

## Before / after

Before, Doleth used three primary destinations plus a raised Registrar action
and Más, a narrow mobile canvas on desktop, rounded floating navigation, and a
stack of soft cards on Ahora.

After, the shell exposes five stable destinations — Inicio, Movimientos,
Cuentas, Plan, Patrimonio — with a separate persistent `+ NUEVO`. Inicio is an
editorial financial sheet: dominant available total, hard period band,
projection, recent/upcoming ledgers, accounts, and evidence.

Screenshots:

- `docs/screenshots/v2-cut-1/inicio-mobile-320.png`
- `docs/screenshots/v2-cut-1/inicio-desktop-1440.png`

## Components and routes

Changed or added:

- `AppNav`, `MoreMenu` presentation, `NewMovementMenu`, navigation model.
- `NowPage` / Inicio composition and responsive visual system.
- `MovementForm` receives an optional safe initial operation type.
- `/ahora` remains the compatible URL and is relabeled Inicio.
- `/movimientos/nuevo?tipo=EXPENSE|INCOME|TRANSFER` preselects the existing
  form without changing mutation behavior.
- `/inversiones/nueva` is reused for the already-supported investment action.

Legacy analytical routes remain reachable from Más. No route was deleted.

## QA evidence

- Lint: pass.
- Typecheck: pass.
- Next.js production build: pass.
- Storybook production build: pass (existing Vite externalization/chunk warnings).
- Non-DB suite: 982 tests pass; DB-dependent suites skip when both database
  environment values are intentionally blanked for the process.
- Viewports inspected: 320, 375, 390, 1440.
- Page horizontal overflow: none at all inspected widths.
- Visible interactive targets below 44 px at 320: none.
- Long amount fixture (`$12.345.678.901,22`): contained at 320 without page overflow.
- Empty Inicio fixture: included in Storybook.

## Design decisions

- Bone/ink palette retained; mineral green is limited to semantic action.
- 0–4 px visual radius within the Cut 1 surface; no glass, gradient, floating
  card stack, or decorative shadow.
- Amount scale and hard rules establish hierarchy; icons only orient navigation.
- Existing reliable view-model strings and values are rendered directly. No new
  financial calculation was introduced in the UI.

## Domain files intentionally not touched

- `prisma/schema.prisma`
- `prisma/migrations/**`
- ledger, financial calculation, ownership, auth, void/correction,
  idempotency, import, multicurrency, recurrence, and investment-domain modules
- `.env.local`

## Remaining debt / concern

- Provision a disposable PostgreSQL database with an explicitly test-named
  database and run the full destructive financial isolation/regression suite.
- Storybook still reports pre-existing server-module externalization and large
  chunk warnings; the build completes, but story isolation can be improved in a
  later developer-experience cut.

Do not advance to Cut 2 from this artifact without a separate authorization.
