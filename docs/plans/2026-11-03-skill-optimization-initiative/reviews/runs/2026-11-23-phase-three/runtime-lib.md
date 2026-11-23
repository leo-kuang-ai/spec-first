# Runtime Setup：库实现独立审阅

**结论：优先修清理范围和完成判定。** 在隔离的 A、B 工作区，只指定 A 时清理器会移除 B 的父级子图；显式要求 A 和不存在的仓时，构建器反而能只做 A 并发布 `complete`。两者都不是改一句提示就能解决的问题。

**证据范围。** 2026-11-23，Codex；先读项目角色契约，再分块通读 `5a55514d9` 的 `skills/spec-runtime-setup/scripts/lib/**`。54 个文件、17,404 行；逐一比对了工作树字节与基线 blob。表中范围按基线文本仅去掉最后一个 LF 后计行。只将库间直接调用、返回字段和下列临时探针作为证据；不重复评审入口、provider、安装包或宿主投射，不把注入结果当真实安装、真实故障或用户收益。

### 会改变下一步的发现（锚点均为基线行号）

| 编号 | 用户会看到什么；证据 | 修法及验收条件 |
|---|---|---|
| L01 高：清理越过选择 | `workspace-graph-clean.cjs:91,145,276` 只按选择清 child，却无条件递归删除两棵共享图树。临时 A、B 状态可读，指定 A、禁用发现时实得 `complete`，B 的 DB 还在，但 B 子图和成员收据均消失；启用发现则实得 `partial`、`pending_confirm=[B]`，B 的子图仍被删。 | 在清理前核对收据中的完整成员、待确认项和实际选择；部分选择不许删共享树或路由。保留完整清理的合法路径，缺归属证据时宁可保留并说明如何重试。 |
| L02 高：显式漏仓仍报完成 | `workspace-target.cjs:72` 收集 `rejected`，但 `workspace-graph-executor.cjs:74,102` 和 clean/status 只挡清单解析或歧义。临时 `--repos A,missing` 配无副作用的 provider 替身（只在临时目录产生样本）：实际结果与持久状态均 `complete`，只含 A，嵌套拒绝原因却是 `declared-repo-not-found`。 | 将显式声明失败提升为独立失败出口；在任何构建、清理前报告具体路径和原因，状态也不得报 ready。发现到的线索不是显式请求，不一律硬挡。 |
| L03 高：缺参退回有副作用的默认模式 | `args.cjs:57` 吞掉无值 `--version`，`mode-policy.cjs:138` 又把空参数变成默认安装计划。只串联两纯函数，实际 `modeArgv=[] / bare / mutation=true`，未调用安装入口。 | 无值拒绝或明确只读显示版本；保持带值的内部版本元数据兼容，不允许错误输入选择安装。 |
| L04 高：宿主恢复提示丢失 | `host-config.cjs:1435` 能返回手工恢复路径，`runtime-executor.cjs:605,641` 却只投射常规冲突等字段。给 applier 注入正常的失败结果 `host-config-restore-failed + backup_path + recovery.next_action`，实际行的 `next_action=null`，行和收据均无备份路径。成功后重读也会丢掉释放锁失败的动作。未制造宿主写失败。 | 保留事务恢复与解锁字段，先展示恢复原文件的动作，不能用重新安装替代；只保留清理所需字段，不复制原始配置或秘密。 |
| L05 高：父诊断把发现变成确认及修复建议 | `workspace-parent-diagnostic.cjs:23,37,47` 将自动发现的仓作为 CLI 声明传回状态检查，且无漂移证据就建议全仓 `--repair-host-config`。临时 `repo A,repoB` 直接状态 `needs-confirmation`、两项待确认；父诊断变 `partial`、待确认清空，建议命令中的 `repo A` 还未引用。诊断本身没有写入。 | 保留发现来源；首选只读状态或计划。仅在具体冲突并确认覆盖时给修复命令；使用参数数组生成可复制的显示字符串。 |
| L06 高：补救扩大原任务且选错目录 | `facts.cjs:82` 将 target 放在 tool facts，`renderer.cjs:265` 却读 runtime capabilities 的 target；把「已安装但未建图」统一建议为两个 provider 的全量 setup。隔离安装范围、仅选 Graphify、非 Git folder、配置冲突时，实出 `--only 'codegraph,graphify' --repo <folder>`；它既不能选择该目录，也不是接线修复。 | 从真实目标与执行范围生成动作，不用未测的图字段解释安装失败；只保留原选择，必要时先 `--plan`。 |
| L07：同一 manifest 三种结论 | `runtime-executor.cjs:327` 归并只看 baseline/host/provider；`facts.cjs:361` 的宿主账本另判 manifest；`renderer.cjs:276` 可同时让人初始化又继续 workflow。临时空 registry、无 manifest 的全范围验证，实际 `exit=0 / ready / ledger=action-required`，两句人读建议同时出现。 | 明确当前范围的完成口径，对未就绪投射只给一条一致结论；区分写出 facts 成功和可进入 workflow。 |
| L08：成功的安装范围被批验证算作失败 | `mode-policy.cjs:139` 默认 verify 为安装范围；`workspace-executor.cjs:524,620` 不统计 `partial`。注入单仓 `exit=0, scope=installation, partial/subset-setup-complete`，父子 manifest 均 current，实际父 `action_required=1, exit=1`，建议修复不存在的失败。 | 保留请求范围、分开成功子集与真实失败；不要把所有 partial 改为成功，全量未达标必须继续可见。 |
| L09：缓存仅能证明可解析 | `facts.cjs:595,634` 未核对身份、格式和新鲜度；`human-output.cjs:85` 默认 required IDs 从已有行推导。临时把另一主机、另一根目录的历史 JSON 放在预期文件名下，库组合返回两个 `ready` 和「继续目标」。此探针未经过外层入口补偿。 | 将文件可读与证据适用性分开；由持有期望 host、repo、registry 和当前快照的调用方核对，无依据时提示在原范围刷新 facts。 |
| L10：一份非空 DB 被读成新鲜且有结果 | `workspace-graph-artifacts.cjs:13` 只查稳定普通文件和大小；`workspace-graph-status.cjs:141` 直接转为 `complete / has-results`。仅放非空占位 DB、没有构建收据或查询，实得 child 这两个值；顶层正确是 `partial/workspace-graph-state-missing`。 | 保留 `codegraph_present`，没有索引和源快照对应证据就不声称新鲜；没执行查询就不报告有结果。 |
| L11：本地设置错误被诊断丢弃 | `project-config.cjs:200` 能区分 invalid；`preflight.cjs:114` 压成 missing，`human-output.cjs:53` 只处理示例和 ignore。注入 invalid 本地配置、current 示例和正常 runtime，得到 `missing/skip` 及「继续目标」。 | 保留 invalid、具体路径和原修法，告诉用户先修 YAML，不建议重新生成示例。 |
| L12：ignore 修复不收敛 | `project-config.cjs:84,345` 一处按 Git 有效规则、一处只按行存在。临时 Git 仓中合法的后置否定规则使本地配置可见；修复前 `missing`、执行 `already-present`、复查仍 `missing`。 | 以有效 ignore 为验收，遇到用户否定或已跟踪时返回人工判断的具体原因，不擅自覆盖规则。 |
| L13：依赖扫描混淆配置意图与可用性 | `configured-dependencies.cjs:123,190,250` 接受 JSON `null` 后访问 `.scripts`，实抛 `TypeError`；禁止使用一个未安装的命令也实得 `denied / action-required / undeclared`。 | 拒绝错误文档形状但保留其余扫描；deny 只描述策略，不构成安装需求。 |
| L14：清理用户 hook 会放宽权限 | `workspace-child-hook.cjs:302,305` 移除受管块后固定 chmod。临时普通 hook 有用户正文且模式 `0700`，只调用移除，实得 `ok=true` 及 `0755`。 | 仅移除受管正文，保留当前权限；不推测安装前模式。验证正文保留与权限不变。 |
| L15：键序导致虚假配置漂移 | `toml-section-editor.cjs:539,601` 写出内联表时排序，对比时依赖 JSON 的键插入顺序。纯函数用 `env={Z:'z',A:'a'}` 首次生成成功，随即与同一输入比较却为 `toml-target-config-drift/env`。 | 映射按键值比较、数组仍按顺序；对自身输出和用户合法的不同键序均应幂等。 |
| L16：损坏的异步收据可显示成功 | `workspace-async-refresh.cjs:470,480` 用真值判断 `status`，用严格布尔判断明细。隔离普通 JSON `{ok:'false'}` 得 `succeeded / last_result_ok=false`。 | 区分格式错误、运行中和最后一次已确认结果；至少要求布尔值，不能由字符串提升成功。 |

