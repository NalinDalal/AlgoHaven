"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--accent)",
    border: "none",
    color: "#000",
  },
  secondary: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--muted)",
  },
  danger: {
    background: "transparent",
    border: "1px solid #5c1a1a",
    color: "var(--red)",
  },
  ghost: {
    background: "none",
    border: "none",
    color: "var(--accent)",
    padding: 0,
  },
};

const baseStyle: React.CSSProperties = {
  borderRadius: 2,
  fontFamily: "var(--font-mono), monospace",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: "opacity .15s",
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
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...(fullWidth ? { width: "100%" } : {}),
        ...(variant === "primary" ? { padding: "12px 32px" } : {}),
        opacity: isDisabled ? 0.7 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        ...style,
      }}
      disabled={isDisabled}
      {...rest}
    >
      {children}
    </button>
  );
}
