# CE 当前增量复审准备

本包完成确定性差异准备与 13 个 handoff 文件的双视角源码审查；当前 CE closeout 仍未完成。两个视角来自同一继承上下文，不能称为独立 provider 评审。

## 产物与范围

- `current-inventory.json`、`current-coverage.json`：准备时的 deterministic producer 输出，未覆盖 canonical artifacts。
- `review-gaps.json`：两条 lane 各 187 个关系缺口，分别为 42 stale、96 missing、49 retired；去重为 136 个 current 文件、138 个 current Skill/path 关系及 49 个 retired 关系，共 12,729 行 current 输入。
- `upstream-reference-facts.json`：固定 upstream 窗口、517 条裁决、584 个引用的可达性事实。
- `bounded-handoff-review.json`：完整读取的 13 个 handoff 差异文件及两项 P2 判定覆盖缺口；初稿不是完整 review delta。
- `preparation-freshness.json`：整体 source binding 已受并行修改影响，13 个已审 handoff 路径在该次复验时均未漂移。消费本包前仍须再核对。

准备目录在 `isRunOutput()` 的排除集合内；其他 validation 目录并非一概排除。本子任务最初仅写准备目录，后续由主 owner 单独授权修复 handoff 的两项 judge 缺口；修复证据另行追加。

## 上游与裁决消费约束

checkout 为 `/Users/kuang/xiaobu/compound-engineering-plugin`，固定范围 `5c7cb347d0686663743b87cd7227246ba24f7fa7..956087b3e1dd7ccc03df32cee9e7c044dfbe75cf`，168 commits、517 changed paths。两个端点均可用；name-status hash `a83371963406147ede5c9752c13b324e88d9f0eaf08af7e1239dd7e6a623d459` 与历史记录一致。当前 checkout HEAD 与固定 head 不同，且已有 dirty；本任务未 fetch、pull 或修改该 checkout。

517 条裁决的引用均可解析，历史状态仍为 494 planned、23 not-applicable。`canonical_owner`、`test_owner`、`implementation_targets`、`test_refs` 必须在 spec-first 本地存在；`source_refs` 可引用本地或固定 upstream base/head。不能拿 upstream 当前 HEAD 代替固定版本，也不能因文件可达就把裁决升级为 confirmed。

## 后续执行顺序

1. 完成 canonical 修改和发现修复，稳定源码；重新生成确定性 inventory 与 coverage。
2. 执行 runbook 的 `--refresh --prepare-adjudication`，使用上述固定 checkout/base/head；两个 producer 必须拥有同一 source snapshot。
3. LLM 对 517 条裁决逐项复核或记录可追溯的 carry-over 判断；确认当前 owner、测试及实际语义仍适用，再更新 stamp。不得只用脚本改 hash。
4. 完整审查两条 lane 的全部 current/retired gap。初稿尚余 123 个 current 文件、49 个 retired 关系和 517 条裁决的语义复核；handoff 修复后还需复查变化内容。
5. 合并真实审查结果到 `docs/validation/ce-localization/review/deltas/<delta>.json`。每条 current 路径必须具有当前 hash/bytes/完整行段与恰好两个 lens verdict；retired 关系保留旧 sha 和对应判断。集合必须与当前 gap union 完全一致，不能直接消费本目录的 fragment。
6. 运行 `node scripts/generate-ce-localization-closeout.cjs --review-delta <上述路径>`，随后运行两份 CE unit suites 与 `node scripts/check-ce-localization-review.cjs --verify-closeout`，保留退出码和错误详情。
7. 提交会改变 HEAD；如需声明提交后的 current closeout，重新核验 binding 并对真实变化补证据。不得循环盲签旧语义结果以追求绿色。

writer 当前会生成 not-run 的 field/knowledge 记录；真实任务/宿主/provider/现场收益均不由本准备或 unit 通过证明，不得覆盖已有真实 field evidence 或混淆其状态。

## 初稿发现

- `CE-PREP-HANDOFF-01`：resume judge 只查提交计数与指定哨兵，未检查未提交源码、其他文件或 index 的变化。两个 case 的 `files_not_exist` 也仅覆盖两个路径。
- `CE-PREP-HANDOFF-02`：create judge 仅用 grep 检查 metadata 行、SHA-256/resume 关键词，未核对真实 digest、artifact identity 与精确 invocation。

两项是源码可确认的断言不足，不能据此声称真实模型已经发生越权或错误生成。已在 `skills/spec-handoff/evals/fixtures/scripts/` 修复，固定反例与回归证据见 `handoff-judge-repair-evidence.json`；该证据仍只覆盖确定性脚本，不构成真实模型或宿主通过。
