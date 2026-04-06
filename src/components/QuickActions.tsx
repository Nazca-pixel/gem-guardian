import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet, PiggyBank, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddTransactionModal } from "./AddTransactionModal";
import { AddGoalModal } from "./AddGoalModal";
import { BalanceModal } from "./BalanceModal";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
}

const QuickAction = ({ icon, label, color, onClick }: QuickActionProps) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      flex flex-col items-center gap-2 p-3 min-h-[72px]
      bg-card rounded-2xl shadow-soft border border-border
      transition-all hover:shadow-card active:scale-95
    `}
  >
    <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center`}>
      {icon}
    </div>
    <span className="text-xs font-medium text-foreground">{label}</span>
  </motion.button>
);

interface StreakMilestone {
  milestone: number;
  badgeName: string;
}

interface QuickActionsProps {
  onStreakMilestone?: (data: StreakMilestone) => void;
}

export const QuickActions = ({ onStreakMilestone }: QuickActionsProps = {}) => {
  const navigate = useNavigate();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-5 gap-2"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <QuickAction
            icon={<ArrowDownLeft className="w-6 h-6 text-primary-foreground" />}
            label="Spesa"
            color="gradient-hero"
            onClick={() => setExpenseModalOpen(true)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <QuickAction
            icon={<ArrowUpRight className="w-6 h-6 text-white" />}
            label="Entrata"
            color="bg-primary"
            onClick={() => setIncomeModalOpen(true)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <QuickAction
            icon={<Wallet className="w-6 h-6 text-secondary-foreground" />}
            label="Saldo"
            color="bg-secondary"
            onClick={() => setBalanceModalOpen(true)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <QuickAction
            icon={<PiggyBank className="w-6 h-6 text-reward-foreground" />}
            label="Obiettivo"
            color="gradient-reward"
            onClick={() => setGoalModalOpen(true)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <QuickAction
            icon={<TrendingUp className="w-5 h-5 text-info-foreground" />}
            label="Report"
            color="bg-info"
            onClick={() => navigate("/reports")}
          />
        </motion.div>
      </motion.div>

      {/* Expense Modal */}
      <AddTransactionModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onStreakMilestone={onStreakMilestone}
        defaultCategory="other"
      />

      {/* Income Modal */}
      <AddTransactionModal
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        onStreakMilestone={onStreakMilestone}
        defaultCategory="income"
      />

      <AddGoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
      />

      <BalanceModal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
      />
    </>
  );
};
