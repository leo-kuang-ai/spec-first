# spec-dogfood 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-dogfood/SKILL.md:14; references/phases.md:32-60, :90 | 每条硬约束都绑定真实失败模式（trunk 误解析、remote-only trunk 限定、fork PR head 叫 main、缩放规则），无发现过时或互相打补丁式的约束 |
| D02 | pass | references/test-matrix-taxonomy.md:5-15, :34-36, :51-62; phases.md:64-66 | 编码的是 QA 领域知识（旅程脊柱、paper cut、文件→路由映射表、persona 来源次序），不是流程口号；LLM 语义判断与 owner 脚本地板分工明确（SKILL.md:79） |
| D03 | pass | SKILL.md:14; phases.md:133, :142; SKILL.md:53 | 验证门明确（绿矩阵+红套件=not-ready、回归测试默认+豁免需说明、套件失败永不记通过）；确定性地板诚实委托给 spec-test-browser wrapper，无语义判断冒充机械判定 |
| D04 | pass | phases.md:16 ↔ skills/spec-worktree/SKILL.md:144; phases.md:111 ↔ skills/spec-test-browser/SKILL.md:21,30,53 | 对 spec-worktree（isolate pr:/already_checked_out）与 spec-test-browser（mode:pipeline/target-origin/reason code）的调用合同逐字对齐，且有 tests/unit/plugin-modules.test.js:381-406 跨宿主锁定 |
| D05 | pass | SKILL.md:40 vs :85（双 Workflow 段）; SKILL.md:16 | 关键规则均可定位、长度适中（SKILL 99 行 + phases 148 行）；存在轻度重复与两处不一致（见 Findings #1、#4），不足以翻转为 fail |
| D06 | pass | SKILL.md:53; phases.md:117, :142; evals/cases/owner-unavailable-stops.yaml:1-23 | owner 不可用、外部交互腿、套件不可用三条降级路径都有诚实出口（停止+runtime-setup 指引 / Blocked / 不记通过），能力假设（hands-off QA 判断）与其判断程序匹配 |
| D07 | pass | git log 0b0b3e4f/1f72bfd0（交叉测评轮）; evals/cases/r2-code-review-routes-out.yaml:3-5; phases.md:136 | 有按失败证据演化的链路（路由点名义务修复→R2 对抗变体复验）、消费者回归锁（mutation-authority-contracts.test.js:40-68）、learnings 交 spec-compound 且设准入条件 |
| D08 | pass | SKILL.md:20; phases.md:24, :94, :66 | 按需加载分层清晰（入口→phases 前→taxonomy 2b→模板 Phase 2 末），总量约 394 行；persona/criteria 消费显式限定为 bounded consumption |
| B01 | pass | SKILL.md:3-4, :22-26; evals/cases/polish-request-routes-out.yaml; r2-code-review-routes-out.yaml | 正负触发词齐全，路由出邻接入口有点名义务且有两个负例 eval 锁定；disable-model-invocation: true 与 slash-command 定位一致 |
| B02 | pass | SKILL.md:5, :28-44; phases.md:7; dogfood-report-template.md:5-6 | Inputs/Outputs/Artifacts/Failure Modes/Consumers 与 phases、模板三方一致；argument-hint 与 Phase 0 解析规则对应；persona 推断显式标注为推断（phases.md:64） |
| B03 | pass | SKILL.md:66-83; phases.md:127-140 | 五项 run-local 授权事实独立派生、branch-selection-is-not-authorization、报告 artifact 权限不外溢（SKILL.md:83）、无授权修复即 Blocked 不改标 Pass；字符串被两个消费者测试锁定 |
| B04 | pass | templates/claude/commands/spec/dogfood.md:10; tests/unit/plugin-modules.test.js:381-406 | 真相源在 skills/，运行时由模板 frontmatter+正文组合生成，spec-commit/spec-worktree 内部依赖在全部受支持宿主可投射（测试执行验证） |
| B05 | pass | SKILL.md:37-38; phases.md:17, :19-26, :104, :111 | 中断恢复（双状态 checkpoint）、证据过期复验、端口监听者身份核实、owner 拒绝不回退直连浏览器均有明确处理；dirty 检查判据缺失记 Findings #2 |
| B06 | pass | phases.md:144-148; dogfood-report-template.md:33-39, :69-85 | 交付按模板定稿（禁止凭记忆重构 section 列表）、verdict 必须携带套件结果、人工决策块带选项与推荐；模板 token 被测试锁定 |
| X01 | pass | phases.md:19-26, :100; SKILL.md:20; phases.md:117 | 长任务按阶段渐进、flow→matrix→browser 顺序约束、ledger+report 双状态、Blocked 场景不阻塞独立场景 |
| X02 | not-applicable | —（适用性理由） | 本 Skill 不拥有 schema/API/版本面；对邻接 Skill 的调用合同是文本合同且被测试锁定（已并入 D04 核对），不存在需要核查的版本/迁移/回退义务 |
| X03 | pass | SKILL.md:70-76, :82; phases.md:133, :142 | 风险-验证对账完整：浏览器效果按五级分类过授权门、每修复带回归证明、就绪判定以套件结果为准、无 landing 授权不 push 不开 PR（发布/回滚显式在范围外） |
| X04 | pass | phases.md:17, :19-26, :136; template:69-81 | 跨会话恢复以报告为真相源、freshness 用 base/head/dirty 身份复验、limitations 有 claim ceiling、知识沉淀经 spec-compound 门槛（paper-cut 意见不得直接成为 confirmed knowledge） |

