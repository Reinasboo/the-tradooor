# 🔧 Troubleshooting

Common issues, solutions, and debug techniques.

---

## Installation & Setup

### "npm install fails with peer dependency error"

```
npm ERR! peer dep missing: @solana/wallet-adapter-base
```

**Solution:**
```bash
npm install --legacy-peer-deps
```

This allows Solana packages with conflicting peer dependencies to coexist.

---

### "Node/npm version too old"

```
This version of npm only supports Node >= 16.13.0, <17.0.0
```

**Solution:**
```bash
# Check version
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0

# Update Node.js
# Windows: Download from https://nodejs.org/
# macOS: brew install node
# Linux: sudo apt update && sudo apt install nodejs
```

---

### "Cannot find module '@solana/web3.js'"

```
Error: Cannot find module '@solana/web3.js'
```

**Solution:**
1. Delete node_modules and package-lock.json:
```bash
rm -rf node_modules package-lock.json
```

2. Reinstall:
```bash
npm install --legacy-peer-deps
```

3. Verify installation:
```bash
npm list @solana/web3.js
```

---

## Configuration

### "API Key Invalid (401 Unauthorized)"

```
Error: 401 Unauthorized from GMGN API
```

**Checklist:**
- [ ] GMGN_API_KEY is set in .env
- [ ] Key starts with `gmgn_sk_` (not `gmgn_pk_`)
- [ ] Key is complete (no truncation)
- [ ] No spaces around the key
- [ ] Haven't regenerated the key in GMGN dashboard

**Solution:**
```bash
# 1. Verify .env file
cat .env | grep GMGN_API_KEY

# 2. Check for spaces or special characters
# Should look like: GMGN_API_KEY=gmgn_sk_xxxxx

# 3. Regenerate key at https://api.gmgn.ai
# 4. Update .env and restart
npm run dev
```

---

### "RPC Connection Failed"

```
Error: ECONNREFUSED at https://api.mainnet-beta.solana.com
```

**Checklist:**
- [ ] SOLANA_RPC_URL is set
- [ ] URL is valid and reachable
- [ ] No rate limiting (public RPC has limits)
- [ ] Internet connection working

**Solution:**
```bash
# 1. Test RPC endpoint directly
curl https://api.mainnet-beta.solana.com -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# 2. If rate limited, switch to Helius or QuickNode
# 3. Or use local validator if testing

# 4. Update .env
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# 5. Restart bot
npm run dev
```

---

### "Private Key Invalid"

```
Error: Invalid private key format
```

**Checklist:**
- [ ] Key is base58 format (not hex or bytes)
- [ ] Key is 88 characters long
- [ ] No spaces or special characters
- [ ] Exported from Phantom/Solflare correctly

**Solution:**
```bash
# 1. Verify key format (should be all alphanumeric base58)
cat .env | grep SOLANA_WALLET_PRIVATE_KEY

# 2. If using Phantom:
# - Settings → Security & Privacy → Export Private Key
# - Verify it matches your .env

# 3. If still invalid, create new wallet:
# npm install -g @solana/cli
# solana-keygen new
# solana-keygen show

# 4. Update .env and restart
npm run dev
```

---

## Runtime Issues

### "Bot won't start"

```
Error: Failed to initialize bot
```

**Debug steps:**

1. Check configuration is valid:
```bash
npm run build
```

2. If build fails, check TypeScript errors:
```bash
npm run type-check
```

3. Run with verbose logging:
```bash
LOG_LEVEL=debug npm run dev
```

4. Check all required environment variables:
```bash
echo $GMGN_API_KEY
echo $SOLANA_RPC_URL
echo $SOLANA_WALLET_PRIVATE_KEY
```

5. Verify files exist:
```bash
ls -la src/
ls -la .env
```

---

### "No signals generated"

```
Scanned 42 tokens, generated 0 signals
```

**Possible causes:**

1. **Filters too strict:**
```env
# Decrease thresholds
MIN_LIQUIDITY_SOL=5       # Was 50
MAX_PRICE_INCREASE_PCT=1000  # Was 200
MIN_HOLDER_COUNT=20       # Was 200
```

2. **Check signal score calculation:**
```bash
LOG_LEVEL=debug npm run dev | grep "Score"
```

3. **Market conditions:**
- Low volatility = fewer signals
- Weekend = fewer tokens launching

