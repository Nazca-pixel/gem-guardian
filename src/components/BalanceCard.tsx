import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";

interface BalanceCardProps {
  balance: number;
  monthlyChange: number;
  lastSync: string;
}

export const BalanceCard = ({ balance, monthlyChange, lastSync }: BalanceCardProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const isPositiveChange = monthlyChange >= 0;

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
            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        
        <motion.div
          key={isVisible ? "visible" : "hidden"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-4xl font-bold text-primary-foreground mb-1">
            {isVisible ? `€${balance.toLocaleString()}` : "€••••••"}
          </h2>
        </motion.div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              isPositiveChange ? "bg-white/20" : "bg-destructive/20"
            }`}>
              <TrendingUp className={`w-3 h-3 ${
                isPositiveChange ? "text-primary-foreground" : "text-destructive-foreground rotate-180"
              }`} />
              <span className={`text-xs font-medium ${
                isPositiveChange ? "text-primary-foreground" : "text-destructive-foreground"
              }`}>
                {isPositiveChange ? "+" : ""}€{monthlyChange.toLocaleString()}
              </span>
            </div>
            <span className="text-primary-foreground/60 text-xs">questo mese</span>
          </div>
          <p className="text-primary-foreground/60 text-xs">
            Aggiornato: {lastSync}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
