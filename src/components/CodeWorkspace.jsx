import { useEffect, useCallback, useRef, useState } from 'react';
import useCodeStore from '../stores/codeStore';
import { useObjectsStore } from '../stores';
import { getCodeForObject, resolveCodeInfo, ensureObjectCodeAvailable } from '../services/objectCodeService';
import {
  SPACE_CHAT_DEFAULT_WIDTH,
  SPACE_CHAT_DEFAULT_HEIGHT,
  SPACE_CHAT_MIN_WIDTH,
  SPACE_CHAT_MIN_HEIGHT,
  CHAT_BOUNDS_LEFT,
  CHAT_BOUNDS_TOP,
  CHAT_BOUNDS_MARGIN,
} from './SpaceChat';

const LANGUAGE_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cs: 'csharp', php: 'php', cpp: 'cpp', c: 'c', h: 'c',
  css: 'css', scss: 'scss', html: 'html', json: 'json', md: 'markdown',
  yml: 'yaml', yaml: 'yaml', sql: 'sql', sh: 'bash', bash: 'bash',
};

function getLanguage(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase();
  return LANGUAGE_MAP[ext] || ext || 'text';
}

const DEFAULT_WINDOW_LAYOUT = {
  x: CHAT_BOUNDS_LEFT,
  y: CHAT_BOUNDS_TOP,
  width: SPACE_CHAT_DEFAULT_WIDTH,
  height: SPACE_CHAT_DEFAULT_HEIGHT,
};

