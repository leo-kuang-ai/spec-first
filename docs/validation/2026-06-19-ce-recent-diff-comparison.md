---
title: CE recent diff comparison against spec-first
date: 2026-06-19
type: validation
target_repo: spec-first
ce_repo: /Users/kuang/xiaobu/compound-engineering-plugin
ce_head: 20f1ab613ad2a7df196f1b4ac6c12bbb2bd2c2f9
spec_first_head: 0843d3e5
status: analysis-only
---

# CE 近期差异逐文件核对

## 事实修正 (2026-06-19 复核)

本报告的「what NOT to sync」结论（Proof 分叉、worktree 去脚本化、release metadata、CE 产品 skill 均不同步）经复核成立。但前向优化路线图有**两处 load-bearing 前提与当前 source 不符**，已修正如下；原始分析保留在下方作为历史证据，不改写。

1. **P2「doc-review origin-aware persona calibration」不是缺失功能，而是已实现机制——属 eval gap，非 feature gap。** 当前 `spec-doc-review` 已实现 origin 校准：`SKILL.md` Phase 1 抽取 `origin:`、Phase 2 把 `{origin}` 传给每个 persona；校准文案在 `skills/spec-doc-review/references/subagent-template.md` document-type-rules（"If `Origin` is not `none`, do not routinely re-litigate upstream WHAT/WHY..."），并由 `tests/unit/spec-doc-review-contracts.test.js` 锁住 dispatch。persona 文件本身不含 origin 文案是**有意设计**（校准注入在 template/orchestrator 层，符合角色契约 §5 dispatch 边界）。本报告分析 CE diff + persona 文件时遗漏了 template 层。真正残留是「机制在场但未度量」——已于 `docs/validation/2026-06-19-origin-calibration-eval.md` 做首次度量，结论 `concerns`（安全性已确认：plan 引入的新 scope 仍高置信触发；抑制性偏弱且 persona 间不一致，真正保护 actionable tier 的是 confidence 50-cap 而非 origin 规则）。

2. **P1「validator fallback」终点对、理由错；已按 spec-first 架构落地。** CE 的问题是单一多宿主插件 `${CLAUDE_SKILL_DIR}` 解析失败；spec-first 不同——`validate-frontmatter.py` 已物理投影到 `.claude/` 与 `.agents/`(Codex) 两个 runtime，且 CLI projection 会按宿主改写「from the X directory」路径，因此「非 Claude 平台找不到脚本」不成立。真正的 spec-first 缺口更窄、对应角色契约 §4 verification gate：脚本**确实无法运行时**（python3 缺失 / 文件不可定位）没有 loud-convention degraded mode，留下 silent-skip 洞。已修复：`skills/spec-compound/SKILL.md` step 8 与 `skills/spec-compound-refresh/references/per-action-flows.md` Replace step 3 增加 degraded-mode 子句（输出 `validator unavailable: <reason>` + 等价手工 checklist，限定脚本原范围、不可静默跳过），并补 `tests/unit/spec-compound-contracts.test.js` 断言防回退。

下表「建议优先级」中 P1/P2 的对应行据此重读：P1 已落地（理由按上文修正），P2 origin-aware 一项从「设计吸收」改为「已实现，已度量为 concerns，强化作为 backlog」。

**方法学说明（2026-06-19 复核补记）：** 上述两处误判的共同根因是本报告**先按 CE git diff / commit 主题**组织裁决，再补全文源码比对。diff 视角只看「哪些文件出现在变更里」，会漏掉位于其它层（如 template/orchestrator、跨宿主 projection）的既有机制——origin 校准就是这样被误判为缺失。因此下方裁决应以「完整 Skill 内容对比」「全量 Skill/Agent 语义对比」等**全文源码章节**为准；开头的「逐文件对比」与 commit 主题表仅作变更背景。

**正文时效标注：** 为遵守「原始分析不改写」，正文裁决点保留原文，并以 `【更新 …】` 内联标注当前状态（validator fallback 已落地、origin 校准已实现并度量为 concerns）。遇到与本节修正冲突处，以本节与内联标注为准。

## 结论

本次用户给出的 26 个文件不是单一 CE commit 的完整 diff，而是近期几个主题的叠加，主要来自：

| CE commit | 主题 | 覆盖文件 |
|---|---|---|
| `0757e859` | 避免在 skill load 的 `!` pre-resolution 中直接 `cat "$(git rev-parse ...)"`；改为只预解析 repo root，再在 skill body 里用原生读文件工具读取配置 | `AGENTS.md`、`ce-brainstorm`、`ce-ideate`、`ce-plan`、`ce-product-pulse`、`ce-work-beta` |
| `5e6eccab` | `validate-frontmatter.py` 在非 Claude 平台不可解析时走显式人工 checklist，而不是静默跳过 | `ce-compound`、`ce-compound-refresh` |
| `3437de30` | `ce-worktree` 从 bundled script creator 改成“先检测已有隔离、优先 harness native worktree、最后 plain git fallback”，并删除脚本 | `README`、`ce-work`、`ce-work-beta`、`ce-worktree` |
| `68dd787f` | Proof 从双向 HITL review/sync loop 收缩为 one-way publish/shareable link | `AGENTS.md`、`ce-proof`、brainstorm/ideate/plan handoff refs |
| `20f1ab61` | CE `3.13.1` release bump | root/package/plugin manifests/changelog |

当前 `spec-first` 与 CE 在这些文件上的核心差异不是简单落后，而是产品边界不同：

- CE 更偏插件包和多宿主 prompt portability：减少 pre-resolution 中的 shell 复杂度，避免 `CLAUDE_SKILL_DIR` 假设，减少 bundled script 依赖。
- `spec-first` 更偏 workflow harness/source-runtime governance：Proof 仍是 internal host-provided HITL helper，`git-worktree` 仍是 internal helper script，Markdown 本地 artifact 仍是 canonical evidence。
- 直接同步 CE 的 Proof one-way publish 或删除 worktree script 会改变当前 workflow contract，不应作为“逐文件补丁”直接落地；需要单独 plan、contract tests 和 downstream consumer 检查。
- 值得考虑的窄同步点只有 `compound`/`compound-refresh` 的 validator fallback 语义：它提升非 Claude 平台可解释降级，且不要求改变主 workflow contract。

## 同步合理性评估与优化路线图

总体判断：**CE 近期改动本身多数合理，但只有一部分适合直接被 `spec-first` 吸收**。原因不是 CE 质量不足，而是两个项目的产品边界不同。CE 的优化目标偏“插件资产在多宿主里少出错、少依赖脚本、方便分享”；`spec-first` 的优化目标偏“workflow harness 有 source/runtime 边界、证据闭环、artifact contract、可验证 handoff”。因此同步策略应是机制级借鉴，而不是文件级套补丁。

### 合理性分层

| CE 主题 | 对 CE 是否合理 | 对 spec-first 是否应同步 | 判断依据 |
|---|---|---|---|
| root-only pre-resolution + native file read | 合理。减少 `!` pre-resolution 中的 shell/subshell/`cat` 兼容风险。 | 条件吸收。当前 `spec-first` 没有同类 `.spec-first/config.local.yaml` 消费面；未来引入配置读取时应采用此模式。 | 这是宿主 portability 机制，不绑定 CE 业务语义。 |
| `compound` validator fallback | 合理。避免非 Claude 平台找不到 skill-bundled script 时静默跳过 parser-safety。 | 优先吸收。改动小、收益明确、不改变主 artifact contract。 | 符合 “scripts prepare, LLM decides”：脚本不可用时显式降级到等价手工 checklist。 |
| Proof one-way publish | 对 CE 合理。降低 API mutation/sync-back 风险，适合 shareable link 产品体验。 | 不直接同步。它会移除 `spec-first` 当前 Proof HITL review + local sync evidence loop。 | 这是产品/contract 决策，不是 wording 更新。 |
| `ce-worktree` native-first + 删除脚本 | 对 CE 合理。减少插件包维护脚本和宿主安全 checker 摩擦。 | 不直接同步。可先吸收 existing-isolation detection；删除脚本需迁移 deterministic safety 能力。 | `spec-first` 脚本当前承担 env opt-in、trust/audit/path-safety 等确定性职责。 |
| `plan-sections.md` 更丰富的写作规则 | 局部合理。CE 对 plan 是否值得写、agent agency、prose economy 的表达更成熟。 | 可单独评估。不能直接覆盖，因为会改变 plan output contract 和下游 tests。 | 内容价值高，但属于 plan contract 改造。 |
| document-review persona origin-aware 降噪 | 合理。避免 plan 带 upstream origin 时重审已定 WHAT。 | ~~值得评估~~ **【更新：已实现于 template/orchestrator 层，已度量为 concerns（抑制偏弱），见事实修正 #1】**，强化方向是把软提示升级为 persona 级硬抑制（参考 CE `Suppress Section 1&5 entirely`）。 | 该机制能降低 false positive，不必改变 artifact schema。 |
| CE-only product skills (`product-pulse`/`strategy`/`promote`/`dogfood-beta`) | 对 CE 产品路线合理。 | 暂不吸收。多数不在当前 `spec-first` 核心链路或需要新 runtime/data contract。 | 避免把 `spec-first` 扩成 product ops/marketing/全自动状态机集合。 |

