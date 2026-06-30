---
date: 2026-06-30
topic: multi-session-concurrency-safety
spec_id: 2026-06-30-003-multi-session-concurrency-safety
---

# 多会话并发安全:检测 + 一键隔离(第一版)

## Summary

让 spec-first 用户能安全地并行运行多个 agent 会话:当检测到多个会话共用同一 git 工作树时,提示并发风险并提供「一键进入隔离 worktree」,从源头避免会话之间互相冲掉未提交的文件。用户无需理解或手动操作 worktree。第一版只做「检测 + 隔离」止血,隔离后合并回主干时的自动收敛(含 CHANGELOG/artifact 聚合)留作第二版。

---

## Problem Frame

spec-first 的用户越来越多地并行使用 AI coding agent——一个人开多个 Claude Code / Codex 会话跑不同任务,或团队多人各自的 agent 操作同一仓库。当这些会话**共用同一个 git 工作树**时,它们会互相 commit / checkout / 清理工作树,把彼此**未暂存的编辑悄无声息地冲掉**:文件写进去几秒后又消失,或新建文件被清理,用户难以察觉。

这一痛点在 spec-first 自身开发中被反复实证(本仓库 memory 已多次记录:并发会话 revert 未暂存编辑;一次会话内 docs 文档、README 编辑、甚至 memory 索引都被冲掉)。而 spec-first 自己的硬规则(每次 source 变更都要写根 `CHANGELOG.md` 顶部)还放大了这一冲突——它是所有 agent 高频抢写的同一位置。

业界对「多 agent 并行不打架」的标准答案高度统一:**隔离,而非加锁**(Claude Code 原生 `claude --worktree`、Crystal/Nimbalyst、Vibe Kanban、container-use 都靠 worktree 或容器隔离)。但这些工具都把隔离交给用户主动操作或要求用户理解 worktree。spec-first 的目标是让用户**用了就自动安全**,而不是去教用户用 worktree。

---

## Actors

- A1. spec-first 用户(开发者):可能同时开多个 Claude Code / Codex 会话处理不同任务。
- A2. 并发 agent 会话:多个共用同一 git 工作树、会各自跑 git 操作的 agent 会话。
- A3. spec-first 检测/编排逻辑:产出确定性并发事实、驱动风险提示与隔离动作。

---

## Key Flows

- F1. 并发检测与一键隔离
  - **Trigger:** 启动 spec-first workflow(或其他合适入口)
  - **Actors:** A1, A3
  - **Steps:**
    1. 检测当前 git 工作树是否被多个 agent 会话共用
    2. 命中风险 → 提示用户,并给出「一键进入隔离 worktree」动作
    3. 用户确认 → 复用现有 git-worktree 能力创建/进入隔离 worktree
    4. 用户未确认 → 就地继续,但风险已明确告知
    5. 若当前已在隔离 worktree → 报告已隔离,就地继续,不重复创建
  - **Outcome:** 用户要么进入隔离(并行安全),要么在知情前提下留在共用工作树
  - **Covered by:** R1, R2, R4, R5, R6, R7

---

## Requirements

**并发检测**
- R1. spec-first 在 workflow 启动(或合适入口)检测当前是否存在「多个 agent 会话共用同一 git 工作树」的并发风险。
- R2. 检测结果是确定性逻辑产出的 advisory facts(例如基于进程与工作目录比对),供语义层驱动提示;检测本身不硬阻断 workflow。
- R3. 当检测无法判定(信息不足、平台限制)时,降级为「未知」并显式说明,不伪造结论、不阻断。

**隔离引导(提示 + 一键)**
- R4. 检测到并发风险时,spec-first 向用户提示风险,并提供「一键进入隔离 worktree」的动作。
- R5. 隔离动作复用现有 git-worktree 能力(检测当前是否已隔离 + 创建),用户无需理解或手动操作 worktree 概念。
- R6. 若当前 checkout 已是隔离 worktree,不重复创建,直接就地继续并告知用户。
- R7. spec-first 不在用户未确认时自动切走工作目录(preview-first,非 silent write)。

**边界与降级**
- R8. 检测与隔离是 advisory + 用户确认的动作;当运行时缺少可靠检测能力时,显式声明「未强制」并降级,不静默放行,也不伪装成已强制。
- R9. 第一版不做隔离后合并回主干的自动收敛(CHANGELOG / artifact 聚合);合并冲突由正常 git / 人工处理,自动收敛明确记为第二版。

