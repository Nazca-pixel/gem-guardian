import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface Accessory {
  id: string;
  emoji: string;
  name: string;
  bxpRequired: number;
  isUnlocked: boolean;
}

interface AccessoriesBarProps {
  accessories: Accessory[];
  currentBxp: number;
}

export const AccessoriesBar = ({ accessories, currentBxp }: AccessoriesBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <span>🎒</span>
          Accessori
        </h3>
        <span className="text-xs text-muted-foreground">
          {accessories.filter(a => a.isUnlocked).length}/{accessories.length} sbloccati
        </span>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {accessories.map((accessory, index) => (
          <motion.div
            key={accessory.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative flex-shrink-0 w-14 h-14 rounded-xl
              flex items-center justify-center
              border-2 transition-all cursor-pointer
              ${accessory.isUnlocked 
                ? "bg-muted border-primary/30 hover:border-primary" 
                : "bg-muted/50 border-border"
              }
            `}
          >
            {accessory.isUnlocked ? (
              <span className="text-2xl">{accessory.emoji}</span>
            ) : (
              <>
                <span className="text-2xl opacity-30">{accessory.emoji}</span>
                <div className="absolute inset-0 bg-muted/80 rounded-xl flex flex-col items-center justify-center">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {accessory.bxpRequired}
                  </span>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
