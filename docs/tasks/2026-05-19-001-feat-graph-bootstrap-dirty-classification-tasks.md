---
title: "feat: spec-graph-bootstrap dirty 分类与 setup-owned gate task pack"
type: task-pack
status: derived
date: 2026-05-20
spec_id: 2026-05-19-001-graph-bootstrap-dirty-classification
source_plan: docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md
source_plan_hash: sha256:bc5264932d2c5e5f9d0fe79f88f122d13c273c238d32392b2c913153616c9a5b
generated_by: spec-write-tasks
mode: derived
target_repo: spec-first
source_sections:
  - "Goals"
  - "Non-Goals"
  - "Requirements Traceability"
  - "Architecture & Boundaries"
  - "Implementation Units"
  - "Test Scenarios"
  - "Sequencing & Dependencies"
  - "Verification Plan"
---

# feat: spec-graph-bootstrap dirty 分类与 setup-owned gate task pack

## Overview

把 `spec-graph-bootstrap` 的"任何 dirty 都阻断"升级为按路径来源分类的 dirty gate。本任务包按 source plan 的 IU-1 → IU-2/IU-3 → IU-4 → IU-5 顺序拆分为 5 个原子任务：契约 source-of-truth → Bash 脚本实现 → PowerShell 脚本实现 → 测试 → 文档/CHANGELOG/SKILL/README。本轮**不**实现 `--allow-dirty` / `-AllowDirty` escape hatch；graph-affecting dirty 仍 fail-closed。

## Source Summary

- Source plan: `docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md`
- Task-ready branch: `compile`
- Consumed sections: Goals、Non-Goals、Requirements Traceability、Architecture & Boundaries、Implementation Units (IU-1..IU-5)、Test Scenarios、Sequencing & Dependencies、Verification Plan。
- Scope boundaries that shaped splitting:
  - 豁免名单 source-of-truth 落在契约（IU-1），是后续两份脚本与测试的依赖根；必须先落地。
  - Bash 与 PowerShell 是两个独立 source 文件，不共享文件，可在 IU-1 之后并行。
  - 测试覆盖 bash unit + 双脚本契约 + 消费契约，需要 Bash 与 PowerShell 实现都到位之后才能整体跑通。
  - 文档/CHANGELOG/SKILL/README 是用户可见层，放在最后一波统一更新，避免与代码改动竞争 commit 节律。
- Implementation-time unknowns（spec-work 阶段决定，本任务包不展开）：
  - CHANGELOG 的 `<release-version>` 占位由 spec-work 阶段读 `package.json` 当时版本替换。
  - `dirty_paths_breakdown.sample_paths` 上限与脱敏策略按 contract 非强制建议（≤20 条、超出截断）实施，具体由 spec-work 现场确定。
  - 现场验证采用 KAZ workspace（`/Users/kuang/ops/code/9627_KAZ展业项目-MVP版本-CRM需求_中台开发`）；若部分 child 命中豁免名单外路径，仍按 graph-affecting 处理，不在本轮扩名单。

## Traceability Matrix

| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| IU-1 | R7、R6、R3 兼容性 | T001 | `tests/unit/graph-provider-consumption-contracts.test.js` 新增的 `dirty_classification` 行断言 + IU-1 文档 review |
| IU-2 | R1、R2、R3、R4、R5、R6、G1–G5、G7 | T002 | `bash skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh` smoke + 临时 git 仓库现场验证 |
| IU-3 | R1、R2、R3、R4、R5、R6、G1–G5、G7 | T003 | `pwsh skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1` smoke + 与 Bash 等价输出比对 |
| IU-4 | R1–R7、G1–G7 全量回归 | T004 | `npm run test:unit` + `npm run test:graph-bootstrap` + `npm run test:smoke` |
| IU-5 | R8（CHANGELOG 必填）、用户可见说明 | T005 | CHANGELOG/版本规划/README/SKILL 更新 + `npm run lint:skill-entrypoints`（如适用）|
| Non-Goals | concurrent-write-detected 不被静默放宽 | T002、T003、T004 | `EXTERNAL_ACTOR_FINGERPRINT_IGNORE_REGEX` 不豁免 setup-owned 列表的合同断言 |

