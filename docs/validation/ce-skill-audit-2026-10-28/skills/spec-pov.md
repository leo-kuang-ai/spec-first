# spec-pov 全量源码审查

状态：源码对照完成；report-only。双方包内文本逐段全读，CPython bytecode 单独按生成二进制检查；逐文件和直接依赖见文件表与 hash 账。未执行真实 provider、独立模型或真实宿主评测。

## 意图与总体判断

本地定位是项目有据的外部技术采用裁决；CE 已扩为 adoption、document take、approach-set 三类。研发场景中，设计文档整体方向判断和已有方案比较值得有条件吸收，但不能把 spec-pov 扩成发散、逐条文档审查或万能决策入口。本地 peer/followup 已有后两类语义，入口/intake/method 仍主要是 adoption，属于集成未闭合，不能只改描述。

保留本地授权、source identity、dirty 来源、claim-scoped evidence、两类 grounding floor、Tier3 load-bearing 外部 claim 的独立来源核验及工程 owner 边界。当前 serving receipt 只有 degraded/unverified producer，正常 start 会 fail closed；不能宣称跨模型能力已经激活。

## 能力融合裁定

| 能力 | 双方源码依据 | 裁定、最小融合点与验证 |
| --- | --- | --- |
| 三类 subject | 双方 SKILL.md、invocation-and-subject、grounding、method；CE peer/followup 与本地同名资产 | 建议集成研发中的既定方案和文档方向判断；一次同步入口、intake、method、peer、eval 与调用方。adoption 保留内外双 floor；文档/方案仅在依赖外部 claim 时要求对应外部证据。不强迫打分；允许双方均可行。验证三类正例及 brainstorm/doc-review 退出反例。 |
| 行为保证与 owner | CE references/method.md:21、:23 | 建议集成：函数调用只证明调用发生，保证必须追 callee 实现/测试；每条新增建议找已有 owner，避免推荐另一套重复机制。用调用存在但 callee 不保证语义的仓库反例验证。 |
| 最小只读实验 | CE references/method.md:50 | 建议集成：Trial/非 gate Hold 可由几分钟实验解开时，输出具体可运行实验；不得把建议当作实施授权。 |
| 当前事实定向阅读 | CE references/grounding.md:33、本地 invocation/grounding/scout | 建议集成 bounded direct read 与合法 inline warm provenance；保留当前身份与新鲜度。父入口不能只认 scout 而否定已完成的 inline source read。搜索为空须限定路径、动态/生成/config owner，不能称全仓 verified absence。 |
| 交付与后续选择 | 双方 references/followup.md、report/intake 资产 | 建议以真实 consumer 组织输出，去掉重复 blocking 菜单。已授权 continuation 不重复确认；文档写作不授权发布，已连接工具不授权分享。 |
| 语义 peer 返回闭环 | CE references/pov-schema.json、cross-model-panel.md、scripts/cross-model-pov.sh | 有条件吸收 final:boolean、同 scope/route 剩余预算内一次 nonfinal retry、evidence delta、material dissent、固定 reconcile 上限、user one pass、每轮 source identity 核对、skeptic 不计 convergence、完整 payload 与 started-job recovery。final 仍是自报，不证明语义充分；不要整包搬入 596 行 panel 协议。 |
| provider independence | 本地 scripts/cross-model-pov.sh:159–165；CE 脚本末部 route metadata 与 routes tests | 保留本地真实 serving evidence gate。CE 根据 harness 品牌推 serving family，model_actual 未核实仍可能标 independence=true，不可吸收。prompt read patterns 与 CLI read-only flag 也不等于保密沙箱。 |
| remote/acpx 与 fallback | CE routes tests、cross-model 脚本与 panel | 暂缓自动模型发现、fallback、token 搬运、额外配置层。宿主 primitive 优先；没有向模型发送 prompt 不能证明 adapter 启动/认证零外发。任何 recovery 不绕过 admission。 |

## 确认的问题与影响

1. **worker 可绕过正常 admission。** `scripts/cross-model-pov.sh:141–144` 在所有 receipt 校验前接受 `__worker` 并调用 provider。隔离 fake codex 在无授权/serving receipt 时实际被调用，exit=0。外层正常 `start` 的 fail-closed 不能覆盖这个独立入口。先收敛 worker invocation 的不可绕过 scope/receipt/运行边界；以 stub 的零调用反例回归，不运行真实 provider。
2. **worker 的 JSON 校验弱于 schema。** `:129–137` 只校验部分类型；空 position/reasoning、evidence=[{}] 在探针中被接收。不把空字段/无结构证据算完成。直接 worker 也缺自身 bytecap/deadline，外层 runner 限制不覆盖绕过路径。
3. **正常 activation 的 dormant 路径错误。** `:173` 指向不存在的 `references/personas/agents/pov-peer.md`，实际是 `references/agents/pov-peer.md`。当前 start 更早被 serving gate 阻断，不能说这是当前用户正常调用的首个失败；未来激活必须一并修复并测试。
4. **judge 假阳性。** `evals/fixtures/scripts/check-r2-verdict-given.sh` 只查关键词；“尚无结论，没有证据”实际 exit=0。mini-ledger 无数据库事实不能强迫 Adopt/Reject，floor 不足应 Hold。design-question 只查 brainstorm 字样也不证明已退出或无越权。优先用结果/读证据/无副作用联合评测，保留原始 transcript。
5. **入口/研究能力条件自洽。** 三类 subject 半同步；warm provenance 不能只认 scout。external researcher 的“search 与 fetch 必需”和仅 neither 缺失才停不一致，应按 claim 的实际 required capability 及已给 URL 判定。scratch 写入须准确表述，不冒称绝对零写文件。

## 验证与落地顺序

`pov-probes.py` / `pov-probes.json` 保存可复现隔离探针：无 receipt worker 调用、弱 schema 接收、judge 假阳性和 dormant persona。未联网、未执行真实 provider，临时目录已清理。五个聚焦 Jest suites 的结果见 `pov-tests.json` / `.log`；仅证明合同测试直接覆盖的行为，不能推翻探针或证明 panel 可用。

顺序：先补 admission/worker/schema 和 dormant source 路径；再统一 subject/grounding/分享授权；然后窄化吸收行为 trace、owner 与实验建议；最后才以明确授权、真实 serving evidence 和真实研发任务验证可选 peer 闭环。当前未实施建议；无 fresh-source 独立模型评审或 field outcome。
