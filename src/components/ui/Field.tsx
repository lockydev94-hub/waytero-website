"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const baseInput =
  "block w-full rounded-xl bg-white border border-ink-7 px-4 h-11 text-sm text-ink " +
  "placeholder:text-ink-5 transition-all duration-200 " +
  "focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 " +
  "disabled:bg-ink-9 disabled:text-ink-4 disabled:cursor-not-allowed";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, leftIcon, rightIcon, children, className = "" }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-xs font-bold uppercase tracking-wider text-ink-3 mb-2">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4">
            {leftIcon}
          </span>
        )}
        {leftIcon ? <div className={baseInput + " pl-10"}>{children}</div> : children}
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-4">
            {rightIcon}
          </span>
        )}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-ink-4">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightIcon, wrapperClassName = "", className = "", required, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} leftIcon={leftIcon} rightIcon={rightIcon} className={wrapperClassName}>
      <input
        ref={ref}
        className={`${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${baseInput} ${className}`}
        required={required}
        {...rest}
      />
    </Field>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, wrapperClassName = "", className = "", required, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <textarea
        ref={ref}
        className={`${baseInput} h-auto py-3 min-h-[100px] ${className}`}
        required={required}
        {...rest}
      />
    </Field>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, leftIcon, rightIcon, wrapperClassName = "", className = "", required, children, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} leftIcon={leftIcon} rightIcon={rightIcon} className={wrapperClassName}>
      <select
        ref={ref}
        className={`${leftIcon ? "pl-10" : ""} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[right_14px_center] bg-no-repeat pr-10 ${baseInput} ${className}`}
        required={required}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
});
