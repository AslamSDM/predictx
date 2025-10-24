import { BlockscoutAI } from './LLMIntegration';

function extractAddresses(text: string): string[] {
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  return text.match(addressRegex) || [];
}

function extractTxHashes(text: string): string[] {
  const txHashRegex = /0x[a-fA-F0-9]{64}/g;
  return text.match(txHashRegex) || [];
}

interface ParsedCommand {
  trigger: string;
  hasTag?: boolean;
  text: string;
  addresses: string[];
  txHashes: string[];
  command?: string;
}

function parseAICommand(message: string): ParsedCommand | null {
  const lowerMessage = message?.toLowerCase();

  if (!lowerMessage) return null;

  if (lowerMessage.includes("@blockscout")) {
    return {
      trigger: "@blockscout",
      hasTag: true,
      text: message,
      addresses: extractAddresses(message),
      txHashes: extractTxHashes(message),
    };
  }

  if (lowerMessage.includes("validate") && extractAddresses(message).length > 0) {
    return {
      trigger: "validate",
      command: "validate",
      addresses: extractAddresses(message),
      text: message,
      txHashes: [],
    };
  }

  if (lowerMessage.includes("analyze") && extractAddresses(message).length > 0) {
    return {
      trigger: "analyze",
      command: "analyze",
      addresses: extractAddresses(message),
      text: message,
      txHashes: [],
    };
  }

  if ((lowerMessage.includes("status") || lowerMessage.includes("check tx")) && extractTxHashes(message).length > 0) {
    return {
      trigger: "status",
      command: "status",
      txHashes: extractTxHashes(message),
      text: message,
      addresses: [],
    };
  }

  if (lowerMessage.includes("get-abi") || lowerMessage.includes("get abi")) {
    return {
      trigger: "get-abi",
      command: "get-abi",
      addresses: extractAddresses(message),
      text: message,
      txHashes: [],
    };
  }

  return null;
}

interface Action {
  action: string;
  target?: string;
  type: string;
}

function determineAction(parsedCommand: ParsedCommand | null): Action | null {
  if (!parsedCommand) return null;

  const { trigger, addresses, txHashes } = parsedCommand;

  if (trigger === "@blockscout") {
    if (addresses.length > 0 && txHashes.length === 0) {
      return {
        action: "analyze",
        target: addresses[0],
        type: "address",
      };
    } else if (txHashes.length > 0) {
      return {
        action: "status",
        target: txHashes[0],
        type: "transaction",
      };
    } else {
      return {
        action: "help",
        type: "help",
      };
    }
  }

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

function getHelpMessage(): string {
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

export {
  parseAICommand,
  determineAction,
  extractAddresses,
  extractTxHashes,
  getHelpMessage,
  ParsedCommand,
  Action,
};