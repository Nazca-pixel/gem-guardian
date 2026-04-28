import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type TransactionRow = Tables<"transactions">;

export interface CompanionAnimal {
  id: string;
  user_id: string;
  name: string;
  level: number;
  fxp: number;
  bxp: number;
  mood: "happy" | "sad" | "excited";
  consecutive_failed_months: number;
  selected_monster_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  last_checkin_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useCompanion = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["companion", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("companion_animals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CompanionAnimal | null;
    },
    enabled: !!user,
  });
};

export const useUpdateCompanion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<CompanionAnimal>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("companion_animals")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.user_id) {
        queryClient.invalidateQueries({ queryKey: ["companion", data.user_id] });
      } else if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["companion", user.id] });
      }

      queryClient.invalidateQueries({ queryKey: ["companion"] });
    },
  });
};

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSavingsGoals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savings_goals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateSavingsGoal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: {
      name: string;
      emoji: string;
      target_amount: number;
      deadline?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: user.id,
          ...goal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings_goals", user?.id] });
    },
  });
};

/**
 * Recent transactions for lightweight UI lists/previews.
 * Do not use for balance, monthly change, totals or reports.
 */
export const useRecentTransactions = (limit = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", "recent", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as TransactionRow[];
    },
    enabled: !!user,
  });
};

/**
 * Full transaction history for correct balance, reports and aggregations.
 */
export const useAllTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", "all", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const PAGE_SIZE = 1000;
      let from = 0;
      const all: TransactionRow[] = [];

      while (true) {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        all.push(...(data as TransactionRow[]));

        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return all;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};

/**
 * Temporary alias to avoid breaking old imports during migration.
 * Prefer useAllTransactions for correctness or useRecentTransactions for lightweight lists.
 */
export const useTransactions = useAllTransactions;

export const useCreateTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: {
      description: string;
      amount: number;
      category:
        | "food"
        | "transport"
        | "entertainment"
        | "shopping"
        | "bills"
        | "health"
        | "education"
        | "savings"
        | "income"
        | "other";
      emoji: string;
      is_income: boolean;
      is_necessary: boolean;
      transaction_date?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.category,
            emoji: transaction.emoji,
            is_income: transaction.is_income,
            is_necessary: transaction.is_necessary,
            transaction_date: transaction.transaction_date,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "all", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "recent", user?.id] });
    },
  });
};

export const useUpdateTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: {
      id: string;
      description: string;
      amount: number;
      category:
        | "food"
        | "transport"
        | "entertainment"
        | "shopping"
        | "bills"
        | "health"
        | "education"
        | "savings"
        | "income"
        | "other";
      emoji: string;
      is_income: boolean;
      is_necessary: boolean;
      transaction_date?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .update({
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          emoji: transaction.emoji,
          is_income: transaction.is_income,
          is_necessary: transaction.is_necessary,
          transaction_date: transaction.transaction_date,
        })
        .eq("id", transaction.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "all", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "recent", user?.id] });
    },
  });
};

export const useDeleteTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "all", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "recent", user?.id] });
    },
  });
};

export const useAccessories = () => {
  return useQuery({
    queryKey: ["accessories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accessories")
        .select("*")
        .order("bxp_required", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useUserAccessories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_accessories", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_accessories")
        .select("*, accessory:accessories(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useBadges = () => {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*");

      if (error) throw error;
      return data;
    },
  });
};

export const useUserBadges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_badges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badges(*)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
