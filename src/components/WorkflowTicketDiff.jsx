import { useMemo } from 'react';
import { diffToHunks } from '../services/context/diffUtils';

const MAX_DIFF_LINES = 400;

function computeDiffLines(original, proposed) {
  const origContent = (original || '').replace(/\r\n/g, '\n');
  const propContent = (proposed || '').replace(/\r\n/g, '\n');
  const origLines = origContent.split('\n');
  const hunks = diffToHunks(origContent, propContent);

  const lines = [];
  let origIdx = 0;
  let searchPos = 0;

  const emitSame = (upTo) => {
    for (let k = origIdx; k < upTo; k++) {
      lines.push({ type: 'same', text: origLines[k] });
      origIdx++;
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

    const oldLs = hunk.oldString === '' ? [] : hunk.oldString.split('\n');
    const newLs = hunk.newString === '' ? [] : hunk.newString.split('\n');

    let emitRemove = oldLs;
    let emitAdd = newLs;
    let anchorLines = [];
    let anchorFirst = false;
    if (oldLs.length > 0 && hunk.newString.length > hunk.oldString.length) {
      if (hunk.newString.startsWith(hunk.oldString)) {
        anchorFirst = true;
        emitAdd = hunk.newString.slice(hunk.oldString.length).split('\n');
        if (emitAdd[0] === '') emitAdd.shift();
        anchorLines = oldLs;
        emitRemove = [];
      } else if (hunk.newString.endsWith(hunk.oldString)) {
        anchorFirst = false;
        emitAdd = hunk.newString.slice(0, hunk.newString.length - hunk.oldString.length).split('\n');
        if (emitAdd[emitAdd.length - 1] === '') emitAdd.pop();
        anchorLines = oldLs;
        emitRemove = [];
      }
    }
    if (emitAdd.length === 1 && emitAdd[0] === '') emitAdd = [];

    if (anchorFirst) {
      for (const t of anchorLines) lines.push({ type: 'same', text: t });
      for (const t of emitAdd) lines.push({ type: 'add', text: t });
    } else {
      for (const t of emitRemove) lines.push({ type: 'remove', text: t });
      for (const t of anchorLines) lines.push({ type: 'same', text: t });
      for (const t of emitAdd) lines.push({ type: 'add', text: t });
    }

    origIdx += oldLs.length;
  }

  emitSame(origLines.length);
  return lines;
}

const typeColor = { add: '#4ec9b0', remove: '#f14c4c', same: 'rgba(255,255,255,0.5)' };
const typeBg = { add: 'rgba(78,201,176,0.08)', remove: 'rgba(241,76,76,0.08)', same: 'transparent' };

export default function WorkflowTicketDiff({ original, proposed }) {
  const lines = useMemo(() => computeDiffLines(original, proposed), [original, proposed]);
  const additions = lines.filter((l) => l.type === 'add').length;
  const deletions = lines.filter((l) => l.type === 'remove').length;
  const truncated = lines.length > MAX_DIFF_LINES;
  const displayLines = truncated ? lines.slice(0, MAX_DIFF_LINES) : lines;

  return (
    <div style={{ fontSize: '11px', marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '11px' }}>
        <span style={{ color: '#4ec9b0' }}>+{additions}</span>
        <span style={{ color: '#f14c4c' }}>-{deletions}</span>
        {truncated && (
          <span style={{ color: '#aaa' }}>
            (showing {MAX_DIFF_LINES} of {lines.length} lines)
          </span>
        )}
      </div>
      <pre style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '4px',
        padding: '8px',
        maxHeight: '260px',
        overflowY: 'auto',
        margin: 0,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        lineHeight: '1.4',
      }}>
        {displayLines.map((line, idx) => (
          <div key={idx} style={{ color: typeColor[line.type], background: typeBg[line.type], whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <span style={{ userSelect: 'none', opacity: 0.4, display: 'inline-block', width: '16px', textAlign: 'right', marginRight: '8px' }}>
              {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
            </span>
            {line.text || ' '}
          </div>
        ))}
      </pre>
    </div>
  );
}
