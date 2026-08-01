---
artifact_type: audit-plan
artifact_version: 1
created_at: 2026-08-01
updated_at: 2026-08-01
target_repo: .
scope: full-system-installation-to-delivery
status: ready-for-execution
authority: audit-artifacts-only-by-default
---

# spec-first 全链路系统审计方案

## 1. 方案意图

本审计验证 spec-first 是否用最小可维护机制，把正确意图推进为可信结果：

```text
可信变更 = 清晰意图 × 有效上下文 × 有界执行 × 可核验证据 × 可失效学习
```

“全链路”指覆盖 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 的关键连接、六宿主投射、Provider 降级路径与五类退出 gate；不等于逐行审查仓库中的每个文件。

本审计不预设系统当前整体处于 `degraded-by-design`。它先建立当前 source snapshot，再分别判断每项能力是 confirmed、degraded、blocked、failed 还是 not-run。历史报告只提供待复核线索，不直接决定当前结论。

### 核心审计问题

1. CLI 是否可安装、可初始化、可诊断，并能从 source 重建六宿主 runtime？
2. 五类退出 gate 是否由确定性机制强制，或在宿主无法强制时以响亮约定诚实降级？
3. 核心 workflow 是否保持 source/runtime、事实/判断、授权/能力边界？
4. Provider 或宿主能力缺失时，系统是否给出可回源的 reason code、limitations 与 fallback，而不是静默放行？
5. 真实任务是否形成从意图到验证再到知识的 evidence chain？
6. 如果要声称“产生增量价值”，是否存在预注册、可比较的 baseline，而不是只凭一次成功 journey 推断？

## 2. Goals 与 Non-goals

### Goals

- 冻结一个可复现的 source、依赖、宿主与授权基线。
- 按 L0 基础设施、L1 确定性地板、L2 语义判断、L3 交付效果分层形成证据。
- 对五类退出 gate 建立 `owner -> enforcement -> evidence -> consumer -> limitation` 映射。
- 区分 projection、loader discovery、workflow execution 与 field outcome，限制每项结论的 claim ceiling。
- 形成一份 canonical 审计报告、可定位的原始日志和可执行的后续修复队列。

### Non-goals

- 不在当前 target checkout 中顺手修复审计 finding。Field journey 的任务改动只能在另行授权的 disposable worktree 与 path scope 内发生。
- 不在当前工作树中注入 source/runtime drift，不做全局 npm 安装，不移动当前 `graphify-out/`。
- 不强制所有任务经过固定状态机；记录实际路由与 handoff，不预设唯一 workflow 路径。
- 不把 unit/integration fixture、模型自评、Provider 输出或历史 transcript 提升为真实宿主/真实用户 field evidence。
- 不在缺少凭证、外部 mutation、数据外发、worker dispatch 或真实宿主 journey 授权时自行扩大权限。
- 不把本轮 findings 直接提升为 `docs/solutions/` durable knowledge；修复和知识沉淀属于后续 owner workflow。

## 3. 权威、范围与安全边界

### 3.1 Source of truth 与 runtime

- Source 依据：`skills/`、`templates/`、`src/cli/`、`docs/contracts/`、`AGENTS.md`、`CLAUDE.md`、README 与 tests。
- Generated runtime 只作为投射结果检查；不得手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`、`.opencode/` 来修复 source 行为。
- 当前支持宿主必须由 `src/cli/adapters/index.js#getSupportedPlatforms()` 在 run start 动态解析。当前 source 期望集合为 Claude、Codex、Cursor、Kiro、Qoder、OpenCode；若运行时集合变化，以冻结的 source snapshot 为准并记录差异。

### 3.2 Script 与 LLM ownership

| Owner | 负责 | 不负责 |
| --- | --- | --- |
| Scripts / tools | 路径、文件、hash、schema、exit code、reason code、runtime drift、日志位置与 readiness facts | 产品价值、架构充分性、finding 是否成立、root cause 与优先级 |
| LLM / reviewer | 需求、架构、风险、语义充分性、claim scope 与 fallback 判断 | 伪造命令结果、把 advisory facts 宣称为 confirmed、替代 mutation 授权 |
| Project owner | 价值取舍、外部副作用、高风险或不可逆授权、field journey 范围 | 用口头授权替代可核验证据 |

### 3.3 允许写入的审计产物

