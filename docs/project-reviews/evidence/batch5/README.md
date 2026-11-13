# 第五批补证：已收口（四对有效 A/B）

日期：2026-11-02。目标只补 S06 有效实施与 S07 跨文件审查的两模型 A/B，不重跑既有饱和小 diff，不改变原验收条件。

**执行结果（2026-11-02 最终收口）**：22/24 次已批准调用完成 S06/S07 × 两模型四对有效配对、**各 n=2 重复**（r2 首轮 + r3 修复重跑 + r4 重复轮；另含 1 次 DNS 中止与 1 次判无效的污染样本）；一次 B 组环境污染样本判无效后以隐藏全局安装环境修复重跑。业务正确性与检出双组无差异且两轮稳定复现（饱和）；A 组成本约 3.0–6.6× 并多结构化证据出口；全批观测约 10.92M token 未达 12M 线。详见 [execution-ledger.md](execution-ledger.md)、[r3-pairs-record.md](r3-pairs-record.md)、[r4-pairs-record.md](r4-pairs-record.md)、[r2-work-glm-pair-invalid.md](r2-work-glm-pair-invalid.md)、[environment-contract-r2.md](environment-contract-r2.md)。

## 可审查内容

- [S06计划](work/implementation-plan.md)、[冻结判据](work/rubric.md)、[oracle校准](work/calibration.json)：新增发票取消，经领域、事务、审计、HTTP和既有消费者形成实施切片。原始实现不满足新验收，参考实现满足；漏审计、不幂等、允许取消已支付发票三个错误变体均被识别。
- [S07评测包](review/README.md)、[冻结判据](review/private/frozen-criteria.md)、[确定性复现](review/verification.json)：跨4文件，金额单位、租户去重隔离、失败后重试三缺陷，以及无缺陷格式化重构负对照。基线通过、候选三缺陷失败、负对照通过。
- [配置生成器](stage.py)调用现有 `skill-up 0.12.0`；[验证记录](staging-validation.json)中4份配置已通过。模型可见内容只含fixture、prompt与A组目标Skill；oracle和预期答案不进入fixture。
- machine-local staging：`/private/tmp/spec-first-review-batch5-20261102-v2`。丢失后用 `python3 docs/project-reviews/evidence/batch5/stage.py <新的临时目录>` 重建。每份fixture有真实初始提交；复制后的运行workspace仍须核验HEAD和dirty diff，不能仅凭源fixture有.git就判有效。

## 追加调用提案

沿用既有两服务组合：GLM-5.3 / Claude Code / `open.bigmodel.cn`；gpt-6-astra / Codex / `qianxing.pro`。只外发合成fixture和当前目标Skill，不外发真实业务数据、隐藏答案、凭证或其他项目内容。当前配置未声明模型覆盖，正式启动前须从隔离配置只核对非敏感模型/provider/effort，并绑定到运行记录；如果不是上述模型或目标endpoint，停止该组合。

上限 **24次主模型运行**：2个场景 × 2组 × 2模型 × 每组3次。每次最多50轮、1500秒，并行度1，禁止自动无限重试。先完成每个模型/场景的首对A/B，再检查实际加载、环境、oracle和轨迹；无效样本计入24次，不另开免费额度。必要修复后剩余额度不足则报告缺口。四个配置分别运行 `skill-up run <config> --iteration 3 --parallelism 1 --no-delete --output-dir <独立输出目录>`，由既有隔离wrapper承载，不能直接在真实用户home裸跑。

token诊断预算为累计12M：每次结束后检查并在达到时停止后续调用；该指标不构成provider实时计费硬上限，单次可能越过观测线。provider不返回可信价格，**无法承诺美元/人民币费用上限**，若需金额硬上限必须先用provider账户额度强制限制。耗时硬上限合计10小时（24×25分钟，不含本地检查），正常运行可提前结束。默认不追加付费judge，由当前主审按冻结判据核对独立业务结果和匿名输出。

用户在本提案后明确回复“ok”，已批准这24次以内的新增调用，授权记录见authorization.json。首个沙箱内尝试受DNS限制中止，保守计入运行上限；平台联网权限生效后在新隔离目录继续。真实模型输出、调用量、加载轨迹、时间与结果必须保存；安装/validate/dry-run不算模型评测通过。

## 判读和停止边界

`exit_code: 0` 只是skill-up进程完成信号，绝不能当业务通过。S06由独立oracle、既有测试和新增测试回放判定；S07按冻结的实际缺陷/负对照判定检出、误报和可操作性。A组没有实际读取当前Skill或B组发生目标Skill污染，该对照无效。

若两组仍饱和，如实记无可观察差异，不反向改题或判据，不声称Skill无价值；是否充分支撑审查结论由预定范围和证据质量判断。该批不是生产现场或官方服务认证，不能承诺跑完就能自动把整体标为100%。F-S04-04有分歧的因果归因保留待裁决，不因这批无关评测提升。
