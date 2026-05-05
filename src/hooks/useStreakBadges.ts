import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges, useUserBadges } from "./useUserData";

// Streak milestones that earn badges
export const STREAK_MILESTONES = [7, 30, 100] as const;

// Badge names for each milestone
const MILESTONE_BADGE_NAMES: Record<number, string> = {
  7: "7 Giorni",
  30: "Costante",
  100: "Leggenda",
};

export const useStreakBadges = () => {
  const { user } = useAuth();
  const { data: allBadges } = useBadges();
  const { data: userBadges } = useUserBadges();
  const queryClient = useQueryClient();

  // Get streak badges from all badges
  const streakBadges = allBadges?.filter(b => b.badge_type === "streak") || [];

  // Get earned streak badge IDs
  const earnedStreakBadgeIds = new Set(
    userBadges
      ?.filter(ub => streakBadges.some(sb => sb.id === ub.badge_id))
      .map(ub => ub.badge_id) || []
  );

  // Check if a specific milestone badge is earned
  const hasMilestoneBadge = (milestone: number): boolean => {
    const badgeName = MILESTONE_BADGE_NAMES[milestone];
    const badge = streakBadges.find(b => b.name === badgeName);
    return badge ? earnedStreakBadgeIds.has(badge.id) : false;
  };

  // Get the next unearned milestone for a given streak
  const getNextMilestone = (currentStreak: number): number | null => {
    for (const milestone of STREAK_MILESTONES) {
      if (currentStreak < milestone && !hasMilestoneBadge(milestone)) {
        return milestone;
      }
    }
    return null;
  };

  // Check which milestones should be awarded for a given streak
  const getMilestonesToAward = (newStreak: number): number[] => {
    return STREAK_MILESTONES.filter(
      milestone => newStreak >= milestone && !hasMilestoneBadge(milestone)
    );
  };

  // Mutation to award a badge
  const awardBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("award_badge", { p_badge_id: badgeId });
      if (error) throw error;
      return { user_id: user.id, badge_id: badgeId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_badges", user?.id] });
    },
  });

  // Award all earned milestone badges for a given streak
  const awardMilestoneBadges = async (newStreak: number): Promise<{ milestone: number; badgeName: string } | null> => {
    const milestonesToAward = getMilestonesToAward(newStreak);
    
    if (milestonesToAward.length === 0) return null;

    // Award all earned badges
    for (const milestone of milestonesToAward) {
      const badgeName = MILESTONE_BADGE_NAMES[milestone];
      const badge = streakBadges.find(b => b.name === badgeName);
      
      if (badge) {
        await awardBadgeMutation.mutateAsync(badge.id);
      }
    }

    // Return the highest milestone achieved for celebration
    const highestMilestone = Math.max(...milestonesToAward);
    return {
      milestone: highestMilestone,
      badgeName: MILESTONE_BADGE_NAMES[highestMilestone],
    };
  };

  return {
    streakBadges,
    earnedStreakBadgeIds,
    hasMilestoneBadge,
    getNextMilestone,
    getMilestonesToAward,
    awardMilestoneBadges,
    isAwarding: awardBadgeMutation.isPending,
    STREAK_MILESTONES,
  };
};
