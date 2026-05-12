import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CharacterSelectPage } from '../pages/CharacterSelectPage';
import { CharacterPage } from '../pages/CharacterPage';
import { BuildPage } from '../pages/BuildPage';
import { InventoryPage } from '../pages/InventoryPage';
import { RecommendationsPage } from '../pages/RecommendationsPage';
import { TradingPostPage } from '../pages/TradingPostPage';
import { CharacterAchievementsPage } from '../pages/CharacterAchievementsPage';
import { CharacterRaidsPage } from '../pages/CharacterRaidsPage';
import { CharacterMasteriesPage } from '../pages/CharacterMasteriesPage';
import { CharacterCollectionsPage } from '../pages/CharacterCollectionsPage';
import { ReferencePage } from '../pages/ReferencePage';
import { WizardVaultPage } from '../pages/WizardVaultPage';
import { AccountValuePage } from '../pages/AccountValuePage';
import { PvEPage } from '../pages/PvEPage';
import { HomeGuildPage } from '../pages/HomeGuildPage';
import { CompetitivePage } from '../pages/CompetitivePage';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<CharacterSelectPage />} />
          <Route path="/character/:name" element={<CharacterPage />} />
          <Route path="/achievements/:name" element={<CharacterAchievementsPage />} />
          <Route path="/raids/:name" element={<CharacterRaidsPage />} />
          <Route path="/masteries/:name" element={<CharacterMasteriesPage />} />
          <Route path="/collections/:name" element={<CharacterCollectionsPage />} />
          <Route path="/build/:name" element={<BuildPage />} />
          <Route path="/inventory/:name" element={<InventoryPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/trading-post" element={<TradingPostPage />} />
          <Route path="/reference" element={<ReferencePage />} />
          <Route path="/wizards-vault" element={<WizardVaultPage />} />
          <Route path="/account-value/:name" element={<AccountValuePage />} />
          <Route path="/pve/:name" element={<PvEPage />} />
          <Route path="/home-guild/:name" element={<HomeGuildPage />} />
          <Route path="/competitive/:name" element={<CompetitivePage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
