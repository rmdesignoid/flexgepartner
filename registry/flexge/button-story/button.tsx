import { forwardRef, type ButtonHTMLAttributes } from "react";

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn("ds-button", `ds-button--${variant}`, `ds-button--${size}`, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading…" : children}
    </button>
  );
});

Button.displayName = "Button";
