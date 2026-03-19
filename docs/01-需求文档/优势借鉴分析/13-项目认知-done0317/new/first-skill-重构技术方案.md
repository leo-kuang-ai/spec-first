# First Skill 重构技术方案

> **版本**: v2.0.0  
> **日期**: 2026-03-17  
> **目标**: 构建项目认知文档体系，赋能全流程 Skill 上下文增强

---

## 一、背景与目标

### 1.1 核心问题

新人接手存量项目做需求迭代时，面临以下痛点：
- 缺乏项目全局认知，需要大量时间阅读代码
- 不了解架构约束和技术债务，容易引入不一致的设计
- 不清楚关键流程和依赖关系，容易产生副作用
- 缺少开发规范和最佳实践指导，代码质量参差不齐

### 1.2 设计目标

1. **单一入口，全量生成** — 一条命令生成完整的项目认知文档
2. **投影增强** — 为不同 Skill 节点提供定制化的上下文视图
3. **动态同步** — 需求完成后自动更新文档，保持新鲜度
4. **健壮降级** — 文档缺失时不阻塞其他 Skill 执行
5. **SDD 最佳实践** — 文档即规范，可追溯、可验证、可演进

---

## 二、整体架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    First Skill 架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ CLI Commands │─────▶│ First Engine │                     │
│  └──────────────┘      └──────┬───────┘                     │
│   - first init              │                                │
│   - first refresh           │                                │
│   - first project           ▼                                │
│   - first status      ┌──────────────┐                      │
│   - first sync        │  Analyzers   │                      │
│                       ├──────────────┤                      │
│                       │ - AST Parser │                      │
│                       │ - Dep Graph  │                      │
│                       │ - Git History│                      │
│                       └──────┬───────┘                      │
│                              │                               │
│                              ▼                               │
│                       ┌──────────────┐                      │
│                       │  Generators  │                      │
│                       ├──────────────┤                      │
│                       │ - Doc Gen    │                      │
│                       │ - Projection │                      │
│                       │ - Sync       │                      │
│                       └──────┬───────┘                      │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────┐     │
│  │              Document Store                        │     │
│  ├───────────────────────────────────────────────────┤     │
│  │  docs/first/                                       │     │
│  │  ├── README.md              (索引总览)            │     │
│  │  ├── codebase-overview.md   (代码库概览)          │     │
│  │  ├── tech-stack.md          (技术栈)              │     │
│  │  ├── architecture.md        (架构)                │     │
│  │  ├── domain-model.md        (领域模型)            │     │
│  │  ├── api-docs.md            (API 文档)            │     │
│  │  ├── external-deps.md       (外部依赖)            │     │
│  │  ├── call-graph.md          (调用图)              │     │
│  │  ├── critical-flows.md      (关键流程)            │     │
│  │  ├── development-guidelines.md (开发指南)         │     │
│  │  ├── local-setup.md         (本地搭建)            │     │
│  │  ├── entry-guide.md         (入口指南)            │     │
│  │  ├── change-map.md          (变更映射)            │     │
│  │  └── reboot-guide.md        (重启指南)            │     │
│  └───────────────────────────────────────────────────┘     │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────┐     │
│  │           Projection Store                         │     │
│  ├───────────────────────────────────────────────────┤     │
│  │  skills/spec-first/NN-xxx/references/              │     │
│  │  ├── domain-context.md      (领域上下文)          │     │
│  │  ├── design-constraints.md  (设计约束)            │     │
│  │  ├── task-context.md        (任务上下文)          │     │
│  │  ├── implementation-guide.md (实现指南)           │     │
│  │  ├── test-guide.md          (测试指南)            │     │
│  │  ├── review-checklist.md    (评审清单)            │     │
│  │  └── release-guide.md       (发布指南)            │     │
│  └───────────────────────────────────────────────────┘     │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────┐     │
│  │          Skill Runtime Integration                 │     │
│  ├───────────────────────────────────────────────────┤     │
│  │  - first-context.ts: 加载 first 上下文            │     │
│  │  - context-resolver.ts: 集成到 skill prompt       │     │
│  │  - SKILL.md: 使用 {{firstContext}} 占位符         │     │
│  └───────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心概念

#### 全量文档（Truth Source）
- 存储位置：`docs/first/`
- 特点：完整、权威、可追溯
- 更新方式：first init（初始化）、first refresh（增量更新）、first sync（需求完成后同步）

