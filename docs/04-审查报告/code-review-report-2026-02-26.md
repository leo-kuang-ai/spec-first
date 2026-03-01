# Spec-First 代码审查报告

> **审查日期**: 2026-02-26
> **审查范围**: 整个代码库 (67个TypeScript源文件)
> **审查方式**: 5个并发Agent (安全/性能/质量/最佳实践/测试覆盖)
> **审查工具**: code-reviewer, frontend-code-review, spec-first:code-review

---

## 📊 审查概览

| 维度 | Agent | 问题总数 | Critical | High | Medium | Low |
|------|-------|----------|----------|------|--------|-----|
| 🛡️ 安全漏洞 | Agent 1 | 17 | 1 | 1 | 5 | 10 |
| ⚡ 性能瓶颈 | Agent 2 | 14 | 0 | 2 | 7 | 5 |
| 📊 代码质量 | Agent 3 | 20 | 0 | 4 | 13 | 3 |
| 🎯 最佳实践 | Agent 4 | 25+ | 0 | 0 | 15+ | 10+ |
| ✅ 测试覆盖 | Agent 5 | 4模块缺失 | - | - | - | - |
| **总计** | - | **76+** | **1** | **7** | **40+** | **28+** |

---

## 🔴 Critical 问题（必须修复）

### 1. 命令注入漏洞

**文件**: `src/core/gate-engine/gate-evaluator.ts:440`

```typescript
const stdout = execSync(command, { cwd, encoding: 'utf-8', timeout: 120_000 });
```

**问题描述**:
- `execSync(command, ...)` 直接执行来自 `state.mergedRules?.gateConditions` 的命令字符串
- 未进行任何验证或转义
- 如果配置文件被恶意篡改，可能导致任意命令执行

**风险等级**: Critical

**修复建议**:
1. 对 `command` 参数进行严格白名单校验
2. 使用 `execFileSync` 配合参数数组形式执行
3. 限制可执行命令的来源和范围
4. 添加命令执行日志审计

---

## 🟠 High 问题（优先修复）

### 安全问题

#### 2. 路径遍历风险

**文件**: `src/shared/fs-utils.ts:8-44`

**问题描述**:
- `readJson`, `writeJson`, `readMarkdown`, `writeMarkdown` 等函数直接使用传入的 `path` 参数
- 未验证路径是否包含 `..` 或指向预期目录外
- 调用方如传入用户可控路径，可能导致任意文件读写

**修复建议**:
```typescript
import { resolve, normalize } from 'node:path';

function validatePath(baseDir: string, targetPath: string): string {
  const resolved = resolve(baseDir, targetPath);
  if (!resolved.startsWith(baseDir)) {
    throw new Error(`Path traversal detected: ${targetPath}`);
  }
  return resolved;
}
```

### 性能问题

#### 3. 全同步I/O阻塞

**文件**: `src/shared/fs-utils.ts:5-44`

**问题描述**:
- 所有文件操作都使用同步API（`readFileSync`、`writeFileSync`、`existsSync`）
- 在CLI场景可接受，但若被频繁调用会阻塞事件循环
- 多个文件顺序读取时无法并行

**修复建议**:
1. 提供异步版本API（如 `readJsonAsync`）
2. 在批处理场景使用 `Promise.all` 并行化

#### 4. 阻塞式命令执行

**文件**: `src/core/gate-engine/gate-evaluator.ts:438-446`

```typescript
const stdout = execSync(command, { cwd, timeout: 120_000, ... });
```

**问题描述**:
- 120秒的超时会完全阻塞Node.js主线程
- 用户体验差，无进度反馈

**修复建议**:
1. 改用 `spawn` 异步执行
2. 设置更短的超时（如30秒）
3. 添加进度反馈机制

### 代码质量问题

#### 5. init函数过长

**文件**: `src/core/process-engine/init.ts:323-452`

**问题描述**:
- `init` 函数过长（约130行）
- 包含多个职责：参数校验、目录创建、锁机制、状态写入
- 临时目录创建和提交逻辑嵌套过深（4层嵌套）

