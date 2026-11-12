# spec-first AI Coding Harness 全量代码深度架构审查报告

> 日期：2026-11-09 · 审查对象：分支 `leo-2026-10-27-update` 磁盘在途状态（60 文件未提交 +1293/-586；doctor 实测 `.claude/skills` spec-plan 源-镜像 drift，与 S4 报告「FIX-069 未跑真实 init」声明一致）
> 方法：39/39 skill 目录、1292 文件**全量精读（无抽查）** + CLI 核心本人精读 + 逐条回源核验 · 只读审查，未修改任何被审文件
> 基线：`docs/methodology/结构化项目角色契约.md` v3.5 + `docs/contracts/` 合同层
> 与 `docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/05-s4-report/S4-FINAL-REPORT.md`（静态 18 维收敛 + 行为基线 154/155）口径互补，不重复对账。

## 结论

本项目的架构主张与代码实现高度一致——**未发现任何 P0**：无伪造确定性校验、无 advisory 冒充 confirmed、无未授权 mutation 路径、无引导手改 generated mirror 的实例。五类硬 gate（mutation / verification / source-runtime / handoff / knowledge promotion）在关键位置有真实实现；「Scripts enforce deterministic invariants; LLM decides semantic adequacy」是可验证的代码事实。

真正需要修的不是契约违约，而是三类系统性弱点：

1. **S1｜eval 回路自身带病**（3 条 P1 + ~14 条 P2）——全仓质量反馈回路的 judge 层存在词表近恒真、字节 bug、语义错位、双胞胎 judge、死资产与覆盖倒挂；
2. **S2｜load-bearing 不变量多副本漂移**（~9 条 P2）——dispatch 六字段、reason_code 枚举、host 映射等手工复制且已实际漂移，其中 1 条为**活体失败断言**；
3. **S3｜少量外发披露缺口**（2 条 P2）。

**总判**：该 harness 具备帮助研发高质量完成需求交付的真实能力，当前无阻塞项；按第六节顺序修复后，作为质量回路的基础设施可信度再上一档。

## 一、范围与方法（全量覆盖账）

| 簇 | Skills | 覆盖 |
|---|---|---|
| spec-prd | — | 56/56 |
| 入口/自治 | using-spec-first、_shared、autoresearch、spec-dogfood、spec-test-browser、spec-test-xcode | 78/78 |
| planning | spec-plan、spec-write-tasks | 111/111 |
| product | spec-product-pulse、spec-sweep、spec-promote、spec-riffrec-feedback-analysis、spec-prototype、spec-polish | 114/116* |
| debug/optimize | spec-debug、spec-optimize、spec-resolve-pr-feedback | 87/87 |
| 架构知识 | spec-app-consistency-audit、spec-rule-miner、spec-project-rules、spec-write-skill | 232/232 |
| runtime-setup | — | 88/88 |
| execution | spec-work、spec-worktree、spec-lfg、spec-commit、spec-commit-push-pr | 127/127 |
| definition | spec-ideate、spec-brainstorm、spec-strategy、spec-pov | 104/104* |
| knowledge | spec-compound、spec-compound-refresh、spec-handoff、spec-explain | 151/151 |
| review | spec-code-review、spec-doc-review、spec-simplify-code | 144/146* |

\* 未读项仅 5 个 `.pyc` 字节码缓存（gitignored 二进制）与 1 个 vendored minified 产物（头尾完整性校验后按第三方对待）。字节级相同副本（mini-ledger fixture、共享 judge 等）读一份 + `diff`/`sha256` 等价性验证。

**核验方法**：11 个分簇只读 reviewer 并行全量解读（每人先完整读角色契约）；主审对全部 P1 与 34 条 P2 中的 26 条逐条回源核验（含 node `includes` 复演、`xxd`/`od` 字节级确认、`diff -q` 等价性复验），其余经跨簇互证或标注置信度。核验修正了 agent 报告 1 处路径笔误（compound discoverability 实际为 `refresh-and-discoverability.md`）、1 处量级失准（prd SKILL.md:25 实测 113 词非 400+）、1 处严重度调和（peer-job-runner 休眠残留统一 P3）。

## 二、架构总评（主审精读锚定）

