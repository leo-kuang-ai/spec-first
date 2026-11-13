# spec-first AI Coding Harness 全量代码深度架构审查报告

> 完成日期：2026-11-10。审查对象：分支 `leo-2026-10-27-update` 的当前磁盘源码，包含未提交改动，不只审查 HEAD。
> 范围：`skills/` 下38个 Skill 入口和 `_shared`，共39个顶层资产目录、1292个文件；完整读取或逐字节等价核验，非抽样。关键 CLI/contract/consumer 按跨边界调用链追踪，不声称 `src/cli/` 和全部测试逐文件审计。
> 基线：`docs/methodology/结构化项目角色契约.md` 与当前项目合同。仅修改本报告和 CHANGELOG；未修被审实现、测试或 generated runtime。
> 证据等级：源码与离线隔离实验支持下述有界结论，不代表全部宿主实测、live 模型稳定性或真实研发收益。旧 S4 的154/155不并入本次验证。

## 最终判断与交付边界（2026-11-10）

**结论：项目已经具备支持高质量需求交付的实质机制，但目前只能有条件采用，不能承诺无人监督、端到端可靠交付。** 最强的价值不是 persona 数量，而是需求/计划/任务的可追溯连接、source/runtime 同源纪律、确定性事实与语义判断分工、真实验证证据和可复用知识的闭环。最优先的欠账是失败恢复时的内容保护、readiness 的失败传播，以及评测判据自身的可信度。

本次审查目标已在上述范围完成：全量 Skill 资产读取闭合、主要出口与跨包链路核对、可疑确定性路径的隔离反例、聚焦验证及报告。**没有实施修复，也没有完成产品验收。** 后文阶段记录中“继续/未完成”表示当时状态，以本节最终覆盖口径为准。历史原报告仅供追溯，不继承其 reviewer 数、无阻塞结论或效果主张。

### 目标与非目标

- **目标：** 判断该 harness 的当前实现是否支持从需求到验证、审查、知识的可靠工程交付；完整解读 Skill source，不用抽样或文件存在代替审查。
- **非目标：** 修复所有发现、改动宿主配置、重新安装/初始化 runtime、运行付费模型矩阵、提交/推送/发布，以及证明全部第三方依赖无漏洞或真实研发效率已提高。
- **执行边界：** 全程 inline/serial；未派发 worker、独立 reviewer 或外部模型。并行工具读取不是并行审查者，不计独立覆盖。

### 交付链判断

| 链路 | 源码已具备的机制 | 当前不能外推的结论 |
|---|---|---|
| Codebase -> Spec | PRD范围、问题澄清、输入来源与产品决定归属；图仅作候选导航 | 读过资料不等于需求正确；大输入与冲突需求仍需语义验收 |
| Spec -> Plan -> Tasks | requirements-only/implementation-ready 区分、需求与实现单元引用、可选任务包及任务范围 | 产物结构通过不代表计划可实施；planner-return必须与caller实施权分开 |
| Tasks -> Code | 工作树隔离、任务归属、测试反馈、最终源码指纹与结构化结果 | SUP-01/02等内容保护缺口未修；不能仅凭任务清零声明交付 |
| Code -> Review | scope快照、远端身份、finding机械校验、三态复验、apply独立授权 | 未授权dispatch时按合同降级；跨模型peer仍休眠；评审自述不是执行证据 |
| Verification -> Closeout | run-summary、honest-closeout、source-bound事实、明确not-run/degraded | 部分judge误把文本/命令出现当行为发生，见SUP-19/27/29；本次并非全链路live验收 |
| Review -> Knowledge | 私有候选、来源与失效条件、语义晋升、逐目标发布与部分失败披露 | SUP-20/21影响知识保鲜；晋升字段非空不证明因果正确；发布约定不是宿主级强制 |
| Runtime支撑层 | 显式host authority、containment、安装身份、facts、workspace租约/保鲜 | SUP-22～26/30证明“有校验”仍可能失败恢复有损或状态假绿 |

### 最小修复与验收顺序

| 顺序 | 修复范围 | 完成证据，而非仅改文案 |
|---|---|---|
| 1 | SUP-01/02；同类恢复归属SUP-22/23/26 | 原始内容与备份在失败前后逐字节可回证；覆盖备份前失败、替换失败、恢复失败与重试，不只测成功路径 |
| 2 | SUP-25/30与SUP-24 | 高优先级配置无法核验不报current；缺根/缺inventory不报ready；auto-repair的mode与capability一致且不扩大授权 |
| 3 | SUP-19/27/29及旧judge维护漂移 | 合法正例继续通过；短路未执行、管道写入、空字段伪产物明确拒绝；修共享owner后再生副本，不逐份补词表 |
| 4 | SUP-09/12/15/17/18/20/21 | 分别以权限、HTTP资源、收敛状态、写路径、截断披露、未跟踪变更和路径解析的最小反例回归 |
| 5 | 代表性完整交付验证 | 在另行授权的隔离宿主上运行需求澄清->计划->实施->审查->知识任务，保存输入/源码身份、真实工具结果、残余项和成本，不以旧154/155替代 |

先修确定性地板，不新增中心状态机、通用规则引擎或更多固定persona。保留LLM对需求充分性、架构、finding成立与知识复用价值的裁决。固定1000行P1、默认六reviewer与逐finding复验等策略应以实际缺陷收益/成本校准，而不是视为天然正确的质量证明；其调整属于后续治理决定，不在本次只读审查中实施。

### 全量覆盖凭据

最终以本会话成功的 Read/CodeGraph 返回逐行匹配当前文本，再进行字节等价核验：**1116项全文当前内容匹配 + 145项整文件等价 + 31项已读共享前缀与完整差异尾段 = 1292项，未覆盖0项。** 前缀等价不把整文件直接算作副本，尾段仍逐项读取；CodeGraph 输出里的 gap 全部补齐。vendor压缩源码、许可证与来源说明也已读取；没有据此宣称供应链独立审计完成。

- 证据会话：`12be2df3-6e8c-4ddc-a9e7-fcb603a6d152`。工具记录可回溯读取范围、隔离输入和结果；原始完整工具日志未另建可移植发布包。
- 源码清单指纹：`b767f865a347c927434f1cdc736059b0c910ae05660f8e0049b192f8212ab3e3`。
- 指纹算法：排除 `__pycache__`，按 repo-relative POSIX path排序，对每项拼接 `path + NUL + sha256(file_bytes) + LF`，再计算整体SHA-256。内容变化后该覆盖快照失效，不把本轮全读永久外推。
- 文件数包含eval/fixture/vendor，不是1292个独立机制，也不是1292条测试。

| 资产目录 | 文件数 |
|---|---:|
| `_shared` | 7 |
| `autoresearch` | 30 |
| `spec-app-consistency-audit` | 90 |
| `spec-brainstorm` | 32 |
| `spec-code-review` | 64 |
| `spec-commit` | 11 |
| `spec-commit-push-pr` | 17 |
| `spec-compound` | 62 |
| `spec-compound-refresh` | 39 |
| `spec-debug` | 23 |
| `spec-doc-review` | 55 |
| `spec-dogfood` | 15 |
| `spec-explain` | 15 |
| `spec-handoff` | 35 |
| `spec-ideate` | 30 |
| `spec-lfg` | 24 |
| `spec-optimize` | 37 |
| `spec-plan` | 88 |
| `spec-polish` | 24 |
| `spec-pov` | 24 |
| `spec-prd` | 56 |
| `spec-product-pulse` | 20 |
| `spec-project-rules` | 105 |
| `spec-promote` | 16 |
| `spec-prototype` | 14 |
| `spec-resolve-pr-feedback` | 27 |
| `spec-riffrec-feedback-analysis` | 18 |
| `spec-rule-miner` | 12 |
| `spec-runtime-setup` | 88 |
| `spec-simplify-code` | 25 |
| `spec-strategy` | 18 |
| `spec-sweep` | 22 |
| `spec-test-browser` | 10 |
| `spec-test-xcode` | 5 |
| `spec-work` | 58 |
| `spec-worktree` | 17 |
| `spec-write-skill` | 25 |
| `spec-write-tasks` | 23 |
| `using-spec-first` | 11 |
| **合计** | **1292** |

### 验证与结论的限制

本报告SUP条目逐项区分源码确认、隔离反例与尚待核对线索；旧发现不重复加总。最近收束验证为：runtime judge **27通过/1失败**，compound三套 **72/72**，write-skill两套 **8/8**，code-review机械地板 **55/55**。更早测试与反例见后文验证表；不将跨轮可能重复的测试累加成“独立用例总数”。失败是现有bare校准缺当前transcript协议，不隐去也不误称生产setup失败。

最终仓库级只读验证：`npm run typecheck` **317文件通过**，`npm run lint:skill-entrypoints` **521文件通过**，`npm run check:shared-references` **14份共享投射一致**。这些检查证明语法/入口/同源结构，不推翻已复现缺陷。另确认授权修复正例与inline授权合同前提不相容，见SUP-31；这是静态合同结论，不是live行为结果。

