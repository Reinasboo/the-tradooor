import dotenv from 'dotenv';
import { BotConfig } from './types';

dotenv.config();

export function loadConfig(): BotConfig {
  const requiredEnvVars = [
    'GMGN_API_KEY',
    'GMGN_API_BASE_URL',
    'SOLANA_RPC_URL',
    'SOLANA_WALLET_PRIVATE_KEY',
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    gmgnApiKey: process.env.GMGN_API_KEY!,
    gmgnApiUrl: process.env.GMGN_API_BASE_URL!,
    solanaRpcUrl: process.env.SOLANA_RPC_URL!,
    solanaWalletPrivateKey: process.env.SOLANA_WALLET_PRIVATE_KEY!,
    
    minLiquiditySol: parseFloat(process.env.MIN_LIQUIDITY_SOL || '10'),
    maxPriceIncreasePct: parseFloat(process.env.MAX_PRICE_INCREASE_PCT || '500'),
    minHolderCount: parseInt(process.env.MIN_HOLDER_COUNT || '50'),
    minVolume24h: parseFloat(process.env.MIN_VOLUME_24H || '1000'),
    
    enableAutoTrading: process.env.ENABLE_AUTO_TRADING === 'true',
    enableDryRun: process.env.ENABLE_DRY_RUN !== 'false',
    tradingAmountSol: parseFloat(process.env.TRADING_AMOUNT_SOL || '0.1'),
    
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
