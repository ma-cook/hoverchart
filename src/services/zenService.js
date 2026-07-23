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

const SCENE_CONTEXT_BUDGET = 8000;
const PLAN_CONTEXT_BUDGET = 2000;

function buildCodeSceneContext(objects) {
  if (!objects || objects.length === 0) return 'No architecture objects found in the scene.\n';

  const lines = [];
  const merfolkObjects = objects.filter(o => o.merfolkData?.nodeId && !o.merfolkData?.isContainer);

  lines.push('=== SYSTEM ARCHITECTURE ===\n');
  let charCount = lines[0].length;
  let truncated = 0;

  for (const obj of merfolkObjects) {
    const nodeId = obj.merfolkData.nodeId;
    const nodeType = obj.merfolkData.nodeType || obj.type || 'unknown';
    const name = obj.headerText || nodeId;
    const entry = `[${nodeId}] ${nodeType} — "${name}"`;

    if (obj.metadata?.code) {
      const preview = obj.metadata.code.slice(0, 200).replace(/\n/g, '\\n');
      const codeEntry = `  Existing code (${obj.metadata.codeLanguage || 'unknown'}, ${obj.merfolkData?.codeFilePath || obj.metadata.codeFilePath || 'unknown path'}):\n  \`${preview}...\``;
      const entryLen = entry.length + codeEntry.length + 2;
      if (charCount + entryLen > SCENE_CONTEXT_BUDGET) { truncated++; continue; }
      lines.push(entry);
      lines.push(codeEntry);
      charCount += entryLen;
    } else {
      if (charCount + entry.length + 1 > SCENE_CONTEXT_BUDGET) { truncated++; continue; }
      lines.push(entry);
      charCount += entry.length + 1;
    }
  }

  if (truncated > 0) {
    lines.push(`\n... and ${truncated} more objects (truncated for context size)`);
  }

  const connections = objects.reduce((acc, o) => {
    if (o.merfolkData?.nodeId) acc.add(o.merfolkData.nodeId);
    return acc;
  }, new Set());

  if (connections.size > 0) {
    const nodeHeader = '\n=== NODES IN SCENE ===';
    if (charCount + nodeHeader.length < SCENE_CONTEXT_BUDGET) {
      lines.push(nodeHeader);
      for (const id of connections) {
        const nodeLine = `- ${id}`;
        if (charCount + nodeLine.length + 1 > SCENE_CONTEXT_BUDGET) break;
        lines.push(nodeLine);
        charCount += nodeLine.length + 1;
      }
    }
  }

  let planContext = getAllPlanContext();
  if (planContext) {
    if (planContext.length > PLAN_CONTEXT_BUDGET) {
      planContext = planContext.slice(0, PLAN_CONTEXT_BUDGET) + '\n... (plans truncated)';
    }
    if (charCount + planContext.length < SCENE_CONTEXT_BUDGET) {
      lines.push(planContext);
    }
  }

  return lines.join('\n');
}

import { sendToProvider } from './llmProviders';
import useLlmStore from '../stores/llmStore';
import { getAllPlanContext } from './planService';
import { getRepoTree, getFileContents } from './githubIssuesService';
import { getContentStore, ContentCategory } from './context/contentStore';
import { getBase64Store } from './context/base64Store';
import { buildContext } from './context/contextBuilder';
import useCodeStore from '../stores/codeStore';
import useObjectsStore from '../stores/objectsStore';
import { getContentStoreWorker } from '../workers/contentStoreWorkerClient';
import useContentIndexStore from '../stores/contentIndexStore';

const CONFIG_FILE_PATTERNS = [
  'package.json', 'tsconfig.json', 'vite.config.js', 'vite.config.ts',
  'webpack.config.js', 'next.config.js', 'next.config.mjs',
  'src/index.jsx', 'src/index.js', 'src/index.tsx', 'src/index.ts',
  'src/main.jsx', 'src/main.js', 'src/main.tsx', 'src/main.ts',
  'src/App.jsx', 'src/App.js', 'src/App.tsx', 'src/App.ts',
  'app/layout.tsx', 'app/page.tsx',
  'index.html', 'index.htm',
];