## Task Graph

- T001（契约 source-of-truth）必须最先完成；T002 / T003 / T004 都直接或间接消费契约 path 前缀列表。
- T002（Bash 脚本）与 T003（PowerShell 脚本）触碰不同源文件，可在 T001 之后**并行**执行；不共享 `files`。
- T004（测试）依赖 T001 + T002 + T003 都已落地：bash unit 用例与 contract 测试都需要双脚本与契约联合验证集合等价、blocked 边界、parent fan-out。
- T005（文档/CHANGELOG/SKILL/README）依赖 T004 通过；CHANGELOG 与 README 描述的是"已通过验证的用户可见行为"。

## Execution Waves

- Wave 1: T001
- Wave 2: T002, T003（并行）
- Wave 3: T004
- Wave 4: T005

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    {"wave": 1, "tasks": ["T001"]},
    {"wave": 2, "tasks": ["T002", "T003"]},
    {"wave": 3, "tasks": ["T004"]},
    {"wave": 4, "tasks": ["T005"]}
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "IU-1",
      "requirement_refs": ["R7", "R6", "R3"],
      "goal": "在 graph-provider-consumption 契约中新增 setup-owned-dirty-ignore.v1 小节,确立 path 前缀豁免名单与 dirty_classification 消费规则,作为后续脚本与测试的 source-of-truth。",
      "dependencies": [],
      "files": [
        "docs/contracts/graph-provider-consumption.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#Implementation Units",
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#Architecture & Boundaries",
        "docs/contracts/graph-provider-consumption.md"
      ],
      "entry_hint": "在现有 'dirty worktree refresh request' 行附近拆分为 graph-affecting 与 setup-owned-only 两条,并新增 setup-owned-dirty-ignore.v1 小节列 path 前缀。",
      "test_focus": "契约文档列出的 path 前缀集合与下游脚本实现的集合等价(由 T004 合同测试锁住)。",
      "done_signal": "契约新增 setup-owned-dirty-ignore.v1 小节、消费规则表加 dirty_classification 行、reason_code 拆为 dirty-source-blocked 与 legacy dirty-refresh-non-canonical 兼容说明。",
      "wave": 1,
      "parallelizable": false,
      "review_gate": "required",
      "review_focus": "契约边界:豁免名单与 concurrent-write-detected 豁免独立、graph-affecting-blocked 不写 canonical artifacts、legacy reason_code sunset 条件清晰。",
      "risk_note": "契约一旦落地,T002/T003/T004 都按它实现;若豁免列表写得过宽,会让真源码 dirty 误放行。",
      "stop_if": "需要新增不在 plan 列出的豁免路径(如 docs/、src/cli/)、需要把契约升级为 v2、需要让 concurrent-write-detected 复用同一豁免列表,或需要新增 --allow-dirty 类 escape hatch。"
    },
    {
      "task_id": "T002",
      "source_unit": "IU-2",
      "requirement_refs": ["R1", "R2", "R3", "R4", "R5", "R6"],
      "goal": "在 Bash bootstrap 脚本中接入 dirty 分类 gate:porcelain v2 -z 解析、SETUP_OWNED_DIRTY_IGNORE_PREFIXES 常量、managed block 二级判断,并按 dirty_classification 决定阻断/继续与 canonical 写入。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh"
      ],
      "context_refs": [
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#IU-2:Bash 脚本接入分类 gate",
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#Architecture & Boundaries",
        "docs/contracts/graph-provider-consumption.md",
        "skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh"
      ],
      "entry_hint": "从脚本第 548 行 WORKTREE_STATUS 与第 686 行 emit_blocked dirty-refresh-non-canonical 入手;新增 SETUP_OWNED_DIRTY_IGNORE_PREFIXES、parse_porcelain_v2_paths、managed_block_diff_outside_owned_block,把第 686 行替换为按 $dirty_classification 分支处理。",
      "test_focus": "graph-affecting dirty 触发 reason_code=dirty-source-blocked、canonical_artifacts_preserved=true;setup-owned-only 不阻断且 graph-facts.json 顶层写入 dirty_classification 与 dirty_paths_breakdown;worktree_status_hash 仍按原 v1 status 文本计算,字段语义兼容。",
      "done_signal": "脚本对 clean / setup-owned-only / graph-affecting-blocked 三类分类输出正确 workflow_mode 与 stdout 结果;graph-facts.json 仅在成功刷新时写 dirty_classification;blocked 分类只出现在 stdout result。",
      "wave": 2,
      "parallelizable": true,
      "expected_side_effects": [
        "skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh"
      ],
      "review_gate": "required",
      "review_focus": "EXTERNAL_ACTOR_FINGERPRINT_IGNORE_REGEX 与 SETUP_OWNED_DIRTY_IGNORE_PREFIXES 常量分离、managed block marker 真实性校验(防伪造)、porcelain v2 -z 对 rename/空格/UTF-8 的处理、blocked 与 canonical artifacts 边界。",
      "risk_note": "porcelain v2 字段解析或 marker 切片错误会让真源码 dirty 误放行;concurrent-write-detected 路径与 dirty gate 必须保持独立常量。",
      "stop_if": "脚本需要超出 plan 的额外豁免路径、需要新增 --allow-dirty 选项、需要让 SETUP_OWNED_DIRTY_IGNORE_PREFIXES 与 EXTERNAL_ACTOR_FINGERPRINT_IGNORE_REGEX 合并,或 worktree_status_hash 字段语义需要改变。"
    },
    {
      "task_id": "T003",
      "source_unit": "IU-3",
      "requirement_refs": ["R1", "R2", "R3", "R4", "R5", "R6"],
      "goal": "在 PowerShell bootstrap 脚本中接入与 Bash 等价的 dirty 分类 gate:$script:SetupOwnedDirtyIgnorePrefixes、Parse-PorcelainV2Paths、Test-ManagedBlockDiffOutsideOwnedBlock,并把现有 dirty 阻断分支替换为按 $dirtyClassification 分支处理。",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1"
      ],
      "context_refs": [
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#IU-3:PowerShell 脚本接入分类 gate",
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#Architecture & Boundaries",
        "docs/contracts/graph-provider-consumption.md",
        "skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1"
      ],
      "entry_hint": "从 ps1 第 2187 行 git status --porcelain 与第 2242 行 -ReasonCode 'dirty-refresh-non-canonical' 入手;新增常量与 helper、把 if ($worktreeDirty) 阻断分支替换为按 $dirtyClassification 分支处理;不新增 -AllowDirty。",
      "test_focus": "PowerShell 输出 dirty_classification、reason_code、canonical artifacts 写入与 Bash 完全等价;Get-ExternalActorFingerprint 维持现状窄列表,不复用宽列表。",
      "done_signal": "PowerShell 与 Bash 在每条 Test Scenarios 用例上输出等价的 dirty_classification 与 workflow_mode;graph-facts.json 顶层字段一致;parent summary 复制 child stdout 行为一致。",
      "wave": 2,
      "parallelizable": true,
      "expected_side_effects": [
        "skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1"
      ],
      "review_gate": "required",
      "review_focus": "PowerShell `-notmatch` 行为、$script:SetupOwnedDirtyIgnorePrefixes 与 $script:ExternalActorFingerprintIgnorePattern 常量分离、Test-ManagedBlockDiffOutsideOwnedBlock 与 Bash helper 语义一致、worktree_status_hash 计算方式不变。",
      "risk_note": "PowerShell 与 Bash 行为漂移会让双平台输出不一致,下游 consumer 难以判断;集合等价由 T004 合同测试覆盖。",
      "stop_if": "需要新增 -AllowDirty 参数、需要扩 ignore 列表、需要让 PowerShell 的字段命名/输出顺序与 Bash 不一致,或需要修改 worktree_status_hash 计算方式。"
    },
    {
      "task_id": "T004",
      "source_unit": "IU-4",
      "requirement_refs": ["R1", "R2", "R3", "R4", "R5", "R6", "R7"],
      "goal": "覆盖 dirty 分类的 bash unit 用例、契约合同测试与消费契约测试,锁住分类边界、Bash/PowerShell 等价、契约-脚本集合等价、parent fan-out summary,以及 legacy reason_code 兼容。",
      "dependencies": ["T001", "T002", "T003"],
      "files": [
        "tests/unit/spec-graph-bootstrap.sh",
        "tests/unit/spec-graph-bootstrap-contracts.test.js",
        "tests/unit/graph-provider-consumption-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#IU-4:测试",
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#Test Scenarios",
        "tests/unit/spec-graph-bootstrap.sh",
        "tests/unit/spec-graph-bootstrap-contracts.test.js",
        "tests/unit/graph-provider-consumption-contracts.test.js"
      ],
      "entry_hint": "先修订现有 dirty refresh 用例为 dirty-source-blocked + canonical preserved;再按 plan IU-4 列出的新增用例顺序补:setup-owned-only、host-entry-outside-managed-block、空格/中文/UTF-8 路径、rename across boundary、untracked .gitignore、MM staged+unstaged、marker-creation/deletion、forged duplicate markers、all-repos result。",
      "test_focus": "覆盖 plan Test Scenarios 全表;contracts 测试断言 dirty-source-blocked 为新默认 reason_code、legacy 名称兼容、SETUP_OWNED_DIRTY_IGNORE_PREFIXES 与契约 path 前缀集合等价、external actor fingerprint 不豁免 setup-owned 路径;消费契约测试断言 dirty_classification 行与 fallback 规则。",
      "done_signal": "`npm run test:unit`、`npm run test:graph-bootstrap`、`npm run test:smoke` 全绿;新增用例覆盖 Test Scenarios 表全部行;contract 测试同时承认新旧 reason_code。",
      "wave": 3,
      "parallelizable": false,
      "review_gate": "required",
      "review_focus": "测试是否真断言行为(而不是字符串子串);PowerShell 等价覆盖到位;parent fan-out 不读 preserved artifact;forged duplicate markers 与 marker-creation/deletion 边界用例的伪造防御逻辑。",
      "risk_note": "若契约-脚本集合等价断言只比正则文本而非 path 前缀集合,后续两脚本任一漂移会被掩盖;parent summary 用例若读 child preserved graph-facts.json 会污染本轮 blocked 结果。",
      "stop_if": "测试发现 plan 未覆盖的边界(如 submodule dirty、symlink rename),或需要新增 plan 之外的脚本逻辑才能让用例通过;此时回到 spec-plan 而非在测试里临时打补丁。"
    },
    {
      "task_id": "T005",
      "source_unit": "IU-5",
      "requirement_refs": ["R8"],
      "goal": "同步 CHANGELOG、版本规划、README/README.zh-CN 与 spec-graph-bootstrap SKILL.md,把 setup-owned dirty 不再阻断、真源码 dirty 仍 fail-closed 的用户可见行为讲清楚。",
      "dependencies": ["T004"],
      "files": [
        "CHANGELOG.md",
        "docs/00-版本路线/版本规划.md",
        "README.md",
        "README.zh-CN.md",
        "skills/spec-graph-bootstrap/SKILL.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-19-001-feat-graph-bootstrap-dirty-classification-plan.md#IU-5:文档与 CHANGELOG",
        "CHANGELOG.md",
        "skills/spec-graph-bootstrap/SKILL.md"
      ],
      "entry_hint": "CHANGELOG 按当前 host developer profile 解析作者,新增 (user-visible) 行;SKILL.md 在 ## Refresh Modes 段更新 dirty 行,新增 ## Dirty Classification 小节链接 setup-owned-dirty-ignore.v1;README 段在 spec-graph-bootstrap 与 spec-graph-bootstrap 描述处补一句。",
      "test_focus": "CHANGELOG 行格式符合仓库现行格式且 (user-visible);SKILL.md / README 文案与契约保持一致;版本规划新增 changelog 引用。",
      "done_signal": "CHANGELOG.md 顶部新增 (user-visible) 行;SKILL.md 与 README/README.zh-CN 更新落地;版本规划补 changelog 引用;`npm run lint:skill-entrypoints`(若适用)通过。",
      "wave": 4,
      "parallelizable": false,
      "review_gate": "optional",
      "review_focus": "用户可见文案是否过度承诺(例如把 graph-affecting dirty 也描述为不阻断);CHANGELOG 作者解析是否使用了正确的 host developer profile;SKILL.md 与契约链接是否双向一致。",
      "risk_note": "文档若说 setup-owned 名单可由用户配置或暗示 --allow-dirty 已支持,会与契约和脚本行为不一致。",
      "stop_if": "CHANGELOG 缺少作者解析所需的 .developer 文件、版本号占位需要发布版本未确定、或 README 需要新增独立小节而非段落级补充;此时回到 spec-plan 或先解决 host developer profile。"
    }
  ]
}
```

## Task Cards

### T001 — IU-1 契约 setup-owned-dirty-ignore.v1

- 锚点：plan IU-1、`docs/contracts/graph-provider-consumption.md` 现有 "dirty worktree refresh request" 行（line 64）
- 内容：新增 `## setup-owned-dirty-ignore.v1` 小节列 path 前缀；将原 dirty 行拆为 graph-affecting / setup-owned-only 两条；消费规则段新增 `dirty_classification` 行；明确 legacy `dirty-refresh-non-canonical` sunset 条件。
- 边界：本任务只改契约文档；脚本与测试在 T002/T003/T004 落地。

