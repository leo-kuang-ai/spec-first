# Spec Work 质量能力闭环实施验证报告

> Date: 2026-07-16  
> Plan: `docs/plans/2026-07-16-003-refactor-spec-work-quality-capability-closure-plan.md`  
> Branch: `leo-2026-07-16-plan-update`  
> HEAD: `5a4308b09b0ab9231df209b8d72a7f9161b96a7a`  
> Artifact type: confirmed current-source implementation evidence + deterministic test evidence + generated-runtime observation  
> Mutation state: local worktree only；未 commit、未 push、未创建 PR  
> Review posture: inline simplify/manual diff review；`not_run: dispatch_authorization_missing` for delegated/fresh-source/independent reviewer execution

## 结论

`2026-07-16-003` 的 U1-U8 已完成 current-source 实施与本地验证：task-pack identity/intake、task-scoped report-only review、repo/scope/source-runtime/authorization、structured verification、architecture/feedback/simplification、Front Controller 分层、五宿主 runtime adoption、文档与 lifecycle closeout 均已有明确 owner、consumer 和回归证据。

本报告支持的结论是：

- `spec-plan -> spec-write-tasks -> spec-work -> spec-code-review -> verification/knowledge` 的 source contract 已重新闭合；
- `spec-work` 保留当前分支 unified-plan、Markdown/HTML、knowledge-work、execution engines、proof/characterization、Return-to-Caller 和 caller-owned review-fix 优势，同时吸收了 `master` 中仍有效的治理能力；
- `spec-debug`、`spec-code-review` 只接入共享安全、授权、证据与 handoff 能力，没有被改造成 `spec-work` 的副本；
- generated runtime 已由 canonical source 重建，五宿主均能生成 required skill/reference surface；
- deterministic tests、typecheck、skill lint、full test、AI gate 和 package build 均形成当前 worktree 证据。

本报告不支持以下更高层结论：

- 不证明 fresh session 中模型一定加载、触发并稳定遵守全部 references；
- 不证明 persona/validator/cross-model 独立审查已执行；
- 不证明 Cursor/Kiro/Qoder loader、hook、MCP 或外部 provider 已具备完整 field readiness；
- 不证明 CI、merge、release、用户采用或质量指标提升已发生。

## 1. 执行边界与证据层级

### 1.1 Run boundary

| 维度 | 当前事实 |
| --- | --- |
| `target_repo` | `/Users/kuang/xiaobu/spec-first` |
| Branch / HEAD | `leo-2026-07-16-plan-update` / `5a4308b09b0ab9231df209b8d72a7f9161b96a7a` |
| Canonical owners | `skills/`、`src/cli/`、`scripts/`、`docs/`、`tests/`、README、CHANGELOG |
| Generated runtime | `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`；只由 `node bin/spec-first.js init` 重建 |
| Pre-existing / concurrent ownership | 保留 `docs/plans/2026-07-16-002-refactor-agent-skills-capability-integration-plan.md` 与其 Changelog 条目；本报告不把它们归因于本计划 |
| Worker dispatch | missing authorization；所有收尾、simplify、review 与验证均 inline/serial |
| Commit / landing | `commit_authorization: missing`；`landing_authorization: missing` |
| Graph providers | CodeGraph 用于 source 导航；Graphify 仅在显式 `--graph .graphify/graph.json` 后可查询，输出只作 advisory navigation |

### 1.2 证据层级

| 层级 | 本轮状态 | 可以证明 | 不能证明 |
| --- | --- | --- | --- |
| Current source | confirmed | prompt、CLI、schema、consumer、owner 和 fallback 当前存在 | 模型一定执行正确 |
| Deterministic tests | confirmed | 字段、路径、hash、projection、contract、helper 与 lifecycle 不变量 | 语义判断稳定性、真实工程质量 |
| Generated runtime projection | confirmed | canonical source 可生成五宿主 required assets | 宿主一定发现/加载/调用 |
| Doctor observation | confirmed with warnings | 当前机器上的 managed runtime shape 与已知 host readiness | 外部 MCP、hook event、真实 user journey |
| Fresh-source semantic eval | `not_run: dispatch_authorization_missing` | 无 | paired replay、独立模型判断稳定性 |
| Independent code review | `not_run: dispatch_authorization_missing` | 无 | persona/validator/cross-model coverage |
| Field outcome | not run | 无 | 采用率、缺陷率、速度或质量指标改善 |