const HIGH_PRIORITY_PATTERNS = [
  /stores?\/.*\.(js|jsx|ts|tsx)$/i,
  /services?\/.*\.(js|jsx|ts|tsx)$/i,
  /hooks?\/.*\.(js|jsx|ts|tsx)$/i,
  /components?\/.*\.(js|jsx|ts|tsx)$/i,
  /api[-_]?client\.(js|jsx|ts|tsx)$/i,
  /AppShell\.(js|jsx|ts|tsx)$/i,
  /Router\.(js|jsx|ts|tsx)$/i,
];

const CONFIG_FILE_SET = new Set(CONFIG_FILE_PATTERNS.map(p => p.toLowerCase()));

function isConfigFile(path) {
  if (typeof path !== 'string') return false;
  const lower = path.toLowerCase();
  if (CONFIG_FILE_SET.has(lower)) return true;
  const basename = lower.split('/').pop();
  return CONFIG_FILE_SET.has(basename);
}

const KEY_FILE_BUDGET_CHARS = 50000;
const MAX_KEY_FILES = 60;

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

    const configPaths = filePaths.filter(isConfigFile);
    const highPriorityPaths = filePaths.filter(p =>
      !isConfigFile(p) && HIGH_PRIORITY_PATTERNS.some(re => re.test(p))
    );
    const candidatePaths = [...configPaths, ...highPriorityPaths].slice(0, MAX_KEY_FILES + 20);

    const fileContents = {};
    let totalChars = 0;

    const fetches = candidatePaths.map(async (path) => {
      const result = await getFileContents(token, owner, repo, path, branch);
      if (result.ok && result.data) {
        try {
          const raw = atob(result.data.content);
          const decoded = decodeURIComponent(escape(raw));
          return { path, content: decoded };
        } catch {}
      }
      return null;
    });

    const results = await Promise.all(fetches);
    for (const r of results) {
      if (!r) continue;
      if (Object.keys(fileContents).length >= MAX_KEY_FILES) break;
      if (totalChars + r.content.length > KEY_FILE_BUDGET_CHARS) continue;
      fileContents[r.path] = r.content;
      totalChars += r.content.length;
    }

    console.log(`[fetchRepoContext] Pre-loaded ${Object.keys(fileContents).length} files (${totalChars} chars) into ContentStore`);

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

