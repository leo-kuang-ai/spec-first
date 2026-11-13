# 下一阶段自主收尾与新缺陷修复

类型：advisory。当前 Codex owner 执行；原始失败、宿主工具事件、源码哈希、最终文件、准入和检查结果见 [结构化证据](autonomous-closeout.json)。本报告记录本轮选定范围，不将其升级为整个战略的全量验收。

## 交付结果

- S5：补测已有后继复用、后继冲突、旧任务包、只读审查、已完成检查和最新 CLI help 消费。发现机械修改被误当作证据收尾豁免，在 `skills/spec-work/SKILL.md` 的入口澄清 summary → honest-closeout → owning lifecycle 顺序；非行为免测只说明原因和替代验证，不豁免可运行的指纹或证据收尾。
- S4 本仓维护：新安装断言暴露真实的共享指令清理遗漏。在 `clean.js` 修复当前共享目录被误判为其他无状态宿主残留的问题，保留损坏状态、独立残留、其他已安装宿主及用户文本的保护。该任务经历独立审查发现覆盖缺口、真实安装失败、6 个失败回归、源码修复、50 项 ownership 检查和八宿主安装复验，属于真实跨模块维护闭环；不是三组提效对照。
- OPT-10：完成单个既有条件加载点的隔离消融，4 次独立 A/A 加 4 次 A/B，保留现有条件加载，不推广整套 Skill 重构。
- OPT-11：旧经验在本轮不同任务中回源并改变验证选择，发现并修复了实际遗漏；另记录跨模型经验不适用的拒绝案例。仅确认该次复用结果，不声称长期提效或批量知识晋升。
- X1：完成有界只读来源核查，未修改个人安装或主仓 generated runtime。
- CI 维护：回源检查 PR #55 的 Windows Node 20/22 失败日志，确认 8.3 短路径与长路径字符串比较导致 receipt/containment 断言不一致；修复 `host-authority.cjs` 后相关路径、workspace graph、child hook 与 git exclude 单测共 203 项通过。该项属于主仓维护验证，不是三组提效实验。

## 宿主行为

共 13 次旅程调用，其中 2 次超时原样保留。CLI 进程正常退出、任务完成和权限覆盖分别判断，不汇总成一个“全通过率”。Claude 为宿主报告 GLM-5.3；Codex 的 gpt-6-astra 标识仍只有配置/宿主证据。

| 场景 | 实际结果 | 限制 |
| --- | --- | --- |
| 冲突后继 | 指出两个 active 后继目标互斥；零文件改动，检查失败如实报告 | 单个 Claude 合成样本 |
| 只读审查、已有完成检查 | 修改前后各一轮；均零新增/修改文件，分别报告未完成和无需新任务 | 不代表完整只读权限隔离测试 |
| 最新 help | 新 Claude 会话读取两个 help 后直接完成 summary 和 verified closeout | 没有复现旧的 schedulable 字段冲突；不据一次时长声称性能收益 |
| 已有后继复用 | 首轮白名单摩擦后超时；第二轮实现完成但跳过证据、提前完成状态，作为失败保留并辅助补证 | 不把后补证据倒填为首轮合规 |
| 修复后后继复用 | Claude 和 Codex 新会话均复用同一后继，真实检查通过，先 summary/closeout，再完成后继；旧计划与保护文件不变 | 日志部分为已观察输出的模型转录；Claude 使用过 `/tmp` 临时输入，未证明严格 fixture confinement |
| 旧任务包接续 | 实际校验拒绝 non-active source；由 plan owner 创建后继、审阅并重新 intake，修复后验证通过；超时后恢复完成收尾 | 首轮 300 秒超时，恢复另 63.7 秒；不是无辅助一次通过 |

父执行 owner 另行复跑各 verifier 并核对最终字节。早期夹具换行写法已按实际文件字节复核，结果确为 `64 6f 6e 65 0a`，没有以转义显示的差异撤销有效旧证据。实际网络隔离、所有临时写入和服务器模型身份均未获独立证明。

## 消融与处置

冻结对象为 `spec-plan` Phase 1.5 的一个现有条件读取点：baseline 保留条件加载，candidate 仅将读取该 reference 改为无条件。阶段正文和 reference 从当前 source 物化，按需从磁盘读取；没有给模型预注入 reference 全文。使用同一 GLM-5.3 宿主配置、只读工具和 development CLI 场景，逐次独立会话运行。该实验不属于原上下文 pilot 的重写或推广，不替代其投资门、全量受保护场景和 holdout。

| 度量 | 结果 |
| --- | --- |
| A/A | 四次独立调用，两对最大相对噪声 2.22%；admit 与 allow-ab 均通过 |
| A/B baseline 总 tokens 均值 | 13,164.5 |
| A/B 无条件读取总 tokens 均值 | 18,145，较 baseline 增加 37.8% |
| 实际读取 | baseline 均未读冷 reference；candidate 两次均读取 |
| 质量 | 八份结果均回源、保留默认/错误边界，无写入或虚构测试通过；由当前 owner 内联裁决 |

tokens 为宿主 usage 的 input、output、cache-read、cache-creation 合计，不从字节估算。保留 ab1-baseline 拼错路径后重试的成本；没有删掉该样本。每个 A/B 臂只有两次、单 development 场景、无盲评 holdout，因此不作统计显著性或普遍收益声明。处置为保留现有条件加载，不新增默认规则，不据此实施原 pilot 的整体迁移。

## 知识复用与失效

