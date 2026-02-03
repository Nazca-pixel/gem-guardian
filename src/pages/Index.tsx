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
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-xl font-bold text-foreground">Ciao, {displayName}! 👋</h1>
            <p className="text-xs text-muted-foreground capitalize">{currentMonth}</p>
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl p-6 shadow-card border border-border relative overflow-hidden"
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
        <StreakReminder 
          currentStreak={companion?.current_streak || 0}
          lastActivityDate={companion?.last_activity_date || null}
        />

        {/* Streak Display */}
        <StreakDisplay 
          currentStreak={companion?.current_streak || 0}
          longestStreak={companion?.longest_streak || 0}
        />

        {/* Daily Check-in */}
        <DailyCheckin />

        {/* XP Display */}
        <XPDisplay fxp={companion?.fxp || 0} bxp={companion?.bxp || 0} />

        {/* Balance Card */}
        <BalanceCard
          balance={totalBalance}
          monthlyChange={monthlyChange}
          lastSync={format(new Date(), "'Oggi,' HH:mm", { locale: it })}
        />

        {/* Quick Actions */}
        <QuickActions onStreakMilestone={setStreakMilestone} />

        {/* Weekly Challenges */}
        <WeeklyChallenges />

        {/* Savings Goals */}
        {savingsGoals && savingsGoals.length > 0 && (
          <section className="space-y-3">
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
          </section>
        )}
        {/* Accessories */}
        {mappedAccessories.length > 0 && (
          <AccessoriesBar accessories={mappedAccessories} currentBxp={companion?.bxp || 0} />
        )}

        {/* Badges */}
        {mappedBadges.length > 0 && (
          <BadgesGrid badges={mappedBadges} />
        )}

        {/* Recent Transactions with Filters */}
        {fullTransactions.length > 0 ? (
          <FullTransactionList
            transactions={fullTransactions}
            showFilters={true}
            title="Transazioni"
            collapsible={true}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
