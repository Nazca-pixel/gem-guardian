import { motion } from "framer-motion";
import { Plus, Wallet, PiggyBank, TrendingUp } from "lucide-react";

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

export const QuickActions = () => {
  const actions = [
    {
      icon: <Plus className="w-5 h-5 text-primary-foreground" />,
      label: "Spesa",
      color: "gradient-hero",
    },
    {
      icon: <Wallet className="w-5 h-5 text-secondary-foreground" />,
      label: "Saldo",
      color: "bg-secondary",
    },
    {
      icon: <PiggyBank className="w-5 h-5 text-reward-foreground" />,
      label: "Risparmia",
      color: "gradient-reward",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-info-foreground" />,
      label: "Report",
      color: "bg-info",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-4 gap-3"
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * index }}
        >
          <QuickAction {...action} />
        </motion.div>
      ))}
    </motion.div>
  );
};
