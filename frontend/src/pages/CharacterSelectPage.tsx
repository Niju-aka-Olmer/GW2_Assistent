import { Link } from 'react-router-dom';
import { useCharacters } from '../entities/character/api/getCharacters';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { SkeletonGrid } from '../shared/ui/Skeleton';
import { CoinBadge } from '../widgets/PriceBadge/ui/PriceBadge';
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
  const renderUrl = `/api/characters/${encodeURIComponent(character.name)}/render?api_key=${encodeURIComponent(sessionStorage.getItem('gw2_api_key') || '')}`;

  return (
    <Link
      to={`/characters/${encodeURIComponent(character.name)}/build`}
      className="block group"
    >
      <Card className="flex flex-col items-center text-center p-4 transition-all hover:scale-[1.02] hover:shadow-xl">
        <div className="relative w-32 h-64 bg-bg-tertiary rounded-lg overflow-hidden mb-3 flex items-center justify-center">
          {character.name ? (
            <img
              src={renderUrl}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.fallback-render');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className="fallback-render w-full h-full flex items-center justify-center bg-bg-tertiary" style={{ display: character.name ? 'none' : 'flex' }}>
            <span className="text-4xl opacity-30">
              {PROFESSION_ICONS[character.profession] ? (
                <img src={PROFESSION_ICONS[character.profession]} alt={character.profession} className="w-16 h-16 opacity-30" />
              ) : '?'}
            </span>
          </div>
        </div>

        <h2 className="font-bold text-lg text-text-primary group-hover:text-indigo-400 transition-colors">
          {character.name}
        </h2>

        <p className="text-sm text-text-secondary mt-1">
          {RACE_RU[character.race] || character.race}
        </p>

        <p className="text-sm text-text-secondary">
          {PROFESSION_RU[character.profession] || character.profession}
          <span className="text-text-tertiary ml-1">• Ур. {character.level}</span>
        </p>

        {character.coins > 0 && (
          <div className="mt-2 pt-2 border-t border-border-primary w-full flex items-center justify-center">
            <CoinBadge value={character.coins} />
          </div>
        )}
      </Card>
    </Link>
  );
}

export function CharacterSelectPage() {
  const { data, isLoading, isError, error } = useCharacters();

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Выберите персонажа</h1>

      {isLoading && <SkeletonGrid count={6} />}

      {isError && (
        <Card>
          <p className="text-red-400">Ошибка загрузки персонажей</p>
          <p className="text-sm text-text-secondary mt-1">
            {(error as any)?.response?.data?.detail || String(error)}
          </p>
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
