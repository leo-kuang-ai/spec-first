# spec-project-rules 评审（R3）
## 逐项裁决表
| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-project-rules/SKILL.md:44-46,56,66；references/mining-method.md:7-9 | 准入三问、headless 环境性判定与抽样降级均有真实失败史锚点（evals/README.md:6 记录的 codex 顺从谣言 P1、hszq-app 14.7M tokens 实测），无过时或相互矛盾约束 |
| D02 | pass | references/mining-method.md:36-242；scripts/extract-deps.cjs:616 | 架构类别 A1-A6、前端 F1-F7、跨端 X1-X3、移动 M1-M3 全为项目私有边界知识；脚本注释明确"facts only；分类与规则合成归 LLM"，职责分工正确 |
| D03 | pass | scripts/extract-deps.cjs:323-384,580-633；SKILL.md:119-121 | `--verify`（违规边+ref 存活+别名扫描）以 exit 1 硬判定，freshness 显式声明 advisory 不翻转 exit code，LLM 语义义务（准入三问）未冒充机械判定 |
| D04 | pass | skills/using-spec-first/references/public-route-map.md:58；docs/user-guide/10-产物目录.md:26,94；references/knowledge-format.md:5,74-134 | 产物 `docs/architecture.md` + AGENTS.md 内嵌块（含条件祈使尾行）是对外衔接面，由后续会话消费，路由表与产物目录一致登记 |
| D05 | pass | skills/spec-project-rules/SKILL.md:1-123 | 入口 123 行承载三条执行路径与硬边界，细节下沉两份 references，无重复矛盾段；规则均可定位 |
| D06 | pass | SKILL.md:43-45,81；references/mining-method.md:31-33 | headless/无 subagent/无图谱候选时均显式降级（跳过嵌入记 `agents_embed_skipped`、顺序执行、回退 bounded reads），不虚构能力 |
| D07 | pass | SKILL.md:118-122；scripts/extract-deps.cjs:386-419；evals/ | source_commit git 基线 freshness + 失效条目 OUTDATED 约定提供演化机制，evals 提供失败→修订→复验链（evals/README.md:6） |
| D08 | pass | SKILL.md:52-59,63；scripts/extract-deps.cjs:520-578 | 读取范围由脚本确定性产出（模块清单/churn/抽样清单），LLM 不自创抽样；骨架先行与代表文件制显式控制上下文 |
| B01 | pass | SKILL.md:2-3,18-28；tests/unit/spec-project-rules-contracts.test.js:55-83；evals/trigger-cases.json:25-182 | description 正负触发语 + 4 个兄弟 skill 负向路由 case 由 contract test 固化；standalone_skill 身份与治理登记一致（skills-governance.json:447-462） |
| B02 | pass | SKILL.md:32-48；references/knowledge-format.md；tests/unit/spec-project-rules-contracts.test.js:41-53 | Inputs/Outputs 与 references/scripts/evals 资产集互相对应，contract test 钉死 v2 资产集与已退役 verify-deps.cjs；图谱候选显式标注 `provider_untrusted`（SKILL.md:10） |
| B03 | pass | SKILL.md:42-47；references/knowledge-format.md:122-124,144-147 | 目标仓库只读、唯一写入面限定、headless 环境性判定、上下文文本授权声明显式不构成授权、敏感三路不写 |
| B04 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:447-462；docs/catalog/runtime-capabilities.md:97；tests/unit/spec-project-rules-contracts.test.js:19-27 | source 为 `skills/spec-project-rules/`，八宿主 host_delivery 均登记为 skill 投射；knowledge-format.md:151 显式禁写 generated runtime 目录 |
| B05 | pass | SKILL.md:56,68-89,100-108；scripts/extract-deps.cjs:584-598；evals/fixtures/scripts/check-refresh-dirty.sh:8 | exit 2 降级 + 抽样披露、批次即恢复点（断点续跑）、畸形 marker 停下问、refresh-dirty 断言不回滚用户工作区改动（不盲目重试/修复）；唯一明显缺口（并行批共享写面冲突处理）未声明支持并行合入，详见 Findings F2 |
| B06 | pass | evals/eval.yaml:14-30；evals/README.md:3-7；SKILL.md:66,87,121 | 10 个 script-judge case 覆盖 bootstrap/回写/保鲜/降级/对抗面，judge 红绿可证伪、closeout 强制披露覆盖与 limitations |
| X01 | pass | SKILL.md:68-89；evals/cases/large-repo-batched.yaml:1-32 | 大仓分批：骨架先行、每批 ≤20 代表文件、增量合入即断点、有界取证裁决冲突，对应 eval case 存在 |
| X02 | pass | SKILL.md:107-108,119-121；knowledge-format.md:138-142 | v1 五文件目录遇上有处理（不迁移、交互确认）、OUTDATED 标注约定、verify/freshness 处理知识库演化；本 skill 不输出 schema 化 API |
| X03 | pass | SKILL.md:42-47；references/knowledge-format.md:144-147；evals/cases/sensitive-write-refusal.yaml:1-9 | 共享文件写入是该 skill 高风险面：preview/确认/headless 限定/敏感三路不写，且有对抗面 eval |
| X04 | pass | SKILL.md:42,66-67,70,87；references/knowledge-format.md:136-142 | closeout 强制 scope/确认回执/limitations/抽样比例/继续命令，批次即跨会话恢复点；source_commit 承载 freshness |

