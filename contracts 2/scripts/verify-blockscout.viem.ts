// Minimal Blockscout verification script (standard-json-input)

async function main() {
  const api = process.env.BLOCKSCOUT_API_URL!; // e.g. https://sepolia-blockscout/api
  const address = process.env.CONTRACT_ADDR!;
  const chainId = process.env.CHAIN_ID!;
  const source = process.env.SOURCE!; // stringified standard-json-input

  const res = await fetch(`${api}?module=contract&action=verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, chainId, source }),
  });
  const json = await res.json();
  console.log(json);
}

main().catch((e) => { console.error(e); process.exit(1); });


