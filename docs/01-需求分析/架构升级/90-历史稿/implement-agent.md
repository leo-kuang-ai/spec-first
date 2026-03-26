# Implement Agent 详细分析

> 本文档详细分析 spec-first 项目中 implement agent 的设计、配置和执行机制

---

## 1. 概述

### 1.1 Agent 定义

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Implement Agent 定位                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────────┐
                              │   dispatch Agent     │
                              │   (调度器)            │
                              └──────────┬───────────┘
                                         │
                                         │ Phase 1: implement
                                         ▼
                    ┌────────────────────────────────────────────────┐
                    │            implement Agent                      │
                    │  ─────────────────────────────────────────────│
                    │  • 代码实现专家                                  │
                    │  • 理解 specs 和 requirements                   │
                    │  • 实现功能，禁止 git commit                     │
                    └────────────────────┬───────────────────────────┘
                                         │
                                         │ 完成后
                                         ▼
                              ┌──────────────────────┐
                              │    check Agent       │
                              │   (质量检查)          │
                              └──────────────────────┘
```

### 1.2 核心特征

| 属性 | 值 | 说明 |
|------|------|------|
| **名称** | `implement` | 代码实现专家 |
| **模型** | `opus` | 使用最强大的模型处理复杂任务 |
| **执行模式** | 串行、单次 | 不循环执行 |
| **后台运行** | `true` | 通过 `run_in_background` 异步执行 |
| **最大时间** | 30 分钟 | 超时后通知用户 |
| **Git 权限** | 禁止 commit/push/merge | 必须由用户手动提交 |

---

## 2. 文件位置

### 2.1 定义文件

| 位置 | 路径 | 用途 |
|------|------|------|
| **项目定义** | `.claude/agents/implement.md` | 当前项目使用的定义 |
| **Claude 模板** | `packages/cli/src/templates/claude/agents/implement.md` | Claude Code 平台模板 |
| **iFlow 模板** | `packages/cli/src/templates/iflow/agents/implement.md` | iFlow 平台模板 |
| **OpenCode 模板** | `packages/cli/src/templates/opencode/agents/implement.md` | OpenCode 平台模板 |

### 2.2 模板差异

| 平台 | 模型配置 | 工具配置 |
|------|----------|----------|
| Claude | `model: opus` | `tools: Read, Write, Edit, Bash, Glob, Grep, ...` |
| iFlow | `color: orange` | 类似 Claude |
| OpenCode | `mode: subagent` | 使用 `permission:` 块定义 |

---

## 3. 配置详解

### 3.1 Frontmatter

```yaml
---
name: implement
description: |
  Code implementation expert. Understands specs and requirements,
  then implements features. No git commit allowed.
tools: Read, Write, Edit, Bash, Glob, Grep, mcp__exa__web_search_exa, mcp__exa__get_code_context_exa
model: opus
---
```

### 3.2 工具权限矩阵

| 工具 | 权限 | 用途 |
|------|------|------|
| Read | ✅ | 读取代码、specs、配置 |
| Write | ✅ | 创建新文件 |
| Edit | ✅ | 修改现有文件 |
| Bash | ✅ | 运行命令（lint, typecheck 等） |
| Glob | ✅ | 文件模式匹配搜索 |
| Grep | ✅ | 内容搜索 |
| mcp__exa__* | ✅ | 网络搜索和代码上下文 |
| **git commit** | ❌ | **禁止** |
| **git push** | ❌ | **禁止** |
| **git merge** | ❌ | **禁止** |

### 3.3 禁止 Git 操作的原因

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  为什么 implement 禁止 git commit？                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. 人工审核需求                                                                 │
│     └─> 代码必须经过人工审核后才能提交                                            │
│                                                                                 │
│  2. 质量保证                                                                     │
│     └─> check agent 会验证代码质量，但最终由人决定是否提交                         │
│                                                                                 │
│  3. 责任追溯                                                                     │
│     └─> commit 由人执行，便于追溯和回滚                                           │
│                                                                                 │
│  4. 防止意外                                                                     │
│     └─> 避免 AI 自动提交未经验证的代码                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 工作流程

### 4.1 完整工作流程

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Implement Agent 工作流程                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

  Step 1: 接收上下文 (由 Hook 自动注入)
      │
      ├── implement.jsonl 或 spec.jsonl 中的文件列表
      ├── prd.md (需求文档)
      ├── info.md (技术设计，如果存在)
      └── .spec-first/spec/ 中的相关规范

      ▼
  Step 2: 理解规范 (Understand Specs)
      │
      ├── 读取 .spec-first/spec/<package>/<layer>/
      ├── 读取 .spec-first/spec/guides/
      └── 理解编码标准和最佳实践

      ▼
  Step 3: 理解需求 (Understand Requirements)
      │
      ├── 读取 prd.md: 核心需求是什么
      ├── 读取 info.md: 技术设计要点
      └── 确定需要修改/创建的文件

      ▼
  Step 4: 实现功能 (Implement Features)
      │
      ├── 按规范和技术设计编写代码
      ├── 遵循现有代码模式
      ├── 只做必需的，不过度工程
      └── 保持代码可读性

      ▼
  Step 5: 自我验证 (Verify)
      │
      ├── 运行 pnpm lint
      ├── 运行 pnpm typecheck
      └── 确保基础检查通过

      ▼
  Step 6: 报告结果 (Report)
      │
      └── 输出实现摘要和修改的文件列表
```

