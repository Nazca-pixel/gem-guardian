import { useState } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useProfile, useCompanion } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, User, Bell, Moon, Shield, HelpCircle, ChevronRight, Save, Check } from "lucide-react";
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

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [companionName, setCompanionName] = useState(companion?.name || "Pippo");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update state when data loads
  useState(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    if (companion?.name) setCompanionName(companion.name);
  });

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

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: <User className="w-5 h-5" />,
          label: "Email",
          value: user?.email || "",
          type: "info" as const,
        },
      ],
    },
    {
      title: "Preferenze",
      items: [
        {
          icon: <Bell className="w-5 h-5" />,
          label: "Notifiche",
          value: notifications,
          type: "switch" as const,
          onChange: setNotifications,
        },
        {
          icon: <Moon className="w-5 h-5" />,
          label: "Tema scuro",
          value: darkMode,
          type: "switch" as const,
          onChange: setDarkMode,
        },
      ],
    },
    {
      title: "Informazioni",
      items: [
        {
          icon: <Shield className="w-5 h-5" />,
          label: "Privacy e sicurezza",
          type: "link" as const,
        },
        {
          icon: <HelpCircle className="w-5 h-5" />,
          label: "Aiuto e supporto",
          type: "link" as const,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
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

        {/* Settings Sections */}
        {settingsSections.map((section, sIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + sIndex * 0.05 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">{section.title}</h3>
            </div>
            
            {section.items.map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center justify-between p-4 ${
                  index < section.items.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{item.icon}</div>
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                
                {item.type === "switch" && (
                  <Switch
                    checked={item.value as boolean}
                    onCheckedChange={item.onChange}
                  />
                )}
                
                {item.type === "info" && (
                  <span className="text-sm text-muted-foreground">{item.value as string}</span>
                )}
                
                {item.type === "link" && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </motion.div>
        ))}

        {/* App Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
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
