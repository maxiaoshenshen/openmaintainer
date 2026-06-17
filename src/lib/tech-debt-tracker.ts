export type DebtSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DebtStatus = 'identified' | 'acknowledged' | 'in-progress' | 'resolved';
export type DebtCategory = 'code-quality' | 'performance' | 'security' | 'documentation' | 'testing' | 'architecture';

export interface TechDebt {
  id: string;
  title: string;
  description: string;
  category: DebtCategory;
  severity: DebtSeverity;
  status: DebtStatus;
  estimatedEffort: string;
  impactedAreas: string[];
  createdAt: Date;
  resolvedAt?: Date;
  assignee?: string;
}

export interface DebtMetrics {
  totalDebt: number;
  resolvedDebt: number;
  debtByCategory: Record<DebtCategory, number>;
  debtBySeverity: Record<DebtSeverity, number>;
  debtByStatus: Record<DebtStatus, number>;
  averageAge: number;
}

export interface DebtTrend {
  date: string;
  totalDebt: number;
  resolvedDebt: number;
}

export class TechDebtTracker {
  private debts: Map<string, TechDebt> = new Map();
  private history: DebtTrend[] = [];

  async addDebt(data: {
    title: string;
    description: string;
    category: DebtCategory;
    severity: DebtSeverity;
    estimatedEffort: string;
    impactedAreas: string[];
  }): Promise<TechDebt> {
    const debt: TechDebt = {
      id: `DEBT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...data,
      status: 'identified',
      createdAt: new Date(),
    };

    this.debts.set(debt.id, debt);
    this.recordTrend();
    return debt;
  }

  async updateDebtStatus(id: string, status: DebtStatus): Promise<TechDebt | null> {
    const debt = this.debts.get(id);
    if (!debt) return null;

    debt.status = status;
    if (status === 'resolved') {
      debt.resolvedAt = new Date();
    }

    this.recordTrend();
    return debt;
  }

  async assignDebt(id: string, assignee: string): Promise<TechDebt | null> {
    const debt = this.debts.get(id);
    if (!debt) return null;
    debt.assignee = assignee;
    return debt;
  }

  async getDebt(id: string): Promise<TechDebt | null> {
    return this.debts.get(id) || null;
  }

  async getAllDebts(filters?: {
    category?: DebtCategory;
    severity?: DebtSeverity;
    status?: DebtStatus;
  }): Promise<TechDebt[]> {
    let debts = Array.from(this.debts.values());

    if (filters?.category) {
      debts = debts.filter(d => d.category === filters.category);
    }
    if (filters?.severity) {
      debts = debts.filter(d => d.severity === filters.severity);
    }
    if (filters?.status) {
      debts = debts.filter(d => d.status === filters.status);
    }

    return debts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMetrics(): Promise<DebtMetrics> {
    const debts = Array.from(this.debts.values());
    
    const debtByCategory = {
      'code-quality': debts.filter(d => d.category === 'code-quality').length,
      'performance': debts.filter(d => d.category === 'performance').length,
      'security': debts.filter(d => d.category === 'security').length,
      'documentation': debts.filter(d => d.category === 'documentation').length,
      'testing': debts.filter(d => d.category === 'testing').length,
      'architecture': debts.filter(d => d.category === 'architecture').length,
    };

    const debtBySeverity = {
      critical: debts.filter(d => d.severity === 'critical').length,
      high: debts.filter(d => d.severity === 'high').length,
      medium: debts.filter(d => d.severity === 'medium').length,
      low: debts.filter(d => d.severity === 'low').length,
    };

    const debtByStatus = {
      identified: debts.filter(d => d.status === 'identified').length,
      acknowledged: debts.filter(d => d.status === 'acknowledged').length,
      'in-progress': debts.filter(d => d.status === 'in-progress').length,
      resolved: debts.filter(d => d.status === 'resolved').length,
    };

    const resolvedDebt = debts.filter(d => d.status === 'resolved').length;
    const totalAge = debts.reduce((sum, d) => {
      const age = (d.resolvedAt?.getTime() || Date.now()) - d.createdAt.getTime();
      return sum + age;
    }, 0);

    return {
      totalDebt: debts.length,
      resolvedDebt,
      debtByCategory,
      debtBySeverity,
      debtByStatus,
      averageAge: debts.length > 0 ? totalAge / debts.length : 0,
    };
  }

  async getTrends(days: number = 30): Promise<DebtTrend[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.history.filter(h => new Date(h.date) >= cutoff);
  }

  private recordTrend(): void {
    const metrics = this.debts.size;
    const resolved = Array.from(this.debts.values()).filter(d => d.status === 'resolved').length;

    this.history.push({
      date: new Date().toISOString(),
      totalDebt: metrics,
      resolvedDebt: resolved,
    });

    if (this.history.length > 365) {
      this.history = this.history.slice(-365);
    }
  }
}
