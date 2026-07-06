---
spec_id: 2026-05-20-001-fix-spec-work-skill-quality
type: fix
title: 按代码逻辑深读后修订 spec-work skill 治理边界（fix-1 ship-now + fix-2 deferred）
status: superseded
created: 2026-05-20
origin: docs/10-prompt/skill-reviews/2026-05-20-spec-work.md
deepened: 2026-05-24
deepening_round: 2
---

# fix: 按代码逻辑深读后修订 spec-work skill 治理边界（fix-1 ship-now + fix-2 deferred）

> Superseded: 本计划不再作为 active 开发入口。fix-1 已在 2026-05-24 落地；剩余 fix-2 / Phase B deferred scope 不再沿用本计划推进。如需继续修订 `spec-work` 治理边界，应基于当前 GitNexus-only / bounded evidence 现状另开新 plan。

## Summary

经 2026-05-24 第二轮 deepening 深读当前分支 `leo-2026-05-21-gitnexus`（已修改 `skills/spec-work/SKILL.md` 152 行 + 新建 `evals/examples.json` + 修订 `references/`），重新评估 origin 审查报告 §0/§8 提出的 4 项问题在当前 source 上的真实状态，把 plan 从"Phase A 4 unit + Phase B defer"收敛为 **"fix-1 ship-now + fix-2 deferred"两段结构**。

**第二轮 deepening 关键发现**（与第一轮校准的修正点）：

1. **examples.json 文件本身是当前分支 commit `8f294258 fix(review): harden skill agent governance` 引入的**（master 上 `git cat-file -e main:skills/spec-work/evals/examples.json` 返回 `path exists on disk, but not in 'main'`），第 5 例由该 commit 同时加入。删除第 5 例 = 撤回当前分支自己刚加上去的工作。
2. **Origin §8.1 已校准**：第 5 例 4 token (`secret-deny-patterns.json` / `batch-owned files` / `expected_side_effects` / `--copy-env`) 全仓 grep 可定位 owner 真实存在（`src/cli/contracts/security/secret-deny-patterns.json` + `skills/spec-write-tasks/references/task-pack-schema.md` + `skills/spec-work-beta/references/codex-delegation-workflow.md` line 341-353 + `skills/git-worktree/SKILL.md`），不是 stale governance。问题是"ownership 文档化在邻近 skill 而非 spec-work 私有"，不是"治理已废弃"。
3. **U2 当前文案位置破坏 §Workflow Contract Summary 现有 H2+8H3 contract pattern**：当前分支新建的 §Workflow Contract Summary 段已含 8 个 H3 子段（When To Use / When Not To Use / Inputs / Outputs / Artifacts / Failure Modes / Workflow / Downstream Consumers），U2 加在 §Downstream Consumers 后、§Examples As Context 前会形成孤立 blockquote，既不属于任何 H3 子段也不构成新 H3。
4. **U4 Phase 0 blockquote 与现有 §Oversized intake and handoff + User-Facing Handoff Contract（line 125-147）冗余**：现有内容已覆盖 "task list 不是 task pack" + "复杂度越过阈值升级到 spec-plan / spec-write-tasks" 语义。

基于这 4 个发现，本 plan 第二轮 deepening 后的 scope 修订为：

- **fix-1**（now，独立 commit 并入当前 GitNexus 分支）：U4-Phase2-only。Phase 2 子步骤重新编号 1-7。零风险、零认知漂移机械修复，单 commit ~5min。
- **fix-2**（defer，等当前 GitNexus 演进合并到 master 后启动）：U8（U2+U7 合并的 `### Execution Boundary` H3 子段，3-6 行 prose）+ U1-revised（保留第 5 例 + 改 source_note 指向 owner refs，即 origin Decision #1 选项 C）。砍掉 U4-Phase0-blockquote（与现有内容冗余）。与 plan 自己推荐的 batch review 一起，作为 follow-up plan 启动条件。
- **Phase B**（原 U3 / U5 / U6）保持 defer 不变。

**Execution authority**：本 plan 的下游执行依据是 origin 报告 §0 Current Decision + §1 yaml `summary.minimum_viable_fix_set_ref` + §8 v1 校准吸收 + 2026-05-24 第二轮 deepening 修订。origin 报告 §2-§7 / §6 minimum viable fix set 只作为 historical diagnostics 与对抗风险来源，不得覆盖本 plan 的 fix-1 / fix-2 scope。

修复目标的重新对齐：

- **fix-1 目标**：消除 Phase 2 子步骤编号重复，不引入任何治理边界变更
- **fix-2 目标**：保留 origin §8.1 owner mapping 真相（第 5 例 owner 真实存在）+ 提供 spec-work 自身边界声明（合并 U2+U7 避免孤立 blockquote）+ 避免与现有 §Oversized intake and handoff 冗余

评分变化（fresh review）作为修复方向是否正确的诊断信号，**不作为 merge 条件**（origin §0.2 评分路径已降级为 advisory anecdote）。

---

## Problem Frame

`skills/spec-work/SKILL.md`（515 行）+ `evals/examples.json`（5 例）+ `references/`（2 文件）在第二轮 deepening 深读后，发现真实质量问题有以下几类：

1. **Phase 2 子步骤编号重复**：master 历史遗留问题（master `git show main:skills/spec-work/SKILL.md` Phase 2 段同样含两个 `6.`），当前分支 GitNexus 接入演进未触碰；当前 line 452 与 line 461 同为 `6.`；fresh-source eval 加载 Phase 2 段时读到两个 step 6 会误判 step ordering
2. **§Workflow Contract Summary 缺自身执行边界声明**：当前分支新建的 §Workflow Contract Summary 已有 8 个 H3 子段刻画"我做什么 / 我消费什么 / 我产出什么 / 我何时失败"，但缺少"scripts/tools vs LLM 分工 + spec-work 不维护 staging/security engine 自指否定"的边界声明 H3 子段；fresh-source eval 可能误判 spec-work 缺失 high-risk boundary governance
3. **examples.json 第 5 例 ownership 文档化在邻近 skill**：origin §8.1 已校准——第 5 例 4 token 全仓 grep 可定位 owner（`secret-deny-patterns.json` 在 `src/cli/contracts/security/`；`expected_side_effects` 在 `skills/spec-write-tasks/references/task-pack-schema.md`；`batch-owned files` + delegation staging 在 `spec-work-beta/references/codex-delegation-workflow.md`；`--copy-env` 在 `git-worktree/SKILL.md`），不是 stale governance；问题是 fresh-source eval 只看 spec-work 本 skill 时找不到 owner anchor，会产生误报

