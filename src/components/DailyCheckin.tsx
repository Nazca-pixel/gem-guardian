import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDailyCheckin } from "@/hooks/useDailyCheckin";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, Gift, Flame } from "lucide-react";
import confetti from "canvas-confetti";

export const DailyCheckin = () => {
  const { 
    checkin, 
    isLoading, 
    hasCheckedInToday, 
    getCheckinStreak,
    getTodayReward,
    baseBxpReward,
    maxStreakBonus,
  } = useDailyCheckin();
  const { toast } = useToast();
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedBxp, setEarnedBxp] = useState(0);
  const [newStreak, setNewStreak] = useState(0);

  const alreadyCheckedIn = hasCheckedInToday();
  const currentStreak = getCheckinStreak();
  const todayReward = getTodayReward();

  const triggerCelebration = () => {
    // Confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"],
    });

    // Second burst after a slight delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFD700", "#FFA500"],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FFD700", "#FFA500"],
      });
    }, 150);
  };

  const handleCheckin = async () => {
    try {
      const result = await checkin();
      setEarnedBxp(result.bxpEarned);
      setNewStreak(result.newStreak);
      setShowCelebration(true);
      triggerCelebration();

      const streakMessage = result.newStreak > 1 
        ? ` 🔥 Streak: ${result.newStreak} giorni!`
        : "";

      toast({
        title: "🎉 Check-in completato!",
        description: `Hai guadagnato +${result.bxpEarned} BXP!${streakMessage}`,
      });

      // Hide celebration after animation
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    } catch (error) {
      if ((error as Error).message === "Already checked in today") {
        toast({
          title: "Già fatto!",
          description: "Hai già effettuato il check-in oggi. Torna domani!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile completare il check-in. Riprova.",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate bonus for display
  const currentBonus = Math.min(currentStreak, maxStreakBonus);
  const hasMaxBonus = currentBonus >= maxStreakBonus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-card/80">
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-reward/10 rounded-full blur-xl" />
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-primary/10 rounded-full blur-lg" />

        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  alreadyCheckedIn
                    ? "bg-success/20"
                    : "bg-gradient-to-br from-reward to-reward/70"
                }`}
                whileHover={!alreadyCheckedIn ? { scale: 1.05 } : undefined}
                whileTap={!alreadyCheckedIn ? { scale: 0.95 } : undefined}
              >
                {alreadyCheckedIn ? (
                  <Check className="w-6 h-6 text-success" />
                ) : (
                  <Gift className="w-6 h-6 text-white" />
                )}
              </motion.div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">Check-in Giornaliero</h3>
                  {currentStreak > 0 && (
                    <motion.div 
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-xs font-bold text-orange-500">{currentStreak}</span>
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {alreadyCheckedIn ? (
                    <>Torna domani per continuare la streak!</>
                  ) : (
                    <>
                      Guadagna +{baseBxpReward}
                      {todayReward > baseBxpReward && (
                        <span className="text-success font-semibold"> +{todayReward - baseBxpReward} bonus</span>
                      )}
                      {" "}BXP
                      {!hasMaxBonus && currentStreak > 0 && (
                        <span className="text-muted-foreground/70"> (max bonus a {maxStreakBonus} giorni)</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCheckin}
              disabled={alreadyCheckedIn || isLoading}
              size="sm"
              className={`relative ${
                alreadyCheckedIn
                  ? "bg-muted text-muted-foreground"
                  : "bg-gradient-to-r from-reward to-reward/80 hover:from-reward/90 hover:to-reward/70 text-white shadow-lg"
              }`}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              ) : alreadyCheckedIn ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Fatto!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Check-in
                </>
              )}
            </Button>
          </div>

          {/* Celebration overlay */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
              >
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="text-center"
                >
                  <motion.span
                    className="text-4xl block mb-2"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    🎉
                  </motion.span>
                  <motion.p
                    className="font-bold text-lg text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    +{earnedBxp} BXP!
                  </motion.p>
                  {newStreak > 1 && (
                    <motion.div
                      className="flex items-center justify-center gap-1 mt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-orange-500">
                        {newStreak} giorni di fila!
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};
