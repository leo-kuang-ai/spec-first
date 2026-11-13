核心材料已读完。现在输出评审结论。

# spec-runtime-setup 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-runtime-setup/SKILL.md:153、156、165-171 | bare 收敛语义、refresh 边界、Graphify hook 等约束均锚定历史真实失败（如 `.graphify` 双 root、hook 外部 core.hooksPath 事故），非泛泛防御；未见过时相互矛盾的约束 |
| D02 | pass | SKILL.md:23、361-373、38 | 「Setup 不得判断语义充分性」「provider index 不是语义证据」及 script/LLM 职责划分（registry 确定性展开 vs workflow 判断）有明确定位，setup 域的决策依据（pin、fail-closed host authority）属于编码的领域知识 |
| D03 | pass | SKILL.md:145、155、165；scripts/lib/host-authority.cjs:52-96；tests/unit/runtime-setup-eval-judge.test.js:30-44 | fail-closed host authority、query probe 前置、host config 写入门均由 Node 脚本确定性强制，eval judge 还有「自述只读不能掩盖写入」的反伪造校准；机械判定与语义义务在文中明确分层 |
| D04 | pass | SKILL.md:306-339（tool-facts.v2/runtime-capabilities.v1 schema）、21；src/cli/helpers/setup-facts.js:5-7、574-579；src/cli/commands/doctor.js:1007、1107 | 输出 artifact schema 在文内固定，doctor、setup-facts helper 等真实消费者直接 require 共置 module，链路可定位 |
| D05 | fail | SKILL.md:165、169、171（三段连续超密长段，每段 15+ 约束）；references/supported-mcp-tools.md:54-124 | 关键安全规则（全局 npm 卸载条件、GRAPHIFY_NO_BACKUP 注入、hook external verified 判定）埋在无小标题的超长段落中，机器 contract 散落在 prose 而非集中 reference，定位成本显著偏高，裁剪风险大 |
| D06 | pass | SKILL.md:50、113、280；evals/README.md:9（「沙箱结构性不可测」明示） | 能力假设诚实声明（MCP_SETUP_HOST 枚举、被探测工具可写缓存、eval 不覆盖真实宿主成功路径），不支持处声明降级而非伪造 |
| D07 | pass | tests/integration/runtime-setup-sigint-recovery.integration.test.js:11-20；scripts/lib/host-config-repair-command.cjs:5-7；tests/unit/host-enumeration-drift-guard.test.js:24-37 | 修订由真实 finding 驱动（DR-026/027、DR-015、zcode/pi 逐层遗漏 → drift-guard 测试入 CI），修订→回归链条完整 |
| D08 | pass | SKILL.md:65（project-config 变更前必读 reference）、42-52（共置脚本入口）、54（provider readiness 单段承载全部 display 规则） | 按需加载 structure 清晰：SKILL.md 保留公共合同，细节下沉 references/ 与脚本注释，消费方按 mode 定位 |
| B01 | pass | SKILL.md:16、112；evals/cases/semantic-question-not-setup.yaml；tests/unit/runtime-setup-eval-judge.test.js | 正向触发/负例（语义问题移交）有 case 覆盖，单一公开入口（无 legacy 别名）明示于 SKILL.md:141 |
| B02 | pass | SKILL.md:11-21（Contract Summary）、32-34；references/supported-mcp-tools.md:3；setup-registry.schema.json | 入口/reference/registry/schema/consumer 对账一致，source vs generated projection 边界明示 |
| B03 | pass | SKILL.md:114、120-122、155、178-181 | 授权纪律完整：显式参数只表达范围、模型自生成 flag 不产生授权、只读不授权 --verify-only、--repair-host-config 不得自动追加、预览不授予写入 |
| B04 | pass | SKILL.md:30-34、141-145；scripts/lib/host-authority.cjs:13-27；tests/unit/host-enumeration-drift-guard.test.js:54 | source-of-truth 与 generated runtime 边界明确，host surface 绑定与 8 层 drift guard 使宿主投射可追溯 |
| B05 | pass | scripts/lib/repair-loop.cjs:3、19-42；scripts/lib/process-runner.cjs:149-231（进程树终止）、scripts/lib/workspace-graph-lifecycle-lease.cjs:1-31；SKILL.md:155-158、236、265-268；tests/integration/runtime-setup-sigint-recovery.integration.test.js | 失败恢复体系完整：bounded 修复上限 2 且 reason 去重防循环、超时进程树 SIGTERM→SIGKILL、lifecycle lease busy 零 mutation、SIGINT 重入有测试、partial exit code 合同化；已知缺口（真实 mutation SIGINT 恢复未验证）在测试中明示不隐瞒 |
| B06 | pass | SKILL.md:96-106、285-303；scripts/lib/renderer.cjs:288、31；evals/ + tests/unit/runtime-setup-eval-judge.test.js | 完成披露纪律可定位：分组 status 不得折叠成单一「setup complete」、partial scope 显式渲染、action-required 行名指 next action、handoff 模板只在全 ready 时展示；finding/证据层在 eval README 明确分层 |
| X01 | pass | SKILL.md:213-272（workspace graph 多仓域）、236（lease/状态机/清理） | 多仓 workspace graph 有渐进分解、共享写面（双锁分工）、中断恢复（async lock + lifecycle lease）与幂等 clean 设计 |
| X02 | pass | SKILL.md:32（v11）、203（v10 旧 policy 兼容迁移警告）、234（state v1/v2 不自动迁移需显式重跑） | registry schema 版本演进与旧格式兼容/拒绝策略明确，迁移不静默 |
| X03 | pass | SKILL.md:155、163、165；scripts/lib/host-config.cjs:1283-1449（backup+post-write verify）；scripts/lib/workspace-graph-build.cjs:446-505（promotion rollback） | 高风险写面（host config、opencode 权限事务、workspace graph promotion）均有回滚/备份/写后验证路径 |
| X04 | pass | SKILL.md:19、54、234（receipt 带 attempt_id/source snapshot/SHA-256）、302-303；evals/README.md | facts/receipt 均带 freshness 与 limitation 标注，跨会话消费所需的 source refs、freshness、局限披露齐备 |

