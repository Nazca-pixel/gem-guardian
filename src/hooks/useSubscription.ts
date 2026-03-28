import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionTier = "free" | "starter" | "pro" | "elite";

export interface TierBenefits {
  name: string;
  price: number;
  annualPrice: number;
  emoji: string;
  color: string;
  features: string[];
  highlighted?: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierBenefits> = {
  free: {
    name: "Free",
    price: 0,
    annualPrice: 0,
    emoji: "🌱",
    color: "muted",
    features: [
      "Tracciamento spese base",
      "1 obiettivo di risparmio",
      "Compagno base",
      "Sfide settimanali limitate",
    ],
  },
  starter: {
    name: "Starter",
    price: 2.99,
    annualPrice: 24.99,
    emoji: "⭐",
    color: "info",
    features: [
      "Tutto di Free +",
      "5 obiettivi di risparmio",
      "Report mensili dettagliati",
      "Accessori bonus per il compagno",
      "Nessun limite transazioni",
    ],
  },
  pro: {
    name: "Pro",
    price: 5.99,
    annualPrice: 49.99,
    emoji: "🔥",
    color: "primary",
    highlighted: true,
    features: [
      "Tutto di Starter +",
      "Obiettivi illimitati",
      "Tutti i mostri sbloccabili",
      "Bonus BXP x2",
      "Sfide esclusive",
      "Badge Premium",
    ],
  },
  elite: {
    name: "Elite",
    price: 9.99,
    annualPrice: 89.99,
    emoji: "👑",
    color: "reward",
    features: [
      "Tutto di Pro +",
      "Bonus BXP x3",
      "Mostri leggendari esclusivi",
      "Accesso anticipato nuove feature",
      "Supporto prioritario",
      "Profilo personalizzato",
    ],
  },
};

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useActiveTier(): SubscriptionTier {
  const { data } = useSubscription();
  if (!data) return "free";
  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) return "free";
  return (data.tier as SubscriptionTier) || "free";
}

export function useCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tier,
      isAnnual,
    }: {
      tier: SubscriptionTier;
      isAnnual: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");




      // Use secure server-side function
      const { data, error } = await supabase.rpc("checkout_subscription", {
        _tier: tier,
        _is_annual: isAnnual,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
