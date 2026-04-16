/**
 * Position Sizer using Kelly Criterion
 * Optimizes position size based on win rate and edge
 */

export interface PositionSizingResult {
  positionSize: number;
  riskAmount: number;
  maxLoss: number;
  kellyPercentage: number;
}

export interface TradingEdge {
  winRate: number; // e.g., 0.62 = 62%
  avgWinRatio: number; // e.g., 1.15 = 15% average win
  avgLossRatio: number; // e.g., 0.95 = 5% average loss
  profitFactor: number; // (sumWins / sumLosses)
}

export class PositionSizer {
  /**
   * Kelly Criterion: Optimal position sizing
   * f* = (bp - q) / b
   * where:
   *   f* = fraction of portfolio to risk
   *   b = ratio of average win to average loss
   *   p = probability of winning
   *   q = probability of losing (1 - p)
   *
   * Use fractional Kelly (0.25x) for crypto volatility
   */
  static calculateKellySize(
    edge: TradingEdge,
    portfolioSize: number,
    kellyFraction: number = 0.25, // Conservative 0.25x Kelly
    maxRiskPerTrade: number = 0.02, // Max 2% per trade
  ): PositionSizingResult {
    const { winRate, avgWinRatio, avgLossRatio } = edge;

    if (winRate <= 0 || winRate >= 1) {
      throw new Error('Win rate must be between 0 and 1');
    }

    // Calculate Kelly percentage
    const b = avgWinRatio / Math.abs(avgLossRatio);
    const p = winRate;
    const q = 1 - p;

    let kellyPercentage = (b * p - q) / b;

    // Clamp to reasonable range
    kellyPercentage = Math.max(0, Math.min(kellyPercentage, 0.5));

    // Apply safety margin for crypto volatility
    const fractionalKelly = kellyPercentage * kellyFraction;

    // Hard cap on maximum risk
    const riskPercentage = Math.min(fractionalKelly, maxRiskPerTrade);

    // Calculate position size
    const riskAmount = portfolioSize * riskPercentage;
    const positionSize = riskAmount / Math.abs(avgLossRatio - 1);

    return {
      positionSize,
      riskAmount,
      maxLoss: riskAmount,
      kellyPercentage: riskPercentage,
    };
  }

  /**
   * Volatility-Adjusted Position Sizing
   * Lower volatility = larger positions
   * Higher volatility = smaller positions
   */
  static calculateVolatilityAdjustedSize(
    atr: number, // Average True Range
    portfolioSize: number,
    maxDrawdownPerTrade: number = 0.02, // 2% max DD
    priceLevel: number,
  ): number {
    // Risk is proportional to volatility
    const riskPercentage = maxDrawdownPerTrade / (atr / priceLevel);
    return portfolioSize * Math.min(riskPercentage, maxDrawdownPerTrade);
  }

  /**
   * Correlation-Adjusted Sizing
   * Reduce position size for highly correlated tokens
   */
  static calculateCorrelationAdjustedSize(
    baseSize: number,
    correlationToPortfolio: number, // -1 to 1
    maxCorrelation: number = 0.7,
  ): number {
    if (Math.abs(correlationToPortfolio) > maxCorrelation) {
      return 0; // Skip highly correlated token
    }

    // Diversification bonus: reduce correlation = larger position
    const correlationPenalty = Math.abs(correlationToPortfolio) * 0.5;
    const adjustmentFactor = 1 - correlationPenalty;

    return baseSize * adjustmentFactor;
  }

  /**
   * Drawdown-Aware Sizing
   * Reduce position size when portfolio has taken losses
   */
  static calculateDrawdownAdjustedSize(
    baseSize: number,
    currentDrawdown: number, // -0.15 = -15%
    maxAllowedDrawdown: number = -0.25,
  ): number {
    if (currentDrawdown < maxAllowedDrawdown) {
      return 0; // Stop trading if DD too large
    }

    // Scale positions based on drawdown
    // At 0% DD: 100% size
    // At -10% DD: 80% size
    // At -20% DD: 60% size
    const drawdownFactor = 1 + currentDrawdown / maxAllowedDrawdown;

    return baseSize * Math.max(0, drawdownFactor);
  }