**修复建议**:
```typescript
// 拆分为多个职责单一的函数
function init(params: InitParams): InitResult {
  const validated = validateParams(params);
  const dirs = createDirectories(validated);
  const feature = withRegistryLock(() => createFeatureDir(dirs));
  writeState(feature);
  return { featureId: feature.id };
}
```

#### 6. handleInit函数过长

**文件**: `src/cli/commands/init.ts:21-150`

**问题描述**:
- `handleInit` 函数过长（约130行）
- 包含参数解析、交互式输入、验证、执行等多个职责

**修复建议**:
- 拆分为 `parseArgs`、`validateArgs`、`executeInit` 等函数

#### 7. GATE_CONDITIONS定义冗长

**文件**: `src/core/gate-engine/gate-evaluator.ts:66-256`

**问题描述**:
- 每个阶段的条件定义模式高度相似
- 新增阶段需修改此对象，违反开闭原则

**修复建议**:
```typescript
// 使用注册机制
const conditionRegistry = new Map<Stage, GateConditionDef[]>();

function registerCondition(stage: Stage, condition: GateConditionDef) {
  conditionRegistry.set(stage, [...(conditionRegistry.get(stage) ?? []), condition]);
}
```

#### 8. withRegistryLock圈复杂度高

**文件**: `src/core/process-engine/init.ts:101-130`

**问题描述**:
- 包含多层嵌套 try-catch 和 while(true) 循环
- 圈复杂度较高

**修复建议**:
- 拆分为更小的辅助函数
- 使用早返回（early return）减少嵌套

---

## 🟡 Medium 问题（计划修复）

### 安全问题

| # | 文件 | 行号 | 问题 | 建议 |
|---|------|------|------|------|
| 9 | `host-bootstrap.ts` | 375-378 | git clone URL需完整性校验 | 添加checksum验证 |
| 10 | `host-bootstrap.ts` | 524-527 | 命令参数需白名单 | 添加命令白名单校验 |
| 11 | `hook-installer.ts` | 43-60 | projectRoot路径需验证 | 验证路径在预期范围内 |
| 12 | `feature.ts` | 88-106 | featureId需格式验证 | 使用正则 `^[A-Z0-9-]+$` |
| 13 | `session-hook.ts` | 28-55 | shell命令转义边缘风险 | 减少shell嵌套层级 |

### 性能问题

| # | 文件 | 行号 | 问题 | 建议 |
|---|------|------|------|------|
| 14 | `matrix.ts` | 44-56 | O(n²)算法 | 预先构建索引Map降为O(n) |
| 15 | `coverage.ts` | 22-26 | 重复遍历 | 一次性构建覆盖索引 |
| 16 | `gate-evaluator.ts` | 417-435 | 矩阵数据重复解析 | 复用已解析的矩阵数据 |
| 17 | `renderer.ts` | 47-48 | 无模板缓存 | 添加模板编译缓存 |
| 18 | `context-pack.ts` | 155-172 | 重复文件哈希计算 | 缓存文件哈希或mtime检测 |
| 19 | `host-bootstrap.ts` | 374-393 | git clone耗时 | 提供离线模式 |
| 20 | `hard-gate.ts` | 83-112 | execSync阻塞 | 缓存git分支结果 |

### 代码质量问题

| # | 文件 | 行号 | 问题 | 建议 |
|---|------|------|------|------|
| 21 | `advance.ts` | 88-174 | 重复pilot_mode检查 | 提取handleGateError辅助函数 |
| 22 | `layer-merger.ts` | 91-140 | 重复deliverables初始化 | 创建ensureDeliverableArray辅助函数 |
| 23 | `doctor.ts` | 181,184 | any类型使用 | 定义具体类型接口 |
| 24 | `uninstall.ts` | 125-126 | any类型使用 | 定义SessionHookItem类型 |
| 25 | `session-hook.ts` | 91-92 | any类型使用 | 定义具体类型接口 |
| 26 | `config-schema.ts` | 80-119 | 重复类型检查模式 | 使用更通用的合并策略 |