- Canonical report：`docs/validation/2026-08-01-full-system-audit-report.md`。
- Run-scoped raw evidence：`.spec-first/audits/full-system/<run-id>/`。该目录是可重建 audit artifact，不是 source truth；普通 workflow 默认不扫描。
- 只有实际执行的场景才创建独立 scenario receipt，禁止预先创建空报告。
- 所有日志先做凭证与敏感信息检查；报告只放摘要、exit code、reason code 和 repo-relative evidence path，不粘贴大段 raw output。

### 3.4 禁止的审计操作

- `npm install -g ...` 或任何会改变真实全局 npm 状态的安装。
- `echo ... >> skills/**`、直接修改 source 后再靠人工恢复的 drift 注入。
- `mv graphify-out ...`、删除 Provider artifact 或手改 generated runtime。
- 在真实主分支工作树中执行 bugfix、功能或重构场景。
- 未获授权时 dispatch worker、调用外部模型、创建 PR、push、发消息或使用凭证。

## 4. Claim 与证据模型

### 4.1 Claim ladder

| Claim ID | 可声称内容 | 最低证据 | 不能据此声称 |
| --- | --- | --- | --- |
| C0 | source/contract 静态一致 | 当前 source 引用、schema/contract test | runtime 可加载、真实 workflow 可执行 |
| C1 | CLI 与 runtime projection 可运行 | 当前 source 构建的包、真实进程 exit/log、隔离 lifecycle tests | 宿主实际发现并调用 Skill |
| C2 | 指定宿主 loader/workflow 可运行 | 版本匹配的真实宿主 journey receipt | 其他宿主、其他版本或长期稳定性 |
| C3 | 单个真实任务产生可信结果 | 冻结输入、实际 diff、验证日志、review 与 limitations | 相对其他方法更快或更好 |
| C4 | spec-first 产生增量价值 | 预注册 comparator、同口径指标、可解释差异 | 普遍产品价值或长期 field outcome |

任何层级缺证据时，结论停留在已被直接证据支持的最低层，禁止跳级。

### 4.2 Run status

| Status | 含义 |
| --- | --- |
| `passed` | 检查实际运行，直接证据支持该 check 的限定 claim |
| `failed` | 检查实际运行且未满足预注册 acceptance |
| `degraded` | 有部分证据，但强度不足以支持完整 claim；必须记录 limitation 与 fallback |
| `not-run` | 未执行；必须记录 reason code，例如缺工具、缺授权或预算未进入该 wave |
| `blocked` | 上游失败或权限边界阻止继续，且继续会污染结果或扩大副作用 |

以上是本审计的 run status。复核 external evidence ledger 时保留其既有 `confirmed|blocked-external-authorization|degraded-by-design|failed` 词汇，不静默改写历史合同。

### 4.3 Evidence record

每个 check 至少记录：

```yaml
check_id: L1-GATE-VERIFICATION
claim: "验证完成声明需要匹配范围的直接证据"
source_head: "<git sha>"
command_or_method: "<exact command or semantic review method>"
ran: true
exit_code: 0
status: passed
evidence_paths:
  - ".spec-first/audits/full-system/<run-id>/logs/<check>.log"
direct_source_refs:
  - "docs/contracts/verification/verification-run-summary.md"
limitations: []
owner: "verification contract + consuming workflow"
consumer: "spec-work/spec-debug/spec-code-review closeout"
```

LLM 语义 finding 仍需直接 source quote/path，且必须标为 `llm_judgment`；它不能伪装成 script-confirmed result。

## 5. Phase 0：执行前基线（30–60 分钟）

### 5.1 冻结 run manifest

记录但不修改当前状态：

```bash
git rev-parse HEAD
git status --short
node --version
npm --version
node bin/spec-first.js --version
git diff --check
```

Manifest 还应记录：run id、当前分支或 detached 状态、dirty paths、`package.json` version、OS、已授予的 mutation/worker/external-data 权限、已知缺失工具和计划采用的 comparator。

Dirty worktree 不是自动失败。审计必须把当前 source snapshot 与已有用户改动一起冻结；不得覆盖或回退不属于本审计的修改。

### 5.2 一次性 baseline gate

```bash
npm run typecheck
npm run lint:skill-entrypoints
npm test
npm run build
```

`npm test` 已包含 unit、smoke 与 integration，不再在 Phase 0 重复运行三个分项。`npm run test:mcp-setup` 只在需要隔离 Runtime Setup failure 或生成专项日志时补跑。

### 5.3 停止与继续规则

