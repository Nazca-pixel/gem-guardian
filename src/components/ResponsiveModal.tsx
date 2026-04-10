import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export const ResponsiveModal = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const draggedFarEnough = info.offset.y > 120;
    const draggedFastEnough = info.velocity.y > 700;

    if (draggedFarEnough || draggedFastEnough) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
          />

          {isMobile ? (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.18 }}
              onDragEnd={handleDragEnd}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-3xl border-t border-border/40 bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pb-2 pt-3">
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              </div>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
              >
                {children}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className={`fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl ${maxWidth}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
