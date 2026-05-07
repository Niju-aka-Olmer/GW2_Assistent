import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCharacters } from '../entities/character/api/getCharacters';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { SkeletonGrid } from '../shared/ui/Skeleton';
import { CoinBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import { useAuth } from '../app/providers/AuthProvider';
import { gw2Client } from '../shared/api/gw2Client';
import type { CharacterSummary } from '../entities/character/model/types';

const PROFESSION_ICONS: Record<string, string> = {
  Guardian: 'https://render.guildwars2.com/file/60E15CD70B0D02D53BA0C70ADB17077A90184259/156637.png',
  Warrior: 'https://render.guildwars2.com/file/BD718D0C0B909F3107035E04EAB5D31C4B5AFB57/156638.png',
  Engineer: 'https://render.guildwars2.com/file/0AFA0EA806E7B77FF0F3C9F6D45039A7B80F096E/156636.png',
  Ranger: 'https://render.guildwars2.com/file/036C983816CD36EC6D65B83EAEEB09D7AD0F7719/156635.png',
  Thief: 'https://render.guildwars2.com/file/0EC50A0C9304B87D4F4AAE99AE71F6DB350D0A5C/156634.png',
  Elementalist: 'https://render.guildwars2.com/file/6B0872D0ACD29BBBFA789B2595C74A4F48CF0564/156633.png',
  Mesmer: 'https://render.guildwars2.com/file/38AF76AA1AEB0FD7DD0A7EB2E05AF2020D35542A/156632.png',
  Necromancer: 'https://render.guildwars2.com/file/F4B50E47F3B9C0E843F70E0DBBF0EAA04C3F0B0C/156631.png',
  Revenant: 'https://render.guildwars2.com/file/EF0431093BE00E62C3FC2359167DAA0A2A467B4A/1012719.png',
};

const RACE_RU: Record<string, string> = {
  Asura: 'Асура',
  Charr: 'Чарр',
  Human: 'Человек',
  Norn: 'Норн',
  Sylvari: 'Сильвари',
};

const PROFESSION_RU: Record<string, string> = {
  Guardian: 'Страж',
  Warrior: 'Воин',
  Engineer: 'Инженер',
  Ranger: 'Рейнджер',
  Thief: 'Вор',
  Elementalist: 'Элементалист',
  Mesmer: 'Мечница',
  Necromancer: 'Некромант',
  Revenant: 'Ревенант',
};

function CharacterCard({ character }: { character: CharacterSummary }) {
  return (
    <Link
      to={`/build/${encodeURIComponent(character.name)}`}
      className="block group"
    >
      <Card className="flex items-center gap-4 p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:border-[#c9a84c]/30">
        <div className="flex-shrink-0 w-16 h-16 bg-[#1e212d] rounded-xl overflow-hidden flex items-center justify-center border border-[#2d3246]">
          {PROFESSION_ICONS[character.profession] ? (
            <img src={PROFESSION_ICONS[character.profession]} alt={character.profession} className="w-14 h-14" />
          ) : (
            <span className="text-3xl">?</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-text-primary group-hover:text-[#f3c623] transition-colors truncate">
            {character.name}
          </h2>

          <p className="text-sm text-text-secondary">
            {RACE_RU[character.race] || character.race}
            <span className="text-text-tertiary mx-1">•</span>
            <span>{PROFESSION_RU[character.profession] || character.profession}</span>
            <span className="text-text-tertiary mx-1">•</span>
            <span>Ур. {character.level}</span>
          </p>

          {character.coins > 0 && (
            <div className="mt-1">
              <CoinBadge value={character.coins} />
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

function ApiKeyPage({ onKeySet }: { onKeySet: () => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setApiKey, clearApiKey } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Введите API ключ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setApiKey(trimmed);

      const result = await gw2Client.auth();
      if (result.status === 'ok') {
        onKeySet();
      } else {
        setError('Ошибка проверки ключа: ' + JSON.stringify(result));
        clearApiKey();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Ошибка подключения';
      setError(msg);
      clearApiKey();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <Card variant="gw2" className="w-full max-w-md p-8">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f3c623] to-transparent" />
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
              <path d="M24 4L6 18V38H42V18L24 4Z" stroke="url(#gw2-gold-grad)" strokeWidth="2" fill="none" />
              <path d="M24 14L16 22V34H32V22L24 14Z" stroke="url(#gw2-gold-grad)" strokeWidth="1.5" fill="none" />
              <line x1="24" y1="4" x2="24" y2="14" stroke="url(#gw2-gold-grad)" strokeWidth="1.5" />
              <line x1="6" y1="18" x2="16" y2="22" stroke="url(#gw2-gold-grad)" strokeWidth="1.5" />
              <line x1="42" y1="18" x2="32" y2="22" stroke="url(#gw2-gold-grad)" strokeWidth="1.5" />
              <defs>
                <linearGradient id="gw2-gold-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f3c623" />
                  <stop offset="100%" stopColor="#a68a3c" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
              GW2 Assist
            </span>
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Введите ваш API ключ от Guild Wars 2
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="GW2 API ключ..."
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              className="w-full text-center"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="gold"
            disabled={loading || !key.trim()}
            className="w-full"
          >
            {loading ? 'Проверка...' : 'Подключиться'}
          </Button>
        </form>

        <p className="text-text-tertiary text-xs text-center mt-4">
          Ключ можно получить на{' '}
          <a
            href="https://account.arena.net/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c9a84c] hover:text-[#f3c623] underline underline-offset-2 transition-colors"
          >
            account.arena.net
          </a>
        </p>
      </Card>
    </div>
  );
}

export function CharacterSelectPage() {
  const { apiKey, clearApiKey } = useAuth();
  const [showApiForm, setShowApiForm] = useState(!apiKey);
  const canLoad = !!apiKey && !showApiForm;
  const { data, isLoading, isError, error, refetch } = useCharacters(canLoad);

  const handleKeySet = () => {
    setShowApiForm(false);
  };

  if (showApiForm || !apiKey) {
    return <ApiKeyPage onKeySet={handleKeySet} />;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
              Выберите персонажа
            </span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">Ваши персонажи Guild Wars 2</p>
        </div>
        <button
          onClick={clearApiKey}
          className="text-sm text-text-tertiary hover:text-[#e74c3c] transition-colors px-3 py-1 rounded border border-border-primary hover:border-red-700/30"
        >
          Выйти
        </button>
      </div>

      {isLoading && <SkeletonGrid count={6} />}

      {isError && (
        <Card>
          <p className="text-red-400">Ошибка загрузки персонажей</p>
          <p className="text-sm text-text-secondary mt-1">
            {(error as any)?.response?.data?.detail || String(error)}
          </p>
          <Button onClick={() => refetch()} className="mt-3">
            Повторить
          </Button>
        </Card>
      )}

      {!isLoading && !isError && data?.characters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.characters.map((character) => (
            <CharacterCard key={character.name} character={character} />
          ))}
        </div>
      )}

      {!isLoading && !isError && (!data?.characters || data.characters.length === 0) && (
        <Card>
          <p className="text-text-secondary text-center py-8">
            Нет персонажей. Убедитесь, что API ключ действителен.
          </p>
        </Card>
      )}
    </Layout>
  );
}
