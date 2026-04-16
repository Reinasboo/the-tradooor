/**
 * Technical Indicators Library
 * Implements RSI, MACD, Bollinger Bands, ATR, Volume analysis
 */

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
}

export interface StochasticResult {
  k: number;
  d: number;
}

export interface ATRResult {
  atr: number;
  trueRange: number;
}

export class TechnicalIndicators {
  /**
   * Relative Strength Index (RSI)
   * Measures momentum on scale of 0-100
   * < 30 = oversold (buy signal)
   * > 70 = overbought (sell signal)
   */
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Default neutral

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    let gainSum = 0;
    let lossSum = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gainSum += changes[i];
      else lossSum += Math.abs(changes[i]);
    }

    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;

    // Smooth the averages for remaining data
    for (let i = period; i < changes.length; i++) {
      avgGain = (avgGain * (period - 1) + (changes[i] > 0 ? changes[i] : 0)) / period;
      avgLoss =
        (avgLoss * (period - 1) + (changes[i] < 0 ? Math.abs(changes[i]) : 0)) /
        period;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return Math.min(100, Math.max(0, rsi));
  }

  /**
   * Exponential Moving Average (EMA)
   * Gives more weight to recent prices
   */
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  /**
   * Simple Moving Average (SMA)
   * Average of prices over N periods
   */
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    return prices.slice(-period).reduce((a, b) => a + b) / period;
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   * Trend-following momentum indicator
   * Bullish when MACD > signal line
   */
  static calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): MACDResult {
    if (prices.length < slow) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(prices, fast);
    const ema26 = this.calculateEMA(prices, slow);
    const macdLine = ema12 - ema26;

    // Calculate signal line (EMA of MACD)
    const macdValues: number[] = [];
    for (let i = slow - 1; i < prices.length; i++) {
      const slicedPrices = prices.slice(0, i + 1);
      const e12 = this.calculateEMA(slicedPrices, fast);
      const e26 = this.calculateEMA(slicedPrices, slow);
      macdValues.push(e12 - e26);
    }

    const signalLine =
      macdValues.length >= signal
        ? this.calculateEMA(macdValues, signal)
        : macdLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine,
    };
  }

  /**
   * Bollinger Bands
   * Support/resistance levels based on standard deviation
   */
  static calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDevMultiplier: number = 2,
  ): BollingerBandsResult {
    if (prices.length < period) {
      const lastPrice = prices[prices.length - 1];
      return { upper: lastPrice, middle: lastPrice, lower: lastPrice };
    }

    const relevantPrices = prices.slice(-period);
    const middle = relevantPrices.reduce((a, b) => a + b) / period;

    const variance =
      relevantPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) /
      period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: middle + stdDev * stdDevMultiplier,
      middle,
      lower: middle - stdDev * stdDevMultiplier,
    };
  }

  /**
   * Average True Range (ATR)
   * Measures volatility
   */
  static calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14,
  ): ATRResult {
    if (highs.length < period) {
      return { atr: 0, trueRange: 0 };
    }

    const trueRanges: number[] = [];

    for (let i = 0; i < highs.length; i++) {
      let tr: number;

      if (i === 0) {
        tr = highs[i] - lows[i];
      } else {
        const hl = highs[i] - lows[i];
        const hc = Math.abs(highs[i] - closes[i - 1]);
        const lc = Math.abs(lows[i] - closes[i - 1]);
        tr = Math.max(hl, hc, lc);
      }

      trueRanges.push(tr);
    }

    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b) / period;

    for (let i = period; i < trueRanges.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period;
    }

    return {
      atr,
      trueRange: trueRanges[trueRanges.length - 1],
    };
  }

  /**
   * Stochastic Oscillator
   * %K and %D values (0-100)
   */
  static calculateStochastic(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14,
    _smoothK: number = 3,
    _smoothD: number = 3,
  ): StochasticResult {
    if (highs.length < period) {
      return { k: 50, d: 50 };
    }

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const range = highestHigh - lowestLow;
    const k =
      range === 0
        ? 50
        : ((currentClose - lowestLow) / range) * 100;

    // Simplified %D (would need EMA in production)
    const d = k;

    return { k, d };
  }

  /**
   * On-Balance Volume (OBV)
   * Accumulates volume based on price direction
   */
  static calculateOBV(prices: number[], volumes: number[]): number {
    if (prices.length !== volumes.length || prices.length < 2) {
      return volumes[volumes.length - 1] || 0;
    }

    let obv = volumes[0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
      // If prices are equal, volume is not added or subtracted
    }

    return obv;
  }

  /**
   * Volume Moving Average
   * Tracks average volume over period
   */
  static calculateVolumeMA(volumes: number[], period: number): number {
    if (volumes.length < period) {
      return volumes.reduce((a, b) => a + b, 0) / volumes.length;
    }

    return volumes.slice(-period).reduce((a, b) => a + b) / period;
  }

  /**
   * Calculate composite technical score (0-1)
   * Combines multiple indicators into single score
   */
  static calculateCompositeScore(
    prices: number[],
    volumes: number[],
    highs: number[],
    lows: number[],
  ): {
    rsi: number;
    macd: MACDResult;
    bollinger: BollingerBandsResult;
    atr: ATRResult;
    compositeScore: number;
  } {
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices, 12, 26, 9);
    const bollinger = this.calculateBollingerBands(prices, 20, 2);
    const atr = this.calculateATR(highs, lows, prices, 14);

    // Composite scoring logic
    let score = 0;

    // RSI: 30-50 is sweet spot for buying
    if (rsi >= 30 && rsi <= 50) score += 0.25;
    else if (rsi >= 20 && rsi <= 60) score += 0.15;

    // MACD: Bullish when MACD > Signal
    if (macd.macd > macd.signal) score += 0.20;
    else if (Math.abs(macd.histogram) < 0.5) score += 0.10; // Near crossover

    // Bollinger: Price near lower band is bullish
    const lastPrice = prices[prices.length - 1];
    const bbRange = bollinger.upper - bollinger.lower;
    const positionInBands = (lastPrice - bollinger.lower) / bbRange;

    if (positionInBands < 0.3) score += 0.25; // Near lower band
    else if (positionInBands < 0.5) score += 0.15;

    // Volume: High volume confirms trend
    const currentVolume = volumes[volumes.length - 1];
    const volumeMA = this.calculateVolumeMA(volumes, 20);
    if (currentVolume > volumeMA * 1.5) score += 0.20;
    else if (currentVolume > volumeMA) score += 0.10;

    // ATR: Lower volatility is better for entry
    const meanVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    if (atr.atr < meanVolume * 0.05) score += 0.10;

    return {
      rsi,
      macd,
      bollinger,
      atr,
      compositeScore: Math.min(1, score),
    };
  }

  /**
   * Trend detection helper
   */
  static getTrendDirection(prices: number[]): 'uptrend' | 'downtrend' | 'neutral' {
    if (prices.length < 3) return 'neutral';

    const ema9 = this.calculateEMA(prices, 9);
    const ema21 = this.calculateEMA(prices, 21);

    if (ema9 > ema21) return 'uptrend';
    if (ema9 < ema21) return 'downtrend';
    return 'neutral';
  }

  /**
   * Support/Resistance calculation
   */
  static calculateSupportResistance(
    prices: number[],
    period: number = 20,
  ): { support: number; resistance: number } {
    if (prices.length < period) {
      return { support: Math.min(...prices), resistance: Math.max(...prices) };
    }

    const recentPrices = prices.slice(-period);
    const support = Math.min(...recentPrices);
    const resistance = Math.max(...recentPrices);

    return { support, resistance };
  }
}

// Helper function for mean (used in composite score)
// Mean calculation helper is built-in via native Math operations