- 依赖缺失：记录 `not-run/missing_dependency`，不得未经授权自动 `npm ci` 或安装工具。
- Baseline 失败：记录原始失败并进入 read-only 定位；不得“先修好再审计”。与失败无关的静态 contract 审查可继续。
- 包构建、CLI 启动或隔离保护失败：阻断 L0 apply journey 与 L3 field journey，避免污染全局或当前工作树。
- 任一日志疑似包含凭证：停止持久化该日志，先完成 redaction；不得只靠报告中声明“已脱敏”。

## 6. Phase 1：L0 基础设施与六宿主投射（1.5–2.5 小时）

### 6.1 本地包黑盒检查

复用仓库现有安装 smoke。它把当前 source 打成 tarball，在 `mkdtemp` 创建的临时 prefix 中安装并调用真实 shim，不改变机器的实际全局 npm prefix：

```bash
node scripts/npm-install-matrix-smoke.cjs
```

记录 tarball package/version、当前 OS/arch/Node、安装与 shim exit code。该命令只证明当前执行 OS；其他 OS 需要版本与 source snapshot 匹配的 CI matrix receipt，不能由本地运行外推。

### 6.2 六宿主 lifecycle 与 ownership

实际 `init` apply 必须复用已有隔离测试 harness；该 harness 为每个 case 创建临时 project/home，避免改真实 developer profile 或当前 runtime：

```bash
npm run test:jest -- --runTestsByPath \
  tests/smoke/cli-smoke.test.js \
  tests/integration/init-six-host-lifecycle.integration.test.js \
  tests/unit/host-runtime-projection-contracts.test.js \
  tests/unit/managed-removal-ownership.test.js \
  --runInBand
```

检查：

- `getSupportedPlatforms()` 返回的每个宿主均被执行，不靠手写列表漏掉 OpenCode。
- packed-tarball smoke 从已安装 package 执行六宿主 init，确认发布包实际包含所需 skills/templates；不能只用 checkout 内 CLI 代替。
- `init --dry-run` 先展示 mutation，apply 后第二次 init 稳定。
- `doctor --<host> --json` 能区分 install health、runtime asset health、host readiness 与 workflow runnability。
- clean/removal 只删除仍属于 spec-first 的 managed slice，保留 user-owned host surface。
- Cursor/OpenCode projection ready 不得自动提升为 loader discovered 或 workflow verified。

### 6.3 Source/runtime drift

不修改真实 `skills/` 或 runtime。使用 lifecycle tests 中的临时 fixture 验证 missing、drifted、user-owned collision、re-init repair 与 clean ownership；用以下 source 合同解释结果：

- `docs/contracts/source-runtime-customization-boundary.md`
- `docs/contracts/context-governance.md`
- `src/cli/commands/init-project-plan.js#inspectCurrentRuntimeDrift`

### 6.4 L0 acceptance

- 当前 tarball 可在临时 prefix 安装并启动。
- 六宿主 projection lifecycle 在隔离环境通过，且不触碰真实全局/项目 runtime。
- 每个宿主分别报告 projection、loader 与 workflow evidence level；未知项保持 degraded/not-run。
- 任何 projection mismatch 都有具体 source path、test/log 与 owner，不用“其他宿主类似”代替覆盖。

## 7. Phase 2：L1 确定性地板与退出 gate（2–3 小时）

### 7.1 Script inventory 与语义边界

先生成确定性 inventory，再由 reviewer 判断语义是否越界：

```bash
rg --files scripts skills | rg '/scripts/.*\.(cjs|js|sh|py)$|^scripts/.*\.(cjs|js|sh|py)$'
```

Inventory 至少记录 path、hash、语言、可能的 mutation/process/schema 关键词、对应 Skill/command 与直接 tests。关键词只用于风险排序，不得自动判定“脚本包含语义逻辑”。

审查优先级：

1. 会写删文件、改 host/runtime、执行子进程或处理凭证的脚本。
2. 生产 verification、handoff、readiness、promotion facts 的脚本。
3. 纯 parser/formatter/inventory 脚本抽样复核；若不是全量，报告准确样本量与排除理由。

### 7.2 五类 gate matrix

