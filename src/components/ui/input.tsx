import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./control-styles";

export type InputProps = ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return <input type={type} className={cn(controlClasses, "h-10", className)} {...props} />;
}
