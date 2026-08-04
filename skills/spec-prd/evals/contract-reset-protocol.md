# Contract Reset Gate A 协议

本协议冻结 `spec-prd` Contract Reset 的 Gate A 三臂比较。它只服务 source checkout 中的 maintainer eval，不投射到 host runtime，不是公开 workflow、通用 benchmark 平台或自动语义评分器。

## Authority 与裁决边界

- `run-contract-reset-arm.js` 强制 materialization、fresh session/order、hard-isolation probe 和 machine facts；没有可证明的硬隔离时不调用模型。
- `prepare-contract-reset-evidence.js` 负责确定性 blind transform、hash、严格 UTF-8、显式 secret/canary/credential deny、symlink-safe root confinement、private permissions 与版本化 raw cleanup allowlist；PII adequacy 由独立 evaluator attestation。
- `run-evals.js --run-dir` 只读验证 manifest、patch、materialization receipt、精确 schedule、attempted/completed session、isolation、custody 与 retained-evidence provenance/hash contract；它不 materialize、不调用模型、不裁决产品质量。
- 独立 blind reviewer 判断 Planning invention、Interaction waste 与 core product quality；当前 owner 判断 case-specific materiality 和 investment value。
- Fixture、脚本 exit 0、transcript 自述或多个 agent 一致都不能替代原 run outcome evidence。

## 结果前冻结项

`contract-reset-cases.json` 是冻结 source：

- arms：`baseline`、`phase1_control`、`candidate`；
- 每 arm/case 至少 3 次；
- create/refine/validate 是 `gate_a_primary`；design/domain/stress 是 `gate_a_critical`；trigger matrix 独立计分；
- 每个 primary case 的 `minimum_material_effect`；
- 全局 `maximum_complexity_budget`：mandatory state concepts、always-read references、canonical owners、hot-path reference reads 与 front-controller size；
- host/model/authority profile、balanced order、fresh-session、arm fail、paired retry、tie/no-go 与 inconclusive 规则；
- blind rubric：planning invention、interaction waste、actor/problem/outcome、why now、success evidence、right-size。

结果出现后不得修改这些字段来让 candidate 通过。任何阈值、case、source、candidate 或 model profile 变化都产生新 attempt。

## 三臂定义

| Arm | Materialization | 目的 |
| --- | --- | --- |
| `baseline` | `parent_revision` 的 allowlisted source | 复现 Phase 1 前完整旧行为。 |
| `phase1_control` | baseline + `control.patch` | Gate A rollout baseline；包含已验证的 Exit Safety。 |
| `candidate` | baseline + `control.patch` + `candidate.patch` | eval-only Contract Reset；不写入默认 source/runtime。 |

`source-manifest.json` 绑定 parent revision、cases hash、patch hash、allowlisted source files、每臂 tree hash、threshold hash、invocation profile、materialization verification receipt 与所有 session/order rows。Patch 只能触及 allowlist；`.env`、secret-like path、未跟踪 local-state、绝对/父级 path、外部 symlink 或未声明新增文件均 fail closed。Materialization receipt 以 `confirmed` 类型绑定三臂 patch chain/tree/source-file facts；run audit 必须一并保留，否则新 validator 结构失败。

## Namespace 与 Hard Isolation

每次 arm/repeat 使用独立 opaque namespace。生成 Agent 只能看到：

1. 当前 case 的 allowlisted inputs；
2. 当前 arm 的 materialized source snapshot；
3. 不含 arm/version/mapping/oracle/grade/holdout 的 `model-visible-manifest.json`。

Control plane 保存 owner-answer oracle、adjudication notes、grades、arm/version mapping 与 holdout metadata，不能出现在 namespace。

模型调用前后都运行 active probe，实际尝试读取：

- 绝对路径；
- 父目录 traversal；
- 指向 namespace 外的 symlink；
- control plane；
- sibling arm output。

所有 probe 必须由实际 filesystem namespace/强制 sandbox 拒绝。只有 cwd/prompt 限制、sandbox binary 存在但无法证明 enforcement、probe process 无法启动，均为 `inconclusive`；任一读取成功为 `invalid`。两者都必须保持 `model_invoked: false`，不能用 prompt 约定代替硬隔离。

## Fresh Session 与 Balanced Order

- 每一 `case_id + arm + repeat` 使用唯一 opaque `session_id` 和 fresh generic-agent process/context。
- Session ID 不编码 arm 名称；model-visible path 和 manifest 不出现 arm label、version mapping 或其他 arm output。
- 每个 case 的三个 repeat 使用冻结 Latin rotation；失败重试必须重跑整组三臂并保持平衡，不能只重跑较差 arm。
- 先前 arm 的 transcript、cache、output 或 context 一旦可见，整组 paired run invalid。

## Agent Invocation Template

Launcher 传递的中性任务模板只替换 case intent 和 model-visible input paths：

```text
读取当前 namespace 的 model-visible-manifest、source/ 与 inputs/。按照加载到的 spec-prd source，以给定 intent 产出本期 brownfield Product Contract 或 validate report。只使用当前 namespace；不要猜测不可见材料，不要读取其他路径，不要说明版本或比较对象。输出 artifact、最小 question/action event log 与自检事实；产品质量由独立 reviewer 裁决。
```

若当前 host 没有可在同一强制 sandbox 内调用的 fresh generic-agent command，launcher 返回 `agent_invocation_profile_not_configured` / `inconclusive`，不得改由当前长会话或共享 filesystem subagent 补跑。

