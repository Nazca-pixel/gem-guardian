import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Star } from "lucide-react";

interface CompanionAnimalProps {
  level: number;
  mood: "happy" | "sad" | "excited";
  fxp: number;
  maxFxp: number;
  name: string;
  onPet?: () => void;
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

export const CompanionAnimal = ({
  level,
  mood,
  fxp,
  maxFxp,
  name,
  onPet,
}: CompanionAnimalProps) => {
  const [isPetting, setIsPetting] = useState(false);
  const stage = getEvolutionStage(level);
  const progress = (fxp / maxFxp) * 100;

  const handlePet = () => {
    setIsPetting(true);
    onPet?.();
    setTimeout(() => setIsPetting(false), 500);
  };

  const moodStyles = {
    happy: "companion-happy",
    sad: "companion-sad",
    excited: "companion-excited",
  };

  const moodMessages = {
    happy: "È felice dei tuoi progressi! 🌟",
    sad: "Ha bisogno del tuo aiuto... 💭",
    excited: "Sei fantastico! Continua così! ✨",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="relative flex flex-col items-center"
    >
      {/* Floating decorations */}
      <motion.div
        animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-2 -right-4 text-reward"
      >
        <Star className="w-5 h-5 fill-current" />
      </motion.div>
      
      <motion.div
        animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -top-4 left-0 text-accent"
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>

      {/* Main companion container */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePet}
        className={`
          relative cursor-pointer
          w-40 h-40 rounded-full
          bg-gradient-to-br from-card to-muted
          shadow-float
          flex items-center justify-center
          border-4 border-primary/20
          ${moodStyles[mood]}
          ${isPetting ? "animate-wiggle" : "animate-float"}
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-glow" />
        
        {/* Animal emoji */}
        <motion.span
          animate={isPetting ? { scale: [1, 1.2, 1] } : {}}
          className="text-7xl select-none relative z-10"
        >
          {stage.emoji}
        </motion.span>

        {/* Hearts on pet */}
        {isPetting && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            className="absolute top-0"
          >
            <Heart className="w-6 h-6 text-secondary fill-secondary" />
          </motion.div>
        )}
      </motion.div>

      {/* Name and Level */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-center"
      >
        <h3 className="text-xl font-bold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {stage.name} • Livello {level}
        </p>
      </motion.div>

      {/* XP Progress Bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.3 }}
        className="mt-3 w-full max-w-[200px]"
      >
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>FXP</span>
          <span>{fxp}/{maxFxp}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-fxp to-accent rounded-full"
          />
        </div>
      </motion.div>

      {/* Mood message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-3 text-sm text-center text-muted-foreground italic"
      >
        {moodMessages[mood]}
      </motion.p>
    </motion.div>
  );
};
