import { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full rounded-lg border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-border-primary hover:border-border-hover',
              icon && 'pl-10',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
