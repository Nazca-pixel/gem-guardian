import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransactionFilters, categories } from "./TransactionFilters";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronDown, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { EditTransactionModal } from "./EditTransactionModal";
import { SwipeableTransaction } from "./SwipeableTransaction";
import { useDeleteTransaction } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface FullTransactionListProps {
  transactions: Transaction[];
  showFilters?: boolean;
  maxItems?: number;
  title?: string;
  collapsible?: boolean;
}

const categoryLabels: Record<string, string> = {
  food: "Cibo",
  transport: "Trasporti",
  entertainment: "Svago",
  shopping: "Shopping",
  bills: "Bollette",
  health: "Salute",
  education: "Istruzione",
  savings: "Risparmi",
  income: "Entrate",
  other: "Altro",
};

export const FullTransactionList = ({
  transactions,
  showFilters = true,
  maxItems,
  title = "Transazioni",
  collapsible = false,
}: FullTransactionListProps) => {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const { toast } = useToast();
  const deleteTransaction = useDeleteTransaction();
  const isMobile = useIsMobile();

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by month
    if (selectedMonth !== "all") {
      const monthDate = parse(selectedMonth, "yyyy-MM", new Date());
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      filtered = filtered.filter((t) => {
        const date = new Date(t.transaction_date);
        return date >= start && date <= end;
      });
    }

    // Filter by category
    if (selectedCategory !== "all") {
      if (selectedCategory === "income") {
        filtered = filtered.filter((t) => t.is_income);
      } else {
        filtered = filtered.filter(
          (t) => t.category === selectedCategory && !t.is_income
        );
      }
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    );

    // Apply max items limit
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [transactions, selectedMonth, selectedCategory, maxItems]);

  // Calculate summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.is_income)
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => !t.is_income)
      .reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach((t) => {
      const dateKey = format(new Date(t.transaction_date), "d MMMM yyyy", {
        locale: it,
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    return groups;
  }, [filteredTransactions]);

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction.mutateAsync(deletingTransaction.id);
      toast({
        title: "Transazione eliminata 🗑️",
        description: deletingTransaction.description,
      });
      setDeletingTransaction(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la transazione",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
      >
        {/* Header */}
        <div
          className={`p-4 border-b border-border ${
            collapsible ? "cursor-pointer hover:bg-muted/30" : ""
          }`}
          onClick={() => collapsible && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <span>📋</span>
              {title}
              {filteredTransactions.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredTransactions.length})
                </span>
              )}
            </h3>
            {collapsible && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Filters */}
              {showFilters && (
                <div className="p-4 border-b border-border bg-muted/30">
                  <TransactionFilters
                    selectedMonth={selectedMonth}
                    selectedCategory={selectedCategory}
                    onMonthChange={setSelectedMonth}
                    onCategoryChange={setSelectedCategory}
                  />

                  {/* Summary */}
                  {filteredTransactions.length > 0 && (
                    <div className="flex gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-primary">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">
                          +€{summary.income.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-secondary">
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-medium">
                          -€{summary.expenses.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`font-bold ml-auto ${
                          summary.balance >= 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        = €{summary.balance.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Groups */}
              <div className="max-h-96 overflow-y-auto">
                {Object.keys(groupedTransactions).length > 0 ? (
                  Object.entries(groupedTransactions).map(([date, items]) => (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="px-4 py-2 bg-muted/50 sticky top-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          {date}
                        </p>
                      </div>

                      {/* Transactions */}
                      <div className="divide-y divide-border">
                        {items.map((transaction, index) => {
                          const transactionContent = (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                                  {transaction.emoji}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate">
                                    {transaction.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {categoryLabels[transaction.category] ||
                                      transaction.category}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold shrink-0 ${
                                    transaction.is_income
                                      ? "text-primary"
                                      : "text-foreground"
                                  }`}
                                >
                                  {transaction.is_income ? "+" : "-"}€
                                  {Math.abs(transaction.amount).toLocaleString()}
                                </span>
                                
                                {/* Action Buttons - only show on desktop */}
                                {!isMobile && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTransaction(transaction);
                                      }}
                                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                      aria-label="Modifica"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingTransaction(transaction);
                                      }}
                                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                      aria-label="Elimina"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );

                          // Wrap with swipeable on mobile
                          if (isMobile) {
                            return (
                              <SwipeableTransaction
                                key={transaction.id}
                                transaction={transaction}
                                onEdit={() => setEditingTransaction(transaction)}
                                onDelete={() => setDeletingTransaction(transaction)}
                              >
                                {transactionContent}
                              </SwipeableTransaction>
                            );
                          }

                          return (
                            <div key={transaction.id}>
                              {transactionContent}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <span className="text-3xl">🔍</span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Nessuna transazione trovata
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit Modal */}
      <EditTransactionModal
        open={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Elimina transazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{deletingTransaction?.description}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
