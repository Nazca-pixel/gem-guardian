import { useState } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useProfile, useCompanion, useTransactions, useSavingsGoals, useUserBadges } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, LogOut, Settings, Award, Target, Wallet, Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: companion } = useCompanion();
  const { data: transactions } = useTransactions();
  const { data: savingsGoals } = useSavingsGoals();
  const { data: userBadges } = useUserBadges();

  const stats = [
    {
      icon: <Wallet className="w-5 h-5" />,
      label: "Transazioni",
      value: transactions?.length || 0,
      color: "text-primary",
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: "Obiettivi",
      value: savingsGoals?.length || 0,
      color: "text-secondary",
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: "Badge",
      value: userBadges?.length || 0,
      color: "text-reward",
    },
  ];

  const menuItems = [
    { icon: <Settings className="w-5 h-5" />, label: "Impostazioni", action: () => {} },
    { icon: <Award className="w-5 h-5" />, label: "I tuoi Badge", action: () => navigate("/") },
    { icon: <Target className="w-5 h-5" />, label: "Obiettivi di Risparmio", action: () => navigate("/") },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
          <h1 className="text-xl font-bold text-foreground">Profilo 👤</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl p-6 shadow-card border border-border text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl mb-4 shadow-float">
            🐣
          </div>
          <h2 className="text-2xl font-bold text-foreground">{profile?.display_name || "Utente"}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Livello {companion?.level || 1}
            </span>
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
              {companion?.name || "Pippo"}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" />
            Iscritto da {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy", { locale: it }) : "poco"}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-card rounded-2xl p-4 border border-border text-center"
            >
              <div className={`mx-auto mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* XP Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border"
        >
          <h3 className="font-bold text-foreground mb-4">I tuoi Punti Esperienza</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">FXP (Obiettivi)</span>
                <span className="font-bold text-primary">{companion?.fxp || 0}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(((companion?.fxp || 0) / ((companion?.level || 1) * 100)) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">BXP (Comportamento)</span>
                <span className="font-bold text-secondary">{companion?.bxp || 0}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary rounded-full"
                  style={{ width: `${Math.min((companion?.bxp || 0) / 10, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                index < menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{item.icon}</div>
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full h-12 rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Esci dall'account
          </Button>
        </motion.div>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
};

export default Profile;