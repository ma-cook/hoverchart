import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { TransformControls as DreiTransformControls } from '@react-three/drei';
import * as THREE from 'three';
import OctahedronFace from './OctahedronFace';
import { useFaceIndicatorStore } from '../stores';
import AtlasTextSprite from './AtlasTextSprite';
import ObjectUI from './ObjectUI';
import HeaderInput from './HeaderInput';

const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const shallowObjEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return a === b;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};
import TextStyleUI from './TextStyleUI';
import InstancedLine from './InstancedLine';
import { octahedronTransformMap } from './GlobalOctahedronEdgesRenderer';
import isEqual from 'lodash/isEqual';
import {
  useOctahedronStore,
  useObjectsStore,
  getObjectById,
  useConnectionStore,
  useIndicatorsStore,
} from '../stores';
import { shallow } from 'zustand/shallow';

const HITBOX_MATERIAL = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { calculateAxisSnap } from '../utils/snappingUtils';
import SnapLineIndicator from './SnapLineIndicator';
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import { debounce } from '../utils/unifiedPerformanceUtils';

const EMPTY_CONNECTIONS = [];

const OCTAHEDRON_SIZE = 5;

const octahedronVertices = [
  [0, OCTAHEDRON_SIZE, 0],
  [OCTAHEDRON_SIZE, 0, 0],
  [0, 0, OCTAHEDRON_SIZE],
  [-OCTAHEDRON_SIZE, 0, 0],
  [0, 0, -OCTAHEDRON_SIZE],
  [0, -OCTAHEDRON_SIZE, 0],
];

const _createTriangleGeometry = (vertices) => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(vertices.flat());
  const normals = new Float32Array(9);
  const uvs = new Float32Array([0.5, 1.0, 0.0, 0.0, 1.0, 0.0]);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const v1x = vertices[0][0], v1y = vertices[0][1], v1z = vertices[0][2];
  const v2x = vertices[1][0], v2y = vertices[1][1], v2z = vertices[1][2];
  const v3x = vertices[2][0], v3y = vertices[2][1], v3z = vertices[2][2];
  const e1x = v2x - v1x, e1y = v2y - v1y, e1z = v2z - v1z;
  const e2x = v3x - v1x, e2y = v3y - v1y, e2z = v3z - v1z;
  let nx = e1y * e2z - e1z * e2y;
  let ny = e1z * e2x - e1x * e2z;
  let nz = e1x * e2y - e1y * e2x;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len > 0) { nx /= len; ny /= len; nz /= len; }

  for (let i = 0; i < 3; i++) {
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;
  }

  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  const indices = new Uint16Array([0, 1, 2]);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.frustumCulled = false;
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
};

const SHARED_OCTAHEDRON_FACES = {
  f0: _createTriangleGeometry([octahedronVertices[0], octahedronVertices[1], octahedronVertices[2]]),
  f1: _createTriangleGeometry([octahedronVertices[0], octahedronVertices[2], octahedronVertices[3]]),
  f2: _createTriangleGeometry([octahedronVertices[0], octahedronVertices[3], octahedronVertices[4]]),
  f3: _createTriangleGeometry([octahedronVertices[0], octahedronVertices[4], octahedronVertices[1]]),
  f4: _createTriangleGeometry([octahedronVertices[5], octahedronVertices[2], octahedronVertices[1]]),
  f5: _createTriangleGeometry([octahedronVertices[5], octahedronVertices[3], octahedronVertices[2]]),
  f6: _createTriangleGeometry([octahedronVertices[5], octahedronVertices[4], octahedronVertices[3]]),
  f7: _createTriangleGeometry([octahedronVertices[5], octahedronVertices[1], octahedronVertices[4]]),
};

const getFaceIndicatorProps = (faceName) => {
  const v = octahedronVertices;

  const faceVertices = {
    f0: [v[0], v[1], v[2]],
    f1: [v[0], v[2], v[3]],
    f2: [v[0], v[3], v[4]],
    f3: [v[0], v[4], v[1]],
    f4: [v[5], v[2], v[1]],
    f5: [v[5], v[3], v[2]],
    f6: [v[5], v[4], v[3]],
    f7: [v[5], v[1], v[4]],
  };

  const verts = faceVertices[faceName] || [v[0], v[1], v[2]];
  const center = [
    (verts[0][0] + verts[1][0] + verts[2][0]) / 3,
    (verts[0][1] + verts[1][1] + verts[2][1]) / 3,
    (verts[0][2] + verts[1][2] + verts[2][2]) / 3,
  ];

  const faceNormals = {
    f0: [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)],
    f1: [-1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)],
    f2: [-1 / Math.sqrt(3), 1 / Math.sqrt(3), -1 / Math.sqrt(3)],
    f3: [1 / Math.sqrt(3), 1 / Math.sqrt(3), -1 / Math.sqrt(3)],
    f4: [1 / Math.sqrt(3), -1 / Math.sqrt(3), 1 / Math.sqrt(3)],
    f5: [-1 / Math.sqrt(3), -1 / Math.sqrt(3), 1 / Math.sqrt(3)],
    f6: [-1 / Math.sqrt(3), -1 / Math.sqrt(3), -1 / Math.sqrt(3)],
    f7: [1 / Math.sqrt(3), -1 / Math.sqrt(3), -1 / Math.sqrt(3)],
  };

  const normal = faceNormals[faceName] || [0, 1, 0];

  return {
    position: center,
    rotation: [0, 0, 0],
    normal,
  };
};

