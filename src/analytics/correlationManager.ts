/**
 * Correlation Portfolio Manager
 * Tracks position correlations and optimizes portfolio allocation
 */

export interface CorrelationMatrix {
  tokens: string[];
  correlations: Map<string, Map<string, number>>;
  timestamp: number;
}

export interface PortfolioAllocation {
  allocations: Map<string, number>; // mint -> weight
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export class CorrelationManager {
  // private correlationHistory: Map<string, number[]> = new Map(); // mint -> returns
  // private updateWindow: number = 20; // 20-period rolling correlation

  /**
   * Calculate correlation between two tokens
   */
  calculateCorrelation(returns1: number[], returns2: number[]): number {
    if (returns1.length !== returns2.length || returns1.length < 2) {
      return 0;
    }

    const mean1 = returns1.reduce((a, b) => a + b) / returns1.length;
    const mean2 = returns2.reduce((a, b) => a + b) / returns2.length;

    let covariance = 0;
    let var1 = 0;
    let var2 = 0;

    for (let i = 0; i < returns1.length; i++) {
      const dev1 = returns1[i] - mean1;
      const dev2 = returns2[i] - mean2;

      covariance += dev1 * dev2;
      var1 += dev1 * dev1;
      var2 += dev2 * dev2;
    }

    covariance /= returns1.length;
    var1 /= returns1.length;
    var2 /= returns2.length;

    const std1 = Math.sqrt(var1);
    const std2 = Math.sqrt(var2);

    return std1 > 0 && std2 > 0 ? covariance / (std1 * std2) : 0;
  }

  /**
   * Build correlation matrix for all positions
   */
  buildCorrelationMatrix(priceHistory: Map<string, number[]>): CorrelationMatrix {
    const tokens = Array.from(priceHistory.keys());
    const correlations = new Map<string, Map<string, number>>();

    for (const token1 of tokens) {
      correlations.set(token1, new Map());

      for (const token2 of tokens) {
        if (token1 === token2) {
          correlations.get(token1)!.set(token2, 1.0);
        } else {
          const returns1 = this.calculateReturns(priceHistory.get(token1)!);
          const returns2 = this.calculateReturns(priceHistory.get(token2)!);
          const corr = this.calculateCorrelation(returns1, returns2);
          correlations.get(token1)!.set(token2, corr);
        }
      }
    }

    return {
      tokens,
      correlations,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate log returns from prices
   */
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const logReturn = Math.log(prices[i] / prices[i - 1]);
      returns.push(logReturn);
    }

    return returns;
  }

  /**
   * Find optimal portfolio weights using Markowitz allocation
   */
  calculateOptimalAllocation(
    expectedReturns: Map<string, number>,
    correlationMatrix: CorrelationMatrix,
    riskFreeRate: number = 0.02,
  ): PortfolioAllocation {
    const tokens = correlationMatrix.tokens;
    const n = tokens.length;

    // Simplified: Equal-weight allocation
    // In production, use quadratic programming
    const weights = new Map<string, number>();
    const weight = 1 / n;

    for (const token of tokens) {
      weights.set(token, weight);
    }

    // Calculate portfolio metrics
    let portfolioReturn = 0;
    let portfolioVariance = 0;

    for (const token1 of tokens) {
      portfolioReturn += (expectedReturns.get(token1) || 0) * weight;

      for (const token2 of tokens) {
        const corr = correlationMatrix.correlations.get(token1)?.get(token2) || 0;
        const vol1 = 0.15; // Assumed volatility (15%)
        const vol2 = 0.15;

        portfolioVariance += weight * weight * vol1 * vol2 * corr;
      }
    }

    const portfolioVolatility = Math.sqrt(portfolioVariance);
    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;

    return {
      allocations: weights,
      expectedReturn: portfolioReturn,
      expectedVolatility: portfolioVolatility,
      sharpeRatio,
      maxDrawdown: 0.25, // Simplified
    };
  }

  /**
   * Detect problematic correlations
   */
  identifyHighCorrelations(
    correlationMatrix: CorrelationMatrix,
    threshold: number = 0.7,
  ): Array<{ token1: string; token2: string; correlation: number }> {
    const issues: Array<{ token1: string; token2: string; correlation: number }> = [];

    const tokens = correlationMatrix.tokens;

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const corr = Math.abs(
          correlationMatrix.correlations.get(tokens[i])?.get(tokens[j]) || 0,
        );

        if (corr > threshold) {
          issues.push({
            token1: tokens[i],
            token2: tokens[j],
            correlation: corr,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Recommend position rebalancing
   */
  recommendRebalancing(
    currentWeights: Map<string, number>,
    targetAllocation: PortfolioAllocation,
  ): Map<string, number> {
    const adjustments = new Map<string, number>();

    for (const [token, currentWeight] of currentWeights) {
      const targetWeight = targetAllocation.allocations.get(token) || 0;
      const drift = currentWeight - targetWeight;

      if (Math.abs(drift) > 0.05) {
        // Rebalance if drifted more than 5%
        adjustments.set(token, targetWeight);
      }
    }

    return adjustments;
  }

  /**
   * Calculate portfolio beta (systematic risk)
   */
  calculatePortfolioBeta(
    tokenBetas: Map<string, number>,
    weights: Map<string, number>,
  ): number {
    let portfolioBeta = 0;

    for (const [token, weight] of weights) {
      const beta = tokenBetas.get(token) || 1.0;
      portfolioBeta += weight * beta;
    }

    return portfolioBeta;
  }

  /**
   * Identify diversification opportunities
   */
  identifyDiversificationGaps(
    currentPositions: Set<string>,
    allAvailableTokens: string[],
  ): string[] {
    // const gaps: string[] = [];

    // Recommend tokens that are NOT correlated with current positions
    // In production: use correlation matrix to find good diversifiers
    const uncorrelated = allAvailableTokens.filter(t => !currentPositions.has(t));

    return uncorrelated.slice(0, 5); // Top 5 suggestions
  }

  /**
   * Stress test portfolio for correlation breakdown
   */
  stressTestCorrelations(
    portfolio: Map<string, number>,
    _correlationMatrix: CorrelationMatrix,
    marketShockPercent: number = -20,
  ): {
    maxLoss: number;
    avgLoss: number;
    correlationBreakdown: boolean;
  } {
    // In a crash, correlations tend to 1 (all go down together)
    // Calculate worst-case scenario

    let maxLoss = 0;
    let totalLoss = 0;

    for (const [_token, position] of portfolio) {
      // Assume all positions move together in crash
      const loss = position * (marketShockPercent / 100);
      totalLoss += loss;
      maxLoss = Math.min(maxLoss, loss);
    }

    return {
      maxLoss: Math.abs(maxLoss),
      avgLoss: Math.abs(totalLoss / portfolio.size),
      correlationBreakdown: true, // Correlations break down in crashes
    };
  }
}
