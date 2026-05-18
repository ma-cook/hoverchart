import React from 'react';

const BRAND = '#cc8500';
const BRAND_DARK = '#8a5a00';
const INK = '#0d0d0f';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function SectionEyebrow({ children }) {
  return (
    <div
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '1.8px',
        textTransform: 'uppercase',
        color: BRAND_DARK,
        marginBottom: '14px',
        padding: '6px 12px',
        borderRadius: '999px',
        background: 'rgba(204,133,0,0.10)',
        border: '1px solid rgba(204,133,0,0.22)',
      }}
    >
      {children}
    </div>
  );
}

function Bullet({ children, accent }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        fontSize: '14px',
        lineHeight: 1.55,
        color: '#333',
        margin: 0,
        padding: '6px 0',
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
          background: accent || BRAND,
          boxShadow: `0 0 0 3px ${accent ? accent + '22' : 'rgba(204,133,0,0.18)'}`,
        }}
      />
      <span>{children}</span>
    </li>
  );
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

const FEATURE_GROUPS = [
  {
    title: 'Visualise',
    bullets: [
      'Interactive 3D architecture diagrams of any codebase',
      'Auto-scan public or private GitHub repositories',
      'Components, hooks, stores, services & shaders mapped automatically',
      'Spatial navigation - fly through your system like a map',
    ],
  },
  {
    title: 'Author',
    bullets: [
      'Merfolk Markdown - diagrams as version-controlled text',
      'Face-to-face connections between 3D objects',
      'Flow paths to trace multi-hop data routes',
      'Live 2D preview alongside the 3D scene',
    ],
  },
  {
    title: 'Collaborate',
    bullets: [
      'Real-time shared spaces across your team',
      'Organisations with role-based access control',
      'Persistent cloud storage, available everywhere',
      'Invite by email - no install required',
    ],
  },
  {
    title: 'Scale',
    bullets: [
      'Renders thousands of nodes with spatial partitioning',
      'GPU-accelerated rendering for huge graphs',
      'Web Workers keep the UI responsive at all times',
      'Free tier to start, generous paid tiers when you grow',
    ],
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
        <SectionEyebrow>Diagram as Code</SectionEyebrow>
        <h2
          style={{
            fontSize: isMobile ? '26px' : '38px',
            fontWeight: 800,
            color: INK,
            margin: '0 0 14px 0',
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
          }}
        >
          Write Markdown.{' '}
          <span
            style={{
              background: `linear-gradient(90deg, ${BRAND} 0%, #ffae33 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Explore in 3D.
          </span>
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
          Volscape uses <strong style={{ color: INK }}>Merfolk</strong> - a
          simple Markdown extension - to describe nodes and relationships.
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
            Merfolk Markdown - version-controlled text
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
            Interactive 3D visualization - navigate and share
          </p>
        </div>
      </div>
    </>
  );
}

function FeaturesContent({ isMobile }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '36px' }}>
        <SectionEyebrow>What you get</SectionEyebrow>
        <h2
          style={{
            fontSize: isMobile ? '26px' : '38px',
            fontWeight: 800,
            color: INK,
            margin: '0 0 14px 0',
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
          }}
        >
          A full toolkit for{' '}
          <span
            style={{
              background: `linear-gradient(90deg, ${BRAND} 0%, #ffae33 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            spatial software design
          </span>
        </h2>
        <p
          style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#555',
            lineHeight: 1.7,
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          Everything you need to visualise, author, share and scale 3D
          architecture diagrams.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '18px' : '28px 36px',
        }}
      >
        {FEATURE_GROUPS.map((group) => (
          <div key={group.title}>
            <h3
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '1.4px',
                textTransform: 'uppercase',
                color: INK,
                margin: '0 0 12px 0',
                paddingBottom: '8px',
                borderBottom: '2px solid rgba(204,133,0,0.35)',
              }}
            >
              {group.title}
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {group.bullets.map((b) => (
                <Bullet key={b}>{b}</Bullet>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function AudienceContent({ isMobile }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '36px' }}>
        <SectionEyebrow>Built for your team</SectionEyebrow>
        <h2
          style={{
            fontSize: isMobile ? '26px' : '38px',
            fontWeight: 800,
            color: INK,
            margin: '0 0 14px 0',
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
          }}
        >
          Every role gets more from{' '}
          <span
            style={{
              background: `linear-gradient(90deg, ${BRAND} 0%, #ffae33 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Volscape
          </span>
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
          A shared spatial understanding of your systems - for every person on
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
              padding: '24px 22px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,247,233,0.55) 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${BRAND}, #ffae33)`,
              }}
            />
            <div style={{ fontSize: '26px', color: BRAND, marginBottom: '12px', lineHeight: 1 }}>
              {card.icon}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1.3px',
                textTransform: 'uppercase',
                color: BRAND_DARK,
                marginBottom: '8px',
              }}
            >
              {card.role}
            </div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: INK,
                margin: '0 0 10px 0',
                lineHeight: 1.3,
              }}
            >
              {card.headline}
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, margin: 0 }}>
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
    <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
      <SectionEyebrow>Get started in seconds</SectionEyebrow>
      <h2
        style={{
          fontSize: isMobile ? '28px' : '42px',
          fontWeight: 800,
          color: INK,
          margin: '0 0 16px 0',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        See your architecture in{' '}
        <span
          style={{
            background: `linear-gradient(90deg, ${BRAND} 0%, #ffae33 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          3D
        </span>
      </h2>
      <p
        style={{
          fontSize: isMobile ? '15px' : '17px',
          color: '#555',
          lineHeight: '1.7',
          margin: '0 0 28px 0',
        }}
      >
        No installation. No configuration. Start building your first Volscape
        diagram in seconds.
      </p>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 auto 32px',
          maxWidth: '420px',
          textAlign: 'left',
          display: 'inline-block',
        }}
      >
        <Bullet>Free forever for personal use</Bullet>
        <Bullet>Works directly in your browser</Bullet>
        <Bullet>Scan your first GitHub repo in under a minute</Bullet>
      </ul>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={onTryWithoutAccount}
          className="welcome-btn-primary"
          style={{
            padding: '16px 36px',
            background: `linear-gradient(180deg, ${BRAND} 0%, #b87600 100%)`,
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
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
            padding: '16px 36px',
            backgroundColor: 'transparent',
            color: INK,
            border: `2px solid ${INK}`,
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
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
      fadeIn: [0.08, 0.18],
      fadeOut: [0.30, 0.38],
      zIndex: 21,
      content: <DiagramContent isMobile={isMobile} />,
    },
    {
      id: 'features',
      fadeIn: [0.42, 0.50],
      fadeOut: [0.60, 0.68],
      zIndex: 22,
      content: <FeaturesContent isMobile={isMobile} />,
    },
    {
      id: 'audience',
      fadeIn: [0.70, 0.78],
      fadeOut: [0.85, 0.92],
      zIndex: 23,
      content: <AudienceContent isMobile={isMobile} />,
    },
    {
      id: 'cta',
      fadeIn: [0.94, 0.99],
      fadeOut: null,
      zIndex: 24,
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


