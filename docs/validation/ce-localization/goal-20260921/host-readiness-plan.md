# 八宿主真实调用最小验证计划

本计划复用现有 Runtime Setup producer、skill-up 与 review fixtures。2026-09-21 本 worker 仅执行本地版本/安装观察、帮助读取和 eval validate/list-cases；真实宿主加载、模型执行、GUI 与 field 本阶段均未运行。

安装实测见 [host-installation-observation.json](host-installation-observation.json)：Claude 2.1.278、Codex 0.155.1、OpenCode 1.18.9、Pi 0.85.0、Qoder CLI 1.0.41；Cursor GUI 3.19.7、Kiro 1.1.14、Qoder 1.20.1 / CN 1.6.0、ZCode 3.11.2。没有 cursor/kiro/zcode PATH 命令不代表 GUI 不可验证。Skill-up 0.12.0 可用。

## 复用入口与证据边界

- 宿主集合：`src/cli/adapters/index.js#getSupportedPlatforms()`。
- 原生 receipt：`skills/spec-runtime-setup/scripts/lib/host-authority.cjs#resolveHostAuthority/buildInvocationReceipt`；schema 为 `docs/contracts/verification/host-invocation-receipt.schema.json`。使用真实已加载 `skill_root`、真实宿主 pin、准确 target，且 `enforceSurfaceBinding=true`。
- Receipt 只验证 root 与 pin 相容，不能单独证明 GUI/CLI 实际加载、真实模型执行、任意 workflow 成功或 field 收益。共享 `.agents/skills` 的 `loaded_host` 是 first-match codex，ZCode/Pi 应以 `surface_hosts` 判断归属。
- Receipt 只有 5 分钟 freshness；执行时及时验证，归档保留捕获时验证结果。没有 source identity，另以外层运行清单绑定 source hash、runtime hash、host version、session/tool transcript、target 和产物哈希。
- 现有正常 `--check` / `--plan` stdout 不直接导出完整 confirmed receipt，完整 receipt 位于内部 authority；blocked 分支才导出 authority。可以在真实宿主会话中，从该会话实际加载的 runtime skill root 调用同一 producer 导出 sidecar，并保存真实 tool event。外部 shell 手工 pin 只能证明路径合同，不得称为真实宿主调用。
- 发现的确定性缺口：producer 总是生成 `surface_hosts`，schema 当时 `additionalProperties=false` 却未声明该字段。该缺口已在本 goal 的授权范围内修复，并由 [surface-hosts-schema-fix-evidence.json](surface-hosts-schema-fix-evidence.json) 记录红绿证据；当前仍需在最终全套回归中确认下游无漂移。正常 consumer 已接受共享面，并校验哈希与 target。

## 八宿主最小任务与通过证据

全部使用单独隔离 fixture，由主 owner 刷新相应 runtime；先取 source/runtime hash，再开全新会话，禁止复用缓存 skill 定义。每个宿主最小执行两件事：已加载 Runtime Setup 的 `--check`，以及 tenant-orders 的 report-only review。生产仓和用户配置不作为 fixture。

| 宿主 | 实际入口 | loader 证据 | 最小 invocation 与 pass 产物 |
| --- | --- | --- | --- |
| Claude | CLI `claude`；skill-up engine `claude_code` | fresh session 的 command/skill load 事件和 `.claude/spec-first/workflows/spec-runtime-setup` root | check stdout + receipt sidecar；tenant review 的 result.json、transcript、script judge exit 0、fixture前后字节一致 |
| Codex | CLI `codex exec`；skill-up engine `codex` | fresh session 读取 `.agents/skills` 的事件，不能用当前旧会话代替 | 与 Claude 相同，记录实际 model/provider identity；只读权限约束保留 |
| Cursor | `/Applications/Cursor.app` 的新 GUI chat | workspace 路径截图 + `.cursor/skills` 被加载的tool event/展开内容 | GUI 中显式调用 check 与同一 review prompt；导出会话、截图、check输出、receipt、judge与文件快照；CLI结果不能替代 |
| Kiro | `/Applications/Kiro.app` 的新 GUI session | `.kiro/skills` 加载事件，记录实际agent/model模式 | 同 Cursor；显示应用已打开或模型自称读过不算 loader pass |
| Qoder | GUI `/Applications/Qoder.app`；另有 `qodercli -p -w <fixture>` / skill-up `qodercli` | GUI `.qoder/skills` load事件与CLI各自留证 | CLI review用于模型/CLI证据；必须另跑GUI check+review以覆盖GUI面；CN是不同安装实例，不能混用版本/会话 |
| OpenCode | `opencode run --dir <fixture> --format json <prompt>` | fresh event stream中的`.opencode/skills`加载，public command实际执行 | JSON事件+check输出+receipt+review结果+相同judge；不使用--share，不把存在command文件当加载成功 |
| ZCode | `/Applications/ZCode.app` 新GUI会话 | `.agents/skills`加载与真实ZCode会话/版本绑定 | GUI check+review，receipt host=zcode且surface_hosts含zcode；loaded_host=codex本身不判失败 |
| Pi | `pi --print --mode json <prompt>`（cwd=fixture） | 原生发现`.agents/skills`的事件；不加--no-skills | JSON事件+check输出+receipt+review结果+judge，host=pi且surface_hosts含pi；显式--skill注入可用于行为对照，但不能替代原生发现验证 |