### 建议优先级

| 优先级 | 建议 | 目标文件/面 | 验收标准 | 风险 |
|---|---|---|---|---|
| P1 | ~~吸收~~ **【更新：已落地，见事实修正 #2】** `compound`/`compound-refresh` validator fallback | `skills/spec-compound/SKILL.md`、`skills/spec-compound-refresh/references/per-action-flows.md`、相关 contract tests | 非 Claude/skill dir 不可解析时，prompt 明确要求输出 unavailable reason 并执行 frontmatter parser-safety 手工 checklist；测试锁住不可静默跳过。**（已满足：`SKILL.md` step 8 + `per-action-flows.md` Replace step 3 + `spec-compound-contracts.test.js`）** | 低。只改降级说明，不改知识文档 schema。 |
| P2 | 评估并设计 doc-review origin-aware persona calibration | `skills/spec-doc-review/SKILL.md`、`agents/spec-{adversarial-document,product-lens,scope-guardian,feasibility,design-lens,security-lens}-reviewer.agent.md` | plan 带 `origin` 时不再系统性重审 brainstorm 已定 WHAT；requirements/greenfield plan 仍保留必要 premise review；有 fresh-source eval 或 focused prompt tests。 | 中。若放错层，可能压掉真正应该被发现的范围/产品问题。 |
| P2 | 给 `git-worktree` 补 existing-isolation detection，而不是删除脚本 | `skills/git-worktree/SKILL.md`、`skills/git-worktree/scripts/worktree-manager.sh`、script tests | 已在 linked worktree 中时不再创建嵌套 worktree；能区分 submodule/普通 checkout/linked worktree；失败时阻塞而非静默继续。 | 中。涉及脚本行为与 workflow handoff 文案。 |
| P3 | 单独审查 CE `plan-sections.md` 的高价值规则 | `skills/spec-plan/references/plan-sections.md`、plan contract tests | 只吸收 “是否需要 plan doc / prose economy / agent agency / metadata clarity” 中与现有 canonical Markdown 不冲突的部分。 | 中。容易无意改变 plan 输出 contract。 |
| P3 | 建立未来 config-read pattern 规范 | 需要真实 consumer 后再定，如 `.spec-first/config.local.yaml` | 若引入本地配置，pre-resolution 只解析 repo root，skill body 用原生 file read，且有 unavailable fallback。 | 低到中。没有 consumer 时不应提前加配置系统。 |
| P4 | Proof product decision | `skills/proof/**`、brainstorm/ideate/plan handoff、proof contracts/tests | 明确 `spec-first` 是否放弃 local sync-backed HITL evidence loop；若迁移 one-way publish，所有 handoff 与 tests 同步更新。 | 高。影响 requirements/plan/ideation canonical artifact 流。 |
| P4 | 评估 dogfood/autofix browser QA | 可能是新 workflow，不应塞入 `spec-work` | 只有在明确 runtime/browser/test isolation contract 后再引入。 | 高。易重建全自动状态机并扩大 mutation 面。 |

### 不建议同步的内容

- 不同步 CE release metadata、plugin manifests、CE README/AGENTS 整段；这些是 CE plugin packaging surface，不是 `spec-first` source truth。
- 不把 CE `.compound-engineering/config.local.yaml`、`pulse_*`、HTML exclusive output 原样迁入 `spec-first`；这会制造新的 source/config truth。
- 不恢复 CE reviewer agent 的 `Write` 工具权限；`spec-first` 应继续把 reviewer 维持为报告型 persona，把 mutation 留给 workflow/autofix/resolver 合同。
- 不删除 `skills/git-worktree/scripts/worktree-manager.sh`，除非先迁移并测试脚本承载的 deterministic safety 能力。
- 不恢复或引入 `lfg` 式全自动端到端流水线作为公开入口；这与当前 `using-spec-first` 的 workflow governance 和 internal-helper 边界冲突。

### 推荐落地顺序

1. 先做 P1 validator fallback。这是最小、最确定、最贴合当前双宿主能力的同步点。
2. 再做 P2 doc-review origin-aware 降噪评估。优先从报告/测试证明 false positive reduction，而不是直接改全部 persona。
3. 再做 P2 worktree existing-isolation detection。先增强当前脚本/skill，暂不转 native-first。
4. 后续以独立 plan 评估 `plan-sections.md` 高价值 prose 和 Proof 产品方向；两者都不要混进小同步补丁。

## 边界与证据

比较对象：

- 当前项目：`/Users/kuang/xiaobu/spec-first`
- CE 源项目：`/Users/kuang/xiaobu/compound-engineering-plugin`
- CE 当前 HEAD：`20f1ab61 chore: release main (#953)`，tag `compound-engineering-v3.13.1`
- 当前项目已有历史同步基线：`docs/validation/2026-06-03-ce-4cc6f7a6-sync-ledger.md`，记录曾以 CE `4cc6f7a6` 为同步基线。

已执行的核对命令包括：

- `git -C /Users/kuang/xiaobu/compound-engineering-plugin log --oneline 4cc6f7a6..HEAD -- <listed paths>`
- `git -C /Users/kuang/xiaobu/compound-engineering-plugin show --stat/--unified ...`
- `rg -n` 和 `nl -ba` 针对当前 `skills/spec-*`、`skills/proof`、`skills/git-worktree`、`README.md`、`AGENTS.md`、`CHANGELOG.md`

限制：

- 这是 analysis-only 文档；未修改被比较的 skill、agent、CLI、template 或 generated runtime。
- 当前 worktree 在本次前已有未提交改动；本报告只新增本文档并追加 changelog 条目，不回退、不覆盖既有改动。
- Graph/codegraph 等 provider 输出未作为结论证据；判断来自 git diff、源文件 direct read 和当前仓库历史 ledger。

## 逐文件对比

