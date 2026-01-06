import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, Crown, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LevelUpResult } from "@/hooks/useLevelUp";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelUpData: LevelUpResult | null;
  companionName: string;
  newEvolutionEmoji?: string;
}

const evolutionStages = [
  { name: "Uovo", emoji: "🥚", minLevel: 1 },
  { name: "Cucciolo", emoji: "🐣", minLevel: 2 },
  { name: "Piccolo", emoji: "🐥", minLevel: 4 },
  { name: "Giovane", emoji: "🐤", minLevel: 6 },
  { name: "Adulto", emoji: "🐔", minLevel: 8 },
  { name: "Epico", emoji: "🦅", minLevel: 10 },
];

const getEvolutionStage = (level: number) => {
  for (let i = evolutionStages.length - 1; i >= 0; i--) {
    if (level >= evolutionStages[i].minLevel) {
      return evolutionStages[i];
    }
  }
  return evolutionStages[0];
};

export const LevelUpModal = ({
  isOpen,
  onClose,
  levelUpData,
  companionName,
}: LevelUpModalProps) => {
  if (!levelUpData) return null;

  const stage = getEvolutionStage(levelUpData.newLevel);
  const previousStage = getEvolutionStage(levelUpData.newLevel - levelUpData.levelsGained);
  const evolved = stage.emoji !== previousStage.emoji;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with particle effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-50 overflow-hidden"
          >
            {/* Animated particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: "50%",
                  y: "100%",
                }}
                animate={{
                  opacity: [0, 1, 0],
                  x: `${Math.random() * 100}%`,
                  y: `${-20 - Math.random() * 80}%`,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: `hsl(${45 + Math.random() * 30} 95% 65%)`,
                }}
              />
            ))}
          </motion.div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: "spring", damping: 15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-reward/50 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-2 gradient-reward" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-10 -right-10 w-32 h-32 bg-reward/10 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full"
              />

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Stars animation */}
                <div className="flex justify-center gap-2 mb-4">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                    >
                      <Star className="w-8 h-8 text-reward fill-reward" />
                    </motion.div>
                  ))}
                </div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-foreground mb-2"
                >
                  Level Up! 🎉
                </motion.h2>

                {/* Animal evolution */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="my-6"
                >
                  <div className="relative inline-block">
                    {/* Glow effect */}
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 20px hsl(45 95% 65% / 0.3)",
                          "0 0 60px hsl(45 95% 65% / 0.6)",
                          "0 0 20px hsl(45 95% 65% / 0.3)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-32 h-32 rounded-full bg-gradient-to-br from-card to-muted flex items-center justify-center mx-auto border-4 border-reward/30"
                    >
                      <motion.span
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="text-7xl"
                      >
                        {stage.emoji}
                      </motion.span>
                    </motion.div>

                    {/* Sparkles around */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="w-6 h-6 text-reward" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Name and level */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-lg font-bold text-foreground">{companionName}</p>
                  <p className="text-muted-foreground">
                    {stage.name} • Livello {levelUpData.newLevel}
                  </p>
                </motion.div>

                {/* Evolution message */}
                {evolved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-4 p-3 rounded-xl bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30"
                  >
                    <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                      <Crown className="w-4 h-4 text-reward" />
                      {companionName} si è evoluto in {stage.name}!
                    </p>
                  </motion.div>
                )}

                {/* Rewards section */}
                {(levelUpData.badgeEarned || levelUpData.accessoriesUnlocked.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-4 p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-center gap-2">
                      <Gift className="w-4 h-4" />
                      Ricompense sbloccate!
                    </p>

                    <div className="flex flex-wrap justify-center gap-3">
                      {levelUpData.badgeEarned && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.9, type: "spring" }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-card"
                        >
                          <span className="text-2xl">{levelUpData.badgeEarned.emoji}</span>
                          <span className="text-xs font-medium text-foreground">
                            {levelUpData.badgeEarned.name}
                          </span>
                        </motion.div>
                      )}

                      {levelUpData.accessoriesUnlocked.map((acc, i) => (
                        <motion.div
                          key={acc.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1 + i * 0.1, type: "spring" }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-card"
                        >
                          <span className="text-2xl">{acc.emoji}</span>
                          <span className="text-xs font-medium text-foreground">
                            {acc.name}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Close button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-6"
                >
                  <Button
                    onClick={onClose}
                    className="w-full h-12 rounded-xl gradient-reward text-reward-foreground font-bold text-lg"
                  >
                    Fantastico! ✨
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
