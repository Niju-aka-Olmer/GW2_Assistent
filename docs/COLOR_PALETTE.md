# GW2 Assistant — Color Palette

## Тёмная тема (Dark Theme) — по умолчанию

```css
:root[data-theme="dark"] {
  /* Фоны */
  --bg-primary: #0f1117;          /* Основной фон страницы */
  --bg-secondary: #1a1d28;        /* Фон карточек, панелей */
  --bg-tertiary: #242838;         /* Фон элементов внутри карточек */
  --bg-elevated: #2d3246;         /* Фон модальных окон, тултипов */
  --bg-hover: #363b52;            /* Ховер элементов */

  /* Текст */
  --text-primary: #e8eaf0;        /* Основной текст */
  --text-secondary: #9ca3b4;      /* Вторичный текст (подписи) */
  --text-tertiary: #6b7284;       /* Третичный текст (метаданные) */
  --text-muted: #4b5164;          /* Затемнённый текст (плейсхолдеры) */

  /* Границы */
  --border-primary: #2d3246;      /* Основные границы */
  --border-secondary: #363b52;    /* Вторичные границы */
  --border-focus: #6366f1;        /* Фокус на инпутах */

  /* Акценты — цвета редкости GW2 */
  --rarity-junk: #6b7284;         /* Мусор — серый */
  --rarity-basic: #d1d5db;        /* Обычный — светло-серый */
  --rarity-fine: #60a5fa;         /* Необычный — синий */
  --rarity-masterwork: #4ade80;   /* Качественный — зелёный */
  --rarity-rare: #facc15;         /* Редкий — жёлтый */
  --rarity-exotic: #fb923c;       /* Экзотический — оранжевый */
  --rarity-ascended: #c084fc;     /* Возвышенный — фиолетовый */
  --rarity-legendary: #f87171;    /* Легендарный — красный */

  /* Функциональные цвета */
  --color-primary: #6366f1;       /* Основной акцент (indigo-500) */
  --color-primary-hover: #818cf8; /* Indigo-400 */
  --color-success: #22c55e;       /* Успех — зелёный */
  --color-warning: #eab308;       /* Предупреждение — жёлтый */
  --color-error: #ef4444;         /* Ошибка — красный */
  --color-info: #3b82f6;          /* Информация — синий */

  /* Цена */
  --coin-gold: #facc15;           /* Золото */
  --coin-silver: #94a3b8;         /* Серебро */
  --coin-copper: #d97706;         /* Медь */

  /* Тултип */
  --tooltip-bg: #1a1d28;          /* Фон тултипа */
  --tooltip-border: #363b52;      /* Граница тултипа */
  --tooltip-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
```

## Светлая тема (Light Theme)

```css
:root[data-theme="light"] {
  /* Фоны */
  --bg-primary: #f8f9fc;          /* Основной фон страницы */
  --bg-secondary: #ffffff;         /* Фон карточек, панелей */
  --bg-tertiary: #f1f3f8;         /* Фон элементов внутри карточек */
  --bg-elevated: #ffffff;          /* Фон модальных окон, тултипов */
  --bg-hover: #e5e8f0;            /* Ховер элементов */

  /* Текст */
  --text-primary: #111827;         /* Основной текст */
  --text-secondary: #4b5563;       /* Вторичный текст (подписи) */
  --text-tertiary: #6b7280;        /* Третичный текст (метаданные) */
  --text-muted: #9ca3af;           /* Затемнённый текст (плейсхолдеры) */

  /* Границы */
  --border-primary: #e5e7eb;       /* Основные границы */
  --border-secondary: #d1d5db;     /* Вторичные границы */
  --border-focus: #6366f1;         /* Фокус на инпутах */

  /* Акценты — цвета редкости GW2 */
  --rarity-junk: #9ca3af;          /* Мусор — серый */
  --rarity-basic: #6b7280;         /* Обычный — серый */
  --rarity-fine: #2563eb;          /* Необычный — синий */
  --rarity-masterwork: #16a34a;    /* Качественный — зелёный */
  --rarity-rare: #ca8a04;          /* Редкий — жёлтый */
  --rarity-exotic: #ea580c;        /* Экзотический — оранжевый */
  --rarity-ascended: #9333ea;      /* Возвышенный — фиолетовый */
  --rarity-legendary: #dc2626;     /* Легендарный — красный */

  /* Функциональные цвета */
  --color-primary: #6366f1;        /* Основной акцент (indigo-500) */
  --color-primary-hover: #4f46e5;  /* Indigo-600 */
  --color-success: #16a34a;        /* Успех — зелёный */
  --color-warning: #ca8a04;        /* Предупреждение — жёлтый */
  --color-error: #dc2626;          /* Ошибка — красный */
  --color-info: #2563eb;           /* Информация — синий */

  /* Цена */
  --coin-gold: #ca8a04;            /* Золото */
  --coin-silver: #64748b;          /* Серебро */
  --coin-copper: #d97706;          /* Медь */

  /* Тултип */
  --tooltip-bg: #ffffff;           /* Фон тултипа */
  --tooltip-border: #e5e7eb;       /* Граница тултипа */
  --tooltip-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
```

## Tailwind CSS конфигурация

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
        },
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          focus: 'var(--border-focus)',
        },
        rarity: {
          junk: 'var(--rarity-junk)',
          basic: 'var(--rarity-basic)',
          fine: 'var(--rarity-fine)',
          masterwork: 'var(--rarity-masterwork)',
          rare: 'var(--rarity-rare)',
          exotic: 'var(--rarity-exotic)',
          ascended: 'var(--rarity-ascended)',
          legendary: 'var(--rarity-legendary)',
        },
        coin: {
          gold: 'var(--coin-gold)',
          silver: 'var(--coin-silver)',
          copper: 'var(--coin-copper)',
        },
      },
      boxShadow: {
        'tooltip': 'var(--tooltip-shadow)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## Пример использования

```tsx
// src/shared/ui/Card.tsx
export function Card({ children, className }: Props) {
  return (
    <div className={clsx(
      'bg-bg-secondary border border-border-primary rounded-lg p-4',
      'shadow-sm hover:shadow-md transition-shadow',
      className,
    )}>
      {children}
    </div>
  );
}
```

```tsx
// ItemCard с цветом редкости
export function ItemCard({ item }: { item: Item }) {
  const borderColor = {
    Legendary: 'border-rarity-legendary',
    Ascended: 'border-rarity-ascended',
    Exotic: 'border-rarity-exotic',
    Rare: 'border-rarity-rare',
    Masterwork: 'border-rarity-masterwork',
    Fine: 'border-rarity-fine',
    Basic: 'border-rarity-basic',
    Junk: 'border-rarity-junk',
  }[item.rarity] || 'border-border-primary';

  return (
    <div className={`w-14 h-14 rounded-lg border-2 ${borderColor} bg-bg-tertiary`}>
      <img src={item.icon} alt={item.name} className="w-full h-full object-contain p-0.5" />
    </div>
  );
}
```
