import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./control-styles";

export type SelectProps = ComponentProps<"select"> & {
  /** Primeira opção vazia (value=""), ex.: "Selecione…". */
  placeholder?: string;
};

/** Select nativo estilizado. Passe <option> como children. */
export function Select({ className, placeholder, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select className={cn(controlClasses, "h-10 appearance-none pr-9", className)} {...props}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
