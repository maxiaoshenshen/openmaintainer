/**
 * A/B Testing System - Experiment tracking and analysis
 */

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  targetMetric: string;
  minimumSampleSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
  metrics: VariantMetrics;
}

export interface VariantMetrics {
  participants: number;
  conversions: number;
  conversionRate: number;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
}

export interface StatisticalSignificance {
  variantId: string;
  controlConversionRate: number;
  treatmentConversionRate: number;
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: number;
}

export class ABTestingSystem {
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment[]> = new Map();
  private userVariantCache: Map<string, string> = new Map();

  createExperiment(experiment: Omit<Experiment, 'createdAt' | 'updatedAt'>): Experiment {
    const now = new Date();
    const newExperiment: Experiment = {
      ...experiment,
      createdAt: now,
      updatedAt: now
    };
    this.experiments.set(experiment.id, newExperiment);
    return newExperiment;
  }

  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  updateExperiment(id: string, updates: Partial<Experiment>): Experiment | null {
    const exp = this.experiments.get(id);
    if (!exp) return null;

    const updated: Experiment = {
      ...exp,
      ...updates,
      updatedAt: new Date()
    };
    this.experiments.set(id, updated);
    return updated;
  }

  deleteExperiment(id: string): boolean {
    this.assignments.delete(id);
    return this.experiments.delete(id);
  }

  listExperiments(status?: Experiment['status']): Experiment[] {
    let exps = Array.from(this.experiments.values());
    if (status) {
      exps = exps.filter(e => e.status === status);
    }
    return exps;
  }

  assignVariant(experimentId: string, userId: string): Variant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return null;

    const cacheKey = `${experimentId}:${userId}`;
    if (this.userVariantCache.has(cacheKey)) {
      const cachedVariantId = this.userVariantCache.get(cacheKey)!;
      return experiment.variants.find(v => v.id === cachedVariantId) || null;
    }

    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of experiment.variants) {
      random -= variant.weight;
      if (random <= 0) {
        variant.metrics.participants++;
        this.updateVariantMetrics(experimentId, variant.id);

        const assignment: ExperimentAssignment = {
          experimentId,
          variantId: variant.id,
          userId,
          assignedAt: new Date()
        };

        if (!this.assignments.has(experimentId)) {
          this.assignments.set(experimentId, []);
        }
        this.assignments.get(experimentId)!.push(assignment);
        this.userVariantCache.set(cacheKey, variant.id);

        return variant;
      }
    }

    return experiment.variants[0] || null;
  }

  recordConversion(experimentId: string, userId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    const assignments = this.assignments.get(experimentId);
    if (!assignments) return false;

    const assignment = assignments.find(a => a.userId === userId);
    if (!assignment) return false;

    const variant = experiment.variants.find(v => v.id === assignment.variantId);
    if (!variant) return false;

    variant.metrics.conversions++;
    this.updateVariantMetrics(experimentId, variant.id);
    return true;
  }

  getVariantMetrics(experimentId: string, variantId: string): VariantMetrics | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const variant = experiment.variants.find(v => v.id === variantId);
    return variant?.metrics || null;
  }

  private updateVariantMetrics(experimentId: string, variantId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return;

    variant.metrics.conversionRate = 
      variant.metrics.participants > 0 
        ? variant.metrics.conversions / variant.metrics.participants 
        : 0;
  }

  calculateSignificance(experimentId: string, variantId: string): StatisticalSignificance | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.variants.length < 2) return null;

    const control = experiment.variants[0];
    const treatment = experiment.variants.find(v => v.id === variantId);
    if (!treatment || treatment.id === control.id) return null;

    const p1 = control.metrics.conversionRate;
    const p2 = treatment.metrics.conversionRate;
    const n1 = control.metrics.participants;
    const n2 = treatment.metrics.participants;

    if (n1 === 0 || n2 === 0) return null;

    const pooledP = (control.metrics.conversions + treatment.metrics.conversions) / (n1 + n2);
    const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));

    if (pooledSE === 0) return null;

    const zScore = (p2 - p1) / pooledSE;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const significant = pValue < 0.05;
    const confidenceLevel = (1 - pValue) * 100;

    return {
      variantId,
      controlConversionRate: p1,
      treatmentConversionRate: p2,
      zScore,
      pValue,
      significant,
      confidenceLevel
    };
  }

  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  getRecommendation(experimentId: string): {
    recommendation: 'continue' | 'ship' | 'rollback';
    confidence: string;
    reasoning: string;
  } | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return null;

    const control = experiment.variants[0];
    const totalParticipants = experiment.variants.reduce((sum, v) => sum + v.metrics.participants, 0);

    if (totalParticipants < experiment.minimumSampleSize) {
      return {
        recommendation: 'continue',
        confidence: 'low',
        reasoning: `Need more participants. Current: ${totalParticipants}, Required: ${experiment.minimumSampleSize}`
      };
    }

    let bestVariant = control;
    let bestLift = 0;

    for (const variant of experiment.variants) {
      if (variant.id === control.id) continue;
      const lift = ((variant.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100;
      if (lift > bestLift) {
        bestLift = lift;
        bestVariant = variant;
      }
    }

    const significance = this.calculateSignificance(experimentId, bestVariant.id);
    if (significance?.significant && bestLift > 5) {
      return {
        recommendation: 'ship',
        confidence: 'high',
        reasoning: `${bestVariant.name} shows ${bestLift.toFixed(1)}% improvement with statistical significance (p=${significance.pValue.toFixed(4)})`
      };
    }

    if (bestLift < -10) {
      return {
        recommendation: 'rollback',
        confidence: 'high',
        reasoning: `${bestVariant.name} performs ${Math.abs(bestLift).toFixed(1)}% worse than control`
      };
    }

    return {
      recommendation: 'continue',
      confidence: 'medium',
      reasoning: `Current lift: ${bestLift.toFixed(1)}%. Not enough evidence to make a decision.`
    };
  }

  startExperiment(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp || exp.status !== 'draft') return false;

    exp.status = 'running';
    exp.startDate = new Date();
    exp.updatedAt = new Date();
    return true;
  }

  pauseExperiment(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp || exp.status !== 'running') return false;

    exp.status = 'paused';
    exp.updatedAt = new Date();
    return true;
  }

  completeExperiment(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp || exp.status !== 'running') return false;

    exp.status = 'completed';
    exp.endDate = new Date();
    exp.updatedAt = new Date();
    return true;
  }

  getExperimentSummary(id: string): {
    experiment: Experiment;
    totalParticipants: number;
    totalConversions: number;
    overallConversionRate: number;
    winner?: string;
  } | null {
    const experiment = this.experiments.get(id);
    if (!experiment) return null;

    const totalParticipants = experiment.variants.reduce((sum, v) => sum + v.metrics.participants, 0);
    const totalConversions = experiment.variants.reduce((sum, v) => sum + v.metrics.conversions, 0);

    let winner: string | undefined;
    if (experiment.status === 'completed') {
      const bestVariant = experiment.variants.reduce((best, v) => 
        v.metrics.conversionRate > best.metrics.conversionRate ? v : best
      );
      winner = bestVariant.name;
    }

    return {
      experiment,
      totalParticipants,
      totalConversions,
      overallConversionRate: totalParticipants > 0 ? totalConversions / totalParticipants : 0,
      winner
    };
  }
}

export const createABTestingSystem = () => new ABTestingSystem();
