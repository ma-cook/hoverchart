import { useState, useCallback } from 'react';
import useCodeStore from '../stores/codeStore';
import { pushCodeToGitHub } from '../services/githubPushService';

function computeDiffLines(original, proposed) {
  const origLines = (original || '').split('\n');
  const propLines = (proposed || '').split('\n');
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
      <div style={{ color: '#888', marginBottom: '4px' }}>
        <span style={{ color: '#4caf50' }}>+{additions}</span>
        {' / '}
        <span style={{ color: '#f44336' }}>-{deletions}</span>
      </div>
      <div style={{
        background: '#1e1e1e',
        borderRadius: '4px',
        padding: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '11px',
        lineHeight: '1.4',
      }}>
        {lines.map((line, idx) => (
          <div key={idx} style={{
            background: line.type === 'add' ? 'rgba(76,175,80,0.15)' : line.type === 'remove' ? 'rgba(244,67,54,0.15)' : 'transparent',
            color: line.type === 'add' ? '#81c784' : line.type === 'remove' ? '#e57373' : '#d4d4d4',
            whiteSpace: 'pre',
            paddingLeft: '4px',
          }}>
            {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}{line.text}
          </div>
        ))}
      </div>
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

  const pending = pendingChanges.filter(c => c.status === 'pending');
  const accepted = pendingChanges.filter(c => c.status === 'accepted');

  const handlePush = useCallback(async () => {
    if (accepted.length === 0) return;

    const state = useCodeStore.getState();
    const token = state.githubToken;
    const owner = state.repoOwner || state.selectedRepo?.owner?.login;
    const repoName = state.repoName || state.selectedRepo?.name;
    const branch = state.selectedBranch || 'main';

    if (!token || !owner || !repoName) return;

    setPushing(true);
    setPushStatus('pushing');

    try {
      const codeBlocks = accepted.map(c => ({
        filePath: c.filePath,
        code: c.proposed,
      }));

      const result = await pushCodeToGitHub(codeBlocks, owner, repoName, branch, token);

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
      } else {
        setPushStatus('error');
      }
    } catch {
      setPushStatus('error');
    } finally {
      setPushing(false);
    }
  }, [accepted, clearPendingChanges, setPushStatus, setRepoContext]);

  if (pendingChanges.length === 0) return null;

  return (
    <div className="pending-changes-section">
      <div className="pending-changes-header">
        <span style={{ fontWeight: 600, fontSize: '12px' }}>
          Pending Changes ({pending.length} pending, {accepted.length} accepted)
        </span>
      </div>

      <div className="pending-changes-list">
        {pendingChanges.map((change) => (
          <div key={change.filePath} className="pending-change-item">
            <div
              className="pending-change-row"
              onClick={() => setExpandedFile(expandedFile === change.filePath ? null : change.filePath)}
              style={{ cursor: 'pointer' }}
            >
              <span className="pending-change-icon">
                {change.action === 'create' ? '+' : '~'}
              </span>
              <span className="pending-change-path" title={change.filePath}>
                {change.filePath.split('/').pop()}
              </span>
              <span className="pending-change-status" style={{
                color: change.status === 'accepted' ? '#4caf50' : change.status === 'rejected' ? '#f44336' : '#888',
              }}>
                {change.status === 'accepted' ? '✓' : change.status === 'rejected' ? '✗' : expandedFile === change.filePath ? '▼' : '▶'}
              </span>
            </div>

            {expandedFile === change.filePath && (
              <div className="pending-change-detail">
                <DiffView original={change.original} proposed={change.proposed} />
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
          disabled={accepted.length === 0 || pushing}
        >
          {pushing ? 'Pushing...' : `Push ${accepted.length} file(s)`}
        </button>
      </div>
    </div>
  );
}
