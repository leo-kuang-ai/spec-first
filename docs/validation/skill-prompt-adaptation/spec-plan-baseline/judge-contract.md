# spec-plan Prompt 适配 Judge 合同 v1

状态：`draft-freeze-candidate`。Judge 只提供质量证据，不拥有 Prompt 修改、winner 选择或 promotion 权限。

## 输入

执行记录由 runner 绑定 case、arm、repeat、source/model/host identity、原始产物和工具 receipt；这些元数据不直接进入 semantic judge 输入。协调器保存随机 sample_id 到执行记录的私有映射，清除候选名、源哈希和带 arm 的路径后，将 sample_id、任务输入、脱敏产物、必要 trace 与 checker 结果送交 judge。每次随机化展示顺序；评分锁定后由汇总器解盲。脱敏不得删除承重证据，无法同时保证证据充分与盲化时记 inconclusive。

## 先后顺序

1. deterministic checker 先判路径、字段、hash、权限和失败分类；
2. checker 失败直接标记对应硬失败，不让 judge 将其解释为通过；
3. semantic judge 只判断语义充分性和产物质量；
4. judge A/A 在代表性子集先运行，噪声或身份漂移超限则结果为 `inconclusive`；
5. owner 汇总 quality gate，measurement-only 不自动推广。

## 输出

```json
{
  "case_id": "holdout-unknown-residency",
  "sample_id": "random-opaque-label",
  "repeat_id": 1,
  "entry": "pass|fail|inconclusive",
  "behavior": "pass|fail|inconclusive",
  "artifact": "pass|fail|inconclusive",
  "runtime": "pass|fail|inconclusive",
  "critical_failure": false,
  "failure_codes": [],
  "evidence_refs": [],
  "judge_confidence": "high|medium|low",
  "limitations": []
}
```

## 评测纪律

- judge 不得读取未授权的 A/B 身份或修改候选；
- 低置信、缺 artifact、缺 trace 或模型身份不明时输出 `inconclusive`；
- judge 结果不能替代 human calibration；
- holdout 暴露后若修改候选，必须冻结新 treatment 并换新 holdout；
- 只有四层质量门全部通过，才允许计算成本收益和提出 `promote`。

## 聚合、校准与记录边界

单臂 judge 只判断 critical_failure；解盲汇总器根据 case × repeat 配对计算新增回归，不让 judge 猜测 treatment。四层结果和关键失败写入 baseline receipt 的 evidence.layers / critical_failure；完整 judge 输出按 trace_refs 回源。receipt 的 pass 仅代表单次任务质量通过，不代表 C1 可观测、成本有效或可推广；read_status 为 proxy/unavailable 的质量通过记录不得进入读取收益推广。

A/A 前使用至少 10 份人工标注样本（至少 5 份含关键失败），同一盲评输入重复两次。关键失败不得漏判；四层标签与人工逐项一致率及两次重复一致率均须达到 90%。分歧必须人工裁决并冻结 rubric；未达标记 inconclusive，重新校准，不进入 A/B。以上为项目提议阈值，费用纳入总预算，不代表官方标准。

Schema 只能验证记录结构和部分组合，不验证 trace 真实存在、hash 正确、人工标注质量或盲化成功。执行前还须实现路径/hash/checker 回源与身份映射隔离检查；当前这些 runner 检查尚未运行。
