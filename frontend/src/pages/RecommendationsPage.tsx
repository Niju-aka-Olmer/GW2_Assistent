import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Spinner } from '../shared/ui/Spinner';
import { Tabs } from '../shared/ui/Tabs';
import { SimpleMarkdown } from '../shared/ui/SimpleMarkdown';
import { useCharacters } from '../entities/character/api/getCharacters';
import { deepseekClient } from '../shared/api/deepseekClient';
import { useAnalysisHistory } from '../shared/hooks/useAnalysisHistory';

const DS_KEY_STORAGE = 'gw2_deepseek_api_key';
const DS_REMEMBER_FLAG = 'gw2_deepseek_remember';

function getStoredDeepSeekKey(): string {
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

function storeDeepSeekKey(key: string, remember: boolean) {
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

const ANALYSIS_TABS = [
  { id: 'build', label: 'Анализ билда' },
  { id: 'inventory', label: 'Анализ инвентаря' },
];

const TARGET_OPTIONS = [
  { id: 'inventory' as const, label: 'Инвентарь' },
  { id: 'bank' as const, label: 'Банк' },
];

export function RecommendationsPage() {
  const [analysisTab, setAnalysisTab] = useState('build');
  const [selectedChar, setSelectedChar] = useState('');
  const [deepseekKey, setDeepseekKey] = useState(getStoredDeepSeekKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [rememberDsKey, setRememberDsKey] = useState(() => {
    try {
      return localStorage.getItem(DS_REMEMBER_FLAG) === 'true';
    } catch { return false; }
  });
  const [inventoryTarget, setInventoryTarget] = useState<'inventory' | 'bank'>('inventory');
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  const { data: charsData, isLoading: charsLoading } = useCharacters();
  const characters = charsData?.characters || [];

  const { history, saveAnalysis, clearHistory } = useAnalysisHistory();

  const buildMutation = useMutation({
    mutationFn: (name: string) => deepseekClient.analyzeBuild(
      name,
      deepseekKey.trim() || undefined,
    ),
    onSuccess: (data, name) => {
      saveAnalysis({ name, type: 'build', analysis: data.analysis });
    },
  });

  const inventoryMutation = useMutation({
    mutationFn: ({ name, target }: { name: string; target: 'inventory' | 'bank' }) => deepseekClient.analyzeInventory(
      name,
      target,
      deepseekKey.trim() || undefined,
    ),
    onSuccess: (data, { name, target }) => {
      saveAnalysis({ name, type: target, analysis: data.analysis });
    },
  });

  const handleAnalyze = () => {
    if (!selectedChar) return;
    const key = deepseekKey.trim();
    if (key && rememberDsKey) {
      storeDeepSeekKey(key, true);
    }
    setViewingHistoryId(null);
    if (analysisTab === 'build') {
      buildMutation.mutate(selectedChar);
    } else {
      inventoryMutation.mutate({ name: selectedChar, target: inventoryTarget });
    }
  };

  const handleForgetKey = () => {
    storeDeepSeekKey('', false);
    setDeepseekKey('');
    setRememberDsKey(false);
  };

  const isAnalyzing = buildMutation.isPending || inventoryMutation.isPending;

  const currentResult = analysisTab === 'build' ? buildMutation.data : inventoryMutation.data;
  const currentError = analysisTab === 'build' ? buildMutation.error : inventoryMutation.error;

  const historyEntry = viewingHistoryId ? history.find(h => h.id === viewingHistoryId) : null;

  const displayResult = historyEntry?.analysis || currentResult?.analysis || '';
  const displayTab = historyEntry?.type === 'build' ? 'build' : 'inventory';
  const displayChar = historyEntry?.name || selectedChar;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
            AI-рекомендации
          </span>
        </h1>
        <p className="text-text-secondary text-sm mt-1">Анализ билда и инвентаря с DeepSeek AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-[#c9a84c] mb-3">Параметры</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Персонаж
                </label>
                {charsLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    <span className="text-sm text-text-secondary">Загрузка...</span>
                  </div>
                ) : (
                  <select
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[#c9a84c]"
                    value={selectedChar}
                    onChange={(e) => setSelectedChar(e.target.value)}
                  >
                    <option value="">Выберите персонажа</option>
                    {characters.map((char) => (
                      <option key={char.name} value={char.name}>
                        {char.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Tabs tabs={ANALYSIS_TABS} activeTab={analysisTab} onChange={setAnalysisTab} variant="gw2" />

              {analysisTab === 'inventory' && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Анализировать
                  </label>
                  <div className="flex gap-2">
                    {TARGET_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          inventoryTarget === opt.id
                            ? 'bg-[#c9a84c] text-[#0a0b0f] font-semibold'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                        }`}
                        onClick={() => setInventoryTarget(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <button
                  className="text-sm text-[#c9a84c] hover:text-[#f3c623] transition-colors"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                >
                  {showKeyInput ? 'Скрыть' : 'Указать свой'} DeepSeek API ключ
                </button>
                {showKeyInput && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="password"
                      className="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[#c9a84c]"
                      placeholder="DeepSeek API Key (опционально)"
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                    />
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberDsKey}
                        onChange={(e) => {
                          setRememberDsKey(e.target.checked);
                          if (!e.target.checked) {
                            localStorage.removeItem(DS_KEY_STORAGE);
                            localStorage.removeItem(DS_REMEMBER_FLAG);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-border-primary bg-bg-secondary text-[#c9a84c] focus:ring-[#c9a84c]"
                      />
                      <span className="text-xs text-text-secondary">Запомнить ключ</span>
                    </label>
                  </div>
                )}
                {rememberDsKey && !showKeyInput && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-text-tertiary">DeepSeek ключ сохранён</span>
                    <button
                      onClick={handleForgetKey}
                      className="text-[10px] text-text-tertiary hover:text-red-400 transition-colors"
                    >
                      Забыть
                    </button>
                  </div>
                )}
              </div>

              <Button
                variant="gold"
                className="w-full"
                disabled={!selectedChar || isAnalyzing}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? 'Анализирую...' : 'Анализировать'}
              </Button>

              {history.length > 0 && (
                <div className="pt-3 border-t border-border-primary">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      История ({history.length})
                    </h3>
                    <button
                      onClick={clearHistory}
                      className="text-[10px] text-text-tertiary hover:text-red-400 transition-colors"
                    >
                      Очистить
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {history.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setViewingHistoryId(viewingHistoryId === entry.id ? null : entry.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all ${
                          viewingHistoryId === entry.id
                            ? 'bg-[#c9a84c]/10 text-[#f3c623] border border-[#c9a84c]/30'
                            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-transparent'
                        }`}
                      >
                        <div className="font-medium truncate">{entry.name}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-text-tertiary">
                            {entry.type === 'build' ? 'Билд' : entry.type === 'inventory' ? 'Инвентарь' : 'Банк'}
                          </span>
                          <span className="text-text-muted">{entry.time}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card variant="gw2">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f3c623]/40 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#c9a84c]">Результат</h2>
              {historyEntry && (
                <button
                  onClick={() => setViewingHistoryId(null)}
                  className="text-xs text-text-tertiary hover:text-[#f3c623] transition-colors"
                >
                  К текущему
                </button>
              )}
            </div>

            {!displayResult && !currentError && !isAnalyzing && (
              <p className="text-text-secondary text-center py-8">
                Выберите персонажа и начните анализ
              </p>
            )}

            {isAnalyzing && !historyEntry && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Spinner className="w-10 h-10 mx-auto mb-4" />
                  <p className="text-text-secondary text-sm">
                    {analysisTab === 'build' ? 'Анализирую билд...' : 'Анализирую инвентарь...'}
                  </p>
                </div>
              </div>
            )}

            {currentError && !isAnalyzing && !viewingHistoryId && (
              <div className="text-red-400 text-sm">
                {(currentError as any)?.response?.data?.detail || 'Ошибка анализа. Проверьте API ключ.'}
              </div>
            )}

            {displayResult && (
              <div className="relative">
                {historyEntry && (
                  <div className="text-[10px] text-text-tertiary mb-2 flex items-center gap-2">
                    <span className="bg-[#c9a84c]/10 text-[#c9a84c] px-1.5 py-0.5 rounded">История</span>
                    <span>{displayChar} — {displayTab === 'build' ? 'Билд' : 'Инвентарь'}</span>
                  </div>
                )}
                <div className="text-sm text-text-primary leading-relaxed">
                  <SimpleMarkdown text={displayResult} />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
