# ⚙️ Configuration Reference

Complete guide to all The Tradooor environment variables and settings.

---

## API & Blockchain

### GMGN_API_KEY
**Type:** String  
**Required:** Yes  
**Format:** `gmgn_sk_xxxxx`

GMGN API key for market data access.

```env
GMGN_API_KEY=gmgn_sk_a1b2c3d4e5f6g7h8i9j0
```

Get from: https://api.gmgn.ai

### GMGN_API_BASE_URL
**Type:** URL  
**Default:** `https://api.gmgn.ai`  
**Required:** No

Base URL for GMGN API. Use default unless using custom endpoint.

```env
GMGN_API_BASE_URL=https://api.gmgn.ai
```

### SOLANA_RPC_URL
**Type:** URL  
**Required:** Yes

Solana blockchain RPC endpoint for transaction submission.

Options:
```env
# Free (public)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Recommended (Helius - free tier 10k/day)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Recommended (QuickNode)
SOLANA_RPC_URL=https://your-node-id.solana-mainnet.quiknode.pro/
```

### SOLANA_WALLET_PRIVATE_KEY
**Type:** String (base58)  
**Required:** Yes  
**Format:** 88-character base58 string

Private key of trading wallet. Never commit to git!

```env
SOLANA_WALLET_PRIVATE_KEY=3v1xpZyDKgWTuRCNk3tHXjTKHxR2wJv9c4Nh8kY5n7p8Q9r2s3t4u5V6w7X8y9Z0
```

⚠️ **Security:** Use dedicated wallet with limited funds only.

---

## Trading Filters

These prevent trading bad tokens.

### MIN_LIQUIDITY_SOL
**Type:** Number (SOL)  
**Default:** `10`  
**Range:** 1-1000

Minimum liquidity in SOL required to trade. Higher = safer but fewer signals.

```env
MIN_LIQUIDITY_SOL=10    # Balanced
MIN_LIQUIDITY_SOL=50    # Conservative
MIN_LIQUIDITY_SOL=5     # Aggressive
```

### MAX_PRICE_INCREASE_PCT
**Type:** Number (%)  
**Default:** `500`  
**Range:** 100-10000

Maximum 24h price increase to avoid over-hyped tokens.

```env
MAX_PRICE_INCREASE_PCT=500    # Balanced (5x gain in 24h)
MAX_PRICE_INCREASE_PCT=200    # Conservative (2x gain)
MAX_PRICE_INCREASE_PCT=1000   # Aggressive (10x gain)
```

### MIN_HOLDER_COUNT
**Type:** Number  
**Default:** `50`  
**Range:** 10-10000

Minimum holder count for community validation.

```env
MIN_HOLDER_COUNT=50     # Balanced
MIN_HOLDER_COUNT=200    # Conservative
MIN_HOLDER_COUNT=20     # Aggressive
```

### MIN_VOLUME_24H
**Type:** Number (USD)  
**Default:** `1000`  
**Range:** 100-1000000

Minimum 24h trading volume to ensure liquidity.

```env
MIN_VOLUME_24H=1000     # Balanced
MIN_VOLUME_24H=5000     # Conservative
MIN_VOLUME_24H=500      # Aggressive
```

---

## Risk Management

### PORTFOLIO_SIZE
**Type:** Number (USD)  
**Default:** `10000`

Starting portfolio value. Used for position sizing calculations.

```env
PORTFOLIO_SIZE=10000    # $10k portfolio
PORTFOLIO_SIZE=1000     # $1k (micro)
PORTFOLIO_SIZE=100000   # $100k (macro)
```

### KELLY_FRACTION
**Type:** Decimal (0-1)  
**Default:** `0.25`  
**Recommended:** `0.1-0.5`

Kelly Criterion fraction for position sizing. Lower = more conservative.

```env
KELLY_FRACTION=0.25     # Quarter Kelly (recommended)
KELLY_FRACTION=0.1      # Conservative
KELLY_FRACTION=0.5      # Aggressive
```

Formula: `f* = edge / payoff * kelly_fraction`

### MAX_POSITION_SIZE_PCT
**Type:** Decimal (%)  
**Default:** `5`  
**Range:** 1-20

