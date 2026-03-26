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
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
Cube{Component: Cube}
CubeFace{Component: CubeFace}
CustomCamera{Component: CustomCamera}
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
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

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
Connection -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"

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
getFileStem[Function: getFileStem]
addToSet[Function: addToSet]
addToFileContainer[Function: addToFileContainer]
isNonLiteralInit[Function: isNonLiteralInit]
classifyName[Function: classifyName]
detectEventEmitterCreation[Function: detectEventEmitterCreation]
detectEventListenerRegistration[Function: detectEventListenerRegistration]
detectDbModelCreation[Function: detectDbModelCreation]
extractObjectKeys[Function: extractObjectKeys]
detectAuthGuardPattern[Function: detectAuthGuardPattern]
detectApiEndpointRegistration[Function: detectApiEndpointRegistration]
processVanillaNode[Function: processVanillaNode]
traverseVanillaAST[Function: traverseVanillaAST]
unwrapToFunction[Function: unwrapToFunction]
getInternalFunctionLabel[Function: getInternalFunctionLabel]
collectContainedComponents[Function: collectContainedComponents]
walkNodeForJSX[Function: walkNodeForJSX]
deepWalkForCallSites[Function: deepWalkForCallSites]
analyzeComponentBody[Function: analyzeComponentBody]
processReactDecl[Function: processReactDecl]
traverseReactAST[Function: traverseReactAST]
deriveNextjsRoutePath[Function: deriveNextjsRoutePath]
buildNextjsRouteMap[Function: buildNextjsRouteMap]
classifyPython[Function: classifyPython]
traversePythonSource[Function: traversePythonSource]
extractPythonModelFields[Function: extractPythonModelFields]
parseJS[Function: parseJS]
traverseVueSource[Function: traverseVueSource]
extractShaderSymbols[Function: extractShaderSymbols]
analyzeFile[Function: analyzeFile]
containsJSX[Function: containsJSX]
generateRoutedConnection[Function: generateRoutedConnection]
generateMerfolkMarkdown[Function: generateMerfolkMarkdown]
walkDir[Function: walkDir]
fileExists[Function: fileExists]
readPackageJson[Function: readPackageJson]
getDeps[Function: getDeps]
getProdDeps[Function: getProdDeps]
detectRepoType[Function: detectRepoType]
getFileType[Function: getFileType]
scanWorkspace[Function: scanWorkspace]
getSharedMaterial[Function: getSharedMaterial]
numericCacheKey[Function: numericCacheKey]
pathToSegments[Function: pathToSegments]
computeVisibleCells[Function: computeVisibleCells]
getTextParametricT[Function: getTextParametricT]
redistributeFaces[Function: redistributeFaces]
pathToLineSegments[Function: pathToLineSegments]
resolveEndpointPosition[Function: resolveEndpointPosition]
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
layerForType[Function: layerForType]
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
isPointInFrustum[Function: isPointInFrustum]
getSpatialIndexWorker[Function: getSpatialIndexWorker]
terminateSpatialIndexWorker[Function: terminateSpatialIndexWorker]
getKey[Function: getKey]
addPage[Function: addPage]
getTextAtlasWorker[Function: getTextAtlasWorker]
terminateTextAtlasWorker[Function: terminateTextAtlasWorker]

%% Hooks
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
useWindowSize[Function: useWindowSize]

%% Internal Hooks (same name as parent)
useAuth_file -.-> useAuth : "internal hook"
useAuthState_file -.-> useAuthState : "internal hook"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "internal hook"
useConnectionObjects_file -.-> useConnectionObjects : "internal hook"
useConnections_file -.-> useConnections : "internal hook"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "internal hook"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "internal hook"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "internal hook"
useIndicators_file -.-> useIndicators : "internal hook"
useObjects_file -.-> useObjects : "internal hook"
useSpaceManager_file -.-> useSpaceManager : "internal hook"
useSpatialManager_file -.-> useSpatialManager : "internal hook"
useTextureUpdater_file -.-> useTextureUpdater : "internal hook"
useTimeoutManager_file -.-> useTimeoutManager : "internal hook"
useWindowSize_file -.-> useWindowSize : "internal hook"

