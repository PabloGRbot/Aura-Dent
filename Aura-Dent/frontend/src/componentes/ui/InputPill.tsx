import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputPillProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  iconoIzq?: ReactNode;
  iconoDer?: ReactNode;
}

export function InputPill({
  label,
  error,
  iconoIzq,
  iconoDer,
  className = '',
  id,
  ...props
}: InputPillProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className="relative">
        {iconoIzq && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-text pointer-events-none">
            {iconoIzq}
          </span>
        )}
        <input
          id={id}
          className={`
            input-pill
            ${iconoIzq ? 'pl-11' : ''}
            ${iconoDer ? 'pr-11' : ''}
            ${error ? 'border-red-500 focus:shadow-red-200' : ''}
            ${className}
          `}
          {...props}
        />
        {iconoDer && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-text">
            {iconoDer}
          </span>
        )}
      </div>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
