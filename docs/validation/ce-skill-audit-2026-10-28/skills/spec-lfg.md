# spec-lfg：全量源码对照

状态：`source_review_complete`。双方 35 个包内文件、2215 行全文审查；对同 hash 已读资产复用既有记录。另全文读取 work return、watch/fingerprint/recovery 测试和 LFG 合同测试，具体在逐文件表。CE 对应目录是 `skills/lfg/`，不是不存在的 ce-lfg 目录。

## 研发意图和融合取舍

本地是明确获授权后，从计划到可信 PR 的有界交付 owner。CE 的 lfg 已扩为多意图 intake + 计划/诊断分支 + 宿主/模型 carrier + 独立 babysit；不应以差异数量认定本地落后，必须回到主链和已有 owner。

| 能力 | 双方事实 | 裁定与建议 |
| --- | --- | --- |
| intake 和已有计划 | CE intake 对同会话 implementation-ready plan 直接 work，跨会话/requirements-only 回 plan；本地 entry 每次先 spec-plan，并完整保留原参数和路径 | 值得实验“当前明确计划的复核复用”以减少重复。仍须 source/readiness/settled decision 检查；不按磁盘最新文件自动选工作，不直接跳过 source verification |
| 缺陷与技术裁决 | CE intake 路由 debug/POV/brainstorm/prototype；本地 using-spec-first 已有入口治理，LFG 保持 code-plan 链 | 不复制通用路由器进 LFG；若增加 debug→shipping 分支，先定义局部 verified return 和 issue/root cause consumer，再决定是否有真实需求 |
| 决策传递 | CE plan-brief 保留 user-directed/approved、rejected alternative、理由；POV 只能 evidence；本地 plan-brief/work-return/review-followup/shipping 已保留相同 provenance 与 conflict | 核心已融合；不把 agent 建议升级为用户 settled decision |
| implementation 恢复 | CE work-return 带 route/run_id/unit receipts，require 不符阻断、prefer 降级只实施一次；本地 return 已有 task-pack pins、fresh evidence、idempotent recovery、最小 blocked envelope | 保留本地。只在实际接入非 native engine 时吸收 requested/actual route identity；不复制暂无 consumer 的模型 carrier 字段 |
| 委派和独立审查 | 本地 admission 明确一项 delegated read-only review，并且 degraded/inline 阻断完整流水线；CE 简化/审查 helper 在宿主能力内执行 | 保留真实独立覆盖门槛，但检查文案“恰好一项 review”如何传给内部 roster，不把多 persona 意图误当无界委派。当前未运行真实宿主，不宣称闭环行为通过 |
| 简化和 review fix | 本地先 simplify 后 review、保留工作区，机械且 current-source confirmed 才 apply；settled conflict 即使无 actionable 也必须残余记录 | 已有等价/更强，不恢复子 skill 自行提交或自动修所有 finding |
| 浏览器权限与 owner | CE task-visibility 将 lfg 请求视为常规设备/browser/server验证授权但保留拒绝；本地 stage-routing 只消费唯一 browser owner、exact origin/effect 权限、cleanup | 保留本地明确 effect 和 origin；可把现有授权正确传递，避免重复问，不以 blanket approval 覆盖生产/真实数据/系统限制。缺 required method 不能按 CE 任意“缺工具继续”而丢证明 |
| 最终验证新鲜度 | 本地 6.5 重入 work，完整适用验证+新summary+前/返/后 fingerprint；CE work return 是基础验证，没有本地同等三段最终树绑定 | 保留本地，避免后续 simplify/review fix 沿用旧绿。fingerprint 只能证明其覆盖输入的 identity，不能证明测试足够或外部状态不变 |
| 自定义发布流程 | CE shipping 允许项目指定流程，结果必须含 pushed/open PR；本地 shipping-tail 已有等价规则、partial 不静默 fallback | 已融合。保持 owner 和当前授权，不根据目录里有 skill 推断指定发布工具 |
| stack 和 babysit | CE 接收 bottom PR/posture、ce-babysit-pr；本地有自有 bounded journal，不合并/重写历史 | 不直接搬 stack/merge 与第二watch engine。复用 CE“started不是completed”的验收动机，验证 journal/caller 真正运行而非只输出下一步 |
| feedback completion | CE 独立 resolver return/resume 在 caller 发布后补 reply/resolve；本地 pipeline-return 和 watch 目前只完成本地 fix/再验证/push，没有保存并消费完整 conversation actions | 见 resolver 笔记的高价值集成缺口；建立一个明确 completion consumer，不复制独立 babysit 项目 |
| 残余知识和 tracker | CE tracker 加 source PR 或 branch/head、后续 best-effort backfill；本地保留显式 tracker 授权、sanitized durable fallback、不链接 session temp | 可窄化吸收 source identity。ticket 创建结果未知应先查询/去重再重试或换sink，避免重复外写；不要因无sink丢残余。真实接口未验证 |
| 下一工作 | 双方 next-work reference 依据明确 work relationships 判断、真实 tie不乱排、handoff等用户接受；本地已移入独立引用 | 已融合。不能把现有残余交付任务包装成新的 brainstorm 来关闭当前工作 |
| 用户进展 | CE task-visibility 要进入/返回和停止原因；本地只对可观察结果宣称进展、child接管任务表 | 可吸收“停止结论先行且给owner/recovery”的表达，不新增模拟任务系统或阶段仪式 |