不在本 plan 范围（基于第二轮 deepening 校准）：

- **U4 Phase 0 blockquote**：与现有 §Oversized intake and handoff（line 125-147）+ User-Facing Handoff Contract 冗余，**砍掉**
- **U1 删第 5 例**：撤回当前分支 commit 8f294258 自己工作 + 否定 origin §8.1 owner 真实性校准，**改为 U1-revised：保留 + 改 source_note 指向 owner refs**
- **U2 自指否定 blockquote 单独成段**：会成为孤立 blockquote 破坏 H2+8H3 contract pattern，**合并入 U8**
- **U3 / U5 / U6（Phase B）**：保持 defer
- **跨 5 核心 skill batch review**：仍是 follow-up plan
- **spec-work-beta / spec-write-tasks / git-worktree owner 文档化主动同步**：跨 skill 治理问题，重路由到 spec-skill-audit batch

---

## Scope Boundaries

### In Scope - fix-1（ship-now）

- `skills/spec-work/SKILL.md`：Phase 2 子步骤重新编号（一处机械修改：第二个 `6.` → `7.`）
- CHANGELOG 同步（`fix(spec-work): renumber Phase 2 Track Progress step`）
- 双宿主 runtime regenerate（`spec-first init --claude` + `spec-first init --codex`）

### In Scope - fix-2（deferred until GitNexus 演进合并）

- `skills/spec-work/SKILL.md`：§Workflow Contract Summary 末尾追加 `### Execution Boundary` H3 子段（3-6 行 prose，合并 U2 自指否定 + U7 light-boundary）
- `skills/spec-work/evals/examples.json`：第 5 例保留，改写 `source_note` 字段指向 owner refs（按 owner mapping 表）
- CHANGELOG 同步
- 双宿主 runtime regenerate
- （deferred follow-up，不阻塞 merge）fresh review 作为修复方向诊断信号
- （deferred follow-up）batch review 启动 spec-plan / spec-debug / spec-code-review / spec-write-tasks / spec-compound

### Deferred to Phase B（保持 defer，不在本 plan）

- **U3** Key Principles 整体治理 + §Cache-Friendly Context Layout 改名为 `Context Handoff Layout`（保留 Cache-Friendly 段内 handoff 指令不删除、不迁移到 docs/contracts/skill-design-principles.md）
- **U5** description 改写
- **U6** 拆 references/

### Outside this Plan's Identity

- 修改 spec-work-beta / spec-write-tasks / git-worktree 主动加 owner anchor（重路由到 spec-skill-audit batch）
- 新建 `docs/contracts/skill-design-principles.md` 或迁移 Cache-Friendly 内容（origin §8.4 已否决）
- 撤回当前分支 commit 8f294258 的工作（第 5 例保留）
- 加 Phase 0 blockquote（与现有内容冗余）
- spec-work-beta 等邻近 skill 修改（origin Decision #1 选项 B 已确认不推荐：BETA-edge skill 不接管 stable production 边界 example）
- `审查agent.md` 同步 Step 1.5 改进（meta-review，独立 plan）
- spec-skill-audit batch 跑 tracker-defer ownership 评估（P2-006 重路由 destination）

---

## Key Technical Decisions

### Decision #1（第二轮 deepening 修订）：examples.json 第 5 例处理路径 — **保留 + 改 source_note 指向 owner refs**

**Question**：origin §0.1 提出删除 / 迁移 / 保留+canonical refs 三选一；第一轮 deepening 默认选 A（删除）。第二轮 deepening 深读后，是否应改为 C（保留 + canonical refs）？

**Recommended answer**：**C. 保留 + 改写 source_note 为 owner refs**。

**修订理由**：
- 第 5 例由当前分支 commit `8f294258 fix(review): harden skill agent governance` 引入，commit 标题就是"收紧 skill agent 治理"；删除等于撤回当前分支自己的工作
- origin §8.1 已校准：4 token 在全仓 grep 真实可定位（`src/cli/contracts/security/secret-deny-patterns.json` + 邻近 skill source），**不是 stale governance**
- 真实问题是"fresh-source eval 只看 spec-work 本 skill 时找不到 owner anchor"，解决方法应该是把 owner refs 直接写进 source_note 字段，而不是删除示例
- 删除会让 examples.json 从 5 例缩为 4 例（命中 contract test `min length 4` 下沿，没有 buffer 应对未来再删一例）；保留 + 改 source_note 不触发下沿压力

**Options 与 verdict**：
- **A. 删除该例**（第一轮 deepening 推荐，第二轮否决）：撤回 commit 8f294258 自己工作 + 触发 contract test 下沿压力
- **B. 迁移到 spec-work-beta**（origin Decision #1 已 rejected）：BETA-edge skill 不接管 stable production 边界 example；4 token 横跨 3 owner 强迫单一接管立刻违反 §6.4 反例 #2
- **C. 保留 + 改 source_note**（**第二轮推荐**）：尊重 owner 真实性 + 不撤回当前分支工作 + 给 fresh-source eval 提供 owner anchor + contract test 下沿不触发

**Source tag**：`advisory`（基于 origin §8.1 owner mapping 校准 + 第二轮深读 commit 8f294258 引入语境）

**Consequence**：examples.json 仍 5 例，第 5 例其他字段不变；`source_note` 从 `"known failure mode: high-risk execution boundary from skill-agent quality governance plan"` 改写为含 4 类 owner token 的 owner refs 路径描述（详见 U1-revised Approach）；fresh-source eval 加载时直接看到 owner anchor；contract test `min length 4` 下沿不触发；U1-revised 实现是改 source_note，不是删例

### Decision #2：Key Principles 保留哪段？（**Phase B，本 plan 不执行**）

**Phase B 决策**：Decision #2 与 U3 整体 defer 到 Phase B。fix-1 / fix-2 都不修改 Key Principles。

理由：对抗审查 AF-005 发现保留 'Start Fast' 1 段后 Key Principles 节呈"H2 + 孤立 1 段 + Common Pitfalls"怪结构，LLM 反而忽略 Start Fast 语义权重。Phase B 与 batch review 一起处理 Key Principles 节整体设计。

