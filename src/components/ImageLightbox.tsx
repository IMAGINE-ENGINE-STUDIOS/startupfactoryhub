import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageLightbox = ({ images, initialIndex = 0, open, onOpenChange }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoomed(false);
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoomed(false);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoomed(false);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goNext, goPrev, onOpenChange]);

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none overflow-hidden [&>button]:hidden">
        <div className="relative flex items-center justify-center w-full h-[90vh]">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-50 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Zoom toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-14 z-50 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => setZoomed(!zoomed)}
          >
            {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </Button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 z-50 text-white/80 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
                onClick={goPrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 z-50 text-white/80 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
                onClick={goNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-full h-full p-4 overflow-auto"
            >
              <img
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                className={`transition-all duration-300 rounded-lg ${
                  zoomed
                    ? 'max-w-none max-h-none w-auto h-auto cursor-zoom-out'
                    : 'max-w-full max-h-full object-contain cursor-zoom-in'
                }`}
                onClick={() => setZoomed(!zoomed)}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
              <span className="text-white/70 text-sm mr-2">
                {currentIndex + 1} / {images.length}
              </span>
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentIndex(idx); setZoomed(false); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
