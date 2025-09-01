// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { TranslationProvider } from "./context/TranslationContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <TranslationProvider>
          <SubscriptionProvider>
            <App />
          </SubscriptionProvider>
        </TranslationProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
