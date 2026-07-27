# 当前分支与远程 master 的 Skill 能力审计报告

## 1. 审计结论摘要

本报告按 [`docs/10-prompt/当前分支与远程master-Skill能力审计提示词.md`](../10-prompt/当前分支与远程master-Skill能力审计提示词.md) 执行，审计模式为 `report-only`。本轮只允许读取远程基线、创建临时 detached worktree、检查 source/test/consumer，并写入本报告与对应 Changelog；未授权修改 Skill、CLI、测试或 generated runtime。

结论：**当前分支不能被证明为“所有 Skill 能力整体不低于 master”，因此不能宣称本轮重构已经实现 Skill 能力净提升。**

重构确实显著加强了核心 workflow harness：21 个 Skill 身份可确认 `Improved`，10 个为 `Added`，权限边界、report-only 默认、结构化 evidence/handoff、五宿主投射和 workflow consumer 均比 master 更清晰。但同时有 13 个 master-only Skill 只能判为 `Removed with capability loss`；其中 `spec-skill-audit`、`agent-native-architecture`、`frontend-design` 构成 P1 能力缺口。它们不是简单的旧名称残留：master 中存在专用方法论、reference library、deterministic script、eval/test 或公共触发面，而 current 仅保留局部 lens、历史文档或近邻 workflow，无法覆盖原有完整执行合同。

本轮没有 P0。P1 finding 为 3 个，P2 为 4 个，P3 为 2 个。所有 finding 均保持 `open`；本报告没有实施任何修复，也没有把“历史上有退役 commit”当作能力等价证据。

### 1.1 状态总表

| 状态 | 数量 | 判断 |
|---|---:|---|
| `Improved` | 21 | master 主体能力保留，且 current 有可回源的新边界、artifact、consumer 或验证提升 |
| `Equivalent` | 1 | 能力保留，但不足以证明净提升 |
| `Intentional simplification` | 3 | 收窄入口或下沉细节，未发现主体执行能力损失；保留可达性限制 |
| `Added` | 10 | current 新增；不以新增数量抵消已删除能力 |
| `Removed with migration` | 9 | 旧名称迁移到 current 新 owner，主体可追踪 |
| `Removed with capability loss` | 13 | 无完整 owner/入口/consumer/验证迁移，或仅部分迁移 |
| **合计** | **57** | 与 union Skill 身份分母一致 |

### 1.2 净提升判定

净提升条件 1“master 的有效能力均有可追踪去向”未满足；条件 2“没有未解决的 P0/P1 能力退化”也未满足。因而最终 Verdict 为：

> **REQUEST CHANGES / capability parity not established**

这不否定核心 workflow 的质量提升，只否定“全量 Skill 能力无损且整体净提升”这一更强声明。

## 2. 基线与证据边界

| 项目 | 冻结值 |
|---|---|
| 当前仓库 | `/Users/kuang/xiaobu/spec-first` |
| 审计开始时间 | `2026-07-27T01:52:16+08:00`（以临时审计目录创建时间为可回溯起点） |
| 当前分支 | `leo-2026-07-16-plan-update` |
| 当前 HEAD | `2c89c5a18eaf85998dbf80fd98bf2d27d7f263fc` |
| remote 信息 | 仅 `github` -> `https://github.com/sunrain520/spec-first.git` ；无 `origin` |
| 远程基线 | `github/master` |
| master SHA | `437bb9e4bfa4f6cf6c9c85e488d72e74c030f365` |
| merge base | `04ed28a5d2036aa5c263c11ed13e63581f14b42a` |
| master detached worktree | `/tmp/spec-first-skill-audit.KPkweO/master` |
| 审计模式 | `report-only`, `mutation_policy: report-only` |
| reviewer dispatch | 未授权；使用 `inline-fallback` |
| review coverage status | `degraded`；单模型 inline 审查不具备 merge-ready/全覆盖关闭资格 |
| 独立 reviewer / validator / cross-model | `not_run` |

仓库没有名为 `origin` 的 remote，唯一配置远程名为 `github`。首次执行 `git fetch origin master` 失败，随后使用 `git fetch github master` 成功，并冻结 `github/master` 的 SHA。本文中的“远程 master”均指上述固定 SHA，不代表审计期间继续漂移的远程引用。

冻结基线时的原始 `git status --short` 快照如下（中文路径在原始 shell 输出中会以八进制转义显示，下面按可读路径还原）：

- `CHANGELOG.md`（已修改）
- `docs/10-prompt/README.md`（已修改）
- `docs/10-prompt/当前分支与远程master-Skill能力审计提示词.md`（未跟踪）
- `docs/plans/2026-07-27-001-feat-opencode-host-support-plan.md`（未跟踪）

本报告文件是基线冻结后新增的审计产物，不在初始快照中，也不进入 current-vs-master Skill 差异分母。

`skills/**` 在基线冻结时没有未提交修改，因此 current Skill source 等于当前 HEAD 的 Skill tree；上述非 Skill working-tree overlay 不进入能力差异判断，也不会被本轮修改或归因。

### 2.1 证据等级

- `source-confirmed`：直接读取 current/master 的 `SKILL.md`、reference、script、schema、test 或 consumer source。
- `test-contract-confirmed`：当前测试 source 明确覆盖该合同；除非本报告记录实际执行，否则不等于本轮测试通过。
- `provider-untrusted`：CodeGraph/Graphify 只作为迁移候选导航，必须回源确认。
- `historical-advisory`：commit message、历史计划或旧审计只解释演化意图，不单独证明当前行为。
- `not_run`：fresh-source、真实宿主 loader、field outcome 与独立 reviewer 本轮均未执行。

## 3. Skill 清单与迁移分母

| 分类 | 数量 | 说明 |
|---|---:|---|
| current source Skill | 35 | 当前 `skills/*/SKILL.md` |
| master source Skill | 38 | 冻结 master worktree 的 `skills/*/SKILL.md` |
| 同名 Skill | 16 | 需要直接进行行为/合同对比 |
| current-only | 19 | 包含 rename 后的新名和真正新增 Skill |
| master-only | 22 | 包含 rename 前的旧名、能力迁移和可能的能力丢失 |
| union Skill 身份 | 57 | 本报告必须逐一给出结论的覆盖分母 |

### 3.1 同名 Skill

`spec-app-consistency-audit`、`spec-brainstorm`、`spec-code-review`、`spec-compound`、`spec-compound-refresh`、`spec-debug`、`spec-doc-review`、`spec-ideate`、`spec-optimize`、`spec-plan`、`spec-prd`、`spec-rule-miner`、`spec-work`、`spec-write-skill`、`spec-write-tasks`、`using-spec-first`。

### 3.2 已由 git rename 或直接 source 对照确认的候选迁移

| master Skill | current Skill | 初步关系 |
|---|---|---|
| `git-commit` | `spec-commit` | rename + authority 收紧 |
| `git-commit-push-pr` | `spec-commit-push-pr` | rename + landing authority 收紧 |
| `git-worktree` | `spec-worktree` | rename + caller ownership 收紧 |
| `proof` | `spec-proof` | namespace rename，主体近似保留 |
| `resolve-pr-feedback` | `spec-resolve-pr-feedback` | rename + workflow/dispatch 合同扩展 |
| `test-browser` | `spec-test-browser` | 重写后的内部 browser verification owner |
| `test-xcode` | `spec-test-xcode` | namespace rename，主体近似保留 |
| `spec-polish-beta` | `spec-polish` | beta 转正并扩展边界 |
| `spec-mcp-setup` | `spec-runtime-setup` | public entrypoint rename + runtime readiness 扩展 |

### 3.3 master-only Skill

`agent-native-architecture`、`changelog`、`feature-video`、`frontend-design`、`gemini-imagegen`、`git-clean-gone-branches`、`report-bug`、`spec-dhh-rails-style`、`spec-release-notes`、`spec-sessions`、`spec-skill-audit`、`spec-slack-research`、`spec-team-standards-governance`。

### 3.4 current-only Skill

`spec-dogfood`、`spec-explain`、`spec-lfg`、`spec-pov`、`spec-product-pulse`、`spec-promote`、`spec-riffrec-feedback-analysis`、`spec-simplify-code`、`spec-strategy`、`spec-sweep`，以及 3.2 中的 9 个 rename/migration 目标。

## 4. 逐 Skill 审计

以下使用稳定 capability ID。每个 master Skill 默认分为三个能力簇：`-01` 为入口/适用场景/核心流程，`-02` 为方法论/边界/fallback，`-03` 为 artifact/consumer/验证。表中写 `01-03` 表示三个能力簇均已审计，而不是用文件存在替代语义映射。表内 `.../master/` 是冻结路径 `/tmp/spec-first-skill-audit.KPkweO/master/` 的缩写。

### 4.1 两边同名的 16 个 Skill

| Skill | Master capability IDs | master evidence | current evidence | 方法论、consumer 与验证判断 | 状态 / 置信度 |
|---|---|---|---|---|---|
| `spec-app-consistency-audit` | `MASTER-CAP-SACA-01..03` | `/tmp/spec-first-skill-audit.KPkweO/master/skills/spec-app-consistency-audit/SKILL.md:11`, `:121`, `:204` | `skills/spec-app-consistency-audit/SKILL.md:11`, `:121`, `:148`, `:210` | 16-step 静态审计、evidence gate、preview-only writeback 均保留；current 增五宿主 runtime denylist、显式 dispatch authorization/inline limitation，并诚实撤销无当前 consumer 的 `code_review_handoff` 活跃声明。eval governance reference 从 `references/` 移到 `evals/`，未形成 runtime 依赖。 | `Improved` / 高 |
| `spec-brainstorm` | `MASTER-CAP-SBR-01..03` | `.../master/skills/spec-brainstorm/SKILL.md:9`, `:13`, `:78` | `skills/spec-brainstorm/SKILL.md:17`, `:25`, `:50`, `:73`, `:285` | master 的 WHAT 探索保留；current 将输出升级为 `artifact_readiness: requirements-only` 的统一计划，增加 one-question、blindspot、claim verifier、`spec-pov` 路由和显式 dispatch fallback。`spec-plan`/`spec-lfg` 有真实 consumer；focused tests 覆盖其自动 handoff。 | `Improved` / 高 |
| `spec-code-review` | `MASTER-CAP-SCR-01..03` | `.../master/skills/spec-code-review/SKILL.md:11`, `:1059` | `skills/spec-code-review/SKILL.md:11`, `:73`, `:91`, `:146`, `:956` | current 把 review、local mutation、commit、landing 拆成独立 authority，默认 report-only；引入 persona catalog、structured findings、validator、cross-model contract、task-pack intake 和 structured verification。删除旧 walkthrough/bulk-preview 不删除 report-only review 主体，而是减少审查器自带 mutation 编排。 | `Improved` / 高 |
| `spec-compound` | `MASTER-CAP-SC-01..03` | `.../master/skills/spec-compound/SKILL.md:10`, `:16` | `skills/spec-compound/SKILL.md:11`, `:17`, `:118`, `:317`, `:393` | capture/knowledge promotion 主体保留；current 增自动 memory/session scan、grounding validation、vocabulary capture、repo-profile cache、session-history scripts 与更多 research lens。写入仍以 durable evidence 和 invalidation condition 为边界。 | `Improved` / 高 |
| `spec-compound-refresh` | `MASTER-CAP-SCRF-01..03` | `.../master/skills/spec-compound-refresh/SKILL.md:10`, `:127` | `skills/spec-compound-refresh/SKILL.md:11`, `:28`, `:100`, `:185`, `:516` | keep/update/consolidate/replace/delete 方法保留；current 增 mutation/landing authority、claim validator、document-set conflict/supersession 和 vocabulary capture。 | `Improved` / 高 |
| `spec-debug` | `MASTER-CAP-SDBG-01..03` | `.../master/skills/spec-debug/SKILL.md:13`, `:61`, `:110` | `skills/spec-debug/SKILL.md:11`, `:30`, `:47`, `:187`, `:310` | causal-chain、hypothesis、failed-fix invalidation 和 regression test 保留；current 增 anti-rationalization、dispatch authority、fix-only review scope、verification-run-summary/honest-closeout。删除独立 perf reference/HITL shell template 未删除 perf regression 触发或人工协作 fallback。 | `Improved` / 高 |
| `spec-doc-review` | `MASTER-CAP-SDR-01..03` | `.../master/skills/spec-doc-review/SKILL.md:11`, `.../references/synthesis-and-presentation.md:19` | `skills/spec-doc-review/SKILL.md:11`, `:58`, `:85`, `:100`, `:167`; `skills/spec-doc-review/references/synthesis-and-presentation.md:130` | 角色化审查、confidence anchors、contradiction/premise/multi-round synthesis 仍在 lazy references；current 增 report-only 默认、task-pack lens、conditional roster budget 和 JSON envelope。spine 变短属于 progressive disclosure，不是方法论删除。 | `Improved` / 高 |
| `spec-ideate` | `MASTER-CAP-SI-01..03` | `.../master/skills/spec-ideate/SKILL.md:19`, `:77`, `:93` | `skills/spec-ideate/SKILL.md:20`, `:48`, `:54`, `:77`, `:429` | grounded divergent ideation 保留；current 增 issue/Slack/web/learnings lens、topic-surface decomposition、HTML/Markdown rendering、repo cache 和 dispatch limitation。 | `Improved` / 高 |
| `spec-optimize` | `MASTER-CAP-SO-01..03` | `.../master/skills/spec-optimize/SKILL.md:11`, `:91`, `:123` | `skills/spec-optimize/SKILL.md:11`, `:87`, `:111`, `:136`, `:190` | metric/hard gate/experiment log/worktree/checkpoint 主体保留；current 增 evidence utilization、backend/dispatch boundary、repo grounding 和更明确的 persistence discipline。 | `Improved` / 高 |
| `spec-plan` | `MASTER-CAP-SP-01..03` | `.../master/skills/spec-plan/SKILL.md:20`, `:28`, `:95`, `:122` | `skills/spec-plan/SKILL.md:17`, `:25`, `:31`, `:55`, `:90`, `:675` | master HOW plan 主体完整保留；current 增 mandatory completion contract、requirements-only enrichment、consumer replay、high-risk/interface/frontend/agent-native lens、structured handoff 与多宿主 projection tests。 | `Improved` / 高 |
| `spec-prd` | `MASTER-CAP-SPRD-01..03` | `.../master/skills/spec-prd/SKILL.md:8`, `:22`, `:79`, `:191` | `skills/spec-prd/SKILL.md:8`, `:24`, `:81`, `:195`, `:219` | brownfield PRD 边界保留；current 增模板/overlay、四个合法 stop point、contract reset eval、lite product analysis 和更严格 artifact finalization。 | `Improved` / 高 |
| `spec-rule-miner` | `MASTER-CAP-SRM-01..03` | `.../master/skills/spec-rule-miner/SKILL.md:8`, `:36`, `:46` | `skills/spec-rule-miner/SKILL.md:8`, `:36`, `:46` | 大项目采样、evidence-backed rule 输出、source/runtime boundary 基本一致；current 仅把已删除 team-standards owner 改为明确退役边界。 | `Equivalent` / 高 |
| `spec-work` | `MASTER-CAP-SW-01..03` | `.../master/skills/spec-work/SKILL.md:15`, `:77`, `:136`, `:140` | `skills/spec-work/SKILL.md:15`, `:23`, `:50`, `:120`, `:238` | plan/task-pack execution、target repo、vertical slice、review/verification 主体保留；current 增 reference trigger map、requirements-only fail-closed、working-tree fingerprint、return-to-caller envelope、non-code carve-out 和分离的 mutation/commit/landing authority。 | `Improved` / 高 |
| `spec-write-skill` | `MASTER-CAP-SWS-01..03` | `.../master/skills/spec-write-skill/SKILL.md:10`, `:14`, `:45`, `:57` | `skills/spec-write-skill/SKILL.md:15`, `:25`, `:39`, `:46`; `skills/spec-write-skill/references/evaluation-design.md:3` | source-first authoring 主体保留；current 通用化为 portable/project profiles，新增 validate-only、Design Record、pre-patch eval plan、preview/write-set binding、五轴 readiness 和 lifecycle/optimization handoff。它能做 bounded validation，但不能替代已删除的全仓专用 Skill 审计器。 | `Improved` / 高 |
| `spec-write-tasks` | `MASTER-CAP-SWT-01..03` | `.../master/skills/spec-write-tasks/SKILL.md:16`, `:56`, `:104`, `:118` | `skills/spec-write-tasks/SKILL.md:16`, `:36`, `:56`, `:102`, `:119` | task pack derived/non-authoritative 主体保留；current 增 artifact-root-relative identity、`source-plan-path+body-hash`、`--repo` 与 downstream `target_repo` 分离、portable envelope 和更严格 review continuation。 | `Improved` / 高 |
| `using-spec-first` | `MASTER-CAP-USF-01..03` | `.../master/skills/using-spec-first/SKILL.md:15`, `:52`, `:108`, `:184` | `skills/using-spec-first/SKILL.md:10`, `:18`, `:24`, `:38`; `skills/using-spec-first/references/public-route-map.md:19` | current 将 235 行 entry governor 压缩为 42 行 spine + 两个按需 reference，保留 Direct Lane、唯一 route、source/runtime、dispatch/handoff/knowledge exit boundary。已删除 Skill 的路由随能力一起消失，不在本 Skill 内伪造兼容入口。 | `Intentional simplification` / 中高 |