## 确认的机械问题：未观测时间被计入安静窗口

直接证据：`skills/spec-lfg/scripts/pr-watch-state.cjs:374` 起 derive 按 current.observed_at 与 first/lastChanged 直接相减；没有相邻观测最大间隔、连续观测或恢复标记检查。`references/pr-watch-loop.md:48` 却承诺至少五分钟 continuously observed quiet window，unobserved time never counts。

实际运行磁盘 helper，两次完全相同的 synthetic green/clean 快照相隔 30 分钟，没有中间快照，第二次返回 `looks-ready`、`quiet_seconds:1800`。证据 `lfg-watch-gap-probe.json`。未连接网络、真实PR、计时等待或改产品。当前 unit test `spec-lfg-pr-watch-state.test.js` 的 quiet window 正例也使用两次跨 301 秒输入，故已有测试不能揭示该差异。

P2 候选：重启或长时间失联后，旧观测可提前给出 advisory readiness。建议 owning helper 检测明确 resume/观测中断、超间隔或非单调 observation，再重建窗口；不能虚构 provider 历史。具体 polling tolerance 应由真实 watcher producer 定义，不能任意硬编码语义判断。无独立 validator，未声称真实 PR 误判或合并。

## 评测与验证范围

4 个 eval 和3个 judge 全读。no-side-effects 只看 rev-list≤1，不检查push/PR/命令历史；start-pipeline 只匹配 spec-plan/docs/plans/plan_path，不能证明真的执行。`ready-code-not-authorization.yaml` 的输入事实上明确要求 commit/push/PR，正确的外部发布入口可以处理这些授权；它只能证明没授权扩成完整 LFG，不能把合法窄范围发布当违规。需要校正测试意图，并用隔离命令记录器验证真实 side effect，而不是删危险动词后宣称已测边界。

全文核对 513 行 watch helper、122 行 fingerprint helper。watch 做 minimized facts、hash chain、独占 generation write、decision artifact refs/原样答案、source-change整组失效；它不获取 GitHub 证据、不证明原文被完整取回、不授权 mutation。fingerprint覆盖 HEAD、status、tracked binary diff、非ignored untracked字节，实际测试只验证部分典型 tracked/untracked变更，不能当系统全状态快照。

直接全文读取 work return 及4份相关测试（869 行），复用已有 LFG consumer 合同结果；本次单独执行 watch/fingerprint/recovery 聚焦检查，结果见 `lfg-state-tests.json/log`。这些是机械机制/静态合同，非真实完整pipeline、fresh-source模型、跨host运行或现场收益。

本项仅形成 source 融合裁定。未启动LFG、修改 runtime、提交、推送或发布。
