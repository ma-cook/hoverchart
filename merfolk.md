```merfolk
%% hoverchart Repository Analysis

%% Components
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
DiagramOverlay2D{Component: DiagramOverlay2D}
TextStyleUIContent{Component: TextStyleUIContent}
LandingApp{Component: LandingApp}
Loader{Component: Loader}
OrderHeader{Component: OrderHeader}
Model{Component: Model}

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
generateMerfolkFromRuntimeTrace[Function: generateMerfolkFromRuntimeTrace]
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
BVHIntegration[Function: BVHIntegration]
computeVisibleCells[Function: computeVisibleCells]
getTextParametricT[Function: getTextParametricT]
redistributeFaces[Function: redistributeFaces]
pathToLineSegments[Function: pathToLineSegments]
resolveEndpointPosition[Function: resolveEndpointPosition]
faceMaterialProps[Function: faceMaterialProps]
getFaceIndicatorProps[Function: getFaceIndicatorProps]
faces[Function: faces]
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]
flowPathColor[Function: flowPathColor]
getEdgeStyle[Function: getEdgeStyle]
getMarkerEnd[Function: getMarkerEnd]
getSelectedStyle[Function: getSelectedStyle]
getUnselectedStyle[Function: getUnselectedStyle]
MerfolkEdge_file[Function: MerfolkEdge_file]
EdgeMarkerDefs_file[Function: EdgeMarkerDefs_file]
MerfolkEdgeMemo[Function: MerfolkEdgeMemo]
customEdgeTypes[Function: customEdgeTypes]
buildNodeStyles[Function: buildNodeStyles]
buildContainerStyles[Function: buildContainerStyles]
buildPrecomputedNode[Function: buildPrecomputedNode]
MerfolkNode_file[Function: MerfolkNode_file]
ContainerNode_file[Function: ContainerNode_file]
MerfolkNodeMemo[Function: MerfolkNodeMemo]
ContainerNodeMemo[Function: ContainerNodeMemo]
customNodeTypes[Function: customNodeTypes]
buildReactFlowNodes[Function: buildReactFlowNodes]
buildReactFlowEdges[Function: buildReactFlowEdges]
layerForType[Function: layerForType]
filterEdges[Function: filterEdges]
minimapNodeColor[Function: minimapNodeColor]
DiagramOverlay2D_file[Function: DiagramOverlay2D_file]
FrameloopController[Function: FrameloopController]
FrameTicker[Function: FrameTicker]
cubeTransformMap[Function: cubeTransformMap]
dodecahedronTransformMap[Function: dodecahedronTransformMap]
tetrahedronTransformMap[Function: tetrahedronTransformMap]
TextStyleUIContent_file[Function: TextStyleUIContent_file]
isValidFirebaseConfig[Function: isValidFirebaseConfig]
useAuth[Function: useAuth]
useAuthState[Function: useAuthState]
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
ConnectionAnimationManager[Function: ConnectionAnimationManager]
useAnimatedLine[Function: useAnimatedLine]
useAnimationStats[Function: useAnimationStats]
useConnectionObjects[Function: useConnectionObjects]
usePathfindingObjects[Function: usePathfindingObjects]
useConnectionObjectPositions[Function: useConnectionObjectPositions]
useConnections[Function: useConnections]
useConnectionsRendererStore[Function: useConnectionsRendererStore]
useConnectionState[Function: useConnectionState]
useConnectionActions[Function: useConnectionActions]
useDebouncedUpdate[Function: useDebouncedUpdate]
isPointInFrustum[Function: isPointInFrustum]
isConnectionVisible[Function: isConnectionVisible]
useFrustumCulledConnections[Function: useFrustumCulledConnections]
useDynamicFrustumCulling[Function: useDynamicFrustumCulling]
useGlobalClickHandler[Function: useGlobalClickHandler]
useIndicators[Function: useIndicators]
useObjects[Function: useObjects]
useSpaceManager[Function: useSpaceManager]
useSpatialManager[Function: useSpatialManager]
useTextureUpdater[Function: useTextureUpdater]
useTimeoutManager[Function: useTimeoutManager]
CreateOrganizationPopup[Function: CreateOrganizationPopup]
CreateSpacePopup[Function: CreateSpacePopup]
OrganizationManager[Function: OrganizationManager]
OrgMemberDropdown[Function: OrgMemberDropdown]
ShareSpacePopup[Function: ShareSpacePopup]
SpacesTable[Function: SpacesTable]
UserLoginSection[Function: UserLoginSection]
WelcomeOverlay[Function: WelcomeOverlay]
useWindowSize[Function: useWindowSize]
LandingApp_file[Function: LandingApp_file]
Loader_file[Function: Loader_file]
OrderHeader_file[Function: OrderHeader_file]
addSharedSpaceReference[Function: addSharedSpaceReference]
removeSharedSpaceReference[Function: removeSharedSpaceReference]
getSharedSpacesForUser[Function: getSharedSpacesForUser]
removeAllSharedReferences[Function: removeAllSharedReferences]
Model_file[Function: Model_file]
signInUser[Function: signInUser]
handlePostLoginRedirect[Function: handlePostLoginRedirect]
signOut[Function: signOut]
handleRedirectResult[Function: handleRedirectResult]
observeAuthState[Function: observeAuthState]
validateAuthToken[Function: validateAuthToken]
handleUrlAuth[Function: handleUrlAuth]
subscribePlaneToBroadcasts[Function: subscribePlaneToBroadcasts]
getBroadcastManagerDebugInfo[Function: getBroadcastManagerDebugInfo]
cleanupBroadcastManager[Function: cleanupBroadcastManager]
resolveConnectionPositions[Function: resolveConnectionPositions]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
pauseConnectionListeners[Function: pauseConnectionListeners]
resumeConnectionListeners[Function: resumeConnectionListeners]
addConnectionStateListener[Function: addConnectionStateListener]
enableConnectionNetwork[Function: enableConnectionNetwork]
disableConnectionNetwork[Function: disableConnectionNetwork]
getConnectionNetworkState[Function: getConnectionNetworkState]
saveConnection[Function: saveConnection]
subscribeToConnections[Function: subscribeToConnections]
deleteConnection[Function: deleteConnection]
deleteConnectionEnhanced[Function: deleteConnectionEnhanced]
exchangeGithubCode[Function: exchangeGithubCode]
fetchRepositories[Function: fetchRepositories]
fetchFileContent[Function: fetchFileContent]
fetchLatestCommitSha[Function: fetchLatestCommitSha]
fetchChangedFiles[Function: fetchChangedFiles]
fetchRepositoryStructure[Function: fetchRepositoryStructure]
generateMerfolkFromRepository[Function: generateMerfolkFromRepository]
getGithubToken[Function: getGithubToken]
setGithubToken[Function: setGithubToken]
isGithubAuthenticated[Function: isGithubAuthenticated]
getGithubOAuthUrl[Function: getGithubOAuthUrl]
handleGithubCallback[Function: handleGithubCallback]
scanRepositoryAndGenerateDiagram[Function: scanRepositoryAndGenerateDiagram]
mergeMerfolkMarkdown[Function: mergeMerfolkMarkdown]
rescanRepositoryForChanges[Function: rescanRepositoryForChanges]
initializeOptimizationCoordinator[Function: initializeOptimizationCoordinator]
getOptimizationStatus[Function: getOptimizationStatus]
consolidateSystem[Function: consolidateSystem]
cleanupOptimizationCoordinator[Function: cleanupOptimizationCoordinator]
SUBSCRIPTION_TYPES[Function: SUBSCRIPTION_TYPES]
getOrCreateSubscription[Function: getOrCreateSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
generateSubscriptionKey[Function: generateSubscriptionKey]
connectionMethods[Function: connectionMethods]
NODE_TYPE_COMPONENT[Function: NODE_TYPE_COMPONENT]
NODE_TYPE_FUNCTION[Function: NODE_TYPE_FUNCTION]
NODE_TYPE_STORE[Function: NODE_TYPE_STORE]
NODE_TYPE_SERVICE[Function: NODE_TYPE_SERVICE]
NODE_TYPE_LIBRARY[Function: NODE_TYPE_LIBRARY]
NODE_TYPE_UTILITY[Function: NODE_TYPE_UTILITY]
NODE_TYPE_DATAPATH[Function: NODE_TYPE_DATAPATH]
NODE_TYPE_HANDLER[Function: NODE_TYPE_HANDLER]
NODE_TYPE_CONTROL[Function: NODE_TYPE_CONTROL]
NODE_TYPE_STATE[Function: NODE_TYPE_STATE]
NODE_TYPE_DATA[Function: NODE_TYPE_DATA]
NODE_TYPE_HOOK[Function: NODE_TYPE_HOOK]
NODE_TYPE_MODULE[Function: NODE_TYPE_MODULE]
NODE_TYPE_CLASS[Function: NODE_TYPE_CLASS]
NODE_TYPE_INTERFACE[Function: NODE_TYPE_INTERFACE]
NODE_TYPE_VARIABLE[Function: NODE_TYPE_VARIABLE]
NODE_TYPE_CONSTANT[Function: NODE_TYPE_CONSTANT]
OBJECT_TYPE_CUBE[Function: OBJECT_TYPE_CUBE]
OBJECT_TYPE_DODECAHEDRON[Function: OBJECT_TYPE_DODECAHEDRON]
OBJECT_TYPE_TETRAHEDRON[Function: OBJECT_TYPE_TETRAHEDRON]
UI_COMPONENTS[Function: UI_COMPONENTS]
MAX_RECURSION_DEPTH[Function: MAX_RECURSION_DEPTH]
BASE_DODECAHEDRON_SIZE[Function: BASE_DODECAHEDRON_SIZE]
BASE_DODECAHEDRON_RADIUS[Function: BASE_DODECAHEDRON_RADIUS]
DEFAULT_CAMERA_DISTANCE[Function: DEFAULT_CAMERA_DISTANCE]
SPACING_BETWEEN_COMPONENTS[Function: SPACING_BETWEEN_COMPONENTS]
DEFAULT_CUBE_SIZE[Function: DEFAULT_CUBE_SIZE]
DEFAULT_SPHERE_SIZE[Function: DEFAULT_SPHERE_SIZE]
DEFAULT_CONTAINER_SIZE[Function: DEFAULT_CONTAINER_SIZE]
MIN_SCALE_FACTOR[Function: MIN_SCALE_FACTOR]
DESIRED_GAP[Function: DESIRED_GAP]
GROUP_CONTAINER_COLORS[Function: GROUP_CONTAINER_COLORS]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
containerMethods[Function: containerMethods]
hierarchyMethods[Function: hierarchyMethods]
objectMethods[Function: objectMethods]
positionMethods[Function: positionMethods]
processMethods[Function: processMethods]
scaleMethods[Function: scaleMethods]
markdownDiagramService[Function: markdownDiagramService]
PLAN_LIMITS[Function: PLAN_LIMITS]
createOrganization[Function: createOrganization]
getUserOrganizations[Function: getUserOrganizations]
getOrganizationById[Function: getOrganizationById]
getOrganizationMembers[Function: getOrganizationMembers]
getMemberCount[Function: getMemberCount]
isOrganizationAdmin[Function: isOrganizationAdmin]
inviteUserToOrganization[Function: inviteUserToOrganization]
getPendingInvitesForUser[Function: getPendingInvitesForUser]
acceptInvite[Function: acceptInvite]
declineInvite[Function: declineInvite]
removeMemberFromOrganization[Function: removeMemberFromOrganization]
leaveOrganization[Function: leaveOrganization]
updateOrganizationPlan[Function: updateOrganizationPlan]
deleteOrganization[Function: deleteOrganization]
setUserPresence[Function: setUserPresence]
setGuestPresence[Function: setGuestPresence]
subscribeToSpacePresence[Function: subscribeToSpacePresence]
resourceCleanupService[Function: resourceCleanupService]
validateScanUrl[Function: validateScanUrl]
scanWebsiteAndGenerateDiagram[Function: scanWebsiteAndGenerateDiagram]
screenRecorder[Function: screenRecorder]
sharedSpacesCacheSet[Function: sharedSpacesCacheSet]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
generateSharingUrl[Function: generateSharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]
getSpaceById[Function: getSpaceById]
createSpace[Function: createSpace]
getOrCreateDefaultSpace[Function: getOrCreateDefaultSpace]
migrateToDefaultSpace[Function: migrateToDefaultSpace]
getUserSpaces[Function: getUserSpaces]
deleteSpace[Function: deleteSpace]
hasSpaceAccess[Function: hasSpaceAccess]
getPublicSpaceMetadata[Function: getPublicSpaceMetadata]
objectsCache[Function: objectsCache]
saveTimeouts[Function: saveTimeouts]
updateThrottles[Function: updateThrottles]
lastReceivedObjects[Function: lastReceivedObjects]
movingObjects[Function: movingObjects]
objectCellMap[Function: objectCellMap]
cancelPendingSave[Function: cancelPendingSave]
enqueueSave[Function: enqueueSave]
flushSaveBatch[Function: flushSaveBatch]
clearAllObjectCaches[Function: clearAllObjectCaches]
saveObjectToCell[Function: saveObjectToCell]
deleteObjectFromSpatialCell[Function: deleteObjectFromSpatialCell]
updateObjectInSpatialCell[Function: updateObjectInSpatialCell]
subscribeToSpatialObjects[Function: subscribeToSpatialObjects]
updateCellSubscriptions[Function: updateCellSubscriptions]
moveObjectBetweenCells[Function: moveObjectBetweenCells]
loadObjectsFromCells[Function: loadObjectsFromCells]
saveObject[Function: saveObject]
deleteObject[Function: deleteObject]
updateObject[Function: updateObject]
subscribeToObjects[Function: subscribeToObjects]
getObjectDeletionStatus[Function: getObjectDeletionStatus]
clearObjectDeletionBlacklist[Function: clearObjectDeletionBlacklist]
CELL_SIZE[Function: CELL_SIZE]
CELL_NEIGHBOR_RADIUS[Function: CELL_NEIGHBOR_RADIUS]
CELL_UNLOAD_DISTANCE[Function: CELL_UNLOAD_DISTANCE]
CELL_BOUNDARY_HYSTERESIS[Function: CELL_BOUNDARY_HYSTERESIS]
getCellCoordinates[Function: getCellCoordinates]
getCellCoordinatesWithHysteresis[Function: getCellCoordinatesWithHysteresis]
getCellId[Function: getCellId]
parseCellId[Function: parseCellId]
getCellBounds[Function: getCellBounds]
createCell[Function: createCell]
createCellsBatch[Function: createCellsBatch]
cellExists[Function: cellExists]
cellExistsBulk[Function: cellExistsBulk]
getCell[Function: getCell]
addObjectToCell[Function: addObjectToCell]
removeObjectFromCell[Function: removeObjectFromCell]
getLoadedCells[Function: getLoadedCells]
getObjectsFromCells[Function: getObjectsFromCells]
updateObjectInCell[Function: updateObjectInCell]
deleteObjectFromCell[Function: deleteObjectFromCell]
subscribeToCells[Function: subscribeToCells]
getOccupiedCells[Function: getOccupiedCells]
getCellDistance[Function: getCellDistance]
getCellsToUnload[Function: getCellsToUnload]
addConnectionToCells[Function: addConnectionToCells]
bulkSaveConnectionsToCell[Function: bulkSaveConnectionsToCell]
addConnectionToCell[Function: addConnectionToCell]
removeConnectionFromAllCells[Function: removeConnectionFromAllCells]
removeConnectionFromCells[Function: removeConnectionFromCells]
removeConnectionFromCell[Function: removeConnectionFromCell]
getConnectionsFromCells[Function: getConnectionsFromCells]
updateConnectionInCells[Function: updateConnectionInCells]
getCellsInRadius[Function: getCellsInRadius]
getNeighborCells[Function: getNeighborCells]
debugCellRadius[Function: debugCellRadius]
debugNeighborCells[Function: debugNeighborCells]
debugCurrentCellLoading[Function: debugCurrentCellLoading]
findObjectInCells[Function: findObjectInCells]
getAllObjectsInSpace[Function: getAllObjectsInSpace]
findConnectionInCells[Function: findConnectionInCells]
purgeConnectionFromAllCells[Function: purgeConnectionFromAllCells]
deleteAllCellsInSpace[Function: deleteAllCellsInSpace]
uploadImageToStorage[Function: uploadImageToStorage]
uploadModelToStorage[Function: uploadModelToStorage]
uploadMarkdownToStorage[Function: uploadMarkdownToStorage]
getStreamlinedSpatialManager[Function: getStreamlinedSpatialManager]
initializeStreamlinedSpatialPartitioning[Function: initializeStreamlinedSpatialPartitioning]
benchmarkStreamlinedSystem[Function: benchmarkStreamlinedSystem]
cellExistenceCache[Function: cellExistenceCache]
connectionCache[Function: connectionCache]
memoizationCache[Function: memoizationCache]
initWebRTC[Function: initWebRTC]
startBroadcasting[Function: startBroadcasting]
joinBroadcast[Function: joinBroadcast]
isPlaneBeingBroadcast[Function: isPlaneBeingBroadcast]
findAvailableBroadcasts[Function: findAvailableBroadcasts]
cleanupWebRTC[Function: cleanupWebRTC]
registerUserPresence[Function: registerUserPresence]
subscribeToUsersInSpace[Function: subscribeToUsersInSpace]
_buildConnectionsByObjectId[Function: _buildConnectionsByObjectId]
getCubeSelector[Function: getCubeSelector]
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
LOD_THRESHOLDS[Function: LOD_THRESHOLDS]
LOD_THRESHOLDS_SQ[Function: LOD_THRESHOLDS_SQ]
LOD_THRESHOLDS_PARENT[Function: LOD_THRESHOLDS_PARENT]
LOD_THRESHOLDS_PARENT_SQ[Function: LOD_THRESHOLDS_PARENT_SQ]
LOD_LEVELS[Function: LOD_LEVELS]
calculateLODLevel[Function: calculateLODLevel]
calculateParentLODLevel[Function: calculateParentLODLevel]
FACE_TEXT_DISTANCE[Function: FACE_TEXT_DISTANCE]
FACE_TEXT_DISTANCE_SQ[Function: FACE_TEXT_DISTANCE_SQ]
useStoreInitialization[Function: useStoreInitialization]
useCubeSelectors[Function: useCubeSelectors]
useCubeActions[Function: useCubeActions]
usePlaneSelectors[Function: usePlaneSelectors]
usePlaneActions[Function: usePlaneActions]
useGlobalStoreUtils[Function: useGlobalStoreUtils]
setCellBoundariesVisible[Function: setCellBoundariesVisible]
registerMaterial[Function: registerMaterial]
unregisterMaterial[Function: unregisterMaterial]
setAnimationSpeed[Function: setAnimationSpeed]
initAnimationSystem[Function: initAnimationSystem]
initBVHRaycasting[Function: initBVHRaycasting]
getBVH[Function: getBVH]
updateBVHObjects[Function: updateBVHObjects]
bvhIntersectObjects[Function: bvhIntersectObjects]
getBVHStats[Function: getBVHStats]
updateLODLevels[Function: updateLODLevels]
registerObjectRelationships[Function: registerObjectRelationships]
validateConnection[Function: validateConnection]
getIndicatorId[Function: getIndicatorId]
getConnectionKey[Function: getConnectionKey]
prepareTextObjectIndicator[Function: prepareTextObjectIndicator]
objectsAreConnectedInStore[Function: objectsAreConnectedInStore]
getConnectionsForObject[Function: getConnectionsForObject]
createConnectionInStore[Function: createConnectionInStore]
updateConnectionPositionsInStore[Function: updateConnectionPositionsInStore]
removeConnectionsForObject[Function: removeConnectionsForObject]
isInConnectionCreationMode[Function: isInConnectionCreationMode]
startConnectionCreation[Function: startConnectionCreation]
completeConnectionCreation[Function: completeConnectionCreation]
cancelConnectionCreation[Function: cancelConnectionCreation]
ANIMATION_DEBUG[Function: ANIMATION_DEBUG]
logAnimation[Function: logAnimation]
forceAnimateConnection[Function: forceAnimateConnection]
shouldAnimateConnection[Function: shouldAnimateConnection]
recordFrameTime[Function: recordFrameTime]
recordStateUpdate[Function: recordStateUpdate]
getPerfStats[Function: getPerfStats]
resetPerfStats[Function: resetPerfStats]
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
calculateFacePosition[Function: calculateFacePosition]
frameCounter[Function: frameCounter]
gpuTracker[Function: gpuTracker]
getIsInitialLoading[Function: getIsInitialLoading]
setIsInitialLoading[Function: setIsInitialLoading]
handleObjectMove[Function: handleObjectMove]
handleObjectUpdate[Function: handleObjectUpdate]
objectVirtualizer[Function: objectVirtualizer]
invalidatePathfindingCaches[Function: invalidatePathfindingCaches]
checkObjectMovement[Function: checkObjectMovement]
cleanCaches[Function: cleanCaches]
roundForCache[Function: roundForCache]
lineIntersectsBoundingBox[Function: lineIntersectsBoundingBox]
generateCacheKey[Function: generateCacheKey]
havePositionsChanged[Function: havePositionsChanged]
checkLineIntersection[Function: checkLineIntersection]
generateCurvedPath[Function: generateCurvedPath]
checkCurveIntersections[Function: checkCurveIntersections]
generateMultiSegmentPath[Function: generateMultiSegmentPath]
precomputeCacheKey[Function: precomputeCacheKey]
getPrecomputedResult[Function: getPrecomputedResult]
computeConnectionPath[Function: computeConnectionPath]
precomputePathsBatch[Function: precomputePathsBatch]
calculateMidpoint[Function: calculateMidpoint]
calculateMidpointVector[Function: calculateMidpointVector]
lerp[Function: lerp]
checkPositionJitter[Function: checkPositionJitter]
_frameTimeTracker[Function: _frameTimeTracker]
_resetForNextFrame[Function: _resetForNextFrame]
acquireBudget[Function: acquireBudget]
setFrameBudget[Function: setFrameBudget]
getFrameBudget[Function: getFrameBudget]
notifyCameraMove[Function: notifyCameraMove]
isCameraMoving[Function: isCameraMoving]
isCameraMovingRapidly[Function: isCameraMovingRapidly]
isFrameBudgetExhausted[Function: isFrameBudgetExhausted]
getSmoothedFrameTime[Function: getSmoothedFrameTime]
calculateAxisSnap[Function: calculateAxisSnap]
distanceToAxis[Function: distanceToAxis]
projectPointOntoAxis[Function: projectPointOntoAxis]
createStreamlinedSpatialIndex[Function: createStreamlinedSpatialIndex]
benchmarkStreamlined[Function: benchmarkStreamlined]
isOffscreenCanvasTextSupported[Function: isOffscreenCanvasTextSupported]
_switchToSyncAtlas[Function: _switchToSyncAtlas]
getGlobalTextAtlas[Function: getGlobalTextAtlas]
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
createAtlasTextMesh[Function: createAtlasTextMesh]
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
loadTextureFromBlob[Function: loadTextureFromBlob]
throttle[Function: throttle]
debounce[Function: debounce]
measurePerformance[Function: measurePerformance]
scheduleWork[Function: scheduleWork]
memoize[Function: memoize]
trackLCP[Function: trackLCP]
cleanObject[Function: cleanObject]
validateRequiredProperties[Function: validateRequiredProperties]
validateObjectSchema[Function: validateObjectSchema]
isValidPosition[Function: isValidPosition]
validatePosition[Function: validatePosition]
validatePositionBounds[Function: validatePositionBounds]
validateConnectionData[Function: validateConnectionData]
validateIndicator[Function: validateIndicator]
validateFile[Function: validateFile]
validateObjectId[Function: validateObjectId]
validateSpaceId[Function: validateSpaceId]
validateUserId[Function: validateUserId]
validateUrl[Function: validateUrl]
validateEmail[Function: validateEmail]
validateArray[Function: validateArray]
validateMultiple[Function: validateMultiple]
ValidationUtils[Function: ValidationUtils]
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

%% Services
SpatialHash((Service: SpatialHash))
CentralizedBroadcastManager((Service: CentralizedBroadcastManager))
GlobalOptimizationCoordinator((Service: GlobalOptimizationCoordinator))
MarkdownDiagramService((Service: MarkdownDiagramService))
ResourceCleanupService((Service: ResourceCleanupService))
ScreenRecordingService((Service: ScreenRecordingService))
StreamlinedSpatialManager((Service: StreamlinedSpatialManager))
UnifiedCacheManager((Service: UnifiedCacheManager))
BroadcastSession((Service: BroadcastSession))
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

%% External Libraries
@eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint-plugin-react<Library: eslint-plugin-react>
eslint-plugin-react-hooks<Library: eslint-plugin-react-hooks>
eslint-plugin-react-refresh<Library: eslint-plugin-react-refresh>
firebase-admin/app<Library: firebase-admin/app>
firebase-admin/auth<Library: firebase-admin/auth>
firebase-admin/firestore<Library: firebase-admin/firestore>
firebase-functions/v2/https<Library: firebase-functions/v2/https>
firebase-functions/params<Library: firebase-functions/params>
puppeteer-core<Library: puppeteer-core>
@sparticuz/chromium<Library: @sparticuz/chromium>
express<Library: express>
cors<Library: cors>
dotenv<Library: dotenv>
react<Library: react>
@react-three/fiber<Library: @react-three/fiber>
@react-three/postprocessing<Library: @react-three/postprocessing>
@react-three/drei/core/Stats<Library: @react-three/drei/core/Stats>
lodash/isEqual<Library: lodash/isEqual>
@react-three/drei<Library: @react-three/drei>
three<Library: three>
react-colorful<Library: react-colorful>
zustand/shallow<Library: zustand/shallow>
@xyflow/react<Library: @xyflow/react>
@xyflow/react/dist/style.css<Library: @xyflow/react/dist/style.css>
three/examples/jsm/loaders/GLTFLoader<Library: three/examples/jsm/loaders/GLTFLoader>
three/examples/jsm/loaders/DRACOLoader<Library: three/examples/jsm/loaders/DRACOLoader>
firebase/database<Library: firebase/database>
firebase/auth<Library: firebase/auth>
firebase/firestore<Library: firebase/firestore>
firebase/app<Library: firebase/app>
firebase/storage<Library: firebase/storage>
firebase/functions<Library: firebase/functions>
zustand<Library: zustand>
prop-types<Library: prop-types>
draft-js<Library: draft-js>
draft-js/dist/Draft.css<Library: draft-js/dist/Draft.css>
react-dom/client<Library: react-dom/client>
@babel/parser<Library: @babel/parser>
3d-ast-generator<Library: 3d-ast-generator>
fix-webm-duration<Library: fix-webm-duration>
uuid<Library: uuid>
zustand/traditional<Library: zustand/traditional>
comlink<Library: comlink>
vite<Library: vite>
@vitejs/plugin-react<Library: @vitejs/plugin-react>
vite-plugin-glsl<Library: vite-plugin-glsl>
vite-plugin-wasm<Library: vite-plugin-wasm>

%% Component Internal Functions
diagramoverlay2dFlowPathNames[Function: diagramoverlay2dFlowPathNames]
diagramoverlay2dSerialisedGraphData[Function: diagramoverlay2dSerialisedGraphData]
diagramoverlay2dSerialisedHierarchy[Function: diagramoverlay2dSerialisedHierarchy]
diagramoverlay2dFilteredEdges[Function: diagramoverlay2dFilteredEdges]
diagramoverlay2dToggleLayer[Function: diagramoverlay2dToggleLayer]
diagramoverlay2dToggleLayerHandlers[Function: diagramoverlay2dToggleLayerHandlers]
diagramoverlay2dHandleNodeClick[Function: diagramoverlay2dHandleNodeClick]
diagramoverlay2dHandleBackTo3D[Function: diagramoverlay2dHandleBackTo3D]
textstyleuicontentHandleSizeChange[Function: textstyleuicontentHandleSizeChange]
textstyleuicontentHandleFontSizeInputChange[Function: textstyleuicontentHandleFontSizeInputChange]
textstyleuicontentHandleWheel[Function: textstyleuicontentHandleWheel]
textstyleuicontentHandleButtonClick[Function: textstyleuicontentHandleButtonClick]
textstyleuicontentHandleColorSelect[Function: textstyleuicontentHandleColorSelect]
textstyleuicontentHandleSelectChange[Function: textstyleuicontentHandleSelectChange]
textstyleuicontentGetUIScale[Function: textstyleuicontentGetUIScale]
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

%% Component-Function Relationships
DiagramOverlay2D -.-> diagramoverlay2dFlowPathNames : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedGraphData : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedHierarchy : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dFilteredEdges : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayer : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayerHandlers : "render helper"
DiagramOverlay2D -.-> diagramoverlay2dHandleNodeClick : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dHandleBackTo3D : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleSizeChange : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleFontSizeInputChange : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleWheel : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleButtonClick : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleColorSelect : "internal function"
TextStyleUIContent -.-> textstyleuicontentHandleSelectChange : "internal function"
TextStyleUIContent -.-> textstyleuicontentGetUIScale : "getter function"
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

%% File Container Nodes
index[Function: index]
AtlasTextSprite[Function: AtlasTextSprite]
BatchedCurvedLines[Function: BatchedCurvedLines]
BVHIntegration_file[Function: BVHIntegration]
CellBoundaryRenderer[Function: CellBoundaryRenderer]
ConnectionsRenderer[Function: ConnectionsRenderer]
cubeHelpers[Function: cubeHelpers]
EdgeTypes[Function: EdgeTypes]
NodeTypes[Function: NodeTypes]
DiagramOverlay2D_file[Function: DiagramOverlay2D]
FrameloopController_file[Function: FrameloopController]
FrameTicker_file[Function: FrameTicker]
GlobalCubeEdgesRenderer[Function: GlobalCubeEdgesRenderer]
GlobalDodecahedronEdgesRenderer[Function: GlobalDodecahedronEdgesRenderer]
GlobalTetrahedronEdgesRenderer[Function: GlobalTetrahedronEdgesRenderer]
TextStyleUI[Function: TextStyleUI]
firebase[Function: firebase]
useAuth_file[Function: useAuth]
useAuthState_file[Function: useAuthState]
useCentralizedBroadcastManager_file[Function: useCentralizedBroadcastManager]
useConnectionAnimationManager[Function: useConnectionAnimationManager]
useConnectionObjects_file[Function: useConnectionObjects]
useConnections_file[Function: useConnections]
useConnectionsRendererStore_file[Function: useConnectionsRendererStore]
useDebouncedUpdate_file[Function: useDebouncedUpdate]
useFrustumCulling[Function: useFrustumCulling]
useGlobalClickHandler_file[Function: useGlobalClickHandler]
useIndicators_file[Function: useIndicators]
useObjects_file[Function: useObjects]
useSpaceManager_file[Function: useSpaceManager]
useSpatialManager_file[Function: useSpatialManager]
useTextureUpdater_file[Function: useTextureUpdater]
useTimeoutManager_file[Function: useTimeoutManager]
CreateOrganizationPopup_file[Function: CreateOrganizationPopup]
CreateSpacePopup_file[Function: CreateSpacePopup]
OrganizationManager_file[Function: OrganizationManager]
OrgMemberDropdown_file[Function: OrgMemberDropdown]
ShareSpacePopup_file[Function: ShareSpacePopup]
SpacesTable_file[Function: SpacesTable]
UserLoginSection_file[Function: UserLoginSection]
WelcomeOverlay_file[Function: WelcomeOverlay]
useWindowSize_file[Function: useWindowSize]
LandingApp_file[Function: LandingApp]
Loader_file[Function: Loader]
Order[Function: Order]
sharedSpacesService[Function: sharedSpacesService]
Volspace[Function: Volspace]
authService[Function: authService]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
connectionPositionResolver[Function: connectionPositionResolver]
connectionsService[Function: connectionsService]
githubRepoService[Function: githubRepoService]
globalOptimizationCoordinator[Function: globalOptimizationCoordinator]
globalSubscriptionManager[Function: globalSubscriptionManager]
connectionMethods_file[Function: connectionMethods]
constants[Function: constants]
containerMethods_file[Function: containerMethods]
hierarchyMethods_file[Function: hierarchyMethods]
objectMethods_file[Function: objectMethods]
positionMethods_file[Function: positionMethods]
processMethods_file[Function: processMethods]
scaleMethods_file[Function: scaleMethods]
markdownDiagramService_file[Function: markdownDiagramService]
organizationService[Function: organizationService]
presenceService[Function: presenceService]
resourceCleanupService_file[Function: resourceCleanupService]
runtimeScanService[Function: runtimeScanService]
screenRecordingService[Function: screenRecordingService]
sharingService[Function: sharingService]
spacesService[Function: spacesService]
spatialObjectsService[Function: spatialObjectsService]
spatialPartitioning[Function: spatialPartitioning]
storageService[Function: storageService]
streamlinedSpatialPartitioning[Function: streamlinedSpatialPartitioning]
unifiedCacheManager[Function: unifiedCacheManager]
webRservice[Function: webRservice]
connectionStore[Function: connectionStore]
cubeStore[Function: cubeStore]
lodStore[Function: lodStore]
storeUtils[Function: storeUtils]
uiOverlayStore[Function: uiOverlayStore]
animationUtils[Function: animationUtils]
bvhRaycasting[Function: bvhRaycasting]
connectionUtils[Function: connectionUtils]
debugUtils[Function: debugUtils]
faceIndicatorUtils[Function: faceIndicatorUtils]
facePositionUtils[Function: facePositionUtils]
frameCounter_file[Function: frameCounter]
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
AtlasTextSprite -.-> getSharedMaterial : "contains"
BatchedCurvedLines -.-> numericCacheKey : "contains"
BatchedCurvedLines -.-> pathToSegments : "contains"
BVHIntegration_file -.-> BVHIntegration : "contains"
CellBoundaryRenderer -.-> computeVisibleCells : "contains"
ConnectionsRenderer -.-> getTextParametricT : "contains"
ConnectionsRenderer -.-> redistributeFaces : "contains"
ConnectionsRenderer -.-> pathToLineSegments : "contains"
ConnectionsRenderer -.-> resolveEndpointPosition : "contains"
cubeHelpers -.-> faceMaterialProps : "contains"
cubeHelpers -.-> getFaceIndicatorProps : "contains"
cubeHelpers -.-> faces : "contains"
cubeHelpers -.-> calculateFaceWorldPosition : "contains"
EdgeTypes -.-> flowPathColor : "contains"
EdgeTypes -.-> getEdgeStyle : "contains"
EdgeTypes -.-> getMarkerEnd : "contains"
EdgeTypes -.-> getSelectedStyle : "contains"
EdgeTypes -.-> getUnselectedStyle : "contains"
EdgeTypes -.-> MerfolkEdge : "contains"
EdgeTypes -.-> EdgeMarkerDefs : "contains"
EdgeTypes -.-> MerfolkEdgeMemo : "contains"
EdgeTypes -.-> customEdgeTypes : "contains"
NodeTypes -.-> buildNodeStyles : "contains"
NodeTypes -.-> buildContainerStyles : "contains"
NodeTypes -.-> buildPrecomputedNode : "contains"
NodeTypes -.-> MerfolkNode : "contains"
NodeTypes -.-> ContainerNode : "contains"
NodeTypes -.-> MerfolkNodeMemo : "contains"
NodeTypes -.-> ContainerNodeMemo : "contains"
NodeTypes -.-> customNodeTypes : "contains"
DiagramOverlay2D_file -.-> buildReactFlowNodes : "contains"
DiagramOverlay2D_file -.-> buildReactFlowEdges : "contains"
DiagramOverlay2D_file -.-> layerForType : "contains"
DiagramOverlay2D_file -.-> filterEdges : "contains"
DiagramOverlay2D_file -.-> minimapNodeColor : "contains"
DiagramOverlay2D_file -.-> DiagramOverlay2D : "contains"
FrameloopController_file -.-> FrameloopController : "contains"
FrameTicker_file -.-> FrameTicker : "contains"
GlobalCubeEdgesRenderer -.-> cubeTransformMap : "contains"
GlobalDodecahedronEdgesRenderer -.-> dodecahedronTransformMap : "contains"
GlobalTetrahedronEdgesRenderer -.-> tetrahedronTransformMap : "contains"
TextStyleUI -.-> TextStyleUIContent : "contains"
firebase -.-> isValidFirebaseConfig : "contains"
useAuth_file -.-> useAuth : "contains"
useAuthState_file -.-> useAuthState : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
useConnections_file -.-> useConnections : "contains"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore_file -.-> useConnectionState : "contains"
useConnectionsRendererStore_file -.-> useConnectionActions : "contains"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useFrustumCulling -.-> isPointInFrustum : "contains"
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> SpatialHash : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
useIndicators_file -.-> useIndicators : "contains"
useObjects_file -.-> useObjects : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
useSpatialManager_file -.-> useSpatialManager : "contains"
useTextureUpdater_file -.-> useTextureUpdater : "contains"
useTimeoutManager_file -.-> useTimeoutManager : "contains"
CreateOrganizationPopup_file -.-> CreateOrganizationPopup : "contains"
CreateSpacePopup_file -.-> CreateSpacePopup : "contains"
OrganizationManager_file -.-> OrganizationManager : "contains"
OrgMemberDropdown_file -.-> OrgMemberDropdown : "contains"
ShareSpacePopup_file -.-> ShareSpacePopup : "contains"
SpacesTable_file -.-> SpacesTable : "contains"
UserLoginSection_file -.-> UserLoginSection : "contains"
WelcomeOverlay_file -.-> WelcomeOverlay : "contains"
useWindowSize_file -.-> useWindowSize : "contains"
LandingApp_file -.-> LandingApp : "contains"
Loader_file -.-> Loader : "contains"
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
globalSubscriptionManager -.-> SUBSCRIPTION_TYPES : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> generateSubscriptionKey : "contains"
connectionMethods_file -.-> connectionMethods : "contains"
constants -.-> NODE_TYPE_COMPONENT : "contains"
constants -.-> NODE_TYPE_FUNCTION : "contains"
constants -.-> NODE_TYPE_STORE : "contains"
constants -.-> NODE_TYPE_SERVICE : "contains"
constants -.-> NODE_TYPE_LIBRARY : "contains"
constants -.-> NODE_TYPE_UTILITY : "contains"
constants -.-> NODE_TYPE_DATAPATH : "contains"
constants -.-> NODE_TYPE_HANDLER : "contains"
constants -.-> NODE_TYPE_CONTROL : "contains"
constants -.-> NODE_TYPE_STATE : "contains"
constants -.-> NODE_TYPE_DATA : "contains"
constants -.-> NODE_TYPE_HOOK : "contains"
constants -.-> NODE_TYPE_MODULE : "contains"
constants -.-> NODE_TYPE_CLASS : "contains"
constants -.-> NODE_TYPE_INTERFACE : "contains"
constants -.-> NODE_TYPE_VARIABLE : "contains"
constants -.-> NODE_TYPE_CONSTANT : "contains"
constants -.-> OBJECT_TYPE_CUBE : "contains"
constants -.-> OBJECT_TYPE_DODECAHEDRON : "contains"
constants -.-> OBJECT_TYPE_TETRAHEDRON : "contains"
constants -.-> UI_COMPONENTS : "contains"
constants -.-> MAX_RECURSION_DEPTH : "contains"
constants -.-> BASE_DODECAHEDRON_SIZE : "contains"
constants -.-> BASE_DODECAHEDRON_RADIUS : "contains"
constants -.-> DEFAULT_CAMERA_DISTANCE : "contains"
constants -.-> SPACING_BETWEEN_COMPONENTS : "contains"
constants -.-> DEFAULT_CUBE_SIZE : "contains"
constants -.-> DEFAULT_SPHERE_SIZE : "contains"
constants -.-> DEFAULT_CONTAINER_SIZE : "contains"
constants -.-> MIN_SCALE_FACTOR : "contains"
constants -.-> DESIRED_GAP : "contains"
constants -.-> GROUP_CONTAINER_COLORS : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
containerMethods_file -.-> containerMethods : "contains"
hierarchyMethods_file -.-> hierarchyMethods : "contains"
objectMethods_file -.-> objectMethods : "contains"
positionMethods_file -.-> positionMethods : "contains"
processMethods_file -.-> processMethods : "contains"
scaleMethods_file -.-> scaleMethods : "contains"
markdownDiagramService_file -.-> MarkdownDiagramService : "contains"
markdownDiagramService_file -.-> markdownDiagramService : "contains"
organizationService -.-> PLAN_LIMITS : "contains"
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
resourceCleanupService_file -.-> ResourceCleanupService : "contains"
resourceCleanupService_file -.-> resourceCleanupService : "contains"
runtimeScanService -.-> validateScanUrl : "contains"
runtimeScanService -.-> generateMerfolkFromRuntimeTrace : "contains"
runtimeScanService -.-> scanWebsiteAndGenerateDiagram : "contains"
screenRecordingService -.-> ScreenRecordingService : "contains"
screenRecordingService -.-> screenRecorder : "contains"
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
spatialPartitioning -.-> CELL_SIZE : "contains"
spatialPartitioning -.-> CELL_NEIGHBOR_RADIUS : "contains"
spatialPartitioning -.-> CELL_UNLOAD_DISTANCE : "contains"
spatialPartitioning -.-> CELL_BOUNDARY_HYSTERESIS : "contains"
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
unifiedCacheManager -.-> cellExistenceCache : "contains"
unifiedCacheManager -.-> connectionCache : "contains"
unifiedCacheManager -.-> objectsCache : "contains"
unifiedCacheManager -.-> memoizationCache : "contains"
webRservice -.-> initWebRTC : "contains"
webRservice -.-> BroadcastSession : "contains"
webRservice -.-> startBroadcasting : "contains"
webRservice -.-> joinBroadcast : "contains"
webRservice -.-> isPlaneBeingBroadcast : "contains"
webRservice -.-> findAvailableBroadcasts : "contains"
webRservice -.-> cleanupWebRTC : "contains"
webRservice -.-> registerUserPresence : "contains"
webRservice -.-> subscribeToUsersInSpace : "contains"
connectionStore -.-> _buildConnectionsByObjectId : "contains"
cubeStore -.-> getCubeSelector : "contains"
cubeStore -.-> getCubeFaceColorSelector : "contains"
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
cubeStore -.-> getCubeFaceStateSelector : "contains"
lodStore -.-> LOD_THRESHOLDS : "contains"
lodStore -.-> LOD_THRESHOLDS_SQ : "contains"
lodStore -.-> LOD_THRESHOLDS_PARENT : "contains"
lodStore -.-> LOD_THRESHOLDS_PARENT_SQ : "contains"
lodStore -.-> LOD_LEVELS : "contains"
lodStore -.-> calculateLODLevel : "contains"
lodStore -.-> calculateParentLODLevel : "contains"
lodStore -.-> FACE_TEXT_DISTANCE : "contains"
lodStore -.-> FACE_TEXT_DISTANCE_SQ : "contains"
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
debugUtils -.-> ANIMATION_DEBUG : "contains"
debugUtils -.-> logAnimation : "contains"
debugUtils -.-> forceAnimateConnection : "contains"
debugUtils -.-> shouldAnimateConnection : "contains"
debugUtils -.-> recordFrameTime : "contains"
debugUtils -.-> recordStateUpdate : "contains"
debugUtils -.-> getPerfStats : "contains"
debugUtils -.-> resetPerfStats : "contains"
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
facePositionUtils -.-> calculateFacePosition : "contains"
frameCounter_file -.-> FrameCounter : "contains"
frameCounter_file -.-> frameCounter : "contains"
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
unifiedValidationUtils -.-> ValidationUtils : "contains"
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

%% Component Relationships
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
LandingApp --> OrderHeader : "windowSize"

%% Component Dependencies
DiagramOverlay2D --> useDiagramStore : "uses store"
useDiagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
useDiagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
useDiagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
useDiagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
useDiagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
useDiagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
useDiagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> useUIOverlayStore : "uses store"
useUIOverlayStore --> useUIOverlayStore : "receives"
DiagramOverlay2D --> useNodesState : "uses hook"
useNodesState --> useNodesState : "receives"
TextStyleUIContent --> useColorPickerStore : "uses store"
useColorPickerStore --> useColorPickerStore : "receives"
TextStyleUIContent --> useColorPickerStore : "uses store"
useColorPickerStore --> useColorPickerStore : "receives"
TextStyleUIContent --> useColorPickerStore : "uses store"
useColorPickerStore --> useColorPickerStore : "receives"
LandingApp --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize : "receives"
OrderHeader --> useThree : "{viewport}"
useThree --> useThree : "receives"
Model --> useGLTF : "{nodes, materials}"
useGLTF --> useGLTF : "receives"

%% Function Call Relationships
scanJsBundles --> index : "calls extractSourceMapUrl"
index --> extractSourceMapUrl : "receives"
scanJsBundles --> index : "calls scanOriginalSource"
index --> scanOriginalSource : "receives"
scanJsBundles --> index : "calls extractNamesFromSourceMap"
index --> extractNamesFromSourceMap : "receives"
captureRuntimeTrace --> index : "calls scanJsBundles"
index --> scanJsBundles : "receives"
captureRuntimeTrace --> index : "calls deduplicateApiCalls"
index --> deduplicateApiCalls : "receives"
captureRuntimeTrace --> index : "calls buildConnections"
index --> buildConnections : "receives"
createScanWebsiteRuntimeApp --> index : "calls validateRuntimeScanUrl"
index --> validateRuntimeScanUrl : "receives"
createScanWebsiteRuntimeApp --> index : "calls captureRuntimeTrace"
index --> captureRuntimeTrace : "receives"
createScanWebsiteRuntimeApp --> runtimeScanService : "calls generateMerfolkFromRuntimeTrace"
runtimeScanService --> generateMerfolkFromRuntimeTrace : "receives"
computeVisibleCells --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
resolveEndpointPosition --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
getEdgeStyle --> EdgeTypes : "calls flowPathColor"
EdgeTypes --> flowPathColor : "receives"
MerfolkEdge --> EdgeTypes : "calls getEdgeStyle"
EdgeTypes --> getEdgeStyle : "receives"
MerfolkEdge --> EdgeTypes : "calls getSelectedStyle"
EdgeTypes --> getSelectedStyle : "receives"
MerfolkEdge --> EdgeTypes : "calls getUnselectedStyle"
EdgeTypes --> getUnselectedStyle : "receives"
MerfolkEdge --> EdgeTypes : "calls getEdgeStyle"
EdgeTypes --> getEdgeStyle : "receives"
MerfolkEdge --> EdgeTypes : "calls getSelectedStyle"
EdgeTypes --> getSelectedStyle : "receives"
MerfolkEdge --> EdgeTypes : "calls getUnselectedStyle"
EdgeTypes --> getUnselectedStyle : "receives"
buildPrecomputedNode --> NodeTypes : "calls buildNodeStyles"
NodeTypes --> buildNodeStyles : "receives"
filterEdges --> DiagramOverlay2D_file : "calls layerForType"
DiagramOverlay2D_file --> layerForType : "receives"
DiagramOverlay2D --> diagramLayoutWorkerClient : "calls getDiagramLayoutWorker"
diagramLayoutWorkerClient --> getDiagramLayoutWorker : "receives"
DiagramOverlay2D --> DiagramOverlay2D_file : "calls buildReactFlowNodes"
DiagramOverlay2D_file --> buildReactFlowNodes : "receives"
DiagramOverlay2D --> DiagramOverlay2D_file : "calls buildReactFlowEdges"
DiagramOverlay2D_file --> buildReactFlowEdges : "receives"
DiagramOverlay2D --> DiagramOverlay2D_file : "calls filterEdges"
DiagramOverlay2D_file --> filterEdges : "receives"
DiagramOverlay2D --> diagramLayoutWorkerClient : "calls getDiagramLayoutWorker"
diagramLayoutWorkerClient --> getDiagramLayoutWorker : "receives"
DiagramOverlay2D --> DiagramOverlay2D_file : "calls buildReactFlowNodes"
DiagramOverlay2D_file --> buildReactFlowNodes : "receives"
DiagramOverlay2D --> DiagramOverlay2D_file : "calls buildReactFlowEdges"
DiagramOverlay2D_file --> buildReactFlowEdges : "receives"
DiagramOverlay2D --> DiagramOverlay2D_file : "calls filterEdges"
DiagramOverlay2D_file --> filterEdges : "receives"
useConnections --> loadingState : "calls getIsInitialLoading"
loadingState --> getIsInitialLoading : "receives"
useConnections --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections --> loadingState : "calls getIsInitialLoading"
loadingState --> getIsInitialLoading : "receives"
useConnections --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
isConnectionVisible --> spatialIndexWorker : "calls isPointInFrustum"
spatialIndexWorker --> isPointInFrustum : "receives"
isConnectionVisible --> spatialIndexWorker : "calls isPointInFrustum"
spatialIndexWorker --> isPointInFrustum : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> authService : "calls signOut"
authService --> signOut : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> authService : "calls signOut"
authService --> signOut : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
removeAllSharedReferences --> sharedSpacesService : "calls removeSharedSpaceReference"
sharedSpacesService --> removeSharedSpaceReference : "receives"
flushSaveBatch --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
flushSaveBatch --> spatialPartitioning : "calls getCellId"
spatialPartitioning --> getCellId : "receives"
flushSaveBatch --> spatialPartitioning : "calls addObjectToCell"
spatialPartitioning --> addObjectToCell : "receives"
checkObjectMovement --> pathfindingUtils : "calls roundForCache"
pathfindingUtils --> roundForCache : "receives"
generateCacheKey --> pathfindingUtils : "calls roundForCache"
pathfindingUtils --> roundForCache : "receives"
generateCacheKey --> pathfindingUtils : "calls roundForCache"
pathfindingUtils --> roundForCache : "receives"
checkLineIntersection --> pathfindingUtils : "calls cleanCaches"
pathfindingUtils --> cleanCaches : "receives"
checkLineIntersection --> pathfindingUtils : "calls generateCacheKey"
pathfindingUtils --> generateCacheKey : "receives"
generateCurvedPath --> pathfindingUtils : "calls generateCacheKey"
pathfindingUtils --> generateCacheKey : "receives"
generateCurvedPath --> pathfindingUtils : "calls lineIntersectsBoundingBox"
pathfindingUtils --> lineIntersectsBoundingBox : "receives"
generateCurvedPath --> pathfindingUtils : "calls generateMultiSegmentPath"
pathfindingUtils --> generateMultiSegmentPath : "receives"
generateCurvedPath --> pathfindingUtils : "calls checkCurveIntersections"
pathfindingUtils --> checkCurveIntersections : "receives"
precomputeCacheKey --> pathfindingUtils : "calls roundForCache"
pathfindingUtils --> roundForCache : "receives"
precomputeCacheKey --> pathfindingUtils : "calls roundForCache"
pathfindingUtils --> roundForCache : "receives"
getPrecomputedResult --> pathfindingUtils : "calls precomputeCacheKey"
pathfindingUtils --> precomputeCacheKey : "receives"
computeConnectionPath --> pathfindingUtils : "calls getPrecomputedResult"
pathfindingUtils --> getPrecomputedResult : "receives"
computeConnectionPath --> pathfindingUtils : "calls checkLineIntersection"
pathfindingUtils --> checkLineIntersection : "receives"
computeConnectionPath --> pathfindingUtils : "calls generateCurvedPath"
pathfindingUtils --> generateCurvedPath : "receives"
precomputePathsBatch --> pathfindingWorkerClient : "calls getPathfindingWorker"
pathfindingWorkerClient --> getPathfindingWorker : "receives"
precomputePathsBatch --> pathfindingUtils : "calls precomputeCacheKey"
pathfindingUtils --> precomputeCacheKey : "receives"
isCameraMovingRapidly --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
benchmarkStreamlined --> streamlinedSpatialIndex : "calls createStreamlinedSpatialIndex"
streamlinedSpatialIndex --> createStreamlinedSpatialIndex : "receives"
getGlobalTextAtlas --> textAtlas : "calls isOffscreenCanvasTextSupported"
textAtlas --> isOffscreenCanvasTextSupported : "receives"
createAtlasTextMesh --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
filterConnections --> diagramLayoutWorker : "calls isHierarchyConnection"
diagramLayoutWorker --> isHierarchyConnection : "receives"
filterConnections --> diagramLayoutWorker : "calls isHierarchyConnection"
diagramLayoutWorker --> isHierarchyConnection : "receives"
layoutNodes --> diagramLayoutWorker : "calls estimateNodeSize"
diagramLayoutWorker --> estimateNodeSize : "receives"
layoutNodes --> diagramLayoutWorker : "calls estimateNodeSize"
diagramLayoutWorker --> estimateNodeSize : "receives"
layoutEdges --> diagramLayoutWorker : "calls filterConnections"
diagramLayoutWorker --> filterConnections : "receives"

%% Classes
SpatialHash[[Class: SpatialHash]]
CentralizedBroadcastManager[[Class: CentralizedBroadcastManager]]
GlobalOptimizationCoordinator[[Class: GlobalOptimizationCoordinator]]
MarkdownDiagramService[[Class: MarkdownDiagramService]]
ResourceCleanupService[[Class: ResourceCleanupService]]
ScreenRecordingService[[Class: ScreenRecordingService]]
StreamlinedSpatialManager[[Class: StreamlinedSpatialManager]]
UnifiedCacheManager[[Class: UnifiedCacheManager]]
BroadcastSession[[Class: BroadcastSession]]
BVHNode[[Class: BVHNode]]
BVHAcceleratedRaycaster[[Class: BVHAcceleratedRaycaster]]
FrameCounter[[Class: FrameCounter]]
GPUResourceTracker[[Class: GPUResourceTracker]]
ObjectVirtualizer[[Class: ObjectVirtualizer]]
Point3D[[Class: Point3D]]
BoundingBox[[Class: BoundingBox]]
OptimizedSpatialGrid[[Class: OptimizedSpatialGrid]]
TextAtlas[[Class: TextAtlas]]
MultiPageTextAtlas[[Class: MultiPageTextAtlas]]
WorkerMultiPageTextAtlas[[Class: WorkerMultiPageTextAtlas]]
LayoutEngine[[Class: LayoutEngine]]
AtlasPage[[Class: AtlasPage]]

%% Worker Modules
diagramLayoutWorker[Worker: diagramLayoutWorker]
diagramLayoutWorkerClient[Worker: diagramLayoutWorkerClient]
markdownLayoutWorker[Worker: markdownLayoutWorker]
markdownLayoutWorkerClient[Worker: markdownLayoutWorkerClient]
pathfindingWorkerClient[Worker: pathfindingWorkerClient]
spatialIndexWorker[Worker: spatialIndexWorker]
spatialIndexWorkerClient[Worker: spatialIndexWorkerClient]
textAtlasWorker[Worker: textAtlasWorker]
textAtlasWorkerClient[Worker: textAtlasWorkerClient]

%% Store Usage Details
DiagramOverlay2D --> useDiagramStore : "{graphs, hierarchy, connectionTags, setLayout2D, nodeToObjectIdMap, selectedNodeId, setSelectedNodeId}"
DiagramOverlay2D --> useUIOverlayStore : "{setViewMode}"
TextStyleUIContent --> useColorPickerStore : "{openColorPicker, closeColorPicker}"

```