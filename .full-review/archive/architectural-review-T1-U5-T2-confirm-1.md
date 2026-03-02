# T1+U5+T2+confirm-1 架构审查报告

**审查范围**: T1+U5+T2+confirm-1 模块代码变更

**审查日期**: 2026-03-02

---

## 执行摘要

本次审查针对 T1（模板哈希 + 变更分级更新）、U5（meta/local 目录分离)、T2（Manifest 迁移引擎)和 confirm-1（确认策略接入) 四个模块的代码实现进行架构评估， 重点关注组件边界、依赖管理、API 设计、数据模型和设计模式和架构一致性。

---

## 一、总体评估

### 架构改进亮点

1. **清晰的模块分层**: 新增的 migrations、template 模块职责清晰， migrations 专注于版本迁移， template 专注于模板管理
2. **良好的扩展性**: 四层架构（L0→L1→L2→L3→Layer 2→Extension→Layer 3）设计支持未来的灵活演进
3. **强类型定义**: TypeScript 类型定义完整，接口契约清晰
4. **声明式设计**: Manifest 系统采用 YAML 配置，提高了可读性和可维护性

### 关键风险点

1. **模块耦合度**: 新模块之间的依赖关系较为复杂
2. **错误处理一致性**: 部分模块的错误处理策略不统一
3. **配置管理复杂度**: 多层配置合并增加了理解成本

---

## 二、组件边界分析

### 1. migrations 模块 (Critical - 新建)

**位置**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/`

**文件清单**:
- `split-meta-local.ts` - meta/local 分离迁移脚本
- `manifest-schema.ts` - Manifest 结构定义
- `manifest-loader.ts` - Manifest 加载与校验
- `version-matcher.ts` - 版本区间匹配
- `manifest-engine.ts` - 迁移执行引擎

**问题识别**:

#### 1.1.1 职责划分模糊 (Medium)

**问题**: `manifest-loader.ts` 和 `manifest-engine.ts` 都涉及文件系统操作，职责边界不够清晰。

**详细分析**:

**manifest-loader.ts**:
- **职责**: 加载 YAML 格式的迁移清单并校验结构
- **文件操作**: `readFileSync` (加载), `readdirSync` (扫描目录)
- **校验逻辑**: 包含详细的字段校验

**manifest-engine.ts**:
- **职责**: 执行迁移步骤
- **文件操作**: 大量的 `existsSync`, `mkdirSync`, `renameSync`, `rmSync`, `copyFileSync`, `writeFileSync` 等
- **命令执行**: `execSync` (执行 shell 命令)

**问题**:
- 两者都涉及文件 I/O，但职责重叠
- `manifest-engine.ts` 文件过大（445 行），承担了太多职责
- 缺少抽象层（如 `FileSystemAdapter`）来隔离底层实现细节

#### 1.1.2 错误处理策略不统一 (Medium)

**问题**: 各模块对错误的处理方式不一致，缺乏统一的错误分类和处理策略。

**详细分析**:

**split-meta-local.ts**:
- 第 125-129 行： 使用 try-catch 静默捕获错误
- 第 204 行: 迁移失败时只记录在 reason 字段中

**manifest-engine.ts**:
- 第 49-56 行: 返回包含 error 的 StepResult
- 第 362-375 行: 使用 try-catch 捕获错误
- 第 418-431 行: 失败时根据策略决定是否继续

**manifest-loader.ts**:
- 第 32-34 行: 直接抛出错误
- 第 72-75 行: 收集错误数组

**问题**:
- 没有统一的错误类型定义
- 错误恢复策略不明确（何时重试、何时回滚、何时中止)
- 日志记录不统一

#### 1.1.3 缺少索引文件 (Medium)

**问题**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/` 目录缺少 `index.ts` 稡块导出文件。

**详细分析**:

当前目录结构:
```
src/core/migrations/
├── split-meta-local.ts
├── manifest-schema.ts
├── manifest-loader.ts
├── version-matcher.ts
└── manifest-engine.ts
```

缺少 `index.ts` 来统一导出公共接口。

**影响**:
- 外部模块需要导入 5 个文件才能访问完整功能
- 增加了维护成本
- 可能导致循环依赖

**建议**:
创建 `src/core/migrations/index.ts`:
```typescript
export { splitMetaLocal } from './split-meta-local.js';
export { loadManifest, validateManifest, listManifests, findManifestForVersion } from './manifest-loader.js';
export { parseRange, compareVersions, matches, filterManifestsByVersion, rangeToString } from './version-matcher.js';
export { executeStep, executeManifest, ConflictStrategy } from './manifest-engine.js';
export * { MigrationManifest, MigrationStep, StepResult, ExecutionResult, ValidationResult, VersionRange } from './manifest-schema.js';
```

### 2. template 模块 (新建)

