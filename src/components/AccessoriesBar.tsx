import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Accessory {
  id: string;
  emoji: string;
  name: string;
  description?: string;
  bxpRequired: number;
  isUnlocked: boolean;
  isEquipped?: boolean;
}

interface AccessoriesBarProps {
  accessories: Accessory[];
  currentBxp: number;
  onEquipChange?: () => void;
}

export const AccessoriesBar = ({ accessories, currentBxp, onEquipChange }: AccessoriesBarProps) => {
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAccessoryClick = (accessory: Accessory) => {
    if (accessory.isUnlocked) {
      setSelectedAccessory(accessory);
    }
  };

  const handleEquip = async (accessory: Accessory) => {
    if (!user) return;

    try {
      // First, unequip all other accessories
      await supabase
        .from("user_accessories")
        .update({ is_equipped: false })
        .eq("user_id", user.id);

      // Then equip the selected one (only if not already equipped, otherwise just unequip all)
      if (!accessory.isEquipped) {
        await supabase
          .from("user_accessories")
          .update({ is_equipped: true })
          .eq("user_id", user.id)
          .eq("accessory_id", accessory.id);
      }

      queryClient.invalidateQueries({ queryKey: ["user_accessories"] });
      setSelectedAccessory(null);
      onEquipChange?.();
      
      toast({
        title: accessory.isEquipped ? "Accessorio rimosso!" : `${accessory.emoji} ${accessory.name} equipaggiato!`,
      });
    } catch (error) {
      console.error("Error equipping accessory:", error);
      toast({
        title: "Errore",
        description: "Impossibile equipaggiare l'accessorio",
        variant: "destructive",
      });
    }
  };

  const equippedAccessory = accessories.find(a => a.isEquipped);

  return (
    <>
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
          <div className="flex items-center gap-2">
            {equippedAccessory && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                {equippedAccessory.emoji}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {accessories.filter(a => a.isUnlocked).length}/{accessories.length}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {accessories.map((accessory, index) => (
            <motion.div
              key={accessory.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={accessory.isUnlocked ? { scale: 0.9 } : {}}
              onClick={() => handleAccessoryClick(accessory)}
              className={`
                relative flex-shrink-0 w-14 h-14 rounded-xl
                flex items-center justify-center
                border-2 transition-all cursor-pointer
                ${accessory.isEquipped 
                  ? "bg-primary/20 border-primary ring-2 ring-primary/30" 
                  : accessory.isUnlocked 
                    ? "bg-muted border-primary/30 hover:border-primary hover:bg-muted/80" 
                    : "bg-muted/50 border-border cursor-not-allowed"
                }
              `}
            >
              {accessory.isUnlocked ? (
                <>
                  <span className="text-2xl">{accessory.emoji}</span>
                  {accessory.isEquipped && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </motion.div>
                  )}
                </>
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

        {/* Progress to next accessory */}
        {accessories.some(a => !a.isUnlocked) && (
          <div className="mt-3 pt-3 border-t border-border">
            {(() => {
              const nextAccessory = accessories.find(a => !a.isUnlocked && a.bxpRequired > currentBxp);
              if (!nextAccessory) return null;
              const progress = Math.min((currentBxp / nextAccessory.bxpRequired) * 100, 100);
              return (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Prossimo: {nextAccessory.emoji} {nextAccessory.name}
                    </span>
                    <span>{currentBxp}/{nextAccessory.bxpRequired} BXP</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-bxp to-reward rounded-full"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </motion.div>

      {/* Accessory Detail Modal */}
      <AnimatePresence>
        {selectedAccessory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedAccessory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{selectedAccessory.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedAccessory.name}</h3>
                    <p className="text-xs text-bxp font-medium">
                      Sbloccato a {selectedAccessory.bxpRequired} BXP
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAccessory(null)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {selectedAccessory.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedAccessory.description}
                </p>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEquip(selectedAccessory)}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-semibold text-sm
                    flex items-center justify-center gap-2 transition-all
                    ${selectedAccessory.isEquipped
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }
                  `}
                >
                  {selectedAccessory.isEquipped ? (
                    <>
                      <X className="w-4 h-4" />
                      Rimuovi
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Equipaggia
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
