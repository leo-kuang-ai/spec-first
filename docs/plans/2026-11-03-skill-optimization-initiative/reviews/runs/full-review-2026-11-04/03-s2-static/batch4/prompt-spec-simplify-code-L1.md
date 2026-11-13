你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-simplify-code/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **B03**
  - R1 pass：| B03 | pass | SKILL.md:11,13,57,73 | 只读请求 report-only、显式请求仅授权有界清理、dispatch 须当前用户或可见 upstream 明确授权、caller-owned 不 commit/landing；“reviewer 建议不推断写权限”阻断材料内嵌指令扩权 |
  - R2 fail：| B03 | fail | `skills/spec-simplify-code/SKILL.md:57`；`skills/spec-simplify-code/SKILL.md:59`；`docs/contracts/workflows/worker-dispatch-capability.md:37` | 已区分修改授权与派发授权，但派发路径未接入独立数据授权、worker 修改禁令及调用后副作用观察要求。 |
- **B05**
  - R1 pass：| B05 | pass | SKILL.md:25,69,77,91,98,100 | 无测试套件/无 blocking tool/背压（并发上限错误→排队重试非失败）/误报跳过/部分应用（字节比对+不整体还原用户编辑）/回归 revert 单点变更均有明确处理 |
  - R2 fail：| B05 | fail | `skills/spec-simplify-code/SKILL.md:69`；`docs/contracts/workflows/worker-dispatch-capability.md:106` | 容量错误后的排队重试没有次数、时间或耗尽出口，与 owning contract 的有界等待要求不一致。 |
- **X01**
  - R1 pass：| X01 | pass | SKILL.md:22,35,69,94-95 | 分支级多文件范围有 ownership 边界（禁跨包合并）、reviewer 有界并发+串行降级、验证按 ripple 风险扩大 |
  - R2 fail：| X01 | fail | `skills/spec-simplify-code/SKILL.md:35`；`skills/spec-simplify-code/SKILL.md:69`；`skills/spec-simplify-code/SKILL.md:95` | 跨模块影响检查和测试扩围已有约束，但长期零容量时无有界恢复出口；未提交多模块实现也受范围遗漏影响。 |