**位置**: `/Users/kuang/xiaobu/spec-first/src/core/template/`

**文件清单**:
- `hash-registry.ts` - 模板哈希注册表
- `change-classifier.ts` - 变更分级分类器
- `update-decision.ts` - 更新决策逻辑

**问题识别**:

#### 2. 2.1 类型定义重复 (Low)

**问题**: `ChangeLevel` 类型在多个文件中重复定义。

**详细分析**:

**hash-registry.ts** (第 17 行):
```typescript
export type ChangeLevel = 'Minor' | 'Major' | 'Critical';
```

**change-classifier.ts** (第 9 行):
```typescript
export type ChangeLevel = 'Minor' | 'Major' | 'Critical';
```
**update-decision.ts** (第 8 行):
```typescript
import type { ChangeLevel } from './change-classifier.js';
```
**问题**: 类型重复定义可能导致维护困惑。

**建议**: 在 `src/shared/types.ts` 中统一定义 `ChangeLevel` 类型。

#### 2. 2.2 配置硬编码 (Low)

**问题**: `classifyTemplateLevel` 函数中硬编码了模板级别分类逻辑。

**详细分析**:

**hash-registry.ts** (第 100-123 行):
```typescript
function classifyTemplateLevel(templateName: string): 'Minor' | 'Major' | 'Critical' {
  // Critical：配置文件、规则文件
  if (
    templateName.includes('config') ||
    templateName.includes('rule') ||
    templateName.includes('gate') ||
    templateName === 'settings'
  ) {
    return 'Critical';
  }

  // Major：流程模板、Skill 模板
  if (
    templateName.includes('skill') ||
    templateName.includes('workflow') ||
    templateName.includes('process') ||
    templateName.startsWith('0') // 阶段模板（01_specify, 02_design 等）
  ) {
    return 'Major';
  }

  // Minor：文档模板、注释模板
  return 'Minor';
}
```
**change-classifier.ts** (第 21-38 行):
```typescript
const CRITICAL_PATTERNS = [
  /config/i,
  /rule/i,
  /gate/i,
  /threshold/i,
  /settings/i,
  /\.ya?ml$/, // YAML 文件（可能是配置）
];

const MAJOR_PATTERNS = [
  /skill/i,
  /workflow/i,
  /process/i,
  /^0\d_/, // 阶段模板（01_specify, 02_design 等）
  /^(init|setup|bootstrap)/i,
  /(spec|design|plan|implement|verify|release)/i,
];
```
**问题**: 逻辑重复且分散在多处，难以维护。

**建议**: 统一分类逻辑到一个配置对象中，便于未来扩展。

### 3. layer-merger.ts (修改)

**位置**: `/Users/kuang/xiaobu/spec-first/src/core/process-engine/layer-merger.ts`

**问题识别**:

#### 3. 3. 1 函数过长 (Medium)

**问题**: `mergeLayerRules` 函数虽然有良好的文档注释，但整体逻辑较为复杂（548 行）。

**详细分析**:
- 函数内部包含多个嵌套的辅助函数
- 深度嵌套的条件判断
- 较高的认知复杂度

**建议**: 考虑将 Layer 处理逻辑提取为独立的类或策略模式。

#### 3. 3. 2 深度嵌套的校验逻辑 (Medium)

**问题**: 多个 `normalize*` 函数包含复杂的类型检查和错误处理。

**详细分析**:

```typescript
function normalizeDeliverable(raw: unknown, stage: string, platform: string): Deliverable {
  if (typeof raw === 'string' && raw.trim() !== '') {
    return { name: raw.trim(), required: false };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`平台 "${platform}" 的阶段 "${stage}" 存在无效 deliverable`);
  }
  // ... 更多校验逻辑
}
```

**问题**: 校验逻辑分散，难以复用。

**建议**: 提取校验逻辑到独立的校验模块。

### 4. config-schema.ts (修改)

**位置**: `/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts`

**问题识别**:

#### 4. 4. 1 深度合并函数重复 (Low)

**问题**: `deepMerge` 函数在 `config-schema.ts` 中定义，与 `manifest-engine.ts` 中的类似。

**详细分析**:

**config-schema.ts** (第 95-131 行):
```typescript
function deepMerge(
  target: Record<string, unknown>,
  source: unknown,
): Record<string, unknown> {
  // ... 合并逻辑
}
```

**manifest-engine.ts** (第 314-336 行):
```typescript
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  // ... 相似但略有不同的合并逻辑
}
```

**问题**: 两个实现略有不同，可能导致行为不一致。

**建议**: 统一到 `src/shared/utils.ts` 中。

#### 4. 4. 2 配置缓存管理 (Low)

**问题**: 使用全局 Map 缓存配置，缺乏清理机制。

**详细分析**:

```typescript
const configCache = new Map<string, SpecFirstConfig>();
```

**问题**:
- 全局状态难以测试
- 缺少缓存过期机制
- 多项目场景下可能内存泄漏

**建议**: 考虑使用 LRU 缓存或添加过期时间。

### 5. renderer.ts (修改)

**位置**: `/Users/kuang/xiaobu/spec-first/src/core/template/renderer.ts`

**问题识别**:

#### 5. 5. 1 模板查找策略硬编码 (Low)

**问题**: 模板查找路径硬编码在函数中。

**详细分析**:

```typescript
const TEMPLATE_DIR = 'templates';
const LOCAL_TEMPLATE_DIR = '.spec-first/local/templates';
const META_TEMPLATE_DIR = '.spec-first/meta/templates';
```

**问题**: 路径硬编码降低了灵活性。

**建议**: 提取为配置对象。

### 6. update.ts (修改)

**位置**: `/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts`

**问题识别**:

#### 6. 6. 1 函数职责过多 (High)

**问题**: `runUpdate` 函数承担了太多职责（326 行）。

**详细分析**:
- 模板变更检测
- Manifest 迁移执行
- 项目脚手架创建
- Skill/MCP/Hook 安装
- 版本检查

**问题**: 违反单一职责原则，难以测试和维护。

**建议**: 拆分为多个专门的处理器类或函数。

#### 6. 6. 2 缺少依赖注入 (Medium)

**问题**: 多个辅助函数直接访问文件系统，缺乏抽象。

**详细分析**:

```typescript
function checkTemplateChanges(options: TemplateCheckOptions): void {
  const packageTemplatesDir = join(cwd, 'node_modules', 'spec-first', 'templates');
  if (!existsSync(packageTemplatesDir)) {
    return;
  }
  // ... 直接文件操作
}
```

**问题**: 难以进行单元测试和模拟。

**建议**: 注入文件系统适配器。

### 7. router.ts (修改)

**位置**: `/Users/kuang/xiaobu/spec-first/src/cli/router.ts`

**问题识别**:

#### 7. 7. 1 确认策略集成不完整 (Medium)

**问题**: confirm-1 雴成只是占位符，未真正实现。

**详细分析**:

```typescript
const policy = evaluatePolicy({
  mode: 'N',
  size: 'M',
  hasNfrSec: false,
  hasNewExternalApi: false,
});

if (policy !== 'auto') {
  // 暂不进行交互式确认，完整实现需要在更上层集成
  // 未来可以在这里添加用户确认逻辑
}
```

**问题**: 代码中的注释表明功能未完成，可能误导用户。

**建议**: 要么完整实现，要么移除占位代码并添加 TODO 注释。

---

## 三、数据模型分析

### 1. Manifest 数据模型

**位置**: `/Users/kuang/xiaobu/spec-first/src/core/migrations/manifest-schema.ts`

**优点**:
- 使用 TypeScript discriminated unions 定义不同的步骤类型
- 清晰的接口定义
- 完整的类型守卫

**改进建议**:
- 考虑添加 `readonly` 修饰符确保不可变性
- 添加 `brand` 类型用于运行时类型检查

### 2. 配置合并模型

**位置**: `/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts`

**优点**:
- 清晰的合并优先级（DEFAULT → meta → local → config.yaml）
- 使用缓存提高性能

**改进建议**:
- 考虑添加合并冲突检测和日志
- 添加配置版本迁移机制

### 3. Layer 规则合并模型

**位置**: `/Users/kuang/xiaobu/spec-first/src/core/process-engine/layer-merger.ts`

**优点**:
- 四层架构设计清晰（L0 基线 → L1 Mode×Size → L2 平台 → L3 用户覆盖）
- 明确的合并策略（AND 叠加、取更严格值、完全覆盖）

**改进建议**:
- 考虑添加合并结果验证
- 添加合并历史记录用于调试

---

## 四、设计模式应用

### 1. 策略模式 (良好)

**位置**: `manifest-engine.ts` 中的 `ConflictStrategy` 枚举

**优点**:
- 使用枚举定义冲突处理策略
- 清晰的策略语义（Skip, Overwrite, Abort, Prompt）

**建议**: 考虑将策略模式扩展到其他决策点

### 2. 类型守卫模式 (良好)

**位置**: `manifest-schema.ts` 中的类型守卫函数

**优点**:
- 使用类型守卫进行运行时类型检查
- 完整覆盖所有步骤类型

**代码示例**:
```typescript
export function isMkdirStep(step: MigrationStep): step is MkdirStep {
  return step.type === 'mkdir';
}
```

### 3. 构建器模式 (隐式)

**位置**: `update-decision.ts` 中的决策构建函数

**优点**:
- 使用函数构建决策对象
- 清晰的决策逻辑流程

**建议**: 考虑使用类来封装决策上下文