消费 [Skill prose 测试覆盖经验](../../../solutions/workflow-issues/skill-prose-rewrite-contract-test-coverage-2026-06-28.md) 前，回读当前 `spec-work-contracts.test.js` 与 `spec-plan-contracts.test.js`：它们仍以字符串断言保护入口，不能证明后继复用与收尾实际行为。没有直接套用旧 1.12.x 文件位置，而是重新定位本轮 1.15.3 source。

这条经验改变了本轮操作：没有以已有绿色合同关闭 S5，而是执行真实旅程，发现“跳过独立审查被扩大为跳过证据”的失败，再修 source 并复测两宿主。这是来自旧 `spec-debug` 任务的知识在另一项 `spec-work` 维护中的有效使用。结果由实际工具顺序和保护文件核验支持，接受主体为当前受委托执行 owner，不伪造人工验收。不能量化这次回源节省了多少时间或证明长期收益。

失效拒绝案例：回读 [旧简化门测结论](../../../solutions/skill-simplification-patterns.md) 的 Sonnet 5、特定 fixture 和 invalidation conditions 后，拒绝把“该批次零额外指导已饱和”外推为 GLM-5.3 或未认证 Astra 下全部指令都可删除。当前模型、任务和机制不同，因此保留旧结论的历史范围，并执行上述新准入消融。没有改写旧结果、把历史模型身份当当前事实，或为凑知识条目实施批量 promotion。

## 安装修复与验证

安装验证新增各宿主 proof 移除、最后共享消费者的 Skill 移除和 instruction 受管区清理检查。首次 multihost 在 111 项通过后被 MH11 拒绝；修复后的相同安装阶段 112 项通过，摘要为 passed。上一批 132 项是 `all` 阶段，两者分母不同，不能合并为一次全量运行。

`clean.js` 现在只把其他宿主独有的 runtime root 当作缺 state 时的残留线索；当前清理宿主也使用的共享目录不再单独证明其他宿主存在。真实 state 存在、损坏、platform mismatch 的分支不变。6 个新增回归先失败后通过，独立残留保护正例保持通过，完整 ownership suite 为 50 项通过；另有本轮 7 suites / 88 项聚焦回归。Windows 兼容性修复另有 79 项路径/宿主单测和 124 项 workspace graph 单测通过。源码与消费者由新会话静态复核，确定性检查与模型观察分别留证。

后续确定性验证：`npm run typecheck` 257 项通过；smoke 5 项通过；integration 13 suites / 68 项通过，2 项 Graphify 按默认运行条件显式跳过（此前独立验证通过，不混为本次执行）。最终 clean 修复经新会话只读源码审查，无新增实质问题；静态审查不能替代上述实际测试。

## 仍受外部条件约束的范围

- S2/S3：需要可核实的 GPT-6 Astra 服务端身份，才能补目标模型基线、比较准入与受保护行为；GLM 结果不能替代。
- S4：更广业务类别、完整三组可比收益与真实使用接受，需要新的真实任务及相应数据/项目范围。当前维护任务和合成旅程不能冒充外部试点；旧 S4 重复评分 A/A 的限制保留。
- OPT-10/11：本次最小消融和一次复用已完成；跨模型推广、未暴露 holdout、多任务长期收益仍无证据，不因“机制已有”自动宣称实现价值。
- X1：个人 `leo-ppt-generator` 链接到独立 `knowledge/leo-skills` source；两份 HyperFrames 路径的来源不同，当前标准官方 cache 路径不存在。发现目录不能证明实际 loader 生效或重复加载，不能据此删镜像。全局 CLI 为 1.15.2、主仓为 1.15.3；本轮使用 source CLI/隔离安装，没有擅改全局版本。需要具体原始维护范围及安装方式后才能继续外部写入。
- S5.1/3/5 的其他候选继续按原触发条件暂缓；不为“全量”新增没有实测瓶颈支持的功能。

## 2026-09-09 本地 runtime 刷新与回归

以当前 canonical source 执行 `node bin/spec-first.js init --claude --codex --cursor --kiro --qoder --opencode --zcode --pi -y --no-sync-user-language`，8/8 宿主生成 ready。受管投射按各宿主合同完成，source/runtime 对照、`init` lifecycle 和 projection contract tests 通过；宿主特定投射允许内容改写，不以跨宿主逐字 SHA-256 作为判据。逐宿主 `doctor --json` 确认没有 source/runtime drift；Claude、Codex、Kiro、ZCode、Pi 的 runtime asset health 为 pass，Cursor、Qoder、OpenCode 的 warn 仅来自已知 loader/hook preview 限制。Doctor 仍报告宿主能力边界：Cursor/OpenCode loader 未验证，Qoder authenticated hook/shared IDE loader 未验证，Codex 等非 Claude setup facts 需从对应宿主刷新，workflow execution evidence 缺失时保持 simulated/not-verified。这些告警不被折叠为整体通过。机读回执见 [`runtime-refresh-20260909.json`](./runtime-refresh-20260909.json)。

当前 source 的确定性回归全部通过：`npm run typecheck`（257 files）、`npm run test:unit`（206 suites/2503 tests）、`npm run test:smoke`（5 tests）、`npm run test:integration`（13 suites/68 tests；默认环境跳过 1 suite/2 tests）、`npm run lint:skill-entrypoints`（401 files）、`npm run build`（`npm pack --dry-run`）和 `git diff --check`。本记录只证明 source、projection 和本地测试链当前可复核；不提升 Astra 行为、真实现场收益、远程 Windows CI 或 X1 仓外安装的 claim。

本轮不提交、推送、发布或改个人安装。全部已确认且属于本仓授权范围的具体缺陷持续修复并验证；外部证据由用户人工后续处理，方案状态保持 `partially-shipped`。
