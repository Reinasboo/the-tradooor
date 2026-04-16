import { MEVProtection, FrontRunRisk, ProtectedExecutionConfig } from '../src/execution/mevProtection';

describe('MEV Protection Mechanisms', () => {
  let mevProtection: MEVProtection;

  beforeEach(() => {
    mevProtection = new MEVProtection();
  });

  describe('Front-Run Risk Detection', () => {
    it('should detect low-risk trade conditions', () => {
      const risk: FrontRunRisk = mevProtection.detectFrontRunRisk(
        1000, // High liquidity
        10, // Small trade
        2, // Few pending orders
      );

      expect(risk.riskScore).toBeLessThanOrEqual(0.5);
      expect(['safe', 'caution']).toContain(risk.recommendation);
      expect(risk.mempoolActivity).toBeLessThanOrEqual(2);
    });

    it('should detect elevated-risk conditions', () => {
      const risk: FrontRunRisk = mevProtection.detectFrontRunRisk(
        500, // Medium liquidity
        50, // Medium trade
        5, // Moderate pending orders
      );

      expect(risk.riskScore).toBeGreaterThanOrEqual(0.3);
      expect(['caution', 'avoid']).toContain(risk.recommendation);
    });

    it('should detect avoid-level risk', () => {
      const risk: FrontRunRisk = mevProtection.detectFrontRunRisk(
        100, // Low liquidity
        80, // Large trade relative to liquidity
        10, // Many pending orders
      );

      expect(risk.riskScore).toBeGreaterThanOrEqual(0.6);
      expect(risk.recommendation).toBe('avoid');
    });

    it('should penalize large trades relative to liquidity', () => {
      const riskSmall = mevProtection.detectFrontRunRisk(1000, 5, 0);
      const riskLarge = mevProtection.detectFrontRunRisk(1000, 150, 0);

      expect(riskLarge.riskScore).toBeGreaterThan(riskSmall.riskScore);
    });

    it('should account for mempool activity', () => {
      const riskQuiet = mevProtection.detectFrontRunRisk(500, 50, 0);
      const riskBusy = mevProtection.detectFrontRunRisk(500, 50, 10);

      expect(riskBusy.riskScore).toBeGreaterThan(riskQuiet.riskScore);
    });

    it('should clamp risk score between 0 and 1', () => {
      const risk = mevProtection.detectFrontRunRisk(
        1,
        1000, // Extreme trade size
        100, // Many orders
      );

      expect(risk.riskScore).toBeGreaterThanOrEqual(0);
      expect(risk.riskScore).toBeLessThanOrEqual(1);
    });

    it('should provide descriptive reason for risk', () => {
      const riskLarge = mevProtection.detectFrontRunRisk(100, 80, 0);
      const riskBusy = mevProtection.detectFrontRunRisk(1000, 10, 10);

      expect(riskLarge.reason).toContain('Large trade');
      expect(riskBusy.reason).toContain('pending orders');
    });

    it('should cap mempool activity scoring at 10', () => {
      const risk2 = mevProtection.detectFrontRunRisk(1000, 10, 20);
      const risk3 = mevProtection.detectFrontRunRisk(1000, 10, 100);

      // With high activity, scores should be similar
      expect(Math.abs(risk2.riskScore - risk3.riskScore)).toBeLessThan(0.1);
    });
  });

  describe('Trade Size Risk Analysis', () => {
    it('should identify small trades as safe', () => {
      const risk = mevProtection.detectFrontRunRisk(10000, 100, 0);
      // Trade is 1% of liquidity
      expect(risk.riskScore).toBeLessThanOrEqual(0.4);
    });

    it('should flag medium trades as medium risk', () => {
      const risk = mevProtection.detectFrontRunRisk(1000, 75, 0);
      // Trade is 7.5% of liquidity
      expect(risk.riskScore).toBeGreaterThan(0.1);
      expect(risk.riskScore).toBeLessThanOrEqual(0.5);
    });

    it('should flag large trades as high risk', () => {
      const risk = mevProtection.detectFrontRunRisk(100, 50, 0);
      // Trade is 50% of liquidity
      expect(risk.riskScore).toBeGreaterThan(0.25);
    });
  });

  describe('Mempool Analysis', () => {
    it('should report accurate mempool activity count', () => {
      const risk = mevProtection.detectFrontRunRisk(1000, 10, 3);
      expect(risk.mempoolActivity).toBe(3);
    });

    it('should cap mempool reporting at activity level', () => {
      const risk2 = mevProtection.detectFrontRunRisk(1000, 10, 15);

      // Activity reporting caps at observed value or 10
      expect(risk2.mempoolActivity).toBe(10); // Capped
    });
  });

  describe('Jito Protection', () => {
    it('should execute with Jito protection', async () => {
      const mockTx = { signature: 'test-sig' };
      const result = await mevProtection.executeWithJitoProtection(mockTx);

      expect(result.txHash).toBeDefined();
      expect(result.protected).toBe(true);
      expect(result.txHash.startsWith('bundle_')).toBe(true);
    });

    it('should generate valid bundle ID', async () => {
      const mockTx = { signature: 'test-sig' };
      const result = await mevProtection.executeWithJitoProtection(mockTx);

      expect(result.txHash).toMatch(/^bundle_[a-z0-9]+$/);
    });

    it('should support custom Jito tip', async () => {
      const mockTx = { signature: 'test-sig' };
      const customTip = 100000; // 0.1 SOL

      const result = await mevProtection.executeWithJitoProtection(mockTx, customTip);

      expect(result.protected).toBe(true);
    });

    it('should use default Jito tip when not specified', async () => {
      const mockTx = { signature: 'test-sig' };

      const result = await mevProtection.executeWithJitoProtection(mockTx);

      // Should complete successfully with default tip (50000 lamports)
      expect(result.protected).toBe(true);
    });
  });

  describe('Private Pool Execution', () => {
    it('should execute via private pool', async () => {
      const mockTx = { signature: 'test-sig' };
      const result = await mevProtection.executeViaPrivatePool(mockTx);

      expect(result.txHash).toBeDefined();
      expect(result.route).toBe('private-rpc');
      expect(result.txHash.startsWith('private_')).toBe(true);
    });

    it('should mark execution as private-rpc route', async () => {
      const mockTx = { signature: 'test-sig' };
      const result = await mevProtection.executeViaPrivatePool(mockTx);

      expect(result.route).toBe('private-rpc');
    });

    it('should generate unique transaction hashes', async () => {
      const mockTx = { signature: 'test-sig' };

      const result1 = await mevProtection.executeViaPrivatePool(mockTx);
      const result2 = await mevProtection.executeViaPrivatePool(mockTx);

      expect(result1.txHash).not.toBe(result2.txHash);
    });
  });

  describe('Protection Configuration', () => {
    it('should define valid MEV protection config', () => {
      const config: ProtectedExecutionConfig = {
        useMEVProtection: true,
        jitoTipPercentage: 0.001,
        maxSlippage: 0.05,
        maxWaitTime: 30000,
      };

      expect(config.useMEVProtection).toBe(true);
      expect(config.jitoTipPercentage).toBeGreaterThan(0);
      expect(config.maxSlippage).toBeGreaterThan(0);
      expect(config.maxWaitTime).toBeGreaterThan(0);
    });

    it('should support disabling MEV protection', () => {
      const config: ProtectedExecutionConfig = {
        useMEVProtection: false,
        jitoTipPercentage: 0,
        maxSlippage: 0.05,
        maxWaitTime: 30000,
      };

      expect(config.useMEVProtection).toBe(false);
    });

    it('should validate realistic slippage values', () => {
      const config: ProtectedExecutionConfig = {
        useMEVProtection: true,
        jitoTipPercentage: 0.001,
        maxSlippage: 0.1, // 10% max slippage
        maxWaitTime: 30000,
      };

      expect(config.maxSlippage).toBeGreaterThan(0);
      expect(config.maxSlippage).toBeLessThan(1);
    });

    it('should validate timeout configuration', () => {
      const config: ProtectedExecutionConfig = {
        useMEVProtection: true,
        jitoTipPercentage: 0.001,
        maxSlippage: 0.05,
        maxWaitTime: 60000, // 1 minute
      };

      expect(config.maxWaitTime).toBeGreaterThan(0);
    });
  });

  describe('Risk Scoring Consistency', () => {
    it('should produce consistent risk scores for identical conditions', () => {
      const conditions = { liquidity: 1000, tradeAmount: 50, pendingOrders: 5 };

      const risk1 = mevProtection.detectFrontRunRisk(
        conditions.liquidity,
        conditions.tradeAmount,
        conditions.pendingOrders,
      );

      const risk2 = mevProtection.detectFrontRunRisk(
        conditions.liquidity,
        conditions.tradeAmount,
        conditions.pendingOrders,
      );

      expect(risk1.riskScore).toBe(risk2.riskScore);
      expect(risk1.recommendation).toBe(risk2.recommendation);
    });

    it('should monotonically increase risk with higher pending orders', () => {
      const risks = [
        mevProtection.detectFrontRunRisk(1000, 50, 0).riskScore,
        mevProtection.detectFrontRunRisk(1000, 50, 3).riskScore,
        mevProtection.detectFrontRunRisk(1000, 50, 6).riskScore,
      ];

      expect(risks[0]).toBeLessThan(risks[1]);
      expect(risks[1]).toBeLessThan(risks[2]);
    });

    it('should monotonically increase risk with larger trades', () => {
      const risks = [
        mevProtection.detectFrontRunRisk(1000, 10, 2).riskScore,
        mevProtection.detectFrontRunRisk(1000, 50, 2).riskScore,
        mevProtection.detectFrontRunRisk(1000, 100, 2).riskScore,
      ];

      expect(risks[0]).toBeLessThanOrEqual(risks[1]);
      expect(risks[1]).toBeLessThanOrEqual(risks[2]);
    });

    it('should monotonically decrease risk with higher liquidity', () => {
      const risks = [
        mevProtection.detectFrontRunRisk(100, 50, 2).riskScore,
        mevProtection.detectFrontRunRisk(500, 50, 2).riskScore,
        mevProtection.detectFrontRunRisk(1000, 50, 2).riskScore,
      ];

      expect(risks[0]).toBeGreaterThan(risks[1]);
      expect(risks[1]).toBeGreaterThan(risks[2]);
    });
  });

  describe('Extreme Scenarios', () => {
    it('should handle zero liquidity edge case', () => {
      const risk = mevProtection.detectFrontRunRisk(0.01, 1, 0);
      expect(risk.riskScore).toBeGreaterThanOrEqual(0.3);
    });

    it('should handle very high activity', () => {
      const risk = mevProtection.detectFrontRunRisk(1000, 10, 1000);
      expect(risk.riskScore).toBeLessThanOrEqual(1);
      expect(risk.recommendation).toBe('avoid');
    });

    it('should handle very small trade amounts', () => {
      const risk = mevProtection.detectFrontRunRisk(10000, 0.1, 0);
      expect(risk.riskScore).toBeLessThanOrEqual(0.4);
    });
  });
});
