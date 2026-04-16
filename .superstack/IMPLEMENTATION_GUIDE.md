# 🛠️ Implementation Guide & Checklist

**Step-by-step guide to deploy and verify the GMGN Trading Bot**

---

## Phase 1: Setup & Installation

### ✅ Environment Setup

**Step 1.1: Install Node.js**

```bash
# Verify Node.js version
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher

# If not installed
# Download from https://nodejs.org/
```

**Step 1.2: Clone Repository**

```bash
git clone <repo-url> gmgn-trading-bot
cd gmgn-trading-bot
```

**Step 1.3: Install Dependencies**

```bash
npm install --legacy-peer-deps

# This installs:
# - 552 packages
# - @solana ecosystem
# - Testing framework (Jest)
# - Linting tools (ESLint)
# - Formatting tools (Prettier)
# Expected time: 2-5 minutes
```

**Step 1.4: Verify Installation**

```bash
npm run build
# Should complete without errors

npm test
# Should show: Tests: 4 passed, 4 total
```

---

## Phase 2: Configuration

### ✅ API Keys & Credentials

**Step 2.1: Obtain GMGN API Key**

1. Visit https://api.gmgn.ai
2. Sign up / Log in
3. Generate API key
4. Copy key (starts with `gmgn_sk_`)

**Step 2.2: Obtain Solana RPC URL**

Options:
- Public: `https://api.mainnet-beta.solana.com` (rate-limited)
- Helius: https://helius.dev (recommended, 10K requests/day free)
- QuickNode: https://quicknode.com (recommended, fast)

**Step 2.3: Create Solana Wallet**

```bash
# Option A: Use existing wallet
# Export private key from Phantom/Solflare

# Option B: Create new wallet
npm run dev
# Look for "Wallet created" message in logs
# Save private key to secure location
```

⚠️ **WARNING:** Never use a wallet with significant funds for testing!

**Step 2.4: Create .env File**

```bash
cp .env.example .env

# Edit with your credentials
# See .env.example for format
```

**Environment Variables Checklist:**

```bash
# Check all required vars are set
grep -E "^[A-Z_]+=" .env | wc -l
# Should be at least 12 lines

# Validate no empty values
grep "=$" .env
# Should return nothing
```

---

## Phase 3: Testing & Validation

### ✅ Unit Tests

**Step 3.1: Run Test Suite**

```bash
npm test

# Output:
# ✓ Phase 1: Technical Indicators
#   √ RSI Calculation (42ms)
#   √ MACD Calculation (7ms)
#   √ Bollinger Bands (2ms)
#   √ Trend Direction (6ms)
# Tests: 4 passed, 4 total
```

**Step 3.2: Run with Coverage**

```bash
npm test -- --coverage

# Generates coverage report in coverage/
# Open coverage/lcov-report/index.html in browser
```

### ✅ Build Verification

**Step 3.3: Check TypeScript Compilation**

```bash
npm run build

# Should output:
# (no output = success)
# Check dist/ folder created
ls -la dist/

# Should contain:
# - types.js
# - config.js
# - gmgnClient.js
# - strategy.js
# - bot.js
# - indicators/
# - risk/
# - execution/
# - analytics/
```

**Step 3.4: Check Code Quality**

```bash
npm run lint

# Should output:
# (no output = no errors)
```

**Step 3.5: Format Code**

```bash
npm run format

# Fixes formatting issues automatically
```

---

## Phase 4: Dry-Run Mode

### ✅ Run Without Trading

**Step 4.1: Start Dry-Run**

```bash
ENABLE_DRY_RUN=true npm run dev

# Should output:
# [INFO] Starting GMGN Trading Bot...
# [INFO] Loading configuration
# [INFO] Connecting to GMGN API
# [INFO] Connecting to Solana RPC
# [INFO] Bot initialization complete
# [INFO] Starting scan cycle...
```

**Step 4.2: Monitor Log Output**

Look for these messages:

```
✓ Configuration loaded successfully
✓ Connected to GMGN API
✓ Connected to Solana RPC
✓ Starting bot tick cycle (5s interval)

[Sample output after first scan]
Scanned 42 tokens
Generated 3 signals
- TOKEN1: BUY (confidence: 0.78)
- TOKEN2: HOLD (confidence: 0.52)
- TOKEN3: SELL (confidence: 0.21)

No trades executed (DRY_RUN=true)
```

**Step 4.3: Verify Signal Generation**

Run for 1-2 hours and collect:
- Number of signals generated
- Confidence distribution
- Signal types (BUY/SELL/HOLD mix)

**Example tracking:**

```bash
# In another terminal, count signals
tail -f bot.log | grep "BUY\|SELL\|HOLD" | wc -l

# Should show 1-2 signals per minute
```

**Step 4.4: Test Notifications (Optional)**