| # | CE 文件 | 当前项目对应面 | CE 变化点 | 当前 `spec-first` 差异 | 判断 |
|---:|---|---|---|---|---|
| 1 | `package.json` | `package.json` | `@every-env/compound-plugin` `3.13.0 -> 3.13.1` release bump | 当前包是 `spec-first@1.11.4`，CommonJS CLI/harness 包，不是 CE plugin 包 | 不同步；release metadata 独立治理 |
| 2 | `plugins/compound-engineering/.claude-plugin/plugin.json` | 无直接 source 对应 | CE Claude plugin manifest version `3.13.1` | 当前项目没有 `.claude-plugin/plugin.json` source；runtime 由 `spec-first init` 和 adapters 投射 | 不同步；CE-only marketplace metadata |
| 3 | `plugins/compound-engineering/.codex-plugin/plugin.json` | 无直接 source 对应 | CE Codex plugin manifest version `3.13.1` | 当前项目通过 CLI/runtime projection 支持 Codex，没有 checked-in Codex plugin manifest | 不同步 |
| 4 | `plugins/compound-engineering/.cursor-plugin/plugin.json` | 无直接 source 对应 | CE Cursor plugin manifest version `3.13.1` | 当前项目无 Cursor plugin surface | 不同步 |
| 5 | `plugins/compound-engineering/AGENTS.md` | `AGENTS.md` | 两处语义：配置读取 blessed pattern；Proof ghost limitation 从 HITL 改为 publish/share workflow | 当前 `AGENTS.md` 是 spec-first governance source，只有入口治理、source/runtime、语言策略等；不含 CE `.compound-engineering/config.local.yaml` 或 Proof ghost block | 不同步整段；配置读取 pattern 可作为后续 skill 设计参考 |
| 6 | `plugins/compound-engineering/CHANGELOG.md` | `CHANGELOG.md` | CE plugin changelog 新增 `3.13.1` release notes | 当前 changelog 记录 spec-first source 变更，格式和 semver 独立 | 不同步 |
| 7 | `plugins/compound-engineering/README.md` | `README.md` | `ce-worktree` 描述从“Manage Git worktrees”改为“Ensure work happens in an isolated git worktree ...” | 当前 README 不把 internal `git-worktree` 列为公开入口，只在 CLI reference 提 `repair-worktree`/`session` | 不同步；内部 helper 不应公开化 |
| 8 | `skills/ce-brainstorm/SKILL.md` | `skills/spec-brainstorm/SKILL.md` | `output:*` 配置读取改为 root-only pre-resolution + skill body 原生读 `.compound-engineering/config.local.yaml` | 当前 `spec-brainstorm` 没有 exclusive `OUTPUT_FORMAT` 配置读取；spec-first 曾将 HTML output 收敛为 Markdown canonical + optional sidecar，而非 CE exclusive output | 不适用；若未来引入配置，应映射到 `.spec-first/config.local.yaml` 并用 native read |
| 9 | `skills/ce-brainstorm/references/handoff.md` | `skills/spec-brainstorm/references/handoff.md` | Proof 菜单从“Open in Proof and iterate”改为“Publish to Proof -- shareable link”；删除 sync-back/status handling | 当前仍显式进入 `proof` HITL-review mode，要求评论 ingest、accepted edits、atomic sync back，并按 `localSynced` 重新评估后续选项 | 不同步；这会降级当前 requirements doc 的双向 review contract |
| 10 | `skills/ce-brainstorm/references/universal-brainstorming.md` | `skills/spec-brainstorm/references/universal-brainstorming.md` | universal mode 的 Proof 入口改为 one-way publish | 当前仍是 “Open in Proof ... iterate with the agent”，且说明 `proof` 是 host-provided helper | 不同步；同 #9 |
| 11 | `skills/ce-compound-refresh/references/per-action-flows.md` | `skills/spec-compound-refresh/references/per-action-flows.md` | validator 改为先判断 `${CLAUDE_SKILL_DIR}` 与脚本存在；不可解析时输出原因并手工执行 parser-safety checklist | 当前仍要求从 `skills/spec-compound-refresh/` 目录运行 `python3 scripts/validate-frontmatter.py`，没有非 Claude fallback 说明 | ~~候选同步~~ **【更新：已落地，见事实修正 #2】**；已改成 spec-first source/runtime 兼容写法并补 contract test |
| 12 | `skills/ce-compound/SKILL.md` | `skills/spec-compound/SKILL.md` | 同 #11，并在 support files 说明 validator 只在 Claude Code 可通过 `${CLAUDE_SKILL_DIR}` 解析，其他平台走手工 checklist | 当前仍写 `Run python3 scripts/validate-frontmatter.py` from skill dir，没有手工降级路径 | ~~候选同步~~ **【更新：已落地，见事实修正 #2】**；曾是本批最可迁移的低风险语义 |
| 13 | `skills/ce-ideate/SKILL.md` | `skills/spec-ideate/SKILL.md` | 两类变化：配置读取 blessed pattern；Proof wording 从 open/iterate 改为 publish | 当前 `spec-ideate` 无 CE output config；Proof 仍为 HITL review/sync，`post-ideation-workflow` 管 mode-aware persistence | 不同步；Proof one-way 是 contract change |
| 14 | `skills/ce-ideate/references/post-ideation-workflow.md` | `skills/spec-ideate/references/post-ideation-workflow.md` | 菜单从 “Open and iterate in Proof” 改为 “Publish to Proof”；local doc stays canonical；不再 sync back | 当前 repo mode 中 Proof-reviewed content 会 sync 到 `docs/ideation/`；elsewhere mode 可把 Proof 作为 canonical record | 不同步；当前 mode-aware persistence 更强，直接替换会破坏 downstream assumptions |
| 15 | `skills/ce-ideate/references/universal-ideation.md` | `skills/spec-ideate/references/universal-ideation.md` | universal ideation 也改为 one-way Proof publish | 当前 universal mode 多处把 Proof 视作 default durable/persistence path，并保留 HITL/failure ladder | 不同步；需产品决策后整体迁移 |
| 16 | `skills/ce-plan/SKILL.md` | `skills/spec-plan/SKILL.md` | 配置读取 blessed pattern；post-generation menu 把 Proof HITL 改成 publish；删除 post-HITL resync 文案 | 当前 `spec-plan` 没有 CE output config；plan handoff 仍加载 Proof HITL，并要求 post-HITL re-review | 不同步 |
| 17 | `skills/ce-plan/references/plan-handoff.md` | `skills/spec-plan/references/plan-handoff.md` | Proof option 改为 publish link；local plan stays canonical；删除 `localSynced`/pull/re-review flow | 当前 handoff 明确 `proof` HITL mode、`localSynced` 分支、pull fallback、post-HITL `spec-doc-review` rerun | 不同步；这是有意保留的 evidence/review loop |
| 18 | `skills/ce-plan/references/plan-sections.md` | `skills/spec-plan/references/plan-sections.md` | 删除 `origin` 字段说明中 “HITL Proof flow uses origin...” 句子 | 当前 `spec-plan` 的 `origin` 说明已简化为 repo-relative upstream requirements path，不承载该 Proof 句子 | 已等价/无需动作 |
| 19 | `skills/ce-plan/references/universal-planning.md` | `skills/spec-plan/references/universal-planning.md` | universal planning 从 “Open in Proof”/“Save and open” 改为 “Publish to Proof”/“Save and publish” | 当前仍是 Proof review/comment/iterate 表达 | 不同步；同 Proof 产品边界 |
| 20 | `skills/ce-product-pulse/SKILL.md` | 无直接 source 对应 | 配置读取 blessed pattern，读取 `pulse_*` keys | 当前项目没有 `spec-product-pulse` skill；相近的 product lens/audit surfaces 不是同一功能 | 不同步；CE-only skill |
| 21 | `skills/ce-proof/SKILL.md` | `skills/proof/SKILL.md` | 描述从 HITL review loop 改为 publish/view/comment/edit；`Publish Mode` 成为主路径；新增从 local file 用 `jq --rawfile` 发布，Pull 只作为显式动作 | 当前 `proof` 仍声明 HITL Review Mode，固定 `ai:spec-first` identity，加载 `references/hitl-review.md`，并支持 sync back | 不同步；需要独立 Proof 产品决策和 tests |
| 22 | `skills/ce-proof/references/hitl-review.md` | `skills/proof/references/hitl-review.md` | CE 删除整个 393 行 HITL review loop reference | 当前仍保留 HITL review mode：upload、comment ingest、mutation retry、end-sync confirmation、atomic local write | 不同步；删除会破坏 brainstorm/ideate/plan handoff |
| 23 | `skills/ce-work-beta/SKILL.md` | 无当前 source 对应；历史上有 `spec-work-beta` references 但无 file | 两处：配置读取 blessed pattern；worktree option 文案改为 detects existing/native/fallback | 当前没有 `skills/spec-work-beta/SKILL.md`，stable `spec-work` 是主执行入口 | 不同步 |
| 24 | `skills/ce-work/SKILL.md` | `skills/spec-work/SKILL.md` | worktree option 注释从“create new branch”改为“detect existing isolation, prefer native tool, else create” | 当前 `spec-work` 仍说 `git-worktree` 会 create a new branch in isolated worktree | 不直接同步；当前 helper 仍脚本式创建，文案只能随 helper contract 一起改 |
| 25 | `skills/ce-worktree/SKILL.md` | `skills/git-worktree/SKILL.md` | CE 把 `ce-worktree` 改成 isolation policy：检测已有 linked worktree/submodule，优先 native harness worktree tool，fallback plain git；去掉 `allowed-tools: Bash(bash *worktree-manager.sh)` | 当前 `git-worktree` 是 internal-only helper，仍通过 bundled `worktree-manager.sh`，有 `--copy-env` opt-in、dev-tool trust、audit/safety 细节 | 不同步；这是架构/contract 迁移，不是 prose patch |
| 26 | `skills/ce-worktree/scripts/worktree-manager.sh` | `skills/git-worktree/scripts/worktree-manager.sh` | CE 删除脚本 | 当前仍保留并强化脚本：opt-in env copy、symlink/path escape 防护、dev-tool trust、安全日志等 | 不同步；删除需替换 tests 和 runtime delivery contract |

## 完整 Skill 内容对比

本节不只看 CE 近期 hunk，而是按 CE 当前 HEAD 的完整 skill/reference 文件，与当前 `spec-first` 对应 source 做 full-content 比对。`insertions/deletions` 是 `git diff --no-index --shortstat <ce-file> <spec-first-file>` 的方向性统计，只用于衡量完整文件差异规模，不表示应该逐行套补丁。

### Full-File Diff Matrix

