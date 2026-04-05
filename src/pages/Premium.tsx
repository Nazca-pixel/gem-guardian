import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import {
  TIER_CONFIG,
  SubscriptionTier,
  useActiveTier,
  useCheckout,
} from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const tierOrder: SubscriptionTier[] = ["free", "starter", "pro", "elite"];

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Sparkles className="w-5 h-5" />,
  starter: <Zap className="w-5 h-5" />,
  pro: <Crown className="w-5 h-5" />,
  elite: <Crown className="w-6 h-6" />,
};

export default function Premium() {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);
  const [confirmTier, setConfirmTier] = useState<SubscriptionTier | null>(null);
  const activeTier = useActiveTier();
  const checkout = useCheckout();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!confirmTier) return;
    try {
      await checkout.mutateAsync({ tier: confirmTier, isAnnual });
      toast({
        title: `${TIER_CONFIG[confirmTier].emoji} Piano ${TIER_CONFIG[confirmTier].name} attivato!`,
        description: isAnnual ? "Abbonamento annuale attivo" : "Abbonamento mensile attivo",
      });
      setConfirmTier(null);
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile completare l'acquisto",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Piani Premium</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <span className="text-4xl">👑</span>
          <h2 className="text-2xl font-extrabold text-foreground">
            Potenzia la tua esperienza
          </h2>
          <p className="text-muted-foreground text-sm">
            Sblocca funzionalità esclusive e fai crescere il tuo compagno più velocemente
          </p>
        </motion.div>

        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              !isAnnual ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Mensile
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
              isAnnual ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Annuale
            <span className="absolute -top-2 -right-2 bg-reward text-reward-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              -30%
            </span>
          </button>
        </div>

        {/* Tier Cards */}
        <div className="space-y-4">
          {tierOrder.map((tierKey, i) => {
            const tier = TIER_CONFIG[tierKey];
            const isCurrent = activeTier === tierKey;
            const price = isAnnual ? tier.annualPrice : tier.price;
            const isHighlighted = tier.highlighted;

            return (
              <motion.div
                key={tierKey}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border-2 p-5 transition-all ${
                  isHighlighted
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : isCurrent
                    ? "border-primary/50 bg-card"
                    : "border-border bg-card"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Più popolare
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tierKey === "free" ? "bg-muted text-muted-foreground" :
                      tierKey === "starter" ? "bg-info/20 text-info-foreground" :
                      tierKey === "pro" ? "bg-primary/20 text-primary" :
                      "bg-reward/20 text-reward-foreground"
                    }`}>
                      {tierIcons[tierKey]}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">
                        {tier.emoji} {tier.name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        {price === 0 ? (
                          <span className="text-muted-foreground text-sm">Gratuito</span>
                        ) : (
                          <>
                            <span className="text-2xl font-extrabold text-foreground">
                              €{price.toFixed(2)}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              /{isAnnual ? "anno" : "mese"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {tierKey === "free" ? (
                  isCurrent ? (
                    <div className="text-center text-sm text-muted-foreground font-medium py-2">
                      Piano attuale
                    </div>
                  ) : null
                ) : (
                  <Button
                    onClick={() => setConfirmTier(tierKey)}
                    disabled={isCurrent || checkout.isPending}
                    className={`w-full rounded-xl font-semibold ${
                      isHighlighted
                        ? "gradient-hero text-primary-foreground"
                        : isCurrent
                        ? "bg-muted text-muted-foreground"
                        : ""
                    }`}
                    variant={isHighlighted ? "default" : isCurrent ? "ghost" : "outline"}
                  >
                    {isCurrent ? "Piano attuale" : `Passa a ${tier.name}`}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground px-4">
          I pagamenti saranno disponibili a breve tramite Stripe. Per ora il piano viene attivato direttamente.
        </p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmTier} onOpenChange={() => setConfirmTier(null)}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {confirmTier && TIER_CONFIG[confirmTier].emoji} Conferma piano{" "}
              {confirmTier && TIER_CONFIG[confirmTier].name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTier && (
                <>
                  Stai per attivare il piano <strong>{TIER_CONFIG[confirmTier].name}</strong>{" "}
                  {isAnnual ? "annuale" : "mensile"} a{" "}
                  <strong>
                    €{(isAnnual ? TIER_CONFIG[confirmTier].annualPrice : TIER_CONFIG[confirmTier].price).toFixed(2)}
                    /{isAnnual ? "anno" : "mese"}
                  </strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCheckout}
              className="flex-1 gradient-hero text-primary-foreground"
            >
              {checkout.isPending ? "Attivazione..." : "Conferma"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav activeTab="profile" />
    </div>
  );
}