## 2. U1-U8 实施与验证

### U1. Task-pack identity 与 artifact-root CLI contract

**实现结果**

- executable identity 改为 artifact-root-relative POSIX `source_plan` + canonical body `source_plan_hash`；
- `spec_id` 降为 compatibility trace：双侧存在且不一致仍是 `wrong_chain`，缺失只产生 `task-pack-spec-id-trace-missing` limitation；
- `tasks hash` 与 `tasks validate` 均支持 `--repo <artifact-root>`，相对 operand 不再依赖 caller cwd；
- 拒绝 root 缺失/非目录、path escape、task-pack symlink escape、source-plan symlink escape、重复 `source_plan`；
- validation JSON 返回 `identity_basis`、`artifact_root`，保留 same-value `repo_root` compatibility alias，但明确它不是 mutation authority；
- generated runtime denylist 复用 `target-repo` owner，避免 task target 指向 host mirrors。

**Source / tests**

- `src/cli/commands/tasks.js`
- `src/cli/task-pack.js`
- `src/cli/helpers/target-repo.js`
- `skills/spec-write-tasks/**`
- `tests/unit/task-pack-command.test.js`
- `tests/unit/spec-write-tasks-contracts.test.js`
- `tests/unit/target-repo-containment.test.js`

**验证结论**

- no-`spec_id`、matched/mismatch、stale、parent-root、relative operand、path/symlink escape、duplicate source owner、generated runtime target 均有 deterministic coverage；
- CLI validator只证明 identity/freshness/structure，不承担 task semantic quality。

### U2. Task-scoped `spec-code-review mode:agent`

**实现结果**

- 增加成对 `task-pack:`、`task:`、`task-context:` intake；task mode 必须同时带 `mode:agent` 与 `base:`；
- `spec-code-review-task-context/v1` 固定 pack digest、source plan、work-run base、pre-task dirty/untracked/file facts、task delta 和 task-owned untracked；
- review bundle 区分 `exact-file`、`cumulative-file`、`mixed`、`degraded`；task-owned新文件以 full-addition 进入，pre-existing untracked 保持排除；
- digest drift、scope expansion、unknown task、unattributed delta、current hash drift fail closed 或降级，required gate 不可放行；
- `mode:agent` 始终 report-only；`actionable_findings` 是 apply handoff，triage group 不成为 apply queue；
- OS-native `REVIEW_ARTIFACT_DIR` 一次解析并由 persona、validator、cross-model、report writer 和 downstream caller复用；artifact 不可写时保留 in-band JSON；
- session-temp artifact 只在当前 run 内有效，跨会话 consumer 必须使用 repo-local sanitized copy 或 structured summary + limitation。

**收尾审查修正**

- 无 dispatch 时的 inline fallback 现在明确执行 Stage 2/2b 后再 synthesis；
- fallback 仍解析 run-id/artifact path、归一化 stable findings，使用 `reviewers: ["inline-fallback"]`；
- fallback 返回 `status: degraded`、`verdict: Not ready`，不冒充 persona/validator/cross-model coverage；
- `spec-work` shipping 在收到 `dispatch_authorization_missing` / `subagent_capability_missing` 时保留 inline findings，同时执行显式 manual diff scan；required task review 仍保持阻断。

**Source / tests**

- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/{subagent-template,diff-scope,review-output-template,cross-model-review}.md`
- `skills/spec-code-review/scripts/cross-model-adversarial-review.sh`
- `tests/unit/spec-code-review-contracts.test.js`
- `tests/unit/spec-work-consumer-chain-contracts.test.js`

### U3. `spec-work` task-pack executable intake

**实现结果**

- Phase 0 按 `mode token -> file metadata -> task pack -> unified plan -> legacy/knowledge-work -> bare prompt` 分类；
- task-pack branch 使用 `work-intake-and-task-pack.md`，实际要求运行 `tasks validate/hash --repo`，固定 validation receipt、pack digest、source-plan hash、artifact root 与 work-run base；
- body hash 外独立重放 source-plan readiness/content-shape gate，避免 frontmatter drift 被 hash 忽略；
- deterministic floor 通过后由 LLM 判断 Task Cards/Waves 与 source plan scope/non-goals/KTD/verification 的 semantic fit；
- tracker 只消费 validated `Task Pack Contract.tasks` / `execution_waves`，不从 plan 或 human-readable cards 重拆第二套 task graph；
- 每个 task/review 前重查 pack/source drift 与 `stop_if`；required review 在 dependent wave 前关闭，最多 initial + one follow-up；
- task pack 保持 `status: derived`，source plan 持有 scope、lifecycle 和 final completion candidate。

**Source / tests**

- `skills/spec-work/references/work-intake-and-task-pack.md`
- `skills/spec-work/SKILL.md`
- `skills/spec-write-tasks/references/execution-handoff-contract.md`
- `tests/unit/spec-work-intake-contracts.test.js`
- `tests/unit/spec-work-consumer-chain-contracts.test.js`
- `tests/integration/plan-status-closeout.integration.test.js`

### U4. Repo、scope、source/runtime 与 authorization

**实现结果**

- `execution-strategy.md` 统一 target repo、current HEAD/branch、dirty overlap、canonical source、necessary discovered file 与 scope-changing discovery；
- worker dispatch authorization、callable capability、workspace isolation 三轴分离；permission settings 不等于授权；
- unknown isolation 按 shared-directory；same-file/shared schema/config/lockfile/environment singleton 串行，只有 disjoint write set 才可 bounded parallel；
- local mutation、commit、landing、lifecycle、durable evidence 分离；workers 不 commit，Return-to-Caller 不 commit/push/PR；
- `spec-debug` 的 `Fix it now` 只授权 bounded local fix，不再因 skill-created branch 自动 commit/PR；
- `spec-code-review` 普通/default 与 `mode:agent` 都默认 report-only，只有明确 review-and-fix 才可 apply，commit 另行授权；
- 三个 high-risk workflow 统一消费 Scenario Capability，并明确 foreign residual、optional evidence、non-git build 的降级/阻断语义。

**Source / tests**

- `skills/spec-work/references/execution-strategy.md`
- `skills/spec-debug/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `docs/contracts/workflows/scenario-capability-matrix.md`
- `tests/unit/spec-work-execution-strategy-contracts.test.js`
- `tests/unit/spec-debug-contracts.test.js`
- `tests/unit/spec-code-review-contracts.test.js`
- `tests/unit/scenario-capability-matrix-contracts.test.js`
- `tests/unit/target-repo-containment.test.js`

### U5. Structured verification、honest closeout 与 run evidence

**实现结果**

- `spec-work` shipping 固定 verification profile/run-id/candidate checks，在 simplify/review mutation 停止后执行最终 commands；
- command evidence 记录真实 command、ran、exit code、status、required/missing tools、reason code 与 repo-relative redacted log；
- `verification-run-summary record --workflow spec-work` 写 immutable summary；
- `honest-closeout validate` 校验 structured claims，不允许 cherry-pick passing checks 隐藏 failed/not-run/degraded；
- durable trigger 按 task-pack、not-run validation、deferred follow-up、substantive work 顺序决定是否写 `spec-work-run-artifact/v2`；
- `spec-debug` 使用 `--workflow spec-debug`；`spec-code-review` 只为自己真实执行的 targeted commands 写 evidence；两者不拥有 spec-work run artifact；
- diagnosis-only debug 收尾改为 `honest_closeout_verdict: not-run`，不伪造 validator 的 `degraded` verdict；
- session-temp review evidence 在需要 durable handoff 时只物化 caller 实际消费的 sanitized `review.json`/summary，失败保留 `review-evidence-copy-failed` limitation。

