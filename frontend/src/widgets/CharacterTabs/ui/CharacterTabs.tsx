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
  { path: (name: string) => `/pve/${encodeURIComponent(name)}`, label: 'PvE' },
  { path: (name: string) => `/home-guild/${encodeURIComponent(name)}`, label: 'Дом+Гильдия' },
  { path: (name: string) => `/competitive/${encodeURIComponent(name)}`, label: 'PvP+WvW' },
  { path: (name: string) => `/account-value/${encodeURIComponent(name)}`, label: 'Ценность' },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith('/character')) return 'Персонаж';
  if (pathname.startsWith('/achievements')) return 'Достижения';
  if (pathname.startsWith('/raids')) return 'Рейды';
  if (pathname.startsWith('/masteries')) return 'Мастерство';
  if (pathname.startsWith('/collections')) return 'Коллекции';
  if (pathname.startsWith('/build')) return 'Экипировка';
  if (pathname.startsWith('/inventory')) return 'Инвентарь';
  if (pathname.startsWith('/pve')) return 'PvE';
  if (pathname.startsWith('/home-guild')) return 'Дом+Гильдия';
  if (pathname.startsWith('/competitive')) return 'PvP+WvW';
  if (pathname.startsWith('/account-value')) return 'Ценность';
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
