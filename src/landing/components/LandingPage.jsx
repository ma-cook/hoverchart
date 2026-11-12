import React, { useEffect, useRef } from 'react';
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

// Full feature catalogue shown on the pre-login "Features" page.
const FEATURES = [
  {
    icon: '⬡',
    title: 'See your codebase in 3D',
    blurb: 'Volscape turns any repository into an interactive 3D map you can fly through.',
    bullets: [
      'Auto-scans public or private GitHub repositories',
      'Shape encodes meaning: dodecahedrons for components, cubes for functions, stores and hooks, tetrahedrons for services',
      'Connections draw data flow, containment and dependencies',
      'Switch between the 3D scene and a live 2D diagram',
      'Renders diagrams with thousands of nodes without slowing down',
    ],
  },
  {
    icon: '⟳',
    title: 'Deep source scanning',
    blurb: 'Static analysis across languages and frameworks, re-run whenever the repo changes.',
    bullets: [
      'JavaScript, JSX, TypeScript and TSX parsed with a full AST',
      'Python files and shaders supported too',
      'Recognises React, Next.js and Vue project structures',
      'Background scans keep running after you close the tab',
      'Incremental rescans fetch only what changed, and a space refreshes itself when its repo gets new commits',
      'Builds a symbol index, import graph and architecture communities',
    ],
  },
  {
    icon: '◎',
    title: 'Scan a live website',
    blurb: 'Point Volscape at a running site and watch its runtime behaviour become a diagram.',
    bullets: [
      'Headless Chromium captures network calls, a CPU profile and console output',
      'Detects the frontend framework at runtime',
      'Walks the React fiber tree to find components, hooks and stores',
      'Maps UI, handlers, API calls and libraries into diagram nodes',
    ],
  },
  {
    icon: '◈',
    title: 'Merfolk Markdown — diagrams as code',
    blurb: 'Your architecture is plain text: reviewable, diffable and versioned with your source.',
    bullets: [
      'Expressive node and connection types with labels',
      'Flow paths, face connections and per-node properties',
      'Download, edit and re-upload the diagram markdown',
      'Merge changes into an existing diagram with a rescan',
    ],
  },
  {
    icon: '✦',
    title: 'AI that understands your architecture',
    blurb: 'An assistant pre-loaded with your repository map, ready to plan and write code.',
    bullets: [
      'Group chat, Plan mode and Code generation',
      'A tool-using agent that searches, reads, edits and writes files, verified with language-server data',
      'Asks you a clarifying question instead of guessing',
      'Review every change before you push it to GitHub',
      'Plan tasks and workflow tickets track work from prompt to pull request',
      'Bring your own model: Anthropic, Google, Nvidia or OpenCode Zen',
    ],
  },
  {
    icon: '⬢',
    title: 'Collaborate in real time',
    blurb: 'Spaces are shared by default — bring the whole team into the map.',
    bullets: [
      'Live presence so you can see who is in the space',
      'Group chat for everyone in a space',
      'Organizations with roles and email invites',
      'Share a space by link, with your org, or with specific members',
      'Feedback and issue tickets with threaded comments',
    ],
  },
  {
    icon: '⌁',
    title: 'Code at your fingertips',
    blurb: 'Every object links straight to the source that created it.',
    bullets: [
      'Click an object to open its source in a resizable code window',
      'Edit code in place and save it for review',
      'Symbol outlines, code association and language-server metadata',
      'Jump from an import to its definition, references and call graph',
    ],
  },
  {
    icon: '▣',
    title: 'Build and explore',
    blurb: 'When the auto-generated map is not enough, add your own.',
    bullets: [
      'Add cubes, tetrahedrons, dodecahedrons, planes, text and 3D models',
      'Move, resize and rotate with smart snapping',
      'Face text and colours for annotations',
      'Camera-follow along a connection to trace a data path',
      'Templates for fast reuse, and CSV data turned into a 3D visualisation',
    ],
  },
  {
    icon: '⊙',
    title: 'Fast by design',
    blurb: 'Built to stay smooth on very large codebases.',
    bullets: [
      'Web Workers handle parsing, layout, pathfinding and text rendering',
      'Instanced rendering batches thousands of objects and edges',
      'BVH raycasting and frustum culling keep interaction responsive',
      'Spatial cells load only what is near the camera',
    ],
  },
  {
    icon: '⬤',
    title: 'Accounts and security',
    blurb: 'Sign in and go — or try it without an account.',
    bullets: [
      'Google sign-in or instant guest access',
      'Secure, refreshable sessions',
      'Organization-scoped access controls',
      'Admin tools for platform operators',
    ],
  },
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

function LandingFeatures({ onBack, onRegister, onTryWithoutAccount }) {
  return (
    <div className="features-page">
      <header className="features-header">
        <button type="button" className="features-back" onClick={onBack}>
          ← Back
        </button>
        <SectionEyebrow>Everything in Volscape</SectionEyebrow>
        <h1 className="features-title">
          Features that turn code into{' '}
          <span className="landing-gradient-text">a map you can walk through</span>
        </h1>
        <p className="features-intro">
          From a GitHub URL to an explorable 3D architecture, with an AI that
          reads the same map you do. Here is everything a visitor gets.
        </p>
      </header>

      <div className="features-grid">
        {FEATURES.map((feature) => (
          <section key={feature.title} className="features-section">
            <div className="features-section-head">
              <span className="features-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h2 className="features-section-title">{feature.title}</h2>
            </div>
            {feature.blurb && <p className="features-blurb">{feature.blurb}</p>}
            <ul className="feature-list">
              {feature.bullets.map((bullet) => (
                <Bullet key={bullet}>{bullet}</Bullet>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="features-cta">
        <h2 className="features-cta-title">Ready to see your code in 3D?</h2>
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
      </section>
    </div>
  );
}

export const LandingPage = React.memo(({ view = 'home', onBack, onRegister, onTryWithoutAccount }) => {
  const isDark = useThemeStore((s) => s.mode) === 'dark';
  const scrollRef = useRef(null);

  // Reset the scroll position when switching between the hero and features view.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [view]);

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
    <div className="landing-page" style={themeVars} ref={scrollRef}>
      <div className="landing-inner">
        {view === 'features' ? (
          <LandingFeatures
            onBack={onBack}
            onRegister={onRegister}
            onTryWithoutAccount={onTryWithoutAccount}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
});
