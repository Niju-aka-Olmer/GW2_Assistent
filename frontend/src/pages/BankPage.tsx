import { useParams, Navigate } from 'react-router-dom';

export function BankPage() {
  const { name } = useParams<{ name: string }>();
  if (!name) return null;
  return <Navigate to={`/inventory/${encodeURIComponent(name)}?tab=bank`} replace />;
}
