"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../../design-system/primitives/Button";

export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  disabled = false,
}: {
  children: string;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled} loading={pending} loadingLabel={pendingLabel} size="lg" type="submit" width="fill">
      {children}
    </Button>
  );
}
