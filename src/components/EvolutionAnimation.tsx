import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Zap, Crown, Flame } from "lucide-react";
import { useEffect, useState } from "react";

interface EvolutionAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  oldEmoji: string;
  newEmoji: string;
  newStageName: string;
  monsterName: string;
  evolutionStage?: number;
}

// Enhanced particle component with multiple types
const Particle = ({ 
  delay, 
  angle, 
  distance, 
  type = "default" 
}: { 
  delay: number; 
  angle: number; 
  distance: number;
  type?: "default" | "sparkle" | "fire" | "star";
}) => {
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  
  const colors = {
    default: "from-primary via-accent to-secondary",
    sparkle: "from-yellow-400 via-amber-300 to-orange-400",
    fire: "from-red-500 via-orange-400 to-yellow-300",
    star: "from-blue-400 via-purple-400 to-pink-400",
  };
  
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
      animate={{ 
        opacity: 0, 
        scale: 0,
        x,
        y,
        rotate: 360,
      }}
      transition={{ 
        duration: 1.5, 
        delay,
        ease: "easeOut"
      }}
      className={`absolute w-3 h-3 rounded-full bg-gradient-to-r ${colors[type]}`}
    />
  );
};

// Ring explosion component
const ExplosionRing = ({ delay, size }: { delay: number; size: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 1 }}
    animate={{ scale: size, opacity: 0 }}
    transition={{ duration: 1.2, delay, ease: "easeOut" }}
    className="absolute rounded-full border-4 border-primary"
    style={{ width: 60, height: 60 }}
  />
);

// Enhanced star burst component
const StarBurst = ({ delay, size = 8 }: { delay: number; size?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{ 
      opacity: [0, 1, 1, 0], 
      scale: [0.5, 1.5, 1.2, 0], 
      rotate: [0, 180, 360, 540] 
    }}
    transition={{ duration: 1.5, delay, times: [0, 0.3, 0.6, 1] }}
    className="absolute"
  >
    <Star className={`w-${size} h-${size} text-reward fill-reward`} />
  </motion.div>
);

// Flame effect for higher evolutions
const FlameEffect = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      y: [20, -30, -60, -100],
      scale: [0.5, 1, 0.8, 0.3],
    }}
    transition={{ duration: 1.5, delay, ease: "easeOut" }}
    className="absolute"
  >
    <Flame className="w-8 h-8 text-orange-400 fill-orange-400" />
  </motion.div>
);

// Confetti piece
const Confetti = ({ delay, index }: { delay: number; index: number }) => {
  const angle = (index / 20) * Math.PI * 2;
  const distance = 100 + Math.random() * 80;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  
  const colors = [
    "bg-red-400", "bg-blue-400", "bg-green-400", 
    "bg-yellow-400", "bg-purple-400", "bg-pink-400"
  ];
  
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      animate={{ 
        x,
        y: y + 50,
        opacity: 0,
        rotate: Math.random() * 720 - 360,
      }}
      transition={{ 
        duration: 2,
        delay: delay + Math.random() * 0.3,
        ease: "easeOut"
      }}
      className={`absolute w-2 h-3 ${colors[index % colors.length]} rounded-sm`}
    />
  );
};

