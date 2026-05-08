import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextValue {
  apiKey: string | null;
  setApiKey: (key: string, remember?: boolean) => void;
  clearApiKey: () => void;
  isRemembered: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GW2_KEY_SESSION = 'gw2_api_key';
const GW2_KEY_LOCAL = 'gw2_api_key_saved';
const GW2_REMEMBER_FLAG = 'gw2_api_key_remember';

function loadKey(): { key: string | null; remembered: boolean } {
  const remembered = localStorage.getItem(GW2_REMEMBER_FLAG) === 'true';
  if (remembered) {
    const saved = localStorage.getItem(GW2_KEY_LOCAL);
    if (saved) return { key: saved, remembered: true };
  }
  const session = sessionStorage.getItem(GW2_KEY_SESSION);
  return { key: session, remembered: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => loadKey().key);
  const [isRemembered, setIsRemembered] = useState(() => loadKey().remembered);

  const setApiKey = (key: string, remember?: boolean) => {
    sessionStorage.setItem(GW2_KEY_SESSION, key);
    if (remember) {
      localStorage.setItem(GW2_KEY_LOCAL, key);
      localStorage.setItem(GW2_REMEMBER_FLAG, 'true');
      setIsRemembered(true);
    } else {
      localStorage.removeItem(GW2_KEY_LOCAL);
      localStorage.removeItem(GW2_REMEMBER_FLAG);
      setIsRemembered(false);
    }
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    sessionStorage.removeItem(GW2_KEY_SESSION);
    localStorage.removeItem(GW2_KEY_LOCAL);
    localStorage.removeItem(GW2_REMEMBER_FLAG);
    setIsRemembered(false);
    setApiKeyState(null);
  };

  return (
    <AuthContext.Provider value={{ apiKey, setApiKey, clearApiKey, isRemembered }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