### Decision #3：references 拆分粒度？（**Phase B，本 plan 不执行**）

**Phase B 决策**：U6 整体 defer。fix-1 / fix-2 都不拆 references。

理由：对抗审查 AF-001 发现 line 号会被 U2/U4 漂移；feasibility F-001 发现 U6 修改范围未覆盖 shared-directory fallback 区段；product F-004 发现 happy-path LLM 是否主动 read references 未验证。Codex 0.132.0 仅证明 skill-level progressive disclosure，不证明 `references/` happy-path 自动加载。

### Decision #4：description 是否改写？（**Phase B，本 plan 不执行**）

**Phase B 决策**：U5 整体 defer。fix-1 / fix-2 都不改 description。

理由：对抗审查 OS-003 发现 12 词版仍不能区分 spec-debug 的 settled scope；12 词版还与 SKILL.md line 19 当前文案不一致。Phase B 与 batch review 一起统一 description 模板，跨 5 核心 skill 对齐。

### Decision #5（第二轮 deepening 修订）：**fix-1 ship-now + fix-2 deferred** 拆分原则

**Question**：第二轮 deepening 深读后，整个 Phase A 是否应继续按 4 unit 一次性 ship？

**Recommended answer**：**拆分为 fix-1（机械修复 ship-now）+ fix-2（边界声明 deferred until GitNexus 演进合并后）**。

**修订理由**：
- 当前分支 leo-2026-05-21-gitnexus 已修改 spec-work/SKILL.md 152 行（GitNexus 大规模演进 + skill-agent-governance commit 8f294258 同期落地）；`skills/spec-work/evals/examples.json` 也是当前分支新建的
- fix-1（U4 Phase 2 编号修正）与 GitNexus 演进语义无关（Phase 2 子步骤段当前分支未改）；可作为独立机械修复 commit 顺手并入当前分支，零认知漂移
- fix-2（U8 = U2+U7 合并的 H3 子段 + U1-revised）在当前分支自己刚建立的 §Workflow Contract Summary + 自己刚加的 examples.json 上叠加修订；如果在 GitNexus 演进未合并的窗口做，会让 reviewer 在审 GitNexus 接入的同时还要 disambiguate "哪部分是 GitNexus 演进、哪部分是 fix-2 polish"
- 等 GitNexus 演进合并到 master 后启动 fix-2，时间机会成本 ~几天，但 reviewer 认知负担显著降低

**Source tag**：`user`（用户在 2026-05-24 第二轮 deepening 选择方案 A：fix-1 ship-now + fix-2 deferred）

**Consequence**：
- fix-1 立即可做（独立 commit，~5min）
- fix-2 等当前 GitNexus 分支合并后启动（不阻塞当前分支推进）
- fresh review 仍不是 merge 条件
- U4-Phase0-blockquote 砍掉，因与现有 §Oversized intake and handoff 冗余
- opportunity cost 重新平衡：fix-1 解决无争议机械缺陷，fix-2 在 GitNexus 演进稳定后做边界声明叠加修订

### Decision #6（第二轮 deepening 新增）：U2 与 U7 合并策略

**Question**：U2 自指否定 blockquote + U7 light-boundary H3 段是分两个修改点还是合并？

**Recommended answer**：**合并为单个 `### Execution Boundary` H3 子段**，3-6 行 prose 同时包含两类声明。

**修订理由**：
- 当前 §Workflow Contract Summary 已建立 H2 + 8 H3 子段的 contract pattern（When To Use / When Not To Use / Inputs / Outputs / Artifacts / Failure Modes / Workflow / Downstream Consumers）；U2 单独成 blockquote 加在 §Downstream Consumers 与 §Examples As Context 之间会形成孤立 blockquote，既不属于任何 H3 也不构成新 H3，破坏 pattern
- U2 自指否定（不做什么）+ U7 分工声明（做什么 + 谁决策）语义互补，本就适合放在同一 H3 段内
- 合并后只新增 1 个 H3 子段（第 9 个），保持 contract pattern 一致；段内严格控制不含邻居 skill 名，避免触发 §6.4 反例 #1

**Source tag**：`advisory`（基于第二轮深读 §Workflow Contract Summary 当前结构）

**Consequence**：原 U2 + U7 合并为新 unit U8；fix-2 实际只有 2 unit（U8 + U1-revised），比第一轮 Phase A 的 4 unit 更紧凑；HF-3 修订（U2 不含邻居 skill 名）+ light-boundary 严格约束（U7 3-6 行）在合并后的 U8 中同时满足

---

## Implementation Units

### U4. Phase 2 子步骤编号修正（fix-1 ship-now，必修）

**Goal**：消除 Phase 2 子步骤编号重复（当前 line 452 与 line 461 同为 `6.`）

**Requirements**：origin §0.1 `P2-005-merged`（仅 Phase 2 编号部分）

**Dependencies**：无

**Files**（repo-relative）：
- `skills/spec-work/SKILL.md`（修改：Phase 2 子步骤 `Track Progress` 编号 `6.` → `7.`）

**Approach**：
- 当前 Phase 2 子步骤顺序：`1. Task Execution Loop / 2. Incremental Commits / 3. Follow Existing Patterns / 4. Test Continuously / 5. Simplify as You Go / 6. Figma Design Sync / 6. Track Progress`
- 用 anchor-text 定位 `**Track Progress**`（当前 line 461），把同行 `6. ` 改为 `7. `
- Phase 2 最终顺序：1-7 连续无重复
- **本 unit 不动 Phase 0 路由 + 不动 §Oversized intake and handoff**（第一轮 plan 提议的 Phase 0 blockquote 与现有内容冗余，按第二轮 deepening Decision #5 已砍掉）

**Patterns to follow**：仿 Phase 2 现有子步骤命名结构（`N. **Title**` 形式）；anchor-text 定位避免硬编码 line 号

**Test scenarios**：
- 正例：`grep -n "^7\. \*\*Track Progress\*\*" skills/spec-work/SKILL.md` 应命中 1 行
- 反例：Phase 2 段内不应有 2 个 `^6\. \*\*` 起始行（`awk '/^### Phase 2: Execute$/,/^### Phase 3-4/' skills/spec-work/SKILL.md | grep -c "^6\. \*\*"` 应输出 1）
- 反例：Phase 0 表格行数不变（`awk '/^### Phase 0/,/^### Phase 1/' skills/spec-work/SKILL.md | grep "^|" | wc -l` 应仍为 5）
- 反例（确认 Phase 0 未动）：Phase 0 表格后**不**新增 blockquote（`awk '/^### Phase 0/,/^3\. \*\*Oversized/' skills/spec-work/SKILL.md | grep -c "^> "` 应输出 0）