| CE skill/ref | spec-first 对应 | CE 行数 | spec 行数 | full-file diff 规模 | 结构/内容差异 | 判断 |
|---|---|---:|---:|---|---|---|
| `ce-brainstorm/SKILL.md` | `spec-brainstorm/SKILL.md` | 307 | 294 | 82 insertions / 95 deletions | 两者主流程同为 Phase 0-4；spec-first 额外有 `Workflow Contract Summary`、`Scenario Capability`、`Capability-Class Evidence Boundary`、`Domain Language And Decision Ledger`、`External-Tool Context`；CE 有 `Model Tiers` 与 exclusive output mode/config 语义 | spec-first 不是简单落后；保留 harness contract 层，CE output/config 不直接迁移 |
| `ce-brainstorm/references/handoff.md` | `spec-brainstorm/references/handoff.md` | 125 | 128 | 30 insertions / 27 deletions | 结构几乎一致；核心差异集中在 Proof：CE 是 one-way publish，spec-first 是 HITL review + sync back + stale-local handling | 不同步 Proof 语义 |
| `ce-brainstorm/references/universal-brainstorming.md` | `spec-brainstorm/references/universal-brainstorming.md` | 64 | 64 | 5 insertions / 5 deletions | 完整结构一致；差异主要是 `/ce-plan` vs current-host `spec-plan` 和 Proof publish vs HITL wording | 仅 branding/Proof 边界差异，无需迁移 |
| `ce-compound-refresh/references/per-action-flows.md` | `spec-compound-refresh/references/per-action-flows.md` | 100 | 84 | 4 insertions / 20 deletions | CE Replace flow 的 validator fallback 更完整；spec-first 保留较短脚本运行要求 | 候选同步点 |
| `ce-compound/SKILL.md` | `spec-compound/SKILL.md` | 646 | 630 | 164 insertions / 180 deletions | CE 有 `CONCEPTS.md bootstrap requests`、更显式 mode detection 和 output sections；spec-first 有 `Workflow Contract Summary`、runtime context exclusion、summary-first handoff、structured promotion gate、distilled replay refs | spec-first治理层更厚；只考虑吸收 validator fallback，不整段迁移 |
| `ce-ideate/SKILL.md` | `spec-ideate/SKILL.md` | 400 | 410 | 159 insertions / 150 deletions | 两者同为 Phase 0-2 主体；spec-first 增加 contract summary、dispatch boundary、capability evidence boundary；CE 保留 output config、model tiers/Fable 相关优化和 publish wording | 需按 ideation 产品边界单独拆判，不直接同步 |
| `ce-ideate/references/post-ideation-workflow.md` | `spec-ideate/references/post-ideation-workflow.md` | 167 | 241 | 161 insertions / 87 deletions | CE 是自动写 deliverable + Phase 5 next steps + publish Proof；spec-first 拆成 survivors presentation、mode-aware opt-in persistence、Proof failure ladder、repo/elsewhere caller-aware return | spec-first 当前更强调 persistence gate 和 failure recovery；不套 CE |
| `ce-ideate/references/universal-ideation.md` | `spec-ideate/references/universal-ideation.md` | 108 | 75 | 19 insertions / 52 deletions | CE 增加 “How to decompose” 与更长 universal wrap-up；spec-first 保持更短 facilitation，并把 Proof/default persistence 交给 post-workflow | 可作内容参考，不是必迁 |
| `ce-plan/SKILL.md` | `spec-plan/SKILL.md` | 794 | 757 | 244 insertions / 281 deletions | spec-first 增加 `Plan-Only Safety Contract`、contract summary、scenario capability、examples、implementation-worker suitability gate、direct evidence；CE 保留 exclusive output config、HTML-aware post-generation 和 publish Proof | spec-first 是治理强化版；CE HTML/publish 不能直接覆盖 |
| `ce-plan/references/plan-handoff.md` | `spec-plan/references/plan-handoff.md` | 120 | 99 | 32 insertions / 53 deletions | CE handoff 有 output-format gate、publish Proof、deeper doc review menu；spec-first 保留 mandatory review、Proof HITL sync、post-HITL re-review、task-pack handoff | 不同步 Proof；可单独评估 CE 的 HTML-format gate |
| `ce-plan/references/plan-sections.md` | `spec-plan/references/plan-sections.md` | 286 | 81 | 54 insertions / 259 deletions | CE plan section contract 明显更长，含 `Decide whether a plan doc is warranted`、`Agent agency`、`Prose economy`、更完整 metadata fields；spec-first 版本短，强调 hard floor、metadata、ID/content rules、rendering boundary | CE 这里有可借鉴内容，但迁移会改 plan 输出 contract，需 plan/doc-review/test 一起做 |
| `ce-plan/references/universal-planning.md` | `spec-plan/references/universal-planning.md` | 168 | 148 | 27 insertions / 47 deletions | 两者同构；CE 额外强调 answer-seeking flow、format decision、save/publish Proof；spec-first 保留 host-provided Proof review | 小差异；Proof 不同步 |
| `ce-product-pulse/SKILL.md` | 无 | 179 | 0 | N/A | CE-only product analytics/pulse workflow，依赖 `pulse_*` config 和 `docs/pulse-reports/` | 当前项目无对应入口；不迁移 |
| `ce-proof/SKILL.md` | `proof/SKILL.md` | 412 | 405 | 58 insertions / 65 deletions | 文件长度接近但核心模式相反：CE `Publish Mode`，spec-first `Human-in-the-Loop Review Mode`；CE 新增 local file publish via `jq --rawfile`，spec-first 保留 sync-back pull/end-sync | contract 决策，不是补丁 |
| `ce-proof/references/hitl-review.md` | `proof/references/hitl-review.md` | 0 | 394 | CE current absent | CE 当前已删除 HITL loop reference；spec-first 仍完整保留 invocation、ingest pass、terminal report、next-signal prompt、end-sync、mutation recipes | spec-first 当前有意保留 |
| `ce-work-beta/SKILL.md` | 无 | 442 | 0 | N/A | CE beta execution skill，含 Codex delegation mode、config-driven delegation | 当前项目无 `spec-work-beta` source；stable `spec-work` 承担执行入口 | 不迁移 |
| `ce-work/SKILL.md` | `spec-work/SKILL.md` | 383 | 551 | 223 insertions / 55 deletions | CE work 更 lean；spec-first 增加 contract summary、scenario capability、context orientation、anti-rationalization、runtime exclusion、cache-friendly context、summary-first handoff、recall trust boundary、run artifact boundary | spec-first 明显更重治理/证据闭环；不回退到 CE lean flow |
| `ce-worktree/SKILL.md` | `git-worktree/SKILL.md` | 78 | 87 | 46 insertions / 37 deletions | CE 是 native-first isolation policy；spec-first 是 internal helper + bundled script creation contract | 架构迁移候选，不直接同步 |
| `ce-worktree/scripts/worktree-manager.sh` | `git-worktree/scripts/worktree-manager.sh` | 0 | 374 | CE current absent | CE 删除脚本；spec-first 脚本仍实现 opt-in env copy、dev-tool trust、path/symlink safety、audit log 等 deterministic behavior | 不删除；需单独 migration plan |

### 按 Skill 的完整内容判断

**Brainstorm**

CE 与 spec-first 的对话阶段、需求捕获、handoff 主骨架仍相近；差异集中在外围合同。CE 完整内容包含 output format resolution、model tiers 和最近的 config-read 改造；spec-first 完整内容增加 workflow contract、scenario/capability evidence、domain language/decision ledger 和 Slack/external-tool context。结论：spec-first 不是缺少 CE 主流程，而是有意把 brainstorm 放进 harness evidence/governance 边界；CE 的配置读取方式可借鉴，但 CE exclusive HTML output 和 Proof publish 不应直接迁入。

**Compound / Compound Refresh**

CE 和 spec-first 都围绕 `docs/solutions/` 与 `CONCEPTS.md` 维护，但 spec-first 的完整 skill 明显增加 structured promotion gate、runtime context exclusion、summary-first handoff、distilled replay refs 和 source-confirmed learning 规则。CE 当前最有价值的完整内容差异是 `validate-frontmatter.py` 的跨宿主 fallback：它避免非 Claude 平台因找不到 skill bundle script 而静默跳过 parser-safety。结论：只同步 validator fallback，不迁移 CE 的较宽 `CONCEPTS.md bootstrap` 表达。

**Ideate**

CE ideate 当前更偏“自动写 deliverable + HTML/Proof shareable artifact”；spec-first ideate 更偏 mode-aware persistence：repo mode 默认本地 `docs/ideation/`，elsewhere mode 可用 Proof，且有 Proof failure ladder。完整内容比对显示 spec-first 的 post-workflow 比 CE 多 74 行，主要就是 persistence gate、caller-aware return 和 failure fallback。结论：CE 的 universal decomposition 可以作为参考；Proof publish 和 HTML default 不应直接覆盖 spec-first 的 mode-aware contract。

**Plan**