**Source / tests**

- `skills/spec-work/references/shipping-workflow.md`
- `skills/spec-debug/SKILL.md`
- `skills/spec-code-review/SKILL.md`
- `docs/contracts/verification/verification-run-summary.md`
- `docs/contracts/workflows/honest-closeout.{md,schema.json}`
- `docs/contracts/workflows/spec-work-run-artifact.schema.json`
- `tests/unit/{verification-run-summary,honest-closeout,spec-work-run-artifact-contract,spec-work-run-artifact-producer,spec-work-shipping-contracts}.test.js`
- `tests/integration/spec-work-closeout-producer.test.js`

### U6. Architecture、胶水、feedback 与 simplification

**实现结果**

- `feedback-and-tests.md` 持有 smallest feedback loop、vertical slice、proof/characterization、test discovery、scenario completeness、system-wide check、surface-specific verification 与 replacement evidence；
- `implementation-quality.md` 在 durable surface mutation 前盘点 current owner，并在 `reuse / extend / compose / new` 中重查 plan fit；
- thin glue 只拥有 representation translation、sequencing/orchestration、participant failure/partial-failure propagation、rollback/fallback/degradation routing、cross-step observability/evidence 与 authorization/safety seam；
- thin glue 不拥有 duplicated domain truth、validation rule 副本、parallel durable state、吞错或 future-only convenience API；
- 拒绝 wrong-owner reuse、future-only wrapper 和 generic best-practice-as-authorization；
- simplification 固定 `remove-now`、`minimality-debt`、`protected`、`architecture-mismatch`，不为 LOC 删除 security、data integrity、privacy、a11y、observability、rollback、compatibility 或 required verification；
- work/debug/review 恢复 Anti-Rationalization Red Flags，共享 contract 明确它是 attention prompt，不是 gate、approval 或状态机；
- 三个 workflow 均有 source-only eval examples，覆盖正向与负向语义。

**Source / tests**

- `skills/spec-work/references/{feedback-and-tests,implementation-quality}.md`
- `docs/contracts/workflows/anti-rationalization-pattern.md`
- `skills/{spec-work,spec-debug,spec-code-review}/evals/examples.json`
- `tests/unit/spec-work-implementation-quality-contracts.test.js`
- `tests/unit/anti-rationalization-contracts.test.js`
- `tests/unit/eval-fixture-contracts.test.js`

### U7. Front Controller 与 prompt slimming

**实现结果**

- `spec-work/SKILL.md` 境内保留 Workflow Contract Summary、Reference Trigger Map、P0 hard exits、两个 triggered STOP anchors 与完整 Phase spine；
- 9 个核心 runtime references 均有 `Owned` / `Not Owned` / `Trigger` / `Fallback`；
- plugin high-value anchors 从历史 monolith substring 迁移到当前 front-controller/reference owner；
- 五宿主 projection tests覆盖 intake、strategy、engine、feedback、implementation quality、shipping、review followup 与 tracker；
- `evals/**` 不进入五宿主 runtime projection。

**体积证据**

| Surface | Before | U7 / final source | Delta |
| --- | ---: | ---: | ---: |
| `skills/spec-work/SKILL.md` lines | 462 | 288 | -174 |
| `skills/spec-work/SKILL.md` bytes | 49,968 | 34,149 | -15,819 |
| Entry + 9 core references lines | 1,615 | 1,570 | -45 |
| Entry + 9 core references bytes | 151,806 | 142,407 | -9,399 |

本结果证明 source 结构与 hot-path 体积变化；不证明 host context window、模型遵循率或 field productivity 已提升。

### U8. Docs、runtime adoption、validation 与 lifecycle

**实现结果**

