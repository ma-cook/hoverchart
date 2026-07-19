const PLAN_SYSTEM_PROMPT = `You are a software architecture expert and diagram assistant. You help users design, discuss, and refine system architectures.

═══════════════════════════════════════════════════════════════
MERFOLK DIAGRAM SYNTAX REFERENCE
═══════════════════════════════════════════════════════════════

When asked to CREATE or MODIFY a system architecture diagram, use Merfolk syntax inside \`\`\`merfolk code blocks:

%% Comments (ignored by parser)
%% This is a comment
App{Component: Main Application}  %% inline comment

NODE TYPES — Bracket style determines 3D geometry:
  {Component: Name}  → Dodecahedron  (UI components, pages, containers)
  [Function: Name]   → Cube          (functions, methods, utilities)
  [[Store: Name]]    → Cube          (databases, state stores, data models)
  ((Service: Name))  → Tetrahedron   (external services, APIs, microservices)
  <Library: Name>    → Cube          (external libraries, dependencies)
  [Hook: Name]       → Cube          (React hooks, custom hooks)
  [Module: Name]     → Cube          (modules, namespaces)

CONNECTION TYPES — Arrow style determines visual line:
  A --> B    Data Flow    Solid arrow    (primary connection type, use this by default)
  A -.-> B   Control Flow Dashed arrow   (events, control signals, conditional flow)
  A --- B    Association  Solid line     (general relationships)
  A == B     Inheritance  Thick line     (inheritance, strong dependencies)
  A *--> B   Composition  Filled arrow   (ownership, contains)
  A ..> B    Dependency   Dotted arrow   (imports, dependencies)

LABELED CONNECTIONS — Add description after colon:
  A --> B : "description"
  A -.-> B : "event trigger"

FACE CONNECTIONS — Target specific face of a 3D object:
  A@front --> B@back
  C@top --> D@bottom
  Cubes: front, back, top, bottom, left, right
  Dodecahedrons: face_0 through face_11

NODE PROPERTIES — Inline customization:
  App{Component: Main Application} {color: "blue", scale: "2,1,1"}
  DataService[Function: Data Processing] {color: "#4CAF50"}

FLOW PATHS — Named sequences through multiple nodes:
  flowpath "name" : A --> B --> C --> D
  flowpath "eventPipeline" (-.->): Input --> Transform --> Output
  flowpath "requestLifecycle" : Client --> API --> DB --> Client : "full cycle"

GRAPH DECLARATION (optional):
  graph3d "Title" or ast3d "Title"

DIAGRAM RULES:
1. Always include a root component. Every other component must be reachable.
2. Every node should have at least one connection.
3. Use --> as the default connection type.
4. Generate as many nodes as needed to fully represent the architecture.

═══════════════════════════════════════════════════════════════
CAPABILITIES
═══════════════════════════════════════════════════════════════

You can:
- Create and modify system architecture diagrams using Merfolk syntax
- Answer questions about software architecture, design patterns, and tradeoffs
- Discuss code structure, component relationships, and system design
- Suggest improvements to existing architectures
- Recommend technology stacks and frameworks

When asked a general question, answer conversationally and helpfully.
When asked to create or modify a diagram, output Merfolk inside \`\`\`merfolk blocks.
You may also suggest code structure, file organization, and implementation approaches.`;

