# 01-init SKILL.md 深度审查报告

> **审查日期**: 2026-02-14
> **审查对象**: `skills/spec-first/01-init/SKILL.md`（79 行）
> **审查基准**: 实际 CLI 实现（`src/core/process-engine/init.ts` + `src/cli/commands/init.ts`）
> **审查视角**: 作为 AI 提示词，能否准确引导 AI 完成 Feature 初始化

---

## 审查结论

| 维度 | 评分 | 说明 |
|------|------|------|
| 职责边界 | ★☆☆☆☆ | Preflight Bootstrap（47% 篇幅）与 CLI init 完全无关 |
| CLI 参数准确性 | ★★★★☆ | CLI Dependencies 签名正确，仅 `stage current` 多余 |
| 核心逻辑覆盖 | ★★☆☆☆ | 三层合并、幂等、FEAT 校验等核心行为均未描述 |
| 内部一致性 | ★★☆☆☆ | "auto-install (no user prompt)" 与 confirm_policy: strict 矛盾 |
| 可执行性 | ★★☆☆☆ | AI 会花大量 token 执行无关的 MCP 安装，真正的 init 逻辑反而缺失 |

**综合可用率**: ~35%

---

## P0 — 阻断级

### P0-1: Preflight Bootstrap 职责越界（37/79 行 = 47% 篇幅）

**位置**: L7-43（Preflight Bootstrap 整节 + Auto-install playbook）

**问题**: 整个 Preflight Bootstrap 描述的是 MCP 服务器和外部 Skill 的环境安装：

```
- sequential-thinking → npx -y @modelcontextprotocol/server-sequential-thinking
- context7 → npx -y @upstash/context7-mcp
- serena → uvx --from git+https://github.com/oraios/serena serena-mcp-server
- fetch → uvx mcp-server-fetch
- playwright-mcp → npx -y @playwright/mcp@latest
- find-skills / skill-creator（外部 GitHub 仓库）
```

**实际 CLI 代码**（`init.ts`）做的事：
1. 校验 FEAT 缩写
2. 生成 Feature ID（`FSREQ-YYYYMMDD-FEAT-NNN`）
3. 三层合并（Layer 0/1/2）
4. 创建目录 + 骨架文件
5. 注册 FEAT 缩写
6. 更新 `.spec-first/current`

**零交集**。CLI init 不检查 MCP、不安装 Skill、不读写 `~/.codex/` 或 `~/.config/claude-code/`。

**后果**: AI 执行 `/spec-first:init` 时，会花费大量 token 检查和安装 5 个 MCP 服务器 + 2 个外部 Skill，这些操作：
- 与 Feature 初始化无关
- 可能修改用户全局配置文件（`~/.codex/config.toml`、`~/.config/claude-code/mcp.json`）
- 可能从 GitHub 克隆外部仓库（安全风险）
- 可能因网络问题阻断真正的 init 流程

### P0-2: "auto-install (no user prompt)" 与 confirm_policy: strict 矛盾

**位置**: L20 vs L68

```
L20: If any item is missing, MUST auto-install immediately (no user prompt), then re-check.
L68: confirm_policy: strict (new Feature creation is significant)
```

`strict` 的语义（AGENTS.md 定义）：展示完整内容，用户必须逐项审阅确认。

但 Preflight Bootstrap 要求"no user prompt"自动安装。一个 Skill 不能同时是 strict 又跳过确认。

**后果**: AI 行为不可预测 — 可能在 P0 阶段绕过确认安装软件，又在 P3 阶段要求用户逐项确认 init 参数。

---

## P1 — 功能级

### P1-1: P1 阶段引用不存在的 config.yaml 加载

**位置**: L47

```
P1: Load defaults from `.spec-first/config.yaml`, scan available Layer2 platforms
```

**实际代码**: `init.ts` 不调用 `loadConfig()`。`config-schema.ts` 的 `loadConfig()` 被 metrics、gate 等模块使用，init 流程不涉及。

init 的 P1 实际行为是：接收用户参数（feat/mode/size/platforms），guided init 模式下扫描 `.spec-first/layer2/*.yaml` 发现可用平台。

**后果**: AI 可能尝试读取 config.yaml 并基于其内容做决策，但 init 根本不用这个文件。

### P1-2: 缺少三层合并（Layer 0/1/2）说明

**位置**: 整个 SKILL.md 无提及

**实际代码**: `init.ts:202` 调用 `mergeLayerRules(mode, size, platforms, projectRoot)`，这是 init 的核心逻辑之一：

- Layer 0：基线 Gate 条件 + 标准产出物
- Layer 1：Mode×Size 裁剪（Mode I 追加 impact-analysis.md，Size M/L 追加 data-model.md 等）
- Layer 2：平台 YAML 合并（gate_conditions AND 叠加、extra_deliverables 追加去重、quality_thresholds 取更严格值）

合并结果写入 `stage-state.json.mergedRules`，影响后续所有阶段的 Gate 评估和产出物检查。

**后果**: AI 不知道 init 会执行三层合并，无法向用户解释 mode/size/platforms 选择的实际影响。

### P1-3: 缺少幂等行为说明

**位置**: 整个 SKILL.md 无提及

**实际代码**: `init.ts:189-191`

