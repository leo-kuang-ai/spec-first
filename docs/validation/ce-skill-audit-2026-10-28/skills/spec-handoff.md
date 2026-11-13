# spec-handoff 能力融合审查

状态：`source_review_complete`。双方27包内文件/1343行完整逐段审读。CE create/resume首次合并输出截断后已分别完整补齐；本地writer1–190与191–380全文核对，全部eval/fixture/judge均读。直接consumer LFG next-work brief、双方handoff tests全文核对。

## 研发定位

跨会话保存可核验状态、决策来源、失败路径和下一步焦点，不是会话内自动handoff总线。CE提供灵活的continuity prose；本地在此基础上增加确定性writer、受管持久恢复、四字段证据和显式继续分支，符合script管事实、LLM管语义的边界。CE不是应恢复的规范。

| 研发能力 / 场景 | 双方源码事实 | 融合裁定与最小建议 | 验证与限制 |
| --- | --- | --- | --- |
| 精确恢复状态而非重做 | CE create Body按complete/partial/missing、abandoned approach、dependency、pointer解释why；local create/reference已有对应要求与事实/推断/用户决定归属 | **已有等价能力，保留。** 不复制整段session、code或日志，优先source路径及关键落点 | artifact存在只证明记录，不证明工程完成；语义充分性不由payload长度判断 |
| 已授权继续与注入隔离 | CE resume一律orientation后等待；local入口Explicit Source区分只读恢复与用户明确完成请求，核当前repo/HEAD/dirty/evidence后沿原owner继续 | **保留本地增强。** 当前明确继续不因换会话再要一次授权；source内“已批部署”不授新权限 | metadata/body不执行，需call trace测试嵌入commands和外部副作用。现有examples有正向继续但runner的4cases全不执行implementation分支 |
| immutable写入 | CE shell约定exclusive创建/小suffix、JSON-compatible YAML；local writer `writeArtifact`以wx/0600、目录0700、碰撞重试、JSON serialization、真实hash receipt实现 | **保留本地确定性地板。** 不退回LLM手写原子操作，不把CE“无脚本”authoring偏好当本地准则 | 已读并复用现有unit运行记录，测试实际temp writer；并发目录symlink替换不在现有测试覆盖内，不由此推全敌对FS安全 |
| 持久恢复与同repo多worktree | CE managed /tmp、root-commit namespace跨worktree；local repo内ignored `.spec-first/workflows/spec-handoff/<workspace-slug>`、机器本地限制和显式folder | **保留本地durable默认。** CE跨worktree查找的意图可作为可选显式source-dir使用，不复制另一个全局store/root-commit索引 | 不承诺换机器自动可见，不引入临时双root搜索。时间戳与topic命名差异无consumer破坏证据，不算缺陷 |
| 用户指定来源/目的地 | CE任意source/format，包括no-repo conversation，选定folder只discover；local入口允许URL/paste/显式local destination、不再额外managed copy | **核心等价。** 本地managed writer强制source_refs至少1个repo-relative引用，对无repo纯讨论不自然；建议明确此类使用user-selected destination或允许诚实缺省，不能捏造source path来过schema | 当前payload validation真实强制；这是通用continuity边缘场景，研发source任务优先级低。若扩schema需下游测试，不为了parity扩大当前产品 |
| 有界metadata发现 | CE限定64行/16KiB、不读未选body；local parser每字节读到boundary、O_NOFOLLOW/fstat一致、200entry cap、20候选上限、不递归、unindexed保留 | **本地已有更明确机械实现，保留。** score仅lexical；scan_truncated必须披露，0结果不作全局negative claim | unit用PRIVATE_BODY_SENTINEL跟踪真实读取并验证未读body。排序只在已扫200内，不保证全目录最新项；不可误称全量搜索 |
| 选择authority | 双方关键词发现后选source，显式不可达路径不能静默改搜索；local headless blocked而不auto-pick | **保留。** 多个候选确有来源歧义，用户选择不是重复执行审批；授权范围不能由最高score决定 | 没有独立模型验证；明确source由当前用户选定后不再受discovery格式/位置资格门禁 |
| 非实现类continuation | CE resume按research/pending decision/planning/implementation/debug/review真实原因建议，无对称菜单；local resume参考已有同样规则 | **已有等价能力。** 不默认把任何handoff都推work/debug；entry的继续分支应按“existing owner”解释而非关闭其他owner | 增加research/review明确继续场景防语义偏移，不增中心化workflow路由 |
| LFG下一领域 | 本地next-work-handoff全文：canonical plan明确separate future areas、实交付后重核、LFG选择且只在用户接受新scope后调用；handoff只materialize | **保留本地owner边界。** 不让handoff重排产品优先级或编辑completed plan；CE通用创建不能取代该consumer合同 | shipping-tail已读同hash；plan/work完整包仍归对应行。非active plan送原owner重验证是接口，不能假称整个plan lifecycle已审完 |
| eval可信度 | create judge查实际文件、frontmatter、hash与精确resume，readonly judges查fixture hash/目录/index；ordinary仅词表且expect排旧docs/handoffs；readonly HEAD断言允许存在1commit | **保留更强结果验证并补缺口。** ordinary应查真实受管路径；HEAD以pre/post相等而非绝对计数；有授权continue、metadata discovery、custom destination也应进入runner | 不由“resume文字正确”证明没外部动作；fixture hash与目录只能证明其观察范围，不能证明网络零调用。未运行完整模型eval |

## 直接证据和边界

全文读本地`tests/unit/spec-handoff-contracts.test.js`、LFG `references/next-work-handoff.md`、CE `tests/skills/ce-handoff-contract.test.ts`。本地tests除prose外实际写temp并验证metadata不读body、目录/文件mode、unsafe refs、symlink及200 cap；多host断言检查planned operations，没有运行真实宿主。既有consumer批次含本地handoff tests且source hash未变，不重复运行。CE测试亦是prose/authoring约定，不算实际resume。

本项不把test导入plugin或adapter index当整套generator已审；投射实现与跨Skill生命周期闭环仍由全局检查承担。未写实际handoff、未执行source中commands、未改runtime/source。最小顺序是补真实受管路径与HEAD差分eval，再验证明确continue分支和reader source freshness；不引入CE临时全局store或一律等待。未经独立validator，`validation_status: unresolved`。
