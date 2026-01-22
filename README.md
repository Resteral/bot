# Meme Coin Trading Bot - Quick Start

## 1. Setup
### Backend
- Navigate to `meme-bot-engine`
- Create a `.env` file (if not exists) and add your Solana Private Key:
  ```
  PRIVATE_KEY=your_base58_private_key_here
  PORT=3001
  ```
- Install dependencies: `npm install`
- Start the server: `npm start` (or `npx ts-node src/server.ts`)

### Frontend
- Navigate to `meme-bot-dashboard`
- Install dependencies: `npm install`
- Start the dashboard: `npm run dev`
- Open http://localhost:3000

## 2. Usage
- **Wallet**: Your SOL balance and Public Key are shown in the top right.
- **Market**: Live prices of tracked tokens are shown on the left.
- **Trade**: Enter a token address (Mint Address) and amount to swap SOL for that token via Jupiter.

## 3. TrustWallet Integration
- Copy the **Public Key** displayed on the dashboard (or locally in the backend console).
- Open TrustWallet -> Add Wallet -> Import -> Solana.
- Paste your **Public Key** (Watch Only) OR your **Private Key** (Full Access) to see the same funds.
