import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddTransactionModal } from "./AddTransactionModal";
import { AddGoalModal } from "./AddGoalModal";

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
      flex flex-col items-center gap-2 p-4
      bg-card rounded-2xl shadow-soft border border-border
      transition-all hover:shadow-card
    `}
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
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
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-4 gap-3"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <QuickAction
            icon={<Plus className="w-5 h-5 text-primary-foreground" />}
            label="Spesa"
            color="gradient-hero"
            onClick={() => setTransactionModalOpen(true)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <QuickAction
            icon={<Wallet className="w-5 h-5 text-secondary-foreground" />}
            label="Saldo"
            color="bg-secondary"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <QuickAction
            icon={<PiggyBank className="w-5 h-5 text-reward-foreground" />}
            label="Obiettivo"
            color="gradient-reward"
            onClick={() => setGoalModalOpen(true)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <QuickAction
            icon={<TrendingUp className="w-5 h-5 text-info-foreground" />}
            label="Report"
            color="bg-info"
            onClick={() => navigate("/reports")}
          />
        </motion.div>
      </motion.div>

      <AddTransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onStreakMilestone={onStreakMilestone}
      />
      <AddGoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
      />
    </>
  );
};
