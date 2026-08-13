"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  correctMovementAction,
  createMovementAction,
  type FinanceActionState,
} from "../../app/actions/finance";
import { SubmitButton } from "./SubmitButton";
import { ConfirmDialog } from "../../design-system/composites/ConfirmDialog";
import { AmountInput } from "../../design-system/primitives/AmountInput";
import { Button } from "../../design-system/primitives/Button";
import { StatusMessage, SuccessState } from "../../design-system/feedback";
import { transferSummary } from "../../lib/finance/actionFeedback";
import { parseAmountInput } from "../../lib/finance/amount";
import { describeDateAR, isFutureDate } from "../../lib/finance/movementDate";
import {
  draftStorageKey,
  isDraftWorthKeeping,
  parseDraft,
  serializeDraft,
  type DraftScope,
  type MovementDraftValues,
} from "../../lib/finance/movementDraft";
import {
  clearDestinationIfSameAsSource,
  recentAccountKey,
  resolveDefaultAccount,
  type AccountRole,
} from "../../lib/finance/recentAccounts";
import styles from "./finance.module.css";

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

/** Valores del movimiento que se corrige, para mostrar qué cambia. */
export interface CorrectionOriginal {
  amount: string;
  accountName: string;
  occurredOn: string;
  description: string;
}

const initialState: FinanceActionState = { ok: false, message: "" };

const DRAFT_DEBOUNCE_MS = 600;

const ctaLabels = {
  EXPENSE: { idle: "Registrar gasto", pending: "Registrando gasto…" },
  INCOME: { idle: "Registrar ingreso", pending: "Registrando ingreso…" },
  TRANSFER: { idle: "Confirmar transferencia", pending: "Transfiriendo…" },
} as const;

const roleForType = (type: MovementDefaults["type"]): AccountRole =>
  type === "EXPENSE" ? "expense" : type === "INCOME" ? "income" : "transfer-source";


