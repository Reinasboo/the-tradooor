# 🚀 Setup Guide

Complete step-by-step guide to get The Tradooor running.

---

## Prerequisites

- **Node.js 18.0+** ([Download](https://nodejs.org/))
- **npm 9.0+** (included with Node.js)
- **GMGN API Key** ([Register](https://api.gmgn.ai))
- **Solana RPC URL** (Free: public, Paid: Helius/QuickNode)
- **Solana Wallet** (use dedicated trading wallet, not main)

**Verify versions:**
```bash
node --version  # v18.0.0 or higher
npm --version   # 9.0.0 or higher
```

---

## Step 1: Clone Repository

```bash
git clone https://github.com/Reinasboo/the-tradooor.git
cd the-tradooor
```

---

## Step 2: Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**  
The Solana packages have specific peer dependency constraints. This flag allows compatible versions.

**Installation time:** ~2-5 minutes depending on internet speed

**Verify installation:**
```bash
npm test
# Should output: Test Suites: 6 passed, 6 total
#               Tests: 143 passed, 143 total
```

---

## Step 3: Get API Credentials

### A. GMGN API Key

1. Visit https://api.gmgn.ai
2. Sign up / Log in
3. Generate API key
4. Copy key (format: `gmgn_sk_xxxxx`)
5. Save to `.env` as `GMGN_API_KEY`

### B. Solana RPC URL

**Option 1: Public RPC (Free, Rate-Limited)**
```
https://api.mainnet-beta.solana.com
```
Good for: Testing, low-volume trading

**Option 2: Helius (Recommended, Free Tier)**
- Visit https://helius.dev
- Sign up (free tier: 10,000 requests/day)
- Copy RPC URL
- Good for: Production, up to 100 trades/day

**Option 3: QuickNode (Recommended, Free Tier)**
- Visit https://quicknode.com
- Sign up (free tier available)
- Copy RPC URL
- Good for: High-performance trading

### C. Solana Wallet Private Key

**Option 1: Create New Wallet (Recommended)**
```bash
# Use Phantom, Solflare, or Keypair.generate()
# Export private key (base58 format)
# Save securely
```

**Option 2: Export From Existing Wallet**
- Phantom Wallet: Settings → Security & Privacy → Export Private Key
- Solflare: Same process
- Save to `.env` as `SOLANA_WALLET_PRIVATE_KEY`

⚠️ **WARNING:** Never use your main wallet. Create dedicated trading wallet with limited funds.

---

## Step 4: Create .env File

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
GMGN_API_KEY=gmgn_sk_xxxxxxxxxxxxx
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WALLET_PRIVATE_KEY=your_private_key

# Trading settings
MIN_LIQUIDITY_SOL=10
MAX_PRICE_INCREASE_PCT=500
MIN_HOLDER_COUNT=50

# Mode
ENABLE_DRY_RUN=true         # Start in test mode!
ENABLE_AUTO_TRADING=false   # Don't auto-trade yet
TRADING_AMOUNT_SOL=0.1      # Test amount
```

**Save and close the editor.**

---

## Step 5: Verify Installation

```bash
# Compile TypeScript
npm run build
```

**Expected output:** (no output = success)

```bash
# Run tests
npm test
```

**Expected output:**
```
✅ Phase 1: Technical Indicators
  √ RSI Calculation
  √ MACD Calculation
  √ Bollinger Bands
  √ Trend Direction

Tests: 4 passed, 4 total
Time: ~3 seconds
```

---

## Step 6: Run in Dry-Run Mode

```bash
npm run dev
```

**Expected output:**
```
[INFO] Starting The Tradooor...
[INFO] Configuration loaded
[INFO] Connected to GMGN API
[INFO] Connected to Solana RPC
[INFO] Bot initialization complete
[INFO] Starting scan cycle...

[Every 5s]
Scanned 42 tokens
Generated 3 signals
- TOKEN1: BUY (confidence: 0.78)
- TOKEN2: HOLD (confidence: 0.52)
- TOKEN3: SELL (confidence: 0.21)

[DRY-RUN] No trades executed
```

**Press Ctrl+C to stop.**

---

## Step 7: Monitor for 1-2 Hours

Run the bot for at least 1-2 hours and verify:

✅ Signals are being generated consistently  
✅ No errors in console  
✅ Signal quality seems reasonable  
✅ Bot doesn't crash  

**Example log tracking:**
```bash
# In another terminal
tail -f nohup.out | grep "BUY\|SELL\|Error"

# Count signals
grep -E "BUY|SELL" nohup.out | wc -l

# Should see 1-2 signals per minute
```

---

## Step 8: Review Configuration

Based on dry-run results, adjust `.env`:

**If too many signals:** Increase `MIN_LIQUIDITY_SOL` or `MIN_HOLDER_COUNT`  
**If too few signals:** Decrease filters  
**If signals look bad:** Adjust `MAX_PRICE_INCREASE_PCT`  

See [CONFIG.md](CONFIG.md) for all options.

---

## Step 9: Optional - Enable Notifications

### Telegram Alerts

1. Create Telegram bot: Message [@BotFather](https://t.me/botfather)
2. Command: `/newbot`
3. Follow instructions
4. Copy bot token
5. Add to `.env` as `TELEGRAM_BOT_TOKEN`

Get your chat ID:
1. Message your bot anything
2. Visit: `https://api.telegram.org/bot{TOKEN}/getUpdates`
3. Find `"id": xxxxx` in the chat object
4. Add to `.env` as `TELEGRAM_CHAT_ID`

### Discord Webhook

1. Right-click channel → Edit Channel
2. Integrations → Webhooks → New Webhook
3. Copy webhook URL
4. Add to `.env` as `DISCORD_WEBHOOK_URL`

**Verify notifications:**
```bash
npm run dev
# Should receive alert on first signal
```

---

## Step 10: Ready for Live Trading!

Once satisfied with dry-run results (after 1-2 weeks):

```bash
# Transition to signal-only mode
ENABLE_AUTO_TRADING=false npm run dev

# Or go live (careful!)
ENABLE_AUTO_TRADING=true npm start
```

---

## Troubleshooting

### "API Key Invalid"
```
Error: 401 Unauthorized
```
✓ Check GMGN_API_KEY in `.env`  
✓ Verify key starts with `gmgn_sk_`  
✓ Regenerate key at https://api.gmgn.ai  

### "RPC Connection Failed"
```
Error: ECONNREFUSED
```
✓ Test RPC endpoint directly  
✓ Switch to different RPC  
✓ Verify internet connectivity  

### "No Signals Generated"
```
Scanned 42 tokens, generated 0 signals
```
✓ Filters too strict  
✓ Decrease MIN_LIQUIDITY_SOL  
✓ Increase MAX_PRICE_INCREASE_PCT  
✓ Enable debug: `LOG_LEVEL=debug npm run dev`  

### "npm install fails"
```
npm ERR! peer dep missing
```
✓ Use `npm install --legacy-peer-deps`  
✓ Clear cache: `npm cache clean --force`  

### "Build fails"
```
error TS2307: Cannot find module
```
✓ Delete node_modules: `rm -rf node_modules`  
✓ Reinstall: `npm install --legacy-peer-deps`  
✓ Rebuild: `npm run build`  

---

## Next Steps

- Read [USAGE.md](USAGE.md) for running modes
- Review [CONFIG.md](CONFIG.md) for all options
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for issues
- Read [API.md](API.md) for customization

---

**Setup complete!** 🎉

Your bot is ready to start trading. Remember: test thoroughly before going live!
