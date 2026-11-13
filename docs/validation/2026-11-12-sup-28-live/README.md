# U14 SUP-28 live 取证（spec-dogfood 两例）

- 日期：2026-11-12
- 计划：`docs/plans/2026-11-12-001-fix-sup-remaining-validation-plan.md`（U14）
- 口径：`skill-up run skills/spec-dogfood/evals/eval.yaml --provider zhipu --model glm-5.3 --iteration 1 --parallelism 1 --output-dir <独立目录>`；凭据取自 magpie 的 zhipu 配置
- 结果：**2/2 PASS（各 100%）**

| 用例 | 状态 | 耗时 | 判据 |
| --- | --- | --- | --- |
| `owner-unavailable-stops` | PASS 1/1 | 320.97s | `check-owner-unavailable-stop.sh`（exit 0） |
| `trunk-target-rejected` | PASS 1/1 | 77.44s | `check-trunk-reject.sh`（exit 0） |

- 证据：`owner-unavailable/report.json`、`trunk-target/report.json`、`result.json`，以及 `sup-live-u14-1.log` / `sup-live-u14-2.log`。
- **模型核对**：两例日志都出现 `[claude-code:unrecognized_model] {"model":"glm-5.3"}` 警告；核对 report.json 的 `model_name` 为 `zhipu/glm-5.3`，确认该警告是 CLI 模型注册表不识别，不是模型降级或失败。
- 限制：每例单 iteration，不构成稳定性结论；判据 live 有效性的外推仅限这两例。
