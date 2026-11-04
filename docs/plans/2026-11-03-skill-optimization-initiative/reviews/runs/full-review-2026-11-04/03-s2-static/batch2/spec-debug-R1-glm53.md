# spec-debug 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-debug/SKILL.md:27,57-65,77,99,108; tests/unit/spec-debug-contracts.test.js:12-19 | 各流程约束均对应真实失败模式（重复修复问询、跳过复现、prior-attempt 重复踩坑），且由带负例断言的合同测试锁定；未发现过时或互相矛盾的约束 |
| D02 | pass | skills/spec-debug/references/investigation-techniques.md:21-31,83,173-191,328-344; references/anti-patterns.md:11-23; references/defense-in-depth.md:21-26; references/fix.md:17 | 领域知识密度高（根因追踪 worked example、bisect 退出码语义、bug-class 清单、debugger/仪表决策表、四层防御表）；脚本管事实、LLM 管因果充分性的分工在 SKILL.md:20 显式声明并有 CLI 落地 |
| D03 | pass | skills/spec-debug/SKILL.md:19,170,246,297-325; src/cli/helpers/verification-run-summary.js:21,55; src/cli/helpers/honest-closeout.js:30,338-341 | 验证门有真实可执行确定性地板（`verification-run-summary record --workflow spec-debug` 与 `honest-closeout validate`，spec-debug 在 ALLOWED_WORKFLOWS 内），失败可见（not-run reason_code、failed 不软化），prose gate 诚实标注为注意力提醒（SKILL.md:65） |
| D04 | pass | skills/spec-debug/SKILL.md:118,289,291,325; references/pipeline-return.md:38-82; skills/spec-lfg/references/pr-watch-loop.md:34; skills/spec-simplify-code/SKILL.md:4,11; skills/spec-code-review/SKILL.md:3-4,45; skills/spec-test-browser/SKILL.md:28-30 | 上下游接口全部实存且被测试锁定：pipeline-return 信封被 spec-lfg 消费（tests/unit/spec-work-lfg-recovery-contracts.test.js:58-69）、proof-test 参数、mode:agent base:\<ref\> report-only、target-origin 委派、spec-work 消费 debug summary ref |
| D05 | pass | skills/spec-debug/SKILL.md:85,116,120,176,244,29-35; references/fix.md:3 | 368 行入口 + 6 个按需 references 的加载分层清晰，关键规则可定位（因果链门 170、工作区检查 237-242、commit/landing 342-354）；存在两处 P3 级可审计性弱点（见 Findings F2/F3），不构成内部矛盾 |
| D06 | pass | skills/spec-debug/SKILL.md:9-11,194,223,368; references/investigate.md:69 | 能力假设带诚实降级路径：dispatch 不可用→ranked serial、提问工具缺失→文本通道、graph provider 缺失→bounded direct read、worker_capability_unproven 词表 |
| D07 | pass | git log 9a7d2023/3b0bb3bf/00fc279d/133aeae2/57e31b82/6f454c3a/3179761c/c659d006（CE 驱动修复链）; skills/spec-debug/SKILL.md:356-369; evals/cases/*.yaml ×5; evals/fixtures/scripts/check-diagnosis-no-fix.sh:2 | 问题→修订→合同测试复验闭环实存（8 个 CE 修复提交、负例断言防回归）；知识沉淀有失效条件门（learning capture gate）与预提交 eval 场景 |
| D08 | pass | skills/spec-debug/SKILL.md:89,95,104,108,122; references/investigate.md:26 | 读必要原文（issue 全评论线程）、复用已知事实（prior attempts 先从当前上下文恢复、不重复问）、按需加载（investigation-techniques 仅不可复现/bisect/性能时读）、防陈旧（测试约定 orientation 不跨 run/worktree 复用） |
| B01 | pass | skills/spec-debug/SKILL.md:3,118,200,235; skills/spec-work/SKILL.md:3; skills/spec-code-review/SKILL.md:3; references/investigate.md:11 | 正向触发词明确（bugs/errors/regressions/failing tests/slow/stalled investigation），负例边界双向互认（spec-work、spec-code-review、spec-optimize 均反向让位），内部 helper（spec-test-browser）不作用户入口 |
| B02 | pass | skills/spec-debug/SKILL.md:3-4,15-23; skills/spec-work/SKILL.md:64; skills/spec-prd/SKILL.md:164 | 入口/reference/script/CLI/consumer 一致：argument-hint 与输入类型匹配、`<bug_description>` 遵循宿主参数占位同构约定（对照 spec-work `<input_document>`）、所引合同与 CLI 命令全部实存 |
| B03 | pass | skills/spec-debug/SKILL.md:27,202,239,241,293,344-354; references/pipeline-return.md:10-19; references/investigate.md:31,57,63 | 授权分层严密：Fix it now 仅限有界本地修复、commit/landing 独立授权、材料内嵌指令不作授权（issue 评论仅作数据）、不重复索取已有授权（合同测试锁定）、stash 实验有记录/恢复契约 |
| B04 | pass | skills/spec-debug/SKILL.md:89; tests/unit/scenario-capability-matrix-contracts.test.js:28-38; docs/contracts/workflows/scenario-capability-matrix.md:59 | source/runtime 边界在 Phase 0 显式锁定（mirror 非源、drift 先修 source 再显式授权重生成），Scenario Capability 声明与矩阵高险 override 一致并被测试锁定；枚举陈旧问题记 P3（F1） |
| B05 | pass | skills/spec-debug/SKILL.md:227,240,291,301-303; references/fix.md:15; references/investigation-techniques.md:83; references/investigate.md:63 | 工具缺失（missing_dependency）、重试上限（三次失败修复→升级、一次参数纠错）、部分成功（failed 不软化）、dirty overlap（owner 决策/保真策略）、中断恢复（bisect 隔离+reset、stash 精确恢复）均有明确处理 |
| B06 | pass | skills/spec-debug/SKILL.md:261-273,275,291,293,329-340 | 交付可追溯（causal chain 带 file:line、verification_run_summary_ref、claim_limitations）、审查视角按分支状态选取、残余决策有 durable sink、diagnosis-only 不伪造 verdict |
| X01 | pass | skills/spec-debug/SKILL.md:89,223-227; references/investigation-techniques.md:45-59,289; references/fix.md:17 | 多模块场景（parent workspace target_repo、跨子系统并行探针、多组件边界仪表、同根跨文件有界核查）按需覆盖且复用宿主 dispatch 词表，不自造编排引擎 |
| X02 | pass | references/pipeline-return.md:73-82; tests/unit/spec-work-lfg-recovery-contracts.test.js:60-63; src/cli/helpers/verification-run-summary.js:17 | 接口版本演进有显式兼容处理（`fixed` 保留为 legacy 输入别名、新返回用 `fixed-not-pushed`）且被消费者测试锁定；共享 closeout 链带 schema 版本（verification-run-summary.v1） |
| X03 | pass | skills/spec-debug/SKILL.md:46-48,233,237-242,293,325,342-354; references/fix.md:11 | 高风险面（mutation 权限）风险与验证对账齐全：P0/P1 阻断 PR、失败必需验证阻断 verified 声明、secrets 门、commit/landing 分离、一次一改 |
| X04 | pass | skills/spec-debug/SKILL.md:293,356-369; references/pipeline-return.md:36-53 | 交接带 summary/source refs/freshness/limitations（远端源变化使旧调查失效 pipeline-return.md:53）、残余决策以完整单元保留、知识沉淀有失效条件门、独立覆盖不虚报（SKILL.md:291） |

## Findings

**F1（P3 · B04）runtime mirror 枚举滞后于当前宿主集**
- 位置：skills/spec-debug/SKILL.md:89
- 后果：枚举列出 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/`，遗漏 `.opencode/`（及 zcode/pi 镜像）；当前支持宿主以 `getSupportedPlatforms()` 为准含 opencode（docs/user-guide/README.md:3、CLAUDE.md runtime 清单均含 `.opencode/`）。在 OpenCode 宿主上排障时，agent 判断 `.opencode/skills/...` 是否 source 得不到该清单的显式非源标记。风险低——同句通用原则「Canonical checked-in source is the fix owner」仍然管辖。
- 最小修复：把枚举改为「generated runtime mirrors（以当前 supported-host 清单为准，如 `.claude/`、`.codex/`、`.opencode/` 等）are not source」，或补上 `.opencode/`。

**F2（P3 · D05）跨文件裸步骤号引用，重编号即静默断裂**
- 位置：skills/spec-debug/SKILL.md:246（"For every command in steps 3, 5, and 6"）→ references/fix.md:9-13 的编号列表
- 后果：该步骤号指向 fix.md 的 1-7 步但不点名文件；fix.md 将来重编号会静默错位，且 tests/unit/spec-debug-fix-reference-contracts.test.js 只锁文本存在、不锁步骤号对应关系。
- 最小修复：改为 "in `references/fix.md` steps 3, 5, and 6"，或改用步骤名（红检查、绿/复现/广义检查、自审）引用。

**F3（P3 · D05/D01）并行调查段落单段过载**
- 位置：skills/spec-debug/SKILL.md:223
- 后果：约 200 词单段内含 10+ 词表 token 与 6 条边界规则，可定位（同一行）但可读性差，LLM 漏读其中单条边界（如 probe 只读、不并发依赖假设）的风险升高。token 必须留在 SKILL.md：dispatch-authorization-matrix-contracts.test.js:101-104,308-317 规定 spec-debug 的 boundary source 仅为 SKILL.md 且须含全部语义词表。
- 最小修复：在 SKILL.md 内将该段拆为 3-4 行短列表（token 不迁移，避免改 governed sources 清单）；或走合同变更把 spec-debug 的 boundary sources 扩到含 dispatch reference（改动更大，需同步合同测试）。

**F4（P3 · D07/评测）eval 声明 `environment: type: none`，隔离来源未标注**
- 位置：skills/spec-debug/evals/eval.yaml:4
- 后果：按 REVIEW-EXECUTION-WORKFLOW.md §7，非隔离 eval 运行时引擎可能同时加载本机已安装的 runtime 副本，行为层结果需先确认被测 Skill 只来自 source；当前 eval.yaml 无此确认记录。静态合同（5 个 case 文件、judge 脚本、fixture hash 锁）本身完整，属 S3 行为层补证项，非本轮静态缺陷。
- 最小修复：在 eval.yaml 注释或 evals 文档中登记「运行前确认加载来源；无法确认时行为结果标注可能混入 runtime 副本」。

**F5（P3 · D05，保持现状成立）「no further phase skipping」与 diagnosis-only 跳过 Phase 3 的表面张力**
- 位置：skills/spec-debug/SKILL.md:77 vs 27,185,235
- 后果：严格读 77 行可能理解为禁止跳过 Phase 3；但 27/185/235 三处显式规定 diagnosis-only 意图下直接交付 Phase 4，specific-beats-general，且被 eval case diagnosis-only-no-fix.yaml 覆盖。
- 建议：保持现状成立；若要消除歧义，可在 77 行补半句 "except intent-based early termination (diagnosis-only)"。

## 主责深挖面发现

**D01-D05 + D08 深挖结论：**

1. **去补丁化证据链罕见地完整**。多数流程约束能回溯到「真实失败 → CE 捕获 → 修复 → 合同测试负例锁定」闭环：例如重复修复问询的移除由 spec-debug-contracts.test.js:17-18 的 `not.toContain('Do not assume the user wants action right now.')` 钉死；prior-attempt 行为由两个 eval case + judge 脚本钉死。这使 D01 的「约束解决什么真实失败」有据可答，而不是最佳实践口号。
2. **职责分层是全仓典范**。入口只保留 load-time 条件与授权/出口边界，机制全部下沉 references（fix.md 仅 19 行承载全部 test-first 机制，由 fix-reference 测试锁定分工）；确定性验证（run summary、honest closeout）落在真实 CLI（src/cli/helpers/，spec-debug 在 ALLOWED_WORKFLOWS），语义判断（因果充分性）显式留给 LLM（SKILL.md:20）。D02/D03 交叉验证均成立。
3. **上下文效率的两个亮点值得保持**：测试约定 orientation「用后即弃、不跨 worktree 复用」（SKILL.md:122）直接防陈旧上下文污染；prior-work 搜索明确「不重新推导 Phase 1.3 git log 已给出的结论」（investigate.md:26）防止重复读。
4. **主要残余风险集中在 D05 的三处局部（F2/F3/F5）与 B04 的枚举陈旧（F1）**，均为 P3，不动摇静态合同成立性；其中 F3 受既有 dispatch 合同测试结构约束，修复需在「SKILL.md 内重排」与「扩 governed sources」之间做取舍，不宜顺手单改。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| skills/spec-debug/evals/fixtures/scripts/check-fixed-no-commit.sh、check-prior-attempt-ask.sh、check-r2-prior-ask.sh、asks-a-question.sh | 已读同 builder 生成的 check-diagnosis-no-fix.sh，且四者被 spec-debug-judge-calibration.test.js 正反例全量执行 | judge 脚本自身潜在缺陷不在本轮证据内 |
| skills/spec-debug/evals/fixtures/repos/mini-ledger/（README/package.json/prepare-eval.cjs/src/server.js） | fixture 字节由 judge 脚本 sha256 锁定、由校准测试实际执行 | fixture 内容过期不会被本轮文本审查发现（但 judge hash 会拒绝过期基线） |
| docs/contracts/verification/verification-run-summary.md、docs/contracts/workflows/honest-closeout.md、anti-rationalization-pattern.md 正文 | 以 enforcing 实现（src/cli/helpers/*）+ 消费测试替代核对 | 合同文档与 CLI 实现间的措辞级漂移未逐句对账 |
| docs/contracts/workflows/scenario-capability-matrix.md 仅读高险段（30-80 行） | SKILL.md 只声明 Overrides，默认矩阵行不直接约束 spec-debug | 默认矩阵行语义与 SKILL.md 的对账不完整 |
| scripts/evals/build-outcome-judges.cjs | judge 生成器；judge 脚本头部注明来源 | builder 与已提交 judge 脚本的同步性未验证 |

（消费者清单 10 个测试文件已全部读完。）

## 结论一句话

spec-debug 在静态合同层 18/18 全 pass：授权分层、验证确定性地板、上下游衔接与经验演化闭环均有可定位证据并被消费者测试锁定；残余为 5 条 P3 观察（枚举陈旧、裸步骤号引用、段落密度、eval 隔离标注、表面张力），无阻断项，保持现状或按最小修复逐条处理均可。
