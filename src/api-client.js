const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || API_BASE;

let accessToken = null;
let refreshToken = null;
let refreshPromise = null;

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) {
    localStorage.setItem('accessToken', access);
  } else {
    localStorage.removeItem('accessToken');
  }
  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

export function loadTokens() {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
  return { accessToken, refreshToken };
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('No refresh token');
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then(async (res) => {
  // 304 Not Modified: the browser already holds the identical cached body
  // (conditional GET revalidation), so there is no payload. Returning null
  // lets pollers treat it as a clean "nothing changed" signal instead of an
  // error.
  if (res.status === 304) {
    return null;
  }

  if (!res.ok) {
      clearTokens();
      throw new Error('Refresh failed');
    }
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken || refreshToken);
    return data.accessToken;
  }).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function api(path, options = {}) {
  const { body, method, headers = {}, retries = 1, params } = options;
  let url = path;
  if (params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) search.append(key, item);
      } else {
        search.set(key, value);
      }
    }
    const qs = search.toString();
    if (qs) {
      url = `${path}${path.includes('?') ? '&' : '?'}${qs}`;
    }
  }
  loadTokens();
  const makeRequest = async (token) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: method || (body ? 'POST' : 'GET'),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    return res;
  };

  let res = await makeRequest(accessToken);
  if (res.status === 401 && retries > 0 && refreshToken) {
    try {
      const newToken = await refreshAccessToken();
      res = await makeRequest(newToken);
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.text().catch(() => 'Request failed');
    throw new Error(`${res.status}: ${err}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

api.get = (path, opts) => api(path, { ...opts, method: 'GET' });
api.post = (path, body, opts) => api(path, { ...opts, method: 'POST', body });
api.patch = (path, body, opts) => api(path, { ...opts, method: 'PATCH', body });
api.delete = (path, opts) => api(path, { ...opts, method: 'DELETE' });

let socket = null;
let socketCallbacks = new Map();

export function getSocket() {
  if (socket?.connected) return socket;
  loadTokens();
  if (!accessToken) return null;

  const { io } = window.__SOCKET_IO__ || {};
  if (!io) return null;

  socket = io(WS_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
  });

  socket.on('connect_error', async (err) => {
    if (err.message.includes('auth') && refreshToken) {
      try {
        const newToken = await refreshAccessToken();
        socket.auth = { token: newToken };
        socket.connect();
      } catch { /* ignore */ }
    }
  });

  socket.on('disconnect', () => {
    socketCallbacks.forEach((cb, event) => {
      if (event.startsWith('internal:')) return;
    });
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (s && !s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function onSocket(event, callback) {
  const s = getSocket();
  if (s) s.on(event, callback);
  socketCallbacks.set(`event:${event}`, callback);
  return () => {
    if (socket) socket.off(event, callback);
    socketCallbacks.delete(`event:${event}`);
  };
}

export function emitSocket(event, data) {
  const s = getSocket();
  if (s?.connected) s.emit(event, data);
}