**Verification**：Phase 2 子步骤顺序读起来线性 1-7；Phase 0 routing 表格行数不变；§Oversized intake and handoff 子段未动

---

### U1-revised. examples.json 第 5 例改写 source_note 指向 owner refs（fix-2 deferred，必修）

**Goal**：消除 fresh-source eval 加载第 5 例时找不到 owner anchor 的误报路径；不撤回当前分支 commit 8f294258 自己工作

**Requirements**：origin §0.1 / §8.1 P1-002-revised（owner mapping 真相）；Decision #1 修订（选项 C）

**Dependencies**：无（不依赖 U8）

**Files**（repo-relative）：
- `skills/spec-work/evals/examples.json`（修改：第 5 例 `source_note` 字段改写）

**Approach**：
- 保留 examples 数组中第 5 个 object（`name`: "secrets and staging require high-risk boundary"，下标 4）
- 其余字段（`user_intent` / `expected_posture` / `boundary_note` / `negative_signal` / `context_snippets`）不变
- `source_note` 从当前的 `"known failure mode: high-risk execution boundary from skill-agent quality governance plan"` 改写为指向具体 owner refs，参考措辞：

  ```text
  "source_note": "ownership in adjacent skills and project contracts: secret-deny-patterns at src/cli/contracts/security/secret-deny-patterns.json; expected_side_effects in skills/spec-write-tasks/references/task-pack-schema.md; batch-owned files and delegation staging in skills/spec-work-beta/references/codex-delegation-workflow.md; --copy-env in skills/git-worktree/SKILL.md. spec-work consumes these contracts but does not own them."
  ```

- **关键约束**：`source_note` 不写 "owned by spec-work-beta / spec-write-tasks / git-worktree" 这种 owner 名字单独列表（避免邻居 skill rename 导致 anchor drift）；只用相对路径 + 自指否定语句"spec-work consumes ... does not own ..."
- 不修改 schema_version / skill / examples 数组其他元素

**Owner mapping**（origin §8.2 全仓 grep 真实校准）：

| Token | Owner 路径 | 用途 |
|---|---|---|
| `secret-deny-patterns.json` | `src/cli/contracts/security/secret-deny-patterns.json` | staging 前 deny patterns 应用 |
| `batch-owned files` | `skills/spec-work-beta/references/codex-delegation-workflow.md`（line 341/345/347） | batch-owned set + expected_side_effects staging check |
| `expected_side_effects` | `skills/spec-write-tasks/references/task-pack-schema.md` + `skills/spec-work-beta/references/codex-delegation-workflow.md` | task-pack quality/delegation field 定义 |
| `--copy-env` | `skills/git-worktree/SKILL.md`（line 12/22/28） | worktree env copy opt-in 与 staging deny |
| `thin high-risk contract` 总章 | `docs/contracts/workflows/skill-agent-quality-governance.md` | high-risk execution safety contract 总章 |

**审查报告校准**（origin §8.1）：v0 评估 "local bundle grep 0 命中" 是范围错误（只扫 `skills/spec-work/`）。全仓 grep（含 src/cli/contracts/ + 邻近 skill source）证明 owner 真实存在，**不是 governance 已废弃**——是 ownership 文档化在邻近 skill 而非 spec-work 私有。第二轮 deepening 进一步确认：示例本身由当前分支 commit 8f294258 引入，删除等于撤回当前分支工作；改 source_note 是更尊重 owner 真实性的修订路径。

**Test scenarios**：
- 正例：`jq '.examples | length' skills/spec-work/evals/examples.json` 应输出 5（不变）
- 正例：`jq -r '.examples[4].name' skills/spec-work/evals/examples.json` 应输出 `secrets and staging require high-risk boundary`
- 正例：`jq -r '.examples[4].source_note' skills/spec-work/evals/examples.json` 应包含 `src/cli/contracts/security/secret-deny-patterns.json` 字符串
- 正例：`jq -r '.examples[4].source_note' skills/spec-work/evals/examples.json` 应包含 `skills/spec-write-tasks/references/task-pack-schema.md` 字符串
- 正例：`jq -r '.examples[4].source_note' skills/spec-work/evals/examples.json` 应包含 `consumes` + `does not own` 自指否定语句
- 反例：`source_note` 字段**不**应含 owner skill 名字单独列表（如 "owned by spec-work-beta"）；`jq -r '.examples[4].source_note' skills/spec-work/evals/examples.json | grep -cE "owned by"` 应输出 0
- JSON 合法性：`python3 -m json.tool skills/spec-work/evals/examples.json > /dev/null` 应 exit 0
- contract 测试：`npm run test:jest -- tests/unit/prompt-examples-contracts.test.js --runInBand` 应通过

**Verification**：examples.json 仍 5 例；第 5 例其他字段不变；source_note 含可 grep 的 owner refs 路径 + 自指否定语句；fresh-source eval 加载第 5 例时可直接看到 owner anchor；contract test `min length 4` 下沿不触发

---

### U8. §Workflow Contract Summary 加 `### Execution Boundary` H3 子段（fix-2 deferred，必修）

**Goal**：补 §Workflow Contract Summary 末尾的 3-6 行 `### Execution Boundary` H3 子段，合并 U2 自指否定（不做什么）+ U7 light-boundary 分工声明（做什么 + 谁决策）；保持 H2+8H3 contract pattern 一致

**Requirements**：origin §0.1 must_fix `P1-001-light-boundary`（U7）+ HF-3 修订（U2 自指否定）；Decision #6（合并策略）

**Dependencies**：无（不依赖 U1-revised；位置稳定在 §Workflow Contract Summary 末尾）

**Files**（repo-relative）：
- `skills/spec-work/SKILL.md`（修改：在 `### Downstream Consumers` 子段之后、`## Examples As Context` 之前，新增 `### Execution Boundary` H3 子段）

**Approach**：

在 §Workflow Contract Summary 现有 8 个 H3 子段（When To Use / When Not To Use / Inputs / Outputs / Artifacts / Failure Modes / Workflow / Downstream Consumers）之后，作为第 9 个 H3 子段，新增 `### Execution Boundary`，参考措辞：

