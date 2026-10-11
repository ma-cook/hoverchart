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

function scannerBaseUrl() {
  const base = process.env.SCANNER_SERVICE_URL;
  if (!base) return null;
  return base.replace(/\/+$/, '');
}

/**
 * OIDC ID token for the scanner.
 *
 * The audience MUST be the scanner's *base* service URL: Cloud Run validates
 * `aud` against the service hostname, so a `host/path` value (e.g. `.../scan`)
 * is rejected even though the request is sent to that path. We therefore mint
 * the token for the base URL and only append `/scan` to the fetch target.
 *
 * Cloud Run *services* expose K_SERVICE (not GOOGLE_CLOUD_PROJECT — that is a
 * functions-only variable), so K_SERVICE is the reliable "am I on Cloud Run"
 * signal. Falling back to the project vars keeps older setups working.
 */
async function getScopedHeaders(audience) {
  const isCloudRun = Boolean(
    process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT
  );
  if (!isCloudRun) return {};

  let cached = authClientCache.get(audience);
  if (!cached) {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth();
    cached = await auth.getIdTokenClient(audience);
    authClientCache.set(audience, cached);
  }
  return cached.getRequestHeaders();
}

/**
 * @param {string} jobId - scan_jobs id to trigger
 * @returns {Promise<{ skipped: boolean }>}
 */
export async function triggerScanner(jobId) {
  const base = scannerBaseUrl();
  if (!base) return { skipped: true };

  const headers = { 'content-type': 'application/json', ...(await getScopedHeaders(base)) };
  if (process.env.SCAN_INTERNAL_KEY) headers['x-scan-key'] = process.env.SCAN_INTERNAL_KEY;

  const res = await fetch(`${base}/scan`, {
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