#### 投影文档（Projection）
- 存储位置：`skills/spec-first/NN-xxx/references/`
- 特点：精简、定制、面向特定 Skill
- 生成方式：基于配置文件，从全量文档中提取、过滤、重组

#### 文档元数据
每个文档包含 YAML front matter：
```yaml
---
doc_type: first_artifact
category: architecture
version: 1.2.0
last_updated: 2026-03-17
updated_by: FSREQ-20260313-UIOPT-001
dependencies:
  - tech-stack.md
  - domain-model.md
status: active
---
```

---

## 三、文档体系设计

### 3.1 全量文档清单（14 类）

| 文档名称 | 用途 | 生成方式 | 更新频率 |
|---------|------|---------|---------|
| README.md | 索引总览 | 模板生成 | 每次 init/refresh |
| codebase-overview.md | 代码库结构 | 目录扫描 + AST | 每次 init/refresh |
| tech-stack.md | 技术栈 | package.json + 配置文件 | 每次 init/refresh |
| architecture.md | 架构图 | 依赖图分析 + 模板 | 每次 init/refresh |
| domain-model.md | 领域模型 | AST + 类型分析 | 每次 init/refresh |
| api-docs.md | API 文档 | AST + JSDoc | 每次 init/refresh |
| external-deps.md | 外部依赖 | package.json + 调用分析 | 每次 init/refresh |
| call-graph.md | 调用图 | madge + 自定义分析 | 每次 init/refresh |
| critical-flows.md | 关键流程 | 入口分析 + 调用链 | 每次 init/refresh |
| development-guidelines.md | 开发指南 | 代码规范提取 + 模板 | 每次 init/refresh |
| local-setup.md | 本地搭建 | README + 脚本分析 | 每次 init/refresh |
| entry-guide.md | 入口指南 | 入口文件分析 | 每次 init/refresh |
| change-map.md | 变更映射 | Git 历史分析 | 每次 sync |
| reboot-guide.md | 重启指南 | 脚本分析 + 模板 | 每次 init/refresh |

### 3.2 投影文档清单（7 类）

| 投影名称 | 目标 Skill | 源文档 | 投影策略 |
|---------|-----------|--------|---------|
| domain-context.md | /spec-first:spec | domain-model.md + api-docs.md | 提取核心概念、实体关系 |
| design-constraints.md | /spec-first:design | architecture.md + tech-stack.md + external-deps.md | 提取架构约束、技术限制 |
| task-context.md | /spec-first:task | development-guidelines.md + critical-flows.md + call-graph.md | 提取开发规范、关键流程 |
| implementation-guide.md | /spec-first:code | local-setup.md + development-guidelines.md + entry-guide.md + critical-flows.md | 提取环境搭建、编码规范、入口指南 |
| test-guide.md | /spec-first:test | critical-flows.md + development-guidelines.md | 提取测试策略、测试场景 |
| review-checklist.md | /spec-first:review | change-map.md + critical-flows.md | 提取变更映射、影响分析 |
| release-guide.md | /spec-first:release | reboot-guide.md | 提取发布流程、回滚预案 |

### 3.3 投影配置示例

`skills/spec-first/01-spec/projection-config.yaml`:
```yaml
projection:
  name: domain-context
  output: references/domain-context.md
  sources:
    - path: docs/first/domain-model.md
      sections:
        include: ["核心概念", "实体关系", "业务规则"]
        exclude: ["历史演进", "技术实现"]
    - path: docs/first/api-docs.md
      sections:
        include: ["公开 API", "数据模型"]
  transformations:
    - type: summarize
      max_length: 2000
    - type: add_metadata
      fields: ["version", "last_updated"]
```

---

## 四、技术实现

### 4.1 模块设计

#### 新增模块：`src/core/first-engine/`

