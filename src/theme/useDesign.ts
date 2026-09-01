import { useCallback, useState } from 'react';
import { applyDesign, startingDesign, type DesignId } from './designs';

export const useDesign = (): readonly [DesignId, () => void] => {
  const [design, setDesign] = useState<DesignId>(startingDesign);

  const toggle = useCallback(
    () =>
      setDesign((current) => {
        const next = current === 'deep' ? 'flat' : 'deep';
        applyDesign(next);
        return next;
      }),
    [],
  );

  return [design, toggle];
};
