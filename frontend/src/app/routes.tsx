import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>GW2 Assistant</div>} />
      </Routes>
    </BrowserRouter>
  );
}
