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
        gw2: {
          gold: 'var(--gw2-gold)',
          'gold-bright': 'var(--gw2-gold-bright)',
          'gold-dim': 'var(--gw2-gold-dim)',
          red: 'var(--gw2-red)',
          'red-bright': 'var(--gw2-red-bright)',
          blue: 'var(--gw2-blue)',
          green: 'var(--gw2-green)',
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