## Findings

1. **P2 — SKILL.md 主体密度超限，机器合同散落**（skills/spec-runtime-setup/SKILL.md:165、169、171；约 385 行正文，单段承载 15+ 条独立安全规则）。后果：关键 fail-closed 规则（如「只在 Graphify 全 verified 时才卸载全局 `@sentropic/graphify`，且只删解析到原 target 的旧 symlink」SKILL.md:165）无小标题、无列表化，读者（含 fresh 上下文的模型）容易跳读漏约束；修订者定位特定规则的锚点成本高，易发生 D07 类「机制存在但没触发」。最小修复：将 SKILL.md:163-172 的 Graphify/CodeGraph provider 细节拆入 `references/providers.md`，SKILL.md 保留一段合同摘要 + 指针；或至少在长段内加可 grep 的分条列表。保持现状不成立：D05 必查问题「关键规则能否定位」当前答案偏弱，而文件仍在活跃演化（批次 2 增补），密度只会继续增长。

2. **P3 — Graphify hook 合同的双层表述存在轻微漂移风险**（SKILL.md:171 vs references/supported-mcp-tools.md 未覆盖 hook external verified 细则）。`hook_status=verified-external` 的判定条件只存在于 SKILL.md:171 的长段，references 中无对应锚点；将来修订 hook 规则时易只改一处。最小修复：把 hook 判定矩阵移入 references 并从 SKILL.md 引用。属非阻断观察。

3. **P3 — eval 覆盖未含 host config 冲突/repair 路径行为层**（evals/eval.yaml:14-17 仅 3 case）。`--repair-host-config` 是本 skill 风险最高的写面之一（SKILL.md:155），静态层有单测（tests/unit/mcp-setup-host-config.test.js 等）兜底，行为层 eval 只有只读、fail-closed、语义边界三条。属观察而非缺陷：按 S1 校准纪律，行为层缺口不压静态裁决，此处仅登记供后续轮次补证。

## 主责深挖面发现（B05/B06 + 归因验证）

**B05 失败恢复/隔离复核（结论：静态承诺完整且多处有脚本强制）**

