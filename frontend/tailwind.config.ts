/** @type {import('tailwindcss').Config} */
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
        tooltip: 'var(--tooltip-shadow)',
      },
    },
  },
  plugins: [],
};