### 4.2 9 对 rename / migration（18 个 Skill 身份）

| master 身份 | current 身份 | Master capability IDs | 双身份结论 | 关键证据与方法论差异 | consumer/test evidence | 置信度 |
|---|---|---|---|---|---|---|
| `git-commit` | `spec-commit` | `MASTER-CAP-GC-01..03` | old=`Removed with migration`; new=`Intentional simplification` | master `SKILL.md:3`, `:47`; current `skills/spec-commit/SKILL.md:3`, `:4`, `:11`, `:54`。commit 构造主体保留；current 改为 `user-invocable:false`，要求 caller 已有显式 `commit_authorization`。失去“直接说 commit 即进入”的公共 reachability，但符合 internal helper 边界。 | `spec-lfg`/其他 shipping owner 调用；`spec-commit-contracts` 与 pipeline tests 覆盖。 | 高 |
| `git-commit-push-pr` | `spec-commit-push-pr` | `MASTER-CAP-GCP-01..03` | old=`Removed with migration`; new=`Intentional simplification` | master `SKILL.md:3`, `:99`; current `skills/spec-commit-push-pr/SKILL.md:3`, `:4`, `:12`, `:109`。commit/push/PR/description 主体保留，新增 commit 与 landing 双授权；直接用户入口收窄。 | `spec-lfg` consumer；`pipeline-mode-contracts`、plugin projection 覆盖。 | 高 |
| `git-worktree` | `spec-worktree` | `MASTER-CAP-GW-01..03` | old=`Removed with migration`; new=`Improved` | master `SKILL.md:3`, `:46`; current `skills/spec-worktree/SKILL.md:3`, `:51`, `:84`, `:143`。detect/create/`.env` 安全保留，新增 existing-ref/PR isolate、already-checked-out contract 和唯一 governed caller。 | `spec-dogfood` 为当前 caller；`spec-worktree-contracts` 通过。 | 高 |
| `proof` | `spec-proof` | `MASTER-CAP-PROOF-01..03` | old=`Removed with migration`; new=`Improved` | git rename 89%；current `skills/spec-proof/SKILL.md:3`, `:27`, `:267`, `:330`, `:382`。HITL/share/pull 主体保留，新增 Publish Mode、local Markdown canonical、HTML 不上传和 source-file 原文发布边界。 | `spec-explain`/`spec-pov` destination references；plugin modules 覆盖 projection。 | 高 |
| `resolve-pr-feedback` | `spec-resolve-pr-feedback` | `MASTER-CAP-RPF-01..03` | old=`Removed with migration`; new=`Improved` | master source 与 current `skills/spec-resolve-pr-feedback/SKILL.md:3`、`references/evaluation-rubric.md` 对照：评论拉取/线程回复/resolve scripts 保留；current 增 validity rubric、conflict-aware resolver dispatch 和 targeted/full mode。 | 4 scripts 保留；pagination/contract tests 与 plugin modules 覆盖。 | 高 |
| `test-browser` | `spec-test-browser` | `MASTER-CAP-TB-01..03` | old=`Removed with migration`; new=`Improved` | master `SKILL.md:7`, `:39`, `:190`; current `skills/spec-test-browser/SKILL.md:3`, `:4`、`references/pipeline-orchestration.md`。route/port/server/page/browser verification 主体保留并变成 internal pipeline owner，新增 run-context script 与 capability eval。 | `spec-lfg` consumer；`spec-test-browser-contracts` 通过。 | 中高 |
| `test-xcode` | `spec-test-xcode` | `MASTER-CAP-TX-01..03` | old=`Removed with migration`; new=`Improved` | git rename 95%；master `SKILL.md:12`, `:19`; current `skills/spec-test-xcode/SKILL.md:12`, `:19`。simulator build/install/launch/screens/summary 主体近乎一致；删除未经治理的 auto-spawn 表述，保留显式调用。 | source contract rename coverage；未运行真实 Xcode/Simulator。 | 高（source）/ 低（field） |
| `spec-polish-beta` | `spec-polish` | `MASTER-CAP-POL-01..03` | old=`Removed with migration`; new=`Improved` | master `SKILL.md:12`, `:51`; current `skills/spec-polish/SKILL.md:12`, `:38`, `:55`, `:127`。dev-server/browser iteration 主体保留，beta 转正；新增 branch/local-fix/commit/landing 四类 authority 和 skill-relative script path。 | 15 reference/script assets迁移；mutation-authority tests 覆盖相邻边界。 | 高 |
| `spec-mcp-setup` | `spec-runtime-setup` | `MASTER-CAP-MCP-01..03` | old=`Removed with migration`; new=`Improved` | master `SKILL.md:11`, `:34`, `:73`, `:104`; current `skills/spec-runtime-setup/SKILL.md:11`, `:30`, `:54`, `:131`, `:242`。MCP/helper readiness 主体迁移到 schema 驱动 Node owner，新增 CodeGraph/Graphify、五宿主 host pin、transaction/containment、workspace graph、query probe 和 readiness ledger。 | 49 scripts、registry/schema、广泛 focused tests；本轮未执行真实 setup mutation。 | 高（contract）/ 中（field） |

### 4.3 master-only 的 13 个 Skill

| master Skill | Master capability IDs | master evidence | current 映射 | 方法论/能力损失、consumer 影响 | 状态 / finding / 置信度 |
|---|---|---|---|---|---|
| `agent-native-architecture` | `MASTER-CAP-ANA-01..03` | `.../master/skills/agent-native-architecture/SKILL.md:3`, `:35`, `:46`, `:60`; 19 个 references | `spec-plan/references/agents/agent-native-planning-strategist.md:1`, `:36`; `spec-code-review/references/personas/agent-native-reviewer.md:105`, `:125` | action parity、shared workspace、approval、system prompt 已部分迁入 plan/review；但 MCP tool design、self-modification、runtime production guardrails、mobile patterns、audit playbook、product implications 等完整 reference library 无 current owner/route/test。历史 docs 仍引用它，不能当 active consumer。 | `Removed with capability loss` / `F-002` / 高 |
| `changelog` | `MASTER-CAP-CHG-01..03` | `.../master/skills/changelog/SKILL.md:3`, `:10`, `:32`, `:104` | `spec-promote` 只负责 shipped-feature promotion copy；repo `CHANGELOG.md` 规则只负责项目记录 | recent-main aggregation、PR prioritization、breaking/features/fixes/shoutouts、Discord optional posting 的成套方法不再提供。promotion draft 不是 release changelog 生成。 | `Removed with capability loss` / `F-006` / 高 |
| `feature-video` | `MASTER-CAP-FV-01..03` | `.../master/skills/feature-video/SKILL.md:3`, `:17`, `:55`, `:156`, `:160` | `spec-dogfood` 做 QA，`spec-polish` 做 UI iteration，`spec-proof` 发布 Markdown；无 demo capture/upload owner | master 区分 product evidence 与 test output，提供 browser/GIF/terminal/screenshot tier、secret scan、runtime fallback、public upload 和 approval。current 没有 PR demo reel 或 public evidence URL contract。 | `Removed with capability loss` / `F-004` / 高 |
| `frontend-design` | `MASTER-CAP-FD-01..03` | `.../master/skills/frontend-design/SKILL.md:3`, `:20`, `:80`, `:179`, `:223` | `spec-plan/references/frontend-engineering-lens.md:3`, `:28`, `:47`; `frontend-quality-reviewer.md:3`; `spec-polish/SKILL.md:127` | current 覆盖 component/state/a11y/responsive planning、diff review 和已实现页面 polish；没有 greenfield build owner、visual thesis、typography/color/composition/motion/copy 方法、context modules 和 screenshot-before-done 一体化流程。 | `Removed with capability loss` / `F-003` / 高 |
| `gemini-imagegen` | `MASTER-CAP-GI-01..03` | `.../master/skills/gemini-imagegen/SKILL.md:3`, `:10`, `:108`, `:125`, `:178` | repo source 无替代；宿主可能有外部 imagegen primitive，但未形成 spec-first route/contract | text-to-image、edit、multi-turn、multi-reference、format verification 和 bundled scripts 均不在 current 包内。外部宿主能力不能证明五宿主或 repo-owned parity。 | `Removed with capability loss` / `F-008` / 高 |
| `git-clean-gone-branches` | `MASTER-CAP-GCGB-01..03` | `.../master/skills/git-clean-gone-branches/SKILL.md:3`, `:10`, `:26`, `:44` | 无 current owner | 精确发现 gone tracking branch、确认后删除、关联 worktree 处理消失。属于通用 housekeeping，和核心 workflow 链弱相关，但确实是能力减少。 | `Removed with capability loss` / `F-008` / 高 |
| `report-bug` | `MASTER-CAP-RB-01..03` | `.../master/skills/report-bug/SKILL.md:3`, `:12`, `:40`, `:59`, `:102` | 无 current Skill；GitHub issue 只能手工处理 | 环境收集、版本/runtime metadata、隐私审查、issue body 和提交确认没有新 owner。对插件现场问题的可报告性下降。 | `Removed with capability loss` / `F-006` / 高 |
| `spec-dhh-rails-style` | `MASTER-CAP-DHH-01..03` | `.../master/skills/spec-dhh-rails-style/SKILL.md:3`, `:11`, `:73`, `:89`, `:126` | 无 current owner；generic project instructions/code review 只能覆盖项目已有约定 | DHH/37signals 的 Rails domain methodology、REST mapping、models/controllers/Hotwire/testing references 全部移除。属于 provider/domain-specific 可选能力，不建议默认塞回核心 workflow，但不能判 parity。 | `Removed with capability loss` / `F-008` / 高 |
| `spec-release-notes` | `MASTER-CAP-SRN-01..03` | `.../master/skills/spec-release-notes/SKILL.md:3`, `:12`, `:51`, `:79`, `:168` | README/CHANGELOG 可直接读取；无 release query workflow/helper | published release metadata、summary/query 双模式、confidence judgment、PR enrichment 和 fence-aware truncation 不再自动提供。 | `Removed with capability loss` / `F-006` / 高 |
| `spec-sessions` | `MASTER-CAP-SS-01..03` | `.../master/skills/spec-sessions/SKILL.md:3`, `:10`, `:70`, `:94`, `:235` | session extraction scripts/persona 部分迁入 `spec-compound`：`skills/spec-compound/scripts/session-history/`; `session-historian.md` | durable knowledge capture 可消费 session evidence，但用户“查询过去会话/尝试/最近做了什么”的 standalone route、time-window ranking、scratch synthesis 和 output contract 不再存在。 | `Removed with capability loss` / `F-005` / 高 |
| `spec-skill-audit` | `MASTER-CAP-SSA-01..03` | `.../master/skills/spec-skill-audit/SKILL.md:3`, `:17`, `:97`, `:138`; 39 support files | `spec-write-skill` 可做 package validate-only 和修复；普通 bounded source review 可人工审计 | trigger/boundary/progressive disclosure/eval/security/runtime drift/governance 的专用 rubric、fact collector、scoring、security scanner、report writer、fixtures、examples 与 dedicated tests 全删除。`spec-write-skill` 的 authoring readiness 不是全仓比较审计器。 | `Removed with capability loss` / `F-001` / 高 |
| `spec-slack-research` | `MASTER-CAP-SSR-01..03` | `.../master/skills/spec-slack-research/SKILL.md:3`, `:10`, `:67` | Slack researcher persona 迁入 `spec-brainstorm`、`spec-plan`、`spec-ideate`; `spec-sweep` 可消费 Slack feedback | workflow 内部 grounding 仍有 Slack lens，但 standalone“搜索并综合组织决策/约束/讨论弧线”的公共入口、digest output 和 research-value assessment 丢失。 | `Removed with capability loss` / `F-005` / 高 |
| `spec-team-standards-governance` | `MASTER-CAP-TSG-01..03` | `.../master/skills/spec-team-standards-governance/SKILL.md:3`, `:26`, `:53`, `:62`; 16 support files | current 显式退役 standards surface；`spec-rule-miner` 只提炼项目习惯，不拥有 authority/promotion lifecycle | query/audit/init/propose、authority tiers、promotion/deprecation/conflict/replay 和 downstream confirmed standards consumption 均删除。`CHANGELOG.md:549` 证明这是 deliberate retirement，但不证明有效能力等价。 | `Removed with capability loss` / `F-007` / 高 |

### 4.4 current-only 的 10 个新增 Skill

| current Skill | 新增能力 | source evidence | consumer / validation | 状态 / 置信度 |
|---|---|---|---|---|
| `spec-dogfood` | diff-scoped、可恢复的 browser user-flow QA；可在授权内修小问题并写 durable report | `skills/spec-dogfood/SKILL.md:3`, `:66`, `:95`, `:151`, `:239` | route map `:31`；`spec-worktree` caller、mutation-authority/plugin tests。本轮无真实 browser field run。 | `Added` / 高（contract） |
| `spec-explain` | 面向个人的视觉化 explainer、predict-then-reveal、练习与 destination handoff | `skills/spec-explain/SKILL.md:3`, `:30`, `:43`, `:75`, `:89` | route map `:36`；host projection、dispatch matrix tests。 | `Added` / 高 |
| `spec-lfg` | 只有显式授权才进入的 plan->work->simplify->independent review->commit/push/PR/CI 全管线 | `skills/spec-lfg/SKILL.md:3`, `:9`, `:45`, `:49`, `:200` | `spec-brainstorm` handoff、pipeline/working-tree fingerprint/five-host tests；本轮 focused tests 通过。 | `Added` / 高（contract） |
| `spec-pov` | 针对外部候选做 project-grounded Adopt/Hold/Reject 类 verdict，双证据 floor 和 reversibility tier | `skills/spec-pov/SKILL.md:3`, `:31`, `:46`, `:65`, `:98` | route map `:36`；dispatch matrix、destination consumer；无 field verdict eval。 | `Added` / 中高 |
| `spec-product-pulse` | 从配置 signals 生成 time-windowed single-page product pulse 并落盘 | `skills/spec-product-pulse/SKILL.md:3`, `:49`, `:82`, `:118`, `:159` | `spec-runtime-setup` config consumer；`spec-product-pulse-contracts` 本轮通过。 | `Added` / 高（contract） |
| `spec-promote` | 对已上线 feature 生成 channel-specific promotion drafts，Spiral 可选、永不自动发布 | `skills/spec-promote/SKILL.md:3`, `:12`, `:16`, `:51`, `:118` | route map `:43`；runtime config consumer；无专属 eval/field test。 | `Added` / 中高 |
| `spec-riffrec-feedback-analysis` | Riffrec/video/audio 的 quick bug 或 extensive requirements evidence extraction | `skills/spec-riffrec-feedback-analysis/SKILL.md:3`, `:10`, `:26`, `:37` | `spec-sweep` projection、analyzer safety/artifact contract tests本轮通过。 | `Added` / 高 |
| `spec-simplify-code` | 对近期 diff 运行 reuse/quality/efficiency 三 lens，在保持行为前提下修简并验证 | `skills/spec-simplify-code/SKILL.md:3`, `:19`, `:44`, `:52` | `spec-debug`、`spec-work`、`spec-lfg` consumers；dispatch/mutation tests覆盖边界。 | `Added` / 高（contract） |
| `spec-strategy` | 创建/更新 repo-root `STRATEGY.md`，为 ideate/brainstorm/plan 提供产品方向 grounding | `skills/spec-strategy/SKILL.md:3`, `:25`, `:32`, `:80` | route map `:37`；governance 注册和 projection 存在；无专属 semantic eval。 | `Added` / 中高 |
| `spec-sweep` | 多来源 feedback sweep、ack、媒体分析、fix merged verification 和 LFG-ready rolling plan | `skills/spec-sweep/SKILL.md:3`, `:38`, `:51`, `:76`, `:138` | route map `:40`；state/analyzer/dispatch/config consumer tests；本轮未运行真实 Slack/GitHub writes。 | `Added` / 高（contract）/低（field） |

### 4.5 详细能力账本与计数矩阵

4.1-4.4 是面向快速阅读的 Skill 级结论；本节是能力级 source of truth，用具体 capability 取代前文的通用 `01..03` 分组。路径简写：`M/` = `/private/tmp/spec-first-skill-audit.KPkweO/master/`，`C/` = 当前仓库根目录。每个 Skill 小节中的 `M/.../SKILL.md` 与 `C/.../SKILL.md` 分别展开为该小节标题指向的 master Skill 及 current owner 完整路径，行号保持不变。

14 个审计维度编码如下：`D1` 意图/场景，`D2` 触发/入口/参数，`D3` 输入/上下文，`D4` 执行流，`D5` 方法论/启发式，`D6` source/runtime，`D7` 出口 gate，`D8` negative boundary，`D9` fallback/failure/reason code，`D10` artifact/schema/evidence/claim ceiling，`D11` consumer/handoff/ownership，`D12` provider/trust，`D13` tests/fresh-source，`D14` 效率/维护/上下文成本。每个 Skill 的三至六个 capability 合计覆盖 `D1-D14`。

