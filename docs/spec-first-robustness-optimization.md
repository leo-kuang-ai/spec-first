# Spec-First 流程健壮性优化技术方案

**文档版本**: v1.0
**创建日期**: 2026-03-05
**作者**: Claude
**状态**: Draft

---

## 1. 背景与动机

### 1.1 问题来源

在 FSREQ-20260305-SPECOPT-001 的完整执行过程中，识别出多个影响流程健壮性的卡点：

| 问题 | 影响 | 发现阶段 |
|------|------|----------|
| PRD 格式不符合规范 | 测试失败，需返工 | 测试执行 |
| 追溯矩阵被 sed/awk 误删 | C4 从 93.3% 降到 66.7% | 手动编辑后 |
| contract:check 脚本缺失 | Gate 检查失败 | 06_wrap_up |
| UI 数据不同步 | 显示陈旧数据 | 用户反馈 |
| --json 输出格式错误 | server.js 解析失败 | 调试排查 |
| 矩阵状态未更新 | 62 个条目仍为 Planned | 06_wrap_up |
| 发布产物路径错误 | Gate 检查失败 | 07_release |

### 1.2 根本原因分析

**后验证而非前预防**
- 格式错误、依赖缺失等问题要到 Gate 检查才发现
- 问题发现时间晚，返工成本高

**手动操作过多**
- 格式规范依赖人工记忆
- 状态更新需要手动批量操作
- 矩阵编辑容易误操作

**数据一致性保障缺失**
- CLI 输出格式与 UI 期望不匹配
- 追溯矩阵缺乏保护机制
- 状态流转规则不清晰

### 1.3 优化目标

- **减少 70%** 的格式/路径错误
- **减少 80%** 的手动状态更新操作
- 问题发现时间从"阶段末尾"提前到"产物生成时"
- 数据损坏风险降低 **90%**

---

## 2. 优化方案总览

### 2.1 优先级分级

| 优先级 | 数量 | 投入 | 收益 | 实施周期 |
|--------|------|------|------|----------|
| P0 | 3 项 | 1-2 周 | 立即见效 | 短期 |
| P1 | 6 项 | 4-6 周 | 显著提升 | 中期 |
| P2 | 4 项 | 按需 | 锦上添花 | 长期 |

### 2.2 优化维度

```
格式规范 ──┐
依赖检查 ──┼──> 前置预防
输出契约 ──┘

状态流转 ──┐
矩阵保护 ──┼──> 自动化
增量检查 ──┘

智能提示 ──┐
回滚恢复 ──┼──> 用户体验
可观测性 ──┘

自愈机制 ──┐
并行执行 ──┼──> 高级特性
路径规范 ──┘
```

---
## 3. P0 优化方案（必须做）

### 3.1 格式校验前置化

**问题**: PRD 章节格式、ID 格式、文件路径等错误要到测试或 Gate 检查才发现

**方案**: 新增 `spec-first validate format` 命令

**实现要点**:
```typescript
// src/cli/commands/validate.ts
export function handleValidate(args: string[]): number {
  const sub = args[0];
  const featureId = args[1];
  
  switch (sub) {
    case 'format': return validateFormat(featureId);
    case 'matrix': return validateMatrix(featureId);
    case 'all': return validateAll(featureId);
  }
}

function validateFormat(featureId: string): number {
  const checks = [
    validatePrdFormat,      // 章节编号格式
    validateIdFormat,       // ID 格式（无连字符）
    validateFilePaths,      // 产物路径
    validateRequiredFields, // 必需字段
  ];
  
  const results = checks.map(check => check(featureId));
  return results.every(r => r.pass) ? 0 : 1;
}
```

**集成点**:
- `spec-first:spec` P4 落盘后自动调用
- `spec-first:design` P4 落盘后自动调用
- `spec-first:task` P4 落盘后自动调用

**收益**: 产物生成时立即发现错误，避免后期返工

---

### 3.2 输出格式契约化 ✅

**问题**: `metrics coverage --json` 返回格式化文本而非 JSON

**方案**: 所有 CLI 命令的 --json 输出必须返回真正的 JSON

**已完成**: v0.5.78 已修复 metrics coverage 命令

**后续工作**:
```typescript
// tests/contract/cli-output.test.ts
describe('CLI Output Contract', () => {
  it('metrics coverage --json should return valid JSON', () => {
    const output = execSync('spec-first metrics coverage FEAT-001 --json');
    expect(() => JSON.parse(output)).not.toThrow();
  });
  
  it('gate check --json should return valid JSON', () => {
    const output = execSync('spec-first gate check FEAT-001 --json');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('conditions');
  });
});
```

