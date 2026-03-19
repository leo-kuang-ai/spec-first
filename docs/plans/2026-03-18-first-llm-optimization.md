# First Skill LLM 增强优化方案

**日期**: 2026-03-18
**问题**: CLI 生成的 `docs/first/` 文档内容精简，默认应使用 LLM 生成，CLI 模式作为降级
**目标**: 默认 LLM 模式 → CLI 降级，保持 runtime truth 为唯一真源

---

## 一、现状分析

### 1.1 当前流程

```
spec-first first CLI
    ↓
bootstrapFirstRuntime()  // 基于静态分析（package.json、目录结构）
    ↓
生成 runtime assets (summary.json 等 9 个)
    ↓
refreshFirstDocsFromRuntime()  // 格式化投影
    ↓
生成 docs/first/*.md (14 个文档)
```

### 1.2 问题诊断

| 层级 | 问题 | 影响 |
|------|------|------|
| **Runtime 生成** | `bootstrapFirstRuntime()` 仅基于静态分析，信息量受限 | runtime 真源内容不够丰富 |
| **文档投影** | `renderProjectedDoc()` 纯格式化，无语义增强 | 文档内容只是 JSON 的 Markdown 转述 |
| **用户体验** | 执行 `spec-first first` 后文档质量达不到预期 | 需要手动补充或走多 Agent 路径 |

### 1.3 现有基础设施

- ✅ `first-change-detector.ts`：增量更新检测（Git diff + 健康检查）
- ✅ `first-runtime-store.ts`：读写 9 个 runtime 资产
- ✅ `first-doc-projection.ts`：14 个文档的投影逻辑
- ✅ `first-context.ts`：`refreshFirstArtifacts()` 已存在，可扩展 LLM 路径

---

## 二、优化方案（三选一）

### 方案 A：LLM 增强 Runtime 资产 + CLI Projection（推荐）

**架构**：
```
bootstrapFirstRuntime() → 基础 runtime
    ↓
enrichFirstRuntimeWithLLM()  // 新增：LLM 增强 runtime 内容
    ↓
refreshFirstDocsFromRuntime()  // 保持现有投影逻辑
    ↓
docs/first/*.md
```

**实现点**：

1. **新增 `first-llm-enricher.ts`**
   - `enrichFirstRuntimeWithLLM(projectRoot, mode)`
   - 读取基础 runtime（`summary.json` 等）
   - 调用 LLM 生成增强内容
   - 写回 runtime assets（保持格式兼容）

2. **LLM 增强策略**
   - **增量增强**：只增强 CLI 未覆盖的字段（如 `description`、`relationships`）
   - **选择性增强**：根据证据数量决定是否调用 LLM（证据少 → LLM 补充）
   - **幂等性**：LLM 增强后生成 `enrichmentHash`，避免重复调用

3. **降级触发条件**
   - LLM 超时（>30s）
   - LLM 失败（API 错误、限流）
   - 用户显式指定 `--cli-mode` 跳过 LLM

**优点**：
- Runtime 真源保持权威性（LLM 只是增强，不改变结构）
- 投影层无需改动，复用现有逻辑
- 增强结果可缓存，避免重复 LLM 调用

**缺点**：
- 需要定义 LLM 增强 schema（字段级兼容性）
- LLM 增强 runtime 后需重新投影文档

---

### 方案 B：LLM 直接渲染 Docs

**架构**：
```
bootstrapFirstRuntime() → runtime assets
    ↓
refreshFirstDocsFromRuntime() → 判断模式
    ├─ LLM 模式（默认）：renderProjectedDocWithLLM()
    └─ CLI 模式（降级）：renderProjectedDoc() (现有)
```

**实现点**：

1. **新增 `first-llm-renderer.ts`**
   - `renderProjectedDocWithLLM(docPath, runtimeContext, mode)`
   - 根据 `docPath` 选择对应 prompt 模板
   - 调用 LLM 生成 Markdown
   - 失败时降级到 `renderProjectedDoc()`

2. **Prompt 组织**
   - 基础上下文：`runtimeContext`（summary、steering 等）
   - 文档特定 prompt：14 个文档各自有独立 prompt
   - 证据注入：自动注入相关文件路径片段

