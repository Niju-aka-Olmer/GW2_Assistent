import { useState, useCallback } from 'react';

interface AnalyzeButtonProps {
  label?: string;
  onAnalyze: (apiKey?: string) => Promise<string>;
}

const DS_KEY_STORAGE = 'gw2_deepseek_api_key';

function getStoredKey(): string {
  try {
    return sessionStorage.getItem(DS_KEY_STORAGE) || localStorage.getItem(DS_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function storeKey(key: string) {
  try {
    sessionStorage.setItem(DS_KEY_STORAGE, key);
    localStorage.setItem(DS_KEY_STORAGE, key);
  } catch { }
}

export function AnalyzeButton({ label = 'Анализ', onAnalyze }: AnalyzeButtonProps) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(getStoredKey());

  const handleAnalyze = useCallback(async (key?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await onAnalyze(key);
      setResult(analysis);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || String(err);
      if (msg.includes('not configured') || msg.includes('API key') || msg.includes('DeepSeek')) {
        setShowKeyInput(true);
        setError('Необходимо указать DeepSeek API ключ');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [onAnalyze]);

  const handleSubmitKey = () => {
    if (!apiKey.trim()) return;
    storeKey(apiKey.trim());
    setShowKeyInput(false);
    setError(null);
    handleAnalyze(apiKey.trim());
  };

  return (
    <>
      <button
        onClick={() => {
          const stored = getStoredKey();
          if (stored) {
            handleAnalyze(stored);
          } else {
            setShowKeyInput(true);
          }
        }}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl font-medium text-sm transition-all"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Анализирую...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {label}
          </>
        )}
      </button>

      {error && !showKeyInput && (
        <div className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-xl">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-bg-secondary border border-border-primary rounded-2xl relative">
          <button
            onClick={() => setResult(null)}
            className="absolute top-2 right-2 text-text-tertiary hover:text-text-primary w-6 h-6 flex items-center justify-center rounded hover:bg-bg-tertiary"
          >
            ✕
          </button>
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm text-text-primary leading-relaxed">
            {result}
          </div>
        </div>
      )}

      {showKeyInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowKeyInput(false)}>
          <div className="bg-bg-primary border border-border-primary rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-2">DeepSeek API ключ</h3>
            <p className="text-sm text-text-secondary mb-4">
              Введите ваш DeepSeek API ключ для использования AI-анализа. Ключ сохраняется локально в браузере.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-xl text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-1"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitKey(); }}
            />
            {error && (
              <p className="text-red-400 text-xs mb-2">{error}</p>
            )}
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => setShowKeyInput(false)}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitKey}
                disabled={!apiKey.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl text-sm font-medium transition-all"
              >
                Сохранить и запустить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
