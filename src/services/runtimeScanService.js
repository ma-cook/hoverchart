import { api } from '../api-client';

export const validateScanUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only http and https URLs are supported' };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    return { valid: false, error: 'Scanning localhost is not allowed' };
  }

  const privateRanges = [
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,
    /^fc[0-9a-f]{2}:/i,
    /^fe80:/i,
  ];

  for (const range of privateRanges) {
    if (range.test(hostname)) {
      return { valid: false, error: 'Scanning private/internal IP ranges is not allowed' };
    }
  }

  return { valid: true };
};

export const generateMerfolkFromRuntimeTrace = (traceData, url) => {
  const {
    components = [],
    eventHandlers = [],
    apiCalls = [],
    stateStores = [],
    hooks = [],
    libraries = [],
    workers = [],
    connections = [],
    framework = 'unknown',
  } = traceData;

  const lines = [];
  lines.push('```merfolk');
  lines.push(`%% Runtime Analysis: ${url}`);
  lines.push(`%% Framework: ${framework}`);
  lines.push('');

  if (components.length > 0) {
    lines.push('%% Components');
    for (const comp of components) {
      const id = sanitizeId(comp.name);
      lines.push(`${id}{Component: ${comp.name}}`);
    }
    lines.push('');
  }

  if (eventHandlers.length > 0) {
    lines.push('%% Event Handlers');
    for (const handler of eventHandlers) {
      const id = sanitizeId(handler.name);
      lines.push(`${id}[Function: ${handler.name}]`);
    }
    lines.push('');
  }

  if (apiCalls.length > 0) {
    lines.push('%% API Calls');
    for (const call of apiCalls) {
      const label = `${call.method} ${call.path}`;
      const id = sanitizeId(label);
      lines.push(`${id}((Service: ${label}))`);
    }
    lines.push('');
  }

  if (stateStores.length > 0) {
    lines.push('%% State Stores');
    for (const store of stateStores) {
      const id = sanitizeId(store.name);
      lines.push(`${id}[[Store: ${store.name}]]`);
    }
    lines.push('');
  }

  if (hooks.length > 0) {
    lines.push('%% Hooks');
    for (const hook of hooks) {
      const id = sanitizeId(hook.name);
      lines.push(`${id}[Hook: ${hook.name}]`);
    }
    lines.push('');
  }

  if (libraries.length > 0) {
    lines.push('%% Libraries');
    for (const lib of libraries) {
      const id = sanitizeId(lib.name);
      lines.push(`${id}<Library: ${lib.name}>`);
    }
    lines.push('');
  }

  if (workers.length > 0) {
    lines.push('%% Workers');
    for (const worker of workers) {
      const id = sanitizeId(worker.name);
      lines.push(`${id}[Function: ${worker.name}]`);
    }
    lines.push('');
  }

  if (connections.length > 0) {
    lines.push('%% Connections');
    for (const conn of connections) {
      const fromId = sanitizeId(conn.from);
      const toId = sanitizeId(conn.to);
      const arrow = conn.style || '-->';
      const label = conn.label ? ` : "${conn.label}"` : '';
      lines.push(`${fromId} ${arrow} ${toId}${label}`);
    }
    lines.push('');
  }

  lines.push('```');
  return lines.join('\n');
};

const sanitizeId = (name) => {
  return String(name)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .slice(0, 60);
};

export const scanWebsiteAndGenerateDiagram = async (
  url,
  duration = 10,
  onCreateObject,
  user,
  currentSpaceId,
  uploadMarkdownToStorage,
  markdownDiagramService,
  onProgress = null,
) => {
  if (onProgress) onProgress(5, 'Validating URL...');
  const validation = validateScanUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (onProgress) onProgress(15, 'Launching browser...');

  let result;
  try {
    const progressInterval = simulateProgress(onProgress, 15, 75, duration * 1000 + 30000);
    const response = await api.post('/api/zen/scan', { url, duration });
    clearInterval(progressInterval);
    result = response.data || response;
  } catch (error) {
    throw new Error(`Runtime scan failed: ${error.message}`);
  }

  const { markdown, metadata } = result;
  if (!markdown) {
    throw new Error('Scan API returned no Merfolk markdown');
  }

  if (onProgress) onProgress(75, 'Analyzing traces...');

  if (onProgress) onProgress(85, 'Generating diagram...');
  let storageUrl = null;
  if (user?.uid && currentSpaceId) {
    try {
      const hostname = new URL(url).hostname.replace(/\./g, '-');
      storageUrl = await uploadMarkdownToStorage(
        markdown,
        user.uid,
        currentSpaceId,
        `runtime-${hostname}-diagram.md`,
      );
    } catch (uploadError) {
      console.error('Failed to upload runtime markdown to storage:', uploadError);
    }
  }

  if (onProgress) onProgress(90, 'Creating 3D objects...');
  const hostname = new URL(url).hostname.replace(/\./g, '-');
  const markdownBlob = new Blob([markdown], { type: 'text/markdown' });
  const markdownFile = new File([markdownBlob], `runtime-${hostname}-diagram.md`, {
    type: 'text/markdown',
  });

  const response = await markdownDiagramService.processMarkdownFile(
    markdownFile,
    onCreateObject,
    currentSpaceId,
    user,
  );

  if (!response.success) {
    throw new Error('Diagram generated but no 3D objects were created. Check Merfolk syntax.');
  }

  if (onProgress) onProgress(100, 'Complete');

  return {
    success: true,
    markdown,
    storageUrl,
    objectsCreated: response.objectsCreated,
    connectionsCreated: response.connectionsCreated,
    metadata,
  };
};

const simulateProgress = (onProgress, startPct, endPct, durationMs) => {
  if (!onProgress) return 0;
  const steps = 20;
  const intervalMs = durationMs / steps;
  const increment = (endPct - startPct) / steps;
  let current = startPct;
  let step = 0;

  const stages = [
    'Launching browser...',
    'Navigating to website...',
    'Detecting framework...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Capturing runtime behavior...',
    'Analyzing traces...',
    'Analyzing traces...',
    'Analyzing traces...',
    'Analyzing traces...',
    'Analyzing traces...',
    'Generating diagram...',
    'Generating diagram...',
  ];

  return setInterval(() => {
    if (step >= steps) return;
    current = Math.min(current + increment, endPct);
    const stage = stages[step] || 'Processing...';
    onProgress(Math.round(current), stage);
    step++;
  }, intervalMs);
};
