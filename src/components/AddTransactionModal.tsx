import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTransaction, useCompanion } from "@/hooks/useUserData";
import { useUpdateStreak } from "@/hooks/useStreak";
import { getStreakBonus } from "@/components/StreakDisplay";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLevelUp, BxpUpdateResult } from "@/hooks/useLevelUp";
import { useChallengeProgress } from "@/hooks/useChallengeProgress";

interface StreakMilestone {
  milestone: number;
  badgeName: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessoryUnlocked?: (accessory: { name: string; emoji: string }) => void;
  onStreakMilestone?: (data: StreakMilestone) => void;
  defaultCategory?: typeof categories[number]["value"];
}

const categories = [
  { value: "food", label: "Cibo", emoji: "🍕" },
  { value: "transport", label: "Trasporti", emoji: "🚗" },
  { value: "entertainment", label: "Svago", emoji: "🎬" },
  { value: "shopping", label: "Shopping", emoji: "🛍️" },
  { value: "bills", label: "Bollette", emoji: "📄" },
  { value: "health", label: "Salute", emoji: "💊" },
  { value: "education", label: "Istruzione", emoji: "📚" },
  { value: "income", label: "Entrata", emoji: "💰" },
  { value: "other", label: "Altro", emoji: "📦" },
] as const;

const STREAK_MILESTONES = [7, 30, 100];

export const AddTransactionModal = ({ isOpen, onClose, onAccessoryUnlocked, onStreakMilestone, defaultCategory = "other" }: AddTransactionModalProps) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<typeof categories[number]["value"]>(defaultCategory);
  const [isNecessary, setIsNecessary] = useState(true);
  
  const createTransaction = useCreateTransaction();
  const { data: companion } = useCompanion();
  const updateStreak = useUpdateStreak();
  const { user } = useAuth();
  const { toast } = useToast();
  const { processBxpUpdate } = useLevelUp();
  const { trackTransaction, updateStreakChallenge } = useChallengeProgress();

  // Reset category when modal opens with a different default
  React.useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
    }
  }, [isOpen, defaultCategory]);

  const selectedCategory = categories.find(c => c.value === category);
  const isIncome = category === "income";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci descrizione e importo",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        emoji: selectedCategory?.emoji || "💰",
        is_income: isIncome,
        is_necessary: isNecessary,
        transaction_date: new Date().toISOString().split('T')[0],
      });

      // Update streak
      let streakBonus = 1;
      let newStreak = companion?.current_streak || 0;
      try {
        const streakResult = await updateStreak.mutateAsync(companion?.last_activity_date || null);
        newStreak = streakResult.current_streak;
        streakBonus = getStreakBonus(newStreak);
        
        if (streakResult.isNewDay && newStreak > 1) {
          toast({
            title: `🔥 Streak di ${newStreak} giorni!`,
            description: streakBonus > 1 ? `Bonus XP: +${Math.round((streakBonus - 1) * 100)}%` : "Continua così!",
          });
        }
        
        // Show milestone celebration for streak badges
        if (streakResult.newBadges.length > 0 && onStreakMilestone) {
          // Find which milestone was reached
          const reachedMilestone = STREAK_MILESTONES.find(m => newStreak >= m && newStreak < m + 1) || 
                                   STREAK_MILESTONES.find(m => newStreak === m);
          if (reachedMilestone) {
            onStreakMilestone({
              milestone: reachedMilestone,
              badgeName: streakResult.newBadges[0],
            });
          }
        }
        // Update streak challenge progress
        await updateStreakChallenge(newStreak);
      } catch {
        // Continue even if streak update fails
      }

      // Track transaction for "no unnecessary expenses" challenge
      try {
        await trackTransaction(isNecessary);
      } catch {
        // Continue even if challenge update fails
      }

      const baseBxpReward = (() => {
        let reward = 1;
        if (!isIncome) {
          if (isNecessary) reward += 2;
        } else {
          reward += 1;
        }
        return reward;
      })();

      // Apply streak bonus
      const bxpReward = Math.round(baseBxpReward * streakBonus);

      let awardedBxp = false;

      if (user && companion) {
        try {
          const result = await processBxpUpdate(companion.bxp, bxpReward);
          awardedBxp = true;
          
          if (result.accessoriesUnlocked.length > 0 && onAccessoryUnlocked) {
            onAccessoryUnlocked(result.accessoriesUnlocked[0]);
          }
        } catch {
          // Continue even if BXP update fails
        }
      }

      toast({
        title: isIncome ? "Entrata registrata! 💰" : "Spesa registrata! ✅",
        description: `${description} - €${amount}${awardedBxp ? ` (+${bxpReward} BXP${streakBonus > 1 ? " 🔥" : ""})` : ""}`,
      });

      setDescription("");
      setAmount("");
      setCategory("other");
      setIsNecessary(true);
      onClose();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la transazione",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="max-w-lg mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Nuova Transazione
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount */}
                <div>
                  <Label className="text-foreground">Importo</Label>
                  <div className="relative mt-1">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 text-2xl font-bold h-14 rounded-xl"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-foreground">Descrizione</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Es. Pranzo al ristorante"
                    className="mt-1 rounded-xl"
                    maxLength={100}
                  />
                </div>

                {/* Category */}
                <div>
                  <Label className="text-foreground mb-2 block">Categoria</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          category === cat.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/50 hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-xs font-medium text-foreground">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Necessary toggle (only for expenses) */}
                {!isIncome && (
                  <div>
                    <Label className="text-foreground mb-2 block">Tipo di spesa</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNecessary(true)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isNecessary
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/50"
                        }`}
                      >
                        <span className="text-lg">✅</span>
                        <p className="text-sm font-medium text-foreground mt-1">Necessaria</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsNecessary(false)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          !isNecessary
                            ? "border-secondary bg-secondary/10"
                            : "border-border bg-muted/50"
                        }`}
                      >
                        <span className="text-lg">🎯</span>
                        <p className="text-sm font-medium text-foreground mt-1">Non necessaria</p>
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Le spese necessarie danno +3 BXP, le altre +1 BXP
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={createTransaction.isPending}
                  className="w-full h-12 rounded-xl gradient-hero text-primary-foreground font-semibold"
                >
                  {createTransaction.isPending ? (
                    "Salvataggio..."
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi {isIncome ? "Entrata" : "Spesa"}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};