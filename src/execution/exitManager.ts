/**
 * Exit Manager
 * Handles stop losses, take profits, trailing stops, pyramid exits
 */

export interface ExitRule {
  type: 'stop-loss' | 'take-profit' | 'trailing-stop' | 'time-based';
  trigger: number; // Price or time
  executed: boolean;
  executionPrice?: number;
}

export interface PositionState {
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealizedPnL: number;
  unrealizedReturn: number;
  holdTime: number; // milliseconds
  highWaterMark: number; // highest price reached
}

export class ExitManager {
  /**
   * Calculate exit signal based on multiple criteria
   */
  calculateExitSignal(
    position: PositionState,
    rules: ExitRule[],
  ): {
    shouldExit: boolean;
    reason: string;
    exitPrice: number;
  } {
    let shouldExit = false;
    let reason = '';
    let exitPrice = position.currentPrice;

    // Check each exit rule
    for (const rule of rules) {
      if (rule.executed) continue;

      switch (rule.type) {
        case 'stop-loss':
          // Stop loss triggered
          if (position.currentPrice <= rule.trigger) {
            shouldExit = true;
            reason = `Stop loss hit at ${rule.trigger.toFixed(8)}`;
            exitPrice = rule.trigger;
          }
          break;

        case 'take-profit':
          // Take profit triggered
          if (position.currentPrice >= rule.trigger) {
            shouldExit = true;
            reason = `Take profit hit at ${rule.trigger.toFixed(8)}`;
            exitPrice = rule.trigger;
          }
          break;

        case 'trailing-stop': {
          // Trailing stop: exit if price drops X% from high
          const drawdownPercent =
            ((position.highWaterMark - position.currentPrice) / position.highWaterMark) * 100;
          if (drawdownPercent >= rule.trigger) {
            shouldExit = true;
            reason = `Trailing stop triggered: ${drawdownPercent.toFixed(2)}% below high`;
            exitPrice = position.currentPrice;
          }
          break;
        }

        case 'time-based':
          // Exit after hold time
          if (position.holdTime >= rule.trigger) {
            shouldExit = true;
            reason = `Time-based exit: held for ${(position.holdTime / 1000 / 60).toFixed(0)} minutes`;
            exitPrice = position.currentPrice;
          }
          break;
      }
    }

    return { shouldExit, reason, exitPrice };
  }

  /**
   * Generate optimal exit rules based on risk profile
   */
  generateExitRules(
    entryPrice: number,
    riskPercent: number = 2, // Risk 2% per trade
    rewardRatio: number = 3, // Risk:Reward 1:3
  ): ExitRule[] {
    const stopLossPercent = riskPercent;
    const takeProfitPercent = riskPercent * rewardRatio;

    const stopLossPrice = entryPrice * (1 - stopLossPercent / 100);
    const takeProfitPrice = entryPrice * (1 + takeProfitPercent / 100);

    return [
      {
        type: 'stop-loss',
        trigger: stopLossPrice,
        executed: false,
      },
      {
        type: 'take-profit',
        trigger: takeProfitPrice,
        executed: false,
      },
      {
        type: 'trailing-stop',
        trigger: 10, // Exit if drops 10% from high
        executed: false,
      },
    ];
  }

  /**
   * Pyramid exit: partial exit at multiple profit levels
   */
  calculatePyramidExits(
    entryPrice: number,
    quantity: number,
  ): Array<{
    level: number;
    profitPercent: number;
    exitQuantity: number;
    exitPrice: number;
  }> {
    const pyramidLevels = [
      { profitPercent: 20, quantityPercent: 0.25 }, // 25% at +20%
      { profitPercent: 50, quantityPercent: 0.33 }, // 33% at +50%
      { profitPercent: 100, quantityPercent: 0.42 }, // 42% at +100%
    ];

    return pyramidLevels.map((level, i) => ({
      level: i + 1,
      profitPercent: level.profitPercent,
      exitPrice: entryPrice * (1 + level.profitPercent / 100),
      exitQuantity: quantity * level.quantityPercent,
    }));
  }

  /**
   * Calculate mental stop level (psychological support)
   * E.g., round number, Fibonacci level
   */
  calculatePsychologicalStops(currentPrice: number): number[] {
    const stops: number[] = [];

    // Round numbers (0.5, 1.0, etc.)
    const magnitude = Math.pow(10, Math.floor(Math.log10(currentPrice)));
    stops.push(Math.floor(currentPrice / magnitude) * magnitude);

    // Fibonacci levels (38.2%, 50%, 61.8% retracements)
    // Simplified: just use round percentages
    stops.push(currentPrice * 0.5); // -50%
    stops.push(currentPrice * 0.75); // -25%

    return stops;
  }

  /**
   * Calculate break-even + profit move
   */
  calculateBreakEvenPlus(
    entryPrice: number,
    currentPrice: number,
    feesPercent: number = 0.5,
  ): {
    breakEvenPrice: number;
    profitMoveRequired: number;
  } {
    // Account for trading fees
    const breakEvenPrice = entryPrice * (1 + feesPercent / 100);
    const profitMoveRequired = ((breakEvenPrice - currentPrice) / currentPrice) * 100;

    return { breakEvenPrice, profitMoveRequired };
  }

  /**
   * Risk/Reward ratio check
   */
  validateRiskReward(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
    minRatio: number = 1.5, // Minimum 1:1.5 R:R
  ): {
    riskRewardRatio: number;
    acceptable: boolean;
  } {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const riskRewardRatio = reward / risk;

    return {
      riskRewardRatio,
      acceptable: riskRewardRatio >= minRatio,
    };
  }

  /**
   * Determine exit urgency based on time in trade
   */
  getExitUrgency(holdTimeMinutes: number): 'hold' | 'monitor' | 'exit' {
    if (holdTimeMinutes < 5) return 'hold';
    if (holdTimeMinutes < 30) return 'monitor'; // Watch closely
    return 'exit'; // Time decay, get out
  }

  /**
   * Recommend partial exit
   */
  recommendPartialExit(
    position: PositionState,
    targetProfit: number = 0.5, // 50% profit target
  ): {
    shouldPartialExit: boolean;
    quantity: number;
    keepQuantity: number;
  } {
    const profitPercent = position.unrealizedReturn * 100;

    if (profitPercent >= targetProfit) {
      const exitQuantity = position.quantity * 0.5; // Sell half
      return {
        shouldPartialExit: true,
        quantity: exitQuantity,
        keepQuantity: position.quantity - exitQuantity,
      };
    }

    return { shouldPartialExit: false, quantity: 0, keepQuantity: position.quantity };
  }
}
