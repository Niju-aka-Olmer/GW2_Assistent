import { useParams } from 'react-router-dom';
import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';

export function BuildPage() {
  const { name } = useParams<{ name: string }>();

  return (
    <Layout>
      <Card>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Билд: {name}</h1>
        <p className="text-text-secondary">Здесь будет отображаться билд персонажа</p>
      </Card>
    </Layout>
  );
}