## Findings

1. **[P2] `Skipped` 终态没有产生规则** — 位置：`skills/spec-dogfood/SKILL.md:14`、`references/dogfood-report-template.md:39`（词汇表含 `Skipped`）对 `references/phases.md` 全文（仅在 :17 复验时提及"A previous `Skipped` row is not a pass"、:117 禁止"silently Skips"，无任何一步定义何时合法产生 `Skipped`；:140 终态枚举也不含它）。后果：Done 定义允许一行以 `Skipped` 收尾，但该状态既无触发条件也无授权/阻塞记录语义，等于给了一个未经定义的绿灯出口，弱化本 Skill 最核心的 verdict 可信度。最小修复：在 phases.md Phase 4/5 补一句合法 `Skipped` 的定义（如"场景前提被已验证修复改变而失效时记 Skipped，须附原因"），或从 SKILL.md:14 与模板词汇表中删除 `Skipped`。
2. **[P2] in-place 切换前的 "dirty-state safety checks" 无判据** — 位置：`skills/spec-dogfood/references/phases.md:16`（"after dirty-state safety checks"）、`skills/spec-dogfood/SKILL.md:38`（列为 Failure Mode）。后果：这是授权后分支切换这一 mutation 路径上的唯一防线，但什么算"安全"（clean tree？dirty 路径与切换影响面无交集？）完全未定义，执行模型只能自行发明标准。最小修复：一句话给出最低判据（如"工作树不干净即中止并披露，或 dirty 路径与 checkout 影响文件无交集才继续"）。
3. **[P3] 两个判分脚本宽松度弱于合同承诺** — 位置：`evals/fixtures/scripts/check-owner-unavailable-stop.sh:11-12`（`hit_rt or hit_stop` 为 OR：只说"停止"不说 runtime-setup 指引也判过，而 SKILL.md:53 规定两者都有的固定消息）；`evals/fixtures/scripts/check-trunk-reject.sh:9-10`（词表含 'main'/'无法'，模型若错误继续执行并顺带提到 main 也会被判过）。后果：行为层 eval 可能放过低于合同要求的表现。最小修复：owner 用例改为 AND（runtime-setup 指引与停止语义同时命中）；trunk 用例去掉裸 'main' 或要求与拒绝动词共现。
4. **[P3] "mode flags" 在程序层无定义** — 位置：`skills/spec-dogfood/SKILL.md:16`（"strip only the recognized `--port PORT` pair and mode flags"），而其引用的程序真相源 `phases.md:7` 只定义剥离 `--port PORT`。后果：入口与程序之间的小幅失配，执行者可能自行猜测哪些算 mode flag 而误剥目标提示 token。最小修复：删除 "and mode flags"，或在 phases.md Phase 0 中列出被识别的 mode flags。
5. **[P3] fixture 脚本 `asks-a-question.sh` 无任何引用** — 位置：`skills/spec-dogfood/evals/fixtures/scripts/asks-a-question.sh:1`；`evals/eval.yaml:14-18` 与四个 case 均未引用（grep 证实）。后果：死资产，读者无法判断它属于哪个已删除/未建的 gate 场景，eval 清单失真。最小修复：删除，或补注册使用它的 case。
6. **[P3] 消费者规则空转（对测试侧的观察，非 Skill 缺陷）** — 位置：`tests/unit/dispatch-authorization-matrix-contracts.test.js:239-242` 与 `:421-423`；当前 `skills/spec-dogfood/SKILL.md` 已无任何 "task tool" 字样（grep 证实），`.every()` 断言空集通过。后果：该消费者边不再守护任何真实内容；因规则仍在，风险仅是测试卫生。最小修复：保持现状成立（规则保留可防回归），或在测试注释标注该规则当前为空转。

## 主责深挖面发现

