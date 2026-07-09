# spec-first init 优化技术方案

## 一、战略论证

### 1.1 为什么现在做

**驱动信号：**

1. **扩展性即将触及临界** — 当前 5 宿主已使 UNREWRITTEN_PATH_PATTERNS 达到 O(n²) 维护负债。Kiro 刚接入时已触发全部 4 个现有 adapter 的修改。社区已有 Windsurf、Augment 等新 IDE 采用 AGENTS.md 标准，第 6 个宿主接入需求可预见。
2. **Qoder hooks 功能缺口** — spec-first 本身运行在 Qoder 环境中，但 Qoder CLI 的 shell-command hooks 仍未覆盖；其事件、matcher、stdout 与配置兼容性需按 Qoder CLI 协议单独验证，这意味着 spec-first 在自己的宿主上缺少 confirmed governance injection。
3. **init.js 3055 行已成维护瓶颈** — 任何 init 逻辑的修改（如上述 Qoder hooks 添加）都需要导航 3000+ 行文件，增加回归风险。
4. **对齐核心链路** — 重构使新宿主扩展从 3-5 天降至 1 天，直接提升 `Codebase → Spec → Plan → Tasks → Code → Review → Knowledge` 链路的覆盖面（更多宿主 = 更多用户可触达 workflow）。

**核心判断对齐（AGENTS.md）：**
> 这次改动是否让 AI coding 从一次性对话，进一步走向可治理、可验证、可复用、可沉淀的工程闭环？

答：是。通过降低宿主扩展成本 + 补齐 Qoder governance hooks + 提升可维护性，使 spec-first harness 的价值更可被更多宿主的用户识别和使用。

### 1.2 非目标（Non-Goals）

本方案明确 **不做** 以下事项：

| 不做 | 原因 |
|------|------|
| 引入外部 adapter 插件系统 | 当前 5+1 宿主规模不需要插件发现机制 |
| 改变 CLI flags、退出码或既有语义 | 允许新增 Qoder CLI hooks 相关 dry-run operation、doctor checks 和 clean cleanup；这是用户可见增强但不是 breaking change |
| 重构 state.json schema | state 模型正确，保持稳定 |
| 修改 skills-governance.json 格式 | governance 合约稳定，只扩展 scope |
| 触碰 dual-host governance contract schema | 契约由独立 schema 管理 |
| 替代宿主即将商品化的能力 | 不重建 session resume、MCP discovery 等 |
| 自动更新用户 CLI 版本 | 保持 read-only 提醒策略 |

### 1.3 用户体验影响承诺

除明确声明的新增能力外，每个 Phase 的行为不变量：

| 不变量 | 验证方式 |
|--------|----------|
| `spec-first init --dry-run` 既有 operation 的 kind/path/reason 不变 | golden snapshot 对比；Phase 0 只允许新增 Qoder CLI hook operations |
| `spec-first doctor` 既有诊断项和 level 不变 | 回归测试断言；Phase 0 只允许新增 Qoder CLI hook checks |
| `spec-first clean` 能处理旧版本安装的产物 | legacy state 测试 |
| 错误消息、退出码保持不变 | CLI smoke test |
| state.json 格式向后兼容 | schema validation test |

### 1.4 Source/Runtime 边界声明

本方案所有变更均为 **source 变更**（`src/cli/`、`templates/`）。不手改 generated runtime assets（`.claude/`、`.codex/`、`.qoder/` 等）。source 变更后通过 `spec-first init` 重新生成 runtime。

---

## 二、现状诊断

### 2.1 架构概览

```text
CLI Entry (bin/spec-first.js)
  → dispatch (src/cli/index.js, 225L)
    → runInit (src/cli/commands/init.js, 3055L)
      → parseInitArgs()          -- CLI 参数解析
      → collectInitInput()       -- 交互式输入收集
      → buildInitPlans()         -- per-platform plan 构建
      → applyInitPlan()          -- plan 执行 + rollback
      依赖:
        plugin.js (1467L)        -- Governance-based asset filtering
        state.js (769L)          -- Operation plan model + safety
        developer.js (264L)      -- Global identity management
        claude-settings.js (439L) -- Claude hook matcher management
        atomic-write.js (85L)    -- Windows-aware atomic writes
      平台适配 (adapters/):
        claude.js (425L), codex.js (845L), cursor.js (675L),
        kiro.js (435L), qoder.js (553L)
        总计 ~2930 行
```

### 2.2 核心优势（应保留）

| 能力 | 实现 | 评价 |
|------|------|------|
| Operation Plan 声明式模型 | state.js: plan→preview→apply | 优秀 |
| Atomic Write + Windows EPERM Retry | atomic-write.js: tmp→rename + 10x retry | 优秀 |
| Rollback Backup | init.js: destructive reset 前备份+恢复 | 良好 |
| Adapter 抽象接口 | base.js PlatformAdapter | 良好 |
| Runtime Drift Detection | inspectCurrentRuntimeDrift() | 良好 |
| Path 安全校验 | state.js: symlink escape, Windows reserved, containment | 优秀 |
| Governance 分层过滤 | plugin.js: dual_host/host_exclusive/delivery mode | 良好 |
| Hook merge non-destructive | 保留用户自定义 hooks，只替换 managed entries | 优秀 |

### 2.3 核心问题

| 编号 | 问题 | 严重度 | 影响 |
|------|------|--------|------|
| P0 | init.js 3055L 混合 6+ 职责 | 高 | 任何修改需导航全文，回归风险大 |
| P1 | Adapter O(n²) 排除列表 | 高 | 新宿主接入需修改所有现有 adapter |
| P2 | Plugin.js 1467L 无分层 | 中 | 理解成本高，修改影响面大 |
| P3 | Qoder hooks 完全缺失 | 中 | 功能缺口，spec-first 在自身宿主无 governance |
| P4 | 平台兼容性缺口（UNC、WSL） | 低 | 企业环境特定场景 |
| P5 | 多宿主串行执行 | 低 | 性能浪费但实际 ~2s |

### 2.4 生命周期对称性

