// OSS Governance Framework for OpenMaintainer
// Helps establish governance policies and processes

export type GovernanceArea = 'contribution' | 'decision' | 'release' | 'security' | 'communication';
export type PolicyStatus = 'draft' | 'active' | 'archived';

export interface GovernancePolicy {
  id: string;
  area: GovernanceArea;
  title: string;
  description: string;
  rules: string[];
  exceptions: string[];
  lastReviewed: Date;
  nextReview: Date;
  status: PolicyStatus;
  owner: string;
}

export interface DecisionRecord {
  id: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  participants: string[];
  date: Date;
  status: 'proposed' | 'accepted' | 'rejected' | 'superseded';
  relatedDecisions: string[];
}

export interface Role {
  name: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  term?: string;
}

class GovernanceFramework {
  private policies: Map<string, GovernancePolicy> = new Map();
  private decisions: Map<string, DecisionRecord> = new Map();
  private roles: Map<string, Role> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
    this.initializeDefaultRoles();
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: GovernancePolicy[] = [
      {
        id: 'contrib-001',
        area: 'contribution',
        title: 'Code Contribution Guidelines',
        description: 'Standards for accepting code contributions',
        rules: [
          'All PRs require at least one review',
          'Tests must pass before merge',
          'Code style must follow project guidelines',
          'Commits must follow conventional format',
        ],
        exceptions: ['Critical hotfixes can bypass review with two maintainer approval'],
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'active',
        owner: 'maintainers',
      },
      {
        id: 'decision-001',
        area: 'decision',
        title: 'Decision Making Process',
        description: 'How major decisions are made and documented',
        rules: [
          'Major decisions require RFC proposal',
          'RFCs must be open for at least 7 days',
          'Consensus required for acceptance',
          'Maintainers have final veto power',
        ],
        exceptions: [],
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'active',
        owner: 'maintainers',
      },
      {
        id: 'release-001',
        area: 'release',
        title: 'Release Process',
        description: 'Procedures for releasing new versions',
        rules: [
          'Semantic versioning must be followed',
          'Changelog must be updated',
          'Release notes required',
          'Security disclosures must wait for patch',
        ],
        exceptions: ['Emergency security releases can bypass standard process'],
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'active',
        owner: 'release-managers',
      },
      {
        id: 'security-001',
        area: 'security',
        title: 'Security Vulnerability Handling',
        description: 'Process for handling security vulnerabilities',
        rules: [
          'CVEs must be addressed within 30 days',
          'Private disclosure required for critical issues',
          'Security team must be notified',
          'Public announcement after patch is ready',
        ],
        exceptions: [],
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'active',
        owner: 'security-team',
      },
    ];

