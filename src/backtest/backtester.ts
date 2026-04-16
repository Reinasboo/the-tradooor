/**
 * Backtesting Engine
 * Validates trading strategies on historical data
 */

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestTrade {
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  returnPercent: number;
  holdTime: number; // milliseconds
  confidence: number;
  tags: string[];
}

export interface BacktestResults {
  totalTrades: number;
  winners: number;
  losers: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number; // Average return per trade
  totalReturn: number; // Total P&L
  totalReturnPercent: number; // ROI %
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  drawdownDuration: number; // in candles
  consecutiveWins: number;
  consecutiveLosses: number;
  largestWin: number;
  largestLoss: number;
  startCapital: number;
  endCapital: number;
  equityCurve: number[];
  trades: BacktestTrade[];
  metadata: {
    startDate: Date;
    endDate: Date;
    dataPoints: number;
    trades_per_week?: number;
  };
}

export type StrategyFunction = (
  ohlcv: OHLCV[],
  currentIndex: number,
  portfolio: { cash: number; positions: any[] },
) => { signal: 'BUY' | 'SELL' | 'HOLD'; confidence: number } | null;

export class Backtester {
  /**
   * Run backtest on historical data
   */
  async backtest(
    ohlcvData: OHLCV[],
    strategyFn: StrategyFunction,
    initialCapital: number = 10000,
    positionSizeFn?: (capital: number, confidence: number) => number,
  ): Promise<BacktestResults> {
    const trades: BacktestTrade[] = [];
    let cash = initialCapital;
    const positions: Map<string, any> = new Map(); // tokenId -> position
    const equityCurve: number[] = [initialCapital];

    // Default position sizer
    const defaultSizer = (capital: number, confidence: number) => {
      return (capital * 0.02 * confidence) / ohlcvData[0].close; // 2% Kelly-adjusted
    };

    const sizer = positionSizeFn || defaultSizer;

    // Iterate through historical data
    for (let i = 20; i < ohlcvData.length; i++) {
      const current = ohlcvData[i];
      const portfolio = {
        cash,
        positions: Array.from(positions.values()),
      };

      // Generate signal
      const signal = strategyFn(ohlcvData.slice(Math.max(0, i - 100), i + 1), 100, portfolio);

      if (signal) {
        if (signal.signal === 'BUY' && cash > 0) {
          // Calculate position size
          const quantity = sizer(cash, signal.confidence);

          if (quantity > 0 && quantity * current.close <= cash) {
            const positionCost = quantity * current.close;
            const position = {
              entryTime: current.timestamp,
              entryPrice: current.close,
              quantity,
              confidence: signal.confidence,
              tags: [],
            };

            positions.set(`pos_${i}`, position);
            cash -= positionCost;
          }
        } else if (signal.signal === 'SELL') {
          // Close oldest position
          const firstPos = positions.values().next().value;
          if (firstPos) {
            const exitPrice = current.close;
            const pnl = (exitPrice - firstPos.entryPrice) * firstPos.quantity;
            const returnPercent = (exitPrice - firstPos.entryPrice) / firstPos.entryPrice;

            trades.push({
              entryTime: firstPos.entryTime,
              entryPrice: firstPos.entryPrice,
              exitTime: current.timestamp,
              exitPrice,
              quantity: firstPos.quantity,
              pnl,
              returnPercent,
              holdTime: current.timestamp - firstPos.entryTime,
              confidence: firstPos.confidence,
              tags: firstPos.tags,
            });

            cash += exitPrice * firstPos.quantity;
            positions.delete(`pos_${i - 10}`);
          }
        }
      }

      // Update equity
      let totalEquity = cash;
      for (const pos of positions.values()) {
        totalEquity += pos.quantity * current.close;
      }
      equityCurve.push(totalEquity);
    }

    // Close remaining positions at end
    const lastCandle = ohlcvData[ohlcvData.length - 1];
    for (const pos of positions.values()) {
      const exitPrice = lastCandle.close;
      const pnl = (exitPrice - pos.entryPrice) * pos.quantity;
      const returnPercent = (exitPrice - pos.entryPrice) / pos.entryPrice;

      trades.push({
        entryTime: pos.entryTime,
        entryPrice: pos.entryPrice,
        exitTime: lastCandle.timestamp,
        exitPrice,
        quantity: pos.quantity,
        pnl,
        returnPercent,
        holdTime: lastCandle.timestamp - pos.entryTime,
        confidence: pos.confidence,
        tags: pos.tags,
      });

      cash += exitPrice * pos.quantity;
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(
      trades,
      initialCapital,
      cash,
      equityCurve,
      ohlcvData,
    );

    return {
      ...metrics,
      trades,
      equityCurve,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(
    trades: BacktestTrade[],
    initialCapital: number,
    finalCapital: number,
    equityCurve: number[],
    ohlcvData: OHLCV[],
  ): Omit<BacktestResults, 'trades' | 'equityCurve'> {
    const winners = trades.filter(t => t.pnl > 0);
    const losers = trades.filter(t => t.pnl < 0);

    const totalReturn = finalCapital - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;

    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.returnPercent, 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? losers.reduce((sum, t) => sum + t.returnPercent, 0) / losers.length : 0;

    const winRate = trades.length > 0 ? winners.length / trades.length : 0;
    const profitFactor =
      Math.abs(avgLoss) > 0
        ? (avgWin * winners.length) / (Math.abs(avgLoss) * losers.length)
        : avgWin * winners.length > 0
          ? Infinity
          : 0;

    const expectancy = trades.length > 0 ? totalReturn / trades.length : 0;
    const sharpeRatio = this.calculateSharpeRatio(trades);
    const { maxDD, maxDDPercent, duration } = this.calculateMaxDrawdown(equityCurve);

    // Returns array for analysis
    // const returns = trades.map(t => t.returnPercent);
    let consecutiveWins = 0;
    let maxConsecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    for (const trade of trades) {
      if (trade.returnPercent > 0) {
        consecutiveWins++;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
        consecutiveLosses = 0;
      } else {
        consecutiveLosses++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
        consecutiveWins = 0;
      }
    }

    return {
      totalTrades: trades.length,
      winners: winners.length,
      losers: losers.length,
      winRate,
      averageWin: avgWin,
      averageLoss: avgLoss,
      profitFactor,
      expectancy,
      totalReturn,
      totalReturnPercent,
      sharpeRatio,
      maxDrawdown: maxDD,
      maxDrawdownPercent: maxDDPercent,
      drawdownDuration: duration,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      largestWin: winners.length > 0 ? Math.max(...winners.map(t => t.returnPercent)) : 0,
      largestLoss: losers.length > 0 ? Math.min(...losers.map(t => t.returnPercent)) : 0,
      startCapital: initialCapital,
      endCapital: finalCapital,
      metadata: {
        startDate: new Date(ohlcvData[0].timestamp),
        endDate: new Date(ohlcvData[ohlcvData.length - 1].timestamp),
        dataPoints: ohlcvData.length,
        trades_per_week: trades.length / ((ohlcvData[ohlcvData.length - 1].timestamp - ohlcvData[0].timestamp) / (7 * 24 * 60 * 60 * 1000)),
      },
    };
  }

  /**
   * Sharpe Ratio: Risk-adjusted returns
   */
  private calculateSharpeRatio(trades: BacktestTrade[], riskFreeRate: number = 0.02): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.returnPercent);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return (mean - riskFreeRate) / stdDev;
  }

  /**
   * Maximum Drawdown: Biggest peak-to-trough decline
   */
  private calculateMaxDrawdown(
    equityCurve: number[],
  ): { maxDD: number; maxDDPercent: number; duration: number } {
    if (equityCurve.length < 2) {
      return { maxDD: 0, maxDDPercent: 0, duration: 0 };
    }

    let maxDD = 0;
    let maxDDPercent = 0;
    let duration = 0;
    let peak = equityCurve[0];
    let peakIndex = 0;

    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
        peakIndex = i;
      }

      const drawdown = peak - equityCurve[i];
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDD) {
        maxDD = drawdown;
        maxDDPercent = drawdownPercent;
        duration = i - peakIndex;
      }
    }

    return { maxDD, maxDDPercent, duration };
  }

  /**
   * Format results for display
   */
  static formatResults(results: BacktestResults): string {
    return `
╔════════════════════════════════════════╗
║           BACKTEST RESULTS             ║
╚════════════════════════════════════════╝

📊 Overview:
├─ Period: ${results.metadata.startDate.toLocaleDateString()} to ${results.metadata.endDate.toLocaleDateString()}
├─ Total Trades: ${results.totalTrades}
├─ Winning Trades: ${results.winners} (${(results.winRate * 100).toFixed(1)}%)
└─ Losing Trades: ${results.losers}

💰 P&L:
├─ Starting Capital: $${results.startCapital.toFixed(2)}
├─ Ending Capital: $${results.endCapital.toFixed(2)}
├─ Total P&L: $${results.totalReturn.toFixed(2)}
└─ ROI: ${results.totalReturnPercent.toFixed(2)}%

📈 Performance Metrics:
├─ Average Win: ${(results.averageWin * 100).toFixed(2)}%
├─ Average Loss: ${(results.averageLoss * 100).toFixed(2)}%
├─ Profit Factor: ${results.profitFactor.toFixed(2)}x
├─ Expectancy: ${(results.expectancy * 100).toFixed(2)}% per trade
├─ Largest Win: ${(results.largestWin * 100).toFixed(2)}%
└─ Largest Loss: ${(results.largestLoss * 100).toFixed(2)}%

📊 Risk Metrics:
├─ Sharpe Ratio: ${results.sharpeRatio.toFixed(2)}
├─ Max Drawdown: ${results.maxDrawdownPercent.toFixed(2)}%
├─ Drawdown Duration: ${results.drawdownDuration} candles
├─ Consecutive Wins: ${results.consecutiveWins}
└─ Consecutive Losses: ${results.consecutiveLosses}

🎯 Trades per Week: ${results.metadata.trades_per_week?.toFixed(1) || 'N/A'}
    `;
  }
}
