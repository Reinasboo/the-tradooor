import { TokenData, TradeSignal, BotConfig } from './types';
import { Logger } from './logger';
import { TechnicalIndicators } from './indicators/technical';

export class StrategyEngine {
  private config: BotConfig;
  private logger: Logger;

  constructor(config: BotConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Analyze token and generate trade signals
   */
  analyzeToken(token: TokenData, ohlcv?: any[]): TradeSignal | null {
    const filters = this.applyFilters(token);
    
    if (!filters.passed) {
      this.logger.debug(
        `Token ${token.symbol} filtered out: ${filters.reasons.join(', ')}`,
      );
      return null;
    }

    const score = this.calculateSignalScore(token, ohlcv);
    
    if (score.confidence < 0.5) {
      this.logger.debug(
        `Token ${token.symbol} below confidence threshold: ${score.confidence}`,
      );
      return null;
    }

    return {
      mint: token.mint,
      action: score.action,
      confidence: score.confidence,
      reason: score.reason,
      tokenData: token,
      timestamp: Date.now(),
    };
  }

  /**
   * Apply filtering rules to token
   */
  private applyFilters(
    token: TokenData,
  ): { passed: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (token.liquidity < this.config.minLiquiditySol) {
      reasons.push(
        `Liquidity ${token.liquidity} < ${this.config.minLiquiditySol}`,
      );
    }

    if (token.holders < this.config.minHolderCount) {
      reasons.push(
        `Holders ${token.holders} < ${this.config.minHolderCount}`,
      );
    }

    if (token.volume24h < this.config.minVolume24h) {
      reasons.push(
        `Volume ${token.volume24h} < ${this.config.minVolume24h}`,
      );
    }

    return {
      passed: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Calculate buy/sell signal score with technical indicators
   */
  private calculateSignalScore(
    token: TokenData,
    ohlcv?: any[],
  ): { action: 'BUY' | 'SELL'; confidence: number; reason: string } {
    let buyScore = 0;
    const reasons: string[] = [];

    // PHASE 1: Technical Indicators
    if (ohlcv && ohlcv.length >= 20) {
      const prices = ohlcv.map((c: any) => c.close);
      const volumes = ohlcv.map((c: any) => c.volume);
      // Highs/lows available if needed for advanced indicators

      // RSI: 30-50 is oversold sweet spot for buying
      const rsi = TechnicalIndicators.calculateRSI(prices, 14);
      if (rsi >= 30 && rsi <= 50) {
        buyScore += 0.20;
        reasons.push(`RSI ${rsi.toFixed(1)} (oversold)`);
      } else if (rsi >= 20 && rsi <= 60) {
        buyScore += 0.10;
      }

      // MACD: Bullish crossover
      const macd = TechnicalIndicators.calculateMACD(prices, 12, 26, 9);
      if (macd.macd > macd.signal) {
        buyScore += 0.15;
        reasons.push(`MACD bullish`);
      } else if (Math.abs(macd.histogram) < 0.5) {
        buyScore += 0.05; // Near crossover
      }

      // Bollinger Bands: Price near lower band
      const bb = TechnicalIndicators.calculateBollingerBands(prices, 20, 2);
      const lastPrice = prices[prices.length - 1];
      const bbPosition = (lastPrice - bb.lower) / (bb.upper - bb.lower);

      if (bbPosition < 0.3) {
        buyScore += 0.20;
        reasons.push(`Price at BB lower band (${(bbPosition * 100).toFixed(0)}%)`);
      } else if (bbPosition < 0.5) {
        buyScore += 0.10;
      }

      // Trend confirmation: EMA 9 > EMA 21
      const trend = TechnicalIndicators.getTrendDirection(prices);
      if (trend === 'uptrend') {
        buyScore += 0.10;
        reasons.push(`EMA uptrend confirmed`);
      }

      // Volume confirmation
      const currentVol = volumes[volumes.length - 1];
      const volMA = TechnicalIndicators.calculateVolumeMA(volumes, 20);
      if (currentVol > volMA * 1.5) {
        buyScore += 0.15;
        reasons.push(`High volume (${(currentVol / volMA).toFixed(1)}x MA)`);
      } else if (currentVol > volMA) {
        buyScore += 0.05;
      }
    }

    // Price action: Strong but not moon'd
    if (token.priceChange24h > 20 && token.priceChange24h < 100) {
      buyScore += 0.15;
      reasons.push(`Moderate 24h growth: +${token.priceChange24h.toFixed(1)}%`);
    } else if (token.priceChange24h > 5 && token.priceChange24h <= 20) {
      buyScore += 0.10;
      reasons.push(`Gentle 24h growth: +${token.priceChange24h.toFixed(1)}%`);
    }

    // Risk check: Don't buy if already moon'd too hard
    if (token.priceChange24h > this.config.maxPriceIncreasePct) {
      buyScore = Math.max(0, buyScore - 0.5);
      reasons.push(
        `High volatility alert: +${token.priceChange24h.toFixed(1)}% > max ${this.config.maxPriceIncreasePct}%`,
      );
    }

    // On-chain metrics
    const liquidityRatio = token.liquidity / token.marketCap;
    if (liquidityRatio > 0.15) {
      buyScore += 0.10;
      reasons.push(`Excellent liquidity ratio: ${(liquidityRatio * 100).toFixed(1)}%`);
    } else if (liquidityRatio > 0.1) {
      buyScore += 0.05;
    }

    const volumeToLiquidityRatio = token.volume24h / token.liquidity;
    if (volumeToLiquidityRatio > 3) {
      buyScore += 0.10;
      reasons.push(`Very high trading activity: Vol/Liq ${volumeToLiquidityRatio.toFixed(1)}x`);
    } else if (volumeToLiquidityRatio > 1) {
      buyScore += 0.05;
    }

    const confidence = Math.min(1, Math.max(0, buyScore));
    const action = confidence > 0.5 ? 'BUY' : 'SELL';

    return {
      action,
      confidence,
      reason: reasons.length > 0 ? reasons.join(' | ') : 'No clear signal',
    };
  }

  /**
   * Evaluate if a token has good fundamentals
   */
  isFundamentallySolid(token: TokenData): boolean {
    const checks = {
      goodLiquidity: token.liquidity >= this.config.minLiquiditySol * 2,
      enoughHolders: token.holders >= this.config.minHolderCount * 2,
      solidVolume: token.volume24h >= this.config.minVolume24h * 5,
      reasonablePrice: token.priceChange24h < this.config.maxPriceIncreasePct,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    return passedChecks >= 3;
  }
}
