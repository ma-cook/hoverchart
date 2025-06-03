import {
  Line,
  TransformControls as DreiTransformControls,
  Html,
} from '@react-three/drei';
import { Vector3 } from 'three';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import TextSprite from './TextSprite';
import FaceTextInput from './FaceTextInput';
import TextStyleUI from './TextStyleUI';
import HeaderInput from './HeaderInput';
import FaceIndicator from './FaceIndicator';
import WebcamStream from './WebcamStream';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { debounce } from 'lodash';

const UPDATE_DEBOUNCE_TIME = 500;

const Plane = ({
  position = [0, 0, 0],
  selected,
  onClick,
  onIndicatorSelected,
  onIndicatorDeselected,
  onFaceIndicatorClick,
  showAllIndicators,
  globalIndicatorSelected,
  connections,
  selectedIndicators,
  indicatorMode,
  id,
  onUpdate,
  onDelete,
  scale: initialScale = [1, 1, 1],
  color: initialColor = null,
  headerText: initialHeaderText = '',
  borderStyle: initialBorderStyle = 'solid',
  borderColor: initialBorderColor = 'black',
  lineThickness: initialLineThickness = 1,
  headerStyle: initialHeaderStyle = {
    fontSize: 1.5,
    color: 'black',
    underline: false,
  },
  faceText: initialFaceText = '',
  faceTextStyle: initialFaceTextStyle = {
    fontSize: 0.5,
    color: 'black',
    underline: false,
  },
  onTransformStart,
  onTransformEnd,
  webcamActive: initialWebcamActive = false,
  user,
  currentSpaceId,
}) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const contentRef = useRef();
  const { camera } = useThree();
  const size = 5;

  const [webcamActive, setWebcamActive] = useState(initialWebcamActive);
  const [webcamInitialized, setWebcamInitialized] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showTextStyleUI, setShowTextStyleUI] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showHeaderStyleUI, setShowHeaderStyleUI] = useState(false);
  const [indicatorSelected, setIndicatorSelected] = useState(false);

  const [currentScale, setCurrentScale] = useState(initialScale);
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [currentHeaderText, setCurrentHeaderText] = useState(initialHeaderText);
  const [currentHeaderStyle, setCurrentHeaderStyle] =
    useState(initialHeaderStyle);
  const [currentBorderStyle, setCurrentBorderStyle] =
    useState(initialBorderStyle);
  const [currentBorderColor, setCurrentBorderColor] =
    useState(initialBorderColor);
  const [currentLineThickness, setCurrentLineThickness] =
    useState(initialLineThickness);
  const [currentFaceText, setCurrentFaceText] = useState(initialFaceText);
  const [currentFaceTextStyle, setCurrentFaceTextStyle] =
    useState(initialFaceTextStyle);

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isViewingBroadcast, setIsViewingBroadcast] = useState(false);
  const [broadcastInfo, setBroadcastInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  const lastWebcamStateRef = useRef(initialWebcamActive);
  const lastWorldPosRef = useRef(null);
  const lastBroadcastSeenRef = useRef(Date.now());
  const scaleTimeoutRef = useRef(null);
  const pendingScaleRef = useRef(null);
  const isTransformingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCurrentScale(initialScale);
    setCurrentColor(initialColor);
    setCurrentHeaderText(initialHeaderText);
    setCurrentBorderStyle(initialBorderStyle);
    setCurrentBorderColor(initialBorderColor);
    setCurrentLineThickness(initialLineThickness);
    setCurrentHeaderStyle(initialHeaderStyle);
    setCurrentFaceText(initialFaceText);
    setCurrentFaceTextStyle(initialFaceTextStyle);

    if (initialWebcamActive !== lastWebcamStateRef.current) {
      setWebcamActive(initialWebcamActive);
      lastWebcamStateRef.current = initialWebcamActive;
      if (initialWebcamActive && !webcamInitialized) {
        setWebcamInitialized(true);
      }
    } else if (initialWebcamActive && !webcamInitialized) {
      setWebcamInitialized(true);
      setWebcamActive(true);
      lastWebcamStateRef.current = true;
    }
  }, [
    id,
    initialScale,
    initialColor,
    initialHeaderText,
    initialBorderStyle,
    initialBorderColor,
    initialLineThickness,
    initialHeaderStyle,
    initialFaceText,
    initialFaceTextStyle,
    initialWebcamActive,
    webcamInitialized,
  ]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  useEffect(() => {
    if (!selected) {
      closeAllUIs();
      setIndicatorSelected(false);
      onIndicatorDeselected?.();
    } else if (!indicatorSelected) {
      setShowUI(true);
    }
  }, [selected, indicatorSelected, onIndicatorDeselected, closeAllUIs]);

  useEffect(() => {
    if (groupRef.current && contentRef.current) {
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      lastWorldPosRef.current = [worldPos.x, worldPos.y, worldPos.z];
    }
  }, [position, currentScale]);

  const debouncedUpdate = useMemo(
    () =>
      debounce((updates) => {
        if (onUpdate && id && isMountedRef.current) {
          onUpdate(id, { type: 'plane', ...updates });
        }
      }, UPDATE_DEBOUNCE_TIME),
    [onUpdate, id]
  );

  useEffect(() => {
    if (!isMountedRef.current) return;

    const updates = {
      scale: currentScale,
      color: currentColor,
      headerText: currentHeaderText,
      headerStyle: currentHeaderStyle,
      borderStyle: currentBorderStyle,
      borderColor: currentBorderColor,
      lineThickness: currentLineThickness,
      faceText: currentFaceText,
      faceTextStyle: currentFaceTextStyle,
      webcamActive,
      broadcasting: webcamActive && isBroadcasting,
    };
    debouncedUpdate(updates);

    return () => {
      debouncedUpdate.cancel();
    };
  }, [
    currentScale,
    currentColor,
    currentHeaderText,
    currentHeaderStyle,
    currentBorderStyle,
    currentBorderColor,
    currentLineThickness,
    currentFaceText,
    currentFaceTextStyle,
    webcamActive,
    isBroadcasting,
    debouncedUpdate,
  ]);

  const handleScale = useCallback(
    (e) => {
      if (!e.target || !e.target.object) return;
      pendingScaleRef.current = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        currentScale[2],
      ];
      isTransformingRef.current = true;
      if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
      scaleTimeoutRef.current = setTimeout(() => {
        if (pendingScaleRef.current && isMountedRef.current) {
          setCurrentScale(pendingScaleRef.current);
          pendingScaleRef.current = null;
        }
      }, 50);
    },
    [currentScale]
  );

  useEffect(() => {
    if (isTransformingRef.current && !pendingScaleRef.current) {
      isTransformingRef.current = false;
      if (onTransformEnd) {
        onTransformEnd(id);
      }
    }
    return () => {
      if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
    };
  }, [currentScale, onTransformEnd, id]);

  const handleDrag = useCallback(
    (e) => {
      if (!groupRef.current || !onUpdate) return;

      const newPos = e.target.object.position;
      groupRef.current.position.copy(newPos);

      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);
      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);
      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);
      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      lastWorldPosRef.current = worldPosArray;
      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      groupRef.current.userData = {
        ...groupRef.current.userData,
        isPlane: true,
        objectId: String(id),
        id: String(id),
        indicatorOffset: [0, -5 * currentScale[1], 0],
        indicatorWorldPosition: worldPosArray,
        worldPosition: worldPosArray,
        facePosition: worldPosArray,
        isMoving: true,
        _lastUpdateTime: Date.now(),
        _isDragging: true,
      };

      onUpdate(id, {
        type: 'plane',
        position: [newPos.x, newPos.y, newPos.z],
        worldPosition: worldPosArray,
        planeData: {
          worldMatrix,
          position: [newPos.x, newPos.y, newPos.z],
          scale: currentScale,
          offset: [0, -5 * currentScale[1], 0],
        },
        _isDragging: true,
        _indicatorWorldPosition: worldPosArray,
      });
    },
    [onUpdate, id, currentScale]
  );

  const handleTransformStart = useCallback(() => {
    if (window.orbitControls) window.orbitControls.enabled = false;
    if (onTransformStart) onTransformStart(id);
  }, [onTransformStart, id]);

  const handleTransformEnd = useCallback(() => {
    if (window.orbitControls) window.orbitControls.enabled = true;

    if (groupRef.current && onUpdate) {
      const newPos = groupRef.current.position;
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);
      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);
      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);
      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      debouncedUpdate.flush();
      onUpdate(id, {
        type: 'plane',
        position: [newPos.x, newPos.y, newPos.z],
        worldPosition: worldPosArray,
        planeData: {
          worldMatrix,
          position: [newPos.x, newPos.y, newPos.z],
          scale: currentScale,
          offset: [0, -5 * currentScale[1], 0],
        },
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
        webcamActive,
        broadcasting: webcamActive && isBroadcasting,
        _finalPosition: true,
        _indicatorWorldPosition: worldPosArray,
      });
    }

    if (onTransformEnd) onTransformEnd(id);
  }, [
    onUpdate,
    id,
    currentScale,
    currentColor,
    currentHeaderText,
    currentHeaderStyle,
    currentBorderStyle,
    currentBorderColor,
    currentLineThickness,
    currentFaceText,
    currentFaceTextStyle,
    webcamActive,
    isBroadcasting,
    onTransformEnd,
    debouncedUpdate,
  ]);

  const closeAllUIs = useCallback(() => {
    setShowTextStyleUI(false);
    setShowUI(false);
    setShowTextInput(false);
    setShowTransform(false);
    setIsResizing(false);
    setShowHeader(false);
    setShowHeaderStyleUI(false);
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick();
      if (!selected) {
        closeAllUIs();
      }
      setShowUI(true);
    },
    [onClick, selected, closeAllUIs]
  );

  const handleTextClick = useCallback(() => {
    closeAllUIs();
    setShowTextInput(true);
  }, [closeAllUIs]);

  const handleTextSubmit = useCallback(
    (newText) => {
      setCurrentFaceText(newText);
      closeAllUIs();
    },
    [closeAllUIs]
  );

  const handleTextStyleChange = useCallback((newStyle) => {
    setCurrentFaceTextStyle((prev) => ({ ...prev, ...newStyle }));
  }, []);

  const handleTextSpriteClick = useCallback(
    (e) => {
      e.stopPropagation();
      closeAllUIs();
      setShowTextStyleUI(true);
    },
    [closeAllUIs]
  );

  const handleTransformToggle = useCallback(() => {
    setShowTransform((prev) => !prev);
    setShowUI(false);
  }, []);

  const handleResizeToggle = useCallback(() => {
    setIsResizing((prev) => {
      if (!prev) setShowTransform(false);
      return !prev;
    });
    setShowUI(false);
  }, []);

  const handleColorChange = useCallback((newColor) => {
    setCurrentColor(newColor);
  }, []);

  const handleHeaderToggle = useCallback(() => {
    closeAllUIs();
    setShowHeader(true);
  }, [closeAllUIs]);

  const handleHeaderSubmit = useCallback((text) => {
    setCurrentHeaderText(text);
    setShowHeader(false);
  }, []);

  const handleHeaderTextClick = useCallback(
    (e) => {
      e.stopPropagation();
      closeAllUIs();
      setShowHeaderStyleUI(true);
      setShowUI(false);
    },
    [closeAllUIs]
  );

  const handleHeaderStyleChange = useCallback((newStyle) => {
    setCurrentHeaderStyle((prev) => ({ ...prev, ...newStyle }));
  }, []);

  const handleBorderToggle = useCallback((option) => {
    if (option.type === 'style') {
      setCurrentBorderStyle(option.value);
    } else if (option.type === 'color') {
      setCurrentBorderColor(option.value);
    } else if (option.type === 'thickness') {
      setCurrentLineThickness((prev) => (prev >= 6 ? 1 : prev + 2));
    }
  }, []);

  const handleIndicatorClick = useCallback(
    (e) => {
      e.stopPropagation();
      try {
        const planeRef = contentRef.current || groupRef.current;
        if (!planeRef) return;
        planeRef.updateWorldMatrix(true, false);
        const worldMatrix = planeRef.matrixWorld.clone();
        const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);
        const worldPos = new THREE.Vector3();
        planeRef.getWorldPosition(worldPos);
        offset.applyQuaternion(planeRef.quaternion);
        worldPos.add(offset);
        const positionArray = [worldPos.x, worldPos.y, worldPos.z];
        const stringId = String(id);
        const indicator = {
          type: 'plane',
          position: positionArray,
          worldPosition: positionArray,
          facePosition: positionArray,
          faceCenter: positionArray,
          face: 'bottom',
          plane: planeRef,
          scale: [...currentScale],
          planeData: {
            position: [...position],
            scale: [...currentScale],
            worldMatrix: Array.from(worldMatrix.elements),
            offset: [0, -5 * currentScale[1], 0],
          },
          cube: {
            id: stringId,
            position,
            scale: currentScale,
            userData: {
              objectId: stringId,
              planeRef: planeRef,
              indicatorPosition: positionArray,
            },
          },
          id: stringId,
          objectId: stringId,
        };
        setIndicatorSelected(true);
        onIndicatorSelected?.();
        onFaceIndicatorClick?.(indicator);
      } catch (error) {
        console.error('Error in handleIndicatorClick:', error);
      }
    },
    [id, currentScale, position, onIndicatorSelected, onFaceIndicatorClick]
  );

  const isIndicatorConnected = useMemo(() => {
    return connections?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
  }, [connections]);

  const shouldShowIndicator = useMemo(() => {
    if (selectedIndicators?.length > 0) return true;
    if (indicatorMode === 'indicators') return true;
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected) return true;
    if (indicatorSelected) return true;
    if (selected) return true;
    return false;
  }, [
    selectedIndicators,
    indicatorMode,
    showAllIndicators,
    globalIndicatorSelected,
    isIndicatorConnected,
    indicatorSelected,
    selected,
  ]);

  useEffect(() => {
    if (!currentSpaceId || !id || !user || !window.currentSpaceOwner) return;

    if (webcamActive || isViewingBroadcast) {
      if (isViewingBroadcast && webcamActive) {
        setIsViewingBroadcast(false);
        setBroadcastInfo(null);
      }
      return;
    }

    const planeRef = doc(
      db,
      'users',
      window.currentSpaceOwner,
      'spaces',
      currentSpaceId,
      'objects',
      id
    );

    const unsubscribe = onSnapshot(
      planeRef,
      (docSnap) => {
        if (!isMountedRef.current || webcamActive) return;

        const data = docSnap.exists() ? docSnap.data() : null;
        const isRemoteBroadcastingNow =
          data?.broadcasting === true && data?.broadcasterId !== user.uid;
        const newBroadcastId = data?.broadcastId || null;
        const newBroadcasterId = data?.broadcasterId || null;

        if (isRemoteBroadcastingNow && newBroadcastId && newBroadcasterId) {
          lastBroadcastSeenRef.current = Date.now();

          const newBroadcastInfo = {
            broadcastId: newBroadcastId,
            broadcasterId: newBroadcasterId,
            planeId: id,
          };

          if (!isEqual(broadcastInfo, newBroadcastInfo)) {
            setBroadcastInfo(newBroadcastInfo);
            if (!isViewingBroadcast) {
              setIsViewingBroadcast(true);
            }
          }
        } else {
          if (isViewingBroadcast) {
            const now = Date.now();
            if (now - lastBroadcastSeenRef.current > 5000) {
              setBroadcastInfo(null);
              setIsViewingBroadcast(false);
            }
          } else if (broadcastInfo !== null) {
            setBroadcastInfo(null);
          }
        }
      },
      () => {
        if (isViewingBroadcast && isMountedRef.current) {
          const now = Date.now();
          if (now - lastBroadcastSeenRef.current > 10000) {
            setBroadcastInfo(null);
            setIsViewingBroadcast(false);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [
    currentSpaceId,
    id,
    user,
    webcamActive,
    isViewingBroadcast,
    broadcastInfo,
  ]);

  const handleBroadcastStopped = useCallback(() => {
    if (!isMountedRef.current) return;
    if (isBroadcasting) {
      setIsBroadcasting(false);
      setViewerCount(0);
      onUpdate?.(id, {
        type: 'plane',
        broadcasting: false,
        broadcastId: null,
        webcamActive: false,
      });
    }
  }, [onUpdate, id, isBroadcasting]);

  const handleWebcamToggle = useCallback(() => {
    const currentWebcamState = webcamActive;
    const newWebcamState = !currentWebcamState;

    if (newWebcamState) {
      setWebcamInitialized(true);

      if (
        confirm(
          'Do you want to broadcast this webcam to other users in this space?'
        )
      ) {
        setWebcamActive(true);
        setIsBroadcasting(true);
        lastWebcamStateRef.current = true;
      } else {
        setWebcamActive(true);
        setIsBroadcasting(false);
        lastWebcamStateRef.current = true;
      }
    } else {
      if (isBroadcasting) {
        handleBroadcastStopped();
      }
      setWebcamActive(false);
      setIsBroadcasting(false);
      setIsViewingBroadcast(false);
      setBroadcastInfo(null);
      lastWebcamStateRef.current = false;
    }

    setShowUI(false);
  }, [webcamActive, isBroadcasting, handleBroadcastStopped]);

  const handleBroadcastStarted = useCallback(
    (info) => {
      if (!info || !info.broadcastId || !isMountedRef.current) return;
      if (!isBroadcasting) setIsBroadcasting(true);
      onUpdate?.(id, {
        type: 'plane',
        broadcasting: true,
        broadcasterId: user?.uid,
        broadcastId: info.broadcastId,
        broadcastStarting: false,
        webcamActive: true,
      });
    },
    [onUpdate, id, user?.uid, isBroadcasting]
  );

  const handleViewerCountChange = useCallback((count) => {
    if (isMountedRef.current) {
      setViewerCount(count);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isBroadcasting) {
        handleBroadcastStopped();
      }
    };
  }, [isBroadcasting, handleBroadcastStopped]);

  const uiPositions = useMemo(() => {
    const planeHeight = 10 * currentScale[1];
    const verticalOffset = planeHeight / 2;
    const zOffset = 0.1;
    return {
      faceUI: [0, verticalOffset + 2, zOffset + 0.1],
      headerInput: [0, verticalOffset + 4, zOffset],
      headerText: [0, verticalOffset + 4, zOffset],
      textSprite: [0, 0, zOffset],
      textStyleUI: [0, 6, zOffset + 2],
      headerStyleUI: [0, verticalOffset + 6, zOffset + 2],
      textInput: [0, 3, zOffset + 2],
    };
  }, [currentScale]);

  const indicatorPosition = useMemo(() => [0, -size - 1, 0], []);
  const meshMaterial = useMemo(
    () => (
      <meshBasicMaterial
        color={currentColor || (selected ? '#99ccff' : 'black')}
        transparent
        opacity={currentColor ? 1 : selected ? 0.1 : 0}
        depthWrite={!!currentColor}
        side={THREE.DoubleSide}
        needsUpdate={true}
      />
    ),
    [currentColor, selected]
  );

  const lineMaterialProps = useMemo(
    () => ({
      color: selected ? 'blue' : currentBorderColor,
      lineWidth: currentLineThickness,
      dashed: currentBorderStyle !== 'solid',
      dashScale: currentBorderStyle === 'dotted' ? 1 : 2,
      dashSize: currentBorderStyle === 'dotted' ? 0.1 : 1,
      gapSize: currentBorderStyle === 'dotted' ? 0.1 : 0.5,
    }),
    [selected, currentBorderColor, currentLineThickness, currentBorderStyle]
  );

  const points = useMemo(
    () => [
      new Vector3(-size, -size, 0),
      new Vector3(size, -size, 0),
      new Vector3(size, size, 0),
      new Vector3(-size, size, 0),
      new Vector3(-size, -size, 0),
    ],
    []
  );

  return (
    <>
      <group ref={groupRef} position={position}>
        <group ref={contentRef} scale={currentScale}>
          <mesh ref={meshRef} onClick={handleClick}>
            <planeGeometry args={[size * 2, size * 2]} />
            {meshMaterial}
          </mesh>

          {(webcamActive || isViewingBroadcast) &&
            (webcamInitialized || isViewingBroadcast) && (
              <WebcamStream
                key={`${id}-${broadcastInfo?.broadcastId || 'local'}`}
                meshRef={meshRef}
                active={webcamActive || isViewingBroadcast}
                userId={user?.uid}
                spaceId={currentSpaceId}
                planeId={id}
                isBroadcasting={webcamActive && isBroadcasting}
                isReceiving={isViewingBroadcast}
                broadcastData={broadcastInfo}
                onBroadcastStarted={handleBroadcastStarted}
                onBroadcastStopped={handleBroadcastStopped}
                onViewerCountChange={handleViewerCountChange}
              />
            )}
          {webcamActive && !webcamInitialized && (
            <Html center position={[0, 0, 0.1]}>
              <div className="initializing-cam">Initializing...</div>
            </Html>
          )}

          <Line points={points} {...lineMaterialProps} />

          {shouldShowIndicator && (
            <FaceIndicator
              position={indicatorPosition}
              onClick={handleIndicatorClick}
              isActive={indicatorSelected || isIndicatorConnected}
            />
          )}

          {currentFaceText && (
            <TextSprite
              text={currentFaceText}
              position={uiPositions.textSprite}
              style={currentFaceTextStyle}
              onClick={handleTextSpriteClick}
              billboard={false}
            />
          )}
        </group>

        {selected && showUI && (
          <FaceUI
            position={uiPositions.faceUI}
            onColorChange={handleColorChange}
            onTextClick={handleTextClick}
            isPlane={true}
            onTransformToggle={handleTransformToggle}
            onResizeToggle={handleResizeToggle}
            onHeaderToggle={handleHeaderToggle}
            onBorderToggle={handleBorderToggle}
            followTarget={groupRef}
            onDelete={() => onDelete?.(id)}
            onWebcamToggle={handleWebcamToggle}
            webcamActive={webcamActive}
            isBroadcasting={isBroadcasting}
            viewerCount={viewerCount}
          />
        )}

        {showTextInput && (
          <FaceTextInput
            position={uiPositions.textInput}
            onTextSubmit={handleTextSubmit}
            followTarget={groupRef}
          />
        )}

        {showTextStyleUI && (
          <TextStyleUI
            position={uiPositions.textStyleUI}
            onStyleChange={handleTextStyleChange}
            onClose={closeAllUIs}
            followTarget={groupRef}
          />
        )}

        {showHeader && (
          <HeaderInput
            position={uiPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            followTarget={groupRef}
          />
        )}
        {showHeaderStyleUI && (
          <TextStyleUI
            position={uiPositions.headerStyleUI}
            onStyleChange={handleHeaderStyleChange}
            onClose={() => {
              setShowHeaderStyleUI(false);
              setShowUI(true);
            }}
            followTarget={groupRef}
            uiType="header"
          />
        )}
      </group>

      {currentHeaderText && (
        <TextSprite
          text={currentHeaderText}
          position={position}
          offset={uiPositions.headerText}
          followTarget={groupRef}
          onClick={handleHeaderTextClick}
          style={currentHeaderStyle}
          billboard={true}
        />
      )}

      {selected && isResizing && contentRef.current && (
        <DreiTransformControls
          key={`scale-${id}`}
          object={contentRef.current}
          onObjectChange={handleScale}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
          mode="scale"
          space="local"
          showZ={false}
        />
      )}
      {selected && showTransform && groupRef.current && (
        <DreiTransformControls
          key={`translate-${id}`}
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleDrag}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
        />
      )}
    </>
  );
};

export default Plane;
