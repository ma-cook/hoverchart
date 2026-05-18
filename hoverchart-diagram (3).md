```merfolk
%% hoverchart Repository Analysis

%% Components
BVHIntegration{Component: BVHIntegration}
App{Component: App}
AtlasTextSprite{Component: AtlasTextSprite}
StaticBillboardMesh{Component: StaticBillboardMesh}
DynamicBillboardMesh{Component: DynamicBillboardMesh}
AppShell{Component: AppShell}
CellBoundaryRenderer{Component: CellBoundaryRenderer}
BatchedCurvedLines{Component: BatchedCurvedLines}
BatchedConnectionLines{Component: BatchedConnectionLines}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
CustomCamera{Component: CustomCamera}
DistanceFilteredConnectionText{Component: DistanceFilteredConnectionText}
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
DistanceFilteredTextLabels{Component: DistanceFilteredTextLabels}
CubeFace{Component: CubeFace}
DodecahedronFace{Component: DodecahedronFace}
EarthGlobe{Component: EarthGlobe}
DiagramOverlay2D{Component: DiagramOverlay2D}
ColorPicker{Component: ColorPicker}
Sphere{Component: Sphere}
Cube{Component: Cube}
GlobalCubeFullLODInstancedRenderer{Component: GlobalCubeFullLODInstancedRenderer}
GlobalCubeMediumLODRenderer{Component: GlobalCubeMediumLODRenderer}
GlobalCubeFaceRenderer{Component: GlobalCubeFaceRenderer}
FaceUI{Component: FaceUI}
GlobalDodecahedronEdgesRenderer{Component: GlobalDodecahedronEdgesRenderer}
FrameloopController{Component: FrameloopController}
FaceTextInput{Component: FaceTextInput}
FrameTicker{Component: FrameTicker}
GlobalCubeEdgesRenderer{Component: GlobalCubeEdgesRenderer}
FaceIndicator{Component: FaceIndicator}
GlobalTetrahedronEdgesRenderer{Component: GlobalTetrahedronEdgesRenderer}
GlobalDodecahedronMediumLODRenderer{Component: GlobalDodecahedronMediumLODRenderer}
GlobalTetrahedronMediumLODRenderer{Component: GlobalTetrahedronMediumLODRenderer}
InstancedAtlasText{Component: InstancedAtlasText}
PageInstancedMesh{Component: PageInstancedMesh}
HandsRenderer{Component: HandsRenderer}
HeaderInput{Component: HeaderInput}
LineUI{Component: LineUI}
LODManager{Component: LODManager}
InstancedLine{Component: InstancedLine}
ObjectRenderer{Component: ObjectRenderer}
ScreenShareStream{Component: ScreenShareStream}
SnapLineIndicator{Component: SnapLineIndicator}
ModelObject{Component: ModelObject}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
RepoGrid{Component: RepoGrid}
RepoGridLines{Component: RepoGridLines}
Plane{Component: Plane}
ObjectsRenderer{Component: ObjectsRenderer}
ObjectUI{Component: ObjectUI}
SpaceChat{Component: SpaceChat}
Avatar{Component: Avatar}
HandTrackingToggle{Component: HandTrackingToggle}
SpacePresenceAvatars{Component: SpacePresenceAvatars}
TetrahedronFace{Component: TetrahedronFace}
TextObject{Component: TextObject}
Tetrahedron{Component: Tetrahedron}
TextSprite{Component: TextSprite}
TextStyleUIContainer{Component: TextStyleUIContainer}
TextStyleUIContent{Component: TextStyleUIContent}
TextStyleUI{Component: TextStyleUI}
TextObjectUI{Component: TextObjectUI}
EarthSidebarSections{Component: EarthSidebarSections}
UIOverlay{Component: UIOverlay}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
WebcamStream{Component: WebcamStream}
PerspectiveGrid{Component: PerspectiveGrid}
UpdatesContainer{Component: UpdatesContainer}
CubeOutline{Component: CubeOutline}
OrderHeader{Component: OrderHeader}
DodecahedronWireframe{Component: DodecahedronWireframe}
LandingApp{Component: LandingApp}
Loader{Component: Loader}
FakeGlowMaterial{Component: FakeGlowMaterial}
UpdatesEditor{Component: UpdatesEditor}
CreateOrganizationPopup{Component: CreateOrganizationPopup}
UpdatesViewer{Component: UpdatesViewer}
Model{Component: Model}
UserForm{Component: UserForm}
CreateSpacePopup{Component: CreateSpacePopup}
DodecahedronWireframe2{Component: DodecahedronWireframe2}
ContentPanel{Component: ContentPanel}
DiagramContent{Component: DiagramContent}
AudienceContent{Component: AudienceContent}
CtaContent{Component: CtaContent}
LandingScrollContent{Component: LandingScrollContent}
WhitePlane{Component: WhitePlane}
OrgMemberDropdown{Component: OrgMemberDropdown}
WelcomeOverlay{Component: WelcomeOverlay}
UserLoginSection{Component: UserLoginSection}
UpgradePrompt{Component: UpgradePrompt}
OrganizationManager{Component: OrganizationManager}
SpacesTable{Component: SpacesTable}
ShareSpacePopup{Component: ShareSpacePopup}

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
ConnectionsRenderer -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
RepoGrid -.-> RepoGridLines : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
SpacePresenceAvatars -.-> HandTrackingToggle : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"
UIOverlay -.-> EarthSidebarSections : "internal"
ContainerNode -.-> MerfolkNode : "internal"
EdgeMarkerDefs -.-> MerfolkEdge : "internal"
LandingScrollContent -.-> ContentPanel : "internal"
LandingScrollContent -.-> DiagramContent : "internal"
LandingScrollContent -.-> AudienceContent : "internal"
LandingScrollContent -.-> CtaContent : "internal"

%% Functions
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]

%% Hooks
useCentralizedBroadcastManager[Function: useCentralizedBroadcastManager]
useAuthState[Function: useAuthState]
useAnimatedLine[Function: useAnimatedLine]
useAnimationStats[Function: useAnimationStats]
useConnectionObjects[Function: useConnectionObjects]
usePathfindingObjects[Function: usePathfindingObjects]
useConnectionObjectPositions[Function: useConnectionObjectPositions]
useAuth[Function: useAuth]
useFrustumCulledConnections[Function: useFrustumCulledConnections]
useDynamicFrustumCulling[Function: useDynamicFrustumCulling]
useConnections[Function: useConnections]
userId[Function: userId]
useIndicators[Function: useIndicators]
useSpaceManager[Function: useSpaceManager]
useGlobalClickHandler[Function: useGlobalClickHandler]
useSpatialManager[Function: useSpatialManager]
useTextureUpdater[Function: useTextureUpdater]
useConnectionsRendererStore[Function: useConnectionsRendererStore]
useConnectionState[Function: useConnectionState]
useConnectionActions[Function: useConnectionActions]
useObjects[Function: useObjects]
useDebouncedUpdate[Function: useDebouncedUpdate]
useTimeoutManager[Function: useTimeoutManager]
useWindowSize[Function: useWindowSize]

%% Services
createVerifyAuthTokenApp[Function: createVerifyAuthTokenApp]
createBulkImportApp[Function: createBulkImportApp]
objectsByCellId[Function: objectsByCellId]
connectionsByCellId[Function: connectionsByCellId]
params[Function: params]
generateJobId[Function: generateJobId]
toMillis[Function: toMillis]
deleteCellContents[Function: deleteCellContents]
createBulkDeleteApp[Function: createBulkDeleteApp]
validateRuntimeScanUrl[Function: validateRuntimeScanUrl]
sanitizeMerfolkId[Function: sanitizeMerfolkId]
generateMerfolkFromRuntimeTrace[Function: generateMerfolkFromRuntimeTrace]
EXCLUDED_PROFILER_NAMES[Function: EXCLUDED_PROFILER_NAMES]
BUNDLE_NOISE_NAMES[Function: BUNDLE_NOISE_NAMES]
REACT_DEVTOOLS_INJECTION[Function: REACT_DEVTOOLS_INJECTION]
getCompName[Function: getCompName]
walkFiber[Function: walkFiber]
extractSourceMapUrl[Function: extractSourceMapUrl]
scanOriginalSource[Function: scanOriginalSource]
extractNamesFromSourceMap[Function: extractNamesFromSourceMap]
scanJsBundles[Function: scanJsBundles]
bundleComponents[Function: bundleComponents]
bundleHooks[Function: bundleHooks]
bundleFunctions[Function: bundleFunctions]
captureRuntimeTrace[Function: captureRuntimeTrace]
urlObj[Function: urlObj]
seen[Function: seen]
seenFns[Function: seenFns]
dedup[Function: dedup]
deduplicateApiCalls[Function: deduplicateApiCalls]
buildConnections[Function: buildConnections]
createScanWebsiteRuntimeApp[Function: createScanWebsiteRuntimeApp]
spatialManager[Function: spatialManager]
unifiedCache[Function: unifiedCache]
cacheStats[Function: cacheStats]
later[Function: later]
cache[Function: cache]
memoized[Function: memoized]
session[Function: session]
globalOptimizationCoordinator[Function: globalOptimizationCoordinator]
initializeOptimizationCoordinator[Function: initializeOptimizationCoordinator]
getOptimizationStatus[Function: getOptimizationStatus]
consolidateSystem[Function: consolidateSystem]
cleanupOptimizationCoordinator[Function: cleanupOptimizationCoordinator]
signInUser[Function: signInUser]
handlePostLoginRedirect[Function: handlePostLoginRedirect]
signOut[Function: signOut]
handleRedirectResult[Function: handleRedirectResult]
observeAuthState[Function: observeAuthState]
validateAuthToken[Function: validateAuthToken]
handleUrlAuth[Function: handleUrlAuth]
dummyUnsubscribe[Function: dummyUnsubscribe]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
subscribePlaneToBroadcasts[Function: subscribePlaneToBroadcasts]
getBroadcastManagerDebugInfo[Function: getBroadcastManagerDebugInfo]
cleanupBroadcastManager[Function: cleanupBroadcastManager]
enc[Function: enc]
githubFetch[Function: githubFetch]
createIssue[Function: createIssue]
assignCopilotToIssue[Function: assignCopilotToIssue]
getIssue[Function: getIssue]
findPullRequestForIssue[Function: findPullRequestForIssue]
approvePullRequest[Function: approvePullRequest]
mergePullRequest[Function: mergePullRequest]
getPullRequest[Function: getPullRequest]
getRepoInfo[Function: getRepoInfo]
getBranchRef[Function: getBranchRef]
createBranchRef[Function: createBranchRef]
deleteBranchRef[Function: deleteBranchRef]
getFileContents[Function: getFileContents]
createFileOnBranch[Function: createFileOnBranch]
createPullRequest[Function: createPullRequest]
addComment[Function: addComment]
enableAutoMerge[Function: enableAutoMerge]
revertCommit[Function: revertCommit]
getAnchors[Function: getAnchors]
globalSubscriptions[Function: globalSubscriptions]
getOrCreateSubscription[Function: getOrCreateSubscription]
decrementSubscription[Function: decrementSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
periodicCleanup[Function: periodicCleanup]
parseCsv[Function: parseCsv]
splitCsvLine[Function: splitCsvLine]
isNumericColumn[Function: isNumericColumn]
parseNumeric[Function: parseNumeric]
detectColumns[Function: detectColumns]
filterAggregateRows[Function: filterAggregateRows]
buildGroups[Function: buildGroups]
groups[Function: groups]
layoutGroup[Function: layoutGroup]
computeBounds[Function: computeBounds]
getCameraBasePosition[Function: getCameraBasePosition]
processCsvFile[Function: processCsvFile]
resolveConnectionPositions[Function: resolveConnectionPositions]
resolveConnectionEndpoint[Function: resolveConnectionEndpoint]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
positionsEqual[Function: positionsEqual]
connectionListeners[Function: connectionListeners]
globalActiveListeners[Function: globalActiveListeners]
pauseConnectionListeners[Function: pauseConnectionListeners]
resumeConnectionListeners[Function: resumeConnectionListeners]
notifyConnectionListeners[Function: notifyConnectionListeners]
addConnectionStateListener[Function: addConnectionStateListener]
connectionCache[Function: connectionCache]
clearConnectionCache[Function: clearConnectionCache]
connectionDataChanged[Function: connectionDataChanged]
serializeConnection[Function: serializeConnection]
enableConnectionNetwork[Function: enableConnectionNetwork]
disableConnectionNetwork[Function: disableConnectionNetwork]
getConnectionNetworkState[Function: getConnectionNetworkState]
saveConnection[Function: saveConnection]
subscribeToConnections[Function: subscribeToConnections]
subscribeToCellConnections[Function: subscribeToCellConnections]
unsubscribeFunctions[Function: unsubscribeFunctions]
activeSubscriptionCells[Function: activeSubscriptionCells]
startCellSubscriptions[Function: startCellSubscriptions]
deleteConnection[Function: deleteConnection]
deleteConnectionEnhanced[Function: deleteConnectionEnhanced]
exchangeGithubCode[Function: exchangeGithubCode]
fetchRepositories[Function: fetchRepositories]
fetchFileContent[Function: fetchFileContent]
fetchLatestCommitSha[Function: fetchLatestCommitSha]
fetchChangedFiles[Function: fetchChangedFiles]
getFileTypeFromPath[Function: getFileTypeFromPath]
fetchRepositoryStructure[Function: fetchRepositoryStructure]
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
generateMerfolkFromRepository[Function: generateMerfolkFromRepository]
componentFunctions[Function: componentFunctions]
componentFuncDisplayNames[Function: componentFuncDisplayNames]
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
getGithubToken[Function: getGithubToken]
setGithubToken[Function: setGithubToken]
isGithubAuthenticated[Function: isGithubAuthenticated]
getGithubOAuthUrl[Function: getGithubOAuthUrl]
currentParams[Function: currentParams]
handleGithubCallback[Function: handleGithubCallback]
restoredParams[Function: restoredParams]
newUrl[Function: newUrl]
successParams[Function: successParams]
failParams[Function: failParams]
scanRepositoryAndGenerateDiagram[Function: scanRepositoryAndGenerateDiagram]
markdownBlob[Function: markdownBlob]
markdownFile[Function: markdownFile]
extractMerfolkNodeIds[Function: extractMerfolkNodeIds]
filterNewMerfolkNodes[Function: filterNewMerfolkNodes]
mergeMerfolkMarkdown[Function: mergeMerfolkMarkdown]
extractContent[Function: extractContent]
rescanRepositoryForChanges[Function: rescanRepositoryForChanges]
ensureWorker[Function: ensureWorker]
openCamera[Function: openCamera]
onLoaded[Function: onLoaded]
onError[Function: onError]
cleanup[Function: cleanup]
runOnce[Function: runOnce]
scheduleNext[Function: scheduleNext]
onFrame[Function: onFrame]
onVisibilityChange[Function: onVisibilityChange]
teardownCamera[Function: teardownCamera]
startHandTracking[Function: startHandTracking]
stopHandTracking[Function: stopHandTracking]
logParseHistogram[Function: logParseHistogram]
allNodes[Function: allNodes]
allConnections[Function: allConnections]
nodeToObjectIdMap[Function: nodeToObjectIdMap]
reader[Function: reader]
sigmoid[Function: sigmoid]
decodePalmDetections[Function: decodePalmDetections]
kps[Function: kps]
iou[Function: iou]
detectionToRoi[Function: detectionToRoi]
groupedByType[Function: groupedByType]
createContainerForGroup[Function: createContainerForGroup]
existingGroupTypes[Function: existingGroupTypes]
reachableFromRootModules[Function: reachableFromRootModules]
markReachable[Function: markReachable]
componentsWithChildContainers[Function: componentsWithChildContainers]
nodesInChildContainers[Function: nodesInChildContainers]
markDescendantsInChildContainers[Function: markDescendantsInChildContainers]
includableTypes[Function: includableTypes]
nodesWithContainers[Function: nodesWithContainers]
visited[Function: visited]
adjustNodeAndDescendants[Function: adjustNodeAndDescendants]
containerDimensions[Function: containerDimensions]
containerEligibleTypes[Function: containerEligibleTypes]
existingParentNodeIds[Function: existingParentNodeIds]
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
isContainerType[Function: isContainerType]
imageDataToTensor[Function: imageDataToTensor]
letterboxToImageData[Function: letterboxToImageData]
extractRotatedRoi[Function: extractRotatedRoi]
roiToImage[Function: roiToImage]
connectionTags[Function: connectionTags]
addTag[Function: addTag]
existingConnectionPairs[Function: existingConnectionPairs]
getFaceForObject[Function: getFaceForObject]
computeFaceWorldPosition[Function: computeFaceWorldPosition]
calculateDodecahedronFaceCenter[Function: calculateDodecahedronFaceCenter]
connectionsByCell[Function: connectionsByCell]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
validateScanUrl[Function: validateScanUrl]
sanitizeId[Function: sanitizeId]
scanWebsiteAndGenerateDiagram[Function: scanWebsiteAndGenerateDiagram]
simulateProgress[Function: simulateProgress]
processTask[Function: processTask]
pollPR[Function: pollPR]
startPipeline[Function: startPipeline]
getLatestTasks[Function: getLatestTasks]
processed[Function: processed]
checkResume[Function: checkResume]
pausePipeline[Function: pausePipeline]
resumePipeline[Function: resumePipeline]
reconcilePendingTasks[Function: reconcilePendingTasks]
repoSlugsToReposition[Function: repoSlugsToReposition]
stopPipeline[Function: stopPipeline]
rawBlob[Function: rawBlob]
screenRecorder[Function: screenRecorder]
setUserPresence[Function: setUserPresence]
getGuestId[Function: getGuestId]
setGuestPresence[Function: setGuestPresence]
subscribeToSpacePresence[Function: subscribeToSpacePresence]
generateId[Function: generateId]
getCellId[Function: getCellId]
computeGridLayout[Function: computeGridLayout]
computeContainerScale[Function: computeContainerScale]
getGridCellPosition[Function: getGridCellPosition]
repositionAllTasks[Function: repositionAllTasks]
dividerIds[Function: dividerIds]
activeIds[Function: activeIds]
mergedIds[Function: mergedIds]
newCreatedIds[Function: newCreatedIds]
findRepoContainer[Function: findRepoContainer]
getAllRepoContainers[Function: getAllRepoContainers]
assignRepoSlugToOrphanTasks[Function: assignRepoSlugToOrphanTasks]
orphanIds[Function: orphanIds]
countRepoContainers[Function: countRepoContainers]
createRepoContainer[Function: createRepoContainer]
repositionIncomingTasks[Function: repositionIncomingTasks]
unpositionedIds[Function: unpositionedIds]
renumberMap[Function: renumberMap]
rewriteHeader[Function: rewriteHeader]
createTaskObjects[Function: createTaskObjects]
clearRepoTasks[Function: clearRepoTasks]
taskIds[Function: taskIds]
updatedById[Function: updatedById]
toggleTaskExpansion[Function: toggleTaskExpansion]
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
_disposedWeakSet[Function: _disposedWeakSet]
resourceCleanupService[Function: resourceCleanupService]
getStatusColor[Function: getStatusColor]
getStatusLabel[Function: getStatusLabel]
isTaskObject[Function: isTaskObject]
getPipelineTasks[Function: getPipelineTasks]
getNextQueuedTask[Function: getNextQueuedTask]
getNextActionableTask[Function: getNextActionableTask]
getPipelineTasksForRepo[Function: getPipelineTasksForRepo]
getRepoSlugsFromTasks[Function: getRepoSlugsFromTasks]
slugs[Function: slugs]
updateTaskStatus[Function: updateTaskStatus]
cellExistenceCache[Function: cellExistenceCache]
cleanupCache[Function: cleanupCache]
movingObjects[Function: movingObjects]
getCellCoordinates[Function: getCellCoordinates]
getCellCoordinatesWithHysteresis[Function: getCellCoordinatesWithHysteresis]
parseCellId[Function: parseCellId]
getCellBounds[Function: getCellBounds]
createCell[Function: createCell]
createCellsBatch[Function: createCellsBatch]
createCellsBatchOptimized[Function: createCellsBatchOptimized]
cellExists[Function: cellExists]
cellExistsBulk[Function: cellExistsBulk]
getCell[Function: getCell]
addObjectToCell[Function: addObjectToCell]
removeObjectFromCell[Function: removeObjectFromCell]
moveObjectBetweenCells[Function: moveObjectBetweenCells]
getLoadedCells[Function: getLoadedCells]
getObjectsFromCells[Function: getObjectsFromCells]
updateObjectInCell[Function: updateObjectInCell]
deleteObjectFromCell[Function: deleteObjectFromCell]
cellCallbacks[Function: cellCallbacks]
subscribeToCells[Function: subscribeToCells]
getOccupiedCells[Function: getOccupiedCells]
getCellDistance[Function: getCellDistance]
getCellsToUnload[Function: getCellsToUnload]
addConnectionToCells[Function: addConnectionToCells]
bulkSaveConnectionsToCell[Function: bulkSaveConnectionsToCell]
addConnectionToCell[Function: addConnectionToCell]
removeConnectionFromAllCells[Function: removeConnectionFromAllCells]
normalizePosition[Function: normalizePosition]
removeConnectionFromCells[Function: removeConnectionFromCells]
removeConnectionFromCell[Function: removeConnectionFromCell]
getConnectionsFromCells[Function: getConnectionsFromCells]
seenConnectionIds[Function: seenConnectionIds]
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
objectsCache[Function: objectsCache]
saveTimeouts[Function: saveTimeouts]
updateThrottles[Function: updateThrottles]
lastReceivedObjects[Function: lastReceivedObjects]
objectCellMap[Function: objectCellMap]
deletingObjects[Function: deletingObjects]
pendingSaves[Function: pendingSaves]
cancelPendingSave[Function: cancelPendingSave]
enqueueSave[Function: enqueueSave]
flushSaveBatch[Function: flushSaveBatch]
saves[Function: saves]
clearAllObjectCaches[Function: clearAllObjectCaches]
removeObjectFromCaches[Function: removeObjectFromCaches]
VOLATILE_KEYS[Function: VOLATILE_KEYS]
computeNonPositionFingerprint[Function: computeNonPositionFingerprint]
saveObjectToCell[Function: saveObjectToCell]
deleteObjectFromSpatialCell[Function: deleteObjectFromSpatialCell]
updateObjectInSpatialCell[Function: updateObjectInSpatialCell]
clearCellCache[Function: clearCellCache]
objectSubscriptionsByCell[Function: objectSubscriptionsByCell]
cleanupSpatialObjectSubscriptions[Function: cleanupSpatialObjectSubscriptions]
subscribeToSpatialObjects[Function: subscribeToSpatialObjects]
localSubscriptionKeys[Function: localSubscriptionKeys]
updateCellSubscriptions[Function: updateCellSubscriptions]
loadObjectsFromCells[Function: loadObjectsFromCells]
saveObject[Function: saveObject]
deleteObject[Function: deleteObject]
updateObject[Function: updateObject]
subscribeToObjects[Function: subscribeToObjects]
getObjectDeletionStatus[Function: getObjectDeletionStatus]
clearObjectDeletionBlacklist[Function: clearObjectDeletionBlacklist]
generateSharingUrl[Function: generateSharingUrl]
sharingUrl[Function: sharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]
sharedSpacesCache[Function: sharedSpacesCache]
sharedSpacesCacheSet[Function: sharedSpacesCacheSet]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
urlParams[Function: urlParams]
getStorageInstance[Function: getStorageInstance]
ALLOWED_IMAGE_TYPES[Function: ALLOWED_IMAGE_TYPES]
uploadFileGeneric[Function: uploadFileGeneric]
uploadImageToStorage[Function: uploadImageToStorage]
uploadModelToStorage[Function: uploadModelToStorage]
uploadMarkdownToStorage[Function: uploadMarkdownToStorage]
blob[Function: blob]
activeStreams[Function: activeStreams]
getRTCConfiguration[Function: getRTCConfiguration]
initWebRTC[Function: initWebRTC]
peerConnection[Function: peerConnection]
startBroadcasting[Function: startBroadcasting]
broadcastSession[Function: broadcastSession]
joinBroadcast[Function: joinBroadcast]
isPlaneBeingBroadcast[Function: isPlaneBeingBroadcast]
findAvailableBroadcasts[Function: findAvailableBroadcasts]
cleanupWebRTC[Function: cleanupWebRTC]
registerUserPresence[Function: registerUserPresence]
subscribeToUsersInSpace[Function: subscribeToUsersInSpace]
activeUsers[Function: activeUsers]
fiveMinutesAgo[Function: fiveMinutesAgo]
getSpaceById[Function: getSpaceById]
createSpace[Function: createSpace]
getOrCreateDefaultSpace[Function: getOrCreateDefaultSpace]
migrateToDefaultSpace[Function: migrateToDefaultSpace]
getUserSpaces[Function: getUserSpaces]
deleteSpace[Function: deleteSpace]
hasSpaceAccess[Function: hasSpaceAccess]
getPublicSpaceMetadata[Function: getPublicSpaceMetadata]
unifiedCacheManager[Function: unifiedCacheManager]
getStreamlinedSpatialManager[Function: getStreamlinedSpatialManager]
initializeStreamlinedSpatialPartitioning[Function: initializeStreamlinedSpatialPartitioning]
benchmarkStreamlinedSystem[Function: benchmarkStreamlinedSystem]
manager[Function: manager]

%% Stores
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
useCubeStore[[Store: useCubeStore]]
useDiagramStore[[Store: useDiagramStore]]
useAuthStore[[Store: useAuthStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]
useColorPickerStore[[Store: useColorPickerStore]]
useConnectionStore[[Store: useConnectionStore]]
useEarthSettingsStore[[Store: useEarthSettingsStore]]
useFaceStore[[Store: useFaceStore]]
usePipelineStore[[Store: usePipelineStore]]
useObjectsStore[[Store: useObjectsStore]]
useHandTrackingStore[[Store: useHandTrackingStore]]
useIndicatorsStore[[Store: useIndicatorsStore]]
useFaceIndicatorStore[[Store: useFaceIndicatorStore]]
useLODStore[[Store: useLODStore]]
usePlaneStore[[Store: usePlaneStore]]
useTetrahedronStore[[Store: useTetrahedronStore]]
useSpatialManagerStore[[Store: useSpatialManagerStore]]
useScreenShareStore[[Store: useScreenShareStore]]
useSpaceManagerStore[[Store: useSpaceManagerStore]]
useTransformControlsStore[[Store: useTransformControlsStore]]
useTextInputStore[[Store: useTextInputStore]]
usePublicSpaceStore[[Store: usePublicSpaceStore]]
useTextAtlasStore[[Store: useTextAtlasStore]]
useTextObjectStore[[Store: useTextObjectStore]]
useUIOverlayStore[[Store: useUIOverlayStore]]
useWebcamStreamStore[[Store: useWebcamStreamStore]]

%% Utilities

%% Classes
SpatialHash[[Class: SpatialHash]]
AST3DGenerator[[Class: AST3DGenerator]]
ASTBuilder[[Class: ASTBuilder]]
MermaidParser[[Class: MermaidParser]]
Graph[[Class: Graph]]
MarkdownProcessor[[Class: MarkdownProcessor]]
Node[[Class: Node]]
GlobalOptimizationCoordinator[[Class: GlobalOptimizationCoordinator]]
CentralizedBroadcastManager[[Class: CentralizedBroadcastManager]]
ScreenRecordingService[[Class: ScreenRecordingService]]
MarkdownDiagramService[[Class: MarkdownDiagramService]]
ResourceCleanupService[[Class: ResourceCleanupService]]
BroadcastSession[[Class: BroadcastSession]]
UnifiedCacheManager[[Class: UnifiedCacheManager]]
StreamlinedSpatialManager[[Class: StreamlinedSpatialManager]]
BVHNode[[Class: BVHNode]]
BVHAcceleratedRaycaster[[Class: BVHAcceleratedRaycaster]]
ObjectVirtualizer[[Class: ObjectVirtualizer]]
FrameCounter[[Class: FrameCounter]]
GPUResourceTracker[[Class: GPUResourceTracker]]
Point3D[[Class: Point3D]]
BoundingBox[[Class: BoundingBox]]
OptimizedSpatialGrid[[Class: OptimizedSpatialGrid]]
TextAtlas[[Class: TextAtlas]]
MultiPageTextAtlas[[Class: MultiPageTextAtlas]]
WorkerMultiPageTextAtlas[[Class: WorkerMultiPageTextAtlas]]
LayoutEngine[[Class: LayoutEngine]]
AtlasPage[[Class: AtlasPage]]

%% External Libraries
react<Library: react>
@react-three/fiber<Library: @react-three/fiber>
three<Library: three>
@react-three/postprocessing<Library: @react-three/postprocessing>
@react-three/drei/core/Stats<Library: @react-three/drei/core/Stats>
lodash/isEqual<Library: lodash/isEqual>
@react-three/drei<Library: @react-three/drei>
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
@eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint-plugin-react<Library: eslint-plugin-react>
eslint-plugin-react-hooks<Library: eslint-plugin-react-hooks>
eslint-plugin-react-refresh<Library: eslint-plugin-react-refresh>
zustand/shallow<Library: zustand/shallow>
@xyflow/react<Library: @xyflow/react>
@xyflow/react/dist/style.css<Library: @xyflow/react/dist/style.css>
react-colorful<Library: react-colorful>
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
comlink<Library: comlink>
fix-webm-duration<Library: fix-webm-duration>
uuid<Library: uuid>
zustand/traditional<Library: zustand/traditional>
vite<Library: vite>
@vitejs/plugin-react<Library: @vitejs/plugin-react>
vite-plugin-glsl<Library: vite-plugin-glsl>
vite-plugin-wasm<Library: vite-plugin-wasm>
vite-plugin-top-level-await<Library: vite-plugin-top-level-await>

%% Component Internal Functions
bvhintegrationHandleCanvasClick[Function: handleCanvasClick]
appObjects[Function: objects]
appCanViewSpace[Function: canViewSpace]
appShouldRedirect[Function: shouldRedirect]
appHandleSpatialObjectChange[Function: handleSpatialObjectChange]
appSpatialManagerDebug[Function: spatialManagerDebug]
appCheckPositionJitterWithHistory[Function: checkPositionJitterWithHistory]
appLoadedCellsKey[Function: loadedCellsKey]
appPerformInitialObjectFetch[Function: performInitialObjectFetch]
appScheduleLoadingComplete[Function: scheduleLoadingComplete]
appHandleObjectMatrixChanged[Function: handleObjectMatrixChanged]
appDisableOrbitControls[Function: disableOrbitControls]
appEnableOrbitControls[Function: enableOrbitControls]
appHandleLogin[Function: handleLogin]
appHandleObjectClick[Function: handleObjectClick]
appHandleObjectMoveCallback[Function: handleObjectMoveCallback]
appHandleObjectUpdateCallback[Function: handleObjectUpdateCallback]
appHandleFaceIndicatorClickCallback[Function: handleFaceIndicatorClickCallback]
appHandleFaceClick[Function: handleFaceClick]
appHandleCanvasClick[Function: handleCanvasClick]
appUpdateVisibleObjects[Function: updateVisibleObjects]
appThrottledUpdateVisibility[Function: throttledUpdateVisibility]
appHandleCameraUpdate[Function: handleCameraUpdate]
appHandleCameraSettle[Function: handleCameraSettle]
appDeviceInfo[Function: deviceInfo]
appCanvasSettings[Function: canvasSettings]
atlastextspriteGetSharedMaterial[Function: getSharedMaterial]
atlastextspriteAtlas[Function: atlas]
atlastextspriteCalculatedPosition[Function: calculatedPosition]
appshellHandleOpenSpace[Function: handleOpenSpace]
appshellHandleBackToLanding[Function: handleBackToLanding]
appshellHandleTryWithoutAccount[Function: handleTryWithoutAccount]
appshellHandlePopState[Function: handlePopState]
cellboundaryrendererComputeVisibleCells[Function: computeVisibleCells]
cellboundaryrendererBuildGeometry[Function: buildGeometry]
batchedcurvedlinesNumericCacheKey[Function: numericCacheKey]
batchedcurvedlinesPathToSegments[Function: pathToSegments]
batchedcurvedlinesPathsData[Function: pathsData]
batchedcurvedlinesCustomRaycast[Function: customRaycast]
batchedcurvedlinesHandleClick[Function: handleClick]
batchedcurvedlinesHandlePointerOver[Function: handlePointerOver]
batchedcurvedlinesHandlePointerOut[Function: handlePointerOut]
batchedconnectionlinesStraightConnections[Function: straightConnections]
batchedconnectionlinesCustomRaycast[Function: customRaycast]
batchedconnectionlinesHandleClick[Function: handleClick]
batchedconnectionlinesHandlePointerOver[Function: handlePointerOver]
batchedconnectionlinesHandlePointerOut[Function: handlePointerOut]
animatedconnectionlineStructuralKey[Function: structuralKey]
customcameraMemoizedTarget[Function: memoizedTarget]
customcameraControlsRefCallback[Function: controlsRefCallback]
distancefilteredconnectiontextHandlePointerOver[Function: handlePointerOver]
distancefilteredconnectiontextHandlePointerOut[Function: handlePointerOut]
distancefilteredconnectiontextGetTextParametricT[Function: getTextParametricT]
distancefilteredconnectiontextRedistributeFaces[Function: redistributeFaces]
distancefilteredconnectiontextPathToLineSegments[Function: pathToLineSegments]
distancefilteredconnectiontextResolveEndpointPosition[Function: resolveEndpointPosition]
distancefilteredconnectiontextGetLineWidth[Function: getLineWidth]
distancefilteredconnectiontextHandleConnectionClick[Function: handleConnectionClick]
distancefilteredconnectiontextHandleLineTextClick[Function: handleLineTextClick]
distancefilteredconnectiontextHandleLineTextSubmit[Function: handleLineTextSubmit]
distancefilteredconnectiontextHandleLineTextStyleChange[Function: handleLineTextStyleChange]
distancefilteredconnectiontextHandleLineStyleChange[Function: handleLineStyleChange]
distancefilteredconnectiontextHandleLineColorChange[Function: handleLineColorChange]
distancefilteredconnectiontextConnectionData[Function: connectionData]
distancefilteredconnectiontextPathData[Function: pathData]
distancefilteredconnectiontextTextPositionData[Function: textPositionData]
distancefilteredconnectiontextAvailableObjectIds[Function: availableObjectIds]
distancefilteredconnectiontextPathfindingObjects[Function: pathfindingObjects]
distancefilteredconnectiontextObjectsPositionHash[Function: objectsPositionHash]
distancefilteredconnectiontextObjectVisibleConnections[Function: objectVisibleConnections]
distancefilteredconnectiontextFocusedConnections[Function: focusedConnections]
distancefilteredconnectiontextFlowPathHighlightedConnections[Function: flowPathHighlightedConnections]
distancefilteredconnectiontextConnectionsForCulling[Function: connectionsForCulling]
distancefilteredconnectiontextMountNextBatch[Function: mountNextBatch]
distancefilteredconnectiontextProgressiveConnections[Function: progressiveConnections]
distancefilteredconnectiontextObjectPositions[Function: objectPositions]
distancefilteredconnectiontextAllStraightConnections[Function: allStraightConnections]
distancefilteredconnectiontextFaceOverrides[Function: faceOverrides]
distancefilteredconnectiontextTextLabels[Function: textLabels]
distancefilteredconnectiontextHandleBatchedConnectionClick[Function: handleBatchedConnectionClick]
cubefaceGetColoredMaterial[Function: getColoredMaterial]
cubefaceFaceStateSelector[Function: faceStateSelector]
cubefaceFaceMaterial[Function: faceMaterial]
cubefaceHandleClick[Function: handleClick]
cubefaceOffsetMultiplier[Function: offsetMultiplier]
cubefaceOffsetPosition[Function: offsetPosition]
dodecahedronfaceGetDodecahedronColoredMaterial[Function: getDodecahedronColoredMaterial]
dodecahedronfaceFaceMaterial[Function: faceMaterial]
dodecahedronfaceHandleClick[Function: handleClick]
dodecahedronfaceHandleTextClick[Function: handleTextClick]
dodecahedronfaceInverseScale[Function: inverseScale]
dodecahedronfaceAdjustedTextPosition[Function: adjustedTextPosition]
earthglobeHandlePointerDown[Function: handlePointerDown]
earthglobeHandlePointerUp[Function: handlePointerUp]
earthglobeBands[Function: bands]
earthglobeMeshGeometry[Function: meshGeometry]
earthglobeLocalDetail[Function: localDetail]
earthglobeLocalBands[Function: localBands]
earthglobeLocalMeshGeometry[Function: localMeshGeometry]
diagramoverlay2dBuildReactFlowNodes[Function: buildReactFlowNodes]
diagramoverlay2dGetDepth[Function: getDepth]
diagramoverlay2dBuildReactFlowEdges[Function: buildReactFlowEdges]
diagramoverlay2dLayerForType[Function: layerForType]
diagramoverlay2dFilterEdges[Function: filterEdges]
diagramoverlay2dMinimapNodeColor[Function: minimapNodeColor]
diagramoverlay2dFlowPathNames[Function: flowPathNames]
diagramoverlay2dSerialisedGraphData[Function: serialisedGraphData]
diagramoverlay2dSerialisedHierarchy[Function: serialisedHierarchy]
diagramoverlay2dFilteredEdges[Function: filteredEdges]
diagramoverlay2dToggleLayer[Function: toggleLayer]
diagramoverlay2dToggleLayerHandlers[Function: toggleLayerHandlers]
diagramoverlay2dHandleNodeClick[Function: handleNodeClick]
diagramoverlay2dHandleBackTo3D[Function: handleBackTo3D]
colorpickerHandleColorChange[Function: handleColorChange]
colorpickerHandleContainerClick[Function: handleContainerClick]
colorpickerHandleApplyColor[Function: handleApplyColor]
colorpickerHandleCancel[Function: handleCancel]
sphereCreateDodecahedronGeometry[Function: createDodecahedronGeometry]
sphereDodecahedronData[Function: dodecahedronData]
sphereUpdateObjectAndStores[Function: updateObjectAndStores]
sphereUpdateFaceProperty[Function: updateFaceProperty]
sphereIsIndicatorConnected[Function: isIndicatorConnected]
sphereOnClickOutside[Function: onClickOutside]
sphereUpdateDatabase[Function: updateDatabase]
sphereHandleTransformToggle[Function: handleTransformToggle]
sphereHandleHeaderToggle[Function: handleHeaderToggle]
sphereHandleHeaderSubmit[Function: handleHeaderSubmit]
sphereHandleResizeToggle[Function: handleResizeToggle]
sphereHandleDrag[Function: handleDrag]
sphereHandleScale[Function: handleScale]
sphereHandleFaceClick[Function: handleFaceClick]
sphereHandleIndicatorClick[Function: handleIndicatorClick]
sphereHandleHeaderClick[Function: handleHeaderClick]
sphereHandleStyleChange[Function: handleStyleChange]
sphereHandleLineColorChange[Function: handleLineColorChange]
sphereHandleBackgroundClick[Function: handleBackgroundClick]
sphereHandleFaceTextSubmit[Function: handleFaceTextSubmit]
sphereHandleFaceTextButtonClick[Function: handleFaceTextButtonClick]
sphereHandleFaceTextClick[Function: handleFaceTextClick]
sphereHandleFaceTextStyleChange[Function: handleFaceTextStyleChange]
sphereGetUIPosition[Function: getUIPosition]
sphereGetHeaderPosition[Function: getHeaderPosition]
sphereGetFaceUIPosition[Function: getFaceUIPosition]
sphereGetFaceTextPosition[Function: getFaceTextPosition]
sphereGetFaceInfo[Function: getFaceInfo]
sphereGetFaceRotation[Function: getFaceRotation]
sphereShouldShowFaceIndicator[Function: shouldShowFaceIndicator]
sphereGetHeaderInputPosition[Function: getHeaderInputPosition]
cubeRunReconcile[Function: runReconcile]
cubeCubeData[Function: cubeData]
cubeIsIndicatorConnected[Function: isIndicatorConnected]
cubeIsIndicatorActive[Function: isIndicatorActive]
cubeGetUIPositions[Function: getUIPositions]
cubeShouldShowIndicator[Function: shouldShowIndicator]
cubeHasConnectedIndicators[Function: hasConnectedIndicators]
cubeGetFaceTextOffset[Function: getFaceTextOffset]
cubeHandleSceneClick[Function: handleSceneClick]
cubeUpdateDatabase[Function: updateDatabase]
cubeOnClickOutside[Function: onClickOutside]
cubeHandleFaceClick[Function: handleFaceClick]
cubeHandleColoredFaceClick[Function: handleColoredFaceClick]
cubeHandleIndicatorClick[Function: handleIndicatorClick]
cubeHandleTransformToggle[Function: handleTransformToggle]
cubeHandleResizeToggle[Function: handleResizeToggle]
cubeHandleHeaderToggle[Function: handleHeaderToggle]
cubeHandleHeaderSubmit[Function: handleHeaderSubmit]
cubeDebouncedUpdate[Function: debouncedUpdate]
cubeHandleLineColorChange[Function: handleLineColorChange]
cubeHandleFaceColorChange[Function: handleFaceColorChange]
cubeHandleTextClick[Function: handleTextClick]
cubeHandleFaceTextClick[Function: handleFaceTextClick]
cubeHandleFaceTextSubmit[Function: handleFaceTextSubmit]
cubeHandleFaceTextStyleClick[Function: handleFaceTextStyleClick]
cubeHandleStyleChange[Function: handleStyleChange]
cubeHandleDrag[Function: handleDrag]
cubeHandleScale[Function: handleScale]
cubeRenderFaces[Function: renderFaces]
cubeRenderFaceTexts[Function: renderFaceTexts]
cubeArraysEqual[Function: arraysEqual]
cubeShallowObjEqual[Function: shallowObjEqual]
globalcubefulllodinstancedrendererIsCubeUnmodified[Function: isCubeUnmodified]
globalcubefulllodinstancedrendererInstancedCubes[Function: instancedCubes]
globalcubefulllodinstancedrendererCubeIds[Function: cubeIds]
globalcubefulllodinstancedrendererHandleClick[Function: handleClick]
globalcubemediumlodrendererMediumCubes[Function: mediumCubes]
globalcubemediumlodrendererCubeIds[Function: cubeIds]
globalcubefacerendererFilteredCubes[Function: filteredCubes]
faceuiHandleBorderStyleClick[Function: handleBorderStyleClick]
faceuiHandleBorderColorClick[Function: handleBorderColorClick]
faceuiHandleLineThicknessClick[Function: handleLineThicknessClick]
faceuiHandleColorSelect[Function: handleColorSelect]
faceuiHandleToolClick[Function: handleToolClick]
globaldodecahedronedgesrenderer_ensureDodecaWasmBuffers[Function: _ensureDodecaWasmBuffers]
globaldodecahedronedgesrendererFilteredDodecahedrons[Function: filteredDodecahedrons]
globaldodecahedronedgesrendererDodecahedronIds[Function: dodecahedronIds]
globaldodecahedronedgesrendererIsDodecahedronVisible[Function: isDodecahedronVisible]
globaldodecahedronedgesrendererUpdateDodecahedronEdges[Function: updateDodecahedronEdges]
facetextinputHandleKeyDown[Function: handleKeyDown]
facetextinputHandleChange[Function: handleChange]
facetextinputHandleFocus[Function: handleFocus]
facetextinputHandleBlur[Function: handleBlur]
globalcubeedgesrenderer_ensureCubeWasmBuffers[Function: _ensureCubeWasmBuffers]
globalcubeedgesrendererFilteredCubes[Function: filteredCubes]
globalcubeedgesrendererCubeIds[Function: cubeIds]
globalcubeedgesrendererIsCubeVisible[Function: isCubeVisible]
globalcubeedgesrendererUpdateCubeEdges[Function: updateCubeEdges]
faceindicatorGetIndicatorMaterial[Function: getIndicatorMaterial]
faceindicatorMaterial[Function: material]
globaltetrahedronedgesrenderer_ensureTetraWasmBuffers[Function: _ensureTetraWasmBuffers]
globaltetrahedronedgesrendererFilteredTetrahedrons[Function: filteredTetrahedrons]
globaltetrahedronedgesrendererTetrahedronIds[Function: tetrahedronIds]
globaltetrahedronedgesrendererIsTetrahedronVisible[Function: isTetrahedronVisible]
globaltetrahedronedgesrendererUpdateTetrahedronEdges[Function: updateTetrahedronEdges]
globaldodecahedronmediumlodrendererMediumDodecahedrons[Function: mediumDodecahedrons]
globaldodecahedronmediumlodrendererDodecaIds[Function: dodecaIds]
globaltetrahedronmediumlodrenderer_buildTetraGeometry[Function: _buildTetraGeometry]
globaltetrahedronmediumlodrendererMediumTetrahedrons[Function: mediumTetrahedrons]
globaltetrahedronmediumlodrendererTetraIds[Function: tetraIds]
instancedatlastextAtlas[Function: atlas]
instancedatlastextPageGroups[Function: pageGroups]
instancedatlastextGeometry[Function: geometry]
instancedatlastextMaterial[Function: material]
instancedatlastextHandleClick[Function: handleClick]
handsrendererReadLandmark[Function: readLandmark]
handsrendererApplyJoints[Function: applyJoints]
handsrendererBuildBonePoints[Function: buildBonePoints]
handsrendererMakeHandState[Function: makeHandState]
headerinputHandleKeyDown[Function: handleKeyDown]
headerinputHandleChange[Function: handleChange]
headerinputHandleFocus[Function: handleFocus]
headerinputHandleBlur[Function: handleBlur]
lineuiGetFullStyle[Function: getFullStyle]
lineuiGetBaseStyle[Function: getBaseStyle]
lineuiHandleToolClick[Function: handleToolClick]
lineuiHandleLineStyleClick[Function: handleLineStyleClick]
lineuiHandleArrowClick[Function: handleArrowClick]
lodmanagerContainersKey[Function: containersKey]
lodmanagerComputeContainmentSync[Function: computeContainmentSync]
lodmanagerEnqueueLODUpdates[Function: enqueueLODUpdates]
instancedlineFlatPoints[Function: flatPoints]
instancedlineGeometry[Function: geometry]
instancedlineCustomRaycast[Function: customRaycast]
instancedlineMaterial[Function: material]
objectrendererOnClickStable[Function: onClickStable]
objectrendererOnDeleteStable[Function: onDeleteStable]
objectrendererOnTransformStartStable[Function: onTransformStartStable]
objectrendererOnTransformEndStable[Function: onTransformEndStable]
objectrendererOnMatrixChangedStable[Function: onMatrixChangedStable]
objectrendererOnMoveStable[Function: onMoveStable]
objectrendererArraysEqual[Function: arraysEqual]
screensharestreamAttemptPlay[Function: attemptPlay]
screensharestreamConnectToBroadcast[Function: connectToBroadcast]
modelobjectCreateLoaders[Function: createLoaders]
modelobjectHandleClick[Function: handleClick]
modelobjectHandlePointerDown[Function: handlePointerDown]
modelobjectHandlePointerUp[Function: handlePointerUp]
realtimeconnectionupdaterRunConnectionUpdate[Function: runConnectionUpdate]
realtimeconnectionupdaterUpdateConnectionEndpoint[Function: updateConnectionEndpoint]
realtimeconnectionupdaterRebuildConnectionMap[Function: rebuildConnectionMap]
repogridContainers[Function: containers]
repogridGridData[Function: gridData]
planePlaneData[Function: planeData]
planeCloseAllUIs[Function: closeAllUIs]
planeUpdateDatabase[Function: updateDatabase]
planeHandleScale[Function: handleScale]
planeHandleResizeEnd[Function: handleResizeEnd]
planeHandleDrag[Function: handleDrag]
planeHandleTransformStart[Function: handleTransformStart]
planeHandleTransformEnd[Function: handleTransformEnd]
planeHandleClick[Function: handleClick]
planeHandleTextClick[Function: handleTextClick]
planeHandleTextSubmit[Function: handleTextSubmit]
planeHandleTextStyleChange[Function: handleTextStyleChange]
planeHandleTextSpriteClick[Function: handleTextSpriteClick]
planeHandleTransformToggle[Function: handleTransformToggle]
planeHandleResizeToggle[Function: handleResizeToggle]
planeHandleColorChange[Function: handleColorChange]
planeHandleHeaderToggle[Function: handleHeaderToggle]
planeHandleHeaderSubmit[Function: handleHeaderSubmit]
planeHandleHeaderTextClick[Function: handleHeaderTextClick]
planeHandleHeaderStyleChange[Function: handleHeaderStyleChange]
planeHandleBorderToggle[Function: handleBorderToggle]
planeHandleIndicatorClick[Function: handleIndicatorClick]
planeIsIndicatorConnected[Function: isIndicatorConnected]
planeShouldShowIndicator[Function: shouldShowIndicator]
planeHandleBroadcastStopped[Function: handleBroadcastStopped]
planeHandleWebcamToggle[Function: handleWebcamToggle]
planeHandleScreenShareToggle[Function: handleScreenShareToggle]
planeHandlePinToggle[Function: handlePinToggle]
planeHandleImageUpload[Function: handleImageUpload]
planeHandleBroadcastStarted[Function: handleBroadcastStarted]
planeHandleViewerCountChange[Function: handleViewerCountChange]
planeUiPositions[Function: uiPositions]
planeIndicatorPosition[Function: indicatorPosition]
planeMeshMaterial[Function: meshMaterial]
planeLineMaterialProps[Function: lineMaterialProps]
planeBorderEdgePoints[Function: borderEdgePoints]
objectsrendererMountNextBatch[Function: mountNextBatch]
objectsrendererMountResume[Function: mountResume]
objectsrendererProgressiveVisibleObjects[Function: progressiveVisibleObjects]
objectsrendererCubeObjects[Function: cubeObjects]
objectsrendererContainerHeaders[Function: containerHeaders]
objectsrendererDodecahedronObjects[Function: dodecahedronObjects]
objectsrendererTetrahedronObjects[Function: tetrahedronObjects]
objectsrendererUnmodifiedCubeIds[Function: unmodifiedCubeIds]
objectsrendererHandleInstancedCubeClick[Function: handleInstancedCubeClick]
objectsrendererRenderedObjects[Function: renderedObjects]
objectuiHandleEyeClick[Function: handleEyeClick]
objectuiHandleColorPick[Function: handleColorPick]
objectuiHandleToolClick[Function: handleToolClick]
spacechatGetGuestId[Function: getGuestId]
spacechatSenderInitials[Function: senderInitials]
spacechatMergeMessages[Function: mergeMessages]
spacechatHandleScroll[Function: handleScroll]
spacechatHandleSend[Function: handleSend]
spacechatHandleKeyDown[Function: handleKeyDown]
avatarGetInitials[Function: getInitials]
avatarHandleClick[Function: handleClick]
tetrahedronfaceGetTetrahedronColoredMaterial[Function: getTetrahedronColoredMaterial]
tetrahedronfaceFaceMaterial[Function: faceMaterial]
tetrahedronfaceHandleClick[Function: handleClick]
tetrahedronfaceHandleIndicatorClickLocal[Function: handleIndicatorClickLocal]
tetrahedronfaceGetFaceTextOffset[Function: getFaceTextOffset]
tetrahedronfaceHandleFaceTextStyleClick[Function: handleFaceTextStyleClick]
tetrahedronfaceHandleFaceTextStyleChange[Function: handleFaceTextStyleChange]
tetrahedronfaceFaceTextElement[Function: faceTextElement]
textobjectText[Function: text]
textobjectTextStyle[Function: textStyle]
textobjectScale[Function: scale]
textobjectSetOrbitControlsEnabled[Function: setOrbitControlsEnabled]
textobjectSetText[Function: setText]
textobjectSetTextStyle[Function: setTextStyle]
textobjectSetScale[Function: setScale]
textobjectSetIsEditing[Function: setIsEditing]
textobjectSetIsActivelyEditing[Function: setIsActivelyEditing]
textobjectSetIndicatorSelected[Function: setIndicatorSelected]
textobjectSetContentHeight[Function: setContentHeight]
textobjectSetShowTransform[Function: setShowTransform]
textobjectSetShowResizeControls[Function: setShowResizeControls]
textobjectSetBulletPointMode[Function: setBulletPointMode]
textobjectHandleTransformToggle[Function: handleTransformToggle]
textobjectHandleResizeToggle[Function: handleResizeToggle]
textobjectGetIndicatorOffset[Function: getIndicatorOffset]
textobjectIsIndicatorConnected[Function: isIndicatorConnected]
textobjectShouldShowIndicator[Function: shouldShowIndicator]
textobjectGetIndicatorPositions[Function: getIndicatorPositions]
textobjectUpdateWorldMatrix[Function: updateWorldMatrix]
textobjectCloseAllUIs[Function: closeAllUIs]
textobjectUpdateDatabase[Function: updateDatabase]
textobjectAutoResizeTextAreaOnly[Function: autoResizeTextAreaOnly]
textobjectAutoResizeTextArea[Function: autoResizeTextArea]
textobjectHandleBlur[Function: handleBlur]
textobjectHandleDivClick[Function: handleDivClick]
textobjectHandleTextClick[Function: handleTextClick]
textobjectHandleIndicatorClick[Function: handleIndicatorClick]
textobjectHandleDrag[Function: handleDrag]
textobjectHandleScale[Function: handleScale]
textobjectHandleKeyDown[Function: handleKeyDown]
textobjectHandleStyleChange[Function: handleStyleChange]
textobjectApplyStyleToSelectionInternal[Function: applyStyleToSelectionInternal]
textobjectHandleTextSelection[Function: handleTextSelection]
textobjectGetTextAreaStyle[Function: getTextAreaStyle]
textobjectGetContainerStyle[Function: getContainerStyle]
textobjectGetEffectivePosition[Function: getEffectivePosition]
textobjectGetTransformControlSize[Function: getTransformControlSize]
tetrahedronArraysEqual[Function: arraysEqual]
tetrahedronShallowObjEqual[Function: shallowObjEqual]
tetrahedron_createTriangleGeometry[Function: _createTriangleGeometry]
tetrahedronGetFaceIndicatorProps[Function: getFaceIndicatorProps]
tetrahedronTetrahedronFaces[Function: tetrahedronFaces]
tetrahedronDebouncedUpdate[Function: debouncedUpdate]
tetrahedronIsIndicatorConnected[Function: isIndicatorConnected]
tetrahedronIsIndicatorActive[Function: isIndicatorActive]
tetrahedronGetUIPositions[Function: getUIPositions]
tetrahedronShouldShowIndicator[Function: shouldShowIndicator]
tetrahedronHasConnectedIndicators[Function: hasConnectedIndicators]
tetrahedronTetrahedronEdgePoints[Function: tetrahedronEdgePoints]
tetrahedronHandleSceneClick[Function: handleSceneClick]
tetrahedronUpdateDatabase[Function: updateDatabase]
tetrahedronHandleFaceClick[Function: handleFaceClick]
tetrahedronHandleColoredFaceClick[Function: handleColoredFaceClick]
tetrahedronHandleIndicatorClick[Function: handleIndicatorClick]
tetrahedronHandleTransformToggle[Function: handleTransformToggle]
tetrahedronHandleResizeToggle[Function: handleResizeToggle]
tetrahedronHandleHeaderToggle[Function: handleHeaderToggle]
tetrahedronHandleHeaderSubmit[Function: handleHeaderSubmit]
tetrahedronHandleLineColorChange[Function: handleLineColorChange]
tetrahedronHandleDrag[Function: handleDrag]
tetrahedronHandleScale[Function: handleScale]
tetrahedronGetFaceTextOffset[Function: getFaceTextOffset]
tetrahedronHandleFaceTextStyleClick[Function: handleFaceTextStyleClick]
tetrahedronHandleFaceTextStyleChange[Function: handleFaceTextStyleChange]
tetrahedronRenderFaceTexts[Function: renderFaceTexts]
tetrahedronRenderFaces[Function: renderFaces]
textspriteLerpVector[Function: lerpVector]
textspriteSpriteId[Function: spriteId]
textspriteSetIsDragging[Function: setIsDragging]
textspriteCalculatedPosition[Function: calculatedPosition]
textspriteGetFontSize[Function: getFontSize]
textstyleuicontentHandleSizeChange[Function: handleSizeChange]
textstyleuicontentHandleFontSizeInputChange[Function: handleFontSizeInputChange]
textstyleuicontentHandleWheel[Function: handleWheel]
textstyleuicontentHandleButtonClick[Function: handleButtonClick]
textstyleuicontentHandleColorSelect[Function: handleColorSelect]
textstyleuicontentHandleSelectChange[Function: handleSelectChange]
textstyleuicontentGetUIScale[Function: getUIScale]
textobjectuiHandleUIClick[Function: handleUIClick]
textobjectuiHandleResizeToggle[Function: handleResizeToggle]
textobjectuiHandleEyeClick[Function: handleEyeClick]
earthsidebarsectionsPipelineTasks[Function: pipelineTasks]
earthsidebarsectionsPipelineStatusCounts[Function: pipelineStatusCounts]
earthsidebarsectionsSetIsRecording[Function: setIsRecording]
earthsidebarsectionsHandleCellBoundariesToggle[Function: handleCellBoundariesToggle]
earthsidebarsectionsFetchRepositories[Function: fetchRepositories]
earthsidebarsectionsFetchAppJsxFromRepo[Function: fetchAppJsxFromRepo]
earthsidebarsectionsHandleRescan[Function: handleRescan]
earthsidebarsectionsHandleDownloadMarkdown[Function: handleDownloadMarkdown]
earthsidebarsectionsTriggerDownload[Function: triggerDownload]
earthsidebarsectionsHandleScreenClick[Function: handleScreenClick]
earthsidebarsectionsHandleRuntimeScan[Function: handleRuntimeScan]
earthsidebarsectionsHandleRecordClick[Function: handleRecordClick]
earthsidebarsectionsHandler[Function: handler]
earthsidebarsectionsHandleDeleteAllCells[Function: handleDeleteAllCells]
earthsidebarsectionsPollStatus[Function: pollStatus]
earthsidebarsectionsHandleModelUpload[Function: handleModelUpload]
earthsidebarsectionsHandleModelFileSelect[Function: handleModelFileSelect]
earthsidebarsectionsHandleMarkdownUpload[Function: handleMarkdownUpload]
earthsidebarsectionsHandleMarkdownFileSelect[Function: handleMarkdownFileSelect]
earthsidebarsectionsHandleCsvUpload[Function: handleCsvUpload]
earthsidebarsectionsHandleCsvFileSelect[Function: handleCsvFileSelect]
earthsidebarsectionsHandleMenuToggle[Function: handleMenuToggle]
earthsidebarsectionsHandleArrowClick[Function: handleArrowClick]
earthsidebarsectionsHandleUnpinWebcam[Function: handleUnpinWebcam]
earthsidebarsectionsHandleTemplateConfigChange[Function: handleTemplateConfigChange]
earthsidebarsectionsCreateTemplate[Function: createTemplate]
merfolknodeBuildNodeStyles[Function: buildNodeStyles]
merfolknodeBuildContainerStyles[Function: buildContainerStyles]
merfolknodeBuildPrecomputedNode[Function: buildPrecomputedNode]
merfolkedgeFlowPathColor[Function: flowPathColor]
merfolkedgeGetEdgeStyle[Function: getEdgeStyle]
merfolkedgeGetMarkerEnd[Function: getMarkerEnd]
merfolkedgeGetSelectedStyle[Function: getSelectedStyle]
merfolkedgeGetUnselectedStyle[Function: getUnselectedStyle]
webcamstreamApplyVideoTexture[Function: applyVideoTexture]
webcamstreamAttemptPlay[Function: attemptPlay]
webcamstreamConnectToBroadcast[Function: connectToBroadcast]
perspectivegridIdx[Function: idx]
perspectivegridAddEdge[Function: addEdge]
dodecahedronwireframeGenerateDodecahedronEdges[Function: generateDodecahedronEdges]
landingappScheduleScrollUpdate[Function: scheduleScrollUpdate]
landingappHandleWheel[Function: handleWheel]
landingappHandleTouchStart[Function: handleTouchStart]
landingappHandleTouchMove[Function: handleTouchMove]
landingappCreateUserDocument[Function: createUserDocument]
landingappHandleLogin[Function: handleLogin]
landingappHandleLogout[Function: handleLogout]
landingappNavigateToSpace[Function: navigateToSpace]
landingappFetchUserSpaces[Function: fetchUserSpaces]
landingappCreateNewSpace[Function: createNewSpace]
landingappHandleShareSpace[Function: handleShareSpace]
landingappHandleDeleteSpace[Function: handleDeleteSpace]
landingappHandleLeaveSpace[Function: handleLeaveSpace]
landingappHandleFirstCubeComplete[Function: handleFirstCubeComplete]
landingappHandleDodecahedronComplete[Function: handleDodecahedronComplete]
landingappHandleAcceptInvite[Function: handleAcceptInvite]
landingappHandleDeclineInvite[Function: handleDeclineInvite]
landingappSpaceTableProps[Function: spaceTableProps]
landingappCreateSpaceProps[Function: createSpaceProps]
landingappSharePopupProps[Function: sharePopupProps]
fakeglowmaterialFakeGlowMaterial[Function: FakeGlowMaterial]
updateseditorHandleKeyCommand[Function: handleKeyCommand]
updateseditorToggleInlineStyle[Function: toggleInlineStyle]
updateseditorHandleSave[Function: handleSave]
createorganizationpopupHandleKeyPress[Function: handleKeyPress]
createorganizationpopupHandleSubmit[Function: handleSubmit]
updatesviewerParsedContent[Function: parsedContent]
updatesviewerFormattedTimestamp[Function: formattedTimestamp]
createspacepopupHandleSpaceNameChange[Function: handleSpaceNameChange]
createspacepopupHandleEmailChange[Function: handleEmailChange]
createspacepopupHandleMemberSelect[Function: handleMemberSelect]
createspacepopupHandleKeyPress[Function: handleKeyPress]
createspacepopupHandleSubmit[Function: handleSubmit]
dodecahedronwireframe2GenerateDodecahedronEdges[Function: generateDodecahedronEdges]
contentpanelClamp01[Function: clamp01]
contentpanelGetSectionVisibility[Function: getSectionVisibility]
whiteplaneMaterial[Function: material]
orgmemberdropdownHandleClickOutside[Function: handleClickOutside]
orgmemberdropdownHandleInputFocus[Function: handleInputFocus]
orgmemberdropdownHandleInputChange[Function: handleInputChange]
orgmemberdropdownHandleSelect[Function: handleSelect]
organizationmanagerRefresh[Function: refresh]
organizationmanagerHandleCreateOrg[Function: handleCreateOrg]
organizationmanagerHandleInvite[Function: handleInvite]
organizationmanagerHandleRemoveMember[Function: handleRemoveMember]
organizationmanagerHandleLeave[Function: handleLeave]
organizationmanagerHandleUpgradePlan[Function: handleUpgradePlan]
organizationmanagerHandleDeleteOrg[Function: handleDeleteOrg]
organizationmanagerHandleAcceptInvite[Function: handleAcceptInvite]
organizationmanagerHandleDeclineInvite[Function: handleDeclineInvite]
spacestableHandleSpaceClick[Function: handleSpaceClick]
spacestableThStyles[Function: thStyles]
spacestableTdStyles[Function: tdStyles]
spacestableCategoryRowStyles[Function: categoryRowStyles]
spacestableInviteBannerStyle[Function: inviteBannerStyle]
sharespacepopupStringToColor[Function: stringToColor]
sharespacepopupFilteredMembers[Function: filteredMembers]
sharespacepopupToggleMember[Function: toggleMember]
sharespacepopupHandleShare[Function: handleShare]

%% Component-Function Relationships
BVHIntegration -.-> bvhintegrationHandleCanvasClick : "event handler"
App -.-> appObjects : "internal function"
App -.-> appCanViewSpace : "internal function"
App -.-> appShouldRedirect : "boolean check"
App -.-> appHandleSpatialObjectChange : "event handler"
App -.-> appSpatialManagerDebug : "internal function"
App -.-> appCheckPositionJitterWithHistory : "boolean check"
App -.-> appLoadedCellsKey : "internal function"
App -.-> appPerformInitialObjectFetch : "internal function"
App -.-> appScheduleLoadingComplete : "internal function"
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
App -.-> appHandleCameraUpdate : "event handler"
App -.-> appHandleCameraSettle : "event handler"
App -.-> appDeviceInfo : "internal function"
App -.-> appCanvasSettings : "setter function"
AtlasTextSprite -.-> atlastextspriteGetSharedMaterial : "getter function"
AtlasTextSprite -.-> atlastextspriteAtlas : "internal function"
AtlasTextSprite -.-> atlastextspriteCalculatedPosition : "calculation helper"
AppShell -.-> appshellHandleOpenSpace : "event handler"
AppShell -.-> appshellHandleBackToLanding : "event handler"
AppShell -.-> appshellHandleTryWithoutAccount : "event handler"
AppShell -.-> appshellHandlePopState : "event handler"
CellBoundaryRenderer -.-> cellboundaryrendererComputeVisibleCells : "calculation helper"
CellBoundaryRenderer -.-> cellboundaryrendererBuildGeometry : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesNumericCacheKey : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesPathToSegments : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesPathsData : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesCustomRaycast : "internal function"
BatchedCurvedLines -.-> batchedcurvedlinesHandleClick : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOver : "event handler"
BatchedCurvedLines -.-> batchedcurvedlinesHandlePointerOut : "event handler"
BatchedConnectionLines -.-> batchedconnectionlinesStraightConnections : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesCustomRaycast : "internal function"
BatchedConnectionLines -.-> batchedconnectionlinesHandleClick : "event handler"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOver : "event handler"
BatchedConnectionLines -.-> batchedconnectionlinesHandlePointerOut : "event handler"
AnimatedConnectionLine -.-> animatedconnectionlineStructuralKey : "internal function"
CustomCamera -.-> customcameraMemoizedTarget : "getter function"
CustomCamera -.-> customcameraControlsRefCallback : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandlePointerOver : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandlePointerOut : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextGetTextParametricT : "getter function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextRedistributeFaces : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathToLineSegments : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextResolveEndpointPosition : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextGetLineWidth : "getter function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandleConnectionClick : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandleLineTextClick : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandleLineTextSubmit : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandleLineTextStyleChange : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandleLineStyleChange : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandleLineColorChange : "event handler"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextConnectionData : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathData : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextTextPositionData : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextAvailableObjectIds : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextPathfindingObjects : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextObjectsPositionHash : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextObjectVisibleConnections : "boolean check"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextFocusedConnections : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextFlowPathHighlightedConnections : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextConnectionsForCulling : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextMountNextBatch : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextProgressiveConnections : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextObjectPositions : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextAllStraightConnections : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextFaceOverrides : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextTextLabels : "internal function"
DistanceFilteredConnectionText -.-> distancefilteredconnectiontextHandleBatchedConnectionClick : "event handler"
CubeFace -.-> cubefaceGetColoredMaterial : "getter function"
CubeFace -.-> cubefaceFaceStateSelector : "internal function"
CubeFace -.-> cubefaceFaceMaterial : "internal function"
CubeFace -.-> cubefaceHandleClick : "event handler"
CubeFace -.-> cubefaceOffsetMultiplier : "setter function"
CubeFace -.-> cubefaceOffsetPosition : "setter function"
DodecahedronFace -.-> dodecahedronfaceGetDodecahedronColoredMaterial : "getter function"
DodecahedronFace -.-> dodecahedronfaceFaceMaterial : "internal function"
DodecahedronFace -.-> dodecahedronfaceHandleClick : "event handler"
DodecahedronFace -.-> dodecahedronfaceHandleTextClick : "event handler"
DodecahedronFace -.-> dodecahedronfaceInverseScale : "internal function"
DodecahedronFace -.-> dodecahedronfaceAdjustedTextPosition : "internal function"
EarthGlobe -.-> earthglobeHandlePointerDown : "event handler"
EarthGlobe -.-> earthglobeHandlePointerUp : "event handler"
EarthGlobe -.-> earthglobeBands : "internal function"
EarthGlobe -.-> earthglobeMeshGeometry : "internal function"
EarthGlobe -.-> earthglobeLocalDetail : "internal function"
EarthGlobe -.-> earthglobeLocalBands : "internal function"
EarthGlobe -.-> earthglobeLocalMeshGeometry : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dBuildReactFlowNodes : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dGetDepth : "getter function"
DiagramOverlay2D -.-> diagramoverlay2dBuildReactFlowEdges : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dLayerForType : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dFilterEdges : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dMinimapNodeColor : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dFlowPathNames : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedGraphData : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dSerialisedHierarchy : "boolean check"
DiagramOverlay2D -.-> diagramoverlay2dFilteredEdges : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayer : "internal function"
DiagramOverlay2D -.-> diagramoverlay2dToggleLayerHandlers : "event handler"
DiagramOverlay2D -.-> diagramoverlay2dHandleNodeClick : "event handler"
DiagramOverlay2D -.-> diagramoverlay2dHandleBackTo3D : "event handler"
ColorPicker -.-> colorpickerHandleColorChange : "event handler"
ColorPicker -.-> colorpickerHandleContainerClick : "event handler"
ColorPicker -.-> colorpickerHandleApplyColor : "event handler"
ColorPicker -.-> colorpickerHandleCancel : "event handler"
Sphere -.-> sphereCreateDodecahedronGeometry : "internal function"
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
Cube -.-> cubeRunReconcile : "internal function"
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
Cube -.-> cubeArraysEqual : "internal function"
Cube -.-> cubeShallowObjEqual : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> globalcubefulllodinstancedrendererIsCubeUnmodified : "boolean check"
GlobalCubeFullLODInstancedRenderer -.-> globalcubefulllodinstancedrendererInstancedCubes : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> globalcubefulllodinstancedrendererCubeIds : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> globalcubefulllodinstancedrendererHandleClick : "event handler"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererMediumCubes : "internal function"
GlobalCubeMediumLODRenderer -.-> globalcubemediumlodrendererCubeIds : "internal function"
GlobalCubeFaceRenderer -.-> globalcubefacerendererFilteredCubes : "internal function"
FaceUI -.-> faceuiHandleBorderStyleClick : "event handler"
FaceUI -.-> faceuiHandleBorderColorClick : "event handler"
FaceUI -.-> faceuiHandleLineThicknessClick : "event handler"
FaceUI -.-> faceuiHandleColorSelect : "event handler"
FaceUI -.-> faceuiHandleToolClick : "event handler"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrenderer_ensureDodecaWasmBuffers : "internal function"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererFilteredDodecahedrons : "internal function"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererDodecahedronIds : "internal function"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererIsDodecahedronVisible : "boolean check"
GlobalDodecahedronEdgesRenderer -.-> globaldodecahedronedgesrendererUpdateDodecahedronEdges : "update helper"
FaceTextInput -.-> facetextinputHandleKeyDown : "event handler"
FaceTextInput -.-> facetextinputHandleChange : "event handler"
FaceTextInput -.-> facetextinputHandleFocus : "event handler"
FaceTextInput -.-> facetextinputHandleBlur : "event handler"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrenderer_ensureCubeWasmBuffers : "internal function"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererFilteredCubes : "internal function"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererCubeIds : "internal function"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererIsCubeVisible : "boolean check"
GlobalCubeEdgesRenderer -.-> globalcubeedgesrendererUpdateCubeEdges : "update helper"
FaceIndicator -.-> faceindicatorGetIndicatorMaterial : "getter function"
FaceIndicator -.-> faceindicatorMaterial : "internal function"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrenderer_ensureTetraWasmBuffers : "internal function"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererFilteredTetrahedrons : "internal function"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererTetrahedronIds : "internal function"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererIsTetrahedronVisible : "boolean check"
GlobalTetrahedronEdgesRenderer -.-> globaltetrahedronedgesrendererUpdateTetrahedronEdges : "update helper"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererMediumDodecahedrons : "internal function"
GlobalDodecahedronMediumLODRenderer -.-> globaldodecahedronmediumlodrendererDodecaIds : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrenderer_buildTetraGeometry : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererMediumTetrahedrons : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> globaltetrahedronmediumlodrendererTetraIds : "internal function"
InstancedAtlasText -.-> instancedatlastextAtlas : "internal function"
InstancedAtlasText -.-> instancedatlastextPageGroups : "internal function"
InstancedAtlasText -.-> instancedatlastextGeometry : "internal function"
InstancedAtlasText -.-> instancedatlastextMaterial : "internal function"
InstancedAtlasText -.-> instancedatlastextHandleClick : "event handler"
HandsRenderer -.-> handsrendererReadLandmark : "internal function"
HandsRenderer -.-> handsrendererApplyJoints : "internal function"
HandsRenderer -.-> handsrendererBuildBonePoints : "internal function"
HandsRenderer -.-> handsrendererMakeHandState : "internal function"
HeaderInput -.-> headerinputHandleKeyDown : "event handler"
HeaderInput -.-> headerinputHandleChange : "event handler"
HeaderInput -.-> headerinputHandleFocus : "event handler"
HeaderInput -.-> headerinputHandleBlur : "event handler"
LineUI -.-> lineuiGetFullStyle : "getter function"
LineUI -.-> lineuiGetBaseStyle : "getter function"
LineUI -.-> lineuiHandleToolClick : "event handler"
LineUI -.-> lineuiHandleLineStyleClick : "event handler"
LineUI -.-> lineuiHandleArrowClick : "event handler"
LODManager -.-> lodmanagerContainersKey : "internal function"
LODManager -.-> lodmanagerComputeContainmentSync : "calculation helper"
LODManager -.-> lodmanagerEnqueueLODUpdates : "update helper"
InstancedLine -.-> instancedlineFlatPoints : "internal function"
InstancedLine -.-> instancedlineGeometry : "internal function"
InstancedLine -.-> instancedlineCustomRaycast : "internal function"
InstancedLine -.-> instancedlineMaterial : "internal function"
ObjectRenderer -.-> objectrendererOnClickStable : "internal function"
ObjectRenderer -.-> objectrendererOnDeleteStable : "internal function"
ObjectRenderer -.-> objectrendererOnTransformStartStable : "internal function"
ObjectRenderer -.-> objectrendererOnTransformEndStable : "internal function"
ObjectRenderer -.-> objectrendererOnMatrixChangedStable : "internal function"
ObjectRenderer -.-> objectrendererOnMoveStable : "internal function"
ObjectRenderer -.-> objectrendererArraysEqual : "internal function"
ScreenShareStream -.-> screensharestreamAttemptPlay : "internal function"
ScreenShareStream -.-> screensharestreamConnectToBroadcast : "internal function"
ModelObject -.-> modelobjectCreateLoaders : "internal function"
ModelObject -.-> modelobjectHandleClick : "event handler"
ModelObject -.-> modelobjectHandlePointerDown : "event handler"
ModelObject -.-> modelobjectHandlePointerUp : "event handler"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRunConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterUpdateConnectionEndpoint : "update helper"
RealTimeConnectionUpdater -.-> realtimeconnectionupdaterRebuildConnectionMap : "internal function"
RepoGrid -.-> repogridContainers : "internal function"
RepoGrid -.-> repogridGridData : "internal function"
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
ObjectsRenderer -.-> objectsrendererMountNextBatch : "internal function"
ObjectsRenderer -.-> objectsrendererMountResume : "internal function"
ObjectsRenderer -.-> objectsrendererProgressiveVisibleObjects : "boolean check"
ObjectsRenderer -.-> objectsrendererCubeObjects : "internal function"
ObjectsRenderer -.-> objectsrendererContainerHeaders : "internal function"
ObjectsRenderer -.-> objectsrendererDodecahedronObjects : "internal function"
ObjectsRenderer -.-> objectsrendererTetrahedronObjects : "internal function"
ObjectsRenderer -.-> objectsrendererUnmodifiedCubeIds : "internal function"
ObjectsRenderer -.-> objectsrendererHandleInstancedCubeClick : "event handler"
ObjectsRenderer -.-> objectsrendererRenderedObjects : "render helper"
ObjectUI -.-> objectuiHandleEyeClick : "event handler"
ObjectUI -.-> objectuiHandleColorPick : "event handler"
ObjectUI -.-> objectuiHandleToolClick : "event handler"
SpaceChat -.-> spacechatGetGuestId : "getter function"
SpaceChat -.-> spacechatSenderInitials : "internal function"
SpaceChat -.-> spacechatMergeMessages : "internal function"
SpaceChat -.-> spacechatHandleScroll : "event handler"
SpaceChat -.-> spacechatHandleSend : "event handler"
SpaceChat -.-> spacechatHandleKeyDown : "event handler"
Avatar -.-> avatarGetInitials : "getter function"
Avatar -.-> avatarHandleClick : "event handler"
TetrahedronFace -.-> tetrahedronfaceGetTetrahedronColoredMaterial : "getter function"
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
TextObject -.-> textobjectApplyStyleToSelectionInternal : "internal function"
TextObject -.-> textobjectHandleTextSelection : "event handler"
TextObject -.-> textobjectGetTextAreaStyle : "getter function"
TextObject -.-> textobjectGetContainerStyle : "getter function"
TextObject -.-> textobjectGetEffectivePosition : "getter function"
TextObject -.-> textobjectGetTransformControlSize : "getter function"
Tetrahedron -.-> tetrahedronArraysEqual : "internal function"
Tetrahedron -.-> tetrahedronShallowObjEqual : "internal function"
Tetrahedron -.-> tetrahedron_createTriangleGeometry : "internal function"
Tetrahedron -.-> tetrahedronGetFaceIndicatorProps : "getter function"
Tetrahedron -.-> tetrahedronTetrahedronFaces : "internal function"
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
TextSprite -.-> textspriteLerpVector : "internal function"
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
TextObjectUI -.-> textobjectuiHandleUIClick : "event handler"
TextObjectUI -.-> textobjectuiHandleResizeToggle : "event handler"
TextObjectUI -.-> textobjectuiHandleEyeClick : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsPipelineTasks : "internal function"
EarthSidebarSections -.-> earthsidebarsectionsPipelineStatusCounts : "internal function"
EarthSidebarSections -.-> earthsidebarsectionsSetIsRecording : "setter function"
EarthSidebarSections -.-> earthsidebarsectionsHandleCellBoundariesToggle : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsFetchRepositories : "internal function"
EarthSidebarSections -.-> earthsidebarsectionsFetchAppJsxFromRepo : "internal function"
EarthSidebarSections -.-> earthsidebarsectionsHandleRescan : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleDownloadMarkdown : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsTriggerDownload : "internal function"
EarthSidebarSections -.-> earthsidebarsectionsHandleScreenClick : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleRuntimeScan : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleRecordClick : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandler : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleDeleteAllCells : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsPollStatus : "internal function"
EarthSidebarSections -.-> earthsidebarsectionsHandleModelUpload : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleModelFileSelect : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleMarkdownUpload : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleMarkdownFileSelect : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleCsvUpload : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleCsvFileSelect : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleMenuToggle : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleArrowClick : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleUnpinWebcam : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsHandleTemplateConfigChange : "event handler"
EarthSidebarSections -.-> earthsidebarsectionsCreateTemplate : "internal function"
MerfolkNode -.-> merfolknodeBuildNodeStyles : "internal function"
MerfolkNode -.-> merfolknodeBuildContainerStyles : "internal function"
MerfolkNode -.-> merfolknodeBuildPrecomputedNode : "calculation helper"
MerfolkEdge -.-> merfolkedgeFlowPathColor : "internal function"
MerfolkEdge -.-> merfolkedgeGetEdgeStyle : "getter function"
MerfolkEdge -.-> merfolkedgeGetMarkerEnd : "getter function"
MerfolkEdge -.-> merfolkedgeGetSelectedStyle : "getter function"
MerfolkEdge -.-> merfolkedgeGetUnselectedStyle : "getter function"
WebcamStream -.-> webcamstreamApplyVideoTexture : "internal function"
WebcamStream -.-> webcamstreamAttemptPlay : "internal function"
WebcamStream -.-> webcamstreamConnectToBroadcast : "internal function"
PerspectiveGrid -.-> perspectivegridIdx : "internal function"
PerspectiveGrid -.-> perspectivegridAddEdge : "internal function"
DodecahedronWireframe -.-> dodecahedronwireframeGenerateDodecahedronEdges : "internal function"
LandingApp -.-> landingappScheduleScrollUpdate : "update helper"
LandingApp -.-> landingappHandleWheel : "event handler"
LandingApp -.-> landingappHandleTouchStart : "event handler"
LandingApp -.-> landingappHandleTouchMove : "event handler"
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
FakeGlowMaterial -.-> fakeglowmaterialFakeGlowMaterial : "internal function"
UpdatesEditor -.-> updateseditorHandleKeyCommand : "event handler"
UpdatesEditor -.-> updateseditorToggleInlineStyle : "internal function"
UpdatesEditor -.-> updateseditorHandleSave : "event handler"
CreateOrganizationPopup -.-> createorganizationpopupHandleKeyPress : "event handler"
CreateOrganizationPopup -.-> createorganizationpopupHandleSubmit : "event handler"
UpdatesViewer -.-> updatesviewerParsedContent : "internal function"
UpdatesViewer -.-> updatesviewerFormattedTimestamp : "internal function"
CreateSpacePopup -.-> createspacepopupHandleSpaceNameChange : "event handler"
CreateSpacePopup -.-> createspacepopupHandleEmailChange : "event handler"
CreateSpacePopup -.-> createspacepopupHandleMemberSelect : "event handler"
CreateSpacePopup -.-> createspacepopupHandleKeyPress : "event handler"
CreateSpacePopup -.-> createspacepopupHandleSubmit : "event handler"
DodecahedronWireframe2 -.-> dodecahedronwireframe2GenerateDodecahedronEdges : "internal function"
ContentPanel -.-> contentpanelClamp01 : "internal function"
ContentPanel -.-> contentpanelGetSectionVisibility : "getter function"
WhitePlane -.-> whiteplaneMaterial : "internal function"
OrgMemberDropdown -.-> orgmemberdropdownHandleClickOutside : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputFocus : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleInputChange : "event handler"
OrgMemberDropdown -.-> orgmemberdropdownHandleSelect : "event handler"
OrganizationManager -.-> organizationmanagerRefresh : "internal function"
OrganizationManager -.-> organizationmanagerHandleCreateOrg : "event handler"
OrganizationManager -.-> organizationmanagerHandleInvite : "event handler"
OrganizationManager -.-> organizationmanagerHandleRemoveMember : "event handler"
OrganizationManager -.-> organizationmanagerHandleLeave : "event handler"
OrganizationManager -.-> organizationmanagerHandleUpgradePlan : "event handler"
OrganizationManager -.-> organizationmanagerHandleDeleteOrg : "event handler"
OrganizationManager -.-> organizationmanagerHandleAcceptInvite : "event handler"
OrganizationManager -.-> organizationmanagerHandleDeclineInvite : "event handler"
SpacesTable -.-> spacestableHandleSpaceClick : "event handler"
SpacesTable -.-> spacestableThStyles : "internal function"
SpacesTable -.-> spacestableTdStyles : "internal function"
SpacesTable -.-> spacestableCategoryRowStyles : "internal function"
SpacesTable -.-> spacestableInviteBannerStyle : "internal function"
ShareSpacePopup -.-> sharespacepopupStringToColor : "internal function"
ShareSpacePopup -.-> sharespacepopupFilteredMembers : "internal function"
ShareSpacePopup -.-> sharespacepopupToggleMember : "internal function"
ShareSpacePopup -.-> sharespacepopupHandleShare : "event handler"

%% File Container Nodes
backend_index((Service: index))
useCentralizedBroadcastManager_file[Hook: useCentralizedBroadcastManager]
firebase[Function: firebase]
useAuthState_file[Hook: useAuthState]
useConnectionAnimationManager[Hook: useConnectionAnimationManager]
useConnectionObjects_file[Hook: useConnectionObjects]
useAuth_file[Hook: useAuth]
useFrustumCulling[Hook: useFrustumCulling]
useConnections_file[Hook: useConnections]
useIndicators_file[Hook: useIndicators]
useSpaceManager_file[Hook: useSpaceManager]
useGlobalClickHandler_file[Hook: useGlobalClickHandler]
useSpatialManager_file[Hook: useSpatialManager]
useTextureUpdater_file[Hook: useTextureUpdater]
useConnectionsRendererStore_file[Hook: useConnectionsRendererStore]
useObjects_file[Hook: useObjects]
useDebouncedUpdate_file[Hook: useDebouncedUpdate]
useTimeoutManager_file[Hook: useTimeoutManager]
useWindowSize_file[Hook: useWindowSize]
_3d_generator[Function: _3d_generator]
sharedSpacesService[Function: sharedSpacesService]
ast_builder[Function: ast_builder]
mermaid_parser[Function: mermaid_parser]
graph_file[Function: graph]
markdown_processor[Function: markdown_processor]
connection[Function: connection]
node[Function: node]
globalOptimizationCoordinator_file((Service: globalOptimizationCoordinator))
authService((Service: authService))
centralizedBroadcastManager_file((Service: centralizedBroadcastManager))
githubIssuesService((Service: githubIssuesService))
anchors((Service: anchors))
globalSubscriptionManager((Service: globalSubscriptionManager))
csvDiagramService((Service: csvDiagramService))
connectionPositionResolver((Service: connectionPositionResolver))
connectionsService((Service: connectionsService))
githubRepoService((Service: githubRepoService))
handTrackingService((Service: handTrackingService))
processMethods((Service: processMethods))
palmDecode((Service: palmDecode))
containerMethods((Service: containerMethods))
objectMethods((Service: objectMethods))
positionMethods((Service: positionMethods))
hierarchyMethods((Service: hierarchyMethods))
imageOps((Service: imageOps))
connectionMethods((Service: connectionMethods))
constants((Service: constants))
runtimeScanService((Service: runtimeScanService))
pipelineOrchestrator((Service: pipelineOrchestrator))
screenRecordingService((Service: screenRecordingService))
presenceService((Service: presenceService))
repoContainerService((Service: repoContainerService))
markdownDiagramService_file((Service: markdownDiagramService))
organizationService((Service: organizationService))
resourceCleanupService_file((Service: resourceCleanupService))
pipelineTaskService((Service: pipelineTaskService))
spatialPartitioning((Service: spatialPartitioning))
spatialObjectsService((Service: spatialObjectsService))
shader_shaders[Function: shaders]
sharingService((Service: sharingService))
storageService((Service: storageService))
webRservice((Service: webRservice))
spacesService((Service: spacesService))
unifiedCacheManager_file((Service: unifiedCacheManager))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
cubeStore[[Store: cubeStore]]
authStore[[Store: authStore]]
connectionStore[[Store: connectionStore]]
objectsStore[[Store: objectsStore]]
lodStore[[Store: lodStore]]
storeUtils[[Store: storeUtils]]
uiOverlayStore[[Store: uiOverlayStore]]
facePositionUtils[Function: facePositionUtils]
bvhRaycasting[Function: bvhRaycasting]
earthHeightmapLoader[Function: earthHeightmapLoader]
faceIndicatorUtils[Function: faceIndicatorUtils]
connectionUtils[Function: connectionUtils]
debugUtils[Function: debugUtils]
earthTerrainGenerator[Function: earthTerrainGenerator]
animationUtils[Function: animationUtils]
positionUtils[Function: positionUtils]
objectVirtualization[Function: objectVirtualization]
snappingUtils[Function: snappingUtils]
objectUpdateHandlers[Function: objectUpdateHandlers]
frameCounter_file[Function: frameCounter]
renderWorkScheduler[Function: renderWorkScheduler]
loadingState[Function: loadingState]
gpuResourceTracker[Function: gpuResourceTracker]
pathfindingUtils[Function: pathfindingUtils]
unifiedValidationUtils[Function: unifiedValidationUtils]
streamlinedSpatialIndex[Function: streamlinedSpatialIndex]
textureLoader[Function: textureLoader]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
wasmKernels[Function: wasmKernels]
terrainTileCache[Function: terrainTileCache]
textAtlas[Function: textAtlas]
worker_markdownLayoutWorker[Function: markdownLayoutWorker]
worker_handTrackingWorkerClient[Function: handTrackingWorkerClient]
worker_diagramLayoutWorkerClient[Function: diagramLayoutWorkerClient]
worker_handTrackingWorker[Function: handTrackingWorker]
worker_pathfindingWorkerClient[Function: pathfindingWorkerClient]
worker_hoverchart_wasm[Function: hoverchart_wasm]
worker_markdownLayoutWorkerClient[Function: markdownLayoutWorkerClient]
worker_diagramLayoutWorker[Function: diagramLayoutWorker]
worker_textAtlasWorker[Function: textAtlasWorker]
worker_textAtlasWorkerClient[Function: textAtlasWorkerClient]
worker_spatialIndexWorkerClient[Function: spatialIndexWorkerClient]
worker_spatialIndexWorker[Function: spatialIndexWorker]

%% File-Function Relationships
backend_index -.-> createVerifyAuthTokenApp : "contains"
backend_index -.-> createBulkImportApp : "contains"
backend_index -.-> objectsByCellId : "contains"
backend_index -.-> connectionsByCellId : "contains"
backend_index -.-> params : "contains"
backend_index -.-> generateJobId : "contains"
backend_index -.-> toMillis : "contains"
backend_index -.-> deleteCellContents : "contains"
backend_index -.-> createBulkDeleteApp : "contains"
backend_index -.-> validateRuntimeScanUrl : "contains"
backend_index -.-> sanitizeMerfolkId : "contains"
backend_index -.-> generateMerfolkFromRuntimeTrace : "contains"
backend_index -.-> EXCLUDED_PROFILER_NAMES : "contains"
backend_index -.-> BUNDLE_NOISE_NAMES : "contains"
backend_index -.-> REACT_DEVTOOLS_INJECTION : "contains"
backend_index -.-> getCompName : "contains"
backend_index -.-> walkFiber : "contains"
backend_index -.-> extractSourceMapUrl : "contains"
backend_index -.-> scanOriginalSource : "contains"
backend_index -.-> extractNamesFromSourceMap : "contains"
backend_index -.-> scanJsBundles : "contains"
backend_index -.-> bundleComponents : "contains"
backend_index -.-> bundleHooks : "contains"
backend_index -.-> bundleFunctions : "contains"
backend_index -.-> captureRuntimeTrace : "contains"
backend_index -.-> urlObj : "contains"
backend_index -.-> seen : "contains"
backend_index -.-> seenFns : "contains"
backend_index -.-> dedup : "contains"
backend_index -.-> deduplicateApiCalls : "contains"
backend_index -.-> buildConnections : "contains"
backend_index -.-> createScanWebsiteRuntimeApp : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
provider[Function: provider]
firebase -.-> provider : "contains"
selectAuthState[Function: selectAuthState]
useAuthState_file -.-> selectAuthState : "contains"
useAuthState_file -.-> useAuthState : "contains"
ConnectionAnimationManager[Function: ConnectionAnimationManager]
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
objectPositionEqual[Function: objectPositionEqual]
useConnectionObjects_file -.-> objectPositionEqual : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
selectAuth[Function: selectAuth]
useAuth_file -.-> selectAuth : "contains"
useAuth_file -.-> useAuth : "contains"
isPointInFrustum[Function: isPointInFrustum]
useFrustumCulling -.-> isPointInFrustum : "contains"
isConnectionVisible[Function: isConnectionVisible]
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> SpatialHash : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
objectPositions[Function: objectPositions]
useFrustumCulling -.-> objectPositions : "contains"
visibleConnections[Function: visibleConnections]
useFrustumCulling -.-> visibleConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
selectConnectionHookState[Function: selectConnectionHookState]
useConnections_file -.-> selectConnectionHookState : "contains"
useConnections_file -.-> useConnections : "contains"
spaceId[Function: spaceId]
useConnections_file -.-> spaceId : "contains"
useConnections_file -.-> userId : "contains"
stableLoadedCells[Function: stableLoadedCells]
useConnections_file -.-> stableLoadedCells : "contains"
connectionCallback[Function: connectionCallback]
useConnections_file -.-> connectionCallback : "contains"
enhancedConnectionCallback[Function: enhancedConnectionCallback]
useConnections_file -.-> enhancedConnectionCallback : "contains"
handleLineStyleChange[Function: handleLineStyleChange]
useConnections_file -.-> handleLineStyleChange : "contains"
handleLineColorChange[Function: handleLineColorChange]
useConnections_file -.-> handleLineColorChange : "contains"
handleConnectionClick[Function: handleConnectionClick]
useConnections_file -.-> handleConnectionClick : "contains"
handleLineTextClick[Function: handleLineTextClick]
useConnections_file -.-> handleLineTextClick : "contains"
handleLineTextSubmit[Function: handleLineTextSubmit]
useConnections_file -.-> handleLineTextSubmit : "contains"
handleLineTextStyleChange[Function: handleLineTextStyleChange]
useConnections_file -.-> handleLineTextStyleChange : "contains"
useIndicators_file -.-> useIndicators : "contains"
selectSpaceManagerState[Function: selectSpaceManagerState]
useSpaceManager_file -.-> selectSpaceManagerState : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
handleGlobalClick[Function: handleGlobalClick]
useGlobalClickHandler_file -.-> handleGlobalClick : "contains"
useSpatialManager_file -.-> useSpatialManager : "contains"
loadedCellsKey[Function: loadedCellsKey]
useSpatialManager_file -.-> loadedCellsKey : "contains"
memoizedLoadedCells[Function: memoizedLoadedCells]
useSpatialManager_file -.-> memoizedLoadedCells : "contains"
useSpatialManager_file -.-> cleanup : "contains"
setupCameraListeners[Function: setupCameraListeners]
useSpatialManager_file -.-> setupCameraListeners : "contains"
handleCameraMove[Function: handleCameraMove]
useSpatialManager_file -.-> handleCameraMove : "contains"
addObjectToSpatialSystemWrapper[Function: addObjectToSpatialSystemWrapper]
useSpatialManager_file -.-> addObjectToSpatialSystemWrapper : "contains"
moveObjectInSpatialSystemWrapper[Function: moveObjectInSpatialSystemWrapper]
useSpatialManager_file -.-> moveObjectInSpatialSystemWrapper : "contains"
loadCellWrapper[Function: loadCellWrapper]
useSpatialManager_file -.-> loadCellWrapper : "contains"
updateCameraPositionWrapper[Function: updateCameraPositionWrapper]
useSpatialManager_file -.-> updateCameraPositionWrapper : "contains"
useTextureUpdater_file -.-> useTextureUpdater : "contains"
updateTexture[Function: updateTexture]
useTextureUpdater_file -.-> updateTexture : "contains"
getConnectionStateSelector[Function: getConnectionStateSelector]
useConnectionsRendererStore_file -.-> getConnectionStateSelector : "contains"
cleanupStaleSelectors[Function: cleanupStaleSelectors]
useConnectionsRendererStore_file -.-> cleanupStaleSelectors : "contains"
actionsSelector[Function: actionsSelector]
useConnectionsRendererStore_file -.-> actionsSelector : "contains"
useConnectionsRendererStore_file -.-> useConnectionsRendererStore : "contains"
useConnectionsRendererStore_file -.-> useConnectionState : "contains"
selector[Function: selector]
useConnectionsRendererStore_file -.-> selector : "contains"
useConnectionsRendererStore_file -.-> useConnectionActions : "contains"
selectObjectsHookState[Function: selectObjectsHookState]
useObjects_file -.-> selectObjectsHookState : "contains"
useObjects_file -.-> useObjects : "contains"
handleCreateObject[Function: handleCreateObject]
useObjects_file -.-> handleCreateObject : "contains"
handleObjectDelete[Function: handleObjectDelete]
useObjects_file -.-> handleObjectDelete : "contains"
registerTransformingObject[Function: registerTransformingObject]
useObjects_file -.-> registerTransformingObject : "contains"
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useDebouncedUpdate_file -.-> cleanup : "contains"
useTimeoutManager_file -.-> useTimeoutManager : "contains"
setNamedTimeout[Function: setNamedTimeout]
useTimeoutManager_file -.-> setNamedTimeout : "contains"
clearNamedTimeout[Function: clearNamedTimeout]
useTimeoutManager_file -.-> clearNamedTimeout : "contains"
clearAllTimeouts[Function: clearAllTimeouts]
useTimeoutManager_file -.-> clearAllTimeouts : "contains"
hasActiveTimeout[Function: hasActiveTimeout]
useTimeoutManager_file -.-> hasActiveTimeout : "contains"
getTimeoutId[Function: getTimeoutId]
useTimeoutManager_file -.-> getTimeoutId : "contains"
useWindowSize_file -.-> useWindowSize : "contains"
handleResize[Function: handleResize]
useWindowSize_file -.-> handleResize : "contains"
_3d_generator -.-> AST3DGenerator : "contains"
_3d_generator -.-> nodeIds : "contains"
addSharedSpaceReference[Function: addSharedSpaceReference]
sharedSpacesService -.-> addSharedSpaceReference : "contains"
removeSharedSpaceReference[Function: removeSharedSpaceReference]
sharedSpacesService -.-> removeSharedSpaceReference : "contains"
getSharedSpacesForUser[Function: getSharedSpacesForUser]
sharedSpacesService -.-> getSharedSpacesForUser : "contains"
removeAllSharedReferences[Function: removeAllSharedReferences]
sharedSpacesService -.-> removeAllSharedReferences : "contains"
sharedSpacesService -.-> sharedSpacesCache : "contains"
sharedSpacesService -.-> sharedSpacesCacheSet : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharedSpacesService -.-> urlParams : "contains"
sharedSpacesService -.-> params : "contains"
ast_builder -.-> ASTBuilder : "contains"
graph[Function: graph]
ast_builder -.-> graph : "contains"
nodeMap[Function: nodeMap]
ast_builder -.-> nodeMap : "contains"
ast_builder -.-> node : "contains"
ast_builder -.-> connection : "contains"
nodesWithCustomPositions[Function: nodesWithCustomPositions]
ast_builder -.-> nodesWithCustomPositions : "contains"
layers[Function: layers]
ast_builder -.-> layers : "contains"
componentGroups[Function: componentGroups]
ast_builder -.-> componentGroups : "contains"
mermaid_parser -.-> MermaidParser : "contains"
graph_file -.-> Graph : "contains"
graph_file -.-> visited : "contains"
recursionStack[Function: recursionStack]
graph_file -.-> recursionStack : "contains"
graph_file -.-> graph : "contains"
graph_file -.-> node : "contains"
graph_file -.-> connection : "contains"
markdown_processor -.-> MarkdownProcessor : "contains"
connection -.-> Connection : "contains"
node -.-> Node : "contains"
globalOptimizationCoordinator_file -.-> GlobalOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> spatialManager : "contains"
globalOptimizationCoordinator_file -.-> unifiedCache : "contains"
globalOptimizationCoordinator_file -.-> cacheStats : "contains"
globalOptimizationCoordinator_file -.-> later : "contains"
globalOptimizationCoordinator_file -.-> cache : "contains"
globalOptimizationCoordinator_file -.-> memoized : "contains"
globalOptimizationCoordinator_file -.-> session : "contains"
globalOptimizationCoordinator_file -.-> globalOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> initializeOptimizationCoordinator : "contains"
globalOptimizationCoordinator_file -.-> getOptimizationStatus : "contains"
globalOptimizationCoordinator_file -.-> consolidateSystem : "contains"
globalOptimizationCoordinator_file -.-> cleanupOptimizationCoordinator : "contains"
authService -.-> signInUser : "contains"
authService -.-> handlePostLoginRedirect : "contains"
authService -.-> signOut : "contains"
authService -.-> handleRedirectResult : "contains"
authService -.-> observeAuthState : "contains"
authService -.-> validateAuthToken : "contains"
authService -.-> handleUrlAuth : "contains"
authService -.-> params : "contains"
centralizedBroadcastManager_file -.-> CentralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> dummyUnsubscribe : "contains"
centralizedBroadcastManager_file -.-> centralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager_file -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager_file -.-> cleanupBroadcastManager : "contains"
githubIssuesService -.-> enc : "contains"
githubIssuesService -.-> githubFetch : "contains"
githubIssuesService -.-> createIssue : "contains"
githubIssuesService -.-> assignCopilotToIssue : "contains"
githubIssuesService -.-> getIssue : "contains"
githubIssuesService -.-> findPullRequestForIssue : "contains"
githubIssuesService -.-> approvePullRequest : "contains"
githubIssuesService -.-> mergePullRequest : "contains"
githubIssuesService -.-> getPullRequest : "contains"
githubIssuesService -.-> getRepoInfo : "contains"
githubIssuesService -.-> getBranchRef : "contains"
githubIssuesService -.-> createBranchRef : "contains"
githubIssuesService -.-> deleteBranchRef : "contains"
githubIssuesService -.-> getFileContents : "contains"
githubIssuesService -.-> createFileOnBranch : "contains"
githubIssuesService -.-> createPullRequest : "contains"
githubIssuesService -.-> addComment : "contains"
githubIssuesService -.-> enableAutoMerge : "contains"
githubIssuesService -.-> revertCommit : "contains"
anchors -.-> getAnchors : "contains"
globalSubscriptionManager -.-> globalSubscriptions : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> decrementSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> periodicCleanup : "contains"
csvDiagramService -.-> parseCsv : "contains"
csvDiagramService -.-> splitCsvLine : "contains"
csvDiagramService -.-> isNumericColumn : "contains"
csvDiagramService -.-> parseNumeric : "contains"
csvDiagramService -.-> detectColumns : "contains"
csvDiagramService -.-> filterAggregateRows : "contains"
csvDiagramService -.-> buildGroups : "contains"
csvDiagramService -.-> groups : "contains"
csvDiagramService -.-> layoutGroup : "contains"
csvDiagramService -.-> computeBounds : "contains"
csvDiagramService -.-> getCameraBasePosition : "contains"
csvDiagramService -.-> processCsvFile : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> resolveConnectionEndpoint : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionPositionResolver -.-> positionsEqual : "contains"
connectionsService -.-> connectionListeners : "contains"
connectionsService -.-> globalActiveListeners : "contains"
connectionsService -.-> pauseConnectionListeners : "contains"
connectionsService -.-> resumeConnectionListeners : "contains"
connectionsService -.-> notifyConnectionListeners : "contains"
connectionsService -.-> addConnectionStateListener : "contains"
connectionsService -.-> connectionCache : "contains"
connectionsService -.-> clearConnectionCache : "contains"
connectionsService -.-> connectionDataChanged : "contains"
connectionsService -.-> serializeConnection : "contains"
connectionsService -.-> enableConnectionNetwork : "contains"
connectionsService -.-> disableConnectionNetwork : "contains"
connectionsService -.-> getConnectionNetworkState : "contains"
connectionsService -.-> saveConnection : "contains"
connectionsService -.-> subscribeToConnections : "contains"
connectionsService -.-> subscribeToCellConnections : "contains"
connectionsService -.-> unsubscribeFunctions : "contains"
connectionsService -.-> activeSubscriptionCells : "contains"
connectionsService -.-> startCellSubscriptions : "contains"
connectionsService -.-> deleteConnection : "contains"
connectionsService -.-> deleteConnectionEnhanced : "contains"
githubRepoService -.-> exchangeGithubCode : "contains"
githubRepoService -.-> fetchRepositories : "contains"
githubRepoService -.-> fetchFileContent : "contains"
githubRepoService -.-> fetchLatestCommitSha : "contains"
githubRepoService -.-> fetchChangedFiles : "contains"
githubRepoService -.-> getFileTypeFromPath : "contains"
githubRepoService -.-> fetchRepositoryStructure : "contains"
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
githubRepoService -.-> generateMerfolkFromRepository : "contains"
githubRepoService -.-> componentFunctions : "contains"
githubRepoService -.-> componentFuncDisplayNames : "contains"
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
githubRepoService -.-> getGithubToken : "contains"
githubRepoService -.-> setGithubToken : "contains"
githubRepoService -.-> isGithubAuthenticated : "contains"
githubRepoService -.-> getGithubOAuthUrl : "contains"
githubRepoService -.-> currentParams : "contains"
githubRepoService -.-> handleGithubCallback : "contains"
githubRepoService -.-> params : "contains"
githubRepoService -.-> restoredParams : "contains"
githubRepoService -.-> newUrl : "contains"
githubRepoService -.-> successParams : "contains"
githubRepoService -.-> failParams : "contains"
githubRepoService -.-> scanRepositoryAndGenerateDiagram : "contains"
githubRepoService -.-> markdownBlob : "contains"
githubRepoService -.-> markdownFile : "contains"
githubRepoService -.-> extractMerfolkNodeIds : "contains"
githubRepoService -.-> filterNewMerfolkNodes : "contains"
githubRepoService -.-> mergeMerfolkMarkdown : "contains"
githubRepoService -.-> extractContent : "contains"
githubRepoService -.-> rescanRepositoryForChanges : "contains"
handTrackingService -.-> ensureWorker : "contains"
handTrackingService -.-> openCamera : "contains"
handTrackingService -.-> onLoaded : "contains"
handTrackingService -.-> onError : "contains"
handTrackingService -.-> cleanup : "contains"
handTrackingService -.-> runOnce : "contains"
handTrackingService -.-> scheduleNext : "contains"
handTrackingService -.-> onFrame : "contains"
handTrackingService -.-> onVisibilityChange : "contains"
handTrackingService -.-> teardownCamera : "contains"
handTrackingService -.-> startHandTracking : "contains"
handTrackingService -.-> stopHandTracking : "contains"
processMethods -.-> logParseHistogram : "contains"
processMethods -.-> allNodes : "contains"
processMethods -.-> allConnections : "contains"
processMethods -.-> nodeToObjectIdMap : "contains"
processMethods -.-> reader : "contains"
palmDecode -.-> sigmoid : "contains"
palmDecode -.-> decodePalmDetections : "contains"
palmDecode -.-> kps : "contains"
palmDecode -.-> iou : "contains"
palmDecode -.-> detectionToRoi : "contains"
containerMethods -.-> groupedByType : "contains"
containerMethods -.-> createContainerForGroup : "contains"
containerMethods -.-> existingGroupTypes : "contains"
containerMethods -.-> reachableFromRootModules : "contains"
containerMethods -.-> markReachable : "contains"
containerMethods -.-> componentsWithChildContainers : "contains"
containerMethods -.-> nodesInChildContainers : "contains"
containerMethods -.-> markDescendantsInChildContainers : "contains"
containerMethods -.-> includableTypes : "contains"
containerMethods -.-> nodesWithContainers : "contains"
containerMethods -.-> visited : "contains"
containerMethods -.-> adjustNodeAndDescendants : "contains"
containerMethods -.-> containerDimensions : "contains"
containerMethods -.-> containerEligibleTypes : "contains"
containerMethods -.-> existingParentNodeIds : "contains"
objectMethods -.-> processedNodes : "contains"
objectMethods -.-> existingNodeIdMap : "contains"
objectMethods -.-> calculateHeaderStyle : "contains"
positionMethods -.-> moveComponentTree : "contains"
positionMethods -.-> getComponentChildren : "contains"
positionMethods -.-> checkOverlap : "contains"
positionMethods -.-> containersByLevel : "contains"
positionMethods -.-> resolveNodeMove : "contains"
positionMethods -.-> reachableFromRootModules : "contains"
positionMethods -.-> markReachable : "contains"
positionMethods -.-> componentsWithChildContainers : "contains"
positionMethods -.-> nodesInChildContainers : "contains"
positionMethods -.-> markDescendantsInChildContainers : "contains"
positionMethods -.-> includableTypes : "contains"
positionMethods -.-> groupedByType : "contains"
positionMethods -.-> calculateNodeScaleFromChildren : "contains"
positionMethods -.-> calculateGroupSpacing : "contains"
positionMethods -.-> calculateGroupBounds : "contains"
positionMethods -.-> positionGroup : "contains"
hierarchyMethods -.-> parentChildMap : "contains"
hierarchyMethods -.-> childParentMap : "contains"
hierarchyMethods -.-> rootNodes : "contains"
hierarchyMethods -.-> internalComponentChildren : "contains"
hierarchyMethods -.-> componentConnectionTypes : "contains"
hierarchyMethods -.-> wouldCreateCycle : "contains"
hierarchyMethods -.-> visited : "contains"
hierarchyMethods -.-> dfs : "contains"
hierarchyMethods -.-> warnedCycles : "contains"
hierarchyMethods -.-> addParentChildRelation : "contains"
hierarchyMethods -.-> isCubeChild : "contains"
hierarchyMethods -.-> isContainerType : "contains"
imageOps -.-> imageDataToTensor : "contains"
imageOps -.-> letterboxToImageData : "contains"
imageOps -.-> extractRotatedRoi : "contains"
imageOps -.-> roiToImage : "contains"
connectionMethods -.-> connectionTags : "contains"
connectionMethods -.-> addTag : "contains"
connectionMethods -.-> existingConnectionPairs : "contains"
connectionMethods -.-> getFaceForObject : "contains"
connectionMethods -.-> computeFaceWorldPosition : "contains"
connectionMethods -.-> calculateDodecahedronFaceCenter : "contains"
connectionMethods -.-> connectionsByCell : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
runtimeScanService -.-> validateScanUrl : "contains"
runtimeScanService -.-> generateMerfolkFromRuntimeTrace : "contains"
runtimeScanService -.-> sanitizeId : "contains"
runtimeScanService -.-> scanWebsiteAndGenerateDiagram : "contains"
runtimeScanService -.-> markdownBlob : "contains"
runtimeScanService -.-> markdownFile : "contains"
runtimeScanService -.-> simulateProgress : "contains"
pipelineOrchestrator -.-> getGithubToken : "contains"
pipelineOrchestrator -.-> processTask : "contains"
pipelineOrchestrator -.-> pollPR : "contains"
pipelineOrchestrator -.-> startPipeline : "contains"
pipelineOrchestrator -.-> getLatestTasks : "contains"
pipelineOrchestrator -.-> processed : "contains"
pipelineOrchestrator -.-> checkResume : "contains"
pipelineOrchestrator -.-> pausePipeline : "contains"
pipelineOrchestrator -.-> resumePipeline : "contains"
pipelineOrchestrator -.-> reconcilePendingTasks : "contains"
pipelineOrchestrator -.-> repoSlugsToReposition : "contains"
pipelineOrchestrator -.-> stopPipeline : "contains"
screenRecordingService -.-> ScreenRecordingService : "contains"
screenRecordingService -.-> rawBlob : "contains"
screenRecordingService -.-> screenRecorder : "contains"
presenceService -.-> setUserPresence : "contains"
presenceService -.-> getGuestId : "contains"
presenceService -.-> setGuestPresence : "contains"
presenceService -.-> subscribeToSpacePresence : "contains"
repoContainerService -.-> generateId : "contains"
repoContainerService -.-> getCellId : "contains"
repoContainerService -.-> computeGridLayout : "contains"
repoContainerService -.-> computeContainerScale : "contains"
repoContainerService -.-> getGridCellPosition : "contains"
repoContainerService -.-> repositionAllTasks : "contains"
repoContainerService -.-> dividerIds : "contains"
repoContainerService -.-> activeIds : "contains"
repoContainerService -.-> mergedIds : "contains"
repoContainerService -.-> newCreatedIds : "contains"
repoContainerService -.-> findRepoContainer : "contains"
repoContainerService -.-> getAllRepoContainers : "contains"
repoContainerService -.-> assignRepoSlugToOrphanTasks : "contains"
repoContainerService -.-> orphanIds : "contains"
repoContainerService -.-> countRepoContainers : "contains"
repoContainerService -.-> createRepoContainer : "contains"
repoContainerService -.-> repositionIncomingTasks : "contains"
repoContainerService -.-> unpositionedIds : "contains"
repoContainerService -.-> renumberMap : "contains"
repoContainerService -.-> rewriteHeader : "contains"
repoContainerService -.-> createTaskObjects : "contains"
repoContainerService -.-> clearRepoTasks : "contains"
repoContainerService -.-> taskIds : "contains"
repoContainerService -.-> updatedById : "contains"
repoContainerService -.-> toggleTaskExpansion : "contains"
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
resourceCleanupService_file -.-> _disposedWeakSet : "contains"
resourceCleanupService_file -.-> ResourceCleanupService : "contains"
resourceCleanupService_file -.-> resourceCleanupService : "contains"
pipelineTaskService -.-> getStatusColor : "contains"
pipelineTaskService -.-> getStatusLabel : "contains"
pipelineTaskService -.-> isTaskObject : "contains"
pipelineTaskService -.-> getPipelineTasks : "contains"
pipelineTaskService -.-> getNextQueuedTask : "contains"
pipelineTaskService -.-> getNextActionableTask : "contains"
pipelineTaskService -.-> getPipelineTasksForRepo : "contains"
pipelineTaskService -.-> getRepoSlugsFromTasks : "contains"
pipelineTaskService -.-> slugs : "contains"
pipelineTaskService -.-> updateTaskStatus : "contains"
spatialPartitioning -.-> cellExistenceCache : "contains"
spatialPartitioning -.-> cleanupCache : "contains"
spatialPartitioning -.-> movingObjects : "contains"
spatialPartitioning -.-> getCellCoordinates : "contains"
spatialPartitioning -.-> getCellCoordinatesWithHysteresis : "contains"
spatialPartitioning -.-> getCellId : "contains"
spatialPartitioning -.-> parseCellId : "contains"
spatialPartitioning -.-> getCellBounds : "contains"
spatialPartitioning -.-> createCell : "contains"
spatialPartitioning -.-> createCellsBatch : "contains"
spatialPartitioning -.-> createCellsBatchOptimized : "contains"
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
spatialPartitioning -.-> cellCallbacks : "contains"
spatialPartitioning -.-> subscribeToCells : "contains"
spatialPartitioning -.-> getOccupiedCells : "contains"
spatialPartitioning -.-> getCellDistance : "contains"
spatialPartitioning -.-> getCellsToUnload : "contains"
spatialPartitioning -.-> addConnectionToCells : "contains"
spatialPartitioning -.-> bulkSaveConnectionsToCell : "contains"
spatialPartitioning -.-> addConnectionToCell : "contains"
spatialPartitioning -.-> removeConnectionFromAllCells : "contains"
spatialPartitioning -.-> normalizePosition : "contains"
spatialPartitioning -.-> removeConnectionFromCells : "contains"
spatialPartitioning -.-> removeConnectionFromCell : "contains"
spatialPartitioning -.-> getConnectionsFromCells : "contains"
spatialPartitioning -.-> seenConnectionIds : "contains"
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
spatialObjectsService -.-> objectsCache : "contains"
spatialObjectsService -.-> saveTimeouts : "contains"
spatialObjectsService -.-> updateThrottles : "contains"
spatialObjectsService -.-> lastReceivedObjects : "contains"
spatialObjectsService -.-> movingObjects : "contains"
spatialObjectsService -.-> objectCellMap : "contains"
spatialObjectsService -.-> deletingObjects : "contains"
spatialObjectsService -.-> pendingSaves : "contains"
spatialObjectsService -.-> cancelPendingSave : "contains"
spatialObjectsService -.-> enqueueSave : "contains"
spatialObjectsService -.-> flushSaveBatch : "contains"
spatialObjectsService -.-> saves : "contains"
spatialObjectsService -.-> clearAllObjectCaches : "contains"
spatialObjectsService -.-> removeObjectFromCaches : "contains"
spatialObjectsService -.-> positionsEqual : "contains"
spatialObjectsService -.-> VOLATILE_KEYS : "contains"
spatialObjectsService -.-> computeNonPositionFingerprint : "contains"
spatialObjectsService -.-> saveObjectToCell : "contains"
spatialObjectsService -.-> deleteObjectFromSpatialCell : "contains"
spatialObjectsService -.-> updateObjectInSpatialCell : "contains"
spatialObjectsService -.-> clearCellCache : "contains"
spatialObjectsService -.-> objectSubscriptionsByCell : "contains"
spatialObjectsService -.-> cleanupSpatialObjectSubscriptions : "contains"
spatialObjectsService -.-> subscribeToSpatialObjects : "contains"
spatialObjectsService -.-> unsubscribeFunctions : "contains"
spatialObjectsService -.-> localSubscriptionKeys : "contains"
spatialObjectsService -.-> startCellSubscriptions : "contains"
spatialObjectsService -.-> updateCellSubscriptions : "contains"
spatialObjectsService -.-> moveObjectBetweenCells : "contains"
spatialObjectsService -.-> loadObjectsFromCells : "contains"
spatialObjectsService -.-> saveObject : "contains"
spatialObjectsService -.-> deleteObject : "contains"
spatialObjectsService -.-> updateObject : "contains"
spatialObjectsService -.-> subscribeToObjects : "contains"
spatialObjectsService -.-> getObjectDeletionStatus : "contains"
spatialObjectsService -.-> clearObjectDeletionBlacklist : "contains"
line_frag_glsl[Function: line_frag_glsl]
shader_shaders -.-> line_frag_glsl : "contains"
line_vert_glsl[Function: line_vert_glsl]
shader_shaders -.-> line_vert_glsl : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> sharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
storageService -.-> getStorageInstance : "contains"
storageService -.-> ALLOWED_IMAGE_TYPES : "contains"
storageService -.-> uploadFileGeneric : "contains"
storageService -.-> uploadImageToStorage : "contains"
storageService -.-> uploadModelToStorage : "contains"
storageService -.-> uploadMarkdownToStorage : "contains"
storageService -.-> blob : "contains"
webRservice -.-> activeStreams : "contains"
webRservice -.-> getRTCConfiguration : "contains"
webRservice -.-> initWebRTC : "contains"
webRservice -.-> BroadcastSession : "contains"
webRservice -.-> peerConnection : "contains"
webRservice -.-> startBroadcasting : "contains"
webRservice -.-> broadcastSession : "contains"
webRservice -.-> joinBroadcast : "contains"
webRservice -.-> isPlaneBeingBroadcast : "contains"
webRservice -.-> findAvailableBroadcasts : "contains"
webRservice -.-> cleanupWebRTC : "contains"
webRservice -.-> registerUserPresence : "contains"
webRservice -.-> subscribeToUsersInSpace : "contains"
webRservice -.-> activeUsers : "contains"
webRservice -.-> fiveMinutesAgo : "contains"
spacesService -.-> getSpaceById : "contains"
spacesService -.-> createSpace : "contains"
spacesService -.-> getOrCreateDefaultSpace : "contains"
spacesService -.-> migrateToDefaultSpace : "contains"
spacesService -.-> getUserSpaces : "contains"
spacesService -.-> deleteSpace : "contains"
spacesService -.-> hasSpaceAccess : "contains"
spacesService -.-> getPublicSpaceMetadata : "contains"
unifiedCacheManager_file -.-> cacheStats : "contains"
unifiedCacheManager_file -.-> unifiedCache : "contains"
unifiedCacheManager_file -.-> UnifiedCacheManager : "contains"
unifiedCacheManager_file -.-> unifiedCacheManager : "contains"
streamlinedSpatialPartitioning -.-> StreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> getStreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> initializeStreamlinedSpatialPartitioning : "contains"
streamlinedSpatialPartitioning -.-> benchmarkStreamlinedSystem : "contains"
streamlinedSpatialPartitioning -.-> manager : "contains"
getCubeSelector[Function: getCubeSelector]
cubeStore -.-> getCubeSelector : "contains"
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
cubeStore -.-> getCubeFaceColorSelector : "contains"
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
cubeStore -.-> getCubeFaceStateSelector : "contains"
monitorConnection[Function: monitorConnection]
authStore -.-> monitorConnection : "contains"
connectionHandler[Function: connectionHandler]
authStore -.-> connectionHandler : "contains"
handleUrlAuthLocal[Function: handleUrlAuthLocal]
authStore -.-> handleUrlAuthLocal : "contains"
initAuth[Function: initAuth]
authStore -.-> initAuth : "contains"
_buildConnectionsByObjectId[Function: _buildConnectionsByObjectId]
connectionStore -.-> _buildConnectionsByObjectId : "contains"
getCellCoords[Function: getCellCoords]
connectionStore -.-> getCellCoords : "contains"
getCellIdFromCoords[Function: getCellIdFromCoords]
connectionStore -.-> getCellIdFromCoords : "contains"
numericHash[Function: numericHash]
objectsStore -.-> numericHash : "contains"
stringHash[Function: stringHash]
objectsStore -.-> stringHash : "contains"
calculateLODLevel[Function: calculateLODLevel]
lodStore -.-> calculateLODLevel : "contains"
calculateParentLODLevel[Function: calculateParentLODLevel]
lodStore -.-> calculateParentLODLevel : "contains"
useStoreInitialization[Function: useStoreInitialization]
storeUtils -.-> useStoreInitialization : "contains"
useCubeSelectors[Function: useCubeSelectors]
storeUtils -.-> useCubeSelectors : "contains"
useCubeActions[Function: useCubeActions]
storeUtils -.-> useCubeActions : "contains"
usePlaneSelectors[Function: usePlaneSelectors]
storeUtils -.-> usePlaneSelectors : "contains"
usePlaneActions[Function: usePlaneActions]
storeUtils -.-> usePlaneActions : "contains"
useGlobalStoreUtils[Function: useGlobalStoreUtils]
storeUtils -.-> useGlobalStoreUtils : "contains"
clearAllSelections[Function: clearAllSelections]
storeUtils -.-> clearAllSelections : "contains"
resetAllStores[Function: resetAllStores]
storeUtils -.-> resetAllStores : "contains"
setCellBoundariesVisible[Function: setCellBoundariesVisible]
uiOverlayStore -.-> setCellBoundariesVisible : "contains"
_avg3[Function: _avg3]
facePositionUtils -.-> _avg3 : "contains"
calculateFacePosition[Function: calculateFacePosition]
facePositionUtils -.-> calculateFacePosition : "contains"
bvhRaycasting -.-> BVHNode : "contains"
bvhRaycasting -.-> BVHAcceleratedRaycaster : "contains"
leftChild[Function: leftChild]
bvhRaycasting -.-> leftChild : "contains"
rightChild[Function: rightChild]
bvhRaycasting -.-> rightChild : "contains"
initBVHRaycasting[Function: initBVHRaycasting]
bvhRaycasting -.-> initBVHRaycasting : "contains"
getBVH[Function: getBVH]
bvhRaycasting -.-> getBVH : "contains"
updateBVHObjects[Function: updateBVHObjects]
bvhRaycasting -.-> updateBVHObjects : "contains"
bvhIntersectObjects[Function: bvhIntersectObjects]
bvhRaycasting -.-> bvhIntersectObjects : "contains"
getBVHStats[Function: getBVHStats]
bvhRaycasting -.-> getBVHStats : "contains"
updateLODLevels[Function: updateLODLevels]
bvhRaycasting -.-> updateLODLevels : "contains"
registerObjectRelationships[Function: registerObjectRelationships]
bvhRaycasting -.-> registerObjectRelationships : "contains"
loadEarthHeightmap[Function: loadEarthHeightmap]
earthHeightmapLoader -.-> loadEarthHeightmap : "contains"
img[Function: img]
earthHeightmapLoader -.-> img : "contains"
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
getIdFromIndicator[Function: getIdFromIndicator]
faceIndicatorUtils -.-> getIdFromIndicator : "contains"
validateConnection[Function: validateConnection]
connectionUtils -.-> validateConnection : "contains"
getIndicatorId[Function: getIndicatorId]
connectionUtils -.-> getIndicatorId : "contains"
getConnectionKey[Function: getConnectionKey]
connectionUtils -.-> getConnectionKey : "contains"
prepareTextObjectIndicator[Function: prepareTextObjectIndicator]
connectionUtils -.-> prepareTextObjectIndicator : "contains"
objectsAreConnectedInStore[Function: objectsAreConnectedInStore]
connectionUtils -.-> objectsAreConnectedInStore : "contains"
getConnectionsForObject[Function: getConnectionsForObject]
connectionUtils -.-> getConnectionsForObject : "contains"
createConnectionInStore[Function: createConnectionInStore]
connectionUtils -.-> createConnectionInStore : "contains"
updateConnectionPositionsInStore[Function: updateConnectionPositionsInStore]
connectionUtils -.-> updateConnectionPositionsInStore : "contains"
removeConnectionsForObject[Function: removeConnectionsForObject]
connectionUtils -.-> removeConnectionsForObject : "contains"
isInConnectionCreationMode[Function: isInConnectionCreationMode]
connectionUtils -.-> isInConnectionCreationMode : "contains"
startConnectionCreation[Function: startConnectionCreation]
connectionUtils -.-> startConnectionCreation : "contains"
completeConnectionCreation[Function: completeConnectionCreation]
connectionUtils -.-> completeConnectionCreation : "contains"
cancelConnectionCreation[Function: cancelConnectionCreation]
connectionUtils -.-> cancelConnectionCreation : "contains"
logAnimation[Function: logAnimation]
debugUtils -.-> logAnimation : "contains"
forceAnimateConnection[Function: forceAnimateConnection]
debugUtils -.-> forceAnimateConnection : "contains"
shouldAnimateConnection[Function: shouldAnimateConnection]
debugUtils -.-> shouldAnimateConnection : "contains"
recordFrameTime[Function: recordFrameTime]
debugUtils -.-> recordFrameTime : "contains"
recordStateUpdate[Function: recordStateUpdate]
debugUtils -.-> recordStateUpdate : "contains"
getPerfStats[Function: getPerfStats]
debugUtils -.-> getPerfStats : "contains"
resetPerfStats[Function: resetPerfStats]
debugUtils -.-> resetPerfStats : "contains"
setHeightmapData[Function: setHeightmapData]
earthTerrainGenerator -.-> setHeightmapData : "contains"
samplePixel[Function: samplePixel]
earthTerrainGenerator -.-> samplePixel : "contains"
pixelToElevation[Function: pixelToElevation]
earthTerrainGenerator -.-> pixelToElevation : "contains"
getElevationFromHeightmap[Function: getElevationFromHeightmap]
earthTerrainGenerator -.-> getElevationFromHeightmap : "contains"
getElevationFromModel[Function: getElevationFromModel]
earthTerrainGenerator -.-> getElevationFromModel : "contains"
getElevation[Function: getElevation]
earthTerrainGenerator -.-> getElevation : "contains"
getColorForElevation[Function: getColorForElevation]
earthTerrainGenerator -.-> getColorForElevation : "contains"
generateGlobeGeometry[Function: generateGlobeGeometry]
earthTerrainGenerator -.-> generateGlobeGeometry : "contains"
positions[Function: positions]
earthTerrainGenerator -.-> positions : "contains"
elevations[Function: elevations]
earthTerrainGenerator -.-> elevations : "contains"
colorGroups[Function: colorGroups]
earthTerrainGenerator -.-> colorGroups : "contains"
addLine[Function: addLine]
earthTerrainGenerator -.-> addLine : "contains"
posAt[Function: posAt]
earthTerrainGenerator -.-> posAt : "contains"
parsedColorCache[Function: parsedColorCache]
earthTerrainGenerator -.-> parsedColorCache : "contains"
getParsedScheme[Function: getParsedScheme]
earthTerrainGenerator -.-> getParsedScheme : "contains"
getColorRGB[Function: getColorRGB]
earthTerrainGenerator -.-> getColorRGB : "contains"
generateGlobeMesh[Function: generateGlobeMesh]
earthTerrainGenerator -.-> generateGlobeMesh : "contains"
colors[Function: colors]
earthTerrainGenerator -.-> colors : "contains"
indices[Function: indices]
earthTerrainGenerator -.-> indices : "contains"
generateLocalGlobeGeometry[Function: generateLocalGlobeGeometry]
earthTerrainGenerator -.-> generateLocalGlobeGeometry : "contains"
generateLocalGlobeMesh[Function: generateLocalGlobeMesh]
earthTerrainGenerator -.-> generateLocalGlobeMesh : "contains"
animatedMaterials[Function: animatedMaterials]
animationUtils -.-> animatedMaterials : "contains"
registerMaterial[Function: registerMaterial]
animationUtils -.-> registerMaterial : "contains"
unregisterMaterial[Function: unregisterMaterial]
animationUtils -.-> unregisterMaterial : "contains"
setAnimationSpeed[Function: setAnimationSpeed]
animationUtils -.-> setAnimationSpeed : "contains"
startAnimationLoop[Function: startAnimationLoop]
animationUtils -.-> startAnimationLoop : "contains"
animate[Function: animate]
animationUtils -.-> animate : "contains"
stopAnimationLoop[Function: stopAnimationLoop]
animationUtils -.-> stopAnimationLoop : "contains"
initAnimationSystem[Function: initAnimationSystem]
animationUtils -.-> initAnimationSystem : "contains"
calculateMidpoint[Function: calculateMidpoint]
positionUtils -.-> calculateMidpoint : "contains"
calculateMidpointVector[Function: calculateMidpointVector]
positionUtils -.-> calculateMidpointVector : "contains"
lerp[Function: lerp]
positionUtils -.-> lerp : "contains"
checkPositionJitter[Function: checkPositionJitter]
positionUtils -.-> checkPositionJitter : "contains"
objectVirtualization -.-> ObjectVirtualizer : "contains"
objectVirtualizer[Function: objectVirtualizer]
objectVirtualization -.-> objectVirtualizer : "contains"
calculateAxisSnap[Function: calculateAxisSnap]
snappingUtils -.-> calculateAxisSnap : "contains"
distanceToAxis[Function: distanceToAxis]
snappingUtils -.-> distanceToAxis : "contains"
projectPointOntoAxis[Function: projectPointOntoAxis]
snappingUtils -.-> projectPointOntoAxis : "contains"
handleObjectMove[Function: handleObjectMove]
objectUpdateHandlers -.-> handleObjectMove : "contains"
handleObjectUpdate[Function: handleObjectUpdate]
objectUpdateHandlers -.-> handleObjectUpdate : "contains"
frameCounter_file -.-> FrameCounter : "contains"
frameCounter[Function: frameCounter]
frameCounter_file -.-> frameCounter : "contains"
_frameTimeTracker[Function: _frameTimeTracker]
renderWorkScheduler -.-> _frameTimeTracker : "contains"
_resetForNextFrame[Function: _resetForNextFrame]
renderWorkScheduler -.-> _resetForNextFrame : "contains"
acquireBudget[Function: acquireBudget]
renderWorkScheduler -.-> acquireBudget : "contains"
setFrameBudget[Function: setFrameBudget]
renderWorkScheduler -.-> setFrameBudget : "contains"
getFrameBudget[Function: getFrameBudget]
renderWorkScheduler -.-> getFrameBudget : "contains"
notifyCameraMove[Function: notifyCameraMove]
renderWorkScheduler -.-> notifyCameraMove : "contains"
isCameraMoving[Function: isCameraMoving]
renderWorkScheduler -.-> isCameraMoving : "contains"
isCameraMovingRapidly[Function: isCameraMovingRapidly]
renderWorkScheduler -.-> isCameraMovingRapidly : "contains"
isFrameBudgetExhausted[Function: isFrameBudgetExhausted]
renderWorkScheduler -.-> isFrameBudgetExhausted : "contains"
getSmoothedFrameTime[Function: getSmoothedFrameTime]
renderWorkScheduler -.-> getSmoothedFrameTime : "contains"
getIsInitialLoading[Function: getIsInitialLoading]
loadingState -.-> getIsInitialLoading : "contains"
setIsInitialLoading[Function: setIsInitialLoading]
loadingState -.-> setIsInitialLoading : "contains"
gpuResourceTracker -.-> GPUResourceTracker : "contains"
gpuTracker[Function: gpuTracker]
gpuResourceTracker -.-> gpuTracker : "contains"
intersectionCache[Function: intersectionCache]
pathfindingUtils -.-> intersectionCache : "contains"
pathCache[Function: pathCache]
pathfindingUtils -.-> pathCache : "contains"
objectPositionCache[Function: objectPositionCache]
pathfindingUtils -.-> objectPositionCache : "contains"
precomputedResults[Function: precomputedResults]
pathfindingUtils -.-> precomputedResults : "contains"
invalidatePathfindingCaches[Function: invalidatePathfindingCaches]
pathfindingUtils -.-> invalidatePathfindingCaches : "contains"
checkObjectMovement[Function: checkObjectMovement]
pathfindingUtils -.-> checkObjectMovement : "contains"
cleanCaches[Function: cleanCaches]
pathfindingUtils -.-> cleanCaches : "contains"
roundForCache[Function: roundForCache]
pathfindingUtils -.-> roundForCache : "contains"
lineIntersectsBoundingBox[Function: lineIntersectsBoundingBox]
pathfindingUtils -.-> lineIntersectsBoundingBox : "contains"
generateCacheKey[Function: generateCacheKey]
pathfindingUtils -.-> generateCacheKey : "contains"
havePositionsChanged[Function: havePositionsChanged]
pathfindingUtils -.-> havePositionsChanged : "contains"
checkLineIntersection[Function: checkLineIntersection]
pathfindingUtils -.-> checkLineIntersection : "contains"
d[Function: d]
pathfindingUtils -.-> d : "contains"
generateCurvedPath[Function: generateCurvedPath]
pathfindingUtils -.-> generateCurvedPath : "contains"
checkCurveIntersections[Function: checkCurveIntersections]
pathfindingUtils -.-> checkCurveIntersections : "contains"
generateMultiSegmentPath[Function: generateMultiSegmentPath]
pathfindingUtils -.-> generateMultiSegmentPath : "contains"
precomputeCacheKey[Function: precomputeCacheKey]
pathfindingUtils -.-> precomputeCacheKey : "contains"
getPrecomputedResult[Function: getPrecomputedResult]
pathfindingUtils -.-> getPrecomputedResult : "contains"
computeConnectionPath[Function: computeConnectionPath]
pathfindingUtils -.-> computeConnectionPath : "contains"
precomputePathsBatch[Function: precomputePathsBatch]
pathfindingUtils -.-> precomputePathsBatch : "contains"
requestsById[Function: requestsById]
pathfindingUtils -.-> requestsById : "contains"
cleanObject[Function: cleanObject]
unifiedValidationUtils -.-> cleanObject : "contains"
validateRequiredProperties[Function: validateRequiredProperties]
unifiedValidationUtils -.-> validateRequiredProperties : "contains"
validateObjectSchema[Function: validateObjectSchema]
unifiedValidationUtils -.-> validateObjectSchema : "contains"
isValidPosition[Function: isValidPosition]
unifiedValidationUtils -.-> isValidPosition : "contains"
validatePosition[Function: validatePosition]
unifiedValidationUtils -.-> validatePosition : "contains"
validatePositionBounds[Function: validatePositionBounds]
unifiedValidationUtils -.-> validatePositionBounds : "contains"
unifiedValidationUtils -.-> validateConnection : "contains"
validateConnectionData[Function: validateConnectionData]
unifiedValidationUtils -.-> validateConnectionData : "contains"
unifiedValidationUtils -.-> getIndicatorId : "contains"
validateIndicator[Function: validateIndicator]
unifiedValidationUtils -.-> validateIndicator : "contains"
validateFile[Function: validateFile]
unifiedValidationUtils -.-> validateFile : "contains"
validateObjectId[Function: validateObjectId]
unifiedValidationUtils -.-> validateObjectId : "contains"
validateSpaceId[Function: validateSpaceId]
unifiedValidationUtils -.-> validateSpaceId : "contains"
validateUserId[Function: validateUserId]
unifiedValidationUtils -.-> validateUserId : "contains"
validateUrl[Function: validateUrl]
unifiedValidationUtils -.-> validateUrl : "contains"
unifiedValidationUtils -.-> urlObj : "contains"
validateEmail[Function: validateEmail]
unifiedValidationUtils -.-> validateEmail : "contains"
validateArray[Function: validateArray]
unifiedValidationUtils -.-> validateArray : "contains"
validateMultiple[Function: validateMultiple]
unifiedValidationUtils -.-> validateMultiple : "contains"
streamlinedSpatialIndex -.-> Point3D : "contains"
streamlinedSpatialIndex -.-> BoundingBox : "contains"
streamlinedSpatialIndex -.-> OptimizedSpatialGrid : "contains"
seenObjects[Function: seenObjects]
streamlinedSpatialIndex -.-> seenObjects : "contains"
createStreamlinedSpatialIndex[Function: createStreamlinedSpatialIndex]
streamlinedSpatialIndex -.-> createStreamlinedSpatialIndex : "contains"
benchmarkStreamlined[Function: benchmarkStreamlined]
streamlinedSpatialIndex -.-> benchmarkStreamlined : "contains"
position[Function: position]
streamlinedSpatialIndex -.-> position : "contains"
center[Function: center]
streamlinedSpatialIndex -.-> center : "contains"
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
url[Function: url]
textureLoader -.-> url : "contains"
textureLoader -.-> img : "contains"
loadTextureFromBlob[Function: loadTextureFromBlob]
textureLoader -.-> loadTextureFromBlob : "contains"
throttle[Function: throttle]
unifiedPerformanceUtils -.-> throttle : "contains"
debounce[Function: debounce]
unifiedPerformanceUtils -.-> debounce : "contains"
unifiedPerformanceUtils -.-> later : "contains"
measurePerformance[Function: measurePerformance]
unifiedPerformanceUtils -.-> measurePerformance : "contains"
scheduleWork[Function: scheduleWork]
unifiedPerformanceUtils -.-> scheduleWork : "contains"
memoize[Function: memoize]
unifiedPerformanceUtils -.-> memoize : "contains"
unifiedPerformanceUtils -.-> cache : "contains"
createCacheKey[Function: createCacheKey]
unifiedPerformanceUtils -.-> createCacheKey : "contains"
unifiedPerformanceUtils -.-> memoized : "contains"
trackLCP[Function: trackLCP]
unifiedPerformanceUtils -.-> trackLCP : "contains"
observer[Function: observer]
unifiedPerformanceUtils -.-> observer : "contains"
initWasmKernels[Function: initWasmKernels]
wasmKernels -.-> initWasmKernels : "contains"
isWasmReady[Function: isWasmReady]
wasmKernels -.-> isWasmReady : "contains"
fillEdgeBuffers[Function: fillEdgeBuffers]
wasmKernels -.-> fillEdgeBuffers : "contains"
getScratchStartView[Function: getScratchStartView]
wasmKernels -.-> getScratchStartView : "contains"
getScratchEndView[Function: getScratchEndView]
wasmKernels -.-> getScratchEndView : "contains"
getScratchColorView[Function: getScratchColorView]
wasmKernels -.-> getScratchColorView : "contains"
computeLodUpdates[Function: computeLodUpdates]
wasmKernels -.-> computeLodUpdates : "contains"
frustumCullConnections[Function: frustumCullConnections]
wasmKernels -.-> frustumCullConnections : "contains"
terrainTileCache -.-> cache : "contains"
pending[Function: pending]
terrainTileCache -.-> pending : "contains"
setOnTilesLoaded[Function: setOnTilesLoaded]
terrainTileCache -.-> setOnTilesLoaded : "contains"
tileKey[Function: tileKey]
terrainTileCache -.-> tileKey : "contains"
latLonToTile[Function: latLonToTile]
terrainTileCache -.-> latLonToTile : "contains"
tileBounds[Function: tileBounds]
terrainTileCache -.-> tileBounds : "contains"
fetchAndDecode[Function: fetchAndDecode]
terrainTileCache -.-> fetchAndDecode : "contains"
canvas[Function: canvas]
terrainTileCache -.-> canvas : "contains"
terrainTileCache -.-> elevations : "contains"
drainQueue[Function: drainQueue]
terrainTileCache -.-> drainQueue : "contains"
enqueueTile[Function: enqueueTile]
terrainTileCache -.-> enqueueTile : "contains"
prefetchArea[Function: prefetchArea]
terrainTileCache -.-> prefetchArea : "contains"
getCachedElevation[Function: getCachedElevation]
terrainTileCache -.-> getCachedElevation : "contains"
getCacheSize[Function: getCacheSize]
terrainTileCache -.-> getCacheSize : "contains"
textAtlas -.-> TextAtlas : "contains"
textAtlas -.-> MultiPageTextAtlas : "contains"
page[Function: page]
textAtlas -.-> page : "contains"
isOffscreenCanvasTextSupported[Function: isOffscreenCanvasTextSupported]
textAtlas -.-> isOffscreenCanvasTextSupported : "contains"
c[Function: c]
textAtlas -.-> c : "contains"
textAtlas -.-> WorkerMultiPageTextAtlas : "contains"
textAtlas -.-> seen : "contains"
_switchToSyncAtlas[Function: _switchToSyncAtlas]
textAtlas -.-> _switchToSyncAtlas : "contains"
getGlobalTextAtlas[Function: getGlobalTextAtlas]
textAtlas -.-> getGlobalTextAtlas : "contains"
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
textAtlas -.-> resetGlobalTextAtlas : "contains"
createAtlasTextMesh[Function: createAtlasTextMesh]
textAtlas -.-> createAtlasTextMesh : "contains"
worker_markdownLayoutWorker -.-> logParseHistogram : "contains"
worker_markdownLayoutWorker -.-> LayoutEngine : "contains"
parseFlowPaths[Function: parseFlowPaths]
worker_markdownLayoutWorker -.-> parseFlowPaths : "contains"
worker_markdownLayoutWorker -.-> addTag : "contains"
stripFlowPathSyntax[Function: stripFlowPathSyntax]
worker_markdownLayoutWorker -.-> stripFlowPathSyntax : "contains"
computeHeaderStyle[Function: computeHeaderStyle]
worker_markdownLayoutWorker -.-> computeHeaderStyle : "contains"
getHandTrackingWorker[Function: getHandTrackingWorker]
worker_handTrackingWorkerClient -.-> getHandTrackingWorker : "contains"
terminateHandTrackingWorker[Function: terminateHandTrackingWorker]
worker_handTrackingWorkerClient -.-> terminateHandTrackingWorker : "contains"
getDiagramLayoutWorker[Function: getDiagramLayoutWorker]
worker_diagramLayoutWorkerClient -.-> getDiagramLayoutWorker : "contains"
terminateDiagramLayoutWorker[Function: terminateDiagramLayoutWorker]
worker_diagramLayoutWorkerClient -.-> terminateDiagramLayoutWorker : "contains"
ensureCanvases[Function: ensureCanvases]
worker_handTrackingWorker -.-> ensureCanvases : "contains"
init[Function: init]
worker_handTrackingWorker -.-> init : "contains"
worker_handTrackingWorker -.-> sigmoid : "contains"
dedupeByRoi[Function: dedupeByRoi]
worker_handTrackingWorker -.-> dedupeByRoi : "contains"
roiFromLandmarks[Function: roiFromLandmarks]
worker_handTrackingWorker -.-> roiFromLandmarks : "contains"
runPalmDetection[Function: runPalmDetection]
worker_handTrackingWorker -.-> runPalmDetection : "contains"
runLandmarks[Function: runLandmarks]
worker_handTrackingWorker -.-> runLandmarks : "contains"
detect[Function: detect]
worker_handTrackingWorker -.-> detect : "contains"
dispose[Function: dispose]
worker_handTrackingWorker -.-> dispose : "contains"
getPathfindingWorker[Function: getPathfindingWorker]
worker_pathfindingWorkerClient -.-> getPathfindingWorker : "contains"
terminatePathfindingWorker[Function: terminatePathfindingWorker]
worker_pathfindingWorkerClient -.-> terminatePathfindingWorker : "contains"
compute_lod_updates[Function: compute_lod_updates]
worker_hoverchart_wasm -.-> compute_lod_updates : "contains"
fill_edge_buffers[Function: fill_edge_buffers]
worker_hoverchart_wasm -.-> fill_edge_buffers : "contains"
frustum_cull_connections[Function: frustum_cull_connections]
worker_hoverchart_wasm -.-> frustum_cull_connections : "contains"
get_scratch_color_view[Function: get_scratch_color_view]
worker_hoverchart_wasm -.-> get_scratch_color_view : "contains"
get_scratch_end_view[Function: get_scratch_end_view]
worker_hoverchart_wasm -.-> get_scratch_end_view : "contains"
get_scratch_start_view[Function: get_scratch_start_view]
worker_hoverchart_wasm -.-> get_scratch_start_view : "contains"
__wbg_get_imports[Function: __wbg_get_imports]
worker_hoverchart_wasm -.-> __wbg_get_imports : "contains"
getArrayF32FromWasm0[Function: getArrayF32FromWasm0]
worker_hoverchart_wasm -.-> getArrayF32FromWasm0 : "contains"
getArrayU32FromWasm0[Function: getArrayU32FromWasm0]
worker_hoverchart_wasm -.-> getArrayU32FromWasm0 : "contains"
getArrayU8FromWasm0[Function: getArrayU8FromWasm0]
worker_hoverchart_wasm -.-> getArrayU8FromWasm0 : "contains"
getFloat32ArrayMemory0[Function: getFloat32ArrayMemory0]
worker_hoverchart_wasm -.-> getFloat32ArrayMemory0 : "contains"
getStringFromWasm0[Function: getStringFromWasm0]
worker_hoverchart_wasm -.-> getStringFromWasm0 : "contains"
getUint32ArrayMemory0[Function: getUint32ArrayMemory0]
worker_hoverchart_wasm -.-> getUint32ArrayMemory0 : "contains"
getUint8ArrayMemory0[Function: getUint8ArrayMemory0]
worker_hoverchart_wasm -.-> getUint8ArrayMemory0 : "contains"
passArray8ToWasm0[Function: passArray8ToWasm0]
worker_hoverchart_wasm -.-> passArray8ToWasm0 : "contains"
passArrayF32ToWasm0[Function: passArrayF32ToWasm0]
worker_hoverchart_wasm -.-> passArrayF32ToWasm0 : "contains"
decodeText[Function: decodeText]
worker_hoverchart_wasm -.-> decodeText : "contains"
__wbg_finalize_init[Function: __wbg_finalize_init]
worker_hoverchart_wasm -.-> __wbg_finalize_init : "contains"
__wbg_load[Function: __wbg_load]
worker_hoverchart_wasm -.-> __wbg_load : "contains"
expectedResponseType[Function: expectedResponseType]
worker_hoverchart_wasm -.-> expectedResponseType : "contains"
initSync[Function: initSync]
worker_hoverchart_wasm -.-> initSync : "contains"
__wbg_init[Function: __wbg_init]
worker_hoverchart_wasm -.-> __wbg_init : "contains"
getMarkdownLayoutWorker[Function: getMarkdownLayoutWorker]
worker_markdownLayoutWorkerClient -.-> getMarkdownLayoutWorker : "contains"
terminateMarkdownLayoutWorker[Function: terminateMarkdownLayoutWorker]
worker_markdownLayoutWorkerClient -.-> terminateMarkdownLayoutWorker : "contains"
estimateNodeSize[Function: estimateNodeSize]
worker_diagramLayoutWorker -.-> estimateNodeSize : "contains"
isHierarchyConnection[Function: isHierarchyConnection]
worker_diagramLayoutWorker -.-> isHierarchyConnection : "contains"
filterConnections[Function: filterConnections]
worker_diagramLayoutWorker -.-> filterConnections : "contains"
layoutNodes[Function: layoutNodes]
worker_diagramLayoutWorker -.-> layoutNodes : "contains"
computeSize[Function: computeSize]
worker_diagramLayoutWorker -.-> computeSize : "contains"
computeSubtreeWidth[Function: computeSubtreeWidth]
worker_diagramLayoutWorker -.-> computeSubtreeWidth : "contains"
positionTree[Function: positionTree]
worker_diagramLayoutWorker -.-> positionTree : "contains"
positionContained[Function: positionContained]
worker_diagramLayoutWorker -.-> positionContained : "contains"
layoutEdges[Function: layoutEdges]
worker_diagramLayoutWorker -.-> layoutEdges : "contains"
getKey[Function: getKey]
worker_textAtlasWorker -.-> getKey : "contains"
worker_textAtlasWorker -.-> AtlasPage : "contains"
addPage[Function: addPage]
worker_textAtlasWorker -.-> addPage : "contains"
getTextAtlasWorker[Function: getTextAtlasWorker]
worker_textAtlasWorkerClient -.-> getTextAtlasWorker : "contains"
terminateTextAtlasWorker[Function: terminateTextAtlasWorker]
worker_textAtlasWorkerClient -.-> terminateTextAtlasWorker : "contains"
getSpatialIndexWorker[Function: getSpatialIndexWorker]
worker_spatialIndexWorkerClient -.-> getSpatialIndexWorker : "contains"
terminateSpatialIndexWorker[Function: terminateSpatialIndexWorker]
worker_spatialIndexWorkerClient -.-> terminateSpatialIndexWorker : "contains"
initWasm[Function: initWasm]
worker_spatialIndexWorker -.-> initWasm : "contains"
_rebuildFlatBuffers[Function: _rebuildFlatBuffers]
worker_spatialIndexWorker -.-> _rebuildFlatBuffers : "contains"
childLOD[Function: childLOD]
worker_spatialIndexWorker -.-> childLOD : "contains"
parentLOD[Function: parentLOD]
worker_spatialIndexWorker -.-> parentLOD : "contains"
worker_spatialIndexWorker -.-> isPointInFrustum : "contains"

%% Component Relationships
App --> FrameTicker : "uses"
App --> FrameloopController : "uses"
App --> LODManager : "enabled"
App --> CustomCamera : "camera"
App --> RealTimeConnectionUpdater : "connections"
App --> ConnectionsRenderer : "objects, allObjectsForPathfinding, visibleObjectIds..."
App --> EarthGlobe : "uses"
App --> ObjectsRenderer : "objects, visibleObjectIds, selectedId..."
App --> RepoGrid : "uses"
App --> CellBoundaryRenderer : "visible"
App --> HandsRenderer : "renders"
App --> DiagramOverlay2D : "uses"
App --> UIOverlay : "onCreateObject, onToggleIndicators, user..."
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, geometry..."
AtlasTextSprite --> StaticBillboardMesh : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, calculatedPosition..."
AtlasTextSprite --> DynamicBillboardMesh : "receives"
AppShell --> LandingApp : "onOpenSpace, onTryWithoutAccount"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> InstancedLine : "points, color, lineWidth..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AnimatedConnectionLine : "points, connectionId, color..."
DistanceFilteredConnectionText --> DistanceFilteredConnectionText : "position, maxDistance"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AtlasTextSprite : "text, position, onClick..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> HeaderInput : "position, onTextSubmit, inputId..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "position, onStyleChange, onClose..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> LineUI : "position, onColorChange, onToggleDashed..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedConnectionLines : "connections, objectPositions, selectedConnectionId..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedCurvedLines : "connections, objectPositions, pathfindingObjects..."
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> DistanceFilteredTextLabels : "labels, maxDistance, onLabelClick"
DistanceFilteredConnectionText --> Connection : "connection, allObjectsForPathfinding, onLineStyleChange..."
DistanceFilteredTextLabels --> InstancedAtlasText : "labels, maxDistance, onLabelClick..."
CubeFace --> FaceIndicator : "position, rotation, onClick..."
DodecahedronFace --> FaceIndicator : "position, rotation, onClick..."
DodecahedronFace --> AtlasTextSprite : "text, position, onClick..."
DodecahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
EarthGlobe --> InstancedLine : "points, color, lineWidth..."
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
Sphere --> SnapLineIndicator : "points, axis, visible"
Sphere --> DodecahedronFace : "dodecahedronId, faceIndex, faceGeometry..."
Sphere --> InstancedLine : "points, color, lineWidth"
Sphere --> ObjectUI : "position, onTransformToggle, onHeaderToggle..."
Sphere --> FaceUI : "position, onColorChange, face..."
Sphere --> HeaderInput : "position, onTextSubmit, inputId..."
Sphere --> AtlasTextSprite : "text, position, followTarget..."
Sphere --> TextStyleUI : "position, followTarget, onStyleChange..."
Cube --> CubeFace : "cubeId, faceName, faceData..."
Cube --> FaceUI : "position, normal, onColorChange..."
Cube --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> AtlasTextSprite : "text, position, onClick..."
Cube --> TextStyleUI : "position, onStyleChange, onClose..."
Cube --> SnapLineIndicator : "points, axis, visible"
Cube --> InstancedLine : "points, color, lineWidth"
Cube --> HeaderInput : "position, onTextSubmit, inputId..."
Cube --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
FaceUI --> ColorPicker : "onColorSelect, onClose"
InstancedAtlasText --> InstancedAtlasText : "atlas, texture, items..."
InstancedAtlasText --> PageInstancedMesh : "receives"
HandsRenderer --> InstancedLine : "points, color, lineWidth..."
LineUI --> ColorPicker : "onColorSelect, onClose"
ObjectRenderer --> Cube : "selected, onClick, onUpdate..."
ObjectRenderer --> Tetrahedron : "selected, onClick, onUpdate..."
ObjectRenderer --> Sphere : "selected, onClick, showAllIndicators..."
ObjectRenderer --> Plane : "position, scale, selected..."
ObjectRenderer --> TextObject : "position, selected, onClick..."
ObjectRenderer --> ModelObject : "obj, isSelected, onClick..."
SnapLineIndicator --> InstancedLine : "points, color, lineWidth"
RepoGrid --> RepoGrid : "...data"
RepoGrid --> RepoGridLines : "receives"
Plane --> SnapLineIndicator : "points, axis, visible"
Plane --> WebcamStream : "meshRef, active, userId..."
Plane --> ScreenShareStream : "meshRef, active, userId..."
Plane --> InstancedLine : "points, color, lineWidth..."
Plane --> FaceIndicator : "position, onClick, isActive..."
Plane --> AtlasTextSprite : "text, position, onClick..."
Plane --> TextStyleUI : "position, onStyleChange, onClose..."
Plane --> FaceUI : "position, onColorChange, onTextClick..."
Plane --> FaceTextInput : "position, onTextSubmit, inputId..."
Plane --> HeaderInput : "position, onTextSubmit, inputId..."
ObjectsRenderer --> ObjectRenderer : "obj, selectedId, handleObjectClick..."
ObjectsRenderer --> GlobalCubeEdgesRenderer : "cubes, defaultLineWidth"
ObjectsRenderer --> GlobalCubeFaceRenderer : "cubes"
ObjectsRenderer --> GlobalCubeMediumLODRenderer : "cubes"
ObjectsRenderer --> GlobalCubeFullLODInstancedRenderer : "cubes, onInstanceClick"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "dodecahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalDodecahedronMediumLODRenderer : "dodecahedrons"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "tetrahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalTetrahedronMediumLODRenderer : "tetrahedrons"
ObjectsRenderer --> AtlasTextSprite : "text, position, billboard..."
ObjectUI --> ColorPicker : "pickerId, onColorSelect, onClose"
Avatar --> HandTrackingToggle : "uses"
Avatar --> Avatar : "user"
TetrahedronFace --> AtlasTextSprite : "text, position, followTarget..."
TetrahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
TetrahedronFace --> FaceUI : "position, normal, onColorChange..."
TetrahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
TetrahedronFace --> FaceIndicator : "position, rotation, onClick..."
TextObject --> SnapLineIndicator : "points, axis, visible"
TextObject --> FaceIndicator : "position, rotation, onClick..."
TextObject --> TextObjectUI : "textStyle, onStyleChange, onDelete..."
Tetrahedron --> AtlasTextSprite : "text, position, onClick..."
Tetrahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Tetrahedron --> TetrahedronFace : "faceName, faceData, selected..."
Tetrahedron --> SnapLineIndicator : "points, axis, visible"
Tetrahedron --> InstancedLine : "points, color, lineWidth"
Tetrahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Tetrahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
TextStyleUIContainer --> TextStyleUI : "onStyleChange"
TextStyleUI --> TextStyleUIContent : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TextStyleUIContent --> TextStyleUIContent : "onStyleChange, distance, onClose"
TextObjectUI --> TextStyleUI : "uiType, textStyle, onStyleChange..."
TextStyleUI --> TextStyleUIContent : "receives"
TextObjectUI --> ColorPicker : "onColorSelect, onClose"
EarthSidebarSections --> EarthSidebarSections : "uses"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpaceChat : "spaceId, user, isOpen..."
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpacePresenceAvatars : "spaceId, currentCell"
UpdatesContainer --> UpdatesViewer : "content, timestamp"
LandingApp --> CreateSpacePopup : "...createSpaceProps"
LandingApp --> UpgradePrompt : "show, onClose, currentTier"
LandingApp --> ShareSpacePopup : "...sharePopupProps"
LandingApp --> OrganizationManager : "user, show, onClose"
LandingApp --> OrderHeader : "windowSize"
LandingApp --> CustomCamera : "scrollProgressRef"
LandingApp --> PerspectiveGrid : "uses"
LandingApp --> SpacesTable : "...spaceTableProps"
LandingApp --> UserLoginSection : "user, windowSize, onLogin..."
LandingApp --> WelcomeOverlay : "windowSize, onLogin, onTryWithoutAccount"
LandingApp --> LandingScrollContent : "scrollProgress, isMobile, onLogin..."
CreateSpacePopup --> OrgMemberDropdown : "members, selectedUserId, onSelect..."
ContentPanel --> DiagramContent : "isMobile"
ContentPanel --> AudienceContent : "isMobile"
ContentPanel --> CtaContent : "isMobile, onLogin, onTryWithoutAccount"
ContentPanel --> ContentPanel : "isMobile"

%% Component Dependencies
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
App --> repoContainerService : "uses service"
repoContainerService --> toggleTaskExpansion : "receives"
App --> spatialObjectsService : "uses service"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> presenceService : "uses service"
presenceService --> setGuestPresence : "receives"
App --> spacesService : "uses service"
spacesService --> getPublicSpaceMetadata : "receives"
App --> webRservice : "uses service"
webRservice --> initWebRTC : "receives"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
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
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
App --> useTimeoutManager_file : "{setRedirectTimeout, clearRedirectTimeout, clearLoadingTimeout...}"
useTimeoutManager_file --> useTimeoutManager_file : "receives"
App --> useAuthState_file : "{user, isAuthReady, isCheckingUrlAuth}"
useAuthState_file --> useAuthState_file : "receives"
App --> useSpaceManager_file : "{currentSpaceId}"
useSpaceManager_file --> useSpaceManager_file : "receives"
App --> useSpatialManager_file : "{loadedCells, isInitialized, currentCellCoords...}"
useSpatialManager_file --> useSpatialManager_file : "receives"
App --> useCentralizedBroadcastManager_file : "uses hook"
useCentralizedBroadcastManager_file --> useCentralizedBroadcastManager_file : "receives"
App --> useConnections_file : "{connections, handleLineStyleChange, handleLineColorChange...}"
useConnections_file --> useConnections_file : "receives"
App --> useObjects_file : "{selectedId, setSelectedId, handleCreateObject...}"
useObjects_file --> useObjects_file : "receives"
App --> useIndicators_file : "{showAllCubesIndicators, setShowAllCubesIndicators, activeIndicator...}"
useIndicators_file --> useIndicators_file : "receives"
AtlasTextSprite --> useTextAtlasStore : "uses store"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> useTextAtlasStore : "uses store"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> useTextAtlasStore : "uses store"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
AnimatedConnectionLine --> useAnimatedConnectionLineStore : "uses store"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "{startObject, endObject}"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "{connections, connectionsVisible, focusedObjectId...}"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
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
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "{startObject, endObject}"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "{connections, connectionsVisible, focusedObjectId...}"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "{connections, connectionsVisible, focusedObjectId...}"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useFrustumCulling : "{visibleConnections}"
useFrustumCulling --> useFrustumCulledConnections : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "uses store"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
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
ConnectionsRenderer --> useConnectionStore : "uses store"
ConnectionsRenderer --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
ConnectionsRenderer --> useConnectionObjects_file : "uses hook"
useConnectionObjects_file --> useConnectionObjectPositions : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionState : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionActions : "receives"
ConnectionsRenderer --> useConnectionsRendererStore_file : "uses hook"
useConnectionsRendererStore_file --> useConnectionsRendererStore_file : "receives"
ConnectionsRenderer --> useFrustumCulling : "uses hook"
useFrustumCulling --> useFrustumCulledConnections : "receives"
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
CubeFace --> useCubeStore : "uses store"
DodecahedronFace --> useDodecahedronStore : "uses store"
EarthGlobe --> useEarthSettingsStore : "uses store"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "uses utility"
earthTerrainGenerator --> setHeightmapData : "receives"
EarthGlobe --> earthHeightmapLoader : "uses utility"
earthHeightmapLoader --> loadEarthHeightmap : "receives"
EarthGlobe --> terrainTileCache : "uses utility"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "uses utility"
terrainTileCache --> setOnTilesLoaded : "receives"
DiagramOverlay2D --> useDiagramStore : "uses store"
DiagramOverlay2D --> useUIOverlayStore : "uses store"
DiagramOverlay2D --> useObjectsStore : "uses store"
ColorPicker --> useColorPickerStore : "uses store"
Sphere --> useDodecahedronStore : "uses store"
Sphere --> useObjectsStore : "uses store"
Sphere --> useConnectionStore : "uses store"
Sphere --> useIndicatorsStore : "uses store"
Sphere --> useLODStore : "uses store"
Sphere --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Sphere --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Sphere --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Sphere --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useFaceIndicatorStore : "uses store"
Cube --> useCubeStore : "uses store"
Cube --> useObjectsStore : "uses store"
Cube --> useConnectionStore : "uses store"
Cube --> useIndicatorsStore : "uses store"
Cube --> useLODStore : "uses store"
Cube --> usePipelineStore : "uses store"
Cube --> useSpaceManagerStore : "uses store"
Cube --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> startPipeline : "receives"
Cube --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> stopPipeline : "receives"
Cube --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasks : "receives"
Cube --> repoContainerService : "uses service"
repoContainerService --> clearRepoTasks : "receives"
Cube --> repoContainerService : "uses service"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
Cube --> repoContainerService : "uses service"
repoContainerService --> repositionIncomingTasks : "receives"
Cube --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Cube --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Cube --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Cube --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
GlobalCubeFullLODInstancedRenderer --> useCubeStore : "uses store"
GlobalCubeFullLODInstancedRenderer --> useLODStore : "uses store"
GlobalCubeMediumLODRenderer --> useLODStore : "uses store"
GlobalCubeFaceRenderer --> useCubeStore : "uses store"
GlobalCubeFaceRenderer --> useLODStore : "uses store"
FaceUI --> useColorPickerStore : "uses store"
FaceUI --> useFaceStore : "uses store"
GlobalDodecahedronEdgesRenderer --> useLODStore : "uses store"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> initWasmKernels : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchStartView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchEndView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchColorView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> isWasmReady : "receives"
FrameloopController --> useUIOverlayStore : "uses store"
FaceTextInput --> useTextInputStore : "uses store"
FrameTicker --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
GlobalCubeEdgesRenderer --> useLODStore : "uses store"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> initWasmKernels : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchStartView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchEndView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchColorView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> isWasmReady : "receives"
FaceIndicator --> useFaceIndicatorStore : "uses store"
GlobalTetrahedronEdgesRenderer --> useLODStore : "uses store"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> initWasmKernels : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchStartView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchEndView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchColorView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> isWasmReady : "receives"
GlobalDodecahedronMediumLODRenderer --> useLODStore : "uses store"
GlobalTetrahedronMediumLODRenderer --> useLODStore : "uses store"
InstancedAtlasText --> useTextAtlasStore : "uses store"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> useTextAtlasStore : "uses store"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
HandsRenderer --> useHandTrackingStore : "uses store"
HeaderInput --> useTextInputStore : "uses store"
LineUI --> useColorPickerStore : "uses store"
LineUI --> useConnectionStore : "uses store"
LODManager --> useLODStore : "uses store"
LODManager --> useObjectsStore : "uses store"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ScreenShareStream --> useScreenShareStore : "uses store"
ScreenShareStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
ScreenShareStream --> useTextureUpdater_file : "uses hook"
useTextureUpdater_file --> useTextureUpdater_file : "receives"
RealTimeConnectionUpdater --> useConnectionStore : "uses store"
RealTimeConnectionUpdater --> useObjectsStore : "uses store"
RealTimeConnectionUpdater --> useSpatialManagerStore : "uses store"
RealTimeConnectionUpdater --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
RepoGrid --> useObjectsStore : "uses store"
RepoGrid --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
RepoGridLines --> RepoGrid : "calls out"
RepoGrid --> useObjectsStore : "uses store"
RepoGridLines --> RepoGrid : "calls out"
RepoGrid --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
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
Plane --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Plane --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
ObjectsRenderer --> useCubeStore : "uses store"
ObjectsRenderer --> useUIOverlayStore : "uses store"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectUI --> useColorPickerStore : "uses store"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
SpacePresenceAvatars --> useHandTrackingStore : "uses store"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
TetrahedronFace --> useTetrahedronStore : "uses store"
TextObject --> useTextObjectStore : "uses store"
TextObject --> useObjectsStore : "uses store"
TextObject --> useConnectionStore : "uses store"
TextObject --> useIndicatorsStore : "uses store"
TextObject --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusColor : "receives"
TextObject --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusLabel : "receives"
TextObject --> pipelineTaskService : "uses service"
pipelineTaskService --> isTaskObject : "receives"
TextObject --> repoContainerService : "uses service"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> githubIssuesService : "uses service"
githubIssuesService --> revertCommit : "receives"
TextObject --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
TextObject --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> useGlobalClickHandler_file : "uses hook"
useGlobalClickHandler_file --> useGlobalClickHandler_file : "receives"
Tetrahedron --> useFaceIndicatorStore : "uses store"
Tetrahedron --> useTetrahedronStore : "uses store"
Tetrahedron --> useObjectsStore : "uses store"
Tetrahedron --> useConnectionStore : "uses store"
Tetrahedron --> useIndicatorsStore : "uses store"
Tetrahedron --> useLODStore : "uses store"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
TextSprite --> useTextObjectStore : "uses store"
TextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> useColorPickerStore : "uses store"
TextStyleUI --> useColorPickerStore : "uses store"
TextObjectUI --> useColorPickerStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useUIOverlayStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useDiagramStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useConnectionStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useObjectsStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useEarthSettingsStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : "uses store"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "uses service"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "uses service"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : "uses service"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : "uses service"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "uses service"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> handleGithubCallback : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> isGithubAuthenticated : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "uses service"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusColor : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusLabel : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> startPipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> pausePipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> resumePipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> stopPipeline : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> createRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> repositionIncomingTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> findRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
UIOverlay --> useUIOverlayStore : "uses store"
UIOverlay --> useDiagramStore : "uses store"
UIOverlay --> useSpatialManagerStore : "uses store"
UIOverlay --> useConnectionStore : "uses store"
UIOverlay --> useObjectsStore : "uses store"
UIOverlay --> useEarthSettingsStore : "uses store"
UIOverlay --> usePipelineStore : "uses store"
UIOverlay --> storageService : "uses service"
storageService --> uploadModelToStorage : "receives"
UIOverlay --> storageService : "uses service"
storageService --> uploadMarkdownToStorage : "receives"
UIOverlay --> screenRecordingService : "uses service"
screenRecordingService --> screenRecorder : "receives"
UIOverlay --> markdownDiagramService_file : "uses service"
markdownDiagramService_file --> markdownDiagramService : "receives"
UIOverlay --> csvDiagramService : "uses service"
csvDiagramService --> processCsvFile : "receives"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> clearAllObjectCaches : "receives"
UIOverlay --> spatialObjectsService : "uses service"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
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
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getPipelineTasks : "receives"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusColor : "receives"
UIOverlay --> pipelineTaskService : "uses service"
pipelineTaskService --> getStatusLabel : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> startPipeline : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> pausePipeline : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> resumePipeline : "receives"
UIOverlay --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> stopPipeline : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> createRepoContainer : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> repositionIncomingTasks : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> findRepoContainer : "receives"
UIOverlay --> repoContainerService : "uses service"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
WebcamStream --> useWebcamStreamStore : "uses store"
WebcamStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
WebcamStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "uses service"
organizationService --> declineInvite : "receives"
LandingApp --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize_file : "receives"
LandingApp --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize_file : "receives"
LandingApp --> useWindowSize_file : "uses hook"
useWindowSize_file --> useWindowSize_file : "receives"
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

%% Function Call Relationships
App --> presenceService : "calls setGuestPresence"
presenceService --> setGuestPresence : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> spacesService : "calls getPublicSpaceMetadata"
spacesService --> getPublicSpaceMetadata : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
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
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> webRservice : "calls initWebRTC"
webRservice --> initWebRTC : "receives"
App --> presenceService : "calls setGuestPresence"
presenceService --> setGuestPresence : "receives"
App --> animationUtils : "calls initAnimationSystem"
animationUtils --> initAnimationSystem : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> useObjectsStore : ".getState()"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> spacesService : "calls getPublicSpaceMetadata"
spacesService --> getPublicSpaceMetadata : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
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
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> useObjectsStore : ".getState()"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> objectUpdateHandlers : "calls handleObjectUpdate"
objectUpdateHandlers --> handleObjectUpdate : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> faceIndicatorUtils : "calls handleFaceIndicatorClick"
faceIndicatorUtils --> handleFaceIndicatorClick : "receives"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> useObjectsStore : ".getState()"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> useConnectionStore : ".getState()"
App --> usePlaneStore : ".getState()"
App --> useCubeStore : ".getState()"
App --> useTetrahedronStore : ".getState()"
App --> useDodecahedronStore : ".getState()"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> objectVirtualization : ".updateVisibility()"
objectVirtualization --> objectVirtualizer : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> unifiedPerformanceUtils : "calls throttle"
unifiedPerformanceUtils --> throttle : "receives"
App --> renderWorkScheduler : "calls isCameraMovingRapidly"
renderWorkScheduler --> isCameraMovingRapidly : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> renderWorkScheduler : "calls notifyCameraMove"
renderWorkScheduler --> notifyCameraMove : "receives"
App --> webRservice : "calls initWebRTC"
webRservice --> initWebRTC : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "calls calculateMidpoint"
positionUtils --> calculateMidpoint : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "calls calculateMidpoint"
positionUtils --> calculateMidpoint : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls invalidatePathfindingCaches"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls precomputePathsBatch"
pathfindingUtils --> precomputePathsBatch : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls invalidatePathfindingCaches"
pathfindingUtils --> invalidatePathfindingCaches : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls precomputePathsBatch"
pathfindingUtils --> precomputePathsBatch : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : ".getState()"
EarthGlobe --> earthHeightmapLoader : "calls loadEarthHeightmap"
earthHeightmapLoader --> loadEarthHeightmap : "receives"
EarthGlobe --> earthTerrainGenerator : "calls setHeightmapData"
earthTerrainGenerator --> setHeightmapData : "receives"
EarthGlobe --> terrainTileCache : "calls setOnTilesLoaded"
terrainTileCache --> setOnTilesLoaded : "receives"
EarthGlobe --> terrainTileCache : "calls setOnTilesLoaded"
terrainTileCache --> setOnTilesLoaded : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeGeometry"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeGeometry"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeMesh"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeMesh"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeGeometry"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeGeometry"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeMesh"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeMesh"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
EarthGlobe --> earthHeightmapLoader : "calls loadEarthHeightmap"
earthHeightmapLoader --> loadEarthHeightmap : "receives"
EarthGlobe --> earthTerrainGenerator : "calls setHeightmapData"
earthTerrainGenerator --> setHeightmapData : "receives"
EarthGlobe --> terrainTileCache : "calls setOnTilesLoaded"
terrainTileCache --> setOnTilesLoaded : "receives"
EarthGlobe --> terrainTileCache : "calls setOnTilesLoaded"
terrainTileCache --> setOnTilesLoaded : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> terrainTileCache : "calls prefetchArea"
terrainTileCache --> prefetchArea : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeGeometry"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeGeometry"
earthTerrainGenerator --> generateGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeMesh"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateGlobeMesh"
earthTerrainGenerator --> generateGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeGeometry"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeGeometry"
earthTerrainGenerator --> generateLocalGlobeGeometry : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeMesh"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
EarthGlobe --> earthTerrainGenerator : "calls generateLocalGlobeMesh"
earthTerrainGenerator --> generateLocalGlobeMesh : "receives"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
DiagramOverlay2D --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> useObjectsStore : ".getState()"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useObjectsStore : ".getState()"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> useObjectsStore : ".getState()"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineOrchestrator : "calls stopPipeline"
pipelineOrchestrator --> stopPipeline : "receives"
Cube --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
Cube --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> usePipelineStore : ".getState()"
Cube --> usePipelineStore : ".getState()"
Cube --> usePipelineStore : ".getState()"
Cube --> pipelineOrchestrator : "calls startPipeline"
pipelineOrchestrator --> startPipeline : "receives"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> repoContainerService : "calls clearRepoTasks"
repoContainerService --> clearRepoTasks : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineOrchestrator : "calls stopPipeline"
pipelineOrchestrator --> stopPipeline : "receives"
Cube --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
Cube --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
Cube --> useObjectsStore : ".getState()"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> usePipelineStore : ".getState()"
Cube --> usePipelineStore : ".getState()"
Cube --> usePipelineStore : ".getState()"
Cube --> pipelineOrchestrator : "calls startPipeline"
pipelineOrchestrator --> startPipeline : "receives"
Cube --> useSpaceManagerStore : ".getState()"
Cube --> repoContainerService : "calls clearRepoTasks"
repoContainerService --> clearRepoTasks : "receives"
Cube --> useObjectsStore : ".getState()"
GlobalCubeFaceRenderer --> useCubeStore : ".getState()"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalDodecahedronEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
FaceTextInput --> useTextInputStore : ".getState()"
FrameTicker --> frameCounter_file : ".tick()"
frameCounter_file --> frameCounter : "receives"
FrameTicker --> frameCounter_file : ".tick()"
frameCounter_file --> frameCounter : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalCubeEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalTetrahedronEdgesRenderer --> wasmKernels : "calls getScratchColorView"
wasmKernels --> getScratchColorView : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : ".setMaxGPUTextureSize()"
textAtlas --> TextAtlas : "receives"
InstancedAtlasText --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
HeaderInput --> useTextInputStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "calls getSmoothedFrameTime"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> useLODStore : ".getState()"
LODManager --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
LODManager --> renderWorkScheduler : "calls getSmoothedFrameTime"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ScreenShareStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
ScreenShareStream --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useConnectionStore : ".subscribe()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".subscribe()"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
RealTimeConnectionUpdater --> useConnectionStore : ".getState()"
RealTimeConnectionUpdater --> useConnectionStore : ".subscribe()"
RealTimeConnectionUpdater --> useObjectsStore : ".getState()"
RealTimeConnectionUpdater --> useObjectsStore : ".subscribe()"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
Plane --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
Plane --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> useObjectsStore : ".getState()"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeTexture()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> useUIOverlayStore : ".getState()"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls stopHandTracking"
handTrackingService --> stopHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls startHandTracking"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls stopHandTracking"
handTrackingService --> stopHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls startHandTracking"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls stopHandTracking"
handTrackingService --> stopHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls startHandTracking"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls stopHandTracking"
handTrackingService --> stopHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "calls startHandTracking"
handTrackingService --> startHandTracking : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "calls subscribeToSpacePresence"
presenceService --> subscribeToSpacePresence : "receives"
TetrahedronFace --> useTetrahedronStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> useObjectsStore : ".getState()"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useTextObjectStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> useObjectsStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> useObjectsStore : ".getState()"
TextObject --> pipelineTaskService : "calls getStatusColor"
pipelineTaskService --> getStatusColor : "receives"
TextObject --> pipelineTaskService : "calls getStatusLabel"
pipelineTaskService --> getStatusLabel : "receives"
TextObject --> githubIssuesService : "calls revertCommit"
githubIssuesService --> revertCommit : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> useObjectsStore : ".getState()"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
TextSprite --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useObjectsStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls findRepoContainer"
repoContainerService --> findRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useUIOverlayStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useUIOverlayStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useDiagramStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".hydrateStoreFromMarkdown()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls handleGithubCallback"
githubRepoService --> handleGithubCallback : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "calls processCsvFile"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "calls processCsvFile"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls createRepoContainer"
repoContainerService --> createRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useObjectsStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls findRepoContainer"
repoContainerService --> findRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useUIOverlayStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useUIOverlayStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useDiagramStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".hydrateStoreFromMarkdown()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls rescanRepositoryForChanges"
githubRepoService --> rescanRepositoryForChanges : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadMarkdownToStorage"
storageService --> uploadMarkdownToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls validateScanUrl"
runtimeScanService --> validateScanUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> runtimeScanService : "calls scanWebsiteAndGenerateDiagram"
runtimeScanService --> scanWebsiteAndGenerateDiagram : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls handleGithubCallback"
githubRepoService --> handleGithubCallback : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".downloadRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> useSpatialManagerStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> storageService : "calls uploadModelToStorage"
storageService --> uploadModelToStorage : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> markdownDiagramService_file : ".processMarkdownFile()"
markdownDiagramService_file --> markdownDiagramService : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "calls processCsvFile"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> csvDiagramService : "calls processCsvFile"
csvDiagramService --> processCsvFile : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls createRepoContainer"
repoContainerService --> createRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> usePipelineStore : ".getState()"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls startBroadcasting"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
WebcamStream --> webRservice : "calls joinBroadcast"
webRservice --> joinBroadcast : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
LandingApp --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
LandingApp --> organizationService : "calls getOrganizationMembers"
organizationService --> getOrganizationMembers : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
LandingApp --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
OrganizationManager --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
OrganizationManager --> organizationService : "calls getUserOrganizations"
organizationService --> getUserOrganizations : "receives"
OrganizationManager --> organizationService : "calls getPendingInvitesForUser"
organizationService --> getPendingInvitesForUser : "receives"
OrganizationManager --> organizationService : "calls createOrganization"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "calls createOrganization"
organizationService --> createOrganization : "receives"
OrganizationManager --> organizationService : "calls inviteUserToOrganization"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "calls inviteUserToOrganization"
organizationService --> inviteUserToOrganization : "receives"
OrganizationManager --> organizationService : "calls removeMemberFromOrganization"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "calls removeMemberFromOrganization"
organizationService --> removeMemberFromOrganization : "receives"
OrganizationManager --> organizationService : "calls leaveOrganization"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "calls leaveOrganization"
organizationService --> leaveOrganization : "receives"
OrganizationManager --> organizationService : "calls updateOrganizationPlan"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "calls updateOrganizationPlan"
organizationService --> updateOrganizationPlan : "receives"
OrganizationManager --> organizationService : "calls deleteOrganization"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "calls deleteOrganization"
organizationService --> deleteOrganization : "receives"
OrganizationManager --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "calls acceptInvite"
organizationService --> acceptInvite : "receives"
OrganizationManager --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"
OrganizationManager --> organizationService : "calls declineInvite"
organizationService --> declineInvite : "receives"

%% Store Usage Details
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> useConnectionStore : "selectConnectionWithFlowPath"
Sphere --> useObjectsStore : "isInitialLoading"
Cube --> useObjectsStore : "isInitialLoading"
LODManager --> useLODStore : "batchSetLODLevels, batchRegisterParentChild, batchRegisterParents, batchSetFaceTextVisible..."
TetrahedronFace --> useTetrahedronStore : "updateTetrahedronFaceColor(), updateTetrahedronFaceText(), setTetrahedronShowFaceTextInput(), setTetrahedronSelectedFace()..."
TextObject --> useTextObjectStore : "updateTextObjectProperty()"
Tetrahedron --> useObjectsStore : "isInitialLoading"

%% API Endpoints
POST_/verify_token[Endpoint: POST /verify-token]
POST_/[Endpoint: POST /]
GET_/job/:jobId[Endpoint: GET /job/:jobId]

%% API Handler Chains

%% Database Models
users_model[[Store: users]]
devUpdates_model[[Store: devUpdates]]
publicSpaces_model[[Store: publicSpaces]]
spaces_model[[Store: spaces]]
organizations_model[[Store: organizations]]
orgInvites_model[[Store: orgInvites]]
sharedSpaces_model[[Store: sharedSpaces]]

%% Auth Guards
signInWithPopup[Guard: signInWithPopup]
onAuthStateChanged[Guard: onAuthStateChanged]

%% Auth Flows
LandingApp --> signInWithPopup : "auth check"
LandingApp --> signInWithPopup : "auth check"
LandingApp --> signOut : "auth check"
LandingApp --> signOut : "auth check"
LandingApp --> signInWithPopup : "auth check"
LandingApp --> signInWithPopup : "auth check"
LandingApp --> signOut : "auth check"
LandingApp --> signOut : "auth check"

%% Events
click_event((Service: click))
mousedown_event((Service: mousedown))
pointerdown_event((Service: pointerdown))
change_event((Service: change))
popstate_event((Service: popstate))
Network_requestWillBeSent_event((Service: Network_requestWillBeSent))
ended_event((Service: ended))
error_event((Service: error))
canplay_event((Service: canplay))
onValue_event((Service: onValue))
screenRecordingStopped_event((Service: screenRecordingStopped))
loadedmetadata_event((Service: loadedmetadata))
onSnapshot_event((Service: onSnapshot))
wheel_event((Service: wheel))
touchstart_event((Service: touchstart))
touchmove_event((Service: touchmove))
resize_event((Service: resize))
beforeunload_event((Service: beforeunload))
unhandledrejection_event((Service: unhandledrejection))
visibilitychange_event((Service: visibilitychange))
state_changed_event((Service: state_changed))
value_event((Service: value))

%% Event Flows
click_event --> BVHIntegration : "listened by"
mousedown_event --> BVHIntegration : "listened by"
mousedown_event --> OrgMemberDropdown : "listened by"
pointerdown_event --> BVHIntegration : "listened by"
change_event --> App : "listened by"
change_event --> useSpatialManager : "listened by"
popstate_event --> AppShell : "listened by"
ended_event --> ScreenShareStream : "listened by"
ended_event --> screenRecordingService : "listened by"
error_event --> ScreenShareStream : "listened by"
error_event --> WebcamStream : "listened by"
error_event --> globalOptimizationCoordinator : "listened by"
error_event --> handTrackingService : "listened by"
canplay_event --> ScreenShareStream : "listened by"
canplay_event --> WebcamStream : "listened by"
onValue_event --> SpaceChat : "listened by"
onValue_event --> presenceService : "listened by"
screenRecordingStopped_event --> EarthSidebarSections : "listened by"
loadedmetadata_event --> WebcamStream : "listened by"
loadedmetadata_event --> handTrackingService : "listened by"
onSnapshot_event --> UpdatesContainer : "listened by"
onSnapshot_event --> connectionsService : "listened by"
onSnapshot_event --> spatialPartitioning : "listened by"
onSnapshot_event --> spatialObjectsService : "listened by"
onSnapshot_event --> webRservice : "listened by"
wheel_event --> LandingApp : "listened by"
touchstart_event --> LandingApp : "listened by"
touchmove_event --> LandingApp : "listened by"
resize_event --> useWindowSize : "listened by"
beforeunload_event --> globalOptimizationCoordinator : "listened by"
beforeunload_event --> globalSubscriptionManager : "listened by"
unhandledrejection_event --> globalOptimizationCoordinator : "listened by"
visibilitychange_event --> handTrackingService : "listened by"
state_changed_event --> storageService : "listened by"
value_event --> authStore : "listened by"

%% Error Boundaries
Suspense_AppShell[Boundary: Suspense]

%% Error Containment
Suspense_AppShell -.-> AppShell : "suspends"
Suspense_AppShell -.-> AppShell : "suspends"

%% Shared Interfaces
Config[[Interface: Config]]
Position3D[[Interface: Position3D]]
Rotation3D[[Interface: Rotation3D]]
Scale3D[[Interface: Scale3D]]
Transform3D[[Interface: Transform3D]]
Face[[Interface: Face]]
ParsedNode[[Interface: ParsedNode]]
ParsedConnection[[Interface: ParsedConnection]]
ParsedFlowPath[[Interface: ParsedFlowPath]]
ParsedGraph[[Interface: ParsedGraph]]
AST3DBlock[[Interface: AST3DBlock]]
ProcessedDiagram[[Interface: ProcessedDiagram]]
ConnectionPoint[[Interface: ConnectionPoint]]
VisualProperties[[Interface: VisualProperties]]
ASTNode[[Interface: ASTNode]]
ASTConnection[[Interface: ASTConnection]]
FlowPath[[Interface: FlowPath]]
AST3DGraph[[Interface: AST3DGraph]]
ASTConfig[[Interface: ASTConfig]]
InitInput[[Interface: InitInput]]
InitOutput[[Interface: InitOutput]]
SyncInitInput[[Interface: SyncInitInput]]
```