const CODE_SYSTEM_PROMPT = `You are a code generation expert. Your task is to generate production-ready code based on the system architecture provided.

═══════════════════════════════════════════════════════════════
ARCHITECTURE CONTEXT
═══════════════════════════════════════════════════════════════

The system architecture is represented as 3D objects in the scene. Each object corresponds to a component, function, service, store, hook, or library in the architecture. The connections between them represent relationships (data flow, control flow, dependencies, etc.).

When generating code:
- Read the architecture context below to understand the system structure
- Generate complete, working code files for each component
- Use the file path conventions appropriate for the project
- Include proper imports, error handling, and edge cases

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

FIRST: Write a brief 2-4 sentence summary of what you are creating or changing. This summary will be shown to the user.

THEN: Output each file as a code block with the file path as the language identifier label:

\`\`\`javascript:src/components/Button.jsx
// NODE: Button
import React from 'react';
export function Button() { ... }
\`\`\`

The // NODE: directive MUST match a nodeId from the architecture context.
This tells the system which architecture component this code belongs to.

If the code has no specific node association, omit the NODE directive.

═══════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════

{techStack}

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

1. Start with a brief summary (2-4 sentences) of what you are doing
2. Generate COMPLETE files - every import, export, type, and function needed
3. Group related files by feature or module
4. Follow idiomatic patterns for the target language/framework
5. Include error handling, input validation, and edge cases
6. Use modern syntax and best practices
7. For EXISTING files shown in context: output ONLY the specific changes using SEARCH/REPLACE markers. Do NOT output the entire file. Use this format:
   <<<<<<< SEARCH
   exact code to find and replace
   =======
   replacement code
   >>>>>>> REPLACE
   You can use multiple SEARCH/REPLACE blocks per file. Each SEARCH block must match the existing code exactly.
8. Keep code blocks as short as possible - split large files into smaller modules
9. Maximum 5 code blocks per response to avoid truncation
10. Files are read-only to users - you are the only one who writes code`;