| Gate | 主要 source owner | 最低验证 | 允许的降级结论 |
| --- | --- | --- | --- |
| Mutation | 各 workflow mutation policy、Runtime Setup path/ownership controls | 负向 contract tests、隔离 mutation journey、pre/post state | 宿主无 blocking primitive 时标 `loud-convention`，不得称 hard gate |
| Verification | `docs/contracts/verification/**`、work/debug/review closeout | 真实 exit/log、summary schema、失败后不可 close | recorder 只能证明转录边界时，明确其弱于 process supervision |
| Source/runtime | adapters/init/doctor 与 customization boundary | 六宿主 drift、re-init、clean ownership tests | loader 未验证不影响 projection claim，但限制 workflow claim |
| Handoff/context reset | `artifact-summary.v1`、`spec-handoff` contracts | summary/source refs/freshness/limitations 与 consumer test | 缺 summary 时 `summary_missing`，不得静默广播 full artifact |
| Knowledge promotion | Knowledge Harness、spec-compound schema/validator | candidate -> review -> promote 负向 tests | legacy learning 只作 advisory recall，不追溯提升为 verified |

Gate 结果必须标 `hard-enforced|loud-convention|missing`。不能因为文档写了 MUST 就把它记为 hard-enforced，也不能因为宿主无法强制就把约定静默记为 passed。

### 7.3 聚焦 deterministic checks

```bash
npm run test:jest -- --runTestsByPath \
  tests/unit/verification-run-summary.test.js \
  tests/unit/spec-work-run-artifact-contract.test.js \
  tests/unit/spec-work-run-artifact-producer.test.js \
  tests/unit/spec-prd-plan-handoff-contracts.test.js \
  tests/unit/spec-handoff-contracts.test.js \
  tests/unit/compound-promotion-contracts.test.js \
  tests/unit/external-evidence-closure-ledger.test.js \
  --runInBand
```

不要使用 `npm run test:unit -- <path>` 做定向验证；当前 `test:unit` runner 固定运行整个 `tests/unit`，不会把追加 path 转发给 Jest。定向测试统一走 `npm run test:jest -- --runTestsByPath ... --runInBand`。

### 7.4 L1 acceptance

- 五类 gate 均有 source owner、consumer、负向证据、enforcement level 与 limitation。
- Script inventory 与语义 reviewer 结论分开保存；不存在关键词扫描直接产出架构结论。
- 任何 verification pass 都能定位到真实 command、exit code 与 redacted log。
- 未被机械强制的出口不能以 `passed/hard-enforced` 表述。

## 8. Phase 3：L2 核心 workflow 语义审计（2–4 小时）

### 8.1 审查对象

覆盖完整链路与边界 owner：

- `using-spec-first`：入口路由与 Direct Lane 边界。
- `spec-prd`：Product Contract 与 planning readiness。
- `spec-plan`：product/planning/implementation authority。
- `spec-work`：有界 mutation、验证与 closeout。
- `spec-code-review`：finding、direct evidence 与修复授权。
- `spec-handoff`：跨 session summary/freshness/limitations。
- `spec-compound`：verified promotion 与 invalidation condition。
- `spec-runtime-setup`：Provider/runtime readiness 与 mutation ownership。

### 8.2 Fresh-source eval 授权 gate

严格按 `docs/contracts/workflows/fresh-source-eval-checklist.md`：

1. 从当前磁盘读取 source Skill、必要 reference 与对应 contract/test，不读取 generated runtime 作为行为真源。
2. 只有用户或上游显式授权 worker/persona dispatch 后，才检查当前会话 dispatch capability。
3. 每个 fresh reviewer 使用自包含、只读、最小上下文 packet；记录 source paths、source hash、隔离状态、模型/宿主事实与 output validity。
4. 未授权、capability unknown 或无法形成 fresh context 时，不 dispatch，不探测；记录 `fresh_source_eval: not_run` 与具体 reason。
5. 主会话 direct read 和 contract tests 可以形成 source review，但不得冒充 independent fresh-source eval。

### 8.3 语义 lens

每个 workflow 回答同一组问题：

- 目标、non-goals、source owner、consumer 与硬出口是否明确？
- 是否把 advisory/provider facts 与 confirmed evidence 分开？
- mutation 授权、worker 授权、external-data 权限与工具可用性是否被混同？
- scripts 是否只准备确定性事实，LLM 是否保留语义判断？
- degraded mode 是否有 reason code、claim limit、fallback 与 re-evaluate condition？
- handoff 是否 summary-first，并携带 source refs、freshness、limitations 与 full-read trigger？
- prompt 是否暴露 internal helper 为公开入口，或把宿主 primitive 重建为项目框架？

