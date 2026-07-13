import React, { useCallback } from 'react';
import { useDiagramStore } from '../stores/useDiagramStore';

export function LandingTopBar({ onNavigate }) {
  const serialisedGraphData = useDiagramStore((s) => s.serialisedGraphData);
  const hasDiagram = !!serialisedGraphData;

  const handleTo2D = useCallback(() => {
    if (onNavigate) onNavigate('2d');
  }, [onNavigate]);

  const handleRepoAnalysis = useCallback(() => {
    if (onNavigate) onNavigate('repo-analysis');
  }, [onNavigate]);

  return (
    <div className="landing-top-bar">
      <button
        className="top-bar-btn"
        disabled={!hasDiagram}
        style={{ opacity: hasDiagram ? 1 : 0.4, pointerEvents: hasDiagram ? 'auto' : 'none' }}
        onClick={handleTo2D}
      >
        2D Diagram
      </button>
      <button
        className="top-bar-btn"
        disabled={!hasDiagram}
        style={{ opacity: hasDiagram ? 1 : 0.4, pointerEvents: hasDiagram ? 'auto' : 'none' }}
        onClick={handleRepoAnalysis}
      >
        Repository Analysis
      </button>
    </div>
  );
}