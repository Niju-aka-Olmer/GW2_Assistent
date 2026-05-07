import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-bg-secondary border border-border-primary rounded-lg p-4 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
