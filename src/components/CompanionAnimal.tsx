import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Star } from "lucide-react";
import { monsters, Monster } from "@/lib/monsters";
import { EvolutionAnimation } from "./EvolutionAnimation";

interface EquippedAccessory {
  emoji: string;
  name: string;
}

interface CompanionAnimalProps {
  level: number;
  mood: "happy" | "sad" | "excited";
  fxp: number;
  maxFxp: number;
  name: string;
  selectedMonsterId?: string;
  equippedAccessory?: EquippedAccessory | null;
  onPet?: () => void;
}

// Get the current evolution stage for a monster based on level
const getEvolutionStage = (monster: Monster, level: number) => {
  const evolutions = monster.evolutions;
  for (let i = evolutions.length - 1; i >= 0; i--) {
    if (level >= evolutions[i].minLevel) {
      return evolutions[i];
    }
  }
  return evolutions[0];
};

export const CompanionAnimal = ({
  level,
  mood,
  fxp,
  maxFxp,
  name,
  selectedMonsterId = "phoenix",
  equippedAccessory,
  onPet,
}: CompanionAnimalProps) => {
  const [isPetting, setIsPetting] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolutionData, setEvolutionData] = useState<{
    oldEmoji: string;
    newEmoji: string;
    newStageName: string;
  } | null>(null);
  
  const prevStageRef = useRef<string | null>(null);
  
  // Find the selected monster or default to phoenix
  const selectedMonster = monsters.find(m => m.id === selectedMonsterId) || monsters[0];
  const stage = getEvolutionStage(selectedMonster, level);
  const progress = (fxp / maxFxp) * 100;

  // Check for evolution when stage changes
  useEffect(() => {
    if (prevStageRef.current && prevStageRef.current !== stage.emoji) {
      // Find the previous stage
      const prevStageIndex = selectedMonster.evolutions.findIndex(e => e.emoji === prevStageRef.current);
      const currentStageIndex = selectedMonster.evolutions.findIndex(e => e.emoji === stage.emoji);
      
      // Only show animation if we evolved forward (not backward)
      if (currentStageIndex > prevStageIndex) {
        setEvolutionData({
          oldEmoji: prevStageRef.current,
          newEmoji: stage.emoji,
          newStageName: stage.name,
        });
        setShowEvolution(true);
      }
    }
    prevStageRef.current = stage.emoji;
  }, [stage.emoji, stage.name, selectedMonster.evolutions]);

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
      className="relative mx-auto flex flex-col items-center justify-center"
    >
      {/* Floating decorations */}
      <motion.div
        animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-2 right-1/4 text-reward"
      >
        <Star className="w-5 h-5 fill-current" />
      </motion.div>
      
      <motion.div
        animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -top-4 left-1/4 text-accent"
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>

      {/* Main companion container */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handlePet}
        className={`
          relative cursor-pointer
          w-40 h-40 sm:w-44 sm:h-44 rounded-full
          bg-gradient-to-br from-primary/20 via-card to-accent/20
          shadow-lg
          flex items-center justify-center
          border-4 border-primary/30
          ${moodStyles[mood]}
          ${isPetting ? "animate-wiggle" : "animate-float"}
        `}
      >
        {/* Glow effect ring */}
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-primary/40 via-accent/40 to-secondary/40 opacity-60 blur-md animate-pulse-glow" />
        
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
        
        {/* Animal emoji */}
        <motion.span
          animate={isPetting ? { scale: [1, 1.2, 1] } : {}}
          className="text-7xl select-none relative z-10 drop-shadow-lg"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}
        >
          {stage.emoji}
        </motion.span>

        {/* Equipped accessory */}
        {equippedAccessory && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-3 -right-3 z-20"
          >
            <motion.span
              animate={{ y: [0, -2, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-3xl drop-shadow-lg"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
            >
              {equippedAccessory.emoji}
            </motion.span>
          </motion.div>
        )}

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
        className="mt-5 text-center"
      >
        <h3 className="text-xl font-bold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold">{stage.name}</span> • Livello {level}
        </p>
      </motion.div>

      {/* XP Progress Bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.3 }}
        className="mt-4 w-full max-w-[220px] mx-auto"
      >
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-medium">FXP</span>
          <span className="font-semibold text-foreground">{fxp}/{maxFxp}</span>
        </div>
        <div className="h-3.5 bg-muted/50 rounded-full overflow-hidden shadow-inner border border-border/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-fxp via-accent to-primary rounded-full relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Mood message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-sm text-center text-muted-foreground italic"
      >
        {moodMessages[mood]}
      </motion.p>

      {/* Evolution Animation */}
      {evolutionData && (
        <EvolutionAnimation
          isOpen={showEvolution}
          onClose={() => {
            setShowEvolution(false);
            setEvolutionData(null);
          }}
          oldEmoji={evolutionData.oldEmoji}
          newEmoji={evolutionData.newEmoji}
          newStageName={evolutionData.newStageName}
          monsterName={name}
        />
      )}
    </motion.div>
  );
};
