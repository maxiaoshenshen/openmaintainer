/**
 * Feature Flags Management System
 * Control feature rollouts dynamically
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetRepos?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FlagEvaluation {
  flagId: string;
  userId?: string;
  repoId?: string;
  result: boolean;
  reason: string;
}

export interface FlagConfig {
  defaultEnabled: boolean;
  enableLogging: boolean;
  cacheDuration: number;
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private config: FlagConfig;
  private evaluationCache: Map<string, { result: boolean; expiry: number }> = new Map();

  constructor(config: Partial<FlagConfig> = {}) {
    this.config = {
      defaultEnabled: false,
      enableLogging: true,
      cacheDuration: 60000,
      ...config
    };
  }

  createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): FeatureFlag {
    const now = new Date();
    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: now,
      updatedAt: now
    };
    this.flags.set(flag.id, newFlag);
    return newFlag;
  }

  getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId);
  }

  updateFlag(flagId: string, updates: Partial<FeatureFlag>): FeatureFlag | null {
    const flag = this.flags.get(flagId);
    if (!flag) return null;
    
    const updatedFlag: FeatureFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date()
    };
    this.flags.set(flagId, updatedFlag);
    return updatedFlag;
  }

  deleteFlag(flagId: string): boolean {
    return this.flags.delete(flagId);
  }

  listFlags(filters?: { enabled?: boolean }): FeatureFlag[] {
    let flags = Array.from(this.flags.values());
    if (filters?.enabled !== undefined) {
      flags = flags.filter(f => f.enabled === filters.enabled);
    }
    return flags;
  }

  evaluateFlag(
    flagId: string,
    context: { userId?: string; repoId?: string }
  ): FlagEvaluation {
    const cacheKey = `${flagId}:${context.userId || 'anonymous'}:${context.repoId || 'global'}`;
    const cached = this.evaluationCache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return {
        flagId,
        userId: context.userId,
        repoId: context.repoId,
        result: cached.result,
        reason: 'cache'
      };
    }

    const flag = this.flags.get(flagId);
    if (!flag) {
      return {
        flagId,
        userId: context.userId,
        repoId: context.repoId,
        result: this.config.defaultEnabled,
        reason: 'flag_not_found'
      };
    }

    if (!flag.enabled) {
      const result = { flagId, userId: context.userId, repoId: context.repoId, result: false, reason: 'disabled' };
      this.cacheResult(cacheKey, false);
      return result;
    }

    if (flag.targetUsers && context.userId && !flag.targetUsers.includes(context.userId)) {
      const result = { flagId, userId: context.userId, repoId: context.repoId, result: false, reason: 'user_not_targeted' };
      this.cacheResult(cacheKey, false);
      return result;
    }

    if (flag.targetRepos && context.repoId && !flag.targetRepos.includes(context.repoId)) {
      const result = { flagId, userId: context.userId, repoId: context.repoId, result: false, reason: 'repo_not_targeted' };
      this.cacheResult(cacheKey, false);
      return result;
    }

    const hash = this.hashContext(cacheKey);
    const inRollout = (hash % 100) < flag.rolloutPercentage;
    const result = {
      flagId,
      userId: context.userId,
      repoId: context.repoId,
      result: inRollout,
      reason: inRollout ? 'rollout_match' : 'rollout_miss'
    };
    
    this.cacheResult(cacheKey, inRollout);
    return result;
  }

  enableFlag(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) return false;
    flag.enabled = true;
    flag.updatedAt = new Date();
    this.invalidateCache(flagId);
    return true;
  }

  disableFlag(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) return false;
    flag.enabled = false;
    flag.updatedAt = new Date();
    this.invalidateCache(flagId);
    return true;
  }

  setRolloutPercentage(flagId: string, percentage: number): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) return false;
    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    flag.updatedAt = new Date();
    this.invalidateCache(flagId);
    return true;
  }

  batchEvaluate(
    flagIds: string[],
    context: { userId?: string; repoId?: string }
  ): FlagEvaluation[] {
    return flagIds.map(flagId => this.evaluateFlag(flagId, context));
  }

  getFlagStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byRollout: Record<string, number>;
  } {
    const flags = Array.from(this.flags.values());
    return {
      total: flags.length,
      enabled: flags.filter(f => f.enabled).length,
      disabled: flags.filter(f => !f.enabled).length,
      byRollout: {
        '0-25': flags.filter(f => f.rolloutPercentage <= 25).length,
        '26-50': flags.filter(f => f.rolloutPercentage > 25 && f.rolloutPercentage <= 50).length,
        '51-75': flags.filter(f => f.rolloutPercentage > 50 && f.rolloutPercentage <= 75).length,
        '76-100': flags.filter(f => f.rolloutPercentage > 75).length
      }
    };
  }

  private hashContext(context: string): number {
    let hash = 0;
    for (let i = 0; i < context.length; i++) {
      const char = context.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private cacheResult(key: string, result: boolean): void {
    this.evaluationCache.set(key, {
      result,
      expiry: Date.now() + this.config.cacheDuration
    });
  }

  private invalidateCache(flagId: string): void {
    for (const key of this.evaluationCache.keys()) {
      if (key.startsWith(flagId)) {
        this.evaluationCache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.evaluationCache.clear();
  }

  exportFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  importFlags(flags: FeatureFlag[]): number {
    let imported = 0;
    for (const flag of flags) {
      if (!this.flags.has(flag.id)) {
        this.flags.set(flag.id, flag);
        imported++;
      }
    }
    return imported;
  }
}

export const createFeatureFlagManager = (config?: Partial<FlagConfig>) => 
  new FeatureFlagManager(config);
