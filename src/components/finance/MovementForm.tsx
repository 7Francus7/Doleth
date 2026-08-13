"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { correctMovementAction, createMovementAction, type FinanceActionState } from "../../app/actions/finance";
import { ConfirmDialog } from "../../design-system/composites/ConfirmDialog";
import { StatusMessage } from "../../design-system/feedback";
import { AmountInput } from "../../design-system/primitives/AmountInput";
import { Button } from "../../design-system/primitives/Button";
import { parseAmountInput } from "../../lib/finance/amount";
import { describeDateAR, isFutureDate } from "../../lib/finance/movementDate";
import { draftStorageKey, isDraftWorthKeeping, parseDraft, serializeDraft, type DraftScope, type MovementDraftValues } from "../../lib/finance/movementDraft";
import { clearDestinationIfSameAsSource, recentAccountKey, resolveDefaultAccount, type AccountRole } from "../../lib/finance/recentAccounts";
import styles from "./finance.module.css";
import formStyles from "./MovementForm.module.css";
import { SubmitButton } from "./SubmitButton";
import { TactileSelect } from "./TactileSelect";

interface Option { id: string; name: string; currency?: string; kind?: string }

export interface MovementDefaults {
  id?: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string;
  occurredOn: string;
  sourceAccountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  description?: string;
}

export interface CorrectionOriginal { amount: string; accountName: string; occurredOn: string; description: string }

const initialState: FinanceActionState = { ok: false, message: "" };
const DRAFT_DEBOUNCE_MS = 600;
const movementTypes = ["EXPENSE", "INCOME", "TRANSFER"] as const;
const typeLabel = { EXPENSE: "Gasto", INCOME: "Ingreso", TRANSFER: "Transferencia" } as const;
const successLabel = { EXPENSE: "Gasto registrado", INCOME: "Ingreso registrado", TRANSFER: "Transferencia registrada" } as const;
const ctaLabels = {
  EXPENSE: { idle: "Guardar gasto", pending: "Guardando gasto…" },
  INCOME: { idle: "Guardar ingreso", pending: "Guardando ingreso…" },
  TRANSFER: { idle: "Confirmar transferencia", pending: "Transfiriendo…" },
} as const;
const roleForType = (type: MovementDefaults["type"]): AccountRole => type === "EXPENSE" ? "expense" : type === "INCOME" ? "income" : "transfer-source";

