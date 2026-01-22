import axios from "axios";

export interface TokenPrice {
    symbol: string;
    priceUsd: number;
    priceSol: number;
    change24h: number;
}

export class MarketManager {
    private readonly DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens/";

    // Example: Fetch price for a token address
    async getTokenPrice(tokenAddress: string): Promise<TokenPrice | null> {
        try {
            const response = await axios.get(`${this.DEXSCREENER_API}${tokenAddress}`);
            const pairs = response.data.pairs;

            if (!pairs || pairs.length === 0) return null;

            // Get the most liquid pair (usually the first one returned by DexScreener)
            const pair = pairs[0];

            return {
                symbol: pair.baseToken.symbol,
                priceUsd: parseFloat(pair.priceUsd),
                priceSol: parseFloat(pair.priceNative),
                change24h: pair.priceChange.h24
            };
        } catch (error) {
            console.error(`Error fetching price for ${tokenAddress}:`, error);
            return null;
        }
    }
}
