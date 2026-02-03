import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanion } from "./useUserData";

const BASE_BXP_REWARD = 5;
const MAX_STREAK_BONUS = 5;

// Calculate BXP reward based on streak: base 5 + min(streak, 5) bonus
const calculateBxpReward = (currentStreak: number): number => {
  const bonus = Math.min(currentStreak, MAX_STREAK_BONUS);
  return BASE_BXP_REWARD + bonus;
};

// Check if the last check-in was yesterday (for streak continuation)
const wasYesterday = (dateStr: string | null): boolean => {
  if (!dateStr) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  return dateStr === yesterdayStr;
};

export const useDailyCheckin = () => {
  const { user } = useAuth();
  const { data: companion } = useCompanion();
  const queryClient = useQueryClient();

  // Check if the user has already checked in today
  const hasCheckedInToday = (): boolean => {
    if (!companion) return false;
    
    const lastCheckin = (companion as any).last_checkin_date;
    if (!lastCheckin) return false;
    
    const today = new Date().toISOString().split("T")[0];
    return lastCheckin === today;
  };

  // Get current check-in streak
  const getCheckinStreak = (): number => {
    return (companion as any)?.checkin_streak || 0;
  };

  // Calculate today's potential reward
  const getTodayReward = (): number => {
    if (hasCheckedInToday()) {
      return calculateBxpReward(getCheckinStreak());
    }
    // If not checked in yet, show what they'll get
    const lastCheckin = (companion as any)?.last_checkin_date;
    const continuesStreak = wasYesterday(lastCheckin);
    const projectedStreak = continuesStreak ? getCheckinStreak() + 1 : 1;
    return calculateBxpReward(projectedStreak);
  };

  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!companion) throw new Error("Companion not found");
      
      const today = new Date().toISOString().split("T")[0];
      
      // Check if already checked in today
      if (hasCheckedInToday()) {
        throw new Error("Already checked in today");
      }
      
      // Calculate new streak
      const lastCheckin = (companion as any).last_checkin_date;
      const continuesStreak = wasYesterday(lastCheckin);
      const currentStreak = (companion as any).checkin_streak || 0;
      const newStreak = continuesStreak ? currentStreak + 1 : 1;
      
      // Calculate BXP reward based on new streak
      const bxpReward = calculateBxpReward(newStreak);
      const newBxp = (companion.bxp || 0) + bxpReward;
      
      const { data, error } = await supabase
        .from("companion_animals")
        .update({
          bxp: newBxp,
          last_checkin_date: today,
          checkin_streak: newStreak,
        })
        .eq("user_id", user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        bxpEarned: bxpReward,
        newBxp,
        newStreak,
        streakContinued: continuesStreak,
        companion: data,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companion", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });
    },
  });

  return {
    checkin: checkinMutation.mutateAsync,
    isLoading: checkinMutation.isPending,
    hasCheckedInToday,
    getCheckinStreak,
    getTodayReward,
    baseBxpReward: BASE_BXP_REWARD,
    maxStreakBonus: MAX_STREAK_BONUS,
  };
};