const CodeWindow = ({ windowId, objectId, zIndex, repo, commitSha }) => {
  const layout = useCodeStore((s) => s.codeWindowLayouts?.[windowId]);
  const setCodeWindowLayout = useCodeStore((s) => s.setCodeWindowLayout);
  const closeCodeWindow = useCodeStore((s) => s.closeCodeWindow);
  const followActiveConnectionId = useCodeStore((s) => s.followActiveConnectionId);

  const currentLayout = layout && layout.x != null && layout.y != null
    ? layout
    : DEFAULT_WINDOW_LAYOUT;
  const currentLayoutRef = useRef(currentLayout);
  currentLayoutRef.current = currentLayout;

  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => {
      const cl = currentLayoutRef.current;
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      const minX = CHAT_BOUNDS_LEFT;
      const minY = CHAT_BOUNDS_TOP;
      const maxX = Math.max(minX, window.innerWidth - CHAT_BOUNDS_MARGIN - cl.width);
      const maxY = Math.max(minY, window.innerHeight - CHAT_BOUNDS_MARGIN - cl.height);
      setCodeWindowLayout(windowId, {
        ...cl,
        x: Math.min(maxX, Math.max(minX, dragging.startLeft + dx)),
        y: Math.min(maxY, Math.max(minY, dragging.startTop + dy)),
      });
    };
    const handleUp = () => setDragging(null);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, setCodeWindowLayout, windowId]);

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e) => {
      const cl = currentLayoutRef.current;
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      const next = { ...cl };
      const maxW = Math.max(SPACE_CHAT_MIN_WIDTH, window.innerWidth - CHAT_BOUNDS_MARGIN - cl.x);
      const maxH = Math.max(SPACE_CHAT_MIN_HEIGHT, window.innerHeight - CHAT_BOUNDS_MARGIN - cl.y);
      if (resizing.edge === 'right' || resizing.edge === 'corner') {
        next.width = Math.min(maxW, Math.max(SPACE_CHAT_MIN_WIDTH, resizing.startWidth + dx));
      }
      if (resizing.edge === 'left') {
        const maxNewX = resizing.startLeft + resizing.startWidth - SPACE_CHAT_MIN_WIDTH;
        const newX = Math.min(maxNewX, Math.max(CHAT_BOUNDS_LEFT, resizing.startLeft + dx));
        next.x = newX;
        next.width = resizing.startLeft + resizing.startWidth - newX;
      }
      if (resizing.edge === 'bottom' || resizing.edge === 'corner') {
        next.height = Math.min(maxH, Math.max(SPACE_CHAT_MIN_HEIGHT, resizing.startHeight + dy));
      }
      setCodeWindowLayout(windowId, next);
    };
    const handleUp = () => setResizing(null);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [resizing, setCodeWindowLayout, windowId]);

  const handleResizeStart = (edge, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentLayout.width,
      startHeight: currentLayout.height,
      startLeft: currentLayout.x,
    });
  };

  const handleDragStart = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    setDragging({
      startX: e.clientX,
      startY: e.clientY,
      startLeft: currentLayout.x,
      startTop: currentLayout.y,
    });
  };

  const objectData = useObjectsStore(
    useCallback(
      (state) => state.objects?.find((o) => o.id === objectId) || null,
      [objectId]
    )
  );

  const repoFileContents = useCodeStore((s) => s.repoFileContents);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadState, setLoadState] = useState({ loading: false, error: null });

  const codeInfo = resolveCodeInfo(objectData);
  const filePath = codeInfo.filePath || '';
  const code = getCodeForObject(objectData);

  useEffect(() => {
    if (!objectData || code != null || !filePath) {
      setLoadState({ loading: false, error: null });
      return;
    }
    let active = true;
    setLoadState({ loading: true, error: null });
    ensureObjectCodeAvailable(objectData, { repo, commitSha })
      .then(() => {
        if (active) setLoadState({ loading: false, error: null });
      })
      .catch((err) => {
        if (active) setLoadState({ loading: false, error: err?.message || 'Failed to load code' });
      });
    return () => {
      active = false;
    };
  }, [objectData, code, filePath, repo, commitSha, loadAttempt, repoFileContents]);

  const language = objectData?.metadata?.language || getLanguage(filePath);
  const title =
    objectData?.headerText ||
    objectData?.merfolkData?.nodeId ||
    objectData?.id ||
    'Code';
  const showLoading = code == null && !!filePath && !loadState.error;

  // Try to find relationship highlight range from active follow connection
  const [highlightRange, setHighlightRange] = useState(null);
  useEffect(() => {
    setHighlightRange(null);
    if (!followActiveConnectionId || !objectData) return;
    try {
      const connStore = require('../stores/connectionStore').default;
      const conn = connStore.getState().connections?.find((c) => String(c.id) === String(followActiveConnectionId));
      if (!conn) return;
      const connObjId = conn.start?.objectId || conn.start?.cube?.id || conn.start?.id;
      const connObjId2 = conn.end?.objectId || conn.end?.cube?.id || conn.end?.id;
      if (String(connObjId) !== String(objectId) && String(connObjId2) !== String(objectId)) return;
      const md = conn.merfolkData || {};
      const relStart = md.relStartLine || md.relationshipStartLine || md.startLine;
      const relEnd = md.relEndLine || md.relationshipEndLine || md.endLine;
      const relFile = md.relFilePath || md.relationshipFilePath || md.codeFilePath;
      if (relFile && filePath && relFile !== filePath) return;
      if (relStart != null && relEnd != null) {
        setHighlightRange({ start: Number(relStart), end: Number(relEnd) });
      }
    } catch {}
  }, [followActiveConnectionId, objectId, objectData, filePath]);

  return (
    <div
      className="space-chat-window code-window"
      onClick={(e) => e.stopPropagation()}
      style={{
        width: currentLayout.width,
        height: currentLayout.height,
        left: currentLayout.x,
        top: currentLayout.y,
        zIndex,
      }}
    >
      <div className="space-chat-header" onMouseDown={handleDragStart}>
        <div className="code-workspace-file-info">
          <span className="code-workspace-language-tag">{language}</span>
          <span className="code-workspace-file-path" title={filePath || title}>
            {filePath || title}
          </span>
        </div>
        <div className="space-chat-header-actions">
          <button
            className="space-chat-close"
            onClick={() => closeCodeWindow(windowId)}
            title="Close code window"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-chat-resize-handle space-chat-resize-left" onMouseDown={(e) => handleResizeStart('left', e)} />
      <div className="space-chat-resize-handle space-chat-resize-right" onMouseDown={(e) => handleResizeStart('right', e)} />
      <div className="space-chat-resize-handle space-chat-resize-bottom" onMouseDown={(e) => handleResizeStart('bottom', e)} />
      <div className="space-chat-resize-handle space-chat-resize-corner" onMouseDown={(e) => handleResizeStart('corner', e)} />

      <div className="code-workspace-body code-window-body">
        {code != null ? (
          <pre className="code-workspace-pre">
            <code className={`code-workspace-code language-${language}`}>
              {highlightRange && typeof code === 'string' ? (
                code.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const isHighlighted = lineNum >= highlightRange.start && lineNum <= highlightRange.end;
                  return (
                    <div
                      key={idx}
                      style={
                        isHighlighted
                          ? { background: 'rgba(255, 215, 0, 0.15)', display: 'block' }
                          : { display: 'block' }
                      }
                    >
                      {line}
                    </div>
                  );
                })
              ) : (
                code
              )}
            </code>
          </pre>
        ) : showLoading ? (
          <div style={{ padding: '18px', color: '#b8c0cc', fontFamily: 'monospace', fontSize: '13px' }}>
            Loading code...
          </div>
        ) : (
          <div style={{ padding: '18px', color: '#b8c0cc', fontFamily: 'monospace', fontSize: '13px' }}>
            <p style={{ margin: '0 0 12px' }}>
              {loadState.error || (filePath
                ? 'Code unavailable'
                : 'No source file is associated with this object')}
            </p>
            {filePath && loadState.error && (
              <button
                onClick={() => setLoadAttempt((value) => value + 1)}
                style={{ cursor: 'pointer' }}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Renders the popup code-viewer windows. Each window is a SpaceChat-style
 * draggable/resizable panel positioned by the cascade effect in UIOverlay;
 * the reader falls back to a stacked offset while those layouts are applied.
 */
const CodeWorkspace = ({ repo, commitSha }) => {
  const codeWindows = useCodeStore((s) => s.codeWindows);
  const closeCodeWindow = useCodeStore((s) => s.closeCodeWindow);

  useEffect(() => {
    if (codeWindows.length === 0) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const last = codeWindows[codeWindows.length - 1];
        if (last) closeCodeWindow(last.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [codeWindows, closeCodeWindow]);

  if (!codeWindows || codeWindows.length === 0) return null;

  return (
    <>
      {codeWindows.map((w, i) => (
        <CodeWindow
          key={w.id}
          windowId={w.id}
          objectId={w.objectId}
          zIndex={1100 + i}
          repo={repo}
          commitSha={commitSha}
        />
      ))}
    </>
  );
};

export default CodeWorkspace;