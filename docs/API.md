# 📡 API Reference

Complete API documentation for The Tradooor modules.

---

## Core Modules

### GmgnClient

Wrapper for GMGN OpenAPI endpoints.

#### getTrendingTokens(limit: number)
Get trending tokens on Solana.

```typescript
const trending = await gmgnClient.getTrendingTokens(20);
// Returns: TokenData[]
// {
//   mint: "EPjFWaLb3oc6aTdh2D...",
//   symbol: "USDC",
//   price: 1.0,
//   marketCap: 5000000000,
//   liquidity: 500000,
//   volume24h: 1000000,
//   priceChange24h: 2.5,
//   holders: 500000
// }
```

#### getTokenData(mint: string)
Get detailed token information.

```typescript
const token = await gmgnClient.getTokenData("EPjFWaLb3oc6aTdh2D...");
// Returns: TokenData with full details
```

#### getTokenHolders(mint: string)
Get top token holders.

```typescript
const holders = await gmgnClient.getTokenHolders("EPjFWaLb3oc6aTdh2D...");
// Returns: HolderInfo[]
// {
//   address: "8xY7z9...",
//   balance: 1000000,
//   percentage: 15.5
// }
```

#### getOHLCV(mint: string, timeframe: "1h" | "4h" | "1d", limit: number)
Get OHLCV candlestick data.

```typescript
const ohlcv = await gmgnClient.getOHLCV("EPjFWaLb3oc6aTdh2D...", "1h", 50);
// Returns: OHLCVData[]
// {
//   timestamp: 1704067200,
//   open: 1.20,
//   high: 1.25,
//   low: 1.18,
//   close: 1.22,
//   volume: 50000
// }
```

---

## Technical Indicators

### calculateRSI(prices: number[], period: number = 14)
Relative Strength Index.

```typescript
import { calculateRSI } from "./indicators/technical";

const rsi = calculateRSI([100, 102, 101, 103, ...], 14);
// Returns: 0-100 (0=oversold, 100=overbought)
// < 30: Oversold (potential buy)
// > 70: Overbought (potential sell)
```

### calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9)
MACD (Moving Average Convergence Divergence).

```typescript
import { calculateMACD } from "./indicators/technical";

const macd = calculateMACD([100, 102, 101, ...]);
// Returns: { line: 0.5, signal: 0.4, histogram: 0.1 }
// Positive histogram: Bullish
// Negative histogram: Bearish
```

### calculateBollingerBands(prices: number[], period: number = 20, stdDevs: number = 2)
Bollinger Bands for volatility.

```typescript
import { calculateBollingerBands } from "./indicators/technical";

const bb = calculateBollingerBands([100, 102, ...], 20, 2);
// Returns: { upper: 105.5, middle: 100, lower: 94.5 }
// Price near lower band: Oversold
// Price near upper band: Overbought
```

### calculateEMA(prices: number[], period: number)
Exponential Moving Average.

```typescript
import { calculateEMA } from "./indicators/technical";

const ema = calculateEMA([100, 102, 101, ...], 12);
// Returns: 101.5 (current EMA value)
```

### calculateATR(prices: number[], period: number = 14)
Average True Range for volatility.

```typescript
import { calculateATR } from "./indicators/technical";

const atr = calculateATR([...prices], 14);
// Returns: 2.5 (average true range)
// Higher = more volatile
```

### calculateTrendDirection(prices: number[])
Determine uptrend, downtrend, or neutral.

```typescript
import { calculateTrendDirection } from "./indicators/technical";

const trend = calculateTrendDirection([100, 102, 105, 108, 110]);
// Returns: "uptrend" | "downtrend" | "neutral"
```

---

## Risk Management

### PositionSizer

#### calculateKellySize(edge: number, portfolioSize: number, kellyFraction: number = 0.25)
Kelly Criterion position sizing.

```typescript
import { PositionSizer } from "./risk/positionSizer";

const sizer = new PositionSizer();
const positionSize = sizer.calculateKellySize(0.15, 10000, 0.25);
// Returns: 375 (position size in USD)
// Formula: edge * portfolio * kelly_fraction
```

#### calculateVolatilityAdjustedSize(atr: number)
Adjust position for volatility.

