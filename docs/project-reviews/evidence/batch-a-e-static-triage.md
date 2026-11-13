# 批次 A–E 静态初审（2026-11-01）

> 2026-11-01 续审修订：本文保留初审过程；当前结论见 [续审记录](resume-audit-2026-11-01.md) 与 [核心逐项分析](resume-core-analysis.md)。F-S07-01原推断撤回、F-S10-02初审观察撤回、F-S10-01收窄；历史样本不自动证明因果。
- 范围：S01–S03、S05–S19、S21，共 19 项。被审版本为 commit `1aa272a60`，`skills/` 没有未提交改动。
- **阅读覆盖：没有一项达到“静态完成”。** 本轮只做了三件事：
  1. 统计 19 项入口正文的规模：`SKILL.md` 合计约 27.2 万字符。
  2. 抽取各项的合同摘要与硬出口行。
  3. 对需求第 3.6、3.9 节的能力项做定向检索：每个能力项一条正则，覆盖 `SKILL.md` 与全部 references，统计命中文件数，再对相关命中逐条查看。
- 各项的完整阅读、能力基准、场景与结论仍待完成。以下发现都是**检索结论**，按需求第 6 节无场景证据时最高定为 P2，并标注“待场景验证”。

## 1. 定向检索统计

数值是命中该能力项的文件数（`SKILL.md` + references）。0 不等于没有该能力，只说明没有检索到相应表述。

| Skill | references 文件/行数 | 外部指令当数据 | 新依赖核实 | 改弱测试 | flaky | 同根/根因 | 消费者 | 新鲜度 | 推理外显 | 只报高严重度 |
|---|---|---|---|---|---|---|---|---|---|---|
| spec-ideate | 17 / 2572 | 7 | 2 | 2 | 0 | 3 | 8 | 9 | 0 | 0 |
| spec-brainstorm | 18 / 2377 | 2 | 2 | 1 | 0 | 3 | 12 | 3 | 0 | 0 |
| spec-prd | 9 / 1910 | 6 | 1 | 3 | 0 | 1 | 10 | 9 | 0 | 0 |
| spec-write-tasks | 3 / 823 | 0 | 0 | 0 | 0 | 0 | 4 | 4 | 0 | 0 |
| spec-work | 15 / 1802 | 3 | 2 | 4 | 0 | 3 | 13 | 8 | 0 | 0 |
| spec-simplify-code | 4 / 53 | 1 | 1 | 1 | 0 | 0 | 5 | 1 | 0 | 0 |
| spec-code-review | 31 / 3331 | 8 | 3 | 1 | 1 | 7 | 21 | 12 | 0 | 0 |
| spec-debug | 6 / 650 | 3 | 1 | 1 | 2 | 7 | 6 | 3 | 0 | 0 |
| spec-resolve-pr-feedback | 6 / 678 | 4 | 1 | 0 | 0 | 2 | 6 | 2 | 0 | 0 |
| spec-compound | 19 / 1598 | 2 | 1 | 1 | 0 | 5 | 10 | 8 | 0 | 0 |
| spec-handoff | 3 / 108 | 3 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 |
| spec-compound-refresh | 13 / 1300 | 2 | 1 | 0 | 0 | 3 | 5 | 10 | 0 | 0 |
| spec-doc-review | 32 / 2402 | 4 | 1 | 2 | 0 | 4 | 10 | 7 | 0 | 0 |
| spec-test-browser | 2 / 133 | 2 | 0 | 0 | 0 | 0 | 3 | 1 | 0 | 0 |
| spec-test-xcode | 2 / 70 | 0 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 |
| spec-lfg | 9 / 674 | 3 | 0 | 1 | 1 | 1 | 7 | 6 | 0 | 0 |
| spec-commit | 0 / 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| spec-commit-push-pr | 6 / 752 | 0 | 0 | 0 | 0 | 1 | 6 | 4 | 0 | 0 |
| spec-worktree | 0 / 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |

