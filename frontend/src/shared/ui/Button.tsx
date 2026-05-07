import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition-all disabled:opacity-50',
        {
          'bg-gradient-to-r from-[#c9a84c] to-[#a68a3c] text-[#0a0b0f] hover:from-[#f3c623] hover:to-[#c9a84c] shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#f3c623]/30 border border-[#f3c623]/30':
            variant === 'gold',
          'bg-indigo-600 text-white hover:bg-indigo-500': variant === 'primary',
          'bg-bg-tertiary text-text-primary hover:bg-bg-hover': variant === 'secondary',
          'text-text-secondary hover:text-text-primary': variant === 'ghost',
        },
        {
          'px-2 py-1 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