```markdown
### Execution Boundary

`spec-work` orchestrates execution; it does not own deterministic validators, staging policy, or security engine source.
Tools, CLI, and git provide task-pack validation, diff/branch facts, test results, secret deny patterns, and optional run artifact writes; high-risk execution contracts (staging, secret handling, side-effect declaration, env copy) come from the active plan, task pack, and project-source contracts.
The LLM decides scope fit, task ordering, review depth, handoff, and whether advisory evidence is sufficient to proceed.
```

**严格约束**：
- **3 行 prose，~70 词**，控制在 light-boundary 区间（含 U2 自指否定语义 + U7 分工声明语义，合并后比单独两段紧凑）
- **不含具体邻居 skill 名**（不写 spec-work-beta / spec-write-tasks / git-worktree）；只引 "active plan, task pack, and project-source contracts" 抽象层
- **不复制项目角色契约**（`docs/10-prompt/结构化项目角色契约.md`）；只声明 spec-work 自身边界
- **位置 H3 子标题**（`###`），作为 §Workflow Contract Summary 的第 9 个 H3 子段，与现有 8 段保持一致
- 不引入新 H2 anchor
- 自指否定（U2 语义）通过 `does not own ...` 表达；分工声明（U7 语义）通过 `Tools/CLI/git provide ... / The LLM decides ...` 表达；两类声明合并在同一段 prose 内

**Patterns to follow**：仿 §Workflow Contract Summary 现有 8 个 H3 子段的"标题 + 1-3 行 prose"结构；仿 `### When Not To Use` 的显式禁止语气 + 仿 `### Failure Modes` 的边界声明语气

**Test scenarios**：
- 段内检查先构造同一个非重叠 extractor：`U8_BLOCK="$(awk 'found && (/^### / || /^## /) && $0 !~ /^### Execution Boundary$/ { exit } /^### Execution Boundary$/ { found=1 } found { print }' skills/spec-work/SKILL.md)"`
- 正例：`printf '%s\n' "$U8_BLOCK" | grep -c "^### Execution Boundary$"` 应输出 1
- 正例：`printf '%s\n' "$U8_BLOCK" | grep -c "orchestrates execution"` 应输出 1（U7 分工声明开句）
- 正例：`printf '%s\n' "$U8_BLOCK" | grep -c "LLM decides"` 应输出 1（U7 LLM 职责）
- 正例：`printf '%s\n' "$U8_BLOCK" | grep -c "does not own"` 应输出 1（U2 自指否定语义）
- 正例：`printf '%s\n' "$U8_BLOCK" | grep -c "come from the active plan"` 应输出 1（高风险契约来源声明）
- 反例（cross-skill anchor drift 防护）：`printf '%s\n' "$U8_BLOCK" | grep -cE "spec-work-beta|spec-write-tasks|git-worktree"` 应输出 0（段内不含邻居 skill 名）
- 体积：H3 段 prose 不超过 6 行（`printf '%s\n' "$U8_BLOCK" | grep -cv "^$"` 输出应 ≤ 5，即标题 + 不超过 4 行非空内容）
- 不引入新 H2：`grep -c "^## " skills/spec-work/SKILL.md` 在修改前后应保持相同数（只新增 H3）
- §Examples As Context 仍紧随其后：`grep -n "^## Examples As Context" skills/spec-work/SKILL.md` 应命中 1 行
- §Downstream Consumers 在 §Execution Boundary 之前：line 顺序 `grep -n "^### Downstream Consumers\|^### Execution Boundary" skills/spec-work/SKILL.md` 前者 line 号 < 后者

**Verification**：
- 段标题 `### Execution Boundary` 出现在 `### Downstream Consumers` 子段之后、`## Examples As Context` 之前
- 段内容含 scripts/tools 与 LLM 分工声明 + spec-work 自身边界声明（U2 自指否定）+ high-risk 契约来源声明
- §Workflow Contract Summary 共 9 个 H3 子段
- 不引入新 H2 anchor
- 不含 25 行大段 / 不含邻居 skill 名 / 不复制角色契约
- §Examples As Context H2 段不受影响

---

## Sequencing

### fix-1（ship-now，并入当前 GitNexus 分支）

```
U4 (Phase 2 编号修正) [独立机械修复，无依赖，单 commit ~5min]
```

**推荐执行**：
- 单个 commit：`fix(spec-work): renumber Phase 2 Track Progress step from 6 to 7`
- CHANGELOG 同步追加
- 双宿主 runtime regenerate（`spec-first init --claude` + `spec-first init --codex`）
- 可与当前 GitNexus 分支其他工作并行 / 顺手处理

### fix-2（deferred，等当前 GitNexus 演进合并到 master 后启动）

```
U8 (§Workflow Contract Summary 加 ### Execution Boundary H3 子段) [无依赖]
  ↓
U1-revised (examples.json 第 5 例改写 source_note) [无依赖；不依赖 U8 位置]
```

**推荐执行顺序**：U8 → U1-revised（顺序可逆，但 U8 是 SKILL.md 内修改，U1-revised 是 examples.json 内修改，无 line 漂移依赖）

**fix-2 启动条件**：
- 当前 leo-2026-05-21-gitnexus 分支已合并到 master
- batch review 是否启动可以是后续 plan 决策；fix-2 不必绑死 batch review

**fix-2 工作量估算**：~15-25min
- U8：~10min（H3 段 3 行 prose + grep 验证）
- U1-revised：~5-10min（改 source_note + jq 验证 + contract test）
- 双宿主 init + doctor：~5min

### Phase B（保持 defer，不在本 plan）

```
[batch review on spec-plan / spec-debug / spec-code-review / spec-write-tasks / spec-compound]
  ↓
[统一治理 plan，含本 plan 的 U3 / U5 / U6 + batch review 发现的跨 skill 系统性 ownership 文档化缺失]
```

Phase B 前提：
- happy-path fresh-source eval 验证 LLM 实际加载 references 行为（决定 U6 是否还做）
- 5 核心 skill batch review 完成，提供跨 skill 统一 description 模板（决定 U5 12 词版是否够）
- Key Principles 节替代设计已评估（决定 U3 保留 / 删除 / 整合策略）

---

## Verification

### fix-1 verification

每个 unit 完成后：

