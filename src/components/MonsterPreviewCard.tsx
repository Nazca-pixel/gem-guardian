import { motion } from "framer-motion";
import { Lock, Check, Sparkles } from "lucide-react";
import { Monster, rarityColors, rarityLabels } from "@/lib/monsters";
import { Progress } from "@/components/ui/progress";

interface MonsterPreviewCardProps {
  monster: Monster & {
    isUnlocked: boolean;
    progress: number;
    isSelected: boolean;
  };
  index: number;
  onClick: () => void;
}

export const MonsterPreviewCard = ({ monster, index, onClick }: MonsterPreviewCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-3xl cursor-pointer transition-all duration-300 overflow-hidden
        ${monster.isUnlocked 
          ? monster.isSelected
            ? "bg-gradient-to-br from-primary/20 via-card to-accent/10 border-2 border-primary shadow-lg ring-2 ring-primary/20"
            : "bg-gradient-to-br from-card via-card to-muted/30 border border-border hover:border-primary/50 hover:shadow-lg" 
          : "bg-gradient-to-br from-muted/30 to-muted/50 border border-border/30"
        }
      `}
    >
      {/* Background decoration */}
      {monster.isUnlocked && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity }
            }}
            className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-r ${rarityColors[monster.rarity]} opacity-20 blur-xl`}
          />
        </div>
      )}

      {/* Selected indicator */}
      {monster.isSelected && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}
      
      {/* Rarity indicator */}
      <motion.div 
        animate={{ scale: monster.isUnlocked ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-r ${rarityColors[monster.rarity]} shadow-lg`} 
      />
      
      {/* Monster display */}
      <div className="flex flex-col items-center text-center relative z-10">
        {/* Monster emoji container */}
        <motion.div
          animate={monster.isUnlocked ? { 
            y: [0, -5, 0],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`
            relative w-20 h-20 rounded-2xl flex items-center justify-center mb-3
            ${monster.isUnlocked 
              ? `bg-gradient-to-br ${rarityColors[monster.rarity]} shadow-lg` 
              : "bg-muted/70"
            }
          `}
        >
          {/* Glow effect for unlocked */}
          {monster.isUnlocked && (
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-[-4px] rounded-2xl bg-gradient-to-r ${rarityColors[monster.rarity]} opacity-40 blur-md`}
            />
          )}
          
          {monster.isUnlocked ? (
            <motion.div className="relative">
              {/* Sparkle effects */}
              <motion.div
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-4 h-4 text-white/80" />
              </motion.div>
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl drop-shadow-lg"
              >
                {monster.emoji}
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-7 h-7 text-muted-foreground" />
            </motion.div>
          )}
        </motion.div>
        
        {/* Monster name */}
        <h3 className={`font-bold text-sm ${
          monster.isUnlocked ? "text-foreground" : "text-muted-foreground"
        }`}>
          {monster.isUnlocked ? monster.name : "???"}
        </h3>
        
        {/* Rarity label */}
        <span className={`text-xs mt-1 font-semibold bg-gradient-to-r ${rarityColors[monster.rarity]} bg-clip-text text-transparent`}>
          {rarityLabels[monster.rarity]}
        </span>

        {/* Progress bar for locked monsters */}
        {!monster.isUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full mt-3"
          >
            <div className="relative">
              <Progress value={monster.progress} className="h-2" />
              <motion.div
                animate={{ x: [`${monster.progress}%`, `${monster.progress + 2}%`, `${monster.progress}%`] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-0 h-2 w-1 bg-white/50 rounded-full"
                style={{ left: `${Math.min(monster.progress, 95)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              {Math.round(monster.progress)}% completato
            </p>
          </motion.div>
        )}

        {/* Evolution stages preview for unlocked */}
        {monster.isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-0.5 mt-2"
          >
            {monster.evolutions.slice(0, 4).map((evo, i) => (
              <motion.span
                key={evo.stage}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="text-xs opacity-60 hover:opacity-100 transition-opacity"
              >
                {evo.emoji}
              </motion.span>
            ))}
            {monster.evolutions.length > 4 && (
              <span className="text-xs text-muted-foreground ml-0.5">+{monster.evolutions.length - 4}</span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