未运行全量npm test、全部宿主安装、真实Windows恢复、live模型矩阵或真实用户任务收益实验。主张限于已审源码和列明验证；并发变更、第三方版本更新或宿主契约变化均要求重新核对相关范围。后文尚待核对线索是已识别限制，不升级为confirmed finding，也不用于宣称系统无缺陷。

### 独立复核（2026-11-10）

复核前重算 `skills/` 清单指纹，仍为1292文件、`b767f865…`，与上文快照一致，因此复核对象是同一源码。复核不沿用原结论，逐项回到当前源码，并在临时目录重跑反例。

- **隔离重跑复现：** SUP-01、03、04、05、06、07、13、14、15、16、17、22、28、29、30，结果与原记录一致。SUP-03 的两个判据分别被活跃用例 `r2-fastest-no-measure`、`r2-normal-convergence-works` 引用。
- **源码位置与逻辑确认：** SUP-02、08、09、10、11、12、18、20、21、23、24、25、26、31。
- **本轮未复核：** SUP-19、SUP-27（需构造 runner 轨迹）。用户中止了 jest 运行，因此本节没有新的测试结果，上文测试数字仍属原轮次。
- **复现前提更正：** SUP-30 要求父路径不含符号链接；macOS 下 `/var` 是链接，直接使用会先被判为 `skill_root_symlink_segment/fail`，改用 realpath 后的父目录才得到 `pass/ready`。SUP-15 的状态需要合法 `terminal_choice`（如 `stop-at-verified`），否则 `validate-state` 输出 invalid（但退出码仍为 0）。SUP-14 的判据要求 `EVAL_EXIT_CODE=0`，缺失时所有输入都失败，不能当作判据正确拒绝。

#### SUP-32｜P2：工作区构图拒绝逃逸链接后，catch 删除用户的 `.codegraph` 链接

- **位置：** `skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs:333` 的 containment 校验与 `:343` 的统一 catch 处于同一个 try 中。
- **隔离复现：** 临时 workspace 的子仓库中，`.codegraph` 是指向 workspace 外部目录的符号链接，该目录含 `keep.txt`。通过公开 `buildWorkspaceGraphs` 运行（所有 runner、state/exclude writer 均为不执行外部命令的替身）。结果：child reason 为 `codegraph-target-escapes-workspace`，CodeGraph init 调用 **0次**，但链接本身变为 `ENOENT`；外部目录及 `keep.txt` 保留。临时目录已清理。
- **与既有发现关系：** 与 SUP-26 同在一个 catch 中，但触发条件不同：SUP-26 是备份 rename 失败，本项是安全校验正确拒绝之后的回滚删除，与 SUP-22 属于同一类“拒绝后恢复路径造成损害”。修复应合并处理：containment 校验移到 try 之外，或只删除本次调用确认创建的目标。
- **边界：** 未删除外部内容，未运行真实 provider 或完整 setup 入口；未修实现。

## 补充审查与结论修订（阶段记录，2026-11-09起）

> **阅读优先级：本节优先于下方原报告。** 原报告保留为历史记录，不删除既有发现；其中「39/39 全量精读」「11 个 reviewer」「无未授权 mutation 路径」「当前无阻塞项」不能作为本次续审已验证的事实。续审尚未完成全仓覆盖，且已实测发现四处生产脚本副作用问题、一处原型默认页面资源加载问题及一处迭代状态收敛问题。原报告的 P1/P2 总数不自动累加为当前总数，避免重复计数。
>
> **产物类型：** 本节是审查补充；隔离反例与测试结果为 confirmed（仅限所述场景），严重度、影响解释和修复顺序为审查判断。不是修复验收，也不是 live 模型行为评测。本次按用户要求只更新报告及 CHANGELOG，未修改被审实现、生成镜像或测试。

### 1. 修订后的判断

项目具备真实的确定性校验、精确提交范围保护和证据绑定机制，但不能据此宣称关键出口已全面闭合。**优先处理工作树原地切换的数据保护问题，其次处理优化实验共享文件复制的先写后验问题；在修复并验证前，不应将相关路径判为无阻塞。** 评测层同时存在「未越权」与「已完成交付」混为一谈的问题，部分旧 judge 的通过结果不能支持用例完整承诺。

本次续审没有重现原报告的全量覆盖过程，不据此认定原报告所述过程不存在；只是不能继承其完成声明。覆盖账应由实际成功读取、完整范围补读或逐字节等价核验重建，不能用文件枚举、片段读取或 reviewer 声明代替。

### 2. 生产脚本问题（已隔离复现，未修复）

#### SUP-01｜P1：linked worktree 原地切换覆盖被忽略文件

- **位置：** `skills/spec-worktree/scripts/worktree-manager.sh:688–700`，尤其是 `:693–698` 的三条 `git checkout` 分支。
- **触发条件：** 已处于 linked worktree；当前 checkout 有被忽略的本地文件；目标分支跟踪同名文件；目标分支可切换且未被其他 worktree 占用。
- **实现问题：** 原地切换未使用 `--no-overwrite-ignore`，Git 默认允许覆盖此类 ignored 文件。
- **隔离复现：** 临时仓库 main 的 `.gitignore` 忽略 `collision.txt`；target 分支跟踪该文件，内容为 `target tracked`；从 main 创建 worker linked worktree，并写入本地 `user ignored content`。在该 worktree 执行被审脚本 `isolate target`。
- **观察结果：** exit **0**；分支变为 target；文件内容变为 `target tracked`；stdout 包含 `Worktree ready`。用户本地内容已被覆盖，脚本仍报告成功。
- **与原报告关系：** 对第四节 #26 的证据与严重度升级，不再仅描述为「脏修改带入目标分支」。
- **最小修复建议：** 对原地切换的普通分支、remote-only 分支、detached 三条路径统一增加 ignored 内容保护；补充同名文件碰撞的负例，断言失败后 HEAD、branch、index 和文件内容保持不变。是否允许携带其他未提交修改，由 caller 隔离契约明确，不把 checkout 成功当作干净基线证明。
- **可复用先例：** `skills/spec-commit-push-pr/references/branch-creation.md:59` 已使用 `--no-overwrite-ignore`，`tests/unit/spec-commit-push-pr-context-contracts.test.js:110–130` 已实际测试 ignored 碰撞保护。

#### SUP-02｜P1：优化实验共享文件复制在 containment 校验前创建目录

- **位置：** `skills/spec-optimize/scripts/experiment-worktree.sh:385–389`。
- **实现顺序：** `mkdir -p "$dest_dir"` 先执行，再解析目标真实路径并校验是否位于实验 worktree 内。
- **触发条件：** 基线提交中 `shared` 为指向仓库外目录的符号链接；当前源树把它替换成真实目录，并提供 `shared/nested/data.txt` 作为 shared file。新实验 worktree 从该基线创建，仍保留外部符号链接。
- **隔离复现：** 临时仓库调用 `create review 1 main shared/nested/data.txt`。脚本最终 exit **1**，报 `shared_file destination resolves outside experiment worktree`，但外部目录已经出现 `nested/`。
- **证据边界：** 已证明拒绝前发生越界建目录，未证明任意文件覆盖或删除；完整 workflow 对上述基线/当前源树差异的可达性尚需继续核对。不得省略触发前提，也不得将非零退出当作零副作用。
- **最小修复建议：** 在任何 mkdir/copy 之前验证目标父链，拒绝符号链接与物理逃逸；补充反例断言外部目录完全不变。修 source helper，不手改 generated runtime。

两项反例均仅在临时隔离仓库执行，反例目录已清理；没有对用户工作树运行破坏性复现。部分既有测试自身缺少临时目录清理，不能据此宣称所有测试临时目录均已清理。

#### SUP-09｜P2：浏览器 manifest 拒绝越界路径前已修改外部文件权限

- **位置：** `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:1095–1098`、`:1177–1188`、`:1213`。
- **触发条件：** 输入 manifest 的 `test_plan_path` 指向 run directory 外、当前用户拥有的普通文件。可以是损坏或被编辑的 manifest；正常 prepare 产物不会自行产生该路径。
- **实现问题：** `inspectPrivateFile` 先调用 `hardenPath` 执行 chmod，随后 caller 才检查 containment；所以所谓 inspect 不是无副作用检查。
- **隔离复现：** 临时目录创建 mode 0644 的外部文件，正常 prepare 后仅将 manifest 的 `test_plan_path` 改指该文件，再调用 `runPreparedContext`。返回 `not_run/private-run-file-untrusted`，`action_process_calls=0`，但外部文件 mode 已变为 **0600**。没有启动 provider 或访问真实应用；临时目录已清理。
- **影响边界：** 已证明越界权限变更，不是文件内容覆盖。Windows 对应 hardening 使用 icacls，本轮未在 Windows 实测，不外推具体结果。
- **最小建议：** 将路径类型、所有权、物理 containment 检查与权限修改分离；只对已确认属于本次 run 的资产 harden。拒绝路径的测试应同时断言目标内容与权限不变。

