import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, "Il nome deve avere almeno 2 caratteri").max(50),
});

const resetSchema = z.object({
  email: z.string().email("Email non valida"),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
  confirmPassword: z.string().min(6, "La password deve avere almeno 6 caratteri"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type AuthMode = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const stored = localStorage.getItem("gemsaver_remember_me");
    return stored !== null ? stored === "true" : true;
  });
  
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  
  // Handle remember me persistence
  const handleRememberMeChange = useCallback((checked: boolean) => {
    setRememberMe(checked);
    localStorage.setItem("gemsaver_remember_me", String(checked));
    
    if (!checked) {
      // If user unchecks "remember me", we'll clear session on window close
      // This is handled by Supabase's persistSession setting
      localStorage.setItem("gemsaver_session_type", "session");
    } else {
      localStorage.setItem("gemsaver_session_type", "persistent");
    }
  }, []);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is coming from password reset email
  useEffect(() => {
    const handleRecovery = async () => {
      // Check URL hash for recovery tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      
      if (accessToken && type === "recovery") {
        // Set the session from the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });
        
        if (!error) {
          setMode("reset");
          setIsRecoverySession(true);
          // Clean up the URL
          window.history.replaceState(null, "", window.location.pathname + "?mode=reset");
        }
      } else if (searchParams.get("mode") === "reset") {
        // Check if we already have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setMode("reset");
          setIsRecoverySession(true);
        }
      }
    };

    handleRecovery();

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setIsRecoverySession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const validateForm = () => {
    try {
      if (mode === "login") {
        loginSchema.parse({ email, password });
      } else if (mode === "signup") {
        signupSchema.parse({ email, password, displayName });
      } else if (mode === "forgot") {
        resetSchema.parse({ email });
      } else if (mode === "reset") {
        newPasswordSchema.parse({ password, confirmPassword });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast({
              title: "Errore di accesso",
              description: "Email o password non corretti",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Errore",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Bentornato! 🎉",
            description: "Accesso effettuato con successo",
          });
          navigate("/");
        }
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Utente già registrato",
              description: "Questa email è già registrata. Prova ad accedere.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Errore",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Benvenuto! 🐣",
            description: "Account creato con successo! Il tuo compagno ti aspetta.",
          });
          navigate("/");
        }
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Errore",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email inviata! 📧",
            description: "Controlla la tua casella di posta per reimpostare la password.",
          });
          setMode("login");
        }
      } else if (mode === "reset") {
        const { error } = await updatePassword(password);
        if (error) {
          toast({
            title: "Errore",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password aggiornata! 🔐",
            description: "La tua nuova password è stata salvata.",
          });
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Bentornato! Il tuo compagno ti aspetta";
      case "signup": return "Inizia il tuo viaggio verso il risparmio";
      case "forgot": return "Recupera le tue credenziali";
      case "reset": return "Imposta una nuova password";
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case "login": return "Accedi";
      case "signup": return "Crea Account";
      case "forgot": return "Invia Email";
      case "reset": return "Salva Password";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and welcome */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-hero flex items-center justify-center shadow-float">
            <span className="text-4xl">
              {mode === "forgot" ? "🔑" : mode === "reset" ? "🔐" : "🐣"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">GemSaver</h1>
          <p className="text-muted-foreground mt-2">{getTitle()}</p>
        </motion.div>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl p-6 shadow-card border border-border"
        >
          {/* Toggle tabs - only show for login/signup */}
          {(mode === "login" || mode === "signup") && (
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Accedi
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Registrati
              </button>
            </div>
          )}

          {/* Back button for forgot/reset modes */}
          {(mode === "forgot" || mode === "reset") && (
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Torna al login</span>
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name - only for signup */}
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="displayName" className="text-foreground">Nome</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Il tuo nome"
                    className="pl-10 rounded-xl"
                    maxLength={50}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-destructive text-xs mt-1">{errors.displayName}</p>
                )}
              </motion.div>
            )}

            {/* Email - for login, signup, forgot */}
            {(mode === "login" || mode === "signup" || mode === "forgot") && (
              <div>
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="la-tua@email.com"
                    className="pl-10 rounded-xl"
                    maxLength={255}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password - for login, signup, reset */}
            {(mode === "login" || mode === "signup" || mode === "reset") && (
              <div>
                <Label htmlFor="password" className="text-foreground">
                  {mode === "reset" ? "Nuova Password" : "Password"}
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 rounded-xl"
                    maxLength={72}
                  />
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">{errors.password}</p>
                )}
              </div>
            )}

            {/* Confirm password - only for reset */}
            {mode === "reset" && (
              <div>
                <Label htmlFor="confirmPassword" className="text-foreground">Conferma Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 rounded-xl"
                    maxLength={72}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Remember me and forgot password - only for login */}
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => handleRememberMeChange(checked === true)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Rimani collegato
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:underline"
                >
                  Password dimenticata?
                </button>
              </div>
            )}

            {/* Helper text for forgot mode */}
            {mode === "forgot" && (
              <p className="text-sm text-muted-foreground">
                Inserisci la tua email e ti invieremo un link per reimpostare la password.
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl h-12 gradient-hero text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {getButtonText()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer - only for login/signup */}
        {(mode === "login" || mode === "signup") && (
          <p className="text-center text-muted-foreground text-sm mt-6">
            {mode === "login" ? "Non hai un account?" : "Hai già un account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "Registrati" : "Accedi"}
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
