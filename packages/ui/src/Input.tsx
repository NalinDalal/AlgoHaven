"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

/* ─── Shared base styles ─── */

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border-lit)",
  borderRadius: 2,
  padding: "10px 12px",
  fontSize: 13,
  fontFamily: "var(--font-mono), monospace",
  color: "var(--text)",
  outline: "none",
  transition: "border-color .15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  color: "var(--muted)",
  marginBottom: "0.5rem",
};

/* ─── FormField wrapper ─── */

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}

export function FormField({ label, error, required, children, style }: FormFieldProps) {
  return (
    <div style={{ marginBottom: "1rem", ...style }}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: "var(--red)", marginLeft: 4 }}>*</span>}
        </label>
      )}
      {children}
      {error && (
        <div style={{ color: "var(--red)", fontSize: 12, marginTop: 4, fontFamily: "var(--font-mono), monospace" }}>
          {error}
        </div>
      )}
    </div>
  );
}

/* ─── Input ─── */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "size"> {
  error?: boolean;
  inputStyle?: React.CSSProperties;
}

export function Input({ error, inputStyle, ...rest }: InputProps) {
  return (
    <input
      style={{
        ...inputBase,
        borderColor: error ? "var(--red)" : undefined,
        ...inputStyle,
      }}
      {...rest}
    />
  );
}

/* ─── Select ─── */

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  error?: boolean;
  selectStyle?: React.CSSProperties;
}

export function Select({ error, children, selectStyle, ...rest }: SelectProps) {
  return (
    <select
      style={{
        ...inputBase,
        cursor: "pointer",
        borderColor: error ? "var(--red)" : undefined,
        ...selectStyle,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ─── Textarea ─── */

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  error?: boolean;
  textareaStyle?: React.CSSProperties;
}

export function Textarea({ error, textareaStyle, ...rest }: TextareaProps) {
  return (
    <textarea
      style={{
        ...inputBase,
        minHeight: 120,
        resize: "vertical",
        borderColor: error ? "var(--red)" : undefined,
        ...textareaStyle,
      }}
      {...rest}
    />
  );
}
