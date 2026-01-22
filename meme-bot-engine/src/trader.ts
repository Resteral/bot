import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import { WalletManager } from "./wallet";
import { SupabaseManager } from "./supabase";

export class Trader {
    private connection: Connection;
    private walletManager: WalletManager;
    private supabaseManager: SupabaseManager;
    private readonly JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6/quote";
    private readonly JUPITER_SWAP_API = "https://quote-api.jup.ag/v6/swap";

    constructor(walletManager: WalletManager, supabaseManager: SupabaseManager) {
        this.walletManager = walletManager;
        this.supabaseManager = supabaseManager;
        this.connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    }

    async getQuote(inputMint: string, outputMint: string, amount: number) {
        // Amount must be in smallest unit (lamports/decimals)
        // For simplicity, we assume generic decimals for now or pass exact integer amount
        try {
            const params = {
                inputMint,
                outputMint,
                amount,
                slippageBps: 50, // 0.5% slippage
            };
            const response = await axios.get(this.JUPITER_QUOTE_API, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching quote:", error);
            return null;
        }
    }

    async executeSwap(quoteResponse: any) {
        try {
            const keypair = this.walletManager.getKeypair();

            // 1. Get serialized transaction from Jupiter
            const { data: { swapTransaction } } = await axios.post(this.JUPITER_SWAP_API, {
                quoteResponse,
                userPublicKey: keypair.publicKey.toString(),
                wrapAndUnwrapSol: true,
            });

            // 2. Deserialize and sign
            const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            transaction.sign([keypair]);

            // 3. Send raw transaction
            const rawTransaction = transaction.serialize();
            const txid = await this.connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
                maxRetries: 2,
            });

            console.log(`Swap sent! TxId: https://solscan.io/tx/${txid}`);

            // Log to Supabase
            if (this.supabaseManager) {
                const inMint = quoteResponse.inputMint || "Unknown";
                const outMint = quoteResponse.outputMint || "Unknown";
                const inAmount = quoteResponse.inAmount || "0";

                await this.supabaseManager.logTrade(txid, inMint, outMint, parseInt(inAmount));
            }

            return txid;
            const confirmation = await this.connection.confirmTransaction(txid);
            if (confirmation.value.err) {
                console.error("Transaction failed:", confirmation.value.err);
                return null;
            }

            return txid;
        } catch (error) {
            console.error("Error executing swap:", error);
            return null;
        }
    }
}