3. **降级策略**
   - 每个文档独立降级（LLM 失败 → CLI 生成该文档）
   - 全局降级 flag（`--cli-mode` 跳过所有 LLM）

**优点**：
- 实现简单，只需替换渲染层
- 每个 doc 独立优化，渐进式增强
- 降级逻辑清晰（文档级 fallback）

**缺点**：
- LLM 直接输出 Markdown，难以保证结构一致性
- 14 个文档需要维护 14 套 prompt
- LLM 可能捏造 runtime 中不存在的事实

---

### 方案 C：First Skill LLM Mode（最大改动）

**架构**：
```
/spec-first:first 执行
    ↓
判断模式
    ├─ LLM 模式（默认）：走 first skill → 多 Agent 编排 → 生成 docs/first
    └─ CLI 模式（降级）：直接调用 spec-first first CLI
```

**实现点**：

1. **First Skill 扩展**
   - 新增 `--cli-mode` flag
   - 默认行为改为：调用 `first` skill（走 skill 编排）
   - `--cli-mode` 时直接调用底层 `handleFirst()` 函数

2. **First Skill LLM 流程**
   - 复用现有的 reference 读取规则
   - 调用 subagent 增强分析
   - 生成完整的 `docs/first/` 文档

**优点**：
- 复用 skill 生态（reference 读取、subagent 编排）
- 灵活性最高（可定制增强分析深度）

**缺点**：
- 架构改动最大（CLI → Skill 优先）
- 多 Agent 编排耗时较长
- 与现有"直接执行 CLI"原则冲突

---

## 三、推荐方案（方案 A）详细设计

### 3.1 选择理由

1. **保持架构稳定**：Runtime → Docs 的单向投影关系不变
2. **渐进式增强**：LLM 只增强 CLI 弱项，不重写已有逻辑
3. **可控性**：增强结果写入 runtime，可审计、可回滚
4. **性能**：LLM 增强结果可缓存，避免重复调用

### 3.2 核心模块：`first-llm-enricher.ts`

```typescript
interface EnrichmentOptions {
  mode: 'full' | 'selective' | 'skip';  // full=全量增强，selective=选择性，skip=跳过
  timeout?: number;                      // LLM 超时时间（默认 30s）
  fallbackToCli: boolean;                 // 失败时是否降级
}

interface EnrichmentResult {
  enrichedArtifacts: string[];            // 成功增强的资产
  skippedArtifacts: string[];             // 跳过的资产
  failures: { artifact: string; reason: string }[];
  fallbackUsed: boolean;                  // 是否使用了 CLI 降级
}

export function enrichFirstRuntimeWithLLM(
  projectRoot: string,
  options: EnrichmentOptions
): EnrichmentResult;
```

### 3.3 增强策略（Selective Mode）

| 资产 | 增强条件 | 增强内容 |
|------|---------|---------|
| `summary.json` | `overview` 为空或默认值 | LLM 生成项目概述 |
| `api-contracts.json` | `interfaces.length === 0` | LLM 从代码入口提取接口契约 |
| `domain-model.json` | `entities.length < 3` | LLM 识别核心领域概念 |
| `critical-flows.json` | `flows.length < 2` | LLM 识别关键协作路径 |
| `conventions.json` | 观察模式不足 3 条 | LLM 提取编码规范 |

### 3.4 LLM 调用设计

```typescript
interface LLMEnrichmentPrompt {
  artifactType: string;          // e.g., 'api-contracts'
  currentContent: unknown;       // 当前 runtime 内容
  evidenceFiles: string[];       // 证据文件路径
  enhancementGoal: string;       // 增强目标描述
}

async function callLLMForEnrichment(
  prompt: LLMEnrichmentPrompt,
  options: { timeout: number }
): Promise<unknown>;
```

### 3.5 集成点：`first.ts`