```text
┌──────────────────────────────────────────────────────────────────┐
│                    spec-first CLI Lifecycle                       │
├────────────┬──────────────┬─────────────┬────────────────────────┤
│  init      │  update      │  clean      │  doctor                │
│  (安装)    │  (更新)      │  (卸载)     │  (诊断)                │
├────────────┼──────────────┼─────────────┼────────────────────────┤
│ Plan-based │ 委托 init    │ Plan-based  │ Adapter-driven 检查     │
│ dry-run ✓  │ dry-run ✗    │ dry-run ✓   │ JSON report ✓          │
│ rollback ✓ │ npm 幂等     │ 不可逆      │ host-specific checks   │
│ 多宿主 ✓   │ 自动检测     │ 单宿主限制  │ 自动检测已装宿主        │
└────────────┴──────────────┴─────────────┴────────────────────────┘
```

安装核心流程：
```text
收集输入 → 加载manifest → governance过滤 → 构建plan → preview → apply → 写state
```

### 2.5 最佳实践对标

| 原则 | 业界实践 | spec-first 现状 | 评价 |
|------|---------|-----------------|------|
| 幂等性 | init 多次结果一致 | drift detection + hard reset | 良好 |
| Dry-run | 安装前预览 | `--dry-run` 全覆盖 | 优秀 |
| 原子性 | 失败可回滚 | rollback backup | 良好 |
| 声明式 | 描述目标而非步骤 | Operation Plan 模型 | 优秀 |
| 状态追踪 | 知道管理了什么 | state.json per-host | 良好 |
| 安全卸载 | 只删自己管理的 | state-driven removal | 优秀 |
| 跨平台 | 单一实现跨 OS | 纯 Node.js | 优秀 |
| O(1) 扩展 | 新插件不改已有 | ❌ O(n²) 排除列表 | **需改进** |

---

## 三、各宿主合规性分析

### 3.1 产物目录 vs 官方最佳实践

#### Claude Code（2025.07 确认）

| 官方规范 | spec-first 使用 | 符合 |
|---------|----------------|------|
| `CLAUDE.md` — 项目指令 | ✅ instructionFile | 符合 |
| `.claude/settings.json` — hooks/权限 | ✅ hooks 写入此处 | 符合 |
| `.claude/skills/` — 可复用 prompt | ✅ skillsRoot | 完全符合 |
| `.claude/commands/` — 单文件命令 | ✅ commandRoot（官方标注 skills 优先） | 符合 |
| `.claude/agents/` — 子 agent | ✅ agentsRoot | 符合 |
| `.claude/hooks/` — Hook 脚本 | ✅ 4 个 managed hook | 完全符合 |
| `.claude/workflows/` — JS workflow | ❌ 用 `.claude/spec-first/workflows/`（SKILL.md 格式非 JS） | 合理偏离 |

**结论：高度符合**。workflows 路径偏离是合理隔离（格式不同）。

#### Codex

| 官方规范 | spec-first 使用 | 符合 |
|---------|----------------|------|
| `AGENTS.md` — 项目指令 | ✅ instructionFile | 符合 |
| `.codex/hooks/` + `hooks.json` | ✅ SessionStart hook | 符合 |
| `.agents/skills/` — 共享 skills | ✅ skillsRoot（非 `.codex/skills`） | 完全符合 |
| `.codex/agents/` | ✅ agentsRoot | 符合 |

**结论：完全符合**。

#### Cursor

| 官方规范 | spec-first 使用 | 符合 |
|---------|----------------|------|
| `.cursor/rules/` — path-scoped 规则 | ✅ pointer 文件 | 符合 |
| `.cursor/skills/` — SKILL.md + frontmatter | ✅ skillsRoot | 符合 |
| Hooks | ❌ **Cursor 不支持 hooks** | ⛔ 正确跳过 |

**结论：完全符合**。

#### Kiro

| 官方规范 | spec-first 使用 | 符合 |
|---------|----------------|------|
| `.kiro/steering/` — 核心 context | ✅ pointer 文件 | 符合 |
| `.kiro/skills/` | ✅ skillsRoot | 符合 |
| `.kiro/hooks/` — agent-prompt hooks | ❌ 未安装（模型不兼容） | ⚠️ 合理 |

**结论：基本符合**。Kiro hooks 是 agent-prompt 模型（非 shell），适配成本高收益低。

#### Qoder

| 官方规范 | spec-first 使用 | 符合 |
|---------|----------------|------|
| `.qoder/rules/` | ✅ pointer 文件 | 符合 |
| `.qoder/skills/` | ✅ skillsRoot | 符合 |
| `.qoder/commands/` | ✅ commandRoot | 符合 |
| `.qoder/settings.json` → hooks | ❌ **未安装** | ⚠️ **可行缺口** |

**结论：产物目录符合，hooks 是可行增强项。**

#### 总结对照

| 宿主 | 目录合规 | Hooks 平台支持 | spec-first hooks 覆盖 | 差距 |
|------|---------|--------------|---------------------|------|
| Claude | ✅ 完全 | ✅ Shell hooks | ✅ 4 hooks（最完整） | 无 |
| Codex | ✅ 完全 | ✅ Shell hooks | ⚠️ SessionStart only | 缺 guard hooks |
| Cursor | ✅ 完全 | ❌ 不支持 | ⛔ 正确跳过 | 无 |
| Kiro | ✅ 基本 | ⚠️ Agent-prompt（非 shell） | ❌ 未覆盖 | 模型不兼容 |
| Qoder CLI | ✅ 完全 | ✅ Shell hooks（需按 Qoder CLI 文档确认配置形态） | ❌ **未覆盖** | **本轮可修复** |
| Qoder IDE/JB plugin | ✅ 基本 | ⚠️ Hooks surface 存在但配置/exec-form/协议需单独验证 | ❌ **未覆盖** | follow-up，不纳入本轮 confirmed scope |

### 3.2 Hook 设计深度分析

#### 当前 Hook 清单

