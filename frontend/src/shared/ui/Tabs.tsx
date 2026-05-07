import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border-primary gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-indigo-400'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
