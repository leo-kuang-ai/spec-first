/**
 * Init Router Tests
 *
 * Task 1: 保护测试脚手架
 * Task 2: 项目状态检测断言
 * Task 3: 轨道识别断言
 *
 * 这些测试先于实现写出（TDD），初始状态下会失败。
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

// 将在 Task 1 Step 3 导出占位函数后可解析
// 将在 Task 2 实现后实际通过
import {
  detectInitProjectState,
  detectInitTrack,
  buildLegacyBaselinePreset,
} from '../../src/cli/commands/init.js';

// ─────────────────────────────────────────────
// Test fixture helpers
// ─────────────────────────────────────────────

function createTmpDir(): string {
  const dir = join(os.tmpdir(), `spec-first-init-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

function gitInit(dir: string): void {
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir, stdio: 'ignore' });
}

function setupSpecFirstDir(dir: string): void {
  mkdirSync(join(dir, '.spec-first', 'meta'), { recursive: true });
  mkdirSync(join(dir, '.spec-first', 'runtime', 'first'), { recursive: true });
  writeFileSync(join(dir, '.spec-first', 'meta', 'config.yaml'), 'version: 1.0.0\n');
}

function setupHealthyFirstRuntime(dir: string): void {
  const runtimeDir = join(dir, '.spec-first', 'runtime', 'first');
  mkdirSync(runtimeDir, { recursive: true });
  writeFileSync(join(runtimeDir, 'index.json'), JSON.stringify({
    version: '1.0.0',
    summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'abc', lastUpdated: new Date().toISOString(), healthy: true },
    roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'abc', lastUpdated: new Date().toISOString(), healthy: true },
    stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'abc', lastUpdated: new Date().toISOString(), healthy: true },
    docsProjection: {},
    status: 'current',
  }));
  writeFileSync(join(runtimeDir, 'summary.json'), JSON.stringify({ project: { name: 'test' }, generatedAt: new Date().toISOString() }));
}

function setupLegacyBaseline(dir: string): void {
  const specsDir = join(dir, 'specs', 'FSREQ-19700101-LEGACY-BASELINE');
  mkdirSync(specsDir, { recursive: true });
  writeFileSync(join(specsDir, 'prd.md'), '# Legacy Baseline\n');
}

function addSourceFiles(dir: string, count: number): void {
  const srcDir = join(dir, 'src');
  mkdirSync(srcDir, { recursive: true });
  for (let i = 0; i < count; i++) {
    writeFileSync(join(srcDir, `module-${i}.ts`), `export const module${i} = ${i};\n`);
  }
}

// ─────────────────────────────────────────────
// Task 2: project state detection tests
// ─────────────────────────────────────────────

describe('detectInitProjectState - project state detection', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('should detect missing git repo', () => {
    const state = detectInitProjectState(tmpDir);
    expect(state.gitReady).toBe(false);
  });

  it('should detect git repo as ready', () => {
    gitInit(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.gitReady).toBe(true);
  });

  it('should detect missing .spec-first directory', () => {
    gitInit(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.specFirstDirExists).toBe(false);
  });

  it('should detect existing .spec-first directory', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.specFirstDirExists).toBe(true);
  });

  it('should detect missing meta/config.yaml', () => {
    gitInit(tmpDir);
    mkdirSync(join(tmpDir, '.spec-first'), { recursive: true });
    const state = detectInitProjectState(tmpDir);
    expect(state.metaConfigExists).toBe(false);
  });

  it('should detect existing meta/config.yaml', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.metaConfigExists).toBe(true);
  });

  it('should detect unhealthy first runtime (missing index.json)', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.firstRuntimeHealthy).toBe(false);
  });

  it('should detect healthy first runtime', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    setupHealthyFirstRuntime(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.firstRuntimeHealthy).toBe(true);
  });

  it('should detect absence of legacy baseline', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.hasLegacyBaseline).toBe(false);
  });

  it('should detect presence of legacy baseline', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    setupHealthyFirstRuntime(tmpDir);
    setupLegacyBaseline(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.hasLegacyBaseline).toBe(true);
  });

  it('[Greenfield] empty project (0 source files) should be classified as greenfield', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    setupHealthyFirstRuntime(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.projectMaturity).toBe('greenfield');
  });

  it('[Brownfield] project with ≥50 source files should be classified as brownfield', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    setupHealthyFirstRuntime(tmpDir);
    addSourceFiles(tmpDir, 60);
    const state = detectInitProjectState(tmpDir);
    expect(state.projectMaturity).toBe('brownfield');
  });

  it('should read baselineSkipped from meta/config.yaml', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    writeFileSync(join(tmpDir, '.spec-first', 'meta', 'config.yaml'), 'version: 1.0.0\nbaselineSkipped: true\n');
    const state = detectInitProjectState(tmpDir);
    expect(state.baselineSkipped).toBe(true);
  });

  it('should return baselineSkipped: false when not set', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.baselineSkipped).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Task 2: boundary cases matrix (B1-B10)
// ─────────────────────────────────────────────

describe('detectInitProjectState - boundary cases', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  it('B1: no git → gitReady=false', () => {
    const state = detectInitProjectState(tmpDir);
    expect(state.gitReady).toBe(false);
    expect(state.specFirstDirExists).toBe(false);
    expect(state.firstRuntimeHealthy).toBe(false);
  });

  it('B2: git + no .spec-first → specFirstDirExists=false', () => {
    gitInit(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.gitReady).toBe(true);
    expect(state.specFirstDirExists).toBe(false);
  });

  it('B3: git + .spec-first + no first runtime → firstRuntimeHealthy=false', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.gitReady).toBe(true);
    expect(state.specFirstDirExists).toBe(true);
    expect(state.firstRuntimeHealthy).toBe(false);
  });

  it('B5: brownfield + no baseline → hasLegacyBaseline=false', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    setupHealthyFirstRuntime(tmpDir);
    addSourceFiles(tmpDir, 60);
    const state = detectInitProjectState(tmpDir);
    expect(state.projectMaturity).toBe('brownfield');
    expect(state.hasLegacyBaseline).toBe(false);
  });

  it('B6: brownfield + baseline exists → hasLegacyBaseline=true', () => {
    gitInit(tmpDir);
    setupSpecFirstDir(tmpDir);
    setupHealthyFirstRuntime(tmpDir);
    addSourceFiles(tmpDir, 60);
    setupLegacyBaseline(tmpDir);
    const state = detectInitProjectState(tmpDir);
    expect(state.projectMaturity).toBe('brownfield');
    expect(state.hasLegacyBaseline).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Task 3: track detection tests
// ─────────────────────────────────────────────

describe('detectInitTrack - track detection', () => {
  it('should route to project-onboarding when git is not ready', () => {
    const state = {
      gitReady: false,
      specFirstDirExists: false,
      metaConfigExists: false,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).toBe('no-git');
  });

  it('should route to project-onboarding when .spec-first is missing', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: false,
      metaConfigExists: false,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).toBe('project-onboarding');
  });

  it('should route to project-onboarding when first runtime is unhealthy', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).toBe('project-onboarding');
  });

  it('should route to brownfield-baseline for brownfield with no baseline', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).toBe('brownfield-baseline');
  });

  it('should route to feature-init for healthy project with baseline', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).toBe('feature-init');
  });

  it('should route to feature-init for healthy greenfield project', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).toBe('feature-init');
  });

  it('should route to feature-init when --track feature is explicit', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, ['--track', 'feature']);
    expect(track).toBe('feature-init');
  });

  it('should route to project-onboarding when --track project is explicit', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: true,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, ['--track', 'project']);
    expect(track).toBe('project-onboarding');
  });

  it('should route to brownfield-baseline when --track baseline is explicit', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, ['--track', 'baseline']);
    expect(track).toBe('brownfield-baseline');
  });
});

// ─────────────────────────────────────────────
// Task 3: boundary cases routing rules
// ─────────────────────────────────────────────

describe('detectInitTrack - boundary cases', () => {
  it('B1: no git → should return no-git', () => {
    const state = {
      gitReady: false,
      specFirstDirExists: false,
      metaConfigExists: false,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, [])).toBe('no-git');
  });

  it('B2: git + no .spec-first → project-onboarding', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: false,
      metaConfigExists: false,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, [])).toBe('project-onboarding');
  });

  it('B3: git + .spec-first + no first runtime → project-onboarding', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, [])).toBe('project-onboarding');
  });

  it('B4: healthy project without baseline + greenfield → feature-init', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'greenfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, [])).toBe('feature-init');
  });

  it('B5: brownfield + no baseline → brownfield-baseline', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, [])).toBe('brownfield-baseline');
  });

  it('B6: brownfield + baseline → feature-init', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, [])).toBe('feature-init');
  });

  it('B7: .spec-first exists, first unhealthy, no --feat → project-onboarding', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    // No --feat arg, so routes to project-onboarding (will fix first there)
    expect(detectInitTrack(state, [])).toBe('project-onboarding');
  });

  it('B8: first healthy + --feat AUTH → feature-init', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, ['--feat', 'AUTH'])).toBe('feature-init');
  });

  it('B9: first unhealthy + --feat AUTH → feature-init-blocked (error signal)', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: false,
      hasAnyFeature: false,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    // explicit --feat but first is broken → signal error
    expect(detectInitTrack(state, ['--feat', 'AUTH'])).toBe('feature-init-blocked');
  });

  it('B10: healthy project + baseline + no --feat → feature-init', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: true,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    expect(detectInitTrack(state, [])).toBe('feature-init');
  });

  it('healthy project should NOT be misrouted to brownfield-baseline', () => {
    // B6 반대: 已接入项目不应被误路由到 baseline
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: true,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).not.toBe('brownfield-baseline');
  });

  it('baseline-skipped brownfield should route to feature-init not brownfield-baseline', () => {
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: false,
      hasLegacyBaseline: false,
      baselineSkipped: true,  // user explicitly skipped baseline
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).toBe('feature-init');
  });

  it('should not re-create baseline if FSREQ-19700101-LEGACY-BASELINE already exists', () => {
    // hasLegacyBaseline=true → bypass brownfield-baseline track
    const state = {
      gitReady: true,
      specFirstDirExists: true,
      metaConfigExists: true,
      firstRuntimeHealthy: true,
      hasAnyFeature: true,
      hasLegacyBaseline: true,
      baselineSkipped: false,
      projectMaturity: 'brownfield' as const,
      discoveredPlatforms: [],
    };
    const track = detectInitTrack(state, []);
    expect(track).not.toBe('brownfield-baseline');
  });
});

// ─────────────────────────────────────────────
// Task 5: brownfield baseline preset tests
// ─────────────────────────────────────────────

describe('buildLegacyBaselinePreset - baseline preset', () => {
  it('should return the fixed legacy baseline featureId', () => {
    const preset = buildLegacyBaselinePreset();
    expect(preset.featureId).toBe('FSREQ-19700101-LEGACY-BASELINE');
  });

  it('should return mode I (Iteration)', () => {
    const preset = buildLegacyBaselinePreset();
    expect(preset.mode).toBe('I');
  });

  it('should return size M (Medium)', () => {
    const preset = buildLegacyBaselinePreset();
    expect(preset.size).toBe('M');
  });

  it('should return a non-empty title', () => {
    const preset = buildLegacyBaselinePreset();
    expect(typeof preset.title).toBe('string');
    expect(preset.title.length).toBeGreaterThan(0);
  });

  it('should return feat abbr LEGACY', () => {
    const preset = buildLegacyBaselinePreset();
    expect(preset.feat).toBe('LEGACY');
  });
});

// ─────────────────────────────────────────────
// Task 5: baseline prd/task_plan template content tests
// ─────────────────────────────────────────────

describe('baseline skeleton content - E3 template specialization', () => {
  it('[E3] prd skeleton for LEGACY-BASELINE includes 已上线能力摘要 section', async () => {
    const { skeletonPrdBaseline } = await import('../../src/core/process-engine/init.js');
    const content = skeletonPrdBaseline('FSREQ-19700101-LEGACY-BASELINE', '存量系统可分析基线');
    expect(content).toContain('已上线能力摘要');
  });

  it('[E3] task_plan skeleton for LEGACY-BASELINE includes 基线补齐 section', async () => {
    const { skeletonTaskPlanBaseline } = await import('../../src/core/process-engine/init.js');
    const content = skeletonTaskPlanBaseline('FSREQ-19700101-LEGACY-BASELINE', '存量系统可分析基线');
    expect(content).toContain('基线补齐');
  });
});