| Hook | 事件 | 宿主 | 功能 |
|------|------|------|------|
| session-start | SessionStart | Claude/Codex | workflow entry governance + version reminder |
| spec-plan-guard | UserPromptExpansion | Claude | `/spec-plan` 命令展开时注入约束 |
| prd-prewrite-guard | PreToolUse | Claude | Write/Edit 前检查 PRD 上下文 |
| prd-readiness-guard | Stop | Claude | 任务结束时检查 PRD readiness |

#### 设计优点

1. **Cross-platform Node.js** — `#!/usr/bin/env node`，macOS/Linux/Windows 均可运行
2. **Exec-form hooks** — Claude 使用 `{command: "node", args: [path]}` 避免 shell 差异
3. **Degraded-mode safe** — try/catch 包裹 I/O，失败注入 fallback 而非 abort
4. **幂等覆盖** — 每次 init 覆盖写入 + drift detection
5. **Merge non-destructive** — Codex hooks.json 合并保留用户自定义
6. **Global pollution detection** — Codex 检测 CODEX_HOME 级全局 hook 污染

#### Qoder 支持范围与事件模型兼容性分析

**本轮支持范围**：Phase 0 只把 **Qoder CLI hooks** 纳入 confirmed scope。Qoder IDE/JB plugin hooks 作为 follow-up compatibility spike，不在本轮写入 confirmed runtime contract，也不把 IDE/JB 的 hooks 行为当作 `spec-first init --qoder` 成功标准。

理由：
- `spec-first init` 是 CLI 分发的 runtime projection，先覆盖 Qoder CLI 能最小闭环验证 init/doctor/clean/drift。
- Qoder CLI hooks 与 IDE/JB plugin hooks 属于不同宿主 surface；二者共享项目级 `.qoder/settings.json` 等配置文件，但不能直接假设 exec-form `{ command, args }`、matcher 与 stdout 控制协议在所有 surface 上完全一致。
- IDE/JB plugin 支持需要单独产出 confirmed evidence 后再从 degraded/follow-up 升级为 confirmed capability。

| Claude 事件 | Qoder 事件 | stdin/stdout 协议 | 兼容性 |
|------------|-----------|------------------|--------|
| SessionStart | UserPromptSubmit | ⚠️ 不同触发时机 | 需适配 |
| UserPromptExpansion | UserPromptSubmit | ⚠️ Qoder 无独立 expansion 事件；Phase 0 不迁移 spec-plan-guard | 不兼容 |
| PreToolUse | PreToolUse | ✅ 相同 | 完全兼容 |
| PostToolUse | PostToolUse | ✅ 相同 | 完全兼容 |
| Stop | Stop | ✅ 相同 | 完全兼容 |

**关键差异**：
- Qoder 没有 `SessionStart` 事件，最近似的是 `UserPromptSubmit`（用户提交首次 prompt 时触发）
- `UserPromptSubmit` 与 `UserPromptExpansion` 都在 prompt 到达模型前触发，但 Qoder 的是统一 prompt 事件，不能按 tool/command name matcher 等价迁移 Claude 的 command expansion guard
- Qoder CLI hooks 配置写入 `.qoder/settings.json` 的 `hooks` key；schema 必须以 Qoder CLI 当前文档和本地 smoke 验证为准，不复用“与 Claude 完全一致”的未验证断言

**Qoder hooks 适配策略**：

| Claude hook | Qoder 映射 | 可行性 | 优先级 |
|------------|-----------|--------|--------|
| session-start → SessionStart | UserPromptSubmit（首次触发） | ⚠️ 需验证触发时机与 stdin/stdout 协议 | 高 |
| spec-plan-guard → UserPromptExpansion | 不迁移；未来若需要只能做 prompt-content inspection hook | ⛔ Phase 0 不安装 | 低 |
| prd-prewrite-guard → PreToolUse | PreToolUse | ✅ 直接移植 | 高 |
| prd-readiness-guard → Stop | Stop | ✅ 直接移植 | 高 |

### 3.3 更新感知机制（已有，需小幅增强）

当前已实现完整版本提醒体系（version-reminder.js, 790L）：
- CLI 命令触发 + session hook 触发双通道
- 24h 冷却 + per-version-pair 冷却
- CI/非 TTY 自动跳过
- 严格 read-only（只提示不安装）

**唯一增强建议**：增加 `--skip <version>` 精确跳过某版本提醒（0.5 天工作量）。

---

## 四、优化方案

### 4.1 设计哲学

```text
目标状态 = f(source_skills, governance_rules, platform_registry)
当前状态 = read(state.json) + scan(disk)
操作计划 = diff(目标状态, 当前状态)
执行 = apply(操作计划) with rollback
```

优化不是重新设计，而是让实现与设计意图对齐：拆分职责、消除重复、数据驱动。

### 4.2 Platform Registry（消除 O(n²) 的关键）