| master Skill | 能力数 | preserved | improved | moved | intentionally-retired | regressed | uncertain | Skill 结论 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `spec-app-consistency-audit` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-brainstorm` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-code-review` | 5 | 2 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-compound` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-compound-refresh` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-debug` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-doc-review` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-ideate` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-optimize` | 4 | 2 | 2 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-plan` | 5 | 2 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-prd` | 4 | 2 | 2 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-rule-miner` | 3 | 3 | 0 | 0 | 0 | 0 | 0 | `Equivalent` |
| `spec-work` | 5 | 2 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-write-skill` | 4 | 1 | 3 | 0 | 0 | 0 | 0 | `Improved` |
| `spec-write-tasks` | 4 | 2 | 2 | 0 | 0 | 0 | 0 | `Improved` |
| `using-spec-first` | 4 | 3 | 1 | 0 | 0 | 0 | 0 | `Intentional simplification` |
| `git-commit` | 4 | 0 | 0 | 3 | 1 | 0 | 0 | `Removed with migration` |
| `git-commit-push-pr` | 5 | 0 | 0 | 4 | 1 | 0 | 0 | `Removed with migration` |
| `git-worktree` | 4 | 0 | 2 | 2 | 0 | 0 | 0 | `Removed with migration` |
| `proof` | 4 | 0 | 2 | 2 | 0 | 0 | 0 | `Removed with migration` |
| `resolve-pr-feedback` | 4 | 0 | 2 | 2 | 0 | 0 | 0 | `Removed with migration` |
| `test-browser` | 4 | 0 | 2 | 2 | 0 | 0 | 0 | `Removed with migration` |
| `test-xcode` | 4 | 0 | 1 | 3 | 0 | 0 | 0 | `Removed with migration` |
| `spec-polish-beta` | 4 | 0 | 2 | 2 | 0 | 0 | 0 | `Removed with migration` |
| `spec-mcp-setup` | 5 | 0 | 3 | 2 | 0 | 0 | 0 | `Removed with migration` |
| `agent-native-architecture` | 5 | 0 | 0 | 2 | 0 | 3 | 0 | `Removed with capability loss` |
| `changelog` | 4 | 0 | 0 | 0 | 0 | 4 | 0 | `Removed with capability loss` |
| `feature-video` | 5 | 0 | 0 | 1 | 0 | 4 | 0 | `Removed with capability loss` |
| `frontend-design` | 5 | 0 | 0 | 2 | 0 | 3 | 0 | `Removed with capability loss` |
| `gemini-imagegen` | 4 | 0 | 0 | 0 | 0 | 4 | 0 | `Removed with capability loss` |
| `git-clean-gone-branches` | 3 | 0 | 0 | 0 | 0 | 3 | 0 | `Removed with capability loss` |
| `report-bug` | 4 | 0 | 0 | 0 | 0 | 4 | 0 | `Removed with capability loss` |
| `spec-dhh-rails-style` | 4 | 0 | 0 | 0 | 0 | 4 | 0 | `Removed with capability loss` |
| `spec-release-notes` | 4 | 0 | 0 | 0 | 0 | 4 | 0 | `Removed with capability loss` |
| `spec-sessions` | 5 | 0 | 0 | 2 | 0 | 3 | 0 | `Removed with capability loss` |
| `spec-skill-audit` | 6 | 0 | 0 | 1 | 0 | 5 | 0 | `Removed with capability loss` |
| `spec-slack-research` | 4 | 0 | 0 | 2 | 0 | 2 | 0 | `Removed with capability loss` |
| `spec-team-standards-governance` | 5 | 0 | 0 | 0 | 1 | 4 | 0 | `Removed with capability loss` |
| **合计** | **162** | **26** | **54** | **32** | **3** | **47** | **0** | 38 个 master Skill 全覆盖 |

#### 4.5.1 同名 Skill 的具体能力账本

##### `spec-app-consistency-audit`

维度覆盖：`M-SACA-01(D1-D4)`，`02(D5,D8,D12,D14)`，`03(D6,D7,D9)`，`04(D10,D11,D13)`。验证基线：master `references=6/scripts=22/evals=2/test-files=21`，current `references=5/scripts=22/evals=4/test-files=8`；本轮未运行其专属 suite。

- `M-SACA-01` [`preserved`]：master 以 mobile PRD/Figma/source 交叉一致性为独立审计场景，含明确输入、输出和主流程（`M/skills/spec-app-consistency-audit/SKILL.md:11-41`）；current 保留同一合同（`C/skills/spec-app-consistency-audit/SKILL.md:11-41`）。影响：入口与主要 consumer 无损。验证：双向 source + 同块资产统计。置信度：高。
- `M-SACA-02` [`improved`]：master 的 16-step 审计、expert prompt 和 evidence policy（`M/.../SKILL.md:139-212`）在 current 保留，并加入显式 dispatch authorization 和 inline 覆盖上限（`C/.../SKILL.md:136-196`）。影响：不再把未授权的多 reviewer 表述成已执行。验证：source-confirmed。置信度：高。
- `M-SACA-03` [`improved`]：master 的 source/runtime、privacy、writeback 边界（`M/.../SKILL.md:121-133,220-231,285-291`）在 current 扩展到五宿主 generated-runtime denylist 和更明确的 preview-only 边界（`C/.../SKILL.md:121-133,226-238,288-294`）。影响：降低误修 runtime mirror 与敏感 Figma 材料泄露风险。验证：source-confirmed。置信度：高。
- `M-SACA-04` [`improved`]：master 定义 run artifact、issue protocol 和 handoff（`M/.../SKILL.md:101-115,191-218,279-283`）；current 保留产物且撤销无 active consumer 的过度声明（`C/.../SKILL.md:101-115,197-224,282-286`）。影响：claim ceiling 更诚实。验证：source + current eval 资产数增加，field outcome `not_run`。置信度：高。

##### `spec-brainstorm`

维度覆盖：`M-SBR-01(D1-D4)`，`02(D5,D8,D14)`，`03(D7,D9,D12,D13)`，`04(D6,D10,D11)`。验证基线：master `r13/s0/e1/test-files=20`，current `r13/s1/e0/test-files=16`；本轮 `using-spec-first`/`spec-lfg` 相关 focused suites 通过，不等于 brainstorm field outcome。

- `M-SBR-01` [`preserved`]：master 对未解 WHAT、用户、成功标准和范围进行需求探索（`M/skills/spec-brainstorm/SKILL.md:9-38,78-81`）；current 保留同一入口并继续与 PRD/plan 分界（`C/skills/spec-brainstorm/SKILL.md:17-31,73-90`）。影响：主场景无损。验证：source-confirmed。置信度：高。
- `M-SBR-02` [`improved`]：master 的 divergent/convergent 方法与 near-neighbor route（`M/.../SKILL.md:39-72`）在 current 扩展为 one-question discipline、blindspot 压力测试、claim verification 和 `spec-pov` 路由（`C/.../SKILL.md:25-45,207-293`）。影响：减少未验证假设直接进入规划。验证：source-confirmed。置信度：高。
- `M-SBR-03` [`improved`]：master 只有基础 scenario/evidence boundary（`M/.../SKILL.md:59-68`）；current 增加 dispatch authorization 、model tier 和无 helper 时的 degraded 路径（`C/.../SKILL.md:50-71`）。影响：宿主能力不足时仍能产出有上限的单模型结果。验证：`using-spec-first-contracts` 本轮通过；fresh-source `not_run`。置信度：高。
- `M-SBR-04` [`improved`]：master 产出 feature description 并交给 planning（`M/.../SKILL.md:72-81`）；current 将产物升级为 `artifact_readiness: requirements-only` 的统一计划并定义 `spec-plan`/`spec-lfg` handoff（`C/.../SKILL.md:306-350`）。影响：下游能区分需求已定与 HOW 未定。验证：`spec-lfg-contracts` 本轮通过。置信度：高。

##### `spec-code-review`

维度覆盖：`M-SCR-01(D1-D4)`，`02(D5,D8,D14)`，`03(D7,D9,D12)`，`04(D10,D11)`，`05(D6,D13)`。验证基线：master `r9/s1/e1/test-files=34`，current `r27/s2/e8/test-files=18`；本轮 authority/projection 相关 suites 通过，独立 reviewer/validator `not_run`。

- `M-SCR-01` [`preserved`]：master 对 diff/branch/PR 做意图、正确性、测试和标准审查（`M/skills/spec-code-review/SKILL.md:11-45,301-465`）；current 保留 base/PR/branch/current-tree 解析和全 diff 阅读（`C/skills/spec-code-review/SKILL.md:11-19,188-440`）。影响：审查主体无损。验证：source-confirmed。置信度：高。
- `M-SCR-02` [`preserved`]：master 的 persona selection、confidence anchor、dedup 与 severity/routing（`M/.../SKILL.md:222-301,523-873`）在 current 保留且拆到 lazy references（`C/.../SKILL.md:112-187,521-753`）。影响：方法论未因 spine 缩短而丢失。验证：current `references=27`，fresh-source `not_run`。置信度：高。
- `M-SCR-03` [`improved`]：master 同时存在 interactive/autofix/headless 并可在审查后编排 mutation（`M/.../SKILL.md:175-217,1077-1184`）；current 将 review、local mutation、commit、landing 分为独立授权面，默认 report-only（`C/.../SKILL.md:73-111`）。影响：降低无授权修复和落地风险。验证：`mutation-authority-contracts` 与 `dispatch-authorization-matrix-contracts` 本轮通过。置信度：高。
- `M-SCR-04` [`improved`]：master 有 run artifact 与 headless JSON（`M/.../SKILL.md:184-216,951-1057`）；current 增加 task-pack intake、structured findings/actionable queue、verification-run-summary 和 honest-closeout（`C/.../SKILL.md:233-378,821-954`）。影响：下游 caller 可以区分语义 finding 和实际命令证据。验证：相关 authority suites 通过；task mode field `not_run`。置信度：高。
- `M-SCR-05` [`improved`]：master 的 validator 只在 externalizing modes 运行（`M/.../SKILL.md:873-914`）；current 为 surviving findings 定义更严格的独立 validator、cross-model 和 remote-ref 证据边界（`C/.../SKILL.md:700-820`）。影响：降低错 tree 验证和单模型假阳性。验证：source-confirmed；本轮因未授权 dispatch 未实跑。置信度：高（contract）/中（outcome）。

##### `spec-compound`

维度覆盖：`M-SC-01(D1-D4)`，`02(D5,D8,D14)`，`03(D7,D9,D12)`，`04(D6,D10,D11,D13)`。验证基线：master `r4/s1/e1/test-files=21`，current `r13/s11/e0/test-files=13`；本轮未运行 compound 专属 suite。

- `M-SC-01` [`preserved`]：master 只对已解决、可回源的问题进行 durable knowledge capture（`M/skills/spec-compound/SKILL.md:10-50,483-497`）；current 保留同一 promotion 前提（`C/skills/spec-compound/SKILL.md:11-35,600-635`）。影响：未解决假设不会被包装成知识。验证：source-confirmed。置信度：高。
- `M-SC-02` [`improved`]：master 的 context/solution/related-doc 三路研究（`M/.../SKILL.md:106-242`）在 current 扩展为 memory scan、session history、grounding validation 和更多专业 lens（`C/.../SKILL.md:88-360`）。影响：新知识更容易回源到真实代码与历史尝试。验证：source + scripts 由 1 增至 11，field replay `not_run`。置信度：高。
- `M-SC-03` [`improved`]：master 的 structured promotion gate 和 runtime exclusion（`M/.../SKILL.md:84-104`）在 current 加入 dispatch authorization、invalidations 和更严格的 claim grounding（`C/.../SKILL.md:40-86,360-516`）。影响：外部/provider 线索不能静默升级为 confirmed knowledge。验证：source-confirmed。置信度：高。
- `M-SC-04` [`improved`]：master 产出 `docs/solutions/` 文档和 discoverability 链（`M/.../SKILL.md:266-401,497-535`）；current 新增 domain vocabulary capture、selective refresh handoff 和 headless/interactive 输出合同（`C/.../SKILL.md:397-516,637-743`）。影响：方法与项目语言都可被后续 plan/work/review 消费。验证：source-confirmed；fresh-source `not_run`。置信度：高。

##### `spec-compound-refresh`

维度覆盖：`M-SCRF-01(D1-D4)`，`02(D5,D8,D14)`，`03(D7,D9,D12)`，`04(D6,D10,D11,D13)`。验证基线：master `r4/s1/e1/test-files=9`，current `r4/s2/e0/test-files=6`；本轮未运行专属 suite。

- `M-SCRF-01` [`preserved`]：master 对 stale/overlapping/drifted `docs/solutions/` 执行 keep/update/consolidate/replace/delete（`M/skills/spec-compound-refresh/SKILL.md:10-44,179-260`）；current 保留该路由和调查流（`C/skills/spec-compound-refresh/SKILL.md:11-18,185-271`）。影响：知识维护主体无损。验证：source-confirmed。置信度：高。
- `M-SCRF-02` [`improved`]：master 的 drift classification 和 retrieval-value 判断（`M/.../SKILL.md:236-327`）在 current 增加 document-set conflict、canonical/supersession 分析和 vocabulary 同步（`C/.../SKILL.md:225-350`）。影响：降低对单文档打补丁而忽略全集冲突的风险。验证：source-confirmed。置信度：高。
- `M-SCRF-03` [`improved`]：master 的 autofix/interactive 模式（`M/.../SKILL.md:67-85,450-632`）在 current 改为更明确的 mutation/landing authority 和 headless 合同（`C/.../SKILL.md:19-57,433-584`）。影响：审核、修改和落地不再被单一 mode 暗示授权。验证：authority contract source。置信度：高。
- `M-SCRF-04` [`improved`]：master 产出 refresh report 和 promotion artifacts（`M/.../SKILL.md:567-646`）；current 加入 claim validator、freshness/invalidation 和更紧的 downstream handoff（`C/.../SKILL.md:553-700`）。影响：文档“已刷新”声明更受证据上限约束。验证：source-confirmed，本轮未实跑 refresh。置信度：高。

##### `spec-debug`

维度覆盖：`M-SDBG-01(D1-D4)`，`02(D5,D8,D14)`，`03(D7,D9,D12)`，`04(D6,D10,D11,D13)`。验证基线：master `r4/s1/e1/test-files=16`，current `r5/s1/e1/test-files=9`；本轮未运行 debug 专属 suite。

- `M-SDBG-01` [`preserved`]：master 以可复现 failure、hypothesis 和 causal chain 为主线（`M/skills/spec-debug/SKILL.md:13-43,110-182`）；current 保留 reproduce -> investigate -> fix -> verify -> handoff（`C/skills/spec-debug/SKILL.md:11-29,47-310`）。影响：根因诊断主体无损。验证：source-confirmed。置信度：高。
- `M-SDBG-02` [`improved`]：master 要求失败假设失效和 regression test（`M/.../SKILL.md:61-110`）；current 增加 anti-rationalization red flags、minimality/architecture-fit 和 fix-only review scope（`C/.../SKILL.md:30-46,187-271`）。影响：减少“无法复现但直接修”和顺手重构。验证：source-confirmed。置信度：高。
- `M-SDBG-03` [`improved`]：master 有 recall/runtime/direct-evidence 边界（`M/.../SKILL.md:92-109`）；current 增加 dispatch authority、provider unavailable fallback 和更明确的 claim ceiling（`C/.../SKILL.md:47-87,272-342`）。影响：调试线索不会被冒充为 root cause 事实。验证：source-confirmed。置信度：高。
- `M-SDBG-04` [`improved`]：master 最终交付 fix、tests 和 handoff（`M/.../SKILL.md:344-365`）；current 增加 `verification-run-summary`/`honest-closeout` 与 post-fix quality（`C/.../SKILL.md:310-360`）。影响：“修好了”必须绑定实际命令证据。验证：source-confirmed；field reproduction `not_run`。置信度：高。

##### `spec-doc-review`

维度覆盖：`M-SDR-01(D1-D4)`，`02(D5,D8,D14)`，`03(D7,D9,D12)`，`04(D6,D10,D11,D13)`。验证基线：master `r8/s0/e1/test-files=18`，current `r25/s0/e2/test-files=11`；本轮未运行 doc-review 专属 suite。

- `M-SDR-01` [`preserved`]：master 对 requirements/plan/task docs 进行角色化独立批评（`M/skills/spec-doc-review/SKILL.md:11-45,74-83`）；current 保留文档类型识别和 report-only 输出（`C/skills/spec-doc-review/SKILL.md:11-27`）。影响：不与 PRD 编写或 code review 混淆。验证：source-confirmed。置信度：高。
- `M-SDR-02` [`improved`]：master 的 contradiction、premise、confidence-anchor 和 synthesis 方法位于 references（`M/.../references/synthesis-and-presentation.md:19-130`）；current 保留并增加 task-pack lens 与更细的 conditional roster（`C/.../references/synthesis-and-presentation.md:1-180`）。影响：方法论可发现性与对不同产物的适配性提升。验证：current references 由 8 增至 25。置信度：高。
- `M-SDR-03` [`improved`]：master 有 runtime exclusion/direct evidence/dispatch gate（`M/.../SKILL.md:54-78,228-260`）；current 收紧为 report-only 默认、明确 dispatch authorization 和超额时 inline degraded 路径（`C/.../SKILL.md:28-100`）。影响：不会把 persona prompt 当成已执行 reviewer。验证：source-confirmed，independent review `not_run`。置信度：高。
- `M-SDR-04` [`improved`]：master 产出 findings/synthesis 文本；current 增加 JSON envelope、task-pack context 和更明确的 downstream actionable queue（`C/.../SKILL.md:100-200`）。影响：下游可编程消费且不丢失 claim limitations。验证：source + current eval 数增加；fresh-source `not_run`。置信度：高。

