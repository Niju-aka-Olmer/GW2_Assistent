import { Button } from './Button';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Что-то пошло не так',
  message = 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.',
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary mb-6 max-w-md">{message}</p>
      {error && (
        <details className="mb-6 max-w-lg text-left">
          <summary className="text-sm text-text-secondary cursor-pointer hover:text-text-primary">
            Детали ошибки
          </summary>
          <pre className="mt-2 text-xs text-red-400 bg-bg-secondary p-3 rounded-lg overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      )}
      {resetError && (
        <Button variant="primary" onClick={resetError}>
          Попробовать снова
        </Button>
      )}
    </div>
  );
}
