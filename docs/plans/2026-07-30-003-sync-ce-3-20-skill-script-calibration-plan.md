---
title: "Calibrate Spec-First Skills and Scripts Against CE 3.20.0 Diff - Plan"
type: refactor
status: active
date: 2026-07-30
sequence: 003
topic: ce-3-20-skill-script-calibration
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
plan_depth: deep
origin: compound-engineering-plugin@7f86be9d..1fac0442
---

# Calibrate Spec-First Skills and Scripts Against CE 3.20.0 Diff - Plan

## Goal Capsule

| Dimension | Decision |
| --- | --- |
| Objective | 以 CE `3.19.0 -> 3.20.0` 的真实 Git 区间 `7f86be9d..1fac0442` 为唯一上游增量基线，逐项校准 spec-first 当前 35 个 canonical Skill、全部相关脚本和 CLI/安装边界；吸收能提高 grounding freshness、可移植性、机械验证地板、恢复能力和 PR 尾部闭环的变化，同时拒绝 provider 绑定、中心执行器和 artifact contract 漂移。 |
| Recommended approach | `extend + compose`。优先扩展现有 Skill owner、host-neutral worker dispatch、run artifact、Runtime Setup、adapter/init 和测试契约；不按 CE 文件形态复制六份大型 runner、外部模型路由器或 `ce-work` 中心控制器。 |
| Diff focus | 固定 Git 区间的 422 个变更文件全部进入逐文件判定。其实施目标面为 `skills/**` 215 个、CLI/转换/安装 Runtime 19 个和支撑文件 3 个；其余 185 个上游计划、Skill 文档、解决方案、tests/fixtures、插件元数据与发布文件作为设计或验证证据逐条审计。29 个 CE Skill 全量映射，其中 3 个新增 Skill 必须得到明确去向；逐文件证据见 `docs/validation/2026-07-30-ce-3-20-file-by-file-diff-audit.md`。 |
| Authority hierarchy | 当前用户要求与项目角色契约 > 当前 spec-first canonical source/tests > CE `7f86be9d..1fac0442` 原始 diff > 上游升级分析文档。升级分析是导航，不能替代具体 diff；CE provider/model/product 选择不是 spec-first contract。 |
| Source/runtime boundary | 只修改 `skills/`、`templates/`、`src/cli/`、`scripts/`、`tests/`、`docs/`、README、Changelog 等 canonical source；`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 只通过 `spec-first init` 重投影。 |
| Script/LLM boundary | 脚本只拥有路径、diff、schema、hash、进程、超时、权限、状态、回执、排序和可重复检查；LLM 继续拥有需求、架构、review finding 是否成立、persona/lens 选择、fallback 是否语义充分和最终 adoption verdict。 |
| Largest risk | CE 3.20.0 的主要实现以 Claude/Codex/Grok/Cursor/Composer CLI、detached peer 和单产品目录约定为中心；机械同步会绕过 spec-first 的独立授权、provider-untrusted、host-native execution、claim ceiling 和稳定 artifact consumer。 |
| Tail ownership | `spec-work` 分波实施；每波只进入已授权的 canonical target。当前工作树中既有 OpenCode/runtime 修改属于独立 owner，实施时必须先 rebase/merge current source，不得覆盖或回滚。 |
| Stop conditions | 需要手改 generated runtime；需要让脚本作语义 verdict；需要把 workflow invocation 当作模型外发/worker dispatch 授权；需要把 CE provider CLI 变成通用 Skill contract；需要全局移动 `docs/` artifact root；或无法证明 35/29/422 三组清单零遗漏。 |

---

## Product Contract

### Summary

本计划不是“把 CE 3.20.0 搬进 spec-first”，而是一次受约束的增量校准：对上游每个新增/修改/删除文件先找当前 spec-first owner，再按以下五类裁决，最后只在 owner 内实现最小 durable mechanism。

| Verdict | Definition |
| --- | --- |
| `直接同步` | 语义、ownership 和失败边界与 spec-first 已一致，可按当前命名与路径直接移植，并补测试。 |
| `按 spec-first 边界改造后吸收` | 上游问题真实，但实现绑定 CE 产品、provider 或目录；只吸收不变量、schema 或机械地板，落到当前 owner。 |
| `等价能力已存在` | 当前 source 已覆盖主要能力；只补差距或回归，不再建平行机制。 |
| `明确不采纳` | 与角色契约、source/runtime 边界、授权模型、消费者稳定性或 80/20 取舍冲突。 |
| `无本次 diff 影响` | CE 区间没有对应语义变化，当前 Skill 不因“全量校准”而进行无关重构。 |

### Problem Frame

CE 3.20.0 的高价值变化集中在五类真实问题：repo profile cache 漂移、宿主专用参数与 Python 假设、review 机械事实不足、长进程/外部模型回执脆弱、PR/实施尾部缺少可恢复状态。spec-first 当前同时已有更强的治理边界：固定 artifact contracts、host-neutral dispatch、独立授权、provider-untrusted、run artifact、verification evidence、source-first 多宿主投射。两者不能用“上游更新较新”简单定优先级。

因此本次校准采用三条原则：

1. 借问题和工程不变量，不借 CE 产品形态。
2. 先扩展现有 owner，不新增平行 workflow/runtime。
3. 对有真实 consumer 的确定性地板立即落地；对需要 live provider 证据的能力设置 activation gate，不用文档或 fixture 冒充已可用。

### Actors

- A1. Skill user / upstream workflow：提供任务与独立的 mutation、dispatch、data egress、credential、commit、landing 授权。
- A2. Canonical Skill owner：拥有语义流程、fallback、claim ceiling、handoff 和用户可见结果。
- A3. Deterministic helper：准备当前 worktree facts、运行状态、回执和机械校验，不作 adoption/review/root-cause 判断。
- A4. Host runtime：拥有当前会话可调用 primitive、权限、模型、隔离、并发和 live outcome。
- A5. CLI/runtime projection owner：拥有 adapter、init、doctor、clean、frontmatter 和受管目录安全。
- A6. Maintainer/reviewer：按 source、tests、field evidence 决定波次是否可激活。

### Requirements

**Exhaustive reconciliation**

- R1. 35 个当前 canonical Skill 必须各有且仅有一个主裁决条目，写明当前职责、CE diff、差距、修改面、不采纳项、验证、风险、依赖和优先级。
- R2. 29 个 CE Skill 必须全部映射；`ce-babysit-pr`、`ce-handoff`、`ce-retune` 必须有明确 owner 和“建/并/拒/延后”结论，不能停在观察状态。
- R3. 固定 Git 区间的 422 个上游文件必须各自拥有独立审计记录，写明原始 diff、实际变化、spec-first owner、裁决和验证面；237 个实施目标与 185 个证据/测试/发行支撑文件必须分别可计数、可回链。任何路径未分类、重复分类、继承目录裁决或只按 A/M/D 状态机械迁移都阻断实施。
- R4. 47 个上游脚本文件（46个Skill-local脚本和1个根级开发脚本）必须逐文件写明 source owner、是否复制、目标实现形态、输入/输出/失败回执和测试。

**Grounding and portability**

- R5. 删除 spec-first 九个同源 `repo-profile-cache.py`、九份 cache reference、九份 repo-profiler route 及其 parity test；各 Skill 改为当轮直接读取当前 target repo/worktree evidence，必要时使用 run-local dossier，而不是跨 branch/worktree 持久缓存。
- R6. 所有 canonical Skill body 中的 Claude 专用 `$ARGUMENTS` 表述迁移为 host-neutral invocation arguments；parser/quoted path/Windows drive 语义由 owner tests 固定，不能用字符串替换猜测。
- R7. Bundled shell/Python 脚本统一使用可执行探测的 Python resolver（`python3 -> python -> py`），并能排除 Windows Store stub；`.gitattributes` 为实际发布的 `.sh`、`.py` 和无扩展名 executable script 强制 LF。
- R8. 私有临时目录只用于 ephemeral/egress/process state，必须 owner-checked、no-symlink、`0700`/用户私有、原子发布；durable workflow evidence 继续进入 `.spec-first/workflows/**`，canonical decision artifacts 继续进入固定 `docs/**`。

**Review and external execution**

- R9. `review-scope` 和 `findings-mechanics` 只产出确定性 facts：diff endpoint、变更行、path signals、schema validity、exact fingerprint、稳定排序；persona 选择、finding 合并语义、置信度最终裁决仍由 LLM owner 完成。
- R10. Detached peer runtime 必须 provider-neutral、授权感知、私有、可恢复，并记录 requested/actual provider/model、route、timeout、exit、result hash 和 limitation；provider/CLI 名称只存在于外部 adapter/evidence，不进入通用 Workflow contract。
- R11. Plan/brainstorm 不默认外发到 Claude CLI，也不因配置存在取得 dispatch/egress 授权；只有经用户明确请求且 current host/provider capability 与 data boundary 可证时，才可进入可选 elevation capability。
- R12. Code review、doc review 和 POV 可共享 peer lifecycle/result receipt contract，但每个 Skill 保留自己的语义 schema、lens、合成和 claim ceiling。
- R13. `spec-work` 不实现 CE 的中心执行器、模型路由器、并发池或自动 commit controller；只把 crash recovery、unit receipt、碰撞检查和验证事务不变量吸收到现有 `spec-work`、`spec-worktree`、run artifact 与 host-native execution owner。

**Artifacts and PR tail**

- R14. 不引入全局可配置 `docs_root`。`docs/plans`、`docs/tasks`、`docs/solutions`、`docs/brainstorms` 和受保护路径继续是稳定 producer/consumer contract；只有非 canonical 报告可在各自 owner 下显式支持 alternative output。
- R15. CE PR watcher 的 review/CI/head/branch-currency 状态机并入 `spec-lfg` shipping tail，并由 `spec-commit-push-pr` 提供可选 handoff；LFG admission必须新增用户可见披露，分别授权bounded PR-feedback修复和按repo policy保持branch currency，但不授权merge、force-push或任意历史重写。第一阶段不新增公开 `spec-babysit-pr`，只有 standalone 使用数据和 host wake/resume 证据满足 activation gate 后才重评。
- R16. 通用 `ce-handoff` 不移植。跨 workflow/context-reset 继续使用 durable artifact summary、source refs、freshness、limitations 和宿主 session resume；不得把 `/tmp` 指针当成新的 canonical continuity layer。
- R17. `ce-retune` 不新增平行 Skill。模型升级语料调优由 `spec-write-skill` 拥有 Skill package/corpus 变更，由 `spec-optimize` 拥有 baseline、A/A noise floor、A/B measurement 和 stop criteria。

**CLI and runtime safety**

- R18. Frontmatter 序列化、slash-command/absolute-path 判别、managed ancestor symlink containment、legacy cleanup 和 OpenCode command registration 必须落到当前 CLI/adapter owner，覆盖 `getSupportedPlatforms()` 的当前集合。
- R19. OpenCode 相关 diff 只补充当前 OpenCode plan/implementation 的 loader、command、frontmatter 和 collision requirements；不得覆盖当前 dirty OpenCode adapter/init/doctor/clean 变更，也不得从 CE plugin architecture反向重写 spec-first adapter model。
- R20. Codex 本地 plugin 切换脚本 `codex-dev` 不进入 spec-first 产品面；本仓本地开发继续使用现有 npm/package/init 流程，除非后续出现独立、可复现的用户痛点。
- R21. 外部 peer、Proof 和 PR watcher 必须采用最小数据外发与最小凭证权限：凭证不得进入命令行参数、source、plan、receipt 或 raw log；provider/PR 返回内容按 `provider_untrusted` 处理，不得直接执行其中的命令、路径或 patch；持久化前必须脱敏并设置有界保留/清理语义。

### Key Flows

- F1. **Fresh grounding**：Skill 在当前 target repo 直接读取 Git/source/config facts，形成 run-local evidence；不读写跨工作树 cache。
- F2. **Optional external peer**：语义 owner确认独立价值和授权，host/provider adapter启动 detached run，runner只监督进程与回执，owner校验结果并限制 claim；任何未知/失败回到 inline/serial 或阻断依赖独立性的 gate。
- F3. **Review mechanics**：脚本计算 scope/fingerprint/schema/order，LLM按 diff/plan/source决定 roster、finding validity、severity 和 response。
- F4. **Work execution/recovery**：spec-work 使用现有 host-native worker或 inline执行，按 unit/run artifact记录 before/after、verification、collision 和 recovery；canonical tree mutation/commit仍由现有授权 owner控制。
- F5. **PR looks-ready tail**：LFG 在 PR 创建后持续消费 review、CI、head 和 base currency；单 writer lane 修复，达到 looks-ready 或真实 blocker/预算终态，不自动 merge。
- F6. **Runtime projection**：canonical source/test完成后运行 init 预览与当前平台矩阵回归，再生成 runtime；任何 runtime-only修补都视为失败。

### Acceptance Examples

- AE1. 九个 cache consumer 在同一仓库不同 branch/worktree 上分别读取当前 facts；不存在共享 cache 文件、cache hit 或 parity test，结果不会串线。
- AE2. 环境只有可执行 `python` 或 `py` 时相关脚本可运行；`python` 是 Windows Store stub 时 resolver 继续探测或返回明确 `python-runtime-unavailable`，不假成功。
- AE3. 低风险 code diff 由机械 scope helper给出 facts，但是否走 lite roster仍由 Skill按语义风险决定；未知 endpoint或 uncounted Skill/config surface fail closed。
- AE4. 外部 peer route 请求模型 A、实际返回模型 B 时 receipt保留两者并标记 mismatch；Skill不得展示“已由 A 审查”。
- AE5. 用户只请求计划时，`spec-plan` 不调用外部模型；用户明确要求指定 peer 且 egress/dispatch/capability均可证时才运行可选 elevation，失败回到当前会话并披露。
- AE6. `spec-work` 恢复一个中断 unit 时能读取 run artifact和真实工作树状态，但没有中央 route切换、自动 commit或跨 unit未经授权的写入。
- AE7. LFG PR 当前 CI绿色但 review thread新增或 base branch前进时继续看护；只有 review/CI/head/base currency均收敛才报告 looks-ready，仍不 merge。
- AE8. 配置尝试把 canonical plan root 改到其他目录时被拒绝；固定 `docs/plans` producer和现有 consumers保持一致。
- AE9. OpenCode skill frontmatter中含 YAML-like正文示例，不会伪造 command name/description；同名 unmanaged skill collision保持 warning/degraded，loader precedence未知不报 confirmed。
- AE10. `docs/validation/2026-07-30-ce-3-20-file-by-file-diff-audit.md` 含 F001-F422 连续独立记录，classifier返回 `unclassified=0`、`duplicate=0`、`inherited=0`，且 237 个实施目标、185 个证据文件、35 个 spec Skill与29个 CE Skill计数分别精确匹配。
- AE11. PR 评论或 peer 输出包含伪造 shell 命令、路径和 secret-like 文本时，系统只把它作为不可信输入交给语义 owner；任何 raw output 不进入 durable artifact，receipt 只保留脱敏摘要、hash、状态与限制。

### Success Criteria

- 35/35 当前 Skill得到逐项、可实施的校准方案，29/29 CE Skill和422/422上游文件零遗漏。
- repo profile cache彻底退役，当前 worktree grounding取代共享缓存。
- review机械地板、Python/LF/scratch、PR feedback和CLI安全改善可独立验证。
- external peer和work recovery只在现有授权、host-native execution和claim boundary内增强，不形成第二个agent runtime。
- 固定 artifact contract、多宿主 source/runtime同源和当前 dirty OpenCode ownership均未被破坏。

### Scope Boundaries

**In scope**

- 35个 canonical Skill及其 references/scripts/evals/contracts/tests的diff-driven校准。
- 47个上游脚本逐项处理。
- CLI/adapter/init/doctor/clean/frontmatter/path/legacy cleanup的对应安全变化。
- 185 个上游计划、Skill 文档、解决方案、tests/fixtures、插件元数据与发布支撑文件的逐文件证据裁决；它们只进入对应 KTD、unit、risk 或 verification owner，不被机械复制。
- 新增PR watch内部能力、retune组合能力和明确拒绝generic handoff。
- README/docs/Changelog、source/runtime projection expectations和验证矩阵。

**Out of scope**

- 逐字复制CE provider/model配置、品牌、Proof凭证或plugin marketplace形态。
- 全局可配置artifact root。
- spec-first自建统一agent dispatcher、模型路由器、并发池或中心workflow engine。
- 本计划执行期间覆盖现有dirty OpenCode/runtime工作。
- 自动merge、release、外部issue/PR或未授权数据外发。

---

## Planning Contract

### Key Technical Decisions

- KTD1. **Use the raw Git range as the upgrade authority.** 升级分析文档用于索引和规模核对，最终判定必须能回到`git diff 7f86be9d..1fac0442`的具体文件。
- KTD2. **Keep stable artifact roots.** 不引入`docs_root`; durability按`docs/**`、`.spec-first/workflows/**`、private temp三层分开。
- KTD3. **Remove repo caches, not grounding.** 删除的是跨run持久缓存与profiler route；每次运行仍必须形成共享、可引用的current-repo orientation。
- KTD4. **Skill-local runtime copies remain self-contained.** 若detached runner进入多个Skill，保留Skill-local可发布副本和byte-parity测试；不引入运行时跨Skill import。先缩小到有真实独立peer consumer的Skill，避免无条件复制六份1845行实现。
- KTD5. **One peer lifecycle contract, multiple semantic owners.** Runner/receipt可同构；code/doc/POV各自拥有prompt、schema、lens和合成。
- KTD6. **No default reasoning elevation.** Plan/brainstorm模型提升为activation-gated optional capability，不是默认路径，也不绑定Claude CLI。
- KTD7. **Translate CE Work invariants, reject its controller topology.** 吸收unit状态、碰撞、恢复、验证事务；执行仍由spec-work + host primitive + spec-worktree/run-artifact组成。
- KTD8. **Integrate PR watch before adding a public Skill.** 先修复spec-lfg现有CI-only尾部并服务`spec-commit-push-pr`；standalone入口需以真实重复需求和wake/resume能力激活。
- KTD9. **Compose retune from existing owners.** `spec-write-skill`负责corpus/package，`spec-optimize`负责measurement；不创建`spec-retune`。
- KTD10. **Do not create a generic temp handoff layer.** 使用已有durable artifacts、session store/resume和handoff envelopes。
- KTD11. **Extend current CLI safety owners.** 复用target-repo containment、adapter registry、plugin manifest和init lifecycle，避免从CE TypeScript目录平移一套实现。
- KTD12. **Protect dirty work.** OpenCode相关unit开始前必须重新读取当前磁盘source和git diff；若目标文件仍有未合并修改，采用patch-on-current并运行双方tests，无法无损合并则停止请求owner决策。
- KTD13. **Keep Python and scratch runtime self-contained.** Python resolver是每个实际shell/caller内的小型本地函数，按同一行为contract和parity fixtures治理；不建立跨Skill runtime import。Private scratch也由peer runner、PR feedback、optimize、sweep等实际owner各自实现，共享的是安全不变量测试，不是通用daemon或隐藏目录服务。

### Architecture Posture

```text
CE raw diff (provider/product-specific evidence)
        |
        v
Exhaustive reconciliation ledger
        |
        +--> current Skill semantic owner
        +--> current deterministic helper owner
        +--> current CLI/runtime projection owner
        |
        v
Canonical source changes -> focused evidence -> current-platform init projection
```

拒绝形成以下拓扑：

```text
Skill -> CE central model router -> CE unit controller -> host CLI
```

目标拓扑保持：

```text
Skill semantic contract -> current host-native primitive or inline fallback
                       \-> deterministic facts/receipt helpers
```

### Artifact and Interface Contracts

| Contract | Owner | Planned shape |
| --- | --- | --- |
| Fresh repo orientation | each consuming Skill | run-local summary + source refs + current git identity; no cross-run cache |
| Python resolution | shared script convention/test helper | ordered executable probe + selected command + failure reason; no semantic fallback |
| Private scratch | skill-local helper or shared CLI helper | owner/no-symlink/mode/atomic-write facts; never canonical decision artifact |
| Peer job receipt | peer-enabled Skill scripts | requested/actual provider/model, run id, timestamps, exit/timeout, result/log refs and hashes, limitation/reason code |
| Review scope facts | spec-code-review | endpoints, files, executable line facts, uncounted/risk signals, lite eligibility inputs; no final roster verdict |
| Findings mechanics | spec-code-review | schema errors, exact fingerprints, contributor set, stable order; LLM supplies semantic equivalence/severity |
| Work run artifact | spec-work/CLI helpers | unit/task refs, before/after identity, authorization refs, verification and recovery state |
| PR watch snapshot | spec-lfg | PR/head/base/review/CI state, generation, active budget, blocker/looks-ready state; no merge action |
| Runtime projection | CLI adapters/init | current supported platform set, managed ownership, collision and containment facts |

---

## Exhaustive CE Skill Mapping

以下29行是 CE Skill 目录到 spec-first owner 的汇总映射，不替代逐文件裁决。`docs/validation/2026-07-30-ce-3-20-file-by-file-diff-audit.md` 对全部215个 `skills/**` 文件逐条记录实际变化、owner、裁决和验证面；本表的“Exceptions/translation”只总结共同方向，任何单文件例外以逐文件账本为准。

| CE Skill | Files | Spec-first owner | Primary verdict | Exceptions / translation |
| --- | ---: | --- | --- | --- |
| `ce-babysit-pr` | 3 | `spec-lfg`, `spec-commit-push-pr` | 按 spec-first 边界改造后吸收 | 不新增public Skill；watch-loop和snapshot状态机改为shipping-tail内部contract。 |
| `ce-brainstorm` | 16 | `spec-brainstorm` | 按 spec-first 边界改造后吸收 | 3个repo-cache资产直接删除；elevation/runner仅activation-gated，不默认复制。 |
| `ce-code-review` | 24 | `spec-code-review` | 按 spec-first 边界改造后吸收 | cache资产直接删除；scope/mechanics/peer lifecycle吸收，persona语义不脚本化。 |
| `ce-commit` | 1 | `spec-commit` | 直接同步 | 移除host专用参数语义；保留internal-only和独立commit授权。 |
| `ce-commit-push-pr` | 2 | `spec-commit-push-pr` | 按 spec-first 边界改造后吸收 | 吸收branch-scope reconciliation和PR template；branding/auto babysit不默认。 |
| `ce-compound` | 13 | `spec-compound` | 按 spec-first 边界改造后吸收 | cache资产直接删除；UTF-8/validator修复直接同步；headless行为与现有owner合并。 |
| `ce-compound-refresh` | 8 | `spec-compound-refresh` | 按 spec-first 边界改造后吸收 | validator/Python修复直接同步；不采用全局artifact root。 |
| `ce-debug` | 5 | `spec-debug` | 按 spec-first 边界改造后吸收 | cache资产直接删除；pipeline结构化return和tracker residual仅在授权owner下。 |
| `ce-doc-review` | 15 | `spec-doc-review` | 按 spec-first 边界改造后吸收 | cross-model pass可选；whole-doc/rendering floor吸收；不复制CE provider闭列表。 |
| `ce-dogfood` | 2 | `spec-dogfood` | 按 spec-first 边界改造后吸收 | 宿主调用/参数解析可移植化；固定report artifact和agent-browser边界不改。 |
| `ce-explain` | 10 | `spec-explain` | 按 spec-first 边界改造后吸收 | cache资产直接删除；activation/destination修复吸收。 |
| `ce-handoff` | 1 | existing artifact/session contracts | 明确不采纳 | 不创建generic Skill或`/tmp` canonical continuity；只复用freshness/limitations字段。 |
| `ce-ideate` | 12 | `spec-ideate` | 按 spec-first 边界改造后吸收 | cache资产直接删除；tracker capability-first和settled decisions吸收。 |
| `ce-optimize` | 8 | `spec-optimize` | 按 spec-first 边界改造后吸收 | cache资产直接删除；Python/scratch直接同步；固定`.spec-first/workflows`持久层。 |
| `ce-plan` | 19 | `spec-plan` | 按 spec-first 边界改造后吸收 | cache资产直接删除；settled decisions/ownership去重吸收；默认elevation不采纳。 |
| `ce-polish` | 1 | `spec-polish` | 直接同步 | 仅同步bundled path/flattened shell鲁棒性，不改变server/browser ownership。 |
| `ce-pov` | 15 | `spec-pov` | 按 spec-first 边界改造后吸收 | cache资产直接删除；panel/receipt可选；保留project-grounded decisive verdict。 |
| `ce-product-pulse` | 2 | `spec-product-pulse` | 按 spec-first 边界改造后吸收 | 参数解析可移植化；输出仍按当前signal/report owner，不全局迁root。 |
| `ce-proof` | 1 | `spec-proof` | 按 spec-first 边界改造后吸收 | Proof v3需官方/live contract Gate；未验证前不删除当前可用v2/local bridge。 |
| `ce-resolve-pr-feedback` | 8 | `spec-resolve-pr-feedback` | 直接同步 | payload streaming、index-0、多行Markdown和pending-review保护全部进入现有owner。 |
| `ce-retune` | 7 | `spec-write-skill`, `spec-optimize` | 等价能力已存在 | 不新增Skill；把baseline/A-A/noise-floor/cut/halt形状编入组合模式和eval。 |
| `ce-riffrec-feedback-analysis` | 5 | `spec-riffrec-feedback-analysis` | 直接同步 | Python/LF/path修复同步；与sweep analyzer保持byte parity或单一source策略。 |
| `ce-setup` | 3 | `spec-runtime-setup`, CLI config owners | 按 spec-first 边界改造后吸收 | 不复制CE YAML/product keys；吸收safe path、retired-key和preference diagnostics。 |
| `ce-simplify-code` | 3 | `spec-simplify-code` | 直接同步 | self-skip、scope和session pins同步；不扩大mutation范围。 |
| `ce-strategy` | 1 | `spec-strategy` | 直接同步 | 移除`$ARGUMENTS`依赖；保留STRATEGY.md唯一owner。 |
| `ce-sweep` | 6 | `spec-sweep` | 按 spec-first 边界改造后吸收 | Python/scratch/host invocation同步；不采用CE artifact root。 |
| `ce-test-browser` | 3 | `spec-test-browser`, `spec-lfg` | 按 spec-first 边界改造后吸收 | capability-first driver思想吸收；未满足exact-origin conformance的native driver不得放行。 |
| `ce-work` | 18 | `spec-work`, `spec-worktree`, run-artifact helpers | 按 spec-first 边界改造后吸收 | 吸收receipt/recovery/collision/transaction invariants；不复制central controller/provider routes。 |
| `lfg` | 3 | `spec-lfg` | 按 spec-first 边界改造后吸收 | 强化PR watch/settled decisions/engine binding receipt；`references/next-work-handoff.md` 因依赖被拒绝的generic `ce-handoff`而单文件不采纳；继续要求显式完整pipeline授权。 |

---

## Per-Skill Calibration: All 35 Canonical Skills

### S01. `spec-app-consistency-audit`

- **Current owner/duty:** App PRD、Figma和local source跨页面/架构/组件/埋点/i18n一致性审计，拥有run-scoped evidence、headless runner和writeback边界。
- **CE diff/verdict:** `无本次 diff 影响`。CE 29个Skill没有对应App assurance surface。
- **Planned change:** 不改`SKILL.md`、rules、scripts或schema；只在全量回归中确认新Python/LF/argument治理没有误扫其22个脚本和source locks。
- **优化后提升：** 保持 App consistency compiler 的专域边界，避免 CE review/runtime 抽象误入审计链；全量回归可提前发现全局脚本规则对 22 个现有 helper 的误伤。
- **Do not copy:** 不把review-scope、cross-model panel或可配置docs root引入该domain-specific compiler。
- **Verification/risk/priority:** 运行现有App consistency contracts和headless fixture；风险是全局script检查误报；P2 regression-only。

### S02. `spec-brainstorm`

- **Current owner/duty:** unresolved WHAT探索、requirements-only unified plan、decision surface、output rendering和handoff；已有dispatch authorization/fallback。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应`ce-brainstorm`16文件。
- **Gap:** 仍使用repo profile cache；`$ARGUMENTS`表述宿主化；缺session-settled decision contract；外部elevation没有独立egress/receipt activation gate。
- **Planned surfaces:** 删除cache script/reference/profiler route；`SKILL.md`改为fresh orientation；新增/对齐`settled-decisions.md`和handoff字段；将reasoning elevation写成optional capability，首波不落CE shell/runner，后续只有R10-R11证据满足才启用。
- **优化后提升：** 仓库判断始终对应当前 branch/worktree，减少缓存漂移；已确认的产品决定跨 brainstorm→plan 保真；未来模型提升即使失败也不会误报已提升或泄露未授权上下文。
- **Do not copy:** Claude CLI只读tool list、硬编码model配置、平台aggregator假设和默认外发。
- **Verification/risk/priority:** cache双worktree负例、settled decision replay、无授权零外部进程、授权失败inline fallback；P0 cache removal，P1 decision continuity，P2 elevation activation。

### S03. `spec-code-review`

- **Current owner/duty:** report-only默认、显式apply、risk-driven persona、lite/full、cross-model adversarial、structured findings、coverage/claim ceiling和dispatch gate。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应24文件，是本次最高ROI owner。
- **Gap:** repo cache和`$ARGUMENTS`；scope shell facts分散；finding dedupe/order主要靠prose；cross-model脚本缺统一detached lifecycle、actual-model receipt、large-result/failure recovery。
- **Planned surfaces:** 删除cache三件套；引入`review-scope`和`findings-mechanics`的spec-first实现及schemas；升级cross-model adapter；增加peer runner self-contained副本、receipt和focused eval；更新persona/subagent/finish-review references与contract tests。
- **优化后提升：** diff 范围和 lite 输入可复算，finding 去重/编号稳定，外部 peer 的实际模型与失败状态可追溯；直接降低漏审、重复 finding、假独立和不可恢复审查的概率。
- **Do not copy:** 脚本按path signal直接决定persona、provider闭列表驱动Skill、低置信度自动删除语义finding、外部CLI可见即视为授权。
- **Verification/risk/priority:** endpoint未知fail closed、mixed prose/code禁lite、schema/fingerprint/order、actual-model mismatch、timeout/reap、inline fallback claim ceiling；P0/P1第一试点。

### S04. `spec-commit`

- **Current owner/duty:** internal-only、caller已持有commit authorization时做scoped commit，不拥有push/PR。
- **CE diff/verdict:** `直接同步`，对应`ce-commit/SKILL.md`。
- **Planned surfaces:** 移除任何load-time/`$ARGUMENTS`假设，统一运行时解析caller payload；补quoted path和空参数contract。
- **优化后提升：** 同一 internal caller envelope 可在 Claude、Codex、Cursor、Kiro、OpenCode、Qoder 下解释一致，减少空参数、quoted path 和宿主预解析导致的误提交。
- **Do not copy:** CE branding、commit授权推导或user-facing入口。
- **Verification/risk/priority:** internal caller envelope、缺授权零commit、路径含空格；P1 portable invocation。

### S05. `spec-commit-push-pr`

- **Current owner/duty:** internal landing helper，持有独立commit/landing authorization后commit、push、create/update PR。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应2文件。
- **Gap:** 当前更偏剩余working-tree landing，branch scope reconciliation、PR template和PR watch handoff可更明确。
- **Planned surfaces:** `SKILL.md`增加branch-vs-base reconciliation和template/security disclosure；PR成功后在caller显式请求或LFG pipeline内交给内部watch contract；references更新description-writing；tests覆盖已有PR更新和无remote。
- **优化后提升：** PR 内容基于完整 branch 而非剩余 working tree，模板与安全披露更完整；获授权时能无缝进入 PR 尾部看护，减少“已开 PR 但未真正收敛”的交付空档。
- **Do not copy:** 默认branding、非维护者产品审批政策、无授权auto babysit。
- **Verification/risk/priority:** branch完整性、template preservation、watch handoff仅授权路径；P1。

### S06. `spec-compound`

- **Current owner/duty:** 把已解决问题或durable vocabulary写入`docs/solutions`/`CONCEPTS.md`，已有full/lightweight/headless、memory scan和grounding validation。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应13文件。
- **Gap:** repo cache；session-history脚本解释器/UTF-8和doc-claim模板误报；headless输出可更稳定。
- **Planned surfaces:** 删除cache三件套；直接同步三个extractor UTF-8、frontmatter/claim validator修复和Python resolver；复核schema/assets；保留headless不改instruction的现有边界并加structured result tests。
- **优化后提升：** knowledge promotion 使用当前源码证据且中文 session 在不同 locale 下稳定解析；代码示例不再触发 placeholder 假阳性，headless 结果更适合自动 consumer。
- **Do not copy:** 可配置docs root、把session transcript声明当outcome evidence、自动promote未验证知识。
- **Verification/risk/priority:** Chinese/non-UTF locale、fenced/inline`{{...}}`、headless无instruction mutation、fresh grounding；P0/P1。

### S07. `spec-compound-refresh`

- **Current owner/duty:** 审计和更新/替换/合并/删除`docs/solutions`知识，拥有scope、inbound link和授权式commit/landing。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应8文件。
- **Planned surfaces:** 同步两个validator、Python resolver和runtime argument表达；assets/schema与compound保持兼容；固定`docs/solutions`和`CONCEPTS.md` owner。
- **优化后提升：** compound/refresh 共用同一 validator 行为，降低知识更新与新建之间的 schema 漂移；错误示例与真实未填字段能被更准确地区分。
- **Do not copy:** 全局artifact root、绕过interactive/headless mutation authority。
- **Verification/risk/priority:** validator parity、claim code block负例、artifact discovery不漂移；P1。

### S08. `spec-debug`

- **Current owner/duty:** diagnosis/root-cause/fix/verification闭环，适用于错误、回归和失败测试。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应5文件。
- **Gap:** repo cache；作为外层pipeline consumer时缺稳定return；residual durable sink需遵守独立tracker授权。
- **Planned surfaces:** 删除cache三件套；增加`pipeline-mode.md`或等价reference，返回status/root_cause/evidence/fix/verification/residual；tracker只输出candidate或交给有授权owner。
- **优化后提升：** 外层 pipeline 可消费稳定的诊断结果而不是自然语言猜测；失败验证不会被包装成 root cause 已确认，未授权 residual 也不会被自动外发。
- **Do not copy:** 自动file ticket、把未验证猜测写成root cause、缓存repo profile。
- **Verification/risk/priority:** outer-caller replay、failed verification不可complete、residual无授权不外发；P1。

### S09. `spec-doc-review`

- **Current owner/duty:** requirements/plan/task/spec的角色化审查，standard/full roster、headless apply/report-only和producer closure。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应15文件。
- **Gap:** 当前无cross-model detached pass；whole-doc和rendering floor可更显式；用户已回答问题的撤回规则可加强。
- **Planned surfaces:** 增加whole-doc persona、rendering floor和cross-model review references；可选peer adapter/runner与receipt；bulk preview和open-question withdrawal；保持reviewer mutation authority与producer-owned closure。
- **优化后提升：** 整篇文档与局部 lens 同时受统一 rendering floor 约束，减少只修局部却破坏全局的遗漏；已回答问题会撤回，可选独立 peer 有可审计 receipt。
- **Do not copy:** 每次doc review默认外发、同provider伪独立、peer多数投票替代综合判断。
- **Verification/risk/priority:** report-only byte preservation、apply preview、resolved-question withdrawal、peer unavailable不伪独立；P1，晚于code-review runner pilot。

### S10. `spec-dogfood`

- **Current owner/duty:** diff-scoped autonomous browser QA，使用agent-browser、caller-ownedworktree和report artifact。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应2文件。
- **Planned surfaces:** runtime arguments/skill invocation改为host-neutral；report path保持固定contract；引用当前browser readiness和caller-owned server，不扩大driver。
- **优化后提升：** 跨宿主调用更稳定，同时不削弱 exact-origin、caller-owned server 和 report artifact 边界；收益集中在可移植性而非扩大浏览器自治。
- **Do not copy:** CE docs_root、host-native driver未满足exact-origin即放行、静默启动server。
- **Verification/risk/priority:** current browser contracts、report discovery、无能力honest degraded；P2。

### S11. `spec-explain`

- **Current owner/duty:** 面向学习的个性化diff/concept/idea/recent-work explainer，支持Markdown/HTML和check-in。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应10文件。
- **Gap:** repo cache；activation过宽风险、destination和machine identifier泄漏可进一步收紧。
- **Planned surfaces:** 删除cache三件套；fresh source/work recap；同步intake/destination/renderer限制；artifact失败保留可恢复本地路径。
- **优化后提升：** 普通状态问答不再被重型 explainer 误触发，正文减少内部 token/run id 泄漏；Markdown/HTML 交付失败时仍有可恢复 artifact 路径。
- **Do not copy:** 普通状态问答强制触发、内部token/run id进入正文、全局artifact root。
- **Verification/risk/priority:** activation negative cases、redaction、Markdown/HTML destination；P1。

### S12. `spec-ideate`

- **Current owner/duty:** grounded idea generation/evaluation，多轴探索、issue intelligence和handoff到brainstorm。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应12文件。
- **Gap:** repo cache；tracker探测仍需避免binary/env false negative；settled decisions和多区域连续性可加强。
- **Planned surfaces:** 删除cache三件套；tracker capability-first contract；settled decision pins；更新agents/rendering/post-workflow；保持dispatch authorization。
- **优化后提升：** idea grounding 不受旧 worktree cache 污染，tracker 能力按真实接口而非单一 binary 判断；settled decision 不被后续探索重新打开。
- **Do not copy:** 自动创建issue、把未加载MCP视为不存在、重复定义plan层决策。
- **Verification/risk/priority:** no-cache fresh orientation、tracker connector lazy discovery、decision continuity；P1。

### S13. `spec-lfg`

- **Current owner/duty:** 显式授权下从plan到implementation/review/commit/push/PR/CI green的完整shipping pipeline。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应`lfg`3文件和`ce-babysit-pr`3文件。
- **Gap:** 当前Step 9主要看CI，不能完整覆盖review comment、head变化、base currency和active-time预算；implementation engine receipt可更稳定。
- **Planned surfaces:** 新增`references/pr-watch-loop.md`、内部snapshot helper和watch receipt；更新admission以显式披露bounded PR-feedback修复和repo-policy branch update；扩展Step 9为review+CI+head+base currency；single writer lane、3-cycle策略改为active budget/terminal reasons；carry settled decisions和spec-work binding receipt。
- **优化后提升：** PR 不会因 CI 一次变绿就提前收口；review、head 与 base currency 的持续变化可被恢复式看护，减少人工等待和重复检查，同时保持不自动 merge。
- **Do not copy:** 自动merge、无限后台daemon、无wake能力却声称持续看护、workflow invocation扩大外部副作用授权，以及`references/next-work-handoff.md`对generic `ce-handoff`的依赖。
- **Verification/risk/priority:** PR fixture state transitions、green-but-stale、review-after-green、无remote local-only、resume generation；P1 shipping-tail主单元。

### S14. `spec-optimize`

- **Current owner/duty:** metric-driven baseline、measurement scaffolding、parallel experiments、checkpoints和stopping criteria。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应8文件，并承接`ce-retune`measurement面。
- **Gap:** repo cache；Python/scratch portability；缺显式A/A noise floor和model-upgrade corpus mode。
- **Planned surfaces:** 删除cache三件套；measure/parallel-probe Python resolver；private ephemeral scratch与`.spec-first/workflows` durable checkpoint分层；增加A/A/noise-floor/pre-registered threshold模式供spec-write-skill调用。
- **优化后提升：** 测量脚本跨 Python 环境更可靠，A/A 先量化噪声后再 A/B；模型升级调优结果可归因、可复现，避免把 harness 波动误当优化收益。
- **Do not copy:** 把静态prompt review称为retune成功、没有repeatable corpus仍跑A/B、CE docs_root。
- **Verification/risk/priority:** A/A variance fixture、broken-run taxonomy、resume、scratch symlink；P0 portability，P1 retune compose。

### S15. `spec-plan`

- **Current owner/duty:** implementation-ready/universal/answer-seeking计划，拥有Product/Planning Contract、implementation units、review和handoff。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应19文件。
- **Gap:** repo cache；`$ARGUMENTS`；settled decisions和跨层single-owner rule需强化；default外部elevation不符合当前授权边界。
- **Planned surfaces:** 删除cache三件套；host-neutral arguments；新增settled decisions reference；plan sections/deepening/handoff明确每条约束只在拥有层定义；reasoning elevation降为optional activation-gated，不在首波加脚本。
- **优化后提升：** 计划 grounding 始终新鲜，已定决策不会被重开，R/KTD/U 约束不再多层重复；可选 elevation 保持零默认外发和诚实 fallback。
- **Do not copy:** Claude CLI默认detached planning、固定model配置、provider实现进入plan contract。
- **Verification/risk/priority:** plan replay不重开settled decision、R/KTD/U去重、无授权零peer；P0 cache，P1 contract，P2 elevation。

### S16. `spec-polish`

- **Current owner/duty:** 启动caller-authorized dev server、浏览器检查和UI polish迭代。
- **CE diff/verdict:** `直接同步`，对应1文件。
- **Planned surfaces:** 修复bundled script path在多行shell被host压平时的解析；不改变launch/server/browser contract。
- **优化后提升：** 宿主压平多行 shell 或路径含空格时仍能找到 bundled helper，减少启动前的机械失败，不改变 server/browser 权限边界。
- **Do not copy:** 自动猜server或越过caller-owned lifecycle。
- **Verification/risk/priority:** flattened invocation fixture、path with spaces；P2。

### S17. `spec-pov`

- **Current owner/duty:** 对外部技术/方案/变化给project-grounded decisive verdict，已有grounding scouts和boundary。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应15文件。
- **Gap:** repo cache；用户给定approach-set识别和cross-model independent panel receipt不足。
- **Planned surfaces:** 删除cache三件套；扩展intake/method/schema；增加optional peer panel、runner和provider/model receipt；主流程综合而非投票。
- **优化后提升：** 用户给出的每个 approach 都会被逐项覆盖，peer 的 provider/model/独立性可核验；综合结论不再被多数投票或同 provider 伪独立左右。
- **Do not copy:** 未授权外发repo内容、同provider当独立、oracle panel默认开启、抽象排名遗漏用户approach。
- **Verification/risk/priority:** approach coverage、privacy/egress gate、same-provider independence negative、fallback；P1。

### S18. `spec-prd`

- **Current owner/duty:** brownfield PRD requirements与planning-readiness，拥有Decision Card、evidence和legal stop points。
- **CE diff/verdict:** `无本次 diff 影响`。CE区间没有PRD对应Skill。
- **Planned change:** 不做CE驱动重构；仅把全局`$ARGUMENTS`portable invocation机械迁移纳入U2，因为当前source仍含一次宿主化表述。
- **优化后提升：** PRD 在多宿主下获得一致的参数解析，降低空输入和 `$ARGUMENTS` 缓存语义导致的错误路由；不引入无关架构。
- **Do not copy:** model elevation、docs_root、repo cache或review controller。
- **Verification/risk/priority:** existing PRD contract/reset/eval；P1 portable invocation only。

### S19. `spec-product-pulse`

- **Current owner/duty:** 从配置signals生成time-windowed product pulse report。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应2文件。
- **Planned surfaces:** runtime argument解析host-neutral；report template保留当前source/config和输出owner；如果需要alternative output，只在该Skill显式配置并不改变全局docs contract。
- **优化后提升：** signal 配置与输出路径在不同宿主下解析一致，空数据和 alternative output 更可预测；固定 report owner 防止全局 artifact 分裂。
- **Do not copy:** CE docs_root全局语义、未配置signal的推测性报告。
- **Verification/risk/priority:** output path/config precedence和empty signal；P2。

### S20. `spec-promote`

- **Current owner/duty:** 为已shipping feature起草launch/promotion copy。
- **CE diff/verdict:** `无本次 diff 影响`。
- **Planned change:** 不改Skill；仅全量lint/projection回归。
- **优化后提升：** 通过回归锁定 promotion 入口不受本次全局脚本/路由调整影响，避免无 CE 证据的改造成本与行为漂移。
- **Do not copy:** PR watch、Proof或product-pulse配置。
- **Verification/risk/priority:** existing entrypoint lint；P2 regression-only。

### S21. `spec-proof`

- **Current owner/duty:** 通过Proof editor创建、分享、读取、评论、suggest/edit并pull回local，当前同时含Web API和local bridge。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应1个重大协议文件。
- **Gap:** CE已迁Hosted Proof v3、accessToken/ownerSecret、claim lifecycle和idempotency；当前source仍是v2/ops/local bridge混合。
- **Planned surfaces:** 先做official/live Gate确认endpoint、token、revision、ownerless claim和删除语义；通过后重写`SKILL.md`和tests，保留migration note和安全存储；未通过则只记录degraded，不删当前可用路径。
- **优化后提升：** 在官方 v3 contract 通过 Gate 后，token 权限分离、revision 冲突和幂等编辑会更安全；若 Gate 不通过则保留现有可用路径，避免迁移性中断。
- **Do not copy:** 未验证endpoint、secret示例、ownerSecret日常使用、失效secret重试。
- **Verification/risk/priority:** mocked contract + approved live non-sensitive document journey、token redaction、idempotency和revision conflict；P1但受外部Gate阻塞。

### S22. `spec-resolve-pr-feedback`

- **Current owner/duty:** 解析PR comments/threads，评价有效性并在授权范围内修复和resolve。
- **CE diff/verdict:** `直接同步`，对应8文件。
- **Planned surfaces:** 三个脚本同步stream-to-file、index-0、多行JSON/Markdown和pending review保护；references明确targeted/full和thread identity；Skill只消费结构化结果。
- **优化后提升：** 大 PR 评论集不会因 shell 变量上限损坏，首条 comment 可正确定位，多行回复保持真实 Markdown，pending review 不再制造“API 成功但 reviewer 不可见”的假完成。
- **Do not copy:** shell变量承载大payload、字面`\n`回复、未提交review回复、自动resolve未验证fix。
- **Verification/risk/priority:** 大GraphQL fixture、首元素comment、多行/quote、pending review和network failure；P0脚本可靠性。

### S23. `spec-riffrec-feedback-analysis`

- **Current owner/duty:** 分析Riffrec bundle/录音视频并生成结构化反馈。
- **CE diff/verdict:** `直接同步`，对应5文件。
- **Planned surfaces:** analyzer LF/Python/path修复；与sweep的同名analyzer决定保持Skill-local byte parity并加测试，避免runtime跨Skill依赖。
- **优化后提升：** Riffrec analyzer 在 Windows/LF/Python 差异下更稳定，两份 Skill-local 副本有 parity 保障，减少反馈摄取入口的环境型失败。
- **Do not copy:** 全局artifact root或不同副本无parity漂移。
- **Verification/risk/priority:** Windows newline、zip safety、python resolver、parity；P1。

### S24. `spec-rule-miner`

- **Current owner/duty:** 从真实code evidence挖现有编码约定并生成/刷新项目rules。
- **CE diff/verdict:** `无本次 diff 影响`。
- **Planned change:** 不改语义；全量host invocation扫描确认没有`$ARGUMENTS`或docs_root回归。
- **优化后提升：** 保持 rule mining 只依赖真实 code evidence，避免 repo cache、retune 或 review runtime 污染其简单职责；回归确保全局迁移不破坏入口。
- **Do not copy:** CE repo profiler cache或model retune。
- **Verification/risk/priority:** existing standalone contracts；P2 regression-only。

### S25. `spec-runtime-setup`

- **Current owner/duty:** 多宿主required harness runtime的install/configure/verify/refresh，拥有registry、facts、host authority和degraded status。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应`ce-setup`3文件与19个CLI/安装文件中的安全主题。
- **Gap:** CE的safe artifact path/retired keys/model preference diagnostics可借鉴；当前OpenCode工作正在扩展平台矩阵，必须避免覆盖。
- **Planned surfaces:** 在现有Node registry/config helpers中增加unsafe path、retired-key和dormant preference facts；Python resolver作为dependency probe复用；OpenCode command/frontmatter/loader只patch current owner；不复制CE YAML parser/check-health。
- **优化后提升：** 配置错误、退役键、symlink 逃逸和 dormant preference 会得到明确 facts/reason code；多宿主安装更安全，诊断更可操作且不复制 CE 产品配置。
- **Do not copy:** `docs_root`、CE model key闭列表、CLI-local plugin switch、adapter持有session dispatch。
- **Verification/risk/priority:** symlink/absolute/`..`/repo root/`.git`负例、retired key、current platform matrix；P1，依赖OpenCode owner baseline。

### S26. `spec-simplify-code`

- **Current owner/duty:** 在授权scope内保持行为地简化recent changes，运行必要检查并self-skip低价值改动。
- **CE diff/verdict:** `直接同步`，对应3文件。
- **Planned surfaces:** 明确necessity scan不越scope、无价值自动skip、pipeline task visibility和`session-settled` pins；同步两个persona。
- **优化后提升：** 先判断是否有真实简化价值，减少纯风格 churn；重复代码只在证据支持时抽象或消除，且不会越过用户授权 scope。
- **Do not copy:** 未授权文件作为重复依据、纯风格churn、把settled decision重开。
- **Verification/risk/priority:** out-of-scope duplicate negative、no-op、pipeline pins；P1。

### S27. `spec-strategy`

- **Current owner/duty:** 创建/更新`STRATEGY.md`并为ideate/brainstorm/plan提供上游产品grounding。
- **CE diff/verdict:** `直接同步`，对应1文件。
- **Planned surfaces:** 移除`$ARGUMENTS`宿主依赖，运行时读取实际invocation arguments；保留唯一文件owner。
- **优化后提升：** STRATEGY.md 在各宿主读取相同 invocation arguments，减少空参数或 Claude 专用占位符导致的错误写入，同时维持唯一战略 owner。
- **Do not copy:** artifact root、model elevation或自动landing。
- **Verification/risk/priority:** quoted arguments和empty input；P1。

### S28. `spec-sweep`

- **Current owner/duty:** 从配置feedback sources摄取、acknowledge、分析recording、验证fix并产出LFG-ready plan。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应6文件。
- **Planned surfaces:** host-neutral invocation、private scratch、Python resolver、analyzer parity、sweep-state兼容；artifact继续由现有plan/report owner决定。
- **优化后提升：** 定时/headless sweep 的 Python、scratch 和状态恢复更可靠；缺少某个 binary 不再被误判为 source 不存在，降低反馈漏摄取。
- **Do not copy:** CE docs_root、缺少binary即断言source unavailable、无授权source ack。
- **Verification/risk/priority:** scheduled headless、scratch security、analyzer、state resume；P1。

### S29. `spec-test-browser`

- **Current owner/duty:** 对当前PR/branch受影响页面运行browser verification；当前正由exact-origin readiness和caller-owned server contract治理。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应3文件。
- **Gap:** driver选择可以capability-first，但现有安全gate要求exact-origin conformance，不能以native driver存在取代。
- **Planned surfaces:** 增加driver capability interface和fresh-inspected locator规则；只有driver能提供同等exact-origin、action evidence和cleanup contract才可成为candidate；pipeline失败收集证据但不能假成功。
- **优化后提升：** driver 可按当前 capability 扩展，但只有满足 exact-origin、fresh locator、action evidence 和 cleanup 合同才放行；兼顾可用性与 UI 验证可信度。
- **Do not copy:** native-first无conformance放行、selector猜测、陈旧locator、server autonomy。
- **Verification/risk/priority:** current exact-origin suites、stale locator、driver unavailable/fallback、zero action on blocked；P1，必须patch current dirty source。

### S30. `spec-test-xcode`

- **Current owner/duty:** 使用XcodeBuildMCP构建和测试iOS simulator。
- **CE diff/verdict:** `无本次 diff 影响`。
- **Planned change:** 不因CE browser或work engine改动而抽象成通用test provider；只做entrypoint/projection回归。
- **优化后提升：** 保持 iOS simulator workflow 的专用 XcodeBuildMCP 契约，避免被 browser/work engine 泛化稀释；全量回归确认入口和投射不受影响。
- **Do not copy:** cross-model work controller或browser driver contract。
- **Verification/risk/priority:** existing skill lint；P2 regression-only。

### S31. `spec-work`

- **Current owner/duty:** 执行settled plan/task/concrete request，拥有input triage、execution strategy、verification、return-to-caller和closeout evidence。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，对应18文件，是最大架构裁决面。
- **Gap:** current run artifact/recovery已存在，但unit-level interrupted job、collision和actual-engine receipt可加强；`$ARGUMENTS`需portable。
- **Planned surfaces:** 扩展existing execution-strategy/run-artifact schemas，记录requested/actual engine/capability、unit state、before/after、collision、verification、recovery blocker；复用spec-worktree；必要helper写CommonJS并由CLI/internal owner消费。
- **优化后提升：** 中断 unit 可恢复，requested/actual engine 与未知结果被诚实记录，路径/共享契约碰撞能在集成前发现，验证失败可回滚而不形成第二套执行 runtime。
- **Do not copy:** `cross-model-work.sh` provider闭列表、六模块central controller、自动route切换、controller-ownedcommit、clean merge=兼容性、Skill绕过host-native primitive。
- **Verification/risk/priority:** resume after crash、path/shared-contract collision、unknown engine claim、verification rollback、return envelope；P1，晚于U1/U2基础。

### S32. `spec-worktree`

- **Current owner/duty:** caller-owned git worktree isolation，当前受治理caller为dogfood，新增caller必须定义forward/intake contract。
- **CE diff/verdict:** `按 spec-first 边界改造后吸收`，来自`ce-work`unit workspace不变量。
- **Planned surfaces:** 增加`spec-work`caller contract前置，记录unit/worktree owner、base/head、path collision和cleanup authority；保持helper内部、非用户入口。
- **优化后提升：** spec-work 获得可审计的 unit 隔离、owner 和 cleanup authority，parallel worktree 的路径碰撞与脏状态更早暴露；helper 仍不接管 wave/engine/commit 决策。
- **Do not copy:** 自己决定wave/engine/commit/integration、共享runtime daemon、未授权清理。
- **Verification/risk/priority:** existing/isolate-ref/new-work、owner mismatch、dirty cleanup、parallel collision；P1依赖spec-work schema。

### S33. `spec-write-skill`

- **Current owner/duty:** 创建、修改、迁移或只读验证项目拥有Skill package，拥有promotion evidence、eval和source/runtime边界。
- **CE diff/verdict:** `等价能力已存在`并吸收`ce-retune`语料owner。
- **Gap:** 缺显式model-upgrade retune mode和与spec-optimize的corpus/harness handoff。
- **Planned surfaces:** 增加retune admission：run archive、switchable corpus build、repeatable tasks、baseline manifest；生成候选变更后调用spec-optimize measurement contract；promotion仍需fresh-source/eval/consumer evidence。
- **优化后提升：** 模型升级后的 Skill 调优从“静态感觉更好”变为有 corpus、noise floor、A/B 和 promotion evidence 的闭环；测量条件不足时会明确拒绝虚假 retune claim。
- **Do not copy:** 静态审计伪装retune、无A/A就A/B、直接改generated Skill、把模型升级结果提升为通用事实。
- **Verification/risk/priority:** no-harness refusal、A/A handoff、broken run、minimal-owner cut、promotion gate；P1。

### S34. `spec-write-tasks`

- **Current owner/duty:** 从settled local plan编译optional derived task pack，plan保持single source of truth。
- **CE diff/verdict:** `无本次 diff 影响`。
- **Planned change:** 不引入CE work controller或重复settled decisions；只确认spec-work新增unit receipt仍以source_plan/U-ID为owner。
- **优化后提升：** task pack 继续只做 plan 的派生产物，新增 unit receipt 仍回链 source_plan/U-ID；避免把任务包演化成第二个执行状态数据库。
- **Do not copy:** task pack变成执行状态数据库、plan决策复制到每个task。
- **Verification/risk/priority:** existing task-pack source hash/consumer tests；P2 regression-only。

### S35. `using-spec-first`

- **Current owner/duty:** public workflow front controller， substantial work前选择一个入口，避免并行workflow和runtime mirror edits。
- **CE diff/verdict:** `无本次 diff 影响`。
- **Planned change:** 不新增`babysit`/`handoff`/`retune` public route；retune通过write-skill/optimize组合，PR watch留在LFG内部。若未来activation gate通过，再单独更新路由。
- **优化后提升：** 新增 CE 能力被组合进既有 owner，而不是膨胀公开入口；用户路由更简单，Front Controller 不感知 provider，也不演化为中央状态机。
- **Do not copy:** 把CE新增Skill数量直接转为spec-first入口数量、中央状态机或provider-aware routing。
- **Verification/risk/priority:** routing negative cases、35-skill inventory和entrypoint lint；P1 governance guard。

### Per-Skill Dependency Matrix

| ID | Skill | Implementation dependencies |
| --- | --- | --- |
| S01 | `spec-app-consistency-audit` | U10 regression matrix only。 |
| S02 | `spec-brainstorm` | U1 fresh grounding、U2 invocation；future elevation依赖U3 receipt/runner evidence和独立activation gate。 |
| S03 | `spec-code-review` | U1、U2后进入U3 pilot。 |
| S04 | `spec-commit` | U2 portable invocation，随U6交付。 |
| S05 | `spec-commit-push-pr` | U5 PR-tail contract和updated LFG admission。 |
| S06 | `spec-compound` | U1 cache removal、U2 Python/UTF-8，随U6交付。 |
| S07 | `spec-compound-refresh` | U2 validator/runtime portability，随U6交付。 |
| S08 | `spec-debug` | U1 grounding；U5消费前先由U6提供pipeline return。 |
| S09 | `spec-doc-review` | U3 runner pilot通过后进入U4。 |
| S10 | `spec-dogfood` | U2 invocation，随U6；browser contract保持现行owner。 |
| S11 | `spec-explain` | U1 grounding，随U6 activation/destination修复。 |
| S12 | `spec-ideate` | U1 grounding，U4 settled-decision contract。 |
| S13 | `spec-lfg` | U3 receipt vocabulary、U5 watch state和downstream pipeline returns。 |
| S14 | `spec-optimize` | U1、U2基础；U8 retune composition。 |
| S15 | `spec-plan` | U1、U2基础；U4 settled decisions；elevation保持deferred。 |
| S16 | `spec-polish` | U2 path portability，随U6。 |
| S17 | `spec-pov` | U1 grounding和U3 runner pilot后进入U4。 |
| S18 | `spec-prd` | U2 portable invocation only。 |
| S19 | `spec-product-pulse` | U2 invocation，随U6。 |
| S20 | `spec-promote` | U10 regression matrix only。 |
| S21 | `spec-proof` | U7 external contract/live gates。 |
| S22 | `spec-resolve-pr-feedback` | U2 scratch/argument floor，随U6；U5消费其pipeline return。 |
| S23 | `spec-riffrec-feedback-analysis` | U2 Python/LF，随U6。 |
| S24 | `spec-rule-miner` | U10 regression matrix only。 |
| S25 | `spec-runtime-setup` | U2 Python facts、U9 CLI safety；OpenCode子面等待current implementation baseline。 |
| S26 | `spec-simplify-code` | U6；不依赖peer runtime。 |
| S27 | `spec-strategy` | U2 portable invocation，随U6。 |
| S28 | `spec-sweep` | U2 Python/scratch，随U6。 |
| S29 | `spec-test-browser` | 当前exact-origin方案/实现为前置，U9只在current source上patch driver interface。 |
| S30 | `spec-test-xcode` | U10 regression matrix only。 |
| S31 | `spec-work` | U2、U3 receipt vocabulary后进入U5。 |
| S32 | `spec-worktree` | U5新增spec-work caller contract。 |
| S33 | `spec-write-skill` | U8，与spec-optimize共同交付。 |
| S34 | `spec-write-tasks` | U5 consumer compatibility和U10 regression。 |
| S35 | `using-spec-first` | U10 inventory/routing regression；不新增route。 |

---

## Script Calibration Ledger: All 47 Upstream Script Files

本节逐文件覆盖上游`skills/*/scripts/**`和根级`scripts/**`。`Target shape`描述spec-first实现，不表示复制同名文件。任何“吸收”项都必须重新应用当前角色契约、授权和source/runtime边界。

### A. Repo Profile Cache Removal (9 deleted upstream files)

| Upstream script | Verdict | Spec-first action / owner | Required tests |
| --- | --- | --- | --- |
| `skills/ce-brainstorm/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-brainstorm`同名脚本、cache reference和repo-profiler route；fresh orientation留在本run。 | branch/worktree隔离、无cache path、current HEAD/source refs。 |
| `skills/ce-code-review/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-code-review`三件套；scope/profile由当前diff和direct source生成。 | 两worktree不同stack/HEAD不串线；review仍有orientation。 |
| `skills/ce-compound/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-compound`三件套；full/headless均fresh derive。 | headless/full无cache I/O；knowledge claim仍grounded。 |
| `skills/ce-debug/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-debug`三件套；triage直接读当前repo。 | branch切换后root-cause evidence不复用旧profile。 |
| `skills/ce-explain/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-explain`三件套；work recap/source scout直接取证。 | recent-work和指定diff使用当前source identity。 |
| `skills/ce-ideate/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-ideate`三件套；axis dossier为run-local。 | multiple axis共享本run dossier但不跨run持久。 |
| `skills/ce-optimize/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-optimize`三件套；baseline记录当前repo identity。 | resume校验identity，变化时重新baseline或阻断。 |
| `skills/ce-plan/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-plan`三件套和cache-specific eval；research直接读当前tree。 | cache-miss fixture替换为fresh-grounding fixture。 |
| `skills/ce-pov/scripts/repo-profile-cache.py` | 直接同步 | 删除`spec-pov`三件套；grounding scout直接读取当前project。 | verdict绑定当前HEAD/refs，旧run不复用。 |

同时删除`tests/unit/repo-profile-cache-parity.test.js`，并用`fresh-repo-orientation-contracts`聚焦测试替代。替代测试验证“每个consumer都仍有fresh grounding path”，而不是只验证文件不存在。

### B. Detached Peer and Model Elevation (11 added/modified files)

| Upstream script | Verdict | Target shape / owner | Required tests |
| --- | --- | --- | --- |
| `skills/ce-brainstorm/scripts/elevation-dispatch.sh` | 明确不采纳（首波） | 不复制；`spec-brainstorm`只新增activation contract。待有真实授权+egress+provider journey后再实现provider-neutral adapter。 | 无授权/无capability时零外部进程；fallback不声称elevation。 |
| `skills/ce-brainstorm/scripts/peer-job-runner.py` | 明确不采纳（首波） | 无active script consumer前不复制1845行runner。 | activation gate未满足时inventory中不存在orphan runner。 |
| `skills/ce-plan/scripts/elevation-dispatch.sh` | 明确不采纳（首波） | 不复制；`spec-plan`只保留activation-gated optional elevation contract，计划质量先由当前模型、doc review和existing host-native workers保障。 | 指定model但未授权时明确not-run，不静默route。 |
| `skills/ce-plan/scripts/peer-job-runner.py` | 明确不采纳（首波） | 无active `spec-plan`外部peer consumer前不复制runner，不为未来能力预埋未消费runtime。 | orphan asset negative contract。 |
| `skills/ce-code-review/scripts/peer-job-runner.py` | 按 spec-first 边界改造后吸收 | 在`spec-code-review/scripts/`落self-contained runner；与doc-review/POV副本byte-identical，parity test固定。 | start/status/wait/result/reap、SIGHUP/Windows、timeout、stale、size cap、ownership。 |
| `skills/ce-doc-review/scripts/peer-job-runner.py` | 按 spec-first 边界改造后吸收 | 同一runner contract的Skill-local副本；只由doc-review adapter调用。 | parity、no-symlink private dir、result hash、reap。 |
| `skills/ce-pov/scripts/peer-job-runner.py` | 按 spec-first 边界改造后吸收 | 同一runner contract的Skill-local副本；只由POV panel调用。 | parity、requested/actual receipt、provider failure isolation。 |
| `skills/ce-work/scripts/peer-job-runner.py` | 按边界吸收不复制 | lifecycle不变量进入existing work run artifact/host primitive；不新增外部peer runner。 | interrupted host worker恢复和unknown outcome claim ceiling。 |
| `skills/ce-code-review/scripts/cross-model-adversarial-review.sh` | 按 spec-first 边界改造后吸收 | 升级现有同名脚本：provider adapter、allowlist、receipt、large result recovery、detached runner。 | empty diff skip、JSON recovery、auth failure、actual model mismatch、fallback。 |
| `skills/ce-doc-review/scripts/cross-model-doc-review.sh` | 按 spec-first 边界改造后吸收 | 新增Skill-local adapter，消费doc schema/lens和通用receipt，不硬编码Workflow contract。 | persona isolation、schema invalid、partial peers、report-only byte preservation。 |
| `skills/ce-pov/scripts/cross-model-pov.sh` | 按 spec-first 边界改造后吸收 | 新增Skill-local adapter，独立意见保留后由POV综合。 | approach coverage、same-provider independence、egress redaction、timeout。 |

Runner复制策略的裁决是：**保持Skill package自包含的三份副本，并用byte-parity+single contract test治理；不建共享runtime library。** 原因是host安装常以单Skill目录为发布单元，跨Skill import会让独立安装、路径解析和generated projection脆弱。三份而非六份，是因为plan/brainstorm首波不激活外部elevation，work继续使用host-native execution。

### C. Code Review Mechanical Floor (2 added files)

| Upstream script | Verdict | Target shape / owner | Required tests |
| --- | --- | --- | --- |
| `skills/ce-code-review/scripts/review-scope.py` | 按 spec-first 边界改造后吸收 | 新增deterministic scope helper；输出endpoint/files/exec lines/uncounted/path signals和fact confidence，不输出persona选择或review verdict。 | local/pr/task modes、merge-base failure、mixed files、rename/binary、unknown fail closed。 |
| `skills/ce-code-review/scripts/findings-mechanics.py` | 按 spec-first 边界改造后吸收 | 新增schema/fingerprint/contributor/order helper；只做exact/mechanical merge candidate，semantic equivalence和severity由LLM。 | malformed schema、exact duplicate、stable order、missing first evidence、no semantic fuzzy merge。 |

### D. CE Work Controller Modules (7 added files; Work peer runner is classified in section B)

| Upstream script | Verdict | Target shape / owner | Required tests |
| --- | --- | --- | --- |
| `skills/ce-work/scripts/cross-model-work.sh` | 按边界吸收不复制 | requested/actual engine和egress receipt字段进入`spec-work`execution strategy；provider route由host runtime拥有。 | provider names不进入canonical contract；unknown engine不claim。 |
| `skills/ce-work/scripts/unit-workspace.py` | 按边界吸收不复制 | CLI入口能力拆入现有`spec-work`/`spec-worktree`/internal helpers，不新增central controller。 | current helper ownership和no duplicate engine。 |
| `skills/ce-work/scripts/unit_workspace_state.py` | 按边界吸收不复制 | unit/run identity、authorization和checkpoint字段扩展existing run artifact。 | stale plan/repo/binding、authorization ref和resume。 |
| `skills/ce-work/scripts/unit_workspace_jobs.py` | 按边界吸收不复制 | job binding/terminal/result facts由host dispatch outcome和run artifact记录。 | accepted/failed/timeout/unknown outcome；no self-route-switch。 |
| `skills/ce-work/scripts/unit_workspace_integration.py` | 按边界吸收不复制 | path/shared-contract collision和integration lock不变量进入spec-worktree/internal helper。 | same path、shared schema、semantic contention需要LLM确认。 |
| `skills/ce-work/scripts/unit_workspace_transaction.py` | 按边界吸收不复制 | before/after fingerprint、verification、rollback/recovery进入existing verification/run-artifact owner。 | failed verify rollback、ignored artifacts、fingerprint freshness。 |
| `skills/ce-work/scripts/unit_workspace_lifecycle.py` | 按边界吸收不复制 | status/resume/fallback/cleanup reason codes扩展existing closeout。 | owner mismatch、stale run、cleanup authorization、recovery blocker。 |

### E. PR Watch (1 added file)

| Upstream script | Verdict | Target shape / owner | Required tests |
| --- | --- | --- | --- |
| `skills/ce-babysit-pr/scripts/pr-snapshot` | 按 spec-first 边界改造后吸收 | 以CommonJS实现`skills/spec-lfg/scripts/pr-watch-state.cjs`或等价helper；采集PR/head/base/reviews/CI/mergeability/chain和active budget，只产facts/state。 | snapshot/watch/mark、generation lock、manual chain、green-stale、review lifecycle、CI trajectory。 |

不直接复制上游大型无扩展名脚本；spec-first实现只覆盖当前LFG consumer和GitHub路径，其他forge/managed stack能力按真实需求后续扩展。

### F. Compound and Refresh Validators (8 modified files)

| Upstream script | Verdict | Spec-first action / owner | Required tests |
| --- | --- | --- | --- |
| `skills/ce-compound/scripts/session-history/extract-errors.py` | 直接同步 | 同名spec脚本显式UTF-8，接入Python resolver调用约定。 | `LC_ALL=C`下中文session。 |
| `skills/ce-compound/scripts/session-history/extract-metadata.py` | 直接同步 | 同名spec脚本显式UTF-8，并由调用方按统一Python resolver约定执行。 | invalid UTF-8/empty input有明确失败。 |
| `skills/ce-compound/scripts/session-history/extract-skeleton.py` | 直接同步 | 同名spec脚本显式UTF-8，保留skeleton抽取和换行语义，并由调用方按统一Python resolver约定执行。 | large input和newline preservation。 |
| `skills/ce-compound/scripts/validate-doc-claims.py` | 直接同步 | 跳过fenced/inline code中的`{{...}}`模板样例。 | prose placeholder仍失败，code sample通过。 |
| `skills/ce-compound/scripts/validate-frontmatter.py` | 直接同步 | UTF-8/path/Python resolver，保持schema判断。 | Chinese frontmatter、quoted scalar、missing field。 |
| `skills/ce-compound-refresh/scripts/validate-doc-claims.py` | 直接同步 | 与compound副本保持byte parity。 | parity+same fixtures。 |
| `skills/ce-compound-refresh/scripts/validate-frontmatter.py` | 直接同步 | 与compound副本保持byte parity。 | parity+same fixtures。 |
| `skills/ce-setup/scripts/check-health` | 等价能力已存在/按边界扩展 | 不复制shell/YAML parser；把安全path、retired key、preference diagnostic加入Runtime Setup Node owners。 | registry/config consumer tests和human output。 |

### G. Optimization, Feedback, Riffrec and Sweep (9 modified files)

| Upstream script | Verdict | Spec-first action / owner | Required tests |
| --- | --- | --- | --- |
| `skills/ce-optimize/scripts/measure.sh` | 直接同步 | 使用统一Python resolver，安全引用路径/args。 | python3/python/py/stub、spaces、exit propagation。 |
| `skills/ce-optimize/scripts/parallel-probe.sh` | 直接同步 | 使用统一Python resolver和安全参数引用，保持只测runtime facts并传播partial launch/cleanup结果。 | no runtime、partial launch、cleanup。 |
| `skills/ce-resolve-pr-feedback/scripts/get-pr-comments` | 直接同步 | GraphQL stdout流式写private temp file，结果结构化输出。 | large payload、API error、temp cleanup。 |
| `skills/ce-resolve-pr-feedback/scripts/get-thread-for-comment` | 直接同步 | 修复index 0和thread lookup/error。 | first element、missing、multiple candidate。 |
| `skills/ce-resolve-pr-feedback/scripts/reply-to-pr-thread` | 直接同步 | body file/JSON确保真实多行Markdown；拒绝pending review。 | multiline、quotes/backticks、pending review。 |
| `skills/ce-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py` | 直接同步 | LF/Python/path兼容和安全保持。 | existing zip traversal/size tests + newline。 |
| `skills/ce-sweep/scripts/analyze_riffrec_zip.py` | 直接同步 | 与riffrec副本byte parity或同一同步script维护。 | parity和same analyzer fixtures。 |
| `skills/ce-sweep/scripts/sweep-state.py` | 直接同步 | 小型状态兼容修复、UTF-8/atomic write/private scratch。 | resume、corrupt state、symlink、atomic replace。 |
| `scripts/codex-dev.ts` | 明确不采纳 | 不新增spec-first产品脚本；现有本地源码安装、npm和init拥有开发路径。 | package scripts中不出现orphan `codex:dev`。 |

### Script-Wide Contracts

- 每个新增/修改的`.sh`、`.py`、无扩展名脚本都进入`.gitattributes` LF规则和packaged-file tests。
- Python resolver由每个实际shell/caller内的小型本地函数实现，行为由`tests/unit/python-runtime-resolution-contracts.test.js`及共享fixtures统一验证；不引入需要先有Python才能解析Python的循环依赖，也不跨Skill import。
- Private scratch由实际owner各自实现，统一检查effective user ownership、ancestor/leaf symlink、mode和atomic rename；共享安全fixtures，不共享runtime service；raw provider output不得写进repo artifacts。
- Shell脚本必须保留真实exit code和stderr evidence，禁止以空JSON或“无finding”吞掉adapter crash。
- Scripts不得决定“是否采用技术”“finding是否有效”“计划是否充分”“root cause是否成立”。

---

## CLI, Converter and Installation Ledger: 19 Files

| Upstream file | Verdict | Spec-first owner / action | Key verification |
| --- | --- | --- | --- |
| `.opencode/plugins/compound-engineering.js` | 按 spec-first 边界改造后吸收 | 当前`src/cli/adapters/opencode.js`、plugin manifest/init owner实现frontmatter-only command discovery、non-overwrite和collision facts。 | 正文YAML不伪造frontmatter；same-name collision warning；existing command不覆盖。 |
| `src/commands/convert.ts` | 等价能力已存在/补差距 | 对应plugin-sync/init conversion；确保不写legacy Claude compatibility tool map。 | absent AGENTS不创建；managed block-only可删除。 |
| `src/commands/install.ts` | 等价能力已存在/补差距 | 对应init/lifecycle；legacy managed block cleanup和ownership。 | unrelated content保留、idempotent install。 |
| `src/converters/claude-to-copilot.ts` | 按边界吸收 | 在当前content transform owner使用统一slash-command/path判别。 | `/command`与`/etc/hosts`、`/tmp/x`、Windows path。 |
| `src/converters/claude-to-droid.ts` | 按边界吸收 | 在当前content transform owner复用统一slash-command/path判别；tool inference改word boundary，`AskUserQuestion`映射按当前host contract。 | substring不误命中、tool name mapping。 |
| `src/converters/claude-to-kiro.ts` | 按边界吸收 | 复用统一reserved-root/path判别，避免absolute path改写。 | POSIX/Windows absolute paths。 |
| `src/converters/claude-to-pi.ts` | 按边界吸收 | 复用统一slash-command/path判别。 | command vs path matrix。 |
| `src/dev/codex-dev.ts` | 明确不采纳 | 不创建对应dev runtime。 | package/build inventory无orphan。 |
| `src/release/metadata.ts` | 等价能力已存在/无语义迁移 | 只在新增canonical Skill/asset真实发布时更新当前manifest owner；不复制CE metadata shape。 | build manifest和skill count。 |
| `src/targets/codex.ts` | 按边界吸收 | 当前Codex adapter/init owner采用managed ancestor containment和legacy cleanup。 | ancestor symlink escape整块skip且不claim ownership。 |
| `src/targets/managed-artifacts.ts` | 直接同步不变量 | 扩展当前target-repo/managed removal helpers，统一realpath containment和nearest-existing ancestor。 | missing descendants、ancestor symlink、TOCTOU recheck。 |
| `src/targets/opencode.ts` | 按边界吸收 | patch current OpenCode adapter/current plan，不覆盖dirty source。 | six/current-host lifecycle、collision、ownership。 |
| `src/targets/pi.ts` | 按边界吸收 | 当前platform adapter若存在则复用containment；若非supported platform不为CE parity新增。 | `getSupportedPlatforms()` scoped test。 |
| `src/utils/codex-agents.ts` | 等价能力已存在/补差距 | current instruction/bootstrap owner只清理historical managed block。 | no file creation on absence、preserve user prose。 |
| `src/utils/codex-content.ts` | 按边界吸收 | current transform owner接入host-neutral invocation和path classification。 | runtime source rewrite parity。 |
| `src/utils/frontmatter.ts` | 直接同步不变量 | 当前frontmatter serializer对null/bool/number/date-like scalar强制JSON quote；parser和serializer round-trip。 | YAML type matrix、Unicode、colon/hash、multiline rejection。 |
| `src/utils/legacy-cleanup.ts` | 按边界吸收 | currentmanaged-removal registry增加真正retired assets；no-follow containment。 | user fork/ancestor symlink/unknown manifest不删除。 |
| `src/utils/slash-command.ts` | 按边界吸收 | 若当前没有统一owner，新增CommonJS helper under`src/cli/helpers/`; converters/adapters共用。 | reserved roots、relative/absolute/URL、quoted invocation。 |

说明：本表列出18个`.opencode/**`/`src/**`文件；CLI、转换与安装Runtime的第19个文件是上一节已逐项裁决的根级Codex开发脚本。CE文件名来自TypeScript插件结构，spec-first是Node.js CommonJS CLI；实施必须映射到当前模块，而不是创建平行`src/targets`/`src/converters`目录。Pi/Copilot/Droid只有在当前`getSupportedPlatforms()`或实际converter consumer存在时才进入修改范围；否则记录“无当前consumer”，不因上游文件存在扩平台。

---

## Supporting Files Ledger: 3 Files

| Upstream file | Verdict | Spec-first action | Verification |
| --- | --- | --- | --- |
| `.gitattributes` | 直接同步 | 新增/扩展LF规则，精确覆盖bundled `.sh`、`.py`和无扩展名executables；不全仓强制无关文本。 | `git check-attr eol`、pack tarball line endings、Windows smoke。 |
| `.compound-engineering/config.local.example.yaml` | 按边界吸收 | 更新`.spec-first/config.local.example.yaml`只加入已采纳的optional peer/PR watch/retune diagnostics；不加`docs_root`或CE provider闭列表。 | schema/config consumer、retired/unknown key。 |
| `package.json` | 按边界吸收 | 只加入本计划真实需要的tests/scripts和packaged assets；不加`codex:dev`，版本升级由release owner另行决定。 | `npm run build`、package content、script existence。 |

---

## Full-Range Evidence Ledger: 185 Additional Files

这 185 个文件不直接扩大 product mutation scope，但不能从审计中省略。它们在 `docs/validation/2026-07-30-ce-3-20-file-by-file-diff-audit.md` 中逐文件记录，并按以下 consumer 进入方案：

| Evidence class | Count | Consumer / use | Claim boundary |
| --- | ---: | --- | --- |
| Upstream plans | 24 | 对照设计动机、替代方案、activation gate 与已知 failure mode | 历史计划状态不是当前实现或 field outcome 证据 |
| Upstream Skill docs | 32 | 校验 29 个 CE Skill 的用户可见行为、配置和安装叙事 | 只重写到当前 canonical Skill/README owner，不复制 CE branding/runtime |
| Upstream solutions | 28 | 为 Python、scratch、跨模型、watch、cache 等决策提供候选经验 | 必须经 current source、真实 consumer 与 invalidation condition 验证后才可 knowledge promotion |
| Host specs | 3 | 校验 Claude/Cline/Codex 转换边界 | 只对当前 `getSupportedPlatforms()` 与真实 consumer 生效 |
| Tests and fixtures | 81 | 提取 positive/negative、跨平台、parity、failure receipt 与 security regression 意图 | 测试名称和 green 状态不能替代当前 source/host/live evidence |
| Plugin, release and governance metadata | 17 | 校验分发、版本、CI、README、AGENTS/CLAUDE 和 plugin manifest 边界 | 不机械复制上游发布拓扑，不覆盖当前角色契约 |

上述计数合计 185；与 237 个实施目标合计 422。U0 的机器账本必须同时验证两层分类，禁止只保留实施目标而再次丢失证据文件。

---

## New CE Skill Architecture Decisions

### `ce-babysit-pr`: merge into shipping tail now, public Skill deferred

- **Decision:** `按 spec-first 边界改造后吸收`。
- **Why:** review/CI/head/base currency是真实shipping-tail问题，且`spec-lfg`已经承诺watch CI；当前缺口是existing owner不完整，不是缺一个新入口。
- **First consumer:** `spec-lfg` Step 9；secondary caller为`spec-commit-push-pr`在explicit/pipeline handoff下。
- **Activation for public `spec-babysit-pr`:** 至少两个非LFG standalone真实用例、一个支持wait/wake/resume的live host journey、稳定GitHub状态schema和不自动merge的用户验证。未满足前不新增路由。

### `ce-handoff`: reject generic temp continuity

- **Decision:** `明确不采纳`。
- **Why:** 当前plan/task/run/review/knowledge artifacts已经要求summary、source refs、freshness、limitations；宿主也拥有session resume。新增`/tmp`pointer layer会成为第三套session state，并且没有稳定downstream consumer。
- **Absorbed invariant:** 每个现有handoff继续携带identity/freshness/limitations；恢复前由consumer验证source，不自动续跑或获得mutation authority。
- **Reconsider condition:** 真实跨宿主session resume失败样本持续出现，且现有durable artifact无法表达的最小缺口被至少两个workflow消费。

### `ce-retune`: compose existing Skill authoring and optimization

- **Decision:** `等价能力已存在`。
- **Why:** `spec-write-skill`已经拥有Skill source/eval/promotion，`spec-optimize`已经拥有baseline/measurement/checkpoint/parallel experiments；再建入口会复制两者的核心contract。
- **New composition:** write-skill产生`retune-corpus-manifest`和candidate package，optimize执行A/A noise floor与A/B，write-skill消费结果决定promotion。
- **Hard gate:** 无run archive、switchable corpus build或repeatable task harness时返回`retune-measurement-unavailable`，只可做advisory audit，不得claim retuned。

---

## Implementation Units

### U0. Freeze the Upstream Diff and Produce a Machine-Checkable Reconciliation Ledger

**Goal:** 把固定区间的 422 个文件变成可复现的全量 ledger，同时保留 237 个实施目标与 185 个证据/测试/发行支撑文件的分类，防止实施中遗漏或因 CE HEAD 变化漂移。

**Primary files:**

- `docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.json`
- `docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.md`
- `docs/validation/2026-07-30-ce-3-20-name-status.txt`
- `scripts/check-ce-upstream-reconciliation.cjs`
- `tests/unit/ce-upstream-3-20-reconciliation.test.js`

**Implementation:**

- 固定`base=7f86be9d02679adeb93951587dee40de42c5bf82`和`head=1fac0442ee16996913dd0843a063ac279d2c32f4`。
- 从相邻CE checkout的Git object生成并checked-in保存name-status，不读取mutable working tree内容作为authority。
- 每条路径记录`status`、`ce_skill_or_surface`、`verdict`、`spec_first_owner`、`target_action`、`test_owner`和可选`exception_reason`。
- 验证422总数、237实施目标、185证据文件、215 Skill runtime、19 CLI/转换/安装Runtime、3支撑文件、29 CE Skill、3新增Skill、47脚本和9 cache删除精确匹配；47脚本是对前述目录分类的交叉维度，不与422再次相加。
- Checker默认只校验checked-in name-status snapshot和ledger，因此CI/packaged tests不依赖相邻CE checkout；`--ce-repo <path>`只用于maintainer显式刷新/比对两个commit object。
- Ledger是历史validation artifact，不成为runtime consumer或通用upstream-sync schema。

**Dependencies:** none。

**Test scenarios:** snapshot path新增未分类、重复规则、237/185分类漂移、脚本count漂移、skill directory未知、tests/fixtures或上游文档遗漏时fail closed；显式live refresh模式另测upstream commit不存在/不匹配，不进入默认CI依赖。

### U1. Remove Repo Profile Cache and Rebuild Fresh Grounding Paths

**Goal:** 一次性删除九个cache consumer，保留或改善每个Skill的current-repo orientation。

**Primary files:**

- `skills/spec-{brainstorm,code-review,compound,debug,explain,ideate,optimize,plan,pov}/SKILL.md`
- 上述九个Skill的`references/repo-profile-cache.md`
- 上述九个Skill的`references/agents/repo-profiler.md`
- 上述九个Skill的`scripts/repo-profile-cache.py`
- `tests/unit/repo-profile-cache-parity.test.js`
- 新增fresh grounding contracts/evals

**Implementation:**

- 删除cache get/put/HIT/MISS/NO-CACHE语义和相关文件。
- 每个Skill在现有grounding phase内直接读取current git/source/instructions；重复consumer可共享同一run-local dossier，但不跨run持久。
- 对resume型`spec-optimize`，checkpoint必须记录source identity，identity变化时重新baseline或阻断，不借cache延续。
- 维护一张consumer matrix，证明九个Skill各有fresh path和honest degraded path。

**Dependencies:** U0。

**Test scenarios:** 同repo两个worktree、branch切换、dirty source、non-git workspace、read failure和无dispatch授权。

### U2. Portable Invocation, Python Resolution, LF and Private Scratch

**Goal:** 建立所有后续脚本共享的可移植确定性地板。

**Primary files:**

- 11个含`$ARGUMENTS`的canonical Skill entrypoint
- `.gitattributes`
- `skills/spec-compound/**/scripts/*.py`
- `skills/spec-compound-refresh/scripts/*.py`
- `skills/spec-optimize/scripts/*.sh`
- `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py`
- `skills/spec-sweep/scripts/{analyze_riffrec_zip.py,sweep-state.py}`
- `tests/unit/python-runtime-resolution-contracts.test.js`
- 各owner的private-scratch focused tests

**Implementation:**

- 用host-neutral“invocation arguments”contract替换`$ARGUMENTS`，保留token/quoted path/drive path解析规则。
- 每个实际shell/caller内实现同形resolver函数，按`python3 -> python -> py`执行`-c`probe，拒绝只存在但不可执行的stub；共享fixtures验证行为，不建立跨Skill runtime import。
- Durable artifacts、repo-local run evidence和private temp明确分层；peer runner、PR feedback、optimize、sweep等owner各自实现scratch，写入前后recheck containment/ownership。
- 为同名validator/analyzer副本增加byte-parity或single-sync contract。

**Dependencies:** U0；可与U1后半并行，但同一Skill文件冲突时串行合并。

**Test scenarios:** POSIX/Windows、spaces/Unicode、CRLF、store stub、symlink ancestor、wrong owner、atomic publish failure。

### U3. Build the Code Review Mechanical Floor and Pilot the Peer Runtime

**Goal:** 在不脚本化语义判断的前提下，提高scope、finding和cross-model evidence可靠性。

**Primary files:**

- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/{diff-scope.md,findings-schema.json,cross-model-review.md,cross-model-eval.md,dispatch-reviewers.md,finish-review.md}`
- `skills/spec-code-review/scripts/{review-scope.py,findings-mechanics.py,peer-job-runner.py,cross-model-adversarial-review.sh}`
- code-review evals与focused tests

**Implementation:**

- 先characterize当前scope/lite/findings行为，再落deterministic helpers。
- Helper输出facts和schema errors，Skill继续决定risk roster、semantic duplicates、severity和response。
- Peer runner只在已有cross-model adversarial consumer中pilot；adapter记录requested/actual model/provider和failure class。
- 对现有worker dispatch authorization、egress、isolation和claim ceiling做negative contract，防止runner存在即扩大权限。
- Credential只允许由获准host机制或进程环境注入，采用显式最小环境allowlist；不得进入argv、prompt、receipt、stdout/stderr持久化或repo文件。Prompt和provider result均按不可信数据处理，runner不得执行result中的命令、路径或patch；raw output只留在owner-checked private scratch，durable receipt仅保留脱敏摘要、hash、状态、限制和有界retention/reap结果。

**Dependencies:** U1、U2。

**Test scenarios:** empty/large diff、unresolved base、Skill/config mixed surface、invalid reviewer JSON、large stdout、timeout/reap、auth failure、same-provider和actual-model mismatch、secret-like stdout/argv leak、malicious command/patch result不执行、retention cleanup。

### U4. Extend Doc Review and POV; Add Settled Decisions to Brainstorm/Plan/Ideate

**Goal:** 复用U3经验证的peer lifecycle，同时完成跨workflow decision continuity。

**Primary files:**

- `skills/spec-doc-review/SKILL.md`
- `skills/spec-doc-review/references/{cross-model-review.md,cross-model-eval.md,rendering-floor.md,personas/whole-doc-reviewer.md}`
- `skills/spec-doc-review/scripts/{peer-job-runner.py,cross-model-doc-review.sh}`
- `skills/spec-pov/SKILL.md`
- `skills/spec-pov/references/{cross-model-panel.md,pov-schema.json,agents/pov-peer.md}`
- `skills/spec-pov/scripts/{peer-job-runner.py,cross-model-pov.sh}`
- `skills/spec-{brainstorm,plan}/references/settled-decisions.md`
- `skills/spec-{brainstorm,plan,ideate}/SKILL.md`及handoff/continuity references
- runner parity、cross-Skill decision replay和focused eval tests

**Implementation:**

- 将U3 runner以byte-identical副本投到doc-review和POV；各自adapter/schema独立。
- Brainstorm/plan首波只引入settled decisions和activation contract，不加入runner/elevation shell。
- Ideate/brainstorm/plan按single-owner rule传递决策引用，禁止在Product Contract/KTD/U/task重复定义。
- Doc review补whole-doc/rendering floor/answer-withdrawal；POV补approach-set和independence/privacy receipt。

**Dependencies:** U3；settled-decisions部分可在U3后并行，peer部分必须等待runner pilot通过。

**Test scenarios:** three-runner parity、doc report-only bytes、POV approach completeness、decision replay、no-authority zero peer process。

### U5. Strengthen Work Execution, Worktree Isolation and LFG PR Tail

**Goal:** 吸收CE Work和babysit的可靠性不变量，同时保持host-native execution和既有shipping授权。

**Primary files:**

- `skills/spec-work/SKILL.md`及execution/recovery references
- `skills/spec-worktree/SKILL.md`和scripts
- `src/cli/helpers/spec-work-run-artifact.js`
- `skills/spec-lfg/SKILL.md`
- `skills/spec-lfg/references/{next-work-handoff.md,tracker-defer.md,pr-watch-loop.md}`
- `skills/spec-lfg/scripts/pr-watch-state.cjs`
- `skills/spec-commit-push-pr/**`
- focused work/LFG/worktree/PR fixture tests

**Implementation:**

- Run artifact增加unit state、requested/actual engine、authorization、collision、recovery和verification transaction fields，保持additive/versioned consumer迁移。
- Worktree只接受caller-owned contract，不调度engine或commit。
- LFG admission和handoff文案先明确披露bounded PR-feedback修复与repo-policy branch-currency update；不含merge、force-push或任意历史重写。
- PR body、review comment、check output和provider message均视为不可信内容；状态脚本只解析允许字段，不把评论文本拼入shell/eval。需要采纳的建议由`spec-resolve-pr-feedback`回到current source验证，watch snapshot不得保存token、完整敏感正文或可执行payload。
- LFG Step 9升级为review+CI+head+base currency，支持generation/resume/active budget/single writer lane；snapshot helper只产facts。Review事件路由到`spec-resolve-pr-feedback`的pipeline return，CI失败路由到`spec-debug`的pipeline return；base stale只按明确repo policy执行non-rewriting update，策略缺失或需rewrite时终止为`branch-currency-update-required`。
- 每轮修复后回到既有final verification/fingerprint gate，再push并重新snapshot；terminal为looks-ready、manual blocker、budget exhausted或local-only。
- `spec-commit-push-pr`在已有pipeline authority下传watch handoff；ordinary standalone不默认watch。

**Dependencies:** U2、U3、U6中的`spec-debug`/`spec-resolve-pr-feedback` pipeline return；与U4无强依赖，但共享receipt vocabulary要一致。

**Test scenarios:** interrupted unit resume、path/shared-schema collision、verify rollback、green-but-stale PR、review-after-green、base advanced、manual chain、no remote、3-cycle兼容migration、comment中的shell/prompt injection不执行、snapshot脱敏。

### U6. Apply Specialized Skill Diff Fixes

**Goal:** 完成高确定性、非架构性Skill修复并保持各自owner。

**Primary groups:**

- `spec-compound` / `spec-compound-refresh` validators与headless result
- `spec-debug` pipeline return
- `spec-explain` activation/destination
- `spec-dogfood` / `spec-polish` invocation/path
- `spec-product-pulse` invocation/output
- `spec-resolve-pr-feedback`三个脚本和references
- `spec-riffrec-feedback-analysis` / `spec-sweep` analyzer/state
- `spec-simplify-code` scope/self-skip
- `spec-commit` / `spec-strategy` portable invocation

**Dependencies:** U1、U2。

**Test scenarios:** 采用各S条目的focused cases；每个changed Skill至少一个positive、一个negative/degraded case。

### U7. Gate and Migrate Proof v3

**Goal:** 只有在外部contract可验证时才迁移`spec-proof`，避免把CE文档当live API truth。

**Primary files:**

- `skills/spec-proof/SKILL.md`
- `skills/spec-proof/references/**`
- Proof contract tests和redacted validation receipt

**Implementation:**

- Gate 1：只读核对official endpoint/schema和auth/owner lifecycle；无法核对则U7状态`blocked-external-contract-unverified`，不影响其他units。
- Gate 2：经批准的non-sensitive test document验证create/read/edit/comment/suggest/claim/delete/idempotency/revision conflict。
- Access token只用于普通文档操作，owner secret只在claim/delete等必要操作短时使用；优先获准keychain/host secret store或当前进程环境，不写配置、plan、shell history、URL、日志和receipt。401/403不得自动换用更高权限secret重试，rotation/revocation后必须fail closed。
- 两Gate通过后再迁source和安全指南；未通过保留当前协议并记录limitations。

**Dependencies:** U0；可独立并行，不阻断其他波次。

**Test scenarios:** access token vs owner secret、ownerless claim、stale/rotated secret、401/403 privilege fallback negative、idempotency、base revision conflict、redaction、pull atomic write。

### U8. Compose Retune Mode Across `spec-write-skill` and `spec-optimize`

**Goal:** 在不新增public Skill的前提下落地CE retune的测量纪律。

**Primary files:**

- `skills/spec-write-skill/SKILL.md`及eval/promotion references
- `skills/spec-optimize/SKILL.md`及spec/log schemas
- retune corpus manifest/eval fixtures和cross-Skill journey tests

**Implementation:**

- Write-skill admission生成baseline corpus manifest，记录run archive、task ids、harness version和candidate package hash。
- Optimize执行baseline、A/A noise floor、pre-registered threshold、A/B和broken-run taxonomy。
- Write-skill只在结果可归因、promotion gates通过时应用candidate；否则rollback/defer。

**Dependencies:** U2；不依赖peer runtime。

**Test scenarios:** missing archive/harness、A/A noise过大、candidate regression、broken run、minimal cut、promotion evidence。

### U9. Harden CLI, Frontmatter, Managed Paths and OpenCode Projection

**Goal:** 将19个CLI/转换文件的可移植性和安全变化落到当前CommonJS architecture。

**Primary files:**

- `src/cli/helpers/**`中的path/frontmatter/containment owners
- `src/cli/adapters/**`、`plugin-sync.js`、`plugin-manifest.js`
- `src/cli/commands/{init,doctor,clean}*`
- legacy cleanup/managed ownership tests
- OpenCode current plan/source/tests

**Implementation:**

- 新增或统一slash-command/path classifier；所有实际consumer共用。
- Frontmatter serializer避免YAML隐式类型漂移，parser只读文件开头frontmatter。
- Managed writes/cleanup在nearest existing ancestor和replace前双重containment check；unsafe block不进入manifest ownership。
- OpenCode command registration/collision patch到current dirty source；只有无损patch和双方tests都通过才完成。

**Dependencies:** U0；OpenCode子面依赖current OpenCode worktree达到可合并baseline。

**Test scenarios:** YAML scalar matrix、absolute paths、ancestor symlink/TOCTOU、legacy user fork、OpenCode正文YAML、duplicate skill roots、current platform lifecycle。

### U10. Documentation, Changelog, Runtime Projection and Closeout

**Goal:** 统一更新用户可见行为、运行时投射和证据，但不把source tests提升为field outcome。

**Primary files:**

- `README.md`, `README.zh-CN.md`
- 相关`docs/contracts/**`, `docs/05-用户手册/**`
- `CHANGELOG.md`
- package/init projection tests和generated runtime expectations

**Implementation:**

- 更新cache removal、optional peer、PR watch、retune composition、Proof状态和fixed artifact root。
- 运行source-first`spec-first init`生成当前平台runtime；不得手改runtime。
- Fresh-source eval覆盖modified prose；scripts/CLI按常规source tests。
- Reconciliation ledger记录422条upstream path的最终implemented/deferred/rejected/evidence-only outcome和evidence ref。

**Dependencies:** U1-U9中实际激活的units。

**Test scenarios:** current platform inventory、projection parity、no CE prefix/provider leakage、no orphan scripts、docs links和package contents。

---

## Sequencing and Release Waves

| Wave | Units | Exit gate | Rollback boundary |
| --- | --- | --- | --- |
| W0 Characterization | U0 | 422=237+185、215/19/3、29、35、47及证据子类计数全匹配 | 删除新ledger/test，不改product source。 |
| W1 Freshness and portability | U1-U2 | 九cache consumer fresh grounding通过；Python/LF/scratch/arguments focused tests绿 | 可按U1、U2独立回滚；不恢复generated runtime。 |
| W2 Review pilot | U3 | code-review mechanics和one peer runner pilot通过，授权/claim negative tests绿 | 删除new helpers/runner并恢复旧review prose，不影响W1。 |
| W3 Semantic expansion | U4、U6 | doc/POV/settled decisions及specialized fixes focused tests绿 | 按Skill owner独立回滚。 |
| W4 Execution tail | U5 | work recovery、worktree ownership和PR watch fixture闭环 | 回退run-artifact additive fields和LFG watch，保留W1-W3。 |
| W5 Optional external/product | U7-U8 | Proof live Gate按实记录；retune A/A/A-B fixtures通过 | Proof可defer不阻塞；retune按组合模式独立回滚。 |
| W6 CLI/runtime | U9-U10 | current platform init/doctor/clean/projection/build/full tests和fresh-source eval通过 | 回滚CLI slice，重新从source投射；不得patch runtime。 |

每个wave必须可独立审查和回滚。禁止把U1 cache removal、U3 review runner、U5 Work/LFG和U9 OpenCode塞进一个不可分割mega-commit。

---

## Verification Contract

### Deterministic Gates

1. **Exhaustive inventory**
   - 35个`skills/*/SKILL.md`全部且唯一出现在S01-S35。
   - CE 29个Skill全部且唯一出现在mapping table。
   - 上游422文件由ledger唯一分类；`unclassified=0`, `duplicate=0`, `inherited=0`。
   - 237个实施目标和185个证据/测试/发行支撑文件分别精确；24 plans、32 Skill docs、28 solutions、3 host specs、81 tests/fixtures、17 metadata/governance文件可回链。
   - 47脚本、9 cache删除、3新增CE Skill和19 CLI/转换/安装Runtime文件计数精确。

2. **Source/runtime boundary**
   - Source diff不含手改generated runtime。
   - `spec-first init`前后projection来自canonical source，current platform expected files一致。
   - No runtime asset references source checkout-only paths。

3. **Focused tests by owner**
   - fresh grounding/cache removal。
   - Python/LF/scratch/UTF-8。
   - code review scope/findings/peer lifecycle。
   - doc review/POV/settled decisions。
   - work run artifact/worktree/LFG PR state。
   - PR feedback、compound validators、riffrec/sweep、simplify。
   - frontmatter/path/managed cleanup/OpenCode lifecycle。

4. **Repository gates**

```bash
npm run typecheck
npm run test:unit
npm run test:smoke
npm run test:integration
npm run lint:skill-entrypoints
npm run test:mcp-setup
npm run build
git diff --check
```

只在影响面需要时运行完整`npm test`; release前必须执行。若current worktree已有独立失败，记录baseline和本计划delta，不能把旧失败算作本计划通过或用本计划掩盖。

### Semantic and Fresh-Source Gates

- Modified Skill prose必须按`docs/contracts/workflows/fresh-source-eval-checklist.md`注入当前磁盘source做fresh read-only评估。
- 没有worker dispatch授权或live primitive时，记录`not_run`/具体reason；不得用当前会话cached Skill调用或inline self-review冒充独立性。
- Review/POV peer只有真实requested/actual model/provider receipt和result evidence时，才能声明cross-model coverage。
- Proof v3只有approved live journey才能声明field contract可用；mock tests只证明local consumer behavior。
- PR watch fixture只证明状态机；真实GitHub watch/resume field outcome需要独立journey，并限定exact CLI/API/version/PR。
- Retune fixtures只证明workflow contract；真实模型升级收益必须来自预注册corpus A/A/A-B结果。

### Negative Assertions

- Canonical Skill不得出现CE provider route闭列表作为唯一执行路径。
- Workflow invocation不得等于worker dispatch、data egress、credential、commit、landing或external communication authorization。
- 无`docs_root`全局配置，无canonical artifact discovery漂移。
- 无generic`spec-handoff`、首波无public`spec-babysit-pr`、无`spec-retune`。
- `spec-work`无central dispatcher/controller/provider CLI wrapper。
- 无orphan runner、orphan`codex:dev`、无未消费schema。
- 脚本不输出semantic adoption/review/root-cause verdict。
- 凭证不进入argv/source/plan/receipt/log；外部评论、prompt和provider result不被直接执行或自动应用。

### Plan Integrity Checks

- `rg '^### S[0-9]{2}\.'`结果精确35。
- mapping table精确29个CE Skill。
- Script ledger每个上游script path恰出现一次。
- CLI ledger19个路径、support ledger3个路径。
- 全区间审计F001-F422连续、路径唯一，且与固定Git区间name-status/numstat逐项一致。
- 计划正文不写本机绝对路径；外部checkout以repo identity+relative path描述。
- Changelog只追加本计划条目，不覆盖现有dirty entries。

---

## Risks and Mitigations

| Risk | Impact | Mitigation / stop rule |
| --- | --- | --- |
| 删除cache后重复扫描增加token/time | 中 | 共享同一run-local orientation/dossier；用progressive references，不恢复跨run cache。 |
| 三份peer runner再次漂移 | 高 | 限定三consumer、byte-parity、同fixtures、single contract review；任何一份差异阻断。 |
| Runner成为隐性外部模型授权 | 高 | admission在Skill语义层；缺authorization/egress时不probe、不spawn；negative subprocess tests。 |
| Review mechanics吞掉语义finding | 高 | 只允许exact fingerprint和schema/order；fuzzy/semantic merge由LLM；保留raw reviewer artifacts。 |
| Work recovery演变成中心engine | 高 | 不复制controller topology；host runtime执行、spec-work语义、helpers只facts；architecture negative test。 |
| PR watch无限等待或越权修复 | 高 | active budget、terminal reasons、single writer lane、最多受控fix cycles、无auto merge。 |
| Peer/PR/Proof输入造成凭证泄漏或命令注入 | 高 | 最小环境allowlist、凭证不进argv/log、provider_untrusted、no-eval/no-auto-apply、durable receipt脱敏和有界retention。 |
| Proof上游文档过期 | 高 | official/live Gate；未验证不迁移或claim。 |
| OpenCode dirty source被覆盖 | 高 | U9前重读current diff，patch-on-current，双方tests；冲突无法无损解决即停。 |
| 全局portable cleanup扩大scope | 中 | 只改当前consumer；no-consumer upstream converter记录不采纳，不扩supported platforms。 |
| 固定artifact root限制用户定制 | 低/有意 | 稳定producer/consumer优先；非canonical report按Skill显式支持alternative output。 |
| 大方案一次落地回归面过大 | 高 | W0-W6独立waves、focused exit gates、per-wave rollback和禁止mega-commit。 |

---

## Alternatives Considered

### A. Mirror CE 3.20.0 file-for-file

拒绝。它会复制provider/model routes、六份大型runner、CE Work中心控制器、`docs_root`和CE TypeScript installer topology，破坏当前ownership和多宿主contract。

### B. Only remove repo caches and ignore the rest

拒绝。Cache removal是P0直接收益，但会遗漏PR feedback可靠性、review mechanical floor、Python/LF/scratch、PR tail和CLI safety等明确diff价值。

### C. Create all three new public Skills

拒绝。Babysit先补现有LFG owner；handoff已有durable artifact/session contract且无consumer；retune可由write-skill+optimize组合。直接增Skill会使harness滑向agent collection。

### D. Build a shared cross-Skill runtime library

暂不采用。独立Skill安装和host projection需要package self-containment；对三份真实consumer用parity治理比运行时共享路径更可靠。若未来consumer超过阈值且packager支持shared dependency manifest，再单独规划。

### E. Make `docs_root` configurable everywhere

拒绝。当前固定路径是producer/consumer/discovery/protected-artifact contract。全局迁移成本远超本次diff收益，且会制造split-brain artifacts。

---

## Evidence and Limitations

### Evidence Used

- CE Git range`7f86be9d..1fac0442`和其422-file name-status/stat。
- `docs/validation/2026-07-30-ce-3-20-file-by-file-diff-audit.md`，逐条记录F001-F422的原始diff规模、实际变化、owner、裁决和验证面；其中237个实施目标与185个上游证据/测试/发行支撑文件分层计数，不使用目录继承或抽查结论。
- CE升级分析`docs/version-upgrades/2026-07-30-7f86be9d-to-1fac0442-skills-scripts.md`，用于交叉核对规模、主题和owning files。
- 当前35个canonical Skill的`SKILL.md`、references、scripts、evals和相关tests。
- 当前host-neutral worker dispatch、source/runtime、plan/work、knowledge promotion和artifact contracts。
- 当前dirty OpenCode/runtime工作树事实，仅用于定义ownership/merge边界，不作为已完成能力claim。

### Limitations

- 本计划是implementation-ready设计，不代表任何Skill/脚本变更已实施。
- 尚未运行CE provider CLI、detached runner、Proof v3、真实PR watch或retune field experiment。
- 规划阶段已完成422/422逐文件原始diff审计；实施时U0仍须从固定Git objects重新生成机器账本并与validation报告对账，目的是验证输入未漂移，不是补做抽查。
- 当前OpenCode source在工作树中有独立未提交修改；U9的最终文件列表和测试基线必须以实施时current source为准。
- Fresh-source eval和真实host journey属于实施验证，不可由本计划审查替代。

---

## Definition of Done

- [x] 规划阶段逐文件审计证明422/422路径均有独立记录；237/237实施目标、185/185证据文件、29/29 CE Skill、35/35 spec Skill、47/47脚本均无遗漏。
- [ ] U0实施前从固定Git objects重建机器账本，并证明与逐文件审计`unclassified=0`、`duplicate=0`、`inherited=0`。
- [ ] 九个repo profile cache及references/routes/parity test删除，九个consumer都有fresh grounding正负例。
- [ ] 11个`$ARGUMENTS`entrypoint迁移为host-neutral invocation contract。
- [ ] Python resolver、LF、UTF-8和private scratch安全覆盖所有实际bundled script consumer。
- [ ] Code review scope/findings mechanical floor通过，脚本未接管semantic judgment。
- [ ] 三个peer-enabled Skill的runner/receipt通过parity、lifecycle、authorization、egress和claim tests；plan/brainstorm无orphan elevation assets。
- [ ] Spec-work/worktree吸收recovery/collision/transaction invariants但未形成central execution runtime。
- [ ] Spec-lfg PR tail覆盖reviews、CI、head和base currency，仍不自动merge。
- [ ] PR feedback、compound/refresh、riffrec/sweep、simplify、commit/strategy等直接修复完成聚焦验证。
- [ ] Proof v3按Gate真实迁移或诚实记录external-contract-unverified，不伪造完成。
- [ ] Retune通过write-skill+optimize组合落地，无新增public Skill。
- [ ] CLI/frontmatter/path/managed cleanup/OpenCode patch基于current source完成，未覆盖用户dirty work。
- [ ] README/docs/Changelog同步，current supported platform runtime由source-first init生成，无手改mirror。
- [ ] Focused tests、typecheck、unit、smoke、integration、skill lint、MCP setup、build和`git diff --check`按影响面通过。
- [ ] Modified Skill完成fresh-source eval；未执行的live provider/PR/Proof/retune evidence明确标`not_run`和原因。

---

## Handoff

本计划建议从W0开始，由`spec-work`按U0-U10和wave exit gate实施。第一批只做reconciliation、cache removal和portable script floor；review peer、Work/LFG、Proof和OpenCode分别在后续wave激活，避免与当前dirty OpenCode工作或高风险runtime变更混成一次不可审查提交。
