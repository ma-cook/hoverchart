import React from 'react';

const BRAND = '#cc8500';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function getSectionVisibility(progress, fadeIn, fadeOut) {
  const [fi0, fi1] = fadeIn;
  if (progress < fi0) return { opacity: 0, ty: 32 };
  if (progress < fi1) {
    const t = clamp01((progress - fi0) / (fi1 - fi0));
    return { opacity: t, ty: 32 * (1 - t) };
  }
  if (!fadeOut) return { opacity: 1, ty: 0 };
  const [fo0, fo1] = fadeOut;
  if (progress < fo0) return { opacity: 1, ty: 0 };
  if (progress < fo1) {
    const t = clamp01((progress - fo0) / (fo1 - fo0));
    return { opacity: 1 - t, ty: -32 * t };
  }
  return { opacity: 0, ty: -32 };
}

const AUDIENCE_CARDS = [
  {
    icon: '⬡',
    role: 'Software Developers',
    headline: 'Understand any codebase instantly',
    body: 'Scan a GitHub repository and Volscape auto-generates an interactive 3D architecture diagram — components, hooks, stores, services, and every dependency mapped in seconds.',
  },
  {
    icon: '◈',
    role: 'Product Managers',
    headline: 'Explore systems without reading code',
    body: 'Navigate complex architectures with a 3D interface built for clarity. Identify bottlenecks, trace data flows, and present system design to stakeholders — no engineering background needed.',
  },
  {
    icon: '◻',
    role: 'Tech Leads',
    headline: 'Architecture docs that stay in sync',
    body: 'Write diagrams as Merfolk Markdown alongside your codebase. Version-controlled, diff-friendly, and automatically rendered into a living 3D map of your system.',
  },
];

function ContentPanel({ children, isMobile }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
        padding: isMobile ? '28px 20px' : '48px 56px',
        maxWidth: isMobile ? '92vw' : '920px',
        width: '100%',
        maxHeight: '86vh',
        overflowY: 'auto',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {children}
    </div>
  );
}

function DiagramContent({ isMobile }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '36px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color: BRAND,
            marginBottom: '12px',
          }}
        >
          Diagram as Code
        </div>
        <h2
          style={{
            fontSize: isMobile ? '24px' : '34px',
            fontWeight: '800',
            color: '#111',
            margin: '0 0 14px 0',
            lineHeight: '1.25',
          }}
        >
          Write Markdown. Explore in 3D.
        </h2>
        <p
          style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#555',
            lineHeight: '1.7',
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          Volscape uses <strong style={{ color: '#111' }}>Merfolk</strong> — a
          simple Markdown extension — to describe nodes and relationships. Paste
          your diagram and explore it as a navigable 3D graph.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '24px' : '32px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ flex: '1 1 0', maxWidth: '400px' }}>
          <div
            style={{
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src="/assets/2dmerfolk.PNG"
              alt="Merfolk Markdown diagram"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
          <p
            style={{
              marginTop: '10px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#666',
            }}
          >
            Merfolk Markdown — version-controlled text
          </p>
        </div>

        <div
          style={{
            fontSize: isMobile ? '24px' : '32px',
            color: BRAND,
            flexShrink: 0,
            transform: isMobile ? 'rotate(90deg)' : 'none',
          }}
        >
          →
        </div>

        <div style={{ flex: '1 1 0', maxWidth: '400px' }}>
          <div
            style={{
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src="/assets/3dmerfolk.PNG"
              alt="Volscape 3D diagram"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
          <p
            style={{
              marginTop: '10px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#666',
            }}
          >
            Interactive 3D visualization — navigate and share
          </p>
        </div>
      </div>
    </>
  );
}

function AudienceContent({ isMobile }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '36px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color: BRAND,
            marginBottom: '12px',
          }}
        >
          Built for your team
        </div>
        <h2
          style={{
            fontSize: isMobile ? '24px' : '34px',
            fontWeight: '800',
            color: '#111',
            margin: '0 0 14px 0',
            lineHeight: '1.25',
          }}
        >
          Every role gets more from Volscape
        </h2>
        <p
          style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#555',
            lineHeight: '1.7',
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          A shared spatial understanding of your systems — for every person on
          the team.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
        }}
      >
        {AUDIENCE_CARDS.map((card) => (
          <div
            key={card.role}
            style={{
              flex: '1 1 220px',
              maxWidth: '280px',
              padding: '24px 20px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: 'rgba(255,255,255,0.6)',
            }}
          >
            <div style={{ fontSize: '22px', color: BRAND, marginBottom: '10px' }}>
              {card.icon}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: BRAND,
                marginBottom: '8px',
              }}
            >
              {card.role}
            </div>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#111',
                margin: '0 0 8px 0',
                lineHeight: '1.35',
              }}
            >
              {card.headline}
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.65', margin: 0 }}>
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function CtaContent({ isMobile, onLogin, onTryWithoutAccount }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
      <h2
        style={{
          fontSize: isMobile ? '26px' : '38px',
          fontWeight: '800',
          color: '#111',
          margin: '0 0 16px 0',
          lineHeight: '1.2',
        }}
      >
        See your architecture in 3D
      </h2>
      <p
        style={{
          fontSize: isMobile ? '15px' : '17px',
          color: '#555',
          lineHeight: '1.7',
          margin: '0 0 36px 0',
        }}
      >
        No installation. No configuration. Start building your first Volscape
        diagram in seconds.
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '32px',
        }}
      >
        <button
          onClick={onTryWithoutAccount}
          className="welcome-btn-primary"
          style={{
            padding: '16px 36px',
            backgroundColor: BRAND,
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(204,133,0,0.28)',
          }}
        >
          Try Without Account
        </button>
        <button
          onClick={onLogin}
          className="welcome-btn-secondary"
          style={{
            padding: '16px 36px',
            backgroundColor: 'transparent',
            color: '#111',
            border: '2px solid #111',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          Sign In
        </button>
      </div>
      <div style={{ fontSize: '12px', color: '#aaa' }}>
        3D architecture diagrams powered by Merfolk
      </div>
    </div>
  );
}

export function LandingScrollContent({ scrollProgress, isMobile, onLogin, onTryWithoutAccount }) {
  const sections = [
    {
      id: 'diagram',
      fadeIn: [0.10, 0.22],
      fadeOut: [0.52, 0.62],
      zIndex: 21,
      content: <DiagramContent isMobile={isMobile} />,
    },
    {
      id: 'audience',
      fadeIn: [0.65, 0.75],
      fadeOut: [0.82, 0.90],
      zIndex: 22,
      content: <AudienceContent isMobile={isMobile} />,
    },
    {
      id: 'cta',
      fadeIn: [0.93, 0.99],
      fadeOut: null,
      zIndex: 23,
      content: (
        <CtaContent
          isMobile={isMobile}
          onLogin={onLogin}
          onTryWithoutAccount={onTryWithoutAccount}
        />
      ),
    },
  ];

  return sections.map((section) => {
    const { opacity, ty } = getSectionVisibility(scrollProgress, section.fadeIn, section.fadeOut);
    return (
      <div
        key={section.id}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: section.zIndex,
          opacity,
          transform: `translateY(${ty}px)`,
          pointerEvents: opacity > 0.05 ? 'auto' : 'none',
        }}
      >
        <ContentPanel isMobile={isMobile}>{section.content}</ContentPanel>
      </div>
    );
  });
}


