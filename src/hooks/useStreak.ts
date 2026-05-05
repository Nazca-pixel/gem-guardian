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
  newBadges: string[];
}

const STREAK_MILESTONES = [
  { days: 7, badge_type: "streak_7" },
  { days: 30, badge_type: "streak_30" },
  { days: 100, badge_type: "streak_100" },
];

const checkAndAwardStreakBadges = async (userId: string, newStreak: number): Promise<string[]> => {
  const newBadges: string[] = [];

  // Get user's existing streak badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id, badges(badge_type)")
    .eq("user_id", userId);

  const earnedBadgeTypes = userBadges?.map((ub: any) => ub.badges?.badge_type) || [];

  // Check each milestone
  for (const milestone of STREAK_MILESTONES) {
    if (newStreak >= milestone.days && !earnedBadgeTypes.includes(milestone.badge_type)) {
      // Get the badge id
      const { data: badge } = await supabase
        .from("badges")
        .select("id, name")
        .eq("badge_type", milestone.badge_type)
        .single();

      if (badge) {
        // Award the badge via secure RPC
        await supabase.rpc("award_badge", { p_badge_id: badge.id });
        newBadges.push(badge.name);
      }
    }
  }

  return newBadges;
};

export const useUpdateStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lastActivityDate: string | null): Promise<StreakUpdate> => {
      if (!user) throw new Error("User not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");

      // Get current companion data (for streak-broken detection only)
      const { data: companion, error: fetchError } = await supabase
        .from("companion_animals")
        .select("current_streak, longest_streak, last_activity_date, last_checkin_date")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const prevStreak = companion?.current_streak || 0;
      const lastDate = companion?.last_activity_date || companion?.last_checkin_date;

      // Already-active today: no-op
      if (lastDate === today) {
        return {
          current_streak: prevStreak,
          longest_streak: companion?.longest_streak || 0,
          last_activity_date: today,
          streakBroken: false,
          isNewDay: false,
          newBadges: [],
        };
      }

      // Detect broken streak (server will reset, we just report it)
      let streakBroken = false;
      if (lastDate) {
        const daysDiff = differenceInDays(new Date(today), parseISO(lastDate));
        if (daysDiff > 1 && prevStreak > 0) streakBroken = true;
      }

      // Trusted RPC updates protected streak fields
      const { data: rpcRes, error: rpcError } = await supabase.rpc("update_companion_streak", {
        p_action: "checkin",
      });
      if (rpcError) throw rpcError;
      const res = (rpcRes as any) || {};
      const newStreak: number = res.current_streak ?? 1;
      const newLongestStreak: number = res.longest_streak ?? newStreak;

      // Check and award streak badges
      const newBadges = await checkAndAwardStreakBadges(user.id, newStreak);

      return {
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        streakBroken,
        isNewDay: true,
        newBadges,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companion", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user_badges", user?.id] });
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