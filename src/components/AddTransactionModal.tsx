import React, { useState } from "react";
import { ResponsiveModal, useResponsiveModalDragHandle } from "./ResponsiveModal";
import { X, Plus, Euro, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCreateTransaction, useCompanion } from "@/hooks/useUserData";
import { useUpdateStreak } from "@/hooks/useStreak";
import { getStreakBonus } from "@/components/StreakDisplay";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLevelUp, BxpUpdateResult } from "@/hooks/useLevelUp";
import { useChallengeProgress } from "@/hooks/useChallengeProgress";
import { useWeeklyChallenges } from "@/hooks/useWeeklyChallenges";
import { useTransactionRateLimit } from "@/hooks/useTransactionRateLimit";
import { useTierLimits } from "@/hooks/useTierLimits";

const transactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { message: "La descrizione è obbligatoria" })
    .max(100, { message: "Massimo 100 caratteri" }),
  amount: z
    .string()
    .min(1, { message: "L'importo è obbligatorio" })
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "L'importo deve essere maggiore di zero",
    }),
});

type FieldErrors = Partial<Record<"description" | "amount", string>>;

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  const createTransaction = useCreateTransaction();
  const { data: companion } = useCompanion();
  const updateStreak = useUpdateStreak();
  const { user } = useAuth();
  const { toast } = useToast();
  const { processBxpUpdate } = useLevelUp();
  const { trackTransaction, updateStreakChallenge } = useChallengeProgress();
  const { data: challenges } = useWeeklyChallenges();
  const [showResetWarning, setShowResetWarning] = useState(false);
  const { getStatus, recordSubmit, loading: rateLimitLoading } = useTransactionRateLimit();
  const { bxpMultiplier } = useTierLimits();
  const rateLimitStatus = getStatus();

  // Reset category and errors when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setFieldErrors({});
    }
  }, [isOpen, defaultCategory]);

  const selectedCategory = categories.find(c => c.value === category);
  const isIncome = category === "income";

  const activeFrugalChallenge = challenges?.find(
    (c) => c.challenge.type === "no_unnecessary" && !c.is_completed && c.progress > 0
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = transactionSchema.safeParse({ description, amount });
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Rate limit check
    if (!rateLimitStatus.canSubmit) {
      toast({
        title: "⏳ Limite raggiunto",
        description: rateLimitStatus.reason || "",
        variant: "destructive",
      });
      return;
    }

    // If adding an unnecessary expense and there's an active frugal challenge with progress
    if (!isIncome && !isNecessary && activeFrugalChallenge) {
      setShowResetWarning(true);
      return;
    }

    // Otherwise proceed directly
    submitTransaction();
  };

  const submitTransaction = async () => {
    setShowResetWarning(false);
    
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

      // Apply streak bonus and tier multiplier
      const bxpReward = Math.round(baseBxpReward * streakBonus * bxpMultiplier);

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

      // Record rate limit
      recordSubmit();

      toast({
        title: isIncome ? "Ottimo lavoro! Il tuo Guardian è felice 🎉" : "Spesa registrata! ✅",
        description: `${description} - €${amount}${awardedBxp ? ` (+${bxpReward} BXP${streakBonus > 1 ? " 🔥" : ""})` : ""}`,
      });

      // Confetti burst on income
      if (isIncome) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.3 },
          colors: ["#4ade80", "#facc15", "#60a5fa", "#f472b6"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 100,
            origin: { y: 0.35, x: 0.6 },
          });
        }, 200);
      }

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
    <>
      <ResponsiveModal isOpen={isOpen} onClose={onClose}>
        <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between p-6 pb-4">
            <h2 className="text-xl font-bold text-foreground">
              Nuova Transazione
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >  
              <X className="w-4 h-4" />
            </button>
          </div>

              <form
  id="add-transaction-form"
  onSubmit={handleFormSubmit}
  className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-24 space-y-5 [-webkit-overflow-scrolling:touch]"
>
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
                      onChange={(e) => { setAmount(e.target.value); setFieldErrors((p) => ({ ...p, amount: undefined })); }}
                      placeholder="0.00"
                      className={`pl-10 text-2xl font-bold h-14 rounded-xl ${fieldErrors.amount ? "border-destructive ring-destructive/30 ring-2" : ""}`}
                    />
                  </div>
                  {fieldErrors.amount && (
                    <p className="text-xs text-destructive mt-1 ml-1">{fieldErrors.amount}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label className="text-foreground">Descrizione</Label>
                  <Input
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setFieldErrors((p) => ({ ...p, description: undefined })); }}
                    placeholder="Es. Pranzo al ristorante"
                    className={`mt-1 rounded-xl ${fieldErrors.description ? "border-destructive ring-destructive/30 ring-2" : ""}`}
                    maxLength={100}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs text-destructive mt-1 ml-1">{fieldErrors.description}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <Label className="text-foreground mb-2 block">Categoria</Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                          category === cat.value
                            ? "border-primary bg-primary/15 shadow-md ring-2 ring-primary/20"
                            : "border-border bg-muted/50 hover:border-primary/50"
                        }`}
                      >
                        <span className="text-3xl">{cat.emoji}</span>
                        <span className="text-xs font-semibold text-foreground">{cat.label}</span>
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

                {/* Rate limit info */}
                {!rateLimitLoading && (
                  <div className={`flex items-center justify-between text-xs px-1 ${
                    !rateLimitStatus.canSubmit ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    <span>{rateLimitStatus.remainingToday}/{10} transazioni rimaste oggi</span>
                    {rateLimitStatus.cooldownSecondsLeft > 0 && (
                      <span className="font-medium">⏳ {rateLimitStatus.cooldownSecondsLeft}s</span>
                    )}
                  </div>
                )}

              </form>

              {/* Sticky Submit */}
              <div className="shrink-0 border-t border-border/30 bg-card p-6 pt-3">
                <Button
                  type="submit"
                  form="add-transaction-form"
                  disabled={createTransaction.isPending || !rateLimitStatus.canSubmit}
                  className="w-full h-12 rounded-xl gradient-hero text-primary-foreground font-semibold"
                >
                  {createTransaction.isPending ? (
                    "Salvataggio..."
                  ) : !rateLimitStatus.canSubmit ? (
                    rateLimitStatus.cooldownSecondsLeft > 0 ? `Attendi ${rateLimitStatus.cooldownSecondsLeft}s...` : "Limite giornaliero raggiunto"
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi {isIncome ? "Entrata" : "Spesa"}
                    </>
                  )}
                </Button>
              </div>
        </div>
      </ResponsiveModal>

      {/* Warning dialog for resetting challenge progress */}
      <AlertDialog open={showResetWarning} onOpenChange={setShowResetWarning}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Attenzione!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {activeFrugalChallenge && (
                <>
                  Hai già <strong>{activeFrugalChallenge.progress} {activeFrugalChallenge.progress === 1 ? "giorno" : "giorni"}</strong> di progresso nella sfida "{activeFrugalChallenge.challenge.name}".
                  <br /><br />
                  Aggiungere questa spesa non necessaria <strong>resetterà il tuo progresso a 0</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={submitTransaction}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
