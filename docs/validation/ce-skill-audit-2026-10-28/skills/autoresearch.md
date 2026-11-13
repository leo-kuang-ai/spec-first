# autoresearch 全量复核工作记录

状态：`source_review_complete`。当前磁盘包内30文件全文审读；治理/schema、辅助inventory producer以及双方Optimize/Debug/commit直接职责接口已核对。源码裁定与独立验证分开；本项完成不关闭全局34项。

## 意图与源头关系

本地提供可检查成功信号驱动的经典 metric loop 与 LLM 语义分类后的 orchestrator；14 个子协议涵盖诊断、修复、探索、推理、文档、研究及交付。CE 映射清单中无直接对应 Skill，不虚构迁移保真结论；它是本地扩展，其与 `spec-optimize`、`spec-debug`、`spec-plan`、`spec-code-review` 的职责边界仍需双方相邻 owner 核对。逐文件事实见 [文件表](../file-tables/autoresearch.md)。

脚本仅返回关键词候选、状态路由、出口筛查与数值评分。`classify` 的 advisory/LLM 判断分层保留正确；`verdict` 在 pending verify、未解决错误和失败时不收敛。这里的源码判断不证明真实宿主或现场效果。`screen-cmd` 是有限规则筛查，不是命令执行沙箱；通过不自动产生执行授权。

## 已执行的无副作用复现

证据：[autoresearch-repros.json](../autoresearch-repros.json)。临时 TSV 写入 OS 临时目录并已删除；只运行本地 scorer，不执行任何 TSV 内命令或真实 ship。

| 候选编号 | 位置 / 合同 | 触发与观察结果 | 影响与建议 | 验证状态 |
| --- | --- | --- | --- | --- |
| AR-01，P1 | `scripts/score-regression.sh:74–77`；`regression.md:36` 定义 `regression-eligible`，`:74` 又使用 `eligible` | 一个 HARD functional 回归使用 `regression-eligible`，加 performance=100：退出 0、STABLE；只改分类为 `eligible`：退出 1、UNSTABLE | 正常按分类表写入可漏掉 HARD 阻断；统一规范名并显式兼容旧名，未知分类不得静默视为安全，补文档形状 fixture | 运行事实已复现；独立 validator 未执行，审查状态 unresolved/report-only |
| AR-02，P2 | `scripts/score-regression.sh:50,86–103`；`regression.md:59` 定义 `visual-ui` | visual-ui=0 加 performance=100：退出 0、STABLE；只改名称为 visual：退出 1、UNSTABLE，score=60 | visual-ui 行被排除在评分外；统一维度并兼容旧名，避免遗漏已执行维度，补字段兼容 fixture | 运行事实已复现；跨文件合同判断未独立验证，unresolved/report-only |

AR-01 是共享字段词汇不一致，文档本身也矛盾，不能只把责任归于脚本。AR-02 使用零视觉分只是确定性夹具，不代表测过真实视觉。`pre_existing` 归属需比较基线提交后补充；当前不声称由最近改动引入。

## 源码合同风险（最终裁定见后表）

- `learn.md:85–104` 将 init/update/check 共同引入生成、修复和 commit 主循环；check 是否应严格只读需要 owner/入口合同交叉核对，未执行写文件复现。
- `reason.md:59–67` 的 no-synthesis/debate 跳过 AB，却仍要求 3 个候选与 tie→synthesized；`references/reason-judge-protocol.md:45` 在随机标签前提下仍写 synthesized=Label-Z。应明确候选数量、身份映射与无 AB 的 tie 规则。
- 经典 loop 在 dirty 时仅警告，然后每轮 stage/commit/revert；任务归属和独立 commit 授权不够明确。需对照本地 commit owner 后裁定，不在本次审查执行 commit/revert。
- eval judges 主要查最终消息关键词，classic banner judge 未验证 banner 是否在工具调用前。其通过最多证明文本合同，不能证明危险命令没执行或 mode 顺序正确。真实 host eval 未运行。
- `references/orchestrator-routing.md:84` 提及 `CONTEXT.md`，包内不存在目标；需确认是移植遗留还是另有 owning source。

## 进度与限制

