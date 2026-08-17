import { useState, useCallback, useMemo } from 'react';
import useCodeStore from '../stores/codeStore';
import { pushCodeToGitHub } from '../services/githubPushService';
import { getGithubToken } from '../services/githubRepoService';
import { diffToHunks } from '../services/context/diffUtils';
import './PendingChangesPanel.css';

const MAX_DIFF_LINES = 600;

// Real LCS-based diff (via diffToHunks in diffUtils): unchanged lines stay
// aligned, so +N/-M reflect ACTUAL changed lines instead of the whole file.
// The old naive walker advanced both pointers on every mismatch, so a single
// insertion shifted every subsequent line and reported the entire file as
// removed + re-added (e.g. +1899/-1885 for a 1-line change).
function computeDiffLines(original, proposed) {
  const origContent = (original || '').replace(/\r\n/g, '\n');
  const propContent = (proposed || '').replace(/\r\n/g, '\n');
  const origLines = origContent.split('\n');
  const hunks = diffToHunks(origContent, propContent);

  const lines = [];
  let origIdx = 0;
  let propIdx = 0;
  let searchPos = 0;

  const emitSame = (upTo) => {
    for (let k = origIdx; k < upTo; k++) {
      lines.push({ type: 'same', text: origLines[k], origLine: k + 1, propLine: propIdx + 1 });
      origIdx++;
      propIdx++;
    }
  };

  for (const hunk of hunks) {
    let pos = origContent.indexOf(hunk.oldString, searchPos);
    if (pos === -1) pos = origContent.indexOf(hunk.oldString);
    let startLine = 0;
    for (let k = 0; k < pos; k++) {
      if (origContent[k] === '\n') startLine++;
    }
    searchPos = pos + hunk.oldString.length;

    if (startLine > origIdx) emitSame(startLine);
    origIdx = startLine;

    const oldJoined = hunk.oldString;
    const newJoined = hunk.newString;
    const oldLs = oldJoined === '' ? [] : oldJoined.split('\n');
    const newLs = newJoined === '' ? [] : newJoined.split('\n');

    // diffToHunks anchors pure insertions to a run of unchanged lines
    // (oldString = the anchor, newString = anchor + inserted). Recover the
    // insertion so those anchor lines render as unchanged instead of being
    // counted as removed + re-added.
    let emitRemove = oldLs;
    let emitAdd = newLs;
    let anchorLines = [];
    let anchorFirst = false;
    if (oldLs.length > 0 && newJoined.length > oldJoined.length) {
      if (newJoined.startsWith(oldJoined)) {
        anchorFirst = true; // newFile: ...anchor + inserted...
        emitAdd = newJoined.slice(oldJoined.length).split('\n');
        if (emitAdd[0] === '') emitAdd.shift();
        anchorLines = oldLs;
        emitRemove = [];
      } else if (newJoined.endsWith(oldJoined)) {
        anchorFirst = false; // newFile: ...inserted + anchor...
        emitAdd = newJoined.slice(0, newJoined.length - oldJoined.length).split('\n');
        if (emitAdd[emitAdd.length - 1] === '') emitAdd.pop();
        anchorLines = oldLs;
        emitRemove = [];
      }
    }
    if (emitAdd.length === 1 && emitAdd[0] === '') emitAdd = [];

    if (anchorFirst) {
      for (const t of anchorLines) lines.push({ type: 'same', text: t, origLine: origIdx + 1, propLine: propIdx + 1 });
      for (const t of emitAdd) lines.push({ type: 'add', text: t, propLine: propIdx + anchorLines.length + 1 });
    } else {
      for (const t of emitRemove) lines.push({ type: 'remove', text: t, origLine: origIdx + 1 });
      for (const t of emitAdd) lines.push({ type: 'add', text: t, propLine: propIdx + 1 });
      for (const t of anchorLines) lines.push({ type: 'same', text: t, origLine: origIdx + 1, propLine: propIdx + emitRemove.length + 1 });
    }

    origIdx += oldLs.length;
    propIdx += newLs.length;
  }

  emitSame(origLines.length);
  return lines;
}