const FEW_SHOT_EXAMPLES = [
  {
    role: 'user',
    content: 'Create a microservices e-commerce architecture'
  },
  {
    role: 'assistant',
    content: `\`\`\`merfolk
graph3d "E-Commerce Architecture"

%% ── Root ──────────────────────────────────────────
App{Component: E-Commerce App}

%% ── Frontend Components ───────────────────────────
HomePage{Component: HomePage}
ProductCatalog{Component: ProductCatalog}
ShoppingCart{Component: ShoppingCart}
CheckoutPage{Component: CheckoutPage}
AdminDashboard{Component: AdminDashboard}
UserAccount{Component: UserAccount}

%% ── Backend Services ──────────────────────────────
APIGateway((Service: API Gateway))
ProductService((Service: Product Service))
OrderService((Service: Order Service))
PaymentService((Service: Payment Service))
InventoryService((Service: Inventory Service))
NotificationService((Service: Notification Service))
AuthService((Service: Auth Service))

%% ── Data Stores ───────────────────────────────────
ProductDB[[Store: Product Database]]
OrderDB[[Store: Order Database]]
UserDB[[Store: User Database]]
SessionStore[[Store: Session Store]]

%% ── Functions ─────────────────────────────────────
searchProducts[Function: searchProducts]
addToCart[Function: addToCart]
processCheckout[Function: processCheckout]
validatePayment[Function: validatePayment]
updateInventory[Function: updateInventory]
sendEmail[Function: sendEmail]

%% ── Hooks ─────────────────────────────────────────
useCart[Hook: useCart]
useAuth[Hook: useAuth]
useProducts[Hook: useProducts]

%% ── App renders all top-level pages ───────────────
App --> HomePage : "renders"
App --> ProductCatalog : "renders"
App --> ShoppingCart : "renders"
App --> CheckoutPage : "renders"
App --> AdminDashboard : "renders"
App --> UserAccount : "renders"

%% ── Page components use services via API Gateway ──
HomePage --> APIGateway : "fetches data"
ProductCatalog --> APIGateway : "searches products"
ShoppingCart --> APIGateway : "manages cart"
CheckoutPage --> APIGateway : "places order"
AdminDashboard --> APIGateway : "admin operations"
UserAccount --> AuthService : "manages profile"

%% ── API Gateway routes to services ────────────────
APIGateway --> ProductService : "product queries"
APIGateway --> OrderService : "order operations"
APIGateway --> PaymentService : "payment processing"
APIGateway --> InventoryService : "stock checks"
APIGateway --> NotificationService : "user alerts"

%% ── Services connect to data stores ───────────────
ProductService --> ProductDB : "reads/writes"
OrderService --> OrderDB : "creates orders"
PaymentService --> OrderDB : "updates payment status"
InventoryService --> ProductDB : "updates stock"
AuthService --> UserDB : "authenticates"
AuthService --> SessionStore : "manages sessions"

%% ── Functions connect to their parent services ────
searchProducts --> ProductService : "searches"
addToCart --> ShoppingCart : "adds item"
processCheckout --> OrderService : "creates order"
validatePayment --> PaymentService : "validates"
updateInventory --> InventoryService : "decrements stock"
sendEmail --> NotificationService : "sends"

%% ── Hooks provide data to components ──────────────
useCart --> ShoppingCart : "cart state"
useAuth --> UserAccount : "auth state"
useProducts --> ProductCatalog : "product data"

%% ── Control flow for async events ─────────────────
OrderService -.-> NotificationService : "order confirmed"
PaymentService -.-> NotificationService : "payment received"
InventoryService -.-> NotificationService : "low stock"

%% ── Flow Paths ────────────────────────────────────
flowpath "Purchase Flow" : HomePage --> ProductCatalog --> ShoppingCart --> CheckoutPage --> APIGateway --> OrderService --> PaymentService --> OrderService --> NotificationService
flowpath "Admin Flow" : AdminDashboard --> APIGateway --> ProductService --> ProductDB
flowpath "Auth Flow" : UserAccount --> AuthService --> UserDB --> SessionStore
\`\`\``
  },
  {
    role: 'user',
    content: 'Design a real-time chat application'
  },
  {
    role: 'assistant',
    content: `\`\`\`merfolk
graph3d "Real-Time Chat App"

%% ── Root ──────────────────────────────────────────
App{Component: Chat Application}

%% ── Frontend Components ───────────────────────────
LoginScreen{Component: Login Screen}
ChatRoom{Component: Chat Room}
UserList{Component: User List}
MessagePanel{Component: Message Panel}
SettingsPage{Component: Settings Page}

%% ── Backend Services ──────────────────────────────
AuthService((Service: Auth Service))
ChatService((Service: Chat Service))
PresenceService((Service: Presence Service))
FileService((Service: File Service))

%% ── Data Stores ───────────────────────────────────
MessageDB[[Store: Message Database]]
UserDB[[Store: User Database]]
ChannelStore[[Store: Channel Store]]

%% ── Functions ─────────────────────────────────────
sendMessage[Function: sendMessage]
fetchMessages[Function: fetchMessages]
createChannel[Function: createChannel]
uploadFile[Function: uploadFile]

%% ── Hooks ─────────────────────────────────────────
useMessages[Hook: useMessages]
useOnlineUsers[Hook: useOnlineUsers]

%% ── App renders all screens ───────────────────────
App --> LoginScreen : "renders"
App --> ChatRoom : "renders"
App --> SettingsPage : "renders"

%% ── Chat Room contains sub-components ─────────────
ChatRoom --> UserList : "shows"
ChatRoom --> MessagePanel : "shows"

%% ── Components connect to services ────────────────
LoginScreen --> AuthService : "authenticates"
ChatRoom --> ChatService : "sends/receives"
UserList --> PresenceService : "tracks online"
MessagePanel --> ChatService : "loads history"
SettingsPage --> AuthService : "updates profile"

%% ── Services connect to stores ────────────────────
ChatService --> MessageDB : "stores messages"
ChatService --> ChannelStore : "manages channels"
AuthService --> UserDB : "user accounts"
PresenceService --> UserDB : "reads profiles"
FileService --> MessageDB : "attaches files"

%% ── Functions connect to their context ────────────
sendMessage --> MessagePanel : "triggers"
fetchMessages --> MessagePanel : "loads"
createChannel --> ChatService : "creates"
uploadFile --> FileService : "uploads"

%% ── Hooks provide data to components ──────────────
useMessages --> MessagePanel : "message state"
useOnlineUsers --> UserList : "presence state"

%% ── Control flow for real-time events ─────────────
ChatService -.-> MessagePanel : "new message"
PresenceService -.-> UserList : "user joined/left"

%% ── Flow Paths ────────────────────────────────────
flowpath "Message Flow" : MessagePanel --> sendMessage --> ChatService --> MessageDB --> MessagePanel
flowpath "Login Flow" : LoginScreen --> AuthService --> UserDB --> ChatRoom
flowpath "File Upload" : MessagePanel --> uploadFile --> FileService --> MessageDB
\`\`\``
  },
  {
    role: 'user',
    content: 'Create a React component library with hooks and state management'
  },
  {
    role: 'assistant',
    content: `\`\`\`merfolk
graph3d "React Component Library"

%% ── Root ──────────────────────────────────────────
App{Component: Component Library}

%% ── Core Components ───────────────────────────────
Button{Component: Button}
Modal{Component: Modal}
DataTable{Component: DataTable}
Form{Component: Form}
Toast{Component: Toast}
Dropdown{Component: Dropdown}

%% ── Hooks ─────────────────────────────────────────
useTheme[Hook: useTheme]
useForm[Hook: useForm]
useModal[Hook: useModal]
useTableData[Hook: useTableData]

%% ── State Stores ──────────────────────────────────
ThemeStore[[Store: Theme Store]]
FormStore[[Store: Form Store]]

%% ── Utility Functions ─────────────────────────────
formatDate[Function: formatDate]
validateInput[Function: validateInput]
debounce[Function: debounce]

%% ── External Libraries ────────────────────────────
ReactLib<Library: React>
styledComponents<Library: styled-components>

%% ── App exports all components ────────────────────
App --> Button : "exports"
App --> Modal : "exports"
App --> DataTable : "exports"
App --> Form : "exports"
App --> Toast : "exports"
App --> Dropdown : "exports"

%% ── Components use hooks ──────────────────────────
Button -.-> useTheme : "reads theme"
Modal -.-> useModal : "manages state"
DataTable -.-> useTableData : "fetches data"
Form -.-> useForm : "manages form"
Toast -.-> useTheme : "reads theme"

%% ── Hooks connect to stores ───────────────────────
useTheme --> ThemeStore : "reads/writes"
useForm --> FormStore : "reads/writes"
useTableData --> ThemeStore : "reads theme"

%% ── Functions used by components ──────────────────
Form --> validateInput : "validates"
DataTable --> formatDate : "formats cells"
DataTable --> debounce : "search debounce"

%% ── Component composition ─────────────────────────
Modal *--> Button : "contains cancel"
Modal *--> Button : "contains confirm"
Form *--> Button : "contains submit"
Dropdown *--> Button : "triggers"

%% ── Library dependencies ──────────────────────────
Button --> ReactLib : "uses"
Modal --> ReactLib : "uses"
DataTable --> ReactLib : "uses"
Form --> ReactLib : "uses"
Button --> styledComponents : "styles"
Modal --> styledComponents : "styles"

%% ── Flow Paths ────────────────────────────────────
flowpath "Theme Flow" : App --> useTheme --> ThemeStore --> Button --> styledComponents
flowpath "Form Submit" : Form --> useForm --> FormStore --> validateInput --> Button
\`\`\``
  }
];