  /**
   * Multi-factor position sizing
   * Combines Kelly, volatility, correlation, and drawdown
   */
  static calculateOptimalSize(config: {
    edge: TradingEdge;
    portfolioSize: number;
    atr: number;
    priceLevel: number;
    correlationToPortfolio: number;
    currentDrawdown: number;
    maxRiskPerTrade?: number;
    maxDrawdownPerTrade?: number;
    maxCorrelation?: number;
    maxAllowedDrawdown?: number;
  }): PositionSizingResult & { adjustmentFactors: string[] } {
    const adjustmentFactors: string[] = [];

    // Start with Kelly
    const kelly = this.calculateKellySize(
      config.edge,
      config.portfolioSize,
      0.25,
      config.maxRiskPerTrade || 0.02,
    );

    let positionSize = kelly.positionSize;

    // Apply volatility adjustment
    const volatilityAdjusted = this.calculateVolatilityAdjustedSize(
      config.atr,
      config.portfolioSize,
      config.maxDrawdownPerTrade || 0.02,
      config.priceLevel,
    );

    if (volatilityAdjusted < positionSize) {
      positionSize = volatilityAdjusted;
      adjustmentFactors.push('volatility_reduced');
    }

    // Apply correlation adjustment
    const correlationAdjusted = this.calculateCorrelationAdjustedSize(
      positionSize,
      config.correlationToPortfolio,
      config.maxCorrelation || 0.7,
    );

    if (correlationAdjusted < positionSize) {
      positionSize = correlationAdjusted;
      adjustmentFactors.push('correlation_reduced');
    }

    // Apply drawdown adjustment
    const drawdownAdjusted = this.calculateDrawdownAdjustedSize(
      positionSize,
      config.currentDrawdown,
      config.maxAllowedDrawdown || -0.25,
    );

    if (drawdownAdjusted < positionSize) {
      positionSize = drawdownAdjusted;
      adjustmentFactors.push('drawdown_reduced');
    }

    if (drawdownAdjusted === 0) {
      adjustmentFactors.push('trading_paused');
    }

    return {
      positionSize,
      riskAmount: kelly.riskAmount,
      maxLoss: kelly.maxLoss,
      kellyPercentage: kelly.kellyPercentage,
      adjustmentFactors,
    };
  }

  /**
   * Calculate position sizing confidence
   * Returns how confident we should be in the position
   */
  static calculateConfidenceMultiplier(edge: TradingEdge): number {
    const { winRate, profitFactor } = edge;

    // Higher win rate and profit factor = higher confidence
    let confidence = 0;

    // Win rate component (0-0.5)
    if (winRate > 0.6) confidence += 0.4;
    else if (winRate > 0.55) confidence += 0.3;
    else if (winRate > 0.5) confidence += 0.2;

    // Profit factor component (0-0.5)
    if (profitFactor > 2) confidence += 0.4;
    else if (profitFactor > 1.5) confidence += 0.3;
    else if (profitFactor > 1) confidence += 0.2;

    return Math.min(1, confidence);
  }

  /**
   * Risk of Ruin calculation
   * Probability of losing entire account
   */
  static calculateRiskOfRuin(
    winRate: number,
    riskPercentage: number,
    _tradeCount: number,
  ): number {
    // Simplified risk of ruin
    // P(ruin) ≈ ((1-p)/p)^(portfolio_risk_units)
    const p = winRate;
    const q = 1 - p;

    if (p >= 0.5 && riskPercentage < 0.5) {
      return 0; // Very safe
    }

    const riskUnits = 1 / riskPercentage;
    const riskOfRuin = Math.pow(q / p, riskUnits);

    return Math.min(1, riskOfRuin);
  }
}
