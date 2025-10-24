import { mcpTools } from "./BlockscoutMCP";
import { BlockscoutAI } from "./LLMIntegration";

export function extractContractAddresses(text: string): string[] {
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  const matches = text.match(addressRegex);
  return matches ? [...new Set(matches)] : [];
}

export type Intent =
  | "validate"
  | "summarize"
  | "analyze"
  | "predict"
  | "general";

export function detectIntent(message: string): Intent {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("validate") ||
    lowerMessage.includes("check") ||
    lowerMessage.includes("safe")
  ) {
    return "validate";
  }

  if (
    lowerMessage.includes("summarize") ||
    lowerMessage.includes("summary") ||
    lowerMessage.includes("explain") ||
    lowerMessage.includes("what is")
  ) {
    return "summarize";
  }

  if (
    lowerMessage.includes("analyze") ||
    lowerMessage.includes("analysis") ||
    lowerMessage.includes("functions")
  ) {
    return "analyze";
  }

  if (lowerMessage.includes("price") || lowerMessage.includes("prediction")) {
    return "predict";
  }

  return "general";
}

interface PredictionData {
  symbol: string;
  targetPrice: number;
  endTime: string;
  description: string;
}

interface Bet {
  position: "YES" | "NO";
  amount: number;
}

export async function validatePrediction(
  predictionData: PredictionData,
  chainApiUrl: string
) {
  try {
    const ai = new BlockscoutAI();

    const aiValidation = await ai.validatePrediction(
      predictionData,
      {},
      chainApiUrl
    );

    const basicResults = {
      isValid: true,
      issues: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[],
      contractChecks: [] as any[],
    };

    if (
      !predictionData.symbol ||
      !predictionData.targetPrice ||
      !predictionData.endTime
    ) {
      basicResults.isValid = false;
      basicResults.issues.push(
        "Missing required prediction fields (symbol, targetPrice, or endTime)"
      );
    }

    if (predictionData.targetPrice <= 0) {
      basicResults.isValid = false;
      basicResults.issues.push("Target price must be greater than 0");
    }

    const endTime = new Date(predictionData.endTime);
    if (endTime <= new Date()) {
      basicResults.isValid = false;
      basicResults.issues.push("End time must be in the future");
    }

    const addresses = extractContractAddresses(predictionData.description || "");

    for (const address of addresses) {
      try {
        const validation = await mcpTools.validateTradeIdeaContract(
          address,
          chainApiUrl
        );

        basicResults.contractChecks.push({
          address,
          ...validation,
        });

        if (!validation.isValid) {
          basicResults.warnings.push(
            `Contract ${address} is not verified on Blockscout`
          );
        }
      } catch (error: any) {
        basicResults.warnings.push(
          `Could not validate contract ${address}: ${error.message}`
        );
      }
    }

    return {
      aiValidation,
      basicValidation: basicResults,
      combined: {
        isValid: basicResults.isValid,
        hasAI: true,
        addressesFound: addresses.length,
      },
    };
  } catch (error: any) {
    return {
      aiValidation: "AI validation failed: " + error.message,
      basicValidation: {
        isValid: false,
        issues: [error.message],
        warnings: [],
        recommendations: [],
        contractChecks: [],
      },
      combined: {
        isValid: false,
        hasAI: false,
        addressesFound: 0,
      },
    };
  }
}

export async function summarizePrediction(
  predictionData: PredictionData,
  bets: Bet[] = [],
  chainApiUrl: string
) {
  try {
    const ai = new BlockscoutAI();

    const aiSummary = await ai.summarizePrediction(
      predictionData,
      bets,
      {},
      chainApiUrl
    );

    const totalBets = bets.length;
    const yesBets = bets.filter((b) => b.position === "YES").length;
    const noBets = bets.filter((b) => b.position === "NO").length;
    const totalYesAmount = bets
      .filter((b) => b.position === "YES")
      .reduce((sum, b) => sum + b.amount, 0);
    const totalNoAmount = bets
      .filter((b) => b.position === "NO")
      .reduce((sum, b) => sum + b.amount, 0);
    const totalPool = totalYesAmount + totalNoAmount;

    const basicStats = {
      totalBets,
      yesBets,
      noBets,
      totalYesAmount,
      totalNoAmount,
      totalPool,
      yesPercentage:
        totalPool > 0 ? ((totalYesAmount / totalPool) * 100).toFixed(1) : "0",
      noPercentage:
        totalPool > 0 ? ((totalNoAmount / totalPool) * 100).toFixed(1) : "0",
    };

    return {
      aiSummary,
      basicStats,
      combined: {
        hasAI: true,
        totalBets,
        totalPool,
        addressesFound: extractContractAddresses(predictionData.description || "")
          .length,
      },
    };
  } catch (error: any) {
    return {
      aiSummary: "AI summarization failed: " + error.message,
      basicStats: {
        totalBets: bets.length,
        yesBets: bets.filter((b) => b.position === "YES").length,
        noBets: bets.filter((b) => b.position === "NO").length,
        totalPool: bets.reduce((sum, b) => sum + b.amount, 0),
      },
      combined: {
        hasAI: false,
        error: error.message,
      },
    };
  }
}