```typescript
// first-bootstrap.ts - 初始化引导
export async function bootstrapFirstDocs(projectRoot: string): Promise<void>

// first-analyzer.ts - 代码分析
export class FirstAnalyzer {
  analyzeCodebase(): CodebaseInfo
  analyzeDependencies(): DependencyGraph
  analyzeArchitecture(): ArchitectureInfo
  analyzeDomainModel(): DomainModel
  analyzeAPIs(): APIInfo[]
  analyzeCriticalFlows(): Flow[]
}

// first-doc-generator.ts - 文档生成
export class FirstDocGenerator {
  generateAllDocs(analysis: AnalysisResult): Promise<void>
  generateDoc(docType: FirstDocType, data: any): Promise<string>
}

// first-doc-projection.ts - 投影生成
export class FirstDocProjection {
  loadProjectionConfig(skillName: string): ProjectionConfig
  generateProjection(config: ProjectionConfig): Promise<string>
  refreshAllProjections(): Promise<void>
}

// first-doc-sync.ts - 文档同步
export class FirstDocSync {
  syncFromChangeMap(featureId: string): Promise<void>
  detectChanges(featureId: string): ChangeSet
  updateDocs(changes: ChangeSet): Promise<void>
}

// first-runtime-store.ts - 运行时存储
export class FirstRuntimeStore {
  loadDoc(docName: string): Promise<FirstDoc | null>
  loadProjection(skillName: string): Promise<string | null>
  hasFirstDocs(): boolean
  getDocMetadata(docName: string): DocMetadata | null
}
```

#### 修改模块：`src/core/skill-runtime/`

```typescript
// first-context.ts - First 上下文加载器
export interface FirstContext {
  available: boolean
  docs: Map<string, FirstDoc>
  projection: string | null
}

export async function loadFirstContext(skillName: string): Promise<FirstContext>

// context-resolver.ts - 上下文解析器（修改）
export async function resolveSkillContext(
  skillName: string,
  featureId: string
): Promise<SkillContext> {
  // 原有逻辑...
  
  // 新增：加载 first 上下文
  const firstContext = await loadFirstContext(skillName)
  
  return {
    ...existingContext,
    firstContext
  }
}
```

#### 新增 CLI 命令：`src/cli/commands/first/`

```typescript
// init.ts
export async function firstInit(options: FirstInitOptions): Promise<void>

// refresh.ts
export async function firstRefresh(options: FirstRefreshOptions): Promise<void>

// project.ts
export async function firstProject(options: FirstProjectOptions): Promise<void>

// status.ts
export async function firstStatus(): Promise<void>

// sync.ts
export async function firstSync(featureId: string): Promise<void>
```

### 4.2 Skill 集成

#### SKILL.md 模板增强

```markdown
# Skill: Spec Writing

## Project Context

{{#if firstContext.available}}
### Domain Context
{{firstContext.projection}}

**文档版本**: {{firstContext.metadata.version}}  
**最后更新**: {{firstContext.metadata.last_updated}}
{{else}}
⚠️ **项目认知文档未生成**

建议运行以下命令生成项目认知文档，以获得更好的上下文支持：
```bash
spec-first first init
```

当前将使用通用上下文继续执行。
{{/if}}

## Instructions

基于以上项目上下文，编写功能规格说明...
```

### 4.3 健壮性保障

#### 降级策略

```typescript
// first-context.ts
export async function loadFirstContext(skillName: string): Promise<FirstContext> {
  const store = new FirstRuntimeStore()
  
  // 检查 first 文档是否存在
  if (!store.hasFirstDocs()) {
    return {
      available: false,
      docs: new Map(),
      projection: null
    }
  }
  
  // 尝试加载投影文档
  const projection = await store.loadProjection(skillName)
  
  return {
    available: true,
    docs: await store.loadAllDocs(),
    projection: projection || generateFallbackProjection(skillName)
  }
}

function generateFallbackProjection(skillName: string): string {
  // 返回通用的降级上下文
  return `
## 通用项目上下文