function DiffView({ original, proposed }) {
  const lines = useMemo(() => computeDiffLines(original, proposed), [original, proposed]);
  const additions = lines.filter(l => l.type === 'add').length;
  const deletions = lines.filter(l => l.type === 'remove').length;
  const truncated = lines.length > MAX_DIFF_LINES;
  const displayLines = truncated ? lines.slice(0, MAX_DIFF_LINES) : lines;

  return (
    <div style={{ fontSize: '11px', marginTop: '6px' }}>
      <div className="diff-stats">
        <span className="additions">+{additions}</span>
        <span className="deletions">-{deletions}</span>
        {truncated && (
          <span style={{ color: '#aaa', marginLeft: '8px' }}>
            (showing {MAX_DIFF_LINES} of {lines.length} lines)
          </span>
        )}
      </div>
      <pre style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '4px',
        padding: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
        margin: 0,
      }}>
        {displayLines.map((line, idx) => (
          <div key={idx} className={`diff-line ${line.type}`}>
            {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}{line.text}
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function PendingChangesPanel() {
  const pendingChanges = useCodeStore((s) => s.pendingChanges);
  const acceptPendingChange = useCodeStore((s) => s.acceptPendingChange);
  const rejectPendingChange = useCodeStore((s) => s.rejectPendingChange);
  const acceptAllPendingChanges = useCodeStore((s) => s.acceptAllPendingChanges);
  const rejectAllPendingChanges = useCodeStore((s) => s.rejectAllPendingChanges);
  const clearPendingChanges = useCodeStore((s) => s.clearPendingChanges);
  const setPushStatus = useCodeStore((s) => s.setPushStatus);
  const setRepoContext = useCodeStore((s) => s.setRepoContext);

  const [expandedFile, setExpandedFile] = useState(null);
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState(null);
  const [pushResult, setPushResult] = useState(null);

  const pending = pendingChanges.filter(c => c.status === 'pending');
  const accepted = pendingChanges.filter(c => c.status === 'accepted');

  const handlePush = useCallback(async () => {
    if (accepted.length === 0) return;

    const state = useCodeStore.getState();
    const token = state.githubToken || getGithubToken();
    const owner = state.repoOwner || state.selectedRepo?.owner?.login;
    const repoName = state.repoName || state.selectedRepo?.name;
    const branch = state.selectedBranch || 'main';

    if (!token || !owner || !repoName) {
      setPushError('GitHub token missing — reconnect your repo to enable push.');
      return;
    }

    setPushing(true);
    setPushStatus('pushing');
    setPushError(null);
    setPushResult(null);

    try {
      const codeBlocks = accepted.map(c => ({
        filePath: c.filePath,
        code: c.proposed,
        fullContent: c.fullContent,
      }));

      const requestSummary = (accepted.map(c => c.request).find(Boolean) || 'Code update').split('\n')[0].slice(0, 120);

      const result = await pushCodeToGitHub(codeBlocks, owner, repoName, branch, token, requestSummary);

      if (result.success) {
        const updatedContents = { ...(state.repoFileContents || {}) };
        if (result.merged) {
          for (const [filePath, content] of Object.entries(result.merged)) {
            updatedContents[filePath] = content;
          }
        }
        setRepoContext(state.repoFileTree, updatedContents);
        clearPendingChanges();
        setPushStatus('success');
        setPushResult(`Pushed ${result.pushed} file(s) to ${owner}/${repoName}:${branch}`);
      } else {
        setPushStatus('error');
        const errText = result.errors?.map(e => e.error).join('; ') || 'Push failed.';
        setPushError(errText);
      }
    } catch (err) {
      setPushStatus('error');
      setPushError(err.message || 'Push failed.');
    } finally {
      setPushing(false);
    }
  }, [accepted, clearPendingChanges, setPushStatus, setRepoContext]);

  if (pendingChanges.length === 0) return null;

  return (
    <div className="pending-changes-panel">
      <div className="pending-changes-section">
      <div className="pending-changes-header">
        <span>
          Pending Changes ({pending.length} pending, {accepted.length} accepted)
        </span>
      </div>

      <div className="pending-changes-list">
        {pendingChanges.map((change) => (
          <div key={change.filePath} className="pending-change-item">
            <div
              className="pending-change-row"
              onClick={() => setExpandedFile(expandedFile === change.filePath ? null : change.filePath)}
            >
              <span className="pending-change-icon">
                {change.action === 'create' ? '+' : '~'}
              </span>
              <span className="pending-change-path" title={change.filePath}>
                {change.filePath.split('/').pop()}
              </span>
              {change.isWholeFileProposal && (
                <span
                  className="pending-change-warning"
                  title="Proposes the entire file for an existing file. Push will reject it — use SEARCH/REPLACE markers covering only the changed lines."
                >
                  full-file
                </span>
              )}
              <span className={`pending-change-status ${change.status === 'accepted' ? 'status-accepted' : change.status === 'rejected' ? 'status-rejected' : ''}`}>
                {change.status === 'accepted' ? '✓' : change.status === 'rejected' ? '✗' : expandedFile === change.filePath ? '▼' : '▶'}
              </span>
            </div>

            {expandedFile === change.filePath && (
              <div className="pending-change-detail">
                <DiffView original={change.original} proposed={change.proposed} />
                {change.isWholeFileProposal && (
                  <div style={{ fontSize: '11px', color: '#ffb74d', marginTop: '6px', lineHeight: '1.4' }}>
                    This change replaces the entire existing file. Push will reject it — it must use SEARCH/REPLACE markers covering only the changed lines.
                  </div>
                )}
                <div className="pending-change-actions">
                  <button
                    className="pending-btn accept-btn"
                    onClick={(e) => { e.stopPropagation(); acceptPendingChange(change.filePath); }}
                    disabled={change.status === 'accepted'}
                  >
                    Accept
                  </button>
                  <button
                    className="pending-btn reject-btn"
                    onClick={(e) => { e.stopPropagation(); rejectPendingChange(change.filePath); }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pending-changes-footer">
        <button className="pending-footer-btn" onClick={acceptAllPendingChanges} disabled={pending.length === 0}>
          Accept All
        </button>
        <button className="pending-footer-btn" onClick={rejectAllPendingChanges} disabled={pendingChanges.length === 0}>
          Reject All
        </button>
        <button
          className="pending-footer-btn push-btn"
          onClick={handlePush}
          disabled={accepted.length === 0 || pushing || accepted.some(c => c.isWholeFileProposal)}
          title={accepted.some(c => c.isWholeFileProposal) ? 'Reject or fix the full-file change(s) before pushing' : undefined}
        >
          {pushing ? 'Pushing...' : `Push ${accepted.length} file(s)`}
        </button>
      </div>
      {accepted.some(c => c.isWholeFileProposal) && (
        <div style={{ fontSize: '11px', color: '#ffb74d', padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          One or more accepted changes replace an existing file entirely and would be rejected by push. Reject them or fix the underlying change.
        </div>
      )}
      {pushError && (
        <div style={{ fontSize: '11px', color: '#ff6b6b', padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.1)', wordBreak: 'break-word' }}>
          {pushError}
        </div>
      )}
      {pushResult && !pushError && (
        <div style={{ fontSize: '11px', color: '#69db7c', padding: '6px 10px', borderTop: '1px solid rgba(255,255,255,0.1)', wordBreak: 'break-word' }}>
          {pushResult}
        </div>
      )}
      </div>
    </div>
  );
}
