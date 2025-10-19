// Blockscout verification using standard-json-input built via Hardhat artifacts
import hardhat from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const api = process.env.BLOCKSCOUT_API_URL!; // e.g. https://sepolia-blockscout/api
  const address = process.env.CONTRACT_ADDR!;
  const chainId = process.env.CHAIN_ID || "11155111"; // sepolia
  const contractName = process.env.CONTRACT_NAME || "PredictionFactory";

  const buildInfoPaths: string[] = await hardhat.artifacts.getBuildInfoPaths();
  const buildInfos = await Promise.all(buildInfoPaths.map((p) => fs.promises.readFile(p, "utf8")));

  // Find the build info that contains our contract
  let found: any | null = null;
  for (let i = 0; i < buildInfos.length; i++) {
    const info = JSON.parse(buildInfos[i]);
    const output = info.output?.contracts || {};
    for (const file of Object.keys(output)) {
      if (output[file][contractName]) {
        found = info;
        break;
      }
    }
    if (found) break;
  }
  if (!found) throw new Error(`Build info not found for ${contractName}`);

  const standardJson = JSON.stringify(found.input);

  const res = await fetch(`${api}?module=contract&action=verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, chainId, source: standardJson }),
  });
  const json = await res.json();
  console.log(json);
}

main().catch((e) => { console.error(e); process.exit(1); });