const Octahedron = ({
  id,
  selected,
  onClick,
  onFaceIndicatorClick,
  onFaceClick,
  showAllCubesIndicators,
  globalIndicatorSelected,
  indicatorMode,
  selectedIndicators = [],
  setActiveTextStyleUI,
  onUpdate,
  onDelete,
  onTransformStart,
  onTransformEnd,
  onMove,
  lineWidth,
  renderEdges = true,
  onCodeToggle,
}) => {
  const DEFAULT_COLOR = '#000000';

  const octahedronFaces = useMemo(
    () => [
      { name: 'f0', normal: [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)] },
      { name: 'f1', normal: [-1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)] },
      { name: 'f2', normal: [-1 / Math.sqrt(3), 1 / Math.sqrt(3), -1 / Math.sqrt(3)] },
      { name: 'f3', normal: [1 / Math.sqrt(3), 1 / Math.sqrt(3), -1 / Math.sqrt(3)] },
      { name: 'f4', normal: [1 / Math.sqrt(3), -1 / Math.sqrt(3), 1 / Math.sqrt(3)] },
      { name: 'f5', normal: [-1 / Math.sqrt(3), -1 / Math.sqrt(3), 1 / Math.sqrt(3)] },
      { name: 'f6', normal: [-1 / Math.sqrt(3), -1 / Math.sqrt(3), -1 / Math.sqrt(3)] },
      { name: 'f7', normal: [1 / Math.sqrt(3), -1 / Math.sqrt(3), -1 / Math.sqrt(3)] },
    ],
    []
  );
  const setIndicatorActive = useFaceIndicatorStore(
    (state) => state.setIndicatorActive
  );

  const octahedronTriangleFaces = SHARED_OCTAHEDRON_FACES;

  const objectData = useObjectsStore(
    useCallback((state) => getObjectById(state, id), [id])
  );

  const hasCode = objectData?.metadata?.code != null;

  const position = React.useMemo(
    () => objectData?.position || [0, 0, 0],
    [objectData?.position]
  );
  const scale = React.useMemo(
    () => objectData?.scale || [1, 1, 1],
    [objectData?.scale]
  );
  const color = objectData?.color || DEFAULT_COLOR;
  const headerText = objectData?.headerText || '';
  const textStyle = React.useMemo(
    () => objectData?.textStyle || { fontSize: 1.5, color: 'black' },
    [objectData?.textStyle]
  );
  const faceColors = React.useMemo(
    () => objectData?.faceColors || {},
    [objectData?.faceColors]
  );
  const faceTexts = React.useMemo(
    () => objectData?.faceTexts || {},
    [objectData?.faceTexts]
  );
  const faceTextStyles = React.useMemo(
    () => objectData?.faceTextStyles || {},
    [objectData?.faceTextStyles]
  );

  const connectionsFromStore = useConnectionStore(
    useCallback(
      (state) => state.connectionsByObjectId.get(String(id)) || EMPTY_CONNECTIONS,
      [id]
    ),
    shallow
  );

  const contentRef = useRef();
  const meshRef = useRef();

  const debouncedUpdate = useMemo(
    () =>
      debounce((id, updateData) => {
        if (onUpdate) {
          onUpdate(id, updateData);
        }
      }, 300),
    [onUpdate]
  );

  const lodLevel = useLODStore(
    useCallback((state) => state.getLODLevel(id), [id])
  );
  const isChildOfContainer = useLODStore(
    useCallback((state) => state.isChildOfContainer(id), [id])
  );
  const isParentObject = useLODStore(
    useCallback((state) => state.isParent(id), [id])
  );
  const showFaceText = useLODStore(
    useCallback((state) => state.faceTextVisible.get(id) !== false, [id])
  );

  const octahedronState = useOctahedronStore((state) => ({
    octahedron: state.getOctahedron(id),
    isSelected: state.isOctahedronSelected(id),
    faceColors: state.getOctahedron(id)?.faceColors,
    faceTexts: state.getOctahedron(id)?.faceTexts,
    faceTextStyles: state.getOctahedron(id)?.faceTextStyles,
    selectedFace: state.getOctahedron(id)?.selectedFace,
    selectedIndicator: state.getOctahedron(id)?.selectedIndicator,
    showTransform: state.getOctahedron(id)?.showTransform,
    showHeader: state.getOctahedron(id)?.showHeader,
    showFaceTextInput: state.getOctahedron(id)?.showFaceTextInput,
    isResizing: state.getOctahedron(id)?.isResizing,
    showObjectUI: state.getOctahedron(id)?.showObjectUI,
    showHeaderTextStyleUI: state.getOctahedron(id)?.showHeaderTextStyleUI,
    activeTextFace: state.getOctahedron(id)?.activeTextFace,
    color: state.getOctahedron(id)?.color,
    headerText: state.getOctahedron(id)?.headerText,
    textStyle: state.getOctahedron(id)?.textStyle,
    scale: state.getOctahedron(id)?.scale,
    showSnapLine: state.getOctahedron(id)?.showSnapLine,
    snapLinePoints: state.getOctahedron(id)?.snapLinePoints,
    snapAxis: state.getOctahedron(id)?.snapAxis,
  }));

  const octahedronActions = useOctahedronStore((state) => ({
    createOctahedron: state.createOctahedron,
    updateOctahedron: state.updateOctahedron,
    selectOctahedron: state.selectOctahedron,
    deselectOctahedron: state.deselectOctahedron,
    setOctahedronSelectedFace: state.setOctahedronSelectedFace,
    setOctahedronSelectedIndicator: state.setOctahedronSelectedIndicator,
    setOctahedronShowTransform: state.setOctahedronShowTransform,
    setOctahedronShowHeader: state.setOctahedronShowHeader,
    setOctahedronShowFaceTextInput: state.setOctahedronShowFaceTextInput,
    setOctahedronIsResizing: state.setOctahedronIsResizing,
    setOctahedronShowObjectUI: state.setOctahedronShowObjectUI,
    setOctahedronShowHeaderTextStyleUI: state.setOctahedronShowHeaderTextStyleUI,
    setOctahedronActiveTextFace: state.setOctahedronActiveTextFace,
    updateOctahedronFaceColor: state.updateOctahedronFaceColor,
    updateOctahedronFaceText: state.updateOctahedronFaceText,
    updateOctahedronFaceTextStyle: state.updateOctahedronFaceTextStyle,
  }));

  const hoveredObjectId = useIndicatorsStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useIndicatorsStore(
    (state) => state.setHoveredObjectId
  );

  useEffect(() => {
    if (!octahedronState.octahedron) {
      octahedronActions.createOctahedron(id, {
        position,
        scale,
        color,
        faceColors,
        faceTexts,
        headerText,
        textStyle,
        faceTextStyles,
      });
    }
  }, [
    id, octahedronState.octahedron, octahedronActions.createOctahedron,
    position, scale, color, faceColors, faceTexts, headerText, textStyle, faceTextStyles,
  ]);

  useEffect(() => {
    if (selected && !octahedronState.isSelected) {
      octahedronActions.selectOctahedron(id);
    } else if (!selected && octahedronState.isSelected) {
      octahedronActions.deselectOctahedron(id);
    }
  }, [
    selected, octahedronState.isSelected,
    octahedronActions.selectOctahedron, octahedronActions.deselectOctahedron, id,
  ]);

  useEffect(() => {
    if (!selected) {
      octahedronActions.setOctahedronSelectedFace(id, null);
      octahedronActions.setOctahedronSelectedIndicator(id, null);
      octahedronActions.setOctahedronShowTransform(id, false);
      setActiveTextStyleUI(null);
      octahedronActions.setOctahedronShowHeaderTextStyleUI(id, false);
      octahedronActions.setOctahedronActiveTextFace(id, null);
    }
  }, [
    selected, id, octahedronActions.setOctahedronSelectedFace,
    octahedronActions.setOctahedronSelectedIndicator,
    octahedronActions.setOctahedronShowTransform,
    setActiveTextStyleUI,
    octahedronActions.setOctahedronShowHeaderTextStyleUI,
    octahedronActions.setOctahedronActiveTextFace,
  ]);

  const isIndicatorConnected = useCallback(
    (faceName) => {
      if (!connectionsFromStore || !id) return false;
      return connectionsFromStore.some((conn) => {
        const startMatch = conn.start?.cube?.id === id && conn.start?.face === faceName;
        const endMatch = conn.end?.cube?.id === id && conn.end?.face === faceName;
        return startMatch || endMatch;
      });
    },
    [connectionsFromStore, id]
  );

  const isIndicatorActive = useCallback(
    (faceName) => {
      return (
        octahedronState.selectedIndicator === faceName &&
        !isIndicatorConnected(faceName)
      );
    },
    [octahedronState.selectedIndicator, isIndicatorConnected]
  );

  const getUIPositions = useMemo(() => {
    const uiOffset = 0.01;
    const currentScale = octahedronState.scale || scale;

    return {
      objectUI: [0, OCTAHEDRON_SIZE + 20 / currentScale[1], uiOffset],
      headerInput: [0, OCTAHEDRON_SIZE + 5 / currentScale[1], uiOffset],
      headerText: [0, OCTAHEDRON_SIZE + 5 / currentScale[1], uiOffset],
      textStyleUI: [0, OCTAHEDRON_SIZE + 7 / currentScale[1], uiOffset],
    };
  }, [octahedronState.scale, scale]);

  const shouldShowIndicator = useCallback(
    (faceName) => {
      if (isIndicatorConnected(faceName)) {
        return true;
      }
      if (selectedIndicators.length > 0) {
        return true;
      }
      if (octahedronState?.selectedFace === faceName && selected) {
        return true;
      }
      if (showAllCubesIndicators || globalIndicatorSelected) {
        return true;
      }
      if (
        octahedronState?.selectedIndicator !== null &&
        octahedronState?.selectedIndicator !== undefined
      ) {
        return true;
      }
      switch (indicatorMode) {
        case 'all':
          return true;
        case 'indicators':
          return hoveredObjectId === id;
        case 'single':
          return (
            octahedronState?.selectedIndicator === faceName ||
            (selected && faceName === octahedronState?.selectedFace)
          );
        default:
          if (octahedronState?.connectedFaces?.has(faceName)) return true;
          return false;
      }
    },
    [
      isIndicatorConnected, selectedIndicators.length,
      octahedronState?.selectedFace, octahedronState?.selectedIndicator,
      octahedronState?.connectedFaces, selected, showAllCubesIndicators,
      globalIndicatorSelected, indicatorMode, hoveredObjectId, id,
    ]
  );

  const hasConnectedIndicators = useMemo(() =>
    octahedronFaces.some(({ name }) => isIndicatorConnected(name)),
    [isIndicatorConnected, octahedronFaces]
  );

  const shouldMountFaces = selected ||
    showAllCubesIndicators ||
    globalIndicatorSelected ||
    selectedIndicators.length > 0 ||
    indicatorMode === 'all' ||
    indicatorMode === 'indicators' ||
    hasConnectedIndicators;

  const octahedronEdgePoints = useMemo(
    () => [
      ...octahedronVertices[0], ...octahedronVertices[1],
      ...octahedronVertices[0], ...octahedronVertices[2],
      ...octahedronVertices[0], ...octahedronVertices[3],
      ...octahedronVertices[0], ...octahedronVertices[4],
      ...octahedronVertices[5], ...octahedronVertices[1],
      ...octahedronVertices[5], ...octahedronVertices[2],
      ...octahedronVertices[5], ...octahedronVertices[3],
      ...octahedronVertices[5], ...octahedronVertices[4],
      ...octahedronVertices[1], ...octahedronVertices[2],
      ...octahedronVertices[2], ...octahedronVertices[3],
      ...octahedronVertices[3], ...octahedronVertices[4],
      ...octahedronVertices[4], ...octahedronVertices[1],
    ],
    []
  );

  const handleSceneClick = useCallback(() => {
    octahedronActions.setOctahedronShowObjectUI(id, true);
    octahedronActions.setOctahedronShowHeaderTextStyleUI(id, false);
    octahedronActions.setOctahedronActiveTextFace(id, null);
    setActiveTextStyleUI(null);
    onClick();
  }, [
    onClick, setActiveTextStyleUI, id,
    octahedronActions.setOctahedronShowObjectUI,
    octahedronActions.setOctahedronShowHeaderTextStyleUI,
    octahedronActions.setOctahedronActiveTextFace,
  ]);

  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id || !objectData) return;

    const { isInitialLoading } = useObjectsStore.getState();
    if (isInitialLoading) {
      return;
    }

    const currentScale = octahedronState.scale ||
      objectData.scale || [1, 1, 1];

    const validPosition =
      Array.isArray(objectData.position) &&
      objectData.position.length === 3 &&
      objectData.position.every((val) => typeof val === 'number' && !isNaN(val))
        ? objectData.position
        : [0, 0, 0];

    const currentState = {
      type: 'octahedron',
      position: validPosition,
      scale: currentScale,
      color: objectData.color || '#000000',
      headerText: objectData.headerText || '',
      textStyle: objectData.textStyle || {
        fontSize: 1.5, color: 'black', underline: false,
      },
      faceColors: objectData.faceColors || {},
      faceTexts: objectData.faceTexts || {},
      faceTextStyles: objectData.faceTextStyles || {},
    };

    const lastUpdate = contentRef.current?.lastUpdate;
    if (!lastUpdate || !isEqual(lastUpdate, currentState)) {
      contentRef.current.lastUpdate = currentState;
      onUpdate(id, currentState);
    }
  }, [id, objectData, onUpdate, octahedronState.scale]);

  useDebouncedUpdate(updateDatabase, objectData);

  const handleFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      const newSelectedFace =
        octahedronState.selectedFace === faceName ? null : faceName;
      octahedronActions.setOctahedronSelectedFace(id, newSelectedFace);
      octahedronActions.setOctahedronShowObjectUI(id, false);

      onFaceClick?.({
        cube: contentRef.current,
        face: faceName,
        id: id,
      });
    },
    [
      id, onFaceClick, octahedronState.selectedFace,
      octahedronActions.setOctahedronSelectedFace,
      octahedronActions.setOctahedronShowObjectUI,
    ]
  );

  const handleColoredFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      if (selected) {
        handleFaceClick(e, faceName);
      } else {
        handleSceneClick();
      }
    },
    [selected, handleFaceClick, handleSceneClick]
  );

  const handleIndicatorClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      const { position: facePos } = getFaceIndicatorProps(faceName);
      const indicatorData = {
        type: 'octahedron',
        face: faceName,
        cube: {
          id,
          position: octahedronState.octahedron?.position || position,
          scale: octahedronState.scale || scale,
          userData: { objectId: id.toString() },
        },
        position: octahedronState.octahedron?.position || position,
        faceCenter: facePos,
      };
      octahedronActions.setOctahedronSelectedIndicator(
        id,
        octahedronState.selectedIndicator === faceName ? null : faceName
      );
      const indicatorId = `${id}-${faceName}`;
      setIndicatorActive(indicatorId, true);
      onFaceIndicatorClick?.(indicatorData);
    },
    [
      id, onFaceIndicatorClick, octahedronState, octahedronActions, setIndicatorActive,
    ]
  );

  const handleTransformToggle = useCallback(() => {
    const newShowTransform = !octahedronState.showTransform;
    octahedronActions.setOctahedronShowTransform(id, newShowTransform);
    if (newShowTransform) {
      octahedronActions.setOctahedronIsResizing(id, false);
    }
  }, [
    octahedronState.showTransform, id,
    octahedronActions.setOctahedronShowTransform,
    octahedronActions.setOctahedronIsResizing,
  ]);

  const handleResizeToggle = useCallback(() => {
    const newIsResizing = !octahedronState.isResizing;
    octahedronActions.setOctahedronIsResizing(id, newIsResizing);
    if (newIsResizing) {
      octahedronActions.setOctahedronShowTransform(id, false);
    }
  }, [
    octahedronState.isResizing, id,
    octahedronActions.setOctahedronIsResizing,
    octahedronActions.setOctahedronShowTransform,
  ]);

  const handleHeaderToggle = useCallback(() => {
    octahedronActions.setOctahedronShowHeader(
      id, !octahedronState.showHeader
    );
    if (!octahedronState.showHeader) {
      octahedronActions.setOctahedronShowObjectUI(id, false);
    }
  }, [
    octahedronState.showHeader, id,
    octahedronActions.setOctahedronShowHeader,
    octahedronActions.setOctahedronShowObjectUI,
  ]);

  const handleHeaderSubmit = useCallback(
    (text) => {
      octahedronActions.updateOctahedron(id, { headerText: text });
      if (onUpdate) {
        onUpdate(id, {
          color: octahedronState.color || color,
          headerText: text,
          scale: octahedronState.scale || scale,
          position: position,
          faceColors: octahedronState.faceColors || faceColors,
          faceTexts: octahedronState.faceTexts || faceTexts,
          faceTextStyles: octahedronState.faceTextStyles || faceTextStyles,
          textStyle: octahedronState.textStyle || textStyle,
          type: 'octahedron',
        });
      }
      octahedronActions.setOctahedronShowHeader(id, false);
      octahedronActions.setOctahedronShowObjectUI(id, false);
    },
    [
      id, onUpdate, octahedronState, color, scale, faceColors, faceTexts,
      faceTextStyles, textStyle, octahedronActions.updateOctahedron,
      octahedronActions.setOctahedronShowHeader,
      octahedronActions.setOctahedronShowObjectUI, position,
    ]
  );

  const handleLineColorChange = useCallback(
    (newColor) => {
      octahedronActions.updateOctahedron(id, { color: newColor });

      debouncedUpdate(id, {
        color: newColor,
        headerText: octahedronState.headerText || headerText,
        scale: octahedronState.scale || scale,
        position: position,
        faceColors: octahedronState.faceColors || faceColors,
        faceTexts: octahedronState.faceTexts || faceTexts,
        faceTextStyles: octahedronState.faceTextStyles || faceTextStyles,
        textStyle: octahedronState.textStyle || textStyle,
        type: 'octahedron',
      });
    },
    [
      id, debouncedUpdate, octahedronState, headerText, scale, faceColors,
      faceTexts, faceTextStyles, textStyle, octahedronActions.updateOctahedron, position,
    ]
  );

  const handleDrag = (e) => {
    if (!e.target || !e.target.object || !e.target.object.position) {
      return;
    }

    const newPos = e.target.object.position;
    if (
      typeof newPos.x !== 'number' ||
      typeof newPos.y !== 'number' ||
      typeof newPos.z !== 'number'
    ) {
      return;
    }

    const currentPosition = [newPos.x, newPos.y, newPos.z];

    octahedronTransformMap.set(id, {
      position: currentPosition,
      scale: octahedronState.scale || scale,
    });

    try {
      const objectsStore = useObjectsStore.getState();
      const currentObjects = Array.isArray(objectsStore.objects)
        ? objectsStore.objects
        : [];

      const snapResult = calculateAxisSnap(currentPosition, currentObjects, id);
      const finalPosition = snapResult?.position || currentPosition;

      if (snapResult) {
        e.target.object.position.set(
          snapResult.position[0],
          snapResult.position[1],
          snapResult.position[2]
        );

        octahedronTransformMap.set(id, {
          position: finalPosition,
          scale: octahedronState.scale || scale,
        });

        octahedronActions.updateOctahedron(id, {
          showSnapLine: true,
          snapLinePoints: snapResult.linePoints,
          snapAxis: snapResult.snapAxis,
        });

        setTimeout(() => {
          octahedronActions.updateOctahedron(id, { showSnapLine: false });
        }, 2000);
      } else {
        octahedronActions.updateOctahedron(id, { showSnapLine: false });
      }

      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id ? { ...obj, position: finalPosition } : obj
      );
      objectsStore.setObjects(updatedObjects);

      if (onMove) {
        onMove(finalPosition);
      }

      octahedronActions.updateOctahedron(id, { position: finalPosition });
    } catch (error) {
      console.error('Error in octahedron handleDrag:', error);
    }
  };

  const handleScale = useCallback(
    (e) => {
      if (!e.target || !e.target.object) return;

      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        e.target.object.scale.z,
      ];

      const epsilon = 0.0001;
      const currentScale = octahedronState.scale || scale;
      if (
        Math.abs(newScale[0] - currentScale[0]) < epsilon &&
        Math.abs(newScale[1] - currentScale[1]) < epsilon &&
        Math.abs(newScale[2] - currentScale[2]) < epsilon
      ) {
        return;
      }

      octahedronTransformMap.set(id, {
        position: position,
        scale: newScale,
      });

      octahedronActions.updateOctahedron(id, { scale: newScale });
    },
    [id, octahedronState.scale, scale, position, octahedronActions.updateOctahedron]
  );

  const getFaceTextOffset = useCallback((fontSize, faceName) => {
    const baseOffset = fontSize * 0.3;
    return baseOffset;
  }, []);

  const handleFaceTextStyleClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      e.nativeEvent?.stopPropagation?.();

      octahedronActions.setOctahedronActiveTextFace(id, faceName);
      setActiveTextStyleUI(contentRef.current);
      octahedronActions.setOctahedronShowHeaderTextStyleUI(id, false);
      octahedronActions.setOctahedronSelectedFace(id, null);
      octahedronActions.setOctahedronShowObjectUI(id, false);

      return false;
    },
    [
      id, octahedronActions.setOctahedronActiveTextFace, setActiveTextStyleUI,
      octahedronActions.setOctahedronShowHeaderTextStyleUI,
      octahedronActions.setOctahedronSelectedFace,
      octahedronActions.setOctahedronShowObjectUI,
    ]
  );

  const handleFaceTextStyleChange = useCallback(
    (newStyle) => {
      const activeFace = octahedronState.activeTextFace;
      if (!activeFace) return;

      const updatedFaceTextStyles = {
        ...(octahedronState.faceTextStyles || faceTextStyles),
        [activeFace]: {
          ...(octahedronState.faceTextStyles?.[activeFace] ||
            faceTextStyles?.[activeFace] || {}),
          ...newStyle,
        },
      };

      octahedronActions.updateOctahedronFaceTextStyle(id, activeFace, {
        ...(octahedronState.faceTextStyles?.[activeFace] ||
          faceTextStyles?.[activeFace] || {}),
        ...newStyle,
      });

      if (onUpdate) {
        debouncedUpdate(id, {
          color: octahedronState.color || color,
          headerText: octahedronState.headerText || headerText,
          scale: octahedronState.scale || scale,
          position: position,
          faceColors: octahedronState.faceColors || faceColors,
          faceTexts: octahedronState.faceTexts || faceTexts,
          faceTextStyles: updatedFaceTextStyles,
          textStyle: octahedronState.textStyle || textStyle,
          type: 'octahedron',
        });
      }
    },
    [
      id, debouncedUpdate, octahedronState, color, headerText, scale, position,
      faceColors, faceTexts, faceTextStyles, textStyle,
      octahedronActions.updateOctahedronFaceTextStyle, onUpdate,
    ]
  );

  const renderFaceTexts = useMemo(() => {
    return octahedronFaces.map(({ name, normal }) => {
      const faceText = octahedronState.faceTexts?.[name] || faceTexts?.[name];
      if (!faceText) return null;

      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const textStyle = octahedronState.faceTextStyles?.[name] ||
        faceTextStyles?.[name] || { fontSize: 0.5, color: 'black', underline: false };
      const yOffset = getFaceTextOffset(textStyle.fontSize, name);

      const offsetMultiplier =
        octahedronState.faceColors && octahedronState.faceColors[name] ? 0.05 : 0.03;

      const offsetPosition = [
        facePos[0] + normal[0] * offsetMultiplier,
        facePos[1] + normal[1] * offsetMultiplier,
        facePos[2] + normal[2] * offsetMultiplier,
      ];

      const currentScale = octahedronState.scale || scale;
      const inverseScale = currentScale.map((s) => 1 / Math.max(0.0001, s));

      const adjustedRotation = rotation;

      return (
        <group
          key={`text-${name}`}
          position={offsetPosition}
          rotation={adjustedRotation}
          scale={inverseScale}
        >
          <AtlasTextSprite
            text={faceText}
            position={[0, yOffset, 0]}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopPropagation?.();
              handleFaceTextStyleClick(e, name);
              return false;
            }}
            style={{
              ...textStyle,
              isFaceText: true,
              renderOrder: 2,
              depthTest: true,
              depthWrite: true,
            }}
            normal={normal}
            billboard={false}
            side={THREE.FrontSide}
            scale={1}
          />

          {octahedronState.activeTextFace === name && (
            <TextStyleUI
              position={[0, 6, 0]}
              onStyleChange={handleFaceTextStyleChange}
              onClose={() => {
                octahedronActions.setOctahedronActiveTextFace(id, null);
                setActiveTextStyleUI(null);
                octahedronActions.setOctahedronShowHeaderTextStyleUI(id, false);
              }}
              currentStyle={
                octahedronState.faceTextStyles?.[name] ||
                faceTextStyles?.[name] || {}
              }
            />
          )}
        </group>
      );
    });
  }, [
    octahedronState, faceTexts, faceTextStyles, scale, getFaceTextOffset,
    handleFaceTextStyleClick, handleFaceTextStyleChange, id, octahedronActions, setActiveTextStyleUI,
  ]);

  const renderFaces = useMemo(() => {
    return octahedronFaces.map(({ name, normal }) => (
      <OctahedronFace
        key={`face-${name}`}
        id={id}
        faceName={name}
        faceData={{
          geometry: octahedronTriangleFaces[name],
          position: getFaceIndicatorProps(name).position,
          rotation: [0, 0, 0],
          normal,
        }}
        selected={selected}
        onFaceClick={handleColoredFaceClick}
        onIndicatorClick={handleIndicatorClick}
        shouldShowIndicator={shouldShowIndicator}
        isIndicatorConnected={isIndicatorConnected}
        isIndicatorActive={isIndicatorActive}
        debouncedUpdate={debouncedUpdate}
        onUpdate={onUpdate}
        position={position}
        color={color}
        headerText={headerText}
        scale={scale}
        faceColors={faceColors}
        faceTexts={faceTexts}
        faceTextStyles={faceTextStyles}
        textStyle={textStyle}
        selectedIndicatorsLength={selectedIndicators.length}
        showAllCubesIndicators={showAllCubesIndicators}
        globalIndicatorSelected={globalIndicatorSelected}
        showFaceText={showFaceText}
      />
    ));
  }, [
    id, selected, handleColoredFaceClick, handleIndicatorClick,
    shouldShowIndicator, isIndicatorConnected, isIndicatorActive,
    debouncedUpdate, onUpdate, position, color, headerText, scale,
    faceColors, faceTexts, faceTextStyles, textStyle,
    octahedronTriangleFaces, octahedronFaces,
    selectedIndicators.length, showAllCubesIndicators,
    globalIndicatorSelected, showFaceText,
  ]);

  const isGroupingContainer = objectData?.merfolkData?.isContainer === true;

  if (!isGroupingContainer && lodLevel === LOD_LEVELS.LOW) {
    return null;
  }

  const isLODRestricted = !isGroupingContainer;
  const shouldRenderFullDetail = !isLODRestricted || lodLevel === LOD_LEVELS.FULL;

  return (
    <>
      {octahedronState.showSnapLine && (
        <SnapLineIndicator
          points={octahedronState.snapLinePoints}
          axis={octahedronState.snapAxis}
          visible={octahedronState.showSnapLine}
        />
      )}
      <group
        ref={contentRef}
        position={position}
        scale={octahedronState.scale || scale}
        userData={{
          isOctahedron: true,
          objectId: id.toString(),
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHoveredObjectId(id);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHoveredObjectId(null);
        }}
      >
        {!selected && (
          <mesh
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              handleSceneClick();
            }}
            userData={{ isHelper: true, isClickHelper: true }}
          >
            <boxGeometry args={[10, 10, 10]} />
            <primitive object={HITBOX_MATERIAL} attach="material" />
          </mesh>
        )}

        {shouldRenderFullDetail && renderEdges && (
          <InstancedLine
            points={octahedronEdgePoints}
            color={octahedronState.color || color}
            lineWidth={lineWidth !== undefined ? lineWidth : 1}
          />
        )}

        {shouldRenderFullDetail && shouldMountFaces && renderFaces}

        {shouldRenderFullDetail && renderFaceTexts}

        {shouldRenderFullDetail && (octahedronState.headerText || headerText) && (
          <group
            scale={(octahedronState.scale || scale).map(
              (s) => 1 / Math.max(0.0001, s)
            )}
            position={getUIPositions.headerText}
          >
            <AtlasTextSprite
              text={octahedronState.headerText || headerText}
              position={[0, 0, 0]}
              followTarget={meshRef}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopPropagation?.();
                octahedronActions.setOctahedronShowHeaderTextStyleUI(id, true);
                octahedronActions.setOctahedronActiveTextFace(id, null);
                setActiveTextStyleUI(contentRef.current);
                octahedronActions.setOctahedronSelectedFace(id, null);
                octahedronActions.setOctahedronShowObjectUI(id, false);
              }}
              style={{
                ...(octahedronState.textStyle || textStyle),
                isHeaderText: true,
              }}
              billboard={true}
              scale={1}
            />

            {octahedronState.showHeaderTextStyleUI && (
              <TextStyleUI
                position={[0, 2 / (octahedronState.scale || scale)[1], 0]}
                followTarget={null}
                onStyleChange={(newStyle) => {
                  const updatedTextStyle = {
                    ...(octahedronState.textStyle || textStyle),
                    ...newStyle,
                  };

                  octahedronActions.updateOctahedron(id, {
                    textStyle: updatedTextStyle,
                  });

                  if (onUpdate) {
                    onUpdate(id, {
                      color: octahedronState.color || color,
                      headerText: octahedronState.headerText || headerText,
                      scale: octahedronState.scale || scale,
                      position: position,
                      faceColors: octahedronState.faceColors || faceColors,
                      faceTexts: octahedronState.faceTexts || faceTexts,
                      faceTextStyles: octahedronState.faceTextStyles || faceTextStyles,
                      textStyle: updatedTextStyle,
                      type: 'octahedron',
                    });
                  }
                }}
                onClose={() => {
                  octahedronActions.setOctahedronShowHeaderTextStyleUI(id, false);
                  setActiveTextStyleUI(null);
                }}
                currentStyle={octahedronState.textStyle || textStyle}
              />
            )}
          </group>
        )}

        {shouldRenderFullDetail && selected && octahedronState.showHeader && (
          <HeaderInput
            position={getUIPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            inputId={`octahedron-${id}-header`}
            followTarget={null}
            initialText={octahedronState.headerText || headerText}
          />
        )}
      </group>

      {selected && !octahedronState.showHeader && octahedronState.showObjectUI && (
        <ObjectUI
          onTransformToggle={handleTransformToggle}
          onHeaderToggle={handleHeaderToggle}
          onResizeToggle={handleResizeToggle}
          onLineColorChange={handleLineColorChange}
          onDelete={() => onDelete?.(id)}
          showTransform={octahedronState.showTransform}
          showHeader={octahedronState.showHeader}
          followTarget={contentRef}
          objectId={id}
          hasCode={hasCode}
          onCodeToggle={onCodeToggle}
        />
      )}

      {selected && octahedronState.showTransform && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onObjectChange={handleDrag}
          onMouseDown={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
          }}
          onMouseUp={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            octahedronTransformMap.delete(id);
          }}
          mode="translate"
          space="world"
          size={0.5}
        />
      )}

      {selected && octahedronState.isResizing && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onChange={handleScale}
          onMouseDown={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            onTransformStart?.(id);
          }}
          onMouseUp={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            octahedronTransformMap.delete(id);

            if (onUpdate) {
              onUpdate(id, {
                type: 'octahedron',
                position: position,
                scale: octahedronState.scale || scale,
                color: octahedronState.color || color,
                headerText: octahedronState.headerText || headerText,
                faceColors: octahedronState.faceColors || faceColors,
                faceTexts: octahedronState.faceTexts || faceTexts,
                faceTextStyles: octahedronState.faceTextStyles || faceTextStyles,
                textStyle: octahedronState.textStyle || textStyle,
              });
            }

            onTransformEnd?.(id);
          }}
          mode="scale"
          space="world"
          size={0.5}
        />
      )}
    </>
  );
};

export default React.memo(Octahedron, (prevProps, nextProps) => {
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.showAllCubesIndicators !== nextProps.showAllCubesIndicators) return false;
  if (prevProps.globalIndicatorSelected !== nextProps.globalIndicatorSelected) return false;
  if (prevProps.indicatorMode !== nextProps.indicatorMode) return false;
  if (!arraysEqual(prevProps.selectedIndicators, nextProps.selectedIndicators)) return false;
  if (!arraysEqual(prevProps.position, nextProps.position)) return false;
  if (!arraysEqual(prevProps.scale, nextProps.scale)) return false;
  if (!shallowObjEqual(prevProps.faceColors, nextProps.faceColors)) return false;
  if (!shallowObjEqual(prevProps.faceTexts, nextProps.faceTexts)) return false;
  if (!shallowObjEqual(prevProps.faceTextStyles, nextProps.faceTextStyles)) return false;
  if (prevProps.color !== nextProps.color) return false;
  if (prevProps.headerText !== nextProps.headerText) return false;
  return true;
});