#### SUP-12｜P2：原型默认 URL 丢失 question 子目录，导致相对资源 404

- **位置：** `skills/spec-prototype/scripts/light-webserver.js:203–206`、`:208–218`、`:242`；`references/build.md:15` 明确每个问题使用子目录，既有 integration test 也覆盖 `screens/density-question/index.html` 布局。
- **实现问题：** `/` 直接返回最新 HTML 字节，不跳转到该页面的真实相对 URL；浏览器仍按 `/` 解析 CSS、JS、图片等相对路径，静态 handler 则从 screens 根查找。
- **隔离实测：** `screens/question/index.html` 引用 `style.css`，同目录存在该 CSS。通过脚本 start 返回的默认 URL 获取页面为 **200**，浏览器规则解析出的 `/style.css` 为 **404**，`/question/style.css` 为 **200**。这是 HTTP/URL 路径反例，没有声称已运行浏览器视觉验收。
- **影响：** 合法多文件原型从默认 URL 打开可能失去样式、交互或图像，削弱人类判断依据；单文件内联原型不受此场景影响。
- **最小建议：** 默认入口跳转到最新页面的真实相对路径，或返回可直接访问该页面的 URL；增加子目录 CSS/JS 相对资源测试，保留 CSP 与 containment。测试服务器已通过 token-bound stop 返回 `stopped`，临时目录已清理。

#### SUP-15｜P2：持久状态的 stop_reason 可直接冒充收敛判定

- **位置：** `skills/autoresearch/scripts/orchestrate.sh:240–246`、`:262–305`；消费者为 `skills/autoresearch/SKILL.md:92–96` 的 verdict 优先消费步骤。
- **实现问题：** `validate-state` 不约束 `stop_reason`，`verdict` 在检查 `predicate_met` 之前直接返回其值；它不是由当前证据导出的终态。因此损坏或手工编辑的恢复状态能携带 `CONVERGED`，绕过“仅验证完成且 predicate met 才收敛”的约束。
- **隔离复现：** 合法 loop 状态，`predicate_met=false`、`units_remaining=[2,1]`、无待处理信号，增加 `stop_reason=CONVERGED`。`validate-state` exit **0** / `valid`；`next-hop` exit **0** / `regression`；`verdict` exit **0** / `CONVERGED`。同一状态的两个出口矛盾。
- **边界：** 这是当前 helper 的真实输出，不证明模型已接受错误结论或发生部署。没有执行状态内的 predicate 命令，没有真实 provider、提交或外发。另测 cycle ceiling 时 verdict 正确输出 CEILING，不能仅因 next-hop 不处理 ceiling 就声称完整 workflow 无上限。
- **最小建议：** 将 stop 原因限制为合法停止原因，成功状态必须由 predicate 与未解决信号共同导出；在 validate→next-hop→verdict 链补正反校准。现有 orchestrator/scorer 两套 **49/49** 通过，但未覆盖本反例；本轮未修改实现。

#### SUP-17｜P2：产物写入检查漏掉指向边界外新文件的悬空符号链接

- **位置：** `skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:323–355`、`:365–384`。`run-audit.js:309` 向子步骤传入 run-root 边界，共享 JSON/text writer 消费该边界。
- **触发条件：** run 内的产物路径已经是符号链接，目标位于 run 外，目标文件尚不存在但父目录存在；当前进程具有目标目录写权限。正常新建的 run 不会自行产生该链接。
- **实现问题：** `realpathSync(candidate)` 对悬空链接报错后，被当作“待创建的正常路径”吞掉；检查转向 run 内的词法父目录。随后 `writeFileSync` 跟随悬空链接，在 run 外创建目标文件。
- **隔离复现：** 临时根下建立 `run/` 与 `outside/`，设置 `SPEC_AUDIT_WRITE_BOUNDARY=run`，调用当前导出的 `writeJsonOutput`。对照组（外部目标已存在）被拒绝，外部内容未变；悬空链接组未报错，外部新文件确实写入 `{probe:true}`。临时目录已清理，未写用户资产。
- **证据边界：** 已确认共享生产 writer 的越界创建，不是既有外部文件覆盖，也没有运行完整 headless runner 或模型行为评测。失败路径、直接 `fs.writeFileSync` 与其他产物落盘点还需联合核对，不能据此声称所有写入路径均已完成审查。
- **最小建议：** 用 `lstat` 区分不存在路径与悬空链接，写入前拒绝链接目标或解析并校验其真实目标父链；不得把任意 realpath 错误都按不存在处理。补齐现存链接、悬空链接与链接父目录的零副作用反例。只修 source，不补 runtime 镜像。

#### SUP-18｜P2：部分领域抽取器截断源码却不披露语义覆盖缺口

- **位置：** `skills/spec-app-consistency-audit/scripts/lib/audit-utils.js:257–288` 的默认读取上限为 128 KiB；`extract-engineering-quality.js:38` 使用丢弃截断元数据的 `readText`，`:31` 只转发文件扫描层的 degraded modes。analytics、i18n、components、KMP、modules 与 industry 的若干读取路径采用同一方式；本轮仅对 engineering-quality 做尾部风险反例。
- **隔离复现：** 临时 `Main.kt` 为 140056 字节，空白前缀之后有 `catch (e: Exception) {}`。`extractEngineeringQuality` 返回 `candidates=[]`、`degraded_modes=[]`，source input 为 `freshness=current-worktree` 且带完整 source hash。
- **影响：** 文件级 hash 本身没有错；错误在于“已哈希全文”和“语义抽取只读前缀”未分开披露。下游专家仅消费领域产物时，无法知道尾部未进入抽取，缺失候选可能被误解为没有该风险。这里不声称 LLM 已给出错误通过，也不要求脚本判断问题语义。
- **最小建议：** 沿用本包 `extract-code-contract.js:31–34` 和 `build-impact-facts.js:226–228` 的既有机制：读取带元数据，显式输出 `semantic_extraction_partial`，保留完整 hash 的来源语义；对截断尾部、恰好上限和完整短文件做校准。

#### SUP-20｜P2：知识保鲜漏掉目录内未跟踪的新源码，错误触发免重验路径

- **位置：** `skills/spec-project-rules/scripts/extract-deps.cjs:456–475` 只合并 baseline→HEAD、unstaged tracked diff、cached diff，不收集 untracked paths；`:409–418` 据此输出 `clean`。消费者 `SKILL.md:121` 明确将 freshness clean 且 verify clean 解释为确定性 refresh_noop、零重验。
- **隔离复现：** 临时 npm workspace 基线已有 `packages/shared/package.json`，知识库复用条目住址为 `packages/shared`。在目录中新建未跟踪的 `new.ts` 后，`git ls-files --others --exclude-standard` 确认新文件；`extract-deps --verify --freshness` exit **0**，`verify_status=clean`、`freshness.status=clean`、`dirty_refs=[]`。
- **影响与建议：** 新文件可能改变该复用域的事实，却未被交给 LLM 判断，违背目录住址下任一文件变化计脏的承诺。应纳入未跟踪文件并使用可靠路径分隔格式；是否实质影响规则仍交给 LLM，不要求脚本判语义。现有测试只覆盖 staged 新文件，不覆盖本反例。

#### SUP-21｜P2：反引号住址的闭合符被吞入路径，合法引用被误报失效

- **位置：** `skills/spec-project-rules/scripts/extract-deps.cjs:450–451` 的住址捕获字符类未排除反引号；`:433–436` 也未剥离它。`references/knowledge-format.md:140` 与当前测试承认复用住址参与保鲜。
- **隔离复现：** 上述同一临时 workspace 的住址改为反引号包裹的 `packages/shared`，目录真实存在；extractor exit **1**，missing_refs 中的 ref 为 `packages/shared` 加尾部反引号，错误报 1 finding。未加反引号对照 exit 0。
- **影响与建议：** 合法 Markdown 路径无法通过存活校验，相同解析也会妨碍目录脏检测。对成对反引号与无反引号分别解析，保留路径值而非 Markdown 闭合符；补齐两种形式的存活与目录变更对照。两套 project-rules 聚焦测试 **25/25** 通过，但未覆盖 SUP-20/21；测试临时根统一隔离并已清理。未修被审实现。

#### SUP-22｜P2：facts 写入拒绝悬空符号链接后，回滚反而删除原链接

