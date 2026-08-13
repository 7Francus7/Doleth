"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../../design-system/primitives/Button";

export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  disabled = false,
  pendingOverride = false,
}: {
  children: string;
  pendingLabel?: string;
  disabled?: boolean;
  pendingOverride?: boolean;
}) {
  const { pending } = useFormStatus();
  const isPending = pending || pendingOverride;
  return (
    <Button disabled={disabled} loading={isPending} loadingLabel={pendingLabel} size="lg" type="submit" width="fill">
      {children}
    </Button>
  );
}
