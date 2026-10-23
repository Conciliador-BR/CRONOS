"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaletteColor } from "./colors";

/** Grupo de rádios de cor (acessível por teclado com setas, como rádios nativos). */
export function ColorPicker({
  name,
  label,
  colors,
  value,
  onChange,
  size = "md",
}: {
  name: string;
  label: string;
  colors: readonly PaletteColor[];
  value: string;
  onChange: (value: string) => void;
  size?: "md" | "lg";
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-fg">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const checked = color.value.toLowerCase() === value.toLowerCase();
          return (
            <label
              key={color.value}
              className={cn(
                "relative grid cursor-pointer place-items-center rounded-lg ring-1 ring-white/10 transition-transform hover:scale-105",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                size === "lg" ? "h-10 w-14" : "size-8",
                checked && "ring-2 ring-fg",
              )}
              style={{ backgroundColor: color.value }}
            >
              <input
                type="radio"
                name={name}
                value={color.value}
                checked={checked}
                onChange={() => onChange(color.value)}
                className="sr-only"
                aria-label={color.name}
              />
              {checked ? <Check aria-hidden className="size-4 text-white drop-shadow" /> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
