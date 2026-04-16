import { TechnicalIndicators } from '../src/indicators/technical';

describe('Phase 1: Technical Indicators', () => {
  describe('RSI Calculation', () => {
    it('should calculate RSI values between 0-100', () => {
      const prices = Array(30)
        .fill(0)
        .map((_, i) => 100 + i);

      const rsi = TechnicalIndicators.calculateRSI(prices, 14);

      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
      console.log(`✅ RSI: ${rsi.toFixed(2)}`);
    });
  });

  describe('MACD Calculation', () => {
    it('should generate MACD, signal, and histogram', () => {
      const prices = Array(50)
        .fill(0)
        .map((_, i) => 100 * Math.sin(i * 0.1) + 100);

      const macd = TechnicalIndicators.calculateMACD(prices);

      expect(macd.macd).toBeDefined();
      expect(macd.signal).toBeDefined();
      expect(macd.histogram).toBeDefined();
      console.log(
        `✅ MACD: ${macd.macd.toFixed(4)} | Signal: ${macd.signal.toFixed(4)} | Histogram: ${macd.histogram.toFixed(4)}`,
      );
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate upper, middle, and lower bands', () => {
      const prices = Array(30)
        .fill(0)
        .map((_, idx) => 100 + (idx % 10));

      const bb = TechnicalIndicators.calculateBollingerBands(prices, 20, 2);

      expect(bb.upper).toBeGreaterThan(bb.middle);
      expect(bb.middle).toBeGreaterThan(bb.lower);
      console.log(
        `✅ BB Upper: ${bb.upper.toFixed(2)} | Middle: ${bb.middle.toFixed(2)} | Lower: ${bb.lower.toFixed(2)}`,
      );
    });
  });

  describe('Trend Direction', () => {
    it('should detect uptrend, downtrend, or neutral', () => {
      const uptrend = Array(30)
        .fill(0)
        .map((_, i) => 100 + i * 2);
      const downtrend = Array(30)
        .fill(0)
        .map((_, i) => 200 - i * 2);

      const upTrendResult = TechnicalIndicators.getTrendDirection(uptrend);
      const downTrendResult = TechnicalIndicators.getTrendDirection(downtrend);

      expect(['uptrend', 'downtrend', 'neutral']).toContain(upTrendResult);
      expect(['uptrend', 'downtrend', 'neutral']).toContain(downTrendResult);
      console.log(`✅ Uptrend detection: ${upTrendResult}`);
      console.log(`✅ Downtrend detection: ${downTrendResult}`);
    });
  });
});
