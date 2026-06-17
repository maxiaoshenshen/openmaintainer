export type BranchType = 'main' | 'release' | 'feature' | 'hotfix' | 'develop';

export interface Branch {
  name: string;
  type: BranchType;
  protectionRules?: ProtectionRule[];
  createdAt: Date;
  lastCommitAt?: Date;
  mergedInto?: string;
}

export interface ProtectionRule {
  requireReviews: number;
  requireStatusChecks: boolean;
  requiredStatusChecks?: string[];
  requireBranchesUpToDate: boolean;
  dismissStaleReviews: boolean;
  requireCodeOwnerReview: boolean;
  requireLinearHistory: boolean;
}

export interface MergeStrategy {
  type: 'squash' | 'merge' | 'rebase';
  deleteBranchAfterMerge: boolean;
  allowEditsFromMaintainers: boolean;
}

export interface BranchMetrics {
  totalBranches: number;
  activeBranches: number;
  staleBranches: number;
  avgLifetime: number;
  mergeRate: number;
}

export class BranchStrategyManager {
  private branches: Map<string, Branch> = new Map();
  private mergeStrategies: Map<string, MergeStrategy> = new Map();

  constructor() {
    // Initialize default branches
    this.branches.set('main', {
      name: 'main',
      type: 'main',
      protectionRules: {
        requireReviews: 2,
        requireStatusChecks: true,
        requiredStatusChecks: ['ci/build', 'ci/test'],
        requireBranchesUpToDate: true,
        dismissStaleReviews: true,
        requireCodeOwnerReview: true,
        requireLinearHistory: true,
      } as ProtectionRule,
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      lastCommitAt: new Date(),
    });

    this.mergeStrategies.set('main', {
      type: 'squash',
      deleteBranchAfterMerge: true,
      allowEditsFromMaintainers: true,
    });
  }

  async createBranch(name: string, type: BranchType, fromBranch = 'main'): Promise<Branch> {
    const branch: Branch = {
      name,
      type,
      createdAt: new Date(),
      lastCommitAt: new Date(),
    };

    this.branches.set(name, branch);
    return branch;
  }

  async getBranch(name: string): Promise<Branch | null> {
    return this.branches.get(name) || null;
  }

  async getAllBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  async getBranchesByType(type: BranchType): Promise<Branch[]> {
    return Array.from(this.branches.values()).filter(b => b.type === type);
  }

  async updateBranch(name: string, updates: Partial<Branch>): Promise<Branch | null> {
    const branch = this.branches.get(name);
    if (!branch) return null;

    Object.assign(branch, updates);
    return branch;
  }

  async deleteBranch(name: string): Promise<boolean> {
    return this.branches.delete(name);
  }

  async protectBranch(name: string, rules: ProtectionRule): Promise<Branch | null> {
    const branch = this.branches.get(name);
    if (!branch) return null;

    branch.protectionRules = rules;
    return branch;
  }

  async removeProtection(name: string): Promise<Branch | null> {
    const branch = this.branches.get(name);
    if (!branch) return null;

    branch.protectionRules = undefined;
    return branch;
  }

  async setMergeStrategy(branchName: string, strategy: MergeStrategy): Promise<void> {
    this.mergeStrategies.set(branchName, strategy);
  }

  async getMergeStrategy(branchName: string): Promise<MergeStrategy | null> {
    return this.mergeStrategies.get(branchName) || null;
  }

  async mergeBranch(source: string, target: string): Promise<{ success: boolean; conflict?: string[] }> {
    const sourceBranch = this.branches.get(source);
    const targetBranch = this.branches.get(target);

    if (!sourceBranch || !targetBranch) {
      throw new Error('Branch not found');
    }

    // Simulate merge (in real implementation, would check for conflicts)
    const hasConflicts = Math.random() < 0.1;

    if (hasConflicts) {
      return {
        success: false,
        conflict: ['src/conflict1.ts', 'src/conflict2.ts'],
      };
    }

    sourceBranch.mergedInto = target;
    return { success: true };
  }

  async getMetrics(): Promise<BranchMetrics> {
    const branches = Array.from(this.branches.values());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activeBranches = branches.filter(
      b => b.lastCommitAt && b.lastCommitAt > thirtyDaysAgo
    );
    const staleBranches = branches.filter(
      b => b.lastCommitAt && b.lastCommitAt <= thirtyDaysAgo && !b.mergedInto
    );
    const mergedBranches = branches.filter(b => b.mergedInto);

    let totalLifetime = 0;
    branches.forEach(b => {
      const lifetime = (Date.now() - b.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      totalLifetime += lifetime;
    });

    return {
      totalBranches: branches.length,
      activeBranches: activeBranches.length,
      staleBranches: staleBranches.length,
      avgLifetime: branches.length > 0 ? totalLifetime / branches.length : 0,
      mergeRate: branches.length > 0 ? mergedBranches.length / branches.length : 0,
    };
  }

  async getStaleBranches(days = 30): Promise<Branch[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Array.from(this.branches.values()).filter(
      b => !b.mergedInto && b.lastCommitAt && b.lastCommitAt < cutoff
    );
  }

  async suggestBranchName(type: BranchType, description: string): Promise<string> {
    const slug = description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    const prefixes: Record<BranchType, string> = {
      main: 'main',
      release: 'release',
      feature: 'feature',
      hotfix: 'hotfix',
      develop: 'develop',
    };

    return `${prefixes[type]}/${slug}`;
  }

  async validateBranchName(name: string): Promise<{ valid: boolean; reason?: string }> {
    if (!name || name.length === 0) {
      return { valid: false, reason: 'Branch name cannot be empty' };
    }

    if (name.length > 100) {
      return { valid: false, reason: 'Branch name too long' };
    }

    if (/^\.|\/\.|\/\.|\.\.$|@/.test(name)) {
      return { valid: false, reason: 'Branch name contains invalid characters' };
    }

    if (/\s/.test(name)) {
      return { valid: false, reason: 'Branch name cannot contain spaces' };
    }

    return { valid: true };
  }
}
