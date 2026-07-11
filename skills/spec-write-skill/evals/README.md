# Trigger Eval Maintainer Guide

本目录只承载 `spec-write-skill` 的维护者验证证据，不投射到任何宿主 runtime。

- `trigger-cases.json`：记录 should-trigger、near-neighbor、boundary、failure 与 expected cases。
- `reason_code`：与 `references/authoring-method.md` §1 Qualification 和 §5 Anti-Pattern Families 的语义对应。
- runtime 文档必须能独立解释执行边界；不得依赖本目录中的 fixture、README 或路径才能工作。

新增或修改案例时，同步检查 fixture 的 `source_refs`、近邻边界和 forbidden signals，并运行 `npm run test:eval-fixtures`。