### 8.4 Artifact 与 handoff 检查

不要求所有 Markdown 都有同一种 frontmatter。按每个 producer 的 canonical schema/contract 验证：

- Machine artifact：验证 `schema_version`、producer、字段形态、hash/freshness 与 consumer tests。
- Durable Markdown artifact：验证 path-backed source refs、artifact summary 或等价 summary 段、limitations 与 owner。
- Provider output：仅作 `provider_untrusted` navigation；重要结论回源到 source/test/log/contract。
- Knowledge artifact：新建或 material rewrite 必须有 `source_refs` 与 `invalidation_condition`，并通过 promotion validator 的确定性地板。

### 8.5 L2 acceptance

- 每个核心 workflow 有独立结果，不用“核心 Skill 均清晰”一条总评替代。
- Fresh-source eval 的 `passed|concerns|not_run` 与普通 source review 分开。
- 所有语义结论引用当前 source；历史 eval 只用于提出回归问题。
- 发现的问题包含 consequence、证据、最小修复方向、owner 与复验方法。

## 9. Phase 4：L3 端到端交付与降级验证（分 wave，3–10+ 小时）

### 9.1 Controlled journeys：机制证据

在 disposable project/worktree 中运行，不修改当前工作树：

| Journey | 注入 | 预期观察 | Claim ceiling |
| --- | --- | --- | --- |
| D1 Source/runtime drift | 临时 fixture 中修改 managed projection 或 source slice | doctor 报 drift，source-first re-init 恢复，user-owned 内容保留 | C1 |
| D2 Verification failure | 场景 verifier 返回非零 | completion claim 被阻断，失败 log/exit code 保留 | C1 |
| D3 Missing Provider | 使用 Runtime Setup 已有 provider fixture 构造 CLI/artifact 缺失 | setup facts 报具体 reason code 与 fallback | C1 |
| D4 Stale advisory graph | 使用 stale/unknown readiness fixture | graph 只用于导航，结论回源；不因 artifact exists 升级 readiness | C1 |
| D5 Incomplete handoff | 缺 summary/freshness/limitations 的 fixture | consumer 报 `summary_missing` 或拒绝完成 handoff | C1 |

Provider 缺失由 `spec-runtime-setup` 的隔离 fixture/setup facts 验证。`spec-first doctor` 可以消费已有 setup facts，但不替代 Runtime Setup 的 Provider lifecycle owner。禁止通过移动当前 `graphify-out/` 模拟故障。

### 9.2 Field journeys：真实效果证据

Field journey 必须在执行前冻结：

- 真实、尚未解决的任务与 acceptance criteria。
- 起始 commit/worktree、允许修改的 path、禁止副作用、验证命令。
- 允许使用的 workflow、worker、网络、凭证和外部系统。
- 时间/token 预算、checkpoint、停止条件与恢复点。
- Comparator 及同口径指标；没有 comparator 时禁止输出 C4 增量价值结论。

按 wave 递进，上一 wave 未通过时不自动扩大：

| Wave | 场景 | 默认要求 | 目的 |
| --- | --- | --- | --- |
| J1 | 小型真实 bugfix | 必须有稳定 reproducer 与回归测试；从 `using-spec-first` 选择公开入口 | 验证最短可信变更路径 |
| J2 | 中型真实功能 | J1 通过、Product Contract 与验收标准明确 | 验证跨 artifact handoff 与 review 闭环 |
| J3 | 多轮复杂重构 | J2 通过，另有预算、checkpoint 和恢复授权 | 验证长时上下文、bounded autonomy 与 evidence continuity |

不预写 `spec-prd -> spec-plan -> spec-work -> spec-code-review` 为刚性路径。记录入口路由、每次 handoff 与实际消费者；如果任务已具备 validated plan，可直接进入 `spec-work`。`spec-commit` 是 internal helper，不作为场景公开入口。

### 9.3 Evidence chain

每个已执行场景使用同一 receipt：

```markdown
## Scenario <ID>

- Source snapshot / worktree: ...
- User intent and acceptance: ...
- Authorized mutations and exclusions: ...
- Comparator: ... | none

| Step | Owner | Input artifact | Claim | Direct evidence | Status | Limitation |
| --- | --- | --- | --- | --- | --- | --- |

### Exit gates
- Mutation: hard-enforced | loud-convention | missing — evidence: ...
- Verification: ...
- Source/runtime: ...
- Handoff: ...
- Knowledge promotion: ...

### Outcome
- Acceptance result: ...
- Unsupported completion claims: 0 | ...
- Human intervention points: ...
- Rework loops: ...
- Time-to-trusted-change: ...
- Claim ceiling: C1 | C2 | C3 | C4
```

