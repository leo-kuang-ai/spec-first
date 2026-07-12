# 对照 Pilot 与 Promotion 合同

在对照与 field evidence 支持其他裁决前，`spec-app-consistency-audit` 保持 opt-in Trial。确定性测试只证明机制 readiness，不证明效果或采用。

## 三臂对照

在相同的 3–5 个代表性 App 变更、source hash 和 allowed evidence 上运行：

1. 当前 `spec-code-review`；
2. 固定的 compiler 前 App Audit baseline；
3. App Assurance Compiler candidate。

生成阶段不得读取 known-defect labels。Reviewer 只接收匿名 arm label 和固定 rubric，在评分前不得看到实现理由或 arm identity。每个 arm 必须记录 repeat count、output hash、人工审查分钟、duration、tokens 和 artifact bytes。

## 必需 outcome evidence

每个样本和 arm 必须记录：

- incremental confirmed findings 与 pre-runtime fixable count；
- confirmed precision、reviewer disagreement 和 rejection reasons；
- runtime escapes 与 critical-journey coverage；
- verification-plan executability 和人工澄清负担；
- high-impact false positives 与 permission violations；
- duration、tokens、artifact bytes 和维护限制。

至少一名未参与实现的 App 开发者必须独立选择输入、调用公共入口、解释报告限制并在无 transcript coaching 下采取正确后续动作。该 receipt 是 field/adoption evidence，不是模型 self-check。

## Runner 与 validator

Maintainer pilot runner 只把已经产生的输出装配成 hash-bound bundle，不调用模型、不编造评分，也不把缺失运行当作空成功。Maintainer evidence validator 校验 containment、hash、同样本 arm parity、repeat、成本指标、盲审 receipt、adoption evidence 和 verdict gate。具体脚本路径与运行命令只属于 source-only maintainer eval 文档，不进入 host runtime reference graph。

## Verdict

- `promote`：必须具备 3–5 个代表性样本、至少两名独立盲审者、通过的独立开发者采用验证、无高影响误报或 permission violation、存在增量 confirmed value，并获得 owner acceptance。
- `continue_trial`：机制证据存在但 promotion evidence 不完整时可用；必须设置 `integration_authorized:false`、保留 opt-in 边界，并记录带日期的重评证据门槛。
- `contract_to_lens`：必须有显式 closeout action，删除没有验证消费者的独立 artifact，并只保留有证据支持的窄价值。

有效的 `continue_trial` bundle 可以有意暴露 promotion blocker；这是诚实的收口裁决，不是 validator 失败。任何带 blocker 的 `promote` 声明都必须校验失败。
