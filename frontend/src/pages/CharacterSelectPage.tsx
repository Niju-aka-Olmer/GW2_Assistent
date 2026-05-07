import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Button } from '../shared/ui/Button';
import { Spinner } from '../shared/ui/Spinner';
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

const PROFESSION_ICONS: Record<string, string> = {
  Guardian: 'https://render.guildwars2.com/file/610F7C4DC9240B33D1F40E27E02746C15EC20B0D/1770182.png',
  Warrior: 'https://render.guildwars2.com/file/67275A02E0D71DE9A1A5537C02AE4C6EDF0F17F3/1770183.png',
  Revenant: 'https://render.guildwars2.com/file/66B1A5403E08B380C7CCDD6413D51332B198DC52/1770184.png',
  Ranger: 'https://render.guildwars2.com/file/E5E262D7A92BDB1EB1D5ECFA2174D10A7F6B4BFA/1770185.png',
  Thief: 'https://render.guildwars2.com/file/FA34B74C18044903C7CD37E6090F260B0A2290D3/1770186.png',
  Engineer: 'https://render.guildwars2.com/file/B615530F3B4167D432B03573CFADD60E5E006C58/1770187.png',
  Necromancer: 'https://render.guildwars2.com/file/1902F6E6D22FF00FF47680A67A5AE509220B2606/1770188.png',
  Elementalist: 'https://render.guildwars2.com/file/0F6979F293B1AAA009BF51E7EFC3F3D47929EDBE/1770189.png',
  Mesmer: 'https://render.guildwars2.com/file/9B7F0CD459334439B720024A539F02AAEBE34C3D/1770190.png',
};

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
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Spinner className="w-10 h-10 mx-auto mb-4" />
            <p className="text-text-secondary">Загрузка персонажей...</p>
          </div>
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char) => (
          <Card key={char.name} className="hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/5">
            <div className="flex items-start gap-3 mb-4">
              <img
                src={PROFESSION_ICONS[char.profession]}
                alt={char.profession}
                className="w-10 h-10 rounded-lg bg-bg-tertiary flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-text-primary truncate">{char.name}</h2>
                <p className="text-sm text-text-secondary">
                  {PROFESSION_RU[char.profession] || char.profession}
                  {' · '}
                  {RACE_RU[char.race] || char.race}
                  {' · '}
                  {char.gender === 'Male' ? 'Мужской' : 'Женский'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-indigo-400">{char.level}</span>
              </div>
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
          </Card>
        ))}
      </div>
    </Layout>
  );
}