- **位置：** `skills/spec-runtime-setup/scripts/lib/facts.cjs:513–516` 使用 `existsSync` 捕获备份，悬空链接被记为 `null`；正常写入在 containment 校验时拒绝链接，但 `:526–527` 无条件启动恢复，`:560–564` 将 `null` 当成原本不存在而删除该路径。
- **隔离复现：** 在全新临时仓库的 `.spec-first/config/tool-facts.json` 建立指向临时边界外不存在文件的链接，调用真实 `writeSetupFacts`。结果为 `status=failed`、`complete=false`，诊断明确拒绝 symlink segment；然而原链接从 `lstat.isSymbolicLink()=true` 变成 `ENOENT`。外部目标未创建。临时目录已清理，没有修改真实 runtime。
- **影响与建议：** 安全拒绝应保持原资产不变，不能由回滚引入删除。使用 `lstat` 区分缺失与链接，在备份前完成路径检查，并只恢复本次确实修改过且仍属于本次写入的目标。同文件 host ledger writer 已有 `backupCaptured` 保护，facts 双文件 writer 尚未采用等价纪律。现有失败用例注入自定义 writer，而自定义 writer 路径跳过默认恢复，无法覆盖本反例。
- **验证边界：** 本项为导出 writer 的确定性隔离实测，不声称完整 setup 入口在所有模式下均可到达该状态；未修实现，未运行真实安装或宿主配置。进程执行、npm 归档核验、CodeGraph provider 与 facts 全文已读，runtime 包及下游消费者整体审查仍未完成。

#### SUP-23｜P2：Windows 配置替换的双重失败遗漏恢复状态与恢复路径

- **位置：** `skills/spec-runtime-setup/scripts/lib/host-config.cjs:1035–1048` 将原文件移到 `replace-old` 后，安装替换与恢复原文件均失败时吞掉恢复异常；`:1365–1366` 只有整个 replaceFile 返回才设置 `replaced=true`，导致 `:1400–1447` 跳过最终备份恢复并报告 `changed=false / restore=not-required`，最后删除常规 backup。
- **隔离复现：** 通过真实 target resolver 和 applyHostConfig，在临时目录选择 `replace.platform=win32`，注入 direct-replace、install-replacement、restore-displaced-original 的 EACCES，允许 displace-original 执行真实 rename。结果配置路径不存在，但返回 `host-config-write-failed / changed=false / restore.status=not-required`。原始内容仍保留在未披露的 `.replace-old` 文件，不是原字节全部丢失；返回值没有 backup_path 或 recovery 指引。临时资产已清理。
- **影响与建议：** 主配置消失会使宿主失去原配置，而错误摘要误导 caller 以为没有变更、无需恢复。底层替换应显式返回/抛出 displacement 与恢复状态，将 retained path 传给上层；恢复失败保留备份并返回 manual-required，不能依赖“函数成功返回”推断是否发生副作用。
- **验证边界：** 1486行 host-config 与1623行聚焦测试全文已读；该套测试 **44/44** 通过，覆盖单次 Windows contention、重试耗尽后成功恢复及替换成功后的恢复失败，但未覆盖本组合。此次在 macOS 注入 Windows 分支失败，不冒充 Windows 实机验收；未修实现或修改真实宿主配置。

#### SUP-24｜P2：Graphify 自动恢复只改 mode，未对应能力门，必然被拒绝

- **位置：** `skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs:113–122` 在普通 mutation 检测到 scope provenance artifact mismatch 后构造 refreshContext，仅改 `actionPlan.mode`；`:789–793` 随即要求 `provider-refresh`。`lib/mode-policy.cjs:27–37` 中普通 only/bare 拥有 `provider-mutation` 而非 `provider-refresh`。
- **隔离复现：** 使用真实 `buildActionPlan(['--only','graphify'])` 和 `runVerificationOrMutation`，注入仅返回该 mismatch 的内存 provider 替身，tools/helpers 为空、runner 禁止外部执行。真实控制流执行 apply **1次**、refresh **0次**，抛出 `setup-capability-denied: provider-refresh`。未安装或调用真实 provider，临时根已清理。
- **影响与建议：** 已设计的自动恢复分支在标准 only/bare 计划下无法执行，首次 mutation 后中止，不能形成预期恢复与后续 facts 发布闭环。需明确普通 setup 是否授权自动 refresh：若授权，应在合法 action plan 中统一建模；若不授权，应保留原诊断并给显式 refresh 恢复命令，而非临时改 mode。不能简单绕过 capability 校验。
- **证据边界：** Graphify provider 2763行已全文读取；其 scope receipt 检查确实产生该 reason_code。实测仅确认 executor 的确定性门冲突，不冒充真实 Graphify 构图、完整 setup 或 live 模型验证；其余 provider/workspace 消费链仍待审查。

#### SUP-25｜P2：系统级配置缺少 containment 声明，被跳过后错误报告用户配置正常

- **位置：** `skills/spec-runtime-setup/setup-registry.json` 的 Claude managed 与 Codex system 目标使用绝对路径但没有 `containment_root`；`scripts/lib/host-config.cjs:220–234` 正确拒绝这类路径，然而 `:372–379` 静默跳过未选中且解析失败的目标，`:654–721` 只检查剩余目标，丢失高优先级配置冲突。
- **隔离复现：** 通过真实 `loadRegistry/getEffectiveEntry` 解析 macOS 的 codegraph 条目，Claude managed 与 Codex system 均返回 `host-config-path-escape`。随后仅把 Claude managed 路径映射到临时绝对路径，写入冲突配置，并在临时 HOME 写入匹配的用户配置；真实 resolver 的 `resolved_targets` 仅含 user，inspection 返回 `configured=true / host-config-current`。对照仅为夹具 managed 目标补上临时 `containment_root`，结果立即变为 `host-config-higher-precedence-conflict`。
- **影响与建议：** 系统配置存在且冲突时，setup 的当前配置判断可与有效优先级不一致；显式选择 managed 目标也会直接遭路径拒绝。应为受支持绝对目标声明窄边界，并将无法检查的高优先级目标保留为阻断或明确未知，不应扩大 containment 到整个文件系统或静默忽略。
- **验证边界：** 未读取或写入真实系统配置，不声称本机存在该冲突；Codex 确认到目标解析拒绝，冲突对照在 Claude 夹具执行。首次探针误用了未导出的 `buildServerConfig` 而失败，改用公开 resolver 返回的 server 后完成对照；临时目录均已清理。未修实现。

#### SUP-26｜P2：工作区构图备份重命名失败，恢复路径删除尚未备份的原索引

- **位置：** `skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs:329–346` 的 `runFreshCodegraph` 在备份、provider 执行和验证外层共用 catch；`:334` 原目录 rename 失败时，`:344` 仍无条件递归删除原 `.codegraph`，随后又没有 backup 可恢复。
- **隔离复现：** 临时 child 中预置 `.codegraph/original.txt`，通过公开 `buildWorkspaceGraphs` 运行，注入仅对原目录备份 rename 抛 EACCES；state/exclude/provider 均用无外部执行替身。结果整体 failed、child reason 为 `codegraph-refresh-failed`，CodeGraph provider 调用 **0次**，原文件及整个 `.codegraph` 目录均不存在。所有临时资产已清理。
- **影响与建议：** 备份失败本应保留原索引，当前却造成既有索引丢失并要求重建。只有成功备份、确认新目标由本次调用创建后，才允许移除新目标；分阶段跟踪 backupCreated/targetCreated，并披露恢复失败及保留路径。附近 `promotePath` 已有阶段标记，可保持相同纪律而非新增事务框架。
- **证据边界：** 本项确定性确认公开 build helper 的失败分支，不冒充真实 provider 构图、操作系统原生权限故障或整个 setup 入口实测；未修实现。与 SUP-22 同属失败恢复缺乏阶段归属，但为不同 writer 与触发条件，分别列出便于修复及回归。

#### SUP-30｜P2：目录读取失败未传播 incomplete，不存在的 payload 可被报告 ready

- **位置：** `skills/spec-write-skill/scripts/lib/package-inspection.cjs:135–149` 捕获根目录 lstat/realpath 失败后只追加 `not_checked`，没有设置 `incomplete=true`；`:308–314` 因此仍返回 `pass / ok=true`。`scripts/inspect-context.cjs:13–51` 消费该结果，对空声明与空 inventory 认定闭包一致。
- **隔离复现：** 临时真实父目录下指定不存在的 missing 子目录。`inspectPackage(missing)` 返回 `result=pass`、`ok=true`，同时 findings 中却有 `skill_root_unreadable / ENOENT / not_checked`；对同一路径传入 `{files:[], dynamic_dependencies:'none'}`，公开 `smokeTargetPayload` 返回 `pass / target_readiness=ready`。未执行目标 package 代码，临时目录已清理。
- **影响与建议：** 不可读/不存在输入会被提升为验证成功，破坏五轴 readiness 的确定性地板。根读取失败应明确 incomplete，consumer 不得把未完成 inventory 当成空集；payload 必需入口或非空性按实际目标合同校验，不能仅靠两个空集合相等。保持 fail/incomplete 区分，不要求语义判定脚本化。
- **验证边界：** 全文读取并运行 context-inspector/target-payload 两套 **8/8通过**，未覆盖缺失根的反例。这里只确认导出 inspector/smoke 链，不声称完整 authoring workflow 已错误发布；未修实现。

### 3. 评测判据问题与已有保护

以下均为离线合成输入或夹具状态实验，不是模型真实违规率，也不证明模型执行了 final message 中声称的动作。

#### SUP-31｜P2：审查授权修复正例与缺 dispatch 授权时的禁止 apply 合同冲突

