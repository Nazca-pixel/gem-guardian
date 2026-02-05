import { useCallback } from "react";
import { useUpdateChallengeProgress, UserChallenge } from "./useWeeklyChallenges";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WEEKLY_CHALLENGES } from "@/lib/xpSystem";

export type ChallengeActionType = 
  | "transaction" 
  | "transaction_necessary" 
  | "savings" 
  | "streak_update"
  | "daily_frugal_check";

interface ChallengeUpdate {
  challengeId: string;
  challengeName: string;
  newProgress: number;
  target: number;
  justCompleted: boolean;
  fxpReward: number;
  bxpReward: number;
}

// Get the start of the current week (Monday)
const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

// Get today's date string
const getTodayStr = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const useChallengeProgress = () => {
  const { user } = useAuth();
  const updateProgress = useUpdateChallengeProgress();
  const { toast } = useToast();

  // Fetch challenges directly from DB to ensure we have latest data
  const fetchCurrentChallenges = useCallback(async (): Promise<UserChallenge[]> => {
    if (!user) return [];
    
    const weekStart = getWeekStart();
    
    const { data: userChallenges, error } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    if (error) {
      console.error("Error fetching challenges:", error);
      return [];
    }

    return (userChallenges || []).map(uc => {
      const challengeDef = WEEKLY_CHALLENGES.find(c => c.id === uc.challenge_id);
      return {
        ...uc,
        challenge: challengeDef || WEEKLY_CHALLENGES[0],
      };
    });
  }, [user]);

  // Check if user has made any unnecessary expenses today
  const hasUnnecessaryExpensesToday = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    const today = getTodayStr();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("transaction_date", today)
      .eq("is_income", false)
      .eq("is_necessary", false)
      .limit(1);

    if (error) {
      console.error("Error checking today's transactions:", error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  }, [user]);

  const updateChallengesForAction = useCallback(async (
    actionType: ChallengeActionType,
    actionData?: {
      isNecessary?: boolean;
      savingsAmount?: number;
      currentStreak?: number;
    }
  ): Promise<ChallengeUpdate[]> => {
    // Fetch challenges directly to ensure we have the latest data
    const challenges = await fetchCurrentChallenges();
    
    if (!challenges || challenges.length === 0) {
      console.log("No challenges found for current week");
      return [];
    }

    const updates: ChallengeUpdate[] = [];

    for (const challenge of challenges) {
      if (challenge.is_completed) continue;

      let shouldUpdate = false;
      let progressIncrement = 0;
      let newProgress = challenge.progress;

      switch (challenge.challenge.type) {
        case "no_unnecessary":
          if (actionType === "transaction" && actionData?.isNecessary === false) {
            // Reset progress when unnecessary expense is made
            newProgress = 0;
            shouldUpdate = true;
          } else if (actionType === "daily_frugal_check") {
            // Increment progress for a frugal day (called during daily check-in)
            progressIncrement = 1;
            shouldUpdate = true;
          }
          break;

        case "savings_target":
          if (actionType === "savings" && actionData?.savingsAmount) {
            progressIncrement = actionData.savingsAmount;
            shouldUpdate = true;
          }
          break;

        case "streak":
          if (actionType === "streak_update" && actionData?.currentStreak !== undefined) {
            newProgress = actionData.currentStreak;
            shouldUpdate = true;
          }
          break;

        case "budget":
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
  }, [fetchCurrentChallenges, updateProgress, toast]);

  const updateStreakChallenge = useCallback(async (currentStreak: number) => {
    return updateChallengesForAction("streak_update", { currentStreak });
  }, [updateChallengesForAction]);

  const updateSavingsChallenge = useCallback(async (savingsAmount: number) => {
    return updateChallengesForAction("savings", { savingsAmount });
  }, [updateChallengesForAction]);

  const trackTransaction = useCallback(async (isNecessary: boolean) => {
    if (!isNecessary) {
      return updateChallengesForAction("transaction", { isNecessary: false });
    }
    return [];
  }, [updateChallengesForAction]);

  // Called during daily check-in to track frugal days
  const trackFrugalDay = useCallback(async (): Promise<ChallengeUpdate[]> => {
    // Only count as a frugal day if no unnecessary expenses were made today
    const hasUnnecessary = await hasUnnecessaryExpensesToday();
    
    if (!hasUnnecessary) {
      return updateChallengesForAction("daily_frugal_check");
    }
    
    return [];
  }, [hasUnnecessaryExpensesToday, updateChallengesForAction]);

  return {
    updateChallengesForAction,
    updateStreakChallenge,
    updateSavingsChallenge,
    trackTransaction,
    trackFrugalDay,
    hasUnnecessaryExpensesToday,
  };
};