CE plan 完整内容保留了 HTML-aware/output-format 路径，并且 `plan-sections.md` 比 spec-first 丰富很多，尤其是“是否值得写 plan doc”、“agent agency”、“prose economy”和 metadata 字段说明。spec-first plan 则多了 plan-only safety、implementation worker suitability、direct evidence、examples/context contracts、mandatory doc review 和 task-pack/work handoff。结论：CE `plan-sections.md` 有可借鉴素材，但这是 plan output contract 迁移，不能作为当前这批 CE 近期 diff 的顺手同步项。

**Proof**

完整内容比对确认不是局部措辞漂移，而是产品模式分叉。CE 当前 `ce-proof/SKILL.md` 已经以 `Publish Mode` 为主，`references/hitl-review.md` 在 CE HEAD 不存在；spec-first 仍完整保留 HITL review loop 和 sync-back。结论：这必须先回答“spec-first 是否还要 Proof 作为本地 canonical artifact 的 human review loop”，否则不改。

**Work / Work Beta**

CE stable `ce-work` 更短；`ce-work-beta` 是 CE-only Codex delegation 实验入口。spec-first `spec-work` 完整内容更重，覆盖 context orientation、anti-rationalization、runtime context exclusion、summary-first handoff、recall trust boundary、run artifact boundary 等。结论：spec-first 的执行 workflow 已经显著偏 harness 化，不应向 CE lean prompt 回退；CE work-beta 无当前迁移目标。

**Worktree**

CE 完整内容已从“脚本创建器”转为“隔离策略”：先检测当前是否已有 linked worktree，再优先宿主 native worktree 工具，最后 fallback plain git。spec-first 仍以 internal `git-worktree` helper 和 `worktree-manager.sh` 为 deterministic implementation，且脚本内有 CE 删除后不再覆盖的 env/trust/audit/path-safety 行为。结论：CE 的 Step 0 existing-isolation detection 值得立项吸收，但删除脚本或转 native-first 需要完整 contract migration。

## 全量 Skill 语义对比（以 spec-first 为主）

本节按当前 `spec-first/skills/*/SKILL.md` 全量列出，而不是只看用户给出的 CE 近期 diff 文件。判断口径是：skill 在 workflow 链路里的职责、输入输出合同、source/runtime 边界、证据要求、dispatch/mutation 边界是否等价。

| spec-first skill | CE 对应 | 内容级差异 | 迁移判断 |
|---|---|---|---|
| `agent-native-architecture` | `ce-agent-native-architecture` | CE 是较短的 agent-native 原则说明；spec-first 增加 canonical taxonomy、invocation boundary、runtime/source boundary、failure modes 和 reference routing，把它从“设计理念 prompt”提升为可审查的架构方法论。 | 保留 spec-first；不回退到 CE 精简版。 |
| `agent-native-audit` | `ce-agent-native-audit` | 两者都按 action parity、tools as primitives、context injection、shared workspace 等维度打分；spec-first 第一步改为加载 agent-native source context，强调当前 source，而不是只加载 skill。 | 基本同源；spec-first 更适合本仓自审。 |
| `changelog` | 无 | spec-first-only，用于把近期 merge 写成面向用户的 changelog；CE 没有对应 skill，CE 的插件 release notes 由 `ce-release-notes`/CHANGELOG 承担。 | 不迁移；这是本仓独立辅助能力。 |
| `feature-video` | `ce-demo-reel` | 几乎同构，都是面向 PR 的 GIF、截图、终端录屏证据采集；差异主要是命名和品牌。 | 近等价，无需动作。 |
| `frontend-design` | `ce-frontend-design` | 完整结构和内容基本一致：设计系统优先、上下文分类、typography/color/composition/motion/accessibility、截图验证。 | 近等价，无需动作。 |
| `gemini-imagegen` | `ce-gemini-imagegen` | 基本一致，都是 Gemini/Nano Banana Pro 图像生成和编辑参考；spec-first 只是命名、品牌和少量文案差异。 | 近等价，无需动作。 |
| `git-clean-gone-branches` | `ce-clean-gone-branches` | 基本一致，都是发现 gone tracking branches、展示确认、删除已确认本地分支。 | 近等价，无需动作。 |
| `git-commit` | `ce-commit` | CE 是较短的 commit workflow；spec-first 增加更明确的 context fallback 和项目指令读取边界，更符合本仓 changelog/source discipline。 | 保留 spec-first。 |
| `git-commit-push-pr` | `ce-commit-push-pr` | CE 把 commit/push/PR 压成 5 步；spec-first 增加 description update workflow、existing PR 处理、PR body 证据组织和更强上下文收集。 | 保留 spec-first；不吸收 CE 精简版。 |
| `git-worktree` | `ce-worktree` | CE 现在是 native-first isolation policy：先检测已有隔离，再用宿主 native worktree，最后 plain git fallback；spec-first 是 internal helper，仍以 bundled script 提供确定性 worktree 创建、env opt-in、trust/audit/path safety。 | CE 的“已有隔离检测”值得单独规划；删除脚本或 native-first 迁移需 contract/test 方案。 |
| `proof` | `ce-proof` | CE 当前主语义是 Publish Mode：本地文件发布成 shareable link，Proof 不再同步回本地；spec-first 主语义仍是 Human-in-the-Loop review loop，支持评论 ingest、accepted edits、atomic sync back 和 `localSynced` handoff。 | 产品/contract 分叉，不逐文件同步。 |
| `report-bug` | `ce-report-bug` | 结构等价，差异是产品名、issue 仓库和环境字段措辞。 | 仅品牌差异，无需动作。 |
| `resolve-pr-feedback` | `ce-resolve-pr-feedback` | CE 描述为并行修复 PR feedback；spec-first 加了 mutating resolver dispatch boundary，强调 resolver 何时可写、父 skill 如何合并与校验。 | 保留 spec-first；这比 CE 更符合 mutation boundary。 |
| `spec-app-consistency-audit` | 无 | spec-first-only，审查移动 App 的 PRD、Figma、本地 source、KMP/Clean Architecture、analytics、i18n 与 rule packs 一致性；CE 没有该 mobile audit workflow。 | 不迁移；本仓新增领域审计入口。 |
| `spec-brainstorm` | `ce-brainstorm` | 主流程同源；CE 有 model tiers、exclusive output config、Proof publish；spec-first 增加 workflow contract、scenario capability、capability-class evidence、domain language decision ledger、external-tool context，并保持 Markdown canonical requirements。 | 保留 spec-first harness 层；CE config-read 模式可作为未来配置读取参考。 |
| `spec-code-review` | `ce-code-review` | CE 是较 lean 的 tiered persona review，interactive mode 可应用 safe fixes；spec-first 大幅加厚：run artifact boundary、headless/report-only/autofix 模式、direct evidence、runtime exclusion、rule maturity candidates、dispatch authorization fallback、capability-class evidence。 | 保留 spec-first；CE 可读性更轻，但会削弱本仓 review evidence loop。 |
| `spec-compound-refresh` | `ce-compound-refresh` | 两者都维护 `docs/solutions/`；spec-first 加 structured promotion gate、scenario capability、distilled replay refs 和 source/runtime 边界；CE 最新 per-action flow 增加 validator unavailable 时的手工 frontmatter checklist。 | 吸收 validator fallback 是低风险候选；不迁移 CE 整体较宽的模式。 |
| `spec-compound` | `ce-compound` | CE 明确支持 `CONCEPTS.md` bootstrap；spec-first 更强调 workflow contract、runtime context exclusion、summary-first handoff、structured promotion gate、distilled replay refs、source-confirmed learning。 | 只考虑同步 validator fallback；不把 `CONCEPTS.md` bootstrap 扩为当前主合同。 |
| `spec-debug` | `ce-debug` | CE 是简洁 debug loop；spec-first 加 contract summary、scenario capability、anti-rationalization、domain decision ledger、recall trust boundary、runtime exclusion、direct evidence 和 capability-class boundary。 | 保留 spec-first；它是 evidence-first debug workflow。 |
| `spec-dhh-rails-style` | `ce-dhh-rails-style` | 基本一致，都是 DHH/37signals Rails 风格指南；差异只有品牌/格式细节。 | 近等价，无需动作。 |
| `spec-doc-review` | `ce-doc-review` | CE 默认 parallel persona document review；spec-first 明确 Codex dispatch authorization、single-agent/report-only fallback、task-pack 文档类型、summary-first section bundles、direct evidence summary、scale-aware posture。 | 保留 spec-first；CE 的 origin-aware persona calibration **【更新：spec-first 已在 template 层实现并度量为 concerns，见事实修正 #1】**，后续方向是强化抑制强度而非从零评估。 |
| `spec-ideate` | `ce-ideate` | CE 更偏生成 deliverable、HTML/Proof shareable artifact、model tiers；spec-first 更偏 mode-aware grounding、dispatch boundary、capability evidence、repo/elsewhere persistence gate 和后续 workflow handoff。 | 不同步 Proof/HTML 默认；可参考 CE 的 topic-surface decomposition 表达。 |
| `spec-mcp-setup` | `ce-setup` | CE 是插件环境健康检查、版本、repo-local config 和依赖安装；spec-first 是 harness runtime readiness facts、Claude/Codex required runtime、guided setup、verify/repair 边界。 | 不是同一职责；不迁移。 |
| `spec-optimize` | `ce-optimize` | 两者都是 metric-driven experiment loop；spec-first 增加 admission/budget gate、runtime exclusion、evidence utilization、dispatch/backend boundary、persistence discipline；CE 更强调 `.context/compound-engineering/ce-optimize` checkpoint、identity detection、branch/scratch space。 | 保留 spec-first；CE checkpoint 目录策略不适合直接套用。 |
| `spec-plan` | `ce-plan` | CE plan 保留 output format/HTML/Proof publish 和更长 `plan-sections` 素材；spec-first 加 plan-only safety、worker suitability gate、direct evidence、mandatory review、task-pack handoff、source/runtime contract。 | CE `plan-sections.md` 可单独审查吸收；Proof/HTML 不直接迁移。 |
| `spec-polish-beta` | `ce-polish` | CE 是手动启动的 browser polish；spec-first 加 workflow contract、scenario capability、输入输出/失败模式和 downstream consumers。 | 保留 spec-first；行为近似但治理更完整。 |
| `spec-prd` | 无 | spec-first-only，面向 brownfield PRD-grade requirements，补 code-aware current-state analysis、change delta、domain language 和 PRD 到 plan 的 source handoff。 | 不迁移；CE 没有对应 PRD 层。 |
| `spec-release-notes` | `ce-release-notes` | 两者同源 release summary/query；spec-first 增加 workflow contract、scenario capability、evidence boundary，并绑定 spec-first release/version 语义。 | 保留品牌与 evidence boundary 差异。 |
| `spec-sessions` | `ce-sessions` | CE 搜 Claude/Codex/Cursor；spec-first 目前面向 Claude/Codex coding-agent session history，增加 current date boundary、distilled replay refs、advisory vocabulary hook 和本仓 replay evidence 语义。 | 保留 spec-first；Cursor 支持不是当前 runtime contract。 |
| `retired-skill-review` | 无 | spec-first-only，审查 skill/agent 的 trigger precision、scope、I/O contract、eval readiness、dual-host governance 和 generated runtime drift。 | 不迁移；这是 spec-first 自身治理入口。 |
| `spec-slack-research` | `ce-slack-research` | CE 是短 workflow；spec-first 增加 contract summary、scenario capability、输出 artifact、MCP/dispatch 边界，强调 interpreted organizational context 而非 raw messages。 | 保留 spec-first；CE 仅作同源参考。 |
| `spec-work` | `ce-work` | CE stable work 是较 lean 的执行 workflow；spec-first 增加 context orientation、feedback loop、anti-rationalization、runtime exclusion、summary-first handoff、recall trust、direct evidence、run artifact boundary、task-pack validation。 | 保留 spec-first；不回退到 CE lean flow。 |
| `spec-write-tasks` | 无 | spec-first-only，把 settled plan 编译为可验证 derived task pack，含 hash/spec_id validation、JSON contract、optional doc-review continuation、plan single source-of-truth。 | 不迁移；CE 没有 task-pack 层。 |
| `test-browser` | `ce-test-browser` | 基本一致，都是按 PR/branch 影响页面启动 dev server、浏览器测试、人工验证和报告。 | 近等价，无需动作。 |
| `test-xcode` | `ce-test-xcode` | 基本一致，都是 XcodeBuildMCP build/install/launch/test/cleanup 流程。 | 近等价，无需动作。 |
| `using-spec-first` | 无 | spec-first-only entry governor，决定 substantial work 是否进入 `$spec-*` workflow，定义 lightweight direct outcomes、source/runtime、dispatch authorization、parent workspace target_repo 边界。 | 核心治理，不迁移。 |

