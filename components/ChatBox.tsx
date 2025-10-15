"use client";
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Add 'chat_history' back to the server-to-client events interface
interface ServerToClientEvents {
    receive_message: (data: MessageData) => void;
    chat_history: (messages: MessageData[]) => void; // <-- Add event for history
}

interface ClientToServerEvents {
    join_room: (predictionId: string) => void;
    send_message: (data: MessageData) => void;
}

interface ChatBoxProps {
    predictionId: string;
    username: string;
}

interface MessageData {
    room: string;
    author: string;
    message: string;
    time: string;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3001");

const ChatBox: React.FC<ChatBoxProps> = ({ predictionId, username }) => {
    const [currentMessage, setCurrentMessage] = useState<string>("");
    const [messageList, setMessageList] = useState<MessageData[]>([]);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    const sendMessage = async (): Promise<void> => {
        if (currentMessage.trim() !== "") {
            const messageData: MessageData = {
                room: predictionId,
                author: username,
                message: currentMessage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            await socket.emit("send_message", messageData);
            setCurrentMessage("");
        }
    };

    // Main effect for handling WebSocket connection and listeners
    useEffect(() => {
        // Clear message list when the room changes to prevent showing old messages briefly
        setMessageList([]);

        if (predictionId) {
            // 1. Join the WebSocket room. The server will respond with 'chat_history'.
            socket.emit("join_room", predictionId);
        }

        // 2. Set up the listener for the initial chat history pushed by the server.
        const historyHandler = (messages: MessageData[]) => {
            setMessageList(messages);
        };
        socket.on('chat_history', historyHandler);

        // 3. Set up the listener for new, real-time messages.
        const messageHandler = (data: MessageData) => {
            // Check if the message belongs to the current room before updating state.
            if (data.room === predictionId) {
                setMessageList((list) => [...list, data]);
            }
        };
        socket.on("receive_message", messageHandler);

        // 4. Cleanup: remove listeners when the component unmounts or predictionId changes.
        return () => {
            socket.off("receive_message", messageHandler);
            socket.off('chat_history', historyHandler); // <-- Clean up history listener
        };
    }, [predictionId]); // This effect re-runs if the predictionId changes

    // Effect for auto-scrolling to the bottom of the chat
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messageList]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-96 w-full max-w-md mx-auto bg-white rounded-lg shadow-xl">
            <div className="bg-gray-800 text-white p-3 rounded-t-lg">
                <p className="font-semibold text-center">Live Chat: Market {predictionId}</p>
            </div>
            <div ref={chatBodyRef} className="flex-grow p-4 overflow-y-auto bg-gray-50">
                {messageList.map((msg, index) => (
                    <div key={index} className={`mb-3 p-2 rounded-lg max-w-xs ${msg.author === username ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-300 text-black mr-auto'}`}>
                        <p className="font-bold text-sm">{msg.author}</p>
                        <p>{msg.message}</p>
                        <span className="text-xs opacity-70 block text-right mt-1">{msg.time}</span>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex">
                <input
                    type="text"
                    value={currentMessage}
                    placeholder="Type your message..."
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatBox;