### 9.4 增量价值判定

建议指标：

- 从需求冻结到 verified closeout 的 wall-clock time。
- 验收通过率与回归数量。
- unsupported claim 数、缺失 evidence link 数、未授权 mutation 数。
- 人工介入次数与总时长。
- 首轮计划后 rework loops。
- 可复用 artifact/knowledge 的数量及其 invalidation 完整度。

只有 comparator 与 task difficulty 可比、口径一致、输入事先冻结时，才允许输出“增量价值 confirmed/failed”。没有 comparator 的成功 journey 只能证明该任务达到 C3，不能证明 C4。

## 10. Phase 5：历史证据与已知风险复核（1–1.5 小时）

### 10.1 复核规则

- 历史 validation、memory、issue ID 和 transcript 均是 advisory 输入。
- 每条历史结论先检查 source ref 是否存在、source 是否变化、证据是否过 freshness/re-evaluate condition。
- 只更新被新证据直接覆盖的 subclaim；一个 host journey 不提升其他宿主或整条 ledger。
- 找不到当前 source/issue owner 的历史名称，记录 `stale-reference`，不继续沿用。

### 10.2 当前必查基线

- `docs/validation/2026-07-30-external-evidence-closure-ledger.md`：逐项复核 E01–E18 的 status、re-evaluate condition 与 closure path。
- `docs/validation/2026-07-31-spec-plan-skill-up-eval.md`：当前最新完整回归是 1 PASS / 2 FAIL；transaction helper 已因无真实 consumer 退役。审计应检查当前 light contract 与宿主可强制边界，不把已退役 helper 当现行 verification gate。
- `docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.md` 及其 JSON：重新计算 current inventory 后再比较，不把旧数量当当前 truth。
- `docs/catalog/runtime-capabilities.md`：宿主能力声明必须与 current source、版本匹配 journey 和 ledger limitations 对齐。

原方案中的 `SF-28` 与 `docs/validation/codex-spec-prd-stability-review.md` 在当前 source 中没有可确认的 canonical owner/path，不能作为必查事实。只有找到当前 issue/source owner 后才作为新 evidence 纳入。

## 11. Phase 6：综合结论与后续修复（1–2 小时）

### 11.1 Canonical report

只生成一份主报告：`docs/validation/2026-08-01-full-system-audit-report.md`。结构为：

1. Executive verdict 与 claim ceiling。
2. Source/run/authorization manifest。
3. L0–L3 coverage 与未执行原因。
4. 五类 gate matrix。
5. 六宿主 projection/loader/workflow evidence matrix。
6. Findings 与 evidence paths。
7. Field journey/comparator 结果。
8. Residual risks、limitations 与 re-evaluate conditions。
9. 修复 handoff 与 recommended next action。

### 11.2 Finding contract

```yaml
id: F-001
severity: P0|P1|P2|P3
claim_scope: "受影响的具体宿主、workflow、出口或 artifact"
consequence: "不修复会发生什么"
evidence_status: confirmed|advisory|degraded
direct_evidence:
  - "<source/test/log path>"
root_cause: "<LLM judgment，必须与直接事实分开>"
owner: "<source owner>"
proposed_fix: "<最小 source-first 修复>"
validation: "<复验方式>"
re_evaluate_when: "<失效或重评条件>"
```

Severity 与 evidence status 独立：高风险 finding 也可能只有 degraded evidence，此时先补证据，不能凭严重性提高置信度。

### 11.3 Severity

- **P0 — Blocker：** 可导致未授权/不可恢复 mutation、source/runtime corruption、凭证泄露或虚假 verified/ship claim。
- **P1 — Critical：** 核心公开入口不可运行、五类退出 gate 缺失、evidence chain 断裂，或主要宿主能力被系统性误报。
- **P2 — Important：** 有明确 fallback 但 reason/diagnostic/consumer 行为不足，显著增加人工成本或误解风险。
- **P3 — Improvement：** 不影响正确性与可信 claim 的局部清晰度、性能或体验改进。

### 11.4 修复 handoff