### CE-only Skill 附录

| CE-only skill | 作用 | 与 spec-first 的关系 |
|---|---|---|
| `ce-dogfood-beta` | 自动 diff branch、构建浏览器 QA matrix、执行修复循环并写报告。 | spec-first 当前没有 hands-off dogfood/autofix browser QA 入口；若引入应走独立 plan，不能塞进 `spec-work`。 |
| `ce-product-pulse` | 基于 `.compound-engineering/config.local.yaml` 生成 usage/quality/error pulse report。 | spec-first 无 product analytics runtime/config 合同；不迁移。 |
| `ce-promote` | 为刚发布功能写 X、LinkedIn、email、blog、demo script 等推广文案。 | spec-first 当前不把 marketing copy 纳入核心 Codebase -> Knowledge 链路；不迁移。 |
| `ce-riffrec-feedback-analysis` | 解析 Riffrec 反馈 zip/video/audio bundle，路由 setup、bug report、深度分析。 | 产品专用 workflow；不迁移。 |
| `ce-simplify-code` | 三个 review agent 并行找 reuse、quality、efficiency 改进并修复。 | spec-first 用 code-review/maintainability/review personas 承担，未设独立 simplify 入口。 |
| `ce-strategy` | 创建维护 `STRATEGY.md`，为 CE ideate/brainstorm/plan 提供 upstream grounding。 | spec-first 当前用 PRD/brainstorm/plan/docs 组合，不设全局 strategy doc 真相源。 |
| `ce-update` | 检查并应用 CE plugin version update。 | spec-first 更新路径是终端 `spec-first update`，不是 skill。 |
| `ce-work-beta` | `ce-work` 的 beta 版本，含外部 delegate/Codex delegation mode。 | spec-first 当前 stable `spec-work` 不设 beta delegation 入口；若引入需 dispatch/authorization contract。 |
| `lfg` | 全自动 plan/work/review/test/commit/push/PR/CI 修复流水线。 | spec-first 当前已退役 legacy/internal `lfg`，避免把强状态机暴露成默认入口。 |

## 全量 Agent 语义对比（以 spec-first 为主）

全量 agent 对比显示：CE 没有 CE-only agent，差异主要集中在三类。第一，很多 CE code-review persona 带 `Write`，spec-first 对应 reviewer 去掉 `Write`，把 mutation 留给 workflow/autofix/resolver 边界。第二，spec-first 新增若干本仓治理 agent（CLI readiness、schema drift、Kieran/DHH 语言风格、data migration expert）。第三，部分 CE document reviewer 内置 `Document type + Origin` adaptation，spec-first 版本更偏 role ownership boundary，这可能减少每个 persona 的复杂度，但也需要 `spec-doc-review` orchestration 保证不会重审上游已定的 WHAT。

