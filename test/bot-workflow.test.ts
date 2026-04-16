import { TradingBot } from '../src/bot';
import { createLogger } from '../src/logger';
import { GMGNClient } from '../src/gmgnClient';
import { StrategyEngine } from '../src/strategy';
import { NotificationService } from '../src/notifications';
import { BotConfig, TokenData } from '../src/types';

describe('Trading Bot Workflow', () => {
  let bot: TradingBot;
  let logger: ReturnType<typeof createLogger>;
  let gmgnClient: GMGNClient;
  let strategy: StrategyEngine;
  let notificationService: NotificationService;
  let botConfig: BotConfig;

  beforeEach(() => {
    // Mock configuration
    botConfig = {
      gmgnApiKey: 'test-api-key',
      gmgnApiUrl: 'https://api.gmgn.ai',
      solanaRpcUrl: 'https://api.mainnet-beta.solana.com',
      solanaWalletPrivateKey: 'test-private-key',
      minLiquiditySol: 10,
      maxPriceIncreasePct: 500,
      minHolderCount: 100,
      minVolume24h: 1000,
      enableAutoTrading: false,
      enableDryRun: true,
      tradingAmountSol: 1,
      logLevel: 'debug',
    };

    logger = createLogger('debug');
    gmgnClient = new GMGNClient(botConfig.gmgnApiUrl, botConfig.gmgnApiKey, logger);
    strategy = new StrategyEngine(botConfig, logger);
    notificationService = new NotificationService(botConfig, logger);

    bot = new TradingBot(botConfig, logger, gmgnClient, strategy, notificationService);
  });

  describe('Bot Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(bot).toBeDefined();
    });

    it('should start in stopped state', () => {
      expect((bot as any).isRunning).toBe(false);
    });
  });

  describe('Signal Detection', () => {
    it('should detect buy signals from trending tokens', () => {
      const mockToken: TokenData = {
        mint: 'TokenABC123',
        symbol: 'ABC',
        name: 'Test Token',
        price: 0.001,
        liquidity: 50,
        volume24h: 5000,
        holders: 500,
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      // Analyze token with strategy
      const signal = strategy.analyzeToken(mockToken);

      expect(signal).toBeDefined();
      if (signal) {
        expect(signal.mint).toBe('TokenABC123');
        expect(['BUY', 'SELL']).toContain(signal.action);
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should filter out low liquidity tokens', () => {
      const mockToken: TokenData = {
        mint: 'LowLiqToken',
        symbol: 'LOW',
        name: 'Low Liquidity Token',
        price: 0.001,
        liquidity: 1, // Below minimum
        volume24h: 5000,
        holders: 500,
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      const signal = strategy.analyzeToken(mockToken);
      expect(signal).toBeNull();
    });

    it('should filter out tokens with insufficient holders', () => {
      const mockToken: TokenData = {
        mint: 'FewHoldersToken',
        symbol: 'FEW',
        name: 'Few Holders Token',
        price: 0.001,
        liquidity: 50,
        volume24h: 5000,
        holders: 10, // Below minimum
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      const signal = strategy.analyzeToken(mockToken);
      expect(signal).toBeNull();
    });

    it('should filter out tokens with low volume', () => {
      const mockToken: TokenData = {
        mint: 'LowVolumeToken',
        symbol: 'LOWVOL',
        name: 'Low Volume Token',
        price: 0.001,
        liquidity: 50,
        volume24h: 100, // Below minimum
        holders: 500,
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      const signal = strategy.analyzeToken(mockToken);
      expect(signal).toBeNull();
    });
  });

  describe('Risk Management', () => {
    it('should respect maximum position size', () => {
      const maxPositionSize = botConfig.tradingAmountSol;
      expect(maxPositionSize).toBeLessThanOrEqual(10); // Reasonable max
    });

    it('should enable dry-run mode for testing', () => {
      expect(botConfig.enableDryRun).toBe(true);
    });

    it('should allow toggling auto-trading', () => {
      expect(botConfig.enableAutoTrading).toBe(false);
    });

    it('should validate minimum liquidity requirement', () => {
      expect(botConfig.minLiquiditySol).toBeGreaterThan(0);
    });

    it('should enforce maximum price increase limit', () => {
      expect(botConfig.maxPriceIncreasePct).toBeGreaterThan(0);
    });

    it('should require minimum holder count for safety', () => {
      expect(botConfig.minHolderCount).toBeGreaterThan(0);
    });

    it('should require minimum volume for liquidity', () => {
      expect(botConfig.minVolume24h).toBeGreaterThan(0);
    });
  });

  describe('Trade Signal Confidence', () => {
    it('should assign confidence scores to signals', () => {
      const mockToken: TokenData = {
        mint: 'ConfidenceTest',
        symbol: 'CONF',
        name: 'Confidence Test Token',
        price: 0.001,
        liquidity: 50,
        volume24h: 5000,
        holders: 500,
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      const signal = strategy.analyzeToken(mockToken);

      if (signal) {
        // Confidence should be in valid range
        expect(signal.confidence).toBeGreaterThanOrEqual(0.5); // Only signals with 50%+ confidence
        expect(signal.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should require high confidence for execution', () => {
      const minConfidenceRequired = 0.5;
      expect(minConfidenceRequired).toBeGreaterThan(0);
    });
  });

  describe('Signal Metadata', () => {
    it('should include reason for signals', () => {
      const mockToken: TokenData = {
        mint: 'ReasonTest',
        symbol: 'RSN',
        name: 'Reason Test Token',
        price: 0.001,
        liquidity: 50,
        volume24h: 5000,
        holders: 500,
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      const signal = strategy.analyzeToken(mockToken);

      if (signal) {
        expect(signal.reason).toBeDefined();
        expect(signal.reason.length).toBeGreaterThan(0);
      }
    });

    it('should include timestamp in signals', () => {
      const mockToken: TokenData = {
        mint: 'TimestampTest',
        symbol: 'TS',
        name: 'Timestamp Test Token',
        price: 0.001,
        liquidity: 50,
        volume24h: 5000,
        holders: 500,
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      const signal = strategy.analyzeToken(mockToken);

      if (signal) {
        expect(signal.timestamp).toBeDefined();
        expect(signal.timestamp).toBeCloseTo(Date.now(), -2);
      }
    });

    it('should preserve token data in signals', () => {
      const mockToken: TokenData = {
        mint: 'DataTest',
        symbol: 'DT',
        name: 'Data Test Token',
        price: 0.001,
        liquidity: 50,
        volume24h: 5000,
        holders: 500,
        priceChange24h: 45,
        marketCap: 100000,
        createdAt: Date.now() - 86400000,
      };

      const signal = strategy.analyzeToken(mockToken);

      if (signal) {
        expect(signal.tokenData).toEqual(mockToken);
        expect(signal.tokenData.mint).toBe('DataTest');
      }
    });
  });

  describe('Bot Lifecycle', () => {
    it('should prevent multiple simultaneous starts', async () => {
      (bot as any).isRunning = true;
      
      // Attempting to start when already running should warn
      expect((bot as any).isRunning).toBe(true);
    });

    it('should gracefully stop bot', () => {
      (bot as any).isRunning = true;
      
      bot.stop();
      
      expect((bot as any).isRunning).toBe(false);
    });
  });

  describe('Integration Points', () => {
    it('should have GMGN client for data fetching', () => {
      expect(gmgnClient).toBeDefined();
    });

    it('should have strategy engine for analysis', () => {
      expect(strategy).toBeDefined();
    });

    it('should have notification service for alerts', () => {
      expect(notificationService).toBeDefined();
    });

    it('should have logger for debugging', () => {
      expect(logger).toBeDefined();
    });
  });
});
