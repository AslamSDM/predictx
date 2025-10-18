"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useUserSync } from "@/lib/hooks/useUserSync";

// Inner component that uses the user sync hook
function UserSyncProvider({ children }: { children: React.ReactNode }) {
  // This will automatically sync user with database when logged in
  useUserSync();
  return <>{children}</>;
}

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
      <UserSyncProvider>{children}</UserSyncProvider>
    </PrivyProvider>
  );
}