---

## Acceptance Examples

- AE1. **Covers R1, R4.** Given 用户已在主工作树开了第二个共用同一仓库的 agent 会话,when 启动 spec-first workflow,then 提示检测到并发风险并给出一键隔离动作。
- AE2. **Covers R6.** Given 当前会话已在隔离 worktree 内,when 检测运行,then 报告「已隔离」并就地继续,不创建新 worktree。
- AE3. **Covers R3, R8.** Given 运行环境无法可靠枚举进程 / 工作目录,when 检测运行,then 输出「未知」并说明未强制,不阻断 workflow。
- AE4. **Covers R7.** Given 检测到并发风险但用户未确认隔离,when workflow 继续,then 不切走工作目录,在当前位置继续(风险已告知)。

---

## Success Criteria

- 人类结果:用户在多会话并行时,走了隔离的情况下不再出现「写了又没 / 文件被冲掉」的意外;未走隔离时至少被明确告知风险并有一键修复路径。
- 下游 handoff:downstream(`spec-plan` 等)能从本文档明确区分第一版范围(检测 + 隔离)与第二版范围(收敛),无需发明 WHAT;且清楚「并发检测」是净新能力、隔离底层复用现有 helper。

---

## Scope Boundaries

- 不做隔离后合并回主干的自动收敛(CHANGELOG / artifact 聚合)——第二版。
- 不做容器级隔离(L3)——可作为后续可选高级档,非本版。
- 不做 GUI / Kanban 式多 agent 编排(L2 红海,非 spec-first 形态)。
- 不做文件锁、自研并发安全引擎、后台 watcher。
- 不把 changelog 碎片文件暴露给用户作为阅读入口。
- 不做「完全自动切走工作目录」的 silent 行为。
- 不自造 worktree 隔离底层——复用 git / 宿主原生能力与现有 git-worktree helper。

---

## Key Decisions

- MVP = A 层止血(检测 + 隔离):隔离一旦建立,并行期的文件冲突自动消失,直击最痛的「写了又没」,符合 80/20。
- 提示 + 一键隔离(非完全自动切走):符合 spec-first preview-first 哲学,避免在用户没预期时打断。
- 隔离不自造:复用现有 git-worktree helper + 宿主原生 worktree,不违反「不重建宿主即将免费提供的能力」红线。
- 差异化价值押在第二版「可信收敛层」(隔离后合并的语义聚合 + 证据汇总)——这是经调研确认的全行业空白;第一版先止血、不碰收敛。

---

## Dependencies / Assumptions

- 依赖现有 `git-worktree` helper(`skills/git-worktree/`)的 `detect` / `create` 基线;但其 `detect` 仅判断「当前 checkout 是否已隔离」,**不覆盖**「多会话共用同一工作树」——后者是净新检测能力(已读源码确认)。
- 依赖运行环境能枚举进程与工作目录以判定并发;不可得时按 R3 降级为「未知」。
- 宿主(Claude Code)已提供 `claude --worktree` 等原生隔离;spec-first 做的是封装编排 + 并发检测,不重做隔离本身。
- 假设「多会话并行」在目标用户中足够普遍,值得做成默认能力(待验证,见 Outstanding Questions)。

---

## Outstanding Questions

### Resolve Before Planning

- (无)核心产品决策(MVP 边界、隔离形态、不做清单)已在 brainstorm 中确认。

### Deferred to Planning

- [Affects R1][Technical] 检测的具体触发位置(哪些 workflow 入口 / SessionStart hook)与实现机制(进程枚举方式、跨平台 macOS/Linux/Windows 行为)。
- [Affects R1][Needs research] 目标用户「多会话并行」的真实普遍度,决定检测是 default-on 还是 opt-in;第一版可先默认 advisory-on,后续按数据调整。
- [Affects R5][Technical] 现有 `git-worktree` helper 当前是 internal helper(`user-invocable: false`,仅 `spec-work`/`spec-code-review` 委托),如何被并发检测流程复用 / 暴露为隔离编排动作。
- [Affects R2][Technical] 检测事实的 schema / reason_code 形态,以及如何与现有 deterministic facts 契约对齐。