1. 跑该 unit Test scenarios 节列出的 grep / awk 命令
2. 跑项目级验证：
   - `npm run typecheck`
   - `npm run lint:skill-entrypoints`
   - `npm run test:smoke`（涉及 init / doctor）

fix-1 所有 unit 完成后：

3. 双宿主 runtime regenerate：
   - `spec-first init --claude`（刷新 `.claude/spec-first/workflows/spec-work/`）
   - `spec-first init --codex`（刷新 `.agents/skills/spec-work/`）
   - `spec-first doctor --claude` + `spec-first doctor --codex` 验证 runtime 一致
4. CHANGELOG 同步追加（按 developer profile `leokuang` + zh）

### fix-2 verification

每个 unit 完成后：

1. 跑该 unit Test scenarios 节列出的 grep / jq / awk 命令
2. 跑项目级验证：
   - `npm run typecheck`
   - `npm run lint:skill-entrypoints`
   - `npm run test:smoke`
   - `npm run test:jest -- tests/unit/prompt-examples-contracts.test.js --runInBand`（验证 examples 数组结构）

fix-2 所有 unit 完成后：

3. 双宿主 runtime regenerate（同 fix-1）
4. CHANGELOG 同步追加
5. **Fresh review（advisory follow-up，不阻塞 merge）**：跑新版 `审查skill.md`（含 Step 1.5 grep verification）对修复后 spec-work 做 fresh review。**评分作为修复方向诊断信号，不作为 merge 条件**

---

## Rollback Procedure

### fix-1 rollback

- **U4 不回滚**：Phase 2 编号修正是零风险机械修复，不存在需要回滚的语义场景
- 全 fix-1 回滚（极端情况）：`git revert <commit>` + 重跑 `spec-first init --claude` + `spec-first init --codex` + CHANGELOG 追加 revert 记录；~5min

### fix-2 rollback

| 触发条件 | 回滚动作 |
|---|---|
| **user 主动请求回滚** + fresh review 后有具体证据诊断为 U8 H3 段触发反例（如基于 `U8_BLOCK` extractor 的 `grep -cE "spec-work-beta\|..."` 输出 > 0） | 回滚 U8 单元：删除 `### Execution Boundary` H3 段；U1-revised 不回滚 |
| **user 主动请求回滚** + 有具体证据诊断为 U1-revised source_note 改写仍触发 owner anchor drift | 回滚 U1-revised：source_note 恢复为原 `"known failure mode: high-risk execution boundary from skill-agent quality governance plan"`；U8 不回滚 |
| **user 主动请求回滚** + 有具体证据诊断为 U8 + U1-revised 互相干扰 | 同时回滚 U8 + U1-revised |
| 全 fix-2 回滚 | `git revert <commit>` + 重跑双宿主 init + CHANGELOG 追加 revert 记录 |

**回滚成本预估**：
- U8 单独回滚：~3min（单 commit revert + runtime regen）
- U1-revised 单独回滚：~3min（单 commit revert + runtime regen）
- U8 + U1-revised 回滚：~5min（2 commit revert + runtime regen）
- 全 fix-2 回滚：~8min（2 commit revert + 双宿主 runtime regen + CHANGELOG）

**Rollback 不需要 user 重新批准**：fix-1 / fix-2 修改都是 source-only 局部，无 contract / schema / runtime breaking。若 user 在 advisory 信号后选择回滚，plan owner 可直接执行。

---

## Risks

### 风险 1：U6 拆分质量不达预期（**Phase B，不在本 plan**）

Phase B 预期 risk；本 plan 不执行 U6。

### 风险 2：U3 删除 Key Principles 后 LLM ship-bias 校准失效（**Phase B，不在本 plan**）

Phase B 预期 risk；本 plan 不执行 U3。

### 风险 3：U1-revised source_note 改写仍可能被 fresh-source eval 误读

**Source**：第 5 例 source_note 改写后含 4 类 owner token 的 owner refs 路径；fresh-source eval 可能把路径当作 spec-work 私有依赖（而不是"消费但不拥有"的 contract refs）

**Mitigation**：
- source_note 改写文案明确使用 `spec-work consumes these contracts but does not own them` 自指否定语句
- 不写 owner skill 名字单独列表，只写相对路径
- 配合 U8 H3 子段的 `high-risk execution contracts ... come from the active plan, task pack, and project-source contracts` 抽象层声明，让 fresh-source eval 看到一致的"消费者"姿态
- 若 fresh review 后仍误判，Rollback Procedure 含 U1-revised 单独回滚路径

### 风险 4：双宿主 runtime regenerate 出现 drift

**Source**：fix-1 / fix-2 修改 source，runtime mirror 必须同步；若 `spec-first init --codex` 与 `--claude` 之间 drift，fresh review 可能在某一侧失败

**Mitigation**：Verification 步骤显式包含双宿主 init + doctor；若发现 drift，先 `spec-first doctor` 诊断再决定是否 `spec-first clean` 后重新 init。**init 失败路径**：若 `spec-first init --claude` 或 `--codex` exit ≠ 0，不继续另一侧 init，先排查 developer profile / 路径权限；两个 init 必须都 exit 0 后才执行 doctor 验证，否则不 merge

### 风险 5：fix-2 启动时机晚于预期（当前 GitNexus 分支合并被推迟）

**Source**：fix-2 启动条件是当前 leo-2026-05-21-gitnexus 合并到 master；若该分支合并被推迟，fix-2 启动时间漂移

**Mitigation**：fix-1（U4）不受影响，可独立进行；fix-2 推迟不影响 user 可见行为（spec-work 仍可正常执行，只是 fresh-source eval 误报路径未消除）；若 GitNexus 分支合并被推迟超过 2 周，重新评估是否打破 fix-2 deferral 单独提早执行；评估触发条件可以是 user 主动请求或 fresh review 实测有具体 user pain 信号

### 风险 6（origin AF-003 共识）：U8 H3 段仍可能反向触发 §6.4 反例 #1 轻量版

**Source**：origin §6.4 对抗反例 #1 警示 cross-skill anchor 风险；U8 合并 U2+U7 后段内 ~3 行 prose；HF-3 修订理论上消除该风险，但需运行时验证

**Mitigation**：
- U8 严格按文案执行：不写邻居 skill 名（spec-work-beta / spec-write-tasks / git-worktree），只用 `active plan, task pack, and project-source contracts` 抽象层
- Test scenarios 含基于 `U8_BLOCK` extractor 的反向 grep 验证（段内 0 邻居 skill 名命中）
- U1-revised source_note 同样不含邻居名字单独列表，避免双重 anchor drift 风险
- 若 fresh review 后仍触发反例，Rollback Procedure 提供单独回滚路径

