import { describe, it, expect } from 'vitest';
import { createCodeQualityAnalyzer } from './code-quality-analyzer';

describe('code-quality-analyzer', () => {
  const { analyzeRepository, getGradeColor, getSeverityColor } = createCodeQualityAnalyzer();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  };

  describe('analyzeRepository', () => {
    it('should generate quality report', () => {
      const report = analyzeRepository(mockRepo);
      
      expect(report).toBeDefined();
      expect(report.repository).toEqual(mockRepo);
      expect(report.metrics).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.suggestions).toBeDefined();
      expect(report.grade).toBeDefined();
    });

    it('should calculate metrics in valid range', () => {
      const report = analyzeRepository(mockRepo);
      
      Object.values(report.metrics).forEach(metric => {
        expect(metric).toBeGreaterThanOrEqual(0);
        expect(metric).toBeLessThanOrEqual(100);
      });
    });

    it('should assign valid grade', () => {
      const report = analyzeRepository(mockRepo);
      
      expect(['A', 'B', 'C', 'D', 'F']).toContain(report.grade);
    });
  });

  describe('getGradeColor', () => {
    it('should return correct colors for grades', () => {
      expect(getGradeColor('A')).toBe('#10b981');
      expect(getGradeColor('F')).toBe('#ef4444');
    });
  });

  describe('getSeverityColor', () => {
    it('should return colors for severities', () => {
      expect(getSeverityColor('info')).toBe('#3b82f6');
      expect(getSeverityColor('warning')).toBe('#f59e0b');
      expect(getSeverityColor('error')).toBe('#ef4444');
    });
  });
});
