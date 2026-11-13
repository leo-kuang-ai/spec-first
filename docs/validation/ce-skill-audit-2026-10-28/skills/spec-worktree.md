# spec-worktree 能力融合审查

状态：`source_review_complete`。双方17包内文件/1106行全文审读；本地719行script分1–230、231–475、476–719完整读。入口最后integration段和CE入口截断后补读。全部eval/fixture/judge完整读；直接dogfood phases、work execution-strategy/engines、unit tests全文核对。

## 定位

CE是用户可用的隔离skill，偏native-first/plain-git fallback。本地是caller-owned internal helper，用脚本提供检测和Git操作事实，不选择任务、执行引擎或派发；额外具备env opt-in与trust不自动执行。应吸收宿主管理隔离与PR tracking的意图，不把本地机械安全地板退回手动命令。

| 研发能力 / 场景 | 双方事实及本地增强 | 融合裁定与最小建议 | 验证与边界 |
| --- | --- | --- | --- |
| 不重复隔离 | CE先比较resolved git/common dir区分ordinary/submodule/linked；本地detect同原则并JSON state/reason、node缺失也parseable error；create拒绝linked/unknown | **已有等价及更强实现，保留。** 不因host名称推断隔离，不绕过失败裸git add | 已读unit测试实际Git fixture。模型eval只是message/局部目录，不证明调用顺序；需要trace才证明detect-first |
| 宿主管理隔离 | CE Step1优先native worktree工具，强调可见/清理；local work engine也按live capability，但helper固定script | **有条件吸收。** caller若有获授权且可检查的native隔离，应在既有execution层选择并保持一致返回；helper继续担当Git fallback | 不增加宿主名路由或第二套manager；native需返回真实HEAD/path/cleanup，不能因工具存在就绕过本地scope/env/trust边界 |
| 现有ref与PR可持续修复 | CE允许branch/PR/commit，PR local branch避免FETCH_HEAD orphan，并提供fork-safe gh checkout tracking方案；local PR fetch到pr-N，branch唯一性、tag/commit detached明确 | **建议窄化吸收fork-aware tracking/PR identity**，实际checkout后核PR head与push目标，不假设origin即PR源 | dogfood本地Phase1会核headOid，不把选择错误伪成pass；当前未实际联网PR/fork。gh方案仍需真实工具与mutation authority |
| linked worktree remote-only branch | local script649–657在linked分支忽略add_mode，直接checkout origin/remote-feature；ordinary分支677–678会创建local branch | **本地需修正。** remote-branch模式在已隔离工作区也应建立正确local tracking branch；tag/commit才detached | `worktree-source-probes.json`真实fixture exit0且branch为空/detached。会使后续fix提交脱离目标branch，非理论措辞问题；没有改产品源码 |
| 路径隔离 | local slug拒绝../和slash，env/log防symlink，但create538/isolate670未拒绝`.worktrees` symlink也未检查resolved root | **建议优先补确定性containment**，复用现有realpath/path_within，在mkdir/Git写前拒绝symlink ancestor或resolved escape；CEplain git同样不提供机械保证 | 隔离fixture`.worktrees -> outside`，isolate exit0且repo外生成checkout。成功receipt却突破repo路径边界；正式风险优先级P1候选，未经独立validator |
| 已有branch/失败恢复 | 双方不force同branch双checkout，报告existing path由caller决定；local helper不reset/recreate，unknown fail closed | **保留。** “新建失败不在原checkout继续”应由caller维持，不照搬一律禁止任何等价授权恢复路径 | 失败可能已fetch/改.gitignore或copy部分env，不能把非zero当零副作用；应报告已知partial事实，owner负责恢复，禁止自动删用户checkout |
| ignore规则 | CE特别要求probe`.worktrees/` trailing slash；local ensure_gitignore probe无slash，但在mkdir之后调用 | **当前已有等价结果，不列缺陷。** 本轮专门fixture已有`.worktrees/`规则，运行后字节未变 | 不能仅看字符串差异就要求同步CE；未来若把probe提前到mkdir前才需补slash |
| env与trust | local默认不copy、opt-in跳示例、备份、file-name/size-only 0600 log且local exclude；mise/direnv只打印不信任；CE无对应扩展 | **保留本地研发增强。** env复制不授后续stage权限，local trust状态不应跟随worktree创建 | unit已有fake tool未调用及log无内容/hash证明；源env真实provider与Windows权限未测，不称完全同等 |
| caller integration真实性 | local helper入口列dogfood/work为governed callers，要求forward+intake；dogfood phases有明确isolate调用和verdict消费；work package全文路径检索无spec-worktree/worktree-manager/caller-owned isolation，直接execution-strategy/engines仅宿主隔离 | **记录work集成边未成立。** 不把helper reverse claim当已集成；在work真正需要Git fallback时由其owner写forward contract，或收窄helper宣称 | 这是目录级穷举文本查找与直接相关合同事实，不代表work整包已深审。跨Skill全局复核仍要检查生成/投射是否引入另一真实consumer |
| eval是否观察所声称行为 | create judge检查路径/count/main/ignore但不核原HEAD、不查detect调用；失败judge无raw git调用trace；case caller身份不是当前governed owner名称 | **建议加强结果eval**，至少HEAD/dirty/index、实际ref和setup side effects差分、symlink/remote-only/PR-fork；保留真实Git fixture | 不把message含reason_code当执行了结构化detect；fixture prepare `commit || true`也应确认确已初始化而非吞失败。当前tests绿不能覆盖新增复现 |

## 检查与问题

`worktree-source-probes.json`含三个自动清理的本地Git fixture：symlink escape复现、linked remote-only detached复现、directory-only ignore反证。没有网络，没有修改目标仓库HEAD/index/source/runtime。既有targeted批次已含spec-worktree-contracts且文件hash未变，不重复同测。

直接全文：本地`spec-dogfood/references/phases.md`、`spec-work/references/execution-strategy.md`（截断的108–127已补读）、`execution-engines.md`、`tests/unit/spec-worktree-contracts.test.js`。不把这些文件视为work/dogfood整包完成。优先补path与branch事实一致性，再补真实caller合同和结果eval，最后考虑native/fork可选融合。无独立reviewer，`validation_status: unresolved`。