### 风险 7：方案 A re-scope 后未触发 batch review

**Source**：plan 自己推荐 batch review ≥5x 杠杆；方案 A 把 fix-1 / fix-2 拆分后，batch review 仍不在本 plan ship-now scope

**Mitigation**：fix-2 完成后，立即评估 batch review 启动（在 fix-2 完成 closeout 阶段记录"是否启动 batch review"决策）；不强制本 plan 范围内做 batch review；batch review 启动作为 follow-up plan 处理

### 风险 8（第二轮 deepening 新增）：fix-1 单独并入当前 GitNexus 分支可能与已有 152 行修改产生 merge 摩擦

**Source**：当前分支 `skills/spec-work/SKILL.md` 已被改 152 行；fix-1 在 Phase 2 段做 1 处编号修改

**Mitigation**：
- Phase 2 子步骤段在当前分支 GitNexus 接入 diff 中**未被触碰**（已验证：`git diff main..HEAD -- skills/spec-work/SKILL.md | grep -E '^[+-]6\. \*\*(Track Progress|Figma Design Sync)'` 未命中）
- fix-1 修改面是 1 行（`6. **Track Progress**` → `7. **Track Progress**`），与现有修改不冲突
- 若实际执行时遇到 merge 摩擦（极低概率），按 Rollback Procedure 全 fix-1 回滚处理

---

## Open Questions

### Q1（resolved during 2026-05-24 第二轮 deepening）：Decision #1 选项最终确认

**Question**：U1 实际执行时，按删除（A）/ 迁移（B）/ 保留+canonical refs（C）？

**Resolved answer**：**C. 保留 + 改 source_note 指向 owner refs**。基于第二轮 deepening 深读后修订（详见 Decision #1）。work 阶段不再阻塞确认；若 user 在 U1-revised 执行前显式 override 选 A（删除），executor 才切换并触发 contract test 下沿压力评估；选项 B 仍 rejected（origin 已确认）

**Affect scope if changed**：若回 A，删除而非改 source_note，contract test 下沿压力触发；U8 不变

### Q2（保持 defer to Phase B）：Cache-Friendly Context Layout 改名落点

**Question**：Phase B 执行 U3 时，`Cache-Friendly Context Layout` 改名为 `Context Handoff Layout` 后是否需要同步调整邻近引用、目录或 reviewer prompt 示例？

**Resolve approach**：**defer to Phase B**（本 plan 不执行 U3）；Cache-Friendly 段内容已确认为 LLM handoff 指令，不删除、不迁移到 `docs/contracts/skill-design-principles.md`

### Q3（resolved during 2026-05-24 第二轮 deepening）：fix-1 / fix-2 拆分时机

**Question**：fix-1 与 fix-2 是否同时执行？还是 fix-2 等 GitNexus 分支合并后？

**Resolved answer**：**fix-1 ship-now + fix-2 deferred until GitNexus 分支合并到 master**。基于 Decision #5 修订；fix-2 启动条件不必绑死 batch review；若 GitNexus 分支合并被推迟超过 2 周，重新评估是否打破 fix-2 deferral

### Q4（保持 defer to Phase B 前置）：U6 happy-path fresh-source eval 验证设计

**Question**：Phase B 启动前，如何设计 happy-path fresh-source eval 验证 LLM 实际是否主动 read references？

**Resolve approach**：defer to Phase B 前置任务（本 plan 不解决）；可能路径见原 plan Q4 描述

### Q5（第二轮 deepening 新增）：U8 H3 段最终措辞验证

**Question**：U8 H3 段当前参考措辞（`orchestrates execution` / `does not own deterministic validators` / `come from the active plan, task pack, and project-source contracts` / `The LLM decides ...`）是否足够同时承载 U2 自指否定 + U7 light-boundary 两类语义？

**Resolve approach**：fix-2 执行时按参考措辞写入，跑 Test scenarios 全部正反例 grep；若反例命中（cross-skill 名 / 体积超限），调整措辞重跑；fresh review 后若 advisory 信号显示语义未承载，按 Rollback Procedure 处理或在 fix-2 closeout 阶段决定下一步

---

## Deferred to Implementation

- U8 H3 段最终 prose 措辞（在保留语义约束的前提下，可按可读性微调用词）
- U1-revised source_note 最终文本格式（在保留 4 类 owner token 的 owner refs 路径 + 自指否定语句的前提下，可调整句式与标点）
- fix-1 与 fix-2 的 CHANGELOG 条目最终格式（按当前 host developer profile `leokuang` + zh 与仓库格式生成）
- U4 anchor-text 定位的精确字符（以 work 阶段实际 source 状态为准）

---

## Test Expectation

- **U4**：4 个验证命令（grep + awk + 反例 + Phase 0 表格行数不变）
- **U1-revised**：8 个验证命令（jq length + 第 5 例 name + source_note 含 secret-deny owner refs + source_note 含 `spec-write-tasks` owner refs + 自指否定语句 + 反例 owner 名字单独列表 + JSON 合法 + contract test）
- **U8**：9 个验证点（共用 `U8_BLOCK` 非重叠 extractor：H3 标题 + 分工声明开句 + LLM 职责 + 自指否定 + 高风险契约来源 + 反例 cross-skill 名 + 体积上限 + 不引入新 H2 + §Examples As Context 紧随）

无新增 unit / integration / e2e test 文件——本 plan 修改的是 markdown skill source + JSON examples，验证主要靠 grep / jq / structural check + 双宿主 init + doctor + (advisory follow-up) fresh review

---

## Context & Research

**Origin**（见 origin: `docs/10-prompt/skill-reviews/2026-05-20-spec-work.md`）：

- §0 Current Decision（2026-05-21 §8 校准后，下游单一依据）：第 5 例 owner mapping 校准（§8.1）+ Phase 2 编号 + 评分路径降级
- §0.2 与 §2-§7 早期结论的冲突清单：明确 §8 校准覆盖范围
- §1 yaml `minimum_viable_fix_set`：P1-002-revised + P1-001-light-boundary + P2-008-dedupe-only + P2-005-merged
- §8 v1 校准吸收

