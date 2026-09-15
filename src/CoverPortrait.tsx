import { PAGE_FILES } from './pages';
import { unlockAudio } from './sfx';

export function CoverPortrait() {
  return (
    <div className="cover-portrait" onPointerDown={unlockAudio} onTouchStart={unlockAudio}>
      <img
        className="cover-portrait__art"
        src={PAGE_FILES[0]}
        alt="Hazel Ray Lights the Way — cover"
        draggable={false}
      />
      <div className="cover-portrait__scrim" />
      <div className="cover-portrait__prompt" role="status">
        <div className="rotate-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="48" height="48">
            <rect
              x="18"
              y="8"
              width="28"
              height="48"
              rx="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <circle cx="32" cy="48" r="2.5" fill="currentColor" />
            <path
              d="M50 22c6 4 8 12 4 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M54 18l0 10 -10 -2" fill="currentColor" />
          </svg>
        </div>
        <p className="cover-portrait__message">Please rotate your phone sideways.</p>
        <p className="cover-portrait__hint">Landscape unlocks the flip-book</p>
      </div>
    </div>
  );
}
