// Pyth Network price feed interfaces

export interface PythPriceData {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}

export interface PythMetadata {
  slot: number;
  proof_available_time: number;
  prev_publish_time: number;
}

export interface PythParsedPrice {
  id: string;
  price: PythPriceData;
  ema_price: PythPriceData;
  metadata: PythMetadata;
}

export interface PythBinaryData {
  encoding: string;
  data: string[];
}

export interface PythPriceFeed {
  binary: PythBinaryData;
  parsed: PythParsedPrice[];
}

// Helper function to extract price value from Pyth data
export function extractPriceValue(pythData: PythPriceFeed): number | null {
  if (!pythData.parsed || pythData.parsed.length === 0) {
    return null;
  }

  const priceData = pythData.parsed[0].price;
  const price = parseFloat(priceData.price);
  const expo = priceData.expo;
  
  // Apply the exponent to get the actual price
  return price * Math.pow(10, expo);
}

// Helper function to get price confidence
export function extractPriceConfidence(pythData: PythPriceFeed): number | null {
  if (!pythData.parsed || pythData.parsed.length === 0) {
    return null;
  }

  const priceData = pythData.parsed[0].price;
  const conf = parseFloat(priceData.conf);
  const expo = priceData.expo;
  
  return conf * Math.pow(10, expo);
}

// Helper function to get publish time
export function extractPublishTime(pythData: PythPriceFeed): number | null {
  if (!pythData.parsed || pythData.parsed.length === 0) {
    return null;
  }

  return pythData.parsed[0].price.publish_time;
}
