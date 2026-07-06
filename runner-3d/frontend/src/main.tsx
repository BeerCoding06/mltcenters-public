import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NavI18nProvider } from "./lib/nav-i18n";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NavI18nProvider>
      <App />
    </NavI18nProvider>
  </React.StrictMode>
);
