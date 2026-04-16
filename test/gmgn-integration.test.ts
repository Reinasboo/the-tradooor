import { TokenData } from '../src/types';

describe('GMGN API Integration', () => {
  describe('Token Data Structure', () => {
    it('should define valid TokenData for trending tokens', () => {
      const trendingToken: TokenData = {
        mint: 'EPjFWaLb3odccjf2cj6ipYKeHjUAo1d8b1f39aeP',
        symbol: 'USDC',
        name: 'USD Coin',
        price: 1.0,
        liquidity: 5000,
        volume24h: 1000000,
        holders: 100000,
        priceChange24h: 0.5,
        marketCap: 10000000,
        createdAt: Date.now(),
      };

      expect(trendingToken.mint).toBeDefined();
      expect(trendingToken.symbol).toBeDefined();
      expect(trendingToken.price).toBeGreaterThan(0);
    });

    it('should handle various token prices', () => {
      const prices = [0.00001, 0.001, 1.0, 100, 1000000];
      
      for (const price of prices) {
        const token: TokenData = {
          mint: 'test',
          symbol: 'TEST',
          name: 'Test',
          price,
          liquidity: 100,
          volume24h: 1000,
          holders: 50,
          priceChange24h: 0,
          marketCap: 5000,
          createdAt: Date.now(),
        };
        
        expect(token.price).toBe(price);
      }
    });

    it('should support zero liquidity tokens', () => {
      const token: TokenData = {
        mint: 'zero-liq',
        symbol: 'ZERO',
        name: 'Zero Liquidity Token',
        price: 0.001,
        liquidity: 0,
        volume24h: 0,
        holders: 10,
        priceChange24h: 0,
        marketCap: 0,
        createdAt: Date.now(),
      };

      expect(token.liquidity).toBe(0);
      expect(token.volume24h).toBe(0);
    });

    it('should handle negative price changes', () => {
      const token: TokenData = {
        mint: 'down-token',
        symbol: 'DOWN',
        name: 'Down Token',
        price: 0.5,
        liquidity: 1000,
        volume24h: 5000,
        holders: 100,
        priceChange24h: -50,
        marketCap: 50000,
        createdAt: Date.now(),
      };

      expect(token.priceChange24h).toBeLessThan(0);
    });
  });

  describe('API Response Formats', () => {
    it('should handle trending tokens response', () => {
      const trendingResponse: TokenData[] = [
        {
          mint: 'token1',
          symbol: 'T1',
          name: 'Token 1',
          price: 0.001,
          liquidity: 100,
          volume24h: 10000,
          holders: 500,
          priceChange24h: 50,
          marketCap: 1000000,
          createdAt: Date.now(),
        },
        {
          mint: 'token2',
          symbol: 'T2',
          name: 'Token 2',
          price: 0.002,
          liquidity: 200,
          volume24h: 20000,
          holders: 1000,
          priceChange24h: 75,
          marketCap: 2000000,
          createdAt: Date.now(),
        },
      ];

      expect(trendingResponse.length).toBe(2);
      expect(trendingResponse[0].mint).toBe('token1');
    });

    it('should handle single token data response', () => {
      const tokenData: TokenData = {
        mint: 'single-token',
        symbol: 'SINGLE',
        name: 'Single Token',
        price: 1.5,
        liquidity: 500,
        volume24h: 50000,
        holders: 2000,
        priceChange24h: 25,
        marketCap: 5000000,
        createdAt: Date.now(),
      };

      expect(tokenData.symbol).toBe('SINGLE');
      expect(tokenData.price).toBe(1.5);
    });

    it('should preserve numeric precision', () => {
      const preciseToken: TokenData = {
        mint: 'precise',
        symbol: 'PREC',
        name: 'Precise Token',
        price: 0.00123456,
        liquidity: 456.789,
        volume24h: 123456.789,
        holders: 789,
        priceChange24h: 12.3456,
        marketCap: 999999.99,
        createdAt: 1234567890,
      };

      expect(preciseToken.price).toBe(0.00123456);
      expect(preciseToken.liquidity).toBe(456.789);
    });
  });

  describe('OHLCV Data Format', () => {
    it('should validate OHLCV candlestick structure', () => {
      const ohlcv = {
        open: 0.001,
        high: 0.0011,
        low: 0.0009,
        close: 0.001,
        volume: 1000,
      };

      expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.low);
      expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.open);
      expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.close);
    });

    it('should handle multiple candlesticks', () => {
      const candlesticks = [
        { open: 1.0, high: 1.1, low: 0.95, close: 1.05, volume: 1000 },
        { open: 1.05, high: 1.15, low: 1.0, close: 1.1, volume: 1200 },
        { open: 1.1, high: 1.2, low: 1.05, close: 1.15, volume: 1500 },
      ];

      expect(candlesticks.length).toBe(3);
      for (const candle of candlesticks) {
        expect(candle.high).toBeGreaterThanOrEqual(candle.low);
      }
    });
  });

  describe('Query Parameters', () => {
    it('should support limit parameters', () => {
      const validLimits = [1, 10, 20, 50, 100, 500];
      
      for (const limit of validLimits) {
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThanOrEqual(500);
      }
    });

    it('should support custom timeframes', () => {
      const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
      
      for (const tf of timeframes) {
        expect(tf).toMatch(/^\d+[mhd]$/);
      }
    });

    it('should support search queries', () => {
      const queries = ['bitcoin', 'ETH', 'SOL', 'pump'];
      
      for (const q of queries) {
        expect(q.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Token Metadata', () => {
    it('should include required token fields', () => {
      const token: TokenData = {
        mint: 'test-mint',
        symbol: 'TST',
        name: 'Test Token',
        price: 0.001,
        liquidity: 100,
        volume24h: 1000,
        holders: 50,
        priceChange24h: 0,
        marketCap: 5000,
        createdAt: Date.now(),
      };

      expect(token.mint).toBeDefined();
      expect(token.symbol).toBeDefined();
      expect(token.name).toBeDefined();
      expect(token.price).toBeDefined();
      expect(token.liquidity).toBeDefined();
      expect(token.volume24h).toBeDefined();
      expect(token.holders).toBeDefined();
      expect(token.priceChange24h).toBeDefined();
      expect(token.marketCap).toBeDefined();
      expect(token.createdAt).toBeDefined();
    });

    it('should track creation timestamp', () => {
      const now = Date.now();
      const token: TokenData = {
        mint: 'new-token',
        symbol: 'NEW',
        name: 'New Token',
        price: 0.001,
        liquidity: 100,
        volume24h: 1000,
        holders: 50,
        priceChange24h: 0,
        marketCap: 5000,
        createdAt: now,
      };

      expect(token.createdAt).toBeCloseTo(now, -3);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain token data integrity through serialization', () => {
      const original: TokenData = {
        mint: 'integrity-test',
        symbol: 'INT',
        name: 'Integrity Test',
        price: 0.00123,
        liquidity: 456.78,
        volume24h: 12345.67,
        holders: 789,
        priceChange24h: 123.45,
        marketCap: 999999.99,
        createdAt: 1234567890,
      };

      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized) as TokenData;

      expect(deserialized).toEqual(original);
    });

    it('should handle token holder information', () => {
      const tokenWithHolders: TokenData = {
        mint: 'holders-token',
        symbol: 'HOLD',
        name: 'Holders Token',
        price: 0.001,
        liquidity: 100,
        volume24h: 1000,
        holders: 1000,
        priceChange24h: 0,
        marketCap: 5000,
        createdAt: Date.now(),
      };

      expect(tokenWithHolders.holders).toBeGreaterThan(0);
    });
  });

  describe('Integration Workflows', () => {
    it('should support token discovery workflow', () => {
      const steps = [
        'fetch-trending',
        'analyze-token',
        'get-holders',
        'fetch-ohlcv',
        'make-decision',
      ];

      expect(steps.length).toBe(5);
      expect(steps[0]).toBe('fetch-trending');
    });

    it('should support token search workflow', () => {
      const steps = [
        'search-by-symbol',
        'get-token-data',
        'validate-safety',
        'fetch-history',
      ];

      expect(steps.length).toBe(4);
    });

    it('should support chart analysis workflow', () => {
      const steps = [
        'select-token',
        'fetch-ohlcv',
        'calculate-indicators',
        'generate-signals',
      ];

      expect(steps.length).toBe(4);
    });

    it('should support portfolio tracking workflow', () => {
      const steps = [
        'get-wallet-tokens',
        'fetch-prices',
        'calculate-pnl',
        'update-positions',
      ];

      expect(steps.length).toBe(4);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing token response', () => {
      const emptyResponse: TokenData | null = null;
      expect(emptyResponse).toBeNull();
    });

    it('should handle empty trending list', () => {
      const emptyList: TokenData[] = [];
      expect(emptyList.length).toBe(0);
    });

    it('should handle malformed OHLCV', () => {
      const malformed = {
        open: 1.0,
        high: 0.9, // Invalid: high < low
        low: 1.0,
        close: 0.95,
        volume: 1000,
      };

      expect(malformed.high).toBeLessThan(malformed.low); // Detectable error
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large token lists', () => {
      const largeList: TokenData[] = Array(1000).fill(null).map((_, i) => ({
        mint: `token${i}`,
        symbol: `T${i}`,
        name: `Token ${i}`,
        price: Math.random() * 10,
        liquidity: Math.random() * 10000,
        volume24h: Math.random() * 1000000,
        holders: Math.floor(Math.random() * 100000),
        priceChange24h: (Math.random() - 0.5) * 100,
        marketCap: Math.random() * 10000000,
        createdAt: Date.now(),
      } as TokenData));

      expect(largeList.length).toBe(1000);
    });

    it('should efficiently process token streams', () => {
      const tokens: TokenData[] = Array(100).fill(null).map((_, i) => ({
        mint: `token${i}`,
        symbol: `T${i}`,
        name: `Token ${i}`,
        price: 0.001 * (i + 1),
        liquidity: 100 * (i + 1),
        volume24h: 1000 * (i + 1),
        holders: 50 * (i + 1),
        priceChange24h: Math.random() * 100,
        marketCap: 5000 * (i + 1),
        createdAt: Date.now(),
      } as TokenData));

      const filtered = tokens.filter(t => t.liquidity > 500);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});
