import { motion } from "framer-motion";
import { Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveTier } from "@/hooks/useSubscription";

export const PremiumBanner = () => {
  const tier = useActiveTier();
  const navigate = useNavigate();

  if (tier !== "free") return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/premium")}
      className="w-full rounded-2xl p-4 border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-reward/10 flex items-center gap-4 text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Crown className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm">Passa a Premium ✨</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sblocca bonus BXP, mostri esclusivi e molto altro!
        </p>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </motion.button>
  );
};
