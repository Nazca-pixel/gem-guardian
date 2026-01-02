import { motion } from "framer-motion";
import { Coins, Target } from "lucide-react";

interface XPDisplayProps {
  fxp: number;
  bxp: number;
}

export const XPDisplay = ({ fxp, bxp }: XPDisplayProps) => {
  const blendedScore = Math.round(fxp * 0.7 + bxp * 0.3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3"
    >
      {/* Financial XP */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-fxp/20"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-fxp/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-fxp" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">FXP</span>
        </div>
        <p className="text-2xl font-bold text-fxp">{fxp.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Risparmio</p>
      </motion.div>

      {/* Behavioral XP */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-bxp/20"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-bxp/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-bxp" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">BXP</span>
        </div>
        <p className="text-2xl font-bold text-bxp">{bxp.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Abitudini</p>
      </motion.div>

      {/* Blended Score */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-fxp/10 to-bxp/10 rounded-2xl p-4 shadow-card border border-primary/20"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
            <span className="text-sm">🏆</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Score</span>
        </div>
        <p className="text-2xl font-bold text-gradient">{blendedScore.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Classifica</p>
      </motion.div>
    </motion.div>
  );
};
