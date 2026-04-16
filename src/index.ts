import { loadConfig } from './config';
import { createLogger } from './logger';
import { GMGNClient } from './gmgnClient';
import { StrategyEngine } from './strategy';
import { NotificationService } from './notifications';
import { TradingBot } from './bot';

async function main() {
  try {
    // Load configuration
    const config = loadConfig();
    const logger = createLogger(config.logLevel);

    logger.info('🚀 Initializing GMGN Trading Bot...');

    // Initialize services
    const gmgnClient = new GMGNClient(
      config.gmgnApiUrl,
      config.gmgnApiKey,
      logger,
    );
    
    const strategy = new StrategyEngine(config, logger);
    const notifications = new NotificationService(config, logger);

    // Create and start bot
    const bot = new TradingBot(config, logger, gmgnClient, strategy, notifications);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down...');
      bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down...');
      bot.stop();
      process.exit(0);
    });

    // Start the bot
    await bot.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
