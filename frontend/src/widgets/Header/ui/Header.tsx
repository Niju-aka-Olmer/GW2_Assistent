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
    <header className="relative bg-gradient-to-r from-[#0d0d14] via-[#15171f] to-[#0d0d14] border-b border-[#c9a84c]/20 shadow-lg shadow-black/30">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(201,168,76,0.03)_50%,transparent_100%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
      <div className="relative max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-xl font-bold tracking-wide"
          >
            <span className="bg-gradient-to-r from-[#f3c623] via-[#c9a84c] to-[#a68a3c] bg-clip-text text-transparent">
              GW2 Assistant
            </span>
          </Link>
          {apiKey && (
            <nav className="flex gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-sm transition-all relative',
                    location.pathname === link.to
                      ? 'text-[#f3c623] bg-[#c9a84c]/10'
                      : 'text-[#9ca3b4] hover:text-[#c9a84c] hover:bg-[#c9a84c]/5',
                  )}
                >
                  {link.label}
                  {location.pathname === link.to && (
                    <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {apiKey && (
            <button
              onClick={clearApiKey}
              className="text-xs text-text-tertiary hover:text-[#e74c3c] transition-colors px-2 py-1 rounded border border-transparent hover:border-red-700/30"
            >
              Выйти
            </button>
          )}
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-md bg-[#1e212d] text-text-secondary hover:text-[#c9a84c] hover:bg-[#282c3b] transition-all text-sm border border-[#2d3246] hover:border-[#c9a84c]/30"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