##### `spec-ideate`

维度覆盖：`M-SI-01(D1-D4)`，`02(D5,D8,D14)`，`03(D7,D9,D12,D13)`，`04(D6,D10,D11)`。验证基线：master `r3/s0/e0/test-files=7`，current `r13/s1/e0/test-files=8`；本轮未运行 ideate 专属 suite。

- `M-SI-01` [`preserved`]：master 对已选主题做 grounded divergent ideation（`M/skills/spec-ideate/SKILL.md:19-58,93-258`）；current 保留主题识别、mode classification 和发散会聚流（`C/skills/spec-ideate/SKILL.md:20-47,77-264`）。影响：“想方向”不会被错路由成 requirements 或 plan。验证：source-confirmed。置信度：高。
- `M-SI-02` [`improved`]：master 的 novelty/grounding/practicality 原则（`M/.../SKILL.md:77-92`）在 current 扩展为 topic-surface decomposition、blindspot 与更细的证据引用（`C/.../SKILL.md:48-76,264-430`）。影响：创意更容易与代码/用户信号连接。验证：source-confirmed。置信度：高。
- `M-SI-03` [`improved`]：master 只有基础 dispatch/evidence boundary（`M/.../SKILL.md:83-92`）；current 增加授权、model tier、repo cache 和 provider unavailable 降级（`C/.../SKILL.md:54-76,356-430`）。影响：Slack/web 线索不会被当成 confirmed project truth。验证：source-confirmed。置信度：高。
- `M-SI-04` [`improved`]：master 输出 idea set 和下一步；current 新增 Markdown/HTML 产物、destination handoff 和更明确的 limitations（`C/.../SKILL.md:430-520`）。影响：创意可持久保留并交给 brainstorm/POV。验证：source-confirmed；field consumer replay `not_run`。置信度：高。

##### `spec-optimize`

维度覆盖：`M-SO-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11,D13)`。验证基线：master `r7/s3/e1/test-files=8`，current `r11/s4/e2/test-files=7`；本轮未运行 optimize 专属 suite。

- `M-SO-01` [`preserved`]：master 定义可测目标、baseline、hypothesis batch、measurement 和 convergence（`M/skills/spec-optimize/SKILL.md:11-76,187-678`）；current 保留同一实验闭环（`C/skills/spec-optimize/SKILL.md:11-72,190-700`）。影响：优化不退化为无指标反复调参。验证：source-confirmed。置信度：高。
- `M-SO-02` [`preserved`]：master 的 admission/budget/clean-tree/user-approval gates 和 checkpoint discipline（`M/.../SKILL.md:91-106,133-187,330-421`）在 current 保留（`C/.../SKILL.md:87-102,127-190,327-421`）。影响：长 loop 保持可停止、可恢复。验证：source-confirmed。置信度：高。
- `M-SO-03` [`improved`]：master 有 runtime/evidence/dispatch boundary（`M/.../SKILL.md:107-123`）；current 更清楚区分 backend 能力、实验 worker 授权和 provider 信任（`C/.../SKILL.md:103-123`）。影响：计算资源与并行原语不再被当成无界自治。验证：source-confirmed。置信度：高。
- `M-SO-04` [`improved`]：master 保留 spec/log/checkpoints 和 wrap-up（`M/.../SKILL.md:168-187,678-738`）；current 增加 evidence utilization、更稳定的 resume 产物和更多 eval/script 支撑（`C/.../SKILL.md:107-126,171-190,700-753`）。影响：优化结论更可审计。验证：source + current scripts/evals 增加，outcome `not_run`。置信度：高。

##### `spec-plan`

维度覆盖：`M-SP-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D9,D12)`，`04(D7,D10)`，`05(D11,D13)`。验证基线：master `r13/s0/e3/test-files=52`，current `r30/s1/e8/test-files=27`；本轮 projection/route 相关 focused suites 通过，plan semantic eval `not_run`。

- `M-SP-01` [`preserved`]：master 对 clear WHAT 产出 HOW plan，包含 context gathering、questions、implementation units 和 handoff（`M/skills/spec-plan/SKILL.md:8-58,122-395`）；current 保留同一主干（`C/skills/spec-plan/SKILL.md:17-38,88-750`）。影响：计划 owner 与 brainstorm/work 仍清晰分离。验证：source-confirmed。置信度：高。
- `M-SP-02` [`preserved`]：master 的 plan-only safety、confidence-first、unknown separation 和可执行单元方法（`M/.../SKILL.md:20-27,95-121,181-266`）在 current 保留（`C/.../SKILL.md:55-87,430-620`）。影响：计划不会偷渡实施或把未知装成事实。验证：source-confirmed。置信度：高。
- `M-SP-03` [`improved`]：master 主要以直接 source/research 支撑计划；current 增加 reference trigger map、requirements-only enrichment、high-risk/interface/frontend/agent-native lens（`C/.../SKILL.md:90-550`）。影响：只在命中场景时加载深方法，提高 decision sufficiency/token。验证：current references 13 -> 30。置信度：高。
- `M-SP-04` [`improved`]：master 有文件写入和 final review（`M/.../SKILL.md:266-395`）；current 增加 mandatory completion contract、artifact readiness、claim ceiling 和更明确的不可伪造完成出口（`C/.../SKILL.md:675-780`）。影响：“计划文档已写”与“实施已完成”被严格区分。验证：source-confirmed。置信度：高。
- `M-SP-05` [`improved`]：master handoff 到 work/tasks（`M/.../SKILL.md:334-395`）；current 增加 consumer replay、structured handoff 和多宿主 projection 合同（`C/.../SKILL.md:675-820`）。影响：下游能使用 source refs/freshness/limitations 而非只读叙事。验证：`plugin-modules`/`host-runtime-projection-contracts` 本轮通过。置信度：高。

##### `spec-prd`

维度覆盖：`M-SPRD-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11,D13)`。验证基线：master `r9/s5/e1/test-files=19`，current `r9/s4/e11/test-files=25`；本轮未运行 PRD 专属 suite。

- `M-SPRD-01` [`preserved`]：master 对 brownfield PRD 的 create/refine/readiness validation 和四个法定 stop points（`M/skills/spec-prd/SKILL.md:8-61,167-191`）；current 保留（`C/skills/spec-prd/SKILL.md:8-63,195-219`）。影响：不会用 PRD 掩盖未解 0-1 产品问题。验证：source-confirmed。置信度：高。
- `M-SPRD-02` [`preserved`]：master 的 current-state -> delta -> domain language -> readiness 执行 compass（`M/.../SKILL.md:79-115,191-294`）在 current 保留（`C/.../SKILL.md:81-155,219-350`）。影响：方法论无损。验证：source-confirmed。置信度：高。
- `M-SPRD-03` [`improved`]：master 有 invocation/evidence/failure blacklist（`M/.../SKILL.md:61-79,177-190`）；current 增加 template/overlay、contract reset eval 和更明确的 source/runtime 边界（`C/.../SKILL.md:63-80,103-205`）。影响：旧 PRD 输入不会静默覆盖新 contract。验证：current evals 1 -> 11，本轮未实跑 semantic eval。置信度：高（source）。
- `M-SPRD-04` [`improved`]：master 产出 PRD-grade requirements 并 handoff 到 planning（`M/.../SKILL.md:278-294`）；current 增加更严格 artifact finalization、readiness/limitations 和 downstream consumer contract（`C/.../SKILL.md:316-370`）。影响：下游可判断是否能进入 HOW。验证：source + test source refs 增加。置信度：高。

##### `spec-rule-miner`

维度覆盖：`M-SRM-01(D1-D4)`，`02(D5-D9,D12,D14)`，`03(D10,D11,D13)`。验证基线：master/current 均 `r2/s0/e1`；master 有 2 个名称引用 test 文件，current 无专属名称引用 test；本轮未运行 eval。

- `M-SRM-01` [`preserved`]：两边都在用户要求挖掘 repo 现有编码习惯时采样真实代码（`M/skills/spec-rule-miner/SKILL.md:8-35`；`C/skills/spec-rule-miner/SKILL.md:8-35`）。影响：入口与输入无损。验证：双向 source 逐行一致。置信度：高。
- `M-SRM-02` [`preserved`]：两边都要求 evidence-backed rules，禁止通用 best practices、generated mirror 修改和编造标准（`M/.../SKILL.md:36-64`；`C/.../SKILL.md:36-64`）。影响：source/runtime 与 LLM judgment 边界无损。验证：source-confirmed。置信度：高。
- `M-SRM-03` [`preserved`]：两边的输出、failure modes 和 quality checks 等价（`M/.../SKILL.md:29-74`；`C/.../SKILL.md:29-74`）；current 仅明确 team-standards governance 已退役，不代替其 authority lifecycle。影响：本 Skill 自身等价，但不抵消 F-007。验证：source-confirmed。置信度：高。

##### `spec-work`

维度覆盖：`M-SW-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D13)`，`05(D11)`。验证基线：master `r2/s0/e1/test-files=65`，current `r10/s2/e1/test-files=40`；本轮 authority/projection 相关 suites 通过，未执行实施 field run。

- `M-SW-01` [`preserved`]：master 执行 settled plan/task/spec/concrete request，含 input triage 和 vertical-slice implementation（`M/skills/spec-work/SKILL.md:15-49,146-532`）；current 保留（`C/skills/spec-work/SKILL.md:15-45,46-226`）。影响：核心实施 owner 无损。验证：source-confirmed。置信度：高。
- `M-SW-02` [`preserved`]：master 的 minimality/architecture fit、test-as-you-go、ship-complete-feature 原则（`M/.../SKILL.md:83-107,536-580`）在 current 压缩保留（`C/.../SKILL.md:284-350`）。影响：spine 缩短未删除执行质量方法。验证：source-confirmed。置信度：高。
- `M-SW-03` [`improved`]：master 有 workspace/runtime/recall/direct evidence 边界（`M/.../SKILL.md:108-140`）；current 增加 target repo fail-closed、requirements-only refusal、reference trigger map 和 working-tree fingerprint（`C/.../SKILL.md:50-160`）。影响：跨 repo 和 stale task-pack 不会被默认执行。验证：authority/projection source + focused suites。置信度：高。
- `M-SW-04` [`improved`]：master 完成时运行 quality/review/tests（`M/.../SKILL.md:532-580`）；current 增加 structured verification、non-code carve-out 和完成 claim 的 evidence ceiling（`C/.../SKILL.md:226-283`）。影响：非代码任务不会伪造测试，代码任务也不会用 transcript 代替验证。验证：`mutation-authority-contracts` 本轮通过。置信度：高。
- `M-SW-05` [`improved`]：master handoff 到 review/commit（`M/.../SKILL.md:41-45,532-580`）；current 新增 return-to-caller envelope，并分离 mutation、commit、landing authority（`C/.../SKILL.md:238-283`）。影响：上游 LFG/人工 caller 可只消费实际完成部分。验证：`spec-lfg-contracts` 本轮通过。置信度：高。

##### `spec-write-skill`

维度覆盖：`M-SWS-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11,D13)`。验证基线：master `r3/s0/e1/test-files=2`，current `r8/s4/e4/test-files=16`；本轮未运行 write-skill 专属 suite。

- `M-SWS-01` [`preserved`]：master 为 source skill 的编写、改写、迁移和 findings 修复 owner，明确不用于只审计（`M/skills/spec-write-skill/SKILL.md:10-40`）；current 保留同一入口和 negative boundary（`C/skills/spec-write-skill/SKILL.md:3-31`）。影响：不会因本轮审计而获得修复授权。验证：source-confirmed。置信度：高。
- `M-SWS-02` [`improved`]：master 的 source-first、quality tiers 和 workflow（`M/.../SKILL.md:45-70`）在 current 扩展为 portable/project profiles、Design Record 和 pre-patch eval plan（`C/.../SKILL.md:15-52`；`C/.../references/evaluation-design.md:3-120`）。影响：先定义行为差异和证伪样例，再修 prompt/source。验证：current evals 1 -> 4。置信度：高。
- `M-SWS-03` [`improved`]：master 禁止手改 generated mirrors（`M/.../SKILL.md:45-52`）；current 增加 validate-only、preview/write-set binding、source/runtime drift 和五轴 readiness（`C/.../SKILL.md:33-61`）。影响：审计与 apply 权限分离，写集可预见。验证：current scripts=4/test-files=16。置信度：高。
- `M-SWS-04` [`improved`]：master 输出 source skill 及下游（`M/.../SKILL.md:25-40,71-78`）；current 增加 lifecycle/optimization handoff、artifact/claim closeout 与多宿主 consumer 校验（`C/.../SKILL.md:53-80`）。影响：能说清是 package-ready、semantic-ready 还是 field-unverified。验证：source-confirmed；fresh-source `not_run`。置信度：高。

##### `spec-write-tasks`

维度覆盖：`M-SWT-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11,D13)`。验证基线：master/current 均 `r3/s0/e9`；master/current 名称引用 test 文件数 20/8；本轮未运行专属 suite。

- `M-SWT-01` [`preserved`]：master 仅在显式要求或高复杂计划时把 settled plan 编译成 derived task pack（`M/skills/spec-write-tasks/SKILL.md:12-50`）；current 保留（`C/skills/spec-write-tasks/SKILL.md:12-50`）。影响：plan 仍是唯一真相源。验证：双向 source。置信度：高。
- `M-SWT-02` [`preserved`]：master 禁止 progress/approval 状态、远程通用 task list 和 scope invention（`M/.../SKILL.md:56-84,124-132`）；current 等价保留（`C/.../SKILL.md:56-85,125-133`）。影响：task pack 不变成第二状态机。验证：source-confirmed。置信度：高。
- `M-SWT-03` [`improved`]：master task pack 输出和 final decision envelope（`M/.../SKILL.md:85-117`）在 current 增加 artifact-root-relative identity、`source-plan-path+body-hash` 和更严的 stale detection（`C/.../SKILL.md:86-118`）。影响：下游 `spec-work` 可检测 plan/task drift。验证：source + eval 数保持 9。置信度：高。
- `M-SWT-04` [`improved`]：master 有 portability boundary（`M/.../SKILL.md:118-123`）；current 明确区分 `--repo` artifact root 与 downstream `target_repo`，并丰富 continuation envelope（`C/.../SKILL.md:119-138`）。影响：父工作区与子 repo 路径不再混用。验证：source-confirmed。置信度：高。

##### `using-spec-first`

维度覆盖：`M-USF-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11,D13)`。验证基线：master `r9/s0/e3/test-files=21`，current `r2/s0/e0/test-files=13`；`using-spec-first-contracts` 本轮通过。

- `M-USF-01` [`preserved`]：master 在 substantial work 前选择唯一 public workflow/command/direct lane（`M/skills/using-spec-first/SKILL.md:15-29,108-176`）；current 保留“恰好一个入口并交还 owner”（`C/skills/using-spec-first/SKILL.md:10-31`；`C/.../references/public-route-map.md:1-44`）。影响：入口治理无损。验证：focused suite passed。置信度：高。
- `M-USF-02` [`preserved`]：master 的 Direct Lane/scope guards/near-neighbor priority（`M/.../SKILL.md:50-76,120-176`）迁入 current 的 spine + public route map（`C/.../SKILL.md:18-31`；`C/.../references/public-route-map.md:3-48`）。影响：235 行压缩未丢失核心 route semantics。验证：focused suite passed。置信度：高。
- `M-USF-03` [`preserved`]：master 的 source/runtime、dispatch/host、artifact/evidence 边界（`M/.../SKILL.md:50-60,180-233`）迁入 current exit boundaries 和 conditional reference（`C/.../SKILL.md:32-42`；`C/.../references/conditional-routing-boundaries.md:1-220`）。影响：路由本身不授权 mutation/verification/handoff。验证：focused suite passed。置信度：高。
- `M-USF-04` [`improved`]：master 把 9 个 reference 的多个场景合同常驻在 entry governor 语境（`M/.../SKILL.md:30-49`）；current 收敛为 42 行 spine + 2 个按需 reference（`C/.../SKILL.md:1-42`）。影响：减少每次路由的上下文成本，且没有以更强自动化换取维护负担。验证：source + focused suite。置信度：中高（语义）/高（结构）。

#### 4.5.2 rename / migration Skill 的具体能力账本

##### `git-commit` -> `spec-commit`

维度覆盖：`M-GC-01(D1-D3)`，`02(D4,D5,D14)`，`03(D6-D13)`，`04(D2,D7,D8,D11)`。验证基线：master/current 名称引用 test 文件数 4/7；本轮 authority 相关 suites 通过。

