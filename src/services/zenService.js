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

import { sendToProvider } from './llmProviders';
import useLlmStore from '../stores/llmStore';
import useCodeStore from '../stores/codeStore';
import { getAllPlanContext } from './planService';
import { getRepoTree } from './githubIssuesService';
import { fetchFileContent } from './githubRepoService';
import { getContentStore, ContentCategory, waitForContentStoreHydration } from './context/contentStore';
import { getBase64Store } from './context/base64Store';
import { buildContext } from './context/contextBuilder';
import useObjectsStore from '../stores/objectsStore';
import { getContentStoreWorker } from '../workers/contentStoreWorkerClient';
import useContentIndexStore from '../stores/contentIndexStore';

export async function fetchRepoContext(token, owner, repo, branch) {
  try {
    const treeResult = await getRepoTree(token, owner, repo, branch);
    if (!treeResult.ok || !treeResult.data?.tree) {
      return { fileTree: [], fileContents: {}, owner, repo, branch, token, error: treeResult.error };
    }

    await new Promise(r => setTimeout(r, 0));

    const treeEntries = treeResult.data.tree;
    const entries = treeEntries.filter(e => e.type === 'blob');
    const filePaths = entries.map(e => e.path).filter(p => typeof p === 'string').slice(0, 5000);

    console.log(`[fetchRepoContext] Loaded file tree: ${filePaths.length} files — fetching contents...`);

    // Fetch file bodies with a bounded concurrency pool so the returned
    // fileContents actually feed the search corpus / codegen context. Without
    // this, a refresh restored the tree but left contents empty, so search_code
    // had nothing to scan and reported "no matches" for real symbols.
    //
    // Skip binary/large blobs (weights, images, minified maps...) — raw-fetching
    // an 8MB ONNX .data file into the corpus bloats every structured clone and
    // its chunking hangs the content-store worker for seconds. Binary files
    // aren't useful to search_code, and read_file/quick_look fetch on demand.
    const fileContents = {};
    const MAX_CONCURRENCY = 20;
    let idx = 0;
    let fetched = 0;
    const fetchWorker = async () => {
      while (idx < filePaths.length) {
        const path = filePaths[idx++];
        if (!path) continue;
        if (looksBinaryOrGenerated(path)) continue;
        try {
          const content = await fetchFileContent(owner, repo, path, token);
          if (content) {
            fileContents[path] = content;
            fetched++;
          }
        } catch { /* individual file failures are non-fatal */ }
      }
    };
    const poolSize = Math.min(MAX_CONCURRENCY, filePaths.length);
    await Promise.all(Array.from({ length: poolSize }, fetchWorker));

    console.log(`[fetchRepoContext] Fetched: ${filePaths.length} files, ${fetched} contents`);
    return { fileTree: filePaths, fileContents, owner, repo, branch, token, error: null };
  } catch (err) {
    console.error('[fetchRepoContext] step failed:', err.message, err.stack);
    throw err;
  }
}

const GENERATED_BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff',
  '.pdf', '.wasm', '.data', '.onnx', '.bin', '.zip', '.gz', '.tar',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp3', '.mp4', '.webm',
  '.ogg', '.wav', '.map', '.exe', '.dll', '.so', '.dylib', '.a', '.o',
  '.pyc', '.class', '.jar', '.lock', '.svgz',
]);

function looksBinaryOrGenerated(filePath) {
  const lower = filePath.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf('.'));
  if (GENERATED_BINARY_EXTENSIONS.has(ext)) return true;
  if (lower.includes('package-lock')) return true;
  return false;
}

const PROJECT_NOTES_BUDGET = 2500;
const PROJECT_NOTES_CANDIDATES = ['AGENTS.md', '.github/copilot-instructions.md', 'README.md'];

function fetchProjectDoc(repoContext, path, timeoutMs = 15000) {
  const { owner, repo, token } = repoContext || {};
  if (!owner || !repo || !token) return Promise.resolve(null);
  // Fetch conventions docs from the repo's DEFAULT branch (not the scan-pinned
  // commit SHA) so AGENTS.md/README present on the default branch are found even
  // if they don't exist at the pinned commit. Falls back to the Contents API.
  const defaultBranch = useCodeStore.getState().selectedRepo?.default_branch || undefined;
  return Promise.race([
    fetchFileContent(owner, repo, path, token, defaultBranch),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]).catch(() => null);
}

