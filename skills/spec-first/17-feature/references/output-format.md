# feature 输出格式

- `/spec-first:feature list`：输出 Feature 列表
- `/spec-first:feature current`：输出当前 Feature 与阶段
- `/spec-first:feature switch <featureId>`：输出切换结果、控制面写入结果、建议下一步

底层 CLI 对应：
- `spec-first feature list`
- `spec-first feature current`
- `spec-first feature switch <featureId> --yes`

补充要求：
- `switch` 输出必须明确 `.spec-first/current` 是否已更新
- `switch` 失败时必须说明失败原因，且不得伪装成已切换成功
- 成功切换后必须建议执行 `/spec-first:catchup`
