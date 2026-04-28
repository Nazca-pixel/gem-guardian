import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { FullTransactionList } from "@/components/FullTransactionList";
import { useAllTransactions } from "@/hooks/useUserData";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--reward))",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
];

const categoryLabels: Record<string, string> = {
  food: "🍕 Cibo",
  transport: "🚗 Trasporti",
  entertainment: "🎬 Svago",
  shopping: "🛍️ Shopping",
  bills: "📄 Bollette",
  health: "💊 Salute",
  education: "📚 Istruzione",
  savings: "💰 Risparmi",
  income: "💵 Entrate",
  other: "📦 Altro",
};

interface ChartPayloadItem {
  color?: string;
  dataKey?: string;
  value?: number;
  payload?: {
    uscite?: number;
    topCategory?: string;
  };
}

interface DailyTooltipProps {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}

interface MonthlyTooltipProps {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}

const DailyTooltip = ({ active, payload, label }: DailyTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-secondary font-bold">€{data?.uscite?.toLocaleString() ?? 0}</p>
      {data?.topCategory && (
        <p className="text-xs text-muted-foreground mt-1">
          Top: {categoryLabels[data.topCategory] || data.topCategory}
        </p>
      )}
    </div>
  );
};

const MonthlyTooltip = ({ active, payload, label }: MonthlyTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg text-sm min-w-[130px]">
      <p className="font-semibold text-foreground mb-1 capitalize">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span className="text-muted-foreground">{p.dataKey === "entrate" ? "Entrate" : "Uscite"}</span>
          <span className="font-bold" style={{ color: p.color }}>€{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const Reports = () => {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useAllTransactions();

  const mappedTransactions = transactions?.map((t) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    category: t.category,
    emoji: t.emoji || "💰",
    transaction_date: t.transaction_date,
    is_income: t.is_income,
  })) || [];

  const expensesByCategory = transactions
    ?.filter((t) => !t.is_income)
    .reduce((acc, t) => {
      const cat = t.category;
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>) || {};

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name: categoryLabels[name] || name, value }))
    .sort((a, b) => b.value - a.value);

  const dailyData = useMemo(() => {
    const days: { label: string; uscite: number; topCategory: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, "yyyy-MM-dd");
      const dayLabel = format(day, "d MMM", { locale: it });
      const dayExpenses = transactions?.filter(
        (t) => !t.is_income && t.transaction_date === dayStr
      ) || [];
      const total = dayExpenses.reduce((s, t) => s + Number(t.amount), 0);
      const catTotals: Record<string, number> = {};
      dayExpenses.forEach((t) => {
        catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
      });
      const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      days.push({ label: dayLabel, uscite: total, topCategory });
    }
    return days;
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const mt = transactions?.filter((t) => {
        const d = new Date(t.transaction_date);
        return d >= start && d <= end;
      }) || [];
      data.push({
        month: format(monthDate, "MMM", { locale: it }),
        entrate: mt.filter((t) => t.is_income).reduce((a, t) => a + Number(t.amount), 0),
        uscite: mt.filter((t) => !t.is_income).reduce((a, t) => a + Number(t.amount), 0),
      });
    }
    return data;
  }, [transactions]);

  const totalIncome = transactions?.filter((t) => t.is_income).reduce((a, t) => a + Number(t.amount), 0) || 0;
  const totalExpenses = transactions?.filter((t) => !t.is_income).reduce((a, t) => a + Number(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;

  const dailyChartWidth = Math.max(dailyData.length * 32, 400);
  const monthlyChartWidth = Math.max(monthlyData.length * 64, 360);
  const dailyTickInterval = dailyData.length > 15 ? Math.ceil(dailyData.length / 7) : 4;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        </div>
        <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border text-center space-y-2">
                <Skeleton className="w-5 h-5 mx-auto rounded" />
                <Skeleton className="h-3 w-12 mx-auto rounded" />
                <Skeleton className="h-6 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>
          <div className="bg-card rounded-3xl p-6 border border-border space-y-4">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <div className="bg-card rounded-3xl p-6 border border-border space-y-4">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
        <BottomNav activeTab="stats" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Report 📊</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 border border-border text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Entrate</p>
            <p className="text-lg font-bold text-primary">€{totalIncome.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-4 border border-border text-center">
            <TrendingDown className="w-5 h-5 mx-auto text-secondary mb-1" />
            <p className="text-xs text-muted-foreground">Uscite</p>
            <p className="text-lg font-bold text-secondary">€{totalExpenses.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl p-4 border border-border text-center">
            <Wallet className="w-5 h-5 mx-auto text-accent mb-1" />
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>€{balance.toLocaleString()}</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-3xl p-6 shadow-card border border-border"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Andamento Spese (30gg)</h2>
          <div className="overflow-x-auto -mx-2 px-2 scrollbar-thin">
            <div style={{ minWidth: dailyChartWidth, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={dailyTickInterval}
                  />
                  <YAxis hide />
                  <Tooltip content={<DailyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="uscite"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2.5}
                    fill="url(#spendingGradient)"
                    dot={false}
                    activeDot={{ r: 5, stroke: "hsl(var(--secondary))", strokeWidth: 2, fill: "hsl(var(--card))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {pieData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl p-6 shadow-card border border-border"
          >
            <h2 className="text-lg font-bold text-foreground mb-4">Spese per Categoria</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`€${value.toLocaleString()}`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.slice(0, 6).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                  <span className="text-xs font-medium ml-auto">€{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl p-6 shadow-card border border-border"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Trend Mensile</h2>
          <div className="overflow-x-auto -mx-2 px-2 scrollbar-thin">
            <div style={{ minWidth: monthlyChartWidth, height: 192 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <defs>
                    <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<MonthlyTooltip />} />
                  <Bar dataKey="entrate" fill="url(#incomeBarGrad)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="uscite" fill="url(#expenseBarGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Entrate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-xs text-muted-foreground">Uscite</span>
            </div>
          </div>
        </motion.div>

        <FullTransactionList transactions={mappedTransactions} showFilters={true} title="Tutte le Transazioni" />

        {pieData.length === 0 && mappedTransactions.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl p-6 shadow-card border border-border text-center">
            <span className="text-4xl">📈</span>
            <h3 className="font-bold text-foreground mt-3">Nessun dato</h3>
            <p className="text-sm text-muted-foreground mt-1">Aggiungi delle transazioni per vedere i report!</p>
          </motion.div>
        )}
      </main>

      <BottomNav activeTab="stats" />
    </div>
  );
};

export default Reports;