现有 `autoresearch-orchestrator-regression.test.js` 全文已读，其覆盖 pending evidence、ship gate、redacted refusal 和 advisory classification；未覆盖 scorer 的上述两种协议形状。第二批现有测试 17 suites / 357 tests 通过，不能反驳这两项独立复现。

共享governance/schema、localization producer及相邻owner接口现已核对，裁定见后表；独立验证和真实行为仍未执行。没有修改产品源码、runtime、既有dirty文件或CE仓库。

## 双方相邻能力与融合裁定（全量复核收敛）

CE 没有 autoresearch 对应包；本地的14个子协议均已完整审读，不能把“无对应”记为免审。比较对象是双方 Optimize 的实验准入/测量/持久化接口、Debug 的真实根因/复现出口和 commit helper 的具体副作用owner。CE三项完整包分别在其表格项审查，本项不冒充替代其全包覆盖。

| 研发场景 | CE 源码依据 | 本地已有能力/差异 | 裁定与最小融合建议 | 成本与验证 |
| --- | --- | --- | --- | --- |
| 已工作系统的开放优化 | `ce-optimize/SKILL.md`、`references/measurement.md` 先定义target、scope、不可变harness、gate与baseline，再做bounded experiment；已知改法归work、诊断归debug | autoresearch classic具有Goal/Scope/Metric/Verify/Guard，但还提供build/fix/security/ship等内部子协议；本地spec-optimize已有多目标、holdout、measurement-only与确定性decide | **保留扩展为显式opt-in；建议复用成熟owner，避免第二套常规研发路由。** 有明确优化目标时交spec-optimize；autoresearch仅保持轻量独立实验/用户点名loop，不把所有code work都包进自己的状态机 | 轻量handoff/职责澄清，不新增central orchestrator。用同一个需求分别走work/debug/optimize/显式loop的routing反例；实际净收益待任务对照 |
| 防止提升分数却破坏目标 | CE measurement将评测数据/harness固定，empty/constant/known-good/known-bad反证；full baseline和final confirmation | autoresearch Guard可选，scope常是glob，Verify pinned不等于数据、harness、metric实现不变。本地spec-optimize measurement已覆盖冻结selection/holdout/rubric/seed、finite objectives与反证 | **建议直接复用本地Optimize的强项，而非再导入CE副本** | 先明确不可变测量面和廉价degenerate gate；Guard不能替代任务正确性。只在已有scope授权内改实验目标；用“删测试/改评分器分更高”反例，不用得分上升自证改善 |
| 何时接受改善、独立确认 | CE Optimize完整协议、噪声与确认、多目标判定；本地同owner已有更强样本/source identity与holdout约束 | autoresearch已实现pending_verify优先于predicate met，未知3次阻断；classify只给词候选，LLM分类，保留正确分工 | **保留本地增强**；held-out缺能力时不假装独立验证。不要把“下一hop叫verify”当独立上下文/保留集事实 | 使用现有证据字段与consumer；不建第二decider。证据必须包含当时实际命令/来源/结果，不仅caller布尔值；验证pending、failed、unknown、伪predicate-success |
| 运行恢复和不丢测量 | CE `persistence.md` 每次measure→write→read-back，再作决策；marker恢复、每实验唯一entry、追加样本不吞旧pair、等待与wall deadline | autoresearch TSV/handoff/state已存在，round目录只到分钟，经典先commit再verify；没有CE的完整绑定/marker/receipt恢复。spec-optimize persistence已覆盖本地实验日志owner | **吸收最小可靠性不变量，避免复制CE的durable-store/remote tick框架** | 对classic留下candidate/base SHA、exact predicate、原始result与一次写入标识，恢复先核现有事实；使用真实可用宿主resume，不能宣称后台监控。并发/同分钟运行是否冲突需fixture，不要求统一新数据库 |
| 用户WIP与keep/discard提交 | CE Optimizeclean mutable/immutable scope；CE Work记录pre-work，canonical由owner整合 | autoresearch classic precondition只warn dirty，后面stage/commit和git revert HEAD；本地spec-commit明确独立commit与branch授权、owned paths、mixed-hunk/index保护 | **本地集成缺口，建议优先衔接既有commit owner** | classic必须固定run-owned candidate identity与可逆范围，不能revert当时碰巧的HEAD；缺commit授权用未提交隔离实验或阻断依赖动作。无须再加一套Git writer。本轮没有执行commit/revert，记录为源码合同风险而非实际误提交 |
| 子命令只读意图 | CE doc-review的review owner与mutation分开，本地doc-review默认report-only更明确 | autoresearch learn把check与init/update一起进入Generate/Update/Commit；--no-fix仅跳Phase4，Phase2仍写。它与“check(validate)”入口意图不一致 | **建议拆清check的产物与被审文档写边界** | check仅生成审查证据，不写被审docs、不commit；update/init在明确写授权内继续。测试pre/post docs/index字节与command recorder；未运行模型，不能声称已发生越权 |
| reason/predict中的多方判断 | CE review独立context与证据合并是辅助手段，不能由共识代替source fact；本地review/角色契约也相同 | reason默认固定三弱点、三候选、多数票；no-synthesis/debate跳AB却仍要求三候选和tie→AB；随机label却写AB=Z。learn wiki还按前50行样本生成页，不能宣称全源码已理解 | **保留作为advisory可选推理；修清候选集合/label映射和authority ceiling** | judge只排名真实存在候选，tie策略不能依赖位置；没有弱点可停止，不能强造缺陷。各子协议独立派发授权与live能力需沿本地边界；不因用户说reason自动外发/dispatch |
| 准备命令与执行授权 | CE measurement侧重可重复测量；本地spec-optimize更明确exact command/cwd/environment names/effects envelope | autoresearch screen-cmd是有限pattern筛查，validate-state只粗类型，不能证明命令无副作用/无注入；本地已强调advisory classification和ship不能autoapprove | **保留checker作窄拒绝层，不提升成sandbox/授权** | 将已授权命令边界、resume freshness和新效果增量交当前owner，不能每轮重复索权，也不能让allow产生权限。shell语法任意时不能承诺安全；反例用command recorder，勿真的执行危险命令 |
| 发布与回归门 | CE LFG/feedback持有caller-owned尾部；本地LFG/commit有更细独立授权和最终证据 | autoresearch ship也是内部8阶段协议，scorer会根据字段作机械STABLE；已复现HARD classification和visual词汇失配 | **先修字段合同误绿；随后复用本地既有发布owner** | 不把STABLE当push/deploy权威；required regression未跑必须保留not-run/blocked，不能用其他分数补偿。两项probe已证实scorer行为，不证明真实ship或生产影响 |
| 评测与证据 | CE Optimize明确run step必须实际发生、日志先落盘；review pack以actual tree与调用观测补prose | autoresearch3个judge只搜最终消息/整transcript中的marker，不验证顺序、zero execution或remote state；现有unit测试只证明helper规则 | **优先补outcome eval** | 记录首banner相对首工具事件、被拒predicate的zero subprocess、零外写、dirty/index保留。保持有授权发布的正例，不能把所有外写当失败。模型/真实host验证未执行 |

