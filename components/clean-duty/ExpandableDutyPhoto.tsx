'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

function fileExtensionFromDataUrl(url: string): string {
  const m = /^data:image\/([\w+.-]+);/i.exec(url);
  if (!m) return 'png';
  const t = m[1].toLowerCase();
  if (t === 'jpeg') return 'jpg';
  return t.replace(/\+/g, '') || 'png';
}

export interface ExpandableDutyPhotoProps {
  src: string;
  alt: string;
  /** Tailwind classes for the inline (thumbnail) image */
  imgClassName?: string;
  /** Base name for the downloaded file (extension inferred from data URL) */
  downloadBaseName?: string;
}

export default function ExpandableDutyPhoto({
  src,
  alt,
  imgClassName,
  downloadBaseName = 'webster-duty-photo',
}: ExpandableDutyPhotoProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });

  const ext = useMemo(() => fileExtensionFromDataUrl(src), [src]);
  const downloadFilename = `${downloadBaseName}.${ext}`;

  const close = useCallback(() => {
    setOpen(false);
    setScale(1);
  }, []);

  useEffect(() => {
    if (!open) return;
    setScale(1);
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const measure = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP));
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setScale((s) => Math.max(ZOOM_MIN, s - ZOOM_STEP));
      }
      if (e.key === '0') {
        e.preventDefault();
        setScale(1);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('resize', measure);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const baseMaxW = Math.min(viewport.w * 0.92, 1400);
  const baseMaxH = Math.min(viewport.h * 0.88, 920);

  const zoomIn = () => setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP));
  const zoomOut = () => setScale((s) => Math.max(ZOOM_MIN, s - ZOOM_STEP));
  const zoomReset = () => setScale(1);

  const onWheelLightbox = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale((s) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s + delta)));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'max-w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'cursor-zoom-in transition-opacity hover:opacity-95'
        )}
        aria-label={`Enlarge image: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={cn('pointer-events-none select-none', imgClassName)}
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-black/88 px-3 py-4 sm:px-6 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged photo"
          onClick={close}
        >
          <p className="sr-only">
            Use zoom buttons, plus and minus keys, or Ctrl and scroll to zoom. Press 0 to reset zoom.
          </p>

          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheelLightbox}
          >
            <div className="flex min-h-full min-w-full items-center justify-center p-4">
              <img
                src={src}
                alt={alt}
                draggable={false}
                style={{
                  maxWidth: `${baseMaxW * scale}px`,
                  maxHeight: `${baseMaxH * scale}px`,
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  transition: 'max-width 0.15s ease-out, max-height 0.15s ease-out',
                }}
                className="rounded-md shadow-2xl select-none"
              />
            </div>
          </div>

          <div
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
          <p className="mb-2 text-center text-xs text-white/55">
            + / − keys · 0 reset · Ctrl+scroll (⌘+scroll on Mac)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 border-white/40 bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
              onClick={() => zoomOut()}
              disabled={scale <= ZOOM_MIN}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
              Out
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-[4.5rem] border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={() => zoomReset()}
              aria-label="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 border-white/40 bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
              onClick={() => zoomIn()}
              disabled={scale >= ZOOM_MAX}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
              In
            </Button>
            <Button variant="secondary" className="gap-2" asChild>
              <a href={src} download={downloadFilename}>
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={() => close()}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