Maximum position size as % of portfolio.

```env
MAX_POSITION_SIZE_PCT=5     # Max 5% per trade
MAX_POSITION_SIZE_PCT=2     # Conservative
MAX_POSITION_SIZE_PCT=10    # Aggressive
```

### MAX_DRAWDOWN_PCT
**Type:** Decimal (%)  
**Default:** `30`  
**Range:** 10-50

Maximum portfolio drawdown before emergency stop. Safety mechanism.

```env
MAX_DRAWDOWN_PCT=30     # Stop if down 30% from peak
MAX_DRAWDOWN_PCT=15     # Conservative
MAX_DRAWDOWN_PCT=50     # Aggressive
```

---

## Trading Mode

### ENABLE_DRY_RUN
**Type:** Boolean  
**Default:** `true`  
**Values:** `true|false`

Simulate trades without executing.

```env
ENABLE_DRY_RUN=true     # TEST MODE - start here!
ENABLE_DRY_RUN=false    # Ready to trade
```

### ENABLE_AUTO_TRADING
**Type:** Boolean  
**Default:** `false`  
**Values:** `true|false`

Automatically execute signals without manual approval.

```env
ENABLE_AUTO_TRADING=false   # Signals only, manual approval
ENABLE_AUTO_TRADING=true    # Full automation
```

### TRADING_AMOUNT_SOL
**Type:** Decimal (SOL)  
**Default:** `0.1`  
**Range:** 0.01-10

Amount per trade in SOL.

```env
TRADING_AMOUNT_SOL=0.1      # 0.1 SOL (~$20 at $200/SOL)
TRADING_AMOUNT_SOL=0.01     # Conservative ($2)
TRADING_AMOUNT_SOL=1.0      # Aggressive ($200)
```

---

## Notifications

### TELEGRAM_BOT_TOKEN
**Type:** String  
**Required:** No

Telegram bot token for alerts. Get from @BotFather.

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklmnoPQRstuvWXYZ
```

### TELEGRAM_CHAT_ID
**Type:** Number  
**Required:** No

Your Telegram user ID for receiving alerts.

```env
TELEGRAM_CHAT_ID=123456789
```

To find: Message your bot, then visit `https://api.telegram.org/bot{TOKEN}/getUpdates`

### DISCORD_WEBHOOK_URL
**Type:** URL  
**Required:** No

