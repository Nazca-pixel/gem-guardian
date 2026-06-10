import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface TodaySummaryProps {
  transactions: Array<{
    amount: number;
    is_income: boolean;
    transaction_date: string;
  }>;
}

const isSameLocalDay = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

export const TodaySummary = ({ transactions }: TodaySummaryProps) => {
  const today = new Date();
  const todays = transactions.filter((t) => isSameLocalDay(t.transaction_date, today));
  const income = todays.filter((t) => t.is_income).reduce((s, t) => s + Number(t.amount), 0);
  const expense = todays.filter((t) => !t.is_income).reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expense;
  const count = todays.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/70 backdrop-blur-xl rounded-2xl p-4 shadow-card border border-border/60"
      aria-label="Riepilogo di oggi"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Oggi</p>
            <p className="text-[11px] text-muted-foreground">
              {count === 0
                ? "Nessun movimento"
                : count === 1
                  ? "1 movimento"
                  : `${count} movimenti`}
            </p>
          </div>
        </div>
        <div
          className={`text-sm font-bold ${
            net > 0 ? "text-primary" : net < 0 ? "text-destructive" : "text-muted-foreground"
          }`}
          aria-label="Saldo di oggi"
        >
          {net > 0 ? "+" : net < 0 ? "−" : ""}
          {formatCurrency(Math.abs(net))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ArrowUpRight className="w-3 h-3 text-primary" aria-hidden />
            Entrate
          </div>
          <p className="text-sm font-bold text-foreground mt-0.5">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="rounded-xl bg-destructive/5 border border-destructive/10 px-3 py-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ArrowDownLeft className="w-3 h-3 text-destructive" aria-hidden />
            Spese
          </div>
          <p className="text-sm font-bold text-foreground mt-0.5">
            {formatCurrency(expense)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
