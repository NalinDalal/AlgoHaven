"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

const inputClasses =
  "w-full bg-[var(--bg)] border border-[var(--border-lit)] rounded-sm px-3 py-2.5 text-[13px] font-mono text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]";

/* ─── FormField wrapper ─── */

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className = "" }: FormFieldProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block font-mono text-xs text-[var(--muted)] mb-2">
          {label}
          {required && <span className="text-[var(--red)] ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <div className="text-[var(--red)] text-xs mt-1 font-mono">{error}</div>
      )}
    </div>
  );
}

/* ─── Input ─── */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "size"> {
  error?: boolean;
}

export function Input({ error, className = "", ...rest }: InputProps) {
  return (
    <input
      className={`${inputClasses} ${error ? "!border-[var(--red)]" : ""} ${className}`}
      {...rest}
    />
  );
}

/* ─── Select ─── */

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  error?: boolean;
}

export function Select({ error, children, className = "", ...rest }: SelectProps) {
  return (
    <select
      className={`${inputClasses} cursor-pointer ${error ? "!border-[var(--red)]" : ""} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ─── Textarea ─── */

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  error?: boolean;
}

export function Textarea({ error, className = "", ...rest }: TextareaProps) {
  return (
    <textarea
      className={`${inputClasses} min-h-[120px] resize-y ${error ? "!border-[var(--red)]" : ""} ${className}`}
      {...rest}
    />
  );
}