## R1 完整评审
# spec-simplify-code 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-simplify-code/SKILL.md:17,27,42,83,108；CHANGELOG.md:940 | 每条硬规则（bug 路由门、no-yield 预检、proof 保护、安全检查不可删、反行数指标）都对应已记录的真实失败并有回归 eval 锁定，无过时或互相矛盾约束 |
| D02 | pass | references/personas/code-reuse-reviewer.md:3-10；code-quality-reviewer.md:1-15；efficiency-reviewer.md:1-9 | 领域知识落在具体反模式与等价性判据（stdlib 替换须行为等价、框架门控、TOCTOU/N+1），dead-code 判定优先复用项目 linter/ast-grep，模型/工具分工恰当 |
| D03 | pass | SKILL.md:89-100,104；evals/fixtures/scripts/check-safety-preserved.sh:58-68 | 必需验证明确（全项目 typecheck/lint、proof 字节比对、重跑 proof、按爆炸半径跑测试），失败必须带检查名与输出；eval judge 用 sha256 机械强制保护面，语义判断未冒充机械判定 |
| D04 | pass | SKILL.md:11,37-42,104 ↔ skills/spec-lfg/references/review-followup.md:10-16；skills/spec-debug/SKILL.md:287-289；skills/spec-work/references/implementation-loop.md:58-60 | 上游传入的 proof-test token、session-settled 决策、验证证据被逐项消费；返回形状（保护路径、字节比对结果、evidence origin、limitations）与三个 caller 的消费条款对账成立 |
| D05 | pass | SKILL.md 全文（Step 1-5 分节 + 加粗门名）；SKILL.md:46-57 | 关键规则均可按节定位，无内部矛盾（narrow≠widen、fewer-lines 不是目标与 Step 5 量化口径一致）；dispatch 块是跨 18 包合同样板且单一位置可审计 |
| D06 | pass | SKILL.md:25,57,59,69,71,100 | 每项能力假设都有诚实降级路径：无授权→inline/serial+reason_code、能力缺失→subagent_capability_missing、blocking tool 缺失→编号选项、无测试套件→显式声明 |
| D07 | pass | CHANGELOG.md:940（交叉测评发现 codex 误收编 bug→Step 1 门→paired ×3 复验→darwin 90.5→91.5）；evals/eval.yaml:13-18；git 2907e928/1f72bfd0 | 演化由失败证据驱动、问题→修订→复验链完整，回归 eval 在库且失效条件由 judge 哈希锁定 |
| D08 | pass | SKILL.md:35,59,65,91,94 | 按需加载（persona 全文仅 lens 阶段读、test-value-lens 条件读）、复用 caller 证据与 pre-pass 快照而非重问、验证成本匹配爆炸半径（3 行改动不跑 20 分钟测试） |
| B01 | pass | SKILL.md:3,17,13；skills/using-spec-first/references/public-route-map.md:56；README.md:125 | 正向触发（tidy/refactor）+负例（bug→spec-debug、新功能/行为变更不做）+report-only 区分齐备，路由图与 README 口径一致 |
| B02 | pass | SKILL.md:61-65 所引 4 个 reference 文件均存在；tests/unit/specialized-skill-calibration-contracts.test.js:83-87、tests/unit/spec-lfg-contracts.test.js:83-86、tests/unit/dispatch-authorization-matrix-contracts.test.js:308-317 断言逐串命中当前源码 | 入口/reference/consumer 三方一致，无悬空引用、无未声明资产（孤儿脚本见 Findings-1） |
| B03 | pass | SKILL.md:11,13,57,73 | 只读请求 report-only、显式请求仅授权有界清理、dispatch 须当前用户或可见 upstream 明确授权、caller-owned 不 commit/landing；“reviewer 建议不推断写权限”阻断材料内嵌指令扩权 |
| B04 | pass | CLAUDE.md source 清单含 `skills/`；SKILL.md 与 4 个 reference 对 spawn_agent/Agent tool/Task tool/subagent primitive grep 0 命中；dispatch-authorization-matrix-contracts.test.js:412 显式锁定本文件无 primitive 泄漏 | 真相源在 `skills/spec-simplify-code/`，无自管生成资产，措辞宿主中立（"host's blocking question tool, matched by capability"） |
| B05 | pass | SKILL.md:25,69,77,91,98,100 | 无测试套件/无 blocking tool/背压（并发上限错误→排队重试非失败）/误报跳过/部分应用（字节比对+不整体还原用户编辑）/回归 revert 单点变更均有明确处理 |
| B06 | pass | SKILL.md:77-79,98,104-108；personas 均要求 `location (file:line`) | finding 强制带位置、量化按维度报告（applied/skipped/保持结果）、不可用时显式声明而非静默跳过、无 finding 时如实确认 |
| X01 | pass | SKILL.md:22,35,69,94-95 | 分支级多文件范围有 ownership 边界（禁跨包合并）、reviewer 有界并发+串行降级、验证按 ripple 风险扩大 |
| X02 | pass | references/personas/code-quality-reviewer.md:13（兼容面不重命名、删除需独立消费者证据）；tests/unit/spec-lfg-contracts.test.js:83-86 锁定接口字符串 | 自身对外契约（proof-test token、验证口径句）被消费者测试锁定，兼容面保护已入 persona 规则，无需新增 schema |
| X03 | pass | SKILL.md:79,83,91,98 | 变异型技能的风险对账成立：行为等价门（同输入/同错误/同副作用顺序）、安全检查白名单、失败二选一（修复或精确 revert）；无部署职责故无发布/回滚项 |
| X04 | pass | SKILL.md:11,42,91,104 ↔ spec-lfg/review-followup.md:16（编辑后旧绿收据过期、caller 拥有 final-tree 验证） | caller 交接带 summary/source refs/byte identity/freshness limitation，session-settled 决策保留，证据新鲜度规则双向一致 |

## Findings

