# S03 专用surface、证券overlay与大需求拆分补审

日期：2026-11-02。HEAD：`1aa272a606710407e69b22d0452a34cd9b0d1f8f`。源码事实为 confirmed，设计充分性为 advisory。继承上游审查，不是盲评。只读被审source；本次未执行模型、真实产品、宿主安装或法规核验。

**结论：此前App/Admin/Backend/H5、证券和large-index的相关语义覆盖缺口已补齐。** 各surface提供具体产品边界与异常方法，保持WHAT/HOW分工；行业示例有明确证据与辖区约束，大需求索引不取代子PRD的独立验收。未发现新的高置信P0/P1；不改变上游UP-S03-01/02及行为未验证结论。S03的设计判断可从generic/CLI/Mixed扩展到这些已读产品分支，不能据此宣称真实移动端/浏览器/后端或证券场景已通过。

## 选择、权威与消费者

`skills/spec-prd/SKILL.md` Template Trigger Map是唯一模板路由owner：每次产PRD读取generic，只选一个primary surface，真实Mixed才补secondary；用户确认拆分后才读large-index，有证券/交易信号才加载证券overlay。本次全读是审查覆盖，不是要求实际PRD运行全读全填。`prd-output-template.md`的Surface/Industry/Project-Local Overlay和Lightweight Split Topology保持machine section与source证据权威，模板不得预填ready receipt。

消费者仍为Plan；surface表格给产品行为、验收、发布/回退与未闭合问题，不能指定数据库schema、缓存、中间件、SDK或组件实现。所有候选缺口归一到canonical Outstanding Questions，未引入第二套审批状态或进度数据库。行业材料的外部角色/法规是证据来源，不自动授权联系他人；当前用户的产品决定也不证明外部法规事实本身正确。

## 逐目标映射

| 分支与必要能力 | 当前源码支持 | 合格产物与判断 |
|---|---|---|
| App：用户入口与生命周期完整，权限/敏感操作不只查happy path | `10-app.md`导航/返回、状态、输入确认、弱网/后台/系统回收、隐私、无障碍国际化、analytics、旧版与灰度 | 能说明用户从哪里进入、中断后看见什么、重复请求/拒绝权限/部分成功如何结束；产品指标不指定SDK。条件充分，不等于真实App交互验证 |
| Admin：角色与数据范围一致、批量和复核可恢复 | `20-admin.md`菜单/页面/按钮/数据权限分层，maker-checker、并发编辑、跨页选择、导出脱敏/期限/审计 | 权限矩阵可指导正负例，复核人能否相同与部分成功有产品决定；权限码与接口留Plan。条件充分，模板空表本身不证明决定已闭合 |
| Backend：状态/幂等/一致性/consumer和恢复定义在产品层 | `30-backend.md`终态与未知状态、必须一起成功/可部分成功、失败可见性、重复事件、历史数据、补偿及运营准备 | 不能只写“接口成功”；需明确超时后最终状态、重复处理影响、旧consumer和回退结果。条件充分，真实一致性实现与性能仍需Plan/Work验证 |
| H5/PC：浏览器导航、会话和公开可见性有正负边界 | `40-h5-pc.md`直接URL/刷新/回退/多tab/登录回跳、表单离开、响应式、公开页SEO与分享、URL敏感信息和缓存边界 | 结果应覆盖登录前后/重复提交/长文本与viewport，公开索引仅适用公开页；框架与header实现留Plan。条件充分，不声称真实浏览器兼容 |
| 大需求拆分：共享上下文不覆盖局部权威，整体结果仍有owner | `70-large-requirement-index.md`共享边界、child独立结果、跨child产品依赖、source-of-truth、整体验收；output-template split frontmatter | 每child有自身R/AE/scope/evidence/readiness；索引只导航及跨child验收，不是执行计划。不因parent完整而给未闭合child ready。条件充分 |
| 证券overlay：高代价遗漏被显式揭示，具体规则不得伪造 | `securities.md`C1–C20、订单/资金/公司行动、留存矩阵、跨境数据、监管报送、模拟真实隔离、账户盗用、辖区差异与source标签 | 适用项需当前项目/辖区/主体证据；行业例子、T+N、费用与留存年限不得直接当事实。不适用需理由。方法条件充分，不提供法律/合规有效性保证 |
| 术语一致性：deterministic字面事实与语义判断分离 | `check-glossary-drift.js`全文；readiness-lens:120消费advisory avoid hits | fenced示例被排除、ASCII alias整词边界、非ASCII字面匹配；返回alias/canonical/status/line。命中不自动判错，引用/讨论别名的noise由LLM处理；不修改glossary |

## 三类追加场景与反例

全部为静态推演，未执行行为。每个场景均以当前source的具体决策路径作结果，不将表格数量作为通过标准。

