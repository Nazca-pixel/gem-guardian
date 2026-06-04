import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMonitoring } from "./lib/monitoring";
import { track } from "./lib/analytics";

initMonitoring();
track("app_open");

createRoot(document.getElementById("root")!).render(<App />);