### T002 — IU-2 Bash 脚本分类 gate

- 锚点：`skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh:548` / `:588` / `:686` / `:2305`
- 内容：新增 `SETUP_OWNED_DIRTY_IGNORE_PREFIXES`、`parse_porcelain_v2_paths`、`managed_block_diff_outside_owned_block`；切换 dirty 检测为 `git status --porcelain=v2 -z`；按 `dirty_classification` 分支替换原 `emit_blocked` 行；写入 canonical `dirty_classification` 与 `dirty_paths_breakdown`；保持 `external_actor_fingerprint` 现状窄列表。
- 边界：不改 `worktree_status_hash` 计算；不引入 `--allow-dirty`。

### T003 — IU-3 PowerShell 脚本分类 gate

- 锚点：`skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1:2187` / `:2224` / `:2242`
- 内容：新增 `$script:SetupOwnedDirtyIgnorePrefixes`、`Parse-PorcelainV2Paths`、`Test-ManagedBlockDiffOutsideOwnedBlock`；切换 dirty 检测为 porcelain v2 -z；替换 `if ($worktreeDirty)` 阻断分支；与 Bash 输出等价；保持 `Get-ExternalActorFingerprint` 现状窄列表。
- 边界：不引入 `-AllowDirty`；字段命名与输出与 Bash 严格对齐。

