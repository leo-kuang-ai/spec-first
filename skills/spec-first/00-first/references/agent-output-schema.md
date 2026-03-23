# Agent 输出 Schema

> 统一 runtime agents 与 docs agents 的最小输出格式。
> 主线程只读取结构化摘要，不读取完整推理链。

## 1. 标准字段

- `status`
- `artifacts`
- `evidence_paths`
- `gaps`
- `next_action`

## 2. 状态枚举

- `healthy`
- `blocked`
- `retryable`
- `[待确认]`

## 3. 字段说明

- `status`：本轮结果的总状态
- `artifacts`：已产出的文件或资产，必须使用对象数组；每项至少包含 `name`、`path`、`written`
  - `name`：资产名，保持与 runtime/docs 目标一致
  - `path`：canonical 输出路径
  - `written`：布尔值，`true` 表示已实际落盘到 `path`
- `evidence_paths`：支撑结论的证据路径
- `gaps`：缺失项、待确认项或阻塞项
- `next_action`：下一步建议动作，必须可执行

## 4. 示例

```json
{
  "status": "healthy",
  "artifacts": [
    {
      "name": "summary.json",
      "path": ".spec-first/runtime/first/summary.json",
      "written": true
    }
  ],
  "evidence_paths": ["package.json:1", "src/index.ts:5"],
  "gaps": [],
  "next_action": null
}
```

## 5. 失败表达

- `blocked`：当前波次无法继续，需要先修复阻塞
- `retryable`：允许重试一次
- `[待确认]`：证据不足，不能自行补猜

## 6. 输出约束

- 不输出长篇分析
- 不输出与其它 agent 重复的解释性正文
- 结论必须可回溯到 `evidence_paths`
