import { forwardRef, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { PAGE_FILES } from './pages';
import { playPageTurnSfx, unlockAudio } from './sfx';

const Page = forwardRef<HTMLDivElement, { src: string; index: number }>(
  function Page({ src, index }, ref) {
    const hard = index === 0 || index === PAGE_FILES.length - 1;
    return (
      <div className="book-page" ref={ref} data-density={hard ? 'hard' : 'soft'}>
        <img
          src={src}
          alt={`Page ${index + 1}`}
          draggable={false}
          loading={index < 4 ? 'eager' : 'lazy'}
        />
      </div>
    );
  },
);

function computePageSize() {
  // Fill the phone: each leaf is half the screen wide and full height.
  // Stretch pages to the viewport (do not letterbox to PDF aspect).
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.max(120, Math.floor(vw / 2));
  const height = Math.max(160, Math.floor(vh));
  return { width, height };
}

function labelForPage(pageIndex: number): string {
  const n = PAGE_FILES.length;
  if (pageIndex <= 0) return 'Cover';
  if (pageIndex >= n - 1) return 'The End';
  // With showCover, landscape spreads start at index 1: (1|2), (3|4), ...
  const left = pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
  const right = left + 1;
  if (right >= n - 1 && left >= n - 1) return 'The End';
  return `Pages ${left + 1}–${Math.min(right + 1, n)}`;
}

export function FlipBook() {
  const [size, setSize] = useState(computePageSize);
  const [pageIndex, setPageIndex] = useState(0);

  useLayoutEffect(() => {
    const onResize = () => setSize(computePageSize());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    onResize();
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const onFlip = useCallback((e: { data: number }) => {
    setPageIndex(e.data);
    playPageTurnSfx();
  }, []);

  const spreadLabel = useMemo(() => labelForPage(pageIndex), [pageIndex]);

  return (
    <div
      className="flip-stage"
      onPointerDown={unlockAudio}
      onTouchStart={unlockAudio}
    >
      <div className="flip-stage__book">
        <HTMLFlipBook
          key={`${size.width}x${size.height}`}
          width={size.width}
          height={size.height}
          size="fixed"
          minWidth={size.width}
          maxWidth={size.width}
          minHeight={size.height}
          maxHeight={size.height}
          showCover={true}
          usePortrait={false}
          drawShadow={true}
          maxShadowOpacity={0.55}
          flippingTime={900}
          useMouseEvents={true}
          mobileScrollSupport={false}
          swipeDistance={25}
          className="hazel-flipbook"
          onFlip={onFlip}
        >
          {PAGE_FILES.map((src, i) => (
            <Page key={src} src={src} index={i} />
          ))}
        </HTMLFlipBook>
      </div>
      <div className="flip-stage__chrome">
        <span className="flip-stage__title">Hazel Ray Lights the Way</span>
        <span className="flip-stage__spread">{spreadLabel}</span>
        <span className="flip-stage__hint">Swipe to turn · fold follows your finger</span>
      </div>
    </div>
  );
}
