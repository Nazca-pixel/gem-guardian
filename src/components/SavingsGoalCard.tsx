import { motion } from "framer-motion";
import { Target, TrendingUp, Calendar } from "lucide-react";

interface SavingsGoalCardProps {
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  emoji?: string;
}

export const SavingsGoalCard = ({
  goalName,
  currentAmount,
  targetAmount,
  deadline,
  emoji = "🎯",
}: SavingsGoalCardProps) => {
  const progress = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = targetAmount - currentAmount;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card rounded-2xl p-5 shadow-card border border-border overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 gradient-reward opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            {emoji}
          </div>
          <div>
            <h4 className="font-bold text-foreground">{goalName}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{deadline}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>{progress.toFixed(0)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mb-3">
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full gradient-hero rounded-full relative"
          >
            {progress >= 10 && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <span className="text-xs">✨</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Amount display */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-2xl font-bold text-foreground">
            €{currentAmount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            di €{targetAmount.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-secondary">
            €{remaining.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">rimanenti</p>
        </div>
      </div>
    </motion.div>
  );
};
