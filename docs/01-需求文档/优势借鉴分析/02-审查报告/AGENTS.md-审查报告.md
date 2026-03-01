# AGENTS.md 全面审查报告（修订版）

> **审查日期**: 2026-02-25
> **审查对象**: `/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md`
> **交叉验证来源**: `src/cli/index.ts`、`src/cli/commands/*.ts`、`skills/spec-first/*/SKILL.md`
> **版本**: v1.1（修订）

---

## 执行摘要

### 总体评分: **81/100**（可用，但存在高优先级对齐项）

### 本轮关键结论

1. AGENTS.md 主体结构清晰，命令与流程大部分可执行。
2. 存在 2 类高风险偏差：
   - 命令参考与 CLI 实现不完全一致（签名/覆盖范围）。
   - confirm_policy 语义与单个 Skill 实际策略不一致（doctor）。
3. 旧版报告中的两处误判已纠偏：
   - 不应要求补 8 类 ID（当前 `id next` 仅支持 5 类）。
   - 不应将 `doctor`/`feature-switch` 默认建议为 `auto`。

---

## 一、发现清单（按严重度）

### Critical

#### C1. CLI 命令覆盖不完整（缺少 5 个已注册命令）

**证据**:
- AGENTS.md 命令章节仅覆盖到 `doctor`（`init/id/gate/stage/matrix/metrics/ai/rfc/defect/golive/commit/feature/doctor`）。
- CLI 实际还注册了：`setup`、`hooks`、`viewer`、`update`、`uninstall`。

**定位**:
- AGENTS.md 命令章节: [AGENTS.md:53](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:53) 到 [AGENTS.md:274](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:274)
- CLI 注册: [index.ts:39](/Users/kuang/xiaobu/spec-first/src/cli/index.ts:39) 到 [index.ts:43](/Users/kuang/xiaobu/spec-first/src/cli/index.ts:43)

**影响**:
- Agent 按 AGENTS.md 执行时对可用命令集认知不完整，导致运维类流程（update/hooks 等）可发现性差。

**建议**:
- 在 AGENTS.md 的 CLI 章节补齐 5 个命令；若有意只保留“常用命令”，需在章节标题明确“子集，不是全集”。

---

### High

#### H1. `gate check` 命令签名与实现不一致

**问题**:
- AGENTS.md 写法：`spec-first gate check <featureId> [--stage <stageId>]`。
- 实现只接受 `<featureId>`，没有 `--stage` 解析。

**定位**:
- 文档: [AGENTS.md:105](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:105)
- 代码: [gate.ts:36](/Users/kuang/xiaobu/spec-first/src/cli/commands/gate.ts:36)

**影响**:
- 多余参数会被静默忽略，造成“以为按 stage 校验、实际没有”的误解。

**建议**:
- 改为 `spec-first gate check <featureId>`。

---

#### H2. `stage advance` 漏写 `--force` 参数

**问题**:
- AGENTS.md 仅写 `spec-first stage advance <featureId>`。
- 实现支持 `spec-first stage advance <featureId> [--force]`。

**定位**:
- 文档: [AGENTS.md:125](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:125)
- 代码: [stage.ts:48](/Users/kuang/xiaobu/spec-first/src/cli/commands/stage.ts:48)

**影响**:
- 文档遗漏关键控制参数，影响故障处理和应急流程说明完整性。

**建议**:
- 在 AGENTS.md 明确 `--force` 可用性与使用边界。

---

#### H3. confirm_policy 示例与 Skill 实际策略不一致（doctor）

**问题**:
- AGENTS.md 把 `doctor` 放在 `auto` 场景示例。
- `spec-first:doctor` Skill 明确推荐 `assisted`（因为可能更新宿主配置）。

**定位**:
- 文档: [AGENTS.md:341](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:341)
- Skill: [15-doctor/SKILL.md:40](/Users/kuang/xiaobu/spec-first/skills/spec-first/15-doctor/SKILL.md:40)

**影响**:
- 可能误导执行为“无需确认直接修复”，与 doctor Skill 的交互预期冲突。

**建议**:
- 将 `doctor` 从 `auto` 示例移除，改入 `assisted`。