### T004 — IU-4 测试覆盖

- 锚点：`tests/unit/spec-graph-bootstrap.sh`、`tests/unit/spec-graph-bootstrap-contracts.test.js:118 / :124`、`tests/unit/graph-provider-consumption-contracts.test.js:155`
- 内容：修订原 dirty refresh 用例为 `dirty-source-blocked` + canonical preserved；新增 plan IU-4 列出的所有边界用例；contracts 测试断言契约 path 前缀与脚本常量集合等价、external actor fingerprint 不豁免 setup-owned 列表、消费契约新增 `dirty_classification` 行。
- 边界：不在测试里临时绕过未实现的脚本能力；如发现 plan 未覆盖的边界，触发 `stop_if` 回到 plan。

### T005 — IU-5 文档/CHANGELOG/SKILL/README

- 锚点：`CHANGELOG.md` 顶部、`skills/spec-graph-bootstrap/SKILL.md` line 268（`## Refresh Modes`）、`docs/00-版本路线/版本规划.md`、`README.md` / `README.zh-CN.md` 中 `spec-graph-bootstrap` / `spec-graph-bootstrap` 段
- 内容：CHANGELOG 新增 `(user-visible)` 行（作者按 `.codex/spec-first/.developer` 或 `.claude/spec-first/.developer`）；SKILL.md 更新 dirty 描述并新增 `## Dirty Classification` 小节；README 在 graph-bootstrap 段补一句；版本规划补 changelog 引用。
- 边界：不在 README 新增独立大节；不暗示 `--allow-dirty` 已支持。

