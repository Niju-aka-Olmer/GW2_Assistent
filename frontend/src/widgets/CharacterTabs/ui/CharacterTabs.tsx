import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface CharacterTabsProps {
  name: string;
}

const TABS = [
  { path: (name: string) => `/character/${encodeURIComponent(name)}`, label: 'Персонаж' },
  { path: (name: string) => `/achievements/${encodeURIComponent(name)}`, label: 'Достижения' },
  { path: (name: string) => `/raids/${encodeURIComponent(name)}`, label: 'Рейды' },
  { path: (name: string) => `/masteries/${encodeURIComponent(name)}`, label: 'Мастерство' },
  { path: (name: string) => `/collections/${encodeURIComponent(name)}`, label: 'Коллекции' },
  { path: (name: string) => `/build/${encodeURIComponent(name)}`, label: 'Экипировка' },
  { path: (name: string) => `/inventory/${encodeURIComponent(name)}`, label: 'Инвентарь' },
  { path: (name: string) => `/materials/${encodeURIComponent(name)}`, label: 'Материалы' },
  { path: (name: string) => `/legendary-armory/${encodeURIComponent(name)}`, label: 'Легендарки' },
  { path: (name: string) => `/dungeons/${encodeURIComponent(name)}`, label: 'Данжи' },
  { path: (name: string) => `/world-bosses/${encodeURIComponent(name)}`, label: 'Боссы' },
  { path: (name: string) => `/account-value/${encodeURIComponent(name)}`, label: 'Ценность' },
  { path: (name: string) => `/home/${encodeURIComponent(name)}`, label: 'Дом' },
  { path: (name: string) => `/guild/${encodeURIComponent(name)}`, label: 'Гильдия' },
  { path: (name: string) => `/pvp/${encodeURIComponent(name)}`, label: 'PvP' },
  { path: (name: string) => `/wvw/${encodeURIComponent(name)}`, label: 'WvW' },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith('/character')) return 'Персонаж';
  if (pathname.startsWith('/achievements')) return 'Достижения';
  if (pathname.startsWith('/raids')) return 'Рейды';
  if (pathname.startsWith('/masteries')) return 'Мастерство';
  if (pathname.startsWith('/collections')) return 'Коллекции';
  if (pathname.startsWith('/build')) return 'Экипировка';
  if (pathname.startsWith('/inventory')) return 'Инвентарь';
  if (pathname.startsWith('/materials')) return 'Материалы';
  if (pathname.startsWith('/legendary-armory')) return 'Легендарки';
  if (pathname.startsWith('/dungeons')) return 'Данжи';
  if (pathname.startsWith('/world-bosses')) return 'Боссы';
  if (pathname.startsWith('/account-value')) return 'Ценность';
  if (pathname.startsWith('/home')) return 'Дом';
  if (pathname.startsWith('/guild')) return 'Гильдия';
  if (pathname.startsWith('/pvp')) return 'PvP';
  if (pathname.startsWith('/wvw')) return 'WvW';
  return '';
}

export function CharacterTabs({ name }: CharacterTabsProps) {
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);

  return (
    <div className="flex gap-1 mb-4 border-b border-border-primary pb-2 overflow-x-auto whitespace-nowrap">
      {TABS.map((tab) => {
        const isActive = tab.label === activeTab;
        return (
          <Link
            key={tab.label}
            to={tab.path(name)}
            className={clsx(
              'px-4 py-2 rounded-t-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-bg-tertiary text-text-primary border-b-2 border-indigo-500'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
