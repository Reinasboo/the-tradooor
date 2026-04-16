import { BotConfig, TradeSignal } from './types';
import { Logger } from './logger';
import { GMGNClient } from './gmgnClient';
import { StrategyEngine } from './strategy';
import { NotificationService } from './notifications';

export class TradingBot {
  private config: BotConfig;
  private logger: Logger;
  private gmgnClient: GMGNClient;
  private strategy: StrategyEngine;
  private notificationService: NotificationService;
  private isRunning: boolean = false;

  constructor(
    config: BotConfig,
    logger: Logger,
    gmgnClient: GMGNClient,
    strategy: StrategyEngine,
    notificationService: NotificationService,
  ) {
    this.config = config;
    this.logger = logger;
    this.gmgnClient = gmgnClient;
    this.strategy = strategy;
    this.notificationService = notificationService;
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Bot is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('🤖 GMGN Trading Bot started');
    this.logger.info(`Configuration:
- Min Liquidity: ${this.config.minLiquiditySol} SOL
- Max Price Increase: ${this.config.maxPriceIncreasePct}%
- Min Holders: ${this.config.minHolderCount}
- Min Volume 24h: ${this.config.minVolume24h}
- Dry Run: ${this.config.enableDryRun}
- Auto Trading: ${this.config.enableAutoTrading}`);

    try {
      while (this.isRunning) {
        await this.tick();
        // Wait before next scan
        await this.sleep(5000); // 5 second interval
      }
    } catch (error) {
      this.logger.error('Bot encountered fatal error:', error);
      await this.notificationService.notifyError(
        error as Error,
        'Bot fatal error',
      );
      this.isRunning = false;
    }
  }

  /**
   * Stop the bot
   */
  stop(): void {
    this.logger.info('Stopping bot...');
    this.isRunning = false;
  }

  /**
   * Single bot tick
   */
  private async tick(): Promise<void> {
    try {
      // Fetch trending tokens
      const tokens = await this.gmgnClient.getTrendingTokens(50);
      this.logger.debug(`Fetched ${tokens.length} trending tokens`);

      // Analyze each token
      const signals: TradeSignal[] = [];
      for (const token of tokens) {
        const signal = this.strategy.analyzeToken(token);
        if (signal) {
          signals.push(signal);
        }
      }

      // Process signals
      for (const signal of signals) {
        this.logger.info(`📊 Signal detected: ${signal.action} ${signal.tokenData.symbol}`);
        
        // Send notification
        await this.notificationService.notifySignal(signal);

        // Execute trade if enabled (and not dry run)
        if (this.config.enableAutoTrading && !this.config.enableDryRun) {
          await this.executeSignal(signal);
        }
      }
    } catch (error) {
      this.logger.error('Error during bot tick:', error);
    }
  }

  /**
   * Execute a trade signal
   */
  private async executeSignal(signal: TradeSignal): Promise<void> {
    try {
      this.logger.info(`Executing ${signal.action} signal for ${signal.tokenData.symbol}`);
      
      // TODO: Implement actual trade execution via Solana
      // This is a placeholder for the actual trading logic
      
      const execution = {
        signalId: `${signal.mint}-${signal.timestamp}`,
        mint: signal.mint,
        action: signal.action,
        amount: this.config.tradingAmountSol,
        price: signal.tokenData.price,
        status: 'PENDING' as const,
        timestamp: Date.now(),
      };

      this.logger.info(`Trade scheduled: ${execution.action} ${execution.amount} SOL`);
      
      // TODO: Implement actual Solana transaction
      // For now, simulate execution
      const exec = execution as any;
      exec.status = 'SUCCESS';
      exec.txHash = 'simulated_tx_hash_' + Math.random().toString(36).substring(7);

      await this.notificationService.notifyExecution(execution);
    } catch (error) {
      this.logger.error('Trade execution failed:', error);
      await this.notificationService.notifyError(
        error as Error,
        `Trade execution for ${signal.tokenData.symbol}`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
