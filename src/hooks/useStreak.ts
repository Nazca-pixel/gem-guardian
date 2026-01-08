import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays, parseISO } from "date-fns";

interface StreakUpdate {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streakBroken: boolean;
  isNewDay: boolean;
}

export const useUpdateStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lastActivityDate: string | null): Promise<StreakUpdate> => {
      if (!user) throw new Error("User not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");
      
      // Get current companion data
      const { data: companion, error: fetchError } = await supabase
        .from("companion_animals")
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentStreak = companion?.current_streak || 0;
      const longestStreak = companion?.longest_streak || 0;
      const lastDate = companion?.last_activity_date;

      // If already logged today, no update needed
      if (lastDate === today) {
        return {
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          streakBroken: false,
          isNewDay: false,
        };
      }

      let newStreak = 1;
      let streakBroken = false;

      if (lastDate) {
        const daysDiff = differenceInDays(new Date(today), parseISO(lastDate));
        
        if (daysDiff === 1) {
          // Consecutive day - increase streak
          newStreak = currentStreak + 1;
        } else if (daysDiff > 1) {
          // Streak broken
          newStreak = 1;
          streakBroken = currentStreak > 0;
        } else {
          // Same day (shouldn't happen due to check above)
          newStreak = currentStreak;
        }
      }

      const newLongestStreak = Math.max(longestStreak, newStreak);

      // Update the companion with new streak data
      const { error: updateError } = await supabase
        .from("companion_animals")
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_activity_date: today,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return {
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        streakBroken,
        isNewDay: true,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companion", user?.id] });
    },
  });
};

// Helper to check if user should be reminded about streak
export const getStreakStatus = (lastActivityDate: string | null): "active" | "at-risk" | "broken" => {
  if (!lastActivityDate) return "broken";
  
  const today = new Date();
  const lastDate = parseISO(lastActivityDate);
  const daysDiff = differenceInDays(today, lastDate);
  
  if (daysDiff === 0) return "active";
  if (daysDiff === 1) return "at-risk";
  return "broken";
};