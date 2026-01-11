import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Filter, Trophy, Flame, TrendingUp, PiggyBank, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBadges, useUserBadges } from "@/hooks/useUserData";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type BadgeCategory = "all" | "streak" | "level" | "savings" | "behavior";

const categoryConfig: Record<BadgeCategory, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: "Tutti", icon: <Trophy className="w-4 h-4" />, color: "bg-primary" },
  streak: { label: "Streak", icon: <Flame className="w-4 h-4" />, color: "bg-orange-500" },
  level: { label: "Livello", icon: <TrendingUp className="w-4 h-4" />, color: "bg-blue-500" },
  savings: { label: "Risparmi", icon: <PiggyBank className="w-4 h-4" />, color: "bg-green-500" },
  behavior: { label: "Comportamento", icon: <Sparkles className="w-4 h-4" />, color: "bg-purple-500" },
};

const Badges = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>("all");
  const { data: badges, isLoading: badgesLoading } = useBadges();
  const { data: userBadges, isLoading: userBadgesLoading } = useUserBadges();

  const isLoading = badgesLoading || userBadgesLoading;

  const mappedBadges = useMemo(() => {
    if (!badges) return [];
    return badges.map((badge) => {
      const userBadge = userBadges?.find((ub) => ub.badge_id === badge.id);
      return {
        ...badge,
        isEarned: !!userBadge,
        earnedDate: userBadge?.earned_at,
      };
    });
  }, [badges, userBadges]);

  const filteredBadges = useMemo(() => {
    if (selectedCategory === "all") return mappedBadges;
    return mappedBadges.filter((badge) => badge.badge_type === selectedCategory);
  }, [mappedBadges, selectedCategory]);

  const stats = useMemo(() => {
    const total = mappedBadges.length;
    const earned = mappedBadges.filter((b) => b.isEarned).length;
    const byCategory = Object.keys(categoryConfig)
      .filter((cat) => cat !== "all")
      .map((cat) => {
        const catBadges = mappedBadges.filter((b) => b.badge_type === cat);
        const catEarned = catBadges.filter((b) => b.isEarned).length;
        return {
          category: cat as BadgeCategory,
          total: catBadges.length,
          earned: catEarned,
          percentage: catBadges.length > 0 ? Math.round((catEarned / catBadges.length) * 100) : 0,
        };
      });
    return { total, earned, percentage: total > 0 ? Math.round((earned / total) * 100) : 0, byCategory };
  }, [mappedBadges]);

  const earnedBadges = filteredBadges.filter((b) => b.isEarned);
  const lockedBadges = filteredBadges.filter((b) => !b.isEarned);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Trofei</h1>
          <div className="ml-auto flex items-center gap-2">
            <Trophy className="w-5 h-5 text-reward" />
            <span className="font-bold text-foreground">{stats.earned}/{stats.total}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Progresso Totale</h3>
            <span className="text-2xl font-bold text-primary">{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className="h-3 mb-4" />
          
          <div className="grid grid-cols-2 gap-3">
            {stats.byCategory.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <div className={`p-1.5 rounded-lg ${categoryConfig[cat.category].color} text-white`}>
                  {categoryConfig[cat.category].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {categoryConfig[cat.category].label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cat.earned}/{cat.total} ({cat.percentage}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {(Object.keys(categoryConfig) as BadgeCategory[]).map((cat) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                ${selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }
              `}
            >
              {categoryConfig[cat].icon}
              <span className="text-sm font-medium">{categoryConfig[cat].label}</span>
            </motion.button>
          ))}
        </div>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              Ottenuti ({earnedBadges.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {earnedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05, type: "spring" }}
                    className="relative flex flex-col p-4 rounded-xl bg-gradient-to-br from-reward/20 to-accent/20 border border-reward/30"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <motion.span
                        className="text-3xl"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        {badge.emoji}
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-foreground leading-tight block">
                          {badge.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryConfig[badge.badge_type as BadgeCategory]?.color || 'bg-muted'} text-white mt-1 inline-block`}>
                          {categoryConfig[badge.badge_type as BadgeCategory]?.label || badge.badge_type}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {badge.description}
                    </p>
                    {badge.earnedDate && (
                      <p className="text-[10px] text-muted-foreground/70 mt-2">
                        Ottenuto il {new Date(badge.earnedDate).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-lg">🔒</span>
              Da sbloccare ({lockedBadges.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {lockedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05, type: "spring" }}
                    className="relative flex flex-col p-4 rounded-xl bg-muted/30 border border-border"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-3xl opacity-30">{badge.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-muted-foreground leading-tight block">
                          {badge.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground mt-1 inline-block`}>
                          {categoryConfig[badge.badge_type as BadgeCategory]?.label || badge.badge_type}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/70 leading-snug">
                      {badge.description}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {filteredBadges.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nessun badge in questa categoria</p>
          </div>
        )}
      </div>

      <BottomNav activeTab="badges" />
    </div>
  );
};

export default Badges;
