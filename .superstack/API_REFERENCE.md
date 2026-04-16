# 🔌 API Reference & Code Examples

**Complete API documentation for all GMGN Trading Bot modules**

---

## Strategy API

### analyzeToken(token: TokenData, ohlcv?: OHLCV[]): Promise<TradeSignal | null>

Main entry point for signal generation. Combines all analysis layers.

```typescript
import { Strategy } from './src/strategy';
import { GmgnClient } from './src/gmgnClient';
import { createLogger } from './src/logger';

const strategy = new Strategy(gmgnClient, config, logger);

// Analyze a single token
const signal = await strategy.analyzeToken(tokenData, ohlcvData);

if (signal) {
  console.log(`${signal.action} ${tokenData.name}`);
  console.log(`Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
  console.log(`Reason: ${signal.reason}`);
  console.log(`Technical Score: ${signal.technicalScore}`);
  console.log(`On-Chain Score: ${signal.onchainScore}`);
}
```

**Returns:**
```typescript
interface TradeSignal {
  mint: string;                    // Token mint address
  action: 'BUY' | 'SELL' | 'HOLD'; // Signal action
  confidence: number;              // 0-1 confidence
  reason: string;                  // Explanation
  technicalScore: number;          // 0-1 technical
  onchainScore: number;            // 0-1 on-chain
  riskLevel: RiskLevel;            // Risk classification
  suggestedSize: number;           // Position size (SOL)
  entryPrice: number;              // Suggested entry
  stopLoss: number;                // Stop loss price
  takeProfit: number;              // Take profit price
  holdDuration: number;            // Suggested hold (ms)
}
```

---

## Technical Indicators API

All static methods. No instance required.

```typescript
import { TechnicalIndicators } from './src/indicators/technical';

// All prices as number[] (closing prices)
const prices = [100, 102, 101, 103, 105, ...];
const volumes = [1000000, 1050000, ...];
```

### RSI (Relative Strength Index)

```typescript
const rsi = TechnicalIndicators.calculateRSI(prices, 14);
// Returns: 0-100 number

// Interpretation:
// < 30: Oversold (buy signal)
// > 70: Overbought (sell signal)
// 30-70: Neutral
```

### MACD (Moving Average Convergence Divergence)

```typescript
const macd = TechnicalIndicators.calculateMACD(
  prices,
  12,  // Fast EMA period (default)
  26,  // Slow EMA period (default)
  9    // Signal period (default)
);

// Returns:
{
  macd: number;        // MACD line
  signal: number;      // Signal line (EMA of MACD)
  histogram: number;   // MACD - Signal
}

// Interpretation:
// histogram > 0 && increasing: Bullish
// histogram < 0 && decreasing: Bearish
```

### Bollinger Bands

```typescript
const bb = TechnicalIndicators.calculateBollingerBands(
  prices,
  20,  // Period (default)
  2    // StdDev multiplier (default)
);

// Returns:
{
  upper: number;   // Upper band
  middle: number;  // Middle (SMA)
  lower: number;   // Lower band
}

// Interpretation:
// Price at lower band: Oversold
// Price at upper band: Overbought
// Breakout above upper: Bullish reversal
```

### Exponential Moving Average (EMA)

```typescript
const ema12 = TechnicalIndicators.calculateEMA(prices, 12);
const ema21 = TechnicalIndicators.calculateEMA(prices, 21);
const ema200 = TechnicalIndicators.calculateEMA(prices, 200);

// Returns: number (latest EMA value)

// Interpretation:
// Price > EMA: Uptrend
// Price < EMA: Downtrend
// EMA12 > EMA21 > EMA200: Strong uptrend
```

### Simple Moving Average (SMA)

```typescript
const sma50 = TechnicalIndicators.calculateSMA(prices, 50);

// Returns: number (latest SMA value)

// Similar interpretation to EMA
```

### ATR (Average True Range)

```typescript
const atr = TechnicalIndicators.calculateATR(
  prices,
  14  // Period (default)
);

// Returns: number (average volatility)

// Use for:
// - Position sizing (volatile tokens → smaller)
// - Stop loss placement (SL = price - 2×ATR)
// - Entry confirmation
```

### Stochastic Oscillator

```typescript
const stoch = TechnicalIndicators.calculateStochastic(
  prices,
  14,  // Period (default)
  3,   // Smooth K (default)
  3    // Smooth D (default)
);

// Returns:
{
  k: number;  // Stochastic K (0-100)
  d: number;  // Stochastic D (signal line)
}

// Interpretation:
// K < 20 && D < 20: Oversold
// K > 80 && D > 80: Overbought
// K > D: Bullish
```

### OBV (On-Balance Volume)

```typescript
const obv = TechnicalIndicators.calculateOBV(prices, volumes);

