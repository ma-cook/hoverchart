import React, { useEffect, useRef } from 'react';
import useDialogStore from '../stores/dialogStore';
import './DialogHost.css';

const TOAST_META = {
  success: { icon: '✓', label: 'Success' },
  error: { icon: '!', label: 'Error' },
  warning: { icon: '!', label: 'Warning' },
  info: { icon: 'i', label: 'Notice' },
};

export const DialogHost = React.memo(() => {
  const confirmState = useDialogStore((state) => state.confirmState);
  const resolveConfirm = useDialogStore((state) => state.resolveConfirm);
  const toasts = useDialogStore((state) => state.toasts);
  const dismissToast = useDialogStore((state) => state.dismissToast);
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!confirmState) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        resolveConfirm(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = setTimeout(() => confirmButtonRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [confirmState, resolveConfirm]);

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      resolveConfirm(false);
    }
  };

  return (
    <>
      {confirmState && (
        <div className="app-dialog-overlay" onMouseDown={handleBackdropMouseDown}>
          <div
            className="app-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby={confirmState.message ? 'app-dialog-message' : undefined}
          >
            <div className="app-dialog-accent" aria-hidden="true" />
            <h2 id="app-dialog-title" className="app-dialog-title">
              {confirmState.title}
            </h2>
            {confirmState.message && (
              <p id="app-dialog-message" className="app-dialog-message">
                {confirmState.message}
              </p>
            )}
            <div className="app-dialog-actions">
              <button
                type="button"
                className="app-dialog-btn app-dialog-btn--ghost"
                onClick={() => resolveConfirm(false)}
              >
                {confirmState.cancelLabel}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                className={`app-dialog-btn app-dialog-btn--confirm${
                  confirmState.tone === 'danger' ? ' is-danger' : ''
                }`}
                onClick={() => resolveConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="app-toast-stack" aria-live="polite">
          {toasts.map((toast) => {
            const meta = TOAST_META[toast.type] || TOAST_META.info;
            return (
              <div
                key={toast.id}
                className={`app-toast app-toast--${toast.type || 'info'}`}
                role={toast.type === 'error' ? 'alert' : 'status'}
              >
                <span className="app-toast-icon" aria-hidden="true">
                  {meta.icon}
                </span>
                <div className="app-toast-body">
                  {toast.title && <div className="app-toast-title">{toast.title}</div>}
                  <div className="app-toast-message">{toast.message}</div>
                </div>
                <button
                  type="button"
                  className="app-toast-close"
                  aria-label="Dismiss notification"
                  onClick={() => dismissToast(toast.id)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
});

export default DialogHost;
