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
