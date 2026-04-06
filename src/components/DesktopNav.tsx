import { useState } from "react";
import { Home, PieChart, BookOpen, Award, User, Crown, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TierBadge } from "./TierBadge";
import { AddTransactionModal } from "./AddTransactionModal";

const navItems = [
  { id: "home", icon: Home, label: "Home", path: "/" },
  { id: "reports", icon: PieChart, label: "Report", path: "/reports" },
  { id: "bestiary", icon: BookOpen, label: "Bestiario", path: "/bestiary" },
  { id: "badges", icon: Award, label: "Trofei", path: "/badges" },
  { id: "premium", icon: Crown, label: "Premium", path: "/premium" },
  { id: "profile", icon: User, label: "Profilo", path: "/profile" },
];

export const DesktopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-soft">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 py-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="font-bold text-lg text-foreground">Gem Guardian</span>
          </button>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}

            {/* Add Transaction Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="ml-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gradient-hero text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi</span>
            </motion.button>
          </div>

          <TierBadge size="md" />
        </div>
      </nav>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </>
  );
};