| spec-first agent | CE 对应 | 内容级差异 | 迁移判断 |
|---|---|---|---|
| `spec-adversarial-document-reviewer` | `ce-adversarial-document-reviewer` | CE 内置 document type/origin adaptation，避免 plan 带 origin 时重审需求前提；spec-first 删除该大段，改为 depth calibration 和与 `spec-product-lens-reviewer`、`spec-scope-guardian-reviewer` 的 ownership 分工。 | 需后续评估 CE origin-aware suppression 是否应回收进 orchestrator 或 persona。 |
| `spec-adversarial-reviewer` | `ce-adversarial-reviewer` | 内容基本一致；spec-first 去掉 CE 的 `Write` 工具，保持 code-review persona 报告型职责。 | 保留 spec-first 工具边界。 |
| `spec-agent-native-reviewer` | `ce-agent-native-reviewer` | 基本同源；spec-first 仅品牌、引用和轻微表述差异。 | 近等价。 |
| `spec-ankane-readme-writer` | `ce-ankane-readme-writer` | 基本同源，Ruby gem README 风格写作 agent。 | 近等价。 |
| `spec-api-contract-reviewer` | `ce-api-contract-reviewer` | 语义一致；spec-first 去掉 `Write`，保留 API contract reviewer 只出 finding。 | 保留 spec-first 工具边界。 |
| `spec-architecture-strategist` | `ce-architecture-strategist` | spec-first 增加 Role Ownership Boundary，明确它不替代 correctness/security/testing 等 persona。 | 保留 spec-first。 |
| `spec-best-practices-researcher` | `ce-best-practices-researcher` | 基本同源；spec-first 增强外部 API deprecation check、source/runtime 归属措辞和 spec-first 集成语义。 | 保留 spec-first。 |
| `spec-cli-agent-readiness-reviewer` | 无 | spec-first-only，完整 7 原则 CLI agent-readiness 审查，面向 CLI source/spec/plan。 | 不迁移；本仓独有治理能力。 |
| `spec-cli-readiness-reviewer` | 无 | spec-first-only，code-review 条件 persona，审查 CLI argument parsing/handler 的 agent readiness。 | 不迁移；补足本仓 CLI harness。 |
| `spec-code-simplicity-reviewer` | `ce-code-simplicity-reviewer` | spec-first 增加“what you don't flag”，避免把简化建议变成无边界风格意见。 | 保留 spec-first。 |
| `spec-coherence-reviewer` | `ce-coherence-reviewer` | 语义近似；spec-first 允许 Bash，命名为 spec-doc-review persona，并保留 safe_auto/confidence 校准。 | 近等价。 |
| `spec-correctness-reviewer` | `ce-correctness-reviewer` | 语义一致；spec-first 去掉 `Write`。 | 保留 spec-first 工具边界。 |
| `spec-data-integrity-guardian` | `ce-data-integrity-guardian` | 基本同源，用于数据模型、持久化和事务安全。 | 近等价。 |
| `spec-data-migration-expert` | 无 | spec-first-only，面向真实数据迁移/backfill/production transform 的深度验证 agent，含 SQL snippets、observability、rollback guardrails。 | 不迁移；比 reviewer persona 更专门。 |
| `spec-data-migrations-reviewer` | `ce-data-migration-reviewer` | CE 把 schema drift 和 migration safety 放在同一个 reviewer；spec-first 把 schema drift 交给 `spec-schema-drift-detector`，本 agent 只管迁移正确性、deploy window、rollback、verification。 | 保留职责拆分；CE schema drift 逻辑已由 spec-only agent 覆盖。 |
| `spec-deployment-verification-agent` | `ce-deployment-verification-agent` | 基本同源，生成 Go/No-Go checklist、SQL verification、rollback 和 monitoring plan。 | 近等价。 |
| `spec-design-implementation-reviewer` | `ce-design-implementation-reviewer` | spec-first 增加“what you don't flag”和更多边界说明，避免把视觉比对扩成产品设计重写。 | 保留 spec-first。 |
| `spec-design-iterator` | `ce-design-iterator` | 基本同源，迭代截图分析和 UI 改进；spec-first 仅品牌和轻微措辞差异。 | 近等价。 |
| `spec-design-lens-reviewer` | `ce-design-lens-reviewer` | CE 有 document type adaptation；spec-first 保留 design dimensional rating、AI slop check 和 confidence calibration，去掉 origin 适配。 | 可评估是否统一由 `spec-doc-review` 传入 origin-aware calibration。 |
| `spec-dhh-rails-reviewer` | 无 | spec-first-only，Rails 架构/抽象/前端模式的 DHH 视角条件 reviewer。 | 不迁移；本仓新增 persona。 |
| `spec-feasibility-reviewer` | `ce-feasibility-reviewer` | CE 有 document type adaptation 且 model inherit；spec-first 用 sonnet，内容更短，聚焦 approach 是否能落地。 | 可评估 CE adaptation 是否回收；保留 spec-first model/边界。 |
| `spec-figma-design-sync` | `ce-figma-design-sync` | 基本同源，检测并修复 Figma 与实现差异。 | 近等价。 |
| `spec-framework-docs-researcher` | `ce-framework-docs-researcher` | 基本同源，查官方文档、版本约束和 best practices。 | 近等价。 |
| `spec-git-history-analyzer` | `ce-git-history-analyzer` | 基本同源；spec-first 仅品牌和 source 术语差异。 | 近等价。 |
| `spec-issue-intelligence-analyst` | `ce-issue-intelligence-analyst` | 基本同源，基于 GitHub issues 做主题聚类和痛点分析。 | 近等价。 |
| `spec-julik-frontend-races-reviewer` | `ce-julik-frontend-races-reviewer` | 语义一致；spec-first 去掉 `Write`。 | 保留 spec-first 工具边界。 |
| `spec-kieran-python-reviewer` | 无 | spec-first-only，Python clarity、type hints、maintainability 条件 reviewer。 | 不迁移；本仓新增语言 persona。 |
| `spec-kieran-rails-reviewer` | 无 | spec-first-only，Rails clarity/conventions/maintainability 条件 reviewer。 | 不迁移。 |
| `spec-kieran-typescript-reviewer` | 无 | spec-first-only，TypeScript type safety、clarity、maintainability 条件 reviewer。 | 不迁移。 |
| `spec-learnings-researcher` | `ce-learnings-researcher` | spec-first 增加 Role Ownership Boundary、`CONCEPTS.md` 非真相源说明、`source_refs`、`invalidation_condition`、structured recall candidate vs legacy advisory，强调过去学习必须回源确认。 | 保留 spec-first；这是 knowledge harness 强化。 |
| `spec-maintainability-reviewer` | `ce-maintainability-reviewer` | 核心 rubric 同源；spec-first 改用 sonnet、去掉 `Write`，并强化 structural simplification 和 type boundary wording。 | 保留 spec-first。 |
| `spec-pattern-recognition-specialist` | `ce-pattern-recognition-specialist` | 基本同源，识别模式、反模式、命名和重复。 | 近等价。 |
| `spec-performance-oracle` | `ce-performance-oracle` | 基本同源，深度 performance analysis。 | 近等价。 |
| `spec-performance-reviewer` | `ce-performance-reviewer` | 语义一致；spec-first 去掉 `Write`。 | 保留 spec-first 工具边界。 |
| `spec-pr-comment-resolver` | `ce-pr-comment-resolver` | CE 可一次处理一个 thread 或一组相关 threads；spec-first 收窄为一次一个 review item，增加更显式的 validity 分类和 outdated-thread same-file search 边界。 | 保留 spec-first；单 item 粒度更符合 conflict-aware 合并。 |
| `spec-previous-comments-reviewer` | `ce-previous-comments-reviewer` | 语义一致；spec-first 去掉 `Write`。 | 保留 spec-first 工具边界。 |
| `spec-product-lens-reviewer` | `ce-product-lens-reviewer` | CE 有 origin-aware plan suppression，避免重审已通过 brainstorm 的 product premise；spec-first 去掉该段，新增 domain-agnostic 用户定义。 | 值得评估是否在 `spec-doc-review` 层恢复 CE 的 origin-aware 降噪。 |
| `spec-project-standards-reviewer` | `ce-project-standards-reviewer` | 语义近似；spec-first 仍审 CLAUDE/AGENTS standards，但去掉 `Write` 并绑定本仓工具选择政策。 | 保留 spec-first。 |
| `spec-reliability-reviewer` | `ce-reliability-reviewer` | 语义一致；spec-first 去掉 `Write`。 | 保留 spec-first 工具边界。 |
| `spec-repo-research-analyst` | `ce-repo-research-analyst` | spec-first 增加 Role Ownership Boundary，避免 research analyst 越权做 architecture/review 结论。 | 保留 spec-first。 |
| `spec-schema-drift-detector` | 无 | spec-first-only，专查 `schema.rb`/`structure.sql` 是否包含非 PR migration 造成的 unrelated drift。 | 不迁移；它解释了 data migration reviewer 的职责收窄。 |
| `spec-scope-guardian-reviewer` | `ce-scope-guardian-reviewer` | CE 有 document type/origin adaptation；spec-first 改为 Role Ownership Boundary，聚焦 scope-goal、复杂度、task boundary 和 right-sizing。 | 可评估 origin-aware 降噪是否应在 doc-review orchestrator 层恢复。 |
| `spec-security-lens-reviewer` | `ce-security-lens-reviewer` | CE 有 document type adaptation；spec-first 保持计划级 auth/authz/data exposure/API threat model 审查并绑定 spec persona 名称。 | 近似；origin-aware 降噪可统一评估。 |
| `spec-security-reviewer` | `ce-security-reviewer` | 语义一致；spec-first 去掉 `Write`。 | 保留 spec-first 工具边界。 |
| `spec-security-sentinel` | `ce-security-sentinel` | 基本同源，安全审计 checklist 和报告协议。 | 近等价。 |
| `spec-session-historian` | `ce-session-historian` | CE 硬编码 2026、支持 Claude/Codex/Cursor，且无 tools；spec-first 改为使用当前 host/session date、只声明 Claude/Codex、加 Read/Grep/Glob/Bash，并严禁读原始大 session 文件。 | 保留 spec-first；去硬编码年份是正确 source hygiene。 |
| `spec-slack-researcher` | `ce-slack-researcher` | spec-first tools 显式包含 `mcp__slack__*`，要求 workspace identity 可验证；CE tools 空但正文同源。 | 保留 spec-first；工具声明更真实。 |
| `spec-spec-flow-analyzer` | `ce-spec-flow-analyzer` | 基本同源，做 user flow/gap/question 分析。 | 近等价。 |
| `spec-swift-ios-reviewer` | `ce-swift-ios-reviewer` | 语义一致；spec-first 去掉 `Write`，描述更精确到 `.swift`、privacy manifests、semantic `.pbxproj` changes。 | 保留 spec-first 工具边界。 |
| `spec-testing-reviewer` | `ce-testing-reviewer` | spec-first 增加 Role Ownership Boundary，避免 testing reviewer 越权做 general correctness/architecture 审查；同时去掉 `Write`。 | 保留 spec-first。 |
| `spec-web-researcher` | `ce-web-researcher` | CE 硬编码当前年份并把 narrowing/deep extraction 合并；spec-first 动态使用 host date，明确 web-search/fetch 缺失时停止、不用 generic curl/wget，限定 query/fetch budget 和 integration points。 | 保留 spec-first；这是 external evidence hygiene 强化。 |

