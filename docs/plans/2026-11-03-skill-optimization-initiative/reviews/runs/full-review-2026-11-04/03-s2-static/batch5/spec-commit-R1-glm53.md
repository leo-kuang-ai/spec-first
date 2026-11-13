# spec-commit 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-commit/SKILL.md:32,100,108,115；tests/unit/spec-commit-scope-regression.test.js:22-36 | 每条约束对应可命名真实失败（argv 分离防退出码掩盖、`-F` 防注入且有含 `$(touch injected)` 的执行测试、author/trailer 防归属伪造），无过时或互相拆台的补丁 |
| D02 | pass | skills/spec-commit/SKILL.md:73-79,113,124 | 编码的是 Git 提交领域知识（约定优先级、fix/feat 语义判据、U-ID 规则、路径限定提交保留他人暂存），无 scripts 做语义决策，分工恰当 |
| D03 | pass | skills/spec-commit/SKILL.md:122,128；tests/unit/ce-outcome-judge-calibration.test.js:185-194 | 必需验证明确（read-back、post-commit status）且有确定性锚点：单测真实执行 SKILL.md 中提取的 recipe，judge 脚本以正反例校准（预先 add / 未提交 / 混入 unowned 均判败） |
| D04 | fail | skills/spec-commit/SKILL.md:94 vs skills/spec-commit-push-pr/references/commit-and-push.md:44、branch-creation.md:3-10 | 对同一「默认分支+已授权建分支」场景，SKILL.md 要求从当前 HEAD 直接建分支，其必读共享 reference 却无条件指令先读 branch-creation.md 走 fetch fresh base + carry-forward 决策流，两条流程冲突且无读者豁免（见 Finding 1） |
| D05 | pass | skills/spec-commit/SKILL.md:13,22,92,124 | 128 行单文件，授权门三层（入口摘要/契约/Step 4）分层刻意、逐条可定位，删任一层损失门禁可见性；仅有混排与命令形态小瑕疵（Findings 3/4） |
| D06 | pass | skills/spec-commit/SKILL.md:56-62,66；agents/openai.yaml:2 | 能力假设成立且有诚实降级：blocking question tool 按能力匹配+真实调用失败才降级 chat，gh 探针失败保持 unresolved 不假设 `main`，OpenAI 宿主侧禁 implicit invocation |
| D07 | pass | git log：0deffc25→b98f998c→36d19d95→5d3872df | 存在可追溯的问题→修订→复验链（internal helper 测评、阻塞提问修复、S17 暂存门禁修复），每步修订由消费者 contract test 锚定；helper 无独立知识沉淀职责，维护依据充分 |
| D08 | pass | skills/spec-commit/SKILL.md:26,37-43,75 | 读取范围有界（5 命令 Context 表）、明令不重读已加载的项目指令、共享 reference 按需且限定消费范围；轻微冗余见 Finding 2 后果 |
| B01 | pass | skills/spec-commit/SKILL.md:4；skills-governance.json:40-41；tests/unit/using-spec-first-contracts.test.js:146-161 | internal helper 按 caller-owned 契约审：`user-invocable: false` + `internal_only` + 公共路由隐藏断言三重锁定，纯状态查询豁免门禁（:22）负例明确 |
| B02 | pass | SKILL.md:26；tests/unit/ce-upstream-skill-sync-contracts.test.js:39-45；specialized-skill-calibration-contracts.test.js:90-97 | source 态入口/reference/eval/consumer 一致：7 个消费者测试中 4 个直接断言本 skill 文本与行为约定，设计意图无伪装；安装态引用缺口归 B04 根因（Finding 2） |
| B03 | pass | skills/spec-commit/SKILL.md:18-24；evals/cases/no-auth-stops-before-staging.yaml:8；check-auth-gate.sh:58-59 | 双层授权分离、invocation≠authority、内嵌 handoff 不产生授权（eval 显式覆盖）、exclusions 胜出并如实报告、judge 断言 HEAD/index 原样——授权边界是本 skill 最强面 |
| B04 | fail | skills/spec-commit/SKILL.md:26,124 vs skills/spec-resolve-pr-feedback/references/full-mode.md:177；src/cli/plugin-governance.js:68-74 | internal skill 投射到 8 宿主后，SKILL.md 内仓库相对跨 skill 路径 `skills/spec-commit-push-pr/references/commit-and-push.md` 在安装态（用户项目）无解析契约，同类消费点 full-mode.md 已改用「从当前已安装 Skill 目录解析」措辞而此处未同步（见 Finding 2） |
| B05 | pass | skills/spec-commit/SKILL.md:13,104,124；commit-and-push.md:27-34 | 工具缺失（gh 失败→unresolved）、部分成功（分支已存在重命名重试一次）、中断恢复（先查 HEAD/index 再重试、不重复已创建提交）、hunk 混合（隔离方案或停止）均有明确处理 |
| B06 | pass | tests/unit/spec-commit-scope-regression.test.js:8-42；evals/eval.yaml:13-20；ce-outcome-judge-calibration.test.js:172-194 | 实现→验证可追溯：单测真实执行 recipe、eval 正负例双 case、judge 判别力有反例校准；修复闭环每步留测试，无未披露缺口 |
| X01 | not-applicable | skills/spec-commit/SKILL.md:28 | 单职责收尾 helper（只拥有 commit composition 与 authorized checkpoint），无多模块分解、复杂依赖或长任务编排面 |
| X02 | not-applicable | skills/spec-commit/SKILL.md:15-24 | 无 schema/API/版本化合同需要兼容或迁移；消费的 caller 契约（authorization tokens、owned paths、exclude）为 prose 契约且由测试锁定 |
| X03 | pass | skills/spec-commit/SKILL.md:22,92,122,128；tests/unit/ce-outcome-judge-calibration.test.js:176-183 | 高风险 mutation 操作有完整风险对账：授权门、分支门、read-back、post-commit 确认，外加 judge 的 index/HEAD 保持反例 |
| X04 | not-applicable | skills/spec-commit/SKILL.md:28,128 | 不拥有跨会话交接与知识沉淀（明确不拥有 push/PR/plan lifecycle）；hash/subject 回执是 caller 交接的输入，交接义务在 caller |

