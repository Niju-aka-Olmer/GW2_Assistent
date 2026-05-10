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
  return '';
}

export function CharacterTabs({ name }: CharacterTabsProps) {
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);

  return (
    <div className="flex gap-1 mb-4 border-b border-border-primary pb-2">
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