| 层 | 判定 | 关键证据 |
|---|---|---|
| 确定性地板 | 优 | `src/cli/state.js:618-760`（operation plan + symlink 逃逸防护 + Windows 保留名 + 共享根「不确定即保留」）；`atomic-write.js`（Windows EPERM 重试、link-if-absent） |
| 硬 gate 运行时 | 优 | `templates/claude/hooks/prd-prewrite-guard`（PreToolUse exit-2 阻断 machine-owned receipt 字段 + degraded 重建降级）；`docs/contracts/workflows/mutation-enforcement.md` 逐宿主强制差异如实列表 |
| 多宿主投射 | 优 | `platform-registry.js`（8 宿主 surface 三分类 ownership + capabilities reasonCode 降级）；`skills-governance.json` 交付矩阵 + schema；`setup-registry.schema.json` const/pattern 级供应链锁死 |
| 治理合同 | 优 | `docs/contracts/ai-coding-harness.md` 六层分层与实现互证一致 |
| 职责分工 | 优 | 11 簇一致结论：无脚本做语义决策、无 LLM 冒充校验；runtime-setup / compound / write-skill 为范本 |
| 已知弱点 | 见第四节 | eval judge 层（S1）、多副本漂移（S2） |

CLI 侧本人另记 3 条 P3：`adapters/claude.js:239-241` 空壳重写函数遗留；`claude.js:389-404` 与 `state.js:740-760` 的 `removeEmptyParents` 重复实现且前者用 state.js 注释里明确否定的 `startsWith` 弱判定；`state.js` `applyOperationPlan` 逐 op 应用无整体事务回滚（半应用风险，已被 plan 侧预校验缓解）。

## 三、P1（3 条，全部回源核验确认）

1. **[spec-resolve-pr-feedback] `evals/fixtures/scripts/check-authorized-fix.sh:6-11`** — 全仓唯一验证「授权修复」行为的 case，judge 只 `grep "Known limitations"`；prompt 明确授予的 commit 与明示不授予的 push/reply 两面均无自动断言（注释自认「不越项由 transcript 人工核验」）。授权矩阵三面回归网只剩 fix 一面。
2. **[spec-optimize] `evals/eval.yaml:14-18`** — 4 个 case（no-metric-gated / empty-input-asks / debug-routes-out / r2-no-measure）全为入口 gate/路由；机制最重的 skill（`decide.cjs` 655 行、measurement-admission、worktree 预算）核心迭代环（baseline→experiment→decide→keep/integration）**零行为覆盖**——错误 keep、伪改善、成本超支无回归拦截。
3. **[spec-brainstorm] `evals/fixtures/scripts/check-r2-asks.sh:8`**（xxd 确认 `273f 272c 2027 3f27`）— 活 judge 词表末两项均为半角 U+003F，全角 `？` 缺失，中文问句假阴性 FAIL。同款 bug 另见 optimize（活）、ideate（死副本）、app-audit（`'??'` 字符串迭代，`check-no-input-gate.sh:10`）共 4 处——该 bug 类 S4 修复已沉淀教训（judge 词表需按被镜像源码承载），但修复未传播到全部副本。

## 四、P2 系统性主题（34 条）

### S1｜eval 回路自身带病（~14 条）

