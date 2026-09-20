/**
 * Fires the scanner Cloud Run service for a single job. The scanner is deployed
 * with --no-allow-unauthenticated, so we authenticate outbound with an OIDC
 * identity token (audience = the scanner URL) via google-auth-library, and gate
 * the endpoint a second time with the shared SCAN_INTERNAL_KEY header.
 *
 * In local/dev (no SCANNER_SERVICE_URL) this is a no-op: jobs stay queued and
 * the scan steward skips pickup, so nothing blows up without the cloud wiring.
 */

const authClientCache = new Map();

function scannerUrl() {
  const base = process.env.SCANNER_SERVICE_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, '')}/scan`;
}

async function getScopedHeaders(target) {
  const isCloudRun = Boolean(process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT);
  if (!isCloudRun) return {};

  let cached = authClientCache.get(target);
  if (!cached) {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth();
    cached = await auth.getIdTokenClient(target);
    authClientCache.set(target, cached);
  }
  return cached.getRequestHeaders();
}

/**
 * @param {string} jobId - scan_jobs id to trigger
 * @returns {Promise<{ skipped: boolean }>}
 */
export async function triggerScanner(jobId) {
  const url = scannerUrl();
  if (!url) return { skipped: true };

  const headers = { 'content-type': 'application/json', ...(await getScopedHeaders(url)) };
  if (process.env.SCAN_INTERNAL_KEY) headers['x-scan-key'] = process.env.SCAN_INTERNAL_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jobId }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 500);
    throw new Error(`Scanner trigger failed (HTTP ${res.status}): ${text}`);
  }
  return { skipped: false };
}