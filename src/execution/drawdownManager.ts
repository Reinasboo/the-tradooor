/**
 * Portfolio Risk Manager
 * Protects overall portfolio from large drawdowns
 */

export interface PortfolioState {
  totalCapital: number;
  currentEquity: number;
  activePositions: number;
  totalUnrealizedPnL: number;
  peakEquity: number;
  currentDrawdown: number;
  positions: PositionSnapshot[];
}

export interface PositionSnapshot {
  mint: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  weight: number; // % of portfolio
}

export interface DrawdownAlert {
  level: string; // 'yellow' (20%), 'orange' (30%), 'red' (40%+)
  currentDrawdown: number;
  recommendation: 'continue' | 'reduce_size' | 'stop_trading' | 'close_all';
  reason: string;
}

export class PortfolioRiskManager {
  private maxAllowedDrawdown: number = 0.3; // 30% max
  private maxPositionWeight: number = 0.1; // 10% max per position
  // private maxCorrelation: number = 0.7; // Max position correlation (reserved for future)

  constructor(maxDrawdown: number = 0.3) {
    this.maxAllowedDrawdown = maxDrawdown;
  }

  /**
   * Calculate current portfolio drawdown
   */
  calculateDrawdown(portfolio: PortfolioState): number {
    if (portfolio.peakEquity === 0) return 0;

    const drawdown = (portfolio.peakEquity - portfolio.currentEquity) / portfolio.peakEquity;
    return Math.max(0, drawdown);
  }

  /**
   * Update peak equity if new high reached
   */
  updatePeakEquity(portfolio: PortfolioState): PortfolioState {
    if (portfolio.currentEquity > portfolio.peakEquity) {
      portfolio.peakEquity = portfolio.currentEquity;
    }

    portfolio.currentDrawdown = this.calculateDrawdown(portfolio);

    return portfolio;
  }

  /**
   * Check drawdown levels and alert
   */
  checkDrawdownAlerts(portfolio: PortfolioState): DrawdownAlert {
    const drawdown = portfolio.currentDrawdown;

    if (drawdown > 0.4) {
      return {
        level: 'red',
        currentDrawdown: drawdown,
        recommendation: 'close_all',
        reason: `Portfolio drawdown ${(drawdown * 100).toFixed(1)}% > 40% max - CLOSE ALL POSITIONS`,
      };
    }

    if (drawdown > 0.3) {
      return {
        level: 'orange',
        currentDrawdown: drawdown,
        recommendation: 'stop_trading',
        reason: `Portfolio drawdown ${(drawdown * 100).toFixed(1)}% > 30% - stop opening new trades`,
      };
    }

    if (drawdown > 0.2) {
      return {
        level: 'yellow',
        currentDrawdown: drawdown,
        recommendation: 'reduce_size',
        reason: `Portfolio drawdown ${(drawdown * 100).toFixed(1)}% > 20% - reduce position sizes`,
      };
    }

    return {
      level: 'green',
      currentDrawdown: drawdown,
      recommendation: 'continue',
      reason: `Portfolio healthy: ${(drawdown * 100).toFixed(1)}% drawdown`,
    };
  }

  /**
   * Calculate position weight and enforce limits
   */
  calculatePositionWeights(portfolio: PortfolioState): PositionSnapshot[] {
    return portfolio.positions.map(pos => ({
      ...pos,
      weight: pos.quantity * pos.currentPrice / portfolio.currentEquity,
    }));
  }

  /**
   * Check if new position exceeds limits
   */
  canOpenPosition(portfolio: PortfolioState, requestedSize: number): boolean {
    const positionWeight = requestedSize / portfolio.currentEquity;

    // Check position weight limit
    if (positionWeight > this.maxPositionWeight) {
      return false;
    }

    // Check drawdown limit
    if (portfolio.currentDrawdown > this.maxAllowedDrawdown) {
      return false;
    }

    // Check correlation with existing positions
    // Simplified: just check if too many positions
    if (portfolio.activePositions >= 15) {
      return false;
    }

    return true;
  }