| # | 位置 | 问题 |
|---|---|---|
| 1 | spec-dogfood `evals/fixtures/scripts/check-trunk-reject.sh:9` | 词表含 `'main'`（输入分支名即命中），judge 近恒真 |
| 2 | spec-dogfood `check-owner-unavailable-stop.sh:10-11` | 判定为 `hit_rt or hit_stop`——任意出现 `'stop'/'无法'` 即通过，owner 停止语义未断言 |
| 3 | spec-app-consistency-audit `evals/cases/test-only-routes-out.yaml:14` | case 意图为路由拒绝，judge 挂输入缺失词表——正确路由回答可误判失败，错误索要 PRD 反而通过 |
| 4 | spec-explain `evals/cases/simple-qa-not-triggered.yaml:20` | `files_not_exist: docs/explainers` 指向 skill 从不写的路径，恒真；词表含主题词复述即命中——唯一行为判据区分力≈0 |
| 5 | spec-handoff `check-degraded-orientation.sh ≡ check-resume-no-side-effects.sh` | 双胞胎 judge 逐字节 IDENTICAL（diff 确认），「降级保持不确定性」半边无独立判据，case 数虚增 |
| 6 | spec-commit-push-pr `check-desc-only.sh ≡ check-landing-gate.sh`（字节相同） | 两 case 机器断言集完全一致，description-only 独有行为无专属断言 |
| 7 | spec-work 四个 judge 两两字节相同 | 11 case 名义覆盖去重后 5 个独立断言集 + 2 rule_based |
| 8 | spec-pov `evals/eval.yaml:10-12` | 仅 2 例路由形状断言；双地板 gate、五级 Grade、三档 Reversibility Tier、pov-schema.json 输出合同零 eval 锚定（「whole moat」无回归保护） |
| 9 | spec-doc-review 写路径零 eval 且无 not-run 声明 | 6 case 全在 fail-closed/report-only 面；`mutation_policy: markdown-write` 交互路径无覆盖（对照 cross-model-eval.md 有显式 not-run 登记惯例） |
| 10 | spec-simplify-code `evals/fixtures/scripts/asks-a-question.sh` | 孤儿 judge（eval.yaml 4 case 零引用）——「stop and ask」分支的回归防护丢失 |
| 11 | 死 judge 资产 ≥7 处 | ideate `check-r2-asks.sh`、sweep/riffrec/using-spec-first/lfg/handoff 的 `asks-a-question.sh` 等；多份比在用版更完备（unicodedata 码点判定恰好都在死副本里） |
| 12 | spec-optimize `check-r2-asks.sh:8` | P1-3 同款问号 bug（独立文件，判 flaky fail） |
| 13 | spec-resolve-pr-feedback `check-readonly.sh:6-14` | 只读保护只 grep README/server.js，不查 git HEAD/index 与新建文件（对照 spec-debug `check-diagnosis-no-fix.sh:83-117` 全量保护） |
| 14 | spec-worktree `check-not-git-refuses.sh:14` 等 | 拒绝语义用宽松词表，未锚定 `worktree-manager.sh` 实际 reason_code（有「未创建 .worktrees」副作用断言兜底） |

**对照范本**（强判据已在本仓成熟，问题是不均衡）：spec-prd（机器 token 锚定 + 模板/judge 三方表头逐列比对）、spec-debug（真实启服 HTTP 400 行为探针）、spec-strategy（sha256 基线 + `wx` receipt 防重放）、spec-code-review（peer-job-runner parity 测试锁定三副本）。

### S2｜load-bearing 不变量多副本漂移（~9 条）

| # | 位置 | 问题 |
|---|---|---|
| 15 | dispatch 六字段授权块 ≥6 处手工复制 | definition 簇（pov/ideate/brainstorm）+ debug/optimize/resolve 三簇逐字重复且已微漂移（pov 版 `worker_dispatch_outcome` 字段位置异动）；`_shared` 分发机制存在（settled-decisions 实测零漂移）但未覆盖此块 |
| 16 | spec-write-tasks `evals/output-quality-cases.json:40-43` | **活体失败**：断言 `spec-first tasks validate <path> --json`，SKILL.md 已改为 `--repo <artifact-root> --json`（node 复演 `includes` 旧形态=false）；仓库自己的漂移检测器正处于失败态，两文件均已提交 |
| 17 | spec-write-tasks `SKILL.md:67` vs `:40` 与 `execution-handoff-contract.md:14` | Core Rule 10 强制的 `source_plan_non_active` 不在两处 reason_code 枚举；`evals/output/cases.jsonl:1-2` smoke 样例又示范第三个枚举外值 |
| 18 | spec-runtime-setup `workspace-graph-status.cjs:538` | host→entry-file 映射双实现（routing-inject 侧含 pi），status 侧 AGENTS.md 组缺 pi——漂移已发生实例 |
| 19 | spec-ideate/brainstorm `check-r2-asks.sh` | 两副本词表已分叉（brainstorm 多 `'一个问题'`）——同一输出在两 skill eval 下可得出相反结论 |
| 20 | spec-compound `references/refresh-and-discoverability.md` | 缺 spec-compound-refresh 版 `discoverability.md:7` 有的 managed-block 非直改警示——更可能写 docs 的 skill 反而缺 source/runtime 边界警示（核验修正：原报告路径笔误） |
| 21 | spec-polish `scripts/resolve-port.sh:225-255` | 实现 Probe 3=Procfile / Probe 4=puma，与文件头注释及 `references/dev-server-detection.md:11-12` 双双相反——Rails 项目端口不一致时产出错误事实 |
| 22 | spec-app-consistency-audit `scripts/extract-figma-contract.js:49`（同型 ×3） | `repoRoot \|\| source \|\| cwd` 回退与 `mode-output-contract.md:56-58`「resolve against repoRoot, not sourceRoot」矛盾；runner 不向 extractor 传 `--repo-root`，`source:<subdir>` 场景可整 run `step_failed` |
| 23 | 安全函数双份 | app-audit `preflight.js:250-308` vs `lib/audit-utils.js`（8 个安全函数）；`state.js` vs `claude.js` 的 `removeEmptyParents`（后者用弱 `startsWith`） |

