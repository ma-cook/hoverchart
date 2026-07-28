import { api, setTokens } from '../api-client';
import useAuthStore from '../stores/authStore';

export const signInUser = async () => {
  await useAuthStore.getState().signInWithGoogle();
};

export const completeRedirectSignIn = async () => {
  return null;
};

export const handlePostLoginRedirect = () => {
  if (sessionStorage.getItem('loginRedirectUrl')) {
    sessionStorage.removeItem('loginRedirectUrl');
  }
  return false;
};

export const signOut = async () => {
  useAuthStore.getState().signOut();
};

export const observeAuthState = (callback) => {
  const unsub = useAuthStore.subscribe((state) => {
    callback(state.authState.user);
  });
  if (useAuthStore.getState().authState.user) {
    callback(useAuthStore.getState().authState.user);
  }
  return unsub;
};

export const validateAuthToken = async (token) => {
  try {
    const data = await api.post('/api/auth/verify', { token }, {
      headers: { Authorization: `Bearer ${token}` },
      retries: 0,
    });
    return data.customToken || data.accessToken;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw error;
  }
};

export const handleUrlAuth = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (!code) return false;

  try {
    const data = await api.post('/api/auth/code', { code }, { retries: 0 });
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      const spaceId = params.get('spaceId');
      let newUrl = window.location.pathname;
      if (spaceId) newUrl += `?spaceId=${encodeURIComponent(spaceId)}`;
      window.history.replaceState({}, document.title, newUrl);
      return true;
    }
    return false;
  } catch (error) {
    console.error('URL auth failed:', error);
    return false;
  }
};

export const registerUserPresence = async (userId, spaceId) => {
  if (!userId || !spaceId) return;
  window.currentUser = { sub: userId };
  try {
    await api.post(`/api/spaces/${spaceId}/presence`, { userId });
  } catch (err) {
    console.error('Error registering presence:', err);
  }
};
