"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import WalletConnect from "./wallet-connect";
import UserProfileDropdown from "./user-profile-dropdown";
import LogoIcon from "./logo-icon";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect } from "react";
import { useCreateWallet, useWallets } from "@privy-io/react-auth";
import Image from "next/image";

export default function SiteNav() {
  const pathname = usePathname();
  const { ready, authenticated } = useAuth();
  const { createWallet } = useCreateWallet();

  useEffect(() => {
    createWallet();
  }, [authenticated]);

  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "px-3 py-2 text-sm md:text-base rounded-md transition-colors",
        pathname === href
          ? "text-primary"
          : "text-foreground/80 hover:text-primary"
      )}
      aria-current={pathname === href ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
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
        <div className="hidden sm:flex items-center gap-1">
          {link("/", "Home")}
          {link("/discover", "Discover")}
          {link("/create", "Create")}
          {link("/resolve", "Resolve")}
        </div>
        <div className="flex items-center gap-2">
          {/* Show user profile dropdown (handles loading state internally) or wallet connect */}
          {authenticated ? <UserProfileDropdown /> : <WalletConnect />}
        </div>
      </nav>
    </header>
  );
}
