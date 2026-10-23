import type { ComponentProps } from "react";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";
import { Spinner } from "./spinner";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mostra spinner, desabilita e marca aria-busy. */
  loading?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
