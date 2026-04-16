# 🎮 Usage Guide

How to run The Tradooor and understand its modes.

---

## Running the Bot

### Development Mode (Hot-Reload)
```bash
npm run dev
```
Best for: Development, testing, debugging
- Auto-restarts on file changes
- Detailed logs to console
- Works with .env changes immediately

### Production Mode (Compiled)
```bash
npm run build
npm start
```
Best for: Live trading, deployment, VPS
- Runs optimized code
- Faster execution
- Better performance

---

## Trading Modes

### 1. Dry-Run Mode (Safest - Start Here!)
```bash
ENABLE_DRY_RUN=true npm run dev
```
**What it does:**
- Scans tokens for signals
- Calculates position sizes
- Generates buy/sell signals
- **Does NOT execute any trades**
- Simulates fills at current price

**Use case:** Testing signal quality, validating configuration

**Sample output:**
```
[BUY Signal] TOKEN1 (confidence: 0.78)
  Entry: $0.45
  Position: 0.1 SOL (~2,222 tokens)
  Exit: TP=$0.90, SL=$0.38
  [DRY-RUN] No trade executed
```

### 2. Signal-Only Mode (Recommended First)
```bash
ENABLE_AUTO_TRADING=false npm run dev
```
**What it does:**
- Generates all signals
- Sends alerts (Telegram, Discord)
- Logs signal rationale
- **You manually approve each trade**
- Or copy signals to another system

**Use case:** Manual trading, validation, backup system

**Sample output:**
```
[BUY Signal] TOKEN2 (confidence: 0.82)
  Technical: RSI=28 (oversold) +0.20
  On-Chain: Rug risk=0.15 (low) +0.25
  ML: Winner probability=0.72 +0.25
  → Waiting for manual approval
```

### 3. Automated Mode (Live Trading)
```bash
ENABLE_AUTO_TRADING=true npm start
```
**What it does:**
- Generates signals automatically
- Executes trades immediately
- Manages positions
- Tracks P&L
- Sends execution alerts

**Use case:** Full automation, 24/7 trading

**Sample output:**
```
[BUY Signal] TOKEN3 (confidence: 0.85)
[EXECUTION] Buying TOKEN3
  Amount: 0.1 SOL
  Entry: $1.23
  Route: Jupiter (best price)
  Tx: 4xkY9s2...
[SUCCESS] Bought 81 tokens
  Entry: $1.23
  Position: 81 tokens (~0.1 SOL)
```

---

## Available Commands

### Build & Run
```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Run with hot-reload (development)
npm start          # Run compiled code (production)
```

### Testing
```bash
npm test           # Run full test suite (143/143 tests pass)
npm test -- --testPathPattern="mev"    # Run specific test suite
npm test -- --coverage                  # Generate coverage report
```

**Test Suite Overview:**
- ✅ **143 tests** covering all core components
- ✅ **6 test suites**: indicators, bot-workflow, exit-strategy, position-sizing, mev-protection, gmgn-integration
- ✅ **Full coverage** of trading signals, risk management, MEV protection, and API integration
- ✅ **Runs in ~7-15 seconds**

### Code Quality
```bash
npm run lint       # Check code with ESLint
npm run lint:fix   # Auto-fix linting issues
npm run format     # Format code with Prettier
npm run type-check # TypeScript type checking
```

### Utilities
```bash
npm run clean      # Delete dist/ and coverage/
```

---

## Running 24/7

### Option 1: PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start bot:
```bash
pm2 start npm --name tradooor -- start
```

Monitor:
```bash
pm2 monit tradooor
pm2 logs tradooor
```

### Option 2: Screen (Simple)

```bash
screen -S tradooor npm start
# Ctrl+A, D to detach
# screen -r tradooor to reattach
```

### Option 3: Nohup (Basic)

```bash
nohup npm start > bot.log 2>&1 &
tail -f bot.log
```

---

## Configuration for Different Strategies

