import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from "dotenv";

dotenv.config();

export class SupabaseManager {
    private supabase: SupabaseClient | null = null;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        } else {
            console.warn("Supabase credentials not found. Trade logging disabled.");
        }
    }

    async logTrade(txId: string, inputMint: string, outputMint: string, amount: number) {
        if (!this.supabase) return;

        const { error } = await this.supabase
            .from('trades')
            .insert({
                tx_hash: txId,
                input_mint: inputMint,
                output_mint: outputMint,
                amount_in: amount,
                timestamp: new Date().toISOString()
            });

        if (error) {
            console.error("Error logging trade to Supabase:", error);
        } else {
            console.log("Trade logged to Supabase.");
        }
    }
}
