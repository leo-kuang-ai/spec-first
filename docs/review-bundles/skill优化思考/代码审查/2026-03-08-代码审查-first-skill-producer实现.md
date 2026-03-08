# 代码审查报告 - First Skill Producer 实现

> 审查日期：2026-03-08
> 审查范围：00-first skill 作为 producer 的实现
> 审查依据：`docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-最佳实践重构设计.md`

---

## 审查总结

### ✅ 已完成部分

根据设计文档第 4.1 节"需要新建的文件"，以下文件已创建：

- ✅ `src/core/skill-runtime/first-runtime-types.ts`
- ✅ `src/core/skill-runtime/first-runtime-store.ts`
- ✅ `src/core/skill-runtime/first-summary.ts`
- ✅ `src/core/skill-runtime/first-role-views.ts`
- ✅ `src/core/skill-runtime/first-stage-views.ts`
- ✅ `src/core/skill-runtime/first-context.ts`
- ✅ `src/core/skill-runtime/first-doc-projection.ts`

### ⚠️ 待完成部分

#### 1. 测试文件缺失

设计要求的测试文件尚未创建：

- ❌ `tests/unit/first-runtime-types.test.ts`
- ❌ `tests/unit/first-runtime-store.test.ts`
- ❌ `tests/unit/first-summary.test.ts`
- ❌ `tests/unit/first-role-views.test.ts`
- ❌ `tests/unit/first-stage-views.test.ts`
- ❌ `tests/unit/first-context.test.ts`
- ❌ `tests/unit/first-context-stage-views.test.ts`

#### 2. 既有文件未完全切换

设计文档第 4.2 节要求修改的文件，部分尚未切换到 runtime 真源：

- ⚠️ `src/core/skill-runtime/dispatcher.ts` - 需要验证是否已切换
- ⚠️ `src/cli/commands/init.ts` - 需要验证是否已切换
- ⚠️ `skills/spec-first/01-init/SKILL.md` - 需要验证文档是否已更新

---

## 问题 4：Producer 职责边界不清晰

### 严重程度：🟡 中等

### 设计要求（第 3 节）

**00-first 必须负责**：

- 展示层输出：`docs/first/*.md`
- Runtime 真源索引：`.spec-first/runtime/first/index.json`
- Runtime 语义输出：`summary.json`, `role-views.json`, `stage-views.json`
- Runtime 读取接口：`loadFirstContext()`, `loadStageView()`, `loadFirstRoleView()`

**00-first 明确不负责**：

- 不直接改 `03-spec` 的消费规则
- 不直接改 `04-design` 的门槛规则
- 不直接改 `07-code` 的实现规则
- 不直接改 `12-verify` 的验收门槛
- 不把 `00-onboarding / 01-init / 13-orchestrate` 的流程消费逻辑塞回自身文档

### 实际实现问题

当前 `skills/spec-first/00-first/SKILL.md` 文档中：

```markdown
## Runtime 分层模型

- **机器真源层**：`.spec-first/runtime/first/`
  - `.spec-first/runtime/first/index.json`
  - `.spec-first/runtime/first/summary.json`
  - `.spec-first/runtime/first/role-views.json`
  - `.spec-first/runtime/first/stage-views.json`
- **文档投影视图层**：`docs/first/`
```

✅ 文档已明确 runtime 分层模型

但需要验证：

1. SKILL.md 中是否包含了 consumer 侧的消费规则？
2. 是否有"如何在 spec/design/code/verify 中使用"的描述？

### 验证建议

检查 `skills/spec-first/00-first/SKILL.md` 全文，确认：

- [ ] 没有描述下游阶段如何消费 stage-views
- [ ] 没有定义依赖强度（L1/L2/L3）
- [ ] 没有定义降级策略
- [ ] 只专注于 producer 职责

---

## 问题 5：缺少完整的测试覆盖

### 严重程度：🔴 高

### 设计要求

根据 `2026-03-08-first-skill-开发执行任务表.md`，每个新建模块都应该有对应的测试文件，并遵循 TDD 流程：

1. Write the failing tests
2. Run tests to verify they fail
3. Write minimal implementation
4. Run tests to verify they pass

### 实际实现问题

当前仓库中，新建的 7 个 `first-*.ts` 文件都没有对应的单元测试：

```bash
# 已创建的实现文件
src/core/skill-runtime/first-runtime-types.ts
src/core/skill-runtime/first-runtime-store.ts
src/core/skill-runtime/first-summary.ts
src/core/skill-runtime/first-role-views.ts
src/core/skill-runtime/first-stage-views.ts
src/core/skill-runtime/first-context.ts
src/core/skill-runtime/first-doc-projection.ts

# 缺失的测试文件
tests/unit/first-runtime-types.test.ts     ❌
tests/unit/first-runtime-store.test.ts     ❌
tests/unit/first-summary.test.ts           ❌
tests/unit/first-role-views.test.ts        ❌
tests/unit/first-stage-views.test.ts       ❌
tests/unit/first-context.test.ts           ❌
tests/unit/first-context-stage-views.test.ts ❌
tests/unit/first-doc-projection.test.ts    ❌
```

