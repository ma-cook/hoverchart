import useObjectsStore from '../stores/objectsStore';
import { saveObjectToCell } from './spatialObjectsService';
import { getCellCoordinates } from './spatialPartitioning';

const PLANS_PER_ROW = 5;
const PLAN_TEXT_W = 25;
const PLAN_TEXT_H = 15;
const PLAN_GAP = 4;
const PADDING = 12;
const CONTAINER_DEPTH = 15;
const PLAN_OFFSET_X = 30;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function getCellId(position) {
  const coords = getCellCoordinates(position);
  return `${coords.x},${coords.y},${coords.z}`;
}

export function findPlanContainer() {
  const objects = useObjectsStore.getState().objects || [];
  return objects.find(obj => obj.merfolkData?.isPlanContainer) || null;
}

export function findPlanTextObjects(containerId) {
  const objects = useObjectsStore.getState().objects || [];
  return objects
    .filter(obj => obj.merfolkData?.isPlanText && obj.merfolkData?.planContainerId === containerId)
    .sort((a, b) => (a.merfolkData?.planIndex || 0) - (b.merfolkData?.planIndex || 0));
}

function findRightmostScenePosition() {
  const objects = useObjectsStore.getState().objects || [];
  let maxX = 0;
  for (const obj of objects) {
    if (obj.merfolkData?.isPlanContainer) continue;
    if (obj.position && Array.isArray(obj.position)) {
      const halfSize = (obj.scale && obj.scale[0] * 5) || 5;
      const rightEdge = obj.position[0] + halfSize;
      if (rightEdge > maxX) maxX = rightEdge;
    }
  }
  return maxX > 0 ? [maxX + PLAN_OFFSET_X, 0, 0] : [50, 0, 0];
}

function computeContainerScale(planCount) {
  if (planCount === 0) return [15, 15, 15];
  const rows = Math.ceil(planCount / PLANS_PER_ROW);
  const cols = Math.min(planCount, PLANS_PER_ROW);
  const width = cols * PLAN_TEXT_W + (cols - 1) * PLAN_GAP + PADDING * 2;
  const height = rows * PLAN_TEXT_H + (rows - 1) * PLAN_GAP + PADDING * 2;
  return [width / 10, height / 10, CONTAINER_DEPTH / 10];
}

function getPlanGridPosition(container, planIndex) {
  const row = Math.floor(planIndex / PLANS_PER_ROW);
  const col = planIndex % PLANS_PER_ROW;
  const halfW = container.scale[0] * 5;
  const halfH = container.scale[1] * 5;
  const cols = Math.min(planIndex + 1, PLANS_PER_ROW);
  const cellW = (halfW * 2 - PADDING * 2) / cols;
  const startX = container.position[0] - halfW + PADDING + cellW * (col + 0.5);
  const startY = container.position[1] + halfH - PADDING - PLAN_TEXT_H / 2;
  const y = startY - row * (PLAN_TEXT_H + PLAN_GAP);
  return [startX, y, container.position[2]];
}

export function generatePlanTitle(existingCount) {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Plan ${existingCount + 1} - ${dateStr} ${timeStr}`;
}

export async function createPlanContainer(user, spaceId) {
  if (findPlanContainer()) return findPlanContainer();

  const position = findRightmostScenePosition();
  const cellId = getCellId(position);
  const containerId = generateId();
  const containerObj = {
    id: containerId,
    type: 'cube',
    position,
    scale: computeContainerScale(0),
    color: null,
    lineColor: '#4a9eff',
    lineWidth: 2,
    cellId,
    createdAt: Date.now(),
    headerText: 'Plans',
    headerStyle: { fontSize: 1.5, color: '#4a9eff', underline: false },
    faceColors: {},
    faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
    textStyle: { fontSize: 0.5, color: 'black', underline: false },
    merfolkData: {
      isContainer: true,
      isPlanContainer: true,
      nonInteractive: true,
      planCount: 0,
    },
  };

  const store = useObjectsStore.getState();
  useObjectsStore.setState({
    objects: [...(store.objects || []), containerObj],
    isInitialLoading: false,
  });

  if (!window.isTrialMode && user) {
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObjectToCell(spaceOwnerId, spaceId, containerObj);
  }

  return containerObj;
}

export async function createPlanTextObject(container, title, user, spaceId) {
  const existingPlans = findPlanTextObjects(container.id);
  const planIndex = existingPlans.length;
  const newScale = computeContainerScale(planIndex + 1);

  const updatedContainer = {
    ...container,
    scale: newScale,
    merfolkData: { ...container.merfolkData, planCount: planIndex + 1 },
  };

  const store = useObjectsStore.getState();
  useObjectsStore.setState({
    objects: (store.objects || []).map(o =>
      o.id === container.id ? updatedContainer : o
    ),
  });

  if (!window.isTrialMode && user) {
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObjectToCell(spaceOwnerId, spaceId, updatedContainer);
  }

  const position = getPlanGridPosition(updatedContainer, planIndex);
  const cellId = getCellId(position);
  const textId = generateId();

  const textObj = {
    id: textId,
    type: 'text',
    position,
    scale: [PLAN_TEXT_W / 10, PLAN_TEXT_H / 10, 1],
    cellId,
    createdAt: Date.now(),
    headerText: title,
    headerStyle: { fontSize: 1.2, color: '#4a9eff', underline: false },
    text: '',
    textStyle: { fontSize: 0.6, color: '#d4d4d4' },
    merfolkData: {
      isPlanText: true,
      planContainerId: container.id,
      planIndex,
      planIteration: 0,
      title,
    },
  };

  useObjectsStore.setState({
    objects: [...(useObjectsStore.getState().objects || []), textObj],
  });

  if (!window.isTrialMode && user) {
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObjectToCell(spaceOwnerId, spaceId, textObj);
  }

  return { textObj, container: updatedContainer };
}

export async function updatePlanText(textObj, newText, user, spaceId) {
  const updated = {
    ...textObj,
    text: newText,
    merfolkData: {
      ...textObj.merfolkData,
      planIteration: (textObj.merfolkData?.planIteration || 0) + 1,
    },
  };

  const store = useObjectsStore.getState();
  useObjectsStore.setState({
    objects: (store.objects || []).map(o =>
      o.id === textObj.id ? updated : o
    ),
  });

  if (!window.isTrialMode && user) {
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObjectToCell(spaceOwnerId, spaceId, updated);
  }

  return updated;
}

export function getAllPlanContext() {
  const container = findPlanContainer();
  if (!container) return '';

  const plans = findPlanTextObjects(container.id);
  if (plans.length === 0) return '';

  const lines = ['\n=== SAVED PLANS ==='];
  for (const plan of plans) {
    const title = plan.merfolkData?.title || plan.headerText || 'Untitled';
    const text = plan.text || '(empty)';
    lines.push(`--- ${title} ---`);
    lines.push(text);
  }
  lines.push('=== END PLANS ===\n');
  return lines.join('\n');
}