1. **[P3] 孤儿 fixture 脚本 + 空 scope 提问行为无回归 case**
   - 位置：`skills/spec-simplify-code/evals/fixtures/scripts/asks-a-question.sh:1`；`skills/spec-simplify-code/evals/eval.yaml:13-18`
   - 后果：该脚本不被本 skill 任何 case 引用（eval.yaml 4 个 case 分别用 rule_based 与 3 个 check-* 脚本），是死资产并进入 npm 包/skill-up 上传面；同时 SKILL.md:25 的空 scope「必须提问、禁止静默跳过」门没有任何回归 case 保护——兄弟 skill（spec-prd/spec-plan/spec-brainstorm 等）均有引用同款脚本的 ask case，本 skill 的等价行为裸奔。
   - 最小修复：二选一——补一个 empty-scope-asks case 引用该脚本（推荐，补齐行为锁）；或删除孤儿脚本并在 eval 清单核对中登记。

2. **[P3] eval 环境声明为非隔离（`environment: type: none`）**
   - 位置：`skills/spec-simplify-code/evals/eval.yaml:3-4`
   - 后果：按 REVIEW-EXECUTION-WORKFLOW.md:203，非隔离运行时引擎可能混入本机已安装的 runtime 副本，行为结论须先确认被测 Skill 只来自 source；静态层这是诚实声明而非缺陷。
   - 处置：保持现状成立；依赖该 eval 的行为结论须逐次带来源确认记录。

## 主责深挖面发现

**D01（去补丁化）**：六条主要硬规则全部能回溯到已登记失败——Step 1 路由门对应 2026-09-02 codex「非法 JSON 直接 try/catch 收编」事件（CHANGELOG.md:940，回归 case bug-request-routes-debug.yaml）；no-yield 预检对应 docs-only 空转（docs-only-no-yield.yaml + judge 断言 fixture 零变化）；proof 保护与安全检查保护对应 simplification 删测试/删校验的两类经典破坏（check-safety-preserved.sh:146-151 逐输入断言 400）；Step 5 反行数指标对应「fewer lines as the win」误激励。未发现无失败来源的防御性补丁。唯一接近过度指导的是 L46-57 dispatch 记录块，但它由 `docs/contracts/workflows/worker-dispatch-capability.md` 合同与 dispatch-authorization-matrix 测试共同拥有，属合同投射而非本 skill 的临时补丁。

**D02（领域知识）**：三个 persona 是真正的编码领域知识载体（重复实现 stdlib 的行为等价判据、provider guarantee 边界、注释删除前的角色核查清单、no-op update 的 same-reference 语义），test-value-lens 补测试价值判据（「能对可信回归失败」定义）。流程控制只占 Step 编排层，比重恰当。一个值得肯定的细节：code-quality-reviewer.md:11 把「unused 判定」交给项目既有 linter 或 ast-grep 而非裸 grep，准确执行了 scripts-enforce-facts/LLM-judges-semantics 分工。

**D03（验证门）**：验证要求三层递进且每层有出口——机械层（typecheck/lint 全项目、proof 字节比对）、行为层（重跑 proof 与 reproducer，「earlier green results become stale after a production edit」L91 防旧证据冒充）、诚实层（无套件时显式声明 L100、不可用 proof 不标通过 L104）。字节比对在 eval 中由 judge 脚本 sha256 硬强制；生产路径是响亮约定但明确声明 caller 拥有 final-tree 验证（L91），未把约定伪装成硬门。未发现语义判断冒充机械判定。

**D04（衔接）**：与三个上游 caller 的契约逐条对上——spec-debug 传入的 reproducer+characterization paths 被 L42「unchanged regression and characterization tests」消费；spec-lfg 的「plan 是决策上下文不是范围」「不 commit」被 L37-40、L11 消费；spec-work 的 proof-test:<path>+seams+byte identity 语法与 L11/L42 的 token 语义一致。返回形状与 spec-work implementation-loop.md:60「Consume the returned preservation comparison and missing/stale limitations」精确互锁，且有 spec-lfg-contracts.test.js:83-86 字符串级消费者测试防漂移。一个边界确认：LFG 只给 step 4 的 code-review 传 dispatch authorization，不给 simplify 传——本 skill 按缺授权 inline 执行，两文一致无冲突。

