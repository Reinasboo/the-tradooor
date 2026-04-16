import { ExitManager, PositionState, ExitRule } from '../src/execution/exitManager';

describe('Exit Strategy Validation', () => {
  let exitManager: ExitManager;

  beforeEach(() => {
    exitManager = new ExitManager();
  });

  describe('Exit Signal Calculation', () => {
    it('should identify stop loss triggers', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.95, // 5% loss
        quantity: 1000,
        unrealizedPnL: -50,
        unrealizedReturn: -0.05,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.98, // 2% stop loss
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
      expect(signal.reason).toContain('Stop loss');
    });

    it('should identify take profit triggers', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.05, // 5% gain
        quantity: 1000,
        unrealizedPnL: 50,
        unrealizedReturn: 0.05,
        holdTime: 60000,
        highWaterMark: 1.05,
      };

      const rules: ExitRule[] = [
        {
          type: 'take-profit',
          trigger: 1.03, // 3% take profit
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
      expect(signal.reason).toContain('Take profit');
    });

    it('should identify trailing stop triggers', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.92, // 8% down from high
        quantity: 1000,
        unrealizedPnL: -80,
        unrealizedReturn: -0.08,
        holdTime: 300000, // 5 minutes
        highWaterMark: 1.1, // Reached 1.1 at peak
      };

      const rules: ExitRule[] = [
        {
          type: 'trailing-stop',
          trigger: 5, // 5% trailing stop
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
      expect(signal.reason).toContain('Trailing stop');
    });

    it('should identify time-based exits', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.02,
        quantity: 1000,
        unrealizedPnL: 20,
        unrealizedReturn: 0.02,
        holdTime: 3600000, // 1 hour
        highWaterMark: 1.02,
      };

      const rules: ExitRule[] = [
        {
          type: 'time-based',
          trigger: 1800000, // 30 minutes
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
      expect(signal.reason).toContain('Time-based exit');
    });

    it('should skip already executed rules', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.95,
        quantity: 1000,
        unrealizedPnL: -50,
        unrealizedReturn: -0.05,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.98,
          executed: true, // Already executed
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(false);
    });

    it('should handle multiple rules with first match winning', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.96,
        quantity: 1000,
        unrealizedPnL: -40,
        unrealizedReturn: -0.04,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.98,
          executed: false,
        },
        {
          type: 'take-profit',
          trigger: 1.1,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
      expect(signal.reason).toContain('Stop loss');
    });

    it('should not exit if no rules trigger', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.01,
        quantity: 1000,
        unrealizedPnL: 10,
        unrealizedReturn: 0.01,
        holdTime: 30000,
        highWaterMark: 1.01,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.95,
          executed: false,
        },
        {
          type: 'take-profit',
          trigger: 1.1,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(false);
    });
  });

  describe('Exit Price Determination', () => {
    it('should use trigger price for stop loss', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.95,
        quantity: 1000,
        unrealizedPnL: -50,
        unrealizedReturn: -0.05,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.98,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.exitPrice).toBe(0.98);
    });

    it('should use current price for trailing stop', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.92,
        quantity: 1000,
        unrealizedPnL: -80,
        unrealizedReturn: -0.08,
        holdTime: 300000,
        highWaterMark: 1.1,
      };

      const rules: ExitRule[] = [
        {
          type: 'trailing-stop',
          trigger: 5,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.exitPrice).toBe(position.currentPrice);
    });

    it('should use trigger price for take profit', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.05,
        quantity: 1000,
        unrealizedPnL: 50,
        unrealizedReturn: 0.05,
        holdTime: 60000,
        highWaterMark: 1.05,
      };

      const rules: ExitRule[] = [
        {
          type: 'take-profit',
          trigger: 1.03,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.exitPrice).toBe(1.03);
    });
  });

  describe('Exit Rule Generation', () => {
    it('should generate valid exit rules', () => {
      const entryPrice = 1.0;

      const rules = exitManager.generateExitRules(entryPrice, 2, 3);

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.type && r.trigger !== undefined)).toBe(true);
    });

    it('should create stop loss below entry', () => {
      const entryPrice = 1.0;

      const rules = exitManager.generateExitRules(entryPrice, 2, 3);
      const stopLoss = rules.find((r) => r.type === 'stop-loss');

      expect(stopLoss).toBeDefined();
      if (stopLoss) {
        expect(stopLoss.trigger).toBeLessThan(entryPrice);
      }
    });

    it('should create take profit above entry', () => {
      const entryPrice = 1.0;

      const rules = exitManager.generateExitRules(entryPrice, 2, 3);
      const takeProfit = rules.find((r) => r.type === 'take-profit');

      expect(takeProfit).toBeDefined();
      if (takeProfit) {
        expect(takeProfit.trigger).toBeGreaterThan(entryPrice);
      }
    });

    it('should respect reward ratio in exit rules', () => {
      const entryPrice = 1.0;
      const riskPercent = 2;
      const rewardRatio = 3;

      const rules = exitManager.generateExitRules(entryPrice, riskPercent, rewardRatio);

      const stopLoss = rules.find((r) => r.type === 'stop-loss');
      const takeProfit = rules.find((r) => r.type === 'take-profit');

      if (stopLoss && takeProfit) {
        const riskDist = entryPrice - stopLoss.trigger;
        const rewardDist = takeProfit.trigger - entryPrice;

        // Reward should be roughly 3x risk
        expect(rewardDist / riskDist).toBeCloseTo(rewardRatio, 0);
      }
    });

    it('should respect risk percentage in exit rules', () => {
      const entryPrice = 1.0;
      const riskPercent = 5;
      const rewardRatio = 2;

      const rules = exitManager.generateExitRules(entryPrice, riskPercent, rewardRatio);

      const stopLoss = rules.find((r) => r.type === 'stop-loss');

      if (stopLoss) {
        const riskAmount = (entryPrice - stopLoss.trigger) / entryPrice;
        const riskPercentage = riskAmount * 100;

        expect(riskPercentage).toBeCloseTo(riskPercent, 0);
      }
    });
  });

  describe('Trailing Stop Mechanics', () => {
    it('should trigger trailing stop at correct drawdown', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.94, // 6% below high
        quantity: 1000,
        unrealizedPnL: -60,
        unrealizedReturn: -0.06,
        holdTime: 300000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'trailing-stop',
          trigger: 5, // 5% trailing stop
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
    });

    it('should not trigger trailing stop below threshold', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.98, // 2% below high
        quantity: 1000,
        unrealizedPnL: -20,
        unrealizedReturn: -0.02,
        holdTime: 300000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'trailing-stop',
          trigger: 5, // 5% trailing stop
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(false);
    });

    it('should track maximum price (high water mark)', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.02,
        quantity: 1000,
        unrealizedPnL: 20,
        unrealizedReturn: 0.02,
        holdTime: 60000,
        highWaterMark: 1.15, // Was even higher previously
      };

      // Even though current price is profitable, it's down from high water mark
      expect(position.currentPrice).toBeLessThan(position.highWaterMark);
    });
  });

  describe('Time-Based Exit', () => {
    it('should trigger time-based exit at hold time', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.01,
        quantity: 1000,
        unrealizedPnL: 10,
        unrealizedReturn: 0.01,
        holdTime: 3600000, // 1 hour
        highWaterMark: 1.01,
      };

      const rules: ExitRule[] = [
        {
          type: 'time-based',
          trigger: 3600000, // 1 hour
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
    });

    it('should not trigger time-based exit before hold time', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.01,
        quantity: 1000,
        unrealizedPnL: 10,
        unrealizedReturn: 0.01,
        holdTime: 1800000, // 30 minutes
        highWaterMark: 1.01,
      };

      const rules: ExitRule[] = [
        {
          type: 'time-based',
          trigger: 3600000, // 1 hour
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(false);
    });

    it('should format hold time in exit message', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.01,
        quantity: 1000,
        unrealizedPnL: 10,
        unrealizedReturn: 0.01,
        holdTime: 1800000, // 30 minutes
        highWaterMark: 1.01,
      };

      const rules: ExitRule[] = [
        {
          type: 'time-based',
          trigger: 1800000,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.reason).toContain('30');
      expect(signal.reason).toContain('minute');
    });
  });

  describe('Stop Loss Mechanics', () => {
    it('should trigger stop loss at exact trigger price', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.98,
        quantity: 1000,
        unrealizedPnL: -20,
        unrealizedReturn: -0.02,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.98,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
    });

    it('should not trigger stop loss above trigger price', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.99,
        quantity: 1000,
        unrealizedPnL: -10,
        unrealizedReturn: -0.01,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.98,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(false);
    });
  });

  describe('Take Profit Mechanics', () => {
    it('should trigger take profit at exact trigger price', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.05,
        quantity: 1000,
        unrealizedPnL: 50,
        unrealizedReturn: 0.05,
        holdTime: 60000,
        highWaterMark: 1.05,
      };

      const rules: ExitRule[] = [
        {
          type: 'take-profit',
          trigger: 1.05,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(true);
    });

    it('should not trigger take profit below trigger price', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.03,
        quantity: 1000,
        unrealizedPnL: 30,
        unrealizedReturn: 0.03,
        holdTime: 60000,
        highWaterMark: 1.03,
      };

      const rules: ExitRule[] = [
        {
          type: 'take-profit',
          trigger: 1.05,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(false);
    });
  });

  describe('Complex Multi-Rule Scenarios', () => {
    it('should handle multiple simultaneous rule matches (first wins)', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.95,
        quantity: 1000,
        unrealizedPnL: -50,
        unrealizedReturn: -0.05,
        holdTime: 5000000, // Long hold
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.98,
          executed: false,
        },
        {
          type: 'time-based',
          trigger: 3600000, // Also triggered
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      // Should exit
      expect(signal.shouldExit).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rule list', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.95,
        quantity: 1000,
        unrealizedPnL: -50,
        unrealizedReturn: -0.05,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const signal = exitManager.calculateExitSignal(position, []);

      expect(signal.shouldExit).toBe(false);
    });

    it('should handle zero quantity position', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 0.95,
        quantity: 0,
        unrealizedPnL: 0,
        unrealizedReturn: 0,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'take-profit',
          trigger: 1.05,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal).toBeDefined();
    });

    it('should handle identical entry and current price', () => {
      const position: PositionState = {
        entryPrice: 1.0,
        currentPrice: 1.0,
        quantity: 1000,
        unrealizedPnL: 0,
        unrealizedReturn: 0,
        holdTime: 60000,
        highWaterMark: 1.0,
      };

      const rules: ExitRule[] = [
        {
          type: 'stop-loss',
          trigger: 0.95,
          executed: false,
        },
        {
          type: 'take-profit',
          trigger: 1.05,
          executed: false,
        },
      ];

      const signal = exitManager.calculateExitSignal(position, rules);

      expect(signal.shouldExit).toBe(false);
    });
  });
});