- `M-GC-01` [`moved`]：master 收集 git status/diff/log 与 repo convention 作为 commit 上下文（`M/skills/git-commit/SKILL.md:10-46`）；current owner `spec-commit` 保留（`C/skills/spec-commit/SKILL.md:19-53`）。影响：commit message 仍从实际 diff 而非模板推测。验证：source + test refs。置信度：高。
- `M-GC-02` [`moved`]：master 依次判断 convention、logical commits、staging 和 commit（`M/.../SKILL.md:47-120`）；current 在 `spec-commit` 保留同一核心流（`C/.../SKILL.md:54-118`）。影响：构造可读 commit 的方法无损。验证：source-confirmed。置信度：高。
- `M-GC-03` [`moved`]：master 有 context fallback、dirty-tree 评估和最终确认（`M/.../SKILL.md:31-46,87-123`）；current 保留并加入更明确的安全出口（`C/.../SKILL.md:38-53,91-126`）。影响：不会把无关文件默认扫入 commit。验证：authority suite 间接确认。置信度：高。
- `M-GC-04` [`intentionally-retired`]：master frontmatter 允许用户直接说“commit”进入（`M/.../SKILL.md:1-4`）；current `user-invocable:false` 且只接受已持有 `commit_authorization` 的 caller（`C/.../SKILL.md:1-17`）。影响：丢失 convenience reachability，但将 commit 从 workflow 意图中分离是明确安全收窄，非隐性回归。验证：`mutation-authority-contracts` 本轮通过。置信度：高。

##### `git-commit-push-pr` -> `spec-commit-push-pr`

维度覆盖：`M-GCP-01(D1-D3)`，`02(D4,D5,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`，`05(D2,D7,D8)`。验证基线：master/current `r2`，test-files 3/6；`spec-lfg-contracts` 和 authority suites 本轮通过。

- `M-GCP-01` [`moved`]：master 在 full 与 description-update 两模式间分流（`M/skills/git-commit-push-pr/SKILL.md:12-20,61-97`）；current `spec-commit-push-pr` 保留（`C/skills/spec-commit-push-pr/SKILL.md:20-28,71-107`）。影响：只改 PR body 不会误执行 commit/push。验证：source-confirmed。置信度：高。
- `M-GCP-02` [`moved`]：master 收集 diff/history/convention、检查 existing PR 并构造 logical commit（`M/.../SKILL.md:20-159`）；current 保留（`C/.../SKILL.md:28-169`）。影响：shipping 上下文与 branch/PR 检测无损。验证：source + test refs。置信度：高。
- `M-GCP-03` [`moved`]：master 的 push、adaptive PR title/body、create/update 和 report（`M/.../SKILL.md:159-235`）迁到 current 同名流（`C/.../SKILL.md:169-250`）。影响：端到端 landing 机械能力无损。验证：`spec-lfg-contracts` 间接确认 consumer。置信度：高。
- `M-GCP-04` [`moved`]：master 引用 PR description 方法 references（`M/.../references/**`）；current 保留 2 个 references 并由 `spec-lfg` 消费。影响：价值优先、按复杂度伸缩的方法论可达。验证：source asset inventory + focused LFG suite。置信度：高。
- `M-GCP-05` [`intentionally-retired`]：master 可被“ship this”直接触发（`M/.../SKILL.md:1-4`）；current 改为 internal helper，要求 commit 和 landing 双授权（`C/.../SKILL.md:1-18`）。影响：减少无授权外发，但用户通用 git convenience 收窄，作为 F-009 residual 保留。验证：authority suites passed。置信度：高。

##### `git-worktree` -> `spec-worktree`

维度覆盖：`M-GW-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master/current scripts=1，test-files 9/3；`spec-worktree-contracts` 本轮通过。

- `M-GW-01` [`moved`]：master 检测已有 isolation，在需要时创建 worktree（`M/skills/git-worktree/SKILL.md:8-70`）；current owner `spec-worktree` 保留 detect/create（`C/skills/spec-worktree/SKILL.md:3-83`）。影响：隔离 checkout 主体能力无损。验证：focused suite passed。置信度：高。
- `M-GW-02` [`moved`]：master 的 `.env` opt-in、dev-tool trust 和 troubleshooting（`M/.../SKILL.md:70-118`）保留在 current（`C/.../SKILL.md:84-160`）。影响：敏感环境文件不会被默认拷贝。验证：source + script parity。置信度：高。
- `M-GW-03` [`improved`]：current 新增 existing-ref/PR isolation 和 already-checked-out 处理（`C/.../SKILL.md:46-143`）。影响：同一 ref 被其他 worktree 占用时能 fail closed 而非危险复用。验证：`spec-worktree-contracts` passed。置信度：高。
- `M-GW-04` [`improved`]：master 可由多个 public workflow 模糊委托（`M/.../SKILL.md:98-110`）；current 收窄为 governed caller ownership，当前明确 consumer 为 `spec-dogfood`（`C/.../SKILL.md:143-175`）。影响：工作树生命周期 owner 更清晰。验证：focused suite + route source。置信度：高。

##### `proof` -> `spec-proof`

维度覆盖：`M-PROOF-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master/current references=1，test-files 8/5；本轮 plugin projection suite 通过，Proof field outcome `not_run`。

- `M-PROOF-01` [`moved`]：master 的 share/read/edit/comment/suggest/HITL 入口（`M/skills/proof/SKILL.md:11-104,258-321`）迁到 `spec-proof`（`C/skills/spec-proof/SKILL.md:11-113,267-330`）。影响：协作 Markdown review loop 无损。验证：gig rename/source parity + projection suite。置信度：高。
- `M-PROOF-02` [`moved`]：master Web API/local bridge/baseToken/atomic pull 安全流（`M/.../SKILL.md:34-397`）保留在 current（`C/.../SKILL.md:43-411`）。影响：不会用 whole-doc rewrite 覆盖协作修订。验证：source-confirmed，API field `not_run`。置信度：高（source）。
- `M-PROOF-03` [`improved`]：current 新增 Publish Mode，区分单向发布与 HITL 循环（`C/.../SKILL.md:27-42`）。影响：只需给阅读链接时不会引入不必要协作状态。验证：source-confirmed。置信度：高。
- `M-PROOF-04` [`improved`]：current 将 local Markdown 定为 canonical，明确 HTML 不上传且优先从 source file 原文发布（`C/.../SKILL.md:330-381`）。影响：避免渲染派生物或 shell 字符串丢失原文。验证：source-confirmed。置信度：高。

##### `resolve-pr-feedback` -> `spec-resolve-pr-feedback`

维度覆盖：`M-RPF-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master/current scripts=4，references 2/4，test-files 3/5；本轮未运行其专属 suite。

- `M-RPF-01` [`moved`]：master 识别 PR feedback 范围、拉取 comments/threads 并区分 mode（`M/skills/resolve-pr-feedback/SKILL.md:8-39`）；current 保留（`C/skills/spec-resolve-pr-feedback/SKILL.md:8-73`）。影响：评审反馈 intake 无损。验证：source + script parity。置信度：高。
- `M-RPF-02` [`moved`]：master 4 个 scripts 负责 pagination、reply、resolve 等确定性事实（`M/.../SKILL.md:48-61`）；current 保留同组 scripts（`C/.../SKILL.md:82-96`）。影响：API 分页和 thread mutation 仍不依赖 LLM 猜测。验证：script inventory parity。置信度：高。
- `M-RPF-03` [`improved`]：current 新增 validity rubric，要求先判断 feedback 是否成立（`C/.../references/evaluation-rubric.md:1-160`）。影响：减少机械“评论即修复”。验证：current references 增至 4。置信度：高。
- `M-RPF-04` [`improved`]：master 只提供基础 mutating resolver boundary（`M/.../SKILL.md:40-47`）；current 增加 conflict-aware dispatch、targeted/full mode 和修复/提交/回复/resolve 的分离授权（`C/.../SKILL.md:54-81`）。影响：外部 PR 副作用更受控。验证：authority source，field API `not_run`。置信度：高。

##### `test-browser` -> `spec-test-browser`

维度覆盖：`M-TB-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master `test-files=2`，current `r1/s1/e1/test-files=6`；`spec-test-browser-contracts` 本轮通过，browser field `not_run`。

- `M-TB-01` [`moved`]：master 从 diff 推导 routes，分配 port，启动 server 并测受影响页面（`M/skills/test-browser/SKILL.md:39-224`）；current `spec-test-browser` 保留这条 pipeline（`C/skills/spec-test-browser/SKILL.md:8-81`；`C/.../references/pipeline-orchestration.md:1-220`）。影响：browser verification 主体无损。验证：focused contract suite passed。置信度：中高。
- `M-TB-02` [`moved`]：master 有 human verification、failure handling 和 PASS/FAIL/PARTIAL summary（`M/.../SKILL.md:225-306`）；current 保留并收口到 pipeline claim ceiling（`C/.../SKILL.md:82-120`）。影响：浏览器未可用时不会伪报 PASS。验证：focused suite passed。置信度：高（contract）。
- `M-TB-03` [`improved`]：current 改为 internal pipeline owner，增加 invocation/run-context script 和定界的受影响页面包（`C/.../SKILL.md:3-22`）。影响：它不再自行获得 branch/PR mutation 权限。验证：focused suite passed。置信度：高。
- `M-TB-04` [`improved`]：current 新增 capability eval 与 `spec-lfg` consumer，并把 browser 现场证据与 report 分离（`C/.../evals/**`；`C/skills/spec-lfg/SKILL.md:1-220`）。影响：更适合被全管线调用。验证：`spec-lfg-contracts` + `spec-test-browser-contracts` passed。置信度：高（contract）/低（field）。

##### `test-xcode` -> `spec-test-xcode`

维度覆盖：`M-TX-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master/current SKILL 主体近 95% rename，current test-files=3；本轮 Xcode/Simulator field `not_run`。

- `M-TX-01` [`moved`]：master 校验 XcodeBuildMCP、发现 project/scheme、boot simulator、build/install/launch（`M/skills/test-xcode/SKILL.md:12-75`）；current `spec-test-xcode` 同位保留（`C/skills/spec-test-xcode/SKILL.md:12-75`）。影响：iOS 基础执行链无损。验证：source parity。置信度：高（source）。
- `M-TX-02` [`moved`]：master 的 key-screen tests、human verification 和 failure handling（`M/.../SKILL.md:76-150`）在 current 同行保留（`C/.../SKILL.md:76-150`）。影响：人机协作边界无损。验证：source parity；field `not_run`。置信度：高（source）/低（field）。
- `M-TX-03` [`moved`]：master 的 build/screens/console/human/failures 结构化摘要与 cleanup（`M/.../SKILL.md:151-192`）在 current 保留（`C/.../SKILL.md:151-192`）。影响：输出 claim ceiling 无损。验证：source parity。置信度：高。
- `M-TX-04` [`improved`]：current 删除“审查器自动生成子 agent”的模糊表述，增加显式 Invocation Boundary（`C/.../SKILL.md:206-213`）。影响：宿主 dispatch 不再被当作默认授权。验证：source-confirmed，本轮未连接 XcodeBuildMCP。置信度：高。

##### `spec-polish-beta` -> `spec-polish`

维度覆盖：`M-POL-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master/current `r11/s4`，test-files 7/4；本轮 browser field `not_run`。

- `M-POL-01` [`moved`]：master 检查 branch、启动 dev server、打开 browser 并迭代（`M/skills/spec-polish-beta/SKILL.md:12-111`）；current `spec-polish` 保留（`C/skills/spec-polish/SKILL.md:12-127`）。影响：已实现页面的现场打磨主体无损。验证：asset parity。置信度：高。
- `M-POL-02` [`moved`]：master 的 launch.json/auto-detect/port/server fallback 在 11 references + 4 scripts 中保留（`M/.../SKILL.md:61-101`；`C/skills/spec-polish/references/**`）。影响：启动方法与 provider fallback 无损。验证：asset inventory parity，field `not_run`。置信度：高（source）。
- `M-POL-03` [`improved`]：current 从 beta 转为正式 owner，并把 script path 改为 skill-relative（`C/.../SKILL.md:38-126`）。影响：多宿主投射时不依赖特定 runtime 目录。验证：source-confirmed。置信度：高。
- `M-POL-04` [`improved`]：current 新增 branch/local-fix/commit/landing 四类 authority boundary（`C/.../SKILL.md:38-54`）。影响：UI 打磨不再暗含 commit 或 push 权限。验证：`mutation-authority-contracts` 本轮通过。置信度：高。

##### `spec-mcp-setup` -> `spec-runtime-setup`

维度覆盖：`M-MCP-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9)`，`04(D10,D11)`，`05(D12,D13)`。验证基线：master `r2/s44/e1/test-files=35`，current `r2/s49/e2/test-files=44`；本轮未执行会修改 host 的 setup，只引用 current contract/projection tests。

- `M-MCP-01` [`moved`]：master 以 required harness runtime 为 source of truth，提供 check/plan/repair/verify（`M/skills/spec-mcp-setup/SKILL.md:7-40,73-114`）；current `spec-runtime-setup` 保留（`C/skills/spec-runtime-setup/SKILL.md:7-36,139-253`）。影响：MCP/helper readiness 主体无损。验证：source-confirmed。置信度：高。
- `M-MCP-02` [`moved`]：master 的 host authority/write safety、source/runtime boundary 和 verification（`M/.../SKILL.md:65-73,164-205`）保留并更名到 current（`C/.../SKILL.md:120-139,304-350`）。影响：setup 不会修补 source skill 或手改未受管 mirror。验证：source-confirmed。置信度：高。
- `M-MCP-03` [`improved`]：current 将 shell-heavy 流程升级为 schema-driven Node owner，增加 transaction/containment、reason codes 和 readiness ledger（`C/.../SKILL.md:36-138,242-337`）。影响：确定性事实与 LLM 语义判断分工更清晰。验证：current scripts 44 -> 49，test-files 35 -> 44。置信度：高。
- `M-MCP-04` [`improved`]：current 新增 CodeGraph/Graphify、workspace graph、query probe、project config 和五宿主 pinning（`C/.../SKILL.md:36-138,253-304`）。影响：从单一 MCP 安装扩展为 workflow 必需能力就绪层。验证：`host-runtime-projection-contracts` 本轮通过，真实 provider setup `not_run`。置信度：高（contract）/中（field）。
- `M-MCP-05` [`improved`]：master 产出基础 status/output shape（`M/.../SKILL.md:114-164`）；current 产出包含 provenance、freshness、limitations、repair plan 的 machine-readable facts（`C/.../SKILL.md:253-337`）。影响：下游可区分 ready/degraded/missing 而不依赖句子。验证：source + current evals=2；field outcome `not_run`。置信度：高。

#### 4.5.3 master-only Skill 的具体能力账本

##### `agent-native-architecture`

维度覆盖：`M-ANA-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9)`，`04(D10-D12)`，`05(D13)`。验证基线：master `r18/e1/test-files=4`，current 无同等 owner；本轮未运行 fresh-source architecture replay。

- `M-ANA-01` [`moved`]：master 将 agent-native 定义为 agents-first、outcome-through-loop 的设计场景，明确 when-to-use/input/output/workflow（`M/skills/agent-native-architecture/SKILL.md:6-41`）；current 的 `spec-plan` agent-native strategist 保留 action parity、shared workspace、approval/system-prompt 计划 lens（`C/skills/spec-plan/references/agents/agent-native-planning-strategist.md:1-70`）。影响：计划时仍能识别基本 agent-native 需求。验证：source-confirmed。置信度：高。
- `M-ANA-02` [`moved`]：master 的部分 production/action-parity 反例迁入 `spec-code-review` persona（`M/.../SKILL.md:42-59`；`C/skills/spec-code-review/references/personas/agent-native-reviewer.md:105-150`）。影响：diff review 仍可发现人类有操作面而 agent 无对等 action 的问题。验证：source-confirmed，independent reviewer `not_run`。置信度：中高。
- `M-ANA-03` [`regressed`]：master reference routing 覆盖 MCP tool design、dynamic context、testing、mobile patterns 和 production guardrails（`M/.../SKILL.md:46-59`；`M/.../references/**`）；current 无完整 owner/route。影响：新建 agent/MCP 系统只得到压缩 lens，不得到完整设计顺序。验证：18 references 对 current inventory 无对应。置信度：高。
- `M-ANA-04` [`regressed`]：master 对 self-modifying/long-running agent 的权限、可恢复、观测与 product implication 方法不在 current plan/review 的可达 reference 中（`M/.../references/**`）。影响：高自治架构可能只检查功能，未系统检查可停止/回滚/审计。验证：current source search 无对应全链。置信度：高。
- `M-ANA-05` [`regressed`]：master 有专属 eval 和 4 个 test-file consumer；current 压缩 lens 无等价 capability replay。影响：无法证明拆分后的 plan/review 合起来覆盖 master 方法。验证：asset inventory；fresh-source `not_run`。置信度：高。

##### `changelog`