### 4.2 上下文注入机制

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        上下文注入流程                                             │
└─────────────────────────────────────────────────────────────────────────────────┘

  dispatch Agent 调用 implement
      │
      │ Task(subagent_type: "implement", ...)
      ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  inject-subagent-context.py (PreToolUse Hook)                               │
  │                                                                             │
  │  1. 检测 subagent_type = "implement"                                        │
  │  2. 调用 get_implement_context()                                            │
  │     │                                                                       │
  │     ├── 读取 .spec-first/.current-task                                      │
  │     ├── 读取 {task_dir}/implement.jsonl                                     │
  │     │   └── 如果不存在，回退到 spec.jsonl                                     │
  │     ├── 读取 {task_dir}/prd.md                                              │
  │     └── 读取 {task_dir}/info.md (如果存在)                                   │
  │                                                                             │
  │  3. 组装注入内容                                                             │
  │     │                                                                       │
  │     └── 将所有文件内容注入到 subagent prompt                                 │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
      │
      ▼
  implement Agent 收到完整上下文
      │
      └── 开始实现
```

### 4.3 JSONL 格式

```jsonl
{"file": ".spec-first/spec/backend/index.md", "reason": "Backend development guide"}
{"file": ".spec-first/spec/backend/error-handling.md", "reason": "Error handling patterns"}
{"file": ".spec-first/spec/guides/cross-layer-thinking-guide.md", "reason": "Cross-layer checklist"}
```

---

## 5. 执行模式详解

### 5.1 串行执行

```typescript
// dispatch.md 中的调用模式

Task(
  subagent_type: "implement",
  prompt: "Implement the feature described in prd.md in the task directory",
  model: "opus",
  run_in_background: true  // 后台运行，但仍是串行
)

// 轮询等待完成
for i in 1..6:  // 最多轮询 6 次
    result = TaskOutput(task_id, block=true, timeout=300000)  // 每次等待 5 分钟
    if result.status == "completed":
        break