当前项目尚未生成完整的认知文档。建议运行 \`spec-first first init\` 生成。

### 基础信息
- 项目类型: TypeScript + Node.js
- 构建工具: tsup
- 测试框架: Vitest
  `
}
```

#### 懒加载

```typescript
// context-resolver.ts
export async function resolveSkillContext(
  skillName: string,
  featureId: string
): Promise<SkillContext> {
  // 只在需要时加载 first 上下文
  const firstContext = await loadFirstContext(skillName)
  
  // 即使加载失败，也不阻塞 skill 执行
  if (!firstContext.available) {
    logger.warn(`First docs not available for skill ${skillName}, using fallback`)
  }
  
  return {
    ...existingContext,
    firstContext
  }
}
```

---

## 五、文档同步机制

### 5.1 同步时机

在以下阶段触发文档同步：
- **07_release**: 发布前同步，确保文档反映最新变更
- **08_done**: 归档时同步，作为最终版本

### 5.2 同步流程

```typescript
// first-doc-sync.ts
export async function syncFromChangeMap(featureId: string): Promise<void> {
  // 1. 读取 change-map.md
  const changeMap = await loadChangeMap(featureId)
  
  // 2. 分析变更类型
  const changes = analyzeChanges(changeMap)
  
  // 3. 根据变更类型更新对应文档
  for (const change of changes) {
    switch (change.type) {
      case 'api_added':
        await updateApiDocs(change)
        break
      case 'domain_concept_added':
        await updateDomainModel(change)
        break
      case 'architecture_changed':
        await updateArchitecture(change)
        break
      case 'flow_added':
        await updateCriticalFlows(change)
        break
      case 'dependency_added':
        await updateExternalDeps(change)
        break
      case 'call_graph_changed':
        await updateCallGraph(change)
        break
    }
  }
  
  // 4. 更新文档元数据
  await updateDocMetadata(featureId)
  
  // 5. 重新生成投影文档
  await refreshAllProjections()
}
```

### 5.3 变更检测

```typescript
interface ChangeSet {
  apiChanges: APIChange[]
  domainChanges: DomainChange[]
  architectureChanges: ArchitectureChange[]
  flowChanges: FlowChange[]
  dependencyChanges: DependencyChange[]
}