%% Services
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
getOrCreateSubscription[Function: getOrCreateSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
markdownDiagramService[Function: markdownDiagramService]
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
initWebRTC[Function: initWebRTC]
startBroadcasting[Function: startBroadcasting]
joinBroadcast[Function: joinBroadcast]
isPlaneBeingBroadcast[Function: isPlaneBeingBroadcast]
findAvailableBroadcasts[Function: findAvailableBroadcasts]
cleanupWebRTC[Function: cleanupWebRTC]
registerUserPresence[Function: registerUserPresence]
subscribeToUsersInSpace[Function: subscribeToUsersInSpace]

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

%% Utilities
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

%% Constants
MAX_EVENT_HANDLERS[Constant: MAX_EVENT_HANDLERS]
MAX_API_CALLS[Constant: MAX_API_CALLS]
ALLOWED_ORIGINS[Constant: ALLOWED_ORIGINS]
nonSourceDirPattern[Constant: nonSourceDirPattern]
pythonSignalFiles[Constant: pythonSignalFiles]
EXCLUDED_DIRS[Constant: EXCLUDED_DIRS]
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
@babel/parser<Library: @babel/parser>
fs/promises<Library: fs/promises>
path<Library: path>
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

%% Component-Function Relationships
App -.-> appObjects : "internal function"
App -.-> appCanViewSpace : "internal function"
App -.-> appShouldRedirect : "boolean check"
App -.-> appHandleSpatialObjectChange : "event handler"
App -.-> appSpatialManagerDebug : "internal function"
App -.-> appCheckPositionJitterWithHistory : "boolean check"
App -.-> appLoadedCellsKey : "internal function"
App -.-> appHandleObjectMatrixChanged : "event handler"
App -.-> appDisableOrbitControls : "boolean check"
App -.-> appEnableOrbitControls : "internal function"
App -.-> appHandleLogin : "event handler"
App -.-> appHandleObjectClick : "event handler"
App -.-> appHandleObjectMoveCallback : "event handler"
App -.-> appHandleObjectUpdateCallback : "event handler"
App -.-> appHandleFaceIndicatorClickCallback : "event handler"
App -.-> appHandleFaceClick : "event handler"
App -.-> appHandleCanvasClick : "event handler"
App -.-> appUpdateVisibleObjects : "update helper"
App -.-> appThrottledUpdateVisibility : "update helper"
App -.-> appDeviceInfo : "internal function"
App -.-> appCanvasSettings : "setter function"
AppShell -.-> appshellHandleOpenSpace : "event handler"
AppShell -.-> appshellHandleBackToLanding : "event handler"
AnimatedConnectionLine -.-> animatedconnectionlineStructuralKey : "internal function"
AtlasTextSprite -.-> atlastextspriteAtlas : "internal function"
AtlasTextSprite -.-> atlastextspriteCalculatedPosition : "calculation helper"
BatchedConnectionLines -.-> batchedconnectionlinesStraightConnections : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesCustomRaycast : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesHandleClick : "event handler"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOver : "event handler"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOut : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesPathsData : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesCustomRaycast : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesHandleClick : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOver : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOut : "event handler"
CellBoundaryRenderer -.-> cellboundaryrendererBuildGeometry : "render helper"
ColorPicker -.-> colorpickerHandleColorChange : "event handler"
ColorPicker -.-> colorpickerHandleContainerClick : "event handler"
ColorPicker -.-> colorpickerHandleApplyColor : "event handler"
ColorPicker -.-> colorpickerHandleCancel : "event handler"
Connection -.-> connectionGetLineWidth : "getter function"
Connection -.-> connectionHandleConnectionClick : "event handler"
Connection -.-> connectionHandleLineTextClick : "event handler"
Connection -.-> connectionHandleLineTextSubmit : "event handler"
Connection -.-> connectionHandleLineTextStyleChange : "event handler"
Connection -.-> connectionHandleLineStyleChange : "event handler"
Connection -.-> connectionHandleLineColorChange : "event handler"
Connection -.-> connectionConnectionData : "internal function"
Connection -.-> connectionPathData : "internal function"
Connection -.-> connectionTextPositionData : "internal function"
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
ConnectionsRenderer -.-> connectionsrendererHandleBatchedConnectionClick : "event handler"
Cube -.-> cubeCubeData : "internal function"
Cube -.-> cubeIsIndicatorConnected : "boolean check"
Cube -.-> cubeIsIndicatorActive : "boolean check"
Cube -.-> cubeGetUIPositions : "getter function"
Cube -.-> cubeShouldShowIndicator : "boolean check"
Cube -.-> cubeHasConnectedIndicators : "internal function"
Cube -.-> cubeGetFaceTextOffset : "getter function"
Cube -.-> cubeHandleSceneClick : "event handler"
Cube -.-> cubeUpdateDatabase : "update helper"
Cube -.-> cubeOnClickOutside : "internal function"
Cube -.-> cubeHandleFaceClick : "event handler"
Cube -.-> cubeHandleColoredFaceClick : "event handler"
Cube -.-> cubeHandleIndicatorClick : "event handler"
Cube -.-> cubeHandleTransformToggle : "event handler"
Cube -.-> cubeHandleResizeToggle : "event handler"
Cube -.-> cubeHandleHeaderToggle : "event handler"
Cube -.-> cubeHandleHeaderSubmit : "event handler"
Cube -.-> cubeDebouncedUpdate : "update helper"
Cube -.-> cubeHandleLineColorChange : "event handler"
Cube -.-> cubeHandleFaceColorChange : "event handler"
Cube -.-> cubeHandleTextClick : "event handler"
Cube -.-> cubeHandleFaceTextClick : "event handler"
Cube -.-> cubeHandleFaceTextSubmit : "event handler"
Cube -.-> cubeHandleFaceTextStyleClick : "event handler"
Cube -.-> cubeHandleStyleChange : "event handler"
Cube -.-> cubeHandleDrag : "event handler"
Cube -.-> cubeHandleScale : "event handler"
Cube -.-> cubeRenderFaces : "render helper"
Cube -.-> cubeRenderFaceTexts : "render helper"
CubeFace -.-> cubefaceFaceStateSelector : "internal function"
CubeFace -.-> cubefaceFaceMaterial : "internal function"
CubeFace -.-> cubefaceHandleClick : "event handler"
CubeFace -.-> cubefaceOffsetMultiplier : "setter function"
CubeFace -.-> cubefaceOffsetPosition : "setter function"
CustomCamera -.-> customcameraMemoizedTarget : "getter function"
CustomCamera -.-> customcameraControlsRefCallback : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dFlowPathNames : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedGraphData : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedHierarchy : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dFilteredEdges : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayer : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayerHandlers : "event handler"
DiagramOverlay2D -.-> diagramoverlay2dHandleNodeClick : "event handler"
DiagramOverlay2D -.-> diagramoverlay2dHandleBackTo3D : "event handler"
Sphere -.-> sphereDodecahedronData : "internal function"
Sphere -.-> sphereUpdateObjectAndStores : "update helper"
Sphere -.-> sphereUpdateFaceProperty : "update helper"
Sphere -.-> sphereIsIndicatorConnected : "boolean check"
Sphere -.-> sphereOnClickOutside : "internal function"
Sphere -.-> sphereUpdateDatabase : "update helper"
Sphere -.-> sphereHandleTransformToggle : "event handler"
Sphere -.-> sphereHandleHeaderToggle : "event handler"
Sphere -.-> sphereHandleHeaderSubmit : "event handler"
Sphere -.-> sphereHandleResizeToggle : "event handler"
Sphere -.-> sphereHandleDrag : "event handler"
Sphere -.-> sphereHandleScale : "event handler"
Sphere -.-> sphereHandleFaceClick : "event handler"
Sphere -.-> sphereHandleIndicatorClick : "event handler"
Sphere -.-> sphereHandleHeaderClick : "event handler"
Sphere -.-> sphereHandleStyleChange : "event handler"
Sphere -.-> sphereHandleLineColorChange : "event handler"
Sphere -.-> sphereHandleBackgroundClick : "event handler"
Sphere -.-> sphereHandleFaceTextSubmit : "event handler"
Sphere -.-> sphereHandleFaceTextButtonClick : "event handler"
Sphere -.-> sphereHandleFaceTextClick : "event handler"
Sphere -.-> sphereHandleFaceTextStyleChange : "event handler"
Sphere -.-> sphereGetUIPosition : "getter function"
Sphere -.-> sphereGetHeaderPosition : "getter function"
Sphere -.-> sphereGetFaceUIPosition : "getter function"
Sphere -.-> sphereGetFaceTextPosition : "getter function"
Sphere -.-> sphereGetFaceInfo : "getter function"
Sphere -.-> sphereGetFaceRotation : "getter function"
Sphere -.-> sphereShouldShowFaceIndicator : "boolean check"
Sphere -.-> sphereGetHeaderInputPosition : "getter function"
DodecahedronFace -.-> dodecahedronfaceFaceMaterial : "internal function"
DodecahedronFace -.-> dodecahedronfaceHandleClick : "event handler"
DodecahedronFace -.-> dodecahedronfaceHandleTextClick : "event handler"
DodecahedronFace -.-> dodecahedronfaceInverseScale : "internal function"
DodecahedronFace -.-> dodecahedronfaceAdjustedTextPosition : "internal function"
FaceIndicator -.-> faceindicatorMaterial : "internal function"
FaceTextInput -.-> facetextinputHandleKeyDown : "event handler"
FaceTextInput -.-> facetextinputHandleChange : "event handler"
FaceTextInput -.-> facetextinputHandleFocus : "event handler"
FaceTextInput -.-> facetextinputHandleBlur : "event handler"
FaceUI -.-> faceuiHandleBorderStyleClick : "event handler"
FaceUI -.-> faceuiHandleBorderColorClick : "event handler"
FaceUI -.-> faceuiHandleLineThicknessClick : "event handler"
FaceUI -.-> faceuiHandleColorSelect : "event handler"
FaceUI -.-> faceuiHandleToolClick : "event handler"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererFilteredCubes : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererCubeIds : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererIsCubeVisible : "render helper"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererUpdateCubeEdges : "render helper"
GlobalCubeFaceRenderer -.-> globalcubefacerendererFilteredCubes : "render helper"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererMediumCubes : "render helper"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererCubeIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererFilteredDodecahedrons : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererDodecahedronIds : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererIsDodecahedronVisible : "render helper"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererUpdateDodecahedronEdges : "render helper"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererMediumDodecahedrons : "render helper"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererDodecaIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererFilteredTetrahedrons : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererTetrahedronIds : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererIsTetrahedronVisible : "render helper"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererUpdateTetrahedronEdges : "render helper"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererMediumTetrahedrons : "render helper"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererTetraIds : "render helper"
HeaderInput -.-> headerinputHandleKeyDown : "event handler"
HeaderInput -.-> headerinputHandleChange : "event handler"
HeaderInput -.-> headerinputHandleFocus : "event handler"
HeaderInput -.-> headerinputHandleBlur : "event handler"
InstancedAtlasText -.-> instancedatlastextAtlas : "internal function"
InstancedAtlasText -.-> instancedatlastextPageGroups : "internal function"
PageInstancedMesh -.-> pageinstancedmeshGeometry : "internal function"
PageInstancedMesh -.-> pageinstancedmeshMaterial : "internal function"
PageInstancedMesh -.-> pageinstancedmeshHandleClick : "event handler"
InstancedLine -.-> instancedlineFlatPoints : "internal function"
InstancedLine -.-> instancedlineGeometry : "internal function"
InstancedLine -.-> instancedlineCustomRaycast : "internal function"
InstancedLine -.-> instancedlineMaterial : "internal function"
LineUI -.-> lineuiGetFullStyle : "getter function"
LineUI -.-> lineuiGetBaseStyle : "getter function"
LineUI -.-> lineuiHandleToolClick : "event handler"
LineUI -.-> lineuiHandleLineStyleClick : "event handler"
LineUI -.-> lineuiHandleArrowClick : "event handler"
LODManager -.-> lodmanagerContainersKey : "internal function"
LODManager -.-> lodmanagerComputeContainmentSync : "calculation helper"
ModelObject -.-> modelobjectHandleClick : "event handler"
ModelObject -.-> modelobjectHandlePointerDown : "event handler"
ModelObject -.-> modelobjectHandlePointerUp : "event handler"
ObjectRenderer -.-> objectrendererOnClickStable : "render helper"
ObjectRenderer -.-> objectrendererOnDeleteStable : "render helper"
ObjectRenderer -.-> objectrendererOnTransformStartStable : "render helper"
ObjectRenderer -.-> objectrendererOnTransformEndStable : "render helper"
ObjectRenderer -.-> objectrendererOnMatrixChangedStable : "render helper"
ObjectRenderer -.-> objectrendererOnMoveStable : "render helper"
ObjectsRenderer -.-> objectsrendererProgressiveVisibleObjects : "render helper"
ObjectsRenderer -.-> objectsrendererCubeObjects : "render helper"
ObjectsRenderer -.-> objectsrendererContainerHeaders : "render helper"
ObjectsRenderer -.-> objectsrendererDodecahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererTetrahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererRenderedObjects : "render helper"
ObjectUI -.-> objectuiHandleEyeClick : "event handler"
ObjectUI -.-> objectuiHandleColorPick : "event handler"
ObjectUI -.-> objectuiHandleToolClick : "event handler"
Plane -.-> planePlaneData : "internal function"
Plane -.-> planeCloseAllUIs : "boolean check"
Plane -.-> planeUpdateDatabase : "update helper"
Plane -.-> planeHandleScale : "event handler"
Plane -.-> planeHandleResizeEnd : "event handler"
Plane -.-> planeHandleDrag : "event handler"
Plane -.-> planeHandleTransformStart : "event handler"
Plane -.-> planeHandleTransformEnd : "event handler"
Plane -.-> planeHandleClick : "event handler"
Plane -.-> planeHandleTextClick : "event handler"
Plane -.-> planeHandleTextSubmit : "event handler"
Plane -.-> planeHandleTextStyleChange : "event handler"
Plane -.-> planeHandleTextSpriteClick : "event handler"
Plane -.-> planeHandleTransformToggle : "event handler"
Plane -.-> planeHandleResizeToggle : "event handler"
Plane -.-> planeHandleColorChange : "event handler"
Plane -.-> planeHandleHeaderToggle : "event handler"
Plane -.-> planeHandleHeaderSubmit : "event handler"
Plane -.-> planeHandleHeaderTextClick : "event handler"
Plane -.-> planeHandleHeaderStyleChange : "event handler"
Plane -.-> planeHandleBorderToggle : "event handler"
Plane -.-> planeHandleIndicatorClick : "event handler"
Plane -.-> planeIsIndicatorConnected : "boolean check"
Plane -.-> planeShouldShowIndicator : "boolean check"
Plane -.-> planeHandleBroadcastStopped : "event handler"
Plane -.-> planeHandleWebcamToggle : "event handler"
Plane -.-> planeHandleScreenShareToggle : "event handler"
Plane -.-> planeHandlePinToggle : "event handler"
Plane -.-> planeHandleImageUpload : "event handler"
Plane -.-> planeHandleBroadcastStarted : "event handler"
Plane -.-> planeHandleViewerCountChange : "event handler"
Plane -.-> planeUiPositions : "internal function"
Plane -.-> planeIndicatorPosition : "internal function"
Plane -.-> planeMeshMaterial : "internal function"
Plane -.-> planeLineMaterialProps : "internal function"
Plane -.-> planeBorderEdgePoints : "internal function"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRunConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRebuildConnectionMap : "update helper"
ScreenShareStream -.-> screensharestreamScreenShareConstraints : "internal function"
SpaceChat -.-> spacechatHandleScroll : "event handler"
SpaceChat -.-> spacechatHandleSend : "event handler"
SpaceChat -.-> spacechatHandleKeyDown : "event handler"
Tetrahedron -.-> tetrahedronTetrahedronFaces : "internal function"
Tetrahedron -.-> tetrahedronPosition : "internal function"
Tetrahedron -.-> tetrahedronScale : "internal function"
Tetrahedron -.-> tetrahedronTextStyle : "internal function"
Tetrahedron -.-> tetrahedronFaceColors : "internal function"
Tetrahedron -.-> tetrahedronFaceTexts : "internal function"
Tetrahedron -.-> tetrahedronFaceTextStyles : "internal function"
Tetrahedron -.-> tetrahedronDebouncedUpdate : "update helper"
Tetrahedron -.-> tetrahedronIsIndicatorConnected : "boolean check"
Tetrahedron -.-> tetrahedronIsIndicatorActive : "boolean check"
Tetrahedron -.-> tetrahedronGetUIPositions : "getter function"
Tetrahedron -.-> tetrahedronShouldShowIndicator : "boolean check"
Tetrahedron -.-> tetrahedronHasConnectedIndicators : "internal function"
Tetrahedron -.-> tetrahedronTetrahedronEdgePoints : "internal function"
Tetrahedron -.-> tetrahedronHandleSceneClick : "event handler"
Tetrahedron -.-> tetrahedronUpdateDatabase : "update helper"
Tetrahedron -.-> tetrahedronHandleFaceClick : "event handler"
Tetrahedron -.-> tetrahedronHandleColoredFaceClick : "event handler"
Tetrahedron -.-> tetrahedronHandleIndicatorClick : "event handler"
Tetrahedron -.-> tetrahedronHandleTransformToggle : "event handler"
Tetrahedron -.-> tetrahedronHandleResizeToggle : "event handler"
Tetrahedron -.-> tetrahedronHandleHeaderToggle : "event handler"
Tetrahedron -.-> tetrahedronHandleHeaderSubmit : "event handler"
Tetrahedron -.-> tetrahedronHandleLineColorChange : "event handler"
Tetrahedron -.-> tetrahedronHandleDrag : "event handler"
Tetrahedron -.-> tetrahedronHandleScale : "event handler"
Tetrahedron -.-> tetrahedronGetFaceTextOffset : "getter function"
Tetrahedron -.-> tetrahedronHandleFaceTextStyleClick : "event handler"
Tetrahedron -.-> tetrahedronHandleFaceTextStyleChange : "event handler"
Tetrahedron -.-> tetrahedronRenderFaceTexts : "render helper"
Tetrahedron -.-> tetrahedronRenderFaces : "render helper"
TetrahedronFace -.-> tetrahedronfaceFaceMaterial : "internal function"
TetrahedronFace -.-> tetrahedronfaceHandleClick : "event handler"
TetrahedronFace -.-> tetrahedronfaceHandleIndicatorClickLocal : "event handler"
TetrahedronFace -.-> tetrahedronfaceGetFaceTextOffset : "getter function"
TetrahedronFace -.-> tetrahedronfaceHandleFaceTextStyleClick : "event handler"
TetrahedronFace -.-> tetrahedronfaceHandleFaceTextStyleChange : "event handler"
TetrahedronFace -.-> tetrahedronfaceFaceTextElement : "internal function"
TextObject -.-> textobjectText : "internal function"
TextObject -.-> textobjectTextStyle : "internal function"
TextObject -.-> textobjectScale : "internal function"
TextObject -.-> textobjectSetOrbitControlsEnabled : "setter function"
TextObject -.-> textobjectSetText : "setter function"
TextObject -.-> textobjectSetTextStyle : "setter function"
TextObject -.-> textobjectSetScale : "setter function"
TextObject -.-> textobjectSetIsEditing : "setter function"
TextObject -.-> textobjectSetIsActivelyEditing : "setter function"
TextObject -.-> textobjectSetIndicatorSelected : "setter function"
TextObject -.-> textobjectSetContentHeight : "setter function"
TextObject -.-> textobjectSetShowTransform : "setter function"
TextObject -.-> textobjectSetShowResizeControls : "setter function"
TextObject -.-> textobjectSetBulletPointMode : "setter function"
TextObject -.-> textobjectHandleTransformToggle : "event handler"
TextObject -.-> textobjectHandleResizeToggle : "event handler"
TextObject -.-> textobjectGetIndicatorOffset : "getter function"
TextObject -.-> textobjectIsIndicatorConnected : "boolean check"
TextObject -.-> textobjectShouldShowIndicator : "boolean check"
TextObject -.-> textobjectGetIndicatorPositions : "getter function"
TextObject -.-> textobjectUpdateWorldMatrix : "update helper"
TextObject -.-> textobjectCloseAllUIs : "boolean check"
TextObject -.-> textobjectUpdateDatabase : "update helper"
TextObject -.-> textobjectAutoResizeTextAreaOnly : "internal function"
TextObject -.-> textobjectAutoResizeTextArea : "internal function"
TextObject -.-> textobjectHandleBlur : "event handler"
TextObject -.-> textobjectHandleDivClick : "event handler"
TextObject -.-> textobjectHandleTextClick : "event handler"
TextObject -.-> textobjectHandleIndicatorClick : "event handler"
TextObject -.-> textobjectHandleDrag : "event handler"
TextObject -.-> textobjectHandleScale : "event handler"
TextObject -.-> textobjectHandleKeyDown : "event handler"
TextObject -.-> textobjectHandleStyleChange : "event handler"
TextObject -.-> textobjectHandleTextSelection : "event handler"
TextObject -.-> textobjectGetTextAreaStyle : "getter function"
TextObject -.-> textobjectGetContainerStyle : "getter function"
TextObject -.-> textobjectGetEffectivePosition : "getter function"
TextObjectUI -.-> textobjectuiHandleUIClick : "event handler"
TextObjectUI -.-> textobjectuiHandleResizeToggle : "event handler"
TextObjectUI -.-> textobjectuiHandleEyeClick : "event handler"
TextSprite -.-> textspriteSpriteId : "internal function"
TextSprite -.-> textspriteSetIsDragging : "setter function"
TextSprite -.-> textspriteCalculatedPosition : "calculation helper"
TextSprite -.-> textspriteGetFontSize : "getter function"
TextStyleUIContent -.-> textstyleuicontentHandleSizeChange : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleFontSizeInputChange : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleWheel : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleButtonClick : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleColorSelect : "event handler"
TextStyleUIContent -.-> textstyleuicontentHandleSelectChange : "event handler"
TextStyleUIContent -.-> textstyleuicontentGetUIScale : "getter function"
UIOverlay -.-> uioverlaySetIsRecording : "setter function"
UIOverlay -.-> uioverlayHandleCellBoundariesToggle : "event handler"
UIOverlay -.-> uioverlayFetchRepositories : "internal function"
UIOverlay -.-> uioverlayFetchAppJsxFromRepo : "internal function"
UIOverlay -.-> uioverlayHandleRescan : "event handler"
UIOverlay -.-> uioverlayHandleDownloadMarkdown : "event handler"
UIOverlay -.-> uioverlayHandleScreenClick : "event handler"
UIOverlay -.-> uioverlayHandleRuntimeScan : "event handler"
UIOverlay -.-> uioverlayHandleRecordClick : "event handler"
UIOverlay -.-> uioverlayHandleDeleteAllCells : "event handler"
UIOverlay -.-> uioverlayHandleModelUpload : "event handler"
UIOverlay -.-> uioverlayHandleModelFileSelect : "event handler"
UIOverlay -.-> uioverlayHandleMarkdownUpload : "event handler"
UIOverlay -.-> uioverlayHandleMarkdownFileSelect : "event handler"
UIOverlay -.-> uioverlayHandleMenuToggle : "event handler"
UIOverlay -.-> uioverlayHandleArrowClick : "event handler"
UIOverlay -.-> uioverlayHandleUnpinWebcam : "event handler"
UIOverlay -.-> uioverlayHandleTemplateConfigChange : "event handler"
UIOverlay -.-> uioverlayCreateTemplate : "internal function"
CreateOrganizationPopup -.-> createorganizationpopupHandleKeyPress : "event handler"
CreateOrganizationPopup -.-> createorganizationpopupHandleSubmit : "event handler"
CreateSpacePopup -.-> createspacepopupHandleSpaceNameChange : "event handler"
CreateSpacePopup -.-> createspacepopupHandleEmailChange : "event handler"
CreateSpacePopup -.-> createspacepopupHandleMemberSelect : "event handler"
CreateSpacePopup -.-> createspacepopupHandleKeyPress : "event handler"
CreateSpacePopup -.-> createspacepopupHandleSubmit : "event handler"
DodecahedronWireframe2 -.-> dodecahedronwireframe2GenerateDodecahedronEdges : "internal function"
OrganizationManager -.-> organizationmanagerRefresh : "internal function"
OrganizationManager -.-> organizationmanagerHandleCreateOrg : "event handler"
OrganizationManager -.-> organizationmanagerHandleInvite : "event handler"
OrganizationManager -.-> organizationmanagerHandleRemoveMember : "event handler"
OrganizationManager -.-> organizationmanagerHandleLeave : "event handler"
OrganizationManager -.-> organizationmanagerHandleUpgradePlan : "event handler"
OrganizationManager -.-> organizationmanagerHandleDeleteOrg : "event handler"
OrganizationManager -.-> organizationmanagerHandleAcceptInvite : "event handler"
OrganizationManager -.-> organizationmanagerHandleDeclineInvite : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputFocus : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputChange : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleSelect : "event handler"
ShareSpacePopup -.-> sharespacepopupFilteredMembers : "internal function"
ShareSpacePopup -.-> sharespacepopupToggleMember : "internal function"
ShareSpacePopup -.-> sharespacepopupHandleShare : "event handler"
SpacesTable -.-> spacestableHandleSpaceClick : "event handler"
SpacesTable -.-> spacestableThStyles : "internal function"
SpacesTable -.-> spacestableTdStyles : "internal function"
SpacesTable -.-> spacestableCategoryRowStyles : "internal function"
SpacesTable -.-> spacestableInviteBannerStyle : "internal function"
DodecahedronWireframe -.-> dodecahedronwireframeGenerateDodecahedronEdges : "internal function"
FakeGlowMaterial -.-> fakeglowmaterialFakeGlowMaterial : "internal function"
LandingApp -.-> landingappCreateUserDocument : "internal function"
LandingApp -.-> landingappHandleLogin : "event handler"
LandingApp -.-> landingappHandleLogout : "event handler"
LandingApp -.-> landingappNavigateToSpace : "internal function"
LandingApp -.-> landingappFetchUserSpaces : "internal function"
LandingApp -.-> landingappCreateNewSpace : "internal function"
LandingApp -.-> landingappHandleShareSpace : "event handler"
LandingApp -.-> landingappHandleDeleteSpace : "event handler"
LandingApp -.-> landingappHandleLeaveSpace : "event handler"
LandingApp -.-> landingappHandleFirstCubeComplete : "event handler"
LandingApp -.-> landingappHandleDodecahedronComplete : "event handler"
LandingApp -.-> landingappHandleAcceptInvite : "event handler"
LandingApp -.-> landingappHandleDeclineInvite : "event handler"
LandingApp -.-> landingappSpaceTableProps : "internal function"
LandingApp -.-> landingappCreateSpaceProps : "internal function"
LandingApp -.-> landingappSharePopupProps : "internal function"
UpdatesEditor -.-> updateseditorHandleKeyCommand : "event handler"
UpdatesEditor -.-> updateseditorToggleInlineStyle : "update helper"
UpdatesEditor -.-> updateseditorHandleSave : "event handler"
UpdatesViewer -.-> updatesviewerParsedContent : "update helper"
UpdatesViewer -.-> updatesviewerFormattedTimestamp : "update helper"
WhitePlane -.-> whiteplanePlaneGeometry : "internal function"
WhitePlane -.-> whiteplaneGridTexture : "internal function"

%% File Container Nodes
backend_index((Service: index))
astTraversal[Function: astTraversal]
fileAnalyzer[Function: fileAnalyzer]
merfolkGenerator[Function: merfolkGenerator]
repoTypeDetector[Function: repoTypeDetector]
workspaceScanner[Function: workspaceScanner]
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
constants[Function: constants]
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
line.frag[Function: line.frag]
shaders[Function: shaders]
line.vert[Function: line.vert]
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
backend_index -.-> createVerifyAuthTokenApp : "contains"
backend_index -.-> verifyAuthToken : "contains"
backend_index -.-> createBulkImportApp : "contains"
backend_index -.-> bulkImport : "contains"
backend_index -.-> fetchGithubToken : "contains"
backend_index -.-> createBulkDeleteApp : "contains"
backend_index -.-> bulkDelete : "contains"
backend_index -.-> validateRuntimeScanUrl : "contains"
backend_index -.-> sanitizeMerfolkId : "contains"
backend_index -.-> generateMerfolkFromRuntimeTrace : "contains"
backend_index -.-> extractSourceMapUrl : "contains"
backend_index -.-> scanOriginalSource : "contains"
backend_index -.-> extractNamesFromSourceMap : "contains"
backend_index -.-> scanJsBundles : "contains"
backend_index -.-> captureRuntimeTrace : "contains"
backend_index -.-> deduplicateApiCalls : "contains"
backend_index -.-> buildConnections : "contains"
backend_index -.-> createScanWebsiteRuntimeApp : "contains"
backend_index -.-> scanWebsiteRuntime : "contains"
astTraversal -.-> getFileStem : "contains"
astTraversal -.-> addToSet : "contains"
astTraversal -.-> addToFileContainer : "contains"
astTraversal -.-> isNonLiteralInit : "contains"
astTraversal -.-> classifyName : "contains"
astTraversal -.-> detectEventEmitterCreation : "contains"
astTraversal -.-> detectEventListenerRegistration : "contains"
astTraversal -.-> detectDbModelCreation : "contains"
astTraversal -.-> extractObjectKeys : "contains"
astTraversal -.-> detectAuthGuardPattern : "contains"
astTraversal -.-> detectApiEndpointRegistration : "contains"
astTraversal -.-> processVanillaNode : "contains"
astTraversal -.-> traverseVanillaAST : "contains"
astTraversal -.-> unwrapToFunction : "contains"
astTraversal -.-> getInternalFunctionLabel : "contains"
astTraversal -.-> collectContainedComponents : "contains"
astTraversal -.-> walkNodeForJSX : "contains"
astTraversal -.-> deepWalkForCallSites : "contains"
astTraversal -.-> analyzeComponentBody : "contains"
astTraversal -.-> processReactDecl : "contains"
astTraversal -.-> traverseReactAST : "contains"
astTraversal -.-> deriveNextjsRoutePath : "contains"
astTraversal -.-> buildNextjsRouteMap : "contains"
astTraversal -.-> classifyPython : "contains"
astTraversal -.-> traversePythonSource : "contains"
astTraversal -.-> extractPythonModelFields : "contains"
astTraversal -.-> parseJS : "contains"
astTraversal -.-> traverseVueSource : "contains"
astTraversal -.-> extractShaderSymbols : "contains"
fileAnalyzer -.-> analyzeFile : "contains"
fileAnalyzer -.-> containsJSX : "contains"
merfolkGenerator -.-> generateRoutedConnection : "contains"
merfolkGenerator -.-> generateMerfolkMarkdown : "contains"
repoTypeDetector -.-> walkDir : "contains"
repoTypeDetector -.-> fileExists : "contains"
repoTypeDetector -.-> readPackageJson : "contains"
repoTypeDetector -.-> getDeps : "contains"
repoTypeDetector -.-> getProdDeps : "contains"
repoTypeDetector -.-> detectRepoType : "contains"
workspaceScanner -.-> getFileType : "contains"
workspaceScanner -.-> scanWorkspace : "contains"
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
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
markdownDiagramService_file -.-> MarkdownDiagramService : "contains"
markdownDiagramService_file -.-> markdownDiagramService : "contains"
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
opacity[Function: opacity]
line.frag -.-> opacity : "contains"
glowWidth[Function: glowWidth]
line.frag -.-> glowWidth : "contains"
glowIntensity[Function: glowIntensity]
line.frag -.-> glowIntensity : "contains"
shaders -.-> opacity : "contains"
shaders -.-> glowWidth : "contains"
shaders -.-> glowIntensity : "contains"
linewidth[Function: linewidth]
shaders -.-> linewidth : "contains"
resolution[Function: resolution]
shaders -.-> resolution : "contains"
line.vert -.-> linewidth : "contains"
line.vert -.-> resolution : "contains"
line.vert -.-> glowWidth : "contains"
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
App --> FrameTicker : "uses"
App --> FrameloopController : "uses"
App --> LODManager : "enabled"
App --> CustomCamera : "ref"
App --> RealTimeConnectionUpdater : "connections"
App --> ConnectionsRenderer : "objects, allObjectsForPathfinding, visibleObjectIds..."
App --> ObjectsRenderer : "objects, visibleObjectIds, selectedId..."
App --> CellBoundaryRenderer : "visible"
App --> DiagramOverlay2D : "uses"
App --> UIOverlay : "onCreateObject, onToggleIndicators, user..."
AppShell --> LandingApp_file : "onOpenSpace"
LandingApp_file --> LandingApp : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, geometry..."
AtlasTextSprite --> StaticBillboardMesh : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, calculatedPosition..."
AtlasTextSprite --> DynamicBillboardMesh : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> InstancedLine : "key, points, color..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AnimatedConnectionLine : "key, points, connectionId..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> Connection : "position, maxDistance"
Connection --> DistanceFilteredConnectionText : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AtlasTextSprite : "key, text, position..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> HeaderInput : "position, onTextSubmit, inputId..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "position, onStyleChange, onClose..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> LineUI : "position, onColorChange, onToggleDashed..."
ConnectionsRenderer --> BatchedConnectionLines : "connections, objectPositions, selectedConnectionId..."
ConnectionsRenderer --> BatchedCurvedLines : "connections, objectPositions, pathfindingObjects..."
ConnectionsRenderer --> DistanceFilteredTextLabels : "labels, maxDistance, onLabelClick"
ConnectionsRenderer --> ConnectionsRenderer : "key, connection, allObjectsForPathfinding..."
ConnectionsRenderer --> Connection : "receives"
Cube --> CubeFace : "cubeId, faceName, faceData..."
Cube --> FaceUI : "position, normal, onColorChange..."
Cube --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> AtlasTextSprite : "text, position, onClick..."
Cube --> TextStyleUI : "position, onStyleChange, onClose..."
Cube --> SnapLineIndicator : "points, axis, visible"
Cube --> InstancedLine : "points, color, lineWidth"
Cube --> HeaderInput : "position, onTextSubmit, inputId..."
Cube --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
CubeFace --> FaceIndicator : "position, rotation, onClick..."
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
DistanceFilteredTextLabels --> InstancedAtlasText : "labels, maxDistance, onLabelClick..."
Sphere --> SnapLineIndicator : "points, axis, visible"
Sphere --> DodecahedronFace : "key, dodecahedronId, faceIndex..."
Sphere --> InstancedLine : "points, color, lineWidth"
Sphere --> ObjectUI : "position, onTransformToggle, onHeaderToggle..."
Sphere --> FaceUI : "position, onColorChange, face..."
Sphere --> HeaderInput : "position, onTextSubmit, inputId..."
Sphere --> AtlasTextSprite : "key, text, position..."
Sphere --> TextStyleUI : "position, followTarget, onStyleChange..."
DodecahedronFace --> FaceIndicator : "id, position, rotation..."
DodecahedronFace --> AtlasTextSprite : "text, position, style..."
DodecahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
FaceUI --> ColorPicker : "onColorSelect, onClose"
InstancedAtlasText --> InstancedAtlasText : "key, atlas, texture..."
InstancedAtlasText --> PageInstancedMesh : "receives"
LineUI --> ColorPicker : "onColorSelect, onClose"
ObjectRenderer --> Cube : "key, id, selected..."
ObjectRenderer --> Tetrahedron : "key, id, selected..."
ObjectRenderer --> Sphere : "key, id, selected..."
ObjectRenderer --> Plane : "key, id, position..."
ObjectRenderer --> TextObject : "key, id, position..."
ObjectRenderer --> ModelObject : "key, obj, isSelected..."
ObjectsRenderer --> ObjectRenderer : "key, obj, selectedId..."
ObjectsRenderer --> GlobalCubeEdgesRenderer : "cubes, defaultLineWidth"
ObjectsRenderer --> GlobalCubeFaceRenderer : "cubes"
ObjectsRenderer --> GlobalCubeMediumLODRenderer : "cubes"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "dodecahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalDodecahedronMediumLODRenderer : "dodecahedrons"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "tetrahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalTetrahedronMediumLODRenderer : "tetrahedrons"
ObjectsRenderer --> AtlasTextSprite : "key, text, position..."
ObjectUI --> ColorPicker : "pickerId, onColorSelect, onClose"
Plane --> SnapLineIndicator : "points, axis, visible"
Plane --> WebcamStream : "key, meshRef, active..."
Plane --> ScreenShareStream : "key, meshRef, active..."
Plane --> InstancedLine : "points, color, lineWidth..."
Plane --> FaceIndicator : "position, onClick, isActive..."
Plane --> AtlasTextSprite : "text, position, style..."
Plane --> TextStyleUI : "position, onStyleChange, onClose..."
Plane --> FaceUI : "position, onColorChange, onTextClick..."
Plane --> FaceTextInput : "position, onTextSubmit, inputId..."
Plane --> HeaderInput : "position, onTextSubmit, inputId..."
SnapLineIndicator --> InstancedLine : "points, color, lineWidth"
SpacePresenceAvatars --> SpacePresenceAvatars : "key, user"
SpacePresenceAvatars --> Avatar : "receives"
Tetrahedron --> AtlasTextSprite : "text, position, onClick..."
Tetrahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Tetrahedron --> TetrahedronFace : "key, id, faceName..."
Tetrahedron --> SnapLineIndicator : "points, axis, visible"
Tetrahedron --> InstancedLine : "points, color, lineWidth"
Tetrahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Tetrahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
TetrahedronFace --> AtlasTextSprite : "text, position, followTarget..."
TetrahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
TetrahedronFace --> FaceUI : "position, normal, onColorChange..."
TetrahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
TetrahedronFace --> FaceIndicator : "position, rotation, onClick..."
TextObject --> SnapLineIndicator : "points, axis, visible"
TextObject --> FaceIndicator : "position, rotation, onClick..."
TextObject --> TextObjectUI : "ref, id, textStyle..."
TextObjectUI --> TextStyleUI : "uiType, textStyle, onStyleChange..."
TextStyleUI --> TextStyleUIContent : "receives"
TextObjectUI --> ColorPicker : "onColorSelect, onClose"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TextStyleUI --> TextStyleUI : "onStyleChange, distance, onClose"
TextStyleUI --> TextStyleUIContent : "receives"
TextStyleUIContainer --> TextStyleUI : "onStyleChange"
TextStyleUI --> TextStyleUIContent : "receives"
UIOverlay --> SpaceChat : "spaceId, user, isOpen..."
UIOverlay --> SpacePresenceAvatars : "spaceId"
CreateSpacePopup --> OrgMemberDropdown : "members, selectedUserId, onSelect..."
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> CreateSpacePopup : "uses"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> UpgradePrompt : "show, onClose, currentTier"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> ShareSpacePopup : "uses"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> OrganizationManager : "user, show, onClose"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> SpacesTable : "uses"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> UserLoginSection : "user, windowSize, onLogin..."
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> WelcomeOverlay : "windowSize, onLogin"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> Order : "windowSize"
Order --> OrderHeader : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> CustomCamera : "camera"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> WhitePlane : "uses"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> CubeOutline : "size, color, targetPosition..."
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> DodecahedronWireframe : "size, color, targetPosition..."
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> DodecahedronWireframe2 : "size, color, targetPosition..."
UpdatesContainer --> UpdatesViewer : "content, timestamp"

%% Component Dependencies
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> useSpatialManagerStore : "uses store"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useConnectionStore : "uses store"
App --> useConnectionStore : "uses store"
App --> useConnectionStore : "uses store"
App --> useConnectionStore : "uses store"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AtlasTextSprite --> useTextAtlasStore : "uses store"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "{startObject, endObject}"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses store"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useConnectionStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
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
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LODManager --> useLODStore : "uses store"
Plane --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
TextObject --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize_file : "receives"

%% Function Call Relationships
createVerifyAuthTokenApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createVerifyAuthTokenApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
createBulkImportApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createBulkImportApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
createBulkDeleteApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createBulkDeleteApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
scanJsBundles --> extractSourceMapUrl : "calls extractSourceMapUrl"
scanJsBundles --> scanOriginalSource : "calls scanOriginalSource"
scanJsBundles --> extractNamesFromSourceMap : "calls extractNamesFromSourceMap"
captureRuntimeTrace --> scanJsBundles : "calls scanJsBundles"
captureRuntimeTrace --> deduplicateApiCalls : "calls deduplicateApiCalls"
captureRuntimeTrace --> buildConnections : "calls buildConnections"
createScanWebsiteRuntimeApp --> backend_index : "calls out"
backend_index --> express : "calls express"
createScanWebsiteRuntimeApp --> backend_index : "calls out"
backend_index --> cors : "calls cors"
createScanWebsiteRuntimeApp --> validateRuntimeScanUrl : "calls validateRuntimeScanUrl"
createScanWebsiteRuntimeApp --> captureRuntimeTrace : "calls captureRuntimeTrace"
createScanWebsiteRuntimeApp --> backend_index : "calls out"
backend_index --> runtimeScanService : "calls generateMerfolkFromRuntimeTrace"
runtimeScanService --> generateMerfolkFromRuntimeTrace : "receives"
classifyName --> addToSet : "calls addToSet"
classifyName --> addToFileContainer : "calls addToFileContainer"
classifyName --> addToSet : "calls addToSet"
classifyName --> addToSet : "calls addToSet"
classifyName --> addToSet : "calls addToSet"
classifyName --> addToSet : "calls addToSet"
classifyName --> addToSet : "calls addToSet"
classifyName --> addToFileContainer : "calls addToFileContainer"
detectDbModelCreation --> extractObjectKeys : "calls extractObjectKeys"
detectDbModelCreation --> extractObjectKeys : "calls extractObjectKeys"
processVanillaNode --> classifyName : "calls classifyName"
processVanillaNode --> isNonLiteralInit : "calls isNonLiteralInit"
processVanillaNode --> detectEventEmitterCreation : "calls detectEventEmitterCreation"
processVanillaNode --> detectDbModelCreation : "calls detectDbModelCreation"
processVanillaNode --> detectAuthGuardPattern : "calls detectAuthGuardPattern"
processVanillaNode --> detectApiEndpointRegistration : "calls detectApiEndpointRegistration"
processVanillaNode --> classifyName : "calls classifyName"
processVanillaNode --> deepWalkForCallSites : "calls deepWalkForCallSites"
processVanillaNode --> getFileStem : "calls getFileStem"
processVanillaNode --> classifyName : "calls classifyName"
processVanillaNode --> deepWalkForCallSites : "calls deepWalkForCallSites"
processVanillaNode --> getFileStem : "calls getFileStem"
processVanillaNode --> classifyName : "calls classifyName"
processVanillaNode --> deepWalkForCallSites : "calls deepWalkForCallSites"
processVanillaNode --> classifyName : "calls classifyName"
processVanillaNode --> detectApiEndpointRegistration : "calls detectApiEndpointRegistration"
processVanillaNode --> detectEventListenerRegistration : "calls detectEventListenerRegistration"
processVanillaNode --> isNonLiteralInit : "calls isNonLiteralInit"
processVanillaNode --> detectEventEmitterCreation : "calls detectEventEmitterCreation"
processVanillaNode --> detectDbModelCreation : "calls detectDbModelCreation"
processVanillaNode --> detectAuthGuardPattern : "calls detectAuthGuardPattern"
traverseVanillaAST --> processVanillaNode : "calls processVanillaNode"
unwrapToFunction --> unwrapToFunction : "calls unwrapToFunction"
collectContainedComponents --> collectContainedComponents : "calls collectContainedComponents"
collectContainedComponents --> collectContainedComponents : "calls collectContainedComponents"
collectContainedComponents --> collectContainedComponents : "calls collectContainedComponents"
walkNodeForJSX --> collectContainedComponents : "calls collectContainedComponents"
walkNodeForJSX --> collectContainedComponents : "calls collectContainedComponents"
walkNodeForJSX --> walkNodeForJSX : "calls walkNodeForJSX"
walkNodeForJSX --> walkNodeForJSX : "calls walkNodeForJSX"
walkNodeForJSX --> walkNodeForJSX : "calls walkNodeForJSX"
walkNodeForJSX --> walkNodeForJSX : "calls walkNodeForJSX"
walkNodeForJSX --> walkNodeForJSX : "calls walkNodeForJSX"
deepWalkForCallSites --> deepWalkForCallSites : "calls deepWalkForCallSites"
deepWalkForCallSites --> deepWalkForCallSites : "calls deepWalkForCallSites"
deepWalkForCallSites --> deepWalkForCallSites : "calls deepWalkForCallSites"
deepWalkForCallSites --> deepWalkForCallSites : "calls deepWalkForCallSites"
deepWalkForCallSites --> deepWalkForCallSites : "calls deepWalkForCallSites"
deepWalkForCallSites --> deepWalkForCallSites : "calls deepWalkForCallSites"
analyzeComponentBody --> walkNodeForJSX : "calls walkNodeForJSX"
analyzeComponentBody --> getInternalFunctionLabel : "calls getInternalFunctionLabel"
analyzeComponentBody --> getInternalFunctionLabel : "calls getInternalFunctionLabel"
analyzeComponentBody --> getInternalFunctionLabel : "calls getInternalFunctionLabel"
analyzeComponentBody --> walkNodeForJSX : "calls walkNodeForJSX"
analyzeComponentBody --> deepWalkForCallSites : "calls deepWalkForCallSites"
processReactDecl --> addToSet : "calls addToSet"
processReactDecl --> analyzeComponentBody : "calls analyzeComponentBody"
processReactDecl --> astTraversal : "calls out"
astTraversal --> fileAnalyzer : "calls containsJSX"
fileAnalyzer --> containsJSX : "receives"
processReactDecl --> addToSet : "calls addToSet"
processReactDecl --> analyzeComponentBody : "calls analyzeComponentBody"
processReactDecl --> astTraversal : "calls out"
astTraversal --> fileAnalyzer : "calls containsJSX"
fileAnalyzer --> containsJSX : "receives"
processReactDecl --> addToSet : "calls addToSet"
processReactDecl --> analyzeComponentBody : "calls analyzeComponentBody"
processReactDecl --> astTraversal : "calls out"
astTraversal --> fileAnalyzer : "calls containsJSX"
fileAnalyzer --> containsJSX : "receives"
processReactDecl --> addToSet : "calls addToSet"
processReactDecl --> unwrapToFunction : "calls unwrapToFunction"
processReactDecl --> analyzeComponentBody : "calls analyzeComponentBody"
processReactDecl --> astTraversal : "calls out"
astTraversal --> fileAnalyzer : "calls containsJSX"
fileAnalyzer --> containsJSX : "receives"
processReactDecl --> addToSet : "calls addToSet"
processReactDecl --> addToSet : "calls addToSet"
processReactDecl --> analyzeComponentBody : "calls analyzeComponentBody"
processReactDecl --> astTraversal : "calls out"
astTraversal --> fileAnalyzer : "calls containsJSX"
fileAnalyzer --> containsJSX : "receives"
processReactDecl --> unwrapToFunction : "calls unwrapToFunction"
processReactDecl --> addToSet : "calls addToSet"
processReactDecl --> analyzeComponentBody : "calls analyzeComponentBody"
processReactDecl --> astTraversal : "calls out"
astTraversal --> fileAnalyzer : "calls containsJSX"
fileAnalyzer --> containsJSX : "receives"
traverseReactAST --> traverseVanillaAST : "calls traverseVanillaAST"
traverseReactAST --> processReactDecl : "calls processReactDecl"
traverseReactAST --> processReactDecl : "calls processReactDecl"
traverseReactAST --> addToSet : "calls addToSet"
traverseReactAST --> processReactDecl : "calls processReactDecl"
traverseReactAST --> getFileStem : "calls getFileStem"
traverseReactAST --> deriveNextjsRoutePath : "calls deriveNextjsRoutePath"
classifyPython --> addToSet : "calls addToSet"
classifyPython --> addToSet : "calls addToSet"
classifyPython --> addToSet : "calls addToSet"
classifyPython --> addToFileContainer : "calls addToFileContainer"
traversePythonSource --> addToSet : "calls addToSet"
traversePythonSource --> addToFileContainer : "calls addToFileContainer"
traversePythonSource --> extractPythonModelFields : "calls extractPythonModelFields"
traversePythonSource --> addToSet : "calls addToSet"
traversePythonSource --> classifyPython : "calls classifyPython"
parseJS --> traverseVanillaAST : "calls traverseVanillaAST"
traverseVueSource --> parseJS : "calls parseJS"
traverseVueSource --> addToSet : "calls addToSet"
traverseVueSource --> parseJS : "calls parseJS"
extractShaderSymbols --> addToFileContainer : "calls addToFileContainer"
extractShaderSymbols --> addToFileContainer : "calls addToFileContainer"
extractShaderSymbols --> addToFileContainer : "calls addToFileContainer"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
containsJSX --> containsJSX : "calls containsJSX"
generateMerfolkMarkdown --> generateRoutedConnection : "calls generateRoutedConnection"
generateMerfolkMarkdown --> generateRoutedConnection : "calls generateRoutedConnection"
generateMerfolkMarkdown --> generateRoutedConnection : "calls generateRoutedConnection"
generateMerfolkMarkdown --> generateRoutedConnection : "calls generateRoutedConnection"
walkDir --> walkDir : "calls walkDir"
detectRepoType --> fileExists : "calls fileExists"
detectRepoType --> walkDir : "calls walkDir"
detectRepoType --> readPackageJson : "calls readPackageJson"
detectRepoType --> getDeps : "calls getDeps"
detectRepoType --> getProdDeps : "calls getProdDeps"
detectRepoType --> fileExists : "calls fileExists"
detectRepoType --> fileExists : "calls fileExists"
detectRepoType --> fileExists : "calls fileExists"
detectRepoType --> fileExists : "calls fileExists"
detectRepoType --> fileExists : "calls fileExists"
scanWorkspace --> getFileType : "calls getFileType"
App --> presenceService : "calls setGuestPresence"
presenceService --> setGuestPresence : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> spacesService : "calls getPublicSpaceMetadata"
spacesService --> getPublicSpaceMetadata : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> loadingState : "calls setIsInitialLoading"
loadingState --> setIsInitialLoading : "receives"
App --> spatialObjectsService : "calls subscribeToSpatialObjects"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> webRservice : "calls initWebRTC"
webRservice --> initWebRTC : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> getSharedMaterial : "calls getSharedMaterial"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> numericCacheKey : "calls numericCacheKey"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
BatchedCurvedLines --> pathToSegments : "calls pathToSegments"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> computeVisibleCells : "calls computeVisibleCells"
DistanceFilteredConnectionText --> Connection : "calls out"
Connection --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
resolveEndpointPosition --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "calls calculateMidpoint"
positionUtils --> calculateMidpoint : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> getTextParametricT : "calls getTextParametricT"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ConnectionsRenderer --> pathfindingUtils : "calls invalidatePathfindingCaches"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> pathfindingUtils : "calls precomputePathsBatch"
pathfindingUtils --> precomputePathsBatch : "receives"
ConnectionsRenderer --> redistributeFaces : "calls redistributeFaces"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> resolveEndpointPosition : "calls resolveEndpointPosition"
ConnectionsRenderer --> getTextParametricT : "calls getTextParametricT"
Cube --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Cube --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
CubeFace --> cubeStore : "calls getCubeFaceStateSelector"
cubeStore --> getCubeFaceStateSelector : "receives"
MerfolkEdge --> getEdgeStyle : "calls getEdgeStyle"
MerfolkEdge --> getSelectedStyle : "calls getSelectedStyle"
MerfolkEdge --> getUnselectedStyle : "calls getUnselectedStyle"
DiagramOverlay2D --> diagramLayoutWorkerClient : "calls getDiagramLayoutWorker"
diagramLayoutWorkerClient --> getDiagramLayoutWorker : "receives"
DiagramOverlay2D --> buildReactFlowNodes : "calls buildReactFlowNodes"
DiagramOverlay2D --> buildReactFlowEdges : "calls buildReactFlowEdges"
DiagramOverlay2D --> filterEdges : "calls filterEdges"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
LODManager --> spatialIndexWorkerClient : "calls getSpatialIndexWorker"
spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> spatialIndexWorkerClient : "calls getSpatialIndexWorker"
spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> spatialIndexWorkerClient : "calls getSpatialIndexWorker"
spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> lodStore : "calls calculateParentLODLevel"
lodStore --> calculateParentLODLevel : "receives"
LODManager --> lodStore : "calls calculateLODLevel"
lodStore --> calculateLODLevel : "receives"
LODManager --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "calls getSmoothedFrameTime"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ObjectRenderer --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
UIOverlay --> uiOverlayStore : "calls setCellBoundariesVisible"
uiOverlayStore --> setCellBoundariesVisible : "receives"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> githubRepoService : "calls handleGithubCallback"
githubRepoService --> handleGithubCallback : "receives"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> loadingState : "calls getIsInitialLoading"
loadingState --> getIsInitialLoading : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> loadingState : "calls getIsInitialLoading"
loadingState --> getIsInitialLoading : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls subscribeToConnections"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
isConnectionVisible --> useFrustumCulling : "calls out"
useFrustumCulling --> spatialIndexWorker : "calls isPointInFrustum"
spatialIndexWorker --> isPointInFrustum : "receives"
isConnectionVisible --> useFrustumCulling : "calls out"
useFrustumCulling --> spatialIndexWorker : "calls isPointInFrustum"
spatialIndexWorker --> isPointInFrustum : "receives"
OrganizationManager --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
OrganizationManager --> organizationService : "calls createOrganization"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "calls inviteUserToOrganization"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "calls removeMemberFromOrganization"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "calls leaveOrganization"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "calls updateOrganizationPlan"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "calls deleteOrganization"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> authService : "calls signOut"
authService --> signOut : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> authService : "calls signOut"
authService --> signOut : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
removeAllSharedReferences --> removeSharedSpaceReference : "calls removeSharedSpaceReference"
flushSaveBatch --> spatialObjectsService : "calls out"
spatialObjectsService --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
flushSaveBatch --> spatialObjectsService : "calls out"
spatialObjectsService --> spatialPartitioning : "calls getCellId"
spatialPartitioning --> getCellId : "receives"
flushSaveBatch --> spatialObjectsService : "calls out"
spatialObjectsService --> spatialPartitioning : "calls addObjectToCell"
spatialPartitioning --> addObjectToCell : "receives"
checkObjectMovement --> roundForCache : "calls roundForCache"
generateCacheKey --> roundForCache : "calls roundForCache"
generateCacheKey --> roundForCache : "calls roundForCache"
checkLineIntersection --> cleanCaches : "calls cleanCaches"
checkLineIntersection --> generateCacheKey : "calls generateCacheKey"
generateCurvedPath --> generateCacheKey : "calls generateCacheKey"
generateCurvedPath --> lineIntersectsBoundingBox : "calls lineIntersectsBoundingBox"
generateCurvedPath --> generateMultiSegmentPath : "calls generateMultiSegmentPath"
generateCurvedPath --> checkCurveIntersections : "calls checkCurveIntersections"
precomputeCacheKey --> roundForCache : "calls roundForCache"
precomputeCacheKey --> roundForCache : "calls roundForCache"
getPrecomputedResult --> precomputeCacheKey : "calls precomputeCacheKey"
computeConnectionPath --> getPrecomputedResult : "calls getPrecomputedResult"
computeConnectionPath --> checkLineIntersection : "calls checkLineIntersection"
computeConnectionPath --> generateCurvedPath : "calls generateCurvedPath"
precomputePathsBatch --> pathfindingUtils : "calls out"
pathfindingUtils --> pathfindingWorkerClient : "calls getPathfindingWorker"
pathfindingWorkerClient --> getPathfindingWorker : "receives"
precomputePathsBatch --> precomputeCacheKey : "calls precomputeCacheKey"
isCameraMovingRapidly --> isCameraMoving : "calls isCameraMoving"
benchmarkStreamlined --> createStreamlinedSpatialIndex : "calls createStreamlinedSpatialIndex"
getGlobalTextAtlas --> isOffscreenCanvasTextSupported : "calls isOffscreenCanvasTextSupported"
createAtlasTextMesh --> getGlobalTextAtlas : "calls getGlobalTextAtlas"
filterConnections --> isHierarchyConnection : "calls isHierarchyConnection"
filterConnections --> isHierarchyConnection : "calls isHierarchyConnection"
layoutNodes --> estimateNodeSize : "calls estimateNodeSize"
layoutNodes --> estimateNodeSize : "calls estimateNodeSize"
layoutEdges --> filterConnections : "calls filterConnections"

%% Store Usage Details
App --> useConnectionStore : "selectConnection, setShowLineTextStyleUI, connectionsVisible, setFocusedObjectId"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "globalAnimationEnabled"
AtlasTextSprite --> useTextAtlasStore : "atlasVersion"
ConnectionsRenderer --> useConnectionsRendererStore_file : "connections, connectionsVisible, focusedObjectId, selectedConnection..."
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useConnectionStore : "selectConnectionWithFlowPath"
GlobalCubeEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalCubeFaceRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalCubeMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalDodecahedronEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalDodecahedronMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalTetrahedronEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalTetrahedronMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
InstancedAtlasText --> useTextAtlasStore : "atlasVersion"
LineUI --> useConnectionStore : "toggleLineStylesMenu, toggleArrowDropdown, closeAllLineUIMenus, setLineUIMenuState"
LODManager --> useLODStore : "childParentMap, parentIds, lodEnabled, batchSetLODLevels..."
RealTimeConnectionUpdater --> useConnectionStore : "updateConnections"
RealTimeConnectionUpdater --> useSpatialManagerStore : "isInitialized"
UIOverlay --> useConnectionStore : "connectionsVisible, toggleConnectionsVisible, resetConnections, length"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> useConnectionStore : "connections, addConnection, updateConnection, removeConnection..."
useSpaceManager_file --> useSpaceManager_file : "calls out"
useSpaceManager_file --> useSpaceManagerStore : "currentSpaceId, setCurrentSpaceId, fetchCurrentSpace, setIntentionalSpaceChange"

%% Error Boundaries
Suspense[Boundary: Suspense]

%% Error Containment
```
