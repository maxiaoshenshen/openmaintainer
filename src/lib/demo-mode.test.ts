import { describe, it, expect } from 'vitest';
import { createDemoMode } from './demo-mode';

describe('Demo Mode', () => {
  it('creates demo mode instance', () => {
    const demo = createDemoMode();
    expect(demo).toBeDefined();
  });

  it('returns demo scenarios', () => {
    const demo = createDemoMode();
    const scenarios = demo.getScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it('gets scenario by id', () => {
    const demo = createDemoMode();
    const scenario = demo.getScenario('repository-analysis');
    expect(scenario).toBeDefined();
    expect(scenario?.title).toBe('Analyze Your Repository');
  });

  it('starts scenario', () => {
    const demo = createDemoMode();
    const progress = demo.startScenario('repository-analysis');
    expect(progress).toBeDefined();
    expect(progress?.scenarioId).toBe('repository-analysis');
    expect(progress?.currentStep).toBe(0);
  });

  it('advances steps', () => {
    const demo = createDemoMode();
    demo.startScenario('repository-analysis');
    const step = demo.advanceStep();
    expect(step).toBeDefined();
    expect(step?.id).toBe('step-1');
  });

  it('gets current step', () => {
    const demo = createDemoMode();
    demo.startScenario('repository-analysis');
    const current = demo.getCurrentStep();
    expect(current).toBeDefined();
  });

  it('calculates progress', () => {
    const demo = createDemoMode();
    demo.startScenario('repository-analysis');
    const progress = demo.getProgress();
    expect(progress).toBe(0);
  });

  it('ends demo', () => {
    const demo = createDemoMode();
    demo.startScenario('repository-analysis');
    demo.endDemo();
    const state = demo.getState();
    expect(state.isActive).toBe(false);
  });

  it('generates demo report', () => {
    const demo = createDemoMode();
    demo.startScenario('repository-analysis');
    demo.advanceStep();
    const report = demo.generateDemoReport();
    expect(report).toBeDefined();
    expect(report?.scenario).toBe('Analyze Your Repository');
    expect(report?.stepsCompleted).toBe(1);
  });

  it('checks step completion', () => {
    const demo = createDemoMode();
    demo.startScenario('repository-analysis');
    expect(demo.isStepCompleted('step-1')).toBe(false);
    demo.advanceStep();
    expect(demo.isStepCompleted('step-1')).toBe(true);
  });
});