**Solution:**
- Run in dry-run mode longer (2+ hours)
- Adjust filters gradually
- Check if GMGN API is returning tokens:
```bash
curl "https://api.gmgn.ai/api/v1/trending/tokens?limit=10"
```

---

### "Signals generated but no trades executed"

```
[BUY Signal] TOKEN1 (confidence: 0.78)
[EXECUTION] Buying TOKEN1
Error: Insufficient wallet balance
```

**Checklist:**
- [ ] Wallet has SOL balance
- [ ] ENABLE_AUTO_TRADING=true in .env
- [ ] TRADING_AMOUNT_SOL > 0
- [ ] Enough SOL to cover transaction + gas

**Solution:**
```bash
# 1. Check wallet balance
# Use Phantom Wallet or:
curl "https://api.mainnet-beta.solana.com" \
  -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"getBalance\",\"params\":[\"YOUR_WALLET\"],\"id\":1}"

# 2. Airdrop SOL (devnet only):
# solana airdrop 10 YOUR_WALLET

# 3. Fund wallet with real SOL

# 4. Reduce trading amount
TRADING_AMOUNT_SOL=0.01   # Start small

# 5. Restart
npm run dev
```

---

### "High slippage / bad execution prices"

```
[EXECUTION] Expected output: 1000 tokens, Got: 950 tokens
```

**Causes:**
- Large position relative to liquidity
- Sandwiched by MEV bots
- Price moved between quote and execution

**Solutions:**

1. **Reduce position size:**
```env
TRADING_AMOUNT_SOL=0.05     # Smaller positions
MAX_POSITION_SIZE_PCT=2     # Stricter limit
```

2. **Enable MEV protection:**
```env
ENABLE_MEV_PROTECTION=true
JITO_TIP_SOL=0.005
```

3. **Increase liquidity filter:**
```env
MIN_LIQUIDITY_SOL=50        # Higher liquidity only
```

4. **Use split routing:**
Will automatically split large orders.

---

### "Bot crashes randomly"

```
Fatal error: Segmentation fault
Process exited with code 139
```

**Debug:**

1. Check logs for errors:
```bash
npm run dev | tee bot.log
# Look for error messages before crash
```

2. Enable verbose logging:
```bash
LOG_LEVEL=debug npm run dev 2>&1 | tee bot-debug.log
```

3. Check memory usage:
```bash
# On crash, check if out of memory
top -o %MEM | grep node
```

4. Common causes:
- Memory leak in indicator calculation
- Infinite loop in analysis
- RPC connection timeout

5. **Solution:**
- Restart bot (auto-recovery with PM2)
- Check for memory leaks: `npm run build`
- Switch to different RPC endpoint
- Reduce scan frequency

---

### "DEX Routing fails"

```
Error: Unable to find route for TOKEN1 → TOKEN2
```

**Solution:**
```env
# Use simpler trading pairs
# Try: TOKEN → USDC → SOL instead of direct

# Check if token has liquidity
MIN_LIQUIDITY_SOL=50

# Alternative DEXs:
# - Jupiter (default, best)
# - Orca (good for large orders)
# - Raydium (direct swaps)
```

---

## Testing

### "Tests fail on build"

```
FAIL  test/indicators.test.ts
  ✕ RSI Calculation (should output 0-100)
```

**Solution:**
```bash
# 1. Clear cache
npm run clean

# 2. Rebuild
npm run build

# 3. Run tests with verbose output
npm test -- --verbose

# 4. Check specific test
npm test -- indicators.test.ts
```

---

### "Coverage report missing"

```
npm test -- --coverage
# No coverage directory created
```

**Solution:**
```bash
# 1. Check if jest is installed
npm list jest

# 2. If not, reinstall
npm install --save-dev jest ts-jest @types/jest

# 3. Run coverage
npm run test:coverage

# 4. View report
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

---

## Monitoring & Debugging

### "Can't see live logs"

**Solution:**
```bash
# Terminal 1: Start bot
npm run dev

# Terminal 2: Follow logs in real-time
tail -f bot.log

# Or filter by type
tail -f bot.log | grep "BUY"
tail -f bot.log | grep "Error"
tail -f bot.log | grep "Execution"

# Or with grep on running bot
npm run dev | grep "Signal"
```

---

### "Need to debug signal calculation"

**Solution:**
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Look for output like:
# [DEBUG] Technical score: 0.72
# [DEBUG] On-chain score: 0.85
# [DEBUG] ML score: 0.75
# [DEBUG] Composite: 0.77 (BUY)

# Or add custom logging in src/strategy.ts:
logger.debug("Score breakdown", {
  technical: scores.technical,
  onchain: scores.onchain,
  ml: scores.ml,
  composite: compositeScore
});
```

