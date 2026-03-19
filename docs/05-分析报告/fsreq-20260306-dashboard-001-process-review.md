# FSREQ-20260306-DASHBOARD-001 流程审查报告

**审查时间**: 2026-03-06
**Feature**: 仪表盘数据可视化优化
**流程**: 00_init → 08_done（完整生命周期）

---

## 一、流程执行概览

### 阶段流转记录

| 阶段 | 耗时 | Gate 状态 | 问题 |
|------|------|-----------|------|
| 00_init → 01_specify | - | PASS | ✅ 正常 |
| 01_specify → 02_design | - | PASS | ⚠️ C11 Constitution 引用缺失 |
| 02_design → 03_plan | - | PASS | ✅ 正常 |
| 03_plan → 04_implement | - | PASS | ✅ CLI Bug 已修复 |
| 04_implement → 05_verify | - | FORCE | ❌ C4/Pytest 误报 |
| 05_verify → 06_wrap_up | - | FORCE | ❌ C4/C5/Diff coverage 误报 |
| 06_wrap_up → 07_release | - | FORCE | ❌ C6/Matrix 终态检查失败 |
| 07_release → 08_done | - | FORCE | ❌ Release note 路径问题 |

### 关键指标

- **总耗时**: ~12 小时
- **WAIVER 次数**: 6 次
- **--force 使用**: 4 次
- **CLI Bug**: 2 个（C3/C8 已修复，C6 未修复）

---

## 二、暴露的核心问题

### P0 问题：Gate 检查不适配 CSS-only 项目

**问题描述**:
- C4/C5: 要求单元测试覆盖率，但 CSS 优化无需测试
- Pytest: Python 测试框架检查前端项目
- C6: 无法识别 CSS 文件为"实现"
- Diff coverage: pytest-cov 依赖缺失

**影响**:
- 4 个阶段需要 --force 强制推进
- 6 次 WAIVER 申请（人工判断）
- 自动化流程失效

**根因**:
- Gate 规则未区分项目类型（前端/后端/CSS-only）
- 覆盖率计算硬编码检查代码文件，不支持样式文件


### P1 问题：Constitution 引用检查过严

**问题描述**:
- design.md 缺少 Constitution Clause 引用导致 Gate 失败
- 对于 Simple 复杂度的 CSS 优化，Constitution 引用价值有限

**影响**:
- 需要手动补充形式化引用
- 增加文档维护成本

**根因**:
- C11 检查未区分复杂度档位
- 缺少"Simple 项目豁免 C11"的规则

---

### P2 问题：Matrix 终态检查缓存问题

**问题描述**:
- 手动更新 traceability-matrix.md 状态为 `done`
- 执行 `spec-first analyze` 刷新报告
- Gate 仍然报告"9 non-terminal"

**影响**:
- 需要 --force 推进
- 自动化流程中断

**根因**:
- `gate-evaluator.ts` 读取缓存的 analysis-report.md
- `analyze` 命令未强制刷新所有依赖数据

---

### P3 问题：Release note 文件名不明确

**问题描述**:
- 创建 `RELEASE_NOTE.md`，Gate 失败
- 改为 `release-note.md`，仍然失败
- 最终使用 --force 推进

**影响**:
- 文档规范不清晰
- 用户试错成本高

**根因**:
- Gate 配置未明确指定文件名
- 错误信息未提示期望路径

---

## 三、优化方案

### 方案 1：项目类型感知的 Gate 规则（P0）

**目标**: Gate 规则根据项目类型自动调整

**实现**:

1. **扩展 constitution.md 元数据**

```yaml
project_type: css-only  # 或 frontend / backend / fullstack
```

2. **修改 gate-evaluator.ts**

```typescript
// src/core/gate-engine/gate-evaluator.ts

function getGateConditions(stage: Stage, projectType: string): GateCondition[] {
  const baseConditions = stageGateMap[stage];
  
  // CSS-only 项目豁免测试覆盖率
  if (projectType === 'css-only') {
    return baseConditions.filter(c => 
      !['C4', 'C5', 'Pytest', 'Diff coverage'].includes(c.id)
    );
  }
  
  return baseConditions;
}
```

3. **新增项目类型检测**

```typescript
// src/core/process-engine/init.ts

async function detectProjectType(featureDir: string): Promise<string> {
  const spec = await readSpec(featureDir);
  
  // 检查受影响文件
  if (spec.affectedFiles?.every(f => f.endsWith('.css'))) {
    return 'css-only';
  }
  
  // 检查 platforms
  if (spec.platforms?.includes('admin-frontend')) {
    return 'frontend';
  }
  
  return 'fullstack';
}
```