**D05（紧凑性）**：108 行对带 dispatch 治理的变异型 skill 属合理密度；proof 规则在 L11/L42/L81/L91/L104 五处出现但各属一个阶段（token 语义→识别→修复期保护→事后比对→返回），非冗余复述。两处微瑕不影响裁决：L27-33 段内硬换行断句（纯排版）；L57「保持依赖 gate 打开」措辞晦涩但 fail-closed 读法唯一。删除任一主要规则都会损失一类已证失败的防护，无安全可删项。

**D08（上下文效率）**：按需加载设计清晰——persona 全文只在 lens 执行时读且禁凭记忆转述（防 rubric 失真），test-value-lens 条件读，imports/callers 读取明确「不进 mutation scope」（L35）；复用 caller 已固化的证据而非重问（L42、L91 快照比对）；验证成本与爆炸半径挂钩避免过度运行。摘要（Step 5）覆盖 caller 需回传的全部字段，无已知遗漏。

## 未读文件

- `tests/unit/spec-lfg-contracts.test.js:121-末尾`、`tests/unit/specialized-skill-calibration-contracts.test.js:1-59`——均为其他 skill（LFG 内部、polish/product-pulse）的断言；本 skill 相关断言（L13-16/77-87 与 L81-88）已全读。未覆盖后果：无。
- `evals/fixtures/scripts/check-r2-safety-stays.sh:1-87`——与 check-safety-preserved.sh:1-87 为同源 generated helper 前缀（两文件头两行均标注同一 builder），已读一份及本文件差异段 88-170。后果：无实质未覆盖。
- 两个 fixture repo 的 `README.md`/`package.json`/`docs/notes.md`/`test/support/ledger-proof.cjs` 未逐字读，judge manifest 中 sha256 未独立重算（沙箱拒绝 shasum 执行）；fixture 哈希一致性由 eval 时 judge 强制，静态裁决不受影响。
- `docs/contracts/workflows/worker-dispatch-capability.md:60 之后`——已读 Semantic Request/Eligibility/Schema Boundary 核心；fail-closed claims 细节未逐行。后果：dispatch 块与合同的对账基于已读部分，足够支撑 D04/B04 判断。

## 结论一句话

spec-simplify-code 静态合同层 18 项全部 pass：规则可定位、内部一致、与三个消费者测试及全部上游 caller 契约对账成立，演化有失败证据链与回归 eval 支撑；仅两处 P3（孤儿 ask 脚本+空 scope 提问行为无回归 case、eval 非隔离环境需运行时来源确认），无阻断项。


## R2 完整评审
# spec-simplify-code 评审（R2）

## 逐项裁决表

