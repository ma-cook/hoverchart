# Merfolk Markdown Syntax Guide

## Purpose

Merfolk is a 3D relational diagram language used to represent codebase architecture. Merfolk markdown files are parsed by the 3D AST generator and rendered as interactive 3D diagrams in Hoverchart. This guide covers the full syntax specification.

## Node Types & Geometries

| Syntax | Type | Geometry | Use Case |
| --- | --- | --- | --- |
| `A{Component: name}` | Component | Dodecahedron | Components, modules |
| `B[Function: name]` | Function | Cube | Functions, methods |
| `C[[Store: name]]` | Store | Cube | Databases, data stores |
| `D((Service: name))` | Service | Tetrahedron | External services, APIs |
| `E<Library: name>` | Library | Cube | External libraries |
| `F[Hook: name]` | Hook | Cube | React hooks, custom hooks |

**Node Type Detection:** The 3D AST generator automatically detects node types based on the bracket style and content label (e.g., "Component:", "Function:", "Store:", "Hook:", etc.).

## Connection Types

| Syntax | Type | Style | Use Case |
| --- | --- | --- | --- |
| `A --> B` | Data Flow | Solid arrow | Data passing |
| `A -->\|"label"\| B` | Labeled Flow | Solid arrow | Labeled data flow |
| `A -.-> B` | Control Flow | Dashed arrow | Event/control flow |
| `A --- B` | Association | Solid line | General relationships |
| `A == B` | Inheritance | Thick line | Inheritance/dependencies |

**Labeled Connections:** Use `-->|"label"|` syntax to add descriptive labels to connections, which will be displayed on the 3D connection lines.

## Face-Specific Connections

Connect to specific faces of 3D objects:

```merfolk
A@front --> B@back : "direct connection"
C@top --> D@bottom : "vertical flow"
```

Available faces:
- **Cubes**: `front`, `back`, `top`, `bottom`, `left`, `right`
- **Dodecahedrons**: `face_0` through `face_11`
- Other shapes have context-appropriate face names

## Labels and Properties

```merfolk
A --> B : "Connection Label"
C{Component: MyComp} {color: "blue", scale: "2,1,1"}
```

## Flow Path Tracking

Flow paths let you define and trace complete data paths that span multiple nodes across your application — not just individual point-to-point connections.

### The `flowpath` Directive

Define a named, multi-hop data path in a single line. This auto-creates tagged connections between each adjacent pair of nodes:

```merfolk
flowpath "userDataFlow" : A --> B --> C --> D
```

This creates 3 connections (A→B, B→C, C→D), all tagged with the `userDataFlow` identifier so the entire path can be queried and traced as a unit.

Full syntax:

```merfolk
%% Basic flow path
flowpath "name" : NodeA --> NodeB --> NodeC

%% With a custom arrow type (applies to all connections in the path)
flowpath "eventPipeline" (-.->): Input --> Transform --> Output

%% With a description
flowpath "requestLifecycle" : Client --> API --> DB --> API --> Client : "full request cycle"
```

### The `#tag` Syntax on Connections

Tag individual connections with one or more flow path names using `#`:

```merfolk
A --> B : "payload" #userDataFlow
B --> C #userDataFlow #auditTrail
C --> D #auditTrail
```

This is useful when you want to manually compose flow paths from existing connections rather than auto-generating them.

### Combining Both Approaches

You can freely mix `flowpath` directives with `#tag` connections. If a `flowpath` references a connection that already exists, it tags the existing connection instead of creating a duplicate:

```merfolk
%% Nodes
UI{Component: User Interface}
API[Function: API Handler]
Auth[Function: Auth Service]
DB[[Store: Database]]
Cache[Function: Cache Layer]

%% Explicit connections
UI --> API : "request" #userFlow
API --> Auth : "validate"

%% Flow path reuses existing UI-->API connection, creates the rest
flowpath "userFlow" : UI --> API --> Auth --> DB

%% A separate flow path through the cache layer
flowpath "cachedRead" : UI --> API --> Cache --> DB
```

## Nested Grouping

Automatically nest functions inside their connected components:

```merfolk
ComponentA{Component: Component A}
FunctionA[Function: Function A]
FunctionA --> ComponentA : "belongs to"
```

## Comments

Use `%%` for comments and section headers:

```merfolk
%% This is a comment or section header
```

## Example: Full Architecture Diagram

```merfolk
%% Codebase Architecture
App{Component: Main Application}
MainEntry{Component: main.jsx}
MainEntry --> App : "renders"

%% Core Components
CustomCamera{Component: CustomCamera}
UIOverlay{Component: UIOverlay}
ObjectRenderer{Component: ObjectRenderer}
ConnectionsRenderer{Component: ConnectionsRenderer}

App --> CustomCamera : "3D camera"
App --> UIOverlay : "user interface"
App --> ObjectRenderer : "renders objects"
App --> ConnectionsRenderer : "renders connections"

%% 3D Object Components
Cube{Component: Cube}
Dodecahedron{Component: Dodecahedron}
Tetrahedron{Component: Tetrahedron}
Plane{Component: Plane}
TextObject{Component: TextObject}
ModelObject{Component: ModelObject}

ObjectRenderer --> Cube : "renders"
ObjectRenderer --> Dodecahedron : "renders"
ObjectRenderer --> Tetrahedron : "renders"
ObjectRenderer --> Plane : "renders"
ObjectRenderer --> TextObject : "renders"
ObjectRenderer --> ModelObject : "renders"

%% State Management Stores
objectsStore[[Store: objectsStore]]
connectionStore[[Store: connectionStore]]
cubeStore[[Store: cubeStore]]

App --> objectsStore : "manages"
App --> connectionStore : "manages"
Cube --> cubeStore : "state"

%% External Services
Firebase((Service: Firebase))
ReactThreeFiber((Service: React Three Fiber))
ThreeJS((Service: Three.js))

App --> Firebase : "cloud backend"
App --> ReactThreeFiber : "3D rendering"
ReactThreeFiber --> ThreeJS : "uses"

%% Flow path: user interaction through to persistence
flowpath "objectCreate" : UIOverlay --> App --> objectsStore --> Firebase
```

## Output

- Ensure the markdown file contains all relevant nodes and connections to represent the codebase architecture accurately.
- Validate the syntax to ensure compatibility with the 3D AST generator.

## Deliverable

- Provide a `.md` file containing the Merfolk syntax for the 3D diagram.
