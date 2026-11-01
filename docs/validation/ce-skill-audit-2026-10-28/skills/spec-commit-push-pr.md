# spec-commit-push-pr ↔ ce-commit-push-pr 能力融合审查

状态：`source_review_complete`。双方全部 24 个包内文本文件（1653 行）全文审读，直接提交接口、LFG caller/watch 合同、CE prose 与 babysit 入口和相关测试已核对。该状态只覆盖本项源码能力裁定；全局跨 Skill 闭环与真实宿主收益未验证。不是融合实施、merge-ready 或发布验收。

## 意图与边界

双方均把已完成的研发变更转换为可审阅 PR，并支持只生成或更新描述。本地刻意将它降为 internal helper，提交、landing、归档和 LFG watch 分开 ownership；CE 是用户入口，另含 opt-in PR stack、默认 babysit 与独立 prose helper。不能以功能数量判断本地退化。

本地事实以 `skills/spec-commit-push-pr/`、直接调用合同和测试为准，CE 以其对应 source 为准。只写本审查产物，不改任何被审 source、runtime、Git index 或远端。脚本提供 hash/文件范围/隔离 judge 返回码；下表为 LLM 语义裁定。

## 研发能力对照

下列路径为各自仓库相对路径，完整路径与读取范围见逐文件表。

