# spec-test-browser 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-test-browser/SKILL.md:11,30,55；tests/unit/spec-test-browser-contracts.test.js:461-476；git log（d62f8e2d→8beed5db→0ab5fe27） | 重约束各自对应真实失败史（端口推断/托管 server/provider 越权），旧补丁面（resolve-port.sh、dev-server-run-context）有删除测试证明已退役而非堆叠；无法脚本化的重复 token 检测诚实标注为 loud convention |
| D02 | pass | references/route-and-report.md:7-21,44-50；SKILL.md:51,55；scripts/agent-browser-run-context.cjs:18-20(SKILL.md) | 提供框架级路由映射表（明示为起点非穷举）、人工验证流程表、按预期效果而非动作名的分类等真实领域知识；脚本/LLM 职责在 SKILL.md:18-20 显式分栏 |
| D03 | pass | SKILL.md:30,43-47；run-context.cjs:331-460,495-501,846；contracts.test.js:272-298,748-786,842-881 | 验证门确定性强（probe/conformance 正负对照、每 action 前 hash 复验、零导航子进程保证有测试）；工具强制与 prose 约定逐处区分（"Source tests do not prove a script-enforced duplicate-token gate"） |
| D04 | pass | spec-lfg/SKILL.md:25-34,58；spec-lfg/references/stage-routing.md:15-19；spec-dogfood/references/phases.md:111；spec-polish/SKILL.md:68；tests/unit/pipeline-mode-contracts.test.js:64-81 | 上游（lfg/dogfood/polish）与本体在 `target-origin` 词汇、`mode:pipeline`、reason_code 保留、失败阻断 shipping 上双向一致，且由消费者测试 pin 双侧 |
| D05 | pass | SKILL.md（全文 91 行）；route-and-report.md:3；contracts.test.js:434-505 | 指令分层清晰、关键规则可定位、ownership 表明确切分文档职责；存在少量跨文档重复（见 Findings F4）与枚举缺口（F1），均有测试 pin 或确定性地板兜底，不构成矛盾 |
| D06 | pass | SKILL.md:22；agents/openai.yaml:1-2；evals/cases/*.yaml:16-20；evals/eval.yaml:10-19 | 能力不可用时诚实降级为 `not_supported` 并给出 repair_scope/next_action；Codex 宿主投射 `allow_implicit_invocation: false`；eval 用 rule_based 判定不依赖模型自评 |
| D07 | pass | git log（skills/spec-test-browser/ 10 commits）；docs/project-reviews/2026-11-01-development-skills-review-report.md:42,99；evidence/S11-spec-test-browser/repair-2026-11-02/README.md；skills/spec-runtime-setup/setup-registry.json:1173 | 有完整问题→修订→复验链（F-S11-01 分类修正、X-02 metadata 投射、repair 证据留存）；setup-registry usage_note 写明失效条件（conformance passed 才算 ready，provider 缺能力保持 degraded） |
| D08 | pass | SKILL.md:21,26（按需读 reference）；references/pipeline-orchestration.md:3（仅 pipeline 读）；报告模板在 route-and-report.md:74-105 | 渐进加载结构干净：SKILL.md 91 行常驻，两个 reference 按模式加载，1369+282 行脚本由机器执行不进模型上下文，模板不占入口篇幅 |
| B01 | pass | SKILL.md:3-4；src/cli/contracts/dual-host-governance/skills-governance.json:601-615；tests/unit/low-findings-cleanup-contracts.test.js:13-23 | 内部 helper 三层一致（source `user-invocable:false` + governance `internal_only`/`command_name:null` + 测试 pin）；description 含负触发（"Not for diagnosing failures…route defects to spec-debug"）；按 caller-owned 契约审不苛求公开入口 |
| B02 | pass | SKILL.md:5,14,90；run-context.cjs:10,24-44；contracts.test.js:478-505；四个消费者测试文件 | argument-hint、输入解析、输出合同（Pass/Fail/Skip+reason+claim ceiling）、脚本 reason_code 家族与消费者断言全对齐；readiness 事实带 repair_scope 分级 |
| B03 | pass | SKILL.md:12,51-55,85；run-context.cjs:515-519,622-634；conformance.cjs:39-48 | 页面内容明示为不可信证据不能授权；脚本层拒绝 credentials/literal/argv 键；效果门要求与 origin 分离的显式授权；cleanup 永不 `--all`、不发信号给 caller server；环境清洗剥离代理与 AGENT_BROWSER_* 注入 |
| B04 | pass | CLAUDE.md source 清单；skills-governance.json:601-615；low-findings-cleanup-contracts.test.js:13-23；contracts.test.js:440-441 | 真相源为 `skills/spec-test-browser/`，SKILL_DIR 从当前加载的 SKILL.md 目录解析（禁止项目 cwd 定位）；无手改 runtime mirror 声明或痕迹；Codex metadata 投射有测试 |
| B05 | pass | run-context.cjs:184-198,767-785,823-838,899-913,941-994；conformance.cjs:264-270；pipeline-orchestration.md:17-18 | 全失败路径有结构化 reason_code：prepare 回滚（含回滚失败保留原因）、run 中 hash 漂移即停、cleanup 失败留私有诊断、conformance 失败留 recovery receipt 并限定"仅重试指定隔离 close"；部分成功逐 step 保留 |
| B06 | pass | SKILL.md:14,90；route-and-report.md:68,74-107；contracts.test.js:491-505 | Done 合同显式（每路由必有状态、不可丢路由、Skip 必带因、保留 wrapper/cleanup blocker）；claim ceiling 禁止把合同测试当作 field outcome；报告模板被测试 pin |
| X01 | not-applicable | SKILL.md:16-20；spec-dogfood/SKILL.md:48 | 单一有界测试 helper：编排、矩阵、分解由 caller（lfg/dogfood）持有，本 Skill 无多模块分解/共享写面/长任务编排职责，无适用检查面 |
| X02 | pass | run-context.cjs:220-260,363-388,823-838；contracts.test.js:363-384,386-405；setup-registry.json:1173 | provider 版本/能力漂移处理完整：binary identity 绑定 realpath+SHA-256+size、identity 变化触发重验证、help marker 仅作 advertised 证据、降级路径写入 registry |
| X03 | pass | SKILL.md:49-55；conformance.cjs:117-177；route-and-report.md:107 | 高风险面（浏览器副作用）有风险/验证对账：效果门先于写 plan、conformance 正负对照、cleanup 不通过不得 ready、PASS 判据排除未决 blocker |
| X04 | pass | SKILL.md:89；route-and-report.md:70；pipeline-orchestration.md:22；evals/cases/missing-origin-not-run.yaml:7-10 | 跨 workflow 交接有界：缺陷显式移交 spec-debug 并带 bounded evidence 与当前授权；报告含 limitations/provenance/freshness（claim ceiling），不把观测升级为结论 |

## Findings

**F1（P3）SKILL.md 对 wrapper 强制集的 prose 枚举不完整，依赖确定性地板兜底**
- 位置：`skills/spec-test-browser/SKILL.md:59`（pre-open 禁止清单未列 `vitals`）；`skills/spec-test-browser/SKILL.md:43-44`（未列 `agent-browser-help-unavailable`，见 run-context.cjs:355-361）
- 后果：direct 交互模式执行者只读 SKILL.md + route-and-report.md（后者亦未提 vitals 边界，该边界仅在 pipeline-orchestration.md:16），可能写出 vitals-before-open 计划，被 wrapper 以 `test-plan-page-context-before-open` 拒绝——后果有界（一轮重试），但属于可免损耗；help 不可用时同理需靠"解析 JSON 并停止"的通则兜底。
- 最小修复：SKILL.md:59 清单补 `vitals`；§2 补一句"或任何 blocked probe reason"。若不改，保持现状成立（地板已强制）。

**F2（P3）cleanup 不复用 conformance 绑定的 binary identity**
- 位置：`skills/spec-test-browser/scripts/agent-browser-run-context.cjs:948`（`options.command || AGENT_BROWSER_COMMAND`，PATH 重解析）对比 run 路径使用 identity 钉死的可执行文件（:839 `currentIdentity.path`）；manifest 未记录 binary path（:723-740）
- 后果：prepare→run→cleanup 之间 PATH 变化时，`close` 发给未经 conformance 验证的二进制；因 close 仅作用于 wrapper 创建的隔离 session/namespace 且失败走 `agent-browser-cleanup-failed` 通道，实际风险低。
- 最小修复：prepare 时把 probe 绑定的 binary path 写入 manifest，cleanup 优先使用并失配时报结构化 reason。

**F3（P3）能力受阻结果的 CLI exit code 为 0 且语义无文档**
- 位置：`skills/spec-test-browser/scripts/agent-browser-run-context.cjs:1352`（`not_supported`/`available` 一律 exit 0）；SKILL.md:37 与两份 reference 仅约定"parse its JSON"
- 后果：按合同解析 JSON 的 caller 无影响；但任何依赖 shell exit code 的外围脚本会把 blocked/not_supported 当成功串联（如 `run && 下一步`）。
- 最小修复：在 SKILL.md §4 或 route-and-report 增加一行 exit code 语义说明（"exit 0 含 not_supported，判定以 JSON status 为准"）。

**F4（P3）conformance 门 prose 在 SKILL.md §2 与 pipeline-orchestration.md 近乎重复维护**
- 位置：`skills/spec-test-browser/SKILL.md:43-47` 与 `skills/spec-test-browser/references/pipeline-orchestration.md:9`
- 后果：双处列举 reason_code 家族与放行条件，未来增改 reason_code 需同步两处，漂移即测试红（contracts.test.js:434-459 同时 pin 双侧），当前风险受控。
- 建议：可保持现状成立（reference 需对 unattended caller 自含）；若要收敛，让 reference 引用 SKILL.md 条款而非重述清单。

## 主责深挖面发现

**D01（去补丁化）**：本 Skill 是"重约束但非补丁化"的正面样本。三条最重的约束各自锚定可追溯的失败史：(1) 唯一 wrapper + 禁止自拼 argv（SKILL.md:11）对应 provider 参数面不可控；(2) caller-owned server 边界（SKILL.md:10,19）对应 git 历史中"bundled 端口解析器"（d62f8e2d）被 8beed5db/0ab5fe27 反转为不碰 server——且 contracts.test.js:461-476 以断言文件不存在的方式证明旧补丁被删除而非叠加；(3) controlled conformance（9 用例正负对照 + blocked-origin 命中计数，conformance.cjs:117-177）对应"provider 自称 --exact-origin 但不强制"这一真实安全缺口，有专门测试（contracts.test.js:272-298,407-432）。诚实性标记到位：重复 token 检测（SKILL.md:30）与效果语义判断（:55）都明写为 loud convention，不冒充脚本强制。未发现过度指导或互相矛盾的约束。

**D02（领域知识）**：真实知识密度高于流程口号：框架→路由映射表带"起点非穷举、按项目实际布局判断"的免责（route-and-report.md:7,21）；"Do not hardcode `main`"（:21）是具体反模式；按预期效果而非动作名分类（`open`/`press Enter` 也可能触发效果门，SKILL.md:51）是经验沉淀的判断规则；人工验证表（route-and-report.md:44-50）给出各流程该问什么。脚本职责严格停在确定性层（argv allowlist、hash、权限加固），语义效果判断明确留给 workflow（SKILL.md:55）。

**D03（验证门）**：门的层次完整且可定位：capability 门（probe 五级失败各有 reason_code + repair_scope + next_action，run-context.cjs:339-459）、计划门（validateTestPlan 495-501 强制 first-open 顺序，拒绝清单含 credentials/literal/script 键 ：515-519）、执行门（每个 action 前重读并复验 plan hash，:846；identity 复验，:823-838）、清理门（cleanup 失败独立保留，:941-994）。正负例测试覆盖到位（零子进程保证 748-786、hash 漂移即停 859-881、cleanup 四种失败形态 1032-1102）。工具强制与 prose 约定的边界被反复显式声明，无"语义判断冒充机械判定"。

**D04（衔接）**：词汇表跨四个 Skill 对齐：lfg 侧"remove at most one standalone token, retain unchanged"（spec-lfg/SKILL.md:25-27）与本体"Remove this modifier before parsing"（SKILL.md:28）严丝合缝；`target-origin-missing/invalid`、`browser-mutation-authorization-required`、`action_process_calls` 在 lfg（stage-routing.md:15-19）、dogfood（phases.md:111）、polish（SKILL.md:68）三个 caller 均按同一语义消费，且 pipeline-mode-contracts.test.js:64-81 双向 pin。eval case 的 prompt 形态（`mode:pipeline target-origin:... current`）与真实派发形态一致。

**D05（紧凑性）**：91 行入口 + 两份各约 110 行 reference 的三层结构可审计性好；ownership 表（SKILL.md:16-20）与文档职责切分（route-and-report.md:3）让"哪条规则归哪份文件"可回答。问题仅 F1 枚举缺口与 F4 双处维护，均不构成矛盾。删减空间基本没有——每段都对应一个 reason_code 或一个测试断言。

**D08（上下文效率）**：加载分层明确：常驻仅 SKILL.md；route-and-report 在准备路由/报告前必读（:26）；pipeline reference 仅 pipeline 模式读（:21）；脚本的 1651 行完全在模型上下文之外，模型只需 probe JSON 与命令行三行。报告模板放 reference 而非入口（route-and-report.md:74-105）是正确的上下文节流。摘要化风险低——claim ceiling 条款（SKILL.md:90）主动防止把合同/单测证据摘要成现场结论。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| skills/spec-lfg/references/stage-routing.md 全文 | 仅读含 spec-test-browser 的 15-19 段；其余阶段路由与被审对象无关 | lfg 侧若有未 pin 的浏览器路由附加要求，本轮未逐行核对 |
| skills/spec-dogfood/references/phases.md 全文 | 仅读 111 段（派发合同）；dogfood 自身质量非本轮对象 | dogfood 矩阵构建细节对 origin 的二次处理未全文核验 |
| docs/plans/2026-11-03-skill-optimization-initiative/core/05-optimization-dimensions-with-trends.md 等核心文档原文 | 检查表 §4 已内联 D01-D08/B/X 必查问题，按其口径裁决 | 维度原始定义若与 §4 转述有偏差，以 §4 为准未回源 |
| skills/spec-runtime-setup/scripts/lib/installation-executor.cjs | 仅核对 setup-registry.json:1144-1181 的 agent-browser 条目与 usage_note | 安装执行器与 probe 判定的实现级耦合未核 |
| docs/catalog/runtime-capabilities.md | 目录级文档，非合同真相源 | 目录描述与当前源码的漂移未核 |

## 结论一句话

spec-test-browser 在静态合同层成立：18 项裁决 17 pass、X01 不适用，无 P0-P2 缺陷；4 条 P3（prose 枚举缺口、cleanup 身份复用、exit code 语义未记载、双处维护）均有确定性地板或测试 pin 兜底，可保持现状或按最小修复低成本补齐。
