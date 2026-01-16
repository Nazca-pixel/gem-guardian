import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpdateTransaction } from "@/hooks/useUserData";
import { Euro } from "lucide-react";
import { categories } from "./TransactionFilters";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  emoji: string;
  transaction_date: string;
  is_income: boolean;
  is_necessary?: boolean;
}

interface EditTransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal = ({
  open,
  onClose,
  transaction,
}: EditTransactionModalProps) => {
  const { toast } = useToast();
  const updateTransaction = useUpdateTransaction();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [isNecessary, setIsNecessary] = useState(true);
  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setIsIncome(transaction.is_income);
      setIsNecessary(transaction.is_necessary ?? true);
    }
  }, [transaction]);

  const selectedCategory = categories.find((c) => c.value === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transaction || !description.trim() || !amount) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci descrizione e importo",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        description: description.trim(),
        amount: parseFloat(amount),
        category: category as any,
        emoji: selectedCategory?.emoji || transaction.emoji,
        is_income: isIncome,
        is_necessary: isNecessary,
        transaction_date: transaction.transaction_date,
      });

      toast({
        title: "Transazione aggiornata! ✅",
        description: `${description} - €${amount}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la transazione",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            ✏️ Modifica Transazione
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setIsIncome(false)}
              className={`py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                !isIncome
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Spesa
            </button>
            <button
              type="button"
              onClick={() => setIsIncome(true)}
              className={`py-2 px-4 rounded-lg font-medium transition-all text-sm ${
                isIncome
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrata
            </button>
          </div>

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
            <div className="grid grid-cols-5 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-0.5 ${
                    category === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/50 hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-[10px] font-medium text-foreground leading-tight">
                    {cat.label}
                  </span>
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
                  className={`p-2.5 rounded-xl border-2 transition-all ${
                    isNecessary
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/50 hover:border-primary/50"
                  }`}
                >
                  <span className="text-base">✅</span>
                  <span className="text-xs font-medium text-foreground block mt-0.5">
                    Necessaria
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNecessary(false)}
                  className={`p-2.5 rounded-xl border-2 transition-all ${
                    !isNecessary
                      ? "border-secondary bg-secondary/10"
                      : "border-border bg-muted/50 hover:border-secondary/50"
                  }`}
                >
                  <span className="text-base">🎯</span>
                  <span className="text-xs font-medium text-foreground block mt-0.5">
                    Extra
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl font-bold"
            disabled={updateTransaction.isPending}
          >
            {updateTransaction.isPending ? "Salvataggio..." : "Salva Modifiche"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
