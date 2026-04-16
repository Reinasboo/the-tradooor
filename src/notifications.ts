import axios from 'axios';
import { TradeSignal, TradeExecution, BotConfig } from './types';
import { Logger } from './logger';

export class NotificationService {
  private config: BotConfig;
  private logger: Logger;

  constructor(config: BotConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Send trade signal notification
   */
  async notifySignal(signal: TradeSignal): Promise<void> {
    const message = this.formatSignalMessage(signal);
    
    const promises = [
      this.config.telegramBotToken ? this.sendTelegram(message) : Promise.resolve(),
      this.config.discordWebhookUrl ? this.sendDiscord(message, signal) : Promise.resolve(),
    ];

    await Promise.allSettled(promises);
  }

  /**
   * Send trade execution notification
   */
  async notifyExecution(execution: TradeExecution): Promise<void> {
    const message = this.formatExecutionMessage(execution);
    
    const promises = [
      this.config.telegramBotToken ? this.sendTelegram(message) : Promise.resolve(),
      this.config.discordWebhookUrl ? this.sendDiscord(message, execution) : Promise.resolve(),
    ];

    await Promise.allSettled(promises);
  }

  /**
   * Send error notification
   */
  async notifyError(error: Error, context?: string): Promise<void> {
    const message = `❌ **Error** ${context ? `(${context})` : ''}\n\`\`\`\n${error.message}\n\`\`\``;
    
    const promises = [
      this.config.telegramBotToken ? this.sendTelegram(message) : Promise.resolve(),
      this.config.discordWebhookUrl ? this.sendDiscord(message) : Promise.resolve(),
    ];

    await Promise.allSettled(promises);
  }

  private formatSignalMessage(signal: TradeSignal): string {
    const emoji = signal.action === 'BUY' ? '🟢' : '🔴';
    return `${emoji} **${signal.action}** Signal
Token: **${signal.tokenData.symbol}** (${signal.tokenData.name})
Mint: \`${signal.tokenData.mint}\`
Price: $${signal.tokenData.price}
24h Change: ${signal.tokenData.priceChange24h > 0 ? '+' : ''}${signal.tokenData.priceChange24h.toFixed(2)}%
Liquidity: $${signal.tokenData.liquidity.toFixed(2)}
Volume 24h: $${signal.tokenData.volume24h.toFixed(2)}
Holders: ${signal.tokenData.holders}
Confidence: ${(signal.confidence * 100).toFixed(0)}%
Reason: ${signal.reason}`;
  }

  private formatExecutionMessage(execution: TradeExecution): string {
    const emoji = execution.status === 'SUCCESS' ? '✅' : execution.status === 'FAILED' ? '❌' : '⏳';
    return `${emoji} **${execution.action}** Execution
Status: **${execution.status}**
Amount: ${execution.amount} SOL @ $${execution.price}
${execution.txHash ? `TX: \`${execution.txHash}\`` : ''}
${execution.error ? `Error: ${execution.error}` : ''}`;
  }

  private async sendTelegram(message: string): Promise<void> {
    if (!this.config.telegramBotToken || !this.config.telegramChatId) {
      return;
    }

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`,
        {
          chat_id: this.config.telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        },
      );
      this.logger.debug('Telegram notification sent');
    } catch (error) {
      this.logger.error('Failed to send Telegram notification:', error);
    }
  }

  private async sendDiscord(message: string, data?: any): Promise<void> {
    if (!this.config.discordWebhookUrl) {
      return;
    }

    try {
      const embed: any = {
        description: message,
        color: 0x1f1f1f,
        timestamp: new Date().toISOString(),
      };

      if (data?.tokenData) {
        embed.title = `${data.action || 'Signal'}: ${data.tokenData.symbol}`;
        embed.fields = [
          {
            name: 'Price',
            value: `$${data.tokenData.price}`,
            inline: true,
          },
          {
            name: '24h Change',
            value: `${data.tokenData.priceChange24h > 0 ? '+' : ''}${data.tokenData.priceChange24h.toFixed(2)}%`,
            inline: true,
          },
          {
            name: 'Liquidity',
            value: `$${data.tokenData.liquidity.toFixed(2)}`,
            inline: true,
          },
        ];
      }

      await axios.post(this.config.discordWebhookUrl, { embeds: [embed] });
      this.logger.debug('Discord notification sent');
    } catch (error) {
      this.logger.error('Failed to send Discord notification:', error);
    }
  }
}
