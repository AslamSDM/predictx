/**
 * Blockscout MCP Server Integration
 *
 * This module provides MCP (Model Context Protocol) tools for blockchain interactions
 * using Blockscout API for contract verification, ABI fetching, and transaction validation
 */

const axios = require("axios");

/**
 * Blockscout API client
 */
class BlockscoutMCP {
  constructor(apiUrl = "https://eth-sepolia.blockscout.com/api") {
    this.apiUrl = apiUrl;
  }

  /**
   * Get contract ABI from Blockscout
   */
  async getContractABI(contractAddress) {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          module: "contract",
          action: "getabi",
          address: contractAddress,
        },
      });

      if (response.data.status === "1") {
        return {
          success: true,
          abi: JSON.parse(response.data.result),
          address: contractAddress,
        };
      } else {
        return {
          success: false,
          error: response.data.result || "Contract not verified",
          address: contractAddress,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        address: contractAddress,
      };
    }
  }

  /**
   * Get contract source code from Blockscout
   */
  async getContractSource(contractAddress) {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          module: "contract",
          action: "getsourcecode",
          address: contractAddress,
        },
      });

      if (response.data.status === "1" && response.data.result[0]) {
        const contract = response.data.result[0];
        return {
          success: true,
          sourceCode: contract.SourceCode,
          contractName: contract.ContractName,
          compilerVersion: contract.CompilerVersion,
          optimizationUsed: contract.OptimizationUsed,
          runs: contract.Runs,
          constructorArguments: contract.ConstructorArguments,
          evmVersion: contract.EVMVersion,
          library: contract.Library,
          licenseType: contract.LicenseType,
          proxy: contract.Proxy,
          implementation: contract.Implementation,
          swarmSource: contract.SwarmSource,
        };
      } else {
        return {
          success: false,
          error: "Contract source not available",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get transaction details from Blockscout
   */
  async getTransactionInfo(txHash) {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          module: "transaction",
          action: "gettxinfo",
          txhash: txHash,
        },
      });

      if (response.data.status === "1") {
        return {
          success: true,
          transaction: response.data.result,
        };
      } else {
        return {
          success: false,
          error: "Transaction not found",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get transaction receipt status
   */
  async getTransactionStatus(txHash) {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          module: "transaction",
          action: "gettxreceiptstatus",
          txhash: txHash,
        },
      });

      if (response.data.status === "1") {
        return {
          success: true,
          status: response.data.result.status,
          message: response.data.result.status === "1" ? "Success" : "Failed",
        };
      } else {
        return {
          success: false,
          error: "Transaction receipt not found",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate contract interaction
   * Checks if a contract address is valid and verified
   */
  async validateContract(contractAddress) {
    const abiResult = await this.getContractABI(contractAddress);
    const sourceResult = await this.getContractSource(contractAddress);

    return {
      address: contractAddress,
      isVerified: abiResult.success,
      hasSource: sourceResult.success,
      abi: abiResult.success ? abiResult.abi : null,
      contractName: sourceResult.success ? sourceResult.contractName : null,
      compilerVersion: sourceResult.success
        ? sourceResult.compilerVersion
        : null,
      validation: {
        canInteract: abiResult.success,
        isProxy: sourceResult.success ? sourceResult.proxy === "1" : false,
        implementation: sourceResult.success
          ? sourceResult.implementation
          : null,
      },
    };
  }

  /**
   * Get contract function signatures
   */
  async getContractFunctions(contractAddress) {
    const abiResult = await this.getContractABI(contractAddress);

    if (!abiResult.success) {
      return {
        success: false,
        error: abiResult.error,
      };
    }

    const functions = abiResult.abi
      .filter((item) => item.type === "function")
      .map((func) => ({
        name: func.name,
        stateMutability: func.stateMutability,
        inputs: func.inputs,
        outputs: func.outputs,
      }));

    const events = abiResult.abi
      .filter((item) => item.type === "event")
      .map((event) => ({
        name: event.name,
        inputs: event.inputs,
      }));

    return {
      success: true,
      functions,
      events,
      totalFunctions: functions.length,
      totalEvents: events.length,
    };
  }
}

/**
 * MCP Tools for AI Integration
 */
const mcpTools = {
  /**
   * Tool: Get Contract ABI
   */
  async getContractABI(contractAddress, chainApiUrl) {
    const mcp = new BlockscoutMCP(chainApiUrl);
    return await mcp.getContractABI(contractAddress);
  },

  /**
   * Tool: Validate Trade Idea Contract
   */
  async validateTradeIdeaContract(contractAddress, chainApiUrl) {
    const mcp = new BlockscoutMCP(chainApiUrl);
    const validation = await mcp.validateContract(contractAddress);

    return {
      isValid: validation.isVerified && validation.hasSource,
      canCreatePrediction: validation.validation.canInteract,
      contractInfo: {
        name: validation.contractName,
        isProxy: validation.validation.isProxy,
        implementation: validation.validation.implementation,
      },
      recommendation: validation.isVerified
        ? "Contract is verified and safe to interact with"
        : "Warning: Contract is not verified. Proceed with caution.",
    };
  },

  /**
   * Tool: Get Transaction Status for Chat
   */
  async getTransactionStatusForChat(txHash, chainApiUrl) {
    const mcp = new BlockscoutMCP(chainApiUrl);
    const status = await mcp.getTransactionStatus(txHash);

    if (status.success) {
      return {
        txHash,
        status: status.message,
        explorerUrl: `${chainApiUrl.replace("/api", "")}/tx/${txHash}`,
        message:
          status.message === "Success"
            ? "✅ Transaction confirmed successfully!"
            : "❌ Transaction failed. Check the explorer for details.",
      };
    } else {
      return {
        txHash,
        status: "Unknown",
        error: status.error,
      };
    }
  },

  /**
   * Tool: Get Contract Functions for AI
   */
  async getContractFunctionsForAI(contractAddress, chainApiUrl) {
    const mcp = new BlockscoutMCP(chainApiUrl);
    const functions = await mcp.getContractFunctions(contractAddress);

    if (!functions.success) {
      return {
        error: functions.error,
        canAnalyze: false,
      };
    }

    // Analyze functions for prediction compatibility
    const readFunctions = functions.functions.filter(
      (f) => f.stateMutability === "view" || f.stateMutability === "pure"
    );

    const writeFunctions = functions.functions.filter(
      (f) =>
        f.stateMutability === "nonpayable" || f.stateMutability === "payable"
    );

    return {
      canAnalyze: true,
      summary: {
        totalFunctions: functions.totalFunctions,
        readFunctions: readFunctions.length,
        writeFunctions: writeFunctions.length,
        events: functions.totalEvents,
      },
      functions: {
        read: readFunctions.map((f) => f.name),
        write: writeFunctions.map((f) => f.name),
      },
      events: functions.events.map((e) => e.name),
      predictionSuggestions: this.generatePredictionSuggestions(
        functions.functions
      ),
    };
  },

  /**
   * Generate prediction suggestions based on contract functions
   */
  generatePredictionSuggestions(functions) {
    const suggestions = [];

    // Look for price/value related functions
    const priceRelated = functions.filter(
      (f) =>
        f.name.toLowerCase().includes("price") ||
        f.name.toLowerCase().includes("value") ||
        f.name.toLowerCase().includes("rate")
    );

    if (priceRelated.length > 0) {
      suggestions.push({
        type: "Price Movement",
        description: `Contract has ${priceRelated.length} price-related functions that can be tracked`,
        functions: priceRelated.map((f) => f.name),
      });
    }

    // Look for balance functions
    const balanceRelated = functions.filter(
      (f) =>
        f.name.toLowerCase().includes("balance") ||
        f.name.toLowerCase().includes("supply")
    );

    if (balanceRelated.length > 0) {
      suggestions.push({
        type: "Balance/Supply Tracking",
        description: `Contract has ${balanceRelated.length} balance-related functions`,
        functions: balanceRelated.map((f) => f.name),
      });
    }

    return suggestions;
  },
};

module.exports = {
  BlockscoutMCP,
  mcpTools,
};
