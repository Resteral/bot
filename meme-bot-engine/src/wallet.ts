import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

export class WalletManager {
    private keypair: Keypair;
    private connection: Connection;

    constructor() {
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            console.error("PRIVATE_KEY not found in env, generating a random one for testing...");
            this.keypair = Keypair.generate();
            console.log("New Public Key:", this.keypair.publicKey.toBase58());
            console.log("New Private Key (Save this!):", bs58.encode(this.keypair.secretKey));
        } else {
            try {
                this.keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
            } catch (error) {
                console.error("Invalid PRIVATE_KEY format. Generating random key.");
                this.keypair = Keypair.generate();
            }
        }

        // Use Helius or default mainnet-beta (Mainnet is better for real prices)
        this.connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    }

    getPublicKey(): PublicKey {
        return this.keypair.publicKey;
    }

    getKeypair(): Keypair {
        return this.keypair;
    }

    async getBalance(): Promise<number> {
        try {
            const balance = await this.connection.getBalance(this.keypair.publicKey);
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            console.error("Error fetching balance:", error);
            return 0;
        }
    }
}
