import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  
  useRef,
  useState,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import { PAGE_FILES } from './pages';
import { playPageTurnSfx, unlockAudio } from './sfx';

const Page = forwardRef<
  HTMLDivElement,
  { src: string; index: number; kind: 'cover' | 'page' }
>(function Page({ src, index, kind }, ref) {
  const hard = index === 0 || index === PAGE_FILES.length - 1;
  return (
    <div
      className={`book-page book-page--${kind}`}
      ref={ref}
      data-density={hard ? 'hard' : 'soft'}
    >
      <img
        src={src}
        alt={kind === 'cover' ? 'Cover' : `Page ${index + 1}`}
        draggable={false}
        loading={index < 4 ? 'eager' : 'lazy'}
      />
    </div>
  );
});

type Size = { pageW: number; pageH: number };

type FlipApi = {
  pageFlip: () => {
    update: () => void;
    getBoundsRect: () => {
      left: number;
      top: number;
      width: number;
      height: number;
      pageWidth: number;
    } | null;
  };
};

async function requestFs(el: HTMLElement | null) {
  if (!el || document.fullscreenElement) return;
  try {
    await el.requestFullscreen();
  } catch {
    /* needs gesture on many browsers */
  }
}

function labelForPage(pageIndex: number): string {
  const n = PAGE_FILES.length;
  if (pageIndex <= 0) return 'Cover';
  if (pageIndex >= n - 1) return 'The End';
  const left = pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
  return `Pages ${left + 1}–${Math.min(left + 2, n)}`;
}

export function FlipBook() {
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<FlipApi>(null);
  const [size, setSize] = useState<Size>({ pageW: 200, pageH: 300 });
  const [ready, setReady] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const [hintGone, setHintGone] = useState(false);

  // Pin stage to visible viewport pixels
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const sync = () => {
      const vv = window.visualViewport;
      const w = Math.max(1, Math.round(vv?.width ?? window.innerWidth));
      const h = Math.max(1, Math.round(vv?.height ?? window.innerHeight));
      const left = Math.round(vv?.offsetLeft ?? 0);
      const top = Math.round(vv?.offsetTop ?? 0);
      stage.style.position = 'fixed';
      stage.style.left = `${left}px`;
      stage.style.top = `${top}px`;
      stage.style.width = `${w}px`;
      stage.style.height = `${h}px`;
      stage.style.right = 'auto';
      stage.style.bottom = 'auto';
      stage.style.margin = '0';

      const pageW = Math.max(120, Math.floor(w / 2));
      const pageH = Math.max(160, h);
      setSize((prev) =>
        prev.pageW === pageW && prev.pageH === pageH ? prev : { pageW, pageH },
      );
      setReady(true);
    };

    sync();
    // Try fullscreen as soon as landscape book mounts (may need later gesture)
    void requestFs(stage);

    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', () => {
      window.setTimeout(sync, 50);
      window.setTimeout(() => void requestFs(stage), 100);
    });
    const vv = window.visualViewport;
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    return () => {
      window.removeEventListener('resize', sync);
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Force page-flip resting pages to fill the host every frame (kills letterboxing)
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const host = hostRef.current;
      if (host) {
        const hw = host.clientWidth;
        const hh = host.clientHeight;
        const pw = Math.floor(hw / 2);
        host.querySelectorAll<HTMLElement>('.stf__item.--simple').forEach((el) => {
          const right = el.classList.contains('--right');
          el.style.setProperty('display', 'block', 'important');
          el.style.setProperty('position', 'absolute', 'important');
          el.style.setProperty('top', '0px', 'important');
          el.style.setProperty('left', right ? `${pw}px` : '0px', 'important');
          el.style.setProperty('width', `${pw}px`, 'important');
          el.style.setProperty('height', `${hh}px`, 'important');
        });
        const parent = host.querySelector<HTMLElement>('.hazel-flipbook');
        const wrap = host.querySelector<HTMLElement>('.stf__wrapper');
        const block = host.querySelector<HTMLElement>('.stf__block');
        for (const el of [parent, wrap, block]) {
          if (!el) continue;
          el.style.setProperty('width', `${hw}px`, 'important');
          el.style.setProperty('height', `${hh}px`, 'important');
          el.style.setProperty('max-width', 'none', 'important');
          el.style.setProperty('max-height', 'none', 'important');
          el.style.setProperty('padding', '0', 'important');
          el.style.setProperty('padding-bottom', '0', 'important');
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, size.pageW, size.pageH]);

  const onFlip = useCallback((e: { data: number }) => {
    setPageIndex(e.data);
    setHintGone(true);
    playPageTurnSfx();
  }, []);

  const onUserGesture = () => {
    unlockAudio();
    void requestFs(stageRef.current);
  };

  const showChrome = pageIndex === 0;
  const showFsHint = !isFs && !hintGone;
  const bookW = size.pageW * 2;
  const bookH = size.pageH;

  return (
    <div
      className="flip-stage"
      ref={stageRef}
      onPointerDown={onUserGesture}
      onTouchStart={onUserGesture}
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
            maxShadowOpacity={0.5}
            flippingTime={1000}
            useMouseEvents={true}
            mobileScrollSupport={false}
            swipeDistance={18}
            className="hazel-flipbook"
            style={{ width: `${bookW}px`, height: `${bookH}px` }}
            onFlip={onFlip}
          >
            {PAGE_FILES.map((src, i) => (
              <Page
                key={src}
                src={src}
                index={i}
                kind={i === 0 ? 'cover' : 'page'}
              />
            ))}
          </HTMLFlipBook>
        )}
      </div>

      <div className="build-stamp" aria-hidden>
        full screen
      </div>

      {showFsHint && (
        <div className="fs-hint">Tap for full screen</div>
      )}

      {showChrome && (
        <div className="flip-stage__chrome">
          <span className="flip-stage__title">Hazel Ray Lights the Way</span>
          <span className="flip-stage__spread">{labelForPage(pageIndex)}</span>
          <span className="flip-stage__hint">Swipe to turn</span>
        </div>
      )}
    </div>
  );
}