- README、README.zh-CN、用户手册与 runtime catalog 已同步 task-pack chain、task review、architecture recheck、structured closeout 与 authorization boundary；
- 原 `2026-07-07-001` 方案保持历史内容，canonical status 为 `superseded`，并指向本方案；
- current-vs-master 分析报告增加 implementation closure addendum，不把原始分析阶段与实施结果混为一谈；
- 本报告逐 U1-U8 记录 source、tests、runtime、limitations 与 lifecycle；
- current checkout 已重建 Claude、Codex、Cursor、Kiro、Qoder runtime；generated mirrors 未作为 source patch；
- `CHANGELOG.md` 按 U1-U8 逐步保留实施记录，并新增最终 closure 条目；
- plan lifecycle 最终仅通过 deterministic `internal plan-status complete` 完成。

## 3. Runtime adoption

### 3.1 Init

实际命令：

```text
node bin/spec-first.js init --claude --codex --cursor --kiro --qoder -y --lang zh --no-sync-user-language
```

结果：

- 5/5 hosts ready；
- Claude：17 commands / 12 standalone skills / 17 workflow skills；
- Codex：29 skills；
- Cursor：29 skills；
- Kiro：29 skills；
- Qoder：17 commands / 29 skills；
- init 检测到旧 runtime drift，并先执行 managed hard reset 后重建；
- 所有写入均来自 current checkout generator；未手改 runtime mirror。

### 3.2 Projection reachability

Runtime-required `spec-work` references：

- `work-intake-and-task-pack.md`
- `non-code-execution.md`
- `execution-strategy.md`
- `execution-engines.md`
- `feedback-and-tests.md`
- `implementation-quality.md`
- `shipping-workflow.md`
- `review-findings-followup.md`
- `tracker-defer.md`

五宿主检查结果：

```json
{
  "hosts": 5,
  "missing": [],
  "bad": []
}
```

`skills/spec-work/evals/**`、`skills/spec-debug/evals/**`、`skills/spec-code-review/evals/**` 均未进入 generated host runtime。它们仍属于 npm source package 的维护者/eval 资产；本报告不声称它们被 npm package 排除。

### 3.3 Source/runtime hashes

| Surface | SHA-256 | 说明 |
| --- | --- | --- |
| canonical `spec-work/SKILL.md` | `47868ba8e9358ee890562e84e850ac40d1a52913d1ec25835226e2b9ee372044` | source |
| Claude work runtime | same as canonical | byte-identical |
| Codex work runtime | same as canonical | byte-identical |
| Kiro work runtime | same as canonical | byte-identical |
| Qoder work runtime | same as canonical | byte-identical |
| Cursor work runtime | `c819797331eec345389bc77e6c1e14a838ba432327bde6f1c27b791c6ca8534c` | Cursor frontmatter projection，语义 owner markers保留 |
| canonical `spec-debug/SKILL.md` | `d9166684a502a3d730e4ee6a0c4cde81013bd15c10d6c7daf1c3d53a1c60c5f3` | source |
| canonical `spec-code-review/SKILL.md` | `86144d2c3f4203a1f2cafce38e4588139caa7b0156837b9d19741c9c0d23e7e4` | source |

`spec-debug` 在 Cursor/Kiro/Qoder 可因 host-specific transform 产生不同 bytes；五宿主均确认包含 `honest_closeout_verdict: not-run`。`spec-code-review` 五宿主均确认包含 `Inline fallback output contract`。

### 3.4 Doctor

所有 doctor 命令 exit 0：

- Claude、Codex：全部 managed runtime checks PASS；
- Cursor：CLI 不在 PATH、generated-runtime loader 未确认、多个 compatibility/worktree duplicate skill warnings、MCP config 缺失；
- Kiro：CLI 不在 PATH；
- Qoder：hook authenticated execution/shared IDE loader 未验证，settings entries 保持未启用，local MCP config 缺失。

这些 warning 是当前 host readiness limitation，不是 source/projection failure。

