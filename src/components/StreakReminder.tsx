import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { getStreakStatus } from "@/hooks/useStreak";

interface StreakReminderProps {
  currentStreak: number;
  lastActivityDate: string | null;
}

export const StreakReminder = ({ currentStreak, lastActivityDate }: StreakReminderProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const status = getStreakStatus(lastActivityDate);

  // Reset dismissed state when status changes
  useEffect(() => {
    if (status === "active") {
      setIsDismissed(false);
    }
  }, [status]);

  // Only show if streak is at risk (didn't log today but logged yesterday)
  if (status !== "at-risk" || isDismissed || currentStreak === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-2xl p-4 relative overflow-hidden"
      >
        {/* Animated fire particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-0 left-1/4 w-2 h-4 bg-orange-400/40 rounded-full blur-sm"
          />
          <motion.div
            animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
            className="absolute bottom-0 right-1/3 w-3 h-5 bg-red-400/30 rounded-full blur-sm"
          />
        </div>

        <div className="flex items-start gap-3 relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center flex-shrink-0"
          >
            <Flame className="w-5 h-5 text-orange-400" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <h4 className="font-bold text-foreground text-sm">Streak a rischio!</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Il tuo streak di <span className="text-orange-400 font-bold">{currentStreak} giorni</span> sta per scadere! 
              Registra una transazione oggi per mantenerlo attivo.
            </p>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