## Findings
1. **F1｜P3｜eval 元数据与真实引擎不同步（自报告口径内不一致）**——skills/spec-project-rules/evals/eval.yaml:10-11 声明 `engine.name: claude_code`，而 evals/README.md:3 自述 "engine=codex"、README.md:6 自述 2026-08-30 以 codex 引擎 10/10 绿。后果：maintainer 依据 README 复现全绿记录时实际跑的是另一引擎，历史 green 结论与当前 manifest 引擎对不上号，且 eval.yaml `environment.type: none` 叠加 README.md:9 自述"结构性证据"本就属弱隔离声明。最小修复：把 manifest 引擎与 README 自述口径统一（或显式写明"双引擎都跑过、各自结果"），并在 README 标注各轮次对应引擎。
2. **F2｜P3｜subagent 并行派发路径的共享写面冲突纪律缺失（被"未声明支持"兜住）**——SKILL.md:81 允许"宿主有 subagent 原语时可并行派发模块群会话"，但每批都要"立即增量合入"同一 `docs/architecture.md`（SKILL.md:80），并行合入同一文件的写冲突（dirty overlap）无任何处理规则；SKILL.md:83-87 的合入纪律只覆盖"与既有条目冲突"的语义仲裁，不覆盖文件级并发写。后果：若使用者按字面并行执行，后合入批可能覆盖先合入批的 marker 段内容。保持现状成立的依据：条款未声称并行合入安全，且 evals 只覆盖顺序路径；最小修复（可选）：在 SKILL.md:81 补一句"并行派发时合入阶段仍须串行（合入点互斥）"。
3. **F3｜P3｜judge 零改写断言存在 staged 盲区（已知局限已披露）**——evals/README.md:7 自述 judge 用 `git diff --quiet` 检测不到 staged 未 commit 改动。后果：被测 agent 若把违规写入 stage 而不 commit，多个 judge 的"零写入"断言会假绿。该局限已被 owner 显式记录且标注沿用既有 judge 模式，属诚实降级；最小修复（可选）：judge 增加 `git diff --cached --quiet` 断言。
4. **F4｜P3｜未提交（untracked）证据不进 churn，骨架批次切割可能偏离实际热点**——scripts/extract-deps.cjs:296-317 的 churn 只统计 git log，工作区未提交的新文件 churn=0；对"正在大改尚未提交"的目标仓库，第 2..N 批按 churn 排序的模块群切割会把活跃区排后。SKILL.md:79 已声明预选"按 churn 从 L0 模块内高变更文件"，属设计内取舍而非缺陷。保持现状成立。