## 主题差异

### 1. 配置读取：CE 消除了 skill-load shell 读文件

CE 的变化点是正确的：不要在 `!` pre-resolution 中做 `cat "$(git rev-parse ...)/.compound-engineering/config.local.yaml"`，因为 `$()`、`;`、subshell、参数展开等在不同宿主的 safety checker 或 converter 里会失败。CE 改为只预解析 repo root：

```text
!`git rev-parse --show-toplevel 2>/dev/null || true`
```

然后在 skill body 中判断该行是否为绝对路径；若没有被宿主解析，则运行 shell 获取 root，再用原生 Read/read_file 读配置。

当前 `spec-first` 没有把 CE 的 `output:md/html` 或 product-pulse/work-beta config 模型迁过来，因此这批 hunk 多数没有当前落点。若以后需要配置读取，应采用同一原则，但路径和 contract 必须是 `spec-first` 自己的：

- 配置路径应是 `.spec-first/config.local.yaml`，不是 `.compound-engineering/config.local.yaml`。
- 脚本只提供确定性路径事实；LLM/skill body 决定如何降级。
- 不应引入 exclusive HTML output 作为 canonical artifact，除非 `spec-plan`、`spec-brainstorm`、`spec-work`、`spec-write-tasks`、`spec-doc-review` 都有 consumer tests。

### 2. Compound validator fallback：当前项目可吸收

CE `5e6eccab` 的改动价值明确：validator 是 skill bundle 内的脚本，非 Claude 平台可能拿不到 `${CLAUDE_SKILL_DIR}`；如果此时只写“run script”，agent 可能静默跳过 parser-safety protection。CE 改为：

- 有 `${CLAUDE_SKILL_DIR}` 且脚本存在时运行脚本。
- 否则输出 validator unavailable，并按脚本等价 scope 手工检查 frontmatter delimiter、top-level scalar 的未引用 ` #` 和 `: `。
- 手工 fallback 只覆盖 validator 的精确范围，避免扩大规则导致过度编辑。

当前 `skills/spec-compound/SKILL.md` 与 `skills/spec-compound-refresh/references/per-action-flows.md` 仍是“从 skill dir 运行脚本”的写法。这个差异值得后续以 `spec-first` 术语和测试吸收。

**【更新 2026-06-19：本段已过时】** 该 fallback 已落地：`spec-compound/SKILL.md` step 8 与 `spec-compound-refresh/references/per-action-flows.md` Replace step 3 均含 `validator unavailable: <reason>` + 限定范围手工 checklist，并由 `tests/unit/spec-compound-contracts.test.js` 锁住不可静默跳过。详见事实修正 #2。

### 3. Proof：CE 改成单向发布，spec-first 仍保留双向 HITL

CE `68dd787f` 是本批最大语义变化：它删除 `ce-proof/references/hitl-review.md`，把 brainstorm/ideate/plan 的 Proof 入口全部改为“Publish to Proof -- shareable link”，local file stays canonical，Proof 不再作为同步回本地的 review loop。

当前 `spec-first` 仍保留相反 contract：

- `skills/proof/SKILL.md` 声明 HITL review：上传本地 markdown、用户在 Proof 注释、agent ingest feedback、应用 agreed edits、sync final doc back to disk。
- `skills/proof/references/hitl-review.md` 定义 `localSynced` return shape、end-sync confirmation 和 atomic local write。
- `spec-brainstorm` / `spec-plan` / `spec-ideate` 的 handoff 依赖 `localSynced` 分支来重新评估后续 workflow 入口或提示 stale local。

因此 CE 的 Proof 变化不能逐文件同步。它是一个产品/contract 选择：

- 接受 CE 方向会减少 API mutation 风险和本地覆盖风险，但也失去“Proof review 后本地 artifact 作为 canonical source 被更新”的 evidence loop。
- 若要迁移，必须同时改 `skills/proof/**`、`spec-brainstorm`/`spec-ideate`/`spec-plan` handoff、`proof-contracts`、相关 workflow tests 和文档。

### 4. Worktree：CE 去脚本化，spec-first 仍把脚本当 internal helper contract

CE `3437de30` 把 `ce-worktree` 从“bundled script 创建 worktree”改成 policy prompt：

1. 先检测当前是否已经在 linked worktree；是则原地工作。
2. 有 harness-native worktree primitive 时优先使用。
3. 没有 native tool 时才 fallback plain git。
4. 如果 fallback 创建失败，必须阻塞询问用户，不可静默在当前 checkout 继续。

当前 `spec-first` 的 `skills/git-worktree` 是 internal-only helper，明确依赖 `worktree-manager.sh`，并在脚本中实现了 opt-in env copy、dev tool trust、path/symlink safety、audit log 等保护。CE 的方向有现实价值，尤其是“不要从已隔离 worktree 再建一个 invisible nested worktree”。但直接删除脚本会移除当前已经测试和治理的确定性能力。

可行的后续不是整段同步，而是单独做 worktree helper migration plan：

- 先决定 internal helper 是否仍要提供 script-owned deterministic setup。
- 如果要吸收 CE 的 Step 0，先给 current script/prose 补“已有隔离检测”与 submodule 区分测试。
- 如果要转 native-first，必须同时更新 `skills/git-worktree/SKILL.md`、script tests、allowed-tools/governance registry、`spec-work`/`spec-code-review` handoff 文案。

### 5. Release metadata：全部 CE-only

`package.json` 和三个 plugin manifests 只是 CE `3.13.1` 发布元数据。当前 `spec-first` 是独立 npm package，当前版本 `1.11.4`，并通过 CLI 生成 Claude/Codex runtime assets。CE 的 package/plugin manifest 值不能同步到当前项目。

## 建议

1. 不同步 release metadata、plugin manifests、CE README/AGENTS 整段。
2. 不直接同步 Proof one-way publish；若要评估，应单独开 Proof contract/product decision，明确是否放弃 local sync-backed HITL evidence loop。
3. 不直接删除 `skills/git-worktree/scripts/worktree-manager.sh`；先规划 native-first 或 existing-isolation detection 的合同迁移。
4. ~~可优先吸收~~ **【更新：已落地，见事实修正 #2】** `compound`/`compound-refresh` validator fallback，作为小范围 prompt/contract 改进，配套 `spec-compound`/`spec-compound-refresh` contract tests。
5. 若未来引入 `.spec-first/config.local.yaml` 读取，采用 CE 的 root-only pre-resolution + native file-read 模式，但不要迁入 `.compound-engineering` 路径或 exclusive HTML output 语义。
6. 可单独评估 CE document-review persona 的 origin-aware 降噪机制，尤其是 adversarial/product/scope/feasibility/design/security lens 在 plan 带 upstream origin 时是否应由 `spec-doc-review` orchestrator 统一校准，避免重审已定 WHAT。

## 验证状态

已验证：

- CE repo 路径存在，HEAD/tag 可读。
- 用户清单可映射到多个 CE commit 主题。
- 当前项目对应源文件均通过 bounded direct reads 核对。
- 全量覆盖检查确认报告包含当前 36 个 `skills/*/SKILL.md`、51 个 `agents/*.agent.md` 和 9 个 CE-only skill。对比基准为 CE 源码 `plugins/compound-engineering/skills`（39 个）与 `plugins/compound-engineering/agents`（43 个）；其中 `ce-data-migration-reviewer` 对应 spec-first `spec-data-migrations-reviewer`（单复数改名），故「CE 没有 CE-only agent」成立，spec-only agent 约 9 个。
- `git diff --check -- docs/validation/2026-06-19-ce-recent-diff-comparison.md CHANGELOG.md` 通过；未跟踪的新报告另用 `git diff --no-index --check /dev/null docs/validation/2026-06-19-ce-recent-diff-comparison.md` 检查，输出为空。
- 本报告未改 generated runtime mirrors。

未执行：

- 未运行 unit/smoke/integration tests，因为本次只新增 analysis 文档和 changelog。
- 未做 fresh-source eval，因为没有修改 skill/agent prose 行为。
