import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Spinner } from '../shared/ui/Spinner';
import { Tabs } from '../shared/ui/Tabs';
import { useCharacters } from '../entities/character/api/getCharacters';
import { deepseekClient } from '../shared/api/deepseekClient';

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
  const [deepseekKey, setDeepseekKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [inventoryTarget, setInventoryTarget] = useState<'inventory' | 'bank'>('inventory');

  const { data: charsData, isLoading: charsLoading } = useCharacters();
  const characters = charsData?.characters || [];

  const buildMutation = useMutation({
    mutationFn: (name: string) => deepseekClient.analyzeBuild(
      name,
      deepseekKey.trim() || undefined,
    ),
  });

  const inventoryMutation = useMutation({
    mutationFn: ({ name, target }: { name: string; target: 'inventory' | 'bank' }) => deepseekClient.analyzeInventory(
      name,
      target,
      deepseekKey.trim() || undefined,
    ),
  });

  const handleAnalyze = () => {
    if (!selectedChar) return;
    if (analysisTab === 'build') {
      buildMutation.mutate(selectedChar);
    } else {
      inventoryMutation.mutate({ name: selectedChar, target: inventoryTarget });
    }
  };

  const isAnalyzing = buildMutation.isPending || inventoryMutation.isPending;
  const result = analysisTab === 'build' ? buildMutation.data : inventoryMutation.data;
  const error = analysisTab === 'build' ? buildMutation.error : inventoryMutation.error;

  const resultContent = result?.analysis || '';

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-text-primary mb-6">AI-рекомендации</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Параметры</h2>

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
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-indigo-500"
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

              <Tabs tabs={ANALYSIS_TABS} activeTab={analysisTab} onChange={setAnalysisTab} />

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
                            ? 'bg-indigo-500 text-white'
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
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                >
                  {showKeyInput ? 'Скрыть' : 'Указать свой'} DeepSeek API ключ
                </button>
                {showKeyInput && (
                  <input
                    type="password"
                    className="w-full mt-2 bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="DeepSeek API Key (опционально)"
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                  />
                )}
              </div>

              <Button
                className="w-full"
                disabled={!selectedChar || isAnalyzing}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? 'Анализирую...' : 'Анализировать'}
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Результат</h2>

            {!result && !error && !isAnalyzing && (
              <p className="text-text-secondary text-center py-8">
                Выберите персонажа и начните анализ
              </p>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Spinner className="w-10 h-10 mx-auto mb-4" />
                  <p className="text-text-secondary text-sm">
                    {analysisTab === 'build' ? 'Анализирую билд...' : 'Анализирую инвентарь...'}
                  </p>
                </div>
              </div>
            )}

            {error && !isAnalyzing && (
              <div className="text-red-400 text-sm">
                {(error as any)?.response?.data?.detail || 'Ошибка анализа. Проверьте API ключ.'}
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="prose prose-invert max-w-none">
                <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {resultContent}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
