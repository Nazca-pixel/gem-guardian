import { useCallback } from "react";
import { useWeeklyChallenges, useUpdateChallengeProgress } from "./useWeeklyChallenges";
import { useCompanion } from "./useUserData";
import { useToast } from "./use-toast";

export type ChallengeActionType = 
  | "transaction" 
  | "transaction_necessary" 
  | "savings" 
  | "streak_update";

interface ChallengeUpdate {
  challengeId: string;
  challengeName: string;
  newProgress: number;
  target: number;
  justCompleted: boolean;
  fxpReward: number;
  bxpReward: number;
}

export const useChallengeProgress = () => {
  const { data: challenges } = useWeeklyChallenges();
  const { data: companion } = useCompanion();
  const updateProgress = useUpdateChallengeProgress();
  const { toast } = useToast();

  const updateChallengesForAction = useCallback(async (
    actionType: ChallengeActionType,
    actionData?: {
      isNecessary?: boolean;
      savingsAmount?: number;
      currentStreak?: number;
    }
  ): Promise<ChallengeUpdate[]> => {
    if (!challenges || challenges.length === 0) return [];

    const updates: ChallengeUpdate[] = [];

    for (const challenge of challenges) {
      if (challenge.is_completed) continue;

      let shouldUpdate = false;
      let progressIncrement = 0;
      let newProgress = challenge.progress;

      switch (challenge.challenge.type) {
        case "no_unnecessary":
          // Track days without unnecessary expenses
          // This gets incremented when user logs a transaction that IS necessary
          // or when they have no transactions for the day (handled separately)
          if (actionType === "transaction_necessary" && actionData?.isNecessary) {
            // Just tracking - actual daily check should be done differently
            // For now, we'll count necessary transactions as positive behavior
            progressIncrement = 0; // Don't increment for individual transactions
          } else if (actionType === "transaction" && actionData?.isNecessary === false) {
            // User made an unnecessary expense - reset progress
            newProgress = 0;
            shouldUpdate = true;
          }
          break;

        case "savings_target":
          // Track total savings this week
          if (actionType === "savings" && actionData?.savingsAmount) {
            progressIncrement = actionData.savingsAmount;
            shouldUpdate = true;
          }
          break;

        case "streak":
          // Track current streak
          if (actionType === "streak_update" && actionData?.currentStreak !== undefined) {
            newProgress = actionData.currentStreak;
            shouldUpdate = true;
          }
          break;

        case "budget":
          // Budget tracking would need weekly budget data
          // For now, we'll skip this as it requires more complex calculation
          break;
      }

      if (shouldUpdate || progressIncrement > 0) {
        if (progressIncrement > 0) {
          newProgress = challenge.progress + progressIncrement;
        }

        try {
          const result = await updateProgress.mutateAsync({
            challengeId: challenge.challenge_id,
            progress: newProgress,
          });

          const update: ChallengeUpdate = {
            challengeId: challenge.challenge_id,
            challengeName: challenge.challenge.name,
            newProgress: Math.min(newProgress, challenge.target),
            target: challenge.target,
            justCompleted: result.justCompleted || false,
            fxpReward: challenge.fxp_reward,
            bxpReward: challenge.bxp_reward,
          };

          updates.push(update);

          if (result.justCompleted) {
            toast({
              title: `🎉 Sfida Completata!`,
              description: `${challenge.challenge.emoji} ${challenge.challenge.name} - +${challenge.fxp_reward} FXP, +${challenge.bxp_reward} BXP`,
            });
          }
        } catch (error) {
          console.error("Error updating challenge progress:", error);
        }
      }
    }

    return updates;
  }, [challenges, updateProgress, toast]);

  // Helper to update streak challenge specifically
  const updateStreakChallenge = useCallback(async (currentStreak: number) => {
    return updateChallengesForAction("streak_update", { currentStreak });
  }, [updateChallengesForAction]);

  // Helper to update savings challenge
  const updateSavingsChallenge = useCallback(async (savingsAmount: number) => {
    return updateChallengesForAction("savings", { savingsAmount });
  }, [updateChallengesForAction]);

  // Helper to track transaction for "no unnecessary" challenge
  const trackTransaction = useCallback(async (isNecessary: boolean) => {
    if (!isNecessary) {
      // Made an unnecessary expense - reset the "no unnecessary" challenge
      return updateChallengesForAction("transaction", { isNecessary: false });
    }
    return [];
  }, [updateChallengesForAction]);

  return {
    updateChallengesForAction,
    updateStreakChallenge,
    updateSavingsChallenge,
    trackTransaction,
  };
};