```typescript
const adjustedSize = sizer.calculateVolatilityAdjustedSize(2.5);
// Returns: 0.95 (multiplier: 0.9-1.1)
// High volatility: smaller positions
```

---

## Machine Learning

### MLPredictor

#### trainModel(examples: TrainingExample[])
Train ML model on token data.

```typescript
import { MLPredictor } from "./ml/predictor";

const predictor = new MLPredictor();

const examples = [
  {
    age: 30,
    holders: 500,
    liquidity: 50000,
    volumeIncrease: 2.5,
    priceAction: 0.15,
    concentration: 0.3,
    winner: true
  },
  // ... more examples
];

predictor.trainModel(examples);
```

#### predictWinProbability(features: TokenFeatures)
Predict token winner probability.

```typescript
const probability = predictor.predictWinProbability({
  age: 45,
  holders: 600,
  liquidity: 60000,
  volumeIncrease: 3.0,
  priceAction: 0.20,
  concentration: 0.25
});
// Returns: 0.78 (78% chance of being a winner)
```

#### evaluateModel(testExamples: TrainingExample[])
Evaluate model accuracy.

```typescript
const metrics = predictor.evaluateModel(testExamples);
// Returns: {
//   accuracy: 0.82,
//   precision: 0.85,
//   recall: 0.78,
//   f1: 0.81
// }
```

---

## On-Chain Analysis

### OnChainAnalyzer

#### analyzeHolderDistribution(holders: HolderInfo[])
Analyze token holder concentration.

```typescript
import { OnChainAnalyzer } from "./onchain/analyzer";

const analyzer = new OnChainAnalyzer();
const distribution = analyzer.analyzeHolderDistribution(holders);
// Returns: {
//   concentration: 0.35,  // Herfindahl index
//   top10Percent: 65,     // % owned by top 10
//   health: "good"        // good|moderate|poor
// }
```

#### assessRugRiskScore(token: TokenData, holders: HolderInfo[])
Assess probability of rug pull.

```typescript
const rugRisk = analyzer.assessRugRiskScore(token, holders);
// Returns: 0.15 (15% rug risk)
// < 0.3: Low risk
// 0.3-0.7: Medium risk
// > 0.7: High risk
```

---

## DEX Routing

### RoutingEngine

#### findBestRoute(tokenIn: string, tokenOut: string, amount: number)
Find best price across DEXs.

```typescript
import { RoutingEngine } from "./execution/routingEngine";

const router = new RoutingEngine();
const route = await router.findBestRoute(
  "So11111111111111111111111111111111111111112",  // SOL
  "EPjFWaLb3oc6aTdh2D7DCQcceP7qL12psVqHFSpz1o9",  // USDC
  1000000
);
// Returns: {
//   dex: "Jupiter",
//   priceImpact: 0.02,
//   outAmount: 995000,
//   route: ["SOL", "USDC"]
// }
```

#### getSplitRoute(tokenIn: string, tokenOut: string, amount: number, splits: number = 3)
Execute order split across DEXs.

```typescript
const splitRoute = await router.getSplitRoute(
  tokenA,
  tokenB,
  1000000,
  3  // Split into 3 parts
);
// Returns: BestRouteResult with better price impact
```

---

## MEV Protection

### MEVProtection

#### detectFrontRunRisk(liquidity: number, amount: number, pendingTransactions: number)
Estimate front-run risk.

```typescript
import { MEVProtection } from "./execution/mevProtection";

const mev = new MEVProtection();
const risk = mev.detectFrontRunRisk(50000, 1000, 5);
// Returns: 0.25 (25% front-run risk)
```

#### executeWithJitoProtection(tx: Transaction, jitoTip: number)
Execute with Jito bundle protection.

```typescript
const result = await mev.executeWithJitoProtection(tx, 0.005);
// Returns: {
//   success: true,
//   signature: "4xkY9s2...",
//   protected: true
// }
```

---

## Strategy Signal Generation

### Strategy

#### analyzeToken(token: TokenData, ohlcv?: OHLCVData[])
Generate trading signal.