## Findings

**1.（P2，D04）默认分支场景下 SKILL.md 与其必读共享 reference 的流程冲突。**
位置：`skills/spec-commit/SKILL.md:94`（"create it from the current HEAD so uncommitted work and any local-only commits stay attached"）vs `skills/spec-commit-push-pr/references/commit-and-push.md:44`（"On the default branch, read `references/branch-creation.md` before staging"）+ `branch-creation.md:3-10,59`。
后果：spec-commit 被 SKILL.md:26 指令消费该共享文件，而该文件不区分读者——诚实遵循的执行者在「默认分支+已授权建分支」场景会同时收到两条指令：从当前 HEAD 直接建（保留本地提交，SKILL.md 意图，符合无 push 的本地 helper 定位），或走 branch-creation.md 的 fetch fresh base + carry-forward/leave 二选一决策流（为 PR 场景设计，可能把本地提交留在 base 上）。两条路径都不越权（都会停下问用户），但流程分叉会导致行为不确定，且 SKILL.md:26 的范围限定（"shared precommit and recovery boundaries"）在文本上无法排除 :44 的分支创建指令。
最小修复：在 SKILL.md:26/:124 或共享文件 :44 处显式划分读者——例如 commit-and-push.md:44 改为「landing helpers（spec-commit-push-pr）在默认分支上先读 branch-creation.md；commit-only helper 按自身 Step 4 从当前 HEAD 创建」，或在 SKILL.md Step 4 声明本 helper 不走 branch-creation 的 fresh-base 决策流及其理由。

