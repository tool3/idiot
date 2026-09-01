import { useCallback, useState } from 'react';
import { applyTheme, startingTheme, type ThemeId } from './themes';

export const useTheme = (): readonly [ThemeId, (theme: ThemeId) => void] => {
  const [theme, setTheme] = useState<ThemeId>(startingTheme);

  const choose = useCallback((next: ThemeId) => {
    applyTheme(next);
    setTheme(next);
  }, []);

  return [theme, choose];
};
