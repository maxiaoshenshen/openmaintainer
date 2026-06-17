import { describe, it, expect } from 'vitest';
import { ForkNetworkAnalyzer, forkNetworkAnalyzer } from './fork-network';

describe('ForkNetworkAnalyzer', () => {
  const analyzer = new ForkNetworkAnalyzer();

  describe('analyzeNetwork', () => {
    it('should analyze fork network', async () => {
      const network = await analyzer.analyzeNetwork('facebook/react');
      expect(network).toHaveProperty('rootRepo');
      expect(network).toHaveProperty('forks');
      expect(network).toHaveProperty('totalForks');
      expect(network).toHaveProperty('uniqueOwners');
      expect(network).toHaveProperty('depth');
      expect(network.totalForks).toBe(network.forks.length);
    });
  });

  describe('getForks', () => {
    it('should fetch forks for a repo', async () => {
      const forks = await analyzer.getForks('lodash/lodash');
      expect(Array.isArray(forks)).toBe(true);
      expect(forks.length).toBeGreaterThan(0);
    });
  });

  describe('identifyClusters', () => {
    it('should identify fork clusters', async () => {
      const forks = await analyzer.getForks('vuejs/vue');
      const clusters = analyzer.identifyClusters(forks);
      expect(Array.isArray(clusters)).toBe(true);
    });
  });

  describe('analyzeForks', () => {
    it('should generate fork analytics', async () => {
      const forks = await analyzer.getForks('angular/angular');
      const analytics = analyzer.analyzeForks(forks);
      
      expect(analytics).toHaveProperty('mostActiveForks');
      expect(analytics).toHaveProperty('largestForks');
      expect(analytics).toHaveProperty('recentlyUpdatedForks');
      expect(analytics).toHaveProperty('distributionByOwner');
      expect(analytics).toHaveProperty('forksByLanguage');
      expect(analytics).toHaveProperty('archivedRatio');
    });
  });

  describe('findInfluentialForks', () => {
    it('should find influential forks', async () => {
      const forks = await analyzer.getForks('tensorflow/tensorflow');
      const influential = analyzer.findInfluentialForks(forks);
      expect(Array.isArray(influential)).toBe(true);
    });
  });

  describe('trackEvolution', () => {
    it('should track fork evolution over time', async () => {
      const forks = await analyzer.getForks('kubernetes/kubernetes');
      const evolution = analyzer.trackEvolution(forks);
      
      expect(Array.isArray(evolution)).toBe(true);
      expect(evolution.length).toBeGreaterThanOrEqual(12);
      
      evolution.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('totalForks');
        expect(point).toHaveProperty('activeForks');
      });
    });
  });
});
