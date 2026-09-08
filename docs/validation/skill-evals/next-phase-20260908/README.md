# 下一阶段开发历史证据包

类型：advisory。来源基线：`ae146549`；历史实现提交：`75718c4e`、`d6950ae6`、`8800460d`、`32dfee01`。

[evidence.json](evidence.json) 保存原 workflow 的 15 份最小历史记录，供干净 checkout 离线复核，不依赖本机 `.spec-first/` 目录。本次仅持久化记录，没有重跑历史模型实验，也没有重新授予准入或风险接受。

每项 `sources[]` 包含原路径、原文件字节 SHA-256 与完整内容。JSON 使用结构化副本，日志及能力说明保留文本；SHA-256 锚定原件字节，不是重新序列化后内容的哈希。内容中的历史路径只作来源标识：本包已收录的文件按 `original_path` 查找，其余属于未随包交付的原始工作区，不声称链接闭包或实验可完整重放。

| 批次 | 包内可复核记录 | 结论边界 |
| --- | --- | --- |
| S1 | `verification-run-summary.json` 及其 6 份日志 | 历史四项复现通过；35 项聚焦测试通过。仅确定性测量校准，没有模型行为验收 |
| S2/S3 | `s2-s3-behavior-results.json`、`aa-s2-pair.json`、`aa-s3-pair.json`、`capability-report.md` | 替代模型 GLM-5.3 的历史分场景机械记录与语义裁决；不构成 Astra 结果 |
| S4 | `s4-design.json`、`s4-results.json`、两份 `s4-aa-*.json` | 一类维护任务、5 任务、3 arm 的内部对照记录；主宿主旅程未执行 |

## 必须保留的限制

- E33 的隔离原生 goal 测试未运行；创建、读取及完成接口不能靠字符串测试声称通过。
- S2/S3 候选机械统计存在历史差异：能力说明为 `36/45`，结果 JSON 的 `clean_mechanical_rates_excluding_broken_cells.candidate` 为 `35/44`。原件均保留；重新核对逐次记录及纳入规则前不合并、不择优报告。
- 结果记录说明工具事件流不可完整观察，部分事件来自文件/Git 最终状态和标明的模型自述；存在超时、重试投递说明变化及来源不明答复。不能据此声称完整权限或网络行为验收。
- S4 设计明确 A/A 为对相同 baseline 输出重复评分，不是独立任务重跑；零评分漂移不证明执行噪声为零。`internal_comparison_complete` 是历史记录状态，只限其预注册的受限内部比较，不表示完整主宿主验证或效应量验证。
- 未收录完整工具轨迹、各 arm 的隔离工作区和全部逐次模型原始输出；语义通过是历史 reviewer 的裁决，不能当成本次独立复验。任何依赖完整轨迹的推广结论仍未验证。
- 成本仅为描述性记录；不声明 Astra、生产效果或效率收益。历史文件中的授权文字只记录当时叙述，不产生当前授权。

## 当前复核入口

S1 的确定性行为可在当前源码上重新运行：

```bash
npx --no-install jest tests/unit/routing-eval-runner.test.js tests/unit/spec-optimize-measurement-only-contracts.test.js --runInBand
```

历史结果与当前验证分开保存。源码、测量口径或原始记录变化时，保留本包快照，新增带来源的修订说明；不得覆盖历史记录来制造验证一致性。