本轮仅裁决 `structure_contract` 静态合同，源码版本为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`。已完整读取技能包内全部 24 个受版本管理文件、指定的三个消费者测试、检查表及合同基线，并补读实际 LFG 调用方和 worker dispatch owning contract。未运行测试或行为评测；以下 pass 不代表行为质量或收益已经验证。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-simplify-code/SKILL.md:79`；`skills/spec-simplify-code/references/personas/code-quality-reviewer.md:13` | 等价性、安全检查和防过度简化约束具有明确风险依据，不是以模型能力不足为前提的无差别步骤堆叠。 |
| D02 | pass | `skills/spec-simplify-code/references/personas/code-reuse-reviewer.md:8`；`skills/spec-simplify-code/references/test-value-lens.md:5` | 提供 provider 保证、序列化等价性及测试价值等领域判断依据，工具取证与语义判断分工合理。 |
| D03 | pass | `skills/spec-simplify-code/SKILL.md:89`；`skills/spec-simplify-code/SKILL.md:91`；`skills/spec-simplify-code/SKILL.md:98` | 静态承诺明确要求实际检查、证据保鲜、失败披露及针对性修复或回退；这些是 prose 义务，不是运行时硬强制。 |
| D04 | fail | `skills/spec-simplify-code/SKILL.md:22`；`skills/spec-lfg/references/review-followup.md:14` | 默认 Git 范围只取分支提交差异，与 LFG 明确保留未提交实现的交接不匹配，可能漏掉本轮全部实现。 |
| D05 | pass | `skills/spec-simplify-code/SKILL.md:44`；`skills/spec-simplify-code/SKILL.md:65`；`skills/spec-simplify-code/SKILL.md:108` | 入口组织清晰，三类 rubric 外置，测试价值 lens 条件加载，汇总口径可定位且不以删行数代替价值。 |
| D06 | pass | `skills/spec-simplify-code/SKILL.md:57`；`skills/spec-simplify-code/SKILL.md:71` | 对能力未知、模型覆盖不支持和并发不明确均有诚实降级，不依赖固定模型或宿主 primitive 名称。 |
| D07 | pass | `skills/spec-simplify-code/evals/cases/safety-check-preserved.yaml:8`；`skills/spec-simplify-code/evals/fixtures/scripts/check-safety-preserved.sh:58` | 具有针对证明测试保护、安全行为和 Git 状态的维护用例与可定位 oracle；本技能不承担自动知识晋升职责。 |
| D08 | pass | `skills/spec-simplify-code/SKILL.md:27`；`skills/spec-simplify-code/SKILL.md:42`；`skills/spec-simplify-code/SKILL.md:67` | 先排除无收益范围，消费 caller 已有证据，并要求读取完整 rubric 而非凭记忆缩写。 |
| B01 | pass | `skills/spec-simplify-code/SKILL.md:3`；`skills/spec-simplify-code/SKILL.md:13`；`skills/spec-simplify-code/SKILL.md:17` | 简化、只读建议和缺陷请求分流清楚，caller-owned 调用返回 caller，不自行接管提交或发布。 |
| B02 | fail | `skills/spec-simplify-code/SKILL.md:19`；`skills/spec-lfg/SKILL.md:42`；`skills/spec-lfg/references/review-followup.md:14` | proof 输入与输出设计基本完整，但范围解析没有纳入实际消费者交付的未提交工作树变更。 |
| B03 | fail | `skills/spec-simplify-code/SKILL.md:57`；`skills/spec-simplify-code/SKILL.md:59`；`docs/contracts/workflows/worker-dispatch-capability.md:37` | 已区分修改授权与派发授权，但派发路径未接入独立数据授权、worker 修改禁令及调用后副作用观察要求。 |
| B04 | pass | `skills/spec-simplify-code/SKILL.md:27`；`skills/spec-simplify-code/SKILL.md:35`；`skills/spec-simplify-code/SKILL.md:37` | 排除生成资产清理，禁止跨 runtime ownership 合并，保留刻意重复的 package-local runtime 资产；不宣称已验证宿主投射。 |
| B05 | fail | `skills/spec-simplify-code/SKILL.md:69`；`docs/contracts/workflows/worker-dispatch-capability.md:106` | 容量错误后的排队重试没有次数、时间或耗尽出口，与 owning contract 的有界等待要求不一致。 |
| B06 | pass | `skills/spec-simplify-code/references/personas/code-quality-reviewer.md:17`；`skills/spec-simplify-code/SKILL.md:77`；`skills/spec-simplify-code/SKILL.md:104` | finding 定位、误报跳过、修复后验证、证明材料回传及未完成披露均有明确静态义务。 |
| X01 | fail | `skills/spec-simplify-code/SKILL.md:35`；`skills/spec-simplify-code/SKILL.md:69`；`skills/spec-simplify-code/SKILL.md:95` | 跨模块影响检查和测试扩围已有约束，但长期零容量时无有界恢复出口；未提交多模块实现也受范围遗漏影响。 |
| X02 | pass | `skills/spec-simplify-code/SKILL.md:79`；`skills/spec-simplify-code/references/personas/code-quality-reviewer.md:13` | 适用于涉及 API/架构的清理，但只允许等价变换，公共兼容面删除需要独立证据和授权；不要求该技能自行建立 ADR 或迁移体系。 |
| X03 | pass | `skills/spec-simplify-code/SKILL.md:81`；`skills/spec-simplify-code/SKILL.md:83`；`skills/spec-simplify-code/SKILL.md:98` | 高风险代码清理明确保护安全检查、证明测试及失败回退，不将清理升级为部署或发布授权。 |
| X04 | pass | `skills/spec-simplify-code/SKILL.md:11`；`skills/spec-simplify-code/SKILL.md:42`；`skills/spec-simplify-code/SKILL.md:104` | 协作交接包含 owner、来源、已定决策、证明路径、新鲜度及限制，并禁止把 inline lens 宣称为独立评审。 |

