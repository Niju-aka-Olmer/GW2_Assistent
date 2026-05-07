import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';

export function InventoryPage() {
  const { name } = useParams<{ name: string }>();

  return (
    <Layout>
      <Card>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Инвентарь: {name}</h1>
        <p className="text-text-secondary">Здесь будет отображаться инвентарь персонажа</p>
      </Card>
    </Layout>
  );
}
