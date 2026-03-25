import { useActiveTier, SubscriptionTier } from "./useSubscription";

export interface TierLimits {
  maxGoals: number;
  bxpMultiplier: number;
  fxpMultiplier: number;
  canAccessMonsterRarity: (rarity: string) => boolean;
  maxTransactionsPerDay: number;
  tier: SubscriptionTier;
}

const LIMITS: Record<SubscriptionTier, Omit<TierLimits, "canAccessMonsterRarity" | "tier">> = {
  free: {
    maxGoals: 1,
    bxpMultiplier: 1,
    fxpMultiplier: 1,
    maxTransactionsPerDay: 10,
  },
  starter: {
    maxGoals: 5,
    bxpMultiplier: 1,
    fxpMultiplier: 1,
    maxTransactionsPerDay: Infinity,
  },
  pro: {
    maxGoals: Infinity,
    bxpMultiplier: 2,
    fxpMultiplier: 1.5,
    maxTransactionsPerDay: Infinity,
  },
  elite: {
    maxGoals: Infinity,
    bxpMultiplier: 3,
    fxpMultiplier: 2,
    maxTransactionsPerDay: Infinity,
  },
};

const RARITY_ACCESS: Record<SubscriptionTier, string[]> = {
  free: ["common", "uncommon", "rare"],
  starter: ["common", "uncommon", "rare", "epic"],
  pro: ["common", "uncommon", "rare", "epic", "legendary"],
  elite: ["common", "uncommon", "rare", "epic", "legendary"],
};

export function useTierLimits(): TierLimits {
  const tier = useActiveTier();
  const limits = LIMITS[tier];

  return {
    ...limits,
    tier,
    canAccessMonsterRarity: (rarity: string) =>
      RARITY_ACCESS[tier].includes(rarity),
  };
}
