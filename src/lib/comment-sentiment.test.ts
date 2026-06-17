import { describe, it, expect } from 'vitest';
import { CommentSentimentAnalyzer, commentSentimentAnalyzer } from './comment-sentiment';

describe('CommentSentimentAnalyzer', () => {
  const analyzer = new CommentSentimentAnalyzer();

  describe('analyzeComment', () => {
    it('should analyze positive comment', async () => {
      const result = await analyzer.analyzeComment('Thanks for this amazing contribution! Great work!');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('emotions');
      expect(result).toHaveProperty('keyPhrases');
      expect(result).toHaveProperty('topics');
    });

    it('should analyze negative comment', async () => {
      const result = await analyzer.analyzeComment('This is broken and the docs are terrible.');
      expect(result.sentiment).toMatch(/positive|neutral|negative|mixed/);
    });

    it('should detect emotions', async () => {
      const result = await analyzer.analyzeComment('Could you please add more tests?');
      expect(Array.isArray(result.emotions)).toBe(true);
    });
  });

  describe('analyzeDiscussion', () => {
    it('should analyze discussion thread', async () => {
      const comments = [
        { id: '1', text: 'Great PR!', author: 'user1' },
        { id: '2', text: 'Thanks for fixing this bug.', author: 'user2' },
        { id: '3', text: 'Could you add tests?', author: 'user1' }
      ];
      const result = await analyzer.analyzeDiscussion(comments);
      
      expect(result).toHaveProperty('threadId');
      expect(result).toHaveProperty('overallSentiment');
      expect(result).toHaveProperty('sentimentBreakdown');
      expect(result).toHaveProperty('commentCount', 3);
      expect(result).toHaveProperty('participants', 2);
      expect(result).toHaveProperty('healthScore');
      expect(result).toHaveProperty('summary');
    });
  });

  describe('trackTrends', () => {
    it('should track sentiment trends over time', async () => {
      const trends = await analyzer.trackTrends('test/repo', 7);
      
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(8);
      trends.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('averageSentiment');
        expect(trend).toHaveProperty('positiveRatio');
        expect(trend).toHaveProperty('negativeRatio');
      });
    });
  });

  describe('analyzeMaintainerTone', () => {
    it('should analyze maintainer tone', async () => {
      const tone = await analyzer.analyzeMaintainerTone('maintainer');
      
      expect(tone).toHaveProperty('maintainer', 'maintainer');
      expect(tone).toHaveProperty('averageSentiment');
      expect(tone).toHaveProperty('responseTime');
      expect(tone).toHaveProperty('helpfulnessScore');
      expect(tone).toHaveProperty('toneProfile');
    });
  });

  describe('detectToxicComments', () => {
    it('should detect potentially toxic comments', async () => {
      const comments = [
        { id: '1', text: 'This is a great improvement!' },
        { id: '2', text: 'Why is this so broken?!' }
      ];
      const warnings = await analyzer.detectToxicComments(comments);
      
      expect(Array.isArray(warnings)).toBe(true);
    });
  });
});
