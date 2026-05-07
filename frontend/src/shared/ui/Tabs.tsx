import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'default' | 'gw2';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default' }: TabsProps) {
  return (
    <div className={clsx(
      'flex gap-1',
      variant === 'gw2'
        ? 'border-b border-[#c9a84c]/20'
        : 'border-b border-border-primary',
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium transition-all relative',
            variant === 'gw2'
              ? activeTab === tab.id
                ? 'text-[#f3c623]'
                : 'text-text-secondary hover:text-[#c9a84c]'
              : activeTab === tab.id
                ? 'text-indigo-400'
                : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className={clsx(
              'absolute bottom-0 left-0 right-0 h-0.5 rounded-full',
              variant === 'gw2'
                ? 'bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent'
                : 'bg-indigo-500',
            )} />
          )}
        </button>
      ))}
    </div>
  );
}
