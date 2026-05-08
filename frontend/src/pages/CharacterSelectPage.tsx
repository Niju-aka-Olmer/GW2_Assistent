import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCharacters } from '../entities/character/api/getCharacters';
import { useAuth } from '../app/providers/AuthProvider';
import { gw2Client } from '../shared/api/gw2Client';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { SkeletonGrid } from '../shared/ui/Skeleton';
import { CoinBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import type { CharacterSummary, WalletCurrency } from '../entities/character/model/types';

const PROFESSION_ICONS: Record<string, string> = {
  Guardian: 'https://wiki.guildwars2.com/images/thumb/3/30/Guardian_icon_%28highres%29.png/480px-Guardian_icon_%28highres%29.png',
  Warrior: 'https://wiki.guildwars2.com/images/thumb/7/76/Warrior_icon_%28highres%29.png/480px-Warrior_icon_%28highres%29.png',
  Engineer: 'https://wiki.guildwars2.com/images/thumb/5/53/Engineer_icon_%28highres%29.png/480px-Engineer_icon_%28highres%29.png',
  Ranger: 'https://wiki.guildwars2.com/images/thumb/c/c7/Ranger_icon_%28highres%29.png/480px-Ranger_icon_%28highres%29.png',
  Thief: 'https://wiki.guildwars2.com/images/thumb/3/31/Thief_icon_%28highres%29.png/480px-Thief_icon_%28highres%29.png',
  Elementalist: 'https://wiki.guildwars2.com/images/thumb/c/c0/Elementalist_icon_%28highres%29.png/480px-Elementalist_icon_%28highres%29.png',
  Mesmer: 'https://wiki.guildwars2.com/images/thumb/0/0a/Mesmer_icon_%28highres%29.png/480px-Mesmer_icon_%28highres%29.png',
  Necromancer: 'https://wiki.guildwars2.com/images/thumb/2/27/Necromancer_icon_%28highres%29.png/480px-Necromancer_icon_%28highres%29.png',
  Revenant: 'https://wiki.guildwars2.com/images/thumb/2/2d/Revenant_icon_%28highres%29.png/480px-Revenant_icon_%28highres%29.png',
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

const COIN_ID = 1;

function CharacterCard({ character }: { character: CharacterSummary }) {
  return (
    <Link
      to={`/character/${encodeURIComponent(character.name)}`}
      className="block group"
    >
      <Card className="flex flex-col items-center p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:border-[#c9a84c]/30">
        <div className="w-44 h-44 bg-[#1e212d] rounded-xl overflow-hidden flex items-center justify-center border border-[#2d3246] mb-4">
          {PROFESSION_ICONS[character.profession] ? (
            <img src={PROFESSION_ICONS[character.profession]} alt={character.profession} className="w-full h-full object-contain" />
          ) : (
            <span className="text-4xl">?</span>
          )}
        </div>

        <div className="text-center w-full">
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
        </div>
      </Card>
    </Link>
  );
}

function WalletDisplay({ wallet }: { wallet: WalletCurrency[] }) {
  const sorted = [...wallet].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return (
    <Card className="mb-6">
      <h2 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Кошелёк</h2>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {sorted.map(entry => {
          if (entry.id === COIN_ID) {
            return (
              <div key={entry.id} className="flex items-center gap-1.5">
                <span className="text-xs text-text-secondary">{entry.name || 'Монеты'}:</span>
                <CoinBadge value={entry.value} size={10} />
              </div>
            );
          }
          return (
            <div key={entry.id} className="flex items-center gap-1.5">
              {entry.icon && (
                <img
                  src={entry.icon}
                  alt={entry.name || ''}
                  className="w-4 h-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="text-xs text-text-secondary">{entry.name || `Валюта ${entry.id}`}:</span>
              <span className="text-xs text-text-primary font-medium">{entry.value.toLocaleString('ru-RU')}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ApiKeyPage({ onKeySet }: { onKeySet: () => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const { setApiKey, clearApiKey, isRemembered } = useAuth();

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
      setApiKey(trimmed, remember);

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

  const handleForget = () => {
    clearApiKey();
    setKey('');
    setRemember(false);
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

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-border-primary bg-bg-secondary text-[#c9a84c] focus:ring-[#c9a84c]"
            />
            <span className="text-sm text-text-secondary">Запомнить ключ</span>
          </label>

          <Button
            type="submit"
            variant="gold"
            disabled={loading || !key.trim()}
            className="w-full"
          >
            {loading ? 'Проверка...' : 'Подключиться'}
          </Button>
        </form>

        {isRemembered && (
          <div className="mt-4 pt-4 border-t border-border-primary">
            <p className="text-xs text-text-secondary text-center mb-2">Ключ сохранён в памяти</p>
            <Button
              variant="gw2"
              onClick={handleForget}
              className="w-full text-xs"
            >
              Забыть ключ
            </Button>
          </div>
        )}

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
  const { apiKey, clearApiKey, isRemembered } = useAuth();
  const [showApiForm, setShowApiForm] = useState(!apiKey);

  useEffect(() => {
    if (!apiKey) {
      setShowApiForm(true);
    }
  }, [apiKey]);

  const canLoad = !!apiKey && !showApiForm;
  const { data, isLoading, isError, error, refetch } = useCharacters(canLoad);

  const walletQuery = useQuery({
    queryKey: ['account-wallet'],
    queryFn: async () => {
      const result = await gw2Client.getWallet();
      return result.wallet;
    },
    enabled: canLoad,
    refetchInterval: 120000,
  });

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
        <div className="flex items-center gap-2">
          {isRemembered && (
            <button
              onClick={clearApiKey}
              className="text-sm text-text-tertiary hover:text-[#e74c3c] transition-colors px-3 py-1 rounded border border-border-primary hover:border-red-700/30"
            >
              Забыть ключ
            </button>
          )}
          <button
            onClick={clearApiKey}
            className="text-sm text-text-tertiary hover:text-[#e74c3c] transition-colors px-3 py-1 rounded border border-border-primary hover:border-red-700/30"
          >
            Выйти
          </button>
        </div>
      </div>

      {walletQuery.data && (
        <WalletDisplay wallet={walletQuery.data} />
      )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
