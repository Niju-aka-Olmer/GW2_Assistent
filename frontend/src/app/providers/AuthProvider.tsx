import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextValue {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(
    () => sessionStorage.getItem('gw2_api_key'),
  );

  const setApiKey = (key: string) => {
    sessionStorage.setItem('gw2_api_key', key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    sessionStorage.removeItem('gw2_api_key');
    setApiKeyState(null);
  };

  return (
    <AuthContext.Provider value={{ apiKey, setApiKey, clearApiKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
