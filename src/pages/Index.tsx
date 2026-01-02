import { motion } from "framer-motion";
import { CompanionAnimal } from "@/components/CompanionAnimal";
import { XPDisplay } from "@/components/XPDisplay";
import { BalanceCard } from "@/components/BalanceCard";
import { SavingsGoalCard } from "@/components/SavingsGoalCard";
import { QuickActions } from "@/components/QuickActions";
import { TransactionList } from "@/components/TransactionList";
import { AccessoriesBar } from "@/components/AccessoriesBar";
import { BadgesGrid } from "@/components/BadgesGrid";
import { BottomNav } from "@/components/BottomNav";
import { Bell, Settings } from "lucide-react";

// Mock data for demonstration
const mockTransactions = [
  { id: "1", description: "Supermercato", amount: 45.80, category: "Spesa", emoji: "🛒", date: "Oggi", isIncome: false },
  { id: "2", description: "Stipendio", amount: 1850, category: "Lavoro", emoji: "💼", date: "1 Gen", isIncome: true },
  { id: "3", description: "Netflix", amount: 12.99, category: "Abbonamenti", emoji: "📺", date: "31 Dic", isIncome: false },
  { id: "4", description: "Caffè", amount: 3.50, category: "Food", emoji: "☕", date: "31 Dic", isIncome: false },
];

const mockAccessories = [
  { id: "1", emoji: "🎀", name: "Fiocco", bxpRequired: 0, isUnlocked: true },
  { id: "2", emoji: "🎩", name: "Cappello", bxpRequired: 100, isUnlocked: true },
  { id: "3", emoji: "👑", name: "Corona", bxpRequired: 500, isUnlocked: false },
  { id: "4", emoji: "🌸", name: "Fiore", bxpRequired: 200, isUnlocked: false },
  { id: "5", emoji: "🧣", name: "Sciarpa", bxpRequired: 300, isUnlocked: false },
  { id: "6", emoji: "🎭", name: "Maschera", bxpRequired: 1000, isUnlocked: false },
];

const mockBadges = [
  { id: "1", emoji: "🌟", name: "Prima Spesa", description: "Hai tracciato la tua prima spesa", isEarned: true, earnedDate: "15 Dic" },
  { id: "2", emoji: "🔥", name: "7 Giorni", description: "Una settimana di tracciamento", isEarned: true, earnedDate: "22 Dic" },
  { id: "3", emoji: "💎", name: "Risparmiatore", description: "Hai raggiunto il primo obiettivo", isEarned: true, earnedDate: "28 Dic" },
  { id: "4", emoji: "🚀", name: "Super Saver", description: "Risparmia €500 in un mese", isEarned: false },
  { id: "5", emoji: "🏅", name: "Maestro", description: "Raggiungi il livello 5", isEarned: false },
  { id: "6", emoji: "👻", name: "Fantasma", description: "0 spese non necessarie per un mese", isEarned: false },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-xl font-bold text-foreground">Ciao, Marco! 👋</h1>
            <p className="text-xs text-muted-foreground">Gennaio 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Companion Animal - Hero Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl p-6 shadow-card border border-border relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-4 left-4 w-16 h-16 bg-primary/5 rounded-full" />
          <div className="absolute bottom-4 right-4 w-20 h-20 bg-accent/10 rounded-full" />
          <div className="absolute top-1/2 right-8 w-3 h-3 bg-reward rounded-full animate-sparkle" />
          <div className="absolute top-8 right-16 w-2 h-2 bg-secondary rounded-full animate-sparkle" style={{ animationDelay: "0.5s" }} />
          
          <CompanionAnimal
            level={4}
            mood="happy"
            fxp={340}
            maxFxp={500}
            name="Pippo"
          />
        </motion.section>

        {/* XP Display */}
        <XPDisplay fxp={1250} bxp={480} />

        {/* Balance Card */}
        <BalanceCard
          balance={3847.52}
          monthlyChange={245}
          lastSync="Oggi, 14:30"
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Savings Goal */}
        <SavingsGoalCard
          goalName="Vacanza Estiva"
          currentAmount={680}
          targetAmount={1500}
          deadline="Giugno 2026"
          emoji="🏖️"
        />

        {/* Accessories */}
        <AccessoriesBar accessories={mockAccessories} currentBxp={480} />

        {/* Badges */}
        <BadgesGrid badges={mockBadges} />

        {/* Recent Transactions */}
        <TransactionList transactions={mockTransactions} />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
