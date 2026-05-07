import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface CharacterTabsProps {
  name: string;
}

const TABS = [
  { path: (name: string) => `/build/${encodeURIComponent(name)}`, label: 'Экипировка' },
  { path: (name: string) => `/inventory/${encodeURIComponent(name)}`, label: 'Инвентарь' },
  { path: (name: string) => `/bank/${encodeURIComponent(name)}`, label: 'Банк' },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith('/build')) return 'Экипировка';
  if (pathname.startsWith('/inventory')) return 'Инвентарь';
  if (pathname.startsWith('/bank')) return 'Банк';
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
