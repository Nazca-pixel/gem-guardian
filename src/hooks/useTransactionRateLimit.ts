import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MAX_TRANSACTIONS_PER_DAY = 10;
const COOLDOWN_MS = 60 * 1000; // 1 minute

interface RateLimitStatus {
  canSubmit: boolean;
  todayCount: number;
  remainingToday: number;
  cooldownSecondsLeft: number;
  reason: string | null;
}

export const useTransactionRateLimit = () => {
  const { user } = useAuth();
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("lastTransactionTime");
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch today's transaction count
  const fetchTodayCount = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { count, error } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("transaction_date", today);

    if (!error && count !== null) {
      setTodayCount(count);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTodayCount();
  }, [fetchTodayCount]);

  // Cooldown countdown timer
  useEffect(() => {
    if (!lastSubmitTime) {
      setCooldownSecondsLeft(0);
      return;
    }

    const updateCooldown = () => {
      const elapsed = Date.now() - lastSubmitTime;
      const remaining = Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000));
      setCooldownSecondsLeft(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [lastSubmitTime]);

  const getStatus = useCallback((): RateLimitStatus => {
    const remainingToday = MAX_TRANSACTIONS_PER_DAY - todayCount;

    if (remainingToday <= 0) {
      return {
        canSubmit: false,
        todayCount,
        remainingToday: 0,
        cooldownSecondsLeft,
        reason: "Hai raggiunto il limite di 10 transazioni per oggi. Riprova domani!",
      };
    }

    if (cooldownSecondsLeft > 0) {
      return {
        canSubmit: false,
        todayCount,
        remainingToday,
        cooldownSecondsLeft,
        reason: `Attendi ${cooldownSecondsLeft}s prima di inserire un'altra transazione`,
      };
    }

    return {
      canSubmit: true,
      todayCount,
      remainingToday,
      cooldownSecondsLeft: 0,
      reason: null,
    };
  }, [todayCount, cooldownSecondsLeft]);

  const recordSubmit = useCallback(() => {
    const now = Date.now();
    setLastSubmitTime(now);
    try {
      localStorage.setItem("lastTransactionTime", String(now));
    } catch {}
    setTodayCount((prev) => prev + 1);
  }, []);

  return { getStatus, recordSubmit, loading, refresh: fetchTodayCount };
};