export function calculateTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return "Expired";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function formatValidationResult(validation: any): string {
  let message = "🤖 **Blockscout AI - Prediction Validation**\n\n";

  if (validation.isValid) {
    message += "✅ **Status:** Valid Prediction\n\n";
  } else {
    message += "❌ **Status:** Invalid Prediction\n\n";
  }

  if (validation.issues.length > 0) {
    message += "**❌ Issues:**\n";
    validation.issues.forEach((issue: string) => {
      message += `• ${issue}\n`;
    });
    message += "\n";
  }

  if (validation.warnings.length > 0) {
    message += "**⚠️ Warnings:**\n";
    validation.warnings.forEach((warning: string) => {
      message += `• ${warning}\n`;
    });
    message += "\n";
  }

  if (validation.contractChecks.length > 0) {
    message += "**🔗 Contract Checks:**\n";
    validation.contractChecks.forEach((check: any) => {
      const status = check.isValid ? "✅" : "❌";
      message += `${status} ${check.address.slice(
        0,
        8
      )}...${check.address.slice(-6)}\n`;
      if (check.contractInfo?.name) {
        message += `   Name: ${check.contractInfo.name}\n`;
      }
      message += `   ${check.recommendation}\n`;
    });
    message += "\n";
  }

  if (validation.recommendations.length > 0) {
    message += "**💡 Recommendations:**\n";
    validation.recommendations.forEach((rec: string) => {
      message += `${rec}\n`;
    });
  }

  return message;
}

export function formatSummaryResult(summary: any): string {
  let message = "🤖 **Blockscout AI - Prediction Summary**\n\n";

  // Overview
  message += "**📊 Overview:**\n";
  message += `• Symbol: ${summary.overview.symbol}\n`;
  message += `• Direction: ${ 
    summary.overview.direction === "LONG"
      ? "📈 LONG (Bullish)"
      : "📉 SHORT (Bearish)"
  }
`;
  message += `• Target Price: $${summary.overview.targetPrice}\n`;
  message += `• Time Remaining: ${summary.overview.timeRemaining}\n\n`;

  // Statistics
  message += "**📈 Statistics:**\n";
  message += `• Total Bets: ${summary.statistics.totalBets}\n`;
  message += `• Total Pool: $${summary.statistics.totalPool.toFixed(2)}\n`;
  message += `• YES Bets: ${summary.statistics.yesBets} (${
    summary.statistics.yesPercentage
  }% - $${summary.statistics.totalYesAmount.toFixed(2)})
`;
  message += `• NO Bets: ${summary.statistics.noBets} (${
    summary.statistics.noPercentage
  }% - $${summary.statistics.totalNoAmount.toFixed(2)})
\n`;

  // Sentiment
  message += "**🎯 Market Sentiment:**\n";
  message += `• Overall: ${summary.sentiment.overall}\n`;
  message += `• Confidence: ${summary.sentiment.confidence}\n`;
  message += `• ${summary.sentiment.description}\n\n`;

  // Technical Analysis
  if (summary.technicalAnalysis.contractsFound > 0) {
    message += "**🔍 Technical Analysis:**\n";
    message += `• Contracts Found: ${summary.technicalAnalysis.contractsFound}\n`;

    if (
      summary.technicalAnalysis.contracts &&
      summary.technicalAnalysis.contracts.length > 0
    ) {
      summary.technicalAnalysis.contracts.forEach((contract: any) => {
        message += `\n📝 Contract: ${contract.address.slice(
          0,
          8
        )}...${contract.address.slice(-6)}\n`;
        message += `   • Functions: ${contract.functions.totalFunctions} (${contract.functions.readFunctions} read, ${contract.functions.writeFunctions} write)\n`;
        if (contract.suggestions && contract.suggestions.length > 0) {
          message += `   • Suggestions:\n`;
          contract.suggestions.forEach((s: any) => {
            message += `     - ${s.type}: ${s.description}\n`;
          });
        }
      });
      message += "\n";
    }
  }

  // Recommendations
  if (summary.recommendations.length > 0) {
    message += "**💡 Recommendations:**\n";
    summary.recommendations.forEach((rec: string) => {
      message += `${rec}\n`;
    });
  }

  return message;
}