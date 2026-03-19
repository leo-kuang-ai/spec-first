# Skill 提示词审查报告

> **审查日期**: 2026-02-14
> **审查范围**: AGENTS.md + 16 个 SKILL.md（作为 AI 提示词的有效性评估）
> **审查视角**: 当这些文件被加载为 AI Agent 的执行指令时，能否准确、完整、无歧义地引导 AI 完成预期行为
> **基准**: 实际 CLI 代码实现（src/cli/commands/*.ts）
> **修复状态**: ✅ 16/16 全部修复（2026-02-14）

---

## 审查结论

| 维度 | 评分 | 说明 |
|------|------|------|
| 结构一致性 | ★★★★☆ | 16 个 Skill 格式统一，P0-P5 模型清晰 |
| CLI 参数准确性 | ★★☆☆☆ | AGENTS.md 中 rfc/defect 命令参数与实际代码严重不符 |
| 指令充分性 | ★★☆☆☆ | 每个 Skill 仅 22-29 行，缺少关键执行细节 |
| 歧义与矛盾 | ★★★☆☆ | 存在 2 处语义矛盾、1 处目录重复 |
| 可执行性 | ★★☆☆☆ | AI 拿到这些提示词后，大概率需要猜测或自行补全执行细节 |

**综合可用率**: ~60%（结构框架可用，但执行细节不足以独立驱动 AI 完成任务）

---

## P0 — 阻断级（AI 执行时会产生错误命令）

### P0-1: AGENTS.md rfc 命令参数与实际 CLI 不符（5 处）

**位置**: `skills/spec-first/AGENTS.md` L197-209

| # | AGENTS.md 写法 | 实际 CLI 签名 | 影响 |
|---|---------------|--------------|------|
| 1 | `rfc create <featureId> --title "<title>" --impact "<impact>"` | `rfc create <featureId> --title "<title>" [--level <Minor\|Major\|Critical>] [--by <by>]` | `--impact` 不存在，缺 `--level`/`--by` |
| 2 | `rfc submit <rfcId>` | `rfc submit <rfcId> --feature <featureId>` | 缺 `--feature` 必填参数 |
| 3 | `rfc transition <rfcId> <status>` | `rfc transition <rfcId> <status> --feature <featureId>` | 缺 `--feature` 必填参数 |
| 4 | `rfc get <rfcId>` | `rfc get <rfcId> --feature <featureId>` | 缺 `--feature` 必填参数 |
| 5 | 未列出合法 status 值 | `draft\|approved\|closed\|rejected` | AI 可能传入非法状态值 |

**后果**: AI 按 AGENTS.md 指令调用 rfc 命令时，100% 会因参数错误失败。

### P0-2: AGENTS.md defect 命令参数与实际 CLI 不符（3 处）

**位置**: `skills/spec-first/AGENTS.md` L218-228

| # | AGENTS.md 写法 | 实际 CLI 签名 | 影响 |
|---|---------------|--------------|------|
| 1 | `defect register ... --severity <critical\|major\|minor>` | `--severity <S1\|S2\|S3\|S4>` | 枚举值完全错误 |
| 2 | `defect update <defectId> <status>` | `defect update <featureId> <seq> --status <status>` | 参数结构完全不同 |
| 3 | `defect get <defectId>` | `defect get <featureId> <seq>` | 参数结构不同 |

**后果**: AI 按 AGENTS.md 指令调用 defect 命令时，100% 会因参数错误失败。

### P0-3: AGENTS.md 缺少 4 个已实现命令组的文档

**位置**: `skills/spec-first/AGENTS.md` — 整个 CLI 命令参考章节

| 缺失命令 | 实际签名 | 被哪些 Skill 依赖 |
|---------|---------|-----------------|
| `golive check <featureId>` | 已实现 | 无直接依赖，但 12-verify 可能需要 |
| `commit -m "<msg>" [--task <taskId>]` | 已实现 | 07-code |
| `feature list\|current\|switch` | 已实现 | 14-status |
| `metrics health <featureId>` | 已实现 | 11-plan, 13-orchestrate, 14-status |

**后果**: AI 在执行 07-code（commit）、11-plan（metrics health）、14-status（feature current）时，无法从 AGENTS.md 获取正确的命令格式，只能依赖 SKILL.md 中的简略引用。

---

## P1 — 功能级（AI 执行时会产生歧义或遗漏）

### P1-1: 02-catchup confirm_policy 与 P4 行为矛盾

**位置**: `skills/spec-first/02-catchup/SKILL.md` L12, L23

- L23: `confirm_policy: auto (read-only analysis)` — 声明只读
- L12: `P4: Write catchup results to stage-state.json` — 实际写文件

**后果**: AI 可能因 "auto (read-only)" 标注而跳过用户确认直接写入，或反过来因 "read-only" 而不执行 P4 写入。

**建议**: 改为 `assisted`（因为写入 stage-state.json 不是只读），或将 P4 改为 "Display catchup results (no file write)"。

### P1-2: 09-test 输出路径不明确

**位置**: `skills/spec-first/09-test/SKILL.md` L22

```
Output Paths:
- specs/{featureId}/traceability-matrix.md
- Test scaffold files          ← 路径不明确
```

**对比**: 使用手册和 AGENTS.md 均定义测试文件路径为 `specs/{featureId}/tests/*.test.md`。

**后果**: AI 可能将测试文件写到错误位置。

**建议**: 改为 `specs/{featureId}/tests/*.test.md`。

### P1-3: AGENTS.md 目录结构 task_plan.md 重复

**位置**: `skills/spec-first/AGENTS.md` L38, L49

```
├── task_plan.md            # 任务拆解（03_plan）     ← L38
...
├── task_plan.md            # 当前任务计划（运行态）   ← L49
```

同一文件出现两次，注释不同。AI 可能困惑这是一个文件还是两个文件。

**建议**: 删除 L49 重复行。

### P1-4: AGENTS.md Guardrails 引用 legacy Skill 名

**位置**: `skills/spec-first/AGENTS.md` L299

```
不得跨阶段执行 Skill（如在 01_specify 阶段执行 04-task-decompose）
```

`04-task-decompose` 是 legacy 名称，当前为 `06-task`。

**后果**: AI 可能误以为存在名为 `04-task-decompose` 的 Skill。

### P1-5: id next 命令在 AGENTS.md 中缺少 --feature 参数

**位置**: `skills/spec-first/AGENTS.md` L77

```bash
spec-first id next <type> <featAbbr>
```

实际签名: `spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]`

缺少 `--feature` 必填参数和 TC 类型的 `--level` 可选参数。多个 Skill（03-spec, 04-design, 06-task, 09-test）依赖此命令。

**后果**: AI 调用 `id next` 时可能遗漏 `--feature` 参数。部分 Skill 自身的 CLI Dependencies 写了完整格式（如 03-spec），但 AGENTS.md 作为全局参考是不完整的。

### P1-6: gate conditions 参数不一致

**位置**: `skills/spec-first/AGENTS.md` L106

```bash
spec-first gate conditions <stageId>
```

实际签名: `spec-first gate conditions <featureId>`（参数是 featureId 不是 stageId）。

---

## P2 — 规范级（不影响执行但降低提示词质量）

### P2-1: 所有 Skill 缺少输入/输出示例

16 个 SKILL.md 均无任何示例。对于 AI 提示词而言，示例是最有效的行为锚定手段。

**影响**: AI 对产出物的格式、粒度、风格缺乏参照，输出质量不稳定。

**建议**: 至少为核心 Skill（03-spec, 04-design, 06-task, 07-code, 09-test）补充一个最小示例，展示 P2 生成内容的预期格式。

### P2-2: 所有 Skill 缺少错误处理指引

无任何 Skill 定义：
- P0 阶段校验失败时的行为（如阶段不匹配）
- P3 用户拒绝时的回退策略
- CLI 命令执行失败时的降级方案
- P5 副作用执行失败时是否回滚 P4

**影响**: AI 遇到异常时行为不可预测。

**建议**: 在 AGENTS.md 的"Skill 统一执行模型"章节补充统一的错误处理规则。

### P2-3: 所有 Skill 缺少成功标准定义

无任何 Skill 定义"执行成功"的判定条件。例如：
- 03-spec 成功 = spec.md 已写入 + 所有 FR 已注册到矩阵 + matrix check 无 orphan
- 07-code 成功 = 代码已提交 + TASK 状态更新为 Done + stage-state.json 已更新

**影响**: AI 无法自我判断任务是否完成，可能提前结束或过度执行。

### P2-4: confirm_policy 缺少执行语义定义

AGENTS.md 和 SKILL.md 均未定义三种 confirm_policy 的具体执行行为差异：

| policy | 预期行为（未文档化） |
|--------|-------------------|
| auto | P3 跳过用户确认，直接进入 P4 |
| assisted | P3 展示内容，用户可修改或确认 |
| strict | P3 展示内容，用户必须逐项确认 |

**影响**: AI 不知道 auto/assisted/strict 分别意味着什么交互模式。

### P2-5: 05-research confirm_policy 标注为 auto 但 P4 写文件

**位置**: `skills/spec-first/05-research/SKILL.md` L22

与 P1-1（02-catchup）同类问题。声明 `auto (read-only research)` 但 P4 写入 `research.md`。

写文件的 Skill 不应标注为 "read-only"。

### P2-6: Skill 之间的调用关系未文档化

13-orchestrate 会调度其他 Skill（plan → spec|design|task|code|test|archive → verify → advance），但：
- 未定义调度时传递什么参数
- 未定义子 Skill 失败时 orchestrate 的行为
- 未定义子 Skill 的执行顺序是否可配置

**影响**: AI 执行 orchestrate 时对子 Skill 调度逻辑只能猜测。

### P2-7: AGENTS.md 缺少 defect 状态枚举和 severity 枚举

实际 CLI 支持：
- severity: `S1 | S2 | S3 | S4`
- status: `open | fixing | fixed | verified | wontfix`

AGENTS.md 中完全未列出这些枚举值。

---

## 修复建议汇总

| 优先级 | 编号 | 修复内容 | 涉及文件 |
|--------|------|---------|---------|
| P0 | P0-1 | rfc 命令 5 处参数修正 | AGENTS.md L197-209 |
| P0 | P0-2 | defect 命令 3 处参数修正 + 枚举值 | AGENTS.md L218-231 |
| P0 | P0-3 | 补充 golive/commit/feature/metrics health 命令文档 | AGENTS.md |
| P1 | P1-1 | catchup confirm_policy 改为 assisted 或 P4 改为不写入 | 02-catchup/SKILL.md |
| P1 | P1-2 | test 输出路径改为 `specs/{featureId}/tests/*.test.md` | 09-test/SKILL.md |
| P1 | P1-3 | 删除目录结构中 task_plan.md 重复行 | AGENTS.md L49 |
| P1 | P1-4 | `04-task-decompose` → `06-task` | AGENTS.md L299 |
| P1 | P1-5 | id next 补充 `--feature` 必填参数和 `--level` 可选参数 | AGENTS.md L77 |
| P1 | P1-6 | gate conditions 参数 `<stageId>` → `<featureId>` | AGENTS.md L106 |
| P2 | P2-1 | 核心 Skill 补充最小输入/输出示例 | 03/04/06/07/09 SKILL.md |
| P2 | P2-2 | AGENTS.md 补充统一错误处理规则 | AGENTS.md |
| P2 | P2-3 | 各 Skill 补充成功标准 | 16 个 SKILL.md |
| P2 | P2-4 | AGENTS.md 补充 confirm_policy 三种模式的执行语义 | AGENTS.md |
| P2 | P2-5 | research confirm_policy 去掉 "read-only" 标注 | 05-research/SKILL.md |
| P2 | P2-6 | orchestrate 补充子 Skill 调度协议 | 13-orchestrate/SKILL.md |
| P2 | P2-7 | AGENTS.md 补充 defect severity/status 枚举 | AGENTS.md |

---

## 统计

| 级别 | 数量 | 说明 |
|------|------|------|
| P0 | 3 | AI 执行时 100% 产生错误命令 |
| P1 | 6 | AI 执行时产生歧义或遗漏 |
| P2 | 7 | 降低提示词质量，不直接阻断执行 |
| **合计** | **16** | |

**核心结论**: ~~AGENTS.md 的 CLI 命令参考章节是最大风险点（P0-1/P0-2/P0-3 共 12 处参数错误或缺失），修复后可将综合可用率从 ~60% 提升至 ~80%。要达到 ~95%，还需补充 P2 级的示例、错误处理和成功标准。~~ **已全部修复，综合可用率提升至 ~95%。**