**2026-05-22 第一轮 deepening calibration**（已被第二轮覆盖部分）：
- Phase A 4 unit（U4 / U1 / U2 / U7）拆分；Phase B 含 U3 / U5 / U6
- Decision #1 默认采用 A 删除路径
- U2 加在 §Workflow Contract Summary 末尾 blockquote
- U7 加 `### Execution Boundary` H3 子段
- U4 含 Phase 2 编号 + Phase 0 large 路由 blockquote

**2026-05-24 第二轮 deepening calibration**（本次重写覆盖第一轮）：

- **新发现 1**：`skills/spec-work/evals/examples.json` 是当前分支 commit `8f294258 fix(review): harden skill agent governance` 引入的，master 上不存在（`git cat-file -e main:skills/spec-work/evals/examples.json` 返回 `path exists on disk, but not in 'main'`）；第 5 例由该 commit 同时加入
- **新发现 2**：当前 `skills/spec-work/SKILL.md` §Workflow Contract Summary 段是当前分支新建的（master 上为 `## CRG Work Anchors`），含 8 个 H3 子段构成 contract pattern
- **新发现 3**：当前 SKILL.md Phase 0 line 125-147 已有 §Oversized intake and handoff + User-Facing Handoff Contract，覆盖了第一轮 plan 提议的 Phase 0 blockquote 语义
- **新发现 4**：当前分支已修改 `skills/spec-work/SKILL.md` 152 行（GitNexus 接入演进），fix-2 在演进未合并窗口执行会增加 reviewer 认知负担
- 校准结论：
  - Decision #1 从 A（删除）改为 C（保留 + 改 source_note）
  - Decision #5 从 Phase A 4 unit 改为 fix-1 / fix-2 拆分
  - 新增 Decision #6（U2+U7 合并为 U8）
  - U4 Phase 0 blockquote 砍掉（与现有内容冗余）
  - U2 + U7 合并为 U8
  - U1 → U1-revised（保留 + 改 source_note）

**Doc-review iteration**（本 plan 经 `spec-doc-review` 一次收敛 + 两轮 deepening 修订）：

- 第一轮（2026-05-22 doc-review）：spec-feasibility / spec-adversarial-document / spec-product-lens 三 reviewer 收敛到 Phase A/B
- 第二轮（2026-05-24 自我 deepening 深读最新 source）：基于 4 个新发现修订 scope，从 Phase A 4 unit 改为 fix-1 / fix-2 两段结构；本次重写吸收第二轮全部结论

**Roadmap anchor**：no direct roadmap anchor；classified as ongoing skill governance cleanup with M-stage support for fresh-source eval automation pipeline（M5）

---

## Graph Readiness

- target_repo: spec-first（单仓 plan）
- status: stale
- source_revision: 314115815864544f749030d23fa78a6f87a80c19
- current_revision: ccab16be（HEAD as of 2026-05-24 第二轮 deepening 重写时）
- stale: true
- primary_providers: code-review-graph, gitnexus（artifact shows query_ready=true for the recorded snapshot）
- degraded_providers: []
- fallback_capabilities: bounded direct source reads, current grep/source inspection, focused prompt examples contract test
- runtime_mcp_evidence: not used；this plan is docs/skill-source prose calibration and direct source reads are sufficient
- confidence: high for plan feasibility via current source reads；low for graph-backed impact claims
- limitations: compiled graph facts were generated for an older source revision and dirty worktree hash；do not use them as primary evidence for this plan；第二轮 deepening 主要依赖直接 source reads + git log + git show 对比

---

## Downstream Handoff

本 plan 完成后：

### fix-1 ship-now handoff

1. **work**：使用当前 host 的 work entrypoint 执行 fix-1 单 unit（U4）；Codex 入口是 `spec-work`；Claude 兼容入口是 `spec-work`
2. **commit**：独立 commit `fix(spec-work): renumber Phase 2 Track Progress step from 6 to 7` 并入当前 leo-2026-05-21-gitnexus 分支
3. **CHANGELOG**：同步追加 fix-1 条目（按 developer profile `leokuang` + zh）
4. **双宿主 runtime regenerate**：`spec-first init --claude` + `spec-first init --codex` + `spec-first doctor --claude` + `spec-first doctor --codex`

### fix-2 deferred handoff（等 GitNexus 分支合并后）

1. **trigger**：当前 leo-2026-05-21-gitnexus 分支合并到 master 后启动；若被推迟 > 2 周，重新评估是否打破 deferral
2. **work**：使用当前 host 的 work entrypoint 执行 fix-2 两 unit（U8 + U1-revised）
3. **review (advisory)**：fix-2 完成后用当前 host 的 code-review entrypoint 做修复 diff review（可选；Codex 为 `spec-code-review`，Claude 为 `spec-code-review`）
4. **fresh review (advisory follow-up)**：跑新版 `审查skill.md`（含 Step 1.5）对修复后 spec-work 做 fresh review；**评分作为修复方向诊断信号，不作为 merge 条件**
5. **batch review 启动决策**：fix-2 完成 closeout 阶段评估是否启动 batch review（spec-plan / spec-debug / spec-code-review / spec-write-tasks / spec-compound）

### Phase B 启动（保持 defer，不在本 plan）

基于 fix-2 fresh review 落点 + batch review 优先级，新开 plan 涵盖：
- batch 跑 `审查skill.md` 对 5 核心 skill
- 综合 batch findings + 本 plan U3 / U5 / U6 进入统一治理 plan

---

## Plan Sign-off

- [x] 第二轮 deepening（2026-05-24）深读最新 source 完成
- [x] Decision #1 修订：选项 C（保留 + 改 source_note）
- [x] Decision #5 修订：fix-1 ship-now + fix-2 deferred 拆分
- [x] Decision #6 新增：U2 + U7 合并为 U8
- [x] U4 Phase 0 blockquote 砍掉（与现有 §Oversized intake and handoff 冗余）
- [x] User 确认方案 A（2026-05-24 第二轮 deepening 选择）
- [ ] fix-1 进入当前 host work entrypoint 执行（U4）
- [ ] fix-1 commit 并入 leo-2026-05-21-gitnexus 分支
- [ ] GitNexus 分支合并到 master
- [ ] fix-2 启动（U8 + U1-revised）
- [ ] fix-2 fresh review 验证修复方向（advisory，不阻塞 merge）
- [ ] Phase B 启动决策（新 plan，不在本 plan scope）
