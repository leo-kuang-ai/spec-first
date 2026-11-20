# SUP-20：从使用者的复核决定验收知识新鲜度

原始问题与复现：`docs/validation/2026-11-09-harness-full-code-deep-review.md:197`。受影响的使用者要判断是否需要重新评估知识条目，不是要让 Git 命令报错。这里回放项目自己的已知返工，不把它当作新用户盲测。

## 验收口径

- `packages/shared` 是声明的知识来源。在其下出现未跟踪源码，输出应为 `freshness.status=dirty`，并在 `dirty_refs` 列出 `packages/shared`。原报告用英文 `new.ts` 复现；中文文件名是本轮增加的泛化对照，不冒充当时明确列出的验收样例。
- 基线未变或只有引用范围外的文件改变时，仍应为 `clean`。错误地强迫所有任务重验也不合格。
- `dirty` 只移交“需要复核”；是否修改或删除原知识条目由维护者按证据决定，脚本不代判。`--freshness` 的退出码不是这个产品决定。

## 同输入回放

把三个版本的 `skills/spec-project-rules/scripts/extract-deps.cjs` 分别运行于同一个隔离 npm workspace。固定 `core.quotePath=true`，先提交 workspace 与 `packages/shared/package.json`，再把 `docs/architecture.md` 的 `source_commit` 钉到该 SHA，声明 `住址 packages/shared`。每次仅增加表中一个文件；比较后移除该实验文件，再跑下一组。入口均为 `node <该版脚本> <fixture> --verify --freshness`。

| 输入 | 返工前 `f9c3f7a7d` | 首次修复 `33742bd3c` | 本轮工作树 |
|---|---|---|---|
| 无来源变化 | clean | clean | clean |
| `packages/shared/new.ts` | clean（漏报） | dirty | dirty |
| `packages/shared/规则.ts` | clean（漏报） | clean（漏报） | dirty |
| `outside.ts` | clean | clean | clean |

12 次调用退出码均为 0。表中所有 `dirty` 均实际列出 `packages/shared`。历史修复覆盖了“未跟踪”这一状态，但按行读取 Git 的展示文本，引用目录与带展示转义的路径仍无法匹配。本轮四种 Git 状态均按 NUL 分隔读取实际路径，并用无变化引用作反例。

## 能归因到哪里

在三个被测版本里，原始英文例最早于 `33742bd3c` 通过；扩大到表中四个验收条件后，只有本轮版本全部通过。可定位的返工点是来源变化的提取及其验收覆盖，而非规划轮次数量或是否启用更多 agent。观测单位是脚本输出与引用身份，可用上面的小仓库步骤复验，不需要模型评分。

原始需求的接单时刻、人工实际工时及逐次人工纠正次数都没有可靠记录；两个 Git 提交或两次修订不能当作两次人工救场。本次也是已知结果的历史回放，不能估计首次交付耗时或效率提升。下一项未解决的真实需求应在交给执行者前由需求方冻结可观察正反例及保留决定，原始输入与基线单独留档；到首次满足验收才记录时长，并只统计确实改变了交付的人工纠正及原因。