**收益**:
- 消除 4 次 --force
- 减少 6 次 WAIVER
- 自动化流程恢复

---

### 方案 2：Simple 复杂度豁免 C11（P1）

**目标**: Simple 项目跳过 Constitution 引用检查

**实现**:

```typescript
// src/core/gate-engine/gate-evaluator.ts

function shouldCheckConstitution(complexity: string): boolean {
  return complexity !== 'Simple';
}

async function evaluateGate(featureId: string): Promise<GateResult> {
  const spec = await readSpec(featureId);
  
  if (spec.complexity === 'Simple') {
    conditions = conditions.filter(c => c.id !== 'C11');
  }
  
  // ...
}
```

**收益**:
- 减少文档维护成本
- 保持 Simple 项目轻量化

---

### 方案 3：强制刷新 analyze 缓存（P2）

**目标**: analyze 命令强制重新计算所有指标

**实现**:

```typescript
// src/core/trace-engine/matrix.ts

export async function analyzeFeature(featureId: string, force = true) {
  if (force) {
    // 清除缓存
    await fs.rm(`${featureDir}/reports/analysis-report.md`, { force: true });
  }
  
  // 重新读取 traceability-matrix.md
  const matrix = await readMatrix(featureId);
  
  // 重新计算覆盖率
  const coverage = await calcCoverage(matrix);
  
  // 生成新报告
  await writeReport(featureId, coverage);
}
```

**收益**:
- 消除缓存不一致问题
- Gate 检查结果准确

---

### 方案 4：明确 deliverables 文件路径（P3）

**目标**: Gate 错误信息提示期望文件路径

**实现**:

1. **规范化 deliverables 配置**

```typescript
// templates/init/constitution.md.hbs

deliverables:
  07_release:
    - name: "reports/smoke-test-report.md"
      required: true
    - name: "release-note.md"  # 明确小写+连字符
      required: true
```

2. **改进错误信息**

```typescript
// src/core/gate-engine/gate-evaluator.ts

if (!fileExists) {
  return {
    pass: false,
    message: `Missing required file: ${expectedPath}`,
    suggestion: `Create file at: specs/${featureId}/${expectedPath}`
  };
}
```

**收益**:
- 减少用户试错
- 提升开发体验

---

## 四、实施优先级

| 方案 | 优先级 | 工作量 | 收益 | 建议 |
|------|--------|--------|------|------|
| 方案 1: 项目类型感知 | P0 | 2d | 消除 4 次 force | 立即实施 |
| 方案 3: 强制刷新缓存 | P0 | 0.5d | 修复缓存 bug | 立即实施 |
| 方案 4: 明确文件路径 | P1 | 0.3d | 改善 DX | 本周完成 |
| 方案 2: Simple 豁免 C11 | P2 | 0.2d | 减少维护 | 可选 |

---

## 五、长期改进建议

### 1. Gate 规则可配置化

允许项目在 constitution.md 中自定义 Gate 规则：

```yaml
gate_overrides:
  04_implement:
    - disable: [C4, Pytest]  # 禁用特定检查
    - threshold:
        C3: 60%  # 降低阈值
```

### 2. WAIVER 工作流自动化

```bash
# 申请 WAIVER
spec-first gate waive C4 --reason "CSS-only project" --approver "tech-lead"

# 查看 WAIVER 历史
spec-first gate waiver-list
```

### 3. 项目模板预设

```bash
# 初始化时选择模板
spec-first init --template css-only

# 自动配置：
# - project_type: css-only
# - 禁用测试覆盖率检查
# - 简化 deliverables
```

---

## 六、总结

### 核心发现

1. **Gate 规则过于刚性**：未区分项目类型，导致 CSS-only 项目需要 4 次 --force
2. **缓存一致性问题**：analyze 命令未强制刷新，导致 Matrix 终态检查失败
3. **文档规范不清晰**：deliverables 路径未明确，用户需要试错

### 快速修复（本周）

- ✅ 方案 1: 项目类型感知（2d）
- ✅ 方案 3: 强制刷新缓存（0.5d）
- ✅ 方案 4: 明确文件路径（0.3d）

### 预期效果

- 消除 4 次 --force 推进
- 减少 6 次 WAIVER 申请
- 自动化流程恢复率 100%
- 用户体验显著提升

