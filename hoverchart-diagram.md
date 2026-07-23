```merfolk
%% hoverchart Repository Analysis

%% Components
App{Component: App}
AppShell{Component: AppShell}
AnimatedConnectionLine{Component: AnimatedConnectionLine}
AtlasTextSprite{Component: AtlasTextSprite}
StaticBillboardMesh{Component: StaticBillboardMesh}
DynamicBillboardMesh{Component: DynamicBillboardMesh}
BVHIntegration{Component: BVHIntegration}
BatchedConnectionLines{Component: BatchedConnectionLines}
BatchedCurvedLines{Component: BatchedCurvedLines}
CellBoundaryRenderer{Component: CellBoundaryRenderer}
CodeWorkspace{Component: CodeWorkspace}
ColorPicker{Component: ColorPicker}
DistanceFilteredConnectionText{Component: DistanceFilteredConnectionText}
Connection{Component: Connection}
ConnectionsRenderer{Component: ConnectionsRenderer}
Cube{Component: Cube}
CubeFace{Component: CubeFace}
CustomCamera{Component: CustomCamera}
DiagramOverlay2D{Component: DiagramOverlay2D}
DistanceFilteredTextLabels{Component: DistanceFilteredTextLabels}
Sphere{Component: Sphere}
DodecahedronFace{Component: DodecahedronFace}
EarthGlobe{Component: EarthGlobe}
FaceIndicator{Component: FaceIndicator}
FaceTextInput{Component: FaceTextInput}
FaceUI{Component: FaceUI}
FrameTicker{Component: FrameTicker}
FrameloopController{Component: FrameloopController}
GlobalCubeEdgesRenderer{Component: GlobalCubeEdgesRenderer}
GlobalCubeFaceRenderer{Component: GlobalCubeFaceRenderer}
GlobalCubeFullLODInstancedRenderer{Component: GlobalCubeFullLODInstancedRenderer}
GlobalCubeLowLODRenderer{Component: GlobalCubeLowLODRenderer}
GlobalCubeMediumLODRenderer{Component: GlobalCubeMediumLODRenderer}
GlobalDodecahedronEdgesRenderer{Component: GlobalDodecahedronEdgesRenderer}
GlobalDodecahedronLowLODRenderer{Component: GlobalDodecahedronLowLODRenderer}
GlobalDodecahedronMediumLODRenderer{Component: GlobalDodecahedronMediumLODRenderer}
GlobalOctahedronEdgesRenderer{Component: GlobalOctahedronEdgesRenderer}
GlobalOctahedronLowLODRenderer{Component: GlobalOctahedronLowLODRenderer}
GlobalOctahedronMediumLODRenderer{Component: GlobalOctahedronMediumLODRenderer}
GlobalTetrahedronEdgesRenderer{Component: GlobalTetrahedronEdgesRenderer}
GlobalTetrahedronLowLODRenderer{Component: GlobalTetrahedronLowLODRenderer}
GlobalTetrahedronMediumLODRenderer{Component: GlobalTetrahedronMediumLODRenderer}
HandsRenderer{Component: HandsRenderer}
HeaderBillboardManager{Component: HeaderBillboardManager}
HeaderInput{Component: HeaderInput}
InstancedAtlasText{Component: InstancedAtlasText}
PageInstancedMesh{Component: PageInstancedMesh}
InstancedLine{Component: InstancedLine}
LODManager{Component: LODManager}
LineShaderMaterial{Component: LineShaderMaterial}
LineUI{Component: LineUI}
ModelObject{Component: ModelObject}
ObjectRenderer{Component: ObjectRenderer}
ObjectSearch{Component: ObjectSearch}
ObjectUI{Component: ObjectUI}
ObjectsRenderer{Component: ObjectsRenderer}
Octahedron{Component: Octahedron}
OctahedronFace{Component: OctahedronFace}
DiffView{Component: DiffView}
PendingChangesPanel{Component: PendingChangesPanel}
Plane{Component: Plane}
RealTimeConnectionUpdater{Component: RealTimeConnectionUpdater}
RecordingFormatPrompt{Component: RecordingFormatPrompt}
TreeRow{Component: TreeRow}
GroupedView{Component: GroupedView}
RepoAnalysisOverlay{Component: RepoAnalysisOverlay}
RepoGrid{Component: RepoGrid}
RepoGridLines{Component: RepoGridLines}
ScreenShareStream{Component: ScreenShareStream}
SharedCanvas{Component: SharedCanvas}
SnapLineIndicator{Component: SnapLineIndicator}
SpaceChat{Component: SpaceChat}
Avatar{Component: Avatar}
HandTrackingToggle{Component: HandTrackingToggle}
SpacePresenceAvatars{Component: SpacePresenceAvatars}
Tetrahedron{Component: Tetrahedron}
TetrahedronFace{Component: TetrahedronFace}
TextObject{Component: TextObject}
TextObjectUI{Component: TextObjectUI}
TextSprite{Component: TextSprite}
TextStyleUIContent{Component: TextStyleUIContent}
TextStyleUI{Component: TextStyleUI}
TextStyleUIContainer{Component: TextStyleUIContainer}
EarthSidebarSections{Component: EarthSidebarSections}
UIOverlay{Component: UIOverlay}
WebcamStream{Component: WebcamStream}
MerfolkEdge{Component: MerfolkEdge}
EdgeMarkerDefs{Component: EdgeMarkerDefs}
MerfolkNode{Component: MerfolkNode}
ContainerNode{Component: ContainerNode}
CubeOutline{Component: CubeOutline}
DodecahedronWireframe{Component: DodecahedronWireframe}
FakeGlowMaterial{Component: FakeGlowMaterial}
LandingApp{Component: LandingApp}
LandingScene{Component: LandingScene}
Loader{Component: Loader}
OrderHeader{Component: OrderHeader}
PerspectiveGrid{Component: PerspectiveGrid}
UpdatesContainer{Component: UpdatesContainer}
UpdatesEditor{Component: UpdatesEditor}
UpdatesViewer{Component: UpdatesViewer}
UserForm{Component: UserForm}
CreateOrganizationPopup{Component: CreateOrganizationPopup}
CreateSpacePopup{Component: CreateSpacePopup}
DodecahedronWireframe2{Component: DodecahedronWireframe2}
SectionEyebrow{Component: SectionEyebrow}
Bullet{Component: Bullet}
ContentPanel{Component: ContentPanel}
DiagramContent{Component: DiagramContent}
FeaturesContent{Component: FeaturesContent}
AudienceContent{Component: AudienceContent}
CtaContent{Component: CtaContent}
LandingScrollContent{Component: LandingScrollContent}
LandingTopBar{Component: LandingTopBar}
OrgMemberDropdown{Component: OrgMemberDropdown}
OrganizationManager{Component: OrganizationManager}
ShareSpacePopup{Component: ShareSpacePopup}
SpacesTable{Component: SpacesTable}
UpgradePrompt{Component: UpgradePrompt}
UserLoginSection{Component: UserLoginSection}
WelcomeOverlay{Component: WelcomeOverlay}
main{Component: main}

%% Internal Helper Components
AtlasTextSprite -.-> StaticBillboardMesh : "internal"
AtlasTextSprite -.-> DynamicBillboardMesh : "internal"
ConnectionsRenderer -.-> DistanceFilteredConnectionText : "internal"
ConnectionsRenderer -.-> Connection : "internal"
InstancedAtlasText -.-> PageInstancedMesh : "internal"
PendingChangesPanel -.-> DiffView : "internal"
RepoAnalysisOverlay -.-> TreeRow : "internal"
RepoAnalysisOverlay -.-> GroupedView : "internal"
RepoGrid -.-> RepoGridLines : "internal"
SpacePresenceAvatars -.-> Avatar : "internal"
SpacePresenceAvatars -.-> HandTrackingToggle : "internal"
TextStyleUI -.-> TextStyleUIContent : "internal"
UIOverlay -.-> EarthSidebarSections : "internal"
EdgeMarkerDefs -.-> MerfolkEdge : "internal"
ContainerNode -.-> MerfolkNode : "internal"
LandingScrollContent -.-> SectionEyebrow : "internal"
LandingScrollContent -.-> Bullet : "internal"
LandingScrollContent -.-> ContentPanel : "internal"
LandingScrollContent -.-> DiagramContent : "internal"
LandingScrollContent -.-> FeaturesContent : "internal"
LandingScrollContent -.-> AudienceContent : "internal"
LandingScrollContent -.-> CtaContent : "internal"

%% Functions
calculateFaceWorldPosition[Function: calculateFaceWorldPosition]

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

%% Services
isAllowed[Function: isAllowed]
u[Function: u]
timeoutController[Function: timeoutController]
decoder[Function: decoder]
resetPumpWatchdog[Function: resetPumpWatchdog]
pump[Function: pump]
toCamel[Function: toCamel]
normalize[Function: normalize]
authenticate[Function: authenticate]
optionalAuth[Function: optionalAuth]
start[Function: start]
runMigrations[Function: runMigrations]
appliedNames[Function: appliedNames]
registerChatHandlers[Function: registerChatHandlers]
createWSServer[Function: createWSServer]
io[Function: io]
rooms[Function: rooms]
registerSignalingHandlers[Function: registerSignalingHandlers]
signInUser[Function: signInUser]
completeRedirectSignIn[Function: completeRedirectSignIn]
handlePostLoginRedirect[Function: handlePostLoginRedirect]
signOut[Function: signOut]
observeAuthState[Function: observeAuthState]
validateAuthToken[Function: validateAuthToken]
handleUrlAuth[Function: handleUrlAuth]
params[Function: params]
registerUserPresence[Function: registerUserPresence]
pendingCellObjects[Function: pendingCellObjects]
allCellObjects[Function: allCellObjects]
addPendingCellObjects[Function: addPendingCellObjects]
consumePendingCellObjects[Function: consumePendingCellObjects]
consumePendingCellObjectsForCells[Function: consumePendingCellObjectsForCells]
addToAllCellObjects[Function: addToAllCellObjects]
getAllCellObjectsForCells[Function: getAllCellObjectsForCells]
hasAnyPendingObjects[Function: hasAnyPendingObjects]
clearAllCellCaches[Function: clearAllCellCaches]
dummyUnsubscribe[Function: dummyUnsubscribe]
centralizedBroadcastManager[Function: centralizedBroadcastManager]
subscribePlaneToBroadcasts[Function: subscribePlaneToBroadcasts]
getBroadcastManagerDebugInfo[Function: getBroadcastManagerDebugInfo]
cleanupBroadcastManager[Function: cleanupBroadcastManager]
extractCodeBlocks[Function: extractCodeBlocks]
seenPaths[Function: seenPaths]
inferFilePathFromLang[Function: inferFilePathFromLang]
mapLanguage[Function: mapLanguage]
mapExtension[Function: mapExtension]
hasCodeBlocks[Function: hasCodeBlocks]
stripCodeBlocks[Function: stripCodeBlocks]
hasSearchReplaceMarkers[Function: hasSearchReplaceMarkers]
resolveConnectionPositions[Function: resolveConnectionPositions]
resolveConnectionEndpoint[Function: resolveConnectionEndpoint]
connectionNeedsPositionResolution[Function: connectionNeedsPositionResolution]
positionsEqual[Function: positionsEqual]
pauseConnectionListeners[Function: pauseConnectionListeners]
resumeConnectionListeners[Function: resumeConnectionListeners]
connectionCache[Function: connectionCache]
clearConnectionCache[Function: clearConnectionCache]
connectionDataChanged[Function: connectionDataChanged]
serializeConnection[Function: serializeConnection]
saveConnection[Function: saveConnection]
subscribeToConnections[Function: subscribeToConnections]
pollingCache[Function: pollingCache]
poll[Function: poll]
seenKeys[Function: seenKeys]
deleteConnection[Function: deleteConnection]
deleteConnectionEnhanced[Function: deleteConnectionEnhanced]
getBase64Store[Function: getBase64Store]
STOP_WORDS[Function: STOP_WORDS]
extractKeywords[Function: extractKeywords]
chunkText[Function: chunkText]
scores[Function: scores]
getContentStore[Function: getContentStore]
buildContext[Function: buildContext]
trimMessagesToFit[Function: trimMessagesToFit]
fitConversationWithSummarization[Function: fitConversationWithSummarization]
truncateFromFront[Function: truncateFromFront]
estimateMessagesSize[Function: estimateMessagesSize]
collectFileContents[Function: collectFileContents]
trimMessages[Function: trimMessages]
searchResultIndices[Function: searchResultIndices]
toRemoveSet[Function: toRemoveSet]
isUsefulToolResult[Function: isUsefulToolResult]
readKey[Function: readKey]
sendWithRetrieval[Function: sendWithRetrieval]
readFiles[Function: readFiles]
toolCallHistory[Function: toolCallHistory]
readFilesBefore[Function: readFilesBefore]
isGithubFileRequest[Function: isGithubFileRequest]
extractGithubPath[Function: extractGithubPath]
detectRetrievalRequest[Function: detectRetrievalRequest]
stripRetrievalMarkers[Function: stripRetrievalMarkers]
buildRetrievalInjection[Function: buildRetrievalInjection]
summarizeText[Function: summarizeText]
CODE_CHARS[Function: CODE_CHARS]
estimateTokens[Function: estimateTokens]
estimateMessageTokens[Function: estimateMessageTokens]
estimateMessagesTokens[Function: estimateMessagesTokens]
getContextWindow[Function: getContextWindow]
withTimeout[Function: withTimeout]
executeTool[Function: executeTool]
seen[Function: seen]
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
getRepoTree[Function: getRepoTree]
createFileOnBranch[Function: createFileOnBranch]
createTree[Function: createTree]
createCommit[Function: createCommit]
updateRef[Function: updateRef]
multiFileCommit[Function: multiFileCommit]
createPullRequest[Function: createPullRequest]
addComment[Function: addComment]
enableAutoMerge[Function: enableAutoMerge]
revertCommit[Function: revertCommit]
applySearchReplace[Function: applySearchReplace]
pushCodeToGitHub[Function: pushCodeToGitHub]
connectRepo[Function: connectRepo]
listBranches[Function: listBranches]
switchBranch[Function: switchBranch]
createNewBranch[Function: createNewBranch]
sleep[Function: sleep]
fetchWithRetry[Function: fetchWithRetry]
getTreeSitterLanguage[Function: getTreeSitterLanguage]
exchangeGithubCode[Function: exchangeGithubCode]
fetchRepositories[Function: fetchRepositories]
fetchFileContent[Function: fetchFileContent]
fetchTimeout[Function: fetchTimeout]
c[Function: c]
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
funcIdCounters[Function: funcIdCounters]
allocateFuncId[Function: allocateFuncId]
componentRelationships[Function: componentRelationships]
componentToFile[Function: componentToFile]
componentImportSources[Function: componentImportSources]
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
dbModelUsers[Function: dbModelUsers]
authGuards[Function: authGuards]
eventEmitters[Function: eventEmitters]
eventListeners[Function: eventListeners]
errorBoundaries[Function: errorBoundaries]
suspenseBoundaries[Function: suspenseBoundaries]
sharedInterfaces[Function: sharedInterfaces]
interfaceUsages[Function: interfaceUsages]
processSingleFile[Function: processSingleFile]
traversedBodies[Function: traversedBodies]
traverse[Function: traverse]
isMiddlewareParams[Function: isMiddlewareParams]
fetchWorker[Function: fetchWorker]
knownContainers[Function: knownContainers]
componentsSetForResolve[Function: componentsSetForResolve]
fileToComponent[Function: fileToComponent]
generateMerfolkMarkdown[Function: generateMerfolkMarkdown]
ENTRY_POINT_COMPONENT_NAMES[Function: ENTRY_POINT_COMPONENT_NAMES]
isValidComponentName[Function: isValidComponentName]
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
renamedIds[Function: renamedIds]
uniqueNodeId[Function: uniqueNodeId]
childToParentMap[Function: childToParentMap]
allSymbolNames[Function: allSymbolNames]
generateRoutedConnection[Function: generateRoutedConnection]
resolveId[Function: resolveId]
allComponentFunctions[Function: allComponentFunctions]
resolveRouteNodeId[Function: resolveRouteNodeId]
routeGroups[Function: routeGroups]
routeRepresentative[Function: routeRepresentative]
modelResolve[Function: modelResolve]
resolveNodeId[Function: resolveNodeId]
allEventNames[Function: allEventNames]
eventResolve[Function: eventResolve]
ifaceOnlyContainers[Function: ifaceOnlyContainers]
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
localIds[Function: localIds]
deduplicateMerfolkNodes[Function: deduplicateMerfolkNodes]
seenIds[Function: seenIds]
mergeMerfolkMarkdown[Function: mergeMerfolkMarkdown]
extractContent[Function: extractContent]
rescanRepositoryForChanges[Function: rescanRepositoryForChanges]
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
globalSubscriptions[Function: globalSubscriptions]
getOrCreateSubscription[Function: getOrCreateSubscription]
decrementSubscription[Function: decrementSubscription]
forceCleanupSubscription[Function: forceCleanupSubscription]
getSubscriptionMetrics[Function: getSubscriptionMetrics]
cleanupAllSubscriptions[Function: cleanupAllSubscriptions]
periodicCleanup[Function: periodicCleanup]
getAnchors[Function: getAnchors]
imageDataToTensor[Function: imageDataToTensor]
letterboxToImageData[Function: letterboxToImageData]
extractRotatedRoi[Function: extractRotatedRoi]
roiToImage[Function: roiToImage]
sigmoid[Function: sigmoid]
decodePalmDetections[Function: decodePalmDetections]
kps[Function: kps]
iou[Function: iou]
detectionToRoi[Function: detectionToRoi]
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
sanitizeMessages[Function: sanitizeMessages]
getProvider[Function: getProvider]
fetchModels[Function: fetchModels]
sendToProvider[Function: sendToProvider]
toolCallsMap[Function: toolCallsMap]
resetStreamWatchdog[Function: resetStreamWatchdog]
connectionTags[Function: connectionTags]
addTag[Function: addTag]
existingConnectionPairs[Function: existingConnectionPairs]
objectsById[Function: objectsById]
getFaceForObject[Function: getFaceForObject]
computeFaceWorldPosition[Function: computeFaceWorldPosition]
calculateDodecahedronFaceCenter[Function: calculateDodecahedronFaceCenter]
deriveCellCoords[Function: deriveCellCoords]
sendChunk[Function: sendChunk]
connectionsByCell[Function: connectionsByCell]
getGroupDisplayName[Function: getGroupDisplayName]
getGroupColor[Function: getGroupColor]
hierarchyComponents[Function: hierarchyComponents]
markHierarchyReachable[Function: markHierarchyReachable]
groupedByType[Function: groupedByType]
createContainerForGroup[Function: createContainerForGroup]
existingGroupTypes[Function: existingGroupTypes]
reachableFromRootModules[Function: reachableFromRootModules]
markReachable[Function: markReachable]
nodesWithContainers[Function: nodesWithContainers]
visited[Function: visited]
adjustNodeAndDescendants[Function: adjustNodeAndDescendants]
containerDimensions[Function: containerDimensions]
containerEligibleTypes[Function: containerEligibleTypes]
existingParentNodeIds[Function: existingParentNodeIds]
parentChildMap[Function: parentChildMap]
childParentMap[Function: childParentMap]
rootNodes[Function: rootNodes]
internalComponentChildren[Function: internalComponentChildren]
componentConnectionTypes[Function: componentConnectionTypes]
cycleCache[Function: cycleCache]
wouldCreateCycle[Function: wouldCreateCycle]
dfs[Function: dfs]
warnedCycles[Function: warnedCycles]
addParentChildRelation[Function: addParentChildRelation]
isCubeChild[Function: isCubeChild]
isContainerType[Function: isContainerType]
processedNodes[Function: processedNodes]
existingNodeIdMap[Function: existingNodeIdMap]
positionUpdates[Function: positionUpdates]
calculateHeaderStyle[Function: calculateHeaderStyle]
byCell[Function: byCell]
moveComponentTree[Function: moveComponentTree]
getComponentChildren[Function: getComponentChildren]
checkOverlap[Function: checkOverlap]
containersByLevel[Function: containersByLevel]
collectAllDescendants[Function: collectAllDescendants]
allDescendants[Function: allDescendants]
resolveNodeMove[Function: resolveNodeMove]
calculateNodeScaleFromChildren[Function: calculateNodeScaleFromChildren]
calculateGroupSpacing[Function: calculateGroupSpacing]
calculateGroupBounds[Function: calculateGroupBounds]
positionGroup[Function: positionGroup]
allNodes[Function: allNodes]
allConnections[Function: allConnections]
nodeToObjectIdMap[Function: nodeToObjectIdMap]
reader[Function: reader]
nodeDataMap[Function: nodeDataMap]
activeNodeIds[Function: activeNodeIds]
orphanIds[Function: orphanIds]
markdownDiagramService[Function: markdownDiagramService]
extractMerfolkBlocks[Function: extractMerfolkBlocks]
hasMerfolkBlocks[Function: hasMerfolkBlocks]
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
generateId[Function: generateId]
getCellId[Function: getCellId]
findPlanContainer[Function: findPlanContainer]
findPlanTextObjects[Function: findPlanTextObjects]
findRightmostScenePosition[Function: findRightmostScenePosition]
computeContainerScale[Function: computeContainerScale]
getPlanGridPosition[Function: getPlanGridPosition]
generatePlanTitle[Function: generatePlanTitle]
now[Function: now]
createPlanContainer[Function: createPlanContainer]
createPlanTextObject[Function: createPlanTextObject]
updatePlanText[Function: updatePlanText]
getAllPlanContext[Function: getAllPlanContext]
getGuestId[Function: getGuestId]
setUserPresence[Function: setUserPresence]
setGuestPresence[Function: setGuestPresence]
subscribeToSpacePresence[Function: subscribeToSpacePresence]
computeGridLayout[Function: computeGridLayout]
getGridCellPosition[Function: getGridCellPosition]
repositionAllTasks[Function: repositionAllTasks]
dividerIds[Function: dividerIds]
activeIds[Function: activeIds]
mergedIds[Function: mergedIds]
newCreatedIds[Function: newCreatedIds]
findRepoContainer[Function: findRepoContainer]
getAllRepoContainers[Function: getAllRepoContainers]
assignRepoSlugToOrphanTasks[Function: assignRepoSlugToOrphanTasks]
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
_disposedWeakSet[Function: _disposedWeakSet]
resourceCleanupService[Function: resourceCleanupService]
validateScanUrl[Function: validateScanUrl]
generateMerfolkFromRuntimeTrace[Function: generateMerfolkFromRuntimeTrace]
sanitizeId[Function: sanitizeId]
scanWebsiteAndGenerateDiagram[Function: scanWebsiteAndGenerateDiagram]
simulateProgress[Function: simulateProgress]
rawBlob[Function: rawBlob]
screenRecorder[Function: screenRecorder]
sharedSpacesCache[Function: sharedSpacesCache]
sharedSpacesCacheSet[Function: sharedSpacesCacheSet]
isSharedSpace[Function: isSharedSpace]
checkSpaceExists[Function: checkSpaceExists]
registerSharedSpaceFromUrl[Function: registerSharedSpaceFromUrl]
getSpaceOwner[Function: getSpaceOwner]
findSpaceOwner[Function: findSpaceOwner]
urlParams[Function: urlParams]
generateSharingUrl[Function: generateSharingUrl]
sharingUrl[Function: sharingUrl]
getSharedSpaceInfo[Function: getSharedSpaceInfo]
current[Function: current]
target[Function: target]
pc[Function: pc]
getSpaceDataChannel[Function: getSpaceDataChannel]
leaveCurrentSpace[Function: leaveCurrentSpace]
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
previousCellObjectIds[Function: previousCellObjectIds]
currentIds[Function: currentIds]
updateCellSubscriptions[Function: updateCellSubscriptions]
moveObjectBetweenCells[Function: moveObjectBetweenCells]
loadObjectsFromCells[Function: loadObjectsFromCells]
saveObject[Function: saveObject]
deleteObject[Function: deleteObject]
updateObject[Function: updateObject]
subscribeToObjects[Function: subscribeToObjects]
getObjectDeletionStatus[Function: getObjectDeletionStatus]
clearObjectDeletionBlacklist[Function: clearObjectDeletionBlacklist]
cellExistenceCache[Function: cellExistenceCache]
cleanupCache[Function: cleanupCache]
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
getLoadedCells[Function: getLoadedCells]
getObjectsFromCells[Function: getObjectsFromCells]
updateObjectInCell[Function: updateObjectInCell]
deleteObjectFromCell[Function: deleteObjectFromCell]
cellCallbacks[Function: cellCallbacks]
subscribeToCells[Function: subscribeToCells]
lastDataMap[Function: lastDataMap]
getOccupiedCells[Function: getOccupiedCells]
getCellDistance[Function: getCellDistance]
getCellsToUnload[Function: getCellsToUnload]
addConnectionToCells[Function: addConnectionToCells]
bulkSaveConnectionsToCell[Function: bulkSaveConnectionsToCell]
bulkSaveConnectionsBatch[Function: bulkSaveConnectionsBatch]
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
ALLOWED_IMAGE_TYPES[Function: ALLOWED_IMAGE_TYPES]
uploadFileGeneric[Function: uploadFileGeneric]
xhr[Function: xhr]
uploadImageToStorage[Function: uploadImageToStorage]
uploadModelToStorage[Function: uploadModelToStorage]
uploadMarkdownToStorage[Function: uploadMarkdownToStorage]
blob[Function: blob]
getStreamlinedSpatialManager[Function: getStreamlinedSpatialManager]
initializeStreamlinedSpatialPartitioning[Function: initializeStreamlinedSpatialPartitioning]
benchmarkStreamlinedSystem[Function: benchmarkStreamlinedSystem]
manager[Function: manager]
isPrivate[Function: isPrivate]
isDunder[Function: isDunder]
resolveContainerType[Function: resolveContainerType]
scanWithTreeSitter[Function: scanWithTreeSitter]
importedNames[Function: importedNames]
scanPythonWithTreeSitter[Function: scanPythonWithTreeSitter]
unifiedCacheManager[Function: unifiedCacheManager]
initWebRTC[Function: initWebRTC]
activeStreams[Function: activeStreams]
startBroadcasting[Function: startBroadcasting]
broadcastSession[Function: broadcastSession]
joinBroadcast[Function: joinBroadcast]
isPlaneBeingBroadcast[Function: isPlaneBeingBroadcast]
findAvailableBroadcasts[Function: findAvailableBroadcasts]
cleanupWebRTC[Function: cleanupWebRTC]
subscribeToUsersInSpace[Function: subscribeToUsersInSpace]
buildSceneContext[Function: buildSceneContext]
buildCodeSceneContext[Function: buildCodeSceneContext]
CONFIG_FILE_SET[Function: CONFIG_FILE_SET]
isConfigFile[Function: isConfigFile]
fetchRepoContext[Function: fetchRepoContext]
populateContentStore[Function: populateContentStore]
finalizeContentStore[Function: finalizeContentStore]
populateContentStoreWorker[Function: populateContentStoreWorker]
sendToZen[Function: sendToZen]
buildZenMessages[Function: buildZenMessages]
buildCodeMessages[Function: buildCodeMessages]
buildFileTreeSection[Function: buildFileTreeSection]
parseSectionedResponse[Function: parseSectionedResponse]
buildMinimalSceneContext[Function: buildMinimalSceneContext]
buildCodeGenMessages[Function: buildCodeGenMessages]

%% Stores
useAnimatedConnectionLineStore[[Store: useAnimatedConnectionLineStore]]
useAuthStore[[Store: useAuthStore]]
useCodeStore[[Store: useCodeStore]]
useColorPickerStore[[Store: useColorPickerStore]]
useConnectionStore[[Store: useConnectionStore]]
useContentIndexStore[[Store: useContentIndexStore]]
useCubeStore[[Store: useCubeStore]]
useDiagramStore[[Store: useDiagramStore]]
useDodecahedronStore[[Store: useDodecahedronStore]]
useEarthSettingsStore[[Store: useEarthSettingsStore]]
useFaceIndicatorStore[[Store: useFaceIndicatorStore]]
useFaceStore[[Store: useFaceStore]]
useHandTrackingStore[[Store: useHandTrackingStore]]
useIndicatorsStore[[Store: useIndicatorsStore]]
useLlmStore[[Store: useLlmStore]]
useLODStore[[Store: useLODStore]]
useObjectsStore[[Store: useObjectsStore]]
useOctahedronStore[[Store: useOctahedronStore]]
usePipelineStore[[Store: usePipelineStore]]
usePlaneStore[[Store: usePlaneStore]]
usePublicSpaceStore[[Store: usePublicSpaceStore]]
useSceneStore[[Store: useSceneStore]]
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

%% External Libraries
express<Library: express>
_google-cloud/storage<Library: @google-cloud/storage>
jsonwebtoken<Library: jsonwebtoken>
uuid<Library: uuid>
pg<Library: pg>
cors<Library: cors>
http<Library: http>
fs<Library: fs>
path<Library: path>
url<Library: url>
puppeteer-core<Library: puppeteer-core>
socket.io<Library: socket.io>
_eslint/js<Library: @eslint/js>
globals<Library: globals>
eslint-plugin-react<Library: eslint-plugin-react>
eslint-plugin-react-hooks<Library: eslint-plugin-react-hooks>
eslint-plugin-react-refresh<Library: eslint-plugin-react-refresh>
react<Library: react>
_react-three/postprocessing<Library: @react-three/postprocessing>
lodash/isEqual<Library: lodash/isEqual>
_react-three/drei<Library: @react-three/drei>
three<Library: three>
_react-three/fiber<Library: @react-three/fiber>
react-colorful<Library: react-colorful>
zustand/shallow<Library: zustand/shallow>
_xyflow/react<Library: @xyflow/react>
_xyflow/react/dist/style.css<Library: @xyflow/react/dist/style.css>
three/examples/jsm/loaders/GLTFLoader<Library: three/examples/jsm/loaders/GLTFLoader>
three/examples/jsm/loaders/DRACOLoader<Library: three/examples/jsm/loaders/DRACOLoader>
zustand<Library: zustand>
prop-types<Library: prop-types>
draft-js<Library: draft-js>
draft-js/dist/Draft.css<Library: draft-js/dist/Draft.css>
react-dom/client<Library: react-dom/client>
_babel/parser<Library: @babel/parser>
comlink<Library: comlink>
fix-webm-duration<Library: fix-webm-duration>
zustand/traditional<Library: zustand/traditional>
wasm_bindgen<Library: wasm_bindgen>
js_sys<Library: js_sys>
web-tree-sitter<Library: web-tree-sitter>
web-tree-sitter/tree-sitter.wasm?url<Library: web-tree-sitter/tree-sitter.wasm?url>
tree-sitter-wasms/out/tree-sitter-python.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-python.wasm?url>
tree-sitter-wasms/out/tree-sitter-javascript.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-javascript.wasm?url>
tree-sitter-wasms/out/tree-sitter-typescript.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-typescript.wasm?url>
tree-sitter-wasms/out/tree-sitter-tsx.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-tsx.wasm?url>
tree-sitter-wasms/out/tree-sitter-go.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-go.wasm?url>
tree-sitter-wasms/out/tree-sitter-rust.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-rust.wasm?url>
tree-sitter-wasms/out/tree-sitter-java.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-java.wasm?url>
tree-sitter-wasms/out/tree-sitter-c.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-c.wasm?url>
tree-sitter-wasms/out/tree-sitter-cpp.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-cpp.wasm?url>
tree-sitter-wasms/out/tree-sitter-c_sharp.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-c_sharp.wasm?url>
tree-sitter-wasms/out/tree-sitter-ruby.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-ruby.wasm?url>
tree-sitter-wasms/out/tree-sitter-php.wasm?url<Library: tree-sitter-wasms/out/tree-sitter-php.wasm?url>
vite<Library: vite>
_vitejs/plugin-react<Library: @vitejs/plugin-react>
vite-plugin-glsl<Library: vite-plugin-glsl>
vite-plugin-wasm<Library: vite-plugin-wasm>
vite-plugin-top-level-await<Library: vite-plugin-top-level-await>

%% Component Internal Functions
objects[Function: objects]
canViewSpace[Function: canViewSpace]
shouldRedirect[Function: shouldRedirect]
handleSpatialObjectChange[Function: handleSpatialObjectChange]
spatialManagerDebug[Function: spatialManagerDebug]
checkPositionJitterWithHistory[Function: checkPositionJitterWithHistory]
loadedCellsKey[Function: loadedCellsKey]
performInitialObjectFetch[Function: performInitialObjectFetch]
scheduleLoadingComplete[Function: scheduleLoadingComplete]
handleObjectMatrixChanged[Function: handleObjectMatrixChanged]
disableOrbitControls[Function: disableOrbitControls]
enableOrbitControls[Function: enableOrbitControls]
handleLogin[Function: handleLogin]
handleObjectClick[Function: handleObjectClick]
handleObjectMoveCallback[Function: handleObjectMoveCallback]
handleObjectUpdateCallback[Function: handleObjectUpdateCallback]
handleFaceIndicatorClickCallback[Function: handleFaceIndicatorClickCallback]
handleFaceClick[Function: handleFaceClick]
handleCanvasClick[Function: handleCanvasClick]
updateVisibleObjects[Function: updateVisibleObjects]
throttledUpdateVisibility[Function: throttledUpdateVisibility]
handleCameraUpdate[Function: handleCameraUpdate]
handleCameraSettle[Function: handleCameraSettle]
deviceInfo[Function: deviceInfo]
handleCodeToggle[Function: handleCodeToggle]
diagramSceneContent[Function: diagramSceneContent]
handleOpenSpace[Function: handleOpenSpace]
handleBackToLanding[Function: handleBackToLanding]
handleTryWithoutAccount[Function: handleTryWithoutAccount]
handlePopState[Function: handlePopState]
structuralKey[Function: structuralKey]
getSharedMaterial[Function: getSharedMaterial]
atlas[Function: atlas]
calculatedPosition[Function: calculatedPosition]
BVHIntegration_2[Function: BVHIntegration]
straightConnections[Function: straightConnections]
customRaycast[Function: customRaycast]
handleClick[Function: handleClick]
handlePointerOver[Function: handlePointerOver]
handlePointerOut[Function: handlePointerOut]
numericCacheKey[Function: numericCacheKey]
pathToSegments[Function: pathToSegments]
pathsData[Function: pathsData]
customRaycast_2[Function: customRaycast]
handleClick_2[Function: handleClick]
handlePointerOver_2[Function: handlePointerOver]
handlePointerOut_2[Function: handlePointerOut]
computeVisibleCells[Function: computeVisibleCells]
buildGeometry[Function: buildGeometry]
getLanguage[Function: getLanguage]
handleKeyDown[Function: handleKeyDown]
handleColorChange[Function: handleColorChange]
handleContainerClick[Function: handleContainerClick]
handleApplyColor[Function: handleApplyColor]
handleCancel[Function: handleCancel]
getTextParametricT[Function: getTextParametricT]
redistributeFaces[Function: redistributeFaces]
pathToLineSegments[Function: pathToLineSegments]
resolveEndpointPosition[Function: resolveEndpointPosition]
getLineWidth[Function: getLineWidth]
handleConnectionClick[Function: handleConnectionClick]
handleLineTextClick[Function: handleLineTextClick]
handleLineTextSubmit[Function: handleLineTextSubmit]
handleLineTextStyleChange[Function: handleLineTextStyleChange]
handleLineStyleChange[Function: handleLineStyleChange]
handleLineColorChange[Function: handleLineColorChange]
connectionData[Function: connectionData]
pathData[Function: pathData]
textPositionData[Function: textPositionData]
availableObjectIds[Function: availableObjectIds]
pathfindingObjects[Function: pathfindingObjects]
objectsPositionHash[Function: objectsPositionHash]
objectVisibleConnections[Function: objectVisibleConnections]
focusedConnections[Function: focusedConnections]
flowPathHighlightedConnections[Function: flowPathHighlightedConnections]
connectionsForCulling[Function: connectionsForCulling]
mountNextBatch[Function: mountNextBatch]
progressiveConnections[Function: progressiveConnections]
objectPositions[Function: objectPositions]
allStraightConnections[Function: allStraightConnections]
faceOverrides[Function: faceOverrides]
textLabels[Function: textLabels]
handleBatchedConnectionClick[Function: handleBatchedConnectionClick]
runReconcile[Function: runReconcile]
cubeData[Function: cubeData]
isIndicatorConnected[Function: isIndicatorConnected]
isIndicatorActive[Function: isIndicatorActive]
getUIPositions[Function: getUIPositions]
shouldShowIndicator[Function: shouldShowIndicator]
hasConnectedIndicators[Function: hasConnectedIndicators]
getFaceTextOffset[Function: getFaceTextOffset]
handleSceneClick[Function: handleSceneClick]
updateDatabase[Function: updateDatabase]
onClickOutside[Function: onClickOutside]
handleFaceClick_2[Function: handleFaceClick]
handleColoredFaceClick[Function: handleColoredFaceClick]
handleIndicatorClick[Function: handleIndicatorClick]
handleTransformToggle[Function: handleTransformToggle]
handleResizeToggle[Function: handleResizeToggle]
handleHeaderToggle[Function: handleHeaderToggle]
handleHeaderSubmit[Function: handleHeaderSubmit]
debouncedUpdate[Function: debouncedUpdate]
handleLineColorChange_2[Function: handleLineColorChange]
handleFaceColorChange[Function: handleFaceColorChange]
handleTextClick[Function: handleTextClick]
handleFaceTextClick[Function: handleFaceTextClick]
handleFaceTextSubmit[Function: handleFaceTextSubmit]
handleFaceTextStyleClick[Function: handleFaceTextStyleClick]
handleStyleChange[Function: handleStyleChange]
handleDrag[Function: handleDrag]
handleScale[Function: handleScale]
renderFaces[Function: renderFaces]
renderFaceTexts[Function: renderFaceTexts]
arraysEqual[Function: arraysEqual]
shallowObjEqual[Function: shallowObjEqual]
getColoredMaterial[Function: getColoredMaterial]
faceStateSelector[Function: faceStateSelector]
faceMaterial[Function: faceMaterial]
handleClick_3[Function: handleClick]
offsetMultiplier[Function: offsetMultiplier]
offsetPosition[Function: offsetPosition]
memoizedTarget[Function: memoizedTarget]
controlsRefCallback[Function: controlsRefCallback]
buildReactFlowNodes[Function: buildReactFlowNodes]
getDepth[Function: getDepth]
buildReactFlowEdges[Function: buildReactFlowEdges]
layerForType[Function: layerForType]
filterEdges[Function: filterEdges]
minimapNodeColor[Function: minimapNodeColor]
flowPathNames[Function: flowPathNames]
serialisedGraphData[Function: serialisedGraphData]
serialisedHierarchy[Function: serialisedHierarchy]
filteredEdges[Function: filteredEdges]
toggleLayer[Function: toggleLayer]
toggleLayerHandlers[Function: toggleLayerHandlers]
handleNodeClick[Function: handleNodeClick]
handleBackTo3D[Function: handleBackTo3D]
createDodecahedronGeometry[Function: createDodecahedronGeometry]
dodecahedronData[Function: dodecahedronData]
updateObjectAndStores[Function: updateObjectAndStores]
updateFaceProperty[Function: updateFaceProperty]
isIndicatorConnected_2[Function: isIndicatorConnected]
onClickOutside_2[Function: onClickOutside]
updateDatabase_2[Function: updateDatabase]
handleTransformToggle_2[Function: handleTransformToggle]
handleHeaderToggle_2[Function: handleHeaderToggle]
handleHeaderSubmit_2[Function: handleHeaderSubmit]
handleResizeToggle_2[Function: handleResizeToggle]
handleDrag_2[Function: handleDrag]
handleScale_2[Function: handleScale]
handleFaceClick_3[Function: handleFaceClick]
handleIndicatorClick_2[Function: handleIndicatorClick]
handleHeaderClick[Function: handleHeaderClick]
handleStyleChange_2[Function: handleStyleChange]
handleLineColorChange_3[Function: handleLineColorChange]
handleBackgroundClick[Function: handleBackgroundClick]
handleFaceTextSubmit_2[Function: handleFaceTextSubmit]
handleFaceTextButtonClick[Function: handleFaceTextButtonClick]
handleFaceTextClick_2[Function: handleFaceTextClick]
handleFaceTextStyleChange[Function: handleFaceTextStyleChange]
getUIPosition[Function: getUIPosition]
getHeaderPosition[Function: getHeaderPosition]
getFaceUIPosition[Function: getFaceUIPosition]
getFaceTextPosition[Function: getFaceTextPosition]
getFaceInfo[Function: getFaceInfo]
getFaceRotation[Function: getFaceRotation]
shouldShowFaceIndicator[Function: shouldShowFaceIndicator]
getHeaderInputPosition[Function: getHeaderInputPosition]
getDodecahedronColoredMaterial[Function: getDodecahedronColoredMaterial]
faceMaterial_2[Function: faceMaterial]
handleClick_4[Function: handleClick]
handleTextClick_2[Function: handleTextClick]
inverseScale[Function: inverseScale]
adjustedTextPosition[Function: adjustedTextPosition]
handlePointerDown[Function: handlePointerDown]
handlePointerUp[Function: handlePointerUp]
bands[Function: bands]
meshGeometry[Function: meshGeometry]
localDetail[Function: localDetail]
localBands[Function: localBands]
localMeshGeometry[Function: localMeshGeometry]
getIndicatorMaterial[Function: getIndicatorMaterial]
material[Function: material]
handleKeyDown_2[Function: handleKeyDown]
handleChange[Function: handleChange]
handleFocus[Function: handleFocus]
handleBlur[Function: handleBlur]
handleBorderStyleClick[Function: handleBorderStyleClick]
handleBorderColorClick[Function: handleBorderColorClick]
handleLineThicknessClick[Function: handleLineThicknessClick]
handleColorSelect[Function: handleColorSelect]
handleToolClick[Function: handleToolClick]
FrameTicker_2[Function: FrameTicker]
FrameloopController_2[Function: FrameloopController]
_ensureCubeWasmBuffers[Function: _ensureCubeWasmBuffers]
filteredCubes[Function: filteredCubes]
cubeIds[Function: cubeIds]
isCubeVisible[Function: isCubeVisible]
updateCubeEdges[Function: updateCubeEdges]
filteredCubes_2[Function: filteredCubes]
filteredCubeIds[Function: filteredCubeIds]
isCubeUnmodified[Function: isCubeUnmodified]
instancedCubes[Function: instancedCubes]
cubeIds_2[Function: cubeIds]
handleClick_5[Function: handleClick]
lowCubes[Function: lowCubes]
cubeIds_3[Function: cubeIds]
handleClick_6[Function: handleClick]
mediumCubes[Function: mediumCubes]
cubeIds_4[Function: cubeIds]
handleClick_7[Function: handleClick]
_ensureDodecaWasmBuffers[Function: _ensureDodecaWasmBuffers]
filteredDodecahedrons[Function: filteredDodecahedrons]
dodecahedronIds[Function: dodecahedronIds]
isDodecahedronVisible[Function: isDodecahedronVisible]
updateDodecahedronEdges[Function: updateDodecahedronEdges]
_buildOctagonGeometry[Function: _buildOctagonGeometry]
lowDodecahedrons[Function: lowDodecahedrons]
dodecaIds[Function: dodecaIds]
handleClick_8[Function: handleClick]
mediumDodecahedrons[Function: mediumDodecahedrons]
dodecaIds_2[Function: dodecaIds]
handleClick_9[Function: handleClick]
_ensureOctaWasmBuffers[Function: _ensureOctaWasmBuffers]
filteredOctahedrons[Function: filteredOctahedrons]
octahedronIds[Function: octahedronIds]
isOctahedronVisible[Function: isOctahedronVisible]
updateOctahedronEdges[Function: updateOctahedronEdges]
lowOctahedrons[Function: lowOctahedrons]
octaIds[Function: octaIds]
handleClick_10[Function: handleClick]
_buildOctahedronGeometry[Function: _buildOctahedronGeometry]
mediumOctahedrons[Function: mediumOctahedrons]
octaIds_2[Function: octaIds]
handleClick_11[Function: handleClick]
_ensureTetraWasmBuffers[Function: _ensureTetraWasmBuffers]
filteredTetrahedrons[Function: filteredTetrahedrons]
tetrahedronIds[Function: tetrahedronIds]
isTetrahedronVisible[Function: isTetrahedronVisible]
updateTetrahedronEdges[Function: updateTetrahedronEdges]
_buildTriangleGeometry[Function: _buildTriangleGeometry]
lowTetrahedrons[Function: lowTetrahedrons]
tetraIds[Function: tetraIds]
handleClick_12[Function: handleClick]
_buildTetraGeometry[Function: _buildTetraGeometry]
mediumTetrahedrons[Function: mediumTetrahedrons]
tetraIds_2[Function: tetraIds]
handleClick_13[Function: handleClick]
readLandmark[Function: readLandmark]
applyJoints[Function: applyJoints]
buildBonePoints[Function: buildBonePoints]
makeHandState[Function: makeHandState]
registerHeaderBillboardMesh[Function: registerHeaderBillboardMesh]
HeaderBillboardManager_2[Function: HeaderBillboardManager]
handleKeyDown_3[Function: handleKeyDown]
handleChange_2[Function: handleChange]
handleFocus_2[Function: handleFocus]
handleBlur_2[Function: handleBlur]
atlas_2[Function: atlas]
pageGroups[Function: pageGroups]
geometry[Function: geometry]
material_2[Function: material]
handleClick_14[Function: handleClick]
flatPoints[Function: flatPoints]
geometry_2[Function: geometry]
customRaycast_3[Function: customRaycast]
material_3[Function: material]
LODManager_2[Function: LODManager]
containersKey[Function: containersKey]
computeContainmentSync[Function: computeContainmentSync]
enqueueLODUpdates[Function: enqueueLODUpdates]
getFullStyle[Function: getFullStyle]
getBaseStyle[Function: getBaseStyle]
handleToolClick_2[Function: handleToolClick]
handleLineStyleClick[Function: handleLineStyleClick]
handleArrowClick[Function: handleArrowClick]
createLoaders[Function: createLoaders]
handleClick_15[Function: handleClick]
handlePointerDown_2[Function: handlePointerDown]
handlePointerUp_2[Function: handlePointerUp]
onClickStable[Function: onClickStable]
onDeleteStable[Function: onDeleteStable]
onTransformStartStable[Function: onTransformStartStable]
onTransformEndStable[Function: onTransformEndStable]
onMatrixChangedStable[Function: onMatrixChangedStable]
onMoveStable[Function: onMoveStable]
arraysEqual_2[Function: arraysEqual]
getDisplayName[Function: getDisplayName]
matchesQuery[Function: matchesQuery]
lookAtObject[Function: lookAtObject]
results[Function: results]
handleClickOutside[Function: handleClickOutside]
handleEsc[Function: handleEsc]
handleInputChange[Function: handleInputChange]
handleFocus_3[Function: handleFocus]
handleEyeClick[Function: handleEyeClick]
handleEyeClick_2[Function: handleEyeClick]
handleColorPick[Function: handleColorPick]
handleToolClick_3[Function: handleToolClick]
getProgressiveBudget[Function: getProgressiveBudget]
mountNextBatch_2[Function: mountNextBatch]
mountResume[Function: mountResume]
progressiveVisibleObjects[Function: progressiveVisibleObjects]
cubeObjects[Function: cubeObjects]
containerHeaders[Function: containerHeaders]
dodecahedronObjects[Function: dodecahedronObjects]
tetrahedronObjects[Function: tetrahedronObjects]
octahedronObjects[Function: octahedronObjects]
unmodifiedCubeIds[Function: unmodifiedCubeIds]
handleInstancedCubeClick[Function: handleInstancedCubeClick]
renderedObjects[Function: renderedObjects]
_createTriangleGeometry[Function: _createTriangleGeometry]
getFaceIndicatorProps[Function: getFaceIndicatorProps]
octahedronFaces[Function: octahedronFaces]
debouncedUpdate_2[Function: debouncedUpdate]
isIndicatorConnected_3[Function: isIndicatorConnected]
isIndicatorActive_2[Function: isIndicatorActive]
getUIPositions_2[Function: getUIPositions]
shouldShowIndicator_2[Function: shouldShowIndicator]
hasConnectedIndicators_2[Function: hasConnectedIndicators]
octahedronEdgePoints[Function: octahedronEdgePoints]
handleSceneClick_2[Function: handleSceneClick]
updateDatabase_3[Function: updateDatabase]
handleFaceClick_4[Function: handleFaceClick]
handleColoredFaceClick_2[Function: handleColoredFaceClick]
handleIndicatorClick_3[Function: handleIndicatorClick]
handleTransformToggle_3[Function: handleTransformToggle]
handleResizeToggle_3[Function: handleResizeToggle]
handleHeaderToggle_3[Function: handleHeaderToggle]
handleHeaderSubmit_3[Function: handleHeaderSubmit]
handleLineColorChange_4[Function: handleLineColorChange]
handleDrag_3[Function: handleDrag]
handleScale_3[Function: handleScale]
getFaceTextOffset_2[Function: getFaceTextOffset]
handleFaceTextStyleClick_2[Function: handleFaceTextStyleClick]
handleFaceTextStyleChange_2[Function: handleFaceTextStyleChange]
renderFaceTexts_2[Function: renderFaceTexts]
renderFaces_2[Function: renderFaces]
getOctahedronColoredMaterial[Function: getOctahedronColoredMaterial]
faceMaterial_3[Function: faceMaterial]
handleClick_16[Function: handleClick]
handleIndicatorClickLocal[Function: handleIndicatorClickLocal]
getFaceTextOffset_3[Function: getFaceTextOffset]
handleFaceTextStyleClick_3[Function: handleFaceTextStyleClick]
handleFaceTextStyleChange_3[Function: handleFaceTextStyleChange]
faceTextElement[Function: faceTextElement]
computeDiffLines[Function: computeDiffLines]
handlePush[Function: handlePush]
planeData[Function: planeData]
closeAllUIs[Function: closeAllUIs]
updateDatabase_4[Function: updateDatabase]
handleScale_4[Function: handleScale]
handleResizeEnd[Function: handleResizeEnd]
handleDrag_4[Function: handleDrag]
handleTransformStart[Function: handleTransformStart]
handleTransformEnd[Function: handleTransformEnd]
handleClick_17[Function: handleClick]
handleTextClick_3[Function: handleTextClick]
handleTextSubmit[Function: handleTextSubmit]
handleTextStyleChange[Function: handleTextStyleChange]
handleTextSpriteClick[Function: handleTextSpriteClick]
handleTransformToggle_4[Function: handleTransformToggle]
handleResizeToggle_4[Function: handleResizeToggle]
handleColorChange_2[Function: handleColorChange]
handleHeaderToggle_4[Function: handleHeaderToggle]
handleHeaderSubmit_4[Function: handleHeaderSubmit]
handleHeaderTextClick[Function: handleHeaderTextClick]
handleHeaderStyleChange[Function: handleHeaderStyleChange]
handleBorderToggle[Function: handleBorderToggle]
handleIndicatorClick_4[Function: handleIndicatorClick]
isIndicatorConnected_4[Function: isIndicatorConnected]
shouldShowIndicator_3[Function: shouldShowIndicator]
handleBroadcastStopped[Function: handleBroadcastStopped]
applyStreamScale[Function: applyStreamScale]
restoreStreamScale[Function: restoreStreamScale]
handleWebcamToggle[Function: handleWebcamToggle]
handleScreenShareToggle[Function: handleScreenShareToggle]
handlePinToggle[Function: handlePinToggle]
handleImageUpload[Function: handleImageUpload]
handleBroadcastStarted[Function: handleBroadcastStarted]
handleViewerCountChange[Function: handleViewerCountChange]
uiPositions[Function: uiPositions]
indicatorPosition[Function: indicatorPosition]
meshMaterial[Function: meshMaterial]
lineMaterialProps[Function: lineMaterialProps]
borderEdgePoints[Function: borderEdgePoints]
RealTimeConnectionUpdater_2[Function: RealTimeConnectionUpdater]
runConnectionUpdate[Function: runConnectionUpdate]
updateConnectionEndpoint[Function: updateConnectionEndpoint]
rebuildConnectionMap[Function: rebuildConnectionMap]
toggleGroup[Function: toggleGroup]
markReachable_2[Function: markReachable]
toggle[Function: toggle]
visibleRoots[Function: visibleRoots]
ancestorOf[Function: ancestorOf]
ancestorOf_2[Function: ancestorOf]
expandAll[Function: expandAll]
collapseAll[Function: collapseAll]
containers[Function: containers]
gridData[Function: gridData]
attemptPlay[Function: attemptPlay]
connectToBroadcast[Function: connectToBroadcast]
getGuestId_2[Function: getGuestId]
senderInitials[Function: senderInitials]
renderMerfolkToScene[Function: renderMerfolkToScene]
associateCodeWithScene[Function: associateCodeWithScene]
loadPersistedMessages[Function: loadPersistedMessages]
persistMessages[Function: persistMessages]
loadPersistedMode[Function: loadPersistedMode]
persistMode[Function: persistMode]
handleMove[Function: handleMove]
handleUp[Function: handleUp]
handleResizeStart[Function: handleResizeStart]
handleObjectsCleared[Function: handleObjectsCleared]
handleScroll[Function: handleScroll]
handleSend[Function: handleSend]
handlePlanSend[Function: handlePlanSend]
handleCodeSend[Function: handleCodeSend]
handleKeyDown_4[Function: handleKeyDown]
handleModeSwitch[Function: handleModeSwitch]
handleCreatePlan[Function: handleCreatePlan]
handlePlanSelect[Function: handlePlanSelect]
handleStop[Function: handleStop]
handleTechStackSubmit[Function: handleTechStackSubmit]
handleApiKeySubmit[Function: handleApiKeySubmit]
handleManualModelSubmit[Function: handleManualModelSubmit]
handleModelSelect[Function: handleModelSelect]
handleModelButtonClick[Function: handleModelButtonClick]
handleGithubLogin[Function: handleGithubLogin]
handleFetchRepos[Function: handleFetchRepos]
handleSelectRepo[Function: handleSelectRepo]
scanRepoForDiagram[Function: scanRepoForDiagram]
applyContext[Function: applyContext]
waitForMount[Function: waitForMount]
applyContext_2[Function: applyContext]
waitForMount_2[Function: waitForMount]
handleCreateNewRepo[Function: handleCreateNewRepo]
handleBranchConfirm[Function: handleBranchConfirm]
getInputPlaceholder[Function: getInputPlaceholder]
getSendButtonLabel[Function: getSendButtonLabel]
getInitials[Function: getInitials]
handleClick_18[Function: handleClick]
tetrahedronFaces[Function: tetrahedronFaces]
debouncedUpdate_3[Function: debouncedUpdate]
isIndicatorConnected_5[Function: isIndicatorConnected]
isIndicatorActive_3[Function: isIndicatorActive]
getUIPositions_3[Function: getUIPositions]
shouldShowIndicator_4[Function: shouldShowIndicator]
hasConnectedIndicators_3[Function: hasConnectedIndicators]
tetrahedronEdgePoints[Function: tetrahedronEdgePoints]
handleSceneClick_3[Function: handleSceneClick]
updateDatabase_5[Function: updateDatabase]
handleFaceClick_5[Function: handleFaceClick]
handleColoredFaceClick_3[Function: handleColoredFaceClick]
handleIndicatorClick_5[Function: handleIndicatorClick]
handleTransformToggle_5[Function: handleTransformToggle]
handleResizeToggle_5[Function: handleResizeToggle]
handleHeaderToggle_5[Function: handleHeaderToggle]
handleHeaderSubmit_5[Function: handleHeaderSubmit]
handleLineColorChange_5[Function: handleLineColorChange]
handleDrag_5[Function: handleDrag]
handleScale_5[Function: handleScale]
getFaceTextOffset_4[Function: getFaceTextOffset]
handleFaceTextStyleClick_4[Function: handleFaceTextStyleClick]
handleFaceTextStyleChange_4[Function: handleFaceTextStyleChange]
renderFaceTexts_3[Function: renderFaceTexts]
renderFaces_3[Function: renderFaces]
getTetrahedronColoredMaterial[Function: getTetrahedronColoredMaterial]
faceMaterial_4[Function: faceMaterial]
handleClick_19[Function: handleClick]
handleIndicatorClickLocal_2[Function: handleIndicatorClickLocal]
getFaceTextOffset_5[Function: getFaceTextOffset]
handleFaceTextStyleClick_5[Function: handleFaceTextStyleClick]
handleFaceTextStyleChange_5[Function: handleFaceTextStyleChange]
faceTextElement_2[Function: faceTextElement]
text[Function: text]
textStyle[Function: textStyle]
scale[Function: scale]
setOrbitControlsEnabled[Function: setOrbitControlsEnabled]
setText[Function: setText]
setTextStyle[Function: setTextStyle]
setScale[Function: setScale]
setIsEditing[Function: setIsEditing]
setIsActivelyEditing[Function: setIsActivelyEditing]
setIndicatorSelected[Function: setIndicatorSelected]
setContentHeight[Function: setContentHeight]
setShowTransform[Function: setShowTransform]
setShowResizeControls[Function: setShowResizeControls]
setBulletPointMode[Function: setBulletPointMode]
handleTransformToggle_6[Function: handleTransformToggle]
handleResizeToggle_6[Function: handleResizeToggle]
getIndicatorOffset[Function: getIndicatorOffset]
isIndicatorConnected_6[Function: isIndicatorConnected]
shouldShowIndicator_5[Function: shouldShowIndicator]
getIndicatorPositions[Function: getIndicatorPositions]
updateWorldMatrix[Function: updateWorldMatrix]
closeAllUIs_2[Function: closeAllUIs]
updateDatabase_6[Function: updateDatabase]
autoResizeTextAreaOnly[Function: autoResizeTextAreaOnly]
autoResizeTextArea[Function: autoResizeTextArea]
handleBlur_3[Function: handleBlur]
handleDivClick[Function: handleDivClick]
handleTextClick_4[Function: handleTextClick]
handleIndicatorClick_6[Function: handleIndicatorClick]
handleDrag_6[Function: handleDrag]
handleScale_6[Function: handleScale]
handleKeyDown_5[Function: handleKeyDown]
handleStyleChange_3[Function: handleStyleChange]
applyStyleToSelectionInternal[Function: applyStyleToSelectionInternal]
applyStyleToSelectionInternal_2[Function: applyStyleToSelectionInternal]
handleTextSelection[Function: handleTextSelection]
getTextAreaStyle[Function: getTextAreaStyle]
getContainerStyle[Function: getContainerStyle]
getEffectivePosition[Function: getEffectivePosition]
getTransformControlSize[Function: getTransformControlSize]
handleUIClick[Function: handleUIClick]
handleResizeToggle_7[Function: handleResizeToggle]
handleEyeClick_3[Function: handleEyeClick]
lerpVector[Function: lerpVector]
spriteId[Function: spriteId]
setIsDragging[Function: setIsDragging]
calculatedPosition_2[Function: calculatedPosition]
getFontSize[Function: getFontSize]
handleSizeChange[Function: handleSizeChange]
handleFontSizeInputChange[Function: handleFontSizeInputChange]
handleWheel[Function: handleWheel]
handleButtonClick[Function: handleButtonClick]
handleColorSelect_2[Function: handleColorSelect]
handleSelectChange[Function: handleSelectChange]
getUIScale[Function: getUIScale]
pipelineTasks[Function: pipelineTasks]
pipelineStatusCounts[Function: pipelineStatusCounts]
setIsRecording[Function: setIsRecording]
handleCellBoundariesToggle[Function: handleCellBoundariesToggle]
fetchRepositories_2[Function: fetchRepositories]
fetchAppJsxFromRepo[Function: fetchAppJsxFromRepo]
handleRescan[Function: handleRescan]
handleDownloadMarkdown[Function: handleDownloadMarkdown]
triggerDownload[Function: triggerDownload]
triggerDownload_2[Function: triggerDownload]
handleScreenClick[Function: handleScreenClick]
handleRuntimeScan[Function: handleRuntimeScan]
handleRecordClick[Function: handleRecordClick]
handleFormatSelect[Function: handleFormatSelect]
handleCancelPrompt[Function: handleCancelPrompt]
handler[Function: handler]
handleDeleteAllCells[Function: handleDeleteAllCells]
handleModelUpload[Function: handleModelUpload]
handleModelFileSelect[Function: handleModelFileSelect]
handleMarkdownUpload[Function: handleMarkdownUpload]
handleMarkdownFileSelect[Function: handleMarkdownFileSelect]
handleCsvUpload[Function: handleCsvUpload]
handleCsvFileSelect[Function: handleCsvFileSelect]
handleMenuToggle[Function: handleMenuToggle]
handleArrowClick_2[Function: handleArrowClick]
handleUnpinWebcam[Function: handleUnpinWebcam]
handleTemplateConfigChange[Function: handleTemplateConfigChange]
createTemplate[Function: createTemplate]
applyVideoTexture[Function: applyVideoTexture]
attemptPlay_2[Function: attemptPlay]
connectToBroadcast_2[Function: connectToBroadcast]
flowPathColor[Function: flowPathColor]
getEdgeStyle[Function: getEdgeStyle]
getMarkerEnd[Function: getMarkerEnd]
getSelectedStyle[Function: getSelectedStyle]
getUnselectedStyle[Function: getUnselectedStyle]
buildNodeStyles[Function: buildNodeStyles]
buildContainerStyles[Function: buildContainerStyles]
buildPrecomputedNode[Function: buildPrecomputedNode]
generateDodecahedronEdges[Function: generateDodecahedronEdges]
FakeGlowMaterial_2[Function: FakeGlowMaterial]
scheduleScrollUpdate[Function: scheduleScrollUpdate]
handleWheel_2[Function: handleWheel]
handleTouchStart[Function: handleTouchStart]
handleTouchMove[Function: handleTouchMove]
handleLogin_2[Function: handleLogin]
handleLogout[Function: handleLogout]
navigateToSpace[Function: navigateToSpace]
fetchUserSpaces[Function: fetchUserSpaces]
createNewSpace[Function: createNewSpace]
handleShareSpace[Function: handleShareSpace]
handleDeleteSpace[Function: handleDeleteSpace]
handleLeaveSpace[Function: handleLeaveSpace]
handleAcceptInvite[Function: handleAcceptInvite]
handleDeclineInvite[Function: handleDeclineInvite]
spaceTableProps[Function: spaceTableProps]
createSpaceProps[Function: createSpaceProps]
sharePopupProps[Function: sharePopupProps]
idx[Function: idx]
addEdge[Function: addEdge]
handleKeyCommand[Function: handleKeyCommand]
toggleInlineStyle[Function: toggleInlineStyle]
handleSave[Function: handleSave]
parsedContent[Function: parsedContent]
formattedTimestamp[Function: formattedTimestamp]
handleKeyPress[Function: handleKeyPress]
handleSubmit[Function: handleSubmit]
handleSpaceNameChange[Function: handleSpaceNameChange]
handleEmailChange[Function: handleEmailChange]
handleMemberSelect[Function: handleMemberSelect]
handleKeyPress_2[Function: handleKeyPress]
handleSubmit_2[Function: handleSubmit]
generateDodecahedronEdges_2[Function: generateDodecahedronEdges]
clamp01[Function: clamp01]
getSectionVisibility[Function: getSectionVisibility]
handleClickOutside_2[Function: handleClickOutside]
handleClickOutside_3[Function: handleClickOutside]
handleInputFocus[Function: handleInputFocus]
handleInputChange_2[Function: handleInputChange]
handleSelect[Function: handleSelect]
refresh[Function: refresh]
handleCreateOrg[Function: handleCreateOrg]
handleInvite[Function: handleInvite]
handleRemoveMember[Function: handleRemoveMember]
handleLeave[Function: handleLeave]
handleUpgradePlan[Function: handleUpgradePlan]
handleDeleteOrg[Function: handleDeleteOrg]
handleAcceptInvite_2[Function: handleAcceptInvite]
handleDeclineInvite_2[Function: handleDeclineInvite]
stringToColor[Function: stringToColor]
filteredMembers[Function: filteredMembers]
toggleMember[Function: toggleMember]
handleShare[Function: handleShare]
handleSpaceClick[Function: handleSpaceClick]
thStyles[Function: thStyles]
tdStyles[Function: tdStyles]
categoryRowStyles[Function: categoryRowStyles]
inviteBannerStyle[Function: inviteBannerStyle]

%% Component-Function Relationships
App -.-> objects : "internal function"
App -.-> canViewSpace : "internal function"
App -.-> shouldRedirect : "boolean check"
App -.-> handleSpatialObjectChange : "event handler"
App -.-> spatialManagerDebug : "internal function"
App -.-> checkPositionJitterWithHistory : "boolean check"
App -.-> loadedCellsKey : "internal function"
App -.-> performInitialObjectFetch : "internal function"
App -.-> scheduleLoadingComplete : "internal function"
App -.-> handleObjectMatrixChanged : "event handler"
App -.-> disableOrbitControls : "boolean check"
App -.-> enableOrbitControls : "internal function"
App -.-> handleLogin : "event handler"
App -.-> handleObjectClick : "event handler"
App -.-> handleObjectMoveCallback : "event handler"
App -.-> handleObjectUpdateCallback : "event handler"
App -.-> handleFaceIndicatorClickCallback : "event handler"
App -.-> handleFaceClick : "event handler"
App -.-> handleCanvasClick : "event handler"
App -.-> updateVisibleObjects : "update helper"
App -.-> throttledUpdateVisibility : "update helper"
App -.-> handleCameraUpdate : "event handler"
App -.-> handleCameraSettle : "event handler"
App -.-> deviceInfo : "internal function"
App -.-> handleCodeToggle : "event handler"
App -.-> diagramSceneContent : "internal function"
AppShell -.-> handleOpenSpace : "event handler"
AppShell -.-> handleBackToLanding : "event handler"
AppShell -.-> handleTryWithoutAccount : "event handler"
AppShell -.-> handlePopState : "event handler"
AnimatedConnectionLine -.-> structuralKey : "internal function"
AtlasTextSprite -.-> getSharedMaterial : "getter function"
AtlasTextSprite -.-> atlas : "internal function"
AtlasTextSprite -.-> calculatedPosition : "calculation helper"
BVHIntegration -.-> BVHIntegration_2 : "internal function"
BatchedConnectionLines -.-> straightConnections : "internal function"
BatchedConnectionLines -.-> customRaycast : "internal function"
BatchedConnectionLines -.-> handleClick : "event handler"
BatchedConnectionLines -.-> handlePointerOver : "event handler"
BatchedConnectionLines -.-> handlePointerOut : "event handler"
BatchedCurvedLines -.-> numericCacheKey : "internal function"
BatchedCurvedLines -.-> pathToSegments : "internal function"
BatchedCurvedLines -.-> pathsData : "internal function"
BatchedCurvedLines -.-> customRaycast_2 : "internal function"
BatchedCurvedLines -.-> handleClick_2 : "event handler"
BatchedCurvedLines -.-> handlePointerOver_2 : "event handler"
BatchedCurvedLines -.-> handlePointerOut_2 : "event handler"
CellBoundaryRenderer -.-> computeVisibleCells : "calculation helper"
CellBoundaryRenderer -.-> buildGeometry : "internal function"
CodeWorkspace -.-> getLanguage : "getter function"
CodeWorkspace -.-> handleKeyDown : "event handler"
ColorPicker -.-> handleColorChange : "event handler"
ColorPicker -.-> handleContainerClick : "event handler"
ColorPicker -.-> handleApplyColor : "event handler"
ColorPicker -.-> handleCancel : "event handler"
DistanceFilteredConnectionText -.-> getTextParametricT : "getter function"
DistanceFilteredConnectionText -.-> redistributeFaces : "boolean check"
DistanceFilteredConnectionText -.-> pathToLineSegments : "internal function"
DistanceFilteredConnectionText -.-> resolveEndpointPosition : "internal function"
DistanceFilteredConnectionText -.-> getLineWidth : "getter function"
DistanceFilteredConnectionText -.-> handleConnectionClick : "event handler"
DistanceFilteredConnectionText -.-> handleLineTextClick : "event handler"
DistanceFilteredConnectionText -.-> handleLineTextSubmit : "event handler"
DistanceFilteredConnectionText -.-> handleLineTextStyleChange : "event handler"
DistanceFilteredConnectionText -.-> handleLineStyleChange : "event handler"
DistanceFilteredConnectionText -.-> handleLineColorChange : "event handler"
DistanceFilteredConnectionText -.-> connectionData : "internal function"
DistanceFilteredConnectionText -.-> pathData : "internal function"
DistanceFilteredConnectionText -.-> textPositionData : "internal function"
DistanceFilteredConnectionText -.-> availableObjectIds : "internal function"
DistanceFilteredConnectionText -.-> pathfindingObjects : "internal function"
DistanceFilteredConnectionText -.-> objectsPositionHash : "internal function"
DistanceFilteredConnectionText -.-> objectVisibleConnections : "boolean check"
DistanceFilteredConnectionText -.-> focusedConnections : "internal function"
DistanceFilteredConnectionText -.-> flowPathHighlightedConnections : "internal function"
DistanceFilteredConnectionText -.-> connectionsForCulling : "internal function"
DistanceFilteredConnectionText -.-> mountNextBatch : "internal function"
DistanceFilteredConnectionText -.-> progressiveConnections : "internal function"
DistanceFilteredConnectionText -.-> objectPositions : "internal function"
DistanceFilteredConnectionText -.-> allStraightConnections : "internal function"
DistanceFilteredConnectionText -.-> faceOverrides : "internal function"
DistanceFilteredConnectionText -.-> textLabels : "internal function"
DistanceFilteredConnectionText -.-> handleBatchedConnectionClick : "event handler"
Cube -.-> runReconcile : "internal function"
Cube -.-> cubeData : "internal function"
Cube -.-> isIndicatorConnected : "boolean check"
Cube -.-> isIndicatorActive : "boolean check"
Cube -.-> getUIPositions : "getter function"
Cube -.-> shouldShowIndicator : "boolean check"
Cube -.-> hasConnectedIndicators : "internal function"
Cube -.-> getFaceTextOffset : "getter function"
Cube -.-> handleSceneClick : "event handler"
Cube -.-> updateDatabase : "update helper"
Cube -.-> onClickOutside : "internal function"
Cube -.-> handleFaceClick_2 : "event handler"
Cube -.-> handleColoredFaceClick : "event handler"
Cube -.-> handleIndicatorClick : "event handler"
Cube -.-> handleTransformToggle : "event handler"
Cube -.-> handleResizeToggle : "event handler"
Cube -.-> handleHeaderToggle : "event handler"
Cube -.-> handleHeaderSubmit : "event handler"
Cube -.-> debouncedUpdate : "update helper"
Cube -.-> handleLineColorChange_2 : "event handler"
Cube -.-> handleFaceColorChange : "event handler"
Cube -.-> handleTextClick : "event handler"
Cube -.-> handleFaceTextClick : "event handler"
Cube -.-> handleFaceTextSubmit : "event handler"
Cube -.-> handleFaceTextStyleClick : "event handler"
Cube -.-> handleStyleChange : "event handler"
Cube -.-> handleDrag : "event handler"
Cube -.-> handleScale : "event handler"
Cube -.-> renderFaces : "render helper"
Cube -.-> renderFaceTexts : "render helper"
Cube -.-> arraysEqual : "internal function"
Cube -.-> shallowObjEqual : "internal function"
CubeFace -.-> getColoredMaterial : "getter function"
CubeFace -.-> faceStateSelector : "internal function"
CubeFace -.-> faceMaterial : "internal function"
CubeFace -.-> handleClick_3 : "event handler"
CubeFace -.-> offsetMultiplier : "setter function"
CubeFace -.-> offsetPosition : "setter function"
CustomCamera -.-> memoizedTarget : "getter function"
CustomCamera -.-> controlsRefCallback : "internal function"
DiagramOverlay2D -.-> buildReactFlowNodes : "internal function"
DiagramOverlay2D -.-> getDepth : "getter function"
DiagramOverlay2D -.-> buildReactFlowEdges : "internal function"
DiagramOverlay2D -.-> layerForType : "internal function"
DiagramOverlay2D -.-> filterEdges : "internal function"
DiagramOverlay2D -.-> minimapNodeColor : "internal function"
DiagramOverlay2D -.-> flowPathNames : "internal function"
DiagramOverlay2D -.-> serialisedGraphData : "boolean check"
DiagramOverlay2D -.-> serialisedHierarchy : "boolean check"
DiagramOverlay2D -.-> filteredEdges : "internal function"
DiagramOverlay2D -.-> toggleLayer : "internal function"
DiagramOverlay2D -.-> toggleLayerHandlers : "event handler"
DiagramOverlay2D -.-> handleNodeClick : "event handler"
DiagramOverlay2D -.-> handleBackTo3D : "event handler"
Sphere -.-> createDodecahedronGeometry : "internal function"
Sphere -.-> dodecahedronData : "internal function"
Sphere -.-> updateObjectAndStores : "update helper"
Sphere -.-> updateFaceProperty : "update helper"
Sphere -.-> isIndicatorConnected_2 : "boolean check"
Sphere -.-> onClickOutside_2 : "internal function"
Sphere -.-> updateDatabase_2 : "update helper"
Sphere -.-> handleTransformToggle_2 : "event handler"
Sphere -.-> handleHeaderToggle_2 : "event handler"
Sphere -.-> handleHeaderSubmit_2 : "event handler"
Sphere -.-> handleResizeToggle_2 : "event handler"
Sphere -.-> handleDrag_2 : "event handler"
Sphere -.-> handleScale_2 : "event handler"
Sphere -.-> handleFaceClick_3 : "event handler"
Sphere -.-> handleIndicatorClick_2 : "event handler"
Sphere -.-> handleHeaderClick : "event handler"
Sphere -.-> handleStyleChange_2 : "event handler"
Sphere -.-> handleLineColorChange_3 : "event handler"
Sphere -.-> handleBackgroundClick : "event handler"
Sphere -.-> handleFaceTextSubmit_2 : "event handler"
Sphere -.-> handleFaceTextButtonClick : "event handler"
Sphere -.-> handleFaceTextClick_2 : "event handler"
Sphere -.-> handleFaceTextStyleChange : "event handler"
Sphere -.-> getUIPosition : "getter function"
Sphere -.-> getHeaderPosition : "getter function"
Sphere -.-> getFaceUIPosition : "getter function"
Sphere -.-> getFaceTextPosition : "getter function"
Sphere -.-> getFaceInfo : "getter function"
Sphere -.-> getFaceRotation : "getter function"
Sphere -.-> shouldShowFaceIndicator : "boolean check"
Sphere -.-> getHeaderInputPosition : "getter function"
DodecahedronFace -.-> getDodecahedronColoredMaterial : "getter function"
DodecahedronFace -.-> faceMaterial_2 : "internal function"
DodecahedronFace -.-> handleClick_4 : "event handler"
DodecahedronFace -.-> handleTextClick_2 : "event handler"
DodecahedronFace -.-> inverseScale : "internal function"
DodecahedronFace -.-> adjustedTextPosition : "internal function"
EarthGlobe -.-> handlePointerDown : "event handler"
EarthGlobe -.-> handlePointerUp : "event handler"
EarthGlobe -.-> bands : "internal function"
EarthGlobe -.-> meshGeometry : "internal function"
EarthGlobe -.-> localDetail : "internal function"
EarthGlobe -.-> localBands : "internal function"
EarthGlobe -.-> localMeshGeometry : "internal function"
FaceIndicator -.-> getIndicatorMaterial : "getter function"
FaceIndicator -.-> material : "internal function"
FaceTextInput -.-> handleKeyDown_2 : "event handler"
FaceTextInput -.-> handleChange : "event handler"
FaceTextInput -.-> handleFocus : "event handler"
FaceTextInput -.-> handleBlur : "event handler"
FaceUI -.-> handleBorderStyleClick : "event handler"
FaceUI -.-> handleBorderColorClick : "event handler"
FaceUI -.-> handleLineThicknessClick : "event handler"
FaceUI -.-> handleColorSelect : "event handler"
FaceUI -.-> handleToolClick : "event handler"
FrameTicker -.-> FrameTicker_2 : "internal function"
FrameloopController -.-> FrameloopController_2 : "internal function"
GlobalCubeEdgesRenderer -.-> _ensureCubeWasmBuffers : "internal function"
GlobalCubeEdgesRenderer -.-> filteredCubes : "internal function"
GlobalCubeEdgesRenderer -.-> cubeIds : "internal function"
GlobalCubeEdgesRenderer -.-> isCubeVisible : "boolean check"
GlobalCubeEdgesRenderer -.-> updateCubeEdges : "update helper"
GlobalCubeFaceRenderer -.-> filteredCubes_2 : "internal function"
GlobalCubeFaceRenderer -.-> filteredCubeIds : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> isCubeUnmodified : "boolean check"
GlobalCubeFullLODInstancedRenderer -.-> instancedCubes : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> cubeIds_2 : "internal function"
GlobalCubeFullLODInstancedRenderer -.-> handleClick_5 : "event handler"
GlobalCubeLowLODRenderer -.-> lowCubes : "internal function"
GlobalCubeLowLODRenderer -.-> cubeIds_3 : "internal function"
GlobalCubeLowLODRenderer -.-> handleClick_6 : "event handler"
GlobalCubeMediumLODRenderer -.-> mediumCubes : "internal function"
GlobalCubeMediumLODRenderer -.-> cubeIds_4 : "internal function"
GlobalCubeMediumLODRenderer -.-> handleClick_7 : "event handler"
GlobalDodecahedronEdgesRenderer -.-> _ensureDodecaWasmBuffers : "internal function"
GlobalDodecahedronEdgesRenderer -.-> filteredDodecahedrons : "internal function"
GlobalDodecahedronEdgesRenderer -.-> dodecahedronIds : "internal function"
GlobalDodecahedronEdgesRenderer -.-> isDodecahedronVisible : "boolean check"
GlobalDodecahedronEdgesRenderer -.-> updateDodecahedronEdges : "update helper"
GlobalDodecahedronLowLODRenderer -.-> _buildOctagonGeometry : "internal function"
GlobalDodecahedronLowLODRenderer -.-> lowDodecahedrons : "internal function"
GlobalDodecahedronLowLODRenderer -.-> dodecaIds : "internal function"
GlobalDodecahedronLowLODRenderer -.-> handleClick_8 : "event handler"
GlobalDodecahedronMediumLODRenderer -.-> mediumDodecahedrons : "internal function"
GlobalDodecahedronMediumLODRenderer -.-> dodecaIds_2 : "internal function"
GlobalDodecahedronMediumLODRenderer -.-> handleClick_9 : "event handler"
GlobalOctahedronEdgesRenderer -.-> _ensureOctaWasmBuffers : "internal function"
GlobalOctahedronEdgesRenderer -.-> filteredOctahedrons : "internal function"
GlobalOctahedronEdgesRenderer -.-> octahedronIds : "internal function"
GlobalOctahedronEdgesRenderer -.-> isOctahedronVisible : "boolean check"
GlobalOctahedronEdgesRenderer -.-> updateOctahedronEdges : "update helper"
GlobalOctahedronLowLODRenderer -.-> lowOctahedrons : "internal function"
GlobalOctahedronLowLODRenderer -.-> octaIds : "internal function"
GlobalOctahedronLowLODRenderer -.-> handleClick_10 : "event handler"
GlobalOctahedronMediumLODRenderer -.-> _buildOctahedronGeometry : "internal function"
GlobalOctahedronMediumLODRenderer -.-> mediumOctahedrons : "internal function"
GlobalOctahedronMediumLODRenderer -.-> octaIds_2 : "internal function"
GlobalOctahedronMediumLODRenderer -.-> handleClick_11 : "event handler"
GlobalTetrahedronEdgesRenderer -.-> _ensureTetraWasmBuffers : "internal function"
GlobalTetrahedronEdgesRenderer -.-> filteredTetrahedrons : "internal function"
GlobalTetrahedronEdgesRenderer -.-> tetrahedronIds : "internal function"
GlobalTetrahedronEdgesRenderer -.-> isTetrahedronVisible : "boolean check"
GlobalTetrahedronEdgesRenderer -.-> updateTetrahedronEdges : "update helper"
GlobalTetrahedronLowLODRenderer -.-> _buildTriangleGeometry : "internal function"
GlobalTetrahedronLowLODRenderer -.-> lowTetrahedrons : "internal function"
GlobalTetrahedronLowLODRenderer -.-> tetraIds : "internal function"
GlobalTetrahedronLowLODRenderer -.-> handleClick_12 : "event handler"
GlobalTetrahedronMediumLODRenderer -.-> _buildTetraGeometry : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> mediumTetrahedrons : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> tetraIds_2 : "internal function"
GlobalTetrahedronMediumLODRenderer -.-> handleClick_13 : "event handler"
HandsRenderer -.-> readLandmark : "internal function"
HandsRenderer -.-> applyJoints : "internal function"
HandsRenderer -.-> buildBonePoints : "internal function"
HandsRenderer -.-> makeHandState : "internal function"
HeaderBillboardManager -.-> registerHeaderBillboardMesh : "boolean check"
HeaderBillboardManager -.-> HeaderBillboardManager_2 : "internal function"
HeaderInput -.-> handleKeyDown_3 : "event handler"
HeaderInput -.-> handleChange_2 : "event handler"
HeaderInput -.-> handleFocus_2 : "event handler"
HeaderInput -.-> handleBlur_2 : "event handler"
InstancedAtlasText -.-> atlas_2 : "internal function"
InstancedAtlasText -.-> pageGroups : "internal function"
InstancedAtlasText -.-> geometry : "internal function"
InstancedAtlasText -.-> material_2 : "internal function"
InstancedAtlasText -.-> handleClick_14 : "event handler"
InstancedLine -.-> flatPoints : "internal function"
InstancedLine -.-> geometry_2 : "internal function"
InstancedLine -.-> customRaycast_3 : "internal function"
InstancedLine -.-> material_3 : "internal function"
LODManager -.-> LODManager_2 : "internal function"
LODManager -.-> containersKey : "internal function"
LODManager -.-> computeContainmentSync : "calculation helper"
LODManager -.-> enqueueLODUpdates : "update helper"
LineUI -.-> getFullStyle : "getter function"
LineUI -.-> getBaseStyle : "getter function"
LineUI -.-> handleToolClick_2 : "event handler"
LineUI -.-> handleLineStyleClick : "event handler"
LineUI -.-> handleArrowClick : "event handler"
ModelObject -.-> createLoaders : "internal function"
ModelObject -.-> handleClick_15 : "event handler"
ModelObject -.-> handlePointerDown_2 : "event handler"
ModelObject -.-> handlePointerUp_2 : "event handler"
ObjectRenderer -.-> onClickStable : "internal function"
ObjectRenderer -.-> onDeleteStable : "internal function"
ObjectRenderer -.-> onTransformStartStable : "internal function"
ObjectRenderer -.-> onTransformEndStable : "internal function"
ObjectRenderer -.-> onMatrixChangedStable : "internal function"
ObjectRenderer -.-> onMoveStable : "internal function"
ObjectRenderer -.-> arraysEqual_2 : "internal function"
ObjectSearch -.-> getDisplayName : "getter function"
ObjectSearch -.-> matchesQuery : "internal function"
ObjectSearch -.-> lookAtObject : "internal function"
ObjectSearch -.-> results : "internal function"
ObjectSearch -.-> handleClickOutside : "event handler"
ObjectSearch -.-> handleEsc : "event handler"
ObjectSearch -.-> handleInputChange : "event handler"
ObjectSearch -.-> handleFocus_3 : "event handler"
ObjectSearch -.-> handleEyeClick : "event handler"
ObjectUI -.-> handleEyeClick_2 : "event handler"
ObjectUI -.-> handleColorPick : "event handler"
ObjectUI -.-> handleToolClick_3 : "event handler"
ObjectsRenderer -.-> getProgressiveBudget : "getter function"
ObjectsRenderer -.-> mountNextBatch_2 : "internal function"
ObjectsRenderer -.-> mountResume : "internal function"
ObjectsRenderer -.-> progressiveVisibleObjects : "boolean check"
ObjectsRenderer -.-> cubeObjects : "internal function"
ObjectsRenderer -.-> containerHeaders : "internal function"
ObjectsRenderer -.-> dodecahedronObjects : "internal function"
ObjectsRenderer -.-> tetrahedronObjects : "internal function"
ObjectsRenderer -.-> octahedronObjects : "internal function"
ObjectsRenderer -.-> unmodifiedCubeIds : "internal function"
ObjectsRenderer -.-> handleInstancedCubeClick : "event handler"
ObjectsRenderer -.-> renderedObjects : "render helper"
Octahedron -.-> _createTriangleGeometry : "internal function"
Octahedron -.-> getFaceIndicatorProps : "getter function"
Octahedron -.-> octahedronFaces : "internal function"
Octahedron -.-> debouncedUpdate_2 : "update helper"
Octahedron -.-> isIndicatorConnected_3 : "boolean check"
Octahedron -.-> isIndicatorActive_2 : "boolean check"
Octahedron -.-> getUIPositions_2 : "getter function"
Octahedron -.-> shouldShowIndicator_2 : "boolean check"
Octahedron -.-> hasConnectedIndicators_2 : "internal function"
Octahedron -.-> octahedronEdgePoints : "internal function"
Octahedron -.-> handleSceneClick_2 : "event handler"
Octahedron -.-> updateDatabase_3 : "update helper"
Octahedron -.-> handleFaceClick_4 : "event handler"
Octahedron -.-> handleColoredFaceClick_2 : "event handler"
Octahedron -.-> handleIndicatorClick_3 : "event handler"
Octahedron -.-> handleTransformToggle_3 : "event handler"
Octahedron -.-> handleResizeToggle_3 : "event handler"
Octahedron -.-> handleHeaderToggle_3 : "event handler"
Octahedron -.-> handleHeaderSubmit_3 : "event handler"
Octahedron -.-> handleLineColorChange_4 : "event handler"
Octahedron -.-> handleDrag_3 : "event handler"
Octahedron -.-> handleScale_3 : "event handler"
Octahedron -.-> getFaceTextOffset_2 : "getter function"
Octahedron -.-> handleFaceTextStyleClick_2 : "event handler"
Octahedron -.-> handleFaceTextStyleChange_2 : "event handler"
Octahedron -.-> renderFaceTexts_2 : "render helper"
Octahedron -.-> renderFaces_2 : "render helper"
OctahedronFace -.-> getOctahedronColoredMaterial : "getter function"
OctahedronFace -.-> faceMaterial_3 : "internal function"
OctahedronFace -.-> handleClick_16 : "event handler"
OctahedronFace -.-> handleIndicatorClickLocal : "event handler"
OctahedronFace -.-> getFaceTextOffset_3 : "getter function"
OctahedronFace -.-> handleFaceTextStyleClick_3 : "event handler"
OctahedronFace -.-> handleFaceTextStyleChange_3 : "event handler"
OctahedronFace -.-> faceTextElement : "internal function"
DiffView -.-> computeDiffLines : "calculation helper"
DiffView -.-> handlePush : "event handler"
Plane -.-> planeData : "internal function"
Plane -.-> closeAllUIs : "boolean check"
Plane -.-> updateDatabase_4 : "update helper"
Plane -.-> handleScale_4 : "event handler"
Plane -.-> handleResizeEnd : "event handler"
Plane -.-> handleDrag_4 : "event handler"
Plane -.-> handleTransformStart : "event handler"
Plane -.-> handleTransformEnd : "event handler"
Plane -.-> handleClick_17 : "event handler"
Plane -.-> handleTextClick_3 : "event handler"
Plane -.-> handleTextSubmit : "event handler"
Plane -.-> handleTextStyleChange : "event handler"
Plane -.-> handleTextSpriteClick : "event handler"
Plane -.-> handleTransformToggle_4 : "event handler"
Plane -.-> handleResizeToggle_4 : "event handler"
Plane -.-> handleColorChange_2 : "event handler"
Plane -.-> handleHeaderToggle_4 : "event handler"
Plane -.-> handleHeaderSubmit_4 : "event handler"
Plane -.-> handleHeaderTextClick : "event handler"
Plane -.-> handleHeaderStyleChange : "event handler"
Plane -.-> handleBorderToggle : "event handler"
Plane -.-> handleIndicatorClick_4 : "event handler"
Plane -.-> isIndicatorConnected_4 : "boolean check"
Plane -.-> shouldShowIndicator_3 : "boolean check"
Plane -.-> handleBroadcastStopped : "event handler"
Plane -.-> applyStreamScale : "internal function"
Plane -.-> restoreStreamScale : "internal function"
Plane -.-> handleWebcamToggle : "event handler"
Plane -.-> handleScreenShareToggle : "event handler"
Plane -.-> handlePinToggle : "event handler"
Plane -.-> handleImageUpload : "event handler"
Plane -.-> handleBroadcastStarted : "event handler"
Plane -.-> handleViewerCountChange : "event handler"
Plane -.-> uiPositions : "internal function"
Plane -.-> indicatorPosition : "internal function"
Plane -.-> meshMaterial : "internal function"
Plane -.-> lineMaterialProps : "internal function"
Plane -.-> borderEdgePoints : "internal function"
RealTimeConnectionUpdater -.-> RealTimeConnectionUpdater_2 : "update helper"
RealTimeConnectionUpdater -.-> runConnectionUpdate : "update helper"
RealTimeConnectionUpdater -.-> updateConnectionEndpoint : "update helper"
RealTimeConnectionUpdater -.-> rebuildConnectionMap : "internal function"
TreeRow -.-> toggleGroup : "internal function"
TreeRow -.-> markReachable_2 : "internal function"
TreeRow -.-> toggle : "internal function"
TreeRow -.-> visibleRoots : "boolean check"
TreeRow -.-> ancestorOf : "internal function"
TreeRow -.-> ancestorOf_2 : "internal function"
TreeRow -.-> expandAll : "internal function"
TreeRow -.-> collapseAll : "internal function"
RepoGrid -.-> containers : "internal function"
RepoGrid -.-> gridData : "internal function"
ScreenShareStream -.-> attemptPlay : "internal function"
ScreenShareStream -.-> connectToBroadcast : "internal function"
SpaceChat -.-> getGuestId_2 : "getter function"
SpaceChat -.-> senderInitials : "internal function"
SpaceChat -.-> renderMerfolkToScene : "render helper"
SpaceChat -.-> associateCodeWithScene : "internal function"
SpaceChat -.-> loadPersistedMessages : "boolean check"
SpaceChat -.-> persistMessages : "boolean check"
SpaceChat -.-> loadPersistedMode : "boolean check"
SpaceChat -.-> persistMode : "boolean check"
SpaceChat -.-> handleMove : "event handler"
SpaceChat -.-> handleUp : "event handler"
SpaceChat -.-> handleResizeStart : "event handler"
SpaceChat -.-> handleObjectsCleared : "event handler"
SpaceChat -.-> handleScroll : "event handler"
SpaceChat -.-> handleSend : "event handler"
SpaceChat -.-> handlePlanSend : "event handler"
SpaceChat -.-> handleCodeSend : "event handler"
SpaceChat -.-> handleKeyDown_4 : "event handler"
SpaceChat -.-> handleModeSwitch : "event handler"
SpaceChat -.-> handleCreatePlan : "event handler"
SpaceChat -.-> handlePlanSelect : "event handler"
SpaceChat -.-> handleStop : "event handler"
SpaceChat -.-> handleTechStackSubmit : "event handler"
SpaceChat -.-> handleApiKeySubmit : "event handler"
SpaceChat -.-> handleManualModelSubmit : "event handler"
SpaceChat -.-> handleModelSelect : "event handler"
SpaceChat -.-> handleModelButtonClick : "event handler"
SpaceChat -.-> handleGithubLogin : "event handler"
SpaceChat -.-> handleFetchRepos : "event handler"
SpaceChat -.-> handleSelectRepo : "event handler"
SpaceChat -.-> scanRepoForDiagram : "internal function"
SpaceChat -.-> applyContext : "internal function"
SpaceChat -.-> waitForMount : "internal function"
SpaceChat -.-> applyContext_2 : "internal function"
SpaceChat -.-> waitForMount_2 : "internal function"
SpaceChat -.-> handleCreateNewRepo : "event handler"
SpaceChat -.-> handleBranchConfirm : "event handler"
SpaceChat -.-> getInputPlaceholder : "getter function"
SpaceChat -.-> getSendButtonLabel : "getter function"
Avatar -.-> getInitials : "getter function"
Avatar -.-> handleClick_18 : "event handler"
Tetrahedron -.-> tetrahedronFaces : "internal function"
Tetrahedron -.-> debouncedUpdate_3 : "update helper"
Tetrahedron -.-> isIndicatorConnected_5 : "boolean check"
Tetrahedron -.-> isIndicatorActive_3 : "boolean check"
Tetrahedron -.-> getUIPositions_3 : "getter function"
Tetrahedron -.-> shouldShowIndicator_4 : "boolean check"
Tetrahedron -.-> hasConnectedIndicators_3 : "internal function"
Tetrahedron -.-> tetrahedronEdgePoints : "internal function"
Tetrahedron -.-> handleSceneClick_3 : "event handler"
Tetrahedron -.-> updateDatabase_5 : "update helper"
Tetrahedron -.-> handleFaceClick_5 : "event handler"
Tetrahedron -.-> handleColoredFaceClick_3 : "event handler"
Tetrahedron -.-> handleIndicatorClick_5 : "event handler"
Tetrahedron -.-> handleTransformToggle_5 : "event handler"
Tetrahedron -.-> handleResizeToggle_5 : "event handler"
Tetrahedron -.-> handleHeaderToggle_5 : "event handler"
Tetrahedron -.-> handleHeaderSubmit_5 : "event handler"
Tetrahedron -.-> handleLineColorChange_5 : "event handler"
Tetrahedron -.-> handleDrag_5 : "event handler"
Tetrahedron -.-> handleScale_5 : "event handler"
Tetrahedron -.-> getFaceTextOffset_4 : "getter function"
Tetrahedron -.-> handleFaceTextStyleClick_4 : "event handler"
Tetrahedron -.-> handleFaceTextStyleChange_4 : "event handler"
Tetrahedron -.-> renderFaceTexts_3 : "render helper"
Tetrahedron -.-> renderFaces_3 : "render helper"
TetrahedronFace -.-> getTetrahedronColoredMaterial : "getter function"
TetrahedronFace -.-> faceMaterial_4 : "internal function"
TetrahedronFace -.-> handleClick_19 : "event handler"
TetrahedronFace -.-> handleIndicatorClickLocal_2 : "event handler"
TetrahedronFace -.-> getFaceTextOffset_5 : "getter function"
TetrahedronFace -.-> handleFaceTextStyleClick_5 : "event handler"
TetrahedronFace -.-> handleFaceTextStyleChange_5 : "event handler"
TetrahedronFace -.-> faceTextElement_2 : "internal function"
TextObject -.-> text : "internal function"
TextObject -.-> textStyle : "internal function"
TextObject -.-> scale : "internal function"
TextObject -.-> setOrbitControlsEnabled : "setter function"
TextObject -.-> setText : "setter function"
TextObject -.-> setTextStyle : "setter function"
TextObject -.-> setScale : "setter function"
TextObject -.-> setIsEditing : "setter function"
TextObject -.-> setIsActivelyEditing : "setter function"
TextObject -.-> setIndicatorSelected : "setter function"
TextObject -.-> setContentHeight : "setter function"
TextObject -.-> setShowTransform : "setter function"
TextObject -.-> setShowResizeControls : "setter function"
TextObject -.-> setBulletPointMode : "setter function"
TextObject -.-> handleTransformToggle_6 : "event handler"
TextObject -.-> handleResizeToggle_6 : "event handler"
TextObject -.-> getIndicatorOffset : "getter function"
TextObject -.-> isIndicatorConnected_6 : "boolean check"
TextObject -.-> shouldShowIndicator_5 : "boolean check"
TextObject -.-> getIndicatorPositions : "getter function"
TextObject -.-> updateWorldMatrix : "update helper"
TextObject -.-> closeAllUIs_2 : "boolean check"
TextObject -.-> updateDatabase_6 : "update helper"
TextObject -.-> autoResizeTextAreaOnly : "internal function"
TextObject -.-> autoResizeTextArea : "internal function"
TextObject -.-> handleBlur_3 : "event handler"
TextObject -.-> handleDivClick : "event handler"
TextObject -.-> handleTextClick_4 : "event handler"
TextObject -.-> handleIndicatorClick_6 : "event handler"
TextObject -.-> handleDrag_6 : "event handler"
TextObject -.-> handleScale_6 : "event handler"
TextObject -.-> handleKeyDown_5 : "event handler"
TextObject -.-> handleStyleChange_3 : "event handler"
TextObject -.-> applyStyleToSelectionInternal : "internal function"
TextObject -.-> applyStyleToSelectionInternal_2 : "internal function"
TextObject -.-> handleTextSelection : "event handler"
TextObject -.-> getTextAreaStyle : "getter function"
TextObject -.-> getContainerStyle : "getter function"
TextObject -.-> getEffectivePosition : "getter function"
TextObject -.-> getTransformControlSize : "getter function"
TextObjectUI -.-> handleUIClick : "event handler"
TextObjectUI -.-> handleResizeToggle_7 : "event handler"
TextObjectUI -.-> handleEyeClick_3 : "event handler"
TextSprite -.-> lerpVector : "internal function"
TextSprite -.-> spriteId : "internal function"
TextSprite -.-> setIsDragging : "setter function"
TextSprite -.-> calculatedPosition_2 : "calculation helper"
TextSprite -.-> getFontSize : "getter function"
TextStyleUIContent -.-> handleSizeChange : "event handler"
TextStyleUIContent -.-> handleFontSizeInputChange : "event handler"
TextStyleUIContent -.-> handleWheel : "event handler"
TextStyleUIContent -.-> handleButtonClick : "event handler"
TextStyleUIContent -.-> handleColorSelect_2 : "event handler"
TextStyleUIContent -.-> handleSelectChange : "event handler"
TextStyleUIContent -.-> getUIScale : "getter function"
EarthSidebarSections -.-> pipelineTasks : "internal function"
EarthSidebarSections -.-> pipelineStatusCounts : "internal function"
EarthSidebarSections -.-> setIsRecording : "setter function"
EarthSidebarSections -.-> handleCellBoundariesToggle : "event handler"
EarthSidebarSections -.-> fetchRepositories_2 : "internal function"
EarthSidebarSections -.-> fetchAppJsxFromRepo : "internal function"
EarthSidebarSections -.-> handleRescan : "event handler"
EarthSidebarSections -.-> handleDownloadMarkdown : "event handler"
EarthSidebarSections -.-> triggerDownload : "internal function"
EarthSidebarSections -.-> triggerDownload_2 : "internal function"
EarthSidebarSections -.-> handleScreenClick : "event handler"
EarthSidebarSections -.-> handleRuntimeScan : "event handler"
EarthSidebarSections -.-> handleRecordClick : "event handler"
EarthSidebarSections -.-> handleFormatSelect : "event handler"
EarthSidebarSections -.-> handleCancelPrompt : "event handler"
EarthSidebarSections -.-> handler : "event handler"
EarthSidebarSections -.-> handleDeleteAllCells : "event handler"
EarthSidebarSections -.-> handleModelUpload : "event handler"
EarthSidebarSections -.-> handleModelFileSelect : "event handler"
EarthSidebarSections -.-> handleMarkdownUpload : "event handler"
EarthSidebarSections -.-> handleMarkdownFileSelect : "event handler"
EarthSidebarSections -.-> handleCsvUpload : "event handler"
EarthSidebarSections -.-> handleCsvFileSelect : "event handler"
EarthSidebarSections -.-> handleMenuToggle : "event handler"
EarthSidebarSections -.-> handleArrowClick_2 : "event handler"
EarthSidebarSections -.-> handleUnpinWebcam : "event handler"
EarthSidebarSections -.-> handleTemplateConfigChange : "event handler"
EarthSidebarSections -.-> createTemplate : "internal function"
WebcamStream -.-> applyVideoTexture : "internal function"
WebcamStream -.-> attemptPlay_2 : "internal function"
WebcamStream -.-> connectToBroadcast_2 : "internal function"
MerfolkEdge -.-> flowPathColor : "internal function"
MerfolkEdge -.-> getEdgeStyle : "getter function"
MerfolkEdge -.-> getMarkerEnd : "getter function"
MerfolkEdge -.-> getSelectedStyle : "getter function"
MerfolkEdge -.-> getUnselectedStyle : "getter function"
MerfolkNode -.-> buildNodeStyles : "internal function"
MerfolkNode -.-> buildContainerStyles : "internal function"
MerfolkNode -.-> buildPrecomputedNode : "calculation helper"
DodecahedronWireframe -.-> generateDodecahedronEdges : "internal function"
FakeGlowMaterial -.-> FakeGlowMaterial_2 : "internal function"
LandingApp -.-> scheduleScrollUpdate : "update helper"
LandingApp -.-> handleWheel_2 : "event handler"
LandingApp -.-> handleTouchStart : "event handler"
LandingApp -.-> handleTouchMove : "event handler"
LandingApp -.-> handleLogin_2 : "event handler"
LandingApp -.-> handleLogout : "event handler"
LandingApp -.-> navigateToSpace : "internal function"
LandingApp -.-> fetchUserSpaces : "internal function"
LandingApp -.-> createNewSpace : "internal function"
LandingApp -.-> handleShareSpace : "event handler"
LandingApp -.-> handleDeleteSpace : "event handler"
LandingApp -.-> handleLeaveSpace : "event handler"
LandingApp -.-> handleAcceptInvite : "event handler"
LandingApp -.-> handleDeclineInvite : "event handler"
LandingApp -.-> spaceTableProps : "internal function"
LandingApp -.-> createSpaceProps : "internal function"
LandingApp -.-> sharePopupProps : "internal function"
PerspectiveGrid -.-> idx : "internal function"
PerspectiveGrid -.-> addEdge : "internal function"
UpdatesEditor -.-> handleKeyCommand : "event handler"
UpdatesEditor -.-> toggleInlineStyle : "internal function"
UpdatesEditor -.-> handleSave : "event handler"
UpdatesViewer -.-> parsedContent : "internal function"
UpdatesViewer -.-> formattedTimestamp : "internal function"
CreateOrganizationPopup -.-> handleKeyPress : "event handler"
CreateOrganizationPopup -.-> handleSubmit : "event handler"
CreateSpacePopup -.-> handleSpaceNameChange : "event handler"
CreateSpacePopup -.-> handleEmailChange : "event handler"
CreateSpacePopup -.-> handleMemberSelect : "event handler"
CreateSpacePopup -.-> handleKeyPress_2 : "event handler"
CreateSpacePopup -.-> handleSubmit_2 : "event handler"
DodecahedronWireframe2 -.-> generateDodecahedronEdges_2 : "internal function"
SectionEyebrow -.-> clamp01 : "internal function"
SectionEyebrow -.-> getSectionVisibility : "getter function"
LandingTopBar -.-> handleClickOutside_2 : "event handler"
OrgMemberDropdown -.-> handleClickOutside_3 : "event handler"
OrgMemberDropdown -.-> handleInputFocus : "event handler"
OrgMemberDropdown -.-> handleInputChange_2 : "event handler"
OrgMemberDropdown -.-> handleSelect : "event handler"
OrganizationManager -.-> refresh : "internal function"
OrganizationManager -.-> handleCreateOrg : "event handler"
OrganizationManager -.-> handleInvite : "event handler"
OrganizationManager -.-> handleRemoveMember : "event handler"
OrganizationManager -.-> handleLeave : "event handler"
OrganizationManager -.-> handleUpgradePlan : "event handler"
OrganizationManager -.-> handleDeleteOrg : "event handler"
OrganizationManager -.-> handleAcceptInvite_2 : "event handler"
OrganizationManager -.-> handleDeclineInvite_2 : "event handler"
ShareSpacePopup -.-> stringToColor : "internal function"
ShareSpacePopup -.-> filteredMembers : "internal function"
ShareSpacePopup -.-> toggleMember : "internal function"
ShareSpacePopup -.-> handleShare : "event handler"
SpacesTable -.-> handleSpaceClick : "event handler"
SpacesTable -.-> thStyles : "internal function"
SpacesTable -.-> tdStyles : "internal function"
SpacesTable -.-> categoryRowStyles : "internal function"
SpacesTable -.-> inviteBannerStyle : "internal function"

%% File Container Nodes
backend_llm((Service: llm))
backend_objects((Service: objects))
backend_middleware((Service: middleware))
backend_index((Service: index))
backend_migrate((Service: migrate))
backend_chat((Service: chat))
backend_signaling((Service: signaling))
api_client[Function: api_client]
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
useWindowSize_file[Hook: useWindowSize]
sharedSpacesService[Function: sharedSpacesService]
authService((Service: authService))
cellObjectCache((Service: cellObjectCache))
centralizedBroadcastManager_file((Service: centralizedBroadcastManager))
codeExtractor((Service: codeExtractor))
connectionPositionResolver((Service: connectionPositionResolver))
connectionsService((Service: connectionsService))
base64Store((Service: base64Store))
chunkIndex((Service: chunkIndex))
contentStore((Service: contentStore))
contextBuilder((Service: contextBuilder))
conversationSummarizer((Service: conversationSummarizer))
retrievalOrchestrator((Service: retrievalOrchestrator))
retrievalProtocol((Service: retrievalProtocol))
summarizer((Service: summarizer))
tokenEstimator((Service: tokenEstimator))
toolExecutor((Service: toolExecutor))
csvDiagramService((Service: csvDiagramService))
githubIssuesService((Service: githubIssuesService))
githubPushService((Service: githubPushService))
githubRepoService((Service: githubRepoService))
globalOptimizationCoordinator_file((Service: globalOptimizationCoordinator))
globalSubscriptionManager((Service: globalSubscriptionManager))
anchors((Service: anchors))
imageOps((Service: imageOps))
palmDecode((Service: palmDecode))
handTrackingService((Service: handTrackingService))
llmProviders((Service: llmProviders))
connectionMethods((Service: connectionMethods))
constants((Service: constants))
containerMethods((Service: containerMethods))
hierarchyMethods((Service: hierarchyMethods))
objectMethods((Service: objectMethods))
positionMethods((Service: positionMethods))
processMethods((Service: processMethods))
markdownDiagramService_file((Service: markdownDiagramService))
merfolkExtractor((Service: merfolkExtractor))
organizationService((Service: organizationService))
pipelineOrchestrator((Service: pipelineOrchestrator))
pipelineTaskService((Service: pipelineTaskService))
planService((Service: planService))
presenceService((Service: presenceService))
repoContainerService((Service: repoContainerService))
resourceCleanupService_file((Service: resourceCleanupService))
runtimeScanService((Service: runtimeScanService))
screenRecordingService((Service: screenRecordingService))
sharingService((Service: sharingService))
spaceDataChannel((Service: spaceDataChannel))
spacesService((Service: spacesService))
spatialObjectsService((Service: spatialObjectsService))
spatialPartitioning((Service: spatialPartitioning))
storageService((Service: storageService))
streamlinedSpatialPartitioning((Service: streamlinedSpatialPartitioning))
unifiedCacheManager_file((Service: unifiedCacheManager))
webRservice((Service: webRservice))
zenService((Service: zenService))
shader_shaders[Function: shaders]
animatedConnectionLineStore[[Store: animatedConnectionLineStore]]
authStore[[Store: authStore]]
codeStore[[Store: codeStore]]
colorPickerStore[[Store: colorPickerStore]]
connectionStore[[Store: connectionStore]]
contentIndexStore[[Store: contentIndexStore]]
cubeStore[[Store: cubeStore]]
diagramStore[[Store: diagramStore]]
dodecahedronStore[[Store: dodecahedronStore]]
earthSettingsStore[[Store: earthSettingsStore]]
faceIndicatorStore[[Store: faceIndicatorStore]]
faceStore[[Store: faceStore]]
handTrackingStore[[Store: handTrackingStore]]
indicatorsStore[[Store: indicatorsStore]]
llmStore[[Store: llmStore]]
lodStore[[Store: lodStore]]
objectsStore[[Store: objectsStore]]
octahedronStore[[Store: octahedronStore]]
pipelineStore[[Store: pipelineStore]]
planeStore[[Store: planeStore]]
publicSpaceStore[[Store: publicSpaceStore]]
sceneStore[[Store: sceneStore]]
screenShareStore[[Store: screenShareStore]]
spaceManagerStore[[Store: spaceManagerStore]]
spatialManagerStore[[Store: spatialManagerStore]]
storeUtils[[Store: storeUtils]]
tetrahedronStore[[Store: tetrahedronStore]]
textAtlasStore[[Store: textAtlasStore]]
textInputStore[[Store: textInputStore]]
textObjectStore[[Store: textObjectStore]]
transformControlsStore[[Store: transformControlsStore]]
uiOverlayStore[[Store: uiOverlayStore]]
webcamStreamStore[[Store: webcamStreamStore]]
animationUtils[Function: animationUtils]
bvhRaycasting[Function: bvhRaycasting]
connectionUtils[Function: connectionUtils]
debugUtils[Function: debugUtils]
earthHeightmapLoader[Function: earthHeightmapLoader]
earthTerrainGenerator[Function: earthTerrainGenerator]
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
terrainTileCache[Function: terrainTileCache]
textAtlas[Function: textAtlas]
textureLoader[Function: textureLoader]
unifiedPerformanceUtils[Function: unifiedPerformanceUtils]
unifiedValidationUtils[Function: unifiedValidationUtils]
wasmKernels[Function: wasmKernels]
worker_hoverchart_wasm[Function: hoverchart_wasm]
worker_lib_rs[Function: lib_rs]
worker_contentStoreWorkerClient[Function: contentStoreWorkerClient]
worker_diagramLayoutWorker[Function: diagramLayoutWorker]
worker_diagramLayoutWorkerClient[Function: diagramLayoutWorkerClient]
worker_handTrackingWorker[Function: handTrackingWorker]
worker_handTrackingWorkerClient[Function: handTrackingWorkerClient]
worker_markdownLayoutWorker[Function: markdownLayoutWorker]
worker_markdownLayoutWorkerClient[Function: markdownLayoutWorkerClient]
worker_pathfindingWorkerClient[Function: pathfindingWorkerClient]
worker_spatialIndexWorker[Function: spatialIndexWorker]
worker_spatialIndexWorkerClient[Function: spatialIndexWorkerClient]
worker_textAtlasWorker[Function: textAtlasWorker]
worker_textAtlasWorkerClient[Function: textAtlasWorkerClient]
worker_treeSitterScannerWorker[Function: treeSitterScannerWorker]
worker_treeSitterScannerWorkerClient[Function: treeSitterScannerWorkerClient]

%% File-Function Relationships
backend_llm -.-> isAllowed : "contains"
backend_llm -.-> u : "contains"
backend_llm -.-> timeoutController : "contains"
backend_llm -.-> decoder : "contains"
backend_llm -.-> resetPumpWatchdog : "contains"
backend_llm -.-> pump : "contains"
backend_objects -.-> toCamel : "contains"
backend_objects -.-> normalize : "contains"
backend_middleware -.-> authenticate : "contains"
backend_middleware -.-> optionalAuth : "contains"
backend_index -.-> start : "contains"
backend_index -.-> createWSServer : "contains"
backend_index -.-> io : "contains"
backend_index -.-> sanitizeNodeId : "contains"
backend_index -.-> isPrivate : "contains"
backend_index -.-> isDunder : "contains"
backend_index -.-> resolveContainerType : "contains"
backend_index -.-> scanWithTreeSitter : "contains"
backend_index -.-> ensureContainer : "contains"
backend_index -.-> importedNames : "contains"
backend_index -.-> scanPythonWithTreeSitter : "contains"
backend_migrate -.-> runMigrations : "contains"
backend_migrate -.-> appliedNames : "contains"
backend_chat -.-> registerChatHandlers : "contains"
backend_signaling -.-> rooms : "contains"
backend_signaling -.-> registerSignalingHandlers : "contains"
setTokens[Function: setTokens]
api_client -.-> setTokens : "contains"
loadTokens[Function: loadTokens]
api_client -.-> loadTokens : "contains"
clearTokens[Function: clearTokens]
api_client -.-> clearTokens : "contains"
refreshAccessToken[Function: refreshAccessToken]
api_client -.-> refreshAccessToken : "contains"
api[Function: api]
api_client -.-> api : "contains"
makeRequest[Function: makeRequest]
api_client -.-> makeRequest : "contains"
socketCallbacks[Function: socketCallbacks]
api_client -.-> socketCallbacks : "contains"
getSocket[Function: getSocket]
api_client -.-> getSocket : "contains"
connectSocket[Function: connectSocket]
api_client -.-> connectSocket : "contains"
disconnectSocket[Function: disconnectSocket]
api_client -.-> disconnectSocket : "contains"
onSocket[Function: onSocket]
api_client -.-> onSocket : "contains"
emitSocket[Function: emitSocket]
api_client -.-> emitSocket : "contains"
selectAuth[Function: selectAuth]
useAuth_file -.-> selectAuth : "contains"
useAuth_file -.-> useAuth : "contains"
selectAuthState[Function: selectAuthState]
useAuthState_file -.-> selectAuthState : "contains"
useAuthState_file -.-> useAuthState : "contains"
useCentralizedBroadcastManager_file -.-> useCentralizedBroadcastManager : "contains"
ConnectionAnimationManager[Function: ConnectionAnimationManager]
useConnectionAnimationManager -.-> ConnectionAnimationManager : "contains"
useConnectionAnimationManager -.-> useAnimatedLine : "contains"
useConnectionAnimationManager -.-> useAnimationStats : "contains"
objectPositionEqual[Function: objectPositionEqual]
useConnectionObjects_file -.-> objectPositionEqual : "contains"
useConnectionObjects_file -.-> useConnectionObjects : "contains"
useConnectionObjects_file -.-> usePathfindingObjects : "contains"
useConnectionObjects_file -.-> useConnectionObjectPositions : "contains"
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
useConnections_file -.-> handleLineStyleChange : "contains"
useConnections_file -.-> handleLineColorChange : "contains"
useConnections_file -.-> handleConnectionClick : "contains"
useConnections_file -.-> handleLineTextClick : "contains"
useConnections_file -.-> handleLineTextSubmit : "contains"
useConnections_file -.-> handleLineTextStyleChange : "contains"
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
useDebouncedUpdate_file -.-> useDebouncedUpdate : "contains"
useDebouncedUpdate_file -.-> cleanup : "contains"
isPointInFrustum[Function: isPointInFrustum]
useFrustumCulling -.-> isPointInFrustum : "contains"
isConnectionVisible[Function: isConnectionVisible]
useFrustumCulling -.-> isConnectionVisible : "contains"
useFrustumCulling -.-> useFrustumCulledConnections : "contains"
useFrustumCulling -.-> objectPositions : "contains"
visibleConnections[Function: visibleConnections]
useFrustumCulling -.-> visibleConnections : "contains"
useFrustumCulling -.-> useDynamicFrustumCulling : "contains"
useGlobalClickHandler_file -.-> useGlobalClickHandler : "contains"
handleGlobalClick[Function: handleGlobalClick]
useGlobalClickHandler_file -.-> handleGlobalClick : "contains"
useIndicators_file -.-> useIndicators : "contains"
selectObjectsHookState[Function: selectObjectsHookState]
useObjects_file -.-> selectObjectsHookState : "contains"
useObjects_file -.-> useObjects : "contains"
handleCreateObject[Function: handleCreateObject]
useObjects_file -.-> handleCreateObject : "contains"
handleObjectDelete[Function: handleObjectDelete]
useObjects_file -.-> handleObjectDelete : "contains"
registerTransformingObject[Function: registerTransformingObject]
useObjects_file -.-> registerTransformingObject : "contains"
selectSpaceManagerState[Function: selectSpaceManagerState]
useSpaceManager_file -.-> selectSpaceManagerState : "contains"
useSpaceManager_file -.-> useSpaceManager : "contains"
useSpatialManager_file -.-> useSpatialManager : "contains"
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
addSharedSpaceReference[Function: addSharedSpaceReference]
sharedSpacesService -.-> addSharedSpaceReference : "contains"
removeSharedSpaceReference[Function: removeSharedSpaceReference]
sharedSpacesService -.-> removeSharedSpaceReference : "contains"
getSharedSpaces[Function: getSharedSpaces]
sharedSpacesService -.-> getSharedSpaces : "contains"
sharedSpacesService -.-> registerSharedSpaceFromUrl : "contains"
checkSharedSpaceAccess[Function: checkSharedSpaceAccess]
sharedSpacesService -.-> checkSharedSpaceAccess : "contains"
sharedSpacesService -.-> sharedSpacesCache : "contains"
sharedSpacesService -.-> sharedSpacesCacheSet : "contains"
sharedSpacesService -.-> isSharedSpace : "contains"
sharedSpacesService -.-> checkSpaceExists : "contains"
sharedSpacesService -.-> getSpaceOwner : "contains"
sharedSpacesService -.-> findSpaceOwner : "contains"
sharedSpacesService -.-> urlParams : "contains"
authService -.-> signInUser : "contains"
authService -.-> completeRedirectSignIn : "contains"
authService -.-> handlePostLoginRedirect : "contains"
authService -.-> signOut : "contains"
authService -.-> observeAuthState : "contains"
authService -.-> validateAuthToken : "contains"
authService -.-> handleUrlAuth : "contains"
authService -.-> params : "contains"
authService -.-> registerUserPresence : "contains"
cellObjectCache -.-> pendingCellObjects : "contains"
cellObjectCache -.-> allCellObjects : "contains"
cellObjectCache -.-> addPendingCellObjects : "contains"
cellObjectCache -.-> consumePendingCellObjects : "contains"
cellObjectCache -.-> consumePendingCellObjectsForCells : "contains"
cellObjectCache -.-> addToAllCellObjects : "contains"
cellObjectCache -.-> getAllCellObjectsForCells : "contains"
cellObjectCache -.-> hasAnyPendingObjects : "contains"
cellObjectCache -.-> clearAllCellCaches : "contains"
centralizedBroadcastManager_file -.-> dummyUnsubscribe : "contains"
centralizedBroadcastManager_file -.-> centralizedBroadcastManager : "contains"
centralizedBroadcastManager_file -.-> subscribePlaneToBroadcasts : "contains"
centralizedBroadcastManager_file -.-> getBroadcastManagerDebugInfo : "contains"
centralizedBroadcastManager_file -.-> cleanupBroadcastManager : "contains"
codeExtractor -.-> extractCodeBlocks : "contains"
codeExtractor -.-> seenPaths : "contains"
codeExtractor -.-> inferFilePathFromLang : "contains"
codeExtractor -.-> mapLanguage : "contains"
codeExtractor -.-> mapExtension : "contains"
codeExtractor -.-> hasCodeBlocks : "contains"
codeExtractor -.-> stripCodeBlocks : "contains"
codeExtractor -.-> hasSearchReplaceMarkers : "contains"
connectionPositionResolver -.-> resolveConnectionPositions : "contains"
connectionPositionResolver -.-> resolveConnectionEndpoint : "contains"
connectionPositionResolver -.-> connectionNeedsPositionResolution : "contains"
connectionPositionResolver -.-> positionsEqual : "contains"
connectionsService -.-> pauseConnectionListeners : "contains"
connectionsService -.-> resumeConnectionListeners : "contains"
connectionsService -.-> connectionCache : "contains"
connectionsService -.-> clearConnectionCache : "contains"
connectionsService -.-> connectionDataChanged : "contains"
connectionsService -.-> serializeConnection : "contains"
connectionsService -.-> saveConnection : "contains"
connectionsService -.-> subscribeToConnections : "contains"
connectionsService -.-> pollingCache : "contains"
connectionsService -.-> poll : "contains"
connectionsService -.-> seenKeys : "contains"
connectionsService -.-> deleteConnection : "contains"
connectionsService -.-> deleteConnectionEnhanced : "contains"
base64Store -.-> getBase64Store : "contains"
chunkIndex -.-> STOP_WORDS : "contains"
chunkIndex -.-> extractKeywords : "contains"
chunkIndex -.-> chunkText : "contains"
contentStore -.-> scores : "contains"
contentStore -.-> getContentStore : "contains"
contextBuilder -.-> buildContext : "contains"
contextBuilder -.-> trimMessagesToFit : "contains"
conversationSummarizer -.-> fitConversationWithSummarization : "contains"
conversationSummarizer -.-> truncateFromFront : "contains"
retrievalOrchestrator -.-> estimateMessagesSize : "contains"
retrievalOrchestrator -.-> collectFileContents : "contains"
retrievalOrchestrator -.-> trimMessages : "contains"
retrievalOrchestrator -.-> searchResultIndices : "contains"
retrievalOrchestrator -.-> toRemoveSet : "contains"
retrievalOrchestrator -.-> hasCodeBlocks : "contains"
retrievalOrchestrator -.-> isUsefulToolResult : "contains"
retrievalOrchestrator -.-> readKey : "contains"
retrievalOrchestrator -.-> sendWithRetrieval : "contains"
retrievalOrchestrator -.-> readFiles : "contains"
retrievalOrchestrator -.-> toolCallHistory : "contains"
retrievalOrchestrator -.-> readFilesBefore : "contains"
retrievalProtocol -.-> isGithubFileRequest : "contains"
retrievalProtocol -.-> extractGithubPath : "contains"
retrievalProtocol -.-> detectRetrievalRequest : "contains"
retrievalProtocol -.-> stripRetrievalMarkers : "contains"
retrievalProtocol -.-> buildRetrievalInjection : "contains"
summarizer -.-> summarizeText : "contains"
tokenEstimator -.-> CODE_CHARS : "contains"
tokenEstimator -.-> estimateTokens : "contains"
tokenEstimator -.-> estimateMessageTokens : "contains"
tokenEstimator -.-> estimateMessagesTokens : "contains"
tokenEstimator -.-> getContextWindow : "contains"
toolExecutor -.-> withTimeout : "contains"
toolExecutor -.-> executeTool : "contains"
toolExecutor -.-> seen : "contains"
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
githubIssuesService -.-> getRepoTree : "contains"
githubIssuesService -.-> createFileOnBranch : "contains"
githubIssuesService -.-> createTree : "contains"
githubIssuesService -.-> createCommit : "contains"
githubIssuesService -.-> updateRef : "contains"
githubIssuesService -.-> multiFileCommit : "contains"
githubIssuesService -.-> createPullRequest : "contains"
githubIssuesService -.-> addComment : "contains"
githubIssuesService -.-> enableAutoMerge : "contains"
githubIssuesService -.-> revertCommit : "contains"
githubPushService -.-> applySearchReplace : "contains"
githubPushService -.-> pushCodeToGitHub : "contains"
githubPushService -.-> connectRepo : "contains"
githubPushService -.-> listBranches : "contains"
githubPushService -.-> switchBranch : "contains"
githubPushService -.-> createNewBranch : "contains"
githubRepoService -.-> sleep : "contains"
githubRepoService -.-> fetchWithRetry : "contains"
githubRepoService -.-> getTreeSitterLanguage : "contains"
githubRepoService -.-> exchangeGithubCode : "contains"
githubRepoService -.-> fetchRepositories_2 : "contains"
githubRepoService -.-> fetchFileContent : "contains"
githubRepoService -.-> fetchTimeout : "contains"
githubRepoService -.-> c : "contains"
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
githubRepoService -.-> funcIdCounters : "contains"
githubRepoService -.-> allocateFuncId : "contains"
githubRepoService -.-> componentRelationships : "contains"
githubRepoService -.-> componentToFile : "contains"
githubRepoService -.-> componentImportSources : "contains"
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
githubRepoService -.-> dbModelUsers : "contains"
githubRepoService -.-> authGuards : "contains"
githubRepoService -.-> eventEmitters : "contains"
githubRepoService -.-> eventListeners : "contains"
githubRepoService -.-> errorBoundaries : "contains"
githubRepoService -.-> suspenseBoundaries : "contains"
githubRepoService -.-> sharedInterfaces : "contains"
githubRepoService -.-> interfaceUsages : "contains"
githubRepoService -.-> processSingleFile : "contains"
githubRepoService -.-> traversedBodies : "contains"
githubRepoService -.-> traverse : "contains"
githubRepoService -.-> isMiddlewareParams : "contains"
githubRepoService -.-> fetchWorker : "contains"
githubRepoService -.-> knownContainers : "contains"
githubRepoService -.-> componentsSetForResolve : "contains"
githubRepoService -.-> fileToComponent : "contains"
githubRepoService -.-> generateMerfolkMarkdown : "contains"
githubRepoService -.-> ENTRY_POINT_COMPONENT_NAMES : "contains"
githubRepoService -.-> isValidComponentName : "contains"
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
githubRepoService -.-> renamedIds : "contains"
githubRepoService -.-> uniqueNodeId : "contains"
githubRepoService -.-> childToParentMap : "contains"
githubRepoService -.-> allSymbolNames : "contains"
githubRepoService -.-> generateRoutedConnection : "contains"
githubRepoService -.-> resolveId : "contains"
githubRepoService -.-> allComponentFunctions : "contains"
githubRepoService -.-> resolveRouteNodeId : "contains"
githubRepoService -.-> routeGroups : "contains"
githubRepoService -.-> routeRepresentative : "contains"
githubRepoService -.-> modelResolve : "contains"
githubRepoService -.-> resolveNodeId : "contains"
githubRepoService -.-> allEventNames : "contains"
githubRepoService -.-> eventResolve : "contains"
githubRepoService -.-> ifaceOnlyContainers : "contains"
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
githubRepoService -.-> localIds : "contains"
githubRepoService -.-> deduplicateMerfolkNodes : "contains"
githubRepoService -.-> seenIds : "contains"
githubRepoService -.-> mergeMerfolkMarkdown : "contains"
githubRepoService -.-> extractContent : "contains"
githubRepoService -.-> rescanRepositoryForChanges : "contains"
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
globalSubscriptionManager -.-> globalSubscriptions : "contains"
globalSubscriptionManager -.-> getOrCreateSubscription : "contains"
globalSubscriptionManager -.-> decrementSubscription : "contains"
globalSubscriptionManager -.-> forceCleanupSubscription : "contains"
globalSubscriptionManager -.-> getSubscriptionMetrics : "contains"
globalSubscriptionManager -.-> cleanupAllSubscriptions : "contains"
globalSubscriptionManager -.-> periodicCleanup : "contains"
anchors -.-> getAnchors : "contains"
imageOps -.-> imageDataToTensor : "contains"
imageOps -.-> letterboxToImageData : "contains"
imageOps -.-> extractRotatedRoi : "contains"
imageOps -.-> roiToImage : "contains"
palmDecode -.-> sigmoid : "contains"
palmDecode -.-> decodePalmDetections : "contains"
palmDecode -.-> kps : "contains"
palmDecode -.-> iou : "contains"
palmDecode -.-> detectionToRoi : "contains"
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
llmProviders -.-> sanitizeMessages : "contains"
llmProviders -.-> getProvider : "contains"
llmProviders -.-> fetchModels : "contains"
llmProviders -.-> sendToProvider : "contains"
llmProviders -.-> timeoutController : "contains"
llmProviders -.-> decoder : "contains"
llmProviders -.-> toolCallsMap : "contains"
llmProviders -.-> resetStreamWatchdog : "contains"
connectionMethods -.-> connectionTags : "contains"
connectionMethods -.-> addTag : "contains"
connectionMethods -.-> existingConnectionPairs : "contains"
connectionMethods -.-> objectsById : "contains"
connectionMethods -.-> getFaceForObject : "contains"
connectionMethods -.-> computeFaceWorldPosition : "contains"
connectionMethods -.-> calculateDodecahedronFaceCenter : "contains"
connectionMethods -.-> deriveCellCoords : "contains"
connectionMethods -.-> sendChunk : "contains"
connectionMethods -.-> connectionsByCell : "contains"
constants -.-> getGroupDisplayName : "contains"
constants -.-> getGroupColor : "contains"
containerMethods -.-> hierarchyComponents : "contains"
containerMethods -.-> markHierarchyReachable : "contains"
containerMethods -.-> groupedByType : "contains"
containerMethods -.-> createContainerForGroup : "contains"
containerMethods -.-> existingGroupTypes : "contains"
containerMethods -.-> reachableFromRootModules : "contains"
containerMethods -.-> markReachable_2 : "contains"
containerMethods -.-> nodesWithContainers : "contains"
containerMethods -.-> visited : "contains"
containerMethods -.-> adjustNodeAndDescendants : "contains"
containerMethods -.-> containerDimensions : "contains"
containerMethods -.-> containerEligibleTypes : "contains"
containerMethods -.-> existingParentNodeIds : "contains"
hierarchyMethods -.-> parentChildMap : "contains"
hierarchyMethods -.-> childParentMap : "contains"
hierarchyMethods -.-> rootNodes : "contains"
hierarchyMethods -.-> internalComponentChildren : "contains"
hierarchyMethods -.-> componentConnectionTypes : "contains"
hierarchyMethods -.-> cycleCache : "contains"
hierarchyMethods -.-> wouldCreateCycle : "contains"
hierarchyMethods -.-> visited : "contains"
hierarchyMethods -.-> dfs : "contains"
hierarchyMethods -.-> warnedCycles : "contains"
hierarchyMethods -.-> addParentChildRelation : "contains"
hierarchyMethods -.-> isCubeChild : "contains"
hierarchyMethods -.-> isContainerType : "contains"
objectMethods -.-> processedNodes : "contains"
objectMethods -.-> existingNodeIdMap : "contains"
objectMethods -.-> positionUpdates : "contains"
objectMethods -.-> calculateHeaderStyle : "contains"
objectMethods -.-> byCell : "contains"
positionMethods -.-> moveComponentTree : "contains"
positionMethods -.-> getComponentChildren : "contains"
positionMethods -.-> checkOverlap : "contains"
positionMethods -.-> containersByLevel : "contains"
positionMethods -.-> collectAllDescendants : "contains"
positionMethods -.-> allDescendants : "contains"
positionMethods -.-> resolveNodeMove : "contains"
positionMethods -.-> reachableFromRootModules : "contains"
positionMethods -.-> markReachable_2 : "contains"
positionMethods -.-> groupedByType : "contains"
positionMethods -.-> calculateNodeScaleFromChildren : "contains"
positionMethods -.-> calculateGroupSpacing : "contains"
positionMethods -.-> calculateGroupBounds : "contains"
positionMethods -.-> positionGroup : "contains"
processMethods -.-> allNodes : "contains"
processMethods -.-> allConnections : "contains"
processMethods -.-> nodeToObjectIdMap : "contains"
processMethods -.-> reader : "contains"
processMethods -.-> nodeDataMap : "contains"
processMethods -.-> activeNodeIds : "contains"
processMethods -.-> orphanIds : "contains"
markdownDiagramService_file -.-> markdownDiagramService : "contains"
merfolkExtractor -.-> extractMerfolkBlocks : "contains"
merfolkExtractor -.-> hasMerfolkBlocks : "contains"
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
planService -.-> generateId : "contains"
planService -.-> getCellId : "contains"
planService -.-> findPlanContainer : "contains"
planService -.-> findPlanTextObjects : "contains"
planService -.-> findRightmostScenePosition : "contains"
planService -.-> computeContainerScale : "contains"
planService -.-> getPlanGridPosition : "contains"
planService -.-> generatePlanTitle : "contains"
planService -.-> now : "contains"
planService -.-> createPlanContainer : "contains"
planService -.-> createPlanTextObject : "contains"
planService -.-> updatePlanText : "contains"
planService -.-> getAllPlanContext : "contains"
presenceService -.-> getGuestId_2 : "contains"
presenceService -.-> setUserPresence : "contains"
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
resourceCleanupService_file -.-> _disposedWeakSet : "contains"
resourceCleanupService_file -.-> resourceCleanupService : "contains"
runtimeScanService -.-> validateScanUrl : "contains"
runtimeScanService -.-> generateMerfolkFromRuntimeTrace : "contains"
runtimeScanService -.-> sanitizeId : "contains"
runtimeScanService -.-> scanWebsiteAndGenerateDiagram : "contains"
runtimeScanService -.-> markdownBlob : "contains"
runtimeScanService -.-> markdownFile : "contains"
runtimeScanService -.-> simulateProgress : "contains"
screenRecordingService -.-> rawBlob : "contains"
screenRecordingService -.-> screenRecorder : "contains"
sharingService -.-> generateSharingUrl : "contains"
sharingService -.-> sharingUrl : "contains"
sharingService -.-> getSharedSpaceInfo : "contains"
spaceDataChannel -.-> current : "contains"
spaceDataChannel -.-> target : "contains"
spaceDataChannel -.-> pc : "contains"
spaceDataChannel -.-> getSpaceDataChannel : "contains"
spaceDataChannel -.-> leaveCurrentSpace : "contains"
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
spatialObjectsService -.-> previousCellObjectIds : "contains"
spatialObjectsService -.-> poll : "contains"
spatialObjectsService -.-> currentIds : "contains"
spatialObjectsService -.-> updateCellSubscriptions : "contains"
spatialObjectsService -.-> moveObjectBetweenCells : "contains"
spatialObjectsService -.-> loadObjectsFromCells : "contains"
spatialObjectsService -.-> saveObject : "contains"
spatialObjectsService -.-> deleteObject : "contains"
spatialObjectsService -.-> updateObject : "contains"
spatialObjectsService -.-> subscribeToObjects : "contains"
spatialObjectsService -.-> getObjectDeletionStatus : "contains"
spatialObjectsService -.-> clearObjectDeletionBlacklist : "contains"
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
spatialPartitioning -.-> lastDataMap : "contains"
spatialPartitioning -.-> getOccupiedCells : "contains"
spatialPartitioning -.-> getCellDistance : "contains"
spatialPartitioning -.-> getCellsToUnload : "contains"
spatialPartitioning -.-> addConnectionToCells : "contains"
spatialPartitioning -.-> bulkSaveConnectionsToCell : "contains"
spatialPartitioning -.-> bulkSaveConnectionsBatch : "contains"
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
storageService -.-> ALLOWED_IMAGE_TYPES : "contains"
storageService -.-> uploadFileGeneric : "contains"
storageService -.-> xhr : "contains"
storageService -.-> uploadImageToStorage : "contains"
storageService -.-> uploadModelToStorage : "contains"
storageService -.-> uploadMarkdownToStorage : "contains"
storageService -.-> blob : "contains"
streamlinedSpatialPartitioning -.-> getStreamlinedSpatialManager : "contains"
streamlinedSpatialPartitioning -.-> initializeStreamlinedSpatialPartitioning : "contains"
streamlinedSpatialPartitioning -.-> benchmarkStreamlinedSystem : "contains"
streamlinedSpatialPartitioning -.-> manager : "contains"
unifiedCacheManager_file -.-> cacheStats : "contains"
unifiedCacheManager_file -.-> unifiedCache : "contains"
unifiedCacheManager_file -.-> unifiedCacheManager : "contains"
webRservice -.-> initWebRTC : "contains"
webRservice -.-> activeStreams : "contains"
webRservice -.-> pc : "contains"
webRservice -.-> startBroadcasting : "contains"
webRservice -.-> broadcastSession : "contains"
webRservice -.-> joinBroadcast : "contains"
webRservice -.-> isPlaneBeingBroadcast : "contains"
webRservice -.-> findAvailableBroadcasts : "contains"
webRservice -.-> cleanupWebRTC : "contains"
webRservice -.-> registerUserPresence : "contains"
webRservice -.-> subscribeToUsersInSpace : "contains"
zenService -.-> buildSceneContext : "contains"
zenService -.-> buildCodeSceneContext : "contains"
zenService -.-> CONFIG_FILE_SET : "contains"
zenService -.-> isConfigFile : "contains"
zenService -.-> fetchRepoContext : "contains"
zenService -.-> populateContentStore : "contains"
zenService -.-> finalizeContentStore : "contains"
zenService -.-> populateContentStoreWorker : "contains"
zenService -.-> sendToZen : "contains"
zenService -.-> buildZenMessages : "contains"
zenService -.-> buildCodeMessages : "contains"
zenService -.-> buildFileTreeSection : "contains"
zenService -.-> parseSectionedResponse : "contains"
zenService -.-> buildMinimalSceneContext : "contains"
zenService -.-> buildCodeGenMessages : "contains"
line_frag_glsl[Function: line_frag_glsl]
shader_shaders -.-> line_frag_glsl : "contains"
line_vert_glsl[Function: line_vert_glsl]
shader_shaders -.-> line_vert_glsl : "contains"
animatedConnectionLineStore -.-> useAnimatedConnectionLineStore : "contains"
initGIS[Function: initGIS]
authStore -.-> initGIS : "contains"
getGISAccessToken[Function: getGISAccessToken]
authStore -.-> getGISAccessToken : "contains"
authStore -.-> useAuthStore : "contains"
loadPersisted[Function: loadPersisted]
codeStore -.-> loadPersisted : "contains"
persist[Function: persist]
codeStore -.-> persist : "contains"
codeStore -.-> useCodeStore : "contains"
colorPickerStore -.-> useColorPickerStore : "contains"
_buildConnectionsByObjectId[Function: _buildConnectionsByObjectId]
connectionStore -.-> _buildConnectionsByObjectId : "contains"
connectionStore -.-> useConnectionStore : "contains"
getCellCoords[Function: getCellCoords]
connectionStore -.-> getCellCoords : "contains"
getCellIdFromCoords[Function: getCellIdFromCoords]
connectionStore -.-> getCellIdFromCoords : "contains"
contentIndexStore -.-> loadPersisted : "contains"
contentIndexStore -.-> persist : "contains"
contentIndexStore -.-> useContentIndexStore : "contains"
getCubeSelector[Function: getCubeSelector]
cubeStore -.-> getCubeSelector : "contains"
getCubeFaceColorSelector[Function: getCubeFaceColorSelector]
cubeStore -.-> getCubeFaceColorSelector : "contains"
getCubeSelectedFaceSelector[Function: getCubeSelectedFaceSelector]
cubeStore -.-> getCubeSelectedFaceSelector : "contains"
getCubeFaceStateSelector[Function: getCubeFaceStateSelector]
cubeStore -.-> getCubeFaceStateSelector : "contains"
cubeStore -.-> useCubeStore : "contains"
diagramStore -.-> useDiagramStore : "contains"
dodecahedronStore -.-> useDodecahedronStore : "contains"
earthSettingsStore -.-> useEarthSettingsStore : "contains"
faceIndicatorStore -.-> useFaceIndicatorStore : "contains"
faceStore -.-> useFaceStore : "contains"
handTrackingStore -.-> useHandTrackingStore : "contains"
indicatorsStore -.-> useIndicatorsStore : "contains"
llmStore -.-> loadPersisted : "contains"
llmStore -.-> persist : "contains"
llmStore -.-> useLlmStore : "contains"
calculateLODLevel[Function: calculateLODLevel]
lodStore -.-> calculateLODLevel : "contains"
calculateParentLODLevel[Function: calculateParentLODLevel]
lodStore -.-> calculateParentLODLevel : "contains"
lodStore -.-> useLODStore : "contains"
getObjectById[Function: getObjectById]
objectsStore -.-> getObjectById : "contains"
objectsStore -.-> useObjectsStore : "contains"
numericHash[Function: numericHash]
objectsStore -.-> numericHash : "contains"
stringHash[Function: stringHash]
objectsStore -.-> stringHash : "contains"
octahedronStore -.-> useOctahedronStore : "contains"
pipelineStore -.-> usePipelineStore : "contains"
planeStore -.-> usePlaneStore : "contains"
publicSpaceStore -.-> usePublicSpaceStore : "contains"
sceneStore -.-> useSceneStore : "contains"
screenShareStore -.-> useScreenShareStore : "contains"
spaceManagerStore -.-> useSpaceManagerStore : "contains"
spatialManagerStore -.-> useSpatialManagerStore : "contains"
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
tetrahedronStore -.-> useTetrahedronStore : "contains"
textAtlasStore -.-> useTextAtlasStore : "contains"
textInputStore -.-> useTextInputStore : "contains"
textObjectStore -.-> useTextObjectStore : "contains"
transformControlsStore -.-> useTransformControlsStore : "contains"
uiOverlayStore -.-> useUIOverlayStore : "contains"
setCellBoundariesVisible[Function: setCellBoundariesVisible]
uiOverlayStore -.-> setCellBoundariesVisible : "contains"
webcamStreamStore -.-> useWebcamStreamStore : "contains"
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
loadEarthHeightmap[Function: loadEarthHeightmap]
earthHeightmapLoader -.-> loadEarthHeightmap : "contains"
img[Function: img]
earthHeightmapLoader -.-> img : "contains"
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
handleFaceIndicatorClick[Function: handleFaceIndicatorClick]
faceIndicatorUtils -.-> handleFaceIndicatorClick : "contains"
getIdFromIndicator[Function: getIdFromIndicator]
faceIndicatorUtils -.-> getIdFromIndicator : "contains"
_avg3[Function: _avg3]
facePositionUtils -.-> _avg3 : "contains"
calculateFacePosition[Function: calculateFacePosition]
facePositionUtils -.-> calculateFacePosition : "contains"
frameCounter[Function: frameCounter]
frameCounter_file -.-> frameCounter : "contains"
gpuTracker[Function: gpuTracker]
gpuResourceTracker -.-> gpuTracker : "contains"
getIsInitialLoading[Function: getIsInitialLoading]
loadingState -.-> getIsInitialLoading : "contains"
setIsInitialLoading[Function: setIsInitialLoading]
loadingState -.-> setIsInitialLoading : "contains"
handleObjectMove[Function: handleObjectMove]
objectUpdateHandlers -.-> handleObjectMove : "contains"
handleObjectUpdate[Function: handleObjectUpdate]
objectUpdateHandlers -.-> handleObjectUpdate : "contains"
callUpsertObjectPosition[Function: callUpsertObjectPosition]
objectUpdateHandlers -.-> callUpsertObjectPosition : "contains"
objectVirtualizer[Function: objectVirtualizer]
objectVirtualization -.-> objectVirtualizer : "contains"
intersectionCache[Function: intersectionCache]
pathfindingUtils -.-> intersectionCache : "contains"
pathCache[Function: pathCache]
pathfindingUtils -.-> pathCache : "contains"
objectPositionCache[Function: objectPositionCache]
pathfindingUtils -.-> objectPositionCache : "contains"
precomputedResults[Function: precomputedResults]
pathfindingUtils -.-> precomputedResults : "contains"
isWorkerBusy[Function: isWorkerBusy]
pathfindingUtils -.-> isWorkerBusy : "contains"
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
calculateMidpoint[Function: calculateMidpoint]
positionUtils -.-> calculateMidpoint : "contains"
calculateMidpointVector[Function: calculateMidpointVector]
positionUtils -.-> calculateMidpointVector : "contains"
lerp[Function: lerp]
positionUtils -.-> lerp : "contains"
checkPositionJitter[Function: checkPositionJitter]
positionUtils -.-> checkPositionJitter : "contains"
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
calculateAxisSnap[Function: calculateAxisSnap]
snappingUtils -.-> calculateAxisSnap : "contains"
distanceToAxis[Function: distanceToAxis]
snappingUtils -.-> distanceToAxis : "contains"
projectPointOntoAxis[Function: projectPointOntoAxis]
snappingUtils -.-> projectPointOntoAxis : "contains"
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
page[Function: page]
textAtlas -.-> page : "contains"
isOffscreenCanvasTextSupported[Function: isOffscreenCanvasTextSupported]
textAtlas -.-> isOffscreenCanvasTextSupported : "contains"
textAtlas -.-> c : "contains"
textAtlas -.-> seen : "contains"
_switchToSyncAtlas[Function: _switchToSyncAtlas]
textAtlas -.-> _switchToSyncAtlas : "contains"
getGlobalTextAtlas[Function: getGlobalTextAtlas]
textAtlas -.-> getGlobalTextAtlas : "contains"
resetGlobalTextAtlas[Function: resetGlobalTextAtlas]
textAtlas -.-> resetGlobalTextAtlas : "contains"
createAtlasTextMesh[Function: createAtlasTextMesh]
textAtlas -.-> createAtlasTextMesh : "contains"
loadTextureFromFirebaseUrl[Function: loadTextureFromFirebaseUrl]
textureLoader -.-> loadTextureFromFirebaseUrl : "contains"
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
urlObj[Function: urlObj]
unifiedValidationUtils -.-> urlObj : "contains"
validateEmail[Function: validateEmail]
unifiedValidationUtils -.-> validateEmail : "contains"
validateArray[Function: validateArray]
unifiedValidationUtils -.-> validateArray : "contains"
validateMultiple[Function: validateMultiple]
unifiedValidationUtils -.-> validateMultiple : "contains"
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
worker_lib_rs -.-> fill_edge_buffers : "contains"
worker_lib_rs -.-> get_scratch_start_view : "contains"
worker_lib_rs -.-> get_scratch_end_view : "contains"
worker_lib_rs -.-> get_scratch_color_view : "contains"
worker_lib_rs -.-> compute_lod_updates : "contains"
worker_lib_rs -.-> frustum_cull_connections : "contains"
point_in_frustum[Function: point_in_frustum]
worker_lib_rs -.-> point_in_frustum : "contains"
getContentStoreWorker[Function: getContentStoreWorker]
worker_contentStoreWorkerClient -.-> getContentStoreWorker : "contains"
terminateContentStoreWorker[Function: terminateContentStoreWorker]
worker_contentStoreWorkerClient -.-> terminateContentStoreWorker : "contains"
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
getHandTrackingWorker[Function: getHandTrackingWorker]
worker_handTrackingWorkerClient -.-> getHandTrackingWorker : "contains"
terminateHandTrackingWorker[Function: terminateHandTrackingWorker]
worker_handTrackingWorkerClient -.-> terminateHandTrackingWorker : "contains"
parseFlowPaths[Function: parseFlowPaths]
worker_markdownLayoutWorker -.-> parseFlowPaths : "contains"
worker_markdownLayoutWorker -.-> addTag : "contains"
stripFlowPathSyntax[Function: stripFlowPathSyntax]
worker_markdownLayoutWorker -.-> stripFlowPathSyntax : "contains"
computeHeaderStyle[Function: computeHeaderStyle]
worker_markdownLayoutWorker -.-> computeHeaderStyle : "contains"
getMarkdownLayoutWorker[Function: getMarkdownLayoutWorker]
worker_markdownLayoutWorkerClient -.-> getMarkdownLayoutWorker : "contains"
terminateMarkdownLayoutWorker[Function: terminateMarkdownLayoutWorker]
worker_markdownLayoutWorkerClient -.-> terminateMarkdownLayoutWorker : "contains"
getPathfindingWorker[Function: getPathfindingWorker]
worker_pathfindingWorkerClient -.-> getPathfindingWorker : "contains"
terminatePathfindingWorker[Function: terminatePathfindingWorker]
worker_pathfindingWorkerClient -.-> terminatePathfindingWorker : "contains"
initWasm[Function: initWasm]
worker_spatialIndexWorker -.-> initWasm : "contains"
_rebuildFlatBuffers[Function: _rebuildFlatBuffers]
worker_spatialIndexWorker -.-> _rebuildFlatBuffers : "contains"
childLOD[Function: childLOD]
worker_spatialIndexWorker -.-> childLOD : "contains"
parentLOD[Function: parentLOD]
worker_spatialIndexWorker -.-> parentLOD : "contains"
worker_spatialIndexWorker -.-> isPointInFrustum : "contains"
getSpatialIndexWorker[Function: getSpatialIndexWorker]
worker_spatialIndexWorkerClient -.-> getSpatialIndexWorker : "contains"
terminateSpatialIndexWorker[Function: terminateSpatialIndexWorker]
worker_spatialIndexWorkerClient -.-> terminateSpatialIndexWorker : "contains"
getKey[Function: getKey]
worker_textAtlasWorker -.-> getKey : "contains"
addPage[Function: addPage]
worker_textAtlasWorker -.-> addPage : "contains"
getTextAtlasWorker[Function: getTextAtlasWorker]
worker_textAtlasWorkerClient -.-> getTextAtlasWorker : "contains"
terminateTextAtlasWorker[Function: terminateTextAtlasWorker]
worker_textAtlasWorkerClient -.-> terminateTextAtlasWorker : "contains"
ensureInit[Function: ensureInit]
worker_treeSitterScannerWorker -.-> ensureInit : "contains"
worker_treeSitterScannerWorker -.-> getLanguage : "contains"
getQuery[Function: getQuery]
worker_treeSitterScannerWorker -.-> getQuery : "contains"
getParser[Function: getParser]
worker_treeSitterScannerWorker -.-> getParser : "contains"
stripPathQuotes[Function: stripPathQuotes]
worker_treeSitterScannerWorker -.-> stripPathQuotes : "contains"
collectDottedSegments[Function: collectDottedSegments]
worker_treeSitterScannerWorker -.-> collectDottedSegments : "contains"
summariseQueryMatches[Function: summariseQueryMatches]
worker_treeSitterScannerWorker -.-> summariseQueryMatches : "contains"
ensurePool[Function: ensurePool]
worker_treeSitterScannerWorkerClient -.-> ensurePool : "contains"
getTreeSitterScannerWorker[Function: getTreeSitterScannerWorker]
worker_treeSitterScannerWorkerClient -.-> getTreeSitterScannerWorker : "contains"
terminateTreeSitterScannerWorker[Function: terminateTreeSitterScannerWorker]
worker_treeSitterScannerWorkerClient -.-> terminateTreeSitterScannerWorker : "contains"

%% Component Relationships
App --> FrameTicker : "uses"
FrameTicker --> FrameTicker_2 : "receives"
App --> FrameloopController : "uses"
FrameloopController --> FrameloopController_2 : "receives"
App --> LODManager : "enabled"
LODManager --> LODManager_2 : "receives"
App --> HeaderBillboardManager : "uses"
HeaderBillboardManager --> HeaderBillboardManager_2 : "receives"
App --> CustomCamera : "camera"
App --> RealTimeConnectionUpdater : "connections"
RealTimeConnectionUpdater --> RealTimeConnectionUpdater_2 : "receives"
App --> ConnectionsRenderer : "objects, allObjectsForPathfinding, visibleObjectIds..."
App --> EarthGlobe : "uses"
App --> ObjectsRenderer : "objects, visibleObjectIds, selectedId..."
App --> RepoGrid : "uses"
App --> CellBoundaryRenderer : "visible"
App --> HandsRenderer : "renders"
App --> DiagramOverlay2D : "uses"
App --> UIOverlay : "onCreateObject, onToggleIndicators, user..."
App --> UIOverlay : "uses"
UIOverlay --> EarthSidebarSections : "receives"
App --> ConnectionsRenderer : "connections"
ConnectionsRenderer --> DistanceFilteredConnectionText : "receives"
AppShell --> SharedCanvas : "onPointerMissed"
AppShell --> LandingApp : "onOpenSpace, onTryWithoutAccount"
AppShell --> App : "uses"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, geometry..."
AtlasTextSprite --> StaticBillboardMesh : "receives"
AtlasTextSprite --> AtlasTextSprite : "meshRef, position, calculatedPosition..."
AtlasTextSprite --> DynamicBillboardMesh : "receives"
AtlasTextSprite --> HeaderBillboardManager : "uses"
HeaderBillboardManager --> HeaderBillboardManager_2 : "receives"
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
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Cube --> CubeFace : "cubeId, faceName, faceData..."
Cube --> FaceUI : "position, normal, onColorChange..."
Cube --> FaceTextInput : "position, onTextSubmit, inputId"
Cube --> AtlasTextSprite : "text, position, onClick..."
Cube --> TextStyleUI : "position, onStyleChange, onClose..."
Cube --> SnapLineIndicator : "points, axis, visible"
Cube --> InstancedLine : "points, color, lineWidth"
Cube --> HeaderInput : "position, onTextSubmit, inputId..."
Cube --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
Cube --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Cube --> GlobalCubeEdgesRenderer : "renders"
CubeFace --> FaceIndicator : "position, rotation, onClick..."
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
DiagramOverlay2D --> ContainerNode : "uses"
ContainerNode --> MerfolkNode : "receives"
DiagramOverlay2D --> EdgeMarkerDefs : "uses"
EdgeMarkerDefs --> MerfolkEdge : "receives"
DistanceFilteredTextLabels --> InstancedAtlasText : "labels, maxDistance, onLabelClick..."
Sphere --> SnapLineIndicator : "points, axis, visible"
Sphere --> DodecahedronFace : "dodecahedronId, faceIndex, faceGeometry..."
Sphere --> InstancedLine : "points, color, lineWidth"
Sphere --> ObjectUI : "position, onTransformToggle, onHeaderToggle..."
Sphere --> FaceUI : "position, onColorChange, face..."
Sphere --> HeaderInput : "position, onTextSubmit, inputId..."
Sphere --> AtlasTextSprite : "text, position, followTarget..."
Sphere --> TextStyleUI : "position, followTarget, onStyleChange..."
Sphere --> GlobalDodecahedronEdgesRenderer : "renders"
Sphere --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
DodecahedronFace --> FaceIndicator : "position, rotation, onClick..."
DodecahedronFace --> AtlasTextSprite : "text, position, onClick..."
DodecahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
EarthGlobe --> InstancedLine : "points, color, lineWidth..."
FaceUI --> ColorPicker : "onColorSelect, onClose"
HandsRenderer --> InstancedLine : "points, color, lineWidth..."
InstancedAtlasText --> InstancedAtlasText : "atlas, texture, items..."
InstancedAtlasText --> PageInstancedMesh : "receives"
LineUI --> ColorPicker : "onColorSelect, onClose"
ObjectRenderer --> Cube : "selected, onClick, onUpdate..."
ObjectRenderer --> Tetrahedron : "selected, onClick, onUpdate..."
ObjectRenderer --> Octahedron : "selected, onClick, onUpdate..."
ObjectRenderer --> Sphere : "selected, onClick, showAllIndicators..."
ObjectRenderer --> Plane : "position, scale, selected..."
ObjectRenderer --> TextObject : "position, selected, onClick..."
ObjectRenderer --> ModelObject : "obj, isSelected, onClick..."
ObjectRenderer --> GlobalCubeFullLODInstancedRenderer : "renders"
ObjectUI --> ColorPicker : "pickerId, onColorSelect, onClose"
ObjectsRenderer --> ObjectRenderer : "obj, selectedId, handleObjectClick..."
ObjectsRenderer --> GlobalCubeEdgesRenderer : "cubes, defaultLineWidth"
ObjectsRenderer --> GlobalCubeFaceRenderer : "cubes"
ObjectsRenderer --> GlobalCubeMediumLODRenderer : "cubes, onInstanceClick"
ObjectsRenderer --> GlobalCubeFullLODInstancedRenderer : "cubes, onInstanceClick"
ObjectsRenderer --> GlobalDodecahedronEdgesRenderer : "dodecahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalDodecahedronMediumLODRenderer : "dodecahedrons, onInstanceClick"
ObjectsRenderer --> GlobalTetrahedronEdgesRenderer : "tetrahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalOctahedronEdgesRenderer : "octahedrons, defaultLineWidth"
ObjectsRenderer --> GlobalTetrahedronMediumLODRenderer : "tetrahedrons, onInstanceClick"
ObjectsRenderer --> GlobalOctahedronMediumLODRenderer : "octahedrons, onInstanceClick"
ObjectsRenderer --> GlobalCubeLowLODRenderer : "cubes, onInstanceClick"
ObjectsRenderer --> GlobalDodecahedronLowLODRenderer : "dodecahedrons, onInstanceClick"
ObjectsRenderer --> GlobalTetrahedronLowLODRenderer : "tetrahedrons, onInstanceClick"
ObjectsRenderer --> GlobalOctahedronLowLODRenderer : "octahedrons, onInstanceClick"
ObjectsRenderer --> AtlasTextSprite : "text, position, billboard..."
Octahedron --> AtlasTextSprite : "text, position, onClick..."
Octahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Octahedron --> OctahedronFace : "faceName, faceData, selected..."
Octahedron --> SnapLineIndicator : "points, axis, visible"
Octahedron --> InstancedLine : "points, color, lineWidth"
Octahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Octahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
Octahedron --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Octahedron --> GlobalOctahedronEdgesRenderer : "renders"
OctahedronFace --> AtlasTextSprite : "text, position, followTarget..."
OctahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
OctahedronFace --> FaceUI : "position, normal, onColorChange..."
OctahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
OctahedronFace --> FaceIndicator : "position, rotation, onClick..."
OctahedronFace --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
DiffView --> DiffView : "original, proposed"
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
Plane --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
TreeRow --> TreeRow : "nodeId, nodes, parentChildMap..."
TreeRow --> GroupedView : "allNodes, hierarchy, filter..."
RepoGrid --> RepoGrid : "...data"
RepoGrid --> RepoGridLines : "receives"
SnapLineIndicator --> InstancedLine : "points, color, lineWidth"
Avatar --> HandTrackingToggle : "uses"
Avatar --> Avatar : "user"
Tetrahedron --> AtlasTextSprite : "text, position, onClick..."
Tetrahedron --> TextStyleUI : "position, onStyleChange, onClose..."
Tetrahedron --> TetrahedronFace : "faceName, faceData, selected..."
Tetrahedron --> SnapLineIndicator : "points, axis, visible"
Tetrahedron --> InstancedLine : "points, color, lineWidth"
Tetrahedron --> HeaderInput : "position, onTextSubmit, inputId..."
Tetrahedron --> ObjectUI : "onTransformToggle, onHeaderToggle, onResizeToggle..."
Tetrahedron --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Tetrahedron --> GlobalTetrahedronEdgesRenderer : "renders"
TetrahedronFace --> AtlasTextSprite : "text, position, followTarget..."
TetrahedronFace --> TextStyleUI : "position, onStyleChange, onClose..."
TetrahedronFace --> FaceUI : "position, normal, onColorChange..."
TetrahedronFace --> FaceTextInput : "position, onTextSubmit, inputId"
TetrahedronFace --> FaceIndicator : "position, rotation, onClick..."
TetrahedronFace --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
TextObject --> SnapLineIndicator : "points, axis, visible"
TextObject --> FaceIndicator : "position, rotation, onClick..."
TextObject --> TextObjectUI : "textStyle, onStyleChange, onDelete..."
TextObjectUI --> TextStyleUI : "uiType, textStyle, onStyleChange..."
TextStyleUI --> TextStyleUIContent : "receives"
TextObjectUI --> ColorPicker : "onColorSelect, onClose"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> ColorPicker : "pickerId, onColorSelect, onClose"
TextStyleUIContent --> TextStyleUIContent : "onStyleChange, distance, onClose"
TextStyleUIContainer --> TextStyleUI : "onStyleChange"
TextStyleUI --> TextStyleUIContent : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> ObjectSearch : "uses"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpacePresenceAvatars : "spaceId, currentCell, inline"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> RecordingFormatPrompt : "open, onSelect, onCancel"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> RepoAnalysisOverlay : "open, onClose, repoName"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> CodeWorkspace : "uses"
EarthSidebarSections --> EarthSidebarSections : "uses"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpaceChat : "spaceId, user, isOpen..."
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> PendingChangesPanel : "uses"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> SpacePresenceAvatars : "uses"
SpacePresenceAvatars --> Avatar : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> PendingChangesPanel : "uses"
PendingChangesPanel --> DiffView : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> RepoAnalysisOverlay : "uses"
RepoAnalysisOverlay --> TreeRow : "receives"
LandingApp --> LandingScene : "user, scrollProgressRef, windowSize"
LandingApp --> CreateSpacePopup : "...createSpaceProps"
LandingApp --> UpgradePrompt : "show, onClose, currentTier"
LandingApp --> ShareSpacePopup : "...sharePopupProps"
LandingApp --> OrganizationManager : "user, show, onClose"
LandingApp --> LandingTopBar : "user, onLogout, onOpenOrgManager..."
LandingApp --> SpacesTable : "...spaceTableProps"
LandingApp --> WelcomeOverlay : "windowSize, onLogin, onTryWithoutAccount"
LandingApp --> LandingScrollContent : "scrollProgress, isMobile, onLogin..."
LandingApp --> LandingScrollContent : "uses"
LandingScrollContent --> SectionEyebrow : "receives"
LandingScene --> OrderHeader : "windowSize"
LandingScene --> CustomCamera : "scrollProgressRef"
LandingScene --> PerspectiveGrid : "uses"
UpdatesContainer --> UpdatesViewer : "content, timestamp"
CreateSpacePopup --> OrgMemberDropdown : "members, selectedUserId, onSelect..."
SectionEyebrow --> SectionEyebrow : "uses"
SectionEyebrow --> Bullet : "uses"
SectionEyebrow --> DiagramContent : "isMobile"
SectionEyebrow --> FeaturesContent : "isMobile"
SectionEyebrow --> AudienceContent : "isMobile"
SectionEyebrow --> CtaContent : "isMobile, onLogin, onTryWithoutAccount"
SectionEyebrow --> ContentPanel : "isMobile"
LandingTopBar --> SpacePresenceAvatars : "user"
SpacePresenceAvatars --> Avatar : "receives"
main --> AppShell : "uses"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> HeaderBillboardManager : "uses"
HeaderBillboardManager --> HeaderBillboardManager_2 : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> HeaderBillboardManager : "uses"
HeaderBillboardManager --> HeaderBillboardManager_2 : "receives"
BatchedConnectionLines --> LineShaderMaterial : "uses"
BatchedCurvedLines --> LineShaderMaterial : "uses"
CellBoundaryRenderer --> LineShaderMaterial : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> InstancedLine : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedConnectionLines : "connections"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> BatchedCurvedLines : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AtlasTextSprite : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> DistanceFilteredTextLabels : "uses"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> LineUI : "displays UI"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> HeaderInput : "displays UI"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> AnimatedConnectionLine : "connections"
ConnectionsRenderer --> InstancedLine : "uses"
ConnectionsRenderer --> BatchedConnectionLines : "connections"
ConnectionsRenderer --> BatchedCurvedLines : "uses"
ConnectionsRenderer --> AtlasTextSprite : "uses"
ConnectionsRenderer --> DistanceFilteredTextLabels : "uses"
ConnectionsRenderer --> LineUI : "displays UI"
ConnectionsRenderer --> HeaderInput : "displays UI"
ConnectionsRenderer --> TextStyleUI : "displays UI"
TextStyleUI --> TextStyleUIContent : "receives"
ConnectionsRenderer --> AnimatedConnectionLine : "connections"
GlobalCubeEdgesRenderer --> LineShaderMaterial : "uses"
GlobalCubeFaceRenderer --> GlobalCubeEdgesRenderer : "renders"
GlobalCubeFullLODInstancedRenderer --> GlobalCubeEdgesRenderer : "renders"
GlobalCubeLowLODRenderer --> GlobalCubeEdgesRenderer : "renders"
GlobalCubeMediumLODRenderer --> GlobalCubeEdgesRenderer : "renders"
GlobalDodecahedronEdgesRenderer --> LineShaderMaterial : "uses"
GlobalDodecahedronLowLODRenderer --> GlobalDodecahedronEdgesRenderer : "renders"
GlobalDodecahedronMediumLODRenderer --> GlobalDodecahedronEdgesRenderer : "renders"
GlobalOctahedronEdgesRenderer --> LineShaderMaterial : "uses"
GlobalOctahedronLowLODRenderer --> GlobalOctahedronEdgesRenderer : "renders"
GlobalOctahedronMediumLODRenderer --> GlobalOctahedronEdgesRenderer : "renders"
GlobalTetrahedronEdgesRenderer --> LineShaderMaterial : "uses"
GlobalTetrahedronLowLODRenderer --> GlobalTetrahedronEdgesRenderer : "renders"
GlobalTetrahedronMediumLODRenderer --> GlobalTetrahedronEdgesRenderer : "renders"
InstancedLine --> LineShaderMaterial : "uses"
TextStyleUI --> ColorPicker : "displays UI"
UIOverlay --> SpacePresenceAvatars : "uses"
SpacePresenceAvatars --> Avatar : "receives"
UIOverlay --> ObjectSearch : "uses"
UIOverlay --> SpaceChat : "uses"
UIOverlay --> CodeWorkspace : "uses"
UIOverlay --> PendingChangesPanel : "uses"
PendingChangesPanel --> DiffView : "receives"
UIOverlay --> RepoAnalysisOverlay : "uses"
RepoAnalysisOverlay --> TreeRow : "receives"
UIOverlay --> RecordingFormatPrompt : "uses"

%% Component Dependencies
App --> sceneStore : "uses store"
sceneStore --> useSceneStore : "receives"
App --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
App --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
App --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
App --> planeStore : "uses store"
planeStore --> usePlaneStore : "receives"
App --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
App --> tetrahedronStore : "uses store"
tetrahedronStore --> useTetrahedronStore : "receives"
App --> dodecahedronStore : "uses store"
dodecahedronStore --> useDodecahedronStore : "receives"
App --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
App --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
App --> codeStore : "uses store"
codeStore --> useCodeStore : "receives"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
App --> authService : "uses service"
authService --> signInUser : "receives"
App --> repoContainerService : "uses service"
repoContainerService --> toggleTaskExpansion : "receives"
App --> repoContainerService : "uses service"
repoContainerService --> repositionAllTasks : "receives"
App --> spatialObjectsService : "uses service"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> spatialObjectsService : "uses service"
spatialObjectsService --> clearAllObjectCaches : "receives"
App --> spatialPartitioning : "uses service"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> cellObjectCache : "uses service"
cellObjectCache --> hasAnyPendingObjects : "receives"
App --> cellObjectCache : "uses service"
cellObjectCache --> getAllCellObjectsForCells : "receives"
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
AppShell --> sceneStore : "uses store"
sceneStore --> useSceneStore : "receives"
AnimatedConnectionLine --> animatedConnectionLineStore : "uses store"
animatedConnectionLineStore --> useAnimatedConnectionLineStore : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AnimatedConnectionLine --> useConnectionAnimationManager : "uses hook"
useConnectionAnimationManager --> useAnimatedLine : "receives"
AtlasTextSprite --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
StaticBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
DynamicBillboardMesh --> AtlasTextSprite : "calls out"
AtlasTextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> pathfindingUtils : "uses utility"
pathfindingUtils --> computeConnectionPath : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "uses service"
spatialPartitioning --> getCellCoordinates : "receives"
CodeWorkspace --> codeStore : "uses store"
codeStore --> useCodeStore : "receives"
CodeWorkspace --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
ColorPicker --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
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
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> isWorkerBusy : "receives"
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
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
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
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> isWorkerBusy : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
Connection --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
ConnectionsRenderer --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
ConnectionsRenderer --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
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
ConnectionsRenderer --> pathfindingUtils : "uses utility"
pathfindingUtils --> isWorkerBusy : "receives"
ConnectionsRenderer --> positionUtils : "uses utility"
positionUtils --> calculateMidpoint : "receives"
ConnectionsRenderer --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
Cube --> faceIndicatorStore : "uses store"
faceIndicatorStore --> useFaceIndicatorStore : "receives"
Cube --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
Cube --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Cube --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Cube --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Cube --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
Cube --> pipelineStore : "uses store"
pipelineStore --> usePipelineStore : "receives"
Cube --> spaceManagerStore : "uses store"
spaceManagerStore --> useSpaceManagerStore : "receives"
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
CubeFace --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
DiagramOverlay2D --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
DiagramOverlay2D --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
DiagramOverlay2D --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Sphere --> dodecahedronStore : "uses store"
dodecahedronStore --> useDodecahedronStore : "receives"
Sphere --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Sphere --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Sphere --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Sphere --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
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
DodecahedronFace --> dodecahedronStore : "uses store"
dodecahedronStore --> useDodecahedronStore : "receives"
EarthGlobe --> earthSettingsStore : "uses store"
earthSettingsStore --> useEarthSettingsStore : "receives"
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
FaceIndicator --> faceIndicatorStore : "uses store"
faceIndicatorStore --> useFaceIndicatorStore : "receives"
FaceTextInput --> textInputStore : "uses store"
textInputStore --> useTextInputStore : "receives"
FaceUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
FaceUI --> faceStore : "uses store"
faceStore --> useFaceStore : "receives"
FrameTicker_2 --> FrameTicker : "calls out"
FrameTicker --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
FrameloopController_2 --> FrameloopController : "calls out"
FrameloopController --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
GlobalCubeEdgesRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
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
GlobalCubeFaceRenderer --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
GlobalCubeFaceRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalCubeFullLODInstancedRenderer --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
GlobalCubeFullLODInstancedRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalCubeLowLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalCubeMediumLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalDodecahedronEdgesRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
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
GlobalDodecahedronLowLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalDodecahedronMediumLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalOctahedronEdgesRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> initWasmKernels : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchStartView : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchEndView : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> getScratchColorView : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "uses utility"
wasmKernels --> isWasmReady : "receives"
GlobalOctahedronLowLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalOctahedronMediumLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalTetrahedronEdgesRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
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
GlobalTetrahedronLowLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
GlobalTetrahedronMediumLODRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
HandsRenderer --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
HeaderInput --> textInputStore : "uses store"
textInputStore --> useTextInputStore : "receives"
InstancedAtlasText --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlasStore : "uses store"
textAtlasStore --> useTextAtlasStore : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
PageInstancedMesh --> InstancedAtlasText : "calls out"
InstancedAtlasText --> textAtlas : "uses utility"
textAtlas --> getGlobalTextAtlas : "receives"
LODManager_2 --> LODManager : "calls out"
LODManager --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
LODManager_2 --> LODManager : "calls out"
LODManager --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
LODManager_2 --> LODManager : "calls out"
LODManager --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
LineUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
LineUI --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
ObjectRenderer --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
ObjectSearch --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
ObjectUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
ObjectsRenderer --> cubeStore : "uses store"
cubeStore --> useCubeStore : "receives"
ObjectsRenderer --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isCameraMoving : "receives"
ObjectsRenderer --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> getSmoothedFrameTime : "receives"
Octahedron --> faceIndicatorStore : "uses store"
faceIndicatorStore --> useFaceIndicatorStore : "receives"
Octahedron --> octahedronStore : "uses store"
octahedronStore --> useOctahedronStore : "receives"
Octahedron --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Octahedron --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Octahedron --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Octahedron --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
Octahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Octahedron --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Octahedron --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
Octahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
OctahedronFace --> octahedronStore : "uses store"
octahedronStore --> useOctahedronStore : "receives"
DiffView --> PendingChangesPanel : "calls out"
PendingChangesPanel --> codeStore : "uses store"
codeStore --> useCodeStore : "receives"
DiffView --> PendingChangesPanel : "calls out"
PendingChangesPanel --> githubPushService : "uses service"
githubPushService --> pushCodeToGitHub : "receives"
PendingChangesPanel --> codeStore : "uses store"
codeStore --> useCodeStore : "receives"
PendingChangesPanel --> githubPushService : "uses service"
githubPushService --> pushCodeToGitHub : "receives"
Plane --> planeStore : "uses store"
planeStore --> usePlaneStore : "receives"
Plane --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Plane --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Plane --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Plane --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
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
RealTimeConnectionUpdater_2 --> RealTimeConnectionUpdater : "calls out"
RealTimeConnectionUpdater --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
RealTimeConnectionUpdater_2 --> RealTimeConnectionUpdater : "calls out"
RealTimeConnectionUpdater --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RealTimeConnectionUpdater_2 --> RealTimeConnectionUpdater : "calls out"
RealTimeConnectionUpdater --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
RealTimeConnectionUpdater_2 --> RealTimeConnectionUpdater : "calls out"
RealTimeConnectionUpdater --> facePositionUtils : "uses utility"
facePositionUtils --> calculateFacePosition : "receives"
TreeRow --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
TreeRow --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
GroupedView --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
GroupedView --> RepoAnalysisOverlay : "calls out"
RepoAnalysisOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RepoAnalysisOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
RepoAnalysisOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RepoGrid --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RepoGrid --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
RepoGridLines --> RepoGrid : "calls out"
RepoGrid --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
RepoGridLines --> RepoGrid : "calls out"
RepoGrid --> repoContainerService : "uses service"
repoContainerService --> computeGridLayout : "receives"
ScreenShareStream --> screenShareStore : "uses store"
screenShareStore --> useScreenShareStore : "receives"
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
SpaceChat --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
SpaceChat --> codeStore : "uses store"
codeStore --> useCodeStore : "receives"
SpaceChat --> llmStore : "uses store"
llmStore --> useLlmStore : "receives"
SpaceChat --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> zenService : "uses service"
zenService --> buildZenMessages : "receives"
SpaceChat --> zenService : "uses service"
zenService --> buildCodeGenMessages : "receives"
SpaceChat --> zenService : "uses service"
zenService --> fetchRepoContext : "receives"
SpaceChat --> zenService : "uses service"
zenService --> populateContentStoreWorker : "receives"
SpaceChat --> zenService : "uses service"
zenService --> parseSectionedResponse : "receives"
SpaceChat --> retrievalOrchestrator : "uses service"
retrievalOrchestrator --> sendWithRetrieval : "receives"
SpaceChat --> merfolkExtractor : "uses service"
merfolkExtractor --> extractMerfolkBlocks : "receives"
SpaceChat --> codeExtractor : "uses service"
codeExtractor --> extractCodeBlocks : "receives"
SpaceChat --> llmProviders : "uses service"
llmProviders --> fetchModels : "receives"
SpaceChat --> markdownDiagramService_file : "uses service"
markdownDiagramService_file --> markdownDiagramService : "receives"
SpaceChat --> pipelineOrchestrator : "uses service"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> githubRepoService : "uses service"
githubRepoService --> isGithubAuthenticated : "receives"
SpaceChat --> githubRepoService : "uses service"
githubRepoService --> getGithubOAuthUrl : "receives"
SpaceChat --> githubRepoService : "uses service"
githubRepoService --> fetchRepositories_2 : "receives"
SpaceChat --> githubIssuesService : "uses service"
githubIssuesService --> getBranchRef : "receives"
SpaceChat --> githubIssuesService : "uses service"
githubIssuesService --> createBranchRef : "receives"
SpaceChat --> githubPushService : "uses service"
githubPushService --> listBranches : "receives"
SpaceChat --> githubRepoService : "uses service"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
SpaceChat --> storageService : "uses service"
storageService --> uploadMarkdownToStorage : "receives"
SpaceChat --> planService : "uses service"
planService --> findPlanContainer : "receives"
SpaceChat --> planService : "uses service"
planService --> findPlanTextObjects : "receives"
SpaceChat --> planService : "uses service"
planService --> createPlanContainer : "receives"
SpaceChat --> planService : "uses service"
planService --> createPlanTextObject : "receives"
SpaceChat --> planService : "uses service"
planService --> updatePlanText : "receives"
SpaceChat --> planService : "uses service"
planService --> generatePlanTitle : "receives"
Avatar --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
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
SpacePresenceAvatars --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
HandTrackingToggle --> SpacePresenceAvatars : "calls out"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
SpacePresenceAvatars --> handTrackingStore : "uses store"
handTrackingStore --> useHandTrackingStore : "receives"
SpacePresenceAvatars --> presenceService : "uses service"
presenceService --> subscribeToSpacePresence : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> startHandTracking : "receives"
SpacePresenceAvatars --> handTrackingService : "uses service"
handTrackingService --> stopHandTracking : "receives"
Tetrahedron --> faceIndicatorStore : "uses store"
faceIndicatorStore --> useFaceIndicatorStore : "receives"
Tetrahedron --> tetrahedronStore : "uses store"
tetrahedronStore --> useTetrahedronStore : "receives"
Tetrahedron --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
Tetrahedron --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
Tetrahedron --> lodStore : "uses store"
lodStore --> useLODStore : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
Tetrahedron --> snappingUtils : "uses utility"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> unifiedPerformanceUtils : "uses utility"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> useDebouncedUpdate_file : "uses hook"
useDebouncedUpdate_file --> useDebouncedUpdate_file : "receives"
TetrahedronFace --> tetrahedronStore : "uses store"
tetrahedronStore --> useTetrahedronStore : "receives"
TextObject --> textObjectStore : "uses store"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
TextObject --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
TextObject --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
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
TextObjectUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
TextSprite --> textObjectStore : "uses store"
textObjectStore --> useTextObjectStore : "receives"
TextSprite --> renderWorkScheduler : "uses utility"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextSprite --> frameCounter_file : "uses utility"
frameCounter_file --> frameCounter : "receives"
TextStyleUIContent --> TextStyleUI : "calls out"
TextStyleUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
TextStyleUI --> colorPickerStore : "uses store"
colorPickerStore --> useColorPickerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> codeStore : "uses store"
codeStore --> useCodeStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> authStore : "uses store"
authStore --> useAuthStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> earthSettingsStore : "uses store"
earthSettingsStore --> useEarthSettingsStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : "uses store"
pipelineStore --> usePipelineStore : "receives"
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
UIOverlay --> spatialPartitioning : "uses service"
spatialPartitioning --> deleteAllCellsInSpace : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> handleGithubCallback : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> fetchRepositories_2 : "receives"
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
UIOverlay --> uiOverlayStore : "uses store"
uiOverlayStore --> useUIOverlayStore : "receives"
UIOverlay --> diagramStore : "uses store"
diagramStore --> useDiagramStore : "receives"
UIOverlay --> spatialManagerStore : "uses store"
spatialManagerStore --> useSpatialManagerStore : "receives"
UIOverlay --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
UIOverlay --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
UIOverlay --> codeStore : "uses store"
codeStore --> useCodeStore : "receives"
UIOverlay --> authStore : "uses store"
authStore --> useAuthStore : "receives"
UIOverlay --> earthSettingsStore : "uses store"
earthSettingsStore --> useEarthSettingsStore : "receives"
UIOverlay --> pipelineStore : "uses store"
pipelineStore --> usePipelineStore : "receives"
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
UIOverlay --> spatialPartitioning : "uses service"
spatialPartitioning --> deleteAllCellsInSpace : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> handleGithubCallback : "receives"
UIOverlay --> githubRepoService : "uses service"
githubRepoService --> fetchRepositories_2 : "receives"
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
WebcamStream --> webcamStreamStore : "uses store"
webcamStreamStore --> useWebcamStreamStore : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> startBroadcasting : "receives"
WebcamStream --> webRservice : "uses service"
webRservice --> joinBroadcast : "receives"
WebcamStream --> resourceCleanupService_file : "uses service"
resourceCleanupService_file --> resourceCleanupService : "receives"
useAuth_file --> useAuth_file : "calls out"
useAuth_file --> authStore : "uses store"
authStore --> useAuthStore : "receives"
useAuthState_file --> useAuthState_file : "calls out"
useAuthState_file --> authStore : "uses store"
authStore --> useAuthStore : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "uses service"
connectionsService --> subscribeToConnections : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> connectionsService : "uses service"
connectionsService --> saveConnection : "receives"
useConnections_file --> useConnections_file : "calls out"
useConnections_file --> loadingState : "uses utility"
loadingState --> getIsInitialLoading : "receives"
useIndicators_file --> useIndicators_file : "calls out"
useIndicators_file --> indicatorsStore : "uses store"
indicatorsStore --> useIndicatorsStore : "receives"
useObjects_file --> useObjects_file : "calls out"
useObjects_file --> objectsStore : "uses store"
objectsStore --> useObjectsStore : "receives"
useObjects_file --> useObjects_file : "calls out"
useObjects_file --> connectionStore : "uses store"
connectionStore --> useConnectionStore : "receives"
useSpaceManager_file --> useSpaceManager_file : "calls out"
useSpaceManager_file --> spaceManagerStore : "uses store"
spaceManagerStore --> useSpaceManagerStore : "receives"
LandingApp --> sceneStore : "uses store"
sceneStore --> useSceneStore : "receives"
LandingApp --> authStore : "uses store"
authStore --> useAuthStore : "receives"
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
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> positionUtils : "calls checkPositionJitter"
positionUtils --> checkPositionJitter : "receives"
App --> spacesService : "calls getPublicSpaceMetadata"
spacesService --> getPublicSpaceMetadata : "receives"
App --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> cellObjectCache : "calls hasAnyPendingObjects"
cellObjectCache --> hasAnyPendingObjects : "receives"
App --> cellObjectCache : "calls getAllCellObjectsForCells"
cellObjectCache --> getAllCellObjectsForCells : "receives"
App --> spatialPartitioning : "calls getObjectsFromCells"
spatialPartitioning --> getObjectsFromCells : "receives"
App --> cellObjectCache : "calls hasAnyPendingObjects"
cellObjectCache --> hasAnyPendingObjects : "receives"
App --> cellObjectCache : "calls getAllCellObjectsForCells"
cellObjectCache --> getAllCellObjectsForCells : "receives"
App --> loadingState : "calls setIsInitialLoading"
loadingState --> setIsInitialLoading : "receives"
App --> spatialObjectsService : "calls subscribeToSpatialObjects"
spatialObjectsService --> subscribeToSpatialObjects : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> spatialPartitioning : "calls getCellCoordinates"
spatialPartitioning --> getCellCoordinates : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls repositionAllTasks"
repoContainerService --> repositionAllTasks : "receives"
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> authService : "calls signInUser"
authService --> signInUser : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectUpdateHandlers : "calls handleObjectMove"
objectUpdateHandlers --> handleObjectMove : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
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
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> planeStore : ".getState()"
planeStore --> usePlaneStore : "receives"
App --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
App --> tetrahedronStore : ".getState()"
tetrahedronStore --> useTetrahedronStore : "receives"
App --> dodecahedronStore : ".getState()"
dodecahedronStore --> useDodecahedronStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
App --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
App --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
App --> planeStore : ".getState()"
planeStore --> usePlaneStore : "receives"
App --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
App --> tetrahedronStore : ".getState()"
tetrahedronStore --> useTetrahedronStore : "receives"
App --> dodecahedronStore : ".getState()"
dodecahedronStore --> useDodecahedronStore : "receives"
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
App --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
App --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
App --> webRservice : "calls initWebRTC"
webRservice --> initWebRTC : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
AtlasTextSprite --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
BatchedCurvedLines --> pathfindingUtils : "calls computeConnectionPath"
pathfindingUtils --> computeConnectionPath : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
CellBoundaryRenderer --> spatialPartitioning : "calls getCellBounds"
spatialPartitioning --> getCellBounds : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> facePositionUtils : "calls calculateFacePosition"
facePositionUtils --> calculateFacePosition : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionsService : "calls saveConnection"
connectionsService --> saveConnection : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
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
ConnectionsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls isCameraMoving"
renderWorkScheduler --> isCameraMoving : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> pathfindingUtils : "calls isWorkerBusy"
pathfindingUtils --> isWorkerBusy : "receives"
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
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : ".getState()"
connectionStore --> useConnectionStore : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineOrchestrator : "calls reconcilePendingTasks"
pipelineOrchestrator --> reconcilePendingTasks : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineOrchestrator : "calls stopPipeline"
pipelineOrchestrator --> stopPipeline : "receives"
Cube --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
Cube --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasksForRepo"
pipelineTaskService --> getPipelineTasksForRepo : "receives"
Cube --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
Cube --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
Cube --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
Cube --> pipelineOrchestrator : "calls startPipeline"
pipelineOrchestrator --> startPipeline : "receives"
Cube --> spaceManagerStore : ".getState()"
spaceManagerStore --> useSpaceManagerStore : "receives"
Cube --> repoContainerService : "calls clearRepoTasks"
repoContainerService --> clearRepoTasks : "receives"
Cube --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
DiagramOverlay2D --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Sphere --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Sphere --> dodecahedronStore : ".getState()"
dodecahedronStore --> useDodecahedronStore : "receives"
Sphere --> dodecahedronStore : ".getState()"
dodecahedronStore --> useDodecahedronStore : "receives"
Sphere --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
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
FaceTextInput --> textInputStore : ".getState()"
textInputStore --> useTextInputStore : "receives"
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
GlobalCubeFaceRenderer --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
GlobalCubeFullLODInstancedRenderer --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
GlobalCubeFullLODInstancedRenderer --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
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
GlobalOctahedronEdgesRenderer --> wasmKernels : "calls isWasmReady"
wasmKernels --> isWasmReady : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "calls fillEdgeBuffers"
wasmKernels --> fillEdgeBuffers : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "calls getScratchStartView"
wasmKernels --> getScratchStartView : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "calls getScratchEndView"
wasmKernels --> getScratchEndView : "receives"
GlobalOctahedronEdgesRenderer --> wasmKernels : "calls getScratchColorView"
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
HandsRenderer --> handTrackingStore : ".getState()"
handTrackingStore --> useHandTrackingStore : "receives"
HeaderInput --> textInputStore : ".getState()"
textInputStore --> useTextInputStore : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> textAtlas : "calls getGlobalTextAtlas"
textAtlas --> getGlobalTextAtlas : "receives"
InstancedAtlasText --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
ObjectsRenderer --> renderWorkScheduler : "calls acquireBudget"
renderWorkScheduler --> acquireBudget : "receives"
ObjectsRenderer --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
ObjectsRenderer --> cubeStore : ".getState()"
cubeStore --> useCubeStore : "receives"
Octahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Octahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Octahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Octahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Octahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Octahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Octahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Octahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
OctahedronFace --> octahedronStore : ".getState()"
octahedronStore --> useOctahedronStore : "receives"
DiffView --> PendingChangesPanel : "calls out"
PendingChangesPanel --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
DiffView --> PendingChangesPanel : "calls out"
PendingChangesPanel --> githubPushService : "calls pushCodeToGitHub"
githubPushService --> pushCodeToGitHub : "receives"
DiffView --> PendingChangesPanel : "calls out"
PendingChangesPanel --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
DiffView --> PendingChangesPanel : "calls out"
PendingChangesPanel --> githubPushService : "calls pushCodeToGitHub"
githubPushService --> pushCodeToGitHub : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> frameCounter_file : ".shouldUpdate()"
frameCounter_file --> frameCounter : "receives"
Plane --> frameCounter_file : ".getTime()"
frameCounter_file --> frameCounter : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
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
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
Plane --> storageService : "calls uploadImageToStorage"
storageService --> uploadImageToStorage : "receives"
Plane --> resourceCleanupService_file : ".disposeMaterial()"
resourceCleanupService_file --> resourceCleanupService : "receives"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
RepoGrid --> repoContainerService : "calls computeGridLayout"
repoContainerService --> computeGridLayout : "receives"
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
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> planService : "calls findPlanContainer"
planService --> findPlanContainer : "receives"
SpaceChat --> planService : "calls findPlanTextObjects"
planService --> findPlanTextObjects : "receives"
SpaceChat --> zenService : "calls populateContentStoreWorker"
zenService --> populateContentStoreWorker : "receives"
SpaceChat --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
SpaceChat --> zenService : "calls buildZenMessages"
zenService --> buildZenMessages : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> retrievalOrchestrator : "calls sendWithRetrieval"
retrievalOrchestrator --> sendWithRetrieval : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
SpaceChat --> planService : "calls updatePlanText"
planService --> updatePlanText : "receives"
SpaceChat --> merfolkExtractor : "calls extractMerfolkBlocks"
merfolkExtractor --> extractMerfolkBlocks : "receives"
SpaceChat --> zenService : "calls populateContentStoreWorker"
zenService --> populateContentStoreWorker : "receives"
SpaceChat --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
SpaceChat --> zenService : "calls buildZenMessages"
zenService --> buildZenMessages : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> retrievalOrchestrator : "calls sendWithRetrieval"
retrievalOrchestrator --> sendWithRetrieval : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
SpaceChat --> planService : "calls updatePlanText"
planService --> updatePlanText : "receives"
SpaceChat --> merfolkExtractor : "calls extractMerfolkBlocks"
merfolkExtractor --> extractMerfolkBlocks : "receives"
SpaceChat --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> zenService : "calls fetchRepoContext"
zenService --> fetchRepoContext : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls buildCodeGenMessages"
zenService --> buildCodeGenMessages : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> retrievalOrchestrator : "calls sendWithRetrieval"
retrievalOrchestrator --> sendWithRetrieval : "receives"
SpaceChat --> codeExtractor : "calls extractCodeBlocks"
codeExtractor --> extractCodeBlocks : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls parseSectionedResponse"
zenService --> parseSectionedResponse : "receives"
SpaceChat --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> zenService : "calls fetchRepoContext"
zenService --> fetchRepoContext : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls buildCodeGenMessages"
zenService --> buildCodeGenMessages : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> retrievalOrchestrator : "calls sendWithRetrieval"
retrievalOrchestrator --> sendWithRetrieval : "receives"
SpaceChat --> codeExtractor : "calls extractCodeBlocks"
codeExtractor --> extractCodeBlocks : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls parseSectionedResponse"
zenService --> parseSectionedResponse : "receives"
SpaceChat --> planService : "calls createPlanContainer"
planService --> createPlanContainer : "receives"
SpaceChat --> planService : "calls findPlanTextObjects"
planService --> findPlanTextObjects : "receives"
SpaceChat --> planService : "calls generatePlanTitle"
planService --> generatePlanTitle : "receives"
SpaceChat --> planService : "calls createPlanTextObject"
planService --> createPlanTextObject : "receives"
SpaceChat --> planService : "calls createPlanContainer"
planService --> createPlanContainer : "receives"
SpaceChat --> planService : "calls findPlanTextObjects"
planService --> findPlanTextObjects : "receives"
SpaceChat --> planService : "calls generatePlanTitle"
planService --> generatePlanTitle : "receives"
SpaceChat --> planService : "calls createPlanTextObject"
planService --> createPlanTextObject : "receives"
SpaceChat --> githubRepoService : "calls isGithubAuthenticated"
githubRepoService --> isGithubAuthenticated : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> githubPushService : "calls listBranches"
githubPushService --> listBranches : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> llmProviders : "calls fetchModels"
llmProviders --> fetchModels : "receives"
SpaceChat --> llmProviders : "calls fetchModels"
llmProviders --> fetchModels : "receives"
SpaceChat --> llmProviders : "calls fetchModels"
llmProviders --> fetchModels : "receives"
SpaceChat --> llmProviders : "calls fetchModels"
llmProviders --> fetchModels : "receives"
SpaceChat --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
SpaceChat --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories_2 : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories_2 : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> zenService : "calls fetchRepoContext"
zenService --> fetchRepoContext : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls populateContentStoreWorker"
zenService --> populateContentStoreWorker : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls populateContentStoreWorker"
zenService --> populateContentStoreWorker : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> githubRepoService : "calls scanRepositoryAndGenerateDiagram"
githubRepoService --> scanRepositoryAndGenerateDiagram : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> zenService : "calls fetchRepoContext"
zenService --> fetchRepoContext : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls populateContentStoreWorker"
zenService --> populateContentStoreWorker : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> zenService : "calls populateContentStoreWorker"
zenService --> populateContentStoreWorker : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> githubIssuesService : "calls getBranchRef"
githubIssuesService --> getBranchRef : "receives"
SpaceChat --> githubIssuesService : "calls createBranchRef"
githubIssuesService --> createBranchRef : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> pipelineOrchestrator : "calls getGithubToken"
pipelineOrchestrator --> getGithubToken : "receives"
SpaceChat --> githubIssuesService : "calls getBranchRef"
githubIssuesService --> getBranchRef : "receives"
SpaceChat --> githubIssuesService : "calls createBranchRef"
githubIssuesService --> createBranchRef : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> planService : "calls generatePlanTitle"
planService --> generatePlanTitle : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
SpaceChat --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
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
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> unifiedPerformanceUtils : "calls debounce"
unifiedPerformanceUtils --> debounce : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
Tetrahedron --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
Tetrahedron --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TetrahedronFace --> tetrahedronStore : ".getState()"
tetrahedronStore --> useTetrahedronStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> snappingUtils : "calls calculateAxisSnap"
snappingUtils --> calculateAxisSnap : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> textObjectStore : ".getState()"
textObjectStore --> useTextObjectStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> renderWorkScheduler : "calls isFrameBudgetExhausted"
renderWorkScheduler --> isFrameBudgetExhausted : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
TextObject --> pipelineTaskService : "calls getStatusColor"
pipelineTaskService --> getStatusColor : "receives"
TextObject --> pipelineTaskService : "calls getStatusLabel"
pipelineTaskService --> getStatusLabel : "receives"
TextObject --> githubIssuesService : "calls revertCommit"
githubIssuesService --> revertCommit : "receives"
TextObject --> repoContainerService : "calls toggleTaskExpansion"
repoContainerService --> toggleTaskExpansion : "receives"
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
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls assignRepoSlugToOrphanTasks"
repoContainerService --> assignRepoSlugToOrphanTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineTaskService : "calls getPipelineTasks"
pipelineTaskService --> getPipelineTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> objectsStore : ".getState()"
objectsStore --> useObjectsStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls findRepoContainer"
repoContainerService --> findRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls repositionIncomingTasks"
repoContainerService --> repositionIncomingTasks : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> uiOverlayStore : ".getState()"
uiOverlayStore --> useUIOverlayStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
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
githubRepoService --> fetchRepositories_2 : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".stopRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> screenRecordingService : ".downloadRecording()"
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
UIOverlay --> screenRecordingService : ".startRecording()"
screenRecordingService --> screenRecorder : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialPartitioning : "calls deleteAllCellsInSpace"
spatialPartitioning --> deleteAllCellsInSpace : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialPartitioning : "calls deleteAllCellsInSpace"
spatialPartitioning --> deleteAllCellsInSpace : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls clearAllObjectCaches"
spatialObjectsService --> clearAllObjectCaches : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialObjectsService : "calls cleanupSpatialObjectSubscriptions"
spatialObjectsService --> cleanupSpatialObjectSubscriptions : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> spatialManagerStore : ".getState()"
spatialManagerStore --> useSpatialManagerStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> diagramStore : ".getState()"
diagramStore --> useDiagramStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> codeStore : ".getState()"
codeStore --> useCodeStore : "receives"
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
githubRepoService --> fetchRepositories_2 : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls getGithubOAuthUrl"
githubRepoService --> getGithubOAuthUrl : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> githubRepoService : "calls fetchRepositories"
githubRepoService --> fetchRepositories_2 : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> repoContainerService : "calls createRepoContainer"
repoContainerService --> createRepoContainer : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
EarthSidebarSections --> UIOverlay : "calls out"
UIOverlay --> pipelineStore : ".getState()"
pipelineStore --> usePipelineStore : "receives"
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
LandingApp --> authStore : ".getState()"
authStore --> useAuthStore : "receives"
LandingApp --> authStore : ".getState()"
authStore --> useAuthStore : "receives"
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
App --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
DistanceFilteredConnectionText --> ConnectionsRenderer : "calls out"
ConnectionsRenderer --> connectionStore : "selectConnectionWithFlowPath"
connectionStore --> useConnectionStore : "receives"
Cube --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
Sphere --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
Octahedron --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
OctahedronFace --> octahedronStore : "updateOctahedronFaceColor(), updateOctahedronFaceText(), setOctahedronShowFaceTextInput(), setOctahedronSelectedFace()..."
octahedronStore --> useOctahedronStore : "receives"
Tetrahedron --> objectsStore : "isInitialLoading"
objectsStore --> useObjectsStore : "receives"
TetrahedronFace --> tetrahedronStore : "updateTetrahedronFaceColor(), updateTetrahedronFaceText(), setTetrahedronShowFaceTextInput(), setTetrahedronSelectedFace()..."
tetrahedronStore --> useTetrahedronStore : "receives"
TextObject --> textObjectStore : "updateTextObjectProperty()"
textObjectStore --> useTextObjectStore : "receives"

%% API Endpoints
POST_/import[Endpoint: POST /import]
POST_/delete[Endpoint: POST /delete]
GET_/[Endpoint: GET /]
DELETE_/:id[Endpoint: DELETE /:id]
POST_/[Endpoint: POST /]
PATCH_/:id[Endpoint: PATCH /:id]
POST_/chat[Endpoint: POST /chat]
POST_/models[Endpoint: POST /models]
GET_/:id[Endpoint: GET /:id]
POST_/:id/members[Endpoint: POST /:id/members]
DELETE_/:id/members/:userId[Endpoint: DELETE /:id/members/:userId]
POST_/:id/invites[Endpoint: POST /:id/invites]
GET_/:id/invites[Endpoint: GET /:id/invites]
GET_/:path(*)[Endpoint: GET /:path(*)]
POST_/upload[Endpoint: POST /upload]
PUT_/proxy_upload[Endpoint: PUT /proxy-upload]
GET_/:uid/spaces/:spaceId[Endpoint: GET /:uid/spaces/:spaceId]
GET_/:uid/shared_spaces/:spaceId[Endpoint: GET /:uid/shared-spaces/:spaceId]
POST_/google[Endpoint: POST /google]
POST_/guest[Endpoint: POST /guest]
POST_/refresh[Endpoint: POST /refresh]
GET_/verify[Endpoint: GET /verify]
POST_/code[Endpoint: POST /code]
POST_/github/token[Endpoint: POST /github/token]
GET_/api/health[Endpoint: GET /api/health]
USE_/api/auth[Endpoint: USE /api/auth]
USE_/api/users[Endpoint: USE /api/users]
USE_/api/spaces[Endpoint: USE /api/spaces]
USE_/api/spaces/:spaceId/objects[Endpoint: USE /api/spaces/:spaceId/objects]
USE_/api/spaces/:spaceId/connections[Endpoint: USE /api/spaces/:spaceId/connections]
USE_/api/spaces/:spaceId/cells[Endpoint: USE /api/spaces/:spaceId/cells]
USE_/api/organizations[Endpoint: USE /api/organizations]
USE_/api/storage[Endpoint: USE /api/storage]
USE_/api/bulk[Endpoint: USE /api/bulk]
USE_/api/updates[Endpoint: USE /api/updates]
USE_/api/llm[Endpoint: USE /api/llm]
USE_/api/zen[Endpoint: USE /api/zen]
POST_/scan[Endpoint: POST /scan]
GET_/api/spaces[Endpoint: GET /api/spaces]
POST_/api/spaces[Endpoint: POST /api/spaces]
GET_/api/updates[Endpoint: GET /api/updates]
POST_/api/updates[Endpoint: POST /api/updates]
POST_/api/auth/verify[Endpoint: POST /api/auth/verify]
POST_/api/auth/code[Endpoint: POST /api/auth/code]
POST_/api/auth/github/token[Endpoint: POST /api/auth/github/token]
POST_/api/bulk/import[Endpoint: POST /api/bulk/import]
POST_/api/organizations[Endpoint: POST /api/organizations]
GET_/api/organizations[Endpoint: GET /api/organizations]
POST_/api/zen/scan[Endpoint: POST /api/zen/scan]
GET_/api/auth/verify[Endpoint: GET /api/auth/verify]
POST_/api/auth/google[Endpoint: POST /api/auth/google]
POST_/api/auth/guest[Endpoint: POST /api/auth/guest]
POST_/api/objects/upsert_position[Endpoint: POST /api/objects/upsert-position]

%% API Containment
backend_llm -.-> POST_/chat : "contains"
backend_llm -.-> POST_/models : "contains"
backend_index -.-> GET_/api/health : "contains"
backend_index -.-> USE_/api/auth : "contains"
backend_index -.-> USE_/api/users : "contains"
backend_index -.-> USE_/api/spaces : "contains"
backend_index -.-> USE_/api/spaces/:spaceId/objects : "contains"
backend_index -.-> USE_/api/spaces/:spaceId/connections : "contains"
backend_index -.-> USE_/api/spaces/:spaceId/cells : "contains"
backend_index -.-> USE_/api/organizations : "contains"
backend_index -.-> USE_/api/storage : "contains"
backend_index -.-> USE_/api/bulk : "contains"
backend_index -.-> USE_/api/updates : "contains"
backend_index -.-> USE_/api/llm : "contains"
backend_index -.-> USE_/api/zen : "contains"
authService -.-> POST_/api/auth/verify : "contains"
authService -.-> POST_/api/auth/code : "contains"
githubRepoService -.-> POST_/api/auth/github/token : "contains"
connectionMethods -.-> POST_/api/bulk/import : "contains"
organizationService -.-> POST_/api/organizations : "contains"
organizationService -.-> GET_/api/organizations : "contains"
runtimeScanService -.-> POST_/api/zen/scan : "contains"
webRservice -.-> GET_/api/auth/verify : "contains"
authStore -.-> POST_/api/auth/google : "contains"
authStore -.-> POST_/api/auth/guest : "contains"
objectUpdateHandlers -.-> POST_/api/objects/upsert_position : "contains"

%% API Handler Chains
USE_/api/auth --> authRouter : "handler"
USE_/api/users --> authenticate : "handler"
USE_/api/users --> usersRouter : "handler"
USE_/api/spaces --> authenticate : "handler"
USE_/api/spaces --> spacesRouter : "handler"
USE_/api/spaces/:spaceId/objects --> authenticate : "handler"
USE_/api/spaces/:spaceId/objects --> objectsRouter : "handler"
USE_/api/spaces/:spaceId/connections --> authenticate : "handler"
USE_/api/spaces/:spaceId/connections --> connectionsRouter : "handler"
USE_/api/spaces/:spaceId/cells --> authenticate : "handler"
USE_/api/spaces/:spaceId/cells --> cellsRouter : "handler"
USE_/api/organizations --> authenticate : "handler"
USE_/api/organizations --> organizationsRouter : "handler"
USE_/api/storage --> authenticate : "handler"
USE_/api/storage --> storageRouter : "handler"
USE_/api/bulk --> authenticate : "handler"
USE_/api/bulk --> bulkRouter : "handler"
USE_/api/updates --> authenticate : "handler"
USE_/api/updates --> updatesRouter : "handler"
USE_/api/llm --> llmRouter : "handler"
USE_/api/zen --> authenticate : "handler"
USE_/api/zen --> zenRouter : "handler"
POST_/api/bulk/import --> chunkPayload : "handler"

%% Auth Guards
authenticate_2[Guard: authenticate]
optionalAuth_2[Guard: optionalAuth]
signOut_2[Guard: signOut]

%% Auth Flows
LandingApp --> signOut_2 : "auth check"
LandingApp --> signOut_2 : "auth check"

%% Events
chat:message_event((Service: chat:message))
chat:history_event((Service: chat:history))
signaling:members_event((Service: signaling:members))
signaling:offer_event((Service: signaling:offer))
signaling:answer_event((Service: signaling:answer))
signaling:ice_event((Service: signaling:ice))
close_event((Service: close))
error_event((Service: error))
finish_event((Service: finish))
connection_event((Service: connection))
signaling:join_event((Service: signaling:join))
disconnect_event((Service: disconnect))
change_event((Service: change))
popstate_event((Service: popstate))
connect_error_event((Service: connect_error))
click_event((Service: click))
mousedown_event((Service: mousedown))
pointerdown_event((Service: pointerdown))
keydown_event((Service: keydown))
ended_event((Service: ended))
canplay_event((Service: canplay))
mousemove_event((Service: mousemove))
mouseup_event((Service: mouseup))
space_objects_cleared_event((Service: space_objects_cleared))
screenRecordingStopped_event((Service: screenRecordingStopped))
loadedmetadata_event((Service: loadedmetadata))
wheel_event((Service: wheel))
touchstart_event((Service: touchstart))
touchmove_event((Service: touchmove))
resize_event((Service: resize))
beforeunload_event((Service: beforeunload))
unhandledrejection_event((Service: unhandledrejection))
visibilitychange_event((Service: visibilitychange))
connect_event((Service: connect))

%% Event Flows
error_event --> ScreenShareStream : "listened by"
error_event --> WebcamStream : "listened by"
error_event --> globalOptimizationCoordinator : "listened by"
error_event --> handTrackingService : "listened by"
disconnect_event --> api_client : "listened by"
change_event --> App : "listened by"
change_event --> useSpatialManager : "listened by"
popstate_event --> AppShell : "listened by"
connect_error_event --> api_client : "listened by"
click_event --> BVHIntegration_2 : "listened by"
mousedown_event --> BVHIntegration_2 : "listened by"
mousedown_event --> ObjectSearch : "listened by"
mousedown_event --> LandingTopBar : "listened by"
mousedown_event --> OrgMemberDropdown : "listened by"
pointerdown_event --> BVHIntegration_2 : "listened by"
keydown_event --> CodeWorkspace : "listened by"
keydown_event --> ObjectSearch : "listened by"
ended_event --> ScreenShareStream : "listened by"
ended_event --> screenRecordingService : "listened by"
canplay_event --> ScreenShareStream : "listened by"
canplay_event --> WebcamStream : "listened by"
mousemove_event --> SpaceChat : "listened by"
mouseup_event --> SpaceChat : "listened by"
space_objects_cleared_event --> SpaceChat : "listened by"
screenRecordingStopped_event --> EarthSidebarSections : "listened by"
loadedmetadata_event --> WebcamStream : "listened by"
loadedmetadata_event --> handTrackingService : "listened by"
wheel_event --> LandingApp : "listened by"
touchstart_event --> LandingApp : "listened by"
touchmove_event --> LandingApp : "listened by"
resize_event --> useWindowSize : "listened by"
beforeunload_event --> globalOptimizationCoordinator : "listened by"
beforeunload_event --> globalSubscriptionManager : "listened by"
unhandledrejection_event --> globalOptimizationCoordinator : "listened by"
visibilitychange_event --> handTrackingService : "listened by"
connect_event --> webRservice : "listened by"
```
