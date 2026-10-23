import { cloneElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  required?: boolean;
};

export type FieldProps = {
  /** id do controle; liga label, dica e erro. */
  id: string;
  label: ReactNode;
  /** Mensagem de erro (ex.: vinda do Zod). Uma string ou a primeira de uma lista. */
  error?: string | string[];
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /** Um único controle: <Input>, <Textarea>, <Select>… */
  children: ReactElement<ControlProps>;
};

/**
 * Label + controle + dica/erro. Injeta id, aria-invalid, aria-describedby e
 * required no controle filho, para o erro ser anunciado junto do campo.
 */
export function Field({ id, label, error, hint, required, className, children }: FieldProps) {
  const message = Array.isArray(error) ? error[0] : error;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = message ? `${id}-error` : undefined;
  const describedBy = [children.props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = cloneElement(children, {
    id,
    required: required ?? children.props.required,
    "aria-invalid": message ? true : children.props["aria-invalid"],
    "aria-describedby": describedBy,
  });

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {control}
      {hint && !message ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}