function buildSceneContext(objects) {
  if (!objects || objects.length === 0) return '';

  const nodes = objects
    .filter(o => o.merfolkData?.nodeId && !o.merfolkData?.isContainer)
    .map(o => {
      const nodeId = o.merfolkData.nodeId;
      const nodeType = o.merfolkData.nodeType || o.type || 'unknown';
      const name = o.headerText || nodeId;
      const hasCode = o.metadata?.code ? ' [code attached]' : '';
      return `- ${nodeId} (${nodeType}) — ${name}${hasCode}`;
    });

  const planContext = getAllPlanContext();

  if (nodes.length === 0) return planContext || '';

  return `\nEXISTING OBJECTS IN SCENE:\n${nodes.join('\n')}\n\nWhen asked to modify or extend the diagram, reference existing node IDs to create connections to them. Do NOT redefine existing nodes unless explicitly asked — only add new nodes and connections.${planContext}`;
}

function buildCodeSceneContext(objects) {
  if (!objects || objects.length === 0) return 'No architecture objects found in the scene.\n';

  const lines = [];
  const merfolkObjects = objects.filter(o => o.merfolkData?.nodeId && !o.merfolkData?.isContainer);

  lines.push('=== SYSTEM ARCHITECTURE ===\n');
  for (const obj of merfolkObjects) {
    const nodeId = obj.merfolkData.nodeId;
    const nodeType = obj.merfolkData.nodeType || obj.type || 'unknown';
    const name = obj.headerText || nodeId;
    lines.push(`[${nodeId}] ${nodeType} — "${name}"`);

    if (obj.metadata?.code) {
      const preview = obj.metadata.code.slice(0, 200).replace(/\n/g, '\\n');
      lines.push(`  Existing code (${obj.metadata.codeLanguage || 'unknown'}, ${obj.metadata.codeFilePath || 'unknown path'}):`);
      lines.push(`  \`${preview}...\``);
    }
  }

  const connections = objects.reduce((acc, o) => {
    if (o.merfolkData?.nodeId) acc.add(o.merfolkData.nodeId);
    return acc;
  }, new Set());

  if (connections.size > 0) {
    lines.push('\n=== NODES IN SCENE ===');
    for (const id of connections) lines.push(`- ${id}`);
  }

  const planContext = getAllPlanContext();
  if (planContext) lines.push(planContext);

  return lines.join('\n');
}