- **位置：** `skills/spec-code-review/evals/cases/r2-preset-authorize-fix.yaml:9–13` 只授权环境准备、审查及P0局部修复，没有授权派发；`references/modes-and-output.md:80` 明确这些请求不产生dispatch授权。`references/scope.md:241–251` 和 `references/finish-review.md:116` 要求缺授权时inline report-only并跳过apply。
- **确定性判据：** `check-r2-preset-applied-fix.sh:21–38` 实际执行被测函数，要求跨租户返回null。准备脚本应用的补丁恰好删除该校验，因此严格遵守inline不修复合同的结果必然无法通过该行为探针。若模型为通过判据自行派发或修复，又违反当前合同。
- **结论与建议：** 这是源码可直接确认的测试期望冲突，不是模型表现差或缺少工具。若该case测试完整授权apply路径，需在隔离输入显式授权所需reviewer并保证能力；若测试缺dispatch路径，则应期望报告缺陷且源码不变。不能放松生产授权门来追求评测绿，也不能把这个用例当前的PASS直接解释为完整合规。未运行live或修改case；无需真实派发即可确认这组前提不相容。

#### SUP-29｜P2：知识正向发布判据接受无 frontmatter、空晋升字段和损坏源码

- **位置：** `skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh:8–19` 仅找首个 Markdown 文件、检查行首字段名和 amount/NaN，再检查源码中存在 `Number.isFinite` 文本；不解析 frontmatter、不校验非空晋升字段、不核对原源码字节，也不检查要求执行的 npm test 轨迹。
- **隔离校准：** 临时 `docs/solutions/invalid.md` 只有四行空字段名（problem_type/source_refs/invalidation_condition/date）和 amount，没有 `---`；临时 `src/server.js` 只有 `// Number.isFinite` 与抛错语句。final 仅给该文档路径，judge 仍 exit **0**。没有运行损坏源码或 npm test，所有内容为合成夹具，临时根已清理。
- **影响与建议：** 当前正例不能证明产物满足已有确定性晋升底线，也不能证明源码未改或修复已验证。应复用正式 frontmatter promotion validator、核对保护文件状态并关联真实验证 receipt；自然语言因果和复用价值仍由 LLM 审查。不要用更多字段关键词模拟知识语义。
- **已有保护：** 当前 `validate-frontmatter.py --promotion` 与候选 claims 校验明确区分机械检查和语义晋升；假因果专用 judge 检查限定因果分类、Git/index/文件状态，且明确不证明模型运行过 verify。三套聚焦测试 **72/72通过**，未覆盖本项正向发布 judge 的反例，未修改任何实现或测试。

#### SUP-28｜P2：Dogfood 拒绝判据接受反向声明，owner 缺失夹具未隔离前置分支拒绝

- **位置：** `skills/spec-dogfood/evals/fixtures/scripts/check-owner-unavailable-stop.sh:10–12` 以 runtime-setup 名称或停止词命中放行；`check-trunk-reject.sh:9–10` 只要求 main/diff 等词，不检查浏览器、服务、源码或分支调用轨迹。
- **隔离校准：** 前者输入「我没有停止，已自行运行浏览器。」返回0；后者输入「已在 main 完成全应用探索。」返回0。只运行 judge，没有启动浏览器或服务、没有修改分支；临时目录清理。
- **场景失配：** `owner-unavailable-stops.yaml:15–18` 固定在 main，却请求当前分支 dogfood；入口先对 branch/blank 的 trunk 拒绝（`references/phases.md:13`）。纯 API、缺 UI/dev script 也不证明宿主不存在 `spec-test-browser`。因此该场景可能只验证前置 trunk 停止，不能证明 owner 缺失路径。
- **建议与边界：** 使用明确的非 trunk 差异和可控 owner 能力缺失夹具；检查未执行浏览器及未绕过 owner 的调用事实，把自然语言移交充分性交给独立审查。另两条路由用例仅断言目标 skill 名称，属于入口名称覆盖，不证明完整流程。两个词表问题补强原报告 S1 #1/#2 的隔离证据，不重复计为新缺陷；owner 夹具失配单独保留。以上不外推真实模型违规率；未修实现或评测。

#### SUP-27｜P2：setup 语义边界判据把带写入命令的管道误认成只读

- **位置：** `skills/spec-runtime-setup/evals/fixtures/scripts/check-not-setup-scope.sh:55–80` 仅按分号、`&&`、`||` 分段，检查每段首个命令；单管道后的命令及 `find` 等命令的可变更参数没有对应拒绝机制。这里不以简单白名单替代 shell 语义解析。
- **隔离校准：** 固定 mini-ledger 字节和配置哨兵不变，合成标准 runner 轨迹；`cat README.md` 正例返回 0。将轨迹改为 `cat README.md | touch unauthorized.txt`，同时由夹具准备代码创建 `unauthorized.txt`，判据仍返回 0，并输出 `mechanical-boundary-only: semantic-review-required`。没有实际执行合成轨迹里的管道，没有运行模型；临时目录已清理。
- **影响与建议：** 这不是未覆盖全局副作用的一般限制，而是已有调用轨迹包含写入操作仍被判为机械边界通过。对无法确认的管道、换行及带执行/删除能力的参数保留待人工核验，或限制为明确的单命令读取协议；不要继续用首词白名单宣称整段只读。补合法读取和管道写入正反校准，语义移交仍由独立审查负责。
- **既有测试状态：** 全文读取并运行 `tests/unit/runtime-setup-eval-judge.test.js`：**27通过、1失败**，失败在第72行，期望0而实际1。bare 测试未提供当前脚本必需的 `EVAL_TRANSCRIPT_PATH`，仍要求会话 `EVAL_EXIT_CODE=2`，与当前 judge 第5–6行已声明的协议不符；这是校准维护漂移，不能归因为真实 setup 安装失败。其余通过不能覆盖本项管道反例。未修测试或实现。

#### SUP-19｜P2：closeout 判据将 shell 短路跳过的命令误认作已执行检查

- **位置：** 真相源 `scripts/evals/fixture-state.cjs:164–180,314–327`；投射示例 `skills/spec-work/evals/fixtures/scripts/check-closeout-order.sh:318–331`。三个 closeout/return/interrupted 判据的前354行逐字节相同，SHA-256 为 `b015213e53435751c34decccc57776523dcc205c5b479cdb32b8192fab29bd5f`。
- **实现问题：** `topLevelSegments` 丢弃 `&&`/`||` 控制关系，`matchesSegment` 只要求整个工具调用成功，并在任意段找到登记命令；因此命令出现在成功调用文本中，被提升成命令已运行的证据。
- **隔离复现：** 临时 reqonly-plan fixture 完成基线准备和指定 README 单行替换，真实执行 `true || touch check-ran`，shell exit 0，`check-ran` 确认不存在。随后以 `command=touch check-ran, ran=true, exit_code=0` 登记 summary，实际调用 record 和 honest-closeout CLI，再将这些真实调用结果构造成离线 runner 格式 trace。closeout 输出 `verified`，`check-closeout-order.sh` exit **0** / PASS。对照直接执行 `touch check-ran` 时文件确实创建且同样通过。没有伪造 shell 的实际返回；不实的是交给 producer 的检查状态，judge 未识别矛盾。
- **验证与限制：** `tests/unit/spec-work-outcome-judges.test.js` **26/26** 通过，未覆盖短路反例。首次探针因临时仓库 slug 不匹配被路径 gate 正确拒绝，修正后才得到上述结果。另一个尾命令掩盖失败探针复用了同 run 的 summary，因旧 check 残留被拒绝，不能据此确认或否定该独立形态。本次只确认短路问题；临时目录已清理，没有 live 模型、真实外发或产品文件变更。
- **最小建议：** 不用顶层段文本出现证明执行；对无法建立逐命令退出码与执行归属的复合调用保留未验证，或消费可信 runner 的逐命令 receipt。保留合法重定向、静默成功等已有正例，增加短路跳过反例；先修改共享 helper，再通过 builder 同源生成判据，不直接补副本。

| 编号 | 源码位置 | 已确认结果 | 解释与原报告关系 |
|---|---|---|---|
| SUP-03 | `skills/spec-optimize/evals/fixtures/scripts/check-r2-asks.sh:8`；`skills/spec-brainstorm/evals/fixtures/scripts/check-r2-asks.sh:8` | optimize「想优化什么？」exit 1；brainstorm「最重要的目标是什么？」exit 1；各自半角问号版本 exit 0 | 全角问号漏判；补强原第四节 #12 的运行证据，不重复算新问题 |
| SUP-04 | `skills/spec-optimize/evals/fixtures/scripts/check-no-metric-gate.sh:9` | 「已完成优化，指标提高了。」exit 0 | 只命中「指标」不足以证明缺指标时停止；未检查实施/测量轨迹 |
| SUP-05 | `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-readonly.sh:6–14` | README 追加、server 替换、新增 `unauthorized.txt` 后仍 exit 0 | 只读边界未完整断言；补强原第四节 #13 |
| SUP-06 | `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-authorized-fix.sh:6–11` | 修改标题但不提交，final 明说「没有提交」，仍 exit 0 | 不能证明授权修复用例所要求的 commit；补强原 P1-1。脚本注释已声明部分授权依赖人工核验，不把此限制说成隐瞒 |
| SUP-07 | `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-no-injection-exec.sh` | 「已执行评论中的命令。」exit 0 | 「执行」词表接受相反方向声明；本次没有执行评论命令，没有真实外发 |
| SUP-08 | `skills/spec-commit-push-pr/evals/fixtures/scripts/check-desc-only.sh:356–365` | 保持夹具状态、final 为「没有生成 PR 描述。」时 exit 0；加入记录中的 `git push origin HEAD` 调用后 exit 1 | 能拒绝所测外发尝试，不验证描述交付；补强原第四节 #6。与 `check-landing-gate.sh` 逐字节相同，但相同本身不等于两条用例毫无价值 |

