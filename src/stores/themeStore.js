import { createWithEqualityFn } from 'zustand/traditional';

import { safeGetItem, safeSetItem } from '../utils/safeLocalStorage';

const THEME_STORAGE_KEY = 'hoverchart:theme';

function readStoredTheme() {
  const stored = safeGetItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

function applyThemeAttribute(mode) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
  }
}

const initialMode = readStoredTheme();
applyThemeAttribute(initialMode);

const useThemeStore = createWithEqualityFn((set) => ({
  mode: initialMode,

  toggleTheme: () =>
    set((state) => {
      const mode = state.mode === 'dark' ? 'light' : 'dark';
      safeSetItem(THEME_STORAGE_KEY, mode);
      applyThemeAttribute(mode);
      return { mode };
    }),

  setTheme: (mode) =>
    set(() => {
      const nextMode = mode === 'dark' ? 'dark' : 'light';
      safeSetItem(THEME_STORAGE_KEY, nextMode);
      applyThemeAttribute(nextMode);
      return { mode: nextMode };
    }),
}));

export default useThemeStore;