  /**
   * Recommend position size reduction
   */
  recommendSizeReduction(portfolio: PortfolioState): {
    shouldReduce: boolean;
    factor: number;
  } {
    const alert = this.checkDrawdownAlerts(portfolio);

    if (alert.recommendation === 'close_all') {
      return { shouldReduce: true, factor: 0 };
    }

    if (alert.recommendation === 'stop_trading') {
      return { shouldReduce: true, factor: 0.5 }; // Reduce to 50% of normal
    }

    if (alert.recommendation === 'reduce_size') {
      return { shouldReduce: true, factor: 0.75 }; // Reduce to 75% of normal
    }

    return { shouldReduce: false, factor: 1 };
  }

  /**
   * Calculate correlation-adjusted allocation
   */
  calculateCorrelationAdjustment(
    correlations: Map<string, number>, // mint -> correlation
  ): number {
    // If adding correlated positions, reduce size
    const avgCorrelation =
      Array.from(correlations.values()).reduce((a, b) => a + b, 0) / correlations.size;

    // Reduce by correlation percentage
    const adjustment = Math.max(0.5, 1 - avgCorrelation);

    return adjustment;
  }

  /**
   * Stress test portfolio: what if market crashes?
   */
  stressTest(portfolio: PortfolioState, crashPercent: number = -20): {
    worstCaseEquity: number;
    worstCaseDrawdown: number;
    worstCasePnL: number;
  } {
    // Simulate crash
    const crashMultiplier = 1 + crashPercent / 100;
    const worstCaseEquity = portfolio.totalCapital + portfolio.totalUnrealizedPnL * crashMultiplier;
    const worstCaseDrawdown = (portfolio.peakEquity - worstCaseEquity) / portfolio.peakEquity;
    const worstCasePnL = worstCaseEquity - portfolio.totalCapital;

    return {
      worstCaseEquity: Math.max(0, worstCaseEquity),
      worstCaseDrawdown: Math.max(0, worstCaseDrawdown),
      worstCasePnL,
    };
  }

  /**
   * Calculate Value at Risk (VaR) at confidence level
   */
  calculateVaR(
    portfolio: PortfolioState,
    _confidenceLevel: number = 0.95, // 95% confidence
  ): number {
    // Simplified VaR: assume normal distribution
    // In production, use historical returns or Monte Carlo

    // Estimate daily volatility from positions
    const avgUnrealizedPercent = portfolio.totalUnrealizedPnL / portfolio.currentEquity;
    const dailyVolatility = Math.abs(avgUnrealizedPercent) * 0.1; // Rough estimate

    // Normal distribution Z-score for 95% = 1.645
    const zScore = 1.645;

    const varAmount = portfolio.currentEquity * dailyVolatility * zScore;

    return varAmount;
  }

  /**
   * Calculate Conditional Value at Risk (CVaR)
   * Expected loss beyond VaR
   */
  calculateCVaR(portfolio: PortfolioState): number {
    // CVaR is typically 1.25-1.5x VaR
    const var95 = this.calculateVaR(portfolio, 0.95);

    return var95 * 1.3; // Rough estimate
  }

  /**
   * Recommendation system based on portfolio health
   */
  getPortfolioRecommendation(portfolio: PortfolioState): string {
    if (portfolio.currentDrawdown > 0.4) {
      return '🚨 CRITICAL: Close all positions immediately. Portfolio at max loss tolerance.';
    }

    if (portfolio.currentDrawdown > 0.3) {
      return '⚠️ WARNING: Stop opening new trades. Close losing positions. Preserve capital.';
    }

    if (portfolio.currentDrawdown > 0.2) {
      return '⚡ CAUTION: Reduce position sizes. Trade only highest conviction setups.';
    }

    if (portfolio.totalUnrealizedPnL > portfolio.totalCapital * 0.3) {
      return '📈 Excellent: Strong profit. Consider locking in gains. Reduce risk.';
    }

    return '✅ Healthy: Continue trading with discipline. Stick to the plan.';
  }
}
