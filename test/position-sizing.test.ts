import { PositionSizer, TradingEdge } from '../src/risk/positionSizer';

describe('Position Sizing Logic', () => {
  describe('Kelly Criterion Calculation', () => {
    it('should calculate Kelly percentage correctly', () => {
      const edge: TradingEdge = {
        winRate: 0.6, // 60%
        avgWinRatio: 1.5, // 50% average win
        avgLossRatio: 0.9, // 10% average loss
        profitFactor: 3.0, // 3:1 profit:loss
      };

      const result = PositionSizer.calculateKellySize(
        edge,
        100000, // $100k portfolio
        0.25, // 0.25x Kelly
        0.02, // 2% max risk
      );

      expect(result.positionSize).toBeGreaterThan(0);
      expect(result.riskAmount).toBeGreaterThan(0);
      expect(result.kellyPercentage).toBeGreaterThan(0);
      expect(result.kellyPercentage).toBeLessThanOrEqual(0.02); // Should respect max risk
    });

    it('should reject invalid win rate (0)', () => {
      const edge: TradingEdge = {
        winRate: 0, // Invalid
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      expect(() => {
        PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);
      }).toThrow('Win rate must be between 0 and 1');
    });

    it('should reject invalid win rate (1)', () => {
      const edge: TradingEdge = {
        winRate: 1, // Invalid
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      expect(() => {
        PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);
      }).toThrow('Win rate must be between 0 and 1');
    });

    it('should apply fractional Kelly for conservative sizing', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      const fullKelly = PositionSizer.calculateKellySize(edge, 100000, 1.0, 1.0);
      const quarterKelly = PositionSizer.calculateKellySize(edge, 100000, 0.25, 1.0);

      expect(quarterKelly.kellyPercentage).toBeLessThan(fullKelly.kellyPercentage);
    });

    it('should clamp Kelly percentage to reasonable range', () => {
      const edge: TradingEdge = {
        winRate: 0.9, // Very high win rate
        avgWinRatio: 10, // Very high win ratio
        avgLossRatio: 0.99,
        profitFactor: 100,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 1.0, 0.02);

      expect(result.kellyPercentage).toBeLessThanOrEqual(0.5);
    });

    it('should enforce max risk per trade hard cap', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 2,
        avgLossRatio: 0.8,
        profitFactor: 5,
      };

      const maxRisk = 0.01; // 1% max
      const result = PositionSizer.calculateKellySize(edge, 100000, 1.0, maxRisk);

      expect(result.kellyPercentage).toBeLessThanOrEqual(maxRisk);
      expect(result.riskAmount).toBeLessThanOrEqual(100000 * maxRisk);
    });

    it('should calculate position size based on risk amount', () => {
      const edge: TradingEdge = {
        winRate: 0.55,
        avgWinRatio: 1.2,
        avgLossRatio: 0.95,
        profitFactor: 2.5,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      // Position size should be reasonable
      expect(result.positionSize).toBeGreaterThan(0);
      expect(result.positionSize).toBeLessThan(100000); // Not more than portfolio
    });

    it('should handle break-even win rate (50%)', () => {
      const edge: TradingEdge = {
        winRate: 0.5,
        avgWinRatio: 1.0,
        avgLossRatio: 1.0,
        profitFactor: 1.0,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      // Should result in minimal Kelly fraction
      expect(result.kellyPercentage).toBeLessThanOrEqual(0.02);
    });

    it('should produce higher position sizes with better edges', () => {
      const weakEdge: TradingEdge = {
        winRate: 0.52,
        avgWinRatio: 1.05,
        avgLossRatio: 0.95,
        profitFactor: 1.1,
      };

      const strongEdge: TradingEdge = {
        winRate: 0.65,
        avgWinRatio: 2.0,
        avgLossRatio: 0.8,
        profitFactor: 5.0,
      };

      const weakResult = PositionSizer.calculateKellySize(weakEdge, 100000, 0.25, 0.02);
      const strongResult = PositionSizer.calculateKellySize(strongEdge, 100000, 0.25, 0.02);

      // Strong edge should produce higher Kelly percentage
      expect(strongResult.kellyPercentage).toBeGreaterThanOrEqual(weakResult.kellyPercentage);
    });

    it('should scale position size with portfolio size', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      const smallPortfolio = PositionSizer.calculateKellySize(edge, 10000, 0.25, 0.02);
      const largePortfolio = PositionSizer.calculateKellySize(edge, 1000000, 0.25, 0.02);

      expect(largePortfolio.riskAmount).toBeGreaterThan(smallPortfolio.riskAmount);
    });
  });

  describe('Volatility-Adjusted Sizing', () => {
    it('should calculate volatility-adjusted position size', () => {
      const atr = 0.0005; // Average True Range
      const portfolio = 100000;
      const maxDrawdown = 0.02;
      const price = 0.001;

      const positionSize = PositionSizer.calculateVolatilityAdjustedSize(
        atr,
        portfolio,
        maxDrawdown,
        price,
      );

      expect(positionSize).toBeGreaterThan(0);
    });

    it('should reduce position size with higher volatility', () => {
      const portfolio = 100000;
      const maxDrawdown = 0.02;
      const price = 0.001;

      const lowVolSize = PositionSizer.calculateVolatilityAdjustedSize(
        0.0001, // Low volatility
        portfolio,
        maxDrawdown,
        price,
      );

      const highVolSize = PositionSizer.calculateVolatilityAdjustedSize(
        0.001, // High volatility
        portfolio,
        maxDrawdown,
        price,
      );

      expect(lowVolSize).toBeGreaterThanOrEqual(highVolSize);
    });

    it('should increase position size with lower volatility', () => {
      const portfolio = 100000;
      const maxDrawdown = 0.02;
      const price = 0.001;

      const atr1 = 0.00005;
      const atr2 = 0.0001;

      const size1 = PositionSizer.calculateVolatilityAdjustedSize(atr1, portfolio, maxDrawdown, price);
      const size2 = PositionSizer.calculateVolatilityAdjustedSize(atr2, portfolio, maxDrawdown, price);

      expect(size1).toBeGreaterThanOrEqual(size2);
    });

    it('should respect max drawdown limit', () => {
      const portfolio = 100000;
      const maxDrawdown = 0.02; // 2% max
      const price = 0.001;

      const positionSize = PositionSizer.calculateVolatilityAdjustedSize(0.0001, portfolio, maxDrawdown, price);

      expect(positionSize).toBeLessThanOrEqual(portfolio * maxDrawdown);
    });

    it('should scale with portfolio size', () => {
      const atr = 0.0001;
      const maxDrawdown = 0.02;
      const price = 0.001;

      const smallSize = PositionSizer.calculateVolatilityAdjustedSize(atr, 10000, maxDrawdown, price);
      const largeSize = PositionSizer.calculateVolatilityAdjustedSize(atr, 1000000, maxDrawdown, price);

      expect(largeSize).toBeGreaterThan(smallSize);
    });
  });

  describe('Correlation-Adjusted Sizing', () => {
    it('should reduce size for correlated tokens', () => {
      const baseSize = 10000;

      const lowCorr = PositionSizer.calculateCorrelationAdjustedSize(baseSize, 0.1, 0.7);
      const highCorr = PositionSizer.calculateCorrelationAdjustedSize(baseSize, 0.8, 0.7);

      expect(lowCorr).toBeGreaterThan(highCorr);
    });

    it('should skip highly correlated tokens', () => {
      const baseSize = 10000;

      const result = PositionSizer.calculateCorrelationAdjustedSize(baseSize, 0.95, 0.7);

      expect(result).toBe(0); // Too correlated, skip position
    });

    it('should allow diversified positions', () => {
      const baseSize = 10000;

      const result = PositionSizer.calculateCorrelationAdjustedSize(baseSize, -0.3, 0.7);

      expect(result).toBeGreaterThan(0);
    });

    it('should handle negative correlation favorably', () => {
      const baseSize = 10000;

      const negCorr = PositionSizer.calculateCorrelationAdjustedSize(baseSize, -0.5, 0.7);
      const posCorr = PositionSizer.calculateCorrelationAdjustedSize(baseSize, 0.5, 0.7);

      expect(negCorr).toBeGreaterThanOrEqual(posCorr);
    });

    it('should accept correlation threshold parameter', () => {
      const baseSize = 10000;

      // Strict threshold
      const strictResult = PositionSizer.calculateCorrelationAdjustedSize(baseSize, 0.6, 0.5);

      // Lenient threshold
      const lenientResult = PositionSizer.calculateCorrelationAdjustedSize(baseSize, 0.6, 0.8);

      expect(strictResult).toBe(0); // Filtered out
      expect(lenientResult).toBeGreaterThan(0); // Allowed
    });
  });

  describe('Result Validation', () => {
    it('should return valid PositionSizingResult structure', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result).toHaveProperty('positionSize');
      expect(result).toHaveProperty('riskAmount');
      expect(result).toHaveProperty('maxLoss');
      expect(result).toHaveProperty('kellyPercentage');
    });

    it('should have positive position size', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result.positionSize).toBeGreaterThan(0);
    });

    it('should have matching risk amount and max loss', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result.maxLoss).toBe(result.riskAmount);
    });

    it('should have Kelly percentage in valid range', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result.kellyPercentage).toBeGreaterThanOrEqual(0);
      expect(result.kellyPercentage).toBeLessThanOrEqual(1);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should size position for modest win rate (55%)', () => {
      const edge: TradingEdge = {
        winRate: 0.55,
        avgWinRatio: 1.1, // 10% avg win
        avgLossRatio: 0.95, // 5% avg loss
        profitFactor: 1.32, // (1.1 * 0.55) / (0.95 * 0.45)
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result.positionSize).toBeGreaterThan(0);
      expect(result.kellyPercentage).toBeLessThanOrEqual(0.02);
    });

    it('should size position for strong win rate (70%)', () => {
      const edge: TradingEdge = {
        winRate: 0.7,
        avgWinRatio: 1.2, // 20% avg win
        avgLossRatio: 0.9, // 10% avg loss
        profitFactor: 2.8,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result.positionSize).toBeGreaterThan(0);
    });

    it('should handle high profit factor strategy', () => {
      const edge: TradingEdge = {
        winRate: 0.45,
        avgWinRatio: 3.0, // 200% avg win
        avgLossRatio: 0.85, // 15% avg loss
        profitFactor: 8.0, // High quality trades
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result.positionSize).toBeGreaterThan(0);
    });

    it('should be conservative with uncertain edge', () => {
      const uncertainEdge: TradingEdge = {
        winRate: 0.51, // Just above break-even
        avgWinRatio: 1.01,
        avgLossRatio: 0.99,
        profitFactor: 1.02, // Marginal
      };

      const result = PositionSizer.calculateKellySize(uncertainEdge, 100000, 0.25, 0.02);

      expect(result.kellyPercentage).toBeLessThanOrEqual(0.01);
    });
  });

  describe('Safety Features', () => {
    it('should prevent over-leveraging', () => {
      const edge: TradingEdge = {
        winRate: 0.8,
        avgWinRatio: 5,
        avgLossRatio: 0.5,
        profitFactor: 20,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      // Even with exceptional edge, should respect 2% max
      expect(result.kellyPercentage).toBeLessThanOrEqual(0.02);
    });

    it('should provide consistent risk amounts across calculations', () => {
      const edge: TradingEdge = {
        winRate: 0.6,
        avgWinRatio: 1.5,
        avgLossRatio: 0.9,
        profitFactor: 3.0,
      };

      const result = PositionSizer.calculateKellySize(edge, 100000, 0.25, 0.02);

      expect(result.riskAmount).toBeLessThanOrEqual(100000 * 0.02);
    });
  });
});
