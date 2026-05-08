import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Skeleton } from '../shared/ui/Skeleton';
import { CharacterTabs } from '../widgets/CharacterTabs';
import { CoinBadge } from '../widgets/PriceBadge/ui/PriceBadge';
import { useCharacterFull } from '../entities/character/api/getCharacters';
import { RUS_ATTRIBUTES } from '../widgets/ItemTooltip/lib/rusAttributes';
import type { FullSkill } from '../entities/character/model/types';

const RACE_RU: Record<string, string> = {
  Asura: 'Асура',
  Charr: 'Чарр',
  Human: 'Человек',
  Norn: 'Норн',
  Sylvari: 'Сильвари',
};

const GENDER_RU: Record<string, string> = {
  Male: 'Мужской',
  Female: 'Женский',
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

const CRAFTING_RU: Record<string, string> = {
  Armorsmith: 'Бронник',
  Artificer: 'Артефактор',
  Chef: 'Повар',
  Huntsman: 'Оружейник',
  Jeweler: 'Ювелир',
  Leatherworker: 'Кожевник',
  Scribe: 'Писец',
  Tailor: 'Закройщик',
  Weaponsmith: 'Кузнец',
};

function formatAge(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} дн. ${hours % 24} ч.`;
  return `${hours} ч.`;
}

function WalletSection({ wallet }: { wallet: { id: number; value: number; name?: string; icon?: string }[] }) {
  const sorted = [...wallet].sort((a, b) => (a.id === 1 ? -1 : b.id === 1 ? 1 : 0));
  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Кошелёк</h3>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {sorted.map(entry => {
          if (entry.id === 1) {
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

function SkillsSection({ skills }: { skills: Record<string, FullSkill> }) {
  const entries = Object.entries(skills);
  if (entries.length === 0) return null;

  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Навыки</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map(([slot, skill]) => (
          <div key={slot} className="flex items-start gap-3 bg-bg-secondary rounded-lg p-3 border border-border-primary">
            <img
              src={skill.icon}
              alt={skill.name}
              className="w-10 h-10 rounded-lg bg-bg-tertiary flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%236366f1"><rect width="40" height="40" rx="4"/><text x="20" y="24" text-anchor="middle" font-size="8" fill="white">?</text></svg>';
              }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{skill.name}</p>
              <p className="text-[11px] text-text-secondary capitalize">{skill.slot}</p>
              {skill.description && (
                <p className="text-[11px] text-text-tertiary mt-1 line-clamp-2">{skill.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CraftingSection({ crafting }: { crafting: { discipline: string; rating: number; active: boolean }[] }) {
  if (!crafting || crafting.length === 0) return null;

  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Ремёсла</h3>
      <div className="flex flex-wrap gap-3">
        {crafting.map((disc) => (
          <div
            key={disc.discipline}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
              disc.active
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'bg-bg-secondary border-border-primary text-text-secondary opacity-60'
            }`}
          >
            <span>{CRAFTING_RU[disc.discipline] || disc.discipline}</span>
            <span className="font-medium">{disc.rating}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CharacterPage() {
  const { name } = useParams<{ name: string }>();
  const { data, isLoading, isError, error } = useCharacterFull(name || '');

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-24 w-full mb-6 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <Card>
          <p className="text-red-400">
            {(error as any)?.response?.data?.detail || 'Ошибка загрузки персонажа'}
          </p>
        </Card>
      </Layout>
    );
  }

  const attrEntries = Object.entries(data.combined_stats || {})
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => {
      const order = ['Power', 'Precision', 'Toughness', 'Vitality', 'Ferocity', 'ConditionDamage', 'Expertise', 'Concentration', 'HealingPower', 'Healing', 'ConditionDuration', 'BoonDuration', 'AgonyResistance', 'Armor', 'Health', 'CritDamage'];
      return order.indexOf(a) - order.indexOf(b);
    });

  return (
    <Layout>
      <CharacterTabs name={name || ''} />

      <div className="flex items-start gap-6 mb-8">
        <div className="w-32 h-32 bg-[#1e212d] rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[#2d3246] flex-shrink-0">
          {PROFESSION_ICONS[data.profession] ? (
            <img src={PROFESSION_ICONS[data.profession]} alt={data.profession} className="w-full h-full object-contain" />
          ) : (
            <span className="text-4xl">?</span>
          )}
        </div>
        <div className="pt-2">
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
              {data.name}
            </span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {RACE_RU[data.race] || data.race}
            <span className="text-text-tertiary mx-1">•</span>
            {GENDER_RU[data.gender] || data.gender}
            <span className="text-text-tertiary mx-1">•</span>
            {PROFESSION_RU[data.profession] || data.profession}
            <span className="text-text-tertiary mx-1">•</span>
            Ур. {data.level}
          </p>
          <p className="text-text-tertiary text-xs mt-2">
            Времени сыграно: {formatAge(data.age)}
            {data.deaths != null && (
              <>
                <span className="mx-1">•</span>
                Смертей: {data.deaths}
              </>
            )}
            {data.title != null && data.title > 0 && (
              <>
                <span className="mx-1">•</span>
                Титул: {data.title}
              </>
            )}
          </p>
        </div>
      </div>

      {data.wallet && data.wallet.length > 0 && (
        <WalletSection wallet={data.wallet} />
      )}

      {attrEntries.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Характеристики</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {attrEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between px-3 py-2 bg-bg-secondary rounded-lg border border-border-primary">
                <span className="text-xs text-text-secondary">{RUS_ATTRIBUTES[key] || key}</span>
                <span className="text-sm font-medium text-indigo-300">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.skills && Object.keys(data.skills).length > 0 && (
        <SkillsSection skills={data.skills} />
      )}

      {data.crafting && data.crafting.length > 0 && (
        <CraftingSection crafting={data.crafting} />
      )}

      {data.specializations && data.specializations.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Специализации</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.specializations.map((spec) => (
              <div key={spec.id} className="bg-bg-secondary border border-border-primary rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-bg-tertiary">
                    <img src={spec.icon} alt={spec.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{spec.name}</p>
                    <p className="text-[11px] text-text-secondary">Черт: {spec.selected_traits.filter(Boolean).length}/{spec.traits.length}</p>
                  </div>
                </div>
                {spec.traits && spec.traits.length > 0 && (
                  <div className="space-y-1.5">
                    {spec.traits.map((trait) => {
                      const isSelected = spec.selected_traits?.includes(trait.id);
                      return (
                        <div
                          key={trait.id}
                          className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs ${
                            isSelected
                              ? 'bg-indigo-500/10 border border-indigo-500/20'
                              : 'bg-bg-tertiary/50 opacity-50'
                          }`}
                        >
                          <img
                            src={trait.icon}
                            alt={trait.name}
                            className="w-6 h-6 rounded flex-shrink-0 mt-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <p className="font-medium text-text-primary">{trait.name}</p>
                            {trait.description && (
                              <p className="text-[10px] text-text-tertiary line-clamp-2">{trait.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!data.specializations?.length && !Object.keys(data.skills || {}).length && !attrEntries.length && (
        <Card>
          <p className="text-text-secondary text-center py-8">Нет данных о характеристиках этого персонажа</p>
        </Card>
      )}
    </Layout>
  );
}