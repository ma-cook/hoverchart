import { useEffect, useCallback, useRef, useState } from 'react';
import useCodeStore from '../stores/codeStore';
import { useObjectsStore } from '../stores';
import { getCodeForObject } from '../services/objectCodeService';
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

const CodeWindow = ({ windowId, objectId, zIndex }) => {
  const layout = useCodeStore((s) => s.codeWindowLayouts?.[windowId]);
  const setCodeWindowLayout = useCodeStore((s) => s.setCodeWindowLayout);
  const closeCodeWindow = useCodeStore((s) => s.closeCodeWindow);

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

  const code = getCodeForObject(objectData);
  if (code == null) return null;

  const filePath = objectData?.merfolkData?.codeFilePath || objectData?.metadata?.codeFilePath || '';
  const language = objectData?.metadata?.language || getLanguage(filePath);
  const title =
    objectData?.headerText ||
    objectData?.merfolkData?.nodeId ||
    objectData?.id ||
    'Code';

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
        <pre className="code-workspace-pre">
          <code className={`code-workspace-code language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

/**
 * Renders the popup code-viewer windows. Each window is a SpaceChat-style
 * draggable/resizable panel positioned by the cascade effect in UIOverlay;
 * the reader falls back to a stacked offset while those layouts are applied.
 */
const CodeWorkspace = () => {
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
        />
      ))}
    </>
  );
};

export default CodeWorkspace;