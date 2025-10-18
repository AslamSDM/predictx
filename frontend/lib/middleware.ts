import { NextRequest, NextResponse } from "next/server";

/**
 * Simple middleware to validate wallet signatures
 * In production, implement proper signature verification
 */
export function validateWalletAuth(request: NextRequest) {
  const walletAddress = request.headers.get("x-wallet-address");
  // const signature = request.headers.get("x-wallet-signature");

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 401 }
    );
  }

  // TODO: Implement proper signature verification
  // This would verify that the signature was created by the wallet address
  // For now, we'll just check that wallet address is present

  return null; // No error, continue processing
}

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();

  const userRequests = requestCounts.get(ip);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (userRequests.count >= limit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  userRequests.count++;
  return null;
}

/**
 * CORS middleware for API routes
 */
export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-wallet-address, x-wallet-signature",
  };
}
