import { useState, useEffect } from 'react';
import './RecordingFormatPrompt.css';

const FORMATS = [
  { id: 'mp4', label: 'MP4', desc: 'Best compatibility', typeHint: 'video/mp4' },
  { id: 'webm', label: 'WebM', desc: 'Open format', typeHint: 'video/webm;codecs=vp8,opus' },
];

const RecordingFormatPrompt = ({ open, onSelect, onCancel }) => {
  const [supported, setSupported] = useState({});

  useEffect(() => {
    if (!open) return;
    const results = {};
    for (const { id, typeHint } of FORMATS) {
      results[id] = MediaRecorder.isTypeSupported(typeHint);
    }
    setSupported(results);
  }, [open]);

  if (!open) return null;

  const anySupported = Object.values(supported).some(Boolean);

  return (
    <div className="recording-format-backdrop" onClick={onCancel}>
      <div
        className="recording-format-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Select recording format"
      >
        <div className="recording-format-title">Select Recording Format</div>
        <div className="recording-format-subtitle">
          Choose the format for your screen recording.
        </div>

        <div className="recording-format-options">
          {FORMATS.map(({ id, label, desc, typeHint }) => {
            const isSupported = supported[id] !== false;
            return (
              <button
                key={id}
                className="recording-format-btn"
                disabled={!isSupported}
                onClick={() => onSelect(id)}
                title={
                  !isSupported
                    ? 'Not supported in this browser'
                    : undefined
                }
              >
                <span className="recording-format-btn-label">{label}</span>
                <span className="recording-format-btn-desc">{desc}</span>
                {!isSupported && (
                  <span className="recording-format-btn-hint">Unavailable</span>
                )}
              </button>
            );
          })}
        </div>

        {!anySupported && (
          <div
            style={{
              color: '#f88',
              fontSize: 12,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Screen recording is not supported in this browser.
          </div>
        )}

        <div className="recording-format-actions">
          <button className="recording-format-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingFormatPrompt;