```javascript
// src/cli/adapters/platform-registry.js (~120L)
const PLATFORM_REGISTRY = {
  claude: {
    runtimeRoot: '.claude',
    managedRoot: '.claude/spec-first',
    skillsRoot: '.claude/skills',
    workflowsRoot: '.claude/spec-first/workflows',
    agentsRoot: '.claude/agents',
    commandRoot: '.claude/commands',
    hooksDir: '.claude/hooks',
    settingsFile: '.claude/settings.json',
    capabilities: { shellHooks: true },
    // 用于自动派生排除列表的路径规则
    runtimePathRules: [
      { prefix: '.claude/commands/spec', suffixPattern: '/[a-z-]+\\.md' },
      { prefix: '.claude/commands/spec-', suffixPattern: '[a-z-]+\\.md' },
      { prefix: '.claude/commands/spec-', suffixPattern: '\\*\\.md' },
      { prefix: '.claude/spec-first/workflows/' },
      { prefix: '.claude/skills/' },
      { prefix: '.claude/agents/' },
    ],
  },
  codex: {
    runtimeRoot: '.codex',
    managedRoot: '.codex/spec-first',
    skillsRoot: '.agents/skills',          // 跨 runtimeRoot
    workflowsRoot: '.agents/skills',
    agentsRoot: '.codex/agents',
    commandRoot: '.codex/commands/spec',
    hooksDir: '.codex/hooks',
    hooksJsonFile: '.codex/hooks.json',
    capabilities: { shellHooks: true },
    runtimePathRules: [
      { prefix: '.codex/commands/spec', suffixPattern: '/[a-z-]+\\.md' },
      { prefix: '.codex/commands/spec-', suffixPattern: '\\*\\.md' },
      { prefix: '.codex/skills/' },
      { prefix: '.codex/agents/' },
      { prefix: '.agents/skills/' },
    ],
  },
  cursor: {
    runtimeRoot: '.cursor',
    managedRoot: '.cursor/spec-first',
    skillsRoot: '.cursor/skills',
    agentsRoot: '.cursor/agents',
    pointerPath: '.cursor/rules/spec-first.mdc',
    capabilities: { shellHooks: false },
    runtimePathRules: [
      { prefix: '.cursor/skills/' },
      { prefix: '.cursor/spec-first/' },
      { prefix: '.cursor/mcp', suffixPattern: '\\.json' },
      { prefix: '.cursor/agents/' },
    ],
  },
  kiro: {
    runtimeRoot: '.kiro',
    managedRoot: '.kiro/spec-first',
    skillsRoot: '.kiro/skills',
    agentsRoot: '.kiro/agents',
    pointerPath: '.kiro/steering/spec-first.md',
    capabilities: { shellHooks: false },
    runtimePathRules: [
      { prefix: '.kiro/commands/spec', suffixPattern: '/[a-z-]+\\.md' },
      { prefix: '.kiro/commands/spec-', suffixPattern: '\\*\\.md' },
      { prefix: '.kiro/skills/' },
      { prefix: '.kiro/agents/' },
      { prefix: '.kiro/spec-first/' },
      { prefix: '.kiro/settings/' },
    ],
  },
  qoder: {
    runtimeRoot: '.qoder',
    managedRoot: '.qoder/spec-first',
    skillsRoot: '.qoder/skills',
    agentsRoot: '.qoder/agents',
    commandRoot: '.qoder/commands',
    pointerPath: '.qoder/rules/spec-first.md',
    settingsFile: '.qoder/settings.json',
    hooksDir: '.qoder/hooks',
    capabilities: { shellHooks: true },
    runtimePathRules: [
      { prefix: '.qoder/commands/spec', suffixPattern: '/[a-z-]+\\.md' },
      { prefix: '.qoder/commands/spec-', suffixPattern: '[a-z-]+\\.md' },
      { prefix: '.qoder/commands/spec-', suffixPattern: '\\*\\.md' },
      { prefix: '.qoder/skills/' },
      { prefix: '.qoder/agents/' },
      { prefix: '.qoder/spec-first/' },
      { prefix: '.qoder/settings', suffixPattern: '(?:\\.local)?\\.json' },
    ],
  },
};
```

### 4.3 自动派生 UNREWRITTEN_PATH_PATTERNS（修正版）

**关键改进**：当前 patterns 不是简单前缀，而是包含字符类（`[a-z-]+`）、可选组（`(?:\.local)?`）等复杂正则。因此 `runtimePathRules` 采用 `{ prefix, suffixPattern }` 格式：

```javascript
/**
 * 为指定 platformId 生成排除其他所有宿主的路径模式。
 * 从 PLATFORM_REGISTRY.runtimePathRules 自动构建正则表达式。
 */
function deriveUnrewrittenPatterns(platformId) {
  const registry = require('./platform-registry');
  return Object.entries(registry.PLATFORM_REGISTRY)
    .filter(([id]) => id !== platformId)
    .flatMap(([, config]) => config.runtimePathRules || [])
    .map(rule => {
      const escaped = escapeForRegex(rule.prefix);
      const suffix = rule.suffixPattern || '';
      return new RegExp(escaped + suffix);
    });
}

function escapeForRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

**锚定策略**：生成的正则不添加 `^` 锚点，以保持与当前硬编码 `UNREWRITTEN_PATH_PATTERNS` 一致的行为。golden snapshot 负责验证匹配字符串集合不变。若未来需要改为锚定匹配，应作为独立的 breaking change 评估。

**验证策略**：golden snapshot 测试必须证明自动派生结果与当前硬编码 patterns **双向等价**，而不是只证明覆盖。若派生结果新增匹配范围，必须把该差异列为 intentional delta，并用独立 fixture 和 changelog 说明用户可见影响。

```javascript
// tests/unit/platform-registry-patterns.test.js
for (const platformId of ['cursor', 'kiro', 'qoder']) {
  it(`derived patterns for ${platformId} match legacy hardcoded set`, () => {
    const derived = deriveUnrewrittenPatterns(platformId);
    const legacy = loadLegacyPatterns(platformId);
    // 验证 1: 每个 legacy pattern 匹配的字符串，derived 也匹配
    for (const testCase of generateTestStringsFromLegacy(legacy)) {
      expect(derived.some(d => d.test(testCase))).toBe(true);
    }
    // 验证 2: derived 不匹配 legacy 未匹配的 representative negatives
    for (const negative of generateRepresentativeNegatives(platformId)) {
      expect(derived.some(d => d.test(negative))).toBe(false);
    }
  });
}
```

**当前需显式处理的差异候选**：
- `.qoder/settings.json` 与 `.qoder/settings.local.json` 是否都应被其他宿主视为 non-target runtime path；当前 Kiro hardcoded pattern 只覆盖 `.qoder/settings.local.json`。
- `.cursor/mcp.json` 是否应保持精确匹配；`prefix: '.cursor/mcp' + suffixPattern: '\\.json'` 会比当前 hardcoded pattern 更宽。

**收益**：
- 添加第 6 个 pointer-only 宿主：只在 registry 添加 `runtimePathRules`，0 行现有 adapter 代码修改
- O(n²) → O(1) 每次 pointer-only 宿主扩展
- 对支持 shell hooks 的新宿主，额外工作限于新增 hooks 模块和设置 `capabilities.shellHooks: true`，仍不修改其他 adapter

### 4.4 PointerBasedAdapter 基类

```text
PlatformAdapter (base.js, 177L — 不变)
├── ClaudeAdapter (独立, ~425L) — hooks×4, settings.json, CLAUDE.md, workflows 独立
├── CodexAdapter (独立, ~845L) — .agents/ 跨域, hooks.json, legacy×4, pollution
└── PointerBasedAdapter (新, ~150L) — pointer sync/removal/inspect + auto-derive patterns
    ├── CursorAdapter (~120L) — .mdc frontmatter, nested scan
    ├── KiroAdapter (~80L) — steering 目录, agent tool list injection
    └── QoderAdapter (~150L) — hasCommands + pointer, agent tool pinning
