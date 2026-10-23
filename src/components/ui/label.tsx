import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type LabelProps = ComponentProps<"label"> & { required?: boolean };

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn("text-sm font-medium text-fg", className)} {...props}>
      {children}
      {required ? (
        <span aria-hidden className="ml-0.5 text-danger">
          *
        </span>
      ) : null}
    </label>
  );
}
