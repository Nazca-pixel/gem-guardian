import { motion } from "framer-motion";

interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  isEarned: boolean;
  earnedDate?: string;
}

interface BadgesGridProps {
  badges: Badge[];
}

export const BadgesGrid = ({ badges }: BadgesGridProps) => {
  const earnedBadges = badges.filter(b => b.isEarned);
  const lockedBadges = badges.filter(b => !b.isEarned);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <span>🏆</span>
          Trofei
        </h3>
        <span className="text-xs text-bxp font-medium">
          {earnedBadges.length} ottenuti
        </span>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {earnedBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative flex flex-col items-center p-2 rounded-xl bg-gradient-to-br from-reward/20 to-accent/20 border border-reward/30"
            >
              <motion.span 
                className="text-3xl"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {badge.emoji}
              </motion.span>
              <span className="text-[10px] font-medium text-foreground text-center mt-1 leading-tight">
                {badge.name}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Locked Badges Preview */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {lockedBadges.slice(0, 5).map((badge) => (
          <div
            key={badge.id}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center"
          >
            <span className="text-xl opacity-20">{badge.emoji}</span>
          </div>
        ))}
        {lockedBadges.length > 5 && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-medium">
              +{lockedBadges.length - 5}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
