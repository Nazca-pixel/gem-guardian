import { motion } from "framer-motion";
import { Coins, Target, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTierLimits } from "@/hooks/useTierLimits";

interface XPDisplayProps {
  fxp: number;
  bxp: number;
}

// Daily caps mirror the backend (process_companion_xp). Shown as informational
// helper text only — no client-side enforcement.
const DAILY_FXP_CAP = 1500;
const DAILY_BXP_CAP = 600;

export const XPDisplay = ({ fxp, bxp }: XPDisplayProps) => {
  const { bxpMultiplier } = useTierLimits();
  const blendedScore = Math.round(fxp * 0.7 + bxp * 0.3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Progressi XP"
      className="space-y-2"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">I tuoi progressi</h2>
        <Popover>
          <PopoverTrigger
            aria-label="Cosa significano FXP, BXP e Score?"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full px-2 py-1 -mr-1 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Come funziona</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 text-sm">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Coins className="w-4 h-4 text-fxp" /> FXP — Financial XP
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cresce quando risparmi, raggiungi obiettivi o aumenti il patrimonio. Misura la salute
                  finanziaria.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-bxp" /> BXP — Behavioral XP
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Premia le buone abitudini: check-in, sfide, registrazione costante delle spese.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">🏆 Score</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Punteggio combinato (70% FXP + 30% BXP) usato per la classifica.
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Per evitare farming, ogni giorno puoi guadagnare fino a{" "}
                  <span className="font-semibold text-foreground">{DAILY_FXP_CAP.toLocaleString()} FXP</span>
                  {" "}e{" "}
                  <span className="font-semibold text-foreground">{DAILY_BXP_CAP.toLocaleString()} BXP</span>.
                  Le tue azioni vengono salvate comunque — il limite riparte a mezzanotte (ora italiana).
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Financial XP */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          aria-label={`FXP: ${fxp.toLocaleString()}`}
          className="bg-card rounded-2xl p-4 shadow-card border border-fxp/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-fxp/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-fxp" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">FXP</span>
          </div>
          <p className="text-2xl font-bold text-fxp tabular-nums">{fxp.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Salute finanziaria</p>
        </motion.div>

        {/* Behavioral XP */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          aria-label={`BXP: ${bxp.toLocaleString()}`}
          className="bg-card rounded-2xl p-4 shadow-card border border-bxp/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-bxp/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-bxp" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">BXP</span>
          </div>
          <p className="text-2xl font-bold text-bxp tabular-nums">{bxp.toLocaleString()}</p>
          {bxpMultiplier > 1 ? (
            <span className="text-[10px] font-bold text-primary">x{bxpMultiplier} bonus attivo</span>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-1">Abitudini</p>
          )}
        </motion.div>

        {/* Blended Score */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          aria-label={`Score: ${blendedScore.toLocaleString()}`}
          className="bg-gradient-to-br from-fxp/10 to-bxp/10 rounded-2xl p-4 shadow-card border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
              <span className="text-sm">🏆</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Score</span>
          </div>
          <p className="text-2xl font-bold text-gradient tabular-nums">{blendedScore.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Classifica</p>
        </motion.div>
      </div>
    </motion.section>
  );
};
