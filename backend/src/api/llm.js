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

  try {
    const MAX_RETRIES = 3;
    let upstream;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 5 * 60 * 1000);

      try {
        upstream = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: timeoutController.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (upstream.status !== 429) break;

      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.min(2000 * Math.pow(2, attempt), 16000);
        console.log(`[proxy] 429 retry ${attempt + 1}/${MAX_RETRIES}, waiting ${backoffMs}ms`);
        await new Promise(r => setTimeout(r, backoffMs));
        upstream.body?.cancel?.();
      }
    }

    res.status(upstream.status);

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
      res.send(text);
    }
  } catch (err) {
    res.status(502).json({ error: 'Proxy request failed', detail: err.message });
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
