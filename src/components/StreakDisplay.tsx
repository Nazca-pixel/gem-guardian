import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakDisplay = ({ currentStreak, longestStreak }: StreakDisplayProps) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "from-amber-400 to-orange-500";
    if (streak >= 14) return "from-orange-400 to-red-500";
    if (streak >= 7) return "from-red-400 to-rose-500";
    if (streak >= 3) return "from-rose-400 to-pink-500";
    return "from-gray-400 to-gray-500";
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥🔥🔥";
    if (streak >= 14) return "🔥🔥";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "✨";
    return "💤";
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "Leggendario!";
    if (streak >= 14) return "Inarrestabile!";
    if (streak >= 7) return "In forma!";
    if (streak >= 3) return "Ottimo inizio!";
    if (streak >= 1) return "Continua così!";
    return "Inizia oggi!";
  };

  const getBonusMultiplier = (streak: number) => {
    if (streak >= 30) return 2.0;
    if (streak >= 14) return 1.5;
    if (streak >= 7) return 1.3;
    if (streak >= 3) return 1.1;
    return 1.0;
  };

  const bonus = getBonusMultiplier(currentStreak);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-card border border-border"
    >
      <div className="flex items-center justify-between">
        {/* Current Streak */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={currentStreak > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStreakColor(currentStreak)} flex items-center justify-center`}
          >
            <Flame className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
              <span className="text-lg">{getStreakEmoji(currentStreak)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{getStreakMessage(currentStreak)}</p>
          </div>
        </div>

        {/* Bonus & Record */}
        <div className="text-right space-y-1">
          {bonus > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full"
            >
              <span className="text-xs font-bold text-primary">+{Math.round((bonus - 1) * 100)}% XP</span>
            </motion.div>
          )}
          <div className="flex items-center gap-1 justify-end text-muted-foreground">
            <Trophy className="w-3 h-3" />
            <span className="text-xs">Record: {longestStreak}</span>
          </div>
        </div>
      </div>

      {/* Streak milestones */}
      <div className="mt-4 flex gap-1">
        {[3, 7, 14, 30].map((milestone) => (
          <div
            key={milestone}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              currentStreak >= milestone 
                ? "bg-gradient-to-r from-primary to-accent" 
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>3gg</span>
        <span>7gg</span>
        <span>14gg</span>
        <span>30gg</span>
      </div>
    </motion.div>
  );
};

// Helper function to calculate streak bonus
export const getStreakBonus = (streak: number): number => {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.3;
  if (streak >= 3) return 1.1;
  return 1.0;
};