import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanion } from "./useUserData";

const CHECKIN_BXP_REWARD = 5;

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

  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!companion) throw new Error("Companion not found");
      
      const today = new Date().toISOString().split("T")[0];
      
      // Check if already checked in today
      if (hasCheckedInToday()) {
        throw new Error("Already checked in today");
      }
      
      // Update companion with new BXP and last_checkin_date
      const newBxp = (companion.bxp || 0) + CHECKIN_BXP_REWARD;
      
      const { data, error } = await supabase
        .from("companion_animals")
        .update({
          bxp: newBxp,
          last_checkin_date: today,
        })
        .eq("user_id", user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        bxpEarned: CHECKIN_BXP_REWARD,
        newBxp,
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
    bxpReward: CHECKIN_BXP_REWARD,
  };
};
