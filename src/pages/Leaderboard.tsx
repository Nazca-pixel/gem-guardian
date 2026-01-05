import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useCompanion, useProfile } from "@/hooks/useUserData";
import { ArrowLeft, Trophy, Crown, Medal, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Leaderboard = () => {
  const navigate = useNavigate();
  const { data: companion } = useCompanion();
  const { data: profile } = useProfile();

  // Calculate blended score
  const fxp = companion?.fxp || 0;
  const bxp = companion?.bxp || 0;
  const blendedScore = Math.round(fxp * 0.6 + bxp * 0.4);

  // Mock leaderboard data (in a real app, this would come from the backend)
  const leaderboard = [
    { rank: 1, name: "Marco", level: 15, blendedScore: 2450, emoji: "🐉" },
    { rank: 2, name: "Sofia", level: 12, blendedScore: 1980, emoji: "🦊" },
    { rank: 3, name: "Luca", level: 10, blendedScore: 1650, emoji: "🐱" },
    { rank: 4, name: profile?.display_name || "Tu", level: companion?.level || 1, blendedScore, emoji: "🐣", isCurrentUser: true },
    { rank: 5, name: "Giulia", level: 8, blendedScore: 1200, emoji: "🐰" },
    { rank: 6, name: "Alessandro", level: 7, blendedScore: 980, emoji: "🐻" },
    { rank: 7, name: "Chiara", level: 6, blendedScore: 750, emoji: "🦋" },
  ].sort((a, b) => b.blendedScore - a.blendedScore).map((user, index) => ({ ...user, rank: index + 1 }));

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-reward" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary";
    switch (rank) {
      case 1: return "bg-reward/10 border-reward/30";
      case 2: return "bg-gray-100 dark:bg-gray-800 border-gray-300";
      case 3: return "bg-amber-50 dark:bg-amber-900/20 border-amber-300";
      default: return "bg-card border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Classifica 🏆</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Your Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-6 border border-primary/30"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-card flex items-center justify-center text-4xl mb-3 shadow-card">
              🐣
            </div>
            <h2 className="text-xl font-bold text-foreground">{profile?.display_name || "Tu"}</h2>
            <p className="text-muted-foreground text-sm">Livello {companion?.level || 1}</p>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{fxp}</p>
                <p className="text-xs text-muted-foreground">FXP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{bxp}</p>
                <p className="text-xs text-muted-foreground">BXP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{blendedScore}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-reward" />
            Top Giocatori
          </h3>
          
          {leaderboard.map((user, index) => (
            <motion.div
              key={user.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${getRankBg(user.rank, user.isCurrentUser || false)}`}
            >
              <div className="w-10 flex justify-center">
                {getRankIcon(user.rank)}
              </div>
              
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                {user.emoji}
              </div>
              
              <div className="flex-1">
                <p className={`font-bold ${user.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                  {user.name} {user.isCurrentUser && "(Tu)"}
                </p>
                <p className="text-xs text-muted-foreground">Livello {user.level}</p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-reward" />
                  <span className="font-bold text-foreground">{user.blendedScore.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">punti</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 border border-border text-center"
        >
          <span className="text-3xl">🔜</span>
          <h4 className="font-bold text-foreground mt-2">Sfide con Amici</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Presto potrai aggiungere amici e sfidarli!
          </p>
        </motion.div>
      </main>

      <BottomNav activeTab="ranks" />
    </div>
  );
};

export default Leaderboard;