"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useUserSync } from "@/lib/hooks/useUserSync";
import { sepolia } from "viem/chains";

// Inner component that uses the user sync hook
function UserSyncProvider({ children }: { children: React.ReactNode }) {
  // This will automatically sync user with database when logged in
  useUserSync();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!;

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#0EA5E9",
          logo: "/icons/icon-192x192.png",
        },
        loginMethods: ["email", "google"],
        defaultChain: sepolia,
        supportedChains: [sepolia],
        externalWallets: {
          disableAllExternalWallets: true
        },
        // embeddedWallets: {
        //   ethereum: {
        //     createOnLogin: "off",
        //   },
        // },
      }}
    >
      <UserSyncProvider>{children}</UserSyncProvider>
    </PrivyProvider>
  );
}
