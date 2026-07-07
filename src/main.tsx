import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function loadFonts() {
  void import("./load-fonts.ts");
}

if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(loadFonts, { timeout: 2000 });
  } else {
    window.addEventListener("load", loadFonts, { once: true });
  }
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
