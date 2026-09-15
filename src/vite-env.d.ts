/// <reference types="vite/client" />

declare module 'react-pageflip' {
  import type { ReactNode, Ref } from 'react';

  export interface HTMLFlipBookProps {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    renderOnlyPageLengthChange?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
    onFlip?: (e: { data: number }) => void;
    onChangeState?: (e: { data: string }) => void;
    onChangeOrientation?: (e: { data: string }) => void;
    onInit?: (e: { data: { page: number; mode: string } }) => void;
  }

  export interface HTMLFlipBookRef {
    pageFlip(): {
      flipNext: (corner?: string) => void;
      flipPrev: (corner?: string) => void;
      getCurrentPageIndex: () => number;
      getPageCount: () => number;
    };
  }

  const HTMLFlipBook: React.ForwardRefExoticComponent<
    HTMLFlipBookProps & React.RefAttributes<HTMLFlipBookRef>
  >;
  export default HTMLFlipBook;
}