**收益**: 消除 CLI 与 UI 数据同步问题

---

### 3.3 依赖检查自动化

**问题**: contract:check 脚本缺失、发布产物路径错误等要到 Gate 检查才发现

**方案**: stage advance 前自动检查下一阶段依赖项

**实现要点**:
```typescript
// src/core/process-engine/dependency-checker.ts
export interface StageDependency {
  stage: Stage;
  npmScripts?: string[];
  files?: string[];
  envVars?: string[];
}

const STAGE_DEPENDENCIES: StageDependency[] = [
  {
    stage: Stage.DESIGN,
    files: ['specs/{featureId}/prd.md', 'specs/{featureId}/spec.md'],
  },
  {
    stage: Stage.IMPLEMENT,
    npmScripts: ['test', 'build', 'contract:check'],
  },
  {
    stage: Stage.RELEASE,
    files: ['specs/{featureId}/reports/smoke-test-report.md'],
  },
];

export function checkDependencies(
  featureId: string,
  targetStage: Stage,
  projectRoot: string
): DependencyCheckResult {
  const deps = STAGE_DEPENDENCIES.find(d => d.stage === targetStage);
  if (!deps) return { pass: true, missing: [] };
  
  const missing: string[] = [];
  
  // 检查 npm scripts
  if (deps.npmScripts) {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    for (const script of deps.npmScripts) {
      if (!pkg.scripts?.[script]) {
        missing.push(`npm script: ${script}`);
      }
    }
  }
  
  // 检查文件
  if (deps.files) {
    for (const file of deps.files) {
      const path = file.replace('{featureId}', featureId);
      if (!existsSync(join(projectRoot, path))) {
        missing.push(`file: ${path}`);
      }
    }
  }
  
  return { pass: missing.length === 0, missing };
}
```

**集成点**:
```typescript
// src/core/process-engine/stage-manager.ts
export function advanceStage(featureId: string, projectRoot: string): void {
  const current = getCurrentStage(featureId, projectRoot);
  const next = getNextStage(current);
  
  // 前置依赖检查
  const depCheck = checkDependencies(featureId, next, projectRoot);
  if (!depCheck.pass) {
    console.error('依赖检查失败，缺失项:');
    depCheck.missing.forEach(m => console.error(`  - ${m}`));
    throw new Error('Dependency check failed');
  }
  
  // 执行推进
  // ...
}
```

**收益**: 避免执行到后期才发现阻塞

---
## 4. P1 优化方案（应该做）

### 4.1 状态自动流转

**问题**: 62 个矩阵条目需要手动从 Planned 改为 Accepted

**方案**: TASK 完成后自动更新矩阵状态

**实现要点**:
```typescript
// src/core/trace-engine/auto-status.ts
export function autoUpdateStatus(
  featureId: string,
  taskId: string,
  projectRoot: string
): void {
  // 检查 TASK 是否完成
  const completed = checkTaskCompleted(taskId, projectRoot);
  if (!completed) return;
  
  // 更新矩阵状态
  updateMatrixStatus(featureId, taskId, 'Accepted', projectRoot);
  
  // 级联更新 upstream
  const upstream = getUpstream(featureId, taskId, projectRoot);
  upstream.forEach(id => {
    if (allDownstreamAccepted(featureId, id, projectRoot)) {
      updateMatrixStatus(featureId, id, 'Accepted', projectRoot);
    }
  });
}

function checkTaskCompleted(taskId: string, projectRoot: string): boolean {
  // 检查条件：
  // 1. 相关测试通过
  // 2. Git commit 包含 TASK ID
  // 3. Code review 通过（如果有）
  return testsPassed && commitExists && reviewPassed;
}
```

**触发时机**:
- Git commit hook (commit-msg)
- 测试通过后 (post-test hook)
- 手动触发: `spec-first matrix auto-update <featureId>`

**收益**: 减少 80% 的手动状态更新操作

---

### 4.2 追溯矩阵保护机制

**问题**: sed/awk 误删导致矩阵损坏

**方案**: 禁止直接编辑，提供专用 CLI 命令

