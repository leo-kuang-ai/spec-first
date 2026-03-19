---
title: Trellis 借鉴实施计划
version: 1.0.0
last_updated: 2026-03-01
description: 基于 Trellis 项目分析，制定 spec-first 的具体实施计划
---

# Trellis 借鉴实施计划

> **关联文档**: [trellis-borrowing-analysis.md](./trellis-borrowing-analysis.md)
> **生成时间**: 2026-03-01

---

## 一、实施优先级总览

```
┌─────────────────────────────────────────────────────────────┐
│                    P0 - 立即实施 (1-2 周)                    │
│  Hook 系统 · JSONL 上下文 · Ralph Loop 质量门禁              │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    P1 - 短期实施 (2-4 周)                    │
│  思考指南系统 · Plan 拒绝机制 · Workspace 日志               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    P2 - 中期实施 (1-2 月)                    │
│  迁移系统 · Multi-Agent 整合 · Slash Commands 扩展          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    P3 - 长期规划 (2+ 月)                     │
│  多平台支持 · 模板系统 · 注册表驱动                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、P0: Hook 系统（立即实施）

### 2.1 目标

创建 Hook 系统，实现**上下文自动注入**，让 Skill 专注于业务逻辑。

### 2.2 目录结构

```
.claude/hooks/
├── session-start.ts       # 会话开始时注入 Feature 上下文
├── pre-tool-use.ts        # Task 调用前注入 Skill 上下文
└── subagent-stop.ts       # 质量门禁执行器
```

### 2.3 核心实现

#### 2.3.1 session-start.ts

```typescript
#!/usr/bin/env node
/**
 * SessionStart Hook - 会话开始时注入上下文
 *
 * 功能：
 * 1. 检测 .spec-first/current 恢复提示
 * 2. 注入当前 Feature 状态概览
 * 3. 输出建议的下一步命令
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface SessionContext {
  featureId: string | null;
  currentStage: string;
  currentTask: string | null;
  lastSession: string | null;
}

function getCurrentFeature(): string | null {
  const currentPath = '.spec-first/current';
  if (!existsSync(currentPath)) return null;
  return readFileSync(currentPath, 'utf-8').trim();
}

function getFeatureContext(featureId: string): SessionContext | null {
  const stagePath = `specs/${featureId}/stage-state.json`;
  if (!existsSync(stagePath)) return null;

  const stageState = JSON.parse(readFileSync(stagePath, 'utf-8'));
  return {
    featureId,
    currentStage: stageState.current_stage,
    currentTask: stageState.current_task || null,
    lastSession: stageState.last_session || null
  };
}

function main() {
  const featureId = getCurrentFeature();

  if (!featureId) {
    // 无活跃 Feature，提示初始化
    console.log(JSON.stringify({
      message: `
📋 Spec-First 准备就绪

建议命令：
- spec-first init --feat <abbr> --mode N --size M  # 创建新 Feature
- spec-first feature list                            # 列出已有 Feature
`
    }));
    return;
  }

  const context = getFeatureContext(featureId);
  if (!context) {
    console.log(JSON.stringify({
      message: `
⚠️ Feature ${featureId} 配置缺失

建议命令：
- spec-first doctor ${featureId}  # 诊断修复
`
    }));
    return;
  }

  // 输出恢复提示
  console.log(JSON.stringify({
    message: `
📋 恢复会话: ${featureId}
阶段: ${context.currentStage}
${context.currentTask ? `当前任务: ${context.currentTask}` : ''}

建议命令：
- spec-first ai catchup ${featureId}  # 完整上下文恢复
- spec-first stage current ${featureId}  # 查看阶段状态
`
    }));
}

main();
```

#### 2.3.2 pre-tool-use.ts

```typescript
#!/usr/bin/env node
/**
 * PreToolUse Hook - Task 调用前注入上下文
 *
 * 参考 Trellis 的 inject-subagent-context.py
 *
 * 功能：
 * 1. 拦截 Task 工具调用
 * 2. 根据 subagent_type 加载对应上下文
 * 3. 从 JSONL 文件读取上下文定义
 * 4. 组装完整 prompt 返回
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Agent 类型映射
const AGENT_TYPES = {
  implement: '04_implement',
  check: '04_implement',
  debug: '04_implement',
  research: 'any'
};

// 从 JSONL 读取上下文
function readJsonlContext(basePath: string, jsonlPath: string): string[] {
  const fullPath = resolve(basePath, jsonlPath);
  if (!existsSync(fullPath)) return [];

  const lines = readFileSync(fullPath, 'utf-8').split('\n');
  const contexts: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      const filePath = entry.file || entry.path;
      if (filePath && existsSync(resolve(basePath, filePath))) {
        const content = readFileSync(resolve(basePath, filePath), 'utf-8');
        contexts.push(`=== ${filePath} ===\n${content}`);
      }
    } catch (e) {
      // 跳过解析错误
    }
  }

  return contexts;
}

// 构建 Implement Agent 上下文
function buildImplementContext(featureId: string, taskDir: string): string {
  const contexts: string[] = [];

  // 1. 读取 implement.jsonl
  const implementContext = readJsonlContext('.', `specs/${featureId}/${taskDir}/implement.jsonl`);
  contexts.push(...implementContext);

  // 2. 读取 spec.md
  const specPath = `specs/${featureId}/spec.md`;
  if (existsSync(specPath)) {
    contexts.push(`=== spec.md (Requirements) ===\n${readFileSync(specPath, 'utf-8')}`);
  }

  // 3. 读取 design.md
  const designPath = `specs/${featureId}/design.md`;
  if (existsSync(designPath)) {
    contexts.push(`=== design.md (Technical Design) ===\n${readFileSync(designPath, 'utf-8')}`);
  }

  return contexts.join('\n\n');
}

// 构建 Check Agent 上下文
function buildCheckContext(featureId: string, taskDir: string): string {
  const contexts: string[] = [];

  // 1. 读取 check.jsonl
  const checkContext = readJsonlContext('.', `specs/${featureId}/${taskDir}/check.jsonl`);
  contexts.push(...checkContext);

  // 2. 读取 Gate 条件
  // TODO: 调用 spec-first gate conditions

  return contexts.join('\n\n');
}

function main() {
  // 读取 stdin
  let input: any;
  try {
    input = JSON.parse(readFileSync(0, 'utf-8').toString());
  } catch (e) {
    process.exit(0);
  }

  // 只处理 Task 工具
  if (input.tool_name !== 'Task') {
    process.exit(0);
  }

  const subagentType = input.tool_input?.subagent_type;
  const originalPrompt = input.tool_input?.prompt || '';

  // 获取当前 Feature
  const featureId = getCurrentFeature();
  if (!featureId) process.exit(0);

  // 获取当前任务
  const taskDir = getCurrentTask(featureId);
  if (!taskDir) process.exit(0);

  // 构建上下文
  let context = '';
  let newPrompt = originalPrompt;

  switch (subagentType) {
    case 'implement':
      context = buildImplementContext(featureId, taskDir);
      newPrompt = buildImplementPrompt(originalPrompt, context);
      break;
    case 'check':
      context = buildCheckContext(featureId, taskDir);
      newPrompt = buildCheckPrompt(originalPrompt, context);
      break;
    // ... 其他类型
  }

  // 返回更新后的输入
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: {
        ...input.tool_input,
        prompt: newPrompt
      }
    }
  }));
}

main();
```

#### 2.3.3 subagent-stop.ts (Ralph Loop)

```typescript
#!/usr/bin/env node
/**
 * SubagentStop Hook - 质量门禁执行器
 *
 * 参考 Trellis 的 ralph-loop.py
 *
 * 功能：
 * 1. 拦截 check agent 的停止请求
 * 2. 检查完成标记
 * 3. 运行验证命令
 * 4. 决定允许或阻止停止
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const MAX_ITERATIONS = 5;
const STATE_FILE = '.spec-first/.ralph-state.json';

interface RalphState {
  featureId: string;
  iteration: number;
  startedAt: string;
}

// 获取完成标记
function getCompletionMarkers(featureId: string): string[] {
  const checkJsonlPath = `specs/${featureId}/check.jsonl`;
  if (!existsSync(checkJsonlPath)) return ['ALL_CHECKS_FINISH'];

  const markers: string[] = [];
  const lines = readFileSync(checkJsonlPath, 'utf-8').split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.reason) {
        markers.push(`${entry.reason.toUpperCase().replace(/ /g, '_')}_FINISH`);
      }
    } catch (e) {}
  }

  return markers.length > 0 ? markers : ['ALL_CHECKS_FINISH'];
}

// 检查完成标记是否存在于输出中
function checkCompletion(output: string, markers: string[]): { complete: boolean; missing: string[] } {
  const missing = markers.filter(m => !output.includes(m));
  return { complete: missing.length === 0, missing };
}

// 运行验证命令
function runVerifyCommands(commands: string[]): { passed: boolean; message: string } {
  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: 'pipe', timeout: 120000 });
    } catch (e: any) {
      const stderr = e.stderr?.toString() || e.stdout?.toString() || '';
      return { passed: false, message: `Command failed: ${cmd}\n${stderr.slice(0, 500)}` };
    }
  }
  return { passed: true, message: 'All verify commands passed' };
}

// 加载状态
function loadState(): RalphState | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// 保存状态
function saveState(state: RalphState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function main() {
  // 读取 stdin
  let input: any;
  try {
    input = JSON.parse(readFileSync(0, 'utf-8').toString());
  } catch (e) {
    process.exit(0);
  }

  // 只处理 SubagentStop 事件
  if (input.hook_event_name !== 'SubagentStop') {
    process.exit(0);
  }

  // 只控制 check agent
  const subagentType = input.subagent_type;
  if (subagentType !== 'check') {
    process.exit(0);
  }

  // 跳过 finish 阶段
  const prompt = input.prompt || '';
  if (prompt.toLowerCase().includes('[finish]')) {
    process.exit(0);
  }

  // 获取当前 Feature
  const featureId = getCurrentFeature();
  if (!featureId) process.exit(0);

  // 加载状态
  let state = loadState();
  const agentOutput = input.agent_output || '';

  // 检查是否需要重置
  if (!state || state.featureId !== featureId) {
    state = {
      featureId,
      iteration: 0,
      startedAt: new Date().toISOString()
    };
  }

  // 增加迭代次数
  state.iteration++;
  saveState(state);

  // 最大迭代检查
  if (state.iteration >= MAX_ITERATIONS) {
    state.iteration = 0;
    saveState(state);
    console.log(JSON.stringify({
      decision: 'allow',
      reason: `Max iterations (${MAX_ITERATIONS}) reached. Stopping to prevent infinite loop.`
    }));
    process.exit(0);
  }

  // 获取完成标记
  const markers = getCompletionMarkers(featureId);
  const { complete, missing } = checkCompletion(agentOutput, markers);

  if (complete) {
    // 所有检查完成
    state.iteration = 0;
    saveState(state);
    console.log(JSON.stringify({
      decision: 'allow',
      reason: 'All completion markers found. Check phase complete.'
    }));
  } else {
    // 缺少标记，阻止停止
    console.log(JSON.stringify({
      decision: 'block',
      reason: `Iteration ${state.iteration}/${MAX_ITERATIONS}. Missing markers: ${missing.join(', ')}

IMPORTANT: You must ACTUALLY run the checks, not just output the markers.
- Did you run lint? What was the output?
- Did you run typecheck? What was the output?
- Did they actually pass with zero errors?

Only output a marker AFTER you have executed the corresponding command.`
    }));
  }
}

main();
```

### 2.4 JSONL 上下文格式

在 Feature 目录下创建上下文定义文件：

```
specs/<featureId>/
├── contexts/
│   ├── implement.jsonl    # 实现阶段上下文
│   ├── check.jsonl        # 检查阶段上下文
│   └── debug.jsonl        # 调试阶段上下文
```

**implement.jsonl 示例**:
```jsonl
{"file": "specs/AUTH/constitution.md", "reason": "Project principles"}
{"file": "specs/AUTH/design.md", "reason": "Technical design"}
{"file": "CLAUDE.md", "reason": "Coding standards"}
{"file": ".trellis/spec/backend/index.md", "reason": "Backend guidelines"}
```

**check.jsonl 示例**:
```jsonl
{"file": "specs/AUTH/checklist.md", "reason": "Acceptance checklist"}
{"file": ".trellis/spec/backend/quality-guidelines.md", "reason": "QualityCheck"}
{"file": ".trellis/spec/guides/cross-layer-thinking-guide.md", "reason": "CrossLayerCheck"}
```

### 2.5 实施步骤

1. **创建 Hook 目录** (1 天)
   ```bash
   mkdir -p .claude/hooks
   ```

2. **实现 session-start.ts** (1 天)
   - 读取 .spec-first/current
   - 输出恢复提示

3. **实现 pre-tool-use.ts** (2 天)
   - JSONL 解析
   - 上下文组装
   - Prompt 模板

4. **实现 subagent-stop.ts** (2 天)
   - 完成标记检测
   - 状态管理
   - 验证命令执行

5. **配置 settings.json** (0.5 天)
   ```json
   {
     "hooks": {
       "SessionStart": ".claude/hooks/session-start.ts",
       "PreToolUse": ".claude/hooks/pre-tool-use.ts",
       "SubagentStop": ".claude/hooks/subagent-stop.ts"
     }
   }
   ```

6. **测试与调优** (2 天)
   - 单元测试
   - 集成测试
   - 边界情况处理

---

## 三、P1: 思考指南系统（短期实施）

### 3.1 目标

创建结构化的思考指南，帮助 AI 避免常见陷阱。

### 3.2 目录结构

```
specs/
└── .guides/
    ├── README.md                    # 索引
    ├── cross-layer-thinking.md      # 跨层思考
    ├── debugging-thinking.md        # 调试思考
    ├── api-design-thinking.md       # API 设计思考
    └── error-handling-thinking.md   # 错误处理思考
```

### 3.3 指南模板

```markdown
# [指南名称] 思考指南

> **目的**: [简述指南目的]

---

## 常见问题

**[问题描述]**

常见错误：
- [错误1]
- [错误2]

---

## 实施前检查

### Step 1: [步骤名称]

[步骤描述]

对于每个检查点，问：
- [问题1]?
- [问题2]?

### Step 2: [步骤名称]

...

---

## 检查清单

实施前：
- [ ] [检查项1]
- [ ] [检查项2]

实施后：
- [ ] [验证项1]
- [ ] [验证项2]

---

## 何时使用

- [场景1]
- [场景2]
```

### 3.4 与 Gate 集成

在 Gate 条件中引用指南：

```json
{
  "stage": "04_implement",
  "conditions": [
    {
      "id": "G4-01",
      "description": "Cross-layer verification",
      "type": "manual",
      "reference": "specs/.guides/cross-layer-thinking.md"
    }
  ]
}
```

---

## 四、P1: Plan 拒绝机制（短期实施）

### 4.1 目标

在 `03-spec` Skill 中增加需求拒绝机制，及早发现不清晰的需求。

### 4.2 拒绝条件

```typescript
interface RejectionReason {
  category: 'unclear' | 'incomplete' | 'out_of_scope' | 'harmful' | 'too_large';
  details: string;
  suggestions: string[];
}

const REJECTION_CONDITIONS = {
  unclear: [
    /make it better/i,
    /fix the bugs/i,
    /improve performance/i,
    /optimize/i
  ],
  incomplete: [
    /tbd/i,
    /待定/,
    /\?\?\?/
  ],
  too_large: [
    // 检测多个不相关功能
  ]
};
```

### 4.3 拒绝流程

1. **检测拒绝条件**
2. **创建 REJECTED.md**
3. **更新 spec 状态**
4. **输出拒绝摘要**

### 4.4 REJECTED.md 模板

```markdown
# 需求拒绝报告

## 拒绝原因

**类别**: [unclear | incomplete | out_of_scope | harmful | too_large]

## 详细说明

[具体解释为什么被拒绝]

## 建议

- [建议1]
- [建议2]

## 重试步骤

1. 删除当前目录（可选）
2. 使用修订后的需求重新执行：
   ```bash
   spec-first spec <featureId>
   ```
```

---

## 五、P1: Workspace 日志系统（短期实施）

### 5.1 目标

自动记录会话历史，支持跨会话追溯。

### 5.2 实现

扩展现有的 `findings.md` 机制：

```typescript
interface SessionLog {
  timestamp: string;
  action: string;
  featureId: string;
  taskId: string | null;
  summary: string;
  commits: string[];
}

function recordSession(log: SessionLog): void {
  const logPath = `specs/${log.featureId}/sessions.jsonl`;
  const entry = JSON.stringify({
    ...log,
    timestamp: new Date().toISOString()
  });
  appendFileSync(logPath, entry + '\n');
}
```

### 5.3 CLI 命令

```bash
# 记录会话
spec-first session record --feature <id> --title "Title" --summary "Summary"

# 查看历史
spec-first session history --feature <id> [--limit N]

# 恢复上下文
spec-first ai catchup <featureId>
```

---

## 六、风险与缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Hook 系统复杂度高 | 开发周期延长 | 采用渐进式实施，先实现核心功能 |
| JSONL 格式学习成本 | 团队适应慢 | 提供模板和文档，自动化生成工具 |
| Ralph Loop 误阻断 | 用户体验差 | 提供跳过机制，明确错误提示 |
| 思考指南维护成本 | 内容过时 | 与 Gate 条件关联，强制同步更新 |

---

## 七、验收标准

### P0 验收

- [ ] `session-start.ts` 能正确输出恢复提示
- [ ] `pre-tool-use.ts` 能注入 JSONL 定义的上下文
- [ ] `subagent-stop.ts` 能正确检测完成标记
- [ ] Hook 在 Claude Code 中正常工作

### P1 验收

- [ ] 至少创建 3 个思考指南
- [ ] `03-spec` Skill 支持需求拒绝
- [ ] 会话日志能正确记录和查询

---

## 八、时间估算

| 阶段 | 工作量 | 日历时间 |
|------|--------|----------|
| P0: Hook 系统 | 8-10 人天 | 1-2 周 |
| P1: 思考指南 | 3-5 人天 | 1 周 |
| P1: 拒绝机制 | 2-3 人天 | 3 天 |
| P1: Workspace 日志 | 2-3 人天 | 3 天 |
| **总计** | **15-21 人天** | **3-4 周** |

---

*生成时间: 2026-03-01* | *版本: v1.0.0*
