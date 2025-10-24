import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { config } from "./config";
import { addMessage, getMessageHistory } from "./ChatCache";
import {
  parseAICommand,
  determineAction,
  getHelpMessage,
  ParsedCommand,
  Action,
} from "./AICommandParser";
import { BlockscoutAI } from "./LLMIntegration";
import { mcpTools } from "./BlockscoutMCP";
import { randomUUID } from "crypto";

import { config as dotenvConfig } from "dotenv";

const app = express();
app.use(cors());
const server = http.createServer(app);
dotenvConfig();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const ai = new BlockscoutAI();

app.get("/", (req, res) => {
  res.send("Real-time chat server for PredictX is running!");
});

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", (room: string) => {
    socket.join(room);
    console.log(`${socket.id} joined room ${room}`);
    console.log(getMessageHistory(room));
    socket.emit("chat_history", getMessageHistory(room));
  });

  socket.on(
    "send_message",
    async (data: {
      room: string;
      text: string;
      username: string;
      id?: string;
      userId?: string;
    }) => {
      const { room, text, username, id, userId } = data;
      const timestamp = Date.now();
      console.log(`Message from ${username} in room ${room}: ${text},`, data);

      const parsedCommand = parseAICommand(text);
      console.log("Parsed command:", parsedCommand);
      const messageData = {
        id: id || randomUUID(),
        userId,
        username: username,
        text: text,
        timestamp,
        room,
      };
      console.log("Storing message:", messageData);
      addMessage(room, messageData);

      io.to(room).emit("receive_message", messageData);
      if (parsedCommand) {
        await handleAICommand(socket, room, parsedCommand, username, text);
      }
    }
  );
  socket.on("delete_message", (messageId: string, room: string) => {
    console.log(`Request to delete message ${messageId} in room ${room}`);
    const roomMessages = getMessageHistory(room);
    const index = roomMessages.findIndex((msg) => msg.id === messageId);
    if (index !== -1) {
      roomMessages.splice(index, 1);
      io.to(room).emit("delete_message", messageId);
      console.log(`Message ${messageId} deleted from room ${room}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

async function handleAICommand(
  socket: Socket,
  roomId: string,
  parsedCommand: ParsedCommand,
  user: string,
  text: string
) {
  const action = determineAction(parsedCommand);
  console.log("Determined action:", action);
  if (!action) return;

  const { action: command, target, type } = action;

  const aiMessage = {
    id: randomUUID(),
    username: "Blockscout AI",
    text: `Loading...`,
    timestamp: Date.now(),
  };
  io.to(roomId).emit("receive_message", aiMessage);

  let result;
  try {
    console.log("Executing AI command:", parsedCommand.text, {
      room: roomId,
      user,
    });
    const result = await ai.chat(parsedCommand.text, { room: roomId, user });
    console.log("AI Command Result:", result);
    const resultMessage = {
      username: "Blockscout AI",
      text: result,
      timestamp: Date.now(),
    };
    console.log("Emitting AI result message:", resultMessage);
    io.to(roomId).emit("receive_message", resultMessage);
  } catch (error: any) {
    const errorMessage = {
      username: "Blockscout AI",
      text: `Error processing command: ${error.message}`,
      timestamp: Date.now(),
    };
    // Delete the loading message after 5 seconds
    io.to(roomId).emit("delete_message", aiMessage.id);

    io.to(roomId).emit("receive_message", errorMessage);
  }
}

server.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
