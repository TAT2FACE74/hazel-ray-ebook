/** PDF page PNGs in reading order (1-indexed filenames). */
export const PAGE_FILES: string[] = Array.from({ length: 28 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return `${import.meta.env.BASE_URL}pages/page-${n}.png`;
});

/** Portrait page aspect from PDF (576×856 pts). */
export const PAGE_ASPECT = 576 / 856;

/**
 * With showCover: page 1 = front cover (alone), page 28 = back (alone).
 * Interior pairs: Contents|Dedication, then illustration-left / text-right chapters.
 * Interior two-page spreads: 13 (pages 2–27).
 */
export const INTERIOR_SPREAD_COUNT = 13;
export const TOTAL_OPENINGS = 1 + INTERIOR_SPREAD_COUNT + 1; // cover + spreads + back
