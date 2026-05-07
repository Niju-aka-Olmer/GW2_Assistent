import clsx from 'clsx';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterState {
  search: string;
  rarity: string[];
  type: string[];
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  rarity: string[];
  onRarityChange: (value: string[]) => void;
  type: string[];
  onTypeChange: (value: string[]) => void;
  rarityOptions: FilterOption[];
  typeOptions: FilterOption[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

function FilterChip({
  label,
  active,
  colorClass,
  onClick,
}: {
  label: string;
  active: boolean;
  colorClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-2.5 py-1 text-xs font-medium rounded-full border transition-all',
        active
          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
          : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover',
        colorClass && active && colorClass,
      )}
    >
      {label}
    </button>
  );
}

export function FilterBar({
  search,
  onSearchChange,
  rarity,
  onRarityChange,
  type,
  onTypeChange,
  rarityOptions,
  typeOptions,
  onReset,
  hasActiveFilters,
}: FilterBarProps) {
  const toggleRarity = (value: string) => {
    if (rarity.includes(value)) {
      onRarityChange(rarity.filter(r => r !== value));
    } else {
      onRarityChange([...rarity, value]);
    }
  };

  const toggleType = (value: string) => {
    if (type.includes(value)) {
      onTypeChange(type.filter(t => t !== value));
    } else {
      onTypeChange([...type, value]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск предметов..."
          className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div>
        <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5">Редкость</p>
        <div className="flex flex-wrap gap-1.5">
          {rarityOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={rarity.includes(opt.value)}
              onClick={() => toggleRarity(opt.value)}
            />
          ))}
        </div>
      </div>

      {typeOptions.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5">Тип</p>
          <div className="flex flex-wrap gap-1.5">
            {typeOptions.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={type.includes(opt.value)}
                onClick={() => toggleType(opt.value)}
              />
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