// Returns: number (cumulative OBV)

// Interpretation:
// OBV increasing: Volume supports uptrend
// OBV decreasing: Volume supports downtrend
// OBV divergence: Potential reversal
```

### Trend Direction

```typescript
const trend = TechnicalIndicators.getTrendDirection(prices);

// Returns: 'uptrend' | 'downtrend' | 'neutral'

// Uses: EMA200, EMA50, RSI, MACD
// Returns the strongest signal across indicators
```

### Support & Resistance

```typescript
const levels = TechnicalIndicators.calculateSupportResistance(prices);

// Returns:
{
  support1: number;     // Strongest support
  support2: number;     // Secondary support
  resistance1: number;  // Strongest resistance
  resistance2: number;  // Secondary resistance
  pivot: number;        // Pivot point
}
```

---

## Position Sizing API

### calculateKellySize(edge, portfolioSize, fraction)

Base Kelly Criterion calculation.

```typescript
const kellySize = PositionSizer.calculateKellySize(
  edge,        // 0.15 (15% edge: 60% win × $2 - 40% loss × $1)
  10000,       // $10,000 portfolio
  0.25         // Quarter Kelly (safer for crypto)
);

// Returns:
{
  baseSize: number;          // Kelly-calculated size
  percentOfPortfolio: number; // As % of portfolio
}

// Formula: f* = (P × W - (1-P) × L) / W × fraction
```

### calculateVolatilityAdjustedSize(baseSize, atr)

Reduce size when volatility is high.

```typescript
const adjusted = PositionSizer.calculateVolatilityAdjustedSize(
  234,    // Base size from Kelly
  0.15    // ATR (high volatility)
);

// Returns: number (reduced size if volatile)

// Logic:
// High ATR (volatile) → Smaller position
// Low ATR (stable) → Larger position
```

### calculateCorrelationAdjustedSize(baseSize, correlation)

Reduce size when correlated to existing positions.

```typescript
const adjusted = PositionSizer.calculateCorrelationAdjustedSize(
  234,   // Base size
  0.85   // Correlation to existing positions
);

// Returns: number (reduced if correlated)

// Logic:
// Correlation < 0.3: No reduction
// Correlation 0.3-0.7: Moderate reduction
// Correlation > 0.7: Large reduction
```

### calculateDrawdownAdjustedSize(baseSize, currentDrawdown)

Reduce size during portfolio drawdowns.

```typescript
const adjusted = PositionSizer.calculateDrawdownAdjustedSize(
  234,   // Base size
  -15    // Currently down 15%
);

// Returns: number (reduced if in drawdown)

// Safety mechanism during losing streaks
```

### calculateOptimalSize(config)

Complete position sizing with all adjustments.

```typescript
const optimal = PositionSizer.calculateOptimalSize({
  edge: 0.15,
  portfolioSize: 10000,
  volatility: 0.12,        // ATR
  currentDrawdown: -8,
  correlationRisk: 0.55,
  existingExposure: 0.08,  // % of portfolio already exposed
});

// Returns:
{
  optimalSize: number;      // Final size (SOL)
  adjustments: {
    kelly: number;
    volatility: number;
    correlation: number;
    drawdown: number;
  }
}
```

---

## Backtesting API

### backtest(ohlcvData, strategyFn, initialCapital, positionSizer)

```typescript
import { Backtester } from './src/backtest/backtester';

const results = await Backtester.backtest(
  ohlcvData,                    // Array of OHLCV candles
  (ohlcv) => {                  // Strategy function
    const prices = ohlcv.map(c => c.close);
    const rsi = TechnicalIndicators.calculateRSI(prices, 14);
    return rsi < 30;            // Buy signal when oversold
  },
  10000,                        // $10k starting capital
  (size, candles, index) => {   // Position sizer function
    const atr = TechnicalIndicators.calculateATR(
      candles.slice(Math.max(0, index-20), index+1)
        .map(c => c.close),
      14
    );
    return Math.max(50, size * (1 - atr * 0.1));
  }
);

// Returns:
{
  totalTrades: 142,
  winRate: 0.58,                // 58% of trades profitable
  sharpeRatio: 2.14,            // Risk-adjusted return
  maxDrawdown: -15.2,           // Worst peak-to-trough loss
  profitFactor: 2.8,            // Total wins / total losses
  expectancy: 0.0234,           // Average profit per trade
  consecutiveWins: 8,           // Longest win streak
  consecutiveLosses: 3,         // Longest loss streak
  finalBalance: 23_400,         // Ending portfolio value
  totalReturn: 1.34,            // 134% return
  annualizedReturn: 2.68,       // Annualized (in-sample)
  trades: [                      // Detailed trade list
    {
      entryPrice: 0.0123,
      exitPrice: 0.0185,
      size: 250,
      pnl: 155,
      returnPercent: 50.4,
      duration: 3600000,         // ms
      timestamp: 1713264000000
    },
    // ... more trades
  ]
}
```

---

## ML Predictor API

### trainModel(examples)

Train on historical examples.

```typescript
import { MLPredictor } from './src/ml/predictor';

