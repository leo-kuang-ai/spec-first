# Delivery Gates

本 reference 只在 `validate-only`、写入前验证、package readiness 或 closeout 时读取。Gate 随实际风险增长，不按固定 maturity 标签堆叠文件。

## Base Mechanical Gate

所有 package 先运行 bundled validator。先从当前已加载 `SKILL.md` 解析 package root 的绝对路径并记作 `SKILL_DIR`；不要依赖宿主预设同名环境变量：

```bash
node "$SKILL_DIR/scripts/validate-skill.cjs" <skill-dir> --json
```

它只确认可机械判断的事实：路径 containment、no-follow inventory、frontmatter subset、名称/长度、引用、symlink/special file、资源和脚本清单。结果：

- `pass` / exit 0：未发现 blocking mechanical finding；
- `fail` / exit 1：确认 package mechanically invalid；
- `incomplete` / exit 2：输入不可读、超预算或 YAML/文件类型超出 validator 能力。

`pass` 不等于语义正确、安全或 package-ready。

## Apply Preview Gate

create/revise apply 在写前生成 run-local preview manifest、host scope 与 exact candidate write set，并运行 `validate-authoring-preview.cjs`。它验证 hash/snapshot、path set、collision、source/runtime boundary 和 host binding；它不证明真实用户授权、Brief 质量或 patch 语义。宿主必须重新确认授权，并使用原子 expected-old-hash / expected-nonexistence conditional patch primitive；没有该能力时 mutation readiness 必须为 `not-ready`，不可 apply 或声明确定性 gate 已关闭。写后 receipt 必须逐 path 核对 after hash；partial failure 只报告当前 diff、changed/unchanged 和 rollback preview，不自动回滚。

## Risk-Triggered Checks

| Signal | Additional evidence |
| --- | --- |
| description / route 变化 | realistic positive、negative、near-neighbor fixtures；需要声明行为充分性时运行 fresh-source semantic sample，runner 不可用则记录 `not_run` 与原因 |
| persona、few-shot、输出合同或 agent loop 变化 | good/bad/why 或等价边界样例；成功路径、近邻错误、主要 failure mode 的 fresh-source sample；完成/停止声明与直接证据对应 |
| 新增或移动 reference | 每个 runtime reference 有明确 pointer；validator 引用检查通过 |
| 新增 script/shell | syntax/unit test、输入/输出/权限/失败行为；确认不读取 secret、不越出授权 root |
| 外部或未知 package | validate-only、no-follow inventory、零 package-code execution；无法确认 provenance 的 validator 不运行 |
| same-repo migration | 每个未知文件有 disposition；写前后 realpath containment 复核 |
| target-specific metadata | 读取 target profile，记录 source、核对日期、limitations 和实际 target evidence |
| project governance/catalog/runtime | 读取 project profile；先改 source/governance，再运行 generator/init，不手改派生物 |
| 高权限/network/外发/不可逆行为 | explicit-only intent、最小权限、允许数据/目的地、secret redaction、确认点与 rollback |
| 可分发 package | 实际 target payload smoke；确认 runtime 不依赖 `evals/`、reports 或 repo-local docs |

## Trusted Validator Boundary

只运行以下 validator：

- 本 Skill bundled 的 `scripts/validate-skill.cjs`；
- 来源、版本和调用方式已固定并可回源的官方工具；
- 用户明确授权且经过 trust review 的其他工具。

不得因为目标 package 内存在 `quick_validate.py`、`validate.sh`、package script 或 hook 就执行。未知工具只记录路径和 `not_checked_with_reason`。

## Eval Evidence

按实际证据类型报告，不维护 maturity 等级：

- `not_run`：没有执行对应评测，附原因；
- `structural-only`：fixture/schema/contract test，只证明结构与期望被消费；
- `fresh-semantic`：fresh-source 单版本真实请求样例；
- `comparative`：与固定 baseline/previous version 的对照；
- `field-outcome`：代表性真实任务与用户结果。

Route fixture 至少覆盖 positive、negative/near-neighbor、只读边界和一个主要 failure mode。复杂 prose 的输出评测应检查真实 artifact/response 是否满足判据，不接受“我已遵守指令”、隐藏自检或 checklist 勾选作为通过依据。没有 model runner 时不能把 structural-only 写成触发率或行为改善。

## Five-Axis Readiness

Closeout 分别报告，不能合成模糊总分：

- `portable`：portable package 结构和行为合同；
- `target`：指定宿主 metadata、invocation、packaging；
- `project`：本地规则、治理、catalog、source/runtime；
- `semantic`：route/output 行为证据；
- `mutation`：授权、containment、preview/diff 与 rollback。

每轴使用 `ready|degraded|not-ready|not-applicable`，并附直接证据或限制。

## Spec-First Project Closeout

只有目标项目确认为 spec-first 时应用：

1. 修改 `skills/`、governance、templates/tests/docs 等 source。
2. Runtime catalog 由 `npm run docs:runtime-catalog` 生成；它不是 source-owned consumer。
3. Host runtime 只通过 `spec-first init` 投影；不得手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`。
4. 运行与影响面匹配的聚焦 Jest、`npm run lint:skill-entrypoints`、`git diff --check`，再按需扩大。
5. Source 变更更新 `CHANGELOG.md`；用户可见定位变化再更新 README/docs。

## Closeout Envelope

- `base_operation`、`effect`、`modifier`、`layer_result` 和 target/source owner；
- `changed_surfaces` 与明确未修改 surfaces；
- `deterministic_checks`；
- `eval_adequacy` 与实际 semantic/comparative evidence；
- five-axis readiness；
- generated catalog/runtime 状态；
- `not_checked_with_reason`；
- residual risks 和下一步。