/**
 * Load the repository's own conventions docs (AGENTS.md, Copilot
 * instructions, README) and condense them for injection into the code-gen
 * system prompt. Returns a formatted section, or null if none loaded.
 */
export async function loadProjectNotes(repoContext) {
  const parts = [];
  let budget = PROJECT_NOTES_BUDGET;
  for (const doc of PROJECT_NOTES_CANDIDATES) {
    if (budget <= 300) break;
    const content = await fetchProjectDoc(repoContext, doc);
    if (!content) continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    const label = `## ${doc}\n`;
    const available = budget - label.length;
    const snippet = trimmed.length > available ? `${trimmed.slice(0, available)}\n...(truncated)` : trimmed;
    parts.push(label + snippet);
    budget -= label.length + snippet.length;
  }
  return parts.length > 0 ? parts.join('\n\n') : null;
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

/**
 * Populate the ContentStore with the repo corpus, scene objects, plan context
 * and the Merfolk diagram markdown. All chunking/keyword-indexing happens in
 * contentStoreWorker; repo files are sent in small batches so no single Comlink
 * structured clone blocks the main thread, and each batch is merged back
 * incrementally. Safe to call fire-and-forget after a scan.
 *
 * The Merfolk markdown is indexed under "merfolk:diagram" so it survives a page
 * refresh (IndexedDB) and can be re-read on demand by the architecture-map
 * skill. The "merfolk:" prefix keeps search_code (which only scans "repo:" ids)
 * from surfacing raw markdown in results.
 */
export async function populateContentStoreWorker(repoFileContents = null, diagramMarkdown = null) {
  try {
    await populateContentStoreWorkerInner(repoFileContents, diagramMarkdown);
  } catch (err) {
    console.warn('[ContentStore] populateContentStoreWorker failed:', err);
  }
}

const HYDRATION_WAIT_MS = 8000;

async function populateContentStoreWorkerInner(repoFileContents, diagramMarkdown) {
  const objects = useObjectsStore.getState().objects;
  const planContext = getAllPlanContext();
  const sceneObjects = (objects || []).map(o => ({
    nodeId: o.merfolkData?.nodeId,
    nodeType: o.merfolkData?.nodeType || o.type,
    name: o.headerText,
    code: o.metadata?.code,
    isContainer: o.merfolkData?.isContainer,
  }));

  // Ensure the persisted store (IndexedDB) has finished loading before we merge
  // into it, so batches don't get overwritten by the hydration promise. Bound
  // the wait so a stuck IndexedDB open can't permanently block the merge — the
  // in-memory store still serves search even if persistence never comes up.
  await Promise.race([
    waitForContentStoreHydration(),
    new Promise((r) => setTimeout(r, HYDRATION_WAIT_MS)),
  ]);

  const worker = getContentStoreWorker();
  console.log('[ContentStore] content-store worker created, starting populate');

  // A dead/unresponsive worker makes Comlink calls hang forever. Bound every
  // round trip so population degrades to the in-memory store instead of
  // silently never completing (which leaves the content store empty).
  const WORKER_CALL_TIMEOUT_MS = 10000;
  const workerCall = (label, promise) => {
    const startedAt = Date.now();
    return Promise.race([
      promise.then(
        (result) => {
          console.log(`[ContentStore] workerCall "${label}" ok in ${Date.now() - startedAt}ms`);
          return result;
        },
        (err) => {
          console.warn(`[ContentStore] workerCall "${label}" failed in ${Date.now() - startedAt}ms:`, err.message);
          throw err;
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`content-store worker unresponsive (${label} after ${Date.now() - startedAt}ms)`)), WORKER_CALL_TIMEOUT_MS)
      ),
    ]);
  };

  await workerCall('reset', worker.reset());

  const repoEntries = Object.entries(repoFileContents || {});

  // Drop repo entries from a previous scan/space that this population won't
  // re-add, so switching repos doesn't leave stale search results behind.
  const store = getContentStore();
  if (repoEntries.length > 0) {
    const newRepoIds = new Set(repoEntries.map(([p]) => `repo:${p}`));
    for (const id of Array.from(store.entries.keys())) {
      if (id.startsWith('repo:') && !newRepoIds.has(id)) {
        store.remove(id);
      }
    }
  }

  const BATCH_SIZE = 25;
  for (let i = 0; i < repoEntries.length; i += BATCH_SIZE) {
    const slice = Object.fromEntries(repoEntries.slice(i, i + BATCH_SIZE));
    const batch = { repoFileContents: slice };
    if (i === 0) {
      batch.objects = sceneObjects;
      batch.planContext = planContext || '';
      batch.diagramMarkdown = diagramMarkdown || null;
    }
    const result = await workerCall(`processContentBatch[${i / BATCH_SIZE}]`, worker.processContentBatch(batch));
    if (result.entries?.length) {
      getContentStore().mergeBulk(result.entries);
    }
  }

  // No repo files (e.g. plan send, rescan, runtime scan) — still index the
  // scene objects, plan and diagram markdown.
  if (repoEntries.length === 0) {
    const result = await workerCall('processContentBatch[empty]', worker.processContentBatch({
      objects: sceneObjects,
      planContext: planContext || '',
      diagramMarkdown: diagramMarkdown || null,
    }));
    if (result.entries?.length) {
      getContentStore().mergeBulk(result.entries);
    }
  }

  getBase64Store().encodeAll();

  const indexState = useContentIndexStore.getState();
  indexState.setManifest(getContentStore().getManifest());
  indexState.setTotalChunks(getContentStore().totalChunks);
  indexState.setPopulated(Date.now());
  console.log(`[ContentStore] Populated ${Object.keys(repoFileContents || {}).length} repo files (${getContentStore().entries.size} total entries)`);
}

