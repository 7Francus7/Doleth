"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../../design-system/primitives/Button";

export function SubmitButton({ children, pendingLabel = "Guardando…" }: { children: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button loading={pending} loadingLabel={pendingLabel} size="lg" type="submit" width="fill">
      {children}
    </Button>
  );
}