```typescript
export function handleFirst(args: string[]): number {
  // ... 现有参数解析 ...

  if (hasHealthyRuntime && !firstArgs.force) {
    // 刷新模式
    const result = refreshFirstArtifacts(projectRoot, 'refresh-docs-from-runtime');
  } else {
    // Bootstrap 模式
    const bootstrap = bootstrapFirstRuntime(projectRoot, {
      platformType: firstArgs.type,
    });

    // ⭐ 新增：LLM 增强（默认启用，--cli-mode 跳过）
    if (!firstArgs.cliMode) {
      const enrichment = enrichFirstRuntimeWithLLM(projectRoot, {
        mode: 'selective',
        timeout: 30000,
        fallbackToCli: true,
      });

      if (enrichment.fallbackUsed) {
        console.warn('⚠️ LLM 增强失败，已降级到 CLI 模式');
      }

      // 重新投影文档（runtime 已更新）
      const docsAfterEnrichment = refreshFirstDocsFromRuntime(projectRoot);
    }
  }

  console.log(formatProductSummary(projectRoot));
  return ExitCode.SUCCESS;
}
```

### 3.6 新增 CLI 参数

```bash
# LLM 模式（默认）
spec-first first

# CLI 模式（跳过 LLM）
spec-first first --cli-mode

# 强制 LLM 全量增强
spec-first first --llm-mode=full

# 仅健康检查（不变）
spec-first first --check-health
```

---

## 四、实施路线

### 4.1 第一阶段：核心能力（P0）

**任务**：
1. 实现 `first-llm-enricher.ts` 核心函数
2. 实现选择性增强逻辑（`api-contracts`、`domain-model`、`critical-flows`）
3. 集成到 `first.ts`，新增 `--cli-mode` 参数
4. 补充单元测试与集成测试

**验收标准**：
- 默认执行 `spec-first first` 自动调用 LLM 增强
- LLM 失败时自动降级到 CLI 模式
- 增强后的 runtime 资产格式兼容（投影无需改动）

### 4.2 第二阶段：优化与降级（P1）

**任务**：
1. 实现增强结果缓存（`enrichmentHash`）
2. 实现超时控制与重试机制
3. 完善降级日志与错误提示
4. 补充 `--llm-mode=full` 全量增强模式

**验收标准**：
- 重复执行不重复调用 LLM（缓存命中）
- 超时场景降级平滑
- 用户可感知 LLM 增强效果

### 4.3 第三阶段：监控与调优（P2）

**任务**：
1. 添加 LLM 调用指标（耗时、成功率、降级率）
2. 优化 prompt 模板（提升增强质量）
3. 支持自定义 LLM endpoint

**验收标准**：
- 可观测 LLM 增强效果
- 用户体验稳定（<5% 降级率）

---

## 五、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| LLM 输出格式不一致 | Runtime 校验失败 | Schema 强校验 + 降级重试 |
| LLM 捏造事实 | Docs 与代码脱节 | 禁止 LLM 修改证据字段 + 文档声明 |
| LLM 超时/失败 | 用户体验下降 | 30s 超时 + 自动降级 + 提示 |
| 成本增加 | 频繁调用 LLM | 缓存 + 选择性增强（不全量） |

---

## 六、与现有体系兼容性

### 6.1 Runtime Truth 不变

- LLM 增强只写入 `.spec-first/runtime/first/`，不改变"唯一真源"原则
- Docs 投影层（`first-doc-projection.ts`）无需改动
- 增强后的 runtime 仍可通过 CLI 重新生成（覆盖 LLM 结果）

### 6.2 降级路径清晰

- LLM 失败 → CLI 模式 → 仍可生成完整的 runtime + docs
- 用户可显式选择 `--cli-mode` 跳过 LLM
- 不影响现有的增量刷新逻辑（`first-change-detector.ts`）

---

## 七、总结

**推荐方案 A**：LLM 增强 Runtime 资产 + CLI Projection

- **最小改动**：新增 `first-llm-enricher.ts`，集成到 `first.ts`
- **最大兼容**：保持 Runtime → Docs 单向投影，不破坏现有架构
- **渐进增强**：选择性增强 CLI 弱项，不重写已有能力
- **稳定降级**：LLM 失败时自动降级到 CLI，用户体验不中断

**优先级**：P1（重要但不紧急）

**预计工时**：8-12 小时（第一阶段）+ 4-6 小时（第二阶段）

**关键成功因素**：
1. LLM 增强结果必须通过现有 schema 校验
2. 降级逻辑必须可靠（超时、失败、用户取消）
3. 增强效果必须可感知（文档质量明显提升）