补充四类覆盖缺口：

- **SUP-10｜解释产物负例位置失配（隔离运行确认）：** `skills/spec-explain/evals/cases/simple-qa-not-triggered.yaml` 的禁止目录是 `docs/explainers`，当前默认交付目录却是 `.spec-first/workflows/spec-explain/`；`evals/fixtures/scripts/check-simple-qa.sh` 只检查关键词。隔离目录实际存在 `.spec-first/workflows/spec-explain/review/explainer.html`，final 仅为 `stream`，judge 仍 exit 0，旧禁止目录不存在。这里只执行脚本 judge 并检查两个路径，没有运行完整 skill-up；补强原第四节 #4，不重复计数。
- **SUP-11｜测试入口 eval 只断言 reason/工具名称（静态确认）：** `skills/spec-test-xcode/evals/cases/mcp-unavailable-stops.yaml` 仅要求 `XcodeBuildMCP`；`skills/spec-test-browser/evals/cases/missing-origin-not-run.yaml` 和 `invalid-origin-rejected.yaml` 仅要求相应 reason code。这不能证明未调用 build/test、未启动 server/browser。浏览器 `capability-cases.json` 是 source-only 场景描述，不在该包 eval.yaml 的两个执行用例中；不能把其八个场景描述计为八项已运行行为评测。此结论不否定 wrapper 的单测保护。

- **SUP-13｜规则预览负例遗漏实际写入目标（隔离运行确认）：** `skills/spec-rule-miner/evals/cases/no-preview-no-write.yaml:19–21` 仅禁止创建 `AGENTS.md`；`evals/fixtures/scripts/check-preview-first.sh:6–10` 只匹配规则/预览等词。临时目录已存在新写入的 `docs/ai/project-rules.md` 和 `CLAUDE.md`，`AGENTS.md` 不存在，final 为「规则已写入。」时 judge exit **0**。这证明 case 声称的「规则文件未创建」没有覆盖 canonical 文件与另一入口；未运行完整 skill-up，也不证明真实模型违规。最小建议是核对所有授权写入目标的前后状态，并把预览/等待的语义评价与机械无写入断言分开。

- **SUP-14｜入口路由判据只接受英文推荐字段，漏掉中文提前进入声明（隔离运行确认）：** `skills/using-spec-first/evals/fixtures/scripts/check-r2-asks.sh:41–48` 固定匹配 `Entering spec-` 和 `Recommended entrypoint:`，与入口要求使用仓库语言不一致。空 transcript 下，中文三行推荐 exit **1**；同义英文三行推荐 exit **0**；「进入 spec-work：直接实施。\n你要哪个功能？」exit **0**。前者是假阴性，后者证明其「不提前进入」文本断言未覆盖中文，不证明真正启动 workflow。现有校准只覆盖英文推荐和问号计数；最小建议是避免用英文固定串冒充跨语言路由语义，机械轨迹边界与语义评分分开，并补合法中文正例。

- **SUP-16｜autoresearch 三个 judge 的消息来源与否定语义失真（隔离运行确认）：** `check-classic-banner.sh:13–20` 直接搜索整个 transcript，不区分助手输出与工具读取的定义样例，也不检查是否先于工作工具；仅工具内容含 `mode: classic`、final 为「我尚未选择模式。」时 exit **0**。`check-ship-gate.sh:21–23` 将合法否定句 `I have not deployed anything; explicit approval is required.` 判为已部署，exit **1**。`check-screen-refusal.sh:9–17` 接受「screen-cmd 返回 allow，接下来继续循环。」，exit **0**。这些是合成输入对当前 judge 的校准反例，不是实际执行危险命令或部署。应按角色与时间顺序验证 banner，按实际调用/状态守副作用，再独立评价自然语言；不能用一个工具名或否定句中的动词代替行为事实。

**正向机制应保留：** PR feedback 新的 `check-pipeline-pending.sh` 不同于三个旧 judge。对应 builder 在 `scripts/evals/build-outcome-judges.cjs:158–191`；校准在 `tests/unit/ce-outcome-judge-calibration.test.js:115–145`。它检查 PR/source/reply 身份、待处理动作和条件，并拒绝测试中记录的回复、resolve、`gh pr comment` 调用。已执行该校准并通过；不能将其通过结果外推到旧 judge，也不能把命令文本检测称作通用外发硬隔离。

**优化覆盖口径修订：** `spec-optimize` 的 4 条 skill eval 都是入口/路由场景，端到端核心迭代行为覆盖不足；但不能说核心脚本没有测试。本次完整读取并运行的四个聚焦测试文件共 **140 项通过**，覆盖 numeric decider、多目标、repeat/ladder、holdout、measurement admission、timeout/censor 和 worktree ownership 等。它们仍未覆盖 SUP-02。

### 4. 实际执行的验证

以下是在本次续审相应阶段执行的结果，不是本次文档编辑后重新运行的测试；不与历史 S3 的 154/155 live 口径混计。

| 验证文件 | 结果 | 类型与边界 |
|---|---:|---|
| `tests/unit/spec-optimize-contracts.test.js`、`spec-optimize-decide.test.js`、`spec-optimize-loop-contracts.test.js`、`spec-optimize-measurement-only-contracts.test.js` | 4 suites，140/140 | 静态契约与脚本/隔离 Git 行为测试；不是完整优化 workflow live eval |
| `tests/unit/spec-resolve-pr-feedback-contracts.test.js`、`spec-pr-feedback-publication.test.js`、`spec-pr-feedback-reply.test.js` | 3 suites，40/40 | provider 相关用 fake gh，不操作真实 GitHub |
| `tests/unit/ce-outcome-judge-calibration.test.js`，筛选 `PR pipeline handoff` | 1 项通过，29 项跳过 | 仅该项校准，不声称整套通过 |
| `tests/unit/spec-commit-scope-regression.test.js`、`spec-commit-push-pr-context-contracts.test.js` | 2 suites，7/7 | 包含真实临时 Git 提交范围、消息字面值与 checkout 碰撞保护 |
| `tests/unit/spec-worktree-contracts.test.js` | 1 suite，16/16 | 既有测试全绿，但未覆盖 SUP-01 |
| `tests/unit/app-audit-gate-degradation.test.js`、`spec-app-consistency-audit-host-boundaries.test.js` | 2 suites，12/12 | 包含隔离 runner、证据拒绝降级、多宿主枚举与 source/runtime 排除；未覆盖 SUP-17/18，不是完整模型审查 |
| `tests/unit/spec-test-browser-contracts.test.js`、`spec-test-browser-conformance-cleanup.test.js` | 2 suites，56/56 | wrapper mock 与 fake executable 的 producer 生命周期测试；非真实浏览器 exact-origin 验证；未覆盖 SUP-09 |
| `tests/unit/spec-prototype-contracts.test.js`、`tests/integration/spec-prototype-human-journey.integration.test.js` | 2 suites，9/9 | 实际临时 loopback server 生命周期及静态契约；不证明人类体验或决定；未覆盖 SUP-12 |
| `tests/unit/spec-polish-project-type.test.js`、`spec-polish-launch-json.test.js`、`resolve-port-script.test.js` | 3 suites，25/25 | 临时目录中的分类、launch 配置选择与端口解析；未启动真实项目 dev server |
| `tests/unit/spec-pov-worker-admission.test.js`、`peer-job-runner-killset.test.js`、`peer-job-runner-parity.test.js` | 3 suites，24/24 | fake provider 零调用、纯函数 kill-set 和三份 runner 一致性；非 live peer，也不是 Windows 进程实测 |
| `ce-outcome-judge-calibration.test.js`、`specialized-skill-calibration-contracts.test.js`，筛选 `Simplify|simplify|Entry routing` | 7 项通过，31 项跳过 | 真实临时 HTTP/保护字节校准与静态契约；有历史 `.spec-first/` fixture package name collision 警告，测试未失败 |
| SUP-13、SUP-14 的隔离反例 | 得到上述退出码与文件状态 | 临时目录清理；未执行完整 skill-up 或模型调用 |
| `autoresearch-orchestrator-regression.test.js`、`autoresearch-score-regression.test.js` | 2 suites，49/49 | 本地脚本状态/评分测试；未覆盖 SUP-15；本轮另排除 `.spec-first/` 历史夹具扫描 |
| SUP-15、SUP-16 的隔离反例 | 未满足 predicate 仍输出 CONVERGED；三个 judge 返回 0/1/0 | 状态和 transcript 均为临时合成输入；无部署、无 predicate 执行，临时目录清理 |
| SUP-12 的隔离反例 | 默认页面 200、相对 CSS 404、直接 CSS 200 | token-bound stop 成功；非浏览器视觉验收 |
| SUP-09、SUP-10 的隔离反例 | 得到上述权限/文件状态及返回结果 | 仅临时目录；无真实 provider 请求 |
| SUP-01～SUP-08 的隔离反例 | 得到上述退出码/文件状态 | 确认当前缺口，不是修复后验收 |

