# Hoverchart Architecture

A comprehensive Mermaid diagram documenting all components, hooks, stores, services, utilities, and web workers in the Hoverchart 3D diagram tool.

---

## Application Entry

```mermaid
flowchart TD
    main["main.jsx\n(Entry Point)"] --> App

    subgraph AppLayer["Application Layer"]
        App["App\n(src/App.jsx)"]
    end
```

---

## Component Tree

```mermaid
flowchart TD
    App --> Canvas["Canvas\n(@react-three/fiber)"]
    App --> EffectComposer["EffectComposer\n(@react-three/postprocessing)"]
    App --> CustomCamera
    App --> UIOverlay
    App --> ObjectsRenderer
    App --> ConnectionsRenderer
    App --> RealTimeConnectionUpdater
    App --> CellBoundaryRenderer
    App --> FrameTicker
    App --> FrameloopController
    App --> LODManager
    App --> DiagramOverlay2D

    subgraph ObjectComponents["3D Object Components"]
        ObjectsRenderer --> Cube
        ObjectsRenderer --> Dodecahedron
        ObjectsRenderer --> Tetrahedron
        ObjectsRenderer --> Plane
        ObjectsRenderer --> TextObject
        ObjectsRenderer --> ModelObject
    end

    subgraph UIComponents["UI Components"]
        Cube --> ObjectUI
        Cube --> FaceUI
        Cube --> HeaderInput
        Cube --> FaceTextInput
        Cube --> TransformControls
        Dodecahedron --> HeaderInput
        Dodecahedron --> FaceTextInput
        Tetrahedron --> HeaderInput
        Tetrahedron --> FaceTextInput
        Plane --> HeaderInput
        Plane --> FaceTextInput
        TextObject --> TextObjectUI
        TextObject --> TextStyleUIContainer
        UIOverlay --> ColorPicker
        ConnectionsRenderer --> LineUI
        ConnectionsRenderer --> HeaderInput
    end

    subgraph VisualComponents["Visual / Feedback Components"]
        Cube --> FaceIndicator
        Cube --> TextSprite
        Cube --> SnapIndicator
        Cube --> SnapLineIndicator
        Cube --> ResizeArrows
        Dodecahedron --> FaceIndicator
        Tetrahedron --> FaceIndicator
        Plane --> FaceIndicator
        TextObject --> FaceIndicator
        ConnectionsRenderer --> AnimatedConnectionLine
        ConnectionsRenderer --> PooledLine
        UIOverlay --> ResizeArrow2D
        UIOverlay --> WhitePlane
    end
```

---

## Custom Hooks

```mermaid
flowchart TD
    subgraph Hooks["src/hooks/"]
        useAuthState["useAuthState\n- user, isAuthReady, isCheckingUrlAuth"]
        useAuth["useAuth\n- authState"]
        useSpaceManager["useSpaceManager\n- currentSpaceId"]
        useObjects["useObjects\n- selectedId, handleCreateObject, handleObjectDelete"]
        useConnections["useConnections\n- connections, addConnection, removeConnection"]
        useIndicators["useIndicators\n- showAllCubesIndicators, isConnectMode"]
        useSpatialManager["useSpatialManager\n- loadedCells, currentCellCoords"]
        useCentralizedBroadcastManager["useCentralizedBroadcastManager\n- lifecycle cleanup"]
        useTimeoutManager["useTimeoutManager\n- setNamedTimeout, clearNamedTimeout"]
        useLinePool["useLinePool\n- pooled geometry & material"]
        useFrustumCulling["useFrustumCulling\n- visible connections set"]
        useLOD["useLOD\n- LOD level per object"]
        useTextureUpdater["useTextureUpdater\n- canvas texture updates"]
        useDebouncedUpdate["useDebouncedUpdate\n- debounced state flush"]
        useGlobalClickHandler["useGlobalClickHandler\n- global pointer events"]
        useAnimationStats["useAnimationStats\n- frame timing"]
        useDynamicFrustumCulling["useDynamicFrustumCulling\n- adaptive culling"]
        useFrustumCulledConnections["useFrustumCulledConnections\n- culled connection list"]
        useConnectionState["useConnectionState\n- connection read slice"]
        useConnectionActions["useConnectionActions\n- connection write slice"]
    end

    App --> useAuthState
    App --> useAuth
    App --> useSpaceManager
    App --> useObjects
    App --> useConnections
    App --> useIndicators
    App --> useSpatialManager
    App --> useCentralizedBroadcastManager
    App --> useTimeoutManager
    ConnectionsRenderer --> useLinePool
    ConnectionsRenderer --> useFrustumCulling
    ConnectionsRenderer --> useFrustumCulledConnections
    ObjectsRenderer --> useLOD
```

