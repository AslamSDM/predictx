import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Orbitron } from "next/font/google";
import { Suspense } from "react";
import InstallBanner from "@/components/install-banner";
import BackgroundLoader from "@/components/background-loader";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./Provider";
import SiteNav from "@/components/site-nav";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "PredictX - Trading Predictions Platform",
  description:
    "A decentralized prediction platform where traders can create predictions about their trades and users can bet on the outcomes.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["trading", "predictions", "betting", "crypto", "forex", "stocks"],
  authors: [{ name: "PredictX" }],
  icons: {
    icon: [
      { url: "/icons/logo.ico", type: "image/x-icon" },
      { url: "/app-icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: "/app-icon.svg",
    shortcut: "/icons/logo.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PredictX",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "PredictX",
    title: "PredictX - Trading Predictions",
    description: "Bet on trading predictions and prove your market edge",
  },
  twitter: {
    card: "summary",
    title: "PredictX - Trading Predictions",
    description: "Bet on trading predictions and prove your market edge",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark antialiased ${orbitron.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="theme-color" content="#00D4FF" />
        <link rel="icon" href="/icons/logo.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/icons/logo.ico" type="image/x-icon" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/app-icon.svg" />
        <link rel="apple-touch-icon-precomposed" href="/app-icon.svg" />
      </head>
      <body className="font-sans">
        <Providers>
          <BackgroundLoader />
          <Suspense fallback={null}>
            <SiteNav />
            {children}
          </Suspense>
          <Toaster
            position="top-right"
            expand={true}
            richColors
            closeButton
            theme="dark"
          />
        </Providers>
        <InstallBanner />
      </body>
    </html>
  );
}
