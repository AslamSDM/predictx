const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { addMessage, getMessageHistory } = require("./ChatCache");
const { mcpTools } = require("./BlockscoutMCP");

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

  // 3. Blockscout MCP Tools - Contract Validation
  socket.on("validate_contract", async (data) => {
    try {
      const { contractAddress, chainApiUrl } = data;
      const result = await mcpTools.validateTradeIdeaContract(
        contractAddress,
        chainApiUrl || 'https://eth-sepolia.blockscout.com/api'
      );

      socket.emit("contract_validation_result", result);
    } catch (error) {
      socket.emit("contract_validation_error", {
        error: error.message,
      });
    }
  });

  // 4. Get Contract ABI
  socket.on("get_contract_abi", async (data) => {
    try {
      const { contractAddress, chainApiUrl } = data;
      const result = await mcpTools.getContractABI(
        contractAddress,
        chainApiUrl || 'https://eth-sepolia.blockscout.com/api'
      );

      socket.emit("contract_abi_result", result);
    } catch (error) {
      socket.emit("contract_abi_error", {
        error: error.message,
      });
    }
  });

  // 5. Get Transaction Status
  socket.on("get_transaction_status", async (data) => {
    try {
      const { txHash, chainApiUrl } = data;
      const result = await mcpTools.getTransactionStatusForChat(
        txHash,
        chainApiUrl || 'https://eth-sepolia.blockscout.com/api'
      );

      socket.emit("transaction_status_result", result);
      
      // Also broadcast to the room
      if (data.room) {
        io.to(data.room).emit("receive_message", {
          message: result.message,
          username: "Blockscout Bot",
          timestamp: new Date().toISOString(),
          type: "transaction_status",
          data: result,
        });
      }
    } catch (error) {
      socket.emit("transaction_status_error", {
        error: error.message,
      });
    }
  });

  // 6. Analyze Contract Functions
  socket.on("analyze_contract", async (data) => {
    try {
      const { contractAddress, chainApiUrl } = data;
      const result = await mcpTools.getContractFunctionsForAI(
        contractAddress,
        chainApiUrl || 'https://eth-sepolia.blockscout.com/api'
      );

      socket.emit("contract_analysis_result", result);
      
      // Send AI suggestion message to the room
      if (data.room && result.canAnalyze) {
        const suggestions = result.predictionSuggestions.map(s => 
          `• ${s.type}: ${s.description}`
        ).join('\n');

        io.to(data.room).emit("receive_message", {
          message: `🤖 Contract Analysis Complete:\n\n📊 Functions: ${result.summary.totalFunctions}\n📖 Read: ${result.summary.readFunctions}\n✍️ Write: ${result.summary.writeFunctions}\n\n💡 Prediction Suggestions:\n${suggestions || 'No specific suggestions available'}`,
          username: "AI Analyst",
          timestamp: new Date().toISOString(),
          type: "contract_analysis",
          data: result,
        });
      }
    } catch (error) {
      socket.emit("contract_analysis_error", {
        error: error.message,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔥 User disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("🚀 CHAT SERVER IS RUNNING ON PORT 3001");
});