---

## Zustand Stores

```mermaid
flowchart TD
    subgraph ObjectStores["Object State Stores"]
        cubeStore["useCubeStore\n- cubes Map, selectedCubes"]
        dodecahedronStore["useDodecahedronStore\n- dodecahedrons Map"]
        tetrahedronStore["useTetrahedronStore\n- tetrahedrons Map"]
        planeStore["usePlaneStore\n- planes Map"]
        textObjectStore["useTextObjectStore\n- textObjects Map"]
        faceStore["useFaceStore\n- faces Map"]
        faceIndicatorStore["useFaceIndicatorStore\n- indicators Map"]
    end

    subgraph ConnectionStores["Connection Stores"]
        connectionStore["useConnectionStore\n- connections, addConnection, removeConnection"]
        animatedConnectionLineStore["useAnimatedConnectionLineStore\n- animated lines"]
    end

    subgraph UIStores["UI / Overlay Stores"]
        uiOverlayStore["useUIOverlayStore\n- overlay visibility flags"]
        colorPickerStore["useColorPickerStore\n- active color"]
        textInputStore["useTextInputStore\n- text input state"]
        transformControlsStore["useTransformControlsStore\n- transform mode"]
        indicatorsStore["useIndicatorsStore\n- showAllCubesIndicators, isConnectMode"]
    end

    subgraph AuthSpaceStores["Auth & Space Stores"]
        authStore["useAuthStore\n- authState, initializeAuth"]
        spaceManagerStore["useSpaceManagerStore\n- currentSpaceId"]
        publicSpaceStore["usePublicSpaceStore\n- publicSpaceId, owner"]
        objectsStore["useObjectsStore\n- objects[], selectedId, handleCreateObject"]
        spatialManagerStore["useSpatialManagerStore\n- loadedCells, isInitialized"]
    end

    subgraph MediaStores["Media Stores"]
        screenShareStore["useScreenShareStore\n- stream, isSharing"]
        webcamStreamStore["useWebcamStreamStore\n- webcam stream"]
    end

    subgraph DiagramStores["Diagram Stores"]
        diagramStore["useDiagramStore\n- graphs, hierarchy, nodeToObjectIdMap"]
        lodStore["useLODStore\n- LOD levels Map"]
    end
```

---

## Services