### 最佳实践问题

| # | 文件 | 问题 | 建议 |
|---|------|------|------|
| 27 | `hard-gate.ts` | 职责过多(270+行) | 拆分为HardGateEvaluator + HighRiskAssessor + GitBranchDetector |
| 28 | `catchup.ts` | 职责过多(~300行) | 拆分为CatchupService + FiveQuestionsExtractor + ConcurrencyLock |
| 29 | `gate-evaluator.ts` | 职责过多(~450行) | 拆分为GateConditionsRegistry + GateEvaluator + WaiverMatcher |
| 30 | `ai-runtime-hook.ts` | 职责过多(330+行) | 拆分为HookConfigFactory + HookScriptManager + HookRegistrar |
| 31 | `ai-runtime-hook.ts` | 硬编码Shell脚本 | 外置为独立.sh文件 |
| 32 | `context-slicing.ts` | 配置硬编码 | 从config-schema.ts统一读取 |
| 33 | `catchup.ts` | 并发锁无清理 | 使用LRU缓存或定期清理 |
| 34 | 多处 | 模块级缓存 | 考虑依赖注入 |

---

## 🟢 Low 问题（持续改进）

| # | 文件 | 问题 | 建议 |
|---|------|------|------|
| 35 | `logger.ts` | 无日志分级 | 添加INFO/WARN/ERROR级别 |
| 36 | `logger.ts` | 无结构化上下文 | 添加context字段支持 |
| 37 | `doctor.ts` | execSync无timeout | 添加timeout选项 |
| 38 | `hard-gate.ts` | execSync无timeout | 添加timeout选项 |
| 39 | `config-schema.ts` | YAML解析不安全 | 启用schema: 'safe' |
| 40 | `id-search.ts` | 重复解析矩阵 | 复用parseMatrix结果 |
| 41 | `rfc.ts` | 目录扫描重复 | 维护序号计数器文件 |
| 42 | `defect.ts` | 目录扫描重复 | 维护序号计数器文件 |
| 43 | `postinstall.ts` | PATH劫持风险 | 使用绝对路径调用 |
| 44 | `preuninstall.ts` | PATH劫持风险 | 使用绝对路径调用 |
| 45 | `viewer.ts` | passthrough未验证 | 添加白名单校验 |

---

## ✅ 测试覆盖分析

### 覆盖率统计

| 模块 | 测试文件数 | 覆盖状态 | 缺失测试 |
|------|------------|----------|----------|
| `src/core/trace-engine/` | 6 | ✅ 完整 | - |
| `src/core/change-mgr/` | 4 | ⚠️ 部分 | impact.ts |
| `src/core/template/` | 3 | ✅ 完整 | - |
| `src/core/ai-orchestrator/` | 3 | ✅ 完整 | - |
| `src/core/gate-engine/` | 2 | ⚠️ 部分 | rollback.ts, golive.ts |
| `src/core/tool-integration/` | 3 | ✅ 完整 | - |
| `src/core/metrics-engine/` | 1 | ✅ 完整 | - |
| `src/core/skill-runtime/` | 2 | ⚠️ 部分 | hard-gate.ts直接测试 |
| `src/core/process-engine/` | 5 | ✅ 完整 | - |
| `src/shared/` | 5 | ⚠️ 部分 | host-bootstrap.ts |
| `src/cli/` | 15+ | ⚠️ 部分 | 命令执行路径 |

### 缺失测试模块

| 优先级 | 模块 | 状态 | 建议 |
|--------|------|------|------|
| P0 | `src/core/change-mgr/impact.ts` | ❌ 完全缺失 | 添加影响分析核心逻辑单元测试 |
| P0 | `src/core/gate-engine/rollback.ts` | ❌ 完全缺失 | 添加回滚机制测试 |
| P0 | `src/core/gate-engine/golive.ts` | ❌ 完全缺失 | 添加上线检查测试 |
| P1 | `src/shared/host-bootstrap.ts` | ❌ 完全缺失 | 添加引导逻辑测试 |
| P1 | `src/core/skill-runtime/hard-gate.ts` | ⚠️ 间接覆盖 | 添加直接单元测试 |

