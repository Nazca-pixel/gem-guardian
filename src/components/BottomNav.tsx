import { motion } from "framer-motion";
import { Home, PieChart, User, BookOpen, Award, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AddTransactionModal } from "./AddTransactionModal";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, isActive, onClick }: NavItemProps) => (
  <motion.button
    whileTap={{ scale: 0.85 }}
    onClick={onClick}
    className={`
      flex flex-col items-center gap-0.5 p-2 min-h-[44px] min-w-[44px] rounded-xl transition-colors relative
      ${isActive ? "text-primary" : "text-muted-foreground"}
    `}
  >
    {isActive && (
      <motion.div
        layoutId="navIndicator"
        className="absolute -top-1 w-6 h-1 gradient-hero rounded-full"
      />
    )}
    <motion.div animate={isActive ? { scale: 1.15 } : { scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
      {icon}
    </motion.div>
    <span className="text-[10px] font-semibold leading-tight">{label}</span>
  </motion.button>
);

interface BottomNavProps {
  activeTab?: string;
  onStreakMilestone?: (data: { milestone: number; badgeName: string }) => void;
}

export const BottomNav = ({ activeTab = "home", onStreakMilestone }: BottomNavProps) => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);

  const leftItems = [
    { id: "home", icon: <Home className="w-5 h-5" />, label: "Home", path: "/" },
    { id: "bestiary", icon: <BookOpen className="w-5 h-5" />, label: "Bestiario", path: "/bestiary" },
  ];

  const rightItems = [
    { id: "badges", icon: <Award className="w-5 h-5" />, label: "Trofei", path: "/badges" },
    { id: "profile", icon: <User className="w-5 h-5" />, label: "Profilo", path: "/profile" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Glass bar */}
        <div className="mx-3 mb-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-card">
          <div className="flex items-center justify-around py-1.5 max-w-lg mx-auto relative">
            {/* Left nav items */}
            {leftItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeTab === item.id}
                onClick={() => navigate(item.path)}
              />
            ))}

            {/* FAB - center */}
            <div className="relative -mt-7">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowAddModal(true)}
                className="w-14 h-14 rounded-full gradient-hero shadow-float flex items-center justify-center border-4 border-background"
              >
                <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Right nav items */}
            {rightItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeTab === item.id}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>
      </motion.nav>

      {/* FAB Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStreakMilestone={onStreakMilestone}
      />
    </>
  );
};
