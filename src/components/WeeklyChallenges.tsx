import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Trophy, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useWeeklyChallenges, useAssignWeeklyChallenge, UserChallenge } from "@/hooks/useWeeklyChallenges";
import { WEEKLY_CHALLENGES } from "@/lib/xpSystem";
import { toast } from "sonner";

const ChallengeCard = ({ userChallenge }: { userChallenge: UserChallenge }) => {
  const { challenge, progress, target, is_completed, fxp_reward, bxp_reward } = userChallenge;
  const progressPercent = Math.min((progress / target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-4 border ${
        is_completed 
          ? "bg-gradient-to-br from-reward/20 to-reward/5 border-reward/30" 
          : "bg-card border-border"
      }`}
    >
      {is_completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2"
        >
          <div className="flex items-center gap-1 bg-reward/20 text-reward px-2 py-1 rounded-full text-xs font-semibold">
            <Trophy className="w-3 h-3" />
            Completata!
          </div>
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        <div className={`text-3xl p-2 rounded-xl ${
          is_completed ? "bg-reward/20" : "bg-muted"
        }`}>
          {challenge.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground text-sm truncate">
            {challenge.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {challenge.description}
          </p>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Progresso: {progress}/{target}
              </span>
              <span className="font-semibold text-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            
            <Progress 
              value={progressPercent} 
              className={`h-2 ${is_completed ? "[&>div]:bg-reward" : ""}`}
            />
          </div>
          
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-primary font-semibold">+{fxp_reward}</span>
              <span className="text-muted-foreground">FXP</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-secondary font-semibold">+{bxp_reward}</span>
              <span className="text-muted-foreground">BXP</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AvailableChallengeCard = ({ 
  challenge, 
  onSelect,
  isAssigned 
}: { 
  challenge: typeof WEEKLY_CHALLENGES[0];
  onSelect: () => void;
  isAssigned: boolean;
}) => {
  return (
    <motion.button
      whileHover={{ scale: isAssigned ? 1 : 1.02 }}
      whileTap={{ scale: isAssigned ? 1 : 0.98 }}
      onClick={onSelect}
      disabled={isAssigned}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isAssigned 
          ? "bg-muted/50 border-border opacity-50 cursor-not-allowed" 
          : "bg-card border-border hover:border-primary/50 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{challenge.emoji}</span>
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-foreground text-sm truncate">
            {challenge.name}
          </h5>
          <p className="text-xs text-muted-foreground truncate">
            {challenge.description}
          </p>
        </div>
        {isAssigned ? (
          <span className="text-xs text-muted-foreground">Attiva</span>
        ) : (
          <Plus className="w-5 h-5 text-primary" />
        )}
      </div>
    </motion.button>
  );
};

export const WeeklyChallenges = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAvailable, setShowAvailable] = useState(false);
  const { data: userChallenges, isLoading } = useWeeklyChallenges();
  const assignChallenge = useAssignWeeklyChallenge();

  const assignedIds = userChallenges?.map(uc => uc.challenge_id) || [];
  const completedCount = userChallenges?.filter(uc => uc.is_completed).length || 0;
  const totalActive = userChallenges?.length || 0;

  const handleAssignChallenge = async (challengeId: string) => {
    try {
      await assignChallenge.mutateAsync(challengeId);
      toast.success("Sfida aggiunta!", {
        description: "Buona fortuna con la nuova sfida!",
        icon: "🎯",
      });
      setShowAvailable(false);
    } catch (error: any) {
      if (error.message === "Challenge already assigned for this week") {
        toast.error("Sfida già attiva questa settimana");
      } else {
        toast.error("Errore nell'aggiunta della sfida");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card to-card/80 rounded-2xl border border-border shadow-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            {completedCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-reward rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-3 h-3 text-reward-foreground" />
              </motion.div>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground">Sfide Settimanali</h3>
            <p className="text-xs text-muted-foreground">
              {totalActive > 0 
                ? `${completedCount}/${totalActive} completate` 
                : "Nessuna sfida attiva"}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Active Challenges */}
              {userChallenges && userChallenges.length > 0 ? (
                userChallenges.map((uc) => (
                  <ChallengeCard key={uc.id} userChallenge={uc} />
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-sm text-muted-foreground">
                    Nessuna sfida attiva questa settimana
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aggiungi una sfida per guadagnare XP extra!
                  </p>
                </div>
              )}

              {/* Add Challenge Button */}
              {totalActive < 3 && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAvailable(!showAvailable)}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Sfida ({totalActive}/3)
                  </Button>

                  {/* Available Challenges */}
                  <AnimatePresence>
                    {showAvailable && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 space-y-2 overflow-hidden"
                      >
                        {WEEKLY_CHALLENGES.map((challenge) => (
                          <AvailableChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            isAssigned={assignedIds.includes(challenge.id)}
                            onSelect={() => handleAssignChallenge(challenge.id)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
