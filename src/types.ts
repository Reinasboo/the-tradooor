// Configuration types and constants
export interface BotConfig {
  gmgnApiKey: string;
  gmgnApiUrl: string;
  solanaRpcUrl: string;
  solanaWalletPrivateKey: string;
  
  // Trading rules
  minLiquiditySol: number;
  maxPriceIncreasePct: number;
  minHolderCount: number;
  minVolume24h: number;
  
  // Features
  enableAutoTrading: boolean;
  enableDryRun: boolean;
  tradingAmountSol: number;
  
  // Notifications
  telegramBotToken?: string;
  telegramChatId?: string;
  discordWebhookUrl?: string;
  
  logLevel: string;
}

export interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  liquidity: number;
  volume24h: number;
  holders: number;
  priceChange24h: number;
  marketCap: number;
  createdAt: number;
}

export interface TradeSignal {
  mint: string;
  action: 'BUY' | 'SELL';
  confidence: number;
  reason: string;
  tokenData: TokenData;
  timestamp: number;
}

export interface TradeExecution {
  signalId: string;
  mint: string;
  action: 'BUY' | 'SELL';
  amount: number;
  price: number;
  txHash?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error?: string;
  timestamp: number;
}