| 场景 / 能力 | CE 事实 | 本地事实与实际差距 | 融合裁定与最小建议 | 成本与验证 |
| --- | --- | --- | --- | --- |
| 遵守项目 PR 模板 | `ce-commit-push-pr/references/pr-description-writing.md:16–18` 查项目指令、常见模板位置与引用的 contribution guidance，区分最小模板和 exact-only 模板；结构优先于默认文风 | 本地 `pr-description-writing.md:237` 仅提 style；325–345 固定 body 顺序和 footer，未要求发现模板。不能由“匹配 repo style”推导已消费必填 heading/checklist | **建议集成，高优先级。** 在现有 Pre-A/compose 读项目 PR-body contract；按允许结构写结果、证据、来源，不新增模板解析器或中央 schema | 只增加有界 source 发现和明确优先级。用“要求固定章节”“禁止额外章节”“允许扩展”三种 fixture，核对 required fields、额外 teaching/footer 是否被抑制；真实 host 未跑 |
| tracker 关联与关闭语义 | CE 写作 107–134 收集已有引用，区分 closing/non-closing/uncertain，重写保留，未知语义用中性关联；GitHub closing 要目标 default branch 且真正解决 | 本地 300–308 只有编号与 focus 规则，未明确保留已有 `Related:`/`Fixes`，也没有 closing-vs-link 规则。保留 contributor credit 不能替代 issue provenance | **建议集成，高优先级。** 吸收 close-vs-link 和重写保留，优先项目 tracker 约定；不要照搬强制英文标签、裸 `#123` 或全面读取每个 commit message | PR body 的 magic word 有真实副作用。验证部分修复不误关、已有引用不丢失、跨仓库 ref、未知 tracker 和 default/non-default target。只用已知上下文，必要时查相关 fuller message |
| 保留规划中已确定决策的来源 | CE 写作 171 仅在已有带 `session-settled:` 的 plan 时写静态来源句，不猎取 plan | 本地 LFG `shipping-tail.md:40` 已传 plan 与 proceeded-under-flag 冲突，但 helper 写作未显式消费这些标签/来源；不能推断所有 plan 都有 CE 标签 | **建议窄化集成。** 消费 caller 已传的本地 settled decision/provenance 及限制；不引入另一套 `session-settled` schema，不把来源当仍待处理 backlog | 成本为现有 handoff 的消费规则；验证 user-directed 与 agent-inferred 不互换、无 plan 不扫描、冲突不伪称用户批准。与 plan/work 正式审查后统一字段 |
| 全范围、价值优先的描述 | CE 写作 62–103、161–169、201–214 使用完整 commit+最终 diff 的 scope map、program placement 与 outcome umbrella；压缩但保留决策证据 | 本地写作 107–120、191–229、349–374 已具备相同方法；更详细不等于收益更大 | **已有等价实现。** 不重复接入完整 CE 写作流程，也不为压缩盲删本地证据规则 | 源码可确认覆盖；实际阅读成本与文案质量需任务对照，不能由行数判断 |
| 文字清晰、保留精确技术含义 | CE 写作 14 调用 `ce-noslop`；其入口 9–13、33–45 保护事实、代码、引用、标识符，patterns 5 有 false-positive floor、非英文只用通用测试 | 本地写作 235–258 已有 plain/active/no-filler，项目语言规则优先；未独立引入 generic prose Skill | **保留本地设计；吸收事实和标识符保护即可。** 不为 PR 文风新增跨 workflow 必选依赖。非英文不硬套英文词表，不把技术机制改成无信息的收益口号 | 无需默认第二 pass。可用包含错误文本、阈值、路径、负面结果的文案验证不丢事实；效果未实测 |
| 跨平台命令与失败状态 | CE `context.md:6` 要求各 probe argv 独立，其他 recipe 仍含 POSIX shell；本地 context 3–6 与 apply 62–79 更明确 native temp/body write、独立调用、远端读回 | 本地 branch-creation 19–24、74 及写作 58–82 仍有 Bash 变量/重定向/复合命令，与 context 的 portable 要求未完全统一；CE 自身也有此矛盾 | **保留本地增强并统一其 recipe。** 不复制 CE 复合 shell。必要时由明确解释器运行固定脚本，不将任意 PR 文本插值进 shell | 针对特殊字符、PowerShell/缺 upstream、unknown PR 运行参数级测试；本轮未验证 Windows 或真实 gh |
| 新鲜 base、现存 PR、push 边界 | CE context 29 在无法解析 base 时 fallback main；branch-creation 39–47 fetch 失败直接 local HEAD；apply 64–79 只传 body file 不远端读回 | 本地 context 37–58 不猜 base，区分 unborn/unknown；branch 51–67 捕获恢复基线且 checkout `--no-overwrite-ignore`；apply 75–80 读回并在未知写结果先查询 | **本地已有更强实现，保留。** 不导入 CE fallback 或通过 URL/exit0 推断完整成功 | 既有 context/scope tests 已执行通过，只证明合同/fixture。branch 59 的“Step 4.2”已无对应小节，为低影响陈旧引用，建议顺手修文档时处理 |
| 保护提交范围和作者 | CE commit 7–20 whole-file/exclude/U-ID/trailers；本地 commit 8–41 显式保护 mixed-hunk 和作者真实来源 | 已有等价或更强；不把 changed paths 当 owner，也不把 `squashMergeAllowed` 当实际 squash 约定（本地写作205比CE177更严） | **保留本地设计。** 统一由现有提交 owner 承担，不新增第二提交机制 | 直接复用已读 scope/context tests；不重复运行无变化 source |
| PR stack | CE stack-submit 20–51 解析 parent tip、恢复 branch、保护 exclude、构建最小线性可审阅层；53–81 gate submit/草稿/归档/merge | 本地 apply 90–93 明确不拥有 stack；LFG shipping 42 已把 stack/merge/history rewrite 独立判权。没有可确认的本地 stack consumer 需求 | **暂缓集成。** 将“按实际依赖划分可独立审阅层”作为 plan/task 的设计参考，不引入 `gh stack`、posture 或 PR 拓扑管理 | 触发重估：有真实多 PR 交付需求、明确 owner、可用 CLI 与收益证据。CE 的 parent topology/恢复成本显著，不是缺几个文件即可融合 |
| babysit 与完成责任 | CE apply 27–60、babysit入口 9–31,54–60 持有自动 follow-on、预算、typed decision 与 stack posture；声明 readiness 非 merge authority | 本地 LFG shipping 55–63 和 pr-watch-loop 全文已有 bounded head/base/review/CI/decision 流；helper 仅 return `watch_handoff`，不独立启动 watch | **保留本地 owner 边界。** 不导入默认 babysit 产品面；“外写成功不等于整体完成”原则本地已有。不能声称两方 watch 内部全等：本项只核对 callee 接口，watch 源码归 LFG 项 | 没有新增生命周期需求则不 build。跨 Skill 总审再查 handoff 字段/终态，不以当前入口阅读证明整个 CE babysit 已审完 |
| teaching、归档、branding | 双方 teaching 从 base 判断 novelty、最多2个；CE config cascade/docs_root/default branding-off；本地 compose20–39 与 apply28–58 分离 archive authority、本地 config 合同、真实发布 blob 与 plain footer | teaching 已等价，归档本地更有界；本地写作334 固定加品牌 footer，缺少 CE 的 opt-in/preserve-only 细分；模板 exact-only 时尤其不应强加 | **保留本地 config/路径/无外链图片；建议吸收 branding 明确意图和已有内容保留。** 不导入 CE badge、model slug、config cascade 或 docs_root | 优先让项目 body contract 决定是否可加 footer；是否默认显示 plain footer 为产品选择，暂无收益证据。验证 no-op rewrite、不新增/移除已有品牌、archive 未授权零写 |
| 评测证明真实边界 | CE 本包无 eval；不能声称它有本项更强 judge。本地2 cases+2 judge，description judge只查commit count，landing judge只查关键词 | 隔离探针确认 staged README 仍 exit0；“push 已成功，PR 已创建”也 exit0。no-landing case描述允许本地commit，入口却说full path须先双授权，职责意图需统一 | **建议增强本地结果导向 eval。** 复用 commit 项的 pre/post index/HEAD/remote-call receipts；明确 commit-only 请求路由 commit helper，非双授权情况下不隐式跑 full landing | 检查实际 scope、index/tree、remote refs与gh调用，不靠输出关键词；以fake gh/local bare repo测试即可，无需外网。探针不是host eval，缺独立validator，问题保持 unresolved |

## 建议顺序与限制

先吸收项目 PR-body contract 与 tracker close/link 语义，同时补能观察实际状态的 eval；再统一 portable recipe、caller 决策来源消费和 branding 的项目优先规则。保留本地的双授权、mixed-hunk、索引恢复、远端读回和 LFG owner。暂不建设 stack/babysit/新 prose coordinator。

本项引用直接 consumer 的输入输出合同，不递归将整个 LFG、CE babysit 或所有测试依赖文件冒充本项已审完。它们各自的实现、共享机械状态与跨 Skill 闭环仍在对应审查项或最终全局检查中核对。双方包内资产无抽查：新增 CE-only stack 两文件也已全文审读并明确处置。

运行证据：`landing-judge-probes.json`，仅临时 fixture；既有 `targeted-tests.json` 中 context/scope 两 suite 的结果复用，未重跑；pipeline/low-findings测试本次全文读但未运行。未做真实 gh、PR、push、宿主模型、独立fresh-source或field outcome验证。结论不外推运行收益，问题未获独立validator，`validation_status: unresolved`。
