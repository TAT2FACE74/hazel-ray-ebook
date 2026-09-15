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

type Size = { pageW: number; pageH: number };

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
  const [size, setSize] = useState<Size>({ pageW: 160, pageH: 240 });
  const [pageIndex, setPageIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      // Use ONLY the host box — same element page-flip reads as its block parent.
      // Mixing visualViewport with 100dvh caused top/bottom letterboxing.
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      // Odd total width: give the extra pixel to the right by flooring half.
      const pageW = Math.max(120, Math.floor(w / 2));
      const pageH = Math.max(160, h);
      setSize((prev) =>
        prev.pageW === pageW && prev.pageH === pageH
          ? prev
          : { pageW, pageH },
      );
      setReady(true);
    };

    measure();
    const ro = new ResizeObserver(() => {
      // rAF so layout (address bar show/hide) settles before we read
      requestAnimationFrame(measure);
    });
    ro.observe(host);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  const onFlip = useCallback((e: { data: number }) => {
    setPageIndex(e.data);
    playPageTurnSfx();
  }, []);

  const spreadLabel = useMemo(() => labelForPage(pageIndex), [pageIndex]);
  const showChrome = pageIndex === 0;
  const bookW = size.pageW * 2;
  const bookH = size.pageH;

  return (
    <div
      className="flip-stage"
      onPointerDown={unlockAudio}
      onTouchStart={unlockAudio}
    >
      <div className="flip-stage__book" ref={hostRef}>
        {ready && (
          <HTMLFlipBook
            key={`${size.pageW}x${size.pageH}`}
            width={size.pageW}
            height={size.pageH}
            size="fixed"
            minWidth={size.pageW}
            maxWidth={size.pageW}
            minHeight={size.pageH}
            maxHeight={size.pageH}
            autoSize={false}
            showCover={true}
            usePortrait={false}
            drawShadow={true}
            maxShadowOpacity={0.35}
            flippingTime={900}
            useMouseEvents={true}
            mobileScrollSupport={false}
            swipeDistance={20}
            className="hazel-flipbook"
            style={{
              width: `${bookW}px`,
              height: `${bookH}px`,
            }}
            onFlip={onFlip}
          >
            {PAGE_FILES.map((src, i) => (
              <Page key={src} src={src} index={i} />
            ))}
          </HTMLFlipBook>
        )}
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