**2.（P2，B04）跨 skill 共享 reference 的仓库相对路径在安装态无解析契约。**
位置：`skills/spec-commit/SKILL.md:26,124`；对照 `skills/spec-resolve-pr-feedback/references/full-mode.md:177`。
后果：spec-commit 按 governance（`skills-governance.json:40-41`）以 internal skill 投射到全部 8 个宿主（`plugin-governance.js:68-74` 复制为宿主 skill 目录）。安装到用户项目后，`skills/spec-commit-push-pr/references/commit-and-push.md` 这条仓库相对路径不存在（用户项目无 `skills/` 目录），hunk 隔离与恢复边界的 prose 上下文丢失，仅靠 SKILL.md:124 内联的部分规则缓解。项目已在 full-mode.md:177 用「从当前已安装的 `spec-commit-push-pr` Skill 目录解析」修正同一问题，spec-commit 是漏网的同型消费点。
最小修复：将 :26/:124 措辞对齐 full-mode.md:177 的安装态解析表述（从当前已安装的 spec-commit-push-pr skill 目录解析该 reference）。

**3.（P3，D05）两处分支创建命令形态不一致。**
位置：`skills/spec-commit/SKILL.md:68`（`git checkout -b <branch-name>`，detached HEAD 场景）vs `:100`（`git checkout --no-overwrite-ignore -b <branch-name>`，默认分支场景）。
后果：两场景同样从当前 HEAD 建分支，ignored-file 覆盖防护却只在一处存在；维护者改一处漏一处的风险升高。
最小修复：:68 统一补 `--no-overwrite-ignore`；或保持现状成立但需注释说明两场景差异原因（当前无说明）。

**4.（P3，D05）中英混排分层无声明。**
位置：`skills/spec-commit/SKILL.md:13,108,124`（中文）vs 其余英文主体。
后果：授权门同时存在于中文摘要（:13）与英文契约（:22），后续修订只改一侧时语义漂移不会被任何测试捕获（现有测试只断言英文串，如 ce-localization-round-1-remediation-contracts.test.js:22-24）。
最小修复：统一语言，或在两处显式声明中英分层是刻意的（哪层是 source of truth）。

**5.（P3，D01/D03）「探针失败→阻塞」与 Step 1 继续条件的口径张力。**
位置：`skills/spec-commit/SKILL.md:13`（分支授权缺失或探针失败时一律「返回阻塞」）vs `:62`（默认分支元数据未解析时，caller 已确认的非默认 feature 分支、无需 checkout/建分支/发布则可继续提交）。
后果：默认分支解析探针失败 + 当前已在已确认 feature 分支的场景下，首次读者无法从 :13 判断是否阻塞；宽容解读（:13 的「探针」仅指分支事实读取失败）成立但需推断。
最小修复：:13 补一句「默认分支元数据未解析时的继续条件以 Step 1 为准」。

**6.（P3 观察，静态层不裁）Step 4 分支创建命令序列与默认分支路径无直接行为锚点。**
位置：`skills/spec-commit/SKILL.md:98-102`；evals 两个 case 分别走 feature 分支（fresh-tree-logical-grouping.yaml:13）与 main+无授权停止（no-auth-stops-before-staging.yaml:12），均不覆盖「默认分支+已授权」路径；scope-regression 测试只执行 add/commit recipe（spec-commit-scope-regression.test.js:23），branch-creation.md 的 checkout 碰撞测试挂在 spec-commit-push-pr 侧（spec-commit-push-pr-context-contracts.test.js:110-131）。
后果：Step 4 命令序列（check-ref-format / checkout / 重读）只能静态核验，无提取执行回归。可保持现状（静态承诺内部一致），若补一条从 SKILL.md:98-102 提取命令的执行测试则关闭。

## 主责深挖面发现

**D01（去补丁化）**：逐条指令-失败对应：argv 分离（:32-35）↔ 串联掩盖退出码，测试以逐行执行 recipe 验证（scope-regression:27-31）；`-F` 消息文件（:115）↔ shell 注入/引号破坏，测试消息含 `$HOME`、`$(touch injected)`、双单引号并断言无 `injected` 文件（:24,37）；`--no-overwrite-ignore`（:100）↔ ignored 文件被覆盖；`git add -A`/`git add .` 禁令（:115）↔ 范围失控，judge 以 ls-tree 精确比对 owned 集合（check-logical-grouping.sh:97）。未发现仅因模型能力不足而存在的过时护栏；唯一能力性张力是 Finding 5 的口径模糊，非补丁化问题。