## 主责深挖面发现（B05/B06 + 归因验证）
**B05 深挖（失败、恢复与隔离）**：
- 工具缺失/超时：git 不可用时 churn 静默归零（extract-deps.cjs:313-315,509-511），注释明确"churn is advisory, not blocking"，属有意降级且不自欺；freshness 无 git/浅克隆/基线不可解析 → `unavailable` 并退回全量重验且要求 closeout 披露（SKILL.md:121）。
- 重复执行：refresh_noop 路径（SKILL.md:122；check-refresh-noop.sh）确定性保证幂等——重跑不产生 diff；合入纪律（knowledge-format.md:64-72）保证 marker 算法幂等。
- 中断恢复：每批合入即断点（SKILL.md:70,80），恢复命令为 `--scope module:<name>`（SKILL.md:87），状态完全外化在知识库本身，无私有状态文件——恢复设计干净。
- 部分成功：单批上下文不足 → 缩小该批模块数不硬塞（SKILL.md:105）；50/50 分裂不写（mining-method.md:17）。
- 未知副作用先查状态：refresh-dirty 场景显式禁止"顺手修复"用户工作区改动（refresh-dirty.yaml:3-7；check-refresh-dirty.sh:8）。
- 残余缺口即 Findings F2（并行合入写冲突未规定），但该路径未声明支持并行合入，不构成 fail。

**B06 深挖（完整交付与审查质量）**：
- 行为级判据真实存在且红绿可证伪：10 个 case 各有 script judge（148 行合计），断言落到 marker 成对、frontmatter、小节存在/不存在（单端不得虚构依赖方向小节）、敏感零泄漏、零改写、零中间产物；evals/README.md:6 记录红向破坏产物全 FAIL 的可证伪性验证。
- 失败修复闭环有记录：2026-08-28 codex 顺从谣言 P1 → 回写闸门硬化 → 3/3 绿（evals/README.md:6），归因（模型顺从 + 闸门不足）与修复位置（SKILL.md:95 反向声称防护）对应。
- 已知局限披露完整：README.md:7（staged 盲区、marker-coexist 断言依赖内嵌筛选契约）、README.md:9（结构性 ≠ 语义/现场结论）。
- 未覆盖面的后果有限：内嵌块首次交互确认行为在 headless runner 不可测，README.md:3 显式声明"另行 fresh-source 覆盖、首嵌只测跳过"——缺口被显式管理而非隐藏。

**归因复核**：本轮静态审查未发现可推翻的既有归因；hszq-app 14.7M tokens 实测锚点（SKILL.md:89）与"单会话装不下大仓"的分批设计因果链一致；"codex 顺从谣言"归因到闸门不足而非模型标签，与当前 SKILL.md:44 的环境性 headless 判定、mining-method.md:22 反向声称防护三层加固一致，归因维持成立。

## 未读文件
- `evals/fixtures/repos/**`（约 60 个 fixture 源文件）：抽样核对了 prepare 脚本存在性与多组 fixture 目录结构，未逐文件读取；fixture 内容属评测数据而非 skill 合同，未覆盖后果：无法独立验证 fixture 是否精确诱发预期路径（如 internal-registry URL 确在 OldPanel.ts 中），但 judge 断言与 case 描述的对账已由 B06 的结构性检查覆盖。
- `evals/cases/refresh-noop.yaml`、`marker-coexist-embed.yaml`、`sensitive-write-refusal.yaml`、`single-end-degraded.yaml`、`admission-generic-refusal.yaml` 的 input.prompt 全文：只读了头部 description（每份 1-8 行）；后果：prompt 注入面（headless 声明措辞）未逐字核对，但该面已在 bootstrap-gold/large-repo-batched/sampling-fallback 三份全文中确认模式一致。
- `docs/validation/spec-project-rules/2026-08-29-*.md`（两份历史现场测评报告）：仅确认存在与导航登记；属历史行为证据，本轮静态合同审查不依赖其结论。
- 消费者清单文件 `…/input-packs/spec-project-rules.consumers.txt` 在冻结 worktree 中不存在（reviews/runs 目录未冻结进来），已按任务说明中的描述以 grep 全仓方式自行重建消费者面（tests/unit/spec-project-rules-{contracts,scripts}.test.js、project-graph-consumption-contracts.test.js、skills-governance.json、public-route-map.md、runtime-capabilities.md、docs/user-guide 两处），未覆盖后果：若清单另列了 grep 命不中的消费者（如按 hash 引用），则可能漏检，但 grep 覆盖 tests/src/skills/docs 全仓，风险低。

## 结论一句话
静态合同层面 18 项全部 pass：spec-project-rules 的 v2 单文件知识库设计、确定性脚本地板、headless/降级/回写闸门与 10-case 可证伪 eval 体系内部一致且可定位，仅余 eval 引擎元数据不同步、并行合入写面纪律缺失等 4 条 P3 级观察，均不阻断。
