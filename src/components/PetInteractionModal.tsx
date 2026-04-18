import { useState } from "react";
import { Heart, Sparkles, UtensilsCrossed, Star } from "lucide-react";
import { ResponsiveModal } from "./ResponsiveModal";
import { Button } from "@/components/ui/button";

interface PetInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  level: number;
  stageName: string;
  moodText: string;
  fxp: number;
  maxFxp: number;
  petEmoji?: string;
  onPetAction?: () => void;
}

export const PetInteractionModal = ({
  isOpen,
  onClose,
  petName,
  level,
  stageName,
  moodText,
  fxp,
  maxFxp,
  petEmoji = "🐣",
  onPetAction,
}: PetInteractionModalProps) => {
  const [feedback, setFeedback] = useState("Il tuo guardian ti sta osservando 👀");

  const actions = [
    {
      label: "Accarezza",
      icon: Heart,
      emoji: "💖",
      text: `${petName} si rilassa e si sente al sicuro!`,
    },
    {
      label: "Dai uno snack",
      icon: UtensilsCrossed,
      emoji: "🍓",
      text: `${petName} ha mangiato volentieri ed è più carico!`,
    },
    {
      label: "Incoraggia",
      icon: Sparkles,
      emoji: "✨",
      text: `${petName} è motivato a proteggere i tuoi risparmi!`,
    },
  ];

  const progress = Math.min((fxp / Math.max(maxFxp, 1)) * 100, 100);

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col">
        <div className="shrink-0 flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{petName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stageName} • Livello {level}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto overscroll-contain px-6 pb-5 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col items-center rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 text-center shadow-sm">
  <div className="text-7xl drop-shadow-sm">{petEmoji}</div>
  <p className="mt-3 text-sm font-medium text-foreground">{moodText}</p>
  <div className="mt-3 w-full rounded-2xl bg-background/70 px-4 py-3">
    <p className="text-sm text-muted-foreground">{feedback}</p>
  </div>
</div>
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso FXP</span>
              <span className="font-semibold text-foreground">
                {fxp}/{maxFxp}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <Button
                  key={action.label}
                  type="button"
                  variant="outline"
                  className="h-auto justify-start rounded-2xl px-4 py-4"
                  onClick={() => {
                    setFeedback(`${action.emoji} ${action.text}`);
                    onPetAction?.();
                  }}
                >
                  <span className="mr-3 text-2xl">{action.emoji}</span>

                  <span className="flex flex-col items-start">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </span>
                    <span className="mt-1 text-left text-xs text-muted-foreground">
                      Interazione rapida con il tuo guardian
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-primary/10 p-4 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 text-foreground">
              <Star className="h-4 w-4" />
              Prossimo upgrade
            </div>
            Puoi collegare queste azioni a mood, streak, frasi speciali o ricompense cosmetiche.
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};
