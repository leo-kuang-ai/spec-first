# App Assurance Compiler U0 Baseline

状态：`complete`；terminal verdict：`ir_go`。

本 bundle 记录 U0 已完成的确定性地板和仍缺失的语义证据。它不支持 App Assurance 有效性声明，也不授权 U1–U9。

已完成：

- 两个 synthetic fixture 的 sample contract、hash、provenance、known-defect refs、allowed evidence 与 redaction posture。
- Direct lens 与 disposable IR thin-slice 的同预算 prompt/envelope。
- 当前 runner 无 raw issues 时 `issue_synthesis_status:not_run` 的 characterization。
- Evidence gate 对 rule-pack-only、missing evidence、invalid confidence promotion 的 characterization。
- Extractor candidate authority 与 degraded scan signal 的 characterization。

比较结果：

- Current Code Review 在没有真实 diff/file-line evidence 时不能形成 finding。
- Current App Audit runner 在无 staged semantic issues 时输出 `issue_synthesis_status:not_run`。
- Variant X/Y 两名独立 reviewer 总分分别为 12/15 对 12/15、13/15 对 13/15，均轻微偏好 X。
- 揭盲后 X 为 disposable IR，Y 为 direct lens。
- IR 独有增量覆盖 Retry terminal closure、Settings deep-link failure、Settings 中进程重建和更显式的 permission lifecycle；这些改变验证任务范围。
- IR token 粗估为 direct 的 1.25×，墙钟更低；人工审查成本约高 20%–25%，未观察到超过 25%。
- 未发现 high-impact false positive、permission breach 或明确不可执行任务。

因此五项门禁在本 Trial 样本上通过，`unlocks_u1=true`。限制是样本没有 materialized App source，成本也是粗估；该结果只授权 U1–U5/U7/U8 的可逆实现，不支持公共效果声明或默认 Code Review 集成。
