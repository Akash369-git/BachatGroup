import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";

import App from "./App.jsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  // Current environment (development/production)
  environment: import.meta.env.MODE,

  // Optional: Set your app version from .env
  release: import.meta.env.VITE_APP_VERSION,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Only send events from production
  enabled: import.meta.env.PROD,

  // Capture 10% of performance transactions
  tracesSampleRate: 0.1,

  // Record 10% of user sessions
  replaysSessionSampleRate: 0.1,

  // Record 100% of sessions that encounter an error
  replaysOnErrorSampleRate: 1.0,

  // Ignore noisy browser errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Script error.",
  ],
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);