## spec-runtime-setup

| 包相对路径 | 基线实读行 | 内容判断 |
|---|---|---|
| `scripts/lib/args.cjs` | 1–189 | 入口旗标与模式分两次解析，列表去重、互斥交下游；帮助明确 verify 写 facts。缺版本值被第一次解析吞掉，见 L03。 |
| `scripts/lib/baseline-policy.cjs` | 1–57 | 显式选项优先于 workflow 精确匹配和 advisory，旧条目标出迁移警告；消费端应看本次 demand，而非把所有缺失都当阻塞。 |
| `scripts/lib/command-display.cjs` | 1–15 | POSIX 与 PowerShell 分别引用每个 argv，返回仅供显示的命令；适用于修 L05 的空格仓名，不应送回 shell 执行。 |
| `scripts/lib/configured-dependencies.cjs` | 1–341 | 汇总 MCP、hook、权限、脚本及验证配置；命令首词加 PATH 文件存在不是可执行性证明。无效文档和 deny 的两种误判见 L13。 |
| `scripts/lib/facts.cjs` | 1–788 | 单项 ready 要确认来源，随后分别发布项目双文件和宿主账本；写出成功、基线通过、当前任务完整不是同一件事。读取快照与 ledger 聚合的限制见 L07、L09。 |
| `scripts/lib/git-path.cjs` | 1–60 | 屏蔽继承的 Git 覆盖变量、禁用可选锁，利用 Git 自身解析 worktree 元数据；返回绝对路径是定位，不是写权限。 |
| `scripts/lib/host-authority.cjs` | 1–220 | 环境候选默认 advisory，严格模式下 pin 必须与规范化的加载表面匹配；共享表面记录全部宿主，五分钟字段及摘要不是用户逐项批准。 |
| `scripts/lib/host-config-repair-command.cjs` | 1–30 | 修复命令保留已选 ID、repo/folder、安装范围与刷新标志；未携带 workflow 需求标志，不能视为任意 action plan 的无损重放。 |
| `scripts/lib/host-config.cjs` | 1–1511 | 分层处理目标优先级、权限、配置比较、互斥写、备份与回读；双重失败时提供 retained path，放弃锁也记录后续动作。关键是让外层真的交付这些字段，见 L04。 |
| `scripts/lib/human-output.cjs` | 1–181 | 区分只读检查和会写 facts 的验证，能标可选 hook；但项目错误或输入快照不完整时，最后一句继续建议比输入证据更强，见 L09、L11。 |
| `scripts/lib/installation-executor.cjs` | 1–575 | 基线和 provider 安装分工；browser 需能力探针而非仅版本，helper 安装后复测。warmup 命中记录的是缓存身份与旧成功，不是本轮重新启动 MCP。 |
| `scripts/lib/mode-policy.cjs` | 1–191 | 区分只读 check、写 facts 的 verify、能安装的 bare；默认 plan/verify 仅安装范围。消费者若丢掉这一层，就会把主动限制当失败，见 L03、L08。 |
| `scripts/lib/npm-warmup.cjs` | 1–117 | 校验归档、包名、版本、完整性后才执行本地归档；输出明示 top-level archive，不能据此证明所有传递依赖或服务已可用。 |
| `scripts/lib/opencode-permissions.cjs` | 1–483 | 从受管技能集合派生精确 permission，按最后匹配规则识别顺序冲突和更严格覆盖；拒绝冲突不代表 OpenCode 服务已启动。 |
| `scripts/lib/path-safety.cjs` | 1–142 | 区分词法与物理边界，拒绝符号链接路径段；写前复核目标代次并同目录替换。该工具解决路径问题，不能决定本次应改哪个仓。 |
| `scripts/lib/preflight.cjs` | 1–190 | 分开依赖和接线，未检查的 MCP 不报 ready；压缩项目状态却丢了 invalid 和修复动作，见 L11。 |
| `scripts/lib/process-runner.cjs` | 1–478 | 异步进程组终止、Windows 树终止、限量脱敏输出与同步包装分明；成功须零退出且无超时、信号和 error，单凭 stdout 不足。 |
| `scripts/lib/process-utils.cjs` | 1–22 | PID 存活探针把 EPERM 当存活，防止误回收；只能证明 PID 存在，锁属于哪次进程由上层启动标识判定。 |
| `scripts/lib/project-config.cjs` | 1–447 | 本地 YAML 查语法、重复键及字段消费者，不宣称值在下游可用；批处理留逐仓结果。ignore 的建议和执行判据不一致，见 L12。 |
| `scripts/lib/project-target.cjs` | 1–398 | repo 只收精确 Git 根，folder 的产物留在本目录、可复用上层投射；坏 worktree 阻写并给预览修复，故 L06 的错误目标参数有实际影响。 |
| `scripts/lib/provider-display.cjs` | 1–48 | 将安装接线、索引、新鲜度、CLI 查询与 MCP 连通性分开显示；`installation-ready` 不能解释为已建图或已验证查询。 |
| `scripts/lib/registry.cjs` | 1–823 | 校验方言、宿主覆盖、重复目标、provider 镜像，再按默认/宿主/平台叠加；诊断 registry 不冒认某个宿主，合法注册不等于运行就绪。 |
| `scripts/lib/regular-file-publication.cjs` | 1–32 | 首选硬链接发布，退到独占复制；把目标已存在报告为 contended 而不覆盖继任者，恢复成功指规范位置恢复，不保证旧副本清理成功。 |
| `scripts/lib/regular-file-snapshot.cjs` | 1–139 | 通过描述符前后及路径代次核对区分 missing、unstable、unreadable；调用者传 root 才会额外验证目录链，成功只证稳定读取。 |
| `scripts/lib/renderer.cjs` | 1–343 | 计划与实际执行的输出分开；风险元数据、写入范围和执行结果需一起解释。补图提示不看原选择且 folder 信息缺失，见 L06、L07。 |
| `scripts/lib/repair-loop.cjs` | 1–44 | 默认最多两次，每次 apply 后 verify；相同原因或无预定义动作停止，避免无依据反复重试，函数存在不证明每个调用方都用了它。 |
| `scripts/lib/runtime-executor.cjs` | 1–973 | 分阶段计划、安装、接线、复探并写 facts；成功摘要按选中范围判断。配置事务动作丢失、manifest 聚合分叉分别见 L04、L07。 |
| `scripts/lib/runtime-remediation.cjs` | 1–37 | 提供交互与 headless 的 cwd/argv，后者含明确需替换的姓名和语言；清除修复提示有单独函数，命令只是建议。 |
| `scripts/lib/scenario-fingerprint.cjs` | 1–229 | 优先 helper，再走 CLI，回读 schema；CLI 成功但内容未改变不会认作新产物。失败只产生有限诊断，指纹始终 advisory。 |
| `scripts/lib/source-snapshot.cjs` | 1–202 | 对源码内容、HEAD、registry 与宿主配置分别取证，跳过自产缓存、限制读取预算；预算超限留下 limitation，不等于源未变化。 |
| `scripts/lib/toml-section-editor.cjs` | 1–698 | 只编辑受管表及字段，遇到歧义值或子表可拒绝，卸载比较更严格。内联表键序却被当漂移，见 L15。 |
| `scripts/lib/workspace-async-refresh.cjs` | 1–1099 | pending、事件锁与后台完成收据分立；触发 spawned 不等于重建成功。读取损坏收据的真假判据不一致，见 L16。 |
| `scripts/lib/workspace-child-hook.cjs` | 1–676 | 分子仓内外 hook 路径；安装两种事件，状态复查执行位、受管块与启动器；检测外部 marker 不证明执行。卸载用户文件权限问题见 L14。 |
| `scripts/lib/workspace-exec.cjs` | 1–29 | 为工作区命令准备启动器，传 cwd、环境和超时，分别返回 signal/error；这条同步路径不同于通用 runner，调用方须读完整结果。 |
| `scripts/lib/workspace-executor.cjs` | 1–704 | 共享配置阶段与逐仓结果分开，保留 child 错误、父污染清单及初始化位置；默认 verify 的部分范围被汇总成失败，见 L08。 |
| `scripts/lib/workspace-git-exclude.cjs` | 1–128 | 用 Git 解析 info/exclude 而非写 tracked gitignore，损坏的标记对会阻断；删除块时还会归并其他位置的连续空行，非逐字节还原。 |
| `scripts/lib/workspace-graph-artifacts.cjs` | 1–384 | 流式检查 Graphify 的 UTF-8 与完整 JSON 语法，发布收据绑定代次和摘要；CodeGraph 只查稳定非空文件，均没有查询语义证明。 |
| `scripts/lib/workspace-graph-build.cjs` | 1–632 | 按仓分别记录 CodeGraph、exclude、Graphify；暂存再发布、核对源快照，合并区分单源/跨仓，备份未清会降级。仅能对收到的仓列表负责，见 L02。 |
| `scripts/lib/workspace-graph-clean.cjs` | 1–368 | 先拿生命周期锁，子项出错时保留共享状态；全仓成功清理有用，但按部分选择执行也删除共享树，见 L01、L02。 |
| `scripts/lib/workspace-graph-executor.cjs` | 1–472 | 有仓数及时间预算、取消、继承锁校验以及发布后状态校正；不把发现项直接拿去构建，但漏掉被拒绝的显式项，见 L02。 |
| `scripts/lib/workspace-graph-lifecycle-lease.cjs` | 1–634 | 独占发布 owner、PID 启动标识、单调时钟等待及代次核对防并发误删；查询锁状态不创建锁，继承者不得释放。 |
| `scripts/lib/workspace-graph-refresh.cjs` | 1–57 | 单仓 watcher 与跨仓异步重建不是一种机制；部分仓装 hook 时提示未覆盖仓手工刷，声明合同而非证明后台成功。 |
| `scripts/lib/workspace-graph-scope.cjs` | 1–77 | `projectPath` 边界明确是 advisory，空结果不证明不存在；该层不会独立验证传入的 `freshness/hasResults`，故上游不能虚填。 |
| `scripts/lib/workspace-graph-state.cjs` | 1–238 | 对每个仓绑定 HEAD 与工作树指纹，提交状态前确认合并图代次、源未变化；schema 可读只说明收据可消费，不等于 operation complete。 |
| `scripts/lib/workspace-graph-status.cjs` | 1–563 | 父层对成员、源码、合并文件摘要、路由、后台状态逐项核对；子仓 DB 非空却直接报告新鲜和有结果，见 L10。 |
| `scripts/lib/workspace-manifest.cjs` | 1–135 | 小型清单解析器支持指定缩进、注释、引号并校验 schema；重复键、版本和不可解析分开，不能以成功解析证明仓路径存在。 |
| `scripts/lib/workspace-parent-diagnostic.cjs` | 1–155 | 区分逐仓 setup 与父级双层图，父级没有 repo-local facts 并不是故障；将发现项当 CLI 声明和默认推荐覆盖削弱了这层提示，见 L05。 |
| `scripts/lib/workspace-provider-runners.cjs` | 1–84 | 全局安装一次，逐仓 init/sync；extract/merge 移除 GRAPHIFY_OUT 干扰。成功映射要求无信号错误，图文件仍要由构建层核验。 |
| `scripts/lib/workspace-refresh-contract.cjs` | 1–39 | 收缩传给后台的环境；仅异步模式、指定 hook 合同版本且已完成或可恢复的部分状态才允许刷新，未获准的失败应显式重跑。 |
| `scripts/lib/workspace-routing-inject.cjs` | 1–176 | 按宿主把写入合并到不同入口，逐文件检查大小与受管块，清理不删除整个用户入口；返回逐文件结果而非声称宿主已经加载。 |
| `scripts/lib/workspace-routing-instruction.cjs` | 1–155 | 父根无默认 child，跨仓查询前先查状态；拒绝不成对或重复标记，验证公共路由忽略宿主附注，不等于验证每个宿主能力。 |
| `scripts/lib/workspace-runtime-preflight.cjs` | 1–175 | 区分 execution/artifact/projection root，只对已确认仓检查 runtime；非 current 给具体 cwd/argv。零个目标通过遍历不意味着已验证任何仓。 |
| `scripts/lib/workspace-target.cjs` | 1–277 | manifest/CLI 指定与待确认发现分开，保留 alias 冲突、嵌套与拒绝原因；消费者必须处理显式拒绝，不能只读存活列表，见 L02。 |
| `scripts/lib/worktree-health.cjs` | 1–144 | 区分普通仓、坏指针、损坏 gitdir、非仓；`repair-worktree --dry-run` 只给恢复路径，预览零退出不是已修复。 |