若工具只允许截图而无完整tool transcript，保留GUI观察与结果artifact的证据上限，不能伪装强loader证明。发现未登录/权限弹窗时记录实际阻塞，主owner先完成独立CLI任务，不把等待或安装版本当通过。

## 现成评测执行顺序

本次已实跑 `skill-up validate` 与 `list-cases`（3 套配置均通过；总计 13 cases）：

| 套件 | 配置有效cases | 第一条最小真实任务 |
| --- | ---: | --- |
| `skills/spec-code-review/evals/eval.yaml` | 5 | `report-only-detects-tenant-bypass` |
| `skills/spec-doc-review/evals/eval.yaml` | 6 | `default-report-only-no-write`，随后覆盖其余5例 |
| `skills/spec-runtime-setup/evals/eval.yaml` | 2 | `check-readonly` |

已有 eval 都默认 `claude_code`、parallelism=1；按可用真实引擎覆盖时使用本机 `skill-up run --help` 已确认的 --engine、--include-case-name、--output-dir、--iteration 1、--parallelism 1。不要新造runner。示例（仅计划，本worker未执行模型）：

```text
skill-up run skills/spec-code-review/evals/eval.yaml --engine claude_code --include-case-name report-only-detects-tenant-bypass --parallelism 1 --iteration 1 --output-dir docs/validation/ce-localization/goal-20260921/evals/claude-review
skill-up run skills/spec-code-review/evals/eval.yaml --engine codex --include-case-name report-only-detects-tenant-bypass --parallelism 1 --iteration 1 --output-dir docs/validation/ce-localization/goal-20260921/evals/codex-review
skill-up run skills/spec-code-review/evals/eval.yaml --engine qodercli --include-case-name report-only-detects-tenant-bypass --parallelism 1 --iteration 1 --output-dir docs/validation/ce-localization/goal-20260921/evals/qoder-review
```

engine可用性以实际dry-run/运行结果确认，安装skill-up不证明每个engine认证可用。OpenCode/Pi/GUI复用同一个case prompt和judge，不把不支持的engine名称硬塞进skill-up。模型身份来自真实engine事件；不读取/打印凭据值。指定模型/额外付费遵循主goal授权和预算。

Review fixture使用 `skills/spec-code-review/evals/fixtures/repos/tenant-orders`，其 prepare-review-fixture.sh 建baseline并应用待审补丁。judge要求定位src/orders.js的租户隔离绕过、给修复方向、披露未授权dispatch降级、HEAD和tracked diff不变。它不能发现untracked写入、先写后还原或用户级副作用，外层增加完整fixture前后文件清单、禁止宿主runtime/配置写入的边界记录。

## field与落地

相同fixture跨宿主通过只证明受控任务，不是现场收益。field最小单位使用现有field protocol的一次真实维护任务：明确owner/接受条件、事前task scope、真实开始/完成时间、返工/缺陷、产物与验收记录；不把本次fixture或review自评充作field样本。不需要新schema。发布与push状态单列，由主owner完成对应授权动作；有未运行/blocked宿主时总体仍partial。

## 本次调查覆盖限制

未登录宿主、未调用模型、未真实check Provider、未安装工具、未刷新runtime、未执行GUI。历史loader evidence未外推为本次通过。配置加载通过不代表engine完成；CLI和GUI分别记账；source-backed receipt hash不代表外部身份认证。