- 审计本身不修 source。每个 P0/P1 finding 先指定 owner、最小修复、测试与回滚/停止条件，再路由到 `spec-plan` 或已有 validated plan 的 `spec-work`。
- 修复后只重跑受影响的最窄检查，再按影响面扩到 baseline；不得用修复前的 green log 关闭 finding。
- 用户可见行为或 source 变更按仓库规则更新 CHANGELOG/README/docs；generated runtime 只在另行授权时由 source-first `spec-first init` 刷新。
- 只有已验证、可复用并带 `source_refs` 与 `invalidation_condition` 的经验，才另行进入 `spec-compound`。

## 12. 成功标准与终止条件

### 12.1 审计完成

以下条件全部满足，才可称“审计完成”：

- Run manifest、source snapshot、授权、命令、exit code、日志与 limitations 可回源。
- L0–L3 每个计划 check 都有 `passed|failed|degraded|not-run|blocked`，无空白项。
- 五类 gate 均有 owner、consumer、enforcement level 与负向证据；未强制项响亮降级。
- 六宿主 projection、loader 与 workflow claim 分开，不用 projection test 冒充 field loader evidence。
- 历史 evidence 经过 freshness/source 复核；stale reference 被明确淘汰。
- 所有 P0/P1 有 owner 与 next action；审计过程中未夹带 source/runtime 修复。

### 12.2 系统结论

- **Mechanism qualified：** C0/C1 证据通过，五类 gate 没有未说明的 `missing`，degraded 路径有 reason code 与 fallback。
- **Field journey qualified：** 至少 J1 在真实任务、隔离 worktree 与真实 verifier 下达到 C3，且没有 unsupported completion claim 或未授权 mutation。
- **Incremental value qualified：** 至少一个预注册 comparator 支持 C4；否则必须写“增量价值未验证”，即使 mechanism audit 与 field journey 已通过。

缺 worker、真实宿主、外部凭证或 comparator 授权时，审计仍可按计划完整报告 `not-run/blocked`；但对应 C2–C4 结论保持未验证，不能用“degraded-by-design”掩盖证据缺口。

## 13. 风险与控制

| 风险 | 控制 |
| --- | --- |
| 审计范围膨胀为全仓逐文件 review | 以链路、gate、owner 与 consumer 覆盖为主；inventory 明示抽样与排除 |
| 当前会话缓存旧 Skill 定义 | source 直接读取；fresh reviewer 只在授权和 fresh context 可证时运行 |
| 隔离不充分污染全局/工作树 | 临时 prefix、现有 lifecycle harness、disposable worktree；禁止全局安装和真实 source drift |
| 大量测试制造虚假信心 | 使用 claim ladder；fixture 只支持 C0/C1，真实任务与 comparator 分别支持 C3/C4 |
| 历史报告过时 | 每条历史 claim 复核 source、freshness 与 invalidation condition |
| Provider 图谱被当作事实 | 仅作 advisory navigation，结论回源到 source/test/log/contract |
| 发现问题后边审边修导致证据污染 | 审计与修复分离；修复进入新的 owner workflow 和新的 source snapshot |

## 14. 预计投入

- Phase 0–3 + Phase 5–6：约 8–13 小时，可完成 mechanism audit。
- J1：约 1–2 小时；J2：约 2–4 小时。
- J3：单独预算，预计 4 小时以上或跨 session；默认不纳入首轮完成条件。
- 真实宿主/外部系统 journey 的等待时间不计入以上估算，并受单独授权约束。

## 15. 参考依据

- 角色与演化基线：`docs/10-prompt/结构化项目角色契约.md`
- Source/runtime：`docs/contracts/source-runtime-customization-boundary.md`
- Context/audit artifact：`docs/contracts/context-governance.md`
- Artifact summary：`docs/contracts/artifact-summary.md`
- Verification：`docs/contracts/verification/verification-run-summary.md`
- Knowledge：`docs/contracts/knowledge/knowledge-harness.md`
- Provider readiness：`docs/contracts/provider-readiness.md`
- Project graph consumption：`docs/contracts/project-graph-consumption.md`
- Fresh-source eval：`docs/contracts/workflows/fresh-source-eval-checklist.md`
- Runtime capabilities：`docs/catalog/runtime-capabilities.md`
- 历史验证输入：
  - `docs/validation/2026-07-30-ce-3-20-skill-script-reconciliation.md`
  - `docs/validation/2026-07-31-spec-plan-skill-up-eval.md`
  - `docs/validation/2026-07-30-external-evidence-closure-ledger.md`
