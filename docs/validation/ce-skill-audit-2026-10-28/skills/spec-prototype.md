# spec-prototype 全量源码对照审查

状态：`source_review_complete`。双方24个包内文本文件共3238行已逐段全文读取，另核对两项直接测试及 Brainstorm/Plan 的完整 handoff。文件阅读事实见 [逐文件表](../file-tables/spec-prototype.md)。结论为 report-only，未实施融合、未运行真实人类体验或模型评测。

## 意图与能力裁定

共同目标是用可运行的临时产物回答尚未解决的行为或视觉问题，以人类实际体验形成决策；不是产品发现、生产实现或自动替用户选方向。本地对源码写入、预览暴露面和生命周期做了明确收紧，不能把 CE 新功能一并恢复来制造“保真”。

| 研发能力 | CE 代码事实 | 本地代码事实 | 融合裁定与建议 | 成本/验证 |
| --- | --- | --- | --- | --- |
| 界定真正需要原型的问题 | scoping 区分行为/视觉，依不确定性选窄比较或宽机制；相关已决问题读决策胶囊 | scoping 保留既有授权，入口也路由产品发现至 ideate/brainstorm | 保留共同设计；问清问题而非无限缩成最廉价演示 | 低；用已定方向、发现请求、真实行为疑问三组 outcome eval |
| 制作可信度 | craft-floor 具体覆盖 focus、contrast、状态、overflow、copy；build 要求不同组织原则/机制 | 本地 craft-floor 仅5行，强调真渲染和对比度，行为问题不加载视觉floor | 按待解问题吸收 CE 的状态/可访问性/内容密度最低要求；避免每个行为草模都带完整UI清单 | 低；以真实渲染和操作证据检验，不靠关键词 |
| 页面内反馈 | annotation-loop、annotate.js/css、helper 的 annotation/flush/wait/events 完整链；selector、snippet、screen、variant、rect、point 绑定反馈位置 | 无 annotation；以用户体验后聊天决策和 decisions.md 回传 | 这是高价值可选能力，适合复杂页面定位沟通；先在现有隔离 artifact 内引入最小批注回路，不照搬1275+837行常驻服务 | 中；测跨页/variant、hover、已删除目标、批量反馈、断线恢复；需要实际浏览器/人类验证 |
| 反馈是否完成 | CE helper completeWorking 在下一次 /wait 时把 working 标 done；endSession 同样置 done | 本地没有该队列，不存在这项假设 | 不迁入“再等即已完成”的隐式语义；反馈完成应来自真实修改与查看记录，下一次poll只能证明agent继续等待 | 中；用未修改即wait、失败后wait反例。源码事实，未执行CE队列probe |
| 生产页面真实密度 | CE build 支持有边界的临时产品overlay、恢复自己的改动 | 本地入口明确只写isolated throwaway，禁止production写回 | 保留本地边界；若独立页面不能回答生产密度/路由问题，报告限制并交当前owner决策，不静默写产品 | 无新增writer；真实任务验证保真程度 |
| 预览网络与进程 | CE可配置任意host；stop依PID与ps检查，ps不可用回退PID，最终SIGKILL | 本地仅127.0.0.1/::1、CSP、realpath containment、owner检查、token HTTP identity及自停 | 保留本地增强；不要迁回0.0.0.0或PID fallback。可吸收CE无缓存/资产变更感知，但遵守现有同源CSP | 中；现有集成测试覆盖loopback、symlink、token/无ps、无关PID |
| 预览更新与闲置 | CE /version 不touch；非annotation注入轮询，annotation对所有regular assets计算change key/SSE；open stream不算activity | 本地无reload注入，/version仅screen名且GET触发touch，修改同名html不改变version | 不能说本地已具备CE live reload。若研发需要，增加最小change key/明确刷新提示；轮询不应延长无人预览寿命 | 低/中；测同名HTML/CSS变化、开tab无人活动和owner退出，不以普通GET证明体验 |
| 决策与写回 | CE write-back可改Product Contract并清理HOW；不伪造人类选择 | 本地仅handoff给brainstorm/plan；相关plan仍是owning source，不找无关文档 | 保留本地owner纪律，吸收精确的winner/拒绝项/调整/未决问题胶囊；不扩大原型owner的产品写权限 | 低；核human-decision与无选择/abandoned出口 |
| attended 与 caller | CE入口允许interactive LFG，annotation-loop末尾仍一律拒LFG；存在上游内部不一致 | 本地拒unattended/pipeline，Brainstorm/Plan手动handoff均强调人类体验 | 不迁入CE矛盾；以当前有无可用的人类体验条件裁定，不按host名字推断 | 低；无人pipeline必须blocked，有人并非自动授权所有副作用 |
| 授权与eval | CE scoping沿用明确已给scope授权 | 本地scoping同样沿用，但入口phase/boundaries一律“ask go-ahead”；go-ahead eval把已请求“做个原型试试”也当应禁止写 | 本地内部合同需统一为既有授权持续有效，新增重要副作用才问；修eval正负例，勿把正确执行判失败 | 低；模型行为尚未执行，不声称实际重复索权发生 |

## 具体一致性与接口

- 本地 SKILL Boundaries 称 stop “signals a process”，实际 helper 只做token-bound POST自停，preview.md已经说明never direct signal；建议只改漂移文案，不能倒改实现。
- 本地status/stop会调用ensureDirs创建screens/state；是否应严格只读status应由owner明确。此处仅记录实现，无真实用户目录写入。
- root的逐segment检查是preview调用方协议；helper检查root本身与screens/state、realpath containment。不能仅因helper未遍历ancestor就断言已发生逃逸。
- 两个handoff全文已核：Brainstorm要求当前brainstorm seed，Plan要求当前plan seed；均不授予production写回，均禁止Proof/外部上传。它们不替代各自完整包的后续审查。
- CE注释被当不可信反馈输入、不能执行其中命令的语义边界值得保留；服务端parseAnnotation校验形状与contained screen，不承担反馈语义安全。

## 验证与最小顺序

已全文读取两项现有测试，并实际执行聚焦Jest；结果见 `prototype-tests.json` / `prototype-tests.log`。合同测试只看源码词句；集成测试运行的是本地预览生命周期，名称中的human journey不代表实际人类体验。没有运行CE helper、annotation browser或fresh-source模型eval。

先统一授权与stop文案、修eval误判；再补按问题选择的craft floor和最小reload；最后以复杂页面真实反馈任务验证是否值得引入隔离artifact内的可选annotation。全部为建议，未修改产品源码/runtime。