**实现要点**:
```typescript
// src/cli/commands/matrix.ts
export function handleMatrix(args: string[]): number {
  const sub = args[0];
  
  switch (sub) {
    case 'update': return updateMatrixEntry(args.slice(1));
    case 'add': return addMatrixEntry(args.slice(1));
    case 'remove': return removeMatrixEntry(args.slice(1));
    case 'backup': return backupMatrix(args.slice(1));
    case 'restore': return restoreMatrix(args.slice(1));
  }
}

function updateMatrixEntry(args: string[]): number {
  const featureId = args[0];
  const id = args[1];
  const field = args[2]; // status, title, upstream, downstream
  const value = args[3];
  
  // 自动备份
  backupMatrix([featureId]);
  
  // 更新矩阵
  const matrix = loadMatrix(featureId);
  const entry = matrix.find(e => e.id === id);
  if (!entry) {
    console.error(`未找到条目: ${id}`);
    return ExitCode.VALIDATION_ERROR;
  }
  
  entry[field] = value;
  saveMatrix(featureId, matrix);
  
  console.log(`已更新 ${id}.${field} = ${value}`);
  return ExitCode.SUCCESS;
}
```

**文件锁机制**:
```typescript
// src/core/trace-engine/matrix-lock.ts
export function withMatrixLock<T>(
  featureId: string,
  fn: () => T
): T {
  const lockFile = join('specs', featureId, '.matrix.lock');
  
  if (existsSync(lockFile)) {
    throw new Error('Matrix is locked by another process');
  }
  
  writeFileSync(lockFile, process.pid.toString());
  try {
    return fn();
  } finally {
    unlinkSync(lockFile);
  }
}
```

**收益**: 防止误操作导致数据损坏

---

### 4.3 Gate 检查增量化

**问题**: Gate 检查是全量的，问题积累到阶段末尾

**方案**: 每完成一个 TASK 就检查相关 Gate 条件

**实现要点**:
```typescript
// src/core/gate-engine/incremental-gate.ts
export function checkIncremental(
  featureId: string,
  taskId: string,
  projectRoot: string
): GateResult {
  // 获取 TASK 相关的 FR
  const relatedFRs = getUpstreamFRs(featureId, taskId, projectRoot);
  
  // 只检查相关的 Gate 条件
  const conditions = getConditions(getCurrentStage(featureId, projectRoot))
    .filter(c => isRelatedToFRs(c, relatedFRs));
  
  return evaluateConditions(conditions, featureId, projectRoot);
}
```

**集成点**:
- TASK 完成后自动触发
- 提供命令: `spec-first gate check --incremental --task TASK-001`

**收益**: 问题早发现早修复

---
### 4.4 健壮性测试套件

**问题**: 缺乏对边界情况和错误场景的测试

**方案**: 新增 chaos testing 套件

**实现要点**:
```typescript
// tests/chaos/format-errors.test.ts
describe('Chaos: Format Errors', () => {
  it('should handle PRD with wrong chapter format', () => {
    const prd = '## 业务目标\n...'; // 缺少编号
    const result = validatePrd(prd);
    expect(result.errors).toContain('章节格式错误');
  });
  
  it('should handle ID with hyphens', () => {
    const id = 'FR-SPEC-OPT-001'; // 包含连字符
    const result = validateId(id);
    expect(result.normalized).toBe('FR-SPECOPT-001');
  });
});

// tests/chaos/matrix-corruption.test.ts
describe('Chaos: Matrix Corruption', () => {
  it('should detect broken traceability chain', () => {
    const matrix = [
      { id: 'FR-001', upstream: 'REQ-001', downstream: '' },
      { id: 'TASK-001', upstream: 'FR-999', downstream: '' }, // 断链
    ];
    const result = checkMatrix(matrix);
    expect(result.brokenChains).toHaveLength(1);
  });
});
```

**收益**: 提前发现边界情况，提升容错能力

---

### 4.5 智能提示系统

**问题**: 用户不清楚下一步该做什么

**方案**: 提供智能提示和推荐操作

**实现要点**:
```typescript
// src/cli/commands/next.ts
export function handleNext(args: string[]): number {
  const featureId = args[0];
  const stage = getCurrentStage(featureId);
  const suggestions = generateSuggestions(featureId, stage);
  
  console.log(`当前阶段: ${stage}\n`);
  console.log('建议操作:');
  suggestions.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.description}`);
    console.log(`     命令: ${s.command}`);
  });
  
  return ExitCode.SUCCESS;
}

