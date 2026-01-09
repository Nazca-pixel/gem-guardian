import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Flame, Trophy, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreakMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: number;
  badgeName: string;
}

const milestoneConfig: Record<number, { icon: React.ReactNode; color: string; title: string }> = {
  7: {
    icon: <Flame className="w-12 h-12" />,
    color: "from-orange-500 to-red-500",
    title: "Settimana di Fuoco!",
  },
  30: {
    icon: <Trophy className="w-12 h-12" />,
    color: "from-yellow-500 to-amber-500",
    title: "Mese da Campione!",
  },
  100: {
    icon: <Crown className="w-12 h-12" />,
    color: "from-purple-500 to-pink-500",
    title: "Leggenda dello Streak!",
  },
};

export const StreakMilestoneModal = ({ isOpen, onClose, milestone, badgeName }: StreakMilestoneModalProps) => {
  const config = milestoneConfig[milestone] || milestoneConfig[7];

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ff6b35", "#f7c948", "#ff4757", "#ffa502", "#ff6348"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ff6b35", "#f7c948", "#ff4757", "#ffa502", "#ff6348"],
      });
    }, 250);

    // Fire some initial bursts
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff6b35", "#f7c948", "#ff4757", "#ffa502", "#ff6348"],
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      fireConfetti();
    }
  }, [isOpen, fireConfetti]);

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
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-border relative overflow-hidden">
              {/* Animated background glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 blur-3xl`}
              />

              <div className="relative z-10">
                {/* Icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2, damping: 10 }}
                  className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white mb-6 shadow-lg`}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    {config.icon}
                  </motion.div>
                </motion.div>

                {/* Stars decoration */}
                <div className="absolute top-4 left-8">
                  <motion.div
                    animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                </div>
                <div className="absolute top-8 right-6">
                  <motion.div
                    animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                  </motion.div>
                </div>
                <div className="absolute top-16 right-12">
                  <motion.div
                    animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  >
                    <Star className="w-3 h-3 text-red-400 fill-red-400" />
                  </motion.div>
                </div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-2xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent mb-2`}
                >
                  {config.title}
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-4"
                >
                  Hai raggiunto uno streak di
                </motion.p>

                {/* Streak count */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.5, damping: 10 }}
                  className="flex items-center justify-center gap-2 mb-6"
                >
                  <Flame className="w-8 h-8 text-orange-500" />
                  <span className="text-5xl font-black text-foreground">{milestone}</span>
                  <span className="text-xl font-bold text-muted-foreground">giorni!</span>
                </motion.div>

                {/* Badge earned */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-muted/50 rounded-xl p-3 mb-6"
                >
                  <p className="text-sm text-muted-foreground">Nuovo trofeo sbloccato:</p>
                  <p className="font-bold text-foreground">{badgeName}</p>
                </motion.div>

                {/* Close button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={onClose}
                    className={`w-full h-12 rounded-xl bg-gradient-to-r ${config.color} text-white font-semibold hover:opacity-90 transition-opacity`}
                  >
                    Fantastico! 🎉
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
