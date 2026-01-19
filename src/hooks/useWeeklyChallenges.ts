import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WEEKLY_CHALLENGES, WeeklyChallenge } from "@/lib/xpSystem";

// Get the start of the current week (Monday)
const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

export interface UserChallenge {
  id: string;
  challenge_id: string;
  week_start: string;
  progress: number;
  target: number;
  is_completed: boolean;
  completed_at: string | null;
  fxp_reward: number;
  bxp_reward: number;
  challenge: WeeklyChallenge;
}

export const useWeeklyChallenges = () => {
  const { user } = useAuth();
  const weekStart = getWeekStart();

  return useQuery({
    queryKey: ["weekly-challenges", user?.id, weekStart],
    queryFn: async (): Promise<UserChallenge[]> => {
      if (!user) return [];

      // Fetch user's challenges for this week
      const { data: userChallenges, error } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart);

      if (error) throw error;

      // Map challenges with their definitions
      const mappedChallenges = (userChallenges || []).map(uc => {
        const challengeDef = WEEKLY_CHALLENGES.find(c => c.id === uc.challenge_id);
        return {
          ...uc,
          challenge: challengeDef || WEEKLY_CHALLENGES[0],
        };
      });

      return mappedChallenges;
    },
    enabled: !!user,
  });
};

export const useAssignWeeklyChallenge = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const weekStart = getWeekStart();

  return useMutation({
    mutationFn: async (challengeId?: string) => {
      if (!user) throw new Error("User not authenticated");

      // If no specific challenge, pick a random one
      const challenge = challengeId 
        ? WEEKLY_CHALLENGES.find(c => c.id === challengeId) 
        : WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)];

      if (!challenge) throw new Error("Challenge not found");

      // Check if user already has this challenge for the week
      const { data: existing } = await supabase
        .from("user_challenges")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", challenge.id)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (existing) {
        throw new Error("Challenge already assigned for this week");
      }

      // Create the challenge
      const { data, error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          week_start: weekStart,
          target: challenge.target,
          fxp_reward: challenge.fxpReward,
          bxp_reward: challenge.bxpReward,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-challenges"] });
    },
  });
};

export const useUpdateChallengeProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, progress }: { challengeId: string; progress: number }) => {
      if (!user) throw new Error("User not authenticated");

      const weekStart = getWeekStart();

      // Get current challenge
      const { data: challenge, error: fetchError } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!challenge) throw new Error("Challenge not found");

      const isNowCompleted = progress >= challenge.target && !challenge.is_completed;

      // Update progress
      const { data, error } = await supabase
        .from("user_challenges")
        .update({
          progress: Math.min(progress, challenge.target),
          is_completed: progress >= challenge.target,
          completed_at: isNowCompleted ? new Date().toISOString() : challenge.completed_at,
        })
        .eq("id", challenge.id)
        .select()
        .single();

      if (error) throw error;

      // If just completed, award XP
      if (isNowCompleted) {
        const { data: companion } = await supabase
          .from("companion_animals")
          .select("fxp, bxp")
          .eq("user_id", user.id)
          .single();

        if (companion) {
          await supabase
            .from("companion_animals")
            .update({
              fxp: companion.fxp + challenge.fxp_reward,
              bxp: companion.bxp + challenge.bxp_reward,
            })
            .eq("user_id", user.id);
        }
      }

      return { ...data, justCompleted: isNowCompleted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });
    },
  });
};
