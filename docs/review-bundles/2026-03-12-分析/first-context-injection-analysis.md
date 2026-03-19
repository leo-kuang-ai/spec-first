# First Context 自动注入机制分析

> 分析时间: 2026-03-12
> 分析范围: first skill 生成的项目认知文档在后续 skill 中的自动注入机制

## 问题陈述

first skill 生成项目梳理文档（技术栈、API、数据模型等），但后续 skill（spec/design/task/code）是否自动注入这些上下文？

## 当前实现

### ✅ 代码层已实现（但未生效）

1. **Runtime Notice 注入机制**
   - 位置: `src/core/skill-runtime/dispatcher.ts`
   - 函数: `buildSpecRuntimeNotice()`, `buildDesignRuntimeNotice()`, `buildTaskRuntimeNotice()`, `buildCodeRuntimeNotice()`
   - 触发条件: **仅当通过 `dispatcher.loadSkill()` 加载时**

2. **数据来源**
   - 优先: `.spec-first/runtime/first/index.json` + `stage-views.json`
   - 降级: `docs/first/stage-views.md`（自动提取 summary）

3. **已有注入内容**

   ```yaml
   background_input_status: full/degraded
   data_source: runtime/docs
   spec_view_summary: <阶段摘要>
   missing_assets: <缺失资产列表>
   ```

4. **role-views 已部分利用**
   - `onboarding` skill: 读取并注入角色信息（dispatcher.ts:633）
   - `detectBackgroundInputStatus()`: 纳入健康度判断（first-context.ts:484）
   - 但 spec/design/task/code 未消费

### ❌ 核心问题：宿主入口未接入动态链路

**Claude Code 命令文件**（skill-commands.ts:224）：

```markdown
读取并执行以下完整 Skill 定义：~/.spec-first/skills/spec-first/XX-name/SKILL.md
```

这是**静态文件**，AI 直接读取原始 SKILL.md，**不经过 `dispatcher.loadSkill()`**，因此：

- ❌ 所有 runtime notice 不会注入
- ❌ prompt assembly 不会执行
- ❌ hard-gate 检查不会触发

**Codex skills**（skill-commands.ts:249）：
直接复制 skill 目录，同样是静态文件。

### 次要问题

1. **注入内容可增强**: 当前只注入 summary，可增加技术栈、API、数据模型
2. **spec/design/task/code 未消费 role-views**: 其他 skill 已利用，但这 4 个阶段未消费

## 优化方案

### 方案 A: 统一宿主入口到动态链路（必须）

**问题**: Claude Code 命令文件是静态的，不经过 `dispatcher.loadSkill()`

**方案**: 修改命令文件渲染逻辑，改为调用 CLI 命令

```typescript
// skill-commands.ts:177
function renderCommandFile(entry: SkillEntry): string {
  return `---
description: ${quoteYamlString(sanitizeDescription(entry.description))}
---

执行 spec-first CLI 命令：

\`\`\`bash
npx spec-first skill ${entry.skillName} $ARGUMENTS
\`\`\`
`;
}
```

**优点**:

- 统一入口，所有 runtime notice 自动生效
- hard-gate、prompt assembly 正常工作

**缺点**:

- 需要 CLI 支持 `skill` 子命令
- 性能略降（多一次进程调用）

### 方案 B: 增强注入内容（次要）

**前提**: 方案 A 完成后

**改动**: `buildCompactFirstContext()` 增加技术栈、API、数据模型

**代码量**: ~50 行

## 实施建议

### Phase 1（必须）- 修复宿主入口

1. 新增 CLI 子命令 `npx spec-first skill <name> [args]`
2. 修改 `renderCommandFile()` 改为调用 CLI
3. 验证 runtime notice 正常注入

**代码量**: ~100 行

### Phase 2（优化）- 增强注入内容

1. 实现 `buildCompactFirstContext()`
2. 在 spec/design/task/code 的 runtime notice 中调用

**代码量**: ~70 行

## 代码位置

| 文件                                         | 关键函数                | 作用                       |
| -------------------------------------------- | ----------------------- | -------------------------- |
| `src/core/skill-runtime/dispatcher.ts`       | `loadSkill()`           | Skill 加载入口             |
| `src/core/skill-runtime/dispatcher.ts`       | `build*RuntimeNotice()` | 各阶段 runtime notice 构建 |
| `src/core/skill-runtime/first-context.ts`    | `loadFirstContext()`    | 加载 first runtime 数据    |
| `src/core/skill-runtime/prompt-assembler.ts` | `assemblePrompt()`      | Prompt 模板组装            |

## 结论

当前实现的 runtime notice 机制**代码层完备**，但**宿主入口未接入**，导致完全不生效。

**根本问题**: Claude Code 命令文件是静态的，不经过 `dispatcher.loadSkill()`

**必须修复**: 统一宿主入口到动态链路（方案 A），否则任何内容增强都无效

**次要优化**: 增强注入内容（方案 B），但必须在方案 A 完成后
