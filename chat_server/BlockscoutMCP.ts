import axios from "axios";

interface AbiResponse {
  success: boolean;
  abi?: any;
  address: string;
  error?: string;
}

interface SourceCodeResponse {
  success: boolean;
  sourceCode?: string;
  contractName?: string;
  compilerVersion?: string;
  optimizationUsed?: string;
  runs?: string;
  constructorArguments?: string;
  evmVersion?: string;
  library?: string;
  licenseType?: string;
  proxy?: string;
  implementation?: string;
  swarmSource?: string;
  error?: string;
}

interface TransactionInfoResponse {
  success: boolean;
  transaction?: any;
  error?: string;
}

interface TransactionStatusResponse {
  success: boolean;
  status?: string;
  text?: string;
  error?: string;
}

interface ValidationResponse {
  address: string;
  isVerified: boolean;
  hasSource: boolean;
  abi: any | null;
  contractName: string | null;
  compilerVersion: string | null;
  validation: {
    canInteract: boolean;
    isProxy: boolean;
    implementation: string | null;
  };
}

interface FunctionSignature {
  name: string;
  stateMutability: string;
  inputs: any[];
  outputs: any[];
}

interface EventSignature {
  name: string;
  inputs: any[];
}

interface ContractFunctionsResponse {
  success: boolean;
  functions?: FunctionSignature[];
  events?: EventSignature[];
  totalFunctions?: number;
  totalEvents?: number;
  error?: string;
}

export class BlockscoutMCP {
  private apiUrl: string;

  constructor(apiUrl = "https://eth-sepolia.blockscout.com/api") {
    this.apiUrl = apiUrl;
  }

  async getContractABI(contractAddress: string): Promise<AbiResponse> {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        address: contractAddress,
      };
    }
  }

  async getContractSource(
    contractAddress: string
  ): Promise<SourceCodeResponse> {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTransactionInfo(txHash: string): Promise<TransactionInfoResponse> {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTransactionStatus(
    txHash: string
  ): Promise<TransactionStatusResponse> {
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
          text: response.data.result.status === "1" ? "Success" : "Failed",
        };
      } else {
        return {
          success: false,
          error: "Transaction receipt not found",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async validateContract(contractAddress: string): Promise<ValidationResponse> {
    const abiResult = await this.getContractABI(contractAddress);
    const sourceResult = await this.getContractSource(contractAddress);

    return {
      address: contractAddress,
      isVerified: abiResult.success,
      hasSource: sourceResult.success,
      abi: abiResult.success ? abiResult.abi : null,
      contractName: sourceResult.success
        ? sourceResult.contractName ?? null
        : null,
      compilerVersion: sourceResult.success
        ? sourceResult.compilerVersion ?? null
        : null,
      validation: {
        canInteract: abiResult.success,
        isProxy: sourceResult.success ? sourceResult.proxy === "1" : false,
        implementation: sourceResult.success
          ? sourceResult.implementation ?? null
          : null,
      },
    };
  }

  async getContractFunctions(
    contractAddress: string
  ): Promise<ContractFunctionsResponse> {
    const abiResult = await this.getContractABI(contractAddress);

    if (!abiResult.success) {
      return {
        success: false,
        error: abiResult.error,
      };
    }

    const functions = abiResult.abi
      .filter((item: any) => item.type === "function")
      .map((func: any) => ({
        name: func.name,
        stateMutability: func.stateMutability,
        inputs: func.inputs,
        outputs: func.outputs,
      }));

    const events = abiResult.abi
      .filter((item: any) => item.type === "event")
      .map((event: any) => ({
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

export const mcpTools = {
  async getContractABI(contractAddress: string, chainApiUrl: string) {
    const mcp = new BlockscoutMCP(chainApiUrl);
    return await mcp.getContractABI(contractAddress);
  },

  async validateTradeIdeaContract(
    contractAddress: string,
    chainApiUrl: string
  ) {
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

  async getTransactionStatusForChat(txHash: string, chainApiUrl: string) {
    const mcp = new BlockscoutMCP(chainApiUrl);
    const status = await mcp.getTransactionStatus(txHash);

    if (status.success) {
      return {
        txHash,
        status: status.text,
        explorerUrl: `${chainApiUrl.replace("/api", "")}/tx/${txHash}`,
        text:
          status.text === "Success"
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

  async getContractFunctionsForAI(
    contractAddress: string,
    chainApiUrl: string
  ) {
    const mcp = new BlockscoutMCP(chainApiUrl);
    const functions = await mcp.getContractFunctions(contractAddress);

    if (!functions.success) {
      return {
        error: functions.error,
        canAnalyze: false,
      };
    }

    const readFunctions = functions.functions!.filter(
      (f) => f.stateMutability === "view" || f.stateMutability === "pure"
    );

    const writeFunctions = functions.functions!.filter(
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
      events: functions.events!.map((e) => e.name),
      predictionSuggestions: this.generatePredictionSuggestions(
        functions.functions!
      ),
    };
  },

  generatePredictionSuggestions(functions: FunctionSignature[]) {
    const suggestions = [];

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
