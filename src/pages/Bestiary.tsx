import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Check, ArrowLeft, Crown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { MonsterPreviewCard } from "@/components/MonsterPreviewCard";
import { 
  monsters, 
  Monster, 
  isMonsterUnlocked, 
  getUnlockProgress,
  rarityColors,
  rarityLabels 
} from "@/lib/monsters";
import { 
  useCompanion, 
  useUpdateCompanion,
  useTransactions, 
  useSavingsGoals,
  useUserBadges 
} from "@/hooks/useUserData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"] as const;

export default function Bestiary() {
  const navigate = useNavigate();
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [filterRarity, setFilterRarity] = useState<Monster["rarity"] | "all">("all");
  const { toast } = useToast();

  const { data: companion } = useCompanion();
  const updateCompanion = useUpdateCompanion();
  const { data: transactions } = useTransactions();
  const { data: savingsGoals } = useSavingsGoals();
  const { data: userBadges } = useUserBadges();

  const currentMonsterId = companion?.selected_monster_id || "phoenix";

  // Calculate user stats for unlock checking
  const userStats = useMemo(() => {
    const totalSavings = savingsGoals?.reduce(
      (acc, goal) => acc + Number(goal.current_amount), 
      0
    ) || 0;
    
    const completedGoals = savingsGoals?.filter(g => g.is_completed).length || 0;

    return {
      level: companion?.level || 1,
      bxp: companion?.bxp || 0,
      fxp: companion?.fxp || 0,
      totalSavings,
      transactionCount: transactions?.length || 0,
      badgeCount: userBadges?.length || 0,
      completedGoals,
      currentStreak: companion?.current_streak || 0,
    };
  }, [companion, transactions, savingsGoals, userBadges]);

  // Categorize monsters
  const categorizedMonsters = useMemo(() => {
    const filtered = filterRarity === "all" 
      ? monsters 
      : monsters.filter(m => m.rarity === filterRarity);

    return filtered.map(monster => ({
      ...monster,
      isUnlocked: isMonsterUnlocked(monster, userStats),
      progress: getUnlockProgress(monster, userStats),
      isSelected: monster.id === currentMonsterId,
    }));
  }, [userStats, filterRarity, currentMonsterId]);

  const unlockedCount = categorizedMonsters.filter(m => m.isUnlocked).length;

  const handleSelectMonster = async (monsterId: string) => {
    try {
      await updateCompanion.mutateAsync({ selected_monster_id: monsterId });
      toast({
        title: "Compagno cambiato! 🎉",
        description: `Hai selezionato ${monsters.find(m => m.id === monsterId)?.name}`,
      });
      setSelectedMonster(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile cambiare il compagno",
        variant: "destructive",
      });
    }
  };
  const totalCount = categorizedMonsters.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      >
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📖
                </motion.span>
                Bestiario
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">{unlockedCount}</span>
                  <span>/</span>
                  <span>{totalCount}</span>
                  <span>creature</span>
                </div>
                <div className="h-2 flex-1 max-w-[80px] bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rarity filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterRarity("all")}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterRarity === "all"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              ✨ Tutti
            </motion.button>
            {rarityOrder.map(rarity => (
              <motion.button
                key={rarity}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterRarity(rarity)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filterRarity === rarity
                    ? `bg-gradient-to-r ${rarityColors[rarity]} text-white shadow-lg`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {rarityLabels[rarity]}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Monster Grid */}
      <div className="px-4 py-6">
        <motion.div 
          layout
          className="grid grid-cols-2 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {categorizedMonsters.map((monster, index) => (
              <MonsterPreviewCard
                key={monster.id}
                monster={monster}
                index={index}
                onClick={() => setSelectedMonster(monster)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Monster Detail Modal */}
      <Dialog open={!!selectedMonster} onOpenChange={() => setSelectedMonster(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-3xl border-2 overflow-hidden">
          {selectedMonster && (() => {
            const isUnlocked = isMonsterUnlocked(selectedMonster, userStats);
            const progress = getUnlockProgress(selectedMonster, userStats);
            
            return (
              <>
                {/* Header background */}
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-br ${rarityColors[selectedMonster.rarity]} opacity-20`} />
                
                <DialogHeader className="relative z-10">
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    {isUnlocked ? (
                      <>
                        <motion.span 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-3xl"
                        >
                          {selectedMonster.emoji}
                        </motion.span>
                        {selectedMonster.name}
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </motion.div>
                        Creatura Bloccata
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 relative z-10">
                  {/* Rarity badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${rarityColors[selectedMonster.rarity]} text-white shadow-lg`}
                  >
                    <Star className="w-3 h-3" />
                    {rarityLabels[selectedMonster.rarity]}
                  </motion.div>

                  {/* Description */}
                  {isUnlocked ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedMonster.description}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        Come sbloccare:
                      </p>
                      <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20"
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-5 h-5 text-primary shrink-0" />
                        </motion.div>
                        <span className="text-sm text-foreground">
                          {selectedMonster.unlockCondition.description}
                        </span>
                      </motion.div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2.5" />
                      </div>
                    </div>
                  )}

                  {/* Evolutions */}
                  {isUnlocked && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span>🔄</span> Stadi Evolutivi
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedMonster.evolutions.map((evo, index) => (
                          <motion.div
                            key={evo.stage}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="flex flex-col items-center p-2.5 bg-gradient-to-br from-muted to-muted/50 rounded-xl border border-border/50"
                          >
                            <motion.span 
                              animate={{ y: [0, -2, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                              className="text-2xl mb-1"
                            >
                              {evo.emoji}
                            </motion.span>
                            <span className="text-[10px] text-muted-foreground text-center leading-tight">
                              {evo.name}
                            </span>
                            <span className="text-[10px] text-primary font-bold mt-0.5">
                              Lv.{evo.minLevel}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unlock condition reminder for unlocked monsters */}
                  {isUnlocked && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/20"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {selectedMonster.unlockCondition.description}
                      </span>
                    </motion.div>
                  )}

                  {/* Select button for unlocked monsters */}
                  {isUnlocked && (
                    <Button
                      onClick={() => handleSelectMonster(selectedMonster.id)}
                      disabled={selectedMonster.id === currentMonsterId || updateCompanion.isPending}
                      className="w-full mt-4 rounded-xl h-12 text-base font-semibold"
                      variant={selectedMonster.id === currentMonsterId ? "secondary" : "default"}
                    >
                      {selectedMonster.id === currentMonsterId 
                        ? "✓ Compagno attuale" 
                        : "🎮 Seleziona come compagno"
                      }
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <BottomNav activeTab="bestiary" />
    </div>
  );
}