```mermaid
flowchart TD
    subgraph AuthServices["Authentication"]
        authService["authService\n- signInUser, signOut, observeAuthState\n- validateAuthToken, exchangeGithubCode"]
    end

    subgraph SpaceServices["Space Management"]
        spacesService["spacesService\n- getSpaceById, getUserSpaces"]
        sharedSpacesService["sharedSpacesService\n- isSharedSpace, registerSharedSpaceFromUrl"]
        sharingService["sharingService\n- shareSpace, revokeAccess"]
    end

    subgraph DataServices["Data & Objects"]
        spatialObjectsService["spatialObjectsService\n- subscribeToSpatialObjects\n- saveObjectToCell, deleteObject"]
        connectionsService["connectionsService\n- subscribeToConnections\n- saveConnection, deleteConnection"]
        spatialPartitioning["spatialPartitioning\n- getCellCoordinates, getCellId\n- addObjectToCell, getObjectsFromCells"]
        streamlinedSpatialPartitioning["streamlinedSpatialPartitioning\n- StreamlinedSpatialManager\n- updateObject, queryRadius"]
    end

    subgraph DiagramServices["Diagram Processing"]
        markdownDiagramService["markdownDiagramService\n- processMarkdownFile\n- createObjectsFromDiagram\n- createConnectionsFromDiagram\n- createGroupContainers"]
        githubRepoService["githubRepoService\n- fetchRepositoryStructure\n- generateMerfolkFromRepository\n- exchangeGithubCode"]
    end

    subgraph DiagramSubServices["markdownDiagram/ Sub-modules"]
        hierarchyMethods["hierarchyMethods\n- buildHierarchicalRelationships"]
        scaleMethods["scaleMethods\n- calculateNodeScale"]
        positionMethods["positionMethods\n- positionNodeHierarchy\n- positionGroupedNodes\n- resolveCollisions"]
        containerMethods["containerMethods\n- createGroupContainers\n- createRootHierarchyContainer"]
        objectMethods["objectMethods\n- createObjectsFromDiagram\n- getObjectTypeForNode"]
        connectionMethods["connectionMethods\n- createConnectionsFromDiagram\n- saveConnections"]
        processMethods["processMethods\n- processMarkdownFile\n- parseFlowPaths"]
    end

    subgraph InfraServices["Infrastructure"]
        globalSubscriptionManager["globalSubscriptionManager\n- getOrCreateSubscription\n- SUBSCRIPTION_TYPES"]
        unifiedCacheManager["unifiedCacheManager\n- get, set, delete (namespaced)\n- TTL + size-limited caches"]
        centralizedBroadcastManager["centralizedBroadcastManager\n- broadcast, subscribe\n- cleanupBroadcastManager"]
        resourceCleanupService["resourceCleanupService\n- scheduleCleanup, runCleanup"]
        globalOptimizationCoordinator["globalOptimizationCoordinator\n- coordinate LOD + culling"]
        connectionPositionResolver["connectionPositionResolver\n- resolveConnectionEndpoints"]
        presenceService["presenceService\n- setUserPresence, setGuestPresence\n- subscribeToSpacePresence"]
        storageService["storageService\n- uploadFile, getDownloadUrl"]
        webRservice["webRservice\n- initWebRTC, BroadcastSession\n- startBroadcast, joinBroadcast"]
        screenRecordingService["screenRecordingService\n- startRecording, stopRecording\n- downloadRecording"]
    end

    markdownDiagramService --> hierarchyMethods
    markdownDiagramService --> scaleMethods
    markdownDiagramService --> positionMethods
    markdownDiagramService --> containerMethods
    markdownDiagramService --> objectMethods
    markdownDiagramService --> connectionMethods
    markdownDiagramService --> processMethods
```

---

## Web Workers

```mermaid
flowchart TD
    subgraph Workers["src/workers/ (Comlink-wrapped)"]
        markdownLayoutWorker["markdownLayoutWorker\n- computeLayout(markdownText, basePosition)\n- Runs: hierarchyMethods, scaleMethods, positionMethods\n- Parses Merfolk via MarkdownProcessor"]
        diagramLayoutWorker["diagramLayoutWorker\n- computeLayout(nodes, connections, hierarchy)\n- Sugiyama-style 2D layered layout"]
        pathfindingWorker["pathfindingWorker\n- computePathsBatch(requests, objects)\n- checkLineIntersection + generateCurvedPath\n- invalidateCaches()"]
        spatialIndexWorker["spatialIndexWorker\n- syncObjects(objects)\n- computeLODLevels(cameraPos, ...)\n- frustumCullConnections(planes, ...)"]
        textAtlasWorker["textAtlasWorker\n- renderBatch(requests)\n- OffscreenCanvas text atlas\n- setMaxGPUTextureSize(size)"]
    end

    subgraph WorkerClients["Worker Client Singletons"]
        markdownLayoutWorkerClient["markdownLayoutWorkerClient\n- getMarkdownLayoutWorker()\n- terminateMarkdownLayoutWorker()"]
        diagramLayoutWorkerClient["diagramLayoutWorkerClient\n- getDiagramLayoutWorker()\n- terminateDiagramLayoutWorker()"]
        pathfindingWorkerClient["pathfindingWorkerClient\n- getPathfindingWorker()\n- terminatePathfindingWorker()"]
        spatialIndexWorkerClient["spatialIndexWorkerClient\n- getSpatialIndexWorker()\n- terminateSpatialIndexWorker()"]
        textAtlasWorkerClient["textAtlasWorkerClient\n- getTextAtlasWorker()\n- terminateTextAtlasWorker()"]
    end

    markdownLayoutWorkerClient --> markdownLayoutWorker
    diagramLayoutWorkerClient --> diagramLayoutWorker
    pathfindingWorkerClient --> pathfindingWorker
    spatialIndexWorkerClient --> spatialIndexWorker
    textAtlasWorkerClient --> textAtlasWorker

    markdownDiagramService["markdownDiagramService"] --> markdownLayoutWorkerClient
    DiagramOverlay2D["DiagramOverlay2D"] --> diagramLayoutWorkerClient
    ConnectionsRenderer["ConnectionsRenderer"] --> pathfindingWorkerClient
    LODManager["LODManager"] --> spatialIndexWorkerClient
    TextSprite["TextSprite"] --> textAtlasWorkerClient
```

