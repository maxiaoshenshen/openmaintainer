import { describe, it, expect } from 'vitest';
import { 
  analyzeCoverage,
  identifyCoverageGaps,
  generateCoverageTrend,
  createCoverageBadge,
  calculateCoverageTarget,
  generateCoverageReport,
  suggestCoverageImprovements
} from './test-coverage-analyzer';

describe('Test Coverage Analyzer', () => {
  const mockCoverageData = {
    files: [
      {
        path: 'src/utils/helper.ts',
        lines: [
          { line: 1, hits: 10 }, { line: 2, hits: 10 }, { line: 3, hits: 0 },
          { line: 4, hits: 5 }, { line: 5, hits: 5 }, { line: 6, hits: 0 },
          { line: 7, hits: 0 }, { line: 8, hits: 0 }, { line: 9, hits: 0 }, { line: 10, hits: 0 }
        ],
        branches: [
          { line: 3, hits: 0 }, { line: 3, hits: 0 }
        ],
        functions: [
          { name: 'helper', hits: 10 }, { name: 'unused', hits: 0 }
        ]
      },
      {
        path: 'src/components/Button.tsx',
        lines: [
          { line: 1, hits: 100 }, { line: 2, hits: 100 }, { line: 3, hits: 100 }
        ],
        branches: [{ line: 2, hits: 50 }, { line: 2, hits: 50 }],
        functions: [{ name: 'Button', hits: 100 }]
      }
    ]
  };

  describe('analyzeCoverage', () => {
    it('should calculate coverage metrics', () => {
      const metrics = analyzeCoverage(mockCoverageData);
      
      expect(metrics.totalLines).toBe(13);
      expect(metrics.coveredLines).toBe(7);
      expect(metrics.overallPercentage).toBeGreaterThan(40);
    });

    it('should identify uncovered lines', () => {
      const metrics = analyzeCoverage(mockCoverageData);
      const helperFile = metrics.files.find(f => f.path === 'src/utils/helper.ts');
      
      expect(helperFile?.uncoveredLines).toContain(3);
    });

    it('should calculate branch coverage', () => {
      const metrics = analyzeCoverage(mockCoverageData);
      
      expect(metrics.totalBranches).toBe(4);
      expect(metrics.branchPercentage).toBeGreaterThan(0);
    });
  });

  describe('identifyCoverageGaps', () => {
    it('should find low coverage files', () => {
      const metrics = analyzeCoverage(mockCoverageData);
      const { lowCoverageFiles } = identifyCoverageGaps(metrics, 90);
      
      expect(lowCoverageFiles.length).toBeGreaterThan(0);
    });

    it('should identify critical gaps', () => {
      const metrics = analyzeCoverage(mockCoverageData);
      const { criticalGaps } = identifyCoverageGaps(metrics);
      
      expect(criticalGaps).toBeDefined();
    });
  });

  describe('generateCoverageTrend', () => {
    it('should calculate delta between entries', () => {
      const history = [
        { date: '2024-01-01', percentage: 70 },
        { date: '2024-01-02', percentage: 75 },
        { date: '2024-01-03', percentage: 80 }
      ];
      
      const trend = generateCoverageTrend(history);
      
      expect(trend[0].delta).toBe(0);
      expect(trend[1].delta).toBe(5);
      expect(trend[2].delta).toBe(5);
    });
  });

  describe('createCoverageBadge', () => {
    it('should use green for high coverage', () => {
      const badge = createCoverageBadge(95);
      expect(badge.color).toBe('brightgreen');
    });

    it('should use red for low coverage', () => {
      const badge = createCoverageBadge(50);
      expect(badge.color).toBe('red');
    });

    it('should return correct value', () => {
      const badge = createCoverageBadge(85);
      expect(badge.value).toBe('85%');
    });
  });

  describe('calculateCoverageTarget', () => {
    it('should calculate daily increase needed', () => {
      const target = calculateCoverageTarget(70, 90, 10);
      
      expect(target.dailyIncrease).toBe(2);
      expect(target.estimatedCompletion).toBeDefined();
    });
  });

  describe('generateCoverageReport', () => {
    it('should generate markdown report', () => {
      const metrics = analyzeCoverage(mockCoverageData);
      const report = generateCoverageReport(metrics);
      
      expect(report).toContain('# Test Coverage Report');
      expect(report).toContain('Overall Coverage');
      expect(report).toContain('Status');
    });
  });

  describe('suggestCoverageImprovements', () => {
    it('should provide actionable suggestions', () => {
      const metrics = analyzeCoverage(mockCoverageData);
      const suggestions = suggestCoverageImprovements(metrics);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(typeof suggestions[0]).toBe('string');
    });
  });
});
