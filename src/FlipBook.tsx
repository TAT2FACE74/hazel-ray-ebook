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

type Size = { pageW: number; pageH: number; stageW: number; stageH: number };

function labelForPage(pageIndex: number): string {
  const n = PAGE_FILES.length;
  if (pageIndex <= 0) return 'Cover';
  if (pageIndex >= n - 1) return 'The End';
  const left = pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
  const right = left + 1;
  if (right >= n - 1 && left >= n - 1) return 'The End';
  return `Pages ${left + 1}–${Math.min(right + 1, n)}`;
}

type FlipApi = {
  pageFlip: () => {
    update: () => void;
    getBoundsRect: () => {
      left: number;
      top: number;
      width: number;
      height: number;
      pageWidth: number;
    };
  };
};

export function FlipBook() {
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipApi>(null);
  const [size, setSize] = useState<Size>({
    pageW: 160,
    pageH: 240,
    stageW: 320,
    stageH: 240,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const fitToStage = useCallback(() => {
    const host = hostRef.current;
    const root = host?.querySelector('.hazel-flipbook') as HTMLElement | null;
    const api = bookRef.current?.pageFlip?.();
    if (!host || !root || !api) return;
    try {
      api.update();
      const r = api.getBoundsRect();
      if (!r?.width || !r?.height) return;
      const hw = host.clientWidth;
      const hh = host.clientHeight;
      // Stretch the drawn book so its spread exactly fills the host (kills letterboxing).
      const sx = hw / r.width;
      const sy = hh / r.height;
      root.style.transformOrigin = '0 0';
      root.style.transform = `translate(${-r.left * sx}px, ${-r.top * sy}px) scale(${sx}, ${sy})`;
    } catch {
      // ignore until page-flip is ready
    }
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      // Bind the stage to the *visible* viewport (not 100dvh under the URL bar).
      const vv = window.visualViewport;
      const stageW = Math.max(1, Math.round(vv?.width ?? window.innerWidth));
      const stageH = Math.max(1, Math.round(vv?.height ?? window.innerHeight));
      const left = Math.round(vv?.offsetLeft ?? 0);
      const top = Math.round(vv?.offsetTop ?? 0);

      stage.style.position = 'fixed';
      stage.style.left = `${left}px`;
      stage.style.top = `${top}px`;
      stage.style.width = `${stageW}px`;
      stage.style.height = `${stageH}px`;
      stage.style.right = 'auto';
      stage.style.bottom = 'auto';

      const pageW = Math.max(120, Math.floor(stageW / 2));
      const pageH = Math.max(160, stageH);
      setSize((prev) =>
        prev.pageW === pageW &&
        prev.pageH === pageH &&
        prev.stageW === stageW &&
        prev.stageH === stageH
          ? prev
          : { pageW, pageH, stageW, stageH },
      );
      setReady(true);
      requestAnimationFrame(() => requestAnimationFrame(fitToStage));
    };

    measure();
    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    ro.observe(document.documentElement);
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
  }, [fitToStage]);

  const onFlip = useCallback(
    (e: { data: number }) => {
      setPageIndex(e.data);
      playPageTurnSfx();
      requestAnimationFrame(fitToStage);
    },
    [fitToStage],
  );

  const onInit = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(fitToStage));
  }, [fitToStage]);

  const spreadLabel = useMemo(() => labelForPage(pageIndex), [pageIndex]);
  const showChrome = pageIndex === 0;
  const bookW = size.pageW * 2;
  const bookH = size.pageH;

  return (
    <div
      className="flip-stage"
      ref={stageRef}
      onPointerDown={unlockAudio}
      onTouchStart={unlockAudio}
    >
      <div className="flip-stage__book" ref={hostRef}>
        {ready && (
          <HTMLFlipBook
            ref={bookRef as never}
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
            maxShadowOpacity={0.3}
            flippingTime={900}
            useMouseEvents={true}
            mobileScrollSupport={false}
            swipeDistance={20}
            className="hazel-flipbook"
            style={{ width: `${bookW}px`, height: `${bookH}px` }}
            onFlip={onFlip}
            onInit={onInit}
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
