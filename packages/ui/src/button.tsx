"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-accent text-background border-none font-bold hover:bg-accent-dim active:bg-accent/80",
  secondary: "bg-transparent border border-border text-muted hover:border-border-lit hover:text-foreground",
  danger:    "bg-transparent border border-[#5c1a1a] text-red hover:border-red/60 hover:bg-red/10",
  ghost:     "bg-transparent border-none text-accent p-0 hover:text-accent-dim underline underline-offset-4 decoration-border",
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
      className={`inline-flex items-center justify-center font-mono text-sm tracking-tight
        rounded-none border cursor-pointer transition-all duration-fast
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${loading ? "animate-pulse" : ""}
        ${className}`}
      disabled={isDisabled}
      {...rest}
    >
      {children}
    </button>
  );
}