export function MovementForm({
  accounts,
  categories,
  today,
  defaults,
  initialType,
  idempotencyKey,
  mode = "new",
  returnTo = "/movimientos",
  basedOnPrevious = false,
  referenceOnly = false,
  original,
}: {
  accounts: Option[];
  categories: Option[];
  today: string;
  defaults?: MovementDefaults;
  initialType?: MovementDefaults["type"];
  idempotencyKey: string;
  mode?: "new" | "correction";
  returnTo?: string;
  /** El formulario se precargó desde un movimiento anterior. */
  basedOnPrevious?: boolean;
  /** El movimiento de referencia está anulado. */
  referenceOnly?: boolean;
  original?: CorrectionOriginal;
}) {
  const isCorrection = mode === "correction";
  const handler = isCorrection ? correctMovementAction : createMovementAction;
  const [state, action] = useActionState(handler, initialState);
  // Cancelar y descartar vuelven con el router: recargar la app perdía el layout
  // y el historial de vuelta al listado del que se venía.
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
  const [pendingDraft, setPendingDraft] = useState<MovementDraftValues | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  // useActionState conserva el resultado: sin esto, "Registrar otro" dejaba la
  // pantalla de exito fija y no habia forma de volver al formulario.
  const [dismissedResult, setDismissedResult] = useState<FinanceActionState | null>(null);
  const [typeNotice, setTypeNotice] = useState<string | null>(null);
  // Tras un éxito la intención cambia: el próximo movimiento necesita su propia key.
  const [formKey, setFormKey] = useState(idempotencyKey);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const scope: DraftScope = isCorrection && defaults?.id ? { kind: "correction", movementId: defaults.id } : { kind: "new" };
  const storageKey = draftStorageKey(scope);
  const dirty = isDraftWorthKeeping(values, baseline);

  const update = (patch: Partial<MovementDraftValues>) => setValues((current) => ({ ...current, ...patch }));

  // La cuenta se deriva: lo elegido manda, después la recordada, después la única posible.
  const sourceAccountId = resolveDefaultAccount({
    explicit: values.sourceAccountId,
    remembered: defaults?.sourceAccountId ? null : rememberedAccount,
    accounts,
  });

  // El almacenamiento local solo existe en el cliente: se lee después de montar
  // para no alterar la hidratación, y fuera del cuerpo del efecto para no
  // encadenar renders. El borrador se avisa, nunca se restaura en silencio.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setRememberedAccount(localStorage.getItem(recentAccountKey(roleForType(initialValues.type))));
        const stored = parseDraft(localStorage.getItem(storageKey), Date.now());
        if (stored && isDraftWorthKeeping(stored.values, initialValues)) setPendingDraft(stored.values);
      } catch {
        // Sin almacenamiento local el formulario funciona igual, sin borradores.
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Guardado con debounce mientras haya algo que conservar.
  useEffect(() => {
    if (!dirty || state.ok) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, serializeDraft(values, returnTo, Date.now()));
      } catch {
        // Sin almacenamiento local el formulario sigue funcionando igual.
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [values, dirty, state.ok, storageKey, returnTo]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nada que limpiar.
    }
  };

  // Éxito: se descarta el borrador y se recuerda la cuenta para la próxima vez.
  useEffect(() => {
    if (!state.ok) return;
    clearDraft();
    try {
      localStorage.setItem(recentAccountKey(roleForType(values.type)), sourceAccountId);
      if (values.type === "TRANSFER" && values.destinationAccountId) {
        localStorage.setItem(recentAccountKey("transfer-destination"), values.destinationAccountId);
      }
    } catch {
      // La preferencia es una comodidad: si no se puede guardar, no pasa nada.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  // Cerrar la pestaña con datos sin guardar usa el aviso estándar del navegador.
  useEffect(() => {
    if (!dirty || state.ok) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, state.ok]);

  // El foco va al primer campo que el servidor marcó como inválido.
  useEffect(() => {
    const field = state.error?.field;
    if (!field || state.ok) return;
    document.getElementById(`movement-${field}`)?.focus();
  }, [state]);

  const changeType = (next: MovementDraftValues["type"]) => {
    if (next === values.type) return;
    const incompatibleCategory = next === "TRANSFER" || (values.categoryId && next !== values.type);
    const patch: Partial<MovementDraftValues> = { type: next };
    // El importe, la cuenta, la fecha y la descripción sirven igual en cualquier tipo.
    if (incompatibleCategory && values.categoryId) {
      patch.categoryId = "";
      setTypeNotice("La categoría no aplica a este tipo, así que quedó sin elegir. El resto de los datos siguen acá.");
    } else {
      setTypeNotice(null);
    }
    if (next !== "TRANSFER" && values.destinationAccountId) patch.destinationAccountId = "";
    setValues((current) => ({ ...current, ...patch }));
  };

  const reading = parseAmountInput(values.amount);
  const visibleCategories = categories.filter((category) => category.kind === values.type);
  const accountName = (id: string) => accounts.find((account) => account.id === id)?.name ?? "";
  const cta = ctaLabels[values.type];
  const amountFieldError = state.error?.field === "amount" ? state.message : undefined;

  // Un envío nuevo produce un objeto de estado nuevo, así que el éxito vuelve a mostrarse.
  if (state.ok && state !== dismissedResult) {
    const detailHref = state.data?.transactionId
      ? `/movimientos/${state.data.transactionId}?volver=${encodeURIComponent(returnTo)}`
      : returnTo;
    return (
      <SuccessState
        description={state.detail ?? ""}
        title={state.message}
        {...(state.data?.amount ? { amount: state.data.amount } : {})}
        {...(state.data?.sourceAccountName ? { account: state.data.sourceAccountName } : {})}
        primaryAction={<Link className={styles.primaryLink} href={detailHref}>Ver movimiento</Link>}
        secondaryAction={
          isCorrection ? (
            <Link className={styles.quietLink} href={returnTo}>Volver</Link>
          ) : (
            <button
              className={styles.quietButton}
              onClick={() => {
                const next = { ...initialValues, sourceAccountId, type: values.type };
                setValues(next);
                setBaseline(next);
                setDismissedResult(state);
                setFormKey(crypto.randomUUID());
              }}
              type="button"
            >
              Registrar otro
            </button>
          )
        }
      />
    );
  }

  return (
    <>
      {pendingDraft ? (
        <div className={styles.draftPrompt} role="status">
          <p className={styles.draftTitle}>Tenés un movimiento sin guardar.</p>
          <div className={styles.draftActions}>
            <button
              className={styles.quietButton}
              onClick={() => {
                setValues(pendingDraft);
                setPendingDraft(null);
              }}
              type="button"
            >
              Continuar
            </button>
            <button
              className={styles.quietButton}
              onClick={() => {
                clearDraft();
                setPendingDraft(null);
              }}
              type="button"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}

      {basedOnPrevious ? (
        <StatusMessage tone="info">
          Basado en un movimiento anterior.{referenceOnly ? " El original está anulado: se usa solo como referencia y esto crea un movimiento nuevo." : ""}
        </StatusMessage>
      ) : null}

      {isCorrection ? (
        <StatusMessage tone="info">
          Doleth conservará el movimiento anterior y creará una corrección auditable.
        </StatusMessage>
      ) : null}

      <form action={action} className={`${styles.form} ${styles.movementForm}`}>
        {defaults?.id && isCorrection ? <input name="originalId" type="hidden" value={defaults.id} /> : null}
        <input name="idempotencyKey" type="hidden" value={formKey} />
        <input name="volver" type="hidden" value={returnTo} />
        <input name="type" type="hidden" value={values.type} />

        <AmountInput
          autoFocus={!defaults}
          error={amountFieldError}
          hint="Podés escribirlo como 12.500 o 12500."
          name="amount"
          onValueChange={(amount) => update({ amount })}
          value={values.amount}
        />

        <fieldset className={styles.segmented}>
          <legend>Tipo de movimiento</legend>
          {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((option) => (
            <label key={option}>
              <input
                checked={values.type === option}
                name="typeChoice"
                onChange={() => changeType(option)}
                type="radio"
                value={option}
              />
              <span>{option === "EXPENSE" ? "Gasto" : option === "INCOME" ? "Ingreso" : "Transferencia"}</span>
            </label>
          ))}
        </fieldset>
        {typeNotice ? <StatusMessage tone="info">{typeNotice}</StatusMessage> : null}

        <label className={styles.field} htmlFor="movement-sourceAccountId">
          <span>{values.type === "TRANSFER" ? "Cuenta de origen" : "Cuenta"}</span>
          <select
            id="movement-sourceAccountId"
            name="sourceAccountId"
            onChange={(event) =>
              update({
                sourceAccountId: event.target.value,
                destinationAccountId: clearDestinationIfSameAsSource(event.target.value, values.destinationAccountId),
              })
            }
            required
            value={sourceAccountId}
          >
            <option disabled value="">Seleccionar cuenta</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </label>

        {values.type === "TRANSFER" ? (
          <label className={styles.field} htmlFor="movement-destinationAccountId">
            <span>Cuenta de destino</span>
            <select
              id="movement-destinationAccountId"
              name="destinationAccountId"
              onChange={(event) => update({ destinationAccountId: event.target.value })}
              required
              value={values.destinationAccountId}
            >
              <option disabled value="">Seleccionar destino</option>
              {accounts
                .filter((account) => account.id !== sourceAccountId)
                .map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
        ) : (
          <label className={styles.field} htmlFor="movement-categoryId">
            <span>Categoría</span>
            <select
              id="movement-categoryId"
              name="categoryId"
              onChange={(event) => update({ categoryId: event.target.value })}
              required
              value={values.categoryId}
            >
              <option disabled value="">Seleccionar categoría</option>
              {visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
        )}

        <label className={styles.field} htmlFor="movement-occurredOn">
          <span>Fecha</span>
          <input
            id="movement-occurredOn"
            name="occurredOn"
            onChange={(event) => update({ occurredOn: event.target.value })}
            required
            type="date"
            value={values.occurredOn}
          />
          <small>
            {describeDateAR(values.occurredOn, today)}
            {isFutureDate(values.occurredOn, today) ? " · es una fecha futura" : ""}
          </small>
        </label>

        <label className={styles.field} htmlFor="movement-description">
          <span>Descripción <small>opcional</small></span>
          <input
            id="movement-description"
            maxLength={160}
            name="description"
            onChange={(event) => update({ description: event.target.value })}
            placeholder="Detalle breve"
            value={values.description}
          />
        </label>

        {values.type === "TRANSFER" ? (
          <section aria-label="Resumen de la transferencia" className={styles.transferSummary}>
            {transferSummary(reading.cents, accountName(sourceAccountId), accountName(values.destinationAccountId)).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>
        ) : null}

        {isCorrection && original ? (
          <section aria-label="Qué cambia con la corrección" className={styles.comparison}>
            <p className={styles.comparisonTitle}>Qué cambia</p>
            <dl className={styles.detailGrid}>
              <div className={styles.detailRow}><dt>Importe</dt><dd>${original.amount} → ${values.amount || "—"}</dd></div>
              <div className={styles.detailRow}><dt>Cuenta</dt><dd>{original.accountName} → {accountName(sourceAccountId) || "—"}</dd></div>
              <div className={styles.detailRow}><dt>Fecha</dt><dd>{describeDateAR(original.occurredOn, today)} → {describeDateAR(values.occurredOn, today)}</dd></div>
              {original.description !== values.description ? (
                <div className={styles.detailRow}><dt>Descripción</dt><dd>{original.description || "—"} → {values.description || "—"}</dd></div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {state.message && !state.ok && state.error?.field !== "amount" ? (
          <StatusMessage tone="error">{state.message}</StatusMessage>
        ) : null}

        <div className={styles.movementSubmit}>
          <div className={styles.movementSubmitRow}>
            <Button
              kind="secondary"
              onClick={() => (dirty ? setDiscardOpen(true) : router.push(returnTo))}
              ref={cancelRef}
              size="lg"
              type="button"
            >
              Cancelar
            </Button>
            <SubmitButton disabled={reading.cents === null} pendingLabel={isCorrection ? "Guardando corrección…" : cta.pending}>
              {isCorrection ? "Guardar corrección" : cta.idle}
            </SubmitButton>
          </div>
        </div>
      </form>

      <ConfirmDialog
        description="Los datos que escribiste no se van a guardar."
        onOpenChange={setDiscardOpen}
        open={discardOpen}
        returnFocusRef={cancelRef}
        title="¿Descartar este movimiento?"
        footer={
          <>
            <Button kind="secondary" onClick={() => setDiscardOpen(false)} size="lg" type="button">Seguir editando</Button>
            <Button
              kind="primary"
              onClick={() => {
                clearDraft();
                setDiscardOpen(false);
                router.push(returnTo);
              }}
              size="lg"
              type="button"
            >
              Descartar
            </Button>
          </>
        }
      />
    </>
  );
}
