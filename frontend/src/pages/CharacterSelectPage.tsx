import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Button } from '../shared/ui/Button';
import { Spinner } from '../shared/ui/Spinner';
import { SkeletonGrid } from '../shared/ui/Skeleton';
import { useAuth } from '../app/providers/AuthProvider';
import { useCharacters } from '../entities/character/api/getCharacters';

const PROFESSION_RU: Record<string, string> = {
  Guardian: 'Страж',
  Warrior: 'Воин',
  Revenant: 'Ревенант',
  Ranger: 'Рейнджер',
  Thief: 'Вор',
  Engineer: 'Инженер',
  Necromancer: 'Некромант',
  Elementalist: 'Элементалист',
  Mesmer: 'Месмер',
};

const RACE_RU: Record<string, string> = {
  Human: 'Человек',
  Charr: 'Чарр',
  Asura: 'Асура',
  Norn: 'Норн',
  Sylvari: 'Сильвари',
};

const PROFESSION_BG: Record<string, string> = {
  Guardian: '#3b82f6',
  Warrior: '#ef4444',
  Revenant: '#8b5cf6',
  Ranger: '#22c55e',
  Thief: '#f59e0b',
  Engineer: '#f97316',
  Necromancer: '#6b21a8',
  Elementalist: '#06b6d4',
  Mesmer: '#ec4899',
};

function CharacterRender({ name, apiKey, profession }: { name: string; apiKey: string; profession: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const renderUrl = `/api/characters/${encodeURIComponent(name)}/render?api_key=${encodeURIComponent(apiKey)}`;

  useEffect(() => {
    setLoadError(false);
    setLoaded(false);
  }, [renderUrl]);

  return (
    <div className="relative w-full aspect-[1/2] max-w-[256px] mx-auto overflow-hidden">
      {!loaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-tertiary">
          <Spinner className="w-6 h-6" />
        </div>
      )}
      <img
        ref={imgRef}
        src={renderUrl}
        alt={name}
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoadError(true); setLoaded(true); }}
      />
      {loadError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: PROFESSION_BG[profession] || '#374151' }}
        >
          <span className="text-[80px] font-bold text-white/30 select-none">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

export function CharacterSelectPage() {
  const { apiKey, setApiKey, clearApiKey } = useAuth();
  const [keyInput, setKeyInput] = useState('');

  const { data, isLoading, isError, error: queryError } = useCharacters(!!apiKey);

  const errorMessage = useMemo(() => {
    if (!isError || !queryError) return null;
    const resp = (queryError as any)?.response;
    if (resp?.status === 401) {
      clearApiKey();
      return 'Неверный API-ключ. Проверьте ключ и попробуйте снова.';
    }
    return resp?.data?.detail || 'Ошибка загрузки персонажей';
  }, [isError, queryError, clearApiKey]);

  if (!apiKey) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <h1 className="text-2xl font-bold text-text-primary mb-2">GW2 Assistant</h1>
            <p className="text-text-secondary text-sm mb-6">
              Введите API-ключ Guild Wars 2 для начала работы<br />
              Ключ нужен с правами: <code className="text-indigo-400 text-xs">account</code>, <code className="text-indigo-400 text-xs">characters</code>, <code className="text-indigo-400 text-xs">inventories</code>
            </p>
            <div className="space-y-4">
              <Input
                label="API Key"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && keyInput.trim()) {
                    setApiKey(keyInput.trim());
                  }
                }}
              />
              <Button
                className="w-full"
                size="lg"
                disabled={!keyInput.trim()}
                onClick={() => setApiKey(keyInput.trim())}
              >
                Подключиться
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Мои персонажи</h1>
        </div>
        <SkeletonGrid count={8} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <h2 className="text-xl font-bold text-text-primary mb-2">Ошибка</h2>
            <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
            <Button variant="secondary" onClick={clearApiKey}>
              Ввести другой ключ
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const characters = data?.characters || [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Мои персонажи</h1>
        <Button variant="ghost" size="sm" onClick={clearApiKey}>
          Сменить ключ
        </Button>
      </div>

      {characters.length === 0 && (
        <Card>
          <p className="text-text-secondary text-center py-8">
            У вашего API-ключа нет персонажей
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {characters.map((char) => (
          <Card key={char.name} className="overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/5 p-0">
            <CharacterRender name={char.name} apiKey={apiKey} profession={char.profession} />
            <div className="p-4">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-text-primary truncate">{char.name}</h2>
                <p className="text-sm text-text-secondary">
                  {PROFESSION_RU[char.profession] || char.profession}
                  {' · '}
                  {RACE_RU[char.race] || char.race}
                  {' · '}
                  Ур. {char.level}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/build/${encodeURIComponent(char.name)}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    Билд
                  </Button>
                </Link>
                <Link to={`/inventory/${encodeURIComponent(char.name)}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    Инвентарь
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}