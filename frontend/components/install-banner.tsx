"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import LogoIcon from "./logo-icon";
import { usePWAInstallPrompt } from "@/lib/hooks/use-pwa";

export default function InstallBanner() {
  const { installPrompt, isInstalled, promptInstall } = usePWAInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    setIsDismissed(dismissed === "true");
  }, []);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (isInstalled || isDismissed || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border rounded-lg shadow-2xl z-50 animate-slide-up">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo.png" alt="PredictX Logo" className="h-5 w-auto" />
              <h3 className="font-semibold">Install PredictX</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Add to your home screen for the best experience and offline
              access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-background border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
