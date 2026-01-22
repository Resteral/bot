"use client";

import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { Activity, Wallet, Play, Square, TrendingUp, DollarSign } from "lucide-react";

interface TokenPrice {
  symbol: string;
  priceUsd: number;
  change24h: number;
}

interface WalletState {
  balance: number;
  publicKey: string;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [prices, setPrices] = useState<TokenPrice[]>([]);
  const [wallet, setWallet] = useState<WalletState>({ balance: 0, publicKey: "Loading..." });
  const [tradeAmount, setTradeAmount] = useState<string>("0.01");
  const [targetToken, setTargetToken] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Connect to Backend (Ensure port matches env but hardcoded for dev now)
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      addLog("Connected to Bot Engine");
    });

    newSocket.on("walletUpdate", (data) => {
      // Handle full wallet updates if needed, for now just catching what we can
    });

    newSocket.on("priceUpdate", (data: TokenPrice[]) => {
      setPrices(data);
    });

    // Initial fetch
    fetchStatus();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 10));
  };

  const fetchStatus = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/status");
      setWallet({
        balance: res.data.balance,
        publicKey: res.data.publicKey
      });
      addLog(`Wallet loaded: ${res.data.publicKey.slice(0, 6)}...`);
    } catch (e) {
      addLog("Error fetching status. Is backend running?");
    }
  };

  const handleTrade = async () => {
    if (!targetToken) {
      addLog("Error: Enter a token address");
      return;
    }

    addLog(`Initiating trade for ${tradeAmount} SOL...`);
    try {
      const res = await axios.post("http://localhost:3001/api/trade", {
        inputMint: "So11111111111111111111111111111111111111112", // SOL
        outputMint: targetToken,
        amount: parseFloat(tradeAmount) * 1_000_000_000 // Convert to Lamports
      });

      if (res.data.success) {
        addLog(`Trade Success! Tx: ${res.data.txid.slice(0, 8)}...`);
      }
    } catch (e) {
      addLog("Trade Failed. Check backend logs.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          MemeBot 9000
        </h1>
        <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-700">
          <Wallet className="text-purple-400" />
          <div className="text-sm">
            <div className="text-slate-400 h-4">Balance</div>
            <div className="font-bold font-mono">{wallet.balance.toFixed(4)} SOL</div>
          </div>
          <div className="text-xs text-slate-500 font-mono ml-2 border-l border-slate-700 pl-2">
            {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Market Monitor */}
        <section className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-400" />
            <h2 className="text-xl font-bold">Live Market</h2>
          </div>

          <div className="space-y-3">
            {prices.length === 0 ? (
              <div className="text-slate-500 italic text-center py-8">Waiting for price feeds...</div>
            ) : prices.map((token) => (
              <div key={token.symbol} className="flex justify-between items-center p-3 bg-slate-800 rounded hover:bg-slate-750 transition-colors">
                <span className="font-bold text-lg">{token.symbol}</span>
                <div className="text-right">
                  <div className="font-mono text-xl">${token.priceUsd.toFixed(6)}</div>
                  <div className={`${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'} text-xs`}>
                    {token.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Control Panel */}
        <div className="space-y-8">
          <section className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-blue-400" />
              <h2 className="text-xl font-bold">Manual Trade</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider">Target Token (Address)</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 font-mono text-sm focus:border-purple-500 outline-none transition-colors"
                  placeholder="Ep9... or similar"
                  value={targetToken}
                  onChange={(e) => setTargetToken(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider">Amount (SOL)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 pl-10 font-mono text-sm focus:border-purple-500 outline-none transition-colors"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleTrade}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4" /> BUY
                </button>
                <button className="flex-1 bg-red-500 hover:bg-red-600 text-black font-bold py-3 rounded flex items-center justify-center gap-2 transition-transform active:scale-95">
                  <Square className="w-4 h-4" /> SELL
                </button>
              </div>
            </div>
          </section>

          {/* Logs */}
          <section className="bg-black/50 rounded-xl p-4 border border-slate-800 h-48 overflow-y-auto mix-blend-screen text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 text-slate-300">
                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
