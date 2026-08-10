import { useState, useCallback } from 'react';
import useCodeStore from '../stores/codeStore';
import { pushCodeToGitHub } from '../services/githubPushService';
import { getGithubToken } from '../services/githubRepoService';
import './PendingChangesPanel.css';

function computeDiffLines(original, proposed) {
  const origLines = (original || '').replace(/\r\n/g, '\n').split('\n');
  const propLines = (proposed || '').replace(/\r\n/g, '\n').split('\n');
  const lines = [];

  let i = 0;
  let j = 0;
  while (i < origLines.length || j < propLines.length) {
    if (i < origLines.length && j < propLines.length) {
      if (origLines[i] === propLines[j]) {
        lines.push({ type: 'same', text: origLines[i], origLine: i + 1, propLine: j + 1 });
        i++;
        j++;
      } else {
        lines.push({ type: 'remove', text: origLines[i], origLine: i + 1 });
        lines.push({ type: 'add', text: propLines[j], propLine: j + 1 });
        i++;
        j++;
      }
    } else if (i < origLines.length) {
      lines.push({ type: 'remove', text: origLines[i], origLine: i + 1 });
      i++;
    } else {
      lines.push({ type: 'add', text: propLines[j], propLine: j + 1 });
      j++;
    }
  }
  return lines;
}

function DiffView({ original, proposed }) {
  const lines = computeDiffLines(original, proposed);
  const additions = lines.filter(l => l.type === 'add').length;
  const deletions = lines.filter(l => l.type === 'remove').length;

  return (
    <div style={{ fontSize: '11px', marginTop: '6px' }}>
      <div className="diff-stats">
        <span className="additions">+{additions}</span>
        <span className="deletions">-{deletions}</span>
      </div>
      <pre style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '4px',
        padding: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
        margin: 0,
      }}>
        {lines.map((line, idx) => (
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
