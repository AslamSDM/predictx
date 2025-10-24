"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import LogoIcon from "./logo-icon";
import { usePWAInstallPrompt } from "@/lib/hooks/use-pwa";

export default function InstallBanner() {
  const { installPrompt, isInstalled, promptInstall } = usePWAInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    setIsDismissed(dismissed === "true");

    // Show fallback for iOS or when beforeinstallprompt isn't available
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    if (isIOS && !isStandalone && dismissed !== "true") {
      setShowFallback(true);
    }
  }, []);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowFallback(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleIOSInstall = () => {
    // For iOS, we can't programmatically install, so show instructions
    alert(
      "To install this app on your iPhone/iPad:\n\n" +
        "1. Tap the Share button at the bottom of the screen\n" +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" in the top right corner'
    );
    handleDismiss();
  };

  // Show banner if there's an install prompt OR if it's iOS
  if (isInstalled || isDismissed || (!installPrompt && !showFallback)) {
    return null;
  }

  console.log("Install banner should show:", {
    isInstalled,
    isDismissed,
    hasInstallPrompt: !!installPrompt,
    showFallback,
  });

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border rounded-lg shadow-2xl z-[60] animate-slide-up">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/logo.png"
                alt="PredictX Logo"
                className="h-5 w-auto flex-shrink-0"
              />
              <h3 className="font-semibold text-sm md:text-base">
                Install PredictX
              </h3>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 leading-relaxed">
              Add to your home screen for the best experience and offline
              access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={installPrompt ? handleInstall : handleIOSInstall}
                className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors active:scale-95"
              >
                {installPrompt ? "Install" : "Install Guide"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg font-medium hover:bg-muted transition-colors active:scale-95"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0 touch-manipulation"
            aria-label="Close install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
