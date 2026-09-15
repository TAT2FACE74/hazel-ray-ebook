import { useEffect, useState } from 'react';

export type Orientation = 'portrait' | 'landscape';

function readOrientation(): Orientation {
  if (typeof window === 'undefined') return 'portrait';
  if (window.matchMedia('(orientation: landscape)').matches) return 'landscape';
  if (window.matchMedia('(orientation: portrait)').matches) return 'portrait';
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(readOrientation);

  useEffect(() => {
    const update = () => setOrientation(readOrientation());
    const mql = window.matchMedia('(orientation: landscape)');

    const add = () => {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', update);
      } else {
        // Safari < 14
        (mql as MediaQueryList & { addListener: (cb: () => void) => void }).addListener(update);
      }
    };
    const remove = () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', update);
      } else {
        (mql as MediaQueryList & { removeListener: (cb: () => void) => void }).removeListener(
          update,
        );
      }
    };

    add();
    window.addEventListener('resize', update);
    const onOrient = () => {
      window.setTimeout(update, 100);
      window.setTimeout(update, 350);
    };
    window.addEventListener('orientationchange', onOrient);
    update();
    return () => {
      remove();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', onOrient);
    };
  }, []);

  return orientation;
}