**D02（领域知识）**：非流程控制的真实知识密度高：约定三级优先级（:73-77）、fix/feat 的「补破坏性缺失=fix、新增用户能力=feat」判据（:79）、U-ID 仅在唯一已知 unit 时追加且禁止搜计划造标签（:113）、显式路径提交「保留其他文件暂存状态但提交工作树内容、不保留 hunk 选择」的 Git 语义（:124）、直接移植 vs 语义参考的署名区分（:108）。这些都有来源（消费真实 caller 契约与 Git 行为），非「最佳实践」口号。

**D03（验证门）**：三层结构诚实：prose 门（运行时无强制器，由授权 token 与停止条件构成响亮约定）→ 单测层（scope-regression 真实执行 SKILL.md 文本提取的 recipe，文本即合同）→ judge 层（check-auth-gate.sh:58-59 断言 HEAD/index 与 baseline 完全一致；ce-outcome-judge-calibration.test.js:180-183 校准其判别力：预先 `git add README.md` 后 judge 必须失败）。语义判断（逻辑分组、约定识别）未冒充机械判定，机械事实（hash、ls-tree）未交给 LLM 自报。

**D04（衔接）**：caller→helper 一跳全部正确：dogfood（phases.md:134）、polish（SKILL.md:69）、autoresearch（autoresearch.md:44，含 hunk/index 保护引渡）、debug（SKILL.md:293，无 PR 授权时走本 helper）、work（shipping-workflow.md:101）均以 `commit_authorization` 显式传递且缺失时返回同名 reason code，与 SKILL.md:18-22 契约闭环。helper→共享 reference 一跳存在 Finding 1（场景冲突）与 Finding 2（安装态解析），是本轮两个 P2 的落点。

**D05（紧凑性/可审计性）**：删减模拟——删 :13 中文门禁摘要损失入口层可见性（reader 在读正文前需要一段即时门禁）；删 :24 exclusions 规则损失「exclude 胜出+如实报告未提交」义务；删 :45-46 快照失效警告会放行 intake 后 working tree 漂移。重复是三层审计点而非冗余。维护成本集中在混排（Finding 4）与命令形态分叉（Finding 3）。

**D08（上下文效率）**：常驻上下文仅 128 行 SKILL.md；共享 reference 按需加载且 :26 限定消费范围；:75 显式禁止重读会话已加载的项目指令。低效点：共享文件 73 行中 push/publishing 段（commit-and-push.md:58-73）对 commit-only helper 无关却整文件进入上下文——与 Finding 1/2 同源（共享文件粒度按 landing helper 设计），修复 Finding 1 时可顺带评估，不单独建议拆文件。

## 未读文件

- `skills/spec-commit/evals/fixtures/repos/mini-ledger/README.md`、`package.json`、`src/server.js`：fixture 数据文件，内容已被 judge 脚本 SHA-256 锁定（check-auth-gate.sh:91-93），与合同审查无关；未覆盖后果：无。
- `scripts/evals/build-outcome-judges.cjs`：judge/prepare 脚本的生成器（脚本头部标注来源）；未读理由：属于评测基建而非本 skill 合同面；未覆盖后果：无法核验 judge 与生成器当前是否同步（若 judge 被手改会被再生成覆盖），不影响本轮静态裁决。
- `skills/spec-commit-push-pr/SKILL.md` 及 references/{context,compose,apply-and-handoff,pr-description-writing}.md：属另一被审对象；仅深读了 spec-commit 直接消费链上的 commit-and-push.md 与第二跳 branch-creation.md；未覆盖后果：push/PR 合同内部质量不在本裁决范围（消费链交叉点已覆盖）。
- `src/cli/plugin-manifest.js`、`plugin-governance.js` 非投射分支（仅读 1-90 行）：internal 投射结论（plugin-governance.js:68-74）已有 governance json + 测试双重锚定；未覆盖后果：无。

## 结论一句话

spec-commit 的授权门、验证锚点与失败恢复合同在内部 helper 标准下扎实且全链可定位，唯二实质缺口都在它消费共享 reference 的那一跳——默认分支场景与 branch-creation 流程冲突（P2）、跨 skill 路径安装态不可解析（P2）——修一处措辞划分读者、一处对齐 full-mode.md:177 既有做法即可关闭，其余为 P3 一致性观察。