export async function sendToZen({ messages, tools, onChunk, signal }) {
  const { providerId, apiKey, selectedModel } = useLlmStore.getState();

  if (!providerId || !apiKey || !selectedModel) {
    throw new Error('LLM not configured. Click the model button to set up a provider.');
  }

  console.log(`[sendToZen] Calling provider=${providerId} model=${selectedModel} messages=${messages.length} tools=${tools ? tools.length : 0}`);

  const result = await sendToProvider({
    providerId,
    apiKey,
    model: selectedModel,
    messages,
    tools,
    onChunk,
    signal,
  });

  if (tools && tools.length > 0) return result;
  return result.text;
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

export function buildGraphSummary(diagramStore) {
  const diagrams = diagramStore?.graphs || [];
  const hierarchy = diagramStore?.hierarchy || {};

  const nodeCounts = { components: 0, functions: 0, stores: 0, services: 0, hooks: 0, other: 0 };
  const connections = [];
  const rootNodes = [];

  for (const graph of diagrams) {
    if (!graph?.nodes) continue;
    for (const [, node] of graph.nodes) {
      const type = (node.type || '').toLowerCase();
      if (type === 'component') nodeCounts.components++;
      else if (type === 'function') nodeCounts.functions++;
      else if (type === 'store') nodeCounts.stores++;
      else if (type === 'service') nodeCounts.services++;
      else if (type === 'hook') nodeCounts.hooks++;
      else nodeCounts.other++;
    }
  }

  for (const graph of diagrams) {
    if (!graph?.connections) continue;
    for (const [, conn] of graph.connections) {
      connections.push(`${conn.source} --> ${conn.target}${conn.label ? ': ' + conn.label : ''}`);
      if (connections.length >= 30) break;
    }
    if (connections.length >= 30) break;
  }

  if (hierarchy?.rootNodes) {
    for (const nodeId of hierarchy.rootNodes) {
      rootNodes.push(nodeId);
    }
  }

  const totalNodes = Object.values(nodeCounts).reduce((a, b) => a + b, 0);
  if (totalNodes === 0) return '';

  const lines = [`GRAPH OVERVIEW: ${totalNodes} nodes (${nodeCounts.components} components, ${nodeCounts.functions} functions, ${nodeCounts.stores} stores, ${nodeCounts.services} services, ${nodeCounts.hooks} hooks)`];
  if (rootNodes.length > 0) lines.push(`Root nodes: ${rootNodes.join(', ')}`);
  if (connections.length > 0) lines.push(`Key connections:\n${connections.map(c => `  ${c}`).join('\n')}`);

  return lines.join('\n');
}

const CODE_GEN_SYSTEM_PROMPT = `You are a code generation expert. Generate production-ready code based on the user's request.

═══════════════════════════════════════════════════════════════
REPOSITORY STRUCTURE
═══════════════════════════════════════════════════════════════

The repository already has files. You MUST respect the existing file structure and import paths.

FILE TREE:
{fileTree}

COMPONENT INDEX (component → file):
{componentIndex}

SCENE COMPONENTS:
{sceneContext}

GRAPH OVERVIEW:
{graphSummary}

TECH STACK: {techStack}

═══════════════════════════════════════════════════════════════
TOOLS
═══════════════════════════════════════════════════════════════

You have these tools:
• read_file(path) — read a source file's contents
• list_files(path) — list files in a directory
• search_code(pattern) — search for files matching a pattern or by node name
• get_node_info(nodeId) — get full details about a component: type, file path, all connections, parent, children
• get_dependencies(nodeId, direction) — find upstream (who depends on me) or downstream (what I depend on) relationships
• find_path(source, target) — find shortest data-flow path between two components
• search_nodes(query) — search components, functions, stores, or hooks by name/type in the diagram

Use search_code or search_nodes to find WHERE each component is defined before reading files. Use get_node_info or get_dependencies to understand component relationships. Call read_file for ALL files you need in ONE round.

═══════════════════════════════════════════════════════════════
WORKFLOW
═══════════════════════════════════════════════════════════════

1. Read the user request and identify which components/files are affected
2. Use search_nodes or search_code to find WHERE each component is defined
3. Use get_node_info on key components to understand their connections and dependencies
4. If modifying a component, use get_dependencies to check the blast radius of changes
5. Call read_file for ALL files you need to modify in a SINGLE tool-use round
6. In your NEXT response, output the complete modified files as code blocks

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Write a 1-2 sentence summary, then output code blocks:

\`\`\`javascript:src/components/Button.jsx
import { useState } from 'react';
export function Button() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
\`\`\`

For NEW files, use the same format with a path that doesn't exist yet.

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

1. ALWAYS search for component definitions before creating new files
2. PRESERVE existing file paths — do NOT invent new paths
3. Use the SAME import paths the existing code uses
4. Every code block MUST be a complete, valid file — no placeholders
5. Maximum 10 code blocks per response
6. Use modern syntax and best practices for the target framework
7. NEVER create a new file for a component that already exists in another file`;

function buildFileTreeSection(fileTree) {
  if (!fileTree || fileTree.length === 0) return '(no repository files available)';
  const capped = fileTree.length > 200 ? fileTree.slice(0, 200) : fileTree;
  const suffix = fileTree.length > 200 ? `\n... and ${fileTree.length - 200} more files` : '';
  return capped.join('\n') + suffix;
}

export function buildComponentIndex(objects) {
  if (!objects || objects.length === 0) return '(no scene components)';

  const byFile = new Map();
  let noFile = 0;

  for (const obj of objects) {
    if (!obj.merfolkData?.nodeId) continue;
    if (obj.merfolkData?.isContainer) continue;
    const filePath = obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '';
    const name = obj.headerText || obj.merfolkData.nodeId;
    const type = obj.merfolkData.nodeType || obj.type || '';
    if (filePath) {
      if (!byFile.has(filePath)) byFile.set(filePath, []);
      byFile.get(filePath).push({ name, type, nodeId: obj.merfolkData.nodeId });
    } else {
      noFile++;
    }
  }

  const lines = [];
  let charCount = 0;
  const BUDGET = 3000;

  const sorted = [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [filePath, entries] of sorted) {
    const entryNames = entries.map(e => `${e.type}:${e.name}`).join(', ');
    const line = `${filePath}: ${entryNames}`;
    if (charCount + line.length + 1 > BUDGET) break;
    lines.push(line);
    charCount += line.length + 1;
  }

  if (noFile > 0) lines.push(`(${noFile} components without file path)`);
  return lines.length > 0 ? lines.join('\n') : '(no scene components)';
}

export function parseSectionedResponse(text, fileContents) {
  const sectionRegex = /```section-(\d+):([^\n]+)\n([\s\S]*?)```/g;
  const fileSections = {};
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const sectionNum = parseInt(match[1], 10);
    const filePath = match[2].trim();
    const content = match[3];

    if (!fileSections[filePath]) fileSections[filePath] = [];
    fileSections[filePath].push({ index: sectionNum - 1, content });
  }

  const reassembled = {};
  for (const [filePath, sections] of Object.entries(fileSections)) {
    const original = fileContents?.[filePath];
    if (!original) continue;

    const sorted = [...sections].sort((a, b) => a.index - b.index);
    const totalExpected = Math.ceil(original.split('\n').length / 200);

    if (sorted.length < totalExpected) continue;

    reassembled[filePath] = sorted.map(s => {
      const c = s.content;
      return c.endsWith('\n') ? c.slice(0, -1) : c;
    }).join('\n');
  }

  return reassembled;
}