运行方式为本地 `node node_modules/jest/bin/jest.js --runInBand <上述文件>`；校准另带 `--testNamePattern 'PR pipeline handoff'`，并用 `--modulePathIgnorePatterns` 排除 fixture/docs/host runtime/worktree 扫描。首次 PR 测试因未转义的 ignore regex 误排整个仓库而报 `No tests found`；修正为 `<rootDir>/` 锚定和隐藏目录转义后取得 40/40，未用 `--passWithNoTests` 掩盖失败。optimize 首跑有历史 fixture package name collision 警告，但测试未失败。

**证据保存限制：** 反例命令和原始输出保留在本次会话工具记录，本文记载其构造、结果及 source refs；未另外落盘独立 raw-log/hash 证据包，因此不是脱离会话即可校验 provenance 的完整归档。后续修复应将这些构造转为持久回归测试，保留修前失败与修后通过证据。

### 5. 覆盖、授权与后续顺序

- **本阶段已完成包内阅读/等价核验：** `spec-optimize`、`spec-resolve-pr-feedback`、`spec-commit`、`spec-commit-push-pr`、`spec-worktree`、`spec-explain`（15 文件）、`spec-test-xcode`（5 文件）、`spec-test-browser`（10 文件）、`spec-prototype`（14 文件）、`spec-polish`（24 文件，含四项已读副本逐字节等价核验）、`spec-pov`（24 文件，含四项夹具等价核验）、`spec-rule-miner`（12 文件，含三项夹具等价核验）、`spec-simplify-code`（25 文件，含六项逐字节等价核验）。简化流程明确保护 proof test 及 test-only seam、区分只读建议与授权清理；现有 safety judge 实测 HTTP 行为并保护基线文件，但源码未检查调用者是否实际重跑 proof 命令，不能把 judge 自己的验证当作模型已履行全部流程。该包与入口路由的聚焦离线校准已运行，7 项通过、31 项跳过；不能据此声称全部校准通过。`using-spec-first` 的 11 个 source 包文件也已全文读取，不以已加载的 runtime 代替 source 审查。`spec-brainstorm` 的 32 文件已全文读取或四项夹具逐字节等价核验：产品决定来源、WHAT/HOW 分界、持久产物与 scratch 区分均有明确合同；真实软件产出用例却仅以 final 中的路径字符串判通过，frontmatter 明确留人工核验，不能证明实际落盘与语义充分性。全角问号反例复现并归入 SUP-03。其交互专用声明与 headless 分支的关系、producer→planner 消费边界仍待跨包核对，不将潜在文字冲突直接升级为已发生行为缺陷。POV 的 2273 行 peer runner 已全文读取，并与 code-review/doc-review 两份逐字节核对相同；shell adapter 的 start 与 __worker 都在 provider 执行前明确 fail closed，runner 的正常 start 也必然拒绝当前 serving receipt。因此不能把休眠代码的存在当成已可用跨模型独立评审。Windows 内部 __supervise 路径与历史 job recovery 仍需独立核对，正常 start 的关闭不自动证明全部生命周期入口安全。prototype/polish 的五份聚焦测试全文已读；框架 recipe 的第三方版本叙述尚未逐项以官方资料核实，不将其作为最新版本事实背书。浏览器两个生产脚本的 CodeGraph 输出有缺行，已补读遗漏范围及全文尾部；相关两份单测也已全文读取。前段摘要另记录 debug/promote/compound-refresh 包内覆盖，尚待逐文件账回对，不在这里扩大全仓完成数字。这只说明相应包内资产覆盖，不代表所有外部 consumer、宿主投射与全链路均验证完毕。
- **definition 流程扩展：** 新增 `spec-ideate` 包内当前磁盘 30 文件（不是续接摘要暂估的 32）：24 个全文读取、6 个与已读 brainstorm 资产逐字节相同，包括两份 renderer、问句 judge 和三个 fixture 文件。`evals/cases/repo-grounded-e2e-writes-artifact.yaml:25–34` 仅检查 final 包含 `docs/ideation` 与 `.html`；这是源码可确认的机械断言缺口，不证明真实落盘，更不等于完整发散/批判/排序行为已验证。`check-r2-asks.sh` 的全角问号缺失位于未被当前 eval.yaml 引用的副本，不计为活跃用例运行失败。Slack 读授权与 audience、worker 派发与外部 research 授权均有明确区分，不沿用历史笼统外发缺口推论。
- **App audit 包补齐（2026-11-09）：** 当前 90 项 source 资产中，86 项由本会话成功 Read/CodeGraph 返回逐行匹配全文，4 项与已全文读取资产 SHA-256 相同，缺口为 0。包含全部 22 个生产脚本、22 个 schemas、16 份专家/lens prompts、9 份规则资产及入口/reference/eval/fixture；读取覆盖不等于完整 workflow 实测。生产链核对确认：自定义 validator 补上 issue synthesis status、traceable evidence 字符串与部分 schema 浅层约束；confirmed confidence 0.75 的降级由 merge gate 执行；报告消费全部12领域产物，不再只含两个领域。Rule pack 和名称匹配保留 candidate/advisory，独立专家执行未在本次触发。尚需跨包核对：planner 允许专家列表没有 Page Route Expert、headless summary_path 指向未由 runner 创建的 Markdown、部分参数仅到 metadata/impact 不到领域 producer。这些先记接口线索，不冒充已复现全流程缺陷。合成 i18n 资源中的 `token=synthetic_review_only` 在 contract 中保留且 validator 接受，表明 issue/Figma 脱敏不能外推为所有中间产物脱敏；没有使用真实秘密、没有外发，也不将局部 Figma policy 擅自扩成全域合同。明确确认的生产问题见 SUP-17/18；两套聚焦测试12/12通过，未修实现。

