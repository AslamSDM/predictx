/**
 * AI Command Parser
 *
 * Parses chat messages for AI commands and tags like @blockscout
 * Now integrated with LLM for enhanced analysis
 */

const { BlockscoutAI } = require('./LLMIntegration');

/**
 * Extract Ethereum addresses from text
 */
function extractAddresses(text) {
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  return text.match(addressRegex) || [];
}

/**
 * Extract transaction hashes from text
 */
function extractTxHashes(text) {
  const txHashRegex = /0x[a-fA-F0-9]{64}/g;
  return text.match(txHashRegex) || [];
}

/**
 * Parse AI command from message
 */
function parseAICommand(message) {
  const lowerMessage = message?.toLowerCase();

  // Check for @blockscout tag
  if (lowerMessage.includes("@blockscout")) {
    return {
      trigger: "@blockscout",
      hasTag: true,
      text: message,
      addresses: extractAddresses(message),
      txHashes: extractTxHashes(message),
    };
  }

  // Check for validate command
  if (
    lowerMessage.includes("validate") &&
    extractAddresses(message).length > 0
  ) {
    return {
      trigger: "validate",
      command: "validate",
      addresses: extractAddresses(message),
      text: message,
    };
  }

  // Check for analyze command
  if (
    lowerMessage.includes("analyze") &&
    extractAddresses(message).length > 0
  ) {
    return {
      trigger: "analyze",
      command: "analyze",
      addresses: extractAddresses(message),
      text: message,
    };
  }

  // Check for status command
  if (
    (lowerMessage.includes("status") || lowerMessage.includes("check tx")) &&
    extractTxHashes(message).length > 0
  ) {
    return {
      trigger: "status",
      command: "status",
      txHashes: extractTxHashes(message),
      text: message,
    };
  }

  // Check for get-abi command
  if (lowerMessage.includes("get-abi") || lowerMessage.includes("get abi")) {
    return {
      trigger: "get-abi",
      command: "get-abi",
      addresses: extractAddresses(message),
      text: message,
    };
  }

  return null;
}

/**
 * Determine which MCP action to take
 */
function determineAction(parsedCommand) {
  if (!parsedCommand) return null;

  const { trigger, addresses, txHashes } = parsedCommand;

  // @blockscout tag - intelligent routing
  if (trigger === "@blockscout") {
    if (addresses.length > 0 && txHashes.length === 0) {
      // Has addresses, no tx hashes -> analyze contract
      return {
        action: "analyze",
        target: addresses[0],
        type: "address",
      };
    } else if (txHashes.length > 0) {
      // Has tx hashes -> check status
      return {
        action: "status",
        target: txHashes[0],
        type: "transaction",
      };
    } else {
      // No specific target -> show help
      return {
        action: "help",
        type: "help",
      };
    }
  }

  // Specific commands
  if (trigger === "validate" && addresses.length > 0) {
    return {
      action: "validate",
      target: addresses[0],
      type: "address",
    };
  }

  if (trigger === "analyze" && addresses.length > 0) {
    return {
      action: "analyze",
      target: addresses[0],
      type: "address",
    };
  }

  if (trigger === "status" && txHashes.length > 0) {
    return {
      action: "status",
      target: txHashes[0],
      type: "transaction",
    };
  }

  if (trigger === "get-abi" && addresses.length > 0) {
    return {
      action: "get-abi",
      target: addresses[0],
      type: "address",
    };
  }

  return null;
}

/**
 * Generate help message for Blockscout commands
 */
function getHelpMessage() {
  return `🤖 **Blockscout AI Assistant Help**

**Tag Usage:**
\`@blockscout [address]\` - Analyze a contract
\`@blockscout [txHash]\` - Check transaction status

**Commands:**
\`validate 0x...\` - Validate contract safety
\`analyze 0x...\` - Full contract analysis
\`status 0x...\` - Check transaction status
\`get-abi 0x...\` - Get contract ABI

**Examples:**
\`@blockscout 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\`
\`validate 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\`
\`status 0x123...abc\`

Just mention me with an address or transaction hash and I'll help! 🚀`;
}

module.exports = {
  parseAICommand,
  determineAction,
  extractAddresses,
  extractTxHashes,
  getHelpMessage,
};