| 类型/分支 | 输入与约束 | 预期及结果判据 | 形式合规但不合格的反例 |
|---|---|---|---|
| 正常，App+H5 | 已有登录退款页，增加草稿；当前角色与金额规则已有source，支持手机和桌面 | 区分App后台恢复与Web刷新/多tab，列登录失效、重复提交、草稿恢复的可见结果；模板已有对应问法 | 两端共用一份“加载/空/错”表但未说明跨tab覆盖或后台恢复 |
| 缺失/冲突，Admin+Backend | 客服跨tenant批量退款；旧consumer把timeout当失败，但新实现可能已部分成功；只读审需求 | 明确权限范围、部分成功结果、重试和最终状态查询；未定WHAT进OQ，不补造幂等key/库 | 有“幂等”一词与漂亮权限表，但用户重复点击可重复退款或跨tenant泄露 |
| 恢复，大需求split | 一份证券开户需求分App/审核/后台子PRD，只有两个child ready且parent索引完整 | 保留共同约束和child trace，未闭合child不因parent放行；跨child验收包括审批结果和用户可见状态 | 只检parent存在即称整套可实施，或把任务文件依赖写成产品拆分理由 |
| 缺失/冲突，证券 | 输入把例子T+N当目标规则，未给市场/牌照/当期正式依据；还有模拟盘 | 明确示例非事实，记录辖区与证据缺口；模拟资金/真实资金隔离成为验收。具体数值不凭模型记忆确认 | 复制常见交收周期并填confirmed-source，或因有“模拟”标签就忽略真实数据副作用 |
| 恢复，术语 | glossary包含avoid别名，PRD在Evidence中引用该旧词；glossary无法读取 | readable时报告字面hit供语义判断，不删来源消声；无法读取时保留absent事实及限制，不能声称术语已验证 | 以exit0/空findings当全术语正确，或把为了记录旧词的引用误判为未闭合产品决定 |

## 工程与成本取舍

- 保留产品层面的幂等、并发、权限、回退、补偿和旧consumer约束；这些是可验证目标，不能因属于“专业常识”直接删。
- 所有surface通过generic及相同machine contract组合，避免再造一套schema或每端独立ready逻辑。证券20项只在已触发行业时判断适用性；本轮未验证其对小金融需求的实际token/询问成本，不以清单长直接定为过度治理。
- 大需求索引开头“不承载具体Requirements、Acceptance”与后面“整体验收”应结合“单模块留child、跨child结果留索引”解释，并非已确认冲突；不因同词出现就登记缺陷。
- 证券章节里的合规确认须按顶部“材料是source、问答在当前会话”解释，不是新增联系人的外发授权；仍不能把用户选择当作官方规则认证。
- glossary reader对读取失败统一报告absent、exit0，这是advisory能力上限，不是完整语义审计或完整错误分类。readiness明确expected noise要保留解释，不能删避用声明或引用来让脚本安静。本次无足够证据将其升级为核心能力阻断。

## 测试证据与不外推边界

完整读取 `tests/unit/spec-prd-template-assets.test.js`：前两项断言asset存在/关键heading、不得预填ready、路由集中；第三项只检查各宿主projection plan包含路径；第四项在临时项目执行init检查文件存在及删除后drift。它们验证packaging/结构，不能证明模板语义有效、当前用户确认、法规正确或真实宿主工作流质量。本路未运行该套测试，避免把source阅读审查变成无必要的runtime生成；先前exit-safety断言阅读记录仍见upstream。

S03其余checker算法采用已读授权/ready出口和完整exit-safety断言作有界证据，不声称全算法安全审计。项目本地overlay只能在具体项目材料存在时有界读取，本仓库无法枚举未来消费者私有内容，不构成待解析的当前引用。行业正式原文未在本路重新核验；本文件评价的是问题发现与证据纪律，未以示例法规为现行法律结论。

## 精确阅读清单

以下七个新增源码文件全文读取，证券overlay按1–185/186–364两段，无截断。既有generic/CLI/Mixed、入口及output/readiness refs共享 `resume-upstream-reading.json`，本次又定向核对Template Trigger Map、overlay语义与split合同。hash绑定完整字节，不把定向读取说成全文。

| 路径 | 范围 | SHA-256 |
|---|---|---|
| `skills/spec-prd/assets/templates/10-app.md` | 全文，88行 | `8abc5527f9ff59fcaa16813b2a75a484c60d5e2f41c4016db197d1c590f39a4e` |
| `skills/spec-prd/assets/templates/20-admin.md` | 全文，94行 | `2b4e27872cc445635775b12aa0d4f0899c99c3231d8a4e16a55611b1d43d6514` |
| `skills/spec-prd/assets/templates/30-backend.md` | 全文，95行 | `7cd552126b1554f66826d6349f792c014d957fea0cfc8bb8d1cdde0292e526b9` |
| `skills/spec-prd/assets/templates/40-h5-pc.md` | 全文，60行 | `a9e0dc77ed33df7694955c24296fe3e8a4664d1ade53eb0650ed28fe46f68fb8` |
| `skills/spec-prd/assets/templates/70-large-requirement-index.md` | 全文，64行 | `5c2d3caa2b3c1994cdf6fbec1db78ea932c092f3b99e123c302ed2f9d7df84b8` |
| `skills/spec-prd/assets/overlays/securities.md` | 全文，364行 | `46dedd31f549c47f67d5cf73ff4baf9098e308b1e0277ff5b81e7cd2ef619033` |
| `skills/spec-prd/scripts/check-glossary-drift.js` | 全文，159行 | `cd4f0da50c71eceb51ec2ff1760bf15b81b316811bf8f41570f7358618a7f7a4` |
| `tests/unit/spec-prd-template-assets.test.js` | 全文，159行 | `11a7cbfeb725dcb9e286ccb5b276306cd4f500e3034b6b1cfada90e66eb458bf` |
