import * as hl from "@nktkas/hyperliquid";

// https://github.com/nktkas/hyperliquid?tab=readme-ov-file#api-reference

const infoClient = new hl.InfoClient({
    transport: new hl.HttpTransport(), // or `WebSocketTransport`
});


export const getAllOpenOrders = async (userAddress: string) => {
    const openOrders = await infoClient.openOrders({ user: userAddress });
    return openOrders;
}

type HistoryProps = {
    asset: string
    interval: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M"
    startTime: string | number
    endTime: string | number
}

export const getCandleSnapshot = async ({ asset, interval, startTime, endTime }: HistoryProps) => {
    if (asset === "BITCOIN") {
        asset = "BTC";
    }
    const res = await infoClient.candleSnapshot({
        coin: asset,
        interval: interval,
        startTime: startTime,
        endTime: endTime
    });

    console.log("🔍 Candle snapshot:", res);

    return res;
}

export const getHighAndLow = async ({ asset, interval, startTime, endTime }: HistoryProps) => {
    console.log("🔍 Getting high and low for asset:", asset, "interval:", interval, "startTime:", startTime, "endTime:", endTime);
    const candles = await getCandleSnapshot({ asset, interval, startTime, endTime });
    console.log("🔍 Candles:", candles);
    const highs = candles.map(c => Number(c.h));
    console.log("🔍 Highs:", highs);
    const lows = candles.map(c => Number(c.l));
    console.log("🔍 Lows:", lows);

    const maxPrice = Math.max(...highs);
    console.log("🔍 Max Price:", maxPrice);
    const minPrice = Math.min(...lows);
    console.log("🔍 Min Price:", minPrice);
    
    // Find the candle with the highest price
    const highCandle = candles.find(c => Number(c.h) === maxPrice);
    // Find the candle with the lowest price  
    const lowCandle = candles.find(c => Number(c.l) === minPrice);
    
    return [
        { price: maxPrice, timestamp: highCandle?.T },
        { price: minPrice, timestamp: lowCandle?.T }
    ];
}

// | Key | Meaning                                     | Example                                  |
// | --- | ------------------------------------------- | ---------------------------------------- |
// | `t` | **Start time** (Unix ms) of the candle      | `1760277600000` → `2025-11-11T12:00:00Z` |
// | `T` | **End time** (Unix ms) of the candle        | `1760281199999` → `2025-11-11T12:59:59Z` |
// | `s` | **Symbol / asset**                          | `"BTC"`                                  |
// | `i` | **Interval**                                | `"1h"` → 1-hour candle                   |
// | `o` | **Open price** — first trade in that hour   | `"111254.0"`                             |
// | `c` | **Close price** — last trade in that hour   | `"112302.0"`                             |
// | `h` | **High price** — max price in that hour     | `"112905.0"`                             |
// | `l` | **Low price** — min price in that hour      | `"111138.0"`                             |
// | `v` | **Volume traded** (in base asset, here BTC) | `"3050.02989"`                           |
// | `n` | **Number of trades** during that candle     | `33307`                                  |