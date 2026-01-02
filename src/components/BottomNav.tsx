import { motion } from "framer-motion";
import { Home, PieChart, Trophy, User } from "lucide-react";
import { useState } from "react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, isActive, onClick }: NavItemProps) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`
      flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative
      ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
    `}
  >
    {isActive && (
      <motion.div
        layoutId="navIndicator"
        className="absolute -top-1 w-8 h-1 gradient-hero rounded-full"
      />
    )}
    <motion.div
      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
    >
      {icon}
    </motion.div>
    <span className="text-xs font-medium">{label}</span>
  </motion.button>
);

export const BottomNav = () => {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
    { id: "stats", icon: <PieChart className="w-5 h-5" />, label: "Report" },
    { id: "ranks", icon: <Trophy className="w-5 h-5" />, label: "Classifica" },
    { id: "profile", icon: <User className="w-5 h-5" />, label: "Profilo" },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border px-4 pb-safe"
    >
      <div className="flex justify-around items-center py-2 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </div>
    </motion.nav>
  );
};
