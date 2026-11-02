# r2 有效配对记录：S06 work × codex（gpt-6-astra）

日期：2026-11-02。同一 `skill-up run` 调用内完成 A/B 两腿；环境合同见 [environment-contract-r2.md](environment-contract-r2.md)。机器可读指标：[r2-observations-work-codex.json](r2-observations-work-codex.json)。

## 配对有效性核验（全部通过）

| 核验项 | A（with_skill） | B（without_skill） |
|---|---|---|
| 模型/effort/沙箱 | gpt-6-astra / medium / workspace-write | 同左 |
| 挂载 Skill 加载 | 读 `.codex/skills/spec-work/SKILL.md` + input-triage/workspace-setup/work-intiate 等引用（execution-strategy、implementation-loop、feedback-and-tests、execution-engines、shipping-workflow），多次回读 | 无挂载；trace 中 9 处 spec-work 提及均为提示词原文与"未安装"陈述，无 Skill 内容读取 |
| workspace 基线 | HEAD `bb7a5fa78`，branch `eval-work`，dirty 仅 `src/invoices/cancel.js`、`src/http/routes.js`、`test/cancel.test.js`（+A 组 `.codex/` 挂载目录） | 同 HEAD/branch，dirty 同三文件，无 `.codex/` |
| 独立 oracle（grade.cjs） | 5/5 | 5/5 |
| 回归（npm test） | 11/11（新增 6） | 13/13（新增 8） |
| 测试强度（对错误变体必须失败） | missing_audit 2 fail；paid_allowed 2 fail（首次变异脚本因嵌套花括号未生效，经括号计数重做后确认） | missing_audit 3 fail；paid_allowed 2 fail |
| 全局 CLI 调用 | 未调用（`command -v spec-first` 探测后放弃，报告 `run_artifact_reason_code: not-written`） | 未调用 |

## 观察结论（仅对本场景与模型组合成立）

- 业务结果无差异：两组独立 oracle 均 5/5、回归全绿、均真实接入事务/审计/HTTP，实现形态一致（B 用自定义 Error 类，错误码不同但 HTTP 映射等价）。
- 成本：A 487,747 token（含缓存）/129.8s/10 次工具调用 vs B 140,810/75.5s/6 → token≈3.5×、时长≈1.7×。
- 过程差异（Skill 设计目标内）：A 产出 return-to-caller 结构化信封（changed_files、verification_evidence、honest_closeout_verdict: unsupported、working-tree fingerprint），并诚实报告 fixture 缺收尾 CLI 的 blocked；B 为平铺总结。A 的新测试少 2 个但强度同等（两变体均能捕获）。
- 不外推：单场景单次配对，不做统计显著声明；不因业务无差异断言 Skill 无价值（证据出口/诚实收尾差异是设计目标，未在本判据计分）。
