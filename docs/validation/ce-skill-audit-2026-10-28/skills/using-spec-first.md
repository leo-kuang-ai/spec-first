# using-spec-first 能力融合审查

状态：`source_review_complete`。本地全部11个包内文件/356行全文审读。CE无直接同名或等价入口，不伪造一对一映射；相邻路由事实来自CE brainstorm/ideate/debug入口、LFG stage-routing和CE仓库authoring边界。相邻Skill完整包仍归其各自主表项，本项只核对路由接口。

## 研发定位

本地入口只选择一个owner，已进入workflow或worker后不重启路由，不产生workflow state；轻量问答留Direct Lane。CE各Skill自行收窄触发条件，LFG另有模型/harness的stage carrier。两者解决的问题不同：workflow选择不等于执行引擎选择，入口统一不等于中心化编排。

| 研发能力 / 场景 | 双方源码事实 | 融合裁定与最小建议 | 验证、成本及边界 |
| --- | --- | --- | --- |
| WHAT/HOW/发散/判断分开 | 本地`references/public-route-map.md:7–17,53–64`区分ideate/brainstorm/prd/plan/work/pov/debug/lfg；CE `ce-ideate/SKILL.md:12–23`、`ce-brainstorm/SKILL.md:9–21`有相同语义意图，CE还在callee内允许轻量直接回答 | **本地已有等价的能力路由；保留。** 不将CE的“ideate永远先brainstorm”抬为所有请求硬路径，需求已明确时继续由当前owner承接 | 本地route test检查所有公开record均出现并隐藏internal；不证明选择语义实际正确。手写数量不作为合同，以registry实际枚举为准 |
| 活跃owner连续性与执行授权 | 本地source入口20,30,40–42明确不重路由、只在根因越界时显式移交、执行请求不再推荐等待；CE brainstorm入口21 caller-return无菜单，LFG stage-routing45–49保留caller return/recovery | **保留本地增强。** 吸收CE“明确返回caller而非重启菜单”的原则已基本具备，不新增状态机 | source text和11项contract通过；真实host未测。入口28的user-invoked-only推荐句须与40的明确执行例外一致解释，用户已点名时不能再制造第二次激活审批 |
| 路由指令与产品需求分离 | CE `lfg/references/stage-routing.md:9–37`按语义区分显式模型/harness stage assignment与产品内容，carrier不进入plan/review产品input；prefer/require与未知映射有明确边界 | 本地入口选择workflow而非模型，不拥有该carrier。**建议原则性复用到LFG/work相应owner，暂不集成到入口。** 此处仅保留“路由本身不授权、不改需求” | 不照搬固定模型/harness名单、外部引擎执行或CE配置；LFG/work全量核对后决定是否已有更强机制。本项不据一个routing文件宣称CE执行引擎已审完 |
| 轻量按需上下文 | CE AGENTS100–116,243–245区分authoring/runtime、不默认建立repo profile、机制留owning layer；CE brainstorm15–17有轻量chat路径。本地入口18–26/48按需读route map和boundary，context-governance65–75已避免普通任务重读root instructions | **已有等价或更强实现，保留。** 不为所有请求强制读全部合同、图或新profile；当前全量审查是用户明确例外，不代表日常执行模式 | 没有token/行为收益实验，不能由5680 bytes或文档拆分证明效果。当前入口单源原则值得保持，不新增中央router |
| 自包含runtime引用 | CE AGENTS223–241要求包内引用自包含，237指出转换独立复制；本地conditional references7,31,50直接指向项目`docs/contracts/...`，另有本地inline摘要 | **建议全局核对投射解析，候选待验证。** 在其他项目安装时不能假设存在spec-first源码docs；复用generator的现有support投射或把最小必需边界留包内，保持一个canonical owner | 本项已完整读三份直接docs和worker合同；未审完generator相关实现，不将此候选写成已证实runtime断链。不得用复制整套docs或手改mirror解决 |
| 外部候选与授权边界 | 本地conditional7–31,37–51及project-graph合同33–72明确graph advisory、空结果无negative authority、直接source合法；source/runtime、parent target、knowledge/handoff和dispatch边界明示 | **保留本地增强。** CE AGENTS147按capability而非缺某CLI判断能力，与本地live-schema/advisory思想一致；不因为一个provider缺失阻断普通研发 | 当前未dispatch、未运行graph。worker静态schema/permission不等于当前会话能力。本项只读callee边界，不声称检验所有host的hard gate |
| 决策来源与上下文新鲜度 | source与`.agents/skills/using-spec-first/SKILL.md`字节不相等，runtime缺source30/40/42中的部分连续执行规则；baseline和全ledger当前hash均未漂移 | **source-first诊断已落实；runtime修复属后续授权范围。** 不把初始安装副本当当前source，也不归因于本轮变更 | `entry-source-runtime-comparison.json`保存双方hash与语义布尔；只证明此文件对差异，不声称全部runtime stale。未运行init，原dirty内容受保护 |
| 路由评测 | 本地6cases含失败优先、轻量问答、单推荐等，rule多只含目标词；r2 judge8–9仅匹配问题词而不计问题数 | **建议增强。** 三问输入真实exit0，不能证明最多一问；同时加入已明确执行不得停在推荐、活跃owner遇失败不重路由、引用中bug文字不误路由、缺可选工具仍继续的行为场景 | `entry-judge-probe.json`只证明judge返回码。已有case的must_not/expect字段是否全被runner执行未在此证明，不能凭case文字算覆盖。需fresh-source eval，未执行 |

## 覆盖和验证

source完整11文件均有逐文件hash；CE相邻3入口、LFG carrier和AGENTS全文读，CE debug复用之前同hash全文记录。CE AGENTS是其仓库authoring规则，不冒充安装到用户项目的runtime governor。没有读取4个用户排除项的Skill资产；共享governance中的名称/入口记录只作本项菜单接口。

直接完整读本地governance JSON/schema、governance README、adapter index、project-graph/context-governance、worker-dispatch合同和入口测试；不把adapter index的导入路径当8个host实现均已检查。其他合同的目录索引链接不展开为本项承担所有产品实现审查，真正的source/runtime consumers仍由全局闭环检查负责。

实际执行`using-spec-first-contracts.test.js`：11 tests/1 suite通过，日志仅有advisory footprint warning；它不是语义routing评测。初见测试断言与已加载runtime不一致的假设已排除：source包含被断言规则，测试没有因此漂移。三问judge探针exit0。没有改source/runtime/index，无独立reviewer、host运行或field outcome。

先增强结果导向routing eval及安装后引用解析检查；保留单一owner和按需读取；不引入CE模型carrier或重复的公共入口系统。当前source结论不等于完美融合，能力收益与跨Skill整体闭环未完成。问题未经独立validator，`validation_status: unresolved`。
