export type AdvisorySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AdvisoryStatus = 'open' | 'accepted' | 'mitigated' | 'resolved' | 'disputed';

export interface SecurityAdvisory {
  id: string;
  cveId?: string;
  ghsaId?: string;
  title: string;
  description: string;
  severity: AdvisorySeverity;
  status: AdvisoryStatus;
  cvssScore?: number;
  affectedRanges: string[];
  patchedVersions?: string[];
  references: string[];
  reportedBy?: string;
  reportedAt: Date;
  resolvedAt?: Date;
  cvssVector?: string;
}

export interface AdvisoryMetrics {
  total: number;
  bySeverity: Record<AdvisorySeverity, number>;
  byStatus: Record<AdvisoryStatus, number>;
  avgResolutionTime: number;
  criticalCount: number;
}

export class SecurityAdvisoryManager {
  private advisories: Map<string, SecurityAdvisory> = new Map();

  async createAdvisory(data: {
    title: string;
    description: string;
    severity: AdvisorySeverity;
    affectedRanges: string[];
    cveId?: string;
    ghsaId?: string;
    cvssScore?: number;
    reportedBy?: string;
  }): Promise<SecurityAdvisory> {
    const advisory: SecurityAdvisory = {
      id: `ADV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...data,
      status: 'open',
      references: [],
      reportedAt: new Date(),
    };

    this.advisories.set(advisory.id, advisory);
    return advisory;
  }

  async updateStatus(id: string, status: AdvisoryStatus): Promise<SecurityAdvisory | null> {
    const advisory = this.advisories.get(id);
    if (!advisory) return null;

    advisory.status = status;
    if (status === 'resolved') {
      advisory.resolvedAt = new Date();
    }

    return advisory;
  }

  async addReference(id: string, reference: string): Promise<SecurityAdvisory | null> {
    const advisory = this.advisories.get(id);
    if (!advisory) return null;

    advisory.references.push(reference);
    return advisory;
  }

  async setPatchedVersions(id: string, versions: string[]): Promise<SecurityAdvisory | null> {
    const advisory = this.advisories.get(id);
    if (!advisory) return null;

    advisory.patchedVersions = versions;
    return advisory;
  }

  async getAdvisory(id: string): Promise<SecurityAdvisory | null> {
    return this.advisories.get(id) || null;
  }

  async getAllAdvisories(filters?: {
    severity?: AdvisorySeverity;
    status?: AdvisoryStatus;
  }): Promise<SecurityAdvisory[]> {
    let advisories = Array.from(this.advisories.values());

    if (filters?.severity) {
      advisories = advisories.filter(a => a.severity === filters.severity);
    }
    if (filters?.status) {
      advisories = advisories.filter(a => a.status === filters.status);
    }

    return advisories.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async getMetrics(): Promise<AdvisoryMetrics> {
    const advisories = Array.from(this.advisories.values());
    const resolved = advisories.filter(a => a.status === 'resolved' && a.resolvedAt);
    
    const totalResolutionTime = resolved.reduce((sum, a) => {
      return sum + (a.resolvedAt!.getTime() - a.reportedAt.getTime());
    }, 0);

    return {
      total: advisories.length,
      bySeverity: {
        low: advisories.filter(a => a.severity === 'low').length,
        medium: advisories.filter(a => a.severity === 'medium').length,
        high: advisories.filter(a => a.severity === 'high').length,
        critical: advisories.filter(a => a.severity === 'critical').length,
      },
      byStatus: {
        open: advisories.filter(a => a.status === 'open').length,
        accepted: advisories.filter(a => a.status === 'accepted').length,
        mitigated: advisories.filter(a => a.status === 'mitigated').length,
        resolved: advisories.filter(a => a.status === 'resolved').length,
        disputed: advisories.filter(a => a.status === 'disputed').length,
      },
      avgResolutionTime: resolved.length > 0 ? totalResolutionTime / resolved.length : 0,
      criticalCount: advisories.filter(a => a.severity === 'critical' && a.status !== 'resolved').length,
    };
  }

  async checkVersionAffected(advisoryId: string, version: string): Promise<boolean> {
    const advisory = this.advisories.get(advisoryId);
    if (!advisory) return false;

    for (const range of advisory.affectedRanges) {
      if (this.versionMatchesRange(version, range)) {
        return true;
      }
    }
    return false;
  }

  private versionMatchesRange(version: string, range: string): boolean {
    // Split compound ranges like ">=1.0.0 <2.0.0" into individual constraints
    const parts = range.split(/\s+/).filter(Boolean);
    
    for (const part of parts) {
      if (part.startsWith('>=')) {
        const required = part.slice(2);
        if (this.compareVersions(version, required) < 0) return false;
      } else if (part.startsWith('<=')) {
        const required = part.slice(2);
        if (this.compareVersions(version, required) > 0) return false;
      } else if (part.startsWith('<')) {
        const required = part.slice(1);
        if (this.compareVersions(version, required) >= 0) return false;
      } else if (part.startsWith('>')) {
        const required = part.slice(1);
        if (this.compareVersions(version, required) <= 0) return false;
      } else if (part.includes('-')) {
        const [start, end] = part.split('-');
        if (this.compareVersions(version, start) < 0 || this.compareVersions(version, end) > 0) return false;
      } else if (part.startsWith('=')) {
        if (version !== part.slice(1)) return false;
      } else {
        if (version !== part) return false;
      }
    }
    return true;
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  }
}
