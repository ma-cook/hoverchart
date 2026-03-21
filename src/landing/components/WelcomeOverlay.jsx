import React from 'react';

export const WelcomeOverlay = React.memo(({ windowSize, onLogin }) => {
  const isMobile = windowSize.width <= 768;
  const isSmallMobile = windowSize.width <= 480;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: (() => {
          if (isSmallMobile) return '90%';
          if (isMobile) return '85%';
          return '400px';
        })(),
        maxWidth: '500px',

        borderRadius: '12px',

        padding: isMobile ? '24px 20px' : '32px 28px',

        zIndex: 100,

        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#666',
            margin: '0',
            fontWeight: '500',
          }}
        >
          3D Diagram Tool
        </h1>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '28px' }}>
        <p
          style={{
            fontSize: isMobile ? '14px' : '15px',
            color: '#333',
            lineHeight: '1.6',
            margin: '0 0 16px 0',
            textAlign: 'center',
          }}
        >
          Create stunning 3D diagrams and wireframes with powerful collaborative
          visualization tools.
        </p>
      </div>

      {/* Features */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px',
            fontSize: isMobile ? '13px' : '14px',
            color: '#555',
            lineHeight: '1.5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span
              style={{
                color: '#cc8500ff',
                marginRight: '8px',
                fontWeight: '600',
              }}
            >
              ✓
            </span>
            <span>Interactive 3D modeling and wireframe design</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span
              style={{
                color: '#cc8500ff',
                marginRight: '8px',
                fontWeight: '600',
              }}
            >
              ✓
            </span>
            <span>Real-time collaboration with team members</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span
              style={{
                color: '#cc8500ff',
                marginRight: '8px',
                fontWeight: '600',
              }}
            >
              ✓
            </span>
            <span>Cloud-based storage and cross-platform access</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span
              style={{
                color: '#cc8500ff',
                marginRight: '8px',
                fontWeight: '600',
              }}
            >
              ✓
            </span>
            <span>Professional 3D visualization tools</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span
              style={{
                color: '#cc8500ff',
                marginRight: '8px',
                fontWeight: '600',
              }}
            >
              ✓
            </span>
            <span>Diagram as Code with Merfolk in Markdown</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={onLogin}
          className="welcome-btn-primary"
          style={{
            width: '100%',
            padding: isMobile ? '14px 16px' : '16px 20px',
            backgroundColor: '#cc8500ff',
            color: 'black',
            border: 'none',
            borderRadius: '8px',
            fontSize: isMobile ? '15px' : '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(0, 102, 204, 0.24)',
          }}
        >
          Get Started
        </button>
        <button
          onClick={onLogin}
          className="welcome-btn-secondary"
          style={{
            width: '100%',
            padding: isMobile ? '12px 16px' : '14px 20px',
            backgroundColor: 'transparent',
            color: '#000000ff',
            border: '2px solid #000000ff',
            borderRadius: '8px',
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
});
