# Hoverchart Project Architecture

This document provides a comprehensive architectural overview of the Hoverchart project using Merfolk diagram syntax.

```merfolk
%% ========================================
%% MAIN APPLICATION LAYER
%% ========================================

App{Component: App}
MainEntry{Component: main.jsx}
MainEntry --> App : "renders"

%% ========================================
%% CORE COMPONENTS
%% ========================================

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

%% ========================================
%% 3D OBJECT COMPONENTS
%% ========================================

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

%% ========================================
%% UI COMPONENTS
%% ========================================

ObjectUI{Component: ObjectUI}
FaceUI{Component: FaceUI}
LineUI{Component: LineUI}
ColorPicker{Component: ColorPicker}
HeaderInput{Component: HeaderInput}
FaceTextInput{Component: FaceTextInput}
TextStyleUI{Component: TextStyleUI}
TextStyleUIContainer{Component: TextStyleUIContainer}
TextObjectUI{Component: TextObjectUI}
TransformControls{Component: TransformControls}

Cube --> ObjectUI : "displays"
Cube --> FaceUI : "face controls"
Cube --> TransformControls : "transform"
ConnectionsRenderer --> LineUI : "connection controls"
UIOverlay --> ColorPicker : "color selection"

%% ========================================
%% VISUAL COMPONENTS
%% ========================================

FaceIndicator{Component: FaceIndicator}
TextSprite{Component: TextSprite}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
PooledLine{Component: PooledLine}
SnapIndicator{Component: SnapIndicator}
SnapLineIndicator{Component: SnapLineIndicator}
ResizeArrows{Component: ResizeArrows}
ResizeArrow2D{Component: ResizeArrow2D}
WhitePlane{Component: WhitePlane}

Cube --> FaceIndicator : "face markers"
Cube --> TextSprite : "text display"
ConnectionsRenderer --> AnimatedConnectionLine : "animated lines"
ConnectionsRenderer --> PooledLine : "pooled rendering"
Cube --> SnapIndicator : "snap feedback"
Cube --> SnapLineIndicator : "snap guides"

%% ========================================
%% COLLABORATION COMPONENTS
%% ========================================

PublicSpaceView{Component: PublicSpaceView}
PublicConnectionsRenderer{Component: PublicConnectionsRenderer}
ScreenShareStream{Component: ScreenShareStream}
WebcamStream{Component: WebcamStream}

App --> PublicSpaceView : "shared spaces"
PublicSpaceView --> PublicConnectionsRenderer : "shared connections"
UIOverlay --> ScreenShareStream : "screen sharing"
UIOverlay --> WebcamStream : "video stream"

%% ========================================
%% SPECIALIZED COMPONENTS
%% ========================================

BVHIntegration{Component: BVHIntegration}

App --> BVHIntegration : "3D optimization"

%% ========================================
%% STATE MANAGEMENT STORES
%% ========================================

objectsStore[[Store: objectsStore]]
connectionStore[[Store: connectionStore]]
cubeStore[[Store: cubeStore]]
dodecahedronStore[[Store: dodecahedronStore]]
tetrahedronStore[[Store: tetrahedronStore]]
planeStore[[Store: planeStore]]
textObjectStore[[Store: textObjectStore]]
faceStore[[Store: faceStore]]
faceIndicatorStore[[Store: faceIndicatorStore]]
transformControlsStore[[Store: transformControlsStore]]
colorPickerStore[[Store: colorPickerStore]]
textInputStore[[Store: textInputStore]]
uiOverlayStore[[Store: uiOverlayStore]]
authStore[[Store: authStore]]
spaceManagerStore[[Store: spaceManagerStore]]
spatialManagerStore[[Store: spatialManagerStore]]
indicatorsStore[[Store: indicatorsStore]]
publicSpaceStore[[Store: publicSpaceStore]]
screenShareStore[[Store: screenShareStore]]
webcamStreamStore[[Store: webcamStreamStore]]
animatedConnectionLineStore[[Store: animatedConnectionLineStore]]

App --> objectsStore : "manages"
App --> connectionStore : "manages"
App --> authStore : "manages"
App --> spaceManagerStore : "manages"
App --> spatialManagerStore : "manages"

Cube --> cubeStore : "state"
Dodecahedron --> dodecahedronStore : "state"
Tetrahedron --> tetrahedronStore : "state"
Plane --> planeStore : "state"
TextObject --> textObjectStore : "state"

ObjectUI --> transformControlsStore : "transform state"
ColorPicker --> colorPickerStore : "color state"
UIOverlay --> uiOverlayStore : "UI state"
FaceIndicator --> faceIndicatorStore : "indicator state"

%% ========================================
%% CUSTOM HOOKS
%% ========================================

useAuth[Function: useAuth]
useAuthState[Function: useAuthState]
useObjects[Function: useObjects]
useConnections[Function: useConnections]
useIndicators[Function: useIndicators]
useSpaceManager[Function: useSpaceManager]
useSpatialManager[Function: useSpatialManager]
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
useLinePool[Function: useLinePool]
useDebouncedUpdate[Function: useDebouncedUpdate]
useGlobalClickHandler[Function: useGlobalClickHandler]
useTextureUpdater[Function: useTextureUpdater]
useTimeoutManager[Function: useTimeoutManager]

App --> useAuthState : "uses"
App --> useObjects : "uses"
App --> useConnections : "uses"
App --> useIndicators : "uses"
App --> useSpaceManager : "uses"
App --> useSpatialManager : "uses"
App --> useCentralizedBroadcastManager : "uses"
App --> useTimeoutManager : "uses"

ConnectionsRenderer --> useLinePool : "uses"
Cube --> useDebouncedUpdate : "uses"
Cube --> useGlobalClickHandler : "uses"
Cube --> useTextureUpdater : "uses"

%% ========================================
%% FIREBASE & EXTERNAL SERVICES
%% ========================================

Firebase((Service: Firebase))
ReactThreeFiber((Service: React Three Fiber))
ThreeJS((Service: Three.js))
Zustand((Service: Zustand))
ThreeMeshBVH((Service: three-mesh-bvh))
AstGenerator((Service: 3d-ast-generator))

App --> Firebase : "cloud backend"
App --> ReactThreeFiber : "3D rendering"
ReactThreeFiber --> ThreeJS : "uses"
objectsStore --> Zustand : "state management"
BVHIntegration --> ThreeMeshBVH : "spatial optimization"

%% ========================================
%% CORE SERVICES
%% ========================================

authService((Service: authService))
spacesService((Service: spacesService))
connectionsService((Service: connectionsService))
spatialObjectsService((Service: spatialObjectsService))
markdownDiagramService((Service: markdownDiagramService))
spatialPartitioning((Service: spatialPartitioning))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
sharedSpacesService((Service: sharedSpacesService))
sharingService((Service: sharingService))
storageService((Service: storageService))
presenceService((Service: presenceService))
webRservice((Service: webRservice))
screenRecordingService((Service: screenRecordingService))
centralizedBroadcastManager((Service: centralizedBroadcastManager))
globalSubscriptionManager((Service: globalSubscriptionManager))
resourceCleanupService((Service: resourceCleanupService))
connectionPositionResolver((Service: connectionPositionResolver))
unifiedCacheManager((Service: unifiedCacheManager))
globalOptimizationCoordinator((Service: globalOptimizationCoordinator))

App --> authService : "authentication"
App --> spacesService : "space management"
App --> connectionsService : "connections"
App --> spatialObjectsService : "spatial queries"
App --> spatialPartitioning : "spatial indexing"
App --> centralizedBroadcastManager : "broadcasting"
App --> globalSubscriptionManager : "subscriptions"
App --> resourceCleanupService : "cleanup"

UIOverlay --> markdownDiagramService : "Merfolk diagrams"
markdownDiagramService --> AstGenerator : "uses"

PublicSpaceView --> sharedSpacesService : "sharing"
PublicSpaceView --> sharingService : "collaboration"

ScreenShareStream --> screenRecordingService : "recording"
WebcamStream --> webRservice : "WebRTC"

ConnectionsRenderer --> connectionPositionResolver : "positioning"
spatialPartitioning --> unifiedCacheManager : "caching"

authService --> Firebase : "auth API"
spacesService --> Firebase : "Firestore API"
connectionsService --> Firebase : "Firestore API"
spatialObjectsService --> Firebase : "Firestore API"
storageService --> Firebase : "Storage API"

%% ========================================
%% UTILITY MODULES
%% ========================================

connectionUtils[Function: connectionUtils]
faceIndicatorUtils[Function: faceIndicatorUtils]
facePositionUtils[Function: facePositionUtils]
positionUtils[Function: positionUtils]
pathfindingUtils[Function: pathfindingUtils]
snappingUtils[Function: snappingUtils]
objectUpdateHandlers[Function: objectUpdateHandlers]
cubeHelpers[Function: cubeHelpers]
unifiedMathUtils[Function: unifiedMathUtils]
unifiedDebugUtils[Function: unifiedDebugUtils]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
unifiedValidationUtils[Function: unifiedValidationUtils]
animationUtils[Function: animationUtils]
loadingState[Function: loadingState]
textureLoader[Function: textureLoader]
linePoolManager[Function: linePoolManager]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
objectVirtualization[Function: objectVirtualization]
bvhRaycasting[Function: bvhRaycasting]
debugUtils[Function: debugUtils]
storeValidation[Function: storeValidation]
storeUtils[Function: storeUtils]

ConnectionsRenderer --> connectionUtils : "uses"
FaceIndicator --> faceIndicatorUtils : "uses"
Cube --> facePositionUtils : "uses"
Cube --> positionUtils : "uses"
ConnectionsRenderer --> pathfindingUtils : "uses"
Cube --> snappingUtils : "uses"
App --> objectUpdateHandlers : "uses"
Cube --> cubeHelpers : "uses"

connectionUtils --> unifiedMathUtils : "math operations"
positionUtils --> unifiedMathUtils : "math operations"
pathfindingUtils --> unifiedMathUtils : "math operations"

App --> unifiedDebugUtils : "debugging"
App --> unifiedPerformanceUtils : "performance"
objectsStore --> unifiedValidationUtils : "validation"
connectionStore --> unifiedValidationUtils : "validation"

App --> animationUtils : "animations"
App --> loadingState : "loading states"
Cube --> textureLoader : "texture loading"
ConnectionsRenderer --> linePoolManager : "line pooling"

spatialPartitioning --> streamlinedSpatialIndex : "spatial indexing"
ObjectRenderer --> objectVirtualization : "virtualization"
BVHIntegration --> bvhRaycasting : "raycasting"

objectsStore --> storeValidation : "validation"
objectsStore --> storeUtils : "utilities"

%% ========================================
%% CONFIGURATION & BUILD
%% ========================================

firebaseConfig[Function: firebase.js]
viteConfig[Function: vite.config.js]
eslintConfig[Function: eslint.config.js]

App --> firebaseConfig : "Firebase setup"

%% ========================================
%% DATA FLOW PATTERNS
%% ========================================

%% User interaction flow
UIOverlay -.-> App : "user events"
App -.-> objectsStore : "updates"
objectsStore -.-> ObjectRenderer : "notifies"
ObjectRenderer -.-> Cube : "renders"

%% Connection creation flow
FaceIndicator -.-> faceIndicatorUtils : "click event"
faceIndicatorUtils -.-> connectionUtils : "validate"
connectionUtils -.-> connectionStore : "create"
connectionStore -.-> ConnectionsRenderer : "notifies"

%% Spatial partitioning flow
Cube -.-> objectUpdateHandlers : "move event"
objectUpdateHandlers -.-> spatialPartitioning : "update position"
spatialPartitioning -.-> spatialObjectsService : "sync to DB"

%% Real-time collaboration flow
Firebase -.-> RealTimeConnectionUpdater : "changes"
RealTimeConnectionUpdater -.-> connectionStore : "updates"
connectionStore -.-> ConnectionsRenderer : "re-render"

%% Markdown diagram flow
UIOverlay -.-> markdownDiagramService : "upload file"
markdownDiagramService -.-> AstGenerator : "parse Merfolk"
AstGenerator -.-> markdownDiagramService : "AST"
markdownDiagramService -.-> objectsStore : "create objects"
markdownDiagramService -.-> connectionStore : "create connections"

%% ========================================
%% INHERITANCE & DEPENDENCIES
%% ========================================

%% Store inheritance pattern (all stores use Zustand)
cubeStore == Zustand
dodecahedronStore == Zustand
tetrahedronStore == Zustand
planeStore == Zustand
objectsStore == Zustand
connectionStore == Zustand
authStore == Zustand

%% All 3D objects inherit from Three.js
Cube == ThreeJS
Dodecahedron == ThreeJS
Tetrahedron == ThreeJS
Plane == ThreeJS
TextObject == ThreeJS

%% All components depend on React
App == ReactThreeFiber
CustomCamera == ReactThreeFiber
ObjectRenderer == ReactThreeFiber
ConnectionsRenderer == ReactThreeFiber
```