If Telegram/Discord configured:

```bash
# Should receive alerts for each signal
# Verify message format and content
# Check timestamps are correct
```

---

## Phase 5: Live Trading Preparation

### ✅ Transition to Live Mode

**Step 5.1: Fund Wallet**

```bash
# Add small amount of SOL to trading wallet
# Recommended: $10-50 initially
# Check balance:
solana balance <address>
```

**Step 5.2: Enable Auto-Trading**

```bash
ENABLE_AUTO_TRADING=true TRADING_AMOUNT_SOL=0.01 npm run dev

# Start with tiny position sizes
# Verify trades execute on first signal
```

**Step 5.3: Monitor First Trade**

Checklist:
- [ ] Signal generated
- [ ] Position size calculated
- [ ] Trade executed successfully
- [ ] Transaction confirmed (check Solscan)
- [ ] Notification received
- [ ] Position tracked in logs

**Step 5.4: Exit Verification**

Checklist for exit handling:
- [ ] Exit signal triggered correctly
- [ ] Position exited at stop-loss/TP
- [ ] PnL calculated correctly
- [ ] Exit notification received
- [ ] Trade closed in logs

---

## Phase 6: Performance Monitoring

### ✅ Track Metrics

**Step 6.1: Daily Performance**

Create log summary:

```bash
# Extract from logs
grep -E "PnL|Trade|Signal" bot.log | tail -100

# Record:
# - Total signals
# - Executed trades
# - Win rate
# - Total PnL
# - Largest win
# - Largest loss
```

**Step 6.2: Weekly Analysis**

```bash
# Every Sunday, review:
- Win rate trend (should be 50%+)
- Average trade size
- Average hold time
- Drawdown experienced
- Profit factor
```

**Step 6.3: Monthly Optimization**

```bash
# Review:
- Technical indicator performance
- Risk-adjusted returns (Sharpe ratio)
- Correlation impact
- Exit strategy effectiveness
- Rebalance settings if needed
```

---

## Phase 7: Production Deployment

### ✅ Deploy to VPS

**Step 7.1: Choose Hosting**

Options:
- **AWS EC2** (t3.micro free tier)
- **DigitalOcean** ($4/month droplet)
- **Linode** ($5/month)
- **Heroku** (free tier with limitations)

**Step 7.2: Setup on Linux Server**

```bash
# SSH to server
ssh root@your_server_ip

# Install Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install process manager
sudo npm install -g pm2

# Clone repository
git clone <repo-url> gmgn-trading-bot
cd gmgn-trading-bot
npm install --legacy-peer-deps

# Setup environment
cp .env.example .env
# Edit .env with credentials
nano .env
```

**Step 7.3: Start with PM2**

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gmgn-bot',
    script: './dist/index.js',
    watch: false,
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};
EOF

# Build and start
npm run build
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

**Step 7.4: Setup Auto-Start**

```bash
# On server restart, auto-start bot
pm2 startup
pm2 save

# Verify:
sudo reboot  # Test restart
# Bot should restart automatically
```

**Step 7.5: Setup Monitoring & Alerts**

```bash
# Monitor process
pm2 monit

# View logs
pm2 logs gmgn-bot

# Setup email alerts if process crashes
pm2 install pm2-auto-pull
```

---

## Phase 8: Safety Checklist

### ✅ Before Going Live

**Security:**
- [ ] Private key secured (not in git)
- [ ] API key secured (not in git)
- [ ] .env file in .gitignore
- [ ] No credentials in logs
- [ ] Wallet has limited funds ($10-50 max)

**Functionality:**
- [ ] All tests passing
- [ ] Build completes without errors
- [ ] Dry-run mode works correctly
- [ ] Signals generated consistently
- [ ] Notifications working
- [ ] Position sizing correct

**Risk Management:**
- [ ] Max position size limited (5% of portfolio)
- [ ] Max drawdown threshold set (30%)
- [ ] Stop-loss enabled on all trades
- [ ] Take-profit enabled on all trades
- [ ] Exit logic verified
- [ ] Position monitoring active

**Monitoring:**
- [ ] Logs readable and informative
- [ ] Daily performance tracked
- [ ] Weekly review scheduled
- [ ] Emergency stop procedure clear
- [ ] Phone notifications enabled (if possible)

---

## Troubleshooting Guide

### Common Issues & Solutions

**Issue: "GMGN API connection failed"**

```bash
# Check API key
echo $GMGN_API_KEY | head -c 20

# Verify key starts with gmgn_sk_
# Regenerate if needed from https://api.gmgn.ai

# Check rate limit
grep "rate limit\|429" bot.log
# Wait 1 hour if rate limited
```

**Issue: "Solana RPC timeout"**

