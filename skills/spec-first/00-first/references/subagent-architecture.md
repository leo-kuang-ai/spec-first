# 00-first 增强分析提示

> 仅在 `spec-first first --yes` 证据不足时按需启用。

## 约束

- 默认先走 CLI
- 增强分析只补证据，不替代主链
- 结果先汇总到 `.spec-first/runtime/first/`
- `docs/first/*` 仅是 projection
- 单个失败不阻断其他资产
- 缺失证据标注 `[待确认]`
- 遵循 `quality-assurance-rules.md`
