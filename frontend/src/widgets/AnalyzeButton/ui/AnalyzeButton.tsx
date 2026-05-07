import { useState } from 'react';
import { Spinner } from '../../../shared/ui/Spinner';

interface AnalyzeButtonProps {
  label: string;
  onAnalyze: () => Promise<string>;
}

export function AnalyzeButton({ label, onAnalyze }: AnalyzeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const handleClick = async () => {
    if (visible) {
      setVisible(false);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setVisible(true);
    try {
      const text = await onAnalyze();
      setResult(text);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Ошибка анализа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {label}
      </button>

      {visible && (
        <div className="absolute right-0 top-12 z-50 w-[480px] max-h-[70vh] bg-bg-primary border border-border-primary rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-text-primary">AI Анализ</h3>
            <button
              onClick={() => setVisible(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(70vh-56px)]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-10">
                <Spinner className="w-8 h-8 mb-3" />
                <p className="text-sm text-text-secondary">Анализируем...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="prose prose-sm max-w-none">
                {result.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={i} className="text-base font-bold text-text-primary mt-4 mb-2">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-semibold text-text-primary mt-3 mb-1">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('- ') || line.startsWith('• ')) {
                    return (
                      <li key={i} className="text-sm text-text-secondary ml-4 list-disc">
                        {line.replace(/^[-•] /, '')}
                      </li>
                    );
                  }
                  if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.')) {
                    return (
                      <p key={i} className="text-sm text-text-secondary ml-2 mt-1">
                        <span className="font-medium text-text-primary">{line.match(/^\d+\./)?.[0]}</span>
                        {line.replace(/^\d+\.\s*/, ' ')}
                      </p>
                    );
                  }
                  if (line.trim() === '') {
                    return <div key={i} className="h-2" />;
                  }
                  return (
                    <p key={i} className="text-sm text-text-secondary leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