export function MovementForm({ accounts, categories, today, defaults, initialType, idempotencyKey, mode = "new", returnTo = "/movimientos", basedOnPrevious = false, referenceOnly = false, original, previewState, previewPending = false }: {
  accounts: Option[];
  categories: Option[];
  today: string;
  defaults?: MovementDefaults;
  initialType?: MovementDefaults["type"];
  idempotencyKey: string;
  mode?: "new" | "correction";
  returnTo?: string;
  basedOnPrevious?: boolean;
  referenceOnly?: boolean;
  original?: CorrectionOriginal;
  /** Sólo para historias visuales: permite verificar estados sin ejecutar una mutación. */
  previewState?: FinanceActionState;
  previewPending?: boolean;
}) {
  const isCorrection = mode === "correction";
  const [actionState, action] = useActionState(isCorrection ? correctMovementAction : createMovementAction, initialState);
  const state = previewState ?? actionState;
  const router = useRouter();
  const initialValues: MovementDraftValues = {
    type: defaults?.type ?? initialType ?? "EXPENSE",
    amount: defaults?.amount ?? "",
    sourceAccountId: defaults?.sourceAccountId ?? "",
    destinationAccountId: defaults?.destinationAccountId ?? "",
    categoryId: defaults?.categoryId ?? "",
    occurredOn: defaults?.occurredOn ?? today,
    description: defaults?.description ?? "",
  };
  const [values, setValues] = useState<MovementDraftValues>(initialValues);
  const [baseline, setBaseline] = useState<MovementDraftValues>(initialValues);
  const [rememberedAccount, setRememberedAccount] = useState<string | null>(null);
  const [rememberedDestination, setRememberedDestination] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<MovementDraftValues | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [dismissedResult, setDismissedResult] = useState<FinanceActionState | null>(null);
  const [typeNotice, setTypeNotice] = useState<string | null>(null);
  const [destinationAmount, setDestinationAmount] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(Boolean(defaults?.description || (defaults?.occurredOn && defaults.occurredOn !== today)));
  const [formKey, setFormKey] = useState(idempotencyKey);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const scope: DraftScope = isCorrection && defaults?.id ? { kind: "correction", movementId: defaults.id } : { kind: "new" };
  const storageKey = draftStorageKey(scope);
  const dirty = isDraftWorthKeeping(values, baseline);
  const update = (patch: Partial<MovementDraftValues>) => setValues((current) => ({ ...current, ...patch }));
  const sourceAccountId = resolveDefaultAccount({ explicit: values.sourceAccountId, remembered: defaults?.sourceAccountId ? null : rememberedAccount, accounts });
  const destinationAccountId = values.type === "TRANSFER" ? resolveDefaultAccount({ explicit: values.destinationAccountId, remembered: rememberedDestination, accounts, exclude: sourceAccountId }) : "";
  const sourceAccount = accounts.find((account) => account.id === sourceAccountId);
  const destinationAccount = accounts.find((account) => account.id === destinationAccountId);
  const crossesCurrencies = Boolean(values.type === "TRANSFER" && sourceAccount && destinationAccount && sourceAccount.currency !== destinationAccount.currency);
  const reading = parseAmountInput(values.amount);
  const destinationReading = parseAmountInput(destinationAmount);
  const visibleCategories = categories.filter((category) => category.kind === values.type);
  const accountName = (id: string) => accounts.find((account) => account.id === id)?.name ?? "";
  const amountReady = reading.cents !== null && reading.error === null;
  const destinationAmountReady = !crossesCurrencies || (destinationReading.cents !== null && destinationReading.error === null);
  const choicesReady = values.type === "TRANSFER"
    ? Boolean(sourceAccountId && destinationAccountId && sourceAccountId !== destinationAccountId)
    : Boolean(sourceAccountId && values.categoryId);
  const formReady = amountReady && destinationAmountReady && choicesReady;

  const clearDraft = () => { try { localStorage.removeItem(storageKey); } catch {} };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setRememberedAccount(localStorage.getItem(recentAccountKey(roleForType(initialValues.type))));
        setRememberedDestination(localStorage.getItem(recentAccountKey("transfer-destination")));
        const stored = parseDraft(localStorage.getItem(storageKey), Date.now());
        if (stored && isDraftWorthKeeping(stored.values, initialValues)) setPendingDraft(stored.values);
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!dirty || state.ok) return;
    const timer = setTimeout(() => { try { localStorage.setItem(storageKey, serializeDraft(values, returnTo, Date.now())); } catch {} }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [values, dirty, state.ok, storageKey, returnTo]);

  useEffect(() => {
    if (!state.ok) return;
    clearDraft();
    try {
      localStorage.setItem(recentAccountKey(roleForType(values.type)), sourceAccountId);
      if (values.type === "TRANSFER" && destinationAccountId) localStorage.setItem(recentAccountKey("transfer-destination"), destinationAccountId);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  useEffect(() => {
    if (!dirty || state.ok) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, state.ok]);

  useEffect(() => {
    const field = state.error?.field;
    if (!field || state.ok) return;
    document.getElementById(`movement-${field}`)?.focus();
  }, [state]);

  const changeType = (next: MovementDraftValues["type"]) => {
    if (next === values.type) return;
    const patch: Partial<MovementDraftValues> = { type: next };
    if ((next === "TRANSFER" || values.categoryId) && values.categoryId) {
      patch.categoryId = "";
      setTypeNotice("La categoría anterior no aplica. El importe, la cuenta y los detalles siguen acá.");
    } else setTypeNotice(null);
    if (next !== "TRANSFER") patch.destinationAccountId = "";
    setDestinationAmount("");
    setValues((current) => ({ ...current, ...patch }));
  };

  if (state.ok && state !== dismissedResult) {
    const detailHref = state.data?.transactionId ? `/movimientos/${state.data.transactionId}?volver=${encodeURIComponent(returnTo)}` : returnTo;
    return <section className={formStyles.successState} data-operation={values.type} role="status">
      <div className={formStyles.successReceipt}>
        <p>{successLabel[values.type]}</p>
        {state.data?.amount ? <strong>${state.data.amount}</strong> : null}
      </div>
      <p className={formStyles.successContext}>{state.data?.sourceAccountName ?? state.detail}</p>
      <div className={formStyles.successActions}>
        <Link className={formStyles.successPrimary} href={returnTo}>Volver</Link>
        <Link className={formStyles.successSecondary} href={detailHref}>Ver movimiento</Link>
        {!isCorrection ? <button onClick={() => {
          const next = { ...initialValues, sourceAccountId, type: values.type };
          setValues(next); setBaseline(next); setDestinationAmount(""); setDismissedResult(state); setFormKey(crypto.randomUUID());
        }} type="button">Registrar otro</button> : null}
      </div>
    </section>;
  }

  return <>
    {pendingDraft ? <div className={styles.draftPrompt} role="status"><p className={styles.draftTitle}>Tenés un movimiento sin guardar.</p><div className={styles.draftActions}>
      <button className={styles.quietButton} onClick={() => { setValues(pendingDraft); setPendingDraft(null); }} type="button">Continuar</button>
      <button className={styles.quietButton} onClick={() => { clearDraft(); setPendingDraft(null); }} type="button">Descartar</button>
    </div></div> : null}
    {basedOnPrevious ? <StatusMessage tone="info">Basado en un movimiento anterior.{referenceOnly ? " El original está anulado: se usa solo como referencia y esto crea un movimiento nuevo." : ""}</StatusMessage> : null}
    {isCorrection ? <StatusMessage tone="info">Doleth conservará el movimiento anterior y creará una corrección auditable.</StatusMessage> : null}

    <form action={action} className={`${formStyles.form} ${styles.movementForm}`} data-operation={values.type}>
      {defaults?.id && isCorrection ? <input name="originalId" type="hidden" value={defaults.id} /> : null}
      <input name="idempotencyKey" type="hidden" value={formKey} />
      <input name="volver" type="hidden" value={returnTo} />
      <input name="type" type="hidden" value={values.type} />

      <AmountInput autoFocus={!defaults} emphasis="hero" error={state.error?.field === "amount" ? state.message : undefined} hint="Escribí el importe" name="amount" onValueChange={(amount) => update({ amount })} required value={values.amount} />

      <fieldset className={formStyles.typeSwitch}><legend>Tipo de movimiento</legend>{movementTypes.map((option) => <label key={option}>
        <input checked={values.type === option} name="typeChoice" onChange={() => changeType(option)} type="radio" value={option} /><span>{typeLabel[option]}</span>
      </label>)}</fieldset>
      {typeNotice ? <StatusMessage tone="info">{typeNotice}</StatusMessage> : null}

      {values.type === "TRANSFER" ? <div className={formStyles.transferRoute}>
        <TactileSelect id="movement-sourceAccountId" label="Sale de" name="sourceAccountId" value={sourceAccountId} options={accounts.map((a) => ({ id: a.id, name: a.name, meta: a.currency }))} placeholder="Elegir origen" error={state.error?.field === "sourceAccountId" ? state.message : undefined} onChange={(id) => update({ sourceAccountId: id, destinationAccountId: clearDestinationIfSameAsSource(id, destinationAccountId) })} />
        <TactileSelect id="movement-destinationAccountId" label="Entra en" name="destinationAccountId" value={destinationAccountId} options={accounts.filter((a) => a.id !== sourceAccountId).map((a) => ({ id: a.id, name: a.name, meta: a.currency }))} placeholder="Elegir destino" error={state.error?.field === "destinationAccountId" ? state.message : undefined} onChange={(id) => update({ destinationAccountId: id })} />
      </div> : <div className={formStyles.primaryChoices}>
        <TactileSelect id="movement-categoryId" label="Categoría" name="categoryId" value={values.categoryId} options={visibleCategories.map((c) => ({ id: c.id, name: c.name }))} placeholder="Elegir categoría" error={state.error?.field === "categoryId" ? state.message : undefined} onChange={(id) => update({ categoryId: id })} />
        <TactileSelect id="movement-sourceAccountId" label="Cuenta" name="sourceAccountId" value={sourceAccountId} options={accounts.map((a) => ({ id: a.id, name: a.name, meta: a.currency }))} placeholder="Elegir cuenta" error={state.error?.field === "sourceAccountId" ? state.message : undefined} onChange={(id) => update({ sourceAccountId: id })} />
      </div>}

      {crossesCurrencies && destinationAccount ? <div className={formStyles.destinationAmount}>
        <AmountInput currencyLabel={destinationAccount.currency ?? ""} error={state.error?.field === "destinationAmount" ? state.message : undefined} label="Importe que entra" name="destinationAmount" onValueChange={setDestinationAmount} required value={destinationAmount} />
        <p>Las cuentas usan monedas distintas. Registrá el importe real recibido.</p>
      </div> : <input name="destinationAmount" type="hidden" value="" />}

      <div className={formStyles.details}>
        <button aria-expanded={detailsOpen} onClick={() => setDetailsOpen((current) => !current)} type="button"><span>{detailsOpen ? "−" : "+"} Detalles</span><small>{describeDateAR(values.occurredOn, today)}</small></button>
        {detailsOpen ? <div className={formStyles.detailsFields}>
          <label className={formStyles.detailField} htmlFor="movement-occurredOn"><span>Fecha</span><input id="movement-occurredOn" name="occurredOn" onChange={(event) => update({ occurredOn: event.target.value })} required type="date" value={values.occurredOn} /><small>{describeDateAR(values.occurredOn, today)}{isFutureDate(values.occurredOn, today) ? " · fecha futura" : ""}</small></label>
          <label className={formStyles.detailField} htmlFor="movement-description"><span>Descripción <small>opcional</small></span><input id="movement-description" maxLength={160} name="description" onChange={(event) => update({ description: event.target.value })} placeholder="Agregar una nota" value={values.description} /></label>
        </div> : <><input name="occurredOn" type="hidden" value={values.occurredOn} /><input name="description" type="hidden" value={values.description} /></>}
      </div>

      {values.type === "TRANSFER" ? <section aria-label="Resumen de la transferencia" className={formStyles.transferSummary}>
        <strong>${values.amount || "—"}</strong>
        <p>{accountName(sourceAccountId) || "Origen"} <span aria-hidden="true">→</span> {accountName(destinationAccountId) || "Destino"}</p>
        {crossesCurrencies && destinationAccount && destinationAmount ? <small>Acredita {destinationAccount.currency} {destinationAmount}</small> : null}
      </section> : null}
      {isCorrection && original ? <section aria-label="Qué cambia con la corrección" className={styles.comparison}><p className={styles.comparisonTitle}>Qué cambia</p><dl className={styles.detailGrid}>
        <div className={styles.detailRow}><dt>Importe</dt><dd>${original.amount} → ${values.amount || "—"}</dd></div><div className={styles.detailRow}><dt>Cuenta</dt><dd>{original.accountName} → {accountName(sourceAccountId) || "—"}</dd></div><div className={styles.detailRow}><dt>Fecha</dt><dd>{describeDateAR(original.occurredOn, today)} → {describeDateAR(values.occurredOn, today)}</dd></div>
        {original.description !== values.description ? <div className={styles.detailRow}><dt>Descripción</dt><dd>{original.description || "—"} → {values.description || "—"}</dd></div> : null}
      </dl></section> : null}
      {state.message && !state.ok && !["amount", "categoryId", "sourceAccountId", "destinationAccountId", "destinationAmount"].includes(state.error?.field ?? "") ? <StatusMessage tone="error">{state.message}</StatusMessage> : null}

      <div className={`${styles.movementSubmit} ${formStyles.submitDock}`}><div className={`${styles.movementSubmitRow} ${formStyles.submitRow}`}>
        <Button className={formStyles.cancelButton} kind="secondary" onClick={() => dirty ? setDiscardOpen(true) : router.push(returnTo)} ref={cancelRef} size="lg" type="button">Cancelar</Button>
        <SubmitButton disabled={!formReady} pendingLabel={isCorrection ? "Guardando corrección…" : ctaLabels[values.type].pending} pendingOverride={previewPending}>{isCorrection ? "Guardar corrección" : ctaLabels[values.type].idle}</SubmitButton>
      </div></div>
    </form>

    <ConfirmDialog description="Los datos que escribiste no se van a guardar." onOpenChange={setDiscardOpen} open={discardOpen} returnFocusRef={cancelRef} title="¿Descartar este movimiento?" footer={<>
      <Button kind="secondary" onClick={() => setDiscardOpen(false)} size="lg" type="button">Seguir editando</Button>
      <Button kind="primary" onClick={() => { clearDraft(); setDiscardOpen(false); router.push(returnTo); }} size="lg" type="button">Descartar</Button>
    </>} />
  </>;
}
