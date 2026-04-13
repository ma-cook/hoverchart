import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import LandingApp from './landing/LandingApp';

// Lazy load the heavy diagram app for code splitting
const DiagramApp = lazy(() => import('./App.jsx'));

const AppShell = () => {
  const [activeView, setActiveView] = useState('landing'); // 'landing' | 'diagram'
  const [spaceContext, setSpaceContext] = useState(null);
  const [trialMode, setTrialMode] = useState(false);

  // Check URL on mount — if spaceId/space/code exists, go straight to diagram
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('spaceId') || params.get('space') || params.get('code')) {
      // Restore spaceType from URL if available
      const urlSpaceType = params.get('type');
      const urlSpaceId = params.get('spaceId') || params.get('space');
      if (urlSpaceId && urlSpaceType) {
        setSpaceContext((prev) => prev || { spaceId: urlSpaceId, ownerId: null, spaceType: urlSpaceType });
      }
      setActiveView('diagram');
    }
  }, []);

  // Called by LandingApp when user clicks a space
  const handleOpenSpace = useCallback((spaceId, ownerId, spaceType = 'diagram') => {
    setSpaceContext({ spaceId, ownerId, spaceType });
    // Update URL without reload — include type if not default
    let newUrl = `${window.location.pathname}?spaceId=${encodeURIComponent(spaceId)}`;
    if (spaceType && spaceType !== 'diagram') {
      newUrl += `&type=${encodeURIComponent(spaceType)}`;
    }
    window.history.pushState({}, '', newUrl);
    setActiveView('diagram');
  }, []);

  // Called when user wants to go back to the platform page
  const handleBackToLanding = useCallback(() => {
    window.history.pushState({}, '', window.location.pathname);
    window.isTrialMode = false;
    setTrialMode(false);
    setSpaceContext(null);
    setActiveView('landing');
  }, []);

  // Called when user clicks "Try Without Account"
  const handleTryWithoutAccount = useCallback(() => {
    window.isTrialMode = true;
    setTrialMode(true);
    setSpaceContext(null);
    setActiveView('diagram');
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('spaceId') || params.get('space') || params.get('code')) {
        setActiveView('diagram');
      } else {
        setActiveView('landing');
        setSpaceContext(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Landing view */}
      <div
        style={{
          opacity: activeView === 'landing' ? 1 : 0,
          pointerEvents: activeView === 'landing' ? 'auto' : 'none',
          transition: 'opacity 0.4s ease-in-out',
          position: 'absolute',
          inset: 0,
          zIndex: activeView === 'landing' ? 1 : 0,
        }}
      >
        {activeView === 'landing' && (
          <LandingApp onOpenSpace={handleOpenSpace} onTryWithoutAccount={handleTryWithoutAccount} />
        )}
      </div>

      {/* Diagram view */}
      {activeView === 'diagram' && (
        <Suspense fallback={<div className="loading">Loading diagram...</div>}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
            }}
          >
            <DiagramApp
              initialSpaceContext={spaceContext}
              onBackToLanding={handleBackToLanding}
              trialMode={trialMode}
              spaceType={spaceContext?.spaceType || 'diagram'}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
};

export default AppShell;