Discord webhook URL for channel notifications.

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/ABCdefGHIjklmnoPQR
```

To create: Right-click channel → Edit → Integrations → Webhooks → New Webhook

---

## Logging & Debugging

### LOG_LEVEL
**Type:** String  
**Default:** `info`  
**Values:** `trace|debug|info|warn|error`

Logging verbosity level.

```env
LOG_LEVEL=info      # Normal (events, trades)
LOG_LEVEL=debug     # Detailed (calculations, API calls)
LOG_LEVEL=trace     # Very detailed (all function calls)
LOG_LEVEL=error     # Errors only
```

### LOG_TRADES
**Type:** Boolean  
**Default:** `true`

Log all trade activity in detail.

```env
LOG_TRADES=true     # Log all trades
LOG_TRADES=false    # Minimal logging
```

### LOG_FILE
**Type:** Boolean  
**Default:** `true`

Save logs to file (logs/bot.log).

```env
LOG_FILE=true       # Write logs to file
LOG_FILE=false      # Console only
```

---

## Advanced Configuration

### BACKTEST_YEARS
**Type:** Number  
**Default:** `1`  
**Range:** 1-10

Years of historical data to use for backtesting.

```env
BACKTEST_YEARS=1    # 1 year of history
```

### BACKTEST_START_BALANCE
**Type:** Number (USD)  
**Default:** `10000`

Starting balance for backtest simulations.

```env
BACKTEST_START_BALANCE=10000
```

### ML_CONFIDENCE_THRESHOLD
**Type:** Decimal (0-1)  
**Default:** `0.6`  
**Range:** 0.3-0.9

Minimum ML model confidence to generate signal.

```env
ML_CONFIDENCE_THRESHOLD=0.6    # Require 60% confidence
ML_CONFIDENCE_THRESHOLD=0.7    # Conservative (70%)
ML_CONFIDENCE_THRESHOLD=0.5    # Aggressive (50%)
```

---

## Sentiment Analysis Weights

Sum of weights must equal 1.0.

### SENTIMENT_ONCHAIN_WEIGHT
**Type:** Decimal (0-1)  
**Default:** `0.5`

Weight for on-chain sentiment (holders, volume, transactions).

```env
SENTIMENT_ONCHAIN_WEIGHT=0.5
```

### SENTIMENT_DISCORD_WEIGHT
**Type:** Decimal (0-1)  
**Default:** `0.25`

Weight for Discord community sentiment.

```env
SENTIMENT_DISCORD_WEIGHT=0.25
```

### SENTIMENT_TWITTER_WEIGHT
**Type:** Decimal (0-1)  
**Default:** `0.15`

Weight for Twitter sentiment.

```env
SENTIMENT_TWITTER_WEIGHT=0.15
```

Example custom weights (must sum to 1.0):
```env
SENTIMENT_ONCHAIN_WEIGHT=0.6
SENTIMENT_DISCORD_WEIGHT=0.2
SENTIMENT_TWITTER_WEIGHT=0.2
```

---

## MEV Protection

### ENABLE_MEV_PROTECTION
**Type:** Boolean  
**Default:** `true`

Enable MEV protection via Jito bundles.

```env
ENABLE_MEV_PROTECTION=true     # Protected execution
ENABLE_MEV_PROTECTION=false    # Faster but exposed to MEV
```

### JITO_TIP_SOL
**Type:** Decimal (SOL)  
**Default:** `0.005`  
**Range:** 0.001-0.1

Jito tip for bundle priority.

```env
JITO_TIP_SOL=0.005      # 0.005 SOL tip (~$1)
JITO_TIP_SOL=0.001      # Cheaper
JITO_TIP_SOL=0.01       # Higher priority
```

---

## Multi-Wallet Execution

### ENABLE_MULTI_WALLET
**Type:** Boolean  
**Default:** `false`

Distribute execution across multiple wallets.

```env
ENABLE_MULTI_WALLET=false  # Single wallet
ENABLE_MULTI_WALLET=true   # Multiple wallets
```

### WALLET_COUNT
**Type:** Number  
**Default:** `1`  
**Range:** 1-10

Number of wallets for distributed execution.

```env
WALLET_COUNT=1      # Single wallet (default)
WALLET_COUNT=3      # 3-wallet distribution
WALLET_COUNT=5      # 5-wallet distribution
```

---

## Configuration Presets

### Conservative Profile
```env
MIN_LIQUIDITY_SOL=50
MAX_PRICE_INCREASE_PCT=200
MIN_HOLDER_COUNT=200
KELLY_FRACTION=0.1
MAX_POSITION_SIZE_PCT=2
MAX_DRAWDOWN_PCT=15
ENABLE_DRY_RUN=true
TRADING_AMOUNT_SOL=0.01
```

### Balanced Profile (Recommended)
```env
MIN_LIQUIDITY_SOL=10
MAX_PRICE_INCREASE_PCT=500
MIN_HOLDER_COUNT=50
KELLY_FRACTION=0.25
MAX_POSITION_SIZE_PCT=5
MAX_DRAWDOWN_PCT=30
ENABLE_DRY_RUN=true
TRADING_AMOUNT_SOL=0.1
```

### Aggressive Profile
```env
MIN_LIQUIDITY_SOL=5
MAX_PRICE_INCREASE_PCT=1000
MIN_HOLDER_COUNT=20
KELLY_FRACTION=0.5
MAX_POSITION_SIZE_PCT=10
MAX_DRAWDOWN_PCT=50
ENABLE_AUTO_TRADING=true
TRADING_AMOUNT_SOL=1.0
```

---

## Validation

All settings are validated on startup:
- API keys checked
- RPC connection tested
- Weights verified (sum to 1.0)
- Ranges validated
- Type checking enforced

Invalid configuration will cause startup error with message explaining the issue.

---

## Next Steps

- See [SETUP.md](SETUP.md) for initial configuration
- Check [USAGE.md](USAGE.md) for running modes
- Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for issues