---

### Medium

#### M1. 阶段顺序缺少 `09_cancelled` 终态

**定位**:
- 文档: [AGENTS.md:134](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:134)
- 枚举: [types.ts:17](/Users/kuang/xiaobu/spec-first/src/shared/types.ts:17)

**建议**:
- 在阶段顺序旁补“取消流程：任意阶段 -> 09_cancelled（终态）”。

---

#### M2. `commit` 命令示例缺少 `--message` 长参数写法

**定位**:
- 文档: [AGENTS.md:253](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:253)
- 实现: [commit.ts:22](/Users/kuang/xiaobu/spec-first/src/cli/commands/commit.ts:22)

**建议**:
- 命令示例改为：`spec-first commit --message "<message>" [--task <taskId>]`（可附 `-m` 别名）。

---

#### M3. `rfc create` 可选参数未写全

**定位**:
- 文档: [AGENTS.md:202](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:202)
- 实现: [rfc.ts:34](/Users/kuang/xiaobu/spec-first/src/cli/commands/rfc.ts:34)

**建议**:
- 补充 `[--motivation "..."] [--description "..."]`。

---

#### M4. `defect register` 可选参数未写全

**定位**:
- 文档: [AGENTS.md:223](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md:223)
- 实现: [defect.ts:40](/Users/kuang/xiaobu/spec-first/src/cli/commands/defect.ts:40)

**建议**:
- 补充 `[--description "..."]`。

---

### Low

#### L1. 元信息不足（版本/更新时间/变更日志）

**建议**:
- 在 front matter 增加 `version`、`updated`；维护简版变更记录。

#### L2. 缺少“快速开始”最小路径

**建议**:
- 增加 5 分钟上手流程（init -> spec -> task -> code -> verify）。

---

## 二、已纠偏项（避免误修）

1. **ID 类型**
   - 当前 AGENTS.md 的 `id next` 5 类类型与实现一致（`FR/DS/TASK/TC/RFC`）。
   - 不应在本轮要求补 `NFR/API/ADR` 到 `id next` 规则。

2. **confirm_policy 逐 Skill 映射建议**
   - 旧建议中 `doctor=auto`、`feature-switch=auto` 与 Skill 定义不符。
   - 若补映射表，必须以各 SKILL.md 的“推荐策略”为准。

---

## 三、优先级落地清单

### P0（本轮必须修）

| # | 问题 | 修复动作 | 预估 |
|---|------|----------|------|
| 1 | C1 命令覆盖不完整 | 补齐 `setup/hooks/viewer/update/uninstall` 或明确“仅常用子集” | 20 分钟 |
| 2 | H1 gate check 签名偏差 | 去掉 `[--stage <stageId>]` | 5 分钟 |
| 3 | H2 stage advance 漏 `--force` | 补充参数与使用边界 | 5 分钟 |
| 4 | H3 doctor 策略示例错误 | 从 `auto` 示例移出 doctor，改为 assisted | 5 分钟 |

### P1（短期修）

| # | 问题 | 修复动作 | 预估 |
|---|------|----------|------|
| 5 | M1 缺少 `09_cancelled` | 补取消终态说明 | 5 分钟 |
| 6 | M2 commit 长参数缺失 | 补 `--message` 示例 | 5 分钟 |
| 7 | M3/M4 可选参数缺失 | 补 rfc/defect 可选参数 | 10 分钟 |

### P2（可选优化）

| # | 问题 | 修复动作 | 预估 |
|---|------|----------|------|
| 8 | L1 元信息不足 | 增加版本与更新时间 | 5 分钟 |
| 9 | L2 缺少快速开始 | 增加最小流程样例 | 20 分钟 |

---

## 四、结论

AGENTS.md 当前可用，但存在“命令参考口径不全”和“策略语义不一致”两类高优先级问题。建议先完成 P0 四项修复，再做 P1 参数与阶段终态补齐。完成后该文档可作为稳定的全局执行基线。

---

> **报告状态**: 完成（v1.1 修订）
> **下一步**: 按 P0 清单更新 AGENTS.md 并复核一轮
