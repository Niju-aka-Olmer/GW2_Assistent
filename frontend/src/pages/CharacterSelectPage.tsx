import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';
import { Input } from '../shared/ui/Input';
import { Button } from '../shared/ui/Button';
import { useAuth } from '../app/providers/AuthProvider';
import { useState } from 'react';

export function CharacterSelectPage() {
  const { apiKey, setApiKey } = useAuth();
  const [keyInput, setKeyInput] = useState('');

  if (!apiKey) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <h1 className="text-2xl font-bold text-text-primary mb-2">GW2 Assistant</h1>
            <p className="text-text-secondary text-sm mb-6">
              Введите API-ключ Guild Wars 2 для начала работы
            </p>
            <div className="space-y-4">
              <Input
                label="API Key"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <Button
                className="w-full"
                size="lg"
                disabled={!keyInput.trim()}
                onClick={() => setApiKey(keyInput.trim())}
              >
                Подключиться
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Мои персонажи</h1>
      <p className="text-text-secondary">Загрузка персонажей...</p>
    </Layout>
  );
}
