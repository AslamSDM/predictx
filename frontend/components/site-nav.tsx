"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Download, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import WalletConnect from "./wallet-connect";
import UserProfileDropdown from "./user-profile-dropdown";
import LogoIcon from "./logo-icon";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect } from "react";
import { useCreateWallet, useWallets } from "@privy-io/react-auth";
import { usePWAInstallPrompt } from "@/lib/hooks/use-pwa";
import Image from "next/image";

export default function SiteNav() {
  const pathname = usePathname();
  const { ready, authenticated } = useAuth();
  const { createWallet } = useCreateWallet();
  const { installPrompt, isInstalled, promptInstall } = usePWAInstallPrompt();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    createWallet();
  }, [authenticated]);

  const link = (href: string, label: string, isMobile: boolean = false) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "px-3 py-2 text-sm md:text-base rounded-md transition-colors",
        isMobile ? "block w-full text-left" : "",
        pathname === href
          ? "text-primary"
          : "text-foreground/80 hover:text-primary"
      )}
      aria-current={pathname === href ? "page" : undefined}
      onClick={() => isMobile && setIsMobileMenuOpen(false)}
    >
      {label}
    </Link>
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileInstall = async () => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (installPrompt) {
      // Android/Chrome - use native install prompt
      const success = await promptInstall();
      if (success) {
        setIsMobileMenuOpen(false);
      }
    } else if (isIOS) {
      // iOS - show manual installation instructions
      alert(
        "To install this app on your iPhone/iPad:\n\n" +
          "1. Tap the Share button at the bottom of the screen\n" +
          '2. Scroll down and tap "Add to Home Screen"\n' +
          '3. Tap "Add" in the top right corner'
      );
      setIsMobileMenuOpen(false);
    } else {
      // Other browsers - show general instructions
      alert(
        "To install this app:\n\n" +
          "• Look for an install icon in your browser's address bar\n" +
          "• Or check your browser's menu for 'Install app' or 'Add to home screen'"
      );
      setIsMobileMenuOpen(false);
    }
  };

  // Show install button if not already installed
  const showInstallButton = !isInstalled;

  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <nav className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="PredictX Logo"
              width={50}
              height={50}
              className=" w-auto transition-all duration-200 group-hover:scale-110"
            />
            <span className="font-serif tracking-widest text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
              PREDICT.X
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-1">
            {link("/", "Home")}
            {link("/discover", "Discover")}
            {link("/create", "Create")}
            {link("/resolve", "Resolve")}
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Auth */}
            <div className="hidden sm:block">
              {authenticated ? <UserProfileDropdown /> : <WalletConnect />}
            </div>

            {/* Mobile Auth - Always visible */}
            <div className="sm:hidden">
              {authenticated ? <UserProfileDropdown /> : <WalletConnect />}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <div className="fixed top-[73px] left-0 right-0 bg-background border-b border-border shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {link("/", "Home", true)}
              {link("/discover", "Discover", true)}
              {link("/create", "Create", true)}
              {link("/resolve", "Resolve", true)}

              {/* Install App Button */}
              {showInstallButton && (
                <button
                  onClick={handleMobileInstall}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-left bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
