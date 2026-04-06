import { ResponsiveModal } from "./ResponsiveModal";
import { motion } from "framer-motion";
import { X, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTransactions } from "@/hooks/useUserData";
import { startOfMonth, startOfWeek, isWithinInterval, subMonths } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const categoryColors: Record<string, string> = {
  food: "hsl(24, 95%, 53%)",
  transport: "hsl(217, 91%, 60%)",
  entertainment: "hsl(280, 87%, 65%)",
  shopping: "hsl(340, 82%, 52%)",
  bills: "hsl(142, 71%, 45%)",
  health: "hsl(0, 84%, 60%)",
  education: "hsl(47, 100%, 50%)",
  savings: "hsl(173, 80%, 40%)",
  income: "hsl(142, 76%, 36%)",
  other: "hsl(220, 9%, 46%)",
};

export const BalanceModal = ({ isOpen, onClose }: BalanceModalProps) => {
  const { data: transactions } = useTransactions();

  // Calculate totals
  const totalIncome = transactions?.filter(t => t.is_income).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const totalExpenses = transactions?.filter(t => !t.is_income).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;

  // This month
  const monthStart = startOfMonth(new Date());
  const monthEnd = new Date();
  const monthlyIncome = transactions?.filter(t => 
    t.is_income && isWithinInterval(new Date(t.transaction_date), { start: monthStart, end: monthEnd })
  ).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const monthlyExpenses = transactions?.filter(t => 
    !t.is_income && isWithinInterval(new Date(t.transaction_date), { start: monthStart, end: monthEnd })
  ).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // This week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = new Date();
  const weeklyIncome = transactions?.filter(t => 
    t.is_income && isWithinInterval(new Date(t.transaction_date), { start: weekStart, end: weekEnd })
  ).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const weeklyExpenses = transactions?.filter(t => 
    !t.is_income && isWithinInterval(new Date(t.transaction_date), { start: weekStart, end: weekEnd })
  ).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const weeklyBalance = weeklyIncome - weeklyExpenses;

  // Compare with last month
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = subMonths(monthStart, 0);
  const lastMonthExpenses = transactions?.filter(t => 
    !t.is_income && isWithinInterval(new Date(t.transaction_date), { start: lastMonthStart, end: lastMonthEnd })
  ).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  
  const expenseChange = lastMonthExpenses > 0 
    ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(0)
    : 0;

  // Calculate expenses by category for pie chart
  const expensesByCategory = transactions
    ?.filter(t => !t.is_income)
    .reduce((acc, t) => {
      const category = t.category || "other";
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>) || {};

  const pieData = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({
      name: categoryLabels[category] || category,
      value: amount,
      color: categoryColors[category] || categoryColors.other,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const stats = [
    {
      label: "Questa settimana",
      income: weeklyIncome,
      expenses: weeklyExpenses,
      balance: weeklyBalance,
    },
    {
      label: "Questo mese",
      income: monthlyIncome,
      expenses: monthlyExpenses,
      balance: monthlyBalance,
    },
    {
      label: "Totale",
      income: totalIncome,
      expenses: totalExpenses,
      balance: balance,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            €{data.value.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="max-w-lg mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Il tuo Saldo</h2>
                    <p className="text-sm text-muted-foreground">Riepilogo finanziario</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Balance */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-primary/10 via-card to-accent/10 rounded-2xl p-6 border border-border mb-6 text-center"
              >
                <p className="text-sm text-muted-foreground mb-1">Saldo Totale</p>
                <p className={`text-4xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
                  €{balance.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </p>
                
                {Number(expenseChange) !== 0 && (
                  <div className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                    Number(expenseChange) > 0 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-primary/10 text-primary"
                  }`}>
                    {Number(expenseChange) > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(Number(expenseChange))}% spese vs mese scorso
                  </div>
                )}
              </motion.div>

              {/* Pie Chart - Expenses by Category */}
              {pieData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-muted/50 rounded-xl p-4 border border-border mb-6"
                >
                  <h3 className="font-medium text-foreground mb-3 text-center">Spese per Categoria</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          formatter={(value) => (
                            <span className="text-xs text-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* Stats Cards */}
              <div className="space-y-3">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="bg-muted/50 rounded-xl p-4 border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-foreground">{stat.label}</span>
                      <span className={`font-bold ${stat.balance >= 0 ? "text-primary" : "text-destructive"}`}>
                        €{stat.balance.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Entrate</p>
                          <p className="font-semibold text-foreground text-sm">
                            €{stat.income.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Spese</p>
                          <p className="font-semibold text-foreground text-sm">
                            €{stat.expenses.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tip */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-sm text-muted-foreground mt-6"
              >
                💡 Registra le tue transazioni per avere statistiche più accurate!
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
