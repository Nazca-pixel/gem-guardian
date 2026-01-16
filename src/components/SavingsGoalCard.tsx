import { useState } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, Calendar, Plus } from "lucide-react";
import { AddFundsModal } from "./AddFundsModal";

interface SavingsGoalCardProps {
  id: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  emoji?: string;
}

export const SavingsGoalCard = ({
  id,
  goalName,
  currentAmount,
  targetAmount,
  deadline,
  emoji = "🎯",
}: SavingsGoalCardProps) => {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const progress = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = targetAmount - currentAmount;
  const isCompleted = currentAmount >= targetAmount;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-card rounded-2xl p-5 shadow-card border border-border overflow-hidden relative"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 gradient-reward opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">
              ✓ Completato!
            </span>
          </div>
        )}
        
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
          {!isCompleted && (
            <div className="flex items-center gap-1 text-primary text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{progress.toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative mb-3">
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full relative ${isCompleted ? "bg-primary" : "gradient-hero"}`}
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
          
          {!isCompleted ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddFunds(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-hero text-primary-foreground font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Aggiungi
            </motion.button>
          ) : (
            <div className="text-right">
              <p className="text-sm font-medium text-primary">🎉</p>
              <p className="text-xs text-muted-foreground">Obiettivo raggiunto!</p>
            </div>
          )}
        </div>
      </motion.div>

      <AddFundsModal
        isOpen={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        goal={{
          id,
          name: goalName,
          emoji,
          current_amount: currentAmount,
          target_amount: targetAmount,
        }}
      />
    </>
  );
};