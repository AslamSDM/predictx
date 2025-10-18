const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { addMessage, getMessageHistory } = require("./ChatCache"); // <-- Import the cache manager

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`⚡️ User connected: ${socket.id}`);

  // 1. When a user joins a room
  socket.on("join_room", (predictionId) => {
    socket.join(predictionId);
    console.log(`User ${socket.id} joined room: ${predictionId}`);

    // --> SEND CACHED HISTORY
    // Get the history from the cache
    const history = getMessageHistory(predictionId);

    // Emit the history only to the user who just connected
    // Use a different event name like 'chat_history' to be clear
    socket.emit("chat_history", history);
  });

  // 2. When a user sends a message
  socket.on("send_message", (data) => {
    // --> ADD MESSAGE TO CACHE
    // First, add the new message to our in-memory cache
    addMessage(data.room, data);

    // Then, broadcast the message to everyone in the room (including the sender)
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`🔥 User disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("🚀 CHAT SERVER IS RUNNING ON PORT 3001");
});
