# spec-write-tasks：派生执行索引与 CE 相邻任务能力审查

状态：`source_review_complete`。本地 23 个包内文本资产共 1726 行逐段全文审读；CE 无直接对应项，完整核对 CE plan/work/doc-review 入口及 work 的 intake、任务导出、workspace、调度与 implementation-loop 接口。另核对本地 task-pack CLI、直接 helper、work/doc-review 消费接口与对应测试。逐文件 hash/范围见文件表；其他三个 CE Skill 的全包审查仍各自计数，不由本项代替。

这是源码融合裁定，不是实现、独立评审、真实宿主/模型或研发收益验证。本轮只写审查资产。

## 研发定位与双方能力

本地把复杂计划压缩为可选、可重建的执行索引；原计划仍拥有范围、架构、验收、验证与生命周期。CE 在 `ce-work/references/work-intake.md` 直接从单位/依赖/Files/Verification 导出宿主 tracker tasks，没有额外的 task-pack producer、独立 identity 或 schema。两者意图相容，差异是本地增加了跨会话/跨 consumer 的可验证交接层，不能为了同步 CE 删除该层，也不能让该层取代计划。

路径均相对双方仓库根；完整源码路径见 ledger。

| 研发场景 | CE 源码事实 | 本地事实及增强 | 融合裁定 | 最小建议、代价与验证 |
| --- | --- | --- | --- | --- |
| 小变更直接做，复杂计划减上下文 | `ce-work/references/work-intake.md` 的 Trivial 只跳过任务清单，较大变更按单位导出 tracker；CE plan 有 Direct/Chat brief/Durable 三种输出 | 本地 `SKILL.md:8,83` 明确 optional derived layer，compile/skip 分开；work intake 第9节不因复杂就强制编译 | **保留本地设计；核心节约意图已具备** | 不新增默认派生步骤；真实复杂任务对照 context、返工、验证质量后再调编译建议。不能用文件数量阈值代替语义判断 |
| 从当前计划构造可执行任务 | CE `work-intake.md` 读取 Goal、U-ID、依赖、Files、Patterns、Execution note、Verification，避免私自拆成人类时间阶段 | 本地 schema/quality guide 要求 source anchor、具体 files、done_signal、stop_if、traceability、vertical slices，并可把大 U-ID fan-out；machine JSON 唯一可执行来源 | **本地更明确，保留；可吸收“结果命名+稳定ID”和不按人时截断** | 作为 task subject/context 的轻量指南；不增加强制字段，不按五词硬计数。验收用真实任务可启动性、覆盖和反馈周期，不看填栏数 |
| 证明优先的执行方向不在压缩时丢失 | CE `execution-strategy.md` 的 bounded unit packet 明确传 `Execution note`、相关验证和反向 Governs R 的 settled Key Decisions；`implementation-loop.md:30` 按自然语言解释 proof/characterization/replacement intent | 本地 quality guide Assurance Trace Preservation 已通过 requirement_refs/test_focus/done_signal/risk_note/review_focus 投射 required proof；work 重新读取 KTD 与当前 source plan | **大部分已有；建议窄化补齐反向产品决策引用与 Execution note 的保真检查** | 使用现有 context_refs、test_focus、risk_note；不复制完整计划、不新增并列 schema。用“关键决定只在 Governs R 反向链接中”“无逐字 TDD 词但明确 characterization”反例验证 |
| 计划新鲜度与执行资格 | CE 从当前内容充分性判断，显式 supersession 可跟随 canonical；不把旧 readiness label 当执行权威 | 本地 task-pack.js 完整去 frontmatter 后 canonical body hash；source path+body hash 为identity；spec_id只兼容trace；生命周期独立校验。work intake 第2/5节额外重放 implementation-ready/code 元数据 | **保留本地更强的分层** | 不改为全文件 hash，不让 status 更新导致无意义重编译；继续独立检查 lifecycle/readiness。status-only、body-only、wrong-chain、root drift 都应有 consumer 行为反例 |
| 独立 task review 与再生成 owner | CE doc-review 无 task-pack 类别，review 帮作者改进原始计划；CE work final shipping review 属另一出口 | 本地 task-pack-review-lens 先真实CLI intake、再 source-plan fidelity/切分/依赖语义；report-only、JSON envelope、passed/blocked/incomplete 分开；任务包缺陷回 write-tasks，原计划缺决策回plan | **保留本地增强** | 不因“Review complete”升级执行资格，不让 reviewer patch derived mirror；用同一个 consumer outcome 接口，无第二审批数据库 |
| 波次并行是否真正独立 | CE `execution-strategy.md` 检查 shared types/API、迁移、lockfile、生成物和环境单例，实际产物再检查碰撞；隔离不等于语义独立，worker不拥有canonical commit | 本地 CLI 检查依赖先后、wave成员、具体files重叠；quality guide 与work semantic-fit明确它只是地板、需要语义独立判断 | **吸收具体反例，保留当前分工** | 用现有 risk_note/expected_side_effects/context_refs记录争用；不让脚本推断业务并行性、不导入CE默认强制parallel。验证文件互斥但共享schema/端口、side effect碰撞，以及不受影响兄弟任务仍可推进 |
| scope、artifact root 与 mutation repo | CE workspace 记录pre-work并隔离用户未提供WIP，task list来自plan | 本地明确 --repo 是artifact resolution而非mutation authority，target_repo须另核；task-pack不记进度、不扩大scope、review dispatch独立授权 | **保留本地设计** | 不导入CE每单位自动commit或dirty整文件包含问答；沿本地owner/mixed-hunk规范。由实际路径/任务diff验证，而非交接声明 |
| 外部验证和实际已完成状态 | CE `implementation-loop.md:6` 区分repo-derived与DNS/CMS等out-of-repo completion，不能按clean tree判外部已完成 | 本地 done_signal要求可观察，assurance保留未绑定intent限制，但编译指南尚可更明确提醒外部状态不能由文件/CLI green推断 | **建议集成轻量反例** | 写入done_signal/review_focus质量指南，实际执行仍归work；不为task-pack建立外部控制器。测试“代码已在仓库但控制台未配置”不误闭任务 |
| 结果评测 | CE执行合同要求实际树、主owner权威验证、worker观测不可重建不得伪造 | 本地4个模型case与JSON/output runner大多看词或source片段；runner能记录output/source hash但并不执行模型或裁定语义 | **优先吸收结果型评测方法** | 最小隔离repo recorder检查产物/源计划字节、调用、scope与CLI receipt；词命中只能作结构检查。小计划case只要求spec-work，拒remote只要repo等一个词，正反例必须补足 |

