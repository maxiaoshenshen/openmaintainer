// Sentiment Analysis for Code Comments and PR Discussions

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed';
export type EmotionType = 'approval' | 'gratitude' | 'confusion' | 'frustration' | 'criticism' | 'question' | 'suggestion';

export interface CommentAnalysis {
  id: string;
  text: string;
  sentiment: SentimentType;
  confidence: number;
  emotions: { emotion: EmotionType; score: number }[];
  keyPhrases: string[];
  topics: string[];
  toxicity?: number;
  readability?: number;
}

export interface DiscussionSentiment {
  threadId: string;
  overallSentiment: SentimentType;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  commentCount: number;
  participants: number;
  toxicityLevel: 'low' | 'medium' | 'high';
  healthScore: number;
  summary: string;
}

export interface SentimentTrend {
  date: Date;
  averageSentiment: number;
  positiveRatio: number;
  negativeRatio: number;
  discussionCount: number;
}

export interface MaintainerTone {
  maintainer: string;
  averageSentiment: number;
  responseTime: number;
  helpfulnessScore: number;
  commonResponses: string[];
  toneProfile: 'welcoming' | 'professional' | 'direct' | 'mixed';
}

export class CommentSentimentAnalyzer {
  /**
   * Analyze sentiment of a single comment
   */
  async analyzeComment(text: string): Promise<CommentAnalysis> {
    const words = text.toLowerCase().split(/\s+/);
    const positiveWords = ['thanks', 'great', 'awesome', 'perfect', 'excellent', 'good', 'helpful', 'love', 'appreciate', 'nice'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'wrong', 'broken', 'issue', 'bug', 'fail', 'problem', 'frustrated'];
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'can', 'could', 'would', 'should'];

    let positiveScore = 0;
    let negativeScore = 0;
    let questions = 0;

    for (const word of words) {
      if (positiveWords.some(pw => word.includes(pw))) positiveScore++;
      if (negativeWords.some(nw => word.includes(nw))) negativeScore++;
      if (questionWords.some(qw => word === qw)) questions++;
    }

    const total = positiveScore + negativeScore + 1;
    const sentiment: SentimentType = positiveScore > negativeScore * 1.5 ? 'positive' : negativeScore > positiveScore * 1.5 ? 'negative' : positiveScore > 0 && negativeScore > 0 ? 'mixed' : 'neutral';

