```merfolk
%% hoverchart Repository Analysis

%% Components
App{Component: App}
AppShell{Component: AppShell}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
AtlasTextSprite{Component: AtlasTextSprite}
StaticBillboardMesh{Component: StaticBillboardMesh}
DynamicBillboardMesh{Component: DynamicBillboardMesh}
BatchedConnectionLines{Component: BatchedConnectionLines}
BatchedCurvedLines{Component: BatchedCurvedLines}
BVHIntegration{Component: BVHIntegration}
CellBoundaryRenderer{Component: CellBoundaryRenderer}
ColorPicker{Component: ColorPicker}
DistanceFilteredConnectionText{Component: DistanceFilteredConnectionText}
resolveEndpointPosition{Component: resolveEndpointPosition}
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
Cube{Component: Cube}
CubeFace{Component: CubeFace}
CustomCamera{Component: CustomCamera}
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
layerForType{Component: layerForType}
DiagramOverlay2D{Component: DiagramOverlay2D}
DistanceFilteredTextLabels{Component: DistanceFilteredTextLabels}
Sphere{Component: Sphere}
DodecahedronFace{Component: DodecahedronFace}
FaceIndicator{Component: FaceIndicator}
FaceTextInput{Component: FaceTextInput}
FaceUI{Component: FaceUI}
FrameloopController{Component: FrameloopController}
FrameTicker{Component: FrameTicker}
GlobalCubeEdgesRenderer{Component: GlobalCubeEdgesRenderer}
GlobalCubeFaceRenderer{Component: GlobalCubeFaceRenderer}
GlobalCubeMediumLODRenderer{Component: GlobalCubeMediumLODRenderer}
GlobalDodecahedronEdgesRenderer{Component: GlobalDodecahedronEdgesRenderer}
GlobalDodecahedronMediumLODRenderer{Component: GlobalDodecahedronMediumLODRenderer}
GlobalTetrahedronEdgesRenderer{Component: GlobalTetrahedronEdgesRenderer}
GlobalTetrahedronMediumLODRenderer{Component: GlobalTetrahedronMediumLODRenderer}
HeaderInput{Component: HeaderInput}
InstancedAtlasText{Component: InstancedAtlasText}
PageInstancedMesh{Component: PageInstancedMesh}
InstancedLine{Component: InstancedLine}
LineUI{Component: LineUI}
LODManager{Component: LODManager}
ModelObject{Component: ModelObject}
ObjectRenderer{Component: ObjectRenderer}
ObjectsRenderer{Component: ObjectsRenderer}
ObjectUI{Component: ObjectUI}
Plane{Component: Plane}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
ScreenShareStream{Component: ScreenShareStream}
SnapLineIndicator{Component: SnapLineIndicator}
SpaceChat{Component: SpaceChat}
Avatar{Component: Avatar}
SpacePresenceAvatars{Component: SpacePresenceAvatars}
Tetrahedron{Component: Tetrahedron}
TetrahedronFace{Component: TetrahedronFace}
TextObject{Component: TextObject}
TextObjectUI{Component: TextObjectUI}
TextSprite{Component: TextSprite}
TextStyleUIContent{Component: TextStyleUIContent}
TextStyleUI{Component: TextStyleUI}
TextStyleUIContainer{Component: TextStyleUIContainer}
UIOverlay{Component: UIOverlay}
WebcamStream{Component: WebcamStream}
CreateOrganizationPopup{Component: CreateOrganizationPopup}
CreateSpacePopup{Component: CreateSpacePopup}
DodecahedronWireframe2{Component: DodecahedronWireframe2}
OrganizationManager{Component: OrganizationManager}
OrgMemberDropdown{Component: OrgMemberDropdown}
ShareSpacePopup{Component: ShareSpacePopup}
SpacesTable{Component: SpacesTable}
UpgradePrompt{Component: UpgradePrompt}
UserLoginSection{Component: UserLoginSection}
WelcomeOverlay{Component: WelcomeOverlay}
CubeOutline{Component: CubeOutline}
DodecahedronWireframe{Component: DodecahedronWireframe}
FakeGlowMaterial{Component: FakeGlowMaterial}
LandingApp{Component: LandingApp}
Loader{Component: Loader}
OrderHeader{Component: OrderHeader}
UpdatesContainer{Component: UpdatesContainer}
UpdatesEditor{Component: UpdatesEditor}
UpdatesViewer{Component: UpdatesViewer}
UserForm{Component: UserForm}
Model{Component: Model}
WhitePlane{Component: WhitePlane}

%% Functions
createVerifyAuthTokenApp[Function: createVerifyAuthTokenApp]
verifyAuthToken[Function: verifyAuthToken]
createBulkImportApp[Function: createBulkImportApp]
bulkImport[Function: bulkImport]
fetchGithubToken[Function: fetchGithubToken]
createBulkDeleteApp[Function: createBulkDeleteApp]
bulkDelete[Function: bulkDelete]
validateRuntimeScanUrl[Function: validateRuntimeScanUrl]
sanitizeMerfolkId[Function: sanitizeMerfolkId]
extractSourceMapUrl[Function: extractSourceMapUrl]
scanOriginalSource[Function: scanOriginalSource]
extractNamesFromSourceMap[Function: extractNamesFromSourceMap]
scanJsBundles[Function: scanJsBundles]
captureRuntimeTrace[Function: captureRuntimeTrace]
deduplicateApiCalls[Function: deduplicateApiCalls]
buildConnections[Function: buildConnections]
createScanWebsiteRuntimeApp[Function: createScanWebsiteRuntimeApp]
scanWebsiteRuntime[Function: scanWebsiteRuntime]
getSharedMaterial[Function: getSharedMaterial]
numericCacheKey[Function: numericCacheKey]
pathToSegments[Function: pathToSegments]
computeVisibleCells[Function: computeVisibleCells]
getTextParametricT[Function: getTextParametricT]
redistributeFaces[Function: redistributeFaces]
pathToLineSegments[Function: pathToLineSegments]
getFaceIndicatorProps[Function: getFaceIndicatorProps]
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]
flowPathColor[Function: flowPathColor]
getEdgeStyle[Function: getEdgeStyle]
getMarkerEnd[Function: getMarkerEnd]
getSelectedStyle[Function: getSelectedStyle]
getUnselectedStyle[Function: getUnselectedStyle]
MerfolkEdgeMemo[Function: MerfolkEdgeMemo]
buildNodeStyles[Function: buildNodeStyles]
buildContainerStyles[Function: buildContainerStyles]
buildPrecomputedNode[Function: buildPrecomputedNode]
MerfolkNodeMemo[Function: MerfolkNodeMemo]
ContainerNodeMemo[Function: ContainerNodeMemo]
buildReactFlowNodes[Function: buildReactFlowNodes]
buildReactFlowEdges[Function: buildReactFlowEdges]
filterEdges[Function: filterEdges]
minimapNodeColor[Function: minimapNodeColor]
cubeTransformMap[Function: cubeTransformMap]
dodecahedronTransformMap[Function: dodecahedronTransformMap]
tetrahedronTransformMap[Function: tetrahedronTransformMap]
addSharedSpaceReference[Function: addSharedSpaceReference]
removeSharedSpaceReference[Function: removeSharedSpaceReference]
getSharedSpacesForUser[Function: getSharedSpacesForUser]
removeAllSharedReferences[Function: removeAllSharedReferences]
estimateNodeSize[Function: estimateNodeSize]
isHierarchyConnection[Function: isHierarchyConnection]
filterConnections[Function: filterConnections]
layoutNodes[Function: layoutNodes]
layoutEdges[Function: layoutEdges]
getDiagramLayoutWorker[Function: getDiagramLayoutWorker]
terminateDiagramLayoutWorker[Function: terminateDiagramLayoutWorker]
parseFlowPaths[Function: parseFlowPaths]
stripFlowPathSyntax[Function: stripFlowPathSyntax]
computeHeaderStyle[Function: computeHeaderStyle]
getMarkdownLayoutWorker[Function: getMarkdownLayoutWorker]
terminateMarkdownLayoutWorker[Function: terminateMarkdownLayoutWorker]
getPathfindingWorker[Function: getPathfindingWorker]
terminatePathfindingWorker[Function: terminatePathfindingWorker]
childLOD[Function: childLOD]
parentLOD[Function: parentLOD]
getSpatialIndexWorker[Function: getSpatialIndexWorker]
terminateSpatialIndexWorker[Function: terminateSpatialIndexWorker]
getKey[Function: getKey]
addPage[Function: addPage]
getTextAtlasWorker[Function: getTextAtlasWorker]
terminateTextAtlasWorker[Function: terminateTextAtlasWorker]
Order[Function: Order]
Volspace[Function: Volspace]
line_frag[Function: line_frag]
shaders[Function: shaders]
line_vert[Function: line_vert]
animationUtils[Function: animationUtils]
bvhRaycasting[Function: bvhRaycasting]
connectionUtils[Function: connectionUtils]
debugUtils[Function: debugUtils]
faceIndicatorUtils[Function: faceIndicatorUtils]
facePositionUtils[Function: facePositionUtils]
gpuResourceTracker[Function: gpuResourceTracker]
loadingState[Function: loadingState]
objectUpdateHandlers[Function: objectUpdateHandlers]
objectVirtualization[Function: objectVirtualization]
pathfindingUtils[Function: pathfindingUtils]
positionUtils[Function: positionUtils]
renderWorkScheduler[Function: renderWorkScheduler]
snappingUtils[Function: snappingUtils]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
textAtlas[Function: textAtlas]
textureLoader[Function: textureLoader]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
unifiedValidationUtils[Function: unifiedValidationUtils]
diagramLayoutWorker[Function: diagramLayoutWorker]
diagramLayoutWorkerClient[Function: diagramLayoutWorkerClient]
markdownLayoutWorker[Function: markdownLayoutWorker]
markdownLayoutWorkerClient[Function: markdownLayoutWorkerClient]
pathfindingWorkerClient[Function: pathfindingWorkerClient]
spatialIndexWorker[Function: spatialIndexWorker]
spatialIndexWorkerClient[Function: spatialIndexWorkerClient]
textAtlasWorker[Function: textAtlasWorker]
textAtlasWorkerClient[Function: textAtlasWorkerClient]

%% Hooks
isPointInFrustum[Hook: isPointInFrustum]
useAuth[Hook: useAuth]
useAuthState[Hook: useAuthState]
useCentralizedBroadcastManager[Hook: useCentralizedBroadcastManager]
ConnectionAnimationManager[Hook: ConnectionAnimationManager]
useAnimatedLine[Hook: useAnimatedLine]
useAnimationStats[Hook: useAnimationStats]
useConnectionObjects[Hook: useConnectionObjects]
usePathfindingObjects[Hook: usePathfindingObjects]
useConnectionObjectPositions[Hook: useConnectionObjectPositions]
useConnections[Hook: useConnections]
useConnectionsRendererStore[Hook: useConnectionsRendererStore]
useConnectionState[Hook: useConnectionState]
useConnectionActions[Hook: useConnectionActions]
useDebouncedUpdate[Hook: useDebouncedUpdate]
isConnectionVisible[Hook: isConnectionVisible]
useFrustumCulledConnections[Hook: useFrustumCulledConnections]
useDynamicFrustumCulling[Hook: useDynamicFrustumCulling]
useGlobalClickHandler[Hook: useGlobalClickHandler]
useIndicators[Hook: useIndicators]
useObjects[Hook: useObjects]
useSpaceManager[Hook: useSpaceManager]
useSpatialManager[Hook: useSpatialManager]
useTextureUpdater[Hook: useTextureUpdater]
useTimeoutManager[Hook: useTimeoutManager]
useWindowSize[Hook: useWindowSize]
useConnectionAnimationManager[Hook: useConnectionAnimationManager]
useFrustumCulling[Hook: useFrustumCulling]

%% Services
generateMerfolkFromRuntimeTrace((Service: generateMerfolkFromRuntimeTrace))
SpatialHash((Service: SpatialHash))
signInUser((Service: signInUser))
handlePostLoginRedirect((Service: handlePostLoginRedirect))
signOut((Service: signOut))
handleRedirectResult((Service: handleRedirectResult))
observeAuthState((Service: observeAuthState))
validateAuthToken((Service: validateAuthToken))
handleUrlAuth((Service: handleUrlAuth))
CentralizedBroadcastManager((Service: CentralizedBroadcastManager))
subscribePlaneToBroadcasts((Service: subscribePlaneToBroadcasts))
getBroadcastManagerDebugInfo((Service: getBroadcastManagerDebugInfo))
cleanupBroadcastManager((Service: cleanupBroadcastManager))
resolveConnectionPositions((Service: resolveConnectionPositions))
connectionNeedsPositionResolution((Service: connectionNeedsPositionResolution))
pauseConnectionListeners((Service: pauseConnectionListeners))
resumeConnectionListeners((Service: resumeConnectionListeners))
addConnectionStateListener((Service: addConnectionStateListener))
enableConnectionNetwork((Service: enableConnectionNetwork))
disableConnectionNetwork((Service: disableConnectionNetwork))
getConnectionNetworkState((Service: getConnectionNetworkState))
saveConnection((Service: saveConnection))
subscribeToConnections((Service: subscribeToConnections))
deleteConnection((Service: deleteConnection))
deleteConnectionEnhanced((Service: deleteConnectionEnhanced))
exchangeGithubCode((Service: exchangeGithubCode))
fetchRepositories((Service: fetchRepositories))
fetchFileContent((Service: fetchFileContent))
fetchLatestCommitSha((Service: fetchLatestCommitSha))
fetchChangedFiles((Service: fetchChangedFiles))
fetchRepositoryStructure((Service: fetchRepositoryStructure))
generateMerfolkFromRepository((Service: generateMerfolkFromRepository))
getGithubToken((Service: getGithubToken))
setGithubToken((Service: setGithubToken))
isGithubAuthenticated((Service: isGithubAuthenticated))
getGithubOAuthUrl((Service: getGithubOAuthUrl))
handleGithubCallback((Service: handleGithubCallback))
scanRepositoryAndGenerateDiagram((Service: scanRepositoryAndGenerateDiagram))
mergeMerfolkMarkdown((Service: mergeMerfolkMarkdown))
rescanRepositoryForChanges((Service: rescanRepositoryForChanges))
GlobalOptimizationCoordinator((Service: GlobalOptimizationCoordinator))
initializeOptimizationCoordinator((Service: initializeOptimizationCoordinator))
getOptimizationStatus((Service: getOptimizationStatus))
consolidateSystem((Service: consolidateSystem))
cleanupOptimizationCoordinator((Service: cleanupOptimizationCoordinator))
getOrCreateSubscription((Service: getOrCreateSubscription))
forceCleanupSubscription((Service: forceCleanupSubscription))
getSubscriptionMetrics((Service: getSubscriptionMetrics))
cleanupAllSubscriptions((Service: cleanupAllSubscriptions))
getGroupDisplayName((Service: getGroupDisplayName))
getGroupColor((Service: getGroupColor))
MarkdownDiagramService((Service: MarkdownDiagramService))
markdownDiagramService((Service: markdownDiagramService))
createOrganization((Service: createOrganization))
getUserOrganizations((Service: getUserOrganizations))
getOrganizationById((Service: getOrganizationById))
getOrganizationMembers((Service: getOrganizationMembers))
getMemberCount((Service: getMemberCount))
isOrganizationAdmin((Service: isOrganizationAdmin))
inviteUserToOrganization((Service: inviteUserToOrganization))
getPendingInvitesForUser((Service: getPendingInvitesForUser))
acceptInvite((Service: acceptInvite))
declineInvite((Service: declineInvite))
removeMemberFromOrganization((Service: removeMemberFromOrganization))
leaveOrganization((Service: leaveOrganization))
updateOrganizationPlan((Service: updateOrganizationPlan))
deleteOrganization((Service: deleteOrganization))
setUserPresence((Service: setUserPresence))
setGuestPresence((Service: setGuestPresence))
subscribeToSpacePresence((Service: subscribeToSpacePresence))
ResourceCleanupService((Service: ResourceCleanupService))
resourceCleanupService((Service: resourceCleanupService))
validateScanUrl((Service: validateScanUrl))
scanWebsiteAndGenerateDiagram((Service: scanWebsiteAndGenerateDiagram))
ScreenRecordingService((Service: ScreenRecordingService))
screenRecorder((Service: screenRecorder))
sharedSpacesCacheSet((Service: sharedSpacesCacheSet))
isSharedSpace((Service: isSharedSpace))
checkSpaceExists((Service: checkSpaceExists))
registerSharedSpaceFromUrl((Service: registerSharedSpaceFromUrl))
getSpaceOwner((Service: getSpaceOwner))
findSpaceOwner((Service: findSpaceOwner))
generateSharingUrl((Service: generateSharingUrl))
getSharedSpaceInfo((Service: getSharedSpaceInfo))
getSpaceById((Service: getSpaceById))
createSpace((Service: createSpace))
getOrCreateDefaultSpace((Service: getOrCreateDefaultSpace))
migrateToDefaultSpace((Service: migrateToDefaultSpace))
getUserSpaces((Service: getUserSpaces))
deleteSpace((Service: deleteSpace))
hasSpaceAccess((Service: hasSpaceAccess))
getPublicSpaceMetadata((Service: getPublicSpaceMetadata))
objectsCache((Service: objectsCache))
saveTimeouts((Service: saveTimeouts))
updateThrottles((Service: updateThrottles))
lastReceivedObjects((Service: lastReceivedObjects))
movingObjects((Service: movingObjects))
objectCellMap((Service: objectCellMap))
cancelPendingSave((Service: cancelPendingSave))
enqueueSave((Service: enqueueSave))
flushSaveBatch((Service: flushSaveBatch))
clearAllObjectCaches((Service: clearAllObjectCaches))
saveObjectToCell((Service: saveObjectToCell))
deleteObjectFromSpatialCell((Service: deleteObjectFromSpatialCell))
updateObjectInSpatialCell((Service: updateObjectInSpatialCell))
subscribeToSpatialObjects((Service: subscribeToSpatialObjects))
updateCellSubscriptions((Service: updateCellSubscriptions))
moveObjectBetweenCells((Service: moveObjectBetweenCells))
loadObjectsFromCells((Service: loadObjectsFromCells))
saveObject((Service: saveObject))
deleteObject((Service: deleteObject))
updateObject((Service: updateObject))
subscribeToObjects((Service: subscribeToObjects))
getObjectDeletionStatus((Service: getObjectDeletionStatus))
clearObjectDeletionBlacklist((Service: clearObjectDeletionBlacklist))
getCellCoordinates((Service: getCellCoordinates))
getCellCoordinatesWithHysteresis((Service: getCellCoordinatesWithHysteresis))
getCellId((Service: getCellId))
parseCellId((Service: parseCellId))
getCellBounds((Service: getCellBounds))
createCell((Service: createCell))
createCellsBatch((Service: createCellsBatch))
cellExists((Service: cellExists))
cellExistsBulk((Service: cellExistsBulk))
getCell((Service: getCell))
addObjectToCell((Service: addObjectToCell))
removeObjectFromCell((Service: removeObjectFromCell))
getLoadedCells((Service: getLoadedCells))
getObjectsFromCells((Service: getObjectsFromCells))
updateObjectInCell((Service: updateObjectInCell))
deleteObjectFromCell((Service: deleteObjectFromCell))
subscribeToCells((Service: subscribeToCells))
getOccupiedCells((Service: getOccupiedCells))
getCellDistance((Service: getCellDistance))
getCellsToUnload((Service: getCellsToUnload))
addConnectionToCells((Service: addConnectionToCells))
bulkSaveConnectionsToCell((Service: bulkSaveConnectionsToCell))
addConnectionToCell((Service: addConnectionToCell))
removeConnectionFromAllCells((Service: removeConnectionFromAllCells))
removeConnectionFromCells((Service: removeConnectionFromCells))
removeConnectionFromCell((Service: removeConnectionFromCell))
getConnectionsFromCells((Service: getConnectionsFromCells))
updateConnectionInCells((Service: updateConnectionInCells))
getCellsInRadius((Service: getCellsInRadius))
getNeighborCells((Service: getNeighborCells))
debugCellRadius((Service: debugCellRadius))
debugNeighborCells((Service: debugNeighborCells))
debugCurrentCellLoading((Service: debugCurrentCellLoading))
findObjectInCells((Service: findObjectInCells))
getAllObjectsInSpace((Service: getAllObjectsInSpace))
findConnectionInCells((Service: findConnectionInCells))
purgeConnectionFromAllCells((Service: purgeConnectionFromAllCells))
deleteAllCellsInSpace((Service: deleteAllCellsInSpace))
uploadImageToStorage((Service: uploadImageToStorage))
uploadModelToStorage((Service: uploadModelToStorage))
uploadMarkdownToStorage((Service: uploadMarkdownToStorage))
StreamlinedSpatialManager((Service: StreamlinedSpatialManager))
getStreamlinedSpatialManager((Service: getStreamlinedSpatialManager))
initializeStreamlinedSpatialPartitioning((Service: initializeStreamlinedSpatialPartitioning))
benchmarkStreamlinedSystem((Service: benchmarkStreamlinedSystem))
UnifiedCacheManager((Service: UnifiedCacheManager))
initWebRTC((Service: initWebRTC))
BroadcastSession((Service: BroadcastSession))
startBroadcasting((Service: startBroadcasting))
joinBroadcast((Service: joinBroadcast))
isPlaneBeingBroadcast((Service: isPlaneBeingBroadcast))
findAvailableBroadcasts((Service: findAvailableBroadcasts))
cleanupWebRTC((Service: cleanupWebRTC))
registerUserPresence((Service: registerUserPresence))
subscribeToUsersInSpace((Service: subscribeToUsersInSpace))
BVHNode((Service: BVHNode))
BVHAcceleratedRaycaster((Service: BVHAcceleratedRaycaster))
FrameCounter((Service: FrameCounter))
GPUResourceTracker((Service: GPUResourceTracker))
ObjectVirtualizer((Service: ObjectVirtualizer))
Point3D((Service: Point3D))
BoundingBox((Service: BoundingBox))
OptimizedSpatialGrid((Service: OptimizedSpatialGrid))
TextAtlas((Service: TextAtlas))
MultiPageTextAtlas((Service: MultiPageTextAtlas))
WorkerMultiPageTextAtlas((Service: WorkerMultiPageTextAtlas))
LayoutEngine((Service: LayoutEngine))
AtlasPage((Service: AtlasPage))
index((Service: index))
sharedSpacesService((Service: sharedSpacesService))
authService((Service: authService))
centralizedBroadcastManager((Service: centralizedBroadcastManager))
connectionPositionResolver((Service: connectionPositionResolver))
connectionsService((Service: connectionsService))
githubRepoService((Service: githubRepoService))
globalOptimizationCoordinator((Service: globalOptimizationCoordinator))
globalSubscriptionManager((Service: globalSubscriptionManager))
constants((Service: constants))
organizationService((Service: organizationService))
presenceService((Service: presenceService))
runtimeScanService((Service: runtimeScanService))
screenRecordingService((Service: screenRecordingService))
sharingService((Service: sharingService))
spacesService((Service: spacesService))
spatialObjectsService((Service: spatialObjectsService))
spatialPartitioning((Service: spatialPartitioning))
storageService((Service: storageService))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
unifiedCacheManager((Service: unifiedCacheManager))
webRservice((Service: webRservice))

%% Stores
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
_buildConnectionsByObjectId[[Store: _buildConnectionsByObjectId]]
useConnectionStore[[Store: useConnectionStore]]
getCubeSelector[[Store: getCubeSelector]]
getCubeFaceColorSelector[[Store: getCubeFaceColorSelector]]
getCubeSelectedFaceSelector[[Store: getCubeSelectedFaceSelector]]
getCubeFaceStateSelector[[Store: getCubeFaceStateSelector]]
calculateLODLevel[[Store: calculateLODLevel]]
calculateParentLODLevel[[Store: calculateParentLODLevel]]
useLODStore[[Store: useLODStore]]
useSpaceManagerStore[[Store: useSpaceManagerStore]]
useSpatialManagerStore[[Store: useSpatialManagerStore]]
useStoreInitialization[[Store: useStoreInitialization]]
useCubeSelectors[[Store: useCubeSelectors]]
useCubeActions[[Store: useCubeActions]]
usePlaneSelectors[[Store: usePlaneSelectors]]
usePlaneActions[[Store: usePlaneActions]]
useGlobalStoreUtils[[Store: useGlobalStoreUtils]]
useTextAtlasStore[[Store: useTextAtlasStore]]
setCellBoundariesVisible[[Store: setCellBoundariesVisible]]
connectionStore[[Store: connectionStore]]
cubeStore[[Store: cubeStore]]
lodStore[[Store: lodStore]]
storeUtils[[Store: storeUtils]]
uiOverlayStore[[Store: uiOverlayStore]]

%% External Libraries
@eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint_plugin_react<Library: eslint_plugin_react>
eslint_plugin_react_hooks<Library: eslint_plugin_react_hooks>
eslint_plugin_react_refresh<Library: eslint_plugin_react_refresh>
firebase_admin/app<Library: firebase_admin/app>
firebase_admin/auth<Library: firebase_admin/auth>
firebase_admin/firestore<Library: firebase_admin/firestore>
firebase_functions/v2/https<Library: firebase_functions/v2/https>
firebase_functions/params<Library: firebase_functions/params>
puppeteer_core<Library: puppeteer_core>
@sparticuz/chromium<Library: @sparticuz/chromium>
express<Library: express>
cors<Library: cors>
dotenv<Library: dotenv>
react<Library: react>
@react_three/fiber<Library: @react_three/fiber>
@react_three/postprocessing<Library: @react_three/postprocessing>
@react_three/drei/core/Stats<Library: @react_three/drei/core/Stats>
lodash/isEqual<Library: lodash/isEqual>
@react_three/drei<Library: @react_three/drei>
three<Library: three>
react_colorful<Library: react_colorful>
zustand/shallow<Library: zustand/shallow>
@xyflow/react<Library: @xyflow/react>
@xyflow/react/dist/style_css<Library: @xyflow/react/dist/style_css>
three/examples/jsm/loaders/GLTFLoader<Library: three/examples/jsm/loaders/GLTFLoader>
three/examples/jsm/loaders/DRACOLoader<Library: three/examples/jsm/loaders/DRACOLoader>
firebase/database<Library: firebase/database>
firebase/auth<Library: firebase/auth>
firebase/firestore<Library: firebase/firestore>
firebase/app<Library: firebase/app>
firebase/storage<Library: firebase/storage>
firebase/functions<Library: firebase/functions>
zustand<Library: zustand>
prop_types<Library: prop_types>
draft_js<Library: draft_js>
draft_js/dist/Draft_css<Library: draft_js/dist/Draft_css>
react_dom/client<Library: react_dom/client>
@babel/parser<Library: @babel/parser>
_3d_ast_generator<Library: _3d_ast_generator>
fix_webm_duration<Library: fix_webm_duration>
uuid<Library: uuid>
zustand/traditional<Library: zustand/traditional>
comlink<Library: comlink>
vite<Library: vite>
@vitejs/plugin_react<Library: @vitejs/plugin_react>
vite_plugin_glsl<Library: vite_plugin_glsl>
vite_plugin_wasm<Library: vite_plugin_wasm>

%% Constants
MAX_EVENT_HANDLERS[Constant: MAX_EVENT_HANDLERS]
MAX_API_CALLS[Constant: MAX_API_CALLS]
ALLOWED_ORIGINS[Constant: ALLOWED_ORIGINS]
THROTTLE_FACE_TEXT[Constant: THROTTLE_FACE_TEXT]
THROTTLE_HEADER_TEXT[Constant: THROTTLE_HEADER_TEXT]
THROTTLE_CONNECTION_TEXT[Constant: THROTTLE_CONNECTION_TEXT]
THROTTLE_STANDARD[Constant: THROTTLE_STANDARD]
LINE_COLOR[Constant: LINE_COLOR]
UPDATE_INTERVAL[Constant: UPDATE_INTERVAL]
CUBE_FACE_NAMES[Constant: CUBE_FACE_NAMES]
TETRA_FACE_NAMES[Constant: TETRA_FACE_NAMES]
EMPTY_CONNECTIONS[Constant: EMPTY_CONNECTIONS]
DEFAULT_COLOR[Constant: DEFAULT_COLOR]
DEFAULT_TEXT_STYLE[Constant: DEFAULT_TEXT_STYLE]
DEFAULT_FACE_TEXT_STYLES[Constant: DEFAULT_FACE_TEXT_STYLES]
CUBE_SIZE[Constant: CUBE_SIZE]
cubeEdges[Constant: cubeEdges]
FACE_SIZE[Constant: FACE_SIZE]
SELECTED_OPACITY[Constant: SELECTED_OPACITY]
materialCache[Constant: materialCache]
faceMaterialProps[Constant: faceMaterialProps]
faces[Constant: faces]
FLOW_PATH_COLORS[Constant: FLOW_PATH_COLORS]
EDGE_STYLES[Constant: EDGE_STYLES]
DEFAULT_EDGE_STYLE[Constant: DEFAULT_EDGE_STYLE]
MARKER_ARROW[Constant: MARKER_ARROW]
MARKER_INHERIT[Constant: MARKER_INHERIT]
LABEL_CSS_CLASS[Constant: LABEL_CSS_CLASS]
customEdgeTypes[Constant: customEdgeTypes]
TYPE_STYLES[Constant: TYPE_STYLES]
DEFAULT_STYLE[Constant: DEFAULT_STYLE]
HIDDEN_HANDLE_STYLE[Constant: HIDDEN_HANDLE_STYLE]
BOX_SHADOW_SELECTED[Constant: BOX_SHADOW_SELECTED]
BOX_SHADOW_DEFAULT[Constant: BOX_SHADOW_DEFAULT]
PRECOMPUTED_NODE[Constant: PRECOMPUTED_NODE]
PRECOMPUTED_CONTAINER[Constant: PRECOMPUTED_CONTAINER]
customNodeTypes[Constant: customNodeTypes]
LAYER_DEFS[Constant: LAYER_DEFS]
DEFAULT_LAYERS[Constant: DEFAULT_LAYERS]
MINIMAP_COLORS[Constant: MINIMAP_COLORS]
LEGEND_SWATCH_STYLES[Constant: LEGEND_SWATCH_STYLES]
PRO_OPTIONS[Constant: PRO_OPTIONS]
OVERLAY_STYLE[Constant: OVERLAY_STYLE]
LOADING_OVERLAY_STYLE[Constant: LOADING_OVERLAY_STYLE]
ERROR_STYLE[Constant: ERROR_STYLE]
NO_DATA_OVERLAY_STYLE[Constant: NO_DATA_OVERLAY_STYLE]
MINIMAP_STYLE[Constant: MINIMAP_STYLE]
SELECTED_NODE_STYLE[Constant: SELECTED_NODE_STYLE]
DIVIDER_STYLE[Constant: DIVIDER_STYLE]
SECTION_HEADER_STYLE[Constant: SECTION_HEADER_STYLE]
CHECKBOX_STYLE[Constant: CHECKBOX_STYLE]
LEGEND_PANEL_STYLE[Constant: LEGEND_PANEL_STYLE]
LEGEND_ITEM_STYLE[Constant: LEGEND_ITEM_STYLE]
LEGEND_TEXT_STYLE[Constant: LEGEND_TEXT_STYLE]
panelStyle[Constant: panelStyle]
backButtonStyle[Constant: backButtonStyle]
filterLabelStyle[Constant: filterLabelStyle]
selectStyle[Constant: selectStyle]
dodecahedronFaceMaterialCache[Constant: dodecahedronFaceMaterialCache]
DEBUG[Constant: DEBUG]
indicatorMaterialCache[Constant: indicatorMaterialCache]
FRUSTUM_CULLING_THRESHOLD[Constant: FRUSTUM_CULLING_THRESHOLD]
BASE_CUBE_EDGES[Constant: BASE_CUBE_EDGES]
EDGES_PER_CUBE[Constant: EDGES_PER_CUBE]
NORMAL_OFFSET[Constant: NORMAL_OFFSET]
CUBE_FACES[Constant: CUBE_FACES]
FACE_QUATERNIONS[Constant: FACE_QUATERNIONS]
PHI[Constant: PHI]
DODECA_SCALE[Constant: DODECA_SCALE]
DODECA_EDGES[Constant: DODECA_EDGES]
EDGES_PER_DODECAHEDRON[Constant: EDGES_PER_DODECAHEDRON]
TETRAHEDRON_SIZE[Constant: TETRAHEDRON_SIZE]
TETRA_VERTICES[Constant: TETRA_VERTICES]
TETRA_EDGES[Constant: TETRA_EDGES]
EDGES_PER_TETRAHEDRON[Constant: EDGES_PER_TETRAHEDRON]
VERTEX_SHADER[Constant: VERTEX_SHADER]
FRAGMENT_SHADER[Constant: FRAGMENT_SHADER]
LOD_UPDATE_INTERVAL[Constant: LOD_UPDATE_INTERVAL]
CAMERA_MOVE_THRESHOLD[Constant: CAMERA_MOVE_THRESHOLD]
CAMERA_MOVE_THRESHOLD_SQ[Constant: CAMERA_MOVE_THRESHOLD_SQ]
LOD_UPGRADE_BUDGET_PER_FRAME[Constant: LOD_UPGRADE_BUDGET_PER_FRAME]
FRAME_TIME_THROTTLE_MS[Constant: FRAME_TIME_THROTTLE_MS]
TRANSFORM_CONTROLS_CONFIG[Constant: TRANSFORM_CONTROLS_CONFIG]
MOUNT_BUDGET[Constant: MOUNT_BUDGET]
MOUNT_BUDGET_MOVING[Constant: MOUNT_BUDGET_MOVING]
PROGRESSIVE_THRESHOLD[Constant: PROGRESSIVE_THRESHOLD]
INITIAL_LOAD[Constant: INITIAL_LOAD]
PAGE_SIZE[Constant: PAGE_SIZE]
tetrahedronVertices[Constant: tetrahedronVertices]
SHARED_TETRAHEDRON_FACES[Constant: SHARED_TETRAHEDRON_FACES]
DEFAULT_OPACITY[Constant: DEFAULT_OPACITY]
tetrahedronFaceMaterialCache[Constant: tetrahedronFaceMaterialCache]
WEBCAM_CONSTRAINTS[Constant: WEBCAM_CONSTRAINTS]
firebaseConfig[Constant: firebaseConfig]
isValidFirebaseConfig[Constant: isValidFirebaseConfig]
CLEANUP_INTERVAL[Constant: CLEANUP_INTERVAL]
DEFAULT_EXCLUDE_SELECTORS[Constant: DEFAULT_EXCLUDE_SELECTORS]
FONT_FAMILY[Constant: FONT_FAMILY]
PLAN_LABELS[Constant: PLAN_LABELS]
btnBase[Constant: btnBase]
btnPrimary[Constant: btnPrimary]
btnSecondary[Constant: btnSecondary]
btnDanger[Constant: btnDanger]
TABLE_STYLES[Constant: TABLE_STYLES]
LINK_STYLES[Constant: LINK_STYLES]
BTN_STYLES[Constant: BTN_STYLES]
SHARE_BTN_STYLES[Constant: SHARE_BTN_STYLES]
TRASH_BTN_STYLES[Constant: TRASH_BTN_STYLES]
LEAVE_BTN_STYLES[Constant: LEAVE_BTN_STYLES]
INVITE_BANNER_BASE[Constant: INVITE_BANNER_BASE]
INVITE_TEXT_STYLES[Constant: INVITE_TEXT_STYLES]
INVITE_BTN_ROW[Constant: INVITE_BTN_ROW]
ACCEPT_BTN_STYLES[Constant: ACCEPT_BTN_STYLES]
NO_SPACES_TEXT[Constant: NO_SPACES_TEXT]
TIER_LIMITS[Constant: TIER_LIMITS]
GITHUB_API_BASE[Constant: GITHUB_API_BASE]
MAX_SUBSCRIPTION_AGE[Constant: MAX_SUBSCRIPTION_AGE]
SUBSCRIPTION_TYPES[Constant: SUBSCRIPTION_TYPES]
subscriptionMetrics[Constant: subscriptionMetrics]
generateSubscriptionKey[Constant: generateSubscriptionKey]
connectionMethods[Constant: connectionMethods]
NODE_TYPE_COMPONENT[Constant: NODE_TYPE_COMPONENT]
NODE_TYPE_FUNCTION[Constant: NODE_TYPE_FUNCTION]
NODE_TYPE_STORE[Constant: NODE_TYPE_STORE]
NODE_TYPE_SERVICE[Constant: NODE_TYPE_SERVICE]
NODE_TYPE_LIBRARY[Constant: NODE_TYPE_LIBRARY]
NODE_TYPE_UTILITY[Constant: NODE_TYPE_UTILITY]
NODE_TYPE_DATAPATH[Constant: NODE_TYPE_DATAPATH]
NODE_TYPE_HANDLER[Constant: NODE_TYPE_HANDLER]
NODE_TYPE_CONTROL[Constant: NODE_TYPE_CONTROL]
NODE_TYPE_STATE[Constant: NODE_TYPE_STATE]
NODE_TYPE_DATA[Constant: NODE_TYPE_DATA]
NODE_TYPE_HOOK[Constant: NODE_TYPE_HOOK]
NODE_TYPE_MODULE[Constant: NODE_TYPE_MODULE]
NODE_TYPE_CLASS[Constant: NODE_TYPE_CLASS]
NODE_TYPE_INTERFACE[Constant: NODE_TYPE_INTERFACE]
NODE_TYPE_VARIABLE[Constant: NODE_TYPE_VARIABLE]
NODE_TYPE_CONSTANT[Constant: NODE_TYPE_CONSTANT]
OBJECT_TYPE_CUBE[Constant: OBJECT_TYPE_CUBE]
OBJECT_TYPE_DODECAHEDRON[Constant: OBJECT_TYPE_DODECAHEDRON]
OBJECT_TYPE_TETRAHEDRON[Constant: OBJECT_TYPE_TETRAHEDRON]
UI_COMPONENTS[Constant: UI_COMPONENTS]
MAX_RECURSION_DEPTH[Constant: MAX_RECURSION_DEPTH]
BASE_DODECAHEDRON_SIZE[Constant: BASE_DODECAHEDRON_SIZE]
BASE_DODECAHEDRON_RADIUS[Constant: BASE_DODECAHEDRON_RADIUS]
DEFAULT_CAMERA_DISTANCE[Constant: DEFAULT_CAMERA_DISTANCE]
SPACING_BETWEEN_COMPONENTS[Constant: SPACING_BETWEEN_COMPONENTS]
DEFAULT_CUBE_SIZE[Constant: DEFAULT_CUBE_SIZE]
DEFAULT_SPHERE_SIZE[Constant: DEFAULT_SPHERE_SIZE]
DEFAULT_CONTAINER_SIZE[Constant: DEFAULT_CONTAINER_SIZE]
MIN_SCALE_FACTOR[Constant: MIN_SCALE_FACTOR]
DESIRED_GAP[Constant: DESIRED_GAP]
GROUP_CONTAINER_COLORS[Constant: GROUP_CONTAINER_COLORS]
GROUP_DISPLAY_NAMES[Constant: GROUP_DISPLAY_NAMES]
containerMethods[Constant: containerMethods]
hierarchyMethods[Constant: hierarchyMethods]
objectMethods[Constant: objectMethods]
positionMethods[Constant: positionMethods]
processMethods[Constant: processMethods]
scaleMethods[Constant: scaleMethods]
PLAN_LIMITS[Constant: PLAN_LIMITS]
SHARED_SPACES_CACHE_MAX[Constant: SHARED_SPACES_CACHE_MAX]
BATCH_FLUSH_DELAY[Constant: BATCH_FLUSH_DELAY]
CELL_SIZE[Constant: CELL_SIZE]
CELL_NEIGHBOR_RADIUS[Constant: CELL_NEIGHBOR_RADIUS]
CELL_UNLOAD_DISTANCE[Constant: CELL_UNLOAD_DISTANCE]
CELL_BOUNDARY_HYSTERESIS[Constant: CELL_BOUNDARY_HYSTERESIS]
CACHE_DURATION[Constant: CACHE_DURATION]
MAX_CACHE_SIZE[Constant: MAX_CACHE_SIZE]
MOVE_TIMEOUT[Constant: MOVE_TIMEOUT]
MAX_IMAGE_SIZE[Constant: MAX_IMAGE_SIZE]
MAX_MODEL_SIZE[Constant: MAX_MODEL_SIZE]
CACHE_CONFIG[Constant: CACHE_CONFIG]
cellExistenceCache[Constant: cellExistenceCache]
connectionCache[Constant: connectionCache]
memoizationCache[Constant: memoizationCache]
LOD_THRESHOLDS[Constant: LOD_THRESHOLDS]
LOD_THRESHOLDS_SQ[Constant: LOD_THRESHOLDS_SQ]
LOD_THRESHOLDS_PARENT[Constant: LOD_THRESHOLDS_PARENT]
LOD_THRESHOLDS_PARENT_SQ[Constant: LOD_THRESHOLDS_PARENT_SQ]
LOD_LEVELS[Constant: LOD_LEVELS]
FACE_TEXT_DISTANCE[Constant: FACE_TEXT_DISTANCE]
FACE_TEXT_DISTANCE_SQ[Constant: FACE_TEXT_DISTANCE_SQ]
ANIMATION_DEBUG[Constant: ANIMATION_DEBUG]
perfMetrics[Constant: perfMetrics]
NUMERIC_FACE_RE[Constant: NUMERIC_FACE_RE]
_PHI[Constant: _PHI]
_DODECA_SCALE[Constant: _DODECA_SCALE]
_DODECA_VERTICES[Constant: _DODECA_VERTICES]
_DODECA_FACES[Constant: _DODECA_FACES]
_TETRA_SIZE[Constant: _TETRA_SIZE]
_TETRA_VERTICES[Constant: _TETRA_VERTICES]
_TETRA_FACE_CENTERS[Constant: _TETRA_FACE_CENTERS]
_NUMERIC_TO_CUBE_FACE[Constant: _NUMERIC_TO_CUBE_FACE]
WARN_GEOMETRIES[Constant: WARN_GEOMETRIES]
WARN_MATERIALS[Constant: WARN_MATERIALS]
WARN_TEXTURES[Constant: WARN_TEXTURES]
CACHE_LIFETIME[Constant: CACHE_LIFETIME]
POSITION_PRECISION[Constant: POSITION_PRECISION]
CLEAN_PROBABILITY[Constant: CLEAN_PROBABILITY]
FRAME_TIME_BUDGET_MS[Constant: FRAME_TIME_BUDGET_MS]
BAD_FRAME_THRESHOLD[Constant: BAD_FRAME_THRESHOLD]
MOVE_COUNT_WINDOW_MS[Constant: MOVE_COUNT_WINDOW_MS]
MOVE_SETTLE_MS[Constant: MOVE_SETTLE_MS]
SNAP_THRESHOLD[Constant: SNAP_THRESHOLD]
tempPoint[Constant: tempPoint]
tempBounds[Constant: tempBounds]
PAGE_MAX_SIZE[Constant: PAGE_MAX_SIZE]
MAX_PAGES[Constant: MAX_PAGES]
ValidationUtils[Constant: ValidationUtils]
BASE_NODE_WIDTH[Constant: BASE_NODE_WIDTH]
BASE_NODE_HEIGHT[Constant: BASE_NODE_HEIGHT]
CHAR_WIDTH[Constant: CHAR_WIDTH]
MIN_NODE_WIDTH[Constant: MIN_NODE_WIDTH]
MAX_NODE_WIDTH[Constant: MAX_NODE_WIDTH]
LAYER_SPACING[Constant: LAYER_SPACING]
NODE_SPACING[Constant: NODE_SPACING]
CONTAINER_PAD_TOP[Constant: CONTAINER_PAD_TOP]
CONTAINER_PAD[Constant: CONTAINER_PAD]
CONN_CONTROLFLOW[Constant: CONN_CONTROLFLOW]
CONN_DOTTED[Constant: CONN_DOTTED]
CONN_DATAFLOW[Constant: CONN_DATAFLOW]
workerApi[Constant: workerApi]
LOD_CHILD_FULL_SQ[Constant: LOD_CHILD_FULL_SQ]
LOD_CHILD_MEDIUM_SQ[Constant: LOD_CHILD_MEDIUM_SQ]
LOD_PARENT_FULL_SQ[Constant: LOD_PARENT_FULL_SQ]
LOD_PARENT_MEDIUM_SQ[Constant: LOD_PARENT_MEDIUM_SQ]
PADDING[Constant: PADDING]
pages[Constant: pages]

%% Variables
isNetworkEnabled[Variable: isNetworkEnabled]
listenersArePaused[Variable: listenersArePaused]
batchFlushTimer[Variable: batchFlushTimer]
_storageInstance[Variable: _storageInstance]
globalStreamlinedManager[Variable: globalStreamlinedManager]
_pendingSetObjectsTimer[Variable: _pendingSetObjectsTimer]
isAnimating[Variable: isAnimating]
lastTimestamp[Variable: lastTimestamp]
animationSpeed[Variable: animationSpeed]
animationFrame[Variable: animationFrame]
globalBVH[Variable: globalBVH]
lastLODUpdateTime[Variable: lastLODUpdateTime]
isInitialLoading[Variable: isInitialLoading]
_workerBusy[Variable: _workerBusy]
_frameBudget[Variable: _frameBudget]
_frameUsed[Variable: _frameUsed]
_resetScheduled[Variable: _resetScheduled]
_prevFrameTs[Variable: _prevFrameTs]
_smoothFrameTime[Variable: _smoothFrameTime]
_consecutiveBadFrames[Variable: _consecutiveBadFrames]
_moveCount[Variable: _moveCount]
_moveCountResetTime[Variable: _moveCountResetTime]
_frameTrackingRunning[Variable: _frameTrackingRunning]
_lastMoveTs[Variable: _lastMoveTs]
globalAtlas[Variable: globalAtlas]
_offscreenCanvasSupported[Variable: _offscreenCanvasSupported]
_proxy[Variable: _proxy]
_worker[Variable: _worker]
maxGPUTextureSize[Variable: maxGPUTextureSize]
instance[Variable: instance]
worker[Variable: worker]

%% Child Nodes (Component Internal Functions)
appObjects[Function: appObjects]
appCanViewSpace[Function: appCanViewSpace]
appShouldRedirect[Function: appShouldRedirect]
appHandleSpatialObjectChange[Function: appHandleSpatialObjectChange]
appSpatialManagerDebug[Function: appSpatialManagerDebug]
appCheckPositionJitterWithHistory[Function: appCheckPositionJitterWithHistory]
appLoadedCellsKey[Function: appLoadedCellsKey]
appHandleObjectMatrixChanged[Function: appHandleObjectMatrixChanged]
appDisableOrbitControls[Function: appDisableOrbitControls]
appEnableOrbitControls[Function: appEnableOrbitControls]
appHandleLogin[Function: appHandleLogin]
appHandleObjectClick[Function: appHandleObjectClick]
appHandleObjectMoveCallback[Function: appHandleObjectMoveCallback]
appHandleObjectUpdateCallback[Function: appHandleObjectUpdateCallback]
appHandleFaceIndicatorClickCallback[Function: appHandleFaceIndicatorClickCallback]
appHandleFaceClick[Function: appHandleFaceClick]
appHandleCanvasClick[Function: appHandleCanvasClick]
appUpdateVisibleObjects[Function: appUpdateVisibleObjects]
appThrottledUpdateVisibility[Function: appThrottledUpdateVisibility]
appDeviceInfo[Function: appDeviceInfo]
appCanvasSettings[Function: appCanvasSettings]
appshellHandleOpenSpace[Function: appshellHandleOpenSpace]
appshellHandleBackToLanding[Function: appshellHandleBackToLanding]
animatedconnectionlineStructuralKey[Function: animatedconnectionlineStructuralKey]
atlastextspriteAtlas[Function: atlastextspriteAtlas]
atlastextspriteCalculatedPosition[Function: atlastextspriteCalculatedPosition]
batchedconnectionlinesStraightConnections[Function: batchedconnectionlinesStraightConnections]
batchedconnectionlinesCustomRaycast[Function: batchedconnectionlinesCustomRaycast]
batchedconnectionlinesHandleClick[Function: batchedconnectionlinesHandleClick]
batchedconnectionlinesHandlePointerOver[Function: batchedconnectionlinesHandlePointerOver]
batchedconnectionlinesHandlePointerOut[Function: batchedconnectionlinesHandlePointerOut]
batchedcurvedlinesPathsData[Function: batchedcurvedlinesPathsData]
batchedcurvedlinesCustomRaycast[Function: batchedcurvedlinesCustomRaycast]
batchedcurvedlinesHandleClick[Function: batchedcurvedlinesHandleClick]
batchedcurvedlinesHandlePointerOver[Function: batchedcurvedlinesHandlePointerOver]
batchedcurvedlinesHandlePointerOut[Function: batchedcurvedlinesHandlePointerOut]
cellboundaryrendererBuildGeometry[Function: cellboundaryrendererBuildGeometry]
colorpickerHandleColorChange[Function: colorpickerHandleColorChange]
colorpickerHandleContainerClick[Function: colorpickerHandleContainerClick]
colorpickerHandleApplyColor[Function: colorpickerHandleApplyColor]
colorpickerHandleCancel[Function: colorpickerHandleCancel]
connectionGetLineWidth[Function: connectionGetLineWidth]
connectionHandleConnectionClick[Function: connectionHandleConnectionClick]
connectionHandleLineTextClick[Function: connectionHandleLineTextClick]
connectionHandleLineTextSubmit[Function: connectionHandleLineTextSubmit]
connectionHandleLineTextStyleChange[Function: connectionHandleLineTextStyleChange]
connectionHandleLineStyleChange[Function: connectionHandleLineStyleChange]
connectionHandleLineColorChange[Function: connectionHandleLineColorChange]
connectionConnectionData[Function: connectionConnectionData]
connectionPathData[Function: connectionPathData]
connectionTextPositionData[Function: connectionTextPositionData]
connectionsrendererAvailableObjectIds[Function: connectionsrendererAvailableObjectIds]
connectionsrendererPathfindingObjects[Function: connectionsrendererPathfindingObjects]
connectionsrendererObjectsPositionHash[Function: connectionsrendererObjectsPositionHash]
connectionsrendererObjectVisibleConnections[Function: connectionsrendererObjectVisibleConnections]
connectionsrendererFocusedConnections[Function: connectionsrendererFocusedConnections]
connectionsrendererFlowPathHighlightedConnections[Function: connectionsrendererFlowPathHighlightedConnections]
connectionsrendererConnectionsForCulling[Function: connectionsrendererConnectionsForCulling]
connectionsrendererProgressiveConnections[Function: connectionsrendererProgressiveConnections]
connectionsrendererObjectPositions[Function: connectionsrendererObjectPositions]
connectionsrendererAllStraightConnections[Function: connectionsrendererAllStraightConnections]
connectionsrendererFaceOverrides[Function: connectionsrendererFaceOverrides]
connectionsrendererTextLabels[Function: connectionsrendererTextLabels]
connectionsrendererHandleBatchedConnectionClick[Function: connectionsrendererHandleBatchedConnectionClick]
cubeCubeData[Function: cubeCubeData]
cubeIsIndicatorConnected[Function: cubeIsIndicatorConnected]
cubeIsIndicatorActive[Function: cubeIsIndicatorActive]
cubeGetUIPositions[Function: cubeGetUIPositions]
cubeShouldShowIndicator[Function: cubeShouldShowIndicator]
cubeHasConnectedIndicators[Function: cubeHasConnectedIndicators]
cubeGetFaceTextOffset[Function: cubeGetFaceTextOffset]
cubeHandleSceneClick[Function: cubeHandleSceneClick]
cubeUpdateDatabase[Function: cubeUpdateDatabase]
cubeOnClickOutside[Function: cubeOnClickOutside]
cubeHandleFaceClick[Function: cubeHandleFaceClick]
cubeHandleColoredFaceClick[Function: cubeHandleColoredFaceClick]
cubeHandleIndicatorClick[Function: cubeHandleIndicatorClick]
cubeHandleTransformToggle[Function: cubeHandleTransformToggle]
cubeHandleResizeToggle[Function: cubeHandleResizeToggle]
cubeHandleHeaderToggle[Function: cubeHandleHeaderToggle]
cubeHandleHeaderSubmit[Function: cubeHandleHeaderSubmit]
cubeDebouncedUpdate[Function: cubeDebouncedUpdate]
cubeHandleLineColorChange[Function: cubeHandleLineColorChange]
cubeHandleFaceColorChange[Function: cubeHandleFaceColorChange]
cubeHandleTextClick[Function: cubeHandleTextClick]
cubeHandleFaceTextClick[Function: cubeHandleFaceTextClick]
cubeHandleFaceTextSubmit[Function: cubeHandleFaceTextSubmit]
cubeHandleFaceTextStyleClick[Function: cubeHandleFaceTextStyleClick]
cubeHandleStyleChange[Function: cubeHandleStyleChange]
cubeHandleDrag[Function: cubeHandleDrag]
cubeHandleScale[Function: cubeHandleScale]
cubeRenderFaces[Function: cubeRenderFaces]
cubeRenderFaceTexts[Function: cubeRenderFaceTexts]
cubefaceFaceStateSelector[Function: cubefaceFaceStateSelector]
cubefaceFaceMaterial[Function: cubefaceFaceMaterial]
cubefaceHandleClick[Function: cubefaceHandleClick]
cubefaceOffsetMultiplier[Function: cubefaceOffsetMultiplier]
cubefaceOffsetPosition[Function: cubefaceOffsetPosition]
customcameraMemoizedTarget[Function: customcameraMemoizedTarget]
customcameraControlsRefCallback[Function: customcameraControlsRefCallback]
diagramoverlay2dFlowPathNames[Function: diagramoverlay2dFlowPathNames]
diagramoverlay2dSerialisedGraphData[Function: diagramoverlay2dSerialisedGraphData]
diagramoverlay2dSerialisedHierarchy[Function: diagramoverlay2dSerialisedHierarchy]
diagramoverlay2dFilteredEdges[Function: diagramoverlay2dFilteredEdges]
diagramoverlay2dToggleLayer[Function: diagramoverlay2dToggleLayer]
diagramoverlay2dToggleLayerHandlers[Function: diagramoverlay2dToggleLayerHandlers]
diagramoverlay2dHandleNodeClick[Function: diagramoverlay2dHandleNodeClick]
diagramoverlay2dHandleBackTo3D[Function: diagramoverlay2dHandleBackTo3D]
sphereDodecahedronData[Function: sphereDodecahedronData]
sphereUpdateObjectAndStores[Function: sphereUpdateObjectAndStores]
sphereUpdateFaceProperty[Function: sphereUpdateFaceProperty]
sphereIsIndicatorConnected[Function: sphereIsIndicatorConnected]
sphereOnClickOutside[Function: sphereOnClickOutside]
sphereUpdateDatabase[Function: sphereUpdateDatabase]
sphereHandleTransformToggle[Function: sphereHandleTransformToggle]
sphereHandleHeaderToggle[Function: sphereHandleHeaderToggle]
sphereHandleHeaderSubmit[Function: sphereHandleHeaderSubmit]
sphereHandleResizeToggle[Function: sphereHandleResizeToggle]
sphereHandleDrag[Function: sphereHandleDrag]
sphereHandleScale[Function: sphereHandleScale]
sphereHandleFaceClick[Function: sphereHandleFaceClick]
sphereHandleIndicatorClick[Function: sphereHandleIndicatorClick]
sphereHandleHeaderClick[Function: sphereHandleHeaderClick]
sphereHandleStyleChange[Function: sphereHandleStyleChange]
sphereHandleLineColorChange[Function: sphereHandleLineColorChange]
sphereHandleBackgroundClick[Function: sphereHandleBackgroundClick]
sphereHandleFaceTextSubmit[Function: sphereHandleFaceTextSubmit]
sphereHandleFaceTextButtonClick[Function: sphereHandleFaceTextButtonClick]
sphereHandleFaceTextClick[Function: sphereHandleFaceTextClick]
sphereHandleFaceTextStyleChange[Function: sphereHandleFaceTextStyleChange]
sphereGetUIPosition[Function: sphereGetUIPosition]
sphereGetHeaderPosition[Function: sphereGetHeaderPosition]
sphereGetFaceUIPosition[Function: sphereGetFaceUIPosition]
sphereGetFaceTextPosition[Function: sphereGetFaceTextPosition]
sphereGetFaceInfo[Function: sphereGetFaceInfo]
sphereGetFaceRotation[Function: sphereGetFaceRotation]
sphereShouldShowFaceIndicator[Function: sphereShouldShowFaceIndicator]
sphereGetHeaderInputPosition[Function: sphereGetHeaderInputPosition]
dodecahedronfaceFaceMaterial[Function: dodecahedronfaceFaceMaterial]
dodecahedronfaceHandleClick[Function: dodecahedronfaceHandleClick]
dodecahedronfaceHandleTextClick[Function: dodecahedronfaceHandleTextClick]
dodecahedronfaceInverseScale[Function: dodecahedronfaceInverseScale]
dodecahedronfaceAdjustedTextPosition[Function: dodecahedronfaceAdjustedTextPosition]
faceindicatorMaterial[Function: faceindicatorMaterial]
facetextinputHandleKeyDown[Function: facetextinputHandleKeyDown]
facetextinputHandleChange[Function: facetextinputHandleChange]
facetextinputHandleFocus[Function: facetextinputHandleFocus]
facetextinputHandleBlur[Function: facetextinputHandleBlur]
faceuiHandleBorderStyleClick[Function: faceuiHandleBorderStyleClick]
faceuiHandleBorderColorClick[Function: faceuiHandleBorderColorClick]
faceuiHandleLineThicknessClick[Function: faceuiHandleLineThicknessClick]
faceuiHandleColorSelect[Function: faceuiHandleColorSelect]
faceuiHandleToolClick[Function: faceuiHandleToolClick]
globalcubeedgesrendererFilteredCubes[Function: globalcubeedgesrendererFilteredCubes]
globalcubeedgesrendererCubeIds[Function: globalcubeedgesrendererCubeIds]
globalcubeedgesrendererIsCubeVisible[Function: globalcubeedgesrendererIsCubeVisible]
globalcubeedgesrendererUpdateCubeEdges[Function: globalcubeedgesrendererUpdateCubeEdges]
globalcubefacerendererFilteredCubes[Function: globalcubefacerendererFilteredCubes]
globalcubemediumlodrendererMediumCubes[Function: globalcubemediumlodrendererMediumCubes]
globalcubemediumlodrendererCubeIds[Function: globalcubemediumlodrendererCubeIds]
globaldodecahedronedgesrendererFilteredDodecahedrons[Function: globaldodecahedronedgesrendererFilteredDodecahedrons]
globaldodecahedronedgesrendererDodecahedronIds[Function: globaldodecahedronedgesrendererDodecahedronIds]
globaldodecahedronedgesrendererIsDodecahedronVisible[Function: globaldodecahedronedgesrendererIsDodecahedronVisible]
globaldodecahedronedgesrendererUpdateDodecahedronEdges[Function: globaldodecahedronedgesrendererUpdateDodecahedronEdges]
globaldodecahedronmediumlodrendererMediumDodecahedrons[Function: globaldodecahedronmediumlodrendererMediumDodecahedrons]
globaldodecahedronmediumlodrendererDodecaIds[Function: globaldodecahedronmediumlodrendererDodecaIds]
globaltetrahedronedgesrendererFilteredTetrahedrons[Function: globaltetrahedronedgesrendererFilteredTetrahedrons]
globaltetrahedronedgesrendererTetrahedronIds[Function: globaltetrahedronedgesrendererTetrahedronIds]
globaltetrahedronedgesrendererIsTetrahedronVisible[Function: globaltetrahedronedgesrendererIsTetrahedronVisible]
globaltetrahedronedgesrendererUpdateTetrahedronEdges[Function: globaltetrahedronedgesrendererUpdateTetrahedronEdges]
globaltetrahedronmediumlodrendererMediumTetrahedrons[Function: globaltetrahedronmediumlodrendererMediumTetrahedrons]
globaltetrahedronmediumlodrendererTetraIds[Function: globaltetrahedronmediumlodrendererTetraIds]
headerinputHandleKeyDown[Function: headerinputHandleKeyDown]
headerinputHandleChange[Function: headerinputHandleChange]
headerinputHandleFocus[Function: headerinputHandleFocus]
headerinputHandleBlur[Function: headerinputHandleBlur]
instancedatlastextAtlas[Function: instancedatlastextAtlas]
instancedatlastextPageGroups[Function: instancedatlastextPageGroups]
pageinstancedmeshGeometry[Function: pageinstancedmeshGeometry]
pageinstancedmeshMaterial[Function: pageinstancedmeshMaterial]
pageinstancedmeshHandleClick[Function: pageinstancedmeshHandleClick]
instancedlineFlatPoints[Function: instancedlineFlatPoints]
instancedlineGeometry[Function: instancedlineGeometry]
instancedlineCustomRaycast[Function: instancedlineCustomRaycast]
instancedlineMaterial[Function: instancedlineMaterial]
lineuiGetFullStyle[Function: lineuiGetFullStyle]
lineuiGetBaseStyle[Function: lineuiGetBaseStyle]
lineuiHandleToolClick[Function: lineuiHandleToolClick]
lineuiHandleLineStyleClick[Function: lineuiHandleLineStyleClick]
lineuiHandleArrowClick[Function: lineuiHandleArrowClick]
lodmanagerContainersKey[Function: lodmanagerContainersKey]
lodmanagerComputeContainmentSync[Function: lodmanagerComputeContainmentSync]
modelobjectHandleClick[Function: modelobjectHandleClick]
modelobjectHandlePointerDown[Function: modelobjectHandlePointerDown]
modelobjectHandlePointerUp[Function: modelobjectHandlePointerUp]
objectrendererOnClickStable[Function: objectrendererOnClickStable]
objectrendererOnDeleteStable[Function: objectrendererOnDeleteStable]
objectrendererOnTransformStartStable[Function: objectrendererOnTransformStartStable]
objectrendererOnTransformEndStable[Function: objectrendererOnTransformEndStable]
objectrendererOnMatrixChangedStable[Function: objectrendererOnMatrixChangedStable]
objectrendererOnMoveStable[Function: objectrendererOnMoveStable]
objectsrendererProgressiveVisibleObjects[Function: objectsrendererProgressiveVisibleObjects]
objectsrendererCubeObjects[Function: objectsrendererCubeObjects]
objectsrendererContainerHeaders[Function: objectsrendererContainerHeaders]
objectsrendererDodecahedronObjects[Function: objectsrendererDodecahedronObjects]
objectsrendererTetrahedronObjects[Function: objectsrendererTetrahedronObjects]
objectsrendererRenderedObjects[Function: objectsrendererRenderedObjects]
objectuiHandleEyeClick[Function: objectuiHandleEyeClick]
objectuiHandleColorPick[Function: objectuiHandleColorPick]
objectuiHandleToolClick[Function: objectuiHandleToolClick]
planePlaneData[Function: planePlaneData]
planeCloseAllUIs[Function: planeCloseAllUIs]
planeUpdateDatabase[Function: planeUpdateDatabase]
planeHandleScale[Function: planeHandleScale]
planeHandleResizeEnd[Function: planeHandleResizeEnd]
planeHandleDrag[Function: planeHandleDrag]
planeHandleTransformStart[Function: planeHandleTransformStart]
planeHandleTransformEnd[Function: planeHandleTransformEnd]
planeHandleClick[Function: planeHandleClick]
planeHandleTextClick[Function: planeHandleTextClick]
planeHandleTextSubmit[Function: planeHandleTextSubmit]
planeHandleTextStyleChange[Function: planeHandleTextStyleChange]
planeHandleTextSpriteClick[Function: planeHandleTextSpriteClick]
planeHandleTransformToggle[Function: planeHandleTransformToggle]
planeHandleResizeToggle[Function: planeHandleResizeToggle]
planeHandleColorChange[Function: planeHandleColorChange]
planeHandleHeaderToggle[Function: planeHandleHeaderToggle]
planeHandleHeaderSubmit[Function: planeHandleHeaderSubmit]
planeHandleHeaderTextClick[Function: planeHandleHeaderTextClick]
planeHandleHeaderStyleChange[Function: planeHandleHeaderStyleChange]
planeHandleBorderToggle[Function: planeHandleBorderToggle]
planeHandleIndicatorClick[Function: planeHandleIndicatorClick]
planeIsIndicatorConnected[Function: planeIsIndicatorConnected]
planeShouldShowIndicator[Function: planeShouldShowIndicator]
planeHandleBroadcastStopped[Function: planeHandleBroadcastStopped]
planeHandleWebcamToggle[Function: planeHandleWebcamToggle]
planeHandleScreenShareToggle[Function: planeHandleScreenShareToggle]
planeHandlePinToggle[Function: planeHandlePinToggle]
planeHandleImageUpload[Function: planeHandleImageUpload]
planeHandleBroadcastStarted[Function: planeHandleBroadcastStarted]
planeHandleViewerCountChange[Function: planeHandleViewerCountChange]
planeUiPositions[Function: planeUiPositions]
planeIndicatorPosition[Function: planeIndicatorPosition]
planeMeshMaterial[Function: planeMeshMaterial]
planeLineMaterialProps[Function: planeLineMaterialProps]
planeBorderEdgePoints[Function: planeBorderEdgePoints]
realtimeconnectionupdaterRunConnectionUpdate[Function: realtimeconnectionupdaterRunConnectionUpdate]
realtimeconnectionupdaterRebuildConnectionMap[Function: realtimeconnectionupdaterRebuildConnectionMap]
screensharestreamScreenShareConstraints[Function: screensharestreamScreenShareConstraints]
spacechatHandleScroll[Function: spacechatHandleScroll]
spacechatHandleSend[Function: spacechatHandleSend]
spacechatHandleKeyDown[Function: spacechatHandleKeyDown]
tetrahedronTetrahedronFaces[Function: tetrahedronTetrahedronFaces]
tetrahedronPosition[Function: tetrahedronPosition]
tetrahedronScale[Function: tetrahedronScale]
tetrahedronTextStyle[Function: tetrahedronTextStyle]
tetrahedronFaceColors[Function: tetrahedronFaceColors]
tetrahedronFaceTexts[Function: tetrahedronFaceTexts]
tetrahedronFaceTextStyles[Function: tetrahedronFaceTextStyles]
tetrahedronDebouncedUpdate[Function: tetrahedronDebouncedUpdate]
tetrahedronIsIndicatorConnected[Function: tetrahedronIsIndicatorConnected]
tetrahedronIsIndicatorActive[Function: tetrahedronIsIndicatorActive]
tetrahedronGetUIPositions[Function: tetrahedronGetUIPositions]
tetrahedronShouldShowIndicator[Function: tetrahedronShouldShowIndicator]
tetrahedronHasConnectedIndicators[Function: tetrahedronHasConnectedIndicators]
tetrahedronTetrahedronEdgePoints[Function: tetrahedronTetrahedronEdgePoints]
tetrahedronHandleSceneClick[Function: tetrahedronHandleSceneClick]
tetrahedronUpdateDatabase[Function: tetrahedronUpdateDatabase]
tetrahedronHandleFaceClick[Function: tetrahedronHandleFaceClick]
tetrahedronHandleColoredFaceClick[Function: tetrahedronHandleColoredFaceClick]
tetrahedronHandleIndicatorClick[Function: tetrahedronHandleIndicatorClick]
tetrahedronHandleTransformToggle[Function: tetrahedronHandleTransformToggle]
tetrahedronHandleResizeToggle[Function: tetrahedronHandleResizeToggle]
tetrahedronHandleHeaderToggle[Function: tetrahedronHandleHeaderToggle]
tetrahedronHandleHeaderSubmit[Function: tetrahedronHandleHeaderSubmit]
tetrahedronHandleLineColorChange[Function: tetrahedronHandleLineColorChange]
tetrahedronHandleDrag[Function: tetrahedronHandleDrag]
tetrahedronHandleScale[Function: tetrahedronHandleScale]
tetrahedronGetFaceTextOffset[Function: tetrahedronGetFaceTextOffset]
tetrahedronHandleFaceTextStyleClick[Function: tetrahedronHandleFaceTextStyleClick]
tetrahedronHandleFaceTextStyleChange[Function: tetrahedronHandleFaceTextStyleChange]
tetrahedronRenderFaceTexts[Function: tetrahedronRenderFaceTexts]
tetrahedronRenderFaces[Function: tetrahedronRenderFaces]
tetrahedronfaceFaceMaterial[Function: tetrahedronfaceFaceMaterial]
tetrahedronfaceHandleClick[Function: tetrahedronfaceHandleClick]
tetrahedronfaceHandleIndicatorClickLocal[Function: tetrahedronfaceHandleIndicatorClickLocal]
tetrahedronfaceGetFaceTextOffset[Function: tetrahedronfaceGetFaceTextOffset]
tetrahedronfaceHandleFaceTextStyleClick[Function: tetrahedronfaceHandleFaceTextStyleClick]
tetrahedronfaceHandleFaceTextStyleChange[Function: tetrahedronfaceHandleFaceTextStyleChange]
tetrahedronfaceFaceTextElement[Function: tetrahedronfaceFaceTextElement]
textobjectText[Function: textobjectText]
textobjectTextStyle[Function: textobjectTextStyle]
textobjectScale[Function: textobjectScale]
textobjectSetOrbitControlsEnabled[Function: textobjectSetOrbitControlsEnabled]
textobjectSetText[Function: textobjectSetText]
textobjectSetTextStyle[Function: textobjectSetTextStyle]
textobjectSetScale[Function: textobjectSetScale]
textobjectSetIsEditing[Function: textobjectSetIsEditing]
textobjectSetIsActivelyEditing[Function: textobjectSetIsActivelyEditing]
textobjectSetIndicatorSelected[Function: textobjectSetIndicatorSelected]
textobjectSetContentHeight[Function: textobjectSetContentHeight]
textobjectSetShowTransform[Function: textobjectSetShowTransform]
textobjectSetShowResizeControls[Function: textobjectSetShowResizeControls]
textobjectSetBulletPointMode[Function: textobjectSetBulletPointMode]
textobjectHandleTransformToggle[Function: textobjectHandleTransformToggle]
textobjectHandleResizeToggle[Function: textobjectHandleResizeToggle]
textobjectGetIndicatorOffset[Function: textobjectGetIndicatorOffset]
textobjectIsIndicatorConnected[Function: textobjectIsIndicatorConnected]
textobjectShouldShowIndicator[Function: textobjectShouldShowIndicator]
textobjectGetIndicatorPositions[Function: textobjectGetIndicatorPositions]
textobjectUpdateWorldMatrix[Function: textobjectUpdateWorldMatrix]
textobjectCloseAllUIs[Function: textobjectCloseAllUIs]
textobjectUpdateDatabase[Function: textobjectUpdateDatabase]
textobjectAutoResizeTextAreaOnly[Function: textobjectAutoResizeTextAreaOnly]
textobjectAutoResizeTextArea[Function: textobjectAutoResizeTextArea]
textobjectHandleBlur[Function: textobjectHandleBlur]
textobjectHandleDivClick[Function: textobjectHandleDivClick]
textobjectHandleTextClick[Function: textobjectHandleTextClick]
textobjectHandleIndicatorClick[Function: textobjectHandleIndicatorClick]
textobjectHandleDrag[Function: textobjectHandleDrag]
textobjectHandleScale[Function: textobjectHandleScale]
textobjectHandleKeyDown[Function: textobjectHandleKeyDown]
textobjectHandleStyleChange[Function: textobjectHandleStyleChange]
textobjectHandleTextSelection[Function: textobjectHandleTextSelection]
textobjectGetTextAreaStyle[Function: textobjectGetTextAreaStyle]
textobjectGetContainerStyle[Function: textobjectGetContainerStyle]
textobjectGetEffectivePosition[Function: textobjectGetEffectivePosition]
textobjectuiHandleUIClick[Function: textobjectuiHandleUIClick]
textobjectuiHandleResizeToggle[Function: textobjectuiHandleResizeToggle]
textobjectuiHandleEyeClick[Function: textobjectuiHandleEyeClick]
textspriteSpriteId[Function: textspriteSpriteId]
textspriteSetIsDragging[Function: textspriteSetIsDragging]
textspriteCalculatedPosition[Function: textspriteCalculatedPosition]
textspriteGetFontSize[Function: textspriteGetFontSize]
textstyleuicontentHandleSizeChange[Function: textstyleuicontentHandleSizeChange]
textstyleuicontentHandleFontSizeInputChange[Function: textstyleuicontentHandleFontSizeInputChange]
textstyleuicontentHandleWheel[Function: textstyleuicontentHandleWheel]
textstyleuicontentHandleButtonClick[Function: textstyleuicontentHandleButtonClick]
textstyleuicontentHandleColorSelect[Function: textstyleuicontentHandleColorSelect]
textstyleuicontentHandleSelectChange[Function: textstyleuicontentHandleSelectChange]
textstyleuicontentGetUIScale[Function: textstyleuicontentGetUIScale]
uioverlaySetIsRecording[Function: uioverlaySetIsRecording]
uioverlayHandleCellBoundariesToggle[Function: uioverlayHandleCellBoundariesToggle]
uioverlayFetchRepositories[Function: uioverlayFetchRepositories]
uioverlayFetchAppJsxFromRepo[Function: uioverlayFetchAppJsxFromRepo]
uioverlayHandleRescan[Function: uioverlayHandleRescan]
uioverlayHandleDownloadMarkdown[Function: uioverlayHandleDownloadMarkdown]
uioverlayHandleScreenClick[Function: uioverlayHandleScreenClick]
uioverlayHandleRuntimeScan[Function: uioverlayHandleRuntimeScan]
uioverlayHandleRecordClick[Function: uioverlayHandleRecordClick]
uioverlayHandleDeleteAllCells[Function: uioverlayHandleDeleteAllCells]
uioverlayHandleModelUpload[Function: uioverlayHandleModelUpload]
uioverlayHandleModelFileSelect[Function: uioverlayHandleModelFileSelect]
uioverlayHandleMarkdownUpload[Function: uioverlayHandleMarkdownUpload]
uioverlayHandleMarkdownFileSelect[Function: uioverlayHandleMarkdownFileSelect]
uioverlayHandleMenuToggle[Function: uioverlayHandleMenuToggle]
uioverlayHandleArrowClick[Function: uioverlayHandleArrowClick]
uioverlayHandleUnpinWebcam[Function: uioverlayHandleUnpinWebcam]
uioverlayHandleTemplateConfigChange[Function: uioverlayHandleTemplateConfigChange]
uioverlayCreateTemplate[Function: uioverlayCreateTemplate]
createorganizationpopupHandleKeyPress[Function: createorganizationpopupHandleKeyPress]
createorganizationpopupHandleSubmit[Function: createorganizationpopupHandleSubmit]
createspacepopupHandleSpaceNameChange[Function: createspacepopupHandleSpaceNameChange]
createspacepopupHandleEmailChange[Function: createspacepopupHandleEmailChange]
createspacepopupHandleMemberSelect[Function: createspacepopupHandleMemberSelect]
createspacepopupHandleKeyPress[Function: createspacepopupHandleKeyPress]
createspacepopupHandleSubmit[Function: createspacepopupHandleSubmit]
dodecahedronwireframe2GenerateDodecahedronEdges[Function: dodecahedronwireframe2GenerateDodecahedronEdges]
organizationmanagerRefresh[Function: organizationmanagerRefresh]
organizationmanagerHandleCreateOrg[Function: organizationmanagerHandleCreateOrg]
organizationmanagerHandleInvite[Function: organizationmanagerHandleInvite]
organizationmanagerHandleRemoveMember[Function: organizationmanagerHandleRemoveMember]
organizationmanagerHandleLeave[Function: organizationmanagerHandleLeave]
organizationmanagerHandleUpgradePlan[Function: organizationmanagerHandleUpgradePlan]
organizationmanagerHandleDeleteOrg[Function: organizationmanagerHandleDeleteOrg]
organizationmanagerHandleAcceptInvite[Function: organizationmanagerHandleAcceptInvite]
organizationmanagerHandleDeclineInvite[Function: organizationmanagerHandleDeclineInvite]
orgmemberdropdownHandleInputFocus[Function: orgmemberdropdownHandleInputFocus]
orgmemberdropdownHandleInputChange[Function: orgmemberdropdownHandleInputChange]
orgmemberdropdownHandleSelect[Function: orgmemberdropdownHandleSelect]
sharespacepopupFilteredMembers[Function: sharespacepopupFilteredMembers]
sharespacepopupToggleMember[Function: sharespacepopupToggleMember]
sharespacepopupHandleShare[Function: sharespacepopupHandleShare]
spacestableHandleSpaceClick[Function: spacestableHandleSpaceClick]
spacestableThStyles[Function: spacestableThStyles]
spacestableTdStyles[Function: spacestableTdStyles]
spacestableCategoryRowStyles[Function: spacestableCategoryRowStyles]
spacestableInviteBannerStyle[Function: spacestableInviteBannerStyle]
dodecahedronwireframeGenerateDodecahedronEdges[Function: dodecahedronwireframeGenerateDodecahedronEdges]
fakeglowmaterialFakeGlowMaterial[Function: fakeglowmaterialFakeGlowMaterial]
landingappCreateUserDocument[Function: landingappCreateUserDocument]
landingappHandleLogin[Function: landingappHandleLogin]
landingappHandleLogout[Function: landingappHandleLogout]
landingappNavigateToSpace[Function: landingappNavigateToSpace]
landingappFetchUserSpaces[Function: landingappFetchUserSpaces]
landingappCreateNewSpace[Function: landingappCreateNewSpace]
landingappHandleShareSpace[Function: landingappHandleShareSpace]
landingappHandleDeleteSpace[Function: landingappHandleDeleteSpace]
landingappHandleLeaveSpace[Function: landingappHandleLeaveSpace]
landingappHandleFirstCubeComplete[Function: landingappHandleFirstCubeComplete]
landingappHandleDodecahedronComplete[Function: landingappHandleDodecahedronComplete]
landingappHandleAcceptInvite[Function: landingappHandleAcceptInvite]
landingappHandleDeclineInvite[Function: landingappHandleDeclineInvite]
landingappSpaceTableProps[Function: landingappSpaceTableProps]
landingappCreateSpaceProps[Function: landingappCreateSpaceProps]
landingappSharePopupProps[Function: landingappSharePopupProps]
updateseditorHandleKeyCommand[Function: updateseditorHandleKeyCommand]
updateseditorToggleInlineStyle[Function: updateseditorToggleInlineStyle]
updateseditorHandleSave[Function: updateseditorHandleSave]
updatesviewerParsedContent[Function: updatesviewerParsedContent]
updatesviewerFormattedTimestamp[Function: updatesviewerFormattedTimestamp]
whiteplanePlaneGeometry[Function: whiteplanePlaneGeometry]
whiteplaneGridTexture[Function: whiteplaneGridTexture]

%% Boundaries
Suspense[/Boundary: Suspense/]

%% Shaders

%% Web Workers

%% Relationships
App --> useTimeoutManager : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout, setObjectLoadingTimeout, clearObjectLoadingTimeout}"
App --> useSpatialManagerStore : "uses store"
App --> useAuthState : "{user, isAuthReady, isCheckingUrlAuth}"
App --> useSpaceManager : "{currentSpaceId}"
App --> useSpatialManager : "{loadedCells, isInitialized, currentCellCoords, trackObjectInCell, untrackObjectInCell}"
App --> useConnectionStore : "uses store"
App --> useConnections : "{connections, handleLineStyleChange, handleLineColorChange, handleConnectionClick, handleLineTextClick, handleLineTextSubmit, handleLineTextStyleChange}"
App --> useObjects : "{selectedId, setSelectedId, handleCreateObject, handleObjectDelete, lastUpdateRef, draggingObjectsRef, registerTransformingObject, transformingObjectsRef, getTransformStartPosition}"
App --> useIndicators : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator, setActiveIndicator, indicatorMode, setIndicatorMode, selectedIndicators, setSelectedIndicators, isConnectMode, setIsConnectMode, globalIndicatorSelected, setGlobalIndicatorSelected, selectedIndicatorsRef, handleToggleIndicators, handleIndicatorSelected, handleIndicatorDeselected}"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AtlasTextSprite --> useTextAtlasStore : "uses store"
Connection --> useConnectionObjectPositions : "{startObject, endObject}"
Connection --> useConnectionState : "uses hook"
Connection --> useConnectionActions : "uses hook"
ConnectionsRenderer --> useConnectionsRendererStore : "uses store"
ConnectionsRenderer --> useFrustumCulledConnections : "{visibleConnections}"
Cube --> useLODStore : "uses store"
Cube --> useConnectionStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useLODStore : "uses store"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
GlobalCubeFaceRenderer --> useLODStore : "uses store"
GlobalCubeMediumLODRenderer --> useLODStore : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
GlobalDodecahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
GlobalTetrahedronMediumLODRenderer --> useLODStore : "uses store"
InstancedAtlasText --> useTextAtlasStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LODManager --> useLODStore : "uses store"
Plane --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
TextObject --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
LandingApp --> useWindowSize : "uses hook"
createVerifyAuthTokenApp --> express : "calls express"
createVerifyAuthTokenApp --> cors : "calls cors"
createBulkImportApp --> express : "calls express"
createBulkImportApp --> cors : "calls cors"
createBulkDeleteApp --> express : "calls express"
createBulkDeleteApp --> cors : "calls cors"
scanJsBundles --> extractSourceMapUrl : "calls extractSourceMapUrl"
scanJsBundles --> scanOriginalSource : "calls scanOriginalSource"
scanJsBundles --> extractNamesFromSourceMap : "calls extractNamesFromSourceMap"
captureRuntimeTrace --> scanJsBundles : "calls scanJsBundles"
captureRuntimeTrace --> deduplicateApiCalls : "calls deduplicateApiCalls"
captureRuntimeTrace --> buildConnections : "calls buildConnections"
createScanWebsiteRuntimeApp --> express : "calls express"
createScanWebsiteRuntimeApp --> cors : "calls cors"
createScanWebsiteRuntimeApp --> validateRuntimeScanUrl : "calls validateRuntimeScanUrl"
createScanWebsiteRuntimeApp --> captureRuntimeTrace : "calls captureRuntimeTrace"
createScanWebsiteRuntimeApp --> generateMerfolkFromRuntimeTrace : "calls generateMerfolkFromRuntimeTrace"
App --> initAnimationSystem : "calls initAnimationSystem"
App --> checkPositionJitter : "calls checkPositionJitter"
App --> getPublicSpaceMetadata : "calls getPublicSpaceMetadata"
App --> getObjectsFromCells : "calls getObjectsFromCells"
App --> subscribeToSpatialObjects : "calls subscribeToSpatialObjects"
App --> getCellCoordinates : "calls getCellCoordinates"
App --> signInUser : "calls signInUser"
App --> useConnectionStore : "calls .getState()"
App --> handleObjectMove : "calls handleObjectMove"
App --> handleObjectUpdate : "calls handleObjectUpdate"
App --> handleFaceIndicatorClick : "calls handleFaceIndicatorClick"
App --> throttle : "calls throttle"
App --> isCameraMovingRapidly : "calls isCameraMovingRapidly"
App --> notifyCameraMove : "calls notifyCameraMove"
App --> initWebRTC : "calls initWebRTC"
AtlasTextSprite --> getGlobalTextAtlas : "calls getGlobalTextAtlas"
AtlasTextSprite --> getSharedMaterial : "calls getSharedMaterial"
DynamicBillboardMesh --> isFrameBudgetExhausted : "calls isFrameBudgetExhausted"
BatchedCurvedLines --> numericCacheKey : "calls numericCacheKey"
BatchedCurvedLines --> computeConnectionPath : "calls computeConnectionPath"
BatchedCurvedLines --> pathToSegments : "calls pathToSegments"
CellBoundaryRenderer --> getCellBounds : "calls getCellBounds"
CellBoundaryRenderer --> computeVisibleCells : "calls computeVisibleCells"
DistanceFilteredConnectionText --> isFrameBudgetExhausted : "calls isFrameBudgetExhausted"
resolveEndpointPosition --> calculateFacePosition : "calls calculateFacePosition"
Connection --> useConnectionStore : "calls .getState()"
Connection --> saveConnection : "calls saveConnection"
Connection --> calculateFacePosition : "calls calculateFacePosition"
Connection --> calculateMidpoint : "calls calculateMidpoint"
Connection --> computeConnectionPath : "calls computeConnectionPath"
Connection --> getTextParametricT : "calls getTextParametricT"
ConnectionsRenderer --> isCameraMoving : "calls isCameraMoving"
ConnectionsRenderer --> acquireBudget : "calls acquireBudget"
ConnectionsRenderer --> invalidatePathfindingCaches : "calls invalidatePathfindingCaches"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> computeConnectionPath : "calls computeConnectionPath"
ConnectionsRenderer --> precomputePathsBatch : "calls precomputePathsBatch"
ConnectionsRenderer --> redistributeFaces : "calls redistributeFaces"
ConnectionsRenderer --> getTextParametricT : "calls getTextParametricT"
ConnectionsRenderer --> useConnectionStore : "calls .getState()"
Cube --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Cube --> debounce : "calls debounce"
Cube --> calculateAxisSnap : "calls calculateAxisSnap"
CubeFace --> getCubeFaceStateSelector : "calls getCubeFaceStateSelector"
MerfolkEdge --> getEdgeStyle : "calls getEdgeStyle"
MerfolkEdge --> getSelectedStyle : "calls getSelectedStyle"
MerfolkEdge --> getUnselectedStyle : "calls getUnselectedStyle"
DiagramOverlay2D --> getDiagramLayoutWorker : "calls getDiagramLayoutWorker"
DiagramOverlay2D --> buildReactFlowNodes : "calls buildReactFlowNodes"
DiagramOverlay2D --> buildReactFlowEdges : "calls buildReactFlowEdges"
DiagramOverlay2D --> filterEdges : "calls filterEdges"
Sphere --> calculateAxisSnap : "calls calculateAxisSnap"
InstancedAtlasText --> getGlobalTextAtlas : "calls getGlobalTextAtlas"
PageInstancedMesh --> isFrameBudgetExhausted : "calls isFrameBudgetExhausted"
LODManager --> useLODStore : "calls .getState()"
LODManager --> getSpatialIndexWorker : "calls getSpatialIndexWorker"
LODManager --> calculateParentLODLevel : "calls calculateParentLODLevel"
LODManager --> calculateLODLevel : "calls calculateLODLevel"
LODManager --> isCameraMoving : "calls isCameraMoving"
LODManager --> getSmoothedFrameTime : "calls getSmoothedFrameTime"
ObjectRenderer --> handleObjectMove : "calls handleObjectMove"
ObjectsRenderer --> isCameraMoving : "calls isCameraMoving"
ObjectsRenderer --> acquireBudget : "calls acquireBudget"
Plane --> calculateAxisSnap : "calls calculateAxisSnap"
Plane --> uploadImageToStorage : "calls uploadImageToStorage"
RealTimeConnectionUpdater --> useConnectionStore : "calls .getState()"
RealTimeConnectionUpdater --> calculateFacePosition : "calls calculateFacePosition"
ScreenShareStream --> startBroadcasting : "calls startBroadcasting"
ScreenShareStream --> joinBroadcast : "calls joinBroadcast"
SpacePresenceAvatars --> subscribeToSpacePresence : "calls subscribeToSpacePresence"
Tetrahedron --> debounce : "calls debounce"
Tetrahedron --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Tetrahedron --> calculateAxisSnap : "calls calculateAxisSnap"
TextObject --> calculateAxisSnap : "calls calculateAxisSnap"
TextObject --> isFrameBudgetExhausted : "calls isFrameBudgetExhausted"
TextSprite --> isFrameBudgetExhausted : "calls isFrameBudgetExhausted"
UIOverlay --> scanRepositoryAndGenerateDiagram : "calls scanRepositoryAndGenerateDiagram"
UIOverlay --> rescanRepositoryForChanges : "calls rescanRepositoryForChanges"
UIOverlay --> uploadMarkdownToStorage : "calls uploadMarkdownToStorage"
UIOverlay --> validateScanUrl : "calls validateScanUrl"
UIOverlay --> scanWebsiteAndGenerateDiagram : "calls scanWebsiteAndGenerateDiagram"
UIOverlay --> fetchRepositories : "calls fetchRepositories"
UIOverlay --> handleGithubCallback : "calls handleGithubCallback"
UIOverlay --> clearAllObjectCaches : "calls clearAllObjectCaches"
UIOverlay --> uploadModelToStorage : "calls uploadModelToStorage"
WebcamStream --> startBroadcasting : "calls startBroadcasting"
WebcamStream --> joinBroadcast : "calls joinBroadcast"
useConnections --> useConnectionStore : "calls .getState()"
useConnections --> getIsInitialLoading : "calls getIsInitialLoading"
useConnections --> subscribeToConnections : "calls subscribeToConnections"
useConnections --> saveConnection : "calls saveConnection"
isConnectionVisible --> isPointInFrustum : "calls isPointInFrustum"
useObjects --> useConnectionStore : "calls .getState()"
useSpaceManager --> useSpaceManagerStore : "calls .getState()"
OrganizationManager --> getUserOrganizations : "calls getUserOrganizations"
OrganizationManager --> getPendingInvitesForUser : "calls getPendingInvitesForUser"
OrganizationManager --> createOrganization : "calls createOrganization"
OrganizationManager --> inviteUserToOrganization : "calls inviteUserToOrganization"
OrganizationManager --> removeMemberFromOrganization : "calls removeMemberFromOrganization"
OrganizationManager --> leaveOrganization : "calls leaveOrganization"
OrganizationManager --> updateOrganizationPlan : "calls updateOrganizationPlan"
OrganizationManager --> deleteOrganization : "calls deleteOrganization"
OrganizationManager --> acceptInvite : "calls acceptInvite"
OrganizationManager --> declineInvite : "calls declineInvite"
LandingApp --> getOrganizationMembers : "calls getOrganizationMembers"
LandingApp --> getUserOrganizations : "calls getUserOrganizations"
LandingApp --> getPendingInvitesForUser : "calls getPendingInvitesForUser"
LandingApp --> signOut : "calls signOut"
LandingApp --> acceptInvite : "calls acceptInvite"
LandingApp --> declineInvite : "calls declineInvite"
removeAllSharedReferences --> removeSharedSpaceReference : "calls removeSharedSpaceReference"
flushSaveBatch --> getCellCoordinates : "calls getCellCoordinates"
flushSaveBatch --> getCellId : "calls getCellId"
flushSaveBatch --> addObjectToCell : "calls addObjectToCell"
checkObjectMovement --> roundForCache : "calls roundForCache"
generateCacheKey --> roundForCache : "calls roundForCache"
checkLineIntersection --> cleanCaches : "calls cleanCaches"
checkLineIntersection --> generateCacheKey : "calls generateCacheKey"
generateCurvedPath --> generateCacheKey : "calls generateCacheKey"
generateCurvedPath --> lineIntersectsBoundingBox : "calls lineIntersectsBoundingBox"
generateCurvedPath --> generateMultiSegmentPath : "calls generateMultiSegmentPath"
generateCurvedPath --> checkCurveIntersections : "calls checkCurveIntersections"
precomputeCacheKey --> roundForCache : "calls roundForCache"
getPrecomputedResult --> precomputeCacheKey : "calls precomputeCacheKey"
computeConnectionPath --> getPrecomputedResult : "calls getPrecomputedResult"
computeConnectionPath --> checkLineIntersection : "calls checkLineIntersection"
computeConnectionPath --> generateCurvedPath : "calls generateCurvedPath"
precomputePathsBatch --> getPathfindingWorker : "calls getPathfindingWorker"
precomputePathsBatch --> precomputeCacheKey : "calls precomputeCacheKey"
isCameraMovingRapidly --> isCameraMoving : "calls isCameraMoving"
benchmarkStreamlined --> createStreamlinedSpatialIndex : "calls createStreamlinedSpatialIndex"
_switchToSyncAtlas --> useTextAtlasStore : "calls .getState()"
getGlobalTextAtlas --> isOffscreenCanvasTextSupported : "calls isOffscreenCanvasTextSupported"
createAtlasTextMesh --> getGlobalTextAtlas : "calls getGlobalTextAtlas"
filterConnections --> isHierarchyConnection : "calls isHierarchyConnection"
layoutNodes --> estimateNodeSize : "calls estimateNodeSize"
layoutEdges --> filterConnections : "calls filterConnections"
App --> FrameTicker : "renders"
App --> FrameloopController : "renders"
App --> LODManager : "renders"
App --> ConnectionAnimationManager : "renders"
App --> CustomCamera : "renders"
App --> RealTimeConnectionUpdater : "renders"
App --> ConnectionsRenderer : "renders"
App --> ObjectsRenderer : "renders"
App --> CellBoundaryRenderer : "renders"
App --> DiagramOverlay2D : "renders"
App --> UIOverlay : "renders"
AppShell --> LandingApp : "renders"
AtlasTextSprite --> StaticBillboardMesh : "renders"
AtlasTextSprite --> DynamicBillboardMesh : "renders"
Connection --> InstancedLine : "renders"
Connection --> AnimatedConnectionLine : "renders"
Connection --> DistanceFilteredConnectionText : "renders"
Connection --> AtlasTextSprite : "renders"
Connection --> HeaderInput : "renders"
Connection --> TextStyleUI : "renders"
Connection --> LineUI : "renders"
ConnectionsRenderer --> BatchedConnectionLines : "renders"
ConnectionsRenderer --> BatchedCurvedLines : "renders"
ConnectionsRenderer --> DistanceFilteredTextLabels : "renders"
ConnectionsRenderer --> Connection : "renders"
Cube --> CubeFace : "renders"
Cube --> FaceUI : "renders"
Cube --> FaceTextInput : "renders"
Cube --> AtlasTextSprite : "renders"
Cube --> TextStyleUI : "renders"
Cube --> SnapLineIndicator : "renders"
Cube --> InstancedLine : "renders"
Cube --> HeaderInput : "renders"
Cube --> ObjectUI : "renders"
CubeFace --> FaceIndicator : "renders"
DiagramOverlay2D --> EdgeMarkerDefs : "renders"
DistanceFilteredTextLabels --> InstancedAtlasText : "renders"
Sphere --> SnapLineIndicator : "renders"
Sphere --> DodecahedronFace : "renders"
Sphere --> InstancedLine : "renders"
Sphere --> ObjectUI : "renders"
Sphere --> FaceUI : "renders"
Sphere --> HeaderInput : "renders"
Sphere --> AtlasTextSprite : "renders"
Sphere --> TextStyleUI : "renders"
DodecahedronFace --> FaceIndicator : "renders"
DodecahedronFace --> AtlasTextSprite : "renders"
DodecahedronFace --> FaceTextInput : "renders"
FaceUI --> ColorPicker : "renders"
InstancedAtlasText --> PageInstancedMesh : "renders"
LineUI --> ColorPicker : "renders"
ObjectRenderer --> Cube : "renders"
ObjectRenderer --> Tetrahedron : "renders"
ObjectRenderer --> Sphere : "renders"
ObjectRenderer --> Plane : "renders"
ObjectRenderer --> TextObject : "renders"
ObjectRenderer --> ModelObject : "renders"
ObjectsRenderer --> ObjectRenderer : "renders"
ObjectsRenderer --> GlobalCubeEdgesRenderer : "renders"
ObjectsRenderer --> GlobalCubeFaceRenderer : "renders"
ObjectsRenderer --> GlobalCubeMediumLODRenderer : "renders"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "renders"
ObjectsRenderer --> GlobalDodecahedronMediumLODRenderer : "renders"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "renders"
ObjectsRenderer --> GlobalTetrahedronMediumLODRenderer : "renders"
ObjectsRenderer --> AtlasTextSprite : "renders"
ObjectUI --> ColorPicker : "renders"
Plane --> SnapLineIndicator : "renders"
Plane --> WebcamStream : "renders"
Plane --> ScreenShareStream : "renders"
Plane --> InstancedLine : "renders"
Plane --> FaceIndicator : "renders"
Plane --> AtlasTextSprite : "renders"
Plane --> TextStyleUI : "renders"
Plane --> FaceUI : "renders"
Plane --> FaceTextInput : "renders"
Plane --> HeaderInput : "renders"
SnapLineIndicator --> InstancedLine : "renders"
SpacePresenceAvatars --> Avatar : "renders"
Tetrahedron --> AtlasTextSprite : "renders"
Tetrahedron --> TextStyleUI : "renders"
Tetrahedron --> TetrahedronFace : "renders"
Tetrahedron --> SnapLineIndicator : "renders"
Tetrahedron --> InstancedLine : "renders"
Tetrahedron --> HeaderInput : "renders"
Tetrahedron --> ObjectUI : "renders"
TetrahedronFace --> AtlasTextSprite : "renders"
TetrahedronFace --> TextStyleUI : "renders"
TetrahedronFace --> FaceUI : "renders"
TetrahedronFace --> FaceTextInput : "renders"
TetrahedronFace --> FaceIndicator : "renders"
TextObject --> SnapLineIndicator : "renders"
TextObject --> FaceIndicator : "renders"
TextObject --> TextObjectUI : "renders"
TextObjectUI --> TextStyleUIContent : "renders"
TextObjectUI --> ColorPicker : "renders"
TextStyleUIContent --> ColorPicker : "renders"
TextStyleUI --> TextStyleUIContent : "renders"
TextStyleUIContainer --> TextStyleUIContent : "renders"
UIOverlay --> SpaceChat : "renders"
UIOverlay --> SpacePresenceAvatars : "renders"
CreateSpacePopup --> OrgMemberDropdown : "renders"
LandingApp --> CreateSpacePopup : "renders"
LandingApp --> UpgradePrompt : "renders"
LandingApp --> ShareSpacePopup : "renders"
LandingApp --> OrganizationManager : "renders"
LandingApp --> SpacesTable : "renders"
LandingApp --> UserLoginSection : "renders"
LandingApp --> WelcomeOverlay : "renders"
LandingApp --> OrderHeader : "renders"
LandingApp --> CustomCamera : "renders"
LandingApp --> WhitePlane : "renders"
LandingApp --> CubeOutline : "renders"
LandingApp --> DodecahedronWireframe : "renders"
LandingApp --> DodecahedronWireframe2 : "renders"
UpdatesContainer --> UpdatesViewer : "renders"
App --> useConnectionStore : "uses useConnectionStore"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses useAnimatedConnectionLineStore"
AtlasTextSprite --> useTextAtlasStore : "uses useTextAtlasStore"
ConnectionsRenderer --> useConnectionsRendererStore : "uses useConnectionsRendererStore"
ConnectionsRenderer --> useConnectionStore : "uses useConnectionStore"
GlobalCubeEdgesRenderer --> useLODStore : "uses useLODStore"
GlobalCubeFaceRenderer --> useLODStore : "uses useLODStore"
GlobalCubeMediumLODRenderer --> useLODStore : "uses useLODStore"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses useLODStore"
GlobalDodecahedronMediumLODRenderer --> useLODStore : "uses useLODStore"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses useLODStore"
GlobalTetrahedronMediumLODRenderer --> useLODStore : "uses useLODStore"
InstancedAtlasText --> useTextAtlasStore : "uses useTextAtlasStore"
LineUI --> useConnectionStore : "uses useConnectionStore"
LODManager --> useLODStore : "uses useLODStore"
RealTimeConnectionUpdater --> useConnectionStore : "uses useConnectionStore"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses useSpatialManagerStore"
UIOverlay --> useConnectionStore : "uses useConnectionStore"
useConnections --> useConnectionStore : "uses useConnectionStore"
useSpaceManager --> useSpaceManagerStore : "uses useSpaceManagerStore"

%% Component-Function Relationships
App -.-> appObjects : "render helper"
App -.-> appCanViewSpace : "render helper"
App -.-> appShouldRedirect : "render helper"
App -.-> appHandleSpatialObjectChange : "internal function"
App -.-> appSpatialManagerDebug : "render helper"
App -.-> appCheckPositionJitterWithHistory : "internal function"
App -.-> appLoadedCellsKey : "render helper"
App -.-> appHandleObjectMatrixChanged : "internal function"
App -.-> appDisableOrbitControls : "internal function"
App -.-> appEnableOrbitControls : "internal function"
App -.-> appHandleLogin : "internal function"
App -.-> appHandleObjectClick : "internal function"
App -.-> appHandleObjectMoveCallback : "internal function"
App -.-> appHandleObjectUpdateCallback : "update helper"
App -.-> appHandleFaceIndicatorClickCallback : "internal function"
App -.-> appHandleFaceClick : "internal function"
App -.-> appHandleCanvasClick : "internal function"
App -.-> appUpdateVisibleObjects : "update helper"
App -.-> appThrottledUpdateVisibility : "render helper"
App -.-> appDeviceInfo : "render helper"
App -.-> appCanvasSettings : "render helper"
AppShell -.-> appshellHandleOpenSpace : "internal function"
AppShell -.-> appshellHandleBackToLanding : "internal function"
AnimatedConnectionLine -.-> animatedconnectionlineStructuralKey : "render helper"
AtlasTextSprite -.-> atlastextspriteAtlas : "render helper"
AtlasTextSprite -.-> atlastextspriteCalculatedPosition : "render helper"
BatchedConnectionLines -.-> batchedconnectionlinesStraightConnections : "render helper"
BatchedConnectionLines -.-> batchedconnectionlinesCustomRaycast : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesHandleClick : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOver : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOut : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesPathsData : "render helper"
BatchedCurvedLines -.-> batchedcurvedlinesCustomRaycast : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesHandleClick : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOver : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOut : "internal function"
CellBoundaryRenderer -.-> cellboundaryrendererBuildGeometry : "internal function"
ColorPicker -.-> colorpickerHandleColorChange : "internal function"
ColorPicker -.-> colorpickerHandleContainerClick : "internal function"
ColorPicker -.-> colorpickerHandleApplyColor : "internal function"
ColorPicker -.-> colorpickerHandleCancel : "internal function"
Connection -.-> connectionGetLineWidth : "getter function"
Connection -.-> connectionHandleConnectionClick : "internal function"
Connection -.-> connectionHandleLineTextClick : "internal function"
Connection -.-> connectionHandleLineTextSubmit : "internal function"
Connection -.-> connectionHandleLineTextStyleChange : "internal function"
Connection -.-> connectionHandleLineStyleChange : "internal function"
Connection -.-> connectionHandleLineColorChange : "internal function"
Connection -.-> connectionConnectionData : "render helper"
Connection -.-> connectionPathData : "render helper"
Connection -.-> connectionTextPositionData : "render helper"
ConnectionsRenderer -.-> connectionsrendererAvailableObjectIds : "render helper"
ConnectionsRenderer -.-> connectionsrendererPathfindingObjects : "render helper"
ConnectionsRenderer -.-> connectionsrendererObjectsPositionHash : "render helper"
ConnectionsRenderer -.-> connectionsrendererObjectVisibleConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererFocusedConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererFlowPathHighlightedConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererConnectionsForCulling : "render helper"
ConnectionsRenderer -.-> connectionsrendererProgressiveConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererObjectPositions : "render helper"
ConnectionsRenderer -.-> connectionsrendererAllStraightConnections : "render helper"
ConnectionsRenderer -.-> connectionsrendererFaceOverrides : "render helper"
ConnectionsRenderer -.-> connectionsrendererTextLabels : "render helper"
ConnectionsRenderer -.-> connectionsrendererHandleBatchedConnectionClick : "internal function"
Cube -.-> cubeCubeData : "render helper"
Cube -.-> cubeIsIndicatorConnected : "internal function"
Cube -.-> cubeIsIndicatorActive : "internal function"
Cube -.-> cubeGetUIPositions : "render helper"
Cube -.-> cubeShouldShowIndicator : "internal function"
Cube -.-> cubeHasConnectedIndicators : "render helper"
Cube -.-> cubeGetFaceTextOffset : "getter function"
Cube -.-> cubeHandleSceneClick : "internal function"
Cube -.-> cubeUpdateDatabase : "update helper"
Cube -.-> cubeOnClickOutside : "internal function"
Cube -.-> cubeHandleFaceClick : "internal function"
Cube -.-> cubeHandleColoredFaceClick : "internal function"
Cube -.-> cubeHandleIndicatorClick : "internal function"
Cube -.-> cubeHandleTransformToggle : "internal function"
Cube -.-> cubeHandleResizeToggle : "internal function"
Cube -.-> cubeHandleHeaderToggle : "internal function"
Cube -.-> cubeHandleHeaderSubmit : "internal function"
Cube -.-> cubeDebouncedUpdate : "render helper"
Cube -.-> cubeHandleLineColorChange : "internal function"
Cube -.-> cubeHandleFaceColorChange : "internal function"
Cube -.-> cubeHandleTextClick : "internal function"
Cube -.-> cubeHandleFaceTextClick : "internal function"
Cube -.-> cubeHandleFaceTextSubmit : "internal function"
Cube -.-> cubeHandleFaceTextStyleClick : "internal function"
Cube -.-> cubeHandleStyleChange : "internal function"
Cube -.-> cubeHandleDrag : "internal function"
Cube -.-> cubeHandleScale : "internal function"
Cube -.-> cubeRenderFaces : "render helper"
Cube -.-> cubeRenderFaceTexts : "render helper"
CubeFace -.-> cubefaceFaceStateSelector : "render helper"
CubeFace -.-> cubefaceFaceMaterial : "render helper"
CubeFace -.-> cubefaceHandleClick : "internal function"
CubeFace -.-> cubefaceOffsetMultiplier : "render helper"
CubeFace -.-> cubefaceOffsetPosition : "render helper"
CustomCamera -.-> customcameraMemoizedTarget : "render helper"
CustomCamera -.-> customcameraControlsRefCallback : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dFlowPathNames : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedGraphData : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedHierarchy : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dFilteredEdges : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayer : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayerHandlers : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dHandleNodeClick : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dHandleBackTo3D : "internal function"
Sphere -.-> sphereDodecahedronData : "render helper"
Sphere -.-> sphereUpdateObjectAndStores : "update helper"
Sphere -.-> sphereUpdateFaceProperty : "update helper"
Sphere -.-> sphereIsIndicatorConnected : "internal function"
Sphere -.-> sphereOnClickOutside : "internal function"
Sphere -.-> sphereUpdateDatabase : "update helper"
Sphere -.-> sphereHandleTransformToggle : "internal function"
Sphere -.-> sphereHandleHeaderToggle : "internal function"
Sphere -.-> sphereHandleHeaderSubmit : "internal function"
Sphere -.-> sphereHandleResizeToggle : "internal function"
Sphere -.-> sphereHandleDrag : "internal function"
Sphere -.-> sphereHandleScale : "internal function"
Sphere -.-> sphereHandleFaceClick : "internal function"
Sphere -.-> sphereHandleIndicatorClick : "internal function"
Sphere -.-> sphereHandleHeaderClick : "internal function"
Sphere -.-> sphereHandleStyleChange : "internal function"
Sphere -.-> sphereHandleLineColorChange : "internal function"
Sphere -.-> sphereHandleBackgroundClick : "internal function"
Sphere -.-> sphereHandleFaceTextSubmit : "internal function"
Sphere -.-> sphereHandleFaceTextButtonClick : "internal function"
Sphere -.-> sphereHandleFaceTextClick : "internal function"
Sphere -.-> sphereHandleFaceTextStyleChange : "internal function"
Sphere -.-> sphereGetUIPosition : "getter function"
Sphere -.-> sphereGetHeaderPosition : "getter function"
Sphere -.-> sphereGetFaceUIPosition : "getter function"
Sphere -.-> sphereGetFaceTextPosition : "getter function"
Sphere -.-> sphereGetFaceInfo : "getter function"
Sphere -.-> sphereGetFaceRotation : "getter function"
Sphere -.-> sphereShouldShowFaceIndicator : "internal function"
Sphere -.-> sphereGetHeaderInputPosition : "getter function"
DodecahedronFace -.-> dodecahedronfaceFaceMaterial : "render helper"
DodecahedronFace -.-> dodecahedronfaceHandleClick : "internal function"
DodecahedronFace -.-> dodecahedronfaceHandleTextClick : "internal function"
DodecahedronFace -.-> dodecahedronfaceInverseScale : "render helper"
DodecahedronFace -.-> dodecahedronfaceAdjustedTextPosition : "render helper"
FaceIndicator -.-> faceindicatorMaterial : "render helper"
FaceTextInput -.-> facetextinputHandleKeyDown : "internal function"
FaceTextInput -.-> facetextinputHandleChange : "internal function"
FaceTextInput -.-> facetextinputHandleFocus : "internal function"
FaceTextInput -.-> facetextinputHandleBlur : "internal function"
FaceUI -.-> faceuiHandleBorderStyleClick : "internal function"
FaceUI -.-> faceuiHandleBorderColorClick : "internal function"
FaceUI -.-> faceuiHandleLineThicknessClick : "internal function"
FaceUI -.-> faceuiHandleColorSelect : "internal function"
FaceUI -.-> faceuiHandleToolClick : "internal function"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererFilteredCubes : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererCubeIds : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererIsCubeVisible : "internal function"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererUpdateCubeEdges : "update helper"
GlobalCubeFaceRenderer -.-> globalcubefacerendererFilteredCubes : "render helper"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererMediumCubes : "render helper"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererCubeIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererFilteredDodecahedrons : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererDodecahedronIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererIsDodecahedronVisible : "internal function"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererUpdateDodecahedronEdges : "update helper"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererMediumDodecahedrons : "render helper"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererDodecaIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererFilteredTetrahedrons : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererTetrahedronIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererIsTetrahedronVisible : "internal function"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererUpdateTetrahedronEdges : "update helper"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererMediumTetrahedrons : "render helper"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererTetraIds : "render helper"
HeaderInput -.-> headerinputHandleKeyDown : "internal function"
HeaderInput -.-> headerinputHandleChange : "internal function"
HeaderInput -.-> headerinputHandleFocus : "internal function"
HeaderInput -.-> headerinputHandleBlur : "internal function"
InstancedAtlasText -.-> instancedatlastextAtlas : "render helper"
InstancedAtlasText -.-> instancedatlastextPageGroups : "render helper"
PageInstancedMesh -.-> pageinstancedmeshGeometry : "render helper"
PageInstancedMesh -.-> pageinstancedmeshMaterial : "render helper"
PageInstancedMesh -.-> pageinstancedmeshHandleClick : "internal function"
InstancedLine -.-> instancedlineFlatPoints : "render helper"
InstancedLine -.-> instancedlineGeometry : "render helper"
InstancedLine -.-> instancedlineCustomRaycast : "internal function"
InstancedLine -.-> instancedlineMaterial : "render helper"
LineUI -.-> lineuiGetFullStyle : "getter function"
LineUI -.-> lineuiGetBaseStyle : "getter function"
LineUI -.-> lineuiHandleToolClick : "internal function"
LineUI -.-> lineuiHandleLineStyleClick : "internal function"
LineUI -.-> lineuiHandleArrowClick : "internal function"
LODManager -.-> lodmanagerContainersKey : "render helper"
LODManager -.-> lodmanagerComputeContainmentSync : "internal function"
ModelObject -.-> modelobjectHandleClick : "internal function"
ModelObject -.-> modelobjectHandlePointerDown : "internal function"
ModelObject -.-> modelobjectHandlePointerUp : "internal function"
ObjectRenderer -.-> objectrendererOnClickStable : "internal function"
ObjectRenderer -.-> objectrendererOnDeleteStable : "internal function"
ObjectRenderer -.-> objectrendererOnTransformStartStable : "internal function"
ObjectRenderer -.-> objectrendererOnTransformEndStable : "internal function"
ObjectRenderer -.-> objectrendererOnMatrixChangedStable : "internal function"
ObjectRenderer -.-> objectrendererOnMoveStable : "internal function"
ObjectsRenderer -.-> objectsrendererProgressiveVisibleObjects : "render helper"
ObjectsRenderer -.-> objectsrendererCubeObjects : "render helper"
ObjectsRenderer -.-> objectsrendererContainerHeaders : "render helper"
ObjectsRenderer -.-> objectsrendererDodecahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererTetrahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererRenderedObjects : "render helper"
ObjectUI -.-> objectuiHandleEyeClick : "internal function"
ObjectUI -.-> objectuiHandleColorPick : "internal function"
ObjectUI -.-> objectuiHandleToolClick : "internal function"
Plane -.-> planePlaneData : "render helper"
Plane -.-> planeCloseAllUIs : "internal function"
Plane -.-> planeUpdateDatabase : "update helper"
Plane -.-> planeHandleScale : "internal function"
Plane -.-> planeHandleResizeEnd : "internal function"
Plane -.-> planeHandleDrag : "internal function"
Plane -.-> planeHandleTransformStart : "internal function"
Plane -.-> planeHandleTransformEnd : "internal function"
Plane -.-> planeHandleClick : "internal function"
Plane -.-> planeHandleTextClick : "internal function"
Plane -.-> planeHandleTextSubmit : "internal function"
Plane -.-> planeHandleTextStyleChange : "internal function"
Plane -.-> planeHandleTextSpriteClick : "internal function"
Plane -.-> planeHandleTransformToggle : "internal function"
Plane -.-> planeHandleResizeToggle : "internal function"
Plane -.-> planeHandleColorChange : "internal function"
Plane -.-> planeHandleHeaderToggle : "internal function"
Plane -.-> planeHandleHeaderSubmit : "internal function"
Plane -.-> planeHandleHeaderTextClick : "internal function"
Plane -.-> planeHandleHeaderStyleChange : "internal function"
Plane -.-> planeHandleBorderToggle : "internal function"
Plane -.-> planeHandleIndicatorClick : "internal function"
Plane -.-> planeIsIndicatorConnected : "render helper"
Plane -.-> planeShouldShowIndicator : "render helper"
Plane -.-> planeHandleBroadcastStopped : "internal function"
Plane -.-> planeHandleWebcamToggle : "internal function"
Plane -.-> planeHandleScreenShareToggle : "internal function"
Plane -.-> planeHandlePinToggle : "internal function"
Plane -.-> planeHandleImageUpload : "internal function"
Plane -.-> planeHandleBroadcastStarted : "internal function"
Plane -.-> planeHandleViewerCountChange : "internal function"
Plane -.-> planeUiPositions : "render helper"
Plane -.-> planeIndicatorPosition : "render helper"
Plane -.-> planeMeshMaterial : "render helper"
Plane -.-> planeLineMaterialProps : "render helper"
Plane -.-> planeBorderEdgePoints : "render helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRunConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRebuildConnectionMap : "internal function"
ScreenShareStream -.-> screensharestreamScreenShareConstraints : "render helper"
SpaceChat -.-> spacechatHandleScroll : "internal function"
SpaceChat -.-> spacechatHandleSend : "internal function"
SpaceChat -.-> spacechatHandleKeyDown : "internal function"
Tetrahedron -.-> tetrahedronTetrahedronFaces : "render helper"
Tetrahedron -.-> tetrahedronPosition : "render helper"
Tetrahedron -.-> tetrahedronScale : "render helper"
Tetrahedron -.-> tetrahedronTextStyle : "render helper"
Tetrahedron -.-> tetrahedronFaceColors : "render helper"
Tetrahedron -.-> tetrahedronFaceTexts : "render helper"
Tetrahedron -.-> tetrahedronFaceTextStyles : "render helper"
Tetrahedron -.-> tetrahedronDebouncedUpdate : "render helper"
Tetrahedron -.-> tetrahedronIsIndicatorConnected : "internal function"
Tetrahedron -.-> tetrahedronIsIndicatorActive : "internal function"
Tetrahedron -.-> tetrahedronGetUIPositions : "render helper"
Tetrahedron -.-> tetrahedronShouldShowIndicator : "internal function"
Tetrahedron -.-> tetrahedronHasConnectedIndicators : "render helper"
Tetrahedron -.-> tetrahedronTetrahedronEdgePoints : "render helper"
Tetrahedron -.-> tetrahedronHandleSceneClick : "internal function"
Tetrahedron -.-> tetrahedronUpdateDatabase : "update helper"
Tetrahedron -.-> tetrahedronHandleFaceClick : "internal function"
Tetrahedron -.-> tetrahedronHandleColoredFaceClick : "internal function"
Tetrahedron -.-> tetrahedronHandleIndicatorClick : "internal function"
Tetrahedron -.-> tetrahedronHandleTransformToggle : "internal function"
Tetrahedron -.-> tetrahedronHandleResizeToggle : "internal function"
Tetrahedron -.-> tetrahedronHandleHeaderToggle : "internal function"
Tetrahedron -.-> tetrahedronHandleHeaderSubmit : "internal function"
Tetrahedron -.-> tetrahedronHandleLineColorChange : "internal function"
Tetrahedron -.-> tetrahedronHandleDrag : "internal function"
Tetrahedron -.-> tetrahedronHandleScale : "internal function"
Tetrahedron -.-> tetrahedronGetFaceTextOffset : "getter function"
Tetrahedron -.-> tetrahedronHandleFaceTextStyleClick : "internal function"
Tetrahedron -.-> tetrahedronHandleFaceTextStyleChange : "internal function"
Tetrahedron -.-> tetrahedronRenderFaceTexts : "render helper"
Tetrahedron -.-> tetrahedronRenderFaces : "render helper"
TetrahedronFace -.-> tetrahedronfaceFaceMaterial : "render helper"
TetrahedronFace -.-> tetrahedronfaceHandleClick : "internal function"
TetrahedronFace -.-> tetrahedronfaceHandleIndicatorClickLocal : "internal function"
TetrahedronFace -.-> tetrahedronfaceGetFaceTextOffset : "getter function"
TetrahedronFace -.-> tetrahedronfaceHandleFaceTextStyleClick : "internal function"
TetrahedronFace -.-> tetrahedronfaceHandleFaceTextStyleChange : "internal function"
TetrahedronFace -.-> tetrahedronfaceFaceTextElement : "render helper"
TextObject -.-> textobjectText : "render helper"
TextObject -.-> textobjectTextStyle : "render helper"
TextObject -.-> textobjectScale : "render helper"
TextObject -.-> textobjectSetOrbitControlsEnabled : "internal function"
TextObject -.-> textobjectSetText : "internal function"
TextObject -.-> textobjectSetTextStyle : "internal function"
TextObject -.-> textobjectSetScale : "internal function"
TextObject -.-> textobjectSetIsEditing : "internal function"
TextObject -.-> textobjectSetIsActivelyEditing : "internal function"
TextObject -.-> textobjectSetIndicatorSelected : "internal function"
TextObject -.-> textobjectSetContentHeight : "internal function"
TextObject -.-> textobjectSetShowTransform : "internal function"
TextObject -.-> textobjectSetShowResizeControls : "internal function"
TextObject -.-> textobjectSetBulletPointMode : "internal function"
TextObject -.-> textobjectHandleTransformToggle : "internal function"
TextObject -.-> textobjectHandleResizeToggle : "internal function"
TextObject -.-> textobjectGetIndicatorOffset : "getter function"
TextObject -.-> textobjectIsIndicatorConnected : "internal function"
TextObject -.-> textobjectShouldShowIndicator : "render helper"
TextObject -.-> textobjectGetIndicatorPositions : "getter function"
TextObject -.-> textobjectUpdateWorldMatrix : "update helper"
TextObject -.-> textobjectCloseAllUIs : "internal function"
TextObject -.-> textobjectUpdateDatabase : "update helper"
TextObject -.-> textobjectAutoResizeTextAreaOnly : "internal function"
TextObject -.-> textobjectAutoResizeTextArea : "internal function"
TextObject -.-> textobjectHandleBlur : "internal function"
TextObject -.-> textobjectHandleDivClick : "internal function"
TextObject -.-> textobjectHandleTextClick : "internal function"
TextObject -.-> textobjectHandleIndicatorClick : "internal function"
TextObject -.-> textobjectHandleDrag : "internal function"
TextObject -.-> textobjectHandleScale : "internal function"
TextObject -.-> textobjectHandleKeyDown : "internal function"
TextObject -.-> textobjectHandleStyleChange : "internal function"
TextObject -.-> textobjectHandleTextSelection : "internal function"
TextObject -.-> textobjectGetTextAreaStyle : "getter function"
TextObject -.-> textobjectGetContainerStyle : "getter function"
TextObject -.-> textobjectGetEffectivePosition : "getter function"
TextObjectUI -.-> textobjectuiHandleUIClick : "internal function"
TextObjectUI -.-> textobjectuiHandleResizeToggle : "internal function"
TextObjectUI -.-> textobjectuiHandleEyeClick : "internal function"
TextSprite -.-> textspriteSpriteId : "render helper"
TextSprite -.-> textspriteSetIsDragging : "render helper"
TextSprite -.-> textspriteCalculatedPosition : "render helper"
TextSprite -.-> textspriteGetFontSize : "getter function"
TextStyleUIContent -.-> textstyleuicontentHandleSizeChange : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleFontSizeInputChange : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleWheel : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleButtonClick : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleColorSelect : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleSelectChange : "internal function"
TextStyleUIContent -.-> textstyleuicontentGetUIScale : "getter function"
UIOverlay -.-> uioverlaySetIsRecording : "internal function"
UIOverlay -.-> uioverlayHandleCellBoundariesToggle : "internal function"
UIOverlay -.-> uioverlayFetchRepositories : "internal function"
UIOverlay -.-> uioverlayFetchAppJsxFromRepo : "internal function"
UIOverlay -.-> uioverlayHandleRescan : "internal function"
UIOverlay -.-> uioverlayHandleDownloadMarkdown : "internal function"
UIOverlay -.-> uioverlayHandleScreenClick : "internal function"
UIOverlay -.-> uioverlayHandleRuntimeScan : "internal function"
UIOverlay -.-> uioverlayHandleRecordClick : "internal function"
UIOverlay -.-> uioverlayHandleDeleteAllCells : "internal function"
UIOverlay -.-> uioverlayHandleModelUpload : "internal function"
UIOverlay -.-> uioverlayHandleModelFileSelect : "internal function"
UIOverlay -.-> uioverlayHandleMarkdownUpload : "internal function"
UIOverlay -.-> uioverlayHandleMarkdownFileSelect : "internal function"
UIOverlay -.-> uioverlayHandleMenuToggle : "internal function"
UIOverlay -.-> uioverlayHandleArrowClick : "internal function"
UIOverlay -.-> uioverlayHandleUnpinWebcam : "internal function"
UIOverlay -.-> uioverlayHandleTemplateConfigChange : "internal function"
UIOverlay -.-> uioverlayCreateTemplate : "internal function"
CreateOrganizationPopup -.-> createorganizationpopupHandleKeyPress : "internal function"
CreateOrganizationPopup -.-> createorganizationpopupHandleSubmit : "internal function"
CreateSpacePopup -.-> createspacepopupHandleSpaceNameChange : "internal function"
CreateSpacePopup -.-> createspacepopupHandleEmailChange : "internal function"
CreateSpacePopup -.-> createspacepopupHandleMemberSelect : "internal function"
CreateSpacePopup -.-> createspacepopupHandleKeyPress : "internal function"
CreateSpacePopup -.-> createspacepopupHandleSubmit : "internal function"
DodecahedronWireframe2 -.-> dodecahedronwireframe2GenerateDodecahedronEdges : "internal function"
OrganizationManager -.-> organizationmanagerRefresh : "internal function"
OrganizationManager -.-> organizationmanagerHandleCreateOrg : "internal function"
OrganizationManager -.-> organizationmanagerHandleInvite : "internal function"
OrganizationManager -.-> organizationmanagerHandleRemoveMember : "internal function"
OrganizationManager -.-> organizationmanagerHandleLeave : "internal function"
OrganizationManager -.-> organizationmanagerHandleUpgradePlan : "internal function"
OrganizationManager -.-> organizationmanagerHandleDeleteOrg : "internal function"
OrganizationManager -.-> organizationmanagerHandleAcceptInvite : "internal function"
OrganizationManager -.-> organizationmanagerHandleDeclineInvite : "internal function"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputFocus : "internal function"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputChange : "internal function"
OrgMemberDropdown -.-> orgmemberdropdownHandleSelect : "internal function"
ShareSpacePopup -.-> sharespacepopupFilteredMembers : "render helper"
ShareSpacePopup -.-> sharespacepopupToggleMember : "internal function"
ShareSpacePopup -.-> sharespacepopupHandleShare : "internal function"
SpacesTable -.-> spacestableHandleSpaceClick : "internal function"
SpacesTable -.-> spacestableThStyles : "render helper"
SpacesTable -.-> spacestableTdStyles : "render helper"
SpacesTable -.-> spacestableCategoryRowStyles : "render helper"
SpacesTable -.-> spacestableInviteBannerStyle : "render helper"
DodecahedronWireframe -.-> dodecahedronwireframeGenerateDodecahedronEdges : "internal function"
FakeGlowMaterial -.-> fakeglowmaterialFakeGlowMaterial : "render helper"
LandingApp -.-> landingappCreateUserDocument : "internal function"
LandingApp -.-> landingappHandleLogin : "internal function"
LandingApp -.-> landingappHandleLogout : "internal function"
LandingApp -.-> landingappNavigateToSpace : "internal function"
LandingApp -.-> landingappFetchUserSpaces : "internal function"
LandingApp -.-> landingappCreateNewSpace : "internal function"
LandingApp -.-> landingappHandleShareSpace : "internal function"
LandingApp -.-> landingappHandleDeleteSpace : "internal function"
LandingApp -.-> landingappHandleLeaveSpace : "internal function"
LandingApp -.-> landingappHandleFirstCubeComplete : "internal function"
LandingApp -.-> landingappHandleDodecahedronComplete : "internal function"
LandingApp -.-> landingappHandleAcceptInvite : "internal function"
LandingApp -.-> landingappHandleDeclineInvite : "internal function"
LandingApp -.-> landingappSpaceTableProps : "render helper"
LandingApp -.-> landingappCreateSpaceProps : "render helper"
LandingApp -.-> landingappSharePopupProps : "render helper"
UpdatesEditor -.-> updateseditorHandleKeyCommand : "internal function"
UpdatesEditor -.-> updateseditorToggleInlineStyle : "internal function"
UpdatesEditor -.-> updateseditorHandleSave : "internal function"
UpdatesViewer -.-> updatesviewerParsedContent : "render helper"
UpdatesViewer -.-> updatesviewerFormattedTimestamp : "render helper"
WhitePlane -.-> whiteplanePlaneGeometry : "render helper"
WhitePlane -.-> whiteplaneGridTexture : "render helper"

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
Connection -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"

%% File-Function Relationships
index -.-> createVerifyAuthTokenApp : "contains"
index -.-> verifyAuthToken : "contains"
index -.-> createBulkImportApp : "contains"
index -.-> bulkImport : "contains"
index -.-> fetchGithubToken : "contains"
index -.-> createBulkDeleteApp : "contains"
index -.-> bulkDelete : "contains"
index -.-> validateRuntimeScanUrl : "contains"
index -.-> sanitizeMerfolkId : "contains"
index -.-> generateMerfolkFromRuntimeTrace : "contains"
index -.-> extractSourceMapUrl : "contains"
index -.-> scanOriginalSource : "contains"
index -.-> extractNamesFromSourceMap : "contains"
index -.-> scanJsBundles : "contains"
index -.-> captureRuntimeTrace : "contains"
index -.-> deduplicateApiCalls : "contains"
index -.-> buildConnections : "contains"
index -.-> createScanWebsiteRuntimeApp : "contains"
index -.-> scanWebsiteRuntime : "contains"
useAuth -.-> useAuth : "contains"
useAuthState -.-> useAuthState : "contains"
useCentralizedBroadcastManager -.-> useCentralizedBroadcastManager : "contains"
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
useConnectionObjects -.-> useConnectionObjects : "contains"
useConnectionObjects -.-> usePathfindingObjects : "contains"
useConnectionObjects -.-> useConnectionObjectPositions : "contains"
useConnections -.-> useConnections : "contains"
useConnectionsRendererStore -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore -.-> useConnectionState : "contains"
useConnectionsRendererStore -.-> useConnectionActions : "contains"
useDebouncedUpdate -.-> useDebouncedUpdate : "contains"
useFrustumCulling -.-> isPointInFrustum : "contains"
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> SpatialHash : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
useGlobalClickHandler -.-> useGlobalClickHandler : "contains"
useIndicators -.-> useIndicators : "contains"
useObjects -.-> useObjects : "contains"
useSpaceManager -.-> useSpaceManager : "contains"
useSpatialManager -.-> useSpatialManager : "contains"
useTextureUpdater -.-> useTextureUpdater : "contains"
useTimeoutManager -.-> useTimeoutManager : "contains"
useWindowSize -.-> useWindowSize : "contains"
LandingApp -.-> LandingApp : "contains"
Loader -.-> Loader : "contains"
Order -.-> OrderHeader : "contains"
sharedSpacesService -.-> addSharedSpaceReference : "contains"
sharedSpacesService -.-> removeSharedSpaceReference : "contains"
sharedSpacesService -.-> getSharedSpacesForUser : "contains"
sharedSpacesService -.-> removeAllSharedReferences : "contains"
Volspace -.-> Model : "contains"
authService -.-> signInUser : "contains"
authService -.-> handlePostLoginRedirect : "contains"
authService -.-> signOut : "contains"
authService -.-> handleRedirectResult : "contains"
authService -.-> observeAuthState : "contains"
authService -.-> validateAuthToken : "contains"
authService -.-> handleUrlAuth : "contains"
centralizedBroadcastManager -.-> CentralizedBroadcastManager : "contains"
centralizedBroadcastManager -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager -.-> cleanupBroadcastManager : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionsService -.-> pauseConnectionListeners : "contains"
connectionsService -.-> resumeConnectionListeners : "contains"
connectionsService -.-> addConnectionStateListener : "contains"
connectionsService -.-> enableConnectionNetwork : "contains"
connectionsService -.-> disableConnectionNetwork : "contains"
connectionsService -.-> getConnectionNetworkState : "contains"
connectionsService -.-> saveConnection : "contains"
connectionsService -.-> subscribeToConnections : "contains"
connectionsService -.-> deleteConnection : "contains"
connectionsService -.-> deleteConnectionEnhanced : "contains"
githubRepoService -.-> exchangeGithubCode : "contains"
githubRepoService -.-> fetchRepositories : "contains"
githubRepoService -.-> fetchFileContent : "contains"
githubRepoService -.-> fetchLatestCommitSha : "contains"
githubRepoService -.-> fetchChangedFiles : "contains"
githubRepoService -.-> fetchRepositoryStructure : "contains"
githubRepoService -.-> generateMerfolkFromRepository : "contains"
githubRepoService -.-> getGithubToken : "contains"
githubRepoService -.-> setGithubToken : "contains"
githubRepoService -.-> isGithubAuthenticated : "contains"
githubRepoService -.-> getGithubOAuthUrl : "contains"
githubRepoService -.-> handleGithubCallback : "contains"
githubRepoService -.-> scanRepositoryAndGenerateDiagram : "contains"
githubRepoService -.-> mergeMerfolkMarkdown : "contains"
githubRepoService -.-> rescanRepositoryForChanges : "contains"
globalOptimizationCoordinator -.-> GlobalOptimizationCoordinator : "contains"
globalOptimizationCoordinator -.-> initializeOptimizationCoordinator : "contains"
globalOptimizationCoordinator -.-> getOptimizationStatus : "contains"
globalOptimizationCoordinator -.-> consolidateSystem : "contains"
globalOptimizationCoordinator -.-> cleanupOptimizationCoordinator : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
markdownDiagramService -.-> MarkdownDiagramService : "contains"
markdownDiagramService -.-> markdownDiagramService : "contains"
organizationService -.-> createOrganization : "contains"
organizationService -.-> getUserOrganizations : "contains"
organizationService -.-> getOrganizationById : "contains"
organizationService -.-> getOrganizationMembers : "contains"
organizationService -.-> getMemberCount : "contains"
organizationService -.-> isOrganizationAdmin : "contains"
organizationService -.-> inviteUserToOrganization : "contains"
organizationService -.-> getPendingInvitesForUser : "contains"
organizationService -.-> acceptInvite : "contains"
organizationService -.-> declineInvite : "contains"
organizationService -.-> removeMemberFromOrganization : "contains"
organizationService -.-> leaveOrganization : "contains"
organizationService -.-> updateOrganizationPlan : "contains"
organizationService -.-> deleteOrganization : "contains"
presenceService -.-> setUserPresence : "contains"
presenceService -.-> setGuestPresence : "contains"
presenceService -.-> subscribeToSpacePresence : "contains"
resourceCleanupService -.-> ResourceCleanupService : "contains"
resourceCleanupService -.-> resourceCleanupService : "contains"
runtimeScanService -.-> validateScanUrl : "contains"
runtimeScanService -.-> generateMerfolkFromRuntimeTrace : "contains"
runtimeScanService -.-> scanWebsiteAndGenerateDiagram : "contains"
screenRecordingService -.-> ScreenRecordingService : "contains"
screenRecordingService -.-> screenRecorder : "contains"
sharedSpacesService -.-> sharedSpacesCacheSet : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
spacesService -.-> getSpaceById : "contains"
spacesService -.-> createSpace : "contains"
spacesService -.-> getOrCreateDefaultSpace : "contains"
spacesService -.-> migrateToDefaultSpace : "contains"
spacesService -.-> getUserSpaces : "contains"
spacesService -.-> deleteSpace : "contains"
spacesService -.-> hasSpaceAccess : "contains"
spacesService -.-> getPublicSpaceMetadata : "contains"
spatialObjectsService -.-> objectsCache : "contains"
spatialObjectsService -.-> saveTimeouts : "contains"
spatialObjectsService -.-> updateThrottles : "contains"
spatialObjectsService -.-> lastReceivedObjects : "contains"
spatialObjectsService -.-> movingObjects : "contains"
spatialObjectsService -.-> objectCellMap : "contains"
spatialObjectsService -.-> cancelPendingSave : "contains"
spatialObjectsService -.-> enqueueSave : "contains"
spatialObjectsService -.-> flushSaveBatch : "contains"
spatialObjectsService -.-> clearAllObjectCaches : "contains"
spatialObjectsService -.-> saveObjectToCell : "contains"
spatialObjectsService -.-> deleteObjectFromSpatialCell : "contains"
spatialObjectsService -.-> updateObjectInSpatialCell : "contains"
spatialObjectsService -.-> subscribeToSpatialObjects : "contains"
spatialObjectsService -.-> updateCellSubscriptions : "contains"
spatialObjectsService -.-> moveObjectBetweenCells : "contains"
spatialObjectsService -.-> loadObjectsFromCells : "contains"
spatialObjectsService -.-> saveObject : "contains"
spatialObjectsService -.-> deleteObject : "contains"
spatialObjectsService -.-> updateObject : "contains"
spatialObjectsService -.-> subscribeToObjects : "contains"
spatialObjectsService -.-> getObjectDeletionStatus : "contains"
spatialObjectsService -.-> clearObjectDeletionBlacklist : "contains"
spatialPartitioning -.-> getCellCoordinates : "contains"
spatialPartitioning -.-> getCellCoordinatesWithHysteresis : "contains"
spatialPartitioning -.-> getCellId : "contains"
spatialPartitioning -.-> parseCellId : "contains"
spatialPartitioning -.-> getCellBounds : "contains"
spatialPartitioning -.-> createCell : "contains"
spatialPartitioning -.-> createCellsBatch : "contains"
spatialPartitioning -.-> cellExists : "contains"
spatialPartitioning -.-> cellExistsBulk : "contains"
spatialPartitioning -.-> getCell : "contains"
spatialPartitioning -.-> addObjectToCell : "contains"
spatialPartitioning -.-> removeObjectFromCell : "contains"
spatialPartitioning -.-> moveObjectBetweenCells : "contains"
spatialPartitioning -.-> getLoadedCells : "contains"
spatialPartitioning -.-> getObjectsFromCells : "contains"
spatialPartitioning -.-> updateObjectInCell : "contains"
spatialPartitioning -.-> deleteObjectFromCell : "contains"
spatialPartitioning -.-> subscribeToCells : "contains"
spatialPartitioning -.-> getOccupiedCells : "contains"
spatialPartitioning -.-> getCellDistance : "contains"
spatialPartitioning -.-> getCellsToUnload : "contains"
spatialPartitioning -.-> addConnectionToCells : "contains"
spatialPartitioning -.-> bulkSaveConnectionsToCell : "contains"
spatialPartitioning -.-> addConnectionToCell : "contains"
spatialPartitioning -.-> removeConnectionFromAllCells : "contains"
spatialPartitioning -.-> removeConnectionFromCells : "contains"
spatialPartitioning -.-> removeConnectionFromCell : "contains"
spatialPartitioning -.-> getConnectionsFromCells : "contains"
spatialPartitioning -.-> updateConnectionInCells : "contains"
spatialPartitioning -.-> getCellsInRadius : "contains"
spatialPartitioning -.-> getNeighborCells : "contains"
spatialPartitioning -.-> debugCellRadius : "contains"
spatialPartitioning -.-> debugNeighborCells : "contains"
spatialPartitioning -.-> debugCurrentCellLoading : "contains"
spatialPartitioning -.-> findObjectInCells : "contains"
spatialPartitioning -.-> getAllObjectsInSpace : "contains"
spatialPartitioning -.-> findConnectionInCells : "contains"
spatialPartitioning -.-> purgeConnectionFromAllCells : "contains"
spatialPartitioning -.-> deleteAllCellsInSpace : "contains"
storageService -.-> uploadImageToStorage : "contains"
storageService -.-> uploadModelToStorage : "contains"
storageService -.-> uploadMarkdownToStorage : "contains"
streamlinedSpatialPartitioning -.-> StreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> getStreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> initializeStreamlinedSpatialPartitioning : "contains"
streamlinedSpatialPartitioning -.-> benchmarkStreamlinedSystem : "contains"
unifiedCacheManager -.-> UnifiedCacheManager : "contains"
webRservice -.-> initWebRTC : "contains"
webRservice -.-> BroadcastSession : "contains"
webRservice -.-> startBroadcasting : "contains"
webRservice -.-> joinBroadcast : "contains"
webRservice -.-> isPlaneBeingBroadcast : "contains"
webRservice -.-> findAvailableBroadcasts : "contains"
webRservice -.-> cleanupWebRTC : "contains"
webRservice -.-> registerUserPresence : "contains"
webRservice -.-> subscribeToUsersInSpace : "contains"
shaders -.-> opacity : "contains"
shaders -.-> glowWidth : "contains"
shaders -.-> glowIntensity : "contains"
shaders -.-> linewidth : "contains"
shaders -.-> resolution : "contains"
connectionStore -.-> _buildConnectionsByObjectId : "contains"
cubeStore -.-> getCubeSelector : "contains"
cubeStore -.-> getCubeFaceColorSelector : "contains"
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
cubeStore -.-> getCubeFaceStateSelector : "contains"
lodStore -.-> calculateLODLevel : "contains"
lodStore -.-> calculateParentLODLevel : "contains"
storeUtils -.-> useStoreInitialization : "contains"
storeUtils -.-> useCubeSelectors : "contains"
storeUtils -.-> useCubeActions : "contains"
storeUtils -.-> usePlaneSelectors : "contains"
storeUtils -.-> usePlaneActions : "contains"
storeUtils -.-> useGlobalStoreUtils : "contains"
uiOverlayStore -.-> setCellBoundariesVisible : "contains"
animationUtils -.-> registerMaterial : "contains"
animationUtils -.-> unregisterMaterial : "contains"
animationUtils -.-> setAnimationSpeed : "contains"
animationUtils -.-> initAnimationSystem : "contains"
bvhRaycasting -.-> BVHNode : "contains"
bvhRaycasting -.-> BVHAcceleratedRaycaster : "contains"
bvhRaycasting -.-> initBVHRaycasting : "contains"
bvhRaycasting -.-> getBVH : "contains"
bvhRaycasting -.-> updateBVHObjects : "contains"
bvhRaycasting -.-> bvhIntersectObjects : "contains"
bvhRaycasting -.-> getBVHStats : "contains"
bvhRaycasting -.-> updateLODLevels : "contains"
bvhRaycasting -.-> registerObjectRelationships : "contains"
connectionUtils -.-> validateConnection : "contains"
connectionUtils -.-> getIndicatorId : "contains"
connectionUtils -.-> getConnectionKey : "contains"
connectionUtils -.-> prepareTextObjectIndicator : "contains"
connectionUtils -.-> objectsAreConnectedInStore : "contains"
connectionUtils -.-> getConnectionsForObject : "contains"
connectionUtils -.-> createConnectionInStore : "contains"
connectionUtils -.-> updateConnectionPositionsInStore : "contains"
connectionUtils -.-> removeConnectionsForObject : "contains"
connectionUtils -.-> isInConnectionCreationMode : "contains"
connectionUtils -.-> startConnectionCreation : "contains"
connectionUtils -.-> completeConnectionCreation : "contains"
connectionUtils -.-> cancelConnectionCreation : "contains"
debugUtils -.-> logAnimation : "contains"
debugUtils -.-> forceAnimateConnection : "contains"
debugUtils -.-> shouldAnimateConnection : "contains"
debugUtils -.-> recordFrameTime : "contains"
debugUtils -.-> recordStateUpdate : "contains"
debugUtils -.-> getPerfStats : "contains"
debugUtils -.-> resetPerfStats : "contains"
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
facePositionUtils -.-> calculateFacePosition : "contains"
frameCounter -.-> FrameCounter : "contains"
frameCounter -.-> frameCounter : "contains"
gpuResourceTracker -.-> GPUResourceTracker : "contains"
gpuResourceTracker -.-> gpuTracker : "contains"
loadingState -.-> getIsInitialLoading : "contains"
loadingState -.-> setIsInitialLoading : "contains"
objectUpdateHandlers -.-> handleObjectMove : "contains"
objectUpdateHandlers -.-> handleObjectUpdate : "contains"
objectVirtualization -.-> ObjectVirtualizer : "contains"
objectVirtualization -.-> objectVirtualizer : "contains"
pathfindingUtils -.-> invalidatePathfindingCaches : "contains"
pathfindingUtils -.-> checkObjectMovement : "contains"
pathfindingUtils -.-> cleanCaches : "contains"
pathfindingUtils -.-> roundForCache : "contains"
pathfindingUtils -.-> lineIntersectsBoundingBox : "contains"
pathfindingUtils -.-> generateCacheKey : "contains"
pathfindingUtils -.-> havePositionsChanged : "contains"
pathfindingUtils -.-> checkLineIntersection : "contains"
pathfindingUtils -.-> generateCurvedPath : "contains"
pathfindingUtils -.-> checkCurveIntersections : "contains"
pathfindingUtils -.-> generateMultiSegmentPath : "contains"
pathfindingUtils -.-> precomputeCacheKey : "contains"
pathfindingUtils -.-> getPrecomputedResult : "contains"
pathfindingUtils -.-> computeConnectionPath : "contains"
pathfindingUtils -.-> precomputePathsBatch : "contains"
positionUtils -.-> calculateMidpoint : "contains"
positionUtils -.-> calculateMidpointVector : "contains"
positionUtils -.-> lerp : "contains"
positionUtils -.-> checkPositionJitter : "contains"
renderWorkScheduler -.-> _frameTimeTracker : "contains"
renderWorkScheduler -.-> _resetForNextFrame : "contains"
renderWorkScheduler -.-> acquireBudget : "contains"
renderWorkScheduler -.-> setFrameBudget : "contains"
renderWorkScheduler -.-> getFrameBudget : "contains"
renderWorkScheduler -.-> notifyCameraMove : "contains"
renderWorkScheduler -.-> isCameraMoving : "contains"
renderWorkScheduler -.-> isCameraMovingRapidly : "contains"
renderWorkScheduler -.-> isFrameBudgetExhausted : "contains"
renderWorkScheduler -.-> getSmoothedFrameTime : "contains"
snappingUtils -.-> calculateAxisSnap : "contains"
snappingUtils -.-> distanceToAxis : "contains"
snappingUtils -.-> projectPointOntoAxis : "contains"
streamlinedSpatialIndex -.-> Point3D : "contains"
streamlinedSpatialIndex -.-> BoundingBox : "contains"
streamlinedSpatialIndex -.-> OptimizedSpatialGrid : "contains"
streamlinedSpatialIndex -.-> createStreamlinedSpatialIndex : "contains"
streamlinedSpatialIndex -.-> benchmarkStreamlined : "contains"
textAtlas -.-> TextAtlas : "contains"
textAtlas -.-> MultiPageTextAtlas : "contains"
textAtlas -.-> isOffscreenCanvasTextSupported : "contains"
textAtlas -.-> WorkerMultiPageTextAtlas : "contains"
textAtlas -.-> _switchToSyncAtlas : "contains"
textAtlas -.-> getGlobalTextAtlas : "contains"
textAtlas -.-> resetGlobalTextAtlas : "contains"
textAtlas -.-> createAtlasTextMesh : "contains"
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
textureLoader -.-> loadTextureFromBlob : "contains"
unifiedPerformanceUtils -.-> throttle : "contains"
unifiedPerformanceUtils -.-> debounce : "contains"
unifiedPerformanceUtils -.-> measurePerformance : "contains"
unifiedPerformanceUtils -.-> scheduleWork : "contains"
unifiedPerformanceUtils -.-> memoize : "contains"
unifiedPerformanceUtils -.-> trackLCP : "contains"
unifiedValidationUtils -.-> cleanObject : "contains"
unifiedValidationUtils -.-> validateRequiredProperties : "contains"
unifiedValidationUtils -.-> validateObjectSchema : "contains"
unifiedValidationUtils -.-> isValidPosition : "contains"
unifiedValidationUtils -.-> validatePosition : "contains"
unifiedValidationUtils -.-> validatePositionBounds : "contains"
unifiedValidationUtils -.-> validateConnection : "contains"
unifiedValidationUtils -.-> validateConnectionData : "contains"
unifiedValidationUtils -.-> getIndicatorId : "contains"
unifiedValidationUtils -.-> validateIndicator : "contains"
unifiedValidationUtils -.-> validateFile : "contains"
unifiedValidationUtils -.-> validateObjectId : "contains"
unifiedValidationUtils -.-> validateSpaceId : "contains"
unifiedValidationUtils -.-> validateUserId : "contains"
unifiedValidationUtils -.-> validateUrl : "contains"
unifiedValidationUtils -.-> validateEmail : "contains"
unifiedValidationUtils -.-> validateArray : "contains"
unifiedValidationUtils -.-> validateMultiple : "contains"
diagramLayoutWorker -.-> estimateNodeSize : "contains"
diagramLayoutWorker -.-> isHierarchyConnection : "contains"
diagramLayoutWorker -.-> filterConnections : "contains"
diagramLayoutWorker -.-> layoutNodes : "contains"
diagramLayoutWorker -.-> layoutEdges : "contains"
diagramLayoutWorkerClient -.-> getDiagramLayoutWorker : "contains"
diagramLayoutWorkerClient -.-> terminateDiagramLayoutWorker : "contains"
markdownLayoutWorker -.-> LayoutEngine : "contains"
markdownLayoutWorker -.-> parseFlowPaths : "contains"
markdownLayoutWorker -.-> stripFlowPathSyntax : "contains"
markdownLayoutWorker -.-> computeHeaderStyle : "contains"
markdownLayoutWorkerClient -.-> getMarkdownLayoutWorker : "contains"
markdownLayoutWorkerClient -.-> terminateMarkdownLayoutWorker : "contains"
pathfindingWorkerClient -.-> getPathfindingWorker : "contains"
pathfindingWorkerClient -.-> terminatePathfindingWorker : "contains"
spatialIndexWorker -.-> childLOD : "contains"
spatialIndexWorker -.-> parentLOD : "contains"
spatialIndexWorker -.-> isPointInFrustum : "contains"
spatialIndexWorkerClient -.-> getSpatialIndexWorker : "contains"
spatialIndexWorkerClient -.-> terminateSpatialIndexWorker : "contains"
textAtlasWorker -.-> getKey : "contains"
textAtlasWorker -.-> AtlasPage : "contains"
textAtlasWorker -.-> addPage : "contains"
textAtlasWorkerClient -.-> getTextAtlasWorker : "contains"
textAtlasWorkerClient -.-> terminateTextAtlasWorker : "contains"

```