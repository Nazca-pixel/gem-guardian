import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useProfile, useCompanion } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft, User, Bell, Moon, Shield, HelpCircle, ChevronRight, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: companion } = useCompanion();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isDark, setDarkMode } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [companionName, setCompanionName] = useState("");
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("notifications");
    return stored !== null ? stored === "true" : true;
  });
  const [saving, setSaving] = useState(false);

  // Update state when data loads
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    if (companion?.name) setCompanionName(companion.name);
  }, [profile, companion]);

  // Persist notifications preference
  const handleNotificationsChange = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem("notifications", String(enabled));
    
    if (enabled && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast({
            title: "Notifiche attivate! 🔔",
            description: "Riceverai promemoria per le tue attività",
          });
        } else if (permission === "denied") {
          setNotifications(false);
          localStorage.setItem("notifications", "false");
          toast({
            title: "Permesso negato",
            description: "Abilita le notifiche nelle impostazioni del browser",
            variant: "destructive",
          });
        }
      });
    } else if (!enabled) {
      toast({
        title: "Notifiche disattivate",
        description: "Non riceverai più promemoria",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || "Utente" })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update companion name
      const { error: companionError } = await supabase
        .from("companion_animals")
        .update({ name: companionName.trim() || "Pippo" })
        .eq("user_id", user.id);

      if (companionError) throw companionError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["companion"] });

      toast({
        title: "Salvato! ✅",
        description: "Le tue impostazioni sono state aggiornate",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/profile")} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Impostazioni ⚙️</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border space-y-4"
        >
          <h3 className="font-bold text-foreground">Il tuo profilo</h3>
          
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Nome visualizzato</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Il tuo nome"
                className="mt-1 rounded-xl"
                maxLength={50}
              />
            </div>
            
            <div>
              <Label className="text-muted-foreground">Nome del compagno</Label>
              <Input
                value={companionName}
                onChange={(e) => setCompanionName(e.target.value)}
                placeholder="Nome del tuo mostro"
                className="mt-1 rounded-xl"
                maxLength={50}
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full h-11 rounded-xl gradient-hero text-primary-foreground font-semibold"
          >
            {saving ? (
              "Salvataggio..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salva Modifiche
              </>
            )}
          </Button>
        </motion.div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Account</h3>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground"><User className="w-5 h-5" /></div>
              <span className="font-medium text-foreground">Email</span>
            </div>
            <span className="text-sm text-muted-foreground">{user?.email || ""}</span>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Preferenze</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground"><Bell className="w-5 h-5" /></div>
              <span className="font-medium text-foreground">Notifiche</span>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={handleNotificationsChange}
            />
          </div>
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground"><Moon className="w-5 h-5" /></div>
              <span className="font-medium text-foreground">Tema scuro</span>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={setDarkMode}
            />
          </div>
        </motion.div>

        {/* Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Informazioni</h3>
          </div>
          
          <button
            onClick={() => navigate("/privacy")}
            className="flex items-center justify-between p-4 border-b border-border w-full text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground"><Shield className="w-5 h-5" /></div>
              <span className="font-medium text-foreground">Privacy e sicurezza</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => navigate("/help")}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground"><HelpCircle className="w-5 h-5" /></div>
              <span className="font-medium text-foreground">Aiuto e supporto</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* App Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-xs text-muted-foreground"
        >
          GemSaver v1.0.0
        </motion.p>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
};

export default Settings;
