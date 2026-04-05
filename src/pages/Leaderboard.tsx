import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useCompanion, useProfile } from "@/hooks/useUserData";
import { ArrowLeft, Trophy, Crown, Medal, Star, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveTier, TIER_CONFIG } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  level: number;
  fxp: number;
  bxp: number;
  selected_monster_id: string;
  subscription_tier: string;
}

const TIER_BONUS: Record<string, number> = {
  free: 1,
  starter: 1.1,
  pro: 1.25,
  elite: 1.5,
};

const TIER_EMOJI: Record<string, string> = {
  free: "",
  starter: "⭐",
  pro: "💎",
  elite: "👑",
};

const useLeaderboard = () => {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard");
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    refetchInterval: 30000,
  });
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: companion } = useCompanion();
  const { data: profile } = useProfile();
  const { data: leaderboardData, isLoading } = useLeaderboard();
  const currentTier = useActiveTier();

  const calculateScore = (fxp: number, bxp: number, tier: string) => {
    const base = Math.round(fxp * 0.6 + bxp * 0.4);
    const bonus = TIER_BONUS[tier] || 1;
    return Math.round(base * bonus);
  };

  const rankedLeaderboard = (leaderboardData || [])
    .map((entry) => ({
      ...entry,
      blendedScore: calculateScore(entry.fxp, entry.bxp, entry.subscription_tier),
      isCurrentUser: entry.user_id === user?.id,
    }))
    .sort((a, b) => b.blendedScore - a.blendedScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const currentUserEntry = rankedLeaderboard.find((e) => e.isCurrentUser);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-reward" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary";
    switch (rank) {
      case 1: return "bg-reward/10 border-reward/30";
      case 2: return "bg-gray-100 dark:bg-gray-800 border-gray-300";
      case 3: return "bg-amber-50 dark:bg-amber-900/20 border-amber-300";
      default: return "bg-card border-border";
    }
  };

  const fxp = companion?.fxp || 0;
  const bxp = companion?.bxp || 0;
  const myScore = calculateScore(fxp, bxp, currentTier);
  const tierBonus = TIER_BONUS[currentTier] || 1;

  return (
    <div className="min-h-screen bg-background pb-32">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Classifica 🏆</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Your Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-6 border border-primary/30"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-card flex items-center justify-center text-4xl mb-3 shadow-card">
              🐣
            </div>
            <h2 className="text-xl font-bold text-foreground">{profile?.display_name || "Tu"}</h2>
            <p className="text-muted-foreground text-sm">
              Livello {companion?.level || 1}
              {currentUserEntry && ` · Posizione #${currentUserEntry.rank}`}
            </p>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{fxp}</p>
                <p className="text-xs text-muted-foreground">FXP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{bxp}</p>
                <p className="text-xs text-muted-foreground">BXP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{myScore}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </div>

            {tierBonus > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 inline-flex items-center gap-1.5 bg-reward/15 text-reward px-3 py-1.5 rounded-full text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Bonus Premium x{tierBonus} sul punteggio
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Tier Bonus Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-reward" />
            Bonus Classifica Premium
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TIER_BONUS).filter(([t]) => t !== "free").map(([tier, bonus]) => (
              <div
                key={tier}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                  tier === currentTier
                    ? "bg-primary/10 border border-primary/30 font-bold"
                    : "bg-muted/50"
                }`}
              >
                <span>{TIER_EMOJI[tier]}</span>
                <span className="capitalize text-foreground">{TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.name || tier}</span>
                <span className="ml-auto text-muted-foreground">x{bonus}</span>
              </div>
            ))}
          </div>
          {currentTier === "free" && (
            <button
              onClick={() => navigate("/premium")}
              className="mt-3 w-full text-center text-xs text-primary font-semibold hover:underline"
            >
              Fai upgrade per scalare la classifica →
            </button>
          )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-reward" />
            Top Giocatori
          </h3>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))
          ) : rankedLeaderboard.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <span className="text-3xl">🏜️</span>
              <p className="text-sm text-muted-foreground mt-2">Nessun giocatore ancora!</p>
            </div>
          ) : (
            rankedLeaderboard.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${getRankBg(entry.rank, entry.isCurrentUser)}`}
              >
                <div className="w-10 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                  🐣
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`font-bold truncate ${entry.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                      {entry.display_name} {entry.isCurrentUser && "(Tu)"}
                    </p>
                    {TIER_EMOJI[entry.subscription_tier] && (
                      <span className="text-sm">{TIER_EMOJI[entry.subscription_tier]}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Livello {entry.level}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-reward" />
                    <span className="font-bold text-foreground">{entry.blendedScore.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">punti</p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 border border-border text-center"
        >
          <span className="text-3xl">🔜</span>
          <h4 className="font-bold text-foreground mt-2">Sfide con Amici</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Presto potrai aggiungere amici e sfidarli!
          </p>
        </motion.div>
      </main>

      <BottomNav activeTab="ranks" />
    </div>
  );
};

export default Leaderboard;
