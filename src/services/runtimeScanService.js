import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// ─── URL Validation ──────────────────────────────────────────────────────────

/**
 * Validate a URL for runtime scanning.
 * Blocks private/internal IP ranges (SSRF prevention) and enforces https/http only.
 * @param {string} url - URL to validate
 * @returns {{ valid: boolean, error?: string }}
 */
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

  // Block localhost and loopback
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    return { valid: false, error: 'Scanning localhost is not allowed' };
  }

  // Block private IP ranges (SSRF prevention)
  const privateRanges = [
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/, // link-local
    /^fc[0-9a-f]{2}:/i,      // IPv6 ULA
    /^fe80:/i,                // IPv6 link-local
  ];

  for (const range of privateRanges) {
    if (range.test(hostname)) {
      return { valid: false, error: 'Scanning private/internal IP ranges is not allowed' };
    }
  }

  return { valid: true };
};

// ─── Merfolk Generation from Runtime Trace ───────────────────────────────────

/**
 * Convert a structured runtime trace into Merfolk markdown.
 *
 * @param {Object} traceData - Structured runtime trace from the Cloud Function
 * @param {string} url - The scanned URL (for the header comment)
 * @returns {string} - Merfolk markdown wrapped in fenced code block
 */
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

  // ── Components ──────────────────────────────────────────────────────────────
  if (components.length > 0) {
    lines.push('%% Components');
    for (const comp of components) {
      const id = sanitizeId(comp.name);
      lines.push(`${id}{Component: ${comp.name}}`);
    }
    lines.push('');
  }

  // ── Event Handlers ──────────────────────────────────────────────────────────
  if (eventHandlers.length > 0) {
    lines.push('%% Event Handlers');
    for (const handler of eventHandlers) {
      const id = sanitizeId(handler.name);
      lines.push(`${id}[Function: ${handler.name}]`);
    }
    lines.push('');
  }

  // ── API Calls ────────────────────────────────────────────────────────────────
  if (apiCalls.length > 0) {
    lines.push('%% API Calls');
    for (const call of apiCalls) {
      const label = `${call.method} ${call.path}`;
      const id = sanitizeId(label);
      lines.push(`${id}((Service: ${label}))`);
    }
    lines.push('');
  }

  // ── State Stores ─────────────────────────────────────────────────────────────
  if (stateStores.length > 0) {
    lines.push('%% State Stores');
    for (const store of stateStores) {
      const id = sanitizeId(store.name);
      lines.push(`${id}[[Store: ${store.name}]]`);
    }
    lines.push('');
  }

  // ── Hooks ────────────────────────────────────────────────────────────────────
  if (hooks.length > 0) {
    lines.push('%% Hooks');
    for (const hook of hooks) {
      const id = sanitizeId(hook.name);
      lines.push(`${id}[Hook: ${hook.name}]`);
    }
    lines.push('');
  }

  // ── Libraries ────────────────────────────────────────────────────────────────
  if (libraries.length > 0) {
    lines.push('%% Libraries');
    for (const lib of libraries) {
      const id = sanitizeId(lib.name);
      lines.push(`${id}<Library: ${lib.name}>`);
    }
    lines.push('');
  }

  // ── Workers ──────────────────────────────────────────────────────────────────
  if (workers.length > 0) {
    lines.push('%% Workers');
    for (const worker of workers) {
      const id = sanitizeId(worker.name);
      lines.push(`${id}[Function: ${worker.name}]`);
    }
    lines.push('');
  }

  // ── Connections ──────────────────────────────────────────────────────────────
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

/**
 * Convert a string into a valid Merfolk node identifier (alphanumeric + underscores).
 * @param {string} name
 * @returns {string}
 */
const sanitizeId = (name) => {
  return String(name)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .slice(0, 60);
};

// ─── Main Scan Function ───────────────────────────────────────────────────────

/**
 * Scan a live website and generate a 3D Merfolk diagram.
 * Mirrors the signature of `scanRepositoryAndGenerateDiagram` from githubRepoService.js.
 *
 * @param {string} url - URL of the website to scan
 * @param {number} duration - Capture duration in seconds (5-30)
 * @param {Function} onCreateObject - Callback to create 3D objects
 * @param {Object} user - Firebase user object
 * @param {string} currentSpaceId - Current space ID
 * @param {Function} uploadMarkdownToStorage - Function to upload markdown to Storage
 * @param {Object} markdownDiagramService - Markdown diagram service instance
 * @param {Function} onProgress - Optional callback (progress: 0-100, stage: string)
 * @returns {Promise<{ success: boolean, markdown: string, storageUrl: string|null, objectsCreated: number, connectionsCreated: number }>}
 */
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
  // 1. Validate URL client-side first
  if (onProgress) onProgress(5, 'Validating URL...');
  const validation = validateScanUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Call the Cloud Function
  if (onProgress) onProgress(15, 'Launching browser...');
  const scanWebsiteRuntime = httpsCallable(functions, 'scanWebsiteRuntime', {
    // Must exceed the Cloud Function's own timeoutSeconds (120 s) so that
    // Firebase's client SDK receives the function error rather than timing out first.
    timeout: 130000,
  });

  let cloudResult;
  try {
    // Simulate incremental progress while the long-running function executes
    const progressInterval = simulateProgress(onProgress, 15, 75, duration * 1000 + 30000);
    cloudResult = await scanWebsiteRuntime({ url, duration });
    clearInterval(progressInterval);
  } catch (error) {
    throw new Error(`Runtime scan failed: ${error.message}`);
  }

  const { markdown, metadata } = cloudResult.data;
  if (!markdown) {
    throw new Error('Cloud Function returned no Merfolk markdown');
  }

  if (onProgress) onProgress(75, 'Analyzing traces...');

  // 3. Upload markdown to Storage
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

  // 4. Process markdown into 3D objects via the existing pipeline
  if (onProgress) onProgress(90, 'Creating 3D objects...');
  const hostname = new URL(url).hostname.replace(/\./g, '-');
  const markdownBlob = new Blob([markdown], { type: 'text/markdown' });
  const markdownFile = new File([markdownBlob], `runtime-${hostname}-diagram.md`, {
    type: 'text/markdown',
  });

  const result = await markdownDiagramService.processMarkdownFile(
    markdownFile,
    onCreateObject,
    currentSpaceId,
    user,
  );

  if (!result.success) {
    throw new Error('Diagram generated but no 3D objects were created. Check Merfolk syntax.');
  }

  if (onProgress) onProgress(100, 'Complete');

  return {
    success: true,
    markdown,
    storageUrl,
    objectsCreated: result.objectsCreated,
    connectionsCreated: result.connectionsCreated,
    metadata,
  };
};

/**
 * Advance the progress bar smoothly while waiting for the Cloud Function.
 * Returns the interval ID so the caller can clear it when the call resolves.
 * @param {Function|null} onProgress
 * @param {number} startPct - Starting percentage
 * @param {number} endPct - Ending percentage (will not exceed this)
 * @param {number} durationMs - Expected total duration in ms
 * @returns {number} - setInterval ID
 */
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