## 4. Final verification

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Plan focused gate | 21 suites / 159 tests passed | U1-U8 direct contracts/helpers/integration |
| `npm run typecheck` | passed；179 files | JS syntax/check surface |
| `npm run lint:skill-entrypoints` | passed；309 files | skill entrypoint governance |
| `npm run test:unit` | 117 suites / 1090 tests passed | deterministic unit/contracts |
| `npm run test:integration` | 6 suites / 21 tests passed | current integration inventory |
| `npm test` | unit 117/1090 + smoke 1/5 + integration 6/21 passed | repository main test chain |
| `npm run test:ai-dev:gate` | 39 suites / 393 tests passed | focused workflow/runtime contract gate |
| `bash -n skills/spec-code-review/scripts/cross-model-adversarial-review.sh` | passed | shell syntax only |
| `npm run build` | passed；666 files，约 1.8 MB packed / 6.4 MB unpacked | 首次sandbox run因用户级npm cache `EPERM`失败；允许cache访问后通过。仅证明package content |
| `git diff --check` | passed | whitespace/conflict-marker style check |
| Five-host init | 5/5 ready | projection only |
| Five-host doctor | all exit 0 with named warnings | local readiness observation |

## 5. Inline simplify 与 review 结果

由于没有 worker/reviewer dispatch authorization，本轮没有调用 delegated persona、validator、cross-model 或 fresh-source reviewer；以下结论来自同一模型的 inline source/diff review，不能冒充 independent evidence。

### 5.1 Applied findings

| # | Dimension | Finding | Fix |
| --- | --- | --- | --- |
| 1 | quality / owner | CE upstream test 仍绑定已从 `spec-work/SKILL.md` 迁出的旧 engine 原句 | 测试改为断言 front controller route 与 `execution-engines.md` owner semantic |
| 2 | quality / evidence | `spec-debug` diagnosis-only 未运行 validator，却要求 `degraded` verdict | 改为 `honest_closeout_verdict: not-run` + explicit limitation |
| 3 | quality / fallback | `spec-code-review` inline fallback 在 run-id/artifact/finding normalization 前直跳 Stage 6 | 补完整 fallback output contract、stable findings、Not-ready ceiling 与 run-id/artifact setup |
| 4 | integration / review | `spec-work` shipping 未把 dispatch authorization/capability 降级接入 manual review fallback | 保留 bounded inline findings，执行 manual diff scan，不冒充 independent coverage；required task gate仍阻断 |

### 5.2 Skipped / retained

- `tasks.js` 与 `task-pack.js` 中少量 `realpath` / containment logic 语义相近，但 owner/context 不同且当前 duplication 很小；未为了复用 quota 新建 shared wrapper；
- security/path containment、secret deny、generated runtime denylist、review evidence sanitization、required verification 均归类为 `protected`；
- 未发现 hot-path N+1、unbounded memory、recurring no-op update 或可安全并行化的 runtime inefficiency；
- 未执行与本计划无关的 broad cleanup，也未修改并行所有的 `2026-07-16-002` 方案内容。

### 5.3 Simplify outcome

- applied: 4（reuse 0、quality 3、integration/ownership 1、efficiency 0）；
- skipped as not worth / protected: 2 classes；
- behavior/source contract preservation：focused、unit、integration、full test、AI gate、typecheck、skill lint 均通过。

## 6. Plan / DoD trace

