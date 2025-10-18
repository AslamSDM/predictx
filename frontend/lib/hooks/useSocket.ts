"use client";

import { useEffect, useState } from "react";

// Dynamic import to handle missing socket.io-client gracefully
let io: any = null;
let Socket: any = null;

try {
  const socketModule = require("socket.io-client");
  io = socketModule.io || socketModule.default?.io;
  Socket = socketModule.Socket;
} catch (error) {
  console.warn(
    "⚠️  socket.io-client not installed. Run: npm install socket.io-client"
  );
}

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: any = null;

/**
 * Hook to manage socket.io connection for chat functionality
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if socket.io-client is available
    if (!io) {
      console.warn("Socket.io not available - chat will be disabled");
      return;
    }

    // Initialize socket connection if not already connected
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket?.id);
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect socket on unmount - keep it alive for app lifetime
      // Only disconnect when app is closed or user navigates away
    };
  }, []);

  return {
    socket: io ? socket : null,
    isConnected: io ? isConnected : false,
  };
}