## Findings

### F1 · P1：默认分支差异遗漏 caller 留在工作树中的实现

- **位置：** `skills/spec-simplify-code/SKILL.md:22`；消费者证据为 `skills/spec-lfg/references/review-followup.md:14`。
- **事实与触发条件：** 有可用 base ref 时，入口默认采用 `git diff origin/main...` 一类分支提交差异，只有没有 upstream/base 时才使用 `git diff HEAD`。然而 LFG 明确要求前序实现和本步清理保持未提交。
- **后果：** 当实现完全位于 staged/unstaged 工作树中、当前 HEAD 与 base 相同时，默认范围为空，技能可能询问“简化什么”而不是消费已交付实现；存在历史提交时，则可能只清理历史提交而遗漏本轮修改。
- **最小修复建议：** 默认范围合并 base→HEAD 的提交差异与 HEAD→当前工作树的 staged/unstaged 差异，并保持 caller 授权路径限制；不要仅用 `git diff HEAD` 替换，否则会反向遗漏已提交变更。
- **复验建议：** 增加“base 存在且只有未提交实现”和“提交差异与工作树差异同时存在”两个消费者合同场景。

### F2 · P1：worker 派发只检查一般授权，未完整消费独立副作用边界

- **位置：** `skills/spec-simplify-code/SKILL.md:57`、`skills/spec-simplify-code/SKILL.md:59`、`skills/spec-simplify-code/SKILL.md:77`。
- **合同依据：** `docs/contracts/workflows/worker-dispatch-capability.md:37`、`:39`、`:85`、`:90`。
- **事实与触发条件：** 当前入口在用户授权派发且找到唯一 eligible generic worker 后，要求发送完整 diff/文件集；但未引用 owning contract，也未明确要求核对 provider trust domain、独立外发授权、只读 mutation scope 和调用前后状态观察。三个 persona 文件规定的是评审任务，不是可核验的副作用禁令。
- **后果：** 对符合通用 worker 能力但属于 external/unknown trust domain 的候选，一般派发授权可能被错误用于发送源码；worker 意外修改文件时，也没有规定先阻断该结果，再进入 findings 聚合。
- **最小修复建议：** 按需加载现有 worker dispatch owning contract，不重复建立协议；本步固定声明 reviewer 的 `mutation_scope: forbidden`，核对独立数据授权，观察调用前后相关状态，未证明无越界时不得消费结果。
- **复验建议：** 增加“派发获准但外发未获准”和“reviewer 返回 finding 同时修改文件”的负例。现有 `tests/unit/dispatch-authorization-matrix-contracts.test.js:308` 主要检查词汇存在，不能覆盖这两类缺口。

### F3 · P2：容量退避缺少耗尽条件

- **位置：** `skills/spec-simplify-code/SKILL.md:69`。
- **合同依据：** `docs/contracts/workflows/worker-dispatch-capability.md:106`。
- **事实与触发条件：** 指令要求容量错误时保持 reviewer 排队并等待空位重试，但没有规定等待时限、尝试次数或零容量耗尽后的处理。“Bounded dispatch”标题和同时运行数量限制，不等于重试过程有界。
- **后果：** 持续零容量或槽位不释放时，任务没有可定位的终止/降级出口，三个 lens 的完成和 caller 返回可能无限等待。
- **最小修复建议：** 复用 owning contract 的有界等待要求，给出预算耗尽条件及 `dispatch_backpressure_exhausted`，随后 serial/inline 完成尚未完成的 lens；不得伪称已获得独立评审覆盖。
- **复验建议：** 增加连续容量拒绝场景，检查能在预算内返回完整 lens 覆盖和真实降级原因。

