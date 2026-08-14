import { Router } from 'express';
import { createGunzip } from 'zlib';

const router = Router();

async function gunzipBuffer(buf) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const g = createGunzip();
    g.on('data', c => chunks.push(c));
    g.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    g.on('error', reject);
    g.end(buf);
  });
}

async function parseBody(req) {
  if (Buffer.isBuffer(req.body)) {
    const json = await gunzipBuffer(req.body);
    return JSON.parse(json);
  }
  return req.body;
}

const ALLOWED_HOSTS = [
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'opencode.ai',
  'integrate.api.nvidia.com',
];

function isAllowed(url) {
  try {
    const u = new URL(url);
    return ALLOWED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

// ── Global request throttle (per upstream host) ────────────────────────────
// All clients/tabs share one Cloud Run egress IP, so every provider's per-IP
// rate window is shared too. Serialize requests per host (max 1 in-flight, min
// spacing between starts) and self-tune the spacing: back off on upstream 429s,
// recover on success. This keeps the app under free-tier rate caps regardless
// of client-side fan-out (tool rounds, sub-agents, compression summarizers).
const LLM_MIN_INTERVAL_MS = Number(process.env.LLM_MIN_INTERVAL_MS) || 20_000;
const LLM_MAX_INTERVAL_MS = Number(process.env.LLM_MAX_INTERVAL_MS) || 60_000;
const LLM_QUEUE_MAX_WAIT_MS = Number(process.env.LLM_QUEUE_MAX_WAIT_MS) || 120_000;

const hostThrottle = new Map();

function getHostThrottle(host) {
  let t = hostThrottle.get(host);
  if (!t) {
    t = { nextAllowedAt: 0, intervalMs: LLM_MIN_INTERVAL_MS, inFlight: 0 };
    hostThrottle.set(host, t);
  }
  return t;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForThrottleSlot(host, res) {
  const t = getHostThrottle(host);
  const deadline = Date.now() + LLM_QUEUE_MAX_WAIT_MS;
  while (true) {
    if (t.inFlight < 1 && Date.now() >= t.nextAllowedAt) break;
    if (Date.now() >= deadline) {
      const retryAfterSec = Math.max(1, Math.ceil((t.nextAllowedAt - Date.now()) / 1000));
      res.status(429).setHeader('Retry-After', String(retryAfterSec)).json({
        error: 'Rate limit — request queue is full, retry after the current request completes',
        retryAfter: retryAfterSec,
      });
      return false;
    }
    await sleep(200);
  }
  t.inFlight++;
  return true;
}

function releaseThrottleSlot(host, { rateLimited }) {
  const t = getHostThrottle(host);
  t.inFlight = Math.max(0, t.inFlight - 1);
  if (rateLimited) {
    t.intervalMs = Math.min(t.intervalMs * 2, LLM_MAX_INTERVAL_MS);
    console.warn(`[llm-proxy] ${host} throttle backed off to ${t.intervalMs}ms spacing`);
  } else {
    t.intervalMs = Math.max(LLM_MIN_INTERVAL_MS, Math.floor(t.intervalMs / 2));
  }
  t.nextAllowedAt = Date.now() + t.intervalMs;
}

let activeChatRequests = 0;
let chatRequestTotal = 0;

router.post('/chat', async (req, res) => {
  let parsed;
  try {
    parsed = await parseBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Failed to parse request body', detail: e.message });
  }
  const { url, headers, body } = parsed;
  if (!url || !isAllowed(url)) {
    return res.status(400).json({ error: 'Invalid or disallowed URL' });
  }

  const startedAt = Date.now();
  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const host = (() => { try { return new URL(url).hostname; } catch { return 'unknown'; } })();
  const model = body?.model || 'unknown';
  const keyHint = String(headers?.authorization || '').slice(0, 12) || String(headers?.['x-api-key'] || '').slice(0, 12) || 'none';
  chatRequestTotal++;
  console.log(`[llm-proxy] REQ ${new Date().toISOString()} ip=${clientIp} host=${host} model=${model} messages=${(body?.messages || []).length} tools=${(body?.tools || []).length} maxTokens=${body?.max_tokens} key=${keyHint} total=${chatRequestTotal}`);

  if (!(await waitForThrottleSlot(host, res))) return;

  activeChatRequests++;
  let upstreamRateLimited = false;
  try {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 5 * 60 * 1000);

    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: timeoutController.signal,
    });
    clearTimeout(timeoutId);

    const elapsedMs = Date.now() - startedAt;
    const retryAfter = upstream.headers.get('retry-after');
    const rateHeaders = {};
    for (const [k, v] of upstream.headers.entries()) {
      if (/ratelimit|retry|quota|throttl/i.test(k)) rateHeaders[k] = v;
    }
    if (upstream.status === 429) {
      upstreamRateLimited = true;
      console.warn(`[llm-proxy] 429 from ${host}: retryAfter=${retryAfter || 'none'} fullHeaders=${JSON.stringify([...upstream.headers.entries()])}`);
    }
    console.log(`[llm-proxy] RES ${new Date().toISOString()} ip=${clientIp} host=${host} model=${model} status=${upstream.status} elapsedMs=${elapsedMs} retryAfter=${retryAfter || 'none'} ratelimit=${JSON.stringify(rateHeaders)} total=${chatRequestTotal} active=${activeChatRequests}`);

    res.status(upstream.status);

    if (retryAfter) res.setHeader('Retry-After', retryAfter);

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      const PUMP_WATCHDOG_MS = 5 * 60 * 1000;
      let pumpWatchdogId = null;
      const resetPumpWatchdog = () => {
        clearTimeout(pumpWatchdogId);
        pumpWatchdogId = setTimeout(() => {
          reader.cancel('pump watchdog timeout');
        }, PUMP_WATCHDOG_MS);
      };

      const pump = async () => {
        try {
          while (true) {
            resetPumpWatchdog();
            const { done, value } = await reader.read();
            clearTimeout(pumpWatchdogId);
            if (done) {
              res.end();
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        } catch (err) {
          clearTimeout(pumpWatchdogId);
          if (!res.writableEnded) res.end();
        }
      };

      req.on('close', () => {
        clearTimeout(pumpWatchdogId);
        reader.cancel();
      });

      await pump();
    } else {
      const text = await upstream.text();
      res.setHeader('Content-Type', contentType || 'application/json');
      if (upstream.status >= 400) {
        console.warn(`[llm-proxy] ERR response from upstream ${host}: status=${upstream.status} body=${text.slice(0, 500)}`);
      }
      res.send(text);
    }
  } catch (err) {
    console.error(`[llm-proxy] upstream fetch failed: host=${host} err=${err.message}`);
    if (!res.headersSent) res.status(502).json({ error: 'Proxy request failed', detail: err.message });
  } finally {
    activeChatRequests--;
    releaseThrottleSlot(host, { rateLimited: upstreamRateLimited });
    console.log(`[llm-proxy] DONE ${new Date().toISOString()} host=${host} model=${model} total=${chatRequestTotal} activeAfter=${activeChatRequests}`);
  }
});

router.post('/models', async (req, res) => {
  let parsed;
  try {
    parsed = await parseBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Failed to parse request body', detail: e.message });
  }
  const { url, headers } = parsed;
  if (!url || !isAllowed(url)) {
    return res.status(400).json({ error: 'Invalid or disallowed URL' });
  }

  try {
    const upstream = await fetch(url, { method: 'GET', headers });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Proxy request failed', detail: err.message });
  }
});

export { router as llmRouter };
