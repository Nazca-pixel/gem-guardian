import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

interface BalanceCardProps {
  balance: number;
  monthlyChange: number;
  lastSync: string;
}

export const BalanceCard = ({ balance, monthlyChange, lastSync }: BalanceCardProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const isPositiveChange = monthlyChange >= 0;
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-hero rounded-3xl p-6 shadow-float relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-primary-foreground/80 text-sm font-medium">Saldo Totale</p>
          <button
            onClick={() => setIsVisible(!isVisible)}
            aria-label={isVisible ? "Nascondi saldo" : "Mostra saldo"}
            aria-pressed={!isVisible}
            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        <motion.div
          key={isVisible ? "visible" : "hidden"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2
            className={`text-4xl font-bold mb-1 tabular-nums ${
              balance < 0 ? "text-red-300" : "text-emerald-200"
            }`}
            aria-label={`Saldo totale ${isVisible ? formatCurrency(balance) : "nascosto"}`}
          >
            {isVisible ? formatCurrency(balance) : "€••••••"}
          </h2>
        </motion.div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                isPositiveChange ? "bg-white/20" : "bg-destructive/30"
              }`}
            >
              <TrendIcon className="w-3 h-3 text-primary-foreground" aria-hidden />
              <span className="text-xs font-medium text-primary-foreground tabular-nums">
                {formatSignedCurrency(monthlyChange)}
              </span>
            </div>
            <span className="text-primary-foreground/60 text-xs">questo mese</span>
          </div>
          <p className="text-primary-foreground/60 text-xs">Aggiornato: {lastSync}</p>
        </div>
      </div>
    </motion.div>
  );
};