const SCENE_COMPONENT_BUDGET = 2000;

function buildMinimalSceneContext(objects) {
  if (!objects || objects.length === 0) return '(no scene components)';
  const lines = [];
  let charCount = 0;
  let truncated = 0;

  for (const obj of objects) {
    if (!obj.merfolkData?.nodeId) continue;
    const nodeId = obj.merfolkData.nodeId;
    const nodeType = obj.merfolkData.nodeType || obj.type || 'unknown';
    const name = obj.headerText || nodeId;
    const filePath = obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '';
    const line = filePath ? `[${nodeId}] ${nodeType} — "${name}" → ${filePath}` : `[${nodeId}] ${nodeType} — "${name}"`;

    if (charCount + line.length + 1 > SCENE_COMPONENT_BUDGET) { truncated++; continue; }
    lines.push(line);
    charCount += line.length + 1;
  }

  if (truncated > 0) lines.push(`... and ${truncated} more components`);
  return lines.length > 0 ? lines.join('\n') : '(no scene components)';
}

export async function buildCodeGenMessages({ userRequest, sceneObjects, techStack = '', repoContext }) {
  const techStackSection = techStack || 'Not specified — use your best judgment.';
  const fileTreeSection = buildFileTreeSection(repoContext?.fileTree);
  const componentIndexSection = buildComponentIndex(sceneObjects);
  const sceneContextSection = buildMinimalSceneContext(sceneObjects);

  const diagramStore = repoContext?.diagramStore;
  const graphSummarySection = buildGraphSummary(diagramStore);

  const systemContent = CODE_GEN_SYSTEM_PROMPT
    .replace('{fileTree}', fileTreeSection)
    .replace('{componentIndex}', componentIndexSection)
    .replace('{sceneContext}', sceneContextSection)
    .replace('{graphSummary}', graphSummarySection || '(no graph available)')
    .replace('{techStack}', techStackSection);

  console.log(`[buildCodeGenMessages] Sizes: fileTree=${fileTreeSection.length} componentIndex=${componentIndexSection.length} sceneContext=${sceneContextSection.length} graphSummary=${graphSummarySection.length} total=${systemContent.length}`);

  const systemMessage = { role: 'system', content: systemContent };

  return [systemMessage, { role: 'user', content: userRequest }];
}