```

PointerBasedAdapter 封装：
- `planRuntimeFilesSync()` → 统一 `planHostNativePointerSync`，但子类可追加 hook 或 host-specific runtime file operations
- `planRuntimeFilesRemoval()` → 统一 `planHostNativePointerRemoval`，但子类可追加 legacy command namespace、hook file、settings cleanup
- `inspectRuntimeFiles()` → 统一 `inspectHostNativePointer`，但子类必须保留现有 frontmatter、agent tool pinning、workflow skill name rewrite、runtime path rewrite 等 host-specific drift checks
- `getUnrewrittenPathPatterns()` → 从 registry 自动派生

**抽象边界**：PointerBasedAdapter 只封装 pointer lifecycle 和 cross-host runtime path exclusion，不吞并 Cursor/Kiro/Qoder 的 `transformSkillContent`、`transformAgentContent`、frontmatter validation、host pin injection 或 agent tools policy。Phase 3 的验收必须证明现有 warning/error 不减少，除非某项减少被单独记录为 intentional behavior change。

### 4.5 init.js 模块拆分

```text
src/cli/commands/
  init.js              (~250L) 编排入口: parse→collect→build→preview→apply
  init-args.js         (~120L) 参数解析: parseInitArgs, INIT_PLATFORM_CHOICES
  init-input.js        (~200L) 交互收集: collectInitInput, prompts
  init-plan.js         (~400L) Plan 构建: buildProjectInitPlan, drift, state
  init-apply.js        (~200L) Plan 执行: applyProjectInitPlan, rollback
  init-output.js       (~250L) 输出格式: preview, success, next-steps
  init-workspace.js    (~250L) Multi-repo: discover, workspace plan, summary
  init-developer.js    (~150L) Profile: global developer, legacy cleanup
```

拆分原则：
1. 按职责拆分，保持 exports 兼容（init.js re-export）
2. 无行为变更——纯代码组织
3. 现有 `require('./init')` 继续工作

### 4.6 Plugin 模块分层

```text
src/cli/
  plugin.js            (~200L) 外部 API: loadPluginManifest, buildFilteredAssetSet (thin facade)
  plugin-manifest.js   (~400L) Manifest 构建: governance JSON 解析, 资产发现
  plugin-governance.js (~300L) Governance 过滤: scope, delivery, anchor 验证
  plugin-sync.js       (~400L) Asset sync planning: planBundledAssetSync, inspectInstalledAssets
