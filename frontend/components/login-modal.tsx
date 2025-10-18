"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send, Loader2 } from "lucide-react";
import { useLoginWithEmail, useLoginWithTelegram } from "@privy-io/react-auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<"email" | "telegram">("email");
  const [emailInput, setEmailInput] = useState("");
  const [telegramInput, setTelegramInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  const { sendCode, loginWithCode, state } = useLoginWithEmail();

  const handleEmailLogin = async () => {
    if (!emailInput.trim()) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Send verification code to email
      await sendCode({ email: emailInput });
      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verify code and login
      await loginWithCode({ code });
      onClose();
      // Reset state
      setEmailInput("");
      setCode("");
      setCodeSent(false);
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    if (!telegramInput.trim()) {
      setError("Please enter your Telegram username");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Privy will handle Telegram login
      // Open Telegram mini-app or redirect
      window.open(
        `https://t.me/your_bot?start=login_${telegramInput}`,
        "_blank"
      );
      setError("Check Telegram to complete login");
    } catch (err: any) {
      setError(err.message || "Failed to connect Telegram. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setActiveTab("email");
    setEmailInput("");
    setTelegramInput("");
    setCode("");
    setCodeSent(false);
    setError("");
    setIsLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resetModal}
          />

          {/* Modal Container - Centered */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
              style={{ position: "relative" }}
            >
              <div
                className="bg-card border-2 border-border rounded-2xl shadow-2xl w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Login to PredictX</h2>
                    <button
                      onClick={resetModal}
                      className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose your login method to get started
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                  <button
                    onClick={() => {
                      setActiveTab("email");
                      setError("");
                    }}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "email"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("telegram");
                      setError("");
                    }}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "telegram"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Send className="w-4 h-4 inline mr-2" />
                    Telegram
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {activeTab === "email" ? (
                    <div className="space-y-4">
                      {!codeSent ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              disabled={isLoading}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEmailLogin();
                              }}
                            />
                          </div>

                          <button
                            onClick={handleEmailLogin}
                            disabled={isLoading || !emailInput.trim()}
                            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending code...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4" />
                                Send Login Code
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Verification Code
                            </label>
                            <input
                              type="text"
                              value={code}
                              onChange={(e) => setCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest font-mono"
                              maxLength={6}
                              disabled={isLoading}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleVerifyCode();
                              }}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Check your email at <strong>{emailInput}</strong>
                            </p>
                          </div>

                          <button
                            onClick={handleVerifyCode}
                            disabled={isLoading || code.length !== 6}
                            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              "Verify & Login"
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setCodeSent(false);
                              setCode("");
                              setError("");
                            }}
                            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ← Back to email
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Telegram Username
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            @
                          </span>
                          <input
                            type="text"
                            value={telegramInput}
                            onChange={(e) =>
                              setTelegramInput(e.target.value.replace("@", ""))
                            }
                            placeholder="username"
                            className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleTelegramLogin();
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Enter your Telegram username without the @ symbol
                        </p>
                      </div>

                      <button
                        onClick={handleTelegramLogin}
                        disabled={isLoading || !telegramInput.trim()}
                        className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Login with Telegram
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-accent/30">
                  <p className="text-xs text-center text-muted-foreground">
                    By logging in, you agree to our Terms of Service and Privacy
                    Policy
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
