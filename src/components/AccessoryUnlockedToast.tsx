import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AccessoryUnlockedToastProps {
  isOpen: boolean;
  accessory: { name: string; emoji: string } | null;
  onClose: () => void;
}

export const AccessoryUnlockedToast = ({
  isOpen,
  accessory,
  onClose,
}: AccessoryUnlockedToastProps) => {
  if (!accessory) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          onAnimationComplete={() => {
            setTimeout(onClose, 3000);
          }}
          className="fixed top-20 left-1/2 z-50"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 10px hsl(162 48% 55% / 0.3)",
                "0 0 30px hsl(162 48% 55% / 0.5)",
                "0 0 10px hsl(162 48% 55% / 0.3)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="bg-card rounded-2xl px-6 py-4 shadow-xl border-2 border-primary/30 flex items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"
            >
              <span className="text-3xl">{accessory.emoji}</span>
            </motion.div>
            
            <div>
              <div className="flex items-center gap-1 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Nuovo accessorio!</span>
              </div>
              <p className="font-bold text-foreground">{accessory.name}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