## 直接复现的确定性地板缺口

复现源码和结果：`task-pack-boundary-probe.cjs` / `task-pack-boundary-probe.json`。运行当前磁盘 `validateTaskPack`，自动清理临时目录；未执行任务、未改外部文件、无网络。以下是可重复的 validator 事实，未经独立 validator，不据此宣称真实宿主已越界。

1. **P2候选：任务文件 containment 仅为词法检查。** `src/cli/task-pack.js:804` 对 `files` 使用 path.resolve/isInsidePath，未像 source_plan 一样 realpath 校验，也未核查缺失目标的现存祖先。`linked/external.js` 和 `linked/new.js` 的父目录是指向 artifact-root 外的 symlink，均返回 `valid / deterministic_handoff: true`。任务文件本身和未来文件祖先都需核对；work 的语义/授权规则仍然存在，故这里证明的是“确定性资格错误”，不是实际越权写入。最小修复应复用 owning containment 语义，并明确 artifact root 与 target_repo 不同场景的路径解析，不复制另一套函数。
2. **P2候选：共享 runtime denylist 漏 OpenCode。** `src/cli/helpers/target-repo.js:10,32` 的目录集只到Qoder，`task-pack.js:792` 直接消费；`.opencode/skills/example/SKILL.md` 可返回deterministic true，而`.claude/...`对照被拒。本项目明确 `.opencode/skills/` 是generated runtime。建议修共享owner、核对getSupportedPlatforms及所有消费者，不能只在此Skill prose补一个例子；其他宿主待runtime-setup全审后统一裁定。
3. `.git/config` 也返回 valid。它是Git元数据而非普通产品文件；共享 `validateRepoRelativeField` 明确拒绝Git internals，而task-pack自有路径函数未沿用。建议与前两项在path-owner边界统一检查，避免又加一个分散denylist。这里未模拟损坏Git仓库。

## 合同与评测漂移

- `SKILL.md` Core Rule10 已要求 `source_plan_non_active`，但入口 Failure Modes、execution-handoff reason_code enum 和 failure-cases.json 尚未列入；实际CLI能返回该值。建议同步现有枚举/fixture，不改变真正生命周期规则。
- `evals/output/cases.jsonl` 是手写 `recorded_static_smoke`，两个成功示例使用 `task_pack_worthwhile`、`high_risk_review_gate`，不在当前允许reason_code集合；这是历史静态兼容材料，不能当当前模型正确输出。
- `semantic_posture_evidence` / `dispatch_authorization_evidence` 在 task schema 的quality fields与CLI允许字段中出现，但最终envelope示例没有明确承载键；CLI只查对象，不能验证其provenance内容。建议澄清run-level review outcome引用与task-level evidence用途，不新造sealed receipt、状态机或假hard gate。
- output runner `task_contract_no_generated_runtime_files` 另写3个prefix，较共享owner更窄；当前quality cases主要调用file_contains，不能由现有绿灯推导它覆盖所有运行路径。

## 最小落地顺序与验证边界

1. 先统一确定性路径owner：任务实际路径/祖先、Git internals、多宿主runtime；加能够抓住上述误绿的实际CLI反例。报告不是修复授权，本轮未实施。
2. 修reason_code/静态smoke和真实产物eval，再用现有字段无损保留proof/settled decision/external done intent。
3. 复杂计划真实任务对照后判断派生层成本；保留小任务skip、独立mutation授权与source-plan唯一authority。

实际执行：3 suites /33 tests通过，见 `task-pack-tests.json` / `.log`。其中task-pack-command是临时fixture实际CLI；另两组是prose/fixture contract检查。通过不覆盖新增symlink/runtime/Git边界反例，不证明模型任务切分质量。未执行模型、fresh-source独立reviewer、跨宿主真实投射、CE workflow、GitHub或外部系统。
