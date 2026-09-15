import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

type Size = { width: number; height: number };

function labelForPage(pageIndex: number): string {
  const n = PAGE_FILES.length;
  if (pageIndex <= 0) return 'Cover';
  if (pageIndex >= n - 1) return 'The End';
  const left = pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
  const right = left + 1;
  if (right >= n - 1 && left >= n - 1) return 'The End';
  return `Pages ${left + 1}–${Math.min(right + 1, n)}`;
}

export function FlipBook() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 160, height: 240 });
  const [pageIndex, setPageIndex] = useState(0);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      // Prefer visualViewport when present (mobile browser chrome)
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const w = Math.max(rect.width || vw, 1);
      const h = Math.max(rect.height || vh, 1);
      // One leaf = half screen wide, full screen tall → book fills the phone
      const width = Math.max(120, Math.floor(w / 2));
      const height = Math.max(160, Math.floor(h));
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', measure);
    viewport?.addEventListener('scroll', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      viewport?.removeEventListener('resize', measure);
      viewport?.removeEventListener('scroll', measure);
    };
  }, []);

  const onFlip = useCallback((e: { data: number }) => {
    setPageIndex(e.data);
    playPageTurnSfx();
  }, []);

  const spreadLabel = useMemo(() => labelForPage(pageIndex), [pageIndex]);
  const showChrome = pageIndex === 0;

  return (
    <div
      className="flip-stage"
      onPointerDown={unlockAudio}
      onTouchStart={unlockAudio}
    >
      <div className="flip-stage__book" ref={hostRef}>
        <HTMLFlipBook
          key={`${size.width}x${size.height}`}
          width={size.width}
          height={size.height}
          size="stretch"
          minWidth={size.width}
          maxWidth={size.width}
          minHeight={size.height}
          maxHeight={size.height}
          autoSize={false}
          showCover={true}
          usePortrait={false}
          drawShadow={true}
          maxShadowOpacity={0.45}
          flippingTime={900}
          useMouseEvents={true}
          mobileScrollSupport={false}
          swipeDistance={20}
          className="hazel-flipbook"
          style={{ width: '100%', height: '100%' }}
          onFlip={onFlip}
        >
          {PAGE_FILES.map((src, i) => (
            <Page key={src} src={src} index={i} />
          ))}
        </HTMLFlipBook>
      </div>
      {showChrome && (
        <div className="flip-stage__chrome">
          <span className="flip-stage__title">Hazel Ray Lights the Way</span>
          <span className="flip-stage__spread">{spreadLabel}</span>
          <span className="flip-stage__hint">Swipe to turn</span>
        </div>
      )}
    </div>
  );
}