```bash
# Test RPC endpoint
curl https://api.mainnet-beta.solana.com \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}'

# If slow, switch to paid RPC (Helius/QuickNode)
```

**Issue: "No signals generated"**

```bash
# Check token filters are not too strict
grep "MIN_LIQUIDITY\|MAX_PRICE\|MIN_HOLDER" .env

# Enable debug logging
LOG_LEVEL=debug npm run dev

# Look for "Token filtered: reason" messages
```

**Issue: "Trades not executing"**

```bash
# Verify ENABLE_AUTO_TRADING=true
grep "ENABLE_AUTO_TRADING" .env

# Check wallet has SOL
solana balance <address>

# Verify transaction construction in logs
grep "Transaction\|Error" bot.log | tail -20
```

**Issue: "High slippage on trades"**

```bash
# Reasons:
# 1. Trading during low liquidity (token-dependent)
# 2. Position size too large relative to liquidity
# 3. DEX routing inefficient

# Solutions:
# - Reduce TRADING_AMOUNT_SOL
# - Increase MIN_LIQUIDITY_SOL filter
# - Multi-hop routing automatically used
```

---

## Performance Benchmarks

### Expected Performance

**Hardware Requirements:**
- CPU: Modern dual-core (1.5+ GHz minimum)
- RAM: 512 MB minimum (1 GB recommended)
- Network: 5 Mbps upload/download minimum
- Uptime: 99%+ critical

**Performance Metrics:**
- Scan cycle: ~5 seconds (configurable)
- Tokens evaluated: 50-100 per cycle
- Analysis latency: 100-200ms per token
- Trade execution: 1-3 seconds (DEX dependent)
- Memory usage: 100-150 MB stable
- CPU usage: 2-5% average

**Example Run:**
```
[Bot started]
[5s] Scanned 42 tokens, 3 signals generated
[10s] Executed 1 trade (TOKEN1 BUY)
[15s] Scanned 38 tokens, 2 signals generated
[20s] Executed 1 trade (TOKEN2 BUY)
[25s] Portfolio monitoring: +1.2% unrealized
```

---

## Deployment Verification

### ✅ Final Checklist

Before considering bot "production ready":

**Week 1: Dry-Run Testing**
- [ ] 40+ hours of dry-run mode
- [ ] 50+ signals generated and analyzed
- [ ] All notification channels working
- [ ] No crashes or errors
- [ ] Logs clean and informative

**Week 2: Small Position Testing**
- [ ] Execute first 5-10 trades
- [ ] Verify exit logic on live positions
- [ ] Confirm PnL calculations
- [ ] Test stop-loss and take-profit
- [ ] Monitor for slippage/fees

**Week 3: Scale Testing**
- [ ] Increase position sizes gradually
- [ ] Monitor portfolio drawdown
- [ ] Verify correlation management
- [ ] Test multi-wallet execution (if enabled)
- [ ] Review performance metrics

**Week 4: Production Readiness**
- [ ] Deploy to VPS if desired
- [ ] Setup monitoring and alerts
- [ ] Create runbooks for common issues
- [ ] Schedule regular reviews
- [ ] Document learnings

---

## Continuous Improvement

### Weekly Optimization Tasks

```bash
# Every Monday:
1. Review bot.log for errors
2. Calculate weekend performance
3. Adjust filters if needed
4. Rebalance positions if needed
5. Review sentiment signals

# Every Thursday:
1. Backup wallet and configs
2. Review GitHub for security updates
3. Check Solana network status
4. Verify RPC endpoint speed
5. Plan next phase features
```

### Monthly Deep Dive

```bash
# First of each month:
1. Backtest updated strategy
2. Analyze signal accuracy
3. Calculate annual ROI projection
4. Review risk management effectiveness
5. Plan Phase 2-4 implementations
```

---

## Emergency Procedures

### Stop the Bot Immediately

```bash
# If using pm2:
pm2 stop gmgn-bot

# If using npm:
Press Ctrl+C

# Verify stopped:
ps aux | grep gmgn-bot
# Should show no running process
```

### Emergency Fund Recovery

```bash
# If bot behaves unexpectedly
1. Stop the bot immediately
2. Export wallet private key
3. Move funds to safe wallet (Phantom)
4. Verify funds transferred
5. Investigate logs for cause
```

---

## Getting Help

**Resources:**
- [GitHub Issues](https://github.com/your-repo/issues)
- [GMGN API Docs](https://api.gmgn.ai/docs)
- [Solana Docs](https://docs.solana.com)
- [Bot Logs](./logs/bot.log)

**Next Steps:**
1. Review [API_REFERENCE.md](./API_REFERENCE.md) for code examples
2. Explore [PROFITABILITY_ROADMAP.md](./PROFITABILITY_ROADMAP.md) for strategy details
3. Join [Discord Community](https://discord.gg/solana)