export const EvolutionAnimation = ({
  isOpen,
  onClose,
  oldEmoji,
  newEmoji,
  newStageName,
  monsterName,
  evolutionStage = 1,
}: EvolutionAnimationProps) => {
  const [phase, setPhase] = useState<"glow" | "charge" | "transform" | "reveal" | "celebrate">("glow");
  
  useEffect(() => {
    if (isOpen) {
      setPhase("glow");
      const timer1 = setTimeout(() => setPhase("charge"), 800);
      const timer2 = setTimeout(() => setPhase("transform"), 1600);
      const timer3 = setTimeout(() => setPhase("reveal"), 2400);
      const timer4 = setTimeout(() => setPhase("celebrate"), 3000);
      const timer5 = setTimeout(onClose, 6000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [isOpen, onClose]);

  // Generate more particles for higher evolution stages
  const particleCount = 24 + (evolutionStage * 8);
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    angle: (i / particleCount) * Math.PI * 2,
    distance: 80 + Math.random() * 80,
    delay: 0.1 + Math.random() * 0.4,
    type: i % 4 === 0 ? "fire" : i % 3 === 0 ? "sparkle" : i % 2 === 0 ? "star" : "default",
  }));

  // Generate star bursts
  const starCount = 8 + evolutionStage * 2;
  const stars = Array.from({ length: starCount }, (_, i) => ({
    delay: 0.2 + i * 0.08,
    x: (Math.random() - 0.5) * 280,
    y: (Math.random() - 0.5) * 280,
  }));

  // Generate confetti
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    delay: 0.3,
    index: i,
  }));

  // Generate explosion rings
  const rings = [
    { delay: 0, size: 2 },
    { delay: 0.1, size: 3 },
    { delay: 0.2, size: 4 },
  ];

  // Generate flame effects for higher stages
  const flames = evolutionStage >= 4 ? Array.from({ length: 8 }, (_, i) => ({
    delay: 0.1 + i * 0.1,
    x: (Math.random() - 0.5) * 100,
  })) : [];

  // Get celebration message based on evolution stage
  const getCelebrationMessage = () => {
    if (evolutionStage >= 7) return "EVOLUZIONE LEGGENDARIA!";
    if (evolutionStage >= 5) return "EVOLUZIONE EPICA!";
    if (evolutionStage >= 3) return "GRANDE EVOLUZIONE!";
    return "EVOLUZIONE!";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Background cosmic effect */}
          <motion.div
            animate={{
              scale: phase === "charge" ? [1, 1.5] : phase === "transform" ? 2.5 : 1,
              opacity: phase === "transform" ? 1 : 0.5,
              rotate: phase === "charge" || phase === "transform" ? 180 : 0,
            }}
            transition={{ duration: 0.8 }}
            className="absolute w-96 h-96 rounded-full bg-gradient-conic from-primary via-accent via-secondary via-primary to-primary opacity-30 blur-3xl"
          />

          {/* Secondary glow */}
          <motion.div
            animate={{
              scale: phase === "glow" ? [1, 1.3, 1] : phase === "transform" ? 3 : 1.5,
            }}
            transition={{ duration: 1, repeat: phase === "glow" ? Infinity : 0 }}
            className="absolute w-64 h-64 rounded-full bg-gradient-radial from-primary/60 via-accent/40 to-transparent blur-2xl"
          />

          {/* Main animation container */}
          <div className="relative flex flex-col items-center">
            {/* Explosion rings during transform */}
            {phase === "transform" && (
              <div className="absolute inset-0 flex items-center justify-center">
                {rings.map((ring, i) => (
                  <ExplosionRing key={i} {...ring} />
                ))}
              </div>
            )}

            {/* Particles explosion during transform */}
            {(phase === "transform" || phase === "reveal") && (
              <div className="absolute inset-0 flex items-center justify-center">
                {particles.map((p, i) => (
                  <Particle key={i} {...p} type={p.type as any} />
                ))}
              </div>
            )}

            {/* Flame effects for high-level evolutions */}
            {phase === "reveal" && flames.map((f, i) => (
              <motion.div
                key={`flame-${i}`}
                style={{ x: f.x }}
                className="absolute"
              >
                <FlameEffect delay={f.delay} />
              </motion.div>
            ))}

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

            {/* Confetti during celebration */}
            {phase === "celebrate" && (
              <div className="absolute inset-0 flex items-center justify-center">
                {confettiPieces.map((c, i) => (
                  <Confetti key={i} {...c} />
                ))}
              </div>
            )}

            {/* Rotating energy ring during charge */}
            {(phase === "glow" || phase === "charge") && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute w-56 h-56 rounded-full border-4 border-dashed border-primary/60"
              />
            )}

            {/* Inner pulsing ring */}
            {(phase === "glow" || phase === "charge") && (
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1], 
                  opacity: [0.5, 1, 0.5],
                  borderWidth: phase === "charge" ? [2, 6, 2] : 2,
                }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="absolute w-44 h-44 rounded-full border-2 border-accent"
              />
            )}

            {/* Energy charging effect */}
            {phase === "charge" && (
              <motion.div
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-primary/50 via-accent/50 to-secondary/50 blur-md"
              />
            )}

            {/* Old emoji with glow effect */}
            <AnimatePresence mode="wait">
              {(phase === "glow" || phase === "charge" || phase === "transform") && (
                <motion.div
                  key="old"
                  initial={{ scale: 1, filter: "brightness(1)" }}
                  animate={{ 
                    scale: phase === "transform" ? 0 : phase === "charge" ? [1, 1.15, 1] : [1, 1.08, 1],
                    filter: phase === "transform" ? "brightness(5)" : "brightness(1)",
                    rotate: phase === "transform" ? 720 : 0,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    duration: phase === "transform" ? 0.8 : 1, 
                    repeat: phase === "glow" || phase === "charge" ? Infinity : 0,
                  }}
                  className="relative z-10"
                >
                  <span 
                    className="text-8xl drop-shadow-[0_0_40px_rgba(var(--primary),0.9)]"
                    style={{ 
                      textShadow: phase === "charge" 
                        ? "0 0 60px hsl(var(--primary)), 0 0 100px hsl(var(--accent))" 
                        : "0 0 30px hsl(var(--primary))"
                    }}
                  >
                    {oldEmoji}
                  </span>
                </motion.div>
              )}

              {(phase === "reveal" || phase === "celebrate") && (
                <motion.div
                  key="new"
                  initial={{ scale: 0, rotate: -360 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 150, damping: 12 }}
                  className="relative z-10"
                >
                  <motion.span
                    animate={phase === "celebrate" ? { 
                      scale: [1, 1.15, 1],
                      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                    } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-9xl"
                    style={{ 
                      textShadow: "0 0 50px hsl(var(--primary)), 0 0 80px hsl(var(--accent)), 0 0 100px hsl(var(--secondary))",
                      filter: "drop-shadow(0 0 20px hsl(var(--primary)))"
                    }}
                  >
                    {newEmoji}
                  </motion.span>
                  
                  {/* Crown for high-level evolutions */}
                  {evolutionStage >= 6 && phase === "celebrate" && (
                    <motion.div
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2"
                    >
                      <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lightning bolts during transform */}
            {phase === "transform" && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -60, x: -30 }}
                  animate={{ opacity: [0, 1, 0], y: 0 }}
                  transition={{ duration: 0.2, repeat: 4, repeatDelay: 0.1 }}
                  className="absolute -top-16 text-reward"
                >
                  <Zap className="w-12 h-12 fill-current" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 60, x: 30 }}
                  animate={{ opacity: [0, 1, 0], y: 0 }}
                  transition={{ duration: 0.2, repeat: 4, repeatDelay: 0.1, delay: 0.1 }}
                  className="absolute -bottom-16 text-reward rotate-180"
                >
                  <Zap className="w-12 h-12 fill-current" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: [0, 1, 0], x: 0 }}
                  transition={{ duration: 0.2, repeat: 4, repeatDelay: 0.1, delay: 0.15 }}
                  className="absolute -left-16 text-reward -rotate-90"
                >
                  <Zap className="w-10 h-10 fill-current" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: [0, 1, 0], x: 0 }}
                  transition={{ duration: 0.2, repeat: 4, repeatDelay: 0.1, delay: 0.2 }}
                  className="absolute -right-16 text-reward rotate-90"
                >
                  <Zap className="w-10 h-10 fill-current" />
                </motion.div>
              </>
            )}

            {/* Evolution text */}
            <AnimatePresence>
              {phase === "celebrate" && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-10 text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex items-center gap-3 justify-center mb-3"
                  >
                    <Sparkles className="w-7 h-7 text-reward" />
                    <span 
                      className="text-xl font-black text-reward uppercase tracking-widest"
                      style={{ textShadow: "0 0 20px hsl(var(--reward))" }}
                    >
                      {getCelebrationMessage()}
                    </span>
                    <Sparkles className="w-7 h-7 text-reward" />
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl font-bold text-white mb-2"
                    style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}
                  >
                    {monsterName}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-xl text-primary"
                  >
                    si è evoluto in{" "}
                    <span 
                      className="font-bold text-accent"
                      style={{ textShadow: "0 0 10px hsl(var(--accent))" }}
                    >
                      {newStageName}
                    </span>
                    !
                  </motion.p>
                  
                  {/* Stage indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30"
                  >
                    <Star className="w-4 h-4 text-reward fill-reward" />
                    <span className="text-sm font-medium text-white">
                      Stadio {evolutionStage} / 8
                    </span>
                    <Star className="w-4 h-4 text-reward fill-reward" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap to close hint */}
            {phase === "celebrate" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.5 }}
                className="absolute -bottom-24 text-sm text-white/60"
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
