import React from 'react';
import './FaqPage.css';

const NAV_ITEMS = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'objects', label: 'Adding objects' },
  { id: 'solid-menu', label: 'Solid object menu' },
  { id: 'planes', label: 'Planes' },
  { id: 'text', label: 'Text objects' },
  { id: 'chat', label: 'SpaceChat and GitHub' },
  { id: 'models', label: 'LLM providers' },
  { id: 'orgs', label: 'Organizations and sharing' },
  { id: 'topbar', label: 'Top bar actions' },
];

const TOOL_BUTTONS = [
  ['□ Add Cube', 'Adds a cube. Use it for functions, stores, hooks, or a general solid node.'],
  ['▲ Add Tetrahedron', 'Adds a tetrahedron. It shares the same editing menu as cubes and octahedrons.'],
  ['○ Add Dodecahedron', 'Adds a dodecahedron, typically used for components and containers.'],
  ['▭ Add Plane', 'Adds a flat plane for images, webcam or screen share overlays, borders, and labels.'],
  ['T Add Text', 'Adds a standalone text object for notes and annotations.'],
  ['3D Add 3D Model', 'Uploads a .glb or .gltf model for signed-in users.'],
];

const SOLID_TOOLS = [
  ['H', 'Toggle the header text input for the object label.'],
  ['✥', 'Transform: move or rotate the selected object.'],
  ['↔', 'Resize the selected object.'],
  ['</>', 'Open source code for the object. Enabled only when code is associated with it.'],
  ['🎨', 'Open the colour picker for the object.'],
  ['👁', 'Look at the object and centre the camera on it.'],
  ['🎥', 'Follow the object, or follow a highlighted connection path when one is selected.'],
  ['🗑️', 'Delete the object after confirmation.'],
];

const PLANE_TOOLS = [
  ['T', 'Edit the face text on the plane.'],
  ['🎨', 'Open the colour picker for the plane face.'],
  ['✥', 'Move or rotate the plane.'],
  ['↔', 'Resize the plane.'],
  ['▢', 'Open the border menu: solid, dashed, dotted, border colour, and line thickness.'],
  ['🖼️', 'Upload an image onto the plane.'],
  ['📹', 'Enable or disable the webcam feed. The red state means you are broadcasting.'],
  ['🖥️', 'Share or stop sharing your screen. The blue state means you are sharing.'],
  ['📌', 'Pin the webcam feed to the overlay while the webcam is active.'],
  ['👁', 'Look at the plane and centre the camera on it.'],
  ['H', 'Toggle the header text input for the plane label.'],
  ['🗑️', 'Delete the plane after confirmation.'],
];

const TEXT_TOOLS = [
  ['Size dropdown', 'Choose one of ten text sizes.'],
  ['🎨', 'Choose the text colour.'],
  ['B', 'Toggle bold.'],
  ['I', 'Toggle italic.'],
  ['U', 'Toggle underline.'],
  ['•', 'Toggle bullet points.'],
  ['⇄', 'Move the text object.'],
  ['↔', 'Resize the text object.'],
  ['👁', 'Look at the text object.'],
  ['🗑️', 'Delete the text object after confirmation.'],
];

const PROVIDERS = [
  ['Anthropic', 'Use an Anthropic API key.'],
  ['Google Gemini', 'Use a Google Gemini API key.'],
  ['Opencode Zen', 'Free and paid OpenCode models. Free models share a per-IP daily limit and can hit usage caps.'],
  ['Opencode Go', 'OpenCode models served through the Go endpoint. If you see a region error, open the linked URL and select the Global region.'],
  ['Nvidia', 'Use an Nvidia API key. Nvidia offers free API-key models such as GLM 5.3 Flash.'],
];

const ACTION_BUTTONS = [
  ['☾ / ☀', 'Theme toggle: switch between light and dark mode.'],
  ['● Record', 'Start or stop recording. The button turns red while recording.'],
  ['↗', 'Toggle connection lines. Orange means connection lines are hidden.'],
  ['⬜', 'Toggle spatial cell boundaries. Blue means boundaries are hidden.'],
  ['2D / 3D', 'Switch between the 3D scene and the live 2D diagram.'],
  ['🗑', 'Delete all objects in the current space after confirmation.'],
  ['⟳', 'Rescan the repository connected to the current diagram.'],
  ['BG', 'Start a server-side background scan, or cancel the active background job.'],
  ['i', 'Show repository analysis when the 2D diagram is ready.'],
  ['☰ Workflow', 'Open LLM task tickets and workflow controls.'],
  ['☑ Plan', 'Open the LLM task plan.'],
  ['◇ Templates', 'Create repeated object templates. Choose object type, count, spacing, shape, and orientation.'],
  ['⤓', 'Download the generated Merfolk diagram markdown.'],
  ['M', 'Upload a .md or .markdown file containing Merfolk diagrams.'],
  ['⊞', 'Upload a .csv file to create a 3D data visualisation.'],
  ['Object search', 'Search objects in the space and jump the camera to a result.'],
];

const Section = ({ id, title, children }) => (
  <section id={id} className="faq-section">
    <h2>{title}</h2>
    {children}
  </section>
);

