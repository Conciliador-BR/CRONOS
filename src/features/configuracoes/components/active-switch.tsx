"use client";

import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setEmployeeActive } from "../employee-actions";

/** Interruptor de acesso (admin). Desabilitado para o próprio usuário. */
export function ActiveSwitch({
  profileId,
  name,
  active,
  disabled,
  onError,
}: {
  profileId: string;
  name: string;
  active: boolean;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(active);

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      const result = await setEmployeeActive(profileId, next);
      if (!result.ok) onError(result.error);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={`Acesso de ${name}`}
      disabled={disabled || pending}
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60",
        optimistic ? "text-success" : "text-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors",
          optimistic ? "border-success/50 bg-success/30" : "border-border bg-surface-2",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-3.5 rounded-full bg-fg transition-transform",
            optimistic ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </span>
      {optimistic ? "Ativo" : "Inativo"}
    </button>
  );
}