| DoD area | Status | Evidence / limitation |
| --- | --- | --- |
| Task-pack identity and `spec_id` compatibility | passed | U1 CLI/tests |
| Validated pack intake / Tasks / Waves | passed at source-contract layer | U3 reference/tests；fresh-source execution未运行 |
| Required task review attribution | passed at source-contract layer | U2 task context/tests；真实 delegated task review未运行 |
| Repo/scope/source-runtime/authorization | passed | U4 source + negative contracts |
| Review/apply/commit separation | passed | review/debug/work contracts |
| Structured verification / honest closeout | passed at helper/integration/source layer | U5 tests；当前 run durable refs见下文 |
| Temp-to-durable review evidence | passed at source-contract layer | shipping/consumer tests；本轮无 temp persona artifact可物化 |
| Architecture composition / thin glue | passed at source-contract layer | U6 source/tests/evals；field decision quality未确认 |
| Feedback / vertical slice / simplification | passed at source-contract layer | U6 source/tests/evals |
| `spec-debug` / `spec-code-review` bounded integration | passed | focused contracts + final review fixes |
| Front Controller / reference reachability | passed | U7 size/projection tests |
| Runtime adoption | passed with host warnings | init/doctor/projection/hash evidence |
| Docs / catalog / README | passed | current source；final build/changelog checks |
| Old-plan supersession | passed | single `status: superseded` + `superseded_by` |
| Current plan lifecycle | `completed` / `plan-status-completed`（`active -> completed`） | deterministic helper only；marker不证明 CI/merge/release |

## 7. Structured closeout

| Field | Result |
| --- | --- |
| `verification_run_summary_ref` | `.spec-first/workflows/spec-work/spec-first/20260716-quality-capability-closure-final/verification-run-summary.json` |
| `honest_closeout_verdict` | `verified` / `all-claims-consistent` |
| `run_artifact_path` | `.spec-first/workflows/spec-work/spec-first/20260716-quality-capability-closure-final/run.json` |
| `run_artifact_reason_code` | `trigger-substantive-work` |
| `claim_limitations` | `dispatch_authorization_missing`；`fresh-source-semantic-not-run`；`independent-review-not-run`；Cursor/Kiro/Qoder host warnings；field outcome not observed |

`trigger-substantive-work` 命中原因：本轮跨 task-pack CLI、三个 workflow、verification helpers、runtime projection、docs 与 lifecycle，且经历 context compaction；若不保留 repo-local closeout evidence，跨会话丢失成本真实存在。

## 8. Remaining limitations and follow-up evidence

1. **Fresh-source semantic replay**：需要明确 delegated reviewer authorization 后，按 plan 的 10 类 cases执行 paired replay；当前为 `not_run: dispatch_authorization_missing`。
2. **Independent review**：当前只有 inline manual review；不得声称 persona/validator/cross-model consensus。
3. **Host loader**：Claude/Codex managed runtime检查通过；Cursor/Kiro/Qoder仍需 clean-session loader/user journey与 hook/MCP readiness evidence。
4. **Field outcome**：尚无 task completion time、review escape rate、false-green rate、context/token或用户采用数据。
5. **Npm package boundary**：`evals/**` 是 source package 资产并出现在 `npm pack --dry-run` 内容中；只确认它们不投影到五宿主 generated runtime。
6. **Graphify**：当前 CLI 默认仍寻找 legacy `graphify-out/graph.json`；本轮使用 `--graph .graphify/graph.json` 才获得 advisory query，未把 provider输出当 confirmed conclusion。
7. **Git/landing**：所有 verified changes 仍未提交；未 push、未开 PR，未运行 CI/merge/release。

## 9. Final hashes and lifecycle evidence

- Plan canonical body hash（frontmatter/lifecycle status 排除）：`sha256:cf5072e7cafdbc1d5bc40a490c8ff315b85d679cd1e4f91b6c346e74be18274d`；
- Canonicalization：`source-plan-body-v1`；
- Canonical body bytes：`96,781`；
- final plan lifecycle result：`completed` / `plan-status-completed`（previous status: `active`，changed: `true`）；
- final source/runtime/diff/build evidence：见本报告第 3、4、7 节。

## 10. Outcome boundary

本轮完成的是 **current-source quality capability closure**，不是发布：

```text
source implemented
  -> deterministic gates passed
  -> generated runtime rebuilt
  -> local doctor observed
  -> structured closeout recorded
  -> plan lifecycle closed

not yet:
  independent fresh-source replay
  -> clean-session host behavior
  -> CI / merge / release
  -> field outcome
```

只有左侧证据已确认；右侧保持明确未确认状态。