- 重试上限：`scripts/lib/repair-loop.cjs:3` MAX_REPAIR_ATTEMPTS=2，且 `reason_code === previousReason` 立即返回 action-required（repair-loop.cjs:26），防同因循环；有 tests/unit/runtime-setup-repair-loop.test.js 覆盖。
- 超时/进程树：`process-runner.cjs:149-231` POSIX process group SIGTERM→宽限→SIGKILL→存活检测，Windows taskkill /T /F，输出有界截断 + secret redaction（:52-73）。
- 中断恢复：SIGINT 集成测试证明模块树不吞信号、中断后 bare 诊断可重入（tests/integration/runtime-setup-sigint-recovery.integration.test.js:21-58）；测试注释诚实声明「真实 mutation 的 SIGINT 恢复/lease 修复/子进程树回收仍是未验证缺口」（:16-20），归因验证通过——该缺口被显式记录而非掩盖，符合 B06 诚实披露。
- 并发/lease：`workspace-graph-lifecycle-lease.cjs` 双锁分工（event single-flight vs lifecycle 独占）与 busy 零 mutation 合同（SKILL.md:236、266），活 PID 但 start marker 无法确认时保持 busy 不按年龄抢占——这是对「未知副作用不盲目重试/抢占」判据的直接兑现。
- 部分成功：Machine contract exit code 表（SKILL.md:262-268）区分 complete/partial/failed/needs-confirmation/skipped，并要求自动化消费者读 `status`+`reason_code`+`pending_confirm[]`，不得只看文件存在。
- 重复执行幂等：clean 幂等（SKILL.md:258），已存在一致的 host MCP 配置自动复用跳过写入（SKILL.md:90）。

**B06 完整交付/审查质量复核**

- partial scope 渲染有脚本锚点（renderer.cjs:288），`readiness_scope` 机器字段（renderer.cjs:31、247）支撑「installation 成功不得表述 artifact ready」的合同（SKILL.md:197-199、211）。
- Readiness handoff 门（SKILL.md:302-303）：action-required/degraded 不得展示首次任务模板，且明示「不得把 doctor 或额外 --verify-only 当作第二道验证」——防自我安慰式闭环。
- eval judge 反伪造：tests/unit/runtime-setup-eval-judge.test.js:36-44 验证「自述只读不能掩盖写入」、符号链接不能冒充原文件，这是「脚本伪造确定性校验」反模式的确定性防线，归因验证通过。

**归因复核**：未发现需要修正的既有归因；SIGINT 测试注释中的历史归因（DR-026/027、旧版注入 busy runner 已被 preflight 正当阻断）与当前源码一致（host-authority.cjs 的 surface binding 确为 mutation 前置门）。

## 未读文件

- `scripts/setup.cjs` 全文（873 行，只读头部 150 行与关键 require 链）：主流程骨架已由头部 + 各被 require 的 lib 确认；未逐行读完。未覆盖后果：setup.cjs 内部个别 mode 分支的细粒度行为未逐一核，但 mode/mutation/host 门已在 lib 层定位，风险低。
- `scripts/providers/graphify.cjs`、`scripts/providers/codegraph.cjs` 及 70+ 个 lib 中未点名文件（workspace-async-refresh、workspace-child-hook、toml-section-editor 等）：主责面所需的关键模块（repair-loop、process-runner、host-authority、lifecycle-lease、host-config 写路径、renderer、preflight）已读；其余按 B05/B06 非主责路径未逐行深读。未覆盖后果：provider 内部的次要边界（如 graphify.cjs 的 receipt 读写细节）未独立核，依赖 supported-mcp-tools.md 的合同陈述与对应单测存在性。
- `evals/examples.json`、`evals/fixtures/scripts/check-*.sh` 三个脚本本体：judge 行为已由 tests/unit/runtime-setup-eval-judge.test.js 的正反校准覆盖，脚本字节未读。未覆盖后果：可忽略（测试直接 spawn 这些脚本验证）。
- `tests/` 消费者清单中 60+ 个测试文件逐行未读（抽样 4 个关键：eval-judge、sigint-recovery、repair-loop、host-enumeration-drift-guard）：测试存在性与覆盖主题经 grep/文件名确认，逐行核不属于静态层必需。未覆盖后果：测试内部断言强度未逐一验证，不压静态裁决。

## 结论一句话

spec-runtime-setup 的静态合同层整体扎实——授权、fail-closed、失败恢复、partial 披露均有脚本强制与测试锚点，17/18 项 pass，唯一 fail 是 D05：SKILL.md 主体密度过高、关键安全规则埋藏在超长段落中，建议将 Provider 细节拆入 references 以保持可定位性。