function analyzeChanges(changeMap: ChangeMap): ChangeSet {
  // 解析 change-map.md，识别变更类型
  // 使用正则表达式或 AST 分析
  // 返回结构化的变更集
}
```

### 5.4 增量更新策略

```typescript
async function updateApiDocs(change: APIChange): Promise<void> {
  const apiDoc = await loadDoc('api-docs.md')
  
  // 解析现有文档
  const sections = parseMarkdown(apiDoc.content)
  
  // 找到对应章节
  const targetSection = sections.find(s => s.title === change.module)
  
  if (targetSection) {
    // 增量更新：在现有章节中添加新 API
    targetSection.content += `\n\n### ${change.apiName}\n${change.description}`
  } else {
    // 新增章节
    sections.push({
      title: change.module,
      content: `### ${change.apiName}\n${change.description}`
    })
  }
  
  // 更新元数据
  apiDoc.metadata.version = incrementVersion(apiDoc.metadata.version)
  apiDoc.metadata.last_updated = new Date().toISOString()
  apiDoc.metadata.updated_by = change.featureId
  
  // 写回文件
  await saveDoc('api-docs.md', apiDoc)
}
```

---

## 六、SDD 最佳实践体现

### 6.1 文档即规范

- **原则**：First 文档是项目的"规范"，所有实现都应符合文档描述
- **实现**：
  - 在 gate-engine 中增加 first 文档完整性检查
  - 在 code review 时对照 first 文档验证实现
  - 在 CI 中自动检查代码与文档的一致性

### 6.2 可追溯性

- **原则**：每个设计决策都能追溯到来源
- **实现**：
  - 在文档元数据中记录 `updated_by` 字段，关联 Feature ID
  - 在 trace-engine 中支持 first 文档的追溯查询
  - 提供 `spec-first first trace <doc-name>` 命令查看文档演进历史

### 6.3 自动化校验

- **原则**：规范可被自动验证
- **实现**：
  - 在 validators 模块中增加 first 文档格式校验
  - 在 gate-engine 中增加文档完整性 gate
  - 在 metrics-engine 中增加文档新鲜度指标

### 6.4 持续演进

- **原则**：规范随项目演进
- **实现**：
  - 语义化版本管理（major.minor.patch）
  - 自动同步机制（需求完成后更新）
  - 版本追溯（Git + 元数据）

---

## 七、实施计划

### 7.1 阶段划分

#### Phase 1: 基础设施（1-2 天）
- [ ] 创建 `src/core/first-engine/` 模块
- [ ] 实现 `FirstAnalyzer` 基础分析能力
- [ ] 实现 `FirstDocGenerator` 文档生成器
- [ ] 实现 `FirstRuntimeStore` 运行时存储
- [ ] 添加单元测试

#### Phase 2: CLI 命令（1 天）
- [ ] 实现 `spec-first first init` 命令
- [ ] 实现 `spec-first first refresh` 命令
- [ ] 实现 `spec-first first status` 命令
- [ ] 添加集成测试

#### Phase 3: 投影机制（1-2 天）
- [ ] 实现 `FirstDocProjection` 投影生成器
- [ ] 为 7 个 Skill 创建投影配置文件
- [ ] 生成投影文档
- [ ] 添加单元测试

#### Phase 4: Skill 集成（1 天）
- [ ] 实现 `first-context.ts` 上下文加载器
- [ ] 修改 `context-resolver.ts` 集成 first 上下文
- [ ] 更新所有 SKILL.md 模板
- [ ] 添加集成测试

#### Phase 5: 文档同步（1-2 天）
- [ ] 实现 `FirstDocSync` 同步器
- [ ] 实现变更检测逻辑
- [ ] 实现增量更新逻辑
- [ ] 在 change-mgr 中集成同步功能
- [ ] 添加端到端测试

#### Phase 6: 健壮性与优化（1 天）
- [ ] 实现降级策略
- [ ] 实现懒加载
- [ ] 性能优化（缓存、并行）
- [ ] 错误处理和日志
- [ ] 添加性能测试

#### Phase 7: SDD 增强（1 天）
- [ ] 在 gate-engine 中增加 first 文档检查
- [ ] 在 trace-engine 中增加文档追溯
- [ ] 在 metrics-engine 中增加文档指标
- [ ] 在 validators 中增加文档校验
- [ ] 添加治理测试

### 7.2 总工作量估算

- **开发**: 7-10 天
- **测试**: 2-3 天
- **文档**: 1 天
- **总计**: 10-14 天

---

## 八、风险与应对

### 8.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| AST 分析复杂度高 | 高 | 中 | 使用成熟的 TypeScript Compiler API，参考 ts-morph |
| 依赖图分析性能差 | 中 | 中 | 使用 madge 等成熟工具，增加缓存机制 |
| 文档同步冲突 | 中 | 低 | 实现冲突检测，提示用户手动解决 |
| 投影配置复杂 | 低 | 中 | 提供默认配置，支持渐进式定制 |

### 8.2 业务风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 文档生成时间长 | 中 | 中 | 异步生成，显示进度条，支持增量更新 |
| 文档质量不稳定 | 高 | 中 | 人工审核 + 自动校验，持续优化模板 |
| 用户不使用 first skill | 高 | 低 | 在其他 skill 中提示，展示价值 |

---

## 九、成功指标

### 9.1 功能指标

- [ ] 支持 14 类全量文档生成
- [ ] 支持 7 类投影文档生成
- [ ] 支持自动同步机制
- [ ] 支持降级策略
- [ ] 测试覆盖率 ≥ 75%

### 9.2 质量指标

- [ ] 文档生成时间 < 30 秒（中型项目）
- [ ] 文档准确率 ≥ 90%（人工抽查）
- [ ] 投影文档大小 < 2000 行
- [ ] 零阻塞：文档缺失时不影响其他 skill

### 9.3 用户体验指标

- [ ] 新人上手时间从 2 天降至 0.5 天
- [ ] 需求分析质量提升 30%（通过 gate 通过率衡量）
- [ ] 技术方案一致性提升 40%（通过 code review 反馈衡量）

---

## 十、附录

### 10.1 参考资料

- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [ts-morph](https://ts-morph.com/)
- [madge](https://github.com/pahen/madge)
- [Handlebars](https://handlebarsjs.com/)

### 10.2 相关文档

- `docs/first/README.md`: First 文档索引
- `CLAUDE.md`: Spec-First 开发规范
- `src/core/skill-runtime/README.md`: Skill Runtime 架构

### 10.3 术语表

| 术语 | 定义 |
|------|------|
| First Skill | 项目认知文档生成器 |
| 全量文档 | 完整的项目认知文档，存储在 docs/first/ |
| 投影文档 | 针对特定 Skill 的精简视图，存储在 skills/.../references/ |
| 文档同步 | 需求完成后将变更回写到 first 文档 |
| 降级策略 | 文档缺失时的备用方案 |
| SDD | Specification-Driven Development，规范驱动开发 |

---

**方案制定**: Claude (Anthropic)  
**审核状态**: 待审核  
**下一步**: 与团队讨论，确认技术路线，启动 Phase 1 开发