---

## Utilities

```mermaid
flowchart TD
    subgraph Utils["src/utils/"]
        textAtlas["textAtlas\n- TextAtlas class\n- addText, getEntry, _resize"]
        animationUtils["animationUtils\n- registerMaterial, unregisterMaterial\n- setAnimationSpeed (RAF loop)"]
        snappingUtils["snappingUtils\n- calculateAxisSnap(position, objects, id)"]
        objectUpdateHandlers["objectUpdateHandlers\n- handleObjectMove\n- handleObjectScale"]
        linePoolManager["linePoolManager\n- LinePool class\n- getGeometry, getMaterial\n- releaseGeometry, releaseMaterial"]
        debugUtils["debugUtils\n- logAnimation, shouldAnimateConnection\n- getPerfStats, resetPerfStats"]
        frameCounter["frameCounter\n- FrameCounter singleton\n- tick(), shouldUpdate()"]
        loadingState["loadingState\n- getIsInitialLoading()\n- setIsInitialLoading()"]
        gpuResourceTracker["gpuResourceTracker\n- gpuTracker singleton\n- trackGeometry/Material/Texture"]
        unifiedPerformanceUtils["unifiedPerformanceUtils\n- throttle, debounce\n- measurePerformance, scheduleWork\n- memoize"]
        streamlinedSpatialIndex["streamlinedSpatialIndex\n- createStreamlinedSpatialIndex()\n- Point3D, BoundingBox\n- insert, remove, queryRadius"]
        pathfindingUtils["pathfindingUtils\n- checkLineIntersection\n- generateCurvedPath\n- invalidatePathfindingCaches"]
    end
```

---

## Data Flow: Core Pipeline

```mermaid
flowchart LR
    A["GitHub OAuth\nauthService.exchangeGithubCode()"] --> B["Repo Scan\ngithubRepoService.fetchRepositoryStructure()"]
    B --> C["AST Analysis\ngenerateMerfolkFromRepository()\n@babel/parser"]
    C --> D["Merfolk Markdown\n```merfolk block```"]
    D --> E["markdownLayoutWorker\nMarkdownProcessor AST\nbuildHierarchicalRelationships()"]
    E --> F["Layout\npositionNodeHierarchy()\npositionGroupedNodes()\nresolveCollisions()"]
    F --> G["3D Objects\ncreateObjectsFromDiagram()\nZustand + Firebase"]
    G --> H["Containers\ncreateGroupContainers()\ncreateRootHierarchyContainer()"]
    H --> I["Connections\ncreateConnectionsFromDiagram()\nsaveConnections()"]
```

---

## Data Flow: Real-time Object Sync

```mermaid
flowchart LR
    User["User Interaction\n(drag, create, delete)"] --> ObjectsStore["useObjectsStore\nhandleCreateObject\nhandleObjectDelete"]
    ObjectsStore --> SpatialObjectsService["spatialObjectsService\nsaveObjectToCell\nflushSaveBatch()"]
    SpatialObjectsService --> SpatialPartitioning["spatialPartitioning\naddObjectToCell\nmoveObjectBetweenCells"]
    SpatialPartitioning --> Firestore[("Firestore\nusers/{uid}/spaces/{spaceId}\n/cells/{cellId}/objects/{objId}")]
    Firestore -->|onSnapshot| SpatialObjectsService
    SpatialObjectsService --> ObjectsStore
    ObjectsStore --> ObjectsRenderer["ObjectsRenderer\nrenders Cube / Dodecahedron\n/ Tetrahedron / Plane / Text"]
```

---

## Data Flow: Connection Pipeline