## 主责深挖面发现

- **B01——保持现状成立。** 只读建议不产生修改授权，缺陷请求退出至 `spec-debug`，docs/generated/vendor 等无收益范围提前结束，边界见 `skills/spec-simplify-code/SKILL.md:13`、`:17`、`:27`。不应为统一流程而强制接入 PRD、Tasks 或发布尾流程。
- **B02——主要问题是范围交接，不是缺 YAML。** `proof-test:` 被明确规定为保护上下文而非新增修改范围，计划仅作决策上下文，设计成立，见 `skills/spec-simplify-code/SKILL.md:11`、`:37`。core/08 的拟议字段数量不应强套本技能；实际阻断是 F1。
- **B03——已有授权拆分值得保留，但独立副作用边界未闭合。** `skills/spec-simplify-code/SKILL.md:57` 对无授权不探测、不派发，以及 inline 覆盖不冒充独立评审的规定成立；不能因此推断 F2 中的外发与 worker mutation 边界也已满足。
- **B04——保持 source/runtime 分离成立。** `skills/spec-simplify-code/SKILL.md:35`、`:39` 明确保留 runtime ownership 与有意重复，不把“找到相似 helper”当作跨包合并授权。本轮只审 owning source，未把已安装 runtime 加载等同于 fresh-source 行为证据。
- **X01——无需新增复杂编排器。** 现有三个 lens、跨边界禁止合并、共享代码扩围验证已覆盖主要职责，见 `skills/spec-simplify-code/SKILL.md:59`、`:95`；修复 F1/F3 即可，不需要引入任务图或新状态机。
- **X02——兼容性变更应留在本技能范围外。** `skills/spec-simplify-code/references/personas/code-quality-reviewer.md:13` 要求公共兼容面删除具有独立证据与授权；不能因用户说“更优雅”而执行版本迁移。
- **X03——安全与证明保护设计成立。** `skills/spec-simplify-code/SKILL.md:81`、`:83` 明确将测试缺陷退回 owner 对账，而非弱化断言；对应 eval judge 检查证明文件字节、HEAD/index 和非法输入行为，见 `skills/spec-simplify-code/evals/fixtures/scripts/check-safety-preserved.sh:58`、`:146`。这是 oracle 存在的静态证据，不是本轮运行通过。
- **X04——交接保持轻量且信息充分。** `skills/spec-simplify-code/SKILL.md:42`、`:91`、`:104` 要求来源、命令、freshness limitation、当前树身份及 proof 结果返回 caller；无需让清理技能自行承担跨会话知识晋升或最终 closeout。

## 未读文件

- **被审范围内必读文件：无。** 已读完入口、全部四个 references、全部 eval 配置/案例/fixture/脚本、消费者清单所列三个测试、指定检查表与合同基线。
- `/Users/kuang/.codex/AGENTS.md`：读取调用未获权限，因此未读；这是全局兼容指令来源，不是被审技能材料，可能存在未能核对的附加执行约束，不能声称已遵循其未读取正文。
- `skills/spec-lfg/references/implementation-cleanup.md`：探查路径不存在，无正文可读；实际清理交接已改从存在的 `skills/spec-lfg/references/review-followup.md` 完整核对，不形成消费者覆盖缺口。

## 结论一句话

静态审查覆盖完成，但对象不通过：需优先修正未提交实现的范围遗漏、worker 独立副作用授权与观察缺口，以及容量重试无界问题；其余行为保持、证明保护和 caller-owned 交接设计应保留。


## 输出要求

对每个待仲裁维度输出一行：`| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |`，最后给修复建议（若有 fail）。只输出裁决表与建议。