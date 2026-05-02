import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Star, AlertTriangle } from "lucide-react";
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
  monthlyBalance?: number;
  onPet?: () => void;
  onOpenDetails?: () => void;
}

const POSITIVE_PHRASES = [
  "Ottimo mese! Stai risparmiando bene! 💰",
  "Continua così, i tuoi risparmi crescono! 📈",
  "Il tuo portafoglio è in salute! 🌟",
  "Bravo! Stai gestendo bene le finanze! 🎯",
  "I tuoi sforzi stanno pagando! ✨",
  "Sei sulla strada giusta, campione! 🏆",
];

const NEGATIVE_PHRASES = [
  "Attenzione alle spese questo mese... 😟",
  "Proviamo a risparmiare un po' di più! 💪",
  "Non mollare, il prossimo mese andrà meglio! 🌈",
  "Rivedi le spese non necessarie! 🔍",
  "Piccoli tagli fanno grandi risparmi! ✂️",
  "Ogni centesimo conta, ripartiamo! 🚀",
];

const NEUTRAL_PHRASES = [
  "Registra le tue spese per aiutarmi! 📝",
  "Insieme possiamo raggiungere i tuoi obiettivi! 🎯",
  "Inizia a tracciare le tue finanze! 📊",
];

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
    monthlyBalance = 0,
  onPet,
  onOpenDetails,
}: CompanionAnimalProps) => {
  const [isPetting, setIsPetting] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [speechBubble, setSpeechBubble] = useState("");

  const isPositive = monthlyBalance > 0;
  const isNegative = monthlyBalance < 0;

  // Random speech bubble that changes every 8 seconds
  const phrases = useMemo(() => {
    if (monthlyBalance === 0) return NEUTRAL_PHRASES;
    return isPositive ? POSITIVE_PHRASES : NEGATIVE_PHRASES;
  }, [monthlyBalance, isPositive]);

  useEffect(() => {
    const pick = () => setSpeechBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    pick();
    const interval = setInterval(pick, 8000);
    return () => clearInterval(interval);
  }, [phrases]);
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

  // Distinguishes a real tap from a scroll/drag: requires short duration
  // and minimal pointer movement before opening the details modal.
  const pointerStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const pettingTimeoutRef = useRef<number | null>(null);
  const TAP_MAX_MOVE = 8; // px
  const TAP_MAX_DURATION = 400; // ms

  // Clear any pending petting timeout on unmount to avoid setState on unmounted component
  useEffect(() => {
    return () => {
      if (pettingTimeoutRef.current !== null) {
        window.clearTimeout(pettingTimeoutRef.current);
        pettingTimeoutRef.current = null;
      }
    };
  }, []);

  const resetPointer = () => {
    pointerStartRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || isPetting) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    const dt = performance.now() - start.t;
    if (dx > TAP_MAX_MOVE || dy > TAP_MAX_MOVE || dt > TAP_MAX_DURATION) return;

    setIsPetting(true);
    onPet?.();
    onOpenDetails?.();
    // Reset wiggle after the animation completes
    if (pettingTimeoutRef.current !== null) {
      window.clearTimeout(pettingTimeoutRef.current);
    }
    pettingTimeoutRef.current = window.setTimeout(() => {
      setIsPetting(false);
      pettingTimeoutRef.current = null;
    }, 600);
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
      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={speechBubble}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ duration: 0.4 }}
          className="relative mb-3 max-w-[220px] px-3 py-2 rounded-2xl bg-card border border-border/60 shadow-md z-10"
        >
          <p className="text-xs text-center text-foreground leading-snug">{speechBubble}</p>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-border/60 rotate-45" />
        </motion.div>
      </AnimatePresence>

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
        animate={isPetting ? { scale: [1, 1.12, 0.95, 1.05, 1] } : { scale: 1 }}
        transition={isPetting ? { duration: 0.6, ease: "easeOut" } : { duration: 0.2 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetPointer}
        onPointerLeave={resetPointer}
        className={`
          relative cursor-pointer
          w-40 h-40 sm:w-44 sm:h-44 rounded-full
          bg-gradient-to-br from-primary/20 via-card to-accent/20
          flex items-center justify-center
          border-4
          ${isPositive ? "border-green-400/60" : isNegative ? "border-destructive/40" : "border-primary/30"}
          ${moodStyles[mood]}
          ${isPetting ? "animate-wiggle" : "animate-float"}
        `}
        style={{
          boxShadow: isPositive
            ? "0 0 25px 8px rgba(34,197,94,0.3), 0 0 60px 20px rgba(34,197,94,0.1)"
            : isNegative
            ? "0 0 20px 6px rgba(239,68,68,0.2)"
            : undefined,
          filter: isNegative ? "saturate(0.5)" : undefined,
        }}
      >
        {/* Glow effect ring */}
        <div className={`absolute inset-[-4px] rounded-full opacity-60 blur-md animate-pulse-glow ${
          isPositive
            ? "bg-gradient-to-r from-green-400/50 via-green-300/40 to-green-500/50"
            : isNegative
            ? "bg-gradient-to-r from-destructive/30 via-muted/20 to-destructive/30"
            : "bg-gradient-to-r from-primary/40 via-accent/40 to-secondary/40"
        }`} />
        
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
        
        {/* Animal emoji */}
        <motion.span
          animate={isPetting ? { scale: [1, 1.2, 1] } : {}}
          className="absolute inset-0 flex items-center justify-center w-20 h-20 m-auto overflow-visible text-7xl leading-none select-none z-10 drop-shadow-lg"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))", transform: "translateY(-5%)" }}
        >
          {stage.emoji}
        </motion.span>

        {/* Alert icon for negative balance */}
        {isNegative && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-2 -left-2 z-20 bg-destructive rounded-full p-1.5 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
          </motion.div>
        )}

        {/* Equipped accessory */}
        {equippedAccessory && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 z-20"
          >
            <motion.span
              animate={{ y: [0, -2, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-2xl drop-shadow-lg block"
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
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-2 text-xs text-center text-muted-foreground"
      >
        Tocca il tuo guardian per interagire ✨
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
