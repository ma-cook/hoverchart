import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import useCodeStore from '../stores/codeStore';
import useConnectionStore from '../stores/connectionStore';
import useLlmEditActivityStore from '../stores/llmEditActivityStore';
import { useObjectsStore } from '../stores';
import {
  getCodeForObject,
  resolveCodeInfo,
  ensureObjectCodeAvailable,
  ensureFullFileContent,
  buildEditedFullFile,
  sliceCodeRange,
} from '../services/objectCodeService';
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

// ── Follow-mode code highlighting ─────────────────────────────────────────────
// While the camera follows a connection, the code windows for that connection's
// two endpoint objects highlight the source lines that relate them: green for
// the source side, blue for the destination side. Restored from the pre-editor
// read-only viewer (removed when the panel became editable).

const SOURCE_LINE_STYLE = {
  background: 'rgba(34, 197, 94, 0.24)',
  boxShadow: 'inset 3px 0 0 #22c55e',
  display: 'block',
};
const DESTINATION_LINE_STYLE = {
  background: 'rgba(59, 130, 246, 0.28)',
  boxShadow: 'inset 3px 0 0 #3b82f6',
  display: 'block',
};
const PLAIN_LINE_STYLE = { display: 'block' };

const HIGHLIGHT_STOP_WORDS = new Set([
  'calls', 'call', 'uses', 'use', 'imports', 'import', 'renders', 'render',
  'receives', 'connect', 'connects', 'from', 'with', 'and', 'the', 'out',
  'data', 'flow', 'component', 'function', 'hook', 'store', 'service',
  'utility', 'ui', 'camera', 'connections', 'displays', 'contains',
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function getEndpointIds(connection) {
  return {
    source: String(
      connection?.start?.objectId ?? connection?.start?.cube?.id ?? connection?.start?.id ?? ''
    ),
    target: String(
      connection?.end?.objectId ?? connection?.end?.cube?.id ?? connection?.end?.id ?? ''
    ),
  };
}

function collectRelationshipTokens(connection, objectData, isSource, objects) {
  const md = connection?.merfolkData || {};
  const otherNode = isSource ? md.targetNode : md.sourceNode;
  const ownNode = isSource ? md.sourceNode : md.targetNode;
  const endpointIds = getEndpointIds(connection);
  const otherObjectId = isSource ? endpointIds.target : endpointIds.source;
  const otherObject = objects.find((obj) => String(obj.id) === otherObjectId);

  const candidates = [
    otherNode,
    otherObject?.merfolkData?.nodeId,
    otherObject?.headerText,
    otherObject?.merfolkData?.name,
  ];

  const label = connection?.text || connection?.label || md.label || '';
  label
    .split(/[^A-Za-z0-9_$]+/)
    .filter((token) => token.length >= 3 && !HIGHLIGHT_STOP_WORDS.has(token.toLowerCase()))
    .forEach((token) => candidates.push(token));

  const seen = new Set();
  const tokens = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (trimmed.length < 2 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    tokens.push(trimmed);
  }

  const ownNames = [
    ownNode,
    objectData?.merfolkData?.nodeId,
    objectData?.headerText,
    objectData?.merfolkData?.name,
  ].filter((token) => typeof token === 'string' && token.trim().length >= 2);

  return { tokens, ownNames };
}

function findRelationshipLines(code, tokens, ownNames, exactRange) {
  const lines = code.split('\n');
  if (exactRange) {
    const selected = [];
    for (let i = exactRange.start; i <= exactRange.end; i += 1) {
      if (i >= 1 && i <= lines.length) selected.push(i - 1);
    }
    if (selected.length > 0) return { lines: selected, mode: 'exact' };
  }

  const scoreWithTokens = (candidateTokens, isFallback) => {
    const scores = new Map();
    for (const token of candidateTokens) {
      if (!token) continue;
      const word = new RegExp(`\\b${escapeRegExp(token)}\\b`);
      const importUse = new RegExp(
        `(?:import|require|from)\\b[^\\n]*\\b${escapeRegExp(token)}\\b|\\b${escapeRegExp(token)}\\b[^\\n]*(?:from|require)`
      );
      const callUse = new RegExp(`\\b${escapeRegExp(token)}\\s*\\(`);
      const jsxUse = new RegExp(`<\\s*${escapeRegExp(token)}\\b`);
      const memberUse = new RegExp(`\\.\\s*${escapeRegExp(token)}\\b`);

      lines.forEach((line, index) => {
        let score = 0;
        if (importUse.test(line)) score = 4;
        else if (callUse.test(line) || jsxUse.test(line)) score = 4;
        else if (memberUse.test(line)) score = 3;
        else if (word.test(line)) score = isFallback ? 1 : 2;
        if (score > 0) scores.set(index, Math.max(scores.get(index) || 0, score));
      });
    }
    return scores;
  };

  const primaryScores = scoreWithTokens(tokens, false);
  if (primaryScores.size > 0) {
    const maxScore = Math.max(...primaryScores.values());
    const threshold = maxScore >= 3 ? 3 : 2;
    const selected = [...primaryScores.entries()]
      .filter(([, score]) => score >= threshold)
      .map(([index]) => index)
      .sort((a, b) => a - b)
      .slice(0, 12);
    if (selected.length > 0) return { lines: selected, mode: 'relationship' };
  }

  const ownScores = scoreWithTokens(ownNames, true);
  if (ownScores.size > 0) {
    const selected = [...ownScores.keys()].sort((a, b) => a - b).slice(0, 8);
    return { lines: selected, mode: 'endpoint' };
  }

  const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
  return { lines: firstNonEmpty >= 0 ? [firstNonEmpty] : [], mode: 'fallback' };
}

const CodeWindow = ({ windowId, objectId, zIndex, repo, commitSha }) => {
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

  const pendingChanges = useCodeStore((s) => s.pendingChanges);
  const pendingChange = filePath
    ? pendingChanges.find((change) => change.filePath === filePath)
    : null;
  const pendingDisplay = pendingChange?.codeObjectId != null
    && String(pendingChange.codeObjectId) === String(objectId)
    && typeof pendingChange.proposed === 'string'
    ? sliceCodeRange(
        pendingChange.proposed,
        pendingChange.displayStartLine,
        pendingChange.displayEndLine
      )
    : null;
  const displayedCode = pendingDisplay ?? (typeof code === 'string' ? code : null);
  // An empty/whitespace string is "no code" here. Rendering the editor for it
  // produces a headerless, all-black textarea that reads as a stray black box;
  // fall through to the informative empty state instead.
  const hasDisplayedCode = typeof displayedCode === 'string' && displayedCode.trim().length > 0;

  // ── Follow-mode highlighting ────────────────────────────────────────────
  const followActiveConnectionId = useCodeStore((s) => s.followActiveConnectionId);
  const editedCodeFiles = useCodeStore((s) => s.editedCodeFiles);
  const llmActiveFiles = useLlmEditActivityStore((s) => s.activeFiles);
  const connections = useConnectionStore((s) => s.connections);

  const normalizedFilePath = (filePath || '').replace(/^\.\//, '').replace(/\\/g, '/');
  // Highlight line numbers come from the last scan, so any object whose source
  // changed (manual save or AI edit) is excluded until a rescan regenerates the
  // diagram.
  const codeChanged =
    Boolean(pendingChange) ||
    (!!normalizedFilePath && (
      (editedCodeFiles && editedCodeFiles.has(normalizedFilePath)) ||
      (llmActiveFiles && (llmActiveFiles.has(filePath) || llmActiveFiles.has(normalizedFilePath)))
    ));

  const highlight = useMemo(() => {
    if (codeChanged) return null;
    if (!followActiveConnectionId || !objectData) return null;
    if (typeof displayedCode !== 'string' || displayedCode.length === 0) return null;

    const connection = (connections || []).find(
      (candidate) => String(candidate.id) === String(followActiveConnectionId)
    );
    if (!connection) return null;

    const endpointIds = getEndpointIds(connection);
    const isSource = endpointIds.source === String(objectId);
    const isDestination = endpointIds.target === String(objectId);
    if (!isSource && !isDestination) return null;

    const md = connection.merfolkData || {};
    const direction = isSource ? 'source' : 'destination';
    const objects = useObjectsStore.getState().objects || [];
    const { tokens, ownNames } = collectRelationshipTokens(connection, objectData, isSource, objects);

    // Exact per-endpoint ranges when a scan provides them (no current scan does;
    // kept so richer scan metadata activates without further changes).
    const relStart = md[`${direction}RelStartLine`] ?? md[`${direction}RelationshipStartLine`] ?? md[`${direction}StartLine`];
    const relEnd = md[`${direction}RelEndLine`] ?? md[`${direction}RelationshipEndLine`] ?? md[`${direction}EndLine`];
    const relFile = md[`${direction}RelFilePath`] ?? md.relFilePath ?? md.relationshipFilePath;

    let exactRange = null;
    if (relStart != null && relEnd != null && (!relFile || !filePath || relFile === filePath)) {
      const displayStart = Number(codeInfo.startLine) || 1;
      exactRange = {
        start: Number(relStart) - displayStart + 1,
        end: Number(relEnd) - displayStart + 1,
      };
    }

    const result = findRelationshipLines(displayedCode, tokens, ownNames, exactRange);
    if (!result.lines.length) return null;
    return { direction, lines: new Set(result.lines), mode: result.mode };
  }, [codeChanged, followActiveConnectionId, objectData, displayedCode, connections, objectId, filePath, codeInfo.startLine]);

  const highlightStyle = highlight?.direction === 'source' ? SOURCE_LINE_STYLE : DESTINATION_LINE_STYLE;

  const preRef = useRef(null);
  const lastScrolledKey = useRef('');
  useEffect(() => {
    if (!highlight || !preRef.current) return;
    const lineIndices = [...highlight.lines];
    if (lineIndices.length === 0) return;
    const key = `${followActiveConnectionId}:${objectId}:${lineIndices.join(',')}`;
    if (lastScrolledKey.current === key) return;
    lastScrolledKey.current = key;
    const codeEl = preRef.current.querySelector('.code-workspace-code');
    const target = codeEl?.children?.[lineIndices[0]];
    if (!target) return;
    requestAnimationFrame(() => {
      try {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch {
        // environment without smooth scroll
      }
    });
  }, [highlight, followActiveConnectionId, objectId]);

  const [draft, setDraft] = useState('');
  const [savedDraft, setSavedDraft] = useState('');
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof displayedCode !== 'string') return;
    if (draft !== savedDraft) {
      setSavedDraft(displayedCode);
      return;
    }
    setDraft(displayedCode);
    setSavedDraft(displayedCode);
    setSaveError(null);
  }, [displayedCode, draft, savedDraft]);

  const handleEditorInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    setDraft(el.innerText);
    setSaveError((prev) => (prev ? null : prev));
  }, []);

  const handleEditorKeyDown = useCallback((e) => {
    // Tab indents (two spaces) instead of moving focus out of the editor.
    if (e.key === 'Tab') {
      e.preventDefault();
      // execCommand keeps undo history + caret correct; fall back to a manual
      // range insert if the browser rejects it.
      const ok = typeof document.execCommand === 'function'
        && document.execCommand('insertText', false, '  ');
      if (!ok) {
        const el = editorRef.current;
        if (!el) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const node = document.createTextNode('  ');
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        handleEditorInput();
      }
    }
  }, [handleEditorInput]);

  const handleEditorPaste = useCallback((e) => {
    // Paste as plain text — never let HTML/spans enter the code.
    const text = e.clipboardData?.getData('text/plain');
    if (text == null) return;
    e.preventDefault();
    const ok = typeof document.execCommand === 'function'
      && document.execCommand('insertText', false, text);
    if (!ok) {
      const el = editorRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      sel.deleteFromDocument();
      const range = sel.getRangeAt(0);
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      handleEditorInput();
    }
  }, [handleEditorInput]);

  const canEdit = !!filePath && typeof displayedCode === 'string';
  const isDirty = canEdit && draft !== savedDraft;

  // While following a connection, swap the editable editor for a read-only
  // highlighted view. Unsaved edits keep the editor so nothing is hidden.
  const showHighlight = !!highlight && !isDirty;

  // The code editor is an UNCONTROLLED contenteditable div. React never owns its
  // text nodes (that fights the caret), so we mirror `draft` into the DOM here
  // only when the element is not focused. Declared after `showHighlight` and
  // depending on it so the content is re-applied when the editor remounts after
  // a follow (highlight) session swaps it out and back in.
  const editorRef = useRef(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement === el) return; // never clobber the caret mid-edit
    if (el.innerText !== draft) {
      el.textContent = draft;
    }
  }, [draft, hasDisplayedCode, showHighlight]);

  const handleSave = useCallback(async () => {
    if (!canEdit || !isDirty) return;

    setSaving(true);
    setSaveError(null);
    try {
      const state = useCodeStore.getState();
      const existing = state.pendingChanges.find((change) => change.filePath === filePath);
      const original = existing ? existing.original : await ensureFullFileContent(filePath, { repo, commitSha });
      const treeKnown = Array.isArray(state.repoFileTree) && state.repoFileTree.length > 0;
      const fileExists = typeof original === 'string'
        || (treeKnown && state.repoFileTree.includes(filePath));
      const base = existing?.proposed ?? original;

      let proposed;
      if (!fileExists && !existing) {
        if (!treeKnown) {
          throw new Error('Unable to load the full file for review.');
        }
        proposed = draft;
      } else {
        if (typeof base !== 'string') {
          throw new Error('Unable to load the full file for review.');
        }
        proposed = buildEditedFullFile({
          fullContent: base,
          displayedContent: savedDraft,
          editedContent: draft,
          startLine: codeInfo.startLine,
          endLine: codeInfo.endLine,
        });
      }

      if (proposed == null) {
        throw new Error('Could not map this edit back to the source file.');
      }

      const displayStartLine = fileExists && codeInfo.startLine != null
        ? Number(codeInfo.startLine)
        : undefined;
      const displayEndLine = displayStartLine != null
        ? displayStartLine + draft.split('\n').length - 1
        : undefined;
      state.upsertPendingChange({
        filePath,
        original: fileExists ? original : null,
        proposed,
        fullContent: fileExists,
        isWholeFileProposal: false,
        action: fileExists ? 'modify' : 'create',
        request: `Manual code edit: ${filePath}`,
        codeObjectId: objectId,
        displayStartLine,
        displayEndLine,
      });
      setSavedDraft(draft);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save edit.');
    } finally {
      setSaving(false);
    }
  }, [canEdit, isDirty, filePath, repo, commitSha, savedDraft, draft, codeInfo.startLine, codeInfo.endLine, objectId]);

  // A window whose object is not in the store is a phantom (deleted / never
  // loaded). Painting it produces a headerless-looking black panel stacked
  // under the real code viewer, so skip it until the object exists again.
  if (!objectData) return null;

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
            {'\u2715'}
          </button>
        </div>
      </div>

      <div className="space-chat-resize-handle space-chat-resize-left" onMouseDown={(e) => handleResizeStart('left', e)} />
      <div className="space-chat-resize-handle space-chat-resize-right" onMouseDown={(e) => handleResizeStart('right', e)} />
      <div className="space-chat-resize-handle space-chat-resize-bottom" onMouseDown={(e) => handleResizeStart('bottom', e)} />
      <div className="space-chat-resize-handle space-chat-resize-corner" onMouseDown={(e) => handleResizeStart('corner', e)} />

      <div className="code-workspace-body code-window-body">
        {showHighlight ? (
          <pre ref={preRef} className="code-workspace-pre">
            <code className={`code-workspace-code language-${language}`}>
              {displayedCode.split('\n').map((line, idx) => {
                const isHighlighted = highlight.lines.has(idx);
                return (
                  <div
                    key={idx}
                    data-code-highlight={isHighlighted ? highlight.direction : undefined}
                    style={isHighlighted ? highlightStyle : PLAIN_LINE_STYLE}
                  >
                    {line}
                  </div>
                );
              })}
            </code>
          </pre>
        ) : hasDisplayedCode ? (
          <div
            ref={editorRef}
            className={`code-workspace-editor code-window-editor language-${language}`}
            contentEditable={!!filePath}
            suppressContentEditableWarning
            spellCheck={false}
            role="textbox"
            aria-multiline="true"
            aria-label={`Code for ${filePath || title}`}
            onInput={handleEditorInput}
            onKeyDown={handleEditorKeyDown}
            onPaste={handleEditorPaste}
            style={filePath ? undefined : { cursor: 'default' }}
          />
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
      {(isDirty || saveError || (hasDisplayedCode && !filePath)) && (
        <div className="code-window-footer">
          {saveError ? (
            <span className="code-window-save-error" title={saveError}>{saveError}</span>
          ) : hasDisplayedCode && !filePath ? (
            <span className="code-window-readonly-hint">
              Read-only: no repository file is associated with this object.
            </span>
          ) : null}
          {isDirty && (
            <button
              className="code-window-save"
              onClick={handleSave}
              disabled={saving}
              title="Save edit for review"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      )}
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

  // A window must resolve to a real object and be unique. An entry with no
  // objectId (or a duplicate of an already-open object) would paint an empty,
  // all-black panel stacked under the real code viewer.
  const visibleWindows = useMemo(() => {
    const out = [];
    const seen = new Set();
    for (const w of codeWindows || []) {
      if (!w || w.objectId == null || w.objectId === '') continue;
      const key = String(w.objectId);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(w);
    }
    return out;
  }, [codeWindows]);

  useEffect(() => {
    if (visibleWindows.length === 0) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const last = visibleWindows[visibleWindows.length - 1];
        if (last) closeCodeWindow(last.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleWindows, closeCodeWindow]);

  if (visibleWindows.length === 0) return null;

  return (
    <>
      {visibleWindows.map((w, i) => (
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