const ZEN_PROXY_URL = 'https://us-central1-hoverchart.cloudfunctions.net/zenProxy';

const MERFOLK_SYSTEM_PROMPT = `You are a Merfolk diagram expert. Merfolk is a custom markdown syntax for defining 3D system architecture diagrams.

═══════════════════════════════════════════════════════════════
MERFOLK SYNTAX REFERENCE
═══════════════════════════════════════════════════════════════

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
  Tag individual connections: A --> B #flowName

GRAPH DECLARATION (optional):
  graph3d "Title" or ast3d "Title"

═══════════════════════════════════════════════════════════════
CRITICAL RULES — MUST FOLLOW
═══════════════════════════════════════════════════════════════

1. ROOT COMPONENT: Always include a root "App" or "MainApp" component.
   Every other component must be reachable from this root through connections.

2. NO ORPHANS: Every node MUST have at least one connection.
   No node should appear disconnected. If a node exists, connect it.

3. HIERARCHY: Connect components to the root with:
   App --> ComponentA : "renders"
   App --> ComponentB : "renders"
   This establishes the component tree and prevents "Unused Components".

4. NESTED GROUPING: Functions connected to components become visually
   nested inside them. Connect functions to their parent component:
   processOrder[Function: processOrder]
   processOrder --> OrderService : "lives in"
   Or use control flow for nesting:
   processData -.-> DataService : "internal"

5. CONNECTION DENSITY: Every service, store, hook, and function should
   be connected to the component(s) that use it. Example:
   APIGateway --> OrderService : "routes to"
   OrderService --> OrderDB : "queries"
   useAuth --> Dashboard : "provides auth"

6. USE DATA FLOW (-->): Use --> as the default connection type.
   Reserve -.-> for events/control flow, --- for loose associations.

7. FLOW PATHS: Add flowpath directives for the main data flows.
   This creates visual flow lines through the diagram.

8. OUTPUT FORMAT: Output ONLY valid Merfolk inside \`\`\`merfolk code blocks.
   Use descriptive camelCase node IDs (no spaces).
   Define all nodes before their connections.
   Group related nodes with %% section comments.
    Generate as many nodes as needed to fully represent the architecture.`;

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
      return `- ${nodeId} (${nodeType}) — ${name}`;
    });

  if (nodes.length === 0) return '';

  return `\nEXISTING OBJECTS IN SCENE:\n${nodes.join('\n')}\n\nWhen asked to modify or extend the diagram, reference existing node IDs to create connections to them. Do NOT redefine existing nodes unless explicitly asked — only add new nodes and connections. When adding new nodes, use descriptive camelCase IDs that don't clash with existing IDs. When updating an existing node, use its EXACT nodeId — any variation (different case, extra prefix, etc.) will create a duplicate instead of modifying it.`;
}

export async function sendToZen({ messages, onChunk, signal, model = 'big-pickle' }) {
  const response = await fetch(ZEN_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model,
      max_tokens: 16384,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Zen proxy error ${response.status}: ${errorText || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk?.(delta, fullText);
        }
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  return fullText;
}

export function buildZenMessages({ llmMessages, sceneObjects, maxMessages = 20 }) {
  const recentMessages = llmMessages.slice(-maxMessages);

  const sceneContext = buildSceneContext(sceneObjects);
  const systemContent = MERFOLK_SYSTEM_PROMPT + sceneContext;

  const systemMessage = { role: 'system', content: systemContent };

  const fewShotWithScene = FEW_SHOT_EXAMPLES.map(msg => ({
    ...msg,
    content: msg.content
  }));

  return [systemMessage, ...fewShotWithScene, ...recentMessages];
}