## 直接支持与范围收口

- `skills-governance.json`及其schema全文核对：autoresearch作为standalone canonical source被收编，manifest只能证明注册/投射意图，不证明子协议运行时已兑现上述边界。
- `scripts/check-ce-localization-review.cjs` 1498行全文核对：库存、source refs、hash和receipt范围校验是机械记录，不证明真实阅读、语义正确、独立persona或field收益。它对setup的若干confirmed行是构造的数据；本轮不借此替代setup源码审查，不刷新旧receipts。其setup/reconciliation内部实现由后续对应source owner核对；本项没有对这些底层功能作完成声明。
- commit owner已全读；Optimize双方入口、measurement、persistence全文核对。其他引用链不因本项完成而被全局记作完成。
- 本项候选来源新旧未做全Git历史归因，统一记录当前源码事实，不能宣称本次dirty变更新引入。`CONTEXT.md`在包内不存在；当前只发现该reference行，建议改成真实包内定义或去掉失效引用，不向runtime临时补文件。
- 独立validator未运行不阻止只读源码裁定落盘，但全部finding保留该限制；不提升merge-ready。此前AR-01/02的脚本复现与已有tests证据保留，未为凑数量重复运行。

最小顺序：先修AR-01/02和reason/check的协议自洽；衔接本地commit/mutation owner；补真实结果与恢复反例；再以真实任务判断轻量loop与Optimize的职责收益。无需引入CE全套remote engine、自动并行、临时store或再建研发总路由。本轮全部为建议，未实施。
