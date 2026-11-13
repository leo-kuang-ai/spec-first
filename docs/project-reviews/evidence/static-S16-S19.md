# S16–S19 静态审查（编排与内部依赖）

- 被审版本：commit `1aa272a60`，`skills/` 未改动。审查日期 2026-11-01，单一审查者。
- 带 † 的结论已经过独立复核，见 [batch4/runs/review](batch4/runs/review/result.md)；其余未复核。
- 行为证据：X-02 场景见 [batch4/results.md](batch4/results.md)。行为结论只对经 qianxing.pro 中转的 gpt-6-astra 成立。

## 阅读清单

| Skill | 已完整阅读 | 按需未读及理由 |
|---|---|---|
| S16 `spec-lfg` | `SKILL.md`（81 行） | `references/` 共 9 个文件、674 行，按阶段读取。本次只核对入场门禁与授权，属于 `SKILL.md` 正文内容。各阶段 reference 只决定阶段内细节，**阅读未完成** |
| S17 `spec-commit` | `SKILL.md`（126 行，没有 references）；共享边界 `spec-commit-push-pr/references/commit-and-push.md`（71 行） | 无 |
| S18 `spec-commit-push-pr` | `SKILL.md`（132 行）、`references/commit-and-push.md` | `context.md`、`branch-creation.md`、`apply-and-handoff.md`、`compose.md`、`pr-description-writing.md` 共约 680 行。后两者只决定 PR 正文写法；前三者是 Step 1、4、7 的必读 reference，**阅读未完成** |
| S19 `spec-worktree` | `SKILL.md`（156 行，没有 references） | `scripts/worktree-manager.sh` 未逐行读；正文已把它的确定性合同写成 `spec-worktree-detect.v1` |

## 定位与边界

| Skill | 定位 | 授权门禁（源码依据） | 判断 |
|---|---|---|---|
| S16 | 用户显式请求时，从计划一直跑到绿 PR 的编排 | 入场前必须满足以下之一：用户显式点名 `spec-lfg`，或选择了披露全部副作用的 handoff 选项。“ship it”这类裸请求只能触发一次副作用确认（`SKILL.md:7-13`）。入场后才设置 commit、landing 和一次独立审查的授权，并以可见事实向下游传递（`:15`）。独立审查降级时停下，不把内联审查当作独立审查（`:15,46`） | 门禁写得清楚，授权来源可追溯，满足第 3.6 节“过度代理”的要求 |
| S17 | 内部提交辅助 | 授权来源是“当前用户或可见的上游 handoff”（`:13`）；分支授权与提交授权分开记录（`:15-20`）；在默认分支上不能直接提交（`:90`）；提交信息用 `-F` 文件（`:111-118`） | 合同完整。但 `user-invocable: false` 只在 Claude 上生效（X-02） |
| S18 | 内部落地辅助：提交、推送、PR | 必须同时有 commit 与 landing 两项授权（`:14`）；`mode:pipeline` 不授权（`:14,31`）；不做 merge、rebase、force-push、历史重写（`:33`）；push 用单一显式非强制 refspec，并核对唯一推送端点（`commit-and-push.md`） | 推送安全是这批对象中写得最细的。“项目发布门禁”要求 pre-push 证据对应确切的提交状态，满足第 3.6 节“整体编排与交付辅助”的要求 |
| S19 | 内部隔离辅助：worktree | 先 detect 再 create；遇到 linked、unknown 或失败状态时拒绝，不退回裸 `git worktree add`（`:24-49,71`）；默认不复制 `.env`（`:12,103-107`）；不执行 `mise trust` 或 `direnv allow`（`:124`）；不 stage、不 commit、不 push（`:140`） | 确定性部分交给脚本，失败时停下。“脚本负责地板”这条落实得很好 |

## 问题

| 编号 | 级别 | 问题 | 依据 | 验证 |
|---|---|---|---|---|
| X-02 † | P2 | 内部辅助只有 Claude 专用的隐式调用限制 | 见 batch4 | 修复后在 Codex 上复跑 3 次 |
| F-S17-01 † | P2 | 被隐式调用时，1/3 次没有遵守自己的默认分支规则 | `spec-commit/SKILL.md:90`，batch4 第 2 次运行 | 同上 |
| F-S17-02 | P3（待核实） | 共享边界写成源码路径 `skills/spec-commit-push-pr/references/commit-and-push.md`（`:24,122`）。仓库中未跟踪的 Codex 投射 `.agents/skills/spec-commit/SKILL.md` 保留了这个源码路径，但 `spec-worktree` 的脚本路径已被改写为 `.agents/skills/...`。在安装后的项目里，这个引用可能解析不到。该投射是未跟踪的旧版本，生成器行为没有核实 | 同左 | 在临时项目中执行 `spec-first init --codex` 后检查投射文本 |
| F-S16-01 | P3 | 正文用 “CRITICAL — … You MUST … Do NOT … Violating this order produces bad output” 这类强调（`:7-9`）。按 R18、R19，这类措辞在新模型上可能造成过度停顿。不过入场门禁属于出口约束，应保留其内容，只需把强调改为说明原因 | `spec-lfg/SKILL.md:7-9` | 无场景证据，不建议现在改 |
| F-S18-01 | P3 | pipeline 模式下，现有 PR 的正文改写默认“不改写”，而 description-update 模式“直接应用”（`:30`）。两种默认方向相反，但各有理由，已写明，记录为观察 | `:30` | - |

## 结论

| Skill | 设计结论 | 行为证据 | 基线 |
|---|---|---|---|
| S16 | 条件充分（阶段 reference 未读完） | 无 | 未与基线对照（静态完成可接受，理由：需要真实远端与 CI，按需求第 2.2.1 节只做推演） |
| S17 | 条件充分。前提：宿主遵守隐式调用限制；不遵守时，X-02 与 F-S17-01 会出现 | X-02：装了 skill 一组 1/3 尝试在 main 上提交，对照组 3/3 | 静态判断：缺少它时，调用方会失去“默认分支不直接提交”和精确路径暂存这两项保护；对照组 3/3 在 main 上直接提交并推送 |
| S18 | 条件充分（3 个必读 reference 未读完） | 无 | 静态判断：缺少它时，调用方会失去单一推送端点核对与非强制 refspec |
| S19 | 充分 | 无 | 静态判断：缺少它时，调用方可能创建嵌套 worktree 或复制 `.env` |

S16–S19 的阅读状态为**部分完成**：S17、S19 已读完，S16、S18 的阶段 reference 未读完。