/**
 * Ensure the ContentStore holds the raw file contents for the selected repo so
 * search_code / grep have a full-text corpus even when no scan has run (e.g.
 * repo selected but diagram not scanned). Fetches contents with a concurrency
 * pool and indexes them as repo: entries. No-op if the store already has repo
 * content. Safe to run in the background.
 */
export async function ensureRepoContentIndexed({ owner, repo, branch, token, fileTree }) {
  try {
    const store = getContentStore();
    await waitForContentStoreHydration();
    const hasRepoEntries = Array.from(store.entries.keys()).some(id => id.startsWith('repo:'));
    if (hasRepoEntries || !fileTree || fileTree.length === 0) return;

    const MAX_CONCURRENCY = 12;
    let idx = 0;
    const fetchWorker = async () => {
      while (idx < fileTree.length) {
        const path = fileTree[idx++];
        if (!path) continue;
        if (looksBinaryOrGenerated(path)) continue;
        try {
          const content = await fetchFileContent(owner, repo, path, token);
          if (content) {
            store.upsert(`repo:${path}`, ContentCategory.REPO_FILE, content, {
              sourcePath: path,
              tags: ['repo', 'code'],
            });
          }
        } catch { /* individual file failures are non-fatal */ }
      }
    };
    const poolSize = Math.min(MAX_CONCURRENCY, fileTree.length);
    await Promise.all(Array.from({ length: poolSize }, fetchWorker));
    console.log(`[ContentStore] Indexed ${fileTree.length} repo files for search`);
  } catch (err) {
    console.warn('[ContentStore] ensureRepoContentIndexed failed:', err.message);
  }
}

const MAX_LLM_REQUESTS_PER_MINUTE = 6;
const MIN_REQUEST_INTERVAL_MS = 2 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const requestTimestampsByProvider = new Map();
const lastRequestAtByProvider = new Map();
const COOLDOWN_STORAGE_KEY = 'llmProviderCooldowns';

// Hard cap on simultaneous in-flight LLM requests per provider. Compression
// summarizers fire right on top of the main tool round, and a synchronized
// burst (2-6 concurrent) is what trips the upstream free tier into 429s. This
// cap serializes them so bursts stay bounded.
const MAX_IN_FLIGHT_PER_PROVIDER = 2;

const inFlightByProvider = new Map();

export function getInFlightCount() {
  let total = 0;
  for (const count of inFlightByProvider.values()) total += count;
  return total;
}

