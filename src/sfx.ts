let sparkle: HTMLAudioElement | null = null;
let whoosh: HTMLAudioElement | null = null;
let unlocked = false;
let audioCtx: AudioContext | null = null;

function ensure() {
  if (!sparkle) {
    sparkle = new Audio(`${import.meta.env.BASE_URL}sparkle.mp3`);
    sparkle.preload = 'auto';
    sparkle.volume = 0.7;
  }
  if (!whoosh) {
    whoosh = new Audio(`${import.meta.env.BASE_URL}page-whoosh.mp3`);
    whoosh.preload = 'auto';
    whoosh.volume = 0.4;
  }
}

function ensureCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Soft magical chime stack (Web Audio) — works even if mp3 fails. */
function playChimeSynth() {
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [1046.5, 1318.5, 1568.0, 2093.0];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = now + i * 0.06;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18 / (i + 1), t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.75);
  });
}

/** Call once from a user gesture so iOS allows playback later. */
export function unlockAudio(): void {
  ensure();
  ensureCtx();
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
  playChimeSynth();
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
    /* ignore */
  }
}