const ml = new MLPredictor();

const examples = [
  {
    features: {
      age: 7200,          // Token age in seconds
      holders: 450,       // Number of holders
      liquidity: 25,      // Liquidity in SOL
      volumeIncrease: 150, // 24h volume increase %
      priceAction: 45,    // 24h price action %
      concentration: 0.25, // Top 10 holder %
    },
    winner: true         // This token became 100x
  },
  {
    features: {
      age: 900,
      holders: 30,
      liquidity: 2,
      volumeIncrease: 1000,
      priceAction: -50,
      concentration: 0.9,
    },
    winner: false        // This token rugpulled
  },
  // ... more examples
];

ml.trainModel(examples);
```

### predictWinProbability(features)

```typescript
const prediction = ml.predictWinProbability({
  age: 3600,
  holders: 250,
  liquidity: 15,
  volumeIncrease: 120,
  priceAction: 35,
  concentration: 0.35,
});

// Returns: 0.72 (72% probability of becoming 100x)
```

### explainPrediction()

```typescript
const explanation = ml.explainPrediction();

// Returns:
{
  topFactors: [
    { feature: 'liquidity', contribution: 0.25 },
    { feature: 'holders', contribution: 0.20 },
    { feature: 'volumeIncrease', contribution: 0.15 },
  ],
  reasoning: "High liquidity (+0.25), solid holder count (+0.20), good volume surge (+0.15)"
}
```

---

## On-Chain Analyzer API

### analyzeHolderDistribution(topHolders)

```typescript
import { OnchainAnalyzer } from './src/onchain/analyzer';

const analysis = OnchainAnalyzer.analyzeHolderDistribution([
  { address: 'holder1', percentage: 12 },
  { address: 'holder2', percentage: 8 },
  { address: 'holder3', percentage: 6 },
  { address: 'lp', percentage: 20 },
  // ... more holders
]);

// Returns:
{
  concentration: 0.35,          // Top 10 hold 35%
  liquidity: 0.20,              // LP pool %
  risk: 'low' | 'medium' | 'high',
  recommendations: "Good distribution, diversified holders"
}
```

### assessRugRiskScore(token)

```typescript
const rugRisk = OnchainAnalyzer.assessRugRiskScore({
  name: 'NEWTOKEN',
  createdAt: new Date(Date.now() - 86400000), // 1 day old
  authority: { isBurned: true },
  mint: { isFrozen: false },
  liquidity: 45,
  holderConcentration: 0.22,
});

// Returns (0-1 score, lower is better):
{
  score: 0.18,                  // Low risk
  ageWeeks: 1,
  authorityBurned: true,        // Good sign
  liquidityLocked: true,        // Good sign
  holderConcentration: 0.22,    // Good distribution
  risk: 'low',
  confidence: 0.92
}
```

---

## Execution APIs

### routingEngine.findBestRoute(tokenIn, tokenOut, amount)

```typescript
import { RoutingEngine } from './src/execution/routingEngine';

const engine = new RoutingEngine();

const route = await engine.findBestRoute(
  'EPjFWdd5Au...',      // Input token (USDC)
  '11111111111...',      // Output token (SOL)
  1000_000_000          // Amount (1M USDC)
);

// Returns:
{
  route: "USDC → RAY → SOL",      // Path
  dex: 'Raydium',
  expectedOutput: 1_234_567_890,
  priceImpact: 0.025,             // 2.5%
  executionTime: 3000,            // ms
  mevRisk: 'low',
  slippage: 0.015                 // 1.5%
}
```

### mevProtection.detectFrontRunRisk(...)

```typescript
import { MEVProtection } from './src/execution/mevProtection';

const risk = MEVProtection.detectFrontRunRisk(
  tokenLiquidity,    // Total liquidity
  tradeAmount,       // Our trade size
  pendingOrders      // Mempool pending
);

// Returns:
{
  riskScore: 0.62,    // 0-1 (higher = riskier)
  recommendation: "Use Jito bundle for atomic execution",
  estimatedSavings: 24.50  // USD savings with protection
}
```

### exitManager.calculateExitSignal(position, rules)

```typescript
import { ExitManager } from './src/execution/exitManager';

