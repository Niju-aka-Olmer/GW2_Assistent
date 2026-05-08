import { useState, useCallback } from 'react';
import { SimpleMarkdown } from '../../../shared/ui/SimpleMarkdown';
import { useAnalysisHistory } from '../../../shared/hooks/useAnalysisHistory';

interface AnalyzeButtonProps {
  label?: string;
  onAnalyze: (apiKey?: string) => Promise<string>;
  historyInfo?: { name: string; type: 'build' | 'inventory' | 'bank' };
}

const DS_KEY_STORAGE = 'gw2_deepseek_api_key';
const DS_REMEMBER_FLAG = 'gw2_deepseek_remember';

function getStoredKey(): string {
  try {
    const remembered = localStorage.getItem(DS_REMEMBER_FLAG) === 'true';
    if (remembered) {
      return localStorage.getItem(DS_KEY_STORAGE) || '';
    }
    return sessionStorage.getItem(DS_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function storeKey(key: string, remember: boolean) {
  try {
    sessionStorage.setItem(DS_KEY_STORAGE, key);
    if (remember) {
      localStorage.setItem(DS_KEY_STORAGE, key);
      localStorage.setItem(DS_REMEMBER_FLAG, 'true');
    } else {
      localStorage.removeItem(DS_KEY_STORAGE);
      localStorage.removeItem(DS_REMEMBER_FLAG);
    }
  } catch { }
}

export function AnalyzeButton({ label = 'Анализ', onAnalyze, historyInfo }: AnalyzeButtonProps) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(getStoredKey());
  const [rememberKey, setRememberKey] = useState(() => {
    try {
      return localStorage.getItem(DS_REMEMBER_FLAG) === 'true';
    } catch { return false; }
  });
  const { saveAnalysis } = useAnalysisHistory();

  const handleAnalyze = useCallback(async (key?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await onAnalyze(key);
      setResult(analysis);
      if (historyInfo) {
        saveAnalysis({ name: historyInfo.name, type: historyInfo.type, analysis });
      }
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
  }, [onAnalyze, historyInfo, saveAnalysis]);

  const handleSubmitKey = () => {
    if (!apiKey.trim()) return;
    storeKey(apiKey.trim(), rememberKey);
    setShowKeyInput(false);
    setError(null);
    handleAnalyze(apiKey.trim());
  };

  const handleForgetKey = () => {
    storeKey('', false);
    setApiKey('');
    setRememberKey(false);
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
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-amber-800/50 disabled:to-amber-800/30 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-amber-900/30 border border-amber-500/30 hover:border-amber-400/50"
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
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        {label}
      </button>

      {error && !showKeyInput && (
        <div className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {rememberKey && !showKeyInput && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-text-tertiary">DeepSeek ключ сохранён</span>
          <button
            onClick={handleForgetKey}
            className="text-xs text-text-tertiary hover:text-red-400 transition-colors"
          >
            Забыть
          </button>
        </div>
      )}

      {result && (
        <div className="mt-4 relative bg-[#1a1a2e] border-2 border-[#c9a84c]/40 rounded-lg overflow-hidden shadow-2xl shadow-black/50">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600/0 via-amber-500/60 to-amber-600/0" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #c9a84c 0%, transparent 50%), radial-gradient(circle at 80% 50%, #c9a84c 0%, transparent 50%)`
            }}
          />
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#c9a84c]/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(201,168,76,0.6)]" />
                <span className="text-xs font-semibold text-amber-500/80 uppercase tracking-widest">Guild Wars 2 — Анализ</span>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-[#c9a84c]/40 hover:text-amber-400 w-6 h-6 flex items-center justify-center rounded hover:bg-amber-900/20 transition-all text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-text-primary leading-relaxed">
              <SimpleMarkdown text={result} />
            </div>
          </div>
        </div>
      )}

      {showKeyInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowKeyInput(false)}>
          <div className="bg-[#1a1a2e] border-2 border-[#c9a84c]/40 rounded-lg shadow-2xl shadow-black/50 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600/0 via-amber-500/60 to-amber-600/0" />
            <h3 className="text-lg font-semibold text-amber-400/90 mb-2">DeepSeek API ключ</h3>
            <p className="text-sm text-text-secondary mb-4">
              Введите ваш DeepSeek API ключ для использования AI-анализа. Ключ сохраняется локально в браузере.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#c9a84c]/30 rounded-lg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitKey(); }}
            />
            <label className="flex items-center gap-2 cursor-pointer select-none mt-2">
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(e) => setRememberKey(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border-primary bg-bg-secondary text-amber-500 focus:ring-amber-500"
              />
              <span className="text-xs text-text-secondary">Запомнить ключ</span>
            </label>
            {error && (
              <p className="text-red-400 text-xs mb-2 mt-1">{error}</p>
            )}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowKeyInput(false)}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-amber-900/20 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitKey}
                disabled={!apiKey.trim()}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-amber-800/50 disabled:to-amber-800/30 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-amber-900/30 border border-amber-500/30"
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
