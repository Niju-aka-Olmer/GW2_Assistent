export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={`inline-block w-5 h-5 border-2 border-border-primary border-t-[#c9a84c] rounded-full animate-spin ${className ?? ''}`}
    />
  );
}