    defaultPolicies.forEach(p => this.policies.set(p.id, p));
  }

  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        name: 'Maintainer',
        description: 'Primary maintainer with full repository access',
        responsibilities: [
          'Review and merge pull requests',
          'Manage releases and versions',
          'Handle security vulnerabilities',
          'Make architectural decisions',
        ],
        requirements: [
          'Active contribution history',
          'Demonstrated understanding of codebase',
          'Community trust and respect',
        ],
      },
      {
        name: 'Reviewer',
        description: 'Code reviewer with merge queue access',
        responsibilities: [
          'Review pull requests',
          'Provide feedback and suggestions',
          'Ensure code quality standards',
        ],
        requirements: [
          'Consistent contribution history',
          'Knowledge of project domain',
        ],
        term: '2 years',
      },
      {
        name: 'Contributor',
        description: 'Regular contributor to the project',
        responsibilities: [
          'Submit quality pull requests',
          'Participate in discussions',
          'Help new contributors',
        ],
        requirements: [
          'At least 5 merged PRs',
          'Positive community interaction',
        ],
      },
    ];

    defaultRoles.forEach(r => this.roles.set(r.name, r));
  }

  addPolicy(policy: Omit<GovernancePolicy, 'id'>): GovernancePolicy {
    const id = `policy_${Date.now()}`;
    const fullPolicy: GovernancePolicy = { ...policy, id };
    this.policies.set(id, fullPolicy);
    return fullPolicy;
  }

  getPolicies(area?: GovernanceArea): GovernancePolicy[] {
    const policies = Array.from(this.policies.values());
    if (area) {
      return policies.filter(p => p.area === area);
    }
    return policies;
  }

  updatePolicy(id: string, updates: Partial<GovernancePolicy>): GovernancePolicy | null {
    const policy = this.policies.get(id);
    if (!policy) return null;
    
    const updated = { ...policy, ...updates };
    this.policies.set(id, updated);
    return updated;
  }

  recordDecision(decision: Omit<DecisionRecord, 'id'>): DecisionRecord {
    const id = `decision_${Date.now()}`;
    const fullDecision: DecisionRecord = { ...decision, id };
    this.decisions.set(id, fullDecision);
    return fullDecision;
  }

  getDecisions(status?: DecisionRecord['status']): DecisionRecord[] {
    const decisions = Array.from(this.decisions.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (status) {
      return decisions.filter(d => d.status === status);
    }
    return decisions;
  }

  getDecisionsByArea(area: GovernanceArea): DecisionRecord[] {
    const policies = this.getPolicies(area);
    const policyIds = new Set(policies.map(p => p.id));
    return this.getDecisions().filter(d => 
      d.relatedDecisions.some(rd => policyIds.has(rd))
    );
  }

  addRole(role: Omit<Role, 'name'> & { name: string }): Role {
    this.roles.set(role.name, role as Role);
    return role as Role;
  }

  getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  getComplianceReport(): {
    totalPolicies: number;
    activePolicies: number;
    pendingReviews: number;
    overdueReviews: number;
    recentDecisions: number;
  } {
    const now = new Date();
    const policies = Array.from(this.policies.values());

    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.status === 'active').length,
      pendingReviews: policies.filter(p => 
        p.nextReview > now && 
        p.nextReview.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000
      ).length,
      overdueReviews: policies.filter(p => p.nextReview < now).length,
      recentDecisions: this.decisions.size,
    };
  }

  exportGovernanceDocument(): string {
    const policies = this.getPolicies();
    const roles = this.getRoles();
    const decisions = this.getDecisions();

    let doc = '# Open Source Project Governance\n\n';
    doc += `Generated: ${new Date().toISOString()}\n\n`;

    doc += '## Roles\n\n';
    roles.forEach(role => {
      doc += `### ${role.name}\n`;
      doc += `${role.description}\n\n`;
      doc += '**Responsibilities:**\n';
      role.responsibilities.forEach(r => doc += `- ${r}\n`);
      doc += '\n**Requirements:**\n';
      role.requirements.forEach(r => doc += `- ${r}\n`);
      doc += '\n';
    });

    doc += '## Policies\n\n';
    policies.forEach(policy => {
      doc += `### ${policy.title} (${policy.status})\n`;
      doc += `Area: ${policy.area}\n`;
      doc += `Owner: ${policy.owner}\n`;
      doc += `${policy.description}\n\n`;
      doc += '**Rules:**\n';
      policy.rules.forEach(r => doc += `- ${r}\n`);
      if (policy.exceptions.length > 0) {
        doc += '\n**Exceptions:**\n';
        policy.exceptions.forEach(e => doc += `- ${e}\n`);
      }
      doc += `\nLast reviewed: ${policy.lastReviewed.toLocaleDateString()}\n`;
      doc += `Next review: ${policy.nextReview.toLocaleDateString()}\n\n`;
    });

    doc += '## Recent Decisions\n\n';
    decisions.slice(0, 10).forEach(decision => {
      doc += `### ${decision.title}\n`;
      doc += `Date: ${decision.date.toLocaleDateString()}\n`;
      doc += `Status: ${decision.status}\n`;
      doc += `Context: ${decision.context}\n`;
      doc += `Decision: ${decision.decision}\n`;
      doc += `Rationale: ${decision.rationale}\n\n`;
    });

    return doc;
  }
}

export const governanceFramework = new GovernanceFramework();

export function createGovernanceFramework(): GovernanceFramework {
  return new GovernanceFramework();
}

export { GovernanceFramework };
