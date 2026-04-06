import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional max-width class for desktop dialog (default: max-w-lg) */
  maxWidth?: string;
}

/**
 * On mobile: bottom sheet (drawer from bottom).
 * On desktop: centered dialog with overlay.
 */
export const ResponsiveModal = ({ isOpen, onClose, children, maxWidth = "max-w-lg" }: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {isMobile ? (
            /* Mobile: Bottom Sheet */
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              {children}
            </motion.div>
          ) : (
            /* Desktop: Centered Dialog */
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-xl border border-border/50 max-h-[85vh] flex flex-col w-[95vw] ${maxWidth}`}
            >
              {children}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