function generateSuggestions(featureId: string, stage: Stage): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // 检查 Gate 条件
  const gateResult = evaluateGate(featureId);
  if (gateResult.status === 'FAIL') {
    gateResult.conditions
      .filter(c => c.status === 'FAIL')
      .forEach(c => {
        suggestions.push({
          description: `修复 Gate 条件: ${c.description}`,
          command: c.fixCommand || 'manual',
        });
      });
  }
  
  // 检查覆盖率
  const coverage = getCoverage(featureId);
  if (coverage.C4 < 1.0) {
    suggestions.push({
      description: '补充测试用例提升 C4 覆盖率',
      command: '/spec-first:test',
    });
  }
  
  return suggestions;
}
```

**收益**: 降低认知负担，减少试错成本

---

### 4.6 回滚与恢复机制

**问题**: 操作失误后难以恢复

**方案**: 自动创建检查点，支持回滚

**实现要点**:
```typescript
// src/core/checkpoint/manager.ts
export function createCheckpoint(
  featureId: string,
  operation: string,
  projectRoot: string
): string {
  const checkpointId = `${Date.now()}-${operation}`;
  const checkpointDir = join(projectRoot, 'specs', featureId, '.checkpoints', checkpointId);
  
  mkdirSync(checkpointDir, { recursive: true });
  
  // 备份关键文件
  const files = [
    'traceability-matrix.md',
    'stage-state.json',
    'spec.md',
    'design.md',
  ];
  
  files.forEach(file => {
    const src = join(projectRoot, 'specs', featureId, file);
    if (existsSync(src)) {
      copyFileSync(src, join(checkpointDir, file));
    }
  });
  
  return checkpointId;
}

export function rollback(
  featureId: string,
  checkpointId: string,
  projectRoot: string
): void {
  const checkpointDir = join(projectRoot, 'specs', featureId, '.checkpoints', checkpointId);
  
  if (!existsSync(checkpointDir)) {
    throw new Error(`Checkpoint not found: ${checkpointId}`);
  }
  
  // 恢复文件
  readdirSync(checkpointDir).forEach(file => {
    const src = join(checkpointDir, file);
    const dest = join(projectRoot, 'specs', featureId, file);
    copyFileSync(src, dest);
  });
  
  console.log(`已回滚到检查点: ${checkpointId}`);
}
```

**收益**: 操作失误后可快速恢复

---
## 5. P2 优化方案（可以做）

### 5.1 产物路径规范化

**方案**: 提供 artifact init 命令自动创建标准路径的产物骨架

```typescript
// src/cli/commands/artifact.ts
export function handleArtifact(args: string[]): number {
  const sub = args[0];
  const type = args[1];
  const featureId = args[2];
  
  if (sub === 'init') {
    return initArtifact(type, featureId);
  }
}

function initArtifact(type: string, featureId: string): number {
  const templates = {
    'smoke-test': 'specs/{featureId}/reports/smoke-test-report.md',
    'release-note': 'specs/{featureId}/reports/release-note.md',
    'prd': 'specs/{featureId}/prd.md',
  };
  
  const path = templates[type]?.replace('{featureId}', featureId);
  if (!path) {
    console.error(`未知产物类型: ${type}`);
    return ExitCode.VALIDATION_ERROR;
  }
  
  // 创建骨架文件
  const template = loadTemplate(type);
  writeFileSync(path, template);
  console.log(`已创建: ${path}`);
  return ExitCode.SUCCESS;
}
```

---

### 5.2 自愈机制

**方案**: 检测到数据不一致时自动修复

```typescript
// src/cli/commands/doctor.ts
export function handleDoctor(args: string[]): number {
  const featureId = args[0];
  const fix = args.includes('--fix');
  
  const issues = diagnose(featureId);
  
  if (issues.length === 0) {
    console.log('✅ 未检测到问题');
    return ExitCode.SUCCESS;
  }
  
  console.log(`检测到 ${issues.length} 个问题:\n`);
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.description}`);
    if (issue.fixable) {
      console.log(`   修复: ${issue.fixCommand}`);
    }
  });
  
  if (fix) {
    issues.filter(i => i.fixable).forEach(i => i.fix());
    console.log('\n✅ 已自动修复');
  }
  
  return ExitCode.SUCCESS;
}
```

---

### 5.3 可观测性增强

**方案**: 详细日志和诊断信息

```typescript
// src/shared/logger.ts
export class Logger {
  private logFile: string;
  
  trace(operation: string, data: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      operation,
      data,
    };
    appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
  }
}

// 使用示例
logger.trace('gate-check', {
  featureId: 'FEAT-001',
  stage: '06_wrap_up',
  result: 'FAIL',
  failedConditions: ['C6', 'G-WRAP-02'],
});
```

