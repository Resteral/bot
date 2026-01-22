import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { WalletManager } from "./wallet";
import { MarketManager } from "./market";
import { Trader } from "./trader";

import { SupabaseManager } from "./supabase";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Initialize Bot Modules
const walletManager = new WalletManager();
const marketManager = new MarketManager();
const supabaseManager = new SupabaseManager();
const trader = new Trader(walletManager, supabaseManager);

// Initial State
let trackedTokens = ["So11111111111111111111111111111111111111112"]; // Wrapped SOL by default

// REST API
app.get("/api/status", async (req, res) => {
    const balance = await walletManager.getBalance();
    const publicKey = walletManager.getPublicKey().toString();
    res.json({ publicKey, balance, trackedTokens });
});

app.post("/api/trade", async (req, res) => {
    // Basic manual trade endpoint
    const { inputMint, outputMint, amount } = req.body;
    console.log(`Manual trade requested: ${inputMint} -> ${outputMint} (${amount})`);

    const quote = await trader.getQuote(inputMint, outputMint, amount);
    if (!quote) return res.status(500).json({ error: "Failed to get quote" });

    const txid = await trader.executeSwap(quote);
    if (!txid) return res.status(500).json({ error: "Swap failed" });

    res.json({ success: true, txid, url: `https://solscan.io/tx/${txid}` });
});

// Real-time Updates via Socket.IO
io.on("connection", (socket) => {
    console.log("Client connected");

    // Send initial status
    walletManager.getBalance().then(balance => {
        socket.emit("walletUpdate", { pnl: 0, balance, holdings: [] });
    });

    socket.on("trackToken", (tokenAddress) => {
        if (!trackedTokens.includes(tokenAddress)) {
            trackedTokens.push(tokenAddress);
            console.log(`Now tracking: ${tokenAddress}`);
        }
    });
});

// Background Worker: Fetch Prices
setInterval(async () => {
    const prices = [];
    for (const token of trackedTokens) {
        if (token === "So11111111111111111111111111111111111111112") continue; // Skip SOL wrapper logic for now or fetch SOL price
        const priceData = await marketManager.getTokenPrice(token);
        if (priceData) prices.push(priceData);
    }

    if (prices.length > 0) {
        io.emit("priceUpdate", prices);
    }
}, 5000); // Update every 5 seconds

server.listen(PORT, () => {
    console.log(`Bot Engine running on port ${PORT}`);
    console.log(`Wallet Public Key: ${walletManager.getPublicKey().toBase58()}`);
});