维度覆盖：`M-CHG-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master SKILL 145 行、名称引用 test-files=15；current 无 owner。

- `M-CHG-01` [`regressed`]：master 按 daily/weekly 窗口聚合 main 近期 merges 并分析 PR（`M/skills/changelog/SKILL.md:10-31`）；current 无同等查询/生成入口。影响：无法从仓库历史自动形成有时间窗口的改动摘要。验证：source inventory。置信度：高。
- `M-CHG-02` [`regressed`]：master 的 breaking/features/fixes/other/shoutouts 优先级和 audience-aware 方法（`M/.../SKILL.md:32-98,138-145`）无 current owner。影响：`spec-promote` 的 launch copy 不能替代版本变更分类。验证：双向 source 缺口。置信度：高。
- `M-CHG-03` [`regressed`]：master 可选 Discord posting，要求 webhook/error handling（`M/.../SKILL.md:104-131`）；current 无 draft/post 分离的对应机制。影响：可选外发能力消失；若未来恢复必须严格 opt-in。验证：source inventory。置信度：高。
- `M-CHG-04` [`regressed`]：master 的 format template/style review/error/schedule contract（`M/.../SKILL.md:41-145`）在 current 没有 artifact schema、consumer 或 eval。影响：无可重复运营交付闭环。验证：current inventory 无 owner。置信度：高。

##### `feature-video`

维度覆盖：`M-FV-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11)`，`05(D13)`。验证基线：master `r5/s1/test-files=5`，current 无 demo capture owner；browser/Proof field `not_run`。

- `M-FV-01` [`moved`]：master 的“先运行功能再收集可视证据”思想（`M/skills/feature-video/SKILL.md:35-77`）部分迁入 `spec-dogfood` 的 browser QA 和 screenshot evidence（`C/skills/spec-dogfood/SKILL.md:66-151`）。影响：可见行为仍可被验证，但不等于 demo reel。验证：source-confirmed，field `not_run`。置信度：中高。
- `M-FV-02` [`regressed`]：master 根据 browser UI/CLI/motion/static 变更选 GIF、terminal reel、screenshots 级别（`M/.../SKILL.md:66-100,121-157`）；current 无 tiered capture methodology。影响：PR 无法生成与变更类型匹配的 demo 产物。验证：current inventory 无 owner。置信度：高。
- `M-FV-03` [`regressed`]：master 在录制前强制 secret scan（`M/.../SKILL.md:17-28`）；current 的 screenshot/Proof 邻近能力无对应 demo-secret gate。影响：如果用手工拼装 demo，容易漏掉 token/PII 审查。验证：master source + current 缺口。置信度：高。
- `M-FV-04` [`regressed`]：master 有 tool preflight、run directory、fallback 与 failure handling（`M/.../SKILL.md:101-143`）；current 无共享 capture runtime 合同。影响：工具不可用时无受治理降级。验证：master `r5/s1`，current none。置信度：高。
- `M-FV-05` [`regressed`]：master 只在用户选择后上传，输出 public URL + Markdown + limitations（`M/.../SKILL.md:158-187`）；current `spec-proof` 发布 Markdown，不生成 demo media URL。影响：视觉产品证据与文档协作被混为邻近能力。验证：source-confirmed。置信度：高。

##### `frontend-design`

维度覆盖：`M-FD-01(D1-D4)`，`02(D5,D14)`，`03(D7-D9,D12)`，`04(D6,D10,D11)`，`05(D8,D13)`。验证基线：master SKILL 259 行/test-files=1，current 只有 plan/review/polish 分段 owner；greenfield replay `not_run`。

- `M-FD-01` [`moved`]：master 的 context detection、existing design system 优先和 mode classification（`M/skills/frontend-design/SKILL.md:10-60`）部分迁入 `spec-plan` frontend engineering lens（`C/skills/spec-plan/references/frontend-engineering-lens.md:3-55`）。影响：计划仍会区分 greenfield/existing UI 和项目约束。验证：source-confirmed。置信度：中高。
- `M-FD-02` [`moved`]：master 的 accessibility/responsive/state 质量底线（`M/.../SKILL.md:80-129,179-222`）部分迁入 frontend planning lens 和 `frontend-quality-reviewer`（`C/.../frontend-engineering-lens.md:28-80`；`C/skills/spec-code-review/references/personas/frontend-quality-reviewer.md:1-160`）。影响：工程质量计划/审查仍可达。验证：source-confirmed，reviewer `not_run`。置信度：中高。
- `M-FD-03` [`regressed`]：master 要求在实现前形成 visual thesis，同时设计 typography/color/composition/motion/copy（`M/.../SKILL.md:61-129`）；current 无统一 implementation owner。影响：greenfield UI 可在 plan 后直接进入 generic work，缺少一体化视觉方法。验证：current route/skill inventory。置信度：高。
- `M-FD-04` [`regressed`]：master 为 landing page、dashboard/app、existing component 定义三个 context modules（`M/.../SKILL.md:130-178`）；current 的 planning/review/polish 没有从类型到实现的连续 owner。影响：方法论拆分后失去完整顺序。验证：source comparison。置信度：高。
- `M-FD-05` [`regressed`]：master 明确要求 screenshot-before-done，并定义 tool cascade/scope checks（`M/.../SKILL.md:223-250`）；`spec-polish` 只接手已实现页面（`C/skills/spec-polish/SKILL.md:12-37,127-150`）。影响：greenfield build 与视觉现场证据之间存在 owner gap。验证：browser field `not_run`。置信度：高。

##### `gemini-imagegen`

维度覆盖：`M-GI-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master scripts=5/test-files=1，current repo-owned owner=none；外部宿主 image primitive 不计入 parity。

- `M-GI-01` [`regressed`]：master 提供 Gemini 文生图、尺寸/宽高比/分辨率配置（`M/skills/gemini-imagegen/SKILL.md:6-107`）；current 无 spec-first source owner。影响：五宿主不再有 repo-owned 统一生图合同。验证：inventory-confirmed。置信度：高。
- `M-GI-02` [`regressed`]：master 支持 image editing、multi-turn refinement 和 prompting heuristics（`M/.../SKILL.md:108-162`）；current 无对应方法论。影响：不能保证多轮图像编辑的输入/输出可追踪。验证：source inventory。置信度：高。
- `M-GI-03` [`regressed`]：master 支持 Google grounding 和最多 14 张 reference composition（`M/.../SKILL.md:162-195`）；current 无 provider/trust/fallback contract。影响：即使宿主有生图工具，也无法证明能力与信任边界等价。验证：external capability excluded by source boundary。置信度：高。
- `M-GI-04` [`regressed`]：master 有文件格式/media type 选择和验证（`M/.../SKILL.md:196-232`）及 5 个 scripts；current 无 deterministic format verification。影响：扩展名与实际编码不一致的错误无受治理检测。验证：asset inventory。置信度：高。

##### `git-clean-gone-branches`

维度覆盖：`M-GCGB-01(D1-D4)`，`02(D5-D9,D12,D14)`，`03(D10,D11,D13)`。验证基线：master scripts=1，current owner=none。

- `M-GCGB-01` [`regressed`]：master 确定性发现 upstream 已 gone 的本地 branch（`M/skills/git-clean-gone-branches/SKILL.md:10-25`）；current 无入口/脚本。影响：丢失可重复的 stale-branch inventory。验证：source inventory。置信度：高。
- `M-GCGB-02` [`regressed`]：master 在删除前列出 branch 并要求确认（`M/.../SKILL.md:26-43`）；current 无 preview/approval gate。影响：用户只能手工组合 git 命令，容易扩大删除范围。验证：source-confirmed。置信度：高。
- `M-GCGB-03` [`regressed`]：master 处理确认 branch 及关联 worktree 并输出结果（`M/.../SKILL.md:44-64`）；current `spec-worktree` 不拥有 housekeeping deletion consumer。影响：worktree 关联清理能力 orphan。验证：current owner/route inventory。置信度：高。

##### `report-bug`

维度覆盖：`M-RB-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master test-files=1，current owner=none；GitHub field `not_run`。

- `M-RB-01` [`regressed`]：master 引导采集 bug description、expected/actual、steps/errors（`M/skills/report-bug/SKILL.md:12-39,59-101`）；current 无专用 intake。影响：现场问题更容易丢失可复现信息。验证：source inventory。置信度：高。
- `M-RB-02` [`regressed`]：master 自动收集 plugin/version/runtime/OS 环境元数据（`M/.../SKILL.md:40-58`）；current doctor/runtime setup 无 bug-report artifact consumer。影响：诊断上下文需手工拼装。验证：cross-skill consumer source 无对应。置信度：高。
- `M-RB-03` [`regressed`]：master 在 issue creation 前展示 body 并只在确认后提交（`M/.../SKILL.md:102-132`）；current 无 draft-first GitHub issue flow。影响：外部通信授权与 preview 能力丢失。验证：source-confirmed，field `not_run`。置信度：高。
- `M-RB-04` [`regressed`]：master 有 output/error/privacy notice（`M/.../SKILL.md:133-160`）；current 无 redaction checklist 与 failure artifact。影响：敏感路径/token 可能被误上报。验证：source inventory。置信度：高。

##### `spec-dhh-rails-style`

维度覆盖：`M-DHH-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master references=6/test-files=1，current owner=none。

- `M-DHH-01` [`regressed`]：master 在 Rails 场景提供 DHH/37signals 价值取向与触发边界（`M/skills/spec-dhh-rails-style/SKILL.md:1-20`）；current 无 optional domain skill。影响：特定 Rails 产品风格不再是 package capability。验证：inventory-confirmed。置信度：高。
- `M-DHH-02` [`regressed`]：master 包含 REST resource mapping、rich models/thin controllers 和命名方法（`M/.../SKILL.md:11-88`）；current generic review 只检查 repo 现有规则。影响：方法论不再可按需加载。验证：6 references 无 current owner。置信度：高。
- `M-DHH-03` [`regressed`]：master 包含 Hotwire/UI、testing 与 fail-fast conventions（`M/.../SKILL.md:89-126`；`M/.../references/**`）；current 无统一 domain consumer。影响：Rails-specific 端到端建议被拆散为通用 lens。验证：source comparison。置信度：高。
- `M-DHH-04` [`regressed`]：master 的 references 是可发现的实施指南；current 无 route/test/eval 确认以 external plugin 替代。影响：可以被接受为产品边界收缩，但不能计为 parity。验证：current inventory none。置信度：高。

##### `spec-release-notes`

