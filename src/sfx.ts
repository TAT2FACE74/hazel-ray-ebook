let sparkle: HTMLAudioElement | null = null;
let whoosh: HTMLAudioElement | null = null;
let unlocked = false;

function ensure() {
  if (!sparkle) {
    sparkle = new Audio(`${import.meta.env.BASE_URL}sparkle.mp3`);
    sparkle.preload = 'auto';
    sparkle.volume = 0.55;
  }
  if (!whoosh) {
    whoosh = new Audio(`${import.meta.env.BASE_URL}page-whoosh.mp3`);
    whoosh.preload = 'auto';
    whoosh.volume = 0.35;
  }
}

/** Call once from a user gesture so iOS allows playback later. */
export function unlockAudio(): void {
  ensure();
  if (unlocked) return;
  unlocked = true;
  const tryPlay = (a: HTMLAudioElement | null) => {
    if (!a) return;
    a.muted = true;
    const p = a.play();
    if (p) {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
      }).catch(() => {
        a.muted = false;
      });
    }
  };
  tryPlay(sparkle);
  tryPlay(whoosh);
}

export function playPageTurnSfx(): void {
  ensure();
  try {
    if (whoosh) {
      whoosh.currentTime = 0;
      void whoosh.play().catch(() => {});
    }
    if (sparkle) {
      sparkle.currentTime = 0;
      void sparkle.play().catch(() => {});
    }
  } catch {
    /* ignore autoplay blocks */
  }
}