export function getProviderRateLimitState(providerId) {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  const timestamps = (requestTimestampsByProvider.get(providerId) || []).filter(t => t > cutoff);
  return {
    usedInWindow: timestamps.length,
    maxPerWindow: MAX_LLM_REQUESTS_PER_MINUTE,
    cooldownRemainingMs: Math.max(0, (providerCooldownUntil.get(providerId) || 0) - Date.now()),
    inFlight: inFlightByProvider.get(providerId) || 0,
    maxInFlight: MAX_IN_FLIGHT_PER_PROVIDER,
  };
}

async function acquireInFlightSlot(providerId, signal) {
  for (;;) {
    const current = inFlightByProvider.get(providerId) || 0;
    if (current < MAX_IN_FLIGHT_PER_PROVIDER) {
      inFlightByProvider.set(providerId, current + 1);
      return;
    }
    console.warn(`[Concurrency] ${providerId} at cap (${MAX_IN_FLIGHT_PER_PROVIDER} in-flight) — waiting for a slot (same=${current})`);
    await sleepAbortable(200, signal);
  }
}

function releaseInFlightSlot(providerId) {
  const after = (inFlightByProvider.get(providerId) || 0) - 1;
  if (after <= 0) inFlightByProvider.delete(providerId);
  else inFlightByProvider.set(providerId, after);
  const totalAfter = getInFlightCount();
  if (after > 0 || totalAfter > 0) {
    console.warn(`[Concurrency] sendToZen finished: provider=${providerId} remaining same=${Math.max(0, after)} total=${totalAfter}`);
  }
}

function loadPersistedCooldowns() {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem(COOLDOWN_STORAGE_KEY) || '{}')));
  } catch {
    return new Map();
  }
}

function persistCooldowns(map) {
  try {
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
  } catch {
    /* storage may be unavailable — cooldown just won't survive reload */
  }
}

const providerCooldownUntil = loadPersistedCooldowns();

function sleepAbortable(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason || new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason || new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort);
  });
}

export function reportProviderRateLimited(providerId, retryAfterMs) {
  const until = Date.now() + Math.max(retryAfterMs || 0, 60_000);
  providerCooldownUntil.set(providerId, until);
  persistCooldowns(providerCooldownUntil);
  console.warn(`[RateLimit] ${providerId} cooldown until ${new Date(until).toLocaleTimeString()} (${Math.round((until - Date.now()) / 1000)}s)`);
}

export function getProviderCooldownRemainingMs(providerId) {
  return Math.max(0, (providerCooldownUntil.get(providerId) || 0) - Date.now());
}

async function waitForRateLimit(providerId, signal) {
  // Token-bucket loop: after EVERY wait, re-check the window before recording a
  // request. The check-and-record block below is fully synchronous, so only one
  // caller can claim a slot per event-loop turn — concurrent waiters can no
  // longer all burst through together once the throttle lifts.
  for (;;) {
    const cooldown = providerCooldownUntil.get(providerId) || 0;
    if (Date.now() < cooldown) {
      console.warn(`[RateLimit] ${providerId} still cooling down — waiting ${Math.round((cooldown - Date.now()) / 1000)}s`);
      await sleepAbortable(cooldown - Date.now() + 50, signal);
      continue;
    }

    const cutoff = Date.now() - RATE_WINDOW_MS;
    const timestamps = (requestTimestampsByProvider.get(providerId) || []).filter(t => t > cutoff);

    const sinceLast = Date.now() - (lastRequestAtByProvider.get(providerId) || 0);

    if (timestamps.length < MAX_LLM_REQUESTS_PER_MINUTE && sinceLast >= MIN_REQUEST_INTERVAL_MS) {
      timestamps.push(Date.now());
      requestTimestampsByProvider.set(providerId, timestamps);
      lastRequestAtByProvider.set(providerId, Date.now());
      return;
    }

    const waitMs = Math.max(
      timestamps.length >= MAX_LLM_REQUESTS_PER_MINUTE ? timestamps[0] + RATE_WINDOW_MS - Date.now() + 50 : 0,
      sinceLast < MIN_REQUEST_INTERVAL_MS ? MIN_REQUEST_INTERVAL_MS - sinceLast + 50 : 0
    );
    console.warn(`[RateLimit] ${providerId} pacing: ${timestamps.length}/${MAX_LLM_REQUESTS_PER_MINUTE} in window, spacing ${MIN_REQUEST_INTERVAL_MS / 1000}s — waiting ${Math.round(waitMs / 1000)}s`);
    await sleepAbortable(waitMs, signal);
  }
}

