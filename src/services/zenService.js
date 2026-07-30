import useDiagramStore from '../stores/diagramStore';

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
import useCodeStore from '../stores/codeStore';
import { getAllPlanContext } from './planService';
import { getRepoTree } from './githubIssuesService';
import { getContentStore } from './context/contentStore';
import { getBase64Store } from './context/base64Store';
import { buildContext } from './context/contextBuilder';
import useObjectsStore from '../stores/objectsStore';
import { getContentStoreWorker } from '../workers/contentStoreWorkerClient';
import useContentIndexStore from '../stores/contentIndexStore';

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

    console.log(`[fetchRepoContext] Loaded file tree: ${filePaths.length} files`);

    return { fileTree: filePaths, fileContents: {}, error: null };
  } catch (err) {
    console.error('[fetchRepoContext] step failed:', err.message, err.stack);
    throw err;
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
  const objects = useObjectsStore.getState().objects;
  const planContext = getAllPlanContext();

  const worker = getContentStoreWorker();
  const result = await worker.processContent({
    repoFileContents: null,
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
  getBase64Store().encodeAll();

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

CONTENT INDEX (HTML elements, CSS classes, JSX refs → file):
{contentIndex}

IMPORT GRAPH (file → files it imports):
{importGraph}

SCENE COMPONENTS:
{sceneContext}

GRAPH OVERVIEW:
{graphSummary}

ARCHITECTURAL COMMUNITIES:
{communitySummaries}

LSP SEMANTIC ANALYSIS:
{lspOverview}

TECH STACK: {techStack}

═══════════════════════════════════════════════════════════════
TOOLS (use these — do NOT fabricate tool calls)
═══════════════════════════════════════════════════════════════

• search_code(pattern) — find WHERE code lives. Returns file paths and node matches, NOT file contents.
• search_nodes(query) — search components by name/type in the diagram.
• file_outline(path) — structural outline with line numbers (~500 chars vs 32K for read_file). Use FIRST.
• quick_look(path, head, tail) — first/last N lines preview (fast, no full load).
• read_file(path, offset, limit) — full source with line numbers ("N: content"). Default 8000 lines, use offset for files longer than 8000 lines.
• list_files(path) — list files in a directory.
• get_node_info(nodeId) — full component details: type, file, connections, exports, imports.
• get_dependencies(nodeId, direction) — upstream/downstream relationships.
• find_path(source, target) — shortest data-flow path between components.
• get_community_info/community_nodes/search_communities — architectural community queries.
• get_lsp_definition/references/type_info/call_graph/overview — semantic analysis queries.
• edit(filePath, oldString, newString) — targeted text replacement in existing files.
• write(filePath, content) — create a new file or completely overwrite an existing file.
• task(prompt) — spawn a read-only sub-agent to research a question.

═══════════════════════════════════════════════════════════════
WORKFLOW — DISCOVER then EDIT
═══════════════════════════════════════════════════════════════

PHASE 1 — DISCOVER:
1. Use search_nodes/search_code to find WHERE each affected component is defined
2. Use file_outline(path) to see structure and line numbers before reading full files
3. MANDATORY: Call read_file on EVERY file you plan to modify — you cannot write correct edits without reading exact content first

PHASE 2 — EDIT:
4. For modifications: call edit(filePath, oldString, newString) — oldString must be EXACT text from read_file output
5. For new files: call write(filePath, content) with complete file content
6. Batch related edits together in one round when possible
7. After all edits, write a 1-2 sentence summary

CRITICAL: Once you have read ALL files you need, STOP exploring and START editing immediately. Do NOT re-read files you have already read.

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

1. PRESERVE existing file paths and import paths — do NOT invent new ones
2. Use edit for ALL modifications to existing files — write ONLY for new files that don't exist yet
3. NEVER create a new file for a component that already exists — HTML elements (div, span, header, nav) and CSS classes live INLINE inside existing component files
4. When the user mentions a UI element by name, search for it first — it may be defined inline, not as a standalone component. IMMEDIATELY call read_file on the file you find.
5. You MUST call read_file on every file BEFORE editing — without reading, you cannot know the exact oldString to use
6. After ANY tool returns a file path, call read_file on that path before editing — do NOT keep searching
7. oldString in edit calls must be EXACT text from the file — including whitespace, indentation, and line breaks. Copy precisely from read_file output (lines are prefixed "N: content").
8. NEVER fabricate file paths, imports, or code structure. Verify with search_code or read_file — do NOT guess
9. Read files in LARGE chunks (8000+ lines per call). Avoid tiny 200-line slices — they waste rounds. Use offset only for files longer than 8000 lines.
10. Use file_outline(path) first (~500 chars) to see structure, then read_file for the full content
11. Check CONTENT INDEX and IMPORT GRAPH sections above to understand exports and dependencies — this prevents duplicates
12. CRITICAL: After EVERY tool result, write a brief summary (1-3 sentences) of what you learned before making the next tool call. NEVER send only tool_calls without text — your reasoning helps you stay on track.
13. If search_code returns "No matching files found", try a shorter/substring of the search term — the function/variable you're looking for may have a slightly different name in the codebase.
`;

function formatFileSize(chars) {
  if (chars < 1024) return `${chars}B`;
  if (chars < 1024 * 1024) return `${(chars / 1024).toFixed(1)}KB`;
  return `${(chars / (1024 * 1024)).toFixed(1)}MB`;
}

export function buildFileTreeSection(fileTree, fileSizesMap) {
  if (!fileTree || fileTree.length === 0) return '(no repository files available)';
  const sizes = fileSizesMap instanceof Map ? fileSizesMap : (fileSizesMap ? new Map(fileSizesMap) : null);
  const BUDGET = 8000;
  const lines = [];
  let charCount = 0;
  let shown = 0;
  let truncated = 0;

  for (const filePath of fileTree) {
    if (shown >= 200) { truncated = fileTree.length - shown; break; }
    const size = sizes?.get(filePath);
    const line = size ? `${filePath} (${formatFileSize(size)})` : filePath;
    if (charCount + line.length + 1 > BUDGET) { truncated = fileTree.length - shown; break; }
    lines.push(line);
    charCount += line.length + 1;
    shown++;
  }

  if (truncated > 0) lines.push(`... and ${truncated} more files`);
  return lines.join('\n');
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

export function buildContentIndexSection() {
  try {
    const contentIndex = useCodeStore.getState().contentIndex;
    if (!contentIndex) return '(no content index available — run a scan first)';
    const BUDGET = 4000;
    if (contentIndex.length <= BUDGET) return contentIndex;
    return contentIndex.slice(0, BUDGET) + '\n... (truncated)';
  } catch {
    return '(no content index available)';
  }
}

export function buildImportGraphSection() {
  try {
    const importGraph = useCodeStore.getState().importGraph;
    if (!importGraph) return '(no import graph available — run a scan first)';
    const BUDGET = 3000;
    if (importGraph.length <= BUDGET) return importGraph;
    return importGraph.slice(0, BUDGET) + '\n... (truncated)';
  } catch {
    return '(no import graph available)';
  }
}

const COMMUNITY_BUDGET = 4000;

export function buildCommunitySection() {
  try {
    const communities = useDiagramStore.getState().communities;
    if (!communities || communities.length === 0) return '(no communities detected)';

    const lines = [];
    let charCount = 0;
    let truncated = 0;

    for (const community of communities) {
      const line = community.summary;
      if (charCount + line.length + 2 > COMMUNITY_BUDGET) {
        truncated++;
        continue;
      }
      lines.push(line);
      charCount += line.length + 2;
    }

    if (truncated > 0) {
      lines.push(`... and ${truncated} more communities`);
    }

    return lines.length > 0 ? lines.join('\n\n') : '(no communities detected)';
  } catch {
    return '(no communities detected)';
  }
}

const LSP_OVERVIEW_BUDGET = 3000;

export function buildLspOverviewSection() {
  try {
    const lsp = useDiagramStore.getState().lspMetadata;
    if (!lsp) return '(no LSP data available)';

    const lines = [];
    let charCount = 0;

    const defCount = (lsp.definitions || []).length;
    const refCount = (lsp.references || []).length;
    const hoverCount = (lsp.hover || []).length;
    const callCount = (lsp.callGraph || []).length;

    if (defCount === 0 && refCount === 0 && hoverCount === 0 && callCount === 0) {
      return '(no LSP data available)';
    }

    lines.push(`LSP data available: ${defCount} import definitions, ${refCount} symbol references, ${hoverCount} type signatures, ${callCount} call graph entries.`);
    charCount = lines[0].length;

    // Show top definitions as a quick reference
    if (defCount > 0 && charCount < LSP_OVERVIEW_BUDGET) {
      const defs = lsp.definitions.slice(0, 10);
      const defLine = `Key imports: ${defs.map(d => `${d.importName}→${d.targetFile?.split('/').pop() || '?'}`).join(', ')}`;
      if (charCount + defLine.length + 2 <= LSP_OVERVIEW_BUDGET) {
        lines.push(defLine);
        charCount += defLine.length + 2;
      }
    }

    // Show top call graph edges
    if (callCount > 0 && charCount < LSP_OVERVIEW_BUDGET) {
      const calls = lsp.callGraph.slice(0, 8);
      const callLine = `Key calls: ${calls.map(c => `${c.callerName}→${c.calleeName}`).join(', ')}`;
      if (charCount + callLine.length + 2 <= LSP_OVERVIEW_BUDGET) {
        lines.push(callLine);
      }
    }

    lines.push('Use get_lsp_definition, get_lsp_references, get_lsp_type_info, or get_lsp_call_graph for details.');

    return lines.join('\n');
  } catch {
    return '(no LSP data available)';
  }
}

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
  const fileTreeSection = buildFileTreeSection(repoContext?.fileTree, repoContext?.fileSizes);
  const componentIndexSection = buildComponentIndex(sceneObjects);
  const contentIndexSection = buildContentIndexSection();
  const importGraphSection = buildImportGraphSection();
  const sceneContextSection = buildMinimalSceneContext(sceneObjects);

  const diagramStore = repoContext?.diagramStore;
  const graphSummarySection = buildGraphSummary(diagramStore);
  const communitySection = buildCommunitySection();
  const lspOverviewSection = buildLspOverviewSection();

  const systemContent = CODE_GEN_SYSTEM_PROMPT
    .replace('{fileTree}', fileTreeSection)
    .replace('{componentIndex}', componentIndexSection)
    .replace('{contentIndex}', contentIndexSection)
    .replace('{importGraph}', importGraphSection)
    .replace('{sceneContext}', sceneContextSection)
    .replace('{graphSummary}', graphSummarySection || '(no graph available)')
    .replace('{communitySummaries}', communitySection || '(no communities detected)')
    .replace('{lspOverview}', lspOverviewSection || '(no LSP data available)')
    .replace('{techStack}', techStackSection);

  console.log(`[buildCodeGenMessages] Sizes: fileTree=${fileTreeSection.length} componentIndex=${componentIndexSection.length} contentIndex=${contentIndexSection.length} importGraph=${importGraphSection.length} sceneContext=${sceneContextSection.length} graphSummary=${graphSummarySection.length} communities=${communitySection.length} lsp=${lspOverviewSection.length} total=${systemContent.length}`);

  const systemMessage = { role: 'system', content: systemContent };

  return [systemMessage, { role: 'user', content: userRequest }];
}
