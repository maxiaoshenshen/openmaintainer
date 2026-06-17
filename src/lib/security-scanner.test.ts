import { describe, it, expect } from 'vitest';
import { createSecurityScanner } from './security-scanner';

describe('security-scanner', () => {
  const { scanRepository, getSeverityColor, SeverityLevels } = createSecurityScanner();

  const mockRepo = {
    id: '1',
    name: 'test-repo',
    fullName: 'owner/test-repo',
    owner: 'owner',
    description: 'Test repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 60,
    language: 'TypeScript'
  };

  describe('scanRepository', () => {
    it('should scan repository and return results', () => {
      const result = scanRepository(mockRepo);
      
      expect(result).toBeDefined();
      expect(result.repository).toEqual(mockRepo);
      expect(result.scanDate).toBeInstanceOf(Date);
      expect(result.alerts).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(result.riskLevel).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    it('should detect JavaScript vulnerabilities', () => {
      const jsRepo = { ...mockRepo, language: 'JavaScript' };
      const result = scanRepository(jsRepo);
      
      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts.some(a => a.type === 'vulnerability')).toBe(true);
    });

    it('should generate recommendations', () => {
      const result = scanRepository(mockRepo);
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include security policy recommendation', () => {
      const result = scanRepository(mockRepo);
      
      expect(result.recommendations.some(r => r.includes('SECURITY.md'))).toBe(true);
    });
  });

  describe('getSeverityColor', () => {
    it('should return correct colors for each severity', () => {
      expect(getSeverityColor('low')).toBe('#10b981');
      expect(getSeverityColor('medium')).toBe('#f59e0b');
      expect(getSeverityColor('high')).toBe('#f97316');
      expect(getSeverityColor('critical')).toBe('#ef4444');
    });
  });

  describe('SeverityLevels', () => {
    it('should contain all severity levels', () => {
      expect(SeverityLevels).toContain('low');
      expect(SeverityLevels).toContain('medium');
      expect(SeverityLevels).toContain('high');
      expect(SeverityLevels).toContain('critical');
    });
  });
});
