import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// Level thresholds - FXP needed to reach each level
export const LEVEL_THRESHOLDS = {
  getMaxFxp: (level: number) => level * 100,
  getMaxBxp: (level: number) => level * 50,
};

// Badge rewards by level
const LEVEL_BADGE_REWARDS: Record<number, string> = {
  5: "9921a866-a79d-40ac-8c92-e8f2413654ed", // Maestro badge
  10: "64400e15-7d12-45fc-8434-9777af4d3bd9", // Esperto badge
};

// Accessory rewards by level (based on BXP milestones)
const BXP_ACCESSORY_THRESHOLDS = [
  { bxp: 0, accessoryId: "be20ca90-7abf-4509-9fcd-0244cd104285" }, // Fiocco
  { bxp: 100, accessoryId: "50cea2a3-c547-4398-86ce-24074e41ce44" }, // Cappello
  { bxp: 200, accessoryId: "c3fe7971-dca5-4d30-a0ed-64cdcf1f3db6" }, // Fiore
  { bxp: 300, accessoryId: "29d83449-9e9b-4efb-b4d5-b2a52174dcbe" }, // Sciarpa
  { bxp: 350, accessoryId: "5c394aa0-26a1-40e8-a397-e6662c92c03a" }, // Papillon
  { bxp: 400, accessoryId: "b6144575-714c-4873-a8e0-b9a5ce5c2065" }, // Occhiali
  { bxp: 500, accessoryId: "c03d82ba-f7af-44e5-b763-e3cb436bd2df" }, // Corona
  { bxp: 1000, accessoryId: "20b663eb-2012-4fd3-90eb-a9df8cfcea78" }, // Maschera
];

export interface LevelUpResult {
  levelsGained: number;
  newLevel: number;
  newFxp: number;
  badgeEarned?: { id: string; name: string; emoji: string };
  accessoriesUnlocked: Array<{ id: string; name: string; emoji: string }>;
}

export interface BxpUpdateResult {
  newBxp: number;
  accessoriesUnlocked: Array<{ id: string; name: string; emoji: string }>;
}

export const useLevelUp = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const processLevelUp = async (
    currentLevel: number,
    currentFxp: number,
    fxpToAdd: number
  ): Promise<LevelUpResult> => {
    if (!user) throw new Error("User not authenticated");

    let newFxp = currentFxp + fxpToAdd;
    let newLevel = currentLevel;
    let levelsGained = 0;
    let badgeEarned: LevelUpResult["badgeEarned"];
    const accessoriesUnlocked: LevelUpResult["accessoriesUnlocked"] = [];

    // Process level ups
    let maxFxp = LEVEL_THRESHOLDS.getMaxFxp(newLevel);
    while (newFxp >= maxFxp) {
      newFxp -= maxFxp;
      newLevel++;
      levelsGained++;

      // Check for badge reward at this level
      if (LEVEL_BADGE_REWARDS[newLevel]) {
        const badgeId = LEVEL_BADGE_REWARDS[newLevel];
        
        // Check if user already has this badge
        const { data: existingBadge } = await supabase
          .from("user_badges")
          .select("id")
          .eq("user_id", user.id)
          .eq("badge_id", badgeId)
          .maybeSingle();

        if (!existingBadge) {
          // Award the badge via secure RPC
          await supabase.rpc("award_badge", { _badge_id: badgeId });

          // Fetch badge info for display
          const { data: badge } = await supabase
            .from("badges")
            .select("id, name, emoji")
            .eq("id", badgeId)
            .single();

          if (badge) {
            badgeEarned = badge;
          }
        }
      }

      maxFxp = LEVEL_THRESHOLDS.getMaxFxp(newLevel);
    }

    // Update companion in database
    await supabase
      .from("companion_animals")
      .update({
        level: newLevel,
        fxp: newFxp,
        mood: levelsGained > 0 ? "excited" : "happy",
      })
      .eq("user_id", user.id);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["companion", user.id] });
    queryClient.invalidateQueries({ queryKey: ["user_badges", user.id] });

    return {
      levelsGained,
      newLevel,
      newFxp,
      badgeEarned,
      accessoriesUnlocked,
    };
  };

  const processBxpUpdate = async (
    currentBxp: number,
    bxpToAdd: number
  ): Promise<BxpUpdateResult> => {
    if (!user) throw new Error("User not authenticated");

    const newBxp = currentBxp + bxpToAdd;
    const accessoriesUnlocked: BxpUpdateResult["accessoriesUnlocked"] = [];

    // Find newly unlocked accessories
    for (const threshold of BXP_ACCESSORY_THRESHOLDS) {
      if (currentBxp < threshold.bxp && newBxp >= threshold.bxp) {
        // Check if user already has this accessory
        const { data: existing } = await supabase
          .from("user_accessories")
          .select("id")
          .eq("user_id", user.id)
          .eq("accessory_id", threshold.accessoryId)
          .maybeSingle();

        if (!existing) {
          // Unlock the accessory via secure RPC
          await supabase.rpc("unlock_accessory", { _accessory_id: threshold.accessoryId });

          // Fetch accessory info for display
          const { data: accessory } = await supabase
            .from("accessories")
            .select("id, name, emoji")
            .eq("id", threshold.accessoryId)
            .single();

          if (accessory) {
            accessoriesUnlocked.push(accessory);
          }
        }
      }
    }

    // Update companion BXP
    await supabase
      .from("companion_animals")
      .update({ bxp: newBxp })
      .eq("user_id", user.id);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["companion", user.id] });
    queryClient.invalidateQueries({ queryKey: ["user_accessories", user.id] });

    return {
      newBxp,
      accessoriesUnlocked,
    };
  };

  return {
    processLevelUp,
    processBxpUpdate,
    LEVEL_THRESHOLDS,
  };
};
