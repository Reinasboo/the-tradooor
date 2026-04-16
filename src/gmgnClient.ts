import axios, { AxiosInstance } from 'axios';
import { TokenData } from './types';
import { Logger } from './logger';

export class GMGNClient {
  private client: AxiosInstance;
  private logger: Logger;

  constructor(baseUrl: string, apiKey: string, logger: Logger) {
    this.logger = logger;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get trending tokens from GMGN
   */
  async getTrendingTokens(limit: number = 20): Promise<TokenData[]> {
    try {
      const response = await this.client.get('/api/v1/tokens/trending', {
        params: { limit },
      });
      this.logger.debug(`Fetched ${response.data.length} trending tokens`);
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching trending tokens:', error);
      throw error;
    }
  }

  /**
   * Get token data by mint address
   */
  async getTokenData(mint: string): Promise<TokenData | null> {
    try {
      const response = await this.client.get(`/api/v1/tokens/${mint}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.debug(`Token ${mint} not found`);
        return null;
      }
      this.logger.error(`Error fetching token data for ${mint}:`, error);
      throw error;
    }
  }

  /**
   * Search tokens by keyword
   */
  async searchTokens(query: string, limit: number = 10): Promise<TokenData[]> {
    try {
      const response = await this.client.get('/api/v1/tokens/search', {
        params: { q: query, limit },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error searching tokens for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get token holders information
   */
  async getTokenHolders(mint: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/tokens/${mint}/holders`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching holders for ${mint}:`, error);
      throw error;
    }
  }

  /**
   * Get OHLCV (candlestick) data for a token
   */
  async getOHLCV(
    mint: string,
    timeframe: string = '1h',
    limit: number = 100,
  ): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/tokens/${mint}/ohlcv`, {
        params: { timeframe, limit },
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error fetching OHLCV data for ${mint}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get token trades (transaction history)
   */
  async getTokenTrades(mint: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/tokens/${mint}/trades`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching trades for ${mint}:`, error);
      throw error;
    }
  }

  /**
   * Get new token launches
   */
  async getNewTokens(limit: number = 20): Promise<TokenData[]> {
    try {
      const response = await this.client.get('/api/v1/tokens/new', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching new tokens:', error);
      throw error;
    }
  }
}