### 4. 模板方法模式 (缺失)

**问题**: 文件操作缺乏统一的模板方法。

**建议**: 为文件操作（copy, move, delete 等）创建统一的接口

---

## 五、架构一致性

### 与项目规范对比

**项目规范要求**:
- ESM only - ✅ 所有文件使用 ESM
- Named exports only - ✅ 所有导出都是命名导出
- kebab-case 文件命名 - ✅ 文件名使用 kebab-case
- 类型集中 - ⚠️ 类型分散在多个文件中
- Stage 枚举 - ✅ 正确使用

**一致性问题**:
1. **类型定义分散**: `ChangeLevel` 等类型在多个文件中重复定义
2. **错误处理不统一**: 各模块错误处理策略不一致
3. **配置管理**: 配置路径硬编码在多处

---

## 六、安全性与性能

### 安全性

1. **命令执行风险 (High)**: `manifest-engine.ts` 使用 `execSync` 执行 shell 命令
   - 第 351-355 行: 直接执行用户提供的命令
   - **建议**: 添加命令白名单和参数验证

2. **路径遍历风险 (Medium)**: 多个模块直接拼接用户提供的路径
   - **建议**: 添加路径验证和规范化

3. **文件覆盖风险 (Medium)**: `overwrite` 选项可能意外覆盖重要文件
   - **建议**: 添加关键文件保护机制

### 性能

1. **同步文件操作**: 大量使用同步文件 API (`readFileSync`, `writeFileSync`)
   - **影响**: 在大型项目中可能成为瓶颈
   - **建议**: 考虑异步版本或批量操作

2. **配置缓存**: 使用全局 Map 缓存，缺乏过期机制
   - **影响**: 长时间运行的进程可能持有过期配置
   - **建议**: 添加缓存过期时间

3. **重复的文件系统访问**: `layer-merger.ts` 中多次检查文件存在性
   - **建议**: 缓存文件系统查询结果

---

## 七、测试性

### 测试难点

1. **文件系统依赖**: 大量直接文件系统操作，难以单元测试
2. **全局状态**: `configCache` 等全局状态影响测试隔离性
3. **命令执行**: `execSync` 难以在测试中模拟
4. **复杂依赖链**: 模块间复杂的依赖关系增加测试难度

### 建议

1. **依赖注入**: 引入文件系统适配器接口
2. **接口抽象**: 为外部依赖创建接口
3. **测试工具**: 创建测试专用的 mock 和 stub

---

## 八、改进优先级

### P0 - 必须立即解决

1. **命令执行安全**: 添加命令白名单和验证
2. **update.ts 重构**: 拆分 `runUpdate` 函数职责
3. **缺少索引文件**: 创建 `migrations/index.ts`

### P1 - 应该尽快解决

1. **类型定义统一**: 将重复类型集中到 `shared/types.ts`
2. **错误处理统一**: 创建统一的错误类型和处理策略
3. **路径验证**: 添加路径安全和规范化

### P2 - 可以逐步改进

1. **函数拆分**: 将长函数拆分为更小的单元
2. **配置对象**: 提取硬编码配置为配置对象
3. **添加日志**: 统一日志记录机制

### P3 - 长期改进

1. **异步改造**: 考虑将同步 API 改为异步
2. **缓存优化**: 实现更智能的缓存策略
3. **测试覆盖**: 提高单元测试覆盖率

---

## 九、总结

### 架构评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 模块化 | 7/10 | 模块划分清晰，但缺少索引文件 |
| 类型安全 | 8/10 | TypeScript 使用良好，但类型有重复 |
| 可扩展性 | 8/10 | 四层架构设计支持未来扩展 |
| 可测试性 | 5/10 | 文件系统依赖过多，难以测试 |
| 可维护性 | 6/10 | 部分函数过长，职责不够单一 |
| 安全性 | 6/10 | 命令执行和路径处理存在风险 |

**总体评分**: 6.7/10

### 核心建议

1. **立即行动**:
   - 创建 `migrations/index.ts` 统一导出
   - 重构 `update.ts` 拆分职责
   - 添加命令执行白名单

2. **短期改进**:
   - 统一类型定义到 `shared/types.ts`
   - 创建统一的错误处理机制
   - 提取 `deepMerge` 到公共工具模块

3. **长期规划**:
   - 引入依赖注入模式
   - 改造为异步 API
   - 提高测试覆盖率

### 架构亮点

1. **声明式迁移**: Manifest 系统设计优雅，支持版本区间匹配
2. **四层配置架构**: 清晰的配置合并优先级
3. **模板哈希检测**: 智能的变更检测和分级更新策略
4. **强类型定义**: TypeScript 使用规范，类型定义完整

---

**审查完成时间**: 2026-03-02
**审查人**: Architect Agent
