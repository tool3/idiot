import { paintFavicon } from './mark';

export type DesignId = 'flat' | 'deep';

const STORE = 'idiot.design';

const isDesign = (value: unknown): value is DesignId => value === 'flat' || value === 'deep';

export const startingDesign = (): DesignId => {
  try {
    const saved = localStorage.getItem(STORE);
    return isDesign(saved) ? saved : 'deep';
  } catch {
    return 'deep';
  }
};

export const applyDesign = (design: DesignId) => {
  document.documentElement.dataset.design = design;
  paintFavicon();
  try {
    localStorage.setItem(STORE, design);
  } catch {
    return;
  }
};