```typescript
// 幂等：已存在则直接返回
if (exists(featureDir)) {
  const mergedRules = mergeLayerRules(opts.mode, opts.size, opts.platforms, opts.projectRoot);
  return { featureId, featureDir, mergedRules };
}
```

**后果**: AI 不知道重复 init 同一 Feature 是安全的（不会覆盖），可能错误地警告用户"已存在，是否覆盖"。

### P1-4: 缺少 FEAT 缩写校验规则

**位置**: 整个 SKILL.md 无提及

**实际代码**: `init.ts:42`

```typescript
if (!/^[A-Z][A-Z0-9]{0,15}$/.test(feat)) {
  throw new Error(`Invalid FEAT abbreviation "${feat}": must be 1-16 chars, start with A-Z, contain only A-Z0-9`);
}
```

**后果**: AI 在 P2 收集参数时不知道合法输入范围，可能接受 `auth`（小写）、`user-login`（含连字符）等非法值，导致 P4 执行失败。

### P1-5: Success Criteria 前两条与 CLI init 无关

**位置**: L71-72

```
- Required MCP (sequential-thinking/context7/serena/fetch/playwright-mcp) available in Codex + Claude
- Required skills (find-skills/skill-creator) available in Codex + Claude
```

这是 Preflight Bootstrap 的成功标准，不是 Feature 初始化的成功标准。

**后果**: AI 可能将 MCP 安装失败视为 init 失败，即使 Feature 目录已正确创建。

---

## P2 — 规范级

### P2-1: 缺少子目录创建说明

**实际代码**: `init.ts:206-208`

```typescript
ensureDir(join(featureDir, 'reports'));
ensureDir(join(featureDir, 'contracts'));
ensureDir(join(featureDir, 'tests'));
```

Output Paths 只列了文件，未提及这 3 个子目录。

### P2-2: Trigger "typically before 00_init" 语义不清

**位置**: L4

```
Stage: any (typically before `00_init`)
```

init 创建 Feature，执行前不存在任何阶段。"before 00_init" 不是一个有效的阶段状态。

**建议**: 改为 `Stage: none (creates new Feature, sets stage to 00_init)`。

### P2-3: CLI Dependencies 中 stage current 未被 init 调用

**位置**: L55

```
- `spec-first stage current <featureId>` (post-init verification)
```

实际 CLI init 命令（`handleInit`）不调用 `stage current`。它只输出 featureId 和 featureDir。

标注为 "post-init verification" 说明这是建议 AI 额外执行的验证步骤，但应明确标注为可选。

### P2-4: 缺少 FEAT 唯一性检查说明

**实际代码**: `init.ts:195-199`

```typescript
if (existingId && existingId !== featureId) {
  throw new Error(`FEAT abbreviation "${opts.feat}" already registered to ${existingId}`);
}
```

同一 FEAT 缩写不能注册给不同 Feature。AI 不知道这个约束，可能在用户重复使用缩写时无法给出正确提示。

### P2-5: platforms 为空时行为未说明

CLI 非交互模式允许 `--platforms` 为空（`parsePlatforms` 返回 `[]`），但 guided init 要求至少一个平台。SKILL.md L49 写 "platforms must be non-empty"，与非交互模式行为不一致。

---

## 修复建议

| 优先级 | 编号 | 修复内容 |
|--------|------|---------|
| P0 | P0-1 | 移除 Preflight Bootstrap 整节（L7-43），或拆分为独立的 `00-bootstrap/SKILL.md` |
| P0 | P0-2 | 随 P0-1 一并解决 |
| P1 | P1-1 | P1 改为"扫描 `.spec-first/layer2/*.yaml` 发现可用平台" |
| P1 | P1-2 | 补充三层合并说明（Layer 0 基线 → Layer 1 Mode×Size 裁剪 → Layer 2 平台 YAML 合并） |
| P1 | P1-3 | 补充幂等行为："已存在的 Feature 目录不覆盖，直接返回" |
| P1 | P1-4 | 补充 FEAT 校验规则：`^[A-Z][A-Z0-9]{0,15}$` |
| P1 | P1-5 | 移除 MCP/Skill 相关的 Success Criteria |
| P2 | P2-1 | Output Paths 补充 `reports/`、`contracts/`、`tests/` 子目录 |
| P2 | P2-2 | Trigger 改为 `Stage: none (creates new Feature)` |
| P2 | P2-3 | `stage current` 标注为 `(optional post-verification)` |
| P2 | P2-4 | 补充 FEAT 唯一性约束说明 |
| P2 | P2-5 | 明确 platforms 在非交互模式下可为空 |

---

## 统计

| 级别 | 数量 | 说明 |
|------|------|------|
| P0 | 2 | Preflight Bootstrap 职责越界 + 与 strict 矛盾 |
| P1 | 5 | 核心逻辑缺失（三层合并/幂等/FEAT校验/config引用错误/Success Criteria错位） |
| P2 | 5 | 子目录/Trigger/stage current/唯一性/platforms 行为 |
| **合计** | **12** | |

**核心结论**: 01-init SKILL.md 的最大问题是 Preflight Bootstrap 占据 47% 篇幅却与 CLI init 零交集，同时真正的核心逻辑（三层合并、幂等、FEAT 校验）完全缺失。移除 Preflight Bootstrap 并补齐核心逻辑后，可用率可从 ~35% 提升至 ~90%。
