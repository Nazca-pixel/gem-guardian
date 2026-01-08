import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border"
      >
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>📖</span> Bestiario
              </h1>
              <p className="text-sm text-muted-foreground">
                {unlockedCount}/{totalCount} creature sbloccate
              </p>
            </div>
          </div>

          {/* Rarity filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterRarity("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterRarity === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Tutti
            </button>
            {rarityOrder.map(rarity => (
              <button
                key={rarity}
                onClick={() => setFilterRarity(rarity)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterRarity === rarity
                    ? `bg-gradient-to-r ${rarityColors[rarity]} text-white`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {rarityLabels[rarity]}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Monster Grid */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {categorizedMonsters.map((monster, index) => (
              <motion.div
                key={monster.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedMonster(monster)}
                className={`
                  relative p-4 rounded-2xl border cursor-pointer transition-all
                  ${monster.isUnlocked 
                    ? monster.isSelected
                      ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/30"
                      : "bg-card border-border hover:border-primary/50 hover:shadow-lg" 
                    : "bg-muted/50 border-border/50"
                  }
                `}
              >
                {/* Selected indicator */}
                {monster.isSelected && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                
                {/* Rarity indicator */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${rarityColors[monster.rarity]}`} />
                
                {/* Monster display */}
                <div className="flex flex-col items-center text-center">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3
                    ${monster.isUnlocked 
                      ? `bg-gradient-to-br ${rarityColors[monster.rarity]} bg-opacity-20` 
                      : "bg-muted"
                    }
                  `}>
                    {monster.isUnlocked ? (
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {monster.emoji}
                      </motion.span>
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <h3 className={`font-bold text-sm ${
                    monster.isUnlocked ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {monster.isUnlocked ? monster.name : "???"}
                  </h3>
                  
                  <span className={`text-xs mt-1 bg-gradient-to-r ${rarityColors[monster.rarity]} bg-clip-text text-transparent font-medium`}>
                    {rarityLabels[monster.rarity]}
                  </span>

                  {/* Progress bar for locked monsters */}
                  {!monster.isUnlocked && (
                    <div className="w-full mt-2">
                      <Progress value={monster.progress} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {Math.round(monster.progress)}%
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Monster Detail Modal */}
      <Dialog open={!!selectedMonster} onOpenChange={() => setSelectedMonster(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          {selectedMonster && (() => {
            const isUnlocked = isMonsterUnlocked(selectedMonster, userStats);
            const progress = getUnlockProgress(selectedMonster, userStats);
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    {isUnlocked ? (
                      <>
                        <span className="text-2xl">{selectedMonster.emoji}</span>
                        {selectedMonster.name}
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 text-muted-foreground" />
                        Creatura Bloccata
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Rarity badge */}
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${rarityColors[selectedMonster.rarity]} text-white`}>
                    {rarityLabels[selectedMonster.rarity]}
                  </div>

                  {/* Description */}
                  {isUnlocked ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedMonster.description}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Come sbloccare:
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                        <Sparkles className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {selectedMonster.unlockCondition.description}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        Progresso: {Math.round(progress)}%
                      </p>
                    </div>
                  )}

                  {/* Evolutions */}
                  {isUnlocked && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">
                        Stadi Evolutivi
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedMonster.evolutions.map((evo, index) => (
                          <motion.div
                            key={evo.stage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center p-2 bg-muted rounded-xl"
                          >
                            <span className="text-2xl mb-1">{evo.emoji}</span>
                            <span className="text-[10px] text-muted-foreground text-center">
                              {evo.name}
                            </span>
                            <span className="text-[10px] text-primary font-medium">
                              Lv.{evo.minLevel}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unlock condition reminder for unlocked monsters */}
                  {isUnlocked && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
                      <span className="text-primary">✓</span>
                      <span className="text-xs text-primary">
                        {selectedMonster.unlockCondition.description}
                      </span>
                    </div>
                  )}

                  {/* Select button for unlocked monsters */}
                  {isUnlocked && (
                    <Button
                      onClick={() => handleSelectMonster(selectedMonster.id)}
                      disabled={selectedMonster.id === currentMonsterId || updateCompanion.isPending}
                      className="w-full mt-4 rounded-xl"
                      variant={selectedMonster.id === currentMonsterId ? "secondary" : "default"}
                    >
                      {selectedMonster.id === currentMonsterId 
                        ? "✓ Compagno attuale" 
                        : "Seleziona come compagno"
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
