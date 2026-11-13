# spec-test-xcode ↔ ce-test-xcode 能力融合审查

状态：`source_review_complete`。双方9个包内文件/268行全文审读，直接用户入口、setup/debug handoff和证据合同测试已核对。范围为 source 能力对照，未执行 Xcode、Simulator、XcodeBuildMCP 或模型，未取得独立审查。

## 意图与能力裁定

双方均为用户主动触发的 iOS Simulator 构建与交互验证入口，而非静态 Swift review、自动 shipping 或工具安装器。本地进一步规定 provider evidence、dirty fingerprint、最终树重采集与 URL effect authority，适合研发闭环；无需为了与 CE 文本一致删除这些增强。

| 研发能力 | CE 源码依据（相对 CE 仓库） | 本地源码事实（相对 spec-first） | 融合结论与建议 | 验证与代价 |
| --- | --- | --- | --- | --- |
| 真实 provider gate，缺依赖停止 | `skills/ce-test-xcode/references/setup-and-build.md:7–21` simulator-list能力成功后才发现/build；仅给安装指引不自行安装 | 本地setup7–9相同，补充 `spec-runtime-setup` handoff。直接检索setup包/registry无xcode定义；registry结构化检查也无该标识，不能承诺bare setup会配置XcodeBuildMCP | **已有等价实现；修窄handoff表达。** setup可诊断宿主，但针对XcodeBuildMCP仍须给外部手工接入步骤及成功probe；不把它无条件加进全部项目baseline | 最窄改进是准确next action，而非新增required provider。待runtime-setup全量审查核对其扩展边界；本项未审完setup内部实现 |
| 项目/构建产物/模拟器身份 | CE setup25–32从成功build结果保留app path、bundle ID及log handle，优先兼容已启动设备，iPhone15Pro只是偏好 | 本地setup13–22记录project/scheme/simulator及app path，但install/launch处“actual bundle ID”未明确来自何处；不固定机型更适合真实项目 | **窄化吸收bundle ID来源、兼容设备复用。** 从实际build artifact/provider返回取值，不猜包名；优先兼容已boot设备，不导入固定iPhone型号 | 用多scheme/不同bundle ID/已boot不兼容设备fixture检查选择与调用参数；只凭源码不证明provider API可用 |
| 从改动推导受测流，并观察结果 | CE test-and-report7–14明确从请求和changed surface导出关键screen/flow；任意模拟操作成功都不能证明效果 | 本地test7只说每个scoped screen，9已明确SwiftUI tap假成功，setup22也要求visibly running；一般交互的结果核对表述可更明确 | **建议集成。** 在现有范围内列关键flow和预期状态；所有操作后核对可见结果/log，不只对inline link加例外 | 无需新增测试runner。host评测可模拟tap返回成功但状态未变，期望保持Skip/Fail且不捏造导航；尚未执行 |
| Fail不能因选择继续而消失 | CE入口14–17及test28–45按证据派生PASS/FAIL/SKIP与总结果；修复经debug返回后重建重测 | 本地入口25–27、test13–21,38–40同样保留失败，source mismatch降PARTIAL，明确只有完成的passing retest可替换Fail | **已有等价或更强实现。** 不重复添加第二状态表，不照搬CE每次fix gate都等批准的协作策略；当前用户已有授权持续有效 | 当前2个contract tests通过，仅验证文本约束；没有模拟器或真实人类检查证据 |
| 避免链接测试产生越界网络/应用状态 | CE test18–24提供直接openurl fallback但无相同精细effect gate | 本地入口31拒绝file/data/javascript，external/custom scheme需精确authority；test9要求观察真实导航后才赋pass | **保留本地增强。** 不导入CE无条件openurl recipe；手工绕行也必须标明只验证目标行为，未证明原UI点击有效 | URL scheme与已授权scope用stub调用检查零执行/正确参数；不应以“已知URL”替代authority。当前未运行这类host测试 |
| 绑定最终source和证据消费者 | CE包有project/scheme/simulator，但无等价dirty fingerprint、最后动作后的source recapture | 本地入口21–27、report27–40给source-bound和claim ceiling，canonical command identity缺失时不塞进统一verification summary | **保留本地增强。** 不把provider探针、build成功或用户复述升为渲染/最终树证明 | 已全文读源码与contract tests；test只查marker，不证明指纹实际采集或消费链效果。全局consumer检查仍待完成 |
| run-owned资源清理 | CE test41只停本次log capture、保留预boot simulator | 本地test44相同且另核cleanup scope，不打断其他session | **等价且本地更有界。** 无需另建cleanup manager | 未来mock多capture handle验证不跨run；当前未执行provider |
| user-owned入口跨host策略 | CE `agents/openai.yaml`显式`allow_implicit_invocation:false`；双方frontmatter都disable-model-invocation | 本地source无同名metadata，依赖governance/projection，route-map61明确只用户主动 | **保留本地集中投射设计，最终检查生成契约。** 文件不对称不自动视为缺陷；不手写runtime metadata | `skill-flow-p2-closure-contracts.test.js`全文已读，但本轮未运行其跨host断言；不由frontmatter假定所有host已强制 |
| eval识别真的停止 | CE本包无eval；本地唯一case声称缺MCP停止，但judge只要求输出含XcodeBuildMCP，且prompt指向`.claude/skills/...`镜像 | 输出“XcodeBuildMCP构建成功”同样满足规则；无tool-call/后续build零调用断言。引用runtime会受缓存/投射漂移影响 | **建议增强结果导向eval与fresh source输入。** 保留多宿主实际tool名解析，stub缺能力/报错应记录零discovery/build，无真实运行不能PASS | 不另造provider实现；最小fixture记录调用trace。这里是规则级缺口，没有运行真实model或声称模型已越权 |

## 结论与限制

优先补“当前scope的测试流推导、所有操作后的结果观察、实际bundle ID来源”，并修窄setup handoff，补缺provider时零调用的eval。保留source绑定、URL effect、失败保留与caller-owned verification summary；不导入固定模拟器型号、自动安装、提交或PR尾部。

本项完整读双方包内所有资产；本地debug和CE debug/post-fix-handoff复用此前完整读取同hash记录，setup入口首次读取截断的85–300已分段补读。setup registry只做结构化查询，未将其登记全文已读，不能据此关闭runtime-setup项。目录外callee的完整实现由其独立Skill项负责，本项只裁定直接IO，不将callee全部递归视作已审。

`xcode-contract-tests.json/log`：实际运行2 tests，exit0，仅source contract。没有真实MCP/构建/屏幕/人工验证、独立fresh-source评测或收益实验。优化建议尚未实施，问题未经独立validator，`validation_status: unresolved`。
