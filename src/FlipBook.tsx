import { useCallback, useMemo, useRef, useState } from 'react';
import { PAGE_FILES } from './pages';
import { playPageTurnSfx, unlockAudio } from './sfx';

function labelForPage(pageIndex: number): string {
  const n = PAGE_FILES.length;
  if (pageIndex <= 0) return 'Cover';
  if (pageIndex >= n - 1) return 'The End';
  const left = pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
  const right = left + 1;
  return `Pages ${left + 1}–${Math.min(right + 1, n)}`;
}

/** Normalize to the left page of a landscape spread (0 = cover). */
function spreadLeft(pageIndex: number): number {
  if (pageIndex <= 0) return 0;
  return pageIndex % 2 === 1 ? pageIndex : pageIndex - 1;
}

function spreadPages(pageIndex: number): { left: number | null; right: number | null; cover: boolean } {
  const n = PAGE_FILES.length;
  if (pageIndex <= 0) return { left: null, right: null, cover: true };
  const left = spreadLeft(pageIndex);
  if (left >= n - 1) return { left: n - 1, right: null, cover: false };
  return { left, right: left + 1 < n ? left + 1 : null, cover: false };
}

function nextIndex(pageIndex: number, n: number): number | null {
  if (pageIndex >= n - 1) return null;
  if (pageIndex <= 0) return 1;
  const left = spreadLeft(pageIndex);
  const nxt = left + 2;
  return nxt >= n ? n - 1 : nxt;
}

function prevIndex(pageIndex: number): number | null {
  if (pageIndex <= 0) return null;
  if (pageIndex <= 1) return 0;
  return spreadLeft(pageIndex) - 2;
}

type Drag = {
  startX: number;
  currentX: number;
  width: number;
  dir: 'next' | 'prev' | null;
};

export function FlipBook() {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [animating, setAnimating] = useState(false);

  const n = PAGE_FILES.length;
  const spread = useMemo(() => spreadPages(pageIndex), [pageIndex]);
  const showChrome = pageIndex === 0;
  const canNext = nextIndex(pageIndex, n) !== null;
  const canPrev = prevIndex(pageIndex) !== null;

  const goTo = useCallback((idx: number) => {
    setPageIndex(idx);
    playPageTurnSfx();
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    unlockAudio();
    if (animating) return;
    const stage = stageRef.current;
    if (!stage) return;
    stage.setPointerCapture(e.pointerId);
    const next: Drag = {
      startX: e.clientX,
      currentX: e.clientX,
      width: stage.clientWidth,
      dir: null,
    };
    dragRef.current = next;
    setDrag(next);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = dragRef.current;
    if (!prev) return;
    const dx = e.clientX - prev.startX;
    let dir = prev.dir;
    if (!dir && Math.abs(dx) > 10) {
      dir = dx < 0 ? 'next' : 'prev';
      if (dir === 'next' && !canNext) dir = null;
      if (dir === 'prev' && !canPrev) dir = null;
    }
    const next = { ...prev, currentX: e.clientX, dir };
    dragRef.current = next;
    setDrag(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (stage?.hasPointerCapture(e.pointerId)) {
      stage.releasePointerCapture(e.pointerId);
    }
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d?.dir) return;

    const dx = e.clientX - d.startX;
    const threshold = Math.min(72, d.width * 0.12);
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 280);

    if (d.dir === 'next' && dx < -threshold) {
      const nxt = nextIndex(pageIndex, n);
      if (nxt !== null) goTo(nxt);
    } else if (d.dir === 'prev' && dx > threshold) {
      const prv = prevIndex(pageIndex);
      if (prv !== null) goTo(prv);
    }
  };

  let progress = 0;
  if (drag?.dir) {
    const dx = drag.currentX - drag.startX;
    if (drag.dir === 'next') progress = Math.min(1, Math.max(0, -dx / (drag.width * 0.4)));
    else progress = Math.min(1, Math.max(0, dx / (drag.width * 0.4)));
  }
  const flipAngle = progress * 160;
  const flipping = drag?.dir != null && progress > 0.02;

  const under = useMemo(() => {
    if (!drag?.dir) return null;
    if (drag.dir === 'next') {
      const nxt = nextIndex(pageIndex, n);
      return nxt === null ? null : spreadPages(nxt);
    }
    const prv = prevIndex(pageIndex);
    return prv === null ? null : spreadPages(prv);
  }, [drag?.dir, n, pageIndex]);

  const leaf = (index: number | null, side: 'left' | 'right' | 'cover') => {
    if (index === null && side !== 'cover') {
      return <div className={`leaf leaf--empty leaf--${side}`} key={side} />;
    }
    if (side === 'cover') {
      return (
        <div className="leaf leaf--cover" key="cover">
          <img src={PAGE_FILES[0]} alt="Cover" draggable={false} loading="eager" />
        </div>
      );
    }
    return (
      <div className={`leaf leaf--${side}`} key={`${side}-${index}`}>
        <img
          src={PAGE_FILES[index!]}
          alt={`Page ${index! + 1}`}
          draggable={false}
          loading={index! < 4 ? 'eager' : 'lazy'}
        />
      </div>
    );
  };

  const paintSpread = (s: ReturnType<typeof spreadPages>) => {
    if (s.cover) return leaf(0, 'cover');
    return (
      <>
        {leaf(s.left, 'left')}
        {leaf(s.right, 'right')}
      </>
    );
  };

  return (
    <div
      className="flip-stage"
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="spread spread--base">
        {flipping && under ? paintSpread(under) : paintSpread(spread)}
      </div>

      {flipping && !spread.cover && (
        <div className="spread spread--overlay" aria-hidden>
          {drag?.dir === 'next' ? (
            <>
              {leaf(spread.left, 'left')}
              <div
                className="leaf leaf--flip leaf--right"
                style={{ transform: `rotateY(${-flipAngle}deg)` }}
              >
                {spread.right !== null && (
                  <img src={PAGE_FILES[spread.right]} alt="" draggable={false} />
                )}
                <div className="leaf__shade" style={{ opacity: progress * 0.5 }} />
              </div>
            </>
          ) : (
            <>
              <div
                className="leaf leaf--flip leaf--left"
                style={{ transform: `rotateY(${flipAngle}deg)` }}
              >
                {spread.left !== null && (
                  <img src={PAGE_FILES[spread.left]} alt="" draggable={false} />
                )}
                <div className="leaf__shade" style={{ opacity: progress * 0.5 }} />
              </div>
              {leaf(spread.right, 'right')}
            </>
          )}
        </div>
      )}

      {flipping && spread.cover && drag?.dir === 'next' && (
        <div className="spread spread--overlay" aria-hidden>
          <div
            className="leaf leaf--flip leaf--cover"
            style={{ transform: `rotateY(${-flipAngle}deg)`, transformOrigin: 'left center' }}
          >
            <img src={PAGE_FILES[0]} alt="" draggable={false} />
            <div className="leaf__shade" style={{ opacity: progress * 0.5 }} />
          </div>
        </div>
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
