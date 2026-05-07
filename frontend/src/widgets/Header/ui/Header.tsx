import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../../app/providers/ThemeProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import clsx from 'clsx';

const navLinks = [
  { to: '/', label: 'Персонажи' },
  { to: '/recommendations', label: 'Рекомендации' },
];

export function Header() {
  const { theme, toggle } = useTheme();
  const { apiKey, clearApiKey } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-bg-secondary border-b border-border-primary px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-text-primary">
            GW2 Assistant
          </Link>
          {apiKey && (
            <nav className="flex gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-sm transition-colors',
                    location.pathname === link.to
                      ? 'bg-bg-tertiary text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {apiKey && (
            <button
              onClick={clearApiKey}
              className="text-xs text-text-tertiary hover:text-red-400 transition-colors"
            >
              Выйти
            </button>
          )}
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-md bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors text-sm"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