---

### 5.4 并行执行优化

**方案**: 独立 TASK 可以并行实现

```typescript
// src/core/ai-orchestrator/parallel.ts
export function executeParallel(
  tasks: Task[],
  featureId: string
): Promise<TaskResult[]> {
  const graph = buildDependencyGraph(tasks);
  const batches = topologicalSort(graph);
  
  const results: TaskResult[] = [];
  
  for (const batch of batches) {
    // 批次内并行执行
    const batchResults = await Promise.all(
      batch.map(task => executeTask(task, featureId))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---
## 6. 实施路线图

### 6.1 短期（1-2 周）

**目标**: 完成 P0 优化，立即见效

| 任务 | 工作量 | 负责人 | 产出 |
|------|--------|--------|------|
| 格式校验前置化 | 3 天 | Dev | validate format 命令 |
| 依赖检查自动化 | 2 天 | Dev | dependency-checker 模块 |
| 输出格式测试 | 1 天 | QA | contract test 套件 |

**里程碑**: 格式错误和依赖缺失在产物生成时立即发现

---

### 6.2 中期（4-6 周）

**目标**: 完成 P1 核心项，显著提升体验

| 任务 | 工作量 | 负责人 | 产出 |
|------|--------|--------|------|
| 状态自动流转 | 5 天 | Dev | auto-status 模块 |
| 追溯矩阵保护 | 3 天 | Dev | matrix 命令增强 |
| Gate 检查增量化 | 4 天 | Dev | incremental-gate 模块 |
| 健壮性测试套件 | 5 天 | QA | chaos testing |
| 智能提示系统 | 3 天 | Dev | next 命令 |
| 回滚与恢复机制 | 4 天 | Dev | checkpoint 模块 |

**里程碑**: 手动操作减少 80%，问题发现时间提前

---

### 6.3 长期（按需）

**目标**: 根据用户反馈决定 P2 项

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 产物路径规范化 | 2 天 | 按需 |
| 自愈机制 | 5 天 | 按需 |
| 可观测性增强 | 3 天 | 按需 |
| 并行执行优化 | 7 天 | 按需 |

---

## 7. 风险与缓解

### 7.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 格式校验规则过严 | 阻塞正常流程 | 中 | 提供 --skip-validation 选项 |
| 状态自动流转误判 | 错误更新状态 | 低 | 提供手动回滚机制 |
| 矩阵锁冲突 | 并发操作失败 | 低 | 超时自动释放锁 |

### 7.2 兼容性风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 旧 Feature 格式不兼容 | 校验失败 | 提供迁移工具 |
| 新命令学习成本 | 用户抵触 | 保留旧命令，逐步迁移 |

---

## 8. 成功指标

### 8.1 量化指标

| 指标 | 当前 | 目标 | 测量方式 |
|------|------|------|----------|
| 格式错误率 | 30% | <10% | 每周统计 Gate 失败原因 |
| 手动状态更新次数 | 62 次/Feature | <12 次/Feature | 统计 matrix update 命令调用 |
| 问题发现时间 | 阶段末尾 | 产物生成时 | 统计错误发现阶段分布 |
| 数据损坏事件 | 1 次/月 | 0 次/月 | 统计矩阵恢复次数 |

### 8.2 用户体验指标

- 新用户上手时间: 2 小时 → 1 小时
- 流程执行成功率: 70% → 95%
- 用户满意度: 3.5/5 → 4.5/5

---

## 9. 总结

### 9.1 核心价值

本优化方案通过"前置预防 + 自动化 + 用户体验"三个维度，系统性提升 spec-first 流程的健壮性：

1. **前置预防**: 格式校验、依赖检查在产物生成时立即执行
2. **自动化**: 状态流转、矩阵保护、增量检查减少人工操作
3. **用户体验**: 智能提示、回滚恢复、可观测性降低使用门槛

### 9.2 预期收益

- **效率提升**: 减少 70% 的返工时间
- **质量提升**: 减少 90% 的数据损坏风险
- **体验提升**: 减少 80% 的手动操作

### 9.3 下一步行动

1. 评审本方案，确认优先级和工作量估算
2. 创建 Feature: FSREQ-20260305-ROBUST-001
3. 启动 P0 优化实施（1-2 周）
4. 收集用户反馈，调整 P1/P2 优先级

---

**文档结束**