### S3｜外发披露缺口（2 条）

| # | 位置 | 问题 |
|---|---|---|
| 24 | autoresearch `improve.md:64` | `WebSearch` 迭代协议将用户提供的 ICP/竞品/业务方向逐字送入公网搜索，Setup 问答与协议均无外发披露/脱敏选项——违反角色契约 §2「数据外发需明确授权、最少必要数据」 |
| 25 | spec-promote `references/spiral-cli.md:59-63` | opt-out 持久化会 append `.git/info/exclude`（git 元数据面写入），授权问句只说「won't bring up Spiral again」未点名该副作用（写入有 untracked/symlink 前置检查且 fail-open，属缓解） |

### 其余单项 P2（9 条）

| # | 位置 | 问题 |
|---|---|---|
| 26 | spec-worktree `scripts/worktree-manager.sh:688-698` | linked-worktree 态 in-place `git checkout` 无 dirty 前置检查（全文件 `dirty|fingerprint|porcelain` 零命中）——脏文件被静默带上新分支基线；detect/create 路径均 fail-closed，唯独此 mutation 路径缺失 |
| 27 | spec-brainstorm `evals/cases/r2-verdict-graphql.yaml:8`、`verdict-routes-to-pov.yaml:11` | prompt 内嵌 `.claude/skills/spec-brainstorm/SKILL.md`（实测不存在，实际投射在 `.claude/spec-first/workflows/`）；source 侧 eval 引用 generated-runtime 路径，镜像 drift 时测过期内容（skill-up local_path 是否运行时装入 unverified） |
| 28 | spec-prd `references/grill-with-docs-integration.md:42-46` | `/Users/kuang/...` 维护者本机绝对路径 ×3 随包分发（有 snapshot provenance 框定，但仓库外路径不可复核） |
| 29 | spec-prd `evals/contract-reset-cases.json:3` | `frozen_at: 2026-07-11` 冻结近 4 个月，~3.7K 行基建无语义产出且无重估条件记录——违反 CLAUDE.md「机制就位即负有激活或显式暂缓记录义务」 |
| 30 | spec-prd `SKILL.md:25` | 单行 113 词中英混排长段承载全部宿主强制差异语义（授权语义最密处可读性=契约风险） |
| 31 | spec-optimize `references/optimize-spec-schema.yaml:186-192` | `judge.model` 枚举 haiku/sonnet——Anthropic 宿主模型名写入跨宿主 spec contract |
| 32 | spec-compound `references/research.md:132` | `unblocked` 特定环境 MCP 工具名泄漏进通用 prose（降级链本身完整） |
| 33 | spec-sweep `SKILL.md:125` | `spec-lfg docs/plans/feedback-sweep-plan.md` handoff 仅 sweep 侧自引用，零跨 skill 契约测试锁定（对照 polish→test-browser 有 contracts 测试） |
| 34 | spec-optimize `SKILL.md:131`、`:158-168`；spec-debug `SKILL.md:303-329` | 段落归属错位（高吞吐审批规则埋进 Measurement-Only 节）；300 词规则群无归属标题；debug closeout 硬依赖 `spec-first internal` CLI 无降级路径 |

## 五、正面确认与 39 skill 净贡献

