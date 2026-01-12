import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Unlock, 
  TrendingUp, 
  Award, 
  Database, 
  X, 
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDevMode } from "@/contexts/DevModeContext";
import { useCompanion, useUpdateCompanion, useAccessories, useBadges, useCreateTransaction, useTransactions, useDeleteTransaction, useSavingsGoals, useCreateSavingsGoal } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface DevModePanelProps {
  onStreakMilestone?: (data: { milestone: number; badgeName: string }) => void;
}

export const DevModePanel = ({ onStreakMilestone }: DevModePanelProps) => {
  const { isDevMode, setDevMode } = useDevMode();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"unlock" | "xp" | "milestone" | "data">("unlock");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: companion } = useCompanion();
  const updateCompanion = useUpdateCompanion();
  const { data: accessories } = useAccessories();
  const { data: badges } = useBadges();
  const { data: transactions } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const createTransaction = useCreateTransaction();
  const { data: savingsGoals } = useSavingsGoals();
  const createSavingsGoal = useCreateSavingsGoal();

  const [tempLevel, setTempLevel] = useState(1);
  const [tempBxp, setTempBxp] = useState(0);
  const [tempFxp, setTempFxp] = useState(0);
  const [tempStreak, setTempStreak] = useState(0);

  // Sync temp values with companion data when it changes
  useEffect(() => {
    if (companion) {
      setTempLevel(companion.level || 1);
      setTempBxp(companion.bxp || 0);
      setTempFxp(companion.fxp || 0);
      setTempStreak(companion.current_streak || 0);
    }
  }, [companion]);

  if (!isDevMode) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setDevMode(true)}
        className="fixed bottom-24 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
        title="Attiva DevMode"
      >
        <Settings className="w-5 h-5" />
      </motion.button>
    );
  }

  const unlockAllAccessories = async () => {
    if (!user || !accessories) return;
    
    for (const accessory of accessories) {
      const { error } = await supabase
        .from("user_accessories")
        .upsert({ 
          user_id: user.id, 
          accessory_id: accessory.id,
          is_equipped: false 
        }, { onConflict: 'user_id,accessory_id' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error("Error unlocking accessory:", error);
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["user_accessories"] });
    toast({ title: "✅ Tutti gli accessori sbloccati!" });
  };

  const unlockAllBadges = async () => {
    if (!user || !badges) return;
    
    for (const badge of badges) {
      const { error } = await supabase
        .from("user_badges")
        .upsert({ 
          user_id: user.id, 
          badge_id: badge.id 
        }, { onConflict: 'user_id,badge_id' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error("Error unlocking badge:", error);
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["user_badges"] });
    toast({ title: "🏆 Tutti i badge sbloccati!" });
  };

  const unlockAllMonsters = async () => {
    if (!user) return;
    
    // Step 1: Max out companion stats
    await updateCompanion.mutateAsync({
      level: 20,
      bxp: 5000,
      fxp: 1000,
      current_streak: 100,
      longest_streak: 100,
    });
    
    // Step 2: Unlock all badges (for badge-based unlocks)
    if (badges) {
      for (const badge of badges) {
        await supabase
          .from("user_badges")
          .upsert({ user_id: user.id, badge_id: badge.id }, { onConflict: 'user_id,badge_id' });
      }
      queryClient.invalidateQueries({ queryKey: ["user_badges"] });
    }
    
    // Step 3: Add test transactions if needed (for transaction-based unlocks)
    const currentTxCount = transactions?.length || 0;
    if (currentTxCount < 50) {
      const txToAdd = 50 - currentTxCount;
      for (let i = 0; i < txToAdd; i++) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          description: `Transazione test ${i + 1}`,
          amount: 10,
          category: "other",
          emoji: "🧪",
          is_income: false,
          is_necessary: true,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    }
    
    // Step 4: Add savings goals with high amounts (for savings-based unlocks)
    const completedGoals = savingsGoals?.filter(g => g.is_completed).length || 0;
    if (completedGoals < 3) {
      for (let i = 0; i < 3 - completedGoals; i++) {
        const { data: newGoal } = await supabase.from("savings_goals").insert({
          user_id: user.id,
          name: `Obiettivo completato ${i + 1}`,
          emoji: "✅",
          target_amount: 2000,
          current_amount: 2000,
          is_completed: true,
        }).select().single();
      }
      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
    }
    
    toast({ title: "🐉 Tutti i mostriciattoli sbloccati!" });
  };

  const applyXPChanges = async () => {
    try {
      await updateCompanion.mutateAsync({
        level: tempLevel,
        bxp: tempBxp,
        fxp: tempFxp,
        current_streak: tempStreak,
      });
      // Force refetch of companion data
      await queryClient.refetchQueries({ queryKey: ["companion"] });
      toast({ title: "✨ Stats aggiornate!" });
    } catch (error) {
      console.error("Error updating companion:", error);
      toast({ title: "❌ Errore nell'aggiornamento", variant: "destructive" });
    }
  };

  const triggerMilestone = (days: number) => {
    const milestoneNames: Record<number, string> = {
      7: "Prima Settimana! 🌟",
      30: "Un Mese! 🔥",
      100: "Centurione! 💯"
    };
    
    onStreakMilestone?.({ 
      milestone: days, 
      badgeName: milestoneNames[days] || `${days} giorni!` 
    });
    toast({ title: `🎉 Milestone ${days} giorni attivata!` });
  };

  const addTestTransactions = async () => {
    const testData = [
      { description: "Spesa supermercato", amount: 85.50, category: "food" as const, emoji: "🛒", is_income: false, is_necessary: true },
      { description: "Stipendio", amount: 1500, category: "income" as const, emoji: "💰", is_income: true, is_necessary: false },
      { description: "Netflix", amount: 12.99, category: "entertainment" as const, emoji: "🎬", is_income: false, is_necessary: false },
      { description: "Benzina", amount: 45, category: "transport" as const, emoji: "⛽", is_income: false, is_necessary: true },
      { description: "Cena fuori", amount: 35, category: "food" as const, emoji: "🍝", is_income: false, is_necessary: false },
    ];

    for (const tx of testData) {
      await createTransaction.mutateAsync(tx);
    }
    toast({ title: "📝 5 transazioni di test aggiunte!" });
  };

  const addTestGoal = async () => {
    await createSavingsGoal.mutateAsync({
      name: "Vacanza Test",
      emoji: "🏖️",
      target_amount: 1000,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    toast({ title: "🎯 Obiettivo di test aggiunto!" });
  };

  const clearAllTransactions = async () => {
    if (!transactions) return;
    
    for (const tx of transactions) {
      await deleteTransaction.mutateAsync(tx.id);
    }
    toast({ title: "🗑️ Tutte le transazioni eliminate!" });
  };

  const resetStats = async () => {
    await updateCompanion.mutateAsync({
      level: 1,
      bxp: 0,
      fxp: 0,
      current_streak: 0,
      longest_streak: 0,
    });
    setTempLevel(1);
    setTempBxp(0);
    setTempFxp(0);
    setTempStreak(0);
    toast({ title: "🔄 Stats resettate!" });
  };

  const tabs = [
    { id: "unlock" as const, label: "Sblocca", icon: Unlock },
    { id: "xp" as const, label: "XP/Livelli", icon: TrendingUp },
    { id: "milestone" as const, label: "Milestone", icon: Award },
    { id: "data" as const, label: "Dati", icon: Database },
  ];

  return (
    <>
      {/* DevMode Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 z-50 p-3 rounded-full shadow-lg ${
          isOpen 
            ? "bg-red-500 text-white" 
            : "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5 animate-spin-slow" />}
      </motion.button>

      {/* DevMode Badge */}
      <div className="fixed top-4 right-4 z-50 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow-lg">
        <Sparkles className="w-3 h-3" />
        DEV MODE
        <button onClick={() => setDevMode(false)} className="ml-2 hover:bg-white/20 rounded-full p-0.5">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-40 right-4 z-50 w-80 max-h-[60vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                DevMode Panel
              </h3>
              <p className="text-xs opacity-80">Strumenti di sviluppo</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 p-2 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                    activeTab === tab.id 
                      ? "text-primary border-b-2 border-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              {activeTab === "unlock" && (
                <div className="space-y-3">
                  <Button 
                    onClick={unlockAllAccessories} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Sblocca tutti gli accessori
                  </Button>
                  <Button 
                    onClick={unlockAllBadges} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Sblocca tutti i badge
                  </Button>
                  <Button 
                    onClick={unlockAllMonsters} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sblocca tutti i mostriciattoli
                  </Button>
                </div>
              )}

              {activeTab === "xp" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Livello</span>
                      <span className="text-primary font-bold">{tempLevel}</span>
                    </label>
                    <Slider
                      value={[tempLevel]}
                      onValueChange={([v]) => setTempLevel(v)}
                      min={1}
                      max={25}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>BXP</span>
                      <span className="text-amber-500 font-bold">{tempBxp}</span>
                    </label>
                    <Slider
                      value={[tempBxp]}
                      onValueChange={([v]) => setTempBxp(v)}
                      min={0}
                      max={10000}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>FXP</span>
                      <span className="text-blue-500 font-bold">{tempFxp}</span>
                    </label>
                    <Slider
                      value={[tempFxp]}
                      onValueChange={([v]) => setTempFxp(v)}
                      min={0}
                      max={5000}
                      step={50}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Streak</span>
                      <span className="text-orange-500 font-bold">{tempStreak} giorni</span>
                    </label>
                    <Slider
                      value={[tempStreak]}
                      onValueChange={([v]) => setTempStreak(v)}
                      min={0}
                      max={365}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={applyXPChanges} size="sm" className="flex-1">
                      <Zap className="w-4 h-4 mr-2" />
                      Applica
                    </Button>
                    <Button onClick={resetStats} size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "milestone" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-4">
                    Attiva manualmente le celebrazioni milestone
                  </p>
                  <Button 
                    onClick={() => triggerMilestone(7)} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  >
                    <Flame className="w-4 h-4 mr-2" />
                    7 giorni (Prima settimana)
                  </Button>
                  <Button 
                    onClick={() => triggerMilestone(30)} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                  >
                    <Flame className="w-4 h-4 mr-2" />
                    30 giorni (Un mese)
                  </Button>
                  <Button 
                    onClick={() => triggerMilestone(100)} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Flame className="w-4 h-4 mr-2" />
                    100 giorni (Centurione)
                  </Button>
                </div>
              )}

              {activeTab === "data" && (
                <div className="space-y-3">
                  <Button 
                    onClick={addTestTransactions} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi 5 transazioni test
                  </Button>
                  <Button 
                    onClick={addTestGoal} 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi obiettivo test
                  </Button>
                  <Button 
                    onClick={clearAllTransactions} 
                    size="sm" 
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina tutte le transazioni
                  </Button>
                  <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                    <p>📊 Transazioni: {transactions?.length || 0}</p>
                    <p>🎯 Obiettivi: {savingsGoals?.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
