import { useState, useCallback, useEffect } from 'react';
import LandingApp from './landing/LandingApp';
import DiagramApp from './App.jsx';
import SharedCanvas from './components/SharedCanvas';
import useSceneStore from './stores/sceneStore';

const AppShell = () => {
  const [activeView, setActiveView] = useState('landing'); // 'landing' | 'diagram'
  const [spaceContext, setSpaceContext] = useState(null);
  const [trialMode, setTrialMode] = useState(false);

  const landingScene = useSceneStore((s) => s.landingScene);
  const diagramScene = useSceneStore((s) => s.diagramScene);
  const onDiagramPointerMissed = useSceneStore((s) => s.onDiagramPointerMissed);

  // Check URL on mount — if spaceId/space/code exists, go straight to diagram
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('spaceId') || params.get('space') || params.get('code')) {
      const urlSpaceType = params.get('type');
      const urlSpaceId = params.get('spaceId') || params.get('space');
      if (urlSpaceId && urlSpaceType) {
        setSpaceContext((prev) => prev || { spaceId: urlSpaceId, ownerId: null, spaceType: urlSpaceType });
      }
      setActiveView('diagram');
    }
  }, []);

  const handleOpenSpace = useCallback((spaceId, ownerId, spaceType = 'diagram') => {
    setSpaceContext({ spaceId, ownerId, spaceType });
    let newUrl = `${window.location.pathname}?spaceId=${encodeURIComponent(spaceId)}`;
    if (spaceType && spaceType !== 'diagram') {
      newUrl += `&type=${encodeURIComponent(spaceType)}`;
    }
    window.history.pushState({}, '', newUrl);
    setActiveView('diagram');
  }, []);

  const handleBackToLanding = useCallback(() => {
    window.history.pushState({}, '', window.location.pathname);
    window.isTrialMode = false;
    setTrialMode(false);
    setSpaceContext(null);
    setActiveView('landing');
  }, []);

  const handleTryWithoutAccount = useCallback(() => {
    window.isTrialMode = true;
    setTrialMode(true);
    setSpaceContext(null);
    setActiveView('diagram');
  }, []);

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
    <>
      <SharedCanvas
        onPointerMissed={activeView === 'diagram' ? onDiagramPointerMissed : undefined}
      >
        {activeView === 'landing' ? landingScene : diagramScene}
      </SharedCanvas>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        <div
          style={{
            opacity: activeView === 'landing' ? 1 : 0,
            pointerEvents: activeView === 'landing' ? 'auto' : 'none',
            transition: 'opacity 0.4s ease-in-out',
            position: 'absolute',
            inset: 0,
          }}
        >
          {activeView === 'landing' && (
            <LandingApp onOpenSpace={handleOpenSpace} onTryWithoutAccount={handleTryWithoutAccount} />
          )}
        </div>

        <div
          style={{
            opacity: activeView === 'diagram' ? 1 : 0,
            pointerEvents: activeView === 'diagram' ? 'auto' : 'none',
            transition: 'opacity 0.4s ease-in-out',
            position: 'absolute',
            inset: 0,
            zIndex: activeView === 'diagram' ? 1 : 0,
          }}
        >
          {activeView === 'diagram' && (
            <DiagramApp
              initialSpaceContext={spaceContext}
              onBackToLanding={handleBackToLanding}
              trialMode={trialMode}
              spaceType={spaceContext?.spaceType || 'diagram'}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AppShell;
