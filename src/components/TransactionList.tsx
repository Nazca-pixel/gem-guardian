import { motion } from "framer-motion";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  emoji: string;
  date: string;
  isIncome: boolean;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <span>📋</span>
          Ultime Transazioni
        </h3>
      </div>
      
      <div className="divide-y divide-border">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                {transaction.emoji}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {transaction.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.category} • {transaction.date}
                </p>
              </div>
            </div>
            <span
              className={`font-bold ${
                transaction.isIncome ? "text-primary" : "text-foreground"
              }`}
            >
              {transaction.isIncome ? "+" : "-"}€{Math.abs(transaction.amount).toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
