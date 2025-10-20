# Instructions for Creating a Merfolk Markdown File

## Purpose

Create a Merfolk markdown file to represent the architecture of the codebase in a 3D diagram. Below is a detailed guide on how to structure the Merfolk markdown syntax based on the Hoverchart project architecture.

## Node Definitions

- Use the following geometries to represent different elements of the codebase:
  - **Components**: Represented as dodecahedrons using `{Component: name}` syntax.
  - **Functions**: Represented as cubes using `[Function: name]` syntax.
  - **Stores**: Represented as cubes using `[[Store: name]]` syntax.
  - **Services**: Represented as tetrahedrons using `((Service: name))` syntax.
  - **Libraries**: Represented as cubes using `<Library: name>` syntax.
  - **Hooks**: Represented as cubes using `[Hook: name]` syntax.

## Connections

- Define relationships between nodes using the following connection types:
  - `A --> B`: Solid arrow for data flow.
  - `A -.-> B`: Dashed arrow for control flow.
  - `A --- B`: Solid line for associations.
  - `A == B`: Thick line for inheritance or dependencies.
- Add labels to connections using `A -->|label| B` syntax.

## Face-Specific Connections

- Specify connections to specific faces of 3D objects using `A@face --> B@face` syntax.
- Available faces:
  - **Cubes**: `front`, `back`, `top`, `bottom`, `left`, `right`.
  - **Dodecahedrons**: `face_0` through `face_11`.

## Nested Grouping

- Automatically nest functions inside their connected components. For example:
  ```merfolk
  ComponentA{Component: Component A}
  FunctionA[Function: Function A]
  FunctionA --> ComponentA : "belongs to"
  ```

## Visual Properties

- Optionally, add visual properties to nodes, such as color and scale:
  ```merfolk
  NodeA{Component: Node A} {color: "blue", scale: "2,1,1"}
  ```

## Example Syntax

- Use the following example as a template:

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
  RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
  CellBoundaryRenderer{Component: CellBoundaryRenderer}

  App --> CustomCamera : "3D camera"
  App --> UIOverlay : "user interface"
  App --> ObjectRenderer : "renders objects"
  App --> ConnectionsRenderer : "renders connections"
  App --> RealTimeConnectionUpdater : "real-time updates"
  App --> CellBoundaryRenderer : "spatial boundaries"

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
  dodecahedronStore[[Store: dodecahedronStore]]
  tetrahedronStore[[Store: tetrahedronStore]]

  App --> objectsStore : "manages"
  App --> connectionStore : "manages"
  Cube --> cubeStore : "state"
  Dodecahedron --> dodecahedronStore : "state"
  Tetrahedron --> tetrahedronStore : "state"

  %% External Services
  Firebase((Service: Firebase))
  ReactThreeFiber((Service: React Three Fiber))
  ThreeJS((Service: Three.js))

  App --> Firebase : "cloud backend"
  App --> ReactThreeFiber : "3D rendering"
  ReactThreeFiber --> ThreeJS : "uses"
  ```

## Output

- Ensure the markdown file contains all relevant nodes and connections to represent the codebase architecture accurately.
- Validate the syntax to ensure compatibility with the 3D AST generator.

## Deliverable

- Provide a `.md` file containing the Merfolk syntax for the 3D diagram.