## Blind Packet 与 Durable Evidence

每个成功 native output 由 `prepare-contract-reset-evidence.js` 使用同一 `contract-reset-blind-transform/v1` 处理：

- 只删除版本化 allowlist 中的 path、producer/version、arm、session/namespace/order、state/receipt identity；
- 保留其余 frontmatter 和 human-facing 正文 bytes/section order；
- 输出 sanitized Product Contract、arm-neutral `blind-packet.md`、最小 event log、grading notes 与 native/packet/body/event/grade hash；
- 非法 UTF-8、显式 credential/canary、quoted JSON secret 与未绑定 frozen provenance 在 durable write 前 fail closed；语义 PII 需 evaluator `passed` attestation；
- run/evidence 目录权限为当前用户专属（directory `0700`，file `0600`）；
- durable write 成功后只删除版本化 allowlist 中的 provider raw log、完整 transcript、敏感 payload 与 temp workspace；run root、durable output、retained inputs、重叠路径、symlink ancestor 和任意未声明 target 均拒绝，显式保留必须有 authority 与 expiry。

Durable `run-audit-manifest.json` 是 `generated` enclosing bundle，并为 source manifest、materialization receipt、patch、holdout 与 run facts 分别记录 hash 和 `generated` / `confirmed` / `degraded` 类型；若 `completed_sessions[*].retained_evidence` 存在，还必须按原 run-relative path 保留 retained manifest、sanitized Product Contract、blind packet、event log 与 grading notes，并记录各自 hash 和 artifact type。结构通过仍只确认确定性地板。

必要 evidence 无法安全脱敏时 Gate A 为 inconclusive，不能只保留聚合分数。

## 独立评分与 Gate A 决策

Blind reviewer 只接收随机化的 blind packets；native artifact 只交 independent planner usability 与 deterministic topology/receipt audit。

使用 per-case median：

1. candidate 在 create/refine/validate 中至少 2 个达到结果前冻结的 material effect；另一 primary 不退化；
2. core product rubric 总体至少与 `phase1_control` 持平且无新 fail；
3. design/domain/stress 与三项 Non-regression 零失败；
4. complexity 不超过冻结预算；
5. 无 isolation、session、identity 或 evidence contamination；
6. candidate 只优于 baseline、不优于 phase1_control，或 tie，均为 no-go。

脚本可报告 `awaiting-semantic-review`，但不能自行写“Gate A passed”。最终 Gate A report 必须由 reviewer/owner 绑定原 run retained-evidence hashes 后裁决。

## Promotion Holdout Commitment

Gate A 前，独立 custodian 应在 repo/worktree 与生成 Agent workspace 外，使用现有 OS/host access-restricted encryption primitive 保存 6–10 个 sealed holdout cases。Commitment 只记录 bundle hash、attempt/candidate/source hash、opaque custody ID、custodian、retention authority 与 expiry，不记录内容、expected notes 或 mapping。

若当前宿主无法提供与实现者隔离的真实 custody boundary，commitment 必须写 `commitment_status: unavailable` 与 reason code，Gate A/Promotion 保持 inconclusive。不得生成一个同用户可读的“加密文件”并把它冒充独立 custody。

`commitment_status: committed` 只有在 `attempt_id`、candidate/source tree hash 与 frozen source manifest 精确一致，`bundle_hash` 为合法 SHA-256，且 opaque custody ID、custodian、retention authority 与 canonical ISO expiry 全部存在时才是结构有效；stale 或任意字符串 commitment 必须 structural fail，不能移除 custody inconclusive reason。

## Replay

另一名 operator 只需 repository checkout、`source-manifest.json`、`control.patch`、`candidate.patch`、cases、invocation profile 和 retained evidence，即可：

1. 从 parent revision 重建三臂；
2. 校验 patch/case/threshold/tree hash；
3. 校验 session/order、root confinement 与 isolation facts；
4. 对至少一个真实 case 使用相同 invocation template 重放；
5. 重新生成 blind packet/hash并与 retained manifest 对比。

Replay 证明协议可重放，不替代原 run grade、原 output 或 retained-evidence hash。

## 命令

```bash
node skills/spec-prd/evals/run-evals.js --json
node skills/spec-prd/evals/run-evals.js --run-dir <run-dir> --json
node skills/spec-prd/evals/run-evals.js --run-dir <durable-audit-dir> --require-run-audit --json
node skills/spec-prd/evals/run-contract-reset-arm.js --materialize-only --repo-root <repo> --run-dir <run-dir> --manifest <source-manifest.json> --arm <arm> --destination <namespace/source>
node skills/spec-prd/evals/run-contract-reset-arm.js --probe-only --namespace-root <namespace> --control-path <control> --sibling-path <sibling> --symlink-path <probe-symlink> --json
node skills/spec-prd/evals/prepare-contract-reset-evidence.js --run-root <run-dir> --native-output <native-output.json> --out-dir <evidence-dir> --cleanup --json
node skills/spec-prd/evals/prepare-contract-reset-evidence.js --run-audit --run-root <run-dir> --out-dir <durable-audit-dir> --cleanup --json
```

## 合法停止

任一 hard isolation、replay、security、custody、原 run audit 或 independent outcome review 缺失时，Gate A 是 `inconclusive` 或 `no-go`。保留已验证 Phase 1 和 U6 maintainer evidence，默认 runtime 不变，不创建 U7-U13 source patch、migration manifest 或 rollback closure；只有新的合规 outcome evidence 才能重开。
