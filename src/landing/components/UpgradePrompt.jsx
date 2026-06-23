import React from 'react';

const TIER_LIMITS = {
  free: 3,
  starter: 10,
};

const UpgradePrompt = React.memo(({ show, onClose, currentTier = 'free' }) => {
  if (!show) return null;

  const limit = TIER_LIMITS[currentTier] || TIER_LIMITS.free;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          width: '380px',
          maxWidth: '90vw',
          textAlign: 'center',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          color: '#333',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚀</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>
          Space Limit Reached
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
          You've reached the maximum of {limit} spaces on the{' '}
          <strong>{currentTier}</strong> plan. Upgrade to create up to 10 spaces.
        </p>
        <div
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            Starter Plan
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>Up to 10 spaces</div>
          <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
            Payment coming soon
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              color: '#333',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

export { UpgradePrompt, TIER_LIMITS };