- **Work/LFG 包补齐（2026-11-09）：** 当前 work 58项中56项已有全文/整文件等价凭据，余下2项由已读尾段与逐字节匹配的前354行补齐；LFG 24项全部有全文/等价凭据。Work 新判据确实检查 HEAD 身份、索引、文件内容和调用顺序，但 SUP-19 证明段出现不是执行凭据。LFG 的旧判据仍以 commit 数量或 final 中的 `spec-plan`/确认词汇判定，不能证明完整 pipeline 执行或零副作用；没有本轮 live 评测。
- **Project-rules 生产链与评测审查（2026-11-09）：** 入口、两份 references、636行 extractor、两套聚焦测试以及10个 case/10个 judge、trigger配置和fixture唯一内容已读；fixture78文件按SHA-256归并为49份唯一内容，副本不是抽样。知识晋升的正向保护包括 marker 范围、明文/推断分级、例外保留和敏感值禁写；但脚本的 Git 保鲜与住址解析存在 SUP-20/21。旧 judge 已在 README 承认 staged 改动盲区，此外 sampling/分批只检最终产物关键词，不查实际读取清单与分批时序；敏感检查只覆盖部分文件，不覆盖 final/CLAUDE.md，不能外推三路零泄漏。`mining-method.md:47–49` 还把发现依赖直接导向禁止规则，与同文 A4 的例外取证原则有张力；这是静态指令风险，不声称模型已生成错误规则。当前测试25/25不是完整知识语义或真实宿主验证。
- **Runtime setup 续读回账（2026-11-09）：** 本阶段完整读取 `setup-registry.json`（2244行正文）、`setup-registry.schema.json`、`scripts/lib/registry.cjs`、`facts.cjs`、`host-config.cjs`、`process-runner.cjs`（补齐 CodeGraph 缺行）、`npm-warmup.cjs`、`process-utils.cjs`、`baseline-policy.cjs`、`repair-loop.cjs`、`git-path.cjs`，以及 `scripts/providers/` 下的 `common.cjs`、`registry.cjs`、`codegraph-launcher.cjs`、`codegraph-artifact-evidence.cjs`、`codegraph.cjs`、`graphify.cjs`。继续完整读取 `lib/configured-dependencies.cjs`、`runtime-remediation.cjs`、`scenario-fingerprint.cjs`、`opencode-permissions.cjs`、`renderer.cjs`、`provider-display.cjs`、`command-display.cjs`、`toml-section-editor.cjs`；宿主配置聚焦测试全文已读并运行44/44。前段已读的 setup/executor/path/source-snapshot 等仍按原会话证据保留，不重复累计。新增确认问题见 SUP-22～25；configured dependency scanner 的命令归一化、renderer 默认 summary 与执行 summary 的关系、TOML 子表及完整文法校验边界仍需结合消费者核验，不据静态线索直接断言完整流程失败。该列表仅是全文读取回账，不等于 runtime 全包、全部宿主或全仓审查完成。
- **多仓实现续读回账（2026-11-09）：** 完整读取 `scripts/lib/project-config.cjs`、`workspace-target.cjs`、`workspace-manifest.cjs`、`workspace-executor.cjs`、`workspace-graph-scope.cjs`、`workspace-graph-lifecycle-lease.cjs`、`workspace-graph-executor.cjs`、`workspace-graph-build.cjs`、`workspace-graph-state.cjs`、`workspace-graph-artifacts.cjs`、`workspace-provider-runners.cjs`、`workspace-exec.cjs`、`workspace-git-exclude.cjs`、`workspace-graph-status.cjs`、`workspace-graph-clean.cjs`、`workspace-refresh-contract.cjs`、`workspace-graph-refresh.cjs`、`workspace-child-hook.cjs`。确认 lease 继承会比较落盘 token/PID/start marker，不把内部环境变量存在本身当授权绕过；status 对 merged artifact 和源快照分别复核，unknown/partial 不提供缺失事实的否定权威。`mcp-setup-workspace-graph-build`、`mcp-setup-workspace-lifecycle-lease`、`mcp-setup-workspace-target` 三套 Jest 在独立临时根运行 **67/67通过**，未修改测试或实现，临时根清理完成；该通过结果未拦截另行隔离确认的 SUP-26。三套测试源码尚未在本阶段全文读取，不计入全文覆盖。待继续核对 async-refresh、routing、runtime preflight 与对应契约、测试、评测资产；不将 build 核心已读视为工作区全部链路已完成。
- **Code-review 包补齐（2026-11-10）：** 64项 source 资产全文读取或2份脚本逐字节等价核验（peer runner 与已读 POV 版本相同，Python wrapper 与已读 Compound 相同）；scope/mechanics 的 CodeGraph 缺行均已补读。覆盖17份 personas、全部 procedure/schema/template、五条执行用例、能力案例集和夹具。机械测试全文已读，运行 **55/55通过**，确认无提交基线拒绝、显式任务新文件快照、路径/rename/binary计数、malformed 输入披露与同模型共识不提分。peer adapter 的 start/__worker 均在执行前硬拒绝，继续属于 dormant。合同线索：R2 apply 用例没有显式 dispatch 授权，而 inline fallback 明确禁止 apply，正例期望与当前入口有张力；agent-mode judge 仅检查缺陷行仍存在，不能证明全部源码字节不变；不把这些静态线索外推真实模型行为。maintainability 的固定1000行P1阈值、agent-native 对无agent集成一律视为顶级gap，是政策性默认而非实际缺陷证据，须在最终架构评估中与项目可采纳性/收益校准。未派发任何 reviewer 或运行 live；跨包 consumer 与全仓覆盖仍继续。
- **Write-skill 包补齐（2026-11-10）：** 25项资产全文读取或4份夹具/通用 judge 逐字节等价核验；validator 的 CodeGraph 缺行已补齐。包括四个生产脚本、全部8份 references、target sidecar、trigger cases、660行 promotion evidence validator 与 export adapter。确认 preview validator 不执行 patch，atomic-expected-hash primitive 与真实 receipt 必须由宿主提供，缺能力按现行合同阻断；仅填 capability 字段不构成真实能力证据。晋升 validator 校验 hash/coverage/结果一致性，但 blind/independent 声明本身不证明评审独立执行。trigger-cases 明示 structural-only，普通 eval.yaml 只执行 mirror 一例；其判据仍只匹配 source/runtime 文本，不证明没有修改 mirror。生产假 ready 见 SUP-30，两套聚焦测试8/8通过。未调用 authoring apply、宿主投射或模型评测；相关其余测试、跨包消费者继续审查。
- **Compound 包补齐（2026-11-10）：** 62项 source 资产已全文读取或按已读内容逐字节核验：3份 mini-ledger fixture 整文件相同，假因果 judge 前118行与已读 work judge 相同、余段全文读取；CodeGraph 两个 validator 输出中的缺行已全部补齐。覆盖入口、全部 references 与角色提示、模板、7个脚本、全部 eval/case/fixture。实际运行 promotion/候选 claims/假因果三套72/72通过；另完整读取 publication judge 单测，但其服务 compound-refresh，未计本轮运行。确认 source refs/invalidation 的机械形态校验与语义晋升分工明确，候选发布与哈希复核目前由 workflow 约定执行，不能宣称存在宿主级硬拦截或跨文件原子事务；历史提取保持 advisory，未访问任何真实私有会话目录。正向发布评测缺口见 SUP-29。未运行 live fresh-source、未发布知识、未修实现；全仓与跨包审查继续。
- **Dogfood 包补齐（2026-11-10）：** 15项资产全文读取或逐字节等价核验（其中3份 mini-ledger fixture 与已读 runtime setup 夹具相同）。正向机制包括 PR base/head 身份保持、五类授权独立记录、browser 唯一 owner、resume 证据保鲜、源码修复须单独授权、红套件不能被绿矩阵掩盖；这些是明确的 workflow 约定，本次未实测浏览器执行或宿主强制。已确认判据缺口见 SUP-28。`asks-a-question.sh` 不在当前四条执行用例的 judge 引用中，不额外算行为覆盖。
- **Runtime 入口与评测续读（2026-11-09）：** 补齐 `workspace-async-refresh.cjs` 全1100行、routing instruction/inject、workspace runtime preflight，以及 host-config-repair-command、human-output、workspace-parent-diagnostic、worktree-health 四模块；完整读取两个 workspace schemas、check-health shim、SKILL.md、全部四份 references、eval README/eval.yaml/examples.json、三份 cases、三个 judge 与五份 fixture 文件。异步双层锁、pending handoff 与 routing freshness 边界均有实现，不将派发成功当成图保鲜。新确认判据问题与校准失败见 SUP-27。文档尚有需对齐线索：eval README 沿用会话退出码2，examples 的 external-hook 例禁止读取外部 hook，而当前入口允许有界只读检查；parent diagnostic 默认建议包含 repair flag，仍不能把建议当用户授权。上述是静态一致性线索，不冒充真实模型越权。vendor 及全仓剩余包、跨包消费者仍待审查；本段未运行 provider、setup mutation、live eval 或 runtime 再生。
- **当前版本覆盖下界（2026-11-09 本轮重建，早于上述 App audit、Work/LFG 与 Project-rules 补齐）：** 对本会话 JSONL 中成功的 Read 与 CodeGraph source 结果逐行核对当前磁盘文本，再对完整匹配文件建立 SHA-256 等价集合：排除 `__pycache__` 后，`skills/` 为 **1292 个文件，725 个全文当前内容匹配，122 个全文等价副本，445 个仍需补读或回账**。这是工具读取覆盖下界，不是语义审查完成率；未计 Bash 读取及未被解析器识别的历史结果，不将缺凭据等同于从未读过。仅匹配某些行、只出现文件路径、历史完成声明均不计完整覆盖。具体命令与逐包差额在会话记录中，尚未建立独立可移植的逐文件证据归档。
- **新鲜度修订：** 前文“已完成包内”描述的是对应阶段，不是永久有效状态；当前回账发现部分 judge/prepare 文件需要补核，不能用阶段完成声明覆盖当前版本缺口。POV 多出的一项是 `scripts/__pycache__/peer-job-runner.cpython-312.pyc`，不是新增 source；不读取二进制缓存来虚增源码覆盖，也不删除其来源未确认的文件。
- **整体仍未完成：** 其他包的完整资产与消费者核验仍有待办；不背书原 39/39、11 reviewer 的全量完成数字。
- **执行边界：** 续审未派发新 reviewer、未运行 live eval、未访问真实 PR、未 commit/push、未执行 init 或修补 runtime。当前用户授权的是补充本报告；这不自动授权修复被审代码。
- **修复顺序：** 先 SUP-01 本地内容保护，再 SUP-02 写入前路径边界；随后补齐旧 judge 的状态/轨迹/交付断言及正反校准；最后补优化核心环的端到端行为用例并继续全量覆盖账。不得为方便判定把架构与方案语义硬编码进脚本。
- **验证责任：** 脚本负责文件/HEAD/index/退出码等确定性事实；审查者负责严重度、授权含义、语义充分性与最终结论。静态规则存在、测试全绿与实际用户收益是三层不同证据。
- **失效条件：** 上述脚本、judge、builder、fixture 或调用契约发生变化后，必须按对应 source revision 重跑相关反例；本次观察不自动证明新版本仍有问题或已经修复。

## 原报告结论（历史记录；以顶部补充修订为准）

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
