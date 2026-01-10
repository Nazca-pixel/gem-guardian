import { createContext, useContext, useState, ReactNode } from "react";

interface DevModeContextType {
  isDevMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error("useDevMode must be used within a DevModeProvider");
  }
  return context;
};

export const DevModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDevMode, setIsDevMode] = useState(false);

  const setDevMode = (enabled: boolean) => {
    setIsDevMode(enabled);
    if (enabled) {
      console.log("🔧 DevMode attivato");
    } else {
      console.log("🔧 DevMode disattivato");
    }
  };

  return (
    <DevModeContext.Provider value={{ isDevMode, setDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
};
