"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId =
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmgw07e3q00g0jr0dqsvefagx";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Customize Privy's appearance
        appearance: {
          theme: "dark",
          accentColor: "#0EA5E9",
          logo: "/icons/icon-192x192.png",
        },
        // Login methods - only email and Telegram
        loginMethods: ["email", "telegram"],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