```typescript
import { analyzeToken } from "./strategy";

const signal = await analyzeToken(token, ohlcvData);
// Returns: {
//   mint: "EPjFWaLb3oc6aTdh2D...",
//   action: "BUY",  // BUY | SELL | HOLD
//   confidence: 0.78,
//   reason: "RSI oversold, bullish MACD, strong volume",
//   scores: {
//     technical: 0.72,
//     onchain: 0.85,
//     ml: 0.75,
//     sentiment: 0.68
//   }
// }
```

---

## Backtesting

### Backtester

#### backtest(ohlcvData: OHLCVData[], strategyFn: Function, initialCapital: number, positionSizer: PositionSizer)
Validate strategy on historical data.

```typescript
import { Backtester } from "./backtest/backtester";

const backtester = new Backtester();
const results = await backtester.backtest(
  ohlcvData,
  async (price) => ({ action: "BUY", size: 100 }),
  10000,
  positionSizer
);
// Returns: {
//   totalTrades: 45,
//   wins: 26,
//   losses: 19,
//   winRate: 0.578,
//   sharpeRatio: 2.15,
//   maxDrawdown: 0.18,
//   profitFactor: 1.85,
//   finalBalance: 11850
// }
```

---

## Bot Orchestration

### TradooorBot

#### start()
Initialize and start bot.

```typescript
import { TradooorBot } from "./bot";

const bot = new TradooorBot(config);
await bot.start();
// Bot begins scanning and trading
```

#### tick()
Execute one trading cycle.

```typescript
await bot.tick();
// Scans tokens, generates signals, executes trades
```

#### stop()
Gracefully stop bot.

```typescript
await bot.stop();
// Closes positions, saves state, exits
```

---

## Configuration

### loadConfig()
Load and validate configuration.

```typescript
import { loadConfig } from "./config";

const config = loadConfig();
// Returns: BotConfig
// Validates all environment variables
// Throws error if missing required settings
```

---

## Logger

### createLogger(level: string)
Create logger instance.

```typescript
import { createLogger } from "./logger";

const logger = createLogger("info");
logger.info("Bot started");
logger.debug("Detailed info");
logger.error("Error occurred", error);
logger.warn("Warning message");
```

---

## Type Definitions

### TokenData
```typescript
interface TokenData {
  mint: string;
  symbol: string;
  price: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  holders: number;
  createdAt?: number;
}
```

### TradeSignal
```typescript
interface TradeSignal {
  mint: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;  // 0-1
  reason: string;
  scores: {
    technical: number;
    onchain: number;
    ml: number;
    sentiment: number;
  };
}
```

### BotConfig
```typescript
interface BotConfig {
  gmgnApiKey: string;
  solanaRpcUrl: string;
  walletPrivateKey: string;
  minLiquiditySol: number;
  maxPriceIncreasePct: number;
  minHolderCount: number;
  kellyFraction: number;
  enableDryRun: boolean;
  enableAutoTrading: boolean;
  tradingAmountSol: number;
}
```

---

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  const signal = await analyzeToken(token);
} catch (error) {
  if (error.code === "INVALID_TOKEN") {
    // Handle invalid token
  } else if (error.code === "API_ERROR") {
    // Handle API error
  } else {
    // Handle other errors
    logger.error("Unexpected error", error);
  }
}
```

---

## Examples

### Example 1: Custom Signal Logic
```typescript
import { analyzeToken } from "./strategy";
import { gmgnClient } from "./gmgnClient";

const customSignal = async (token) => {
  const signal = await analyzeToken(token);
  
  // Custom logic
  if (signal.confidence > 0.85 && signal.scores.technical > 0.8) {
    return { ...signal, action: "BUY", confidence: 0.95 };
  }
  
  return signal;
};
```

### Example 2: Backtesting Custom Strategy
```typescript
import { Backtester } from "./backtest/backtester";

const backtester = new Backtester();

const customStrategy = async (price, timestamp) => {
  // Your logic
  if (price < 100) return { action: "BUY", size: 100 };
  if (price > 200) return { action: "SELL", size: 100 };
  return { action: "HOLD" };
};

const results = await backtester.backtest(
  ohlcvData,
  customStrategy,
  10000,
  positionSizer
);
```

---

## Next Steps

- See [USAGE.md](USAGE.md) for running examples
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Read [CONFIG.md](CONFIG.md) for configuration options
