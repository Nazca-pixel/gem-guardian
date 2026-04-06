import { useState } from "react";
import { ResponsiveModal } from "./ResponsiveModal";
import { X, Target, Euro, Calendar, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateSavingsGoal, useSavingsGoals } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { useTierLimits } from "@/hooks/useTierLimits";
import { useNavigate } from "react-router-dom";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const goalEmojis = ["🎯", "🏖️", "🏠", "🚗", "💻", "📱", "✈️", "💍", "🎓", "🎁"];

export const AddGoalModal = ({ isOpen, onClose }: AddGoalModalProps) => {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  
  const createGoal = useCreateSavingsGoal();
  const { data: existingGoals } = useSavingsGoals();
  const { toast } = useToast();
  const { maxGoals, tier } = useTierLimits();
  const navigate = useNavigate();

  const goalCount = existingGoals?.length || 0;
  const atLimit = goalCount >= maxGoals;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !targetAmount) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci nome e importo obiettivo",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGoal.mutateAsync({
        name: name.trim(),
        emoji,
        target_amount: parseFloat(targetAmount),
        deadline: deadline || undefined,
      });

      toast({
        title: "Obiettivo creato! 🎯",
        description: `${name} - €${targetAmount}`,
      });

      // Reset form
      setName("");
      setTargetAmount("");
      setDeadline("");
      setEmoji("🎯");
      onClose();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile creare l'obiettivo",
        variant: "destructive",
      });
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose}>
      <div className="max-w-lg mx-auto p-6 overflow-y-auto max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Nuovo Obiettivo
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Emoji picker */}
                <div>
                  <Label className="text-foreground mb-2 block">Icona</Label>
                  <div className="flex gap-2 flex-wrap">
                    {goalEmojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-12 h-12 rounded-xl text-2xl border-2 transition-all ${
                          emoji === e
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/50"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <Label className="text-foreground">Nome obiettivo</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Es. Vacanza estiva"
                    className="mt-1 rounded-xl"
                    maxLength={50}
                  />
                </div>

                {/* Target Amount */}
                <div>
                  <Label className="text-foreground">Importo obiettivo</Label>
                  <div className="relative mt-1">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="1000.00"
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <Label className="text-foreground">Scadenza (opzionale)</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>

                {/* Goal limit warning */}
                {atLimit && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20"
                  >
                    <Crown className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Limite raggiunto ({goalCount}/{maxGoals === Infinity ? "∞" : maxGoals})
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Passa a un piano superiore per più obiettivi
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => { onClose(); navigate("/premium"); }}
                      className="shrink-0"
                    >
                      Upgrade
                    </Button>
                  </motion.div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={createGoal.isPending || atLimit}
                  className="w-full h-12 rounded-xl gradient-reward text-reward-foreground font-semibold"
                >
                  {createGoal.isPending ? (
                    "Salvataggio..."
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Crea Obiettivo
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
