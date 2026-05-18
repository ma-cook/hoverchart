import React from 'react';

const BRAND = '#cc8500';
const BRAND_DARK = '#8a5a00';
const INK = '#0d0d0f';

const HERO_BULLETS = [
  'Auto-scan any GitHub repository into a 3D map',
  'Write diagrams as Merfolk Markdown - versioned with your code',
  'Real-time collaborative spaces for your whole team',
  'Renders thousands of nodes, smoothly, in the browser',
  'Free to try - no install, no setup',
];

export const WelcomeOverlay = React.memo(({ windowSize, onLogin, onTryWithoutAccount }) => {
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
          if (isSmallMobile) return '92%';
          if (isMobile) return '88%';
          return '460px';
        })(),
        maxWidth: '520px',
        borderRadius: '14px',
        padding: isMobile ? '24px 20px' : '32px 30px',
        zIndex: 100,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Eyebrow */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.8px',
            textTransform: 'uppercase',
            color: BRAND_DARK,
            padding: '6px 12px',
            borderRadius: '999px',
            background: 'rgba(204,133,0,0.10)',
            border: '1px solid rgba(204,133,0,0.22)',
          }}
        >
          3D Architecture, Reimagined
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: 800,
          color: INK,
          margin: '0 0 12px 0',
          textAlign: 'center',
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
        }}
      >
        See your software{' '}
        <span
          style={{
            background: `linear-gradient(90deg, ${BRAND} 0%, #ffae33 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          in 3D
        </span>
      </h1>

      {/* Subhead */}
      <p
        style={{
          fontSize: isMobile ? '14px' : '15px',
          color: '#555',
          lineHeight: 1.6,
          margin: '0 0 22px 0',
          textAlign: 'center',
        }}
      >
        Volscape turns any codebase or Markdown diagram into an interactive 3D
        map — built for engineers, product, and design to explore together.
      </p>

      {/* Standout bullets */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 26px 0',
          display: 'grid',
          gap: '8px',
        }}
      >
        {HERO_BULLETS.map((text) => (
          <li
            key={text}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: isMobile ? '13.5px' : '14px',
              color: '#333',
              lineHeight: 1.5,
            }}
          >
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                marginTop: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: BRAND,
                boxShadow: '0 0 0 3px rgba(204,133,0,0.20)',
              }}
            />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onTryWithoutAccount}
          className="welcome-btn-primary"
          style={{
            width: '100%',
            padding: isMobile ? '14px 16px' : '16px 20px',
            background: `linear-gradient(180deg, ${BRAND} 0%, #b87600 100%)`,
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: isMobile ? '15px' : '16px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(204,133,0,0.35)',
          }}
        >
          Try Without Account
        </button>
        <button
          onClick={onLogin}
          className="welcome-btn-secondary"
          style={{
            width: '100%',
            padding: isMobile ? '12px 16px' : '14px 20px',
            backgroundColor: 'transparent',
            color: INK,
            border: `2px solid ${INK}`,
            borderRadius: '8px',
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          Sign In
        </button>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          marginTop: '22px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color: '#999',
        }}
      >
        Scroll to explore ↓
      </div>
    </div>
  );
});
