import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface EvolutionAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  oldEmoji: string;
  newEmoji: string;
  newStageName: string;
  monsterName: string;
}

// Particle component for the explosion effect
const Particle = ({ delay, angle, distance }: { delay: number; angle: number; distance: number }) => {
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      animate={{ 
        opacity: 0, 
        scale: 0,
        x,
        y,
      }}
      transition={{ 
        duration: 1.5, 
        delay,
        ease: "easeOut"
      }}
      className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-primary via-accent to-secondary"
    />
  );
};

// Star burst component
const StarBurst = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0], rotate: 180 }}
    transition={{ duration: 1.2, delay }}
    className="absolute"
  >
    <Star className="w-8 h-8 text-reward fill-reward" />
  </motion.div>
);

export const EvolutionAnimation = ({
  isOpen,
  onClose,
  oldEmoji,
  newEmoji,
  newStageName,
  monsterName,
}: EvolutionAnimationProps) => {
  const [phase, setPhase] = useState<"glow" | "transform" | "reveal" | "celebrate">("glow");
  
  useEffect(() => {
    if (isOpen) {
      setPhase("glow");
      const timer1 = setTimeout(() => setPhase("transform"), 1000);
      const timer2 = setTimeout(() => setPhase("reveal"), 2000);
      const timer3 = setTimeout(() => setPhase("celebrate"), 2500);
      const timer4 = setTimeout(onClose, 5000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [isOpen, onClose]);

  // Generate particles for explosion
  const particles = Array.from({ length: 24 }, (_, i) => ({
    angle: (i / 24) * Math.PI * 2,
    distance: 80 + Math.random() * 60,
    delay: 0.1 + Math.random() * 0.3,
  }));

  // Generate star bursts
  const stars = Array.from({ length: 8 }, (_, i) => ({
    delay: 0.2 + i * 0.1,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Background glow */}
          <motion.div
            animate={{
              scale: phase === "glow" ? [1, 1.2, 1] : phase === "transform" ? 2 : 1,
              opacity: phase === "transform" ? 1 : 0.5,
            }}
            transition={{ duration: 0.5 }}
            className="absolute w-64 h-64 rounded-full bg-gradient-radial from-primary/50 via-accent/30 to-transparent blur-2xl"
          />

          {/* Main animation container */}
          <div className="relative flex flex-col items-center">
            {/* Particles explosion during transform */}
            {(phase === "transform" || phase === "reveal") && (
              <div className="absolute inset-0 flex items-center justify-center">
                {particles.map((p, i) => (
                  <Particle key={i} {...p} />
                ))}
              </div>
            )}

            {/* Star bursts during celebration */}
            {phase === "celebrate" && (
              <div className="absolute inset-0 flex items-center justify-center">
                {stars.map((s, i) => (
                  <motion.div
                    key={i}
                    style={{ x: s.x, y: s.y }}
                    className="absolute"
                  >
                    <StarBurst delay={s.delay} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Rotating ring during glow */}
            {(phase === "glow" || phase === "transform") && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute w-48 h-48 rounded-full border-4 border-dashed border-primary/50"
              />
            )}

            {/* Pulsing inner ring */}
            {phase === "glow" && (
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute w-36 h-36 rounded-full border-2 border-accent"
              />
            )}

            {/* Old emoji with glow effect */}
            <AnimatePresence mode="wait">
              {(phase === "glow" || phase === "transform") && (
                <motion.div
                  key="old"
                  initial={{ scale: 1, filter: "brightness(1)" }}
                  animate={{ 
                    scale: phase === "transform" ? 0 : [1, 1.1, 1],
                    filter: phase === "transform" ? "brightness(3)" : "brightness(1)",
                    rotate: phase === "transform" ? 360 : 0,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: phase === "transform" ? 0.8 : 1, repeat: phase === "glow" ? Infinity : 0 }}
                  className="relative z-10"
                >
                  <span className="text-8xl drop-shadow-[0_0_30px_rgba(var(--primary),0.8)]">
                    {oldEmoji}
                  </span>
                </motion.div>
              )}

              {(phase === "reveal" || phase === "celebrate") && (
                <motion.div
                  key="new"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative z-10"
                >
                  <motion.span
                    animate={phase === "celebrate" ? { 
                      scale: [1, 1.1, 1],
                      filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"],
                    } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-9xl drop-shadow-[0_0_40px_rgba(var(--primary),0.9)]"
                  >
                    {newEmoji}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lightning bolts during transform */}
            {phase === "transform" && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: [0, 1, 0], y: 0 }}
                  transition={{ duration: 0.3, repeat: 3, repeatDelay: 0.1 }}
                  className="absolute -top-10 text-reward"
                >
                  <Zap className="w-10 h-10 fill-current" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: [0, 1, 0], y: 0 }}
                  transition={{ duration: 0.3, repeat: 3, repeatDelay: 0.1, delay: 0.15 }}
                  className="absolute -bottom-10 text-reward rotate-180"
                >
                  <Zap className="w-10 h-10 fill-current" />
                </motion.div>
              </>
            )}

            {/* Evolution text */}
            <AnimatePresence>
              {phase === "celebrate" && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2 justify-center mb-2"
                  >
                    <Sparkles className="w-5 h-5 text-reward" />
                    <span className="text-lg font-bold text-reward uppercase tracking-wider">
                      Evoluzione!
                    </span>
                    <Sparkles className="w-5 h-5 text-reward" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-1">{monsterName}</h2>
                  <p className="text-lg text-primary">
                    si è evoluto in <span className="font-bold text-accent">{newStageName}</span>!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap to close hint */}
            {phase === "celebrate" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-20 text-sm text-white/60"
              >
                Tocca per continuare
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
