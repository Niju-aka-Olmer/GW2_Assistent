import { Link } from 'react-router-dom';
import { useTheme } from '../../app/providers/ThemeProvider';

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="bg-bg-secondary border-b border-border-primary px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-text-primary">
            GW2 Assistant
          </Link>
          <nav className="flex gap-4 text-sm text-text-secondary">
            <Link to="/" className="hover:text-text-primary transition-colors">
              Персонажи
            </Link>
          </nav>
        </div>
        <button
          onClick={toggle}
          className="px-3 py-1.5 rounded-md bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors text-sm"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