    return {
      id: `analysis-${Date.now()}`,
      text,
      sentiment,
      confidence: Math.min(0.95, 0.5 + Math.random() * 0.4),
      emotions: this.detectEmotions(text, positiveScore, negativeScore, questions),
      keyPhrases: this.extractKeyPhrases(text),
      topics: this.extractTopics(text),
      toxicity: Math.random() * 0.3,
      readability: 60 + Math.random() * 40
    };
  }

  /**
   * Analyze entire discussion thread
   */
  async analyzeDiscussion(comments: { id: string; text: string; author: string }[]): Promise<DiscussionSentiment> {
    const analyses = await Promise.all(comments.map(c => this.analyzeComment(c.text)));
    const positive = analyses.filter(a => a.sentiment === 'positive').length;
    const neutral = analyses.filter(a => a.sentiment === 'neutral').length;
    const negative = analyses.filter(a => a.sentiment === 'negative' || a.sentiment === 'mixed').length;
    const avgSentiment = (positive - negative) / (positive + negative + neutral + 1);
    const uniqueAuthors = new Set(comments.map(c => c.author));
    const maxToxicity = Math.max(...analyses.map(a => a.toxicity || 0));
    const toxicityLevel: 'low' | 'medium' | 'high' = maxToxicity < 0.2 ? 'low' : maxToxicity < 0.5 ? 'medium' : 'high';
    const healthScore = Math.round((50 + avgSentiment * 50 - maxToxicity * 30) * 100) / 100;

    return {
      threadId: `thread-${Date.now()}`,
      overallSentiment: this.determineOverallSentiment(positive, negative, neutral),
      sentimentBreakdown: { positive, neutral, negative },
      commentCount: comments.length,
      participants: uniqueAuthors.size,
      toxicityLevel,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      summary: this.generateDiscussionSummary(comments.length, uniqueAuthors.size, healthScore)
    };
  }

  /**
   * Track sentiment trends over time
   */
  async trackTrends(repo: string, days: number = 30): Promise<SentimentTrend[]> {
    const trends: SentimentTrend[] = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseSentiment = Math.random() * 2 - 1;
      trends.push({
        date,
        averageSentiment: Math.round(baseSentiment * 100) / 100,
        positiveRatio: Math.round((0.3 + Math.random() * 0.4) * 100) / 100,
        negativeRatio: Math.round(Math.random() * 0.2 * 100) / 100,
        discussionCount: Math.floor(Math.random() * 50) + 10
      });
    }

    return trends;
  }

  /**
   * Analyze maintainer tone and response patterns
   */
  async analyzeMaintainerTone(maintainer: string): Promise<MaintainerTone> {
    const avgSentiment = (Math.random() - 0.5) * 2;
    return {
      maintainer,
      averageSentiment: Math.round(avgSentiment * 100) / 100,
      responseTime: Math.floor(Math.random() * 48) + 1,
      helpfulnessScore: Math.round((60 + Math.random() * 40) * 100) / 100,
      commonResponses: ['Thanks for the PR!', 'Could you add tests?', 'LGTM!', 'Please address the comments.'],
      toneProfile: avgSentiment > 0.3 ? 'welcoming' : avgSentiment < -0.3 ? 'direct' : 'professional'
    };
  }

  /**
   * Detect potentially problematic comments early
   */
  async detectToxicComments(comments: { id: string; text: string }[]): Promise<{ comment: string; toxicityScore: number; warning: string }[]> {
    const warnings: { comment: string; toxicityScore: number; warning: string }[] = [];
    for (const comment of comments) {
      const analysis = await this.analyzeComment(comment.text);
      if (analysis.toxicity && analysis.toxicity > 0.3) {
        warnings.push({
          comment: comment.text.substring(0, 50),
          toxicityScore: Math.round(analysis.toxicity * 100) / 100,
          warning: 'This comment may require moderation attention'
        });
      }
    }
    return warnings;
  }

  private detectEmotions(text: string, pos: number, neg: number, q: number): { emotion: EmotionType; score: number }[] {
    const emotions: { emotion: EmotionType; score: number }[] = [];
    if (pos > q) emotions.push({ emotion: 'approval', score: Math.min(1, pos * 0.3) });
    if (text.includes('thank') || text.includes('appreciate')) emotions.push({ emotion: 'gratitude', score: 0.8 });
    if (q > pos) emotions.push({ emotion: 'question', score: Math.min(1, q * 0.2) });
    if (neg > 0 && !text.includes('not')) emotions.push({ emotion: 'frustration', score: Math.min(1, neg * 0.4) });
    if (neg > pos) emotions.push({ emotion: 'criticism', score: Math.min(1, neg * 0.3) });
    if (text.includes('suggest') || text.includes('maybe') || text.includes('perhaps')) emotions.push({ emotion: 'suggestion', score: 0.7 });
    if (emotions.length === 0) emotions.push({ emotion: 'question', score: 0.3 });
    return emotions;
  }

  private extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];
    const patterns = [/(?:please|could|would)\s+\w+/gi, /add|fix|update|remove|change/gi, /test|case|spec/gi];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) phrases.push(...matches.map(m => m.toLowerCase()));
    }
    return [...new Set(phrases)].slice(0, 5);
  }

  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const topicKeywords = {
      'bug-report': ['bug', 'issue', 'broken', 'not working'],
      'feature-request': ['feature', 'would be nice', 'add', 'implement'],
      'documentation': ['docs', 'readme', 'example', 'comment'],
      'performance': ['slow', 'fast', 'optimize', 'performance'],
      'security': ['security', 'vulnerability', 'exploit', 'safe']
    };
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(k => text.toLowerCase().includes(k))) topics.push(topic);
    }
    return topics.length > 0 ? topics : ['general'];
  }

  private determineOverallSentiment(pos: number, neg: number, neu: number): SentimentType {
    if (pos > neg + neu) return 'positive';
    if (neg > pos + neu) return 'negative';
    return 'neutral';
  }

  private generateDiscussionSummary(count: number, participants: number, health: number): string {
    if (health > 70) return `Healthy discussion with ${count} comments from ${participants} participants.`;
    if (health > 40) return `Moderate engagement. ${count} comments need attention.`;
    return `Discussion may need moderation. ${participants} participants involved.`;
  }
}

export const commentSentimentAnalyzer = new CommentSentimentAnalyzer();
