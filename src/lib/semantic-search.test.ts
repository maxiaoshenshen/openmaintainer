import { describe, it, expect } from 'vitest';
import { 
  semanticSearch, 
  getAutocompleteSuggestions,
  generateEmbeddings,
  cosineSimilarity 
} from './semantic-search';

describe('semantic-search', () => {
  describe('generateEmbeddings', () => {
    it('should generate embeddings array', () => {
      const embeddings = generateEmbeddings('hello world test');
      expect(embeddings).toHaveLength(128);
      expect(embeddings.every(v => typeof v === 'number')).toBe(true);
    });

    it('should generate consistent embeddings for same text', () => {
      const e1 = generateEmbeddings('hello world');
      const e2 = generateEmbeddings('hello world');
      expect(e1).toEqual(e2);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vector = [1, 2, 3];
      expect(cosineSimilarity(vector, vector)).toBe(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      expect(cosineSimilarity(a, b)).toBe(0);
    });
  });

  describe('semanticSearch', () => {
    const items = [
      { id: 1, title: 'Fix login bug', body: 'Users cannot login with SSO' },
      { id: 2, title: 'Add dark mode', body: 'Implement dark theme for UI' },
      { id: 3, title: 'Performance optimization', body: 'Speed up API responses' },
    ];

    it('should find relevant results', () => {
      const results = semanticSearch('dark theme mode', items);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results sorted by score', () => {
      const results = semanticSearch('dark', items);
      expect(results.length).toBeGreaterThan(0);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should include highlights', () => {
      const results = semanticSearch('dark', items);
      expect(results[0].highlights).toBeDefined();
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('should return matching suggestions', () => {
      const items = [
        { title: 'React hooks guide', id: '1' },
        { title: 'React lifecycle', id: '2' },
        { title: 'Vue tutorial', id: '3' },
      ];
      const suggestions = getAutocompleteSuggestions('react', items);
      expect(suggestions).toHaveLength(2);
    });

    it('should limit results', () => {
      const items = [
        { title: 'aaa', id: '1' },
        { title: 'aab', id: '2' },
        { title: 'aac', id: '3' },
      ];
      const suggestions = getAutocompleteSuggestions('aa', items, 2);
      expect(suggestions).toHaveLength(2);
    });
  });
});
