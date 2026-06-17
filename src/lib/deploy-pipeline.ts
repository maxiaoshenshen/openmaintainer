/**
 * Deploy Pipeline - CI/CD pipeline management and monitoring
 */

export type PipelineStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
export type StageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
export type Environment = 'development' | 'staging' | 'production';

export interface Stage {
  id: string;
  name: string;
  status: StageStatus;
  duration: number;
  logs: string[];
  startedAt?: Date;
  completedAt?: Date;
  allowFailure: boolean;
}

export interface Pipeline {
  id: string;
  ref: string;
  sha: string;
  status: PipelineStatus;
  stages: Stage[];
  environment: Environment;
  triggeredBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration: number;
}

export interface PipelineConfig {
  stages: string[];
  timeout: number;
  retryCount: number;
  environmentVariables: Record<string, string>;
}

export interface DeploymentTarget {
  name: string;
  url: string;
  environment: Environment;
  healthy: boolean;
  lastDeployment?: Date;
}

export class DeployPipeline {
  private pipelines: Map<string, Pipeline> = new Map();
  private config: PipelineConfig;
  private deploymentTargets: Map<string, DeploymentTarget> = new Map();
  private pipelineHistory: Map<string, Pipeline[]> = new Map();

  constructor(config?: Partial<PipelineConfig>) {
    this.config = {
      stages: ['build', 'test', 'deploy'],
      timeout: 3600000,
      retryCount: 2,
      environmentVariables: {},
      ...config
    };
  }

  createPipeline(id: string, ref: string, sha: string, triggeredBy: string): Pipeline {
    const stages: Stage[] = this.config.stages.map((name, index) => ({
      id: `${id}-stage-${index}`,
      name,
      status: 'pending' as StageStatus,
      duration: 0,
      logs: [],
      allowFailure: false
    }));

    const pipeline: Pipeline = {
      id,
      ref,
      sha,
      status: 'pending',
      stages,
      environment: 'development',
      triggeredBy,
      createdAt: new Date(),
      duration: 0
    };

    this.pipelines.set(id, pipeline);
    return pipeline;
  }

  getPipeline(id: string): Pipeline | undefined {
    return this.pipelines.get(id);
  }

  startPipeline(id: string): boolean {
    const pipeline = this.pipelines.get(id);
    if (!pipeline || pipeline.status !== 'pending') return false;

    pipeline.status = 'running';
    pipeline.startedAt = new Date();
    pipeline.stages[0].status = 'running';
    pipeline.stages[0].startedAt = new Date();
    return true;
  }

  completeStage(pipelineId: string, stageId: string, success: boolean, logs: string[] = []): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    const stage = pipeline.stages.find(s => s.id === stageId);
    if (!stage || stage.status !== 'running') return false;

    stage.status = success ? 'success' : 'failed';
    stage.completedAt = new Date();
    stage.duration = stage.completedAt.getTime() - (stage.startedAt?.getTime() || 0);
    stage.logs = logs;

    const nextStageIndex = pipeline.stages.indexOf(stage) + 1;
    if (success && nextStageIndex < pipeline.stages.length) {
      pipeline.stages[nextStageIndex].status = 'running';
      pipeline.stages[nextStageIndex].startedAt = new Date();
    } else if (!success && !stage.allowFailure) {
      this.failPipeline(pipelineId);
    } else if (success) {
      this.completePipeline(pipelineId);
    }

    return true;
  }

  private failPipeline(id: string): void {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return;

    pipeline.status = 'failed';
    pipeline.completedAt = new Date();
    pipeline.duration = pipeline.completedAt.getTime() - (pipeline.startedAt?.getTime() || 0);

    const currentStage = pipeline.stages.find(s => s.status === 'running');
    if (currentStage) {
      currentStage.status = 'failed';
      currentStage.completedAt = new Date();
    }

    for (const stage of pipeline.stages) {
      if (stage.status === 'pending') {
        stage.status = 'skipped';
      }
    }

    this.archivePipeline(id);
  }

  private completePipeline(id: string): void {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return;

    pipeline.status = 'success';
    pipeline.completedAt = new Date();
    pipeline.duration = pipeline.completedAt.getTime() - (pipeline.startedAt?.getTime() || 0);
    this.archivePipeline(id);
  }

  cancelPipeline(id: string): boolean {
    const pipeline = this.pipelines.get(id);
    if (!pipeline || !['running', 'pending'].includes(pipeline.status)) return false;

    pipeline.status = 'cancelled';
    pipeline.completedAt = new Date();
    pipeline.duration = pipeline.completedAt.getTime() - (pipeline.startedAt?.getTime() || 0);

    this.archivePipeline(id);
    return true;
  }

  retryPipeline(id: string): Pipeline | null {
    const pipeline = this.pipelines.get(id);
    if (!pipeline || pipeline.status === 'running') return null;

    const newId = `${id}-retry-${Date.now()}`;
    return this.createPipeline(newId, pipeline.ref, pipeline.sha, pipeline.triggeredBy);
  }

  private archivePipeline(id: string): void {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return;

    if (!this.pipelineHistory.has(id)) {
      this.pipelineHistory.set(id, []);
    }
    this.pipelineHistory.get(id)!.push(pipeline);

    const history = this.pipelineHistory.get(id)!;
    if (history.length > 10) {
      history.shift();
    }
  }

  getPipelineHistory(id: string): Pipeline[] {
    return this.pipelineHistory.get(id) || [];
  }

  addDeploymentTarget(target: DeploymentTarget): void {
    this.deploymentTargets.set(target.name, target);
  }

  getDeploymentTarget(name: string): DeploymentTarget | undefined {
    return this.deploymentTargets.get(name);
  }

  listDeploymentTargets(): DeploymentTarget[] {
    return Array.from(this.deploymentTargets.values());
  }

  deployToTarget(pipelineId: string, targetName: string): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    const target = this.deploymentTargets.get(targetName);
    
    if (!pipeline || !target) return false;
    if (pipeline.status !== 'success') return false;

    target.lastDeployment = new Date();
    target.healthy = true;
    return true;
  }

  getPipelineStats(): {
    total: number;
    byStatus: Record<PipelineStatus, number>;
    averageDuration: number;
    successRate: number;
  } {
    const pipelines = Array.from(this.pipelines.values());
    const byStatus: Record<PipelineStatus, number> = {
      pending: 0, running: 0, success: 0, failed: 0, cancelled: 0
    };

    for (const p of pipelines) {
      byStatus[p.status]++;
    }

    const completedPipelines = pipelines.filter(p => p.status === 'success' || p.status === 'failed');
    const avgDuration = completedPipelines.length > 0
      ? completedPipelines.reduce((sum, p) => sum + p.duration, 0) / completedPipelines.length
      : 0;

    const successCount = pipelines.filter(p => p.status === 'success').length;
    const successRate = pipelines.length > 0 ? (successCount / pipelines.length) * 100 : 0;

    return {
      total: pipelines.length,
      byStatus,
      averageDuration: avgDuration,
      successRate
    };
  }

  setEnvironment(pipelineId: string, env: Environment): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;
    pipeline.environment = env;
    return true;
  }

  addLog(pipelineId: string, stageId: string, log: string): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    const stage = pipeline.stages.find(s => s.id === stageId);
    if (!stage) return false;

    stage.logs.push(`[${new Date().toISOString()}] ${log}`);
    return true;
  }
}

export const createDeployPipeline = (config?: Partial<PipelineConfig>) => new DeployPipeline(config);