## Orientation Evidence

- Provider: direct-repo-reads
- Posture: bounded
- 已读锚点：plan 全文；`docs/contracts/graph-provider-consumption.md`（行 9 / 49 / 64 / 76）；`skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`（行 548 / 588 / 686 / 2305）；`skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`（行 2187 / 2224 / 2242）；`tests/unit/graph-provider-consumption-contracts.test.js:155`；`tests/unit/spec-graph-bootstrap-contracts.test.js:118 / :124`；`skills/spec-graph-bootstrap/SKILL.md` 段标题列表（含 `## Refresh Modes` 行 258）。
- Limitations:
  - 未实际启动 Bash/PowerShell 脚本验证 porcelain v2 -z 的字段切片（spec-work 阶段在临时 git 仓库中验证）。
  - 未抽样 KAZ workspace 8 child 的 dirty 路径分布（plan 已记录此为 deferred）。
  - 未读 `tests/unit/spec-graph-bootstrap.sh` 全文，仅在 plan 锚定基础上推断现有 dirty refresh 用例位置；spec-work 阶段需直接打开该文件确认行号。

## Validation Notes

- Deterministic：`source_plan_hash=sha256:bc5264932d2c5e5f9d0fe79f88f122d13c273c238d32392b2c913153616c9a5b`，由 `node bin/spec-first.js tasks hash` 产出，可重新执行复算；`spec_id` 与 source plan 一致；五个任务 `task_id` 唯一，`dependencies` 仅引用本包内已存在的 ID；`files` 全部为 repo-relative POSIX 路径；同 wave 任务（Wave 2 的 T002 与 T003）`files` 无交集。
- Semantic：T001 是 source-of-truth foundation；T002/T003 通过 path 前缀集合等价由 T004 合同测试守住一致；T004 同时覆盖 Bash/PowerShell 行为与契约消费；T005 仅在 T004 通过后落地用户可见文案。`review_gate=required` 集中在契约、双脚本与测试三类（高风险共享契约 + 验证锁）；T005 文档变更 review 可并入终审。
- Out of scope：本任务包不引入 `--allow-dirty` / `-AllowDirty`，不改 `concurrent-write-detected`，不改 `worktree_status_hash` 计算方式，不改造既有 consumer。

## Regeneration Rules

- 当 source plan 主体被实质性修改（hash 变更）时，必须重跑 `spec-write-tasks` 重生本任务包；不允许在执行阶段就地改任务卡 scope。
- 当任务执行触发 `stop_if`（如需新增豁免路径、escape hatch、跨 schema 兼容方案）时，回到 `spec-plan` 修订源 plan，再回 `spec-write-tasks`。
- T005 的 CHANGELOG 行版本号占位 `<release-version>` 在 spec-work 阶段读取 `package.json` 当时版本替换；若发布版本仍未确定，T005 应触发 `stop_if`。