维度覆盖：`M-SRN-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master scripts=1/test-files=5，current owner=none；release API field `not_run`。

- `M-SRN-01` [`regressed`]：master 提供“最近发布摘要”与“某 Skill/版本发生了什么”双模式（`M/skills/spec-release-notes/SKILL.md:12-59`）；current 无 public query owner。影响：用户无法通过 skill 获得版本引用的发布解释。验证：source inventory。置信度：高。
- `M-SRN-02` [`regressed`]：master 获取 published release metadata，处理 pagination/rate/error 并以发布时间为准（`M/.../SKILL.md:79-147`）；current README/CHANGELOG 直读不等价。影响：丢失 remote release 真实性和 freshness 边界。验证：source comparison。置信度：高。
- `M-SRN-03` [`regressed`]：master query mode 做 confidence judgment，只对高信匹配做 PR enrichment（`M/.../SKILL.md:148-196`）；current 无对应 evidence heuristic。影响：手工回答更易把相似名称的发布项当作确定结论。验证：master source/current none。置信度：高。
- `M-SRN-04` [`regressed`]：master 定义 summary/query/no-match 输出、version citation 和 fence-aware truncation（`M/.../SKILL.md:119-220`）；current 无 artifact/schema/consumer。影响：发布回答无统一 claim ceiling。验证：master test-files=5，current none。置信度：高。

##### `spec-sessions`

维度覆盖：`M-SS-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11)`，`05(D13)`。验证基线：master scripts=4/test-files=5，current session-history scripts 迁入 compound，standalone route=none。

- `M-SS-01` [`moved`]：master 的 session discovery/metadata extraction 确定性 scripts（`M/skills/spec-sessions/SKILL.md:94-143`）迁入 `C/skills/spec-compound/scripts/session-history/**`。影响：knowledge capture 仍能获得过去会话线索。验证：script-level source comparison。置信度：高。
- `M-SS-02` [`moved`]：master 的 session synthesis persona 和 evidence limitations 迁入 compound 的 `session-historian` 及自动历史步骤（`M/.../SKILL.md:154-224`；`C/skills/spec-compound/SKILL.md:248-360`）。影响：作为 knowledge-enrichment consumer 的方法尚在。验证：source-confirmed。置信度：中高。
- `M-SS-03` [`regressed`]：master 可由用户直接询问“之前做了什么/尝试过什么”（`M/.../SKILL.md:10-49`）；current 无 standalone public route。影响：recall 只能作为 compound 的内部上下文，用户无法单独调用。验证：current route map inventory。置信度：高。
- `M-SS-04` [`regressed`]：master 定义 scan window、current-date boundary、rank/filter、scratch space 和 time budget（`M/.../SKILL.md:66-173,245-255`）；current 无 standalone output 中的窗口/排名合同。影响：“最近”与“相关”无可检查定义。验证：source comparison。置信度：高。
- `M-SS-05` [`regressed`]：master 输出回答、session refs、limitations 与 error handling（`M/.../SKILL.md:225-255`）；current 无 standalone artifact/test consumer。影响：内部历史增强不能被证明为公共能力等价。验证：master test-files=5，current route none。置信度：高。

##### `spec-skill-audit`

维度覆盖：`M-SSA-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9)`，`04(D10,D11)`，`05(D12)`，`06(D13)`。验证基线：master `r11/s20/e4/examples=4/test-files=14`，current 无专用 owner；本轮审计即为手工替代，不是能力存在证明。

- `M-SSA-01` [`moved`]：master 的“对单个 source skill 检查 package structure/readiness”部分能力（`M/skills/spec-skill-audit/SKILL.md:17-52`）可由 current `spec-write-skill validate-only` 部分承接（`C/skills/spec-write-skill/SKILL.md:15-61`）。影响：单 package 结构问题仍可发现。验证：current write-skill assets/tests 存在。置信度：中高。
- `M-SSA-02` [`regressed`]：master 专用 rubric 检查 trigger precision、scope/input-output/workflow/progressive disclosure（`M/.../SKILL.md:57-97`；`M/.../references/**`）；current 无全仓审计 profile。影响：无法以统一标准对所有 Skill 做可重复评分。验证：master r11/current no owner。置信度：高。
- `M-SSA-03` [`regressed`]：master 有 deterministic fact collector、report writer 和 scoring scripts（`M/.../SKILL.md:97-137`；`M/.../scripts/**`）；current 本轮依赖临时 shell/LLM 组合。影响：同一审计难以低成本重放并比较历史结果。验证：master scripts=20/current none。置信度：高。
- `M-SSA-04` [`regressed`]：master 包含 security scanner、runtime drift 和 spec-first dual-host governance 检查（`M/.../SKILL.md:131-159`；`M/.../scripts/**`）；current generic review/write-skill 无对应全仓合同。影响：能力可存在但入口不可触发或 runtime 漂移的问题更难被一次捕获。验证：source comparison。置信度：高。
- `M-SSA-05` [`regressed`]：master 有 advanced options、governance output、fixtures/examples 和 downstream findings handoff（`M/.../SKILL.md:131-168`）；current 无独立 artifact schema/consumer。影响：审计结果不能直接成为可机读修复输入。验证：master examples=4/current none。置信度：高。
- `M-SSA-06` [`regressed`]：master 4 evals + 14 test-files 支撑重放；current 没有对 master golden fixtures、security/runtime-drift cases 的等价 replay。影响：本轮无法用产品自身证明 Skill parity。验证：asset inventory，fresh-source `not_run`。置信度：高。

##### `spec-slack-research`

维度覆盖：`M-SSR-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6-D9,D12)`，`04(D10,D11,D13)`。验证基线：master test-files=4，current Slack personas 分散在 brainstorm/plan/ideate/sweep；Slack field `not_run`。

- `M-SSR-01` [`moved`]：master 的 Slack 搜索与组织上下文 grounding（`M/skills/spec-slack-research/SKILL.md:10-49`）部分迁入 `spec-brainstorm`/`spec-plan`/`spec-ideate` researcher personas。影响：这些 workflow 仍可将 Slack 作为 advisory 上下文。验证：current references/persona inventory。置信度：中高。
- `M-SSR-02` [`moved`]：master 的“不返回原始消息列表，而是综合 decision/constraint/discussion arc”方法（`M/.../SKILL.md:49-80`）在 current research personas 中部分保留，`spec-sweep` 也消费 Slack feedback。影响：workflow-internal synthesis 仍可达。验证：source-confirmed，field `not_run`。置信度：中高。
- `M-SSR-03` [`regressed`]：master 允许用户直接问“团队讨论过什么”并定义 standalone 输入/输出（`M/.../SKILL.md:10-40`）；current 无 public route。影响：组织研究只是上游 workflow 的内部 lens，不是用户可独立调用的能力。验证：current route map none。置信度：高。
- `M-SSR-04` [`regressed`]：master 输出 research digest、cross-cutting analysis、research-value assessment 和 limitations（`M/.../SKILL.md:20-40,67-81`）；current 无 standalone artifact/test contract。影响：研究质量和无结果/provider unavailable 降级无统一表达。验证：master test-files=4/current none。置信度：高。

##### `spec-team-standards-governance`

维度覆盖：`M-TSG-01(D1-D4)`，`02(D5,D8,D14)`，`03(D6,D7,D9,D12)`，`04(D10,D11)`，`05(D13)`。验证基线：master `r12/e4/test-files=3`，current 明确退役；退役 commit 是 intent evidence，不是 parity evidence。

- `M-TSG-01` [`intentionally-retired`]：master 的 query/audit/init/propose public modes（`M/skills/spec-team-standards-governance/SKILL.md:10-37`）在 current 被明确产品退役（`CHANGELOG.md:549`）。影响：这是有意的复杂度减少，但只说明删除不是意外，不说明下列能力已替代。验证：historical intent + current inventory。置信度：高。
- `M-TSG-02` [`regressed`]：master 定义 confirmed/advisory authority tiers，禁止把 candidate 当 hard context（`M/.../SKILL.md:17-25`；`M/.../references/**`）；current `spec-rule-miner` 只挖项目惯例，不拥有 promotion authority。影响：团队标准的权威层级能力消失。验证：source comparison。置信度：高。
- `M-TSG-03` [`regressed`]：master workflow 覆盖 evidence candidate、promotion/deprecation/conflict 和 health audit（`M/.../SKILL.md:38-61`；`M/.../references/**`）；current 无轻量等价 owner。影响：丢失标准生命周期和冲突解决。验证：master r12/current none。置信度：高。
- `M-TSG-04` [`regressed`]：master 输出 mode-specific reports/proposals，并定义 failure modes/non-goals（`M/.../SKILL.md:62-91`）；current 无 artifact schema/consumer/handoff。影响：下游不再能消费 confirmed standards 或退役记录。验证：current consumer inventory none。置信度：高。
- `M-TSG-05` [`regressed`]：master 4 evals + 3 test-files 检查 authority/promotion/replay；current 无证明 standards-native AGENTS.md/direct-evidence 替代机制的 replay。影响：无法证明退役后仍保留相同用户结果。验证：asset inventory，fresh-source `not_run`。置信度：高。

#### 4.5.4 current-only 新增 Skill 的能力账本

本小节不进入 162 项 master capability 分母，只用于检查新增能力是否有 consumer、边界和验证；新增数量不抵消 master regression。

##### `spec-dogfood`

- `C-DOG-01`：新增 diff-scoped browser user-flow QA，含受影响页面、server/browser 和 field evidence（`C/skills/spec-dogfood/SKILL.md:14-55,83-151`）。
- `C-DOG-02`：新增 resumable stop/return 与明确 mutation authority（`C/.../SKILL.md:66-117`），不把 QA 默认变为修复。
- `C-DOG-03`：产出 durable report，consumer 为 route map 和 `spec-worktree`。验证：`r2/test-files=5`，本轮未实跑 browser。结论：`Added`，高（contract）/低（field）。

##### `spec-explain`

- `C-EXP-01`：新增对 concept/diff/idea/recent-work 的个人化 explainer（`C/skills/spec-explain/SKILL.md:7-51`）。
- `C-EXP-02`：新增 predict-then-reveal check-in gate 与需要时的 exercises（`C/.../SKILL.md:75-88`），目标是学习而非代替审查。
- `C-EXP-03`：新增 destination handoff/Proof 选择与 dispatch boundary（`C/.../SKILL.md:30-42,89-107`）。验证：`r8/s1/test-files=7`，field learning outcome `not_run`。结论：`Added`，高。

##### `spec-lfg`

- `C-LFG-01`：新增只在用户明确要求 hands-off/green PR 时进入的端到端 pipeline（`C/skills/spec-lfg/SKILL.md:3-49`）。
- `C-LFG-02`：将 plan -> work -> simplify -> independent review -> commit/push/PR/CI 连成可暂停、可恢复链（`C/.../SKILL.md:45-200`），并分离每个副作用授权。
- `C-LFG-03`：新增 working-tree fingerprint、pipeline run artifact 和 internal-helper consumers。验证：`r2/s1/test-files=8`，`spec-lfg-contracts` 本轮通过，CI/PR field `not_run`。结论：`Added`，高（contract）。

##### `spec-pov`

- `C-POV-01`：新增对外部方案/观点做 project-grounded Adopt/Hold/Reject 判断（`C/skills/spec-pov/SKILL.md:7-46`）。
- `C-POV-02`：新增 project evidence floor + external evidence floor 两层证据底线和 reversibility tier（`C/.../SKILL.md:65-105`）。
- `C-POV-03`：新增 dispatch authorization/inline fallback 和 follow-up handoff（`C/.../SKILL.md:31-43,106-120`）。验证：`r10/s1/test-files=2`，field verdict eval `not_run`。结论：`Added`，中高。

##### `spec-product-pulse`

- `C-PP-01`：新增基于 configured signals 和 lookback window 的 product pulse（`C/skills/spec-product-pulse/SKILL.md:15-49`）。
- `C-PP-02`：新增 first-run interview/config-state route 与 routine run（`C/.../SKILL.md:51-159`），不在未配置时伪造信号。
- `C-PP-03`：产出单页 durable report，consumer 为 runtime setup config/routine hook。验证：`r2/test-files=3`，`spec-product-pulse-contracts` 本轮通过。结论：`Added`，高（contract）。

##### `spec-promote`

- `C-PROM-01`：新增对已上线 feature 的 promotion draft owner（`C/skills/spec-promote/SKILL.md:8-42`），不用于发布笔记或未 shipped 能力。
- `C-PROM-02`：新增 channel selection、Spiral optional setup 和 direct drafting fallback（`C/.../SKILL.md:42-117`）。
- `C-PROM-03`：只呈现 drafts，不自动发布（`C/.../SKILL.md:118-150`）。验证：`r1/test-files=0`，field publication `not_run`。结论：`Added`，中高（source）。

##### `spec-riffrec-feedback-analysis`

- `C-RIFF-01`：新增 Riffrec/audio/video 的 quick-bug 和 extensive-requirements 双路（`C/skills/spec-riffrec-feedback-analysis/SKILL.md:6-25`）。
- `C-RIFF-02`：新增 sensitive-data/dispatch authorization 边界（`C/.../SKILL.md:20-36`），分析器只收集 evidence，不自动修复。
- `C-RIFF-03`：新增 analyzer entrypoint 与 structured artifact（`C/.../SKILL.md:37-60`），consumer 为 `spec-sweep`。验证：`r4/s2/test-files=6`，Riffrec contract/safety suites 本轮通过。结论：`Added`，高。

##### `spec-simplify-code`

- `C-SIMP-01`：新增对近期 diff 的 reuse/quality/efficiency 三 lens（`C/skills/spec-simplify-code/SKILL.md:9-43`）。
- `C-SIMP-02`：只在保持行为时修简，真 bug 路由回 debug（`C/.../SKILL.md:44-51`）。
- `C-SIMP-03`：必须验证行为保留并摘要变化（`C/.../SKILL.md:52-75`），consumers 为 debug/work/LFG。验证：`r3/test-files=2`，本轮 authority suites 间接覆盖。结论：`Added`，高（contract）。

##### `spec-strategy`

- `C-STRAT-01`：新增 repo-root `STRATEGY.md` 的创建/更新 owner（`C/skills/spec-strategy/SKILL.md:7-32`）。
- `C-STRAT-02`：新增 file-state route、first-run interview 和 update run（`C/.../SKILL.md:32-79`），不把 strategy 写成 roadmap/task list。
- `C-STRAT-03`：将产品方向 handoff 给 ideate/brainstorm/plan（`C/.../SKILL.md:80-93`）。验证：`r2/test-files=1`，semantic strategy eval `not_run`。结论：`Added`，中高。

##### `spec-sweep`

- `C-SWEEP-01`：新增基于 config 的 Slack/GitHub/媒体多源 feedback sweep（`C/skills/spec-sweep/SKILL.md:17-76`）。
- `C-SWEEP-02`：新增 dispatch/sensitive-data 边界、ack 与 fix-merged verification（`C/.../SKILL.md:38-50,76-138`），不把消息声明当作 outcome。
- `C-SWEEP-03`：新增 rolling plan/LFG-ready handoff 和 durable state，consumer 包含 Riffrec analyzer。验证：`r9/s4/test-files=8`，本轮未运行真实 Slack/GitHub writes。结论：`Added`，高（contract）/低（field）。

## 5. 跨 Skill、routing、governance 与五宿主复核

### 5.1 公共路由与 ownership

- current 的 `using-spec-first/references/public-route-map.md:19-44` 能路由 35 个 active source Skill 中的公共 workflow、standalone Skill 和 internal helper consumer；新增 10 个 Skill 均有 route 或明确 caller。
- `src/cli/contracts/dual-host-governance/skills-governance.json` current 恰有 35 个 entry，与 current `skills/*/SKILL.md` 分母一致；master 对应 38 个。
- rename 后的 internal helpers 已有 consumer：`spec-lfg` -> `spec-commit-push-pr`，`spec-dogfood` -> `spec-worktree`，`spec-lfg` -> `spec-test-browser`。没有发现 active source consumer 仍依赖 rename 前旧名。
- master-only 删除项多数只在历史 docs/CHANGELOG 中残留。历史引用说明过去存在，不构成 current 可达性。

### 5.2 Source 与 generated runtime

- current canonical source 仍为 `skills/`、CLI/adapters/contracts；本轮没有读取或修改 `.agents/skills/`、`.claude/`、`.codex/`、`.cursor/`、`.kiro/`、`.qoder/` 作为修复真相源。
- current 支持宿主由 `src/cli/plugin-manifest.js:23` 和 adapters 定义为 `claude`、`codex`、`cursor`、`kiro`、`qoder`。
- focused projection tests确认 active Skill 可被当前 adapters 投射；这只能证明 current registry/projection 合同一致，不能证明被删除 master-only 能力存在于 runtime。

### 5.3 本轮执行的聚焦验证

执行前后 `git status --short` 一致。以下 11 个 Jest suite、131 tests 通过：

- `tests/unit/using-spec-first-contracts.test.js`
- `tests/unit/plugin-modules.test.js`
- `tests/unit/host-runtime-projection-contracts.test.js`
- `tests/unit/spec-lfg-contracts.test.js`
- `tests/unit/spec-worktree-contracts.test.js`
- `tests/unit/spec-riffrec-feedback-analysis-contracts.test.js`
- `tests/unit/spec-riffrec-analyzer-safety.test.js`
- `tests/unit/spec-product-pulse-contracts.test.js`
- `tests/unit/spec-test-browser-contracts.test.js`
- `tests/unit/dispatch-authorization-matrix-contracts.test.js`
- `tests/unit/mutation-authority-contracts.test.js`

未执行 master worktree 的历史测试，也未执行真实 browser、Xcode、Proof、Slack、GitHub mutation、Runtime Setup、CodeGraph/Graphify refresh 或 field outcome。

### 5.4 命令验证账本

#### V-001 默认 remote 获取尝试

```bash
git fetch origin master
```

- exit code: `128`
- 结果：`fail`，错误为 `origin does not appear to be a git repository`。
- claim ceiling：只证明本仓库无 `origin`；不能把本地缓存描述成最新远程 master。

#### V-002 实际 remote 冻结与当前一致性查询

```bash
git fetch github master
git ls-remote github refs/heads/master
```

- exit code: `0` / `0`
- 结果：`pass`；fetch 后冻结 SHA 为 `437bb9e4bfa4f6cf6c9c85e488d72e74c030f365`，最终 `ls-remote` 仍返回同一 SHA。
- claim ceiling：证明审计基线与验收时 remote master 一致；不允许中途把新 ref 替换已冻结基线。

#### V-003 detached worktree

```bash
git worktree add --detach /tmp/spec-first-skill-audit.KPkweO/master 437bb9e4bfa4f6cf6c9c85e488d72e74c030f365
git worktree list --porcelain
```

- exit code: `0` / `0`
- 结果：`pass`；worktree 的 canonical path 显示为 `/private/tmp/spec-first-skill-audit.KPkweO/master`，HEAD 为冻结 SHA，detached。
- claim ceiling：只证明 source snapshot 可复核；不证明 master 历史测试仍可运行。

#### V-004 current 聚焦合同测试

```bash
npx jest --runInBand tests/unit/using-spec-first-contracts.test.js tests/unit/plugin-modules.test.js tests/unit/host-runtime-projection-contracts.test.js tests/unit/spec-lfg-contracts.test.js tests/unit/spec-worktree-contracts.test.js tests/unit/spec-riffrec-feedback-analysis-contracts.test.js tests/unit/spec-riffrec-analyzer-safety.test.js tests/unit/spec-product-pulse-contracts.test.js tests/unit/spec-test-browser-contracts.test.js tests/unit/dispatch-authorization-matrix-contracts.test.js tests/unit/mutation-authority-contracts.test.js
```

- exit code: `0`
- 结果：`pass`；11 suites / 131 tests / 0 snapshots，前后 `git status --short` 完全一致。
- claim ceiling：证明 current 的 route、projection、LFG、worktree、Riffrec、product-pulse、browser contract 与 authority 合同在本轮通过；不证明 master-only Skill 的缺失能力被替代，也不证明 field outcome。

#### V-005 详细账本完成性校验

```bash
node - <<'NODE'
const fs=require('fs'),p=require('path');const s=fs.readFileSync('docs/项目审查/2026-07-27-current-vs-master-Skill能力审计报告.md','utf8'),lines=s.split(/\r?\n/);const caps=lines.map(x=>x.match(/^- `(M-[A-Z]+-\d{2})` \[`(preserved|improved|moved|intentionally-retired|regressed|uncertain)`\]/)).filter(Boolean),ids=caps.map(x=>x[1]),counts={};for(const x of caps)counts[x[2]]=(counts[x[2]]||0)+1;const added=lines.map(x=>x.match(/^- `(C-[A-Z]+-\d{2})`/)).filter(Boolean).map(x=>x[1]);function names(root){return fs.readdirSync(p.join(root,'skills')).filter(n=>fs.existsSync(p.join(root,'skills',n,'SKILL.md')))}const current=names('.'),master=names('/private/tmp/spec-first-skill-audit.KPkweO/master'),union=[...new Set([...current,...master])];const findings=[...s.matchAll(/^### (F-\d{3}) /gm)].map(x=>x[1]),required=['状态','证据','影响','反证','预计写集','关闭条件','Invalidation condition'];let fields=true;for(let i=0;i<findings.length;i++){const start=s.indexOf(`### ${findings[i]} `),end=i+1<findings.length?s.indexOf(`### ${findings[i+1]} `):s.indexOf('\n## 7.',start),block=s.slice(start,end);if(required.some(k=>!block.includes(k)))fields=false;}const ok=caps.length===162&&new Set(ids).size===162&&added.length===30&&new Set(added).size===30&&current.length===35&&master.length===38&&union.length===57&&counts.preserved===26&&counts.improved===54&&counts.moved===32&&counts['intentionally-retired']===3&&counts.regressed===47&&fields;if(!ok)process.exit(1);
NODE
```

- exit code: `0`
- 结果：`pass`；current/master/union 分母为 35/38/57；162/162 master capability IDs 唯一，状态计数为 `preserved=26/improved=54/moved=32/intentionally-retired=3/regressed=47/uncertain=0`；30/30 current-added IDs 唯一；F-001..F-009 必填字段完整。
- claim ceiling：证明报告结构分母与账本计数一致；不自动证明每个语义判断正确。

#### V-006 文档格式与实现零修改

```bash
git diff --check
rg -n '[[:blank:]]+$' docs/10-prompt/当前分支与远程master-Skill能力审计提示词.md docs/项目审查/2026-07-27-current-vs-master-Skill能力审计报告.md
git status --short -- skills src tests templates .agents .claude .codex .cursor .kiro .qoder
```

- exit code: `0` / `1` / `0`
- 结果：`pass`；`rg` 的 `1` 表示未找到 trailing whitespace；Skill/CLI/tests/templates/generated-runtime 目标路径无修改。
- claim ceiling：只证明文本 diff 基础质量和“只审不修”边界；不证明 Skill 语义正确。

#### 未运行项

| 项目 | 状态 | 未运行原因 | 因此不能声称 |
|---|---|---|---|
| master 历史 tests | `not_run` | 审计重点是当前 source parity，且历史依赖/脚本可能产生副作用 | master 在当前环境仍 green |
| independent reviewer / validator / cross-model | `not_run` | 用户未授权 reviewer/subagent dispatch；按 `spec-code-review` 进入 inline fallback | 多 reviewer 一致、finding 已独立验证 |
| fresh-source semantic eval | `not_run` | 同上；当前会话不把缓存 typed-agent/skill 调用当成 fresh source | capability 语义已经新模型重放 |
| `spec-first init` | `not_run` | report-only 明确禁止 runtime regeneration | generated runtime 已刷新或 host 已 field-verified |
| browser/Xcode/Proof/Slack/GitHub/Runtime Setup | `not_run` | 需要现场 provider、外发或 host mutation 权限，不属于本轮审计授权 | 真实宿主/用户 outcome |
| commit/push/PR | `not_run` | 用户只授权写本地审计文档 | 已提交或已落地 |

## 6. Findings

### F-001 [P1] 专用 Skill 审计能力被完整删除

- **状态：** open
- **证据：** master `skills/spec-skill-audit/SKILL.md:3`, `:97`, `:138`，以及 39 个 eval/example/reference/script；current 无 active owner。删除 commit `24f5cbc7` 是 intent evidence，不是 parity evidence。
- **影响：** 无法用受测的 deterministic fact collection + semantic rubric 对 Skill trigger、boundary、eval、security、runtime drift 和 governance 做可重复全仓审计；当前只能人工拼装提示词或让 `spec-write-skill` 做单 package readiness。
- **反证：** current `spec-write-skill validate-only`、本报告使用的临时提示词与通用 `spec-code-review` 证明“仍能手工审”；它们不提供 master 的 20 scripts、4 evals、4 examples 和专用报告合同，因而不能推翻 finding。
- **建议 owner：** `spec-write-skill` 负责修复/authoring；只读审计建议恢复为独立 standalone owner，或建立明确的 `spec-write-skill validate-only --audit-profile` 等价合同，但不能混入 apply authority。
- **预计写集：** `skills/<audit-owner>/**`、dual-host governance、route map、runtime capability catalog、focused tests/evals、README/用户手册、`CHANGELOG.md`。
- **验证方案：** master golden fixtures replay、current package vs master package 对比、security/self-audit dogfood、runtime-drift fixture、五宿主 projection、fresh-source read-only evaluator。
- **关闭条件：** 新 owner 对 `M-SSA-01..06` 全部给出无 orphan 的去向，master fixtures 重放通过，公共路由与只读授权合同可达，且 fresh-source 评估无 P1 缺口。
- **Invalidation condition：** 若后续 source 证据显示 current 已存在一个本轮 inventory 未发现的专用全仓 Skill audit owner，且其 scripts/evals/consumer 可重放 master 场景，则重评本 finding。

### F-002 [P1] Agent-native 架构 reference library 只迁移了局部 lens

- **状态：** open
- **证据：** master `agent-native-architecture` 的 19 个 references；current 仅在 plan/review 保留 action parity、prompt/context、approval/shared workspace 的压缩 lens。
- **影响：** 新建 agent/MCP/self-modifying/long-running system 时，planning/review 有检查视角，但缺少从 primitives、tool design、dynamic context、testing、production guardrails、self-modification 到 product implication 的完整设计方法和可发现入口。
- **反证：** `spec-plan` strategist 与 `spec-code-review` persona 已保留 action parity、shared workspace、approval 等核心 lens，对 `M-ANA-01..02` 构成有效迁移；但 `M-ANA-03..05` 的 reference family/eval 仍无 owner。
- **建议 owner：** 优先把 durable architecture methodology 迁入 `spec-plan` 的 triggered reference family；只在不能保持 progressive disclosure 时恢复 internal standalone reference Skill。不要恢复成公共 command。
- **预计写集：** `skills/spec-plan/references/**`、agent-native planning strategist、code-review persona 交叉引用、eval/consumer replay、必要 docs/CHANGELOG。
- **验证方案：** 从 master 19 reference 建 capability checklist，至少覆盖 MCP tool、shared workspace、自修改、production autonomy、mobile pattern 5 类 case；plan/review 双 consumer replay + fresh-source eval。
- **关闭条件：** 19-reference ledger 中无 orphan，每个保留能力都有可发现 trigger、consumer 和 replay；显式退役项有产品理由与失效条件。
- **Invalidation condition：** 若 Project owner 证明 master 的某些 references 已过时、无 consumer，或已被宿主 primitive 以可验证合同完整覆盖，则可将对应 capability 改判为 `intentionally-retired`。

### F-003 [P1] 前端设计从“设计并实现”降为 planning/review/polish 的碎片化覆盖

- **状态：** open
- **证据：** master `frontend-design/SKILL.md:20-244`；current frontend planning lens 明确“不取代视觉打磨、browser 执行或 diff review”，`spec-polish` 又明确不做 initial planning/build。
- **影响：** greenfield landing/app/dashboard/component 工作缺少统一 owner 来形成 visual thesis、选择 typography/color/composition/motion/copy、实现并截图验证；现有三段 owner 之间存在执行空档。
- **反证：** `spec-plan` frontend lens、`frontend-quality-reviewer` 和 `spec-polish` 分别覆盖规划、diff 审查与已实现页面打磨，证明 `M-FD-01..02` 部分迁移；它们的 negative boundary 恰好证明 `M-FD-03..05` 的初始实现闭环没有 owner。
- **建议 owner：** 不一定恢复同名 Skill；可在 `spec-work` 增 triggered frontend implementation methodology，并让 `spec-plan` 提供 design intent、`spec-polish` 做 field iteration、`spec-code-review` 做 defect lens，明确单向 handoff。
- **预计写集：** `skills/spec-plan/references/frontend-engineering-lens.md`、`skills/spec-work/references/**`、`skills/spec-polish/**`、review persona、consumer tests/evals、docs/CHANGELOG。
- **验证方案：** greenfield marketing、dashboard、existing component 三类 replay；验证 visual thesis -> implementation -> screenshot -> review trace 完整且无重复 owner。
- **关闭条件：** 三类 replay 都能在一条明确 handoff 中形成 design intent、implementation、screenshot evidence 和 review，且没有 plan/work/polish 之间的 orphan 责任。
- **Invalidation condition：** 若项目明确将 greenfield frontend implementation 定为 non-goal，并把它迁移到已验证的 external plugin/host capability，则可将本 finding 调整为已接受产品边界减少。

### F-004 [P2] PR 可视化 demo evidence capture/upload 链消失

- **状态：** open
- **证据：** master `feature-video/SKILL.md:9-160` 和 capture script/reference tiers；current 无 GIF/terminal reel/public upload owner。
- **影响：** QA screenshot、Markdown Proof 与 PR demo evidence 被混为近邻能力，无法生成经 secret scan、fallback、approval 的可分享产品使用证据。
- **反证：** `spec-dogfood` 可截图且 `spec-proof` 可发布 Markdown，证明部分 evidence primitive 仍在；但没有 capture tier、secret gate、media upload 和 public URL 合同。
- **建议 owner：** 作为 optional standalone Skill 或 `spec-proof`/shipping 的 opt-in evidence producer，绝不自动上传。
- **预计写集：** optional `skills/<demo-evidence-owner>/**`、secret-positive fixtures、capture/upload scripts、route/capability catalog、consumer tests/evals、README/迁移说明、`CHANGELOG.md`。
- **验证方案：** CLI、browser states、motion 三类 fixture；secret-positive fixture 必须 fail closed；upload failure 不得生成假 URL。
- **关闭条件：** `M-FV-01..05` 均有明确迁移/退役去向，且上述三类 fixture、secret-positive 与 upload-failure 用例通过。
- **Invalidation condition：** 若 Project owner 明确 PR/demo reel 不再是产品需要，且文档不再暗示该能力可用，则可关闭为 accepted non-goal，但不应改写为 parity。

### F-005 [P2] Session history 与 standalone Slack research 的直接可达性丢失

- **状态：** open
- **证据：** master `spec-sessions`、`spec-slack-research`；current 只把 scripts/persona 嵌入 compound/plan/brainstorm/ideate。
- **影响：** downstream workflow 可以借用历史/组织 context，但用户不能独立询问“之前做过什么”或“团队怎么讨论过”，也没有原有 digest/limitations output contract。
- **反证：** session-history scripts 和 Slack researcher personas 已迁入 compound/plan/brainstorm/ideate/sweep，对内部 consumer 有效；route map 无 standalone 入口，因而不能推翻可达性缺口。
- **建议 owner：** 如果产品仍需要 recall/research，将它们作为 standalone read-only Skill 恢复；否则在用户手册明确 retired 与替代入口，不要让历史 docs 暗示仍可用。
- **预计写集：** 恢复时涉及 `skills/<session-or-slack-owner>/**`、route/governance/projection、privacy/redaction tests/evals、README/用户手册、`CHANGELOG.md`；退役时涉及 product decision record、route negative cases 和历史引用清理。
- **验证方案：** time-window、prior-attempt、no-hit、privacy/redaction、Slack unavailable fallback cases。
- **关闭条件：** 恢复时，`M-SS-01..05`/`M-SSR-01..04` 无 orphan 且上述 cases 通过；退役时，可达性缩减被明确记录且无 active consumer 仍要求旧入口。
- **Invalidation condition：** 若后续 route/host 增加等价 standalone 查询能力，且有相同窗口、digest、limitations/privacy 合同，则重评本 finding。

### F-006 [P2] Release/Changelog/bug-report 运维表达能力被一并移除

- **状态：** open
- **证据：** master `changelog`、`spec-release-notes`、`report-bug`; current `spec-promote` 只覆盖 launch copy。
- **影响：** recent merge summary、published release query、插件问题环境采集/隐私/issue 提交没有 owner。对核心 coding workflow 非阻断，但降低可运营性与可支持性。
- **反证：** `spec-promote` 可生成 launch copy，`CHANGELOG.md` 与 `doctor` 提供部分手工原料；它们不覆盖 time-window release aggregation、published-release confidence query 或 privacy-safe bug issue flow。
- **建议 owner：** 评估是否由 CLI `release-notes`/`doctor --report` 等更确定性入口承接；避免恢复自动外发，默认生成 draft/report artifact。
- **预计写集：** `src/cli/commands/**` 或 optional `skills/<release-support-owner>/**`、release/bug schemas、privacy fixtures、route/docs/README、focused tests、`CHANGELOG.md`。
- **验证方案：** offline/no-gh、rate-limit、malformed release、privacy-sensitive bug info、no-post-without-authorization。
- **关闭条件：** `changelog`/`spec-release-notes`/`report-bug` 的有效 capability 全部迁移或被明确退役，且上述失败/隐私 cases 通过。
- **Invalidation condition：** 若产品明确把运营/支持工作全部移出 spec-first，并提供可发现的 external owner 与迁移说明，则可关闭为 accepted boundary reduction。

### F-007 [P2] Team standards governance 是有意退役，但属于真实能力减少

- **状态：** open / product decision required
- **证据：** master Skill、references/evals；`CHANGELOG.md:549` 明确完整退役且下游不再消费 confirmed standards。
- **影响：** current 更轻、更少第二真相源，但失去 standards authority/promotion/conflict/deprecation/replay。不能同时声称“完整退役”和“能力无损”。
- **反证：** AGENTS.md/source instructions 与 `spec-rule-miner` 提供更轻的 standards-native 原语，证明减少第二真相源有实际收益；它们不拥有 confirmed candidate promotion/deprecation/conflict lifecycle。
- **建议 owner：** 由 Project owner 明确选择：接受该 capability reduction 并记录 non-goal/invalidation condition，或设计更轻的 standards-native（AGENTS.md/direct evidence）机制；不要恢复候选账本和复杂规则引擎。
- **预计写集：** 接受退役时仅写 product decision record、route negative tests、README/迁移说明、`CHANGELOG.md`；恢复轻机制时涉及 AGENTS.md/source contract、最小证据 schema、consumer replay 和 tests。
- **验证方案：** 若接受退役，新增产品级 decision record 和 routing negative cases；若恢复轻机制，验证不创建第二 source-of-truth。
- **关闭条件：** Project owner 做出显式产品裁决；若退役，无 active consumer 依赖旧 confirmed standards；若恢复，通过 no-second-source replay。
- **Invalidation condition：** 若后续证据显示目标用户不再需要团队标准查询/提升，且宿主/AGENTS.md 已满足所有实际 consumer，则可将 `M-TSG-02..05` 改判为 accepted retirement。

### F-008 [P3] Provider/domain/housekeeping utilities 被删除

- **状态：** open / likely accepted product-boundary reduction
- **证据：** master `gemini-imagegen`、`spec-dhh-rails-style`、`git-clean-gone-branches`，current 无 owner。
- **影响：** repo package 不再自带这些可选能力；它们与核心 Codebase->Spec->Plan->Tasks->Code->Review->Knowledge 链关系弱。
- **反证：** 宿主可能提供 image generation，Rails 方法可来自项目 instructions，branch cleanup 可用原生 git；但本轮没有 repo-owned route/contract/test 能证明五宿主等价。
- **建议：** 优先 external plugin/optional install，不放回核心 governance；但 README/迁移说明应诚实标记不再提供。
- **预计写集：** 优先仅更新 README/用户手册/迁移说明和 optional-plugin 索引；如侜应 optional package，再增 package metadata、installer tests 和 `CHANGELOG.md`。
- **关闭条件：** 每项能力被明确定为 core non-goal，用户能找到受支持的外部替代，且现有 docs/route 不再声称包内可用。
- **Invalidation condition：** 若新增 repo-owned optional skill/plugin 同时恢复对应入口、边界和 tests，则重评对应 capability；仅宿主工具存在不足以推翻。

### F-009 [P3] commit/landing helper 的直接用户入口被主动收窄

- **状态：** open residual，不建议按 regression 修复
- **证据：** master frontmatter 直接匹配用户“commit/ship”；current `spec-commit`/`spec-commit-push-pr` 为 `user-invocable:false` 并要求上游授权。
- **影响：** 用户少了通用 git convenience entry，但降低了 dirty-tree sweep、无授权 push/PR 的风险，符合 internal-helper 不暴露原则。
- **反证：** `spec-lfg` 等公共 shipping workflow 已消费内部 helper，且本轮相关 contract tests 通过，说明落地能力本身未丢；缺少的是直接可达性。
- **建议：** 保持 current 边界；只需确保公共 shipping workflows 的提示和 handoff 足够清晰。
- **预计写集：** 原则上无实现修复写集；如需改善可发现性，仅涉及 route map、shipping workflow handoff、用户手册与 focused contract tests。
- **关闭条件：** 所有公共 shipping 场景均有明确入口，无 active source consumer 依赖旧名，authority tests 持续证明 direct invocation 不可绕过授权。
- **Invalidation condition：** 若用户产品需求再次明确要求通用 direct commit/ship entry，且公共 workflow 不能满足，则需重新评估该 intentional simplification。

## 7. Coverage 与证据上限

| 覆盖项 | 状态 | 说明 |
|---|---|---|
| current/master 全部 source Skill inventory | complete | 35 vs 38，union 57 |
| 同名 Skill source/static semantic comparison | complete | 16/16 |
| rename/migration 双身份 | complete | 9 对 / 18 个身份 |
| master-only migration/loss decision | complete | 13/13 |
| current-only added capability | complete | 10/10 |
| master 详细 capability ledger | complete | 162 项，162 个唯一 ID，38/38 master Skill 有具体账本 |
| current-only 新增 capability ledger | complete | 30 项，30 个唯一 ID，10/10 真正新增 Skill |
| capability status 计数 | complete | preserved 26 / improved 54 / moved 32 / intentionally-retired 3 / regressed 47 / uncertain 0 |
| finding 字段完整性 | complete | F-001..F-009 均有状态、证据、影响、反证、预计写集、关闭条件和 invalidation condition |
| routing/governance/consumer source | complete | route map、governance registry、focused consumers |
| current focused tests | passed | 11 suites / 131 tests |
| master historical tests | not_run | 不把历史 commit 说明当本轮 test result |
| independent reviewer / validator / cross-model | not_run | 用户未授权 reviewer/subagent dispatch；inline fallback |
| fresh-source semantic eval | not_run | 同上 |
| generated runtime regeneration | not_run | report-only，未运行 `spec-first init` |
| host/field outcome | not_run | browser、Xcode、Proof、Slack、GitHub、setup 均未实跑 |

本报告的最高证据级别是 current/master source 静态确认 + current 聚焦 contract/projection tests。它能确认“能力合同存在/缺失、consumer 与 projection 是否接线”，不能确认真实宿主或现场 outcome。

## 8. Actionable Findings Queue（只建议，不实施）

1. `F-001`：先决定是否恢复受治理的 read-only Skill audit owner；这是重新证明全量 parity 的前提。
2. `F-002`：建立 master `agent-native-architecture` 19-reference capability migration ledger，逐项迁入 plan/review 或明确 retire。
3. `F-003`：补齐 frontend design 的 implementation owner 和 plan->work->polish->review handoff。
4. `F-004`：决定 feature demo evidence 是否是产品必需能力；如是，恢复 opt-in、secret-safe、approval-gated capture owner。
5. `F-005`：明确 session/Slack standalone recall 是退役 non-goal 还是待恢复 capability。
6. `F-006`：把 release/changelog/bug-report 归入 CLI、optional Skill 或明确退役说明。
7. `F-007`：Project owner 对 standards governance 的能力减少做正式产品裁决，不以“代码删除成功”代替价值判断。
8. `F-008`：provider/domain utilities 优先外置为 plugin/optional install；文档诚实披露。
9. 修复阶段结束后，重新运行同一审计分母和 fresh-source independent eval；只有所有 P1 closed、master capability ledger 无 orphan，才可重新评估“整体净提升”。

## 9. 最终 Verdict

**REQUEST CHANGES**

- 核心 workflow harness：明显提升。
- 全量 master Skill 能力 parity：未建立。
- “重构后 Skill 能力整体优于 master”：当前证据不支持。
- 本轮修复：未执行。
- finding closure：0；全部保持 open。

### 最终 Actionable Findings（只建议，不实施）

1. `F-001` [P1] `M-SSA-01..06`：先决定是否恢复受治理的 read-only Skill audit owner；这是重新证明全量 parity 的前提。
2. `F-002` [P1] `M-ANA-03..05`：对 master agent-native reference library 做无 orphan 迁移/退役裁决并运行 plan/review replay。
3. `F-003` [P1] `M-FD-03..05`：补齐 frontend design implementation owner 和 plan -> work -> polish -> review 证据链。
4. `F-004` [P2]：决定 demo evidence 是否为产品必需；如是，恢复 opt-in、secret-safe、approval-gated capture/upload owner。
5. `F-005` [P2]：明确 session/Slack standalone recall 是 accepted non-goal 还是待恢复能力。
6. `F-006` [P2]：将 release/changelog/bug-report 归入 CLI、optional Skill 或正式退役说明。
7. `F-007` [P2]：由 Project owner 对 team standards governance 的能力减少做显式产品裁决。
8. `F-008` [P3]：将 provider/domain/housekeeping utilities 优先外置，并在迁移文档中诚实披露。
9. `F-009` [P3]：保持 internal helper 授权收窄，只补公共 shipping workflow 的可发现性与合同测试。
