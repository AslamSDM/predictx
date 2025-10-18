"use client"

import { useState } from "react"

export default function WalletConnect() {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  const onConnect = () => {
    // Stub: replace with real wallet integration later
    setConnected(true)
    setAddress("0x8F...C7a")
  }

  const onDisconnect = () => {
    setConnected(false)
    setAddress(null)
  }

  return (
    <div className="flex items-center gap-2">
      {connected && address ? (
        <>
          <span className="hidden sm:inline text-xs text-foreground/70">{address}</span>
          <button
            onClick={onDisconnect}
            className="px-3 py-2 text-xs md:text-sm rounded-md bg-accent text-accent-foreground glow-accent"
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={onConnect}
          className="px-3 py-2 text-xs md:text-sm rounded-md bg-primary text-primary-foreground glow"
          aria-label="Connect wallet"
        >
          Connect Wallet
        </button>
      )}
    </div>
  )
}