```

### 4.7 Qoder Hooks 补齐

#### 4.7.0 Scope: Qoder CLI first

Phase 0 只支持 Qoder CLI hooks。IDE/JB plugin hooks 不写入 confirmed runtime contract；若本地环境或官方文档证明其 settings schema、exec-form、事件和 stdout 协议与 CLI 完全兼容，可作为后续 Phase 0b 增强。

#### 4.7.1 实现方案

基于代码分析，Qoder hooks 的添加涉及以下联动：

**init 联动**（init.js `buildInitMetadataPlan`）：
```javascript
// 类比 Claude 的 hook upsert（init.js L2846-L2854）
if (platform === 'qoder') {
  const rendered = renderManagedQoderHooksUpsert(projectRoot);
  operations.push(buildPlanFileOperation(
    projectRoot,
    '.qoder/settings.json',
    rendered.contents,
    'managed_qoder_hook_matchers',
  ));
}
```

**clean 联动**（clean.js `buildRuntimeCleanupPreview`）：
```javascript
// 类比 Claude 的 hook removal（clean.js L419-L435）
if (adapter.id === 'qoder') {
  const rendered = renderManagedQoderHooksRemoval(projectRoot);
  operations.push(rendered && rendered.existsAfter
    ? buildRelativeOperation('update_file', '.qoder/settings.json', 'managed_qoder_hook_cleanup', { contents: rendered.contents })
    : buildRelativeOperation('remove_file', '.qoder/settings.json', 'managed_qoder_hook_cleanup'));
}
```

**doctor 联动**（doctor.js `buildHostSpecificChecks`）：
```javascript
// 类比 Claude 的 hook inspection（doctor.js L963）
if (adapter.id === 'qoder') {
  return [
    checkQoderLocalMcpConfig(projectRoot),
    ...inspectManagedQoderHooks(projectRoot).map(status => ({
      level: status.status === 'installed' ? 'PASS' : 'WARNING',
      name: `.qoder/settings.json ${status.displayName}`,
      message: status.message,
      fix: status.status !== 'installed'
        ? formatInitGuidance('qoder', `to restore the managed ${status.displayName} matcher`)
        : undefined,
    })),
  ];
}
```

**drift detection 联动**（init.js `inspectCurrentRuntimeDrift`）：
```javascript
// 类比 Claude 的 drift check（init.js L2441-L2450）
if (adapter.id === 'qoder') {
  for (const status of inspectManagedQoderHooks(projectRoot)) {
    if (status.status !== 'installed') {
      reasons.push(`qoder_settings_${status.eventName}_${status.status}`);
    }
  }
}
```

#### 4.7.2 新增文件

| 文件 | 内容 | 行数估计 |
|------|------|---------|
| `src/cli/qoder-settings.js` | hook upsert/removal/inspect；`renderManagedQoderHooksRemoval` 返回 `{filePath, existsAfter, contents}`（与 claude-settings.js 一致） | ~200L |
| `templates/qoder/hooks/session-start` | Node.js hook 脚本（类比 codex template） | ~170L |
| `templates/qoder/hooks/prd-prewrite-guard` | Node.js hook 脚本；Qoder CLI `PreToolUse` 下复用/投影 Claude prewrite guard 语义 | ~150L |
| `templates/qoder/hooks/prd-readiness-guard` | Node.js hook 脚本；Qoder CLI `Stop` 下复用/投影 Claude readiness guard 语义 | ~150L |

**安装闭环要求**：`QoderAdapter.planRuntimeFilesSync()` 必须写入 `.qoder/hooks/*` managed hook scripts，并设置可执行 mode；`planRuntimeFilesRemoval()`/clean 必须移除这些 managed hook scripts；doctor 与 init drift detection 必须同时检查 settings matcher 和 hook script 文件是否存在、内容是否为 managed current version。只写 `.qoder/settings.json` 不算完成 Phase 0。

#### 4.7.3 Qoder hooks JSON schema

`spec-first init --qoder` 写入的是项目级 `.qoder/settings.json`，会被 Qoder CLI 与 IDE/JB plugin 共同读取。为避免 CLI-only `args` exec-form 泄漏到未验证的 IDE/JB surface，本轮使用保守的 shell command string；若后续确认所有目标 surface 都支持 exec-form，再单独评估 `{ command, args }` 迁移。

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "matcher": ".*", "hooks": [{ "type": "command", "command": "node .qoder/hooks/session-start" }] }
    ],
    "PreToolUse": [
      { "matcher": "Write|Edit|MultiEdit", "hooks": [{ "type": "command", "command": "node .qoder/hooks/prd-prewrite-guard" }] }
    ],
    "Stop": [
      { "matcher": ".*", "hooks": [{ "type": "command", "command": "node .qoder/hooks/prd-readiness-guard" }] }
    ]
  }
}
```

### 4.8 平台兼容性加固（按需）

| 加固项 | 实现位置 | 方案 |
|--------|---------|------|
| Windows UNC 路径 | state.js `isSafeManagedStatePath` | 增加 `value.startsWith('\\\\')` 检测 |
| WSL Profile 互通 | developer.js `getGlobalDeveloperPath` | 检测 WSL + WSLENV → 读 Windows 侧 |
| 错误语言一致性 | 全局 | 按 profile lang 统一错误消息语言 |

---

## 五、实施路线

### 5.1 Phase 依赖图

```text
Phase 0: Qoder Hooks ──────────────── 独立，可立即执行
                                        │
Phase 1: Platform Registry ──────────── 独立基础设施
         │                              │
         ├── Phase 3: PointerBasedAdapter（依赖 Phase 1 的 deriveUnrewrittenPatterns）
         │
Phase 2: init.js 拆分 ──────────────── 依赖 Phase 0/1 稳定后启动
                                        │
Phase 4: Plugin 分层 ───────────────── 独立，与其他 Phase 无依赖
                                        │
Phase 5: 平台兼容性 ───────────────── 独立，按需
```

**关键结论**：
- Phase 0 和 Phase 1 可并行启动
- Phase 3 硬依赖 Phase 1
- Phase 2/4/5 在代码依赖上可独立，但建议 Phase 0/1 稳定后再启动 Phase 2，避免在 `init.js` 上并行迁移同一逻辑
- **Phase 0 与 Phase 2 的代码迁移约定**：Phase 0 在 `init.js` 中新增的 Qoder hook 调用，将在 Phase 2 拆分 `init.js` 时同步迁移到 `init-plan.js`，避免同一逻辑被修改两次

### 5.2 各 Phase 详细计划

#### Phase 0: Qoder Hooks 补齐（1-2 天）

| 步骤 | 内容 | 验收标准 |
|------|------|---------|
| 1 | 新建 `src/cli/qoder-settings.js` | exports: renderManagedQoderHooksUpsert, renderManagedQoderHooksRemoval, inspectManagedQoderHooks |
| 2 | 新建 `templates/qoder/hooks/session-start` | Node.js script，读 AGENTS.md，注入 governance context；只按 Qoder CLI 协议确认 |
| 3 | 新建 `templates/qoder/hooks/prd-prewrite-guard` 与 `prd-readiness-guard` | `.qoder/settings.json` 引用的每个 managed hook script 都必须实际安装 |
| 4 | 修改 Qoder adapter `planRuntimeFilesSync/Removal/inspectRuntimeFiles` | 写入/清理/检查 `.qoder/hooks/*`，保持 pointer lifecycle 不变 |
| 5 | 修改 init.js `buildInitMetadataPlan` | Qoder CLI 平台写入 `.qoder/settings.json` hooks；该函数在 Phase 2 将迁移至 `init-plan.js` |
| 6 | 修改 clean.js `buildRuntimeCleanupPreview` | Qoder CLI 平台清理 settings matchers 与 hook scripts |
| 7 | 修改 doctor.js `buildHostSpecificChecks` | Qoder CLI hook settings + script inspection |
| 8 | 修改 init.js `inspectCurrentRuntimeDrift` | Qoder CLI hook drift 检测；该函数在 Phase 2 将迁移至 `init-plan.js` |
| 9 | 验证 `UserPromptSubmit` 行为 | 确认 session-start prompt injection 的触发时机与 stdin/stdout 协议；Phase 0 不安装 `spec-plan-guard` |
| 10 | 新建 `tests/unit/qoder-settings.test.js` 与 hook file plan tests | 覆盖 upsert/removal/inspect、script write/remove、settings 引用的脚本均存在 |

**验收标准**：
- `spec-first init --qoder --dry-run` 输出包含 `.qoder/settings.json` hook 写入
- `spec-first init --qoder --dry-run` 输出包含 `.qoder/hooks/session-start`、`.qoder/hooks/prd-prewrite-guard`、`.qoder/hooks/prd-readiness-guard` 写入
- `spec-first doctor --qoder` 报告 hook 状态
- `spec-first clean --qoder` 正确移除 hooks
- 若 IDE/JB plugin hooks 未验证，文档和 doctor 文案不得声称支持 IDE/JB plugin hooks
- `npm test` 全通过

#### Phase 1: Platform Registry + 排除列表自动化（1-2 天）

| 步骤 | 内容 | 验收标准 |
|------|------|---------|
| 1 | 新建 `src/cli/adapters/platform-registry.js` | 5 宿主完整声明 + `deriveUnrewrittenPatterns` |
| 2 | 新建 golden snapshot + negative fixture 测试 | 派生结果与当前硬编码双向等价；intentional delta 必须显式记录 |
| 3 | 逐一替换 cursor/kiro/qoder 排除列表 | 改用 `deriveUnrewrittenPatterns(this.id)` |
| 4 | 移除硬编码 patterns 常量 | 清理旧代码 |

**验收标准**：
- golden snapshot 测试证明覆盖不变，negative fixture 证明未新增误匹配
- `spec-first init --dry-run` 输出对 cursor/kiro/qoder 无差异
- `npm test` 全通过

#### Phase 2: init.js 模块拆分（2-3 天）

| 步骤 | 内容 | 验收标准 |
|------|------|---------|
| 1 | 提取 init-args.js | INIT_PLATFORM_CHOICES + parseInitArgs |
| 2 | 提取 init-input.js | collectInitInput + prompts |
| 3 | 提取 init-plan.js | buildProjectInitPlan + 辅助函数 |
| 4 | 提取 init-apply.js | applyProjectInitPlan + rollback |
| 5 | 提取 init-output.js | printInitPreview + success/next-steps |
| 6 | 提取 init-workspace.js | workspace plan + summary |
| 7 | 提取 init-developer.js | global developer + legacy |
| 8 | init.js 瘦身为编排入口 + re-export | ~250 行 |

**验收标准**：
- init.js 主文件 ≤300 行
- 全量测试通过（unit + smoke + integration）
- 所有 `require('../commands/init')` 调用点不变

#### Phase 3: PointerBasedAdapter 基类（1-2 天，依赖 Phase 1）

| 步骤 | 内容 | 验收标准 |
|------|------|---------|
| 1 | 新建 `pointer-based-adapter.js` | 封装 pointer sync/removal/inspect |
| 2 | cursor.js 继承重构 | 从 675L 降至 ~120L |
| 3 | kiro.js 继承重构 | 从 435L 降至 ~80L |
| 4 | qoder.js 继承重构 | 从 553L 降至 ~150L |

**验收标准**：
- 三个 adapter 总行数从 1663L 降至 ~350L
- `spec-first init --dry-run` 对三宿主输出不变
- `spec-first doctor` 对三宿主诊断不变
- Cursor/Kiro/Qoder 现有 host-specific warning/error 数量和语义不减少；任何减少必须列入 intentional delta

#### Phase 4: Plugin 模块分层（1 天）

**验收标准**：
- plugin.js ≤200 行
- `npm run lint:skill-entrypoints` 通过
- governance 逻辑行为不变
- focused tests 覆盖 `loadPluginManifest`、`buildFilteredAssetSet`、scope/delivery mode filtering、anchor validation、asset sync planning、`inspectInstalledAssets` 和 facade exports

#### Phase 5: 平台兼容性（按需，1-2 天）

**触发条件**（满足任一即启动）：

| 条件 | 来源 |
|------|------|
| 收到 Windows UNC 路径导致 init/clean 失败的 issue | 用户反馈 |
| 收到 WSL 与 Windows 侧 profile 不一致的 issue | 用户反馈 |
| 启动企业环境 POC，明确要求 Windows/WSL 支持 | 业务需求 |

**验收标准**：

| 加固项 | 验证方式 |
|--------|---------|
| UNC 路径被 `isSafeManagedStatePath` 拒绝或正确归一化 | 新增 unit test |
| WSL 互通通过显式 flag（如 `--wsl-profile`）启用，默认关闭 | CLI smoke test |
| 错误消息语言与 profile lang 一致 | 回归测试 |

**默认行为**：Phase 5 不修改默认 CLI 行为；所有加固项均为 opt-in。

### 5.3 新宿主接入理想流程（优化后）

```text
1. 在 platform-registry.js 添加声明          (~20L)
2. 新建 adapters/new-host.js 继承 PointerBasedAdapter  (~100L)
3. 在 adapters/index.js 注册                 (+2L)
4. 在 skills-governance.json 添加 scope       (~5L)
5. 写测试                                    (~300L)

总计: ~430L 新代码, 0 行现有代码修改
预估: 1 天
```

**适用范围**：上述流程适用于 pointer-only 宿主（Cursor/Kiro 类型）。若新宿主支持 shell hooks，则需额外增加 hooks 模块（类似 Qoder Hooks 的 Phase 0），但仍不修改现有 adapter。

vs 当前: ~400L 新代码 + ~250L 修改现有 5 个 adapter = ~650L, 3-5 天

---

## 六、测试策略

### 6.1 测试矩阵

| 测试类型 | 覆盖范围 | 运行命令 |
|---------|---------|---------|
| Unit | platform-registry patterns, qoder-settings, init module exports | `npm run test:unit` |
| Smoke | CLI help, init dry-run, doctor JSON, clean dry-run | `npm run test:smoke` |
| Integration | init→doctor→clean 全链路 per-host | `npm run test:integration` |
| Golden snapshot | init --dry-run 输出 before/after 对比 | 新增测试脚本 |
| Typecheck | Node --check 语法检查 | `npm run typecheck` |

### 6.2 Golden Snapshot 策略

Phase 1/2/3 的核心验收基于输出不变；Phase 0 允许新增 Qoder CLI hook operations，但既有 operations 不得变化。策略：

1. **重构前**：对 5 宿主运行 `spec-first init --dry-run --{host}`（`--claude`、`--codex`、`--cursor`、`--kiro`、`--qoder` 均为当前 CLI 已支持的 flags）并保存输出为 golden file
2. **重构后**：运行相同命令，对比 golden file
3. **允许的差异**：文件修改时间戳、绝对路径中的用户名
4. **不允许的差异**：既有 operation 的 kind/path/reason 变化；Phase 0 之外不得新增或删除 operation，除非列入 intentional delta

### 6.3 跨平台 CI

当前状态：macOS/Linux CI 覆盖。Windows 依赖 atomic-write.js 的 EPERM retry。

建议（按需）：
- GitHub Actions 增加 `windows-latest` matrix entry
- 重点覆盖：path separator handling, hook mode permissions, UNC path detection

---

## 七、风险与约束

### 7.1 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| init.js 拆分破坏 module.exports | 所有 test require 失效 | init.js 保持 re-export |
| Adapter 声明式化遗漏 Codex 特殊逻辑 | Codex 功能回归 | Codex 不纳入 PointerBasedAdapter |
| deriveUnrewrittenPatterns 遗漏 edge case | 路径误改写 | golden snapshot + 全量 test case |
| Qoder UserPromptSubmit 时机与预期不符 | session-start hook 注入时机偏移 | 先部署 PreToolUse/Stop hooks（确定兼容），UserPromptSubmit 单独验证 |
| Qoder CLI 与 IDE/JB hooks surface 被误认为完全一致 | 生成 IDE/JB 不识别的 `.qoder/settings.json` 或误报支持范围 | Phase 0 只声明 Qoder CLI confirmed；IDE/JB 进入 follow-up compatibility spike |
| `.qoder/settings.json` 引用的 hook script 未实际安装 | hook matcher 存在但运行时报 ENOENT，doctor 误判健康 | Qoder adapter plan/clean/doctor/drift 同时覆盖 settings matcher 与 `.qoder/hooks/*` scripts |
| Platform Registry 派生 patterns 比 legacy 更宽 | runtime path rewrite 误报或误改写非目标路径 | 双向等价 + representative negative fixtures；intentional delta 单独记录 |
| PointerBasedAdapter 抽象吞掉 host-specific checks | doctor 回归漏报 frontmatter、agent tool pin、runtime path rewrite 问题 | Phase 3 验收比较 refactor 前后 Cursor/Kiro/Qoder warning/error 集合 |
| Plugin 拆分破坏 skill-entrypoints lint | governance 校验失败 | `npm run lint:skill-entrypoints` 作为门禁 |

### 7.2 Dual-Host Governance 影响

`skills-governance.json` 管理 per-platform skill delivery（command vs skill）。影响分析：

| 重构项 | 对 governance 影响 | 需修改 governance? |
|--------|-------------------|-------------------|
| Platform Registry | 不影响（声明路径，不涉及 delivery） | 否 |
| init.js 拆分 | 不影响（governance 由 plugin.js 管理） | 否 |
| PointerBasedAdapter | 不影响（delivery 由 plugin.js 决定） | 否 |
| Plugin 分层 | ⚠️ 内部拆分需保持 `buildFilteredAssetSet` API 不变 | 否（接口不变） |
| Qoder CLI hooks | 不影响（hooks 独立于 skill delivery） | 否 |

**结论**：所有 Phase 均不修改 governance schema 或 delivery 逻辑。`npm run lint:skill-entrypoints` 作为每个 Phase 的 gate check。

### 7.3 Source/Runtime 边界

| Phase | Source 变更 | Runtime 影响 | 边界正确性 |
|-------|-----------|-------------|-----------|
| Phase 0 | src/cli/ + templates/qoder/ | `.qoder/settings.json` + `.qoder/hooks/` 新增（via init） | ✅ source 变更后 init 重生 runtime |
| Phase 1 | src/cli/adapters/ | 无 runtime 变化 | ✅ 纯 source 重构 |
| Phase 2 | src/cli/commands/ | 无 runtime 变化 | ✅ 纯 source 重构 |
| Phase 3 | src/cli/adapters/ | 无 runtime 变化 | ✅ 纯 source 重构 |
| Phase 4 | src/cli/ | 无 runtime 变化 | ✅ 纯 source 重构 |

---

## 八、总结

### 核心判断

| 维度 | 评价 |
|------|------|
| 架构设计 | **优秀** — Plan→Apply + Adapter + State 是业界高端实践 |
| 多平台支持 | **良好** — 5 宿主覆盖主流，macOS/Linux/Windows 兼容 |
| 多平台扩展 | **中等** — Adapter 模式正确但 O(n²) 是瓶颈 |
| 实现复杂度 | **偏高** — 单文件过大、重复代码多、缺少数据驱动 |
| 产物目录合规性 | **优秀** — 所有宿主均符合官方最佳实践 |
| Hook 覆盖度 | **中等** — Claude 完整、Codex 部分、Qoder 缺失 |
| 生命周期对称性 | **良好** — 少数缺口是设计权衡 |

### 优化优先级排序（按 收益/成本 比）

| 优先级 | Phase | 收益 | 成本 | 依赖 |
|--------|-------|------|------|------|
| 1 | Qoder Hooks | 补齐自身宿主最大功能缺口，直接影响 dogfooding 与 Qoder 用户体验 | 1-2 天 | 无 |
| 2 | Platform Registry | 消除 O(n²)，新宿主零修改 | 1-2 天 | 无 |
| 3 | init.js 拆分 | 可维护性瓶颈解除 | 2-3 天 | 无 |
| 4 | PointerBasedAdapter | 消除 1300+ 行重复 | 1-2 天 | Phase 1 |
| 5 | Plugin 分层 | 降低 contributor 理解成本 | 1 天 | 无 |
| 6 | 平台兼容性 | 企业场景覆盖 | 1-2 天 | 无 |

**优先级说明**：Qoder Hooks 与 Platform Registry 成本相近且均可独立交付；Qoder Hooks 排在首位因为它同时解决 spec-first 自身的 dogfooding 缺口和当前最大用户可见功能缺口。实际执行时两者可并行启动。

**总工期**：7-12 天，渐进执行，每个 Phase 独立交付验证。

### 与业界对标

| 最佳实践 | spec-first 优化后 | 对标 |
|----------|-----------------|------|
| 声明式目标状态 | Operation Plan（已有） | Terraform |
| 插件式 O(1) 扩展 | Platform Registry + auto-derive | Terraform provider protocol |
| 状态追踪 | state.json（已有） | Terraform state |
| Dry-run / Preview | --dry-run（已有） | Terraform plan |
| 单一职责文件 | ~250L 入口 | SRP |
| 配置即代码 | platform-registry.js | Nx workspace.json |
