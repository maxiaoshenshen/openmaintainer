import { describe, it, expect } from 'vitest';
import { PackageManagerHelper } from './package-manager';

describe('PackageManagerHelper', () => {
  const helper = new PackageManagerHelper();

  it('should add dependency', async () => {
    const dep = await helper.addDependency('lodash', '4.17.21', 'prod');
    expect(dep.name).toBe('lodash');
    expect(dep.version).toBe('4.17.21');
    expect(dep.type).toBe('prod');
  });

  it('should add dev dependency', async () => {
    const dep = await helper.addDependency('vitest', '1.0.0', 'dev');
    expect(dep.type).toBe('dev');
    expect(dep.dev).toBe(true);
  });

  it('should remove dependency', async () => {
    await helper.addDependency('temp-dep', '1.0.0');
    const removed = await helper.removeDependency('temp-dep');
    expect(removed).toBe(true);

    const dep = await helper.getDependency('temp-dep');
    expect(dep).toBeNull();
  });

  it('should get dependency', async () => {
    await helper.addDependency('express', '4.18.2');
    const dep = await helper.getDependency('express');
    expect(dep).toBeDefined();
    expect(dep?.version).toBe('4.18.2');
  });

  it('should get all dependencies', async () => {
    const deps = await helper.getAllDependencies();
    expect(Array.isArray(deps)).toBe(true);
    expect(deps.length).toBeGreaterThan(0);
  });

  it('should filter by type', async () => {
    await helper.addDependency('react', '18.2.0', 'prod');
    await helper.addDependency('jest', '29.0.0', 'dev');

    const prodDeps = await helper.getDependenciesByType('prod');
    const devDeps = await helper.getDependenciesByType('dev');

    expect(prodDeps.some(d => d.name === 'react')).toBe(true);
    expect(devDeps.some(d => d.name === 'jest')).toBe(true);
  });

  it('should check for updates', async () => {
    const updates = await helper.checkForUpdates();
    expect(Array.isArray(updates)).toBe(true);
  });

  it('should generate lockfile', async () => {
    const lockfile = await helper.generateLockfile('npm');
    expect(lockfile).toBeDefined();
    expect(lockfile.version).toBeDefined();
    expect(lockfile.packages).toBeDefined();
  });

  it('should get lockfile', async () => {
    await helper.generateLockfile('yarn');
    const lockfile = await helper.getLockfile('yarn');
    expect(lockfile).toBeDefined();
  });

  it('should find outdated packages', async () => {
    const outdated = await helper.findOutdated();
    expect(Array.isArray(outdated)).toBe(true);
  });

  it('should audit security', async () => {
    const audit = await helper.auditSecurity();
    expect(Array.isArray(audit)).toBe(true);
  });

  it('should get unused dependencies', async () => {
    const unused = await helper.getUnusedDependencies();
    expect(Array.isArray(unused)).toBe(true);
  });

  it('should get dependency tree', async () => {
    const tree = await helper.getDependencyTree();
    expect(tree).toBeDefined();
  });

  it('should find circular dependencies', async () => {
    const circular = await helper.getCircularDependencies();
    expect(Array.isArray(circular)).toBe(true);
  });

  it('should generate install command', async () => {
    const cmd = await helper.generatePackageCommand('install');
    expect(cmd).toContain('install');
  });

  it('should generate update command with packages', async () => {
    const cmd = await helper.generatePackageCommand('update', ['lodash', 'express']);
    expect(cmd).toContain('update');
  });

  it('should generate remove command', async () => {
    const cmd = await helper.generatePackageCommand('remove', ['unused-pkg']);
    expect(cmd).toContain('remove');
  });
});