import { sendToProvider } from './llmProviders';
import useLlmStore from '../stores/llmStore';
import { getAllPlanContext } from './planService';
import { getRepoTree, getFileContents } from './githubIssuesService';
import { getContentStore, ContentCategory } from './context/contentStore';
import { getBase64Store } from './context/base64Store';
import { buildContext } from './context/contextBuilder';
import { RETRIEVAL_PROTOCOL_PROMPT } from './context/retrievalPrompt';
import useCodeStore from '../stores/codeStore';
import useObjectsStore from '../stores/objectsStore';
import { getContentStoreWorker } from '../workers/contentStoreWorkerClient';
import useContentIndexStore from '../stores/contentIndexStore';

const KEY_FILE_PATTERNS = [
  'package.json', 'tsconfig.json', 'vite.config.js', 'vite.config.ts',
  'webpack.config.js', 'next.config.js', 'next.config.mjs',
  'src/index.jsx', 'src/index.js', 'src/index.tsx', 'src/index.ts',
  'src/main.jsx', 'src/main.js', 'src/main.tsx', 'src/main.ts',
  'src/App.jsx', 'src/App.js', 'src/App.tsx', 'src/App.ts',
  'app/layout.tsx', 'app/page.tsx',
  'index.html', 'index.htm',
];

function isKeyFile(path) {
  if (typeof path !== 'string') return false;
  const lower = path.toLowerCase();
  return KEY_FILE_PATTERNS.some(p => lower === p || lower.endsWith('/' + p));
}

export async function fetchRepoContext(token, owner, repo, branch) {
  try {
    const treeResult = await getRepoTree(token, owner, repo, branch);
    if (!treeResult.ok || !treeResult.data?.tree) {
      return { fileTree: [], fileContents: {}, error: treeResult.error };
    }

    await new Promise(r => setTimeout(r, 0));

    const treeEntries = treeResult.data.tree;
    const entries = treeEntries.filter(e => e.type === 'blob');
    const filePaths = entries.map(e => e.path).filter(p => typeof p === 'string').slice(0, 5000);

    const filesToFetch = filePaths.filter(isKeyFile).slice(0, 30);

    const fileContents = {};
    await Promise.all(filesToFetch.map(async (path) => {
      const result = await getFileContents(token, owner, repo, path, branch);
      if (result.ok && result.data) {
        try {
          const raw = atob(result.data.content);
          fileContents[path] = decodeURIComponent(escape(raw));
        } catch {}
      }
    }));

    return { fileTree: filePaths, fileContents, error: null };
  } catch (err) {
    console.error('[fetchRepoContext] step failed:', err.message, err.stack);
    throw err;
  }
}

const POPULATE_YIELD_EVERY = 50;