```mermaid
flowchart LR
    FaceIndicator["FaceIndicator\n(click to connect)"] --> useIndicators
    useIndicators --> useConnections["useConnections\nsaveConnection()"]
    useConnections --> connectionsService["connectionsService\nsubscribeToConnections"]
    connectionsService --> Firestore2[("Firestore\n/connections/{connId}")]
    Firestore2 -->|onSnapshot| connectionsService
    connectionsService --> useConnectionStore["useConnectionStore\naddConnection / update / remove"]
    useConnectionStore --> ConnectionsRenderer
    ConnectionsRenderer -->|batch pathfinding| pathfindingWorker["pathfindingWorker\ncomputePathsBatch()"]
    pathfindingWorker --> ConnectionsRenderer
    ConnectionsRenderer --> AnimatedConnectionLine
    ConnectionsRenderer --> PooledLine
```

---

## Data Flow: Spatial Partitioning & LOD

```mermaid
flowchart TD
    Camera["Camera Movement\nOrbitControls"] --> useSpatialManager
    useSpatialManager --> spatialManagerStore["useSpatialManagerStore\nupdateCameraPosition\nloadCell / unloadCell"]
    spatialManagerStore --> spatialObjectsService["spatialObjectsService\ngetObjectsFromCells()"]
    spatialObjectsService --> objectsStore["useObjectsStore\nobjects[]"]
    objectsStore --> spatialIndexWorker["spatialIndexWorker\nsyncObjects()\ncomputeLODLevels()"]
    spatialIndexWorker --> lodStore["useLODStore\nlodLevels Map"]
    lodStore --> ObjectsRenderer["ObjectsRenderer\nLOD 0: full detail\nLOD 1: medium\nLOD 2: hidden"]
    spatialIndexWorker --> ConnectionsRenderer["ConnectionsRenderer\nfrustumCullConnections()"]
```

---

## External Dependencies

```mermaid
flowchart TD
    subgraph ExternalLibs["External Libraries"]
        Firebase["Firebase\n- Firestore (objects, connections, spaces)\n- Auth (Google OAuth)\n- Realtime Database (presence)\n- Storage (assets)\n- Functions (Cloud Functions)"]
        ReactThreeFiber["@react-three/fiber\n- Canvas, useFrame, useThree"]
        ThreeJS["three.js\n- Geometry, Materials, Vectors\n- Frustum, Box3, Line2"]
        Drei["@react-three/drei\n- Stats"]
        PostProcessing["@react-three/postprocessing\n- EffectComposer, SMAA"]
        Zustand["zustand\n- create, createWithEqualityFn\n- shallow equality"]
        Comlink["comlink\n- expose, wrap, releaseProxy\n(Web Worker bridge)"]
        BabelParser["@babel/parser\n- parse JSX/TS AST\n(in githubRepoService)"]
        AstGenerator["3d-ast-generator\n- MarkdownProcessor\n- Parses Merfolk syntax\n- Returns Graph nodes + connections"]
    end

    App --> Firebase
    App --> ReactThreeFiber
    ReactThreeFiber --> ThreeJS
    App --> Zustand
    markdownDiagramService --> AstGenerator
    markdownLayoutWorker --> AstGenerator
    githubRepoService --> BabelParser
    Workers --> Comlink
```

---

## Store ↔ Hook ↔ Service Wiring

```mermaid
flowchart TD
    useAuthState --> authStore
    useAuth --> authStore
    authStore --> authService

    useSpaceManager --> spaceManagerStore
    spaceManagerStore --> spacesService
    spaceManagerStore --> sharedSpacesService

    useObjects --> objectsStore
    objectsStore --> spatialObjectsService

    useConnections --> connectionStore
    connectionStore --> connectionsService

    useIndicators --> indicatorsStore

    useSpatialManager --> spatialManagerStore
    spatialManagerStore --> spatialPartitioning
    spatialManagerStore --> streamlinedSpatialPartitioning

    useCentralizedBroadcastManager --> centralizedBroadcastManager
    centralizedBroadcastManager --> globalSubscriptionManager

    connectionsService --> globalSubscriptionManager
    spatialObjectsService --> globalSubscriptionManager
    webRservice --> globalSubscriptionManager

    spatialObjectsService --> unifiedCacheManager
    connectionsService --> unifiedCacheManager
```