const exitSignal = ExitManager.calculateExitSignal(
  {
    entryPrice: 0.0123,
    currentPrice: 0.0198,
    amount: 10_000,
    entryTime: Date.now() - 86400000,  // 1 day old
  },
  {
    stopLossPercent: 5,
    takeProfitPercent: 50,
    trailingStopPercent: 15,
    maxHoldTime: 86400000,             // 24 hours
  }
);

// Returns:
{
  action: 'HOLD' | 'EXIT_TP' | 'EXIT_SL' | 'EXIT_TIME',
  reason: "In profit, no stop conditions met",
  unrealizedProfit: 750,
  recommendedPrice: undefined
}
```

---

## Notification APIs

### notifySignal(signal)

```typescript
import { Notifications } from './src/notifications';

await Notifications.notifySignal({
  mint: 'EPjFWdd5Au...',
  action: 'BUY',
  confidence: 0.78,
  reason: 'Oversold RSI with bullish MACD crossover',
  technicalScore: 0.82,
  onchainScore: 0.74,
  riskLevel: 'medium',
  suggestedSize: 234,
  entryPrice: 0.0123,
  stopLoss: 0.0117,
  takeProfit: 0.0185,
});

// Sends to: Telegram, Discord
// Message includes all signal details with formatting
```

### notifyExecution(execution)

```typescript
await Notifications.notifyExecution({
  mint: 'EPjFWdd5Au...',
  action: 'BUY',
  size: 234,
  entryPrice: 0.0123,
  txHash: 'xxxxxxxxxxxxx',
  timestamp: Date.now(),
  slippage: 0.015,
  fee: 0.001,
});

// Notifies successful execution with transaction details
```

---

## Configuration Examples

### Conservative Strategy (Low Risk)

```env
# Strict filters
MIN_LIQUIDITY_SOL=50
MAX_PRICE_INCREASE_PCT=200
MIN_HOLDER_COUNT=200

# Conservative sizing
KELLY_FRACTION=0.1
MAX_POSITION_SIZE_PCT=2
MAX_DRAWDOWN_PCT=15

# Careful exits
ENABLE_DRY_RUN=true
ENABLE_AUTO_TRADING=false
TRADING_AMOUNT_SOL=0.01
```

### Aggressive Strategy (High Risk)

```env
# Loose filters
MIN_LIQUIDITY_SOL=5
MAX_PRICE_INCREASE_PCT=1000
MIN_HOLDER_COUNT=20

# Aggressive sizing
KELLY_FRACTION=0.5
MAX_POSITION_SIZE_PCT=10
MAX_DRAWDOWN_PCT=50

# Fast execution
ENABLE_AUTO_TRADING=true
TRADING_AMOUNT_SOL=1.0
```

### Balanced Strategy (Recommended)

```env
# Balanced filters
MIN_LIQUIDITY_SOL=10
MAX_PRICE_INCREASE_PCT=500
MIN_HOLDER_COUNT=50

# Balanced sizing
KELLY_FRACTION=0.25
MAX_POSITION_SIZE_PCT=5
MAX_DRAWDOWN_PCT=30

# Monitored execution
ENABLE_DRY_RUN=true
ENABLE_AUTO_TRADING=false
TRADING_AMOUNT_SOL=0.1
```

---

## Error Handling Examples

```typescript
// API errors
try {
  const token = await gmgnClient.getTokenData(mint);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    console.log('Rate limited, backing off...');
  } else if (error.code === 'INVALID_TOKEN') {
    console.log('Token not found');
  }
}

// Strategy errors
try {
  const signal = await strategy.analyzeToken(token);
  if (!signal) {
    console.log('No clear signal for this token');
  }
} catch (error) {
  logger.error({ error }, 'Strategy analysis failed');
}

// Execution errors
try {
  const tx = await executeSignal(signal);
} catch (error) {
  if (error.message.includes('insufficient balance')) {
    console.log('Insufficient SOL balance');
  } else if (error.message.includes('transaction timeout')) {
    console.log('Transaction timed out, may need retry');
  }
}
```

---

## Performance Monitoring

```typescript
// Measure indicator calculation time
console.time('RSI Calculation');
const rsi = TechnicalIndicators.calculateRSI(prices, 14);
console.timeEnd('RSI Calculation');  // ~1-2ms for 100 candles

// Measure strategy time
console.time('Strategy Analysis');
const signal = await strategy.analyzeToken(token, ohlcv);
console.timeEnd('Strategy Analysis');  // ~50-100ms total

// Measure execution time
console.time('Trade Execution');
const tx = await executeSignal(signal);
console.timeEnd('Trade Execution');  // ~1-3 seconds
```
