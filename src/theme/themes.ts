import { paintFavicon } from './mark';

export type ThemeId = 'ink' | 'slate' | 'paper';

export type Theme = { readonly id: ThemeId; readonly name: string; readonly swatch: string };

export const THEMES: readonly Theme[] = [
  { id: 'ink', name: 'Ink', swatch: '#000000' },
  { id: 'slate', name: 'Slate', swatch: '#28313d' },
  { id: 'paper', name: 'Paper', swatch: '#f5f5f7' },
] as const;

const STORE = 'idiot.theme';

const isTheme = (value: unknown): value is ThemeId =>
  THEMES.some((theme) => theme.id === value);

const remembered = (): ThemeId | null => {
  try {
    const saved = localStorage.getItem(STORE);
    return isTheme(saved) ? saved : null;
  } catch {
    return null;
  }
};

const preferred = (): ThemeId =>
  globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper';

export const startingTheme = (): ThemeId => remembered() ?? preferred();

export const applyTheme = (theme: ThemeId) => {
  document.documentElement.dataset.theme = theme;
  paintFavicon();
  try {
    localStorage.setItem(STORE, theme);
  } catch {
    return;
  }
};
