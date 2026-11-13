Review failed: non-interactive mode requires a document path. Expected arguments: mode:non-interactive <path>

说明：本次调用只携带了 `mode:non-interactive` 标志，未附带任何文档路径，因此按技能契约在派遣评审前直接终止，未做任何 persona 分派或文档读取。

如需继续，请在参数中附上待评审文档的可读路径，例如：
- `mode:non-interactive docs/plans/my-plan.md`（默认 report-only 报告）
- `mode:non-interactive mutation:apply-fixes docs/plans/my-plan.md`（生产者授权的受限 Markdown 修复评审）

可选标志还包括 `roster:lite|standard|full`（默认 standard）与 `output:json`。
