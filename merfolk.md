```merfolk
%% hoverchart Repository Analysis

%% Components
App{Component: App}
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

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
ConnectionsRenderer -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
EdgeMarkerDefs -.-> MerfolkEdge : "internal"
ContainerNode -.-> MerfolkNode : "internal"
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
REACT_DEVTOOLS_INJECTION[Function: REACT_DEVTOOLS_INJECTION]
getCompName[Function: getCompName]
walkFiber[Function: walkFiber]
dedup[Function: dedup]
AppShell[Function: AppShell]
handleOpenSpace[Function: handleOpenSpace]
handleBackToLanding[Function: handleBackToLanding]
handlePopState[Function: handlePopState]
getSharedMaterial[Function: getSharedMaterial]
numericCacheKey[Function: numericCacheKey]
pathToSegments[Function: pathToSegments]
computeVisibleCells[Function: computeVisibleCells]
getTextParametricT[Function: getTextParametricT]
redistributeFaces[Function: redistributeFaces]
pathToLineSegments[Function: pathToLineSegments]
resolveEndpointPosition[Function: resolveEndpointPosition]
handlePointerOver[Function: handlePointerOver]
handlePointerOut[Function: handlePointerOut]
arraysEqual[Function: arraysEqual]
shallowObjEqual[Function: shallowObjEqual]
getColoredMaterial[Function: getColoredMaterial]
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
getDepth[Function: getDepth]
createDodecahedronGeometry[Function: createDodecahedronGeometry]
getDodecahedronColoredMaterial[Function: getDodecahedronColoredMaterial]
getIndicatorMaterial[Function: getIndicatorMaterial]
cubeTransformMap[Function: cubeTransformMap]
dodecahedronTransformMap[Function: dodecahedronTransformMap]
tetrahedronTransformMap[Function: tetrahedronTransformMap]
_buildTetraGeometry[Function: _buildTetraGeometry]
createLoaders[Function: createLoaders]
getGuestId[Function: getGuestId]
senderInitials[Function: senderInitials]
mergeMessages[Function: mergeMessages]
getInitials[Function: getInitials]
_createTriangleGeometry[Function: _createTriangleGeometry]
getTetrahedronColoredMaterial[Function: getTetrahedronColoredMaterial]
lerpVector[Function: lerpVector]
applyVideoTexture[Function: applyVideoTexture]
stringToColor[Function: stringToColor]
CubeOutline[Function: CubeOutline]
DodecahedronWireframe[Function: DodecahedronWireframe]
generateDodecahedronEdges[Function: generateDodecahedronEdges]
FakeGlowMaterial[Function: FakeGlowMaterial]
LandingApp[Function: LandingApp]
createUserDocument[Function: createUserDocument]
handleLogin[Function: handleLogin]
handleLogout[Function: handleLogout]
navigateToSpace[Function: navigateToSpace]
fetchUserSpaces[Function: fetchUserSpaces]
createNewSpace[Function: createNewSpace]
handleShareSpace[Function: handleShareSpace]
handleDeleteSpace[Function: handleDeleteSpace]
handleLeaveSpace[Function: handleLeaveSpace]
handleFirstCubeComplete[Function: handleFirstCubeComplete]
handleDodecahedronComplete[Function: handleDodecahedronComplete]
handleAcceptInvite[Function: handleAcceptInvite]
handleDeclineInvite[Function: handleDeclineInvite]
spaceTableProps[Function: spaceTableProps]
createSpaceProps[Function: createSpaceProps]
sharePopupProps[Function: sharePopupProps]
Loader[Function: Loader]
OrderHeader[Function: OrderHeader]
addSharedSpaceReference[Function: addSharedSpaceReference]
removeSharedSpaceReference[Function: removeSharedSpaceReference]
getSharedSpacesForUser[Function: getSharedSpacesForUser]
removeAllSharedReferences[Function: removeAllSharedReferences]
UpdatesContainer[Function: UpdatesContainer]
UpdatesEditor[Function: UpdatesEditor]
handleKeyCommand[Function: handleKeyCommand]
toggleInlineStyle[Function: toggleInlineStyle]
handleSave[Function: handleSave]
UpdatesViewer[Function: UpdatesViewer]
parsedContent[Function: parsedContent]
formattedTimestamp[Function: formattedTimestamp]
UserForm[Function: UserForm]
Model[Function: Model]
WhitePlane[Function: WhitePlane]
planeGeometry[Function: planeGeometry]
gridTexture[Function: gridTexture]
estimateNodeSize[Function: estimateNodeSize]
isHierarchyConnection[Function: isHierarchyConnection]
filterConnections[Function: filterConnections]
layoutNodes[Function: layoutNodes]
layoutEdges[Function: layoutEdges]
computeSize[Function: computeSize]
computeSubtreeWidth[Function: computeSubtreeWidth]
positionTree[Function: positionTree]
positionContained[Function: positionContained]
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
useAnimatedLine[Function: useAnimatedLine]
useAnimationStats[Function: useAnimationStats]
useConnectionObjects[Function: useConnectionObjects]
usePathfindingObjects[Function: usePathfindingObjects]
useConnectionObjectPositions[Function: useConnectionObjectPositions]
useConnections[Function: useConnections]
userId[Function: userId]
useConnectionsRendererStore[Function: useConnectionsRendererStore]
useConnectionState[Function: useConnectionState]
useConnectionActions[Function: useConnectionActions]
useDebouncedUpdate[Function: useDebouncedUpdate]
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
objectsByCellId[Function: objectsByCellId]
connectionsByCellId[Function: connectionsByCellId]
params[Function: params]
EXCLUDED_PROFILER_NAMES[Function: EXCLUDED_PROFILER_NAMES]
BUNDLE_NOISE_NAMES[Function: BUNDLE_NOISE_NAMES]
bundleComponents[Function: bundleComponents]
bundleHooks[Function: bundleHooks]
bundleFunctions[Function: bundleFunctions]
urlObj[Function: urlObj]
seen[Function: seen]
seenFns[Function: seenFns]
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
dummyUnsubscribe[Function: dummyUnsubscribe]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
resolveConnectionPositions[Function: resolveConnectionPositions]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
resolveConnectionEndpoint[Function: resolveConnectionEndpoint]
positionsEqual[Function: positionsEqual]
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
connectionListeners[Function: connectionListeners]
globalActiveListeners[Function: globalActiveListeners]
notifyConnectionListeners[Function: notifyConnectionListeners]
connectionCache[Function: connectionCache]
clearConnectionCache[Function: clearConnectionCache]
connectionDataChanged[Function: connectionDataChanged]
serializeConnection[Function: serializeConnection]
subscribeToCellConnections[Function: subscribeToCellConnections]
unsubscribeFunctions[Function: unsubscribeFunctions]
activeSubscriptionCells[Function: activeSubscriptionCells]
startCellSubscriptions[Function: startCellSubscriptions]
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
getFileTypeFromPath[Function: getFileTypeFromPath]
analyzeFile[Function: analyzeFile]
containsJSX[Function: containsJSX]
detectRepoType[Function: detectRepoType]
sanitizeNodeId[Function: sanitizeNodeId]
traverseVanillaAST[Function: traverseVanillaAST]
exportedNames[Function: exportedNames]
ensureContainer[Function: ensureContainer]
addSymbol[Function: addSymbol]
addVariableDecl[Function: addVariableDecl]
trackRelativeSource[Function: trackRelativeSource]
importBindings[Function: importBindings]
traversePythonSource[Function: traversePythonSource]
localNames[Function: localNames]
traverseVueSource[Function: traverseVueSource]
componentFunctions[Function: componentFunctions]
componentRelationships[Function: componentRelationships]
componentDependencies[Function: componentDependencies]
internalComponents[Function: internalComponents]
exportedComponents[Function: exportedComponents]
fileFunctions[Function: fileFunctions]
internalHooks[Function: internalHooks]
filesNeedingSuffix[Function: filesNeedingSuffix]
functionCallRelationships[Function: functionCallRelationships]
componentPropsRelationships[Function: componentPropsRelationships]
storeUsageRelationships[Function: storeUsageRelationships]
hookReturnValueRelationships[Function: hookReturnValueRelationships]
moduleImportRelationships[Function: moduleImportRelationships]
nextjsRouteMap[Function: nextjsRouteMap]
apiEndpoints[Function: apiEndpoints]
dbModels[Function: dbModels]
authGuards[Function: authGuards]
eventEmitters[Function: eventEmitters]
eventListeners[Function: eventListeners]
errorBoundaries[Function: errorBoundaries]
suspenseBoundaries[Function: suspenseBoundaries]
sharedInterfaces[Function: sharedInterfaces]
interfaceUsages[Function: interfaceUsages]
traverse[Function: traverse]
isMiddlewareParams[Function: isMiddlewareParams]
knownContainers[Function: knownContainers]
generateMerfolkMarkdown[Function: generateMerfolkMarkdown]
storesSet[Function: storesSet]
servicesSet[Function: servicesSet]
classesSet[Function: classesSet]
constantsSet[Function: constantsSet]
variablesSet[Function: variablesSet]
componentInternalFunctions[Function: componentInternalFunctions]
componentsSet[Function: componentsSet]
filtered[Function: filtered]
hooksSet[Function: hooksSet]
servicesSetForFilter[Function: servicesSetForFilter]
storesSetForFilter[Function: storesSetForFilter]
utilitiesSetForFilter[Function: utilitiesSetForFilter]
nodeIds[Function: nodeIds]
childToParentMap[Function: childToParentMap]
allSymbolNames[Function: allSymbolNames]
generateRoutedConnection[Function: generateRoutedConnection]
resolveId[Function: resolveId]
allComponentFunctions[Function: allComponentFunctions]
resolveRouteNodeId[Function: resolveRouteNodeId]
routeGroups[Function: routeGroups]
routeRepresentative[Function: routeRepresentative]
allEventNames[Function: allEventNames]
currentParams[Function: currentParams]
restoredParams[Function: restoredParams]
newUrl[Function: newUrl]
successParams[Function: successParams]
failParams[Function: failParams]
markdownBlob[Function: markdownBlob]
markdownFile[Function: markdownFile]
extractMerfolkNodeIds[Function: extractMerfolkNodeIds]
filterNewMerfolkNodes[Function: filterNewMerfolkNodes]
extractContent[Function: extractContent]
initializeOptimizationCoordinator[Function: initializeOptimizationCoordinator]
getOptimizationStatus[Function: getOptimizationStatus]
consolidateSystem[Function: consolidateSystem]
cleanupOptimizationCoordinator[Function: cleanupOptimizationCoordinator]
spatialManager[Function: spatialManager]
unifiedCache[Function: unifiedCache]
cacheStats[Function: cacheStats]
later[Function: later]
cache[Function: cache]
memoized[Function: memoized]
session[Function: session]
globalOptimizationCoordinator[Function: globalOptimizationCoordinator]
getOrCreateSubscription[Function: getOrCreateSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
globalSubscriptions[Function: globalSubscriptions]
decrementSubscription[Function: decrementSubscription]
periodicCleanup[Function: periodicCleanup]
connectionTags[Function: connectionTags]
addTag[Function: addTag]
existingConnectionPairs[Function: existingConnectionPairs]
getFaceForObject[Function: getFaceForObject]
computeFaceWorldPosition[Function: computeFaceWorldPosition]
calculateDodecahedronFaceCenter[Function: calculateDodecahedronFaceCenter]
connectionsByCell[Function: connectionsByCell]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
groupedByType[Function: groupedByType]
createContainerForGroup[Function: createContainerForGroup]
reachableFromRootModules[Function: reachableFromRootModules]
markReachable[Function: markReachable]
componentsWithChildContainers[Function: componentsWithChildContainers]
nodesInChildContainers[Function: nodesInChildContainers]
markDescendantsInChildContainers[Function: markDescendantsInChildContainers]
nodesWithContainers[Function: nodesWithContainers]
visited[Function: visited]
adjustNodeAndDescendants[Function: adjustNodeAndDescendants]
containerDimensions[Function: containerDimensions]
parentChildMap[Function: parentChildMap]
childParentMap[Function: childParentMap]
rootNodes[Function: rootNodes]
internalComponentChildren[Function: internalComponentChildren]
componentConnectionTypes[Function: componentConnectionTypes]
wouldCreateCycle[Function: wouldCreateCycle]
dfs[Function: dfs]
warnedCycles[Function: warnedCycles]
addParentChildRelation[Function: addParentChildRelation]
isCubeChild[Function: isCubeChild]
processedNodes[Function: processedNodes]
existingNodeIdMap[Function: existingNodeIdMap]
calculateHeaderStyle[Function: calculateHeaderStyle]
moveComponentTree[Function: moveComponentTree]
getComponentChildren[Function: getComponentChildren]
checkOverlap[Function: checkOverlap]
containersByLevel[Function: containersByLevel]
resolveNodeMove[Function: resolveNodeMove]
calculateNodeScaleFromChildren[Function: calculateNodeScaleFromChildren]
calculateGroupSpacing[Function: calculateGroupSpacing]
calculateGroupBounds[Function: calculateGroupBounds]
positionGroup[Function: positionGroup]
cameraDirection[Function: cameraDirection]
allNodes[Function: allNodes]
allConnections[Function: allConnections]
nodeToObjectIdMap[Function: nodeToObjectIdMap]
reader[Function: reader]
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
_disposedWeakSet[Function: _disposedWeakSet]
validateScanUrl[Function: validateScanUrl]
scanWebsiteAndGenerateDiagram[Function: scanWebsiteAndGenerateDiagram]
sanitizeId[Function: sanitizeId]
simulateProgress[Function: simulateProgress]
screenRecorder[Function: screenRecorder]
rawBlob[Function: rawBlob]
sharedSpacesCacheSet[Function: sharedSpacesCacheSet]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
sharedSpacesCache[Function: sharedSpacesCache]
urlParams[Function: urlParams]
generateSharingUrl[Function: generateSharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]
sharingUrl[Function: sharingUrl]
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
deletingObjects[Function: deletingObjects]
pendingSaves[Function: pendingSaves]
saves[Function: saves]
removeObjectFromCaches[Function: removeObjectFromCaches]
VOLATILE_KEYS[Function: VOLATILE_KEYS]
computeNonPositionFingerprint[Function: computeNonPositionFingerprint]
clearCellCache[Function: clearCellCache]
objectSubscriptionsByCell[Function: objectSubscriptionsByCell]
localSubscriptionKeys[Function: localSubscriptionKeys]
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
cellExistenceCache[Function: cellExistenceCache]
cleanupCache[Function: cleanupCache]
createCellsBatchOptimized[Function: createCellsBatchOptimized]
cellCallbacks[Function: cellCallbacks]
normalizePosition[Function: normalizePosition]
seenConnectionIds[Function: seenConnectionIds]
uploadImageToStorage[Function: uploadImageToStorage]
uploadModelToStorage[Function: uploadModelToStorage]
uploadMarkdownToStorage[Function: uploadMarkdownToStorage]
getStorageInstance[Function: getStorageInstance]
ALLOWED_IMAGE_TYPES[Function: ALLOWED_IMAGE_TYPES]
uploadFileGeneric[Function: uploadFileGeneric]
blob[Function: blob]
getStreamlinedSpatialManager[Function: getStreamlinedSpatialManager]
initializeStreamlinedSpatialPartitioning[Function: initializeStreamlinedSpatialPartitioning]
benchmarkStreamlinedSystem[Function: benchmarkStreamlinedSystem]
manager[Function: manager]
unifiedCacheManager[Function: unifiedCacheManager]
initWebRTC[Function: initWebRTC]
startBroadcasting[Function: startBroadcasting]
joinBroadcast[Function: joinBroadcast]
isPlaneBeingBroadcast[Function: isPlaneBeingBroadcast]
findAvailableBroadcasts[Function: findAvailableBroadcasts]
cleanupWebRTC[Function: cleanupWebRTC]
registerUserPresence[Function: registerUserPresence]
subscribeToUsersInSpace[Function: subscribeToUsersInSpace]
activeStreams[Function: activeStreams]
getRTCConfiguration[Function: getRTCConfiguration]
peerConnection[Function: peerConnection]
broadcastSession[Function: broadcastSession]
activeUsers[Function: activeUsers]
fiveMinutesAgo[Function: fiveMinutesAgo]

%% Stores
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
useAuthStore[[Store: useAuthStore]]
useColorPickerStore[[Store: useColorPickerStore]]
useConnectionStore[[Store: useConnectionStore]]
useCubeStore[[Store: useCubeStore]]
useDiagramStore[[Store: useDiagramStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]
useFaceIndicatorStore[[Store: useFaceIndicatorStore]]
useFaceStore[[Store: useFaceStore]]
useIndicatorsStore[[Store: useIndicatorsStore]]
useLODStore[[Store: useLODStore]]
useObjectsStore[[Store: useObjectsStore]]
usePlaneStore[[Store: usePlaneStore]]
usePublicSpaceStore[[Store: usePublicSpaceStore]]
useScreenShareStore[[Store: useScreenShareStore]]
useSpaceManagerStore[[Store: useSpaceManagerStore]]
useSpatialManagerStore[[Store: useSpatialManagerStore]]
useTetrahedronStore[[Store: useTetrahedronStore]]
useTextAtlasStore[[Store: useTextAtlasStore]]
useTextInputStore[[Store: useTextInputStore]]
useTextObjectStore[[Store: useTextObjectStore]]
useTransformControlsStore[[Store: useTransformControlsStore]]
useUIOverlayStore[[Store: useUIOverlayStore]]
useWebcamStreamStore[[Store: useWebcamStreamStore]]

%% Utilities
selectAuth[Function: selectAuth]
selectAuthState[Function: selectAuthState]
ConnectionAnimationManager[Function: ConnectionAnimationManager]
objectPositionEqual[Function: objectPositionEqual]
selectConnectionHookState[Function: selectConnectionHookState]
spaceId[Function: spaceId]
stableLoadedCells[Function: stableLoadedCells]
connectionCallback[Function: connectionCallback]
enhancedConnectionCallback[Function: enhancedConnectionCallback]
handleLineStyleChange[Function: handleLineStyleChange]
handleLineColorChange[Function: handleLineColorChange]
handleConnectionClick[Function: handleConnectionClick]
handleLineTextClick[Function: handleLineTextClick]
handleLineTextSubmit[Function: handleLineTextSubmit]
handleLineTextStyleChange[Function: handleLineTextStyleChange]
getConnectionStateSelector[Function: getConnectionStateSelector]
cleanupStaleSelectors[Function: cleanupStaleSelectors]
actionsSelector[Function: actionsSelector]
selector[Function: selector]
cleanup[Function: cleanup]
isConnectionVisible[Function: isConnectionVisible]
objectPositions[Function: objectPositions]
visibleConnections[Function: visibleConnections]
handleGlobalClick[Function: handleGlobalClick]
selectObjectsHookState[Function: selectObjectsHookState]
handleCreateObject[Function: handleCreateObject]
handleObjectDelete[Function: handleObjectDelete]
registerTransformingObject[Function: registerTransformingObject]
selectSpaceManagerState[Function: selectSpaceManagerState]
loadedCellsKey[Function: loadedCellsKey]
memoizedLoadedCells[Function: memoizedLoadedCells]
setupCameraListeners[Function: setupCameraListeners]
handleCameraMove[Function: handleCameraMove]
addObjectToSpatialSystemWrapper[Function: addObjectToSpatialSystemWrapper]
moveObjectInSpatialSystemWrapper[Function: moveObjectInSpatialSystemWrapper]
loadCellWrapper[Function: loadCellWrapper]
updateCameraPositionWrapper[Function: updateCameraPositionWrapper]
updateTexture[Function: updateTexture]
setNamedTimeout[Function: setNamedTimeout]
clearNamedTimeout[Function: clearNamedTimeout]
clearAllTimeouts[Function: clearAllTimeouts]
hasActiveTimeout[Function: hasActiveTimeout]
getTimeoutId[Function: getTimeoutId]
handleResize[Function: handleResize]
line_frag_glsl[Function: line_frag_glsl]
line_vert_glsl[Function: line_vert_glsl]
monitorConnection[Function: monitorConnection]
connectionHandler[Function: connectionHandler]
handleUrlAuthLocal[Function: handleUrlAuthLocal]
initAuth[Function: initAuth]
_buildConnectionsByObjectId[Function: _buildConnectionsByObjectId]
getCellCoords[Function: getCellCoords]
getCellIdFromCoords[Function: getCellIdFromCoords]
getCubeSelector[Function: getCubeSelector]
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
calculateLODLevel[Function: calculateLODLevel]
calculateParentLODLevel[Function: calculateParentLODLevel]
numericHash[Function: numericHash]
stringHash[Function: stringHash]
useStoreInitialization[Function: useStoreInitialization]
useCubeSelectors[Function: useCubeSelectors]
useCubeActions[Function: useCubeActions]
usePlaneSelectors[Function: usePlaneSelectors]
usePlaneActions[Function: usePlaneActions]
useGlobalStoreUtils[Function: useGlobalStoreUtils]
clearAllSelections[Function: clearAllSelections]
resetAllStores[Function: resetAllStores]
setCellBoundariesVisible[Function: setCellBoundariesVisible]
registerMaterial[Function: registerMaterial]
unregisterMaterial[Function: unregisterMaterial]
setAnimationSpeed[Function: setAnimationSpeed]
initAnimationSystem[Function: initAnimationSystem]
animatedMaterials[Function: animatedMaterials]
startAnimationLoop[Function: startAnimationLoop]
animate[Function: animate]
stopAnimationLoop[Function: stopAnimationLoop]
initBVHRaycasting[Function: initBVHRaycasting]
getBVH[Function: getBVH]
updateBVHObjects[Function: updateBVHObjects]
bvhIntersectObjects[Function: bvhIntersectObjects]
getBVHStats[Function: getBVHStats]
updateLODLevels[Function: updateLODLevels]
registerObjectRelationships[Function: registerObjectRelationships]
_tempBox3[Function: _tempBox3]
_tempVec3A[Function: _tempVec3A]
_tempVec3B[Function: _tempVec3B]
_tempVec3C[Function: _tempVec3C]
_tempVec3D[Function: _tempVec3D]
_tempSize[Function: _tempSize]
_tempCenter[Function: _tempCenter]
_tempMin[Function: _tempMin]
_tempMax[Function: _tempMax]
_lodCameraPos[Function: _lodCameraPos]
_lodObjectPos[Function: _lodObjectPos]
_segmentDir[Function: _segmentDir]
_rayToStart[Function: _rayToStart]
_pointOnRay[Function: _pointOnRay]
_pointOnSegment[Function: _pointOnSegment]
_intersectionPoint[Function: _intersectionPoint]
_cameraPos[Function: _cameraPos]
leftChild[Function: leftChild]
rightChild[Function: rightChild]
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
worldPos[Function: worldPos]
offsetVec[Function: offsetVec]
indicatorPos[Function: indicatorPos]
logAnimation[Function: logAnimation]
forceAnimateConnection[Function: forceAnimateConnection]
shouldAnimateConnection[Function: shouldAnimateConnection]
recordFrameTime[Function: recordFrameTime]
recordStateUpdate[Function: recordStateUpdate]
getPerfStats[Function: getPerfStats]
resetPerfStats[Function: resetPerfStats]
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
getIdFromIndicator[Function: getIdFromIndicator]
calculateFacePosition[Function: calculateFacePosition]
tempWorldPos[Function: tempWorldPos]
tempWorldScale[Function: tempWorldScale]
tempOffsetVec[Function: tempOffsetVec]
tempMatrix[Function: tempMatrix]
_avg3[Function: _avg3]
frameCounter[Function: frameCounter]
gpuTracker[Function: gpuTracker]
getIsInitialLoading[Function: getIsInitialLoading]
setIsInitialLoading[Function: setIsInitialLoading]
handleObjectMove[Function: handleObjectMove]
handleObjectUpdate[Function: handleObjectUpdate]
objectVirtualizer[Function: objectVirtualizer]
_tempVec[Function: _tempVec]
_sphereCenter[Function: _sphereCenter]
_tempSphere[Function: _tempSphere]
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
intersectionCache[Function: intersectionCache]
pathCache[Function: pathCache]
objectPositionCache[Function: objectPositionCache]
_tempDir[Function: _tempDir]
_tempResult[Function: _tempResult]
_tempBoxCenter[Function: _tempBoxCenter]
_tempClosest[Function: _tempClosest]
_tempLineToCenter[Function: _tempLineToCenter]
_tempBoxRadiusVec[Function: _tempBoxRadiusVec]
_tempCurveStart[Function: _tempCurveStart]
_tempCurveEnd[Function: _tempCurveEnd]
_tempCurveDir[Function: _tempCurveDir]
_tempRay[Function: _tempRay]
_tempIntersectTarget[Function: _tempIntersectTarget]
precomputedResults[Function: precomputedResults]
d[Function: d]
cliLineStart[Function: cliLineStart]
cliLineEnd[Function: cliLineEnd]
ray[Function: ray]
center[Function: center]
bbox[Function: bbox]
startVec[Function: startVec]
endVec[Function: endVec]
line[Function: line]
hitPoint[Function: hitPoint]
centerPoint[Function: centerPoint]
curve[Function: curve]
requestsById[Function: requestsById]
calculateMidpoint[Function: calculateMidpoint]
calculateMidpointVector[Function: calculateMidpointVector]
lerp[Function: lerp]
checkPositionJitter[Function: checkPositionJitter]
tempVec1[Function: tempVec1]
tempVec2[Function: tempVec2]
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
tempCurrentPos[Function: tempCurrentPos]
tempObjPos[Function: tempObjPos]
tempAxisDir[Function: tempAxisDir]
tempToPoint[Function: tempToPoint]
tempProjection[Function: tempProjection]
tempPerpendicular[Function: tempPerpendicular]
tempProjectedPoint[Function: tempProjectedPoint]
createStreamlinedSpatialIndex[Function: createStreamlinedSpatialIndex]
benchmarkStreamlined[Function: benchmarkStreamlined]
seenObjects[Function: seenObjects]
position[Function: position]
isOffscreenCanvasTextSupported[Function: isOffscreenCanvasTextSupported]
_switchToSyncAtlas[Function: _switchToSyncAtlas]
getGlobalTextAtlas[Function: getGlobalTextAtlas]
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
createAtlasTextMesh[Function: createAtlasTextMesh]
page[Function: page]
c[Function: c]
tex[Function: tex]
geometry[Function: geometry]
material[Function: material]
mesh[Function: mesh]
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
loadTextureFromBlob[Function: loadTextureFromBlob]
url[Function: url]
img[Function: img]
texture[Function: texture]
throttle[Function: throttle]
debounce[Function: debounce]
measurePerformance[Function: measurePerformance]
scheduleWork[Function: scheduleWork]
memoize[Function: memoize]
trackLCP[Function: trackLCP]
createCacheKey[Function: createCacheKey]
observer[Function: observer]
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
appObjects[Function: appObjects]
appCanViewSpace[Function: appCanViewSpace]
appShouldRedirect[Function: appShouldRedirect]
appSpatialManagerDebug[Function: appSpatialManagerDebug]
appCheckPositionJitterWithHistory[Function: appCheckPositionJitterWithHistory]
appLoadedCellsKey[Function: appLoadedCellsKey]
appDisableOrbitControls[Function: appDisableOrbitControls]
appEnableOrbitControls[Function: appEnableOrbitControls]
appUpdateVisibleObjects[Function: appUpdateVisibleObjects]
appThrottledUpdateVisibility[Function: appThrottledUpdateVisibility]
appDeviceInfo[Function: appDeviceInfo]
appCanvasSettings[Function: appCanvasSettings]
appPerformInitialObjectFetch[Function: appPerformInitialObjectFetch]
appScheduleLoadingComplete[Function: appScheduleLoadingComplete]
animatedconnectionlineStructuralKey[Function: animatedconnectionlineStructuralKey]
atlastextspriteAtlas[Function: atlastextspriteAtlas]
atlastextspriteCalculatedPosition[Function: atlastextspriteCalculatedPosition]
batchedconnectionlinesStraightConnections[Function: batchedconnectionlinesStraightConnections]
batchedconnectionlinesCustomRaycast[Function: batchedconnectionlinesCustomRaycast]
batchedcurvedlinesPathsData[Function: batchedcurvedlinesPathsData]
batchedcurvedlinesCustomRaycast[Function: batchedcurvedlinesCustomRaycast]
cellboundaryrendererBuildGeometry[Function: cellboundaryrendererBuildGeometry]
connectionGetLineWidth[Function: connectionGetLineWidth]
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
connectionsrendererMountNextBatch[Function: connectionsrendererMountNextBatch]
cubeCubeData[Function: cubeCubeData]
cubeIsIndicatorConnected[Function: cubeIsIndicatorConnected]
cubeIsIndicatorActive[Function: cubeIsIndicatorActive]
cubeGetUIPositions[Function: cubeGetUIPositions]
cubeShouldShowIndicator[Function: cubeShouldShowIndicator]
cubeHasConnectedIndicators[Function: cubeHasConnectedIndicators]
cubeGetFaceTextOffset[Function: cubeGetFaceTextOffset]
cubeUpdateDatabase[Function: cubeUpdateDatabase]
cubeDebouncedUpdate[Function: cubeDebouncedUpdate]
cubeRenderFaces[Function: cubeRenderFaces]
cubeRenderFaceTexts[Function: cubeRenderFaceTexts]
cubefaceFaceStateSelector[Function: cubefaceFaceStateSelector]
cubefaceFaceMaterial[Function: cubefaceFaceMaterial]
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
sphereDodecahedronData[Function: sphereDodecahedronData]
sphereUpdateObjectAndStores[Function: sphereUpdateObjectAndStores]
sphereUpdateFaceProperty[Function: sphereUpdateFaceProperty]
sphereIsIndicatorConnected[Function: sphereIsIndicatorConnected]
sphereUpdateDatabase[Function: sphereUpdateDatabase]
sphereGetUIPosition[Function: sphereGetUIPosition]
sphereGetHeaderPosition[Function: sphereGetHeaderPosition]
sphereGetFaceUIPosition[Function: sphereGetFaceUIPosition]
sphereGetFaceTextPosition[Function: sphereGetFaceTextPosition]
sphereGetFaceInfo[Function: sphereGetFaceInfo]
sphereGetFaceRotation[Function: sphereGetFaceRotation]
sphereShouldShowFaceIndicator[Function: sphereShouldShowFaceIndicator]
sphereGetHeaderInputPosition[Function: sphereGetHeaderInputPosition]
dodecahedronfaceFaceMaterial[Function: dodecahedronfaceFaceMaterial]
dodecahedronfaceInverseScale[Function: dodecahedronfaceInverseScale]
dodecahedronfaceAdjustedTextPosition[Function: dodecahedronfaceAdjustedTextPosition]
faceindicatorMaterial[Function: faceindicatorMaterial]
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
instancedatlastextAtlas[Function: instancedatlastextAtlas]
instancedatlastextPageGroups[Function: instancedatlastextPageGroups]
pageinstancedmeshGeometry[Function: pageinstancedmeshGeometry]
pageinstancedmeshMaterial[Function: pageinstancedmeshMaterial]
instancedlineFlatPoints[Function: instancedlineFlatPoints]
instancedlineGeometry[Function: instancedlineGeometry]
instancedlineCustomRaycast[Function: instancedlineCustomRaycast]
instancedlineMaterial[Function: instancedlineMaterial]
lineuiGetFullStyle[Function: lineuiGetFullStyle]
lineuiGetBaseStyle[Function: lineuiGetBaseStyle]
lodmanagerContainersKey[Function: lodmanagerContainersKey]
lodmanagerComputeContainmentSync[Function: lodmanagerComputeContainmentSync]
lodmanagerEnqueueLODUpdates[Function: lodmanagerEnqueueLODUpdates]
objectsrendererProgressiveVisibleObjects[Function: objectsrendererProgressiveVisibleObjects]
objectsrendererCubeObjects[Function: objectsrendererCubeObjects]
objectsrendererContainerHeaders[Function: objectsrendererContainerHeaders]
objectsrendererDodecahedronObjects[Function: objectsrendererDodecahedronObjects]
objectsrendererTetrahedronObjects[Function: objectsrendererTetrahedronObjects]
objectsrendererRenderedObjects[Function: objectsrendererRenderedObjects]
objectsrendererMountNextBatch[Function: objectsrendererMountNextBatch]
objectsrendererMountResume[Function: objectsrendererMountResume]
planePlaneData[Function: planePlaneData]
planeCloseAllUIs[Function: planeCloseAllUIs]
planeUpdateDatabase[Function: planeUpdateDatabase]
planeIsIndicatorConnected[Function: planeIsIndicatorConnected]
planeShouldShowIndicator[Function: planeShouldShowIndicator]
planeUiPositions[Function: planeUiPositions]
planeIndicatorPosition[Function: planeIndicatorPosition]
planeMeshMaterial[Function: planeMeshMaterial]
planeLineMaterialProps[Function: planeLineMaterialProps]
planeBorderEdgePoints[Function: planeBorderEdgePoints]
realtimeconnectionupdaterRunConnectionUpdate[Function: realtimeconnectionupdaterRunConnectionUpdate]
realtimeconnectionupdaterRebuildConnectionMap[Function: realtimeconnectionupdaterRebuildConnectionMap]
realtimeconnectionupdaterUpdateConnectionEndpoint[Function: realtimeconnectionupdaterUpdateConnectionEndpoint]
screensharestreamScreenShareConstraints[Function: screensharestreamScreenShareConstraints]
screensharestreamAttemptPlay[Function: screensharestreamAttemptPlay]
screensharestreamConnectToBroadcast[Function: screensharestreamConnectToBroadcast]
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
tetrahedronUpdateDatabase[Function: tetrahedronUpdateDatabase]
tetrahedronGetFaceTextOffset[Function: tetrahedronGetFaceTextOffset]
tetrahedronRenderFaceTexts[Function: tetrahedronRenderFaceTexts]
tetrahedronRenderFaces[Function: tetrahedronRenderFaces]
tetrahedronfaceFaceMaterial[Function: tetrahedronfaceFaceMaterial]
tetrahedronfaceGetFaceTextOffset[Function: tetrahedronfaceGetFaceTextOffset]
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
textobjectGetIndicatorOffset[Function: textobjectGetIndicatorOffset]
textobjectIsIndicatorConnected[Function: textobjectIsIndicatorConnected]
textobjectShouldShowIndicator[Function: textobjectShouldShowIndicator]
textobjectGetIndicatorPositions[Function: textobjectGetIndicatorPositions]
textobjectUpdateWorldMatrix[Function: textobjectUpdateWorldMatrix]
textobjectCloseAllUIs[Function: textobjectCloseAllUIs]
textobjectUpdateDatabase[Function: textobjectUpdateDatabase]
textobjectAutoResizeTextAreaOnly[Function: textobjectAutoResizeTextAreaOnly]
textobjectAutoResizeTextArea[Function: textobjectAutoResizeTextArea]
textobjectGetTextAreaStyle[Function: textobjectGetTextAreaStyle]
textobjectGetContainerStyle[Function: textobjectGetContainerStyle]
textobjectGetEffectivePosition[Function: textobjectGetEffectivePosition]
textobjectApplyStyleToSelectionInternal[Function: textobjectApplyStyleToSelectionInternal]
textobjectGetTransformControlSize[Function: textobjectGetTransformControlSize]
textspriteSpriteId[Function: textspriteSpriteId]
textspriteSetIsDragging[Function: textspriteSetIsDragging]
textspriteCalculatedPosition[Function: textspriteCalculatedPosition]
textspriteGetFontSize[Function: textspriteGetFontSize]
textstyleuicontentGetUIScale[Function: textstyleuicontentGetUIScale]
uioverlaySetIsRecording[Function: uioverlaySetIsRecording]
uioverlayFetchRepositories[Function: uioverlayFetchRepositories]
uioverlayFetchAppJsxFromRepo[Function: uioverlayFetchAppJsxFromRepo]
uioverlayCreateTemplate[Function: uioverlayCreateTemplate]
uioverlayTriggerDownload[Function: uioverlayTriggerDownload]
uioverlayHandler[Function: uioverlayHandler]
webcamstreamAttemptPlay[Function: webcamstreamAttemptPlay]
webcamstreamConnectToBroadcast[Function: webcamstreamConnectToBroadcast]
dodecahedronwireframe2GenerateDodecahedronEdges[Function: dodecahedronwireframe2GenerateDodecahedronEdges]
organizationmanagerRefresh[Function: organizationmanagerRefresh]
sharespacepopupFilteredMembers[Function: sharespacepopupFilteredMembers]
sharespacepopupToggleMember[Function: sharespacepopupToggleMember]
spacestableThStyles[Function: spacestableThStyles]
spacestableTdStyles[Function: spacestableTdStyles]
spacestableCategoryRowStyles[Function: spacestableCategoryRowStyles]
spacestableInviteBannerStyle[Function: spacestableInviteBannerStyle]

%% Component-Function Relationships
App -.-> appObjects : "internal function"
App -.-> appCanViewSpace : "internal function"
App -.-> appShouldRedirect : "boolean check"
App -.-> appSpatialManagerDebug : "internal function"
App -.-> appCheckPositionJitterWithHistory : "boolean check"
App -.-> appLoadedCellsKey : "internal function"
App -.-> appDisableOrbitControls : "boolean check"
App -.-> appEnableOrbitControls : "internal function"
App -.-> appUpdateVisibleObjects : "update helper"
App -.-> appThrottledUpdateVisibility : "update helper"
App -.-> appDeviceInfo : "internal function"
App -.-> appCanvasSettings : "setter function"
App -.-> appPerformInitialObjectFetch : "internal function"
App -.-> appScheduleLoadingComplete : "internal function"
AnimatedConnectionLine -.-> animatedconnectionlineStructuralKey : "internal function"
AtlasTextSprite -.-> atlastextspriteAtlas : "internal function"
AtlasTextSprite -.-> atlastextspriteCalculatedPosition : "calculation helper"
BatchedConnectionLines -.-> batchedconnectionlinesStraightConnections : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesCustomRaycast : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesPathsData : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesCustomRaycast : "internal function"
CellBoundaryRenderer -.-> cellboundaryrendererBuildGeometry : "render helper"
Connection -.-> connectionGetLineWidth : "getter function"
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
ConnectionsRenderer -.-> connectionsrendererMountNextBatch : "render helper"
Cube -.-> cubeCubeData : "internal function"
Cube -.-> cubeIsIndicatorConnected : "boolean check"
Cube -.-> cubeIsIndicatorActive : "boolean check"
Cube -.-> cubeGetUIPositions : "getter function"
Cube -.-> cubeShouldShowIndicator : "boolean check"
Cube -.-> cubeHasConnectedIndicators : "internal function"
Cube -.-> cubeGetFaceTextOffset : "getter function"
Cube -.-> cubeUpdateDatabase : "update helper"
Cube -.-> cubeDebouncedUpdate : "update helper"
Cube -.-> cubeRenderFaces : "render helper"
Cube -.-> cubeRenderFaceTexts : "render helper"
CubeFace -.-> cubefaceFaceStateSelector : "internal function"
CubeFace -.-> cubefaceFaceMaterial : "internal function"
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
Sphere -.-> sphereDodecahedronData : "internal function"
Sphere -.-> sphereUpdateObjectAndStores : "update helper"
Sphere -.-> sphereUpdateFaceProperty : "update helper"
Sphere -.-> sphereIsIndicatorConnected : "boolean check"
Sphere -.-> sphereUpdateDatabase : "update helper"
Sphere -.-> sphereGetUIPosition : "getter function"
Sphere -.-> sphereGetHeaderPosition : "getter function"
Sphere -.-> sphereGetFaceUIPosition : "getter function"
Sphere -.-> sphereGetFaceTextPosition : "getter function"
Sphere -.-> sphereGetFaceInfo : "getter function"
Sphere -.-> sphereGetFaceRotation : "getter function"
Sphere -.-> sphereShouldShowFaceIndicator : "boolean check"
Sphere -.-> sphereGetHeaderInputPosition : "getter function"
DodecahedronFace -.-> dodecahedronfaceFaceMaterial : "internal function"
DodecahedronFace -.-> dodecahedronfaceInverseScale : "internal function"
DodecahedronFace -.-> dodecahedronfaceAdjustedTextPosition : "internal function"
FaceIndicator -.-> faceindicatorMaterial : "internal function"
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
InstancedAtlasText -.-> instancedatlastextAtlas : "internal function"
InstancedAtlasText -.-> instancedatlastextPageGroups : "internal function"
PageInstancedMesh -.-> pageinstancedmeshGeometry : "internal function"
PageInstancedMesh -.-> pageinstancedmeshMaterial : "internal function"
InstancedLine -.-> instancedlineFlatPoints : "internal function"
InstancedLine -.-> instancedlineGeometry : "internal function"
InstancedLine -.-> instancedlineCustomRaycast : "internal function"
InstancedLine -.-> instancedlineMaterial : "internal function"
LineUI -.-> lineuiGetFullStyle : "getter function"
LineUI -.-> lineuiGetBaseStyle : "getter function"
LODManager -.-> lodmanagerContainersKey : "internal function"
LODManager -.-> lodmanagerComputeContainmentSync : "calculation helper"
LODManager -.-> lodmanagerEnqueueLODUpdates : "update helper"
ObjectsRenderer -.-> objectsrendererProgressiveVisibleObjects : "render helper"
ObjectsRenderer -.-> objectsrendererCubeObjects : "render helper"
ObjectsRenderer -.-> objectsrendererContainerHeaders : "render helper"
ObjectsRenderer -.-> objectsrendererDodecahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererTetrahedronObjects : "render helper"
ObjectsRenderer -.-> objectsrendererRenderedObjects : "render helper"
ObjectsRenderer -.-> objectsrendererMountNextBatch : "render helper"
ObjectsRenderer -.-> objectsrendererMountResume : "render helper"
Plane -.-> planePlaneData : "internal function"
Plane -.-> planeCloseAllUIs : "boolean check"
Plane -.-> planeUpdateDatabase : "update helper"
Plane -.-> planeIsIndicatorConnected : "boolean check"
Plane -.-> planeShouldShowIndicator : "boolean check"
Plane -.-> planeUiPositions : "internal function"
Plane -.-> planeIndicatorPosition : "internal function"
Plane -.-> planeMeshMaterial : "internal function"
Plane -.-> planeLineMaterialProps : "internal function"
Plane -.-> planeBorderEdgePoints : "internal function"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRunConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRebuildConnectionMap : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterUpdateConnectionEndpoint : "update helper"
ScreenShareStream -.-> screensharestreamScreenShareConstraints : "internal function"
ScreenShareStream -.-> screensharestreamAttemptPlay : "internal function"
ScreenShareStream -.-> screensharestreamConnectToBroadcast : "internal function"
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
Tetrahedron -.-> tetrahedronUpdateDatabase : "update helper"
Tetrahedron -.-> tetrahedronGetFaceTextOffset : "getter function"
Tetrahedron -.-> tetrahedronRenderFaceTexts : "render helper"
Tetrahedron -.-> tetrahedronRenderFaces : "render helper"
TetrahedronFace -.-> tetrahedronfaceFaceMaterial : "internal function"
TetrahedronFace -.-> tetrahedronfaceGetFaceTextOffset : "getter function"
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
TextObject -.-> textobjectGetIndicatorOffset : "getter function"
TextObject -.-> textobjectIsIndicatorConnected : "boolean check"
TextObject -.-> textobjectShouldShowIndicator : "boolean check"
TextObject -.-> textobjectGetIndicatorPositions : "getter function"
TextObject -.-> textobjectUpdateWorldMatrix : "update helper"
TextObject -.-> textobjectCloseAllUIs : "boolean check"
TextObject -.-> textobjectUpdateDatabase : "update helper"
TextObject -.-> textobjectAutoResizeTextAreaOnly : "internal function"
TextObject -.-> textobjectAutoResizeTextArea : "internal function"
TextObject -.-> textobjectGetTextAreaStyle : "getter function"
TextObject -.-> textobjectGetContainerStyle : "getter function"
TextObject -.-> textobjectGetEffectivePosition : "getter function"
TextObject -.-> textobjectApplyStyleToSelectionInternal : "internal function"
TextObject -.-> textobjectGetTransformControlSize : "getter function"
TextSprite -.-> textspriteSpriteId : "internal function"
TextSprite -.-> textspriteSetIsDragging : "setter function"
TextSprite -.-> textspriteCalculatedPosition : "calculation helper"
TextSprite -.-> textspriteGetFontSize : "getter function"
TextStyleUIContent -.-> textstyleuicontentGetUIScale : "getter function"
UIOverlay -.-> uioverlaySetIsRecording : "setter function"
UIOverlay -.-> uioverlayFetchRepositories : "internal function"
UIOverlay -.-> uioverlayFetchAppJsxFromRepo : "internal function"
UIOverlay -.-> uioverlayCreateTemplate : "internal function"
UIOverlay -.-> uioverlayTriggerDownload : "internal function"
UIOverlay -.-> uioverlayHandler : "event handler"
WebcamStream -.-> webcamstreamAttemptPlay : "internal function"
WebcamStream -.-> webcamstreamConnectToBroadcast : "internal function"
DodecahedronWireframe2 -.-> dodecahedronwireframe2GenerateDodecahedronEdges : "internal function"
OrganizationManager -.-> organizationmanagerRefresh : "internal function"
ShareSpacePopup -.-> sharespacepopupFilteredMembers : "internal function"
ShareSpacePopup -.-> sharespacepopupToggleMember : "internal function"
SpacesTable -.-> spacestableThStyles : "internal function"
SpacesTable -.-> spacestableTdStyles : "internal function"
SpacesTable -.-> spacestableCategoryRowStyles : "internal function"
SpacesTable -.-> spacestableInviteBannerStyle : "internal function"

%% File Container Nodes
backend_index((Service: index))
AppShell_file[Function: AppShell]
useAuth_file[Hook: useAuth]
useAuthState_file[Hook: useAuthState]
useCentralizedBroadcastManager_file[Hook: useCentralizedBroadcastManager]
useConnectionAnimationManager[Hook: useConnectionAnimationManager]
useConnectionObjects_file[Hook: useConnectionObjects]
useConnections_file[Hook: useConnections]
useConnectionsRendererStore_file[Hook: useConnectionsRendererStore]
useDebouncedUpdate_file[Hook: useDebouncedUpdate]
useFrustumCulling[Hook: useFrustumCulling]
useGlobalClickHandler_file[Hook: useGlobalClickHandler]
useIndicators_file[Hook: useIndicators]
useObjects_file[Hook: useObjects]
useSpaceManager_file[Hook: useSpaceManager]
useSpatialManager_file[Hook: useSpatialManager]
useTextureUpdater_file[Hook: useTextureUpdater]
useTimeoutManager_file[Hook: useTimeoutManager]
CubeOutline_file[Function: CubeOutline]
DodecahedronWireframe_file[Function: DodecahedronWireframe]
FakeGlowMaterial_file[Function: FakeGlowMaterial]
useWindowSize_file[Hook: useWindowSize]
LandingApp_file[Function: LandingApp]
Loader_file[Function: Loader]
Order[Function: Order]
sharedSpacesService[Function: sharedSpacesService]
UpdatesContainer_file[Function: UpdatesContainer]
UpdatesEditor_file[Function: UpdatesEditor]
UpdatesViewer_file[Function: UpdatesViewer]
UserForm_file[Function: UserForm]
Volspace[Function: Volspace]
WhitePlane_file[Function: WhitePlane]
authService((Service: authService))
centralizedBroadcastManager_file((Service: centralizedBroadcastManager))
connectionPositionResolver((Service: connectionPositionResolver))
connectionsService((Service: connectionsService))
githubRepoService((Service: githubRepoService))
globalOptimizationCoordinator_file((Service: globalOptimizationCoordinator))
globalSubscriptionManager((Service: globalSubscriptionManager))
constants((Service: constants))
markdownDiagramService_file((Service: markdownDiagramService))
organizationService((Service: organizationService))
presenceService((Service: presenceService))
resourceCleanupService_file((Service: resourceCleanupService))
runtimeScanService((Service: runtimeScanService))
screenRecordingService((Service: screenRecordingService))
sharingService((Service: sharingService))
spacesService((Service: spacesService))
spatialObjectsService((Service: spatialObjectsService))
spatialPartitioning((Service: spatialPartitioning))
storageService((Service: storageService))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
unifiedCacheManager_file((Service: unifiedCacheManager))
webRservice((Service: webRservice))
shader_shaders[Function: shaders]
authStore[[Store: authStore]]
connectionStore[[Store: connectionStore]]
cubeStore[[Store: cubeStore]]
lodStore[[Store: lodStore]]
objectsStore[[Store: objectsStore]]
storeUtils[[Store: storeUtils]]
uiOverlayStore[[Store: uiOverlayStore]]
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
worker_diagramLayoutWorker[Function: diagramLayoutWorker]
worker_diagramLayoutWorkerClient[Function: diagramLayoutWorkerClient]
worker_markdownLayoutWorker[Function: markdownLayoutWorker]
worker_markdownLayoutWorkerClient[Function: markdownLayoutWorkerClient]
worker_pathfindingWorkerClient[Function: pathfindingWorkerClient]
worker_spatialIndexWorker[Function: spatialIndexWorker]
worker_spatialIndexWorkerClient[Function: spatialIndexWorkerClient]
worker_textAtlasWorker[Function: textAtlasWorker]
worker_textAtlasWorkerClient[Function: textAtlasWorkerClient]

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
backend_index -.-> objectsByCellId : "contains"
backend_index -.-> connectionsByCellId : "contains"
backend_index -.-> params : "contains"
backend_index -.-> EXCLUDED_PROFILER_NAMES : "contains"
backend_index -.-> BUNDLE_NOISE_NAMES : "contains"
backend_index -.-> REACT_DEVTOOLS_INJECTION : "contains"
backend_index -.-> getCompName : "contains"
backend_index -.-> walkFiber : "contains"
backend_index -.-> bundleComponents : "contains"
backend_index -.-> bundleHooks : "contains"
backend_index -.-> bundleFunctions : "contains"
backend_index -.-> urlObj : "contains"
backend_index -.-> seen : "contains"
backend_index -.-> seenFns : "contains"
backend_index -.-> dedup : "contains"
AppShell_file -.-> AppShell : "contains"
AppShell_file -.-> handleOpenSpace : "contains"
AppShell_file -.-> handleBackToLanding : "contains"
AppShell_file -.-> handlePopState : "contains"
useAuth_file -.-> useAuth : "contains"
useAuth_file -.-> selectAuth : "contains"
useAuthState_file -.-> useAuthState : "contains"
useAuthState_file -.-> selectAuthState : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
useConnectionObjects_file -.-> objectPositionEqual : "contains"
useConnections_file -.-> useConnections : "contains"
useConnections_file -.-> selectConnectionHookState : "contains"
useConnections_file -.-> spaceId : "contains"
useConnections_file -.-> userId : "contains"
useConnections_file -.-> stableLoadedCells : "contains"
useConnections_file -.-> connectionCallback : "contains"
useConnections_file -.-> enhancedConnectionCallback : "contains"
useConnections_file -.-> handleLineStyleChange : "contains"
useConnections_file -.-> handleLineColorChange : "contains"
useConnections_file -.-> handleConnectionClick : "contains"
useConnections_file -.-> handleLineTextClick : "contains"
useConnections_file -.-> handleLineTextSubmit : "contains"
useConnections_file -.-> handleLineTextStyleChange : "contains"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore_file -.-> useConnectionState : "contains"
useConnectionsRendererStore_file -.-> useConnectionActions : "contains"
useConnectionsRendererStore_file -.-> getConnectionStateSelector : "contains"
useConnectionsRendererStore_file -.-> cleanupStaleSelectors : "contains"
useConnectionsRendererStore_file -.-> actionsSelector : "contains"
useConnectionsRendererStore_file -.-> selector : "contains"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useDebouncedUpdate_file -.-> cleanup : "contains"
useFrustumCulling -.-> isPointInFrustum : "contains"
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> SpatialHash : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
useFrustumCulling -.-> objectPositions : "contains"
useFrustumCulling -.-> visibleConnections : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
useGlobalClickHandler_file -.-> handleGlobalClick : "contains"
useIndicators_file -.-> useIndicators : "contains"
useObjects_file -.-> useObjects : "contains"
useObjects_file -.-> selectObjectsHookState : "contains"
useObjects_file -.-> handleCreateObject : "contains"
useObjects_file -.-> handleObjectDelete : "contains"
useObjects_file -.-> registerTransformingObject : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
useSpaceManager_file -.-> selectSpaceManagerState : "contains"
useSpatialManager_file -.-> useSpatialManager : "contains"
useSpatialManager_file -.-> loadedCellsKey : "contains"
useSpatialManager_file -.-> memoizedLoadedCells : "contains"
useSpatialManager_file -.-> setupCameraListeners : "contains"
useSpatialManager_file -.-> handleCameraMove : "contains"
useSpatialManager_file -.-> addObjectToSpatialSystemWrapper : "contains"
useSpatialManager_file -.-> moveObjectInSpatialSystemWrapper : "contains"
useSpatialManager_file -.-> loadCellWrapper : "contains"
useSpatialManager_file -.-> updateCameraPositionWrapper : "contains"
useTextureUpdater_file -.-> useTextureUpdater : "contains"
useTextureUpdater_file -.-> updateTexture : "contains"
useTimeoutManager_file -.-> useTimeoutManager : "contains"
useTimeoutManager_file -.-> setNamedTimeout : "contains"
useTimeoutManager_file -.-> clearNamedTimeout : "contains"
useTimeoutManager_file -.-> clearAllTimeouts : "contains"
useTimeoutManager_file -.-> hasActiveTimeout : "contains"
useTimeoutManager_file -.-> getTimeoutId : "contains"
CubeOutline_file -.-> CubeOutline : "contains"
DodecahedronWireframe_file -.-> DodecahedronWireframe : "contains"
DodecahedronWireframe_file -.-> generateDodecahedronEdges : "contains"
FakeGlowMaterial_file -.-> FakeGlowMaterial : "contains"
useWindowSize_file -.-> useWindowSize : "contains"
useWindowSize_file -.-> handleResize : "contains"
LandingApp_file -.-> LandingApp : "contains"
LandingApp_file -.-> createUserDocument : "contains"
LandingApp_file -.-> handleLogin : "contains"
LandingApp_file -.-> handleLogout : "contains"
LandingApp_file -.-> navigateToSpace : "contains"
LandingApp_file -.-> fetchUserSpaces : "contains"
LandingApp_file -.-> createNewSpace : "contains"
LandingApp_file -.-> handleShareSpace : "contains"
LandingApp_file -.-> handleDeleteSpace : "contains"
LandingApp_file -.-> handleLeaveSpace : "contains"
LandingApp_file -.-> handleFirstCubeComplete : "contains"
LandingApp_file -.-> handleDodecahedronComplete : "contains"
LandingApp_file -.-> handleAcceptInvite : "contains"
LandingApp_file -.-> handleDeclineInvite : "contains"
LandingApp_file -.-> spaceTableProps : "contains"
LandingApp_file -.-> createSpaceProps : "contains"
LandingApp_file -.-> sharePopupProps : "contains"
Loader_file -.-> Loader : "contains"
Order -.-> OrderHeader : "contains"
sharedSpacesService -.-> addSharedSpaceReference : "contains"
sharedSpacesService -.-> removeSharedSpaceReference : "contains"
sharedSpacesService -.-> getSharedSpacesForUser : "contains"
sharedSpacesService -.-> removeAllSharedReferences : "contains"
UpdatesContainer_file -.-> UpdatesContainer : "contains"
UpdatesEditor_file -.-> UpdatesEditor : "contains"
UpdatesEditor_file -.-> handleKeyCommand : "contains"
UpdatesEditor_file -.-> toggleInlineStyle : "contains"
UpdatesEditor_file -.-> handleSave : "contains"
UpdatesViewer_file -.-> UpdatesViewer : "contains"
UpdatesViewer_file -.-> parsedContent : "contains"
UpdatesViewer_file -.-> formattedTimestamp : "contains"
UserForm_file -.-> UserForm : "contains"
Volspace -.-> Model : "contains"
WhitePlane_file -.-> WhitePlane : "contains"
WhitePlane_file -.-> planeGeometry : "contains"
WhitePlane_file -.-> gridTexture : "contains"
authService -.-> signInUser : "contains"
authService -.-> handlePostLoginRedirect : "contains"
authService -.-> signOut : "contains"
authService -.-> handleRedirectResult : "contains"
authService -.-> observeAuthState : "contains"
authService -.-> validateAuthToken : "contains"
authService -.-> handleUrlAuth : "contains"
centralizedBroadcastManager_file -.-> CentralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager_file -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager_file -.-> cleanupBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> dummyUnsubscribe : "contains"
centralizedBroadcastManager_file -.-> centralizedBroadcastManager : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionPositionResolver -.-> resolveConnectionEndpoint : "contains"
connectionPositionResolver -.-> positionsEqual : "contains"
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
connectionsService -.-> connectionListeners : "contains"
connectionsService -.-> globalActiveListeners : "contains"
connectionsService -.-> notifyConnectionListeners : "contains"
connectionsService -.-> connectionCache : "contains"
connectionsService -.-> clearConnectionCache : "contains"
connectionsService -.-> connectionDataChanged : "contains"
connectionsService -.-> serializeConnection : "contains"
connectionsService -.-> subscribeToCellConnections : "contains"
connectionsService -.-> unsubscribeFunctions : "contains"
connectionsService -.-> activeSubscriptionCells : "contains"
connectionsService -.-> startCellSubscriptions : "contains"
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
githubRepoService -.-> getFileTypeFromPath : "contains"
githubRepoService -.-> analyzeFile : "contains"
githubRepoService -.-> containsJSX : "contains"
githubRepoService -.-> detectRepoType : "contains"
githubRepoService -.-> sanitizeNodeId : "contains"
githubRepoService -.-> traverseVanillaAST : "contains"
githubRepoService -.-> exportedNames : "contains"
githubRepoService -.-> ensureContainer : "contains"
githubRepoService -.-> addSymbol : "contains"
githubRepoService -.-> addVariableDecl : "contains"
githubRepoService -.-> trackRelativeSource : "contains"
githubRepoService -.-> importBindings : "contains"
githubRepoService -.-> traversePythonSource : "contains"
githubRepoService -.-> localNames : "contains"
githubRepoService -.-> traverseVueSource : "contains"
githubRepoService -.-> componentFunctions : "contains"
githubRepoService -.-> componentRelationships : "contains"
githubRepoService -.-> componentDependencies : "contains"
githubRepoService -.-> internalComponents : "contains"
githubRepoService -.-> exportedComponents : "contains"
githubRepoService -.-> fileFunctions : "contains"
githubRepoService -.-> internalHooks : "contains"
githubRepoService -.-> filesNeedingSuffix : "contains"
githubRepoService -.-> functionCallRelationships : "contains"
githubRepoService -.-> componentPropsRelationships : "contains"
githubRepoService -.-> storeUsageRelationships : "contains"
githubRepoService -.-> hookReturnValueRelationships : "contains"
githubRepoService -.-> moduleImportRelationships : "contains"
githubRepoService -.-> nextjsRouteMap : "contains"
githubRepoService -.-> apiEndpoints : "contains"
githubRepoService -.-> dbModels : "contains"
githubRepoService -.-> authGuards : "contains"
githubRepoService -.-> eventEmitters : "contains"
githubRepoService -.-> eventListeners : "contains"
githubRepoService -.-> errorBoundaries : "contains"
githubRepoService -.-> suspenseBoundaries : "contains"
githubRepoService -.-> sharedInterfaces : "contains"
githubRepoService -.-> interfaceUsages : "contains"
githubRepoService -.-> traverse : "contains"
githubRepoService -.-> isMiddlewareParams : "contains"
githubRepoService -.-> knownContainers : "contains"
githubRepoService -.-> generateMerfolkMarkdown : "contains"
githubRepoService -.-> storesSet : "contains"
githubRepoService -.-> servicesSet : "contains"
githubRepoService -.-> classesSet : "contains"
githubRepoService -.-> constantsSet : "contains"
githubRepoService -.-> variablesSet : "contains"
githubRepoService -.-> componentInternalFunctions : "contains"
githubRepoService -.-> componentsSet : "contains"
githubRepoService -.-> filtered : "contains"
githubRepoService -.-> hooksSet : "contains"
githubRepoService -.-> servicesSetForFilter : "contains"
githubRepoService -.-> storesSetForFilter : "contains"
githubRepoService -.-> utilitiesSetForFilter : "contains"
githubRepoService -.-> nodeIds : "contains"
githubRepoService -.-> childToParentMap : "contains"
githubRepoService -.-> allSymbolNames : "contains"
githubRepoService -.-> generateRoutedConnection : "contains"
githubRepoService -.-> resolveId : "contains"
githubRepoService -.-> allComponentFunctions : "contains"
githubRepoService -.-> resolveRouteNodeId : "contains"
githubRepoService -.-> routeGroups : "contains"
githubRepoService -.-> routeRepresentative : "contains"
githubRepoService -.-> allEventNames : "contains"
githubRepoService -.-> currentParams : "contains"
githubRepoService -.-> restoredParams : "contains"
githubRepoService -.-> newUrl : "contains"
githubRepoService -.-> successParams : "contains"
githubRepoService -.-> failParams : "contains"
githubRepoService -.-> markdownBlob : "contains"
githubRepoService -.-> markdownFile : "contains"
githubRepoService -.-> extractMerfolkNodeIds : "contains"
githubRepoService -.-> filterNewMerfolkNodes : "contains"
githubRepoService -.-> extractContent : "contains"
globalOptimizationCoordinator_file -.-> GlobalOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> initializeOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> getOptimizationStatus : "contains"
globalOptimizationCoordinator_file -.-> consolidateSystem : "contains"
globalOptimizationCoordinator_file -.-> cleanupOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> spatialManager : "contains"
globalOptimizationCoordinator_file -.-> unifiedCache : "contains"
globalOptimizationCoordinator_file -.-> cacheStats : "contains"
globalOptimizationCoordinator_file -.-> later : "contains"
globalOptimizationCoordinator_file -.-> cache : "contains"
globalOptimizationCoordinator_file -.-> memoized : "contains"
globalOptimizationCoordinator_file -.-> session : "contains"
globalOptimizationCoordinator_file -.-> globalOptimizationCoordinator : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> globalSubscriptions : "contains"
globalSubscriptionManager -.-> decrementSubscription : "contains"
globalSubscriptionManager -.-> periodicCleanup : "contains"
connectionMethods -.-> connectionTags : "contains"
connectionMethods -.-> addTag : "contains"
connectionMethods -.-> existingConnectionPairs : "contains"
connectionMethods -.-> getFaceForObject : "contains"
connectionMethods -.-> computeFaceWorldPosition : "contains"
connectionMethods -.-> calculateDodecahedronFaceCenter : "contains"
connectionMethods -.-> connectionsByCell : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
containerMethods -.-> groupedByType : "contains"
containerMethods -.-> createContainerForGroup : "contains"
containerMethods -.-> reachableFromRootModules : "contains"
containerMethods -.-> markReachable : "contains"
containerMethods -.-> componentsWithChildContainers : "contains"
containerMethods -.-> nodesInChildContainers : "contains"
containerMethods -.-> markDescendantsInChildContainers : "contains"
containerMethods -.-> nodesWithContainers : "contains"
containerMethods -.-> visited : "contains"
containerMethods -.-> adjustNodeAndDescendants : "contains"
containerMethods -.-> containerDimensions : "contains"
hierarchyMethods -.-> parentChildMap : "contains"
hierarchyMethods -.-> childParentMap : "contains"
hierarchyMethods -.-> rootNodes : "contains"
hierarchyMethods -.-> internalComponentChildren : "contains"
hierarchyMethods -.-> componentConnectionTypes : "contains"
hierarchyMethods -.-> wouldCreateCycle : "contains"
hierarchyMethods -.-> dfs : "contains"
hierarchyMethods -.-> warnedCycles : "contains"
hierarchyMethods -.-> addParentChildRelation : "contains"
hierarchyMethods -.-> isCubeChild : "contains"
objectMethods -.-> processedNodes : "contains"
objectMethods -.-> existingNodeIdMap : "contains"
objectMethods -.-> calculateHeaderStyle : "contains"
positionMethods -.-> moveComponentTree : "contains"
positionMethods -.-> getComponentChildren : "contains"
positionMethods -.-> checkOverlap : "contains"
positionMethods -.-> containersByLevel : "contains"
positionMethods -.-> resolveNodeMove : "contains"
positionMethods -.-> calculateNodeScaleFromChildren : "contains"
positionMethods -.-> calculateGroupSpacing : "contains"
positionMethods -.-> calculateGroupBounds : "contains"
positionMethods -.-> positionGroup : "contains"
processMethods -.-> cameraDirection : "contains"
processMethods -.-> allNodes : "contains"
processMethods -.-> allConnections : "contains"
processMethods -.-> nodeToObjectIdMap : "contains"
processMethods -.-> reader : "contains"
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
resourceCleanupService_file -.-> _disposedWeakSet : "contains"
runtimeScanService -.-> validateScanUrl : "contains"
runtimeScanService -.-> generateMerfolkFromRuntimeTrace : "contains"
runtimeScanService -.-> scanWebsiteAndGenerateDiagram : "contains"
runtimeScanService -.-> sanitizeId : "contains"
runtimeScanService -.-> simulateProgress : "contains"
screenRecordingService -.-> ScreenRecordingService : "contains"
screenRecordingService -.-> screenRecorder : "contains"
screenRecordingService -.-> rawBlob : "contains"
sharedSpacesService -.-> sharedSpacesCacheSet : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharedSpacesService -.-> sharedSpacesCache : "contains"
sharedSpacesService -.-> urlParams : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
sharingService -.-> sharingUrl : "contains"
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
spatialObjectsService -.-> deletingObjects : "contains"
spatialObjectsService -.-> pendingSaves : "contains"
spatialObjectsService -.-> saves : "contains"
spatialObjectsService -.-> removeObjectFromCaches : "contains"
spatialObjectsService -.-> VOLATILE_KEYS : "contains"
spatialObjectsService -.-> computeNonPositionFingerprint : "contains"
spatialObjectsService -.-> clearCellCache : "contains"
spatialObjectsService -.-> objectSubscriptionsByCell : "contains"
spatialObjectsService -.-> localSubscriptionKeys : "contains"
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
spatialPartitioning -.-> cellExistenceCache : "contains"
spatialPartitioning -.-> cleanupCache : "contains"
spatialPartitioning -.-> createCellsBatchOptimized : "contains"
spatialPartitioning -.-> cellCallbacks : "contains"
spatialPartitioning -.-> normalizePosition : "contains"
spatialPartitioning -.-> seenConnectionIds : "contains"
storageService -.-> uploadImageToStorage : "contains"
storageService -.-> uploadModelToStorage : "contains"
storageService -.-> uploadMarkdownToStorage : "contains"
storageService -.-> getStorageInstance : "contains"
storageService -.-> ALLOWED_IMAGE_TYPES : "contains"
storageService -.-> uploadFileGeneric : "contains"
storageService -.-> blob : "contains"
streamlinedSpatialPartitioning -.-> StreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> getStreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> initializeStreamlinedSpatialPartitioning : "contains"
streamlinedSpatialPartitioning -.-> benchmarkStreamlinedSystem : "contains"
streamlinedSpatialPartitioning -.-> manager : "contains"
unifiedCacheManager_file -.-> UnifiedCacheManager : "contains"
unifiedCacheManager_file -.-> unifiedCacheManager : "contains"
webRservice -.-> initWebRTC : "contains"
webRservice -.-> BroadcastSession : "contains"
webRservice -.-> startBroadcasting : "contains"
webRservice -.-> joinBroadcast : "contains"
webRservice -.-> isPlaneBeingBroadcast : "contains"
webRservice -.-> findAvailableBroadcasts : "contains"
webRservice -.-> cleanupWebRTC : "contains"
webRservice -.-> registerUserPresence : "contains"
webRservice -.-> subscribeToUsersInSpace : "contains"
webRservice -.-> activeStreams : "contains"
webRservice -.-> getRTCConfiguration : "contains"
webRservice -.-> peerConnection : "contains"
webRservice -.-> broadcastSession : "contains"
webRservice -.-> activeUsers : "contains"
webRservice -.-> fiveMinutesAgo : "contains"
shader_shaders -.-> line_frag_glsl : "contains"
shader_shaders -.-> line_vert_glsl : "contains"
authStore -.-> monitorConnection : "contains"
authStore -.-> connectionHandler : "contains"
authStore -.-> handleUrlAuthLocal : "contains"
authStore -.-> initAuth : "contains"
connectionStore -.-> _buildConnectionsByObjectId : "contains"
connectionStore -.-> getCellCoords : "contains"
connectionStore -.-> getCellIdFromCoords : "contains"
cubeStore -.-> getCubeSelector : "contains"
cubeStore -.-> getCubeFaceColorSelector : "contains"
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
cubeStore -.-> getCubeFaceStateSelector : "contains"
lodStore -.-> calculateLODLevel : "contains"
lodStore -.-> calculateParentLODLevel : "contains"
objectsStore -.-> numericHash : "contains"
objectsStore -.-> stringHash : "contains"
storeUtils -.-> useStoreInitialization : "contains"
storeUtils -.-> useCubeSelectors : "contains"
storeUtils -.-> useCubeActions : "contains"
storeUtils -.-> usePlaneSelectors : "contains"
storeUtils -.-> usePlaneActions : "contains"
storeUtils -.-> useGlobalStoreUtils : "contains"
storeUtils -.-> clearAllSelections : "contains"
storeUtils -.-> resetAllStores : "contains"
uiOverlayStore -.-> setCellBoundariesVisible : "contains"
animationUtils -.-> registerMaterial : "contains"
animationUtils -.-> unregisterMaterial : "contains"
animationUtils -.-> setAnimationSpeed : "contains"
animationUtils -.-> initAnimationSystem : "contains"
animationUtils -.-> animatedMaterials : "contains"
animationUtils -.-> startAnimationLoop : "contains"
animationUtils -.-> animate : "contains"
animationUtils -.-> stopAnimationLoop : "contains"
bvhRaycasting -.-> BVHNode : "contains"
bvhRaycasting -.-> BVHAcceleratedRaycaster : "contains"
bvhRaycasting -.-> initBVHRaycasting : "contains"
bvhRaycasting -.-> getBVH : "contains"
bvhRaycasting -.-> updateBVHObjects : "contains"
bvhRaycasting -.-> bvhIntersectObjects : "contains"
bvhRaycasting -.-> getBVHStats : "contains"
bvhRaycasting -.-> updateLODLevels : "contains"
bvhRaycasting -.-> registerObjectRelationships : "contains"
bvhRaycasting -.-> _tempBox3 : "contains"
bvhRaycasting -.-> _tempVec3A : "contains"
bvhRaycasting -.-> _tempVec3B : "contains"
bvhRaycasting -.-> _tempVec3C : "contains"
bvhRaycasting -.-> _tempVec3D : "contains"
bvhRaycasting -.-> _tempSize : "contains"
bvhRaycasting -.-> _tempCenter : "contains"
bvhRaycasting -.-> _tempMin : "contains"
bvhRaycasting -.-> _tempMax : "contains"
bvhRaycasting -.-> _lodCameraPos : "contains"
bvhRaycasting -.-> _lodObjectPos : "contains"
bvhRaycasting -.-> _segmentDir : "contains"
bvhRaycasting -.-> _rayToStart : "contains"
bvhRaycasting -.-> _pointOnRay : "contains"
bvhRaycasting -.-> _pointOnSegment : "contains"
bvhRaycasting -.-> _intersectionPoint : "contains"
bvhRaycasting -.-> _cameraPos : "contains"
bvhRaycasting -.-> leftChild : "contains"
bvhRaycasting -.-> rightChild : "contains"
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
connectionUtils -.-> worldPos : "contains"
connectionUtils -.-> offsetVec : "contains"
connectionUtils -.-> indicatorPos : "contains"
debugUtils -.-> logAnimation : "contains"
debugUtils -.-> forceAnimateConnection : "contains"
debugUtils -.-> shouldAnimateConnection : "contains"
debugUtils -.-> recordFrameTime : "contains"
debugUtils -.-> recordStateUpdate : "contains"
debugUtils -.-> getPerfStats : "contains"
debugUtils -.-> resetPerfStats : "contains"
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
faceIndicatorUtils -.-> getIdFromIndicator : "contains"
facePositionUtils -.-> calculateFacePosition : "contains"
facePositionUtils -.-> tempWorldPos : "contains"
facePositionUtils -.-> tempWorldScale : "contains"
facePositionUtils -.-> tempOffsetVec : "contains"
facePositionUtils -.-> tempMatrix : "contains"
facePositionUtils -.-> _avg3 : "contains"
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
objectVirtualization -.-> _tempVec : "contains"
objectVirtualization -.-> _sphereCenter : "contains"
objectVirtualization -.-> _tempSphere : "contains"
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
pathfindingUtils -.-> intersectionCache : "contains"
pathfindingUtils -.-> pathCache : "contains"
pathfindingUtils -.-> objectPositionCache : "contains"
pathfindingUtils -.-> _tempDir : "contains"
pathfindingUtils -.-> _tempResult : "contains"
pathfindingUtils -.-> _tempBoxCenter : "contains"
pathfindingUtils -.-> _tempClosest : "contains"
pathfindingUtils -.-> _tempLineToCenter : "contains"
pathfindingUtils -.-> _tempBoxRadiusVec : "contains"
pathfindingUtils -.-> _tempCurveStart : "contains"
pathfindingUtils -.-> _tempCurveEnd : "contains"
pathfindingUtils -.-> _tempCurveDir : "contains"
pathfindingUtils -.-> _tempRay : "contains"
pathfindingUtils -.-> _tempIntersectTarget : "contains"
pathfindingUtils -.-> precomputedResults : "contains"
pathfindingUtils -.-> d : "contains"
pathfindingUtils -.-> cliLineStart : "contains"
pathfindingUtils -.-> cliLineEnd : "contains"
pathfindingUtils -.-> ray : "contains"
pathfindingUtils -.-> center : "contains"
pathfindingUtils -.-> bbox : "contains"
pathfindingUtils -.-> startVec : "contains"
pathfindingUtils -.-> endVec : "contains"
pathfindingUtils -.-> line : "contains"
pathfindingUtils -.-> hitPoint : "contains"
pathfindingUtils -.-> centerPoint : "contains"
pathfindingUtils -.-> curve : "contains"
pathfindingUtils -.-> requestsById : "contains"
positionUtils -.-> calculateMidpoint : "contains"
positionUtils -.-> calculateMidpointVector : "contains"
positionUtils -.-> lerp : "contains"
positionUtils -.-> checkPositionJitter : "contains"
positionUtils -.-> tempVec1 : "contains"
positionUtils -.-> tempVec2 : "contains"
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
snappingUtils -.-> tempCurrentPos : "contains"
snappingUtils -.-> tempObjPos : "contains"
snappingUtils -.-> tempAxisDir : "contains"
snappingUtils -.-> tempToPoint : "contains"
snappingUtils -.-> tempProjection : "contains"
snappingUtils -.-> tempPerpendicular : "contains"
snappingUtils -.-> tempProjectedPoint : "contains"
streamlinedSpatialIndex -.-> Point3D : "contains"
streamlinedSpatialIndex -.-> BoundingBox : "contains"
streamlinedSpatialIndex -.-> OptimizedSpatialGrid : "contains"
streamlinedSpatialIndex -.-> createStreamlinedSpatialIndex : "contains"
streamlinedSpatialIndex -.-> benchmarkStreamlined : "contains"
streamlinedSpatialIndex -.-> seenObjects : "contains"
streamlinedSpatialIndex -.-> position : "contains"
textAtlas -.-> TextAtlas : "contains"
textAtlas -.-> MultiPageTextAtlas : "contains"
textAtlas -.-> isOffscreenCanvasTextSupported : "contains"
textAtlas -.-> WorkerMultiPageTextAtlas : "contains"
textAtlas -.-> _switchToSyncAtlas : "contains"
textAtlas -.-> getGlobalTextAtlas : "contains"
textAtlas -.-> resetGlobalTextAtlas : "contains"
textAtlas -.-> createAtlasTextMesh : "contains"
textAtlas -.-> page : "contains"
textAtlas -.-> c : "contains"
textAtlas -.-> tex : "contains"
textAtlas -.-> geometry : "contains"
textAtlas -.-> material : "contains"
textAtlas -.-> mesh : "contains"
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
textureLoader -.-> loadTextureFromBlob : "contains"
textureLoader -.-> url : "contains"
textureLoader -.-> img : "contains"
textureLoader -.-> texture : "contains"
unifiedPerformanceUtils -.-> throttle : "contains"
unifiedPerformanceUtils -.-> debounce : "contains"
unifiedPerformanceUtils -.-> measurePerformance : "contains"
unifiedPerformanceUtils -.-> scheduleWork : "contains"
unifiedPerformanceUtils -.-> memoize : "contains"
unifiedPerformanceUtils -.-> trackLCP : "contains"
unifiedPerformanceUtils -.-> createCacheKey : "contains"
unifiedPerformanceUtils -.-> observer : "contains"
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
worker_diagramLayoutWorker -.-> estimateNodeSize : "contains"
worker_diagramLayoutWorker -.-> isHierarchyConnection : "contains"
worker_diagramLayoutWorker -.-> filterConnections : "contains"
worker_diagramLayoutWorker -.-> layoutNodes : "contains"
worker_diagramLayoutWorker -.-> layoutEdges : "contains"
worker_diagramLayoutWorker -.-> computeSize : "contains"
worker_diagramLayoutWorker -.-> computeSubtreeWidth : "contains"
worker_diagramLayoutWorker -.-> positionTree : "contains"
worker_diagramLayoutWorker -.-> positionContained : "contains"
worker_diagramLayoutWorkerClient -.-> getDiagramLayoutWorker : "contains"
worker_diagramLayoutWorkerClient -.-> terminateDiagramLayoutWorker : "contains"
worker_markdownLayoutWorker -.-> LayoutEngine : "contains"
worker_markdownLayoutWorker -.-> parseFlowPaths : "contains"
worker_markdownLayoutWorker -.-> stripFlowPathSyntax : "contains"
worker_markdownLayoutWorker -.-> computeHeaderStyle : "contains"
worker_markdownLayoutWorkerClient -.-> getMarkdownLayoutWorker : "contains"
worker_markdownLayoutWorkerClient -.-> terminateMarkdownLayoutWorker : "contains"
worker_pathfindingWorkerClient -.-> getPathfindingWorker : "contains"
worker_pathfindingWorkerClient -.-> terminatePathfindingWorker : "contains"
worker_spatialIndexWorker -.-> childLOD : "contains"
worker_spatialIndexWorker -.-> parentLOD : "contains"
worker_spatialIndexWorker -.-> isPointInFrustum : "contains"
worker_spatialIndexWorkerClient -.-> getSpatialIndexWorker : "contains"
worker_spatialIndexWorkerClient -.-> terminateSpatialIndexWorker : "contains"
worker_textAtlasWorker -.-> getKey : "contains"
worker_textAtlasWorker -.-> AtlasPage : "contains"
worker_textAtlasWorker -.-> addPage : "contains"
worker_textAtlasWorkerClient -.-> getTextAtlasWorker : "contains"
worker_textAtlasWorkerClient -.-> terminateTextAtlasWorker : "contains"

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
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, geometry..."
AtlasTextSprite --> StaticBillboardMesh : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, calculatedPosition..."
AtlasTextSprite --> DynamicBillboardMesh : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> InstancedLine : "key, points, color..."
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AnimatedConnectionLine : "key, points, connectionId..."
Connection --> DistanceFilteredConnectionText : "position, maxDistance"
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

%% Component Dependencies
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> useObjectsStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useSpatialManagerStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useUIOverlayStore : "uses store"
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
App --> useUIOverlayStore : "uses store"
App --> useUIOverlayStore : "uses store"
App --> useObjectsStore : "uses store"
App --> useConnectionStore : "uses store"
App --> usePlaneStore : "uses store"
App --> useCubeStore : "uses store"
App --> useTetrahedronStore : "uses store"
App --> useDodecahedronStore : "uses store"
App --> useSpatialManagerStore : "uses store"
App --> useDiagramStore : "uses store"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "uses service"
authService --> signInUser : "receives"
App --> spatialObjectsService : "uses service"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> CELL_SIZE : "uses service"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> presenceService : "uses service"
presenceService --> setGuestPresence : "receives"
App --> spacesService : "uses service"
spacesService --> getPublicSpaceMetadata : "receives"
App --> webRservice : "uses service"
webRservice --> initWebRTC : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> ConnectionAnimationManager : "receives"
App --> objectUpdateHandlers : "uses utility"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "uses utility"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "uses utility"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> positionUtils : "uses utility"
positionUtils --> checkPositionJitter : "receives"
App --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> loadingState : "uses utility"
loadingState --> setIsInitialLoading : "receives"
App --> animationUtils : "uses utility"
animationUtils --> initAnimationSystem : "receives"
App --> objectVirtualization : "uses utility"
objectVirtualization --> objectVirtualizer : "receives"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AtlasTextSprite --> useTextAtlasStore : "uses store"
AtlasTextSprite --> useTextAtlasStore : "uses store"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> useTextAtlasStore : "uses store"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> useTextAtlasStore : "uses store"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
CellBoundaryRenderer --> CELL_NEIGHBOR_RADIUS : "uses service"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "{startObject, endObject}"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "uses hook"
useFrustumCulling --> useFrustumCulledConnections : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> precomputePathsBatch : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses store"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
ConnectionsRenderer --> useConnectionStore : "uses store"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> precomputePathsBatch : "receives"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "uses hook"
useFrustumCulling --> useFrustumCulledConnections : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> precomputePathsBatch : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> useObjectsStore : "uses store"
Cube --> useFaceIndicatorStore : "uses store"
Cube --> useConnectionStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useIndicatorsStore : "uses store"
Cube --> useFaceIndicatorStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useObjectsStore : "uses store"
Cube --> useConnectionStore : "uses store"
Cube --> useIndicatorsStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> LOD_LEVELS : "uses store"
Cube --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Cube --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
CubeFace --> useCubeStore : "uses store"
CubeFace --> useCubeStore : "uses store"
CubeFace --> cubeStore : "uses store"
cubeStore --> getCubeFaceStateSelector : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useUIOverlayStore : "uses store"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useUIOverlayStore : "uses store"
DiagramOverlay2D --> useObjectsStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useIndicatorsStore : "uses store"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useIndicatorsStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> LOD_LEVELS : "uses store"
Sphere --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Sphere --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Sphere --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
DodecahedronFace --> useDodecahedronStore : "uses store"
DodecahedronFace --> useDodecahedronStore : "uses store"
FaceIndicator --> useFaceIndicatorStore : "uses store"
FaceIndicator --> useFaceIndicatorStore : "uses store"
FaceIndicator --> useFaceIndicatorStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useFaceStore : "uses store"
FrameloopController --> useUIOverlayStore : "uses store"
FrameloopController --> useUIOverlayStore : "uses store"
FrameTicker --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
GlobalCubeEdgesRenderer --> LOD_LEVELS : "uses store"
GlobalCubeFaceRenderer --> useLODStore : "uses store"
GlobalCubeFaceRenderer --> useCubeStore : "uses store"
GlobalCubeFaceRenderer --> useLODStore : "uses store"
GlobalCubeFaceRenderer --> LOD_LEVELS : "uses store"
GlobalCubeMediumLODRenderer --> useLODStore : "uses store"
GlobalCubeMediumLODRenderer --> useLODStore : "uses store"
GlobalCubeMediumLODRenderer --> LOD_LEVELS : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
GlobalDodecahedronEdgesRenderer --> LOD_LEVELS : "uses store"
GlobalDodecahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalDodecahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalDodecahedronMediumLODRenderer --> LOD_LEVELS : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
GlobalTetrahedronEdgesRenderer --> LOD_LEVELS : "uses store"
GlobalTetrahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalTetrahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalTetrahedronMediumLODRenderer --> LOD_LEVELS : "uses store"
HeaderInput --> useTextInputStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
InstancedAtlasText --> useTextAtlasStore : "uses store"
InstancedAtlasText --> useTextAtlasStore : "uses store"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> useTextAtlasStore : "uses store"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> TextAtlas : "receives"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LODManager --> useObjectsStore : "uses store"
LODManager --> useLODStore : "uses store"
LODManager --> useLODStore : "uses store"
LODManager --> lodStore : "uses store"
lodStore --> calculateLODLevel : "receives"
LODManager --> lodStore : "uses store"
lodStore --> calculateParentLODLevel : "receives"
LODManager --> LOD_LEVELS : "uses store"
LODManager --> FACE_TEXT_DISTANCE_SQ : "uses store"
LODManager --> useObjectsStore : "uses store"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ObjectsRenderer --> useUIOverlayStore : "uses store"
ObjectsRenderer --> useUIOverlayStore : "uses store"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
ObjectUI --> useColorPickerStore : "uses store"
Plane --> useObjectsStore : "uses store"
Plane --> useConnectionStore : "uses store"
Plane --> usePlaneStore : "uses store"
Plane --> usePlaneStore : "uses store"
Plane --> useIndicatorsStore : "uses store"
Plane --> useIndicatorsStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
Plane --> usePlaneStore : "uses store"
Plane --> useObjectsStore : "uses store"
Plane --> useConnectionStore : "uses store"
Plane --> useIndicatorsStore : "uses store"
Plane --> useUIOverlayStore : "uses store"
Plane --> storageService : "uses service"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Plane --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useObjectsStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
RealTimeConnectionUpdater --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
Tetrahedron --> useFaceIndicatorStore : "uses store"
Tetrahedron --> useObjectsStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useFaceIndicatorStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useObjectsStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> LOD_LEVELS : "uses store"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
TetrahedronFace --> useTetrahedronStore : "uses store"
TetrahedronFace --> useTetrahedronStore : "uses store"
TextObject --> useObjectsStore : "uses store"
TextObject --> useConnectionStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useObjectsStore : "uses store"
TextObject --> useConnectionStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
TextObject --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
TextObject --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
TextObjectUI --> useColorPickerStore : "uses store"
TextObjectUI --> useColorPickerStore : "uses store"
TextObjectUI --> useColorPickerStore : "uses store"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUI --> useColorPickerStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useDiagramStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useDiagramStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> uiOverlayStore : "uses store"
uiOverlayStore --> setCellBoundariesVisible : "receives"
UIOverlay --> storageService : "uses service"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> storageService : "uses service"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> screenRecordingService : "uses service"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> markdownDiagramService_file : "uses service"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> handleGithubCallback : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> fetchRepositories : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> isGithubAuthenticated : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> getGithubOAuthUrl : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> rescanRepositoryForChanges : "receives"
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> validateScanUrl : "receives"
WebcamStream --> useWebcamStreamStore : "uses store"
WebcamStream --> useWebcamStreamStore : "uses store"
WebcamStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
WebcamStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> getOrganizationMembers : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> declineInvite : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "uses service"
organizationService --> getPendingInvitesForUser : "receives"
OrganizationManager --> PLAN_LIMITS : "uses service"

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
captureRuntimeTrace --> getCompName : "calls getCompName"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> walkFiber : "calls walkFiber"
captureRuntimeTrace --> scanJsBundles : "calls scanJsBundles"
captureRuntimeTrace --> deduplicateApiCalls : "calls deduplicateApiCalls"
captureRuntimeTrace --> dedup : "calls dedup"
captureRuntimeTrace --> dedup : "calls dedup"
captureRuntimeTrace --> dedup : "calls dedup"
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
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
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
CubeFace --> getColoredMaterial : "calls getColoredMaterial"
MerfolkEdge --> EdgeMarkerDefs : "calls out"
EdgeMarkerDefs --> getEdgeStyle : "calls getEdgeStyle"
MerfolkEdge --> EdgeMarkerDefs : "calls out"
EdgeMarkerDefs --> getSelectedStyle : "calls getSelectedStyle"
MerfolkEdge --> EdgeMarkerDefs : "calls out"
EdgeMarkerDefs --> getUnselectedStyle : "calls getUnselectedStyle"
DiagramOverlay2D --> worker_diagramLayoutWorkerClient : "calls getDiagramLayoutWorker"
worker_diagramLayoutWorkerClient --> getDiagramLayoutWorker : "receives"
DiagramOverlay2D --> buildReactFlowNodes : "calls buildReactFlowNodes"
DiagramOverlay2D --> buildReactFlowEdges : "calls buildReactFlowEdges"
DiagramOverlay2D --> filterEdges : "calls filterEdges"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
DodecahedronFace --> getDodecahedronColoredMaterial : "calls getDodecahedronColoredMaterial"
FaceIndicator --> getIndicatorMaterial : "calls getIndicatorMaterial"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
LODManager --> worker_spatialIndexWorkerClient : "calls getSpatialIndexWorker"
worker_spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> worker_spatialIndexWorkerClient : "calls getSpatialIndexWorker"
worker_spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> worker_spatialIndexWorkerClient : "calls getSpatialIndexWorker"
worker_spatialIndexWorkerClient --> getSpatialIndexWorker : "receives"
LODManager --> lodStore : "calls calculateParentLODLevel"
lodStore --> calculateParentLODLevel : "receives"
LODManager --> lodStore : "calls calculateLODLevel"
lodStore --> calculateLODLevel : "receives"
LODManager --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "calls getSmoothedFrameTime"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ModelObject --> createLoaders : "calls createLoaders"
ObjectRenderer --> useObjects_file : "calls handleObjectDelete"
useObjects_file --> handleObjectDelete : "receives"
ObjectRenderer --> useObjects_file : "calls registerTransformingObject"
useObjects_file --> registerTransformingObject : "receives"
ObjectRenderer --> useObjects_file : "calls registerTransformingObject"
useObjects_file --> registerTransformingObject : "receives"
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
SpaceChat --> mergeMessages : "calls mergeMessages"
SpaceChat --> mergeMessages : "calls mergeMessages"
SpaceChat --> getGuestId : "calls getGuestId"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> getFaceIndicatorProps : "calls getFaceIndicatorProps"
TetrahedronFace --> getTetrahedronColoredMaterial : "calls getTetrahedronColoredMaterial"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> lerpVector : "calls lerpVector"
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
WebcamStream --> applyVideoTexture : "calls applyVideoTexture"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> applyVideoTexture : "calls applyVideoTexture"
useConnections_file --> connectionCallback : "calls connectionCallback"
useConnections_file --> connectionCallback : "calls connectionCallback"
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
useConnections_file --> useDebouncedUpdate_file : "calls cleanup"
useDebouncedUpdate_file --> cleanup : "receives"
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
useFrustumCulling --> worker_spatialIndexWorker : "calls isPointInFrustum"
worker_spatialIndexWorker --> isPointInFrustum : "receives"
isConnectionVisible --> useFrustumCulling : "calls out"
useFrustumCulling --> worker_spatialIndexWorker : "calls isPointInFrustum"
worker_spatialIndexWorker --> isPointInFrustum : "receives"
DodecahedronWireframe2 --> DodecahedronWireframe_file : "calls generateDodecahedronEdges"
DodecahedronWireframe_file --> generateDodecahedronEdges : "receives"
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
LandingApp --> fetchUserSpaces : "calls fetchUserSpaces"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> createUserDocument : "calls createUserDocument"
LandingApp --> LandingApp_file : "calls out"
LandingApp_file --> authService : "calls signOut"
authService --> signOut : "receives"
LandingApp --> fetchUserSpaces : "calls fetchUserSpaces"
LandingApp --> fetchUserSpaces : "calls fetchUserSpaces"
LandingApp --> fetchUserSpaces : "calls fetchUserSpaces"
LandingApp --> fetchUserSpaces : "calls fetchUserSpaces"
LandingApp --> fetchUserSpaces : "calls fetchUserSpaces"
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
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
checkLineIntersection --> d : "calls d"
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
pathfindingUtils --> worker_pathfindingWorkerClient : "calls getPathfindingWorker"
worker_pathfindingWorkerClient --> getPathfindingWorker : "receives"
precomputePathsBatch --> precomputeCacheKey : "calls precomputeCacheKey"
isCameraMovingRapidly --> isCameraMoving : "calls isCameraMoving"
benchmarkStreamlined --> createStreamlinedSpatialIndex : "calls createStreamlinedSpatialIndex"
getGlobalTextAtlas --> isOffscreenCanvasTextSupported : "calls isOffscreenCanvasTextSupported"
createAtlasTextMesh --> getGlobalTextAtlas : "calls getGlobalTextAtlas"
filterConnections --> isHierarchyConnection : "calls isHierarchyConnection"
filterConnections --> isHierarchyConnection : "calls isHierarchyConnection"
layoutNodes --> estimateNodeSize : "calls estimateNodeSize"
layoutNodes --> computeSize : "calls computeSize"
layoutNodes --> estimateNodeSize : "calls estimateNodeSize"
layoutNodes --> computeSize : "calls computeSize"
layoutNodes --> computeSubtreeWidth : "calls computeSubtreeWidth"
layoutNodes --> computeSubtreeWidth : "calls computeSubtreeWidth"
layoutNodes --> positionTree : "calls positionTree"
layoutNodes --> positionTree : "calls positionTree"
layoutNodes --> positionContained : "calls positionContained"
layoutNodes --> positionContained : "calls positionContained"
layoutEdges --> filterConnections : "calls filterConnections"
parseFlowPaths --> worker_markdownLayoutWorker : "calls out"
worker_markdownLayoutWorker --> connectionMethods : "calls addTag"
connectionMethods --> addTag : "receives"
parseFlowPaths --> worker_markdownLayoutWorker : "calls out"
worker_markdownLayoutWorker --> connectionMethods : "calls addTag"
connectionMethods --> addTag : "receives"

%% Store Usage Details
App --> useObjectsStore : "objects, setObjects, isInitialLoading, setIsInitialLoading"
App --> useConnectionStore : "selectConnection, setShowLineTextStyleUI, connectionsVisible, setFocusedObjectId"
App --> useUIOverlayStore : "viewMode"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "globalAnimationEnabled"
AtlasTextSprite --> useTextAtlasStore : "atlasVersion"
ColorPicker --> useColorPickerStore : "getColorPicker, setCurrentColor, applyColor, cancelColorPicker..."
ConnectionsRenderer --> useConnectionsRendererStore_file : "connections, connectionsVisible, focusedObjectId, selectedConnection..."
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useConnectionStore : "selectConnectionWithFlowPath"
Cube --> useFaceIndicatorStore : "setIndicatorActive"
Cube --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
Cube --> useObjectsStore : "isInitialLoading"
CubeFace --> useCubeStore : "faceColor, isSelected"
DiagramOverlay2D --> useDiagramStore : "graphs, hierarchy, connectionTags, setLayout2D..."
DiagramOverlay2D --> useUIOverlayStore : "setViewMode"
Sphere --> useObjectsStore : "setObjects, isInitialLoading"
Sphere --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
DodecahedronFace --> useDodecahedronStore : "faceColor, isHighlighted, faceText, faceTextStyle..."
FaceIndicator --> useFaceIndicatorStore : "setIndicatorHovered"
FaceTextInput --> useTextInputStore : "setText, submitText"
FaceUI --> useFaceStore : "setShowBorderMenu, toggleBorderMenu, setIsBorderColor"
FaceUI --> useColorPickerStore : "openColorPicker, closeColorPicker"
FrameloopController --> useUIOverlayStore : "viewMode"
GlobalCubeEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalCubeFaceRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalCubeMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalDodecahedronEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalDodecahedronMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalTetrahedronEdgesRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
GlobalTetrahedronMediumLODRenderer --> useLODStore : "lodLevels, childParentMap, parentIds, lodEnabled..."
HeaderInput --> useTextInputStore : "setText, submitText"
InstancedAtlasText --> useTextAtlasStore : "atlasVersion"
LineUI --> useConnectionStore : "toggleLineStylesMenu, toggleArrowDropdown, closeAllLineUIMenus, setLineUIMenuState"
LineUI --> useColorPickerStore : "openColorPicker, closeColorPicker"
LODManager --> useObjectsStore : "objects"
LODManager --> useLODStore : "childParentMap, parentIds, lodEnabled, batchSetLODLevels..."
ObjectsRenderer --> useUIOverlayStore : "viewMode"
ObjectUI --> useColorPickerStore : "isColorPickerOpen, openColorPicker, closeColorPicker"
Plane --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
Plane --> useUIOverlayStore : "pinnedWebcamPlaneId, setPinnedWebcamPlaneId, clearPinnedWebcam"
RealTimeConnectionUpdater --> useConnectionStore : "updateConnections"
RealTimeConnectionUpdater --> useSpatialManagerStore : "isInitialized"
ScreenShareStream --> useScreenShareStore : "getScreenShare, setScreenShareLoading, setScreenShareError, retryScreenShare"
Tetrahedron --> useFaceIndicatorStore : "setIndicatorActive"
Tetrahedron --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
Tetrahedron --> useObjectsStore : "isInitialLoading"
TetrahedronFace --> useTetrahedronStore : "faceColor, isSelectedFace, showFaceTextInput, activeTextFace..."
TextObject --> useTextObjectStore : "getTextObject, setTextObject, updateTextObjectProperty"
TextObject --> useIndicatorsStore : "hoveredObjectId, setHoveredObjectId"
TextObjectUI --> useColorPickerStore : "isColorPickerOpen, closeColorPicker"
TextSprite --> useTextObjectStore : "getTextSprite, setTextSpriteDragging"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "openColorPicker, closeColorPicker"
UIOverlay --> useUIOverlayStore : "toggleMenu, toggleTemplate, updateTemplateConfig, isUploadingModel..."
UIOverlay --> useConnectionStore : "connectionsVisible, toggleConnectionsVisible, resetConnections, length"
UIOverlay --> useDiagramStore : "is2DReady"
UIOverlay --> useObjectsStore : "resetObjects"
WebcamStream --> useWebcamStreamStore : "getWebcamStream, setWebcamLoading, setWebcamError, retryWebcamStream"
useAuth_file --> useAuth_file : "calls out"
useAuth_file --> useAuthStore : "authState, initializeAuth, cleanup"
useAuthState_file --> useAuthState_file : "calls out"
useAuthState_file --> useAuthStore : "user, isAuthReady, isCheckingUrlAuth, initializeAuth..."
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> useConnectionStore : "connections, addConnection, updateConnection, removeConnection..."
useIndicators_file --> useIndicators_file : "calls out"
useIndicators_file --> useIndicatorsStore : "setShowAllCubesIndicators, setActiveIndicator, setIndicatorMode, setSelectedIndicators..."
useObjects_file --> useObjects_file : "calls out"
useObjects_file --> useObjectsStore : "selectedId, setSelectedId, objects, initializeObjectsLoading..."
useSpaceManager_file --> useSpaceManager_file : "calls out"
useSpaceManager_file --> useSpaceManagerStore : "currentSpaceId, setCurrentSpaceId, fetchCurrentSpace, setIntentionalSpaceChange"

%% API Endpoints
POST /verify-token[Endpoint: POST /verify-token]
POST /[Endpoint: POST /]

%% API Handler Chains

%% Database Models
users_model[[Store: users]]
publicSpaces_model[[Store: publicSpaces]]
spaces_model[[Store: spaces]]
devUpdates_model[[Store: devUpdates]]
organizations_model[[Store: organizations]]
orgInvites_model[[Store: orgInvites]]
sharedSpaces_model[[Store: sharedSpaces]]

%% Auth Guards
signInWithPopup[Guard: signInWithPopup]
onAuthStateChanged[Guard: onAuthStateChanged]

%% Events
index_event((Service: index))
App_event((Service: App))
useSpatialManager_event((Service: useSpatialManager))
AppShell_event((Service: AppShell))
BVHIntegration_event((Service: BVHIntegration))
OrgMemberDropdown_event((Service: OrgMemberDropdown))
ScreenShareStream_event((Service: ScreenShareStream))
screenRecordingService_event((Service: screenRecordingService))
WebcamStream_event((Service: WebcamStream))
globalOptimizationCoordinator_event((Service: globalOptimizationCoordinator))
SpaceChat_event((Service: SpaceChat))
presenceService_event((Service: presenceService))
UIOverlay_event((Service: UIOverlay))
useWindowSize_event((Service: useWindowSize))
UpdatesContainer_event((Service: UpdatesContainer))
connectionsService_event((Service: connectionsService))
spatialObjectsService_event((Service: spatialObjectsService))
spatialPartitioning_event((Service: spatialPartitioning))
webRservice_event((Service: webRservice))
globalSubscriptionManager_event((Service: globalSubscriptionManager))
storageService_event((Service: storageService))
authStore_event((Service: authStore))

%% Event Flows

%% Error Boundaries
Suspense_AppShell[Boundary: Suspense]
```
