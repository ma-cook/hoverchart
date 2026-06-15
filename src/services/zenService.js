const ZEN_API_URL = 'https://opencode.ai/zen/v1/chat/completions';

const MERFOLK_SYSTEM_PROMPT = `You are a Merfolk diagram expert. Merfolk is a custom markdown syntax for defining 3D system architecture diagrams.

SYNTAX — Node types (bracket type determines 3D geometry):
- {Component: Name} → Dodecahedron (UI components, pages)
- [Function: Name] → Cube (functions, utilities)
- [[Store: Name]] → Cube (state stores, data models)
- ((Service: Name)) → Tetrahedron (backend services, APIs)
- <Library: Name> → Cube (external libraries, dependencies)
- [Hook: Name] → Cube (React hooks)
- [Module: Name] → Cube (modules, namespaces)

CONNECTIONS — Arrow type determines visual style:
- A --> B : Data flow (solid arrow)
- A -.-> B : Control flow (dashed arrow)
- A --- B : Association (solid line)
- A == B : Inheritance (double line)
- A *--> B : Composition (filled arrow)
- A ..> B : Dependency (dotted arrow)

Labels: A --> B : "description"
Face targeting: A@front --> B@back

FLOW PATHS — Named sequences through multiple nodes:
- flowpath "name" : A --> B --> C --> D
- Multiple flow paths can share connections

COMMENTS:
- %% comment
- // comment

GRAPH DECLARATION (optional):
- graph3d "Title" or ast3d "Title"

RULES:
1. Output ONLY valid Merfolk inside \`\`\`merfolk code blocks
2. Use descriptive camelCase node IDs (no spaces)
3. Define all nodes before their connections
4. Group related nodes with %% section comments
5. Add flow paths for the main data flows
6. Keep diagrams focused — 10 to 50 nodes is ideal`;

const FEW_SHOT_EXAMPLES = [
  {
    role: 'user',
    content: 'Create a simple auth system with login, JWT tokens, and a protected dashboard'
  },
  {
    role: 'assistant',
    content: `\`\`\`merfolk
graph3d "Auth System"

%% Frontend
LoginPage{Component: LoginPage}
Dashboard{Component: Dashboard}
AuthContext{Component: AuthContext}

%% Functions
loginUser[Function: loginUser]
validateToken[Function: validateToken]
logoutUser[Function: logoutUser]

%% Hooks
useAuth[Hook: useAuth]

%% Services
AuthService((Service: AuthService))
TokenService[Module: TokenService]

%% Connections
LoginPage --> loginUser : "submit credentials"
loginUser --> AuthService : "POST /auth/login"
AuthService --> TokenService : "issue JWT"
TokenService --> loginUser : "return token"
loginUser --> AuthContext : "store token"
AuthContext --> useAuth : "expose state"
useAuth --> Dashboard : "guard route"
Dashboard --> validateToken : "on mount"
validateToken --> AuthService : "verify JWT"
Dashboard --> logoutUser : "click logout"
logoutUser --> AuthContext : "clear token"

%% Flow Paths
flowpath "Login Flow" : LoginPage --> loginUser --> AuthService --> TokenService --> AuthContext --> Dashboard
flowpath "Logout Flow" : Dashboard --> logoutUser --> AuthContext
\`\`\``
  },
  {
    role: 'user',
    content: 'Design a microservices order processing system'
  },
  {
    role: 'assistant',
    content: `\`\`\`merfolk
graph3d "Order Processing"

%% Frontend
OrderUI{Component: OrderUI}
OrderForm{Component: OrderForm}

%% Services
APIGateway((Service: APIGateway))
OrderService((Service: OrderService))
PaymentService((Service: PaymentService))
InventoryService((Service: InventoryService))
NotificationService((Service: NotificationService))

%% Data
OrderDB[[Store: OrderDB]]
PaymentDB[[Store: PaymentDB]]

%% Functions
processOrder[Function: processOrder]
validateStock[Function: validateStock]
chargePayment[Function: chargePayment]
sendConfirmation[Function: sendConfirmation]

%% Connections
OrderUI --> OrderForm
OrderForm --> APIGateway : "submit order"
APIGateway --> OrderService : "route"
OrderService --> validateStock : "check inventory"
validateStock --> InventoryService : "reserve items"
InventoryService --> OrderDB : "update stock"
OrderService --> chargePayment : "process payment"
chargePayment --> PaymentService : "charge"
PaymentService --> PaymentDB : "record"
PaymentService --> OrderService : "confirm"
OrderService --> sendConfirmation : "on success"
sendConfirmation --> NotificationService : "email user"

%% Flow Paths
flowpath "Order Flow" : OrderForm --> APIGateway --> OrderService --> validateStock --> InventoryService --> chargePayment --> PaymentService --> OrderService --> sendConfirmation --> NotificationService
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

  return `\nEXISTING OBJECTS IN SCENE:\n${nodes.join('\n')}\n\nWhen asked to modify or extend the diagram, reference existing node IDs to create connections to them. Do NOT redefine existing nodes unless explicitly asked — only add new nodes and connections.`;
}

export async function sendToZen({ messages, onChunk, signal }) {
  const apiKey = import.meta.env.VITE_ZEN_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ZEN_API_KEY is not set in .env');
  }

  const response = await fetch(ZEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'big-pickle',
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Zen API error ${response.status}: ${errorText || response.statusText}`);
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