### 影响范围

- 直接影响：无法验证实现的正确性
- 间接影响：重构时容易引入 bug
- 长期影响：违反项目测试覆盖率要求（75%）

### 修复建议

按照 TDD 流程补充测试，优先级：

1. **P0**：`first-runtime-store.test.ts` - 核心存储层
2. **P0**：`first-context.test.ts` - 核心读取接口
3. **P1**：`first-stage-views.test.ts` - 阶段视图构建
4. **P1**：`first-summary.test.ts` - 摘要构建
5. **P2**：`first-role-views.test.ts` - 角色视图构建
6. **P2**：`first-doc-projection.test.ts` - 文档投影

### 测试模板示例

```typescript
// tests/unit/first-runtime-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  readFirstRuntimeIndex,
  writeFirstRuntimeIndex,
  readFirstRuntimeSummary,
  writeFirstRuntimeSummary,
} from '../../src/core/skill-runtime/first-runtime-store.js';

describe('first-runtime-store', () => {
  const testRoot = join(process.cwd(), 'tests/fixtures/first-runtime-store-test');

  beforeEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true });
    }
    mkdirSync(testRoot, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true });
    }
  });

  describe('readFirstRuntimeIndex', () => {
    it('should return null when index does not exist', () => {
      const result = readFirstRuntimeIndex(testRoot);
      expect(result).toBeNull();
    });

    it('should read valid index', () => {
      const index = {
        version: '1.0.0',
        lastRun: '2026-03-08T00:00:00Z',
        mode: 'quick' as const,
        summary: { path: 'summary.json', fileHash: 'abc', lastUpdated: '2026-03-08', healthy: true },
        roleViews: { path: 'role-views.json', fileHash: 'def', lastUpdated: '2026-03-08', healthy: true },
        stageViews: { path: 'stage-views.json', fileHash: 'ghi', lastUpdated: '2026-03-08', healthy: true },
        docsProjection: {},
        status: 'current' as const,
      };

      writeFirstRuntimeIndex(testRoot, index);
      const result = readFirstRuntimeIndex(testRoot);

      expect(result).toEqual(index);
    });
  });

  describe('writeFirstRuntimeSummary', () => {
    it('should write summary to correct path', () => {
      const summary = {
        generatedAt: '2026-03-08T00:00:00Z',
        mode: 'quick' as const,
        project: { name: 'test-project' },
        modules: ['module1'],
        capabilities: ['cap1'],
        entryPoints: ['entry1'],
        dataModels: ['model1'],
        apiSurface: ['api1'],
        risks: ['risk1'],
        evidence: ['evidence1'],
      };

      writeFirstRuntimeSummary(testRoot, summary);
      const result = readFirstRuntimeSummary(testRoot);

      expect(result).toEqual(summary);
    });
  });
});
```

---

## 问题 6：入口层未完全切换到 Runtime 真源

### 严重程度：🔴 高

### 设计要求（第 4.3 节）

> **只切 runtime 底层、不切入口层，会形成半切换状态。**

必须同时切换的主链入口：

- `src/core/skill-runtime/dispatcher.ts`
- `src/cli/commands/init.ts`
- `skills/spec-first/01-init/SKILL.md`

### 需要验证的问题

#### 1. dispatcher.ts 是否已切换？

需要检查 `dispatcher.ts` 中的 `first` 相关逻辑：

- [ ] 是否仍然读取 `docs/first/.index.yaml`？
- [ ] 是否已切换到 `readFirstRuntimeIndex()`？
- [ ] `firstArgs` 解析是否支持新的刷新模式？

#### 2. init.ts 是否已切换？

需要检查 `src/cli/commands/init.ts`：

- [ ] 前置检查是否仍然依赖 `docs/first/` 存在？
- [ ] 是否已切换到检查 `.spec-first/runtime/first/index.json`？

#### 3. 01-init SKILL.md 是否已更新？

需要检查 `skills/spec-first/01-init/SKILL.md`：

- [ ] prerequisites 是否仍然要求 `docs/first/` 存在？
- [ ] 是否已更新为检查 runtime 真源？

### 验证方法

```bash
# 检查是否仍有对旧路径的引用
grep -r "docs/first/.index.yaml" src/
grep -r "docs/first" src/cli/commands/init.ts
grep -r "docs/first" skills/spec-first/01-init/
```

---

## 优先级总结

| 问题                                   | 严重程度 | 工作量 | 优先级 |
| -------------------------------------- | -------- | ------ | ------ |
| 问题 5：缺少完整的测试覆盖             | 🔴 高    | 2 天   | P0     |
| 问题 6：入口层未完全切换到 Runtime 真源 | 🔴 高    | 1 天   | P0     |
| 问题 4：Producer 职责边界不清晰        | 🟡 中    | 0.5 天 | P1     |

## 下一步行动

1. **立即执行**：验证入口层切换状态（问题 6）
2. **本周完成**：补充核心模块测试（问题 5 - P0/P1）
3. **下周完成**：审查 SKILL.md 职责边界（问题 4）