## Architecture Overview

### Core Layers

1. **Application Layer** - Main app component orchestrating the 3D workspace
2. **Component Layer** - React components for 3D objects, UI, and visualization
3. **State Management Layer** - Zustand stores managing application state
4. **Service Layer** - Business logic and external integrations
5. **Utility Layer** - Helper functions and reusable utilities

### Key Features

- **3D Object System**: Support for cubes, dodecahedrons, tetrahedrons, planes, and text objects
- **Connection System**: Face-to-face connections with pathfinding and animations
- **Spatial Partitioning**: Optimized rendering and queries using spatial indexing
- **Real-time Collaboration**: Shared spaces with WebRTC and Firebase sync
- **Markdown Diagrams**: Support for Merfolk syntax to create 3D diagrams from markdown
- **Transform Controls**: Interactive 3D transformations with snapping
- **Visual Feedback**: Face indicators, snap guides, and UI overlays

### External Dependencies

- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **Zustand** - State management
- **Firebase** - Backend services (Auth, Firestore, Storage)
- **3d-ast-generator** - Merfolk diagram parser
- **three-mesh-bvh** - Spatial acceleration for raycasting

### Design Patterns

- **Component-based architecture** - Modular React components
- **State management** - Centralized Zustand stores
- **Service layer** - Separation of business logic
- **Utility modules** - Reusable helper functions
- **Hook composition** - Custom React hooks for logic reuse
- **Real-time sync** - Firebase listeners and WebRTC for collaboration
