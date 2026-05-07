import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gw2';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg p-4 shadow-sm',
        variant === 'gw2'
          ? 'bg-[#15171f] border-2 border-[#c9a84c]/30 shadow-lg shadow-black/30'
          : 'bg-bg-secondary border border-border-primary',
        className,
      )}
    >
      {children}
    </div>
  );
}
