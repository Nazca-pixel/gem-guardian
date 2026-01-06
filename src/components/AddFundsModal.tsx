import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLevelUp, LevelUpResult } from "@/hooks/useLevelUp";

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: {
    id: string;
    name: string;
    emoji: string;
    current_amount: number;
    target_amount: number;
  };
  onLevelUp?: (result: LevelUpResult) => void;
}

export const AddFundsModal = ({ isOpen, onClose, goal, onLevelUp }: AddFundsModalProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { processLevelUp } = useLevelUp();

  const remaining = goal.target_amount - goal.current_amount;
  const progress = (goal.current_amount / goal.target_amount) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Importo non valido",
        description: "Inserisci un importo maggiore di 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const newAmount = goal.current_amount + parseFloat(amount);
      const isCompleted = newAmount >= goal.target_amount;

      const { error } = await supabase
        .from("savings_goals")
        .update({ 
          current_amount: newAmount,
          is_completed: isCompleted,
        })
        .eq("id", goal.id);

      if (error) throw error;

      // If goal completed, award FXP using the level-up system
      if (isCompleted && user) {
        const fxpReward = Math.round(goal.target_amount / 10); // 10% of goal as FXP
        
        const { data: companion } = await supabase
          .from("companion_animals")
          .select("fxp, level")
          .eq("user_id", user.id)
          .single();

        if (companion) {
          const levelUpResult = await processLevelUp(
            companion.level,
            companion.fxp,
            fxpReward
          );

          if (levelUpResult.levelsGained > 0 && onLevelUp) {
            onLevelUp(levelUpResult);
          } else {
            toast({
              title: "🎉 Obiettivo Raggiunto!",
              description: `Hai completato "${goal.name}"! +${fxpReward} FXP`,
            });
          }
        }
      } else {
        toast({
          title: "Fondi aggiunti! 💰",
          description: `€${amount} aggiunti a "${goal.name}"`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["savings_goals"] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });
      
      setAmount("");
      onClose();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere i fondi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6"
          >
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                    {goal.emoji}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{goal.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      €{goal.current_amount.toLocaleString()} / €{goal.target_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full gradient-hero rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Mancano €{remaining.toLocaleString()} al traguardo
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-foreground">Importo da aggiungere</Label>
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

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((qa) => (
                    <button
                      key={qa}
                      type="button"
                      onClick={() => setAmount(qa.toString())}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        amount === qa.toString()
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/50 hover:border-primary/50"
                      }`}
                    >
                      <span className="font-medium text-foreground">€{qa}</span>
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-hero text-primary-foreground font-semibold"
                >
                  {loading ? "Salvataggio..." : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi Fondi
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