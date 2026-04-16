/**
 * Sentiment Analyzer
 * Monitors Twitter, Discord, and on-chain signals for community sentiment
 */

export interface SentimentScore {
  source: 'twitter' | 'discord' | 'onchain' | 'combined';
  score: number; // -1 (very bearish) to +1 (very bullish)
  timestamp: number;
  confidence: number; // 0-1
  signals: string[];
}

export interface CommunityMetrics {
  twitterMentions24h: number;
  twitterSentimentScore: number;
  discordActivity24h: number;
  discordGrowth24h: number;
  redditMentions: number;
  whaleTransfers: number;
  liquidityAdds: number;
  burnEvents: number;
}

export class SentimentAnalyzer {
  /**
   * Analyze Twitter sentiment for a token
   */
  async analyzeTwitterSentiment(
    hashtags: string[],
    _tokenSymbol: string,
  ): Promise<SentimentScore> {
    // In production, use Twitter API + NLP model
    // Simulate sentiment analysis

    const signals: string[] = [];
    let scoreSum = 0;
    let count = 0;

    // Keywords associated with sentiment (reserved for NLP analysis)
    // In production: use sentiment analysis models to score text

    // Simulated: check mention volume
    if (hashtags.length > 100) {
      scoreSum += 0.3;
      signals.push(`High Twitter activity (${hashtags.length} mentions)`);
      count++;
    }

    // Influencer mentions
    // In production: check if major influencers tweeted
    scoreSum += 0.2; // Simplified
    signals.push('Moderate influencer engagement');
    count++;

    const score = count > 0 ? scoreSum / count : 0;

    return {
      source: 'twitter',
      score: Math.min(1, Math.max(-1, score * 2 - 1)), // Normalize to -1 to 1
      timestamp: Date.now(),
      confidence: 0.65,
      signals,
    };
  }

  /**
   * Analyze Discord community health
   */
  async analyzeDiscordSentiment(
    serverMetrics: {
      memberCount: number;
      memberGrowth24h: number;
      messageCount24h: number;
      engagement: number;
    },
  ): Promise<SentimentScore> {
    const signals: string[] = [];
    let score = 0;

    // Member growth
    if (serverMetrics.memberGrowth24h > 0.1) {
      score += 0.3;
      signals.push(`Strong growth: ${(serverMetrics.memberGrowth24h * 100).toFixed(1)}% new members`);
    } else if (serverMetrics.memberGrowth24h < -0.05) {
      score -= 0.2;
      signals.push('Declining membership');
    }

    // Message activity
    if (serverMetrics.messageCount24h > 1000) {
      score += 0.2;
      signals.push(`High activity: ${serverMetrics.messageCount24h} messages`);
    }

    // Engagement rate
    if (serverMetrics.engagement > 0.5) {
      score += 0.2;
      signals.push('High engagement');
    }

    return {
      source: 'discord',
      score: Math.min(1, Math.max(-1, score)),
      timestamp: Date.now(),
      confidence: 0.7,
      signals,
    };
  }

  /**
   * Analyze on-chain sentiment
   */
  async analyzeOnChainSentiment(metrics: CommunityMetrics): Promise<SentimentScore> {
    const signals: string[] = [];
    let score = 0;

    // Whale transfers (large transfers)
    if (metrics.whaleTransfers > 5) {
      score -= 0.2;
      signals.push(`${metrics.whaleTransfers} whale transfers (possible distribution)`);
    } else if (metrics.whaleTransfers > 0) {
      score += 0.1;
      signals.push('Whale accumulation');
    }

    // Liquidity adds
    if (metrics.liquidityAdds > 3) {
      score += 0.25;
      signals.push(`${metrics.liquidityAdds} liquidity add events`);
    }

    // Burns (deflationary)
    if (metrics.burnEvents > 0) {
      score += 0.15;
      signals.push(`${metrics.burnEvents} token burn events`);
    }

    return {
      source: 'onchain',
      score: Math.min(1, Math.max(-1, score)),
      timestamp: Date.now(),
      confidence: 0.75,
      signals,
    };
  }

  /**
   * Combine multiple sentiment sources into weighted score
   */
  combineSentiments(sentiments: SentimentScore[]): SentimentScore {
    // Weights: on-chain most reliable, Twitter least
    const weights = {
      onchain: 0.5,
      discord: 0.25,
      twitter: 0.15,
      combined: 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;
    const combinedSignals: string[] = [];

    for (const sentiment of sentiments) {
      const weight = weights[sentiment.source as keyof typeof weights] || 0.1;
      totalScore += sentiment.score * weight;
      totalWeight += weight;
      combinedSignals.push(...sentiment.signals);
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      source: 'combined',
      score: Math.min(1, Math.max(-1, finalScore)),
      timestamp: Date.now(),
      confidence: 0.8,
      signals: combinedSignals,
    };
  }

  /**
   * Generate sentiment summary for decision making
   */
  generateSentimentSummary(score: SentimentScore): {
    rating: 'very bullish' | 'bullish' | 'neutral' | 'bearish' | 'very bearish';
    recommendation: 'strong buy' | 'buy' | 'hold' | 'sell' | 'strong sell';
    reason: string;
  } {
    let rating: 'very bullish' | 'bullish' | 'neutral' | 'bearish' | 'very bearish';
    let recommendation: 'strong buy' | 'buy' | 'hold' | 'sell' | 'strong sell';

    if (score.score > 0.6) {
      rating = 'very bullish';
      recommendation = 'strong buy';
    } else if (score.score > 0.3) {
      rating = 'bullish';
      recommendation = 'buy';
    } else if (score.score > -0.3) {
      rating = 'neutral';
      recommendation = 'hold';
    } else if (score.score > -0.6) {
      rating = 'bearish';
      recommendation = 'sell';
    } else {
      rating = 'very bearish';
      recommendation = 'strong sell';
    }

    const confidence = (score.confidence * 100).toFixed(0);

    return {
      rating,
      recommendation,
      reason: `Sentiment ${score.source} analysis: ${score.signals.join(' | ')} (${confidence}% confidence)`,
    };
  }

  /**
   * Detect sentiment shifts (momentum changes)
   */
  detectSentimentShift(
    current: SentimentScore,
    previous: SentimentScore,
  ): {
    shifted: boolean;
    direction: 'stronger' | 'weaker' | 'reversed';
    magnitude: number;
  } {
    const change = current.score - previous.score;
    const magnitude = Math.abs(change);

    let direction: 'stronger' | 'weaker' | 'reversed' = 'weaker';

    if (change > 0.2) {
      direction = 'stronger';
    } else if (change < -0.2 && current.score * previous.score < 0) {
      direction = 'reversed';
    }

    return {
      shifted: magnitude > 0.1,
      direction,
      magnitude,
    };
  }
}