- **D01（去补丁化）**：硬约束均能回溯到具体失败模式——trunk 解析 bash 块（phases.md:34-60）内嵌两条真实 gotcha 注释（remote-only trunk 必须 `origin/` 限定、PR/CI checkout 常无本地 main）；PR 身份保全针对 fork PR head 叫 `main` 的真实坑（phases.md:10-13）；`expect(phases).not.toContain('TRUNK=${TRUNK:-main}')`（mutation-authority-contracts.test.js:61）表明历史上的偷懒补丁已被移除而非堆叠。未发现过度指导：流程图要求按 diff 缩放（phases.md:90），回归测试要求带"无意义测试"豁免出口（phases.md:133），均是对真实失败的正确编码。
- **D02（领域知识）**：taxonomy 是真 QA 知识而非流程腔——旅程五要素（Entry/Action/Result/Destination/Aftermath，taxonomy:7-13）、email 全链路判定范例（taxonomy:15）、persona paper cut 定义（taxonomy:34-36）、文件→路由映射表（taxonomy:53-62）。phases.md:64-66 的 persona 来源次序（STRATEGY→PRODUCT→VISION→persona docs，无则标注推断）是本仓库约定的项目知识。职责分工正确：效果分类是 LLM 语义判断，deterministic floor 归 owner wrapper（SKILL.md:79，与 spec-test-browser SKILL.md:55 的自我声明一致）。
- **D03（验证门）**：四道门齐全且可定位——(a) 回归证明门（phases.md:133，fails-before/passes-after + 豁免须陈述理由）；(b) 套件门（phases.md:142，"A failed or unavailable suite is never recorded as passed"）；(c) verdict 门（SKILL.md:14，绿矩阵+红套件=not-ready）；(d) 授权门（五事实 YAML，SKILL.md:70-76）。这些是 prose 约定而非脚本强制，但 Skill 从未伪称脚本强制；唯一脚本强制的面（浏览器效果）诚实委托给 wrapper 且"pipeline refusal remains authoritative"。符合"响亮约定不伪造硬强制"的纪律。
- **D04（衔接）**：逐字核对三条跨技能合同全部对齐——`isolate pr:<number>`/`isolate <branch>`/`already_checked_out branch=<name> path=<path>`（phases.md:16 ↔ spec-worktree SKILL.md:84, :102, :144）；`mode:pipeline`+`target-origin:`+`not_run`/`not_supported`/`browser-mutation-authorization-required`（phases.md:111 ↔ spec-test-browser SKILL.md:5, :21, :30, :53 及 pipeline-orchestration.md:7, :14）；caller-owned server 边界两侧一致（dogfood Phase 3 作为 caller 起 server 并冻结 loopback origin，owner 明确不碰 server 生命周期）。一处层次关系值得肯定：owner 在 route 层记 `Skip`（带 limitation），dogfood 在 scenario 层升格为 `Blocked (needs human verify)`（phases.md:117），无语义冲突。
- **D05（紧凑性）**：总量约 394 行，分层合理。重复点：两处 Workflow 摘要（SKILL.md:40 h3 与 :85 h2，内容不同粒度、无矛盾）、两处"先读 phases.md"提醒（SKILL.md:20, :97，load-bearing 规则的冗余可接受）。实质不一致即 Findings #1（Skipped）与 #4（mode flags）两处，均一两句话可修。授权边界、Blocked 三态、resume 规则等关键规则单点可定位。
- **D08（上下文效率）**：加载时序设计与声明一致——phases.md 在 Phase 0 前读（SKILL.md:20），taxonomy 推迟到 2b（phases.md:94），报告模板在 Phase 2 末建 checkpoint 时才要求读（phases.md:24），persona/验收标准消费显式限定"bounded consumption ... not permission to author or mine project rules"（phases.md:66）。上游已知事实（PR base/head、persona、criteria）均被复用而非重新索取。

## 未读文件

- `tests/unit/plugin-modules.test.js`（935 行，仅读 360-420 段）：其余覆盖其他包的投射；spec-dogfood 相关 caller-edge 测试已完整读。未覆盖后果：极低。
- `tests/unit/dispatch-authorization-matrix-contracts.test.js`（1-199 行未读）：为其他 Skill 的 governed-packages 词表定义；spec-dogfood 出现的 239-242/421-438/565-574 已全读。未覆盖后果：极低。
- `skills/spec-worktree/scripts/worktree-manager.sh`：isolate 行为经其 SKILL.md 合同 + spec-worktree-contracts.test.js:114-128（实际执行脚本断言 already_checked_out 行为）间接验证，未读脚本源。未覆盖后果：isolate 结论基于合同与测试，非脚本逐行核对。
- `skills/spec-test-browser/references/route-and-report.md`：owner 的路由映射/报告格式细节未读；dogfood 消费的接口层合同已由 owner SKILL.md 与 pipeline-orchestration.md 核对。未覆盖后果：owner 返回报告的字段级格式未验证。
- `CHANGELOG.md` 中 spec-dogfood 相关条目：演化证据改用 git log 与消费者测试替代。未覆盖后果：低。

## 结论一句话

spec-dogfood 在静态合同层是一个授权模型完整、跨技能合同逐字对齐、验证门与降级路径诚实的高质量 orchestrator（17 pass / 1 not-applicable / 0 fail），两个 P2（`Skipped` 终态无产生规则、dirty-state 安全检查无判据）都集中在终态语义与切换安全这一小片，各一两句话即可最小修复，不动架构。