```

### 5.2 执行流程图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Phase 执行顺序                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

  dispatch
      │
      │  ┌─────────────────────────────────────────────────────────────────────┐
      ├──│ Phase 1: implement                                                  │
      │  │                                                                     │
      │  │  • 后台启动 (run_in_background: true)                               │
      │  │  • 轮询等待完成 (最多 30 分钟)                                       │
      │  │  • 单次执行，不循环                                                  │
      │  │                                                                     │
      │  └─────────────────────────────────────────────────────────────────────┘
      │
      │  implement 完成后
      ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Phase 2: check                                                              │
  │                                                                             │
  │  • 后台启动                                                                 │
  │  • 循环执行 (最多 5 次，由 ralph-loop.py 控制)                               │
  │  • 验证 lint/typecheck 通过                                                 │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
      │
      │  check 完成后
      ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Phase 3: finish (可选)                                                       │
  │                                                                             │
  │  • 最终验证                                                                 │
  │  • 更新 spec 文档（如果发现新模式）                                          │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
      │
      │  finish 完成后
      ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Phase 4: create-pr                                                          │
  │                                                                             │
  │  • 唯一执行 git commit 的阶段                                                │
  │  • 创建 PR                                                                  │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 超时设置

| Phase | 最大时间 | 轮询次数 | 每次等待 |
|-------|----------|----------|----------|
| implement | 30 min | 6 次 | 5 min |
| check | 15 min | 3 次 | 5 min |
| debug | 20 min | 4 次 | 5 min |

---

## 6. 与其他 Agent 的关系

### 6.1 Agent 协作图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Agent 协作关系                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────────┐
                          │      用户请求        │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │    research Agent    │
                          │    (纯研究/搜索)      │
                          │    只读，不修改       │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │     plan Agent       │
                          │    (任务规划)         │
                          │    创建任务目录       │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   dispatch Agent     │
                          │    (调度器)           │
                          │    串行调度 phases    │
                          └──────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ implement Agent │───►│  check Agent    │───►│  finish Agent   │
    │  (代码实现)      │    │  (质量检查)      │    │  (最终验证)      │
    │  单次执行        │    │  循环执行        │    │  单次执行        │
    │  禁止 commit     │    │  最多 5 次       │    │  可更新 spec     │
    └─────────────────┘    └────────┬────────┘    └─────────────────┘
                                     │
                                     │ 如果发现问题
                                     ▼
                          ┌──────────────────────┐
                          │    debug Agent       │
                          │    (问题修复)         │
                          │    精确修复，不重构    │
                          └──────────────────────┘
```

### 6.2 职责对比

| Agent | 职责 | Git 权限 | 执行模式 |
|-------|------|----------|----------|
| **research** | 搜索/分析代码 | 只读 | 单次 |
| **plan** | 规划任务 | 可写 | 单次 |
| **dispatch** | 调度 phases | 只读 | 主进程 |
| **implement** | 实现代码 | 禁止 commit | 单次 |
| **check** | 验证代码 | 可修改 | 循环 (最多 5 次) |
| **debug** | 修复问题 | 可修改 | 单次 |

---

## 7. 代码示例

### 7.1 dispatch 调用 implement

```typescript
// dispatch.md 第 68-86 行

Task(
  subagent_type: "implement",
  prompt: "Implement the feature described in prd.md in the task directory",
  model: "opus",
  run_in_background: true
)

// Hook 自动注入:
// - implement.jsonl 中的所有 spec 文件
// - prd.md (需求文档)
// - info.md (技术设计，如果存在)
```

### 7.2 implement 输出格式

```markdown
## Implementation Complete

### Files Modified

- `src/components/Feature.tsx` - New component
- `src/hooks/useFeature.ts` - New hook

### Implementation Summary

1. Created Feature component...
2. Added useFeature hook...

### Verification Results

- Lint: Passed
- TypeCheck: Passed
```

### 7.3 超时处理

```markdown
// dispatch.md 第 188-197 行

If a subagent times out, notify the user and ask for guidance:

"Subagent implement timed out after 30 min. Options:
1. Retry the same phase
2. Skip to next phase
3. Abort the pipeline"
```

---

## 8. 设计原则

### 8.1 核心原则

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Implement Agent 设计原则                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

  1. 遵循现有代码模式
     └─> 不引入新的架构模式，保持一致性

  2. 只做必需的
     └─> 不过度工程，不添加未请求的功能

  3. 保持代码可读
     └─> 清晰的命名，适当的注释

  4. 自我验证
     └─> 实现后运行 lint 和 typecheck

  5. 不提交代码
     └─> 让用户审核后手动提交
```

### 8.2 禁止行为

| 禁止行为 | 原因 |
|----------|------|
| `git commit` | 必须人工审核 |
| `git push` | 防止意外发布 |
| `git merge` | 防止分支混乱 |
| 过度工程 | 保持简洁 |
| 添加未请求功能 | 遵循需求 |

---

## 9. 总结

### 9.1 关键特性

| 特性 | 描述 |
|------|------|
| **定位** | 代码实现专家 |
| **执行模式** | 串行、单次、后台运行 |
| **最大时间** | 30 分钟 |
| **权限** | 可读写文件，禁止 git commit |
| **上下文** | 通过 Hook 自动注入 specs 和需求 |
| **验证** | 自行运行 lint 和 typecheck |

### 9.2 在流水线中的位置

```
research → plan → dispatch → [implement → check → finish] → create-pr
                              └─────────────────────────┘
                                   工作树中的执行阶段
```

---

*文档生成时间: 2026-03-26*
