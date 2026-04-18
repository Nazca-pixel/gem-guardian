import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useDragControls,
  useMotionValue,
  useTransform,
} from "framer-motion";

type MobileDismissMode = "handle" | "header" | "off";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  /**
   * Controls which area starts the swipe-to-dismiss gesture on mobile.
   * - "handle" (default): only the top drag handle starts the drag.
   * - "header": handle + any element using `useResponsiveModalDragHandle()` starts the drag.
   * - "off": disables swipe-to-dismiss entirely.
   * Inner scrollable content NEVER starts the drag in any mode.
   */
  mobileDismissMode?: MobileDismissMode;
}

interface ModalDragContextValue {
  startDrag: (event: React.PointerEvent) => void;
  enabled: boolean;
}

const ModalDragContext = createContext<ModalDragContextValue | null>(null);

/**
 * Hook for headers/sub-components that want to act as an additional drag
 * area for swipe-to-dismiss. Spread the returned props on the element.
 *
 * Example:
 *   const drag = useResponsiveModalDragHandle();
 *   <div {...drag}>...</div>
 */
export const useResponsiveModalDragHandle = () => {
  const ctx = useContext(ModalDragContext);
  return useMemo(() => {
    if (!ctx || !ctx.enabled) return {};
    return {
      onPointerDown: (event: React.PointerEvent) => {
        // Only react to primary pointer (touch / left mouse / pen)
        if (event.button !== undefined && event.button !== 0) return;
        ctx.startDrag(event);
      },
      style: { touchAction: "none" as const },
    };
  }, [ctx]);
};

export const ResponsiveModal = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-lg",
  mobileDismissMode = "header",
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const overlayOpacity = useTransform(y, [0, 300], [1, 0.4]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Body scroll lock
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

  // Reset motion value whenever the modal closes/opens
  useEffect(() => {
    if (isOpen) y.set(0);
  }, [isOpen, y]);

  const dragEnabled = isMobile && mobileDismissMode !== "off";

  const dragContextValue = useMemo<ModalDragContextValue>(
    () => ({
      enabled: dragEnabled && mobileDismissMode === "header",
      startDrag: (event) => dragControls.start(event),
    }),
    [dragEnabled, mobileDismissMode, dragControls],
  );

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const draggedFarEnough = info.offset.y > 140;
    const draggedFastEnough = info.velocity.y > 600 && info.offset.y > 40;

    if (draggedFarEnough || draggedFastEnough) {
      onClose();
    } else {
      // snap back
      y.set(0);
    }
  };

  return (
    <ModalDragContext.Provider value={dragContextValue}>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={isMobile ? { opacity: overlayOpacity } : undefined}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            />

            {isMobile ? (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 280 }}
                style={{ y }}
                drag={dragEnabled ? "y" : false}
                dragControls={dragControls}
                dragListener={false}
                dragDirectionLock
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.2 }}
                onDragEnd={handleDragEnd}
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-3xl border-t border-border/40 bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle zone — only this (and opt-in headers) start the drag */}
                <div
                  onPointerDown={(e) => {
                    if (!dragEnabled) return;
                    if (e.button !== undefined && e.button !== 0) return;
                    dragControls.start(e);
                  }}
                  style={{ touchAction: dragEnabled ? "none" : "auto" }}
                  className="flex shrink-0 cursor-grab justify-center pb-2 pt-3 active:cursor-grabbing"
                  aria-hidden="true"
                >
                  <div className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
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
    </ModalDragContext.Provider>
  );
};
