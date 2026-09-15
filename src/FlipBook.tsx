import { forwardRef, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { PAGE_ASPECT, PAGE_FILES } from './pages';
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
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Minimal padding so the two-page spread fills nearly the full viewport
  const padX = 6;
  const padY = 10;
  const maxH = Math.max(120, vh - padY);
  const maxW = Math.max(80, (vw - padX) / 2);
  let height = maxH;
  let width = height * PAGE_ASPECT;
  if (width > maxW) {
    width = maxW;
    height = width / PAGE_ASPECT;
  }
  return { width: Math.floor(width), height: Math.floor(height) };
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
          size="stretch"
          minWidth={Math.max(100, Math.floor(size.width * 0.45))}
          maxWidth={size.width}
          minHeight={Math.max(140, Math.floor(size.height * 0.45))}
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