### 测试类型分布

| 测试类型 | 文件数 | 说明 |
|----------|--------|------|
| 单元测试 | 53 | 覆盖核心模块功能 |
| 集成测试 | 2 | skill-integration, layer2-merge |
| E2E测试 | 2 | core-flow, error-paths |
| 性能测试 | 1 | performance.bench.ts |

---

## 🎯 最佳实践亮点

项目有以下良好实践值得保持：

### 1. 状态机设计成熟

- `phase-machine.ts`、`stage-machine.ts`、`rfc-machine.ts` 使用转换表 + 守卫函数模式
- 符合FSM最佳实践

### 2. 类型系统完善

- `types.ts` 定义清晰，使用 `enum`、`ReadonlySet` 确保类型安全
- 终态集合使用 `ReadonlySet` 不可变

### 3. 配置管理规范

- `config-schema.ts` 提供默认配置、校验、缓存机制
- 配置边界验证完善

### 4. 日志设计合理

- JSONL格式便于解析
- 自动轮转（>1000行归档）
- 时间戳注入

### 5. 函数式设计

- `confirm-policy.ts` 四维判定矩阵使用纯函数
- 无副作用，易于测试

---

## 📋 可用审查Skills

| Skill | 命令 | 适用场景 |
|-------|------|----------|
| `code-reviewer` | `/code-reviewer` | 通用代码审查 |
| `frontend-code-review` | `/frontend-code-review` | React/Vue项目 |
| `frontend-code-review -c` | `/frontend-code-review -c` | 审查未暂存变更 |
| `frontend-code-review -a <branch>` | `/frontend-code-review -a feature-xyz` | 对比分支差异 |
| `frontend-code-review -d dims` | `/frontend-code-review -d security,performance` | 自定义审查维度 |
| `spec-first:code-review` | `spec-first code-review` | Spec-First工作流专用 |

---

## 📅 修复计划建议

### P0 (本周)

```
├─ 🔴 gate-evaluator.ts 命令注入漏洞修复
├─ 🔴 fs-utils.ts 路径遍历防护
└─ 🔴 补充 impact/rollback/golive 测试
```

### P1 (本月)

```
├─ 🟠 init.ts/handleInit 函数重构
├─ 🟠 添加模板编译缓存
├─ 🟠 O(n²) 算法优化 (matrix.ts, coverage.ts)
└─ 🟠 消除 any 类型使用
```

### P2 (下季度)

```
├─ 🟡 大文件职责拆分 (hard-gate/catchup/gate-evaluator/ai-runtime-hook)
├─ 🟡 日志分级系统
├─ 🟡 异步API版本提供
└─ 🟡 依赖注入重构
```

---

## 📝 附录

### 审查方法

本次审查使用5个并发Agent进行：

1. **安全审查Agent** - 扫描命令注入、路径遍历、敏感信息泄露、输入验证、权限控制
2. **性能审查Agent** - 分析算法复杂度、内存泄漏、I/O效率、异步处理、缓存策略
3. **代码质量Agent** - 检查代码复杂度、重复代码、命名规范、错误处理、类型安全
4. **最佳实践Agent** - 评估SOLID原则、设计模式、依赖注入、配置管理、日志规范
5. **测试覆盖Agent** - 统计覆盖率、分析测试类型、评估边界条件、检查Mock使用

### 审查统计

- **总耗时**: ~2.5分钟
- **源文件数**: 67个TypeScript文件
- **测试文件数**: 53个单元测试 + 2个集成测试 + 2个E2E测试
- **发现问题**: 76+个

---

*报告生成时间: 2026-02-26*
*审查工具: Claude Code + code-reviewer + frontend-code-review*