export async function sendToZen({ messages, tools, onChunk, signal, llmConfig }) {
  const global = useLlmStore.getState();
  const { providerId, apiKey, selectedModel } = llmConfig || {
    providerId: global.providerId,
    apiKey: global.apiKey,
    selectedModel: global.selectedModel,
  };

  if (!providerId || !apiKey || !selectedModel) {
    throw new Error('LLM not configured. Click the model button to set up a provider.');
  }

  await acquireInFlightSlot(providerId, signal);

  const inFlight = inFlightByProvider.get(providerId) || 0;
  const totalInFlight = getInFlightCount();
  if (inFlight > 1 || totalInFlight > 1) {
    console.warn(`[Concurrency] sendToZen in-flight: provider=${providerId} same=${inFlight} total=${totalInFlight} (cap ${MAX_IN_FLIGHT_PER_PROVIDER}/provider) — ${inFlight > 1 ? 'parallel same-provider requests (capped)' : 'parallel requests from different providers/windows'}`);
  }

  try {
    await waitForRateLimit(providerId, signal);

    console.log(`[sendToZen] Calling provider=${providerId} model=${selectedModel} messages=${messages.length} tools=${tools ? tools.length : 0}`);

    let result;
    try {
      result = await sendToProvider({
        providerId,
        apiKey,
        model: selectedModel,
        messages,
        tools,
        onChunk,
        signal,
      });
    } catch (err) {
      if (err?.status === 429 || /rate limit|too many requests/i.test(err?.message || '')) {
        reportProviderRateLimited(providerId, err?.retryAfterMs);
      }
      throw err;
    }

    if (tools && tools.length > 0) return result;
    return result.text;
  } finally {
    releaseInFlightSlot(providerId);
  }
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
REPOSITORY ACCESS
═══════════════════════════════════════════════════════════════

The repository already has files. You MUST respect the existing file structure and import paths.

TECH STACK: {techStack}

═══════════════════════════════════════════════════════════════
REPOSITORY MAP (pre-loaded — do NOT re-discover the layout)
═══════════════════════════════════════════════════════════════

{repoMap}

═══════════════════════════════════════════════════════════════
PROJECT CONVENTIONS (loaded from the repository's own docs)
═══════════════════════════════════════════════════════════════

{projectNotes}

═══════════════════════════════════════════════════════════════
SKILLS — Load context and tools on demand
═══════════════════════════════════════════════════════════════

The file tree and symbol index are already pre-loaded above. Activate skills only when you need their specific data:

1. Call list_skills to see what context is available
2. Call activate_skill("skill-name") to load a skill's context data and unlock its tools
3. Call deactivate_skill("skill-name") when done

You normally do NOT need activate_skill("file-tree") — the tree is above.

═══════════════════════════════════════════════════════════════
WORKFLOW — MODE-AWARE: RESEARCH then EDIT
═══════════════════════════════════════════════════════════════

The harness runs in two tool modes, switched with set_mode("mode"):

- RESEARCH mode (default): all search/read/graph/list/skill tools available.
  Use it to locate your edit targets precisely.
- EDIT mode: only edit, write, read_file, LSP verification tools, and set_mode.
  Use it to apply changes. The harness auto-switches to EDIT after your first
  successful edit; call set_mode("research") to search again.

RESEARCH PHASE (mode: research):
1. Use the pre-loaded REPOSITORY MAP above to locate relevant files (no need to activate file-tree)
2. Activate skills relevant to your task (component-graph for component info, import-analysis for dependencies, etc.)
3. Use grep/search_code to find WHERE each affected component is defined
4. Use file_outline(path) to see structure and line numbers before reading full files
5. MANDATORY: Call read_file on EVERY file you plan to modify
6. When every change and its exact text is located, call set_mode("edit") once and begin the edit phase.

EDIT PHASE (mode: edit):
7. For modifications: call edit(filePath, oldString, newString) — oldString must be EXACT text from read_file output
8. For new files: call write(filePath, content) with complete file content
9. Batch related edits together in one round when possible
10. After an edit, verify it with the LSP tools (get_lsp_references / get_lsp_type_info / get_lsp_call_graph) or a narrow re-read of the edited lines; fix any mismatch.
11. If an edit needs more context, call set_mode("research"), gather it, then set_mode("edit") to resume.
12. When finished, write a 1-2 sentence summary of what changed and what remains.

CRITICAL: Once you have read ALL files you need, call set_mode("edit") and STOP exploring — START editing immediately. Do not leave research mode after your first edit unless a verification genuinely needs it.

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

1. PRESERVE existing file paths and import paths — do NOT invent new ones
2. Use edit for ALL modifications to existing files — write ONLY for new files that don't exist yet
3. NEVER create a new file for a component that already exists
4. When the user mentions a UI element by name, search for it first — it may be defined inline
5. You MUST call read_file on every file BEFORE editing
6. oldString in edit calls must be EXACT text from the file — including whitespace and indentation. If an edit fails to match, re-read the file and copy the exact current text; never guess or approximate.
7. NEVER fabricate file paths, imports, or code structure. Verify with search_code or read_file
8. Read files in LARGE chunks (8000+ lines per call). Use offset only for files longer than 8000 lines. Read each region ONCE — re-reading the same region returns the same content and wastes rounds. After an edit changes a file, re-read only the narrow slice around your next edit target if you need fresh line numbers.
9. Use file_outline(path) first to see structure, then read_file for the full content
10. After EVERY tool result, write a brief summary (1-3 sentences) of what you learned. NEVER send only tool_calls without text.
11. If search_code returns "No matching files found", try a shorter/substring of the search term
12. Make the SMALLEST change that fixes the root cause. NEVER rewrite a whole file — use targeted edits. A diff that changes 5 lines is far better than one that changes 500.
13. After an edit succeeds, re-read the edited lines to verify they are correct and consistent with the rest of the file. If your change touches a hydration/restore path (localStorage digest, storage URL fetch, store rehydration, or an effect that runs on page refresh), trace that flow end-to-end once after editing: which effect runs on reload, does it reach the store setter that gates the feature, and is the gate satisfied? Fix any dead code you find (data written into a persisted structure but never read back on load).
14. If a UI element is missing or a button does not appear (especially after a page refresh), find the condition that gates its rendering — search for the gate variable by name with search_code (e.g. is2DReady) — then trace how that variable is set: in-memory store state vs state restored on hydration. Fix the state/data flow, not the UI. The "is2DReady"/"graphs" fields live in diagramStore and are in-memory only; "latestMarkdownUrl" is restored on refresh and the hydration effect is what re-renders the buttons — verify that path before editing.
BEFORE editing, write your root-cause trace in 3-4 bullets: (a) the exact gate that hides the UI (file:line), (b) EVERY code path that can set that gate, each with file:line, (c) which path is failing in the reported scenario and the evidence for it. If you cannot name the gate and every restore path with file:line, keep reading files — do not edit yet. A missing button is almost always a data/restore bug, not a rendering bug.
15. search_code returns line-level matches in the format file:line: code — use the line numbers to target read_file offsets.
16. Check for AGENTS.md, .github/copilot-instructions.md, or README.md conventions before writing code that touches project structure.
17. NEVER call write on an existing file — the write tool rejects paths that already exist in the repository. Always use edit(filePath, oldString, newString) for modifications, with oldString copied exactly from read_file output.
18. NEVER output an entire existing file as a code block — a full-file block for an existing file is REJECTED (it would silently drop the rest of the file). Modify existing files only through the edit tool. If you must emit a change as text, use SEARCH/REPLACE markers covering ONLY the exact changed lines, in a code block labeled with the file path (e.g. \`\`\`jsx:src/components/UIOverlay.jsx):
   <<<<<<< SEARCH
   exact existing code to replace
   =======
   replacement code
   >>>>>>> REPLACE
   Each SEARCH block must match the current file exactly and cover ONLY the lines you are changing — NEVER the whole file. A SEARCH block spanning ~80% or more of the file (or more than ~200 lines) is REJECTED outright and the proposal is kept for manual review, never applied. Emitting whole files wastes context and is always rejected, so always use the edit tool or narrow SEARCH/REPLACE hunks. For changes spanning multiple regions, output ONE narrow SEARCH/REPLACE block PER edit location (e.g. 3 edits -> 3 small blocks), never one giant block per file.
19. COMPLETENESS: when you add a field to any persisted or serialized structure (localStorage digest, API payload, storage URL record, database row), you MUST also add the corresponding read/restore on load in the SAME change. A field that is written but never read back is dead code and will be rejected by review.
20. Prefer fixing the path that is actually failing over adding a new fallback. If you find a silent failure (a function that returns without setting the state the UI depends on, or swallows an error), the primary fix is to surface that failure (throw/reject) so the existing fallback paths can run — then add a new fallback only if a real gap remains.
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

const SCENE_COMPONENT_BUDGET = 2000;

export function buildContentIndexSection() {
  try {
    const contentIndex = useCodeStore.getState().contentIndex;
    if (!contentIndex) return '(no content index available — run a scan first)';
    const BUDGET = 8000;
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

/**
 * Build a compact pre-loaded repo map for the code-gen system prompt: the
 * component → file index, graph overview, sized file tree, then symbol index
 * and import graph — in priority order within a shared budget. This lets the
 * model skip layout discovery and jump straight to targeted reads.
 */
function buildRepoMap(repoContext, sceneObjects) {
  const cs = useCodeStore.getState();
  const fileTree = (repoContext?.fileTree?.length ? repoContext.fileTree : (cs.repoFileTree || []));
  if (fileTree.length === 0) return '(repo context not loaded — use list_files("") to browse)';

  const REPO_MAP_BUDGET = 14000;
  const parts = [];
  let used = 0;

  const push = (label, text) => {
    if (!text || text.startsWith('(no ')) return;
    const block = `\n${label}\n${text}`;
    const avail = REPO_MAP_BUDGET - used;
    if (avail <= 0) return;
    if (block.length > avail) {
      parts.push(block.slice(0, avail) + '\n... (truncated)');
      used = REPO_MAP_BUDGET;
    } else {
      parts.push(block);
      used += block.length;
    }
  };

  // Highest-value context first so the model never needs to rediscover layout:
  // component → file mapping, then the structural graph overview.
  push('COMPONENT INDEX (component → file):', buildComponentIndex(sceneObjects));
  push('GRAPH SUMMARY (structure overview):', buildGraphSummary(useDiagramStore.getState()));

  // Sized file tree (capped internally at ~8000 chars).
  push(`FILE TREE (${fileTree.length} files, with sizes):`, buildFileTreeSection(fileTree, cs.fileSizes));

  // Symbol index and import graph — only what fits in the remaining budget.
  push('SYMBOL INDEX (path: exports | functions | css classes):', buildContentIndexSection());
  push('IMPORT GRAPH (file → files it imports):', buildImportGraphSection());

  return parts.join('\n') || '(repo context not loaded — use list_files("") to browse)';
}

export async function buildCodeGenMessages({ userRequest, sceneObjects, techStack = '', repoContext, corrections = [] }) {
  const techStackSection = techStack || 'Not specified — use your best judgment.';

  let projectNotes = '';
  try {
    projectNotes = (await loadProjectNotes(repoContext)) || '';
  } catch (e) {
    console.warn('[buildCodeGenMessages] project notes load failed:', e.message);
  }

  const repoMap = buildRepoMap(repoContext, sceneObjects);

  const systemContent = CODE_GEN_SYSTEM_PROMPT
    .replace('{techStack}', techStackSection)
    .replace('{projectNotes}', projectNotes || '(none loaded — if the repo has AGENTS.md or README conventions, read them yourself)')
    .replace('{repoMap}', repoMap);

  console.log(`[buildCodeGenMessages] System prompt: ${systemContent.length} chars`);

  const systemMessage = { role: 'system', content: systemContent };

  const messages = [systemMessage];
  if (corrections.length > 0) {
    // Feedback from the patch pipeline on the model's previous output. The code
    // gen round is stateless (no conversation history), so rejected/auto-diffed
    // proposals are fed back explicitly to let the model self-correct.
    messages.push({
      role: 'user',
      content: `FEEDBACK ON YOUR PREVIOUS OUTPUT — fix these in your new answer:\n- ${corrections.join('\n- ')}`,
    });
  }
  messages.push({ role: 'user', content: userRequest });

  return messages;
}