---

### "Performance is slow"

**Checklist:**
- [ ] Running on SSD (not HDD)
- [ ] Not 100% CPU usage
- [ ] Not out of memory
- [ ] RPC endpoint is fast

**Debug:**
```bash
# Check CPU/Memory
top     # macOS/Linux
taskmgr # Windows

# If slow, profile with:
node --prof src/index.ts
node --prof-process isolate-*.log > profile.txt
```

---

## Networking

### "Rate limiting from GMGN API"

```
Error: 429 Too Many Requests
```

**Solution:**
```bash
# Reduce scan frequency
# In bot.ts, increase interval:
setInterval(async () => {
  await bot.tick();
}, 60000);  # Increased from 30s to 60s

# Or get API tier upgrade
# Visit https://api.gmgn.ai
```

---

### "Firewall / Proxy blocking connection"

```
Error: ECONNREFUSED
```

**Solution:**
```bash
# 1. Check if behind proxy:
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 2. If yes, set proxy for npm:
npm config set proxy [http://proxy.company.com:8080]
npm config set https-proxy [http://proxy.company.com:8080]

# 3. For Solana RPC behind firewall:
# Use Helius or QuickNode (handles proxies)
# Or set up local validator

# 4. Check firewall rules
# Allow outbound to: api.gmgn.ai, mainnet.helius-rpc.com
```

---

## Git & Version Control

### "Git won't commit due to pre-commit hook"

```
husky > pre-commit hook failed
```

**Solution:**
```bash
# Run linter manually
npm run lint

# Fix issues
npm run lint:fix

# Try commit again
git commit -m "message"
```

---

## Recovery

### "Recover from crash"

```bash
# 1. Check bot state
ls -la logs/
tail -100 logs/bot.log

# 2. Restart bot
npm run dev

# 3. Or with PM2:
pm2 restart tradooor

# 4. Check for stuck positions:
# Review positions in logs for "PENDING"
# May need to manually close
```

---

### "Wallet transaction stuck"

```
Transaction signature: 4xkY9s2...
Status: UNKNOWN (pending for 30+ minutes)
```

**Solution:**
```bash
# 1. Check transaction status:
# https://explorer.solana.com/tx/SIGNATURE

# 2. If confirmed: No action needed
# If failed: Bot will retry

# 3. If truly stuck (very rare):
# Create new transaction with same instruction
# Don't double-spend funds
```

---

## Getting Help

### Debug Checklist
- [ ] Ran `npm run build` successfully?
- [ ] Ran `npm test` - all tests passing?
- [ ] Verified `.env` has all required keys?
- [ ] Checked API keys are valid?
- [ ] RPC endpoint is reachable?
- [ ] Wallet has SOL balance?
- [ ] Running on Node.js 18+?
- [ ] Ran with `--legacy-peer-deps`?

### Enable Debug Mode
```bash
# Maximum verbosity for troubleshooting
LOG_LEVEL=trace npm run dev 2>&1 | tee debug.log

# After reproducing issue, review debug.log
```

### Report Issues
Create issue with:
- [ ] Error message (full stack trace)
- [ ] Last 50 lines of logs
- [ ] `.env` (with API keys redacted!)
- [ ] Node/npm versions
- [ ] OS and platform
- [ ] Steps to reproduce

---

## Common Messages

| Message | Meaning | Action |
|---------|---------|--------|
| "Scanned 42 tokens, generated 0 signals" | Filters too strict | Relax filters |
| "Insufficient wallet balance" | Need more SOL | Fund wallet |
| "API rate limit exceeded" | Too many requests | Wait or upgrade |
| "Connection timeout" | RPC endpoint down | Switch endpoint |
| "Invalid signal" | Score calculation error | Check strategy |
| "Transaction failed" | Execution error | Check logs |

---

## Still Stuck?

1. **Check docs:**
   - [SETUP.md](SETUP.md) - Installation issues
   - [CONFIG.md](CONFIG.md) - Configuration issues
   - [USAGE.md](USAGE.md) - Running issues
   - [API.md](API.md) - Development issues

2. **Search issues:** https://github.com/Reinasboo/the-tradooor/issues

3. **Create issue:** Include debug checklist above

---

**Last Updated:** April 16, 2026
