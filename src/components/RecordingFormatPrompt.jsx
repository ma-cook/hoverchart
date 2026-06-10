import { useState, useEffect } from 'react';
import './RecordingFormatPrompt.css';

const FORMATS = [
  { id: 'mp4', label: 'MP4', desc: 'Best compatibility', typeHint: 'video/mp4' },
  { id: 'webm', label: 'WebM', desc: 'Open format', typeHint: 'video/webm;codecs=vp8,opus' },
];

const RecordingFormatPrompt = ({ open, onSelect, onCancel }) => {
  const [detected, setDetected] = useState(false);
  const [supported, setSupported] = useState({});

  useEffect(() => {
    if (!open) return;
    setDetected(false);
    const results = {};
    for (const { id, typeHint } of FORMATS) {
      try {
        results[id] = MediaRecorder.isTypeSupported(typeHint);
      } catch {
        results[id] = false;
      }
    }
    setSupported(results);
    setDetected(true);
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
          {FORMATS.map(({ id, label, desc }) => {
            const isSupported = detected ? supported[id] !== false : true;
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
                {detected && !isSupported && (
                  <span className="recording-format-btn-hint">Unavailable</span>
                )}
              </button>
            );
          })}
        </div>

        {detected && !anySupported && (
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
