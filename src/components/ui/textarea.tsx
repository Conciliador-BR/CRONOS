import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./control-styles";

export type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea rows={rows} className={cn(controlClasses, "min-h-20 py-2 leading-relaxed", className)} {...props} />
  );
}
