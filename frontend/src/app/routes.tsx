import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CharacterSelectPage } from '../pages/CharacterSelectPage';
import { BuildPage } from '../pages/BuildPage';
import { InventoryPage } from '../pages/InventoryPage';
import { RecommendationsPage } from '../pages/RecommendationsPage';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<CharacterSelectPage />} />
          <Route path="/build/:name" element={<BuildPage />} />
          <Route path="/inventory/:name" element={<InventoryPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
