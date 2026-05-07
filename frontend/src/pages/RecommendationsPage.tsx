import { Layout } from '../shared/ui/Layout';
import { Card } from '../shared/ui/Card';

export function RecommendationsPage() {
  return (
    <Layout>
      <Card>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Рекомендации</h1>
        <p className="text-text-secondary">AI-анализ билдов и инвентаря</p>
      </Card>
    </Layout>
  );
}