const KeyTable = ({ rows }) => (
  <div className="faq-table-wrap">
    <table className="faq-table">
      <thead>
        <tr>
          <th>Control</th>
          <th>What it does</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([control, description]) => (
          <tr key={control}>
            <td>{control}</td>
            <td>{description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StepList = ({ items }) => (
  <ol className="faq-steps">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ol>
);

const FaqPage = ({ onClose }) => (
  <div className="faq-page" role="region" aria-label="Frequently asked questions">
    <header className="faq-header">
      <div>
        <p className="faq-eyebrow">Help</p>
        <h1>Frequently asked questions</h1>
        <p className="faq-intro">
          A practical guide to building diagrams, connecting code, choosing models,
          and collaborating in Volscape. This page is available from the FAQ button
          in the top bar whether you are signed in or browsing anonymously.
        </p>
      </div>
      <button type="button" className="faq-back" onClick={onClose}>
        ← Back
      </button>
    </header>

    <div className="faq-layout">
      <nav className="faq-nav" aria-label="FAQ sections">
        {NAV_ITEMS.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="faq-content">
        <Section id="getting-started" title="Getting started">
          <p>
            Use Register to create an account, or Try Without Account to open a
            guest space. Opening or creating a space shows the 3D scene, the object
            toolbar, and the space top bar. Signing in unlocks chat, GitHub
            scanning, LLM providers, organizations, and sharing.
          </p>
        </Section>

        <Section id="objects" title="Adding objects manually">
          <p>
            The tools panel sits on the left side of a space. Click a shape button
            to add it to the scene, then click the new object to open its contextual
            menu. Use the menu to rename, move, resize, recolour, inspect, follow,
            or delete the object.
          </p>
          <KeyTable rows={TOOL_BUTTONS} />
          <p>
            Octahedrons are produced by scans and Merfolk Markdown imports. They
            use the same menu as cubes and tetrahedrons, so the solid-object
            instructions below apply to all of them.
          </p>
        </Section>

        <Section id="solid-menu" title="Cube, tetrahedron, and octahedron menu">
          <p>
            Cubes, tetrahedrons, and octahedrons share the ObjectUI menu. Select a
            solid object to open it. Active tools are highlighted green.
          </p>
          <KeyTable rows={SOLID_TOOLS} />
          <p>
            Clicking a face or header text opens the text style controls, where you
            can change size and colour. The code button is greyed out when the
            object has no associated source file.
          </p>
        </Section>

        <Section id="planes" title="Plane objects">
          <p>
            Planes are flat surfaces for visual content. Select a plane to open its
            FaceUI menu, then use the extra plane-only tools below.
          </p>
          <KeyTable rows={PLANE_TOOLS} />
          <p>
            Click the face text or the header text to open text styling. The border
            menu lets you switch between solid, dashed, and dotted borders, choose
            a border colour, and cycle line thickness. Webcam and screen share can
            be broadcast to other viewers in the space.
          </p>
        </Section>

        <Section id="text" title="Text objects">
          <p>
            Double-click a text object to edit its wording. Select it to open the
            text toolbar.
          </p>
          <KeyTable rows={TEXT_TOOLS} />
        </Section>

        <Section id="chat" title="SpaceChat, GitHub, and repository scanning">
          <p>
            Open the ✦ Chat &amp; AI button near the lower-left tools panel. The
            small arrow opens chat options: Group chat, Ask AI, and Code &amp; scan.
            Chat requires a logged-in account; anonymous visitors see a locked
            chat button.
          </p>
          <StepList
            items={[
              'Open a chat and choose Plan or Code.',
              'Click the GitHub icon in the chat header to open the GitHub panel.',
              'Click Connect to GitHub and approve the OAuth flow.',
              'Click Select repo to load your repositories, or New repo to create one.',
              'Click a repository to select it and start a scan that generates the diagram.',
              'Use Switch to change branches. Use the top bar rescan or BG buttons to rescan later.',
            ]}
          />
          <p>
            The Branch Strategy dialog chooses where AI-written changes are
            committed: main/master, a new branch, or an existing branch.
          </p>
        </Section>

        <Section id="models" title="LLM providers and API keys">
          <p>
            Plan and Code chats need an LLM provider. Click the provider or model
            button above the message input, choose a provider, enter its API key,
            and select Fetch Models. Then search and choose a model from the
            Select Model list. Free models are labelled “- free”.
          </p>
          <KeyTable rows={PROVIDERS} />
          <p>
            If the model list cannot be fetched, the API key panel shows the error
            and lets you retry or enter a model name manually. Opencode Zen&apos;s
            free tier can hit a shared per-IP daily limit; switch to Anthropic,
            Google Gemini, or Nvidia for more reliable access.
          </p>
        </Section>

        <Section id="orgs" title="Organizations, invites, and sharing">
          <p>
            Click the organization name in the top bar, or the Organization entry
            in the side menu, to open the Organization Manager. From there you can
            create an organization, accept or decline pending invites, invite
            users, remove members, change the plan, leave an organization, or
            delete one if you are the owner. Admins and owners see the management
            controls.
          </p>
          <p>
            On the landing page, the Shared column in the spaces table shows the
            space state: Private, Shared, or Open. Click the + button in that cell
            to open the Share dialog.
          </p>
          <StepList
            items={[
              'Choose Everyone to make the space open.',
              'Choose Organization to share with every member of your organization.',
              'Choose Share with members, search, and tick individual organization members.',
              'Click Share to apply the access rule.',
            ]}
          />
          <p>
            Spaces shared with you appear under Shared With You in the spaces
            table, with an option to leave a shared space.
          </p>
        </Section>

        <Section id="topbar" title="Space top bar actions">
          <p>
            The ⋯ button on narrow screens expands the actions list. On wider
            screens the buttons are shown inline. These are the controls inside
            the space top bar actions area.
          </p>
          <KeyTable rows={ACTION_BUTTONS} />
          <p>
            The far-left ☰ button toggles the side menu. The organization name
            opens the Organization Manager. Your avatar opens the account menu,
            with Admin for authorized admins and Logout. On the logged-out landing
            page, Features opens the feature guide and Sign In starts login. The
            FAQ button is always available on the landing top bar.
          </p>
        </Section>
      </div>
    </div>
  </div>
);

FaqPage.displayName = 'FaqPage';

export default React.memo(FaqPage);
