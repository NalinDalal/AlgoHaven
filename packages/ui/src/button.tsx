"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] border-none text-black",
  secondary: "bg-transparent border border-[var(--border)] text-[var(--muted)]",
  danger: "bg-transparent border border-[#5c1a1a] text-[var(--red)]",
  ghost: "bg-transparent border-none text-[var(--accent)] p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`rounded-sm font-mono text-[13px] font-bold cursor-pointer transition-opacity ${variantClasses[variant]} ${
        variant === "primary" ? "px-8 py-3" : ""
      } ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-70 cursor-not-allowed" : ""} ${className}`}
      disabled={isDisabled}
      {...rest}
    >
      {children}
    </button>
  );
}
