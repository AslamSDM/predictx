"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Smile } from "lucide-react";
import type { PredictionWithRelations } from "@/lib/types";
import { useSocket } from "@/lib/hooks/useSocket";
import { useUserStore } from "@/lib/store";

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  room: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: PredictionWithRelations;
}

// Common emojis for quick access
const QUICK_EMOJIS = [
  "👍",
  "👎",
  "🔥",
  "💯",
  "🚀",
  "📈",
  "📉",
  "💰",
  "😀",
  "😂",
  "😍",
  "🤔",
  "😱",
  "🎉",
  "💪",
  "👀",
];

export default function ChatModal({
  isOpen,
  onClose,
  prediction,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useSocket();
  const { user } = useUserStore();
  const roomId = prediction.id;

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join room and listen for messages
  useEffect(() => {
    if (!socket || !isOpen) return;

    try {
      // Join the room
      socket.emit("join_room", roomId);
      console.log(`📨 Joined chat room: ${roomId}`);

      // Listen for chat history
      const handleChatHistory = (history: Message[]) => {
        console.log(`📜 Received ${history.length} historical messages`);
        setMessages(history);
      };

      // Listen for new messages
      const handleReceiveMessage = (message: Message) => {
        console.log("📨 Received message:", message);
        setMessages((prev) => [...prev, message]);
      };

      socket.on("chat_history", handleChatHistory);
      socket.on("receive_message", handleReceiveMessage);

      // Cleanup
      return () => {
        socket.off("chat_history", handleChatHistory);
        socket.off("receive_message", handleReceiveMessage);
      };
    } catch (error) {
      console.error("Socket error:", error);
    }
  }, [socket, isOpen, roomId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socket || !user) return;

    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      userId: user.id,
      username: user.username || user.walletAddress.slice(0, 6) + "...",
      text: inputText.trim(),
      timestamp: Date.now(),
      room: roomId,
    };

    // Send to server
    socket.emit("send_message", message);
    console.log("📤 Sent message:", message);

    // Clear input
    setInputText("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Chat Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:w-full md:max-w-lg h-[80vh] md:h-[600px] bg-card border-t md:border border-border rounded-t-2xl md:rounded-2xl z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/50 rounded-t-2xl">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">
                  {prediction.title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span>{isConnected ? "Connected" : "Connecting..."}</span>
                  <span>•</span>
                  <span>{messages.length} messages</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-background rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Be the first to say something!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = user && message.userId === user.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="text-xs font-semibold mb-1 opacity-80">
                            {message.username}
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.text}
                        </div>
                        <div className={`text-xs mt-1 opacity-70`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3 border-t border-border bg-background/95"
                >
                  <div className="grid grid-cols-8 gap-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:bg-muted rounded-lg p-2 transition-colors active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background/50">
              {!user ? (
                <div className="text-center text-sm text-muted-foreground py-2">
                  Please login to chat
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-full transition-colors ${
                      showEmojiPicker
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    aria-label="Toggle emoji picker"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={1}
                      style={{
                        maxHeight: "100px",
                        minHeight: "40px",
                      }}
                      disabled={!isConnected}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || !isConnected}
                    className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