19 项的推理外显与“只报高严重度”两列都是 0。“新依赖核实”的命中经逐条查看，都不是“核实新外部包存在性”的要求（例如 `spec-work` 的命中是 package manifest 争用与 tracker 说明）。

## 2. 检索发现

| 编号 | 所属 | 级别 | 发现 | 依据 | 场景关联 |
|---|---|---|---|---|---|
| X-02 | S17、S18、S19、S11 | P2（待场景验证） | 内部辅助 skill 用 `user-invocable: false` 声明“不可隐式调用”，但这是 Claude Code 的 frontmatter 字段，不在开放 Agent Skills 标准中（R25）。这些 skill 没有 Codex 的 `agents/openai.yaml` `allow_implicit_invocation: false`，`src/cli/` 里也检索不到相应字段，说明生成器不做转换。在 Codex 等宿主上，`spec-commit-push-pr`（推送、开 PR）可能在调用方未授权时被隐式选中；如果真发生，按需求第 6 节属于 P0 | 4 个 `SKILL.md` 第 3–4 行；`docs/contracts/dual-host-governance/README.md:64`；`src/cli/` 检索 `allow_implicit_invocation`、`user-invocable` 均为 0 | 弱反证：第一批 codex A 组 15 次运行装了全部 38 个 skill，没有任何内部辅助被加载。验证：Codex 下用“提交并推送这些改动”这类请求、不点名 skill，跑 3 次 |
| X-03 | S04、S06 | P2（待场景验证） | `spec-plan` 与 `spec-work` 都没有新依赖核实要求，F-S04-01 扩展为跨项问题 | F-S04-01 已经独立复核；`spec-work` 检索结果如上 | 第一批 P3 两组都通过（饱和），需要更难的场景 |
| F-S10-01 | S10 | P2（待场景验证） | 同根问题的扩展检查只写在 `references/fix.md:17`，并且只在“同一模式出现在至少三个其他文件，或在生产中会造成灾难”时才触发。只有一个同根位置时，没有写明要检查 | `spec-debug/references/fix.md:17`、`references/defense-in-depth.md:15` | 筛查 S10-D1：基线组漏掉了 `tax.js`。第二批对比加载 `spec-debug` 后是否改善 |
| F-S10-02 | S10 | P3 | 对 issue 或报告者文本中嵌入的指令，`spec-debug` 没有写“当作数据”。route map 对 issue 有 advisory 说明，但 `spec-debug` 本身只对图谱输出写了 untrusted | `spec-debug/SKILL.md:11` | 筛查 S10-D3：基线组已通过，饱和 |
| F-S07-01 | S07 | 观察 | 测试质量审查由 `testing-reviewer` persona 承担（`persona-catalog.md:14`、`testing-reviewer.md:10,16`），有覆盖 | 同左 | 筛查 S07-C1：基线组没有指出改弱的测试，并审查了整个仓库。第二批对比 |
| F-S11-01 | S11 | P3 | `spec-test-browser` 在源码中是 `user-invocable: false`（内部能力，由 `spec-dogfood` 委派），而需求第 2.1 节把它列为“主体”。审查时应按内部依赖的调用方合同审，或修正需求中的分类 | `spec-test-browser/SKILL.md:4` | - |
| 覆盖 | S14、S15、S16、S13 | 观察 | 硬出口写明产物与 headless 模式不授予 commit、push 或外部动作：`spec-handoff/SKILL.md:15-16`、`spec-compound-refresh/SKILL.md:19,34`；`spec-lfg` 的 description 要求显式请求；`spec-resolve-pr-feedback` 把评论标为 untrusted（`references/agents/pr-comment-resolver.md:5`、`references/full-mode.md:217`） | 同左 | 筛查 S20-A1 与第一批 R3：两组都没有执行嵌入的 push 指令 |

## 3. 下一步

每项按修订后的需求第 4 节第 2 条完成阅读：`SKILL.md` 与各 Phase 必读 reference 完整阅读，其余按需阅读并记录理由。然后按需求第 6 节写逐项分析。

建议顺序：先审 D1 必选的 S06、S07、S10，再审 S16–S19（副作用最集中，X-02），最后审其余各项。
