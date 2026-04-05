import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Crittografia dei dati",
      description: "Tutti i tuoi dati finanziari sono crittografati e protetti con i più alti standard di sicurezza.",
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Privacy garantita",
      description: "Non condividiamo mai i tuoi dati personali con terze parti senza il tuo esplicito consenso.",
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "Archiviazione sicura",
      description: "I tuoi dati sono archiviati su server sicuri con backup regolari e protezione avanzata.",
    },
    {
      icon: <Trash2 className="w-5 h-5" />,
      title: "Diritto all'oblio",
      description: "Puoi richiedere la cancellazione completa dei tuoi dati in qualsiasi momento.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/settings")} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Privacy e Sicurezza 🔒</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">La tua sicurezza</h2>
              <p className="text-sm text-muted-foreground">è la nostra priorità</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            GemSaver utilizza le migliori pratiche di sicurezza per proteggere i tuoi dati finanziari e personali.
          </p>
        </motion.div>

        {/* Security Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary shrink-0">
                {section.icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground"
        >
          Ultimo aggiornamento: Gennaio 2026
        </motion.p>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
};

export default Privacy;
