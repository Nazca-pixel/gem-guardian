import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Book, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Come guadagno XP?",
      answer: "Guadagni FXP (Financial XP) registrando transazioni e raggiungendo obiettivi di risparmio. Il BXP (Bonus XP) viene guadagnato con azioni speciali come streak e badge.",
    },
    {
      question: "Come funzionano gli streak?",
      answer: "Gli streak aumentano ogni giorno che registri almeno una transazione. Mantieni la tua streak per sbloccare badge speciali e bonus XP!",
    },
    {
      question: "Posso modificare una transazione?",
      answer: "Sì! Scorri la transazione verso destra per modificarla o verso sinistra per eliminarla.",
    },
    {
      question: "Come sblocco nuovi accessori?",
      answer: "Gli accessori si sbloccano automaticamente quando raggiungi determinate soglie di BXP. Controlla la barra accessori per vedere i prossimi sbloccabili!",
    },
  ];

  const contactOptions = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Chat supporto",
      description: "Risposta in 24h",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email",
      description: "support@gemsaver.app",
    },
    {
      icon: <Book className="w-5 h-5" />,
      label: "Documentazione",
      description: "Guide complete",
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
          <button onClick={() => navigate("/settings")} className="p-2 rounded-full bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Aiuto e Supporto ❓</h1>
        </div>
      </motion.header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-bold text-foreground">Come possiamo aiutarti?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trova risposte alle domande frequenti o contattaci direttamente
          </p>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Domande Frequenti</h3>
          </div>
          
          {faqs.map((faq, index) => (
            <details
              key={index}
              className={`group ${index < faqs.length - 1 ? "border-b border-border" : ""}`}
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground">
                {faq.answer}
              </div>
            </details>
          ))}
        </motion.div>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Contattaci</h3>
          </div>
          
          {contactOptions.map((option, index) => (
            <div
              key={option.label}
              className={`flex items-center justify-between p-4 ${
                index < contactOptions.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                  {option.icon}
                </div>
                <div>
                  <span className="font-medium text-foreground">{option.label}</span>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </motion.div>

        {/* Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground"
        >
          GemSaver v1.0.0
        </motion.p>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
};

export default Help;
