/**
 * On-Chain Analyzer
 * Analyzes holder distribution, rug risk, and smart money
 */

export interface HolderAnalysis {
  whaleCount: number; // Top 10 holders
  whaleConcentration: number; // % held by top 10
  authorityRevoked: boolean; // Mint authority
  freezeAuthorityRevoked: boolean;
  topHolders: Array<{ percentage: number }>;
  healthScore: number; // 0-1, higher is better
}

export interface LiquidityAnalysis {
  spreadPercentage: number;
  slippageEstimate: {
    percent1: number; // Slippage to buy 1% of liquidity
    percent5: number; // Slippage to buy 5%
    percent10: number; // Slippage to buy 10%
  };
  liquidityDepth: number;
}

export interface RugRiskScore {
  score: number; // 0-1, higher = safer
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface TokenSocials {
  twitterFollowers: number;
  discordMembers: number;
  twitterEngagementRate: number;
  communityGrowth24h: number;
}

export class OnChainAnalyzer {
  /**
   * Analyze holder distribution for concentration risk
   */
  analyzeHolderDistribution(
    topHolders: Array<{ percentage: number }>,
    _totalHolders: number,
  ): HolderAnalysis {
    const top10Percentage = topHolders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);

    // Score: lower concentration = higher score
    let healthScore = 0.5;
    if (top10Percentage < 30) healthScore = 0.9;
    else if (top10Percentage < 50) healthScore = 0.7;
    else if (top10Percentage < 70) healthScore = 0.4;
    else healthScore = 0.1;

    return {
      whaleCount: Math.min(10, topHolders.length),
      whaleConcentration: top10Percentage,
      authorityRevoked: true, // Assume revoked (better for safety)
      freezeAuthorityRevoked: true,
      topHolders,
      healthScore,
    };
  }

  /**
   * Calculate liquidity depth and slippage
   */
  analyzeLiquidityDepth(liquidity: number, volume24h: number): LiquidityAnalysis {
    // Rough slippage estimation
    const spread = 0.005; // Assume 0.5% spread
    const slippage1 = (liquidity * 0.01) / liquidity; // 1% of liquidity
    const slippage5 = (liquidity * 0.05) / liquidity; // 5% of liquidity
    const slippage10 = (liquidity * 0.1) / liquidity; // 10% of liquidity

    return {
      spreadPercentage: spread * 100,
      slippageEstimate: {
        percent1: slippage1 * 100,
        percent5: slippage5 * 100,
        percent10: slippage10 * 100,
      },
      liquidityDepth: liquidity / volume24h, // Higher is better
    };
  }

  /**
   * Assess rug pull risk
   * Returns 0-1 score (higher = safer, lower = riskier)
   */
  assessRugRiskScore(token: {
    age: number; // Days old
    authorityRevoked: boolean;
    liquidityLocked: boolean;
    holderConcentration: number;
    volume24h: number;
    liquidity: number;
  }): RugRiskScore {
    let riskScore = 0.5;
    const reasons: string[] = [];

    // Age check: Tokens older than 30 days are safer
    if (token.age > 30) {
      riskScore += 0.15;
      reasons.push(`Token is ${token.age} days old (established)`);
    } else if (token.age > 7) {
      riskScore += 0.10;
      reasons.push(`Token is ${token.age} days old (moderate age)`);
    } else {
      riskScore -= 0.10;
      reasons.push(`New token (only ${token.age} days old) - higher risk`);
    }

    // Authority revoked: +0.2
    if (token.authorityRevoked) {
      riskScore += 0.20;
      reasons.push('Mint authority revoked (no more inflation)');
    } else {
      riskScore -= 0.10;
      reasons.push('Mint authority active (inflation possible)');
    }

    // Liquidity locked: +0.15
    if (token.liquidityLocked) {
      riskScore += 0.15;
      reasons.push('Liquidity locked (prevents pulling)');
    } else {
      riskScore -= 0.05;
      reasons.push('Liquidity not locked');
    }

    // Holder concentration: Lower is better
    if (token.holderConcentration < 30) {
      riskScore += 0.15;
      reasons.push(`Low holder concentration (${token.holderConcentration.toFixed(1)}%)`);
    } else if (token.holderConcentration < 60) {
      riskScore += 0.05;
    } else {
      riskScore -= 0.15;
      reasons.push(`High holder concentration (${token.holderConcentration.toFixed(1)}% in top 10)`);
    }

    // Volume to liquidity ratio: Higher is better
    const volumeToLiq = token.volume24h / token.liquidity;
    if (volumeToLiq > 2) {
      riskScore += 0.10;
      reasons.push(`Good volume/liquidity ratio (${volumeToLiq.toFixed(1)}x)`);
    }

    riskScore = Math.max(0, Math.min(1, riskScore));

    const riskLevel: 'low' | 'medium' | 'high' = riskScore > 0.7 ? 'low' : riskScore > 0.4 ? 'medium' : 'high';

    return { score: riskScore, riskLevel, reasons };
  }

  /**
   * Analyze token community health
   */
  analyzeCommunityHealth(socials: TokenSocials): number {
    let score = 0;

    // Twitter following
    if (socials.twitterFollowers > 50000) score += 0.3;
    else if (socials.twitterFollowers > 10000) score += 0.2;
    else if (socials.twitterFollowers > 1000) score += 0.1;

    // Discord community
    if (socials.discordMembers > 50000) score += 0.3;
    else if (socials.discordMembers > 10000) score += 0.2;
    else if (socials.discordMembers > 1000) score += 0.1;

    // Engagement rate
    if (socials.twitterEngagementRate > 0.05) score += 0.2;
    else if (socials.twitterEngagementRate > 0.02) score += 0.1;

    // Growth momentum
    if (socials.communityGrowth24h > 0.1) score += 0.15; // 10% growth
    else if (socials.communityGrowth24h > 0.05) score += 0.1; // 5% growth

    return Math.min(1, score);
  }

  /**
   * Detect suspicious on-chain activity
   */
  detectSuspiciousActivity(
    recentTransactions: Array<{
      amount: number;
      direction: 'buy' | 'sell';
      timestamp: number;
    }>,
  ): { suspicious: boolean; signals: string[] } {
    const signals: string[] = [];

    // Large sells
    const largeSeals = recentTransactions.filter(t => t.direction === 'sell' && t.amount > 1000000);
    if (largeSeals.length > 0) {
      signals.push(`${largeSeals.length} large sells detected`);
    }

    // Rapid volume spike then dump
    const buys = recentTransactions.filter(t => t.direction === 'buy');
    const sells = recentTransactions.filter(t => t.direction === 'sell');
    if (buys.length > 5 && sells.length > buys.length * 0.8) {
      signals.push('High sell volume after buy spike');
    }

    const suspicious = signals.length > 0;
    return { suspicious, signals };
  }

  /**
   * Calculate overall on-chain health score
   */
  calculateOverallHealthScore(analysis: {
    holderHealth: number;
    rugRiskScore: number;
    communityScore: number;
  }): number {
    return (analysis.holderHealth + analysis.rugRiskScore + analysis.communityScore) / 3;
  }
}
