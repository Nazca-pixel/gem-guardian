import { useState } from "react";
import { motion } from "framer-motion";
import { CompanionAnimal } from "@/components/CompanionAnimal";
import { XPDisplay } from "@/components/XPDisplay";
import { BalanceCard } from "@/components/BalanceCard";
import { SavingsGoalCard } from "@/components/SavingsGoalCard";
import { QuickActions } from "@/components/QuickActions";
import { FullTransactionList } from "@/components/FullTransactionList";
import { AccessoriesBar } from "@/components/AccessoriesBar";
import { BadgesGrid } from "@/components/BadgesGrid";
import { BottomNav } from "@/components/BottomNav";
import { LevelUpModal } from "@/components/LevelUpModal";
import { AccessoryUnlockedToast } from "@/components/AccessoryUnlockedToast";
import { StreakDisplay } from "@/components/StreakDisplay";
import { StreakReminder } from "@/components/StreakReminder";
import { StreakMilestoneModal } from "@/components/StreakMilestoneModal";
import { WeeklyChallenges } from "@/components/WeeklyChallenges";
import { DailyCheckin } from "@/components/DailyCheckin";
import { DevModePanel } from "@/components/DevModePanel";
import { PremiumBanner } from "@/components/PremiumBanner";
import { TierBadge } from "@/components/TierBadge";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useCompanion, useSavingsGoals, useTransactions, useAccessories, useUserAccessories, useBadges, useUserBadges } from "@/hooks/useUserData";
import { LevelUpResult } from "@/hooks/useLevelUp";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const Index = () => {
  const { signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: companion, isLoading: companionLoading } = useCompanion();
  const { data: savingsGoals } = useSavingsGoals();
  const { data: transactions } = useTransactions();
  const { data: accessories } = useAccessories();
  const { data: userAccessories } = useUserAccessories();
  const { data: badges } = useBadges();
  const { data: userBadges } = useUserBadges();

  const [levelUpData, setLevelUpData] = useState<LevelUpResult | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [unlockedAccessory, setUnlockedAccessory] = useState<{ name: string; emoji: string } | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<{ milestone: number; badgeName: string } | null>(null);

  const handleLevelUp = (result: LevelUpResult) => {
    setLevelUpData(result);
    setShowLevelUpModal(true);
  };

  const handleAccessoryUnlocked = (accessory: { name: string; emoji: string }) => {
    setUnlockedAccessory(accessory);
  };

  const displayName = profile?.display_name || "Utente";
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: it });

  // Calculate total balance from transactions
  const totalBalance = transactions?.reduce((acc, t) => {
    return acc + (t.is_income ? Number(t.amount) : -Number(t.amount));
  }, 0) || 0;

  // Calculate monthly change
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  
  const monthlyChange = transactions?.filter(t => 
    new Date(t.transaction_date) >= currentMonthStart
  ).reduce((acc, t) => {
    return acc + (t.is_income ? Number(t.amount) : -Number(t.amount));
  }, 0) || 0;

  // Map accessories with unlock status and equipped state
  const mappedAccessories = accessories?.map(acc => {
    const userAcc = userAccessories?.find(ua => ua.accessory_id === acc.id);
    return {
      id: acc.id,
      emoji: acc.emoji,
      name: acc.name,
      description: acc.description,
      bxpRequired: acc.bxp_required,
      isUnlocked: !!userAcc || (companion?.bxp || 0) >= acc.bxp_required,
      isEquipped: userAcc?.is_equipped || false,
    };
  }) || [];

  // Get equipped accessory for companion display
  const equippedAccessory = mappedAccessories.find(a => a.isEquipped);
  const equippedForCompanion = equippedAccessory ? {
    emoji: equippedAccessory.emoji,
    name: equippedAccessory.name,
  } : null;

  // Map badges with earned status
  const mappedBadges = badges?.map(badge => {
    const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
    return {
      id: badge.id,
      emoji: badge.emoji,
      name: badge.name,
      description: badge.description,
      isEarned: !!userBadge,
      earnedDate: userBadge?.earned_at ? format(new Date(userBadge.earned_at), "d MMM", { locale: it }) : undefined,
    };
  }) || [];

  // Map transactions for FullTransactionList
  const fullTransactions = transactions?.map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    category: t.category,
    emoji: t.emoji || "💰",
    transaction_date: t.transaction_date,
    is_income: t.is_income,
  })) || [];

  // Calculate FXP needed for next level
  const getMaxFxpForLevel = (level: number) => (level) * 100;

  if (companionLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-4 py-6 max-w-lg mx-auto">
        <Skeleton className="h-12 w-full mb-6 rounded-xl" />
        <Skeleton className="h-64 w-full mb-6 rounded-3xl" />
        <Skeleton className="h-24 w-full mb-4 rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-card/40 backdrop-blur-2xl border-b border-border/30 px-4 py-3 shadow-soft"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-xl font-bold text-foreground">Ciao, {displayName}! 👋</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground capitalize">{currentMonth}</p>
              <TierBadge size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={signOut}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Companion Animal - Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-card/60 backdrop-blur-xl rounded-3xl p-6 shadow-card border border-border/50 relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-4 left-4 w-16 h-16 bg-primary/5 rounded-full" />
          <div className="absolute bottom-4 right-4 w-20 h-20 bg-accent/10 rounded-full" />
          <div className="absolute top-1/2 right-8 w-3 h-3 bg-reward rounded-full animate-sparkle" />
          <div className="absolute top-8 right-16 w-2 h-2 bg-secondary rounded-full animate-sparkle" style={{ animationDelay: "0.5s" }} />
          
          <div className="flex justify-center">
            <CompanionAnimal
              level={companion?.level || 1}
              mood={(companion?.mood as "happy" | "sad" | "excited") || "happy"}
              fxp={companion?.fxp || 0}
              maxFxp={getMaxFxpForLevel(companion?.level || 1)}
              name={companion?.name || "Pippo"}
              selectedMonsterId={companion?.selected_monster_id || "phoenix"}
              equippedAccessory={equippedForCompanion}
            />
          </div>
        </motion.section>

        {/* Streak Reminder (at-risk warning) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <StreakReminder
            currentStreak={companion?.current_streak || 0}
            lastActivityDate={companion?.last_activity_date || null}
          />
        </motion.div>

        {/* Streak Display */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <StreakDisplay
            currentStreak={companion?.current_streak || 0}
            longestStreak={companion?.longest_streak || 0}
          />
        </motion.div>

        {/* Daily Check-in */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <DailyCheckin />
        </motion.div>

        {/* XP Display */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <XPDisplay fxp={companion?.fxp || 0} bxp={companion?.bxp || 0} />
        </motion.div>

        {/* Premium Upgrade Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <PremiumBanner />
        </motion.div>

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <BalanceCard
            balance={totalBalance}
            monthlyChange={monthlyChange}
            lastSync={format(new Date(), "'Oggi,' HH:mm", { locale: it })}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <QuickActions onStreakMilestone={setStreakMilestone} />
        </motion.div>

        {/* Weekly Challenges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.45 }} whileHover={{ scale: 1.02 }} className="hover-glow rounded-2xl">
          <WeeklyChallenges />
        </motion.div>

        {/* Savings Goals */}
        {savingsGoals && savingsGoals.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.45 }} className="space-y-3">
            {savingsGoals.map((goal) => (
              <SavingsGoalCard
                key={goal.id}
                id={goal.id}
                goalName={goal.name}
                currentAmount={Number(goal.current_amount)}
                targetAmount={Number(goal.target_amount)}
                deadline={
                  goal.deadline
                    ? format(new Date(goal.deadline), "MMMM yyyy", { locale: it })
                    : "Senza scadenza"
                }
                emoji={goal.emoji || "🎯"}
              />
            ))}
          </motion.section>
        )}
        {/* Accessories */}
        {mappedAccessories.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.45 }}>
            <AccessoriesBar accessories={mappedAccessories} currentBxp={companion?.bxp || 0} />
          </motion.div>
        )}

        {/* Badges */}
        {mappedBadges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.45 }}>
            <BadgesGrid badges={mappedBadges} />
          </motion.div>
        )}

        {/* Recent Transactions with Filters */}
        {fullTransactions.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.45 }}>
            <FullTransactionList
              transactions={fullTransactions}
              showFilters={true}
              title="Transazioni"
              collapsible={true}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.45 }}
            className="bg-card rounded-2xl p-6 shadow-card border border-border text-center"
          >
            <span className="text-4xl">📝</span>
            <h3 className="font-bold text-foreground mt-3">Nessuna transazione</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Inizia a tracciare le tue spese per guadagnare BXP!
            </p>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        levelUpData={levelUpData}
        companionName={companion?.name || "Pippo"}
      />

      {/* Accessory Unlocked Toast */}
      <AccessoryUnlockedToast
        isOpen={!!unlockedAccessory}
        accessory={unlockedAccessory}
        onClose={() => setUnlockedAccessory(null)}
      />

      {/* Streak Milestone Modal */}
      <StreakMilestoneModal
        isOpen={!!streakMilestone}
        onClose={() => setStreakMilestone(null)}
        milestone={streakMilestone?.milestone || 7}
        badgeName={streakMilestone?.badgeName || ""}
      />

      {/* DevMode Panel */}
      <DevModePanel onStreakMilestone={setStreakMilestone} />
    </div>
  );
};

export default Index;
