# Hazel Ray Lights the Way — Mobile Flip-Book

A mobile-first flip-book web app for **Hazel Ray Lights the Way** by Chad "Tat2face" Kerns.

## UX

1. **Portrait:** full-screen cover + “Please rotate your phone sideways.”
2. **Landscape:** left+right spread with realistic finger-following page curl (`page-flip` / StPageFlip).
3. Swipe right→left to turn forward; left→right to go back.
4. Illustrations on the left, chapter text on the right (after front matter).
5. Sparkling magic SFX on each page turn (`public/sparkle.mp3`).

## Spreads

- **28 PDF pages** → cover alone, **13 interior two-page spreads**, back cover (“The End”).
- Front matter: Contents | Dedication, then illustration | text chapter pairs.

## Develop

```bash
npm install
npm run dev
npm run build
npm run preview
```

Pages were extracted with:

```bash
pdftoppm -png -r 160 Hazel-Ray-Lights-the-Way.pdf public/pages/page
```

## iOS notes

- Unlock audio with a first tap (Safari autoplay policy).
- Use landscape lock off so rotation works.
- `viewport-fit=cover` + safe-area padding for notched devices.
- Page curl is canvas/touch based; works in mobile Safari.

## License

Book content © Chad "Tat2face" Kerns. App shell MIT for code only.
