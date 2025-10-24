/**
 * Chat Server with Blockscout MCP and LLM Integration
 * 
 * This server integrates:
 * - Blockscout MCP for blockchain data
 * - LLM for intelligent analysis
 * - AI command parsing
 * - Real-time chat with Socket.IO
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const { BlockscoutAI } = require('./LLMIntegration');
const { parseAICommand, determineAction, getHelpMessage } = require('./AICommandParser');
const { validatePrediction, summarizePrediction, formatValidationResult, formatSummaryResult } = require('./AIHelper');
const { mcpTools } = require('./BlockscoutMCP');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI assistant
const aiAssistant = new BlockscoutAI();

// Store active predictions and bets (in production, use a database)
let activePredictions = [];
let predictionBets = {};

// Chat message history
let chatHistory = [];

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send chat history to new user
  socket.emit('chatHistory', chatHistory);

  // Handle chat messages
  socket.on('chatMessage', async (data) => {
    try {
      const { message, userId } = data;
      
      // Add user message to history
      const userMessage = {
        id: Date.now(),
        type: 'user',
        userId,
        message,
        timestamp: new Date().toISOString()
      };
      chatHistory.push(userMessage);
      io.emit('chatHistory', chatHistory);

      // Parse for AI commands
      const parsedCommand = parseAICommand(message);
      const action = determineAction(parsedCommand);

      if (action) {
        // Handle AI command
        await handleAICommand(socket, action, message, userId);
      } else {
        // Regular chat message - let AI respond if mentioned
        if (message.toLowerCase().includes('@blockscout') || message.toLowerCase().includes('blockscout')) {
          await handleGeneralChat(socket, message, userId);
        }
      }
    } catch (error) {
      console.error('Chat message error:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'system',
        message: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date().toISOString()
      };
      socket.emit('chatMessage', errorMessage);
    }
  });

  // Handle prediction creation
  socket.on('createPrediction', async (data) => {
    try {
      const prediction = {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      activePredictions.push(prediction);
      predictionBets[prediction.id] = [];

      // Validate prediction with AI
      const validation = await validatePrediction(prediction);

      const response = {
        id: Date.now(),
        type: 'system',
        message: `🤖 **Prediction Created:** ${prediction.symbol}\n\n${formatValidationResult(validation.basicValidation)}`,
        timestamp: new Date().toISOString()
      };

      io.emit('chatMessage', response);
      io.emit('predictionCreated', prediction);
    } catch (error) {
      console.error('Prediction creation error:', error);
      socket.emit('error', { message: 'Failed to create prediction' });
    }
  });

  // Handle betting
  socket.on('placeBet', (data) => {
    try {
      const { predictionId, userId, position, amount } = data;
      const bet = {
        id: Date.now(),
        predictionId,
        userId,
        position,
        amount: parseFloat(amount),
        timestamp: new Date().toISOString()
      };

      if (!predictionBets[predictionId]) {
        predictionBets[predictionId] = [];
      }

      predictionBets[predictionId].push(bet);

      const response = {
        id: Date.now(),
        type: 'system',
        message: `💰 **Bet Placed:** ${userId} bet $${amount} on ${position} for prediction ${predictionId}`,
        timestamp: new Date().toISOString()
      };

      io.emit('chatMessage', response);
      io.emit('betPlaced', bet);
    } catch (error) {
      console.error('Bet placement error:', error);
      socket.emit('error', { message: 'Failed to place bet' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

/**
 * Handle AI commands
 */
async function handleAICommand(socket, action, originalMessage, userId) {
  let responseMessage = '';

  try {
    switch (action.action) {
      case 'analyze':
        // Analyze contract
        const contractAnalysis = await aiAssistant.analyzeContract(action.target);
        responseMessage = `🤖 **Contract Analysis:**\n\n${contractAnalysis}`;
        break;

      case 'validate':
        // Find prediction by address or create mock data
        const mockPrediction = {
          symbol: 'ETH',
          direction: 'LONG',
          targetPrice: 3000,
          currentPrice: 2500,
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: `Contract: ${action.target}`
        };
        const validation = await validatePrediction(mockPrediction);
        responseMessage = formatValidationResult(validation.basicValidation);
        break;

      case 'status':
        // Check transaction status
        const txStatus = await mcpTools.getTransactionStatusForChat(action.target);
        responseMessage = txStatus.message || 'Transaction status check failed';
        break;

      case 'get-abi':
        // Get contract ABI
        const abiResult = await mcpTools.getContractABI(action.target);
        if (abiResult.success) {
          responseMessage = `✅ **Contract ABI Retrieved**\n\n\`\`\`json\n${JSON.stringify(abiResult.abi, null, 2)}\n\`\`\``;
        } else {
          responseMessage = `❌ **ABI Retrieval Failed:** ${abiResult.error}`;
        }
        break;

      case 'help':
        responseMessage = getHelpMessage();
        break;

      default:
        responseMessage = '🤖 I\'m not sure how to handle that command. Try \`@blockscout help\` for available commands.';
    }
  } catch (error) {
    console.error('AI command error:', error);
    responseMessage = '🤖 Sorry, I encountered an error processing your AI command.';
  }

  const response = {
    id: Date.now(),
    type: 'ai',
    userId: 'BlockscoutAI',
    message: responseMessage,
    timestamp: new Date().toISOString()
  };

  chatHistory.push(response);
  io.emit('chatMessage', response);
}

/**
 * Handle general chat with AI
 */
async function handleGeneralChat(socket, message, userId) {
  try {
    const aiResponse = await aiAssistant.chat(message);
    const response = {
      id: Date.now(),
      type: 'ai',
      userId: 'BlockscoutAI',
      message: aiResponse,
      timestamp: new Date().toISOString()
    };

    chatHistory.push(response);
    io.emit('chatMessage', response);
  } catch (error) {
    console.error('AI chat error:', error);
    const errorResponse = {
      id: Date.now(),
      type: 'ai',
      userId: 'BlockscoutAI',
      message: '🤖 I\'m having trouble connecting to my AI brain right now. Please try again later.',
      timestamp: new Date().toISOString()
    };
    io.emit('chatMessage', errorResponse);
  }
}

// API endpoints
app.get('/api/predictions', (req, res) => {
  res.json(activePredictions);
});

app.get('/api/predictions/:id', (req, res) => {
  const prediction = activePredictions.find(p => p.id == req.params.id);
  if (prediction) {
    const bets = predictionBets[prediction.id] || [];
    res.json({ ...prediction, bets });
  } else {
    res.status(404).json({ error: 'Prediction not found' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activePredictions: activePredictions.length,
    totalBets: Object.values(predictionBets).reduce((sum, bets) => sum + bets.length, 0)
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📊 Blockscout MCP integrated with LLM`);
  console.log(`🤖 AI commands available via @blockscout`);
});
