import {
  NODE_TYPE_COMPONENT,
  NODE_TYPE_FUNCTION,
  NODE_TYPE_HANDLER,
  NODE_TYPE_CONTROL,
  NODE_TYPE_STATE,
  NODE_TYPE_DATA,
  MAX_RECURSION_DEPTH,
  MIN_SCALE_FACTOR,
  BASE_DODECAHEDRON_SIZE,
  BASE_DODECAHEDRON_RADIUS,
  DEFAULT_CUBE_SIZE,
  DEFAULT_SPHERE_SIZE,
  SPACING_BETWEEN_COMPONENTS,
} from './constants.js';

export const scaleMethods = {
  /**
   * Calculate scale for a dodecahedron based on its children
   */
  calculateDodecahedronScale(
    nodeId,
    parentChildMap,
    graphNodes,
    internalComponentChildren,
    level = 0
  ) {
    const cacheKey = `${nodeId}-${level}`;
    if (this.scaleCache.has(cacheKey)) {
      return this.scaleCache.get(cacheKey);
    }

    const children = parentChildMap.get(nodeId) || new Set();
    const childCount = children.size;

    let nodeScale = [1, 1, 1];
    let containerSize = 25;

    if (level > MAX_RECURSION_DEPTH) {
      return { nodeScale: [1.2, 1.2, 1.2], containerSize: 30 };
    }

    if (childCount === 0) {
      const result = { nodeScale: [1.2, 1.2, 1.2], containerSize: 30 };
      this.scaleCache.set(cacheKey, result);
      return result;
    }

    const cubeChildren = this.filterCubeChildren(children, graphNodes);
    const componentChildren = this.filterComponentChildren(children, graphNodes);

    const internalComponentChildrenArray = componentChildren.filter(
      (childId) =>
        internalComponentChildren && internalComponentChildren.has(childId)
    );

    const totalNestedChildren =
      cubeChildren.length + internalComponentChildrenArray.length;

    if (totalNestedChildren > 0) {
      let maxChildSize = this.calculateMaxChildSize(
        children,
        parentChildMap,
        graphNodes,
        internalComponentChildren,
        level
      );

      const hasInternalContent =
        cubeChildren.length > 0 || internalComponentChildrenArray.length > 0;
      const hasInternalComponents = internalComponentChildrenArray.length > 0;

      const actualChildSpacing = 50;

      let requiredSpace;

      if (hasInternalComponents && cubeChildren.length === 0) {
        requiredSpace = maxChildSize * 2;
      } else if (hasInternalComponents && cubeChildren.length > 0) {
        const totalInternalChildren = cubeChildren.length + internalComponentChildrenArray.length;
        if (totalInternalChildren <= 2) {
          requiredSpace = maxChildSize * 2.5;
        } else {
          const gridSize3D = Math.ceil(Math.pow(totalInternalChildren, 1 / 3));
          requiredSpace = (gridSize3D - 1) * actualChildSpacing + maxChildSize * 2;
        }
      } else if (cubeChildren.length > 0) {
        if (cubeChildren.length === 1) {
          requiredSpace = maxChildSize * 2;
        } else {
          const gridSize3D = Math.ceil(Math.pow(cubeChildren.length, 1 / 3));
          requiredSpace = (gridSize3D - 1) * actualChildSpacing + maxChildSize * 2;
        }
      } else {
        requiredSpace = maxChildSize * 1.2;
      }

      const adaptivePadding = hasInternalContent
        ? Math.max(30, requiredSpace * 0.3)
        : 10;

      const requiredSize = requiredSpace + adaptivePadding;

      const scaleFactor = Math.max(
        MIN_SCALE_FACTOR,
        requiredSize / BASE_DODECAHEDRON_SIZE
      );

      nodeScale = [scaleFactor, scaleFactor, scaleFactor];
      containerSize = BASE_DODECAHEDRON_SIZE * scaleFactor;
    }

    const result = { nodeScale, containerSize };
    this.scaleCache.set(cacheKey, result);
    return result;
  },

  /**
   * Calculate the maximum child size for spacing calculations
   */
  calculateMaxChildSize(
    children,
    parentChildMap,
    graphNodes,
    context,
    level = 0
  ) {
    let maxChildSize = 0;

    if (level > MAX_RECURSION_DEPTH) {
      return BASE_DODECAHEDRON_SIZE;
    }

    Array.from(children).forEach((childId) => {
      const childNode = graphNodes.get(childId);

      if (childNode && childNode.type === NODE_TYPE_COMPONENT) {
        const childScale = this.calculateDodecahedronScale(
          childId,
          parentChildMap,
          graphNodes,
          context?.internalComponentChildren || new Set(),
          level + 1
        );
        const dampenedScale = Math.sqrt(Math.max(...childScale.nodeScale));
        const childActualSize = BASE_DODECAHEDRON_RADIUS * dampenedScale;
        maxChildSize = Math.max(maxChildSize, childActualSize);
      } else if (
        childNode &&
        (childNode.type === NODE_TYPE_FUNCTION ||
          childNode.type === NODE_TYPE_HANDLER ||
          childNode.type === NODE_TYPE_CONTROL)
      ) {
        maxChildSize = Math.max(maxChildSize, DEFAULT_CUBE_SIZE);
      } else if (
        childNode &&
        (childNode.type === NODE_TYPE_STATE ||
          childNode.type === NODE_TYPE_DATA)
      ) {
        maxChildSize = Math.max(maxChildSize, DEFAULT_SPHERE_SIZE);
      } else {
        maxChildSize = Math.max(maxChildSize, DEFAULT_CUBE_SIZE);
      }
    });

    return maxChildSize;
  },

  /**
   * Count nested children of a given set of children
   */
  countNestedChildren(children, graphNodes) {
    return Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return (
        childNode &&
        (childNode.type === NODE_TYPE_FUNCTION ||
          childNode.type === NODE_TYPE_HANDLER ||
          childNode.type === NODE_TYPE_CONTROL ||
          childNode.type === NODE_TYPE_COMPONENT)
      );
    }).length;
  },

  /**
   * Calculate the total bounding box size needed for a component and all its descendants
   */
  calculateSubtreeBoundingBox(
    nodeId,
    parentChildMap,
    graphNodes,
    context,
    level = 0
  ) {
    if (level > MAX_RECURSION_DEPTH) {
      console.warn(
        `⚠️ Max recursion depth reached for bounding box calculation of ${nodeId}`
      );
      return { width: 100, height: 100 };
    }

    const cacheKey = `${nodeId}-${level}`;
    if (this.boundingBoxCache.has(cacheKey)) {
      return this.boundingBoxCache.get(cacheKey);
    }

    const node = graphNodes.get(nodeId);
    if (!node || node.type !== NODE_TYPE_COMPONENT) {
      const result = { width: 20, height: 20 };
      this.boundingBoxCache.set(cacheKey, result);
      return result;
    }

    const componentScale = this.calculateDodecahedronScale(
      nodeId,
      parentChildMap,
      graphNodes,
      context?.internalComponentChildren || new Set(),
      level
    );
    const actualComponentSize =
      BASE_DODECAHEDRON_RADIUS * Math.max(...componentScale.nodeScale);

    const children = parentChildMap.get(nodeId) || new Set();
    const componentChildren = Array.from(children).filter((childId) => {
      const childNode = graphNodes.get(childId);
      return childNode && childNode.type === 'component';
    });

    if (componentChildren.length === 0) {
      const result = {
        width: actualComponentSize * 2,
        height: actualComponentSize * 2,
      };
      this.boundingBoxCache.set(cacheKey, result);
      return result;
    }

    const childBoundingBoxes = componentChildren.map((childId) =>
      this.calculateSubtreeBoundingBox(
        childId,
        parentChildMap,
        graphNodes,
        context || {},
        level + 1
      )
    );

    const gridSize = Math.ceil(Math.sqrt(componentChildren.length));

    const maxChildWidth = Math.max(...childBoundingBoxes.map((bb) => bb.width), 0);
    const maxChildHeight = Math.max(...childBoundingBoxes.map((bb) => bb.height), 0);

    const gridWidth =
      gridSize * (maxChildWidth + SPACING_BETWEEN_COMPONENTS);
    const gridHeight =
      gridSize * (maxChildHeight + SPACING_BETWEEN_COMPONENTS);

    const totalWidth = Math.max(gridWidth, actualComponentSize * 2);
    const totalHeight = Math.max(gridHeight, actualComponentSize * 2);

    const result = { width: totalWidth, height: totalHeight };
    this.boundingBoxCache.set(cacheKey, result);
    return result;
  },
};
