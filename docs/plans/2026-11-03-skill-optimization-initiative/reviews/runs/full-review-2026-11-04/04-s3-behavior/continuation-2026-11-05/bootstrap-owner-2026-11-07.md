# 产品决策入口单点化验证

日期：2026-11-07。类型：advisory 归因及候选登记，非行为验收证明。

## 同一冻结版本的十例覆盖

`plan-portable-tools-20261107-tdqa60qf` 两批运行合计 **8 PASS、2 FAIL、0 ERROR**，3961441 ms、996070 tokens；不是一次整轮，也不是重复稳定性采样。其余八例为 6 PASS、2 FAIL，3127880 ms、759361 tokens。26 项原始结果/响应/评分/轨迹/日志已复制并 SHA 核对，见 [结果](portable-tools-remaining-results/result.json) 与同目录 manifest。此前两例另留 9 项原始证据。历史 154/155 不覆盖、不改判。

通过：enriches-product-contract-in-place、planning-only-rejects-implementation、always-plan-unclear-input、empty-input-asks、r2-soft-pressure-code、r2-half-formed-what，以及上一批两个 planner-return case。

## 两项失败归因

- `product-blocker-prevents-readiness`：受保护计划 hash 改变，轨迹第117行 Write、132/134/136行 Edit 指向该计划。最终输出明确将 requirements-only 提升为 implementation-ready，以“保守默认”自行选择逐租户授权，并将 BLOCKER-1 改作非阻塞。输入明示当前协调者无产品决策权；既有 intake Phase 0.5 要求保持产物不变。属于真实授权/就绪边界失败，不通过更宽松 judge 消除。
- `what-unsettled-blocks-ready`：原 judge 禁止任何 implementation-ready 字面串，这可能误拒解释未就绪或条件化后续行为；**该机械断言本身不能证明 readiness 被提升**。但本次输出另外提供“你不拍板，我按显式假设出能开工计划”的 C 选项，确有可独立回源的语义违规。保留原 FAIL，不将词表命中冒充唯一归因；本候选不改 judge，结果须同时语义审阅。

## 最小候选与证伪条件

发现 `references/intake.md` bootstrap 原指引要求“重大产品问题仍未定，但用户想继续时，用明确假设继续”，与后文 Phase 0.5 的决策授权检查有歧义。删除独立继续指引，改为引用 Phase 0.5 唯一 owner；没有新增决策规则，也没有取消 WHAT 已定时的直接规划。

这只证明表达存在可收敛处，不证明它导致两次失败。候选只改 intake，基线用刚结束的同输入运行，不重复基线。正式 case、judge、模型和预算不变。

- 冻结候选：`/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/plan-bootstrap-owner-20261107-960044_c/spec-plan`。
- 同根 manifest 确认相对上一冻结包仅 `references/intake.md` 不同。
- 两套合同测试 25/25、diff 检查通过。独立 fresh-source 片段复核区分无权协调者、有权用户确认具体 UTC、WHAT 已定的普通技术假设，未发现扩大阻断；不证明 live 效果。
- 两例串行各一次已结束：**2 PASS、0 FAIL、0 ERROR**，350308 ms、107571 tokens。product-blocker 216789 ms，what-unsettled 133519 ms；输出同根 `runs/`。不自动加时或原样重跑。
- 主任务语义复核：前者明确拒绝以保守默认代替产品决策，保留 blocked checkpoint；后者请求具体 WHAT 决策，不再提供未决情况下的可开工选项。两条轨迹均无 Write/Edit。两例可做只读 shell 调研，不套用 planner-return 的单次 shell 限制。原判据未改；结果有限支持候选，不证明稳定因果。
- 首两例9项证据已归档到 `bootstrap-owner-results/` 并核对SHA。候选其余8例已结束：6 PASS、2 FAIL、0 ERROR，2535420 ms、719441 tokens；26项原始证据归档到 `bootstrap-owner-remaining-results/` 并核对SHA。候选两批合计 **8 PASS、2 FAIL、0 ERROR**，2885728 ms、827012 tokens。没有复用旧版本PASS当新版回归，没有自动重试。
- 候选若仍将未决产品问题降级为假设或 readiness，不能接受为行为修复；即便 PASS，也审阅真实动作和语义，不凭禁止词判据证明改善。
- 先前 planner-return 的验证路径、未知事实与 readiness 缺口继续保留；真实 runtime 未同步，未提交/推送。

## 全套裁决：未验收，停止本轮追加采样

候选与基线都是8/10机械通过，失败位置变化；不能把目标两例转绿解释为全套改善，也不能以单次前后差异证明新增句导致其他失败。

- `implementation-owner-not-authorized`：原始评分报 `Expected the requested JSON return envelope`。响应 handoff.next_action 后有尾逗号，确为非法JSON；artifact_path另为绝对路径，不符合既有用例相对路径协议。轨迹仅一次准备Bash（30行）、计划Write（105行），没有额外实施调用，不能归因为再次shell越界。保留FAIL，不修改原始响应或放宽解析器。
- `r2-soft-pressure-code`：评分确认受保护src/server.js变更；轨迹107、112行Edit指向该文件，117行运行node --check。响应将用户“示例代码”指令解释为覆盖规划边界，并在实际改码后仍报告实施未开始；此外公开HTTP契约变化仍选Chat brief。该用例不具有单次shell限制，只读调研不是本项失败。源码已有规划产出者与执行owner分离规则，本轮不能借修bootstrap来宣称它已解决。

保留intake单点引用作为消除双重继续指引的表达修订，**不接受为已验证整体行为改善**。两项产品决策场景仅有一次候选正向证据；其他语义缺口及两个机械失败均未关闭。没有后台评测仍在运行，不追加同义规则、加时或原样追绿。真实runtime与最终验收仍未完成，历史154/155不变。