**值得确认的强项**：spec-runtime-setup（22K 行 scripts）P2=0——host authority fail-closed 门、host-config 写入纪律（锁/备份/post-verify/恢复）、schema 级供应链锁死为全仓标杆；spec-test-browser（SHA-256 binary 身份绑定 + 运行时 conformance）；spec-sweep state engine（lease/flock/原子写/closed 证据门）；spec-write-skill（TOCTOU 拒绝 + not-ready 停止）为 mutation gate 最完整单点；spec-handoff 把「材料内嵌指令不产生授权」做成带注入陷阱 + 伪造授权话术的可回归证据；知识晋级失效边界在 rule-miner/project-rules/write-skill 三处制度化；休眠能力治理诚实（cross-model 三层 fail-closed、`code_review_handoff` 休眠声明、peer-job-runner 三副本有 parity 测试与重估条件）。

| 判定 | Skills |
|---|---|
| 强正 | spec-prd、spec-plan、spec-work、spec-code-review、spec-debug、spec-runtime-setup、spec-write-skill、spec-handoff、spec-lfg、spec-resolve-pr-feedback、spec-test-browser |
| 正 | using-spec-first、spec-write-tasks、spec-doc-review、spec-brainstorm、spec-ideate、spec-strategy、spec-pov、spec-optimize、spec-compound、spec-compound-refresh、spec-sweep、spec-riffrec-feedback-analysis、spec-prototype、spec-polish、spec-worktree、spec-commit、spec-commit-push-pr、spec-project-rules、spec-app-consistency-audit、spec-rule-miner、spec-dogfood、spec-test-xcode、autoresearch、_shared |
| 中性偏正（保持 Experiment 定位） | spec-product-pulse（运营观察侧路，体量克制）、spec-promote（draft-only 边界硬）、spec-explain（证据面短板） |

**附**（review 簇观察，值得治理决策）：宿主内置命令（`/simplify`、`/code-review`）与 spec 同域 skill 的触发面重叠未治理——`using-spec-first` 只管 spec-* 内部路由，用户可能被路由到宿主内置而非 spec-first 管线。

## 六、最小可维护修复顺序（80/20）

1. **P1 同根一次性 sweep**（~半天）：问号 bug 4 处统一到 `asks-a-question.sh:20` 的 unicodedata 码点版（改 builder 源头 `scripts/evals/build-outcome-judges.cjs` 一并再生）；optimize 补 1 个核心环 case（错误 keep 拒绝最高价值）；resolve-pr-feedback judge 补 git HEAD 断言。
2. **活体失败断言 + 枚举同步**：write-tasks `output-quality-cases.json` 对齐 `--repo` 形态；reason_code 枚举三处同步 + parity test（复制 `task-pack-schema.md:174` 先例）。
3. **dispatch 六字段块纳入 `_shared` 分发** + parity test（一次投入消除 ≥6 处漂移面）。
4. **eval 资产收敛**：死 judge 清理（≥7 处）、双胞胎 judge 分化或合并声明、词表 judge 按 prd/debug 范本换 token 锚定。
5. **逐项 P2**：外发披露文案 ×2、mirror 路径措辞、worktree dirty 前置检查、host 映射/repoRoot/探测顺序三处实现-文档对齐。
6. P3（≈90 条）按簇批量清理：死代码（builder 捆绑 helper）、编号/格式、中英混排策略决定、悬空引用（R28、walkthrough.md:246）、`#{}` 槽位、usage H1 等。

## 七、验证声明

**已执行**：`npm run typecheck`（317 文件 ✓）、`npm run lint:skill-entrypoints`（521 文件 ✓）、`spec-first doctor --claude`（实测报出 spec-plan drift，检测器工作正常）、全部 P1 回源确认、26/34 P2 逐条核验（node/xxd/od/diff 复演）、其余经跨簇互证。
**未执行**：任何 live eval 重跑；任何被审文件修改；skill-up `local_path` 引擎行为验证（影响 #27 一条定性）。「judge 逻辑正确/判别力弱」均为静态读取判定，非运行确认——这与本仓「文件存在不等于行为已验证」的纪律一致。

## 附：P3 概览（≈90 条，未逐条展开）

分布：入口/自治 12、debug/optimize 11、product 9、runtime-setup 13、review 8、planning 6、arch-knowledge 6、knowledge 6、execution 7、prd 5、definition 3、CLI 侧 3。高重复模式：builder 生成 judge 的死 helper（约 25 行/文件 ×多处）、中英混排增量段落（≥6 个 skill）、`asks-a-question.sh` 系孤儿、编号/emoji/格式类。代表性条目已在各簇核验记录中留痕，修复第 6 步批量处理时按簇清单执行。