export async function populateContentStore() {
  const store = getContentStore();
  const codeState = useCodeStore.getState();

  if (codeState.repoFileContents) {
    const entries = Object.entries(codeState.repoFileContents);
    for (let i = 0; i < entries.length; i++) {
      const [filePath, content] = entries[i];
      store.upsert(
        `repo:${filePath}`,
        ContentCategory.REPO_FILE,
        content,
        { sourcePath: filePath, tags: ['repo', 'code'] }
      );
      if (i % POPULATE_YIELD_EVERY === 0 && i > 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  const objects = useObjectsStore.getState().objects;
  if (objects && objects.length > 0) {
    const BATCH = 10;
    let upsertIdx = 0;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj.merfolkData?.nodeId || obj.merfolkData?.isContainer) continue;
      const nodeId = obj.merfolkData.nodeId;
      const nodeType = obj.merfolkData.nodeType || obj.type || 'unknown';
      const name = obj.headerText || nodeId;
      const hasCode = obj.metadata?.code ? '\n' + obj.metadata.code : '';
      const text = `[${nodeId}] (${nodeType}) "${name}"${hasCode}`;
      store.upsert(`scene:${nodeId}`, ContentCategory.SCENE_CONTEXT, text, {
        sourcePath: 'scene',
        tags: ['architecture', 'scene', nodeId],
      });
      upsertIdx++;
      if (upsertIdx % BATCH === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  const planContext = getAllPlanContext();
  if (planContext) {
    store.upsert('plans:all', ContentCategory.PLAN, planContext, {
      sourcePath: 'plans',
      tags: ['plans'],
    });
  }
}

export async function finalizeContentStore() {
  const store = getContentStore();
  const base64Store = getBase64Store();
  await base64Store.encodeAll();

  const indexState = useContentIndexStore.getState();
  indexState.setManifest(store.getManifest());
  indexState.setTotalChunks(store.totalChunks);
  indexState.setPopulated(Date.now());
}

export async function populateContentStoreWorker() {
  const codeState = useCodeStore.getState();
  const objects = useObjectsStore.getState().objects;
  const planContext = getAllPlanContext();

  const worker = getContentStoreWorker();
  const result = await worker.processContent({
    repoFileContents: codeState.repoFileContents || null,
    objects: (objects || []).map(o => ({
      nodeId: o.merfolkData?.nodeId,
      nodeType: o.merfolkData?.nodeType || o.type,
      name: o.headerText,
      code: o.metadata?.code,
      isContainer: o.merfolkData?.isContainer,
    })),
    planContext: planContext || '',
  });

  getContentStore().hydrate(result.entries, result.invertedIndexEntries, result.totalChunks);
  getBase64Store().hydrate(result.encodedChunksEntries);

  const indexState = useContentIndexStore.getState();
  indexState.setManifest(result.manifest);
  indexState.setTotalChunks(result.totalChunks);
  indexState.setPopulated(Date.now());
}

export async function sendToZen({ messages, onChunk, signal }) {
  const { providerId, apiKey, selectedModel } = useLlmStore.getState();

  if (!providerId || !apiKey || !selectedModel) {
    throw new Error('LLM not configured. Click the model button to set up a provider.');
  }

  return sendToProvider({
    providerId,
    apiKey,
    model: selectedModel,
    messages,
    onChunk,
    signal,
  });
}

export async function buildZenMessages({ llmMessages, sceneObjects, modelId, signal }) {
  const sceneContext = buildSceneContext(sceneObjects);

  const base64Store = getBase64Store();
  const manifest = base64Store.totalChunks > 0 ? '\n\n' + base64Store.generateManifest() : '';

  const { messages } = await buildContext({
    systemPrompt: PLAN_SYSTEM_PROMPT + manifest,
    fewShotExamples: FEW_SHOT_EXAMPLES,
    sceneContextParts: [sceneContext],
    messages: llmMessages,
    modelId,
    signal,
  });

  return messages;
}

export function buildCodeMessages({ llmMessages, sceneObjects, techStack = '', maxMessages = 20 }) {
  const recentMessages = llmMessages.slice(-maxMessages);

  const sceneContext = buildCodeSceneContext(sceneObjects);
  const techStackSection = techStack ? `The project uses: ${techStack}` : 'The tech stack has not been specified yet. Ask the user what language/framework they want to use, or suggest the best choice for this architecture.';
  const systemContent = CODE_SYSTEM_PROMPT.replace('{techStack}', techStackSection) + '\n\n' + sceneContext;

  const systemMessage = { role: 'system', content: systemContent };

  return [systemMessage, ...recentMessages];
}

const CODE_GEN_SYSTEM_PROMPT = `You are a code generation expert. Generate production-ready code based on the user's request and the repository context below.

═══════════════════════════════════════════════════════════════
EXISTING REPOSITORY STRUCTURE
═══════════════════════════════════════════════════════════════

The repository already has files. You MUST respect the existing file structure and import paths.

FILE TREE:
{fileTree}

EXISTING KEY FILES (full content provided):
{existingFiles}

═══════════════════════════════════════════════════════════════
ARCHITECTURE CONTEXT
═══════════════════════════════════════════════════════════════

{sceneContext}

═══════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════

{techStack}

═══════════════════════════════════════════════════════════════
CRITICAL RULE: HOW TO MODIFY EXISTING FILES
═══════════════════════════════════════════════════════════════

NEVER output a complete existing file. You will LOSE code because you cannot fit the entire file in your response.

For ANY file that appears in "EXISTING KEY FILES" above, you MUST use SEARCH/REPLACE markers.
The SEARCH block must be copied EXACTLY from the file content shown above — character for character, including all whitespace and indentation.

You can use multiple SEARCH/REPLACE blocks per file.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

FIRST: Write a brief 1-2 sentence summary of what you are doing.
THEN: Output each file as a code block with the file path as the language identifier.

--- For NEW files (not in the repo), output the complete file ---

\`\`\`javascript:src/components/NewWidget.jsx
// NODE: NewWidget
import React from 'react';
export function NewWidget() { ... }
\`\`\`

--- For EXISTING files, use SEARCH/REPLACE markers ---

\`\`\`javascript:src/components/Button.jsx
<<<<<<< SEARCH
export function Button() {
  return <button>Click</button>;
}
=======
import { useState } from 'react';
export function Button() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
>>>>>>> REPLACE
\`\`\`

The SEARCH block must match the existing code EXACTLY. Copy it verbatim from the "EXISTING KEY FILES" section above.

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

1. Start with a brief 1-2 sentence summary, then output code blocks
2. PRESERVE existing file paths — do NOT invent new paths like "./components/App"
3. EXISTING files → SEARCH/REPLACE markers ONLY. NEVER output a complete existing file. The SEARCH block must match the code shown in "EXISTING KEY FILES" exactly.
4. NEW files → output the complete file from scratch
5. Use the SAME import paths the existing code uses
6. Every NEW file code block MUST be a complete, valid file — no placeholders, no "..." omissions
7. Include error handling and edge cases
8. Maximum 10 code blocks per response
9. Use modern syntax and best practices for the target framework`;

function buildFileTreeSection(fileTree) {
  if (!fileTree || fileTree.length === 0) return '(no repository files available)';
  return fileTree.join('\n');
}

function buildExistingFilesSection(fileContents) {
  if (!fileContents || Object.keys(fileContents).length === 0) return '(no key files available)';
  const sections = [];
  for (const [path, content] of Object.entries(fileContents)) {
    sections.push(`--- ${path} ---\n${content}`);
  }
  return sections.join('\n\n');
}

export async function buildCodeGenMessages({ userRequest, sceneObjects, techStack = '', repoContext }) {
  const sceneContext = buildCodeSceneContext(sceneObjects);
  const techStackSection = techStack || 'Not specified — use your best judgment.';
  const fileTreeSection = buildFileTreeSection(repoContext?.fileTree);
  const existingFilesSection = buildExistingFilesSection(repoContext?.fileContents);

  const base64Store = getBase64Store();
  const manifest = base64Store.totalChunks > 0
    ? '\n\n' + base64Store.generateManifest() + '\n\n' + RETRIEVAL_PROTOCOL_PROMPT
    : '';

  const systemContent = CODE_GEN_SYSTEM_PROMPT
    .replace('{fileTree}', fileTreeSection)
    .replace('{existingFiles}', existingFilesSection)
    .replace('{sceneContext}', sceneContext)
    .replace('{techStack}', techStackSection) + manifest;

  const systemMessage = { role: 'system', content: systemContent };

  return [systemMessage, { role: 'user', content: userRequest }];
}