### Conservative Strategy (Low Risk)
```env
MIN_LIQUIDITY_SOL=50
MAX_PRICE_INCREASE_PCT=200
MIN_HOLDER_COUNT=200
KELLY_FRACTION=0.1
MAX_POSITION_SIZE_PCT=2
TRADING_AMOUNT_SOL=0.01
```
- Fewer but higher-quality signals
- Small positions
- Very low drawdown risk
- Best for: Testing, learning

### Balanced Strategy (Recommended)
```env
MIN_LIQUIDITY_SOL=10
MAX_PRICE_INCREASE_PCT=500
MIN_HOLDER_COUNT=50
KELLY_FRACTION=0.25
MAX_POSITION_SIZE_PCT=5
TRADING_AMOUNT_SOL=0.1
```
- Moderate signal frequency
- Good win rate
- Manageable risk
- Best for: Most users

### Aggressive Strategy (High Risk)
```env
MIN_LIQUIDITY_SOL=5
MAX_PRICE_INCREASE_PCT=1000
MIN_HOLDER_COUNT=20
KELLY_FRACTION=0.5
MAX_POSITION_SIZE_PCT=10
TRADING_AMOUNT_SOL=1.0
```
- Many signals
- Higher risk
- Greater upside potential
- Best for: Experienced traders with capital

---

## Monitoring

### View Live Logs
```bash
# All logs
npm run dev | tee bot.log

# Only trades
npm run dev | grep "BUY\|SELL"

# Only errors
npm run dev | grep "Error"

# Follow logs from file
tail -f bot.log
```

### Key Metrics to Monitor

```
Daily Metrics:
- Signal count: 10-50 signals/day (baseline)
- Win rate: Track wins vs total signals
- Average win: Size of profitable signals
- Average loss: Size of losing signals
- Profit factor: Total wins / total losses

Weekly Metrics:
- Win rate target: 55%+
- Sharpe ratio target: 2.0+
- Max drawdown: Keep < 30%
- Consistency: Low variance week-to-week

Monthly Metrics:
- ROI: Positive growth month-over-month
- Max drawdown: Never exceed 30%
- P&L: Cumulative profit
```

### Example Monitoring Script
```bash
#!/bin/bash
echo "=== The Tradooor Monitoring ==="

# Today's signals
echo "Today's Signals:"
grep "$(date +%Y-%m-%d)" bot.log | grep "Signal" | wc -l

# Win rate
echo "Win Rate:"
WINS=$(grep "✅ Won" bot.log | tail -20 | wc -l)
LOSSES=$(grep "❌ Lost" bot.log | tail -20 | wc -l)
echo "$WINS wins / $((WINS+LOSSES)) trades"

# Current balance
echo "Current Balance:"
tail -1 bot.log | grep "Balance"

# Errors
echo "Errors (last 5):"
tail -20 bot.log | grep "Error" | tail -5
```

---

## Stopping the Bot

### Graceful Shutdown
```bash
# Press Ctrl+C in terminal
# Bot will close open positions and stop cleanly
```

### Force Stop (PM2)
```bash
pm2 stop tradooor
pm2 delete tradooor
```

### Force Stop (Screen)
```bash
screen -S tradooor -X quit
```

---

## Scaling Up

### Multiple Instances

Run multiple bots on different tokens:
```bash
# Instance 1: Pump & dump tokens
TRADING_CATEGORY=pump npm start &

# Instance 2: DeFi tokens
TRADING_CATEGORY=defi npm start &

# Instance 3: NFT-related tokens
TRADING_CATEGORY=nft npm start &
```

### Multi-Wallet Distribution
```env
ENABLE_MULTI_WALLET=true
WALLET_COUNT=3
```

Creates separate positions across multiple wallets for better fills and lower slippage.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Bot won't start | Check `.env` is configured, run `npm run build` |
| No signals | Increase filter thresholds, check GMGN API |
| Signals but no execution | Check `ENABLE_AUTO_TRADING=true` and wallet balance |
| High slippage | Check liquidity thresholds, use smaller positions |
| Bot crashes | Check logs, restart with `npm start` |

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more.

---

## Next Steps

- Read [CONFIG.md](CONFIG.md) to fine-tune settings
- Check [API.md](API.md) to customize strategy
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
