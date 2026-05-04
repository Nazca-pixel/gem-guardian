import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { FullTransactionList } from "@/components/FullTransactionList";
import { useAllTransactions } from "@/hooks/useUserData";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
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

type Period = "7G" | "1M" | "3M" | "Tutto";

const PERIOD_OPTIONS: { key: Period; label: string; title: string }[] = [
  { key: "7G",    label: "7G",   title: "Ultimi 7 giorni" },
  { key: "1M",    label: "1M",   title: "Ultimi 30 giorni" },
  { key: "3M",    label: "3M",   title: "Ultimi 3 mesi" },
  { key: "Tutto", label: "Tutto", title: "Storico completo" },
];

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
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1M");

  // --- Filter transactions by selected period ---
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const now = new Date();
    if (selectedPeriod === "7G") {
      const cutoff = subDays(now, 7);
      return transactions.filter(t => new Date(t.transaction_date) >= cutoff);
    }
    if (selectedPeriod === "1M") {
      const cutoff = subDays(now, 30);
      return transactions.filter(t => new Date(t.transaction_date) >= cutoff);
    }
    if (selectedPeriod === "3M") {
      const cutoff = subMonths(now, 3);
      return transactions.filter(t => new Date(t.transaction_date) >= cutoff);
    }
    return transactions; // Tutto
  }, [transactions, selectedPeriod]);

  const mappedTransactions = filteredTransactions.map((t) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    category: t.category,
    emoji: t.emoji || "💰",
    transaction_date: t.transaction_date,
    is_income: t.is_income,
  }));

  const expensesByCategory = filteredTransactions
    .filter((t) => !t.is_income)
    .reduce((acc, t) => {
      const cat = t.category;
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name: categoryLabels[name] || name, value }))
    .sort((a, b) => b.value - a.value);

  // --- Area chart data (adapts to period) ---
  const areaData = useMemo(() => {
    const now = new Date();

    if (selectedPeriod === "7G") {
      return Array.from({ length: 7 }, (_, i) => {
        const day = subDays(now, 6 - i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLabel = format(day, "d MMM", { locale: it });
        const dayExp = filteredTransactions.filter(t => !t.is_income && t.transaction_date === dayStr);
        const total = dayExp.reduce((s, t) => s + Number(t.amount), 0);
        const catTotals: Record<string, number> = {};
        dayExp.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount); });
        const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        return { label: dayLabel, uscite: total, topCategory };
      });
    }

    if (selectedPeriod === "1M") {
      return Array.from({ length: 30 }, (_, i) => {
        const day = subDays(now, 29 - i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLabel = format(day, "d MMM", { locale: it });
        const dayExp = filteredTransactions.filter(t => !t.is_income && t.transaction_date === dayStr);
        const total = dayExp.reduce((s, t) => s + Number(t.amount), 0);
        const catTotals: Record<string, number> = {};
        dayExp.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount); });
        const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        return { label: dayLabel, uscite: total, topCategory };
      });
    }

    if (selectedPeriod === "3M") {
      // Group by week — ~13 weeks
      return Array.from({ length: 13 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(now, 12 - i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const label = `Sett ${i + 1}`;
        const weekExp = filteredTransactions.filter(t => {
          const d = new Date(t.transaction_date);
          return !t.is_income && d >= weekStart && d <= weekEnd;
        });
        const total = weekExp.reduce((s, t) => s + Number(t.amount), 0);
        const catTotals: Record<string, number> = {};
        weekExp.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount); });
        const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        return { label, uscite: total, topCategory };
      });
    }

    // Tutto — group by month (last 12 months)
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = subMonths(now, 11 - i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, "MMM yy", { locale: it });
      const monthExp = filteredTransactions.filter(t => {
        const d = new Date(t.transaction_date);
        return !t.is_income && d >= start && d <= end;
      });
      const total = monthExp.reduce((s, t) => s + Number(t.amount), 0);
      const catTotals: Record<string, number> = {};
      monthExp.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount); });
      const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      return { label, uscite: total, topCategory };
    });
  }, [filteredTransactions, selectedPeriod]);

  // --- Bar chart (monthly income vs expenses) ---
  const monthlyData = useMemo(() => {
    const now = new Date();
    const monthCount = selectedPeriod === "7G" ? 1 : selectedPeriod === "1M" ? 1 : selectedPeriod === "3M" ? 3 : 12;
    return Array.from({ length: monthCount }, (_, i) => {
      const monthDate = subMonths(now, monthCount - 1 - i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const mt = filteredTransactions.filter(t => {
        const d = new Date(t.transaction_date);
        return d >= start && d <= end;
      });
      return {
        month: format(monthDate, "MMM", { locale: it }),
        entrate: mt.filter(t => t.is_income).reduce((a, t) => a + Number(t.amount), 0),
        uscite: mt.filter(t => !t.is_income).reduce((a, t) => a + Number(t.amount), 0),
      };
    });
  }, [filteredTransactions, selectedPeriod]);

  const totalIncome = filteredTransactions.filter(t => t.is_income).reduce((a, t) => a + Number(t.amount), 0);
  const totalExpenses = filteredTransactions.filter(t => !t.is_income).reduce((a, t) => a + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;

  const areaChartMinWidth = Math.max(areaData.length * 32, 400);
  const monthlyChartWidth = Math.max(monthlyData.length * 80, 280);
  const areaTickInterval = areaData.length > 15 ? Math.ceil(areaData.length / 7) : 1;

  const periodTitle = PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.title ?? "";
  const areaChartTitle =
    selectedPeriod === "7G" ? "Andamento Spese (7gg)" :
    selectedPeriod === "1M" ? "Andamento Spese (30gg)" :
    selectedPeriod === "3M" ? "Andamento Spese (3 mesi)" :
    "Andamento Spese (storico)";

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
          <Skeleton className="h-10 w-full rounded-full" />
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

        {/* Period filter */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center bg-card border border-border rounded-full p-1 gap-1"
        >
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key)}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                selectedPeriod === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* KPI cards */}
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

        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-3xl p-6 shadow-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">{areaChartTitle}</h2>
            <span className="text-xs text-muted-foreground">{periodTitle}</span>
          </div>
          <div className="overflow-x-auto -mx-2 px-2 scrollbar-thin">
            <div style={{ minWidth: areaChartMinWidth, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
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
                    interval={areaTickInterval}
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

        {/* Pie chart */}
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

        {/* Bar chart */}
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
