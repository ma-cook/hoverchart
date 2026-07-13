import React, { useState, useCallback } from 'react';
import { LandingTopBar } from './LandingTopBar';
import { DiagramOverlay2D } from './DiagramOverlay2D';
import { RepoAnalysisOverlay } from './RepoAnalysisOverlay';

export function AppShell() {
  const [activeOverlay, setActiveOverlay] = useState(null);

  const handleNavigate = useCallback((target) => {
    setActiveOverlay(target);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  return (
    <div className="app-shell">
      <LandingTopBar onNavigate={handleNavigate} />
      <main className="app-content">
        {/* Other main content */}
      </main>
      {activeOverlay === '2d' && <DiagramOverlay2D onClose={handleCloseOverlay} />}
      {activeOverlay === 'repo-analysis' && <RepoAnalysisOverlay onClose={handleCloseOverlay} />}
    </div>
  );
}