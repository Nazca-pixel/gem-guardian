import { motion } from "framer-motion";
import { useActiveTier, TIER_CONFIG } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

interface TierBadgeProps {
  size?: "sm" | "md";
  clickable?: boolean;
}

export const TierBadge = ({ size = "sm", clickable = true }: TierBadgeProps) => {
  const tier = useActiveTier();
  const config = TIER_CONFIG[tier];
  const navigate = useNavigate();

  const sizeClasses = size === "sm"
    ? "px-2.5 py-1 text-[11px] gap-1"
    : "px-3 py-1.5 text-xs gap-1.5";

  const colorMap: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    starter: "bg-info/15 text-info border border-info/20",
    pro: "bg-primary/15 text-primary border border-primary/20",
    elite: "bg-reward/15 text-reward border border-reward/20",
  };

  return (
    <motion.button
      whileHover={clickable ? { scale: 1.05 } : undefined}
      whileTap={clickable ? { scale: 0.95 } : undefined}
      onClick={clickable ? () => navigate("/premium") : undefined}
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses} ${colorMap[tier]}`}
    >
      <span>{config.emoji}</span>
      <span>{config.name}</span>
    </motion.button>
  );
};
