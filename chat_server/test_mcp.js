const axios = require('axios');
const { BlockscoutMCP } = require('./BlockscoutMCP');

async function test() {
  try {
    const mcp = new BlockscoutMCP();
    const contractAddress = '0x42b71A6f0E2851582352538323151d55CF585639';
    const chainId = 11155111;
    console.log(`Requesting ABI for ${contractAddress} on chain ${chainId}`);
    const result = await mcp.getContractABI(contractAddress, chainId);
    console.log(result);
  } catch (error) {
    console.error("Error in test:", error.message);
  }
}

test();