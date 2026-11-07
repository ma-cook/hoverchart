import React from 'react';
import useThemeStore from '../../stores/themeStore';

const BRAND = '#cc8500';
const BRAND_DARK = '#8a5a00';
const INK = '#0d0d0f';

const HERO_BULLETS = [
  'Auto-scan any GitHub repository into a 3D map',
  'Write diagrams as Merfolk Markdown, versioned with your code',
  'Real-time collaborative spaces for your whole team',
];

const FEATURE_GROUPS = [
  {
    title: 'Visualise',
    bullets: [
      'Interactive 3D diagrams of any codebase',
      'Auto-scan public or private GitHub repos',
    ],
  },
  {
    title: 'Author',
    bullets: [
      'Merfolk Markdown - diagrams as version-controlled text',
      'Live 2D preview alongside the 3D scene',
    ],
    transform: true,
  },
  {
    title: 'Collaborate',
    bullets: [
      'Real-time shared spaces for your team',
      'Organisations with role-based access',
    ],
  },
  {
    title: 'Scale',
    bullets: [
      'Renders thousands of nodes with spatial partitioning',
      'GPU-accelerated, Web-Worker-backed rendering',
    ],
  },
];

const AUDIENCE_CARDS = [
  { role: 'Developers', headline: 'Understand any codebase instantly' },
  { role: 'Product Managers', headline: 'Explore systems without reading code' },
  { role: 'Tech Leads', headline: 'Architecture docs that stay in sync' },
];

function SectionEyebrow({ children }) {
  return <div className="landing-eyebrow">{children}</div>;
}

function Bullet({ children }) {
  return (
    <li className="landing-bullet">
      <span aria-hidden className="landing-bullet-dot" />
      <span>{children}</span>
    </li>
  );
}

function FeatureTransform() {
  return (
    <div className="feature-transform" aria-label="Merfolk Markdown rendered as an interactive 3D diagram">
      <div className="feature-transform-thumb">
        <img src="/assets/2dmerfolk.PNG" alt="Merfolk Markdown text rendered as a 2D diagram" />
      </div>
      <span aria-hidden className="feature-transform-arrow">→</span>
      <div className="feature-transform-thumb">
        <img src="/assets/3dmerfolk.PNG" alt="The same diagram rendered interactively in 3D" />
      </div>
    </div>
  );
}

export const LandingPage = React.memo(({ onRegister, onTryWithoutAccount }) => {
  const isDark = useThemeStore((s) => s.mode) === 'dark';

  const palette = isDark
    ? {
        ink: '#f4f4f5',
        body: '#c8c8cc',
        muted: '#9a9aa2',
        border: 'rgba(255, 255, 255, 0.16)',
        hoverBg: 'rgba(255, 255, 255, 0.06)',
        eyebrowText: '#ffb733',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
      }
    : {
        ink: INK,
        body: '#4a4a52',
        muted: '#6b6b75',
        border: 'rgba(13, 13, 15, 0.14)',
        hoverBg: 'rgba(13, 13, 15, 0.04)',
        eyebrowText: BRAND_DARK,
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.7)',
      };

  const themeVars = {
    '--lp-ink': palette.ink,
    '--lp-body': palette.body,
    '--lp-muted': palette.muted,
    '--lp-border': palette.border,
    '--lp-hover-bg': palette.hoverBg,
    '--lp-eyebrow-text': palette.eyebrowText,
    '--lp-brand': BRAND,
    '--lp-brand-dark': BRAND_DARK,
    '--lp-text-shadow': palette.textShadow,
  };

  return (
    <div className="landing-page" style={themeVars}>
      <div className="landing-inner">
        <section className="hero" aria-labelledby="landing-hero-title">
          <div className="hero-copy">
            <SectionEyebrow>3D Architecture, Reimagined</SectionEyebrow>
            <h1 id="landing-hero-title" className="hero-title">
              See your software{' '}
              <span className="landing-gradient-text">in 3D</span>
            </h1>
            <p className="hero-subhead">
              Volscape turns any codebase into an interactive 3D map -
              auto-scanned, version-controlled, and built for teams.
            </p>
            <ul className="hero-bullets">
              {HERO_BULLETS.map((text) => (
                <Bullet key={text}>{text}</Bullet>
              ))}
            </ul>
            <p className="hero-trust-note">Free forever · No install · Works in browser</p>
            <div className="hero-cta-row">
              <button
                type="button"
                onClick={onRegister}
                className="welcome-btn-primary hero-cta-primary"
              >
                Register
              </button>
              <button
                type="button"
                onClick={onTryWithoutAccount}
                className="welcome-btn-secondary hero-cta-secondary"
              >
                Try Without Account
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-frame">
              <img
                src="/assets/3dmerfolk.PNG"
                alt="Interactive 3D architecture diagram"
              />
            </div>
          </div>
        </section>

        <section className="feature-strip" aria-label="What you get">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.title} className="feature-card">
              <h2 className="feature-title">{group.title}</h2>
              <ul className="feature-list">
                {group.bullets.map((b) => (
                  <Bullet key={b}>{b}</Bullet>
                ))}
              </ul>
              {group.transform && <FeatureTransform />}
            </div>
          ))}
        </section>

        <section className="audience-row" aria-label="Built for your team">
          {AUDIENCE_CARDS.map((card) => (
            <div key={card.role} className="audience-card">
              <div className="audience-role">{card.role}</div>
              <h2 className="audience-headline">{card.headline}</h2>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
});
