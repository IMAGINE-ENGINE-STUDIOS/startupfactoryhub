import { Children, CSSProperties, forwardRef, ReactNode, useEffect, useImperativeHandle, useMemo, useState } from 'react';

interface FlipEvent {
  data: number | { pages: number };
}

interface PageFlipHandle {
  flipPrev: () => void;
  flipNext: () => void;
}

export interface SimpleFlipBookHandle {
  pageFlip: () => PageFlipHandle;
}

interface SimpleFlipBookProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  size?: string;
  showCover?: boolean;
  mobileScrollSupport?: boolean;
  drawShadow?: boolean;
  flippingTime?: number;
  maxShadowOpacity?: number;
  usePortrait?: boolean;
  startPage?: number;
  startZIndex?: number;
  autoSize?: boolean;
  clickEventForward?: boolean;
  useMouseEvents?: boolean;
  swipeDistance?: number;
  showPageCorners?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  onFlip?: (event: FlipEvent) => void;
  onInit?: (event: FlipEvent) => void;
  disableFlipByClick?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const SimpleFlipBook = forwardRef<SimpleFlipBookHandle, SimpleFlipBookProps>(function SimpleFlipBook(
  {
    children,
    className,
    style,
    width,
    height,
    startPage = 0,
    minWidth = 300,
    maxWidth = 700,
    minHeight = 420,
    maxHeight = 990,
    onFlip,
    onInit,
    disableFlipByClick = false,
  },
  ref
) {
  const pages = useMemo(() => Children.toArray(children), [children]);
  const [page, setPage] = useState(() => clamp(startPage, 0, Math.max(pages.length - 1, 0)));

  const flipPrev = () => setPage((current) => Math.max(current - 1, 0));
  const flipNext = () => setPage((current) => Math.min(current + 1, pages.length - 1));

  useEffect(() => {
    setPage((current) => clamp(current, 0, Math.max(pages.length - 1, 0)));
    onInit?.({ data: { pages: pages.length } });
  }, [pages.length, onInit]);

  useEffect(() => {
    onFlip?.({ data: page });
  }, [page, onFlip]);

  useImperativeHandle(ref, () => ({
    pageFlip: () => ({
      flipPrev,
      flipNext,
    }),
  }));

  return (
    <div
      className={className}
      style={{
        width: width ? `min(100%, ${width}px)` : 'min(100%, 700px)',
        minWidth,
        maxWidth,
        minHeight: height ?? minHeight,
        maxHeight: height ?? maxHeight,
        ...style,
      }}
    >
      <div className="relative w-full">
        {!disableFlipByClick && page > 0 && (
          <button
            type="button"
            aria-label="Previous page"
            className="absolute inset-y-0 left-0 z-10 w-1/4 cursor-w-resize bg-transparent"
            onClick={flipPrev}
          />
        )}

        <div className="w-full">{pages[page] ?? null}</div>

        {!disableFlipByClick && page < pages.length - 1 && (
          <button
            type="button"
            aria-label="Next page"
            className="absolute inset-y-0 right-0 z-10 w-1/4 cursor-e-resize bg-transparent"
            onClick={flipNext}
          />
        )}
      </div>
    </div>
  );
});

export default SimpleFlipBook;