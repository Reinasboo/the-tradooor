/**
 * Machine Learning Predictor
 * Uses pattern recognition to predict winning tokens
 */

export interface TrainingExample {
  features: {
    priceChange24h: number;
    volumeRatio: number;
    holdersGrowth: number;
    liquidityRatio: number;
    rsi: number;
    macd: number;
    bbPosition: number;
    trendStrength: number;
  };
  label: 'winner' | 'loser'; // 2x+ vs losses
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export class MLPredictor {
  private trained: boolean = false;
  private featureImportance: Map<string, number> = new Map();

  async trainModel(examples: TrainingExample[]): Promise<void> {
    if (examples.length < 100) {
      throw new Error('Need at least 100 training examples');
    }

    // Simplified training: Feature importance based on win/loss correlation
    const winnerFeatures = examples.filter(e => e.label === 'winner').map(e => e.features);
    const loserFeatures = examples.filter(e => e.label === 'loser').map(e => e.features);

    const featureNames = Object.keys(examples[0].features);

    for (const feature of featureNames) {
      const winnerMean =
        winnerFeatures.reduce((sum, f) => sum + f[feature as keyof typeof f], 0) /
        winnerFeatures.length;
      const loserMean =
        loserFeatures.reduce((sum, f) => sum + f[feature as keyof typeof f], 0) /
        loserFeatures.length;

      // Feature importance: difference between winner and loser means
      const importance = Math.abs(winnerMean - loserMean);
      this.featureImportance.set(feature, importance);
    }

    this.trained = true;
  }

  /**
   * Predict probability of token becoming a winner (2x+)
   */
  async predictWinProbability(
    features: TrainingExample['features'],
  ): Promise<number> {
    if (!this.trained) {
      return 0.5; // Default neutral if not trained
    }

    // Simplified prediction: Weighted score based on feature importance
    let score = 0;

    // High RSI in sweet spot (30-50)
    if (features.rsi >= 30 && features.rsi <= 50) {
      score += (this.featureImportance.get('rsi') || 0.1) * 0.5;
    }

    // Bullish MACD
    if (features.macd > 0) {
      score += (this.featureImportance.get('macd') || 0.1) * 0.5;
    }

    // Price near lower Bollinger Band
    if (features.bbPosition < 0.3) {
      score += (this.featureImportance.get('bbPosition') || 0.1) * 0.5;
    }

    // Uptrend
    if (features.trendStrength > 0) {
      score += (this.featureImportance.get('trendStrength') || 0.1) * 0.5;
    }

    // Good liquidity
    if (features.liquidityRatio > 0.1) {
      score += (this.featureImportance.get('liquidityRatio') || 0.1) * 0.5;
    }

    // High volume ratio
    if (features.volumeRatio > 1) {
      score += (this.featureImportance.get('volumeRatio') || 0.1) * 0.3;
    }

    // Normalize to 0-1
    return Math.min(1, Math.max(0, score / 5));
  }

  /**
   * Get feature importance ranking
   */
  getFeatureImportance(): Array<[string, number]> {
    return Array.from(this.featureImportance.entries()).sort((a, b) => b[1] - a[1]);
  }

  /**
   * Evaluate model on test set
   */
  async evaluateModel(testExamples: TrainingExample[]): Promise<ModelMetrics> {
    const predictions = await Promise.all(
      testExamples.map(e => this.predictWinProbability(e.features)),
    );

    const trueLabels = testExamples.map(e => e.label === 'winner' ? 1 : 0);
    const predictedLabels = predictions.map(p => (p > 0.5 ? 1 : 0));

    // Calculate metrics
    let tp = 0,
      tn = 0,
      fp = 0,
      fn = 0;
    for (let i = 0; i < trueLabels.length; i++) {
      if (trueLabels[i] === 1 && predictedLabels[i] === 1) tp++;
      else if (trueLabels[i] === 0 && predictedLabels[i] === 0) tn++;
      else if (trueLabels[i] === 0 && predictedLabels[i] === 1) fp++;
      else if (trueLabels[i] === 1 && predictedLabels[i] === 0) fn++;
    }

    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    const f1Score = (2 * precision * recall) / (precision + recall);

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Feature importance for interpretability
   */
  explainPrediction(features: TrainingExample['features']): string[] {
    const explanations: string[] = [];

    if (features.rsi >= 30 && features.rsi <= 50) {
      explanations.push(`RSI ${features.rsi.toFixed(1)} suggests oversold`);
    }

    if (features.macd > 0) {
      explanations.push('MACD shows bullish momentum');
    }

    if (features.bbPosition < 0.3) {
      explanations.push('Price at lower Bollinger Band (buy signal)');
    }

    if (features.liquidityRatio > 0.1) {
      explanations.push(`Good liquidity (${(features.liquidityRatio * 100).toFixed(1)}%)`);
    }

    if (features.volumeRatio > 2) {
      explanations.push(`High trading activity (${features.volumeRatio.toFixed(1)}x volume)`);
    }

    return explanations;
  }

  isModelTrained(): boolean {
    return this.trained;
  }
}
